import { FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_VERSION } from './hermes-research-execution-boundary-planning.defaults.ts'
import type { FactoryHermesResearchExecutionBoundaryPlanningInput, FactoryHermesResearchExecutionBoundaryPlanningResult, FactoryHermesResearchExecutionBoundaryPlanningValidationResult } from './hermes-research-execution-boundary-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|full stdout|full stderr|full source)/iu

export function validateFactoryHermesResearchExecutionBoundaryPlanningInput(input: FactoryHermesResearchExecutionBoundaryPlanningInput): FactoryHermesResearchExecutionBoundaryPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  for (const key of ['policyChainPlanningResult', 'promptPolicyPlanningResult', 'modelProviderPolicyPlanningResult', 'credentialsPolicyPlanningResult', 'networkPolicyPlanningResult', 'toolsetsPolicyPlanningResult', 'outputContractPolicyPlanningResult', 'resultIngestionContractPlanningResult', 'timeoutKillSwitchPolicyPlanningResult', 'filesystemMutationPolicyPlanningResult'] as const) if (!input?.[key]) errors.push(`${key} is required.`)
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchExecutionBoundaryPlanningResult(result: FactoryHermesResearchExecutionBoundaryPlanningResult): FactoryHermesResearchExecutionBoundaryPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'research_execution_boundary_plan_created') errors.push('status must be research_execution_boundary_plan_created.')
  if (result.decision !== 'hermes_research_execution_boundary_plan_created') errors.push('decision must be hermes_research_execution_boundary_plan_created.')
  const receipt = result.researchExecutionBoundaryPlanningReceipt
  const plan = result.hermesResearchExecutionBoundaryPlanCandidate
  if (!receipt) errors.push('researchExecutionBoundaryPlanningReceipt is required.')
  if (!plan) errors.push('hermesResearchExecutionBoundaryPlanCandidate is required.')
  if (plan) {
    for (const [key, expected] of Object.entries({ allPoliciesConsolidated: true, approvalGateCanEvaluate: true, finalApprovalRequired: true, executionAllowedNow: false, researchExecutionAllowedNow: false })) if ((plan as any)[key] !== expected) errors.push(`${key} must be ${expected}.`)
  }
  if (result.boundaryCommandShape.shell !== false) errors.push('boundaryCommandShape.shell must be false.')
  if (result.boundaryCommandShape.oneShotOnly !== true) errors.push('boundaryCommandShape.oneShotOnly must be true.')
  if (result.boundaryCommandShape.interactiveModeAllowed !== false) errors.push('interactiveModeAllowed must be false.')
  if (result.boundaryEnvironmentShape.inheritParentEnv !== false) errors.push('inheritParentEnv must be false.')
  if (result.boundaryEnvironmentShape.dotEnvReadAllowed !== false) errors.push('dotEnvReadAllowed must be false.')
  if (result.boundaryFilesystemShape.futureWritesRestrictedToCodexTemp !== true) errors.push('futureWritesRestrictedToCodexTemp must be true.')
  if (result.boundaryNetworkShape.networkAllowedNow !== false) errors.push('networkAllowedNow must be false.')
  if (result.boundaryNetworkShape.allowedHostsNow.length !== 0) errors.push('allowedHostsNow must be empty.')
  if (result.boundaryCredentialsShape.credentialsAllowedNow !== false) errors.push('credentialsAllowedNow must be false.')
  if (result.boundaryToolsetsShape.toolsetsAllowedNow !== false) errors.push('toolsetsAllowedNow must be false.')
  if (result.boundaryOutputShape.outputUseAsFindingsNow !== false) errors.push('outputUseAsFindingsNow must be false.')
  if (result.boundaryIngestionShape.ingestionAllowedNow !== false) errors.push('ingestionAllowedNow must be false.')
  if (result.boundaryTimeoutShape.hardTimeoutRequired !== true) errors.push('hardTimeoutRequired must be true.')
  const missingIds = new Set(result.missingRuntimeSelections.map((item) => item.selectionId))
  for (const id of ['promptApprovalMissing', 'providerSelectionMissing', 'modelSelectionMissing', 'credentialSelectionMissing', 'networkHostApprovalMissing', 'toolsetSelectionApprovalMissing', 'runtimeRunRootApprovalMissing', 'finalExecutionApprovalMissing']) if (!missingIds.has(id)) errors.push(`${id} missing.`)
  for (const item of result.missingRuntimeSelections) if (item.blocksExecutionNow !== true) errors.push(`${item.selectionId} must block execution now.`)
  if (result.canProceedToResearchExecutionApproval !== true) errors.push('canProceedToResearchExecutionApproval must be true.')
  for (const key of ['canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['approve_execution_now', 'execute_oneshot_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
