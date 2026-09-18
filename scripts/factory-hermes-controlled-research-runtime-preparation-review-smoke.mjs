import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-preparation-review/index.cjs'
import { parseFactoryHermesControlledResearchRuntimePreparationReviewResult, serializeFactoryHermesControlledResearchRuntimePreparationReviewResult, summarizeFactoryHermesControlledResearchRuntimePreparationReviewResult, validateFactoryHermesControlledResearchRuntimePreparationReviewInput, validateFactoryHermesControlledResearchRuntimePreparationReviewResult } from '../src/factory/hermes-controlled-research-runtime-preparation-review/index.ts'

const { executeFactoryHermesControlledResearchRuntimePreparationReview, resolveFactoryHermesControlledResearchRuntimePreparationReviewPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimePreparationReviewPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { reviewedAt: '2026-07-23T17:00:00.000Z', reviewedBy: 'factory-hermes-controlled-research-runtime-preparation-review-smoke' }

assert.equal(existsSync(paths.controlledRuntimePreparationResult), true) // 1
assert.equal(readJson(paths.controlledRuntimePreparationResult).status, 'controlled_research_runtime_prepared') // 2
assert.equal(validateFactoryHermesControlledResearchRuntimePreparationReviewInput(input).ok, true) // 41
const result = await executeFactoryHermesControlledResearchRuntimePreparationReview(input)
assert.equal(existsSync(paths.preparationReviewResult), true) // 3
assert.equal(['controlled_research_runtime_preparation_review_completed', 'controlled_research_runtime_preparation_review_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_controlled_research_runtime_preparation_review_accepted_for_live_artifact_planning', 'hermes_controlled_research_runtime_preparation_review_blocked_artifacts_incomplete_or_unsafe'].includes(result.decision), true) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
if (result.status === 'controlled_research_runtime_preparation_review_completed') {
  for (const key of ['controlledRuntimePreparationArtifactsReview', 'controlledRuntimeVirtualTempConfigCandidateReview', 'controlledRuntimeRunRootPathValidationReview', 'controlledRuntimeCredentialReferenceBoundaryReview', 'controlledRuntimePromptReferencePolicyReview', 'controlledRuntimeModelNetworkAllowlistReview', 'controlledRuntimeToolsetDisableProofRequirementsReview', 'controlledRuntimeTimeoutKillSwitchEnvelopeReview', 'controlledRuntimeOutputIngestionContractReview', 'controlledRuntimePreparationLimitationsCarryForward', 'controlledRuntimePreparationReviewRiskDispositionRegister', 'controlledRuntimeLiveArtifactPlanningEnvelope']) assert.ok(result[key]) // 7-18
  assert.equal(result.controlledRuntimeLiveArtifactPlanningAllowed, true) // 19
  assert.equal(result.canProceedToControlledResearchRuntimeLiveArtifactPlanning, true) // 20
}
if (result.status === 'controlled_research_runtime_preparation_review_blocked') {
  assert.ok(result.reviewBlockerPlan) // 21
  assert.equal(result.canProceedToKeepHermesResearchBlockedDecision, true) // 22
}
for (const key of ['canProceedToControlledResearchRuntimeLiveArtifactCreation', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 23-35
for (const limitation of ['virtual_temp_config_is_not_live_config', 'run_root_path_is_not_created_directory', 'credential_ref_is_not_credential_value']) assert.equal(result.controlledRuntimePreparationLimitationsCarryForward.limitations.includes(limitation), true) // 36-38
for (const riskId of ['live_artifact_planning_confused_with_live_artifact_creation', 'hidden_defaults_loaded_in_future_runtime']) assert.equal(result.controlledRuntimePreparationReviewRiskDispositionRegister.risks.some((risk) => risk.riskId === riskId), true) // 39-40
assert.equal(validateFactoryHermesControlledResearchRuntimePreparationReviewResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimePreparationReviewResult(result))) // 42
assert.equal(parseFactoryHermesControlledResearchRuntimePreparationReviewResult(serializeFactoryHermesControlledResearchRuntimePreparationReviewResult(result)).reviewId, result.reviewId) // 43
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimePreparationReviewResult(result))), false) // 44
assert.equal(existsSync(paths.preparationReviewResult), true) // 45
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 46
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 47
for (const flag of ['prepare_live_runtime_now', 'create_live_temp_config_now', 'create_run_root_now', 'execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'execute_hermes_now', 'execute_hermes_help_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'read_dotenv_now', 'use_network_now', 'resolve_dns_now', 'test_endpoints_now', 'read_credential_values_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimePreparationReviewReceipt.notAuthorizedActions.includes(flag), true) // 48-66
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_REVIEW_GATE_V1.md'), true) // 67
console.log('factory-hermes-controlled-research-runtime-preparation-review-smoke: PASS 67 checks')
