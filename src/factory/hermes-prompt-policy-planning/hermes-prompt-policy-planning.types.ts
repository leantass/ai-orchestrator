export type FactoryHermesPromptPolicyPlanningVersion = '1.0'
export type FactoryHermesPromptPolicyPlanningKind = 'factory-hermes-prompt-policy-planning'
export type FactoryHermesPromptPolicyPlanningStatus = 'prompt_policy_plan_created' | 'blocked'
export type FactoryHermesPromptPolicyPlanningDecision =
  | 'hermes_prompt_policy_plan_created'
  | 'blocked_missing_policy_chain_planning'
  | 'blocked_policy_chain_not_ready_for_prompt_policy'
  | 'blocked_deep_source_review_not_policy_chain'
  | 'blocked_unsafe_prior_execution_state'

export interface FactoryHermesPromptPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  policyChainPlanningResult?: any
  deepSourceReview?: any
  commandShapeReview?: any
  policy?: Partial<FactoryHermesPromptPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesPromptPolicyPlanningPolicy {
  requirePolicyChainPlanning: boolean
  requirePromptPolicyFirstInChain: boolean
  requireHarmlessPromptCandidate: boolean
  requirePromptCandidateOnly: boolean
  requirePromptLengthLimit: boolean
  requirePromptContentAllowlist: boolean
  requirePromptContentBlocklist: boolean
  requireNoSecrets: boolean
  requireNoPersonalData: boolean
  requireNoUrls: boolean
  requireNoToolRequests: boolean
  requireNoNetworkRequests: boolean
  requireNoFilesystemRequests: boolean
  requireNoCredentialRequests: boolean
  requirePromptInjectionDefense: boolean
  requireModelProviderPolicyNext: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidCredentialsInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidUsingPromptAsFindings: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesPromptPolicyRule {
  ruleId: string
  ruleName: string
  requirements: string[]
}

export interface FactoryHermesPromptPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: {
    executable: 'hermes.exe'
    argsTemplate: ['--oneshot', '<PROMPT>']
    shell: false
    promptPosition: 'argv[1]'
  }
  promptCandidate: {
    text: string
    candidateOnly: true
    notApprovedForExecutionYet: true
    maxChars: number
    maxLines: number
    sha256: string
  }
  promptRules: {
    purpose: FactoryHermesPromptPolicyRule
    length: FactoryHermesPromptPolicyRule
    allowlist: string[]
    blocklist: string[]
    injectionDefense: string[]
    loggingPolicy: string[]
  }
  requiredNextPolicies: string[]
  constraints: {
    noPromptExecutionNow: true
    noHermesExecutionNow: true
    noResearchNow: true
    noFindingsNow: true
    promptCannotContainSecrets: true
    promptCannotRequestTools: true
    promptCannotRequestNetwork: true
    promptCannotRequestFilesystem: true
  }
  canProceedToModelProviderPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canPassPromptNow: false
}

export interface FactoryHermesPromptPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesPromptPolicyPlanningDecision
  scope: 'hermes_prompt_policy_planning_only'
  approvedNextGate: 'Factory Hermes Model Provider Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesPromptPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesPromptPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesPromptPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesPromptPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesPromptPolicyPlanningKind
  planningVersion: FactoryHermesPromptPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>"'
  promptPolicyPlanningReceipt?: FactoryHermesPromptPolicyPlanningReceipt
  hermesPromptPolicyPlanCandidate?: FactoryHermesPromptPolicyPlanCandidate
  checks: FactoryHermesPromptPolicyPlanningCheck[]
  blockers: FactoryHermesPromptPolicyPlanningBlocker[]
  warnings: FactoryHermesPromptPolicyPlanningWarning[]
  status: FactoryHermesPromptPolicyPlanningStatus
  decision: FactoryHermesPromptPolicyPlanningDecision
  canProceedToModelProviderPolicyPlanning: boolean
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

export interface FactoryHermesPromptPolicyPlanningValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface FactoryHermesPromptPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesPromptPolicyPlanningStatus
  decision: FactoryHermesPromptPolicyPlanningDecision
  promptCandidateHash?: string
  promptMaxChars?: number
  canProceedToModelProviderPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canPassPromptNow: false
  nextStep: string
}
