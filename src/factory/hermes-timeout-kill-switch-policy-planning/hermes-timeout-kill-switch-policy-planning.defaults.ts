import type { FactoryHermesTimeoutKillSwitchPolicyPlanningKind, FactoryHermesTimeoutKillSwitchPolicyPlanningPolicy, FactoryHermesTimeoutKillSwitchPolicyPlanningVersion } from './hermes-timeout-kill-switch-policy-planning.types.ts'

export const FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_KIND: FactoryHermesTimeoutKillSwitchPolicyPlanningKind = 'factory-hermes-timeout-kill-switch-policy-planning'
export const FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_VERSION: FactoryHermesTimeoutKillSwitchPolicyPlanningVersion = '1.0'
export const FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Filesystem Mutation Policy Planning Gate v1; do not configure runtime timeout or mutate kill switches.'

export const DEFAULT_FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_POLICY: FactoryHermesTimeoutKillSwitchPolicyPlanningPolicy = {
  requireResultIngestionContractPlanning: true, requireOutputContractPolicyPlanning: true, requireProcessTimeout: true, requireHardTimeout: true, requireNoInfiniteTimeout: true, requireShutdownGracePolicy: true, requireOutputLimitPolicy: true, requireGlobalResearchKillSwitch: true, requireHermesToolKillSwitch: true, requireProviderKillSwitch: true, requireCredentialsKillSwitch: true, requireNetworkKillSwitch: true, requireToolsetsKillSwitch: true, requireEmergencyStopPolicy: true, requireNoAutoRetry: true, requireRuntimeAbortReportingShape: true, requireFilesystemMutationPolicyNext: true, forbidTimeoutRuntimeConfigurationInThisGate: true, forbidKillSwitchMutationInThisGate: true, forbidExecutionInThisGate: true, forbidPromptExecutionInThisGate: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidNetworkInThisGate: true, forbidModelCallsInThisGate: true, forbidCredentialUseInThisGate: true, forbidToolsetEnablementInThisGate: true, forbidDeployInThisGate: true,
}

export const TIMEOUT_KILL_SWITCH_NOT_AUTHORIZED_ACTIONS = ['configure_runtime_timeout_now', 'mutate_kill_switch_now', 'disable_kill_switch_now', 'run_without_timeout_now', 'retry_research_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'mutate_project_files_now', 'deploy_now']

export const TIMEOUT_KILL_SWITCH_REQUIRED_NEXT_POLICIES = ['Filesystem Mutation Policy', 'Research Execution Boundary Policy']
