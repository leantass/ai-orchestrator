export type HermesWrapperCommandBoundary = { configPathRef?: string, runRootRef?: string, promptRef?: string, credentialRef?: string, noToolProofRef?: string, sourceCliContractRef?: string, criticalBlockers?: string[] }
export type HermesWrapperCommandBuildBlocker = { reason: string, message: string }
export type HermesWrapperCommandAuditManifest = { manifestId: string, nonRunnable: true, rendererResultStatus: string, keepBlockedFallback: true, noCliDefaults: true, noMcpToolsets: true }
export type HermesWrapperFailClosedCommandBuilderInput = { rendererResult?: any, boundary?: HermesWrapperCommandBoundary }
export type HermesWrapperCommandBuildResult = { status: 'blocked' | 'wrapper_redacted_non_runnable_built', blockers: HermesWrapperCommandBuildBlocker[], auditManifest?: HermesWrapperCommandAuditManifest, runnableNow: false }

export function denyWrapperCommandBuild(reason: string): HermesWrapperCommandBuildBlocker {
  return { reason, message: `Blocked by fail-closed wrapper builder rule: ${reason}` }
}

export function assertVerifiedConfigAndRunRoot(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildBlocker[] {
  return input.boundary?.configPathRef && input.boundary?.runRootRef ? [] : [denyWrapperCommandBuild('verified_config_or_run_root_missing')]
}

export function assertPromptManifestRefOnly(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildBlocker[] {
  return input.boundary?.promptRef ? [] : [denyWrapperCommandBuild('prompt_ref_missing')]
}

export function assertCredentialRefOnly(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildBlocker[] {
  return input.boundary?.credentialRef ? [] : [denyWrapperCommandBuild('credential_ref_missing')]
}

export function assertNoToolProofPresent(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildBlocker[] {
  return input.boundary?.noToolProofRef ? [] : [denyWrapperCommandBuild('no_tool_proof_missing')]
}

export function assertSourceCliContractPresent(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildBlocker[] {
  return input.boundary?.sourceCliContractRef ? [] : [denyWrapperCommandBuild('source_cli_contract_missing')]
}

export function validateWrapperCommandBoundary(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildBlocker[] {
  const found = [...assertVerifiedConfigAndRunRoot(input), ...assertPromptManifestRefOnly(input), ...assertCredentialRefOnly(input), ...assertNoToolProofPresent(input), ...assertSourceCliContractPresent(input)]
  if (!input.rendererResult) found.push(denyWrapperCommandBuild('renderer_result_missing'))
  if (input.rendererResult?.status === 'blocked') found.push(denyWrapperCommandBuild('renderer_result_blocked'))
  for (const blocker of input.boundary?.criticalBlockers || []) found.push(denyWrapperCommandBuild(blocker))
  return found
}

export function buildWrapperCommandAuditManifest(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandAuditManifest {
  return { manifestId: 'hermes-wrapper-command-audit-manifest:v1', nonRunnable: true, rendererResultStatus: input.rendererResult?.status || 'missing', keepBlockedFallback: true, noCliDefaults: true, noMcpToolsets: true }
}

export function buildWrapperFailClosedHermesCommand(input: HermesWrapperFailClosedCommandBuilderInput): HermesWrapperCommandBuildResult {
  const validationBlockers = validateWrapperCommandBoundary(input)
  if (validationBlockers.length) return { status: 'blocked', blockers: validationBlockers, runnableNow: false }
  return { status: 'wrapper_redacted_non_runnable_built', blockers: [], auditManifest: buildWrapperCommandAuditManifest(input), runnableNow: false }
}

export function serializeHermesWrapperCommandBuildResult(result: HermesWrapperCommandBuildResult): string { return JSON.stringify(result, null, 2) }
export function parseHermesWrapperCommandBuildResult(text: string): HermesWrapperCommandBuildResult { return JSON.parse(text) }
