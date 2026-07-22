import type { FactoryHermesEntrypointMaterializationVerificationPolicy } from './hermes-entrypoint-materialization-verification.types.ts'

export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_KIND = 'factory-hermes-entrypoint-materialization-verification' as const
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_VERSION = '1.0' as const
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_NEXT_STEP = 'Proceed to Factory Hermes Research Runtime Adapter Retry Gate v1 under its future approval envelope.'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_NOT_AUTHORIZED_ACTIONS = ['execute_hermes_now', 'execute_entrypoint_now', 'retry_research_adapter_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now']
export const DEFAULT_FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_POLICY: FactoryHermesEntrypointMaterializationVerificationPolicy = {
  requireRuntimeRetrySuccess: true,
  requireExecutablePresent: true,
  requireExecutableContained: true,
  requireExecutableNonEmpty: true,
  requireExecutableSha256: true,
  requireNoHermesExecution: true,
  requireNoSelectedInterfaceExecution: true,
  requireNoResearchAdapterRetry: true,
  requireNoPipExecution: true,
  requireNoPythonDirectExecution: true,
  requireNoSetupPyDirectExecution: true,
  requireNoUvRun: true,
  requireNoUvPip: true,
  requireNoUvVenv: true,
  requireNoNetwork: true,
  requireNoCredentials: true,
  requireNoModelCalls: true,
  requireResearchAdapterRetryNext: true,
  allowKnownSourceMetadataWarnings: true,
  forbidDistBuildVenvSourceMutation: true,
  forbidKeySourceFileMutation: true,
  forbidExecutionInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidDeployInThisGate: true
}
