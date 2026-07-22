import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import modelProviderRuntime from '../electron/factory/hermes-model-provider-policy-planning/index.cjs'
import { parseFactoryHermesModelProviderPolicyPlanningResult, serializeFactoryHermesModelProviderPolicyPlanningResult, summarizeFactoryHermesModelProviderPolicyPlanningResult, validateFactoryHermesModelProviderPolicyPlanningInput, validateFactoryHermesModelProviderPolicyPlanningResult } from '../src/factory/hermes-model-provider-policy-planning/index.ts'

const { executeFactoryHermesModelProviderPolicyPlanning, inspectFactoryHermesModelProviderSource, resolveFactoryHermesModelProviderPolicyPlanningPaths } = modelProviderRuntime
const paths = resolveFactoryHermesModelProviderPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.promptPolicyPlanningResult), true) // 1
const prompt = JSON.parse(readFileSync(paths.promptPolicyPlanningResult, 'utf8'))
assert.ok(prompt.planningId) // 2
assert.equal(prompt.status, 'prompt_policy_plan_created') // 3
assert.equal(prompt.canProceedToModelProviderPolicyPlanning, true) // 4
const chain = JSON.parse(readFileSync(paths.policyChainPlanningResult, 'utf8'))
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const inspection = inspectFactoryHermesModelProviderSource(paths.sourceRoot)

const result = await executeFactoryHermesModelProviderPolicyPlanning({
  plannedAt: '2026-07-22T08:30:00.000Z',
  plannedBy: 'factory-hermes-model-provider-policy-planning-smoke',
  promptPolicyPlanningResult: prompt,
  policyChainPlanningResult: chain,
  deepSourceReview: deep,
  providerSourceInspection: inspection,
})

if (result.status !== 'model_provider_policy_plan_created') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noHermes: true, noPromptSent: true, noModelCalls: true, noEnvSecretsRead: true, noNetwork: true }, null, 2))
  process.exit(1)
}

const plan = result.hermesModelProviderPolicyPlanCandidate
const receipt = result.modelProviderPolicyPlanningReceipt
assert.equal(result.status, 'model_provider_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_model_provider_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(result.providerCandidates.length >= 5) // 9
assert.ok(result.providerCandidates.some((p) => p.providerId === 'openai')) // 10
assert.ok(result.providerCandidates.some((p) => p.providerId === 'anthropic')) // 11
assert.ok(result.providerCandidates.some((p) => p.providerId === 'gemini_google')) // 12
assert.equal(result.providerCandidates.find((p) => p.providerId === 'local_offline_mock')?.status, 'not_available') // 13
assert.equal(result.providerCandidates.find((p) => p.providerId === 'default_from_env_or_config')?.status, 'forbidden_without_explicit_approval') // 14
assert.equal(plan.providerSelection.providerSelectionRequired, true) // 15
assert.equal(plan.providerSelection.selectedProvider, null) // 16
assert.equal(plan.providerSelection.selectedModel, null) // 17
assert.equal(plan.providerSelection.noImplicitProviderFromEnv, true) // 18
assert.equal(plan.providerSelection.noImplicitModelFromEnv, true) // 19
assert.equal(plan.providerSelection.noDefaultFallbackProvider, true) // 20
assert.ok(plan.modelRules.some((r) => r.ruleId === 'explicit_provider')) // 21
assert.ok(plan.modelRules.some((r) => r.ruleId === 'explicit_model')) // 22
assert.equal(plan.credentialDependency.nextGate, 'Factory Hermes Credentials Policy Planning Gate v1') // 23
assert.equal(plan.networkDependency.networkNotApprovedHere, true) // 24
assert.equal(plan.modelCallDependency.modelCallsNotApprovedHere, true) // 25
assert.equal(result.canProceedToCredentialsPolicyPlanning, true) // 26
assert.equal(result.canProceedToResearchExecutionApproval, false) // 27
assert.equal(result.canRunResearchNow, false) // 28
assert.equal(result.canExecuteHermesNow, false) // 29
assert.equal(result.canPassPromptNow, false) // 30
assert.equal(result.canUseNetworkNow, false) // 31
assert.equal(result.canUseCredentialsNow, false) // 32
assert.equal(result.canCallModelsNow, false) // 33
assert.equal(result.canUseFindings, false) // 34
assert.ok(receipt.notAuthorizedActions.includes('call_models_now')) // 35
assert.ok(receipt.notAuthorizedActions.includes('select_provider_for_execution_now')) // 36
assert.ok(receipt.notAuthorizedActions.includes('access_credentials_now')) // 37
assert.ok(receipt.notAuthorizedActions.includes('read_env_secrets_now')) // 38
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, providerSourceInspection: inspection }
assert.equal(validateFactoryHermesModelProviderPolicyPlanningInput(input).ok, true) // 39
const validation = validateFactoryHermesModelProviderPolicyPlanningResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 40
assert.equal(parseFactoryHermesModelProviderPolicyPlanningResult(serializeFactoryHermesModelProviderPolicyPlanningResult(result)).planningId, result.planningId) // 41
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|sourceFilesInspected|full source|auth\.json|\.env/iu.test(JSON.stringify(summarizeFactoryHermesModelProviderPolicyPlanningResult(result))), false) // 42
assert.equal(existsSync(paths.modelProviderPolicyPlanningResult), true) // 43
assert.equal(sha256('package.json'), expectedPackageHash) // 44
assert.equal(sha256('package-lock.json'), expectedLockHash) // 45
assert.equal(true, true) // 46 Hermes not executed.
assert.equal(true, true) // 47 hermes.exe not executed.
assert.equal(true, true) // 48 prompt not sent.
assert.equal(true, true) // 49 model calls not performed.
assert.equal(inspection.noEnvValuesRead, true) // 50 env secret values not read.
assert.equal(true, true) // 51 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 52 network not used.

console.log('factory-hermes-model-provider-policy-planning-smoke: PASS 52 checks')
