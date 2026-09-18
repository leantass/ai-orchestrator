export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_KIND = 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_VERSION
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_KIND
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalInput = Record<string, any>
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPolicy = Record<string, any>
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalStatus = 'alternate_safe_runtime_resolution_approval_granted' | 'alternate_safe_runtime_resolution_approval_blocked'
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalDecision = 'hermes_cli_blocked_alternate_safe_runtime_resolution_approved_for_implementation_planning' | 'alternate_safe_runtime_resolution_approval_blocked_plan_incomplete_or_unsafe'
export type FactoryHermesAlternateRuntimePlanReadinessReview = Record<string, any>
export type FactoryHermesCliBlockedPathReviewReview = Record<string, any>
export type FactoryHermesAlternateRuntimeOptionCatalogReview = Record<string, any>
export type FactoryHermesAlternateRuntimeOptionEvaluationReview = Record<string, any>
export type FactoryHermesSelectedAlternateRuntimePathReview = Record<string, any>
export type FactoryHermesFactoryOwnedNoToolProviderAdapterPlanReview = Record<string, any>
export type FactoryHermesProviderDirectRuntimeBoundaryPlanReview = Record<string, any>
export type FactoryHermesPromptArtifactOutputContractPlanReview = Record<string, any>
export type FactoryHermesCredentialNetworkModelSafetyPlanReview = Record<string, any>
export type FactoryHermesNoToolEnforcementAndDetectionPlanReview = Record<string, any>
export type FactoryHermesRuntimeTimeoutKillSwitchPlanReview = Record<string, any>
export type FactoryHermesOutputReviewAndFindingsGatePlanReview = Record<string, any>
export type FactoryHermesAlternateRuntimeGovernanceRoadmapReview = Record<string, any>
export type FactoryHermesAlternateRuntimeResolutionApprovalLimitationsCarryForward = Record<string, any>
export type FactoryHermesAlternateRuntimeResolutionApprovalRiskDispositionRegister = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeImplementationPlanningEnvelope = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalReceipt = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalDecisionRecord = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalBlockerPlan = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalBlocker = { blockerId: string, message: string }
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalWarning = { warningId: string, message: string }
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalResult = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalSummary = Record<string, any>

const selectedAlternateRuntimeStrategy = 'factory_owned_no_tool_model_provider_direct_research_adapter'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const risks = ['approval_confused_with_implementation', 'provider_direct_adapter_confused_with_safe_runtime', 'no_tool_by_construction_overclaimed', 'provider_call_added_too_early', 'credential_access_added_too_early', 'network_enabled_too_early', 'prompt_artifact_bypassed', 'output_contract_missing_or_ignored', 'raw_output_promoted_to_findings', 'tool_use_claims_ignored', 'Hermes_cli_unblocked_without_contract', 'mock_runtime_misread_as_real_research', 'keep_blocked_fallback_removed', 'runtime_execution_attempted_without_approval']
const limitations = ['alternate_runtime_approval_is_not_implementation', 'provider_direct_adapter_not_implemented_yet', 'mock_runtime_not_implemented_yet', 'Hermes_cli_remains_blocked', 'no_runtime_execution_approved', 'no_credentials_read', 'no_network_model_prompt_used', 'no_output_ingestion', 'no_findings_available', 'implementation_and_verification_required_before_mock_e2e', 'mock_e2e_required_before_provider_runtime', 'provider_runtime_requires_future_final_gate']

function add(checks: FactoryHermesAlternateSafeRuntimeResolutionApprovalCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function includesOption(planning: any, optionId: string): boolean {
  return planning?.alternateSafeRuntimeOptionCatalog?.options?.some((option: any) => option.optionId === optionId) === true
}

function acceptedReview(reviewId: string, accepted: boolean, details: Record<string, any> = {}) {
  return { reviewId, accepted, implementationPlanningAllowed: accepted, implementationNowBlocked: true, runtimeStillBlocked: true, ...details }
}

export function evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApproval(input: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalInput): FactoryHermesAlternateSafeRuntimeResolutionApprovalResult {
  const planning = input.alternateRuntimeResolutionPlanningResult
  const retryReview = input.proofRetryReviewResult
  const selection = input.runtimeSelectionDecisionResult
  const checks: FactoryHermesAlternateSafeRuntimeResolutionApprovalCheck[] = []
  const approvalId = `hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval:75b300f:${input.approvedAt}`
  const required = [
    add(checks, 'planning_status', planning?.status, 'alternate_safe_runtime_resolution_plan_created'),
    add(checks, 'planning_decision', planning?.decision, 'hermes_cli_blocked_alternate_safe_runtime_resolution_plan_created_for_approval'),
    add(checks, 'planning_state', planning?.alternateRuntimeResolutionPlanningStatus, 'plan_candidate_created'),
    add(checks, 'planning_hermes_cli_blocked', planning?.hermesCliRuntimeBlocked),
    add(checks, 'planning_strategy', planning?.selectedAlternateRuntimeStrategy, selectedAlternateRuntimeStrategy),
    add(checks, 'planning_fallback', planning?.safeFallbackStrategy, safeFallbackStrategy),
    ...['proofRetryReviewAcceptedForAlternatePlanning', 'hermesCliBlockedPathReviewBuilt', 'alternateRuntimeOptionCatalogBuilt', 'alternateRuntimeOptionEvaluationBuilt', 'selectedAlternateRuntimePathBuilt', 'factoryOwnedNoToolProviderAdapterPlanBuilt', 'providerDirectRuntimeBoundaryPlanBuilt', 'promptArtifactOutputContractPlanBuilt', 'credentialNetworkModelSafetyPlanBuilt', 'noToolEnforcementAndDetectionPlanBuilt', 'runtimeKillSwitchPlanBuilt', 'outputReviewAndFindingsGatePlanBuilt', 'governanceRoadmapPlanBuilt', 'alternateRuntimeResolutionApprovalEnvelopeBuilt', 'canProceedToAlternateSafeRuntimeResolutionApproval'].map((key) => add(checks, `planning_${key}`, planning?.[key])),
    ...['alternateRuntimeImplementedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeImplementation', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow'].map((key) => add(checks, `planning_${key}_false`, planning?.[key], false)),
    add(checks, 'retry_review_status', retryReview?.status, 'safe_command_shape_proof_retry_review_completed'),
    add(checks, 'retry_review_decision', retryReview?.decision, 'hermes_safe_command_shape_proof_retry_review_accepted_blocked_no_safe_command_shape'),
    add(checks, 'retry_review_shape_not_proven', retryReview?.safeCommandShapeStillNotProven),
    add(checks, 'retry_review_runtime_blocked', retryReview?.runtimeStillBlocked),
    add(checks, 'retry_review_alternate_allowed', retryReview?.canProceedToAlternateSafeRuntimeResolutionPlanning),
    add(checks, 'retry_review_runtime_not_allowed', retryReview?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'selection_provider', selection?.selectedProvider?.providerId, 'openai'),
    add(checks, 'selection_model', selection?.selectedModel?.modelId, 'gpt-4o-mini'),
    add(checks, 'selection_credential_ref', selection?.selectedCredentialRef?.credentialRefName, 'OPENAI_API_KEY'),
    add(checks, 'selection_host', selection?.selectedNetworkHosts?.selectedHosts?.[0], 'api.openai.com'),
  ]
  const granted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalStatus = granted ? 'alternate_safe_runtime_resolution_approval_granted' : 'alternate_safe_runtime_resolution_approval_blocked'
  const decision: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalDecision = granted ? 'hermes_cli_blocked_alternate_safe_runtime_resolution_approved_for_implementation_planning' : 'alternate_safe_runtime_resolution_approval_blocked_plan_incomplete_or_unsafe'
  const blockers = granted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Alternate runtime approval check failed: ${check.checkId}` }))
  const alternateRuntimePlanReadinessReview: FactoryHermesAlternateRuntimePlanReadinessReview = {
    planningResultPresent: Boolean(planning),
    alternateRuntimeResolutionPlanningStatus: planning?.alternateRuntimeResolutionPlanningStatus,
    hermesCliRuntimeBlocked: planning?.hermesCliRuntimeBlocked === true,
    selectedAlternateRuntimeStrategy: planning?.selectedAlternateRuntimeStrategy,
    safeFallbackStrategy: planning?.safeFallbackStrategy,
    allRequiredPlansBuilt: granted,
    approvalEnvelopePresent: Boolean(planning?.alternateSafeRuntimeResolutionApprovalEnvelope),
    readinessSupportsImplementationPlanning: granted,
    readinessDoesNotImplementNow: true,
    readinessDoesNotApproveRuntimeExecutionNow: true,
    readinessDoesNotApproveCredentialNetworkModelNow: true,
    alternateRuntimePlanAcceptedForApproval: granted,
    implementationPlanningAllowed: granted,
    implementationNowBlocked: true,
    runtimeStillBlocked: true,
  }
  const hermesCliBlockedPathReviewReview = acceptedReview('hermesCliBlockedPathReviewReview', granted, { hermesCliPathReviewed: planning?.hermesCliBlockedPathReview?.hermesCliPathReviewed === true, hermesCliMustRemainBlocked: true, noReattemptThroughSameHermesCliPath: true, rendererBuilderInsufficientForHermesRuntime: true, proofRetryBlockedAccepted: true })
  const alternateRuntimeOptionCatalogReview = acceptedReview('alternateRuntimeOptionCatalogReview', granted, { requiredOptionsPresent: ['factory_owned_no_tool_model_provider_direct_research_adapter', 'factory_owned_mock_only_research_runtime', 'keep_hermes_research_blocked', 'require_upstream_hermes_cli_contract_change', 'direct_hermes_cli_retry', 'hermes_cli_with_no_mcp_only', 'hermes_cli_omit_toolsets', 'hermes_cli_no_toolsets_text_only'].every((id) => includesOption(planning, id)), forbiddenHermesCliOptionsPreserved: true })
  const alternateRuntimeOptionEvaluationReview = acceptedReview('alternateRuntimeOptionEvaluationReview', granted, { providerDirectFactoryOwnedPreferred: true, mockOnlyRuntimeSupporting: true, keepBlockedFallbackPreserved: true, hermesCliDirectRetriesForbidden: true, noOptionRequiresCredentialNetworkModelNow: true, selectedStrategyNoToolFailClosedOutputContractFirst: true })
  const selectedAlternateRuntimePathReview = acceptedReview('selectedAlternateRuntimePathReview', granted, { primary: planning?.selectedAlternateRuntimePath?.primary, primaryAccepted: planning?.selectedAlternateRuntimePath?.primary === selectedAlternateRuntimeStrategy, supportingIncludesMock: planning?.selectedAlternateRuntimePath?.supporting?.includes('factory_owned_mock_only_research_runtime') === true, fallback: safeFallbackStrategy, roadmapIncludesRequiredGates: true, runtimeNowBlocked: true })
  const factoryOwnedNoToolProviderAdapterPlanReview = acceptedReview('factoryOwnedNoToolProviderAdapterPlanReview', granted, { factoryOwned: true, noHermesCli: true, noMcp: true, noToolsets: true, noToolRegistry: true, noBrowserFilesystemShellExternalTools: true, promptViaApprovedArtifactOnly: true, outputContractRequired: true, refsOnlyUntilFinalRuntimeGate: true, strictRedactionBoundedOutputSingleRequestTimeout: true, rawOutputNeverFindings: true, futureModulesProposed: planning?.factoryOwnedNoToolProviderAdapterPlan?.proposedFutureModules || [], adapterImplementationPlanningAllowed: granted, adapterImplementationNowBlocked: true })
  const providerDirectRuntimeBoundaryPlanReview = acceptedReview('providerDirectRuntimeBoundaryPlanReview', granted, { providerRef: 'openai', modelRef: 'gpt-4o-mini', futureHostAllowlist: ['api.openai.com'], noProviderCallNow: true, noNetworkNow: true, noDnsNow: true, credentialRefOnly: true, runtimeRequestOnlyInFutureExecutionGate: true, failClosedRulesAccepted: true, runtimeBoundaryStillRequiresFutureImplementationAndVerification: true })
  const promptArtifactOutputContractPlanReview = acceptedReview('promptArtifactOutputContractPlanReview', granted, { promptStaticApprovedArtifactRequired: true, promptHashRequired: true, promptSafeSummaryRequired: true, noSecrets: true, noToolsRequested: true, validJsonOutputContractRequired: true, outputSchemaValidationRequired: true, rawOutputUnderCodexTemp: true, outputRedactedBeforeReview: true, outputNotFindings: true, invalidJsonBlocksFindings: true, timeoutFailureBlocksFindings: true, promptAndOutputStillBlockedUntilFutureGates: true })
  const credentialNetworkModelSafetyPlanReview = acceptedReview('credentialNetworkModelSafetyPlanReview', granted, { noCredentialAccessNow: true, noEnvReadNow: true, noDotEnv: true, futureCredentialSourceOnly: 'process.env.OPENAI_API_KEY', futureCredentialAccessOnlyInFinalRuntimeGate: true, neverLogPersistOrArtifactCredential: true, futureNetworkOnlyToAllowlistedHost: true, futureDnsOnlyInsideFinalRuntimeGate: true, singleModelRequestOnly: true, timeoutAndOutputBoundsRequired: true, postRunSecretAuditRequired: true, credentialNetworkModelStillBlocked: true })
  const noToolEnforcementAndDetectionPlanReview = acceptedReview('noToolEnforcementAndDetectionPlanReview', granted, { noToolsByConstruction: true, noToolRegistry: true, noToolChoiceEnablingTools: true, noFunctionToolDefinitions: true, noBrowserFilesShellMcp: true, promptForbidsTools: true, requestBuilderRefusesToolDeclarations: true, outputDetectorFlagsToolUseClaims: true, toolUseClaimBlocksFindings: true, adapterEmitsNoToolEvidence: true })
  const runtimeTimeoutKillSwitchPlanReview = acceptedReview('runtimeTimeoutKillSwitchPlanReview', granted, { singleRequest: true, timeoutAbort: true, outputByteLimits: true, failureBlocksFindings: true, timeoutBlocksFindings: true, retryDisabledByDefault: true })
  const outputReviewAndFindingsGatePlanReview = acceptedReview('outputReviewAndFindingsGatePlanReview', granted, { outputCapture: true, redaction: true, schemaValidation: true, noToolEvidenceReview: true, secretScan: true, safetyClassification: true, ingestionReviewGate: true, findingsReviewGate: true, noAutomaticFindings: true })
  const alternateRuntimeGovernanceRoadmapReview = acceptedReview('alternateRuntimeGovernanceRoadmapReview', granted, { approvalGateActual: true, implementationPlanningApprovalImplementation: true, verificationPlanningApprovalVerification: true, mockE2EProviderRuntimeOutputFindingsReleaseQaGates: true, hermesCliRemainsBlocked: true, noRealProviderExecutionUntilExplicitFinalProviderRuntimeGate: true, noCommitPushUntilUserSaysExactPhrase: 'cerramos la etapa', alternateRuntimeGovernanceRoadmapAccepted: granted })
  const alternateRuntimeResolutionApprovalLimitationsCarryForward: FactoryHermesAlternateRuntimeResolutionApprovalLimitationsCarryForward = { limitations, limitationsAcceptableForImplementationPlanning: true, limitationsBlockImplementationNow: true, limitationsBlockRuntimeExecution: true, limitationsBlockFindingsUse: true }
  const alternateRuntimeResolutionApprovalRiskDispositionRegister: FactoryHermesAlternateRuntimeResolutionApprovalRiskDispositionRegister = { risks: risks.map((riskId) => ({ riskId, severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('provider_call') || riskId.includes('runtime_execution') ? 'high' : 'medium', disposition: ['accepted_for_alternate_runtime_implementation_planning_only', 'blocks_implementation', 'blocks_runtime_execution', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: 'Keep approval scoped to implementation planning; require future implementation, verification, runtime, output, and findings gates.', blocksApproval: false, blocksImplementationPlanning: false, blocksImplementation: !riskId.includes('approval_confused'), blocksRuntimeExecution: true, blocksFindingsUse: true })) }
  const alternateSafeRuntimeImplementationPlanningEnvelope: FactoryHermesAlternateSafeRuntimeImplementationPlanningEnvelope | undefined = granted ? { envelopeId: `${approvalId}:implementation-planning-envelope`, toolId: 'factory_controlled_research_runtime', approvedFor: 'alternate_safe_runtime_implementation_planning_only', selectedAlternateRuntimeStrategy, safeFallbackStrategy, sourceAlternateRuntimeResolutionApprovalRef: 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json', sourceAlternateRuntimeResolutionPlanningRef: 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1', purpose: 'plan implementation of Factory-owned no-tool provider-direct research adapter and optional mock runtime while keeping Hermes CLI blocked and all real runtime execution disabled', allowedInNextGate: ['read alternate approval result', 'read alternate planning result', 'plan implementation scope', 'plan future file allowlist', 'plan provider-direct adapter architecture', 'plan mock runtime architecture', 'plan prompt/output contract model', 'plan credential/network/model boundaries', 'plan no-tool enforcement', 'plan verification and E2E roadmap', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['implement adapter', 'implement runtime', 'execute runtime', 'execute research', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'pass prompt', 'enable tools', 'ingest output', 'promote findings', 'unblock Hermes CLI', 'mutate Hermes source', 'modify package.json', 'modify package-lock.json', 'modify UI/preload/App', 'run uv/pip/python/setup.py'], flags: { alternateSafeRuntimeImplementationPlanningAllowedNow: true, alternateSafeRuntimeImplementationAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, networkAllowedNow: false, modelCallsAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToAlternateSafeRuntimeImplementationPlanning: true, canProceedToAlternateSafeRuntimeImplementation: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1' } : undefined
  const receipt: FactoryHermesAlternateSafeRuntimeResolutionApprovalReceipt = { receiptId: `${approvalId}:receipt`, approvalOnly: true, alternateAdapterImplemented: false, runtimeImplemented: false, runtimeExecuted: false, researchExecuted: false, adapterExecuted: false, hermesExecuted: false, hermesExeExecuted: false, oneshotExecuted: false, wrapperExecutedAgainstHermes: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, dotEnvRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false, uvPipPythonSetupExecuted: false }

  return { approvalId, approvalKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'factory_controlled_research_runtime', alternateRuntimeResolutionPlanningRef: 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json', proofRetryReviewRef: 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json', runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json', hermesCliRuntimeBlocked: true, selectedAlternateRuntimeStrategy: granted ? selectedAlternateRuntimeStrategy : safeFallbackStrategy, safeFallbackStrategy, alternateRuntimePlanReadinessReview, hermesCliBlockedPathReviewReview, alternateRuntimeOptionCatalogReview, alternateRuntimeOptionEvaluationReview, selectedAlternateRuntimePathReview, factoryOwnedNoToolProviderAdapterPlanReview, providerDirectRuntimeBoundaryPlanReview, promptArtifactOutputContractPlanReview, credentialNetworkModelSafetyPlanReview, noToolEnforcementAndDetectionPlanReview, runtimeTimeoutKillSwitchPlanReview, outputReviewAndFindingsGatePlanReview, alternateRuntimeGovernanceRoadmapReview, alternateRuntimeResolutionApprovalLimitationsCarryForward, alternateRuntimeResolutionApprovalRiskDispositionRegister, alternateSafeRuntimeImplementationPlanningEnvelope, alternateSafeRuntimeResolutionApprovalReceipt: receipt, hermesAlternateSafeRuntimeResolutionApprovalDecision: { decisionId: `${approvalId}:decision`, status, decision, alternateRuntimeResolutionApprovalStatus: granted ? 'approved_for_implementation_planning_only' : 'blocked', implementationPlanningApproved: granted, implementationApprovedNow: false, runtimeApprovedNow: false, findingsApprovedNow: false }, alternateRuntimeResolutionApprovalBlockerPlan: granted ? undefined : { planId: `${approvalId}:blocker-plan`, blockers, selectedFallback: safeFallbackStrategy, canProceedToKeepHermesResearchBlockedDecision: true }, checks, blockers, warnings: limitations.map((warningId) => ({ warningId, message: warningId })), status, decision, alternateRuntimeResolutionApprovalStatus: granted ? 'approved_for_implementation_planning_only' : 'blocked', alternateRuntimePlanAccepted: granted, hermesCliBlockedPathReviewAccepted: granted, alternateRuntimeOptionCatalogAccepted: granted, alternateRuntimeOptionEvaluationAccepted: granted, selectedAlternateRuntimePathAccepted: granted, factoryOwnedNoToolProviderAdapterPlanAccepted: granted, providerDirectRuntimeBoundaryPlanAccepted: granted, promptArtifactOutputContractPlanAccepted: granted, credentialNetworkModelSafetyPlanAccepted: granted, noToolEnforcementAndDetectionPlanAccepted: granted, runtimeTimeoutKillSwitchPlanAccepted: granted, outputReviewAndFindingsGatePlanAccepted: granted, governanceRoadmapAccepted: granted, alternateRuntimeImplementationPlanningAllowed: granted, alternateRuntimeImplementationAllowedNow: false, alternateRuntimeExecutedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToAlternateSafeRuntimeImplementationPlanning: granted, canProceedToAlternateSafeRuntimeImplementation: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: true, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: granted ? 'Proceed to Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1.' : 'Keep Hermes research blocked; alternate runtime approval is incomplete or unsafe.' }
}

export function validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalInput(input: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalInput): FactoryHermesAlternateSafeRuntimeResolutionApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  if (!input?.alternateRuntimeResolutionPlanningResult) errors.push('alternateRuntimeResolutionPlanningResult_required')
  if (!input?.proofRetryReviewResult) errors.push('proofRetryReviewResult_required')
  if (!input?.runtimeSelectionDecisionResult) errors.push('runtimeSelectionDecisionResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(result: FactoryHermesAlternateSafeRuntimeResolutionApprovalResult): FactoryHermesAlternateSafeRuntimeResolutionApprovalValidationResult {
  const errors: string[] = []
  if (!['alternate_safe_runtime_resolution_approval_granted', 'alternate_safe_runtime_resolution_approval_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.hermesCliRuntimeBlocked !== true) errors.push('hermes_cli_must_remain_blocked')
  for (const key of ['alternateRuntimeImplementationAllowedNow', 'alternateRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeImplementation', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(result: FactoryHermesAlternateSafeRuntimeResolutionApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(text: string): FactoryHermesAlternateSafeRuntimeResolutionApprovalResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(result: FactoryHermesAlternateSafeRuntimeResolutionApprovalResult): FactoryHermesAlternateSafeRuntimeResolutionApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, alternateRuntimeResolutionApprovalStatus: result.alternateRuntimeResolutionApprovalStatus, canProceedToAlternateSafeRuntimeImplementationPlanning: result.canProceedToAlternateSafeRuntimeImplementationPlanning, canRunResearchNow: result.canRunResearchNow }
}
