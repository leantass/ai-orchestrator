export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-approval'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalInput = { approvedAt: string, approvedBy: string, proofPlanningResult?: any, executionReviewResult?: any, executionResult?: any }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', approvalOnly: true }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalStatus = 'safe_command_shape_proof_approval_granted' | 'safe_command_shape_proof_approval_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalDecision = 'hermes_safe_command_shape_proof_approved_for_proof_gate' | 'hermes_safe_command_shape_proof_approval_blocked_plan_incomplete_or_unsafe'
export type FactoryHermesProofPlanReadinessReview = any
export type FactoryHermesSourceInspectionPlanReview = any
export type FactoryHermesCommandShapeCandidateSetReview = any
export type FactoryHermesStaticCommandShapeProofPlanReview = any
export type FactoryHermesNoDefaultsAndNoToolsetsProofPlanReview = any
export type FactoryHermesWrapperBoundaryCommandProofPlanReview = any
export type FactoryHermesNonNetworkDryRunProofPlanReview = any
export type FactoryHermesFailClosedCommandConstructionPlanReview = any
export type FactoryHermesProofApprovalLimitationsCarryForward = any
export type FactoryHermesProofApprovalRiskDispositionRegister = any
export type FactoryHermesSafeCommandShapeProofGateEnvelope = any
export type FactoryHermesSafeCommandShapeProofApprovalReceipt = any
export type FactoryHermesSafeCommandShapeProofApprovalDecisionRecord = any
export type FactoryHermesSafeCommandShapeProofApprovalBlockerPlan = any
export type FactoryHermesSafeCommandShapeProofApprovalCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeProofApprovalBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeProofApprovalWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeProofApprovalResult = any
export type FactoryHermesSafeCommandShapeProofApprovalValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofApprovalSummary = { approvalId: string, status: string, decision: string, canProceedToSafeCommandShapeProof: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const falseFlags = ['safeCommandShapeProofAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const limitations = ['proof_approval_is_not_proof', 'proof_not_executed_yet', 'safe_command_shape_still_not_proven', 'no_real_hermes_execution_completed', 'no_model_network_or_provider_call_completed', 'credential_not_read', 'prompt_not_passed', 'no_runtime_output_available', 'no_tool_usage_runtime_evidence_available', 'config_schema_partially_unknown', 'empty_toolsets_support_unknown', 'hidden_defaults_may_still_exist_in_real_cli_runtime', 'wrapper_boundary_not_sufficient_without_safe_command_shape_proof']
const riskIds = ['approval_confused_with_proof', 'proof_confused_with_execution', 'proof_gate_accidentally_executes_hermes', 'proof_gate_accidentally_reads_credentials', 'proof_gate_accidentally_uses_network', 'proof_gate_accidentally_passes_prompt', 'static_source_read_misses_runtime_defaults', 'parse_only_mode_actually_reads_credentials', 'dry_run_mode_actually_uses_network', 'command_shape_falls_back_to_defaults', 'hidden_mcp_or_toolsets_enabled', 'proof_artifact_overclaims_runtime_safety', 'future_execution_retries_without_new_approval', 'findings_used_without_successful_review']

function add(checks: FactoryHermesSafeCommandShapeProofApprovalCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function candidateStatus(plan: any, strategyId: string): string | undefined {
  return plan?.safeCommandShapeCandidateSet?.candidates?.find((candidate: any) => candidate.strategyId === strategyId)?.status
}

function includesAll(values: unknown, required: string[]): boolean {
  return Array.isArray(values) && required.every((item) => values.includes(item))
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApproval(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalInput): FactoryHermesSafeCommandShapeProofApprovalResult {
  const plan = input.proofPlanningResult
  const review = input.executionReviewResult
  const execution = input.executionResult
  const checks: FactoryHermesSafeCommandShapeProofApprovalCheck[] = []
  const approvalId = `hermes-controlled-research-runtime-safe-command-shape-proof-approval:75b300f:${input.approvedAt}`

  const required = [
    add(checks, 'planning_status', plan?.status, 'safe_command_shape_proof_plan_created'),
    add(checks, 'planning_decision', plan?.decision, 'hermes_safe_command_shape_proof_plan_created_for_approval'),
    add(checks, 'planning_candidate', plan?.proofPlanningStatus, 'plan_candidate_created'),
    add(checks, 'strategy', plan?.selectedWrapperStrategy, selectedWrapperStrategy),
    add(checks, 'source_inspection_planned', plan?.sourceInspectionPlanned),
    add(checks, 'candidate_set_built', plan?.commandShapeCandidateSetBuilt),
    add(checks, 'static_plan_built', plan?.staticProofPlanBuilt),
    add(checks, 'no_defaults_plan_built', plan?.noDefaultsProofPlanBuilt),
    add(checks, 'wrapper_plan_built', plan?.wrapperBoundaryProofPlanBuilt),
    add(checks, 'dry_run_plan_built', plan?.nonNetworkDryRunProofPlanBuilt),
    add(checks, 'fail_closed_plan_built', plan?.failClosedCommandConstructionPlanBuilt),
    add(checks, 'approval_envelope_built', plan?.safeCommandShapeProofApprovalEnvelopeBuilt),
    add(checks, 'planning_allows_approval', plan?.canProceedToSafeCommandShapeProofApproval),
    add(checks, 'planning_does_not_allow_proof_now', plan?.safeCommandShapeProofAllowedNow, false),
    add(checks, 'planning_does_not_allow_runtime', plan?.controlledRuntimeExecutionAllowedNow, false),
    add(checks, 'review_completed', review?.status, 'controlled_research_runtime_execution_review_completed'),
    add(checks, 'review_decision', review?.decision, 'hermes_controlled_research_runtime_execution_review_accepted_blocked_before_runtime_for_command_shape_resolution'),
    add(checks, 'review_status', review?.executionReviewStatus, 'accepted_blocked_before_runtime'),
    add(checks, 'review_safe_command_not_proven', review?.safeCommandShapeNotProven),
    add(checks, 'review_fail_closed', review?.failureModeAcceptedAsFailClosed),
    add(checks, 'review_credential_skipped', review?.credentialAccessCorrectlySkipped),
    add(checks, 'review_planning_allowed', review?.safeCommandShapeProofPlanningAllowed),
    add(checks, 'review_next_planning_allowed', review?.canProceedToSafeCommandShapeProofPlanning),
    add(checks, 'review_runtime_blocked', review?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'review_findings_blocked', review?.canUseFindings, false),
    add(checks, 'execution_blocked', execution?.status, 'controlled_research_runtime_execution_blocked'),
    add(checks, 'execution_decision', execution?.decision, 'hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied'),
    add(checks, 'execution_status', execution?.executionStatus, 'blocked_before_runtime'),
    add(checks, 'execution_single_run_false', execution?.singleControlledRunExecuted, false),
    add(checks, 'execution_safe_shape_false', execution?.finalRuntimeGuardDecision?.safeCommandShapeProven, false),
    add(checks, 'execution_credential_skipped', execution?.credentialAccessPerformed, false),
    add(checks, 'execution_findings_blocked', execution?.canUseFindings, false),
  ]

  const sourceScope = plan?.safeCommandShapeSourceInspectionPlan?.inspectionScope || []
  const sourceReviewAccepted = [
    add(checks, 'source_plan_present', Boolean(plan?.safeCommandShapeSourceInspectionPlan)),
    add(checks, 'source_entrypoints_planned', sourceScope.includes('entrypoints')),
    add(checks, 'source_prompt_path_planned', sourceScope.includes('prompt_path')),
    add(checks, 'source_provider_model_credential_path_planned', sourceScope.includes('provider_model_credential_path')),
    add(checks, 'source_toolsets_defaults_path_planned', sourceScope.includes('toolsets_defaults_path')),
    add(checks, 'source_runtime_output_path_planned', sourceScope.includes('runtime_output_path')),
    add(checks, 'source_proof_blockers_planned', sourceScope.includes('proof_blockers')),
    add(checks, 'source_no_execution', plan?.safeCommandShapeSourceInspectionPlan?.noExecution),
    add(checks, 'source_no_overclaim', plan?.safeCommandShapeSourceInspectionPlan?.noRuntimeProofClaimed),
  ].every(Boolean)

  const requiredCandidates = ['direct_cli_with_explicit_verified_config', 'wrapper_managed_command_with_fail_closed_preflight', 'internal_api_empty_tool_registry', 'non_network_dry_run_or_parse_only_probe', 'keep_execution_blocked']
  const candidateReviewAccepted = [
    add(checks, 'candidate_set_present', Boolean(plan?.safeCommandShapeCandidateSet)),
    ...requiredCandidates.map((candidateId) => add(checks, `candidate_${candidateId}_present`, Boolean(candidateStatus(plan, candidateId)))),
    add(checks, 'candidate_omit_toolsets_forbidden', candidateStatus(plan, 'direct_cli_omit_toolsets'), 'forbidden'),
    add(checks, 'candidate_no_mcp_only_forbidden', candidateStatus(plan, 'direct_cli_no_mcp_only'), 'forbidden'),
    add(checks, 'candidate_text_only_forbidden', candidateStatus(plan, 'direct_cli_no_toolsets_text_only'), 'forbidden'),
    add(checks, 'candidate_wrapper_preferred', candidateStatus(plan, 'wrapper_managed_command_with_fail_closed_preflight'), 'preferred_planning_candidate'),
  ].every(Boolean)

  const staticPlan = plan?.staticCommandShapeProofPlan
  const staticReviewAccepted = [
    add(checks, 'static_requires_approval', staticPlan?.futureStaticProofRequiresApproval),
    add(checks, 'static_required_assertions', includesAll(staticPlan?.requiredAssertions, ['exact entrypoint', 'exact args', 'exact config path', 'exact run root', 'exact prompt artifact path', 'provider/model/host refs', 'credential ref only', 'no hidden defaults', 'no MCP', 'no toolsets', 'validation before credential/network/model', 'fail closed'])),
    add(checks, 'static_fail_unknown', staticPlan?.failIfAnyAssertionUnknown),
    add(checks, 'static_before_credentials', staticPlan?.proofArtifactRequiredBeforeCredentialAccess),
    add(checks, 'static_before_network', staticPlan?.proofArtifactRequiredBeforeNetwork),
    add(checks, 'static_before_prompt', staticPlan?.proofArtifactRequiredBeforePromptPassing),
    add(checks, 'static_before_hermes', staticPlan?.proofArtifactRequiredBeforeHermesExecution),
  ].every(Boolean)

  const noDefaultsPlan = plan?.noDefaultsAndNoToolsetsProofPlan
  const noDefaultsAccepted = ['directNoToolsetsTextOnlyRejected', 'directHermesCliDefaultsForbidden', 'noMcpInsufficientAlone', 'hiddenDefaultsRiskCarriedForward', 'futureProofMustShowConfigWinsOverDefaults', 'futureProofMustShowOmittedToolsetsDoNotLoadDefaults', 'futureProofMustShowMcpDisabled', 'futureProofMustShowNoToolRegistryOrEmptyToolRegistry', 'futureProofMustBlockIfUnknown', 'proofMustBeProducedBeforeCredentialAccess', 'proofMustBeProducedBeforeExecution'].every((key) => add(checks, `no_defaults_${key}`, noDefaultsPlan?.[key]))

  const wrapperPlan = plan?.wrapperBoundaryCommandProofPlan
  const wrapperAccepted = ['wrapperBoundaryRequired', 'futureWrapperCommandBuildRequiresApproval', 'wrapperMustUseVerifiedConfig', 'wrapperMustUseVerifiedRunManifest', 'wrapperMustUseApprovedPromptArtifact', 'wrapperMustUseCredentialRefOnlyUntilFinalGate', 'wrapperMustNotUseDirectHermesDefaults', 'wrapperMustNotFallbackToCliDefaults', 'wrapperMustEmitRedactedCommandEnvelope', 'wrapperMustEmitFailClosedReasonIfProofMissing', 'wrapperMustDenyExecutionIfSafeCommandShapeNotProven'].every((key) => add(checks, `wrapper_${key}`, wrapperPlan?.[key])) && add(checks, 'wrapper_can_build_now_false', wrapperPlan?.wrapperBoundaryCanBuildCommandNow, false)

  const dryRunPlan = plan?.nonNetworkDryRunProofPlan
  const dryRunAccepted = ['futureDryRunRequiresApproval', 'dryRunMustNotReadCredentials', 'dryRunMustNotUseNetwork', 'dryRunMustNotResolveDNS', 'dryRunMustNotCallModel', 'dryRunMustNotPassRealPromptToProvider', 'dryRunMustNotEnableToolsets', 'dryRunMustNotCreateRuntimeOutputAsFindings', 'dryRunBlockedIfOnlyAvailableModeRunsProvider', 'dryRunBlockedIfCredentialReadOccursBeforeValidation'].every((key) => add(checks, `dry_run_${key}`, dryRunPlan?.[key])) && add(checks, 'dry_run_allowed_now_false', dryRunPlan?.dryRunAllowedNow, false)

  const failClosedPlan = plan?.failClosedCommandConstructionPlan
  const failClosedAccepted = ['failClosedRequired', 'commandNotBuiltIfProofMissing', 'credentialNotReadIfProofMissing', 'promptNotPassedIfProofMissing', 'networkNotUsedIfProofMissing', 'modelNotCalledIfProofMissing', 'hermesNotExecutedIfProofMissing', 'wrapperNotExecutedIfProofMissing', 'adapterNotExecutedIfProofMissing', 'toolsetsNotEnabledIfProofMissing', 'resultMustRecordBlockerReason'].every((key) => add(checks, `fail_closed_${key}`, failClosedPlan?.[key])) && add(checks, 'fail_closed_reasons', includesAll(failClosedPlan?.allowedBlockerReasons, ['safe_command_shape_not_proven', 'config_path_not_proven', 'hidden_defaults_not_excluded', 'no_toolsets_not_proven', 'mcp_disable_not_proven', 'credential_read_order_not_safe', 'network_or_model_may_start_before_validation', 'prompt_passing_order_not_safe']))

  const accepted = required.every(Boolean) && sourceReviewAccepted && candidateReviewAccepted && staticReviewAccepted && noDefaultsAccepted && wrapperAccepted && dryRunAccepted && failClosedAccepted
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalStatus = accepted ? 'safe_command_shape_proof_approval_granted' : 'safe_command_shape_proof_approval_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalDecision = accepted ? 'hermes_safe_command_shape_proof_approved_for_proof_gate' : 'hermes_safe_command_shape_proof_approval_blocked_plan_incomplete_or_unsafe'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Proof approval check failed: ${check.checkId}` }))
  const riskRegister = { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('credentials') || riskId.includes('network') || riskId.includes('executes') ? 'high' : 'medium', disposition: ['accepted_for_proof_gate_only', 'blocks_runtime_execution', 'blocks_research_execution', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: 'Keep approval separate from proof and require future gate controls before any proof probe, command construction, credential, prompt, network, model, Hermes, wrapper, adapter, output, or findings action.', blocksProofApproval: false, blocksProofGate: false, blocksRuntimeExecution: true, blocksResearchExecution: true, blocksFindingsUse: true })) }
  const envelope = accepted ? { envelopeId: `${approvalId}:proof-gate-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_safe_command_shape_proof_gate_only', selectedWrapperStrategy, sourceProofApprovalRef: 'controlled-research-runtime-safe-command-shape-proof-approval-result.json', sourceProofPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-planning-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Gate v1', purpose: 'allow a future proof gate to validate a safe runnable command shape before any credential access, prompt passing, network, model call, Hermes execution or research execution', allowedInNextGate: ['read proof approval result', 'read proof planning result', 'inspect Hermes source read-only', 'inspect wrapper source read-only', 'inspect adapter source read-only', 'run static proof logic', 'if and only if safe, run non-network/non-credential parse-only or dry-run proof', 'produce proof artifact', 'write ignored proof artifact'], forbiddenEvenInNextGate: ['read credential values', 'read .env', 'pass real prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'execute real research', 'ingest output as findings', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], parseOnlyDryRunPreconditions: ['does not read credentials', 'does not use network', 'does not call model', 'does not pass prompt to provider', 'does not enable toolsets', 'does not mutate source/cache/python-env', 'has timeout/kill switch', 'proven from source/command to be non-network before execution'], flags: { safeCommandShapeProofGateAllowedNow: true, safeCommandShapeProofAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProof: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Gate v1' } : undefined

  return {
    approvalId, approvalKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent', proofPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-planning-result.json', executionReviewRef: 'controlled-research-runtime-execution-review-result.json', executionRef: 'controlled-research-runtime-execution-result.json', selectedWrapperStrategy,
    proofPlanReadinessReview: { proofPlanningResultPresent: Boolean(plan), proofPlanningStatus: plan?.proofPlanningStatus, proofPlanCreated: plan?.status === 'safe_command_shape_proof_plan_created', selectedWrapperStrategy, sourceInspectionPlanned: plan?.sourceInspectionPlanned === true, commandShapeCandidateSetBuilt: plan?.commandShapeCandidateSetBuilt === true, staticProofPlanBuilt: plan?.staticProofPlanBuilt === true, noDefaultsProofPlanBuilt: plan?.noDefaultsProofPlanBuilt === true, wrapperBoundaryProofPlanBuilt: plan?.wrapperBoundaryProofPlanBuilt === true, nonNetworkDryRunProofPlanBuilt: plan?.nonNetworkDryRunProofPlanBuilt === true, failClosedCommandConstructionPlanBuilt: plan?.failClosedCommandConstructionPlanBuilt === true, riskRegisterPresent: Boolean(plan?.safeCommandShapeProofRiskRegister), proofApprovalEnvelopePresent: Boolean(plan?.safeCommandShapeProofApprovalEnvelope), readinessSupportsProofGate: accepted, readinessDoesNotExecuteProofNow: true, readinessDoesNotApproveRuntimeExecutionNow: true, acceptedForProofGate: accepted, blocksImmediateProofExecution: true, blocksRuntimeExecution: true, blocksResearchExecution: true },
    sourceInspectionPlanReview: { acceptedForProofGate: sourceReviewAccepted, hermesSourceInspectionPlanned: true, wrapperSourceInspectionPlanned: true, adapterSourceInspectionPlanned: true, entrypointsPlanned: sourceScope.includes('entrypoints'), promptPathPlanned: sourceScope.includes('prompt_path'), providerModelCredentialPathPlanned: sourceScope.includes('provider_model_credential_path'), toolsetsDefaultsPathPlanned: sourceScope.includes('toolsets_defaults_path'), runtimeOutputPathPlanned: sourceScope.includes('runtime_output_path'), proofBlockersPlanned: sourceScope.includes('proof_blockers'), noSourceMutation: true, noExecution: true, noProofOverclaim: true, sourceInspectionStillRequiresFutureProofGate: true },
    commandShapeCandidateSetReview: { acceptedForProofGate: candidateReviewAccepted, candidateSetPresent: Boolean(plan?.safeCommandShapeCandidateSet), preferredCandidate: 'wrapper_managed_command_with_fail_closed_preflight', candidatesRequireProofBeforeExecution: true, noCandidateExecutableNow: true, noExecutionApproved: true },
    staticCommandShapeProofPlanReview: { acceptedForProofGate: staticReviewAccepted, staticProofStillNotExecuted: true },
    noDefaultsAndNoToolsetsProofPlanReview: { acceptedForProofGate: noDefaultsAccepted, noDefaultsStillRequiresProof: true },
    wrapperBoundaryCommandProofPlanReview: { acceptedForProofGate: wrapperAccepted, wrapperBoundaryStillRequiresCommandProof: true },
    nonNetworkDryRunProofPlanReview: { acceptedForProofGate: dryRunAccepted, dryRunStillRequiresApproval: true, dryRunMustFailClosedIfUnsafe: true },
    failClosedCommandConstructionPlanReview: { acceptedForProofGate: failClosedAccepted, failClosedRequiredForAllFutureProofAndExecution: true },
    proofApprovalLimitationsCarryForward: { limitations, limitationsAcceptableForProofGate: true, limitationsBlockRuntimeExecution: true, limitationsBlockResearchExecution: true, limitationsBlockCredentialAccess: true, limitationsBlockNetworkModelPrompt: true, limitationsBlockFindingsUse: true },
    proofApprovalRiskDispositionRegister: riskRegister,
    safeCommandShapeProofGateEnvelope: envelope,
    safeCommandShapeProofApprovalReceipt: { receiptId: `${approvalId}:receipt`, approvalId, decision, proofExecuted: false, researchExecution: false, retryExecution: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, hermesExecuted: false },
    hermesSafeCommandShapeProofApprovalDecision: { decisionId: `${approvalId}:decision`, decision, proofApprovalStatus: accepted ? 'approved_for_safe_command_shape_proof_only' : 'blocked', approvedForProofGateOnly: accepted, approvedForRuntimeExecution: false },
    safeCommandShapeProofApprovalBlockerPlan: accepted ? undefined : { planId: `${approvalId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true },
    checks, blockers, warnings: limitations.map((warningId) => ({ warningId, message: warningId })),
    status, decision, proofApprovalStatus: accepted ? 'approved_for_safe_command_shape_proof_only' : 'blocked', proofPlanAccepted: accepted, sourceInspectionPlanAccepted: sourceReviewAccepted, commandShapeCandidateSetAccepted: candidateReviewAccepted, staticProofPlanAccepted: staticReviewAccepted, noDefaultsProofPlanAccepted: noDefaultsAccepted, wrapperBoundaryProofPlanAccepted: wrapperAccepted, nonNetworkDryRunProofPlanAccepted: dryRunAccepted, failClosedCommandConstructionPlanAccepted: failClosedAccepted, safeCommandShapeProofGateAllowed: accepted, safeCommandShapeProofAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProof: accepted, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Gate v1.' : 'Keep Hermes research blocked; proof approval plan is incomplete or unsafe.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalInput): FactoryHermesSafeCommandShapeProofApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  if (!input?.proofPlanningResult) errors.push('proofPlanningResult_required')
  if (!input?.executionReviewResult) errors.push('executionReviewResult_required')
  if (!input?.executionResult) errors.push('executionResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(result: FactoryHermesSafeCommandShapeProofApprovalResult): FactoryHermesSafeCommandShapeProofApprovalValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_proof_approval_granted', 'safe_command_shape_proof_approval_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === 'safe_command_shape_proof_approval_granted' && result?.canProceedToSafeCommandShapeProof !== true) errors.push('granted_must_allow_proof_gate')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(result: FactoryHermesSafeCommandShapeProofApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(text: string): FactoryHermesSafeCommandShapeProofApprovalResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(result: FactoryHermesSafeCommandShapeProofApprovalResult): FactoryHermesSafeCommandShapeProofApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeProof: result.canProceedToSafeCommandShapeProof, canRunResearchNow: result.canRunResearchNow }
}
