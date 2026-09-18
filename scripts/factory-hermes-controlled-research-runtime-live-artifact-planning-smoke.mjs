import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-live-artifact-planning/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult, serializeFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult, summarizeFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult, validateFactoryHermesControlledResearchRuntimeLiveArtifactPlanningInput, validateFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult } from '../src/factory/hermes-controlled-research-runtime-live-artifact-planning/index.ts'

const { executeFactoryHermesControlledResearchRuntimeLiveArtifactPlanning, resolveFactoryHermesControlledResearchRuntimeLiveArtifactPlanningPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactPlanningPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { plannedAt: '2026-07-23T18:00:00.000Z', plannedBy: 'factory-hermes-controlled-research-runtime-live-artifact-planning-smoke' }

assert.equal(existsSync(paths.preparationReviewResult), true) // 1
assert.equal(readJson(paths.preparationReviewResult).status, 'controlled_research_runtime_preparation_review_completed') // 2
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactPlanningInput(input).ok, true) // 51
const result = await executeFactoryHermesControlledResearchRuntimeLiveArtifactPlanning(input)
assert.equal(existsSync(paths.liveArtifactPlanningResult), true) // 3
assert.equal(['controlled_research_runtime_live_artifact_plan_created', 'controlled_research_runtime_live_artifact_plan_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_controlled_research_runtime_live_artifact_plan_created_for_approval', 'hermes_controlled_research_runtime_live_artifact_plan_blocked_unsafe_or_incomplete'].includes(result.decision), true) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
if (result.status === 'controlled_research_runtime_live_artifact_plan_created') {
  for (const key of ['liveTempConfigCreationPlan', 'liveRunRootCreationPlan', 'filesystemMutationAllowlistPlan', 'secretRedactionPlan', 'artifactSafetyCheckPlan', 'preRuntimeVerificationPlan', 'liveArtifactPlanningRiskRegister', 'controlledRuntimeLiveArtifactApprovalEnvelope']) assert.ok(result[key]) // 7-14
  for (const key of ['liveTempConfigCreationPlanBuilt', 'liveRunRootCreationPlanBuilt', 'filesystemMutationAllowlistPlanBuilt', 'secretRedactionPlanBuilt', 'artifactSafetyCheckPlanBuilt', 'preRuntimeVerificationPlanBuilt', 'liveArtifactApprovalEnvelopeBuilt']) assert.equal(result[key], true) // 15-21
  assert.equal(result.canProceedToControlledResearchRuntimeLiveArtifactApproval, true) // 32
}
for (const key of ['liveTempConfigCreationAllowedNow', 'liveRunRootCreationAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeLiveArtifactCreation', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 22-45
for (const riskId of ['live_artifact_planning_confused_with_creation', 'temp_config_created_too_early', 'run_root_created_too_early', 'credential_value_written_to_artifact', 'pre_runtime_verification_skipped']) assert.equal(result.liveArtifactPlanningRiskRegister.risks.some((risk) => risk.riskId === riskId), true) // 46-50
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult(result))) // 52
assert.equal(parseFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult(serializeFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult(result)).planningId, result.planningId) // 53
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeLiveArtifactPlanningResult(result))), false) // 54
assert.equal(existsSync(paths.liveArtifactPlanningResult), true) // 55
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 56
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 57
for (const action of ['create_live_artifacts_now', 'create_live_temp_config_now', 'create_run_root_now', 'execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'execute_hermes_now', 'execute_hermes_help_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'read_dotenv_now', 'use_network_now', 'resolve_dns_now', 'test_endpoints_now', 'read_credential_values_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimeLiveArtifactPlanningReceipt.notAuthorizedActions.includes(action), true) // 58-76
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_PLANNING_GATE_V1.md'), true) // 77
console.log('factory-hermes-controlled-research-runtime-live-artifact-planning-smoke: PASS 77 checks')
