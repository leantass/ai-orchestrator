export type FactoryHermesRuntimeSelectionDecisionVersion = '1.0'
export type FactoryHermesRuntimeSelectionDecisionKind = 'factory-hermes-runtime-selection-decision'
export type FactoryHermesRuntimeSelectionDecisionStatus = 'runtime_selection_decision_recorded' | 'blocked'
export type FactoryHermesRuntimeSelectionDecisionDecision = 'hermes_runtime_selection_decision_recorded_for_approval_retry' | 'blocked_invalid_runtime_selection_planning' | 'blocked_invalid_runtime_selection'
export type FactoryHermesRuntimeSelectionStatus = 'selected_for_approval_retry' | 'blocked'

export interface FactoryHermesRuntimeSelectionDecisionInput {
  decidedAt: string
  decidedBy: string
  runtimeSelectionPlanningResult?: any
  researchExecutionApprovalResult?: any
  policyPlanningResults?: Record<string, any>
  selection?: Partial<FactoryHermesRuntimeSelectionDecisionRecord>
  policy?: Partial<FactoryHermesRuntimeSelectionDecisionPolicy>
  decisionNotes?: string
}

export interface FactoryHermesRuntimeSelectionDecisionPolicy {
  requireRuntimeSelectionPlanning: boolean
  requirePlanningAllowsDecision: boolean
  requireOpenAiProviderCandidate: boolean
  requireOpenAiCredentialRefOnly: boolean
  requireNoToolsetsTextOnly: boolean
  requireRunRootUnderCodexTemp: boolean
  forbidExecutionApprovalInThisGate: boolean
  forbidRuntimeAdapterApprovalInThisGate: boolean
  forbidPromptPassingInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkUseInThisGate: boolean
  forbidDnsResolutionInThisGate: boolean
  forbidEndpointTestsInThisGate: boolean
  forbidCredentialValueReadInThisGate: boolean
  forbidEnvSecretReadInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidFilesystemMutationInThisGate: boolean
  forbidRunRootCreationInThisGate: boolean
  forbidFindingsUseInThisGate: boolean
}

export interface FactoryHermesRuntimeSelectedPrompt { promptHash?: string; promptTextRef: 'prompt_candidate_from_prompt_policy'; candidateOnly: true; approvedForExecutionNow: false; promptSentNow: false }
export interface FactoryHermesRuntimeSelectedProvider { providerId: 'openai'; selectedNow: true; approvedForExecutionNow: false }
export interface FactoryHermesRuntimeSelectedModel { modelId: 'gpt-4o-mini'; exactStringRequired: true; noWildcard: true; noLatestAlias: true; selectedNow: true; approvedForExecutionNow: false }
export interface FactoryHermesRuntimeSelectedCredentialRef { credentialRefName: 'OPENAI_API_KEY'; valueKnown: false; valueRead: false; selectedNow: true; approvedForUseNow: false }
export interface FactoryHermesRuntimeSelectedNetworkHosts { selectedHosts: ['api.openai.com']; approvedHostsNow: []; dnsResolvedNow: false; endpointsTestedNow: false; wildcardAllowed: false; arbitraryInternetAllowed: false; approvedForUseNow: false }
export interface FactoryHermesRuntimeSelectedToolsetMode { selectedToolsetMode: 'no_toolsets_text_only'; approvedToolsetsNow: []; selectedNow: true; approvedForExecutionNow: false; hiddenDefaultToolsetsForbidden: true; disabledToolsets: ['web', 'browser', 'terminal', 'mcp', 'filesystem'] }
export interface FactoryHermesRuntimeSelectedRunRoot { selectedRunRoot: string; runRootCreatedNow: false; mustBeCreatedOnlyByFutureRuntimeAdapterIfApproved: true; approvedForFutureRuntimeOnly: true; pathContainmentRequired: true }
export interface FactoryHermesRuntimeSelectedFinalApproval { approvedNow: false; approvalRetryRequired: true }

export interface FactoryHermesRuntimeSelectionDecisionRecord {
  prompt: FactoryHermesRuntimeSelectedPrompt
  provider: FactoryHermesRuntimeSelectedProvider
  model: FactoryHermesRuntimeSelectedModel
  credential: FactoryHermesRuntimeSelectedCredentialRef
  network: FactoryHermesRuntimeSelectedNetworkHosts
  toolsets: FactoryHermesRuntimeSelectedToolsetMode
  runRoot: FactoryHermesRuntimeSelectedRunRoot
  finalApproval: FactoryHermesRuntimeSelectedFinalApproval
}

export interface FactoryHermesRuntimeSelectionDecisionReceipt { receiptId: string; decisionId: string; toolId: 'hermes_agent'; decidedBy: string; decidedAt: string; decision: FactoryHermesRuntimeSelectionDecisionDecision; scope: 'hermes_runtime_selection_decision_only'; approvedNextGate: 'Factory Hermes Research Execution Approval Retry Gate v1'; limitations: string[]; notAuthorizedActions: string[] }
export interface FactoryHermesRuntimeSelectionDecisionCheck { checkId: string; message: string }
export interface FactoryHermesRuntimeSelectionDecisionBlocker { blockerId: string; message: string }
export interface FactoryHermesRuntimeSelectionDecisionWarning { warningId: string; message: string }

export interface FactoryHermesRuntimeSelectionDecisionResult {
  decisionId: string
  decisionKind: FactoryHermesRuntimeSelectionDecisionKind
  decisionVersion: FactoryHermesRuntimeSelectionDecisionVersion
  decidedAt: string
  decidedBy: string
  toolId: 'hermes_agent'
  planningDecisionRef?: string
  approvalDecisionRef?: string
  selectedPrompt: FactoryHermesRuntimeSelectedPrompt
  selectedProvider: FactoryHermesRuntimeSelectedProvider
  selectedModel: FactoryHermesRuntimeSelectedModel
  selectedCredentialRef: FactoryHermesRuntimeSelectedCredentialRef
  selectedNetworkHosts: FactoryHermesRuntimeSelectedNetworkHosts
  selectedToolsetMode: FactoryHermesRuntimeSelectedToolsetMode
  selectedRunRoot: FactoryHermesRuntimeSelectedRunRoot
  selectedFinalApproval: FactoryHermesRuntimeSelectedFinalApproval
  runtimeSelectionDecisionRecord?: FactoryHermesRuntimeSelectionDecisionRecord
  runtimeSelectionDecisionReceipt?: FactoryHermesRuntimeSelectionDecisionReceipt
  checks: FactoryHermesRuntimeSelectionDecisionCheck[]
  blockers: FactoryHermesRuntimeSelectionDecisionBlocker[]
  warnings: FactoryHermesRuntimeSelectionDecisionWarning[]
  status: FactoryHermesRuntimeSelectionDecisionStatus
  decision: FactoryHermesRuntimeSelectionDecisionDecision
  selectionStatus: FactoryHermesRuntimeSelectionStatus
  allSelectionsResolvedForApprovalRetry: boolean
  canProceedToResearchExecutionApprovalRetry: boolean
  canProceedToResearchRuntimeAdapter: false
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

export interface FactoryHermesRuntimeSelectionDecisionValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesRuntimeSelectionDecisionSummary { decisionId: string; status: FactoryHermesRuntimeSelectionDecisionStatus; decision: FactoryHermesRuntimeSelectionDecisionDecision; providerId: string; modelId: string; credentialRefName: string; selectedHosts: string[]; selectedToolsetMode: string; canProceedToResearchExecutionApprovalRetry: boolean; canRunResearchNow: false; nextStep: string }
