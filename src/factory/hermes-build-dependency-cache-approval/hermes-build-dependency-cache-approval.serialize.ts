import type { FactoryHermesBuildDependencyCacheApprovalResult, FactoryHermesBuildDependencyCacheApprovalSummary } from './hermes-build-dependency-cache-approval.types.ts'

export function serializeFactoryHermesBuildDependencyCacheApprovalResult(result: FactoryHermesBuildDependencyCacheApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesBuildDependencyCacheApprovalResult(json: string): FactoryHermesBuildDependencyCacheApprovalResult { return JSON.parse(json) as FactoryHermesBuildDependencyCacheApprovalResult }
export function summarizeFactoryHermesBuildDependencyCacheApprovalResult(result: FactoryHermesBuildDependencyCacheApprovalResult): FactoryHermesBuildDependencyCacheApprovalSummary {
  return { approvalId: result.approvalId, missingBuildDependency: result.missingBuildDependency, lockedPackageVersion: result.lockedPackageVersion, selectedMethodCandidate: result.selectedMethodCandidate, status: result.status, decision: result.decision, canProceedToBuildDependencyCacheRuntime: result.canProceedToBuildDependencyCacheRuntime, canCacheBuildDependenciesNow: false, canUseNetworkNow: false, canUseNetworkInFutureRuntime: result.canUseNetworkInFutureRuntime, nextStep: result.recommendedNextStep }
}
