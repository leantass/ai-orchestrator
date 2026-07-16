export type HermesAgentSurface = 'cli' | 'desktop' | 'mcp' | 'cron' | 'memory' | 'skills' | 'tool_calling' | 'messaging' | 'ide' | 'web_or_network'
export type HermesAgentCapability = `${HermesAgentSurface}_possible`
export type HermesAgentAllowedUse = 'documentation_only' | 'offline_contract_mapping' | 'read_only_research_request_planning'
export type HermesAgentDisallowedUse = 'filesystem_write' | 'repo_write' | 'autonomous_cron' | 'memory_write' | 'external_network_calls' | 'credentialed_tools' | 'code_execution' | 'deploy' | 'production_data_access' | 'customer_data_access'
export type HermesAgentIntegrationSurface = { surface: HermesAgentSurface; capability: HermesAgentCapability; detected: boolean; evidenceSourceRefs: string[]; notes: string }
export type HermesAgentPermissionRequirement = { permission: string; requiredFor: HermesAgentSurface[]; humanApprovalRequired: true; notes: string }
export type HermesAgentRisk = { riskId: string; category: 'prompt_injection' | 'memory_injection' | 'autonomy' | 'tool_execution' | 'filesystem' | 'network' | 'credentials' | 'data_boundary'; severity: 'medium' | 'high' | 'critical'; description: string; mitigation: string }

export interface HermesAgentRuntimeStatus {
  installed: false
  cloned: false
  runtimeIntegrated: false
  executablePath: null
  credentialsConfigured: false
}

export interface HermesAgentExternalToolPolicy {
  requiresAdapter: true
  adapterName: 'JefeHermesAdapter'
  defaultMode: 'read_only'
  externalCallsRequireHumanApproval: true
  memoryWritesRequireHumanApproval: true
  cronDisabledByDefault: true
  toolCallingDisabledByDefault: true
  filesystemWriteDisabledByDefault: true
  repoWriteDisabledByDefault: true
  codeExecutionDisabledByDefault: true
  deployDisabledByDefault: true
}

export interface HermesAgentExternalToolProfileV1 {
  profileKind: 'hermes-agent-external-tool-profile'
  profileVersion: '1.0'
  externalToolName: 'Hermes Agent'
  externalToolOrigin: 'external_tool'
  externalToolProvider: 'Nous Research'
  officialRepository: string
  officialDocs: string
  communityDocs?: string
  auditedAt: string
  auditSourceRefs: string[]
  runtimeStatus: HermesAgentRuntimeStatus
  capabilities: Record<HermesAgentCapability, boolean>
  integrationSurfaces: HermesAgentIntegrationSurface[]
  allowedUses: HermesAgentAllowedUse[]
  disallowedUses: HermesAgentDisallowedUse[]
  permissionRequirements: HermesAgentPermissionRequirement[]
  risks: HermesAgentRisk[]
  policy: HermesAgentExternalToolPolicy
  nextSafeIntegrationStep: string
  openQuestions: string[]
}

export interface HermesAgentProfileSummary {
  externalToolName: string
  provider: string
  runtimeStatus: HermesAgentRuntimeStatus
  allowedSurfaces: HermesAgentAllowedUse[]
  disallowedSurfaces: HermesAgentDisallowedUse[]
  risks: Array<{ category: string; severity: string; mitigation: string }>
  nextSafeIntegrationStep: string
  sourceRefs: string[]
  adapterName: string
}

export interface HermesAgentProfileValidationResult { ok: boolean; errors: string[]; warnings: string[] }
