import type { FactoryHermesResearchRuntimeAdapterKind, FactoryHermesResearchRuntimeAdapterPolicy, FactoryHermesResearchRuntimeAdapterVersion } from './hermes-research-runtime-adapter.types.ts'

export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND: FactoryHermesResearchRuntimeAdapterKind = 'factory-hermes-research-runtime-adapter'
export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION: FactoryHermesResearchRuntimeAdapterVersion = '1.0'
export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_NEXT_STEP = 'Proceed to Factory Hermes Research Execution Approval Retry Gate v1; runtime execution remains blocked.'

export const ADAPTER_NOT_AUTHORIZED_ACTIONS = [
  'execute_research_runtime_adapter_now',
  'execute_wrapper_against_hermes_now',
  'create_temp_config_now',
  'modify_hermes_source_now',
  'execute_hermes_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'run_research_now',
  'call_models_now',
  'use_network_now',
  'access_credentials_now',
  'read_env_secrets_now',
  'enable_toolsets_now',
  'mutate_runtime_filesystem_now',
  'create_runtime_run_root_now',
  'ingest_real_output_now',
  'promote_findings_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'deploy_now',
]

export const ADAPTER_LIMITATIONS = [
  'no_real_hermes_execution_tested',
  'no_model_network_or_provider_tested',
  'config_schema_partially_unknown',
  'empty_toolsets_support_unknown',
  'hidden_defaults_may_still_exist_in_real_cli_runtime',
  'wrapper_verified_only_as_code_boundary',
  'adapter_prepared_only_as_non_executable_boundary',
  'adapter_execution_requires_future_approval',
  'research_execution_requires_future_final_approval',
  'credentials_network_prompt_model_all_blocked',
]

export const DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_POLICY: FactoryHermesResearchRuntimeAdapterPolicy = {
  requireApprovalRetryGranted: true,
  requireWrapperVerificationReview: true,
  requireRuntimeSelectionDecision: true,
  requireWrapperBoundary: true,
  requireNonExecutableCommandEnvelope: true,
  requireSafetyManifest: true,
  requireResearchExecutionApprovalRetryEnvelope: true,
  forbidRuntimeAdapterExecution: true,
  forbidResearchExecution: true,
  forbidHermesExecution: true,
  forbidPromptPassing: true,
  forbidModelCalls: true,
  forbidNetwork: true,
  forbidCredentials: true,
  forbidToolsets: true,
  forbidFindingsUse: true,
}
