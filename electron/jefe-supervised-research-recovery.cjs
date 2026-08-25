const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { physicalRootKey } = require('./jefe-physical-root.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { ATTEMPT_STATES, CONNECTORS } = require('./jefe-research-connector-contract.cjs')
const { sessionWriteCompatibility } = require('./jefe-supervised-research-persistence.cjs')

const DIAGNOSIS_SCHEMA = 'jefe-supervised-research-recovery-diagnosis/v1'
const STATUS_SCHEMA = 'jefe-supervised-research-recovery-status/v1'
const PLAN_SCHEMA = 'jefe-supervised-research-recovery-plan/v1'
const EXECUTION_SCHEMA = 'jefe-supervised-research-recovery-execution/v1'
const RECOVERY_PLAN_ID = /^research-recovery-[a-f0-9]{32}$/u
const PROJECT_ID = /^[a-z][a-z0-9-]{2,80}$/u
const BATCH_MAX = 50
const SNAPSHOT_MAX_COLLECTS = 3
const SAFE_RECORD_ID = /^[a-z][a-z0-9-]{2,100}$/u
const IDENTITY_FIELDS = Object.freeze(['projectId', 'runId', 'versionId'])
const STATUS_KEYS = Object.freeze(['schemaVersion', 'providerType', 'connectorId', 'catalogState', 'connectionState', 'circuitState', 'operationalState', 'networkEnabled', 'realConnector', 'fixture'])
const HEALTH_ITEM_KEYS = Object.freeze(['providerType', 'connectorId', 'sourceIntegrity', 'drift', 'materializedHealth', 'derivedHealth', 'attemptsConsidered', 'observedAttemptCount', 'corruptionCount'])
const HEALTH_SNAPSHOT_KEYS = Object.freeze(['schemaVersion', 'connectorId', 'state', 'failureCount', 'openedAt', 'halfOpenEligibleAt', 'probeAttemptId', 'lastTransitionAt'])
const HEALTH_REBUILD_ITEM_KEYS = Object.freeze(['providerType', 'connectorId', 'health', 'attemptsConsidered', 'observedAttemptCount', 'sourceIntegrity', 'materialized', 'idempotent', 'replacedCorrupt', 'corruptionCount'])
const ISSUE_CODES = new Set([
  'DERIVED_INDEX_REPAIR_REQUIRED',
  'MISSING_INTAKE',
  'MISSING_EVIDENCE_CASE',
  'MISSING_RESEARCH_SESSION',
  'MISSING_CONNECTOR_ATTEMPT',
  'CROSS_EVIDENCE_CASE_REFERENCE',
  'PHYSICAL_IDENTITY_MISMATCH',
  'PROJECT_REFERENCE_MISMATCH',
  'INTAKE_REFERENCE_MISMATCH',
  'DISCOVERY_REFERENCE_MISMATCH',
  'RESEARCH_PLAN_REFERENCE_MISMATCH',
  'EVIDENCE_CASE_REFERENCE_MISMATCH',
  'RESEARCH_REQUEST_REFERENCE_MISMATCH',
  'RESEARCH_SESSION_REFERENCE_MISMATCH',
  'ROLE_REFERENCE_MISMATCH',
  'PACKAGE_REFERENCE_MISMATCH',
  'HANDOFF_REFERENCE_MISMATCH',
  'PROVIDER_REFERENCE_MISMATCH',
  'CONNECTOR_REFERENCE_MISMATCH',
  'RESEARCH_SESSION_PROJECTION_DRIFT',
  'RESEARCH_SESSION_PROJECTION_CONFLICT',
  'RECEIPT_REFERENCE_MISMATCH',
  'EVIDENCE_REFERENCE_MISMATCH',
])
const ISSUE_KINDS = new Set(['research_session', 'evidence_case', 'connector_attempt', 'execution_flow'])
const DURABLE_ERROR_CODES = new Set([
  'RESEARCH_PERSISTENCE_FAILED',
  'MEMORY_APPEND_FAILED',
  'MEMORY_NOT_CONFIGURED',
  'INJECTED_MEMORY_FAILURE',
  'INJECTED_FAILURE',
  'INVALID_SESSION',
  'STALE_SESSION',
  'INCOMPATIBLE_REPLAY',
  'CORRUPT_SESSION',
  'SESSION_LOCKED',
  'INVALID_ENTRY',
  'INVALID_ID',
  'INVALID_IDENTITY',
  'INVALID_REFERENCE',
  'INVALID_REFERENCES',
  'INVALID_ACTOR',
  'INVALID_AUTHORITY',
  'INVALID_SCOPE',
  'INVALID_STATE',
  'INVALID_TEXT',
  'INVALID_TIMESTAMP',
  'INVALID_TYPE',
  'INVALID_URL_REFERENCE',
  'METADATA_DEPTH',
  'METADATA_SIZE',
  'SENSITIVE_FIELD',
  'LOCKED',
  'ENTRY_ID_COLLISION',
  'UNKNOWN_RELATION_TARGET',
  'HUMAN_DECISION_PROTECTED',
  'CIRCUIT_OPEN',
  'BUDGET_EXHAUSTED',
  'EXECUTION_TIMEOUT',
  'ADAPTER_FAILURE',
  'ADAPTER_PERMANENT_FAILURE',
  'INVALID_CONNECTOR_CANDIDATE',
  'INVALID_PROVIDER_RECEIPT',
  'INVALID_RESEARCH_CORRELATION',
  'RESEARCH_RECEIVE_REJECTED',
  'UNTRUSTED_ADAPTER_OUTPUT',
  'CANCELLED',
  'INTERRUPTED',
  'INTAKE_NOT_FOUND',
  'INTAKE_NOT_READY',
  'CONTEXT_PREPARATION_FAILED',
  'RESEARCH_PREPARATION_FAILED',
  'ATTEMPT_PREPARATION_FAILED',
  'CONNECTOR_NOT_CONNECTED',
  'CONNECTOR_POLICY_BLOCKED',
  'EXECUTION_FAILED',
  'RESEARCH_INTEGRATION_UNAVAILABLE',
  'DELIVERY_PENDING',
  'DELIVERY_FAILED',
  'SYNC_FAILED',
  'RETRY_LIMIT_REACHED',
  'CORRUPT_DEPENDENCY',
])
const ACTIONABLE_FLOW_STATES = new Set(['explicit_execution', 'resume_delivery', 'sync_state'])
const PREPARATION_FLOW_STATES = new Set(['prepare_context', 'prepare_research', 'prepare_attempts'])
const RECOVERY_OPERATION_ERROR_CODES = new Set([
  'RECOVERY_OPERATION_FAILED',
  'INDEX_REBUILD_FAILED',
  'RESEARCH_RECONCILE_FAILED',
  'CONNECTOR_RECONCILE_FAILED',
  'EXECUTION_RECONCILE_FAILED',
  'CONNECTOR_HEALTH_REBUILD_FAILED',
])
const CORRUPTION_SPECS = Object.freeze({
  discovery: Object.freeze({ idField: 'intakeId', idPattern: /^intake-[a-f0-9]{32}$/u, code: 'CORRUPT_INTAKE' }),
  research: Object.freeze({ idField: 'researchSessionId', idPattern: /^research-session-[a-f0-9]{32}$/u, code: 'CORRUPT_SESSION' }),
  evidenceCases: Object.freeze({ idField: 'evidenceCaseId', idPattern: /^evidence-case-[a-f0-9]{32}$/u, code: 'CORRUPT_EVIDENCE_CASE' }),
  connectorAttempts: Object.freeze({ idField: 'connectorAttemptId', idPattern: /^connector-attempt-[a-f0-9]{32}$/u, code: 'CORRUPT_ATTEMPT' }),
  executionFlows: Object.freeze({ idField: 'executionFlowId', idPattern: /^research-execution-[a-f0-9]{32}$/u, code: 'CORRUPT_EXECUTION_FLOW' }),
})
const RECOVERY_BLOCKER_KINDS = new Set(['intake', ...ISSUE_KINDS])
const RECOVERY_BLOCKER_CODES = new Set([...ISSUE_CODES, ...Object.values(CORRUPTION_SPECS).map((item) => item.code), 'CORRUPT_DEPENDENCY'])
const INDEX_OPERATIONS = Object.freeze([
  Object.freeze({ type: 'rebuild_discovery_index', store: 'discovery', fileName: 'discovery-index.json', schemaVersion: 'jefe-supervised-discovery-index/v1', idsField: 'intakeIds', recordId: 'intakeId' }),
  Object.freeze({ type: 'rebuild_research_index', store: 'research', fileName: 'research-session-index.json', schemaVersion: 'jefe-supervised-research-session-index/v1', idsField: 'sessionIds', recordId: 'researchSessionId' }),
  Object.freeze({ type: 'rebuild_evidence_case_index', store: 'evidenceCases', fileName: 'evidence-case-index.json', schemaVersion: 'jefe-supervised-research-evidence-case-index/v1', idsField: 'evidenceCaseIds', recordId: 'evidenceCaseId' }),
  Object.freeze({ type: 'rebuild_connector_index', store: 'connectorAttempts', fileName: 'attempt-index.json', schemaVersion: 'jefe-research-connector-index/v1', idsField: 'attemptIds', recordId: 'connectorAttemptId' }),
  Object.freeze({ type: 'rebuild_execution_index', store: 'executionFlows', fileName: 'research-execution-index.json', schemaVersion: 'jefe-supervised-research-execution-index/v1', idsField: 'executionFlowIds', recordId: 'executionFlowId' }),
])
const OPERATION_TYPES = Object.freeze([
  'reconcile_connector_attempts',
  'reconcile_pending_research',
  'reconcile_execution_flows',
  ...INDEX_OPERATIONS.map((item) => item.type),
  'rebuild_connector_health',
])
const recoveryLocks = new Map()

class SupervisedResearchRecoveryError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SupervisedResearchRecoveryError'
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchRecoveryError(code, message)
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function clone(value) {
  return JSON.parse(canonical(value))
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const item of Object.values(value)) deepFreeze(item)
  return Object.freeze(value)
}

function plainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) return false
  return Object.values(Object.getOwnPropertyDescriptors(value)).every((descriptor) => Object.hasOwn(descriptor, 'value') && descriptor.enumerable)
}

function exactKeys(value, fields) {
  return plainObject(value) && canonical(Object.keys(value).sort()) === canonical([...fields].sort())
}

function sameIdentity(left, right) {
  return exactKeys(left, IDENTITY_FIELDS) && exactKeys(right, IDENTITY_FIELDS) && IDENTITY_FIELDS.every((field) => typeof left[field] === 'string' && left[field] === right[field])
}

function exactInput(value, allowed, required = allowed) {
  if (!plainObject(value) || required.some((field) => !Object.hasOwn(value, field)) || Object.keys(value).some((field) => !allowed.includes(field))) fail('INVALID_RECOVERY_REQUEST', 'Solicitud de recovery invalida.')
}

function projectId(value) {
  if (typeof value !== 'string' || !PROJECT_ID.test(value)) fail('INVALID_PROJECT_ID', 'Proyecto de recovery invalido.')
  return value
}

function batchLimit(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > BATCH_MAX) fail('INVALID_RECOVERY_LIMIT', 'Lote de recovery invalido.')
  return value
}

function dependency(value, methods, label, requireRoot = false) {
  if (!value || (typeof value !== 'object' && typeof value !== 'function') || methods.some((method) => typeof value[method] !== 'function')) fail('INVALID_RECOVERY_DEPENDENCY', `Dependencia ${label} invalida.`)
  if (requireRoot && (typeof value.authorityRoot !== 'string' || !path.isAbsolute(value.authorityRoot))) fail('INVALID_RECOVERY_DEPENDENCY', `Dependencia ${label} invalida.`)
  return value
}

function exclusive(key, work) {
  const previous = recoveryLocks.get(key) || Promise.resolve()
  let release
  const tail = new Promise((resolve) => { release = resolve })
  recoveryLocks.set(key, tail)
  return previous.then(work).finally(() => {
    release()
    if (recoveryLocks.get(key) === tail) recoveryLocks.delete(key)
  })
}

function exclusiveMany(keys, work, index = 0) {
  if (index >= keys.length) return work()
  return exclusive(keys[index], () => exclusiveMany(keys, work, index + 1))
}

function detail(value, label) {
  if (!plainObject(value) || !Array.isArray(value.records) || !Array.isArray(value.corruptions)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', `Detalle ${label} invalido.`)
  return value
}

function recordProject(store, record) {
  if (store === 'discovery' || store === 'executionFlows') return record.identity?.projectId
  return record.projectId
}

function expectedIndex(store, detail) {
  if (store === 'discovery') return {
    schemaVersion: 'jefe-supervised-discovery-index/v1',
    intakeIds: detail.records.map((item) => item.intakeId).sort(),
    projectAssociations: detail.records.filter((item) => item.identity?.projectId).map((item) => ({ intakeId: item.intakeId, projectId: item.identity.projectId })).sort((left, right) => left.intakeId.localeCompare(right.intakeId)),
    corruptions: detail.corruptions,
    rebuiltAt: null,
  }
  if (store === 'research') return {
    schemaVersion: 'jefe-supervised-research-session-index/v1',
    sessionIds: detail.records.map((item) => item.researchSessionId).sort(),
    requestAssociations: detail.records.map((item) => ({ projectId: item.projectId, researchRequestId: item.researchRequestId, researchSessionId: item.researchSessionId })).sort((left, right) => left.researchRequestId.localeCompare(right.researchRequestId)),
    corruptions: detail.corruptions,
    rebuiltAt: null,
  }
  if (store === 'evidenceCases') return {
    schemaVersion: 'jefe-supervised-research-evidence-case-index/v1',
    evidenceCaseIds: detail.records.map((item) => item.evidenceCaseId).sort(),
    projectAssociations: detail.records.map((item) => ({ evidenceCaseId: item.evidenceCaseId, projectId: item.projectId })).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId)),
    requestAssociations: detail.records.flatMap((item) => item.requests.map((request) => ({ evidenceCaseId: item.evidenceCaseId, researchRequestId: request.researchRequestId }))).sort((left, right) => left.researchRequestId.localeCompare(right.researchRequestId)),
    corruptions: detail.corruptions,
    rebuiltAt: null,
  }
  if (store === 'connectorAttempts') return {
    schemaVersion: 'jefe-research-connector-index/v1',
    attemptIds: detail.records.map((item) => item.connectorAttemptId).sort(),
    corruptions: detail.corruptions,
    rebuiltAt: null,
  }
  return {
    schemaVersion: 'jefe-supervised-research-execution-index/v1',
    executionFlowIds: detail.records.map((item) => item.executionFlowId).sort(),
    projectAssociations: detail.records.map((item) => ({ executionFlowId: item.executionFlowId, projectId: item.identity.projectId })).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId)),
    intakeAssociations: detail.records.map((item) => ({ executionFlowId: item.executionFlowId, intakeId: item.intakeId })).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId)),
    corruptions: detail.corruptions,
    rebuiltAt: null,
  }
}

async function readIndexSource(authorityRoot, fileName) {
  try {
    return { state: 'present', bytes: await fs.promises.readFile(path.join(authorityRoot, fileName), 'utf8') }
  } catch (error) {
    if (error.code === 'ENOENT') return { state: 'missing', bytes: null }
    return { state: 'unreadable', bytes: null }
  }
}

function inspectIndex(specification, source, storeDetail) {
  const expected = expectedIndex(specification.store, storeDetail)
  const expectedIds = expected[specification.idsField]
  const base = { store: specification.store, scope: 'authority_root', expectedRecordCount: expectedIds.length }
  if (!exactKeys(source, ['state', 'bytes']) || !['present', 'missing', 'unreadable'].includes(source.state) || (source.state === 'present' ? typeof source.bytes !== 'string' : source.bytes !== null)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Fuente de indice invalida.')
  if (source.state === 'missing') return { ...base, state: 'missing', indexedRecordCount: 0, repairRequired: true }
  if (source.state === 'unreadable') return { ...base, state: 'corrupt', indexedRecordCount: 0, repairRequired: true }
  let parsed
  try {
    parsed = JSON.parse(source.bytes)
  } catch {
    return { ...base, state: 'corrupt', indexedRecordCount: 0, repairRequired: true }
  }
  const ids = parsed?.[specification.idsField]
  if (!plainObject(parsed) || canonical(Object.keys(parsed).sort()) !== canonical(Object.keys(expected).sort()) || parsed.schemaVersion !== specification.schemaVersion || !Array.isArray(ids) || ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length || !Array.isArray(parsed.corruptions)) {
    return { ...base, state: 'corrupt', indexedRecordCount: Array.isArray(ids) ? ids.length : 0, repairRequired: true }
  }
  const drifted = canonical(parsed) !== canonical(expected)
  return { ...base, state: drifted ? 'drifted' : 'present', indexedRecordCount: ids.length, repairRequired: drifted }
}

function operationErrorCode(value) {
  return RECOVERY_OPERATION_ERROR_CODES.has(value) ? value : 'RECOVERY_OPERATION_FAILED'
}

function durableErrorCode(value) {
  if (value === null || value === undefined) return null
  return DURABLE_ERROR_CODES.has(value) ? value : 'UNRECOGNIZED_DURABLE_ERROR'
}

function corruptionItems(store, values) {
  const specification = CORRUPTION_SPECS[store]
  if (!specification) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Store de corrupcion invalido.')
  return values.map((value) => {
    if (!exactKeys(value, [specification.idField, 'code']) || !specification.idPattern.test(value[specification.idField]) || value.code !== specification.code) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', `Corrupcion ${store} invalida.`)
    return { store, recordId: value[specification.idField], code: value.code }
  }).sort((left, right) => left.recordId.localeCompare(right.recordId))
}

function connectorStatus(value, providerType) {
  const definition = CONNECTORS[providerType]
  if (!definition || !exactKeys(value, STATUS_KEYS) || value.schemaVersion !== 'jefe-research-connector-operational-status/v1' || value.providerType !== providerType || value.connectorId !== definition.connectorId || value.catalogState !== definition.status || typeof value.realConnector !== 'boolean' || typeof value.fixture !== 'boolean' || value.networkEnabled !== false || (value.realConnector && value.fixture) || (value.realConnector && providerType !== 'structured_analysis')) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Estado de connector invalido.')
  const expectedConnection = definition.status !== 'ready'
    ? definition.status
    : value.realConnector
      ? 'connected_local'
      : value.fixture
        ? 'fixture_only'
        : providerType === 'manual_reference'
          ? 'reference_only'
          : 'not_connected'
  if (value.connectionState !== expectedConnection) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Estado de connector invalido.')
  if (definition.status === 'ready') {
    if (!['closed', 'open', 'half_open', 'unknown', 'corrupt'].includes(value.circuitState)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Estado de connector invalido.')
  } else if (value.circuitState !== 'not_applicable') fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Estado de connector invalido.')
  let expectedOperational = value.connectionState
  if (['unknown', 'corrupt'].includes(value.circuitState)) expectedOperational = 'health_unknown'
  else if (value.circuitState === 'open') expectedOperational = 'circuit_open'
  else if (value.circuitState === 'half_open') expectedOperational = 'half_open'
  else if (value.connectionState === 'connected_local') expectedOperational = 'ready'
  if (value.operationalState !== expectedOperational) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Estado de connector invalido.')
  return clone(value)
}

function validTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function healthSnapshot(value, connectorId) {
  if (!exactKeys(value, HEALTH_SNAPSHOT_KEYS) || value.schemaVersion !== 'jefe-research-connector-health/v1' || value.connectorId !== connectorId || !['closed', 'open', 'half_open'].includes(value.state) || !Number.isSafeInteger(value.failureCount) || value.failureCount < 0) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Snapshot de health invalido.')
  for (const field of ['openedAt', 'halfOpenEligibleAt', 'lastTransitionAt']) if (value[field] !== null && !validTimestamp(value[field])) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Snapshot de health invalido.')
  if (value.state === 'closed' && (value.openedAt !== null || value.halfOpenEligibleAt !== null || value.probeAttemptId !== null)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Snapshot de health invalido.')
  if (value.state === 'open' && (!validTimestamp(value.openedAt) || !validTimestamp(value.halfOpenEligibleAt) || value.probeAttemptId !== null || value.failureCount === 0 || !validTimestamp(value.lastTransitionAt))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Snapshot de health invalido.')
  if (value.state === 'half_open' && (!validTimestamp(value.openedAt) || !validTimestamp(value.halfOpenEligibleAt) || !/^connector-attempt-[a-f0-9]{32}$/u.test(value.probeAttemptId) || value.failureCount === 0 || !validTimestamp(value.lastTransitionAt))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Snapshot de health invalido.')
  return value
}

function connectorHealthInspection(value, providers, statuses) {
  if (!exactKeys(value, ['items', 'corruptionCount']) || !Array.isArray(value.items) || !Number.isSafeInteger(value.corruptionCount) || value.corruptionCount < 0 || value.items.length !== providers.length) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
  const items = value.items.map((item) => {
    const definition = CONNECTORS[item?.providerType]
    if (!exactKeys(item, HEALTH_ITEM_KEYS) || !definition || !providers.includes(item.providerType) || item.connectorId !== definition.connectorId || !['complete', 'partial'].includes(item.sourceIntegrity) || !Number.isSafeInteger(item.attemptsConsidered) || item.attemptsConsidered < 0 || !Number.isSafeInteger(item.observedAttemptCount) || item.observedAttemptCount < 0 || item.observedAttemptCount > item.attemptsConsidered || !Number.isSafeInteger(item.corruptionCount) || item.corruptionCount < 0 || item.corruptionCount > value.corruptionCount) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
    const materialized = item.materializedHealth === null ? null : healthSnapshot(item.materializedHealth, item.connectorId)
    const derived = item.derivedHealth === null ? null : healthSnapshot(item.derivedHealth, item.connectorId)
    if (item.sourceIntegrity === 'partial') {
      if (item.drift !== 'unknown' || derived !== null) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
    } else {
      if (!derived || !['none', 'missing', 'corrupt', 'mismatch'].includes(item.drift)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
      if (item.drift === 'none' && (!materialized || canonical(materialized) !== canonical(derived))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
      if (['missing', 'corrupt'].includes(item.drift) && materialized !== null) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
      if (item.drift === 'mismatch' && (!materialized || canonical(materialized) === canonical(derived))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
    }
    const status = statuses.find((candidate) => candidate.providerType === item.providerType)
    const expectedCircuit = definition.status !== 'ready'
      ? 'not_applicable'
      : item.sourceIntegrity === 'partial'
        ? 'unknown'
        : item.drift === 'corrupt'
          ? 'corrupt'
          : item.drift === 'none'
            ? materialized.state
            : 'unknown'
    if (!status || status.circuitState !== expectedCircuit) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Health y estado de connector no coinciden.')
    return {
      providerType: item.providerType,
      connectorId: item.connectorId,
      sourceIntegrity: item.sourceIntegrity,
      drift: item.drift,
      materializedState: materialized?.state || null,
      derivedState: derived?.state || null,
      attemptsConsidered: item.attemptsConsidered,
      observedAttemptCount: item.observedAttemptCount,
      corruptionCount: item.corruptionCount,
      repairRequired: item.sourceIntegrity === 'complete' && item.drift !== 'none',
    }
  }).sort((left, right) => left.providerType.localeCompare(right.providerType))
  if (new Set(items.map((item) => item.providerType)).size !== providers.length || value.corruptionCount !== Math.max(...items.map((item) => item.corruptionCount))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Diagnostico de health invalido.')
  return { items, corruptionCount: value.corruptionCount }
}

function connectorHealthRebuildResult(value, providers) {
  if (!exactKeys(value, ['items', 'corruptionCount']) || !Array.isArray(value.items) || value.items.length !== providers.length || !Number.isSafeInteger(value.corruptionCount) || value.corruptionCount < 0) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Rebuild de health invalido.')
  const items = value.items.map((item) => {
    const definition = CONNECTORS[item?.providerType]
    if (!exactKeys(item, HEALTH_REBUILD_ITEM_KEYS) || !definition || !providers.includes(item.providerType) || item.connectorId !== definition.connectorId || !['complete', 'partial'].includes(item.sourceIntegrity) || !Number.isSafeInteger(item.attemptsConsidered) || item.attemptsConsidered < 0 || !Number.isSafeInteger(item.observedAttemptCount) || item.observedAttemptCount < 0 || item.observedAttemptCount > item.attemptsConsidered || !Number.isSafeInteger(item.corruptionCount) || item.corruptionCount < 0 || item.corruptionCount > value.corruptionCount || typeof item.materialized !== 'boolean' || typeof item.idempotent !== 'boolean' || typeof item.replacedCorrupt !== 'boolean') fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Rebuild de health invalido.')
    if (item.sourceIntegrity === 'partial') {
      if (item.health !== null || item.materialized !== false) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Rebuild de health invalido.')
    } else if (!item.materialized || !item.health) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Rebuild de health invalido.')
    else healthSnapshot(item.health, item.connectorId)
    return item
  })
  if (new Set(items.map((item) => item.providerType)).size !== providers.length || value.corruptionCount !== Math.max(...items.map((item) => item.corruptionCount))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Rebuild de health invalido.')
  return value
}

function issue(code, kind, recordId, relatedId = null) {
  const derivedIndex = code === 'DERIVED_INDEX_REPAIR_REQUIRED' && kind === 'derived_index' && Object.hasOwn(CORRUPTION_SPECS, recordId) && relatedId === null
  const recordIssue = code !== 'DERIVED_INDEX_REPAIR_REQUIRED' && ISSUE_KINDS.has(kind) && SAFE_RECORD_ID.test(recordId) && (relatedId === null || SAFE_RECORD_ID.test(relatedId))
  if (!ISSUE_CODES.has(code) || (!derivedIndex && !recordIssue)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Issue de integridad invalido.')
  return { code, kind, recordId, relatedId }
}

function integrityIssues({ discovery, research, evidenceCases, connectorAttempts, executionFlows }, project) {
  const issues = []
  const add = (code, kind, recordId, relatedId = null) => issues.push(issue(code, kind, recordId, relatedId))
  const discoveryIdFor = (intakeId) => typeof intakeId === 'string' && intakeId.startsWith('intake-') ? `discovery-${intakeId.slice(7)}` : null
  const intakesById = new Map(discovery.records.map((item) => [item.intakeId, item]))
  const intakesByDiscovery = new Map(discovery.records.map((item) => [discoveryIdFor(item.intakeId), item]))
  const sessionsById = new Map(research.records.map((item) => [item.researchSessionId, item]))
  const sessionsByRequest = new Map(research.records.map((item) => [item.researchRequestId, item]))
  const casesById = new Map(evidenceCases.records.map((item) => [item.evidenceCaseId, item]))
  const casesByPlan = new Map(evidenceCases.records.map((item) => [item.researchPlanId, item]))
  const caseRequestById = new Map(evidenceCases.records.flatMap((caseRecord) => (caseRecord.requests || []).map((request) => [request.researchRequestId, { caseRecord, request }])))
  const attemptsById = new Map(connectorAttempts.records.map((item) => [item.connectorAttemptId, item]))
  const intakeBelongs = (intakeId) => intakesById.get(intakeId)?.identity?.projectId === project
  const sessionBelongs = (session) => {
    if (!session) return false
    const evidenceCase = casesById.get(session.evidenceCaseId)
    const discoveryIntake = intakesByDiscovery.get(session.discoveryId)
    return session.projectId === project || session.identity?.projectId === project || intakeBelongs(session.intakeId) || intakeBelongs(discoveryIntake?.intakeId) || evidenceCase?.projectId === project || evidenceCase?.identity?.projectId === project || intakeBelongs(evidenceCase?.intakeId)
  }
  const caseBelongs = (caseRecord) => {
    if (!caseRecord) return false
    if (caseRecord.projectId === project || caseRecord.identity?.projectId === project || intakeBelongs(caseRecord.intakeId)) return true
    const requestIds = new Set((caseRecord.requests || []).map((request) => request.researchRequestId))
    return research.records.some((session) => (session.evidenceCaseId === caseRecord.evidenceCaseId || requestIds.has(session.researchRequestId)) && sessionBelongs(session))
  }
  const attemptDirectBelongs = (attempt) => {
    if (!attempt) return false
    const requestIds = [attempt.researchRequestId, attempt.delivery?.researchRequestId, attempt.research?.researchRequestId]
    const sessions = [...new Set([
      sessionsById.get(attempt.researchSessionId),
      sessionsById.get(attempt.delivery?.researchSessionId),
      ...requestIds.map((requestId) => sessionsByRequest.get(requestId)),
    ].filter(Boolean))]
    const cases = [...new Set([
      ...requestIds.map((requestId) => caseRequestById.get(requestId)?.caseRecord),
      ...sessions.map((session) => casesById.get(session.evidenceCaseId)),
      casesById.get(attempt.delivery?.evidenceCaseId),
      casesById.get(attempt.research?.evidenceCaseId),
      casesByPlan.get(attempt.delivery?.researchPlanId),
      casesByPlan.get(attempt.research?.researchPlanId),
    ].filter(Boolean))]
    const intakeReferences = [attempt.discoveryId, attempt.delivery?.discoveryId].map((discoveryId) => intakesByDiscovery.get(discoveryId)).filter(Boolean)
    return attempt.projectId === project || attempt.delivery?.projectId === project || sessions.some(sessionBelongs) || cases.some(caseBelongs) || intakeReferences.some((intake) => intakeBelongs(intake.intakeId))
  }
  const attemptBelongs = (attempt) => attemptDirectBelongs(attempt) || [attempt?.rootAttemptId, attempt?.retryOfAttemptId].map((attemptId) => attemptsById.get(attemptId)).filter(Boolean).some(attemptDirectBelongs)
  const target = (store, record) => {
    if (recordProject(store, record) === project) return true
    if (store === 'research') return sessionBelongs(record)
    if (store === 'evidenceCases') return caseBelongs(record)
    if (store === 'connectorAttempts') return attemptBelongs(record)
    if (store !== 'executionFlows') return false
    return intakeBelongs(record.intakeId) || caseBelongs(casesById.get(record.evidenceCaseId)) || caseBelongs(casesByPlan.get(record.researchPlanId)) || (record.requestRefs || []).some((reference) => sessionBelongs(sessionsByRequest.get(reference.researchRequestId))) || (record.attemptRefs || []).some((reference) => attemptBelongs(attemptsById.get(reference.connectorAttemptId)))
  }
  const checkIdentity = (kind, recordId, relatedId, left, right) => { if (!sameIdentity(left, right)) add('PHYSICAL_IDENTITY_MISMATCH', kind, recordId, relatedId) }
  const checkRequest = (kind, recordId, requestId, session, request) => {
    if (!plainObject(session?.request) || canonical(session.request) !== canonical(request)) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', kind, recordId, requestId)
    if (session?.request?.role !== request?.role) add('ROLE_REFERENCE_MISMATCH', kind, recordId, requestId)
    if (session?.packageId !== request?.packageId || session?.request?.packageId !== request?.packageId) add('PACKAGE_REFERENCE_MISMATCH', kind, recordId, requestId)
    if (session?.handoffId !== request?.handoffId || session?.request?.handoffId !== request?.handoffId) add('HANDOFF_REFERENCE_MISMATCH', kind, recordId, requestId)
    if (session?.providerType !== request?.providerType || session?.request?.providerType !== request?.providerType) add('PROVIDER_REFERENCE_MISMATCH', kind, recordId, requestId)
  }
  const sessionProjectionState = (caseRecord, request, session) => {
    if (![caseRecord.receipts, caseRecord.evidenceDecisions, caseRecord.pendingOperations, session.receipts, session.evidenceDecisions, session.pendingOperations].every(Array.isArray)) return 'none'
    const receipts = caseRecord.receipts.filter((item) => item.researchRequestId === request.researchRequestId)
    const status = ['preparing', 'ready'].includes(caseRecord.state)
      ? request.state
      : caseRecord.state === 'accepted_for_context' && caseRecord.memory?.status === 'appended'
        ? 'completed_with_evidence'
        : caseRecord.state
    const expected = {
      receipts,
      budgetConsumed: receipts.reduce((sum, item) => sum + (item.bytes || 0), 0),
      evidenceDecisions: caseRecord.evidenceDecisions,
      status,
      pendingOperations: caseRecord.pendingOperations,
      lastErrorCode: caseRecord.lastErrorCode || null,
      nextResponsible: caseRecord.nextResponsible || 'jefe',
      updatedAt: caseRecord.updatedAt,
    }
    const actual = {
      receipts: session.receipts,
      budgetConsumed: session.budgetConsumed,
      evidenceDecisions: session.evidenceDecisions,
      status: session.status,
      pendingOperations: session.pendingOperations,
      lastErrorCode: session.lastErrorCode || null,
      nextResponsible: session.nextResponsible,
      updatedAt: session.updatedAt,
    }
    const drift = canonical(actual) !== canonical(expected) || Object.hasOwn(session, 'lastErrorCode') !== Object.hasOwn(caseRecord, 'lastErrorCode')
    if (!drift) return 'none'
    const expectedImmutable = {
      schemaVersion: 'jefe-supervised-research-session/v1',
      researchSessionId: `research-session-${digest(request.researchRequestId).slice(0, 32)}`,
      researchRequestId: request.researchRequestId,
      researchPlanId: caseRecord.researchPlanId,
      evidenceCaseId: caseRecord.evidenceCaseId,
      identity: caseRecord.identity,
      discoveryId: request.discoveryId,
      intakeId: request.intakeId,
      projectId: request.projectId,
      packageId: request.packageId,
      handoffId: request.handoffId,
      providerType: request.providerType,
      policyFingerprint: digest(request.budget),
      budget: request.budget,
      request,
      createdAt: request.createdAt,
    }
    const projected = {
      ...expectedImmutable,
      budgetConsumed: expected.budgetConsumed,
      status,
      receipts,
      evidenceDecisions: caseRecord.evidenceDecisions,
      pendingOperations: caseRecord.pendingOperations,
      ...(caseRecord.lastErrorCode ? { lastErrorCode: caseRecord.lastErrorCode } : {}),
      nextResponsible: caseRecord.nextResponsible || 'jefe',
      updatedAt: caseRecord.updatedAt,
    }
    if (sessionWriteCompatibility(session, projected) !== 'compatible') return 'conflict'
    if (caseRecord.state === 'preparing' || caseRecord.pendingOperations.includes('complete_plan') || caseRecord.pendingOperations.includes('sync_request_sessions')) return 'none'
    return 'repairable'
  }
  const expectedRetryAttemptId = (record) => {
    const seed = Object.fromEntries(['rootAttemptId', 'retryOfAttemptId', 'attemptNumber', 'projectId', 'researchSessionId', 'researchRequestId', 'discoveryId', 'connectorId'].map((field) => [field, record?.[field]]))
    return `connector-attempt-${digest(seed).slice(0, 32)}`
  }
  const expectedInitialAttemptId = (record) => {
    const seed = Object.fromEntries(['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId'].map((field) => [field, record?.[field]]))
    return `connector-attempt-${digest(seed).slice(0, 32)}`
  }
  const retryableTerminal = (record) => record && (record.state === 'failed_transient' || (record.state === 'policy_blocked' && record.errorCode === 'CIRCUIT_OPEN'))
  const checkLineageContext = (record, related) => {
    if (record.projectId !== related.projectId) add('PROJECT_REFERENCE_MISMATCH', 'connector_attempt', record.connectorAttemptId, related.connectorAttemptId)
    if (record.researchSessionId !== related.researchSessionId) add('RESEARCH_SESSION_REFERENCE_MISMATCH', 'connector_attempt', record.connectorAttemptId, related.connectorAttemptId)
    if (record.researchRequestId !== related.researchRequestId) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', 'connector_attempt', record.connectorAttemptId, related.connectorAttemptId)
    if (record.discoveryId !== related.discoveryId) add('DISCOVERY_REFERENCE_MISMATCH', 'connector_attempt', record.connectorAttemptId, related.connectorAttemptId)
    if (record.providerType !== related.providerType) add('PROVIDER_REFERENCE_MISMATCH', 'connector_attempt', record.connectorAttemptId, related.connectorAttemptId)
    if (record.operation !== related.operation || record.connectorId !== related.connectorId) add('CONNECTOR_REFERENCE_MISMATCH', 'connector_attempt', record.connectorAttemptId, related.connectorAttemptId)
  }
  const checkAttemptLineage = (record) => {
    const fields = ['rootAttemptId', 'retryOfAttemptId', 'attemptNumber']
    const present = fields.filter((field) => record[field] !== undefined)
    const kind = 'connector_attempt'
    if (present.length === 0) {
      if (record.connectorAttemptId !== expectedInitialAttemptId(record)) add('CONNECTOR_REFERENCE_MISMATCH', kind, record.connectorAttemptId, record.connectorAttemptId)
      return
    }
    if (present.length !== fields.length) {
      add('CONNECTOR_REFERENCE_MISMATCH', kind, record.connectorAttemptId, record.connectorAttemptId)
      return
    }
    if (record.rootAttemptId === record.connectorAttemptId || record.retryOfAttemptId === record.connectorAttemptId || record.connectorAttemptId !== expectedRetryAttemptId(record)) add('CONNECTOR_REFERENCE_MISMATCH', kind, record.connectorAttemptId, record.connectorAttemptId)
    const parent = attemptsById.get(record.retryOfAttemptId)
    const root = attemptsById.get(record.rootAttemptId)
    if (!parent) add('MISSING_CONNECTOR_ATTEMPT', kind, record.connectorAttemptId, record.retryOfAttemptId)
    if (!root) add('MISSING_CONNECTOR_ATTEMPT', kind, record.connectorAttemptId, record.rootAttemptId)
    if (!parent || !root) return
    checkLineageContext(record, parent)
    checkLineageContext(record, root)
    const rootHasLineage = fields.some((field) => root[field] !== undefined)
    const parentNumber = parent.attemptNumber || 1
    const expectedRoot = parent.rootAttemptId || parent.connectorAttemptId
    const parentTerminalAt = parent.updatedAt || parent.createdAt
    if (rootHasLineage || !retryableTerminal(parent) || !retryableTerminal(root) || !validTimestamp(parentTerminalAt) || !validTimestamp(record.createdAt) || Date.parse(record.createdAt) < Date.parse(parentTerminalAt) || record.rootAttemptId !== expectedRoot || record.attemptNumber !== parentNumber + 1) add('CONNECTOR_REFERENCE_MISMATCH', kind, record.connectorAttemptId, parent.connectorAttemptId)
    const visited = new Set([record.connectorAttemptId])
    let cursor = parent
    while (cursor?.retryOfAttemptId) {
      if (visited.has(cursor.connectorAttemptId)) {
        add('CONNECTOR_REFERENCE_MISMATCH', kind, record.connectorAttemptId, cursor.connectorAttemptId)
        break
      }
      visited.add(cursor.connectorAttemptId)
      cursor = attemptsById.get(cursor.retryOfAttemptId)
    }
  }
  const caseHasEvidenceId = (caseRecord, evidenceId, deliveredAt) => caseRecord.contributions.some((item) => {
    const receipt = caseRecord.receipts.find((candidate) => candidate.receiptId === item.receiptId && candidate.researchRequestId === item.researchRequestId)
    return ['received', 'partial'].includes(receipt?.status) && validTimestamp(receipt.receivedAt) && validTimestamp(deliveredAt) && Date.parse(receipt.receivedAt) <= Date.parse(deliveredAt) && `evidence-${digest({ request: item.researchRequestId, receipt: item.receiptId, claim: item.claim }).slice(0, 32)}` === evidenceId
  })
  const hasValidEvidenceDecision = (caseRecord) => caseRecord.evidenceDecisions.some((decision) => {
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) return false
    const contribution = caseRecord.contributions.find((item) => item.researchRequestId === decision.researchRequestId && item.receiptId === decision.receiptId && item.claim === decision.claim)
    const receipt = contribution && caseRecord.receipts.find((item) => item.receiptId === contribution.receiptId && item.researchRequestId === contribution.researchRequestId)
    if (!receipt || !['received', 'partial'].includes(receipt.status) || !validTimestamp(receipt.receivedAt)) return false
    const expectedEvidenceId = `evidence-${digest({ request: contribution.researchRequestId, receipt: contribution.receiptId, claim: contribution.claim }).slice(0, 32)}`
    const expectedResponsible = { needs_corroboration: 'scout', accepted_for_context: 'jefe', requires_human: 'lean' }[decision.state]
    return decision.schemaVersion === 'jefe-research-evidence/v1'
      && decision.evidenceId === expectedEvidenceId
      && decision.claimKind === 'claim'
      && decision.source === (receipt.url || 'controlled_provider_receipt')
      && decision.providerType === receipt.providerType
      && decision.contentHash === receipt.contentHash
      && decision.receiptStatus === receipt.status
      && ['hermes', 'scout'].includes(decision.actor)
      && decision.authority === 'technical_result'
      && decision.provenance === 'supervised_research_evidence_candidate'
      && decision.timestamp === receipt.receivedAt
      && decision.freshness === 'current_at_receipt'
      && decision.state === caseRecord.state
      && decision.nextResponsible === expectedResponsible
      && decision.classification === 'UNTRUSTED_EXTERNAL_CONTENT'
      && Array.isArray(decision.corroborations)
      && Array.isArray(decision.contradictions)
      && decision.limits && typeof decision.limits === 'object' && !Array.isArray(decision.limits)
      && canonical(decision.limits) === canonical(receipt.consumed || {})
  })
  const checkTerminalContribution = (attempt, evidenceCase) => {
    if (!['succeeded', 'partial'].includes(attempt.state) || !['received', 'partial'].includes(attempt.receipt?.status) || !attempt.delivery || !attempt.research) return
    const kind = 'connector_attempt'
    const receiptId = attempt.receipt.receiptId
    if (!evidenceCase || !Array.isArray(evidenceCase.receipts) || !Array.isArray(evidenceCase.contributions) || !Array.isArray(evidenceCase.evidenceDecisions)) {
      add('EVIDENCE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
      return
    }
    const storedReceipt = evidenceCase.receipts.find((item) => item.receiptId === receiptId)
    const storedRawReceipt = storedReceipt ? Object.fromEntries(Object.entries(storedReceipt).filter(([field]) => !['schemaVersion', 'receiptId', 'classification', 'receivedAt'].includes(field))) : null
    const requestRecord = (evidenceCase.requests || []).find((item) => item.researchRequestId === attempt.researchRequestId)
    const sourceAttempt = attemptsById.get(attempt.delivery.sourceAttemptId)
    if (!storedReceipt || storedReceipt.researchRequestId !== attempt.researchRequestId || storedReceipt.providerType !== attempt.providerType || storedReceipt.operation !== attempt.operation || storedReceipt.status !== attempt.receipt.status || canonical(storedRawReceipt) !== canonical(attempt.delivery.rawReceipt) || canonical(attempt.delivery.budget) !== canonical(requestRecord?.budget)) add('RECEIPT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
    if (!sourceAttempt || !validTimestamp(sourceAttempt.createdAt) || !validTimestamp(attempt.delivery.createdAt) || !validTimestamp(storedReceipt?.receivedAt) || !validTimestamp(attempt.delivery.deliveredAt) || !validTimestamp(attempt.updatedAt) || Date.parse(sourceAttempt.createdAt) > Date.parse(attempt.delivery.createdAt) || Date.parse(attempt.delivery.createdAt) > Date.parse(storedReceipt.receivedAt) || Date.parse(storedReceipt.receivedAt) > Date.parse(attempt.delivery.deliveredAt) || Date.parse(attempt.delivery.deliveredAt) > Date.parse(attempt.updatedAt)) add('RECEIPT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
    if ((attempt.state === 'partial') !== (attempt.receipt.status === 'partial')) add('RECEIPT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
    const contribution = evidenceCase.contributions.find((item) => item.receiptId === receiptId)
    if (!contribution || contribution.researchRequestId !== attempt.researchRequestId || contribution.claim !== attempt.delivery.claim) add('EVIDENCE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
    const compatibleResearchStates = new Set([evidenceCase.state])
    if (evidenceCase.state === 'accepted_for_context' && evidenceCase.memory?.status === 'appended') compatibleResearchStates.add('completed_with_evidence')
    if (!compatibleResearchStates.has(attempt.research.state)) add('EVIDENCE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
    const expectedEvidenceId = `evidence-${digest({ request: attempt.researchRequestId, receipt: receiptId, claim: attempt.delivery.claim }).slice(0, 32)}`
    if (attempt.research.evidenceId !== expectedEvidenceId || !caseHasEvidenceId(evidenceCase, expectedEvidenceId, attempt.delivery.deliveredAt)) add('EVIDENCE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.research.evidenceId || receiptId)
    if (!hasValidEvidenceDecision(evidenceCase)) add('EVIDENCE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, receiptId)
  }

  for (const session of research.records.filter((item) => target('research', item))) {
    const kind = 'research_session'
    const intake = intakesById.get(session.intakeId)
    if (!intake) add('MISSING_INTAKE', kind, session.researchSessionId, session.intakeId)
    else {
      checkIdentity(kind, session.researchSessionId, session.intakeId, session.identity, intake.identity)
      if (session.projectId !== intake.identity?.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, session.researchSessionId, session.intakeId)
      if (session.discoveryId !== discoveryIdFor(intake.intakeId)) add('DISCOVERY_REFERENCE_MISMATCH', kind, session.researchSessionId, session.intakeId)
    }
    const evidenceCase = session.evidenceCaseId ? casesById.get(session.evidenceCaseId) : null
    if (session.evidenceCaseId && !evidenceCase) add('MISSING_EVIDENCE_CASE', kind, session.researchSessionId, session.evidenceCaseId)
    if (evidenceCase) {
      checkIdentity(kind, session.researchSessionId, evidenceCase.evidenceCaseId, session.identity, evidenceCase.identity)
      if (session.projectId !== evidenceCase.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, session.researchSessionId, evidenceCase.evidenceCaseId)
      if (session.intakeId !== evidenceCase.intakeId) add('INTAKE_REFERENCE_MISMATCH', kind, session.researchSessionId, evidenceCase.evidenceCaseId)
      if (session.discoveryId !== evidenceCase.discoveryId) add('DISCOVERY_REFERENCE_MISMATCH', kind, session.researchSessionId, evidenceCase.evidenceCaseId)
      if (session.researchPlanId !== evidenceCase.researchPlanId) add('RESEARCH_PLAN_REFERENCE_MISMATCH', kind, session.researchSessionId, evidenceCase.evidenceCaseId)
      if (session.evidenceCaseId !== evidenceCase.evidenceCaseId) add('EVIDENCE_CASE_REFERENCE_MISMATCH', kind, session.researchSessionId, evidenceCase.evidenceCaseId)
      const request = (evidenceCase.requests || []).find((item) => item.researchRequestId === session.researchRequestId)
      if (!request) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', kind, session.researchSessionId, session.researchRequestId)
      else {
        checkIdentity(kind, session.researchSessionId, session.researchRequestId, session.identity, request.identity)
        checkRequest(kind, session.researchSessionId, session.researchRequestId, session, request)
      }
    }
  }

  for (const evidenceCase of evidenceCases.records.filter((item) => target('evidenceCases', item))) {
    const kind = 'evidence_case'
    const intake = intakesById.get(evidenceCase.intakeId)
    if (!intake) add('MISSING_INTAKE', kind, evidenceCase.evidenceCaseId, evidenceCase.intakeId)
    else {
      checkIdentity(kind, evidenceCase.evidenceCaseId, evidenceCase.intakeId, evidenceCase.identity, intake.identity)
      if (evidenceCase.projectId !== intake.identity?.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, evidenceCase.evidenceCaseId, evidenceCase.intakeId)
      if (evidenceCase.discoveryId !== discoveryIdFor(intake.intakeId)) add('DISCOVERY_REFERENCE_MISMATCH', kind, evidenceCase.evidenceCaseId, evidenceCase.intakeId)
    }
    for (const request of evidenceCase.requests || []) {
      checkIdentity(kind, evidenceCase.evidenceCaseId, request.researchRequestId, evidenceCase.identity, request.identity)
      const session = sessionsByRequest.get(request.researchRequestId)
      if (!session) add('MISSING_RESEARCH_SESSION', kind, evidenceCase.evidenceCaseId, request.researchRequestId)
      else {
        if (session.evidenceCaseId !== evidenceCase.evidenceCaseId) add('CROSS_EVIDENCE_CASE_REFERENCE', kind, evidenceCase.evidenceCaseId, request.researchRequestId)
        checkIdentity(kind, evidenceCase.evidenceCaseId, request.researchRequestId, evidenceCase.identity, session.identity)
        if (session.projectId !== evidenceCase.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, evidenceCase.evidenceCaseId, request.researchRequestId)
        if (session.intakeId !== evidenceCase.intakeId) add('INTAKE_REFERENCE_MISMATCH', kind, evidenceCase.evidenceCaseId, request.researchRequestId)
        if (session.discoveryId !== evidenceCase.discoveryId) add('DISCOVERY_REFERENCE_MISMATCH', kind, evidenceCase.evidenceCaseId, request.researchRequestId)
        if (session.researchPlanId !== evidenceCase.researchPlanId) add('RESEARCH_PLAN_REFERENCE_MISMATCH', kind, evidenceCase.evidenceCaseId, request.researchRequestId)
        checkRequest(kind, evidenceCase.evidenceCaseId, request.researchRequestId, session, request)
        const projectionState = sessionProjectionState(evidenceCase, request, session)
        if (projectionState === 'repairable') add('RESEARCH_SESSION_PROJECTION_DRIFT', kind, evidenceCase.evidenceCaseId, session.researchSessionId)
        if (projectionState === 'conflict') add('RESEARCH_SESSION_PROJECTION_CONFLICT', kind, evidenceCase.evidenceCaseId, session.researchSessionId)
      }
    }
  }

  for (const attempt of connectorAttempts.records.filter((item) => target('connectorAttempts', item))) {
    const kind = 'connector_attempt'
    checkAttemptLineage(attempt)
    const session = sessionsByRequest.get(attempt.researchRequestId)
    if (!session) add('MISSING_RESEARCH_SESSION', kind, attempt.connectorAttemptId, attempt.researchRequestId)
    else {
      if (session.researchSessionId !== attempt.researchSessionId || !sessionsById.has(attempt.researchSessionId)) add('RESEARCH_SESSION_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
      if (attempt.projectId !== session.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
      if (attempt.discoveryId !== session.discoveryId) add('DISCOVERY_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
      if (attempt.providerType !== session.providerType) add('PROVIDER_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
      const intake = intakesById.get(session.intakeId)
      if (!intake) add('MISSING_INTAKE', kind, attempt.connectorAttemptId, session.intakeId)
      else {
        if (attempt.projectId !== intake.identity?.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, intake.intakeId)
        if (attempt.discoveryId !== discoveryIdFor(intake.intakeId)) add('DISCOVERY_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, intake.intakeId)
      }
      const evidenceCase = casesById.get(session.evidenceCaseId)
      if (session.evidenceCaseId && !evidenceCase) add('MISSING_EVIDENCE_CASE', kind, attempt.connectorAttemptId, session.evidenceCaseId)
      if (evidenceCase && attempt.projectId !== evidenceCase.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, evidenceCase.evidenceCaseId)
      checkTerminalContribution(attempt, evidenceCase)
      const definition = CONNECTORS[attempt.providerType]
      if (!definition || attempt.connectorId !== definition.connectorId || !definition.supportedOperations.includes(attempt.operation)) add('CONNECTOR_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
      if (attempt.delivery) {
        const expected = { researchSessionId: session.researchSessionId, researchRequestId: session.researchRequestId, researchPlanId: session.researchPlanId, evidenceCaseId: session.evidenceCaseId, discoveryId: attempt.discoveryId, projectId: attempt.projectId, providerType: attempt.providerType, connectorId: attempt.connectorId, operation: attempt.operation }
        if (attempt.delivery.researchSessionId !== expected.researchSessionId) add('RESEARCH_SESSION_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.researchRequestId !== expected.researchRequestId) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.researchPlanId !== expected.researchPlanId) add('RESEARCH_PLAN_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.evidenceCaseId !== expected.evidenceCaseId) add('EVIDENCE_CASE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.discoveryId !== expected.discoveryId) add('DISCOVERY_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.projectId !== expected.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.providerType !== expected.providerType) add('PROVIDER_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
        if (attempt.delivery.connectorId !== expected.connectorId || attempt.delivery.operation !== expected.operation) add('CONNECTOR_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.delivery.deliveryId)
      }
      if (attempt.research) {
        if (attempt.research.researchRequestId !== attempt.researchRequestId || attempt.research.receiptId !== attempt.receipt?.receiptId) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
        if (attempt.research.researchPlanId !== undefined && attempt.research.researchPlanId !== session.researchPlanId) add('RESEARCH_PLAN_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
        if (attempt.research.evidenceCaseId !== undefined && attempt.research.evidenceCaseId !== session.evidenceCaseId) add('EVIDENCE_CASE_REFERENCE_MISMATCH', kind, attempt.connectorAttemptId, attempt.researchRequestId)
      }
    }
  }

  for (const flow of executionFlows.records.filter((item) => target('executionFlows', item))) {
    const kind = 'execution_flow'
    const intake = intakesById.get(flow.intakeId)
    if (!intake) add('MISSING_INTAKE', kind, flow.executionFlowId, flow.intakeId)
    else checkIdentity(kind, flow.executionFlowId, flow.intakeId, flow.identity, intake.identity)
    const evidenceCase = flow.evidenceCaseId ? casesById.get(flow.evidenceCaseId) : null
    if (flow.evidenceCaseId && !evidenceCase) add('MISSING_EVIDENCE_CASE', kind, flow.executionFlowId, flow.evidenceCaseId)
    if (evidenceCase) {
      checkIdentity(kind, flow.executionFlowId, evidenceCase.evidenceCaseId, flow.identity, evidenceCase.identity)
      if (flow.intakeId !== evidenceCase.intakeId) add('INTAKE_REFERENCE_MISMATCH', kind, flow.executionFlowId, evidenceCase.evidenceCaseId)
      if (flow.researchPlanId !== evidenceCase.researchPlanId) add('RESEARCH_PLAN_REFERENCE_MISMATCH', kind, flow.executionFlowId, evidenceCase.evidenceCaseId)
      if (flow.evidenceCaseId !== evidenceCase.evidenceCaseId) add('EVIDENCE_CASE_REFERENCE_MISMATCH', kind, flow.executionFlowId, evidenceCase.evidenceCaseId)
    }
    for (const reference of flow.requestRefs || []) {
      const session = sessionsByRequest.get(reference.researchRequestId)
      if (!session) add('MISSING_RESEARCH_SESSION', kind, flow.executionFlowId, reference.researchRequestId)
      else {
        checkIdentity(kind, flow.executionFlowId, reference.researchRequestId, flow.identity, session.identity)
        if (reference.role !== session.request?.role) add('ROLE_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
        if (session.researchPlanId !== flow.researchPlanId) add('RESEARCH_PLAN_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
        if (session.evidenceCaseId !== flow.evidenceCaseId) add('EVIDENCE_CASE_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
        if (session.intakeId !== flow.intakeId) add('INTAKE_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
        const packageRef = flow.packageRefs?.[reference.role]
        if (!packageRef || packageRef.packageId !== session.packageId) add('PACKAGE_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
        if (!packageRef || packageRef.handoffId !== session.handoffId) add('HANDOFF_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
        const caseRequest = caseRequestById.get(reference.researchRequestId)
        if (!caseRequest || caseRequest.caseRecord.evidenceCaseId !== flow.evidenceCaseId || caseRequest.request.role !== reference.role) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.researchRequestId)
      }
    }
    for (const reference of flow.attemptRefs || []) {
      const attempt = attemptsById.get(reference.connectorAttemptId)
      if (!attempt) add('MISSING_CONNECTOR_ATTEMPT', kind, flow.executionFlowId, reference.connectorAttemptId)
      else {
        if (attempt.researchRequestId !== reference.researchRequestId) add('RESEARCH_REQUEST_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.connectorAttemptId)
        const session = sessionsByRequest.get(attempt.researchRequestId)
        if (!session || attempt.researchSessionId !== session.researchSessionId) add('RESEARCH_SESSION_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.connectorAttemptId)
        else checkIdentity(kind, flow.executionFlowId, reference.connectorAttemptId, flow.identity, session.identity)
        if (attempt.projectId !== flow.identity?.projectId) add('PROJECT_REFERENCE_MISMATCH', kind, flow.executionFlowId, reference.connectorAttemptId)
      }
    }
  }
  const unique = new Map(issues.map((item) => [canonical(item), item]))
  return [...unique.values()].sort((left, right) => left.kind.localeCompare(right.kind) || left.recordId.localeCompare(right.recordId) || left.code.localeCompare(right.code) || String(left.relatedId).localeCompare(String(right.relatedId)))
}

function statusFromDiagnosis(diagnosis) {
  const recoveryCandidates = diagnosis.pending.connectorAttempts.length + diagnosis.pending.researchCases.length + diagnosis.pending.executionFlows.length
  const explicitBoundaries = diagnosis.boundaries.deliveryPending.length + diagnosis.boundaries.readyForExplicitExecution.length + diagnosis.boundaries.preparationPending.length
  const humanBoundaries = diagnosis.boundaries.requiresHuman.length
  const corroborationBoundaries = diagnosis.boundaries.needsCorroboration.length
  const healthUnknown = diagnosis.connectors.filter((item) => item.operationalState === 'health_unknown').length
  const healthRepairs = diagnosis.connectorHealth.items.filter((item) => item.repairRequired).length
  const healthSourceIncomplete = diagnosis.connectorHealth.items.filter((item) => item.sourceIntegrity !== 'complete').length
  const indexRepairs = diagnosis.indexes.filter((item) => item.repairRequired).length
  const blockers = []
  if (diagnosis.corruptions.length > 0) blockers.push('CORRUPTION_PRESENT')
  if (diagnosis.integrityIssues.length > 0) blockers.push('INTEGRITY_ISSUES_PRESENT')
  if (recoveryCandidates > 0) blockers.push('RECOVERY_PENDING')
  if (healthUnknown > 0) blockers.push('CONNECTOR_HEALTH_UNKNOWN')
  if (healthRepairs > 0) blockers.push('CONNECTOR_HEALTH_REPAIR_REQUIRED')
  if (healthSourceIncomplete > 0) blockers.push('CONNECTOR_HEALTH_SOURCE_INCOMPLETE')
  if (indexRepairs > 0) blockers.push('DERIVED_INDEX_REPAIR_REQUIRED')
  let state = 'healthy'
  if (diagnosis.corruptions.length > 0 || diagnosis.integrityIssues.length > 0 || healthSourceIncomplete > 0) state = 'degraded'
  else if (recoveryCandidates > 0 || healthUnknown > 0 || healthRepairs > 0 || indexRepairs > 0) state = 'recovery_required'
  else if (humanBoundaries > 0) state = 'human_action_required'
  else if (explicitBoundaries > 0) state = 'explicit_execution_required'
  else if (corroborationBoundaries > 0) state = 'corroboration_required'
  return deepFreeze({
    schemaVersion: STATUS_SCHEMA,
    projectId: diagnosis.projectId,
    snapshotFingerprint: diagnosis.snapshotFingerprint,
    state,
    recoveryCandidates,
    explicitBoundaries,
    humanBoundaries,
    corroborationBoundaries,
    corruptionCount: diagnosis.corruptions.length,
    integrityIssueCount: diagnosis.integrityIssues.length,
    healthUnknown,
    healthRepairs,
    healthSourceIncomplete,
    indexRepairs,
    recoveryGate: { state: blockers.length > 0 ? 'blocked' : 'clear', blockers },
    safety: { adaptersExecuted: 0, providersExecuted: 0, humanDecisionsApplied: 0, recordsDeleted: 0 },
  })
}

function recoveryOperations(diagnosis, limit) {
  const selectedConnectors = diagnosis.pending.connectorAttempts.slice(0, limit)
  const connectorCandidates = selectedConnectors.map((item) => ({ connectorAttemptId: item.connectorAttemptId, revision: item.revision, state: item.state, deliveryId: item.deliveryId }))
  const selectedResearch = diagnosis.pending.researchCases.slice(0, limit).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId))
  const researchCandidates = selectedResearch.map((item) => ({ evidenceCaseId: item.evidenceCaseId, revision: item.revision, state: item.state, fingerprint: item.fingerprint }))
  const deferredAttemptIds = new Set(diagnosis.pending.connectorAttempts.map((item) => item.connectorAttemptId))
  const deferredCaseIds = new Set([
    ...diagnosis.pending.connectorAttempts.map((item) => item.evidenceCaseId).filter(Boolean),
    ...diagnosis.pending.researchCases.map((item) => item.evidenceCaseId),
  ])
  const executionCandidates = diagnosis.pending.executionFlows
    .filter((item) => !deferredAttemptIds.has(item.connectorAttemptSnapshot?.connectorAttemptId) && !deferredCaseIds.has(item.evidenceCaseSnapshot?.evidenceCaseId))
    .slice(0, limit)
    .map((item) => ({ executionFlowId: item.executionFlowId, revision: item.revision, state: item.state, fingerprint: item.fingerprint, evidenceCaseSnapshot: item.evidenceCaseSnapshot, connectorAttemptSnapshot: item.connectorAttemptSnapshot }))
  const operations = [
    { type: 'reconcile_connector_attempts', scope: 'project', mode: 'bounded_batch', limit, candidates: connectorCandidates, candidateCount: connectorCandidates.length, repairRequired: connectorCandidates.length > 0 },
    { type: 'reconcile_pending_research', scope: 'project', mode: 'bounded_batch', limit, candidates: researchCandidates, candidateCount: researchCandidates.length, repairRequired: researchCandidates.length > 0 },
    { type: 'reconcile_execution_flows', scope: 'project', mode: 'bounded_batch', limit, candidates: executionCandidates, candidateCount: executionCandidates.length, repairRequired: executionCandidates.length > 0 },
    ...INDEX_OPERATIONS.map((item) => {
      const inspected = diagnosis.indexes.find((index) => index.store === item.store)
      return { type: item.type, scope: 'authority_root', mode: 'full_rebuild', limit: null, candidates: null, candidateCount: inspected.expectedRecordCount, repairRequired: inspected.repairRequired }
    }),
    { type: 'rebuild_connector_health', scope: 'authority_root', mode: 'full_rebuild', limit: null, candidates: null, candidateCount: diagnosis.connectorHealth.items.length, repairRequired: diagnosis.connectorHealth.items.some((item) => item.repairRequired) },
  ]
  return operations.map((operation, index) => ({ sequence: index + 1, ...operation }))
}

function recoveryPlan(diagnosis, limit) {
  const base = {
    schemaVersion: PLAN_SCHEMA,
    projectId: diagnosis.projectId,
    snapshotFingerprint: diagnosis.snapshotFingerprint,
    batchLimit: limit,
    operations: recoveryOperations(diagnosis, limit),
    safety: { adaptersAllowed: false, providersAllowed: false, humanResolutionAllowed: false, deletionsAllowed: false, corruptionsPreserved: true },
  }
  return deepFreeze({ ...base, recoveryPlanId: `research-recovery-${digest(base).slice(0, 32)}` })
}

function validatePlanShape(value) {
  const fields = ['schemaVersion', 'projectId', 'snapshotFingerprint', 'batchLimit', 'operations', 'safety', 'recoveryPlanId']
  if (!plainObject(value) || canonical(Object.keys(value).sort()) !== canonical(fields.sort()) || value.schemaVersion !== PLAN_SCHEMA || !RECOVERY_PLAN_ID.test(value.recoveryPlanId) || !/^[a-f0-9]{64}$/u.test(value.snapshotFingerprint)) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
  projectId(value.projectId)
  batchLimit(value.batchLimit)
  if (!Array.isArray(value.operations) || value.operations.length !== OPERATION_TYPES.length) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
  const operationFields = ['sequence', 'type', 'scope', 'mode', 'limit', 'candidates', 'candidateCount', 'repairRequired']
  const fingerprints = /^[a-f0-9]{64}$/u
  for (let index = 0; index < value.operations.length; index += 1) {
    const operation = value.operations[index]
    if (!exactKeys(operation, operationFields) || operation.sequence !== index + 1 || operation.type !== OPERATION_TYPES[index] || !Number.isSafeInteger(operation.candidateCount) || operation.candidateCount < 0 || typeof operation.repairRequired !== 'boolean') fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
    if (index < 3) {
      if (operation.scope !== 'project' || operation.mode !== 'bounded_batch' || operation.limit !== value.batchLimit || !Array.isArray(operation.candidates) || operation.candidates.length !== operation.candidateCount || operation.candidates.length > value.batchLimit || operation.repairRequired !== (operation.candidateCount > 0)) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
      let previous = null
      for (const candidate of operation.candidates) {
        const idField = index === 0 ? 'connectorAttemptId' : index === 1 ? 'evidenceCaseId' : 'executionFlowId'
        const candidateFields = index === 0 ? [idField, 'revision', 'state', 'deliveryId'] : index === 1 ? [idField, 'revision', 'state', 'fingerprint'] : [idField, 'revision', 'state', 'fingerprint', 'evidenceCaseSnapshot', 'connectorAttemptSnapshot']
        const idPattern = index === 0 ? /^connector-attempt-[a-f0-9]{32}$/u : index === 1 ? /^evidence-case-[a-f0-9]{32}$/u : /^research-execution-[a-f0-9]{32}$/u
        const allowedStates = index === 0 ? new Set(['running', 'contributing']) : index === 1 ? new Set(['preparing', 'ready', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'evidence_pending']) : ACTIONABLE_FLOW_STATES
        if (!exactKeys(candidate, candidateFields) || !idPattern.test(candidate[idField]) || !Number.isSafeInteger(candidate.revision) || candidate.revision < 0 || !allowedStates.has(candidate.state) || (index === 0 ? candidate.deliveryId !== null && !/^connector-delivery-[a-f0-9]{32}$/u.test(candidate.deliveryId) : !fingerprints.test(candidate.fingerprint)) || (previous !== null && previous.localeCompare(candidate[idField]) >= 0)) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
        if (index === 2) {
          const caseSnapshot = candidate.evidenceCaseSnapshot
          const attemptSnapshot = candidate.connectorAttemptSnapshot
          if (caseSnapshot !== null) {
            if (!exactKeys(caseSnapshot, ['evidenceCaseId', 'revision', 'state', 'fingerprint']) || !/^evidence-case-[a-f0-9]{32}$/u.test(caseSnapshot.evidenceCaseId)) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
            const missingCase = caseSnapshot.revision === null && caseSnapshot.state === null && caseSnapshot.fingerprint === null
            const presentCase = Number.isSafeInteger(caseSnapshot.revision) && caseSnapshot.revision >= 0 && typeof caseSnapshot.state === 'string' && fingerprints.test(caseSnapshot.fingerprint)
            if (!missingCase && !presentCase) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
          }
          if (attemptSnapshot !== null) {
            if (!exactKeys(attemptSnapshot, ['connectorAttemptId', 'revision', 'state', 'deliveryId', 'deliveryState', 'fingerprint']) || !/^connector-attempt-[a-f0-9]{32}$/u.test(attemptSnapshot.connectorAttemptId)) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
            const missingAttempt = attemptSnapshot.revision === null && attemptSnapshot.state === null && attemptSnapshot.deliveryId === null && attemptSnapshot.deliveryState === null && attemptSnapshot.fingerprint === null
            const presentAttempt = Number.isSafeInteger(attemptSnapshot.revision) && attemptSnapshot.revision >= 0 && ATTEMPT_STATES.includes(attemptSnapshot.state) && (attemptSnapshot.deliveryId === null || /^connector-delivery-[a-f0-9]{32}$/u.test(attemptSnapshot.deliveryId)) && (attemptSnapshot.deliveryState === null || ['pending', 'delivered'].includes(attemptSnapshot.deliveryState)) && fingerprints.test(attemptSnapshot.fingerprint)
            if (!missingAttempt && !presentAttempt) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
          }
        }
        previous = candidate[idField]
      }
    } else if (operation.scope !== 'authority_root' || operation.mode !== 'full_rebuild' || operation.limit !== null || operation.candidates !== null) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
  }
  if (!exactKeys(value.safety, ['adaptersAllowed', 'providersAllowed', 'humanResolutionAllowed', 'deletionsAllowed', 'corruptionsPreserved']) || value.safety.adaptersAllowed !== false || value.safety.providersAllowed !== false || value.safety.humanResolutionAllowed !== false || value.safety.deletionsAllowed !== false || value.safety.corruptionsPreserved !== true) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
  const { recoveryPlanId, ...seed } = value
  if (recoveryPlanId !== `research-recovery-${digest(seed).slice(0, 32)}`) fail('INVALID_RECOVERY_PLAN', 'Plan de recovery invalido.')
  return value
}

function indexResult(operation, result, specification) {
  if (!plainObject(result) || !plainObject(result.index)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Resultado de indice invalido.')
  const identifiers = result.index[specification.idsField]
  if (!Array.isArray(identifiers) || identifiers.some((id) => typeof id !== 'string')) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Resultado de indice invalido.')
  const corruptions = Array.isArray(result.index.corruptions) ? result.index.corruptions.length : 0
  return {
    sequence: operation.sequence,
    type: operation.type,
    status: 'completed',
    processed: identifiers.length,
    remaining: 0,
    idempotent: result.idempotent === true,
    recovered: result.recovered === true ? 1 : 0,
    corruptionCount: corruptions,
    adaptersExecuted: 0,
    errorCode: null,
  }
}

function failedOperation(operation, error) {
  return {
    sequence: operation.sequence,
    type: operation.type,
    status: 'failed',
    processed: 0,
    remaining: operation.candidateCount,
    idempotent: null,
    recovered: 0,
    corruptionCount: 0,
    adaptersExecuted: 0,
    errorCode: operationErrorCode(error?.code),
  }
}

function createSupervisedResearchRecovery(options = {}) {
  const optionFields = ['discoveryPersistence', 'researchPersistence', 'evidenceCasePersistence', 'connectorPersistence', 'connectorRuntime', 'research', 'executionPersistence', 'executionFlow']
  if (!plainObject(options) || canonical(Object.keys(options).sort()) !== canonical([...optionFields].sort())) fail('INVALID_RECOVERY_OPTIONS', 'Dependencias de recovery invalidas.')
  const discoveryPersistence = dependency(options.discoveryPersistence, ['listAllDetailed', 'rebuildIndex'], 'discoveryPersistence', true)
  const researchPersistence = dependency(options.researchPersistence, ['listDetailed', 'rebuildIndex'], 'researchPersistence', true)
  const evidenceCasePersistence = dependency(options.evidenceCasePersistence, ['listDetailed', 'rebuildIndex'], 'evidenceCasePersistence', true)
  const connectorPersistence = dependency(options.connectorPersistence, ['listAllDetailed', 'rebuildIndex'], 'connectorPersistence', true)
  const connectorRuntime = dependency(options.connectorRuntime, ['reconcileAttempts', 'rebuildAllConnectorHealth', 'inspectConnectorHealth', 'getConnectorOperationalStatus'], 'connectorRuntime')
  const research = dependency(options.research, ['reconcilePendingResearch'], 'research')
  const executionPersistence = dependency(options.executionPersistence, ['listDetailed', 'rebuildIndex'], 'executionPersistence', true)
  const executionFlow = dependency(options.executionFlow, ['reconcileFlows'], 'executionFlow')
  const roots = [...new Set([discoveryPersistence, researchPersistence, evidenceCasePersistence, connectorPersistence, executionPersistence].map((item) => physicalRootKey(item.authorityRoot)))].sort()
  const authorityLockKeys = roots.map((root) => `${root}::authority-root`)
  const projectLockKey = (safeProjectId) => `${roots.join('|')}::project::${safeProjectId}`
  const providers = Object.keys(CONNECTORS).sort()
  const persistenceByStore = { discovery: discoveryPersistence, research: researchPersistence, evidenceCases: evidenceCasePersistence, connectorAttempts: connectorPersistence, executionFlows: executionPersistence }

  async function collectRecoverySnapshot() {
    const values = await Promise.all([
      discoveryPersistence.listAllDetailed(),
      researchPersistence.listDetailed(),
      evidenceCasePersistence.listDetailed(),
      connectorPersistence.listAllDetailed(),
      executionPersistence.listDetailed(),
      ...providers.map((providerType) => connectorRuntime.getConnectorOperationalStatus(providerType)),
      connectorRuntime.inspectConnectorHealth(),
      ...INDEX_OPERATIONS.map((specification) => readIndexSource(persistenceByStore[specification.store].authorityRoot, specification.fileName)),
    ])
    const statusStart = 5
    const healthIndex = statusStart + providers.length
    const snapshot = {
      stores: {
        discovery: values[0],
        research: values[1],
        evidenceCases: values[2],
        connectorAttempts: values[3],
        executionFlows: values[4],
      },
      connectorStatuses: values.slice(statusStart, healthIndex),
      connectorHealth: values[healthIndex],
      indexSources: values.slice(healthIndex + 1),
    }
    try {
      const serialized = canonical(snapshot)
      return { snapshot: JSON.parse(serialized), serialized }
    } catch {
      fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Snapshot de recovery invalido.')
    }
  }

  async function stableRecoverySnapshot() {
    let previous = await collectRecoverySnapshot()
    for (let collect = 1; collect < SNAPSHOT_MAX_COLLECTS; collect += 1) {
      const current = await collectRecoverySnapshot()
      if (current.serialized === previous.serialized) return current.snapshot
      previous = current
    }
    fail('RECOVERY_SNAPSHOT_UNSTABLE', 'El snapshot durable cambio durante el diagnostico.')
  }

  async function diagnoseRecovery(input) {
    exactInput(input, ['projectId'])
    const safeProjectId = projectId(input.projectId)
    const snapshot = await stableRecoverySnapshot()
    const connectorStatuses = snapshot.connectorStatuses.map((value, index) => connectorStatus(value, providers[index]))
    const connectorHealth = connectorHealthInspection(snapshot.connectorHealth, providers, connectorStatuses)
    const allStores = {
      discovery: detail(snapshot.stores.discovery, 'discovery'),
      research: detail(snapshot.stores.research, 'research'),
      evidenceCases: detail(snapshot.stores.evidenceCases, 'evidenceCases'),
      connectorAttempts: detail(snapshot.stores.connectorAttempts, 'connectorAttempts'),
      executionFlows: detail(snapshot.stores.executionFlows, 'executionFlows'),
    }
    if (!Array.isArray(snapshot.indexSources) || snapshot.indexSources.length !== INDEX_OPERATIONS.length) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Fuentes de indices invalidas.')
    const indexes = INDEX_OPERATIONS.map((specification, index) => inspectIndex(specification, snapshot.indexSources[index], allStores[specification.store]))
    const stores = Object.fromEntries(Object.entries(allStores).map(([store, value]) => [store, {
      records: value.records.filter((record) => recordProject(store, record) === safeProjectId),
      corruptions: value.corruptions,
    }]))
    const corruptions = [
      ...corruptionItems('discovery', stores.discovery.corruptions),
      ...corruptionItems('research', stores.research.corruptions),
      ...corruptionItems('evidenceCases', stores.evidenceCases.corruptions),
      ...corruptionItems('connectorAttempts', stores.connectorAttempts.corruptions),
      ...corruptionItems('executionFlows', stores.executionFlows.corruptions),
    ].sort((left, right) => left.store.localeCompare(right.store) || left.recordId.localeCompare(right.recordId))
    const allSessionsByRequest = new Map(allStores.research.records.map((item) => [item.researchRequestId, item]))
    const allSessionsById = new Map(allStores.research.records.map((item) => [item.researchSessionId, item]))
    const allCasesById = new Map(allStores.evidenceCases.records.map((item) => [item.evidenceCaseId, item]))
    const allCasesByPlan = new Map(allStores.evidenceCases.records.map((item) => [item.researchPlanId, item]))
    const allAttemptsById = new Map(allStores.connectorAttempts.records.map((item) => [item.connectorAttemptId, item]))
    const corruptionIds = Object.fromEntries(Object.keys(CORRUPTION_SPECS).map((store) => [store, new Set(corruptions.filter((item) => item.store === store).map((item) => item.recordId))]))
    const recoverableMissingSession = (currentIssue) => {
      if (currentIssue.code !== 'MISSING_RESEARCH_SESSION' || currentIssue.kind !== 'evidence_case') return false
      const evidenceCase = allCasesById.get(currentIssue.recordId)
      if (!evidenceCase || !(evidenceCase.state === 'preparing' || evidenceCase.pendingOperations.includes('complete_plan') || evidenceCase.pendingOperations.includes('sync_request_sessions'))) return false
      const expectedSessionId = `research-session-${digest(currentIssue.relatedId).slice(0, 32)}`
      return !corruptionIds.research.has(expectedSessionId)
    }
    const detectedIntegrityIssues = integrityIssues(allStores, safeProjectId).filter((currentIssue) => !recoverableMissingSession(currentIssue))
    const integrityByRecord = new Map()
    for (const currentIssue of detectedIntegrityIssues) {
      const key = `${currentIssue.kind}:${currentIssue.recordId}`
      if (!integrityByRecord.has(key)) integrityByRecord.set(key, [])
      integrityByRecord.get(key).push(currentIssue)
    }
    const issuesFor = (kind, recordId) => integrityByRecord.get(`${kind}:${recordId}`) || []
    const repairableIssue = (currentIssue) => currentIssue.code === 'RESEARCH_SESSION_PROJECTION_DRIFT' && currentIssue.kind === 'evidence_case'
    const blockingIssuesFor = (kind, recordId) => issuesFor(kind, recordId).filter((currentIssue) => !repairableIssue(currentIssue))
    const sessionsByRequest = new Map(stores.research.records.map((item) => [item.researchRequestId, item]))
    const casesById = new Map(stores.evidenceCases.records.map((item) => [item.evidenceCaseId, item]))
    const corruptionKinds = { discovery: 'intake', research: 'research_session', evidenceCases: 'evidence_case', connectorAttempts: 'connector_attempt', executionFlows: 'execution_flow' }
    const corruptDependency = (store, recordId) => corruptionIds[store].has(recordId) ? [{ code: 'CORRUPT_DEPENDENCY', kind: corruptionKinds[store], recordId, relatedId: null }] : []
    const recoveryBlockedByRecord = new Map()
    const registerRecoveryBlock = (kind, recordId, rawBlockers) => {
      if (!RECOVERY_BLOCKER_KINDS.has(kind) || !SAFE_RECORD_ID.test(recordId) || rawBlockers.some((item) => !exactKeys(item, ['code', 'kind', 'recordId', 'relatedId']) || !RECOVERY_BLOCKER_CODES.has(item.code) || !RECOVERY_BLOCKER_KINDS.has(item.kind) || !SAFE_RECORD_ID.test(item.recordId) || (item.relatedId !== null && !SAFE_RECORD_ID.test(item.relatedId)))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Boundary de recovery invalida.')
      const key = `${kind}:${recordId}`
      const prior = recoveryBlockedByRecord.get(key)?.blockers || []
      const unique = new Map([...prior, ...rawBlockers].map((item) => [canonical(item), item]))
      const blockers = [...unique.values()].sort((left, right) => left.kind.localeCompare(right.kind) || left.recordId.localeCompare(right.recordId) || left.code.localeCompare(right.code) || String(left.relatedId).localeCompare(String(right.relatedId)))
      if (blockers.length === 0) return false
      recoveryBlockedByRecord.set(key, { kind, recordId, blockers })
      return true
    }
    for (const corruption of corruptions) registerRecoveryBlock(corruptionKinds[corruption.store], corruption.recordId, [{ code: corruption.code, kind: corruptionKinds[corruption.store], recordId: corruption.recordId, relatedId: null }])
    for (const currentIssue of detectedIntegrityIssues.filter((item) => !repairableIssue(item))) registerRecoveryBlock(currentIssue.kind, currentIssue.recordId, [currentIssue])
    const attemptBlockers = (item) => {
      const requestSession = allSessionsByRequest.get(item.researchRequestId)
      const referencedSession = allSessionsById.get(item.researchSessionId)
      const sessions = [...new Map([requestSession, referencedSession].filter(Boolean).map((record) => [record.researchSessionId, record])).values()]
      const evidenceCases = [...new Map(sessions.map((session) => allCasesById.get(session.evidenceCaseId)).filter(Boolean).map((record) => [record.evidenceCaseId, record])).values()]
      const lineageIds = [...new Set([item.rootAttemptId, item.retryOfAttemptId].filter((attemptId) => typeof attemptId === 'string'))]
      const lineageAttempts = lineageIds.map((attemptId) => allAttemptsById.get(attemptId)).filter(Boolean)
      return [
        ...blockingIssuesFor('connector_attempt', item.connectorAttemptId),
        ...lineageAttempts.flatMap((attempt) => blockingIssuesFor('connector_attempt', attempt.connectorAttemptId)),
        ...sessions.flatMap((session) => blockingIssuesFor('research_session', session.researchSessionId)),
        ...evidenceCases.flatMap((record) => blockingIssuesFor('evidence_case', record.evidenceCaseId)),
        ...corruptDependency('research', item.researchSessionId),
        ...sessions.flatMap((session) => session.evidenceCaseId ? corruptDependency('evidenceCases', session.evidenceCaseId) : []),
        ...lineageIds.flatMap((attemptId) => corruptDependency('connectorAttempts', attemptId)),
      ]
    }
    const caseBlockers = (item) => {
      const sessionRepairJournal = item.state === 'preparing' || item.pendingOperations.includes('complete_plan') || item.pendingOperations.includes('sync_request_sessions')
      const expectedSessionIds = (item.requests || []).map((request) => ({ requestId: request.researchRequestId, sessionId: `research-session-${digest(request.researchRequestId).slice(0, 32)}` }))
      const ownIssues = blockingIssuesFor('evidence_case', item.evidenceCaseId).filter((currentIssue) => currentIssue.code !== 'MISSING_RESEARCH_SESSION' || !sessionRepairJournal || corruptionIds.research.has(expectedSessionIds.find((entry) => entry.requestId === currentIssue.relatedId)?.sessionId))
      const sessions = (item.requests || []).map((request) => allSessionsByRequest.get(request.researchRequestId)).filter(Boolean)
      return [
        ...ownIssues,
        ...sessions.flatMap((session) => blockingIssuesFor('research_session', session.researchSessionId)),
        ...expectedSessionIds.flatMap((entry) => corruptDependency('research', entry.sessionId)),
      ]
    }
    const flowBlockers = (item) => {
      const evidenceCases = [...new Map([item.evidenceCaseId ? allCasesById.get(item.evidenceCaseId) : null, item.researchPlanId ? allCasesByPlan.get(item.researchPlanId) : null].filter(Boolean).map((record) => [record.evidenceCaseId, record])).values()]
      const sessions = (item.requestRefs || []).map((reference) => allSessionsByRequest.get(reference.researchRequestId)).filter(Boolean)
      const attempts = (item.attemptRefs || []).map((reference) => allAttemptsById.get(reference.connectorAttemptId)).filter(Boolean)
      const expectedSessionIds = (item.requestRefs || []).map((reference) => `research-session-${digest(reference.researchRequestId).slice(0, 32)}`)
      return [
        ...blockingIssuesFor('execution_flow', item.executionFlowId),
        ...evidenceCases.flatMap((evidenceCase) => blockingIssuesFor('evidence_case', evidenceCase.evidenceCaseId)),
        ...sessions.flatMap((session) => blockingIssuesFor('research_session', session.researchSessionId)),
        ...attempts.flatMap((attempt) => blockingIssuesFor('connector_attempt', attempt.connectorAttemptId)),
        ...corruptDependency('discovery', item.intakeId),
        ...(item.evidenceCaseId ? corruptDependency('evidenceCases', item.evidenceCaseId) : []),
        ...expectedSessionIds.flatMap((sessionId) => corruptDependency('research', sessionId)),
        ...(item.attemptRefs || []).flatMap((reference) => corruptDependency('connectorAttempts', reference.connectorAttemptId)),
      ]
    }
    const connectorAttempts = []
    for (const item of stores.connectorAttempts.records.filter((record) => ['running', 'contributing'].includes(record.state)).sort((left, right) => left.connectorAttemptId.localeCompare(right.connectorAttemptId))) {
      if (registerRecoveryBlock('connector_attempt', item.connectorAttemptId, attemptBlockers(item))) continue
      connectorAttempts.push({ connectorAttemptId: item.connectorAttemptId, revision: item.revision, state: item.state, deliveryId: item.delivery?.deliveryId || null, deliveryState: item.delivery?.state || null, evidenceCaseId: sessionsByRequest.get(item.researchRequestId)?.evidenceCaseId || null, errorCode: durableErrorCode(item.errorCode) })
    }
    const researchCases = []
    const projectionDriftCaseIds = new Set(detectedIntegrityIssues.filter(repairableIssue).map((item) => item.recordId))
    for (const item of stores.evidenceCases.records.filter((record) => record.state === 'preparing' || record.pendingOperations.length > 0 || projectionDriftCaseIds.has(record.evidenceCaseId)).sort((left, right) => Number(Boolean(left.lastErrorCode)) - Number(Boolean(right.lastErrorCode)) || (left.lastErrorCode && right.lastErrorCode ? left.revision - right.revision : 0) || left.evidenceCaseId.localeCompare(right.evidenceCaseId))) {
      if (registerRecoveryBlock('evidence_case', item.evidenceCaseId, caseBlockers(item))) continue
      researchCases.push({ evidenceCaseId: item.evidenceCaseId, revision: item.revision, state: item.state, fingerprint: digest(item), pendingOperations: [...item.pendingOperations], memoryStatus: item.memory.status, lastErrorCode: durableErrorCode(item.lastErrorCode) })
    }
    const memoryPending = []
    for (const item of stores.evidenceCases.records.filter((record) => record.memory.status === 'pending' || record.pendingOperations.includes('memory_append')).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId))) {
      if (registerRecoveryBlock('evidence_case', item.evidenceCaseId, caseBlockers(item))) continue
      memoryPending.push({ evidenceCaseId: item.evidenceCaseId, memoryStatus: item.memory.status, entryId: item.memory.entryId, lastErrorCode: durableErrorCode(item.lastErrorCode) })
    }
    const attemptsById = new Map(stores.connectorAttempts.records.map((item) => [item.connectorAttemptId, item]))
    const deliveryBoundaryFlow = (flow) => {
      if (flow.state !== 'resume_delivery') return false
      const reference = flow.attemptRefs.at(-1)
      const attempt = reference ? attemptsById.get(reference.connectorAttemptId) : null
      return attempt?.delivery?.state === 'pending' && ['prepared', 'failed_transient', 'running', 'contributing'].includes(attempt.state)
    }
    const caseSnapshotFor = (flow) => {
      if (!flow.evidenceCaseId) return null
      const current = casesById.get(flow.evidenceCaseId)
      return current
        ? { evidenceCaseId: current.evidenceCaseId, revision: current.revision, state: current.state, fingerprint: digest(current) }
        : { evidenceCaseId: flow.evidenceCaseId, revision: null, state: null, fingerprint: null }
    }
    const attemptSnapshotFor = (flow) => {
      const connectorAttemptId = flow.attemptRefs.at(-1)?.connectorAttemptId
      if (!connectorAttemptId) return null
      const current = attemptsById.get(connectorAttemptId)
      return current
        ? { connectorAttemptId, revision: current.revision, state: current.state, deliveryId: current.delivery?.deliveryId || null, deliveryState: current.delivery?.state || null, fingerprint: digest(current) }
        : { connectorAttemptId, revision: null, state: null, deliveryId: null, deliveryState: null, fingerprint: null }
    }
    const executionFlows = []
    for (const item of stores.executionFlows.records.filter((record) => ACTIONABLE_FLOW_STATES.has(record.state) && !deliveryBoundaryFlow(record)).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId))) {
      if (registerRecoveryBlock('execution_flow', item.executionFlowId, flowBlockers(item))) continue
      executionFlows.push({ executionFlowId: item.executionFlowId, revision: item.revision, state: item.state, fingerprint: digest(item), evidenceCaseSnapshot: caseSnapshotFor(item), connectorAttemptSnapshot: attemptSnapshotFor(item), pendingOperations: [...item.pendingOperations], lastErrorCode: durableErrorCode(item.lastErrorCode) })
    }
    const deliveryPending = []
    for (const item of stores.connectorAttempts.records.filter((record) => record.delivery?.state === 'pending').sort((left, right) => left.connectorAttemptId.localeCompare(right.connectorAttemptId))) {
      if (registerRecoveryBlock('connector_attempt', item.connectorAttemptId, attemptBlockers(item))) continue
      deliveryPending.push({ connectorAttemptId: item.connectorAttemptId, state: item.state, projectId: item.projectId })
    }
    const requiresHuman = []
    for (const item of stores.evidenceCases.records.filter((record) => record.state === 'requires_human')) {
      if (registerRecoveryBlock('evidence_case', item.evidenceCaseId, caseBlockers(item))) continue
      requiresHuman.push({ kind: 'evidence_case', recordId: item.evidenceCaseId, contradictionPreserved: item.contradictionStatus === 'preserved' })
    }
    for (const item of stores.executionFlows.records.filter((record) => record.state === 'requires_human')) {
      if (registerRecoveryBlock('execution_flow', item.executionFlowId, flowBlockers(item))) continue
      requiresHuman.push({ kind: 'execution_flow', recordId: item.executionFlowId, contradictionPreserved: true })
    }
    requiresHuman.sort((left, right) => left.kind.localeCompare(right.kind) || left.recordId.localeCompare(right.recordId))
    const needsCorroboration = []
    for (const item of stores.evidenceCases.records.filter((record) => record.state === 'needs_corroboration')) {
      if (registerRecoveryBlock('evidence_case', item.evidenceCaseId, caseBlockers(item))) continue
      needsCorroboration.push({ kind: 'evidence_case', recordId: item.evidenceCaseId })
    }
    for (const item of stores.executionFlows.records.filter((record) => record.state === 'needs_corroboration')) {
      if (registerRecoveryBlock('execution_flow', item.executionFlowId, flowBlockers(item))) continue
      needsCorroboration.push({ kind: 'execution_flow', recordId: item.executionFlowId })
    }
    needsCorroboration.sort((left, right) => left.kind.localeCompare(right.kind) || left.recordId.localeCompare(right.recordId))
    const readyForExplicitExecution = []
    for (const item of stores.executionFlows.records.filter((record) => record.state === 'ready_for_execution').sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId))) {
      if (registerRecoveryBlock('execution_flow', item.executionFlowId, flowBlockers(item))) continue
      readyForExplicitExecution.push({ executionFlowId: item.executionFlowId, attemptCount: item.attemptRefs.length })
    }
    const preparationPending = []
    for (const item of stores.executionFlows.records.filter((record) => PREPARATION_FLOW_STATES.has(record.state)).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId))) {
      if (registerRecoveryBlock('execution_flow', item.executionFlowId, flowBlockers(item))) continue
      preparationPending.push({ executionFlowId: item.executionFlowId, intakeId: item.intakeId, state: item.state, nextAction: 'prepareFlow' })
    }
    const recoveryBlocked = [...recoveryBlockedByRecord.values()].sort((left, right) => left.kind.localeCompare(right.kind) || left.recordId.localeCompare(right.recordId))
    const diagnosisStores = Object.fromEntries(Object.entries(stores).map(([key, value]) => [key, { recordCount: value.records.length, corruptionCount: value.corruptions.length }]))
    const indexIssues = indexes.filter((item) => item.repairRequired).map((item) => issue('DERIVED_INDEX_REPAIR_REQUIRED', 'derived_index', item.store))
    const base = {
      schemaVersion: DIAGNOSIS_SCHEMA,
      projectId: safeProjectId,
      stores: diagnosisStores,
      indexes,
      indexIssues,
      pending: { connectorAttempts, researchCases, memoryPending, executionFlows },
      boundaries: { deliveryPending, requiresHuman, needsCorroboration, readyForExplicitExecution, preparationPending, recoveryBlocked },
      connectors: connectorStatuses,
      connectorHealth,
      corruptions,
      integrityIssues: detectedIntegrityIssues,
      safety: { readOnly: true, adaptersExecuted: 0, providersExecuted: 0, humanDecisionsApplied: 0, recordsDeleted: 0, corruptionsHidden: 0 },
    }
    return deepFreeze({ ...base, snapshotFingerprint: digest(base) })
  }

  async function getRecoveryStatus(input) {
    return statusFromDiagnosis(await diagnoseRecovery(input))
  }

  async function planRecovery(input) {
    exactInput(input, ['projectId', 'limit'], ['projectId'])
    const limit = batchLimit(input.limit === undefined ? BATCH_MAX : input.limit)
    return recoveryPlan(await diagnoseRecovery({ projectId: projectId(input.projectId) }), limit)
  }

  async function runOperation(operation, safeProjectId) {
    if (operation.type === 'reconcile_connector_attempts') {
      const result = await connectorRuntime.reconcileAttempts({ projectId: safeProjectId, limit: operation.limit, candidates: operation.candidates })
      if (!exactKeys(result, ['items', 'remaining', 'results']) || !Array.isArray(result.items) || !Number.isSafeInteger(result.remaining) || result.remaining < 0 || !Array.isArray(result.results) || result.results.length !== operation.candidates.length || result.results.some((item, index) => !exactKeys(item, ['connectorAttemptId', 'status', 'state', 'revision', 'deliveryId']) || item.connectorAttemptId !== operation.candidates[index].connectorAttemptId || !['reconciled', 'failed', 'stale', 'ineligible', 'aborted'].includes(item.status) || (item.state !== null && typeof item.state !== 'string') || (item.revision !== null && (!Number.isSafeInteger(item.revision) || item.revision < 0)) || (item.deliveryId !== null && !/^connector-delivery-[a-f0-9]{32}$/u.test(item.deliveryId)))) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Reconcile de attempts invalido.')
      if (result.results.some((item) => ['stale', 'ineligible', 'aborted'].includes(item.status))) fail('STALE_RECOVERY_PLAN', 'Un candidato de connector cambio despues del snapshot.')
      const reconciledIds = result.results.filter((item) => item.status === 'reconciled').map((item) => item.connectorAttemptId)
      const failureCount = result.results.filter((item) => item.status === 'failed').length
      if (result.remaining !== failureCount || result.items.length !== reconciledIds.length || result.items.some((item, index) => !plainObject(item) || item.connectorAttemptId !== reconciledIds[index])) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Reconcile de attempts invalido.')
      return { sequence: operation.sequence, type: operation.type, status: failureCount > 0 ? 'failed' : 'completed', processed: result.items.length, remaining: result.remaining, idempotent: result.items.length === 0 && failureCount === 0, recovered: 0, corruptionCount: 0, adaptersExecuted: 0, errorCode: failureCount > 0 ? 'RECOVERY_ITEM_FAILED' : null }
    }
    if (operation.type === 'reconcile_pending_research') {
      const result = await research.reconcilePendingResearch(safeProjectId, operation.limit, operation.candidates)
      if (!Array.isArray(result) || result.length !== operation.candidates.length || result.some((item, index) => !plainObject(item) || item.evidenceCaseId !== operation.candidates[index].evidenceCaseId)) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Reconcile de research invalido.')
      const after = detail(await evidenceCasePersistence.listDetailed(safeProjectId), 'evidenceCases')
      const remaining = after.records.filter((item) => item.state === 'preparing' || item.pendingOperations.length > 0).length
      return { sequence: operation.sequence, type: operation.type, status: 'completed', processed: result.length, remaining, idempotent: result.length === 0, recovered: 0, corruptionCount: after.corruptions.length, adaptersExecuted: 0, errorCode: null }
    }
    if (operation.type === 'reconcile_execution_flows') {
      const result = await executionFlow.reconcileFlows({ projectId: safeProjectId, limit: operation.limit, candidates: operation.candidates })
      if (result?.adaptersExecuted !== 0) fail('RECOVERY_SAFETY_VIOLATION', 'Reconcile de flows invalido.')
      if (!plainObject(result) || !Array.isArray(result.items) || !Number.isSafeInteger(result.remaining) || result.remaining < 0 || result.items.length + result.remaining !== operation.candidates.length || result.items.some((item) => !plainObject(item)) || !Number.isSafeInteger(result.corruptionCount) || result.corruptionCount < 0) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Reconcile de flows invalido.')
      const expectedOrder = new Map(operation.candidates.map((item, index) => [item.executionFlowId, index]))
      let priorIndex = -1
      for (const item of result.items) {
        const index = expectedOrder.get(item.executionFlowId)
        if (!Number.isSafeInteger(index) || index <= priorIndex) fail('INVALID_RECOVERY_DEPENDENCY_RESULT', 'Reconcile de flows invalido.')
        priorIndex = index
      }
      return { sequence: operation.sequence, type: operation.type, status: result.remaining > 0 ? 'failed' : 'completed', processed: result.items.length, remaining: result.remaining, idempotent: result.items.length === 0 && result.remaining === 0, recovered: 0, corruptionCount: result.corruptionCount, adaptersExecuted: 0, errorCode: result.remaining > 0 ? 'RECOVERY_ITEM_FAILED' : null }
    }
    if (operation.scope === 'authority_root' && operation.repairRequired === false) return { sequence: operation.sequence, type: operation.type, status: 'completed', processed: 0, remaining: 0, idempotent: true, recovered: 0, corruptionCount: 0, adaptersExecuted: 0, errorCode: null }
    const index = INDEX_OPERATIONS.find((item) => item.type === operation.type)
    if (index) {
      const persistence = { discovery: discoveryPersistence, research: researchPersistence, evidenceCases: evidenceCasePersistence, connectorAttempts: connectorPersistence, executionFlows: executionPersistence }[index.store]
      return indexResult(operation, await persistence.rebuildIndex(), index)
    }
    if (operation.type === 'rebuild_connector_health') {
      const result = connectorHealthRebuildResult(await connectorRuntime.rebuildAllConnectorHealth(), Object.keys(CONNECTORS).sort())
      return {
        sequence: operation.sequence,
        type: operation.type,
        status: 'completed',
        processed: result.items.length,
        remaining: 0,
        idempotent: result.items.every((item) => item.idempotent === true),
        recovered: result.items.filter((item) => item.replacedCorrupt === true).length,
        corruptionCount: result.corruptionCount,
        adaptersExecuted: 0,
        errorCode: null,
      }
    }
    fail('INVALID_RECOVERY_PLAN', 'Operacion de recovery invalida.')
  }

  async function executeRecovery(input) {
    exactInput(input, ['plan'])
    const suppliedPlan = validatePlanShape(input.plan)
    return exclusiveMany(authorityLockKeys, () => exclusive(projectLockKey(suppliedPlan.projectId), async () => {
      const before = await diagnoseRecovery({ projectId: suppliedPlan.projectId })
      const expectedPlan = recoveryPlan(before, suppliedPlan.batchLimit)
      if (canonical(expectedPlan) !== canonical(suppliedPlan)) fail('STALE_RECOVERY_PLAN', 'El plan de recovery ya no esta fresco.')
      const operations = []
      for (const operation of expectedPlan.operations) {
        try { operations.push(await runOperation(operation, expectedPlan.projectId)) } catch (error) {
          if (error?.code === 'RECOVERY_SAFETY_VIOLATION' || error?.code === 'STALE_RECOVERY_PLAN') throw error
          if (typeof error?.code === 'string' && error.code.startsWith('STALE_')) fail('STALE_RECOVERY_PLAN', 'Un candidato de recovery cambio despues del snapshot.')
          operations.push(failedOperation(operation, error))
        }
      }
      const after = await diagnoseRecovery({ projectId: expectedPlan.projectId })
      const finalStatus = statusFromDiagnosis(after)
      const failed = operations.some((item) => item.status === 'failed')
      let state = 'completed'
      if (failed) state = 'partial'
      else if (finalStatus.recoveryCandidates > 0 || finalStatus.healthRepairs > 0 || finalStatus.indexRepairs > 0) state = 'recovery_pending'
      else if (finalStatus.corruptionCount > 0 || finalStatus.integrityIssueCount > 0 || finalStatus.healthUnknown > 0 || finalStatus.healthSourceIncomplete > 0) state = 'completed_with_findings'
      else if (finalStatus.explicitBoundaries > 0 || finalStatus.humanBoundaries > 0 || finalStatus.corroborationBoundaries > 0) state = 'completed_with_boundaries'
      return deepFreeze({
        schemaVersion: EXECUTION_SCHEMA,
        recoveryPlanId: expectedPlan.recoveryPlanId,
        projectId: expectedPlan.projectId,
        initialSnapshotFingerprint: before.snapshotFingerprint,
        finalSnapshotFingerprint: after.snapshotFingerprint,
        state,
        idempotent: operations.every((item) => item.idempotent === true),
        operations,
        initialStatus: statusFromDiagnosis(before),
        finalStatus,
        corruptionsBefore: before.corruptions,
        corruptionsAfter: after.corruptions,
        integrityIssuesBefore: before.integrityIssues,
        integrityIssuesAfter: after.integrityIssues,
        safety: { adaptersExecuted: 0, providersExecuted: 0, humanDecisionsApplied: 0, recordsDeleted: 0, corruptionsHidden: 0 },
      })
    }))
  }

  return deepFreeze({ diagnoseRecovery, getRecoveryStatus, planRecovery, executeRecovery })
}

module.exports = {
  BATCH_MAX,
  DIAGNOSIS_SCHEMA,
  STATUS_SCHEMA,
  PLAN_SCHEMA,
  EXECUTION_SCHEMA,
  SupervisedResearchRecoveryError,
  createSupervisedResearchRecovery,
}
