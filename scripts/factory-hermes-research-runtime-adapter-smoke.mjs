import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import adapterRuntime from '../electron/factory/hermes-research-runtime-adapter/index.cjs'
import { parseFactoryHermesResearchRuntimeAdapterResult, serializeFactoryHermesResearchRuntimeAdapterResult, summarizeFactoryHermesResearchRuntimeAdapterResult, validateFactoryHermesResearchRuntimeAdapterInput, validateFactoryHermesResearchRuntimeAdapterResult } from '../src/factory/hermes-research-runtime-adapter/index.ts'

const { executeFactoryHermesResearchRuntimeAdapter, resolveFactoryHermesResearchRuntimeAdapterPaths } = adapterRuntime
const paths = resolveFactoryHermesResearchRuntimeAdapterPaths()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(paths.adapterApprovalRetryResult), true) // 1
const approvalRetry = readJson(paths.adapterApprovalRetryResult)
assert.equal(approvalRetry.status, 'research_runtime_adapter_approval_retry_granted') // 2
const input = { adaptedAt: '2026-07-23T11:00:00.000Z', adaptedBy: 'factory-hermes-research-runtime-adapter-smoke' }
assert.equal(validateFactoryHermesResearchRuntimeAdapterInput(input).ok, true) // 49
const result = await executeFactoryHermesResearchRuntimeAdapter(input)

assert.equal(existsSync(paths.adapterResult), true) // 3
assert.equal(['research_runtime_adapter_prepared', 'research_runtime_adapter_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_research_runtime_adapter_prepared_with_wrapper_boundary_for_execution_approval_retry', 'hermes_research_runtime_adapter_blocked_executable_surface_detected', 'hermes_research_runtime_adapter_blocked_input_evidence_invalid'].includes(result.decision), true) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6

if (result.status === 'research_runtime_adapter_prepared') {
  assert.ok(result.adapterWrapperBoundaryIntegrationManifest) // 7
  assert.ok(result.adapterNonExecutableCommandEnvelope) // 8
  assert.ok(result.adapterRuntimeSafetyManifest) // 9
  assert.ok(result.adapterLimitationsCarryForward) // 10
  assert.ok(result.adapterRiskDispositionRegister) // 11
  assert.ok(result.researchExecutionApprovalRetryEnvelope) // 12
  assert.equal(result.wrapperBoundaryIntegrated, true) // 13
  assert.equal(result.adapterCommandEnvelopeBuilt, true) // 14
  assert.equal(result.adapterSafetyManifestBuilt, true) // 15
}

assert.equal(result.runtimeAdapterExecutionAllowedNow, false) // 16
assert.equal(result.researchExecutionApproved, false) // 17
assert.equal(result.hermesExecutionApproved, false) // 18
assert.equal(result.promptPassingApproved, false) // 19
assert.equal(result.modelCallsApproved, false) // 20
assert.equal(result.networkApproved, false) // 21
assert.equal(result.credentialAccessApproved, false) // 22
assert.equal(result.toolsetEnablementApproved, false) // 23
assert.equal(result.findingsUseApproved, false) // 24
if (result.status === 'research_runtime_adapter_prepared') assert.equal(result.canProceedToResearchExecutionApprovalRetry, true) // 25
assert.equal(result.canProceedToResearchExecutionApproval, false) // 26
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
assert.equal(result.adapterNonExecutableCommandEnvelope.commandString, null) // 38
assert.deepEqual(result.adapterNonExecutableCommandEnvelope.argv, []) // 39
assert.deepEqual(result.adapterNonExecutableCommandEnvelope.env, {}) // 40
assert.equal(result.adapterNonExecutableCommandEnvelope.prompt, null) // 41
assert.equal(result.adapterNonExecutableCommandEnvelope.tempConfigPath, null) // 42
assert.equal(result.adapterNonExecutableCommandEnvelope.runRoot, null) // 43
assert.equal(result.adapterLimitationsCarryForward.limitations.includes('no_real_hermes_execution_tested'), true) // 44
assert.equal(result.adapterLimitationsCarryForward.limitations.includes('config_schema_partially_unknown'), true) // 45
assert.equal(result.adapterLimitationsCarryForward.limitations.includes('empty_toolsets_support_unknown'), true) // 46
assert.equal(result.adapterRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'hidden_defaults_not_detected_in_real_cli'), true) // 47
assert.equal(result.adapterRiskDispositionRegister.dispositions.some((risk) => risk.riskId === 'research_execution_triggered_without_final_approval'), true) // 48
assert.equal(validateFactoryHermesResearchRuntimeAdapterResult(result).ok, true, JSON.stringify(validateFactoryHermesResearchRuntimeAdapterResult(result))) // 50
const parsed = parseFactoryHermesResearchRuntimeAdapterResult(serializeFactoryHermesResearchRuntimeAdapterResult(result))
assert.equal(parsed.adapterId, result.adapterId) // 51
const summary = summarizeFactoryHermesResearchRuntimeAdapterResult(result)
assert.equal(JSON.stringify(summary).includes('sk-'), false) // 52
assert.equal(JSON.stringify(summary).includes('process.env'), false)
assert.equal(existsSync(paths.adapterResult), true) // 53
assert.equal(sha256('package.json'), expectedPackageHash) // 54
assert.equal(sha256('package-lock.json'), expectedLockHash) // 55
for (const action of ['execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'create_temp_config_now', 'execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'create_runtime_run_root_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.researchRuntimeAdapterReceipt.notAuthorizedActions.includes(action), true) // 56-72
assert.equal(existsSync('docs/factory/HERMES_RESEARCH_RUNTIME_ADAPTER_GATE_V1.md'), true) // 73

console.log('factory-hermes-research-runtime-adapter-smoke: PASS 73 checks')
