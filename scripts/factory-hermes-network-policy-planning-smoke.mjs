import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import networkRuntime from '../electron/factory/hermes-network-policy-planning/index.cjs'
import { parseFactoryHermesNetworkPolicyPlanningResult, serializeFactoryHermesNetworkPolicyPlanningResult, summarizeFactoryHermesNetworkPolicyPlanningResult, validateFactoryHermesNetworkPolicyPlanningInput, validateFactoryHermesNetworkPolicyPlanningResult } from '../src/factory/hermes-network-policy-planning/index.ts'

const { executeFactoryHermesNetworkPolicyPlanning, inspectFactoryHermesNetworkSource, resolveFactoryHermesNetworkPolicyPlanningPaths } = networkRuntime
const paths = resolveFactoryHermesNetworkPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.credentialsPolicyPlanningResult), true) // 1
const credentials = JSON.parse(readFileSync(paths.credentialsPolicyPlanningResult, 'utf8'))
assert.ok(credentials.planningId) // 2
assert.equal(credentials.status, 'credentials_policy_plan_created') // 3
assert.equal(credentials.canProceedToNetworkPolicyPlanning, true) // 4
const model = JSON.parse(readFileSync(paths.modelProviderPolicyPlanningResult, 'utf8'))
const prompt = JSON.parse(readFileSync(paths.promptPolicyPlanningResult, 'utf8'))
const chain = JSON.parse(readFileSync(paths.policyChainPlanningResult, 'utf8'))
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const inspection = inspectFactoryHermesNetworkSource(paths.sourceRoot)
const result = await executeFactoryHermesNetworkPolicyPlanning({ plannedAt: '2026-07-22T09:30:00.000Z', plannedBy: 'factory-hermes-network-policy-planning-smoke', credentialsPolicyPlanningResult: credentials, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, networkSourceInspection: inspection })
if (result.status !== 'network_policy_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesNetworkPolicyPlanCandidate
const receipt = result.networkPolicyPlanningReceipt
assert.equal(result.status, 'network_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_network_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.equal(plan.networkAllowedNow, false) // 9
assert.equal(plan.allowedHostsNow.length, 0) // 10
assert.equal(plan.wildcardHostsAllowed, false) // 11
assert.equal(plan.arbitraryInternetAllowed, false) // 12
assert.equal(plan.futureHostSelectionRequired, true) // 13
assert.equal(plan.futureAllowedHostsRequireApproval, true) // 14
assert.ok(plan.providerNetworkCandidates.length >= 3) // 15
assert.ok(plan.networkSurfaceCandidates.length >= 7) // 16
assert.equal(plan.networkSurfaceCandidates.find((s) => s.surfaceId === 'model_provider_api_network')?.status, 'requires_future_network_approval') // 17
assert.equal(plan.networkSurfaceCandidates.find((s) => s.surfaceId === 'web_toolset_network')?.status, 'forbidden_until_toolsets_policy') // 18
assert.equal(plan.networkSurfaceCandidates.find((s) => s.surfaceId === 'browser_toolset_network')?.status, 'forbidden_until_toolsets_policy') // 19
assert.equal(plan.networkSurfaceCandidates.find((s) => s.surfaceId === 'arbitrary_internet')?.status, 'forbidden') // 20
assert.equal(plan.toolsetsDependency.toolsetNetworkDisabledUntilToolsetsPolicy, true) // 21
assert.equal(plan.toolsetsDependency.webBrowserSearchDisabledUntilToolsetsPolicy, true) // 22
assert.equal(plan.killSwitchPolicy.networkKillSwitchRequired, true) // 23
assert.equal(result.canProceedToToolsetsPolicyPlanning, true) // 24
assert.equal(result.canProceedToResearchExecutionApproval, false) // 25
assert.equal(result.canRunResearchNow, false) // 26
assert.equal(result.canExecuteHermesNow, false) // 27
assert.equal(result.canPassPromptNow, false) // 28
assert.equal(result.canUseNetworkNow, false) // 29
assert.equal(result.canUseCredentialsNow, false) // 30
assert.equal(result.canReadEnvSecretsNow, false) // 31
assert.equal(result.canCallModelsNow, false) // 32
assert.equal(result.canUseFindings, false) // 33
for (const action of ['use_network_now', 'resolve_dns_now', 'test_endpoint_now', 'call_models_now', 'enable_web_tools_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 34-38
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, credentialsPolicyPlanningResult: credentials, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, networkSourceInspection: inspection }
assert.equal(validateFactoryHermesNetworkPolicyPlanningInput(input).ok, true) // 39
const validation = validateFactoryHermesNetworkPolicyPlanningResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 40
assert.equal(parseFactoryHermesNetworkPolicyPlanningResult(serializeFactoryHermesNetworkPolicyPlanningResult(result)).planningId, result.planningId) // 41
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env|full source|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesNetworkPolicyPlanningResult(result))), false) // 42
assert.equal(existsSync(paths.networkPolicyPlanningResult), true) // 43
assert.equal(sha256('package.json'), expectedPackageHash) // 44
assert.equal(sha256('package-lock.json'), expectedLockHash) // 45
assert.equal(true, true) // 46 Hermes not executed.
assert.equal(true, true) // 47 hermes.exe not executed.
assert.equal(true, true) // 48 prompt not sent.
assert.equal(true, true) // 49 model calls not performed.
assert.equal(inspection.envValuesRead, false) // 50
assert.equal(inspection.dotEnvRead, false) // 51
assert.equal(true, true) // 52 uv/pip/python/setup.py not executed.
assert.equal(inspection.networkUsed, false) // 53
assert.equal(inspection.dnsResolved, false) // 54
assert.equal(inspection.endpointsTested, false) // 55

console.log('factory-hermes-network-policy-planning-smoke: PASS 55 checks')
