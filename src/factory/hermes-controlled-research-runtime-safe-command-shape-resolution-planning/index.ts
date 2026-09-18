export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-planning'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningInput = { plannedAt: string, plannedBy: string, proofReviewResult?: any, proofResult?: any, executionReviewResult?: any, runtimeSelectionDecisionResult?: any }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningPolicy = { planningOnly: true, selectedResolutionStrategy: 'factory_owned_command_renderer_with_fail_closed_wrapper_builder' }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningStatus = 'safe_command_shape_resolution_plan_created' | 'safe_command_shape_resolution_plan_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningDecision = 'hermes_safe_command_shape_resolution_plan_created_for_approval' | 'hermes_safe_command_shape_resolution_plan_blocked_no_viable_resolution_strategy'
export type FactoryHermesSafeCommandShapeRootCauseReview = any
export type FactoryHermesSafeCommandShapeResolutionOptionCatalog = any
export type FactoryHermesSafeCommandShapeResolutionOptionEvaluation = any
export type FactoryHermesSafeCommandShapeRecommendedResolutionPath = any
export type FactoryHermesFactoryOwnedCommandRendererResolutionPlan = any
export type FactoryHermesWrapperFailClosedCommandBuilderResolutionPlan = any
export type FactoryHermesInternalApiEmptyToolRegistryAssessmentPlan = any
export type FactoryHermesExplicitNoToolConfigSchemaAssessmentPlan = any
export type FactoryHermesNonNetworkParseOnlyProbeAssessmentPlan = any
export type FactoryHermesSafeCommandShapeResolutionImplementationRoadmap = any
export type FactoryHermesResolutionPlanningRiskRegister = any
export type FactoryHermesSafeCommandShapeResolutionApprovalEnvelope = any
export type FactoryHermesSafeCommandShapeResolutionPlanningReceipt = any
export type FactoryHermesSafeCommandShapeResolutionPlanCandidate = any
export type FactoryHermesSafeCommandShapeResolutionPlanningBlockerPlan = any
export type FactoryHermesSafeCommandShapeResolutionPlanningCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeResolutionPlanningBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeResolutionPlanningWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeResolutionPlanningResult = any
export type FactoryHermesSafeCommandShapeResolutionPlanningValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeResolutionPlanningSummary = { planningId: string, status: string, decision: string, canProceedToSafeCommandShapeResolutionApproval: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const selectedResolutionStrategy = 'factory_owned_command_renderer_with_fail_closed_wrapper_builder'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const falseFlags = ['safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeResolutionImplementation', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const optionIds = ['deeper_static_source_proof', 'factory_owned_command_renderer', 'wrapper_fail_closed_command_builder', 'internal_api_empty_tool_registry_if_source_supports_it', 'explicit_no_tool_config_schema_if_supported', 'non_network_parse_only_probe_if_proven_safe', 'keep_hermes_research_blocked']
const riskIds = ['resolution_planning_confused_with_resolution', 'renderer_confused_with_safe_command_proof', 'wrapper_builder_confused_with_runtime_adapter', 'command_renderer_falls_back_to_cli_defaults', 'source_contract_inferred_without_proof', 'no_tool_config_schema_overclaimed', 'internal_api_route_requires_source_mutation', 'parse_only_probe_uses_network_or_credentials', 'credential_order_still_unknown', 'network_model_order_still_unknown', 'prompt_order_still_unknown', 'proof_retry_attempted_without_verification', 'runtime_retry_attempted_without_proven_command_shape', 'keep_blocked_fallback_removed_too_early']

function add(checks: FactoryHermesSafeCommandShapeResolutionPlanningCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanning(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningInput): FactoryHermesSafeCommandShapeResolutionPlanningResult {
  const review = input.proofReviewResult
  const proof = input.proofResult
  const executionReview = input.executionReviewResult
  const checks: FactoryHermesSafeCommandShapeResolutionPlanningCheck[] = []
  const planningId = `hermes-controlled-research-runtime-safe-command-shape-resolution-planning:75b300f:${input.plannedAt}`
  const required = [
    add(checks, 'proof_review_completed', review?.status, 'safe_command_shape_proof_review_completed'),
    add(checks, 'proof_review_decision', review?.decision, 'hermes_safe_command_shape_proof_review_accepted_blocked_for_resolution_planning'),
    add(checks, 'proof_review_status', review?.proofReviewStatus, 'accepted_blocked'),
    add(checks, 'proof_block_accepted', review?.safeCommandShapeProofBlockedAccepted),
    add(checks, 'resolution_planning_allowed', review?.canProceedToSafeCommandShapeResolutionPlanning),
    add(checks, 'proof_blocked', proof?.status, 'safe_command_shape_proof_blocked'),
    add(checks, 'proof_safe_shape_false', proof?.safeCommandShapeProven, false),
    add(checks, 'proof_static_failed', proof?.staticCommandShapeProofPassed, false),
    add(checks, 'proof_no_defaults_failed', proof?.noDefaultsNoToolsetsProofPassed, false),
    add(checks, 'proof_wrapper_failed', proof?.wrapperBoundaryProofPassed, false),
    add(checks, 'proof_dry_run_false', proof?.dryRunExecuted, false),
    add(checks, 'proof_fail_closed', proof?.failClosedCommandConstructionProofPassed),
    add(checks, 'execution_review_completed', executionReview?.status, 'controlled_research_runtime_execution_review_completed'),
    add(checks, 'execution_review_safe_command_not_proven', executionReview?.safeCommandShapeNotProven),
  ]
  const accepted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningStatus = accepted ? 'safe_command_shape_resolution_plan_created' : 'safe_command_shape_resolution_plan_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningDecision = accepted ? 'hermes_safe_command_shape_resolution_plan_created_for_approval' : 'hermes_safe_command_shape_resolution_plan_blocked_no_viable_resolution_strategy'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Resolution planning check failed: ${check.checkId}` }))
  const optionCatalog = {
    options: [
      { optionId: 'deeper_static_source_proof', description: 'deeper Hermes source inspection for entrypoint/args/config/toolsets/ordering', category: 'proof_only', mutatesHermesSource: false, executesHermes: false, risk: 'medium', limitation: 'may still not demonstrate runtime behavior' },
      { optionId: 'factory_owned_command_renderer', description: 'Factory-owned renderer producing redacted, explicit, audited command envelopes without executing', category: 'factory_owned_boundary', mutatesHermesSource: false, executesHermes: false, risk: 'medium', benefit: 'avoids opaque commands and centralizes fail-closed' },
      { optionId: 'wrapper_fail_closed_command_builder', description: 'extend wrapper boundary to build command only if complete proof passes', category: 'wrapper_boundary', mutatesHermesSource: false, executesHermes: false, risk: 'medium', benefit: 'keeps execution blocked if no-tools proof is missing' },
      { optionId: 'internal_api_empty_tool_registry_if_source_supports_it', description: 'use internal API only if Hermes supports empty registry without defaults', category: 'source_supported_route', mutatesHermesSource: false, executesHermes: false, risk: 'medium_high', blockedIf: 'requires monkeypatch/source mutation' },
      { optionId: 'explicit_no_tool_config_schema_if_supported', description: 'configure explicit no-tools if schema supports it', category: 'config_schema_route', mutatesHermesSource: false, executesHermes: false, risk: 'medium_high', blockedIf: 'schema unknown or defaults win' },
      { optionId: 'non_network_parse_only_probe_if_proven_safe', description: 'future parse-only probe with no credential/network/model if source proves safety', category: 'proof_probe', mutatesHermesSource: false, executesHermes: false, risk: 'medium', blockedIf: 'reads credentials, uses network, calls model, or enables tools' },
      { optionId: 'keep_hermes_research_blocked', description: 'fallback if no safe resolution exists', category: 'safe_fallback', mutatesHermesSource: false, executesHermes: false, risk: 'low', benefit: 'does not expose credentials/network/models' },
    ],
  }
  const evaluations = optionIds.map((optionId) => ({
    optionId,
    viableForPlanning: true,
    viableForImplementation: ['factory_owned_command_renderer', 'wrapper_fail_closed_command_builder'].includes(optionId) ? 'future_approval_required' : optionId === 'keep_hermes_research_blocked',
    requiresHermesSourceMutation: false,
    requiresFactoryOwnedCode: ['factory_owned_command_renderer', 'wrapper_fail_closed_command_builder'].includes(optionId),
    requiresFutureProofRetry: optionId !== 'keep_hermes_research_blocked',
    requiresCredentialAccess: false,
    requiresNetwork: false,
    requiresModelCall: false,
    requiresPromptPassing: false,
    canBeFailClosed: true,
    canKeepRuntimeBlocked: true,
    resolvesStaticProofGap: ['deeper_static_source_proof', 'factory_owned_command_renderer'].includes(optionId),
    resolvesNoDefaultsNoToolsetsGap: ['factory_owned_command_renderer', 'wrapper_fail_closed_command_builder', 'explicit_no_tool_config_schema_if_supported'].includes(optionId),
    resolvesWrapperBoundaryGap: ['factory_owned_command_renderer', 'wrapper_fail_closed_command_builder'].includes(optionId),
    resolvesDryRunSafetyGap: ['non_network_parse_only_probe_if_proven_safe', 'factory_owned_command_renderer'].includes(optionId),
    residualRisks: ['future_approval_required', 'future_verification_required'],
    recommendation: optionId === 'factory_owned_command_renderer' ? 'preferred' : optionId === 'wrapper_fail_closed_command_builder' ? 'supporting' : optionId === 'keep_hermes_research_blocked' ? 'fallback' : 'conditional',
  }))
  const approvalEnvelope = accepted ? { envelopeId: `${planningId}:approval-envelope`, toolId: 'hermes_agent', approvedFor: 'safe_command_shape_resolution_approval_only', selectedWrapperStrategy, selectedResolutionStrategy, sourceResolutionPlanningRef: 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json', sourceProofReviewRef: 'controlled-research-runtime-safe-command-shape-proof-review-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Approval Gate v1', purpose: 'approve or block a future resolution path that may implement Factory-owned command rendering and fail-closed wrapper command building before any proof retry or runtime execution', allowedInNextGate: ['read resolution planning result', 'read proof review result', 'review root cause', 'review option evaluation', 'review recommended path', 'review renderer plan', 'review wrapper builder plan', 'review internal API/schema/probe assessments', 'review roadmap', 'decide whether resolution implementation planning may proceed', 'write ignored approval artifact'], forbiddenEvenInNextGate: ['implement renderer', 'implement wrapper builder', 'execute proof', 'execute dry-run', 'execute Hermes', 'execute wrapper against Hermes', 'execute adapter', 'execute research', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'enable toolsets', 'ingest output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { safeCommandShapeResolutionApprovalAllowedNow: true, safeCommandShapeResolutionImplementationAllowedNow: false, safeCommandShapeResolvedNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeResolutionApproval: true, canProceedToSafeCommandShapeResolutionImplementation: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Approval Gate v1' } : undefined

  return {
    planningId, planningKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_KIND, planningVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', proofReviewRef: 'controlled-research-runtime-safe-command-shape-proof-review-result.json', proofRef: 'controlled-research-runtime-safe-command-shape-proof-result.json', executionReviewRef: 'controlled-research-runtime-execution-review-result.json', selectedWrapperStrategy, selectedResolutionStrategy: accepted ? selectedResolutionStrategy : safeFallbackStrategy, safeFallbackStrategy,
    safeCommandShapeRootCauseReview: { rootCauseId: 'safe_command_shape_not_proven', proofBlockedBecause: ['static_proof_incomplete', 'no_defaults_no_toolsets_not_proven', 'wrapper_boundary_not_sufficient_without_command_shape', 'dry_run_not_executed_or_not_safe'], failClosedBehaviorWorks: true, runtimeExecutionPathRemainsBlocked: true, credentialReadPathRemainsBlocked: true, networkModelPromptPathRemainsBlocked: true, findingsPathRemainsBlocked: true, resolvedProblem: 'fail_closed_works', unresolvedProblem: 'safe_command_shape_not_proven', resolutionRequired: 'design Factory-owned command construction/proof boundary or keep blocked' },
    safeCommandShapeResolutionOptionCatalog: optionCatalog,
    safeCommandShapeResolutionOptionEvaluation: { evaluations },
    safeCommandShapeRecommendedResolutionPath: { primary: selectedResolutionStrategy, supporting: ['deeper_static_source_proof', 'explicit_no_tool_config_schema_assessment', 'internal_api_empty_tool_registry_assessment_if_source_supports_it', 'non_network_parse_only_probe_assessment_if_proven_safe'], fallback: safeFallbackStrategy, futurePhases: ['Resolution Approval Gate', 'Resolution Implementation Planning Gate', 'Resolution Implementation Approval Gate', 'Resolution Implementation Gate', 'Resolution Verification Planning Gate', 'Resolution Verification Approval Gate', 'Resolution Verification Gate', 'Safe Command Shape Proof Retry Planning/Approval/Gate', 'Execution retry approval path only if proof retry demonstrates command shape'], noRuntimeExecutionNow: true, noCredentialAccessNow: true, noNetworkModelPromptNow: true, noFindings: true },
    factoryOwnedCommandRendererResolutionPlan: { implementedNow: false, rendererPurpose: 'build redacted, explicit, audited command envelopes without executing', rendererMustBePureAtCore: true, rendererRuntimeMayReadOnlyArtifacts: true, rendererMustNotExecuteHermes: true, rendererMustNotReadCredentials: true, rendererMustNotUseNetwork: true, rendererInputs: ['verified config path', 'verified run root', 'prompt manifest ref', 'provider/model/host refs', 'credential ref only', 'source-derived CLI contract', 'no-tool proof artifact'], rendererOutputs: ['redacted command envelope', 'proof requirements', 'fail-closed blocker reasons'], rendererMustFailIf: ['sourceCliContractMissing', 'noToolProofMissing', 'hiddenDefaultsNotExcluded', 'mcpDisableNotProven', 'toolsetDisableNotProven', 'credentialOrderUnsafe', 'networkOrderUnsafe', 'promptOrderUnsafe'] },
    wrapperFailClosedCommandBuilderResolutionPlan: { implementedNow: false, integrateRendererWithWrapperBoundary: true, wrapperDoesNotExecute: true, wrapperOnlyBuildsRedactedEnvelope: true, wrapperValidates: ['config path', 'run root', 'prompt ref', 'credential ref', 'no-tool proof', 'source CLI contract'], wrapperEmitsBlockerIfMissing: true, wrapperNoFallbackToHermesDefaults: true },
    internalApiEmptyToolRegistryAssessmentPlan: { implementedNow: false, assessmentOnly: true, routeAllowedOnlyIfSourceSupportsEmptyRegistry: true, forbiddenIfMonkeypatchOrSourceMutationRequired: true, noExecutionNow: true },
    explicitNoToolConfigSchemaAssessmentPlan: { implementedNow: false, assessmentOnly: true, verifySchemaSupportsExplicitNoTools: true, verifyDefaultsCannotWin: true, noConfigMutationNow: true },
    nonNetworkParseOnlyProbeAssessmentPlan: { implementedNow: false, probeNotExecutedNow: true, assessOnlyIfSourceProvesNoCredentialsNetworkModelPromptToolsets: true, futureApprovalRequired: true },
    safeCommandShapeResolutionImplementationRoadmap: { implementationNow: false, phases: ['approval', 'implementation_planning', 'implementation_approval', 'implementation', 'verification_planning', 'verification_approval', 'verification', 'proof_retry_planning_approval_gate', 'execution_retry_approval_only_after_successful_proof_review'] },
    resolutionPlanningRiskRegister: { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('runtime') || riskId.includes('credential') || riskId.includes('network') ? 'high' : 'medium', disposition: ['accepted_for_resolution_planning_only', 'blocks_resolution_implementation', 'blocks_proof_retry', 'blocks_runtime_execution', 'requires_future_gate_control'], mitigation: 'Require approval, implementation planning, verification, proof retry, and review before any runtime action.', blocksResolutionPlanning: false, blocksResolutionImplementation: riskId !== 'resolution_planning_confused_with_resolution', blocksProofRetry: true, blocksRuntimeExecution: true })) },
    safeCommandShapeResolutionApprovalEnvelope: approvalEnvelope,
    safeCommandShapeResolutionPlanningReceipt: { receiptId: `${planningId}:receipt`, planningId, rendererImplemented: false, wrapperBuilderImplemented: false, proofExecuted: false, dryRunRetried: false, hermesExecuted: false, promptSent: false, networkUsed: false, credentialValuesRead: false, findingsPromoted: false },
    hermesSafeCommandShapeResolutionPlanCandidate: { candidateId: `${planningId}:candidate`, selectedResolutionStrategy: accepted ? selectedResolutionStrategy : safeFallbackStrategy, safeFallbackStrategy, approvalRequired: true, implementationAllowedNow: false },
    safeCommandShapeResolutionPlanningBlockerPlan: accepted ? undefined : { planId: `${planningId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true },
    checks, blockers, warnings: riskIds.map((warningId) => ({ warningId, message: warningId })),
    status, decision, resolutionPlanningStatus: accepted ? 'plan_candidate_created' : 'blocked', rootCauseReviewBuilt: accepted, resolutionOptionCatalogBuilt: accepted, resolutionOptionEvaluationBuilt: accepted, recommendedResolutionPathBuilt: accepted, factoryOwnedCommandRendererPlanBuilt: accepted, wrapperFailClosedCommandBuilderPlanBuilt: accepted, internalApiRouteAssessmentPlanBuilt: accepted, explicitNoToolConfigSchemaAssessmentPlanBuilt: accepted, parseOnlyProbeAssessmentPlanBuilt: accepted, resolutionImplementationPlanningEnvelopeBuilt: accepted, safeCommandShapeResolvedNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeResolutionApproval: accepted, canProceedToSafeCommandShapeResolutionImplementation: false, canProceedToSafeCommandShapeProofRetry: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Approval Gate v1.' : 'Keep Hermes research blocked; no viable resolution strategy was planned.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningInput): FactoryHermesSafeCommandShapeResolutionPlanningValidationResult {
  const errors: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt_required')
  if (!input?.plannedBy) errors.push('plannedBy_required')
  if (!input?.proofReviewResult) errors.push('proofReviewResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result: FactoryHermesSafeCommandShapeResolutionPlanningResult): FactoryHermesSafeCommandShapeResolutionPlanningValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_resolution_plan_created', 'safe_command_shape_resolution_plan_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result: FactoryHermesSafeCommandShapeResolutionPlanningResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(text: string): FactoryHermesSafeCommandShapeResolutionPlanningResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result: FactoryHermesSafeCommandShapeResolutionPlanningResult): FactoryHermesSafeCommandShapeResolutionPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeResolutionApproval: result.canProceedToSafeCommandShapeResolutionApproval, canRunResearchNow: result.canRunResearchNow }
}
