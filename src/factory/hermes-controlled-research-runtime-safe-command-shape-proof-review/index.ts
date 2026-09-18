export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-review'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewInput = { reviewedAt: string, reviewedBy: string, proofResult?: any, proofApprovalResult?: any, proofPlanningResult?: any, executionReviewResult?: any, executionResult?: any, runtimeSelectionDecisionResult?: any }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', reviewOnly: true }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewStatus = 'safe_command_shape_proof_review_completed' | 'safe_command_shape_proof_review_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewDecision = 'hermes_safe_command_shape_proof_review_accepted_blocked_for_resolution_planning' | 'hermes_safe_command_shape_proof_review_blocked_result_incomplete_or_unsafe'
export type FactoryHermesSafeCommandShapeProofResultReview = any
export type FactoryHermesSourceInspectionResultReview = any
export type FactoryHermesCandidateEvaluationResultReview = any
export type FactoryHermesStaticCommandShapeProofResultReview = any
export type FactoryHermesNoDefaultsAndNoToolsetsProofResultReview = any
export type FactoryHermesWrapperBoundaryCommandProofResultReview = any
export type FactoryHermesNonNetworkDryRunProofResultReview = any
export type FactoryHermesFailClosedCommandConstructionProofResultReview = any
export type FactoryHermesProofEvidenceManifestReview = any
export type FactoryHermesProofReviewLimitationsCarryForward = any
export type FactoryHermesProofReviewRiskDispositionRegister = any
export type FactoryHermesSafeCommandShapeResolutionPlanningEnvelope = any
export type FactoryHermesSafeCommandShapeProofReviewReceipt = any
export type FactoryHermesSafeCommandShapeProofReviewDecisionRecord = any
export type FactoryHermesSafeCommandShapeProofReviewBlockerPlan = any
export type FactoryHermesSafeCommandShapeProofReviewCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeProofReviewBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeProofReviewWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeProofReviewResult = any
export type FactoryHermesSafeCommandShapeProofReviewValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofReviewSummary = { reviewId: string, status: string, decision: string, canProceedToSafeCommandShapeResolutionPlanning: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const falseFlags = ['findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const requiredLimitations = ['safe_command_shape_not_proven', 'static_proof_incomplete', 'no_defaults_no_toolsets_not_proven', 'wrapper_boundary_not_sufficient_without_command_shape', 'dry_run_not_executed_or_not_safe']
const carryForwardLimitations = ['safe_command_shape_not_proven', 'proof_blocked', 'static_proof_incomplete', 'no_defaults_no_toolsets_not_proven', 'wrapper_boundary_not_sufficient_without_command_shape', 'dry_run_not_executed_or_not_safe', 'no_real_hermes_execution_completed', 'no_model_network_or_provider_call_completed', 'credential_not_read', 'prompt_not_passed', 'no_runtime_output_available', 'no_findings_available', 'command_shape_resolution_required', 'runtime_execution_still_blocked']
const riskIds = ['blocked_proof_misread_as_runtime_ready', 'fail_closed_misread_as_command_shape_proof', 'wrapper_boundary_overtrusted', 'hidden_defaults_not_resolved', 'toolsets_mcp_not_resolved', 'dry_run_skip_ignored', 'credential_order_unknown_ignored', 'network_model_order_unknown_ignored', 'prompt_order_unknown_ignored', 'execution_retried_without_resolution', 'findings_used_without_runtime_output', 'resolution_planning_confused_with_runtime_execution']

function add(checks: FactoryHermesSafeCommandShapeProofReviewCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function hasLimitation(proof: any, id: string): boolean {
  return proof?.safeCommandShapeProofLimitationsCarryForward?.limitations?.includes(id) || proof?.safeCommandShapeProofEvidenceManifest?.limitations?.includes(id) || proof?.blockers?.some((blocker: any) => blocker.blockerId === id)
}

function candidate(proof: any, id: string): any {
  return proof?.safeCommandShapeCandidateEvaluationResult?.candidates?.find((item: any) => item.candidateId === id)
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReview(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewInput): FactoryHermesSafeCommandShapeProofReviewResult {
  const proof = input.proofResult
  const approval = input.proofApprovalResult
  const planning = input.proofPlanningResult
  const executionReview = input.executionReviewResult
  const checks: FactoryHermesSafeCommandShapeProofReviewCheck[] = []
  const reviewId = `hermes-controlled-research-runtime-safe-command-shape-proof-review:75b300f:${input.reviewedAt}`
  const required = [
    add(checks, 'proof_status_blocked', proof?.status, 'safe_command_shape_proof_blocked'),
    add(checks, 'proof_decision_blocked', proof?.decision, 'hermes_safe_command_shape_proof_blocked_no_safe_command_shape'),
    add(checks, 'proof_review_status', proof?.proofStatus, 'blocked'),
    add(checks, 'safe_shape_false', proof?.safeCommandShapeProven, false),
    add(checks, 'source_inspection_completed', proof?.sourceInspectionCompleted),
    add(checks, 'static_failed', proof?.staticCommandShapeProofPassed, false),
    add(checks, 'no_defaults_failed', proof?.noDefaultsNoToolsetsProofPassed, false),
    add(checks, 'wrapper_failed', proof?.wrapperBoundaryProofPassed, false),
    add(checks, 'dry_run_not_executed', proof?.dryRunExecuted, false),
    add(checks, 'dry_run_skip_reason', proof?.nonNetworkDryRunProofResult?.skippedReason, 'safe_non_network_dry_run_not_proven'),
    add(checks, 'fail_closed_passed', proof?.failClosedCommandConstructionProofPassed),
    add(checks, 'runtime_blocked', proof?.controlledRuntimeExecutionAllowedNow, false),
    add(checks, 'credential_blocked', proof?.credentialAccessAllowedNow, false),
    add(checks, 'prompt_blocked', proof?.promptPassingAllowedNow, false),
    add(checks, 'model_blocked', proof?.modelCallsAllowedNow, false),
    add(checks, 'network_blocked', proof?.networkAllowedNow, false),
    add(checks, 'toolsets_blocked', proof?.toolsetEnablementAllowedNow, false),
    add(checks, 'findings_blocked', proof?.findingsUseApprovedNow, false),
    add(checks, 'proof_review_allowed', proof?.canProceedToSafeCommandShapeProofReview),
    add(checks, 'runtime_not_allowed', proof?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'keep_blocked_allowed', proof?.canProceedToKeepHermesResearchBlockedDecision),
    add(checks, 'research_blocked', proof?.canRunResearchNow, false),
    ...requiredLimitations.map((id) => add(checks, `limitation_${id}`, hasLimitation(proof, id))),
    add(checks, 'approval_granted', approval?.status, 'safe_command_shape_proof_approval_granted'),
    add(checks, 'approval_decision', approval?.decision, 'hermes_safe_command_shape_proof_approved_for_proof_gate'),
    add(checks, 'approval_allows_proof', approval?.canProceedToSafeCommandShapeProof),
    add(checks, 'approval_runtime_blocked', approval?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'planning_created', planning?.status, 'safe_command_shape_proof_plan_created'),
    add(checks, 'execution_review_completed', executionReview?.status, 'controlled_research_runtime_execution_review_completed'),
    add(checks, 'execution_review_safe_shape_not_proven', executionReview?.safeCommandShapeNotProven),
  ]
  const accepted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewStatus = accepted ? 'safe_command_shape_proof_review_completed' : 'safe_command_shape_proof_review_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewDecision = accepted ? 'hermes_safe_command_shape_proof_review_accepted_blocked_for_resolution_planning' : 'hermes_safe_command_shape_proof_review_blocked_result_incomplete_or_unsafe'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Proof review check failed: ${check.checkId}` }))
  const envelope = accepted ? { envelopeId: `${reviewId}:resolution-planning-envelope`, toolId: 'hermes_agent', approvedFor: 'safe_command_shape_resolution_planning_only', selectedWrapperStrategy, sourceProofReviewRef: 'controlled-research-runtime-safe-command-shape-proof-review-result.json', sourceProofRef: 'controlled-research-runtime-safe-command-shape-proof-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Planning Gate v1', purpose: 'plan how to resolve the missing safe command shape by choosing between deeper source proof, wrapper command renderer implementation, internal API route, explicit no-tool config/schema change, or keeping Hermes research blocked', allowedInNextGate: ['read proof review result', 'read proof result', 'inspect Hermes source read-only', 'inspect wrapper source read-only', 'inspect adapter source read-only', 'plan resolution options', 'plan implementation if needed', 'plan future proof retry', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute wrapper against Hermes', 'execute adapter', 'execute research', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'enable toolsets', 'ingest output', 'promote findings', 'mutate Hermes source unless a later explicit implementation gate approves a local Factory-owned boundary change', 'run uv/pip/python/setup.py'], resolutionOptionsToEvaluate: ['deeper_static_source_proof', 'factory_owned_command_renderer', 'wrapper_fail_closed_command_builder', 'internal_api_empty_tool_registry_if_source_supports_it', 'explicit_no_tool_config_schema_if_supported', 'non_network_parse_only_probe_if_proven_safe', 'keep_hermes_research_blocked'], flags: { safeCommandShapeResolutionPlanningAllowedNow: true, safeCommandShapeResolvedNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeResolutionPlanning: true, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: true, canRunResearchNow: false, canUseFindings: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Planning Gate v1' } : undefined

  return {
    reviewId, reviewKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_KIND, reviewVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_VERSION, reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, toolId: 'hermes_agent', proofRef: 'controlled-research-runtime-safe-command-shape-proof-result.json', proofApprovalRef: 'controlled-research-runtime-safe-command-shape-proof-approval-result.json', proofPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-planning-result.json', executionReviewRef: 'controlled-research-runtime-execution-review-result.json', selectedWrapperStrategy,
    safeCommandShapeProofResultReview: { proofResultPresent: Boolean(proof), proofStatus: proof?.proofStatus, status: proof?.status, decision: proof?.decision, safeCommandShapeProven: proof?.safeCommandShapeProven === true, sourceInspectionCompleted: proof?.sourceInspectionCompleted === true, staticCommandShapeProofPassed: proof?.staticCommandShapeProofPassed === true, noDefaultsNoToolsetsProofPassed: proof?.noDefaultsNoToolsetsProofPassed === true, wrapperBoundaryProofPassed: proof?.wrapperBoundaryProofPassed === true, dryRunExecuted: proof?.dryRunExecuted === true, failClosedCommandConstructionProofPassed: proof?.failClosedCommandConstructionProofPassed === true, reviewConclusion: accepted ? 'correct_blocked_proof_no_safe_command_shape' : 'proof_result_incomplete_or_unsafe', proofBlockedAccepted: accepted, proofDoesNotSupportRuntimeExecution: true, proofSupportsResolutionPlanning: accepted, findingsRemainBlocked: true },
    sourceInspectionResultReview: { sourceInspectionAccepted: accepted, sourceInspectionCompletedReadOnly: proof?.safeCommandShapeSourceInspectionResult?.completed === true, noSourceMutation: proof?.safeCommandShapeSourceInspectionResult?.noSourceMutation === true, sourcePreviewsInspected: true, mappedSurfacesPreserved: true, unknownsPreserved: true, noRuntimeSafetyOverclaim: true, sourceInspectionInsufficientForSafeCommandShape: true },
    candidateEvaluationResultReview: { candidateEvaluationAccepted: accepted, noCandidateProven: proof?.safeCommandShapeCandidateEvaluationResult?.candidates?.every((item: any) => item.proofStatus !== 'proven') === true, keepExecutionBlockedAvailable: candidate(proof, 'keep_execution_blocked')?.proofStatus === 'safe_fallback', forbiddenCandidatesRemainForbidden: ['direct_cli_omit_toolsets', 'direct_cli_no_mcp_only', 'direct_cli_no_toolsets_text_only', 'modify_hermes_source_to_add_no_tool_mode'].every((id) => candidate(proof, id)?.proofStatus === 'forbidden'), preferredCandidateNotProven: candidate(proof, 'wrapper_managed_command_with_fail_closed_preflight')?.proofStatus !== 'proven', noCandidateSupportsRuntimeExecutionYet: true, resolutionPlanningRequired: true },
    staticCommandShapeProofResultReview: { staticProofFailureAccepted: accepted, staticProofResultPresent: Boolean(proof?.staticCommandShapeProofResult), passed: proof?.staticCommandShapeProofResult?.passed === true, unknowns: proof?.staticCommandShapeProofResult?.unknowns || [], unknownsCorrectlyBlockRuntime: true },
    noDefaultsAndNoToolsetsProofResultReview: { noDefaultsNoToolsetsFailureAccepted: accepted, passed: proof?.noDefaultsAndNoToolsetsProofResult?.passed === true, configWinsOverDefaultsProven: proof?.noDefaultsAndNoToolsetsProofResult?.configWinsOverDefaults === true, omittedToolsetsDoNotLoadDefaultsProven: proof?.noDefaultsAndNoToolsetsProofResult?.omittedToolsetsDoNotLoadDefaults === true, mcpDisabledProven: proof?.noDefaultsAndNoToolsetsProofResult?.mcpDisabled === true, noToolRegistryOrEmptyToolRegistryProven: proof?.noDefaultsAndNoToolsetsProofResult?.noToolRegistryOrEmptyToolRegistry === true, hiddenDefaultsRiskCarriedForward: true, toolBoundaryStillUnproven: true, runtimeMustRemainBlocked: true },
    wrapperBoundaryCommandProofResultReview: { wrapperBoundaryFailureAccepted: accepted, wrapperBoundaryExistsAsPolicy: proof?.wrapperBoundaryCommandProofResult?.wrapperBoundaryExists === true, wrapperBoundaryInsufficientAsCommandProof: true, blocker: 'wrapper_boundary_not_sufficient_without_command_shape', noRunnableSafeCommandProven: true, wrapperNeedsResolutionOrImplementationWork: true, runtimeMustRemainBlocked: true },
    nonNetworkDryRunProofResultReview: { dryRunSkipAccepted: accepted, dryRunExecuted: proof?.dryRunExecuted === true, skippedReason: proof?.nonNetworkDryRunProofResult?.skippedReason, noDryRunExecuted: proof?.dryRunExecuted === false, noNetwork: true, noDns: true, noModel: true, noCredential: true, noPromptPassed: true, noRuntimeOutput: true, noUnsafeDryRunAttempted: true, dryRunCannotSupportRuntimeExecution: true },
    failClosedCommandConstructionProofResultReview: { failClosedProofAccepted: accepted, passed: proof?.failClosedCommandConstructionProofResult?.passed === true, blockedBySafeCommandShapeNotProven: proof?.failClosedCommandConstructionProofResult?.resultRecordsBlockerReason === true, credentialNotRead: true, promptNotSent: true, networkNotUsed: true, modelNotCalled: true, hermesNotExecuted: true, wrapperNotExecutedAgainstHermes: true, findingsBlocked: true, failClosedProtectsCurrentSystem: true, failClosedDoesNotProveCommandShape: true },
    proofEvidenceManifestReview: { evidenceManifestAccepted: accepted, evidenceManifestPresent: Boolean(proof?.safeCommandShapeProofEvidenceManifest), sourceFilesInspected: proof?.safeCommandShapeProofEvidenceManifest?.sourceFilesInspected || [], candidatesEvaluated: proof?.safeCommandShapeProofEvidenceManifest?.candidatesEvaluated || [], blockersPresent: (proof?.safeCommandShapeProofEvidenceManifest?.blockers || []).length > 0, unknownsPresent: (proof?.safeCommandShapeProofEvidenceManifest?.unknowns || []).length > 0, runtimeStillBlocked: proof?.safeCommandShapeProofEvidenceManifest?.runtimeStillBlocked === true, researchStillBlocked: proof?.safeCommandShapeProofEvidenceManifest?.researchStillBlocked === true, credentialsStillBlocked: proof?.safeCommandShapeProofEvidenceManifest?.credentialsStillBlocked === true, networkStillBlocked: proof?.safeCommandShapeProofEvidenceManifest?.networkStillBlocked === true, findingsStillBlocked: proof?.safeCommandShapeProofEvidenceManifest?.findingsStillBlocked === true, evidenceSupportsResolutionPlanningOnly: true },
    proofReviewLimitationsCarryForward: { limitations: carryForwardLimitations, limitationsAcceptableForResolutionPlanning: true, limitationsBlockRuntimeExecution: true, limitationsBlockResearchExecution: true, limitationsBlockOutputIngestion: true, limitationsBlockFindingsUse: true },
    proofReviewRiskDispositionRegister: { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('execution') ? 'high' : 'medium', disposition: ['accepted_for_resolution_planning_only', 'blocks_runtime_execution', 'blocks_research_execution', 'blocks_output_ingestion', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: 'Keep blocked proof separate from runtime readiness and require resolution planning plus future proof/review/approval gates before any runtime action.', blocksProofReview: false, blocksResolutionPlanning: false, blocksRuntimeExecution: true, blocksResearchExecution: true, blocksFindingsUse: true })) },
    safeCommandShapeResolutionPlanningEnvelope: envelope,
    safeCommandShapeProofReviewReceipt: { receiptId: `${reviewId}:receipt`, reviewId, proofExecuted: false, dryRunRetried: false, researchExecution: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, hermesExecuted: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, envFileRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false },
    hermesSafeCommandShapeProofReviewDecision: { decisionId: `${reviewId}:decision`, decision, proofReviewStatus: accepted ? 'accepted_blocked' : 'blocked', acceptedForResolutionPlanningOnly: accepted, approvedForRuntimeExecution: false },
    safeCommandShapeProofReviewBlockerPlan: accepted ? undefined : { planId: `${reviewId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true },
    checks, blockers, warnings: carryForwardLimitations.map((warningId) => ({ warningId, message: warningId })),
    status, decision, proofReviewStatus: accepted ? 'accepted_blocked' : 'blocked', safeCommandShapeProofBlockedAccepted: accepted, safeCommandShapeStillNotProven: true, sourceInspectionAccepted: accepted, staticProofFailureAccepted: accepted, noDefaultsNoToolsetsFailureAccepted: accepted, wrapperBoundaryFailureAccepted: accepted, dryRunSkippedAccepted: accepted, failClosedProofAccepted: accepted, runtimeStillBlocked: true, credentialAccessStillBlocked: true, promptPassingStillBlocked: true, modelCallsStillBlocked: true, networkStillBlocked: true, toolsetEnablementStillBlocked: true, findingsUseApprovedNow: false, safeCommandShapeResolutionPlanningAllowed: accepted, canProceedToSafeCommandShapeResolutionPlanning: accepted, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: true, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Planning Gate v1.' : 'Keep Hermes research blocked; proof review result is incomplete or unsafe.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewInput): FactoryHermesSafeCommandShapeProofReviewValidationResult {
  const errors: string[] = []
  if (!input?.reviewedAt) errors.push('reviewedAt_required')
  if (!input?.reviewedBy) errors.push('reviewedBy_required')
  if (!input?.proofResult) errors.push('proofResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result: FactoryHermesSafeCommandShapeProofReviewResult): FactoryHermesSafeCommandShapeProofReviewValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_proof_review_completed', 'safe_command_shape_proof_review_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === 'safe_command_shape_proof_review_completed' && result?.canProceedToSafeCommandShapeResolutionPlanning !== true) errors.push('completed_must_allow_resolution_planning')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result: FactoryHermesSafeCommandShapeProofReviewResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(text: string): FactoryHermesSafeCommandShapeProofReviewResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result: FactoryHermesSafeCommandShapeProofReviewResult): FactoryHermesSafeCommandShapeProofReviewSummary {
  return { reviewId: result.reviewId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeResolutionPlanning: result.canProceedToSafeCommandShapeResolutionPlanning, canRunResearchNow: result.canRunResearchNow }
}
