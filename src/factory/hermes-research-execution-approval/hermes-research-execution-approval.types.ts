export type FactoryHermesResearchExecutionApprovalVersion = '1.0'
export type FactoryHermesResearchExecutionApprovalKind = 'factory-hermes-research-execution-approval'
export type FactoryHermesResearchExecutionApprovalStatus = 'research_execution_approval_granted' | 'research_execution_approval_blocked'
export type FactoryHermesResearchExecutionApprovalDecision = 'hermes_research_execution_approval_granted_for_controlled_runtime_planning' | 'hermes_research_execution_approval_blocked_evidence_incomplete_or_unsafe'

export interface FactoryHermesResearchExecutionApprovalPolicy { [key: string]: boolean }
export interface FactoryHermesResearchExecutionApprovalInput {
  approvedAt: string
  approvedBy: string
  researchExecutionApprovalRetryResult?: any
  researchRuntimeAdapterResult?: any
  adapterApprovalRetryResult?: any
  wrapperVerificationReviewResult?: any
  wrapperVerificationResult?: any
  runtimeSelectionDecisionResult?: any
  finalExecutionApprovalResult?: any
  policy?: Partial<FactoryHermesResearchExecutionApprovalPolicy>
}

export interface FactoryHermesExecutionReadinessReview {
  researchExecutionApprovalRetryGranted: boolean
  researchRuntimeAdapterPrepared: boolean
  adapterPreparedCodeOnly: boolean
  wrapperBoundaryIntegrated: boolean
  adapterCommandEnvelopeNonExecutable: boolean
  adapterSafetyManifestPresent: boolean
  wrapperVerificationReviewAccepted: boolean
  runtimeSelectionKnown: boolean
  provider: 'openai'
  model: 'gpt-4o-mini'
  credentialRef: 'OPENAI_API_KEY'
  host: 'api.openai.com'
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  noLiveTempConfig: boolean
  noRunRootCreated: boolean
  noPromptAvailableForExecution: boolean
  noCredentialValuesAvailable: boolean
  noNetworkApproved: boolean
  noModelCallsApproved: boolean
  noToolsetsApproved: boolean
  evidenceSupportsControlledRuntimePlanning: boolean
  evidenceDoesNotApproveImmediateExecution: boolean
  readinessSummary: string[]
}

export interface FactoryHermesExecutionApprovalLimitationsCarryForward {
  limitations: string[]
  limitationsAcceptableForControlledRuntimePlanning: boolean
  limitationsBlockImmediateRuntimeExecution: boolean
  limitationsBlockImmediateResearchExecution: boolean
  limitationsBlockImmediateFindingsUse: boolean
}

export interface FactoryHermesExecutionApprovalRiskDisposition {
  riskId: string
  severity: 'high' | 'critical'
  disposition: 'accepted_for_controlled_runtime_planning_only'
  mitigation: string
  blocksControlledRuntimePlanning: boolean
  blocksImmediateRuntimeExecution: boolean
  blocksResearchExecution: boolean
}

export interface FactoryHermesExecutionApprovalRiskDispositionRegister {
  registerId: string
  dispositions: FactoryHermesExecutionApprovalRiskDisposition[]
}

export interface FactoryHermesControlledResearchRuntimePlanningEnvelope {
  envelopeId: string
  toolId: 'hermes_agent'
  approvedFor: 'controlled_research_runtime_planning_only'
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  sourceExecutionApprovalRef: 'research-execution-approval-result.json'
  sourceAdapterRef: 'research-runtime-adapter-result.json'
  targetNextGate: 'Factory Hermes Controlled Research Runtime Planning Gate v1'
  purpose: string
  allowedInNextGate: string[]
  forbiddenEvenInNextGate: string[]
  flags: Record<string, boolean>
  recommendedNextGate: 'Factory Hermes Controlled Research Runtime Planning Gate v1'
}

export interface FactoryHermesResearchExecutionApprovalReceipt {
  receiptId: string
  approvalId: string
  toolId: 'hermes_agent'
  approvedBy: string
  approvedAt: string
  decision: FactoryHermesResearchExecutionApprovalDecision
  executionApprovalStatus: 'approved_for_controlled_runtime_planning_only' | 'blocked'
  scope: 'hermes_research_execution_approval_only'
  approvedNextGate: string
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesResearchExecutionApprovalDecisionRecord {
  decisionId: string
  toolId: 'hermes_agent'
  executionApprovalStatus: 'approved_for_controlled_runtime_planning_only' | 'blocked'
  decision: FactoryHermesResearchExecutionApprovalDecision
  reason: string
  researchExecutionApprovalRetryGranted: boolean
  researchRuntimeAdapterPrepared: boolean
  wrapperVerificationReviewAccepted: boolean
  controlledResearchRuntimePlanningAllowed: boolean
  researchExecutionApprovedNow: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  hermesExecutionAllowedNow: boolean
  promptPassingAllowedNow: boolean
  modelCallsAllowedNow: boolean
  networkAllowedNow: boolean
  credentialAccessAllowedNow: boolean
  toolsetEnablementAllowedNow: boolean
  tempConfigCreationAllowedNow: boolean
  runRootCreationAllowedNow: boolean
  findingsUseAllowedNow: boolean
  canProceedToControlledResearchRuntimePlanning: boolean
  requiredNextGate: string
}

export interface FactoryHermesResearchExecutionApprovalBlockerPlan {
  blockerPlanId: string
  toolId: 'hermes_agent'
  blockerType: 'execution_approval_evidence_incomplete_or_unsafe'
  blockers: string[]
  resolutionOptions: string[]
  recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
}

export interface FactoryHermesResearchExecutionApprovalCheck { checkId: string, passed: boolean, message: string }
export interface FactoryHermesResearchExecutionApprovalBlocker { blockerId: string, message: string }
export interface FactoryHermesResearchExecutionApprovalWarning { warningId: string, message: string }
export interface FactoryHermesResearchExecutionApprovalValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesResearchExecutionApprovalSummary { approvalId: string, status: string, decision: string, canProceedToControlledResearchRuntimePlanning: boolean, canRunResearchNow: boolean }

export interface FactoryHermesResearchExecutionApprovalResult {
  approvalId: string
  approvalKind: FactoryHermesResearchExecutionApprovalKind
  approvalVersion: FactoryHermesResearchExecutionApprovalVersion
  approvedAt: string
  approvedBy: string
  toolId: 'hermes_agent'
  executionApprovalRetryRef?: string
  researchRuntimeAdapterRef?: string
  wrapperVerificationReviewRef?: string
  selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets'
  executionReadinessReview: FactoryHermesExecutionReadinessReview
  executionApprovalLimitationsCarryForward: FactoryHermesExecutionApprovalLimitationsCarryForward
  executionApprovalRiskDispositionRegister: FactoryHermesExecutionApprovalRiskDispositionRegister
  controlledResearchRuntimePlanningEnvelope?: FactoryHermesControlledResearchRuntimePlanningEnvelope
  researchExecutionApprovalReceipt: FactoryHermesResearchExecutionApprovalReceipt
  hermesResearchExecutionApprovalDecision: FactoryHermesResearchExecutionApprovalDecisionRecord
  approvalBlockerPlan?: FactoryHermesResearchExecutionApprovalBlockerPlan
  checks: FactoryHermesResearchExecutionApprovalCheck[]
  blockers: FactoryHermesResearchExecutionApprovalBlocker[]
  warnings: FactoryHermesResearchExecutionApprovalWarning[]
  status: FactoryHermesResearchExecutionApprovalStatus
  decision: FactoryHermesResearchExecutionApprovalDecision
  executionApprovalStatus: 'approved_for_controlled_runtime_planning_only' | 'blocked'
  controlledResearchRuntimePlanningAllowed: boolean
  researchExecutionApprovedNow: boolean
  runtimeAdapterExecutionAllowedNow: boolean
  hermesExecutionAllowedNow: boolean
  promptPassingAllowedNow: boolean
  modelCallsAllowedNow: boolean
  networkAllowedNow: boolean
  credentialAccessAllowedNow: boolean
  toolsetEnablementAllowedNow: boolean
  tempConfigCreationAllowedNow: boolean
  runRootCreationAllowedNow: boolean
  findingsUseAllowedNow: boolean
  canProceedToControlledResearchRuntimePlanning: boolean
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
