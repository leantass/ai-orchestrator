import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createOpenAISemanticProvider, ProviderRunBudget, providerErrorEnvelope } = require('../electron/jefe-semantic-provider.cjs')
const response = (payload, status = 200) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, async text() { return JSON.stringify(payload) } })
const providerFor = (payload) => createOpenAISemanticProvider({ env: { OPENAI_API_KEY: 'offline-test-key', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true', AI_ORCHESTRATOR_BRAIN_PROVIDER: 'openai', AI_ORCHESTRATOR_SEMANTIC_MODEL: 'gpt-5.6-terra', AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INITIAL_DELAY_MS: '0' }, callBudget: new ProviderRunBudget({ runId: 'failure-classification', maxCalls: 4 }), fetchImpl: async () => response(payload) })
const failedServer = await providerFor({ id: 'resp-server', status: 'failed', error: { code: 'server_error', message: 'Synthetic server failure' } }).request({ executionMode: 'background', operation: 'content_plan', input: [], schema: null })
assert.equal(failedServer.errorCategory, 'MODEL_ERROR'); assert.equal(failedServer.errorEnvelope.category, 'BACKGROUND_RESPONSE_FAILED'); assert.equal(failedServer.errorEnvelope.responseId, 'resp-server'); assert.equal(failedServer.errorEnvelope.upstreamCode, 'server_error'); assert.equal(failedServer.errorEnvelope.upstreamMessage, 'Synthetic server failure'); assert.equal(failedServer.errorEnvelope.retryable, true)
const failedModel = await providerFor({ id: 'resp-model', status: 'failed', error: { code: 'model_error', message: 'Synthetic model failure' } }).request({ executionMode: 'background', operation: 'content_plan', input: [], schema: null })
assert.equal(failedModel.errorEnvelope.category, 'BACKGROUND_RESPONSE_FAILED'); assert.equal(failedModel.errorEnvelope.upstreamCode, 'model_error'); assert.equal(failedModel.errorEnvelope.retryable, false)
const failedNoError = await providerFor({ id: 'resp-no-error', status: 'failed', error: null }).request({ executionMode: 'background', operation: 'content_plan', input: [], schema: null })
assert.equal(failedNoError.errorEnvelope.category, 'BACKGROUND_RESPONSE_FAILED'); assert.equal(failedNoError.errorEnvelope.upstreamCode, null); assert.equal(failedNoError.errorEnvelope.upstreamMessage, '')
const incomplete = await providerFor({ id: 'resp-incomplete', status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }).request({ executionMode: 'background', operation: 'content_plan', input: [], schema: null })
assert.equal(incomplete.errorEnvelope.category, 'OUTPUT_BUDGET_EXHAUSTED'); assert.notEqual(incomplete.errorEnvelope.category, 'BACKGROUND_RESPONSE_FAILED')
const provider = providerFor({ id: 'resp-completed', status: 'completed', output_text: 'not-json' }); await assert.rejects(() => provider.decide({ executionMode: 'background', operation: 'content_plan', input: [], schema: null }), (error) => error.errorEnvelope?.category === 'STRUCTURED_OUTPUT_INVALID')
assert.equal(providerErrorEnvelope({ category: 'SEMANTIC_CONTRACT_INVALID', operation: 'experience_plan', executionMode: 'background', model: 'gpt-5.6-terra', upstreamMessage: 'safe contract detail' }).category, 'SEMANTIC_CONTRACT_INVALID')
console.log('PASS jefe-semantic-provider-failure-classification-smoke: failed response identity, upstream code/message, incomplete separation, conservative retryability, safe envelope categories')
