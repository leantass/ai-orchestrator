import type { JefeFactoryBriefDraftSignal, JefeOpportunityDecisionEvidenceSummary, JefeOpportunityDecisionRisk } from '../jefe-decision/index.ts'

export type FactoryBriefDraftVersion = '1.0'
export type FactoryBriefDraftKind = 'factory-brief-draft'
export type FactoryBriefDraftStatus = 'draft' | 'needs_human_review' | 'approved_for_contract_candidate' | 'blocked'
export interface FactoryBriefDraftSource { decisionId: string; opportunityId: string; generatedBy: 'JEFE'; radarScore?: number; hermesConfidence?: number; evidenceRefs: string[]; decisionReasons: string[]; humanApprovalRef?: string }
export interface FactoryBriefDraftPolicy { requireOpportunityId: true; requireDecisionId: true; requireProblem: true; requireAudience: true; requireProposedSolution: true; requireMonetizationHypothesis: true; requireEvidenceSummary: true; requireAcceptanceCriteria: true; requireScopeBoundaries: true; requireRuntimeIndependencePolicy: true; forbidCodexExecution: true; forbidProjectCreation: true; forbidRepositoryCreation: true; forbidDeploy: true; requireHumanReviewBeforeContract: true }
export interface FactoryBriefDraftSection { sectionId: string; title: string; complete: boolean; reviewNotes: string[] }
export interface FactoryBriefDraftProblem { statement: string; impact: string }
export interface FactoryBriefDraftAudience { primary: string; secondary: string[]; excluded: string[] }
export interface FactoryBriefDraftSolution { summary: string; valueProposition: string; constraints: string[] }
export interface FactoryBriefDraftMonetization { hypothesis: string; model: 'unknown' | 'subscription' | 'transaction' | 'advertising' | 'license' | 'services' | 'other'; validationRequired: true }
export interface FactoryBriefDraftEvidenceSummary extends JefeOpportunityDecisionEvidenceSummary { summary: string; evidenceRefs: string[] }
export interface FactoryBriefDraftRisk extends JefeOpportunityDecisionRisk { mitigationRequired: boolean }
export interface FactoryBriefDraftAssumption { assumptionId: string; statement: string; validationStatus: 'unvalidated' }
export interface FactoryBriefDraftOpenQuestion { questionId: string; question: string; owner: 'JEFE' | 'human_reviewer'; blocking: boolean }
export interface FactoryBriefDraftAcceptanceCriterion { criterionId: string; statement: string; status: 'preliminary'; verificationMethod: 'review' | 'test_future' | 'evidence_future' }
export interface FactoryBriefDraftScopeBoundary { boundaryId: string; type: 'in_scope' | 'out_of_scope'; statement: string }
export interface FactoryBriefDraftIndependencePolicy { generatedProductMustBeIndependent: true; mustHaveOwnRoot: true; mustHaveOwnRepository: true; mustNotDependOnJefeRuntime: true; mustNotImportJefeModules: true; traceabilityOnly: true; requiresFactoryProjectContractBeforeCodex: true; requiresHumanApprovalBeforeCodex: true }
export interface FactoryBriefDraftReviewRequirement { reviewId: string; reviewer: 'JEFE' | 'human'; required: true; status: 'pending'; purpose: string }
export interface FactoryBriefDraftExecutionPolicy { codexExecutionAllowed: false; projectCreationAllowed: false; repositoryCreationAllowed: false; deployAllowed: false }
export interface FactoryBriefDraftReadiness { status: 'not_ready_for_contract' | 'ready_for_human_review'; completedSections: number; totalSections: number; missingSections: string[] }

export interface FactoryBriefDraftInput {
  signal: JefeFactoryBriefDraftSignal
  decisionId: string
  createdAt: string
  createdBy: string
  sourceContext?: { radarScore?: number; hermesConfidence?: number; evidenceRefs?: string[]; decisionReasons?: string[]; humanApprovalRef?: string }
  policy?: Partial<FactoryBriefDraftPolicy>
  additionalReviewNotes?: string[]
}

export interface FactoryBriefDraft {
  briefDraftId: string; briefDraftKind: FactoryBriefDraftKind; briefDraftVersion: FactoryBriefDraftVersion; createdAt: string; createdBy: string; status: FactoryBriefDraftStatus
  source: FactoryBriefDraftSource; opportunityId: string; decisionId: string; title: string; executiveSummary: string
  problem: FactoryBriefDraftProblem; audience: FactoryBriefDraftAudience; proposedSolution: FactoryBriefDraftSolution; monetization: FactoryBriefDraftMonetization
  evidenceSummary: FactoryBriefDraftEvidenceSummary; risks: FactoryBriefDraftRisk[]; assumptions: FactoryBriefDraftAssumption[]; openQuestions: FactoryBriefDraftOpenQuestion[]
  preliminaryAcceptanceCriteria: FactoryBriefDraftAcceptanceCriterion[]; scopeBoundaries: FactoryBriefDraftScopeBoundary[]; nonGoals: string[]
  independencePolicy: FactoryBriefDraftIndependencePolicy; executionPolicy: FactoryBriefDraftExecutionPolicy; requiredReviews: FactoryBriefDraftReviewRequirement[]
  sections: FactoryBriefDraftSection[]; policy: FactoryBriefDraftPolicy; readiness: FactoryBriefDraftReadiness; blockers: string[]; warnings: string[]; recommendedNextStep: string
}

export interface FactoryBriefDraftValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryBriefDraftSummary { briefDraftId: string; opportunityId: string; title: string; problem: string; audience: string; monetizationSummary: string; topRisks: Array<{ severity: string; category: string; description: string }>; openQuestionsCount: number; acceptanceCriteriaCount: number; readiness: FactoryBriefDraftReadiness['status']; recommendedNextStep: string }
