import type { HermesAgentCapability, HermesAgentDisallowedUse, HermesAgentExternalToolProfileV1, HermesAgentIntegrationSurface } from './hermes-agent-profile.types.ts'

export const HERMES_AGENT_EXTERNAL_TOOL_PROFILE_KIND = 'hermes-agent-external-tool-profile' as const
export const HERMES_AGENT_EXTERNAL_TOOL_PROFILE_VERSION = '1.0' as const
export const HERMES_AGENT_OFFICIAL_REPOSITORY = 'https://github.com/NousResearch/hermes-agent'
export const HERMES_AGENT_OFFICIAL_DOCS = 'https://hermes-agent.nousresearch.com/docs/'

const capabilities: Record<HermesAgentCapability, boolean> = {
  cli_possible: true, desktop_possible: true, mcp_possible: true, cron_possible: true, memory_possible: true,
  skills_possible: true, tool_calling_possible: true, messaging_possible: true, ide_possible: false, web_or_network_possible: true,
}

const sourceRefs = [HERMES_AGENT_OFFICIAL_REPOSITORY, HERMES_AGENT_OFFICIAL_DOCS, 'https://github.com/NousResearch/hermes-agent/tree/main/website/docs']
const surfaces: HermesAgentIntegrationSurface[] = (Object.entries(capabilities) as Array<[HermesAgentCapability, boolean]>).map(([capability, detected]) => ({
  surface: capability.replace(/_possible$/, '') as HermesAgentIntegrationSurface['surface'], capability, detected,
  evidenceSourceRefs: sourceRefs, notes: detected ? 'Documented by the official repository or documentation; not enabled by JEFE.' : 'Not clearly established by the audited official sources.',
}))

export const HERMES_AGENT_REQUIRED_DISALLOWED_USES: readonly HermesAgentDisallowedUse[] = ['filesystem_write', 'repo_write', 'autonomous_cron', 'memory_write', 'external_network_calls', 'credentialed_tools', 'code_execution', 'deploy', 'production_data_access', 'customer_data_access']

export function createDefaultHermesAgentExternalToolProfileV1(input: { auditedAt: string }): HermesAgentExternalToolProfileV1 {
  return structuredClone({
    profileKind: HERMES_AGENT_EXTERNAL_TOOL_PROFILE_KIND, profileVersion: HERMES_AGENT_EXTERNAL_TOOL_PROFILE_VERSION,
    externalToolName: 'Hermes Agent', externalToolOrigin: 'external_tool', externalToolProvider: 'Nous Research',
    officialRepository: HERMES_AGENT_OFFICIAL_REPOSITORY, officialDocs: HERMES_AGENT_OFFICIAL_DOCS, auditedAt: input.auditedAt, auditSourceRefs: sourceRefs,
    runtimeStatus: { installed: false, cloned: false, runtimeIntegrated: false, executablePath: null, credentialsConfigured: false },
    capabilities, integrationSurfaces: surfaces,
    allowedUses: ['documentation_only', 'offline_contract_mapping', 'read_only_research_request_planning'],
    disallowedUses: [...HERMES_AGENT_REQUIRED_DISALLOWED_USES],
    permissionRequirements: [
      { permission: 'explicit_human_approval', requiredFor: ['web_or_network', 'mcp', 'tool_calling', 'cron', 'memory'], humanApprovalRequired: true, notes: 'Future external capabilities remain denied until a bounded permit exists.' },
    ],
    risks: [
      { riskId: 'prompt-memory-injection', category: 'prompt_injection', severity: 'high', description: 'Untrusted research or context can influence agent actions and persistent knowledge.', mitigation: 'Treat sources as untrusted, isolate sessions, require citations and forbid memory writes.' },
      { riskId: 'autonomous-cron', category: 'autonomy', severity: 'critical', description: 'Scheduled unattended work can outlive an approval context.', mitigation: 'Keep cron disabled and require a future bounded permit and human review.' },
      { riskId: 'tool-shell-access', category: 'tool_execution', severity: 'critical', description: 'Tools and terminal backends can execute commands or reach host resources.', mitigation: 'Disable tool calling and code execution; use an isolated adapter sandbox in a future phase.' },
      { riskId: 'credential-network-egress', category: 'credentials', severity: 'critical', description: 'Providers, MCP servers, messaging and web tools may require secrets and network egress.', mitigation: 'Configure no credentials; deny egress and require explicit human approval per external call.' },
      { riskId: 'persistent-memory', category: 'memory_injection', severity: 'high', description: 'Persistent memory or skills can preserve incorrect or malicious content.', mitigation: 'Disable writes; promote only reviewed evidence through JEFE and canonical MEMORIA.' },
    ],
    policy: { requiresAdapter: true, adapterName: 'JefeHermesAdapter', defaultMode: 'read_only', externalCallsRequireHumanApproval: true, memoryWritesRequireHumanApproval: true, cronDisabledByDefault: true, toolCallingDisabledByDefault: true, filesystemWriteDisabledByDefault: true, repoWriteDisabledByDefault: true, codeExecutionDisabledByDefault: true, deployDisabledByDefault: true },
    nextSafeIntegrationStep: 'Define offline adapter permits, evidence envelopes and denial tests without installing or executing Hermes Agent.',
    openQuestions: ['Which stable machine-readable surface should a future adapter use?', 'How will tool and source permissions be attested per research run?', 'What isolation boundary will prevent host and repository writes?'],
  })
}
