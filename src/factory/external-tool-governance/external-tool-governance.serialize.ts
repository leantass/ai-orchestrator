import type { FactoryExternalToolGovernanceSummary, FactoryExternalToolRegistry } from './external-tool-governance.types.ts'

export function serializeFactoryExternalToolRegistry(registry: FactoryExternalToolRegistry): string { return JSON.stringify(registry, null, 2) }
export function parseFactoryExternalToolRegistry(json: string): FactoryExternalToolRegistry { return JSON.parse(json) as FactoryExternalToolRegistry }
export function summarizeFactoryExternalToolRegistry(registry: FactoryExternalToolRegistry): FactoryExternalToolGovernanceSummary { const byLifecycle: Record<string, number> = {}; for (const tool of registry.tools) byLifecycle[tool.lifecycleStatus] = (byLifecycle[tool.lifecycleStatus] ?? 0) + 1; return { registryKind: registry.registryKind, registryVersion: registry.registryVersion, toolCount: registry.tools.length, byLifecycle, executionEnabledCount: registry.tools.filter((tool) => tool.executionAllowedNow).length, installEnabledCount: registry.tools.filter((tool) => tool.installAllowedNow).length, credentialsEnabledCount: registry.tools.filter((tool) => tool.credentialsAllowedNow).length, recommendedNextStep: registry.recommendedNextStep } }

