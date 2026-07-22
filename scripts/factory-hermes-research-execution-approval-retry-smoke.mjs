import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-research-execution-approval-retry/index.cjs'
import { parseFactoryHermesResearchExecutionApprovalRetryResult, serializeFactoryHermesResearchExecutionApprovalRetryResult, summarizeFactoryHermesResearchExecutionApprovalRetryResult, validateFactoryHermesResearchExecutionApprovalRetryInput, validateFactoryHermesResearchExecutionApprovalRetryResult } from '../src/factory/hermes-research-execution-approval-retry/index.ts'

const { executeFactoryHermesResearchExecutionApprovalRetry, resolveFactoryHermesResearchExecutionApprovalRetryPaths } = runtime
const paths = resolveFactoryHermesResearchExecutionApprovalRetryPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.runtimeSelectionDecisionResult), true) // 1
const selection = readJson(paths.runtimeSelectionDecisionResult)
assert.equal(selection.status, 'runtime_selection_decision_recorded') // 2

const input = { evaluatedAt: '2026-07-22T19:00:00.000Z', evaluatedBy: 'factory-hermes-research-execution-approval-retry-smoke', runtimeSelectionDecisionResult: selection, researchExecutionApprovalResult: readJson(paths.researchExecutionApprovalResult), researchExecutionBoundaryPlanningResult: readJson(paths.researchExecutionBoundaryPlanningResult) }
assert.equal(validateFactoryHermesResearchExecutionApprovalRetryInput(input).ok, true)
const result = await executeFactoryHermesResearchExecutionApprovalRetry(input)
if (result.status !== 'research_execution_approval_retry_blocked') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }

assert.equal(result.status, 'research_execution_approval_retry_blocked') // 3
assert.equal(result.decision, 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required') // 4
assert.equal(result.approvalRetryStatus, 'not_approved') // 5
assert.equal(result.runtimeSelectionsValidated, true) // 6
assert.equal(result.finalExecutionApprovalRequired, true) // 7
assert.equal(result.hermesResearchExecutionApprovalRetryDecision.finalExecutionApprovalSatisfied, false) // 8
assert.equal(result.finalExecutionApprovalRequirement.status, 'required_not_satisfied') // 9
assert.equal(result.finalExecutionApprovalRequirement.blocksExecutionNow, true) // 10
const v = result.validatedRuntimeSelections
assert.equal(v.provider.providerId, 'openai') // 11
assert.equal(v.model.modelId, 'gpt-4o-mini') // 12
assert.equal(v.credential.credentialRefName, 'OPENAI_API_KEY') // 13
assert.equal(v.credential.valueRead, false) // 14
assert.equal(v.network.selectedHosts.includes('api.openai.com'), true) // 15
assert.equal(v.network.dnsResolvedNow, false) // 16
assert.equal(v.network.endpointsTestedNow, false) // 17
assert.equal(v.toolsets.selectedToolsetMode, 'no_toolsets_text_only') // 18
assert.equal(v.runRoot.selectedRunRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/'), true) // 19
assert.equal(v.runRoot.runRootCreatedNow, false) // 20
assert.equal(result.hermesResearchExecutionApprovalRetryDecision.executionApproved, false) // 21
assert.equal(result.hermesResearchExecutionApprovalRetryDecision.runtimeAdapterApproved, false) // 22
assert.equal(result.hermesResearchExecutionApprovalRetryDecision.researchRuntimeApproved, false) // 23
assert.equal(result.canProceedToFinalExecutionApprovalGate, true) // 24
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 25
assert.equal(result.canProceedToResearchExecutionRuntime, false) // 26
assert.equal(result.canRunResearchNow, false) // 27
assert.equal(result.canExecuteHermesNow, false) // 28
assert.equal(result.canPassPromptNow, false) // 29
assert.equal(result.canUseNetworkNow, false) // 30
assert.equal(result.canUseCredentialsNow, false) // 31
assert.equal(result.canReadEnvSecretsNow, false) // 32
assert.equal(result.canCallModelsNow, false) // 33
assert.equal(result.canEnableToolsetsNow, false) // 34
assert.equal(result.canMutateFilesystemNow, false) // 35
assert.equal(result.canUseFindings, false) // 36
assert.equal(validateFactoryHermesResearchExecutionApprovalRetryResult(result).ok, true) // 37-38
const parsed = parseFactoryHermesResearchExecutionApprovalRetryResult(serializeFactoryHermesResearchExecutionApprovalRetryResult(result))
assert.equal(parsed.approvalRetryId, result.approvalRetryId) // 39
const summary = summarizeFactoryHermesResearchExecutionApprovalRetryResult(result)
assert.equal(JSON.stringify(summary).includes('sk-'), false) // 40
assert.equal(JSON.stringify(summary).includes('process.env'), false)
assert.equal(existsSync(paths.researchExecutionApprovalRetryResult), true) // 41
assert.equal(sha256('package.json'), expectedPackageHash) // 42
assert.equal(sha256('package-lock.json'), expectedLockHash) // 43
for (const action of ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'ingest_real_output_now', 'promote_findings_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.researchExecutionApprovalRetryReceipt.notAuthorizedActions.includes(action), true)
assert.equal(v.prompt.promptSentNow, false) // 44-58
assert.equal(result.canExecuteHermesNow, false)
assert.equal(result.canPassPromptNow, false)
assert.equal(result.canCallModelsNow, false)
assert.equal(result.canReadEnvSecretsNow, false)
assert.equal(result.canUseNetworkNow, false)
assert.equal(v.network.dnsResolvedNow, false)
assert.equal(v.network.endpointsTestedNow, false)
assert.equal(v.credential.valueRead, false)
assert.equal(v.runRoot.runRootCreatedNow, false)
assert.equal(v.toolsets.approvedForExecutionNow, false)
assert.equal(result.hermesResearchExecutionApprovalRetryDecision.runtimeAdapterApproved, false)
assert.equal(result.canRunResearchNow, false)
assert.equal(result.canUseCredentialsNow, false)
assert.equal(result.canMutateFilesystemNow, false)

console.log('factory-hermes-research-execution-approval-retry-smoke: PASS 58 checks')
