export type FactoryHermesResearchExecutionPlanningVersion = '1.0'
export type FactoryHermesResearchExecutionPlanningKind = 'factory-hermes-research-execution-planning'
export type FactoryHermesResearchExecutionPlanningStatus = 'plan_candidate_created' | 'manual_review_required' | 'blocked'
export type FactoryHermesResearchExecutionPlanningDecision =
  | 'hermes_research_execution_plan_candidate_created'
  | 'hermes_research_execution_requires_manual_command_review'
  | 'blocked_missing_jefe_review_v2'
  | 'blocked_jefe_review_v2_not_approved'
  | 'blocked_help_probe_not_available'
  | 'blocked_unsafe_planning_input'

export type FactoryHermesResearchExecutionMethodCandidateStatus =
  | 'candidate'
  | 'manual_review_required'
  | 'not_recommended_for_now'
  | 'requires_future_policy'
  | 'forbidden_until_credentials_policy'
  | 'forbidden'

export interface FactoryHermesResearchExecutionPlanningPolicy {
  requireJefeReviewV2Approved: boolean
  requireHelpProbeSucceeded: boolean
  requireNoCurrentExecution: boolean
  requireNoNetwork: boolean
  requireNoCredentials: boolean
  requireNoModelCalls: boolean
  requireManualReviewWhenPromptOrModelIsImplied: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidPromptPassingInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidCredentialsInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidUvInThisGate: boolean
  forbidPipInThisGate: boolean
  forbidPythonInThisGate: boolean
  forbidSetupPyInThisGate: boolean
}

export interface FactoryHermesResearchExecutionHelpProbeInspectionSummary {
  helpProbeStatus: string
  helpOutputRef: string
  hasOneshotPromptFlag: boolean
  hasModelFlag: boolean
  hasProviderFlag: boolean
  hasToolsetsFlag: boolean
  hasSafeModeFlag: boolean
  hasIgnoreUserConfigFlag: boolean
  hasExplicitDryRunOrMockFlag: boolean
  hasExplicitNoNetworkResearchFlag: boolean
  evidence: string[]
}

export interface FactoryHermesResearchExecutionSourceInspectionSummary {
  sourceRootRef: string
  inspectedFiles: string[]
  pyprojectPresent: boolean
  readmePresent: boolean
  hermesCliMainPresent: boolean
  consoleScriptEvidence?: string
  safeMockOrDryRunEvidence: boolean
  notes: string[]
}

export interface FactoryHermesResearchExecutionMethodCandidate {
  candidateId: string
  methodType:
    | 'help_derived_noninteractive_research_command'
    | 'source_mapped_research_command'
    | 'interactive_cli_research_session'
    | 'networked_research_execution'
    | 'credentialed_model_research_execution'
    | 'mock_or_dry_run_research_execution'
    | 'help_output_as_research_source'
  status: FactoryHermesResearchExecutionMethodCandidateStatus
  commandShapeText: string
  evidence: string[]
  risks: string[]
  requiresNetwork: boolean
  requiresCredentials: boolean
  mayCallModels: boolean
  canBeApprovedNow: boolean
}

export interface FactoryHermesResearchExecutionPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesResearchExecutionPlanningDecision
  scope: 'hermes_research_execution_planning_only'
  approvedNextGate?: 'Factory Hermes Research Execution Approval Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionPlanCandidate {
  planId: string
  toolId: 'hermes_agent'
  commandName: 'hermes'
  pythonEntrypoint: 'hermes_cli.main:main'
  executableRef: string
  selectedMethodCandidateId: string
  commandShapeText: string
  promptPolicy: string
  networkPolicy: string
  credentialsPolicy: string
  modelCallPolicy: string
  outputPolicy: string
  requiredNextGate: 'Factory Hermes Research Execution Approval Gate v1'
  canRunResearchNow: false
  canExecuteHermesNow: false
}

export interface FactoryHermesResearchExecutionPlanningCheck { checkId: string; message: string }
export interface FactoryHermesResearchExecutionPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesResearchExecutionPlanningWarning { warningId: string; message: string }

export interface FactoryHermesResearchExecutionPlanningInput {
  plannedAt: string
  plannedBy: string
  researchJefeReviewV2Result?: any
  helpProbeInspectionSummary?: FactoryHermesResearchExecutionHelpProbeInspectionSummary
  sourceInspectionSummary?: FactoryHermesResearchExecutionSourceInspectionSummary
  policy?: Partial<FactoryHermesResearchExecutionPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesResearchExecutionPlanningResult {
  planningId: string
  planningKind: FactoryHermesResearchExecutionPlanningKind
  planningVersion: FactoryHermesResearchExecutionPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandName: string
  pythonEntrypoint: string
  executableRef: string
  executableSha256: string
  currentVerifiedCapability: 'help_probe_only'
  helpProbeInspectionSummary?: FactoryHermesResearchExecutionHelpProbeInspectionSummary
  sourceInspectionSummary?: FactoryHermesResearchExecutionSourceInspectionSummary
  methodCandidates: FactoryHermesResearchExecutionMethodCandidate[]
  selectedMethodCandidate?: FactoryHermesResearchExecutionMethodCandidate
  researchExecutionPlanningReceipt?: FactoryHermesResearchExecutionPlanningReceipt
  hermesResearchExecutionPlanCandidate?: FactoryHermesResearchExecutionPlanCandidate
  checks: FactoryHermesResearchExecutionPlanningCheck[]
  blockers: FactoryHermesResearchExecutionPlanningBlocker[]
  warnings: FactoryHermesResearchExecutionPlanningWarning[]
  status: FactoryHermesResearchExecutionPlanningStatus
  decision: FactoryHermesResearchExecutionPlanningDecision
  canProceedToResearchExecutionApproval: boolean
  canRunResearchNow: false
  canExecuteHermesNow: false
  canPassPromptNow: false
  canUseNetworkNow: false
  canUseCredentialsNow: false
  canCallModelsNow: false
  canUseFindings: false
  canMutateProjectFiles: false
  canDeploy: false
  networkStatus: 'not_allowed'
  credentialsStatus: 'not_allowed'
  modelCallStatus: 'not_allowed'
  hermesExecutionStatus: 'not_executed'
  recommendedNextStep: string
}

export interface FactoryHermesResearchExecutionPlanningValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface FactoryHermesResearchExecutionPlanningSummary {
  planningId: string
  toolId: 'hermes_agent'
  commandName: string
  status: FactoryHermesResearchExecutionPlanningStatus
  decision: FactoryHermesResearchExecutionPlanningDecision
  methodCandidateCount: number
  selectedMethodCandidateId?: string
  canProceedToResearchExecutionApproval: boolean
  canRunResearchNow: false
  canExecuteHermesNow: false
  nextStep: string
}
