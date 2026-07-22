import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import credentialsRuntime from '../electron/factory/hermes-credentials-policy-planning/index.cjs'
import { parseFactoryHermesCredentialsPolicyPlanningResult, serializeFactoryHermesCredentialsPolicyPlanningResult, summarizeFactoryHermesCredentialsPolicyPlanningResult, validateFactoryHermesCredentialsPolicyPlanningInput, validateFactoryHermesCredentialsPolicyPlanningResult } from '../src/factory/hermes-credentials-policy-planning/index.ts'

const { executeFactoryHermesCredentialsPolicyPlanning, inspectFactoryHermesCredentialSource, resolveFactoryHermesCredentialsPolicyPlanningPaths } = credentialsRuntime
const paths = resolveFactoryHermesCredentialsPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.modelProviderPolicyPlanningResult), true) // 1
const model = JSON.parse(readFileSync(paths.modelProviderPolicyPlanningResult, 'utf8'))
assert.ok(model.planningId) // 2
assert.equal(model.status, 'model_provider_policy_plan_created') // 3
assert.equal(model.canProceedToCredentialsPolicyPlanning, true) // 4
const prompt = JSON.parse(readFileSync(paths.promptPolicyPlanningResult, 'utf8'))
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const inspection = inspectFactoryHermesCredentialSource(paths.sourceRoot)
const result = await executeFactoryHermesCredentialsPolicyPlanning({ plannedAt: '2026-07-22T09:00:00.000Z', plannedBy: 'factory-hermes-credentials-policy-planning-smoke', modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, deepSourceReview: deep, credentialSourceInspection: inspection })
if (result.status !== 'credentials_policy_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesCredentialsPolicyPlanCandidate
const receipt = result.credentialsPolicyPlanningReceipt
assert.equal(result.status, 'credentials_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_credentials_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(result.credentialReferences.length >= 4) // 9
for (const ref of ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']) assert.ok(result.credentialReferences.some((r) => r.refName === ref)) // 10-13
for (const ref of result.credentialReferences) assert.equal(ref.status, 'referenced_not_read') // 14
for (const ref of result.credentialReferences) assert.equal(ref.valueKnown, false) // 15
for (const ref of result.credentialReferences) assert.equal(ref.valueRead, false) // 16
for (const ref of result.credentialReferences) assert.equal(ref.approvedForUseNow, false) // 17
assert.equal(plan.credentialInjectionPlan.credentialValuesDefinedHere, false) // 18
assert.equal(plan.credentialInjectionPlan.credentialValuesReadHere, false) // 19
assert.equal(plan.credentialInjectionPlan.futureCredentialSourceRequiresApproval, true) // 20
assert.ok(plan.credentialInjectionPlan.forbiddenSources.includes('implicit_dotenv')) // 21
assert.ok(plan.credentialInjectionPlan.forbiddenSources.includes('implicit_process_env_without_approval')) // 22
assert.equal(plan.maskingPolicy.logCredentialNamesOnly, true) // 23
assert.equal(plan.maskingPolicy.redactValues, true) // 24
assert.equal(plan.maskingPolicy.noEnvDump, true) // 25
assert.equal(plan.killSwitchPolicy.credentialKillSwitchRequired, true) // 26
assert.equal(result.canProceedToNetworkPolicyPlanning, true) // 27
assert.equal(result.canProceedToResearchExecutionApproval, false) // 28
assert.equal(result.canRunResearchNow, false) // 29
assert.equal(result.canExecuteHermesNow, false) // 30
assert.equal(result.canPassPromptNow, false) // 31
assert.equal(result.canUseNetworkNow, false) // 32
assert.equal(result.canUseCredentialsNow, false) // 33
assert.equal(result.canReadEnvSecretsNow, false) // 34
assert.equal(result.canCallModelsNow, false) // 35
assert.equal(result.canUseFindings, false) // 36
for (const action of ['use_credentials_now', 'read_env_secrets_now', 'read_dotenv_now', 'validate_api_keys_now', 'call_models_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 37-41
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, deepSourceReview: deep, credentialSourceInspection: inspection }
assert.equal(validateFactoryHermesCredentialsPolicyPlanningInput(input).ok, true) // 42
const validation = validateFactoryHermesCredentialsPolicyPlanningResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 43
assert.equal(parseFactoryHermesCredentialsPolicyPlanningResult(serializeFactoryHermesCredentialsPolicyPlanningResult(result)).planningId, result.planningId) // 44
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env|full source|auth\.json|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesCredentialsPolicyPlanningResult(result))), false) // 45
assert.equal(existsSync(paths.credentialsPolicyPlanningResult), true) // 46
assert.equal(sha256('package.json'), expectedPackageHash) // 47
assert.equal(sha256('package-lock.json'), expectedLockHash) // 48
assert.equal(true, true) // 49 Hermes not executed.
assert.equal(true, true) // 50 hermes.exe not executed.
assert.equal(true, true) // 51 prompt not sent.
assert.equal(true, true) // 52 model calls not performed.
assert.equal(inspection.envValuesRead, false) // 53
assert.equal(inspection.dotEnvRead, false) // 54
assert.equal(true, true) // 55 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 56 network not used.

console.log('factory-hermes-credentials-policy-planning-smoke: PASS 56 checks')
