import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-research-runtime-adapter-approval-retry/index.cjs'
import { parseFactoryHermesResearchRuntimeAdapterApprovalRetryResult, serializeFactoryHermesResearchRuntimeAdapterApprovalRetryResult, summarizeFactoryHermesResearchRuntimeAdapterApprovalRetryResult, validateFactoryHermesResearchRuntimeAdapterApprovalRetryInput, validateFactoryHermesResearchRuntimeAdapterApprovalRetryResult } from '../src/factory/hermes-research-runtime-adapter-approval-retry/index.ts'

const { executeFactoryHermesResearchRuntimeAdapterApprovalRetry, resolveFactoryHermesResearchRuntimeAdapterApprovalRetryPaths } = runtime
const paths = resolveFactoryHermesResearchRuntimeAdapterApprovalRetryPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.wrapperVerificationReviewResult), true) // 1
const review = readJson(paths.wrapperVerificationReviewResult)
assert.equal(review.status, 'wrapper_no_tool_mode_verification_review_completed') // 2
const verification = readJson(paths.wrapperVerificationResult)
const previous = readJson(paths.previousAdapterApprovalResult)
const toolset = readJson(paths.toolsetDisableVerificationApprovalResult)
const input = { retriedAt: '2026-07-23T10:00:00.000Z', retriedBy: 'factory-hermes-research-runtime-adapter-approval-retry-smoke', wrapperVerificationReviewResult: review, wrapperVerificationResult: verification, previousAdapterApprovalResult: previous, toolsetDisableVerificationApprovalResult: toolset }
assert.equal(validateFactoryHermesResearchRuntimeAdapterApprovalRetryInput(input).ok, true) // 41

const result = await executeFactoryHermesResearchRuntimeAdapterApprovalRetry(input)
assert.equal(existsSync(paths.researchRuntimeAdapterApprovalRetryResult), true) // 3
assert.equal(['research_runtime_adapter_approval_retry_granted', 'research_runtime_adapter_approval_retry_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_research_runtime_adapter_approval_retry_approved_with_wrapper_boundary', 'hermes_research_runtime_adapter_approval_retry_blocked_wrapper_evidence_insufficient'].includes(result.decision), true) // 5
assert.ok(result.adapterApprovalRetryStatus) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7

if (result.status === 'research_runtime_adapter_approval_retry_granted') {
  assert.ok(result.wrapperEvidenceForAdapterRetryReview) // 8
  assert.ok(result.adapterRetryLimitationsCarryForward) // 9
  assert.ok(result.adapterRetryRiskDispositionRegister) // 10
  assert.ok(result.approvedResearchRuntimeAdapterGateEnvelope) // 11
  assert.equal(result.runtimeAdapterApproved, true) // 12
  assert.equal(result.runtimeAdapterExecutionApproved, false) // 13
  assert.equal(result.researchExecutionApproved, false) // 14
  assert.equal(result.hermesExecutionApproved, false) // 15
  assert.equal(result.promptPassingApproved, false) // 16
  assert.equal(result.modelCallsApproved, false) // 17
  assert.equal(result.networkApproved, false) // 18
  assert.equal(result.credentialAccessApproved, false) // 19
  assert.equal(result.toolsetEnablementApproved, false) // 20
  assert.equal(result.findingsUseApproved, false) // 21
  assert.equal(result.canProceedToResearchRuntimeAdapter, true) // 22
  assert.equal(result.canProceedToResearchExecutionApproval, false) // 23
} else {
  assert.ok(result.retryBlockerPlan) // 24
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 25
}

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
assert.equal(result.adapterRetryLimitationsCarryForward.limitations.includes('no_real_hermes_execution_tested'), true) // 36
assert.equal(result.adapterRetryLimitationsCarryForward.limitations.includes('config_schema_partially_unknown'), true) // 37
assert.equal(result.adapterRetryLimitationsCarryForward.limitations.includes('empty_toolsets_support_unknown'), true) // 38
assert.equal(result.adapterRetryRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'hidden_defaults_not_detected_in_real_cli'), true) // 39
assert.equal(result.adapterRetryRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'research_execution_triggered_without_final_approval'), true) // 40
assert.equal(validateFactoryHermesResearchRuntimeAdapterApprovalRetryResult(result).ok, true) // 42
const parsed = parseFactoryHermesResearchRuntimeAdapterApprovalRetryResult(serializeFactoryHermesResearchRuntimeAdapterApprovalRetryResult(result))
assert.equal(parsed.retryId, result.retryId) // 43
const summary = summarizeFactoryHermesResearchRuntimeAdapterApprovalRetryResult(result)
assert.equal(JSON.stringify(summary).includes('sk-'), false) // 44
assert.equal(JSON.stringify(summary).includes('process.env'), false)
assert.equal(existsSync(paths.researchRuntimeAdapterApprovalRetryResult), true) // 45
assert.equal(sha256('package.json'), expectedPackageHash) // 46
assert.equal(sha256('package-lock.json'), expectedLockHash) // 47
for (const action of ['execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'create_temp_config_now', 'execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'create_runtime_run_root_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.researchRuntimeAdapterApprovalRetryReceipt.notAuthorizedActions.includes(action), true) // 48-64
assert.equal(existsSync('docs/factory/HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_GATE_V1.md'), true) // 65

console.log('factory-hermes-research-runtime-adapter-approval-retry-smoke: PASS 65 checks')
