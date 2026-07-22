import type { FactoryHermesFilesystemMutationPolicyPlanningKind, FactoryHermesFilesystemMutationPolicyPlanningPolicy, FactoryHermesFilesystemMutationPolicyPlanningVersion } from './hermes-filesystem-mutation-policy-planning.types.ts'

export const FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_KIND: FactoryHermesFilesystemMutationPolicyPlanningKind = 'factory-hermes-filesystem-mutation-policy-planning'
export const FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_VERSION: FactoryHermesFilesystemMutationPolicyPlanningVersion = '1.0'
export const FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Research Execution Boundary Planning Gate v1; do not configure runtime writes or mutate files.'

export const DEFAULT_FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_POLICY: FactoryHermesFilesystemMutationPolicyPlanningPolicy = {
  requireTimeoutKillSwitchPolicyPlanning: true, requireResultIngestionContractPlanning: true, requireFilesystemSurfaceCandidates: true, requireReadPathRules: true, requireWritePathRules: true, requireApprovedRunRootCandidate: true, requireCodexTempOnlyFutureWrites: true, requireNoProjectSourceWrites: true, requireNoPackageFileWrites: true, requireNoDotEnvReadWrite: true, requireNoPythonEnvMutation: true, requireNoSourceRootMutation: true, requirePathContainment: true, requireNoSymlinkTraversal: true, requireNoPathTraversal: true, requireArtifactHashing: true, requireFsMutationReporting: true, requireResearchExecutionBoundaryPlanningNext: true, forbidFilesystemMutationInThisGate: true, forbidRuntimeWriteConfigurationInThisGate: true, forbidExecutionInThisGate: true, forbidPromptExecutionInThisGate: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidNetworkInThisGate: true, forbidModelCallsInThisGate: true, forbidCredentialUseInThisGate: true, forbidToolsetEnablementInThisGate: true, forbidDeployInThisGate: true,
}

export const FILESYSTEM_MUTATION_NOT_AUTHORIZED_ACTIONS = ['mutate_filesystem_now', 'write_project_files_now', 'write_source_root_now', 'mutate_python_env_now', 'mutate_uv_cache_now', 'read_dotenv_now', 'write_dotenv_now', 'write_outside_codex_temp_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'deploy_now']

export const FILESYSTEM_MUTATION_REQUIRED_NEXT_POLICIES = ['Research Execution Boundary Policy']
