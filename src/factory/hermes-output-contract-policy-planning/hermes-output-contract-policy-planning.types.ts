export type FactoryHermesOutputContractPolicyPlanningVersion = '1.0'
export type FactoryHermesOutputContractPolicyPlanningKind = 'factory-hermes-output-contract-policy-planning'
export type FactoryHermesOutputContractPolicyPlanningStatus = 'output_contract_policy_plan_created' | 'blocked'
export type FactoryHermesOutputContractPolicyPlanningDecision =
  | 'hermes_output_contract_policy_plan_created'
  | 'blocked_missing_toolsets_policy_planning'
  | 'blocked_toolsets_policy_not_ready_for_output_contract_policy'
  | 'blocked_network_policy_not_ready_for_output_contract_policy'
  | 'blocked_missing_output_source_inspection'
  | 'blocked_output_or_execution_used_during_planning'

export interface FactoryHermesOutputContractPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  toolsetsPolicyPlanningResult?: any
  networkPolicyPlanningResult?: any
  credentialsPolicyPlanningResult?: any
  modelProviderPolicyPlanningResult?: any
  promptPolicyPlanningResult?: any
  policyChainPlanningResult?: any
  deepSourceReview?: any
  outputSourceInspection?: any
  policy?: Partial<FactoryHermesOutputContractPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesOutputContractPolicyPlanningPolicy {
  requireToolsetsPolicyPlanning: boolean
  requireNetworkPolicyPlanning: boolean
  requireOutputSourceInspection: boolean
  requireOutputSurfaceCandidates: boolean
  requireNoFindingsNow: boolean
  requireStdoutCaptureRules: boolean
  requireStderrCaptureRules: boolean
  requireUsageFilePolicy: boolean
  requireSanitizationPolicy: boolean
  requireSizeLimits: boolean
  requireNoRawOutputAsFindings: boolean
  requireNoHelpOutputAsFindings: boolean
  requireNoLogsAsFindings: boolean
  requireResultIngestionContractNext: boolean
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

export interface FactoryHermesOutputSurfaceCandidate {
  surfaceId: string
  status: 'candidate_requires_ingestion_contract' | 'operational_logs_only' | 'auxiliary_usage_metadata_only' | 'not_available' | 'forbidden' | 'forbidden_until_toolsets_and_ingestion_review'
  reason: string
  canUseNow: false
  findingsUsableNow: false
}

export interface FactoryHermesOutputContractRule { ruleId: string; ruleName: string; requirements: string[] }

export interface FactoryHermesOutputContractPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']; shell: false }
  outputSurfaceCandidates: FactoryHermesOutputSurfaceCandidate[]
  selectedOutputContractPolicy: {
    stdout: 'stdout_final_response_plain_text_as_raw_candidate_evidence'
    stderr: 'stderr_operational_only'
    usageFile: 'usage_file_operational_metadata_only'
  }
  outputContractRules: FactoryHermesOutputContractRule[]
  outputAllowedNow: false
  findingsAllowedNow: false
  rawOutputPromotableNow: false
  stdoutPolicy: { capturePreview: true; previewLimitBytes: 12000; sanitize: true; usableAsFindingsBeforeIngestion: false }
  stderrPolicy: { capturePreview: true; previewLimitBytes: 12000; sanitize: true; operationalOnly: true }
  usageFilePolicy: { allowedInFutureRuntime: true; pathMustBeUnderCodexTemp: true; metadataOnly: true; usableAsFindings: false }
  sanitizationPolicy: { redactSecrets: true; redactTokens: true; noEnvDump: true; noCredentialValues: true }
  resultPromotionPolicy: { requiresResultIngestion: true; requiresJefeReview: true; findingsUsableOnlyAfterJefeReview: true }
  requiredNextPolicies: string[]
  canProceedToResultIngestionContractPlanning: true
  canProceedToResearchExecutionApproval: false
  canUseFindings: false
}

export interface FactoryHermesOutputContractPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesOutputContractPolicyPlanningDecision
  scope: 'hermes_output_contract_policy_planning_only'
  approvedNextGate: 'Factory Hermes Result Ingestion Contract Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesOutputContractPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesOutputContractPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesOutputContractPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesOutputContractPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesOutputContractPolicyPlanningKind
  planningVersion: FactoryHermesOutputContractPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>'
  outputSurfaceCandidates: FactoryHermesOutputSurfaceCandidate[]
  selectedOutputContractPolicy?: FactoryHermesOutputContractPolicyPlanCandidate['selectedOutputContractPolicy']
  outputContractPolicyPlanningReceipt?: FactoryHermesOutputContractPolicyPlanningReceipt
  hermesOutputContractPolicyPlanCandidate?: FactoryHermesOutputContractPolicyPlanCandidate
  checks: FactoryHermesOutputContractPolicyPlanningCheck[]
  blockers: FactoryHermesOutputContractPolicyPlanningBlocker[]
  warnings: FactoryHermesOutputContractPolicyPlanningWarning[]
  status: FactoryHermesOutputContractPolicyPlanningStatus
  decision: FactoryHermesOutputContractPolicyPlanningDecision
  canProceedToResultIngestionContractPlanning: boolean
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

export interface FactoryHermesOutputContractPolicyPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesOutputContractPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesOutputContractPolicyPlanningStatus
  decision: FactoryHermesOutputContractPolicyPlanningDecision
  outputSurfaceCandidateCount: number
  selectedOutputContractPolicy?: FactoryHermesOutputContractPolicyPlanCandidate['selectedOutputContractPolicy']
  findingsAllowedNow: false
  canProceedToResultIngestionContractPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canUseFindings: false
  nextStep: string
}
