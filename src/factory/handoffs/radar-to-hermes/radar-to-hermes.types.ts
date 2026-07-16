import type { JefeHermesResearchQuestion, JefeHermesResearchRequest } from '../../adapters/jefe-hermes/index.ts'
import type { MarketOpportunity, RadarDecisionType, RadarEvaluationResult } from '../../radar/index.ts'

export type RadarToHermesHandoffVersion = '1.0'
export type RadarToHermesHandoffKind = 'radar-to-jefe-hermes-adapter-handoff'
export type RadarToHermesBlockedReason = 'opportunity_rejected_by_radar' | 'opportunity_on_hold' | 'human_review_required_before_research' | 'draft_factory_brief_requires_research_policy_review' | 'radar_decision_not_eligible' | 'sensitive_category_requires_human_approval' | 'invalid_handoff_input'

export interface RadarToHermesHandoffPolicy {
  onlyAllowResearchWhenRadarDecisionIsResearchWithHermes: true
  allowDraftFactoryBriefToSkipHermes: false
  requireHumanReviewForSensitiveCategories: true
  requireAtLeastOneOpenQuestion: true
  requireMarketProblem: true
  requireAudience: true
  requireMonetizationHypothesisOrWarning: true
  forceReadOnlyAdapter: true
  forbidCodexAccess: true
  forbidDirectProjectCreation: true
  forbidRuntimeExecution: true
}

export interface RadarToHermesResearchQuestionMapping {
  source: 'required_baseline' | 'open_question' | 'opportunity_hypothesis'
  sourceText: string
  targetQuestion: JefeHermesResearchQuestion
}

export interface RadarToHermesSourcePolicyMapping {
  allowedSources: JefeHermesResearchRequest['allowedSources']
  disallowedSources: JefeHermesResearchRequest['disallowedSources']
}

export interface RadarToHermesHandoffInput {
  opportunity: MarketOpportunity
  evaluation: RadarEvaluationResult
  evaluationId?: string
  createdAt: string
  requestedBy: string
  sensitiveResearchApprovedByHuman?: boolean
}

export interface RadarToHermesHandoffResult {
  handoffId: string
  handoffKind: RadarToHermesHandoffKind
  handoffVersion: RadarToHermesHandoffVersion
  createdAt: string
  opportunityId: string
  radarEvaluationId?: string
  radarDecision: RadarDecisionType
  radarScore: number
  sourceOpportunitySummary: string
  targetAdapterName: 'JefeHermesAdapter'
  targetExternalToolName: 'Hermes Agent'
  targetMode: 'read_only_adapter'
  researchRequest?: JefeHermesResearchRequest
  questionMappings: RadarToHermesResearchQuestionMapping[]
  sourcePolicyMapping: RadarToHermesSourcePolicyMapping
  requestCreated: boolean
  requiredHumanReview: boolean
  codexAllowed: false
  directProjectCreationAllowed: false
  runtimeExecutionAllowed: false
  mappingWarnings: string[]
  mappingRisks: string[]
  blockedReason?: RadarToHermesBlockedReason
  recommendedNextStep: string
}

export interface RadarToHermesHandoffSummary {
  opportunityId: string
  radarDecision: RadarDecisionType
  radarScore: number
  targetAdapterName: 'JefeHermesAdapter'
  requestCreated: boolean
  researchQuestions: string[]
  blockedReason?: RadarToHermesBlockedReason
  warnings: string[]
  risks: string[]
  recommendedNextStep: string
}

export interface RadarToHermesValidationResult { ok: boolean; errors: string[]; warnings: string[] }
