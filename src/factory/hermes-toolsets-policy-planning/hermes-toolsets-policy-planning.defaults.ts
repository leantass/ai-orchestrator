import type { FactoryHermesToolsetsPolicyPlanningKind, FactoryHermesToolsetsPolicyPlanningPolicy, FactoryHermesToolsetsPolicyPlanningVersion } from './hermes-toolsets-policy-planning.types.ts'

export const FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_KIND: FactoryHermesToolsetsPolicyPlanningKind = 'factory-hermes-toolsets-policy-planning'
export const FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_VERSION: FactoryHermesToolsetsPolicyPlanningVersion = '1.0'
export const FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Output Contract Policy Planning Gate v1; do not enable tools, use network, call models or execute Hermes.'

export const DEFAULT_FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_POLICY: FactoryHermesToolsetsPolicyPlanningPolicy = {
  requireNetworkPolicyPlanning: true,
  requireCredentialsPolicyPlanning: true,
  requireToolsetsSourceInspection: true,
  requireToolsetCandidates: true,
  requireNoToolsetsNow: true,
  requireNoHiddenDefaultToolsets: true,
  requireExplicitFutureToolsets: true,
  requireNoWebBrowserUntilNetworkApproval: true,
  requireNoTerminalToolset: true,
  requireNoMcpUntilMcpPolicy: true,
  requireNoFilesystemUntilFilesystemPolicy: true,
  requireOutputContractPolicyNext: true,
  forbidToolsetEnablementInThisGate: true,
  forbidWebToolsInThisGate: true,
  forbidBrowserToolsInThisGate: true,
  forbidTerminalToolsInThisGate: true,
  forbidMcpInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidCredentialUseInThisGate: true,
  forbidPromptExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidResearchExecutionInThisGate: true,
  forbidUsingFindingsInThisGate: true,
  forbidDeployInThisGate: true,
}

export const TOOLSETS_NOT_AUTHORIZED_ACTIONS = [
  'enable_toolsets_now',
  'enable_web_tools_now',
  'enable_browser_tools_now',
  'enable_terminal_tools_now',
  'enable_mcp_now',
  'use_network_now',
  'call_models_now',
  'access_credentials_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'run_research_now',
  'execute_hermes_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'mutate_project_files_now',
  'deploy_now',
]

export const TOOLSETS_REQUIRED_NEXT_POLICIES = [
  'Output Contract Policy',
  'Result Ingestion Contract',
  'Timeout / Kill Switch Policy',
  'Filesystem Mutation Policy',
  'Research Execution Boundary Policy',
]
