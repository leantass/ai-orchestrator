import type { HermesAgentExternalToolProfileV1, HermesAgentProfileSummary } from './hermes-agent-profile.types.ts'

export function serializeHermesAgentExternalToolProfileV1(profile: HermesAgentExternalToolProfileV1): string { return JSON.stringify(profile, null, 2) }
export function parseHermesAgentExternalToolProfileV1(json: string): HermesAgentExternalToolProfileV1 { return JSON.parse(json) as HermesAgentExternalToolProfileV1 }
export function summarizeHermesAgentExternalToolProfileV1(profile: HermesAgentExternalToolProfileV1): HermesAgentProfileSummary {
  return {
    externalToolName: profile.externalToolName, provider: profile.externalToolProvider, runtimeStatus: structuredClone(profile.runtimeStatus),
    allowedSurfaces: [...profile.allowedUses], disallowedSurfaces: [...profile.disallowedUses],
    risks: profile.risks.map(({ category, severity, mitigation }) => ({ category, severity, mitigation: mitigation.slice(0, 240) })),
    nextSafeIntegrationStep: profile.nextSafeIntegrationStep.slice(0, 300), sourceRefs: [...profile.auditSourceRefs], adapterName: profile.policy.adapterName,
  }
}
