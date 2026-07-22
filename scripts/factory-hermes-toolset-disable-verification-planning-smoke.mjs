import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-toolset-disable-verification-planning/index.cjs'
import { parseFactoryHermesToolsetDisableVerificationPlanningResult, serializeFactoryHermesToolsetDisableVerificationPlanningResult, summarizeFactoryHermesToolsetDisableVerificationPlanningResult, validateFactoryHermesToolsetDisableVerificationPlanningInput, validateFactoryHermesToolsetDisableVerificationPlanningResult } from '../src/factory/hermes-toolset-disable-verification-planning/index.ts'
const { executeFactoryHermesToolsetDisableVerificationPlanning, resolveFactoryHermesToolsetDisableVerificationPlanningPaths } = runtime
const paths = resolveFactoryHermesToolsetDisableVerificationPlanningPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.adapterApprovalResult), true) // 1
const adapter = readJson(paths.adapterApprovalResult)
assert.equal(adapter.status, 'research_runtime_adapter_approval_blocked') // 2
const input = { plannedAt: '2026-07-22T22:00:00.000Z', plannedBy: 'factory-hermes-toolset-disable-verification-planning-smoke', researchRuntimeAdapterApprovalResult: adapter, runtimeSelectionDecisionResult: readJson(paths.runtimeSelectionDecisionResult), toolsetsPolicyPlanningResult: readJson(paths.toolsetsPolicyPlanningResult) }
assert.equal(validateFactoryHermesToolsetDisableVerificationPlanningInput(input).ok, true)
const result = await executeFactoryHermesToolsetDisableVerificationPlanning(input)
assert.equal(existsSync(paths.planningResult), true) // 3
assert.equal(result.status, 'toolset_disable_verification_plan_created') // 4
assert.ok(['hermes_toolset_disable_verification_plan_created_static_no_tool_mode_verified', 'hermes_toolset_disable_verification_plan_created_runtime_probe_or_selection_revision_required', 'hermes_toolset_disable_verification_plan_created_no_tool_mode_not_supported_selection_revision_required'].includes(result.decision)) // 5
assert.ok(result.staticVerificationStatus) // 6
assert.ok(result.toolsetLoadingStaticMap) // 7
assert.ok(result.toolsetLoadingStaticMap.cliToolsetsArg) // 8
assert.ok(result.toolsetLoadingStaticMap.validationPath) // 9
assert.ok(result.toolsetLoadingStaticMap.defaultToolsetsPath) // 10
assert.ok(result.toolsetLoadingStaticMap.noMcpSentinel) // 11
assert.ok(result.toolsetDisableEvidence) // 12
assert.equal(typeof result.toolsetDisableEvidence.noToolModeProven, 'boolean') // 13
assert.ok(result.toolsetDisableVerificationCandidates.length >= 4) // 14
assert.ok(result.toolsetDisableVerificationCandidates.some((c) => c.candidateId === 'static_source_verification')) // 15
assert.ok(result.toolsetDisableVerificationCandidates.some((c) => c.candidateId === 'controlled_cli_validation_probe')) // 16
assert.ok(result.toolsetDisableVerificationCandidates.some((c) => c.candidateId === 'adapter_with_no_tool_mode')) // 17
assert.ok(result.toolsetDisableVerificationPlanningReceipt.notAuthorizedActions.includes('validate_toolsets_by_execution_now')) // 18
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 19
assert.equal(result.canRunResearchNow, false) // 20
assert.equal(result.canExecuteHermesNow, false) // 21
assert.equal(result.canPassPromptNow, false) // 22
assert.equal(result.canUseNetworkNow, false) // 23
assert.equal(result.canUseCredentialsNow, false) // 24
assert.equal(result.canReadEnvSecretsNow, false) // 25
assert.equal(result.canCallModelsNow, false) // 26
assert.equal(result.canEnableToolsetsNow, false) // 27
assert.equal(result.canMutateFilesystemNow, false) // 28
assert.equal(result.canUseFindings, false) // 29
assert.equal(validateFactoryHermesToolsetDisableVerificationPlanningResult(result).ok, true) // 30-31
assert.equal(parseFactoryHermesToolsetDisableVerificationPlanningResult(serializeFactoryHermesToolsetDisableVerificationPlanningResult(result)).planningId, result.planningId) // 32
assert.equal(JSON.stringify(summarizeFactoryHermesToolsetDisableVerificationPlanningResult(result)).includes('sk-'), false) // 33
assert.equal(existsSync(paths.planningResult), true) // 34
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 35
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 36
for (const action of ['execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'use_network_now', 'execute_uv_now', 'execute_pip_now', 'execute_python_now', 'execute_setup_py_now']) assert.equal(result.toolsetDisableVerificationPlanningReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.canExecuteHermesNow, false) // 37-50
assert.equal(result.canPassPromptNow, false)
assert.equal(result.canCallModelsNow, false)
assert.equal(result.canReadEnvSecretsNow, false)
assert.equal(result.canUseNetworkNow, false)
assert.equal(result.canUseCredentialsNow, false)
assert.equal(result.canMutateFilesystemNow, false)
assert.equal(result.canEnableToolsetsNow, false)
assert.equal(result.canRunResearchNow, false)
assert.equal(result.canUseFindings, false)
assert.equal(result.toolsetLoadingStaticMap.validationPath.allowsEmptyList, false)
assert.equal(result.toolsetLoadingStaticMap.noMcpSentinel.disablesAllTools, false)
assert.equal(result.toolsetDisableEvidence.noToolModeProven, false)
assert.equal(result.canProceedToResearchRuntimeAdapterApprovalRetry, false)
console.log('factory-hermes-toolset-disable-verification-planning-smoke: PASS 50 checks')
