import { ADAPTER_RETRY_LIMITATIONS, ADAPTER_RETRY_NOT_AUTHORIZED_ACTIONS, DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_POLICY, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_VERSION } from './hermes-research-runtime-adapter-approval-retry.defaults.ts'
import type { FactoryHermesAdapterRetryRiskDispositionRegister, FactoryHermesApprovedResearchRuntimeAdapterGateEnvelope, FactoryHermesResearchRuntimeAdapterApprovalRetryBlockerPlan, FactoryHermesResearchRuntimeAdapterApprovalRetryInput, FactoryHermesResearchRuntimeAdapterApprovalRetryResult, FactoryHermesWrapperEvidenceForAdapterRetryReview } from './hermes-research-runtime-adapter-approval-retry.types.ts'

function isReviewAccepted(review: any): boolean {
  return review?.status === 'wrapper_no_tool_mode_verification_review_completed'
    && review?.decision === 'hermes_wrapper_no_tool_mode_verification_review_accepted_for_adapter_approval_retry'
    && review?.reviewStatus === 'accepted_with_limitations'
    && review?.canProceedToResearchRuntimeAdapterApprovalRetry === true
    && review?.canProceedToResearchRuntimeAdapter === false
    && review?.canRunResearchNow === false
    && review?.canExecuteHermesNow === false
}

function isVerificationPassed(verification: any): boolean {
  return verification?.status === 'wrapper_no_tool_mode_verification_completed'
    && verification?.decision === 'hermes_wrapper_no_tool_mode_verified_for_review'
    && verification?.verificationStatus === 'verified_code_only_not_runtime_executable'
    && verification?.wrapperVerificationPassed === true
    && verification?.staticSafetyScanPassed === true
    && verification?.configSerializerVerificationPassed === true
    && verification?.commandEnvelopeVerificationPassed === true
    && verification?.tempConfigVirtualVerificationPassed === true
    && verification?.noHermesExecutionVerificationPassed === true
}

function isPreviousAdapterBlocked(previous: any): boolean {
  return previous?.status === 'research_runtime_adapter_approval_blocked'
    && String(previous?.decision || '').includes('blocked')
    && String(previous?.decision || '').includes('toolset')
    && previous?.runtimeAdapterApprovalStatus === 'blocked'
    && previous?.canProceedToResearchRuntimeAdapter === false
    && previous?.canRunResearchNow === false
}

function isToolsetDisableBlocked(approval: any): boolean {
  return approval?.status === 'toolset_disable_verification_approval_blocked'
    && approval?.decision === 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape'
    && approval?.approvalStatus === 'blocked'
}

function makeEvidence(reviewOk: boolean, verification: any): FactoryHermesWrapperEvidenceForAdapterRetryReview {
  return {
    wrapperVerificationReviewAccepted: reviewOk,
    wrapperVerificationPassed: verification?.wrapperVerificationPassed === true,
    staticSafetyScanPassed: verification?.staticSafetyScanPassed === true,
    configSerializerVerificationPassed: verification?.configSerializerVerificationPassed === true,
    commandEnvelopeVerificationPassed: verification?.commandEnvelopeVerificationPassed === true,
    tempConfigVirtualVerificationPassed: verification?.tempConfigVirtualVerificationPassed === true,
    noHermesExecutionVerificationPassed: verification?.noHermesExecutionVerificationPassed === true,
    evidenceIsCodeOnly: true,
    evidenceDoesNotProveRealHermesRuntime: true,
    evidenceDoesNotApproveAdapterExecution: true,
    evidenceSupportsAdapterApprovalRetry: reviewOk && isVerificationPassed(verification),
    evidenceSummary: [
      'Wrapper verified only as a code-only boundary.',
      'Retry cannot convert wrapper evidence into real Hermes execution.',
      'Future adapter gate must preserve all runtime, research, prompt, model, network, credential, and toolset blocks.',
    ],
  }
}

function makeRiskRegister(id: string): FactoryHermesAdapterRetryRiskDispositionRegister {
  const risks = [
    'wrapper_code_only_evidence_overinterpreted',
    'adapter_retry_confuses_adapter_gate_with_runtime_execution',
    'hidden_defaults_not_detected_in_real_cli',
    'config_schema_unknown_blocks_runtime_confidence',
    'empty_toolsets_support_unknown_blocks_runtime_confidence',
    'future_adapter_builds_runnable_command_too_early',
    'future_adapter_reads_credentials_too_early',
    'future_adapter_passes_prompt_too_early',
    'future_adapter_enables_network_too_early',
    'research_execution_triggered_without_final_approval',
  ]
  return {
    registerId: `${id}:risk-register`,
    dispositions: risks.map((riskId) => ({
      riskId,
      severity: riskId === 'research_execution_triggered_without_final_approval' ? 'critical' : 'high',
      disposition: 'accepted_for_adapter_gate_only',
      mitigation: 'Carry explicit no-execution flags and require future gate control before any runtime action.',
      blocksAdapterGate: false,
      blocksRuntimeAdapterExecution: true,
      blocksResearchExecution: true,
    })),
  }
}

function makeEnvelope(id: string): FactoryHermesApprovedResearchRuntimeAdapterGateEnvelope {
  return {
    envelopeId: `${id}:adapter-gate-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'research_runtime_adapter_gate_only',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    sourceVerificationReviewRef: 'wrapper-no-tool-mode-verification-review-result.json',
    targetNextGate: 'Factory Hermes Research Runtime Adapter Gate v1',
    purpose: 'allow adapter gate to prepare or revise the Hermes research runtime adapter using verified wrapper code-only evidence while preserving all execution blocks',
    allowedInNextGate: ['read wrapper verification review result', 'read wrapper verification result', 'read previous adapter approval result', 'inspect existing adapter source/read-only', 'create or revise adapter gate metadata if needed', 'build adapter planning/manifest artifacts', 'build non-executable adapter command/envelope artifacts', 'write ignored adapter artifact under .codex-temp', 'run smoke tests that do not execute Hermes/wrapper/research'],
    forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'create live temp config', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'create runtime run root', 'enable actual toolsets', 'execute research', 'approve research execution', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'],
    mustCarryForwardLimitations: ['code-only wrapper verification', 'config schema partially unknown', 'empty toolsets support unknown', 'no real Hermes execution tested', 'no model/network/provider tested', 'hidden defaults may still exist in real CLI runtime'],
    flags: { runtimeAdapterApprovedNow: true, runtimeAdapterExecutionAllowedNow: false, researchExecutionApprovedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, canProceedToResearchRuntimeAdapter: true, canRunResearchNow: false },
    recommendedNextGate: 'Factory Hermes Research Runtime Adapter Gate v1',
  }
}

function makeBlockerPlan(id: string, blockers: string[]): FactoryHermesResearchRuntimeAdapterApprovalRetryBlockerPlan {
  return {
    blockerPlanId: `${id}:blocker-plan`,
    toolId: 'hermes_agent',
    blockerType: 'wrapper_evidence_insufficient_for_adapter_approval_retry',
    blockers,
    resolutionOptions: ['Return to wrapper verification review', 'Return to wrapper verification', 'Keep Hermes research blocked', 'Deeper source review', 'Change research provider/tool'],
    recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1',
  }
}

export function evaluateFactoryHermesResearchRuntimeAdapterApprovalRetry(input: FactoryHermesResearchRuntimeAdapterApprovalRetryInput): FactoryHermesResearchRuntimeAdapterApprovalRetryResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_POLICY, ...(input.policy || {}) }
  const id = `hermes-research-runtime-adapter-approval-retry:75b300f:${input.retriedAt}`
  const reviewOk = isReviewAccepted(input.wrapperVerificationReviewResult)
  const verificationOk = isVerificationPassed(input.wrapperVerificationResult)
  const previousOk = isPreviousAdapterBlocked(input.previousAdapterApprovalResult)
  const toolsetOk = isToolsetDisableBlocked(input.toolsetDisableVerificationApprovalResult)
  const evidence = makeEvidence(reviewOk, input.wrapperVerificationResult)
  const blockers = [
    ...(!reviewOk ? [{ blockerId: 'wrapper_verification_review_not_accepted', message: 'Wrapper verification review is not accepted for adapter approval retry.' }] : []),
    ...(!verificationOk ? [{ blockerId: 'wrapper_verification_not_passed', message: 'Wrapper verification code-only checks are not passed.' }] : []),
    ...(!previousOk ? [{ blockerId: 'previous_adapter_approval_not_blocked_as_expected', message: 'Previous adapter approval is not blocked by the expected toolset/no safe no-tool boundary.' }] : []),
    ...(!toolsetOk ? [{ blockerId: 'toolset_disable_approval_not_blocked_as_expected', message: 'Toolset disable approval does not show the expected no-safe-probe blocker.' }] : []),
  ]
  const granted = blockers.length === 0 && evidence.evidenceSupportsAdapterApprovalRetry === true && Object.values(policy).every((value) => value === true)
  const status = granted ? 'research_runtime_adapter_approval_retry_granted' : 'research_runtime_adapter_approval_retry_blocked'
  const decision = granted ? 'hermes_research_runtime_adapter_approval_retry_approved_with_wrapper_boundary' : 'hermes_research_runtime_adapter_approval_retry_blocked_wrapper_evidence_insufficient'
  const retryStatus = granted ? 'approved_for_runtime_adapter_gate_only' : 'blocked'
  const nextGate = granted ? 'Factory Hermes Research Runtime Adapter Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
  const riskRegister = makeRiskRegister(id)
  const result: FactoryHermesResearchRuntimeAdapterApprovalRetryResult = {
    retryId: id,
    retryKind: FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_KIND,
    retryVersion: FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_VERSION,
    retriedAt: input.retriedAt,
    retriedBy: input.retriedBy,
    toolId: 'hermes_agent',
    previousAdapterApprovalRef: input.previousAdapterApprovalResult?.adapterApprovalId,
    wrapperVerificationReviewRef: input.wrapperVerificationReviewResult?.reviewId,
    wrapperVerificationRef: input.wrapperVerificationResult?.verificationId,
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    wrapperEvidenceForAdapterRetryReview: evidence,
    adapterRetryLimitationsCarryForward: { limitations: ADAPTER_RETRY_LIMITATIONS, limitationsAcceptableForAdapterGateApproval: true, limitationsBlockHermesExecution: true, limitationsBlockResearchExecution: true, limitationsBlockFindingsUse: true },
    adapterRetryRiskDispositionRegister: riskRegister,
    researchRuntimeAdapterApprovalRetryReceipt: { receiptId: `${id}:receipt`, retryId: id, toolId: 'hermes_agent', retriedBy: input.retriedBy, retriedAt: input.retriedAt, decision, adapterApprovalRetryStatus: retryStatus, scope: 'hermes_research_runtime_adapter_approval_retry_only', approvedNextGate: nextGate, limitations: ADAPTER_RETRY_LIMITATIONS, notAuthorizedActions: ADAPTER_RETRY_NOT_AUTHORIZED_ACTIONS },
    hermesResearchRuntimeAdapterApprovalRetryDecision: { decisionId: `${id}:decision`, toolId: 'hermes_agent', adapterApprovalRetryStatus: retryStatus, decision, reason: granted ? 'wrapper_code_only_verification_review_accepts_adapter_gate_retry_with_runtime_blocks' : 'wrapper_evidence_insufficient_for_adapter_approval_retry', wrapperVerificationReviewAccepted: reviewOk, runtimeAdapterApproved: granted, runtimeAdapterExecutionApproved: false, researchExecutionApproved: false, hermesExecutionApproved: false, promptPassingApproved: false, modelCallsApproved: false, networkApproved: false, credentialAccessApproved: false, toolsetEnablementApproved: false, findingsUseApproved: false, canProceedToResearchRuntimeAdapter: granted, canProceedToResearchExecutionApproval: false, requiredNextGate: nextGate },
    checks: [
      { checkId: 'wrapper_verification_review_accepted', passed: reviewOk, message: 'Wrapper verification review accepted for adapter retry.' },
      { checkId: 'wrapper_verification_passed', passed: verificationOk, message: 'Wrapper verification is code-only passed.' },
      { checkId: 'previous_adapter_approval_blocked', passed: previousOk, message: 'Previous adapter approval remains blocked.' },
      { checkId: 'toolset_disable_approval_blocked', passed: toolsetOk, message: 'Toolset disable approval remains blocked.' },
    ],
    blockers,
    warnings: ADAPTER_RETRY_LIMITATIONS.map((message) => ({ warningId: message, message })),
    status,
    decision,
    adapterApprovalRetryStatus: retryStatus,
    runtimeAdapterApproved: granted,
    runtimeAdapterExecutionApproved: false,
    researchExecutionApproved: false,
    hermesExecutionApproved: false,
    promptPassingApproved: false,
    modelCallsApproved: false,
    networkApproved: false,
    credentialAccessApproved: false,
    toolsetEnablementApproved: false,
    findingsUseApproved: false,
    canProceedToResearchRuntimeAdapter: granted,
    canProceedToResearchExecutionApproval: false,
    canProceedToKeepHermesResearchBlockedDecision: !granted,
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
    recommendedNextStep: granted ? 'Proceed to Factory Hermes Research Runtime Adapter Gate v1; all runtime execution remains blocked.' : 'Keep Hermes research blocked or return to wrapper evidence review.',
  }
  if (granted) result.approvedResearchRuntimeAdapterGateEnvelope = makeEnvelope(id)
  else result.retryBlockerPlan = makeBlockerPlan(id, blockers.map((blocker) => blocker.blockerId))
  return result
}
