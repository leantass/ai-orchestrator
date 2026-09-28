const fs = require('node:fs/promises')
const path = require('node:path')
const observation = require('./jefe-observability-contract.cjs')
const sourceModule = require('./jefe-observability-source-adapters.cjs')

const CHECKPOINT_SCHEMA = 'jefe-observability-source-checkpoint/v1'
const SOURCE_STATUS_SCHEMA = 'jefe-observability-source-status/v1'
const ORDER = Object.freeze(['project-lifecycle', 'semantic-runtime', 'qa-security', 'human-gate', 'release', 'memory'])
const locks = new Map()
function fail(code, message, details = {}) { const error = new Error(message); error.code = code; error.details = details; throw error }
function canonical(value) { return observation.canonical(value) }
function clone(value) { return JSON.parse(canonical(value)) }
function locked(key, work) { const previous = locks.get(key) || Promise.resolve(); let release; const tail = new Promise((resolve) => { release = resolve }); locks.set(key, tail); return previous.then(work).finally(() => { release(); if (locks.get(key) === tail) locks.delete(key) }) }
function safeSourceId(value) { if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,40}$/u.test(value)) fail('INVALID_SOURCE_ID', 'Source identity is invalid.'); return value }
function sourceStatus({ source, status, lastSuccessfulSync = null, lastAttemptAt, recordsObserved = 0, recordsIngested = 0, lastError = null, checkpoint = null }) { return { schemaVersion: SOURCE_STATUS_SCHEMA, sourceId: source.sourceId, sourceKind: source.sourceKind, status, lastSuccessfulSync, lastAttemptAt, recordsObserved, recordsIngested, lastError: lastError ? observation.sanitize(lastError) : null, checkpoint, evidenceRefs: [`source-status:${source.sourceId}`] } }

function createObservabilityRuntime({ persistence, orchestrator, adapters = [], releaseHealth = null, clock = () => new Date().toISOString() } = {}) {
  if (!persistence || !orchestrator) fail('OBSERVABILITY_RUNTIME_NOT_CONFIGURED', 'Durable observability services are required.')
  const adapterMap = new Map(adapters.map((adapter) => [safeSourceId(adapter.sourceId), adapter]))
  const checkpointRoot = path.join(persistence.authorityRoot, 'checkpoints')
  const sourceStatusRoot = path.join(persistence.authorityRoot, 'source-status')
  async function atomic(filePath, value) { const stage = `${filePath}.${process.pid}.${Date.now()}.stage`; await fs.mkdir(path.dirname(filePath), { recursive: true }); try { await fs.writeFile(stage, `${canonical(value)}\n`, 'utf8'); await fs.rename(stage, filePath) } finally { await fs.rm(stage, { force: true }).catch(() => {}) } }
  async function readJson(filePath) { try { return JSON.parse(await fs.readFile(filePath, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return null; fail('CORRUPT_OBSERVABILITY_RUNTIME_RECORD', 'Runtime observability record is corrupt.') } }
  async function readCheckpoint(sourceId) { return readJson(path.join(checkpointRoot, `${safeSourceId(sourceId)}.json`)) }
  async function readSourceStatus(sourceId) { return readJson(path.join(sourceStatusRoot, `${safeSourceId(sourceId)}.json`)) }
  async function allSourceStatuses() { const statuses = []; for (const adapter of adapterMap.values()) { const status = await readSourceStatus(adapter.sourceId); statuses.push(status || sourceStatus({ source: adapter, status: 'unknown', lastAttemptAt: clock() })) } return statuses.sort((a, b) => a.sourceId.localeCompare(b.sourceId)) }
  async function syncSource(sourceId, { projectId = null } = {}) {
    const adapter = adapterMap.get(safeSourceId(sourceId)); if (!adapter) fail('OBSERVABILITY_SOURCE_NOT_FOUND', 'Source adapter is not registered.')
    return locked(`source:${sourceId}`, async () => {
      const attemptedAt = clock(); const prior = await readCheckpoint(sourceId); let scanned
      try { scanned = await adapter.scan(prior ? { checkpoint: prior } : {}) } catch (error) { const status = sourceStatus({ source: adapter, status: 'unavailable', lastAttemptAt: attemptedAt, lastSuccessfulSync: null, lastError: error }); await atomic(path.join(sourceStatusRoot, `${sourceId}.json`), status); return { sourceId, status, checkpoint: prior, recordsObserved: 0, recordsIngested: 0, unavailable: true } }
      const records = Array.isArray(scanned) ? scanned : scanned.records || []; const sourceCorruptions = Array.isArray(scanned?.corruptions) ? scanned.corruptions : []; const fingerprints = Object.fromEntries(records.map((record) => [adapter.recordId(record), adapter.fingerprint(record)])); const mutations = Object.entries(prior?.recordFingerprints || {}).filter(([recordId, priorFingerprint]) => fingerprints[recordId] && fingerprints[recordId] !== priorFingerprint)
      let ingested = 0
      for (const record of records) {
        if (projectId && record.projectId !== projectId) continue
        for (const mutation of mutations.filter(([recordId]) => recordId === adapter.recordId(record))) { const mutationEvent = observation.createObservationEvent({ eventType: 'observability.source_record_mutated', occurredAt: attemptedAt, source: { kind: 'jefe', sourceId: adapter.sourceId }, severity: 'critical', outcome: 'failed', correlationId: adapter.sourceId, evidenceRefs: [`source-record:${adapter.sourceId}:${mutation[0]}`], subject: { projectId: record.projectId || null }, attributes: { recordId: mutation[0], previousFingerprint: mutation[1], currentFingerprint: fingerprints[mutation[0]] } }); await orchestrator.recordEvent(mutationEvent); ingested++ }
        const sourceEvents = adapter.toObservationEvents(record).filter((event) => !projectId || event.subject.projectId === projectId)
        for (const event of sourceEvents) { const result = await orchestrator.recordEvent(event); if (!result.idempotent) ingested++ }
      }
      const numericCursors = records.map((record) => Number(record.sequence ?? record.revision)).filter(Number.isFinite); const checkpoint = { schemaVersion: CHECKPOINT_SCHEMA, sourceId: adapter.sourceId, cursor: numericCursors.length ? Math.max(...numericCursors) : prior?.cursor ?? null, sourceFingerprint: observation.digest(fingerprints), lastRecordId: records.length ? adapter.recordId(records.at(-1)) : prior?.lastRecordId || null, lastObservedAt: attemptedAt, revision: Number(prior?.revision || 0) + 1, updatedAt: attemptedAt, recordFingerprints: fingerprints }
      await atomic(path.join(checkpointRoot, `${sourceId}.json`), checkpoint)
      const status = sourceStatus({ source: adapter, status: sourceCorruptions.length || mutations.length ? 'degraded' : 'available', lastAttemptAt: attemptedAt, lastSuccessfulSync: attemptedAt, recordsObserved: records.length, recordsIngested: ingested, lastError: sourceCorruptions.length ? { code: 'SOURCE_RECORD_CORRUPT', message: 'Some source records were corrupt.' } : mutations.length ? { code: 'SOURCE_RECORD_MUTATED', message: 'A durable source record changed after ingestion.' } : null, checkpoint })
      await atomic(path.join(sourceStatusRoot, `${sourceId}.json`), status)
      return { sourceId, status, checkpoint, recordsObserved: records.length, recordsIngested: ingested, sourceCorruptions, mutations: mutations.map(([recordId]) => recordId) }
    })
  }
  async function syncAll() { const results = []; for (const sourceId of ORDER) if (adapterMap.has(sourceId)) results.push(await syncSource(sourceId)); const state = await refreshOperationalState({ sync: false }); return { results, health: state.health, summary: state.summary, sourceStatuses: state.sourceStatuses } }
  async function syncProject(projectId) { const results = []; for (const sourceId of ORDER) if (adapterMap.has(sourceId)) results.push(await syncSource(sourceId, { projectId })); const state = await refreshOperationalState({ sync: false, projectId }); return { results, health: state.health, summary: state.summary, sourceStatuses: state.sourceStatuses } }
  async function refreshOperationalState({ sync = true, projectId = null } = {}) { if (sync) projectId ? await syncProject(projectId) : await syncAll(); const sourceStatuses = await allSourceStatuses(); const release = typeof releaseHealth === 'function' ? await releaseHealth() : releaseHealth; const historicalCanary = null; const snapshotResult = await orchestrator.recordHealthSnapshot({ releaseHealth: release, sourceStatuses, historicalCanary, evidenceRefs: sourceStatuses.map((item) => `source-status:${item.sourceId}`) }); await orchestrator.deriveAndPersistIncidents({ healthSnapshot: snapshotResult.snapshot }); const summary = await orchestrator.buildOperationSummary({ evidenceRefs: sourceStatuses.map((item) => `source-status:${item.sourceId}`) }); return { health: snapshotResult.snapshot, summary: summary.summary, sourceStatuses } }
  async function getOperationalState({ projectId = null, limit = 25, cursor = null } = {}) { const detailed = await persistence.scanDetailed(); const health = await persistence.latestHealth(); const summary = detailed.summaries.at(-1) || observation.summarizeOperation({ observedAt: clock(), healthSnapshot: health, incidents: detailed.incidents }); const timeline = await persistence.timeline({ projectId, limit, cursor }); const incidents = detailed.incidents.filter((item) => !projectId || item.projectId === projectId || item.projectId === null); return { health, summary, timeline, incidents, sourceStatuses: await allSourceStatuses(), corruptions: detailed.corruptions } }
  return Object.freeze({ syncSource, syncAll, syncProject, refreshOperationalState, getOperationalState, readCheckpoint, readSourceStatus, allSourceStatuses, CHECKPOINT_SCHEMA, SOURCE_STATUS_SCHEMA })
}

module.exports = { CHECKPOINT_SCHEMA, SOURCE_STATUS_SCHEMA, ObservabilityRuntimeError: Error, createObservabilityRuntime, sourceStatus }
