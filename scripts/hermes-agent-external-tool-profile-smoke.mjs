import assert from 'node:assert/strict'
import {
  createDefaultHermesAgentExternalToolProfileV1,
  parseHermesAgentExternalToolProfileV1,
  serializeHermesAgentExternalToolProfileV1,
  summarizeHermesAgentExternalToolProfileV1,
  validateHermesAgentExternalToolProfileV1,
} from '../src/factory/adapters/jefe-hermes/external-tool-profile/index.ts'

const profile = createDefaultHermesAgentExternalToolProfileV1({ auditedAt: '2026-07-16T12:00:00.000Z' })
assert.equal(validateHermesAgentExternalToolProfileV1(profile).ok, true)
assert.equal(profile.externalToolName, 'Hermes Agent')
assert.equal(profile.externalToolOrigin, 'external_tool')
assert.ok(profile.externalToolProvider)
assert.ok(profile.officialRepository)
assert.ok(profile.officialDocs)
assert.equal(profile.runtimeStatus.installed, false)
assert.equal(profile.runtimeStatus.cloned, false)
assert.equal(profile.runtimeStatus.runtimeIntegrated, false)
assert.equal(profile.policy.requiresAdapter, true)
assert.equal(profile.policy.adapterName, 'JefeHermesAdapter')
assert.equal(profile.policy.cronDisabledByDefault, true)
assert.equal(profile.policy.toolCallingDisabledByDefault, true)
assert.equal(profile.policy.memoryWritesRequireHumanApproval, true)
assert.equal(profile.policy.externalCallsRequireHumanApproval, true)
assert.equal(profile.policy.filesystemWriteDisabledByDefault, true)
assert.equal(profile.policy.repoWriteDisabledByDefault, true)
assert.equal(profile.policy.codeExecutionDisabledByDefault, true)
assert.equal(profile.policy.deployDisabledByDefault, true)
for (const use of ['filesystem_write', 'repo_write', 'autonomous_cron', 'memory_write', 'external_network_calls', 'credentialed_tools', 'code_execution', 'deploy']) assert.ok(profile.disallowedUses.includes(use))
assert.deepEqual(profile.allowedUses, ['documentation_only', 'offline_contract_mapping', 'read_only_research_request_planning'])
assert.ok(profile.auditSourceRefs.length > 0)
const parsed = parseHermesAgentExternalToolProfileV1(serializeHermesAgentExternalToolProfileV1(profile))
assert.equal(validateHermesAgentExternalToolProfileV1(parsed).ok, true)
const summary = summarizeHermesAgentExternalToolProfileV1(profile)
assert.ok(JSON.stringify(summary).length < 5000 && !JSON.stringify(summary).includes('credentialsConfigured":true'))
const dangerousUses = ['filesystem_write', 'repo_write', 'autonomous_cron', 'memory_write', 'external_network_calls', 'credentialed_tools', 'code_execution', 'deploy', 'production_data_access', 'customer_data_access']
const nextStep = profile.nextSafeIntegrationStep.toLowerCase()
assert.ok(
  profile.runtimeStatus.installed === false &&
  profile.runtimeStatus.cloned === false &&
  profile.runtimeStatus.runtimeIntegrated === false &&
  profile.runtimeStatus.credentialsConfigured === false &&
  profile.policy.requiresAdapter === true &&
  profile.policy.adapterName === 'JefeHermesAdapter' &&
  profile.policy.defaultMode === 'read_only' &&
  profile.policy.cronDisabledByDefault === true &&
  profile.policy.toolCallingDisabledByDefault === true &&
  profile.policy.filesystemWriteDisabledByDefault === true &&
  profile.policy.repoWriteDisabledByDefault === true &&
  profile.policy.codeExecutionDisabledByDefault === true &&
  profile.policy.deployDisabledByDefault === true &&
  dangerousUses.every((use) => profile.disallowedUses.includes(use)) &&
  profile.allowedUses.every((use) => !dangerousUses.includes(use)) &&
  nextStep.length > 0 &&
  ['adapter', 'contract', 'profile', 'permit'].some((term) => nextStep.includes(term))
)

console.log(JSON.stringify({ ok: true, checks: 25, externalToolName: profile.externalToolName, provider: profile.externalToolProvider, adapterName: profile.policy.adapterName, allowedUses: profile.allowedUses.length, disallowedUses: profile.disallowedUses.length, runtimeIntegrated: profile.runtimeStatus.runtimeIntegrated }, null, 2))
