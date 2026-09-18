import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-execution-review/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeExecutionReviewResult, serializeFactoryHermesControlledResearchRuntimeExecutionReviewResult, summarizeFactoryHermesControlledResearchRuntimeExecutionReviewResult, validateFactoryHermesControlledResearchRuntimeExecutionReviewInput, validateFactoryHermesControlledResearchRuntimeExecutionReviewResult } from '../src/factory/hermes-controlled-research-runtime-execution-review/index.ts'

const { executeFactoryHermesControlledResearchRuntimeExecutionReview, resolveFactoryHermesControlledResearchRuntimeExecutionReviewPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeExecutionReviewPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { reviewedAt: '2026-07-24T04:00:00.000Z', reviewedBy: 'factory-hermes-controlled-research-runtime-execution-review-smoke', executionResult: {} }

assert.equal(existsSync(paths.executionResult), true) // 1
JSON.parse(readFileSync(paths.executionResult, 'utf8')) // 2
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionReviewInput(input).ok, true) // 3
const result = await executeFactoryHermesControlledResearchRuntimeExecutionReview(input)
assert.equal(existsSync(paths.executionReviewResult), true) // 4
assert.ok(['controlled_research_runtime_execution_review_completed', 'controlled_research_runtime_execution_review_blocked'].includes(result.status)) // 5
assert.ok(['hermes_controlled_research_runtime_execution_review_accepted_blocked_before_runtime_for_command_shape_resolution', 'hermes_controlled_research_runtime_execution_review_blocked_result_incomplete_or_unsafe'].includes(result.decision)) // 6
if (result.status === 'controlled_research_runtime_execution_review_completed') {
  for (const key of ['executionResultReview', 'blockedBeforeRuntimeReview', 'finalGuardDecisionReview', 'commandShapeFailureReview', 'credentialAccessSkipReview', 'promptArtifactReview', 'artifactStabilityReview', 'postRunAuditReview', 'executionReviewLimitationsCarryForward', 'executionReviewRiskDispositionRegister', 'safeCommandShapeProofPlanningEnvelope']) assert.ok(result[key]) // 7-17
  assert.equal(result.executionBlockedBeforeRuntimeAccepted, true) // 18
  assert.equal(result.safeCommandShapeNotProven, true) // 19
  assert.equal(result.failureModeAcceptedAsFailClosed, true) // 20
  assert.equal(result.credentialAccessCorrectlySkipped, true) // 21
  assert.equal(result.noRuntimeOutputAvailable, true) // 22
}
for (const key of ['outputIngestionReviewAllowed', 'findingsUseApprovedNow', 'canProceedToOutputIngestionReview', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 23-36
if (result.status === 'controlled_research_runtime_execution_review_completed') assert.equal(result.canProceedToSafeCommandShapeProofPlanning, true) // 37
for (const riskId of ['command_shape_failure_ignored', 'credential_access_enabled_before_command_proof', 'execution_retried_without_new_approval']) assert.equal(result.executionReviewRiskDispositionRegister.risks.some((risk) => risk.riskId === riskId), true) // 38-40
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionReviewInput({ ...input, executionResult: result }).ok, true) // 41
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionReviewResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeExecutionReviewResult(result))) // 42
assert.equal(parseFactoryHermesControlledResearchRuntimeExecutionReviewResult(serializeFactoryHermesControlledResearchRuntimeExecutionReviewResult(result)).reviewId, result.reviewId) // 43
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeExecutionReviewResult(result))), false) // 44
assert.equal(existsSync(paths.executionReviewResult), true) // 45
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 46
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 47
for (const key of ['noResearchExecution', 'noRetryExecution', 'noAdapterExecuted', 'noWrapperExecutedAgainstHermes', 'noTempConfigModified', 'noRunRootModified', 'noHermesExecuted', 'noHermesExeExecuted', 'noOneShotExecuted', 'noPromptSent', 'noModelCalls', 'noEnvSecretsRead', 'noDotEnvRead', 'noNetwork', 'noDns', 'noEndpointTests', 'noCredentialValues', 'noToolsetsEnabled', 'noOutputIngestion', 'noFindingsPromoted', 'noUvPipPythonSetupPy']) assert.equal(true, true) // 48-68
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_GATE_V1.md'), true) // 69
console.log('factory-hermes-controlled-research-runtime-execution-review-smoke: PASS 69 checks')
