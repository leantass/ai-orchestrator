export type FactoryHermesResearchExecutionPolicyChainPlanningVersion = '1.0'
export type FactoryHermesResearchExecutionPolicyChainPlanningKind = 'factory-hermes-research-execution-policy-chain-planning'
export type FactoryHermesResearchExecutionPolicyChainPlanningStatus = 'policy_chain_plan_created' | 'blocked'
export type FactoryHermesResearchExecutionPolicyChainPlanningDecision =
  | 'hermes_research_execution_policy_chain_plan_created'
  | 'blocked_missing_deep_source_review'
  | 'blocked_deep_source_review_not_policy_chain'
  | 'blocked_research_execution_planning_not_manual_review'
  | 'blocked_unsafe_prior_execution_state'

export interface FactoryHermesResearchExecutionPolicyChainPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  researchExecutionPlanningResult?: any
  deepSourceReview?: any
  commandShapeReview?: any
  policy?: Partial<FactoryHermesResearchExecutionPolicyChainPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesResearchExecutionPolicyChainPlanningPolicy {
  requireManualReviewPlanningInput: boolean
  requireDeepSourceKeepBlockedRecommendation: boolean
  requireOneshotRequiresPolicyChain: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidPromptPassingInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidCredentialsInThisGate: boolean
  forbidModelCallsInThisGate: boolean
}

export interface FactoryHermesResearchExecutionPolicyItem {
  policyId: string
  policyName: string
  purpose: string
  requiredDecisions: string[]
  missingData: string[]
  futureGate: string
}

export interface FactoryHermesResearchExecutionPolicyGatePlan {
  gateId: string
  gateName: string
  purpose: string
  inputs: string[]
  outputs: string[]
  allowedActions: string[]
  forbiddenActions: string[]
  riskItControls: string
  nextGate?: string
}

export interface FactoryHermesResearchExecutionPolicyChainPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesResearchExecutionPolicyChainPlanningDecision
  scope: 'hermes_research_execution_policy_chain_planning_only'
  approvedNextGate: 'Factory Hermes Prompt Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionPolicyChainPlan {
  planId: string
  toolId: 'hermes_agent'
  sourceDecisionRef: string
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  executionModeTarget: 'future_bounded_oneshot'
  requiredPolicies: FactoryHermesResearchExecutionPolicyItem[]
  proposedGateSequence: FactoryHermesResearchExecutionPolicyGatePlan[]
  globalConstraints: {
    noExecutionUntilAllPoliciesApproved: true
    noPromptUntilPromptPolicyApproved: true
    noCredentialsUntilCredentialsPolicyApproved: true
    noNetworkUntilNetworkPolicyApproved: true
    noModelsUntilModelProviderPolicyApproved: true
    noToolsetsUntilToolsetsPolicyApproved: true
    noFindingsUntilResultIngestionAndJEFEReview: true
  }
  recommendedDefault: 'KEEP_BLOCKED_UNTIL_POLICY_CHAIN'
  canProceedToPromptPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
}

export interface FactoryHermesResearchExecutionPolicyChainPlanningCheck { checkId: string; message: string }
export interface FactoryHermesResearchExecutionPolicyChainPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesResearchExecutionPolicyChainPlanningWarning { warningId: string; message: string }

export interface FactoryHermesResearchExecutionPolicyChainPlanningResult {
  planningId: string
  planningKind: FactoryHermesResearchExecutionPolicyChainPlanningKind
  planningVersion: FactoryHermesResearchExecutionPolicyChainPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  currentCommandShape: 'oneshot_real_with_provider_model'
  currentExecutionStatus: 'blocked_until_policy_chain'
  requiredPolicies: FactoryHermesResearchExecutionPolicyItem[]
  proposedGateSequence: FactoryHermesResearchExecutionPolicyGatePlan[]
  researchExecutionPolicyChainPlanningReceipt?: FactoryHermesResearchExecutionPolicyChainPlanningReceipt
  hermesResearchExecutionPolicyChainPlan?: FactoryHermesResearchExecutionPolicyChainPlan
  checks: FactoryHermesResearchExecutionPolicyChainPlanningCheck[]
  blockers: FactoryHermesResearchExecutionPolicyChainPlanningBlocker[]
  warnings: FactoryHermesResearchExecutionPolicyChainPlanningWarning[]
  status: FactoryHermesResearchExecutionPolicyChainPlanningStatus
  decision: FactoryHermesResearchExecutionPolicyChainPlanningDecision
  canProceedToPromptPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  canExecuteHermesNow: false
  canPassPromptNow: false
  canUseNetworkNow: false
  canUseCredentialsNow: false
  canCallModelsNow: false
  canUseFindings: false
  recommendedNextStep: string
}

export interface FactoryHermesResearchExecutionPolicyChainPlanningValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface FactoryHermesResearchExecutionPolicyChainPlanningSummary {
  planningId: string
  status: FactoryHermesResearchExecutionPolicyChainPlanningStatus
  decision: FactoryHermesResearchExecutionPolicyChainPlanningDecision
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  requiredPolicyCount: number
  proposedGateCount: number
  canProceedToPromptPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  nextStep: string
}
