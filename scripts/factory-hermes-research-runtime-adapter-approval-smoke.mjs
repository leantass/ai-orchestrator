import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-research-runtime-adapter-approval/index.cjs'
import { parseFactoryHermesResearchRuntimeAdapterApprovalResult, serializeFactoryHermesResearchRuntimeAdapterApprovalResult, summarizeFactoryHermesResearchRuntimeAdapterApprovalResult, validateFactoryHermesResearchRuntimeAdapterApprovalInput, validateFactoryHermesResearchRuntimeAdapterApprovalResult } from '../src/factory/hermes-research-runtime-adapter-approval/index.ts'

const { executeFactoryHermesResearchRuntimeAdapterApproval, resolveFactoryHermesResearchRuntimeAdapterApprovalPaths } = runtime
const paths = resolveFactoryHermesResearchRuntimeAdapterApprovalPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.finalExecutionApprovalResult), true) // 1
const finalApproval = readJson(paths.finalExecutionApprovalResult)
assert.equal(finalApproval.status, 'final_execution_approval_recorded') // 2
const selection = readJson(paths.runtimeSelectionDecisionResult)
const input = { evaluatedAt: '2026-07-22T21:00:00.000Z', evaluatedBy: 'factory-hermes-research-runtime-adapter-approval-smoke', finalExecutionApprovalResult: finalApproval, runtimeSelectionDecisionResult: selection }
assert.equal(validateFactoryHermesResearchRuntimeAdapterApprovalInput(input).ok, true)

const result = await executeFactoryHermesResearchRuntimeAdapterApproval(input)
assert.equal(existsSync(paths.researchRuntimeAdapterApprovalResult), true) // 3
assert.equal(['research_runtime_adapter_approval_granted', 'research_runtime_adapter_approval_blocked'].includes(result.status), true) // 4
if (result.status === 'research_runtime_adapter_approval_granted') {
  const e = result.approvedResearchRuntimeAdapterEnvelope
  assert.ok(e) // 5
  assert.equal(e.credentialEnvelope.credentialRefName, 'OPENAI_API_KEY') // 8
  assert.equal(e.credentialEnvelope.valueReadNow, false) // 9
  assert.equal(e.networkEnvelope.allowedHosts[0], 'api.openai.com') // 10
  assert.equal(e.networkEnvelope.networkUsedNow, false) // 11
  assert.equal(e.networkEnvelope.dnsResolvedNow, false) // 12
  assert.equal(e.networkEnvelope.endpointsTestedNow, false) // 13
  assert.equal(e.toolsetEnvelope.selectedToolsetMode, 'no_toolsets_text_only') // 14
  assert.notEqual(e.toolsetEnvelope.toolsetDisableSupportStatus, 'unverified_requires_toolset_disable_verification') // 15
  assert.equal(e.filesystemEnvelope.runRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/'), true) // 16
  assert.equal(e.filesystemEnvelope.runRootCreatedNow, false) // 17
  assert.equal(e.commandEnvelope.shell, false) // 18
  assert.equal(e.commandEnvelope.oneShotOnly, true) // 19
  assert.equal(e.timeoutEnvelope.commandTimeoutMs, 120000) // 20
  assert.equal(e.timeoutEnvelope.autoRetryAllowed, false) // 21
  assert.equal(e.outputEnvelope.stdoutPreviewLimitBytes, 12000) // 22
} else {
  assert.equal(result.decision, 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified')
  assert.equal(result.canProceedToResearchRuntimeAdapter, false)
  assert.equal(result.canProceedToToolsetDisableVerificationPlanning, true)
  assert.equal(result.toolsetDisableSupportStatus, 'unverified_requires_toolset_disable_verification')
}
assert.equal(result.hermesResearchRuntimeAdapterApprovalDecision.finalExecutionApprovalValidated, true)
assert.equal(result.hermesResearchRuntimeAdapterApprovalDecision.runtimeSelectionsValidated, true)
assert.equal(result.canRunResearchNow, false) // 23
assert.equal(result.canExecuteHermesNow, false) // 24
assert.equal(result.canPassPromptNow, false) // 25
assert.equal(result.canUseNetworkNow, false) // 26
assert.equal(result.canUseCredentialsNow, false) // 27
assert.equal(result.canReadEnvSecretsNow, false) // 28
assert.equal(result.canCallModelsNow, false) // 29
assert.equal(result.canEnableToolsetsNow, false) // 30
assert.equal(result.canMutateFilesystemNow, false) // 31
assert.equal(result.canUseFindings, false) // 32
assert.equal(validateFactoryHermesResearchRuntimeAdapterApprovalResult(result).ok, true) // 33-34
const parsed = parseFactoryHermesResearchRuntimeAdapterApprovalResult(serializeFactoryHermesResearchRuntimeAdapterApprovalResult(result))
assert.equal(parsed.adapterApprovalId, result.adapterApprovalId) // 35
const summary = summarizeFactoryHermesResearchRuntimeAdapterApprovalResult(result)
assert.equal(JSON.stringify(summary).includes('sk-'), false) // 36
assert.equal(JSON.stringify(summary).includes('process.env'), false)
assert.equal(existsSync(paths.researchRuntimeAdapterApprovalResult), true) // 37
assert.equal(sha256('package.json'), expectedPackageHash) // 38
assert.equal(sha256('package-lock.json'), expectedLockHash) // 39
for (const action of ['execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.researchRuntimeAdapterApprovalReceipt.notAuthorizedActions.includes(action), true)
assert.equal(result.canExecuteHermesNow, false) // 40-53
assert.equal(result.canPassPromptNow, false)
assert.equal(result.canCallModelsNow, false)
assert.equal(result.canReadEnvSecretsNow, false)
assert.equal(result.canUseNetworkNow, false)
assert.equal(result.canUseCredentialsNow, false)
assert.equal(result.canMutateFilesystemNow, false)
assert.equal(result.canEnableToolsetsNow, false)
assert.equal(result.canRunResearchNow, false)
assert.equal(result.canUseFindings, false)
assert.equal(result.researchRuntimeAdapterApprovalReceipt.notAuthorizedActions.includes('execute_uv_now'), true)
assert.equal(result.researchRuntimeAdapterApprovalReceipt.notAuthorizedActions.includes('execute_pip_now'), true)
assert.equal(result.researchRuntimeAdapterApprovalReceipt.notAuthorizedActions.includes('execute_python_now'), true)
assert.equal(result.researchRuntimeAdapterApprovalReceipt.notAuthorizedActions.includes('execute_setup_py_now'), true)

console.log('factory-hermes-research-runtime-adapter-approval-smoke: PASS 53 checks')
