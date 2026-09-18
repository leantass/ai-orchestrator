export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalInput = { approvedAt: string, approvedBy: string, proofRetryPlanningResult?: any, resolutionVerificationResult?: any, implementationResult?: any }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalPolicy = { approvalOnly: true, selectedResolutionStrategy: 'factory_owned_command_renderer_with_fail_closed_wrapper_builder' }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalStatus = 'safe_command_shape_proof_retry_approval_granted' | 'safe_command_shape_proof_retry_approval_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalDecision = 'hermes_safe_command_shape_proof_retry_approved_for_retry_gate' | 'hermes_safe_command_shape_proof_retry_approval_blocked_plan_incomplete_or_unsafe'
export type FactoryHermesProofRetryPlanReadinessReview = any
export type FactoryHermesResolutionVerificationAcceptanceReview = any
export type FactoryHermesProofRetryScopePlanReview = any
export type FactoryHermesProofRetryInputArtifactPlanReview = any
export type FactoryHermesSourceCliContractProofRetryPlanReview = any
export type FactoryHermesRendererCommandShapeProofRetryPlanReview = any
export type FactoryHermesWrapperBuilderProofRetryPlanReview = any
export type FactoryHermesNoDefaultsNoToolsetsProofRetryPlanReview = any
export type FactoryHermesNonNetworkDryRunRetryAssessmentPlanReview = any
export type FactoryHermesFailClosedProofRetryPlanReview = any
export type FactoryHermesProofRetryEvidencePlanReview = any
export type FactoryHermesProofRetryApprovalLimitationsCarryForward = any
export type FactoryHermesProofRetryApprovalRiskDispositionRegister = any
export type FactoryHermesSafeCommandShapeProofRetryGateEnvelope = any
export type FactoryHermesSafeCommandShapeProofRetryApprovalReceipt = any
export type FactoryHermesSafeCommandShapeProofRetryApprovalDecisionRecord = any
export type FactoryHermesSafeCommandShapeProofRetryApprovalBlockerPlan = any
export type FactoryHermesSafeCommandShapeProofRetryApprovalCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeProofRetryApprovalBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeProofRetryApprovalWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeProofRetryApprovalResult = any
export type FactoryHermesSafeCommandShapeProofRetryApprovalValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofRetryApprovalSummary = { approvalId: string, status: string, decision: string, canProceedToSafeCommandShapeProofRetry: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const selectedResolutionStrategy = 'factory_owned_command_renderer_with_fail_closed_wrapper_builder'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const grantedStatus = 'safe_command_shape_proof_retry_approval_granted'
const blockedStatus = 'safe_command_shape_proof_retry_approval_blocked'
const falseFlags = ['proofRetryExecutedNow', 'dryRunRetryExecutedNow', 'safeCommandShapeProvenNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const riskIds = ['proof_retry_approval_confused_with_proof_retry', 'proof_retry_gate_accidentally_runs_runtime', 'verified_renderer_confused_with_safe_command_shape', 'verified_builder_confused_with_runtime_permission', 'redacted_envelope_used_as_runnable', 'dry_run_retry_runs_without_source_safety', 'credential_order_unknown_ignored', 'network_model_order_unknown_ignored', 'prompt_order_unknown_ignored', 'no_tool_proof_dependency_bypassed', 'proof_retry_result_overused_as_runtime_approval', 'runtime_execution_attempted_without_proof_retry_review', 'keep_blocked_fallback_removed']

function add(checks: FactoryHermesSafeCommandShapeProofRetryApprovalCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function planReview(reviewId: string, plan: any, accepted: boolean) {
  return { reviewId, planPresent: Boolean(plan), accepted, proofRetryAllowedNow: false, runtimeStillBlocked: true, findingsStillBlocked: true }
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApproval(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalInput): FactoryHermesSafeCommandShapeProofRetryApprovalResult {
  const planning = input.proofRetryPlanningResult
  const verification = input.resolutionVerificationResult
  const implementation = input.implementationResult
  const checks: FactoryHermesSafeCommandShapeProofRetryApprovalCheck[] = []
  const approvalId = `hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval:75b300f:${input.approvedAt}`
  const required = [
    add(checks, 'planning_status', planning?.status, 'safe_command_shape_proof_retry_plan_created'),
    add(checks, 'planning_decision', planning?.decision, 'hermes_safe_command_shape_proof_retry_plan_created_for_approval'),
    add(checks, 'planning_state', planning?.proofRetryPlanningStatus, 'plan_candidate_created'),
    add(checks, 'planning_wrapper_strategy', planning?.selectedWrapperStrategy, selectedWrapperStrategy),
    add(checks, 'planning_resolution_strategy', planning?.selectedResolutionStrategy, selectedResolutionStrategy),
    add(checks, 'planning_fallback', planning?.safeFallbackStrategy, safeFallbackStrategy),
    ...['resolutionVerificationAcceptedForProofRetryPlanning', 'verifiedRendererAvailable', 'verifiedWrapperBuilderAvailable', 'proofRetryScopePlanBuilt', 'proofRetryInputArtifactPlanBuilt', 'sourceCliContractProofRetryPlanBuilt', 'rendererCommandShapeProofRetryPlanBuilt', 'wrapperBuilderProofRetryPlanBuilt', 'noDefaultsNoToolsetsProofRetryPlanBuilt', 'nonNetworkDryRunRetryAssessmentPlanBuilt', 'failClosedProofRetryPlanBuilt', 'proofRetryEvidencePlanBuilt', 'proofRetryApprovalEnvelopeBuilt', 'canProceedToSafeCommandShapeProofRetryApproval'].map((key) => add(checks, `planning_${key}`, planning?.[key])),
    ...['proofRetryExecutedNow', 'dryRunRetryExecutedNow', 'safeCommandShapeProvenNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow'].map((key) => add(checks, `planning_${key}_false`, planning?.[key], false)),
    add(checks, 'verification_status', verification?.status, 'safe_command_shape_resolution_verification_completed'),
    add(checks, 'verification_decision', verification?.decision, 'hermes_safe_command_shape_resolution_verified_for_proof_retry_planning'),
    add(checks, 'verification_mode', verification?.verificationStatus, 'verified_code_only_not_runtime_execution'),
    add(checks, 'verification_renderer', verification?.rendererVerified),
    add(checks, 'verification_wrapper', verification?.wrapperBuilderVerified),
    add(checks, 'verification_readiness', verification?.proofRetryReadinessVerified),
    add(checks, 'verification_can_plan', verification?.canProceedToSafeCommandShapeProofRetryPlanning),
    add(checks, 'verification_retry_blocked', verification?.canProceedToSafeCommandShapeProofRetry, false),
    add(checks, 'verification_research_blocked', verification?.canRunResearchNow, false),
    add(checks, 'implementation_status', implementation?.status, 'safe_command_shape_resolution_implementation_completed'),
  ]
  const accepted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalStatus = accepted ? grantedStatus : blockedStatus
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalDecision = accepted ? 'hermes_safe_command_shape_proof_retry_approved_for_retry_gate' : 'hermes_safe_command_shape_proof_retry_approval_blocked_plan_incomplete_or_unsafe'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Proof retry approval check failed: ${check.checkId}` }))

  const proofRetryPlanReadinessReview = { proofRetryPlanningResultPresent: Boolean(planning), proofRetryPlanningStatus: planning?.proofRetryPlanningStatus, selectedWrapperStrategy: planning?.selectedWrapperStrategy, selectedResolutionStrategy: planning?.selectedResolutionStrategy, safeFallbackStrategy: planning?.safeFallbackStrategy, resolutionVerificationAcceptedForProofRetryPlanning: planning?.resolutionVerificationAcceptedForProofRetryPlanning === true, verifiedRendererAvailable: planning?.verifiedRendererAvailable === true, verifiedWrapperBuilderAvailable: planning?.verifiedWrapperBuilderAvailable === true, allRequiredPlansBuilt: accepted, proofRetryApprovalEnvelopePresent: Boolean(planning?.safeCommandShapeProofRetryApprovalEnvelope), readinessSupportsProofRetryGate: accepted, readinessDoesNotExecuteProofRetryNow: true, readinessDoesNotApproveRuntimeExecutionNow: true, proofRetryPlanAcceptedForGate: accepted, proofRetryExecutionAllowedOnlyInNextGate: true, runtimeStillBlocked: true }
  const resolutionVerificationAcceptanceReview = { verificationCompleted: verification?.status === 'safe_command_shape_resolution_verification_completed', rendererVerified: verification?.rendererVerified === true, wrapperBuilderVerified: verification?.wrapperBuilderVerified === true, safetyScanPassed: verification?.implementationSafetyScanPassed === true, proofRetryReadinessVerified: verification?.proofRetryReadinessVerified === true, verificationDoesNotProveSafeCommandShape: true, verificationDoesNotApproveProofRetryExecution: true, verificationDoesNotApproveRuntimeExecution: true, resolutionVerificationAcceptanceAccepted: accepted, proofRetryStillRequiresGate: true, runtimeStillBlocked: true }
  const proofRetryScopePlanReview = { ...planReview('proofRetryScopePlanReview', planning?.proofRetryScopePlan, accepted), includesStaticProofRetry: true, excludesRuntimeAndSecrets: true, proofRetryScopePlanAccepted: accepted }
  const proofRetryInputArtifactPlanReview = { ...planReview('proofRetryInputArtifactPlanReview', planning?.proofRetryInputArtifactPlan, accepted), artifactsRefsDefined: true, noCredentialValues: true, noRawEnv: true, noFullPromptBody: true, failClosedIfMissingInput: true, proofRetryInputArtifactPlanAccepted: accepted }
  const sourceCliContractProofRetryPlanReview = { ...planReview('sourceCliContractProofRetryPlanReview', planning?.sourceCliContractProofRetryPlan, accepted), sourceCliContractStillRequiresProofRetry: true, sourceCliContractProofRetryPlanAccepted: accepted }
  const rendererCommandShapeProofRetryPlanReview = { ...planReview('rendererCommandShapeProofRetryPlanReview', planning?.rendererCommandShapeProofRetryPlan, accepted), rendererDoesNotCreateExecutableCommandNow: true, rendererCommandShapeProofRetryPlanAccepted: accepted }
  const wrapperBuilderProofRetryPlanReview = { ...planReview('wrapperBuilderProofRetryPlanReview', planning?.wrapperBuilderProofRetryPlan, accepted), builderDoesNotExecuteWrapperOrHermes: true, wrapperBuilderProofRetryPlanAccepted: accepted }
  const noDefaultsNoToolsetsProofRetryPlanReview = { ...planReview('noDefaultsNoToolsetsProofRetryPlanReview', planning?.noDefaultsNoToolsetsProofRetryPlan, accepted), noDefaultsNoToolsetsProofAllowedNow: false, noDefaultsNoToolsetsProofRetryPlanAccepted: accepted }
  const nonNetworkDryRunRetryAssessmentPlanReview = { ...planReview('nonNetworkDryRunRetryAssessmentPlanReview', planning?.nonNetworkDryRunRetryAssessmentPlan, accepted), dryRunRetryStillBlocked: true, nonNetworkDryRunRetryAssessmentPlanAccepted: accepted }
  const failClosedProofRetryPlanReview = { ...planReview('failClosedProofRetryPlanReview', planning?.failClosedProofRetryPlan, accepted), failClosedProofRetryPlanAccepted: accepted }
  const proofRetryEvidencePlanReview = { ...planReview('proofRetryEvidencePlanReview', planning?.proofRetryEvidencePlan, accepted), proofOutputIsNotRuntimeOutput: true, proofEvidenceIsNotFindings: true, proofRetryEvidencePlanAccepted: accepted }
  const proofRetryApprovalLimitationsCarryForward = { limitations: ['approval_is_not_proof_retry', 'proof_retry_not_executed_yet', 'safe_command_shape_not_proven_now', 'runtime_execution_not_approved', 'no_credentials_read', 'no_network_model_prompt_used', 'no_findings_available', 'proof_retry_review_required_before_runtime'], limitationsAcceptableForProofRetryGate: accepted, limitationsBlockRuntimeExecution: true, limitationsBlockFindingsUse: true }
  const proofRetryApprovalRiskDispositionRegister = { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('runtime') || riskId.includes('credential') || riskId.includes('network') ? 'high' : 'medium', disposition: ['accepted_for_proof_retry_gate_only', 'blocks_runtime_execution', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: 'Allow only the future proof retry gate; keep runtime execution, credentials, network, prompts, output ingestion, and findings blocked.', blocksProofRetryApproval: false, blocksProofRetryGate: false, blocksRuntimeExecution: true, blocksFindingsUse: true })) }
  const safeCommandShapeProofRetryGateEnvelope = accepted ? { envelopeId: `${approvalId}:proof-retry-gate-envelope`, toolId: 'hermes_agent', approvedFor: 'safe_command_shape_proof_retry_gate_only', selectedWrapperStrategy, selectedResolutionStrategy, sourceProofRetryApprovalRef: 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json', sourceProofRetryPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json', sourceResolutionVerificationRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Gate v1', purpose: 'execute a safe command shape proof retry using verified renderer and wrapper builder while keeping real Hermes runtime, credentials, network, model calls, prompt passing, output ingestion and findings blocked', allowedInNextGate: ['read proof retry approval result', 'read proof retry planning result', 'read resolution verification result', 'inspect Hermes source read-only', 'inspect renderer/builder source read-only', 'run static proof retry logic', 'run renderer proof logic', 'run wrapper builder proof logic', 'assess optional non-network dry-run', 'execute a dry-run only if source safety is proven inside that gate', 'write ignored proof retry artifact'], forbiddenEvenInNextGate: ['execute real Hermes runtime', 'execute research', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'pass prompt to provider', 'enable toolsets', 'ingest output', 'promote findings', 'mutate Hermes source', 'modify package.json', 'modify package-lock.json', 'modify UI/preload/App', 'run uv/pip/python/setup.py', 'commit', 'push', 'git add .'], flags: { safeCommandShapeProofRetryGateAllowedNow: true, safeCommandShapeProofRetryAllowedNow: false, safeCommandShapeProvenNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofRetry: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Gate v1' } : undefined
  const receipt = { receiptId: `${approvalId}:receipt`, approvalOnly: true, proofRetry: false, dryRunRetried: false, researchExecution: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, tempConfigModified: false, runRootModified: false, hermesExecuted: false, hermesExeExecuted: false, oneshotExecuted: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, envFileRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false, uvPipPythonSetupExecuted: false }

  return { approvalId, approvalKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent', proofRetryPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json', resolutionVerificationRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json', implementationRef: 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json', selectedWrapperStrategy, selectedResolutionStrategy: accepted ? selectedResolutionStrategy : safeFallbackStrategy, safeFallbackStrategy, proofRetryPlanReadinessReview, resolutionVerificationAcceptanceReview, proofRetryScopePlanReview, proofRetryInputArtifactPlanReview, sourceCliContractProofRetryPlanReview, rendererCommandShapeProofRetryPlanReview, wrapperBuilderProofRetryPlanReview, noDefaultsNoToolsetsProofRetryPlanReview, nonNetworkDryRunRetryAssessmentPlanReview, failClosedProofRetryPlanReview, proofRetryEvidencePlanReview, proofRetryApprovalLimitationsCarryForward, proofRetryApprovalRiskDispositionRegister, safeCommandShapeProofRetryGateEnvelope, safeCommandShapeProofRetryApprovalReceipt: receipt, hermesSafeCommandShapeProofRetryApprovalDecision: { decisionId: `${approvalId}:decision`, status, decision, proofRetryApprovalStatus: accepted ? 'approved_for_proof_retry_gate_only' : 'blocked', proofRetryGateAllowed: accepted }, proofRetryApprovalBlockerPlan: accepted ? undefined : { planId: `${approvalId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true }, checks, blockers, warnings: riskIds.map((warningId) => ({ warningId, message: warningId })), status, decision, proofRetryApprovalStatus: accepted ? 'approved_for_proof_retry_gate_only' : 'blocked', proofRetryPlanAccepted: accepted, resolutionVerificationAcceptanceAccepted: accepted, proofRetryScopePlanAccepted: accepted, proofRetryInputArtifactPlanAccepted: accepted, sourceCliContractProofRetryPlanAccepted: accepted, rendererCommandShapeProofRetryPlanAccepted: accepted, wrapperBuilderProofRetryPlanAccepted: accepted, noDefaultsNoToolsetsProofRetryPlanAccepted: accepted, nonNetworkDryRunRetryAssessmentPlanAccepted: accepted, failClosedProofRetryPlanAccepted: accepted, proofRetryEvidencePlanAccepted: accepted, proofRetryGateAllowed: accepted, proofRetryExecutedNow: false, dryRunRetryExecutedNow: false, safeCommandShapeProvenNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofRetry: accepted, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Gate v1.' : 'Keep Hermes research blocked; proof retry approval is incomplete or unsafe.' }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalInput): FactoryHermesSafeCommandShapeProofRetryApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  if (!input?.proofRetryPlanningResult) errors.push('proofRetryPlanningResult_required')
  if (!input?.resolutionVerificationResult) errors.push('resolutionVerificationResult_required')
  if (!input?.implementationResult) errors.push('implementationResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(result: FactoryHermesSafeCommandShapeProofRetryApprovalResult): FactoryHermesSafeCommandShapeProofRetryApprovalValidationResult {
  const errors: string[] = []
  if (![grantedStatus, blockedStatus].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === grantedStatus && result?.canProceedToSafeCommandShapeProofRetry !== true) errors.push('proof_retry_gate_must_be_allowed_when_granted')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(result: FactoryHermesSafeCommandShapeProofRetryApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(text: string): FactoryHermesSafeCommandShapeProofRetryApprovalResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(result: FactoryHermesSafeCommandShapeProofRetryApprovalResult): FactoryHermesSafeCommandShapeProofRetryApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeProofRetry: result.canProceedToSafeCommandShapeProofRetry, canRunResearchNow: result.canRunResearchNow }
}
