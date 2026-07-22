import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-implementation-planning/index.cjs'
import { parseFactoryHermesWrapperNoToolModeImplementationPlanningResult, serializeFactoryHermesWrapperNoToolModeImplementationPlanningResult, summarizeFactoryHermesWrapperNoToolModeImplementationPlanningResult, validateFactoryHermesWrapperNoToolModeImplementationPlanningInput, validateFactoryHermesWrapperNoToolModeImplementationPlanningResult } from '../src/factory/hermes-wrapper-no-tool-mode-implementation-planning/index.ts'
const { executeFactoryHermesWrapperNoToolModeImplementationPlanning, resolveFactoryHermesWrapperNoToolModeImplementationPlanningPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeImplementationPlanningPaths()
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'))
const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.approvalResult), true) // 1
const approval = readJson(paths.approvalResult); assert.equal(approval.status, 'wrapper_no_tool_mode_approval_granted') // 2
const input = { plannedAt: '2026-07-23T03:00:00.000Z', plannedBy: 'factory-hermes-wrapper-no-tool-mode-implementation-planning-smoke', wrapperNoToolModeApprovalResult: approval, wrapperNoToolModePlanningResult: readJson(paths.wrapperPlanningResult) }
assert.equal(validateFactoryHermesWrapperNoToolModeImplementationPlanningInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModeImplementationPlanning(input)
assert.equal(existsSync(paths.implementationPlanningResult), true) // 3
assert.equal(result.status, 'wrapper_no_tool_mode_implementation_plan_created') // 4
assert.equal(result.decision, 'hermes_wrapper_no_tool_mode_implementation_plan_created_for_approval') // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
assert.ok(result.wrapperImplementationArchitecturePlan) // 7
assert.ok(result.wrapperTempConfigPlan) // 8
assert.ok(result.wrapperNoToolEnforcementPlan) // 9
assert.ok(result.wrapperValidationPlan) // 10
assert.ok(result.wrapperImplementationRiskRegister) // 11
const riskIds = result.wrapperImplementationRiskRegister.risks.map((r) => r.riskId)
for (const id of ['config_schema_unknown','hidden_defaults_still_loaded','wrapper_requires_source_mutation','wrapper_accidentally_enables_tools']) assert.equal(riskIds.includes(id), true)
const c = result.hermesWrapperNoToolModeImplementationPlanCandidate
assert.equal(c.wrapperImplementationAllowedNow, false) // 16
assert.equal(c.wrapperExecutionAllowedNow, false) // 17
assert.equal(c.tempConfigCreationAllowedNow, false) // 18
assert.equal(c.sourceMutationAllowedNow, false) // 19
assert.equal(c.researchRuntimeAdapterAllowedNow, false) // 20
assert.equal(c.researchExecutionAllowedNow, false) // 21
assert.equal(c.futureImplementationRequiresApproval, true) // 22
assert.equal(c.futureVerificationRequiresApproval, true) // 23
assert.equal(result.canProceedToHermesWrapperNoToolModeImplementationApproval, true) // 24
for (const key of ['canProceedToHermesWrapperNoToolModeImplementation','canProceedToResearchRuntimeAdapterApprovalRetry','canProceedToResearchRuntimeAdapter','canRunResearchNow','canExecuteHermesNow','canPassPromptNow','canUseNetworkNow','canUseCredentialsNow','canReadEnvSecretsNow','canCallModelsNow','canEnableToolsetsNow','canMutateFilesystemNow','canUseFindings']) assert.equal(result[key], false)
assert.equal(validateFactoryHermesWrapperNoToolModeImplementationPlanningResult(result).ok, true) // 38/39
assert.equal(parseFactoryHermesWrapperNoToolModeImplementationPlanningResult(serializeFactoryHermesWrapperNoToolModeImplementationPlanningResult(result)).planningId, result.planningId) // 40
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeImplementationPlanningResult(result))), false) // 41
assert.equal(existsSync(paths.implementationPlanningResult), true) // 42
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 43
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 44
for (const action of ['execute_hermes_now','execute_oneshot_now','pass_prompt_now','call_models_now','read_env_secrets_now','use_network_now','implement_wrapper_now','create_temp_config_now','execute_uv_now','execute_pip_now','execute_python_now','execute_setup_py_now']) assert.equal(result.wrapperNoToolModeImplementationPlanningReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.wrapperImplementationArchitecturePlan.implementationAllowedNow, false)
assert.equal(result.wrapperImplementationArchitecturePlan.sourceMutationAllowed, false)
assert.equal(result.wrapperTempConfigPlan.tempConfigAllowedNow, false)
assert.equal(result.wrapperTempConfigPlan.configMustNotContainSecrets, true)
assert.equal(result.wrapperNoToolEnforcementPlan.enforcementAllowedNow, false)
assert.ok(result.wrapperValidationPlan.validations.some((v) => v.validationId === 'future_controlled_wrapper_probe' && v.requiresSeparateApproval === true))
assert.equal(result.canExecuteHermesNow, false); assert.equal(result.canPassPromptNow, false); assert.equal(result.canCallModelsNow, false); assert.equal(result.canReadEnvSecretsNow, false); assert.equal(result.canUseNetworkNow, false); assert.equal(result.canUseCredentialsNow, false); assert.equal(result.canMutateFilesystemNow, false); assert.equal(result.canEnableToolsetsNow, false)
console.log('factory-hermes-wrapper-no-tool-mode-implementation-planning-smoke: PASS 60 checks')
