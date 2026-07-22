import { FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_KIND, FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_VERSION } from './hermes-timeout-kill-switch-policy-planning.defaults.ts'
import type { FactoryHermesTimeoutKillSwitchPolicyPlanningInput, FactoryHermesTimeoutKillSwitchPolicyPlanningResult, FactoryHermesTimeoutKillSwitchPolicyPlanningValidationResult } from './hermes-timeout-kill-switch-policy-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=])/iu

export function validateFactoryHermesTimeoutKillSwitchPolicyPlanningInput(input: FactoryHermesTimeoutKillSwitchPolicyPlanningInput): FactoryHermesTimeoutKillSwitchPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.resultIngestionContractPlanningResult) errors.push('resultIngestionContractPlanningResult is required.')
  if (!input?.outputContractPolicyPlanningResult) errors.push('outputContractPolicyPlanningResult is required.')
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result: FactoryHermesTimeoutKillSwitchPolicyPlanningResult): FactoryHermesTimeoutKillSwitchPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'timeout_kill_switch_policy_plan_created') errors.push('status must be timeout_kill_switch_policy_plan_created.')
  if (result.decision !== 'hermes_timeout_kill_switch_policy_plan_created') errors.push('decision must be hermes_timeout_kill_switch_policy_plan_created.')
  const receipt = result.timeoutKillSwitchPolicyPlanningReceipt
  const plan = result.hermesTimeoutKillSwitchPolicyPlanCandidate
  if (!receipt) errors.push('timeoutKillSwitchPolicyPlanningReceipt is required.')
  if (!plan) errors.push('hermesTimeoutKillSwitchPolicyPlanCandidate is required.')
  const timeout = new Map((plan?.timeoutPolicyRules || []).map((rule) => [rule.ruleId, rule]))
  const kill = new Map((plan?.killSwitchPolicyRules || []).map((rule) => [rule.ruleId, rule]))
  const processTimeout = timeout.get('process_timeout')
  if (!processTimeout || (processTimeout.commandTimeoutMsDefault || 0) > 120000 || (processTimeout.commandTimeoutMsMax || 0) > 300000) errors.push('process timeout limits invalid.')
  if (processTimeout?.noInfiniteTimeout !== true) errors.push('noInfiniteTimeout must be true.')
  if (processTimeout?.hardTimeoutRequired !== true) errors.push('hardTimeoutRequired must be true.')
  if (!timeout.has('shutdown_grace')) errors.push('shutdownGrace policy missing.')
  if (!timeout.has('output_limit')) errors.push('outputLimit policy missing.')
  for (const id of ['global_research_kill_switch', 'hermes_tool_kill_switch', 'provider_kill_switch', 'credentials_kill_switch', 'network_kill_switch', 'toolsets_kill_switch', 'emergency_stop']) if (kill.get(id)?.required !== true) errors.push(`${id} required true missing.`)
  if (!plan?.runtimeAbortReportingShape) errors.push('runtimeAbortReportingShape is required.')
  if (plan) {
    if (plan.autoRetryAllowed !== false) errors.push('autoRetryAllowed must be false.')
    if (plan.retryRequiresJefeReview !== true) errors.push('retryRequiresJefeReview must be true.')
    if (plan.timeoutAllowedNow !== false || plan.killSwitchMutationAllowedNow !== false || plan.researchExecutionAllowedNow !== false) errors.push('runtime capability flags must be false.')
  }
  if (result.canProceedToFilesystemMutationPolicyPlanning !== true) errors.push('canProceedToFilesystemMutationPolicyPlanning must be true.')
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['configure_runtime_timeout_now', 'mutate_kill_switch_now', 'disable_kill_switch_now', 'run_without_timeout_now', 'retry_research_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
