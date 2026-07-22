import type { FactoryHermesPromptPolicyPlanningKind, FactoryHermesPromptPolicyPlanningPolicy } from './hermes-prompt-policy-planning.types.ts'

export const FACTORY_HERMES_PROMPT_POLICY_PLANNING_KIND: FactoryHermesPromptPolicyPlanningKind = 'factory-hermes-prompt-policy-planning'
export const FACTORY_HERMES_PROMPT_POLICY_PLANNING_VERSION = '1.0' as const
export const FACTORY_HERMES_PROMPT_POLICY_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Model Provider Policy Planning Gate v1; do not pass prompts, execute Hermes, use network, credentials or models.'
export const POLICY_CHAIN_PLANNING_RESULT_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-execution-policy-chain-planning-result.json'
export const PROMPT_POLICY_PLANNING_RESULT_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f/prompt-policy-planning-result.json'

export const DEFAULT_PROMPT_CANDIDATE_TEXT = 'Responde en una oración: esta es una prueba controlada de ejecución textual sin herramientas, sin red y sin datos externos.'
export const DEFAULT_PROMPT_CANDIDATE_SHA256 = '6589dc5d1211aaea2428a4e79c949ae96d6045a2e43c6c4a35e101492a6ce620'
export const DEFAULT_PROMPT_MAX_CHARS = 500
export const DEFAULT_PROMPT_MAX_LINES = 5

export const DEFAULT_FACTORY_HERMES_PROMPT_POLICY_PLANNING_POLICY: FactoryHermesPromptPolicyPlanningPolicy = {
  requirePolicyChainPlanning: true,
  requirePromptPolicyFirstInChain: true,
  requireHarmlessPromptCandidate: true,
  requirePromptCandidateOnly: true,
  requirePromptLengthLimit: true,
  requirePromptContentAllowlist: true,
  requirePromptContentBlocklist: true,
  requireNoSecrets: true,
  requireNoPersonalData: true,
  requireNoUrls: true,
  requireNoToolRequests: true,
  requireNoNetworkRequests: true,
  requireNoFilesystemRequests: true,
  requireNoCredentialRequests: true,
  requirePromptInjectionDefense: true,
  requireModelProviderPolicyNext: true,
  forbidPromptExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidResearchExecutionInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidUsingPromptAsFindings: true,
  forbidDeployInThisGate: true,
}

export const PROMPT_POLICY_NOT_AUTHORIZED_ACTIONS = [
  'pass_prompt_now',
  'execute_oneshot_now',
  'run_research_now',
  'execute_hermes_now',
  'use_network_now',
  'access_credentials_now',
  'call_models_now',
  'enable_toolsets_now',
  'treat_prompt_as_findings',
  'use_prompt_output_as_findings',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'mutate_project_files_now',
  'deploy_now',
]

export const PROMPT_REQUIRED_NEXT_POLICIES = [
  'Model Provider Policy',
  'Credentials Policy',
  'Network Policy',
  'Toolsets Policy',
  'Output Contract Policy',
  'Result Ingestion Contract',
  'Timeout / Kill Switch Policy',
  'Filesystem Mutation Policy',
  'Research Execution Boundary Policy',
]
