import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-execution-planning/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeExecutionPlanningResult, serializeFactoryHermesControlledResearchRuntimeExecutionPlanningResult, summarizeFactoryHermesControlledResearchRuntimeExecutionPlanningResult, validateFactoryHermesControlledResearchRuntimeExecutionPlanningInput, validateFactoryHermesControlledResearchRuntimeExecutionPlanningResult } from '../src/factory/hermes-controlled-research-runtime-execution-planning/index.ts'

const { executeFactoryHermesControlledResearchRuntimeExecutionPlanning, resolveFactoryHermesControlledResearchRuntimeExecutionPlanningPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeExecutionPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { plannedAt: '2026-07-24T01:00:00.000Z', plannedBy: 'factory-hermes-controlled-research-runtime-execution-planning-smoke', liveArtifactVerificationReviewResult: {} }

assert.equal(existsSync(paths.liveArtifactVerificationReviewResult), true) // 1
JSON.parse(readFileSync(paths.liveArtifactVerificationReviewResult, 'utf8')) // 2
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionPlanningInput(input).ok, true) // 3
const result = await executeFactoryHermesControlledResearchRuntimeExecutionPlanning(input)
assert.equal(existsSync(paths.executionPlanningResult), true) // 4
assert.ok(['controlled_research_runtime_execution_plan_created', 'controlled_research_runtime_execution_plan_blocked'].includes(result.status)) // 5
assert.ok(['hermes_controlled_research_runtime_execution_plan_created_for_approval', 'hermes_controlled_research_runtime_execution_plan_blocked_unsafe_or_incomplete'].includes(result.decision)) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
if (result.status === 'controlled_research_runtime_execution_plan_created') {
  for (const key of ['runtimeCommandEnvelopePlan', 'promptArtifactPlan', 'credentialAccessExecutionPlan', 'modelNetworkExecutionPlan', 'toolsetDisableProofExecutionPlan', 'timeoutKillSwitchExecutionPlan', 'outputIngestionReviewPlan', 'runtimeExecutionSafetyPlan', 'executionPlanningRiskRegister', 'controlledRuntimeExecutionApprovalEnvelope']) assert.ok(result[key]) // 8-17
  assert.equal(result.canProceedToControlledResearchRuntimeExecutionApproval, true) // 18
} else {
  assert.equal(result.canProceedToControlledResearchRuntimeExecutionApproval, false) // 18
}
assert.equal(result.runtimeCommandEnvelopePlan.commandString, null) // 19
assert.equal(result.runtimeCommandEnvelopePlan.argv.length, 0) // 20
assert.deepEqual(result.runtimeCommandEnvelopePlan.env, {}) // 21
assert.equal(result.runtimeCommandEnvelopePlan.prompt, null) // 22
assert.equal(result.promptArtifactPlan.promptArtifactAllowedNow, false) // 23
assert.equal(result.credentialAccessExecutionPlan.credentialValuesReadNow, false) // 24
assert.equal(result.modelNetworkExecutionPlan.modelCallsAllowedNow, false) // 25
assert.equal(result.modelNetworkExecutionPlan.networkAllowedNow, false) // 26
assert.equal(result.toolsetDisableProofExecutionPlan.toolsetEnablementAllowedNow, false) // 27
assert.equal(result.outputIngestionReviewPlan.outputIngestionAllowedNow, false) // 28
assert.equal(result.outputIngestionReviewPlan.findingsUseAllowedNow, false) // 29
for (const key of ['canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 30-41
for (const riskId of ['execution_planning_confused_with_runtime_execution', 'future_command_envelope_accidentally_runnable', 'prompt_created_or_sent_too_early', 'credential_value_read_too_early', 'hidden_defaults_loaded_in_real_runtime', 'findings_used_without_ingestion_review']) assert.equal(result.executionPlanningRiskRegister.risks.some((risk) => risk.riskId === riskId), true) // 42-47
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionPlanningInput({ ...input, liveArtifactVerificationReviewResult: result }).ok, true) // 48
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result))) // 49
assert.equal(parseFactoryHermesControlledResearchRuntimeExecutionPlanningResult(serializeFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result)).planningId, result.planningId) // 50
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result))), false) // 51
assert.equal(existsSync(paths.executionPlanningResult), true) // 52
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 53
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 54
for (const key of ['researchExecutionApprovedNow', 'adapterExecutionAllowedNow', 'wrapperExecutionAllowedNow', 'hermesExecutionAllowedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow']) assert.equal(result.runtimeExecutionSafetyPlan[key], false) // 55-62
assert.equal(result.modelNetworkExecutionPlan.networkAllowedNow, false) // 63
assert.equal(result.modelNetworkExecutionPlan.dnsAllowedNow, false) // 64
assert.equal(result.modelNetworkExecutionPlan.endpointTestsAllowedNow, false) // 65
assert.equal(result.credentialAccessExecutionPlan.envSecretReadAllowedNow, false) // 66
assert.equal(result.credentialAccessExecutionPlan.dotEnvReadAllowedNow, false) // 67
assert.equal(result.credentialAccessExecutionPlan.credentialValuesReadNow, false) // 68
assert.equal(result.toolsetDisableProofExecutionPlan.toolsetEnablementAllowedNow, false) // 69
assert.equal(result.controlledResearchRuntimeExecutionPlanningReceipt.runtimeExecutionApproved, false) // 70
assert.equal(result.runtimeCommandEnvelopePlan.executableCommandBuiltNow, false) // 71
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_GATE_V1.md'), true) // 72
console.log('factory-hermes-controlled-research-runtime-execution-planning-smoke: PASS 72 checks')
