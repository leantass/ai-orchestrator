import type { FactoryHermesFinalExecutionApprovalKind, FactoryHermesFinalExecutionApprovalPolicy, FactoryHermesFinalExecutionApprovalVersion } from './hermes-final-execution-approval.types.ts'

export const FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_KIND: FactoryHermesFinalExecutionApprovalKind = 'factory-hermes-final-execution-approval'
export const FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_VERSION: FactoryHermesFinalExecutionApprovalVersion = '1.0'
export const FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_NEXT_STEP = 'Proceed to Factory Hermes Research Runtime Adapter Approval Gate v1; runtime adapter and execution remain blocked.'
export const FINAL_EXECUTION_APPROVAL_NOT_AUTHORIZED_ACTIONS = ['approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'ingest_real_output_now', 'promote_findings_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'deploy_now']
export const FINAL_EXECUTION_APPROVAL_NO_EXECUTION_ACTIONS = ['execute_oneshot', 'run_research', 'execute_hermes', 'call_models', 'use_network', 'use_credentials', 'enable_toolsets', 'mutate_filesystem', 'pass_prompt']

export const DEFAULT_FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_POLICY: FactoryHermesFinalExecutionApprovalPolicy = {
  requireApprovalRetryBlockedByFinalApproval: true, requireRuntimeSelectionDecision: true, requireRuntimeSelectionsValidated: true, requireFinalApprovalExplicit: true, requireNextGateOnlyApproval: true, requireRuntimeAdapterApprovalNext: true, requireNoExecutionInThisGate: true, requireNoPromptPassingInThisGate: true, requireNoNetworkInThisGate: true, requireNoCredentialUseInThisGate: true, requireNoModelCallsInThisGate: true, requireNoToolsetEnablementInThisGate: true, requireNoFilesystemMutationInThisGate: true, forbidRuntimeAdapterApprovalInThisGate: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidUsingFindingsInThisGate: true, forbidDeployInThisGate: true,
}
