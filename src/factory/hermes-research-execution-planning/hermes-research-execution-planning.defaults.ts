import type { FactoryHermesResearchExecutionPlanningKind, FactoryHermesResearchExecutionPlanningPolicy, FactoryHermesResearchExecutionPlanningVersion } from './hermes-research-execution-planning.types.ts'

export const FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_KIND: FactoryHermesResearchExecutionPlanningKind = 'factory-hermes-research-execution-planning'
export const FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_VERSION: FactoryHermesResearchExecutionPlanningVersion = '1.0'
export const FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_NEXT_STEP = 'Manual command review is required before Factory Hermes Research Execution Approval Gate v1; do not execute Hermes or pass a prompt.'
export const FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_RESULT_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-execution-planning-result.json'
export const FACTORY_HERMES_RESEARCH_JEFE_REVIEW_V2_RESULT_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-jefe-review-v2-result.json'
export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_RETRY_RESULT_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-result.json'

export const DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_POLICY: FactoryHermesResearchExecutionPlanningPolicy = {
  requireJefeReviewV2Approved: true,
  requireHelpProbeSucceeded: true,
  requireNoCurrentExecution: true,
  requireNoNetwork: true,
  requireNoCredentials: true,
  requireNoModelCalls: true,
  requireManualReviewWhenPromptOrModelIsImplied: true,
  forbidHermesExecutionInThisGate: true,
  forbidPromptPassingInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidUvInThisGate: true,
  forbidPipInThisGate: true,
  forbidPythonInThisGate: true,
  forbidSetupPyInThisGate: true,
}

export const FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_NOT_AUTHORIZED_ACTIONS = [
  'run_research_now',
  'execute_hermes_now',
  'execute_entrypoint_now',
  'pass_prompt_now',
  'use_network_now',
  'access_credentials_now',
  'call_models_now',
  'use_findings_now',
  'treat_help_as_research_result',
  'execute_uv_now',
  'execute_uv_sync',
  'execute_uv_run',
  'execute_uv_pip',
  'execute_pip',
  'execute_python_direct',
  'execute_setup_py',
  'mutate_project_files_now',
  'deploy_now',
  'create_research_execution_runtime_now',
]
