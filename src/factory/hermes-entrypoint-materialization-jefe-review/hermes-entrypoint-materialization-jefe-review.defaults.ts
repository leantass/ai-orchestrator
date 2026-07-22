import type { FactoryHermesEntrypointMaterializationJefeReviewKind, FactoryHermesEntrypointMaterializationJefeReviewPolicy, FactoryHermesEntrypointMaterializationJefeReviewVersion } from './hermes-entrypoint-materialization-jefe-review.types.ts'

export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_KIND: FactoryHermesEntrypointMaterializationJefeReviewKind = 'factory-hermes-entrypoint-materialization-jefe-review'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_VERSION: FactoryHermesEntrypointMaterializationJefeReviewVersion = '1.0'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NEXT_STEP = 'Proceed to Factory Hermes Build Dependency Cache Planning Gate v1; do not cache dependencies, enable network, retry materialization, or execute Hermes in this gate.'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NOT_AUTHORIZED_ACTIONS = ['cache_build_dependency_now', 'enable_network_now', 'retry_materialization_now', 'retry_research_adapter_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'execute_hermes_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now']

export const DEFAULT_FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_POLICY: FactoryHermesEntrypointMaterializationJefeReviewPolicy = {
  requireMaterializationIngestion: true,
  requireHumanApprovalRef: true,
  requireControlledBuildDependencyCacheMiss: true,
  requireNoRuntimeExecutionInThisGate: true,
  requireNoNetworkInThisGate: true,
  forbidCacheBuildDependencyNow: true,
  forbidNetworkEnableNow: true,
  forbidMaterializationRetryNow: true,
  forbidResearchAdapterRetryNow: true,
  forbidHermesExecutionInThisGate: true,
  forbidUvExecutionInThisGate: true,
  forbidPipExecutionInThisGate: true,
  forbidPythonExecutionInThisGate: true,
  forbidSetupPyExecutionInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidProjectMutationInThisGate: true,
  forbidDeployInThisGate: true,
}
