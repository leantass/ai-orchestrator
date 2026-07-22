import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-planning/index.cjs'
import { parseFactoryHermesWrapperNoToolModePlanningResult, serializeFactoryHermesWrapperNoToolModePlanningResult, summarizeFactoryHermesWrapperNoToolModePlanningResult, validateFactoryHermesWrapperNoToolModePlanningInput, validateFactoryHermesWrapperNoToolModePlanningResult } from '../src/factory/hermes-wrapper-no-tool-mode-planning/index.ts'
const { executeFactoryHermesWrapperNoToolModePlanning, resolveFactoryHermesWrapperNoToolModePlanningPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModePlanningPaths(); const readJson = (f) => JSON.parse(readFileSync(f, 'utf8')); const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.revisionPlanningResult), true); const revision = readJson(paths.revisionPlanningResult); assert.equal(revision.status, 'runtime_selection_revision_plan_created')
const input = { plannedAt: '2026-07-23T01:00:00.000Z', plannedBy: 'factory-hermes-wrapper-no-tool-mode-planning-smoke', runtimeSelectionRevisionPlanningResult: revision, toolsetDisableVerificationApprovalResult: readJson(paths.toolsetApprovalResult) }
assert.equal(validateFactoryHermesWrapperNoToolModePlanningInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModePlanning(input)
assert.equal(existsSync(paths.wrapperPlanningResult), true) // 3
assert.ok(['wrapper_no_tool_mode_plan_created', 'wrapper_no_tool_mode_plan_blocked'].includes(result.status)) // 4
assert.ok(['hermes_wrapper_no_tool_mode_plan_created_for_approval', 'hermes_wrapper_no_tool_mode_plan_blocked_no_safe_wrapper_strategy'].includes(result.decision)) // 5
assert.ok(result.wrapperPlanningStatus) // 6
assert.ok(result.wrapperSourceInspectionMap) // 7
assert.ok(result.wrapperStrategyCandidates.length >= 7) // 8
assert.ok(result.wrapperStrategyCandidates.some((c) => c.strategyId === 'wrapper_internal_oneshot_empty_toolsets')) // 9
assert.ok(result.wrapperStrategyCandidates.some((c) => c.strategyId === 'wrapper_temp_config_no_toolsets')) // 10
assert.ok(result.wrapperStrategyCandidates.some((c) => c.strategyId === 'wrapper_empty_tool_registry')) // 11
assert.equal(result.wrapperStrategyCandidates.find((c) => c.strategyId === 'wrapper_monkeypatch_tool_loading')?.status, 'forbidden_initially') // 12
assert.equal(result.wrapperStrategyCandidates.find((c) => c.strategyId === 'wrapper_modify_hermes_source')?.status, 'forbidden_initially') // 13
assert.ok(result.wrapperStrategyCandidates.some((c) => c.strategyId === 'keep_hermes_research_blocked')) // 14
assert.ok(result.wrapperNoToolModeDecisionPack) // 15
assert.ok(result.recommendedWrapperPath) // 16
assert.equal(result.hermesWrapperNoToolModePlanCandidate.directHermesRuntimeAdapterBlocked, true) // 17
assert.equal(result.hermesWrapperNoToolModePlanCandidate.sourceMutationAllowedNow, false) // 18
assert.equal(result.hermesWrapperNoToolModePlanCandidate.wrapperImplementationAllowedNow, false) // 19
assert.equal(result.hermesWrapperNoToolModePlanCandidate.wrapperExecutionAllowedNow, false) // 20
assert.equal(result.hermesWrapperNoToolModePlanCandidate.runtimeAdapterAllowedNow, false) // 21
assert.equal(result.hermesWrapperNoToolModePlanCandidate.researchExecutionAllowedNow, false) // 22
for (const key of ['canProceedToResearchRuntimeAdapterApprovalRetry','canProceedToResearchRuntimeAdapter','canRunResearchNow','canExecuteHermesNow','canPassPromptNow','canUseNetworkNow','canUseCredentialsNow','canReadEnvSecretsNow','canCallModelsNow','canEnableToolsetsNow','canMutateFilesystemNow','canUseFindings']) assert.equal(result[key], false)
assert.equal(validateFactoryHermesWrapperNoToolModePlanningInput(input).ok, true) // 35
assert.equal(validateFactoryHermesWrapperNoToolModePlanningResult(result).ok, true) // 36
assert.equal(parseFactoryHermesWrapperNoToolModePlanningResult(serializeFactoryHermesWrapperNoToolModePlanningResult(result)).planningId, result.planningId) // 37
assert.equal(JSON.stringify(summarizeFactoryHermesWrapperNoToolModePlanningResult(result)).includes('sk-'), false) // 38
assert.equal(existsSync(paths.wrapperPlanningResult), true) // 39
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 40
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 41
for (const action of ['execute_hermes_now','execute_oneshot_now','pass_prompt_now','call_models_now','read_env_secrets_now','use_network_now','implement_wrapper_now','execute_uv_now','execute_pip_now','execute_python_now','execute_setup_py_now']) assert.equal(result.wrapperNoToolModePlanningReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.canExecuteHermesNow, false); assert.equal(result.canPassPromptNow, false); assert.equal(result.canCallModelsNow, false); assert.equal(result.canReadEnvSecretsNow, false); assert.equal(result.canUseNetworkNow, false); assert.equal(result.canUseCredentialsNow, false); assert.equal(result.canMutateFilesystemNow, false); assert.equal(result.canEnableToolsetsNow, false)
console.log('factory-hermes-wrapper-no-tool-mode-planning-smoke: PASS 56 checks')
