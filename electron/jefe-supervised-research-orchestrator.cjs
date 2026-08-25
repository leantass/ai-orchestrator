const crypto = require('crypto')
const { physicalRootKey } = require('./jefe-physical-root.cjs')
const { request, receipt, safeResearchText } = require('./jefe-research-contract.cjs')
const { candidate } = require('./jefe-research-evidence-contract.cjs')
const { evaluate, publicView } = require('./jefe-research-evidence-gate.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { sessionWriteCompatibility } = require('./jefe-supervised-research-persistence.cjs')

const operationLocks = new Map()
let memoryStoreSequence = 0

const CORRELATION_ID = /^[a-z][a-z0-9-]{2,80}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const HANDOFF_ID = /^agent-handoff-[a-f0-9]{32}$/u
const RESEARCH_REQUEST_ID = /^research-[a-f0-9]{32}$/u
const RESEARCH_PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const EVIDENCE_CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const RECOVERY_FINGERPRINT = /^[a-f0-9]{64}$/u
const PHYSICAL_IDENTITY_FIELDS = Object.freeze(['projectId', 'runId', 'versionId'])
const PACKAGE_REFERENCE_FIELDS = Object.freeze(['agent', 'packageId', 'handoffId', 'consumerStatus'])
const STORED_REQUEST_FIELDS = Object.freeze([
  'schemaVersion',
  'discoveryId',
  'intakeId',
  'projectId',
  'packageId',
  'handoffId',
  'role',
  'objective',
  'questions',
  'providerType',
  'purpose',
  'budget',
  'references',
  'needsCorroboration',
  'state',
  'provenance',
  'actor',
  'authority',
  'createdAt',
  'researchRequestId',
  'identity',
  'researchPlanId',
  'evidenceCaseId',
])
const RESEARCH_ROLES = Object.freeze(['radar', 'scout', 'hermes'])
const CONSUMER_STATUSES = new Set(['not_connected', 'registered_internal'])
const PERSISTABLE_ERROR_CODES = new Set([
  'RESEARCH_PERSISTENCE_FAILED',
  'MEMORY_APPEND_FAILED',
  'MEMORY_NOT_CONFIGURED',
  'INJECTED_MEMORY_FAILURE',
  'INJECTED_FAILURE',
  'CORRUPT_SESSION',
  'INCOMPATIBLE_REPLAY',
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
])

class SupervisedResearchError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchError(code, message)
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
  return value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))
}

function hasExactFields(value, fields) {
  return plainObject(value) && Object.keys(value).length === fields.length && fields.every((field) => Object.hasOwn(value, field))
}

function physicalIdentity(value, code = 'INVALID_RESEARCH_IDENTITY') {
  if (!hasExactFields(value, PHYSICAL_IDENTITY_FIELDS) || PHYSICAL_IDENTITY_FIELDS.some((field) => typeof value[field] !== 'string' || !CORRELATION_ID.test(value[field]))) fail(code, 'Identidad fisica de investigacion invalida.')
  return Object.fromEntries(PHYSICAL_IDENTITY_FIELDS.map((field) => [field, value[field]]))
}

function contextPackages(value) {
  if (!Array.isArray(value) || value.length !== RESEARCH_ROLES.length) fail('MISSING_CONTEXT_PACKAGE', 'Faltan paquetes de contexto.')
  const byAgent = new Map()
  for (const item of value) {
    if (!hasExactFields(item, PACKAGE_REFERENCE_FIELDS) || !RESEARCH_ROLES.includes(item.agent) || !PACKAGE_ID.test(item.packageId) || !HANDOFF_ID.test(item.handoffId) || !CONSUMER_STATUSES.has(item.consumerStatus) || byAgent.has(item.agent)) fail('INVALID_CONTEXT_PACKAGE', 'Paquete de contexto invalido.')
    byAgent.set(item.agent, clone(item))
  }
  if (RESEARCH_ROLES.some((role) => !byAgent.has(role)) || new Set(value.map((item) => item.packageId)).size !== value.length || new Set(value.map((item) => item.handoffId)).size !== value.length) fail('INVALID_CONTEXT_PACKAGE', 'Paquete de contexto invalido.')
  return byAgent
}

function persistableErrorCode(error, fallback) {
  return PERSISTABLE_ERROR_CODES.has(error?.code) ? error.code : fallback
}

function exclusive(key, work) {
  const previous = operationLocks.get(key) || Promise.resolve()
  let release
  const tail = new Promise((resolve) => { release = resolve })
  operationLocks.set(key, tail)
  return previous.then(work).finally(() => {
    release()
    if (operationLocks.get(key) === tail) operationLocks.delete(key)
  })
}

function exclusiveMany(keys, work, index = 0) {
  if (index >= keys.length) return work()
  return exclusive(keys[index], () => exclusiveMany(keys, work, index + 1))
}

function correlationSeed(value) {
  if (!value || typeof value !== 'object') fail('INVALID_RESEARCH_PLAN', 'Plan de investigacion invalido.')
  const identity = physicalIdentity(value.identity, 'INVALID_RESEARCH_PLAN')
  const seed = {
    identity,
    projectId: value.projectId,
    discoveryId: value.discoveryId,
    intakeId: value.intakeId,
    objective: value.objective,
    questions: value.questions,
  }
  if (identity.projectId !== seed.projectId || [seed.projectId, seed.discoveryId, seed.intakeId, seed.objective].some((item) => typeof item !== 'string' || !item) || !Array.isArray(seed.questions) || seed.questions.length < 1) fail('INVALID_RESEARCH_PLAN', 'Plan de investigacion invalido.')
  return seed
}

function deriveResearchPlanId(value) {
  return `research-plan-${digest(correlationSeed(value)).slice(0, 32)}`
}

function deriveEvidenceCaseId(value) {
  const researchPlanId = typeof value?.researchPlanId === 'string' ? value.researchPlanId : deriveResearchPlanId(value)
  if (!RESEARCH_PLAN_ID.test(researchPlanId)) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  return `evidence-case-${digest({ researchPlanId, slot: 'primary_evidence' }).slice(0, 32)}`
}

function contributionInput(value) {
  const allowed = ['researchRequestId', 'rawReceipt', 'claim']
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_CONTRIBUTION', 'Contribucion invalida.')
  if (typeof value.researchRequestId !== 'string' || !value.rawReceipt || typeof value.rawReceipt !== 'object' || Array.isArray(value.rawReceipt) || typeof value.claim !== 'string' || !value.claim.trim() || value.claim.length > 500) fail('INVALID_CONTRIBUTION', 'Contribucion invalida.')
  return { researchRequestId: value.researchRequestId, rawReceipt: value.rawReceipt, claim: value.claim.trim() }
}

const AGGREGATE_LIMITS = Object.freeze({ queries: 'maxQueries', sources: 'maxSources', bytes: 'maxTotalBytes', durationMs: 'maxDurationMs', redirects: 'maxRedirects', attempts: 'maxAttempts' })

function assertAggregateBudget(caseRecord, requestRecord, nextReceipt) {
  const receipts = caseRecord.receipts.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
  for (const [field, budgetField] of Object.entries(AGGREGATE_LIMITS)) {
    const total = [...receipts, nextReceipt].reduce((sum, item) => sum + (item.consumed?.[field] || 0), 0)
    if (total > requestRecord.budget[budgetField]) fail('BUDGET_EXHAUSTED', 'Presupuesto de investigacion agotado.')
  }
  const totalBytes = [...receipts, nextReceipt].reduce((sum, item) => sum + (item.bytes || 0), 0)
  if (totalBytes > requestRecord.budget.maxTotalBytes || receipts.length + 1 > requestRecord.budget.maxAttempts) fail('BUDGET_EXHAUSTED', 'Presupuesto de investigacion agotado.')
}

function createMemoryCasePersistence() {
  const values = new Map()
  const authorityRoot = `memory-evidence-cases-${++memoryStoreSequence}`
  const read = async (id) => values.has(id) ? clone(values.get(id)) : null
  const write = async (record) => {
    const prior = values.get(record.evidenceCaseId)
    if (prior && canonical(prior) === canonical(record)) return { record: clone(prior), idempotent: true }
    if (prior) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Caso de evidencia incompatible.')
    values.set(record.evidenceCaseId, clone(record))
    return { record: clone(record), idempotent: false }
  }
  const update = async (id, updater) => {
    const prior = values.get(id)
    if (!prior) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    const proposed = { ...updater(clone(prior)), revision: prior.revision }
    if (canonical(prior) === canonical(proposed)) return { record: clone(prior), idempotent: true }
    proposed.revision += 1
    values.set(id, clone(proposed))
    return { record: clone(proposed), idempotent: false }
  }
  const list = async (projectId) => [...values.values()].filter((item) => !projectId || item.projectId === projectId).sort((a, b) => a.evidenceCaseId.localeCompare(b.evidenceCaseId)).map(clone)
  const findByRequestId = async (id) => clone([...values.values()].find((item) => item.requests.some((requestRecord) => requestRecord.researchRequestId === id)) || null)
  const rebuildIndex = async () => ({ index: { evidenceCaseIds: [...values.keys()].sort() }, idempotent: true })
  const withExactSnapshots = async (projectId, snapshots, work) => {
    const captured = []
    for (const snapshot of snapshots) {
      const record = values.get(snapshot.evidenceCaseId) || null
      if (snapshot.revision === null) {
        if (record) fail('STALE_RECONCILE_CANDIDATE', 'El caso ausente ya no coincide con el snapshot.')
      } else if (!record || record.projectId !== projectId || canonical(recoveryCandidateForMemory(record)) !== canonical(snapshot)) fail('STALE_RECONCILE_CANDIDATE', 'El caso ya no coincide con el snapshot.')
      captured.push({ evidenceCaseId: snapshot.evidenceCaseId, record: record ? clone(record) : null })
    }
    return work(captured)
  }
  const recoveryCandidateForMemory = (record) => ({ evidenceCaseId: record.evidenceCaseId, revision: record.revision, state: record.state, fingerprint: digest(record) })
  return { authorityRoot, read, write, create: write, update, list, listAll: list, findByRequestId, withExactSnapshots, rebuildIndex }
}

function normalizedClaim(value) {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('es')
}

function caseIdentity(caseRecord) {
  if (!plainObject(caseRecord) || !RESEARCH_PLAN_ID.test(caseRecord.researchPlanId) || !EVIDENCE_CASE_ID.test(caseRecord.evidenceCaseId)) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
  const identity = physicalIdentity(caseRecord.identity, 'INVALID_EVIDENCE_CASE_IDENTITY')
  const expectedPlanId = deriveResearchPlanId({
    identity,
    projectId: caseRecord.projectId,
    discoveryId: caseRecord.discoveryId,
    intakeId: caseRecord.intakeId,
    objective: caseRecord.objective,
    questions: caseRecord.questions,
  })
  if (identity.projectId !== caseRecord.projectId || caseRecord.researchPlanId !== expectedPlanId || caseRecord.evidenceCaseId !== deriveEvidenceCaseId({ researchPlanId: expectedPlanId }) || !Array.isArray(caseRecord.requests) || caseRecord.requests.length !== RESEARCH_ROLES.length) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
  const roles = new Set()
  const packageIds = new Set()
  const handoffIds = new Set()
  for (const requestRecord of caseRecord.requests) {
    if (!hasExactFields(requestRecord, STORED_REQUEST_FIELDS) || requestRecord.schemaVersion !== 'jefe-research-request/v1' || !RESEARCH_REQUEST_ID.test(requestRecord.researchRequestId)) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
    const requestIdentity = physicalIdentity(requestRecord?.identity, 'INVALID_EVIDENCE_CASE_IDENTITY')
    if (!RESEARCH_ROLES.includes(requestRecord.role) || roles.has(requestRecord.role) || !PACKAGE_ID.test(requestRecord.packageId) || packageIds.has(requestRecord.packageId) || !HANDOFF_ID.test(requestRecord.handoffId) || handoffIds.has(requestRecord.handoffId) || canonical(requestIdentity) !== canonical(identity)) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
    if (requestRecord.researchPlanId !== caseRecord.researchPlanId || requestRecord.evidenceCaseId !== caseRecord.evidenceCaseId || requestRecord.projectId !== caseRecord.projectId || requestRecord.discoveryId !== caseRecord.discoveryId || requestRecord.intakeId !== caseRecord.intakeId) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
    const requestSeed = Object.fromEntries(STORED_REQUEST_FIELDS.filter((field) => !['researchRequestId', 'researchPlanId', 'evidenceCaseId'].includes(field)).map((field) => [field, requestRecord[field]]))
    if (requestRecord.researchRequestId !== `research-${digest(requestSeed).slice(0, 32)}`) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
    roles.add(requestRecord.role)
    packageIds.add(requestRecord.packageId)
    handoffIds.add(requestRecord.handoffId)
  }
  if (RESEARCH_ROLES.some((role) => !roles.has(role))) fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Correlacion del caso de evidencia invalida.')
  return identity
}

function createSupervisedResearch({ memory = null, persistence = null, evidenceCasePersistence = null, clock = () => new Date().toISOString(), trusted = {} } = {}) {
  const caseStore = evidenceCasePersistence || createMemoryCasePersistence()
  if (!caseStore || typeof caseStore.read !== 'function' || typeof caseStore.write !== 'function' || typeof caseStore.update !== 'function' || typeof caseStore.findByRequestId !== 'function' || typeof caseStore.list !== 'function' || typeof caseStore.withExactSnapshots !== 'function' || typeof caseStore.rebuildIndex !== 'function') fail('INVALID_EVIDENCE_CASE_PERSISTENCE', 'Persistencia de casos invalida.')
  const records = new Map()
  const requestCases = new Map()
  const requests = {}
  const rawAuthorityRoot = caseStore.authorityRoot || 'evidence-case-store'
  const operationAuthorityRoot = physicalRootKey(rawAuthorityRoot)
  const operationKey = (evidenceCaseId) => `${operationAuthorityRoot}:${evidenceCaseId}`
  const sessionId = (researchRequestId) => `research-session-${digest(researchRequestId).slice(0, 32)}`
  const caseTimestamp = (prior, advance = false) => {
    const observed = clock()
    const observedTime = Date.parse(observed)
    const priorTime = Date.parse(prior)
    if (Number.isNaN(observedTime) || Number.isNaN(priorTime)) return observed
    return new Date(Math.max(observedTime, priorTime + Number(advance))).toISOString()
  }

  function registerCase(caseRecord) {
    caseIdentity(caseRecord)
    for (const storedRequest of caseRecord.requests) {
      const requestRecord = deepFreeze(clone(storedRequest))
      requests[requestRecord.researchRequestId] = requestRecord
      requestCases.set(requestRecord.researchRequestId, caseRecord.evidenceCaseId)
      const requestReceipts = caseRecord.receipts.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
      records.set(requestRecord.researchRequestId, {
        request: requestRecord,
        receipts: requestReceipts,
        evidence: caseRecord.evidenceDecisions,
        status: sessionState(caseRecord, requestRecord),
        pending: caseRecord.pendingOperations.length > 0,
        nextResponsible: caseRecord.nextResponsible || 'jefe',
        evidenceCaseId: caseRecord.evidenceCaseId,
        researchPlanId: caseRecord.researchPlanId,
      })
    }
  }

  function recoveryCandidate(caseRecord) {
    caseIdentity(caseRecord)
    if (!Number.isSafeInteger(caseRecord.revision) || caseRecord.revision < 0 || typeof caseRecord.state !== 'string') fail('INVALID_EVIDENCE_CASE_IDENTITY', 'Caso de evidencia invalido para recovery.')
    return {
      evidenceCaseId: caseRecord.evidenceCaseId,
      revision: caseRecord.revision,
      state: caseRecord.state,
      fingerprint: digest(caseRecord),
    }
  }

  function recoveryCandidates(value, limit) {
    if (!Array.isArray(value) || value.length > limit || value.length > 50) fail('INVALID_RECONCILE_CANDIDATES', 'Candidatos de reconciliacion invalidos.')
    const identifiers = new Set()
    return value.map((candidateRecord) => {
      if (!hasExactFields(candidateRecord, ['evidenceCaseId', 'revision', 'state', 'fingerprint']) || !EVIDENCE_CASE_ID.test(candidateRecord.evidenceCaseId) || !Number.isSafeInteger(candidateRecord.revision) || candidateRecord.revision < 0 || typeof candidateRecord.state !== 'string' || !RECOVERY_FINGERPRINT.test(candidateRecord.fingerprint) || identifiers.has(candidateRecord.evidenceCaseId)) fail('INVALID_RECONCILE_CANDIDATES', 'Candidatos de reconciliacion invalidos.')
      identifiers.add(candidateRecord.evidenceCaseId)
      return clone(candidateRecord)
    }).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId))
  }

  function exactEvidenceCaseSnapshots(value) {
    if (!Array.isArray(value) || value.length > 50) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshots de casos de evidencia invalidos.')
    const identifiers = new Set()
    return value.map((snapshot) => {
      if (!hasExactFields(snapshot, ['evidenceCaseId', 'revision', 'state', 'fingerprint']) || !EVIDENCE_CASE_ID.test(snapshot.evidenceCaseId) || identifiers.has(snapshot.evidenceCaseId)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshots de casos de evidencia invalidos.')
      const missing = snapshot.revision === null && snapshot.state === null && snapshot.fingerprint === null
      const present = Number.isSafeInteger(snapshot.revision) && snapshot.revision >= 0 && typeof snapshot.state === 'string' && RECOVERY_FINGERPRINT.test(snapshot.fingerprint)
      if (!missing && !present) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshots de casos de evidencia invalidos.')
      identifiers.add(snapshot.evidenceCaseId)
      return clone(snapshot)
    }).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId))
  }

  async function withExactEvidenceCaseSnapshots(projectId, snapshots, work) {
    if (typeof projectId !== 'string' || !CORRELATION_ID.test(projectId) || typeof work !== 'function') fail('INVALID_RECONCILE_CANDIDATES', 'Coordinacion exacta de casos invalida.')
    const exactSnapshots = exactEvidenceCaseSnapshots(snapshots)
    if (exactSnapshots.length === 0) return work(deepFreeze([]))
    const keys = exactSnapshots.map((item) => operationKey(item.evidenceCaseId))
    return exclusiveMany(keys, async () => {
      try {
        return await caseStore.withExactSnapshots(projectId, exactSnapshots, (captured) => work(deepFreeze(captured.map((item) => deepFreeze({ evidenceCaseId: item.evidenceCaseId, view: item.record ? evidenceCaseView(item.record) : null })))))
      } catch (error) {
        if (error?.code === 'STALE_EVIDENCE_CASE_SNAPSHOT') fail('STALE_RECONCILE_CANDIDATE', 'El caso de evidencia ya no coincide con el snapshot.')
        throw error
      }
    })
  }

  function requireRecoveryCandidate(current, expected, projectId) {
    if (!current || current.projectId !== projectId || canonical(recoveryCandidate(current)) !== canonical(expected)) fail('STALE_RECONCILE_CANDIDATE', 'El candidato de investigacion ya no coincide con el snapshot.')
    return current
  }

  function sessionState(caseRecord, requestRecord) {
    if (caseRecord.state === 'preparing' || caseRecord.state === 'ready') return requestRecord.state
    if (caseRecord.state === 'accepted_for_context' && caseRecord.memory?.status === 'appended') return 'completed_with_evidence'
    return caseRecord.state
  }

  function sessionRecord(caseRecord, requestRecord) {
    const requestReceipts = caseRecord.receipts.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
    return {
      schemaVersion: 'jefe-supervised-research-session/v1',
      researchSessionId: sessionId(requestRecord.researchRequestId),
      researchRequestId: requestRecord.researchRequestId,
      researchPlanId: caseRecord.researchPlanId,
      evidenceCaseId: caseRecord.evidenceCaseId,
      identity: caseIdentity(caseRecord),
      discoveryId: requestRecord.discoveryId,
      intakeId: requestRecord.intakeId,
      projectId: requestRecord.projectId,
      packageId: requestRecord.packageId,
      handoffId: requestRecord.handoffId,
      providerType: requestRecord.providerType,
      policyFingerprint: digest(requestRecord.budget),
      budget: requestRecord.budget,
      budgetConsumed: requestReceipts.reduce((sum, item) => sum + (item.bytes || 0), 0),
      status: sessionState(caseRecord, requestRecord),
      request: requestRecord,
      receipts: requestReceipts,
      evidenceDecisions: caseRecord.evidenceDecisions,
      pendingOperations: caseRecord.pendingOperations,
      ...(caseRecord.lastErrorCode ? { lastErrorCode: caseRecord.lastErrorCode } : {}),
      nextResponsible: caseRecord.nextResponsible || 'jefe',
      createdAt: requestRecord.createdAt,
      updatedAt: caseRecord.updatedAt,
    }
  }

  async function persistSession(caseRecord, requestRecord) {
    if (!persistence) return { idempotent: true }
    return persistence.write(sessionRecord(caseRecord, requestRecord))
  }

  async function persistAllSessions(caseRecord) {
    for (const requestRecord of caseRecord.requests) await persistSession(caseRecord, requestRecord)
  }

  async function sessionProjectionState(caseRecord) {
    if (!persistence) return 'synchronized'
    if (typeof persistence.read !== 'function') return 'writable'
    let writable = false
    for (const requestRecord of caseRecord.requests) {
      const stored = await persistence.read(sessionId(requestRecord.researchRequestId))
      const projected = sessionRecord(caseRecord, requestRecord)
      if (!stored) {
        writable = true
        continue
      }
      if (canonical(stored) === canonical(projected)) continue
      if (sessionWriteCompatibility(stored, projected) !== 'compatible') return 'conflict'
      writable = true
    }
    return writable ? 'writable' : 'synchronized'
  }

  function withoutPendingOperation(caseRecord, pendingOperation) {
    const pendingOperations = caseRecord.pendingOperations.filter((item) => item !== pendingOperation)
    const projected = { ...caseRecord, pendingOperations }
    if (pendingOperations.length === 0) delete projected.lastErrorCode
    return projected
  }

  async function requireWritableSessionProjection(caseRecord) {
    const projected = withoutPendingOperation(caseRecord, 'sync_request_sessions')
    const projectionState = await sessionProjectionState(projected)
    if (projectionState === 'conflict') fail('RESEARCH_SESSION_PROJECTION_CONFLICT', 'La proyeccion durable de la sesion es incompatible.')
    return { projected, projectionState }
  }

  async function markCaseFailure(evidenceCaseId, error, pendingOperation, advanceFailure = false) {
    try {
      return (await caseStore.update(evidenceCaseId, (current) => {
        const pendingOperations = [...new Set([...current.pendingOperations, pendingOperation])].sort()
        return { ...current, pendingOperations, lastErrorCode: persistableErrorCode(error, 'RESEARCH_PERSISTENCE_FAILED'), updatedAt: caseTimestamp(current.updatedAt, advanceFailure) }
      })).record
    } catch {
      return caseStore.read(evidenceCaseId)
    }
  }

  async function completePreparation(evidenceCaseId, advanceFailure = false) {
    let current = await caseStore.read(evidenceCaseId)
    if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    caseIdentity(current)
    if (current.state !== 'preparing' && !current.pendingOperations.includes('complete_plan')) {
      registerCase(current)
      return current
    }
    await requireWritableSessionProjection(current)
    try {
      if (current.state === 'preparing') {
        for (const requestRecord of current.requests) {
          if (!current.preparedRequestIds.includes(requestRecord.researchRequestId)) {
            await persistSession(current, requestRecord)
            current = (await caseStore.update(evidenceCaseId, (draft) => ({
              ...draft,
              preparedRequestIds: [...new Set([...draft.preparedRequestIds, requestRecord.researchRequestId])].sort(),
              updatedAt: caseTimestamp(draft.updatedAt),
            }))).record
          }
        }
        current = (await caseStore.update(evidenceCaseId, (draft) => ({
          ...draft,
          state: 'ready',
          pendingOperations: [...new Set([...draft.pendingOperations, 'complete_plan'])].sort(),
          nextResponsible: 'jefe',
          updatedAt: caseTimestamp(draft.updatedAt),
        }))).record
      }
      const synchronized = withoutPendingOperation(current, 'complete_plan')
      await persistAllSessions(synchronized)
      current = (await caseStore.update(evidenceCaseId, (draft) => withoutPendingOperation(draft, 'complete_plan'))).record
      registerCase(current)
      return current
    } catch (error) {
      const failed = await markCaseFailure(evidenceCaseId, error, 'complete_plan', advanceFailure)
      if (failed) registerCase(failed)
      throw error
    }
  }

  async function synchronizeCaseSessions(caseRecord, advanceFailure = false) {
    const { projected: initialSynchronized, projectionState } = await requireWritableSessionProjection(caseRecord)
    try {
      let journaled = caseRecord
      let synchronized = initialSynchronized
      if (projectionState === 'synchronized') {
        if (!journaled.pendingOperations.includes('sync_request_sessions')) return journaled
        return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => withoutPendingOperation(draft, 'sync_request_sessions'))).record
      }
      if (!journaled.pendingOperations.includes('sync_request_sessions')) {
        journaled = (await caseStore.update(caseRecord.evidenceCaseId, (draft) => ({
          ...draft,
          pendingOperations: [...new Set([...draft.pendingOperations, 'sync_request_sessions'])].sort(),
          updatedAt: caseTimestamp(draft.updatedAt),
        }))).record
        synchronized = withoutPendingOperation(journaled, 'sync_request_sessions')
      }
      await persistAllSessions(synchronized)
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => withoutPendingOperation(draft, 'sync_request_sessions'))).record
    } catch (error) {
      const failed = await markCaseFailure(caseRecord.evidenceCaseId, error, 'sync_request_sessions', advanceFailure)
      if (failed) registerCase(failed)
      throw error
    }
  }

  function planResult(caseRecord) {
    const identity = caseIdentity(caseRecord)
    const byRole = Object.fromEntries(caseRecord.requests.map((item) => [item.role, requests[item.researchRequestId] || item]))
    const scout = byRole.scout
    return {
      state: scout.state === 'policy_blocked' ? 'policy_blocked' : scout.state === 'not_connected' ? 'not_connected' : 'awaiting_provider',
      caseState: caseRecord.state,
      researchPlanId: caseRecord.researchPlanId,
      evidenceCaseId: caseRecord.evidenceCaseId,
      identity: deepFreeze(clone(identity)),
      radar: byRole.radar,
      scout,
      hermes: byRole.hermes,
      nextResponsible: caseRecord.nextResponsible || 'jefe',
    }
  }

  async function plan({ intake, packages, providerType = 'metasearch', budget, references = [] }) {
    if (!intake || intake.state !== 'ready_for_discovery' || typeof intake.intakeId !== 'string' || !CORRELATION_ID.test(intake.intakeId) || typeof intake.objective !== 'string' || !Array.isArray(intake.questions)) fail('INVALID_INTAKE', 'Intake no apto para investigacion.')
    const identity = physicalIdentity(intake.identity, 'INVALID_INTAKE')
    const byAgent = contextPackages(packages)
    const questions = (intake.questions.length ? intake.questions : [intake.expectedOutcome]).map((item) => safeResearchText(item))
    const topic = {
      identity,
      discoveryId: `discovery-${intake.intakeId.slice(7)}`,
      intakeId: intake.intakeId,
      projectId: identity.projectId,
      objective: safeResearchText(intake.objective),
      questions,
    }
    const researchPlanId = deriveResearchPlanId(topic)
    const evidenceCaseId = deriveEvidenceCaseId({ researchPlanId })
    return exclusive(operationKey(evidenceCaseId), async () => {
      let current = await caseStore.read(evidenceCaseId)
      const createdAt = current?.createdAt || clock()
      const common = {
        discoveryId: topic.discoveryId,
        intakeId: topic.intakeId,
        projectId: topic.projectId,
        objective: topic.objective,
        questions: topic.questions,
        providerType,
        purpose: 'research',
        budget,
        references,
        needsCorroboration: true,
      }
      const plannedRequests = [
        request({ ...common, packageId: byAgent.get('radar').packageId, handoffId: byAgent.get('radar').handoffId, role: 'radar', purpose: 'discovery', providerType: 'manual_reference' }, createdAt, trusted),
        request({ ...common, packageId: byAgent.get('scout').packageId, handoffId: byAgent.get('scout').handoffId, role: 'scout' }, createdAt, trusted),
        request({ ...common, packageId: byAgent.get('hermes').packageId, handoffId: byAgent.get('hermes').handoffId, role: 'hermes' }, createdAt, trusted),
      ].map((requestRecord) => {
        const correlated = { ...requestRecord, identity: clone(identity) }
        delete correlated.researchRequestId
        correlated.researchRequestId = `research-${digest(correlated).slice(0, 32)}`
        return { ...correlated, researchPlanId, evidenceCaseId }
      })
      if (!current) {
        current = (await caseStore.write({
          schemaVersion: 'jefe-supervised-research-evidence-case/v1',
          evidenceCaseId,
          researchPlanId,
          identity: clone(identity),
          projectId: topic.projectId,
          discoveryId: topic.discoveryId,
          intakeId: topic.intakeId,
          objective: topic.objective,
          questions: topic.questions,
          state: 'preparing',
          revision: 0,
          requests: plannedRequests,
          preparedRequestIds: [],
          receipts: [],
          contributions: [],
          evidenceDecisions: [],
          pendingOperations: ['complete_plan'],
          memory: { status: 'not_applicable', entryId: null },
          nextResponsible: 'jefe',
          createdAt,
          updatedAt: createdAt,
        })).record
      } else {
        caseIdentity(current)
        const existingIds = current.requests.map((item) => item.researchRequestId).sort()
        const plannedIds = plannedRequests.map((item) => item.researchRequestId).sort()
        if (canonical(existingIds) !== canonical(plannedIds) || current.researchPlanId !== researchPlanId || canonical(current.identity) !== canonical(identity)) fail('INCOMPATIBLE_RESEARCH_PLAN', 'Plan de investigacion incompatible.')
      }
      registerCase(current)
      if (current.state === 'preparing') current = await completePreparation(evidenceCaseId)
      else if (current.pendingOperations.includes('complete_plan')) current = await completePreparation(evidenceCaseId)
      else current = await synchronizeCaseSessions(current)
      registerCase(current)
      return planResult(current)
    })
  }

  function evidenceFromContribution(caseRecord, contribution) {
    const requestRecord = caseRecord.requests.find((item) => item.researchRequestId === contribution.researchRequestId)
    const storedReceipt = caseRecord.receipts.find((item) => item.receiptId === contribution.receiptId)
    if (!requestRecord || !storedReceipt || !['received', 'partial'].includes(storedReceipt.status)) return null
    return candidate({ request: requestRecord, receipt: storedReceipt, claim: contribution.claim, now: storedReceipt.receivedAt })
  }

  function aggregate(draft) {
    const evidence = draft.contributions.map((item) => evidenceFromContribution(draft, item)).filter(Boolean).sort((a, b) => a.receiptId.localeCompare(b.receiptId))
    if (!evidence.length) return { ...draft, state: 'evidence_pending', evidenceDecisions: [], pendingOperations: [], nextResponsible: 'scout' }
    const groups = new Map()
    for (const item of evidence) {
      const key = normalizedClaim(item.claim)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(item)
    }
    if (groups.size > 1) {
      const branches = [...groups.values()].map((items) => ({ claim: items[0].claim, evidenceIds: items.map((item) => item.evidenceId).sort() })).sort((a, b) => a.claim.localeCompare(b.claim))
      const base = evidence[0]
      const decision = {
        ...base,
        state: 'requires_human',
        nextResponsible: 'lean',
        corroborations: [],
        contradictions: evidence.slice(1).map((item) => item.evidenceId).sort(),
        branches,
      }
      return { ...draft, state: 'requires_human', evidenceDecisions: [decision], pendingOperations: [], nextResponsible: 'lean', contradictionStatus: 'preserved' }
    }
    const base = evidence[0]
    const corroborations = evidence.slice(1).map((item) => ({ ...item, claim: base.claim, polarity: 'supports' }))
    const decision = evaluate({ request: draft.requests.find((item) => item.researchRequestId === base.researchRequestId), receipt: draft.receipts.find((item) => item.receiptId === base.receiptId), claim: base.claim, corroborations, now: base.timestamp })
    const pendingOperations = decision.state === 'accepted_for_context' && draft.memory?.status !== 'appended' ? ['memory_append'] : []
    const next = { ...draft, state: decision.state, evidenceDecisions: [decision], pendingOperations, nextResponsible: decision.nextResponsible }
    delete next.contradictionStatus
    return next
  }

  async function appendAcceptedMemory(caseRecord, advanceFailure = false) {
    const identity = caseIdentity(caseRecord)
    if (caseRecord.state !== 'accepted_for_context' || !caseRecord.pendingOperations.includes('memory_append')) return caseRecord
    await requireWritableSessionProjection(caseRecord)
    const decision = caseRecord.evidenceDecisions[0]
    const entryId = `research-evidence-${digest(caseRecord.evidenceCaseId).slice(0, 24)}`
    if (!memory || typeof memory.append !== 'function') {
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => {
        const pendingOperations = [...new Set([...draft.pendingOperations, 'memory_append'])].sort()
        if (!advanceFailure && draft.memory?.status === 'pending' && draft.memory.entryId === entryId && draft.lastErrorCode === 'MEMORY_NOT_CONFIGURED' && canonical(draft.pendingOperations) === canonical(pendingOperations)) return draft
        return { ...draft, memory: { status: 'pending', entryId }, pendingOperations, lastErrorCode: 'MEMORY_NOT_CONFIGURED', updatedAt: caseTimestamp(draft.updatedAt, advanceFailure) }
      })).record
    }
    const receiptIds = caseRecord.contributions.map((item) => item.receiptId).sort()
    const references = [...new Set(caseRecord.receipts.map((item) => item.url).filter(Boolean))].sort().map((value) => ({ kind: 'url', value }))
    try {
      await memory.append({
        entryId,
        scope: 'version',
        identity: clone(identity),
        type: 'evidence',
        summary: decision.claim,
        actor: decision.actor,
        authority: 'technical_result',
        provenance: 'supervised_research_evidence_case_gate',
        timestamp: decision.timestamp,
        references,
        relations: [],
        metadata: {
          researchPlanId: caseRecord.researchPlanId,
          evidenceCaseId: caseRecord.evidenceCaseId,
          evidenceId: decision.evidenceId,
          receiptIds,
          classification: decision.classification,
          evidenceState: decision.state,
          nextResponsible: decision.nextResponsible,
        },
      })
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => {
        const pendingOperations = [...new Set([...draft.pendingOperations.filter((item) => item !== 'memory_append'), 'sync_request_sessions'])].sort()
        const next = { ...draft, memory: { status: 'appended', entryId }, pendingOperations, updatedAt: caseTimestamp(draft.updatedAt) }
        delete next.lastErrorCode
        return next
      })).record
    } catch (error) {
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => ({ ...draft, memory: { status: 'pending', entryId }, pendingOperations: [...new Set([...draft.pendingOperations, 'memory_append'])].sort(), lastErrorCode: persistableErrorCode(error, 'MEMORY_APPEND_FAILED'), updatedAt: caseTimestamp(draft.updatedAt, advanceFailure) }))).record
    }
  }

  async function resolveCase(researchRequestId) {
    const known = requestCases.get(researchRequestId)
    const found = known ? await caseStore.read(known) : await caseStore.findByRequestId(researchRequestId)
    if (!found) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
    registerCase(found)
    return found
  }

  async function receiveContribution(rawInput) {
    const input = contributionInput(rawInput)
    const located = await resolveCase(input.researchRequestId)
    return exclusive(operationKey(located.evidenceCaseId), async () => {
      let current = await caseStore.read(located.evidenceCaseId)
      if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
      caseIdentity(current)
      if (current.state === 'preparing') fail('EVIDENCE_CASE_NOT_READY', 'Caso de evidencia no preparado.')
      await requireWritableSessionProjection(current)
      const requestRecord = current.requests.find((item) => item.researchRequestId === input.researchRequestId)
      if (!requestRecord) fail('REQUEST_NOT_IN_EVIDENCE_CASE', 'Solicitud no asociada al caso.')
      let got = receipt(input.rawReceipt, requestRecord, clock())
      const existingReceipt = current.receipts.find((item) => item.receiptId === got.receiptId)
      let idempotent = false
      if (existingReceipt) {
        got = receipt(input.rawReceipt, requestRecord, existingReceipt.receivedAt)
        if (canonical(existingReceipt) !== canonical(got)) fail('INCOMPATIBLE_RECEIPT_REPLAY', 'Receipt incompatible.')
        const existingContribution = current.contributions.find((item) => item.receiptId === got.receiptId)
        if (!existingContribution || existingContribution.researchRequestId !== input.researchRequestId || existingContribution.claim !== input.claim) fail('INCOMPATIBLE_CONTRIBUTION_REPLAY', 'Contribucion incompatible.')
        idempotent = true
      } else {
        assertAggregateBudget(current, requestRecord, got)
        current = (await caseStore.update(current.evidenceCaseId, (draft) => {
          const next = {
            ...draft,
            receipts: [...draft.receipts, got].sort((a, b) => a.receiptId.localeCompare(b.receiptId)),
            contributions: [...draft.contributions, { researchRequestId: input.researchRequestId, receiptId: got.receiptId, claim: input.claim }].sort((a, b) => a.receiptId.localeCompare(b.receiptId)),
            updatedAt: caseTimestamp(draft.updatedAt),
          }
          const aggregated = aggregate(next)
          aggregated.pendingOperations = [...new Set([...aggregated.pendingOperations, 'sync_request_sessions'])].sort()
          delete aggregated.lastErrorCode
          return aggregated
        })).record
      }
      current = await appendAcceptedMemory(await caseStore.read(current.evidenceCaseId))
      current = await synchronizeCaseSessions(current)
      registerCase(current)
      const decision = current.evidenceDecisions[0] || null
      const ownContribution = current.contributions.find((item) => item.researchRequestId === input.researchRequestId && item.receiptId === got.receiptId)
      const ownEvidence = ownContribution ? evidenceFromContribution(current, ownContribution) : null
      const contributionDecision = ownEvidence && decision ? {
        ...ownEvidence,
        state: decision.state,
        nextResponsible: decision.nextResponsible,
        corroborations: [...(decision.corroborations || [])],
        contradictions: [...(decision.contradictions || [])],
      } : null
      return {
        state: current.state,
        researchPlanId: current.researchPlanId,
        evidenceCaseId: current.evidenceCaseId,
        identity: clone(caseIdentity(current)),
        receipt: got,
        evidence: contributionDecision ? publicView(contributionDecision) : null,
        memory: current.memory,
        pendingOperations: [...current.pendingOperations],
        lastErrorCode: current.lastErrorCode || null,
        idempotent,
      }
    })
  }

  async function receive(value) {
    const allowed = ['researchRequestId', 'rawReceipt', 'claim', 'corroborations']
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_CONTRIBUTION', 'Contribucion invalida.')
    return receiveContribution({ researchRequestId: value.researchRequestId, rawReceipt: value.rawReceipt, claim: value.claim })
  }

  async function reopenEvidenceCase(evidenceCaseId) {
    const current = await caseStore.read(evidenceCaseId)
    if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    caseIdentity(current)
    if (current.state === 'preparing' || current.pendingOperations.length > 0) return retryEvidenceCase(evidenceCaseId)
    registerCase(current)
    return evidenceCaseView(current)
  }

  function evidenceCaseView(current) {
    const identity = caseIdentity(current)
    const decision = current.evidenceDecisions[0] || null
    return {
      researchPlanId: current.researchPlanId,
      evidenceCaseId: current.evidenceCaseId,
      identity: clone(identity),
      projectId: current.projectId,
      state: current.state,
      requestIds: current.requests.map((item) => item.researchRequestId).sort(),
      receiptsReceived: current.receipts.length,
      evidence: decision ? publicView(decision) : null,
      contradictionStatus: current.contradictionStatus || null,
      pendingOperations: current.pendingOperations,
      lastErrorCode: current.lastErrorCode || null,
      memory: current.memory,
      nextResponsible: current.nextResponsible,
      revision: current.revision,
    }
  }

  async function getResearchStatus(researchRequestId) {
    const current = await resolveCase(researchRequestId)
    const requestRecord = current.requests.find((item) => item.researchRequestId === researchRequestId)
    return {
      state: sessionState(current, requestRecord),
      researchRequestId,
      researchPlanId: current.researchPlanId,
      evidenceCaseId: current.evidenceCaseId,
      identity: clone(caseIdentity(current)),
      pendingOperations: [...current.pendingOperations],
      lastErrorCode: current.lastErrorCode || null,
      memory: clone(current.memory),
    }
  }

  async function retryEvidenceCaseUnlocked(evidenceCaseId, expected = null, projectId = null, advanceFailure = false) {
    let current = await caseStore.read(evidenceCaseId)
    if (!current) {
      if (expected) fail('STALE_RECONCILE_CANDIDATE', 'El candidato de investigacion ya no existe.')
      fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    }
    caseIdentity(current)
    if (expected) current = requireRecoveryCandidate(current, expected, projectId)
    await requireWritableSessionProjection(current)
    if (current.state === 'preparing' || current.pendingOperations.includes('complete_plan')) current = await completePreparation(evidenceCaseId, advanceFailure)
    current = await appendAcceptedMemory(current, advanceFailure)
    current = await synchronizeCaseSessions(current, advanceFailure)
    registerCase(current)
    return evidenceCaseView(current)
  }

  async function retryEvidenceCase(evidenceCaseId) {
    return exclusive(operationKey(evidenceCaseId), () => retryEvidenceCaseUnlocked(evidenceCaseId))
  }

  async function retryPendingResearch(researchRequestId) {
    const current = await resolveCase(researchRequestId)
    return retryEvidenceCase(current.evidenceCaseId)
  }

  async function reconcilePendingResearch(projectId, limit = 50, candidates = undefined) {
    if (typeof projectId !== 'string' || !CORRELATION_ID.test(projectId)) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) fail('INVALID_RECONCILE_LIMIT', 'Limite de reconciliacion invalido.')
    if (candidates !== undefined) {
      const exactCandidates = recoveryCandidates(candidates, limit)
      if (exactCandidates.length === 0) return []
      const keys = exactCandidates.map((item) => operationKey(item.evidenceCaseId))
      return exclusiveMany(keys, async () => {
        for (const item of exactCandidates) requireRecoveryCandidate(await caseStore.read(item.evidenceCaseId), item, projectId)
        const results = []
        for (const item of exactCandidates) {
          try {
            results.push(await retryEvidenceCaseUnlocked(item.evidenceCaseId, item, projectId, true))
          } catch (error) {
            if (typeof error?.code === 'string' && error.code.startsWith('STALE_')) throw error
            const durable = await caseStore.read(item.evidenceCaseId)
            const persistedErrorCodes = new Set([persistableErrorCode(error, 'RESEARCH_PERSISTENCE_FAILED'), persistableErrorCode(error, 'MEMORY_APPEND_FAILED')])
            const advanced = durable && durable.revision > item.revision
            if (!durable || durable.projectId !== projectId || !advanced || durable.pendingOperations.length === 0 || !persistedErrorCodes.has(durable.lastErrorCode)) throw error
            results.push(evidenceCaseView(durable))
          }
        }
        return results
      })
    }
    const cases = typeof caseStore.listAll === 'function' ? await caseStore.listAll(projectId) : await caseStore.list(projectId, 1000)
    const pending = cases.filter((current) => current.state === 'preparing' || current.pendingOperations.length > 0).sort((a, b) => Number(Boolean(a.lastErrorCode)) - Number(Boolean(b.lastErrorCode)) || (a.lastErrorCode && b.lastErrorCode ? a.revision - b.revision : 0) || a.evidenceCaseId.localeCompare(b.evidenceCaseId)).slice(0, limit)
    return reconcilePendingResearch(projectId, limit, pending.map(recoveryCandidate))
  }

  async function reopen(researchRequestId) {
    let current = await resolveCase(researchRequestId)
    if (current.state === 'preparing' || current.pendingOperations.length > 0) {
      await retryEvidenceCase(current.evidenceCaseId)
      current = await resolveCase(researchRequestId)
    }
    const requestRecord = current.requests.find((item) => item.researchRequestId === researchRequestId)
    const decision = current.evidenceDecisions[0] || null
    return { request: requestRecord, state: sessionState(current, requestRecord), evidence: decision ? publicView(decision) : null, researchPlanId: current.researchPlanId, evidenceCaseId: current.evidenceCaseId, identity: clone(caseIdentity(current)) }
  }

  function getResearchView(researchRequestId) {
    const record = records.get(researchRequestId)
    if (!record) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
    return {
      state: record.status,
      receiptsReceived: record.receipts.length,
      evidenceAccepted: record.evidence.filter((item) => item.state === 'accepted_for_context').length,
      nextResponsible: record.nextResponsible || 'jefe',
      nextStep: record.pending ? 'Reintentar persistencia de investigacion.' : 'Esperar proveedor o corroboracion.',
      researchPlanId: record.researchPlanId,
      evidenceCaseId: record.evidenceCaseId,
      identity: clone(record.request.identity),
    }
  }

  function contributionContextView(researchRequestId, record) {
    return deepFreeze({
      researchSessionId: sessionId(researchRequestId),
      researchRequestId,
      researchPlanId: record.researchPlanId,
      evidenceCaseId: record.evidenceCaseId,
      discoveryId: record.request.discoveryId,
      projectId: record.request.projectId,
      providerType: record.request.providerType,
    })
  }

  function getContributionContext(researchRequestId) {
    const record = records.get(researchRequestId)
    if (record) return contributionContextView(researchRequestId, record)
    return resolveCase(researchRequestId).then(() => {
      const hydrated = records.get(researchRequestId)
      if (!hydrated) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
      return contributionContextView(researchRequestId, hydrated)
    })
  }

  function connectorInputView(researchRequestId, record) {
    return deepFreeze({
      schemaVersion: 'jefe-research-connector-input/v1',
      researchRequestId,
      providerType: record.request.providerType,
      objective: record.request.objective,
      questions: [...record.request.questions],
      budget: { ...record.request.budget },
      needsCorroboration: record.request.needsCorroboration,
    })
  }

  function getConnectorInput(researchRequestId) {
    const record = records.get(researchRequestId)
    if (record) return connectorInputView(researchRequestId, record)
    return resolveCase(researchRequestId).then(() => {
      const hydrated = records.get(researchRequestId)
      if (!hydrated) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
      return connectorInputView(researchRequestId, hydrated)
    })
  }

  async function rebuildEvidenceCaseIndex() {
    return caseStore.rebuildIndex()
  }

  return {
    plan,
    prepareResearch: plan,
    receive,
    receiveContribution,
    recordProviderReceipt: receive,
    getResearchStatus,
    retryPendingResearch,
    retryEvidenceCase,
    reconcilePendingResearch,
    withExactEvidenceCaseSnapshots,
    getResearchView,
    reopen,
    reopenEvidenceCase,
    rebuildEvidenceCaseIndex,
    getContributionContext,
    getConnectorInput,
    requests,
  }
}

module.exports = { SupervisedResearchError, createSupervisedResearch, deriveResearchPlanId, deriveEvidenceCaseId }
