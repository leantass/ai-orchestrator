const fs = require('fs')
const path = require('path')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { ATTEMPT_ID, ATTEMPT_STATES, CONNECTOR_ID, CONNECTORS, TRANSITIONS, connector, transition, validateDelivery } = require('./jefe-research-connector-contract.cjs')

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
const RESEARCH_STATES = new Set(['evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence'])
const KNOWN_CONNECTOR_IDS = new Set(Object.values(CONNECTORS).map((item) => item.connectorId))
const ATTEMPT_REPLAY_FIELDS = Object.freeze(['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId', 'connectorAttemptId', 'rootAttemptId', 'retryOfAttemptId', 'attemptNumber'])
const ATTEMPT_IMMUTABLE_FIELDS = Object.freeze([...ATTEMPT_REPLAY_FIELDS, 'createdAt'])

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
  if (value.evidenceId !== null && (typeof value.evidenceId !== 'string' || !/^evidence-[a-f0-9]{32}$/u.test(value.evidenceId))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.evidenceCaseId !== undefined && !/^evidence-case-[a-f0-9]{32}$/u.test(value.evidenceCaseId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.researchPlanId !== undefined && !/^research-plan-[a-f0-9]{32}$/u.test(value.researchPlanId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  return value
}

function validateAttemptRecord(value) {
  const allowed = ['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId', 'state', 'createdAt', 'connectorAttemptId', 'revision', 'budgetReservation', 'updatedAt', 'errorCode', 'receipt', 'research', 'delivery', 'rootAttemptId', 'retryOfAttemptId', 'attemptNumber']
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.schemaVersion !== 'jefe-research-connector-attempt/v1' || !ATTEMPT_ID.test(value.connectorAttemptId) || !ATTEMPT_STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_ATTEMPT', 'Intento invalido.')
  for (const key of ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId']) if (typeof value[key] !== 'string' || !/^[a-z][a-z0-9-]{2,80}$/u.test(value[key])) fail('INVALID_ATTEMPT', 'Intento invalido.')
  let definition
  try { definition = connector(value.providerType) } catch { fail('INVALID_ATTEMPT', 'Intento invalido.') }
  if (value.connectorId !== definition.connectorId || !definition.supportedOperations.includes(value.operation) || !validTimestamp(value.createdAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.updatedAt !== undefined && !validTimestamp(value.updatedAt)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!value.budgetReservation || typeof value.budgetReservation !== 'object' || Array.isArray(value.budgetReservation) || Object.keys(value.budgetReservation).some((key) => !['reserved', 'consumed'].includes(key))) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (!Number.isSafeInteger(value.budgetReservation.reserved) || value.budgetReservation.reserved < 0 || !Number.isSafeInteger(value.budgetReservation.consumed) || value.budgetReservation.consumed < 0 || value.budgetReservation.consumed > value.budgetReservation.reserved) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.errorCode !== undefined && !ERROR_CODES.has(value.errorCode)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.receipt !== undefined) validateReceipt(value.receipt)
  if (value.research !== undefined) validateResearch(value.research)
  if (value.delivery !== undefined) {
    let cleanDelivery
    try { cleanDelivery = validateDelivery(value.delivery, value) } catch { fail('INVALID_ATTEMPT', 'Intento invalido.') }
    value = { ...value, delivery: cleanDelivery }
  }
  if (['prepared', 'running', 'contributing'].includes(value.state) && (value.errorCode !== undefined || value.receipt !== undefined || value.research !== undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['policy_blocked', 'not_connected', 'failed_transient', 'failed_permanent', 'timed_out', 'cancelled'].includes(value.state) && (value.receipt !== undefined || value.research !== undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['succeeded', 'partial'].includes(value.state) && (value.receipt === undefined || value.errorCode !== undefined)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.state === 'partial' && value.receipt?.status !== 'partial') fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.receipt?.status === 'not_executed' && value.research !== undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['received', 'partial'].includes(value.receipt?.status) && value.research === undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.research && (value.research.researchRequestId !== value.researchRequestId || value.research.receiptId !== value.receipt?.receiptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  for (const key of ['rootAttemptId', 'retryOfAttemptId']) if (value[key] !== undefined && !ATTEMPT_ID.test(value[key])) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.attemptNumber !== undefined && (!Number.isSafeInteger(value.attemptNumber) || value.attemptNumber < 2)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.state === 'contributing' && value.delivery?.state !== 'pending') fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery?.state === 'pending' && !['prepared', 'running', 'contributing', 'failed_transient', 'failed_permanent', 'cancelled'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery?.state === 'delivered' && !['succeeded', 'partial'].includes(value.state)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.delivery && ['prepared', 'running'].includes(value.state) && (!value.retryOfAttemptId || !value.rootAttemptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (['received', 'partial'].includes(value.receipt?.status) && (value.delivery?.state !== 'delivered' || value.delivery.receiptId !== value.receipt.receiptId)) fail('INVALID_ATTEMPT', 'Intento invalido.')
  if (value.receipt?.status === 'not_executed' && value.delivery !== undefined) fail('INVALID_ATTEMPT', 'Intento invalido.')
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
  if (proposed.budgetReservation?.reserved !== prior.budgetReservation.reserved || !Number.isSafeInteger(proposed.budgetReservation?.consumed) || proposed.budgetReservation.consumed < prior.budgetReservation.consumed) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (!prior.delivery && proposed.delivery && (prior.state !== 'running' || proposed.state !== 'contributing' || proposed.delivery.state !== 'pending')) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  if (prior.delivery) {
    if (!proposed.delivery) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    const immutable = (value) => Object.fromEntries(Object.entries(value).filter(([key]) => !['state', 'deliveredAt', 'receiptId'].includes(key)))
    if (canonical(immutable(prior.delivery)) !== canonical(immutable(proposed.delivery))) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (prior.delivery.state === 'delivered' && canonical(prior.delivery) !== canonical(proposed.delivery)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (prior.delivery.state === 'pending' && !['pending', 'delivered'].includes(proposed.delivery.state)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
    if (prior.delivery.state === 'pending' && proposed.delivery.state === 'delivered' && !['succeeded', 'partial'].includes(proposed.state)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
  }
}

function createConnectorPersistence({ root } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Root invalido.')
  const authorityRoot = path.resolve(root)
  const attemptFile = (id) => path.join(authorityRoot, `${id}.json`)
  const indexFile = path.join(authorityRoot, 'attempt-index.json')
  const healthFile = (connectorId) => path.join(authorityRoot, `health-${connectorId}.json`)
  const isRecord = (name) => /^connector-attempt-[a-f0-9]{32}\.json$/u.test(name)
  const lockKey = (value) => `${authorityRoot}:${value}`

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

  async function createReservedAttempt(record, { maxReservationsPerProject, reservationCost }) {
    if (!Number.isSafeInteger(maxReservationsPerProject) || maxReservationsPerProject < 0 || !Number.isSafeInteger(reservationCost) || reservationCost < 0) fail('INVALID_RESERVATION_POLICY', 'Reserva invalida.')
    return locked(lockKey(`project:${record.projectId}`), async () => {
      const existing = await read(record.connectorAttemptId)
      if (existing) {
        if (canonical(attemptIdentity(existing)) !== canonical(attemptIdentity(record))) fail('INCOMPATIBLE_REPLAY', 'Replay incompatible.')
        return { record: existing, idempotent: true }
      }
      const records = await listAllAttempts(record.projectId)
      const reserved = records.reduce((total, item) => total + item.budgetReservation.reserved, 0)
      const mayReserve = record.state === 'prepared' && reserved + reservationCost <= maxReservationsPerProject
      const clean = validateAttemptRecord({
        ...record,
        revision: 0,
        state: record.state === 'prepared' && !mayReserve ? 'policy_blocked' : record.state,
        ...(record.state === 'prepared' && !mayReserve ? { errorCode: 'BUDGET_EXHAUSTED' } : {}),
        budgetReservation: { reserved: mayReserve ? reservationCost : 0, consumed: 0 },
      })
      return { record: await atomic(attemptFile(clean.connectorAttemptId), clean), idempotent: false }
    })
  }

  async function transitionAttempt(id, spec) {
    if (typeof id !== 'string' || !ATTEMPT_ID.test(id)) fail('INVALID_ATTEMPT_ID', 'Intento invalido.')
    return locked(lockKey(id), async () => {
      const prior = await read(id)
      if (!prior) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
      let proposed
      if (typeof spec === 'function') {
        proposed = spec(prior)
        if (canonical(prior) === canonical(proposed)) return { record: prior, idempotent: true }
        if (!proposed || !TRANSITIONS[prior.state]?.includes(proposed.state)) fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
      } else {
        if (!spec || typeof spec !== 'object' || !Array.isArray(spec.expectedStates) || !Number.isSafeInteger(spec.expectedRevision) || typeof spec.nextState !== 'string' || !spec.patch || typeof spec.patch !== 'object') fail('INVALID_TRANSITION_REQUEST', 'Transicion invalida.')
        if (!spec.expectedStates.includes(prior.state) || prior.revision !== spec.expectedRevision) fail('STALE_TRANSITION', 'Transicion obsoleta.')
        proposed = transition(prior, spec.nextState, spec.patch)
      }
      assertTransitionIntegrity(prior, proposed)
      const clean = validateAttemptRecord({ ...proposed, revision: prior.revision + 1 })
      return { record: await atomic(attemptFile(id), clean), idempotent: false }
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
      return validateHealth(JSON.parse(await fs.promises.readFile(healthFile(connectorId), 'utf8')))
    } catch (error) {
      if (error.code === 'ENOENT') return { schemaVersion: 'jefe-research-connector-health/v1', connectorId, state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null }
      if (error.code === 'CORRUPT_HEALTH') throw error
      fail('CORRUPT_HEALTH', 'Registro corrupto.')
    }
  }

  async function saveHealth(value) {
    const clean = validateHealth(value)
    return locked(lockKey(`health:${clean.connectorId}`), async () => ({ health: await atomic(healthFile(clean.connectorId), clean) }))
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

  return { authorityRoot, read, getAttempt: read, createReservedAttempt, transitionAttempt, listAttempts, listAllAttempts, listDetailed, rebuildIndex, readHealth, saveHealth, updateHealth }
}

module.exports = { ConnectorPersistenceError, createConnectorPersistence }
