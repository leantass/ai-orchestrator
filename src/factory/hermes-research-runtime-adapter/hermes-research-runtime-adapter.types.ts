export type FactoryHermesResearchRuntimeAdapterVersion = '1.0'
export type FactoryHermesResearchRuntimeAdapterKind = 'factory-hermes-research-runtime-adapter'
export type FactoryHermesResearchRuntimeAdapterStatus = 'research_runtime_adapter_prepared' | 'research_runtime_adapter_blocked'
export type FactoryHermesResearchRuntimeAdapterDecision = 'hermes_research_runtime_adapter_prepared_with_wrapper_boundary_for_execution_approval_retry' | 'hermes_research_runtime_adapter_blocked_executable_surface_detected' | 'hermes_research_runtime_adapter_blocked_input_evidence_invalid'

export interface FactoryHermesResearchRuntimeAdapterInput {
  adaptedAt: string
  adaptedBy: string
  adapterApprovalRetryResult?: any
  wrapperVerificationReviewResult?: any
  wrapperVerificationResult?: any
  previousAdapterApprovalResult?: any
  runtimeSelectionDecisionResult?: any
  finalExecutionApprovalResult?: any
  adapterSourceInspection?: FactoryHermesAdapterSourceInspection
  policy?: Partial<FactoryHermesResearchRuntimeAdapterPolicy>
}

export interface FactoryHermesResearchRuntimeAdapterPolicy {
  requireApprovalRetryGranted: boolean
  requireWrapperVerificationReview: boolean
  requireRuntimeSelectionDecision: boolean
  requireWrapperBoundary: boolean
  requireNonExecutableCommandEnvelope: boolean
  requireSafetyManifest: boolean
  requireResearchExecutionApprovalRetryEnvelope: boolean
  forbidRuntimeAdapterExecution: boolean
  forbidResearchExecution: boolean
  forbidHermesExecution: boolean
  forbidPromptPassing: boolean
  forbidModelCalls: boolean
  forbidNetwork: boolean
  forbidCredentials: boolean
  forbidToolsets: boolean
  forbidFindingsUse: boolean
}

export interface FactoryHermesAdapterSourceInspection {
  inspectionId: string
  classification: 'case_a_not_found' | 'case_b_exists_without_wrapper_boundary' | 'case_c_exists_with_wrapper_boundary' | 'case_d_executable_surface_detected'
  inspectedRefs: string[]
  dangerousExecutableSurfaceDetected: boolean
  controlledStringMatches: string[]
  executableMatches: string[]
}

export interface FactoryHermesAdapterWrapperBoundaryIntegrationManifest {
  integrationId: string
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  wrapperVerificationReviewRef: 'wrapper-no-tool-mode-verification-review-result.json'
  wrapperVerificationRef: 'wrapper-no-tool-mode-verification-result.json'
  adapterUsesWrapperBoundary: boolean
  adapterDoesNotUseDirectHermesCliDefaults: boolean
  directNoToolsetsTextOnlyRejected: boolean
  hiddenDefaultsRiskCarriedForward: boolean
  wrapperBoundaryType: 'code_only_no_runtime_execution'
  realHermesRuntimeNotProven: boolean
  noToolModeRuntimeNotClaimed: boolean
  adapterMustNotExecuteNow: boolean
  notes: string[]
}

export interface FactoryHermesAdapterNonExecutableCommandEnvelope {
  envelopeId: string
  toolId: 'hermes_agent'
  provider: 'openai'
  model: 'gpt-4o-mini'
  credentialRef: 'OPENAI_API_KEY'
  host: 'api.openai.com'
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  commandShape: 'non_executable_adapter_envelope_only'
  commandString: null
  argv: []
  env: Record<string, never>
  prompt: null
  tempConfigPath: null
  runRoot: null
  executionAllowed: boolean
  adapterExecutionAllowed: boolean
  hermesExecutionAllowed: boolean
  wrapperExecutionAllowed: boolean
  researchExecutionAllowed: boolean
  promptPassingAllowed: boolean
  modelCallsAllowed: boolean
  networkAllowed: boolean
  credentialAccessAllowed: boolean
  envSecretReadAllowed: boolean
  toolsetEnablementAllowed: boolean
  filesystemRuntimeMutationAllowed: boolean
  findingsUseAllowed: boolean
}

export interface FactoryHermesAdapterRuntimeSafetyManifest {
  manifestId: string
  checks: Record<string, boolean>
  packageFilesUnchanged: boolean
  hermesSourceReadOnly: boolean
}

export interface FactoryHermesAdapterLimitationsCarryForward {
  limitations: string[]
  limitationsAcceptableForExecutionApprovalRetry: boolean
  limitationsBlockImmediateRuntimeExecution: boolean
  limitationsBlockImmediateResearchExecution: boolean
  limitationsBlockFindingsUse: boolean
}

export interface FactoryHermesAdapterRiskDisposition {
  riskId: string
  severity: 'high' | 'critical'
  disposition: 'accepted_for_execution_approval_retry_only'
  mitigation: string
  blocksExecutionApprovalRetry: boolean
  blocksRuntimeExecution: boolean
  blocksResearchExecution: boolean
}

export interface FactoryHermesAdapterRiskDispositionRegister {
  registerId: string
  dispositions: FactoryHermesAdapterRiskDisposition[]
}

export interface FactoryHermesResearchExecutionApprovalRetryEnvelope {
  envelopeId: string
  toolId: 'hermes_agent'
  approvedFor: 'research_execution_approval_retry_only'
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  sourceAdapterRef: 'research-runtime-adapter-result.json'
  targetNextGate: 'Factory Hermes Research Execution Approval Retry Gate v1'
  purpose: string
  allowedInNextGate: string[]
  forbiddenEvenInNextGate: string[]
  flags: Record<string, boolean>
  recommendedNextGate: 'Factory Hermes Research Execution Approval Retry Gate v1'
}

export interface FactoryHermesResearchRuntimeAdapterReceipt {
  receiptId: string
  adapterId: string
  toolId: 'hermes_agent'
  adaptedBy: string
  adaptedAt: string
  decision: FactoryHermesResearchRuntimeAdapterDecision
  adapterStatus: 'prepared_code_only_not_executed' | 'blocked'
  scope: 'hermes_research_runtime_adapter_preparation_only'
  approvedNextGate: string
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchRuntimeAdapterResultRecord {
  recordId: string
  toolId: 'hermes_agent'
  adapterStatus: 'prepared_code_only_not_executed' | 'blocked'
  decision: FactoryHermesResearchRuntimeAdapterDecision
  wrapperBoundaryIntegrated: boolean
  adapterCommandEnvelopeBuilt: boolean
  adapterSafetyManifestBuilt: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  researchExecutionApproved: boolean
  hermesExecutionApproved: boolean
}

export interface FactoryHermesResearchRuntimeAdapterCheck { checkId: string, passed: boolean, message: string }
export interface FactoryHermesResearchRuntimeAdapterBlocker { blockerId: string, message: string }
export interface FactoryHermesResearchRuntimeAdapterWarning { warningId: string, message: string }
export interface FactoryHermesResearchRuntimeAdapterValidationResult { ok: boolean, errors: string[], warnings: string[] }
export interface FactoryHermesResearchRuntimeAdapterSummary { adapterId: string, status: string, decision: string, canProceedToResearchExecutionApprovalRetry: boolean, canRunResearchNow: boolean }

export interface FactoryHermesResearchRuntimeAdapterResult {
  adapterId: string
  adapterKind: FactoryHermesResearchRuntimeAdapterKind
  adapterVersion: FactoryHermesResearchRuntimeAdapterVersion
  adaptedAt: string
  adaptedBy: string
  toolId: 'hermes_agent'
  adapterApprovalRetryRef?: string
  wrapperVerificationReviewRef?: string
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  sourceInspection: FactoryHermesAdapterSourceInspection
  adapterWrapperBoundaryIntegrationManifest: FactoryHermesAdapterWrapperBoundaryIntegrationManifest
  adapterNonExecutableCommandEnvelope: FactoryHermesAdapterNonExecutableCommandEnvelope
  adapterRuntimeSafetyManifest: FactoryHermesAdapterRuntimeSafetyManifest
  adapterLimitationsCarryForward: FactoryHermesAdapterLimitationsCarryForward
  adapterRiskDispositionRegister: FactoryHermesAdapterRiskDispositionRegister
  researchExecutionApprovalRetryEnvelope: FactoryHermesResearchExecutionApprovalRetryEnvelope
  researchRuntimeAdapterReceipt: FactoryHermesResearchRuntimeAdapterReceipt
  hermesResearchRuntimeAdapterResultRecord: FactoryHermesResearchRuntimeAdapterResultRecord
  checks: FactoryHermesResearchRuntimeAdapterCheck[]
  blockers: FactoryHermesResearchRuntimeAdapterBlocker[]
  warnings: FactoryHermesResearchRuntimeAdapterWarning[]
  status: FactoryHermesResearchRuntimeAdapterStatus
  decision: FactoryHermesResearchRuntimeAdapterDecision
  adapterStatus: 'prepared_code_only_not_executed' | 'blocked'
  wrapperBoundaryIntegrated: boolean
  adapterCommandEnvelopeBuilt: boolean
  adapterSafetyManifestBuilt: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  researchExecutionApproved: boolean
  hermesExecutionApproved: boolean
  promptPassingApproved: boolean
  modelCallsApproved: boolean
  networkApproved: boolean
  credentialAccessApproved: boolean
  toolsetEnablementApproved: boolean
  findingsUseApproved: boolean
  canProceedToResearchExecutionApprovalRetry: boolean
  canProceedToResearchExecutionApproval: boolean
  canProceedToResearchRuntimeAdapterExecution: boolean
  canProceedToKeepHermesResearchBlockedDecision: boolean
  canRunResearchNow: boolean
  canExecuteHermesNow: boolean
  canPassPromptNow: boolean
  canUseNetworkNow: boolean
  canUseCredentialsNow: boolean
  canReadEnvSecretsNow: boolean
  canCallModelsNow: boolean
  canEnableToolsetsNow: boolean
  canMutateFilesystemNow: boolean
  canUseFindings: boolean
  recommendedNextStep: string
}
