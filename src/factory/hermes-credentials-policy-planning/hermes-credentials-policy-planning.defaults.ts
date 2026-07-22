import type { FactoryHermesCredentialsPolicyPlanningKind, FactoryHermesCredentialsPolicyPlanningPolicy } from './hermes-credentials-policy-planning.types.ts'

export const FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_KIND: FactoryHermesCredentialsPolicyPlanningKind = 'factory-hermes-credentials-policy-planning'
export const FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_VERSION = '1.0' as const
export const FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Network Policy Planning Gate v1; do not read or use credentials, read local secret files, call models, use network or execute Hermes.'

export const DEFAULT_FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_POLICY: FactoryHermesCredentialsPolicyPlanningPolicy = {
  requireModelProviderPolicyPlanning: true,
  requirePromptPolicyPlanning: true,
  requireCredentialSourceInspection: true,
  requireCredentialReferences: true,
  requireReferencedNotReadStatus: true,
  requireNoCredentialValues: true,
  requireNoEnvRead: true,
  requireNoDotEnvRead: true,
  requireExplicitFutureCredentialSelection: true,
  requireNoWildcardCredentials: true,
  requireNoCrossProviderFallback: true,
  requireMaskingPolicy: true,
  requireKillSwitchPolicy: true,
  requireNetworkPolicyNext: true,
  forbidCredentialUseInThisGate: true,
  forbidCredentialValueReadInThisGate: true,
  forbidEnvSecretReadInThisGate: true,
  forbidDotEnvReadInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidPromptExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidResearchExecutionInThisGate: true,
  forbidUsingFindingsInThisGate: true,
  forbidDeployInThisGate: true,
}

export const CREDENTIALS_NOT_AUTHORIZED_ACTIONS = [
  'use_credentials_now',
  'read_env_secrets_now',
  'read_dotenv_now',
  'validate_api_keys_now',
  'select_credential_for_execution_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'run_research_now',
  'execute_hermes_now',
  'use_network_now',
  'call_models_now',
  'enable_toolsets_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'mutate_project_files_now',
  'deploy_now',
]

export const CREDENTIAL_REQUIRED_NEXT_POLICIES = [
  'Network Policy',
  'Toolsets Policy',
  'Output Contract Policy',
  'Result Ingestion Contract',
  'Timeout / Kill Switch Policy',
  'Filesystem Mutation Policy',
  'Research Execution Boundary Policy',
]
