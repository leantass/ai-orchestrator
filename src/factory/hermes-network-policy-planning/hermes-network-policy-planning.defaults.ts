import type { FactoryHermesNetworkPolicyPlanningKind, FactoryHermesNetworkPolicyPlanningPolicy, FactoryHermesNetworkPolicyPlanningVersion } from './hermes-network-policy-planning.types.ts'

export const FACTORY_HERMES_NETWORK_POLICY_PLANNING_KIND: FactoryHermesNetworkPolicyPlanningKind = 'factory-hermes-network-policy-planning'
export const FACTORY_HERMES_NETWORK_POLICY_PLANNING_VERSION: FactoryHermesNetworkPolicyPlanningVersion = '1.0'
export const FACTORY_HERMES_NETWORK_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Toolsets Policy Planning Gate v1; do not use network, resolve hosts, test endpoints, call models or execute Hermes.'

export const DEFAULT_FACTORY_HERMES_NETWORK_POLICY_PLANNING_POLICY: FactoryHermesNetworkPolicyPlanningPolicy = {
  requireCredentialsPolicyPlanning: true,
  requireModelProviderPolicyPlanning: true,
  requireNetworkSourceInspection: true,
  requireNetworkSurfaceCandidates: true,
  requireNoNetworkNow: true,
  requireAllowedHostsNowEmpty: true,
  requireFutureHostApproval: true,
  requireNoWildcardHosts: true,
  requireNoArbitraryInternet: true,
  requireNoProviderDefaultNetwork: true,
  requireNoToolsetNetworkUntilToolsetsPolicy: true,
  requireNetworkKillSwitchPolicy: true,
  requireToolsetsPolicyNext: true,
  forbidNetworkUseInThisGate: true,
  forbidDnsResolutionInThisGate: true,
  forbidEndpointTestingInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidCredentialUseInThisGate: true,
  forbidPromptExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidResearchExecutionInThisGate: true,
  forbidUsingFindingsInThisGate: true,
  forbidDeployInThisGate: true,
}

export const NETWORK_NOT_AUTHORIZED_ACTIONS = [
  'use_network_now',
  'resolve_dns_now',
  'test_endpoint_now',
  'call_models_now',
  'access_credentials_now',
  'read_env_secrets_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'run_research_now',
  'execute_hermes_now',
  'enable_toolsets_now',
  'enable_web_tools_now',
  'enable_browser_tools_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'mutate_project_files_now',
  'deploy_now',
]

export const NETWORK_REQUIRED_NEXT_POLICIES = [
  'Toolsets Policy',
  'Output Contract Policy',
  'Result Ingestion Contract',
  'Timeout / Kill Switch Policy',
  'Filesystem Mutation Policy',
  'Research Execution Boundary Policy',
]
