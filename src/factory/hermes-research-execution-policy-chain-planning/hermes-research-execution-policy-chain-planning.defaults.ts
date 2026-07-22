import type { FactoryHermesResearchExecutionPolicyChainPlanningKind, FactoryHermesResearchExecutionPolicyChainPlanningPolicy } from './hermes-research-execution-policy-chain-planning.types.ts'

export const FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_KIND: FactoryHermesResearchExecutionPolicyChainPlanningKind = 'factory-hermes-research-execution-policy-chain-planning'
export const FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_VERSION = '1.0' as const
export const FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_NEXT_STEP = 'Proceed to Factory Hermes Prompt Policy Planning Gate v1; do not execute Hermes, pass prompts, use network, credentials or models.'
export const DEEP_SOURCE_REVIEW_REF = '.codex-temp/hermes-research-execution-deep-source-review-v1/deep-source-review.json'
export const RESEARCH_EXECUTION_PLANNING_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-execution-planning-result.json'

export const DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_POLICY: FactoryHermesResearchExecutionPolicyChainPlanningPolicy = {
  requireManualReviewPlanningInput: true,
  requireDeepSourceKeepBlockedRecommendation: true,
  requireOneshotRequiresPolicyChain: true,
  forbidResearchExecutionInThisGate: true,
  forbidHermesExecutionInThisGate: true,
  forbidPromptPassingInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
}

export const NOT_AUTHORIZED_ACTIONS = [
  'run_research_now',
  'execute_hermes_now',
  'execute_entrypoint_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'use_network_now',
  'access_credentials_now',
  'call_models_now',
  'enable_toolsets_now',
  'treat_help_as_research_result',
  'use_help_output_as_findings',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'mutate_project_files_now',
  'deploy_now',
]
