const observation = require('./jefe-observability-contract.cjs')

class ObservabilityOrchestrationError extends Error { constructor(code, message, details = {}) { super(message); this.name = 'ObservabilityOrchestrationError'; this.code = code; this.details = details } }
function fail(code, message, details = {}) { throw new ObservabilityOrchestrationError(code, message, details) }

function createObservabilityOrchestrator({ persistence, clock = () => new Date().toISOString(), releaseHealth = null } = {}) {
  if (!persistence) fail('OBSERVABILITY_PERSISTENCE_REQUIRED', 'Durable observability persistence is required.')
  async function recordEvent(event) { observation.validateObservationEvent(event); if (event.causationId && !(await persistence.readEvent(event.causationId))) fail('CAUSATION_TARGET_MISSING', 'Event causationId must reference a durable event.'); return persistence.appendEvent(event) }
  async function deriveAndPersistIncidents({ healthSnapshot = null } = {}) {
    const events = (await persistence.listEvents()).records
    const incidents = observation.deriveIncidents({ events, healthSnapshot })
    const results = []
    for (const incident of incidents) results.push(await persistence.saveIncident(incident))
    return { incidents, results, created: results.filter((item) => !item.idempotent).length }
  }
  async function recordHealthSnapshot({ historicalCanary = null, signals = [], evidenceRefs = [], releaseHealth: suppliedReleaseHealth = null } = {}) {
    const health = suppliedReleaseHealth || (typeof releaseHealth === 'function' ? await releaseHealth() : releaseHealth)
    const snapshot = observation.buildHealthSnapshot({ observedAt: clock(), releaseHealth: health, historicalCanary, signals, evidenceRefs })
    return persistence.saveSnapshot(snapshot)
  }
  async function buildOperationSummary({ evidenceRefs = [] } = {}) {
    const health = await persistence.latestHealth()
    const incidents = (await persistence.scanDetailed()).incidents
    return persistence.saveSummary(observation.summarizeOperation({ observedAt: clock(), healthSnapshot: health, incidents, evidenceRefs }))
  }
  async function rebuildIndexes() { return persistence.rebuildIndex() }
  return Object.freeze({ recordEvent, deriveAndPersistIncidents, recordHealthSnapshot, buildOperationSummary, rebuildIndexes })
}

module.exports = { ObservabilityOrchestrationError, createObservabilityOrchestrator }
