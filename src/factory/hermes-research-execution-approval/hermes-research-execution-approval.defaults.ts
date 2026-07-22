import type { FactoryHermesResearchExecutionApprovalKind, FactoryHermesResearchExecutionApprovalPolicy, FactoryHermesResearchExecutionApprovalVersion } from './hermes-research-execution-approval.types.ts'

export const FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_KIND: FactoryHermesResearchExecutionApprovalKind = 'factory-hermes-research-execution-approval'
export const FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_VERSION: FactoryHermesResearchExecutionApprovalVersion = '1.0'
export const FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_NEXT_STEP = 'Proceed to Factory Hermes Runtime Selection Planning Gate v1; execution remains blocked.'

export const DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_POLICY: FactoryHermesResearchExecutionApprovalPolicy = {
  requireBoundaryPlanning: true, requireAllPoliciesConsolidated: true, requireApprovalGateCanEvaluate: true, requireNoMissingRuntimeSelectionsForExecutionApproval: true, requireHumanFinalApprovalForExecution: true, requireRuntimeSelectionPlanningBeforeRuntimeAdapter: true, requireNotApprovedWhenSelectionsMissing: true, requireNoExecutionInThisGate: true, requireNoPromptPassingInThisGate: true, requireNoNetworkInThisGate: true, requireNoCredentialsInThisGate: true, requireNoModelCallsInThisGate: true, requireNoToolsetEnablementInThisGate: true, requireNoFilesystemMutationInThisGate: true, forbidExecutionApprovalWithMissingSelections: true, forbidRuntimeAdapterApprovalInThisGateWhenBlocked: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidUsingFindingsInThisGate: true, forbidDeployInThisGate: true,
}

export const RESEARCH_EXECUTION_APPROVAL_NOT_AUTHORIZED_ACTIONS = ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'write_project_files_now', 'ingest_real_output_now', 'promote_findings_now', 'write_findings_to_memory_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'deploy_now']

export const NO_EXECUTION_AUTHORIZED_ACTIONS = ['execute_oneshot', 'run_research', 'execute_hermes', 'call_models', 'use_network', 'use_credentials', 'enable_toolsets', 'mutate_filesystem', 'use_findings']
