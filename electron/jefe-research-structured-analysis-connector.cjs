const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { safeResearchText } = require('./jefe-research-contract.cjs')
const { LIMITS, budget: validateBudget } = require('./jefe-research-provider-policy.cjs')

const CONNECTOR_INPUT_FIELDS = Object.freeze([
  'schemaVersion',
  'researchRequestId',
  'providerType',
  'objective',
  'questions',
  'budget',
  'needsCorroboration',
])
const EXECUTION_FIELDS = Object.freeze([
  'connectorAttemptId',
  'connectorId',
  'researchRequestId',
  'providerType',
  'operation',
  'input',
])
const RESEARCH_REQUEST_ID = /^research-[a-f0-9]{32}$/u
const CONNECTOR_ATTEMPT_ID = /^connector-attempt-[a-f0-9]{32}$/u
const URL_TEXT = /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)/iu

class StructuredAnalysisConnectorError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new StructuredAnalysisConnectorError(code, message)
}

function deepFreeze(value) {
  if (!value || !['object', 'function'].includes(typeof value) || Object.isFrozen(value)) return value
  for (const item of Object.values(value)) deepFreeze(item)
  return Object.freeze(value)
}

function isPlainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false
  return Object.values(Object.getOwnPropertyDescriptors(value)).every((descriptor) => Object.hasOwn(descriptor, 'value') && descriptor.enumerable)
}

function hasExactFields(value, fields) {
  return isPlainRecord(value) && canonical(Object.keys(value).sort()) === canonical([...fields].sort())
}

function safeInputText(value) {
  let clean
  try {
    clean = safeResearchText(value)
  } catch {
    fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')
  }
  if (URL_TEXT.test(clean)) fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')
  return clean
}

function validateConnectorInput(raw) {
  if (!hasExactFields(raw, CONNECTOR_INPUT_FIELDS)) fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')
  if (raw.schemaVersion !== 'jefe-research-connector-input/v1' || !RESEARCH_REQUEST_ID.test(raw.researchRequestId) || raw.providerType !== 'structured_analysis' || typeof raw.needsCorroboration !== 'boolean') fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')
  if (!Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 12) fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')

  let cleanBudget
  try {
    cleanBudget = validateBudget(raw.budget)
  } catch {
    fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')
  }
  if (!hasExactFields(raw.budget, Object.keys(LIMITS)) || canonical(raw.budget) !== canonical(cleanBudget)) fail('INVALID_STRUCTURED_ANALYSIS_INPUT', 'Entrada de analisis estructurado invalida.')

  return deepFreeze({
    schemaVersion: raw.schemaVersion,
    researchRequestId: raw.researchRequestId,
    providerType: raw.providerType,
    objective: safeInputText(raw.objective),
    questions: raw.questions.map(safeInputText),
    budget: cleanBudget,
    needsCorroboration: raw.needsCorroboration,
  })
}

function normalizedQuestion(value) {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('es')
}

function boundedReport(input) {
  const full = canonical({
    schemaVersion: 'jefe-structured-analysis/v1',
    analysis: 'deterministic_local_structure',
    objective: input.objective,
    questionCount: input.questions.length,
    uniqueQuestionCount: new Set(input.questions.map(normalizedQuestion)).size,
    evidenceStatus: 'independent_evidence_required',
  })
  const compact = canonical({ evidenceStatus: 'independent_evidence_required', questionCount: input.questions.length })
  const maximumBytes = Math.min(input.budget.maxBytesPerReceipt, input.budget.maxTotalBytes)
  return [full, compact, '{}', '0'].find((value) => Buffer.byteLength(value, 'utf8') <= maximumBytes)
}

function structuredAnalysisCandidate(rawInput) {
  const input = validateConnectorInput(rawInput)
  const excerpt = boundedReport(input)
  if (excerpt === undefined) fail('INVALID_STRUCTURED_ANALYSIS_BUDGET', 'Presupuesto de analisis estructurado invalido.')
  const bytes = Buffer.byteLength(excerpt, 'utf8')
  return deepFreeze({
    status: 'partial',
    mimeType: 'application/json',
    bytes,
    contentHash: crypto.createHash('sha256').update(excerpt).digest('hex'),
    excerpt,
    redirects: [],
    codes: ['PARTIAL_RESULT'],
    consumed: {
      queries: 0,
      sources: 0,
      bytes,
      durationMs: 0,
      redirects: 0,
      attempts: 1,
    },
    claim: input.objective,
  })
}

function validateExecution(value) {
  if (!hasExactFields(value, EXECUTION_FIELDS) || !CONNECTOR_ATTEMPT_ID.test(value.connectorAttemptId) || value.connectorId !== 'structured-analysis-local' || !RESEARCH_REQUEST_ID.test(value.researchRequestId) || value.providerType !== 'structured_analysis' || value.operation !== 'analyze') fail('INVALID_STRUCTURED_ANALYSIS_EXECUTION', 'Ejecucion de analisis estructurado invalida.')
  const input = validateConnectorInput(value.input)
  if (input.researchRequestId !== value.researchRequestId || input.providerType !== value.providerType) fail('INVALID_STRUCTURED_ANALYSIS_EXECUTION', 'Ejecucion de analisis estructurado invalida.')
  return input
}

function createStructuredAnalysisConnector(options = {}) {
  if (!hasExactFields(options, [])) fail('INVALID_STRUCTURED_ANALYSIS_CONNECTOR', 'Connector de analisis estructurado invalido.')

  async function execute(execution) {
    const input = validateExecution(execution)
    return deepFreeze({ candidate: structuredAnalysisCandidate(input) })
  }

  return deepFreeze({ kind: 'controlled_local', execute })
}

module.exports = {
  StructuredAnalysisConnectorError,
  validateConnectorInput,
  structuredAnalysisCandidate,
  createStructuredAnalysisConnector,
}
