import type { FactoryArchitectureBlueprintSummary, FactoryArchitectureBlueprintV1 } from './factory-architecture-blueprint.types.ts'

export function serializeFactoryArchitectureBlueprintV1(blueprint: FactoryArchitectureBlueprintV1): string { return JSON.stringify(blueprint, null, 2) }
export function parseFactoryArchitectureBlueprintV1(json: string): unknown { return JSON.parse(json) as unknown }
export function summarizeFactoryArchitectureBlueprintV1(blueprint: FactoryArchitectureBlueprintV1): FactoryArchitectureBlueprintSummary {
  const names = (status: string) => blueprint.tools.filter((tool) => tool.status === status).map((tool) => tool.name)
  const origins = [...blueprint.tools, ...blueprint.components]
  const originCounts = Object.fromEntries(['internal_module', 'external_tool', 'adapter', 'contract', 'workflow_gate', 'external_platform', 'external_standard', 'generated_project_component', 'service_future'].map((origin) => [origin, origins.filter((item) => item.origin === origin).length])) as FactoryArchitectureBlueprintSummary['originCounts']
  return {
    blueprintVersion: blueprint.blueprintVersion,
    layerCount: blueprint.layers.length,
    approvedTools: names('approved'), conditionalTools: names('conditional'), rejectedTools: names('rejected'),
    nextTopDownSteps: blueprint.implementationPhases.slice(0, 3).map((phase) => phase.name),
    primaryRisks: blueprint.risks.filter((risk) => risk.severity !== 'low').map((risk) => risk.description),
    expectedCost: blueprint.economics.expectedCost,
    primaryGates: blueprint.gates.slice(0, 5).map((gate) => gate.gateId),
    originCounts,
    toolsRequiringAdapter: blueprint.tools.filter((tool) => tool.adapterRequired).map((tool) => tool.name),
    nextAdaptersToDefine: blueprint.components.filter((component) => component.origin === 'adapter' && !component.runtimeIntegrated).map((component) => component.name),
    correctionLoopEnabled: blueprint.correctionLoop.policy.correctionLoopRequiredBeforeRelease,
    maxCorrectionRoundsDefault: blueprint.correctionLoop.policy.maxCorrectionRoundsDefault,
    releaseRequiresJefeReview: blueprint.correctionLoop.policy.releaseReadinessRequiresJefeApproval,
  }
}
