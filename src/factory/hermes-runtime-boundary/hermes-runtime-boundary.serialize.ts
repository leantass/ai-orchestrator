import type {
  FactoryHermesRuntimeBoundaryResult,
  FactoryHermesRuntimeBoundarySummary,
} from './hermes-runtime-boundary.types.ts';

export function serializeFactoryHermesRuntimeBoundaryResult(result: FactoryHermesRuntimeBoundaryResult): string {
  return JSON.stringify(result, null, 2);
}

export function parseFactoryHermesRuntimeBoundaryResult(json: string): FactoryHermesRuntimeBoundaryResult {
  return JSON.parse(json) as FactoryHermesRuntimeBoundaryResult;
}

export function summarizeFactoryHermesRuntimeBoundaryResult(
  result: FactoryHermesRuntimeBoundaryResult,
): FactoryHermesRuntimeBoundarySummary {
  return {
    boundaryId: result.boundaryContract?.boundaryId,
    auditedHead: result.boundaryContract?.auditedHead,
    remoteHead: result.boundaryContract?.remoteHead,
    headsMatch: result.boundaryContract?.headsMatch,
    decision: result.decision,
    status: result.status,
    installAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    networkAllowedByDefault: false,
    canExecuteHermes: false,
    nextStep: result.recommendedNextStep,
  };
}
