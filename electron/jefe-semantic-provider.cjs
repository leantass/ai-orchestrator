const DEFAULT_FOREGROUND_TIMEOUT_MS = 30000
const DEFAULT_RETRY_MAX = 1
const crypto = require('node:crypto')
const OUTPUT_BUDGET_POLICY = Object.freeze({
  minimal_probe: Object.freeze({ initialOutputBudget: 128, retryOutputBudget: 256, maxRetries: 1 }),
  structured_probe: Object.freeze({ initialOutputBudget: 256, retryOutputBudget: 512, maxRetries: 1 }),
  business_understanding: Object.freeze({ initialOutputBudget: 1200, retryOutputBudget: 2400, maxRetries: 1 }),
  correction_plan: Object.freeze({ initialOutputBudget: 1800, retryOutputBudget: 3600, maxRetries: 1 }),
  content_plan: Object.freeze({ initialOutputBudget: 2400, retryOutputBudget: 4800, maxRetries: 1 }),
  experience_plan: Object.freeze({ initialOutputBudget: 1800, retryOutputBudget: 3600, maxRetries: 1 }),
})
const OUTPUT_BUDGETS = Object.freeze(Object.fromEntries(Object.entries(OUTPUT_BUDGET_POLICY).map(([key, value]) => [key, value.initialOutputBudget])))
function outputBudgetPolicy(operation) { return OUTPUT_BUDGET_POLICY[operation] || OUTPUT_BUDGET_POLICY.business_understanding }

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
    outputBudgets: OUTPUT_BUDGETS,
  }
}

function classifyError(error, { status = 0, timedOut = false } = {}) {
  if (timedOut) return 'ABORT_TIMEOUT'
  if (status === 429) return 'RATE_LIMIT'
  if (status >= 500) return 'HTTP_ERROR'
  if (status >= 400) return 'MODEL_ERROR'
  if (error?.name === 'TypeError') return 'NETWORK_ERROR'
  return 'UNKNOWN'
}

function safeRequestSummary({ requestStartedAt, firstResponseAt, completedAt, status = 0, requestId = null, errorCategory = null, attempts = 0 }) {
  return { requestStartedAt, firstResponseAt, completedAt, durationMs: completedAt - requestStartedAt, status, requestId, errorCategory, attempts }
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of Array.isArray(payload?.output) ? payload.output : []) for (const part of Array.isArray(item?.content) ? item.content : []) if (typeof part?.text === 'string') return part.text
  return ''
}

function createOpenAISemanticProvider({ env = process.env, fetchImpl = fetch, now = Date.now, callBudget = null } = {}) {
  const config = providerConfig({ env })
  return Object.freeze({
    providerId: 'openai-semantic',
    model: config.model,
    enabled: env.AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED === 'true' || env.AI_ORCHESTRATOR_BRAIN_PROVIDER?.trim() === 'openai',
    credentialAvailable: Boolean(config.apiKey),
    async request({ input, schema = null, maxOutputTokens = 600, reasoningEffort = config.reasoningEffort, timeoutMs = config.foregroundTimeoutMs, retries = config.retryMax, outputBudgetRetryMax = 0, operation = 'semantic', retryOutputBudget = null } = {}) {
      if (!config.apiKey) throw Object.assign(new Error('OPENAI_CREDENTIAL_MISSING'), { category: 'MODEL_ERROR' })
      let attempt = 0; let outputBudgetRetry = 0; let currentMaxOutputTokens = maxOutputTokens; const budgets = []
      while (true) {
        if (callBudget && !(await callBudget.reserve(operation))) return { ok: false, status: 0, errorCategory: 'PROVIDER_CALL_BUDGET_EXHAUSTED', telemetry: { attempts: attempt, budgets, providerBudget: callBudget.snapshot?.() || null } }
        budgets.push(currentMaxOutputTokens)
        const requestBody = { model: config.model, input, max_output_tokens: currentMaxOutputTokens, store: false, reasoning: { effort: reasoningEffort } }
        if (schema) requestBody.text = { format: { type: 'json_schema', name: schema.name, strict: true, schema: schema.schema } }
        const requestStartedAt = now(); let firstResponseAt = null; let completedAt = null; let response; let responseText = ''
        const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
          response = await fetchImpl(config.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify(requestBody), signal: controller.signal })
          firstResponseAt = now(); responseText = await response.text(); completedAt = now()
          const requestId = response.headers?.get?.('x-request-id') || response.headers?.get?.('request-id') || null
          const telemetry = safeRequestSummary({ requestStartedAt, firstResponseAt, completedAt, status: response.status, requestId, attempts: attempt + 1 })
          if (!response.ok) {
            let providerError = null
            try { providerError = JSON.parse(responseText)?.error || null } catch {}
            const retryable = response.status === 429 || response.status >= 500
            if (retryable && attempt < retries) { attempt += 1; continue }
            return { ok: false, status: response.status, errorCategory: classifyError(null, { status: response.status }), errorCode: providerError?.code || null, errorType: providerError?.type || null, errorParam: providerError?.param || null, telemetry }
          }
          let payload
          try { payload = JSON.parse(responseText) } catch { return { ok: false, status: response.status, errorCategory: 'SCHEMA_ERROR', telemetry } }
          const status = payload?.status || 'completed'
          if (status === 'incomplete') {
            const incompleteReason = payload?.incomplete_details?.reason || null
            if (incompleteReason === 'max_output_tokens' && outputBudgetRetry < outputBudgetRetryMax) { outputBudgetRetry += 1; currentMaxOutputTokens = retryOutputBudget || currentMaxOutputTokens * 2; continue }
            return { ok: false, status, incompleteReason, errorCategory: incompleteReason === 'max_output_tokens' ? 'OUTPUT_BUDGET_EXHAUSTED' : 'SCHEMA_ERROR', telemetry: { ...telemetry, budgets } }
          }
          if (status === 'failed' || status === 'cancelled' || payload?.incomplete_details) return { ok: false, status, errorCategory: 'MODEL_ERROR', telemetry }
          return { ok: true, status, text: extractResponseText(payload), payload, telemetry: { ...telemetry, budgets } }
        } catch (error) {
          completedAt = now(); const timedOut = error?.name === 'AbortError'; const category = classifyError(error, { timedOut }); const telemetry = safeRequestSummary({ requestStartedAt, firstResponseAt, completedAt, errorCategory: category, attempts: attempt + 1 })
          if ((category === 'ABORT_TIMEOUT' || category === 'NETWORK_ERROR') && attempt < retries) { attempt += 1; continue }
          return { ok: false, status: 0, errorCategory: category, telemetry }
        } finally { clearTimeout(timer) }
      }
    },
    async decide({ operation = 'business_understanding', input, schema = SEMANTIC_SCHEMA, sourceRefs = [], outputBudgetRetryMax = 1 } = {}) {
      const policy = outputBudgetPolicy(operation)
      const result = await this.request({ input, schema, maxOutputTokens: policy.initialOutputBudget, reasoningEffort: config.reasoningEffort, outputBudgetRetryMax, operation, retryOutputBudget: policy.retryOutputBudget })
      if (!result.ok) throw Object.assign(new Error(result.errorCategory || 'SEMANTIC_PROVIDER_FAILED'), { code: result.errorCategory || 'SEMANTIC_PROVIDER_FAILED', telemetry: result.telemetry })
      let decision
      try { decision = JSON.parse(result.text) } catch { throw Object.assign(new Error('SEMANTIC_STRUCTURED_OUTPUT_INVALID'), { code: 'SEMANTIC_STRUCTURED_OUTPUT_INVALID' }) }
      return wrapSemanticDecision({ decision, operation, provider: { ...this, responseId: result.payload?.id || null }, input, sourceRefs })
    },
  })
}

const MINIMAL_SCHEMA = Object.freeze({ name: 'semantic_minimal', schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean' }, label: { type: 'string' } }, required: ['ok', 'label'] } })
const SEMANTIC_SCHEMA = Object.freeze({ name: 'business_understanding_v2_probe', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['business-understanding-v2'] }, businessType: { type: 'string' }, businessModel: { type: 'string' }, audience: { type: 'string' }, primaryGoal: { type: 'string' }, customerNeeds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }, customerQuestions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }, trustDrivers: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }, conversionActions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 }, serviceModel: { type: 'string' }, domainVocabulary: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, tone: { type: 'string' } }, required: ['schemaVersion', 'businessType', 'businessModel', 'audience', 'primaryGoal', 'customerNeeds', 'customerQuestions', 'trustDrivers', 'conversionActions', 'serviceModel', 'domainVocabulary', 'tone'] } })
const CONTENT_PLAN_SCHEMA = Object.freeze({ name: 'content_plan_v2', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['content-plan-v2'] }, hero: { type: 'string' }, presentation: { type: 'string' }, services: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, trust: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }, faq: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, contact: { type: 'string' }, contentPriorities: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 } }, required: ['schemaVersion', 'hero', 'presentation', 'services', 'trust', 'faq', 'contact', 'contentPriorities'] } })
const EXPERIENCE_PLAN_SCHEMA = Object.freeze({ name: 'experience_plan_v2', schema: { type: 'object', additionalProperties: false, properties: { schemaVersion: { type: 'string', enum: ['experience-plan-v2'] }, archetype: { type: 'string' }, sectionOrder: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 8 }, heroVariant: { type: 'string' }, sectionTreatments: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, contentDensity: { type: 'string' }, ctaPositions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 }, servicesTreatment: { type: 'string' }, trustTreatment: { type: 'string' }, faqTreatment: { type: 'string' }, conversionStrategy: { type: 'string' } }, required: ['schemaVersion', 'archetype', 'sectionOrder', 'heroVariant', 'sectionTreatments', 'contentDensity', 'ctaPositions', 'servicesTreatment', 'trustTreatment', 'faqTreatment', 'conversionStrategy'] } })

async function probeMinimal(provider) { return provider.request({ input: [{ role: 'user', content: [{ type: 'input_text', text: 'Respondé únicamente OK.' }] }], maxOutputTokens: OUTPUT_BUDGETS.minimal_probe, reasoningEffort: 'low' }) }
async function probeStructured(provider) { return provider.request({ input: [{ role: 'user', content: [{ type: 'input_text', text: 'Devolvé ok=true y label="ready".' }] }], schema: MINIMAL_SCHEMA, maxOutputTokens: OUTPUT_BUDGETS.structured_probe, reasoningEffort: 'low' }) }
async function probeSemantic(provider) { return provider.request({ input: [{ role: 'system', content: [{ type: 'input_text', text: 'Generá sólo el objeto semántico solicitado. No incluy provenance, provider, modelo, timestamps, hashes ni metadatos de ejecución.' }] }, { role: 'user', content: [{ type: 'input_text', text: 'Brief ficticio: estudio que ofrece clases particulares de idiomas por turnos.' }] }], schema: SEMANTIC_SCHEMA, maxOutputTokens: OUTPUT_BUDGETS.business_understanding, outputBudgetRetryMax: 1, reasoningEffort: 'low' }) }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function wrapSemanticDecision({ decision, operation = 'business-understanding', provider, input, sourceRefs = [], createdAt = new Date().toISOString(), adapterVersion = 'semantic-adapter-v1' } = {}) {
  if (!decision || typeof decision !== 'object' || !provider?.providerId) throw new TypeError('semantic decision and provider are required')
  const envelope = { decision, provenance: { operation, provider: provider.providerId, model: provider.model, responseId: provider.responseId || null, requestHash: hash({ operation, input }), inputHash: hash(input), schemaId: SEMANTIC_SCHEMA.name, schemaVersion: decision.schemaVersion || null, adapterVersion, createdAt, sourceRefs } }
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

module.exports = { DEFAULT_FOREGROUND_TIMEOUT_MS, OUTPUT_BUDGETS, OUTPUT_BUDGET_POLICY, outputBudgetPolicy, ProviderCallBudget, ProviderRunBudget, providerConfig, classifyError, createOpenAISemanticProvider, probeMinimal, probeStructured, probeSemantic, providerHealth, wrapSemanticDecision, validateSemanticEnvelope, MINIMAL_SCHEMA, SEMANTIC_SCHEMA, CONTENT_PLAN_SCHEMA, EXPERIENCE_PLAN_SCHEMA }
