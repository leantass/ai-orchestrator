import type { FactoryHermesBuildDependencyCachePlanningKind, FactoryHermesBuildDependencyCachePlanningPolicy, FactoryHermesBuildDependencyCachePlanningVersion } from './hermes-build-dependency-cache-planning.types.ts'

export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_KIND: FactoryHermesBuildDependencyCachePlanningKind = 'factory-hermes-build-dependency-cache-planning'
export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_VERSION: FactoryHermesBuildDependencyCachePlanningVersion = '1.0'
export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Build Dependency Cache Approval Gate v1; do not cache dependencies, enable network, execute uv, retry materialization, or execute Hermes in this gate.'
export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_NOT_AUTHORIZED_ACTIONS = ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_uv_pip_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'execute_hermes_now', 'retry_materialization_now', 'retry_adapter_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now']

export const DEFAULT_FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_POLICY: FactoryHermesBuildDependencyCachePlanningPolicy = {
  requireMaterializationJefeReviewApproved: true,
  requireMissingBuildDependency: true,
  requireBuildBackendRecorded: true,
  requireUvVerified: true,
  requireUvCacheRootUnderCodexTemp: true,
  requireSourceRootUnderCodexTemp: true,
  requirePythonEnvRootUnderCodexTemp: true,
  requireApprovalNext: true,
  forbidCachingInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidNetworkEnablementInThisGate: true,
  forbidUvExecutionInThisGate: true,
  forbidPipExecutionInThisGate: true,
  forbidPythonExecutionInThisGate: true,
  forbidSetupPyExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidHermesScriptsInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidProjectMutationInThisGate: true,
  forbidDeployInThisGate: true,
  requireCacheApprovalFuture: true,
  requireCacheRuntimeFuture: true,
  requireCacheVerificationFuture: true,
  requireMaterializationRetryFuture: true,
}
