import { validateApprovedPromptArtifactRef as validatePromptRefContract, validateCredentialRefOnly as validateCredentialRefContract, validateNoToolPolicy, validateProviderModelHostRefs as validateProviderRefsContract, validateResearchOutputContract } from '../controlled-research-runtime-contracts/index.ts'

export type ProviderDirectResearchAdapterInput = Record<string, any>
export type ProviderDirectRequestEnvelope = Record<string, any>
export type ProviderDirectRequestBlocker = { reason: string }
export type ProviderDirectAdapterResult = { ok: boolean, envelope?: ProviderDirectRequestEnvelope, blockers: ProviderDirectRequestBlocker[], noToolEvidence: Record<string, boolean> }
export type ProviderDirectAuditSummary = Record<string, unknown>

export function buildProviderDirectRequestBlocker(reason: string): ProviderDirectRequestBlocker {
  return { reason }
}

export function validateProviderDirectRuntimeBoundary(input: ProviderDirectResearchAdapterInput) {
  return validateProviderModelHostRefs(input?.providerModelHostRefs || input)
}

export function validateApprovedPromptArtifact(input: ProviderDirectResearchAdapterInput) {
  return validatePromptRefContract(input?.promptArtifact || input)
}

export function validateOutputContract(input: ProviderDirectResearchAdapterInput) {
  return validateResearchOutputContract(input?.outputContract || input)
}

export function validateProviderModelHostRefs(input: ProviderDirectResearchAdapterInput) {
  return validateProviderRefsContract(input?.providerModelHostRefs || input)
}

export function validateCredentialRefOnly(input: ProviderDirectResearchAdapterInput) {
  return validateCredentialRefContract(input?.credentialRef || input)
}

export function enforceNoToolRequest(input: ProviderDirectResearchAdapterInput) {
  const policy = validateNoToolPolicy(input?.noToolPolicy || input)
  const declarations = input?.tools || input?.functions || input?.tool_choice || input?.toolChoice
  return { ok: policy.ok && !declarations, blockers: [...policy.blockers, ...(declarations ? [buildProviderDirectRequestBlocker('tool_declarations_forbidden')] : [])] }
}

export function buildProviderDirectResearchRequest(input: ProviderDirectResearchAdapterInput): ProviderDirectAdapterResult {
  const validations = [validateApprovedPromptArtifact(input), validateOutputContract(input), validateProviderDirectRuntimeBoundary(input), validateCredentialRefOnly(input), enforceNoToolRequest(input)]
  const blockers = validations.flatMap((item) => item.blockers).map((item) => buildProviderDirectRequestBlocker(item.reason))
  const noToolEvidence = { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false, toolsDeclared: false }
  if (blockers.length > 0) return { ok: false, blockers, noToolEvidence }
  return {
    ok: true,
    blockers: [],
    noToolEvidence,
    envelope: { envelopeKind: 'provider_direct_non_executing_request_envelope', runnableNow: false, credentialValueIncluded: false, networkCallIncluded: false, modelCallIncluded: false, promptSentToProvider: false, toolsDeclared: false, findingsUseApprovedNow: false, providerRef: 'openai', modelRef: 'gpt-4o-mini', hostRef: 'api.openai.com' },
  }
}

export function summarizeProviderDirectRequestForAudit(input: ProviderDirectResearchAdapterInput): ProviderDirectAuditSummary {
  const result = buildProviderDirectResearchRequest(input)
  return { ok: result.ok, blockerCount: result.blockers.length, containsSecrets: false, runtimeExecuted: false, networkUsed: false, modelCalled: false, promptSentToProvider: false }
}

export function serializeProviderDirectAdapterResult(input: unknown): string { return JSON.stringify(input, null, 2) }
export function parseProviderDirectAdapterResult(text: string): unknown { return JSON.parse(text) }
