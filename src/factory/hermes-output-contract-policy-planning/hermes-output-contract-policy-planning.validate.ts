import { FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_KIND, FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_VERSION } from './hermes-output-contract-policy-planning.defaults.ts'
import type { FactoryHermesOutputContractPolicyPlanningInput, FactoryHermesOutputContractPolicyPlanningResult, FactoryHermesOutputContractPolicyPlanningValidationResult } from './hermes-output-contract-policy-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=])/iu

export function validateFactoryHermesOutputContractPolicyPlanningInput(input: FactoryHermesOutputContractPolicyPlanningInput): FactoryHermesOutputContractPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.toolsetsPolicyPlanningResult) errors.push('toolsetsPolicyPlanningResult is required.')
  if (!input?.networkPolicyPlanningResult) errors.push('networkPolicyPlanningResult is required.')
  if (!input?.outputSourceInspection) errors.push('outputSourceInspection is required.')
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes, outputSourceInspection: input?.outputSourceInspection }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesOutputContractPolicyPlanningResult(result: FactoryHermesOutputContractPolicyPlanningResult): FactoryHermesOutputContractPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_OUTPUT_CONTRACT_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'output_contract_policy_plan_created') errors.push('status must be output_contract_policy_plan_created.')
  if (result.decision !== 'hermes_output_contract_policy_plan_created') errors.push('decision must be hermes_output_contract_policy_plan_created.')
  const receipt = result.outputContractPolicyPlanningReceipt
  const plan = result.hermesOutputContractPolicyPlanCandidate
  if (!receipt) errors.push('outputContractPolicyPlanningReceipt is required.')
  if (!plan) errors.push('hermesOutputContractPolicyPlanCandidate is required.')
  const byId = new Map((plan?.outputSurfaceCandidates || []).map((c) => [c.surfaceId, c.status]))
  for (const id of ['stdout_final_response_plain_text', 'stderr_logs_or_errors', 'usage_file_json']) if (!byId.has(id)) errors.push(`surface ${id} missing.`)
  for (const [id, status] of [['raw_stdout_as_findings', 'forbidden'], ['help_output_as_findings', 'forbidden'], ['logs_as_findings', 'forbidden']] as const) if (byId.get(id) !== status) errors.push(`surface ${id} must be ${status}.`)
  if (plan) {
    if (plan.outputAllowedNow !== false) errors.push('outputAllowedNow must be false.')
    if (plan.findingsAllowedNow !== false) errors.push('findingsAllowedNow must be false.')
    if (plan.rawOutputPromotableNow !== false) errors.push('rawOutputPromotableNow must be false.')
    if (plan.stdoutPolicy.previewLimitBytes > 12000) errors.push('stdout preview limit too high.')
    if (plan.stderrPolicy.previewLimitBytes > 12000) errors.push('stderr preview limit too high.')
    if (plan.usageFilePolicy.metadataOnly !== true || plan.usageFilePolicy.usableAsFindings !== false) errors.push('usage file policy invalid.')
    if (plan.sanitizationPolicy.redactSecrets !== true || plan.resultPromotionPolicy.requiresResultIngestion !== true || plan.resultPromotionPolicy.requiresJefeReview !== true) errors.push('sanitization/promotion policy invalid.')
  }
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  if (result.canProceedToResultIngestionContractPlanning !== true) errors.push('canProceedToResultIngestionContractPlanning must be true.')
  for (const action of ['use_output_as_findings_now', 'promote_stdout_to_findings_now', 'treat_logs_as_findings_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
