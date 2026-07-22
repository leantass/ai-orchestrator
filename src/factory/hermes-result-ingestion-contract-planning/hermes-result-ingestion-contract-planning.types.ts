export type FactoryHermesResultIngestionContractPlanningVersion = '1.0'
export type FactoryHermesResultIngestionContractPlanningKind = 'factory-hermes-result-ingestion-contract-planning'
export type FactoryHermesResultIngestionContractPlanningStatus = 'result_ingestion_contract_plan_created' | 'blocked'
export type FactoryHermesResultIngestionContractPlanningDecision =
  | 'hermes_result_ingestion_contract_plan_created'
  | 'blocked_missing_output_contract_policy_planning'
  | 'blocked_output_contract_policy_not_ready_for_result_ingestion_contract'
  | 'blocked_toolsets_policy_not_ready_for_result_ingestion_contract'
  | 'blocked_network_policy_not_ready_for_result_ingestion_contract'
  | 'blocked_credentials_policy_not_ready_for_result_ingestion_contract'

export interface FactoryHermesResultIngestionContractPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  outputContractPolicyPlanningResult?: any
  toolsetsPolicyPlanningResult?: any
  networkPolicyPlanningResult?: any
  credentialsPolicyPlanningResult?: any
  deepSourceReview?: any
  policy?: Partial<FactoryHermesResultIngestionContractPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesResultIngestionContractPlanningPolicy {
  requireOutputContractPolicyPlanning: boolean
  requireToolsetsPolicyPlanning: boolean
  requireIngestionSurfaceRules: boolean
  requireFindingCandidateRules: boolean
  requireIngestionRecordShape: boolean
  requireNoAutomaticFindings: boolean
  requireJefeReviewForPromotion: boolean
  requireSanitizationBeforeStorage: boolean
  requireNoSecretsInRecords: boolean
  requireFailureIngestionSupport: boolean
  requireTimeoutKillSwitchPolicyNext: boolean
  forbidIngestionExecutionInThisGate: boolean
  forbidOutputUseAsFindingsInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesIngestionSurfaceRule {
  ruleId: string
  sourceSurface: 'stdout' | 'stderr' | 'usage_file' | 'command_result' | 'toolsets' | 'help_probe' | 'logs'
  status: string
  usableAsFindingsImmediately: false
  requiresJefeReview?: true
  requiresClassification?: true
  allowedClassifications?: string[]
  allowedFields?: string[]
  fields?: string[]
}

export interface FactoryHermesFindingCandidateRule {
  ruleId: string
  ruleName: string
  requirements: string[]
}

export interface FactoryHermesResultIngestionRecordShape {
  requiredFields: string[]
  forbiddenFields: string[]
  findingUseAllowed: false
  requiresJefeReview: true
}

export interface FactoryHermesResultIngestionContractPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']; shell: false }
  ingestionSurfaceRules: FactoryHermesIngestionSurfaceRule[]
  findingCandidateRules: FactoryHermesFindingCandidateRule[]
  ingestionRecordShape: FactoryHermesResultIngestionRecordShape
  ingestionAllowedNow: false
  findingsAllowedNow: false
  promotionAllowedNow: false
  rawOutputDirectUseForbidden: true
  requiresJefeReviewForFindings: true
  failureRecordsSupported: true
  sanitizationRequiredBeforeIngestion: true
  secretDetectionRequired: true
  memoryWriteAllowedNow: false
  briefWriteAllowedNow: false
  contextUseAllowedNow: false
  requiredNextPolicies: string[]
  canProceedToTimeoutKillSwitchPolicyPlanning: true
  canProceedToResearchExecutionApproval: false
  canUseFindings: false
}

export interface FactoryHermesResultIngestionContractPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesResultIngestionContractPlanningDecision
  scope: 'hermes_result_ingestion_contract_planning_only'
  approvedNextGate: 'Factory Hermes Timeout Kill Switch Policy Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResultIngestionContractPlanningCheck { checkId: string; message: string }
export interface FactoryHermesResultIngestionContractPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesResultIngestionContractPlanningWarning { warningId: string; message: string }

export interface FactoryHermesResultIngestionContractPlanningResult {
  planningId: string
  planningKind: FactoryHermesResultIngestionContractPlanningKind
  planningVersion: FactoryHermesResultIngestionContractPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>'
  ingestionSurfaceRules: FactoryHermesIngestionSurfaceRule[]
  findingCandidateRules: FactoryHermesFindingCandidateRule[]
  ingestionRecordShape?: FactoryHermesResultIngestionRecordShape
  resultIngestionContractPlanningReceipt?: FactoryHermesResultIngestionContractPlanningReceipt
  hermesResultIngestionContractPlanCandidate?: FactoryHermesResultIngestionContractPlanCandidate
  checks: FactoryHermesResultIngestionContractPlanningCheck[]
  blockers: FactoryHermesResultIngestionContractPlanningBlocker[]
  warnings: FactoryHermesResultIngestionContractPlanningWarning[]
  status: FactoryHermesResultIngestionContractPlanningStatus
  decision: FactoryHermesResultIngestionContractPlanningDecision
  canProceedToTimeoutKillSwitchPolicyPlanning: boolean
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

export interface FactoryHermesResultIngestionContractPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesResultIngestionContractPlanningSummary {
  planningId: string
  status: FactoryHermesResultIngestionContractPlanningStatus
  decision: FactoryHermesResultIngestionContractPlanningDecision
  ingestionSurfaceRuleCount: number
  findingCandidateRuleCount: number
  ingestionAllowedNow: false
  findingsAllowedNow: false
  canProceedToTimeoutKillSwitchPolicyPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canUseFindings: false
  nextStep: string
}
