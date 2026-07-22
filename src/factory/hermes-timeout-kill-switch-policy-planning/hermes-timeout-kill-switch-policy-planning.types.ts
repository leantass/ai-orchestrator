export type FactoryHermesTimeoutKillSwitchPolicyPlanningVersion = '1.0'
export type FactoryHermesTimeoutKillSwitchPolicyPlanningKind = 'factory-hermes-timeout-kill-switch-policy-planning'
export type FactoryHermesTimeoutKillSwitchPolicyPlanningStatus = 'timeout_kill_switch_policy_plan_created' | 'blocked'
export type FactoryHermesTimeoutKillSwitchPolicyPlanningDecision =
  | 'hermes_timeout_kill_switch_policy_plan_created'
  | 'blocked_missing_result_ingestion_contract_planning'
  | 'blocked_result_ingestion_contract_not_ready_for_timeout_kill_switch_policy'
  | 'blocked_output_contract_policy_not_ready_for_timeout_kill_switch_policy'

export interface FactoryHermesTimeoutKillSwitchPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  resultIngestionContractPlanningResult?: any
  outputContractPolicyPlanningResult?: any
  policy?: Partial<FactoryHermesTimeoutKillSwitchPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesTimeoutKillSwitchPolicyPlanningPolicy {
  requireResultIngestionContractPlanning: boolean
  requireOutputContractPolicyPlanning: boolean
  requireProcessTimeout: boolean
  requireHardTimeout: boolean
  requireNoInfiniteTimeout: boolean
  requireShutdownGracePolicy: boolean
  requireOutputLimitPolicy: boolean
  requireGlobalResearchKillSwitch: boolean
  requireHermesToolKillSwitch: boolean
  requireProviderKillSwitch: boolean
  requireCredentialsKillSwitch: boolean
  requireNetworkKillSwitch: boolean
  requireToolsetsKillSwitch: boolean
  requireEmergencyStopPolicy: boolean
  requireNoAutoRetry: boolean
  requireRuntimeAbortReportingShape: boolean
  requireFilesystemMutationPolicyNext: boolean
  forbidTimeoutRuntimeConfigurationInThisGate: boolean
  forbidKillSwitchMutationInThisGate: boolean
  forbidExecutionInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesTimeoutPolicyRule {
  ruleId: string
  commandTimeoutMsDefault?: number
  commandTimeoutMsMax?: number
  startupTimeoutMsDefault?: number
  startupTimeoutMsMax?: number
  outputIdleTimeoutMsDefault?: number
  outputIdleTimeoutMsMax?: number
  shutdownGraceMsDefault?: number
  shutdownGraceMsMax?: number
  stdoutPreviewLimitBytes?: number
  stderrPreviewLimitBytes?: number
  maxCapturedOutputBytesFuture?: number
  hardTimeoutRequired?: true
  noInfiniteTimeout?: true
  killAfterGrace?: true
  truncateBeforeStorage?: true
  status?: string
  appliesTo?: string
  classifications?: string[]
  notes?: string[]
}

export interface FactoryHermesKillSwitchPolicyRule {
  ruleId: string
  required: true
  defaultState?: string
  appliesTo?: string
  behavior?: string
  reportedFields?: string[]
}

export interface FactoryHermesRetryPolicyRule {
  ruleId: string
  autoRetryAllowed?: false
  retryRequiresJefeReview?: true
  reason: string
}

export interface FactoryHermesRuntimeAbortReportingShape {
  requiredFields: string[]
  forbiddenFields: string[]
}

export interface FactoryHermesTimeoutKillSwitchPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']; shell: false }
  timeoutPolicyRules: FactoryHermesTimeoutPolicyRule[]
  killSwitchPolicyRules: FactoryHermesKillSwitchPolicyRule[]
  retryPolicyRules: FactoryHermesRetryPolicyRule[]
  runtimeAbortReportingShape: FactoryHermesRuntimeAbortReportingShape
  timeoutAllowedNow: false
  killSwitchMutationAllowedNow: false
  researchExecutionAllowedNow: false
  noInfiniteTimeout: true
  hardTimeoutRequired: true
  autoRetryAllowed: false
  retryRequiresJefeReview: true
  requiredNextPolicies: string[]
  canProceedToFilesystemMutationPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
}

export interface FactoryHermesTimeoutKillSwitchPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesTimeoutKillSwitchPolicyPlanningDecision
  scope: 'hermes_timeout_kill_switch_policy_planning_only'
  approvedNextGate: 'Factory Hermes Filesystem Mutation Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesTimeoutKillSwitchPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesTimeoutKillSwitchPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesTimeoutKillSwitchPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesTimeoutKillSwitchPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesTimeoutKillSwitchPolicyPlanningKind
  planningVersion: FactoryHermesTimeoutKillSwitchPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>'
  timeoutPolicyRules: FactoryHermesTimeoutPolicyRule[]
  killSwitchPolicyRules: FactoryHermesKillSwitchPolicyRule[]
  retryPolicyRules: FactoryHermesRetryPolicyRule[]
  runtimeAbortReportingShape?: FactoryHermesRuntimeAbortReportingShape
  timeoutKillSwitchPolicyPlanningReceipt?: FactoryHermesTimeoutKillSwitchPolicyPlanningReceipt
  hermesTimeoutKillSwitchPolicyPlanCandidate?: FactoryHermesTimeoutKillSwitchPolicyPlanCandidate
  checks: FactoryHermesTimeoutKillSwitchPolicyPlanningCheck[]
  blockers: FactoryHermesTimeoutKillSwitchPolicyPlanningBlocker[]
  warnings: FactoryHermesTimeoutKillSwitchPolicyPlanningWarning[]
  status: FactoryHermesTimeoutKillSwitchPolicyPlanningStatus
  decision: FactoryHermesTimeoutKillSwitchPolicyPlanningDecision
  canProceedToFilesystemMutationPolicyPlanning: boolean
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

export interface FactoryHermesTimeoutKillSwitchPolicyPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesTimeoutKillSwitchPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesTimeoutKillSwitchPolicyPlanningStatus
  decision: FactoryHermesTimeoutKillSwitchPolicyPlanningDecision
  commandTimeoutMsDefault?: number
  commandTimeoutMsMax?: number
  killSwitchCount: number
  autoRetryAllowed: false
  canProceedToFilesystemMutationPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  nextStep: string
}
