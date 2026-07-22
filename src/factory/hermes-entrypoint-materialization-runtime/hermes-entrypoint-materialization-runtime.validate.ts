import { FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_KIND, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_VERSION } from './hermes-entrypoint-materialization-runtime.defaults.ts'
import type { FactoryHermesEntrypointMaterializationRuntimeInput, FactoryHermesEntrypointMaterializationRuntimeResult, FactoryHermesEntrypointMaterializationRuntimeValidationResult } from './hermes-entrypoint-materialization-runtime.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu

export function validateFactoryHermesEntrypointMaterializationRuntimeInput(input: FactoryHermesEntrypointMaterializationRuntimeInput): FactoryHermesEntrypointMaterializationRuntimeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.executedAt) errors.push('executedAt is required.')
  if (!input.executedBy) errors.push('executedBy is required.')
  if (!input.approvalResult) errors.push('approvalResult is required.')
  if (secretish.test(JSON.stringify({ executedBy: input.executedBy, runtimeNotes: input.runtimeNotes }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesEntrypointMaterializationRuntimeResult(result: FactoryHermesEntrypointMaterializationRuntimeResult): FactoryHermesEntrypointMaterializationRuntimeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.materializationKind !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_KIND) errors.push('Invalid kind.')
  if (result.materializationVersion !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.commandName !== 'hermes') errors.push('commandName must be hermes.')
  if (result.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('pythonEntrypoint must be hermes_cli.main:main.')
  if (result.selectedMethodCandidate !== 'uv_sync_install_project_locked_existing_env') errors.push('Invalid selected method.')
  if (result.commandResults.length > 1) errors.push('At most one command may execute.')
  const command = result.commandResults[0]
  if (command) {
    if (command.commandKind !== 'uv_sync_install_project_locked_existing_env') errors.push('Invalid command kind.')
    if (command.executableRef !== '.codex-temp/external-tools/uv/bin/uv.exe') errors.push('Invalid executable.')
    if (JSON.stringify(command.args) !== JSON.stringify(['sync', '--locked', '--no-dev', '--project', '.codex-temp/external-tools/hermes-agent/install/75b300f/source'])) errors.push('Invalid args.')
    if (command.args.includes('--no-install-project')) errors.push('Args must not include --no-install-project.')
    if (command.shell !== false) errors.push('shell must be false.')
  }
  if (result.status === 'success') {
    if (result.executableStatusAfter !== 'present') errors.push('Executable must be present on success.')
    if (result.materializationStatus !== 'materialized') errors.push('Materialization status must be materialized on success.')
    if (result.canProceedToEntrypointMaterializationVerification !== true) errors.push('Success must proceed to verification.')
  }
  if (result.canRetryResearchAdapterNow !== false || result.canExecuteHermesNow !== false || result.canTreatAsResearchResult !== false || result.canUseFindings !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canDeploy !== false) errors.push('Unsafe capabilities must be false.')
  if (result.pipStatus !== 'not_executed' || result.pythonDirectStatus !== 'not_executed' || result.setupPyDirectStatus !== 'not_executed' || result.hermesExecutionStatus !== 'not_executed' || result.scriptsStatus !== 'not_executed') errors.push('Forbidden execution status must remain not_executed.')
  if (result.networkStatus !== 'not_allowed' || result.credentialsStatus !== 'not_allowed' || result.modelCallStatus !== 'not_allowed') errors.push('Network, credentials and model calls must be not_allowed.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
