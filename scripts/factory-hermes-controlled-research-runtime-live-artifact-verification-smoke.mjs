import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-live-artifact-verification/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult, serializeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult, summarizeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult, validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationInput, validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult } from '../src/factory/hermes-controlled-research-runtime-live-artifact-verification/index.ts'

const { executeFactoryHermesControlledResearchRuntimeLiveArtifactVerification, resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { verifiedAt: '2026-07-23T21:00:00.000Z', verifiedBy: 'factory-hermes-controlled-research-runtime-live-artifact-verification-smoke' }

assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationInput(input).ok, true) // 1
for (const file of [paths.liveArtifactCreationResult, paths.liveArtifactApprovalResult, paths.liveArtifactPlanningResult, paths.preparationReviewResult, paths.preparationResult, paths.runtimeSelectionDecisionResult, paths.liveTempConfigPath, paths.runRootManifestPath]) assert.equal(existsSync(file), true) // 2-9
const result = await executeFactoryHermesControlledResearchRuntimeLiveArtifactVerification(input)
assert.equal(existsSync(paths.liveArtifactVerificationResult), true) // 10
assert.equal(result.status, 'controlled_research_runtime_live_artifacts_verified') // 11
assert.equal(result.decision, 'hermes_controlled_research_runtime_live_artifacts_verified_for_review') // 12
assert.equal(result.liveArtifactVerificationStatus, 'verified_with_limitations') // 13
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 14
for (const key of ['liveTempConfigExists', 'liveRunManifestExists', 'liveTempConfigPathContainmentPassed', 'liveRunRootPathContainmentPassed', 'symlinkEscapeCheckPassed', 'liveTempConfigSecretScanPassed', 'runManifestSecretScanPassed', 'liveTempConfigSchemaSafetyScanPassed', 'runManifestValidationPassed', 'noPromptBodyDetected', 'noCredentialValuesDetected', 'noEnvDumpDetected', 'noExecutableCommandDetected', 'noHermesExecutionEvidence', 'noNetworkEvidence', 'noToolsetEnablementEvidence', 'canProceedToControlledResearchRuntimeLiveArtifactVerificationReview']) assert.equal(result[key], true) // 15-31
for (const key of ['canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings']) assert.equal(result[key], false) // 32-41
assert.equal(result.liveTempConfigVerificationResult.exists, true) // 42
assert.equal(result.liveTempConfigVerificationResult.isFile, true) // 43
assert.equal(result.liveTempConfigVerificationResult.secretScanPassed, true) // 44
assert.equal(result.liveTempConfigVerificationResult.credentialValueScanPassed, true) // 45
assert.equal(result.liveTempConfigVerificationResult.envDumpScanPassed, true) // 46
assert.equal(result.liveTempConfigVerificationResult.executableCommandDetected, false) // 47
assert.equal(result.liveTempConfigVerificationResult.networkEnablementDetected, false) // 48
assert.equal(result.liveTempConfigVerificationResult.toolsetEnablementDetected, false) // 49
assert.equal(result.liveRunRootManifestVerificationResult.jsonParsePassed, true) // 50
assert.equal(result.liveRunRootManifestVerificationResult.executionFlagsSafe, true) // 51
assert.equal(result.liveRunRootManifestVerificationResult.wrapperStrategyMatches, true) // 52
assert.equal(result.liveArtifactPathContainmentVerificationResult.passed, true) // 53
assert.equal(result.liveArtifactSymlinkVerificationResult.symlinkDetected, false) // 54
assert.equal(result.liveArtifactDirectoryInventoryVerificationResult.passed, true) // 55
assert.equal(result.liveArtifactRuntimeSafetyScanResult.hermesExecuted, false) // 56
assert.equal(result.liveArtifactRuntimeSafetyScanResult.oneShotExecuted, false) // 57
assert.equal(result.liveArtifactRuntimeSafetyScanResult.networkUsed, false) // 58
assert.equal(result.liveArtifactRuntimeSafetyScanResult.dotEnvRead, false) // 59
assert.equal(result.liveArtifactRuntimeSafetyScanResult.toolsetsEnabled, false) // 60
for (const limitation of ['config_schema_partially_unknown', 'empty_toolsets_support_unknown', 'no_real_hermes_execution_tested', 'no_model_network_or_provider_tested', 'verification_does_not_prove_runtime_success', 'verification_does_not_approve_execution']) assert.equal(result.liveArtifactVerificationEvidenceManifest.limitations.includes(limitation), true) // 61-66
assert.equal(result.controlledRuntimeLiveArtifactVerificationReviewEnvelope.approvedFor, 'controlled_research_runtime_live_artifact_verification_review_only') // 67
assert.equal(result.controlledRuntimeLiveArtifactVerificationReviewEnvelope.flags.controlledRuntimeExecutionAllowedNow, false) // 68
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result))) // 69
assert.equal(parseFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(serializeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result)).verificationId, result.verificationId) // 70
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result))), false) // 71
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 72
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 73
for (const action of ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'execute_hermes_now', 'execute_hermes_help_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'read_dotenv_now', 'use_network_now', 'resolve_dns_now', 'test_endpoints_now', 'read_credential_values_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimeLiveArtifactVerificationReceipt.notAuthorizedActions.includes(action), true) // 74-92
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_GATE_V1.md'), true) // 93
console.log('factory-hermes-controlled-research-runtime-live-artifact-verification-smoke: PASS 93 checks')
