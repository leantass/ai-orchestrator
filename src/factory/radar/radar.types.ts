export type RadarVersion = '1.0'
export type RadarRating = 0 | 1 | 2 | 3 | 4 | 5

export type RadarSignalSource =
  | 'manual'
  | 'google_trends_future'
  | 'github_future'
  | 'reddit_future'
  | 'social_future'
  | 'news_future'
  | 'analytics_future'
  | 'customer_feedback_future'
  | 'hermes_future'
  | 'imported_dataset_future'

export type RadarSignalType =
  | 'trend'
  | 'repeated_problem'
  | 'search_demand'
  | 'social_conversation'
  | 'economic_signal'
  | 'regulatory_change'
  | 'viral_product'
  | 'common_complaint'
  | 'local_opportunity'
  | 'price_signal'
  | 'competitor_signal'
  | 'emerging_niche'
  | 'user_request'
  | 'analytics_signal'
  | 'manual_observation'

export type RadarSignalStrength = 'weak' | 'moderate' | 'strong' | 'critical'

export interface MarketOpportunityEvidence {
  evidenceId: string
  summary: string
  source: RadarSignalSource
  confidence: number
  stance: 'supports' | 'contradicts' | 'neutral'
  capturedAt: string
  reference?: string
}

export interface RadarSignal {
  radarVersion: RadarVersion
  id: string
  type: RadarSignalType
  source: RadarSignalSource
  title: string
  summary: string
  capturedAt: string
  strength: RadarSignalStrength
  geography?: string
  language?: string
  audienceHint?: string
  categoryHint?: string
  evidence?: MarketOpportunityEvidence[]
  url?: string
  tags: string[]
  confidence: number
  risks: string[]
  notes: string[]
}

export type MarketOpportunityStatus =
  | 'captured'
  | 'scored'
  | 'needs_research'
  | 'researching'
  | 'ready_for_brief'
  | 'rejected'
  | 'archived'
  | 'needs_human_review'

export type MarketOpportunityCategory =
  | 'consumer_app'
  | 'b2b_tool'
  | 'local_business'
  | 'marketplace'
  | 'ai_workflow'
  | 'education'
  | 'content_tool'
  | 'ecommerce'
  | 'productivity'
  | 'finance'
  | 'health_sensitive'
  | 'legal_sensitive'
  | 'developer_tool'
  | 'entertainment'
  | 'other'

export interface MarketOpportunityRisk {
  riskId: string
  type: 'market' | 'operational' | 'legal' | 'privacy' | 'security' | 'financial' | 'evidence'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation?: string
}

export interface MarketOpportunity {
  radarVersion: RadarVersion
  id: string
  title: string
  description: string
  problem: string
  audience: string
  category: MarketOpportunityCategory
  status: MarketOpportunityStatus
  signals: RadarSignal[]
  proposedSolution: string
  monetizationHypothesis: string
  demandHypothesis: string
  competitorHypothesis: string
  buildComplexity: RadarRating
  operationalCost: RadarRating
  legalSensitivity: RadarRating
  urgency: RadarRating
  frequency: RadarRating
  willingnessToPay: RadarRating
  differentiationPotential: RadarRating
  viralPotential: RadarRating
  reusableLearningPotential: RadarRating
  evidence: MarketOpportunityEvidence[]
  assumptions: string[]
  openQuestions: string[]
  risks: MarketOpportunityRisk[]
  createdAt: string
  updatedAt?: string
}

export interface OpportunityScoreBreakdown {
  demand: number
  urgency: number
  frequency: number
  willingnessToPay: number
  monetizationClarity: number
  buildEase: number
  differentiation: number
  viralPotential: number
  reusableLearning: number
  signalQuality: number
  competitionPenalty: number
  operationalCostPenalty: number
  legalSensitivityPenalty: number
  rawTotal: number
}

export interface OpportunityScore {
  total: number
  breakdown: OpportunityScoreBreakdown
}

export type RadarDecisionType =
  | 'reject'
  | 'hold'
  | 'research_with_hermes'
  | 'draft_factory_brief'
  | 'needs_human_review'

export interface RadarDecision {
  type: RadarDecisionType
  reasons: string[]
  recommendedNextStep: string
  humanApprovalRequired: boolean
}

export interface RadarEvaluationInput {
  opportunity: MarketOpportunity
  evaluatedAt: string
}

export interface RadarEvaluationResult {
  radarVersion: RadarVersion
  opportunityId: string
  title: string
  evaluatedAt: string
  score: OpportunityScore
  decision: RadarDecision
  reasons: string[]
  warnings: string[]
  risks: MarketOpportunityRisk[]
  evidenceSufficient: boolean
  contradictoryEvidence: boolean
  recommendedNextStep: string
}

export interface RadarValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface RadarEvaluationSummary {
  opportunityId: string
  title: string
  score: number
  decision: RadarDecisionType
  topReasons: string[]
  risks: Array<{ type: string; severity: string; description: string }>
  recommendedNextStep: string
}
