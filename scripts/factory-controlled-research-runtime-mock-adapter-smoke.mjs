import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const mod = require('../electron/factory/controlled-research-runtime-mock-adapter/index.cjs')

const base = { promptArtifact: { ref: 'approved:v1', path: 'prompt.json', hash: 'abc123', safeSummary: 'safe summary' }, outputContract: { schema: { type: 'object' }, boundedOutput: true, maxBytes: 4096 }, noToolPolicy: { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false } }
const result = mod.buildMockResearchRuntimeResult(base)
assert.equal(typeof mod.buildMockResearchRuntimeResult, 'function')
assert.equal(result.ok, true)
assert.deepEqual(mod.buildMockOutputFromContract(base), mod.buildMockOutputFromContract(base))
assert.equal(result.mockOutputIsRealResearch, false)
assert.equal(result.findingsUseApprovedNow, false)
assert.equal(mod.buildMockResearchRuntimeResult({ ...base, promptArtifact: undefined }).ok, false)
assert.equal(mod.buildMockResearchRuntimeResult({ ...base, outputContract: undefined }).ok, false)
assert.equal(mod.buildMockResearchRuntimeResult({ ...base, noToolPolicy: { ...base.noToolPolicy, toolsAllowed: true } }).ok, false)
assert.equal(result.credentialsRead, false)
assert.equal(result.networkUsed, false)
assert.equal(result.modelCalled, false)
assert.deepEqual(mod.parseMockResearchRuntimeResult(mod.serializeMockResearchRuntimeResult({ ok: true })), { ok: true })
console.log(JSON.stringify({ ok: true, module: 'controlled-research-runtime-mock-adapter' }, null, 2))
