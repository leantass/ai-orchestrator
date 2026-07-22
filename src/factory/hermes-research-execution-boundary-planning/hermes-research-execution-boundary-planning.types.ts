export type FactoryHermesResearchExecutionBoundaryPlanningVersion = '1.0'
export type FactoryHermesResearchExecutionBoundaryPlanningKind = 'factory-hermes-research-execution-boundary-planning'
export type FactoryHermesResearchExecutionBoundaryPlanningStatus = 'research_execution_boundary_plan_created' | 'blocked'
export type FactoryHermesResearchExecutionBoundaryPlanningDecision =
  | 'hermes_research_execution_boundary_plan_created'
  | 'blocked_missing_policy_planning_result'
  | 'blocked_policy_chain_not_ready_for_boundary_planning'
  | 'blocked_prompt_policy_not_ready_for_boundary_planning'
  | 'blocked_model_provider_policy_not_ready_for_boundary_planning'
  | 'blocked_credentials_policy_not_ready_for_boundary_planning'
  | 'blocked_network_policy_not_ready_for_boundary_planning'
  | 'blocked_toolsets_policy_not_ready_for_boundary_planning'
  | 'blocked_output_contract_not_ready_for_boundary_planning'
  | 'blocked_result_ingestion_contract_not_ready_for_boundary_planning'
  | 'blocked_timeout_policy_not_ready_for_boundary_planning'
  | 'blocked_filesystem_policy_not_ready_for_boundary_planning'

export interface FactoryHermesResearchExecutionBoundaryPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  filesystemMutationPolicyPlanningResult?: any
  timeoutKillSwitchPolicyPlanningResult?: any
  resultIngestionContractPlanningResult?: any
  outputContractPolicyPlanningResult?: any
  toolsetsPolicyPlanningResult?: any
  networkPolicyPlanningResult?: any
  credentialsPolicyPlanningResult?: any
  modelProviderPolicyPlanningResult?: any
  promptPolicyPlanningResult?: any
  policyChainPlanningResult?: any
  deepSourceReview?: any
  commandShapeReview?: any
  policy?: Partial<FactoryHermesResearchExecutionBoundaryPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesResearchExecutionBoundaryPlanningPolicy {
  requirePolicyChainPlanning: boolean
  requirePromptPolicyPlanning: boolean
  requireModelProviderPolicyPlanning: boolean
  requireCredentialsPolicyPlanning: boolean
  requireNetworkPolicyPlanning: boolean
  requireToolsetsPolicyPlanning: boolean
  requireOutputContractPolicyPlanning: boolean
  requireResultIngestionContractPlanning: boolean
  requireTimeoutKillSwitchPolicyPlanning: boolean
  requireFilesystemMutationPolicyPlanning: boolean
  requireAllPoliciesConsolidated: boolean
  requireMissingRuntimeSelections: boolean
  requireResearchExecutionApprovalNext: boolean
  forbidExecutionInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidEnvSecretReadsInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidFilesystemMutationInThisGate: boolean
  forbidOutputIngestionInThisGate: boolean
  forbidFindingsUseInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesResearchExecutionBoundaryCommandShape {
  executableRef: string
  executableMustExistInFutureRuntime: true
  commandName: 'hermes.exe'
  argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']
  shell: false
  cwd: string
  cwdMutationAllowed: false
  stdinAllowed: false
  interactiveModeAllowed: false
  helpOutputAsFindings: false
  oneShotOnly: true
  commandExecutionAllowedNow: false
}

export interface FactoryHermesResearchExecutionBoundaryEnvironmentShape {
  inheritParentEnv: false
  fullEnvDumpAllowed: false
  dotEnvReadAllowed: false
  envSecretReadAllowed: false
  allowedEnvKeysFutureCandidate: string[]
  forbiddenEnvKeys: string[]
  envValuesStoredInArtifacts: false
  envValuesLogged: false
  envSanitizationRequired: true
}

export interface FactoryHermesResearchExecutionBoundaryFilesystemShape {
  futureRunRootCandidate: string
  writesAllowedNow: false
  futureWritesRestrictedToCodexTemp: true
  sourceRootReadOnly: true
  sourceRootWritesForbidden: true
  pythonEnvMutationForbidden: true
  uvCacheMutationForbidden: true
  packageFileMutationForbidden: true
  dotEnvReadWriteForbidden: true
  projectRootWritesForbidden: true
  arbitraryPathAccessForbidden: true
  pathContainmentRequired: true
  symlinkTraversalForbidden: true
  fsMutationReportingRequired: true
}

export interface FactoryHermesResearchExecutionBoundaryNetworkShape {
  networkAllowedNow: false
  allowedHostsNow: string[]
  allowedSchemesNow: string[]
  wildcardHostsAllowed: false
  arbitraryInternetAllowed: false
  futureHostSelectionRequired: true
  providerNetworkRequiresApproval: true
  toolsetNetworkDisabled: true
  dnsResolutionAllowedNow: false
  endpointTestingAllowedNow: false
  networkStatusRequired: true
  redirectsToUnapprovedHostsForbidden: true
}

export interface FactoryHermesResearchExecutionBoundaryCredentialsShape {
  credentialsAllowedNow: false
  credentialValuesReadNow: false
  credentialValuesStored: false
  credentialValuesLogged: false
  futureCredentialSelectionRequired: true
  credentialRefsAvailableAsNamesOnly: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']
  credentialInjectionRequiresFutureApproval: true
  maskingRequired: true
  credentialKillSwitchRequired: true
}

export interface FactoryHermesResearchExecutionBoundaryToolsetsShape {
  toolsetsAllowedNow: false
  toolsetsApprovedNow: string[]
  explicitToolsetsRequiredForFutureRuntime: true
  hiddenDefaultToolsetsForbidden: true
  webToolsAllowedNow: false
  browserToolsAllowedNow: false
  terminalToolsAllowedNow: false
  mcpAllowedNow: false
  filesystemToolsAllowedNow: false
  preferredFutureToolsetMode: 'no_toolsets_text_only' | 'manual_review_required'
  unexpectedToolUseMustBlock: true
}

export interface FactoryHermesResearchExecutionBoundaryOutputShape {
  stdoutPreviewLimitBytes: 12000
  stderrPreviewLimitBytes: 12000
  sanitizeStdout: true
  sanitizeStderr: true
  usageFileMetadataOnly: true
  outputUseAsFindingsNow: false
  rawOutputPromotionForbidden: true
}

export interface FactoryHermesResearchExecutionBoundaryTimeoutShape {
  commandTimeoutMsDefault: 120000
  commandTimeoutMsMax: 300000
  hardTimeoutRequired: true
  noInfiniteTimeout: true
  shutdownGraceRequired: true
  autoRetryAllowed: false
  retryRequiresJefeReview: true
  killSwitchesRequired: string[]
}

export interface FactoryHermesResearchExecutionBoundaryIngestionShape {
  ingestionAllowedNow: false
  futureIngestionRecordRequired: true
  rawOutputDirectUseForbidden: true
  requiresJefeReviewForFindings: true
  memoryWriteAllowedNow: false
  briefWriteAllowedNow: false
  contextUseAllowedNow: false
}

export interface FactoryHermesResearchExecutionBoundaryMissingSelection {
  selectionId: string
  status: 'required_before_runtime'
  blocksExecutionNow: true
  requiredByGate: string
  reason: string
}

export interface FactoryHermesResearchExecutionBoundaryPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  boundaryCommandShape: FactoryHermesResearchExecutionBoundaryCommandShape
  boundaryEnvironmentShape: FactoryHermesResearchExecutionBoundaryEnvironmentShape
  boundaryFilesystemShape: FactoryHermesResearchExecutionBoundaryFilesystemShape
  boundaryNetworkShape: FactoryHermesResearchExecutionBoundaryNetworkShape
  boundaryCredentialsShape: FactoryHermesResearchExecutionBoundaryCredentialsShape
  boundaryToolsetsShape: FactoryHermesResearchExecutionBoundaryToolsetsShape
  boundaryOutputShape: FactoryHermesResearchExecutionBoundaryOutputShape
  boundaryIngestionShape: FactoryHermesResearchExecutionBoundaryIngestionShape
  boundaryTimeoutShape: FactoryHermesResearchExecutionBoundaryTimeoutShape
  missingRuntimeSelections: FactoryHermesResearchExecutionBoundaryMissingSelection[]
  executionAllowedNow: false
  researchExecutionAllowedNow: false
  finalApprovalRequired: true
  approvalGateCanEvaluate: true
  allPoliciesConsolidated: true
  canProceedToResearchExecutionApproval: true
  canRunResearchNow: false
  canExecuteHermesNow: false
}

export interface FactoryHermesResearchExecutionBoundaryPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesResearchExecutionBoundaryPlanningDecision
  scope: 'hermes_research_execution_boundary_planning_only'
  approvedNextGate: 'Factory Hermes Research Execution Approval Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionBoundaryPlanningCheck { checkId: string; message: string }
export interface FactoryHermesResearchExecutionBoundaryPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesResearchExecutionBoundaryPlanningWarning { warningId: string; message: string }

export interface FactoryHermesResearchExecutionBoundaryPlanningResult {
  planningId: string
  planningKind: FactoryHermesResearchExecutionBoundaryPlanningKind
  planningVersion: FactoryHermesResearchExecutionBoundaryPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  boundaryCommandShape: FactoryHermesResearchExecutionBoundaryCommandShape
  boundaryEnvironmentShape: FactoryHermesResearchExecutionBoundaryEnvironmentShape
  boundaryFilesystemShape: FactoryHermesResearchExecutionBoundaryFilesystemShape
  boundaryNetworkShape: FactoryHermesResearchExecutionBoundaryNetworkShape
  boundaryCredentialsShape: FactoryHermesResearchExecutionBoundaryCredentialsShape
  boundaryToolsetsShape: FactoryHermesResearchExecutionBoundaryToolsetsShape
  boundaryOutputShape: FactoryHermesResearchExecutionBoundaryOutputShape
  boundaryTimeoutShape: FactoryHermesResearchExecutionBoundaryTimeoutShape
  boundaryIngestionShape: FactoryHermesResearchExecutionBoundaryIngestionShape
  missingRuntimeSelections: FactoryHermesResearchExecutionBoundaryMissingSelection[]
  researchExecutionBoundaryPlanningReceipt?: FactoryHermesResearchExecutionBoundaryPlanningReceipt
  hermesResearchExecutionBoundaryPlanCandidate?: FactoryHermesResearchExecutionBoundaryPlanCandidate
  checks: FactoryHermesResearchExecutionBoundaryPlanningCheck[]
  blockers: FactoryHermesResearchExecutionBoundaryPlanningBlocker[]
  warnings: FactoryHermesResearchExecutionBoundaryPlanningWarning[]
  status: FactoryHermesResearchExecutionBoundaryPlanningStatus
  decision: FactoryHermesResearchExecutionBoundaryPlanningDecision
  canProceedToResearchExecutionApproval: boolean
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

export interface FactoryHermesResearchExecutionBoundaryPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesResearchExecutionBoundaryPlanningSummary {
  planningId: string
  status: FactoryHermesResearchExecutionBoundaryPlanningStatus
  decision: FactoryHermesResearchExecutionBoundaryPlanningDecision
  allPoliciesConsolidated: boolean
  missingRuntimeSelectionCount: number
  canProceedToResearchExecutionApproval: boolean
  canRunResearchNow: false
  canExecuteHermesNow: false
  nextStep: string
}
