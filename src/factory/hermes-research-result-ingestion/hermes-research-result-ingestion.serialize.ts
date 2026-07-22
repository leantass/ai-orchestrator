import type { FactoryHermesResearchResultIngestionResult, FactoryHermesResearchResultIngestionSummary } from './hermes-research-result-ingestion.types.ts'

export function serializeFactoryHermesResearchResultIngestionResult(result: FactoryHermesResearchResultIngestionResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesResearchResultIngestionResult(json: string): FactoryHermesResearchResultIngestionResult { return JSON.parse(json) as FactoryHermesResearchResultIngestionResult }
export function summarizeFactoryHermesResearchResultIngestionResult(result: FactoryHermesResearchResultIngestionResult): FactoryHermesResearchResultIngestionSummary {
  return { ingestionId: result.ingestionId, selectedCandidateId: result.selectedCandidateId, commandName: result.commandName, adapterDecision: result.adapterDecision, classification: result.classification, normalizedOutcome: result.hermesResearchResultIngestionRecord?.normalizedOutcome, canProceedToResearchJefeReview: result.canProceedToResearchJefeReview, canTreatAsResearchResult: false, canProceedToEntrypointMaterializationReview: result.canProceedToEntrypointMaterializationReview, nextStep: result.recommendedNextStep }
}
