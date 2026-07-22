export type FactoryHermesEntrypointMaterializationJefeReviewVersion = '1.0'
export type FactoryHermesEntrypointMaterializationJefeReviewKind = 'factory-hermes-entrypoint-materialization-jefe-review'
export type FactoryHermesEntrypointMaterializationJefeReviewStatus = 'approved_for_build_dependency_cache_planning' | 'blocked' | 'human_review_required' | 'changes_required'
export type FactoryHermesEntrypointMaterializationJefeReviewDecision = 'hermes_entrypoint_materialization_jefe_review_approved_build_dependency_cache_planning' | 'blocked_missing_materialization_ingestion' | 'blocked_materialization_ingestion_not_reviewable' | 'blocked_not_build_dependency_cache_miss' | 'blocked_materialization_boundary_violation' | 'blocked_missing_human_approval' | 'request_materialization_repair_before_review'

export interface FactoryHermesEntrypointMaterializationJefeReviewPolicy {
  requireMaterializationIngestion: boolean
  requireHumanApprovalRef: boolean
  requireControlledBuildDependencyCacheMiss: boolean
  requireNoRuntimeExecutionInThisGate: boolean
  requireNoNetworkInThisGate: boolean
  forbidCacheBuildDependencyNow: boolean
  forbidNetworkEnableNow: boolean
  forbidMaterializationRetryNow: boolean
  forbidResearchAdapterRetryNow: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidUvExecutionInThisGate: boolean
  forbidPipExecutionInThisGate: boolean
  forbidPythonExecutionInThisGate: boolean
  forbidSetupPyExecutionInThisGate: boolean
  forbidCredentialsInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidProjectMutationInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesEntrypointMaterializationJefeReviewInput {
  reviewedAt: string
  reviewedBy: string
  reviewerRole?: string
  humanApprovalRef?: string
  materializationResultIngestionResult?: any
  materializationRuntimeResult?: any
  materializationApprovalResult?: any
  policy?: Partial<FactoryHermesEntrypointMaterializationJefeReviewPolicy>
  reviewNotes?: string
}

export interface FactoryHermesEntrypointMaterializationJefeReviewCheck { checkId: string; status: 'passed' | 'failed'; message: string }
export interface FactoryHermesEntrypointMaterializationJefeReviewBlocker { blockerId: string; message: string }
export interface FactoryHermesEntrypointMaterializationJefeReviewWarning { warningId: string; message: string }

export interface FactoryHermesEntrypointMaterializationJefeReviewReceipt {
  receiptId: string
  jefeReviewId: string
  toolId: 'hermes_agent'
  reviewedBy: string
  reviewedAt: string
  humanApprovalRef: string
  decision: FactoryHermesEntrypointMaterializationJefeReviewDecision
  scope: 'hermes_entrypoint_materialization_build_dependency_cache_planning_only'
  approvedNextGate: 'Factory Hermes Build Dependency Cache Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesEntrypointMaterializationJefeReviewRecord {
  recordId: string
  jefeReviewId: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  pythonEntrypoint: string
  runtimeDecision: string
  classification: string
  normalizedOutcome: string
  missingBuildDependency: string
  buildBackend: string
  setupPyPresent: boolean
  jefeAssessment: string
  rootCause: string
  safetyConclusion: string
  canProceedToBuildDependencyCachePlanning: boolean
  canCacheBuildDependenciesNow: false
  canEnableNetworkNow: false
  canRetryMaterializationNow: false
}

export interface FactoryHermesBuildDependencyCachePlanningEnvelope {
  envelopeId: string
  jefeReviewId: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  pythonEntrypoint: string
  missingBuildDependency: string
  buildBackend: string
  setupPyPresent: boolean
  uvExecutableRef: string
  uvCacheRootRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  currentFailure: string
  allowedNextGate: 'Factory Hermes Build Dependency Cache Planning Gate v1'
  cacheAllowedNow: false
  networkAllowedNow: false
  materializationRetryAllowedNow: false
  hermesExecutionAllowedNow: false
  requiredPlanningQuestions: string[]
  requiredFutureGates: string[]
  recommendedNextStep: string
}

export interface FactoryHermesEntrypointMaterializationJefeReviewResult {
  jefeReviewId: string
  jefeReviewKind: FactoryHermesEntrypointMaterializationJefeReviewKind
  jefeReviewVersion: FactoryHermesEntrypointMaterializationJefeReviewVersion
  reviewedAt: string
  reviewedBy: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  pythonEntrypoint: string
  runtimeDecision: string
  classification: string
  normalizedOutcome: string
  missingBuildDependency: string
  buildBackend: string
  setupPyPresent: boolean
  jefeReviewReceipt?: FactoryHermesEntrypointMaterializationJefeReviewReceipt
  hermesEntrypointMaterializationJefeReviewRecord?: FactoryHermesEntrypointMaterializationJefeReviewRecord
  buildDependencyCachePlanningEnvelope?: FactoryHermesBuildDependencyCachePlanningEnvelope
  checks: FactoryHermesEntrypointMaterializationJefeReviewCheck[]
  blockers: FactoryHermesEntrypointMaterializationJefeReviewBlocker[]
  warnings: FactoryHermesEntrypointMaterializationJefeReviewWarning[]
  status: FactoryHermesEntrypointMaterializationJefeReviewStatus
  decision: FactoryHermesEntrypointMaterializationJefeReviewDecision
  canProceedToBuildDependencyCachePlanning: boolean
  canCacheBuildDependenciesNow: false
  canEnableNetworkNow: false
  canRetryMaterializationNow: false
  canRetryResearchAdapterNow: false
  canMaterializeEntrypointNow: false
  canExecuteHermes: false
  canRunHermesScripts: false
  canUseNetwork: false
  canUseCredentials: false
  canCallModels: false
  canMutateProjectFiles: false
  canDeploy: false
  recommendedNextStep: string
}

export interface FactoryHermesEntrypointMaterializationJefeReviewValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesEntrypointMaterializationJefeReviewSummary {
  jefeReviewId: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  runtimeDecision: string
  classification: string
  normalizedOutcome: string
  missingBuildDependency: string
  status: FactoryHermesEntrypointMaterializationJefeReviewStatus
  decision: FactoryHermesEntrypointMaterializationJefeReviewDecision
  canProceedToBuildDependencyCachePlanning: boolean
  canCacheBuildDependenciesNow: false
  canEnableNetworkNow: false
  nextStep: string
}
