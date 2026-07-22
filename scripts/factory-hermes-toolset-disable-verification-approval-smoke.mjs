import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-toolset-disable-verification-approval/index.cjs'
import { parseFactoryHermesToolsetDisableVerificationApprovalResult, serializeFactoryHermesToolsetDisableVerificationApprovalResult, summarizeFactoryHermesToolsetDisableVerificationApprovalResult, validateFactoryHermesToolsetDisableVerificationApprovalInput, validateFactoryHermesToolsetDisableVerificationApprovalResult } from '../src/factory/hermes-toolset-disable-verification-approval/index.ts'

const { executeFactoryHermesToolsetDisableVerificationApproval, resolveFactoryHermesToolsetDisableVerificationApprovalPaths } = runtime
const paths = resolveFactoryHermesToolsetDisableVerificationApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.planningResult), true) // 1
const planning = readJson(paths.planningResult)
assert.equal(planning.status, 'toolset_disable_verification_plan_created') // 2
const input = { evaluatedAt: '2026-07-22T23:00:00.000Z', evaluatedBy: 'factory-hermes-toolset-disable-verification-approval-smoke', toolsetDisableVerificationPlanningResult: planning, researchRuntimeAdapterApprovalResult: readJson(paths.adapterApprovalResult) }
assert.equal(validateFactoryHermesToolsetDisableVerificationApprovalInput(input).ok, true)
const result = await executeFactoryHermesToolsetDisableVerificationApproval(input)
assert.equal(existsSync(paths.approvalResult), true) // 3
assert.ok(['toolset_disable_verification_approval_granted', 'toolset_disable_verification_approval_blocked'].includes(result.status)) // 4
assert.ok(['hermes_toolset_disable_verification_approved_for_controlled_probe_runtime_candidate', 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape'].includes(result.decision)) // 5
assert.ok(result.approvalStatus) // 6
assert.ok(result.sourceSafetyAssessment) // 7
assert.equal(result.toolsetDisableVerificationApprovalDecision.executionApprovedNow, false) // 8
if (result.status === 'toolset_disable_verification_approval_granted') {
  assert.ok(result.controlledToolsetProbeEnvelope) // 9
  assert.ok(result.controlledToolsetProbeEnvelope.exactCommandCandidate.length > 0) // 10
  assert.equal(result.canProceedToToolsetDisableVerificationRuntimeAdapter, true) // 11
} else {
  assert.ok(result.approvalBlockerPlan) // 12
  assert.equal(result.canProceedToRuntimeSelectionRevisionPlanning, true) // 13
}
assert.equal(result.canProceedToResearchRuntimeAdapterApprovalRetry, false) // 14
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 15
assert.equal(result.canRunResearchNow, false) // 16
assert.equal(result.canExecuteHermesNow, false) // 17
assert.equal(result.canPassPromptNow, false) // 18
assert.equal(result.canUseNetworkNow, false) // 19
assert.equal(result.canUseCredentialsNow, false) // 20
assert.equal(result.canReadEnvSecretsNow, false) // 21
assert.equal(result.canCallModelsNow, false) // 22
assert.equal(result.canEnableToolsetsNow, false) // 23
assert.equal(result.canMutateFilesystemNow, false) // 24
assert.equal(result.canUseFindings, false) // 25
assert.equal(validateFactoryHermesToolsetDisableVerificationApprovalInput(input).ok, true) // 26
assert.equal(validateFactoryHermesToolsetDisableVerificationApprovalResult(result).ok, true) // 27
assert.equal(parseFactoryHermesToolsetDisableVerificationApprovalResult(serializeFactoryHermesToolsetDisableVerificationApprovalResult(result)).approvalId, result.approvalId) // 28
assert.equal(JSON.stringify(summarizeFactoryHermesToolsetDisableVerificationApprovalResult(result)).includes('sk-'), false) // 29
assert.equal(existsSync(paths.approvalResult), true) // 30
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 31
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 32
for (const action of ['execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'call_models_now', 'read_env_secrets_now', 'use_network_now', 'validate_toolsets_by_execution_now', 'execute_uv_now', 'execute_pip_now', 'execute_python_now', 'execute_setup_py_now']) assert.equal(result.toolsetDisableVerificationApprovalReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.canExecuteHermesNow, false) // 33
assert.equal(result.canPassPromptNow, false) // 34
assert.equal(result.canCallModelsNow, false) // 35
assert.equal(result.canReadEnvSecretsNow, false) // 36
assert.equal(result.canUseNetworkNow, false) // 37
assert.equal(result.canUseCredentialsNow, false) // 38
assert.equal(result.sourceSafetyAssessment.safeProbeShapeProven, false) // 39
assert.equal(result.sourceSafetyAssessment.exactCommandCandidateProven, false) // 40
assert.equal(result.sourceSafetyAssessment.noToolsetsTextOnlyIsHermesSyntax, false) // 41
assert.equal(result.sourceSafetyAssessment.noMcpDisablesAllTools, false) // 42
assert.equal(result.toolsetDisableVerificationApprovalDecision.runtimeAdapterApproved, false) // 43
assert.equal(result.canMutateFilesystemNow, false) // 44
assert.equal(result.canEnableToolsetsNow, false) // 45
assert.equal(result.canUseFindings, false) // 46

console.log('factory-hermes-toolset-disable-verification-approval-smoke: PASS 46 checks')
