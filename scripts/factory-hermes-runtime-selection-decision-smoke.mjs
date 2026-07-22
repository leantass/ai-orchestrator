import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-runtime-selection-decision/index.cjs'
import { parseFactoryHermesRuntimeSelectionDecisionResult, serializeFactoryHermesRuntimeSelectionDecisionResult, summarizeFactoryHermesRuntimeSelectionDecisionResult, validateFactoryHermesRuntimeSelectionDecisionInput, validateFactoryHermesRuntimeSelectionDecisionResult } from '../src/factory/hermes-runtime-selection-decision/index.ts'

const { executeFactoryHermesRuntimeSelectionDecision, resolveFactoryHermesRuntimeSelectionDecisionPaths } = runtime
const paths = resolveFactoryHermesRuntimeSelectionDecisionPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.runtimeSelectionPlanningResult), true) // 1
const planning = readJson(paths.runtimeSelectionPlanningResult)
assert.equal(planning.status, 'runtime_selection_plan_created') // 2
assert.equal(planning.decision, 'hermes_runtime_selection_plan_created_manual_selection_required')
assert.equal(planning.canProceedToRuntimeSelectionDecision, true)

const input = {
  decidedAt: '2026-07-22T18:00:00.000Z',
  decidedBy: 'factory-hermes-runtime-selection-decision-smoke',
  runtimeSelectionPlanningResult: planning,
  researchExecutionApprovalResult: readJson(paths.researchExecutionApprovalResult),
}
const inputValidation = validateFactoryHermesRuntimeSelectionDecisionInput(input)
assert.equal(inputValidation.ok, true)

const result = await executeFactoryHermesRuntimeSelectionDecision(input)
if (result.status !== 'runtime_selection_decision_recorded') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }

assert.equal(result.status, 'runtime_selection_decision_recorded') // 3
assert.equal(result.decision, 'hermes_runtime_selection_decision_recorded_for_approval_retry') // 4
assert.equal(result.selectionStatus, 'selected_for_approval_retry')
assert.equal(result.selectedProvider.providerId, 'openai') // 5
assert.equal(result.selectedModel.modelId, 'gpt-4o-mini') // 6
assert.equal(result.selectedModel.exactStringRequired, true)
assert.equal(result.selectedModel.noWildcard, true)
assert.equal(result.selectedModel.noLatestAlias, true)
assert.equal(result.selectedCredentialRef.credentialRefName, 'OPENAI_API_KEY') // 7
assert.equal(result.selectedCredentialRef.valueRead, false) // 8
assert.equal(result.selectedCredentialRef.valueKnown, false)
assert.equal(result.selectedCredentialRef.approvedForUseNow, false)
assert.equal(result.selectedNetworkHosts.selectedHosts.includes('api.openai.com'), true) // 9
assert.equal(result.selectedNetworkHosts.dnsResolvedNow, false) // 10
assert.equal(result.selectedNetworkHosts.endpointsTestedNow, false) // 11
assert.equal(result.selectedNetworkHosts.wildcardAllowed, false)
assert.equal(result.selectedNetworkHosts.arbitraryInternetAllowed, false)
assert.equal(result.selectedNetworkHosts.approvedForUseNow, false)
assert.equal(result.selectedToolsetMode.selectedToolsetMode, 'no_toolsets_text_only') // 12
assert.deepEqual(result.selectedToolsetMode.approvedToolsetsNow, [])
assert.equal(result.selectedToolsetMode.hiddenDefaultToolsetsForbidden, true)
assert.equal(result.selectedRunRoot.selectedRunRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/'), true) // 13
assert.equal(result.selectedRunRoot.runRootCreatedNow, false) // 14
assert.equal(existsSync(result.selectedRunRoot.selectedRunRoot), false)
assert.equal(result.selectedFinalApproval.approvedNow, false) // 15
assert.equal(result.selectedFinalApproval.approvalRetryRequired, true)
assert.equal(result.allSelectionsResolvedForApprovalRetry, true) // 16
assert.equal(result.canProceedToResearchExecutionApprovalRetry, true) // 17
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 18
assert.equal(result.canRunResearchNow, false) // 19
assert.equal(result.canExecuteHermesNow, false) // 20
assert.equal(result.canPassPromptNow, false) // 21
assert.equal(result.canUseNetworkNow, false) // 22
assert.equal(result.canUseCredentialsNow, false) // 23
assert.equal(result.canReadEnvSecretsNow, false) // 24
assert.equal(result.canCallModelsNow, false) // 25
assert.equal(result.canEnableToolsetsNow, false) // 26
assert.equal(result.canMutateFilesystemNow, false) // 27
assert.equal(result.canUseFindings, false) // 28
assert.ok(result.runtimeSelectionDecisionRecord)
assert.ok(result.runtimeSelectionDecisionReceipt)

const resultValidation = validateFactoryHermesRuntimeSelectionDecisionResult(result)
assert.equal(resultValidation.ok, true, resultValidation.errors.join('\n')) // 29-30
const parsed = parseFactoryHermesRuntimeSelectionDecisionResult(serializeFactoryHermesRuntimeSelectionDecisionResult(result))
assert.equal(parsed.decisionId, result.decisionId) // 31
const summary = summarizeFactoryHermesRuntimeSelectionDecisionResult(result)
assert.equal(JSON.stringify(summary).includes('sk-'), false) // 32
assert.equal(JSON.stringify(summary).includes('process.env'), false)
assert.equal(JSON.stringify(summary).includes('full stdout'), false)
assert.equal(existsSync(paths.runtimeSelectionDecisionResult), true) // 33
assert.equal(sha256('package.json'), expectedPackageHash) // 34
assert.equal(sha256('package-lock.json'), expectedLockHash) // 35

const actions = result.runtimeSelectionDecisionReceipt.notAuthorizedActions
for (const action of ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'ingest_real_output_now', 'promote_findings_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(actions.includes(action), true)
assert.equal(result.selectedPrompt.promptSentNow, false) // 36-39
assert.equal(result.selectedPrompt.candidateOnly, true)
assert.equal(result.selectedPrompt.approvedForExecutionNow, false)
assert.equal(result.selectedProvider.approvedForExecutionNow, false)
assert.equal(result.selectedModel.approvedForExecutionNow, false) // 40
assert.equal(result.selectedCredentialRef.valueRead, false) // 41
assert.equal(result.selectedNetworkHosts.dnsResolvedNow, false) // 42-45
assert.equal(result.selectedNetworkHosts.endpointsTestedNow, false)
assert.equal(result.selectedNetworkHosts.approvedForUseNow, false)
assert.equal(result.selectedToolsetMode.approvedForExecutionNow, false)
assert.equal(result.selectedRunRoot.runRootCreatedNow, false) // 46-49
assert.equal(result.canExecuteHermesNow, false)
assert.equal(result.canCallModelsNow, false)
assert.equal(result.canUseNetworkNow, false)

console.log('factory-hermes-runtime-selection-decision-smoke: PASS 49 checks')
