const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { select, safeUrl } = require('./jefe-research-provider-policy.cjs')

const ID = /^[a-z][a-z0-9-]{2,80}$/u
const MIME = Object.freeze(['text/plain', 'text/html', 'application/json'])
const RECEIPT_STATES = Object.freeze(['not_executed', 'received', 'rejected', 'partial', 'failed', 'policy_blocked'])
const METHODS = Object.freeze(['injected_controlled_adapter', 'controlled_adapter'])
const CONSUMED_FIELDS = Object.freeze(['queries', 'sources', 'bytes', 'durationMs', 'redirects', 'attempts'])
const CONSUMED_LIMITS = Object.freeze({ queries: 'maxQueries', sources: 'maxSources', bytes: 'maxTotalBytes', durationMs: 'maxDurationMs', redirects: 'maxRedirects', attempts: 'maxAttempts' })
const RECEIPT_CODES = new Set(['CONTENT_TRUNCATED', 'SOURCE_UNAVAILABLE', 'RATE_LIMITED', 'TIMEOUT', 'POLICY_BLOCKED', 'NOT_EXECUTED', 'PARTIAL_RESULT'])
const PROVIDER_OPERATIONS = Object.freeze({ manual_reference: Object.freeze(['reference']), metasearch: Object.freeze(['search']), automated_browser: Object.freeze(['browse']), crawler: Object.freeze(['extract']), local_model: Object.freeze(['analyze']), structured_analysis: Object.freeze(['analyze']), corroboration: Object.freeze(['corroborate']) })
const SENSITIVE_TEXT = /password|passphrase|token|api.?key|secret|cookie|authorization|bearer|credential|private.?key|stack|shell|command|powershell|cmd\.exe|child_process/iu
const LOCAL_PATH = /(?:[a-z]:[\\/]|\\\\[^\s]+|(?:^|[\s"'(\[{=])~?[\\/](?![\\/])[^\s]+|(?:^|[\s"'(\[{=])\.\.[\\/])/iu
const INVISIBLE_TEXT = /[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u

class ResearchContractError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new ResearchContractError(code, message)
}

function hash(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function validTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function safeResearchText(value, { required = true, max = 500 } = {}) {
  if ((value === undefined || value === null) && !required) return null
  if (typeof value !== 'string') fail('INVALID_TEXT', 'Texto de investigacion invalido.')
  const normalized = value.normalize('NFKC').trim()
  if (!normalized || normalized.length > max || /[\x00-\x1f\x7f]/u.test(normalized) || INVISIBLE_TEXT.test(normalized) || /file:\/\//iu.test(normalized) || SENSITIVE_TEXT.test(normalized) || LOCAL_PATH.test(normalized)) fail('INVALID_TEXT', 'Texto de investigacion invalido.')
  return normalized
}

function request(raw, now, trusted = {}) {
  const allowed = ['discoveryId', 'intakeId', 'projectId', 'packageId', 'handoffId', 'role', 'objective', 'questions', 'providerType', 'purpose', 'budget', 'references', 'needsCorroboration']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some((key) => !allowed.includes(key)) || !validTimestamp(now)) fail('INVALID_RESEARCH_REQUEST', 'Solicitud de investigacion invalida.')
  for (const key of ['discoveryId', 'intakeId', 'projectId', 'packageId', 'handoffId']) if (typeof raw[key] !== 'string' || !ID.test(raw[key])) fail('INVALID_CORRELATION', 'Correlacion invalida.')
  if (!Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 12) fail('INVALID_QUESTIONS', 'Preguntas invalidas.')
  const policy = select({ providerType: raw.providerType, purpose: raw.purpose, role: raw.role, budget: raw.budget, references: raw.references }, trusted)
  const record = {
    schemaVersion: 'jefe-research-request/v1',
    discoveryId: raw.discoveryId,
    intakeId: raw.intakeId,
    projectId: raw.projectId,
    packageId: raw.packageId,
    handoffId: raw.handoffId,
    role: raw.role,
    objective: safeResearchText(raw.objective),
    questions: raw.questions.map((item) => safeResearchText(item)),
    providerType: raw.providerType,
    purpose: raw.purpose,
    budget: policy.budget,
    references: policy.references,
    needsCorroboration: raw.needsCorroboration !== false,
    state: policy.status,
    provenance: 'supervised_research_request',
    actor: raw.role,
    authority: 'agent_inference',
    createdAt: now,
  }
  record.researchRequestId = `research-${hash(record).slice(0, 32)}`
  return record
}

function consumed(value, budget) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !CONSUMED_FIELDS.includes(key))) fail('INVALID_RECEIPT', 'Receipt invalido.')
  const output = {}
  for (const [key, item] of Object.entries(value)) {
    const cap = budget?.[CONSUMED_LIMITS[key]]
    if (!Number.isSafeInteger(item) || item < 0 || !Number.isSafeInteger(cap) || item > cap) fail('INVALID_RECEIPT', 'Receipt invalido.')
    output[key] = item
  }
  return output
}

function receipt(raw, requestRecord, now) {
  const allowed = ['researchRequestId', 'providerType', 'operation', 'status', 'url', 'mimeType', 'bytes', 'contentHash', 'excerpt', 'method', 'redirects', 'codes', 'consumed']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some((key) => !allowed.includes(key)) || !requestRecord || !validTimestamp(now)) fail('INVALID_RECEIPT', 'Receipt invalido.')
  if (raw.researchRequestId !== requestRecord.researchRequestId || raw.providerType !== requestRecord.providerType || !RECEIPT_STATES.includes(raw.status) || !PROVIDER_OPERATIONS[requestRecord.providerType]?.includes(raw.operation)) fail('INVALID_RECEIPT_CORRELATION', 'Receipt no correlacionado.')
  if (raw.mimeType !== undefined && !MIME.includes(raw.mimeType)) fail('INVALID_RECEIPT', 'Receipt invalido.')
  if (raw.bytes !== undefined && (!Number.isSafeInteger(raw.bytes) || raw.bytes < 0 || raw.bytes > requestRecord.budget.maxBytesPerReceipt)) fail('INVALID_RECEIPT', 'Receipt invalido.')
  if (raw.contentHash !== undefined && (typeof raw.contentHash !== 'string' || !/^[a-f0-9]{64}$/u.test(raw.contentHash))) fail('INVALID_RECEIPT', 'Receipt invalido.')
  if (raw.excerpt !== undefined) safeResearchText(raw.excerpt, { max: 2000 })
  if (raw.status === 'received' || raw.status === 'partial') {
    if (raw.mimeType === undefined || !Number.isSafeInteger(raw.bytes) || raw.bytes < 1 || raw.contentHash === undefined || raw.excerpt === undefined) fail('INVALID_RECEIPT', 'Receipt invalido.')
  }
  const url = raw.url === undefined ? null : safeUrl(raw.url)
  if (raw.redirects !== undefined && (!Array.isArray(raw.redirects) || raw.redirects.length > requestRecord.budget.maxRedirects || raw.redirects.some((item) => safeUrl(item) !== item))) fail('INVALID_RECEIPT', 'Receipt invalido.')
  if (raw.method !== undefined && !METHODS.includes(raw.method)) fail('INVALID_RECEIPT', 'Receipt invalido.')
  if (raw.codes !== undefined && (!Array.isArray(raw.codes) || raw.codes.length > 8 || raw.codes.some((item) => typeof item !== 'string' || !RECEIPT_CODES.has(item)))) fail('INVALID_RECEIPT', 'Receipt invalido.')
  return {
    schemaVersion: 'jefe-provider-receipt/v1',
    receiptId: `receipt-${hash({ requestId: requestRecord.researchRequestId, providerType: raw.providerType, contentHash: raw.contentHash || raw.status, operation: raw.operation }).slice(0, 32)}`,
    researchRequestId: raw.researchRequestId,
    providerType: raw.providerType,
    operation: raw.operation,
    status: raw.status,
    ...(url ? { url } : {}),
    ...(raw.mimeType ? { mimeType: raw.mimeType } : {}),
    ...(raw.bytes ? { bytes: raw.bytes } : {}),
    ...(raw.contentHash ? { contentHash: raw.contentHash } : {}),
    ...(raw.excerpt ? { excerpt: safeResearchText(raw.excerpt, { max: 2000 }) } : {}),
    method: raw.method || 'injected_controlled_adapter',
    redirects: raw.redirects || [],
    codes: raw.codes || [],
    consumed: consumed(raw.consumed, requestRecord.budget),
    classification: 'UNTRUSTED_EXTERNAL_CONTENT',
    receivedAt: now,
  }
}

module.exports = { MIME, RECEIPT_STATES, ResearchContractError, request, receipt, safeResearchText }
