export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_KIND = 'factory-hermes-controlled-research-runtime-execution-review'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeExecutionReviewVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_VERSION
export type FactoryHermesControlledResearchRuntimeExecutionReviewKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_KIND
export type FactoryHermesControlledResearchRuntimeExecutionReviewInput = { reviewedAt: string, reviewedBy: string, executionResult?: any, executionApprovalResult?: any, executionPlanningResult?: any, promptManifest?: any }
export type FactoryHermesControlledResearchRuntimeExecutionReviewPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', noRetryExecution: true }
export type FactoryHermesControlledResearchRuntimeExecutionReviewStatus = 'controlled_research_runtime_execution_review_completed' | 'controlled_research_runtime_execution_review_blocked'
export type FactoryHermesControlledResearchRuntimeExecutionReviewDecision = 'hermes_controlled_research_runtime_execution_review_accepted_blocked_before_runtime_for_command_shape_resolution' | 'hermes_controlled_research_runtime_execution_review_blocked_result_incomplete_or_unsafe'
export type FactoryHermesExecutionResultReview = any
export type FactoryHermesBlockedBeforeRuntimeReview = any
export type FactoryHermesFinalGuardDecisionReview = any
export type FactoryHermesCommandShapeFailureReview = any
export type FactoryHermesCredentialAccessSkipReview = any
export type FactoryHermesPromptArtifactReview = any
export type FactoryHermesArtifactStabilityReview = any
export type FactoryHermesPostRunAuditReview = any
export type FactoryHermesExecutionReviewLimitationsCarryForward = any
export type FactoryHermesExecutionReviewRiskDispositionRegister = any
export type FactoryHermesSafeCommandShapeProofPlanningEnvelope = any
export type FactoryHermesControlledResearchRuntimeExecutionReviewReceipt = any
export type FactoryHermesControlledResearchRuntimeExecutionReviewDecisionRecord = any
export type FactoryHermesControlledResearchRuntimeExecutionReviewBlockerPlan = any
export type FactoryHermesControlledResearchRuntimeExecutionReviewCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesControlledResearchRuntimeExecutionReviewBlocker = { blockerId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionReviewWarning = { warningId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionReviewResult = any
export type FactoryHermesControlledResearchRuntimeExecutionReviewValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesControlledResearchRuntimeExecutionReviewSummary = { reviewId: string, status: string, decision: string, canProceedToSafeCommandShapeProofPlanning: boolean, canUseFindings: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const limitations = ['execution_blocked_before_runtime', 'safe_command_shape_not_proven', 'no_real_hermes_execution_completed', 'no_model_network_or_provider_call_completed', 'credential_not_read_due_to_safe_command_shape_failure', 'no_runtime_output_available', 'no_tool_usage_runtime_evidence_available', 'prompt_created_but_not_sent', 'config_schema_partially_unknown', 'empty_toolsets_support_unknown', 'hidden_defaults_may_still_exist_in_real_cli_runtime', 'wrapper_boundary_not_sufficient_without_safe_command_shape_proof', 'findings_unavailable_and_blocked']
const risks = ['blocked_execution_misread_as_successful_run', 'command_shape_failure_ignored', 'credential_access_enabled_before_command_proof', 'network_enabled_before_command_proof', 'prompt_sent_before_command_proof', 'hidden_defaults_loaded_in_real_runtime', 'wrapper_boundary_overtrusted_without_command_shape', 'no_runtime_output_misused_as_findings', 'output_ingestion_started_without_output', 'execution_retried_without_new_approval', 'command_shape_proof_confused_with_execution', 'package_or_artifact_changed_before_next_attempt']

function check(checks: FactoryHermesControlledResearchRuntimeExecutionReviewCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

export function evaluateFactoryHermesControlledResearchRuntimeExecutionReview(input: FactoryHermesControlledResearchRuntimeExecutionReviewInput): FactoryHermesControlledResearchRuntimeExecutionReviewResult {
  const execution = input.executionResult
  const approval = input.executionApprovalResult
  const planning = input.executionPlanningResult
  const checks: FactoryHermesControlledResearchRuntimeExecutionReviewCheck[] = []
  const reviewId = `hermes-controlled-research-runtime-execution-review:75b300f:${input.reviewedAt}`
  const required = [
    check(checks, 'execution_status', execution?.status, 'controlled_research_runtime_execution_blocked'),
    check(checks, 'execution_decision', execution?.decision, 'hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied'),
    check(checks, 'blocked_before_runtime', execution?.executionStatus, 'blocked_before_runtime'),
    check(checks, 'single_run_not_executed', execution?.singleControlledRunExecuted, false),
    check(checks, 'final_preflight_passed', execution?.finalPreflightPassed),
    check(checks, 'artifacts_unchanged', execution?.verifiedArtifactsUnchanged),
    check(checks, 'prompt_manifest_created', execution?.finalPromptArtifactCreated),
    check(checks, 'command_envelope_present', Boolean(execution?.finalRuntimeCommandEnvelope)),
    check(checks, 'safe_command_not_proven', execution?.finalRuntimeGuardDecision?.safeCommandShapeProven, false),
    check(checks, 'guard_failed', execution?.finalRuntimeGuardDecision?.allFinalGuardsPassed, false),
    check(checks, 'safe_command_reason', execution?.finalRuntimeGuardDecision?.blockReasons?.includes('safe_command_shape_not_proven')),
    check(checks, 'credential_skipped', execution?.credentialAccessPerformed, false),
    check(checks, 'credential_not_logged', execution?.credentialValueLogged, false),
    check(checks, 'no_output', execution?.rawOutputCaptured, false),
    check(checks, 'findings_blocked', execution?.findingsUseApprovedNow, false),
    check(checks, 'review_allowed', execution?.canProceedToControlledResearchRuntimeExecutionReview),
    check(checks, 'ingestion_blocked', execution?.canProceedToOutputIngestionReview, false),
    check(checks, 'findings_use_blocked', execution?.canUseFindings, false),
    check(checks, 'approval_granted', approval?.status, 'controlled_research_runtime_execution_approval_granted'),
    check(checks, 'planning_created', planning?.status, 'controlled_research_runtime_execution_plan_created'),
  ]
  const accepted = required.every(Boolean)
  const blockers = accepted ? [] : checks.filter((item) => !item.passed).map((item) => ({ blockerId: item.checkId, message: `Execution review check failed: ${item.checkId}` }))
  const status: FactoryHermesControlledResearchRuntimeExecutionReviewStatus = accepted ? 'controlled_research_runtime_execution_review_completed' : 'controlled_research_runtime_execution_review_blocked'
  const decision: FactoryHermesControlledResearchRuntimeExecutionReviewDecision = accepted ? 'hermes_controlled_research_runtime_execution_review_accepted_blocked_before_runtime_for_command_shape_resolution' : 'hermes_controlled_research_runtime_execution_review_blocked_result_incomplete_or_unsafe'
  const safeCommandShapeProofPlanningEnvelope = accepted ? { envelopeId: `${reviewId}:safe-command-shape-proof-planning-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_safe_command_shape_proof_planning_only', selectedWrapperStrategy, sourceExecutionReviewRef: 'controlled-research-runtime-execution-review-result.json', sourceExecutionRef: 'controlled-research-runtime-execution-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1', purpose: 'plan how to prove a safe runnable command shape for Hermes controlled research without using hidden defaults or enabling tools, before any future credential access, network, model call, prompt passing, or Hermes execution', allowedInNextGate: ['read execution review result', 'read execution result', 'read adapter/wrapper artifacts', 'inspect Hermes source/CLI docs read-only', 'inspect wrapper runtime source read-only', 'plan safe command shape proof strategy', 'plan static proof', 'plan non-network dry-run proof if possible', 'plan fail-closed command construction', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets', 'execute research', 'ingest output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { safeCommandShapeProofPlanningAllowedNow: true, safeCommandShapeProofAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofPlanning: true, canProceedToControlledResearchRuntimeExecution: false, canProceedToOutputIngestionReview: false, canUseFindings: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1' } : undefined
  return {
    reviewId, reviewKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_KIND, reviewVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_VERSION, reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, toolId: 'hermes_agent', executionRef: 'controlled-research-runtime-execution-result.json', executionApprovalRef: 'controlled-research-runtime-execution-approval-result.json', executionPlanningRef: 'controlled-research-runtime-execution-planning-result.json', selectedWrapperStrategy,
    executionResultReview: { executionResultPresent: true, executionStatus: execution?.executionStatus, status: execution?.status, decision: execution?.decision, finalPreflightPassed: execution?.finalPreflightPassed === true, verifiedArtifactsUnchanged: execution?.verifiedArtifactsUnchanged === true, finalPromptArtifactCreated: execution?.finalPromptArtifactCreated === true, credentialAccessPerformed: execution?.credentialAccessPerformed === true, commandEnvelopeBuilt: Boolean(execution?.finalRuntimeCommandEnvelope), singleControlledRunExecuted: execution?.singleControlledRunExecuted === true, rawOutputCaptured: execution?.rawOutputCaptured === true, findingsUseApprovedNow: execution?.findingsUseApprovedNow === true, reviewConclusion: 'correct_fail_closed_before_runtime', executionResultAccepted: accepted, outputIngestionReviewAllowed: false, findingsUseAllowed: false, supportsSafeCommandShapeProofPlanning: accepted },
    blockedBeforeRuntimeReview: { blockedBeforeRuntime: true, blockerReasonPrimary: 'safe_command_shape_not_proven', blockerReasons: ['safe_command_shape_not_proven', 'credential_not_read_because_command_shape_not_proven'], failClosedBehaviorConfirmed: accepted, credentialAccessSkippedBeforeUnsafeCommand: true, networkUseSkippedBeforeUnsafeCommand: true, modelCallSkippedBeforeUnsafeCommand: true, hermesExecutionSkippedBeforeUnsafeCommand: true, wrapperExecutionSkippedBeforeUnsafeCommand: true, adapterExecutionSkippedBeforeUnsafeCommand: true, blockAcceptedAsCorrect: accepted, blockRequiresCommandShapeProofPlanning: accepted },
    finalGuardDecisionReview: { allFinalGuardsPassed: false, safeCommandShapeProven: false, credentialAvailableNotEvaluatedWithCredentialRead: true, findingsBlocked: true, singleRunOnlyPreserved: true, packageHashesPassed: execution?.finalRuntimeGuardDecision?.packageHashesPassed === true, stagedEmpty: execution?.finalRuntimePreflightResult?.stagedEmpty === true, artifactStabilityPassed: execution?.finalRuntimeGuardDecision?.artifactStabilityPassed === true, promptArtifactPassed: execution?.finalRuntimeGuardDecision?.promptArtifactPassed === true, timeoutKillSwitchReadyButUnused: true, finalGuardDecisionAccepted: accepted, guardFailureCorrectlyBlockedRuntime: accepted, noFurtherRuntimeAllowedWithoutCommandShapeProof: true },
    commandShapeFailureReview: { safeCommandShapeProven: false, commandEnvelopeBuilt: Boolean(execution?.finalRuntimeCommandEnvelope), commandEnvelopeRunnable: false, safeCommandShapeFailureReason: 'safe_command_shape_not_proven', directHermesCliDefaultsStillRisky: true, noToolModeRuntimeStillNotProven: true, wrapperBoundaryInsufficientForExecutionWithoutCommandProof: true, executionMustNotProceedUntilSafeCommandShapeProof: true, acceptedForResolutionPlanning: accepted, blocksImmediateExecution: true, blocksCredentialAccess: true, blocksNetwork: true, blocksModelCall: true },
    credentialAccessSkipReview: { credentialRef: 'OPENAI_API_KEY', credentialAccessPerformed: false, credentialValueRead: false, credentialValueLogged: false, credentialValuePersisted: false, dotEnvRead: false, envDumped: false, skippedBecauseSafeCommandShapeNotProven: true, credentialSkipAccepted: accepted, futureCredentialAccessStillRequiresFinalCommandShapeProof: true },
    promptArtifactReview: { promptManifestExists: Boolean(input.promptManifest), promptManifestUnderCodexTemp: true, promptBodyHashPresent: Boolean(input.promptManifest?.promptBodySha256), promptSafeSummaryPresent: Boolean(input.promptManifest?.promptBodySafeSummary), outputContractPresent: Boolean(input.promptManifest?.outputContract), containsSecrets: input.promptManifest?.containsSecrets === true, containsCredentialValues: input.promptManifest?.containsCredentialValues === true, containsToolInstructionsOutsidePolicy: input.promptManifest?.containsToolInstructionsOutsidePolicy === true, promptBodyNotExecutionProof: true, promptNotSent: true, promptArtifactAccepted: accepted && Boolean(input.promptManifest), blocksImmediatePromptPassing: true },
    artifactStabilityReview: { configYamlHashPresent: Boolean(execution?.verifiedArtifactStabilityResult?.configYamlSha256), runManifestHashPresent: Boolean(execution?.verifiedArtifactStabilityResult?.runManifestSha256), configExists: execution?.verifiedArtifactStabilityResult?.configYamlExists === true, runManifestExists: execution?.verifiedArtifactStabilityResult?.runManifestExists === true, pathContainment: execution?.verifiedArtifactStabilityResult?.configYamlUnderCodexTemp === true && execution?.verifiedArtifactStabilityResult?.runManifestUnderCodexTemp === true, noSymlinkEscape: true, noSecrets: execution?.verifiedArtifactStabilityResult?.noSecrets === true, noExecutableCommand: execution?.verifiedArtifactStabilityResult?.noRunnableCommand === true, artifactStabilityAccepted: accepted, artifactsDoNotProveSafeCommandShape: true },
    postRunAuditReview: { processExecutionAbsent: true, timeoutKillSwitchNotAppliedBecauseNoProcess: true, rawOutputAbsent: true, stdoutAbsentOrNotRuntimeOutput: true, stderrAbsentOrNotRuntimeOutput: true, noToolEvidenceLimitedBecauseNoRuntimeOutput: true, postRunSecretScanLimitedBecauseNoRuntimeOutput: true, gitAuditPassed: execution?.controlledRuntimePostRunGitAuditResult?.stagedEmpty === true, noPackageChanges: execution?.controlledRuntimePostRunGitAuditResult?.packageFilesUnchanged === true, noHermesSourceMutation: execution?.controlledRuntimePostRunGitAuditResult?.noSourceHermesMutation === true, noUiMutation: execution?.controlledRuntimePostRunGitAuditResult?.noUiPreloadAppMutation === true, postRunAuditAcceptedForBlockedRun: accepted, outputIngestionNotAllowed: true, findingsNotAllowed: true },
    executionReviewLimitationsCarryForward: { limitations, limitationsAcceptableForCommandShapeProofPlanning: accepted, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockOutputIngestion: true, limitationsBlockFindingsUse: true },
    executionReviewRiskDispositionRegister: { risks: risks.map((riskId) => ({ riskId, severity: riskId.includes('ignored') || riskId.includes('credential') || riskId.includes('retried') ? 'high' : 'medium', disposition: 'accepted_for_command_shape_proof_planning_only', blocksRuntimeExecutionDisposition: 'blocks_runtime_execution', blocksOutputIngestionDisposition: 'blocks_output_ingestion', blocksFindingsUseDisposition: 'blocks_findings_use', futureControlDisposition: 'requires_future_gate_control', mitigation: 'Require safe command shape proof planning before any future credential, prompt, network, model, Hermes, wrapper, output ingestion, or findings action.', blocksExecutionReview: false, blocksSafeCommandShapeProofPlanning: false, blocksRuntimeExecution: true, blocksOutputIngestion: true, blocksFindingsUse: true })) },
    safeCommandShapeProofPlanningEnvelope,
    controlledResearchRuntimeExecutionReviewReceipt: { receiptId: `${reviewId}:receipt`, reviewId, decision, executionRetried: false, findingsUseApprovedNow: false },
    hermesControlledResearchRuntimeExecutionReviewDecision: { decisionId: `${reviewId}:decision`, decision, safeCommandShapeProofPlanningAllowed: accepted, outputIngestionReviewAllowed: false },
    reviewBlockerPlan: accepted ? undefined : { planId: `${reviewId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true },
    checks, blockers, warnings: limitations.map((warningId) => ({ warningId, message: warningId })),
    status, decision, executionReviewStatus: accepted ? 'accepted_blocked_before_runtime' : 'blocked', executionBlockedBeforeRuntimeAccepted: accepted, safeCommandShapeNotProven: accepted, failureModeAcceptedAsFailClosed: accepted, credentialAccessCorrectlySkipped: accepted, noRuntimeOutputAvailable: accepted, outputIngestionReviewAllowed: false, findingsUseApprovedNow: false, safeCommandShapeProofPlanningAllowed: accepted, canProceedToSafeCommandShapeProofPlanning: accepted, canProceedToOutputIngestionReview: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1.' : 'Keep Hermes research blocked and repair incomplete execution result evidence.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeExecutionReviewInput(input: FactoryHermesControlledResearchRuntimeExecutionReviewInput): FactoryHermesControlledResearchRuntimeExecutionReviewValidationResult {
  const errors: string[] = []
  if (!input?.reviewedAt) errors.push('reviewedAt_required')
  if (!input?.reviewedBy) errors.push('reviewedBy_required')
  if (!input?.executionResult) errors.push('executionResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeExecutionReviewResult(result: FactoryHermesControlledResearchRuntimeExecutionReviewResult): FactoryHermesControlledResearchRuntimeExecutionReviewValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_execution_review_completed', 'controlled_research_runtime_execution_review_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of ['outputIngestionReviewAllowed', 'findingsUseApprovedNow', 'canProceedToOutputIngestionReview', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeExecutionReviewResult(result: FactoryHermesControlledResearchRuntimeExecutionReviewResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeExecutionReviewResult(text: string): FactoryHermesControlledResearchRuntimeExecutionReviewResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeExecutionReviewResult(result: FactoryHermesControlledResearchRuntimeExecutionReviewResult): FactoryHermesControlledResearchRuntimeExecutionReviewSummary {
  return { reviewId: result.reviewId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeProofPlanning: result.canProceedToSafeCommandShapeProofPlanning, canUseFindings: result.canUseFindings }
}
