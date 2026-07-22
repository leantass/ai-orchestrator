export type FactoryHermesResearchExecutionApprovalVersion = '1.0'
export type FactoryHermesResearchExecutionApprovalKind = 'factory-hermes-research-execution-approval'
export type FactoryHermesResearchExecutionApprovalStatus = 'research_execution_approval_blocked'
export type FactoryHermesResearchExecutionApprovalDecision = 'hermes_research_execution_approval_blocked_missing_runtime_selections' | 'hermes_research_execution_approval_blocked_invalid_boundary'
export type FactoryHermesResearchExecutionApprovalStatusValue = 'not_approved'

export interface FactoryHermesResearchExecutionApprovalInput {
  approvedAt: string
  approvedBy: string
  humanApprovalRef?: string
  researchExecutionBoundaryPlanningResult?: any
  policyPlanningResults?: Record<string, any>
  approvalPolicy?: Partial<FactoryHermesResearchExecutionApprovalPolicy>
  approvalNotes?: string
}

export interface FactoryHermesResearchExecutionApprovalPolicy {
  requireBoundaryPlanning: boolean
  requireAllPoliciesConsolidated: boolean
  requireApprovalGateCanEvaluate: boolean
  requireNoMissingRuntimeSelectionsForExecutionApproval: boolean
  requireHumanFinalApprovalForExecution: boolean
  requireRuntimeSelectionPlanningBeforeRuntimeAdapter: boolean
  requireNotApprovedWhenSelectionsMissing: boolean
  requireNoExecutionInThisGate: boolean
  requireNoPromptPassingInThisGate: boolean
  requireNoNetworkInThisGate: boolean
  requireNoCredentialsInThisGate: boolean
  requireNoModelCallsInThisGate: boolean
  requireNoToolsetEnablementInThisGate: boolean
  requireNoFilesystemMutationInThisGate: boolean
  forbidExecutionApprovalWithMissingSelections: boolean
  forbidRuntimeAdapterApprovalInThisGateWhenBlocked: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesResearchExecutionApprovalCheck { checkId: string; message: string }
export interface FactoryHermesResearchExecutionApprovalBlocker { blockerId: string; message: string; sourceMissingSelectionId?: string }
export interface FactoryHermesResearchExecutionApprovalWarning { warningId: string; message: string }

export interface FactoryHermesRuntimeSelectionRequirement {
  requirementId: string
  sourceMissingSelectionId: string
  requiredBefore: 'research_runtime_adapter'
  requiredByGate: string
  status: 'required_not_satisfied'
  blocksExecutionNow: true
  reason: string
  expectedFutureEvidence: string[]
}

export interface FactoryHermesResearchExecutionApprovalReceipt {
  receiptId: string
  approvalId: string
  toolId: 'hermes_agent'
  approvedBy: string
  approvedAt: string
  decision: FactoryHermesResearchExecutionApprovalDecision
  approvalStatus: FactoryHermesResearchExecutionApprovalStatusValue
  scope: 'hermes_research_execution_approval_evaluation_only'
  approvedNextGate: 'Factory Hermes Runtime Selection Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionApprovalDecisionRecord {
  decisionId: string
  toolId: 'hermes_agent'
  approvalStatus: FactoryHermesResearchExecutionApprovalStatusValue
  decision: FactoryHermesResearchExecutionApprovalDecision
  reason: 'missing_runtime_selections' | 'invalid_boundary'
  boundaryValidated: boolean
  policiesConsolidated: boolean
  executionApproved: false
  runtimeAdapterApproved: false
  runtimeSelectionPlanningApproved: boolean
  missingRuntimeSelectionCount: number
  blockerCount: number
  requiredNextGate: 'Factory Hermes Runtime Selection Planning Gate v1'
  noExecutionAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionApprovalBlockerPlan {
  blockerPlanId: string
  toolId: 'hermes_agent'
  blockerType: 'missing_runtime_selections' | 'invalid_boundary'
  blockers: FactoryHermesResearchExecutionApprovalBlocker[]
  resolutionOrder: string[]
  nextGateCandidate: 'Factory Hermes Runtime Selection Planning Gate v1'
  canProceedToRuntimeSelectionPlanning: boolean
  canProceedToResearchRuntimeAdapter: false
  executionRemainsBlocked: true
}

export interface FactoryHermesResearchExecutionApprovalResult {
  approvalId: string
  approvalKind: FactoryHermesResearchExecutionApprovalKind
  approvalVersion: FactoryHermesResearchExecutionApprovalVersion
  approvedAt: string
  approvedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  boundaryDecisionRef?: string
  priorPolicySummary: string[]
  approvalChecks: FactoryHermesResearchExecutionApprovalCheck[]
  approvalBlockers: FactoryHermesResearchExecutionApprovalBlocker[]
  approvalWarnings: FactoryHermesResearchExecutionApprovalWarning[]
  runtimeSelectionRequirements: FactoryHermesRuntimeSelectionRequirement[]
  researchExecutionApprovalReceipt: FactoryHermesResearchExecutionApprovalReceipt
  hermesResearchExecutionApprovalDecision: FactoryHermesResearchExecutionApprovalDecisionRecord
  researchExecutionApprovalBlockerPlan: FactoryHermesResearchExecutionApprovalBlockerPlan
  status: FactoryHermesResearchExecutionApprovalStatus
  decision: FactoryHermesResearchExecutionApprovalDecision
  approvalStatus: FactoryHermesResearchExecutionApprovalStatusValue
  canProceedToRuntimeSelectionPlanning: boolean
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

export interface FactoryHermesResearchExecutionApprovalValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesResearchExecutionApprovalSummary {
  approvalId: string
  status: FactoryHermesResearchExecutionApprovalStatus
  decision: FactoryHermesResearchExecutionApprovalDecision
  approvalStatus: FactoryHermesResearchExecutionApprovalStatusValue
  missingRuntimeSelectionCount: number
  runtimeSelectionRequirementCount: number
  canProceedToRuntimeSelectionPlanning: boolean
  canProceedToResearchRuntimeAdapter: false
  canRunResearchNow: false
  nextStep: string
}
