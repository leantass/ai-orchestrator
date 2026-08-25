const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { physicalRootKey, resolvePhysicalRoot } = require('./jefe-physical-root.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { receipt: providerReceipt, safeResearchText } = require('./jefe-research-contract.cjs')
const { candidate } = require('./jefe-research-evidence-contract.cjs')
const { evaluate } = require('./jefe-research-evidence-gate.cjs')
const { budget: researchBudget, safeUrl } = require('./jefe-research-provider-policy.cjs')
const { TYPES: PROVIDERS } = require('./jefe-research-provider-registry.cjs')

const SCHEMA_VERSION = 'jefe-supervised-research-evidence-case/v1'
const CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const REQUEST_ID = /^research-[a-f0-9]{32}$/u
const RECEIPT_ID = /^receipt-[a-f0-9]{32}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const HANDOFF_ID = /^agent-handoff-[a-f0-9]{32}$/u
const MEMORY_ENTRY_ID = /^research-evidence-[a-f0-9]{24}$/u
const CORRELATION_ID = /^[a-z][a-z0-9-]{2,80}$/u
const ROLES = Object.freeze(['radar', 'scout', 'hermes'])
const IDENTITY_FIELDS = Object.freeze(['projectId', 'runId', 'versionId'])
const CASE_STATES = Object.freeze([
  'preparing',
  'ready',
  'needs_corroboration',
  'accepted_for_context',
  'requires_human',
  'evidence_pending',
])
const CASE_REQUIRED_FIELDS = Object.freeze([
  'schemaVersion',
  'evidenceCaseId',
  'researchPlanId',
  'identity',
  'projectId',
  'discoveryId',
  'intakeId',
  'objective',
  'questions',
  'state',
  'revision',
  'requests',
  'preparedRequestIds',
  'receipts',
  'contributions',
  'evidenceDecisions',
  'pendingOperations',
  'memory',
  'nextResponsible',
  'createdAt',
  'updatedAt',
])
const CASE_OPTIONAL_FIELDS = Object.freeze(['lastErrorCode', 'contradictionStatus'])
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
const REQUEST_HASH_FIELDS = Object.freeze([
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
])
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
const CONTRIBUTION_FIELDS = Object.freeze(['researchRequestId', 'receiptId', 'claim'])
const MEMORY_FIELDS = Object.freeze(['status', 'entryId'])
const REQUEST_STATES = new Set(['available', 'policy_blocked', 'not_connected'])
const PENDING_OPERATIONS = new Set(['complete_plan', 'memory_append', 'sync_request_sessions'])
const NEXT_RESPONSIBLES = new Set(['lean', 'scout', 'jefe'])
const ERROR_CODES = new Set([
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
])
const STATE_TRANSITIONS = Object.freeze({
  preparing: new Set(['preparing', 'ready']),
  ready: new Set(['ready', 'evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human']),
  evidence_pending: new Set(['evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human']),
  needs_corroboration: new Set(['needs_corroboration', 'accepted_for_context', 'requires_human']),
  accepted_for_context: new Set(['accepted_for_context', 'requires_human']),
  requires_human: new Set(['requires_human']),
})
const IMMUTABLE_FIELDS = Object.freeze([
  'schemaVersion',
  'evidenceCaseId',
  'researchPlanId',
  'identity',
  'projectId',
  'discoveryId',
  'intakeId',
  'objective',
  'questions',
  'requests',
  'createdAt',
])
const locks = new Map()
let stageSequence = 0

class EvidenceCasePersistenceError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'EvidenceCasePersistenceError'
    this.code = code
  }
}

function fail(code, message) {
  throw new EvidenceCasePersistenceError(code, message)
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

function exactFields(value, fields) {
  return plainObject(value) && canonical(Object.keys(value).sort()) === canonical([...fields].sort())
}

function exactShape(value, required, optional = []) {
  if (!plainObject(value) || required.some((field) => !Object.hasOwn(value, field)) || Object.keys(value).some((field) => !required.includes(field) && !optional.includes(field))) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
}

function timestamp(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) fail('INVALID_EVIDENCE_CASE', 'Timestamp de evidencia invalido.')
  return value
}

function physicalIdentity(value) {
  if (!exactFields(value, IDENTITY_FIELDS) || IDENTITY_FIELDS.some((field) => typeof value[field] !== 'string' || !CORRELATION_ID.test(value[field]))) fail('INVALID_EVIDENCE_CASE', 'Identidad fisica invalida.')
  return Object.fromEntries(IDENTITY_FIELDS.map((field) => [field, value[field]]))
}

function safeText(value, max = 500) {
  let clean
  try { clean = safeResearchText(value, { max }) } catch { fail('INVALID_EVIDENCE_CASE', 'Texto de evidencia invalido.') }
  if (clean !== value) fail('INVALID_EVIDENCE_CASE', 'Texto de evidencia invalido.')
  return clean
}

function safeQuestions(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) fail('INVALID_EVIDENCE_CASE', 'Preguntas de evidencia invalidas.')
  return value.map((item) => safeText(item))
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
  try { clean = researchBudget(value) } catch { fail('INVALID_EVIDENCE_CASE', 'Budget de request invalido.') }
  if (canonical(clean) !== canonical(value)) fail('INVALID_EVIDENCE_CASE', 'Budget de request invalido.')
  return clean
}

function validateRequest(value, caseContext) {
  if (!exactFields(value, REQUEST_FIELDS) || value.schemaVersion !== 'jefe-research-request/v1') fail('INVALID_EVIDENCE_CASE', 'Request de evidencia invalido.')
  const requestIdentity = physicalIdentity(value.identity)
  if (canonical(requestIdentity) !== canonical(caseContext.identity) || requestIdentity.projectId !== value.projectId) fail('INVALID_EVIDENCE_CASE', 'Identidad de request invalida.')
  for (const field of ['discoveryId', 'intakeId', 'projectId']) if (value[field] !== caseContext[field]) fail('INVALID_EVIDENCE_CASE', 'Correlacion de request invalida.')
  if (!PACKAGE_ID.test(value.packageId) || !HANDOFF_ID.test(value.handoffId) || !ROLES.includes(value.role) || value.actor !== value.role) fail('INVALID_EVIDENCE_CASE', 'Rol o paquete de request invalido.')
  if (value.researchPlanId !== caseContext.researchPlanId || value.evidenceCaseId !== caseContext.evidenceCaseId || value.objective !== caseContext.objective || canonical(value.questions) !== canonical(caseContext.questions)) fail('INVALID_EVIDENCE_CASE', 'Request fuera del caso de evidencia.')
  if (value.authority !== 'agent_inference' || value.provenance !== 'supervised_research_request') fail('INVALID_EVIDENCE_CASE', 'Autoridad de request invalida.')
  const expectedPurpose = value.role === 'radar' ? 'discovery' : 'research'
  if (value.purpose !== expectedPurpose || (value.role === 'radar' && value.providerType !== 'manual_reference') || !Object.hasOwn(PROVIDERS, value.providerType) || !PROVIDERS[value.providerType].purposes.includes(value.purpose) || !REQUEST_STATES.has(value.state)) fail('INVALID_EVIDENCE_CASE', 'Provider de request invalido.')
  safeText(value.objective)
  safeQuestions(value.questions)
  const cleanBudget = validateBudget(value.budget)
  if (!Array.isArray(value.references) || value.references.length > 20) fail('INVALID_EVIDENCE_CASE', 'Referencias de request invalidas.')
  try { if (value.references.some((item) => safeUrl(item) !== item)) fail('INVALID_EVIDENCE_CASE', 'Referencias de request invalidas.') } catch { fail('INVALID_EVIDENCE_CASE', 'Referencias de request invalidas.') }
  if (typeof value.needsCorroboration !== 'boolean' || !REQUEST_ID.test(value.researchRequestId) || timestamp(value.createdAt) !== caseContext.createdAt) fail('INVALID_EVIDENCE_CASE', 'Request de evidencia invalido.')
  const seed = Object.fromEntries(REQUEST_HASH_FIELDS.map((field) => [field, value[field]]))
  if (value.researchRequestId !== `research-${digest(seed).slice(0, 32)}` || canonical(cleanBudget) !== canonical(value.budget)) fail('INVALID_EVIDENCE_CASE', 'ID de request invalido.')
  return clone(value)
}

function validateRequests(value, caseContext) {
  if (!Array.isArray(value) || value.length !== ROLES.length) fail('INVALID_EVIDENCE_CASE', 'Requests del caso invalidas.')
  const clean = value.map((item) => validateRequest(item, caseContext))
  const roles = new Set(clean.map((item) => item.role))
  const requestIds = new Set(clean.map((item) => item.researchRequestId))
  const packageIds = new Set(clean.map((item) => item.packageId))
  const handoffIds = new Set(clean.map((item) => item.handoffId))
  if (ROLES.some((role) => !roles.has(role)) || requestIds.size !== ROLES.length || packageIds.size !== ROLES.length || handoffIds.size !== ROLES.length) fail('INVALID_EVIDENCE_CASE', 'Requests del caso invalidas.')
  const scout = clean.find((item) => item.role === 'scout')
  const hermes = clean.find((item) => item.role === 'hermes')
  if (scout.providerType !== hermes.providerType || clean.some((item) => canonical(item.budget) !== canonical(scout.budget) || canonical(item.references) !== canonical(scout.references) || item.needsCorroboration !== true) || canonical(clean[0].questions) !== canonical(clean[1].questions) || canonical(clean[1].questions) !== canonical(clean[2].questions)) fail('INVALID_EVIDENCE_CASE', 'Requests de research incompatibles.')
  return clean
}

function validateReceipt(value, requestRecord) {
  if (!plainObject(value) || !RECEIPT_ID.test(value.receiptId) || !Object.hasOwn(value, 'receivedAt')) fail('INVALID_EVIDENCE_CASE', 'Receipt invalido.')
  const raw = {}
  for (const field of RECEIPT_SOURCE_FIELDS) if (value[field] !== undefined) raw[field] = value[field]
  let rebuilt
  try { rebuilt = providerReceipt(raw, requestRecord, timestamp(value.receivedAt)) } catch { fail('INVALID_EVIDENCE_CASE', 'Receipt no canonico.') }
  if (canonical(rebuilt) !== canonical(value) || Date.parse(value.receivedAt) < Date.parse(requestRecord.createdAt)) fail('INVALID_EVIDENCE_CASE', 'Receipt no canonico.')
  return rebuilt
}

function validateReceipts(value, requestMap) {
  if (!Array.isArray(value)) fail('INVALID_EVIDENCE_CASE', 'Receipts invalidos.')
  const clean = value.map((item) => {
    const requestRecord = requestMap.get(item?.researchRequestId)
    if (!requestRecord) fail('INVALID_EVIDENCE_CASE', 'Receipt sin request.')
    return validateReceipt(item, requestRecord)
  })
  if (new Set(clean.map((item) => item.receiptId)).size !== clean.length || canonical(clean.map((item) => item.receiptId)) !== canonical(clean.map((item) => item.receiptId).sort())) fail('INVALID_EVIDENCE_CASE', 'Receipts duplicados o desordenados.')
  for (const requestRecord of requestMap.values()) {
    const owned = clean.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
    if (owned.length > requestRecord.budget.maxAttempts || owned.reduce((sum, item) => sum + (item.bytes || 0), 0) > requestRecord.budget.maxTotalBytes) fail('INVALID_EVIDENCE_CASE', 'Budget agregado de receipts excedido.')
    const limits = { queries: 'maxQueries', sources: 'maxSources', bytes: 'maxTotalBytes', durationMs: 'maxDurationMs', redirects: 'maxRedirects', attempts: 'maxAttempts' }
    for (const [field, budgetField] of Object.entries(limits)) if (owned.reduce((sum, item) => sum + (item.consumed?.[field] || 0), 0) > requestRecord.budget[budgetField]) fail('INVALID_EVIDENCE_CASE', 'Budget agregado de receipts excedido.')
  }
  return clean
}

function validateContributions(value, receiptMap) {
  if (!Array.isArray(value)) fail('INVALID_EVIDENCE_CASE', 'Contribuciones invalidas.')
  const clean = value.map((item) => {
    if (!exactFields(item, CONTRIBUTION_FIELDS) || !REQUEST_ID.test(item.researchRequestId) || !RECEIPT_ID.test(item.receiptId)) fail('INVALID_EVIDENCE_CASE', 'Contribucion invalida.')
    const receiptRecord = receiptMap.get(item.receiptId)
    if (!receiptRecord || receiptRecord.researchRequestId !== item.researchRequestId) fail('INVALID_EVIDENCE_CASE', 'Contribucion no correlacionada.')
    return { researchRequestId: item.researchRequestId, receiptId: item.receiptId, claim: safeText(item.claim) }
  })
  if (clean.length !== receiptMap.size || new Set(clean.map((item) => item.receiptId)).size !== clean.length || canonical(clean.map((item) => item.receiptId)) !== canonical(clean.map((item) => item.receiptId).sort())) fail('INVALID_EVIDENCE_CASE', 'Contribuciones duplicadas o incompletas.')
  return clean
}

function normalizedClaim(value) {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('es')
}

function expectedAggregate(requestMap, receiptMap, contributions) {
  const evidence = contributions.map((item) => {
    const requestRecord = requestMap.get(item.researchRequestId)
    const receiptRecord = receiptMap.get(item.receiptId)
    if (!requestRecord || !receiptRecord || !['received', 'partial'].includes(receiptRecord.status)) return null
    try { return candidate({ request: requestRecord, receipt: receiptRecord, claim: item.claim, now: receiptRecord.receivedAt }) } catch { fail('INVALID_EVIDENCE_CASE', 'Candidate durable invalido.') }
  }).filter(Boolean).sort((left, right) => left.receiptId.localeCompare(right.receiptId))
  if (evidence.length === 0) return { state: 'evidence_pending', decisions: [], nextResponsible: 'scout', contradictionStatus: null }
  const groups = new Map()
  for (const item of evidence) {
    const key = normalizedClaim(item.claim)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  if (groups.size > 1) {
    const branches = [...groups.values()].map((items) => ({ claim: items[0].claim, evidenceIds: items.map((item) => item.evidenceId).sort() })).sort((left, right) => left.claim.localeCompare(right.claim))
    const base = evidence[0]
    const decision = {
      ...base,
      state: 'requires_human',
      nextResponsible: 'lean',
      corroborations: [],
      contradictions: evidence.slice(1).map((item) => item.evidenceId).sort(),
      branches,
    }
    return { state: 'requires_human', decisions: [decision], nextResponsible: 'lean', contradictionStatus: 'preserved' }
  }
  const base = evidence[0]
  const corroborations = evidence.slice(1).map((item) => ({ ...item, claim: base.claim, polarity: 'supports' }))
  let decision
  try { decision = evaluate({ request: requestMap.get(base.researchRequestId), receipt: receiptMap.get(base.receiptId), claim: base.claim, corroborations, now: base.timestamp }) } catch { fail('INVALID_EVIDENCE_CASE', 'Decision del gate invalida.') }
  return { state: decision.state, decisions: [decision], nextResponsible: decision.nextResponsible, contradictionStatus: null }
}

function validateMemory(value, record, expected) {
  if (!exactFields(value, MEMORY_FIELDS) || !['not_applicable', 'pending', 'appended'].includes(value.status)) fail('INVALID_EVIDENCE_CASE', 'Estado de MEMORIA invalido.')
  const expectedEntryId = `research-evidence-${digest(record.evidenceCaseId).slice(0, 24)}`
  if (value.status === 'not_applicable' && value.entryId !== null) fail('INVALID_EVIDENCE_CASE', 'Estado de MEMORIA invalido.')
  if (value.status !== 'not_applicable' && (value.entryId !== expectedEntryId || !MEMORY_ENTRY_ID.test(value.entryId))) fail('INVALID_EVIDENCE_CASE', 'Entrada de MEMORIA invalida.')
  const hasPendingAppend = record.pendingOperations.includes('memory_append')
  if (record.state === 'accepted_for_context') {
    if (value.status === 'appended' && hasPendingAppend) fail('INVALID_EVIDENCE_CASE', 'Append de MEMORIA incoherente.')
    if (value.status !== 'appended' && !hasPendingAppend) fail('INVALID_EVIDENCE_CASE', 'Append de MEMORIA faltante.')
  } else if (record.state === 'requires_human' && value.status === 'appended') {
    if (hasPendingAppend) fail('INVALID_EVIDENCE_CASE', 'MEMORIA contradictoria pendiente.')
  } else if (value.status !== 'not_applicable' || hasPendingAppend) fail('INVALID_EVIDENCE_CASE', 'MEMORIA fuera de accepted_for_context.')
  if (record.state === 'accepted_for_context' && expected.state !== 'accepted_for_context') fail('INVALID_EVIDENCE_CASE', 'MEMORIA sin decision aceptada.')
  return { status: value.status, entryId: value.entryId }
}

function validatePending(value, state) {
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some((item) => !PENDING_OPERATIONS.has(item)) || canonical(value) !== canonical([...value].sort())) fail('INVALID_EVIDENCE_CASE', 'Operaciones pendientes invalidas.')
  if (value.includes('complete_plan') && !['preparing', 'ready'].includes(state)) fail('INVALID_EVIDENCE_CASE', 'complete_plan fuera de preparacion.')
  if (state === 'preparing' && !value.includes('complete_plan')) fail('INVALID_EVIDENCE_CASE', 'Preparacion sin operacion durable.')
  return [...value]
}

function validateRecord(value) {
  exactShape(value, CASE_REQUIRED_FIELDS, CASE_OPTIONAL_FIELDS)
  if (value.schemaVersion !== SCHEMA_VERSION || !CASE_ID.test(value.evidenceCaseId) || !PLAN_ID.test(value.researchPlanId) || !CASE_STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  const identity = physicalIdentity(value.identity)
  for (const field of ['projectId', 'discoveryId', 'intakeId']) if (typeof value[field] !== 'string' || !CORRELATION_ID.test(value[field])) fail('INVALID_EVIDENCE_CASE', 'Correlacion del caso invalida.')
  if (identity.projectId !== value.projectId) fail('INVALID_EVIDENCE_CASE', 'Proyecto fisico no correlacionado.')
  if (value.discoveryId !== `discovery-${value.intakeId.slice(7)}`) fail('INVALID_EVIDENCE_CASE', 'Discovery no deriva del intake.')
  const objective = safeText(value.objective)
  const questions = safeQuestions(value.questions)
  const createdAt = timestamp(value.createdAt)
  const updatedAt = timestamp(value.updatedAt)
  if (Date.parse(updatedAt) < Date.parse(createdAt)) fail('INVALID_EVIDENCE_CASE', 'Timestamps del caso invalidos.')
  const expectedPlanId = `research-plan-${digest({ identity, projectId: value.projectId, discoveryId: value.discoveryId, intakeId: value.intakeId, objective, questions }).slice(0, 32)}`
  const expectedCaseId = `evidence-case-${digest({ researchPlanId: expectedPlanId, slot: 'primary_evidence' }).slice(0, 32)}`
  if (value.researchPlanId !== expectedPlanId || value.evidenceCaseId !== expectedCaseId) fail('INVALID_EVIDENCE_CASE', 'IDs de plan o caso invalidos.')

  const context = { identity, projectId: value.projectId, discoveryId: value.discoveryId, intakeId: value.intakeId, objective, questions, researchPlanId: value.researchPlanId, evidenceCaseId: value.evidenceCaseId, createdAt }
  const requests = validateRequests(value.requests, context)
  const requestMap = new Map(requests.map((item) => [item.researchRequestId, item]))
  if (!Array.isArray(value.preparedRequestIds) || new Set(value.preparedRequestIds).size !== value.preparedRequestIds.length || value.preparedRequestIds.some((item) => !requestMap.has(item)) || canonical(value.preparedRequestIds) !== canonical([...value.preparedRequestIds].sort())) fail('INVALID_EVIDENCE_CASE', 'Requests preparados invalidos.')
  if (value.state !== 'preparing' && value.preparedRequestIds.length !== requests.length) fail('INVALID_EVIDENCE_CASE', 'Caso activo sin todos los requests preparados.')
  const receipts = validateReceipts(value.receipts, requestMap)
  const receiptMap = new Map(receipts.map((item) => [item.receiptId, item]))
  const contributions = validateContributions(value.contributions, receiptMap)
  const expected = expectedAggregate(requestMap, receiptMap, contributions)
  if (!Array.isArray(value.evidenceDecisions) || canonical(value.evidenceDecisions) !== canonical(expected.decisions)) fail('INVALID_EVIDENCE_CASE', 'Decisiones de evidencia no derivables.')
  if (contributions.length === 0) {
    if (!['preparing', 'ready'].includes(value.state) || value.evidenceDecisions.length !== 0) fail('INVALID_EVIDENCE_CASE', 'Estado sin contribuciones invalido.')
  } else if (value.state !== expected.state) fail('INVALID_EVIDENCE_CASE', 'Estado no corresponde al gate.')
  if (value.state === 'ready' && (receipts.length > 0 || contributions.length > 0)) fail('INVALID_EVIDENCE_CASE', 'Caso ready ya contiene resultados.')
  if (value.state === 'preparing' && (receipts.length > 0 || contributions.length > 0)) fail('INVALID_EVIDENCE_CASE', 'Caso preparing contiene resultados.')
  const pendingOperations = validatePending(value.pendingOperations, value.state)
  const expectedResponsible = ['preparing', 'ready'].includes(value.state) ? 'jefe' : expected.nextResponsible
  if (!NEXT_RESPONSIBLES.has(value.nextResponsible) || value.nextResponsible !== expectedResponsible) fail('INVALID_EVIDENCE_CASE', 'Responsable siguiente invalido.')
  if (expected.contradictionStatus === null) {
    if (value.contradictionStatus !== undefined) fail('INVALID_EVIDENCE_CASE', 'Contradiccion espuria.')
  } else if (value.contradictionStatus !== expected.contradictionStatus) fail('INVALID_EVIDENCE_CASE', 'Contradiccion no preservada.')
  if (value.lastErrorCode !== undefined && (!ERROR_CODES.has(value.lastErrorCode) || pendingOperations.length === 0)) fail('INVALID_EVIDENCE_CASE', 'Error durable no permitido.')
  if (value.lastErrorCode === 'MEMORY_NOT_CONFIGURED' || value.lastErrorCode === 'MEMORY_APPEND_FAILED' || value.lastErrorCode === 'INJECTED_MEMORY_FAILURE') {
    if (!pendingOperations.includes('memory_append')) fail('INVALID_EVIDENCE_CASE', 'Error de MEMORIA sin append pendiente.')
  }
  const memory = validateMemory(value.memory, { ...value, pendingOperations }, expected)
  return deepFreeze({
    schemaVersion: SCHEMA_VERSION,
    evidenceCaseId: value.evidenceCaseId,
    researchPlanId: value.researchPlanId,
    identity,
    projectId: value.projectId,
    discoveryId: value.discoveryId,
    intakeId: value.intakeId,
    objective,
    questions,
    state: value.state,
    revision: value.revision,
    requests,
    preparedRequestIds: [...value.preparedRequestIds],
    receipts,
    contributions,
    evidenceDecisions: clone(expected.decisions),
    pendingOperations,
    memory,
    nextResponsible: value.nextResponsible,
    createdAt,
    updatedAt,
    ...(value.lastErrorCode !== undefined ? { lastErrorCode: value.lastErrorCode } : {}),
    ...(value.contradictionStatus !== undefined ? { contradictionStatus: value.contradictionStatus } : {}),
  })
}

function immutableView(value) {
  return Object.fromEntries(IMMUTABLE_FIELDS.map((field) => [field, value[field]]))
}

function appendOnly(prior, next, key, code) {
  const nextByKey = new Map(next.map((item) => [typeof item === 'string' ? item : item[key], item]))
  for (const item of prior) {
    const id = typeof item === 'string' ? item : item[key]
    const replay = nextByKey.get(id)
    if (replay === undefined || canonical(replay) !== canonical(item)) fail(code, 'Registro durable append-only incompatible.')
  }
}

function assertCompatible(prior, next) {
  if (canonical(immutableView(prior)) !== canonical(immutableView(next))) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Identidad durable del caso incompatible.')
  if (!STATE_TRANSITIONS[prior.state]?.has(next.state) || Date.parse(next.updatedAt) < Date.parse(prior.updatedAt)) fail('STALE_EVIDENCE_CASE', 'Caso de evidencia obsoleto.')
  appendOnly(prior.preparedRequestIds, next.preparedRequestIds, null, 'INCOMPATIBLE_EVIDENCE_CASE')
  appendOnly(prior.receipts, next.receipts, 'receiptId', 'INCOMPATIBLE_EVIDENCE_CASE')
  appendOnly(prior.contributions, next.contributions, 'receiptId', 'INCOMPATIBLE_EVIDENCE_CASE')
  const memoryTransitions = { not_applicable: new Set(['not_applicable', 'pending', 'appended']), pending: new Set(['pending', 'appended']), appended: new Set(['appended']) }
  if (!memoryTransitions[prior.memory.status]?.has(next.memory.status) || (prior.memory.status === 'appended' && canonical(prior.memory) !== canonical(next.memory))) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Estado durable de MEMORIA incompatible.')
}

function validateProjectId(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !CORRELATION_ID.test(value)) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
  return value
}

function createEvidenceCasePersistence(options = {}) {
  if (!plainObject(options) || Object.keys(options).some((field) => !['root', 'failureInjection'].includes(field))) fail('INVALID_OPTIONS', 'Persistencia de evidencia invalida.')
  const { root, failureInjection = null } = options
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Caso de evidencia invalido.')
  if (failureInjection !== null && failureInjection !== 'before_rename') fail('INVALID_FAILURE_INJECTION', 'Fallo durable invalido.')
  const authorityRoot = resolvePhysicalRoot(root)
  const rootLockKey = physicalRootKey(authorityRoot)
  const caseFile = (id) => path.join(authorityRoot, `${id}.json`)
  const indexFile = path.join(authorityRoot, 'evidence-case-index.json')
  const isCaseFile = (name) => /^evidence-case-[a-f0-9]{32}\.json$/u.test(name)

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

  async function read(evidenceCaseId) {
    if (typeof evidenceCaseId !== 'string' || !CASE_ID.test(evidenceCaseId)) fail('INVALID_EVIDENCE_CASE_ID', 'Caso de evidencia invalido.')
    try {
      const value = validateRecord(JSON.parse(await fs.promises.readFile(caseFile(evidenceCaseId), 'utf8')))
      if (value.evidenceCaseId !== evidenceCaseId) fail('CORRUPT_EVIDENCE_CASE', 'Caso de evidencia corrupto.')
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return null
      if (error.code === 'CORRUPT_EVIDENCE_CASE') throw error
      fail('CORRUPT_EVIDENCE_CASE', 'Caso de evidencia corrupto.')
    }
  }

  async function write(record) {
    if (!plainObject(record) || typeof record.evidenceCaseId !== 'string' || !CASE_ID.test(record.evidenceCaseId)) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
    return locked(rootLockKey, async () => {
      const prior = await read(record.evidenceCaseId)
      if (prior && record.researchPlanId !== prior.researchPlanId) fail('EVIDENCE_CASE_ID_COLLISION', 'Colision de caso de evidencia.')
      if (prior && canonical(immutableView(prior)) !== canonical(immutableView(record))) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Caso de evidencia incompatible.')
      let clean
      try { clean = validateRecord({ ...record, revision: Number.isSafeInteger(record.revision) ? record.revision : 0 }) } catch (error) {
        if (error.code === 'INVALID_EVIDENCE_CASE') throw error
        fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
      }
      if (prior && canonical(prior) === canonical(clean)) return { record: prior, idempotent: true }
      if (prior && clean.revision !== prior.revision + 1) fail('STALE_EVIDENCE_CASE', 'Caso de evidencia obsoleto.')
      if (!prior && clean.revision !== 0) fail('STALE_EVIDENCE_CASE', 'Caso de evidencia obsoleto.')
      if (!prior && (clean.state !== 'preparing' || clean.preparedRequestIds.length !== 0)) fail('INVALID_EVIDENCE_CASE', 'El caso inicial debe comenzar en preparing.')
      if (prior) assertCompatible(prior, clean)
      const saved = validateRecord(await atomic(caseFile(clean.evidenceCaseId), clean))
      return { record: saved, idempotent: false }
    })
  }

  async function update(evidenceCaseId, updater) {
    if (typeof evidenceCaseId !== 'string' || !CASE_ID.test(evidenceCaseId) || typeof updater !== 'function') fail('INVALID_EVIDENCE_CASE_UPDATE', 'Actualizacion de caso invalida.')
    return locked(rootLockKey, async () => {
      const prior = await read(evidenceCaseId)
      if (!prior) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
      const proposed = updater(clone(prior))
      if (!plainObject(proposed) || proposed.evidenceCaseId !== evidenceCaseId || canonical(immutableView(prior)) !== canonical(immutableView(proposed))) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Caso de evidencia incompatible.')
      if (proposed.revision !== prior.revision) fail('STALE_EVIDENCE_CASE', 'Caso de evidencia obsoleto.')
      const comparable = validateRecord(proposed)
      if (canonical(prior) === canonical(comparable)) return { record: prior, idempotent: true }
      const next = validateRecord({ ...clone(comparable), revision: prior.revision + 1 })
      assertCompatible(prior, next)
      const saved = validateRecord(await atomic(caseFile(evidenceCaseId), next))
      return { record: saved, idempotent: false }
    })
  }

  async function scanDetailed(projectId) {
    const safeProjectId = validateProjectId(projectId)
    try {
      const names = (await fs.promises.readdir(authorityRoot)).filter(isCaseFile).sort()
      const records = []
      const corruptions = []
      for (const name of names) {
        const evidenceCaseId = name.slice(0, -5)
        try {
          const record = await read(evidenceCaseId)
          if (record && (safeProjectId === null || record.projectId === safeProjectId)) records.push(record)
        } catch (error) {
          if (error.code !== 'CORRUPT_EVIDENCE_CASE') throw error
          corruptions.push({ evidenceCaseId, code: 'CORRUPT_EVIDENCE_CASE' })
        }
      }
      records.sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.evidenceCaseId.localeCompare(right.evidenceCaseId))
      corruptions.sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId))
      return deepFreeze({ records, corruptions })
    } catch (error) {
      if (error.code === 'ENOENT') return deepFreeze({ records: [], corruptions: [] })
      throw error
    }
  }

  function boundedDetail(detail, limit) {
    if (limit === undefined || limit === null) return detail
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) fail('INVALID_LIMIT', 'Limite invalido.')
    return deepFreeze({ records: detail.records.slice(0, limit), corruptions: detail.corruptions.slice(0, limit) })
  }

  async function listDetailed(projectId, limit) {
    return boundedDetail(await scanDetailed(projectId), limit)
  }

  async function list(projectId, limit) {
    return (await listDetailed(projectId, limit)).records
  }

  async function listAll(projectId) {
    return (await scanDetailed(projectId)).records
  }

  async function findByRequestId(researchRequestId) {
    if (typeof researchRequestId !== 'string' || !REQUEST_ID.test(researchRequestId)) return null
    return (await scanDetailed(undefined)).records.find((item) => item.requests.some((request) => request.researchRequestId === researchRequestId)) || null
  }

  async function withExactSnapshots(projectId, snapshots, work) {
    const fields = ['evidenceCaseId', 'revision', 'state', 'fingerprint']
    if (validateProjectId(projectId) === null || !Array.isArray(snapshots) || snapshots.length > 50 || typeof work !== 'function') fail('INVALID_EVIDENCE_CASE_SNAPSHOTS', 'Snapshots de evidencia invalidos.')
    const seen = new Set()
    const exact = snapshots.map((snapshot) => {
      if (!plainObject(snapshot) || canonical(Object.keys(snapshot).sort()) !== canonical(fields.sort()) || !CASE_ID.test(snapshot.evidenceCaseId) || seen.has(snapshot.evidenceCaseId)) fail('INVALID_EVIDENCE_CASE_SNAPSHOTS', 'Snapshots de evidencia invalidos.')
      const missing = snapshot.revision === null && snapshot.state === null && snapshot.fingerprint === null
      const present = Number.isSafeInteger(snapshot.revision) && snapshot.revision >= 0 && CASE_STATES.includes(snapshot.state) && typeof snapshot.fingerprint === 'string' && /^[a-f0-9]{64}$/u.test(snapshot.fingerprint)
      if (!missing && !present) fail('INVALID_EVIDENCE_CASE_SNAPSHOTS', 'Snapshots de evidencia invalidos.')
      seen.add(snapshot.evidenceCaseId)
      return clone(snapshot)
    }).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId))
    if (exact.length === 0) return work(deepFreeze([]))
    return locked(rootLockKey, async () => {
      const captured = []
      for (const snapshot of exact) {
        const record = await read(snapshot.evidenceCaseId)
        const missing = snapshot.revision === null
        if (missing) {
          if (record) fail('STALE_EVIDENCE_CASE_SNAPSHOT', 'El caso ausente ya no coincide con el snapshot.')
          captured.push({ evidenceCaseId: snapshot.evidenceCaseId, record: null })
          continue
        }
        const current = record && { evidenceCaseId: record.evidenceCaseId, revision: record.revision, state: record.state, fingerprint: digest(record) }
        if (!record || record.projectId !== projectId || canonical(current) !== canonical(snapshot)) fail('STALE_EVIDENCE_CASE_SNAPSHOT', 'El caso ya no coincide con el snapshot.')
        captured.push({ evidenceCaseId: snapshot.evidenceCaseId, record })
      }
      return work(deepFreeze(clone(captured)))
    })
  }

  async function rebuildIndex() {
    return locked(rootLockKey, async () => {
      const detail = await scanDetailed(undefined)
      const index = deepFreeze({
        schemaVersion: 'jefe-supervised-research-evidence-case-index/v1',
        evidenceCaseIds: detail.records.map((item) => item.evidenceCaseId).sort(),
        projectAssociations: detail.records.map((item) => ({ evidenceCaseId: item.evidenceCaseId, projectId: item.projectId })).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId)),
        requestAssociations: detail.records.flatMap((item) => item.requests.map((request) => ({ evidenceCaseId: item.evidenceCaseId, researchRequestId: request.researchRequestId }))).sort((left, right) => left.researchRequestId.localeCompare(right.researchRequestId)),
        corruptions: detail.corruptions.map(clone),
        rebuiltAt: null,
      })
      let prior = null
      let recovered = false
      try { prior = JSON.parse(await fs.promises.readFile(indexFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') recovered = true }
      if (prior && canonical(prior) === canonical(index)) return { index: deepFreeze(clone(prior)), idempotent: true, recovered: false }
      const saved = deepFreeze(clone(await atomic(indexFile, index)))
      return { index: saved, idempotent: false, recovered }
    })
  }

  return Object.freeze({ authorityRoot, read, write, create: write, update, list, listDetailed, listAll, findByRequestId, withExactSnapshots, rebuildIndex })
}

module.exports = { CASE_STATES, EvidenceCasePersistenceError, createEvidenceCasePersistence }
