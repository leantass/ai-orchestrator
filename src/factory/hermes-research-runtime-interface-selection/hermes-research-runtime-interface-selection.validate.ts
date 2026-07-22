import { DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_INTERFACE_SELECTION_POLICY, FACTORY_HERMES_RESEARCH_RUNTIME_INTERFACE_SELECTION_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_INTERFACE_SELECTION_VERSION } from './hermes-research-runtime-interface-selection.defaults.ts'
import type { FactoryHermesResearchRuntimeInterfaceSelectionInput, FactoryHermesResearchRuntimeInterfaceSelectionResult, FactoryHermesResearchRuntimeInterfaceSelectionValidationResult } from './hermes-research-runtime-interface-selection.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu
export function validateFactoryHermesResearchRuntimeInterfaceSelectionInput(input: FactoryHermesResearchRuntimeInterfaceSelectionInput): FactoryHermesResearchRuntimeInterfaceSelectionValidationResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_INTERFACE_SELECTION_POLICY, ...(input.policy || {}) }
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.selectedAt) errors.push('selectedAt is required.')
  if (!input.selectedBy) errors.push('selectedBy is required.')
  if (!input.selectedCandidateId) errors.push('selectedCandidateId is required.')
  if (!input.planningResult) errors.push('planningResult is required.')
  if (policy.requireHumanApprovalRef && !input.humanApprovalRef) errors.push('humanApprovalRef is required.')
  if (secretish.test(JSON.stringify({ selectedBy: input.selectedBy, humanApprovalRef: input.humanApprovalRef, selectionNotes: input.selectionNotes, dossierSummary: input.dossierSummary }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryHermesResearchRuntimeInterfaceSelectionResult(result: FactoryHermesResearchRuntimeInterfaceSelectionResult): FactoryHermesResearchRuntimeInterfaceSelectionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.interfaceSelectionKind !== FACTORY_HERMES_RESEARCH_RUNTIME_INTERFACE_SELECTION_KIND) errors.push('Invalid kind.')
  if (result.interfaceSelectionVersion !== FACTORY_HERMES_RESEARCH_RUNTIME_INTERFACE_SELECTION_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status === 'selected') {
    if (!result.interfaceSelectionReceipt) errors.push('Selected result requires receipt.')
    if (!result.selectedHermesResearchRuntimeInterfaceEnvelope) errors.push('Selected result requires envelope.')
    if (result.selectedCandidateId !== 'pyproject-console-script-1') errors.push('Selected candidate must be pyproject-console-script-1.')
    if (result.selectedInterface?.commandName !== 'hermes') errors.push('Selected commandName must be hermes.')
    if (result.selectedInterface?.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('Selected pythonEntrypoint must be hermes_cli.main:main.')
    if (result.selectedHermesResearchRuntimeInterfaceEnvelope?.approvedNextGate !== 'Factory Hermes Research Runtime Boundary Contract v1') errors.push('Envelope must point to Boundary Contract.')
    if (result.canProceedToResearchRuntimeBoundary !== true) errors.push('Selected result must proceed to boundary.')
  }
  if (result.canExecuteHermes !== false) errors.push('canExecuteHermes must be false.')
  if (result.canRunHermesScripts !== false) errors.push('canRunHermesScripts must be false.')
  if (result.canUseNetwork !== false) errors.push('canUseNetwork must be false.')
  if (result.canUseCredentials !== false) errors.push('canUseCredentials must be false.')
  if (result.canCallModels !== false) errors.push('canCallModels must be false.')
  if (result.canMutateProjectFiles !== false) errors.push('canMutateProjectFiles must be false.')
  if (result.canDeploy !== false) errors.push('canDeploy must be false.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
