import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-verification-review/index.cjs'
import { parseFactoryHermesWrapperNoToolModeVerificationReviewResult, REVIEW_REQUIRED_LIMITATIONS, REVIEW_REQUIRED_RISKS, serializeFactoryHermesWrapperNoToolModeVerificationReviewResult, summarizeFactoryHermesWrapperNoToolModeVerificationReviewResult, validateFactoryHermesWrapperNoToolModeVerificationReviewInput, validateFactoryHermesWrapperNoToolModeVerificationReviewResult } from '../src/factory/hermes-wrapper-no-tool-mode-verification-review/index.ts'
const { executeFactoryHermesWrapperNoToolModeVerificationReview, resolveFactoryHermesWrapperNoToolModeVerificationReviewPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeVerificationReviewPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.verificationResult), true) // 1
const verification = readJson(paths.verificationResult)
assert.equal(verification.status, 'wrapper_no_tool_mode_verification_completed') // 2
assert.equal(verification.decision, 'hermes_wrapper_no_tool_mode_verified_for_review') // 3
assert.equal(verification.verificationStatus, 'verified_code_only_not_runtime_executable') // 4
assert.equal(verification.wrapperVerificationPassed, true) // 5
assert.equal(verification.canProceedToHermesWrapperNoToolModeVerificationReview, true) // 6
assert.equal(verification.canProceedToResearchRuntimeAdapterApprovalRetry, false) // 7
assert.equal(verification.canRunResearchNow, false) // 8
const input = { reviewedAt: '2026-07-23T09:00:00.000Z', reviewedBy: 'factory-hermes-wrapper-no-tool-mode-verification-review-smoke', verificationResult: verification, verificationApprovalResult: readJson(paths.verificationApprovalResult), verificationPlanningResult: readJson(paths.verificationPlanningResult), implementationResult: readJson(paths.implementationResult), adapterApprovalResult: readJson(paths.adapterApprovalResult) }
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationReviewInput(input).ok, true) // 9
const result = await executeFactoryHermesWrapperNoToolModeVerificationReview(input)
assert.equal(existsSync(paths.verificationReviewResult), true) // 10
assert.equal(result.status, 'wrapper_no_tool_mode_verification_review_completed') // 11
assert.equal(result.decision, 'hermes_wrapper_no_tool_mode_verification_review_accepted_for_adapter_approval_retry') // 12
assert.equal(result.reviewStatus, 'accepted_with_limitations') // 13
assert.ok(result.wrapperVerificationEvidenceReview) // 14
assert.ok(result.wrapperVerificationLimitationsReview) // 15
assert.ok(result.wrapperVerificationRiskDispositionRegister) // 16
assert.ok(result.researchRuntimeAdapterApprovalRetryEnvelope) // 17
assert.ok(result.wrapperNoToolModeVerificationReviewReceipt) // 18
assert.ok(result.hermesWrapperNoToolModeVerificationReviewDecision) // 19
for (const limitation of REVIEW_REQUIRED_LIMITATIONS) assert.equal(result.wrapperVerificationLimitationsReview.acceptedLimitations.includes(limitation), true) // 20
for (const risk of REVIEW_REQUIRED_RISKS) assert.equal(result.wrapperVerificationRiskDispositionRegister.risks.some((item) => item.riskId === risk), true) // 21
assert.equal(result.canProceedToResearchRuntimeAdapterApprovalRetry, true) // 22
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 23
assert.equal(result.canRunResearchNow, false) // 24
assert.equal(result.canExecuteHermesNow, false) // 25
assert.equal(result.canPassPromptNow, false) // 26
assert.equal(result.canUseNetworkNow, false) // 27
assert.equal(result.canUseCredentialsNow, false) // 28
assert.equal(result.canReadEnvSecretsNow, false) // 29
assert.equal(result.canCallModelsNow, false) // 30
assert.equal(result.canEnableToolsetsNow, false) // 31
assert.equal(result.canMutateFilesystemNow, false) // 32
assert.equal(result.canUseFindings, false) // 33
assert.equal(result.researchRuntimeAdapterApprovalRetryEnvelope.runtimeAdapterApprovedNow, false) // 34
assert.equal(result.researchRuntimeAdapterApprovalRetryEnvelope.hermesExecutionApprovedNow, false) // 35
assert.equal(result.researchRuntimeAdapterApprovalRetryEnvelope.networkApprovedNow, false) // 36
assert.equal(result.researchRuntimeAdapterApprovalRetryEnvelope.credentialAccessApprovedNow, false) // 37
assert.equal(result.researchRuntimeAdapterApprovalRetryEnvelope.toolsetEnablementApprovedNow, false) // 38
assert.equal(result.wrapperNoToolModeVerificationReviewReceipt.notAuthorizedActions.includes('execute_hermes_now'), true) // 39
assert.equal(result.wrapperNoToolModeVerificationReviewReceipt.notAuthorizedActions.includes('execute_oneshot_now'), true) // 40
assert.equal(result.wrapperNoToolModeVerificationReviewReceipt.notAuthorizedActions.includes('read_env_secrets_now'), true) // 41
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationReviewResult(result).ok, true) // 42
assert.equal(parseFactoryHermesWrapperNoToolModeVerificationReviewResult(serializeFactoryHermesWrapperNoToolModeVerificationReviewResult(result)).reviewId, result.reviewId) // 43
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeVerificationReviewResult(result))), false) // 44
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode'), false) // 45
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 46
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 47
mkdirSync('.codex-temp/hermes-wrapper-no-tool-mode-verification-review-v1/reports', { recursive: true })
writeFileSync(paths.implementationReport, `# Factory Hermes Wrapper No-Tool Mode Verification Review Gate v1\n\nStatus: ${result.status}\nDecision: ${result.decision}\nReview status: ${result.reviewStatus}\nCan proceed to adapter approval retry: ${result.canProceedToResearchRuntimeAdapterApprovalRetry}\nCan run research now: ${result.canRunResearchNow}\nCan execute Hermes now: ${result.canExecuteHermesNow}\n\nNo Hermes execution, no wrapper-against-Hermes execution, no temp config creation, no prompt, no model call, no network, no DNS, no endpoint test, no credential/env read, no run root creation, no toolset enablement, no uv/pip/python/setup.py.\n`)
assert.equal(existsSync(paths.implementationReport), true) // 48
console.log('factory-hermes-wrapper-no-tool-mode-verification-review-smoke: PASS 48 checks')
