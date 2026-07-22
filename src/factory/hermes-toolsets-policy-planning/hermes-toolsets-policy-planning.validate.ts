import { FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_KIND, FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_VERSION, TOOLSETS_NOT_AUTHORIZED_ACTIONS } from './hermes-toolsets-policy-planning.defaults.ts'
import type { FactoryHermesToolsetsPolicyPlanningInput, FactoryHermesToolsetsPolicyPlanningResult, FactoryHermesToolsetsPolicyPlanningValidationResult } from './hermes-toolsets-policy-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=])/iu

export function validateFactoryHermesToolsetsPolicyPlanningInput(input: FactoryHermesToolsetsPolicyPlanningInput): FactoryHermesToolsetsPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.networkPolicyPlanningResult) errors.push('networkPolicyPlanningResult is required.')
  if (!input?.credentialsPolicyPlanningResult) errors.push('credentialsPolicyPlanningResult is required.')
  if (!input?.toolsetsSourceInspection) errors.push('toolsetsSourceInspection is required.')
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes, toolsetsSourceInspection: input?.toolsetsSourceInspection }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesToolsetsPolicyPlanningResult(result: FactoryHermesToolsetsPolicyPlanningResult): FactoryHermesToolsetsPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_TOOLSETS_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'toolsets_policy_plan_created') errors.push('status must be toolsets_policy_plan_created.')
  if (result.decision !== 'hermes_toolsets_policy_plan_created') errors.push('decision must be hermes_toolsets_policy_plan_created.')
  const receipt = result.toolsetsPolicyPlanningReceipt
  const plan = result.hermesToolsetsPolicyPlanCandidate
  if (!receipt) errors.push('toolsetsPolicyPlanningReceipt is required.')
  if (!plan) errors.push('hermesToolsetsPolicyPlanCandidate is required.')
  const byId = new Map((plan?.toolsetCandidates || []).map((c) => [c.toolsetId, c.status]))
  for (const [id, status] of [['no_toolsets_text_only', 'preferred_if_supported_by_cli'], ['default_cli_toolsets', 'forbidden_without_explicit_approval'], ['web_toolset', 'forbidden_until_network_and_toolsets_approval'], ['browser_toolset', 'forbidden_until_network_and_toolsets_approval'], ['terminal_toolset', 'forbidden'], ['mcp_toolset', 'forbidden_until_mcp_policy']] as const) if (byId.get(id) !== status) errors.push(`toolset candidate ${id} missing or invalid.`)
  if (plan) {
    if (plan.toolsetsAllowedNow !== false) errors.push('toolsetsAllowedNow must be false.')
    if (plan.toolsetsApprovedNow.length !== 0) errors.push('toolsetsApprovedNow must be empty.')
    if (plan.explicitToolsetsRequiredForFutureRuntime !== true) errors.push('explicitToolsetsRequiredForFutureRuntime must be true.')
    if (plan.hiddenDefaultToolsetsForbidden !== true) errors.push('hiddenDefaultToolsetsForbidden must be true.')
  }
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  if (result.canProceedToOutputContractPolicyPlanning !== true) errors.push('canProceedToOutputContractPolicyPlanning must be true.')
  for (const action of ['enable_toolsets_now', 'enable_web_tools_now', 'enable_browser_tools_now', 'enable_terminal_tools_now', 'enable_mcp_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  for (const action of TOOLSETS_NOT_AUTHORIZED_ACTIONS) if (!receipt?.notAuthorizedActions.includes(action)) warnings.push(`recommended notAuthorizedAction missing: ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
