import assert from 'node:assert/strict'
import {
  UV_TOOL_PROFILE_V1,
  evaluateFactoryExternalToolProvisioning,
  parseFactoryExternalToolProvisioningResult,
  serializeFactoryExternalToolProvisioningResult,
  summarizeFactoryExternalToolProvisioningResult,
  validateFactoryExternalToolProvisioningInput,
  validateFactoryExternalToolProvisioningResult,
} from '../src/factory/external-tool-provisioning/index.ts'

const requestedAt = '2026-07-20T00:00:00.000Z'
const requestedBy = 'factory-external-tool-provisioning-uv-profile-smoke'
const targetPlatform = 'windows-x64-declarative'
const humanApprovalRef = 'LEAN-UV-PROVISIONING-PLAN-CANDIDATE-V1'

const approvedInput = {
  toolProfile: UV_TOOL_PROFILE_V1,
  requestedAt,
  requestedBy,
  targetPlatform,
  requestedReason: 'Create uv provisioning plan candidate for future Hermes Python runtime support.',
  humanApprovalRef,
  environmentSnapshot: {
    uvStatus: 'missing_from_path_based_on_previous_runtime',
    detectionSource: 'previous_runtime_result_only',
  },
}

const result = evaluateFactoryExternalToolProvisioning(approvedInput)
const plan = result.provisioningPlanCandidate
const includes = (items, pattern) => items.some((item) => pattern.test(item))

assert.ok(UV_TOOL_PROFILE_V1) // 1
assert.equal(UV_TOOL_PROFILE_V1.toolId, 'uv') // 2
assert.equal(UV_TOOL_PROFILE_V1.toolCategory, 'python_package_manager_runtime') // 3
assert.ok(includes(UV_TOOL_PROFILE_V1.requiredFor, /Hermes Python Install Runtime/iu)) // 4
assert.equal(UV_TOOL_PROFILE_V1.currentKnownStatus.status, 'missing_from_path_based_on_previous_runtime') // 5
assert.ok(UV_TOOL_PROFILE_V1.allowedFutureCommands.includes('uv --version')) // 6
assert.ok(includes(UV_TOOL_PROFILE_V1.allowedFutureCommands, /^uv venv\b/iu)) // 7
assert.ok(includes(UV_TOOL_PROFILE_V1.allowedFutureCommands, /^uv sync --locked\b/iu)) // 8
assert.ok(UV_TOOL_PROFILE_V1.forbiddenCommands.includes('uv run')) // 9
assert.ok(UV_TOOL_PROFILE_V1.forbiddenCommands.includes('uv pip install')) // 10
assert.ok(UV_TOOL_PROFILE_V1.forbiddenCommands.includes('pip')) // 11
assert.ok(UV_TOOL_PROFILE_V1.forbiddenCommands.includes('python -m pip')) // 12
assert.ok(UV_TOOL_PROFILE_V1.forbiddenCommands.includes('setup.py')) // 13
assert.ok(UV_TOOL_PROFILE_V1.forbiddenCommands.includes('shell/cmd/PowerShell')) // 14
assert.ok(plan) // 15
assert.equal(plan?.preferredProvisioningMethod, 'system_path_existing_uv') // 16
assert.equal(plan?.fallbackProvisioningMethod, 'local_uv_binary_under_codex_temp') // 17
assert.ok(plan?.installRootRef.startsWith('.codex-temp/external-tools/uv/')) // 18
assert.equal(result.canInstallNow, false) // 19
assert.equal(result.canExecuteToolNow, false) // 20
assert.equal(result.canUseShell, false) // 21
assert.equal(result.canUseCredentials, false) // 22
assert.equal(result.canMutateProjectFiles, false) // 23
assert.equal(result.canDeploy, false) // 24
assert.ok(plan?.notAuthorizedActions.includes('install_uv_now')) // 25
assert.ok(plan?.notAuthorizedActions.includes('execute_uv_now')) // 26
assert.ok(plan?.notAuthorizedActions.includes('execute_shell')) // 27
assert.ok(plan?.notAuthorizedActions.includes('execute_cmd')) // 28
assert.ok(plan?.notAuthorizedActions.includes('execute_powershell')) // 29
assert.ok(plan?.notAuthorizedActions.includes('execute_pip')) // 30
assert.ok(plan?.notAuthorizedActions.includes('execute_setup_py')) // 31
assert.ok(plan?.notAuthorizedActions.includes('retry_hermes_python_runtime_now')) // 32
assert.equal(evaluateFactoryExternalToolProvisioning({ ...approvedInput, humanApprovalRef: undefined }).status, 'human_review_required') // 33

const shellUnsafeProfile = {
  ...UV_TOOL_PROFILE_V1,
  provisioningMethods: UV_TOOL_PROFILE_V1.provisioningMethods.map((method) => method.methodId === 'system_path_existing_uv' ? { ...method, requiresShell: true } : method),
}
assert.equal(evaluateFactoryExternalToolProvisioning({ ...approvedInput, toolProfile: shellUnsafeProfile }).decision, 'blocked_insecure_provisioning_method') // 34

const credentialUnsafeProfile = {
  ...UV_TOOL_PROFILE_V1,
  provisioningMethods: UV_TOOL_PROFILE_V1.provisioningMethods.map((method) => method.methodId === 'system_path_existing_uv' ? { ...method, requiresCredentials: true } : method),
}
assert.equal(evaluateFactoryExternalToolProvisioning({ ...approvedInput, toolProfile: credentialUnsafeProfile }).decision, 'blocked_insecure_provisioning_method') // 35
assert.equal(validateFactoryExternalToolProvisioningInput(approvedInput).ok, true) // 36
assert.equal(validateFactoryExternalToolProvisioningResult(result).ok, true) // 37
assert.equal(parseFactoryExternalToolProvisioningResult(serializeFactoryExternalToolProvisioningResult(result)).provisioningId, result.provisioningId) // 38
assert.equal(/password|secret|token|api[_-]?key|credential/iu.test(JSON.stringify(summarizeFactoryExternalToolProvisioningResult(result))), false) // 39
assert.ok(/UV Provisioning Approval\/Runtime/iu.test(result.recommendedNextStep) && !/Proceed to Hermes Python Runtime/iu.test(result.recommendedNextStep)) // 40
assert.equal(result.canInstallNow, false) // 41
assert.equal(result.canExecuteToolNow, false) // 42
assert.equal(plan?.sourcePolicy.futureVerificationRequired, true) // 43
assert.equal(plan?.forbiddenCommands.includes('pip'), true) // 44
assert.equal(plan?.forbiddenCommands.includes('setup.py'), true) // 45
assert.equal(plan?.notAuthorizedActions.includes('execute_hermes'), true) // 46

console.log(JSON.stringify({
  ok: true,
  checks: 46,
  provisioningKind: result.provisioningKind,
  toolId: result.toolId,
  status: result.status,
  decision: result.decision,
  preferredProvisioningMethod: plan?.preferredProvisioningMethod,
  fallbackProvisioningMethod: plan?.fallbackProvisioningMethod,
  canInstallNow: result.canInstallNow,
  canExecuteToolNow: result.canExecuteToolNow,
}, null, 2))
