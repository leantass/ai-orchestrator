import type { FactoryHermesBuildDependencyCacheApprovalKind, FactoryHermesBuildDependencyCacheApprovalPolicy, FactoryHermesBuildDependencyCacheApprovalVersion } from './hermes-build-dependency-cache-approval.types.ts'

export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_KIND: FactoryHermesBuildDependencyCacheApprovalKind = 'factory-hermes-build-dependency-cache-approval'
export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_VERSION: FactoryHermesBuildDependencyCacheApprovalVersion = '1.0'
export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_NEXT_STEP = 'Proceed to Factory Hermes Build Dependency Cache Runtime Adapter v1; do not cache dependencies, enable network, execute uv, retry materialization, or execute Hermes in this gate.'
export const FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_NOT_AUTHORIZED_ACTIONS = ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_uv_pip_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'execute_hermes_now', 'retry_materialization_now', 'retry_adapter_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now']

export const DEFAULT_FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_POLICY: FactoryHermesBuildDependencyCacheApprovalPolicy = {
  requirePlanningResult: true,
  requirePlanCandidateCreated: true,
  requireSelectedMethodCachePrefetch: true,
  requireMissingBuildDependency: true,
  requireHumanApprovalRef: true,
  requireNetworkRiskAcceptanceNotes: true,
  requireHashCapture: true,
  requirePackageNameVersionRecord: true,
  requireDownloadUrlRecord: true,
  requireNoCredentials: true,
  requireUvVerified: true,
  requireRuntimeAdapterNext: true,
  allowNetworkOnlyInFutureCacheRuntime: true,
  forbidCachingInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidUvExecutionInThisGate: true,
  forbidPipExecutionInThisGate: true,
  forbidPythonExecutionInThisGate: true,
  forbidSetupPyExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
}
