export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-approval'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalInput = { approvedAt: string, approvedBy: string, resolutionPlanningResult?: any, proofReviewResult?: any, proofResult?: any }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalPolicy = { approvalOnly: true, selectedResolutionStrategy: 'factory_owned_command_renderer_with_fail_closed_wrapper_builder' }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalStatus = 'safe_command_shape_resolution_approval_granted' | 'safe_command_shape_resolution_approval_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalDecision = 'hermes_safe_command_shape_resolution_approved_for_implementation_planning' | 'hermes_safe_command_shape_resolution_approval_blocked_plan_incomplete_or_unsafe'
export type FactoryHermesResolutionPlanReadinessReview = any
export type FactoryHermesRootCauseReviewReview = any
export type FactoryHermesResolutionOptionCatalogReview = any
export type FactoryHermesResolutionOptionEvaluationReview = any
export type FactoryHermesRecommendedResolutionPathReview = any
export type FactoryHermesFactoryOwnedCommandRendererPlanReview = any
export type FactoryHermesWrapperFailClosedCommandBuilderPlanReview = any
export type FactoryHermesInternalApiEmptyToolRegistryAssessmentPlanReview = any
export type FactoryHermesExplicitNoToolConfigSchemaAssessmentPlanReview = any
export type FactoryHermesNonNetworkParseOnlyProbeAssessmentPlanReview = any
export type FactoryHermesImplementationRoadmapReview = any
export type FactoryHermesResolutionApprovalLimitationsCarryForward = any
export type FactoryHermesResolutionApprovalRiskDispositionRegister = any
export type FactoryHermesSafeCommandShapeResolutionImplementationPlanningEnvelope = any
export type FactoryHermesSafeCommandShapeResolutionApprovalReceipt = any
export type FactoryHermesSafeCommandShapeResolutionApprovalDecisionRecord = any
export type FactoryHermesSafeCommandShapeResolutionApprovalBlockerPlan = any
export type FactoryHermesSafeCommandShapeResolutionApprovalCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeResolutionApprovalBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeResolutionApprovalWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeResolutionApprovalResult = any
export type FactoryHermesSafeCommandShapeResolutionApprovalValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeResolutionApprovalSummary = { approvalId: string, status: string, decision: string, canProceedToSafeCommandShapeResolutionImplementationPlanning: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const selectedResolutionStrategy = 'factory_owned_command_renderer_with_fail_closed_wrapper_builder'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const falseFlags = ['safeCommandShapeResolutionImplementationAllowedNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeResolutionImplementation', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const riskIds = ['approval_confused_with_resolution', 'renderer_implementation_confused_with_command_proof', 'wrapper_builder_implementation_confused_with_adapter_execution', 'implementation_planning_confused_with_implementation', 'proof_retry_attempted_without_implementation_verification', 'runtime_retry_attempted_without_proven_command_shape', 'credential_access_before_resolution_complete', 'network_model_prompt_before_resolution_complete', 'toolsets_enabled_before_no_tool_proof', 'findings_used_without_runtime_output_review']

function add(checks: FactoryHermesSafeCommandShapeResolutionApprovalCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function includes(list: unknown, value: string): boolean {
  return Array.isArray(list) && list.includes(value)
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApproval(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalInput): FactoryHermesSafeCommandShapeResolutionApprovalResult {
  const planning = input.resolutionPlanningResult
  const review = input.proofReviewResult
  const proof = input.proofResult
  const checks: FactoryHermesSafeCommandShapeResolutionApprovalCheck[] = []
  const approvalId = `hermes-controlled-research-runtime-safe-command-shape-resolution-approval:75b300f:${input.approvedAt}`
  const required = [
    add(checks, 'planning_status', planning?.status, 'safe_command_shape_resolution_plan_created'),
    add(checks, 'planning_decision', planning?.decision, 'hermes_safe_command_shape_resolution_plan_created_for_approval'),
    add(checks, 'planning_candidate', planning?.resolutionPlanningStatus, 'plan_candidate_created'),
    add(checks, 'strategy', planning?.selectedResolutionStrategy, selectedResolutionStrategy),
    add(checks, 'wrapper_strategy', planning?.selectedWrapperStrategy, selectedWrapperStrategy),
    add(checks, 'fallback', planning?.safeFallbackStrategy, safeFallbackStrategy),
    ...['rootCauseReviewBuilt', 'resolutionOptionCatalogBuilt', 'resolutionOptionEvaluationBuilt', 'recommendedResolutionPathBuilt', 'factoryOwnedCommandRendererPlanBuilt', 'wrapperFailClosedCommandBuilderPlanBuilt', 'internalApiRouteAssessmentPlanBuilt', 'explicitNoToolConfigSchemaAssessmentPlanBuilt', 'parseOnlyProbeAssessmentPlanBuilt', 'resolutionImplementationPlanningEnvelopeBuilt'].map((key) => add(checks, key, planning?.[key])),
    add(checks, 'planning_allows_approval', planning?.canProceedToSafeCommandShapeResolutionApproval),
    add(checks, 'planning_blocks_implementation', planning?.canProceedToSafeCommandShapeResolutionImplementation, false),
    add(checks, 'planning_blocks_proof_retry', planning?.canProceedToSafeCommandShapeProofRetry, false),
    add(checks, 'planning_blocks_runtime', planning?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'proof_review_completed', review?.status, 'safe_command_shape_proof_review_completed'),
    add(checks, 'proof_review_status', review?.proofReviewStatus, 'accepted_blocked'),
    add(checks, 'proof_review_still_not_proven', review?.safeCommandShapeStillNotProven),
    add(checks, 'proof_blocked', proof?.status, 'safe_command_shape_proof_blocked'),
    add(checks, 'proof_safe_shape_false', proof?.safeCommandShapeProven, false),
    add(checks, 'proof_fail_closed', proof?.failClosedCommandConstructionProofPassed),
  ]
  const accepted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalStatus = accepted ? 'safe_command_shape_resolution_approval_granted' : 'safe_command_shape_resolution_approval_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalDecision = accepted ? 'hermes_safe_command_shape_resolution_approved_for_implementation_planning' : 'hermes_safe_command_shape_resolution_approval_blocked_plan_incomplete_or_unsafe'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Resolution approval check failed: ${check.checkId}` }))
  const envelope = accepted ? { envelopeId: `${approvalId}:implementation-planning-envelope`, toolId: 'hermes_agent', approvedFor: 'safe_command_shape_resolution_implementation_planning_only', selectedWrapperStrategy, selectedResolutionStrategy, sourceResolutionApprovalRef: 'controlled-research-runtime-safe-command-shape-resolution-approval-result.json', sourceResolutionPlanningRef: 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Planning Gate v1', purpose: 'plan implementation of Factory-owned command renderer and fail-closed wrapper command builder before any implementation, proof retry, credential access, network, model call, prompt passing or runtime execution', allowedInNextGate: ['read resolution approval result', 'read resolution planning result', 'plan implementation files', 'plan renderer types/functions', 'plan wrapper builder types/functions', 'plan verification strategy', 'plan proof retry chain', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['implement renderer', 'implement wrapper builder', 'execute proof', 'execute dry-run', 'execute Hermes', 'execute wrapper against Hermes', 'execute adapter', 'execute research', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'enable toolsets', 'ingest output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { safeCommandShapeResolutionImplementationPlanningAllowedNow: true, safeCommandShapeResolutionImplementationAllowedNow: false, safeCommandShapeResolvedNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeResolutionImplementationPlanning: true, canProceedToSafeCommandShapeResolutionImplementation: false, canProceedToSafeCommandShapeProofRetry: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Planning Gate v1' } : undefined

  return {
    approvalId, approvalKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent', resolutionPlanningRef: 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json', proofReviewRef: 'controlled-research-runtime-safe-command-shape-proof-review-result.json', proofRef: 'controlled-research-runtime-safe-command-shape-proof-result.json', selectedWrapperStrategy, selectedResolutionStrategy: accepted ? selectedResolutionStrategy : safeFallbackStrategy, safeFallbackStrategy,
    resolutionPlanReadinessReview: { resolutionPlanningResultPresent: Boolean(planning), resolutionPlanningStatus: planning?.resolutionPlanningStatus, selectedWrapperStrategy, selectedResolutionStrategy, safeFallbackStrategy, rootCauseReviewBuilt: planning?.rootCauseReviewBuilt === true, optionCatalogBuilt: planning?.resolutionOptionCatalogBuilt === true, optionEvaluationBuilt: planning?.resolutionOptionEvaluationBuilt === true, recommendedPathBuilt: planning?.recommendedResolutionPathBuilt === true, rendererPlanBuilt: planning?.factoryOwnedCommandRendererPlanBuilt === true, wrapperBuilderPlanBuilt: planning?.wrapperFailClosedCommandBuilderPlanBuilt === true, internalApiAssessmentPlanBuilt: planning?.internalApiRouteAssessmentPlanBuilt === true, noToolConfigSchemaAssessmentPlanBuilt: planning?.explicitNoToolConfigSchemaAssessmentPlanBuilt === true, parseOnlyProbeAssessmentPlanBuilt: planning?.parseOnlyProbeAssessmentPlanBuilt === true, roadmapBuilt: Boolean(planning?.safeCommandShapeResolutionImplementationRoadmap), riskRegisterPresent: Boolean(planning?.resolutionPlanningRiskRegister), approvalEnvelopePresent: Boolean(planning?.safeCommandShapeResolutionApprovalEnvelope), readinessSupportsImplementationPlanning: accepted, readinessDoesNotImplementNow: true, readinessDoesNotApproveProofRetryNow: true, readinessDoesNotApproveRuntimeExecutionNow: true, acceptedForImplementationPlanning: accepted, blocksResolutionImplementationNow: true, blocksProofRetryNow: true, blocksRuntimeExecutionNow: true },
    rootCauseReviewReview: { rootCauseReviewAccepted: accepted, rootCauseId: planning?.safeCommandShapeRootCauseReview?.rootCauseId, failClosedBehaviorWorks: planning?.safeCommandShapeRootCauseReview?.failClosedBehaviorWorks === true, commandShapeSafeStillUnresolved: true, noDefaultsNoToolsetsUnresolved: true, wrapperBoundaryInsufficient: true, dryRunUnsafeOrNotProven: true, credentialNetworkModelPromptOrderingUnresolved: true, keepBlockedFallbackAvailable: true, resolutionStillRequired: true, runtimeMustRemainBlocked: true },
    resolutionOptionCatalogReview: { resolutionOptionCatalogAccepted: accepted, requiredOptionsPresent: ['deeper_static_source_proof', 'factory_owned_command_renderer', 'wrapper_fail_closed_command_builder', 'internal_api_empty_tool_registry_if_source_supports_it', 'explicit_no_tool_config_schema_if_supported', 'non_network_parse_only_probe_if_proven_safe', 'keep_hermes_research_blocked'].every((id) => planning?.safeCommandShapeResolutionOptionCatalog?.options?.some((option: any) => option.optionId === id)), noOptionExecutesNow: true, hermesSourceMutationNotRecommended: true, keepBlockedFallbackPreserved: true, factoryOwnedBoundaryPrioritized: true, noRuntimeOptionApprovedNow: true },
    resolutionOptionEvaluationReview: { resolutionOptionEvaluationAccepted: accepted, preferred: 'factory_owned_command_renderer', supporting: ['wrapper_fail_closed_command_builder'], conditional: ['deeper_static_source_proof', 'internal_api_empty_tool_registry_if_source_supports_it', 'explicit_no_tool_config_schema_if_supported', 'non_network_parse_only_probe_if_proven_safe'], fallback: safeFallbackStrategy, selectedStrategyAccepted: accepted, residualRisksRequireFutureImplementationAndVerification: true },
    recommendedResolutionPathReview: { recommendedResolutionPathAccepted: accepted, primaryPath: planning?.safeCommandShapeRecommendedResolutionPath?.primary, supportsDeeperStaticSourceProof: includes(planning?.safeCommandShapeRecommendedResolutionPath?.supporting, 'deeper_static_source_proof'), supportsExplicitNoToolConfigSchemaAssessment: includes(planning?.safeCommandShapeRecommendedResolutionPath?.supporting, 'explicit_no_tool_config_schema_assessment'), supportsInternalApiEmptyRegistryAssessment: includes(planning?.safeCommandShapeRecommendedResolutionPath?.supporting, 'internal_api_empty_tool_registry_assessment_if_source_supports_it'), supportsNonNetworkParseOnlyProbeAssessment: includes(planning?.safeCommandShapeRecommendedResolutionPath?.supporting, 'non_network_parse_only_probe_assessment_if_proven_safe'), fallback: planning?.safeCommandShapeRecommendedResolutionPath?.fallback, implementationPlanningAllowed: accepted, implementationNowBlocked: true, runtimeNowBlocked: true },
    factoryOwnedCommandRendererPlanReview: { factoryOwnedCommandRendererPlanAccepted: accepted, rendererPlanPresent: Boolean(planning?.factoryOwnedCommandRendererResolutionPlan), factoryOwnedCode: true, doesNotMutateHermesSource: true, coreMustBePure: planning?.factoryOwnedCommandRendererResolutionPlan?.rendererMustBePureAtCore === true, mayReadOnlyArtifacts: true, mustNotExecuteHermes: true, mustNotReadCredentials: true, mustNotUseNetwork: true, requiredInputsPresent: true, requiredOutputsPresent: true, requiredFailClosedReasonsPresent: true, rendererImplementationPlanningAllowed: accepted, rendererImplementationNowBlocked: true },
    wrapperFailClosedCommandBuilderPlanReview: { wrapperFailClosedCommandBuilderPlanAccepted: accepted, wrapperBuilderPlanPresent: Boolean(planning?.wrapperFailClosedCommandBuilderResolutionPlan), integratesRenderer: true, wrapperDoesNotExecute: true, emitsBlockerIfMissing: true, noFallbackToHermesDefaults: true, implementationPlanningAllowed: accepted, implementationNowBlocked: true },
    internalApiEmptyToolRegistryAssessmentPlanReview: { internalApiRouteAssessmentPlanAccepted: accepted, assessmentPlanPresent: Boolean(planning?.internalApiEmptyToolRegistryAssessmentPlan), assessmentOnly: true, forbiddenIfSourceMutationRequired: true, noImplementationNow: true },
    explicitNoToolConfigSchemaAssessmentPlanReview: { explicitNoToolConfigSchemaAssessmentPlanAccepted: accepted, assessmentPlanPresent: Boolean(planning?.explicitNoToolConfigSchemaAssessmentPlan), assessmentOnly: true, noConfigMutationNow: true },
    nonNetworkParseOnlyProbeAssessmentPlanReview: { parseOnlyProbeAssessmentPlanAccepted: accepted, assessmentPlanPresent: Boolean(planning?.nonNetworkParseOnlyProbeAssessmentPlan), probeNotExecutedNow: true, futureApprovalRequired: true },
    implementationRoadmapReview: { implementationRoadmapAccepted: accepted, roadmapPresent: Boolean(planning?.safeCommandShapeResolutionImplementationRoadmap), implementationPlanningOnly: true, implementationNowBlocked: true, proofRetryNowBlocked: true, runtimeNowBlocked: true },
    resolutionApprovalLimitationsCarryForward: { limitations: ['approval_is_not_resolution', 'implementation_not_started', 'safe_command_shape_still_not_resolved', 'proof_retry_not_allowed_now', 'runtime_execution_still_blocked', 'credentials_not_read', 'prompt_not_passed', 'no_network_model_used', 'no_findings_available'], limitationsAcceptableForImplementationPlanning: true, limitationsBlockImplementationNow: true, limitationsBlockProofRetry: true, limitationsBlockRuntimeExecution: true, limitationsBlockFindingsUse: true },
    resolutionApprovalRiskDispositionRegister: { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('runtime') ? 'high' : 'medium', disposition: ['accepted_for_implementation_planning_only', 'blocks_implementation', 'blocks_proof_retry', 'blocks_runtime_execution', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: 'Require implementation planning, approval, implementation, verification, proof retry, and review gates before any runtime action.', blocksApproval: false, blocksImplementationPlanning: false, blocksImplementation: true, blocksProofRetry: true, blocksRuntimeExecution: true, blocksFindingsUse: true })) },
    safeCommandShapeResolutionImplementationPlanningEnvelope: envelope,
    safeCommandShapeResolutionApprovalReceipt: { receiptId: `${approvalId}:receipt`, approvalId, rendererImplemented: false, wrapperBuilderImplemented: false, proofExecuted: false, dryRunRetried: false, researchExecution: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, hermesExecuted: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, envFileRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false },
    hermesSafeCommandShapeResolutionApprovalDecision: { decisionId: `${approvalId}:decision`, decision, resolutionApprovalStatus: accepted ? 'approved_for_implementation_planning_only' : 'blocked', approvedForImplementationPlanningOnly: accepted, approvedForImplementationNow: false, approvedForRuntimeExecution: false },
    safeCommandShapeResolutionApprovalBlockerPlan: accepted ? undefined : { planId: `${approvalId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true },
    checks, blockers, warnings: riskIds.map((warningId) => ({ warningId, message: warningId })),
    status, decision, resolutionApprovalStatus: accepted ? 'approved_for_implementation_planning_only' : 'blocked', resolutionPlanAccepted: accepted, rootCauseReviewAccepted: accepted, resolutionOptionCatalogAccepted: accepted, resolutionOptionEvaluationAccepted: accepted, recommendedResolutionPathAccepted: accepted, factoryOwnedCommandRendererPlanAccepted: accepted, wrapperFailClosedCommandBuilderPlanAccepted: accepted, internalApiRouteAssessmentPlanAccepted: accepted, explicitNoToolConfigSchemaAssessmentPlanAccepted: accepted, parseOnlyProbeAssessmentPlanAccepted: accepted, implementationRoadmapAccepted: accepted, resolutionImplementationPlanningAllowed: accepted, safeCommandShapeResolutionImplementationAllowedNow: false, safeCommandShapeResolvedNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeResolutionImplementationPlanning: accepted, canProceedToSafeCommandShapeResolutionImplementation: false, canProceedToSafeCommandShapeProofRetry: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Planning Gate v1.' : 'Keep Hermes research blocked; resolution approval plan is incomplete or unsafe.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalInput): FactoryHermesSafeCommandShapeResolutionApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  if (!input?.resolutionPlanningResult) errors.push('resolutionPlanningResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result: FactoryHermesSafeCommandShapeResolutionApprovalResult): FactoryHermesSafeCommandShapeResolutionApprovalValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_resolution_approval_granted', 'safe_command_shape_resolution_approval_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result: FactoryHermesSafeCommandShapeResolutionApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(text: string): FactoryHermesSafeCommandShapeResolutionApprovalResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result: FactoryHermesSafeCommandShapeResolutionApprovalResult): FactoryHermesSafeCommandShapeResolutionApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeResolutionImplementationPlanning: result.canProceedToSafeCommandShapeResolutionImplementationPlanning, canRunResearchNow: result.canRunResearchNow }
}
