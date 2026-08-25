const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { physicalRootKey, resolvePhysicalRoot } = require('./jefe-physical-root.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { ATTEMPT_ID, ATTEMPT_STATES, CONNECTOR_ID, CONNECTORS, DELIVERY_ID, TRANSITIONS, connector, transition, validateDelivery } = require('./jefe-research-connector-contract.cjs')

const locks = new Map()
let stageSequence = 0
const ERROR_CODES = new Set([
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
])
const RESEARCH_STATES = new Set(['needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence'])
const KNOWN_CONNECTOR_IDS = new Set(Object.values(CONNECTORS).map((item) => item.connectorId))
const ATTEMPT_REPLAY_FIELDS = Object.freeze(['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId', 'connectorAttemptId', 'rootAttemptId', 'retryOfAttemptId', 'attemptNumber'])
const ATTEMPT_IMMUTABLE_FIELDS = Object.freeze([...ATTEMPT_REPLAY_FIELDS, 'createdAt'])
const CIRCUIT_OBSERVATION_FIELDS = Object.freeze(['schemaVersion', 'startSequence', 'startedAt', 'probeForOpenedAt', 'outcome', 'outcomeSequence', 'outcomeAt'])
const CIRCUIT_OUTCOMES = Object.freeze(['success', 'not_executed', 'counted_failure', 'uncounted_failure'])
const SOURCE_INTEGRITY_POLICY = Object.freeze({ maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 })

class ConnectorPersistenceError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new ConnectorPersistenceError(code, message)
}

function locked(key, work) {
  const previous = locks.get(key) || Promise.resolve()
  let release
  const tail = new Promise((resolve) => { release = resolve })
  locks.set(key, tail)
  return previous.then(work).finally(() => {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  })
}

function lockedMany(keys, work, index = 0) {
  if (index >= keys.length) return work()
  return locked(keys[index], () => lockedMany(keys, work, index + 1))
}

function validTimestamp(value, optional = false) {
  return optional && value === null ? true : typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function validateReceipt(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !['status', 'classification', 'receiptId'].includes(key))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!['not_executed', 'received', 'partial'].includes(value.status) || value.classification !== 'UNTRUSTED_EXTERNAL_CONTENT') fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.status === 'not_executed') {
    if (value.receiptId !== undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  } else if (typeof value.receiptId !== 'string' || !/^receipt-[a-f0-9]{32}$/u.test(value.receiptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  return value
}

function validateResearch(value) {
  const allowed = ['researchRequestId', 'receiptId', 'state', 'evidenceId', 'evidenceCaseId', 'researchPlanId']
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (typeof value.researchRequestId !== 'string' || !/^research-[a-f0-9]{32}$/u.test(value.researchRequestId) || typeof value.receiptId !== 'string' || !/^receipt-[a-f0-9]{32}$/u.test(value.receiptId) || !RESEARCH_STATES.has(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (typeof value.evidenceId !== 'string' || !/^evidence-[a-f0-9]{32}$/u.test(value.evidenceId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (typeof value.evidenceCaseId !== 'string' || !/^evidence-case-[a-f0-9]{32}$/u.test(value.evidenceCaseId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (typeof value.researchPlanId !== 'string' || !/^research-plan-[a-f0-9]{32}$/u.test(value.researchPlanId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  return value
}

function validateCircuitObservation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || canonical(Object.keys(value).sort()) !== canonical([...CIRCUIT_OBSERVATION_FIELDS].sort()) || value.schemaVersion !== 'jefe-research-connector-circuit-observation/v1') fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!Number.isSafeInteger(value.startSequence) || value.startSequence < 1 || !validTimestamp(value.startedAt) || (value.probeForOpenedAt !== null && !validTimestamp(value.probeForOpenedAt))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.probeForOpenedAt !== null && Date.parse(value.probeForOpenedAt) > Date.parse(value.startedAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.outcome === null) {
    if (value.outcomeSequence !== null || value.outcomeAt !== null) fail('INVALID_ATTEMPT', 'Intento invalido.')
  } else if (!CIRCUIT_OUTCOMES.includes(value.outcome) || !Number.isSafeInteger(value.outcomeSequence) || value.outcomeSequence <= value.startSequence || !validTimestamp(value.outcomeAt) || Date.parse(value.outcomeAt) < Date.parse(value.startedAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  return value
}

function validateAttemptRecord(value) {
  const allowed = ['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId', 'state', 'createdAt', 'connectorAttemptId', 'revision', 'budgetReservation', 'updatedAt', 'errorCode', 'receipt', 'research', 'delivery', 'circuitObservation', 'rootAttemptId', 'retryOfAttemptId', 'attemptNumber']
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.schemaVersion !== 'jefe-research-connector-attempt/v1' || !ATTEMPT_ID.test(value.connectorAttemptId) || !ATTEMPT_STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_ATTEMPT', 'Intento invalido.')
  for (const key of ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId']) if (typeof value[key] !== 'string' || !/^[a-z][a-z0-9-]{2,80}$/u.test(value[key])) fail('INVALID_ATTEMPT', 'Intento invalido.')
  let definition
  try { definition = connector(value.providerType) } catch { fail('INVALID_ATTEMPT', 'Intento invalido.') }
  if (value.connectorId !== definition.connectorId || !definition.supportedOperations.includes(value.operation) || !validTimestamp(value.createdAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.updatedAt !== undefined && !validTimestamp(value.updatedAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.updatedAt !== undefined && Date.parse(value.updatedAt) < Date.parse(value.createdAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!value.budgetReservation || typeof value.budgetReservation !== 'object' || Array.isArray(value.budgetReservation) || Object.keys(value.budgetReservation).some((key) => !['reserved', 'consumed'].includes(key))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!Number.isSafeInteger(value.budgetReservation.reserved) || value.budgetReservation.reserved < 0 || !Number.isSafeInteger(value.budgetReservation.consumed) || value.budgetReservation.consumed < 0 || value.budgetReservation.consumed > value.budgetReservation.reserved) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.errorCode !== undefined && !ERROR_CODES.has(value.errorCode)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.receipt !== undefined) validateReceipt(value.receipt)
  if (value.research !== undefined) validateResearch(value.research)
  if (value.circuitObservation !== undefined && value.circuitObservation !== null) validateCircuitObservation(value.circuitObservation)
  if (value.delivery !== undefined) {
    let cleanDelivery
    try { cleanDelivery = validateDelivery(value.delivery, value) } catch { fail('INVALID_ATTEMPT', 'Intento invalido.') }
    value = { ...value, delivery: cleanDelivery }
  }
  if (['prepared', 'running', 'contributing'].includes(value.state) && (value.errorCode !== undefined || value.receipt !== undefined || value.research !== undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['policy_blocked', 'not_connected', 'failed_transient', 'failed_permanent', 'timed_out', 'cancelled'].includes(value.state) && (value.receipt !== undefined || value.research !== undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['succeeded', 'partial'].includes(value.state) && (value.receipt === undefined || value.errorCode !== undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['succeeded', 'partial'].includes(value.state) && ((value.state === 'partial') !== (value.receipt?.status === 'partial'))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.receipt?.status === 'not_executed' && value.research !== undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['received', 'partial'].includes(value.receipt?.status) && value.research === undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.research && (value.research.researchRequestId !== value.researchRequestId || value.research.receiptId !== value.receipt?.receiptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  for (const key of ['rootAttemptId', 'retryOfAttemptId']) if (value[key] !== undefined && !ATTEMPT_ID.test(value[key])) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.attemptNumber !== undefined && (!Number.isSafeInteger(value.attemptNumber) || value.attemptNumber < 2)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  const lineageFieldCount = ['rootAttemptId', 'retryOfAttemptId', 'attemptNumber'].filter((field) => value[field] !== undefined).length
  if ((lineageFieldCount === 0 && value.connectorAttemptId !== initialAttemptId(value)) || (lineageFieldCount > 0 && (lineageFieldCount !== 3 || value.connectorAttemptId !== retryAttemptId(value)))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.state === 'contributing' && value.delivery?.state !== 'pending') fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery?.state === 'pending' && !['prepared', 'running', 'contributing', 'failed_transient', 'failed_permanent', 'cancelled'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery?.state === 'delivered' && !['succeeded', 'partial'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery && ['prepared', 'running'].includes(value.state) && (!value.retryOfAttemptId || !value.rootAttemptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['received', 'partial'].includes(value.receipt?.status) && (value.delivery?.state !== 'delivered' || value.delivery.receiptId !== value.receipt.receiptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.receipt?.status === 'not_executed' && value.delivery !== undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation && ['prepared', 'policy_blocked', 'not_connected'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation?.outcome === null && !['running'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation === null && !(value.state === 'running' || (value.state === 'cancelled' && value.errorCode === 'CANCELLED') || (value.state === 'failed_transient' && value.errorCode === 'CIRCUIT_OPEN'))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation?.outcome === 'success' && !['contributing', 'succeeded', 'partial'].includes(value.state) && value.delivery === undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation?.outcome === 'success' && value.receipt?.status === 'not_executed') fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation?.outcome === 'not_executed' && !(value.state === 'succeeded' && value.receipt?.status === 'not_executed' && value.delivery === undefined && value.research === undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation?.outcome === 'counted_failure' && !(value.state === 'timed_out' || (value.state === 'failed_transient' && ['ADAPTER_FAILURE', 'INTERRUPTED'].includes(value.errorCode) && value.delivery === undefined))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation?.outcome === 'uncounted_failure' && !['failed_permanent', 'cancelled'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!['prepared', 'policy_blocked', 'not_connected'].includes(value.state) && !validTimestamp(value.updatedAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.circuitObservation && (Date.parse(value.circuitObservation.startedAt) < Date.parse(value.createdAt) || (value.circuitObservation.outcomeAt !== null && Date.parse(value.circuitObservation.outcomeAt) > Date.parse(value.updatedAt)))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery?.state === 'delivered' && (!validTimestamp(value.updatedAt) || Date.parse(value.delivery.deliveredAt) > Date.parse(value.updatedAt))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  return JSON.parse(canonical(value))
}

function validateConnectorId(value) {
  if (typeof value !== 'string' || !CONNECTOR_ID.test(value) || !KNOWN_CONNECTOR_IDS.has(value)) fail('INVALID_CONNECTOR_ID', 'Connector invalido.')
  return value
}

function validateHealth(value) {
  const allowed = ['schemaVersion', 'connectorId', 'state', 'failureCount', 'openedAt', 'halfOpenEligibleAt', 'probeAttemptId', 'lastTransitionAt']
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key)) || value.schemaVersion !== 'jefe-research-connector-health/v1') fail('INVALID_HEALTH', 'Health invalido.')
  validateConnectorId(value.connectorId)
  if (!['closed', 'open', 'half_open'].includes(value.state) || !Number.isSafeInteger(value.failureCount) || value.failureCount < 0) fail('INVALID_HEALTH', 'Health invalido.')
  for (const key of ['openedAt', 'halfOpenEligibleAt', 'lastTransitionAt']) if (!validTimestamp(value[key], true)) fail('INVALID_HEALTH', 'Health invalido.')
  if (value.probeAttemptId !== null && !ATTEMPT_ID.test(value.probeAttemptId)) fail('INVALID_HEALTH', 'Health invalido.')
  if (value.state === 'closed' && (value.openedAt !== null || value.halfOpenEligibleAt !== null || value.probeAttemptId !== null)) fail('INVALID_HEALTH', 'Health invalido.')
  if (value.state === 'open' && (!validTimestamp(value.openedAt) || !validTimestamp(value.halfOpenEligibleAt) || value.probeAttemptId !== null)) fail('INVALID_HEALTH', 'Health invalido.')
  if (value.state === 'half_open' && (!validTimestamp(value.openedAt) || !validTimestamp(value.halfOpenEligibleAt) || !ATTEMPT_ID.test(value.probeAttemptId))) fail('INVALID_HEALTH', 'Health invalido.')
  return JSON.parse(canonical(value))
}

function attemptIdentity(value, fields = ATTEMPT_REPLAY_FIELDS) {
  return Object.fromEntries(fields.map((key) => [key, value?.[key] ?? null]))
}

function assertTransitionIntegrity(prior, proposed) {
  if (canonical(attemptIdentity(prior, ATTEMPT_IMMUTABLE_FIELDS)) !== canonical(attemptIdentity(proposed, ATTEMPT_IMMUTABLE_FIELDS))) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (!validTimestamp(proposed.updatedAt) || Date.parse(proposed.updatedAt) < Math.max(Date.parse(prior.createdAt), prior.updatedAt ? Date.parse(prior.updatedAt) : Number.NEGATIVE_INFINITY)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (proposed.budgetReservation?.reserved !== prior.budgetReservation.reserved || !Number.isSafeInteger(proposed.budgetReservation?.consumed) || proposed.budgetReservation.consumed < prior.budgetReservation.consumed) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (!prior.delivery && proposed.delivery && (prior.state !== 'running' || proposed.state !== 'contributing' || proposed.delivery.state !== 'pending' || Date.parse(proposed.delivery.createdAt) < Date.parse(prior.createdAt) || Date.parse(proposed.delivery.createdAt) > Date.parse(proposed.updatedAt))) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (prior.delivery) {
    if (!proposed.delivery) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    const immutable = (value) => Object.fromEntries(Object.entries(value).filter(([key]) => !['state', 'deliveredAt', 'receiptId'].includes(key)))
    if (canonical(immutable(prior.delivery)) !== canonical(immutable(proposed.delivery))) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (prior.delivery.state === 'delivered' && canonical(prior.delivery) !== canonical(proposed.delivery)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (prior.delivery.state === 'pending' && !['pending', 'delivered'].includes(proposed.delivery.state)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (prior.delivery.state === 'pending' && proposed.delivery.state === 'delivered' && !['succeeded', 'partial'].includes(proposed.state)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  }
  if (!prior.circuitObservation && proposed.circuitObservation && (prior.state !== 'prepared' || proposed.state !== 'running' || proposed.circuitObservation.outcome !== null)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (prior.circuitObservation) {
    if (!proposed.circuitObservation) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    const before = prior.circuitObservation
    const after = proposed.circuitObservation
    for (const key of ['schemaVersion', 'startSequence', 'startedAt', 'probeForOpenedAt']) if (before[key] !== after[key]) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (before.outcome !== null && canonical(before) !== canonical(after)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (before.outcome === null && after.outcome === null && canonical(before) !== canonical(after)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  }
  if (prior.circuitObservation === null && proposed.circuitObservation !== null) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
}

function circuitPolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || canonical(Object.keys(value).sort()) !== canonical(['circuitCooldownMs', 'maxTransientFailures']) || !Number.isSafeInteger(value.maxTransientFailures) || value.maxTransientFailures < 1 || !Number.isSafeInteger(value.circuitCooldownMs) || value.circuitCooldownMs < 1 || value.circuitCooldownMs > 3600000) fail('INVALID_HEALTH_POLICY', 'Politica de health invalida.')
  return value
}

function attemptContext(record) {
  return Object.fromEntries(['projectId', 'researchSessionId', 'researchRequestId', 'discoveryId', 'providerType', 'operation', 'connectorId'].map((field) => [field, record[field]]))
}

function deliveryLineageIdentity(value) {
  if (!value) return null
  return Object.fromEntries(Object.entries(value).filter(([field]) => !['state', 'deliveredAt', 'receiptId'].includes(field)))
}

function initialAttemptId(record) {
  const seed = Object.fromEntries(['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId'].map((field) => [field, record[field]]))
  return `connector-attempt-${crypto.createHash('sha256').update(canonical(seed)).digest('hex').slice(0, 32)}`
}

function retryAttemptId(record) {
  const seed = Object.fromEntries(['rootAttemptId', 'retryOfAttemptId', 'attemptNumber', 'projectId', 'researchSessionId', 'researchRequestId', 'discoveryId', 'connectorId'].map((field) => [field, record[field]]))
  return `connector-attempt-${crypto.createHash('sha256').update(canonical(seed)).digest('hex').slice(0, 32)}`
}

function invalidLineage(records, connectorId) {
  const byId = new Map(records.map((record) => [record.connectorAttemptId, record]))
  const invalid = new Set()
  for (const record of records.filter((item) => item.connectorId === connectorId)) {
    const lineageFields = ['rootAttemptId', 'retryOfAttemptId', 'attemptNumber']
    const present = lineageFields.filter((field) => record[field] !== undefined)
    if (present.length === 0) {
      if (record.connectorAttemptId !== initialAttemptId(record)) invalid.add(record.connectorAttemptId)
      continue
    }
    if (present.length !== lineageFields.length || record.connectorAttemptId !== retryAttemptId(record) || record.rootAttemptId === record.connectorAttemptId || record.retryOfAttemptId === record.connectorAttemptId) {
      invalid.add(record.connectorAttemptId)
      continue
    }
    const parent = byId.get(record.retryOfAttemptId)
    const root = byId.get(record.rootAttemptId)
    const parentNumber = parent?.attemptNumber || 1
    const expectedRootId = parent?.rootAttemptId || parent?.connectorAttemptId
    const rootHasLineage = root && lineageFields.some((field) => root[field] !== undefined)
    const retryableParent = parent && (parent.state === 'failed_transient' || (parent.state === 'policy_blocked' && parent.errorCode === 'CIRCUIT_OPEN'))
    const retryableRoot = root && (root.state === 'failed_transient' || (root.state === 'policy_blocked' && root.errorCode === 'CIRCUIT_OPEN'))
    const parentTerminalAt = parent?.updatedAt || parent?.createdAt
    if (!parent || !root || rootHasLineage || !retryableParent || !retryableRoot || !validTimestamp(parentTerminalAt) || Date.parse(record.createdAt) < Date.parse(parentTerminalAt) || expectedRootId !== record.rootAttemptId || record.attemptNumber !== parentNumber + 1 || canonical(attemptContext(parent)) !== canonical(attemptContext(record)) || canonical(attemptContext(root)) !== canonical(attemptContext(record)) || canonical(deliveryLineageIdentity(parent.delivery)) !== canonical(deliveryLineageIdentity(record.delivery))) invalid.add(record.connectorAttemptId)
    const visited = new Set([record.connectorAttemptId])
    let cursor = parent
    while (cursor?.retryOfAttemptId) {
      if (visited.has(cursor.connectorAttemptId)) {
        invalid.add(record.connectorAttemptId)
        break
      }
      visited.add(cursor.connectorAttemptId)
      cursor = byId.get(cursor.retryOfAttemptId)
    }
  }
  return invalid
}

function requireValidLineage(record, records) {
  if (invalidLineage(records, record.connectorId).has(record.connectorAttemptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
}

function requireInheritedDeliveryAtBirth(record, records) {
  if (!record.retryOfAttemptId) return
  const parent = records.find((item) => item.connectorAttemptId === record.retryOfAttemptId)
  if (!parent || canonical(parent.delivery ?? null) !== canonical(record.delivery ?? null)) fail('INVALID_ATTEMPT', 'Intento invalido.')
}

function requireCreatableAttempt(record) {
  if (!['prepared', 'policy_blocked', 'not_connected'].includes(record.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (record.revision !== undefined && record.revision !== 0) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (record.budgetReservation !== undefined && canonical(record.budgetReservation) !== canonical({ reserved: 0, consumed: 0 })) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['receipt', 'research', 'circuitObservation', 'updatedAt'].some((field) => Object.hasOwn(record, field))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (record.errorCode !== undefined && !(record.state === 'policy_blocked' && record.errorCode === 'CIRCUIT_OPEN')) fail('INVALID_ATTEMPT', 'Intento invalido.')
  const lineageCount = ['rootAttemptId', 'retryOfAttemptId', 'attemptNumber'].filter((field) => record[field] !== undefined).length
  if (lineageCount !== 0 && (lineageCount !== 3 || record.state !== 'prepared')) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (record.delivery !== undefined && (record.state !== 'prepared' || lineageCount !== 3 || record.delivery?.state !== 'pending')) fail('INVALID_ATTEMPT', 'Intento invalido.')
}

function latestCircuitTimestamp(records, connectorId) {
  let latest = Number.NEGATIVE_INFINITY
  for (const record of records) {
    if (record.connectorId !== connectorId || !record.circuitObservation) continue
    latest = Math.max(latest, Date.parse(record.circuitObservation.startedAt))
    if (record.circuitObservation.outcomeAt !== null) latest = Math.max(latest, Date.parse(record.circuitObservation.outcomeAt))
  }
  return latest
}

function deriveHealthSnapshot(connectorId, records, rawPolicy, corruptionCount = 0, validateStateMachine = true) {
  const policy = circuitPolicy(rawPolicy)
  const relevant = records.filter((record) => record.connectorId === connectorId)
  const invalidLineageIds = invalidLineage(records, connectorId)
  const events = []
  let legacyPhysicalAttempts = 0
  for (const record of relevant) {
    const observation = record.circuitObservation
    const reusedDelivery = Boolean(!invalidLineageIds.has(record.connectorAttemptId) && record.retryOfAttemptId && record.delivery)
    const physicallyRelevant = !reusedDelivery && (Boolean(record.delivery) || ['running', 'contributing', 'succeeded', 'partial', 'failed_permanent', 'timed_out', 'cancelled'].includes(record.state) || (record.state === 'failed_transient' && record.errorCode !== 'CIRCUIT_OPEN'))
    if (observation === null) continue
    if (!observation) {
      if (physicallyRelevant) legacyPhysicalAttempts += 1
      continue
    }
    events.push({ sequence: observation.startSequence, kind: 'start', record, observation })
    if (observation.outcome !== null) events.push({ sequence: observation.outcomeSequence, kind: 'outcome', record, observation })
  }
  events.sort((left, right) => left.sequence - right.sequence || left.record.connectorAttemptId.localeCompare(right.record.connectorAttemptId) || left.kind.localeCompare(right.kind))
  let duplicateSequences = 0
  for (let index = 1; index < events.length; index += 1) if (events[index - 1].sequence === events[index].sequence) duplicateSequences += 1
  const sequenceGap = events.some((event, index) => event.sequence !== index + 1)
  let timestampRegression = false
  let priorTimestamp = Number.NEGATIVE_INFINITY
  for (const event of events) {
    const currentTimestamp = Date.parse(event.kind === 'start' ? event.observation.startedAt : event.observation.outcomeAt)
    if (currentTimestamp < priorTimestamp) timestampRegression = true
    priorTimestamp = Math.max(priorTimestamp, currentTimestamp)
  }
  let health = { schemaVersion: 'jefe-research-connector-health/v1', connectorId, state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null }
  const close = (at) => ({ ...health, state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: at })
  const open = (at, increment) => {
    const failureCount = health.failureCount + (increment ? 1 : 0)
    return { ...health, state: 'open', failureCount, openedAt: at, halfOpenEligibleAt: new Date(Date.parse(at) + policy.circuitCooldownMs).toISOString(), probeAttemptId: null, lastTransitionAt: at }
  }
  const authorizedStarts = new Set()
  let unauthorizedStarts = 0
  for (const event of events) {
    const { observation, record } = event
    if (event.kind === 'start') {
      const ordinaryStart = health.state === 'closed' && observation.probeForOpenedAt === null
      const probeStart = health.state === 'open'
        && observation.probeForOpenedAt === health.openedAt
        && Date.parse(observation.startedAt) >= Date.parse(health.halfOpenEligibleAt)
      if (validateStateMachine && !ordinaryStart && !probeStart) {
        unauthorizedStarts += 1
        continue
      }
      authorizedStarts.add(record.connectorAttemptId)
      if (probeStart) health = { ...health, state: 'half_open', probeAttemptId: record.connectorAttemptId, lastTransitionAt: observation.startedAt }
      continue
    }
    if (!authorizedStarts.has(record.connectorAttemptId)) continue
    if (health.state === 'closed') {
      if (observation.outcome === 'success' && health.failureCount > 0) health = close(observation.outcomeAt)
      else if (observation.outcome === 'counted_failure') {
        const failureCount = health.failureCount + 1
        health = failureCount >= policy.maxTransientFailures
          ? { ...health, state: 'open', failureCount, openedAt: observation.outcomeAt, halfOpenEligibleAt: new Date(Date.parse(observation.outcomeAt) + policy.circuitCooldownMs).toISOString(), probeAttemptId: null, lastTransitionAt: observation.outcomeAt }
          : { ...health, failureCount, lastTransitionAt: observation.outcomeAt }
      }
      continue
    }
    if (health.state === 'open') {
      if (observation.outcome === 'counted_failure') health = open(observation.outcomeAt, true)
      continue
    }
    if (record.connectorAttemptId !== health.probeAttemptId) continue
    if (observation.outcome === 'success') health = close(observation.outcomeAt)
    else health = open(observation.outcomeAt, observation.outcome === 'counted_failure')
  }
  return {
    health,
    attemptsConsidered: relevant.length,
    observedAttemptCount: relevant.filter((record) => record.circuitObservation).length,
    sourceIntegrity: corruptionCount > 0 || invalidLineageIds.size > 0 || legacyPhysicalAttempts > 0 || duplicateSequences > 0 || sequenceGap || timestampRegression || unauthorizedStarts > 0 ? 'partial' : 'complete',
  }
}

function createConnectorPersistence({ root } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Root invalido.')
  const authorityRoot = resolvePhysicalRoot(root)
  const rootLockKey = physicalRootKey(authorityRoot)
  const attemptFile = (id) => path.join(authorityRoot, `${id}.json`)
  const indexFile = path.join(authorityRoot, 'attempt-index.json')
  const healthFile = (connectorId) => path.join(authorityRoot, `health-${connectorId}.json`)
  const isRecord = (name) => /^connector-attempt-[a-f0-9]{32}\.json$/u.test(name)
  const lockKey = (value) => `${rootLockKey}:${value}`

  async function atomic(target, clean) {
    const stage = `${target}.${process.pid}.${Date.now()}.${++stageSequence}.stage`
    await fs.promises.mkdir(authorityRoot, { recursive: true })
    try {
      await fs.promises.writeFile(stage, `${canonical(clean)}\n`, 'utf8')
      await fs.promises.rename(stage, target)
    } finally {
      await fs.promises.rm(stage, { force: true }).catch(() => {})
    }
    return clean
  }

  async function read(id) {
    if (typeof id !== 'string' || !ATTEMPT_ID.test(id)) fail('INVALID_ATTEMPT_ID', 'Intento invalido.')
    try {
      const value = validateAttemptRecord(JSON.parse(await fs.promises.readFile(attemptFile(id), 'utf8')))
      if (value.connectorAttemptId !== id) fail('CORRUPT_ATTEMPT', 'Intento corrupto.')
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return null
      if (error.code === 'CORRUPT_ATTEMPT') throw error
      fail('CORRUPT_ATTEMPT', 'Intento corrupto.')
    }
  }

  async function scanDetailed(projectId) {
    try {
      const names = (await fs.promises.readdir(authorityRoot)).filter(isRecord).sort()
      const records = []
      const corruptions = []
      for (const name of names) {
        const id = name.slice(0, -5)
        try {
          const item = await read(id)
          if (item && (!projectId || item.projectId === projectId)) records.push(item)
        } catch (error) {
          if (error.code !== 'CORRUPT_ATTEMPT') throw error
          corruptions.push({ connectorAttemptId: id, code: 'CORRUPT_ATTEMPT' })
        }
      }
      return { records, corruptions }
    } catch (error) {
      if (error.code === 'ENOENT') return { records: [], corruptions: [] }
      throw error
    }
  }

  async function listDetailed(projectId, limit = 50) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) fail('INVALID_LIMIT', 'Limite invalido.')
    const detail = await scanDetailed(projectId)
    return { records: detail.records.slice(0, limit), corruptions: detail.corruptions.slice(0, limit) }
  }

  async function listAttempts(projectId, limit = 50) {
    return (await listDetailed(projectId, limit)).records
  }

  async function listAllAttempts(projectId) {
    return (await scanDetailed(projectId)).records
  }

  async function listAllDetailed(projectId) {
    return scanDetailed(projectId)
  }

  async function withExactAttemptSnapshots(projectId, snapshots, work) {
    if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{2,80}$/u.test(projectId) || !Array.isArray(snapshots) || snapshots.length > 50 || typeof work !== 'function') fail('INVALID_ATTEMPT_SNAPSHOTS', 'Snapshots de attempts invalidos.')
    const fields = ['connectorAttemptId', 'revision', 'state', 'deliveryId', 'deliveryState', 'fingerprint']
    const seen = new Set()
    const exact = snapshots.map((snapshot) => {
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || canonical(Object.keys(snapshot).sort()) !== canonical(fields.sort()) || !ATTEMPT_ID.test(snapshot.connectorAttemptId) || seen.has(snapshot.connectorAttemptId)) fail('INVALID_ATTEMPT_SNAPSHOTS', 'Snapshots de attempts invalidos.')
      const missing = snapshot.revision === null && snapshot.state === null && snapshot.deliveryId === null && snapshot.deliveryState === null && snapshot.fingerprint === null
      const present = Number.isSafeInteger(snapshot.revision) && snapshot.revision >= 0 && ATTEMPT_STATES.includes(snapshot.state) && (snapshot.deliveryId === null || DELIVERY_ID.test(snapshot.deliveryId)) && (snapshot.deliveryState === null || ['pending', 'delivered'].includes(snapshot.deliveryState)) && typeof snapshot.fingerprint === 'string' && /^[a-f0-9]{64}$/u.test(snapshot.fingerprint)
      if (!missing && !present) fail('INVALID_ATTEMPT_SNAPSHOTS', 'Snapshots de attempts invalidos.')
      seen.add(snapshot.connectorAttemptId)
      return JSON.parse(canonical(snapshot))
    }).sort((left, right) => left.connectorAttemptId.localeCompare(right.connectorAttemptId))
    return lockedMany(exact.map((snapshot) => lockKey(snapshot.connectorAttemptId)), async () => {
      const captured = []
      for (const snapshot of exact) {
        const record = await read(snapshot.connectorAttemptId)
        const missing = snapshot.revision === null
        if (missing) {
          if (record) fail('STALE_ATTEMPT_SNAPSHOT', 'El attempt ausente ya no coincide con el snapshot.')
          captured.push({ connectorAttemptId: snapshot.connectorAttemptId, record: null })
          continue
        }
        const current = record && {
          connectorAttemptId: record.connectorAttemptId,
          revision: record.revision,
          state: record.state,
          deliveryId: record.delivery?.deliveryId || null,
          deliveryState: record.delivery?.state || null,
          fingerprint: crypto.createHash('sha256').update(canonical(record)).digest('hex'),
        }
        if (!record || record.projectId !== projectId || canonical(current) !== canonical(snapshot)) fail('STALE_ATTEMPT_SNAPSHOT', 'El attempt ya no coincide con el snapshot.')
        captured.push({ connectorAttemptId: snapshot.connectorAttemptId, record })
      }
      return work(JSON.parse(canonical(captured)))
    })
  }

  async function createReservedAttempt(record, { maxReservationsPerProject, reservationCost }) {
    if (!Number.isSafeInteger(maxReservationsPerProject) || maxReservationsPerProject < 0 || !Number.isSafeInteger(reservationCost) || reservationCost < 0) fail('INVALID_RESERVATION_POLICY', 'Reserva invalida.')
    let snapshot
    try { snapshot = structuredClone(record) } catch { fail('INVALID_ATTEMPT', 'Intento invalido.') }
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || !ATTEMPT_ID.test(snapshot.connectorAttemptId) || typeof snapshot.projectId !== 'string' || !/^[a-z][a-z0-9-]{2,80}$/u.test(snapshot.projectId) || typeof snapshot.connectorId !== 'string' || CONNECTORS[snapshot.providerType]?.connectorId !== snapshot.connectorId) fail('INVALID_ATTEMPT', 'Intento invalido.')
    requireCreatableAttempt(snapshot)
    const reservationLocks = [lockKey(`circuit:${snapshot.connectorId}`), lockKey(snapshot.connectorAttemptId), lockKey(`project:${snapshot.projectId}`)].sort()
    return lockedMany(reservationLocks, async () => {
      const existing = await read(snapshot.connectorAttemptId)
      const detail = await scanDetailed(undefined)
      const records = detail.records
      const sourceBefore = deriveHealthSnapshot(snapshot.connectorId, records, SOURCE_INTEGRITY_POLICY, detail.corruptions.length, false)
      if (sourceBefore.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      if (existing) {
        if (canonical(attemptIdentity(existing)) !== canonical(attemptIdentity(snapshot))) fail('INCOMPATIBLE_REPLAY', 'Replay incompatible.')
        validateAttemptRecord({ ...snapshot, revision: snapshot.revision ?? 0, budgetReservation: snapshot.budgetReservation ?? { reserved: 0, consumed: 0 } })
        requireValidLineage(existing, records)
        return { record: existing, idempotent: true }
      }
      snapshot = validateAttemptRecord({
        ...snapshot,
        revision: snapshot.revision ?? 0,
        budgetReservation: snapshot.budgetReservation ?? { reserved: 0, consumed: 0 },
      })
      const reserved = records.filter((item) => item.projectId === snapshot.projectId).reduce((total, item) => total + item.budgetReservation.reserved, 0)
      const mayReserve = snapshot.state === 'prepared' && reserved + reservationCost <= maxReservationsPerProject
      const clean = validateAttemptRecord({
        ...snapshot,
        revision: 0,
        state: snapshot.state === 'prepared' && !mayReserve ? 'policy_blocked' : snapshot.state,
        ...(snapshot.state === 'prepared' && !mayReserve ? { errorCode: 'BUDGET_EXHAUSTED' } : {}),
        budgetReservation: { reserved: mayReserve ? reservationCost : 0, consumed: 0 },
      })
      requireValidLineage(clean, [...records, clean])
      requireInheritedDeliveryAtBirth(clean, records)
      const sourceAfter = deriveHealthSnapshot(clean.connectorId, [...records, clean], SOURCE_INTEGRITY_POLICY, detail.corruptions.length, false)
      if (sourceAfter.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      return { record: await atomic(attemptFile(clean.connectorAttemptId), clean), idempotent: false }
    })
  }

  function projectAttemptTransition(prior, spec) {
    let proposed
    if (typeof spec === 'function') {
      proposed = spec(prior)
      if (canonical(prior) === canonical(proposed)) return { record: prior, idempotent: true }
      if (!proposed || !TRANSITIONS[prior.state]?.includes(proposed.state)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    } else {
      if (!spec || typeof spec !== 'object' || !Array.isArray(spec.expectedStates) || !Number.isSafeInteger(spec.expectedRevision) || typeof spec.nextState !== 'string' || !spec.patch || typeof spec.patch !== 'object') fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
      if (!spec.expectedStates.includes(prior.state) || prior.revision !== spec.expectedRevision) fail('STALE_TRANSITION', 'Transicion obsoleta.')
      const { circuitObservation, ...transitionPatch } = spec.patch
      proposed = transition(prior, spec.nextState, transitionPatch)
      if (circuitObservation !== undefined) proposed = { ...proposed, circuitObservation }
    }
    assertTransitionIntegrity(prior, proposed)
    const clean = validateAttemptRecord({ ...proposed, revision: prior.revision + 1 })
    return { record: clean, idempotent: false }
  }

  async function transitionAttemptUnlocked(id, spec) {
    const prior = await read(id)
    if (!prior) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    const projected = projectAttemptTransition(prior, spec)
    if (projected.idempotent) return projected
    const clean = projected.record
    return { record: await atomic(attemptFile(id), clean), idempotent: false }
  }

  async function persistProjectedAttempt(id, prior, projected) {
    return locked(lockKey(id), async () => {
      const current = await read(id)
      if (!current || canonical(current) !== canonical(prior)) fail('STALE_TRANSITION', 'Transicion obsoleta.')
      return { record: await atomic(attemptFile(id), projected.record), idempotent: false }
    })
  }

  async function transitionAttempt(id, spec) {
    if (typeof id !== 'string' || !ATTEMPT_ID.test(id)) fail('INVALID_ATTEMPT_ID', 'Intento invalido.')
    const initial = await read(id)
    if (!initial) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    return lockedMany([lockKey(`circuit:${initial.connectorId}`), lockKey(id)], async () => {
      const prior = await read(id)
      if (!prior) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
      const projected = projectAttemptTransition(prior, spec)
      if (projected.idempotent) return projected
      const priorCircuit = { present: Object.hasOwn(prior, 'circuitObservation'), value: prior.circuitObservation ?? null }
      const projectedCircuit = { present: Object.hasOwn(projected.record, 'circuitObservation'), value: projected.record.circuitObservation ?? null }
      const circuitChanged = canonical(priorCircuit) !== canonical(projectedCircuit)
      const safePreExecutionCancellation = !priorCircuit.present
        && projectedCircuit.present
        && projectedCircuit.value === null
        && prior.state === 'prepared'
        && projected.record.state === 'cancelled'
        && projected.record.errorCode === 'CANCELLED'
      if (circuitChanged && !safePreExecutionCancellation) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
      const detail = await scanDetailed(undefined)
      const sourceBefore = deriveHealthSnapshot(prior.connectorId, detail.records, SOURCE_INTEGRITY_POLICY, detail.corruptions.length, false)
      if (sourceBefore.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      const projectedRecords = detail.records.map((item) => item.connectorAttemptId === projected.record.connectorAttemptId ? projected.record : item)
      const sourceAfter = deriveHealthSnapshot(prior.connectorId, projectedRecords, SOURCE_INTEGRITY_POLICY, detail.corruptions.length, false)
      if (sourceAfter.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      return { record: await atomic(attemptFile(id), projected.record), idempotent: false }
    })
  }

  async function reconcileExactAttempts(projectId, candidates, options, isEligible) {
    const candidateFields = ['connectorAttemptId', 'revision', 'state', 'deliveryId']
    const optionFields = ['now', 'maxTransientFailures', 'circuitCooldownMs']
    if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{2,80}$/u.test(projectId) || !Array.isArray(candidates) || candidates.length < 1 || candidates.length > 50 || !options || typeof options !== 'object' || Array.isArray(options) || canonical(Object.keys(options).sort()) !== canonical(optionFields.sort()) || !validTimestamp(options.now) || typeof isEligible !== 'function') fail('INVALID_EXACT_RECONCILIATION', 'Reconciliacion exacta invalida.')
    const policy = circuitPolicy({ maxTransientFailures: options.maxTransientFailures, circuitCooldownMs: options.circuitCooldownMs })
    const seen = new Set()
    const exact = candidates.map((candidate) => {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || canonical(Object.keys(candidate).sort()) !== canonical(candidateFields.sort()) || !ATTEMPT_ID.test(candidate.connectorAttemptId) || !Number.isSafeInteger(candidate.revision) || candidate.revision < 0 || !ATTEMPT_STATES.includes(candidate.state) || (candidate.deliveryId !== null && !DELIVERY_ID.test(candidate.deliveryId)) || seen.has(candidate.connectorAttemptId)) fail('INVALID_EXACT_RECONCILIATION', 'Reconciliacion exacta invalida.')
      seen.add(candidate.connectorAttemptId)
      return JSON.parse(canonical(candidate))
    })
    const preliminary = []
    for (const candidate of exact) {
      try { preliminary.push(await read(candidate.connectorAttemptId)) } catch (error) {
        if (error.code !== 'CORRUPT_ATTEMPT') throw error
        preliminary.push(null)
      }
    }
    const circuitKeys = [...new Set(preliminary.filter(Boolean).map((record) => lockKey(`circuit:${record.connectorId}`)))].sort()
    const attemptKeys = exact.map((candidate) => lockKey(candidate.connectorAttemptId)).sort()
    return lockedMany([...circuitKeys, ...attemptKeys], async () => {
      const inspected = []
      for (const candidate of exact) {
        let record
        try { record = await read(candidate.connectorAttemptId) } catch (error) {
          if (error.code !== 'CORRUPT_ATTEMPT') throw error
          inspected.push({ candidate, record: null, status: 'stale' })
          continue
        }
        const deliveryId = record?.delivery?.deliveryId || null
        if (!record || record.projectId !== projectId) {
          inspected.push({ candidate, record: null, status: 'stale' })
          continue
        }
        if (record.revision !== candidate.revision || record.state !== candidate.state || deliveryId !== candidate.deliveryId) {
          inspected.push({ candidate, record, status: 'stale' })
          continue
        }
        const eligible = isEligible(JSON.parse(canonical(record)))
        if (typeof eligible !== 'boolean') fail('INVALID_EXACT_RECONCILIATION', 'Reconciliacion exacta invalida.')
        inspected.push({ candidate, record, status: ['running', 'contributing'].includes(record.state) && eligible ? null : 'ineligible' })
      }
      if (inspected.some((item) => item.status !== null)) return {
        records: [],
        results: inspected.map((item) => ({ connectorAttemptId: item.candidate.connectorAttemptId, status: item.status || 'aborted', record: item.record ? JSON.parse(canonical(item.record)) : null })),
      }
      const before = await scanDetailed(undefined)
      for (const connectorId of [...new Set(inspected.map((item) => item.record.connectorId))].sort()) {
        const source = deriveHealthSnapshot(connectorId, before.records, policy, before.corruptions.length)
        if (source.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      }
      let journal = before.records
      const records = []
      const results = []
      for (const { record } of inspected) {
        const deniedByCircuit = record.circuitObservation === null
        const outcome = record.delivery || deniedByCircuit ? 'uncounted_failure' : 'counted_failure'
        const transitionAt = new Date(Math.max(latestCircuitTimestamp(journal, record.connectorId), ...[options.now, record.createdAt, record.updatedAt, record.circuitObservation?.startedAt].filter(Boolean).map((value) => Date.parse(value)))).toISOString()
        let circuitObservation = record.circuitObservation
        if (circuitObservation?.outcome === null) circuitObservation = { ...circuitObservation, outcome, outcomeSequence: nextCircuitSequence(journal, record.connectorId), outcomeAt: transitionAt }
        const projected = projectAttemptTransition(record, {
          expectedStates: [record.state],
          expectedRevision: record.revision,
          nextState: 'failed_transient',
          patch: {
            errorCode: deniedByCircuit ? 'CIRCUIT_OPEN' : 'INTERRUPTED',
            budgetReservation: { ...record.budgetReservation, consumed: record.budgetReservation.reserved },
            updatedAt: transitionAt,
            ...(circuitObservation !== undefined ? { circuitObservation } : {}),
          },
        }).record
        const projectedJournal = journal.map((item) => item.connectorAttemptId === projected.connectorAttemptId ? projected : item)
        const projectedSource = deriveHealthSnapshot(record.connectorId, projectedJournal, policy, before.corruptions.length)
        if (projectedSource.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
        try {
          const saved = await atomic(attemptFile(projected.connectorAttemptId), projected)
          records.push(saved)
          results.push({ connectorAttemptId: saved.connectorAttemptId, status: 'reconciled', record: JSON.parse(canonical(saved)) })
          journal = projectedJournal
        } catch {
          results.push({ connectorAttemptId: record.connectorAttemptId, status: 'failed', record: JSON.parse(canonical(record)) })
        }
      }
      const after = await scanDetailed(undefined)
      for (const connectorId of [...new Set(records.map((record) => record.connectorId))].sort()) {
        const derived = deriveHealthSnapshot(connectorId, after.records, policy, after.corruptions.length)
        if (derived.sourceIntegrity === 'complete') await replaceDerivedHealth(derived.health)
      }
      return { records: JSON.parse(canonical(records)), results }
    })
  }

  async function rebuildIndex() {
    return locked(lockKey('index'), async () => {
      const detail = await scanDetailed(undefined)
      const index = { schemaVersion: 'jefe-research-connector-index/v1', attemptIds: detail.records.map((item) => item.connectorAttemptId).sort(), corruptions: detail.corruptions, rebuiltAt: null }
      let prior = null
      try { prior = JSON.parse(await fs.promises.readFile(indexFile, 'utf8')) } catch {}
      if (prior && canonical(prior) === canonical(index)) return { index: prior, idempotent: true }
      return { index: await atomic(indexFile, index), idempotent: false }
    })
  }

  async function readHealth(connectorId) {
    validateConnectorId(connectorId)
    try {
      const health = validateHealth(JSON.parse(await fs.promises.readFile(healthFile(connectorId), 'utf8')))
      if (health.connectorId !== connectorId) fail('CORRUPT_HEALTH', 'Registro corrupto.')
      return health
    } catch (error) {
      if (error.code === 'ENOENT') return { schemaVersion: 'jefe-research-connector-health/v1', connectorId, state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null }
      if (error.code === 'CORRUPT_HEALTH') throw error
      if (error instanceof SyntaxError || ['INVALID_HEALTH', 'INVALID_CONNECTOR_ID'].includes(error.code)) fail('CORRUPT_HEALTH', 'Registro corrupto.')
      throw error
    }
  }

  async function readHealthDetailed(connectorId) {
    validateConnectorId(connectorId)
    try {
      const health = validateHealth(JSON.parse(await fs.promises.readFile(healthFile(connectorId), 'utf8')))
      if (health.connectorId !== connectorId) return { health: null, exists: true, corrupt: true }
      return { health, exists: true, corrupt: false }
    } catch (error) {
      if (error.code === 'ENOENT') return { health: null, exists: false, corrupt: false }
      if (error instanceof SyntaxError || ['INVALID_HEALTH', 'INVALID_CONNECTOR_ID'].includes(error.code)) return { health: null, exists: true, corrupt: true }
      throw error
    }
  }

  async function saveHealth(value) {
    const clean = validateHealth(value)
    return locked(lockKey(`health:${clean.connectorId}`), async () => {
      let prior = null
      try {
        prior = validateHealth(JSON.parse(await fs.promises.readFile(healthFile(clean.connectorId), 'utf8')))
        if (prior.connectorId !== clean.connectorId) fail('CORRUPT_HEALTH', 'Registro corrupto.')
      } catch (error) {
        if (error.code !== 'ENOENT') fail('CORRUPT_HEALTH', 'Registro corrupto.')
      }
      if (prior && canonical(prior) === canonical(clean)) return { health: prior, idempotent: true }
      return { health: await atomic(healthFile(clean.connectorId), clean), idempotent: false }
    })
  }

  async function replaceDerivedHealth(value) {
    const clean = validateHealth(value)
    return locked(lockKey(`health:${clean.connectorId}`), async () => {
      let prior = null
      let replacedCorrupt = false
      try {
        prior = validateHealth(JSON.parse(await fs.promises.readFile(healthFile(clean.connectorId), 'utf8')))
        if (prior.connectorId !== clean.connectorId) {
          prior = null
          replacedCorrupt = true
        }
      } catch (error) {
        if (error.code === 'ENOENT') prior = null
        else if (error instanceof SyntaxError || ['INVALID_HEALTH', 'INVALID_CONNECTOR_ID', 'CORRUPT_HEALTH'].includes(error.code)) replacedCorrupt = true
        else throw error
      }
      if (prior && canonical(prior) === canonical(clean)) return { health: prior, idempotent: true, replacedCorrupt: false }
      return { health: await atomic(healthFile(clean.connectorId), clean), idempotent: false, replacedCorrupt }
    })
  }

  function nextCircuitSequence(records, connectorId) {
    let maximum = 0
    for (const record of records) {
      if (record.connectorId !== connectorId || !record.circuitObservation) continue
      maximum = Math.max(maximum, record.circuitObservation.startSequence, record.circuitObservation.outcomeSequence || 0)
    }
    if (maximum >= Number.MAX_SAFE_INTEGER) fail('CIRCUIT_SEQUENCE_EXHAUSTED', 'Secuencia de health agotada.')
    return maximum + 1
  }

  async function rebuildDerivedHealth(connectorId, rawPolicy) {
    validateConnectorId(connectorId)
    const policy = circuitPolicy(rawPolicy)
    return locked(lockKey(`circuit:${connectorId}`), async () => {
      const detail = await scanDetailed(undefined)
      const derived = deriveHealthSnapshot(connectorId, detail.records, policy, detail.corruptions.length)
      if (derived.sourceIntegrity !== 'complete') {
        return { health: null, idempotent: true, replacedCorrupt: false, materialized: false, attemptsConsidered: derived.attemptsConsidered, observedAttemptCount: derived.observedAttemptCount, sourceIntegrity: derived.sourceIntegrity, corruptionCount: detail.corruptions.length }
      }
      const saved = await replaceDerivedHealth(derived.health)
      return { ...saved, materialized: true, attemptsConsidered: derived.attemptsConsidered, observedAttemptCount: derived.observedAttemptCount, sourceIntegrity: derived.sourceIntegrity, corruptionCount: detail.corruptions.length }
    })
  }

  async function diagnoseDerivedHealth(connectorId, rawPolicy) {
    validateConnectorId(connectorId)
    const policy = circuitPolicy(rawPolicy)
    return locked(lockKey(`circuit:${connectorId}`), async () => {
      const detail = await scanDetailed(undefined)
      const derived = deriveHealthSnapshot(connectorId, detail.records, policy, detail.corruptions.length)
      const current = await readHealthDetailed(connectorId)
      let drift = 'unknown'
      if (derived.sourceIntegrity === 'complete') {
        if (current.corrupt) drift = 'corrupt'
        else if (!current.exists) drift = 'missing'
        else drift = canonical(current.health) === canonical(derived.health) ? 'none' : 'mismatch'
      }
      return {
        derivedHealth: derived.sourceIntegrity === 'complete' ? derived.health : null,
        materializedHealth: current.health,
        sourceIntegrity: derived.sourceIntegrity,
        drift,
        attemptsConsidered: derived.attemptsConsidered,
        observedAttemptCount: derived.observedAttemptCount,
        corruptionCount: detail.corruptions.length,
      }
    })
  }

  async function claimExecution(id, options) {
    if (typeof id !== 'string' || !ATTEMPT_ID.test(id) || !options || typeof options !== 'object' || Array.isArray(options) || canonical(Object.keys(options).sort()) !== canonical(['circuitCooldownMs', 'expectedRevision', 'maxTransientFailures', 'now']) || !Number.isSafeInteger(options.expectedRevision) || !validTimestamp(options.now)) fail('INVALID_CIRCUIT_CLAIM', 'Claim de ejecucion invalido.')
    const policy = circuitPolicy({ maxTransientFailures: options.maxTransientFailures, circuitCooldownMs: options.circuitCooldownMs })
    const initial = await read(id)
    if (!initial) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    return locked(lockKey(`circuit:${initial.connectorId}`), async () => {
      const prior = await read(id)
      if (!prior || prior.state !== 'prepared' || prior.revision !== options.expectedRevision) fail('STALE_TRANSITION', 'Transicion obsoleta.')
      const detail = await scanDetailed(undefined)
      const before = deriveHealthSnapshot(prior.connectorId, detail.records, policy, detail.corruptions.length)
      if (before.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      if (Date.parse(options.now) < Math.max(Date.parse(prior.createdAt), prior.updatedAt ? Date.parse(prior.updatedAt) : Number.NEGATIVE_INFINITY, latestCircuitTimestamp(detail.records, prior.connectorId))) fail('INVALID_CIRCUIT_CLAIM', 'Claim de ejecucion invalido.')
      const beforeCooldown = before.health.state === 'open' && Date.parse(options.now) < Date.parse(before.health.halfOpenEligibleAt)
      const allowed = before.health.state !== 'half_open' && !beforeCooldown
      let saved
      if (allowed) {
        const observation = {
          schemaVersion: 'jefe-research-connector-circuit-observation/v1',
          startSequence: nextCircuitSequence(detail.records, prior.connectorId),
          startedAt: options.now,
          probeForOpenedAt: before.health.state === 'open' ? before.health.openedAt : null,
          outcome: null,
          outcomeSequence: null,
          outcomeAt: null,
        }
        const projected = projectAttemptTransition(prior, { expectedStates: ['prepared'], expectedRevision: prior.revision, nextState: 'running', patch: { circuitObservation: observation, updatedAt: options.now } })
        const projectedRecords = detail.records.map((item) => item.connectorAttemptId === projected.record.connectorAttemptId ? projected.record : item)
        const after = deriveHealthSnapshot(prior.connectorId, projectedRecords, policy, detail.corruptions.length)
        if (after.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
        saved = await persistProjectedAttempt(id, prior, projected)
        await replaceDerivedHealth(after.health)
      } else {
        const projected = projectAttemptTransition(prior, { expectedStates: ['prepared'], expectedRevision: prior.revision, nextState: 'running', patch: { circuitObservation: null, updatedAt: options.now } })
        saved = await persistProjectedAttempt(id, prior, projected)
      }
      return { ...saved, allowed, sourceIntegrity: before.sourceIntegrity }
    })
  }

  async function completeCircuitObservation(id, options) {
    const fields = ['expectedStates', 'expectedRevision', 'nextState', 'patch', 'outcome', 'now', 'maxTransientFailures', 'circuitCooldownMs']
    if (typeof id !== 'string' || !ATTEMPT_ID.test(id) || !options || typeof options !== 'object' || Array.isArray(options) || canonical(Object.keys(options).sort()) !== canonical(fields.sort()) || !Array.isArray(options.expectedStates) || !Number.isSafeInteger(options.expectedRevision) || typeof options.nextState !== 'string' || !options.patch || typeof options.patch !== 'object' || Array.isArray(options.patch) || !CIRCUIT_OUTCOMES.includes(options.outcome) || !validTimestamp(options.now)) fail('INVALID_CIRCUIT_OUTCOME', 'Outcome de ejecucion invalido.')
    const policy = circuitPolicy({ maxTransientFailures: options.maxTransientFailures, circuitCooldownMs: options.circuitCooldownMs })
    const initial = await read(id)
    if (!initial) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    return locked(lockKey(`circuit:${initial.connectorId}`), async () => {
      const prior = await read(id)
      if (!prior || !options.expectedStates.includes(prior.state) || prior.revision !== options.expectedRevision || !prior.circuitObservation || prior.circuitObservation.outcome !== null) fail('STALE_TRANSITION', 'Transicion obsoleta.')
      const detail = await scanDetailed(undefined)
      const before = deriveHealthSnapshot(prior.connectorId, detail.records, policy, detail.corruptions.length)
      if (before.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      if (Date.parse(options.now) < Math.max(Date.parse(prior.createdAt), prior.updatedAt ? Date.parse(prior.updatedAt) : Number.NEGATIVE_INFINITY, latestCircuitTimestamp(detail.records, prior.connectorId))) fail('INVALID_CIRCUIT_OUTCOME', 'Outcome de ejecucion invalido.')
      const observation = { ...prior.circuitObservation, outcome: options.outcome, outcomeSequence: nextCircuitSequence(detail.records, prior.connectorId), outcomeAt: options.now }
      const projected = projectAttemptTransition(prior, { expectedStates: options.expectedStates, expectedRevision: prior.revision, nextState: options.nextState, patch: { ...options.patch, circuitObservation: observation } })
      const projectedRecords = detail.records.map((item) => item.connectorAttemptId === projected.record.connectorAttemptId ? projected.record : item)
      const derived = deriveHealthSnapshot(prior.connectorId, projectedRecords, policy, detail.corruptions.length)
      if (derived.sourceIntegrity !== 'complete') fail('HEALTH_SOURCE_INCOMPLETE', 'Fuente de health incompleta.')
      const saved = await persistProjectedAttempt(id, prior, projected)
      const materialized = await replaceDerivedHealth(derived.health)
      return { ...saved, health: materialized.health, sourceIntegrity: derived.sourceIntegrity }
    })
  }

  async function updateHealth(connectorId, updater) {
    validateConnectorId(connectorId)
    if (typeof updater !== 'function') fail('INVALID_HEALTH', 'Health invalido.')
    return locked(lockKey(`health:${connectorId}`), async () => {
      const prior = await readHealth(connectorId)
      const proposed = validateHealth(updater(prior))
      if (canonical(prior) === canonical(proposed)) return { health: prior, idempotent: true }
      return { health: await atomic(healthFile(connectorId), proposed), idempotent: false }
    })
  }

  return { authorityRoot, read, getAttempt: read, createReservedAttempt, transitionAttempt, reconcileExactAttempts, listAttempts, listAllAttempts, listDetailed, listAllDetailed, withExactAttemptSnapshots, rebuildIndex, readHealth, readHealthDetailed, saveHealth, diagnoseDerivedHealth, rebuildDerivedHealth, claimExecution, completeCircuitObservation, updateHealth }
}

module.exports = { ConnectorPersistenceError, createConnectorPersistence }
