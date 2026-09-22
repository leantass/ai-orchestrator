const DEFAULT_FOREGROUND_TIMEOUT_MS = 30000
const DEFAULT_RETRY_MAX = 1
const crypto = require('node:crypto')
const PROVIDER_ERROR_CATEGORIES = Object.freeze(['HTTP_ERROR', 'NETWORK_ERROR', 'FOREGROUND_TIMEOUT', 'BACKGROUND_DEADLINE_EXCEEDED', 'BACKGROUND_RESPONSE_FAILED', 'OUTPUT_BUDGET_EXHAUSTED', 'STRUCTURED_OUTPUT_INVALID', 'SEMANTIC_SCHEMA_INVALID', 'SEMANTIC_CONTRACT_INVALID', 'PROVIDER_CALL_BUDGET_EXHAUSTED', 'UNKNOWN_PROVIDER_ERROR'])
const TRANSIENT_UPSTREAM_CODES = new Set(['server_error'])
const OUTPUT_BUDGET_POLICY = Object.freeze({
  minimal_probe: Object.freeze({ initialOutputBudget: 128, retryOutputBudget: 256, maxRetries: 1 }),
  structured_probe: Object.freeze({ initialOutputBudget: 256, retryOutputBudget: 512, maxRetries: 1 }),
  business_understanding: Object.freeze({ initialOutputBudget: 16384, retryOutputBudget: 32768, maxRetries: 1 }),
  correction_plan: Object.freeze({ initialOutputBudget: 16384, retryOutputBudget: 32768, maxRetries: 1 }),
  content_plan: Object.freeze({ initialOutputBudget: 24576, retryOutputBudget: 49152, maxRetries: 1 }),
  experience_plan: Object.freeze({ initialOutputBudget: 16384, retryOutputBudget: 32768, maxRetries: 1 }),
})
const OUTPUT_BUDGETS = Object.freeze(Object.fromEntries(Object.entries(OUTPUT_BUDGET_POLICY).map(([key, value]) => [key, value.initialOutputBudget])))
function outputBudgetPolicy(operation) { return OUTPUT_BUDGET_POLICY[operation] || OUTPUT_BUDGET_POLICY.business_understanding }
const BACKGROUND_DEFAULTS = Object.freeze({ deadlineMs: 300000, initialDelayMs: 2000, intervalMs: 2500, maxPollRequests: 80, pollRetryMax: 2 })
const MAX_MODEL_OUTPUT_TOKENS = 65536

class ProviderCallBudget {
  constructor(maxCalls = 3, runId = null) { this.runId = runId; this.maxCalls = maxCalls; this.callsUsed = 0; this.reservations = []; this.operationCounts = {}; this.queue = Promise.resolve() }
  get callsRemaining() { return Math.max(0, this.maxCalls - this.callsUsed) }
  get exhausted() { return this.callsUsed >= this.maxCalls }
  snapshot() { return { runId: this.runId, maxCalls: this.maxCalls, callsUsed: this.callsUsed, callsRemaining: this.callsRemaining, reservations: [...this.reservations], operationCounts: { ...this.operationCounts }, exhausted: this.exhausted } }
  async reserve(operation = 'semantic') {
    let allowed = false
    const previous = this.queue
    this.queue = previous.then(() => { if (this.callsUsed < this.maxCalls) { this.callsUsed += 1; this.operationCounts[operation] = (this.operationCounts[operation] || 0) + 1; this.reservations.push({ operation, callNumber: this.callsUsed }); allowed = true } })
    await this.queue
    return allowed
  }
}
class ProviderRunBudget extends ProviderCallBudget { constructor({ runId, maxCalls = 3 } = {}) { super(maxCalls, runId || `semantic-run-${Date.now()}`) } }

function providerConfig({ env = process.env } = {}) {
  return {
    model: env.AI_ORCHESTRATOR_SEMANTIC_MODEL?.trim() || env.AI_ORCHESTRATOR_BRAIN_OPENAI_MODEL?.trim() || 'gpt-5',
    baseUrl: env.AI_ORCHESTRATOR_SEMANTIC_BASE_URL?.trim() || env.AI_ORCHESTRATOR_BRAIN_OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1/responses',
    apiKey: env.OPENAI_API_KEY?.trim() || '',
    reasoningEffort: env.AI_ORCHESTRATOR_SEMANTIC_REASONING?.trim() || 'low',
    foregroundTimeoutMs: Math.max(5000, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_FOREGROUND_TIMEOUT_MS || String(DEFAULT_FOREGROUND_TIMEOUT_MS), 10) || DEFAULT_FOREGROUND_TIMEOUT_MS),
    retryMax: Math.min(DEFAULT_RETRY_MAX, Math.max(0, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_RETRY_MAX || String(DEFAULT_RETRY_MAX), 10) || DEFAULT_RETRY_MAX)),
    backgroundDeadlineMs: Math.max(1000, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_DEADLINE_MS || String(BACKGROUND_DEFAULTS.deadlineMs), 10) || BACKGROUND_DEFAULTS.deadlineMs),
    backgroundInitialDelayMs: Math.max(0, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INITIAL_DELAY_MS || String(BACKGROUND_DEFAULTS.initialDelayMs), 10) || 0),
    backgroundIntervalMs: Math.min(5000, Math.max(0, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INTERVAL_MS || String(BACKGROUND_DEFAULTS.intervalMs), 10) || 0)),
    backgroundMaxPollRequests: Math.max(1, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_MAX_POLLS || String(BACKGROUND_DEFAULTS.maxPollRequests), 10) || BACKGROUND_DEFAULTS.maxPollRequests),
    backgroundPollRetryMax: Math.max(0, Number.parseInt(env.AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_POLL_RETRY_MAX || String(BACKGROUND_DEFAULTS.pollRetryMax), 10) || 0),
    outputBudgets: OUTPUT_BUDGETS,
  }
}

function classifyError(error, { status = 0, timedOut = false } = {}) {
  if (timedOut) return 'ABORT_TIMEOUT'
  if (status === 429) return 'RATE_LIMIT'
  if (status >= 400) return 'HTTP_ERROR'
  if (error?.name === 'TypeError') return 'NETWORK_ERROR'
  return 'UNKNOWN'
}
function sanitizeProviderMessage(value) {
  return String(value || '').replace(/authorization\s*:\s*bearer\s+[^\s]+/giu, 'authorization: [redacted]').replace(/(?:api[_-]?key|token|secret)\s*[:=]\s*[^\s,;]+/giu, '$1=[redacted]').slice(0, 600)
}
function providerErrorEnvelope({ category = 'UNKNOWN_PROVIDER_ERROR', operation = 'semantic', executionMode = 'foreground', provider = 'openai-semantic', model = null, responseId = null, responseStatus = null, upstreamCode = null, upstreamMessage = null, httpStatus = null, incompleteReason = null, retryable = false, generationCallNumber = null, pollCount = 0 } = {}) {
  const safeCategory = PROVIDER_ERROR_CATEGORIES.includes(category) ? category : 'UNKNOWN_PROVIDER_ERROR'
  return Object.freeze({ category: safeCategory, operation, executionMode, provider, model, responseId, responseStatus, upstreamCode, upstreamMessage: sanitizeProviderMessage(upstreamMessage), httpStatus, incompleteReason, retryable: Boolean(retryable), generationCallNumber, pollCount, createdAt: new Date().toISOString() })
}
function responseFailure({ payload, operation, executionMode, model, generationCallNumber, pollCount = 0 } = {}) {
  const code = payload?.error?.code || null
  return providerErrorEnvelope({ category: executionMode === 'background' ? 'BACKGROUND_RESPONSE_FAILED' : 'UNKNOWN_PROVIDER_ERROR', operation, executionMode, model, responseId: payload?.id || null, responseStatus: payload?.status || 'failed', upstreamCode: code, upstreamMessage: payload?.error?.message || null, retryable: TRANSIENT_UPSTREAM_CODES.has(code), generationCallNumber, pollCount })
}

function safeRequestSummary({ requestStartedAt, firstResponseAt, completedAt, status = 0, requestId = null, errorCategory = null, attempts = 0 }) {
  return { requestStartedAt, firstResponseAt, completedAt, durationMs: completedAt - requestStartedAt, status, requestId, errorCategory, attempts }
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of Array.isArray(payload?.output) ? payload.output : []) for (const part of Array.isArray(item?.content) ? item.content : []) if (typeof part?.text === 'string') return part.text
  return ''
}
function parseProviderPayload(text) { try { return JSON.parse(text) } catch { return null } }
function safeUsage(usage) { if (!usage || typeof usage !== 'object') return null; return Object.fromEntries(['input_tokens', 'output_tokens', 'reasoning_tokens', 'total_tokens'].filter((key) => Number.isFinite(usage[key])).map((key) => [key, usage[key]])) }
function invalidStructuredSchema(path, message) { throw Object.assign(new Error(`Invalid provider structured output schema at ${path}: ${message}`), { code: 'INVALID_PROVIDER_STRUCTURED_OUTPUT_SCHEMA', path }) }
function validateSchemaNode(node, path = '$') {
  if (!node || typeof node !== 'object' || Array.isArray(node)) invalidStructuredSchema(path, 'schema node must be an object')
  if (node.type === 'object') {
    const properties = node.properties || {}
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) invalidStructuredSchema(`${path}.properties`, 'properties must be an object')
    const required = node.required
    if (!Array.isArray(required)) invalidStructuredSchema(`${path}.required`, 'required must be an array')
    const propertyNames = Object.keys(properties)
    const requiredSet = new Set(required)
    if (requiredSet.size !== required.length) invalidStructuredSchema(`${path}.required`, 'required contains duplicates')
    for (const name of propertyNames) if (!requiredSet.has(name)) invalidStructuredSchema(`${path}.required`, `property ${name} is not required`)
    for (const name of required) if (!Object.hasOwn(properties, name)) invalidStructuredSchema(`${path}.required`, `required property ${name} is not declared`)
    for (const [name, child] of Object.entries(properties)) validateSchemaNode(child, `${path}.properties.${name}`)
  } else if (node.type === 'array') {
    if (!node.items) invalidStructuredSchema(`${path}.items`, 'array items are required')
    validateSchemaNode(node.items, `${path}.items`)
  }
  return node
}
function validateStructuredOutputSchema(schema) {
  if (!schema || typeof schema !== 'object' || typeof schema.name !== 'string' || !schema.schema) invalidStructuredSchema('$', 'name and schema are required')
  validateSchemaNode(schema.schema)
  return schema
}

function createOpenAISemanticProvider({ env = process.env, fetchImpl = fetch, now = Date.now, sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), callBudget = null } = {}) {
  const config = providerConfig({ env })
  if (Object.values(OUTPUT_BUDGET_POLICY).some((policy) => policy.retryOutputBudget > MAX_MODEL_OUTPUT_TOKENS || policy.initialOutputBudget >= policy.retryOutputBudget)) throw new Error('INVALID_OUTPUT_BUDGET_POLICY')
  const transportStats = { generationRequests: 0, pollRequests: 0, cancelRequests: 0, totalHttpRequests: 0 }
  const transport = (kind) => { transportStats[`${kind}Requests`] += 1; transportStats.totalHttpRequests += 1 }
  return Object.freeze({
    providerId: 'openai-semantic',
    model: config.model,
    enabled: env.AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED === 'true' || env.AI_ORCHESTRATOR_BRAIN_PROVIDER?.trim() === 'openai',
    credentialAvailable: Boolean(config.apiKey),
    transportStats,
    async request({ input, schema = null, model = config.model, maxOutputTokens = 600, reasoningEffort = config.reasoningEffort, timeoutMs = config.foregroundTimeoutMs, retries = config.retryMax, outputBudgetRetryMax = 0, operation = 'semantic', retryOutputBudget = null, executionMode = 'foreground' } = {}) {
      if (!config.apiKey) throw Object.assign(new Error('OPENAI_CREDENTIAL_MISSING'), { category: 'MODEL_ERROR' })
      if (schema) validateStructuredOutputSchema(schema)
      if (executionMode === 'background') return this.requestBackground({ input, schema, model, maxOutputTokens, reasoningEffort, outputBudgetRetryMax, operation, retryOutputBudget })
      let attempt = 0; let outputBudgetRetry = 0; let currentMaxOutputTokens = maxOutputTokens; const budgets = []
      while (true) {
        if (callBudget && !(await callBudget.reserve(operation))) return { ok: false, status: 0, errorCategory: 'PROVIDER_CALL_BUDGET_EXHAUSTED', telemetry: { attempts: attempt, budgets, providerBudget: callBudget.snapshot?.() || null } }
        budgets.push(currentMaxOutputTokens)
        const requestBody = { model, input, max_output_tokens: currentMaxOutputTokens, store: false, reasoning: { effort: reasoningEffort } }
        if (schema) requestBody.text = { format: { type: 'json_schema', name: schema.name, strict: true, schema: schema.schema } }
        const requestStartedAt = now(); let firstResponseAt = null; let completedAt = null; let response; let responseText = ''
        const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
          response = await fetchImpl(config.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify(requestBody), signal: controller.signal })
          firstResponseAt = now(); responseText = await response.text(); completedAt = now()
          const requestId = response.headers?.get?.('x-request-id') || response.headers?.get?.('request-id') || null
          const telemetry = { ...safeRequestSummary({ requestStartedAt, firstResponseAt, completedAt, status: response.status, requestId, attempts: attempt + 1 }), maxOutputTokens: currentMaxOutputTokens }
          if (!response.ok) {
            let providerError = null
            try { providerError = JSON.parse(responseText)?.error || null } catch {}
            const retryable = response.status === 429 || response.status >= 500
            if (retryable && attempt < retries) { attempt += 1; continue }
            const errorEnvelope = providerErrorEnvelope({ category: 'HTTP_ERROR', operation, executionMode: 'foreground', model, upstreamCode: providerError?.code || null, upstreamMessage: providerError?.message || null, httpStatus: response.status, retryable, generationCallNumber: callBudget?.snapshot?.().callsUsed || null })
            return { ok: false, status: response.status, errorCategory: 'HTTP_ERROR', errorCode: providerError?.code || null, errorType: providerError?.type || null, errorParam: providerError?.param || null, errorEnvelope, telemetry }
          }
          let payload
          try { payload = JSON.parse(responseText) } catch { return { ok: false, status: response.status, errorCategory: 'SCHEMA_ERROR', telemetry } }
          const status = payload?.status || 'completed'
          if (status === 'incomplete') {
            const incompleteReason = payload?.incomplete_details?.reason || null
            if (incompleteReason === 'max_output_tokens' && outputBudgetRetry < outputBudgetRetryMax) { outputBudgetRetry += 1; currentMaxOutputTokens = retryOutputBudget || currentMaxOutputTokens * 2; continue }
            return { ok: false, status, incompleteReason, errorCategory: incompleteReason === 'max_output_tokens' ? 'OUTPUT_BUDGET_EXHAUSTED' : 'SCHEMA_ERROR', telemetry: { ...telemetry, budgets } }
          }
          if (status === 'failed' || status === 'cancelled') { const errorEnvelope = responseFailure({ payload, operation, executionMode: 'foreground', model, generationCallNumber: callBudget?.snapshot?.().callsUsed || null }); return { ok: false, status, errorCategory: 'MODEL_ERROR', errorEnvelope, telemetry } }
          if (payload?.incomplete_details) return { ok: false, status, errorCategory: 'OUTPUT_BUDGET_EXHAUSTED', errorEnvelope: providerErrorEnvelope({ category: 'OUTPUT_BUDGET_EXHAUSTED', operation, executionMode: 'foreground', model, responseId: payload?.id || null, responseStatus: status, incompleteReason: payload.incomplete_details.reason || null, generationCallNumber: callBudget?.snapshot?.().callsUsed || null }), telemetry }
          return { ok: true, status, text: extractResponseText(payload), payload, telemetry: { ...telemetry, budgets, usage: safeUsage(payload.usage) } }
        } catch (error) {
          completedAt = now(); const timedOut = error?.name === 'AbortError'; const category = classifyError(error, { timedOut }); const telemetry = safeRequestSummary({ requestStartedAt, firstResponseAt, completedAt, errorCategory: category, attempts: attempt + 1 })
          if ((category === 'ABORT_TIMEOUT' || category === 'NETWORK_ERROR') && attempt < retries) { attempt += 1; continue }
          return { ok: false, status: 0, errorCategory: category, errorEnvelope: providerErrorEnvelope({ category: category === 'ABORT_TIMEOUT' ? 'FOREGROUND_TIMEOUT' : category === 'NETWORK_ERROR' ? 'NETWORK_ERROR' : 'UNKNOWN_PROVIDER_ERROR', operation, executionMode: 'foreground', model, retryable: category === 'NETWORK_ERROR', generationCallNumber: callBudget?.snapshot?.().callsUsed || null }), telemetry }
        } finally { clearTimeout(timer) }
      }
    },
    async requestBackground({ input, schema = null, model = config.model, maxOutputTokens = 600, reasoningEffort = config.reasoningEffort, outputBudgetRetryMax = 0, operation = 'semantic', retryOutputBudget = null } = {}) {
      let outputBudgetRetry = 0; let currentMaxOutputTokens = maxOutputTokens
      while (true) {
        if (callBudget && !(await callBudget.reserve(operation))) return { ok: false, status: 0, errorCategory: 'PROVIDER_CALL_BUDGET_EXHAUSTED', telemetry: { executionMode: 'background', providerBudget: callBudget.snapshot?.() || null, transportStats } }
        const startedAt = now(); const requestBody = { model, input, max_output_tokens: currentMaxOutputTokens, background: true, store: false, reasoning: { effort: reasoningEffort } }
        if (schema) requestBody.text = { format: { type: 'json_schema', name: schema.name, strict: true, schema: schema.schema } }
        transport('generation')
        let response
        try { response = await fetchImpl(config.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify(requestBody) }) } catch (error) { const category = classifyError(error); return { ok: false, status: 0, errorCategory: category, errorEnvelope: providerErrorEnvelope({ category: category === 'NETWORK_ERROR' ? 'NETWORK_ERROR' : 'UNKNOWN_PROVIDER_ERROR', operation, executionMode: 'background', model, retryable: category === 'NETWORK_ERROR', generationCallNumber: callBudget?.snapshot?.().callsUsed || null }), telemetry: { executionMode: 'background', durationMs: now() - startedAt, transportStats } } }
        const payload = parseProviderPayload(await response.text())
        if (!response.ok) return { ok: false, status: response.status, errorCategory: 'HTTP_ERROR', errorEnvelope: providerErrorEnvelope({ category: 'HTTP_ERROR', operation, executionMode: 'background', model, upstreamCode: payload?.error?.code || null, upstreamMessage: payload?.error?.message || null, httpStatus: response.status, retryable: response.status === 429 || response.status >= 500, generationCallNumber: callBudget?.snapshot?.().callsUsed || null }), telemetry: { executionMode: 'background', durationMs: now() - startedAt, transportStats } }
        const responseId = payload?.id
        if (!responseId) return { ok: false, status: response.status, errorCategory: 'SCHEMA_ERROR', telemetry: { executionMode: 'background', durationMs: now() - startedAt, transportStats } }
        let status = payload.status || 'queued'; let completed = payload; let pollRequests = 0; let lastPollError = null
        while (['queued', 'in_progress'].includes(status)) {
          if (now() - startedAt >= config.backgroundDeadlineMs || pollRequests >= config.backgroundMaxPollRequests) {
            let cancelStatus = 'not_attempted'; transport('cancel')
            try { const cancel = await fetchImpl(`${config.baseUrl}/${encodeURIComponent(responseId)}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` } }); cancelStatus = cancel.ok ? 'accepted' : `http_${cancel.status}` } catch { cancelStatus = 'failed' }
            return { ok: false, status, errorCategory: 'BACKGROUND_DEADLINE_EXCEEDED', errorEnvelope: providerErrorEnvelope({ category: 'BACKGROUND_DEADLINE_EXCEEDED', operation, executionMode: 'background', model, responseId, responseStatus: status, generationCallNumber: callBudget?.snapshot?.().callsUsed || null, pollCount: pollRequests }), responseId, telemetry: { executionMode: 'background', durationMs: now() - startedAt, pollRequests, cancelAttempted: true, cancelStatus, transportStats, lastPollError } }
          }
          await sleepImpl(pollRequests === 0 ? config.backgroundInitialDelayMs : config.backgroundIntervalMs)
          pollRequests += 1; transport('poll')
          try { const polled = await fetchImpl(`${config.baseUrl}/${encodeURIComponent(responseId)}`, { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` } }); if (!polled.ok) throw Object.assign(new Error('poll http'), { status: polled.status }); completed = parseProviderPayload(await polled.text()) || {}; status = completed.status || 'failed' } catch (error) { lastPollError = classifyError(error, { status: error.status || 0 }); if (pollRequests >= config.backgroundMaxPollRequests) return { ok: false, status, errorCategory: 'BACKGROUND_POLL_FAILED', responseId, telemetry: { executionMode: 'background', durationMs: now() - startedAt, pollRequests, transportStats, lastPollError } } }
        }
        const telemetry = { executionMode: 'background', durationMs: now() - startedAt, responseId, pollRequests, maxOutputTokens: currentMaxOutputTokens, usage: safeUsage(completed.usage), transportStats: { ...transportStats } }
        if (status === 'incomplete' && completed.incomplete_details?.reason === 'max_output_tokens' && outputBudgetRetry < outputBudgetRetryMax) { outputBudgetRetry += 1; currentMaxOutputTokens = retryOutputBudget || currentMaxOutputTokens * 2; continue }
        if (status === 'incomplete') return { ok: false, status, incompleteReason: completed.incomplete_details?.reason || null, errorCategory: completed.incomplete_details?.reason === 'max_output_tokens' ? 'OUTPUT_BUDGET_EXHAUSTED' : 'SCHEMA_ERROR', errorEnvelope: providerErrorEnvelope({ category: completed.incomplete_details?.reason === 'max_output_tokens' ? 'OUTPUT_BUDGET_EXHAUSTED' : 'SEMANTIC_SCHEMA_INVALID', operation, executionMode: 'background', model, responseId, responseStatus: status, incompleteReason: completed.incomplete_details?.reason || null, generationCallNumber: callBudget?.snapshot?.().callsUsed || null, pollCount: pollRequests }), responseId, telemetry }
        if (status === 'failed' || status === 'cancelled') { const errorEnvelope = responseFailure({ payload: completed, operation, executionMode: 'background', model, generationCallNumber: callBudget?.snapshot?.().callsUsed || null, pollCount: pollRequests }); return { ok: false, status, errorCategory: 'MODEL_ERROR', errorEnvelope, responseId, telemetry } }
        return { ok: true, status, text: extractResponseText(completed), payload: completed, responseId, telemetry }
      }
    },
    async decide({ operation = 'business_understanding', input, schema = SEMANTIC_SCHEMA, model = config.model, reasoningEffort = config.reasoningEffort, routing = null, sourceRefs = [], contentPlanRef = null, contentSectionCatalogHash = null, outputBudgetRetryMax = 1, executionMode = 'foreground' } = {}) {
      const policy = outputBudgetPolicy(operation)
      const result = await this.request({ input, schema, model, maxOutputTokens: policy.initialOutputBudget, reasoningEffort, outputBudgetRetryMax, operation, retryOutputBudget: policy.retryOutputBudget, executionMode })
      if (!result.ok) throw Object.assign(new Error(result.errorCategory || 'SEMANTIC_PROVIDER_FAILED'), { code: result.errorCategory || 'SEMANTIC_PROVIDER_FAILED', telemetry: result.telemetry, errorEnvelope: result.errorEnvelope || null })
      let decision
      try { decision = JSON.parse(result.text) } catch { throw Object.assign(new Error('SEMANTIC_STRUCTURED_OUTPUT_INVALID'), { code: 'SEMANTIC_STRUCTURED_OUTPUT_INVALID', errorEnvelope: providerErrorEnvelope({ category: 'STRUCTURED_OUTPUT_INVALID', operation, executionMode, model, responseId: result.responseId || null, responseStatus: result.status || 'completed', generationCallNumber: result.telemetry?.providerBudget?.callsUsed || null }) }) }
      return wrapSemanticDecision({ decision, operation, provider: { ...this, model, responseId: result.payload?.id || null }, input, routing, sourceRefs, contentPlanRef, contentSectionCatalogHash })
    },
  })
}

const MINIMAL_SCHEMA = Object.freeze({ name: 'semantic_minimal', schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean' }, label: { type: 'string' } }, required: ['ok', 'label'] } })
const SEMANTIC_SCHEMA = Object.freeze({ name: 'business_understanding_v2_probe', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['business-understanding-v2'] }, businessType: { type: 'string' }, businessModel: { type: 'string' }, audience: { type: 'string' }, primaryGoal: { type: 'string' }, customerNeeds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }, customerQuestions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }, trustDrivers: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }, conversionActions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 }, serviceModel: { type: 'string' }, domainVocabulary: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, tone: { type: 'string' } }, required: ['schemaVersion', 'businessType', 'businessModel', 'audience', 'primaryGoal', 'customerNeeds', 'customerQuestions', 'trustDrivers', 'conversionActions', 'serviceModel', 'domainVocabulary', 'tone'] } })
const CONTENT_PLAN_SCHEMA = Object.freeze({ name: 'content_plan_v2', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['content-plan-v2'] }, hero: { type: 'string' }, presentation: { type: 'string' }, services: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, trust: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, faq: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'] }, minItems: 4, maxItems: 8 }, contact: { type: 'string' }, contentPriorities: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, sections: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { id: { type: 'string', pattern: '^[a-z][a-z0-9-]{0,31}$' }, role: { type: 'string' }, label: { type: 'string' }, kind: { type: 'string' }, required: { type: 'boolean' }, contentRef: { type: 'string' }, aliases: { type: 'array', items: { type: 'string' } } }, required: ['id', 'role', 'label', 'kind', 'required', 'contentRef', 'aliases'] }, minItems: 1, maxItems: 8 } }, required: ['schemaVersion', 'hero', 'presentation', 'services', 'trust', 'faq', 'contact', 'contentPriorities', 'sections'] } })

function validateContentPlanDecision(value) {
  const faq = value?.faq
  if (!Array.isArray(faq) || faq.length < 4 || faq.length > 8 || faq.some((item) => !item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).sort().join('|') !== 'answer|question' || typeof item.question !== 'string' || !item.question.trim() || typeof item.answer !== 'string' || !item.answer.trim() || item.question.trim() === item.answer.trim() || /lorem ipsum|placeholder|\[\s*(?:texto|completar|todo)|\b(?:tbd|n\/a)\b/iu.test(item.answer))) throw Object.assign(new Error('ContentPlanV2 FAQ must contain separate, useful question and answer objects.'), { code: 'SEMANTIC_CONTENT_PLAN_FAQ_INVALID' })
  return value
}
const EXPERIENCE_PLAN_SCHEMA = Object.freeze({ name: 'experience_plan_v2', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['experience-plan-v2'] }, archetype: { type: 'string' }, sectionOrder: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 8 }, heroVariant: { type: 'string' }, sectionTreatments: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, contentDensity: { type: 'string' }, ctaPositions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 }, servicesTreatment: { type: 'string' }, trustTreatment: { type: 'string' }, faqTreatment: { type: 'string' }, conversionStrategy: { type: 'string' } }, required: ['schemaVersion', 'archetype', 'sectionOrder', 'heroVariant', 'sectionTreatments', 'contentDensity', 'ctaPositions', 'servicesTreatment', 'trustTreatment', 'faqTreatment', 'conversionStrategy'] } })

async function probeMinimal(provider) { return provider.request({ input: [{ role: 'user', content: [{ type: 'input_text', text: 'Respondé únicamente OK.' }] }], maxOutputTokens: OUTPUT_BUDGETS.minimal_probe, reasoningEffort: 'low' }) }
async function probeStructured(provider) { return provider.request({ input: [{ role: 'user', content: [{ type: 'input_text', text: 'Devolvé ok=true y label="ready".' }] }], schema: MINIMAL_SCHEMA, maxOutputTokens: OUTPUT_BUDGETS.structured_probe, reasoningEffort: 'low' }) }
async function probeSemantic(provider) { return provider.request({ input: [{ role: 'system', content: [{ type: 'input_text', text: 'Generá sólo el objeto semántico solicitado. No incluy provenance, provider, modelo, timestamps, hashes ni metadatos de ejecución.' }] }, { role: 'user', content: [{ type: 'input_text', text: 'Brief ficticio: estudio que ofrece clases particulares de idiomas por turnos.' }] }], schema: SEMANTIC_SCHEMA, maxOutputTokens: OUTPUT_BUDGETS.business_understanding, outputBudgetRetryMax: 1, reasoningEffort: 'low' }) }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function wrapSemanticDecision({ decision, operation = 'business-understanding', provider, input, schemaId = SEMANTIC_SCHEMA.name, routing = null, sourceRefs = [], contentPlanRef = null, contentSectionCatalogHash = null, createdAt = new Date().toISOString(), adapterVersion = 'semantic-adapter-v1' } = {}) {
  if (!decision || typeof decision !== 'object' || !provider?.providerId) throw new TypeError('semantic decision and provider are required')
  const provenance = { operation, provider: provider.providerId, model: provider.model, responseId: provider.responseId || null, requestHash: hash({ operation, input }), inputHash: hash(input), schemaId, schemaVersion: decision.schemaVersion || null, adapterVersion, createdAt, sourceRefs }
  if (contentPlanRef) provenance.contentPlanRef = contentPlanRef
  if (contentSectionCatalogHash) provenance.contentSectionCatalogHash = contentSectionCatalogHash
  if (routing) provenance.routing = routing
  const envelope = { decision, provenance }
  validateSemanticEnvelope(envelope, { input, provider, sourceRefs })
  return envelope
}
function validateSemanticEnvelope(envelope, { input, provider, sourceRefs } = {}) {
  const p = envelope?.provenance
  if (!envelope?.decision || !p) throw new TypeError('Invalid SemanticDecisionEnvelope')
  if (!p.operation || !p.provider || !p.model || !p.schemaId || !p.schemaVersion || !p.adapterVersion || !p.requestHash || !p.inputHash || !p.createdAt || Number.isNaN(Date.parse(p.createdAt))) throw new TypeError('Invalid provenance fields')
  if (!Array.isArray(p.sourceRefs) || !p.sourceRefs.every((ref) => typeof ref === 'string' && /^(?:synthetic-brief|semantic-source):/u.test(ref))) throw new TypeError('Invalid sourceRefs')
  if (p.responseId !== null && typeof p.responseId !== 'string') throw new TypeError('Invalid responseId')
  if (provider && (p.provider !== provider.providerId || p.model !== provider.model)) throw new TypeError('Provider provenance mismatch')
  if (input !== undefined && p.inputHash !== hash(input)) throw new TypeError('Invalid inputHash')
  if (sourceRefs && JSON.stringify(p.sourceRefs) !== JSON.stringify(sourceRefs)) throw new TypeError('Invalid sourceRefs')
  return envelope
}
function providerHealth(provider, probes = {}) { return { configured: true, credentialAvailable: provider.credentialAvailable, enabled: provider.enabled, model: provider.model, transport: probes.transport || 'not_probed', lastProbeStatus: probes.lastProbeStatus || 'not_run', lastProbeDurationMs: probes.lastProbeDurationMs ?? null, structuredOutputs: probes.structuredOutputs || 'not_run', backgroundSupported: false, readyForRealSemanticWork: probes.readyForRealSemanticWork === true } }

function experiencePlanSchemaForCatalog(catalog, catalogHash) {
  const ids = Array.isArray(catalog) ? catalog.map((item) => item.id) : []
  if (!ids.length || !catalogHash) throw new TypeError('ContentSectionCatalog is required.')
  return Object.freeze({ name: 'experience_plan_v2_dynamic', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['experience-plan-v2'] }, contentSectionCatalogHash: { type: 'string', enum: [catalogHash] }, archetype: { type: 'string' }, sectionOrder: { type: 'array', items: { type: 'string', enum: ids }, minItems: 3, maxItems: ids.length }, heroVariant: { type: 'string' }, sectionTreatments: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, contentDensity: { type: 'string' }, ctaPositions: { type: 'array', items: { type: 'string', enum: ids }, minItems: 1, maxItems: 5 }, servicesTreatment: { type: 'string' }, trustTreatment: { type: 'string' }, faqTreatment: { type: 'string' }, conversionStrategy: { type: 'string' } }, required: ['schemaVersion', 'contentSectionCatalogHash', 'archetype', 'sectionOrder', 'heroVariant', 'sectionTreatments', 'contentDensity', 'ctaPositions', 'servicesTreatment', 'trustTreatment', 'faqTreatment', 'conversionStrategy'] } })
}
module.exports = { DEFAULT_FOREGROUND_TIMEOUT_MS, OUTPUT_BUDGETS, OUTPUT_BUDGET_POLICY, BACKGROUND_DEFAULTS, outputBudgetPolicy, ProviderCallBudget, ProviderRunBudget, providerConfig, classifyError, providerErrorEnvelope, validateStructuredOutputSchema, validateContentPlanDecision, createOpenAISemanticProvider, probeMinimal, probeStructured, probeSemantic, providerHealth, wrapSemanticDecision, validateSemanticEnvelope, MINIMAL_SCHEMA, SEMANTIC_SCHEMA, CONTENT_PLAN_SCHEMA, EXPERIENCE_PLAN_SCHEMA, experiencePlanSchemaForCatalog }
