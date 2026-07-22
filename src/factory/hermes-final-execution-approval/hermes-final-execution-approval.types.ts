export type FactoryHermesFinalExecutionApprovalVersion = '1.0'
export type FactoryHermesFinalExecutionApprovalKind = 'factory-hermes-final-execution-approval'
export type FactoryHermesFinalExecutionApprovalStatus = 'final_execution_approval_recorded' | 'blocked'
export type FactoryHermesFinalExecutionApprovalDecision = 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval' | 'blocked_invalid_approval_retry' | 'blocked_invalid_runtime_selection_decision'
export type FactoryHermesFinalExecutionApprovalStatusValue = 'approved_for_runtime_adapter_approval'

export interface FactoryHermesFinalExecutionApprovalInput {
  approvedAt: string
  approvedBy: string
  researchExecutionApprovalRetryResult?: any
  runtimeSelectionDecisionResult?: any
  policyPlanningResults?: Record<string, any>
  approval?: { finalExecutionApproved?: boolean; approvalScope?: string }
  policy?: Partial<FactoryHermesFinalExecutionApprovalPolicy>
  approvalNotes?: string
}

export interface FactoryHermesFinalExecutionApprovalPolicy {
  requireApprovalRetryBlockedByFinalApproval: boolean
  requireRuntimeSelectionDecision: boolean
  requireRuntimeSelectionsValidated: boolean
  requireFinalApprovalExplicit: boolean
  requireNextGateOnlyApproval: boolean
  requireRuntimeAdapterApprovalNext: boolean
  requireNoExecutionInThisGate: boolean
  requireNoPromptPassingInThisGate: boolean
  requireNoNetworkInThisGate: boolean
  requireNoCredentialUseInThisGate: boolean
  requireNoModelCallsInThisGate: boolean
  requireNoToolsetEnablementInThisGate: boolean
  requireNoFilesystemMutationInThisGate: boolean
  forbidRuntimeAdapterApprovalInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesApprovedRuntimeSelectionSnapshot {
  prompt: { promptHash?: string; promptRef: 'prompt_candidate_from_prompt_policy'; approvedForNextGateOnly: true; promptSentNow: false }
  provider: { providerId: 'openai'; approvedForNextGateOnly: true; providerUsedNow: false }
  model: { modelId: 'gpt-4o-mini'; exactStringRequired: true; approvedForNextGateOnly: true; modelCalledNow: false }
  credential: { credentialRefName: 'OPENAI_API_KEY'; valueKnown: false; valueRead: false; approvedForNextGateOnly: true; credentialUsedNow: false }
  network: { approvedHostsForNextGate: ['api.openai.com']; dnsResolvedNow: false; endpointsTestedNow: false; networkUsedNow: false; wildcardAllowed: false; arbitraryInternetAllowed: false }
  toolsets: { approvedToolsetModeForNextGate: 'no_toolsets_text_only'; toolsetsEnabledNow: false; hiddenDefaultToolsetsForbidden: true }
  runRoot: { approvedRunRootForNextGate: string; runRootCreatedNow: false; mustBeCreatedOnlyByApprovedRuntimeAdapter: true }
  finalApproval: { approvedNow: true; approvedForNextGateOnly: true; runtimeAdapterApprovedNow: false; executionRuntimeApprovedNow: false }
}

export interface FactoryHermesRuntimeAdapterApprovalRequirement { requirementId: 'research_runtime_adapter_approval'; status: 'required_not_satisfied'; blocksRuntimeAdapterNow: true; reason: string; requiredBefore: string[]; expectedFutureEvidence: string[] }
export interface FactoryHermesFinalExecutionApprovalDecisionRecord { decisionId: string; toolId: 'hermes_agent'; finalExecutionApprovalStatus: FactoryHermesFinalExecutionApprovalStatusValue; decision: FactoryHermesFinalExecutionApprovalDecision; reason: 'final_execution_approval_recorded_next_gate_only'; finalExecutionApproved: true; runtimeSelectionsApprovedForNextGate: true; runtimeAdapterApproved: false; researchRuntimeApproved: false; executionApprovedNow: false; canProceedToResearchRuntimeAdapterApproval: true; requiredNextGate: 'Factory Hermes Research Runtime Adapter Approval Gate v1'; noExecutionAuthorizedActions: string[] }
export interface FactoryHermesFinalExecutionApprovalReceipt { receiptId: string; finalApprovalId: string; toolId: 'hermes_agent'; approvedBy: string; approvedAt: string; decision: FactoryHermesFinalExecutionApprovalDecision; finalExecutionApprovalStatus: FactoryHermesFinalExecutionApprovalStatusValue; scope: 'hermes_final_execution_approval_for_next_gate_only'; approvedNextGate: 'Factory Hermes Research Runtime Adapter Approval Gate v1'; limitations: string[]; notAuthorizedActions: string[] }
export interface FactoryHermesFinalExecutionApprovalCheck { checkId: string; message: string }
export interface FactoryHermesFinalExecutionApprovalBlocker { blockerId: string; message: string }
export interface FactoryHermesFinalExecutionApprovalWarning { warningId: string; message: string }

export interface FactoryHermesFinalExecutionApprovalResult {
  finalApprovalId: string
  finalApprovalKind: FactoryHermesFinalExecutionApprovalKind
  finalApprovalVersion: FactoryHermesFinalExecutionApprovalVersion
  approvedAt: string
  approvedBy: string
  toolId: 'hermes_agent'
  approvalRetryDecisionRef?: string
  runtimeSelectionDecisionRef?: string
  approvedRuntimeSelectionSnapshot?: FactoryHermesApprovedRuntimeSelectionSnapshot
  runtimeAdapterApprovalRequirement?: FactoryHermesRuntimeAdapterApprovalRequirement
  finalExecutionApprovalReceipt?: FactoryHermesFinalExecutionApprovalReceipt
  hermesFinalExecutionApprovalDecision?: FactoryHermesFinalExecutionApprovalDecisionRecord
  checks: FactoryHermesFinalExecutionApprovalCheck[]
  blockers: FactoryHermesFinalExecutionApprovalBlocker[]
  warnings: FactoryHermesFinalExecutionApprovalWarning[]
  status: FactoryHermesFinalExecutionApprovalStatus
  decision: FactoryHermesFinalExecutionApprovalDecision
  finalExecutionApprovalStatus: FactoryHermesFinalExecutionApprovalStatusValue
  canProceedToResearchRuntimeAdapterApproval: boolean
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

export interface FactoryHermesFinalExecutionApprovalValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesFinalExecutionApprovalSummary { finalApprovalId: string; status: FactoryHermesFinalExecutionApprovalStatus; decision: FactoryHermesFinalExecutionApprovalDecision; finalExecutionApprovalStatus: FactoryHermesFinalExecutionApprovalStatusValue; canProceedToResearchRuntimeAdapterApproval: boolean; canProceedToResearchRuntimeAdapter: false; canRunResearchNow: false; nextStep: string }
