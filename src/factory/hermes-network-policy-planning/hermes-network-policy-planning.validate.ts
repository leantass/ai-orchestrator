import { FACTORY_HERMES_NETWORK_POLICY_PLANNING_KIND, FACTORY_HERMES_NETWORK_POLICY_PLANNING_VERSION, NETWORK_NOT_AUTHORIZED_ACTIONS } from './hermes-network-policy-planning.defaults.ts'
import type { FactoryHermesNetworkPolicyPlanningInput, FactoryHermesNetworkPolicyPlanningResult, FactoryHermesNetworkPolicyPlanningValidationResult } from './hermes-network-policy-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=])/iu

export function validateFactoryHermesNetworkPolicyPlanningInput(input: FactoryHermesNetworkPolicyPlanningInput): FactoryHermesNetworkPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.credentialsPolicyPlanningResult) errors.push('credentialsPolicyPlanningResult is required.')
  if (!input?.modelProviderPolicyPlanningResult) errors.push('modelProviderPolicyPlanningResult is required.')
  if (!input?.networkSourceInspection) errors.push('networkSourceInspection is required.')
  const scan = JSON.stringify({ planningNotes: input?.planningNotes, networkSourceInspection: input?.networkSourceInspection })
  if (SECRETISH.test(scan)) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesNetworkPolicyPlanningResult(result: FactoryHermesNetworkPolicyPlanningResult): FactoryHermesNetworkPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_NETWORK_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_NETWORK_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'network_policy_plan_created') errors.push('status must be network_policy_plan_created.')
  if (result.decision !== 'hermes_network_policy_plan_created') errors.push('decision must be hermes_network_policy_plan_created.')
  const receipt = result.networkPolicyPlanningReceipt
  const plan = result.hermesNetworkPolicyPlanCandidate
  if (!receipt) errors.push('networkPolicyPlanningReceipt is required.')
  if (!plan) errors.push('hermesNetworkPolicyPlanCandidate is required.')
  if (plan) {
    if (plan.networkAllowedNow !== false) errors.push('networkAllowedNow must be false.')
    if (plan.allowedHostsNow.length !== 0) errors.push('allowedHostsNow must be empty.')
    if (plan.allowedSchemesNow.length !== 0) errors.push('allowedSchemesNow must be empty.')
    if (plan.wildcardHostsAllowed !== false) errors.push('wildcardHostsAllowed must be false.')
    if (plan.arbitraryInternetAllowed !== false) errors.push('arbitraryInternetAllowed must be false.')
    if (plan.futureHostSelectionRequired !== true) errors.push('futureHostSelectionRequired must be true.')
    if (plan.futureAllowedHostsRequireApproval !== true) errors.push('futureAllowedHostsRequireApproval must be true.')
    if (plan.providerNetworkCandidates.length < 3) errors.push('providerNetworkCandidates missing.')
    if (plan.networkSurfaceCandidates.length < 7) errors.push('networkSurfaceCandidates missing.')
    if (plan.toolsetsDependency.toolsetNetworkDisabledUntilToolsetsPolicy !== true) errors.push('toolsetNetworkDisabledUntilToolsetsPolicy must be true.')
    if (plan.killSwitchPolicy.networkKillSwitchRequired !== true) errors.push('networkKillSwitchRequired must be true.')
  }
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  if (result.canProceedToToolsetsPolicyPlanning !== true) errors.push('canProceedToToolsetsPolicyPlanning must be true.')
  for (const action of ['use_network_now', 'resolve_dns_now', 'test_endpoint_now', 'call_models_now', 'enable_web_tools_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  for (const action of NETWORK_NOT_AUTHORIZED_ACTIONS) if (!receipt?.notAuthorizedActions.includes(action)) warnings.push(`recommended notAuthorizedAction missing: ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
