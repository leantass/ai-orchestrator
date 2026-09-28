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
  'release.recovery.completed', 'release.cleanup.completed', 'repository.baseline_changed', 'repository.remote_ref_observed',
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
function createOperationalIncident({ projectId = null, category, severity = 'warning', status = 'open', firstSeen, lastSeen = firstSeen, correlationId, evidenceRefs: refs = [], sourceEventIds = [], summary, resolution = null } = {}) {
  if (!INCIDENT_CATEGORIES.includes(category) || !SEVERITIES.includes(severity) || !INCIDENT_STATUSES.includes(status)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Incident category, severity or status is invalid.')
  const normalizedRefs = evidenceRefs(refs)
  const normalizedSourceEvents = evidenceRefs(sourceEventIds, 'sourceEventIds')
  const normalizedResolution = resolution ? sanitize(resolution) : null
  if (status === 'resolved' && (!normalizedResolution || !Array.isArray(normalizedResolution.evidenceRefs) || normalizedResolution.evidenceRefs.length === 0 || typeof normalizedResolution.reason !== 'string' || !normalizedResolution.reason.trim() || typeof normalizedResolution.resolvedAt !== 'string')) fail('OBSERVABILITY_RESOLUTION_EVIDENCE_REQUIRED', 'Resolved incidents require evidenceRefs, reason and resolvedAt.')
  const normalizedCorrelationId = safeId(correlationId, 'correlationId', true)
  return { schemaVersion: INCIDENT_SCHEMA, incidentId: `operational-incident-${digest({ projectId, category, correlationId: normalizedCorrelationId, evidenceRefs: normalizedRefs }).slice(0, 24)}`, projectId: projectId === null ? null : safeId(projectId, 'projectId'), category, severity, status, firstSeen: timestamp(firstSeen, 'firstSeen'), lastSeen: timestamp(lastSeen, 'lastSeen'), dedupKey: digest({ projectId, category, correlationId: normalizedCorrelationId, evidenceRefs: normalizedRefs }), correlationId: normalizedCorrelationId, evidenceRefs: normalizedRefs, sourceEventIds: normalizedSourceEvents, summary: text(summary, 'summary', 500), resolution: normalizedResolution }
}
function validateOperationalIncident(incident) {
  if (!incident || incident.schemaVersion !== INCIDENT_SCHEMA) fail('OBSERVABILITY_CONTRACT_INVALID', 'Incident schema is invalid.')
  const normalized = createOperationalIncident(incident)
  if (canonical(normalized) !== canonical(incident)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Incident normalization mismatch.')
  return incident
}
function validateHealthSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== HEALTH_SNAPSHOT_SCHEMA || !HEALTH_STATES.includes(snapshot.health.status) || !READINESS_STATES.includes(snapshot.readiness.status) || !QUALITY_STATES.includes(snapshot.quality.status)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health snapshot is invalid.')
  if (snapshot.productionReady !== false && snapshot.productionReady !== true) fail('OBSERVABILITY_CONTRACT_INVALID', 'productionReady must be boolean.')
  if (snapshot.health.operational !== (snapshot.health.status === 'healthy')) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health operational flag is inconsistent.')
  timestamp(snapshot.observedAt, 'observedAt')
  const normalizedRefs = evidenceRefs(snapshot.health.evidenceRefs)
  const readinessRefs = evidenceRefs(snapshot.readiness.evidenceRefs)
  const qualityRefs = evidenceRefs(snapshot.quality.evidenceRefs)
  if (canonical(normalizedRefs) !== canonical(snapshot.health.evidenceRefs) || canonical(readinessRefs) !== canonical(snapshot.readiness.evidenceRefs) || canonical(qualityRefs) !== canonical(snapshot.quality.evidenceRefs)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health evidence references are not normalized.')
  const normalizedSignals = snapshot.signals.map((signal) => validateSignal(signal))
  if (canonical(normalizedSignals) !== canonical(snapshot.signals)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health signals are not normalized.')
  const normalized = { schemaVersion: HEALTH_SNAPSHOT_SCHEMA, snapshotId: snapshot.snapshotId, observedAt: snapshot.observedAt, health: { status: snapshot.health.status, operational: snapshot.health.operational, evidenceRefs: normalizedRefs }, readiness: { status: snapshot.readiness.status, evidenceRefs: readinessRefs }, quality: { status: snapshot.quality.status, evidenceRefs: qualityRefs }, signals: normalizedSignals, productionReady: snapshot.productionReady, limitations: sanitize(snapshot.limitations) }
  if (canonical(normalized) !== canonical(snapshot)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health snapshot normalization mismatch.')
  const expectedId = `health-snapshot-${digest({ observedAt: normalized.observedAt, health: normalized.health, readiness: normalized.readiness, quality: normalized.quality, signals: normalizedSignals, productionReady: normalized.productionReady, limitations: normalized.limitations }).slice(0, 24)}`
  if (snapshot.snapshotId !== expectedId) fail('OBSERVABILITY_CONTRACT_INVALID', 'Health snapshot identity mismatch.')
  return snapshot
}
function buildHealthSnapshot({ observedAt, releaseHealth = null, historicalCanary = null, signals = [], evidenceRefs: refs = [] } = {}) {
  const canary = historicalCanary || {}
  const hasReleaseHealth = releaseHealth && typeof releaseHealth === 'object'
  const healthStatus = canary.state === 'CONSISTENT_TERMINAL' || hasReleaseHealth ? (releaseHealth?.uncertainExecutions > 0 || releaseHealth?.corruptions > 0 ? 'degraded' : 'healthy') : 'unknown'
  const ciFailed = canary.remoteCiStatus === 'failed' || releaseHealth?.failedCi > 0
  const readinessStatus = ciFailed || releaseHealth?.blockedFlows > 0 ? 'blocked' : hasReleaseHealth ? 'ready' : 'unknown'
  const qualityStatus = ciFailed ? 'failing' : canary.remoteCiStatus === 'unavailable' ? 'unknown' : canary.remoteCiStatus === 'passed' ? 'passing' : 'unknown'
  const normalizedSignals = signals.map((signal) => createSignal(signal))
  const result = { schemaVersion: HEALTH_SNAPSHOT_SCHEMA, snapshotId: null, observedAt: timestamp(observedAt, 'observedAt'), health: { status: healthStatus, operational: healthStatus === 'healthy', evidenceRefs: evidenceRefs(refs) }, readiness: { status: readinessStatus, evidenceRefs: evidenceRefs(refs) }, quality: { status: qualityStatus, evidenceRefs: evidenceRefs(refs) }, signals: normalizedSignals, productionReady: false, limitations: sanitize({ historicalLintErrors: canary.historicalLintErrors || null, reason: ciFailed ? 'remote-ci-failed' : null }) }
  result.snapshotId = `health-snapshot-${digest({ observedAt: result.observedAt, health: result.health, readiness: result.readiness, quality: result.quality, signals: normalizedSignals, productionReady: result.productionReady, limitations: result.limitations }).slice(0, 24)}`
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
    const incident = createOperationalIncident({ projectId: event.subject.projectId, category, severity, firstSeen: event.occurredAt, lastSeen: event.occurredAt, correlationId: event.correlationId, evidenceRefs: event.evidenceRefs, sourceEventIds: [event.eventId], summary })
    incidents.set(incident.dedupKey, incident)
  }
  if (healthSnapshot?.readiness?.status === 'blocked' && healthSnapshot.quality?.status === 'unknown') { const incident = createOperationalIncident({ category: 'observation_gap', severity: 'warning', firstSeen: healthSnapshot.observedAt, correlationId: 'health-snapshot', evidenceRefs: healthSnapshot.readiness.evidenceRefs, summary: 'Readiness is blocked without sufficient quality evidence.' }); incidents.set(incident.dedupKey, incident) }
  if (healthSnapshot?.quality?.status === 'failing' && ![...incidents.values()].some((item) => item.category === 'ci_failed')) { const incident = createOperationalIncident({ category: 'ci_failed', severity: 'warning', firstSeen: healthSnapshot.observedAt, correlationId: 'health-snapshot', evidenceRefs: healthSnapshot.quality.evidenceRefs, summary: 'Health snapshot records failed remote CI.' }); incidents.set(incident.dedupKey, incident) }
  return [...incidents.values()].sort((a, b) => a.incidentId.localeCompare(b.incidentId))
}
function summarizeOperation({ observedAt, healthSnapshot, incidents = [], evidenceRefs: refs = [] } = {}) {
  if (!healthSnapshot) return validateOperationSummary({ schemaVersion: OPERATION_SUMMARY_SCHEMA, summaryId: `operation-summary-${digest({ observedAt, sourceSnapshotId: null, incidentIds: [], evidenceRefs: evidenceRefs(refs) }).slice(0, 24)}`, observedAt: timestamp(observedAt, 'observedAt'), sourceSnapshotId: null, health: 'unknown', readiness: 'unknown', quality: 'unknown', openIncidents: 0, incidentIds: [], openIncidentIds: [], evidenceRefs: evidenceRefs(refs), productionReady: false })
  validateHealthSnapshot(healthSnapshot)
  const normalizedIncidents = incidents.map(validateOperationalIncident)
  const incidentIds = normalizedIncidents.map((item) => item.incidentId).sort()
  const openIncidentIds = normalizedIncidents.filter((item) => item.status === 'open').map((item) => item.incidentId).sort()
  const result = { schemaVersion: OPERATION_SUMMARY_SCHEMA, summaryId: null, observedAt: timestamp(observedAt, 'observedAt'), sourceSnapshotId: healthSnapshot.snapshotId, health: healthSnapshot.health.status, readiness: healthSnapshot.readiness.status, quality: healthSnapshot.quality.status, openIncidents: openIncidentIds.length, incidentIds, openIncidentIds, evidenceRefs: evidenceRefs(refs), productionReady: false }
  result.summaryId = `operation-summary-${digest({ observedAt: result.observedAt, sourceSnapshotId: result.sourceSnapshotId, incidentIds: result.incidentIds, evidenceRefs: result.evidenceRefs }).slice(0, 24)}`
  return validateOperationSummary(result)
}
function validateOperationSummary(summary) {
  if (!summary || summary.schemaVersion !== OPERATION_SUMMARY_SCHEMA) fail('OBSERVABILITY_CONTRACT_INVALID', 'Operation summary schema is invalid.')
  timestamp(summary.observedAt, 'observedAt'); safeId(summary.sourceSnapshotId, 'sourceSnapshotId', true); if (!Array.isArray(summary.incidentIds) || !Array.isArray(summary.openIncidentIds)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Operation summary incident IDs are invalid.')
  const normalized = { schemaVersion: OPERATION_SUMMARY_SCHEMA, summaryId: summary.summaryId, observedAt: summary.observedAt, sourceSnapshotId: summary.sourceSnapshotId || null, health: summary.health, readiness: summary.readiness, quality: summary.quality, openIncidents: summary.openIncidents, incidentIds: [...summary.incidentIds].sort(), openIncidentIds: [...summary.openIncidentIds].sort(), evidenceRefs: evidenceRefs(summary.evidenceRefs), productionReady: summary.productionReady }
  const expectedId = `operation-summary-${digest({ observedAt: normalized.observedAt, sourceSnapshotId: normalized.sourceSnapshotId, incidentIds: normalized.incidentIds, evidenceRefs: normalized.evidenceRefs }).slice(0, 24)}`
  if (canonical(normalized) !== canonical(summary) || summary.summaryId !== expectedId || summary.productionReady !== false || summary.openIncidents !== summary.openIncidentIds.length || summary.openIncidentIds.some((item) => !summary.incidentIds.includes(item)) || !['healthy', 'degraded', 'blocked', 'unknown'].includes(summary.health) || !['ready', 'blocked', 'unknown'].includes(summary.readiness) || !['passing', 'degraded', 'failing', 'unknown'].includes(summary.quality)) fail('OBSERVABILITY_CONTRACT_INVALID', 'Operation summary identity or derived fields mismatch.')
  return summary
}
function createObservability({ clock = () => new Date().toISOString(), releaseHealth: readReleaseHealth = null } = {}) {
  async function snapshot({ historicalCanary = null, signals = [], evidenceRefs: refs = [] } = {}) { const releaseHealth = typeof readReleaseHealth === 'function' ? await readReleaseHealth() : readReleaseHealth; return buildHealthSnapshot({ observedAt: clock(), releaseHealth, historicalCanary, signals, evidenceRefs: refs }) }
  return Object.freeze({ snapshot, deriveIncidents, summarizeOperation, createObservationEvent, validateObservationEvent, createSignal, validateSignal, createOperationalIncident, validateOperationalIncident, buildHealthSnapshot, validateHealthSnapshot, validateOperationSummary })
}

module.exports = { OBSERVATION_EVENT_SCHEMA, HEALTH_SNAPSHOT_SCHEMA, SIGNAL_SCHEMA, INCIDENT_SCHEMA, OPERATION_SUMMARY_SCHEMA, EVENT_TYPES, SOURCES, SEVERITIES, OUTCOMES, INCIDENT_CATEGORIES, INCIDENT_STATUSES, ObservabilityContractError, createObservationEvent, validateObservationEvent, createSignal, validateSignal, createOperationalIncident, validateOperationalIncident, validateHealthSnapshot, buildHealthSnapshot, deriveIncidents, summarizeOperation, validateOperationSummary, createObservability, sanitize, canonical, digest }
