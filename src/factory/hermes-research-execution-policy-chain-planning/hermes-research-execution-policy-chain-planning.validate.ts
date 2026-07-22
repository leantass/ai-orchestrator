import { FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_VERSION, NOT_AUTHORIZED_ACTIONS } from './hermes-research-execution-policy-chain-planning.defaults.ts'
import type { FactoryHermesResearchExecutionPolicyChainPlanningInput, FactoryHermesResearchExecutionPolicyChainPlanningResult, FactoryHermesResearchExecutionPolicyChainPlanningValidationResult } from './hermes-research-execution-policy-chain-planning.types.ts'

const REQUIRED_POLICIES = [
  'Prompt Policy',
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

const REQUIRED_GATES = [
  'Factory Hermes Prompt Policy Planning Gate v1',
  'Factory Hermes Model Provider Policy Planning Gate v1',
  'Factory Hermes Credentials Policy Planning Gate v1',
  'Factory Hermes Network Policy Planning Gate v1',
  'Factory Hermes Toolsets Policy Planning Gate v1',
  'Factory Hermes Output Contract Planning Gate v1',
  'Factory Hermes Research Execution Boundary Planning Gate v1',
  'Factory Hermes Research Execution Approval Gate v1',
  'Factory Hermes Research Execution Runtime Adapter Gate v1',
  'Factory Hermes Research Execution Result Ingestion Gate v1',
  'Factory Hermes Research Execution JEFE Review Gate v1',
]

function hasSecretText(value: unknown): boolean {
  return /(?:api[_-]?key|secret|password|bearer\s+[a-z0-9._-]+)/iu.test(JSON.stringify(value ?? ''))
}

export function validateFactoryHermesResearchExecutionPolicyChainPlanningInput(input: FactoryHermesResearchExecutionPolicyChainPlanningInput): FactoryHermesResearchExecutionPolicyChainPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.deepSourceReview) errors.push('deepSourceReview is required.')
  if (!input?.researchExecutionPlanningResult) errors.push('researchExecutionPlanningResult is required.')
  if (hasSecretText(input.planningNotes)) errors.push('planningNotes appears to contain secrets.')
  if (hasSecretText(input.commandShapeReview)) warnings.push('commandShapeReview contains credential-like text; summaries must stay sanitized.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchExecutionPolicyChainPlanningResult(result: FactoryHermesResearchExecutionPolicyChainPlanningResult): FactoryHermesResearchExecutionPolicyChainPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const policies = result.requiredPolicies?.map((p) => p.policyName) || []
  const gates = result.proposedGateSequence?.map((g) => g.gateName) || []
  if (result.planningKind !== FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_RESEARCH_EXECUTION_POLICY_CHAIN_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status === 'policy_chain_plan_created' && result.decision !== 'hermes_research_execution_policy_chain_plan_created') errors.push('approved status requires policy-chain decision.')
  if (result.status === 'policy_chain_plan_created' && !result.researchExecutionPolicyChainPlanningReceipt) errors.push('receipt is required when plan is created.')
  if (result.status === 'policy_chain_plan_created' && !result.hermesResearchExecutionPolicyChainPlan) errors.push('chain plan is required when plan is created.')
  for (const policy of REQUIRED_POLICIES) if (!policies.includes(policy)) errors.push(`required policy missing: ${policy}`)
  for (const gate of REQUIRED_GATES) if (!gates.includes(gate)) errors.push(`required gate missing: ${gate}`)
  for (const action of ['run_research_now', 'execute_oneshot_now', 'pass_prompt_now', 'use_network_now', 'access_credentials_now', 'call_models_now']) {
    if (!result.researchExecutionPolicyChainPlanningReceipt?.notAuthorizedActions.includes(action)) errors.push(`notAuthorizedActions missing: ${action}`)
  }
  for (const action of NOT_AUTHORIZED_ACTIONS) {
    if (!result.researchExecutionPolicyChainPlanningReceipt?.notAuthorizedActions.includes(action)) warnings.push(`standard not authorized action missing: ${action}`)
  }
  if (result.canProceedToPromptPolicyPlanning !== true) errors.push('canProceedToPromptPolicyPlanning must be true.')
  if (result.canProceedToResearchExecutionApproval !== false) errors.push('canProceedToResearchExecutionApproval must be false.')
  if (result.canRunResearchNow !== false) errors.push('canRunResearchNow must be false.')
  if (result.canExecuteHermesNow !== false) errors.push('canExecuteHermesNow must be false.')
  if (result.canPassPromptNow !== false) errors.push('canPassPromptNow must be false.')
  if (result.canUseNetworkNow !== false) errors.push('canUseNetworkNow must be false.')
  if (result.canUseCredentialsNow !== false) errors.push('canUseCredentialsNow must be false.')
  if (result.canCallModelsNow !== false) errors.push('canCallModelsNow must be false.')
  if (result.canUseFindings !== false) errors.push('canUseFindings must be false.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
