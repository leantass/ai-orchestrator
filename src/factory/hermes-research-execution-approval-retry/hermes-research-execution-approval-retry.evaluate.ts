import { DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_POLICY, EXECUTION_APPROVAL_RETRY_LIMITATIONS, EXECUTION_APPROVAL_RETRY_NOT_AUTHORIZED_ACTIONS, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_VERSION } from './hermes-research-execution-approval-retry.defaults.ts'
import type { FactoryHermesAdapterEvidenceForExecutionApprovalRetryReview, FactoryHermesApprovedResearchExecutionApprovalGateEnvelope, FactoryHermesExecutionApprovalRetryRiskDispositionRegister, FactoryHermesResearchExecutionApprovalRetryBlockerPlan, FactoryHermesResearchExecutionApprovalRetryInput, FactoryHermesResearchExecutionApprovalRetryResult } from './hermes-research-execution-approval-retry.types.ts'

function validAdapter(adapter: any): boolean {
  return adapter?.status === 'research_runtime_adapter_prepared'
    && adapter?.decision === 'hermes_research_runtime_adapter_prepared_with_wrapper_boundary_for_execution_approval_retry'
    && adapter?.adapterStatus === 'prepared_code_only_not_executed'
    && adapter?.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && adapter?.wrapperBoundaryIntegrated === true
    && adapter?.adapterCommandEnvelopeBuilt === true
    && adapter?.adapterSafetyManifestBuilt === true
    && Boolean(adapter?.adapterWrapperBoundaryIntegrationManifest)
    && Boolean(adapter?.adapterNonExecutableCommandEnvelope)
    && Boolean(adapter?.adapterRuntimeSafetyManifest)
    && Boolean(adapter?.adapterLimitationsCarryForward)
    && Boolean(adapter?.adapterRiskDispositionRegister)
    && Boolean(adapter?.researchExecutionApprovalRetryEnvelope)
    && adapter?.runtimeAdapterExecutionAllowedNow === false
    && adapter?.researchExecutionApproved === false
    && adapter?.hermesExecutionApproved === false
    && adapter?.promptPassingApproved === false
    && adapter?.modelCallsApproved === false
    && adapter?.networkApproved === false
    && adapter?.credentialAccessApproved === false
    && adapter?.toolsetEnablementApproved === false
    && adapter?.findingsUseApproved === false
    && adapter?.canProceedToResearchExecutionApprovalRetry === true
    && adapter?.canProceedToResearchExecutionApproval === false
    && adapter?.canProceedToResearchRuntimeAdapterExecution === false
    && adapter?.canRunResearchNow === false
}

function validApprovalRetry(result: any): boolean {
  return result?.status === 'research_runtime_adapter_approval_retry_granted'
    && result?.decision === 'hermes_research_runtime_adapter_approval_retry_approved_with_wrapper_boundary'
    && result?.adapterApprovalRetryStatus === 'approved_for_runtime_adapter_gate_only'
    && result?.runtimeAdapterApproved === true
    && result?.runtimeAdapterExecutionApproved === false
    && result?.researchExecutionApproved === false
    && result?.hermesExecutionApproved === false
    && result?.promptPassingApproved === false
    && result?.modelCallsApproved === false
    && result?.networkApproved === false
    && result?.credentialAccessApproved === false
    && result?.toolsetEnablementApproved === false
    && result?.findingsUseApproved === false
}

function validReview(review: any): boolean {
  return review?.status === 'wrapper_no_tool_mode_verification_review_completed'
    && review?.decision === 'hermes_wrapper_no_tool_mode_verification_review_accepted_for_adapter_approval_retry'
    && review?.reviewStatus === 'accepted_with_limitations'
    && review?.hermesWrapperNoToolModeVerificationReviewDecision?.adapterApprovalRetryAllowed === true
    && review?.hermesWrapperNoToolModeVerificationReviewDecision?.runtimeAdapterApproved === false
    && review?.hermesWrapperNoToolModeVerificationReviewDecision?.researchExecutionApproved === false
    && review?.canRunResearchNow === false
}

function makeEvidence(adapter: any, ok: boolean): FactoryHermesAdapterEvidenceForExecutionApprovalRetryReview {
  const envelope = adapter?.adapterNonExecutableCommandEnvelope || {}
  return {
    adapterPrepared: adapter?.status === 'research_runtime_adapter_prepared',
    adapterStatus: adapter?.adapterStatus,
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    wrapperBoundaryIntegrated: adapter?.wrapperBoundaryIntegrated === true,
    adapterCommandEnvelopeBuilt: adapter?.adapterCommandEnvelopeBuilt === true,
    adapterSafetyManifestBuilt: adapter?.adapterSafetyManifestBuilt === true,
    adapterNonExecutableCommandEnvelopeVerified: envelope.commandString === null && Array.isArray(envelope.argv) && envelope.argv.length === 0 && Object.keys(envelope.env || {}).length === 0 && envelope.prompt === null && envelope.tempConfigPath === null && envelope.runRoot === null,
    commandString: null,
    argvEmpty: Array.isArray(envelope.argv) && envelope.argv.length === 0,
    envEmpty: Object.keys(envelope.env || {}).length === 0,
    promptNull: envelope.prompt === null,
    tempConfigPathNull: envelope.tempConfigPath === null,
    runRootNull: envelope.runRoot === null,
    runtimeAdapterExecutionAllowedNow: false,
    researchExecutionApproved: false,
    hermesExecutionApproved: false,
    promptPassingApproved: false,
    modelCallsApproved: false,
    networkApproved: false,
    credentialAccessApproved: false,
    toolsetEnablementApproved: false,
    findingsUseApproved: false,
    evidenceDoesNotExecuteRuntime: true,
    evidenceDoesNotApproveResearch: true,
    evidenceSupportsExecutionApprovalRetry: ok,
    evidenceSummary: ['Adapter prepared only as a non-executable boundary.', 'Retry cannot convert adapter evidence into runtime execution.', 'Next gate must keep real execution blocked until a later explicit approval path.'],
  }
}

function makeRisks(id: string): FactoryHermesExecutionApprovalRetryRiskDispositionRegister {
  const risks = ['execution_approval_retry_confused_with_real_execution', 'adapter_boundary_overinterpreted_as_runtime_ready', 'hidden_defaults_not_detected_in_real_cli', 'config_schema_unknown_blocks_runtime_confidence', 'empty_toolsets_support_unknown_blocks_runtime_confidence', 'future_execution_gate_reads_credentials_too_early', 'future_execution_gate_passes_prompt_too_early', 'future_execution_gate_enables_network_too_early', 'future_execution_gate_enables_toolsets_too_early', 'research_execution_triggered_without_final_human_approval', 'findings_promoted_without_real_ingestion_review']
  return { registerId: `${id}:risk-register`, dispositions: risks.map((riskId) => ({ riskId, severity: riskId === 'research_execution_triggered_without_final_human_approval' ? 'critical' : 'high', disposition: 'accepted_for_execution_approval_gate_only', mitigation: 'Carry explicit no-execution flags and require future gate control before runtime, prompt, network, credential, model, toolset, or findings actions.', blocksExecutionApprovalGate: false, blocksRuntimeExecution: true, blocksResearchExecution: true })) }
}

function makeEnvelope(id: string): FactoryHermesApprovedResearchExecutionApprovalGateEnvelope {
  return {
    envelopeId: `${id}:research-execution-approval-gate-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'research_execution_approval_gate_only',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    sourceAdapterRef: 'research-runtime-adapter-result.json',
    sourceApprovalRetryRef: 'research-execution-approval-retry-result.json',
    targetNextGate: 'Factory Hermes Research Execution Approval Gate v1',
    purpose: 'allow final research execution approval gate to evaluate whether controlled Hermes execution can be authorized while preserving all runtime blocks in this retry gate',
    allowedInNextGate: ['read research-runtime-adapter-result.json', 'read research-execution-approval-retry-result.json', 'read runtime-selection-decision-result.json', 'evaluate final execution approval criteria', 'decide approved/blocked for future controlled runtime only', 'produce final approval/blocker envelope', 'write ignored approval artifact'],
    forbiddenEvenInNextGate: ['execute Hermes immediately', 'execute hermes.exe immediately', 'execute --oneshot immediately', 'execute wrapper against Hermes immediately', 'create live temp config without explicit approval', 'pass prompt without explicit approval', 'call model without explicit approval', 'use network without explicit approval', 'resolve DNS without explicit approval', 'test endpoints without explicit approval', 'read credential values without explicit approval', 'read .env', 'create runtime run root without explicit approval', 'enable actual toolsets without explicit approval', 'execute research without final runtime gate', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'],
    flags: { researchExecutionApprovalGateAllowedNow: true, researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false, canProceedToResearchExecutionApproval: true, canRunResearchNow: false },
    recommendedNextGate: 'Factory Hermes Research Execution Approval Gate v1',
  }
}

function makeBlockerPlan(id: string, blockers: string[]): FactoryHermesResearchExecutionApprovalRetryBlockerPlan {
  return { blockerPlanId: `${id}:blocker-plan`, toolId: 'hermes_agent', blockerType: 'adapter_evidence_insufficient_for_execution_approval_retry', blockers, resolutionOptions: ['Return to Research Runtime Adapter Gate', 'Return to Wrapper Verification Review Gate', 'Keep Hermes research blocked', 'Deeper source review', 'Change research provider/tool'], recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1' }
}

export function evaluateFactoryHermesResearchExecutionApprovalRetry(input: FactoryHermesResearchExecutionApprovalRetryInput): FactoryHermesResearchExecutionApprovalRetryResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_POLICY, ...(input.policy || {}) }
  const id = `hermes-research-execution-approval-retry:75b300f:${input.retriedAt}`
  const adapterOk = validAdapter(input.researchRuntimeAdapterResult)
  const approvalRetryOk = validApprovalRetry(input.adapterApprovalRetryResult)
  const reviewOk = validReview(input.wrapperVerificationReviewResult)
  const policyOk = Object.values(policy).every((value) => value === true)
  const evidence = makeEvidence(input.researchRuntimeAdapterResult, adapterOk)
  const blockers = [
    ...(!adapterOk ? [{ blockerId: 'research_runtime_adapter_not_prepared', message: 'Research runtime adapter is not prepared as expected.' }] : []),
    ...(!approvalRetryOk ? [{ blockerId: 'adapter_approval_retry_not_granted', message: 'Adapter approval retry is not granted.' }] : []),
    ...(!reviewOk ? [{ blockerId: 'wrapper_verification_review_not_accepted', message: 'Wrapper verification review is not accepted.' }] : []),
    ...(!policyOk ? [{ blockerId: 'policy_override_degrades_required_controls', message: 'Policy override disabled required controls.' }] : []),
  ]
  const granted = blockers.length === 0 && evidence.evidenceSupportsExecutionApprovalRetry
  const status = granted ? 'research_execution_approval_retry_granted' : 'research_execution_approval_retry_blocked'
  const decision = granted ? 'hermes_research_execution_approval_retry_approved_for_final_execution_approval_gate' : 'hermes_research_execution_approval_retry_blocked_adapter_evidence_insufficient'
  const retryStatus = granted ? 'approved_for_research_execution_approval_gate_only' : 'blocked'
  const nextGate = granted ? 'Factory Hermes Research Execution Approval Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
  const result: FactoryHermesResearchExecutionApprovalRetryResult = {
    retryId: id, retryKind: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_KIND, retryVersion: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_VERSION, retriedAt: input.retriedAt, retriedBy: input.retriedBy, toolId: 'hermes_agent',
    researchRuntimeAdapterRef: input.researchRuntimeAdapterResult?.adapterId, adapterApprovalRetryRef: input.adapterApprovalRetryResult?.retryId, wrapperVerificationReviewRef: input.wrapperVerificationReviewResult?.reviewId, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    adapterEvidenceForExecutionApprovalRetryReview: evidence,
    executionApprovalRetryLimitationsCarryForward: { limitations: EXECUTION_APPROVAL_RETRY_LIMITATIONS, limitationsAcceptableForExecutionApprovalGate: true, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockImmediateResearchExecution: true, limitationsBlockFindingsUse: true },
    executionApprovalRetryRiskDispositionRegister: makeRisks(id),
    researchExecutionApprovalRetryReceipt: { receiptId: `${id}:receipt`, retryId: id, toolId: 'hermes_agent', retriedBy: input.retriedBy, retriedAt: input.retriedAt, decision, executionApprovalRetryStatus: retryStatus, scope: 'hermes_research_execution_approval_retry_only', approvedNextGate: nextGate, limitations: EXECUTION_APPROVAL_RETRY_LIMITATIONS, notAuthorizedActions: EXECUTION_APPROVAL_RETRY_NOT_AUTHORIZED_ACTIONS },
    hermesResearchExecutionApprovalRetryDecision: { decisionId: `${id}:decision`, toolId: 'hermes_agent', executionApprovalRetryStatus: retryStatus, decision, reason: granted ? 'prepared_adapter_with_wrapper_boundary_supports_final_approval_gate_only' : 'adapter_evidence_insufficient_for_execution_approval_retry', adapterPrepared: adapterOk, researchExecutionApprovalGateAllowed: granted, researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false, canProceedToResearchExecutionApproval: granted, requiredNextGate: nextGate },
    checks: [{ checkId: 'research_runtime_adapter_prepared', passed: adapterOk, message: 'Research runtime adapter prepared.' }, { checkId: 'adapter_approval_retry_granted', passed: approvalRetryOk, message: 'Adapter approval retry granted.' }, { checkId: 'wrapper_review_accepted', passed: reviewOk, message: 'Wrapper verification review accepted.' }],
    blockers, warnings: EXECUTION_APPROVAL_RETRY_LIMITATIONS.map((message) => ({ warningId: message, message })), status, decision, executionApprovalRetryStatus: retryStatus,
    researchExecutionApprovalGateAllowed: granted, researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false,
    canProceedToResearchExecutionApproval: granted, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !granted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false,
    recommendedNextStep: granted ? 'Proceed to Factory Hermes Research Execution Approval Gate v1; runtime execution remains blocked.' : 'Keep Hermes research blocked or repair adapter evidence.',
  }
  if (granted) result.approvedResearchExecutionApprovalGateEnvelope = makeEnvelope(id)
  else result.retryBlockerPlan = makeBlockerPlan(id, blockers.map((blocker) => blocker.blockerId))
  return result
}
