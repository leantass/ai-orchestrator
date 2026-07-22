import { FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_KIND, FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_VERSION } from './hermes-runtime-selection-planning.defaults.ts'
import type { FactoryHermesRuntimeSelectionPlanningInput, FactoryHermesRuntimeSelectionPlanningResult, FactoryHermesRuntimeSelectionPlanningValidationResult } from './hermes-runtime-selection-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|full stdout|full stderr|full source|process\.env)/iu

export function validateFactoryHermesRuntimeSelectionPlanningInput(input: FactoryHermesRuntimeSelectionPlanningInput): FactoryHermesRuntimeSelectionPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.researchExecutionApprovalResult) errors.push('researchExecutionApprovalResult is required.')
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesRuntimeSelectionPlanningResult(result: FactoryHermesRuntimeSelectionPlanningResult): FactoryHermesRuntimeSelectionPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'runtime_selection_plan_created') errors.push('status must be runtime_selection_plan_created.')
  if (result.decision !== 'hermes_runtime_selection_plan_created_manual_selection_required') errors.push('decision mismatch.')
  if (!result.runtimeSelectionPlanningReceipt) errors.push('runtimeSelectionPlanningReceipt required.')
  if (!result.hermesRuntimeSelectionPlanCandidate) errors.push('hermesRuntimeSelectionPlanCandidate required.')
  if (!result.leanRuntimeSelectionDecisionPack?.decisions.length) errors.push('leanRuntimeSelectionDecisionPack required.')
  for (const key of ['promptSelectionCandidates', 'providerSelectionCandidates', 'modelSelectionCandidates', 'credentialSelectionCandidates', 'networkHostSelectionCandidates', 'toolsetSelectionCandidates', 'runtimeRunRootSelectionCandidates'] as const) if (!result[key].length) errors.push(`${key} required.`)
  if (!result.finalApprovalSelectionCandidate) errors.push('finalApprovalSelectionCandidate required.')
  const plan = result.hermesRuntimeSelectionPlanCandidate
  if (plan) for (const [key, expected] of Object.entries({ allSelectionsResolvedNow: false, finalHumanDecisionRequired: true, executionApprovalRetryAllowedNow: false, runtimeAdapterAllowedNow: false, researchExecutionAllowedNow: false })) if ((plan as any)[key] !== expected) errors.push(`${key} must be ${expected}.`)
  if (!result.credentialSelectionCandidates.every((item) => item.valueRead === false && item.selectedNow === false)) errors.push('credential values must not be read or selected.')
  if (!result.runtimeRunRootSelectionCandidates.every((item) => item.runRootCreatedNow === false)) errors.push('run root must not be created now.')
  if (result.canProceedToRuntimeSelectionDecision !== true) errors.push('canProceedToRuntimeSelectionDecision must be true.')
  for (const key of ['canProceedToResearchExecutionApprovalRetry', 'canProceedToResearchRuntimeAdapter', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['select_final_runtime_values_now', 'approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'call_models_now', 'use_network_now', 'access_credentials_now']) if (!result.runtimeSelectionPlanningReceipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
