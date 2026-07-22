import type { FactoryHermesEntrypointMaterializationJefeReviewResult, FactoryHermesEntrypointMaterializationJefeReviewSummary } from './hermes-entrypoint-materialization-jefe-review.types.ts'

export function serializeFactoryHermesEntrypointMaterializationJefeReviewResult(result: FactoryHermesEntrypointMaterializationJefeReviewResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesEntrypointMaterializationJefeReviewResult(json: string): FactoryHermesEntrypointMaterializationJefeReviewResult {
  return JSON.parse(json) as FactoryHermesEntrypointMaterializationJefeReviewResult
}

export function summarizeFactoryHermesEntrypointMaterializationJefeReviewResult(result: FactoryHermesEntrypointMaterializationJefeReviewResult): FactoryHermesEntrypointMaterializationJefeReviewSummary {
  return {
    jefeReviewId: result.jefeReviewId,
    toolId: result.toolId,
    selectedCandidateId: result.selectedCandidateId,
    commandName: result.commandName,
    runtimeDecision: result.runtimeDecision,
    classification: result.classification,
    normalizedOutcome: result.normalizedOutcome,
    missingBuildDependency: result.missingBuildDependency,
    status: result.status,
    decision: result.decision,
    canProceedToBuildDependencyCachePlanning: result.canProceedToBuildDependencyCachePlanning,
    canCacheBuildDependenciesNow: false,
    canEnableNetworkNow: false,
    nextStep: result.recommendedNextStep,
  }
}
