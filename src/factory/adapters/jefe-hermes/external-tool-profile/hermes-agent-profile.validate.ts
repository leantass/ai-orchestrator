import { HERMES_AGENT_EXTERNAL_TOOL_PROFILE_KIND, HERMES_AGENT_EXTERNAL_TOOL_PROFILE_VERSION, HERMES_AGENT_REQUIRED_DISALLOWED_USES } from './hermes-agent-profile.defaults.ts'
import type { HermesAgentExternalToolProfileV1, HermesAgentProfileValidationResult } from './hermes-agent-profile.types.ts'

export function validateHermesAgentExternalToolProfileV1(profile: HermesAgentExternalToolProfileV1): HermesAgentProfileValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  const requiredTrue = ['requiresAdapter', 'externalCallsRequireHumanApproval', 'memoryWritesRequireHumanApproval', 'cronDisabledByDefault', 'toolCallingDisabledByDefault', 'filesystemWriteDisabledByDefault', 'repoWriteDisabledByDefault', 'codeExecutionDisabledByDefault', 'deployDisabledByDefault'] as const
  if (profile.profileKind !== HERMES_AGENT_EXTERNAL_TOOL_PROFILE_KIND) errors.push('profileKind must identify the Hermes Agent external tool profile.')
  if (profile.profileVersion !== HERMES_AGENT_EXTERNAL_TOOL_PROFILE_VERSION) errors.push('profileVersion must be 1.0.')
  if (profile.externalToolName !== 'Hermes Agent') errors.push('externalToolName must be Hermes Agent.')
  if (profile.externalToolOrigin !== 'external_tool') errors.push('externalToolOrigin must be external_tool.')
  if (!profile.externalToolProvider.trim()) errors.push('externalToolProvider is required.')
  if (!profile.officialRepository.trim() || !profile.officialDocs.trim()) errors.push('Official repository and documentation are required.')
  if (!profile.auditedAt.trim()) errors.push('auditedAt is required and must be supplied by the caller.')
  if (profile.auditSourceRefs.length === 0) errors.push('auditSourceRefs must not be empty.')
  if (profile.runtimeStatus.installed !== false || profile.runtimeStatus.cloned !== false || profile.runtimeStatus.runtimeIntegrated !== false || profile.runtimeStatus.executablePath !== null || profile.runtimeStatus.credentialsConfigured !== false) errors.push('Runtime status must remain fully inactive in v1.')
  if (profile.policy.adapterName !== 'JefeHermesAdapter' || profile.policy.defaultMode !== 'read_only') errors.push('JefeHermesAdapter and read_only mode are mandatory.')
  for (const field of requiredTrue) if (profile.policy[field] !== true) errors.push(`${field} must be true.`)
  for (const use of HERMES_AGENT_REQUIRED_DISALLOWED_USES) if (!profile.disallowedUses.includes(use)) errors.push(`disallowedUses must include ${use}.`)
  if (profile.allowedUses.some((use) => !['documentation_only', 'offline_contract_mapping', 'read_only_research_request_planning'].includes(use))) errors.push('Allowed uses may not enable runtime, writes or deployment.')
  if (profile.risks.length === 0) warnings.push('No risks were recorded.')
  return { ok: errors.length === 0, errors, warnings }
}
