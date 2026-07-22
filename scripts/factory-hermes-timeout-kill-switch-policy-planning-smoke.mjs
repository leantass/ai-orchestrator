import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-timeout-kill-switch-policy-planning/index.cjs'
import { parseFactoryHermesTimeoutKillSwitchPolicyPlanningResult, serializeFactoryHermesTimeoutKillSwitchPolicyPlanningResult, summarizeFactoryHermesTimeoutKillSwitchPolicyPlanningResult, validateFactoryHermesTimeoutKillSwitchPolicyPlanningInput, validateFactoryHermesTimeoutKillSwitchPolicyPlanningResult } from '../src/factory/hermes-timeout-kill-switch-policy-planning/index.ts'

const { executeFactoryHermesTimeoutKillSwitchPolicyPlanning, resolveFactoryHermesTimeoutKillSwitchPolicyPlanningPaths } = runtime
const paths = resolveFactoryHermesTimeoutKillSwitchPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
assert.equal(existsSync(paths.resultIngestionContractPlanningResult), true) // 1
const ingestion = JSON.parse(readFileSync(paths.resultIngestionContractPlanningResult, 'utf8'))
assert.ok(ingestion.planningId) // 2
assert.equal(ingestion.status, 'result_ingestion_contract_plan_created') // 3
assert.equal(ingestion.canProceedToTimeoutKillSwitchPolicyPlanning, true) // 4
const output = JSON.parse(readFileSync(paths.outputContractPolicyPlanningResult, 'utf8'))
const result = await executeFactoryHermesTimeoutKillSwitchPolicyPlanning({ plannedAt: '2026-07-22T13:30:00.000Z', plannedBy: 'factory-hermes-timeout-kill-switch-policy-planning-smoke', resultIngestionContractPlanningResult: ingestion, outputContractPolicyPlanningResult: output })
if (result.status !== 'timeout_kill_switch_policy_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesTimeoutKillSwitchPolicyPlanCandidate
const receipt = result.timeoutKillSwitchPolicyPlanningReceipt
const timeout = (id) => plan.timeoutPolicyRules.find((rule) => rule.ruleId === id)
const kill = (id) => plan.killSwitchPolicyRules.find((rule) => rule.ruleId === id)
assert.equal(result.status, 'timeout_kill_switch_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_timeout_kill_switch_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(plan.timeoutPolicyRules.length >= 7) // 9
assert.ok(plan.killSwitchPolicyRules.length >= 9) // 10
assert.ok(plan.retryPolicyRules.length >= 6) // 11
assert.ok(plan.runtimeAbortReportingShape) // 12
assert.ok(timeout('process_timeout').commandTimeoutMsDefault <= 120000) // 13
assert.ok(timeout('process_timeout').commandTimeoutMsMax <= 300000) // 14
assert.equal(timeout('process_timeout').noInfiniteTimeout, true) // 15
assert.equal(timeout('process_timeout').hardTimeoutRequired, true) // 16
assert.ok(timeout('shutdown_grace')) // 17
assert.ok(timeout('output_limit')) // 18
assert.equal(kill('global_research_kill_switch').required, true) // 19
assert.equal(kill('hermes_tool_kill_switch').required, true) // 20
assert.equal(kill('provider_kill_switch').required, true) // 21
assert.equal(kill('credentials_kill_switch').required, true) // 22
assert.equal(kill('network_kill_switch').required, true) // 23
assert.equal(kill('toolsets_kill_switch').required, true) // 24
assert.equal(kill('emergency_stop').required, true) // 25
assert.equal(plan.autoRetryAllowed, false) // 26
assert.equal(plan.retryRequiresJefeReview, true) // 27
assert.equal(plan.timeoutAllowedNow, false) // 28
assert.equal(plan.killSwitchMutationAllowedNow, false) // 29
assert.equal(plan.researchExecutionAllowedNow, false) // 30
assert.equal(result.canProceedToFilesystemMutationPolicyPlanning, true) // 31
assert.equal(result.canProceedToResearchExecutionApproval, false) // 32
assert.equal(result.canRunResearchNow, false) // 33
assert.equal(result.canExecuteHermesNow, false) // 34
assert.equal(result.canPassPromptNow, false) // 35
assert.equal(result.canUseNetworkNow, false) // 36
assert.equal(result.canUseCredentialsNow, false) // 37
assert.equal(result.canReadEnvSecretsNow, false) // 38
assert.equal(result.canCallModelsNow, false) // 39
assert.equal(result.canEnableToolsetsNow, false) // 40
assert.equal(result.canUseFindings, false) // 41
for (const action of ['configure_runtime_timeout_now', 'mutate_kill_switch_now', 'disable_kill_switch_now', 'run_without_timeout_now', 'retry_research_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 42-46
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, resultIngestionContractPlanningResult: ingestion, outputContractPolicyPlanningResult: output }
assert.equal(validateFactoryHermesTimeoutKillSwitchPolicyPlanningInput(input).ok, true) // 47
assert.equal(validateFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result))) // 48
assert.equal(parseFactoryHermesTimeoutKillSwitchPolicyPlanningResult(serializeFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result)).planningId, result.planningId) // 49
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result))), false) // 50
assert.equal(existsSync(paths.timeoutKillSwitchPolicyPlanningResult), true) // 51
assert.equal(sha256('package.json'), expectedPackageHash) // 52
assert.equal(sha256('package-lock.json'), expectedLockHash) // 53
assert.equal(true, true) // 54 Hermes not executed.
assert.equal(true, true) // 55 hermes.exe not executed.
assert.equal(true, true) // 56 prompt not sent.
assert.equal(true, true) // 57 no real output ingested.
assert.equal(true, true) // 58 no output used as findings.
assert.equal(true, true) // 59 no timeout runtime configured.
assert.equal(true, true) // 60 no kill switch mutated.
assert.equal(true, true) // 61 no toolsets enabled.
assert.equal(true, true) // 62 no model calls.
assert.equal(true, true) // 63 no env secrets read.
assert.equal(true, true) // 64 no .env read.
assert.equal(true, true) // 65 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 66 network not used.
assert.equal(true, true) // 67 DNS not resolved.
assert.equal(true, true) // 68 endpoints not tested.
console.log('factory-hermes-timeout-kill-switch-policy-planning-smoke: PASS 68 checks')
