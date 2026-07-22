export type FactoryHermesResearchRuntimeAdapterApprovalVersion = '1.0'
export type FactoryHermesResearchRuntimeAdapterApprovalKind = 'factory-hermes-research-runtime-adapter-approval'
export type FactoryHermesResearchRuntimeAdapterApprovalStatus = 'research_runtime_adapter_approval_granted' | 'research_runtime_adapter_approval_blocked'
export type FactoryHermesResearchRuntimeAdapterApprovalDecision = 'hermes_research_runtime_adapter_approved_for_first_controlled_oneshot_runtime_candidate' | 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified'
export type FactoryHermesResearchRuntimeAdapterApprovalStatusValue = 'approved_for_runtime_adapter_candidate' | 'blocked'
export type FactoryHermesToolsetDisableSupportStatus = 'verified_from_source_or_policy_artifacts' | 'unverified_requires_toolset_disable_verification'

export interface FactoryHermesResearchRuntimeAdapterApprovalInput {
  evaluatedAt: string
  evaluatedBy: string
  finalExecutionApprovalResult?: any
  runtimeSelectionDecisionResult?: any
  toolsetDisableSupportStatus?: FactoryHermesToolsetDisableSupportStatus
  policy?: Partial<FactoryHermesResearchRuntimeAdapterApprovalPolicy>
  evaluationNotes?: string
}

export interface FactoryHermesResearchRuntimeAdapterApprovalPolicy {
  requireFinalExecutionApproval: boolean
  requireRuntimeSelectionDecision: boolean
  requireApprovedRuntimeSelectionSnapshot: boolean
  requireExactCommandEnvelope: boolean
  requireExactProviderModelCredentialHost: boolean
  requireToolsetDisableSupportOrBlock: boolean
  requireRuntimeRunRootUnderCodexTemp: boolean
  requireNoExecutionInThisGate: boolean
  requireNoCredentialReadInThisGate: boolean
  requireNoNetworkInThisGate: boolean
  requireNoModelCallsInThisGate: boolean
  requireNoPromptPassingInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidUsingFindingsInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesResearchRuntimeAdapterCommandEnvelope { executable: string; cwd: string; shell: false; stdinAllowed: false; interactiveModeAllowed: false; oneShotOnly: true; argsTemplate: string[]; promptSourceRef: 'prompt_candidate_from_prompt_policy'; promptSentNow: false; executeNow: false }
export interface FactoryHermesResearchRuntimeAdapterEnvEnvelope { inheritParentEnv: false; dotEnvReadAllowed: false; fullEnvDumpAllowed: false; envSecretReadAllowedInThisGate: false; futureRuntimeMayReadExactCredentialRef: 'OPENAI_API_KEY'; futureRuntimeCredentialReadAllowedOnlyInsideAdapter: true; futureRuntimeMustNotLogCredentialValue: true; allowedFutureEnvKeys: string[]; forbiddenEnv: string[] }
export interface FactoryHermesResearchRuntimeAdapterCredentialEnvelope { credentialRefName: 'OPENAI_API_KEY'; valueReadNow: false; valueKnownNow: false; futureRuntimeMayUseCredentialRef: true; futureRuntimeMustFailIfMissing: true; noArtifactMayContainCredentialValue: true }
export interface FactoryHermesResearchRuntimeAdapterNetworkEnvelope { networkUsedNow: false; futureRuntimeMayUseNetwork: true; approvedHostForFutureRuntime: 'api.openai.com'; allowedHosts: ['api.openai.com']; wildcardHostsAllowed: false; arbitraryInternetAllowed: false; dnsResolvedNow: false; endpointsTestedNow: false; redirectsToUnapprovedHostsForbidden: true }
export interface FactoryHermesResearchRuntimeAdapterToolsetEnvelope { selectedToolsetMode: 'no_toolsets_text_only'; toolsetDisableSupportStatus: FactoryHermesToolsetDisableSupportStatus; webToolsAllowed: false; browserToolsAllowed: false; terminalToolsAllowed: false; filesystemToolsAllowed: false; mcpAllowed: false; hiddenDefaultToolsetsForbidden: true; unexpectedToolUseMustBlock: true }
export interface FactoryHermesResearchRuntimeAdapterFilesystemEnvelope { runRoot: string; runRootCreatedNow: false; futureRuntimeMayCreateRunRoot: true; futureWritesRestrictedToRunRoot: true; sourceRootReadOnly: true; projectWritesForbidden: true; dotEnvReadWriteForbidden: true; pathContainmentRequired: true }
export interface FactoryHermesResearchRuntimeAdapterTimeoutEnvelope { commandTimeoutMs: 120000; maxCommandTimeoutMs: 300000; hardTimeoutRequired: true; noInfiniteTimeout: true; autoRetryAllowed: false; retryRequiresJefeReview: true; shutdownGraceMs: 5000 }
export interface FactoryHermesResearchRuntimeAdapterOutputEnvelope { stdoutPreviewLimitBytes: 12000; stderrPreviewLimitBytes: 12000; sanitizeStdout: true; sanitizeStderr: true; usageFileMetadataOnly: true; outputUseAsFindingsNow: false; futureResultIngestionRequired: true; futureJefeReviewRequired: true }
export interface FactoryHermesApprovedResearchRuntimeAdapterEnvelope { envelopeId: string; toolId: 'hermes_agent'; commandEnvelope: FactoryHermesResearchRuntimeAdapterCommandEnvelope; envEnvelope: FactoryHermesResearchRuntimeAdapterEnvEnvelope; credentialEnvelope: FactoryHermesResearchRuntimeAdapterCredentialEnvelope; networkEnvelope: FactoryHermesResearchRuntimeAdapterNetworkEnvelope; toolsetEnvelope: FactoryHermesResearchRuntimeAdapterToolsetEnvelope; filesystemEnvelope: FactoryHermesResearchRuntimeAdapterFilesystemEnvelope; timeoutEnvelope: FactoryHermesResearchRuntimeAdapterTimeoutEnvelope; outputEnvelope: FactoryHermesResearchRuntimeAdapterOutputEnvelope; adapterLimits: Record<string, true> }
export interface FactoryHermesResearchRuntimeAdapterApprovalDecisionRecord { decisionId: string; toolId: 'hermes_agent'; runtimeAdapterApprovalStatus: FactoryHermesResearchRuntimeAdapterApprovalStatusValue; decision: FactoryHermesResearchRuntimeAdapterApprovalDecision; reason: string; finalExecutionApprovalValidated: boolean; runtimeSelectionsValidated: boolean; adapterEnvelopeCreated: boolean; runtimeAdapterApprovedForNextGate: boolean; executionApprovedInThisGate: false; canProceedToResearchRuntimeAdapter: boolean; requiredNextGate: string }
export interface FactoryHermesResearchRuntimeAdapterApprovalReceipt { receiptId: string; adapterApprovalId: string; toolId: 'hermes_agent'; evaluatedBy: string; evaluatedAt: string; decision: FactoryHermesResearchRuntimeAdapterApprovalDecision; runtimeAdapterApprovalStatus: FactoryHermesResearchRuntimeAdapterApprovalStatusValue; scope: 'hermes_research_runtime_adapter_approval_only'; approvedNextGate: string; limitations: string[]; notAuthorizedActions: string[] }
export interface FactoryHermesResearchRuntimeAdapterApprovalCheck { checkId: string; message: string }
export interface FactoryHermesResearchRuntimeAdapterApprovalBlocker { blockerId: string; message: string }
export interface FactoryHermesResearchRuntimeAdapterApprovalWarning { warningId: string; message: string }

export interface FactoryHermesResearchRuntimeAdapterApprovalResult {
  adapterApprovalId: string
  adapterApprovalKind: FactoryHermesResearchRuntimeAdapterApprovalKind
  adapterApprovalVersion: FactoryHermesResearchRuntimeAdapterApprovalVersion
  evaluatedAt: string
  evaluatedBy: string
  toolId: 'hermes_agent'
  finalExecutionApprovalRef?: string
  runtimeSelectionDecisionRef?: string
  toolsetDisableSupportStatus: FactoryHermesToolsetDisableSupportStatus
  approvedResearchRuntimeAdapterEnvelope?: FactoryHermesApprovedResearchRuntimeAdapterEnvelope
  hermesResearchRuntimeAdapterApprovalDecision: FactoryHermesResearchRuntimeAdapterApprovalDecisionRecord
  researchRuntimeAdapterApprovalReceipt: FactoryHermesResearchRuntimeAdapterApprovalReceipt
  checks: FactoryHermesResearchRuntimeAdapterApprovalCheck[]
  blockers: FactoryHermesResearchRuntimeAdapterApprovalBlocker[]
  warnings: FactoryHermesResearchRuntimeAdapterApprovalWarning[]
  status: FactoryHermesResearchRuntimeAdapterApprovalStatus
  decision: FactoryHermesResearchRuntimeAdapterApprovalDecision
  runtimeAdapterApprovalStatus: FactoryHermesResearchRuntimeAdapterApprovalStatusValue
  canProceedToResearchRuntimeAdapter: boolean
  canProceedToToolsetDisableVerificationPlanning: boolean
  canProceedToResearchExecutionRuntime: false
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

export interface FactoryHermesResearchRuntimeAdapterApprovalValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesResearchRuntimeAdapterApprovalSummary { adapterApprovalId: string; status: FactoryHermesResearchRuntimeAdapterApprovalStatus; decision: FactoryHermesResearchRuntimeAdapterApprovalDecision; runtimeAdapterApprovalStatus: FactoryHermesResearchRuntimeAdapterApprovalStatusValue; toolsetDisableSupportStatus: FactoryHermesToolsetDisableSupportStatus; canProceedToResearchRuntimeAdapter: boolean; canRunResearchNow: false; nextStep: string }
