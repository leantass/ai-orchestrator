export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_KIND = 'factory-hermes-controlled-research-runtime-live-artifact-verification'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_VERSION = '1.0'

export interface FactoryHermesControlledResearchRuntimeLiveArtifactVerificationInput {
  verifiedAt: string
  verifiedBy: string
  liveArtifactCreationResult?: any
  liveArtifactApprovalResult?: any
  liveArtifactPlanningResult?: any
  preparationReviewResult?: any
  preparationResult?: any
  runtimeSelectionDecisionResult?: any
  liveTempConfigVerificationResult?: any
  liveRunRootManifestVerificationResult?: any
  liveArtifactPathContainmentVerificationResult?: any
  liveArtifactSymlinkVerificationResult?: any
  liveArtifactSecretScanResult?: any
  liveArtifactRuntimeSafetyScanResult?: any
  liveArtifactDirectoryInventoryVerificationResult?: any
}

export interface FactoryHermesControlledResearchRuntimeLiveArtifactVerificationValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesControlledResearchRuntimeLiveArtifactVerificationSummary { verificationId: string, status: string, decision: string, liveArtifactVerificationStatus: string, canProceedToControlledResearchRuntimeExecution: boolean, canRunResearchNow: boolean }

const notAuthorizedActions = ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'execute_hermes_now', 'execute_hermes_help_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'resolve_dns_now', 'test_endpoints_now', 'read_env_secrets_now', 'read_dotenv_now', 'read_credential_values_now', 'enable_toolsets_now', 'ingest_real_output_now', 'promote_findings_now', 'modify_hermes_source_now', 'modify_python_env_now', 'modify_cache_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']
const requiredLimitations = ['config_schema_partially_unknown', 'empty_toolsets_support_unknown', 'no_real_hermes_execution_tested', 'no_model_network_or_provider_tested', 'verification_does_not_prove_runtime_success', 'verification_does_not_approve_execution']

function isLiveArtifactCreationValid(result: any): boolean {
  return result?.status === 'controlled_research_runtime_live_artifacts_created'
    && result?.decision === 'hermes_controlled_research_runtime_live_artifacts_created_for_verification'
    && (result?.canProceedToLiveArtifactVerification === true || result?.canProceedToControlledResearchRuntimeLiveArtifactVerification === true)
    && (result?.canProceedToRuntimeExecution === false || result?.canProceedToControlledResearchRuntimeExecution === false)
}

function isLiveArtifactApprovalValid(result: any): boolean {
  return result?.status === 'controlled_research_runtime_live_artifact_approval_granted'
    && result?.decision === 'hermes_controlled_research_runtime_live_artifact_approved_for_creation_gate'
    && (result?.liveArtifactCreationAllowed === true || result?.hermesControlledResearchRuntimeLiveArtifactApprovalDecision?.controlledRuntimeLiveArtifactCreationAllowed === true)
    && result?.controlledRuntimeExecutionAllowedNow === false
    && result?.canRunResearchNow === false
}

function isLiveArtifactPlanningValid(result: any): boolean {
  return result?.status === 'controlled_research_runtime_live_artifact_plan_created'
    && result?.liveTempConfigCreationPlanBuilt === true
    && result?.liveRunRootCreationPlanBuilt === true
    && result?.filesystemMutationAllowlistPlanBuilt === true
    && result?.secretRedactionPlanBuilt === true
    && result?.artifactSafetyCheckPlanBuilt === true
    && result?.preRuntimeVerificationPlanBuilt === true
    && result?.liveTempConfigCreationAllowedNow === false
    && result?.liveRunRootCreationAllowedNow === false
    && result?.canRunResearchNow === false
}

function passed(value: any): boolean { return value?.passed === true }

export function evaluateFactoryHermesControlledResearchRuntimeLiveArtifactVerification(input: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationInput): any {
  const verificationId = `hermes-controlled-research-runtime-live-artifact-verification:75b300f:${input.verifiedAt}`
  const creationOk = isLiveArtifactCreationValid(input.liveArtifactCreationResult)
  const approvalOk = isLiveArtifactApprovalValid(input.liveArtifactApprovalResult)
  const planningOk = isLiveArtifactPlanningValid(input.liveArtifactPlanningResult)
  const configOk = passed(input.liveTempConfigVerificationResult)
  const manifestOk = passed(input.liveRunRootManifestVerificationResult)
  const pathOk = passed(input.liveArtifactPathContainmentVerificationResult)
  const symlinkOk = passed(input.liveArtifactSymlinkVerificationResult)
  const secretOk = passed(input.liveArtifactSecretScanResult)
  const runtimeOk = passed(input.liveArtifactRuntimeSafetyScanResult)
  const inventoryOk = passed(input.liveArtifactDirectoryInventoryVerificationResult)
  const blockers = [
    ...(!creationOk ? [{ blockerId: 'live_artifact_creation_invalid', message: 'Live artifact creation result is not approved for verification.' }] : []),
    ...(!approvalOk ? [{ blockerId: 'live_artifact_approval_invalid', message: 'Live artifact approval result is not granted for creation.' }] : []),
    ...(!planningOk ? [{ blockerId: 'live_artifact_planning_invalid', message: 'Live artifact planning result is incomplete.' }] : []),
    ...(!configOk ? [{ blockerId: 'live_temp_config_verification_failed', message: 'Live temp config verification did not pass.' }] : []),
    ...(!manifestOk ? [{ blockerId: 'live_run_manifest_verification_failed', message: 'Run manifest verification did not pass.' }] : []),
    ...(!pathOk ? [{ blockerId: 'path_containment_verification_failed', message: 'Path containment verification did not pass.' }] : []),
    ...(!symlinkOk ? [{ blockerId: 'symlink_verification_failed', message: 'Symlink verification did not pass.' }] : []),
    ...(!secretOk ? [{ blockerId: 'secret_scan_failed', message: 'Secret scan did not pass.' }] : []),
    ...(!runtimeOk ? [{ blockerId: 'runtime_safety_scan_failed', message: 'Runtime safety scan did not pass.' }] : []),
    ...(!inventoryOk ? [{ blockerId: 'directory_inventory_verification_failed', message: 'Directory inventory verification did not pass.' }] : []),
  ]
  const verified = blockers.length === 0
  const status = verified ? 'controlled_research_runtime_live_artifacts_verified' : 'controlled_research_runtime_live_artifact_verification_failed'
  const decision = verified ? 'hermes_controlled_research_runtime_live_artifacts_verified_for_review' : 'hermes_controlled_research_runtime_live_artifact_verification_failed_block_runtime'
  return {
    verificationId,
    verificationKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_KIND,
    verificationVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_VERSION,
    verifiedAt: input.verifiedAt,
    verifiedBy: input.verifiedBy,
    toolId: 'hermes_agent',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    controlledResearchRuntimeLiveArtifactVerificationReceipt: { receiptId: `${verificationId}:receipt`, verificationId, toolId: 'hermes_agent', decision, verificationStatus: verified ? 'verified_with_limitations' : 'failed', scope: 'hermes_controlled_research_runtime_live_artifact_verification_only', notAuthorizedActions },
    hermesControlledResearchRuntimeLiveArtifactVerificationResultRecord: { recordId: `${verificationId}:record`, sourceCreationRef: 'controlled-research-runtime-live-artifact-creation-result.json', sourceApprovalRef: 'controlled-research-runtime-live-artifact-approval-result.json', sourcePlanningRef: 'controlled-research-runtime-live-artifact-planning-result.json', verificationPassed: verified },
    liveTempConfigVerificationResult: input.liveTempConfigVerificationResult,
    liveRunRootManifestVerificationResult: input.liveRunRootManifestVerificationResult,
    liveArtifactPathContainmentVerificationResult: input.liveArtifactPathContainmentVerificationResult,
    liveArtifactSymlinkVerificationResult: input.liveArtifactSymlinkVerificationResult,
    liveArtifactSecretScanResult: input.liveArtifactSecretScanResult,
    liveArtifactRuntimeSafetyScanResult: input.liveArtifactRuntimeSafetyScanResult,
    liveArtifactDirectoryInventoryVerificationResult: input.liveArtifactDirectoryInventoryVerificationResult,
    liveArtifactVerificationEvidenceManifest: { evidenceId: `${verificationId}:evidence`, verifiedArtifacts: ['config.yaml', 'RUN_MANIFEST.json'], scansPerformed: ['path_containment', 'lstat_symlink', 'secret_scan', 'runtime_safety_scan', 'directory_inventory'], directoryInventory: input.liveArtifactDirectoryInventoryVerificationResult, limitations: requiredLimitations, warnings: ['pre_runtime_verification_only', 'runtime_execution_still_blocked'], noRuntimeExecutionEvidence: true, noNetworkEvidence: true, noCredentialEvidence: true, noToolsetEvidence: true, verificationIsPreRuntimeOnly: true, runtimeStillBlocked: true, researchStillBlocked: true, findingsStillBlocked: true },
    controlledRuntimeLiveArtifactVerificationReviewEnvelope: { envelopeId: `${verificationId}:review-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_live_artifact_verification_review_only', selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', sourceVerificationRef: 'controlled-research-runtime-live-artifact-verification-result.json', sourceCreationRef: 'controlled-research-runtime-live-artifact-creation-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Live Artifact Verification Review Gate v1', purpose: 'review live artifact verification results before any runtime execution approval planning', allowedInNextGate: ['read verification result', 'read creation result', 'review path containment', 'review secret scans', 'review config safety', 'review run manifest safety', 'review directory inventory', 'review no-runtime evidence', 'decide whether to proceed to future controlled runtime execution planning', 'write ignored review artifact'], forbiddenEvenInNextGate: notAuthorizedActions, flags: { liveArtifactVerificationReviewAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false } },
    blockers,
    warnings: requiredLimitations.map((message) => ({ warningId: message, message })),
    status,
    decision,
    liveArtifactVerificationStatus: verified ? 'verified_with_limitations' : 'failed',
    liveTempConfigExists: input.liveTempConfigVerificationResult?.exists === true,
    liveRunManifestExists: input.liveRunRootManifestVerificationResult?.exists === true,
    liveTempConfigPathContainmentPassed: input.liveArtifactPathContainmentVerificationResult?.configContainmentPassed === true,
    liveRunRootPathContainmentPassed: input.liveArtifactPathContainmentVerificationResult?.runRootContainmentPassed === true,
    symlinkEscapeCheckPassed: input.liveArtifactSymlinkVerificationResult?.symlinkEscapeDetected === false,
    liveTempConfigSecretScanPassed: input.liveTempConfigVerificationResult?.secretScanPassed === true,
    runManifestSecretScanPassed: input.liveRunRootManifestVerificationResult?.secretScanPassed === true,
    liveTempConfigSchemaSafetyScanPassed: input.liveTempConfigVerificationResult?.schemaSafetyScanPassed === true,
    runManifestValidationPassed: manifestOk,
    noPromptBodyDetected: input.liveTempConfigVerificationResult?.promptBodyDetected === false && input.liveRunRootManifestVerificationResult?.promptBodyDetected === false,
    noCredentialValuesDetected: input.liveArtifactSecretScanResult?.credentialValueScanPassed === true,
    noEnvDumpDetected: input.liveArtifactSecretScanResult?.envDumpScanPassed === true,
    noExecutableCommandDetected: input.liveArtifactRuntimeSafetyScanResult?.executableCommandDetected === false,
    noHermesExecutionEvidence: input.liveArtifactRuntimeSafetyScanResult?.hermesExecuted === false && input.liveArtifactRuntimeSafetyScanResult?.hermesExeExecuted === false,
    noNetworkEvidence: input.liveArtifactRuntimeSafetyScanResult?.networkUsed === false,
    noToolsetEnablementEvidence: input.liveArtifactRuntimeSafetyScanResult?.toolsetsEnabled === false,
    canProceedToControlledResearchRuntimeLiveArtifactVerificationReview: true,
    canProceedToControlledResearchRuntimeExecution: false,
    canProceedToKeepHermesResearchBlockedDecision: !verified,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    canPassPromptNow: false,
    canUseNetworkNow: false,
    canUseCredentialsNow: false,
    canReadEnvSecretsNow: false,
    canCallModelsNow: false,
    canEnableToolsetsNow: false,
    canUseFindings: false,
    recommendedNextStep: verified ? 'Proceed to Factory Hermes Controlled Research Runtime Live Artifact Verification Review Gate v1; runtime execution remains blocked.' : 'Keep Hermes research blocked and review failed verification evidence.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationInput(input: FactoryHermesControlledResearchRuntimeLiveArtifactVerificationInput): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationValidationResult {
  const errors: string[] = []
  if (!input?.verifiedAt) errors.push('verifiedAt_required')
  if (!input?.verifiedBy) errors.push('verifiedBy_required')
  return { ok: errors.length === 0, errors }
}
export function validateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result: any): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_live_artifacts_verified', 'controlled_research_runtime_live_artifact_verification_failed'].includes(result?.status)) errors.push('invalid_status')
  for (const key of ['canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.controlledRuntimeLiveArtifactVerificationReviewEnvelope?.flags?.controlledRuntimeExecutionAllowedNow !== false) errors.push('review_envelope_must_block_execution')
  return { ok: errors.length === 0, errors }
}
export function serializeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result: any): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(text: string): any { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationResult(result: any): FactoryHermesControlledResearchRuntimeLiveArtifactVerificationSummary {
  return { verificationId: result.verificationId, status: result.status, decision: result.decision, liveArtifactVerificationStatus: result.liveArtifactVerificationStatus, canProceedToControlledResearchRuntimeExecution: result.canProceedToControlledResearchRuntimeExecution, canRunResearchNow: result.canRunResearchNow }
}
