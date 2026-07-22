import { FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_VERSION } from './hermes-research-execution-approval.defaults.ts'
import type { FactoryHermesResearchExecutionApprovalInput, FactoryHermesResearchExecutionApprovalResult, FactoryHermesResearchExecutionApprovalValidationResult } from './hermes-research-execution-approval.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|full stdout|full stderr|full source|process\.env)/iu

export function validateFactoryHermesResearchExecutionApprovalInput(input: FactoryHermesResearchExecutionApprovalInput): FactoryHermesResearchExecutionApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt is required.')
  if (!input?.approvedBy) errors.push('approvedBy is required.')
  if (!input?.researchExecutionBoundaryPlanningResult) errors.push('researchExecutionBoundaryPlanningResult is required.')
  if (SECRETISH.test(JSON.stringify({ approvalNotes: input?.approvalNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchExecutionApprovalResult(result: FactoryHermesResearchExecutionApprovalResult): FactoryHermesResearchExecutionApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.approvalKind !== FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_KIND) errors.push('approvalKind mismatch.')
  if (result.approvalVersion !== FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_VERSION) errors.push('approvalVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'research_execution_approval_blocked') errors.push('status must be research_execution_approval_blocked.')
  if (result.decision !== 'hermes_research_execution_approval_blocked_missing_runtime_selections') errors.push('decision must be hermes_research_execution_approval_blocked_missing_runtime_selections.')
  if (result.approvalStatus !== 'not_approved') errors.push('approvalStatus must be not_approved.')
  if (!result.researchExecutionApprovalReceipt) errors.push('researchExecutionApprovalReceipt required.')
  if (!result.hermesResearchExecutionApprovalDecision) errors.push('hermesResearchExecutionApprovalDecision required.')
  if (!result.researchExecutionApprovalBlockerPlan) errors.push('researchExecutionApprovalBlockerPlan required.')
  const requirements = new Set(result.runtimeSelectionRequirements.map((item) => item.requirementId))
  for (const id of ['promptApproval', 'providerSelection', 'modelSelection', 'credentialSelection', 'networkHostApproval', 'toolsetSelectionApproval', 'runtimeRunRootApproval', 'finalExecutionApproval']) if (!requirements.has(id)) errors.push(`${id} requirement missing.`)
  for (const item of result.runtimeSelectionRequirements) {
    if (item.status !== 'required_not_satisfied') errors.push(`${item.requirementId} must be required_not_satisfied.`)
    if (item.blocksExecutionNow !== true) errors.push(`${item.requirementId} must block execution now.`)
  }
  const decision = result.hermesResearchExecutionApprovalDecision
  if (decision.boundaryValidated !== true) errors.push('boundaryValidated must be true.')
  if (decision.policiesConsolidated !== true) errors.push('policiesConsolidated must be true.')
  if (decision.executionApproved !== false) errors.push('executionApproved must be false.')
  if (decision.runtimeAdapterApproved !== false) errors.push('runtimeAdapterApproved must be false.')
  if (decision.runtimeSelectionPlanningApproved !== true) errors.push('runtimeSelectionPlanningApproved must be true.')
  if (result.canProceedToRuntimeSelectionPlanning !== true) errors.push('canProceedToRuntimeSelectionPlanning must be true.')
  for (const key of ['canProceedToResearchRuntimeAdapter', 'canProceedToResearchExecutionRuntime', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now']) if (!result.researchExecutionApprovalReceipt.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
