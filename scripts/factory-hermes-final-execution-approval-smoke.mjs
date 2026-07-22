import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-final-execution-approval/index.cjs'
import { parseFactoryHermesFinalExecutionApprovalResult, serializeFactoryHermesFinalExecutionApprovalResult, summarizeFactoryHermesFinalExecutionApprovalResult, validateFactoryHermesFinalExecutionApprovalInput, validateFactoryHermesFinalExecutionApprovalResult } from '../src/factory/hermes-final-execution-approval/index.ts'

const { executeFactoryHermesFinalExecutionApproval, resolveFactoryHermesFinalExecutionApprovalPaths } = runtime
const paths = resolveFactoryHermesFinalExecutionApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.researchExecutionApprovalRetryResult), true) // 1
const retry = readJson(paths.researchExecutionApprovalRetryResult)
assert.equal(retry.status, 'research_execution_approval_retry_blocked') // 2
const selection = readJson(paths.runtimeSelectionDecisionResult)
const input = { approvedAt: '2026-07-22T20:00:00.000Z', approvedBy: 'factory-hermes-final-execution-approval-smoke', researchExecutionApprovalRetryResult: retry, runtimeSelectionDecisionResult: selection }
assert.equal(validateFactoryHermesFinalExecutionApprovalInput(input).ok, true)

const result = await executeFactoryHermesFinalExecutionApproval(input)
if (result.status !== 'final_execution_approval_recorded') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
assert.equal(result.status, 'final_execution_approval_recorded') // 3
assert.equal(result.decision, 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval') // 4
assert.equal(result.finalExecutionApprovalStatus, 'approved_for_runtime_adapter_approval') // 5
assert.equal(result.hermesFinalExecutionApprovalDecision.finalExecutionApproved, true) // 6
assert.equal(result.hermesFinalExecutionApprovalDecision.runtimeSelectionsApprovedForNextGate, true) // 7
assert.equal(result.hermesFinalExecutionApprovalDecision.runtimeAdapterApproved, false) // 8
assert.equal(result.hermesFinalExecutionApprovalDecision.researchRuntimeApproved, false) // 9
assert.equal(result.hermesFinalExecutionApprovalDecision.executionApprovedNow, false) // 10
const s = result.approvedRuntimeSelectionSnapshot
assert.equal(s.provider.providerId, 'openai') // 11
assert.equal(s.model.modelId, 'gpt-4o-mini') // 12
assert.equal(s.credential.credentialRefName, 'OPENAI_API_KEY') // 13
assert.equal(s.credential.valueRead, false) // 14
assert.equal(s.network.approvedHostsForNextGate.includes('api.openai.com'), true) // 15
assert.equal(s.network.dnsResolvedNow, false) // 16
assert.equal(s.network.endpointsTestedNow, false) // 17
assert.equal(s.toolsets.approvedToolsetModeForNextGate, 'no_toolsets_text_only') // 18
assert.equal(s.runRoot.approvedRunRootForNextGate.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/'), true) // 19
assert.equal(s.runRoot.runRootCreatedNow, false) // 20
assert.ok(result.runtimeAdapterApprovalRequirement) // 21
assert.equal(result.runtimeAdapterApprovalRequirement.status, 'required_not_satisfied') // 22
assert.equal(result.canProceedToResearchRuntimeAdapterApproval, true) // 23
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 24
assert.equal(result.canProceedToResearchExecutionRuntime, false) // 25
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
assert.equal(validateFactoryHermesFinalExecutionApprovalResult(result).ok, true) // 36-37
const parsed = parseFactoryHermesFinalExecutionApprovalResult(serializeFactoryHermesFinalExecutionApprovalResult(result))
assert.equal(parsed.finalApprovalId, result.finalApprovalId) // 38
const summary = summarizeFactoryHermesFinalExecutionApprovalResult(result)
assert.equal(JSON.stringify(summary).includes('sk-'), false) // 39
assert.equal(JSON.stringify(summary).includes('process.env'), false)
assert.equal(existsSync(paths.finalExecutionApprovalResult), true) // 40
assert.equal(sha256('package.json'), expectedPackageHash) // 41
assert.equal(sha256('package-lock.json'), expectedLockHash) // 42
for (const action of ['approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'ingest_real_output_now', 'promote_findings_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.finalExecutionApprovalReceipt.notAuthorizedActions.includes(action), true)
assert.equal(s.prompt.promptSentNow, false) // 43-57
assert.equal(result.canExecuteHermesNow, false)
assert.equal(result.canPassPromptNow, false)
assert.equal(result.canCallModelsNow, false)
assert.equal(result.canReadEnvSecretsNow, false)
assert.equal(result.canUseNetworkNow, false)
assert.equal(s.network.dnsResolvedNow, false)
assert.equal(s.network.endpointsTestedNow, false)
assert.equal(s.credential.valueRead, false)
assert.equal(s.runRoot.runRootCreatedNow, false)
assert.equal(s.toolsets.toolsetsEnabledNow, false)
assert.equal(s.finalApproval.runtimeAdapterApprovedNow, false)
assert.equal(result.canRunResearchNow, false)
assert.equal(result.canUseCredentialsNow, false)
assert.equal(result.canMutateFilesystemNow, false)

console.log('factory-hermes-final-execution-approval-smoke: PASS 57 checks')
