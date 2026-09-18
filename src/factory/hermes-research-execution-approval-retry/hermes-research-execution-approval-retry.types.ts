export type FactoryHermesResearchExecutionApprovalRetryVersion = '1.0'
export type FactoryHermesResearchExecutionApprovalRetryKind = 'factory-hermes-research-execution-approval-retry'
export type FactoryHermesResearchExecutionApprovalRetryStatus = 'research_execution_approval_retry_granted' | 'research_execution_approval_retry_blocked'
export type FactoryHermesResearchExecutionApprovalRetryDecision = 'hermes_research_execution_approval_retry_approved_for_final_execution_approval_gate' | 'hermes_research_execution_approval_retry_blocked_adapter_evidence_insufficient'

export interface FactoryHermesResearchExecutionApprovalRetryPolicy { [key: string]: boolean }
export interface FactoryHermesResearchExecutionApprovalRetryInput {
  retriedAt: string
  retriedBy: string
  researchRuntimeAdapterResult?: any
  adapterApprovalRetryResult?: any
  wrapperVerificationReviewResult?: any
  wrapperVerificationResult?: any
  runtimeSelectionDecisionResult?: any
  finalExecutionApprovalResult?: any
  policy?: Partial<FactoryHermesResearchExecutionApprovalRetryPolicy>
}

export interface FactoryHermesAdapterEvidenceForExecutionApprovalRetryReview {
  adapterPrepared: boolean
  adapterStatus: 'prepared_code_only_not_executed' | string
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  wrapperBoundaryIntegrated: boolean
  adapterCommandEnvelopeBuilt: boolean
  adapterSafetyManifestBuilt: boolean
  adapterNonExecutableCommandEnvelopeVerified: boolean
  commandString: null
  argvEmpty: boolean
  envEmpty: boolean
  promptNull: boolean
  tempConfigPathNull: boolean
  runRootNull: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  researchExecutionApproved: boolean
  hermesExecutionApproved: boolean
  promptPassingApproved: boolean
  modelCallsApproved: boolean
  networkApproved: boolean
  credentialAccessApproved: boolean
  toolsetEnablementApproved: boolean
  findingsUseApproved: boolean
  evidenceDoesNotExecuteRuntime: boolean
  evidenceDoesNotApproveResearch: boolean
  evidenceSupportsExecutionApprovalRetry: boolean
  evidenceSummary: string[]
}

export interface FactoryHermesExecutionApprovalRetryLimitationsCarryForward {
  limitations: string[]
  limitationsAcceptableForExecutionApprovalGate: boolean
  limitationsBlockImmediateRuntimeExecution: boolean
  limitationsBlockImmediateResearchExecution: boolean
  limitationsBlockFindingsUse: boolean
}

export interface FactoryHermesExecutionApprovalRetryRiskDisposition {
  riskId: string
  severity: 'high' | 'critical'
  disposition: 'accepted_for_execution_approval_gate_only'
  mitigation: string
  blocksExecutionApprovalGate: boolean
  blocksRuntimeExecution: boolean
  blocksResearchExecution: boolean
}

export interface FactoryHermesExecutionApprovalRetryRiskDispositionRegister {
  registerId: string
  dispositions: FactoryHermesExecutionApprovalRetryRiskDisposition[]
}

export interface FactoryHermesApprovedResearchExecutionApprovalGateEnvelope {
  envelopeId: string
  toolId: 'hermes_agent'
  approvedFor: 'research_execution_approval_gate_only'
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  sourceAdapterRef: 'research-runtime-adapter-result.json'
  sourceApprovalRetryRef: 'research-execution-approval-retry-result.json'
  targetNextGate: 'Factory Hermes Research Execution Approval Gate v1'
  purpose: string
  allowedInNextGate: string[]
  forbiddenEvenInNextGate: string[]
  flags: Record<string, boolean>
  recommendedNextGate: 'Factory Hermes Research Execution Approval Gate v1'
}

export interface FactoryHermesResearchExecutionApprovalRetryReceipt {
  receiptId: string
  retryId: string
  toolId: 'hermes_agent'
  retriedBy: string
  retriedAt: string
  decision: FactoryHermesResearchExecutionApprovalRetryDecision
  executionApprovalRetryStatus: 'approved_for_research_execution_approval_gate_only' | 'blocked'
  scope: 'hermes_research_execution_approval_retry_only'
  approvedNextGate: string
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionApprovalRetryDecisionRecord {
  decisionId: string
  toolId: 'hermes_agent'
  executionApprovalRetryStatus: 'approved_for_research_execution_approval_gate_only' | 'blocked'
  decision: FactoryHermesResearchExecutionApprovalRetryDecision
  reason: string
  adapterPrepared: boolean
  researchExecutionApprovalGateAllowed: boolean
  researchExecutionApprovedNow: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  hermesExecutionAllowedNow: boolean
  promptPassingAllowedNow: boolean
  modelCallsAllowedNow: boolean
  networkAllowedNow: boolean
  credentialAccessAllowedNow: boolean
  toolsetEnablementAllowedNow: boolean
  findingsUseAllowedNow: boolean
  canProceedToResearchExecutionApproval: boolean
  requiredNextGate: string
}

export interface FactoryHermesResearchExecutionApprovalRetryBlockerPlan {
  blockerPlanId: string
  toolId: 'hermes_agent'
  blockerType: 'adapter_evidence_insufficient_for_execution_approval_retry'
  blockers: string[]
  resolutionOptions: string[]
  recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
}

export interface FactoryHermesResearchExecutionApprovalRetryCheck { checkId: string, passed: boolean, message: string }
export interface FactoryHermesResearchExecutionApprovalRetryBlocker { blockerId: string, message: string }
export interface FactoryHermesResearchExecutionApprovalRetryWarning { warningId: string, message: string }
export interface FactoryHermesResearchExecutionApprovalRetryValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesResearchExecutionApprovalRetrySummary { retryId: string, status: string, decision: string, canProceedToResearchExecutionApproval: boolean, canRunResearchNow: boolean }

export interface FactoryHermesResearchExecutionApprovalRetryResult {
  retryId: string
  retryKind: FactoryHermesResearchExecutionApprovalRetryKind
  retryVersion: FactoryHermesResearchExecutionApprovalRetryVersion
  retriedAt: string
  retriedBy: string
  toolId: 'hermes_agent'
  researchRuntimeAdapterRef?: string
  adapterApprovalRetryRef?: string
  wrapperVerificationReviewRef?: string
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  adapterEvidenceForExecutionApprovalRetryReview: FactoryHermesAdapterEvidenceForExecutionApprovalRetryReview
  executionApprovalRetryLimitationsCarryForward: FactoryHermesExecutionApprovalRetryLimitationsCarryForward
  executionApprovalRetryRiskDispositionRegister: FactoryHermesExecutionApprovalRetryRiskDispositionRegister
  approvedResearchExecutionApprovalGateEnvelope?: FactoryHermesApprovedResearchExecutionApprovalGateEnvelope
  researchExecutionApprovalRetryReceipt: FactoryHermesResearchExecutionApprovalRetryReceipt
  hermesResearchExecutionApprovalRetryDecision: FactoryHermesResearchExecutionApprovalRetryDecisionRecord
  retryBlockerPlan?: FactoryHermesResearchExecutionApprovalRetryBlockerPlan
  checks: FactoryHermesResearchExecutionApprovalRetryCheck[]
  blockers: FactoryHermesResearchExecutionApprovalRetryBlocker[]
  warnings: FactoryHermesResearchExecutionApprovalRetryWarning[]
  status: FactoryHermesResearchExecutionApprovalRetryStatus
  decision: FactoryHermesResearchExecutionApprovalRetryDecision
  executionApprovalRetryStatus: 'approved_for_research_execution_approval_gate_only' | 'blocked'
  researchExecutionApprovalGateAllowed: boolean
  researchExecutionApprovedNow: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  hermesExecutionAllowedNow: boolean
  promptPassingAllowedNow: boolean
  modelCallsAllowedNow: boolean
  networkAllowedNow: boolean
  credentialAccessAllowedNow: boolean
  toolsetEnablementAllowedNow: boolean
  findingsUseAllowedNow: boolean
  canProceedToResearchExecutionApproval: boolean
  canProceedToResearchRuntimeAdapterExecution: boolean
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
