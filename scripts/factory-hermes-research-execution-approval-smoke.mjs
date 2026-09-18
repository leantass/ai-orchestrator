import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-research-execution-approval/index.cjs'
import { parseFactoryHermesResearchExecutionApprovalResult, serializeFactoryHermesResearchExecutionApprovalResult, summarizeFactoryHermesResearchExecutionApprovalResult, validateFactoryHermesResearchExecutionApprovalInput, validateFactoryHermesResearchExecutionApprovalResult } from '../src/factory/hermes-research-execution-approval/index.ts'

const { executeFactoryHermesResearchExecutionApproval, resolveFactoryHermesResearchExecutionApprovalPaths } = runtime
const paths = resolveFactoryHermesResearchExecutionApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.researchExecutionApprovalRetryResult), true) // 1
const retry = readJson(paths.researchExecutionApprovalRetryResult)
assert.equal(retry.status, 'research_execution_approval_retry_granted') // 2
const input = { approvedAt: '2026-07-23T13:00:00.000Z', approvedBy: 'factory-hermes-research-execution-approval-smoke' }
assert.equal(validateFactoryHermesResearchExecutionApprovalInput(input).ok, true) // 44
const result = await executeFactoryHermesResearchExecutionApproval(input)

assert.equal(existsSync(paths.approvalResult), true) // 3
assert.equal(['research_execution_approval_granted', 'research_execution_approval_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_research_execution_approval_granted_for_controlled_runtime_planning', 'hermes_research_execution_approval_blocked_evidence_incomplete_or_unsafe'].includes(result.decision), true) // 5
assert.ok(result.executionApprovalStatus) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
if (result.status === 'research_execution_approval_granted') {
  assert.ok(result.executionReadinessReview) // 8
  assert.ok(result.executionApprovalLimitationsCarryForward) // 9
  assert.ok(result.executionApprovalRiskDispositionRegister) // 10
  assert.ok(result.controlledResearchRuntimePlanningEnvelope) // 11
  assert.equal(result.controlledResearchRuntimePlanningAllowed, true) // 12
  assert.equal(result.researchExecutionApprovedNow, false) // 13
  assert.equal(result.runtimeAdapterExecutionAllowedNow, false) // 14
  assert.equal(result.hermesExecutionAllowedNow, false) // 15
  assert.equal(result.promptPassingAllowedNow, false) // 16
  assert.equal(result.modelCallsAllowedNow, false) // 17
  assert.equal(result.networkAllowedNow, false) // 18
  assert.equal(result.credentialAccessAllowedNow, false) // 19
  assert.equal(result.toolsetEnablementAllowedNow, false) // 20
  assert.equal(result.tempConfigCreationAllowedNow, false) // 21
  assert.equal(result.runRootCreationAllowedNow, false) // 22
  assert.equal(result.findingsUseAllowedNow, false) // 23
  assert.equal(result.canProceedToControlledResearchRuntimePlanning, true) // 24
} else {
  assert.ok(result.approvalBlockerPlan) // 25
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 26
}
assert.equal(result.canProceedToResearchRuntimeAdapterExecution, false) // 27
assert.equal(result.canRunResearchNow, false) // 28
assert.equal(result.canExecuteHermesNow, false) // 29
assert.equal(result.canPassPromptNow, false) // 30
assert.equal(result.canUseNetworkNow, false) // 31
assert.equal(result.canUseCredentialsNow, false) // 32
assert.equal(result.canReadEnvSecretsNow, false) // 33
assert.equal(result.canCallModelsNow, false) // 34
assert.equal(result.canEnableToolsetsNow, false) // 35
assert.equal(result.canMutateFilesystemNow, false) // 36
assert.equal(result.canUseFindings, false) // 37
assert.equal(result.executionApprovalLimitationsCarryForward.limitations.includes('no_real_hermes_execution_tested'), true) // 38
assert.equal(result.executionApprovalLimitationsCarryForward.limitations.includes('config_schema_partially_unknown'), true) // 39
assert.equal(result.executionApprovalLimitationsCarryForward.limitations.includes('empty_toolsets_support_unknown'), true) // 40
assert.equal(result.executionApprovalRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'execution_approval_confused_with_immediate_runtime'), true) // 41
assert.equal(result.executionApprovalRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'controlled_runtime_planning_auto_executes_by_mistake'), true) // 42
assert.equal(result.executionApprovalRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'research_execution_triggered_without_final_human_approval'), true) // 43
assert.equal(validateFactoryHermesResearchExecutionApprovalResult(result).ok, true, JSON.stringify(validateFactoryHermesResearchExecutionApprovalResult(result))) // 45
assert.equal(parseFactoryHermesResearchExecutionApprovalResult(serializeFactoryHermesResearchExecutionApprovalResult(result)).approvalId, result.approvalId) // 46
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesResearchExecutionApprovalResult(result))), false) // 47
assert.equal(existsSync(paths.approvalResult), true) // 48
assert.equal(sha256('package.json'), expectedPackageHash) // 49
assert.equal(sha256('package-lock.json'), expectedLockHash) // 50
for (const action of ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'create_temp_config_now', 'create_run_root_now', 'execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.researchExecutionApprovalReceipt.notAuthorizedActions.includes(action), true) // 51-68
assert.equal(existsSync('docs/factory/HERMES_RESEARCH_EXECUTION_APPROVAL_GATE_V1.md'), true) // 69

console.log('factory-hermes-research-execution-approval-smoke: PASS 69 checks')
