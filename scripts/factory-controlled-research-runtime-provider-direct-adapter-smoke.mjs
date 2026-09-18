import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const mod = require('../electron/factory/controlled-research-runtime-provider-direct-adapter/index.cjs')

const base = { promptArtifact: { ref: 'approved:v1', path: 'prompt.json', hash: 'abc123', safeSummary: 'safe summary' }, outputContract: { schema: { type: 'object' }, boundedOutput: true, maxBytes: 4096 }, providerModelHostRefs: { providerRef: 'openai', modelRef: 'gpt-4o-mini', hostRef: 'api.openai.com' }, credentialRef: { credentialRef: 'OPENAI_API_KEY' }, noToolPolicy: { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false } }
assert.equal(typeof mod.buildProviderDirectResearchRequest, 'function')
const result = mod.buildProviderDirectResearchRequest(base)
assert.equal(result.ok, true)
assert.equal(result.envelope.runnableNow, false)
assert.equal(result.envelope.credentialValueIncluded, false)
assert.equal(result.envelope.networkCallIncluded, false)
assert.equal(result.envelope.modelCallIncluded, false)
assert.equal(result.envelope.promptSentToProvider, false)
assert.equal(result.envelope.toolsDeclared, false)
assert.equal(mod.buildProviderDirectResearchRequest({ ...base, promptArtifact: undefined }).ok, false)
assert.equal(mod.buildProviderDirectResearchRequest({ ...base, outputContract: undefined }).ok, false)
assert.equal(mod.buildProviderDirectResearchRequest({ ...base, providerModelHostRefs: { providerRef: 'other', modelRef: 'x', hostRef: 'example.com' } }).ok, false)
assert.equal(mod.buildProviderDirectResearchRequest({ ...base, credentialRef: { credentialRef: 'BAD' } }).ok, false)
assert.equal(mod.buildProviderDirectResearchRequest({ ...base, tools: [{}] }).ok, false)
assert.equal(result.noToolEvidence.toolsDeclared, false)
assert.equal(mod.summarizeProviderDirectRequestForAudit(base).containsSecrets, false)
assert.deepEqual(mod.parseProviderDirectAdapterResult(mod.serializeProviderDirectAdapterResult({ ok: true })), { ok: true })
console.log(JSON.stringify({ ok: true, module: 'controlled-research-runtime-provider-direct-adapter' }, null, 2))
