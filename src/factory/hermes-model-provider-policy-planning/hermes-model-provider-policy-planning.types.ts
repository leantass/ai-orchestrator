export type FactoryHermesModelProviderPolicyPlanningVersion = '1.0'
export type FactoryHermesModelProviderPolicyPlanningKind = 'factory-hermes-model-provider-policy-planning'
export type FactoryHermesModelProviderPolicyPlanningStatus = 'model_provider_policy_plan_created' | 'blocked'
export type FactoryHermesModelProviderPolicyPlanningDecision =
  | 'hermes_model_provider_policy_plan_created'
  | 'blocked_missing_prompt_policy_planning'
  | 'blocked_prompt_policy_not_ready_for_model_provider_policy'
  | 'blocked_policy_chain_not_ready_for_model_provider_policy'
  | 'blocked_missing_provider_source_inspection'
  | 'blocked_deep_source_review_not_policy_chain'
  | 'blocked_unsafe_prior_execution_state'

export interface FactoryHermesModelProviderPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  promptPolicyPlanningResult?: any
  policyChainPlanningResult?: any
  deepSourceReview?: any
  providerSourceInspection?: any
  policy?: Partial<FactoryHermesModelProviderPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesModelProviderPolicyPlanningPolicy {
  requirePromptPolicyPlanning: boolean
  requirePolicyChainPlanning: boolean
  requireProviderSourceInspection: boolean
  requireProviderCandidates: boolean
  requireExplicitProviderInFutureApproval: boolean
  requireExplicitModelInFutureApproval: boolean
  requireNoImplicitEnvProvider: boolean
  requireNoImplicitEnvModel: boolean
  requireNoDefaultFallbackProvider: boolean
  requireNoWildcardProvider: boolean
  requireNoWildcardModel: boolean
  requireCredentialsPolicyNext: boolean
  forbidProviderSelectionAsExecutionApproval: boolean
  forbidModelCallsInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidCredentialsInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesModelProviderCandidate {
  providerId: string
  providerName: string
  status: 'candidate_requires_credentials_policy' | 'not_available' | 'forbidden_without_explicit_approval'
  credentialRefsExpected: string[]
  modelRequired: boolean
  networkRequiredLikely: boolean
  modelCallsRequiredLikely: boolean
  canUseNow: false
  reason?: string
}

export interface FactoryHermesModelProviderPolicyRule {
  ruleId: string
  ruleName: string
  requirements: string[]
}

export interface FactoryHermesModelProviderPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: {
    executable: 'hermes.exe'
    argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>']
    shell: false
  }
  providerSelection: {
    providerSelectionRequired: true
    selectedProvider: null
    selectedModel: null
    noImplicitProviderFromEnv: true
    noImplicitModelFromEnv: true
    noDefaultFallbackProvider: true
  }
  providerCandidates: FactoryHermesModelProviderCandidate[]
  modelRules: FactoryHermesModelProviderPolicyRule[]
  credentialDependency: {
    credentialsNotApprovedHere: true
    nextGate: 'Factory Hermes Credentials Policy Planning Gate v1'
  }
  networkDependency: {
    networkNotApprovedHere: true
    futureNetworkPolicyRequired: true
  }
  modelCallDependency: {
    modelCallsNotApprovedHere: true
    futureRuntimeRequiresFullChain: true
  }
  requiredNextPolicies: string[]
  canProceedToCredentialsPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canCallModelsNow: false
}

export interface FactoryHermesModelProviderPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesModelProviderPolicyPlanningDecision
  scope: 'hermes_model_provider_policy_planning_only'
  approvedNextGate: 'Factory Hermes Credentials Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesModelProviderPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesModelProviderPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesModelProviderPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesModelProviderPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesModelProviderPolicyPlanningKind
  planningVersion: FactoryHermesModelProviderPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL>'
  providerCandidates: FactoryHermesModelProviderCandidate[]
  selectedProviderCandidate: null | 'provider_selection_required'
  selectedModelCandidate: null | 'model_selection_required'
  modelProviderPolicyPlanningReceipt?: FactoryHermesModelProviderPolicyPlanningReceipt
  hermesModelProviderPolicyPlanCandidate?: FactoryHermesModelProviderPolicyPlanCandidate
  checks: FactoryHermesModelProviderPolicyPlanningCheck[]
  blockers: FactoryHermesModelProviderPolicyPlanningBlocker[]
  warnings: FactoryHermesModelProviderPolicyPlanningWarning[]
  status: FactoryHermesModelProviderPolicyPlanningStatus
  decision: FactoryHermesModelProviderPolicyPlanningDecision
  canProceedToCredentialsPolicyPlanning: boolean
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

export interface FactoryHermesModelProviderPolicyPlanningValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface FactoryHermesModelProviderPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesModelProviderPolicyPlanningStatus
  decision: FactoryHermesModelProviderPolicyPlanningDecision
  providerCandidateCount: number
  providerSelectionRequired: boolean
  selectedProvider: null
  canProceedToCredentialsPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canCallModelsNow: false
  nextStep: string
}
