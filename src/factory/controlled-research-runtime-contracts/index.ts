export type ApprovedPromptArtifactRef = { ref?: string, path?: string, hash?: string, safeSummary?: string }
export type ResearchOutputContract = { schema?: Record<string, unknown>, boundedOutput?: boolean, maxBytes?: number }
export type ProviderModelHostRefs = { providerRef?: string, modelRef?: string, hostRef?: string }
export type CredentialRefOnly = { credentialRef?: string, credentialValue?: string }
export type NoToolRequestPolicy = { toolsAllowed?: boolean, toolRegistryAllowed?: boolean, mcpAllowed?: boolean, functionDeclarationsAllowed?: boolean, toolChoiceAllowed?: boolean }
export type RuntimeTimeoutPolicy = { maxRuntimeMs?: number }
export type OutputBoundsPolicy = { maxBytes?: number, findingsBlockedByDefault?: boolean }
export type RedactionPolicy = { enabled?: boolean, secretPatternsBlocked?: boolean }
export type RuntimeAuditManifest = Record<string, unknown>
export type ControlledResearchRuntimeContractValidation = { ok: boolean, blockers: ControlledResearchRuntimeContractBlocker[] }
export type ControlledResearchRuntimeContractBlocker = { reason: string }

const secretIndicators = ['secret', 'token', 'password', 'apikey', 'api_key', 'credential', 'OPENAI_API_KEY=']

export function buildRuntimeContractBlocker(reason: string): ControlledResearchRuntimeContractBlocker {
  return { reason }
}

function validation(blockers: string[]): ControlledResearchRuntimeContractValidation {
  return { ok: blockers.length === 0, blockers: blockers.map(buildRuntimeContractBlocker) }
}

export function validateApprovedPromptArtifactRef(input: ApprovedPromptArtifactRef): ControlledResearchRuntimeContractValidation {
  const blockers: string[] = []
  if (!input?.ref) blockers.push('prompt_artifact_ref_required')
  if (!input?.path) blockers.push('prompt_artifact_path_required')
  if (!input?.hash) blockers.push('prompt_artifact_hash_required')
  if (!input?.safeSummary) blockers.push('prompt_artifact_safe_summary_required')
  const haystack = `${input?.ref || ''} ${input?.path || ''} ${input?.hash || ''} ${input?.safeSummary || ''}`.toLowerCase()
  if (secretIndicators.some((indicator) => haystack.includes(indicator.toLowerCase()))) blockers.push('prompt_artifact_contains_secret_indicator')
  return validation(blockers)
}

export function validateResearchOutputContract(input: ResearchOutputContract): ControlledResearchRuntimeContractValidation {
  return validation([!input?.schema ? 'output_schema_required' : '', input?.boundedOutput !== true ? 'bounded_output_required' : '', !input?.maxBytes || input.maxBytes <= 0 ? 'positive_output_bound_required' : ''].filter(Boolean))
}

export function validateProviderModelHostRefs(input: ProviderModelHostRefs): ControlledResearchRuntimeContractValidation {
  return validation([input?.providerRef !== 'openai' ? 'provider_ref_must_be_openai' : '', input?.modelRef !== 'gpt-4o-mini' ? 'model_ref_must_be_gpt_4o_mini' : '', input?.hostRef !== 'api.openai.com' ? 'host_ref_must_be_api_openai_com' : ''].filter(Boolean))
}

export function validateCredentialRefOnly(input: CredentialRefOnly): ControlledResearchRuntimeContractValidation {
  return validation([input?.credentialRef !== 'OPENAI_API_KEY' ? 'credential_ref_must_be_OPENAI_API_KEY' : '', input?.credentialValue ? 'credential_value_forbidden' : ''].filter(Boolean))
}

export function validateNoToolPolicy(input: NoToolRequestPolicy): ControlledResearchRuntimeContractValidation {
  return validation(['toolsAllowed', 'toolRegistryAllowed', 'mcpAllowed', 'functionDeclarationsAllowed', 'toolChoiceAllowed'].filter((key) => input?.[key as keyof NoToolRequestPolicy] !== false).map((key) => `${key}_must_be_false`))
}

export function validateRuntimeTimeoutPolicy(input: RuntimeTimeoutPolicy): ControlledResearchRuntimeContractValidation {
  return validation([!input?.maxRuntimeMs || input.maxRuntimeMs <= 0 ? 'positive_timeout_required' : '', input?.maxRuntimeMs && input.maxRuntimeMs > 120000 ? 'timeout_exceeds_reasonable_limit' : ''].filter(Boolean))
}

export function validateOutputBoundsPolicy(input: OutputBoundsPolicy): ControlledResearchRuntimeContractValidation {
  return validation([!input?.maxBytes || input.maxBytes <= 0 ? 'positive_output_bound_required' : '', input?.findingsBlockedByDefault !== true ? 'findings_must_be_blocked_by_default' : ''].filter(Boolean))
}

export function validateRedactionPolicy(input: RedactionPolicy): ControlledResearchRuntimeContractValidation {
  return validation([input?.enabled !== true ? 'redaction_enabled_required' : '', input?.secretPatternsBlocked !== true ? 'secret_pattern_blocking_required' : ''].filter(Boolean))
}

export function buildRuntimeAuditManifest(input: Record<string, unknown>): RuntimeAuditManifest {
  return { auditKind: 'controlled_research_runtime_contract_audit', redacted: true, runtimeExecuted: false, credentialsRead: false, networkUsed: false, modelCalled: false, findingsPromoted: false, summary: summarizeControlledResearchRuntimeContract(input) }
}

export function summarizeControlledResearchRuntimeContract(input: Record<string, unknown>) {
  return { keys: Object.keys(input || {}).sort(), safeSummary: 'controlled research runtime contracts validated without execution' }
}

export function serializeControlledResearchRuntimeContract(input: unknown): string { return JSON.stringify(input, null, 2) }
export function parseControlledResearchRuntimeContract(text: string): unknown { return JSON.parse(text) }
