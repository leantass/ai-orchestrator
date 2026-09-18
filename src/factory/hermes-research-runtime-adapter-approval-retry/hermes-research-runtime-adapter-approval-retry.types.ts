export type FactoryHermesResearchRuntimeAdapterApprovalRetryVersion = '1.0'
export type FactoryHermesResearchRuntimeAdapterApprovalRetryKind = 'factory-hermes-research-runtime-adapter-approval-retry'
export type FactoryHermesResearchRuntimeAdapterApprovalRetryStatus = 'research_runtime_adapter_approval_retry_granted' | 'research_runtime_adapter_approval_retry_blocked'
export type FactoryHermesResearchRuntimeAdapterApprovalRetryDecision = 'hermes_research_runtime_adapter_approval_retry_approved_with_wrapper_boundary' | 'hermes_research_runtime_adapter_approval_retry_blocked_wrapper_evidence_insufficient'

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryPolicy {
  [key: string]: boolean
}

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryInput {
  retriedAt: string
  retriedBy: string
  policy?: Partial<FactoryHermesResearchRuntimeAdapterApprovalRetryPolicy>
  wrapperVerificationReviewResult?: any
  wrapperVerificationResult?: any
  wrapperVerificationApprovalResult?: any
  wrapperImplementationResult?: any
  previousAdapterApprovalResult?: any
  runtimeSelectionRevisionPlanningResult?: any
  toolsetDisableVerificationApprovalResult?: any
}

export interface FactoryHermesWrapperEvidenceForAdapterRetryReview {
  wrapperVerificationReviewAccepted: boolean
  wrapperVerificationPassed: boolean
  staticSafetyScanPassed: boolean
  configSerializerVerificationPassed: boolean
  commandEnvelopeVerificationPassed: boolean
  tempConfigVirtualVerificationPassed: boolean
  noHermesExecutionVerificationPassed: boolean
  evidenceIsCodeOnly: boolean
  evidenceDoesNotProveRealHermesRuntime: boolean
  evidenceDoesNotApproveAdapterExecution: boolean
  evidenceSupportsAdapterApprovalRetry: boolean
  evidenceSummary: string[]
}

export interface FactoryHermesAdapterRetryLimitationsCarryForward {
  limitations: string[]
  limitationsAcceptableForAdapterGateApproval: boolean
  limitationsBlockHermesExecution: boolean
  limitationsBlockResearchExecution: boolean
  limitationsBlockFindingsUse: boolean
}

export interface FactoryHermesAdapterRetryRiskDisposition {
  riskId: string
  severity: 'high' | 'critical'
  disposition: 'accepted_for_adapter_gate_only'
  mitigation: string
  blocksAdapterGate: boolean
  blocksRuntimeAdapterExecution: boolean
  blocksResearchExecution: boolean
}

export interface FactoryHermesAdapterRetryRiskDispositionRegister {
  registerId: string
  dispositions: FactoryHermesAdapterRetryRiskDisposition[]
}

export interface FactoryHermesApprovedResearchRuntimeAdapterGateEnvelope {
  envelopeId: string
  toolId: 'hermes_agent'
  approvedFor: 'research_runtime_adapter_gate_only'
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  sourceVerificationReviewRef: 'wrapper-no-tool-mode-verification-review-result.json'
  targetNextGate: 'Factory Hermes Research Runtime Adapter Gate v1'
  purpose: string
  allowedInNextGate: string[]
  forbiddenEvenInNextGate: string[]
  mustCarryForwardLimitations: string[]
  flags: Record<string, boolean>
  recommendedNextGate: 'Factory Hermes Research Runtime Adapter Gate v1'
}

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryReceipt {
  receiptId: string
  retryId: string
  toolId: 'hermes_agent'
  retriedBy: string
  retriedAt: string
  decision: FactoryHermesResearchRuntimeAdapterApprovalRetryDecision
  adapterApprovalRetryStatus: 'approved_for_runtime_adapter_gate_only' | 'blocked'
  scope: 'hermes_research_runtime_adapter_approval_retry_only'
  approvedNextGate: string
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryDecisionRecord {
  decisionId: string
  toolId: 'hermes_agent'
  adapterApprovalRetryStatus: 'approved_for_runtime_adapter_gate_only' | 'blocked'
  decision: FactoryHermesResearchRuntimeAdapterApprovalRetryDecision
  reason: string
  wrapperVerificationReviewAccepted: boolean
  runtimeAdapterApproved: boolean
  runtimeAdapterExecutionApproved: boolean
  researchExecutionApproved: boolean
  hermesExecutionApproved: boolean
  promptPassingApproved: boolean
  modelCallsApproved: boolean
  networkApproved: boolean
  credentialAccessApproved: boolean
  toolsetEnablementApproved: boolean
  findingsUseApproved: boolean
  canProceedToResearchRuntimeAdapter: boolean
  canProceedToResearchExecutionApproval: boolean
  requiredNextGate: string
}

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryBlockerPlan {
  blockerPlanId: string
  toolId: 'hermes_agent'
  blockerType: 'wrapper_evidence_insufficient_for_adapter_approval_retry'
  blockers: string[]
  resolutionOptions: string[]
  recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
}

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryCheck { checkId: string, passed: boolean, message: string }
export interface FactoryHermesResearchRuntimeAdapterApprovalRetryBlocker { blockerId: string, message: string }
export interface FactoryHermesResearchRuntimeAdapterApprovalRetryWarning { warningId: string, message: string }
export interface FactoryHermesResearchRuntimeAdapterApprovalRetryValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesResearchRuntimeAdapterApprovalRetrySummary { retryId: string, status: string, decision: string, canProceedToResearchRuntimeAdapter: boolean, canRunResearchNow: boolean }

export interface FactoryHermesResearchRuntimeAdapterApprovalRetryResult {
  retryId: string
  retryKind: FactoryHermesResearchRuntimeAdapterApprovalRetryKind
  retryVersion: FactoryHermesResearchRuntimeAdapterApprovalRetryVersion
  retriedAt: string
  retriedBy: string
  toolId: 'hermes_agent'
  previousAdapterApprovalRef?: string
  wrapperVerificationReviewRef?: string
  wrapperVerificationRef?: string
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  wrapperEvidenceForAdapterRetryReview: FactoryHermesWrapperEvidenceForAdapterRetryReview
  adapterRetryLimitationsCarryForward: FactoryHermesAdapterRetryLimitationsCarryForward
  adapterRetryRiskDispositionRegister: FactoryHermesAdapterRetryRiskDispositionRegister
  approvedResearchRuntimeAdapterGateEnvelope?: FactoryHermesApprovedResearchRuntimeAdapterGateEnvelope
  researchRuntimeAdapterApprovalRetryReceipt: FactoryHermesResearchRuntimeAdapterApprovalRetryReceipt
  hermesResearchRuntimeAdapterApprovalRetryDecision: FactoryHermesResearchRuntimeAdapterApprovalRetryDecisionRecord
  retryBlockerPlan?: FactoryHermesResearchRuntimeAdapterApprovalRetryBlockerPlan
  checks: FactoryHermesResearchRuntimeAdapterApprovalRetryCheck[]
  blockers: FactoryHermesResearchRuntimeAdapterApprovalRetryBlocker[]
  warnings: FactoryHermesResearchRuntimeAdapterApprovalRetryWarning[]
  status: FactoryHermesResearchRuntimeAdapterApprovalRetryStatus
  decision: FactoryHermesResearchRuntimeAdapterApprovalRetryDecision
  adapterApprovalRetryStatus: 'approved_for_runtime_adapter_gate_only' | 'blocked'
  runtimeAdapterApproved: boolean
  runtimeAdapterExecutionApproved: boolean
  researchExecutionApproved: boolean
  hermesExecutionApproved: boolean
  promptPassingApproved: boolean
  modelCallsApproved: boolean
  networkApproved: boolean
  credentialAccessApproved: boolean
  toolsetEnablementApproved: boolean
  findingsUseApproved: boolean
  canProceedToResearchRuntimeAdapter: boolean
  canProceedToResearchExecutionApproval: boolean
  canProceedToKeepHermesResearchBlockedDecision: boolean
  canRunResearchNow: boolean
  canExecuteHermesNow: boolean
  canPassPromptNow: boolean
  canUseNetworkNow: boolean
  canUseCredentialsNow: boolean
  canReadEnvSecretsNow: boolean
  canCallModelsNow: boolean
  canEnableToolsetsNow: boolean
  canMutateFilesystemNow: boolean
  canUseFindings: boolean
  recommendedNextStep: string
}
