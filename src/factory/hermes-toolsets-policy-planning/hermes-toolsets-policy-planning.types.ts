export type FactoryHermesToolsetsPolicyPlanningVersion = '1.0'
export type FactoryHermesToolsetsPolicyPlanningKind = 'factory-hermes-toolsets-policy-planning'
export type FactoryHermesToolsetsPolicyPlanningStatus = 'toolsets_policy_plan_created' | 'blocked'
export type FactoryHermesToolsetsPolicyPlanningDecision =
  | 'hermes_toolsets_policy_plan_created'
  | 'blocked_missing_network_policy_planning'
  | 'blocked_network_policy_not_ready_for_toolsets_policy'
  | 'blocked_credentials_policy_not_ready_for_toolsets_policy'
  | 'blocked_missing_toolsets_source_inspection'
  | 'blocked_toolsets_or_network_used_during_planning'

export interface FactoryHermesToolsetsPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  networkPolicyPlanningResult?: any
  credentialsPolicyPlanningResult?: any
  modelProviderPolicyPlanningResult?: any
  promptPolicyPlanningResult?: any
  policyChainPlanningResult?: any
  deepSourceReview?: any
  toolsetsSourceInspection?: any
  policy?: Partial<FactoryHermesToolsetsPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesToolsetsPolicyPlanningPolicy {
  requireNetworkPolicyPlanning: boolean
  requireCredentialsPolicyPlanning: boolean
  requireToolsetsSourceInspection: boolean
  requireToolsetCandidates: boolean
  requireNoToolsetsNow: boolean
  requireNoHiddenDefaultToolsets: boolean
  requireExplicitFutureToolsets: boolean
  requireNoWebBrowserUntilNetworkApproval: boolean
  requireNoTerminalToolset: boolean
  requireNoMcpUntilMcpPolicy: boolean
  requireNoFilesystemUntilFilesystemPolicy: boolean
  requireOutputContractPolicyNext: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidWebToolsInThisGate: boolean
  forbidBrowserToolsInThisGate: boolean
  forbidTerminalToolsInThisGate: boolean
  forbidMcpInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesToolsetCandidate {
  toolsetId: string
  status: 'preferred_if_supported_by_cli' | 'forbidden_without_explicit_approval' | 'forbidden_until_network_and_toolsets_approval' | 'forbidden' | 'forbidden_until_filesystem_policy' | 'forbidden_until_mcp_policy' | 'candidate_only_if_supported'
  canUseNow: false
  reason: string
  risks?: string[]
  evidenceRequired?: string
  requiresFutureApproval: true
}

export interface FactoryHermesToolsetsPolicyRule { ruleId: string; ruleName: string; requirements: string[] }

export interface FactoryHermesToolsetsPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']; shell: false }
  toolsetCandidates: FactoryHermesToolsetCandidate[]
  toolsetsRules: FactoryHermesToolsetsPolicyRule[]
  selectedToolsetPolicy: string | null
  toolsetsAllowedNow: false
  toolsetsApprovedNow: []
  explicitToolsetsRequiredForFutureRuntime: true
  hiddenDefaultToolsetsForbidden: true
  configDrivenToolsetsForbiddenWithoutApproval: true
  preferredFutureToolsetMode: 'no_toolsets_text_only' | 'toolset_selection_requires_manual_review'
  webBrowserPolicy: { webToolsAllowedNow: false; browserToolsAllowedNow: false; searchToolsAllowedNow: false; requiresNetworkPolicyApproval: true }
  terminalPolicy: { terminalToolsAllowedNow: false; terminalToolsAllowedInInitialResearch: false }
  filesystemPolicy: { filesystemToolsAllowedNow: false; requiresFilesystemMutationPolicy: true }
  mcpPolicy: { mcpAllowedNow: false; requiresSeparateMcpPolicy: true }
  runtimeReportingRequirements: ['toolsetsRequested', 'toolsetsApproved', 'toolsetsUsed', 'toolExecutionStatus', 'unexpectedToolUse']
  requiredNextPolicies: string[]
  canProceedToOutputContractPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canEnableToolsetsNow: false
}

export interface FactoryHermesToolsetsPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesToolsetsPolicyPlanningDecision
  scope: 'hermes_toolsets_policy_planning_only'
  approvedNextGate: 'Factory Hermes Output Contract Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesToolsetsPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesToolsetsPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesToolsetsPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesToolsetsPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesToolsetsPolicyPlanningKind
  planningVersion: FactoryHermesToolsetsPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>'
  toolsetCandidates: FactoryHermesToolsetCandidate[]
  selectedToolsetPolicy?: string | null
  toolsetsPolicyPlanningReceipt?: FactoryHermesToolsetsPolicyPlanningReceipt
  hermesToolsetsPolicyPlanCandidate?: FactoryHermesToolsetsPolicyPlanCandidate
  checks: FactoryHermesToolsetsPolicyPlanningCheck[]
  blockers: FactoryHermesToolsetsPolicyPlanningBlocker[]
  warnings: FactoryHermesToolsetsPolicyPlanningWarning[]
  status: FactoryHermesToolsetsPolicyPlanningStatus
  decision: FactoryHermesToolsetsPolicyPlanningDecision
  canProceedToOutputContractPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  canExecuteHermesNow: false
  canPassPromptNow: false
  canUseNetworkNow: false
  canUseCredentialsNow: false
  canReadEnvSecretsNow: false
  canCallModelsNow: false
  canEnableToolsetsNow: false
  canUseFindings: false
  recommendedNextStep: string
}

export interface FactoryHermesToolsetsPolicyPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesToolsetsPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesToolsetsPolicyPlanningStatus
  decision: FactoryHermesToolsetsPolicyPlanningDecision
  toolsetCandidateCount: number
  selectedToolsetPolicy?: string | null
  toolsetsAllowedNow: false
  canProceedToOutputContractPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canEnableToolsetsNow: false
  nextStep: string
}
