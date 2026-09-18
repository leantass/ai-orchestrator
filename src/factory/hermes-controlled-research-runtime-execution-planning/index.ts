export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_KIND = 'factory-hermes-controlled-research-runtime-execution-planning'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeExecutionPlanningVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_VERSION
export type FactoryHermesControlledResearchRuntimeExecutionPlanningKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_KIND
export type FactoryHermesControlledResearchRuntimeExecutionPlanningStatus = 'controlled_research_runtime_execution_plan_created' | 'controlled_research_runtime_execution_plan_blocked'
export type FactoryHermesControlledResearchRuntimeExecutionPlanningDecision = 'hermes_controlled_research_runtime_execution_plan_created_for_approval' | 'hermes_controlled_research_runtime_execution_plan_blocked_unsafe_or_incomplete'
export type FactoryHermesControlledResearchRuntimeExecutionPlanningInput = { plannedAt: string, plannedBy: string, liveArtifactVerificationReviewResult?: any, liveArtifactVerificationResult?: any, liveArtifactCreationResult?: any, researchRuntimeAdapterResult?: any, runtimeSelectionDecisionResult?: any }
export type FactoryHermesControlledResearchRuntimeExecutionPlanningPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', runtimeExecutionAllowedNow: false }
export type FactoryHermesRuntimeCommandEnvelopePlan = any
export type FactoryHermesPromptArtifactPlan = any
export type FactoryHermesCredentialAccessExecutionPlan = any
export type FactoryHermesModelNetworkExecutionPlan = any
export type FactoryHermesToolsetDisableProofExecutionPlan = any
export type FactoryHermesTimeoutKillSwitchExecutionPlan = any
export type FactoryHermesOutputIngestionReviewPlan = any
export type FactoryHermesRuntimeExecutionSafetyPlan = any
export type FactoryHermesExecutionPlanningRiskRegister = any
export type FactoryHermesControlledRuntimeExecutionApprovalEnvelope = any
export type FactoryHermesControlledResearchRuntimeExecutionPlanningReceipt = any
export type FactoryHermesControlledResearchRuntimeExecutionPlanCandidate = any
export type FactoryHermesControlledResearchRuntimeExecutionPlanningCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesControlledResearchRuntimeExecutionPlanningBlocker = { blockerId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionPlanningWarning = { warningId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionPlanningResult = any
export type FactoryHermesControlledResearchRuntimeExecutionPlanningValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesControlledResearchRuntimeExecutionPlanningSummary = { planningId: string, status: string, decision: string, canProceedToControlledResearchRuntimeExecutionApproval: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const provider = 'openai'
const model = 'gpt-4o-mini'
const credentialRef = 'OPENAI_API_KEY'
const host = 'api.openai.com'
const falseFlags = ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const riskIds = ['execution_planning_confused_with_runtime_execution', 'future_command_envelope_accidentally_runnable', 'prompt_created_or_sent_too_early', 'credential_value_read_too_early', 'network_enabled_too_early', 'model_called_too_early', 'toolsets_enabled_too_early', 'hidden_defaults_loaded_in_real_runtime', 'tool_usage_not_detected_in_output', 'timeout_kill_switch_not_applied', 'raw_output_ingested_without_review', 'findings_used_without_ingestion_review', 'verified_artifacts_changed_before_execution', 'run_result_written_outside_codex_temp']

function addCheck(checks: FactoryHermesControlledResearchRuntimeExecutionPlanningCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function getProvider(selection: any): string | undefined { return selection?.selectedProvider?.providerId ?? selection?.runtimeSelectionDecisionRecord?.provider?.providerId }
function getModel(selection: any): string | undefined { return selection?.selectedModel?.modelId ?? selection?.runtimeSelectionDecisionRecord?.model?.modelId }
function getCredentialRef(selection: any): string | undefined { return selection?.selectedCredentialRef?.credentialRefName ?? selection?.runtimeSelectionDecisionRecord?.credential?.credentialRefName }
function getHost(selection: any): string | undefined { return selection?.selectedNetworkHosts?.selectedHosts?.[0] ?? selection?.runtimeSelectionDecisionRecord?.network?.selectedHosts?.[0] }
function getRunRoot(selection: any): string { return selection?.selectedRunRoot?.selectedRunRoot ?? selection?.runtimeSelectionDecisionRecord?.runRoot?.selectedRunRoot ?? '' }

function buildRiskRegister(planningId: string) {
  return {
    registerId: `${planningId}:risk-register`,
    risks: riskIds.map((riskId) => ({
      riskId,
      severity: riskId.includes('accidentally') || riskId.includes('credential') || riskId.includes('network') ? 'high' : 'medium',
      disposition: 'accepted_for_execution_approval_only',
      blocksRuntimeExecutionDisposition: 'blocks_runtime_execution',
      blocksResearchExecutionDisposition: 'blocks_research_execution',
      futureGateDisposition: 'requires_future_gate_control',
      mitigation: 'Require the execution approval gate to review all prompt, credential, model, network, toolset, timeout, output, and artifact-integrity controls before any final runtime gate.',
      blocksExecutionPlanning: false,
      blocksExecutionApproval: false,
      blocksRuntimeExecution: true,
      blocksResearchExecution: true,
    })),
  }
}

export function evaluateFactoryHermesControlledResearchRuntimeExecutionPlanning(input: FactoryHermesControlledResearchRuntimeExecutionPlanningInput): FactoryHermesControlledResearchRuntimeExecutionPlanningResult {
  const review = input.liveArtifactVerificationReviewResult
  const verification = input.liveArtifactVerificationResult
  const adapter = input.researchRuntimeAdapterResult
  const selection = input.runtimeSelectionDecisionResult
  const checks: FactoryHermesControlledResearchRuntimeExecutionPlanningCheck[] = []
  const planningId = `hermes-controlled-research-runtime-execution-planning:75b300f:${input.plannedAt}`
  const runRoot = getRunRoot(selection)
  const requiredChecks = [
    addCheck(checks, 'review_status', review?.status, 'controlled_research_runtime_live_artifact_verification_review_completed'),
    addCheck(checks, 'review_decision', review?.decision, 'hermes_controlled_research_runtime_live_artifact_verification_review_accepted_for_execution_planning'),
    addCheck(checks, 'review_status_limitations', review?.liveArtifactVerificationReviewStatus, 'accepted_with_limitations'),
    addCheck(checks, 'review_strategy', review?.selectedWrapperStrategy, selectedWrapperStrategy),
    addCheck(checks, 'review_accepts_live_artifacts', review?.liveArtifactVerificationAccepted),
    addCheck(checks, 'review_allows_planning', review?.canProceedToControlledResearchRuntimeExecutionPlanning),
    addCheck(checks, 'review_blocks_execution', review?.canProceedToControlledResearchRuntimeExecution, false),
    addCheck(checks, 'review_blocks_research', review?.canRunResearchNow, false),
    addCheck(checks, 'verification_status', verification?.status, 'controlled_research_runtime_live_artifacts_verified'),
    addCheck(checks, 'verification_decision', verification?.decision, 'hermes_controlled_research_runtime_live_artifacts_verified_for_review'),
    addCheck(checks, 'verification_limitations', verification?.liveArtifactVerificationStatus, 'verified_with_limitations'),
    addCheck(checks, 'verification_config_exists', verification?.liveTempConfigExists),
    addCheck(checks, 'verification_manifest_exists', verification?.liveRunManifestExists),
    addCheck(checks, 'verification_directory_inventory', verification?.directoryInventoryPassed ?? verification?.liveArtifactDirectoryInventoryVerificationResult?.passed),
    addCheck(checks, 'verification_no_prompt', verification?.noPromptBodyDetected),
    addCheck(checks, 'verification_no_credentials', verification?.noCredentialValuesDetected),
    addCheck(checks, 'verification_no_network', verification?.noNetworkEvidence),
    addCheck(checks, 'verification_no_toolsets', verification?.noToolsetEnablementEvidence),
    addCheck(checks, 'adapter_status', adapter?.status, 'research_runtime_adapter_prepared'),
    addCheck(checks, 'adapter_prepared_code_only', adapter?.adapterStatus, 'prepared_code_only_not_executed'),
    addCheck(checks, 'adapter_wrapper_boundary', adapter?.wrapperBoundaryIntegrated),
    addCheck(checks, 'adapter_envelope', adapter?.adapterCommandEnvelopeBuilt),
    addCheck(checks, 'adapter_safety', adapter?.adapterSafetyManifestBuilt),
    addCheck(checks, 'adapter_not_allowed_now', adapter?.runtimeAdapterExecutionAllowedNow, false),
    addCheck(checks, 'adapter_blocks_research', adapter?.canRunResearchNow, false),
    addCheck(checks, 'selection_provider', getProvider(selection), provider),
    addCheck(checks, 'selection_model', getModel(selection), model),
    addCheck(checks, 'selection_credential_ref', getCredentialRef(selection), credentialRef),
    addCheck(checks, 'selection_host', getHost(selection), host),
    addCheck(checks, 'selection_run_root_codex_temp', runRoot.startsWith('.codex-temp')),
  ]
  const blockers = requiredChecks.every(Boolean) ? [] : checks.filter((item) => !item.passed).map((item) => ({ blockerId: item.checkId, message: `Execution planning check failed: ${item.checkId}` }))
  const accepted = blockers.length === 0
  const status: FactoryHermesControlledResearchRuntimeExecutionPlanningStatus = accepted ? 'controlled_research_runtime_execution_plan_created' : 'controlled_research_runtime_execution_plan_blocked'
  const decision: FactoryHermesControlledResearchRuntimeExecutionPlanningDecision = accepted ? 'hermes_controlled_research_runtime_execution_plan_created_for_approval' : 'hermes_controlled_research_runtime_execution_plan_blocked_unsafe_or_incomplete'
  const runtimeCommandEnvelopePlan = { planId: `${planningId}:runtime-command-envelope-plan`, selectedWrapperStrategy, commandEnvelopeType: 'future_controlled_runtime_command_envelope', commandEnvelopeAllowedNow: false, executableCommandBuiltNow: false, commandString: null, argv: [], env: {}, prompt: null, credentialValue: null, runtimeExecutionAllowedNow: false, hermesExecutionAllowedNow: false, wrapperExecutionAllowedNow: false, adapterExecutionAllowedNow: false, researchExecutionAllowedNow: false, futureCommandEnvelopeRequiresApproval: true, futureCommandMustReferenceVerifiedConfig: true, futureCommandMustReferenceVerifiedRunManifest: true, futureCommandMustUseWrapperBoundary: true, futureCommandMustNotUseDirectCliDefaults: true, futureCommandMustFailIfToolsetsNotProvenDisabled: true, note: 'This gate does not build an executable command.' }
  const promptArtifactPlan = { planId: `${planningId}:prompt-artifact-plan`, promptArtifactAllowedNow: false, promptPassingAllowedNow: false, promptCreatedNow: false, promptSentNow: false, plannedPromptKind: 'first_controlled_research_prompt', futurePromptArtifactRequiresApproval: true, futurePromptMustBeStaticOrApprovedArtifact: true, futurePromptMustHaveOutputContract: true, futurePromptMustHaveNoSecrets: true, futurePromptMustHaveNoToolInstructionsOutsidePolicy: true, futurePromptMustBeReferencedByHashOrSafeSummaryBeforeRuntime: true, futurePromptMustBeDeniedIfUnsafe: true }
  const credentialAccessExecutionPlan = { planId: `${planningId}:credential-access-execution-plan`, credentialRef, credentialAccessAllowedNow: false, credentialValuesReadNow: false, envSecretReadAllowedNow: false, dotEnvReadAllowedNow: false, futureCredentialAccessRequiresApproval: true, futureCredentialAccessMustUseRefOnlyUntilFinalRuntimeGate: true, futureCredentialAccessMustNotLogValue: true, futureCredentialAccessMustNotWriteValueToArtifact: true, futureCredentialAccessMustNotDumpEnv: true, futureCredentialAccessMustBeScopedToProviderHost: host, futureCredentialAccessMustHaveRedactionPolicy: true, futureCredentialAccessMustHavePostRunSecretAudit: true }
  const modelNetworkExecutionPlan = { planId: `${planningId}:model-network-execution-plan`, provider, model, host, modelCallsAllowedNow: false, networkAllowedNow: false, dnsAllowedNow: false, endpointTestsAllowedNow: false, futureModelCallRequiresApproval: true, futureNetworkUseRequiresApproval: true, futureDnsResolutionRequiresApproval: true, futureEndpointAllowlistRequired: true, allowedFutureHost: host, futureTimeoutRequired: true, futureRetryPolicyRequired: true, futureRateLimitRequired: true, futureKillSwitchRequired: true, hostReferencedButNotTested: true }
  const toolsetDisableProofExecutionPlan = { planId: `${planningId}:toolset-disable-proof-execution-plan`, selectedWrapperStrategy, toolsetEnablementAllowedNow: false, directNoToolsetsTextOnlyRejected: true, directHermesCliDefaultsForbidden: true, noMcpInsufficientAlone: true, hiddenDefaultsRiskCarriedForward: true, futureRuntimeMustUseVerifiedLiveConfig: true, futureRuntimeMustUseWrapperBoundary: true, futureRuntimeMustFailIfToolsetsCannotBeProvenDisabled: true, futureRuntimeMustFailIfDefaultToolsetsLoad: true, futureRuntimeMustFailIfMcpEnabled: true, futureRuntimeMustFailIfAnyToolUsageAppearsInOutput: true, futureToolUsageDetectorRequired: true, runtimeNoToolModeStillNotProvenByRealExecution: true }
  const timeoutKillSwitchExecutionPlan = { planId: `${planningId}:timeout-kill-switch-execution-plan`, runtimeTimeoutPlanned: true, timeoutAppliedNow: false, processCreatedNow: false, maxRuntimeSeconds: 60, noOutputTimeoutSeconds: 20, killSwitchRequired: true, cancellationSignalRequired: true, processTreeKillRequiredIfProcessExistsInFuture: true, runawayOutputLimitRequired: true, maxStdoutBytes: 200000, maxStderrBytes: 100000, timeoutMustBlockFindings: true, failureMustBlockFindings: true, futureRuntimeMustEmitTimeoutStatus: true }
  const outputIngestionReviewPlan = { planId: `${planningId}:output-ingestion-review-plan`, outputIngestionAllowedNow: false, findingsUseAllowedNow: false, futureOutputIngestionRequiresApproval: true, futureOutputMustHaveContract: true, futureOutputMustBeStoredUnderCodexTemp: true, futureOutputMustBeRedacted: true, futureOutputMustBeBounded: true, futureOutputMustBeClassifiedBeforeUse: true, futureFindingsRequireReviewGate: true, rawOutputMustNotBePromotedToFindingsAutomatically: true, failedRunOutputMustNotBeUsedAsFindings: true, timeoutOutputMustNotBeUsedAsFindings: true, toolUsageOutputMustBlockFindings: true }
  const runtimeExecutionSafetyPlan = { planId: `${planningId}:runtime-execution-safety-plan`, executionSafetyPlanned: true, runtimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, adapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, wrapperExecutionAllowedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, futureExecutionMustBeSingleRun: true, futureExecutionMustUseKillSwitch: true, futureExecutionMustUseVerifiedArtifacts: true, futureExecutionMustHavePreflightImmediatelyBeforeRun: true, futureExecutionMustFailClosed: true, futureExecutionMustWriteRunResultUnderCodexTemp: true, futureExecutionMustNotMutateHermesSource: true, futureExecutionMustNotModifyPackageFiles: true }
  const controlledRuntimeExecutionApprovalEnvelope = accepted ? { envelopeId: `${planningId}:execution-approval-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_execution_approval_only', selectedWrapperStrategy, sourceExecutionPlanningRef: 'controlled-research-runtime-execution-planning-result.json', sourceLiveArtifactVerificationReviewRef: 'controlled-research-runtime-live-artifact-verification-review-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Execution Approval Gate v1', purpose: 'approve or block future controlled Hermes runtime execution after reviewing execution plan, verified artifacts, prompt/credential/model/network/toolset safety and output handling', allowedInNextGate: ['read controlled-research-runtime-execution-planning-result.json', 'read live artifact verification review result', 'review runtime command envelope plan', 'review prompt artifact plan', 'review credential access execution plan', 'review model/network execution plan', 'review toolset disable proof execution plan', 'review timeout/kill switch plan', 'review output ingestion review plan', 'decide whether to proceed to final execution gate', 'write ignored approval artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'pass prompt to Hermes', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets', 'execute research', 'ingest real output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { controlledRuntimeExecutionApprovalAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimeExecutionApproval: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Execution Approval Gate v1' } : undefined
  return { planningId, planningKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_KIND, planningVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', liveArtifactVerificationReviewRef: 'controlled-research-runtime-live-artifact-verification-review-result.json', liveArtifactVerificationRef: 'controlled-research-runtime-live-artifact-verification-result.json', researchRuntimeAdapterRef: 'research-runtime-adapter-result.json', runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json', selectedWrapperStrategy, runtimeCommandEnvelopePlan, promptArtifactPlan, credentialAccessExecutionPlan, modelNetworkExecutionPlan, toolsetDisableProofExecutionPlan, timeoutKillSwitchExecutionPlan, outputIngestionReviewPlan, runtimeExecutionSafetyPlan, executionPlanningRiskRegister: buildRiskRegister(planningId), controlledRuntimeExecutionApprovalEnvelope, controlledResearchRuntimeExecutionPlanningReceipt: { receiptId: `${planningId}:receipt`, planningId, toolId: 'hermes_agent', decision, scope: 'controlled_research_runtime_execution_planning_only', runtimeExecutionApproved: false, researchExecutionApproved: false }, hermesControlledResearchRuntimeExecutionPlanCandidate: { candidateId: `${planningId}:candidate`, selectedWrapperStrategy, provider, model, credentialRef, host, runRoot, commandExecutableNow: false, promptCreatedNow: false, credentialValuesReadNow: false, networkUsedNow: false, modelCalledNow: false, toolsetsEnabledNow: false, acceptedForApproval: accepted }, checks, blockers, warnings: riskIds.map((riskId) => ({ warningId: riskId, message: riskId })), status, decision, executionPlanningStatus: accepted ? 'plan_candidate_created' : 'blocked', liveArtifactsVerified: accepted, runtimeCommandEnvelopePlanBuilt: accepted, promptArtifactPlanBuilt: accepted, credentialAccessPlanBuilt: accepted, modelNetworkExecutionPlanBuilt: accepted, toolsetDisableProofPlanBuilt: accepted, timeoutKillSwitchExecutionPlanBuilt: accepted, outputIngestionReviewPlanBuilt: accepted, executionSafetyPlanBuilt: accepted, executionApprovalEnvelopeBuilt: accepted, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimeExecutionApproval: accepted, canProceedToControlledResearchRuntimeExecution: false, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Execution Approval Gate v1; execution remains blocked.' : 'Keep Hermes research blocked and repair unsafe or incomplete execution planning evidence.' }
}

export function validateFactoryHermesControlledResearchRuntimeExecutionPlanningInput(input: FactoryHermesControlledResearchRuntimeExecutionPlanningInput): FactoryHermesControlledResearchRuntimeExecutionPlanningValidationResult {
  const errors: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt_required')
  if (!input?.plannedBy) errors.push('plannedBy_required')
  if (!input?.liveArtifactVerificationReviewResult) errors.push('liveArtifactVerificationReviewResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result: FactoryHermesControlledResearchRuntimeExecutionPlanningResult): FactoryHermesControlledResearchRuntimeExecutionPlanningValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_execution_plan_created', 'controlled_research_runtime_execution_plan_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.runtimeCommandEnvelopePlan?.commandString !== null) errors.push('commandString_must_be_null')
  if (result?.runtimeCommandEnvelopePlan?.prompt !== null) errors.push('prompt_must_be_null')
  if (result?.status === 'controlled_research_runtime_execution_plan_created' && result?.canProceedToControlledResearchRuntimeExecutionApproval !== true) errors.push('execution_approval_must_be_allowed_when_created')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result: FactoryHermesControlledResearchRuntimeExecutionPlanningResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeExecutionPlanningResult(text: string): FactoryHermesControlledResearchRuntimeExecutionPlanningResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeExecutionPlanningResult(result: FactoryHermesControlledResearchRuntimeExecutionPlanningResult): FactoryHermesControlledResearchRuntimeExecutionPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimeExecutionApproval: result.canProceedToControlledResearchRuntimeExecutionApproval, canRunResearchNow: result.canRunResearchNow }
}
