import type { FactoryBriefDraft, FactoryBriefDraftSummary } from './factory-brief-draft.types.ts'

export function serializeFactoryBriefDraft(draft: FactoryBriefDraft): string { return JSON.stringify(draft, null, 2) }
export function parseFactoryBriefDraft(json: string): FactoryBriefDraft { return JSON.parse(json) as FactoryBriefDraft }
export function summarizeFactoryBriefDraft(draft: FactoryBriefDraft): FactoryBriefDraftSummary {
  return { briefDraftId: draft.briefDraftId, opportunityId: draft.opportunityId, title: draft.title.slice(0, 160), problem: draft.problem.statement.slice(0, 240), audience: draft.audience.primary.slice(0, 180), monetizationSummary: draft.monetization.hypothesis.slice(0, 200), topRisks: draft.risks.slice(0, 5).map((risk) => ({ severity: risk.severity, category: risk.category, description: risk.description.slice(0, 180) })), openQuestionsCount: draft.openQuestions.length, acceptanceCriteriaCount: draft.preliminaryAcceptanceCriteria.length, readiness: draft.readiness.status, recommendedNextStep: draft.recommendedNextStep.slice(0, 240) }
}
