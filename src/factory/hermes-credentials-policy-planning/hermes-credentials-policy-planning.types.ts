export type FactoryHermesCredentialsPolicyPlanningVersion = '1.0'
export type FactoryHermesCredentialsPolicyPlanningKind = 'factory-hermes-credentials-policy-planning'
export type FactoryHermesCredentialsPolicyPlanningStatus = 'credentials_policy_plan_created' | 'blocked'
export type FactoryHermesCredentialsPolicyPlanningDecision =
  | 'hermes_credentials_policy_plan_created'
  | 'blocked_missing_model_provider_policy_planning'
  | 'blocked_model_provider_policy_not_ready_for_credentials_policy'
  | 'blocked_missing_credential_source_inspection'
  | 'blocked_credential_values_present'

export interface FactoryHermesCredentialsPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  modelProviderPolicyPlanningResult?: any
  promptPolicyPlanningResult?: any
  deepSourceReview?: any
  credentialSourceInspection?: any
  policy?: Partial<FactoryHermesCredentialsPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesCredentialsPolicyPlanningPolicy {
  requireModelProviderPolicyPlanning: boolean
  requirePromptPolicyPlanning: boolean
  requireCredentialSourceInspection: boolean
  requireCredentialReferences: boolean
  requireReferencedNotReadStatus: boolean
  requireNoCredentialValues: boolean
  requireNoEnvRead: boolean
  requireNoDotEnvRead: boolean
  requireExplicitFutureCredentialSelection: boolean
  requireNoWildcardCredentials: boolean
  requireNoCrossProviderFallback: boolean
  requireMaskingPolicy: boolean
  requireKillSwitchPolicy: boolean
  requireNetworkPolicyNext: boolean
  forbidCredentialUseInThisGate: boolean
  forbidCredentialValueReadInThisGate: boolean
  forbidEnvSecretReadInThisGate: boolean
  forbidDotEnvReadInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesCredentialReference {
  refName: string
  providerCandidate: string
  status: 'referenced_not_read'
  valueKnown: false
  valueRead: false
  approvedForUseNow: false
  requiresFutureCredentialApproval: true
}

export interface FactoryHermesCredentialProviderRequirement {
  providerCandidate: string
  allowedCredentialRefs: string[]
  selectedCredentialRef: null
  noCrossProviderFallback: true
}

export interface FactoryHermesCredentialsPolicyRule {
  ruleId: string
  ruleName: string
  requirements: string[]
}

export interface FactoryHermesCredentialsPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>']; shell: false }
  credentialReferences: FactoryHermesCredentialReference[]
  providerCredentialRequirements: FactoryHermesCredentialProviderRequirement[]
  credentialRules: FactoryHermesCredentialsPolicyRule[]
  credentialInjectionPlan: {
    credentialValuesDefinedHere: false
    credentialValuesReadHere: false
    futureCredentialSourceRequiresApproval: true
    allowedFutureSourcesCandidate: string[]
    forbiddenSources: string[]
  }
  maskingPolicy: { logCredentialNamesOnly: true; redactValues: true; noEnvDump: true }
  killSwitchPolicy: { credentialKillSwitchRequired: true; providerKillSwitchRequired: true }
  requiredNextPolicies: string[]
  canProceedToNetworkPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canUseCredentialsNow: false
  canReadEnvSecretsNow: false
  canCallModelsNow: false
}

export interface FactoryHermesCredentialsPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesCredentialsPolicyPlanningDecision
  scope: 'hermes_credentials_policy_planning_only'
  approvedNextGate: 'Factory Hermes Network Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesCredentialsPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesCredentialsPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesCredentialsPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesCredentialsPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesCredentialsPolicyPlanningKind
  planningVersion: FactoryHermesCredentialsPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL>'
  credentialReferences: FactoryHermesCredentialReference[]
  providerCredentialRequirements: FactoryHermesCredentialProviderRequirement[]
  credentialsPolicyPlanningReceipt?: FactoryHermesCredentialsPolicyPlanningReceipt
  hermesCredentialsPolicyPlanCandidate?: FactoryHermesCredentialsPolicyPlanCandidate
  checks: FactoryHermesCredentialsPolicyPlanningCheck[]
  blockers: FactoryHermesCredentialsPolicyPlanningBlocker[]
  warnings: FactoryHermesCredentialsPolicyPlanningWarning[]
  status: FactoryHermesCredentialsPolicyPlanningStatus
  decision: FactoryHermesCredentialsPolicyPlanningDecision
  canProceedToNetworkPolicyPlanning: boolean
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

export interface FactoryHermesCredentialsPolicyPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesCredentialsPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesCredentialsPolicyPlanningStatus
  decision: FactoryHermesCredentialsPolicyPlanningDecision
  credentialReferenceCount: number
  credentialValuesRead: false
  canProceedToNetworkPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canUseCredentialsNow: false
  nextStep: string
}
