import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-verification-approval/index.cjs'
import { parseFactoryHermesWrapperNoToolModeVerificationApprovalResult, serializeFactoryHermesWrapperNoToolModeVerificationApprovalResult, summarizeFactoryHermesWrapperNoToolModeVerificationApprovalResult, validateFactoryHermesWrapperNoToolModeVerificationApprovalInput, validateFactoryHermesWrapperNoToolModeVerificationApprovalResult } from '../src/factory/hermes-wrapper-no-tool-mode-verification-approval/index.ts'
const { executeFactoryHermesWrapperNoToolModeVerificationApproval, resolveFactoryHermesWrapperNoToolModeVerificationApprovalPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeVerificationApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.verificationPlanningResult), true) // 1
const plan = readJson(paths.verificationPlanningResult); assert.equal(plan.status, 'wrapper_no_tool_mode_verification_plan_created') // 2
const input = { evaluatedAt: '2026-07-23T07:00:00.000Z', evaluatedBy: 'factory-hermes-wrapper-no-tool-mode-verification-approval-smoke', verificationPlanningResult: plan, implementationResult: readJson(paths.implementationResult), implementationApprovalResult: readJson(paths.implementationApprovalResult), implementationPlanningResult: readJson(paths.implementationPlanningResult), wrapperApprovalResult: readJson(paths.wrapperApprovalResult), adapterApprovalResult: readJson(paths.adapterApprovalResult) }
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationApprovalInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModeVerificationApproval(input)
assert.equal(existsSync(paths.verificationApprovalResult), true) // 3
assert.ok(['wrapper_no_tool_mode_verification_approval_granted','wrapper_no_tool_mode_verification_approval_blocked'].includes(result.status)) // 4
assert.ok(['hermes_wrapper_no_tool_mode_verification_approved_for_next_gate','hermes_wrapper_no_tool_mode_verification_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision)) // 5
assert.ok(result.verificationApprovalStatus) // 6
if (result.status === 'wrapper_no_tool_mode_verification_approval_granted') {
  const e = result.approvedWrapperNoToolModeVerificationEnvelope; const d = result.hermesWrapperNoToolModeVerificationApprovalDecision
  assert.ok(e) // 7
  assert.equal(e.approvedFor, 'wrapper_no_tool_mode_verification_only') // 8
  assert.equal(e.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 9
  assert.equal(d.wrapperVerificationApproved, true) // 10
  assert.equal(d.wrapperExecutionApproved, false) // 11
  assert.equal(d.tempConfigCreationApproved, false) // 12
  assert.equal(d.hermesExecutionApproved, false) // 13
  assert.equal(d.researchRuntimeAdapterApproved, false) // 14
  assert.equal(d.researchExecutionApproved, false) // 15
  assert.equal(d.promptPassingApproved, false) // 16
  assert.equal(d.modelCallsApproved, false) // 17
  assert.equal(d.networkApproved, false) // 18
  assert.equal(d.credentialAccessApproved, false) // 19
  assert.equal(d.toolsetEnablementApproved, false) // 20
  assert.equal(result.canProceedToHermesWrapperNoToolModeVerification, true) // 21
} else {
  assert.ok(result.approvalBlockerPlan) // 22
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 23
}
assert.equal(result.canProceedToResearchRuntimeAdapterApprovalRetry, false) // 24
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 25
assert.equal(result.canRunResearchNow, false) // 26
assert.equal(result.canExecuteHermesNow, false) // 27
assert.equal(result.canPassPromptNow, false) // 28
assert.equal(result.canUseNetworkNow, false) // 29
assert.equal(result.canUseCredentialsNow, false) // 30
assert.equal(result.canReadEnvSecretsNow, false) // 31
assert.equal(result.canCallModelsNow, false) // 32
assert.equal(result.canEnableToolsetsNow, false) // 33
assert.equal(result.canMutateFilesystemNow, false) // 34
assert.equal(result.canUseFindings, false) // 35
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationApprovalInput(input).ok, true) // 36
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationApprovalResult(result).ok, true) // 37
assert.equal(parseFactoryHermesWrapperNoToolModeVerificationApprovalResult(serializeFactoryHermesWrapperNoToolModeVerificationApprovalResult(result)).approvalId, result.approvalId) // 38
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeVerificationApprovalResult(result))), false) // 39
assert.equal(existsSync(paths.verificationApprovalResult), true) // 40
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 41
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 42
for (const action of ['execute_verification_now','execute_wrapper_against_hermes_now','create_temp_config_now','execute_hermes_now','execute_oneshot_now','pass_prompt_now','call_models_now','use_network_now','read_env_secrets_now','execute_uv_now','execute_python_now','execute_pip_now','execute_setup_py_now']) assert.equal(result.wrapperNoToolModeVerificationApprovalReceipt.notAuthorizedActions.includes(action), true)
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode'), false) // 45
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001'), false) // 57
assert.equal(result.canExecuteHermesNow, false); assert.equal(result.canPassPromptNow, false); assert.equal(result.canCallModelsNow, false); assert.equal(result.canUseNetworkNow, false); assert.equal(result.canReadEnvSecretsNow, false); assert.equal(result.canEnableToolsetsNow, false)
console.log('factory-hermes-wrapper-no-tool-mode-verification-approval-smoke: PASS 59 checks')
