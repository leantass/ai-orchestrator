const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { receipt: providerReceipt, safeResearchText } = require('./jefe-research-contract.cjs')
const { LIMITS, budget: researchBudget, safeUrl } = require('./jefe-research-provider-policy.cjs')
const { TYPES: PROVIDERS } = require('./jefe-research-provider-registry.cjs')

const SESSION_ID = /^research-session-[a-f0-9]{32}$/u
const REQUEST_ID = /^research-[a-f0-9]{32}$/u
const PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const EVIDENCE_ID = /^evidence-[a-f0-9]{32}$/u
const RECEIPT_ID = /^receipt-[a-f0-9]{32}$/u
const CORRELATION_ID = /^[a-z][a-z0-9-]{2,80}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const HANDOFF_ID = /^agent-handoff-[a-f0-9]{32}$/u
const HASH = /^[a-f0-9]{64}$/u
const IDENTITY_FIELDS = Object.freeze(['projectId', 'runId', 'versionId'])

const SESSION_FIELDS = Object.freeze([
  'schemaVersion',
  'researchSessionId',
  'researchRequestId',
  'researchPlanId',
  'evidenceCaseId',
  'identity',
  'discoveryId',
  'intakeId',
  'projectId',
  'packageId',
  'handoffId',
  'providerType',
  'policyFingerprint',
  'budget',
  'budgetConsumed',
  'status',
  'request',
  'receipts',
  'evidenceDecisions',
  'pendingOperations',
  'lastErrorCode',
  'nextResponsible',
  'createdAt',
  'updatedAt',
])
const REQUEST_FIELDS = Object.freeze([
  'schemaVersion',
  'identity',
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
  'researchPlanId',
  'evidenceCaseId',
])
const EVIDENCE_FIELDS = Object.freeze([
  'schemaVersion',
  'evidenceId',
  'researchRequestId',
  'receiptId',
  'claim',
  'claimKind',
  'source',
  'providerType',
  'contentHash',
  'receiptStatus',
  'actor',
  'authority',
  'provenance',
  'timestamp',
  'freshness',
  'state',
  'classification',
  'corroborations',
  'contradictions',
  'limits',
  'nextResponsible',
  'branches',
])
const BRANCH_FIELDS = Object.freeze(['claim', 'evidenceIds'])
const RECEIPT_SOURCE_FIELDS = Object.freeze([
  'researchRequestId',
  'providerType',
  'operation',
  'status',
  'url',
  'mimeType',
  'bytes',
  'contentHash',
  'excerpt',
  'method',
  'redirects',
  'codes',
  'consumed',
])
const CONSUMED_FIELDS = Object.freeze(['queries', 'sources', 'bytes', 'durationMs', 'redirects', 'attempts'])
const SESSION_STATES = new Set([
  'available',
  'prepared',
  'awaiting_provider',
  'policy_blocked',
  'not_connected',
  'evidence_pending',
  'needs_corroboration',
  'accepted_for_context',
  'requires_human',
  'completed_with_evidence',
  'completed_without_evidence',
  'failed',
])
const REQUEST_STATES = new Set(['available', 'policy_blocked', 'not_connected'])
const EVIDENCE_STATES = new Set(['candidate', 'needs_corroboration', 'accepted_for_context', 'requires_human'])
const PENDING_OPERATIONS = new Set(['complete_plan', 'memory_append', 'sync_request_sessions'])
const NEXT_RESPONSIBLES = new Set(['lean', 'radar', 'hermes', 'scout', 'jefe'])
const ERROR_CODES = new Set([
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
const IMMUTABLE_FIELDS = Object.freeze([
  'schemaVersion',
  'researchSessionId',
  'researchRequestId',
  'researchPlanId',
  'evidenceCaseId',
  'identity',
  'discoveryId',
  'intakeId',
  'projectId',
  'packageId',
  'handoffId',
  'providerType',
  'policyFingerprint',
  'budget',
  'request',
  'createdAt',
])
const STATE_TRANSITIONS = Object.freeze({
  available: new Set(['available', 'evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  prepared: new Set(['prepared', 'awaiting_provider', 'evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  awaiting_provider: new Set(['awaiting_provider', 'evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  policy_blocked: new Set(['policy_blocked', 'evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  not_connected: new Set(['not_connected', 'evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  evidence_pending: new Set(['evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  needs_corroboration: new Set(['needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence', 'completed_without_evidence', 'failed']),
  accepted_for_context: new Set(['accepted_for_context', 'completed_with_evidence', 'requires_human', 'failed']),
  requires_human: new Set(['requires_human']),
  completed_with_evidence: new Set(['completed_with_evidence', 'requires_human']),
  completed_without_evidence: new Set(['completed_without_evidence', 'requires_human']),
  failed: new Set(['failed']),
})

const locks = new Map()
let stageSequence = 0

class SupervisedResearchPersistenceError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchPersistenceError(code, message)
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))
}

function exactFields(value, allowed) {
  return plainObject(value) && Object.keys(value).every((key) => allowed.includes(key))
}

function validatePhysicalIdentity(value) {
  if (!plainObject(value) || Object.keys(value).length !== IDENTITY_FIELDS.length || IDENTITY_FIELDS.some((field) => !Object.hasOwn(value, field) || typeof value[field] !== 'string' || !CORRELATION_ID.test(value[field]))) fail('INVALID_SESSION', 'Sesion invalida.')
  return Object.fromEntries(IDENTITY_FIELDS.map((field) => [field, value[field]]))
}

function validTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function normalizedRootKey(value) {
  const resolved = path.normalize(path.resolve(value))
  return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved
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

function validateBudget(value) {
  let clean
  try { clean = researchBudget(value) } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
  if (canonical(clean) !== canonical(value)) fail('INVALID_SESSION', 'Sesion invalida.')
  return clean
}

function validateConsumed(value) {
  if (!exactFields(value, CONSUMED_FIELDS)) fail('INVALID_SESSION', 'Sesion invalida.')
  const caps = { queries: LIMITS.maxQueries, sources: LIMITS.maxSources, bytes: LIMITS.maxTotalBytes, durationMs: LIMITS.maxDurationMs, redirects: LIMITS.maxRedirects, attempts: LIMITS.maxAttempts }
  for (const [key, item] of Object.entries(value)) if (!Number.isSafeInteger(item) || item < 0 || item > caps[key]) fail('INVALID_SESSION', 'Sesion invalida.')
  return value
}

function validateStoredRequest(value) {
  if (!exactFields(value, REQUEST_FIELDS) || value.schemaVersion !== 'jefe-research-request/v1') fail('INVALID_SESSION', 'Sesion invalida.')
  for (const key of ['discoveryId', 'intakeId', 'projectId', 'packageId', 'handoffId']) if (typeof value[key] !== 'string' || !CORRELATION_ID.test(value[key])) fail('INVALID_SESSION', 'Sesion invalida.')
  const physical = validatePhysicalIdentity(value.identity)
  if (physical.projectId !== value.projectId || !PACKAGE_ID.test(value.packageId) || !HANDOFF_ID.test(value.handoffId)) fail('INVALID_SESSION', 'Sesion invalida.')
  if (!['radar', 'scout', 'hermes'].includes(value.role) || value.actor !== value.role || value.authority !== 'agent_inference' || value.provenance !== 'supervised_research_request') fail('INVALID_SESSION', 'Sesion invalida.')
  if ((value.role === 'radar' && value.purpose !== 'discovery') || (value.role !== 'radar' && value.purpose !== 'research')) fail('INVALID_SESSION', 'Sesion invalida.')
  if (!Object.hasOwn(PROVIDERS, value.providerType) || !PROVIDERS[value.providerType].purposes.includes(value.purpose) || !REQUEST_STATES.has(value.state)) fail('INVALID_SESSION', 'Sesion invalida.')
  let objective
  let questions
  try {
    objective = safeResearchText(value.objective)
    questions = Array.isArray(value.questions) ? value.questions.map((item) => safeResearchText(item)) : null
  } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
  if (objective !== value.objective || !questions || questions.length < 1 || questions.length > 12 || canonical(questions) !== canonical(value.questions)) fail('INVALID_SESSION', 'Sesion invalida.')
  const cleanBudget = validateBudget(value.budget)
  if (!Array.isArray(value.references) || value.references.length > 20) fail('INVALID_SESSION', 'Sesion invalida.')
  try { if (value.references.some((item) => safeUrl(item) !== item)) fail('INVALID_SESSION', 'Sesion invalida.') } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
  if (typeof value.needsCorroboration !== 'boolean' || !validTimestamp(value.createdAt) || !REQUEST_ID.test(value.researchRequestId) || !PLAN_ID.test(value.researchPlanId) || !CASE_ID.test(value.evidenceCaseId)) fail('INVALID_SESSION', 'Sesion invalida.')
  const requestSeed = {}
  for (const key of REQUEST_FIELDS) if (!['researchRequestId', 'researchPlanId', 'evidenceCaseId'].includes(key)) requestSeed[key] = value[key]
  if (value.researchRequestId !== `research-${digest(requestSeed).slice(0, 32)}` || canonical(cleanBudget) !== canonical(value.budget)) fail('INVALID_SESSION', 'Sesion invalida.')
  return JSON.parse(canonical(value))
}

function validateReceipt(value, session) {
  if (!plainObject(value) || !RECEIPT_ID.test(value.receiptId) || !validTimestamp(value.receivedAt)) fail('INVALID_SESSION', 'Sesion invalida.')
  const raw = {}
  for (const key of RECEIPT_SOURCE_FIELDS) if (value[key] !== undefined) raw[key] = value[key]
  let rebuilt
  try {
    rebuilt = providerReceipt(raw, {
      researchRequestId: session.researchRequestId,
      providerType: session.providerType,
      budget: session.budget,
    }, value.receivedAt)
  } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
  if (canonical(rebuilt) !== canonical(value)) fail('INVALID_SESSION', 'Sesion invalida.')
  return rebuilt
}

function validateEvidenceIds(value) {
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some((item) => typeof item !== 'string' || !EVIDENCE_ID.test(item))) fail('INVALID_SESSION', 'Sesion invalida.')
  return value
}

function validateEvidence(value) {
  if (!exactFields(value, EVIDENCE_FIELDS) || value.schemaVersion !== 'jefe-research-evidence/v1' || !EVIDENCE_ID.test(value.evidenceId) || !REQUEST_ID.test(value.researchRequestId) || !RECEIPT_ID.test(value.receiptId)) fail('INVALID_SESSION', 'Sesion invalida.')
  let claim
  try { claim = safeResearchText(value.claim, { max: 500 }) } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
  if (claim !== value.claim || value.claimKind !== 'claim' || !Object.hasOwn(PROVIDERS, value.providerType) || !HASH.test(value.contentHash) || !['received', 'partial'].includes(value.receiptStatus)) fail('INVALID_SESSION', 'Sesion invalida.')
  if (!['hermes', 'scout'].includes(value.actor) || value.authority !== 'technical_result' || value.provenance !== 'supervised_research_evidence_candidate' || !validTimestamp(value.timestamp) || value.freshness !== 'current_at_receipt' || !EVIDENCE_STATES.has(value.state) || value.classification !== 'UNTRUSTED_EXTERNAL_CONTENT') fail('INVALID_SESSION', 'Sesion invalida.')
  if (value.source !== 'controlled_provider_receipt') {
    try { if (safeUrl(value.source) !== value.source) fail('INVALID_SESSION', 'Sesion invalida.') } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
  }
  validateEvidenceIds(value.corroborations)
  validateEvidenceIds(value.contradictions)
  validateConsumed(value.limits)
  if (value.evidenceId !== `evidence-${digest({ request: value.researchRequestId, receipt: value.receiptId, claim: value.claim }).slice(0, 32)}`) fail('INVALID_SESSION', 'Sesion invalida.')
  const expectedResponsible = { needs_corroboration: 'scout', accepted_for_context: 'jefe', requires_human: 'lean' }[value.state]
  if ((expectedResponsible && value.nextResponsible !== expectedResponsible) || (!expectedResponsible && value.nextResponsible !== undefined)) fail('INVALID_SESSION', 'Sesion invalida.')
  if (value.branches !== undefined) {
    if (value.state !== 'requires_human' || !Array.isArray(value.branches) || value.branches.length < 2) fail('INVALID_SESSION', 'Sesion invalida.')
    for (const branch of value.branches) {
      if (!exactFields(branch, BRANCH_FIELDS)) fail('INVALID_SESSION', 'Sesion invalida.')
      let branchClaim
      try { branchClaim = safeResearchText(branch.claim, { max: 500 }) } catch { fail('INVALID_SESSION', 'Sesion invalida.') }
      if (branchClaim !== branch.claim) fail('INVALID_SESSION', 'Sesion invalida.')
      validateEvidenceIds(branch.evidenceIds)
    }
  }
  return JSON.parse(canonical(value))
}

function validateSessionRecord(value) {
  if (!exactFields(value, SESSION_FIELDS) || value.schemaVersion !== 'jefe-supervised-research-session/v1' || !SESSION_ID.test(value.researchSessionId) || !REQUEST_ID.test(value.researchRequestId)) fail('INVALID_SESSION', 'Sesion invalida.')
  for (const key of ['discoveryId', 'intakeId', 'projectId', 'packageId', 'handoffId']) if (typeof value[key] !== 'string' || !CORRELATION_ID.test(value[key])) fail('INVALID_SESSION', 'Sesion invalida.')
  if (!Object.hasOwn(PROVIDERS, value.providerType) || !HASH.test(value.policyFingerprint) || !SESSION_STATES.has(value.status) || !NEXT_RESPONSIBLES.has(value.nextResponsible)) fail('INVALID_SESSION', 'Sesion invalida.')
  if (!validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt) || Date.parse(value.updatedAt) < Date.parse(value.createdAt)) fail('INVALID_SESSION', 'Sesion invalida.')
  const canonicalSessionId = `research-session-${digest(value.researchRequestId).slice(0, 32)}`
  const cleanBudget = validateBudget(value.budget)
  if (!Number.isSafeInteger(value.budgetConsumed) || value.budgetConsumed < 0 || value.budgetConsumed > cleanBudget.maxTotalBytes) fail('INVALID_SESSION', 'Sesion invalida.')
  if (!Array.isArray(value.receipts) || !Array.isArray(value.evidenceDecisions) || value.evidenceDecisions.length > 1 || !Array.isArray(value.pendingOperations)) fail('INVALID_SESSION', 'Sesion invalida.')
  const receipts = value.receipts.map((item) => validateReceipt(item, value))
  if (new Set(receipts.map((item) => item.receiptId)).size !== receipts.length || receipts.reduce((sum, item) => sum + (item.bytes || 0), 0) !== value.budgetConsumed) fail('INVALID_SESSION', 'Sesion invalida.')
  const evidenceDecisions = value.evidenceDecisions.map(validateEvidence)
  if (new Set(value.pendingOperations).size !== value.pendingOperations.length || value.pendingOperations.some((item) => !PENDING_OPERATIONS.has(item))) fail('INVALID_SESSION', 'Sesion invalida.')
  if (value.lastErrorCode !== undefined && (!ERROR_CODES.has(value.lastErrorCode) || value.pendingOperations.length === 0)) fail('INVALID_SESSION', 'Sesion invalida.')
  const fullShape = value.request !== undefined || value.researchPlanId !== undefined || value.evidenceCaseId !== undefined || value.identity !== undefined
  if (fullShape) {
    if (value.researchSessionId !== canonicalSessionId) fail('INVALID_SESSION', 'Sesion invalida.')
    if (value.request === undefined || !PLAN_ID.test(value.researchPlanId) || !CASE_ID.test(value.evidenceCaseId) || !PACKAGE_ID.test(value.packageId) || !HANDOFF_ID.test(value.handoffId)) fail('INVALID_SESSION', 'Sesion invalida.')
    const identity = validatePhysicalIdentity(value.identity)
    if (identity.projectId !== value.projectId) fail('INVALID_SESSION', 'Sesion invalida.')
    const request = validateStoredRequest(value.request)
    for (const key of ['researchRequestId', 'researchPlanId', 'evidenceCaseId', 'discoveryId', 'intakeId', 'projectId', 'packageId', 'handoffId', 'providerType']) if (request[key] !== value[key]) fail('INVALID_SESSION', 'Sesion invalida.')
    if (canonical(request.identity) !== canonical(identity)) fail('INVALID_SESSION', 'Sesion invalida.')
    const expectedPlanId = `research-plan-${digest({ identity, projectId: value.projectId, discoveryId: value.discoveryId, intakeId: value.intakeId, objective: request.objective, questions: request.questions }).slice(0, 32)}`
    if (value.researchPlanId !== expectedPlanId || value.evidenceCaseId !== `evidence-case-${digest({ researchPlanId: expectedPlanId, slot: 'primary_evidence' }).slice(0, 32)}`) fail('INVALID_SESSION', 'Sesion invalida.')
    if (canonical(request.budget) !== canonical(cleanBudget) || value.policyFingerprint !== digest(cleanBudget) || request.createdAt !== value.createdAt) fail('INVALID_SESSION', 'Sesion invalida.')
    const decision = evidenceDecisions[0]
    if (value.status === 'needs_corroboration' && decision?.state !== 'needs_corroboration') fail('INVALID_SESSION', 'Sesion invalida.')
    if (value.status === 'accepted_for_context' && decision?.state !== 'accepted_for_context') fail('INVALID_SESSION', 'Sesion invalida.')
    if (value.status === 'completed_with_evidence' && decision?.state !== 'accepted_for_context') fail('INVALID_SESSION', 'Sesion invalida.')
    if (value.status === 'requires_human' && (decision?.state !== 'requires_human' || value.nextResponsible !== 'lean')) fail('INVALID_SESSION', 'Sesion invalida.')
  }
  return JSON.parse(canonical({ ...value, budget: cleanBudget, receipts, evidenceDecisions }))
}

function assertCompatible(prior, next) {
  const priorIdentity = Object.fromEntries(IMMUTABLE_FIELDS.map((key) => [key, prior[key] ?? null]))
  const nextIdentity = Object.fromEntries(IMMUTABLE_FIELDS.map((key) => [key, next[key] ?? null]))
  if (canonical(priorIdentity) !== canonical(nextIdentity)) fail('INCOMPATIBLE_REPLAY', 'Sesion durable incompatible.')
  if (Date.parse(next.updatedAt) < Date.parse(prior.updatedAt) || !STATE_TRANSITIONS[prior.status]?.has(next.status)) fail('STALE_SESSION', 'Sesion durable obsoleta.')
  const nextReceipts = new Map(next.receipts.map((item) => [item.receiptId, item]))
  for (const item of prior.receipts) {
    const replay = nextReceipts.get(item.receiptId)
    if (!replay || canonical(replay) !== canonical(item)) fail('INCOMPATIBLE_REPLAY', 'Receipt durable incompatible.')
  }
}

function createSupervisedResearchPersistence({ root, failureInjection = null } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Registro de investigacion invalido.')
  if (failureInjection !== null && failureInjection !== 'before_rename') fail('INVALID_FAILURE_INJECTION', 'Registro de investigacion invalido.')
  const authorityRoot = path.resolve(root)
  const rootKey = normalizedRootKey(authorityRoot)
  const sessionFile = (id) => path.join(authorityRoot, `${id}.json`)
  const indexFile = path.join(authorityRoot, 'research-session-index.json')
  const isSessionFile = (name) => /^research-session-[a-f0-9]{32}\.json$/u.test(name)
  const lockKey = (id) => `${rootKey}:${id}`

  async function atomic(target, value) {
    const stage = `${target}.${process.pid}.${Date.now()}.${++stageSequence}.stage`
    await fs.promises.mkdir(authorityRoot, { recursive: true })
    try {
      await fs.promises.writeFile(stage, `${canonical(value)}\n`, 'utf8')
      if (failureInjection === 'before_rename') fail('INJECTED_FAILURE', 'Fallo durable inyectado.')
      await fs.promises.rename(stage, target)
      return value
    } finally {
      await fs.promises.rm(stage, { force: true }).catch(() => {})
    }
  }

  async function read(id) {
    if (typeof id !== 'string' || !SESSION_ID.test(id)) fail('INVALID_SESSION_ID', 'Sesion invalida.')
    try {
      const value = validateSessionRecord(JSON.parse(await fs.promises.readFile(sessionFile(id), 'utf8')))
      if (value.researchSessionId !== id) fail('CORRUPT_SESSION', 'Sesion durable corrupta.')
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return null
      if (error.code === 'CORRUPT_SESSION') throw error
      fail('CORRUPT_SESSION', 'Sesion durable corrupta.')
    }
  }

  async function write(record) {
    let clean
    try { clean = validateSessionRecord(record) } catch (error) {
      if (error.code === 'INVALID_SESSION') throw error
      fail('INVALID_SESSION', 'Sesion invalida.')
    }
    return locked(lockKey(clean.researchSessionId), async () => {
      const prior = await read(clean.researchSessionId)
      if (prior && canonical(prior) === canonical(clean)) return { record: prior, idempotent: true }
      if (prior) assertCompatible(prior, clean)
      return { record: await atomic(sessionFile(clean.researchSessionId), clean), idempotent: false }
    })
  }

  async function scanDetailed(projectId) {
    if (projectId !== undefined && (typeof projectId !== 'string' || !CORRELATION_ID.test(projectId))) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
    try {
      const names = (await fs.promises.readdir(authorityRoot)).filter(isSessionFile).sort()
      const records = []
      const corruptions = []
      for (const name of names) {
        const researchSessionId = name.slice(0, -5)
        try {
          const item = await read(researchSessionId)
          if (item && (projectId === undefined || item.projectId === projectId)) records.push(item)
        } catch (error) {
          if (error.code !== 'CORRUPT_SESSION') throw error
          corruptions.push({ researchSessionId, code: 'CORRUPT_SESSION' })
        }
      }
      return { records, corruptions }
    } catch (error) {
      if (error.code === 'ENOENT') return { records: [], corruptions: [] }
      throw error
    }
  }

  async function listDetailed(projectId) {
    return scanDetailed(projectId)
  }

  async function list(projectId) {
    return (await scanDetailed(projectId)).records
  }

  async function listAll(projectId) {
    return (await scanDetailed(projectId)).records
  }

  async function rebuildIndex() {
    return locked(lockKey('index'), async () => {
      const detail = await scanDetailed(undefined)
      const index = {
        schemaVersion: 'jefe-supervised-research-session-index/v1',
        sessionIds: detail.records.map((item) => item.researchSessionId).sort(),
        requestAssociations: detail.records.map((item) => ({
          projectId: item.projectId,
          researchRequestId: item.researchRequestId,
          researchSessionId: item.researchSessionId,
        })).sort((left, right) => left.researchRequestId.localeCompare(right.researchRequestId)),
        corruptions: detail.corruptions,
        rebuiltAt: null,
      }
      let prior = null
      let recovered = false
      try { prior = JSON.parse(await fs.promises.readFile(indexFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') recovered = true }
      if (prior && canonical(prior) === canonical(index)) return { index: prior, idempotent: true, recovered }
      return { index: await atomic(indexFile, index), idempotent: false, recovered }
    })
  }

  return { authorityRoot, read, write, listDetailed, list, listAll, rebuildIndex }
}

module.exports = { SupervisedResearchPersistenceError, createSupervisedResearchPersistence }
