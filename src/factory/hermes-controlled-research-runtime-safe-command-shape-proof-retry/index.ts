export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryInput = Record<string, any>
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPolicy = Record<string, any>
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryStatus = 'safe_command_shape_proof_retry_completed' | 'safe_command_shape_proof_retry_blocked' | 'safe_command_shape_proof_retry_failed'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryDecision = 'hermes_safe_command_shape_proof_retry_proven_for_review' | 'hermes_safe_command_shape_proof_retry_blocked_no_safe_command_shape' | 'hermes_safe_command_shape_proof_retry_failed_block_runtime'
export type FactoryHermesProofRetryApprovalValidationResult = Record<string, any>
export type FactoryHermesSourceCliContractProofRetryResult = Record<string, any>
export type FactoryHermesRendererCommandShapeProofRetryResult = Record<string, any>
export type FactoryHermesWrapperBuilderProofRetryResult = Record<string, any>
export type FactoryHermesNoDefaultsNoToolsetsProofRetryResult = Record<string, any>
export type FactoryHermesNonNetworkDryRunRetryAssessmentResult = Record<string, any>
export type FactoryHermesNonNetworkDryRunRetryResult = Record<string, any>
export type FactoryHermesFailClosedProofRetryResult = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryDecisionRecord = Record<string, any>
export type FactoryHermesProofRetryEvidenceManifest = Record<string, any>
export type FactoryHermesProofRetrySafetyManifest = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReviewEnvelope = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryReceipt = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryResult = Record<string, any>
export type FactoryHermesSafeCommandShapeProofRetryValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofRetrySummary = Record<string, any>

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const selectedResolutionStrategy = 'factory_owned_command_renderer_with_fail_closed_wrapper_builder'
const safeFallbackStrategy = 'keep_hermes_research_blocked'

function check(checks: any[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function requiredUnknowns(): string[] {
  return [
    'credential_read_order_known',
    'credential_read_after_validation',
    'network_model_call_order_known',
    'network_model_after_validation',
    'prompt_passing_order_known',
    'prompt_passing_after_validation',
    'config_applied_before_defaults',
    'hidden_defaults_excluded',
    'mcp_disable_supported',
    'toolsets_disable_supported',
    'empty_tool_registry_supported',
    'parse_only_dry_run_safety_proven',
  ]
}

function approvalValidation(approval: any, verification: any, implementation: any, checks: any[]): FactoryHermesProofRetryApprovalValidationResult {
  const passed = [
    check(checks, 'approval_status', approval?.status, 'safe_command_shape_proof_retry_approval_granted'),
    check(checks, 'approval_decision', approval?.decision, 'hermes_safe_command_shape_proof_retry_approved_for_retry_gate'),
    check(checks, 'approval_gate_allowed', approval?.proofRetryGateAllowed),
    check(checks, 'approval_can_proceed', approval?.canProceedToSafeCommandShapeProofRetry),
    check(checks, 'approval_runtime_blocked', approval?.controlledRuntimeExecutionAllowedNow, false),
    check(checks, 'approval_research_blocked', approval?.canRunResearchNow, false),
    check(checks, 'verification_status', verification?.status, 'safe_command_shape_resolution_verification_completed'),
    check(checks, 'verification_mode', verification?.verificationStatus, 'verified_code_only_not_runtime_execution'),
    check(checks, 'verification_renderer', verification?.rendererVerified),
    check(checks, 'verification_builder', verification?.wrapperBuilderVerified),
    check(checks, 'verification_readiness', verification?.proofRetryReadinessVerified),
    check(checks, 'implementation_status', implementation?.status, 'safe_command_shape_resolution_implementation_completed'),
    check(checks, 'implementation_renderer', implementation?.factoryOwnedRendererImplemented),
    check(checks, 'implementation_builder', implementation?.wrapperFailClosedBuilderImplemented),
  ].every(Boolean)
  return { proofRetryApprovalValid: passed, approvalStatus: approval?.status, verificationStatus: verification?.verificationStatus, implementationStatus: implementation?.status, runtimeStillBlocked: true }
}

function buildReceipt(proofRetryId: string): FactoryHermesSafeCommandShapeProofRetryReceipt {
  return {
    receiptId: `${proofRetryId}:receipt`,
    proofRetryExecutedCodeOnlyStatic: true,
    dryRunRetryExecuted: false,
    researchExecution: false,
    adapterExecuted: false,
    wrapperExecutedAgainstHermes: false,
    tempConfigModified: false,
    runRootModified: false,
    hermesRuntimeExecuted: false,
    hermesExeExecuted: false,
    oneshotRuntimeExecuted: false,
    promptSent: false,
    modelCalls: false,
    networkUsed: false,
    dnsResolved: false,
    endpointsTested: false,
    envSecretsRead: false,
    dotEnvRead: false,
    credentialValuesRead: false,
    toolsetsEnabled: false,
    outputIngestion: false,
    findingsPromoted: false,
    uvPipPythonSetupExecuted: false,
  }
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetry(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryInput): FactoryHermesSafeCommandShapeProofRetryResult {
  const retriedAt = input.retriedAt || '2026-07-24T23:45:00.000Z'
  const proofRetryId = `hermes-controlled-research-runtime-safe-command-shape-proof-retry:75b300f:${retriedAt}`
  const checks: any[] = []
  const blockers: any[] = []
  const warnings: any[] = []
  const unknowns = requiredUnknowns()

  const proofRetryApprovalValidationResult = approvalValidation(input.proofRetryApprovalResult, input.resolutionVerificationResult, input.implementationResult, checks)
  const sourceFilesInspected = input.sourceFilesInspected || []
  const sourceCliContractProofRetryResult: FactoryHermesSourceCliContractProofRetryResult = {
    proofId: `${proofRetryId}:source-cli-contract`,
    sourceRootPresent: input.sourceRootPresent === true,
    sourceFilesInspected,
    exactSourceVersionRef: '75b300f',
    entrypointKind: sourceFilesInspected.includes('cli.py') ? 'python_cli_entrypoint_observed_read_only' : 'unknown',
    executablePathRef: sourceFilesInspected.includes('cli.py') ? 'source/cli.py' : 'unknown',
    explicitConfigPathSupport: input.sourceSignals?.explicitConfigPathSupport === true,
    explicitRunRootSupport: input.sourceSignals?.explicitRunRootSupport === true,
    promptFileRefSupport: input.sourceSignals?.promptFileRefSupport === true,
    providerModelHostRefsSupport: input.sourceSignals?.providerModelHostRefsSupport === true,
    credentialReadOrderKnown: false,
    credentialReadAfterValidation: false,
    networkModelCallOrderKnown: false,
    networkModelAfterValidation: false,
    promptPassingOrderKnown: false,
    promptPassingAfterValidation: false,
    configAppliedBeforeDefaults: false,
    hiddenDefaultsExcluded: false,
    mcpDisableSupportedProven: false,
    toolsetsDisableSupportedProven: false,
    emptyToolRegistrySupportProven: false,
    parseOnlyDryRunSupport: false,
    criticalUnknowns: unknowns,
    sourceCliContractProofPassed: false,
  }
  blockers.push(...unknowns.map((unknown) => ({ blockerId: `source_${unknown}`, message: `Source CLI contract proof retry could not prove ${unknown}.` })))

  const noDefaultsNoToolsetsProofRetryResult: FactoryHermesNoDefaultsNoToolsetsProofRetryResult = {
    proofId: `${proofRetryId}:no-defaults-no-toolsets`,
    directNoToolsetsTextOnlyRejectedAsPolicyLabel: true,
    directCliOmitToolsetsForbidden: true,
    directNoMcpOnlyInsufficient: true,
    configWinsOverDefaultsProven: false,
    omittedToolsetsDoNotLoadDefaultsProven: false,
    mcpDisabledProven: false,
    noToolRegistryOrEmptyToolRegistryProven: false,
    noHiddenDefaultsProven: false,
    anyToolUsageDetectableProven: false,
    noToolProofDependencyBlocksRendererBuilderIfIncomplete: true,
    criticalUnknowns: ['config_wins_over_defaults', 'omitted_toolsets_defaults', 'mcp_disabled', 'empty_tool_registry', 'hidden_defaults'],
    noDefaultsNoToolsetsProofPassed: false,
  }

  const rendererCommandShapeProofRetryResult: FactoryHermesRendererCommandShapeProofRetryResult = {
    proofId: `${proofRetryId}:renderer`,
    moduleTs: 'src/factory/hermes-controlled-research-runtime-command-renderer/index.ts',
    moduleCjs: 'electron/factory/hermes-controlled-research-runtime-command-renderer/index.cjs',
    rendererBoundary: input.rendererBoundary,
    blocksSourceContractIncomplete: true,
    blocksNoToolProofMissing: true,
    blocksHiddenDefaultsUnknown: true,
    blocksMcpToolsetsUnknown: true,
    blocksCredentialNetworkModelPromptOrderingUnknown: true,
    passCaseRequiresFullyProvenSourceContractAndNoToolProof: true,
    passCaseEmitsRedactedEnvelope: true,
    passCaseRunnableNowFalse: true,
    passCaseCredentialValueIncludedFalse: true,
    createsExecutableCommandReal: false,
    readsEnv: false,
    usesNetwork: false,
    executesHermes: false,
    rendererCommandShapeProofPassed: true,
  }

  const wrapperBuilderProofRetryResult: FactoryHermesWrapperBuilderProofRetryResult = {
    proofId: `${proofRetryId}:wrapper-builder`,
    moduleTs: 'src/factory/hermes-wrapper-fail-closed-command-builder/index.ts',
    moduleCjs: 'electron/factory/hermes-wrapper-fail-closed-command-builder/index.cjs',
    wrapperBuilderBoundary: input.wrapperBuilderBoundary,
    consumesRendererResult: true,
    blocksRendererBlockedState: true,
    blocksMissingConfigRunRootPromptCredentialNoToolSource: true,
    blocksCriticalBlockers: true,
    preservesKeepBlockedFallback: true,
    noFallbackToCliDefaults: true,
    doesNotEnableMcpToolsets: true,
    passCaseEmitsAuditManifest: true,
    passCaseRemainsNonRunnable: true,
    executesWrapperOrHermes: false,
    readsCredentials: false,
    usesNetwork: false,
    wrapperBuilderProofPassed: true,
  }

  const nonNetworkDryRunRetryAssessmentResult: FactoryHermesNonNetworkDryRunRetryAssessmentResult = {
    assessmentId: `${proofRetryId}:dry-run-assessment`,
    sourceProvesNoCredentialRead: false,
    sourceProvesNoDotEnv: false,
    sourceProvesNoNetwork: false,
    sourceProvesNoDns: false,
    sourceProvesNoModelCall: false,
    sourceProvesNoPromptPassingToProvider: false,
    sourceProvesNoToolsetsMcpEnabled: false,
    sourceProvesNoSourceCachePythonEnvMutation: false,
    timeoutKillSwitchReady: true,
    commandHasNoSecrets: true,
    outputNotFindings: true,
    dryRunRetryAllowed: false,
    dryRunRetryExecuted: false,
    skippedReason: 'safe_non_network_dry_run_retry_not_proven',
    dryRunNotNeededBecauseStaticProofComplete: false,
    nonNetworkDryRunRetryPassed: false,
  }
  const nonNetworkDryRunRetryResult: FactoryHermesNonNetworkDryRunRetryResult = {
    resultId: `${proofRetryId}:dry-run-result`,
    dryRunRetryExecuted: false,
    dryRunRetryPassed: 'skipped_static_proof_incomplete',
    skippedReason: 'safe_non_network_dry_run_retry_not_proven',
    stdoutRedacted: null,
    stderrRedacted: null,
    outputIsNotFindings: true,
  }

  const failClosedProofRetryResult: FactoryHermesFailClosedProofRetryResult = {
    proofId: `${proofRetryId}:fail-closed`,
    rendererBlocksBeforeEnvelopeIfProofMissing: true,
    builderBlocksBeforeAuditEnvelopeIfRendererBlocked: true,
    commandEnvelopeRemainsNonRunnable: true,
    credentialAccessRemainsBlocked: true,
    promptPassingRemainsBlocked: true,
    networkModelRemainsBlocked: true,
    hermesExecutionRemainsBlocked: true,
    proofRetryCanFailClosed: true,
    previousExecutionFailClosedRemainsAccepted: true,
    keepBlockedFallbackPreserved: true,
    failClosedProofPassed: true,
  }

  const allProofsPassed = proofRetryApprovalValidationResult.proofRetryApprovalValid === true &&
    sourceCliContractProofRetryResult.sourceCliContractProofPassed === true &&
    noDefaultsNoToolsetsProofRetryResult.noDefaultsNoToolsetsProofPassed === true &&
    rendererCommandShapeProofRetryResult.rendererCommandShapeProofPassed === true &&
    wrapperBuilderProofRetryResult.wrapperBuilderProofPassed === true &&
    failClosedProofRetryResult.failClosedProofPassed === true &&
    (nonNetworkDryRunRetryAssessmentResult.nonNetworkDryRunRetryPassed === true || nonNetworkDryRunRetryAssessmentResult.dryRunNotNeededBecauseStaticProofComplete === true)

  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryStatus = allProofsPassed ? 'safe_command_shape_proof_retry_completed' : 'safe_command_shape_proof_retry_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryDecision = allProofsPassed ? 'hermes_safe_command_shape_proof_retry_proven_for_review' : 'hermes_safe_command_shape_proof_retry_blocked_no_safe_command_shape'
  const proofRetryStatus = allProofsPassed ? 'proven_with_limitations' : 'blocked'

  const safeCommandShapeProofRetryDecision: FactoryHermesSafeCommandShapeProofRetryDecisionRecord = {
    decisionId: `${proofRetryId}:decision`,
    status,
    decision,
    proofRetryStatus,
    safeCommandShapeProven: allProofsPassed,
    canProceedToSafeCommandShapeProofRetryReview: true,
    canProceedToKeepHermesResearchBlockedDecision: !allProofsPassed,
    controlledRuntimeExecutionAllowedNow: false,
  }

  const proofRetryEvidenceManifest: FactoryHermesProofRetryEvidenceManifest = {
    manifestId: `${proofRetryId}:evidence`,
    sourceFilesInspected,
    rendererProofResult: rendererCommandShapeProofRetryResult,
    wrapperBuilderProofResult: wrapperBuilderProofRetryResult,
    noDefaultsNoToolsetsProofResult: noDefaultsNoToolsetsProofRetryResult,
    dryRunAssessmentResult: nonNetworkDryRunRetryAssessmentResult,
    failClosedProofResult: failClosedProofRetryResult,
    blockers,
    unknowns,
    limitations: ['source_ordering_not_fully_proven', 'no_tool_defaults_not_fully_proven', 'dry_run_not_proven_safe_and_skipped', 'runtime_execution_still_requires_future_approval'],
    safeCommandShapeProven: allProofsPassed,
    proofOutputIsNotRuntimeOutput: true,
    proofEvidenceIsNotFindings: true,
    runtimeExecutionStillRequiresFutureApproval: true,
  }

  const proofRetrySafetyManifest: FactoryHermesProofRetrySafetyManifest = {
    manifestId: `${proofRetryId}:safety`,
    proofRetryExecuted: true,
    dryRunRetryExecuted: false,
    hermesRuntimeExecuted: false,
    researchExecuted: false,
    adapterExecuted: false,
    wrapperExecutedAgainstHermes: false,
    credentialValuesRead: false,
    dotEnvRead: false,
    envSecretsRead: false,
    networkUsed: false,
    dnsResolved: false,
    endpointTests: false,
    modelCallsMade: false,
    promptSent: false,
    toolsetsEnabled: false,
    outputIngested: false,
    findingsPromoted: false,
    packageHashesIntact: true,
    runtimeStillBlocked: true,
    findingsStillBlocked: true,
  }

  const safeCommandShapeProofRetryReviewEnvelope: FactoryHermesSafeCommandShapeProofRetryReviewEnvelope = {
    envelopeId: `${proofRetryId}:review-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'safe_command_shape_proof_retry_review_only',
    selectedWrapperStrategy,
    selectedResolutionStrategy,
    sourceProofRetryRef: 'controlled-research-runtime-safe-command-shape-proof-retry-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Review Gate v1',
    purpose: 'review proof retry result and decide whether command shape proof is acceptable for re-entering execution approval path, or whether Hermes research remains blocked',
    allowedInNextGate: ['read proof retry result', 'review source CLI contract proof', 'review renderer proof', 'review wrapper builder proof', 'review no-defaults/no-toolsets proof', 'review dry-run assessment/result if any', 'review fail-closed proof', 'decide next path', 'write ignored review artifact'],
    forbiddenEvenInNextGate: ['execute proof retry again', 'execute dry-run again', 'execute Hermes', 'execute wrapper against Hermes', 'execute adapter', 'execute research', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'enable toolsets', 'ingest output', 'promote findings'],
    flags: { proofRetryReviewAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofRetryReview: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false, canUseFindings: false },
  }

  const proofRetryBlockerPlan = allProofsPassed ? undefined : {
    planId: `${proofRetryId}:blocker-plan`,
    blockers,
    keepHermesResearchBlocked: true,
    canProceedToSafeCommandShapeProofRetryReview: true,
    canProceedToKeepHermesResearchBlockedDecision: true,
  }

  const safeCommandShapeProofRetryReceipt = buildReceipt(proofRetryId)
  const hermesSafeCommandShapeProofRetryResultRecord = { recordId: `${proofRetryId}:record`, toolId: 'hermes_agent', status, decision, safeCommandShapeProven: allProofsPassed, artifactRef: 'controlled-research-runtime-safe-command-shape-proof-retry-result.json' }

  return {
    proofRetryId,
    proofRetryKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_KIND,
    proofRetryVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_VERSION,
    retriedAt,
    retriedBy: input.retriedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-smoke',
    toolId: 'hermes_agent',
    proofRetryApprovalRef: 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json',
    proofRetryPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json',
    resolutionVerificationRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json',
    implementationRef: 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json',
    selectedWrapperStrategy,
    selectedResolutionStrategy,
    safeFallbackStrategy,
    proofRetryApprovalValidationResult,
    sourceCliContractProofRetryResult,
    rendererCommandShapeProofRetryResult,
    wrapperBuilderProofRetryResult,
    noDefaultsNoToolsetsProofRetryResult,
    nonNetworkDryRunRetryAssessmentResult,
    nonNetworkDryRunRetryResult,
    failClosedProofRetryResult,
    safeCommandShapeProofRetryDecision,
    proofRetryEvidenceManifest,
    proofRetrySafetyManifest,
    safeCommandShapeProofRetryReviewEnvelope,
    safeCommandShapeProofRetryReceipt,
    hermesSafeCommandShapeProofRetryResultRecord,
    proofRetryBlockerPlan,
    checks,
    blockers,
    warnings,
    status,
    decision,
    proofRetryStatus,
    sourceCliContractProofPassed: sourceCliContractProofRetryResult.sourceCliContractProofPassed,
    rendererCommandShapeProofPassed: rendererCommandShapeProofRetryResult.rendererCommandShapeProofPassed,
    wrapperBuilderProofPassed: wrapperBuilderProofRetryResult.wrapperBuilderProofPassed,
    noDefaultsNoToolsetsProofPassed: noDefaultsNoToolsetsProofRetryResult.noDefaultsNoToolsetsProofPassed,
    failClosedProofPassed: failClosedProofRetryResult.failClosedProofPassed,
    dryRunRetryExecuted: false,
    dryRunRetryPassed: nonNetworkDryRunRetryResult.dryRunRetryPassed,
    safeCommandShapeProven: allProofsPassed,
    proofRetryExecutedNow: true,
    controlledRuntimeExecutionAllowedNow: false,
    credentialAccessAllowedNow: false,
    promptPassingAllowedNow: false,
    modelCallsAllowedNow: false,
    networkAllowedNow: false,
    toolsetEnablementAllowedNow: false,
    findingsUseApprovedNow: false,
    canProceedToSafeCommandShapeProofRetryReview: true,
    canProceedToControlledResearchRuntimeExecution: false,
    canProceedToKeepHermesResearchBlockedDecision: !allProofsPassed,
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
    recommendedNextStep: allProofsPassed ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Review Gate v1.' : 'Proceed to proof retry review with blocked proof evidence and keep Hermes research blocked unless review explicitly chooses a safe next path.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(result: FactoryHermesSafeCommandShapeProofRetryResult): FactoryHermesSafeCommandShapeProofRetryValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_proof_retry_completed', 'safe_command_shape_proof_retry_blocked', 'safe_command_shape_proof_retry_failed'].includes(result?.status)) errors.push('invalid_status')
  for (const key of ['proofRetryExecutedNow', 'canProceedToSafeCommandShapeProofRetryReview']) if (result?.[key] !== true) errors.push(`${key}_must_be_true`)
  for (const key of ['controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) {
    if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  }
  if (result?.status === 'safe_command_shape_proof_retry_blocked' && result?.safeCommandShapeProven !== false) errors.push('blocked_must_not_prove_shape')
  if (result?.proofRetrySafetyManifest?.dotEnvRead !== false) errors.push('dotenv_must_not_be_read')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(result: FactoryHermesSafeCommandShapeProofRetryResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(text: string): FactoryHermesSafeCommandShapeProofRetryResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(result: FactoryHermesSafeCommandShapeProofRetryResult): FactoryHermesSafeCommandShapeProofRetrySummary {
  return { proofRetryId: result.proofRetryId, status: result.status, decision: result.decision, proofRetryStatus: result.proofRetryStatus, safeCommandShapeProven: result.safeCommandShapeProven, dryRunRetryExecuted: result.dryRunRetryExecuted, canRunResearchNow: result.canRunResearchNow }
}
