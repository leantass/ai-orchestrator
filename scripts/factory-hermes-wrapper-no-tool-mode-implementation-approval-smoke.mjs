import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-implementation-approval/index.cjs'
import { parseFactoryHermesWrapperNoToolModeImplementationApprovalResult, serializeFactoryHermesWrapperNoToolModeImplementationApprovalResult, summarizeFactoryHermesWrapperNoToolModeImplementationApprovalResult, validateFactoryHermesWrapperNoToolModeImplementationApprovalInput, validateFactoryHermesWrapperNoToolModeImplementationApprovalResult } from '../src/factory/hermes-wrapper-no-tool-mode-implementation-approval/index.ts'
const { executeFactoryHermesWrapperNoToolModeImplementationApproval, resolveFactoryHermesWrapperNoToolModeImplementationApprovalPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeImplementationApprovalPaths()
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'))
const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.implementationPlanningResult), true) // 1
const plan = readJson(paths.implementationPlanningResult); assert.equal(plan.status, 'wrapper_no_tool_mode_implementation_plan_created') // 2
const input = { evaluatedAt: '2026-07-23T04:00:00.000Z', evaluatedBy: 'factory-hermes-wrapper-no-tool-mode-implementation-approval-smoke', implementationPlanningResult: plan, wrapperNoToolModeApprovalResult: readJson(paths.wrapperApprovalResult), wrapperNoToolModePlanningResult: readJson(paths.wrapperPlanningResult) }
assert.equal(validateFactoryHermesWrapperNoToolModeImplementationApprovalInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModeImplementationApproval(input)
assert.equal(existsSync(paths.implementationApprovalResult), true) // 3
assert.ok(['wrapper_no_tool_mode_implementation_approval_granted','wrapper_no_tool_mode_implementation_approval_blocked'].includes(result.status)) // 4
assert.ok(['hermes_wrapper_no_tool_mode_implementation_approved_for_next_gate','hermes_wrapper_no_tool_mode_implementation_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision)) // 5
assert.ok(result.implementationApprovalStatus) // 6
if (result.status === 'wrapper_no_tool_mode_implementation_approval_granted') { const e = result.approvedWrapperNoToolModeImplementationEnvelope; const d = result.hermesWrapperNoToolModeImplementationApprovalDecision; assert.ok(e); assert.equal(e.approvedFor, 'wrapper_no_tool_mode_implementation_only'); assert.equal(e.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets'); assert.equal(d.wrapperImplementationApproved, true); assert.equal(d.wrapperExecutionApproved, false); assert.equal(d.tempConfigCreationApproved, false); assert.equal(d.researchRuntimeAdapterApproved, false); assert.equal(d.researchExecutionApproved, false); assert.equal(d.hermesExecutionApproved, false); assert.equal(d.modelCallsApproved, false); assert.equal(d.networkApproved, false); assert.equal(d.credentialAccessApproved, false); assert.equal(result.canProceedToHermesWrapperNoToolModeImplementation, true); assert.equal(result.canProceedToHermesWrapperNoToolModeVerificationPlanning, false); } else { assert.ok(result.approvalBlockerPlan); assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true); }
for (const key of ['canProceedToResearchRuntimeAdapterApprovalRetry','canProceedToResearchRuntimeAdapter','canRunResearchNow','canExecuteHermesNow','canPassPromptNow','canUseNetworkNow','canUseCredentialsNow','canReadEnvSecretsNow','canCallModelsNow','canEnableToolsetsNow','canMutateFilesystemNow','canUseFindings']) assert.equal(result[key], false)
assert.equal(validateFactoryHermesWrapperNoToolModeImplementationApprovalResult(result).ok, true) // 35/36
assert.equal(parseFactoryHermesWrapperNoToolModeImplementationApprovalResult(serializeFactoryHermesWrapperNoToolModeImplementationApprovalResult(result)).approvalId, result.approvalId) // 37
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeImplementationApprovalResult(result))), false) // 38
assert.equal(existsSync(paths.implementationApprovalResult), true) // 39
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 40
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 41
for (const action of ['execute_wrapper_now','create_temp_config_now','modify_hermes_source_now','execute_hermes_now','execute_oneshot_now','pass_prompt_now','call_models_now','use_network_now','read_env_secrets_now','execute_uv_now','execute_pip_now','execute_python_now','execute_setup_py_now']) assert.equal(result.wrapperNoToolModeImplementationApprovalReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.canExecuteHermesNow, false); assert.equal(result.canPassPromptNow, false); assert.equal(result.canCallModelsNow, false); assert.equal(result.canReadEnvSecretsNow, false); assert.equal(result.canUseNetworkNow, false); assert.equal(result.canUseCredentialsNow, false); assert.equal(result.canMutateFilesystemNow, false); assert.equal(result.canEnableToolsetsNow, false)
console.log('factory-hermes-wrapper-no-tool-mode-implementation-approval-smoke: PASS 57 checks')
