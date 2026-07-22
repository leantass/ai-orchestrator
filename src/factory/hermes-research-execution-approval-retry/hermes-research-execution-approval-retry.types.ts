export type FactoryHermesResearchExecutionApprovalRetryVersion = '1.0'
export type FactoryHermesResearchExecutionApprovalRetryKind = 'factory-hermes-research-execution-approval-retry'
export type FactoryHermesResearchExecutionApprovalRetryStatus = 'research_execution_approval_retry_blocked' | 'blocked'
export type FactoryHermesResearchExecutionApprovalRetryDecision = 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required' | 'blocked_invalid_runtime_selection_decision'

export interface FactoryHermesResearchExecutionApprovalRetryInput {
  evaluatedAt: string
  evaluatedBy: string
  runtimeSelectionDecisionResult?: any
  runtimeSelectionPlanningResult?: any
  researchExecutionApprovalResult?: any
  researchExecutionBoundaryPlanningResult?: any
  policyPlanningResults?: Record<string, any>
  policy?: Partial<FactoryHermesResearchExecutionApprovalRetryPolicy>
  evaluationNotes?: string
}

export interface FactoryHermesResearchExecutionApprovalRetryPolicy {
  requireRuntimeSelectionDecision: boolean
  requireAllSelectionsResolvedForApprovalRetry: boolean
  requireFinalExecutionApprovalSatisfiedForRuntimeAdapter: boolean
  requireBlockWhenFinalApprovalMissing: boolean
  requireNoExecutionInThisGate: boolean
  requireNoPromptPassingInThisGate: boolean
  requireNoNetworkInThisGate: boolean
  requireNoCredentialUseInThisGate: boolean
  requireNoModelCallsInThisGate: boolean
  requireNoToolsetEnablementInThisGate: boolean
  requireNoFilesystemMutationInThisGate: boolean
  requireFinalExecutionApprovalGateNext: boolean
  forbidRuntimeAdapterApprovalInThisGateWhenFinalApprovalMissing: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesValidatedRuntimeSelections {
  prompt: { promptHash?: string; promptSentNow: false; approvedForExecutionNow: false; validationStatus: 'valid_for_final_approval_gate' }
  provider: { providerId: 'openai'; selectedNow: true; approvedForExecutionNow: false; validationStatus: 'valid_for_final_approval_gate' }
  model: { modelId: 'gpt-4o-mini'; exactStringRequired: true; approvedForExecutionNow: false; validationStatus: 'valid_for_final_approval_gate' }
  credential: { credentialRefName: 'OPENAI_API_KEY'; valueKnown: false; valueRead: false; approvedForUseNow: false; validationStatus: 'valid_reference_only_for_final_approval_gate' }
  network: { selectedHosts: ['api.openai.com']; approvedHostsNow: []; dnsResolvedNow: false; endpointsTestedNow: false; wildcardAllowed: false; arbitraryInternetAllowed: false; approvedForUseNow: false; validationStatus: 'valid_host_candidate_for_final_approval_gate' }
  toolsets: { selectedToolsetMode: 'no_toolsets_text_only'; approvedToolsetsNow: []; hiddenDefaultToolsetsForbidden: true; approvedForExecutionNow: false; validationStatus: 'valid_for_final_approval_gate_or_manual_review_if_not_supported' }
  runRoot: { selectedRunRoot: string; runRootCreatedNow: false; approvedForFutureRuntimeOnly: true; validationStatus: 'valid_for_final_approval_gate' }
  finalApproval: { approvedNow: false; validationStatus: 'missing_required_final_approval' }
}

export interface FactoryHermesFinalExecutionApprovalRequirement { requirementId: 'final_execution_approval'; status: 'required_not_satisfied'; blocksExecutionNow: true; reason: string; requiredBefore: string[]; expectedFutureEvidence: string[] }
export interface FactoryHermesResearchExecutionApprovalRetryDecisionRecord { decisionId: string; toolId: 'hermes_agent'; approvalRetryStatus: 'not_approved'; decision: FactoryHermesResearchExecutionApprovalRetryDecision; reason: 'final_execution_approval_required'; runtimeSelectionsValidated: true; finalExecutionApprovalRequired: true; finalExecutionApprovalSatisfied: false; executionApproved: false; runtimeAdapterApproved: false; researchRuntimeApproved: false; canProceedToFinalExecutionApprovalGate: true; requiredNextGate: 'Factory Hermes Final Execution Approval Gate v1'; noExecutionAuthorizedActions: string[] }
export interface FactoryHermesResearchExecutionApprovalRetryReceipt { receiptId: string; approvalRetryId: string; toolId: 'hermes_agent'; evaluatedBy: string; evaluatedAt: string; decision: FactoryHermesResearchExecutionApprovalRetryDecision; approvalRetryStatus: 'not_approved'; scope: 'hermes_research_execution_approval_retry_evaluation_only'; approvedNextGate: 'Factory Hermes Final Execution Approval Gate v1'; limitations: string[]; notAuthorizedActions: string[] }
export interface FactoryHermesResearchExecutionApprovalRetryBlockerPlan { blockerPlanId: string; toolId: 'hermes_agent'; blockerType: 'final_execution_approval_required'; blockers: ['finalExecutionApprovalMissing']; resolutionOrder: string[]; nextGateCandidate: 'Factory Hermes Final Execution Approval Gate v1'; canProceedToFinalExecutionApprovalGate: true; canProceedToResearchRuntimeAdapter: false; executionRemainsBlocked: true }
export interface FactoryHermesResearchExecutionApprovalRetryCheck { checkId: string; message: string }
export interface FactoryHermesResearchExecutionApprovalRetryBlocker { blockerId: string; message: string }
export interface FactoryHermesResearchExecutionApprovalRetryWarning { warningId: string; message: string }

export interface FactoryHermesResearchExecutionApprovalRetryResult {
  approvalRetryId: string
  approvalRetryKind: FactoryHermesResearchExecutionApprovalRetryKind
  approvalRetryVersion: FactoryHermesResearchExecutionApprovalRetryVersion
  evaluatedAt: string
  evaluatedBy: string
  toolId: 'hermes_agent'
  runtimeSelectionDecisionRef?: string
  approvalDecisionRef?: string
  boundaryDecisionRef?: string
  validatedRuntimeSelections?: FactoryHermesValidatedRuntimeSelections
  finalExecutionApprovalRequirement?: FactoryHermesFinalExecutionApprovalRequirement
  hermesResearchExecutionApprovalRetryDecision?: FactoryHermesResearchExecutionApprovalRetryDecisionRecord
  researchExecutionApprovalRetryReceipt?: FactoryHermesResearchExecutionApprovalRetryReceipt
  approvalRetryBlockerPlan?: FactoryHermesResearchExecutionApprovalRetryBlockerPlan
  checks: FactoryHermesResearchExecutionApprovalRetryCheck[]
  blockers: FactoryHermesResearchExecutionApprovalRetryBlocker[]
  warnings: FactoryHermesResearchExecutionApprovalRetryWarning[]
  status: FactoryHermesResearchExecutionApprovalRetryStatus
  decision: FactoryHermesResearchExecutionApprovalRetryDecision
  approvalRetryStatus: 'not_approved'
  runtimeSelectionsValidated: boolean
  finalExecutionApprovalRequired: boolean
  canProceedToFinalExecutionApprovalGate: boolean
  canProceedToResearchRuntimeAdapter: false
  canProceedToResearchExecutionRuntime: false
  canRunResearchNow: false
  canExecuteHermesNow: false
  canPassPromptNow: false
  canUseNetworkNow: false
  canUseCredentialsNow: false
  canReadEnvSecretsNow: false
  canCallModelsNow: false
  canEnableToolsetsNow: false
  canMutateFilesystemNow: false
  canUseFindings: false
  recommendedNextStep: string
}

export interface FactoryHermesResearchExecutionApprovalRetryValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesResearchExecutionApprovalRetrySummary { approvalRetryId: string; status: FactoryHermesResearchExecutionApprovalRetryStatus; decision: FactoryHermesResearchExecutionApprovalRetryDecision; approvalRetryStatus: 'not_approved'; runtimeSelectionsValidated: boolean; finalExecutionApprovalRequired: boolean; canProceedToFinalExecutionApprovalGate: boolean; canProceedToResearchRuntimeAdapter: false; canRunResearchNow: false; nextStep: string }
