import assert from 'node:assert/strict'
import {
  UV_TOOL_PROFILE_V1,
  evaluateFactoryExternalToolProvisioning,
} from '../src/factory/external-tool-provisioning/index.ts'
import {
  evaluateFactoryExternalToolProvisioningApproval,
  parseFactoryExternalToolProvisioningApprovalResult,
  serializeFactoryExternalToolProvisioningApprovalResult,
  summarizeFactoryExternalToolProvisioningApprovalResult,
  validateFactoryExternalToolProvisioningApprovalInput,
  validateFactoryExternalToolProvisioningApprovalResult,
} from '../src/factory/external-tool-provisioning-approval/index.ts'

const requestedAt = '2026-07-20T01:00:00.000Z'
const reviewedAt = '2026-07-20T01:05:00.000Z'
const humanApprovalRef = 'LEAN-UV-PROVISIONING-APPROVAL-V1'
const provisioningResult = evaluateFactoryExternalToolProvisioning({
  toolProfile: UV_TOOL_PROFILE_V1,
  requestedAt,
  requestedBy: 'factory-external-tool-provisioning-approval-uv-smoke',
  targetPlatform: 'windows-x64-declarative',
  humanApprovalRef: 'LEAN-UV-PROVISIONING-PLAN-CANDIDATE-V1',
})
const input = {
  externalToolProvisioningResult: provisioningResult,
  reviewedAt,
  reviewedBy: 'lean',
  reviewerRole: 'owner',
  humanApprovalRef,
}
const result = evaluateFactoryExternalToolProvisioningApproval(input)
const receipt = result.approvalReceipt
const envelope = result.approvedToolProvisioningEnvelope
const actions = receipt?.notAuthorizedActions ?? []

assert.equal(provisioningResult.status, 'provisioning_plan_candidate_approved') // 1
assert.equal(result.status, 'tool_provisioning_envelope_candidate_approved') // 2
assert.equal(result.toolId, 'uv') // 3
assert.ok(receipt) // 4
assert.ok(envelope) // 5
assert.ok(envelope?.preferredProvisioningMethod) // 6
assert.ok(envelope?.fallbackProvisioningMethod) // 7
assert.ok(envelope?.installRootRef.startsWith('.codex-temp/external-tools/uv/')) // 8
assert.equal(envelope?.installStatus, 'not_installed') // 9
assert.equal(envelope?.executionStatus, 'not_executed') // 10
assert.equal(envelope?.downloadStatus, 'not_downloaded') // 11
assert.equal(envelope?.shellStatus, 'not_allowed') // 12
assert.equal(envelope?.credentialsStatus, 'not_allowed') // 13
assert.equal(result.canInstallNow, false) // 14
assert.equal(result.canExecuteToolNow, false) // 15
assert.equal(result.canUseShell, false) // 16
assert.equal(result.canUseCredentials, false) // 17
assert.equal(result.canMutateProjectFiles, false) // 18
assert.equal(result.canDeploy, false) // 19
assert.ok(actions.includes('install_tool_now')) // 20
assert.ok(actions.includes('execute_tool_now')) // 21
assert.ok(actions.includes('download_binary_now')) // 22
assert.ok(actions.includes('execute_shell')) // 23
assert.ok(actions.includes('execute_cmd')) // 24
assert.ok(actions.includes('execute_powershell')) // 25
assert.ok(actions.includes('execute_pip')) // 26
assert.ok(actions.includes('execute_setup_py')) // 27
assert.ok(actions.includes('retry_hermes_python_runtime_now')) // 28
assert.ok(actions.includes('install_uv_now')) // 29
assert.ok(actions.includes('execute_uv_now')) // 30
assert.equal(evaluateFactoryExternalToolProvisioningApproval({ ...input, externalToolProvisioningResult: undefined }).decision, 'blocked_missing_provisioning_result') // 31
assert.equal(evaluateFactoryExternalToolProvisioningApproval({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 32
assert.equal(evaluateFactoryExternalToolProvisioningApproval({ ...input, externalToolProvisioningResult: { ...provisioningResult, canInstallNow: true } }).decision, 'blocked_insecure_provisioning_candidate') // 33
assert.equal(evaluateFactoryExternalToolProvisioningApproval({ ...input, externalToolProvisioningResult: { ...provisioningResult, canExecuteToolNow: true } }).decision, 'blocked_insecure_provisioning_candidate') // 34
assert.equal(evaluateFactoryExternalToolProvisioningApproval({ ...input, externalToolProvisioningResult: { ...provisioningResult, canUseShell: true } }).decision, 'blocked_insecure_provisioning_candidate') // 35
assert.equal(evaluateFactoryExternalToolProvisioningApproval({ ...input, externalToolProvisioningResult: { ...provisioningResult, canUseCredentials: true } }).decision, 'blocked_insecure_provisioning_candidate') // 36
assert.equal(validateFactoryExternalToolProvisioningApprovalInput(input).ok, true) // 37
assert.equal(validateFactoryExternalToolProvisioningApprovalResult(result).ok, true) // 38
assert.equal(parseFactoryExternalToolProvisioningApprovalResult(serializeFactoryExternalToolProvisioningApprovalResult(result)).approvalId, result.approvalId) // 39
assert.equal(/password|secret|token|api[_-]?key|credential/iu.test(JSON.stringify(summarizeFactoryExternalToolProvisioningApprovalResult(result))), false) // 40
assert.ok(/UV Provisioning Runtime Adapter/iu.test(result.recommendedNextStep) && !/Proceed to Hermes Python Runtime/iu.test(result.recommendedNextStep)) // 41
assert.equal(envelope?.installStatus, 'not_installed') // 42
assert.equal(envelope?.executionStatus, 'not_executed') // 43
assert.equal(envelope?.downloadStatus, 'not_downloaded') // 44
assert.ok(envelope?.forbiddenCommands.includes('pip')) // 45
assert.ok(envelope?.forbiddenCommands.includes('setup.py')) // 46
assert.ok(actions.includes('execute_hermes')) // 47

console.log(JSON.stringify({
  ok: true,
  checks: 47,
  approvalKind: result.approvalKind,
  toolId: result.toolId,
  status: result.status,
  decision: result.decision,
  installStatus: envelope?.installStatus,
  downloadStatus: envelope?.downloadStatus,
  executionStatus: envelope?.executionStatus,
  canInstallNow: result.canInstallNow,
  canExecuteToolNow: result.canExecuteToolNow,
}, null, 2))
