import { FACTORY_HERMES_PROMPT_POLICY_PLANNING_KIND, FACTORY_HERMES_PROMPT_POLICY_PLANNING_VERSION, PROMPT_POLICY_NOT_AUTHORIZED_ACTIONS } from './hermes-prompt-policy-planning.defaults.ts'
import type { FactoryHermesPromptPolicyPlanningInput, FactoryHermesPromptPolicyPlanningResult, FactoryHermesPromptPolicyPlanningValidationResult } from './hermes-prompt-policy-planning.types.ts'

function hasSecretText(value: unknown): boolean {
  return /(?:api[_-]?key|token|secret|password|bearer\s+[a-z0-9._-]+)/iu.test(JSON.stringify(value ?? ''))
}

export function validateFactoryHermesPromptPolicyPlanningInput(input: FactoryHermesPromptPolicyPlanningInput): FactoryHermesPromptPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.policyChainPlanningResult) errors.push('policyChainPlanningResult is required.')
  if (hasSecretText(input.planningNotes)) errors.push('planningNotes appears to contain secrets.')
  if (hasSecretText(input.commandShapeReview)) warnings.push('commandShapeReview contains credential-like text; summaries must stay sanitized.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesPromptPolicyPlanningResult(result: FactoryHermesPromptPolicyPlanningResult): FactoryHermesPromptPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const plan = result.hermesPromptPolicyPlanCandidate
  if (result.planningKind !== FACTORY_HERMES_PROMPT_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_PROMPT_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'prompt_policy_plan_created') errors.push('status must be prompt_policy_plan_created.')
  if (result.decision !== 'hermes_prompt_policy_plan_created') errors.push('decision must be hermes_prompt_policy_plan_created.')
  if (!result.promptPolicyPlanningReceipt) errors.push('receipt is required.')
  if (!plan) errors.push('plan candidate is required.')
  if (plan?.promptCandidate.candidateOnly !== true) errors.push('promptCandidate must be candidateOnly.')
  if (plan?.promptCandidate.notApprovedForExecutionYet !== true) errors.push('promptCandidate must be notApprovedForExecutionYet.')
  if (!plan?.promptCandidate.maxChars) errors.push('prompt maxChars is required.')
  if (!plan?.promptCandidate.sha256) errors.push('prompt sha256 is required.')
  if (!plan?.promptRules.allowlist?.length) errors.push('prompt allowlist is required.')
  if (!plan?.promptRules.blocklist?.length) errors.push('prompt blocklist is required.')
  if (!plan?.promptRules.injectionDefense?.length) errors.push('prompt injection defense is required.')
  if (result.canProceedToModelProviderPolicyPlanning !== true) errors.push('canProceedToModelProviderPolicyPlanning must be true.')
  if (result.canProceedToResearchExecutionApproval !== false) errors.push('canProceedToResearchExecutionApproval must be false.')
  if (result.canRunResearchNow !== false) errors.push('canRunResearchNow must be false.')
  if (result.canExecuteHermesNow !== false) errors.push('canExecuteHermesNow must be false.')
  if (result.canPassPromptNow !== false) errors.push('canPassPromptNow must be false.')
  if (result.canUseNetworkNow !== false) errors.push('canUseNetworkNow must be false.')
  if (result.canUseCredentialsNow !== false) errors.push('canUseCredentialsNow must be false.')
  if (result.canCallModelsNow !== false) errors.push('canCallModelsNow must be false.')
  if (result.canUseFindings !== false) errors.push('canUseFindings must be false.')
  for (const action of ['pass_prompt_now', 'execute_oneshot_now', 'run_research_now', 'call_models_now']) {
    if (!result.promptPolicyPlanningReceipt?.notAuthorizedActions.includes(action)) errors.push(`notAuthorizedActions missing: ${action}`)
  }
  for (const action of PROMPT_POLICY_NOT_AUTHORIZED_ACTIONS) {
    if (!result.promptPolicyPlanningReceipt?.notAuthorizedActions.includes(action)) warnings.push(`standard not authorized action missing: ${action}`)
  }
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
