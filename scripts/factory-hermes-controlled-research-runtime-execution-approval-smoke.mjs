import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-execution-approval/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeExecutionApprovalResult, serializeFactoryHermesControlledResearchRuntimeExecutionApprovalResult, summarizeFactoryHermesControlledResearchRuntimeExecutionApprovalResult, validateFactoryHermesControlledResearchRuntimeExecutionApprovalInput, validateFactoryHermesControlledResearchRuntimeExecutionApprovalResult } from '../src/factory/hermes-controlled-research-runtime-execution-approval/index.ts'

const { executeFactoryHermesControlledResearchRuntimeExecutionApproval, resolveFactoryHermesControlledResearchRuntimeExecutionApprovalPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeExecutionApprovalPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { approvedAt: '2026-07-24T02:00:00.000Z', approvedBy: 'factory-hermes-controlled-research-runtime-execution-approval-smoke', executionPlanningResult: {} }

assert.equal(existsSync(paths.executionPlanningResult), true) // 1
JSON.parse(readFileSync(paths.executionPlanningResult, 'utf8')) // 2
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionApprovalInput(input).ok, true) // 3
const result = await executeFactoryHermesControlledResearchRuntimeExecutionApproval(input)
assert.equal(existsSync(paths.executionApprovalResult), true) // 4
assert.ok(['controlled_research_runtime_execution_approval_granted', 'controlled_research_runtime_execution_approval_blocked'].includes(result.status)) // 5
assert.ok(['hermes_controlled_research_runtime_execution_approved_for_final_execution_gate', 'hermes_controlled_research_runtime_execution_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision)) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
if (result.status === 'controlled_research_runtime_execution_approval_granted') {
  for (const key of ['executionPlanReadinessReview', 'runtimeCommandEnvelopePlanReview', 'promptArtifactPlanReview', 'credentialAccessExecutionPlanReview', 'modelNetworkExecutionPlanReview', 'toolsetDisableProofExecutionPlanReview', 'timeoutKillSwitchExecutionPlanReview', 'outputIngestionReviewPlanReview', 'runtimeExecutionSafetyPlanReview', 'executionApprovalLimitationsCarryForward', 'executionApprovalRiskDispositionRegister', 'controlledRuntimeExecutionGateEnvelope']) assert.ok(result[key]) // 8-19
  assert.equal(result.controlledRuntimeExecutionGateAllowed, true) // 20
  assert.equal(result.canProceedToControlledResearchRuntimeExecution, true) // 21
} else {
  assert.ok(result.approvalBlockerPlan) // 22
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 23
}
for (const key of ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 24-42
for (const limitation of ['execution_approval_is_not_execution', 'prompt_not_created_or_approved_yet', 'credential_value_not_read_yet', 'network_not_approved_yet']) assert.equal(result.executionApprovalLimitationsCarryForward.limitations.includes(limitation), true) // 43-46
for (const riskId of ['execution_approval_confused_with_execution', 'final_execution_gate_auto_executes_without_preflight', 'hidden_defaults_loaded_in_real_runtime']) assert.equal(result.executionApprovalRiskDispositionRegister.risks.some((risk) => risk.riskId === riskId), true) // 47-49
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionApprovalInput({ ...input, executionPlanningResult: result }).ok, true) // 50
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result))) // 51
assert.equal(parseFactoryHermesControlledResearchRuntimeExecutionApprovalResult(serializeFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result)).approvalId, result.approvalId) // 52
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result))), false) // 53
assert.equal(existsSync(paths.executionApprovalResult), true) // 54
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 55
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 56
for (const key of ['noAdapterExecution', 'noWrapperAgainstHermes', 'noHermesExecution', 'noHermesExeExecution', 'noOneShot', 'noPromptSent', 'noModelCalls', 'noNetwork', 'noDns', 'noEndpoints', 'noCredentialValuesRead', 'noToolsetsEnabled']) assert.equal(key in result.runtimeExecutionSafetyPlanReview ? result.runtimeExecutionSafetyPlanReview[key] : true, true) // 57-68
assert.equal(result.controlledResearchRuntimeExecutionApprovalReceipt.runtimeExecutionApprovedNow, false) // 69
assert.equal(result.canProceedToResearchRuntimeAdapterExecution, false) // 70
assert.equal(result.canUseFindings, false) // 71
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_GATE_V1.md'), true) // 72
console.log('factory-hermes-controlled-research-runtime-execution-approval-smoke: PASS 72 checks')
