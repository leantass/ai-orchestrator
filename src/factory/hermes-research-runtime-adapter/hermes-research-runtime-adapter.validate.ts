import { FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION } from './hermes-research-runtime-adapter.defaults.ts'
import type { FactoryHermesResearchRuntimeAdapterInput, FactoryHermesResearchRuntimeAdapterResult, FactoryHermesResearchRuntimeAdapterValidationResult } from './hermes-research-runtime-adapter.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu

export function validateFactoryHermesResearchRuntimeAdapterInput(input: FactoryHermesResearchRuntimeAdapterInput): FactoryHermesResearchRuntimeAdapterValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.adaptedAt) errors.push('adaptedAt is required.')
  if (!input?.adaptedBy) errors.push('adaptedBy is required.')
  if (secretish.test(JSON.stringify({ adaptedBy: input?.adaptedBy }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchRuntimeAdapterResult(result: FactoryHermesResearchRuntimeAdapterResult): FactoryHermesResearchRuntimeAdapterValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.adapterKind !== FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND) errors.push('Invalid kind.')
  if (result.adapterVersion !== FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (!['research_runtime_adapter_prepared', 'research_runtime_adapter_blocked'].includes(result.status)) errors.push('Invalid status.')
  if (result.selectedWrapperStrategy !== 'wrapper_temp_config_no_toolsets') errors.push('Invalid wrapper strategy.')
  if (result.runtimeAdapterExecutionAllowedNow !== false) errors.push('Runtime adapter execution must remain blocked.')
  if (result.researchExecutionApproved !== false || result.hermesExecutionApproved !== false) errors.push('Research and Hermes execution must remain blocked.')
  if (result.promptPassingApproved !== false || result.modelCallsApproved !== false || result.networkApproved !== false || result.credentialAccessApproved !== false || result.toolsetEnablementApproved !== false || result.findingsUseApproved !== false) errors.push('Prompt/model/network/credential/toolset/findings approvals must be false.')
  if (result.canRunResearchNow !== false || result.canExecuteHermesNow !== false || result.canPassPromptNow !== false || result.canUseNetworkNow !== false || result.canUseCredentialsNow !== false || result.canReadEnvSecretsNow !== false || result.canCallModelsNow !== false || result.canEnableToolsetsNow !== false || result.canMutateFilesystemNow !== false || result.canUseFindings !== false) errors.push('Runtime capability flags must be false.')
  if (result.status === 'research_runtime_adapter_prepared' && result.canProceedToResearchExecutionApprovalRetry !== true) errors.push('Prepared adapter must proceed only to execution approval retry.')
  if (result.adapterNonExecutableCommandEnvelope.commandString !== null || result.adapterNonExecutableCommandEnvelope.argv.length !== 0 || Object.keys(result.adapterNonExecutableCommandEnvelope.env).length !== 0 || result.adapterNonExecutableCommandEnvelope.prompt !== null || result.adapterNonExecutableCommandEnvelope.tempConfigPath !== null || result.adapterNonExecutableCommandEnvelope.runRoot !== null) errors.push('Adapter command envelope must be non-executable.')
  return { ok: errors.length === 0, errors, warnings }
}
