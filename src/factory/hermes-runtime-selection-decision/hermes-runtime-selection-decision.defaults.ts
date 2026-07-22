import type { FactoryHermesRuntimeSelectionDecisionKind, FactoryHermesRuntimeSelectionDecisionPolicy, FactoryHermesRuntimeSelectionDecisionVersion } from './hermes-runtime-selection-decision.types.ts'

export const FACTORY_HERMES_RUNTIME_SELECTION_DECISION_KIND: FactoryHermesRuntimeSelectionDecisionKind = 'factory-hermes-runtime-selection-decision'
export const FACTORY_HERMES_RUNTIME_SELECTION_DECISION_VERSION: FactoryHermesRuntimeSelectionDecisionVersion = '1.0'
export const FACTORY_HERMES_RUNTIME_SELECTION_DECISION_NEXT_STEP = 'Proceed to Factory Hermes Research Execution Approval Retry Gate v1; execution remains blocked until retry approval.'
export const HERMES_RUNTIME_SELECTION_RUN_ROOT = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/'

export const DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_DECISION_POLICY: FactoryHermesRuntimeSelectionDecisionPolicy = {
  requireRuntimeSelectionPlanning: true, requirePlanningAllowsDecision: true, requireOpenAiProviderCandidate: true, requireOpenAiCredentialRefOnly: true, requireNoToolsetsTextOnly: true, requireRunRootUnderCodexTemp: true, forbidExecutionApprovalInThisGate: true, forbidRuntimeAdapterApprovalInThisGate: true, forbidPromptPassingInThisGate: true, forbidHermesExecutionInThisGate: true, forbidResearchExecutionInThisGate: true, forbidNetworkUseInThisGate: true, forbidDnsResolutionInThisGate: true, forbidEndpointTestsInThisGate: true, forbidCredentialValueReadInThisGate: true, forbidEnvSecretReadInThisGate: true, forbidModelCallsInThisGate: true, forbidToolsetEnablementInThisGate: true, forbidFilesystemMutationInThisGate: true, forbidRunRootCreationInThisGate: true, forbidFindingsUseInThisGate: true,
}

export const RUNTIME_SELECTION_DECISION_NOT_AUTHORIZED_ACTIONS = ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'ingest_real_output_now', 'promote_findings_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'deploy_now']
