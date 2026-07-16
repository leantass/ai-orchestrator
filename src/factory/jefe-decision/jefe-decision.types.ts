import type { JefeHermesHandoffToJefe, JefeHermesResearchReport } from '../adapters/jefe-hermes/index.ts'
import type { MarketOpportunity, RadarEvaluationResult } from '../radar/index.ts'

export type JefeDecisionGateVersion = '1.0'
export type JefeDecisionGateKind = 'jefe-opportunity-decision-gate'
export type JefeOpportunityDecisionType = 'reject_opportunity' | 'hold_opportunity' | 'request_more_research' | 'human_review_required' | 'approve_brief_draft' | 'prepare_factory_project_candidate' | 'blocked'

export interface JefeOpportunityDecisionPolicy {
  requireHermesForBrief: true
  requireHermesForProjectCandidate: true
  minimumRadarScoreForBrief: number
  minimumHermesConfidenceForBrief: number
  minimumEvidenceItemsForBrief: number
  requireDiverseSources: true
  blockOnCriticalRisk: true
  blockOnStrongContradictions: true
  requireHumanReviewForSensitiveCategories: true
  requireHumanApprovalForProjectCandidate: true
  codexSelfApprovalAllowed: false
  codexAllowedByDecisionGate: false
  projectCreationAllowedByDecisionGate: false
  deployAllowedByDecisionGate: false
}

export interface JefeHumanApprovalRequirement { required: boolean; satisfied: boolean; reason: string; approvedBy?: string; approvedAt?: string }
export interface JefeHumanApproval { approved: boolean; scope: 'project_candidate'; approvedBy: string; approvedAt: string }
export interface JefeOpportunityDecisionReason { code: string; message: string; source: 'radar' | 'hermes' | 'jefe_policy' | 'human' }
export interface JefeOpportunityDecisionRisk { riskId: string; severity: 'low' | 'medium' | 'high' | 'critical'; category: string; description: string; source: 'opportunity' | 'radar' | 'hermes' }
export interface JefeOpportunityDecisionEvidenceSummary { radarEvidenceSufficient: boolean; hermesReportPresent: boolean; hermesReportStatus?: string; evidenceItems: number; distinctSources: number; confidence?: number; requiredCoverage: string[]; satisfiedCoverage: string[]; missingCoverage: string[]; contradictions: number }

export interface JefeFactoryBriefDraftSignal {
  opportunityId: string; title: string; problem: string; audience: string; proposedSolution: string; monetizationHypothesis: string
  evidenceSummary: JefeOpportunityDecisionEvidenceSummary; risks: JefeOpportunityDecisionRisk[]; assumptions: string[]; openQuestions: string[]
  requiredAcceptanceCriteriaDraft: string[]; nextStep: 'draft_factory_brief'
}

export interface JefeFactoryProjectCandidateSignal {
  opportunityId: string; candidateSlugSuggestion: string; candidateName: string; contractReadiness: 'candidate_only'
  repositoryRequired: true; runtimeIndependenceRequired: true; requiresFactoryProjectContract: true; requiresHumanApprovalBeforeCodex: true
  humanApprovalReference: string; nextStep: 'create_factory_project_contract_candidate'
}

export interface JefeOpportunityDecisionInput {
  opportunity: MarketOpportunity
  radarEvaluation: RadarEvaluationResult
  hermesReport?: JefeHermesResearchReport
  hermesHandoff?: JefeHermesHandoffToJefe
  createdAt: string
  decidedBy: string
  humanApproval?: JefeHumanApproval
  policy?: Partial<JefeOpportunityDecisionPolicy>
}

export interface JefeOpportunityDecisionResult {
  decisionId: string; decisionKind: JefeDecisionGateKind; decisionVersion: JefeDecisionGateVersion; createdAt: string; opportunityId: string
  radarScore: number; hermesConfidence?: number; decision: JefeOpportunityDecisionType; reasons: JefeOpportunityDecisionReason[]
  risks: JefeOpportunityDecisionRisk[]; blockers: string[]; warnings: string[]; evidenceSummary: JefeOpportunityDecisionEvidenceSummary
  requiredHumanReview: JefeHumanApprovalRequirement; briefDraftSignal?: JefeFactoryBriefDraftSignal; projectCandidateSignal?: JefeFactoryProjectCandidateSignal
  appliedPolicy: JefeOpportunityDecisionPolicy; recommendedNextStep: string; codexAllowed: false; projectCreationAllowed: false; deployAllowed: false
}

export interface JefeDecisionValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface JefeOpportunityDecisionSummary { opportunityId: string; radarScore: number; hermesConfidence?: number; decision: JefeOpportunityDecisionType; topReasons: string[]; blockers: string[]; risks: Array<{ severity: string; category: string; description: string }>; requiredHumanReview: boolean; nextStep: string; hasBriefDraftSignal: boolean; hasProjectCandidateSignal: boolean }
