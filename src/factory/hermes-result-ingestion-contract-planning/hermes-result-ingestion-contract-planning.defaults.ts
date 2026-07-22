import type { FactoryHermesResultIngestionContractPlanningKind, FactoryHermesResultIngestionContractPlanningPolicy, FactoryHermesResultIngestionContractPlanningVersion } from './hermes-result-ingestion-contract-planning.types.ts'

export const FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_KIND: FactoryHermesResultIngestionContractPlanningKind = 'factory-hermes-result-ingestion-contract-planning'
export const FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_VERSION: FactoryHermesResultIngestionContractPlanningVersion = '1.0'
export const FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Timeout Kill Switch Policy Planning Gate v1; do not ingest real output or promote findings.'

export const DEFAULT_FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_POLICY: FactoryHermesResultIngestionContractPlanningPolicy = {
  requireOutputContractPolicyPlanning: true, requireToolsetsPolicyPlanning: true, requireIngestionSurfaceRules: true, requireFindingCandidateRules: true, requireIngestionRecordShape: true, requireNoAutomaticFindings: true, requireJefeReviewForPromotion: true, requireSanitizationBeforeStorage: true, requireNoSecretsInRecords: true, requireFailureIngestionSupport: true, requireTimeoutKillSwitchPolicyNext: true, forbidIngestionExecutionInThisGate: true, forbidOutputUseAsFindingsInThisGate: true, forbidPromptExecutionInThisGate: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidNetworkInThisGate: true, forbidModelCallsInThisGate: true, forbidCredentialUseInThisGate: true, forbidToolsetEnablementInThisGate: true, forbidDeployInThisGate: true,
}

export const RESULT_INGESTION_NOT_AUTHORIZED_ACTIONS = ['ingest_real_output_now', 'use_output_as_findings_now', 'promote_findings_now', 'write_findings_to_memory_now', 'write_findings_to_brief_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'mutate_project_files_now', 'deploy_now']

export const RESULT_INGESTION_REQUIRED_NEXT_POLICIES = ['Timeout / Kill Switch Policy', 'Filesystem Mutation Policy', 'Research Execution Boundary Policy']
