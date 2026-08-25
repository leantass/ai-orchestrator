const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')

const CONNECTORS = Object.freeze({
  manual_reference: Object.freeze({ connectorId: 'manual-reference-local', providerType: 'manual_reference', connectorVersion: 'v1', capabilities: Object.freeze(['reference_only']), supportedOperations: Object.freeze(['reference']), networkRequirement: false, credentialRequirement: false, policyCompatibility: 'research', status: 'ready' }),
  metasearch: Object.freeze({ connectorId: 'metasearch-not-connected', providerType: 'metasearch', connectorVersion: 'v1', capabilities: Object.freeze(['search']), supportedOperations: Object.freeze(['search']), networkRequirement: true, credentialRequirement: false, policyCompatibility: 'research', status: 'not_connected' }),
  automated_browser: Object.freeze({ connectorId: 'automated-browser-disabled', providerType: 'automated_browser', connectorVersion: 'v1', capabilities: Object.freeze(['browse']), supportedOperations: Object.freeze(['browse']), networkRequirement: true, credentialRequirement: false, policyCompatibility: 'research', status: 'disabled' }),
  local_model: Object.freeze({ connectorId: 'local-model-not-configured', providerType: 'local_model', connectorVersion: 'v1', capabilities: Object.freeze(['analyze']), supportedOperations: Object.freeze(['analyze']), networkRequirement: false, credentialRequirement: false, policyCompatibility: 'research', status: 'not_configured' }),
})
const STATES = Object.freeze(['registered', 'disabled', 'not_configured', 'not_connected', 'ready', 'restricted', 'circuit_open'])
const ATTEMPT_STATES = Object.freeze(['prepared', 'policy_blocked', 'not_connected', 'running', 'contributing', 'succeeded', 'partial', 'failed_transient', 'failed_permanent', 'timed_out', 'cancelled'])
const ATTEMPT_ID = /^connector-attempt-[a-f0-9]{32}$/u
const CONNECTOR_ID = /^[a-z][a-z0-9-]{2,80}$/u
const CORRELATION_ID = /^[a-z][a-z0-9-]{2,80}$/u
const TRANSITION_PATCH_FIELDS = Object.freeze(['receipt', 'budgetReservation', 'updatedAt', 'errorCode', 'research'])

class ConnectorContractError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new ConnectorContractError(code, message)
}

function hash(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function connector(providerType) {
  if (typeof providerType !== 'string' || !Object.hasOwn(CONNECTORS, providerType)) fail('UNKNOWN_CONNECTOR', 'Connector no registrado.')
  return Object.freeze({ ...CONNECTORS[providerType], capabilities: Object.freeze([...CONNECTORS[providerType].capabilities]), supportedOperations: Object.freeze([...CONNECTORS[providerType].supportedOperations]) })
}

function attempt(raw, now) {
  const allowed = ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some((key) => !allowed.includes(key))) fail('INVALID_CONNECTOR_ATTEMPT', 'Intento invalido.')
  const current = connector(raw.providerType)
  for (const key of ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId']) if (typeof raw[key] !== 'string' || !CORRELATION_ID.test(raw[key])) fail('INVALID_CONNECTOR_ATTEMPT', 'Intento invalido.')
  if (!current.supportedOperations.includes(raw.operation)) fail('INVALID_OPERATION', 'Operacion no permitida.')
  const state = current.status === 'ready' ? 'prepared' : current.status === 'disabled' || current.status === 'restricted' ? 'policy_blocked' : 'not_connected'
  const record = {
    schemaVersion: 'jefe-research-connector-attempt/v1',
    ...raw,
    connectorId: current.connectorId,
    state,
    createdAt: now,
  }
  record.connectorAttemptId = `connector-attempt-${hash({ schemaVersion: record.schemaVersion, researchSessionId: record.researchSessionId, researchRequestId: record.researchRequestId, discoveryId: record.discoveryId, projectId: record.projectId, providerType: record.providerType, operation: record.operation, connectorId: record.connectorId }).slice(0, 32)}`
  return record
}

const TRANSITIONS = Object.freeze({
  prepared: Object.freeze(['running', 'cancelled', 'not_connected', 'policy_blocked']),
  running: Object.freeze(['contributing', 'succeeded', 'partial', 'failed_transient', 'failed_permanent', 'timed_out', 'cancelled', 'policy_blocked']),
  contributing: Object.freeze(['succeeded', 'partial', 'failed_transient', 'failed_permanent']),
  failed_transient: Object.freeze(['prepared']),
  not_connected: Object.freeze([]),
  policy_blocked: Object.freeze([]),
  succeeded: Object.freeze([]),
  partial: Object.freeze([]),
  failed_permanent: Object.freeze([]),
  timed_out: Object.freeze([]),
  cancelled: Object.freeze([]),
})

function transition(record, next, extra = {}) {
  if (!record || !ATTEMPT_STATES.includes(record.state) || !ATTEMPT_STATES.includes(next) || !TRANSITIONS[record.state].includes(next) || !extra || typeof extra !== 'object' || Array.isArray(extra) || Object.keys(extra).some((key) => !TRANSITION_PATCH_FIELDS.includes(key))) fail('INVALID_TRANSITION', 'Transicion no permitida.')
  if ((next === 'succeeded' || next === 'partial') && !extra.receipt) fail('RECEIPT_REQUIRED', 'Receipt requerido.')
  return { ...record, state: next, ...extra }
}

function view(record) {
  return { connectorAttemptId: record.connectorAttemptId, connectorId: record.connectorId, providerType: record.providerType, state: record.state, projectId: record.projectId, operation: record.operation }
}

module.exports = { CONNECTORS, STATES, ATTEMPT_STATES, TRANSITIONS, ATTEMPT_ID, CONNECTOR_ID, ConnectorContractError, connector, attempt, transition, view }
