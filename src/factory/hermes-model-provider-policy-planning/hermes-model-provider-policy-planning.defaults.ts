import type { FactoryHermesModelProviderPolicyPlanningKind, FactoryHermesModelProviderPolicyPlanningPolicy } from './hermes-model-provider-policy-planning.types.ts'

export const FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_KIND: FactoryHermesModelProviderPolicyPlanningKind = 'factory-hermes-model-provider-policy-planning'
export const FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_VERSION = '1.0' as const
export const FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Credentials Policy Planning Gate v1; do not select provider for execution, read env secrets, call models, use network or execute Hermes.'

export const DEFAULT_FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_POLICY: FactoryHermesModelProviderPolicyPlanningPolicy = {
  requirePromptPolicyPlanning: true,
  requirePolicyChainPlanning: true,
  requireProviderSourceInspection: true,
  requireProviderCandidates: true,
  requireExplicitProviderInFutureApproval: true,
  requireExplicitModelInFutureApproval: true,
  requireNoImplicitEnvProvider: true,
  requireNoImplicitEnvModel: true,
  requireNoDefaultFallbackProvider: true,
  requireNoWildcardProvider: true,
  requireNoWildcardModel: true,
  requireCredentialsPolicyNext: true,
  forbidProviderSelectionAsExecutionApproval: true,
  forbidModelCallsInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidPromptExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidResearchExecutionInThisGate: true,
  forbidUsingFindingsInThisGate: true,
  forbidDeployInThisGate: true,
}

export const MODEL_PROVIDER_NOT_AUTHORIZED_ACTIONS = [
  'call_models_now',
  'select_provider_for_execution_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'run_research_now',
  'execute_hermes_now',
  'use_network_now',
  'access_credentials_now',
  'read_env_secrets_now',
  'enable_toolsets_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'mutate_project_files_now',
  'deploy_now',
]

export const MODEL_PROVIDER_REQUIRED_NEXT_POLICIES = [
  'Credentials Policy',
  'Network Policy',
  'Toolsets Policy',
  'Output Contract Policy',
  'Result Ingestion Contract',
  'Timeout / Kill Switch Policy',
  'Filesystem Mutation Policy',
  'Research Execution Boundary Policy',
]
