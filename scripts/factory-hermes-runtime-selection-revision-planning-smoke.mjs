import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-runtime-selection-revision-planning/index.cjs'
import { parseFactoryHermesRuntimeSelectionRevisionPlanningResult, serializeFactoryHermesRuntimeSelectionRevisionPlanningResult, summarizeFactoryHermesRuntimeSelectionRevisionPlanningResult, validateFactoryHermesRuntimeSelectionRevisionPlanningInput, validateFactoryHermesRuntimeSelectionRevisionPlanningResult } from '../src/factory/hermes-runtime-selection-revision-planning/index.ts'
const { executeFactoryHermesRuntimeSelectionRevisionPlanning, resolveFactoryHermesRuntimeSelectionRevisionPlanningPaths } = runtime
const paths = resolveFactoryHermesRuntimeSelectionRevisionPlanningPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.toolsetDisableVerificationApprovalResult), true) // 1
const approval = readJson(paths.toolsetDisableVerificationApprovalResult)
assert.equal(approval.approvalStatus, 'blocked') // 2
const input = { plannedAt: '2026-07-23T00:00:00.000Z', plannedBy: 'factory-hermes-runtime-selection-revision-planning-smoke', toolsetDisableVerificationApprovalResult: approval, researchRuntimeAdapterApprovalResult: readJson(paths.researchRuntimeAdapterApprovalResult), runtimeSelectionDecisionResult: readJson(paths.runtimeSelectionDecisionResult) }
assert.equal(validateFactoryHermesRuntimeSelectionRevisionPlanningInput(input).ok, true)
const result = await executeFactoryHermesRuntimeSelectionRevisionPlanning(input)
assert.equal(existsSync(paths.runtimeSelectionRevisionPlanningResult), true) // 3
assert.equal(result.status, 'runtime_selection_revision_plan_created') // 4
assert.equal(result.decision, 'hermes_runtime_selection_revision_plan_created_toolset_mode_blocked') // 5
assert.equal(result.revisionStatus, 'manual_revision_required') // 6
assert.ok(result.blockedRuntimeSelectionSummary) // 7
assert.equal(result.blockedRuntimeSelectionSummary.previousToolsetMode, 'no_toolsets_text_only') // 8
assert.equal(result.blockedRuntimeSelectionSummary.blockedReason, 'toolset_mode_not_supported') // 9
assert.ok(result.revisionOptions.length >= 6) // 10
assert.ok(result.revisionOptions.some((o) => o.optionId === 'keep_hermes_research_blocked')) // 11
assert.ok(result.revisionOptions.some((o) => o.optionId === 'plan_wrapper_enforced_no_tool_mode')) // 12
assert.ok(result.revisionOptions.some((o) => o.optionId === 'revise_to_known_valid_minimal_toolset')) // 13
assert.equal(result.revisionOptions.find((o) => o.optionId === 'allow_default_cli_toolsets')?.status, 'forbidden') // 14
assert.equal(result.revisionOptions.find((o) => o.optionId === 'direct_hermes_runtime_with_no_toolsets_text_only')?.status, 'forbidden') // 15
assert.ok(result.runtimeSelectionRevisionDecisionPack) // 16
assert.equal(result.recommendedRevisionPath.pathId, 'plan_wrapper_enforced_no_tool_mode') // 17
assert.equal(result.hermesRuntimeSelectionRevisionPlanCandidate.currentRuntimeSelectionInvalidForAdapter, true) // 18
assert.equal(result.hermesRuntimeSelectionRevisionPlanCandidate.selectedToolsetModeInvalidForAdapter, true) // 19
assert.equal(result.hermesRuntimeSelectionRevisionPlanCandidate.directHermesRuntimeAdapterBlocked, true) // 20
assert.equal(result.hermesRuntimeSelectionRevisionPlanCandidate.wrapperPlanningRecommended, true) // 21
assert.equal(result.canProceedToHermesWrapperNoToolModePlanning, true) // 22
assert.equal(result.canProceedToRuntimeSelectionRevisionDecision, true) // 23
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
assert.equal(validateFactoryHermesRuntimeSelectionRevisionPlanningInput(input).ok, true) // 36
assert.equal(validateFactoryHermesRuntimeSelectionRevisionPlanningResult(result).ok, true) // 37
assert.equal(parseFactoryHermesRuntimeSelectionRevisionPlanningResult(serializeFactoryHermesRuntimeSelectionRevisionPlanningResult(result)).planningId, result.planningId) // 38
assert.equal(JSON.stringify(summarizeFactoryHermesRuntimeSelectionRevisionPlanningResult(result)).includes('sk-'), false) // 39
assert.equal(existsSync(paths.runtimeSelectionRevisionPlanningResult), true) // 40
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 41
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 42
for (const action of ['execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'use_network_now', 'execute_uv_now', 'execute_pip_now', 'execute_python_now', 'execute_setup_py_now']) assert.equal(result.runtimeSelectionRevisionPlanningReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.canExecuteHermesNow, false) // 43
assert.equal(result.canExecuteHermesNow, false) // 44
assert.equal(result.canPassPromptNow, false) // 45
assert.equal(result.canPassPromptNow, false) // 46
assert.equal(result.canCallModelsNow, false) // 47
assert.equal(result.canReadEnvSecretsNow, false) // 48
assert.equal(result.runtimeSelectionRevisionPlanningReceipt.notAuthorizedActions.includes('read_env_secrets_now'), true) // 49
assert.equal(result.canUseNetworkNow, false) // 50
assert.equal(result.canUseNetworkNow, false) // 51
assert.equal(result.canUseNetworkNow, false) // 52
assert.equal(result.canUseCredentialsNow, false) // 53
assert.equal(result.canMutateFilesystemNow, false) // 54
assert.equal(result.canEnableToolsetsNow, false) // 55
assert.equal(result.runtimeSelectionRevisionPlanningReceipt.notAuthorizedActions.includes('execute_uv_now'), true) // 56
console.log('factory-hermes-runtime-selection-revision-planning-smoke: PASS 56 checks')
