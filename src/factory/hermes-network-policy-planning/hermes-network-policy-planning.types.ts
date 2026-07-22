export type FactoryHermesNetworkPolicyPlanningVersion = '1.0'
export type FactoryHermesNetworkPolicyPlanningKind = 'factory-hermes-network-policy-planning'
export type FactoryHermesNetworkPolicyPlanningStatus = 'network_policy_plan_created' | 'blocked'
export type FactoryHermesNetworkPolicyPlanningDecision =
  | 'hermes_network_policy_plan_created'
  | 'blocked_missing_credentials_policy_planning'
  | 'blocked_credentials_policy_not_ready_for_network_policy'
  | 'blocked_model_provider_policy_not_ready_for_network_policy'
  | 'blocked_policy_chain_missing_network_policy'
  | 'blocked_missing_network_source_inspection'
  | 'blocked_network_was_used_during_planning'

export interface FactoryHermesNetworkPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  credentialsPolicyPlanningResult?: any
  modelProviderPolicyPlanningResult?: any
  promptPolicyPlanningResult?: any
  policyChainPlanningResult?: any
  deepSourceReview?: any
  networkSourceInspection?: any
  policy?: Partial<FactoryHermesNetworkPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesNetworkPolicyPlanningPolicy {
  requireCredentialsPolicyPlanning: boolean
  requireModelProviderPolicyPlanning: boolean
  requireNetworkSourceInspection: boolean
  requireNetworkSurfaceCandidates: boolean
  requireNoNetworkNow: boolean
  requireAllowedHostsNowEmpty: boolean
  requireFutureHostApproval: boolean
  requireNoWildcardHosts: boolean
  requireNoArbitraryInternet: boolean
  requireNoProviderDefaultNetwork: boolean
  requireNoToolsetNetworkUntilToolsetsPolicy: boolean
  requireNetworkKillSwitchPolicy: boolean
  requireToolsetsPolicyNext: boolean
  forbidNetworkUseInThisGate: boolean
  forbidDnsResolutionInThisGate: boolean
  forbidEndpointTestingInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesNetworkSurfaceCandidate {
  surfaceId: string
  status: 'requires_future_network_approval' | 'forbidden_until_toolsets_policy' | 'forbidden' | 'not_available'
  reason: string
  canUseNow: false
  hostsApprovedNow?: []
  wildcardAllowed?: false
}

export interface FactoryHermesNetworkProviderCandidate {
  providerCandidate: 'openai' | 'anthropic' | 'gemini_google'
  hostCandidates: string[]
  hostSelectionRequired: true
  allowedHostsNow: []
  futureAllowedHostsRequireApproval: true
  wildcardHostsAllowed: false
}

export interface FactoryHermesNetworkPolicyRule {
  ruleId: string
  ruleName: string
  requirements: string[]
}

export interface FactoryHermesNetworkPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>']; shell: false }
  networkAllowedNow: false
  allowedHostsNow: []
  allowedSchemesNow: []
  futureHostSelectionRequired: true
  futureAllowedHostsRequireApproval: true
  wildcardHostsAllowed: false
  arbitraryInternetAllowed: false
  providerNetworkCandidates: FactoryHermesNetworkProviderCandidate[]
  networkSurfaceCandidates: FactoryHermesNetworkSurfaceCandidate[]
  networkRules: FactoryHermesNetworkPolicyRule[]
  providerDependency: { selectedProviderRequiredBeforeNetworkApproval: true; selectedModelRequiredBeforeNetworkApproval: true }
  credentialsDependency: { credentialsNotApprovedHere: true; credentialPolicyMustBeApprovedBeforeRuntime: true }
  toolsetsDependency: { toolsetNetworkDisabledUntilToolsetsPolicy: true; webBrowserSearchDisabledUntilToolsetsPolicy: true }
  runtimeRequirements: { shellFalse: true; timeoutRequired: true; retryPolicyRequired: true; networkStatusRequired: true; noHeadersOrSecretsInLogs: true }
  killSwitchPolicy: { networkKillSwitchRequired: true; providerNetworkKillSwitchRequired: true }
  requiredNextPolicies: string[]
  canProceedToToolsetsPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canUseNetworkNow: false
  canCallModelsNow: false
}

export interface FactoryHermesNetworkPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesNetworkPolicyPlanningDecision
  scope: 'hermes_network_policy_planning_only'
  approvedNextGate: 'Factory Hermes Toolsets Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesNetworkPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesNetworkPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesNetworkPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesNetworkPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesNetworkPolicyPlanningKind
  planningVersion: FactoryHermesNetworkPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL>'
  networkSurfaceCandidates: FactoryHermesNetworkSurfaceCandidate[]
  providerNetworkCandidates: FactoryHermesNetworkProviderCandidate[]
  networkPolicyPlanningReceipt?: FactoryHermesNetworkPolicyPlanningReceipt
  hermesNetworkPolicyPlanCandidate?: FactoryHermesNetworkPolicyPlanCandidate
  checks: FactoryHermesNetworkPolicyPlanningCheck[]
  blockers: FactoryHermesNetworkPolicyPlanningBlocker[]
  warnings: FactoryHermesNetworkPolicyPlanningWarning[]
  status: FactoryHermesNetworkPolicyPlanningStatus
  decision: FactoryHermesNetworkPolicyPlanningDecision
  canProceedToToolsetsPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  canExecuteHermesNow: false
  canPassPromptNow: false
  canUseNetworkNow: false
  canUseCredentialsNow: false
  canReadEnvSecretsNow: false
  canCallModelsNow: false
  canUseFindings: false
  recommendedNextStep: string
}

export interface FactoryHermesNetworkPolicyPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesNetworkPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesNetworkPolicyPlanningStatus
  decision: FactoryHermesNetworkPolicyPlanningDecision
  networkSurfaceCandidateCount: number
  providerNetworkCandidateCount: number
  allowedHostsNow: []
  wildcardHostsAllowed: false
  canProceedToToolsetsPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canUseNetworkNow: false
  nextStep: string
}
