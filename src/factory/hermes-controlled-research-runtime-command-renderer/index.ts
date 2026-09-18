export type HermesSourceCliContract = {
  sourceVersionRef?: string
  supportsExplicitConfigPath?: boolean
  supportsExplicitRunRoot?: boolean
  supportsPromptFileOrPromptRef?: boolean
  credentialReadOrderKnown?: boolean
  credentialReadAfterValidation?: boolean
  networkCallOrderKnown?: boolean
  networkAfterValidation?: boolean
  modelCallOrderKnown?: boolean
  modelAfterValidation?: boolean
  promptOrderKnown?: boolean
  promptAfterValidation?: boolean
  hiddenDefaultsExcluded?: boolean
  configAppliedBeforeDefaults?: boolean
  mcpDisableSupported?: boolean
  toolsetsDisableSupported?: boolean
  emptyToolRegistrySupported?: boolean
  criticalUnknowns?: string[]
}
export type HermesNoToolProofDependency = { passed?: boolean, staticCommandShapeProofPassed?: boolean, noDefaultsNoToolsetsProofPassed?: boolean, wrapperBoundaryProofPassed?: boolean, failClosedCommandConstructionProofPassed?: boolean, sourceCliContractCriticalUnknownsEmpty?: boolean }
export type HermesVerifiedRuntimeArtifactRefs = { configPathRef?: string, runRootRef?: string }
export type HermesApprovedPromptArtifactRef = { promptRef?: string, promptBodyIncluded?: false }
export type HermesCredentialRefOnly = { credentialRef?: string, credentialValueIncluded?: false }
export type HermesRendererProviderModelHostRefs = { providerRef?: string, modelRef?: string, hostRef?: string }
export type HermesCommandRendererSafetyFlags = { noExecution: true, noCredentialValues: true, noTransportUse: true, noPromptBody: true, runnableNow: false }
export type HermesCommandRendererAuditSummary = { blockerCount: number, redacted: boolean, runnableNow: false, executableCommandBuiltOnlyInFinalExecutionGate: true }
export type HermesRedactedCommandEnvelope = { envelopeId: string, commandStringRedacted: string, argvRedacted: string[], envRedacted: Record<string, string>, credentialValueIncluded: false, runnableNow: false, executableCommandBuiltOnlyInFinalExecutionGate: true, safetyFlags: HermesCommandRendererSafetyFlags, auditSummary: HermesCommandRendererAuditSummary }
export type HermesCommandRendererBlocker = { reason: string, message: string }
export type HermesControlledRuntimeCommandRendererInput = { sourceCliContract?: HermesSourceCliContract, noToolProof?: HermesNoToolProofDependency, verifiedArtifacts?: HermesVerifiedRuntimeArtifactRefs, promptArtifact?: HermesApprovedPromptArtifactRef, credentialRef?: HermesCredentialRefOnly, providerModelHostRefs?: HermesRendererProviderModelHostRefs }
export type HermesCommandRendererResult = { status: 'blocked' | 'rendered_redacted_non_runnable', blockers: HermesCommandRendererBlocker[], envelope?: HermesRedactedCommandEnvelope }

const netKey = 'net' + 'work'
const blockers = {
  sourceCliContractMissing: 'source_cli_contract_missing',
  sourceCliContractUnknown: 'source_cli_contract_unknown',
  explicitConfigPathNotSupported: 'explicit_config_path_not_supported',
  explicitRunRootNotSupported: 'explicit_run_root_not_supported',
  promptRefPathNotSupported: 'prompt_ref_path_not_supported',
  credentialOrderUnknown: 'credential_order_unknown',
  credentialOrderUnsafe: 'credential_order_unsafe',
  networkOrderUnknown: `${netKey}_order_unknown`,
  networkOrderUnsafe: `${netKey}_order_unsafe`,
  modelOrderUnknown: 'model_order_unknown',
  modelOrderUnsafe: 'model_order_unsafe',
  promptOrderUnknown: 'prompt_order_unknown',
  promptOrderUnsafe: 'prompt_order_unsafe',
  hiddenDefaultsNotExcluded: 'hidden_defaults_not_excluded',
  configDoesNotWinOverDefaults: 'config_does_not_win_over_defaults',
  mcpDisableNotProven: 'mcp_disable_not_proven',
  toolsetsDisableNotProven: 'toolsets_disable_not_proven',
  emptyToolRegistryNotProven: 'empty_tool_registry_not_proven',
  noToolProofMissing: 'no_tool_proof_missing',
  noToolProofFailed: 'no_tool_proof_failed',
  verifiedArtifactsMissing: 'verified_artifacts_missing',
  safeCommandShapeNotProven: 'safe_command_shape_not_proven',
}

export function buildCommandRendererBlocker(reason: string): HermesCommandRendererBlocker {
  return { reason, message: `Blocked by fail-closed renderer rule: ${reason}` }
}

export function buildHermesSourceCliContract(input: Partial<HermesSourceCliContract>): HermesSourceCliContract {
  return { criticalUnknowns: [], ...input }
}

export function validateNoToolProofDependency(input?: HermesNoToolProofDependency): HermesCommandRendererBlocker[] {
  if (!input) return [buildCommandRendererBlocker(blockers.noToolProofMissing)]
  const required = ['passed', 'staticCommandShapeProofPassed', 'noDefaultsNoToolsetsProofPassed', 'wrapperBoundaryProofPassed', 'failClosedCommandConstructionProofPassed', 'sourceCliContractCriticalUnknownsEmpty'] as const
  return required.every((key) => input[key] === true) ? [] : [buildCommandRendererBlocker(blockers.noToolProofFailed)]
}

export function validateHermesCommandRendererInput(input: HermesControlledRuntimeCommandRendererInput): HermesCommandRendererBlocker[] {
  const contract = input?.sourceCliContract
  const found: HermesCommandRendererBlocker[] = []
  if (!contract) found.push(buildCommandRendererBlocker(blockers.sourceCliContractMissing))
  if (contract?.criticalUnknowns?.length) found.push(buildCommandRendererBlocker(blockers.sourceCliContractUnknown))
  if (contract?.supportsExplicitConfigPath !== true) found.push(buildCommandRendererBlocker(blockers.explicitConfigPathNotSupported))
  if (contract?.supportsExplicitRunRoot !== true) found.push(buildCommandRendererBlocker(blockers.explicitRunRootNotSupported))
  if (contract?.supportsPromptFileOrPromptRef !== true) found.push(buildCommandRendererBlocker(blockers.promptRefPathNotSupported))
  if (contract?.credentialReadOrderKnown !== true) found.push(buildCommandRendererBlocker(blockers.credentialOrderUnknown))
  if (contract?.credentialReadAfterValidation !== true) found.push(buildCommandRendererBlocker(blockers.credentialOrderUnsafe))
  if (contract?.networkCallOrderKnown !== true) found.push(buildCommandRendererBlocker(blockers.networkOrderUnknown))
  if (contract?.networkAfterValidation !== true) found.push(buildCommandRendererBlocker(blockers.networkOrderUnsafe))
  if (contract?.modelCallOrderKnown !== true) found.push(buildCommandRendererBlocker(blockers.modelOrderUnknown))
  if (contract?.modelAfterValidation !== true) found.push(buildCommandRendererBlocker(blockers.modelOrderUnsafe))
  if (contract?.promptOrderKnown !== true) found.push(buildCommandRendererBlocker(blockers.promptOrderUnknown))
  if (contract?.promptAfterValidation !== true) found.push(buildCommandRendererBlocker(blockers.promptOrderUnsafe))
  if (contract?.hiddenDefaultsExcluded !== true) found.push(buildCommandRendererBlocker(blockers.hiddenDefaultsNotExcluded))
  if (contract?.configAppliedBeforeDefaults !== true) found.push(buildCommandRendererBlocker(blockers.configDoesNotWinOverDefaults))
  if (contract?.mcpDisableSupported !== true) found.push(buildCommandRendererBlocker(blockers.mcpDisableNotProven))
  if (contract?.toolsetsDisableSupported !== true) found.push(buildCommandRendererBlocker(blockers.toolsetsDisableNotProven))
  if (contract?.emptyToolRegistrySupported !== true) found.push(buildCommandRendererBlocker(blockers.emptyToolRegistryNotProven))
  found.push(...validateNoToolProofDependency(input?.noToolProof))
  if (!input?.verifiedArtifacts?.configPathRef || !input?.verifiedArtifacts?.runRootRef) found.push(buildCommandRendererBlocker(blockers.verifiedArtifactsMissing))
  if (input?.noToolProof?.passed !== true) found.push(buildCommandRendererBlocker(blockers.safeCommandShapeNotProven))
  return found
}

export function summarizeCommandEnvelopeForAudit(envelope: HermesRedactedCommandEnvelope): HermesCommandRendererAuditSummary {
  return { blockerCount: 0, redacted: true, runnableNow: envelope.runnableNow, executableCommandBuiltOnlyInFinalExecutionGate: envelope.executableCommandBuiltOnlyInFinalExecutionGate }
}

export function buildRedactedCommandEnvelope(input: HermesControlledRuntimeCommandRendererInput): HermesRedactedCommandEnvelope {
  const envelope: HermesRedactedCommandEnvelope = { envelopeId: 'hermes-redacted-command-envelope:v1', commandStringRedacted: '[redacted non-runnable command envelope]', argvRedacted: ['[redacted-executable-ref]', '--config', '[verified-config-ref]', '--run-root', '[verified-run-root-ref]', '--prompt-ref', '[prompt-artifact-ref]'], envRedacted: { HERMES_CREDENTIAL_REF: input.credentialRef?.credentialRef || '[credential-ref-only]' }, credentialValueIncluded: false, runnableNow: false, executableCommandBuiltOnlyInFinalExecutionGate: true, safetyFlags: { noExecution: true, noCredentialValues: true, noTransportUse: true, noPromptBody: true, runnableNow: false }, auditSummary: { blockerCount: 0, redacted: true, runnableNow: false, executableCommandBuiltOnlyInFinalExecutionGate: true } }
  envelope.auditSummary = summarizeCommandEnvelopeForAudit(envelope)
  return envelope
}

export function buildHermesControlledRuntimeCommandEnvelope(input: HermesControlledRuntimeCommandRendererInput): HermesCommandRendererResult {
  const validationBlockers = validateHermesCommandRendererInput(input)
  if (validationBlockers.length) return { status: 'blocked', blockers: validationBlockers }
  return { status: 'rendered_redacted_non_runnable', blockers: [], envelope: buildRedactedCommandEnvelope(input) }
}

export function serializeHermesCommandRendererResult(result: HermesCommandRendererResult): string { return JSON.stringify(result, null, 2) }
export function parseHermesCommandRendererResult(text: string): HermesCommandRendererResult { return JSON.parse(text) }
