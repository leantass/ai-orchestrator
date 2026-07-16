import { createFactoryBriefDraftPolicy, DEFAULT_FACTORY_BRIEF_DRAFT_INDEPENDENCE_POLICY, FACTORY_BRIEF_DRAFT_KIND, FACTORY_BRIEF_DRAFT_VERSION } from './factory-brief-draft.defaults.ts'
import type { FactoryBriefDraft, FactoryBriefDraftAcceptanceCriterion, FactoryBriefDraftInput, FactoryBriefDraftMonetization } from './factory-brief-draft.types.ts'

const safeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'draft'
const monetizationModel = (value: string): FactoryBriefDraftMonetization['model'] => /subscription|suscrip/iu.test(value) ? 'subscription' : /transaction|commission/iu.test(value) ? 'transaction' : /advertis|anuncio/iu.test(value) ? 'advertising' : /licen/iu.test(value) ? 'license' : /service|servicio/iu.test(value) ? 'services' : value.trim() ? 'other' : 'unknown'

export function createFactoryBriefDraftV1(input: FactoryBriefDraftInput): FactoryBriefDraft {
  const value = structuredClone(input); const signal = value.signal; const policy = createFactoryBriefDraftPolicy(value.policy)
  const criteria: FactoryBriefDraftAcceptanceCriterion[] = signal.requiredAcceptanceCriteriaDraft.map((statement, index) => ({ criterionId: `criterion-${index + 1}`, statement, status: 'preliminary', verificationMethod: 'review' }))
  const sections = [
    ['problem', 'Problem', Boolean(signal.problem.trim())], ['audience', 'Audience', Boolean(signal.audience.trim())], ['solution', 'Proposed solution', Boolean(signal.proposedSolution.trim())],
    ['monetization', 'Monetization', Boolean(signal.monetizationHypothesis.trim())], ['evidence', 'Evidence summary', Boolean(signal.evidenceSummary)], ['acceptance', 'Preliminary acceptance criteria', criteria.length > 0], ['independence', 'Product independence', true],
  ].map(([sectionId, title, complete]) => ({ sectionId: String(sectionId), title: String(title), complete: Boolean(complete), reviewNotes: [...(value.additionalReviewNotes ?? [])] }))
  const missingSections = sections.filter((section) => !section.complete).map((section) => section.sectionId)
  const blockers = [...missingSections.map((section) => `missing_${section}`)]
  const warnings = signal.monetizationHypothesis.trim() ? [] : ['Monetization hypothesis requires human definition.']
  return {
    briefDraftId: `factory-brief-draft-${safeId(signal.opportunityId)}-${value.createdAt.replace(/[^0-9]/g, '')}`, briefDraftKind: FACTORY_BRIEF_DRAFT_KIND, briefDraftVersion: FACTORY_BRIEF_DRAFT_VERSION,
    createdAt: value.createdAt, createdBy: value.createdBy, status: blockers.length > 0 ? 'blocked' : 'needs_human_review',
    source: { decisionId: value.decisionId, opportunityId: signal.opportunityId, generatedBy: 'JEFE', radarScore: value.sourceContext?.radarScore, hermesConfidence: value.sourceContext?.hermesConfidence, evidenceRefs: [...(value.sourceContext?.evidenceRefs ?? [])], decisionReasons: [...(value.sourceContext?.decisionReasons ?? [])], humanApprovalRef: value.sourceContext?.humanApprovalRef },
    opportunityId: signal.opportunityId, decisionId: value.decisionId, title: signal.title, executiveSummary: `${signal.problem.slice(0, 240)} Proposed response: ${signal.proposedSolution.slice(0, 240)}`,
    problem: { statement: signal.problem, impact: 'Impact must be confirmed during human brief review.' }, audience: { primary: signal.audience, secondary: [], excluded: [] }, proposedSolution: { summary: signal.proposedSolution, valueProposition: `Address the validated problem for ${signal.audience}.`, constraints: ['Remain independent from JEFE runtime.', 'Do not begin construction before contract and human approval.'] },
    monetization: { hypothesis: signal.monetizationHypothesis, model: monetizationModel(signal.monetizationHypothesis), validationRequired: true },
    evidenceSummary: { ...signal.evidenceSummary, summary: `Radar evidence: ${signal.evidenceSummary.radarEvidenceSufficient ? 'sufficient' : 'insufficient'}; Hermes items: ${signal.evidenceSummary.evidenceItems}; missing coverage: ${signal.evidenceSummary.missingCoverage.length}.`, evidenceRefs: [...(value.sourceContext?.evidenceRefs ?? [])] },
    risks: signal.risks.map((risk) => ({ ...risk, mitigationRequired: risk.severity !== 'low' })), assumptions: signal.assumptions.map((statement, index) => ({ assumptionId: `assumption-${index + 1}`, statement, validationStatus: 'unvalidated' })),
    openQuestions: signal.openQuestions.map((question, index) => ({ questionId: `question-${index + 1}`, question, owner: 'JEFE', blocking: false })), preliminaryAcceptanceCriteria: criteria,
    scopeBoundaries: [{ boundaryId: 'scope-independent-product', type: 'in_scope', statement: 'Define an independently runnable and deployable product.' }, { boundaryId: 'scope-no-construction', type: 'out_of_scope', statement: 'No code, repository, runtime or deployment is created by this draft.' }],
    nonGoals: ['Execute Codex or Hermes Agent.', 'Create a FactoryProjectContract.', 'Create a project or repository.', 'Deploy or publish a product.'], independencePolicy: structuredClone(DEFAULT_FACTORY_BRIEF_DRAFT_INDEPENDENCE_POLICY),
    executionPolicy: { codexExecutionAllowed: false, projectCreationAllowed: false, repositoryCreationAllowed: false, deployAllowed: false }, requiredReviews: [{ reviewId: 'jefe-structure-review', reviewer: 'JEFE', required: true, status: 'pending', purpose: 'Verify lineage, evidence and preliminary acceptance criteria.' }, { reviewId: 'human-contract-readiness', reviewer: 'human', required: true, status: 'pending', purpose: 'Approve conversion toward a FactoryProjectContract candidate.' }],
    sections, policy, readiness: { status: blockers.length > 0 ? 'not_ready_for_contract' : 'ready_for_human_review', completedSections: sections.length - missingSections.length, totalSections: sections.length, missingSections }, blockers, warnings,
    recommendedNextStep: blockers.length > 0 ? 'Resolve draft blockers and repeat JEFE review.' : 'Submit the structured brief draft for human review before any FactoryProjectContract candidate.',
  }
}
