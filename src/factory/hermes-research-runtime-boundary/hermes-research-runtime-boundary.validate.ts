import { DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_BOUNDARY_POLICY, FACTORY_HERMES_RESEARCH_RUNTIME_BOUNDARY_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_BOUNDARY_VERSION } from './hermes-research-runtime-boundary.defaults.ts'
import type { FactoryHermesResearchRuntimeBoundaryInput, FactoryHermesResearchRuntimeBoundaryResult, FactoryHermesResearchRuntimeBoundaryValidationResult } from './hermes-research-runtime-boundary.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu
export function validateFactoryHermesResearchRuntimeBoundaryInput(input: FactoryHermesResearchRuntimeBoundaryInput): FactoryHermesResearchRuntimeBoundaryValidationResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_BOUNDARY_POLICY, ...(input.policy || {}) }
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.boundedAt) errors.push('boundedAt is required.')
  if (!input.boundedBy) errors.push('boundedBy is required.')
  if (!input.interfaceSelectionResult) errors.push('interfaceSelectionResult is required.')
  if (policy.requireHumanApprovalRef && !input.humanApprovalRef) errors.push('humanApprovalRef is required.')
  if (secretish.test(JSON.stringify({ boundedBy: input.boundedBy, humanApprovalRef: input.humanApprovalRef, boundaryNotes: input.boundaryNotes }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryHermesResearchRuntimeBoundaryResult(result: FactoryHermesResearchRuntimeBoundaryResult): FactoryHermesResearchRuntimeBoundaryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const c = result.hermesResearchRuntimeBoundaryContract
  if (result.boundaryKind !== FACTORY_HERMES_RESEARCH_RUNTIME_BOUNDARY_KIND) errors.push('Invalid kind.')
  if (result.boundaryVersion !== FACTORY_HERMES_RESEARCH_RUNTIME_BOUNDARY_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status === 'boundary_contract_created') {
    if (!result.researchRuntimeBoundaryReceipt) errors.push('Receipt is required.')
    if (!c) errors.push('Boundary contract is required.')
    if (result.selectedCandidateId !== 'pyproject-console-script-1') errors.push('selectedCandidateId must be pyproject-console-script-1.')
    if (!c?.futureExecutableCandidateWindows.endsWith('hermes.exe')) errors.push('Future executable must be hermes.exe.')
    if (result.researchRuntimeBoundaryReceipt?.approvedNextGate !== 'Factory Hermes Research Runtime Approval Gate v1') errors.push('Receipt must point to approval gate.')
    if (result.canProceedToResearchRuntimeApproval !== true) errors.push('Must proceed to approval when contract is created.')
  }
  if (result.canCreateRuntimeNow !== false || result.canExecuteHermes !== false || result.canRunHermesScripts !== false || result.canUseNetwork !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Immediate capabilities must be false.')
  if (c) {
    if (c.commandBoundary.commandsAllowedNow.length !== 0) errors.push('commandsAllowedNow must be empty.')
    if (c.commandBoundary.futureCommandCandidate.shell !== false) errors.push('future command shell must be false.')
    if (c.networkBoundary.networkAllowedNow !== false) errors.push('networkAllowedNow must be false.')
    if (c.credentialBoundary.credentialsAllowedNow !== false) errors.push('credentialsAllowedNow must be false.')
    if (c.modelBoundary.modelCallsAllowedNow !== false) errors.push('modelCallsAllowedNow must be false.')
  }
  const actions = result.researchRuntimeBoundaryReceipt?.notAuthorizedActions || []
  for (const action of ['execute_hermes_now', 'use_network_now', 'call_models_now', 'access_credentials_now']) if (!actions.includes(action)) errors.push(`Missing notAuthorizedAction: ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
