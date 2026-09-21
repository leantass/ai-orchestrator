const DEFAULT_SEMANTIC_OPERATION_COUNT = 3
const DEFAULT_MAX_SEMANTIC_GENERATION_CALLS = 6
const DEFAULT_RUN_TIMEOUT_MARGIN_MS = 60000

function positiveInteger(value, fallback) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

function deriveSemanticRunTimeoutMs({ maxCalls = DEFAULT_MAX_SEMANTIC_GENERATION_CALLS, providerOperationTimeoutMs, marginMs = DEFAULT_RUN_TIMEOUT_MARGIN_MS } = {}) {
  const calls = positiveInteger(maxCalls, DEFAULT_MAX_SEMANTIC_GENERATION_CALLS)
  const operationTimeout = positiveInteger(providerOperationTimeoutMs, 300000)
  const margin = Math.max(0, Number.isFinite(marginMs) ? Math.floor(marginMs) : DEFAULT_RUN_TIMEOUT_MARGIN_MS)
  return calls * operationTimeout + margin
}

function operationForPhase(phase) {
  return ({ BUSINESS_UNDERSTANDING_READY: 'business_understanding', CONTENT_PLAN_READY: 'content_plan', EXPERIENCE_PLAN_READY: 'experience_plan' })[phase] || null
}

module.exports = { DEFAULT_SEMANTIC_OPERATION_COUNT, DEFAULT_MAX_SEMANTIC_GENERATION_CALLS, DEFAULT_RUN_TIMEOUT_MARGIN_MS, deriveSemanticRunTimeoutMs, operationForPhase }
