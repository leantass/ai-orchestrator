export type FactoryHermesBuildDependencyCacheApprovalVersion = '1.0'
export type FactoryHermesBuildDependencyCacheApprovalKind = 'factory-hermes-build-dependency-cache-approval'
export type FactoryHermesBuildDependencyCacheApprovalStatus = 'approved_for_runtime_candidate' | 'blocked' | 'human_review_required'
export type FactoryHermesBuildDependencyCacheApprovalDecision = 'hermes_build_dependency_cache_approved_for_runtime_candidate' | 'blocked_missing_cache_plan' | 'blocked_cache_plan_not_candidate' | 'blocked_missing_package_identity' | 'blocked_missing_hash_policy' | 'blocked_missing_network_risk_acceptance' | 'blocked_unsafe_cache_method' | 'blocked_missing_human_approval' | 'request_cache_plan_repair_before_approval'

export interface FactoryHermesBuildDependencyCacheApprovalInput {
  approvedAt: string
  approvedBy: string
  humanApprovalRef?: string
  buildDependencyCachePlanningResult?: any
  networkRiskAcceptanceNotes?: string
  packageIndexPolicyNotes?: string
  hashVerificationPolicyNotes?: string
  policy?: Partial<FactoryHermesBuildDependencyCacheApprovalPolicy>
}

export interface FactoryHermesBuildDependencyCacheApprovalPolicy {
  requirePlanningResult: boolean
  requirePlanCandidateCreated: boolean
  requireSelectedMethodCachePrefetch: boolean
  requireMissingBuildDependency: boolean
  requireHumanApprovalRef: boolean
  requireNetworkRiskAcceptanceNotes: boolean
  requireHashCapture: boolean
  requirePackageNameVersionRecord: boolean
  requireDownloadUrlRecord: boolean
  requireNoCredentials: boolean
  requireUvVerified: boolean
  requireRuntimeAdapterNext: boolean
  allowNetworkOnlyInFutureCacheRuntime: boolean
  forbidCachingInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidUvExecutionInThisGate: boolean
  forbidPipExecutionInThisGate: boolean
  forbidPythonExecutionInThisGate: boolean
  forbidSetupPyExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
}

export interface FactoryHermesBuildDependencyCacheApprovalReceipt {
  receiptId: string
  approvalId: string
  toolId: 'hermes_agent'
  approvedBy: string
  approvedAt: string
  humanApprovalRef: string
  missingBuildDependency: string
  lockedPackageName: string
  lockedPackageVersion: string | null
  selectedMethodCandidate: string
  networkRiskAcceptanceNotes: string
  packageIndexPolicyNotes: string
  hashVerificationPolicyNotes: string
  decision: FactoryHermesBuildDependencyCacheApprovalDecision
  scope: 'hermes_build_dependency_cache_runtime_candidate_only'
  approvedNextGate: 'Factory Hermes Build Dependency Cache Runtime Adapter v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesBuildDependencyCacheRuntimeEnvelope {
  envelopeId: string
  approvalId: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: 'hermes'
  pythonEntrypoint: 'hermes_cli.main:main'
  missingBuildDependency: string
  lockedPackageName: 'setuptools'
  lockedPackageVersion: string | null
  versionConstraint: string
  buildBackend: 'setuptools.build_meta'
  setupPyPresent: boolean
  uvExecutableRef: string
  uvCacheRootRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  metadataRootRef: string
  tempEnvRootRef: string
  selectedMethodCandidate: 'uv_controlled_build_dependency_cache_prefetch'
  approvedRuntimeNetworkScope: 'cache_prefetch_only'
  networkAllowedNow: false
  futureRuntimeMayUseNetworkForCachePrefetch: true
  futureRuntimeNetworkMustBeDisabledAfterCache: true
  futureMaterializationRuntimeMustRemainOffline: true
  allowedFutureHostsCandidate: string[]
  approvedRuntimeCommandPolicy: Record<string, unknown>
  approvedEnvPolicy: Record<string, unknown>
  approvedWriteRoots: string[]
  forbiddenWriteRoots: string[]
  requiredMetadata: string[]
  cacheAllowedNow: false
  futureRuntimeMayCacheBuildDependencyUnderEnvelope: true
  materializationRetryAllowedNow: false
  hermesExecutionAllowedNow: false
  networkAllowedNowForThisGate: false
  credentialsAllowedNow: false
  modelCallsAllowedNow: false
  canProceedToBuildDependencyCacheRuntime: true
  recommendedNextStep: string
}

export interface FactoryHermesBuildDependencyCacheApprovalCheck { checkId: string; status: 'passed' | 'failed'; message: string }
export interface FactoryHermesBuildDependencyCacheApprovalBlocker { blockerId: string; message: string }
export interface FactoryHermesBuildDependencyCacheApprovalWarning { warningId: string; message: string }

export interface FactoryHermesBuildDependencyCacheApprovalResult {
  approvalId: string
  approvalKind: FactoryHermesBuildDependencyCacheApprovalKind
  approvalVersion: FactoryHermesBuildDependencyCacheApprovalVersion
  approvedAt: string
  approvedBy: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  pythonEntrypoint: string
  missingBuildDependency: string
  lockedPackageName: string
  lockedPackageVersion: string | null
  buildBackend: string
  setupPyPresent: boolean
  uvExecutableRef: string
  uvCacheRootRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  selectedMethodCandidate: string
  approvalReceipt?: FactoryHermesBuildDependencyCacheApprovalReceipt
  approvedBuildDependencyCacheRuntimeEnvelope?: FactoryHermesBuildDependencyCacheRuntimeEnvelope
  checks: FactoryHermesBuildDependencyCacheApprovalCheck[]
  blockers: FactoryHermesBuildDependencyCacheApprovalBlocker[]
  warnings: FactoryHermesBuildDependencyCacheApprovalWarning[]
  status: FactoryHermesBuildDependencyCacheApprovalStatus
  decision: FactoryHermesBuildDependencyCacheApprovalDecision
  canProceedToBuildDependencyCacheRuntime: boolean
  canCacheBuildDependenciesNow: false
  canEnableNetworkNow: false
  canRetryMaterializationNow: false
  canExecuteHermes: false
  canRunHermesScripts: false
  canUseNetworkNow: false
  canUseNetworkInFutureRuntime: boolean
  canUseCredentials: false
  canCallModels: false
  canMutateProjectFiles: false
  canDeploy: false
  recommendedNextStep: string
}

export interface FactoryHermesBuildDependencyCacheApprovalValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesBuildDependencyCacheApprovalSummary { approvalId: string; missingBuildDependency: string; lockedPackageVersion: string | null; selectedMethodCandidate: string; status: FactoryHermesBuildDependencyCacheApprovalStatus; decision: FactoryHermesBuildDependencyCacheApprovalDecision; canProceedToBuildDependencyCacheRuntime: boolean; canCacheBuildDependenciesNow: false; canUseNetworkNow: false; canUseNetworkInFutureRuntime: boolean; nextStep: string }
