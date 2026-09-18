import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-verification/index.cjs'
import { parseFactoryHermesWrapperNoToolModeVerificationResult, serializeFactoryHermesWrapperNoToolModeVerificationResult, summarizeFactoryHermesWrapperNoToolModeVerificationResult, validateFactoryHermesWrapperNoToolModeVerificationInput, validateFactoryHermesWrapperNoToolModeVerificationResult } from '../src/factory/hermes-wrapper-no-tool-mode-verification/index.ts'
const { executeFactoryHermesWrapperNoToolModeVerification, resolveFactoryHermesWrapperNoToolModeVerificationPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeVerificationPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.verificationApprovalResult), true) // 1
const approval = readJson(paths.verificationApprovalResult); assert.equal(approval.status, 'wrapper_no_tool_mode_verification_approval_granted') // 2
const input = { verifiedAt: '2026-07-23T08:00:00.000Z', verifiedBy: 'factory-hermes-wrapper-no-tool-mode-verification-smoke', verificationApprovalResult: approval, implementationResult: readJson(paths.implementationResult) }
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModeVerification(input)
assert.equal(existsSync(paths.verificationResult), true) // 3
assert.ok(['wrapper_no_tool_mode_verification_completed','wrapper_no_tool_mode_verification_failed'].includes(result.status)) // 4
assert.ok(['hermes_wrapper_no_tool_mode_verified_for_review','hermes_wrapper_no_tool_mode_verification_failed_block_runtime_adapter'].includes(result.decision)) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
assert.ok(result.wrapperStaticSafetyScanResult) // 7
assert.ok(result.wrapperConfigSerializerVerificationResult) // 8
assert.ok(result.wrapperCommandEnvelopeVerificationResult) // 9
assert.ok(result.wrapperTempConfigVirtualVerificationResult) // 10
assert.ok(result.wrapperNoHermesExecutionVerificationResult) // 11
assert.ok(result.wrapperVerificationEvidenceManifest) // 12
assert.ok(result.wrapperNoToolModeVerificationReviewEnvelope) // 13
if (result.status === 'wrapper_no_tool_mode_verification_completed') {
  assert.equal(result.staticSafetyScanPassed, true) // 14
  assert.equal(result.configSerializerVerificationPassed, true) // 15
  assert.equal(result.commandEnvelopeVerificationPassed, true) // 16
  assert.equal(result.tempConfigVirtualVerificationPassed, true) // 17
  assert.equal(result.noHermesExecutionVerificationPassed, true) // 18
  assert.equal(result.wrapperVerificationPassed, true) // 19
}
assert.equal(result.canProceedToHermesWrapperNoToolModeVerificationReview, true) // 20
assert.equal(result.canProceedToResearchRuntimeAdapterApprovalRetry, false) // 21
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 22
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
assert.equal(result.wrapperNoHermesExecutionVerificationResult.hermesExecuted, false) // 33
assert.equal(result.wrapperNoHermesExecutionVerificationResult.hermesExeExecuted, false) // 34
assert.equal(result.wrapperNoHermesExecutionVerificationResult.oneShotExecuted, false) // 35
assert.equal(result.wrapperNoHermesExecutionVerificationResult.wrapperExecutedAgainstHermes, false) // 36
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode'), false) // 37
assert.equal(result.wrapperNoHermesExecutionVerificationResult.promptSent, false) // 38
assert.equal(result.wrapperNoHermesExecutionVerificationResult.modelCalls, false) // 39
assert.equal(result.wrapperNoHermesExecutionVerificationResult.networkUsed, false) // 40
assert.equal(result.wrapperNoHermesExecutionVerificationResult.dnsResolved, false) // 41
assert.equal(result.wrapperNoHermesExecutionVerificationResult.endpointTests, false) // 42
assert.equal(result.wrapperNoHermesExecutionVerificationResult.credentialValuesRead, false) // 43
assert.equal(result.wrapperNoHermesExecutionVerificationResult.runRootCreated, false) // 44
assert.equal(result.wrapperNoHermesExecutionVerificationResult.toolsetsEnabled, false) // 45
assert.equal(result.wrapperConfigSerializerVerificationResult.writesFiles, false) // 46
assert.equal(result.wrapperCommandEnvelopeVerificationResult.executionAllowed, false) // 47
assert.equal(result.wrapperCommandEnvelopeVerificationResult.networkAllowed, false) // 48
assert.equal(result.wrapperCommandEnvelopeVerificationResult.modelCallsAllowed, false) // 49
assert.equal(result.wrapperCommandEnvelopeVerificationResult.credentialAccessAllowed, false) // 50
assert.equal(result.wrapperCommandEnvelopeVerificationResult.toolsetsEnabled, false) // 51
assert.equal(result.wrapperStaticSafetyScanResult.matches.length, 0) // 52
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationInput(input).ok, true) // 53
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationResult(result).ok, true) // 54
assert.equal(parseFactoryHermesWrapperNoToolModeVerificationResult(serializeFactoryHermesWrapperNoToolModeVerificationResult(result)).verificationId, result.verificationId) // 55
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeVerificationResult(result))), false) // 56
assert.equal(existsSync(paths.verificationResult), true) // 57
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 58
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 59
for (const action of ['execute_uv_now','execute_python_now','execute_pip_now','execute_setup_py_now']) assert.equal(result.wrapperNoToolModeVerificationReceipt.notAuthorizedActions.includes(action), true) // 60
assert.equal(existsSync('docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_VERIFICATION_GATE_V1.md'), true) // 61
console.log('factory-hermes-wrapper-no-tool-mode-verification-smoke: PASS 61 checks')
