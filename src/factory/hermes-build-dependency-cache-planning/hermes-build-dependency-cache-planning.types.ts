export type FactoryHermesBuildDependencyCachePlanningVersion = '1.0'
export type FactoryHermesBuildDependencyCachePlanningKind = 'factory-hermes-build-dependency-cache-planning'
export type FactoryHermesBuildDependencyCachePlanningStatus = 'plan_candidate_created' | 'manual_review_required' | 'blocked'
export type FactoryHermesBuildDependencyCachePlanningDecision = 'hermes_build_dependency_cache_plan_candidate_created' | 'hermes_build_dependency_cache_requires_manual_hash_review' | 'blocked_missing_materialization_jefe_review' | 'blocked_jefe_review_not_approved_for_cache_planning' | 'blocked_missing_build_dependency_identity' | 'blocked_source_missing' | 'blocked_uv_cache_root_missing' | 'request_build_dependency_cache_review'

export interface FactoryHermesBuildDependencyCachePlanningPolicy {
  requireMaterializationJefeReviewApproved: boolean
  requireMissingBuildDependency: boolean
  requireBuildBackendRecorded: boolean
  requireUvVerified: boolean
  requireUvCacheRootUnderCodexTemp: boolean
  requireSourceRootUnderCodexTemp: boolean
  requirePythonEnvRootUnderCodexTemp: boolean
  requireApprovalNext: boolean
  forbidCachingInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidNetworkEnablementInThisGate: boolean
  forbidUvExecutionInThisGate: boolean
  forbidPipExecutionInThisGate: boolean
  forbidPythonExecutionInThisGate: boolean
  forbidSetupPyExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidHermesScriptsInThisGate: boolean
  forbidCredentialsInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidProjectMutationInThisGate: boolean
  forbidDeployInThisGate: boolean
  requireCacheApprovalFuture: boolean
  requireCacheRuntimeFuture: boolean
  requireCacheVerificationFuture: boolean
  requireMaterializationRetryFuture: boolean
}

export interface FactoryHermesBuildDependencyCachePlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  materializationJefeReviewResult?: any
  sourceInspection?: any
  cacheInspection?: any
  policy?: Partial<FactoryHermesBuildDependencyCachePlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesBuildDependencyCacheMethodCandidate {
  methodId: string
  status: 'candidate_only' | 'not_recommended_for_now' | 'forbidden'
  description: string
  reason: string
  executableRef?: string
  strategy?: string
  packageConstraint?: string
  cacheRoot?: string
  networkAllowedFuture?: boolean
  requiresHashCapture?: boolean
  requiresArtifactRecord?: boolean
  requiresCacheVerification?: boolean
}

export interface FactoryHermesBuildDependencyCachePlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: 'hermes'
  pythonEntrypoint: 'hermes_cli.main:main'
  missingBuildDependency: string
  buildBackend: 'setuptools.build_meta'
  setupPyPresent: boolean
  uvExecutableRef: string
  uvCacheRootRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  selectedMethodCandidate: 'uv_controlled_build_dependency_cache_prefetch'
  methodCandidates: FactoryHermesBuildDependencyCacheMethodCandidate[]
  cacheScope: 'build_dependency_cache_only'
  proposedCacheRoot: string
  proposedMetadataRoot: string
  proposedNetworkPolicy: Record<string, unknown>
  proposedArtifactPolicy: Record<string, boolean>
  proposedRuntimeSafety: Record<string, boolean>
  proposedVerification: string[]
  requiredNextGates: string[]
}

export interface FactoryHermesBuildDependencyCachePlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  missingBuildDependency: string
  buildBackend: string
  decision: FactoryHermesBuildDependencyCachePlanningDecision
  scope: 'hermes_build_dependency_cache_planning_only'
  approvedNextGate: 'Factory Hermes Build Dependency Cache Approval Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesBuildDependencyCachePlanningCheck { checkId: string; status: 'passed' | 'failed'; message: string }
export interface FactoryHermesBuildDependencyCachePlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesBuildDependencyCachePlanningWarning { warningId: string; message: string }

export interface FactoryHermesBuildDependencyCachePlanningResult {
  planningId: string
  planningKind: FactoryHermesBuildDependencyCachePlanningKind
  planningVersion: FactoryHermesBuildDependencyCachePlanningVersion
  plannedAt: string
  plannedBy: string
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
  sourceInspectionSummary: any
  cacheInspectionSummary: any
  methodCandidates: FactoryHermesBuildDependencyCacheMethodCandidate[]
  selectedMethodCandidate?: string
  buildDependencyCachePlanningReceipt?: FactoryHermesBuildDependencyCachePlanningReceipt
  hermesBuildDependencyCachePlanCandidate?: FactoryHermesBuildDependencyCachePlanCandidate
  checks: FactoryHermesBuildDependencyCachePlanningCheck[]
  blockers: FactoryHermesBuildDependencyCachePlanningBlocker[]
  warnings: FactoryHermesBuildDependencyCachePlanningWarning[]
  status: FactoryHermesBuildDependencyCachePlanningStatus
  decision: FactoryHermesBuildDependencyCachePlanningDecision
  canProceedToBuildDependencyCacheApproval: boolean
  canCacheBuildDependenciesNow: false
  canEnableNetworkNow: false
  canRetryMaterializationNow: false
  canExecuteHermes: false
  canRunHermesScripts: false
  canUseNetwork: false
  canUseCredentials: false
  canCallModels: false
  canMutateProjectFiles: false
  canDeploy: false
  recommendedNextStep: string
}

export interface FactoryHermesBuildDependencyCachePlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesBuildDependencyCachePlanningSummary {
  planningId: string
  missingBuildDependency: string
  selectedMethodCandidate?: string
  status: FactoryHermesBuildDependencyCachePlanningStatus
  decision: FactoryHermesBuildDependencyCachePlanningDecision
  canProceedToBuildDependencyCacheApproval: boolean
  canCacheBuildDependenciesNow: false
  canEnableNetworkNow: false
  canRetryMaterializationNow: false
  nextStep: string
}
