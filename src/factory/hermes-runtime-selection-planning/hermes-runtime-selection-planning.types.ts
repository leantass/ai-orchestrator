export type FactoryHermesRuntimeSelectionPlanningVersion = '1.0'
export type FactoryHermesRuntimeSelectionPlanningKind = 'factory-hermes-runtime-selection-planning'
export type FactoryHermesRuntimeSelectionPlanningStatus = 'runtime_selection_plan_created' | 'blocked'
export type FactoryHermesRuntimeSelectionPlanningDecision = 'hermes_runtime_selection_plan_created_manual_selection_required' | 'blocked_invalid_research_execution_approval'

export interface FactoryHermesRuntimeSelectionPlanningInput {
  plannedAt: string
  plannedBy: string
  researchExecutionApprovalResult?: any
  researchExecutionBoundaryPlanningResult?: any
  policyPlanningResults?: Record<string, any>
  policy?: Partial<FactoryHermesRuntimeSelectionPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesRuntimeSelectionPlanningPolicy {
  requireResearchExecutionApprovalBlocked: boolean
  requireRuntimeSelectionRequirements: boolean
  requirePromptCandidateFromPromptPolicy: boolean
  requireProviderCandidatesFromProviderPolicy: boolean
  requireCredentialRefsOnly: boolean
  requireNoSecretValues: boolean
  requireNoFinalSelectionInThisGate: boolean
  requireHumanDecisionPack: boolean
  requireRuntimeSelectionDecisionNext: boolean
  forbidExecutionInThisGate: boolean
  forbidFinalRuntimeSelectionInThisGate: boolean
  forbidPromptPassingInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidFilesystemMutationInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesRuntimePromptSelectionCandidate { candidateId: string; status: 'candidate_only_requires_human_approval'; selectedNow: false; approvedForExecutionNow: false; promptHash?: string; text?: string; policyRequirements: string[] }
export interface FactoryHermesRuntimeProviderSelectionCandidate { candidateId: string; providerId: string; status: 'manual_selection_required' | 'not_available' | 'forbidden'; selectedNow: false; approvedForExecutionNow: false; reason?: string }
export interface FactoryHermesRuntimeModelSelectionCandidate { candidateId: string; status: 'manual_exact_model_selection_required'; selectedModel: null; selectedNow: false; approvedForExecutionNow: false; noWildcard: true; noLatestAliasWithoutExplicitApproval: true }
export interface FactoryHermesRuntimeCredentialSelectionCandidate { candidateId: string; credentialRef: string; valueKnown: false; valueRead: false; selectedNow: false; approvedForUseNow: false }
export interface FactoryHermesRuntimeNetworkHostSelectionCandidate { candidateId: string; hostCandidates: string[]; selectedHostsNow: []; approvedHostsNow: []; wildcardAllowed: false; arbitraryInternetAllowed: false; status: 'manual_exact_host_selection_required' }
export interface FactoryHermesRuntimeToolsetSelectionCandidate { candidateId: string; toolsetId: string; status: 'candidate_requires_approval' | 'forbidden_until_policy' | 'forbidden'; selectedNow: false; approvedForExecutionNow: false; reason: string }
export interface FactoryHermesRuntimeRunRootSelectionCandidate { candidateId: string; rootPattern: string; selectedRunRootNow: null; runRootCreatedNow: false; approvalRequired: true; pathContainmentRequired: true }
export interface FactoryHermesRuntimeFinalApprovalSelectionCandidate { candidateId: string; finalExecutionApprovalRequired: true; approvedNow: false; approvalRetryRequired: true }
export interface FactoryHermesRuntimeSelectionRequirement { requirementId: string; status: 'required_not_satisfied'; blocksExecutionNow: true; reason: string }
export interface FactoryHermesRuntimeSelectionDecisionPackItem { decisionId: string; currentStatus: 'pending_human_decision'; options: string[]; recommendedConservativeOption?: string; risks: string[]; blockedUntilChosen: true }
export interface FactoryHermesRuntimeSelectionDecisionPack { packId: string; decisions: FactoryHermesRuntimeSelectionDecisionPackItem[] }

export interface FactoryHermesRuntimeSelectionPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']; shell: false }
  promptSelectionCandidates: FactoryHermesRuntimePromptSelectionCandidate[]
  providerSelectionCandidates: FactoryHermesRuntimeProviderSelectionCandidate[]
  modelSelectionCandidates: FactoryHermesRuntimeModelSelectionCandidate[]
  credentialSelectionCandidates: FactoryHermesRuntimeCredentialSelectionCandidate[]
  networkHostSelectionCandidates: FactoryHermesRuntimeNetworkHostSelectionCandidate[]
  toolsetSelectionCandidates: FactoryHermesRuntimeToolsetSelectionCandidate[]
  runtimeRunRootSelectionCandidates: FactoryHermesRuntimeRunRootSelectionCandidate[]
  finalApprovalSelectionCandidate: FactoryHermesRuntimeFinalApprovalSelectionCandidate
  leanRuntimeSelectionDecisionPack: FactoryHermesRuntimeSelectionDecisionPack
  allSelectionsResolvedNow: false
  executionApprovalRetryAllowedNow: false
  runtimeAdapterAllowedNow: false
  researchExecutionAllowedNow: false
  finalHumanDecisionRequired: true
  canProceedToRuntimeSelectionDecision: true
  canProceedToResearchExecutionApprovalRetry: false
  canProceedToResearchRuntimeAdapter: false
  canRunResearchNow: false
}

export interface FactoryHermesRuntimeSelectionPlanningReceipt { receiptId: string; planningId: string; toolId: 'hermes_agent'; plannedBy: string; plannedAt: string; decision: FactoryHermesRuntimeSelectionPlanningDecision; scope: 'hermes_runtime_selection_planning_only'; approvedNextGate: 'Factory Hermes Runtime Selection Decision Gate v1'; limitations: string[]; notAuthorizedActions: string[] }
export interface FactoryHermesRuntimeSelectionPlanningCheck { checkId: string; message: string }
export interface FactoryHermesRuntimeSelectionPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesRuntimeSelectionPlanningWarning { warningId: string; message: string }

export interface FactoryHermesRuntimeSelectionPlanningResult {
  planningId: string
  planningKind: FactoryHermesRuntimeSelectionPlanningKind
  planningVersion: FactoryHermesRuntimeSelectionPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  approvalDecisionRef?: string
  boundaryDecisionRef?: string
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  promptSelectionCandidates: FactoryHermesRuntimePromptSelectionCandidate[]
  providerSelectionCandidates: FactoryHermesRuntimeProviderSelectionCandidate[]
  modelSelectionCandidates: FactoryHermesRuntimeModelSelectionCandidate[]
  credentialSelectionCandidates: FactoryHermesRuntimeCredentialSelectionCandidate[]
  networkHostSelectionCandidates: FactoryHermesRuntimeNetworkHostSelectionCandidate[]
  toolsetSelectionCandidates: FactoryHermesRuntimeToolsetSelectionCandidate[]
  runtimeRunRootSelectionCandidates: FactoryHermesRuntimeRunRootSelectionCandidate[]
  finalApprovalSelectionCandidate: FactoryHermesRuntimeFinalApprovalSelectionCandidate
  runtimeSelectionRequirements: FactoryHermesRuntimeSelectionRequirement[]
  leanRuntimeSelectionDecisionPack: FactoryHermesRuntimeSelectionDecisionPack
  runtimeSelectionPlanningReceipt?: FactoryHermesRuntimeSelectionPlanningReceipt
  hermesRuntimeSelectionPlanCandidate?: FactoryHermesRuntimeSelectionPlanCandidate
  checks: FactoryHermesRuntimeSelectionPlanningCheck[]
  blockers: FactoryHermesRuntimeSelectionPlanningBlocker[]
  warnings: FactoryHermesRuntimeSelectionPlanningWarning[]
  status: FactoryHermesRuntimeSelectionPlanningStatus
  decision: FactoryHermesRuntimeSelectionPlanningDecision
  canProceedToRuntimeSelectionDecision: boolean
  canProceedToResearchExecutionApprovalRetry: false
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

export interface FactoryHermesRuntimeSelectionPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesRuntimeSelectionPlanningSummary { planningId: string; status: FactoryHermesRuntimeSelectionPlanningStatus; decision: FactoryHermesRuntimeSelectionPlanningDecision; decisionPackItemCount: number; allSelectionsResolvedNow: false; canProceedToRuntimeSelectionDecision: boolean; canProceedToResearchExecutionApprovalRetry: false; canRunResearchNow: false; nextStep: string }
