import { FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_KIND, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_VERSION } from './hermes-entrypoint-materialization-verification.defaults.ts'
import type { FactoryHermesEntrypointMaterializationVerificationInput, FactoryHermesEntrypointMaterializationVerificationResult, FactoryHermesEntrypointMaterializationVerificationValidationResult } from './hermes-entrypoint-materialization-verification.types.ts'

export function validateFactoryHermesEntrypointMaterializationVerificationInput(input: FactoryHermesEntrypointMaterializationVerificationInput): FactoryHermesEntrypointMaterializationVerificationValidationResult {
  const errors: string[] = []
  if (!input.verifiedAt) errors.push('verifiedAt is required')
  if (!input.verifiedBy) errors.push('verifiedBy is required')
  if (!input.runtimeRetryResult) errors.push('runtimeRetryResult is required')
  if (!input.runtimeRetryManifest) errors.push('runtimeRetryManifest is required')
  if (!input.executableInspection) errors.push('executableInspection is required')
  if (/secret|token|api[_-]?key|password|bearer/iu.test(JSON.stringify(input.verificationNotes || []))) errors.push('verificationNotes contain apparent secret text')
  return { ok: errors.length === 0, errors, warnings: [] }
}

export function validateFactoryHermesEntrypointMaterializationVerificationResult(result: FactoryHermesEntrypointMaterializationVerificationResult): FactoryHermesEntrypointMaterializationVerificationValidationResult {
  const errors: string[] = []
  if (result.verificationKind !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_KIND) errors.push('invalid kind')
  if (result.verificationVersion !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_VERIFICATION_VERSION) errors.push('invalid version')
  if (result.toolId !== 'hermes_agent') errors.push('invalid toolId')
  if (result.commandName !== 'hermes') errors.push('invalid commandName')
  if (result.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('invalid pythonEntrypoint')
  if (!['verified', 'warning_verified'].includes(result.status)) errors.push('status must be verified/warning_verified')
  if (result.decision !== 'hermes_entrypoint_materialization_verified_for_research_runtime_adapter_retry') errors.push('invalid decision')
  if (!result.entrypointMaterializationVerificationReceipt || !result.hermesEntrypointMaterializationVerificationRecord || !result.approvedResearchRuntimeAdapterRetryEnvelope) errors.push('verification artifacts are required')
  if (result.executableStatus !== 'present' || !result.executableSha256) errors.push('executable must be present with sha256')
  if (result.canProceedToResearchRuntimeAdapterRetry !== true) errors.push('adapter retry handoff required')
  for (const [k, v] of Object.entries({ canRetryResearchAdapterNow: result.canRetryResearchAdapterNow, canExecuteHermesNow: result.canExecuteHermesNow, canTreatAsResearchResult: result.canTreatAsResearchResult, canUseFindings: result.canUseFindings, canUseNetwork: result.canUseNetwork, canUseCredentials: result.canUseCredentials, canCallModels: result.canCallModels, canMutateProjectFiles: result.canMutateProjectFiles, canDeploy: result.canDeploy })) if (v !== false) errors.push(`${k} must be false`)
  const actions = result.entrypointMaterializationVerificationReceipt?.notAuthorizedActions || []
  for (const action of ['execute_hermes_now', 'execute_entrypoint_now', 'retry_research_adapter_now', 'use_network_now']) if (!actions.includes(action)) errors.push(`missing ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep required')
  return { ok: errors.length === 0, errors, warnings: [] }
}
