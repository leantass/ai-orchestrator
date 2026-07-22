import { FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_KIND, FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_VERSION } from './hermes-credentials-policy-planning.defaults.ts'
import type { FactoryHermesCredentialsPolicyPlanningInput, FactoryHermesCredentialsPolicyPlanningResult, FactoryHermesCredentialsPolicyPlanningValidationResult } from './hermes-credentials-policy-planning.types.ts'

function hasSecretValue(value: unknown): boolean {
  return /(?:sk-[a-z0-9]|bearer\s+[a-z0-9._-]{12,}|api[_-]?key\s*[:=]\s*[a-z0-9._-]{12,}|password\s*[:=]\s*\S+)/iu.test(JSON.stringify(value ?? ''))
}

export function validateFactoryHermesCredentialsPolicyPlanningInput(input: FactoryHermesCredentialsPolicyPlanningInput): FactoryHermesCredentialsPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.modelProviderPolicyPlanningResult) errors.push('modelProviderPolicyPlanningResult is required.')
  if (!input?.credentialSourceInspection) errors.push('credentialSourceInspection is required.')
  if (hasSecretValue(input)) errors.push('input appears to contain secret values.')
  if (!input?.promptPolicyPlanningResult) warnings.push('promptPolicyPlanningResult missing; evaluator should block.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesCredentialsPolicyPlanningResult(result: FactoryHermesCredentialsPolicyPlanningResult): FactoryHermesCredentialsPolicyPlanningValidationResult {
  const errors: string[] = []
  const plan = result.hermesCredentialsPolicyPlanCandidate
  if (result.planningKind !== FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_CREDENTIALS_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'credentials_policy_plan_created') errors.push('status must be credentials_policy_plan_created.')
  if (result.decision !== 'hermes_credentials_policy_plan_created') errors.push('decision must be hermes_credentials_policy_plan_created.')
  if (!result.credentialsPolicyPlanningReceipt) errors.push('receipt is required.')
  if (!plan) errors.push('plan candidate is required.')
  if (!result.credentialReferences?.length) errors.push('credentialReferences are required.')
  for (const ref of result.credentialReferences || []) {
    if (ref.status !== 'referenced_not_read') errors.push(`${ref.refName} must be referenced_not_read.`)
    if (ref.valueKnown !== false) errors.push(`${ref.refName} valueKnown must be false.`)
    if (ref.valueRead !== false) errors.push(`${ref.refName} valueRead must be false.`)
    if (ref.approvedForUseNow !== false) errors.push(`${ref.refName} approvedForUseNow must be false.`)
  }
  if (plan?.credentialInjectionPlan.credentialValuesDefinedHere !== false) errors.push('credentialValuesDefinedHere must be false.')
  if (plan?.credentialInjectionPlan.credentialValuesReadHere !== false) errors.push('credentialValuesReadHere must be false.')
  if (plan?.credentialInjectionPlan.futureCredentialSourceRequiresApproval !== true) errors.push('futureCredentialSourceRequiresApproval must be true.')
  if (!plan?.maskingPolicy) errors.push('maskingPolicy is required.')
  if (!plan?.killSwitchPolicy) errors.push('killSwitchPolicy is required.')
  if (result.canProceedToNetworkPolicyPlanning !== true) errors.push('canProceedToNetworkPolicyPlanning must be true.')
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['use_credentials_now', 'read_env_secrets_now', 'read_dotenv_now', 'validate_api_keys_now', 'call_models_now']) if (!result.credentialsPolicyPlanningReceipt?.notAuthorizedActions.includes(action)) errors.push(`notAuthorizedActions missing: ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (hasSecretValue(result)) errors.push('result appears to contain secret values.')
  return { ok: errors.length === 0, errors, warnings: [] }
}
