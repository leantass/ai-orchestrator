import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { OUTPUT_BUDGETS, ProviderCallBudget, classifyError, createOpenAISemanticProvider, probeSemantic, validateSemanticEnvelope, wrapSemanticDecision } = require('../electron/jefe-semantic-provider.cjs')

for (const value of [0, 1, 2, 3]) { const budget = new ProviderCallBudget(3); budget.callsUsed = value; assert.equal(await budget.reserve(), value < 3) }
const fullBudget = new ProviderCallBudget(3); fullBudget.callsUsed = 3; let called = false
const blocked = createOpenAISemanticProvider({ env: { OPENAI_API_KEY: 'offline', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true' }, callBudget: fullBudget, fetchImpl: async () => { called = true; throw new Error('must not fetch') } })
const exhausted = await blocked.request({ input: [], maxOutputTokens: 10 }); assert.equal(exhausted.errorCategory, 'PROVIDER_CALL_BUDGET_EXHAUSTED'); assert.equal(called, false)
const concurrentBudget = new ProviderCallBudget(3); concurrentBudget.callsUsed = 2; const reservations = await Promise.all([concurrentBudget.reserve(), concurrentBudget.reserve()]); assert.deepEqual(reservations.sort(), [false, true]); assert.equal(concurrentBudget.callsUsed, 3)
assert.equal(classifyError(null, { status: 429 }), 'RATE_LIMIT'); assert.equal(classifyError(null, { status: 500 }), 'HTTP_ERROR'); assert.equal(classifyError(null, { timedOut: true }), 'ABORT_TIMEOUT')
let calls = 0
const semantic = { schemaVersion: 'business-understanding-v2', businessType: 'estudio de idiomas', businessModel: 'servicio por turnos', audience: 'personas que aprenden idiomas', primaryGoal: 'facilitar reservas', customerNeeds: ['horarios claros'], customerQuestions: ['¿Cómo reservo?'], trustDrivers: ['docentes explicados'], conversionActions: ['Reservar una clase'], serviceModel: 'clases individuales', domainVocabulary: ['idiomas', 'clases'], tone: 'claro y cercano' }
const fakeFetch = async () => { calls += 1; const payload = calls === 1 ? { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } } : { status: 'completed', id: 'resp-offline', output_text: JSON.stringify(semantic) }; return { ok: true, status: 200, text: async () => JSON.stringify(payload), headers: { get: (name) => name === 'x-request-id' ? `req-offline-${calls}` : null } } }
const provider = createOpenAISemanticProvider({ env: { OPENAI_API_KEY: 'offline', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true' }, callBudget: new ProviderCallBudget(3), fetchImpl: fakeFetch })
const result = await probeSemantic(provider); assert.equal(result.ok, true); assert.deepEqual(result.telemetry.budgets, [OUTPUT_BUDGETS.business_understanding, OUTPUT_BUDGETS.business_understanding * 2]); assert.equal(calls, 2)
const envelope = wrapSemanticDecision({ decision: JSON.parse(result.text), operation: 'business-understanding-readiness', provider: { ...provider, responseId: result.payload.id }, input: 'synthetic-brief:language-lessons', sourceRefs: ['synthetic-brief:language-lessons'] }); assert.equal(envelope.provenance.responseId, 'resp-offline')
assert.throws(() => validateSemanticEnvelope({ ...envelope, provenance: { ...envelope.provenance, inputHash: 'bad' } }, { input: 'synthetic-brief:language-lessons', provider, sourceRefs: ['synthetic-brief:language-lessons'] }), /inputHash/u)
assert.throws(() => validateSemanticEnvelope({ ...envelope, provenance: { ...envelope.provenance, provider: 'fake' } }, { input: 'synthetic-brief:language-lessons', provider, sourceRefs: ['synthetic-brief:language-lessons'] }), /Provider provenance/u)
assert.throws(() => validateSemanticEnvelope({ ...envelope, provenance: { ...envelope.provenance, sourceRefs: ['project:real'] } }, { input: 'synthetic-brief:language-lessons', provider, sourceRefs: ['synthetic-brief:language-lessons'] }), /sourceRefs/u)
console.log(`PASS jefe-semantic-provider-offline-smoke: budget, concurrent reservation, incomplete classification, single retry, local provenance; mode=OFFLINE_REGRESSION; calls=${calls}`)
