import { DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_APPROVAL_POLICY, FACTORY_HERMES_RESEARCH_RUNTIME_APPROVAL_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_APPROVAL_VERSION } from './hermes-research-runtime-approval.defaults.ts'
import type { FactoryHermesResearchRuntimeApprovalInput, FactoryHermesResearchRuntimeApprovalResult, FactoryHermesResearchRuntimeApprovalValidationResult } from './hermes-research-runtime-approval.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu
export function validateFactoryHermesResearchRuntimeApprovalInput(input: FactoryHermesResearchRuntimeApprovalInput): FactoryHermesResearchRuntimeApprovalValidationResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_APPROVAL_POLICY, ...(input.policy || {}) }
  const errors: string[] = []; const warnings: string[] = []
  if (!input.approvedAt) errors.push('approvedAt is required.')
  if (!input.approvedBy) errors.push('approvedBy is required.')
  if (!input.boundaryResult) errors.push('boundaryResult is required.')
  if (policy.requireHumanApprovalRef && !input.humanApprovalRef) errors.push('humanApprovalRef is required.')
  if (secretish.test(JSON.stringify({ approvedBy: input.approvedBy, humanApprovalRef: input.humanApprovalRef, approvalNotes: input.approvalNotes }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryHermesResearchRuntimeApprovalResult(result: FactoryHermesResearchRuntimeApprovalResult): FactoryHermesResearchRuntimeApprovalValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const e = result.approvedHermesResearchRuntimeAdapterEnvelope
  if (result.approvalKind !== FACTORY_HERMES_RESEARCH_RUNTIME_APPROVAL_KIND) errors.push('Invalid kind.')
  if (result.approvalVersion !== FACTORY_HERMES_RESEARCH_RUNTIME_APPROVAL_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status === 'approved_for_adapter_candidate') {
    if (!result.researchRuntimeApprovalReceipt) errors.push('Receipt is required.')
    if (!e) errors.push('Envelope is required.')
    if (result.selectedCandidateId !== 'pyproject-console-script-1') errors.push('selectedCandidateId must be pyproject-console-script-1.')
    if (result.commandName !== 'hermes') errors.push('commandName must be hermes.')
    if (result.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('pythonEntrypoint must be hermes_cli.main:main.')
    if (e?.selectedInterface.commandName !== 'hermes') errors.push('Envelope selectedInterface.commandName must be hermes.')
    if (e?.selectedInterface.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('Envelope selectedInterface.pythonEntrypoint must be hermes_cli.main:main.')
    if (!e?.selectedInterface.futureExecutableCandidateWindows?.endsWith('python-env/Scripts/hermes.exe')) errors.push('Envelope futureExecutableCandidateWindows must point to python-env/Scripts/hermes.exe.')
    if (e?.approvedNextGate !== 'Factory Hermes Research Runtime Adapter v1') errors.push('Envelope must point to adapter.')
    if (result.canProceedToResearchRuntimeAdapter !== true) errors.push('Must proceed to adapter.')
  }
  if (result.canCreateRuntimeNow !== false || result.canExecuteHermesNow !== false || result.canExecuteHermesOutsideAdapter !== false || result.canRunHermesScripts !== false || result.canUseNetworkNow !== false || result.canUseCredentialsNow !== false || result.canCallModelsNow !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Immediate capabilities must be false.')
  if (e) {
    if (e.executionAuthorizationScope !== 'future_runtime_adapter_only') errors.push('Invalid execution scope.')
    if (e.directExecutionNow !== false || e.futureRuntimeNetworkAllowed !== false || e.futureRuntimeCredentialsAllowed !== false || e.futureRuntimeModelCallsAllowed !== false) errors.push('Envelope immediate/future defaults are unsafe.')
  }
  const actions = result.researchRuntimeApprovalReceipt?.notAuthorizedActions || []
  for (const action of ['execute_hermes_now', 'create_runtime_in_this_gate', 'use_network_now', 'call_models_now', 'access_credentials_now']) if (!actions.includes(action)) errors.push(`Missing notAuthorizedAction: ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
