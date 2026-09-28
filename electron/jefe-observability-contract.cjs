const crypto = require('node:crypto')

const OBSERVATION_EVENT_SCHEMA = 'jefe-observation-event/v1'
const HEALTH_SNAPSHOT_SCHEMA = 'jefe-health-snapshot/v1'
const SIGNAL_SCHEMA = 'jefe-observability-signal/v1'
const INCIDENT_SCHEMA = 'jefe-operational-incident/v1'
const OPERATION_SUMMARY_SCHEMA = 'jefe-operation-summary/v1'
const EVENT_TYPES = Object.freeze([
  'release.request.prepared', 'release.flow.state_changed', 'release.authorization.created',
  'release.outbox.created', 'release.execution.started', 'release.execution.succeeded',
  'release.execution.failed', 'release.execution.uncertain', 'release.ci.evidence_ingested',
  'release.recovery.completed', 'repository.baseline_changed', 'repository.remote_ref_observed',
  'human.approval.recorded', 'operation.incident.derived'
])
const SOURCES = Object.freeze(['jefe', 'git', 'github-actions', 'recovery', 'operator', 'test-fixture'])
const SEVERITIES = Object.freeze(['info', 'warning', 'critical'])
const OUTCOMES = Object.freeze(['observed', 'succeeded', 'failed', 'blocked', 'unknown'])
const INCIDENT_CATEGORIES = Object.freeze(['repository_baseline_changed', 'delivery_integrity_mismatch', 'execution_uncertain', 'remote_ref_diverged', 'ci_failed', 'ci_unavailable', 'corrupt_record', 'authorization_missing', 'authorization_mismatch', 'observation_gap'])
const INCIDENT_STATUSES = Object.freeze(['open', 'acknowledged', 'resolved', 'suppressed'])
const HEALTH_STATES = Object.freeze(['healthy', 'degraded', 'blocked', 'unknown'])
const READINESS_STATES = Object.freeze(['ready', 'blocked', 'unknown'])
const QUALITY_STATES = Object.freeze(['passing', 'degraded', 'failing', 'unknown'])

class ObservabilityContractError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ObservabilityContractError'; this.code = code; this.details = details }
}
function fail(code, message, details = {}) { throw new ObservabilityContractError(code, message, details) }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (!value || typeof value !== 'object') return JSON.stringify(value); return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function text(value, field, max = 300, optional = false) { if (optional && (value === null || value === undefined)) return null; if (typeof value !== 'string' || !value.trim() || value.length > max) fail('OBSERVABILITY_CONTRACT_INVALID', `${field} is invalid.`); return value.trim() }
function timestamp(value, field) { const result = text(value, field, 80); if (Number.isNaN(Date.parse(result))) fail('OBSERVABILITY_CONTRACT_INVALID', `${field} must be an ISO timestamp.`); return result }
function safeId(value, field, optional = false) { if (optional && (value === null || value === undefined)) return null; const result = text(value, field, 180); if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,50}$/u.test(result)) fail('OBSERVABILITY_CONTRACT_INVALID', `${field} is invalid.`); return result }
function sanitize(value, depth = 0) {
  if (depth > 5) return '[redacted-depth]'
  if (typeof value === 'string') return value.replace(/(token|password|secret|api[_-]?key|authorization|credential|pat)[^\s:=]*\s*[:=]\s*[^\s]+/giu, '$1=[redacted]').replace(/[A-Za-z]:\\[^\s]+|\/(?:[^\s/]+\/)+[^\s]*/gu, '[path-redacted]').slice(0, 500)
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1))
  if (value && typeof value === 'object') return Object.keys(value).slice(0, 50).reduce((out, key) => { if (!/(token|password|secret|api[_-]?key|authorization|credential)/iu.test(key)) out[key] = sanitize(value[key], depth + 1); return out }, {})
  return value
}
function evidenceRefs(values = [], field = 'evidenceRefs') { if (!Array.isArray(values)) fail('OBSERVABILITY_CONTRACT_INVALID', `${field} must be an array.`); return [...new Set(values.map((value) => text(value, `${field}[]`, 300)))].sort() }
function source(value) { if (!value || typeof value !== 'object' || !SOURCES.includes(value.kind)) fail('OBSERVABILITY_TRUSTED_SOURCE_REQUIRED', 'Observation source is not trusted.'); return { kind: value.kind, sourceId: safeId(value.sourceId || `${value.kind}-source`, 'source.sourceId') } }
function createObservationEvent({ eventType, occurredAt, source: eventSource, severity = 'info', outcome = 'observed', correlationId, causationId = null, evidenceRefs: refs = [], subject = {}, attributes = {} } = {}, shouldValidate = true) {
  if (!EVENT_TYPES.includes(eventType)) fail('OBSERVABILITY_CONTRACT_INVALID', 'eventType is not in the closed taxonomy.')
  if (!SEVERITIES.includes(severity) || !OUTCOMES.includes(outcome)) fail('OBSERVABILITY_CONTRACT_INVALID', 'severity or outcome is invalid.')
  const normalizedSubject = { projectId: safeId(subject.projectId, 'subject.projectId', true), releaseFlowId: safeId(subject.releaseFlowId, 'subject.releaseFlowId', true), requestId: safeId(subject.requestId, 'subject.requestId', true) }
  const normalizedRefs = evidenceRefs(refs)
  const event = { schemaVersion: OBSERVATION_EVENT_SCHEMA, eventId: `observation-event-${digest({ eventType, occurredAt, correlationId, causationId, subject: normalizedSubject, evidenceRefs: normalizedRefs }).slice(0, 24)}`, eventType, occurredAt: timestamp(occurredAt, 'occurredAt'), source: source(eventSource), severity, outcome, correlationId: safeId(correlationId, 'correlationId'), causationId: safeId(causationId, 'causationId', true), subject: normalizedSubject, evidenceRefs: normalizedRefs, attributes: sanitize(attributes) }
  return shouldValidate ? validateObservationEvent(event) : event
}
function validateObservationEvent(event) {
  if (!event || event.schemaVersion !== OBSERVATION_EVENT_SCHEMA) fail('OBSERVABILITY_CONTRACT_INVALID', 'Observation event schema is invalid.')
  const normalized = createObservationEvent(event, false)
  if (canonical(normalized) !== canonical(event)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Observation event normalization mismatch.')
  return event
}
function createSignal({ signalId, name, status = 'unknown', value = null, unit = null, evidenceRefs: refs = [], observedAt, source: signalSource = { kind: 'jefe' } } = {}) {
  if (!['healthy', 'degraded', 'blocked', 'unknown'].includes(status)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Signal status is invalid.')
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) fail('OBSERVABILITY_NO_FAKE_METRICS', 'Signal values must be finite measured values.')
  if (value !== null && !refs.length) fail('OBSERVABILITY_NO_FAKE_METRICS', 'Measured signal values require evidence references.')
  const result = { schemaVersion: SIGNAL_SCHEMA, signalId: safeId(signalId, 'signalId'), name: text(name, 'name', 160), status, value, unit: unit === null ? null : text(unit, 'unit', 40), evidenceRefs: evidenceRefs(refs), observedAt: timestamp(observedAt, 'observedAt'), source: source(signalSource) }
  return result
}
function validateSignal(signal) {
  if (!signal || signal.schemaVersion !== SIGNAL_SCHEMA) fail('OBSERVABILITY_CONTRACT_INVALID', 'Signal schema is invalid.')
  const normalized = createSignal(signal)
  if (canonical(normalized) !== canonical(signal)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Signal normalization mismatch.')
  return signal
}
function createOperationalIncident({ category, severity = 'warning', status = 'open', firstSeen, lastSeen = firstSeen, correlationId, evidenceRefs: refs = [], sourceEventIds = [], summary, resolution = null } = {}) {
  if (!INCIDENT_CATEGORIES.includes(category) || !SEVERITIES.includes(severity) || !INCIDENT_STATUSES.includes(status)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Incident category, severity or status is invalid.')
  const normalized = { schemaVersion: INCIDENT_SCHEMA, incidentId: `operational-incident-${digest({ category, correlationId, evidenceRefs: refs }).slice(0, 24)}`, category, severity, status, firstSeen: timestamp(firstSeen, 'firstSeen'), lastSeen: timestamp(lastSeen, 'lastSeen'), dedupKey: digest({ category, correlationId, evidenceRefs: evidenceRefs(refs) }), correlationId: safeId(correlationId, 'correlationId', true), evidenceRefs: evidenceRefs(refs), sourceEventIds: evidenceRefs(sourceEventIds, 'sourceEventIds'), summary: text(summary, 'summary', 500), resolution: resolution ? sanitize(resolution) : null }
  return normalized
}
function validateOperationalIncident(incident) {
  if (!incident || incident.schemaVersion !== INCIDENT_SCHEMA) fail('OBSERVABILITY_CONTRACT_INVALID', 'Incident schema is invalid.')
  if (!INCIDENT_CATEGORIES.includes(incident.category) || !SEVERITIES.includes(incident.severity) || !INCIDENT_STATUSES.includes(incident.status)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Incident fields are invalid.')
  return incident
}
function validateHealthSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== HEALTH_SNAPSHOT_SCHEMA || !HEALTH_STATES.includes(snapshot.health.status) || !READINESS_STATES.includes(snapshot.readiness.status) || !QUALITY_STATES.includes(snapshot.quality.status)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health snapshot is invalid.')
  if (snapshot.productionReady !== false && snapshot.productionReady !== true) fail('OBSERVABILITY_CONTRACT_INVALID', 'productionReady must be boolean.')
  return snapshot
}
function buildHealthSnapshot({ observedAt, releaseHealth = null, historicalCanary = null, signals = [], evidenceRefs: refs = [] } = {}) {
  const canary = historicalCanary || {}
  const hasReleaseHealth = releaseHealth && typeof releaseHealth === 'object'
  const healthStatus = canary.state === 'CONSISTENT_TERMINAL' || hasReleaseHealth ? (releaseHealth?.uncertainExecutions > 0 || releaseHealth?.corruptions > 0 ? 'degraded' : 'healthy') : 'unknown'
  const ciFailed = canary.remoteCiStatus === 'failed' || releaseHealth?.failedCi > 0
  const readinessStatus = ciFailed || releaseHealth?.blockedFlows > 0 ? 'blocked' : hasReleaseHealth ? 'ready' : 'unknown'
  const qualityStatus = ciFailed ? 'failing' : canary.remoteCiStatus === 'unavailable' ? 'unknown' : canary.remoteCiStatus === 'passed' ? 'passing' : 'unknown'
  const result = { schemaVersion: HEALTH_SNAPSHOT_SCHEMA, snapshotId: `health-snapshot-${digest({ observedAt, releaseHealth, historicalCanary, signals, evidenceRefs: refs }).slice(0, 24)}`, observedAt: timestamp(observedAt, 'observedAt'), health: { status: healthStatus, operational: healthStatus === 'healthy', evidenceRefs: evidenceRefs(refs) }, readiness: { status: readinessStatus, evidenceRefs: evidenceRefs(refs) }, quality: { status: qualityStatus, evidenceRefs: evidenceRefs(refs) }, signals: signals.map((signal) => createSignal(signal)), productionReady: false, limitations: sanitize({ historicalLintErrors: canary.historicalLintErrors || null, reason: ciFailed ? 'remote-ci-failed' : null }) }
  return validateHealthSnapshot(result)
}
function deriveIncidents({ events = [], healthSnapshot = null } = {}) {
  const incidents = new Map()
  for (const event of events.map(validateObservationEvent)) {
    if (event.eventType === 'human.approval.recorded') continue
    const map = { 'repository.baseline_changed': ['repository_baseline_changed', 'warning', 'Repository baseline changed.'], 'release.execution.uncertain': ['execution_uncertain', 'critical', 'Execution outcome cannot be demonstrated.'], 'release.ci.evidence_ingested': event.outcome === 'failed' ? ['ci_failed', 'warning', 'Remote CI evidence reports failure.'] : null }
    const candidate = map[event.eventType]
    if (!candidate) continue
    const [category, severity, summary] = candidate
    const incident = createOperationalIncident({ category, severity, firstSeen: event.occurredAt, lastSeen: event.occurredAt, correlationId: event.correlationId, evidenceRefs: event.evidenceRefs, sourceEventIds: [event.eventId], summary })
    incidents.set(incident.dedupKey, incident)
  }
  if (healthSnapshot?.readiness?.status === 'blocked' && healthSnapshot.quality?.status === 'unknown') { const incident = createOperationalIncident({ category: 'observation_gap', severity: 'warning', firstSeen: healthSnapshot.observedAt, correlationId: 'health-snapshot', evidenceRefs: healthSnapshot.readiness.evidenceRefs, summary: 'Readiness is blocked without sufficient quality evidence.' }); incidents.set(incident.dedupKey, incident) }
  if (healthSnapshot?.quality?.status === 'failing' && ![...incidents.values()].some((item) => item.category === 'ci_failed')) { const incident = createOperationalIncident({ category: 'ci_failed', severity: 'warning', firstSeen: healthSnapshot.observedAt, correlationId: 'health-snapshot', evidenceRefs: healthSnapshot.quality.evidenceRefs, summary: 'Health snapshot records failed remote CI.' }); incidents.set(incident.dedupKey, incident) }
  return [...incidents.values()].sort((a, b) => a.incidentId.localeCompare(b.incidentId))
}
function summarizeOperation({ observedAt, healthSnapshot, incidents = [], evidenceRefs: refs = [] } = {}) {
  validateHealthSnapshot(healthSnapshot)
  return { schemaVersion: OPERATION_SUMMARY_SCHEMA, summaryId: `operation-summary-${digest({ observedAt, snapshotId: healthSnapshot.snapshotId, incidents }).slice(0, 24)}`, observedAt: timestamp(observedAt, 'observedAt'), health: healthSnapshot.health.status, readiness: healthSnapshot.readiness.status, quality: healthSnapshot.quality.status, openIncidents: incidents.filter((item) => item.status === 'open').length, evidenceRefs: evidenceRefs(refs), productionReady: false }
}
function createObservability({ clock = () => new Date().toISOString(), releaseHealth: readReleaseHealth = null } = {}) {
  async function snapshot({ historicalCanary = null, signals = [], evidenceRefs: refs = [] } = {}) { const releaseHealth = typeof readReleaseHealth === 'function' ? await readReleaseHealth() : readReleaseHealth; return buildHealthSnapshot({ observedAt: clock(), releaseHealth, historicalCanary, signals, evidenceRefs: refs }) }
  return Object.freeze({ snapshot, deriveIncidents, summarizeOperation, createObservationEvent, validateObservationEvent, createSignal, createOperationalIncident, buildHealthSnapshot, validateHealthSnapshot })
}

module.exports = { OBSERVATION_EVENT_SCHEMA, HEALTH_SNAPSHOT_SCHEMA, SIGNAL_SCHEMA, INCIDENT_SCHEMA, OPERATION_SUMMARY_SCHEMA, EVENT_TYPES, SOURCES, SEVERITIES, OUTCOMES, INCIDENT_CATEGORIES, INCIDENT_STATUSES, ObservabilityContractError, createObservationEvent, validateObservationEvent, createSignal, validateSignal, createOperationalIncident, validateOperationalIncident, validateHealthSnapshot, buildHealthSnapshot, deriveIncidents, summarizeOperation, createObservability, sanitize, canonical, digest }
