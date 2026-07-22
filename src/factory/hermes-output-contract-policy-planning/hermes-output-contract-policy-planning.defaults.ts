import type { FactoryHermesOutputContractPolicyPlanningKind, FactoryHermesOutputContractPolicyPlanningPolicy, FactoryHermesOutputContractPolicyPlanningVersion } from './hermes-output-contract-policy-planning.types.ts'

export const FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_KIND: FactoryHermesOutputContractPolicyPlanningKind = 'factory-hermes-output-contract-policy-planning'
export const FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_VERSION: FactoryHermesOutputContractPolicyPlanningVersion = '1.0'
export const FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Result Ingestion Contract Planning Gate v1; do not execute Hermes or use output as findings.'

export const DEFAULT_FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_POLICY: FactoryHermesOutputContractPolicyPlanningPolicy = {
  requireToolsetsPolicyPlanning: true, requireNetworkPolicyPlanning: true, requireOutputSourceInspection: true, requireOutputSurfaceCandidates: true, requireNoFindingsNow: true, requireStdoutCaptureRules: true, requireStderrCaptureRules: true, requireUsageFilePolicy: true, requireSanitizationPolicy: true, requireSizeLimits: true, requireNoRawOutputAsFindings: true, requireNoHelpOutputAsFindings: true, requireNoLogsAsFindings: true, requireResultIngestionContractNext: true, forbidOutputUseAsFindingsInThisGate: true, forbidPromptExecutionInThisGate: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidNetworkInThisGate: true, forbidModelCallsInThisGate: true, forbidCredentialUseInThisGate: true, forbidToolsetEnablementInThisGate: true, forbidDeployInThisGate: true,
}

export const OUTPUT_CONTRACT_NOT_AUTHORIZED_ACTIONS = ['use_output_as_findings_now', 'promote_stdout_to_findings_now', 'treat_logs_as_findings_now', 'treat_usage_file_as_findings_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'mutate_project_files_now', 'deploy_now']

export const OUTPUT_CONTRACT_REQUIRED_NEXT_POLICIES = ['Result Ingestion Contract', 'Timeout / Kill Switch Policy', 'Filesystem Mutation Policy', 'Research Execution Boundary Policy']
