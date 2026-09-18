export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofInput = { provedAt: string, provedBy: string, proofApprovalResult?: any, proofPlanningResult?: any, executionReviewResult?: any, executionResult?: any, runtimeSelectionDecisionResult?: any, researchRuntimeAdapterResult?: any, sourceInspection?: any[] }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', proofOnly: true }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofStatus = 'safe_command_shape_proof_completed' | 'safe_command_shape_proof_blocked' | 'safe_command_shape_proof_failed'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofDecision = 'hermes_safe_command_shape_proven_for_execution_retry_review' | 'hermes_safe_command_shape_proof_blocked_no_safe_command_shape' | 'hermes_safe_command_shape_proof_failed_block_runtime'
export type FactoryHermesSafeCommandShapeSourceInspectionResult = any
export type FactoryHermesSafeCommandShapeCandidateEvaluationResult = any
export type FactoryHermesStaticCommandShapeProofResult = any
export type FactoryHermesNoDefaultsAndNoToolsetsProofResult = any
export type FactoryHermesWrapperBoundaryCommandProofResult = any
export type FactoryHermesNonNetworkDryRunProofResult = any
export type FactoryHermesFailClosedCommandConstructionProofResult = any
export type FactoryHermesSafeCommandShapeProofDecisionRecord = any
export type FactoryHermesSafeCommandShapeProofEvidenceManifest = any
export type FactoryHermesSafeCommandShapeProofLimitationsCarryForward = any
export type FactoryHermesSafeCommandShapeProofRiskRegister = any
export type FactoryHermesSafeCommandShapeProofReviewEnvelope = any
export type FactoryHermesSafeCommandShapeProofReceipt = any
export type FactoryHermesSafeCommandShapeProofResult = any
export type FactoryHermesSafeCommandShapeProofValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofSummary = { proofId: string, status: string, decision: string, safeCommandShapeProven: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const falseFlags = ['controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const risks = ['proof_result_overinterpreted_as_runtime_approval', 'static_proof_false_positive', 'hidden_defaults_missed', 'toolsets_enabled_despite_config', 'mcp_enabled_despite_config', 'dry_run_not_equivalent_to_runtime', 'command_shape_changes_before_execution', 'credential_read_order_not_actually_safe', 'network_model_started_before_validation', 'wrapper_boundary_overtrusted', 'findings_used_without_real_run_review', 'execution_retried_without_new_approval']

function add(checks: any[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function fileHas(sourceInspection: any[], pattern: RegExp): boolean {
  return sourceInspection.some((file) => file.exists && file.kind === 'file' && pattern.test(String(file.redactedPreview || '')))
}

function inspectedPath(sourceInspection: any[], fragment: string): boolean {
  return sourceInspection.some((file) => String(file.relativePath).includes(fragment) && file.exists)
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProof(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofInput): FactoryHermesSafeCommandShapeProofResult {
  const approval = input.proofApprovalResult
  const planning = input.proofPlanningResult
  const review = input.executionReviewResult
  const execution = input.executionResult
  const sourceInspection = input.sourceInspection || []
  const checks: any[] = []
  const proofId = `hermes-controlled-research-runtime-safe-command-shape-proof:75b300f:${input.provedAt}`
  const inputOk = [
    add(checks, 'approval_granted', approval?.status, 'safe_command_shape_proof_approval_granted'),
    add(checks, 'approval_decision', approval?.decision, 'hermes_safe_command_shape_proof_approved_for_proof_gate'),
    add(checks, 'approval_status', approval?.proofApprovalStatus, 'approved_for_safe_command_shape_proof_only'),
    add(checks, 'approval_strategy', approval?.selectedWrapperStrategy, selectedWrapperStrategy),
    add(checks, 'approval_gate_allowed', approval?.safeCommandShapeProofGateAllowed),
    add(checks, 'approval_runtime_blocked', approval?.controlledRuntimeExecutionAllowedNow, false),
    add(checks, 'planning_created', planning?.status, 'safe_command_shape_proof_plan_created'),
    add(checks, 'planning_allows_approval', planning?.canProceedToSafeCommandShapeProofApproval),
    add(checks, 'planning_proof_now_false', planning?.canProceedToSafeCommandShapeProof, false),
    add(checks, 'review_completed', review?.status, 'controlled_research_runtime_execution_review_completed'),
    add(checks, 'review_safe_command_not_proven', review?.safeCommandShapeNotProven),
    add(checks, 'review_fail_closed', review?.failureModeAcceptedAsFailClosed),
    add(checks, 'review_credential_skipped', review?.credentialAccessCorrectlySkipped),
    add(checks, 'execution_blocked', execution?.status, 'controlled_research_runtime_execution_blocked'),
    add(checks, 'execution_safe_shape_false', execution?.finalRuntimeGuardDecision?.safeCommandShapeProven, false),
    add(checks, 'execution_credential_skipped', execution?.credentialAccessPerformed, false),
  ].every(Boolean)

  const entrypointFound = fileHas(sourceInspection, /hermes_cli\.main:main|def main\(/)
  const configSupport = fileHas(sourceInspection, /config/i)
  const runRootSupport = fileHas(sourceInspection, /run[_-]?root|output[_-]?dir|workspace/i)
  const promptPathSupport = fileHas(sourceInspection, /prompt/i)
  const providerModelCredentialOrderKnown = fileHas(sourceInspection, /credential|api[_-]?key|provider|model/i)
  const toolsetDefaultsKnown = fileHas(sourceInspection, /toolsets?|mcp|default/i)
  const parseOnlySupport = fileHas(sourceInspection, /dry[_-]?run|parse[_-]?only|validate[_-]?config/)
  const wrapperBoundaryExists = inspectedPath(sourceInspection, 'hermes-wrapper-no-tool-mode-runtime')
  const adapterBoundaryExists = inspectedPath(sourceInspection, 'hermes-research-runtime-adapter')
  const hiddenDefaultsExcluded = false
  const toolsetsExcluded = false
  const safeValidationOrderProven = false
  const sourceInspectionCompleted = sourceInspection.length > 0
  const unknowns = [
    !hiddenDefaultsExcluded && 'hidden_defaults_not_excluded',
    !toolsetsExcluded && 'no_toolsets_not_proven',
    !safeValidationOrderProven && 'credential_network_model_prompt_order_not_proven',
    !parseOnlySupport && 'safe_parse_only_or_dry_run_mode_not_found',
  ].filter(Boolean)

  const safeCommandShapeSourceInspectionResult = { completed: sourceInspectionCompleted, sourceFilesInspected: sourceInspection, entrypointsFound: entrypointFound ? ['hermes_cli.main:main_or_main_function'] : [], configPathSupport: configSupport ? 'mentioned_not_proven_safe' : 'not_found', runRootSupport: runRootSupport ? 'mentioned_not_proven_safe' : 'not_found', promptPathSupport: promptPathSupport ? 'mentioned_not_proven_safe' : 'not_found', providerModelCredentialOrder: providerModelCredentialOrderKnown ? 'present_but_order_not_proven_safe' : 'unknown', toolsetDefaultLoadingOrder: toolsetDefaultsKnown ? 'present_but_defaults_not_excluded' : 'unknown', mcpDisablingSupport: 'not_proven', parseOnlyDryRunSupport: parseOnlySupport ? 'mentioned_but_not_proven_safe' : 'not_proven', credentialReadBeforeValidationRisk: 'not_excluded', networkModelCallBeforeValidationRisk: 'not_excluded', hiddenDefaultsRisk: 'not_excluded', commandFallbackRisk: 'not_excluded', noSourceMutation: true, noExecution: true }
  const candidates = [
    { candidateId: 'direct_cli_with_explicit_verified_config', evaluated: true, proofStatus: 'not_proven', evidence: ['entrypoint/config hints are insufficient without no-defaults and validation-order proof'], blockers: ['hidden_defaults_not_excluded', 'safe_validation_order_not_proven'], supportsRuntimeCommandShape: false, requiresRuntimeExecution: false, requiresCredentialRead: false, requiresNetwork: false, requiresPromptPassing: false, requiresSourceMutation: false, risk: 'high' },
    { candidateId: 'wrapper_managed_command_with_fail_closed_preflight', evaluated: true, proofStatus: wrapperBoundaryExists ? 'not_proven' : 'blocked', evidence: ['wrapper boundary exists or is planned, but command proof is not sufficient'], blockers: ['wrapper_boundary_not_sufficient_without_command_shape'], supportsRuntimeCommandShape: false, requiresRuntimeExecution: false, requiresCredentialRead: false, requiresNetwork: false, requiresPromptPassing: false, requiresSourceMutation: false, risk: 'medium' },
    { candidateId: 'internal_api_empty_tool_registry', evaluated: true, proofStatus: 'not_proven', evidence: ['empty tool registry support not proven'], blockers: ['empty_tool_registry_not_proven'], supportsRuntimeCommandShape: false, requiresRuntimeExecution: false, requiresCredentialRead: false, requiresNetwork: false, requiresPromptPassing: false, requiresSourceMutation: false, risk: 'medium_high' },
    { candidateId: 'non_network_dry_run_or_parse_only_probe', evaluated: true, proofStatus: parseOnlySupport ? 'not_proven' : 'blocked', evidence: ['safe non-network dry-run preconditions not fully proven from source'], blockers: ['safe_non_network_dry_run_not_proven'], supportsRuntimeCommandShape: false, requiresRuntimeExecution: false, requiresCredentialRead: false, requiresNetwork: false, requiresPromptPassing: false, requiresSourceMutation: false, risk: 'medium' },
    { candidateId: 'keep_execution_blocked', evaluated: true, proofStatus: 'safe_fallback', evidence: ['runtime already blocked fail-closed'], blockers: [], supportsRuntimeCommandShape: false, requiresRuntimeExecution: false, requiresCredentialRead: false, requiresNetwork: false, requiresPromptPassing: false, requiresSourceMutation: false, risk: 'low' },
    ...['direct_cli_omit_toolsets', 'direct_cli_no_mcp_only', 'direct_cli_no_toolsets_text_only', 'modify_hermes_source_to_add_no_tool_mode'].map((candidateId) => ({ candidateId, evaluated: true, proofStatus: 'forbidden', evidence: ['forbidden by approval envelope'], blockers: ['forbidden_candidate'], supportsRuntimeCommandShape: false, requiresRuntimeExecution: false, requiresCredentialRead: false, requiresNetwork: false, requiresPromptPassing: false, requiresSourceMutation: candidateId.includes('modify'), risk: 'high' })),
  ]

  const staticCommandShapeProofResult = { passed: false, exactEntrypointIdentified: entrypointFound, exactConfigPathSupported: false, exactRunRootSupported: false, exactPromptArtifactPathSupported: false, providerModelHostRefsSupported: false, credentialRefWithoutValueSupported: false, configAppliesBeforeDefaults: false, hiddenDefaultsExcluded, mcpDisabled: false, toolsetsDisabledOrEmptyRegistry: false, noFallbackToDefaults: false, credentialReadAfterValidationGates: false, networkModelCallAfterValidationGates: false, failClosedPathExistsIfProofMissing: execution?.finalRuntimeGuardDecision?.blockReasons?.includes('safe_command_shape_not_proven') === true, unknowns, safeCommandShapeProven: false }
  const noDefaultsAndNoToolsetsProofResult = { passed: false, directNoToolsetsTextOnlyRejected: true, directHermesCliDefaultsForbidden: true, noMcpInsufficientAlone: true, hiddenDefaultsRiskCarriedForward: true, configWinsOverDefaults: false, omittedToolsetsDoNotLoadDefaults: false, mcpDisabled: false, noToolRegistryOrEmptyToolRegistry: false, anyToolUsageWouldBeDetected: false, blockers: ['config_wins_over_defaults_not_proven', 'omitted_toolsets_do_not_load_defaults_not_proven', 'mcp_disabled_not_proven', 'no_tool_registry_or_empty_tool_registry_not_proven'], safeCommandShapeProven: false }
  const wrapperBoundaryCommandProofResult = { passed: false, wrapperBoundaryExists, adapterBoundaryExists, wrapperUsesVerifiedConfig: false, wrapperUsesVerifiedRunManifest: false, wrapperUsesApprovedPromptArtifactByReferenceOnly: false, wrapperUsesCredentialRefOnlyUntilFinalGate: false, wrapperDoesNotUseDirectHermesDefaults: false, wrapperDoesNotFallbackToCliDefaults: false, wrapperEmitsRedactedCommandEnvelope: true, wrapperEmitsFailClosedReasonIfProofMissing: true, wrapperDeniesExecutionIfSafeCommandShapeNotProven: true, blocker: 'wrapper_boundary_not_sufficient_without_command_shape', safeCommandShapeProven: false }
  const nonNetworkDryRunProofResult = { passed: false, dryRunExecuted: false, skippedReason: 'safe_non_network_dry_run_not_proven', dryRunNotNeededBecauseStaticProofComplete: false, preconditions: { sourceProvesNoCredentials: false, sourceProvesNoEnvRead: false, sourceProvesNoNetwork: false, sourceProvesNoDns: false, sourceProvesNoModel: false, sourceProvesNoPromptToProvider: false, sourceProvesNoToolsets: false, sourceProvesNoSourceCachePythonEnvMutation: false, timeoutKillSwitchConfigured: true, commandUsesNoSecrets: true, outputNotUsedAsFindings: true } }
  const failClosedCommandConstructionProofResult = { passed: execution?.finalRuntimeGuardDecision?.blockReasons?.includes('safe_command_shape_not_proven') === true && execution?.credentialAccessPerformed === false, commandNotBuiltIfProofMissing: true, credentialNotReadIfProofMissing: execution?.credentialAccessPerformed === false, promptNotPassedIfProofMissing: true, networkNotUsedIfProofMissing: true, modelNotCalledIfProofMissing: true, hermesNotExecutedIfProofMissing: execution?.singleControlledRunExecuted === false, wrapperNotExecutedIfProofMissing: true, adapterNotExecutedIfProofMissing: true, toolsetsNotEnabledIfProofMissing: true, resultRecordsBlockerReason: execution?.finalRuntimeGuardDecision?.blockReasons?.includes('safe_command_shape_not_proven') === true, provesFailClosedOnly: true }
  const safeCommandShapeProven = inputOk && staticCommandShapeProofResult.passed && noDefaultsAndNoToolsetsProofResult.passed && wrapperBoundaryCommandProofResult.passed && failClosedCommandConstructionProofResult.passed && nonNetworkDryRunProofResult.passed
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofStatus = safeCommandShapeProven ? 'safe_command_shape_proof_completed' : failClosedCommandConstructionProofResult.passed ? 'safe_command_shape_proof_blocked' : 'safe_command_shape_proof_failed'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofDecision = safeCommandShapeProven ? 'hermes_safe_command_shape_proven_for_execution_retry_review' : failClosedCommandConstructionProofResult.passed ? 'hermes_safe_command_shape_proof_blocked_no_safe_command_shape' : 'hermes_safe_command_shape_proof_failed_block_runtime'
  const proofStatus = safeCommandShapeProven ? 'proven_with_limitations' : failClosedCommandConstructionProofResult.passed ? 'blocked' : 'failed'
  const blockers = [...unknowns, ...noDefaultsAndNoToolsetsProofResult.blockers, wrapperBoundaryCommandProofResult.blocker, nonNetworkDryRunProofResult.skippedReason].map((blockerId) => ({ blockerId, message: `Safe command shape proof blocker: ${blockerId}` }))
  const limitations = ['proof_is_not_runtime_execution', 'proof_does_not_approve_research_execution', 'findings_blocked_until_output_ingestion_review', 'safe_command_shape_not_proven', 'static_proof_incomplete', 'no_defaults_no_toolsets_not_proven', 'wrapper_boundary_not_sufficient_without_command_shape', 'dry_run_not_executed_or_not_safe', 'runtime_execution_still_blocked', 'credentials_not_read', 'no_network_model_prompt_used', 'no_runtime_output_available']

  return {
    proofId, proofKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_KIND, proofVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_VERSION, provedAt: input.provedAt, provedBy: input.provedBy, toolId: 'hermes_agent', proofApprovalRef: 'controlled-research-runtime-safe-command-shape-proof-approval-result.json', proofPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-planning-result.json', executionReviewRef: 'controlled-research-runtime-execution-review-result.json', executionRef: 'controlled-research-runtime-execution-result.json', selectedWrapperStrategy,
    safeCommandShapeSourceInspectionResult,
    safeCommandShapeCandidateEvaluationResult: { candidates, forbiddenCandidatesMaintained: true, noCandidateProvenWithoutNoDefaultsNoToolsetsAndValidationOrder: true, safeFallbackAvailable: true },
    staticCommandShapeProofResult,
    noDefaultsAndNoToolsetsProofResult,
    wrapperBoundaryCommandProofResult,
    nonNetworkDryRunProofResult,
    failClosedCommandConstructionProofResult,
    safeCommandShapeProofDecision: { decision, proofStatus, safeCommandShapeProven, dryRunExecuted: false, runtimeStillBlocked: true },
    safeCommandShapeProofEvidenceManifest: { evidenceId: `${proofId}:evidence`, sourceFilesInspected: sourceInspection.map((item) => item.relativePath), candidatesEvaluated: candidates.map((item) => item.candidateId), staticProofPassed: staticCommandShapeProofResult.passed, noDefaultsProofPassed: noDefaultsAndNoToolsetsProofResult.passed, wrapperBoundaryProofPassed: wrapperBoundaryCommandProofResult.passed, dryRunExecuted: false, dryRunPassed: false, failClosedProofPassed: failClosedCommandConstructionProofResult.passed, safeCommandShapeProven, blockers, unknowns, limitations, runtimeStillBlocked: true, researchStillBlocked: true, credentialsStillBlocked: true, networkStillBlocked: true, findingsStillBlocked: true },
    safeCommandShapeProofLimitationsCarryForward: { limitations },
    safeCommandShapeProofRiskRegister: { risks: risks.map((riskId) => ({ riskId, severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('defaults') ? 'high' : 'medium', disposition: 'blocks_runtime_execution_until_review_and_new_approval', mitigation: 'Require proof review and fresh execution approval before any runtime, credential, prompt, network, model, toolset, output, or findings action.', blocksRuntimeExecution: true, blocksResearchExecution: true, blocksFindingsUse: true })) },
    safeCommandShapeProofReviewEnvelope: { envelopeId: `${proofId}:review-envelope`, toolId: 'hermes_agent', approvedFor: 'safe_command_shape_proof_review_only', selectedWrapperStrategy, sourceProofRef: 'controlled-research-runtime-safe-command-shape-proof-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Review Gate v1', purpose: 'review proof outcome and decide whether to return to execution approval path or keep runtime blocked', allowedInNextGate: ['read proof result', 'review source inspection', 'review candidate evaluation', 'review static proof', 'review no-defaults/no-toolsets proof', 'review wrapper boundary proof', 'review dry-run proof if any', 'review fail-closed proof', 'decide next path', 'write ignored review artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute wrapper', 'execute adapter', 'execute research', 'pass prompt', 'call model', 'use network', 'read credentials', 'enable toolsets', 'ingest output', 'promote findings'], flags: { safeCommandShapeProofReviewAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, canProceedToSafeCommandShapeProofReview: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false, canUseFindings: false } },
    safeCommandShapeProofReceipt: { receiptId: `${proofId}:receipt`, proofId, dryRunExecuted: false, credentialValuesRead: false, envRead: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, researchExecution: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, outputIngestion: false, findingsPromoted: false },
    checks, blockers, warnings: limitations.map((warningId) => ({ warningId, message: warningId })),
    status, decision, proofStatus, sourceInspectionCompleted, staticCommandShapeProofPassed: staticCommandShapeProofResult.passed, noDefaultsNoToolsetsProofPassed: noDefaultsAndNoToolsetsProofResult.passed, wrapperBoundaryProofPassed: wrapperBoundaryCommandProofResult.passed, nonNetworkDryRunProofPassed: nonNetworkDryRunProofResult.passed ? true : 'skipped_not_safe', failClosedCommandConstructionProofPassed: failClosedCommandConstructionProofResult.passed, safeCommandShapeProven, dryRunExecuted: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofReview: true, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !safeCommandShapeProven, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Review Gate v1.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofInput): FactoryHermesSafeCommandShapeProofValidationResult {
  const errors: string[] = []
  if (!input?.provedAt) errors.push('provedAt_required')
  if (!input?.provedBy) errors.push('provedBy_required')
  if (!input?.proofApprovalResult) errors.push('proofApprovalResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(result: FactoryHermesSafeCommandShapeProofResult): FactoryHermesSafeCommandShapeProofValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_proof_completed', 'safe_command_shape_proof_blocked', 'safe_command_shape_proof_failed'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.canProceedToSafeCommandShapeProofReview !== true) errors.push('review_must_be_allowed')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(result: FactoryHermesSafeCommandShapeProofResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(text: string): FactoryHermesSafeCommandShapeProofResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(result: FactoryHermesSafeCommandShapeProofResult): FactoryHermesSafeCommandShapeProofSummary {
  return { proofId: result.proofId, status: result.status, decision: result.decision, safeCommandShapeProven: result.safeCommandShapeProven, canRunResearchNow: result.canRunResearchNow }
}
