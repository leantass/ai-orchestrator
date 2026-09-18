import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const mod = require('../electron/factory/controlled-research-runtime-contracts/index.cjs')

const prompt = { ref: 'approved:v1', path: 'prompt.json', hash: 'abc123', safeSummary: 'safe summary' }
const output = { schema: { type: 'object' }, boundedOutput: true, maxBytes: 4096 }
const noTools = { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false }
assert.equal(typeof mod.validateApprovedPromptArtifactRef, 'function')
assert.equal(mod.validateApprovedPromptArtifactRef(prompt).ok, true)
assert.equal(mod.validateApprovedPromptArtifactRef({}).ok, false)
assert.equal(mod.validateResearchOutputContract(output).ok, true)
assert.equal(mod.validateResearchOutputContract({}).ok, false)
assert.equal(mod.validateCredentialRefOnly({ credentialRef: 'OPENAI_API_KEY' }).ok, true)
assert.equal(mod.validateCredentialRefOnly({ credentialRef: 'OPENAI_API_KEY', credentialValue: 'sk-real-looking-secret' }).ok, false)
assert.equal(mod.validateNoToolPolicy(noTools).ok, true)
assert.equal(mod.validateNoToolPolicy({ ...noTools, toolsAllowed: true }).ok, false)
assert.equal(mod.validateRuntimeTimeoutPolicy({ maxRuntimeMs: 30000 }).ok, true)
assert.equal(mod.buildRuntimeAuditManifest({ prompt }).redacted, true)
assert.equal(mod.buildRuntimeAuditManifest({ prompt }).networkUsed, false)
assert.deepEqual(mod.parseControlledResearchRuntimeContract(mod.serializeControlledResearchRuntimeContract({ ok: true })), { ok: true })
console.log(JSON.stringify({ ok: true, module: 'controlled-research-runtime-contracts' }, null, 2))
