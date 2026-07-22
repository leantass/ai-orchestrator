import { FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION } from './hermes-research-runtime-adapter.defaults.ts'
import type { FactoryHermesResearchRuntimeAdapterInput, FactoryHermesResearchRuntimeAdapterResult, FactoryHermesResearchRuntimeAdapterValidationResult } from './hermes-research-runtime-adapter.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu
export function validateFactoryHermesResearchRuntimeAdapterInput(input: FactoryHermesResearchRuntimeAdapterInput): FactoryHermesResearchRuntimeAdapterValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.executedAt) errors.push('executedAt is required.')
  if (!input.executedBy) errors.push('executedBy is required.')
  if ((input.mode || 'help_probe_only') !== 'help_probe_only') errors.push('mode must be help_probe_only.')
  if (secretish.test(JSON.stringify({ executedBy: input.executedBy, executionNotes: input.executionNotes }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryHermesResearchRuntimeAdapterResult(result: FactoryHermesResearchRuntimeAdapterResult): FactoryHermesResearchRuntimeAdapterValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const command = result.commandResults[0]
  if (result.adapterKind !== FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND) errors.push('Invalid kind.')
  if (result.adapterVersion !== FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.mode !== 'help_probe_only') errors.push('mode must be help_probe_only.')
  if (result.commandName !== 'hermes') errors.push('commandName must be hermes.')
  if (result.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('pythonEntrypoint must be hermes_cli.main:main.')
  if (!result.executableRef.endsWith('python-env/Scripts/hermes.exe')) errors.push('executableRef must point to python-env/Scripts/hermes.exe.')
  if (!result.cwdRef.endsWith('75b300f/source')) errors.push('cwdRef must point to sourceRoot.')
  if (result.commandResults.length !== 1) errors.push('Exactly one command result is required.')
  if (command) {
    if (command.commandKind !== 'hermes_help_probe') errors.push('Command kind must be hermes_help_probe.')
    if (JSON.stringify(command.args) !== JSON.stringify(['--help'])) errors.push('Args must be exactly ["--help"].')
    if (command.shell !== false) errors.push('shell must be false.')
  }
  if (result.commandResults.some((entry) => !['hermes_help_probe'].includes(entry.commandKind))) errors.push('Unexpected command kind.')
  if (result.scriptsStatus !== 'not_executed' || result.pipStatus !== 'not_executed' || result.pythonDirectStatus !== 'not_executed' || result.setupPyStatus !== 'not_executed' || result.uvStatus !== 'not_executed') errors.push('Forbidden tool status must be not_executed.')
  if (result.networkStatus !== 'not_allowed' || result.credentialsStatus !== 'not_allowed' || result.modelCallStatus !== 'not_allowed') errors.push('Network, credentials and models must be not_allowed.')
  if (result.canTreatAsResearchResult !== false || result.canUseFindings !== false || result.canCallModels !== false || result.canUseCredentials !== false || result.canUseNetwork !== false || result.canDeploy !== false) errors.push('Research/model/network/deploy capabilities must be false.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
