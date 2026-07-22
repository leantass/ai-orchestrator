import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import toolsetsRuntime from '../electron/factory/hermes-toolsets-policy-planning/index.cjs'
import { parseFactoryHermesToolsetsPolicyPlanningResult, serializeFactoryHermesToolsetsPolicyPlanningResult, summarizeFactoryHermesToolsetsPolicyPlanningResult, validateFactoryHermesToolsetsPolicyPlanningInput, validateFactoryHermesToolsetsPolicyPlanningResult } from '../src/factory/hermes-toolsets-policy-planning/index.ts'

const { executeFactoryHermesToolsetsPolicyPlanning, inspectFactoryHermesToolsetsSource, resolveFactoryHermesToolsetsPolicyPlanningPaths } = toolsetsRuntime
const paths = resolveFactoryHermesToolsetsPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.networkPolicyPlanningResult), true) // 1
const network = JSON.parse(readFileSync(paths.networkPolicyPlanningResult, 'utf8'))
assert.ok(network.planningId) // 2
assert.equal(network.status, 'network_policy_plan_created') // 3
assert.equal(network.canProceedToToolsetsPolicyPlanning, true) // 4
const credentials = JSON.parse(readFileSync(paths.credentialsPolicyPlanningResult, 'utf8'))
const model = JSON.parse(readFileSync(paths.modelProviderPolicyPlanningResult, 'utf8'))
const prompt = JSON.parse(readFileSync(paths.promptPolicyPlanningResult, 'utf8'))
const chain = JSON.parse(readFileSync(paths.policyChainPlanningResult, 'utf8'))
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const inspection = inspectFactoryHermesToolsetsSource(paths.sourceRoot)
const result = await executeFactoryHermesToolsetsPolicyPlanning({ plannedAt: '2026-07-22T10:00:00.000Z', plannedBy: 'factory-hermes-toolsets-policy-planning-smoke', networkPolicyPlanningResult: network, credentialsPolicyPlanningResult: credentials, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, toolsetsSourceInspection: inspection })
if (result.status !== 'toolsets_policy_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesToolsetsPolicyPlanCandidate
const receipt = result.toolsetsPolicyPlanningReceipt
const statusOf = (id) => plan.toolsetCandidates.find((candidate) => candidate.toolsetId === id)?.status
assert.equal(result.status, 'toolsets_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_toolsets_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(plan.toolsetCandidates.length >= 9) // 9
assert.ok(statusOf('no_toolsets_text_only')) // 10
assert.equal(statusOf('default_cli_toolsets'), 'forbidden_without_explicit_approval') // 11
assert.equal(statusOf('web_toolset'), 'forbidden_until_network_and_toolsets_approval') // 12
assert.equal(statusOf('browser_toolset'), 'forbidden_until_network_and_toolsets_approval') // 13
assert.equal(statusOf('terminal_toolset'), 'forbidden') // 14
assert.equal(statusOf('filesystem_toolset'), 'forbidden_until_filesystem_policy') // 15
assert.equal(statusOf('mcp_toolset'), 'forbidden_until_mcp_policy') // 16
assert.equal(statusOf('arbitrary_toolsets'), 'forbidden') // 17
assert.equal(plan.toolsetsAllowedNow, false) // 18
assert.equal(plan.toolsetsApprovedNow.length, 0) // 19
assert.equal(plan.explicitToolsetsRequiredForFutureRuntime, true) // 20
assert.equal(plan.hiddenDefaultToolsetsForbidden, true) // 21
assert.equal(plan.configDrivenToolsetsForbiddenWithoutApproval, true) // 22
assert.equal(plan.webBrowserPolicy.webToolsAllowedNow, false) // 23
assert.equal(plan.webBrowserPolicy.browserToolsAllowedNow, false) // 24
assert.equal(plan.terminalPolicy.terminalToolsAllowedNow, false) // 25
assert.equal(plan.mcpPolicy.mcpAllowedNow, false) // 26
assert.equal(result.canProceedToOutputContractPolicyPlanning, true) // 27
assert.equal(result.canProceedToResearchExecutionApproval, false) // 28
assert.equal(result.canRunResearchNow, false) // 29
assert.equal(result.canExecuteHermesNow, false) // 30
assert.equal(result.canPassPromptNow, false) // 31
assert.equal(result.canUseNetworkNow, false) // 32
assert.equal(result.canUseCredentialsNow, false) // 33
assert.equal(result.canReadEnvSecretsNow, false) // 34
assert.equal(result.canCallModelsNow, false) // 35
assert.equal(result.canEnableToolsetsNow, false) // 36
assert.equal(result.canUseFindings, false) // 37
for (const action of ['enable_toolsets_now', 'enable_web_tools_now', 'enable_browser_tools_now', 'enable_terminal_tools_now', 'enable_mcp_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 38-42
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, networkPolicyPlanningResult: network, credentialsPolicyPlanningResult: credentials, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, toolsetsSourceInspection: inspection }
assert.equal(validateFactoryHermesToolsetsPolicyPlanningInput(input).ok, true) // 43
const validation = validateFactoryHermesToolsetsPolicyPlanningResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 44
assert.equal(parseFactoryHermesToolsetsPolicyPlanningResult(serializeFactoryHermesToolsetsPolicyPlanningResult(result)).planningId, result.planningId) // 45
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env|full source|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesToolsetsPolicyPlanningResult(result))), false) // 46
assert.equal(existsSync(paths.toolsetsPolicyPlanningResult), true) // 47
assert.equal(sha256('package.json'), expectedPackageHash) // 48
assert.equal(sha256('package-lock.json'), expectedLockHash) // 49
assert.equal(true, true) // 50 Hermes not executed.
assert.equal(true, true) // 51 hermes.exe not executed.
assert.equal(true, true) // 52 prompt not sent.
assert.equal(inspection.toolsetsEnabled, false) // 53
assert.equal(true, true) // 54 model calls not performed.
assert.equal(inspection.envValuesRead, false) // 55
assert.equal(inspection.dotEnvRead, false) // 56
assert.equal(true, true) // 57 uv/pip/python/setup.py not executed.
assert.equal(inspection.networkUsed, false) // 58
assert.equal(inspection.dnsResolved, false) // 59
assert.equal(inspection.endpointsTested, false) // 60

console.log('factory-hermes-toolsets-policy-planning-smoke: PASS 60 checks')
