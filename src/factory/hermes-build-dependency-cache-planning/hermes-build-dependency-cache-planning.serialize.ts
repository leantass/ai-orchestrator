import type { FactoryHermesBuildDependencyCachePlanningResult, FactoryHermesBuildDependencyCachePlanningSummary } from './hermes-build-dependency-cache-planning.types.ts'

export function serializeFactoryHermesBuildDependencyCachePlanningResult(result: FactoryHermesBuildDependencyCachePlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesBuildDependencyCachePlanningResult(json: string): FactoryHermesBuildDependencyCachePlanningResult {
  return JSON.parse(json) as FactoryHermesBuildDependencyCachePlanningResult
}

export function summarizeFactoryHermesBuildDependencyCachePlanningResult(result: FactoryHermesBuildDependencyCachePlanningResult): FactoryHermesBuildDependencyCachePlanningSummary {
  return { planningId: result.planningId, missingBuildDependency: result.missingBuildDependency, selectedMethodCandidate: result.selectedMethodCandidate, status: result.status, decision: result.decision, canProceedToBuildDependencyCacheApproval: result.canProceedToBuildDependencyCacheApproval, canCacheBuildDependenciesNow: false, canEnableNetworkNow: false, canRetryMaterializationNow: false, nextStep: result.recommendedNextStep }
}
