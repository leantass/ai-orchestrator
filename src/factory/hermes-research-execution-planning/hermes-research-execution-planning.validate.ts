import { FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_VERSION } from './hermes-research-execution-planning.defaults.ts'
import type { FactoryHermesResearchExecutionPlanningInput, FactoryHermesResearchExecutionPlanningResult, FactoryHermesResearchExecutionPlanningValidationResult } from './hermes-research-execution-planning.types.ts'

function hasSecret(value: unknown): boolean {
  return /api[_-]?key|secret|password|bearer|token|BEGIN [A-Z ]*PRIVATE KEY/iu.test(JSON.stringify(value || {}))
}

export function validateFactoryHermesResearchExecutionPlanningInput(input: FactoryHermesResearchExecutionPlanningInput): FactoryHermesResearchExecutionPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.plannedAt) errors.push('plannedAt is required')
  if (!input.plannedBy) errors.push('plannedBy is required')
  if (!input.researchJefeReviewV2Result) errors.push('researchJefeReviewV2Result is required')
  if (hasSecret(input)) errors.push('input appears to contain secrets')
  if (!input.helpProbeInspectionSummary) warnings.push('helpProbeInspectionSummary is recommended')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchExecutionPlanningResult(result: FactoryHermesResearchExecutionPlanningResult): FactoryHermesResearchExecutionPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_KIND) errors.push('planningKind mismatch')
  if (result.planningVersion !== FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_VERSION) errors.push('planningVersion mismatch')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent')
  if (!result.methodCandidates?.length) errors.push('methodCandidates are required')
  if (!result.researchExecutionPlanningReceipt) errors.push('researchExecutionPlanningReceipt is required')
  if (result.status === 'plan_candidate_created' && !result.hermesResearchExecutionPlanCandidate) errors.push('plan candidate is required when status is plan_candidate_created')
  if (result.status === 'manual_review_required' && result.canProceedToResearchExecutionApproval !== false) errors.push('manual review cannot proceed to approval')
  if (result.canRunResearchNow !== false) errors.push('canRunResearchNow must be false')
  if (result.canExecuteHermesNow !== false) errors.push('canExecuteHermesNow must be false')
  if (result.canPassPromptNow !== false) errors.push('canPassPromptNow must be false')
  if (result.canUseNetworkNow !== false) errors.push('canUseNetworkNow must be false')
  if (result.canUseCredentialsNow !== false) errors.push('canUseCredentialsNow must be false')
  if (result.canCallModelsNow !== false) errors.push('canCallModelsNow must be false')
  if (result.canUseFindings !== false) errors.push('canUseFindings must be false')
  if (!result.researchExecutionPlanningReceipt?.notAuthorizedActions.includes('execute_hermes_now')) errors.push('execute_hermes_now must be not authorized')
  if (!result.researchExecutionPlanningReceipt?.notAuthorizedActions.includes('pass_prompt_now')) errors.push('pass_prompt_now must be not authorized')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required')
  if (hasSecret(result)) errors.push('result appears to contain secrets')
  if (result.status === 'manual_review_required') warnings.push('manual command review is still required')
  return { ok: errors.length === 0, errors, warnings }
}
