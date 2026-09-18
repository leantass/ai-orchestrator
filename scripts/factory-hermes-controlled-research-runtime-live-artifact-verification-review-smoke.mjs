import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-live-artifact-verification-review/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult, serializeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult, summarizeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult, validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput, validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult } from '../src/factory/hermes-controlled-research-runtime-live-artifact-verification-review/index.ts'

const { executeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReview, resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { reviewedAt: '2026-07-24T00:00:00.000Z', reviewedBy: 'factory-hermes-controlled-research-runtime-live-artifact-verification-review-smoke', liveArtifactVerificationResult: {} }

assert.equal(existsSync(paths.liveArtifactVerificationResult), true) // 1
JSON.parse(readFileSync(paths.liveArtifactVerificationResult, 'utf8')) // 2
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput(input).ok, true) // 3
const result = await executeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReview(input)
assert.equal(existsSync(paths.liveArtifactVerificationReviewResult), true) // 4
assert.ok(['controlled_research_runtime_live_artifact_verification_review_completed', 'controlled_research_runtime_live_artifact_verification_review_blocked'].includes(result.status)) // 5
assert.ok(['hermes_controlled_research_runtime_live_artifact_verification_review_accepted_for_execution_planning', 'hermes_controlled_research_runtime_live_artifact_verification_review_blocked_evidence_incomplete_or_unsafe'].includes(result.decision)) // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
if (result.status === 'controlled_research_runtime_live_artifact_verification_review_completed') {
  for (const key of ['liveArtifactVerificationEvidenceReview', 'liveTempConfigVerificationReview', 'runManifestVerificationReview', 'pathContainmentVerificationReview', 'symlinkVerificationReview', 'directoryInventoryVerificationReview', 'secretScanVerificationReview', 'runtimeSafetyVerificationReview', 'liveArtifactVerificationLimitationsCarryForward', 'liveArtifactVerificationReviewRiskDispositionRegister', 'controlledRuntimeExecutionPlanningEnvelope']) assert.ok(result[key]) // 8-18
  assert.equal(result.controlledRuntimeExecutionPlanningAllowed, true) // 19
  assert.equal(result.canProceedToControlledResearchRuntimeExecutionPlanning, true) // 20
} else {
  assert.ok(result.reviewBlockerPlan) // 21
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 22
}
for (const key of ['canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 23-34
assert.equal(result.liveArtifactVerificationLimitationsCarryForward.limitations.includes('verification_does_not_approve_execution'), true) // 35
assert.equal(result.liveArtifactVerificationLimitationsCarryForward.limitations.includes('config_schema_partially_unknown'), true) // 36
assert.equal(result.liveArtifactVerificationLimitationsCarryForward.limitations.includes('empty_toolsets_support_unknown'), true) // 37
assert.equal(result.liveArtifactVerificationReviewRiskDispositionRegister.risks.some((risk) => risk.riskId === 'execution_planning_confused_with_runtime_execution'), true) // 38
assert.equal(result.liveArtifactVerificationReviewRiskDispositionRegister.risks.some((risk) => risk.riskId === 'hidden_defaults_loaded_in_real_runtime'), true) // 39
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput({ ...input, liveArtifactVerificationResult: result }).ok, true) // 40
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result))) // 41
assert.equal(parseFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(serializeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result)).reviewId, result.reviewId) // 42
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result))), false) // 43
assert.equal(existsSync(paths.liveArtifactVerificationReviewResult), true) // 44
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 45
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 46
for (const key of ['noResearchExecution', 'noAdapterExecution', 'noWrapperAgainstHermes', 'noHermesExecution', 'noHermesExeExecution', 'noOneShot', 'noPromptSent', 'noModelCalls', 'noCredentialValuesRead', 'noToolsetsEnabled']) assert.equal(result.runtimeSafetyVerificationReview[key], true) // 47-56
assert.equal(result.runtimeSafetyVerificationReview.noNetwork, true) // 57
assert.equal(result.runtimeSafetyVerificationReview.noDns, true) // 58
assert.equal(result.runtimeSafetyVerificationReview.noEndpoints, true) // 59
assert.equal(result.secretScanVerificationReview.noCredentialValues, true) // 60
assert.equal(result.secretScanVerificationReview.noDotEnv, true) // 61
assert.equal(result.secretScanVerificationReview.noEnvDump, true) // 62
assert.equal(result.runtimeSafetyVerificationReview.noToolsetsEnabled, true) // 63
assert.equal(result.controlledResearchRuntimeLiveArtifactVerificationReviewReceipt.runtimeExecutionApproved, false) // 64
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_GATE_V1.md'), true) // 65
console.log('factory-hermes-controlled-research-runtime-live-artifact-verification-review-smoke: PASS 65 checks')
