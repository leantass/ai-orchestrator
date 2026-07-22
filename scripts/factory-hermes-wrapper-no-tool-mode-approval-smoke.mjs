import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-approval/index.cjs'
import {
  parseFactoryHermesWrapperNoToolModeApprovalResult,
  serializeFactoryHermesWrapperNoToolModeApprovalResult,
  summarizeFactoryHermesWrapperNoToolModeApprovalResult,
  validateFactoryHermesWrapperNoToolModeApprovalInput,
  validateFactoryHermesWrapperNoToolModeApprovalResult,
} from '../src/factory/hermes-wrapper-no-tool-mode-approval/index.ts'

const { executeFactoryHermesWrapperNoToolModeApproval, resolveFactoryHermesWrapperNoToolModeApprovalPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.wrapperPlanningResult), true) // 1
const planning = readJson(paths.wrapperPlanningResult)
assert.equal(planning.status, 'wrapper_no_tool_mode_plan_created') // 2
assert.equal(planning.decision, 'hermes_wrapper_no_tool_mode_plan_created_for_approval') // 3
assert.equal(planning.canProceedToHermesWrapperNoToolModeApproval, true) // 4
assert.equal(planning.canRunResearchNow, false) // 5
assert.equal(existsSync(paths.runtimeSelectionRevisionPlanningResult), true) // 6
assert.equal(existsSync(paths.toolsetDisableVerificationApprovalResult), true) // 7
assert.equal(existsSync(paths.researchRuntimeAdapterApprovalResult), true) // 8

const input = {
  evaluatedAt: '2026-07-23T02:00:00.000Z',
  evaluatedBy: 'factory-hermes-wrapper-no-tool-mode-approval-smoke',
  wrapperNoToolModePlanningResult: planning,
  runtimeSelectionRevisionPlanningResult: readJson(paths.runtimeSelectionRevisionPlanningResult),
  toolsetDisableVerificationApprovalResult: readJson(paths.toolsetDisableVerificationApprovalResult),
  researchRuntimeAdapterApprovalResult: readJson(paths.researchRuntimeAdapterApprovalResult),
  runtimeSelectionDecisionResult: readJson(paths.runtimeSelectionDecisionResult),
  finalExecutionApprovalResult: readJson(paths.finalExecutionApprovalResult),
}

assert.equal(validateFactoryHermesWrapperNoToolModeApprovalInput(input).ok, true) // 9
const result = await executeFactoryHermesWrapperNoToolModeApproval(input)
assert.equal(existsSync(paths.approvalResult), true) // 10
assert.ok(['wrapper_no_tool_mode_approval_granted', 'wrapper_no_tool_mode_approval_blocked'].includes(result.status)) // 11
assert.ok(['hermes_wrapper_no_tool_mode_approved_for_implementation_planning', 'hermes_wrapper_no_tool_mode_approval_blocked_no_safe_wrapper_plan'].includes(result.decision)) // 12
assert.ok(['approved_for_implementation_planning', 'blocked'].includes(result.approvalStatus)) // 13
assert.ok(result.hermesWrapperNoToolModeApprovalDecision) // 14
assert.ok(result.wrapperNoToolModeApprovalReceipt) // 15

if (result.status === 'wrapper_no_tool_mode_approval_granted') {
  const envelope = result.approvedWrapperNoToolModeImplementationPlanningEnvelope
  assert.ok(envelope) // 16
  assert.equal(envelope.approvedFor, 'wrapper_no_tool_mode_implementation_planning_only') // 17
  assert.equal(envelope.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 18
  assert.equal(envelope.sourceMutationAllowed, false) // 19
  assert.equal(envelope.hermesSourceReadOnly, true) // 20
  assert.equal(envelope.wrapperImplementationAllowedNow, false) // 21
  assert.equal(envelope.wrapperExecutionAllowedNow, false) // 22
  assert.equal(envelope.researchRuntimeAdapterAllowedNow, false) // 23
  assert.equal(envelope.researchExecutionAllowedNow, false) // 24
  assert.ok(envelope.futureImplementationPlanningMustDefine.length >= 8) // 25
  assert.equal(result.canProceedToHermesWrapperNoToolModeImplementationPlanning, true) // 26
} else {
  assert.ok(result.approvalBlockerPlan) // 16
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 17
}

for (const key of [
  'canProceedToHermesWrapperNoToolModeImplementation',
  'canProceedToResearchRuntimeAdapterApprovalRetry',
  'canProceedToResearchRuntimeAdapter',
  'canRunResearchNow',
  'canExecuteHermesNow',
  'canPassPromptNow',
  'canUseNetworkNow',
  'canUseCredentialsNow',
  'canReadEnvSecretsNow',
  'canCallModelsNow',
  'canEnableToolsetsNow',
  'canMutateFilesystemNow',
  'canUseFindings',
]) assert.equal(result[key], false)

assert.equal(validateFactoryHermesWrapperNoToolModeApprovalResult(result).ok, true) // 40
assert.equal(parseFactoryHermesWrapperNoToolModeApprovalResult(serializeFactoryHermesWrapperNoToolModeApprovalResult(result)).approvalId, result.approvalId) // 41
const summaryText = JSON.stringify(summarizeFactoryHermesWrapperNoToolModeApprovalResult(result))
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(summaryText), false) // 42
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 43
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 44

for (const action of [
  'implement_wrapper_now',
  'execute_wrapper_now',
  'modify_hermes_source_now',
  'execute_hermes_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'call_models_now',
  'use_network_now',
  'read_env_secrets_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
]) assert.equal(result.wrapperNoToolModeApprovalReceipt.notAuthorizedActions.includes(action), true)

assert.equal(result.hermesWrapperNoToolModeApprovalDecision.wrapperImplementationApproved, false)
assert.equal(result.hermesWrapperNoToolModeApprovalDecision.wrapperExecutionApproved, false)
assert.equal(result.hermesWrapperNoToolModeApprovalDecision.researchRuntimeAdapterApproved, false)
assert.equal(result.hermesWrapperNoToolModeApprovalDecision.researchExecutionApproved, false)
assert.equal(result.canExecuteHermesNow, false)
assert.equal(result.canPassPromptNow, false)
assert.equal(result.canCallModelsNow, false)
assert.equal(result.canReadEnvSecretsNow, false)
assert.equal(result.canUseNetworkNow, false)
assert.equal(result.canUseCredentialsNow, false)
assert.equal(result.canMutateFilesystemNow, false)
assert.equal(result.canEnableToolsetsNow, false)

console.log('factory-hermes-wrapper-no-tool-mode-approval-smoke: PASS 58 checks')
