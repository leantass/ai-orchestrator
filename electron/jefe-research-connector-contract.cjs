const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { receipt: providerReceipt, safeResearchText } = require('./jefe-research-contract.cjs')
const { LIMITS, budget: providerBudget } = require('./jefe-research-provider-policy.cjs')

const CONNECTORS = Object.freeze({
  manual_reference: Object.freeze({ connectorId: 'manual-reference-local', providerType: 'manual_reference', connectorVersion: 'v1', capabilities: Object.freeze(['reference_only']), supportedOperations: Object.freeze(['reference']), networkRequirement: false, credentialRequirement: false, policyCompatibility: 'research', status: 'ready' }),
  metasearch: Object.freeze({ connectorId: 'metasearch-not-connected', providerType: 'metasearch', connectorVersion: 'v1', capabilities: Object.freeze(['search']), supportedOperations: Object.freeze(['search']), networkRequirement: true, credentialRequirement: false, policyCompatibility: 'research', status: 'not_connected' }),
  automated_browser: Object.freeze({ connectorId: 'automated-browser-disabled', providerType: 'automated_browser', connectorVersion: 'v1', capabilities: Object.freeze(['browse']), supportedOperations: Object.freeze(['browse']), networkRequirement: true, credentialRequirement: false, policyCompatibility: 'research', status: 'disabled' }),
  crawler: Object.freeze({ connectorId: 'crawler-not-connected', providerType: 'crawler', connectorVersion: 'v1', capabilities: Object.freeze(['extract']), supportedOperations: Object.freeze(['extract']), networkRequirement: true, credentialRequirement: false, policyCompatibility: 'research', status: 'not_connected' }),
  local_model: Object.freeze({ connectorId: 'local-model-not-configured', providerType: 'local_model', connectorVersion: 'v1', capabilities: Object.freeze(['analyze']), supportedOperations: Object.freeze(['analyze']), networkRequirement: false, credentialRequirement: false, policyCompatibility: 'research', status: 'not_configured' }),
  structured_analysis: Object.freeze({ connectorId: 'structured-analysis-local', providerType: 'structured_analysis', connectorVersion: 'v1', capabilities: Object.freeze(['analyze']), supportedOperations: Object.freeze(['analyze']), networkRequirement: false, credentialRequirement: false, policyCompatibility: 'research', status: 'ready' }),
  corroboration: Object.freeze({ connectorId: 'corroboration-gate-owned', providerType: 'corroboration', connectorVersion: 'v1', capabilities: Object.freeze(['corroborate']), supportedOperations: Object.freeze(['corroborate']), networkRequirement: false, credentialRequirement: false, policyCompatibility: 'evidence_gate_only', status: 'restricted' }),
})
const STATES = Object.freeze(['registered', 'disabled', 'not_configured', 'not_connected', 'ready', 'restricted', 'circuit_open'])
const ATTEMPT_STATES = Object.freeze(['prepared', 'policy_blocked', 'not_connected', 'running', 'contributing', 'succeeded', 'partial', 'failed_transient', 'failed_permanent', 'timed_out', 'cancelled'])
const ATTEMPT_ID = /^connector-attempt-[a-f0-9]{32}$/u
const DELIVERY_ID = /^connector-delivery-[a-f0-9]{32}$/u
const CONNECTOR_ID = /^[a-z][a-z0-9-]{2,80}$/u
const CORRELATION_ID = /^[a-z][a-z0-9-]{2,80}$/u
const TRANSITION_PATCH_FIELDS = Object.freeze(['receipt', 'budgetReservation', 'updatedAt', 'errorCode', 'research', 'delivery'])
const DELIVERY_FIELDS = Object.freeze(['schemaVersion', 'deliveryId', 'sourceAttemptId', 'researchSessionId', 'researchRequestId', 'researchPlanId', 'evidenceCaseId', 'discoveryId', 'projectId', 'connectorId', 'providerType', 'operation', 'budget', 'rawReceipt', 'claim', 'expectedReceiptId', 'state', 'createdAt', 'deliveredAt', 'receiptId'])
const CONTEXT_FIELDS = Object.freeze(['researchSessionId', 'researchRequestId', 'researchPlanId', 'evidenceCaseId', 'discoveryId', 'projectId', 'providerType'])
const RAW_RECEIPT_FIELDS = Object.freeze(['researchRequestId', 'providerType', 'operation', 'status', 'url', 'mimeType', 'bytes', 'contentHash', 'excerpt', 'method', 'redirects', 'codes', 'consumed'])

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

function plain(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) return false
  return Object.values(Object.getOwnPropertyDescriptors(value)).every((descriptor) => Object.hasOwn(descriptor, 'value') && descriptor.enumerable)
}

function exact(value, fields) {
  return plain(value) && canonical(Object.keys(value).sort()) === canonical([...fields].sort())
}

function validTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function safeBudget(value) {
  let clean
  try { clean = providerBudget(value) } catch { fail('INVALID_DELIVERY', 'Entrega invalida.') }
  if (!exact(value, Object.keys(LIMITS)) || canonical(value) !== canonical(clean)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  return clean
}

function safeRawReceipt(value, requestRecord, now) {
  if (!plain(value) || Object.keys(value).some((key) => !RAW_RECEIPT_FIELDS.includes(key))) fail('INVALID_DELIVERY', 'Entrega invalida.')
  let clean
  try { clean = providerReceipt(value, requestRecord, now) } catch { fail('INVALID_DELIVERY', 'Entrega invalida.') }
  const raw = {
    researchRequestId: clean.researchRequestId,
    providerType: clean.providerType,
    operation: clean.operation,
    status: clean.status,
    method: clean.method,
    redirects: [...clean.redirects],
    codes: [...clean.codes],
    consumed: { ...clean.consumed },
  }
  for (const key of ['url', 'mimeType', 'bytes', 'contentHash', 'excerpt']) if (clean[key] !== undefined) raw[key] = clean[key]
  return { raw, receiptId: clean.receiptId }
}

function delivery({ record, context, rawReceipt, claim, budget, now }) {
  if (!record || !ATTEMPT_ID.test(record.connectorAttemptId) || !exact(context, CONTEXT_FIELDS) || !validTimestamp(now)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  let definition
  try { definition = connector(record.providerType) } catch { fail('INVALID_DELIVERY', 'Entrega invalida.') }
  if (record.connectorId !== definition.connectorId || !definition.supportedOperations.includes(record.operation) || (record.rootAttemptId !== undefined && !ATTEMPT_ID.test(record.rootAttemptId))) fail('INVALID_DELIVERY', 'Entrega invalida.')
  for (const key of ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId']) if (typeof record[key] !== 'string' || !CORRELATION_ID.test(record[key])) fail('INVALID_DELIVERY', 'Entrega invalida.')
  for (const key of ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType']) if (context[key] !== record[key]) fail('INVALID_DELIVERY', 'Entrega invalida.')
  if (!/^research-plan-[a-f0-9]{32}$/u.test(context.researchPlanId) || !/^evidence-case-[a-f0-9]{32}$/u.test(context.evidenceCaseId)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  const cleanBudget = safeBudget(budget)
  const cleanReceipt = safeRawReceipt(rawReceipt, { researchRequestId: record.researchRequestId, providerType: record.providerType, budget: cleanBudget }, now)
  let cleanClaim
  try { cleanClaim = safeResearchText(claim, { max: 500 }) } catch { fail('INVALID_DELIVERY', 'Entrega invalida.') }
  const sourceAttemptId = record.rootAttemptId || record.connectorAttemptId
  const core = {
    schemaVersion: 'jefe-research-connector-delivery/v1',
    sourceAttemptId,
    researchSessionId: record.researchSessionId,
    researchRequestId: record.researchRequestId,
    researchPlanId: context.researchPlanId,
    evidenceCaseId: context.evidenceCaseId,
    discoveryId: record.discoveryId,
    projectId: record.projectId,
    connectorId: record.connectorId,
    providerType: record.providerType,
    operation: record.operation,
    budget: cleanBudget,
    rawReceipt: cleanReceipt.raw,
    claim: cleanClaim,
    expectedReceiptId: cleanReceipt.receiptId,
  }
  return {
    ...core,
    deliveryId: `connector-delivery-${hash(core).slice(0, 32)}`,
    state: 'pending',
    createdAt: now,
    deliveredAt: null,
    receiptId: null,
  }
}

function validateDelivery(value, record) {
  if (!exact(value, DELIVERY_FIELDS) || !DELIVERY_ID.test(value.deliveryId) || !['pending', 'delivered'].includes(value.state) || !validTimestamp(value.createdAt)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  const rebuilt = delivery({
    record,
    context: Object.fromEntries(CONTEXT_FIELDS.map((key) => [key, value[key]])),
    rawReceipt: value.rawReceipt,
    claim: value.claim,
    budget: value.budget,
    now: value.createdAt,
  })
  const pendingView = { ...value, state: 'pending', deliveredAt: null, receiptId: null }
  if (canonical(rebuilt) !== canonical(pendingView)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  if (value.state === 'pending' && (value.deliveredAt !== null || value.receiptId !== null)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  if (value.state === 'delivered' && (!validTimestamp(value.deliveredAt) || Date.parse(value.deliveredAt) < Date.parse(value.createdAt) || value.receiptId !== value.expectedReceiptId)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  return JSON.parse(canonical(value))
}

function completeDelivery(value, receiptId, now) {
  if (!exact(value, DELIVERY_FIELDS) || !DELIVERY_ID.test(value.deliveryId) || value.state !== 'pending' || value.deliveredAt !== null || value.receiptId !== null || !/^receipt-[a-f0-9]{32}$/u.test(receiptId) || receiptId !== value.expectedReceiptId || !validTimestamp(value.createdAt) || !validTimestamp(now) || Date.parse(now) < Date.parse(value.createdAt)) fail('INVALID_DELIVERY', 'Entrega invalida.')
  return { ...value, state: 'delivered', deliveredAt: now, receiptId }
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

module.exports = { CONNECTORS, STATES, ATTEMPT_STATES, TRANSITIONS, ATTEMPT_ID, DELIVERY_ID, CONNECTOR_ID, ConnectorContractError, connector, attempt, delivery, validateDelivery, completeDelivery, transition, view }
