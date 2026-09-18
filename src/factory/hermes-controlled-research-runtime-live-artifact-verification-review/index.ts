export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_KIND = 'factory-hermes-controlled-research-runtime-live-artifact-verification-review'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_VERSION
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_KIND
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewStatus = 'controlled_research_runtime_live_artifact_verification_review_completed' | 'controlled_research_runtime_live_artifact_verification_review_blocked'
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewDecision = 'hermes_controlled_research_runtime_live_artifact_verification_review_accepted_for_execution_planning' | 'hermes_controlled_research_runtime_live_artifact_verification_review_blocked_evidence_incomplete_or_unsafe'
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewBlocker = { blockerId: string, message: string }
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewWarning = { warningId: string, message: string }
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewSummary = { reviewId: string, status: string, decision: string, canProceedToControlledResearchRuntimeExecutionPlanning: boolean, canRunResearchNow: boolean }
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput = { reviewedAt: string, reviewedBy: string, liveArtifactVerificationResult?: any, liveArtifactCreationResult?: any, liveArtifactApprovalResult?: any, liveArtifactPlanningResult?: any, preparationReviewResult?: any, runtimeSelectionDecisionResult?: any }
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', runtimeExecutionAllowedNow: false }
export type FactoryHermesLiveArtifactVerificationEvidenceReview = any
export type FactoryHermesLiveTempConfigVerificationReview = any
export type FactoryHermesRunManifestVerificationReview = any
export type FactoryHermesPathContainmentVerificationReview = any
export type FactoryHermesSymlinkVerificationReview = any
export type FactoryHermesDirectoryInventoryVerificationReview = any
export type FactoryHermesSecretScanVerificationReview = any
export type FactoryHermesRuntimeSafetyVerificationReview = any
export type FactoryHermesLiveArtifactVerificationLimitationsCarryForward = any
export type FactoryHermesLiveArtifactVerificationReviewRiskDispositionRegister = any
export type FactoryHermesControlledRuntimeExecutionPlanningEnvelope = any
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewReceipt = any
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewDecisionRecord = any
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewBlockerPlan = any
export type FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult = any

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const falseFlags = ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const limitations = ['config_schema_partially_unknown', 'empty_toolsets_support_unknown', 'no_real_hermes_execution_tested', 'no_model_network_or_provider_tested', 'verification_does_not_prove_runtime_success', 'verification_does_not_approve_execution', 'live_artifacts_verified_only_for_pre_runtime_safety', 'temp_config_verified_as_file_but_not_runtime_behavior', 'run_manifest_verified_as_manifest_but_not_execution_result', 'hidden_defaults_may_still_exist_in_real_cli_runtime', 'future_execution_planning_must_not_auto_execute', 'future_execution_planning_must_preserve_credential_prompt_network_model_toolset_blocks']
const riskIds = ['verification_review_confused_with_execution_approval', 'execution_planning_confused_with_runtime_execution', 'config_schema_unknown_overlooked', 'empty_toolsets_unknown_overlooked', 'hidden_defaults_loaded_in_real_runtime', 'verified_config_file_confused_with_verified_runtime_behavior', 'run_manifest_confused_with_successful_run', 'prompt_passed_too_early', 'credential_read_too_early', 'network_enabled_too_early', 'toolsets_enabled_too_early', 'findings_used_without_real_ingestion_review']

function check(checks: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function validCreation(result: any): boolean {
  return result?.status === 'controlled_research_runtime_live_artifacts_created'
    && result?.decision === 'hermes_controlled_research_runtime_live_artifacts_created_for_verification'
    && (result?.canProceedToLiveArtifactVerification === true || result?.canProceedToControlledResearchRuntimeLiveArtifactVerification === true || result?.controlledRuntimeLiveArtifactVerificationEnvelope?.canProceedToControlledResearchRuntimeLiveArtifactVerification === true)
    && (result?.canProceedToRuntimeExecution === false || result?.canProceedToControlledResearchRuntimeExecution === false || result?.controlledRuntimeLiveArtifactVerificationEnvelope?.controlledRuntimeExecutionAllowedNow === false)
}

function validApproval(result: any): boolean {
  return (result?.liveArtifactCreationAllowed === true || result?.liveArtifactCreationGateAllowed === true || result?.hermesControlledResearchRuntimeLiveArtifactApprovalDecision?.controlledRuntimeLiveArtifactCreationAllowed === true)
    && result?.controlledRuntimeExecutionAllowedNow === false
    && result?.canRunResearchNow === false
    && String(result?.status || '').includes('approval')
    && (String(result?.decision || '').includes('approval') || String(result?.decision || '').includes('approved'))
}

function validPlanning(result: any): boolean {
  return result?.liveTempConfigCreationPlanBuilt === true
    && result?.liveRunRootCreationPlanBuilt === true
    && result?.filesystemMutationAllowlistPlanBuilt === true
    && result?.secretRedactionPlanBuilt === true
    && result?.artifactSafetyCheckPlanBuilt === true
    && result?.preRuntimeVerificationPlanBuilt === true
    && result?.canRunResearchNow === false
    && String(result?.status || '').includes('plan')
}

function buildRiskDispositionRegister() {
  return {
    risks: riskIds.map((riskId) => ({
      riskId,
      severity: riskId.includes('confused') ? 'high' : 'medium',
      disposition: 'accepted_for_execution_planning_only',
      blocksRuntimeExecutionDisposition: 'blocks_runtime_execution',
      blocksResearchExecutionDisposition: 'blocks_research_execution',
      futureControlDisposition: 'requires_future_gate_control',
      mitigation: 'Carry explicit false runtime, research, prompt, credential, model, network, toolset, ingestion, and findings flags into the execution planning envelope.',
      blocksVerificationReview: false,
      blocksExecutionPlanning: false,
      blocksRuntimeExecution: true,
      blocksResearchExecution: true,
    })),
  }
}

export function evaluateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReview(input: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult {
  const verification = input.liveArtifactVerificationResult
  const checks: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewCheck[] = []
  const reviewId = `hermes-controlled-research-runtime-live-artifact-verification-review:75b300f:${input.reviewedAt}`
  const requiredChecks = [
    check(checks, 'verification_status', verification?.status, 'controlled_research_runtime_live_artifacts_verified'),
    check(checks, 'verification_decision', verification?.decision, 'hermes_controlled_research_runtime_live_artifacts_verified_for_review'),
    check(checks, 'verification_limitations', verification?.liveArtifactVerificationStatus, 'verified_with_limitations'),
    check(checks, 'selected_wrapper_strategy', verification?.selectedWrapperStrategy, selectedWrapperStrategy),
    check(checks, 'live_temp_config_exists', verification?.liveTempConfigExists),
    check(checks, 'live_run_manifest_exists', verification?.liveRunManifestExists),
    check(checks, 'config_path_containment', verification?.liveTempConfigPathContainmentPassed),
    check(checks, 'run_root_path_containment', verification?.liveRunRootPathContainmentPassed),
    check(checks, 'symlink_escape_check', verification?.symlinkEscapeCheckPassed),
    check(checks, 'config_secret_scan', verification?.liveTempConfigSecretScanPassed),
    check(checks, 'manifest_secret_scan', verification?.runManifestSecretScanPassed),
    check(checks, 'config_schema_safety', verification?.liveTempConfigSchemaSafetyScanPassed),
    check(checks, 'manifest_validation', verification?.runManifestValidationPassed),
    check(checks, 'directory_inventory', verification?.directoryInventoryPassed ?? verification?.liveArtifactDirectoryInventoryVerificationResult?.passed),
    check(checks, 'no_prompt_body', verification?.noPromptBodyDetected),
    check(checks, 'no_credential_values', verification?.noCredentialValuesDetected),
    check(checks, 'no_env_dump', verification?.noEnvDumpDetected),
    check(checks, 'no_executable_command', verification?.noExecutableCommandDetected),
    check(checks, 'no_hermes_execution', verification?.noHermesExecutionEvidence),
    check(checks, 'no_network', verification?.noNetworkEvidence),
    check(checks, 'no_toolsets', verification?.noToolsetEnablementEvidence),
    check(checks, 'evidence_manifest_present', Boolean(verification?.liveArtifactVerificationEvidenceManifest)),
    check(checks, 'review_envelope_present', Boolean(verification?.controlledRuntimeLiveArtifactVerificationReviewEnvelope)),
    check(checks, 'verification_review_allowed', verification?.canProceedToControlledResearchRuntimeLiveArtifactVerificationReview),
    check(checks, 'verification_blocks_execution', verification?.canProceedToControlledResearchRuntimeExecution, false),
    check(checks, 'verification_blocks_research', verification?.canRunResearchNow, false),
    check(checks, 'creation_valid', validCreation(input.liveArtifactCreationResult)),
    check(checks, 'approval_valid', validApproval(input.liveArtifactApprovalResult)),
    check(checks, 'planning_valid', validPlanning(input.liveArtifactPlanningResult)),
  ]
  const blockers = requiredChecks.every(Boolean) ? [] : checks.filter((item) => !item.passed).map((item) => ({ blockerId: item.checkId, message: `Review check failed: ${item.checkId}` }))
  const accepted = blockers.length === 0
  const status: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewStatus = accepted ? 'controlled_research_runtime_live_artifact_verification_review_completed' : 'controlled_research_runtime_live_artifact_verification_review_blocked'
  const decision: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewDecision = accepted ? 'hermes_controlled_research_runtime_live_artifact_verification_review_accepted_for_execution_planning' : 'hermes_controlled_research_runtime_live_artifact_verification_review_blocked_evidence_incomplete_or_unsafe'
  const liveArtifactVerificationEvidenceReview = { verificationCompleted: accepted, verificationStatus: verification?.liveArtifactVerificationStatus, liveTempConfigExists: verification?.liveTempConfigExists === true, runManifestExists: verification?.liveRunManifestExists === true, pathContainmentPassed: verification?.liveTempConfigPathContainmentPassed === true && verification?.liveRunRootPathContainmentPassed === true, symlinkCheckPassed: verification?.symlinkEscapeCheckPassed === true, directoryInventoryPassed: (verification?.directoryInventoryPassed ?? verification?.liveArtifactDirectoryInventoryVerificationResult?.passed) === true, secretScansPassed: verification?.liveTempConfigSecretScanPassed === true && verification?.runManifestSecretScanPassed === true, runtimeSafetyScanPassed: verification?.noHermesExecutionEvidence === true && verification?.noNetworkEvidence === true && verification?.noToolsetEnablementEvidence === true, evidenceManifestPresent: Boolean(verification?.liveArtifactVerificationEvidenceManifest), reviewEnvelopePresent: Boolean(verification?.controlledRuntimeLiveArtifactVerificationReviewEnvelope), evidenceIsPreRuntimeOnly: true, evidenceDoesNotProveRuntimeSuccess: true, evidenceDoesNotApproveExecution: true, evidenceSupportsExecutionPlanning: accepted, acceptedForExecutionPlanning: accepted, blocksImmediateRuntimeExecution: true, blocksImmediateResearchExecution: true }
  const liveTempConfigVerificationReview = { liveTempConfigExists: verification?.liveTempConfigExists === true, liveTempConfigPathContainmentPassed: verification?.liveTempConfigPathContainmentPassed === true, liveTempConfigSecretScanPassed: verification?.liveTempConfigSecretScanPassed === true, liveTempConfigSchemaSafetyScanPassed: verification?.liveTempConfigSchemaSafetyScanPassed === true, noCredentialValuesDetected: verification?.noCredentialValuesDetected === true, noEnvDumpDetected: verification?.noEnvDumpDetected === true, noPromptBodyDetected: verification?.noPromptBodyDetected === true, noExecutableCommandDetected: verification?.noExecutableCommandDetected === true, schemaWarnings: ['config_schema_partially_unknown', 'empty_toolsets_support_unknown'], acceptedForExecutionPlanning: accepted, notAcceptedAsRuntimeProof: true, blocksImmediateRuntimeExecution: true }
  const runManifestVerificationReview = { liveRunManifestExists: verification?.liveRunManifestExists === true, liveRunRootPathContainmentPassed: verification?.liveRunRootPathContainmentPassed === true, runManifestSecretScanPassed: verification?.runManifestSecretScanPassed === true, runManifestValidationPassed: verification?.runManifestValidationPassed === true, directoryInventoryPassed: (verification?.directoryInventoryPassed ?? verification?.liveArtifactDirectoryInventoryVerificationResult?.passed) === true, noOutputOrFindingEvidence: verification?.liveRunRootManifestVerificationResult?.outputOrFindingsDetected === false, executionFlagsSafe: verification?.liveRunRootManifestVerificationResult?.executionFlagsSafe === true, wrapperStrategyMatches: verification?.liveRunRootManifestVerificationResult?.wrapperStrategyMatches === true || verification?.selectedWrapperStrategy === selectedWrapperStrategy, acceptedForExecutionPlanning: accepted, blocksImmediateRuntimeExecution: true, blocksImmediateFindingsUse: true }
  const pathContainmentVerificationReview = { configPathContainmentPassed: verification?.liveTempConfigPathContainmentPassed === true, runRootPathContainmentPassed: verification?.liveRunRootPathContainmentPassed === true, noPathEscape: verification?.liveArtifactPathContainmentVerificationResult?.pathEscapeDetected === false, acceptedForExecutionPlanning: accepted, blocksImmediateFilesystemMutation: true, blocksImmediateRuntimeExecution: true }
  const symlinkVerificationReview = { noSymlinkEscape: verification?.liveArtifactSymlinkVerificationResult?.symlinkEscapeDetected === false, noSymlinkDetected: verification?.liveArtifactSymlinkVerificationResult?.symlinkDetected === false, acceptedForExecutionPlanning: accepted, blocksImmediateFilesystemMutation: true, blocksImmediateRuntimeExecution: true }
  const directoryInventoryVerificationReview = { noUnexpectedEntries: verification?.liveArtifactDirectoryInventoryVerificationResult?.unexpectedEntries?.length === 0, noRuntimeOutputFiles: verification?.liveArtifactDirectoryInventoryVerificationResult?.runtimeOutputFilesDetected === false, noFindingsFiles: verification?.liveArtifactDirectoryInventoryVerificationResult?.findingsFilesDetected === false, noStdoutStderrRuntimeFiles: verification?.liveArtifactDirectoryInventoryVerificationResult?.runtimeOutputFilesDetected === false, acceptedForExecutionPlanning: accepted, blocksImmediateFilesystemMutation: true, blocksImmediateRuntimeExecution: true }
  const secretScanVerificationReview = { noSecrets: verification?.liveArtifactSecretScanResult?.passed === true, noCredentialValues: verification?.noCredentialValuesDetected === true, noEnvDump: verification?.noEnvDumpDetected === true, noDotEnv: verification?.liveArtifactRuntimeSafetyScanResult?.dotEnvRead === false, noPromptBody: verification?.noPromptBodyDetected === true, credentialReferenceOnly: true, acceptedForExecutionPlanning: accepted, blocksImmediateRuntimeExecution: true, blocksImmediateResearchExecution: true, blocksImmediateFindingsUse: true }
  const runtimeSafetyVerificationReview = { noHermesExecution: verification?.liveArtifactRuntimeSafetyScanResult?.hermesExecuted === false, noHermesExeExecution: verification?.liveArtifactRuntimeSafetyScanResult?.hermesExeExecuted === false, noOneShot: verification?.liveArtifactRuntimeSafetyScanResult?.oneShotExecuted === false, noWrapperAgainstHermes: verification?.liveArtifactRuntimeSafetyScanResult?.wrapperExecutedAgainstHermes === false, noAdapterExecution: verification?.liveArtifactRuntimeSafetyScanResult?.adapterExecuted === false, noResearchExecution: verification?.liveArtifactRuntimeSafetyScanResult?.researchExecuted === false, noPromptSent: verification?.liveArtifactRuntimeSafetyScanResult?.promptSent === false, noModelCalls: verification?.liveArtifactRuntimeSafetyScanResult?.modelCallsMade === false, noNetwork: verification?.liveArtifactRuntimeSafetyScanResult?.networkUsed === false, noDns: verification?.liveArtifactRuntimeSafetyScanResult?.dnsResolved === false, noEndpoints: verification?.liveArtifactRuntimeSafetyScanResult?.endpointTests === false, noCredentialValuesRead: verification?.liveArtifactRuntimeSafetyScanResult?.credentialValuesRead === false, noToolsetsEnabled: verification?.liveArtifactRuntimeSafetyScanResult?.toolsetsEnabled === false, noIngestion: verification?.liveArtifactRuntimeSafetyScanResult?.outputIngested === false, noFindings: verification?.liveArtifactRuntimeSafetyScanResult?.findingsPromoted === false, acceptedForExecutionPlanning: accepted, blocksImmediateRuntimeExecution: true, blocksImmediateResearchExecution: true, blocksImmediateFindingsUse: true }
  const liveArtifactVerificationLimitationsCarryForward = { limitations, limitationsAcceptableForExecutionPlanning: accepted, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockImmediateResearchExecution: true, limitationsBlockImmediateFindingsUse: true }
  const controlledRuntimeExecutionPlanningEnvelope = accepted ? { envelopeId: `${reviewId}:execution-planning-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_execution_planning_only', selectedWrapperStrategy, sourceLiveArtifactVerificationReviewRef: 'controlled-research-runtime-live-artifact-verification-review-result.json', sourceLiveArtifactVerificationRef: 'controlled-research-runtime-live-artifact-verification-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Execution Planning Gate v1', purpose: 'plan the future controlled Hermes runtime execution using verified pre-runtime artifacts while keeping actual execution, prompt, model, network, credentials, toolsets, ingestion and findings blocked', allowedInNextGate: ['read live artifact verification review result', 'read live artifact verification result', 'read live artifact creation result', 'read research runtime adapter result', 'plan final runtime command envelope', 'plan explicit prompt artifact/reference', 'plan credential access gate', 'plan network/model allowlist gate', 'plan toolset disable proof gate', 'plan timeout/kill switch runtime control', 'plan output ingestion/review chain', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'pass prompt to Hermes', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets', 'execute research', 'ingest real output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { controlledRuntimeExecutionPlanningAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, outputIngestionAllowedNow: false, findingsUseAllowedNow: false, canProceedToControlledResearchRuntimeExecutionPlanning: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Execution Planning Gate v1' } : undefined
  return {
    reviewId, reviewKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_KIND, reviewVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_VERSION, reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, toolId: 'hermes_agent', liveArtifactVerificationRef: 'controlled-research-runtime-live-artifact-verification-result.json', liveArtifactCreationRef: 'controlled-research-runtime-live-artifact-creation-result.json', selectedWrapperStrategy, liveArtifactVerificationEvidenceReview, liveTempConfigVerificationReview, runManifestVerificationReview, pathContainmentVerificationReview, symlinkVerificationReview, directoryInventoryVerificationReview, secretScanVerificationReview, runtimeSafetyVerificationReview, liveArtifactVerificationLimitationsCarryForward, liveArtifactVerificationReviewRiskDispositionRegister: buildRiskDispositionRegister(), controlledRuntimeExecutionPlanningEnvelope, controlledResearchRuntimeLiveArtifactVerificationReviewReceipt: { receiptId: `${reviewId}:receipt`, reviewId, toolId: 'hermes_agent', decision, scope: 'controlled_research_runtime_live_artifact_verification_review_only', runtimeExecutionApproved: false, researchExecutionApproved: false }, hermesControlledResearchRuntimeLiveArtifactVerificationReviewDecision: { decisionId: `${reviewId}:decision`, decision, liveArtifactVerificationAccepted: accepted, executionPlanningAllowed: accepted, runtimeExecutionAllowedNow: false, researchExecutionApprovedNow: false }, reviewBlockerPlan: accepted ? undefined : { planId: `${reviewId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true }, checks, blockers, warnings: limitations.map((message) => ({ warningId: message, message })), status, decision, liveArtifactVerificationReviewStatus: accepted ? 'accepted_with_limitations' : 'blocked', liveArtifactVerificationAccepted: accepted, liveTempConfigVerificationAccepted: accepted, runManifestVerificationAccepted: accepted, pathContainmentVerificationAccepted: accepted, symlinkVerificationAccepted: accepted, directoryInventoryVerificationAccepted: accepted, secretScanVerificationAccepted: accepted, runtimeSafetyVerificationAccepted: accepted, controlledRuntimeExecutionPlanningAllowed: accepted, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimeExecutionPlanning: accepted, canProceedToControlledResearchRuntimeExecution: false, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Execution Planning Gate v1; execution remains blocked.' : 'Keep Hermes research blocked and repair incomplete or unsafe verification evidence.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput(input: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewInput): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewValidationResult {
  const errors: string[] = []
  if (!input?.reviewedAt) errors.push('reviewedAt_required')
  if (!input?.reviewedBy) errors.push('reviewedBy_required')
  if (!input?.liveArtifactVerificationResult) errors.push('liveArtifactVerificationResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_live_artifact_verification_review_completed', 'controlled_research_runtime_live_artifact_verification_review_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === 'controlled_research_runtime_live_artifact_verification_review_completed' && result?.canProceedToControlledResearchRuntimeExecutionPlanning !== true) errors.push('execution_planning_must_be_allowed_when_completed')
  if (result?.status === 'controlled_research_runtime_live_artifact_verification_review_blocked' && result?.canProceedToKeepHermesResearchBlockedDecision !== true) errors.push('blocked_result_must_keep_research_blocked')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(text: string): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult(result: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewResult): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewSummary {
  return { reviewId: result.reviewId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimeExecutionPlanning: result.canProceedToControlledResearchRuntimeExecutionPlanning, canRunResearchNow: result.canRunResearchNow }
}
