export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_KIND = 'factory-hermes-controlled-research-runtime-execution-approval'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeExecutionApprovalVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_VERSION
export type FactoryHermesControlledResearchRuntimeExecutionApprovalKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_KIND
export type FactoryHermesControlledResearchRuntimeExecutionApprovalInput = { approvedAt: string, approvedBy: string, executionPlanningResult?: any, liveArtifactVerificationReviewResult?: any, researchRuntimeAdapterResult?: any, runtimeSelectionDecisionResult?: any }
export type FactoryHermesControlledResearchRuntimeExecutionApprovalPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', controlledRuntimeExecutionAllowedNow: false }
export type FactoryHermesControlledResearchRuntimeExecutionApprovalStatus = 'controlled_research_runtime_execution_approval_granted' | 'controlled_research_runtime_execution_approval_blocked'
export type FactoryHermesControlledResearchRuntimeExecutionApprovalDecision = 'hermes_controlled_research_runtime_execution_approved_for_final_execution_gate' | 'hermes_controlled_research_runtime_execution_approval_blocked_plan_incomplete_or_unsafe'
export type FactoryHermesExecutionPlanReadinessReview = any
export type FactoryHermesRuntimeCommandEnvelopePlanReview = any
export type FactoryHermesPromptArtifactPlanReview = any
export type FactoryHermesCredentialAccessExecutionPlanReview = any
export type FactoryHermesModelNetworkExecutionPlanReview = any
export type FactoryHermesToolsetDisableProofExecutionPlanReview = any
export type FactoryHermesTimeoutKillSwitchExecutionPlanReview = any
export type FactoryHermesOutputIngestionReviewPlanReview = any
export type FactoryHermesRuntimeExecutionSafetyPlanReview = any
export type FactoryHermesExecutionApprovalLimitationsCarryForward = any
export type FactoryHermesExecutionApprovalRiskDispositionRegister = any
export type FactoryHermesControlledRuntimeExecutionGateEnvelope = any
export type FactoryHermesControlledResearchRuntimeExecutionApprovalReceipt = any
export type FactoryHermesControlledResearchRuntimeExecutionApprovalDecisionRecord = any
export type FactoryHermesControlledResearchRuntimeExecutionApprovalBlockerPlan = any
export type FactoryHermesControlledResearchRuntimeExecutionApprovalCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesControlledResearchRuntimeExecutionApprovalBlocker = { blockerId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionApprovalWarning = { warningId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionApprovalResult = any
export type FactoryHermesControlledResearchRuntimeExecutionApprovalValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesControlledResearchRuntimeExecutionApprovalSummary = { approvalId: string, status: string, decision: string, canProceedToControlledResearchRuntimeExecution: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const provider = 'openai'
const model = 'gpt-4o-mini'
const host = 'api.openai.com'
const credentialRef = 'OPENAI_API_KEY'
const falseFlags = ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const limitations = ['execution_approval_is_not_execution', 'no_real_hermes_execution_tested', 'no_model_network_or_provider_tested', 'config_schema_partially_unknown', 'empty_toolsets_support_unknown', 'hidden_defaults_may_still_exist_in_real_cli_runtime', 'verified_config_file_does_not_prove_runtime_behavior', 'run_manifest_does_not_prove_successful_run', 'prompt_not_created_or_approved_yet', 'credential_value_not_read_yet', 'network_not_approved_yet', 'model_call_not_approved_yet', 'toolset_disable_not_proven_by_real_execution', 'output_ingestion_not_approved_yet', 'findings_use_not_approved_yet']
const risks = ['execution_approval_confused_with_execution', 'final_execution_gate_auto_executes_without_preflight', 'future_command_envelope_accidentally_runnable', 'prompt_created_or_sent_too_early', 'credential_value_read_too_early', 'network_enabled_too_early', 'model_called_too_early', 'toolsets_enabled_too_early', 'hidden_defaults_loaded_in_real_runtime', 'tool_usage_not_detected_in_output', 'timeout_kill_switch_not_applied', 'raw_output_ingested_without_review', 'findings_used_without_ingestion_review', 'verified_artifacts_changed_before_execution', 'run_result_written_outside_codex_temp']

function c(checks: FactoryHermesControlledResearchRuntimeExecutionApprovalCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function getProvider(selection: any): string | undefined { return selection?.selectedProvider?.providerId ?? selection?.runtimeSelectionDecisionRecord?.provider?.providerId }
function getModel(selection: any): string | undefined { return selection?.selectedModel?.modelId ?? selection?.runtimeSelectionDecisionRecord?.model?.modelId }
function getCredentialRef(selection: any): string | undefined { return selection?.selectedCredentialRef?.credentialRefName ?? selection?.runtimeSelectionDecisionRecord?.credential?.credentialRefName }
function getHost(selection: any): string | undefined { return selection?.selectedNetworkHosts?.selectedHosts?.[0] ?? selection?.runtimeSelectionDecisionRecord?.network?.selectedHosts?.[0] }
function getRunRoot(selection: any): string { return selection?.selectedRunRoot?.selectedRunRoot ?? selection?.runtimeSelectionDecisionRecord?.runRoot?.selectedRunRoot ?? '' }

export function evaluateFactoryHermesControlledResearchRuntimeExecutionApproval(input: FactoryHermesControlledResearchRuntimeExecutionApprovalInput): FactoryHermesControlledResearchRuntimeExecutionApprovalResult {
  const plan = input.executionPlanningResult
  const review = input.liveArtifactVerificationReviewResult
  const adapter = input.researchRuntimeAdapterResult
  const selection = input.runtimeSelectionDecisionResult
  const checks: FactoryHermesControlledResearchRuntimeExecutionApprovalCheck[] = []
  const approvalId = `hermes-controlled-research-runtime-execution-approval:75b300f:${input.approvedAt}`
  const required = [
    c(checks, 'planning_status', plan?.status, 'controlled_research_runtime_execution_plan_created'),
    c(checks, 'planning_decision', plan?.decision, 'hermes_controlled_research_runtime_execution_plan_created_for_approval'),
    c(checks, 'planning_candidate', plan?.executionPlanningStatus, 'plan_candidate_created'),
    c(checks, 'planning_strategy', plan?.selectedWrapperStrategy, selectedWrapperStrategy),
    c(checks, 'planning_live_artifacts', plan?.liveArtifactsVerified),
    c(checks, 'planning_all_components', plan?.runtimeCommandEnvelopePlanBuilt && plan?.promptArtifactPlanBuilt && plan?.credentialAccessPlanBuilt && plan?.modelNetworkExecutionPlanBuilt && plan?.toolsetDisableProofPlanBuilt && plan?.timeoutKillSwitchExecutionPlanBuilt && plan?.outputIngestionReviewPlanBuilt && plan?.executionSafetyPlanBuilt && plan?.executionApprovalEnvelopeBuilt),
    c(checks, 'planning_allows_approval', plan?.canProceedToControlledResearchRuntimeExecutionApproval),
    c(checks, 'planning_blocks_execution', plan?.canProceedToControlledResearchRuntimeExecution, false),
    c(checks, 'planning_blocks_research', plan?.canRunResearchNow, false),
    c(checks, 'review_status', review?.status, 'controlled_research_runtime_live_artifact_verification_review_completed'),
    c(checks, 'review_allows_planning', review?.controlledRuntimeExecutionPlanningAllowed),
    c(checks, 'review_blocks_research', review?.canRunResearchNow, false),
    c(checks, 'adapter_status', adapter?.status, 'research_runtime_adapter_prepared'),
    c(checks, 'adapter_prepared', adapter?.adapterStatus, 'prepared_code_only_not_executed'),
    c(checks, 'adapter_boundary', adapter?.wrapperBoundaryIntegrated),
    c(checks, 'adapter_blocks_execution', adapter?.runtimeAdapterExecutionAllowedNow, false),
    c(checks, 'selection_provider', getProvider(selection), provider),
    c(checks, 'selection_model', getModel(selection), model),
    c(checks, 'selection_credential', getCredentialRef(selection), credentialRef),
    c(checks, 'selection_host', getHost(selection), host),
    c(checks, 'selection_run_root', getRunRoot(selection).startsWith('.codex-temp')),
  ]
  const blockers = required.every(Boolean) ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Execution approval check failed: ${check.checkId}` }))
  const accepted = blockers.length === 0
  const status: FactoryHermesControlledResearchRuntimeExecutionApprovalStatus = accepted ? 'controlled_research_runtime_execution_approval_granted' : 'controlled_research_runtime_execution_approval_blocked'
  const decision: FactoryHermesControlledResearchRuntimeExecutionApprovalDecision = accepted ? 'hermes_controlled_research_runtime_execution_approved_for_final_execution_gate' : 'hermes_controlled_research_runtime_execution_approval_blocked_plan_incomplete_or_unsafe'
  const runtimeCommandEnvelopePlanReview = { ...plan?.runtimeCommandEnvelopePlan, acceptedForFinalExecutionGate: accepted, blocksImmediateExecutableCommand: true, blocksImmediateRuntimeExecution: true }
  const promptArtifactPlanReview = { ...plan?.promptArtifactPlan, acceptedForFinalExecutionGate: accepted, promptStillRequiresFutureApproval: true, blocksImmediatePromptPassing: true, blocksImmediateRuntimeExecution: true }
  const credentialAccessExecutionPlanReview = { ...plan?.credentialAccessExecutionPlan, acceptedForFinalExecutionGate: accepted, credentialStillRequiresFutureRuntimeAccessApproval: true, blocksImmediateCredentialAccess: true, blocksImmediateRuntimeExecution: true }
  const modelNetworkExecutionPlanReview = { ...plan?.modelNetworkExecutionPlan, acceptedForFinalExecutionGate: accepted, networkStillRequiresFutureApproval: true, modelCallsStillRequireFutureApproval: true, blocksImmediateNetwork: true, blocksImmediateModelCalls: true, blocksImmediateRuntimeExecution: true }
  const toolsetDisableProofExecutionPlanReview = { ...plan?.toolsetDisableProofExecutionPlan, acceptedForFinalExecutionGate: accepted, noToolRuntimeStillRequiresFailClosedBehavior: true, blocksImmediateToolsetEnablement: true, blocksImmediateRuntimeExecution: true }
  const timeoutKillSwitchExecutionPlanReview = { ...plan?.timeoutKillSwitchExecutionPlan, acceptedForFinalExecutionGate: accepted, activeProcessControlStillRequiresExecutionGate: true, blocksImmediateRuntimeExecution: true }
  const outputIngestionReviewPlanReview = { ...plan?.outputIngestionReviewPlan, acceptedForFinalExecutionGate: accepted, outputIngestionStillRequiresFutureReview: true, blocksImmediateOutputIngestion: true, blocksImmediateFindingsUse: true }
  const runtimeExecutionSafetyPlanReview = { ...plan?.runtimeExecutionSafetyPlan, acceptedForFinalExecutionGate: accepted, blocksImmediateRuntimeExecution: true, blocksImmediateResearchExecution: true }
  const executionPlanReadinessReview = { executionPlanCreated: accepted, executionPlanningStatus: plan?.executionPlanningStatus, liveArtifactsVerified: plan?.liveArtifactsVerified === true, runtimeCommandEnvelopePlanBuilt: plan?.runtimeCommandEnvelopePlanBuilt === true, promptArtifactPlanBuilt: plan?.promptArtifactPlanBuilt === true, credentialAccessPlanBuilt: plan?.credentialAccessPlanBuilt === true, modelNetworkExecutionPlanBuilt: plan?.modelNetworkExecutionPlanBuilt === true, toolsetDisableProofPlanBuilt: plan?.toolsetDisableProofPlanBuilt === true, timeoutKillSwitchExecutionPlanBuilt: plan?.timeoutKillSwitchExecutionPlanBuilt === true, outputIngestionReviewPlanBuilt: plan?.outputIngestionReviewPlanBuilt === true, executionSafetyPlanBuilt: plan?.executionSafetyPlanBuilt === true, executionApprovalEnvelopeBuilt: plan?.executionApprovalEnvelopeBuilt === true, selectedWrapperStrategy, provider, model, host, credentialRef, readinessSupportsFinalExecutionGate: accepted, readinessDoesNotExecuteNow: true, readinessDoesNotApproveImmediateResearchNow: true, acceptedForFinalExecutionGate: accepted, blocksImmediateRuntimeExecution: true, blocksImmediateResearchExecution: true }
  const controlledRuntimeExecutionGateEnvelope = accepted ? { envelopeId: `${approvalId}:final-execution-gate-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_execution_gate_only', selectedWrapperStrategy, sourceExecutionApprovalRef: 'controlled-research-runtime-execution-approval-result.json', sourceExecutionPlanningRef: 'controlled-research-runtime-execution-planning-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Execution Gate v1', purpose: 'allow the final execution gate to perform last preflight and, only if all explicit final approvals are satisfied inside that gate, execute one controlled Hermes research run', allowedInNextGate: ['read controlled-research-runtime-execution-approval-result.json', 'read controlled-research-runtime-execution-planning-result.json', 'read verified live artifacts', 'perform immediate preflight', 'verify artifacts have not changed', 'create final command envelope only after checks', 'read credential value only if explicitly approved inside final gate', 'pass approved prompt only if explicitly approved inside final gate', 'use network/model only if explicitly approved inside final gate', 'execute a single controlled run only if every final guard is true', 'enforce timeout/kill switch', 'write run result under .codex-temp', 'keep findings blocked pending ingestion/review gate'], forbiddenEvenInNextGateUnlessExplicitlyApprovedInsideThatGate: ['read credential values', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'enable toolsets', 'ingest output as findings', 'promote findings'], alwaysForbiddenEvenInNextGate: ['mutate Hermes source', 'modify package.json', 'modify package-lock.json', 'modify UI/preload/App', 'read .env', 'dump env', 'write run result outside .codex-temp', 'run uv/pip/python/setup.py', 'deploy'], flags: { controlledRuntimeExecutionGateAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimeExecution: true, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Execution Gate v1' } : undefined
  return { approvalId, approvalKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent', executionPlanningRef: 'controlled-research-runtime-execution-planning-result.json', liveArtifactVerificationReviewRef: 'controlled-research-runtime-live-artifact-verification-review-result.json', researchRuntimeAdapterRef: 'research-runtime-adapter-result.json', runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json', selectedWrapperStrategy, executionPlanReadinessReview, runtimeCommandEnvelopePlanReview, promptArtifactPlanReview, credentialAccessExecutionPlanReview, modelNetworkExecutionPlanReview, toolsetDisableProofExecutionPlanReview, timeoutKillSwitchExecutionPlanReview, outputIngestionReviewPlanReview, runtimeExecutionSafetyPlanReview, executionApprovalLimitationsCarryForward: { limitations, limitationsAcceptableForFinalExecutionGate: accepted, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockImmediateResearchExecution: true, limitationsBlockImmediateFindingsUse: true }, executionApprovalRiskDispositionRegister: { risks: risks.map((riskId) => ({ riskId, severity: riskId.includes('auto') || riskId.includes('credential') || riskId.includes('network') ? 'high' : 'medium', disposition: 'accepted_for_final_execution_gate_only', blocksImmediateRuntimeExecutionDisposition: 'blocks_immediate_runtime_execution', blocksResearchExecutionDisposition: 'blocks_research_execution', futureGateDisposition: 'requires_future_gate_control', mitigation: 'Require final execution gate preflight and explicit final approvals before any runtime, prompt, credential, model, network, toolset, output, or findings action.', blocksExecutionApproval: false, blocksFinalExecutionGate: false, blocksImmediateRuntimeExecution: true, blocksResearchExecution: true })) }, controlledRuntimeExecutionGateEnvelope, controlledResearchRuntimeExecutionApprovalReceipt: { receiptId: `${approvalId}:receipt`, approvalId, toolId: 'hermes_agent', decision, scope: 'controlled_research_runtime_execution_approval_only', runtimeExecutionApprovedNow: false, researchExecutionApprovedNow: false }, hermesControlledResearchRuntimeExecutionApprovalDecision: { decisionId: `${approvalId}:decision`, decision, executionPlanAccepted: accepted, controlledRuntimeExecutionGateAllowed: accepted, controlledRuntimeExecutionAllowedNow: false }, approvalBlockerPlan: accepted ? undefined : { planId: `${approvalId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true }, checks, blockers, warnings: limitations.map((warningId) => ({ warningId, message: warningId })), status, decision, executionApprovalStatus: accepted ? 'approved_for_final_execution_gate_only' : 'blocked', executionPlanAccepted: accepted, runtimeCommandEnvelopePlanAccepted: accepted, promptArtifactPlanAccepted: accepted, credentialAccessPlanAccepted: accepted, modelNetworkExecutionPlanAccepted: accepted, toolsetDisableProofPlanAccepted: accepted, timeoutKillSwitchExecutionPlanAccepted: accepted, outputIngestionReviewPlanAccepted: accepted, runtimeExecutionSafetyPlanAccepted: accepted, controlledRuntimeExecutionGateAllowed: accepted, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimeExecution: accepted, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Execution Gate v1; execution remains blocked until that gate performs final approvals.' : 'Keep Hermes research blocked and repair unsafe or incomplete execution approval evidence.' }
}

export function validateFactoryHermesControlledResearchRuntimeExecutionApprovalInput(input: FactoryHermesControlledResearchRuntimeExecutionApprovalInput): FactoryHermesControlledResearchRuntimeExecutionApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  if (!input?.executionPlanningResult) errors.push('executionPlanningResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result: FactoryHermesControlledResearchRuntimeExecutionApprovalResult): FactoryHermesControlledResearchRuntimeExecutionApprovalValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_execution_approval_granted', 'controlled_research_runtime_execution_approval_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === 'controlled_research_runtime_execution_approval_granted' && result?.canProceedToControlledResearchRuntimeExecution !== true) errors.push('final_execution_gate_must_be_allowed_when_granted')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result: FactoryHermesControlledResearchRuntimeExecutionApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeExecutionApprovalResult(text: string): FactoryHermesControlledResearchRuntimeExecutionApprovalResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeExecutionApprovalResult(result: FactoryHermesControlledResearchRuntimeExecutionApprovalResult): FactoryHermesControlledResearchRuntimeExecutionApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimeExecution: result.canProceedToControlledResearchRuntimeExecution, canRunResearchNow: result.canRunResearchNow }
}
