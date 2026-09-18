import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-live-artifact-approval/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult, serializeFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult, summarizeFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult, validateFactoryHermesControlledResearchRuntimeLiveArtifactApprovalInput, validateFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult } from '../src/factory/hermes-controlled-research-runtime-live-artifact-approval/index.ts'

const { executeFactoryHermesControlledResearchRuntimeLiveArtifactApproval, resolveFactoryHermesControlledResearchRuntimeLiveArtifactApprovalPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { approvedAt: '2026-07-23T19:00:00.000Z', approvedBy: 'factory-hermes-controlled-research-runtime-live-artifact-approval-smoke' }

assert.equal(existsSync(paths.liveArtifactPlanningResult), true) // 1
assert.equal(readJson(paths.liveArtifactPlanningResult).status, 'controlled_research_runtime_live_artifact_plan_created') // 2
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactApprovalInput(input).ok, true) // 35
const result = await executeFactoryHermesControlledResearchRuntimeLiveArtifactApproval(input)
assert.equal(existsSync(paths.liveArtifactApprovalResult), true) // 3
assert.equal(['controlled_research_runtime_live_artifact_approval_granted', 'controlled_research_runtime_live_artifact_approval_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_controlled_research_runtime_live_artifact_approved_for_creation_gate', 'hermes_controlled_research_runtime_live_artifact_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision), true) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
if (result.status === 'controlled_research_runtime_live_artifact_approval_granted') {
  assert.ok(result.liveArtifactPlanReview) // 7
  assert.ok(result.liveArtifactApprovalLimitationsCarryForward) // 8
  assert.ok(result.liveArtifactApprovalRiskDispositionRegister) // 9
  assert.ok(result.controlledRuntimeLiveArtifactCreationEnvelope) // 10
  assert.equal(result.liveArtifactCreationGateAllowed, true) // 11
  assert.equal(result.canProceedToControlledResearchRuntimeLiveArtifactCreation, true) // 12
}
for (const key of ['liveArtifactCreationAllowedNow', 'liveTempConfigCreationAllowedNow', 'liveRunRootCreationAllowedNow', 'liveTempConfigCreatedNow', 'liveRunRootCreatedNow', 'controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 13-34
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult(result))) // 36
assert.equal(parseFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult(serializeFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult(result)).approvalId, result.approvalId) // 37
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeLiveArtifactApprovalResult(result))), false) // 38
assert.equal(existsSync(paths.liveArtifactApprovalResult), true) // 39
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 40
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 41
for (const action of ['create_live_artifacts_now', 'create_live_temp_config_now', 'create_run_root_now', 'execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'execute_hermes_now', 'execute_hermes_help_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'read_dotenv_now', 'use_network_now', 'resolve_dns_now', 'test_endpoints_now', 'read_credential_values_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimeLiveArtifactApprovalReceipt.notAuthorizedActions.includes(action), true) // 42-63
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_APPROVAL_GATE_V1.md'), true) // 64
console.log('factory-hermes-controlled-research-runtime-live-artifact-approval-smoke: PASS 64 checks')
