export type FactoryHermesToolsetDisableVerificationApprovalVersion = '1.0'
export type FactoryHermesToolsetDisableVerificationApprovalKind = 'factory-hermes-toolset-disable-verification-approval'
export type FactoryHermesToolsetDisableVerificationApprovalStatus = 'toolset_disable_verification_approval_granted' | 'toolset_disable_verification_approval_blocked' | 'blocked'
export type FactoryHermesToolsetDisableVerificationApprovalDecision = 'hermes_toolset_disable_verification_approved_for_controlled_probe_runtime_candidate' | 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape' | 'blocked_invalid_toolset_disable_verification_planning' | 'blocked_invalid_research_runtime_adapter_approval'
export type FactoryHermesToolsetDisableVerificationApprovalStatusValue = 'approved_for_controlled_probe_runtime_candidate' | 'blocked'

export interface FactoryHermesToolsetDisableVerificationApprovalInput {
  evaluatedAt: string
  evaluatedBy: string
  toolsetDisableVerificationPlanningResult?: any
  researchRuntimeAdapterApprovalResult?: any
  finalExecutionApprovalResult?: any
  runtimeSelectionDecisionResult?: any
  toolsetsPolicyPlanningResult?: any
  sourceSafetyAssessment?: any
  policy?: Partial<FactoryHermesToolsetDisableVerificationApprovalPolicy>
  approvalNotes?: string
}

export interface FactoryHermesToolsetDisableVerificationApprovalPolicy {
  requirePlanningAllowsApproval: boolean
  requireAdapterApprovalBlockedByToolset: boolean
  requireSafeProbeShapeProven: boolean
  requireProbeWithoutPrompt: boolean
  requireProbeCannotReachProviderModelNetwork: boolean
  requireNoCredentialRead: boolean
  requireValidationBeforeAIAgent: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidOneshotExecutionInThisGate: boolean
  forbidPromptPassingInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidResearchRuntimeAdapterApprovalInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesToolsetDisableVerificationApprovalReceipt { receiptId: string; approvalId: string; toolId: 'hermes_agent'; evaluatedBy: string; evaluatedAt: string; decision: FactoryHermesToolsetDisableVerificationApprovalDecision; approvalStatus: FactoryHermesToolsetDisableVerificationApprovalStatusValue; scope: 'hermes_toolset_disable_verification_approval_only'; approvedNextGate: string; limitations: string[]; notAuthorizedActions: string[] }
export interface FactoryHermesToolsetDisableVerificationApprovalDecisionRecord { decisionId: string; toolId: 'hermes_agent'; approvalStatus: FactoryHermesToolsetDisableVerificationApprovalStatusValue; decision: FactoryHermesToolsetDisableVerificationApprovalDecision; reason: string; probeEnvelopeCreated: boolean; executionApprovedNow: false; runtimeAdapterApproved: false; canProceedToToolsetDisableVerificationRuntimeAdapter: boolean; canProceedToRuntimeSelectionRevisionPlanning: boolean }
export interface FactoryHermesControlledToolsetProbeEnvelope { envelopeId: string; probeType: 'toolset_disable_cli_validation_probe'; objective: string; executable: string; cwd: string; shell: false; executeNow: false; promptAllowed: false; modelCallsAllowed: false; networkAllowed: false; credentialsAllowed: false; toolsetsEnabled: false; expectedToReachAIAgent: false; expectedToReachProvider: false; timeoutMs: number; autoRetryAllowed: false; outputUseAsFindings: false; expectedClassification: string[]; exactCommandCandidate: string[]; safetyEvidenceRefs: string[]; nextGate: string }
export interface FactoryHermesToolsetDisableVerificationApprovalBlockerPlan { blockerPlanId: string; toolId: 'hermes_agent'; blockerType: 'no_safe_toolset_disable_probe_shape'; blockers: string[]; resolutionOptions: string[]; recommendedConservativeNextGate: string; canProceedToRuntimeSelectionRevisionPlanning: true; canProceedToToolsetDisableVerificationRuntimeAdapter: false; canProceedToResearchRuntimeAdapterApprovalRetry: false }
export interface FactoryHermesToolsetDisableVerificationApprovalCheck { checkId: string; message: string }
export interface FactoryHermesToolsetDisableVerificationApprovalBlocker { blockerId: string; message: string }
export interface FactoryHermesToolsetDisableVerificationApprovalWarning { warningId: string; message: string }

export interface FactoryHermesToolsetDisableVerificationApprovalResult {
  approvalId: string
  approvalKind: FactoryHermesToolsetDisableVerificationApprovalKind
  approvalVersion: FactoryHermesToolsetDisableVerificationApprovalVersion
  evaluatedAt: string
  evaluatedBy: string
  toolId: 'hermes_agent'
  planningDecisionRef?: string
  adapterApprovalDecisionRef?: string
  sourceSafetyAssessment: any
  controlledToolsetProbeEnvelope?: FactoryHermesControlledToolsetProbeEnvelope
  toolsetDisableVerificationApprovalDecision: FactoryHermesToolsetDisableVerificationApprovalDecisionRecord
  toolsetDisableVerificationApprovalReceipt: FactoryHermesToolsetDisableVerificationApprovalReceipt
  approvalBlockerPlan?: FactoryHermesToolsetDisableVerificationApprovalBlockerPlan
  checks: FactoryHermesToolsetDisableVerificationApprovalCheck[]
  blockers: FactoryHermesToolsetDisableVerificationApprovalBlocker[]
  warnings: FactoryHermesToolsetDisableVerificationApprovalWarning[]
  status: FactoryHermesToolsetDisableVerificationApprovalStatus
  decision: FactoryHermesToolsetDisableVerificationApprovalDecision
  approvalStatus: FactoryHermesToolsetDisableVerificationApprovalStatusValue
  canProceedToToolsetDisableVerificationRuntimeAdapter: boolean
  canProceedToRuntimeSelectionRevisionPlanning: boolean
  canProceedToResearchRuntimeAdapterApprovalRetry: false
  canProceedToResearchRuntimeAdapter: false
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

export interface FactoryHermesToolsetDisableVerificationApprovalValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesToolsetDisableVerificationApprovalSummary { approvalId: string; status: FactoryHermesToolsetDisableVerificationApprovalStatus; decision: FactoryHermesToolsetDisableVerificationApprovalDecision; approvalStatus: FactoryHermesToolsetDisableVerificationApprovalStatusValue; safeProbeShapeProven: boolean; canProceedToToolsetDisableVerificationRuntimeAdapter: boolean; canProceedToRuntimeSelectionRevisionPlanning: boolean; canProceedToResearchRuntimeAdapterApprovalRetry: false; canRunResearchNow: false; nextStep: string }
