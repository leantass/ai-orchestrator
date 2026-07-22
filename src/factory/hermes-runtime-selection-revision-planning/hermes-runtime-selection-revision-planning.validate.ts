import { FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_KIND, FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_VERSION, RUNTIME_SELECTION_REVISION_NOT_AUTHORIZED_ACTIONS } from './hermes-runtime-selection-revision-planning.defaults.ts'
import type { FactoryHermesRuntimeSelectionRevisionPlanningInput, FactoryHermesRuntimeSelectionRevisionPlanningResult, FactoryHermesRuntimeSelectionRevisionPlanningValidationResult } from './hermes-runtime-selection-revision-planning.types.ts'
const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|process\.env|\.env|full stdout|full stderr|full source)/iu
export function validateFactoryHermesRuntimeSelectionRevisionPlanningInput(input: FactoryHermesRuntimeSelectionRevisionPlanningInput): FactoryHermesRuntimeSelectionRevisionPlanningValidationResult { const errors: string[] = []; const warnings: string[] = []; if (!input?.plannedAt) errors.push('plannedAt is required.'); if (!input?.plannedBy) errors.push('plannedBy is required.'); if (!input?.toolsetDisableVerificationApprovalResult) errors.push('toolsetDisableVerificationApprovalResult is required.'); if (!input?.researchRuntimeAdapterApprovalResult) errors.push('researchRuntimeAdapterApprovalResult is required.'); if (!input?.runtimeSelectionDecisionResult) errors.push('runtimeSelectionDecisionResult is required.'); if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes }))) errors.push('input appears to contain secret-like values.'); return { ok: errors.length === 0, errors, warnings } }
export function validateFactoryHermesRuntimeSelectionRevisionPlanningResult(result: FactoryHermesRuntimeSelectionRevisionPlanningResult): FactoryHermesRuntimeSelectionRevisionPlanningValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.status !== 'runtime_selection_revision_plan_created') errors.push('status mismatch.')
  if (result.decision !== 'hermes_runtime_selection_revision_plan_created_toolset_mode_blocked') errors.push('decision mismatch.')
  if (result.revisionStatus !== 'manual_revision_required') errors.push('revisionStatus mismatch.')
  if (!result.blockedRuntimeSelectionSummary) errors.push('blockedRuntimeSelectionSummary required.')
  if (!result.revisionOptions?.length) errors.push('revisionOptions required.')
  if (!result.runtimeSelectionRevisionDecisionPack?.pendingDecisions?.length) errors.push('decision pack required.')
  if (result.recommendedRevisionPath?.pathId !== 'plan_wrapper_enforced_no_tool_mode') errors.push('recommended wrapper path required.')
  if (!result.hermesRuntimeSelectionRevisionPlanCandidate) errors.push('plan candidate required.')
  if (result.hermesRuntimeSelectionRevisionPlanCandidate?.currentRuntimeSelectionInvalidForAdapter !== true) errors.push('current runtime selection must be invalid for adapter.')
  if (result.hermesRuntimeSelectionRevisionPlanCandidate?.selectedToolsetModeInvalidForAdapter !== true) errors.push('selected toolset mode must be invalid.')
  if (result.hermesRuntimeSelectionRevisionPlanCandidate?.directHermesRuntimeAdapterBlocked !== true) errors.push('direct adapter must be blocked.')
  if (result.hermesRuntimeSelectionRevisionPlanCandidate?.wrapperPlanningRecommended !== true) errors.push('wrapper planning must be recommended.')
  if (result.canProceedToHermesWrapperNoToolModePlanning !== true) errors.push('must allow wrapper no-tool planning.')
  if (result.canProceedToRuntimeSelectionRevisionDecision !== true) errors.push('must allow revision decision.')
  for (const key of ['canProceedToResearchRuntimeAdapterApprovalRetry', 'canProceedToResearchRuntimeAdapter', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of RUNTIME_SELECTION_REVISION_NOT_AUTHORIZED_ACTIONS) if (!result.runtimeSelectionRevisionPlanningReceipt.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction: ${action}`)
  if (SECRETISH.test(JSON.stringify({ receipt: result.runtimeSelectionRevisionPlanningReceipt, summary: result.blockedRuntimeSelectionSummary }))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
