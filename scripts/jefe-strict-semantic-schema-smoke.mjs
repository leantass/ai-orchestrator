import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { validateStructuredOutputSchema, experiencePlanSchemaForCatalog, CONTENT_PLAN_SCHEMA, ProviderRunBudget, createOpenAISemanticProvider } = require('../electron/jefe-semantic-provider.cjs')
const valid = { name: 'valid', schema: { type: 'object', additionalProperties: false, properties: { id: { type: 'string' }, label: { type: 'string' } }, required: ['id', 'label'] } }
assert.equal(validateStructuredOutputSchema(valid), valid)
assert.throws(() => validateStructuredOutputSchema({ name: 'missing-required', schema: { type: 'object', properties: { id: { type: 'string' }, aliases: { type: 'array', items: { type: 'string' } } }, required: ['id'] } }), { code: 'INVALID_PROVIDER_STRUCTURED_OUTPUT_SCHEMA' })
assert.throws(() => validateStructuredOutputSchema({ name: 'unknown-required', schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id', 'missing'] } }), { code: 'INVALID_PROVIDER_STRUCTURED_OUTPUT_SCHEMA' })
assert.throws(() => validateStructuredOutputSchema({ name: 'nested-invalid', schema: { type: 'object', properties: { item: { type: 'object', properties: { id: { type: 'string' } }, required: [] } }, required: ['item'] } }), { code: 'INVALID_PROVIDER_STRUCTURED_OUTPUT_SCHEMA' })
assert.throws(() => validateStructuredOutputSchema({ name: 'array-invalid', schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } }, required: [] } } }, required: ['items'] } }), { code: 'INVALID_PROVIDER_STRUCTURED_OUTPUT_SCHEMA' })
validateStructuredOutputSchema(CONTENT_PLAN_SCHEMA)
const dynamic = experiencePlanSchemaForCatalog([{ id: 'inicio' }, { id: 'servicios' }, { id: 'contacto' }], 'a'.repeat(64))
assert.equal(validateStructuredOutputSchema(dynamic), dynamic)
let fetchCalls = 0
const provider = createOpenAISemanticProvider({ env: { OPENAI_API_KEY: 'offline-test-key', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true' }, callBudget: new ProviderRunBudget({ runId: 'strict-schema', maxCalls: 1 }), fetchImpl: async () => { fetchCalls += 1; return { ok: true, status: 200, headers: { get: () => null }, text: async () => '{}' } } })
await assert.rejects(() => provider.request({ schema: { name: 'invalid-before-network', schema: { type: 'object', properties: { id: { type: 'string' } }, required: [] } } }), { code: 'INVALID_PROVIDER_STRUCTURED_OUTPUT_SCHEMA' })
assert.equal(fetchCalls, 0)
console.log('PASS jefe-strict-semantic-schema-smoke: recursive strict validation, dynamic schema validity, invalid schemas fail before network and aliases contract is required')
