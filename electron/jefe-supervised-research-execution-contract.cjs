const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')

const SCHEMA_VERSION = 'jefe-supervised-research-execution-flow/v1'
const FLOW_ID = /^research-execution-[a-f0-9]{32}$/u
const INTAKE_ID = /^intake-[a-f0-9]{32}$/u
const ROUTING_FINGERPRINT = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[a-z][a-z0-9_-]{2,80}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const HANDOFF_ID = /^agent-handoff-[a-f0-9]{32}$/u
const RESEARCH_PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const EVIDENCE_CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const RESEARCH_REQUEST_ID = /^research-[a-f0-9]{32}$/u
const CONNECTOR_ATTEMPT_ID = /^connector-attempt-[a-f0-9]{32}$/u

const ROLES = Object.freeze(['radar', 'scout', 'hermes'])
const PACKAGE_REF_FIELDS = Object.freeze(['packageId', 'handoffId', 'consumerStatus'])
const CONSUMER_STATUSES = Object.freeze(['not_connected', 'registered_internal'])
const FLOW_STATES = Object.freeze([
  'prepare_context',
  'prepare_research',
  'prepare_attempts',
  'ready_for_execution',
  'explicit_execution',
  'resume_delivery',
  'sync_state',
  'needs_corroboration',
  'requires_human',
  'completed_with_evidence',
  'blocked',
])
const PENDING_OPERATIONS = Object.freeze([
  'prepare_context',
  'prepare_research',
  'prepare_attempts',
  'explicit_execution',
  'resume_delivery',
  'sync_state',
])
const TERMINAL_STATES = Object.freeze([
  'needs_corroboration',
  'requires_human',
  'completed_with_evidence',
  'blocked',
])
const ERROR_CODES = Object.freeze([
  'INTAKE_NOT_FOUND',
  'INTAKE_NOT_READY',
  'CONTEXT_PREPARATION_FAILED',
  'RESEARCH_PREPARATION_FAILED',
  'ATTEMPT_PREPARATION_FAILED',
  'CONNECTOR_NOT_CONNECTED',
  'CONNECTOR_POLICY_BLOCKED',
  'BUDGET_EXHAUSTED',
  'CIRCUIT_OPEN',
  'EXECUTION_TIMEOUT',
  'ADAPTER_FAILURE',
  'ADAPTER_PERMANENT_FAILURE',
  'UNTRUSTED_ADAPTER_OUTPUT',
  'EXECUTION_FAILED',
  'INVALID_CONNECTOR_CANDIDATE',
  'INVALID_PROVIDER_RECEIPT',
  'INVALID_RESEARCH_CORRELATION',
  'RESEARCH_INTEGRATION_UNAVAILABLE',
  'RESEARCH_RECEIVE_REJECTED',
  'DELIVERY_PENDING',
  'DELIVERY_FAILED',
  'MEMORY_NOT_CONFIGURED',
  'MEMORY_APPEND_FAILED',
  'SYNC_FAILED',
  'CANCELLED',
  'INTERRUPTED',
  'RETRY_LIMIT_REACHED',
  'CORRUPT_DEPENDENCY',
])

const TRANSITIONS = Object.freeze({
  prepare_context: Object.freeze(['prepare_research', 'blocked']),
  prepare_research: Object.freeze(['prepare_attempts', 'blocked']),
  prepare_attempts: Object.freeze(['ready_for_execution', 'needs_corroboration', 'blocked']),
  ready_for_execution: Object.freeze(['prepare_attempts', 'explicit_execution', 'sync_state', 'blocked']),
  explicit_execution: Object.freeze(['ready_for_execution', 'resume_delivery', 'sync_state', 'needs_corroboration', 'requires_human', 'completed_with_evidence', 'blocked']),
  resume_delivery: Object.freeze(['resume_delivery', 'ready_for_execution', 'sync_state', 'needs_corroboration', 'requires_human', 'completed_with_evidence', 'blocked']),
  sync_state: Object.freeze(['ready_for_execution', 'resume_delivery', 'needs_corroboration', 'requires_human', 'completed_with_evidence', 'blocked']),
  needs_corroboration: Object.freeze([]),
  requires_human: Object.freeze([]),
  completed_with_evidence: Object.freeze([]),
  blocked: Object.freeze([]),
})

const STATE_PENDING = Object.freeze({
  prepare_context: Object.freeze(['prepare_context']),
  prepare_research: Object.freeze(['prepare_research']),
  prepare_attempts: Object.freeze(['prepare_attempts']),
  ready_for_execution: Object.freeze([]),
  explicit_execution: Object.freeze(['explicit_execution']),
  resume_delivery: Object.freeze(['resume_delivery']),
  sync_state: Object.freeze(['sync_state']),
  needs_corroboration: Object.freeze([]),
  requires_human: Object.freeze([]),
  completed_with_evidence: Object.freeze([]),
  blocked: Object.freeze([]),
})

const RECORD_FIELDS = Object.freeze([
  'schemaVersion',
  'executionFlowId',
  'identity',
  'intakeId',
  'routingFingerprint',
  'state',
  'revision',
  'packageRefs',
  'researchPlanId',
  'evidenceCaseId',
  'requestRefs',
  'attemptRefs',
  'pendingOperations',
  'lastErrorCode',
  'createdAt',
  'updatedAt',
])
const TRANSITION_PATCH_FIELDS = Object.freeze([
  'packageRefs',
  'researchPlanId',
  'evidenceCaseId',
  'requestRefs',
  'attemptRefs',
  'pendingOperations',
  'lastErrorCode',
])

class SupervisedResearchExecutionContractError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SupervisedResearchExecutionContractError'
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchExecutionContractError(code, message)
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
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))
}

function exactKeys(value, expected, code = 'INVALID_EXECUTION_FLOW') {
  if (!plainObject(value) || canonical(Object.keys(value).sort()) !== canonical([...expected].sort())) fail(code, 'Flujo de ejecucion supervisada invalido.')
}

function timestamp(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) fail('INVALID_EXECUTION_TIMESTAMP', 'Timestamp de ejecucion invalido.')
  return value
}

function identity(value) {
  exactKeys(value, ['projectId', 'runId', 'versionId'], 'INVALID_EXECUTION_IDENTITY')
  const clean = {}
  for (const key of ['projectId', 'runId', 'versionId']) {
    if (typeof value[key] !== 'string' || !SAFE_ID.test(value[key])) fail('INVALID_EXECUTION_IDENTITY', 'Identidad fisica invalida.')
    clean[key] = value[key]
  }
  return clean
}

function packageRefs(value) {
  if (!plainObject(value)) fail('INVALID_PACKAGE_REFS', 'Referencias de paquetes invalidas.')
  const keys = Object.keys(value).sort()
  if (keys.length !== 0 && canonical(keys) !== canonical([...ROLES].sort())) fail('INVALID_PACKAGE_REFS', 'Referencias de paquetes invalidas.')
  const clean = {}
  for (const role of keys) {
    exactKeys(value[role], PACKAGE_REF_FIELDS, 'INVALID_PACKAGE_REFS')
    if (!PACKAGE_ID.test(value[role].packageId) || !HANDOFF_ID.test(value[role].handoffId) || !CONSUMER_STATUSES.includes(value[role].consumerStatus)) fail('INVALID_PACKAGE_REFS', 'Referencias de paquetes invalidas.')
    clean[role] = {
      packageId: value[role].packageId,
      handoffId: value[role].handoffId,
      consumerStatus: value[role].consumerStatus,
    }
  }
  if (new Set(Object.values(clean).map((item) => item.packageId)).size !== keys.length || new Set(Object.values(clean).map((item) => item.handoffId)).size !== keys.length) fail('INVALID_PACKAGE_REFS', 'Referencias de paquetes invalidas.')
  return clean
}

function requestRefs(value) {
  if (!Array.isArray(value) || value.length > ROLES.length) fail('INVALID_REQUEST_REFS', 'Referencias de requests invalidas.')
  const roles = new Set()
  const ids = new Set()
  const clean = value.map((item) => {
    exactKeys(item, ['role', 'researchRequestId'], 'INVALID_REQUEST_REFS')
    if (!ROLES.includes(item.role) || typeof item.researchRequestId !== 'string' || !RESEARCH_REQUEST_ID.test(item.researchRequestId) || roles.has(item.role) || ids.has(item.researchRequestId)) fail('INVALID_REQUEST_REFS', 'Referencias de requests invalidas.')
    roles.add(item.role)
    ids.add(item.researchRequestId)
    return { role: item.role, researchRequestId: item.researchRequestId }
  })
  return clean.sort((left, right) => left.role.localeCompare(right.role))
}

function attemptRefs(value, knownRequests) {
  if (!Array.isArray(value) || value.length > 30) fail('INVALID_ATTEMPT_REFS', 'Referencias de intentos invalidas.')
  const pairs = new Set()
  const attemptIds = new Set()
  const requestIds = new Set(knownRequests.map((item) => item.researchRequestId))
  const clean = value.map((item) => {
    exactKeys(item, ['researchRequestId', 'connectorAttemptId'], 'INVALID_ATTEMPT_REFS')
    const pair = `${item.researchRequestId}:${item.connectorAttemptId}`
    if (!requestIds.has(item.researchRequestId) || typeof item.connectorAttemptId !== 'string' || !CONNECTOR_ATTEMPT_ID.test(item.connectorAttemptId) || pairs.has(pair) || attemptIds.has(item.connectorAttemptId)) fail('INVALID_ATTEMPT_REFS', 'Referencias de intentos invalidas.')
    pairs.add(pair)
    attemptIds.add(item.connectorAttemptId)
    return { researchRequestId: item.researchRequestId, connectorAttemptId: item.connectorAttemptId }
  })
  return clean
}

function pendingOperations(value, state) {
  if (!Array.isArray(value) || value.some((item) => !PENDING_OPERATIONS.includes(item)) || new Set(value).size !== value.length) fail('INVALID_PENDING_OPERATIONS', 'Operaciones pendientes invalidas.')
  const clean = [...value].sort()
  if (canonical(clean) !== canonical([...STATE_PENDING[state]].sort())) fail('INVALID_PENDING_OPERATIONS', 'Operaciones pendientes no corresponden al estado.')
  return clean
}

function optionalId(value, expression, code) {
  if (value === null) return null
  if (typeof value !== 'string' || !expression.test(value)) fail(code, 'Referencia durable invalida.')
  return value
}

function immutableSeed(value) {
  return {
    executionFlowId: value.executionFlowId,
    identity: value.identity,
    intakeId: value.intakeId,
    routingFingerprint: value.routingFingerprint,
    createdAt: value.createdAt,
  }
}

function validateExecutionFlow(value) {
  exactKeys(value, RECORD_FIELDS)
  if (value.schemaVersion !== SCHEMA_VERSION || typeof value.intakeId !== 'string' || !INTAKE_ID.test(value.intakeId) || typeof value.routingFingerprint !== 'string' || !ROUTING_FINGERPRINT.test(value.routingFingerprint)) fail('INVALID_EXECUTION_FLOW', 'Flujo de ejecucion supervisada invalido.')
  const expectedFlowId = deriveExecutionFlowId({ intakeId: value.intakeId, routingFingerprint: value.routingFingerprint })
  if (typeof value.executionFlowId !== 'string' || !FLOW_ID.test(value.executionFlowId) || value.executionFlowId !== expectedFlowId) fail('INVALID_EXECUTION_FLOW_ID', 'Identificador de flujo invalido.')
  if (!FLOW_STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_EXECUTION_FLOW', 'Flujo de ejecucion supervisada invalido.')

  const cleanIdentity = identity(value.identity)
  const cleanPackages = packageRefs(value.packageRefs)
  const cleanRequests = requestRefs(value.requestRefs)
  const cleanAttempts = attemptRefs(value.attemptRefs, cleanRequests)
  const researchPlanId = optionalId(value.researchPlanId, RESEARCH_PLAN_ID, 'INVALID_RESEARCH_PLAN_REF')
  const evidenceCaseId = optionalId(value.evidenceCaseId, EVIDENCE_CASE_ID, 'INVALID_EVIDENCE_CASE_REF')
  const createdAt = timestamp(value.createdAt)
  const updatedAt = timestamp(value.updatedAt)
  if (Date.parse(updatedAt) < Date.parse(createdAt)) fail('INVALID_EXECUTION_TIMESTAMP', 'Timestamp de ejecucion invalido.')
  if ((researchPlanId === null) !== (evidenceCaseId === null)) fail('INVALID_RESEARCH_REFS', 'Plan y caso deben persistirse juntos.')
  if ((researchPlanId === null && cleanRequests.length > 0) || (cleanRequests.length === 0 && cleanAttempts.length > 0)) fail('INVALID_EXECUTION_REFS', 'Referencias de ejecucion invalidas.')

  const afterContext = value.state !== 'prepare_context' && value.state !== 'blocked'
  if (afterContext && Object.keys(cleanPackages).length !== ROLES.length) fail('INVALID_PACKAGE_REFS', 'Faltan paquetes por rol.')
  const afterResearch = !['prepare_context', 'prepare_research', 'blocked'].includes(value.state)
  if (afterResearch && (researchPlanId === null || cleanRequests.length !== ROLES.length)) fail('INVALID_RESEARCH_REFS', 'Faltan referencias del plan de investigacion.')
  if (['ready_for_execution', 'explicit_execution', 'resume_delivery', 'sync_state', 'needs_corroboration', 'requires_human', 'completed_with_evidence'].includes(value.state) && cleanAttempts.length < 1) fail('INVALID_ATTEMPT_REFS', 'Falta un intento preparado.')

  const cleanPending = pendingOperations(value.pendingOperations, value.state)
  const lastErrorCode = value.lastErrorCode === null ? null : value.lastErrorCode
  if (lastErrorCode !== null && !ERROR_CODES.includes(lastErrorCode)) fail('INVALID_EXECUTION_ERROR', 'Codigo de error no permitido.')
  if (value.state === 'blocked' && lastErrorCode === null) fail('INVALID_EXECUTION_ERROR', 'Un flujo bloqueado requiere un codigo allowlisted.')

  return deepFreeze({
    schemaVersion: SCHEMA_VERSION,
    executionFlowId: value.executionFlowId,
    identity: cleanIdentity,
    intakeId: value.intakeId,
    routingFingerprint: value.routingFingerprint,
    state: value.state,
    revision: value.revision,
    packageRefs: cleanPackages,
    researchPlanId,
    evidenceCaseId,
    requestRefs: cleanRequests,
    attemptRefs: cleanAttempts,
    pendingOperations: cleanPending,
    lastErrorCode,
    createdAt,
    updatedAt,
  })
}

function deriveExecutionFlowId(value) {
  exactKeys(value, ['intakeId', 'routingFingerprint'], 'INVALID_EXECUTION_SEED')
  if (typeof value.intakeId !== 'string' || !INTAKE_ID.test(value.intakeId) || typeof value.routingFingerprint !== 'string' || !ROUTING_FINGERPRINT.test(value.routingFingerprint)) fail('INVALID_EXECUTION_SEED', 'Semilla de flujo invalida.')
  return `research-execution-${digest({ intakeId: value.intakeId, routingFingerprint: value.routingFingerprint }).slice(0, 32)}`
}

function createExecutionFlow(value, now) {
  exactKeys(value, ['identity', 'intakeId', 'routingFingerprint'], 'INVALID_EXECUTION_CREATE')
  const executionFlowId = deriveExecutionFlowId({ intakeId: value.intakeId, routingFingerprint: value.routingFingerprint })
  return validateExecutionFlow({
    schemaVersion: SCHEMA_VERSION,
    executionFlowId,
    identity: identity(value.identity),
    intakeId: value.intakeId,
    routingFingerprint: value.routingFingerprint,
    state: 'prepare_context',
    revision: 0,
    packageRefs: {},
    researchPlanId: null,
    evidenceCaseId: null,
    requestRefs: [],
    attemptRefs: [],
    pendingOperations: ['prepare_context'],
    lastErrorCode: null,
    createdAt: timestamp(now),
    updatedAt: now,
  })
}

function appendOnly(prior, next, key) {
  const expected = new Map(prior.map((item) => [item[key], item]))
  for (const item of next) {
    const existing = expected.get(item[key])
    if (existing && canonical(existing) !== canonical(item)) fail('IMMUTABLE_EXECUTION_REF', 'Una referencia durable no puede cambiar.')
  }
  if (prior.some((item) => !next.some((candidate) => candidate[key] === item[key]))) fail('IMMUTABLE_EXECUTION_REF', 'Una referencia durable no puede eliminarse.')
}

function transitionExecutionFlow(record, nextState, patch, now) {
  const prior = validateExecutionFlow(record)
  if (!FLOW_STATES.includes(nextState) || !TRANSITIONS[prior.state].includes(nextState)) fail('INVALID_EXECUTION_TRANSITION', 'Transicion de flujo no permitida.')
  if (!plainObject(patch) || Object.keys(patch).some((key) => !TRANSITION_PATCH_FIELDS.includes(key))) fail('INVALID_EXECUTION_TRANSITION', 'Patch de flujo no permitido.')
  const proposed = validateExecutionFlow({ ...clone(prior), ...clone(patch), state: nextState, updatedAt: timestamp(now) })
  if (canonical(immutableSeed(prior)) !== canonical(immutableSeed(proposed))) fail('IMMUTABLE_EXECUTION_IDENTITY', 'La identidad del flujo no puede cambiar.')
  if (Object.keys(prior.packageRefs).length > 0 && canonical(prior.packageRefs) !== canonical(proposed.packageRefs)) fail('IMMUTABLE_PACKAGE_REFS', 'Los paquetes del flujo no pueden cambiar.')
  if (prior.researchPlanId !== null && (proposed.researchPlanId !== prior.researchPlanId || proposed.evidenceCaseId !== prior.evidenceCaseId)) fail('IMMUTABLE_RESEARCH_REFS', 'Plan y caso no pueden cambiar.')
  appendOnly(prior.requestRefs, proposed.requestRefs, 'researchRequestId')
  appendOnly(prior.attemptRefs, proposed.attemptRefs, 'connectorAttemptId')
  return proposed
}

function executionFlowView(value) {
  const record = validateExecutionFlow(value)
  return deepFreeze({
    executionFlowId: record.executionFlowId,
    intakeId: record.intakeId,
    projectId: record.identity.projectId,
    state: record.state,
    researchPlanId: record.researchPlanId,
    evidenceCaseId: record.evidenceCaseId,
    requestCount: record.requestRefs.length,
    attemptCount: record.attemptRefs.length,
    pendingOperations: [...record.pendingOperations],
    lastErrorCode: record.lastErrorCode,
    revision: record.revision,
    updatedAt: record.updatedAt,
  })
}

module.exports = {
  SCHEMA_VERSION,
  FLOW_ID,
  ROLES,
  FLOW_STATES,
  PENDING_OPERATIONS,
  TERMINAL_STATES,
  ERROR_CODES,
  TRANSITIONS,
  SupervisedResearchExecutionContractError,
  deriveExecutionFlowId,
  createExecutionFlow,
  validateExecutionFlow,
  transitionExecutionFlow,
  executionFlowView,
}
