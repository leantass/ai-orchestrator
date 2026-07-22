import { FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_KIND, FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_VERSION } from './hermes-model-provider-policy-planning.defaults.ts'
import type { FactoryHermesModelProviderPolicyPlanningInput, FactoryHermesModelProviderPolicyPlanningResult, FactoryHermesModelProviderPolicyPlanningValidationResult } from './hermes-model-provider-policy-planning.types.ts'

function hasSecretText(value: unknown): boolean {
  return /(?:sk-[a-z0-9]|api[_-]?key\s*[:=]\s*[^,\s"]+|token\s*[:=]\s*[^,\s"]+|password\s*[:=]\s*[^,\s"]+|bearer\s+[a-z0-9._-]+)/iu.test(JSON.stringify(value ?? ''))
}

export function validateFactoryHermesModelProviderPolicyPlanningInput(input: FactoryHermesModelProviderPolicyPlanningInput): FactoryHermesModelProviderPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.promptPolicyPlanningResult) errors.push('promptPolicyPlanningResult is required.')
  if (!input?.policyChainPlanningResult) errors.push('policyChainPlanningResult is required.')
  if (hasSecretText(input.planningNotes)) errors.push('planningNotes appears to contain secrets.')
  if (hasSecretText(input.providerSourceInspection)) errors.push('providerSourceInspection appears to contain secret values.')
  if (!input?.providerSourceInspection) warnings.push('providerSourceInspection missing; evaluator should block.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesModelProviderPolicyPlanningResult(result: FactoryHermesModelProviderPolicyPlanningResult): FactoryHermesModelProviderPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const plan = result.hermesModelProviderPolicyPlanCandidate
  if (result.planningKind !== FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_MODEL_PROVIDER_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'model_provider_policy_plan_created') errors.push('status must be model_provider_policy_plan_created.')
  if (result.decision !== 'hermes_model_provider_policy_plan_created') errors.push('decision must be hermes_model_provider_policy_plan_created.')
  if (!result.modelProviderPolicyPlanningReceipt) errors.push('receipt is required.')
  if (!plan) errors.push('plan candidate is required.')
  if (!result.providerCandidates?.length) errors.push('providerCandidates are required.')
  if (plan?.providerSelection.providerSelectionRequired !== true) errors.push('providerSelectionRequired must be true.')
  if (plan?.providerSelection.selectedProvider !== null) errors.push('selectedProvider must be null.')
  if (plan?.providerSelection.selectedModel !== null) errors.push('selectedModel must be null.')
  if (plan?.providerSelection.noImplicitProviderFromEnv !== true) errors.push('noImplicitProviderFromEnv must be true.')
  if (plan?.providerSelection.noImplicitModelFromEnv !== true) errors.push('noImplicitModelFromEnv must be true.')
  if (plan?.providerSelection.noDefaultFallbackProvider !== true) errors.push('noDefaultFallbackProvider must be true.')
  if (result.canProceedToCredentialsPolicyPlanning !== true) errors.push('canProceedToCredentialsPolicyPlanning must be true.')
  if (result.canProceedToResearchExecutionApproval !== false) errors.push('canProceedToResearchExecutionApproval must be false.')
  if (result.canRunResearchNow !== false) errors.push('canRunResearchNow must be false.')
  if (result.canExecuteHermesNow !== false) errors.push('canExecuteHermesNow must be false.')
  if (result.canPassPromptNow !== false) errors.push('canPassPromptNow must be false.')
  if (result.canUseNetworkNow !== false) errors.push('canUseNetworkNow must be false.')
  if (result.canUseCredentialsNow !== false) errors.push('canUseCredentialsNow must be false.')
  if (result.canCallModelsNow !== false) errors.push('canCallModelsNow must be false.')
  if (result.canUseFindings !== false) errors.push('canUseFindings must be false.')
  for (const action of ['call_models_now', 'select_provider_for_execution_now', 'access_credentials_now', 'read_env_secrets_now']) {
    if (!result.modelProviderPolicyPlanningReceipt?.notAuthorizedActions.includes(action)) errors.push(`notAuthorizedActions missing: ${action}`)
  }
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (hasSecretText(result)) warnings.push('result contains credential-like text; verify these are refs, not values.')
  return { ok: errors.length === 0, errors, warnings }
}
