export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-review'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewInput = Record<string, any>
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewPolicy = Record<string, any>
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewStatus = 'safe_command_shape_proof_retry_review_completed' | 'safe_command_shape_proof_retry_review_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewDecision = 'hermes_safe_command_shape_proof_retry_review_accepted_blocked_no_safe_command_shape' | 'hermes_safe_command_shape_proof_retry_review_blocked_result_incomplete_or_unsafe'
export type FactoryHermesProofRetryResultReview = Record<string, any>
export type FactoryHermesSourceCliContractProofRetryReview = Record<string, any>
export type FactoryHermesRendererCommandShapeProofRetryReview = Record<string, any>
export type FactoryHermesWrapperBuilderProofRetryReview = Record<string, any>
export type FactoryHermesNoDefaultsNoToolsetsProofRetryReview = Record<string, any>
export type FactoryHermesNonNetworkDryRunRetryReview = Record<string, any>
export type FactoryHermesFailClosedProofRetryReview = Record<string, any>
export type FactoryHermesProofRetryEvidenceManifestReview = Record<string, any>
export type FactoryHermesProofRetrySafetyManifestReview = Record<string, any>
export type FactoryHermesProofRetryReviewLimitationsCarryForward = Record<string, any>
export type FactoryHermesProofRetryReviewRiskDispositionRegister = Record<string, any>
export type FactoryHermesKeepHermesResearchBlockedDecisionEnvelope = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningEnvelope = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReviewReceipt = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReviewDecisionRecord = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReviewBlockerPlan = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReviewCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeProofRetryReviewBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeProofRetryReviewWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeProofRetryReviewResult = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReviewValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofRetryReviewSummary = Record<string, any>

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const selectedResolutionStrategy = 'factory_owned_command_renderer_with_fail_closed_wrapper_builder'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const riskIds = ['blocked_retry_misread_as_safe_command_shape', 'renderer_builder_success_overinterpreted', 'fail_closed_misread_as_runtime_proof', 'source_contract_unknowns_ignored', 'no_defaults_no_toolsets_failure_ignored', 'dry_run_skip_ignored', 'execution_retried_without_safe_command_shape', 'credentials_enabled_after_blocked_retry', 'network_enabled_after_blocked_retry', 'findings_used_without_runtime_output', 'keep_blocked_fallback_removed', 'alternate_resolution_used_to_bypass_safety']
const limitations = ['safe_command_shape_not_proven', 'proof_retry_blocked', 'source_cli_contract_not_proven', 'no_defaults_no_toolsets_not_proven', 'dry_run_retry_not_executed', 'renderer_verified_but_not_runtime_proof', 'wrapper_builder_verified_but_not_runtime_proof', 'fail_closed_proven_but_command_shape_unproven', 'no_real_hermes_execution_completed', 'no_model_network_or_provider_call_completed', 'credential_not_read', 'prompt_not_passed', 'no_runtime_output_available', 'no_findings_available', 'Hermes research must remain blocked unless alternate safe runtime strategy is selected']

function add(checks: FactoryHermesSafeCommandShapeProofRetryReviewCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function safetyFalse(safety: any, key: string): boolean {
  return safety?.[key] === false
}

function buildReceipt(reviewId: string): FactoryHermesSafeCommandShapeProofRetryReviewReceipt {
  return {
    receiptId: `${reviewId}:receipt`,
    proofRetryRetried: false,
    dryRunRetried: false,
    researchExecution: false,
    adapterExecuted: false,
    wrapperExecutedAgainstHermes: false,
    tempConfigModified: false,
    runRootModified: false,
    hermesExecuted: false,
    hermesExeExecuted: false,
    oneshotExecuted: false,
    promptSent: false,
    modelCalls: false,
    networkUsed: false,
    dnsResolved: false,
    endpointsTested: false,
    envSecretsRead: false,
    envFileRead: false,
    credentialValuesRead: false,
    toolsetsEnabled: false,
    outputIngestion: false,
    findingsPromoted: false,
    uvPipPythonSetupExecuted: false,
  }
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReview(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewInput): FactoryHermesSafeCommandShapeProofRetryReviewResult {
  const proofRetry = input.proofRetryResult
  const approval = input.proofRetryApprovalResult
  const verification = input.resolutionVerificationResult
  const checks: FactoryHermesSafeCommandShapeProofRetryReviewCheck[] = []
  const reviewId = `hermes-controlled-research-runtime-safe-command-shape-proof-retry-review:75b300f:${input.reviewedAt}`
  const safety = proofRetry?.proofRetrySafetyManifest
  const evidence = proofRetry?.proofRetryEvidenceManifest
  const required = [
    add(checks, 'proof_retry_status_blocked', proofRetry?.status, 'safe_command_shape_proof_retry_blocked'),
    add(checks, 'proof_retry_decision_blocked', proofRetry?.decision, 'hermes_safe_command_shape_proof_retry_blocked_no_safe_command_shape'),
    add(checks, 'proof_retry_review_status', proofRetry?.proofRetryStatus, 'blocked'),
    add(checks, 'safe_command_shape_false', proofRetry?.safeCommandShapeProven, false),
    add(checks, 'source_cli_failed', proofRetry?.sourceCliContractProofPassed, false),
    add(checks, 'renderer_passed', proofRetry?.rendererCommandShapeProofPassed),
    add(checks, 'wrapper_passed', proofRetry?.wrapperBuilderProofPassed),
    add(checks, 'no_defaults_failed', proofRetry?.noDefaultsNoToolsetsProofPassed, false),
    add(checks, 'fail_closed_passed', proofRetry?.failClosedProofPassed),
    add(checks, 'dry_run_not_executed', proofRetry?.dryRunRetryExecuted, false),
    add(checks, 'runtime_blocked', proofRetry?.controlledRuntimeExecutionAllowedNow, false),
    add(checks, 'credentials_blocked', proofRetry?.credentialAccessAllowedNow, false),
    add(checks, 'prompt_blocked', proofRetry?.promptPassingAllowedNow, false),
    add(checks, 'models_blocked', proofRetry?.modelCallsAllowedNow, false),
    add(checks, 'network_blocked', proofRetry?.networkAllowedNow, false),
    add(checks, 'findings_blocked', proofRetry?.findingsUseApprovedNow, false),
    add(checks, 'review_allowed', proofRetry?.canProceedToSafeCommandShapeProofRetryReview),
    add(checks, 'runtime_not_allowed', proofRetry?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'keep_blocked_allowed', proofRetry?.canProceedToKeepHermesResearchBlockedDecision),
    add(checks, 'research_blocked', proofRetry?.canRunResearchNow, false),
    add(checks, 'safety_no_research', safetyFalse(safety, 'researchExecuted')),
    add(checks, 'safety_no_adapter', safetyFalse(safety, 'adapterExecuted')),
    add(checks, 'safety_no_hermes_runtime', safetyFalse(safety, 'hermesRuntimeExecuted')),
    add(checks, 'safety_no_wrapper_runtime', safetyFalse(safety, 'wrapperExecutedAgainstHermes')),
    add(checks, 'safety_no_credentials', safetyFalse(safety, 'credentialValuesRead')),
    add(checks, 'safety_no_dotenv', safetyFalse(safety, 'dotEnvRead')),
    add(checks, 'safety_no_network', safetyFalse(safety, 'networkUsed')),
    add(checks, 'safety_no_dns', safetyFalse(safety, 'dnsResolved')),
    add(checks, 'safety_no_models', safetyFalse(safety, 'modelCallsMade')),
    add(checks, 'safety_no_prompt', safetyFalse(safety, 'promptSent')),
    add(checks, 'safety_no_toolsets', safetyFalse(safety, 'toolsetsEnabled')),
    add(checks, 'safety_no_output', safetyFalse(safety, 'outputIngested')),
    add(checks, 'safety_no_findings', safetyFalse(safety, 'findingsPromoted')),
    add(checks, 'approval_status', approval?.status, 'safe_command_shape_proof_retry_approval_granted'),
    add(checks, 'verification_status', verification?.status, 'safe_command_shape_resolution_verification_completed'),
    add(checks, 'verification_renderer', verification?.rendererVerified),
    add(checks, 'verification_wrapper', verification?.wrapperBuilderVerified),
    add(checks, 'verification_readiness', verification?.proofRetryReadinessVerified),
  ]
  const accepted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewStatus = accepted ? 'safe_command_shape_proof_retry_review_completed' : 'safe_command_shape_proof_retry_review_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewDecision = accepted ? 'hermes_safe_command_shape_proof_retry_review_accepted_blocked_no_safe_command_shape' : 'hermes_safe_command_shape_proof_retry_review_blocked_result_incomplete_or_unsafe'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Proof retry review check failed: ${check.checkId}` }))

  const proofRetryResultReview: FactoryHermesProofRetryResultReview = {
    proofRetryResultPresent: Boolean(proofRetry),
    proofRetryStatus: proofRetry?.proofRetryStatus,
    status: proofRetry?.status,
    decision: proofRetry?.decision,
    safeCommandShapeProven: proofRetry?.safeCommandShapeProven === true,
    proofRetryExecutedCodeOnlyStatic: true,
    dryRunRetryExecuted: proofRetry?.dryRunRetryExecuted === true,
    runtimeExecutionAllowedNow: proofRetry?.controlledRuntimeExecutionAllowedNow === true,
    findingsUseApprovedNow: proofRetry?.findingsUseApprovedNow === true,
    reviewConclusion: accepted ? 'correct_blocked_proof_retry_no_safe_command_shape' : 'proof_retry_result_incomplete_or_unsafe',
    proofRetryBlockedAccepted: accepted,
    proofRetryDoesNotSupportRuntimeExecution: true,
    outputIngestionNotAllowed: true,
    findingsRemainBlocked: true,
  }
  const sourceCliContractProofRetryReview: FactoryHermesSourceCliContractProofRetryReview = {
    sourceCliContractProofPassed: proofRetry?.sourceCliContractProofPassed === true,
    criticalUnknownsRemain: proofRetry?.sourceCliContractProofRetryResult?.criticalUnknowns || evidence?.unknowns || [],
    unknownsCorrectlyBlockSafeCommandShape: true,
    noSourceMutation: true,
    noRuntimeExecution: true,
    sourceCliContractFailureAccepted: accepted,
    criticalUnknownsBlockRuntime: true,
    sourceContractRequiresAlternativeResolutionOrKeepBlocked: true,
  }
  const rendererCommandShapeProofRetryReview: FactoryHermesRendererCommandShapeProofRetryReview = {
    rendererCommandShapeProofPassed: proofRetry?.rendererCommandShapeProofPassed === true,
    rendererBlocksUnsafeInputs: true,
    rendererEmitsRedactedEnvelopeOnlyWhenProofDependenciesComplete: true,
    rendererKeepsRunnableNowFalse: true,
    rendererKeepsCredentialValueIncludedFalse: true,
    rendererDoesNotExecuteOrReadEnvNetworkCredential: true,
    rendererProofAloneDoesNotProveHermesSafeCommandShape: true,
    rendererProofAccepted: accepted,
  }
  const wrapperBuilderProofRetryReview: FactoryHermesWrapperBuilderProofRetryReview = {
    wrapperBuilderProofPassed: proofRetry?.wrapperBuilderProofPassed === true,
    builderPropagatesRendererBlockedState: true,
    builderPreservesKeepBlockedFallback: true,
    builderRemainsNonRunnable: true,
    builderDoesNotExecuteWrapperHermes: true,
    builderProofAloneDoesNotProveHermesSafeCommandShape: true,
    wrapperBuilderProofAccepted: accepted,
  }
  const noDefaultsNoToolsetsProofRetryReview: FactoryHermesNoDefaultsNoToolsetsProofRetryReview = {
    noDefaultsNoToolsetsProofPassed: proofRetry?.noDefaultsNoToolsetsProofPassed === true,
    configWinsOverDefaultsProven: false,
    omittedToolsetsDoNotLoadDefaultsProven: false,
    mcpDisabledProven: false,
    noToolRegistryOrEmptyToolRegistryProven: false,
    hiddenDefaultsExcluded: false,
    anyToolUsageDetectionNotEnoughWithoutSourceProof: true,
    noToolProofDependencyCorrectlyBlocksRendererBuilderIfIncomplete: true,
    noDefaultsNoToolsetsFailureAccepted: accepted,
    toolBoundaryStillUnproven: true,
    runtimeMustRemainBlocked: true,
  }
  const nonNetworkDryRunRetryReview: FactoryHermesNonNetworkDryRunRetryReview = {
    dryRunRetryAllowed: proofRetry?.nonNetworkDryRunRetryAssessmentResult?.dryRunRetryAllowed === true,
    dryRunRetryExecuted: proofRetry?.dryRunRetryExecuted === true,
    skippedReason: proofRetry?.nonNetworkDryRunRetryAssessmentResult?.skippedReason || proofRetry?.nonNetworkDryRunRetryResult?.skippedReason,
    noStdoutStderrRuntime: true,
    noNetwork: true,
    noDns: true,
    noModel: true,
    noCredential: true,
    noPrompt: true,
    noToolsets: true,
    dryRunSkipWasCorrectBecauseStaticSourceSafetyIncomplete: true,
    dryRunSkipAccepted: accepted,
    noUnsafeDryRunAttempted: true,
    dryRunCannotSupportRuntimeExecution: true,
  }
  const failClosedProofRetryReview: FactoryHermesFailClosedProofRetryReview = {
    failClosedProofPassed: proofRetry?.failClosedProofPassed === true,
    rendererBlocksWhenProofMissing: true,
    builderBlocksWhenRendererBlocked: true,
    envelopeRemainsNonRunnable: true,
    credentialAccessRemainsBlocked: true,
    promptPassingRemainsBlocked: true,
    networkModelRemainsBlocked: true,
    hermesExecutionRemainsBlocked: true,
    keepBlockedFallbackPreserved: true,
    failClosedProofAccepted: accepted,
    failClosedProtectsCurrentSystem: true,
    failClosedDoesNotProveCommandShape: true,
  }
  const proofRetryEvidenceManifestReview: FactoryHermesProofRetryEvidenceManifestReview = {
    evidenceManifestAccepted: accepted,
    evidenceManifestPresent: Boolean(evidence),
    sourceFilesInspected: evidence?.sourceFilesInspected || [],
    rendererProofResultPresent: Boolean(evidence?.rendererProofResult),
    wrapperBuilderProofResultPresent: Boolean(evidence?.wrapperBuilderProofResult),
    noDefaultsNoToolsetsProofResultPresent: Boolean(evidence?.noDefaultsNoToolsetsProofResult),
    dryRunAssessmentPresent: Boolean(evidence?.dryRunAssessmentResult),
    failClosedProofPresent: Boolean(evidence?.failClosedProofResult),
    blockersPresent: (evidence?.blockers || []).length > 0,
    unknownsPresent: (evidence?.unknowns || []).length > 0,
    proofEvidenceIsNotRuntimeOutput: evidence?.proofOutputIsNotRuntimeOutput === true,
    proofEvidenceIsNotFindings: evidence?.proofEvidenceIsNotFindings === true,
  }
  const proofRetrySafetyManifestReview: FactoryHermesProofRetrySafetyManifestReview = {
    safetyManifestAccepted: accepted,
    noResearch: safetyFalse(safety, 'researchExecuted'),
    noAdapter: safetyFalse(safety, 'adapterExecuted'),
    noHermesRuntime: safetyFalse(safety, 'hermesRuntimeExecuted'),
    noWrapperRuntime: safetyFalse(safety, 'wrapperExecutedAgainstHermes'),
    noCredentials: safetyFalse(safety, 'credentialValuesRead'),
    noDotEnv: safetyFalse(safety, 'dotEnvRead'),
    noNetwork: safetyFalse(safety, 'networkUsed'),
    noDns: safetyFalse(safety, 'dnsResolved'),
    noModelCalls: safetyFalse(safety, 'modelCallsMade'),
    noPromptSent: safetyFalse(safety, 'promptSent'),
    noToolsets: safetyFalse(safety, 'toolsetsEnabled'),
    noOutputIngestion: safetyFalse(safety, 'outputIngested'),
    noFindings: safetyFalse(safety, 'findingsPromoted'),
    packageHashesIntact: safety?.packageHashesIntact === true,
  }
  const proofRetryReviewLimitationsCarryForward: FactoryHermesProofRetryReviewLimitationsCarryForward = {
    limitations,
    limitationsAcceptableForKeepBlockedDecision: true,
    limitationsAcceptableForAlternateResolutionPlanning: true,
    limitationsBlockRuntimeExecution: true,
    limitationsBlockFindingsUse: true,
  }
  const proofRetryReviewRiskDispositionRegister: FactoryHermesProofRetryReviewRiskDispositionRegister = {
    risks: riskIds.map((riskId) => ({
      riskId,
      severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('execution') ? 'high' : 'medium',
      disposition: ['accepted_for_keep_blocked_or_alternate_resolution_planning_only', 'blocks_runtime_execution', 'blocks_findings_use', 'requires_future_gate_control'],
      mitigation: 'Treat blocked retry as blocked evidence only; require keep-blocked decision or alternate safe runtime planning before any future runtime path.',
      blocksProofRetryReview: false,
      blocksRuntimeExecution: true,
      blocksFindingsUse: true,
    })),
  }
  const keepHermesResearchBlockedDecisionEnvelope: FactoryHermesKeepHermesResearchBlockedDecisionEnvelope = {
    envelopeId: `${reviewId}:keep-blocked-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'keep_hermes_research_blocked_decision_only',
    sourceProofRetryReviewRef: 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json',
    sourceProofRetryRef: 'controlled-research-runtime-safe-command-shape-proof-retry-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Keep Hermes Research Blocked Decision Gate v1',
    purpose: 'formally keep Hermes research blocked because safe command shape remains unproven after resolution implementation and proof retry',
    flags: { keepHermesResearchBlockedDecisionAllowedNow: accepted, controlledRuntimeExecutionAllowedNow: false, findingsUseApprovedNow: false, canProceedToKeepHermesResearchBlockedDecision: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false },
  }
  const alternateSafeRuntimeResolutionPlanningEnvelope: FactoryHermesAlternateSafeRuntimeResolutionPlanningEnvelope = {
    envelopeId: `${reviewId}:alternate-resolution-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'alternate_safe_runtime_resolution_planning_only',
    sourceProofRetryReviewRef: 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json',
    sourceProofRetryRef: 'controlled-research-runtime-safe-command-shape-proof-retry-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Planning Gate v1',
    purpose: 'plan an alternate safe runtime strategy because Hermes CLI command shape remains unproven',
    possibleAlternateStrategies: ['keep Hermes research disabled and use model-provider-direct controlled adapter', 'build Factory-owned no-tool research adapter without Hermes CLI', 'use a mock-only research path until explicit safe runtime exists', 'require upstream Hermes source/contract change before any real runtime'],
    flags: { alternateSafeRuntimeResolutionPlanningAllowedNow: accepted, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, networkAllowedNow: false, findingsUseApprovedNow: false, canProceedToAlternateSafeRuntimeResolutionPlanning: accepted, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false },
  }
  const safeCommandShapeProofRetryReviewReceipt = buildReceipt(reviewId)
  const hermesSafeCommandShapeProofRetryReviewDecision: FactoryHermesSafeCommandShapeProofRetryReviewDecisionRecord = {
    decisionId: `${reviewId}:decision`,
    status,
    decision,
    proofRetryReviewStatus: accepted ? 'accepted_blocked' : 'blocked',
    safeCommandShapeProofRetryBlockedAccepted: accepted,
    runtimeApproved: false,
    findingsApproved: false,
  }

  return {
    reviewId,
    reviewKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_KIND,
    reviewVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: 'hermes_agent',
    proofRetryRef: 'controlled-research-runtime-safe-command-shape-proof-retry-result.json',
    proofRetryApprovalRef: 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json',
    proofRetryPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json',
    resolutionVerificationRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json',
    selectedWrapperStrategy,
    selectedResolutionStrategy,
    safeFallbackStrategy,
    proofRetryResultReview,
    sourceCliContractProofRetryReview,
    rendererCommandShapeProofRetryReview,
    wrapperBuilderProofRetryReview,
    noDefaultsNoToolsetsProofRetryReview,
    nonNetworkDryRunRetryReview,
    failClosedProofRetryReview,
    proofRetryEvidenceManifestReview,
    proofRetrySafetyManifestReview,
    proofRetryReviewLimitationsCarryForward,
    proofRetryReviewRiskDispositionRegister,
    keepHermesResearchBlockedDecisionEnvelope,
    alternateSafeRuntimeResolutionPlanningEnvelope,
    safeCommandShapeProofRetryReviewReceipt,
    hermesSafeCommandShapeProofRetryReviewDecision,
    reviewBlockerPlan: accepted ? undefined : { planId: `${reviewId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true, canProceedToControlledResearchRuntimeExecution: false },
    checks,
    blockers,
    warnings: limitations.map((warningId) => ({ warningId, message: warningId })),
    status,
    decision,
    proofRetryReviewStatus: accepted ? 'accepted_blocked' : 'blocked',
    safeCommandShapeProofRetryBlockedAccepted: accepted,
    safeCommandShapeStillNotProven: true,
    sourceCliContractFailureAccepted: accepted,
    noDefaultsNoToolsetsFailureAccepted: accepted,
    rendererProofAccepted: accepted,
    wrapperBuilderProofAccepted: accepted,
    failClosedProofAccepted: accepted,
    dryRunSkipAccepted: accepted,
    rendererBuilderVerifiedButInsufficientForRuntime: accepted,
    runtimeStillBlocked: true,
    credentialAccessStillBlocked: true,
    promptPassingStillBlocked: true,
    modelCallsStillBlocked: true,
    networkStillBlocked: true,
    toolsetEnablementStillBlocked: true,
    findingsUseApprovedNow: false,
    keepHermesResearchBlockedDecisionAllowed: accepted,
    alternateSafeRuntimeResolutionPlanningAllowed: accepted,
    canProceedToKeepHermesResearchBlockedDecision: true,
    canProceedToAlternateSafeRuntimeResolutionPlanning: accepted,
    canProceedToControlledResearchRuntimeExecution: false,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    canPassPromptNow: false,
    canUseNetworkNow: false,
    canUseCredentialsNow: false,
    canReadEnvSecretsNow: false,
    canCallModelsNow: false,
    canEnableToolsetsNow: false,
    canMutateFilesystemNow: false,
    canUseFindings: false,
    recommendedNextStep: accepted ? 'Proceed to keep Hermes research blocked decision or alternate safe runtime resolution planning; runtime remains blocked.' : 'Keep Hermes research blocked; proof retry review result is incomplete or unsafe.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewInput): FactoryHermesSafeCommandShapeProofRetryReviewValidationResult {
  const errors: string[] = []
  if (!input?.reviewedAt) errors.push('reviewedAt_required')
  if (!input?.reviewedBy) errors.push('reviewedBy_required')
  if (!input?.proofRetryResult) errors.push('proofRetryResult_required')
  if (!input?.proofRetryApprovalResult) errors.push('proofRetryApprovalResult_required')
  if (!input?.resolutionVerificationResult) errors.push('resolutionVerificationResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(result: FactoryHermesSafeCommandShapeProofRetryReviewResult): FactoryHermesSafeCommandShapeProofRetryReviewValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_proof_retry_review_completed', 'safe_command_shape_proof_retry_review_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of ['runtimeStillBlocked', 'credentialAccessStillBlocked', 'networkStillBlocked', 'safeCommandShapeStillNotProven', 'canProceedToKeepHermesResearchBlockedDecision']) if (result?.[key] !== true) errors.push(`${key}_must_be_true`)
  for (const key of ['findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === 'safe_command_shape_proof_retry_review_completed' && result?.proofRetryReviewStatus !== 'accepted_blocked') errors.push('completed_must_accept_blocked')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(result: FactoryHermesSafeCommandShapeProofRetryReviewResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(text: string): FactoryHermesSafeCommandShapeProofRetryReviewResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(result: FactoryHermesSafeCommandShapeProofRetryReviewResult): FactoryHermesSafeCommandShapeProofRetryReviewSummary {
  return { reviewId: result.reviewId, status: result.status, decision: result.decision, proofRetryReviewStatus: result.proofRetryReviewStatus, canProceedToKeepHermesResearchBlockedDecision: result.canProceedToKeepHermesResearchBlockedDecision, canProceedToAlternateSafeRuntimeResolutionPlanning: result.canProceedToAlternateSafeRuntimeResolutionPlanning, canRunResearchNow: result.canRunResearchNow }
}
