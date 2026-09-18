export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_KIND = 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_VERSION
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_KIND
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningInput = Record<string, any>
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningPolicy = Record<string, any>
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningStatus = 'alternate_safe_runtime_resolution_plan_created' | 'alternate_safe_runtime_resolution_plan_blocked'
export type FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningDecision = 'hermes_cli_blocked_alternate_safe_runtime_resolution_plan_created_for_approval' | 'alternate_safe_runtime_resolution_plan_blocked_no_viable_safe_runtime_strategy'
export type FactoryHermesCliBlockedPathReview = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeOptionCatalog = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeOptionEvaluation = Record<string, any>
export type FactoryHermesSelectedAlternateRuntimePath = Record<string, any>
export type FactoryHermesFactoryOwnedNoToolProviderAdapterPlan = Record<string, any>
export type FactoryHermesProviderDirectRuntimeBoundaryPlan = Record<string, any>
export type FactoryHermesPromptArtifactOutputContractPlan = Record<string, any>
export type FactoryHermesCredentialNetworkModelSafetyPlan = Record<string, any>
export type FactoryHermesNoToolEnforcementAndDetectionPlan = Record<string, any>
export type FactoryHermesRuntimeTimeoutKillSwitchPlan = Record<string, any>
export type FactoryHermesOutputReviewAndFindingsGatePlan = Record<string, any>
export type FactoryHermesAlternateRuntimeGovernanceRoadmap = Record<string, any>
export type FactoryHermesAlternateRuntimeResolutionPlanningRiskRegister = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionApprovalEnvelope = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningReceipt = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionPlanCandidate = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningBlockerPlan = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningBlocker = { blockerId: string, message: string }
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningWarning = { warningId: string, message: string }
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningResult = Record<string, any>
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesAlternateSafeRuntimeResolutionPlanningSummary = Record<string, any>

const selectedAlternateRuntimeStrategy = 'factory_owned_no_tool_model_provider_direct_research_adapter'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const riskIds = ['alternate_planning_confused_with_runtime_implementation', 'direct_provider_adapter_confused_with_safe_runtime', 'no_tool_by_construction_overclaimed', 'provider_call_added_too_early', 'credential_access_added_too_early', 'network_enabled_too_early', 'prompt_artifact_bypassed', 'output_contract_missing_or_ignored', 'raw_output_promoted_to_findings', 'tool_use_claims_ignored', 'Hermes_cli_unblocked_without_contract', 'mock_runtime_misread_as_real_research', 'keep_blocked_fallback_removed', 'runtime_execution_attempted_without_approval']

function add(checks: FactoryHermesAlternateSafeRuntimeResolutionPlanningCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function option(optionId: string, category: string, recommendation: string, extra: Record<string, any> = {}) {
  const forbidden = recommendation === 'forbidden'
  return {
    optionId,
    category,
    viableForPlanning: !forbidden,
    viableForImplementation: false,
    requiresHermesCli: optionId.startsWith('hermes') || optionId === 'direct_hermes_cli_retry',
    requiresHermesSourceMutation: optionId === 'require_upstream_hermes_cli_contract_change',
    requiresCredentialAccessNow: false,
    requiresNetworkNow: false,
    requiresModelCallNow: false,
    requiresPromptPassingNow: false,
    requiresToolsets: optionId.includes('toolsets') || optionId.includes('mcp'),
    canBeNoToolByConstruction: optionId.includes('no_tool') || optionId.includes('mock') || optionId === safeFallbackStrategy,
    canBeFailClosed: !forbidden,
    supportsOutputContract: optionId === selectedAlternateRuntimeStrategy || optionId.includes('mock'),
    supportsKillSwitch: optionId === selectedAlternateRuntimeStrategy || optionId.includes('mock'),
    supportsRedaction: optionId === selectedAlternateRuntimeStrategy || optionId.includes('mock'),
    residualRisks: forbidden ? ['unsafe_hermes_cli_dependency'] : ['future_gate_required_before_implementation_or_runtime'],
    recommendation,
    ...extra,
  }
}

export function evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanning(input: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningInput): FactoryHermesAlternateSafeRuntimeResolutionPlanningResult {
  const review = input.proofRetryReviewResult
  const retry = input.proofRetryResult
  const verification = input.resolutionVerificationResult
  const selection = input.runtimeSelectionDecisionResult
  const checks: FactoryHermesAlternateSafeRuntimeResolutionPlanningCheck[] = []
  const planningId = `hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning:75b300f:${input.plannedAt}`
  const runRoot = selection?.selectedRunRoot?.selectedRunRoot || ''
  const required = [
    add(checks, 'review_status', review?.status, 'safe_command_shape_proof_retry_review_completed'),
    add(checks, 'review_decision', review?.decision, 'hermes_safe_command_shape_proof_retry_review_accepted_blocked_no_safe_command_shape'),
    add(checks, 'review_accepted_blocked', review?.proofRetryReviewStatus, 'accepted_blocked'),
    add(checks, 'review_alternate_allowed', review?.canProceedToAlternateSafeRuntimeResolutionPlanning),
    add(checks, 'review_runtime_blocked', review?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'retry_blocked', retry?.status, 'safe_command_shape_proof_retry_blocked'),
    add(checks, 'retry_safe_shape_false', retry?.safeCommandShapeProven, false),
    add(checks, 'retry_runtime_blocked', retry?.canProceedToControlledResearchRuntimeExecution, false),
    add(checks, 'verification_status', verification?.status, 'safe_command_shape_resolution_verification_completed'),
    add(checks, 'verification_renderer', verification?.rendererVerified),
    add(checks, 'verification_wrapper', verification?.wrapperBuilderVerified),
    add(checks, 'verification_readiness', verification?.proofRetryReadinessVerified),
    add(checks, 'selection_provider', selection?.selectedProvider?.providerId, 'openai'),
    add(checks, 'selection_model', selection?.selectedModel?.modelId, 'gpt-4o-mini'),
    add(checks, 'selection_credential_ref', selection?.selectedCredentialRef?.credentialRefName, 'OPENAI_API_KEY'),
    add(checks, 'selection_host', selection?.selectedNetworkHosts?.selectedHosts?.[0], 'api.openai.com'),
    add(checks, 'selection_run_root_codex_temp', typeof runRoot === 'string' && runRoot.startsWith('.codex-temp')),
  ]
  const accepted = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningStatus = accepted ? 'alternate_safe_runtime_resolution_plan_created' : 'alternate_safe_runtime_resolution_plan_blocked'
  const decision: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningDecision = accepted ? 'hermes_cli_blocked_alternate_safe_runtime_resolution_plan_created_for_approval' : 'alternate_safe_runtime_resolution_plan_blocked_no_viable_safe_runtime_strategy'
  const blockers = accepted ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Alternate runtime planning check failed: ${check.checkId}` }))
  const options = [
    { optionId: selectedAlternateRuntimeStrategy, category: 'preferred_factory_owned_runtime', description: 'Factory-owned adapter that calls provider/model directly in a future controlled runtime without Hermes CLI, toolsets, or MCP.', risk: 'medium', benefit: 'eliminates hidden Hermes CLI defaults', requiresFutureImplementation: true, requiresFutureCredentialApproval: true, requiresFutureNetworkApproval: true, requiresFutureOutputReview: true },
    { optionId: 'factory_owned_mock_only_research_runtime', category: 'safe_mock_runtime', description: 'Mock runtime for E2E without credentials, network, or model.', risk: 'low', benefit: 'tests flow without cost or provider', limitation: 'no real research' },
    { optionId: safeFallbackStrategy, category: 'safe_fallback', description: 'Keep Hermes research disabled.', risk: 'low', benefit: 'maximum safety', limitation: 'no real runtime' },
    { optionId: 'require_upstream_hermes_cli_contract_change', category: 'upstream_dependency', description: 'Do not use Hermes until an explicit no-tool CLI contract exists.', risk: 'medium', limitation: 'depends on third party' },
    { optionId: 'direct_hermes_cli_retry', category: 'forbidden', reason: 'safe command shape not proven' },
    { optionId: 'hermes_cli_with_no_mcp_only', category: 'forbidden', reason: 'does not disable toolsets/defaults' },
    { optionId: 'hermes_cli_omit_toolsets', category: 'forbidden', reason: 'hidden defaults' },
    { optionId: 'hermes_cli_no_toolsets_text_only', category: 'forbidden', reason: 'policy label is not proven syntax' },
  ]
  const evaluations = [
    option(selectedAlternateRuntimeStrategy, 'preferred_factory_owned_runtime', 'preferred'),
    option('factory_owned_mock_only_research_runtime', 'safe_mock_runtime', 'supporting'),
    option(safeFallbackStrategy, 'safe_fallback', 'fallback'),
    option('require_upstream_hermes_cli_contract_change', 'upstream_dependency', 'supporting'),
    option('direct_hermes_cli_retry', 'forbidden', 'forbidden'),
    option('hermes_cli_with_no_mcp_only', 'forbidden', 'forbidden'),
    option('hermes_cli_omit_toolsets', 'forbidden', 'forbidden'),
    option('hermes_cli_no_toolsets_text_only', 'forbidden', 'forbidden'),
  ]
  const hermesCliBlockedPathReview: FactoryHermesCliBlockedPathReview = { hermesCliPathReviewed: true, safeCommandShapeStillNotProven: true, sourceCliContractUnproven: true, noDefaultsNoToolsetsUnproven: true, hiddenDefaultsRiskAccepted: true, mcpToolsetsRiskAccepted: true, rendererBuilderInsufficientForHermesRuntime: true, proofRetryBlockedAccepted: true, hermesCliRuntimeBlocked: true, hermesResearchMustRemainDisabled: true, conclusion: 'Hermes CLI must not be used for real runtime, must not be retried on the same path, and remains blocked unless a future explicit contract change is approved.' }
  const alternateSafeRuntimeOptionCatalog: FactoryHermesAlternateSafeRuntimeOptionCatalog = { options }
  const alternateSafeRuntimeOptionEvaluation: FactoryHermesAlternateSafeRuntimeOptionEvaluation = { evaluations, preferredOptionId: selectedAlternateRuntimeStrategy }
  const selectedAlternateRuntimePath: FactoryHermesSelectedAlternateRuntimePath = { primary: selectedAlternateRuntimeStrategy, supporting: ['factory_owned_mock_only_research_runtime', safeFallbackStrategy, 'require_upstream_hermes_cli_contract_change'], futureRoadmap: ['Alternate Safe Runtime Resolution Approval Gate', 'Alternate Runtime Implementation Planning Gate', 'Alternate Runtime Implementation Approval Gate', 'Alternate Runtime Implementation Gate', 'Alternate Runtime Verification Planning Gate', 'Alternate Runtime Verification Approval Gate', 'Alternate Runtime Verification Gate', 'Mock E2E Planning/Approval/Execution path', 'Real provider runtime planning/approval/execution path only after mock/verification', 'Output ingestion/review/findings chain'], noImplementationNow: true, noRuntimeNow: true, noCredentialsNow: true, noNetworkNow: true, noFindingsNow: true, hermesCliBlocked: true }
  const factoryOwnedNoToolProviderAdapterPlan: FactoryHermesFactoryOwnedNoToolProviderAdapterPlan = { factoryOwnedCode: true, noHermesCli: true, noMcp: true, noToolsets: true, noToolRegistry: true, noBrowser: true, noFileSystemTools: true, noShellTools: true, noExternalTools: true, promptInApprovedArtifactOnly: true, outputContractRequired: true, providerModelHostRefsOnlyUntilFinalRuntimeGate: true, credentialRefOnlyUntilFinalRuntimeGate: true, strictRedaction: true, boundedOutput: true, singleRequestOnly: true, timeoutKillSwitch: true, rawOutputNeverFindings: true, findingsOnlyAfterIngestionReviewGate: true, proposedFutureModules: ['src/factory/controlled-research-runtime-provider-direct-adapter/', 'electron/factory/controlled-research-runtime-provider-direct-adapter/', 'scripts/factory-controlled-research-runtime-provider-direct-adapter-smoke.mjs', 'docs/factory/CONTROLLED_RESEARCH_RUNTIME_PROVIDER_DIRECT_ADAPTER_V1.md'], filesCreatedNow: false }
  const providerDirectRuntimeBoundaryPlan: FactoryHermesProviderDirectRuntimeBoundaryPlan = { provider: 'openai', model: 'gpt-4o-mini', hostAllowlist: ['api.openai.com'], noProviderCallNow: true, noNetworkNow: true, noDnsNow: true, credentialRefOnly: 'OPENAI_API_KEY', runtimeRequestOnlyInFutureExecutionGate: true, failClosedIf: ['prompt not approved', 'output contract missing', 'credential ref missing', 'network host not allowlisted', 'model/provider mismatch', 'tool use requested', 'tool use appears in output', 'response exceeds bounds', 'secret scan fails'] }
  const promptArtifactOutputContractPlan: FactoryHermesPromptArtifactOutputContractPlan = { promptMustBeStaticApprovedArtifact: true, promptMustHaveHash: true, promptMustHaveSafeSummary: true, promptContainsNoSecrets: true, promptRequestsNoTools: true, promptSpecifiesValidJsonOutputContract: true, outputSchemaValidationRequired: true, rawOutputStoredUnderCodexTemp: true, outputRedactedBeforeReview: true, outputNotFindings: true, invalidJsonBlocksFindings: true, timeoutFailureBlocksFindings: true }
  const credentialNetworkModelSafetyPlan: FactoryHermesCredentialNetworkModelSafetyPlan = { noCredentialAccessNow: true, noEnvReadNow: true, noDotEnv: true, futureCredentialAccessOnlyInFinalRuntimeGate: true, futureCredentialSourceOnly: 'process.env.OPENAI_API_KEY', neverLogCredential: true, neverPersistCredential: true, neverIncludeCredentialInArtifacts: true, futureNetworkOnlyToAllowlistedHost: 'api.openai.com', futureDnsOnlyInsideFinalRuntimeGate: true, futureModelCallSingleRequestOnly: true, timeoutAndOutputBoundsRequired: true, postRunSecretAuditRequired: true }
  const noToolEnforcementAndDetectionPlan: FactoryHermesNoToolEnforcementAndDetectionPlan = { noToolsByConstruction: true, noToolRegistry: true, noToolChoiceEnablingTools: true, noFunctionToolDefinitions: true, noBrowserFilesShellMcp: true, promptForbidsToolUse: true, requestBuilderRefusesToolDeclarations: true, outputDetectorFlagsToolUseClaims: true, anyToolUseClaimBlocksFindings: true, anyToolCallMetadataBlocksFindings: true, adapterEmitsNoToolEvidence: true }
  const runtimeTimeoutKillSwitchPlan: FactoryHermesRuntimeTimeoutKillSwitchPlan = { maxRuntimeSeconds: 20, noOutputTimeoutSeconds: 10, abortCancellationSignal: true, singleRequestOnly: true, outputByteLimit: 65536, failureStateBlocksFindings: true, timeoutStateBlocksFindings: true, retryDisabledByDefault: true }
  const outputReviewAndFindingsGatePlan: FactoryHermesOutputReviewAndFindingsGatePlan = { outputCapture: true, redaction: true, schemaValidation: true, noToolEvidenceReview: true, secretScan: true, safetyClassification: true, ingestionReviewGate: true, findingsReviewGate: true, noAutomaticFindings: true, failedOrTimeoutOutputNeverFindings: true }
  const alternateRuntimeGovernanceRoadmap: FactoryHermesAlternateRuntimeGovernanceRoadmap = { futureGates: ['Alternate Safe Runtime Resolution Approval Gate', 'Alternate Runtime Implementation Planning Gate', 'Alternate Runtime Implementation Approval Gate', 'Alternate Runtime Implementation Gate', 'Alternate Runtime Verification Planning Gate', 'Alternate Runtime Verification Approval Gate', 'Alternate Runtime Verification Gate', 'Mock E2E Runtime Planning/Approval/Execution/Review', 'Provider Runtime Planning/Approval/Execution/Review', 'Output Ingestion Planning/Approval/Ingestion/Review', 'Findings Review', 'Release/QA gates'], hermesCliRemainsBlocked: true, noRealProviderExecutionUntilExplicitFinalProviderRuntimeGate: true, noCommitPushUntilUserSaysExactPhrase: 'cerramos la etapa' }
  const alternateRuntimeResolutionPlanningRiskRegister: FactoryHermesAlternateRuntimeResolutionPlanningRiskRegister = { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('runtime_execution') || riskId.includes('provider_call') ? 'high' : 'medium', disposition: ['accepted_for_alternate_runtime_planning_only', 'blocks_implementation', 'blocks_runtime_execution', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: 'Keep this artifact as planning only; require explicit approval, implementation, verification, runtime, output review, and findings gates before use.', blocksPlanning: false, blocksImplementation: !riskId.includes('planning_confused'), blocksRuntimeExecution: true, blocksFindingsUse: true })) }
  const alternateSafeRuntimeResolutionApprovalEnvelope: FactoryHermesAlternateSafeRuntimeResolutionApprovalEnvelope | undefined = accepted ? { envelopeId: `${planningId}:approval-envelope`, toolId: 'factory_controlled_research_runtime', approvedFor: 'alternate_safe_runtime_resolution_approval_only', selectedAlternateRuntimeStrategy, safeFallbackStrategy, sourceAlternatePlanningRef: 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json', sourceProofRetryReviewRef: 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Approval Gate v1', purpose: 'approve or block the alternate Factory-owned no-tool provider-direct research runtime resolution path while keeping Hermes CLI blocked', allowedInNextGate: ['read alternate planning result', 'read proof retry review result', 'review Hermes CLI blocked path', 'review option catalog/evaluation', 'review selected alternate runtime path', 'review provider-direct adapter plan', 'review prompt/output contract plan', 'review credential/network/model safety plan', 'review no-tool enforcement plan', 'decide whether implementation planning may proceed', 'write ignored approval artifact'], forbiddenEvenInNextGate: ['implement alternate adapter', 'execute runtime', 'execute Hermes', 'execute research', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'pass prompt', 'enable tools', 'ingest output', 'promote findings', 'mutate Hermes source', 'modify package.json', 'modify package-lock.json', 'modify UI/preload/App', 'run uv/pip/python/setup.py'], flags: { alternateSafeRuntimeResolutionApprovalAllowedNow: true, alternateSafeRuntimeImplementationAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, networkAllowedNow: false, modelCallsAllowedNow: false, findingsUseApprovedNow: false, canProceedToAlternateSafeRuntimeResolutionApproval: true, canProceedToAlternateSafeRuntimeImplementation: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Approval Gate v1' } : undefined
  const receipt: FactoryHermesAlternateSafeRuntimeResolutionPlanningReceipt = { receiptId: `${planningId}:receipt`, planningOnly: true, alternateAdapterImplemented: false, runtimeExecuted: false, researchExecuted: false, adapterExecuted: false, hermesExecuted: false, hermesExeExecuted: false, oneshotExecuted: false, wrapperExecutedAgainstHermes: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, dotEnvRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false, uvPipPythonSetupExecuted: false }
  const planBuilt = accepted
  return { planningId, planningKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_KIND, planningVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'factory_controlled_research_runtime', proofRetryReviewRef: 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json', proofRetryRef: 'controlled-research-runtime-safe-command-shape-proof-retry-result.json', resolutionVerificationRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json', runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json', hermesCliBlockedPathReview, alternateSafeRuntimeOptionCatalog, alternateSafeRuntimeOptionEvaluation, selectedAlternateRuntimePath, factoryOwnedNoToolProviderAdapterPlan, providerDirectRuntimeBoundaryPlan, promptArtifactOutputContractPlan, credentialNetworkModelSafetyPlan, noToolEnforcementAndDetectionPlan, runtimeTimeoutKillSwitchPlan, outputReviewAndFindingsGatePlan, alternateRuntimeGovernanceRoadmap, alternateRuntimeResolutionPlanningRiskRegister, alternateSafeRuntimeResolutionApprovalEnvelope, alternateSafeRuntimeResolutionPlanningReceipt: receipt, hermesAlternateSafeRuntimeResolutionPlanCandidate: { candidateId: selectedAlternateRuntimeStrategy, status: accepted ? 'selected_for_approval' : 'blocked', implementationNow: false, runtimeNow: false }, alternateRuntimeResolutionPlanningBlockerPlan: accepted ? undefined : { planId: `${planningId}:blocker-plan`, blockers, selectedFallback: safeFallbackStrategy, canProceedToKeepHermesResearchBlockedDecision: true }, checks, blockers, warnings: riskIds.map((warningId) => ({ warningId, message: warningId })), status, decision, alternateRuntimeResolutionPlanningStatus: accepted ? 'plan_candidate_created' : 'blocked', hermesCliRuntimeBlocked: true, selectedAlternateRuntimeStrategy: accepted ? selectedAlternateRuntimeStrategy : safeFallbackStrategy, safeFallbackStrategy, proofRetryReviewAcceptedForAlternatePlanning: accepted, hermesCliBlockedPathReviewBuilt: planBuilt, alternateRuntimeOptionCatalogBuilt: planBuilt, alternateRuntimeOptionEvaluationBuilt: planBuilt, selectedAlternateRuntimePathBuilt: planBuilt, factoryOwnedNoToolProviderAdapterPlanBuilt: planBuilt, providerDirectRuntimeBoundaryPlanBuilt: planBuilt, promptArtifactOutputContractPlanBuilt: planBuilt, credentialNetworkModelSafetyPlanBuilt: planBuilt, noToolEnforcementAndDetectionPlanBuilt: planBuilt, runtimeKillSwitchPlanBuilt: planBuilt, outputReviewAndFindingsGatePlanBuilt: planBuilt, governanceRoadmapPlanBuilt: planBuilt, alternateRuntimeResolutionApprovalEnvelopeBuilt: Boolean(alternateSafeRuntimeResolutionApprovalEnvelope), alternateRuntimeImplementedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToAlternateSafeRuntimeResolutionApproval: accepted, canProceedToAlternateSafeRuntimeImplementation: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: true, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Approval Gate v1.' : 'Keep Hermes research blocked; no viable alternate safe runtime strategy was approved for planning.' }
}

export function validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningInput(input: FactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningInput): FactoryHermesAlternateSafeRuntimeResolutionPlanningValidationResult {
  const errors: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt_required')
  if (!input?.plannedBy) errors.push('plannedBy_required')
  if (!input?.proofRetryReviewResult) errors.push('proofRetryReviewResult_required')
  if (!input?.proofRetryResult) errors.push('proofRetryResult_required')
  if (!input?.resolutionVerificationResult) errors.push('resolutionVerificationResult_required')
  if (!input?.runtimeSelectionDecisionResult) errors.push('runtimeSelectionDecisionResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(result: FactoryHermesAlternateSafeRuntimeResolutionPlanningResult): FactoryHermesAlternateSafeRuntimeResolutionPlanningValidationResult {
  const errors: string[] = []
  if (!['alternate_safe_runtime_resolution_plan_created', 'alternate_safe_runtime_resolution_plan_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.hermesCliRuntimeBlocked !== true) errors.push('hermes_cli_must_remain_blocked')
  for (const key of ['alternateRuntimeImplementedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeImplementation', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(result: FactoryHermesAlternateSafeRuntimeResolutionPlanningResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(text: string): FactoryHermesAlternateSafeRuntimeResolutionPlanningResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(result: FactoryHermesAlternateSafeRuntimeResolutionPlanningResult): FactoryHermesAlternateSafeRuntimeResolutionPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, selectedAlternateRuntimeStrategy: result.selectedAlternateRuntimeStrategy, canProceedToAlternateSafeRuntimeResolutionApproval: result.canProceedToAlternateSafeRuntimeResolutionApproval, canRunResearchNow: result.canRunResearchNow }
}
