import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-approval/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeApprovalResult, serializeFactoryHermesControlledResearchRuntimeApprovalResult, summarizeFactoryHermesControlledResearchRuntimeApprovalResult, validateFactoryHermesControlledResearchRuntimeApprovalInput, validateFactoryHermesControlledResearchRuntimeApprovalResult } from '../src/factory/hermes-controlled-research-runtime-approval/index.ts'

const { executeFactoryHermesControlledResearchRuntimeApproval, resolveFactoryHermesControlledResearchRuntimeApprovalPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.controlledRuntimePlanningResult), true) // 1
assert.equal(readJson(paths.controlledRuntimePlanningResult).status, 'controlled_research_runtime_plan_created') // 2
const input = { approvedAt: '2026-07-23T15:00:00.000Z', approvedBy: 'factory-hermes-controlled-research-runtime-approval-smoke' }
assert.equal(validateFactoryHermesControlledResearchRuntimeApprovalInput(input).ok, true) // 44
const result = await executeFactoryHermesControlledResearchRuntimeApproval(input)
assert.equal(existsSync(paths.approvalResult), true) // 3
assert.equal(['controlled_research_runtime_approval_granted', 'controlled_research_runtime_approval_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_controlled_research_runtime_approved_for_preparation_gate', 'hermes_controlled_research_runtime_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision), true) // 5
assert.ok(result.controlledRuntimeApprovalStatus) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
if (result.status === 'controlled_research_runtime_approval_granted') {
  assert.ok(result.controlledRuntimePlanReadinessReview) // 8
  assert.ok(result.controlledRuntimeApprovalLimitationsCarryForward) // 9
  assert.ok(result.controlledRuntimeApprovalRiskDispositionRegister) // 10
  assert.ok(result.controlledResearchRuntimePreparationEnvelope) // 11
  assert.equal(result.controlledRuntimePreparationAllowed, true) // 12
}
for (const key of ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'tempConfigCreationApprovedNow', 'runRootCreationApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'findingsUseApprovedNow']) assert.equal(result[key], false) // 13-22
if (result.status === 'controlled_research_runtime_approval_granted') assert.equal(result.canProceedToControlledResearchRuntimePreparation, true) // 23
if (result.status === 'controlled_research_runtime_approval_blocked') { assert.ok(result.controlledResearchRuntimeApprovalBlockerPlan || result.approvalBlockerPlan); assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) } // 24-25
for (const key of ['canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 26-37
assert.equal(result.controlledRuntimeApprovalLimitationsCarryForward.limitations.includes('controlled_runtime_approval_is_not_execution'), true) // 38
assert.equal(result.controlledRuntimeApprovalLimitationsCarryForward.limitations.includes('hidden_defaults_may_still_exist_in_real_cli_runtime'), true) // 39
for (const riskId of ['approval_confused_with_runtime_preparation', 'preparation_confused_with_runtime_execution', 'temp_config_created_without_preparation_policy', 'run_root_created_without_preparation_policy']) assert.equal(result.controlledRuntimeApprovalRiskDispositionRegister.risks.some((risk) => risk.riskId === riskId), true) // 40-43
assert.equal(validateFactoryHermesControlledResearchRuntimeApprovalResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeApprovalResult(result))) // 45
assert.equal(parseFactoryHermesControlledResearchRuntimeApprovalResult(serializeFactoryHermesControlledResearchRuntimeApprovalResult(result)).approvalId, result.approvalId) // 46
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeApprovalResult(result))), false) // 47
assert.equal(existsSync(paths.approvalResult), true) // 48
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 49
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 50
for (const action of ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'create_live_temp_config_now', 'create_run_root_now', 'execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'read_env_secrets_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimeApprovalReceipt.notAuthorizedActions.includes(action), true) // 51-69
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_APPROVAL_GATE_V1.md'), true) // 70
console.log('factory-hermes-controlled-research-runtime-approval-smoke: PASS 70 checks')
