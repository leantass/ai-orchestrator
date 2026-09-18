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

assert.equal(existsSync(paths.researchRuntimeAdapterResult), true) // 1
const adapter = readJson(paths.researchRuntimeAdapterResult)
assert.equal(adapter.status, 'research_runtime_adapter_prepared') // 2
const input = { retriedAt: '2026-07-23T12:00:00.000Z', retriedBy: 'factory-hermes-research-execution-approval-retry-smoke' }
assert.equal(validateFactoryHermesResearchExecutionApprovalRetryInput(input).ok, true) // 41
const result = await executeFactoryHermesResearchExecutionApprovalRetry(input)

assert.equal(existsSync(paths.researchExecutionApprovalRetryResult), true) // 3
assert.equal(['research_execution_approval_retry_granted', 'research_execution_approval_retry_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_research_execution_approval_retry_approved_for_final_execution_approval_gate', 'hermes_research_execution_approval_retry_blocked_adapter_evidence_insufficient'].includes(result.decision), true) // 5
assert.ok(result.executionApprovalRetryStatus) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
if (result.status === 'research_execution_approval_retry_granted') {
  assert.ok(result.adapterEvidenceForExecutionApprovalRetryReview) // 8
  assert.ok(result.executionApprovalRetryLimitationsCarryForward) // 9
  assert.ok(result.executionApprovalRetryRiskDispositionRegister) // 10
  assert.ok(result.approvedResearchExecutionApprovalGateEnvelope) // 11
  assert.equal(result.researchExecutionApprovalGateAllowed, true) // 12
  assert.equal(result.researchExecutionApprovedNow, false) // 13
  assert.equal(result.runtimeAdapterExecutionAllowedNow, false) // 14
  assert.equal(result.hermesExecutionAllowedNow, false) // 15
  assert.equal(result.promptPassingAllowedNow, false) // 16
  assert.equal(result.modelCallsAllowedNow, false) // 17
  assert.equal(result.networkAllowedNow, false) // 18
  assert.equal(result.credentialAccessAllowedNow, false) // 19
  assert.equal(result.toolsetEnablementAllowedNow, false) // 20
  assert.equal(result.findingsUseAllowedNow, false) // 21
  assert.equal(result.canProceedToResearchExecutionApproval, true) // 22
} else {
  assert.ok(result.retryBlockerPlan) // 23
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 24
}
assert.equal(result.canProceedToResearchRuntimeAdapterExecution, false) // 25
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
assert.equal(result.executionApprovalRetryLimitationsCarryForward.limitations.includes('no_real_hermes_execution_tested'), true) // 36
assert.equal(result.executionApprovalRetryLimitationsCarryForward.limitations.includes('config_schema_partially_unknown'), true) // 37
assert.equal(result.executionApprovalRetryLimitationsCarryForward.limitations.includes('empty_toolsets_support_unknown'), true) // 38
assert.equal(result.executionApprovalRetryRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'hidden_defaults_not_detected_in_real_cli'), true) // 39
assert.equal(result.executionApprovalRetryRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'research_execution_triggered_without_final_human_approval'), true) // 40
assert.equal(validateFactoryHermesResearchExecutionApprovalRetryResult(result).ok, true, JSON.stringify(validateFactoryHermesResearchExecutionApprovalRetryResult(result))) // 42
assert.equal(parseFactoryHermesResearchExecutionApprovalRetryResult(serializeFactoryHermesResearchExecutionApprovalRetryResult(result)).retryId, result.retryId) // 43
assert.equal(JSON.stringify(summarizeFactoryHermesResearchExecutionApprovalRetryResult(result)).includes('sk-'), false) // 44
assert.equal(existsSync(paths.researchExecutionApprovalRetryResult), true) // 45
assert.equal(sha256('package.json'), expectedPackageHash) // 46
assert.equal(sha256('package-lock.json'), expectedLockHash) // 47
for (const action of ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'create_temp_config_now', 'execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'create_runtime_run_root_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.researchExecutionApprovalRetryReceipt.notAuthorizedActions.includes(action), true) // 48-65
assert.equal(existsSync('docs/factory/HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_GATE_V1.md'), true) // 66

console.log('factory-hermes-research-execution-approval-retry-smoke: PASS 66 checks')
