import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-planning/index.cjs'
import { parseFactoryHermesControlledResearchRuntimePlanningResult, serializeFactoryHermesControlledResearchRuntimePlanningResult, summarizeFactoryHermesControlledResearchRuntimePlanningResult, validateFactoryHermesControlledResearchRuntimePlanningInput, validateFactoryHermesControlledResearchRuntimePlanningResult } from '../src/factory/hermes-controlled-research-runtime-planning/index.ts'

const { executeFactoryHermesControlledResearchRuntimePlanning, resolveFactoryHermesControlledResearchRuntimePlanningPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimePlanningPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.researchExecutionApprovalResult), true) // 1
assert.equal(readJson(paths.researchExecutionApprovalResult).status, 'research_execution_approval_granted') // 2
const input = { plannedAt: '2026-07-23T14:00:00.000Z', plannedBy: 'factory-hermes-controlled-research-runtime-planning-smoke' }
assert.equal(validateFactoryHermesControlledResearchRuntimePlanningInput(input).ok, true) // 55
const result = await executeFactoryHermesControlledResearchRuntimePlanning(input)
assert.equal(existsSync(paths.planningResult), true) // 3
assert.equal(['controlled_research_runtime_plan_created', 'controlled_research_runtime_plan_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_controlled_research_runtime_plan_created_for_approval', 'hermes_controlled_research_runtime_plan_blocked_unsafe_runtime_surface'].includes(result.decision), true) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
for (const key of ['controlledRuntimeBoundaryPlan', 'controlledRuntimeTempConfigPolicyPlan', 'controlledRuntimeRunRootPolicyPlan', 'controlledRuntimeCredentialAccessPolicyPlan', 'controlledRuntimePromptPassingPolicyPlan', 'controlledRuntimeModelNetworkPolicyPlan', 'controlledRuntimeToolsetDisablePolicyPlan', 'controlledRuntimeTimeoutKillSwitchPolicyPlan', 'controlledRuntimeOutputIngestionPolicyPlan', 'controlledRuntimeRiskRegister']) assert.ok(result[key]) // 7-16
if (result.status === 'controlled_research_runtime_plan_created') {
  assert.ok(result.controlledResearchRuntimeApprovalEnvelope) // 17
  for (const key of ['controlledRuntimeBoundaryPlanned', 'tempConfigPolicyPlanned', 'runRootPolicyPlanned', 'credentialAccessPolicyPlanned', 'promptPassingPolicyPlanned', 'modelNetworkPolicyPlanned', 'toolsetDisablePolicyPlanned', 'timeoutKillSwitchPolicyPlanned', 'outputIngestionPolicyPlanned']) assert.equal(result[key], true) // 18-26
}
for (const key of ['tempConfigCreationAllowedNow', 'runRootCreationAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseAllowedNow']) assert.equal(result[key], false) // 27-34
if (result.status === 'controlled_research_runtime_plan_created') assert.equal(result.canProceedToControlledResearchRuntimeApproval, true) // 35
for (const key of ['canProceedToControlledResearchRuntimePreparation', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 36-48
for (const riskId of ['planning_confused_with_runtime_execution', 'temp_config_created_too_early', 'run_root_created_too_early', 'credential_value_read_too_early', 'hidden_defaults_loaded_in_real_runtime', 'raw_output_promoted_without_review']) assert.equal(result.controlledRuntimeRiskRegister.risks.some((risk) => risk.riskId === riskId), true) // 49-54
assert.equal(validateFactoryHermesControlledResearchRuntimePlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimePlanningResult(result))) // 56
assert.equal(parseFactoryHermesControlledResearchRuntimePlanningResult(serializeFactoryHermesControlledResearchRuntimePlanningResult(result)).planningId, result.planningId) // 57
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimePlanningResult(result))), false) // 58
assert.equal(existsSync(paths.planningResult), true) // 59
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 60
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 61
for (const action of ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'create_temp_config_now', 'create_run_root_now', 'execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'read_env_secrets_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimePlanningReceipt.notAuthorizedActions.includes(action), true) // 62-79
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PLANNING_GATE_V1.md'), true) // 80
console.log('factory-hermes-controlled-research-runtime-planning-smoke: PASS 80 checks')
