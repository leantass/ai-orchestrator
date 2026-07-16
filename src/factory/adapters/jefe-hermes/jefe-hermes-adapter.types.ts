export type JefeHermesAdapterVersion = '1.0'
export type JefeHermesAdapterKind = 'jefe-hermes-adapter-contract'
export type JefeHermesResearchQuestion = 'demand' | 'competitors' | 'pricing' | 'reviews' | 'trends' | 'monetization' | 'risks' | 'regulations' | 'distribution' | 'acquisition' | 'retention' | 'technical_feasibility' | 'differentiation'
export type JefeHermesAllowedSourceType = 'search_engine_future' | 'google_trends_future' | 'github_future' | 'reddit_future' | 'app_store_future' | 'play_store_future' | 'product_hunt_future' | 'news_future' | 'public_datasets_future' | 'competitor_websites_future' | 'review_sites_future' | 'analytics_future' | 'manual_input' | 'uploaded_research' | 'internal_memory_reference'
export type JefeHermesDisallowedSourceType = 'private_data_without_permission' | 'paid_data_without_approval' | 'credentialed_accounts_without_approval' | 'scraping_disallowed_sites' | 'personal_sensitive_data' | 'illegal_sources' | 'leaked_data' | 'production_customer_data_without_policy'

export interface JefeHermesAdapterIdentity {
  adapterName: 'JefeHermesAdapter'
  adapterVersion: JefeHermesAdapterVersion
  adapterKind: JefeHermesAdapterKind
  externalToolName: 'Hermes Agent'
  externalToolOrigin: 'external_tool'
  externalToolProvider: 'Nous Research'
  integrationMode: 'read_only_adapter'
  runtimeIntegrated: false
}

export interface JefeHermesAdapterPolicy {
  readOnly: true
  mayModifyCode: false
  mayModifyRepo: false
  mayApproveProject: false
  mayDeploy: false
  codexAllowed: false
  requiresApprovalForExternalCalls: true
  requiresCitationForClaims: true
  requiresSourceQualityRating: true
  requiresEvidenceForRecommendation: true
}

export interface JefeHermesResearchScope { includedQuestions: JefeHermesResearchQuestion[]; excludedTopics: string[]; maximumSources: number; allowPersonalData: false; allowCredentialedSources: false }
export interface JefeHermesResearchRequest extends JefeHermesAdapterIdentity {
  requestId: string; opportunityId: string; source: 'radar' | 'jefe'; createdAt: string; requestedBy: string
  mode: 'read_only'; title: string; opportunitySummary: string; targetAudience: string; geography: string[]; language: string[]; category: string
  researchQuestions: JefeHermesResearchQuestion[]; scope: JefeHermesResearchScope
  allowedSources: JefeHermesAllowedSourceType[]; disallowedSources: JefeHermesDisallowedSourceType[]
  policy: JefeHermesAdapterPolicy; budgetPolicy: string; timeboxPolicy: string; sensitiveTopicPolicy: string; requiredEvidence: string[]; handoffTarget: 'jefe'
}

export type JefeHermesEvidenceKind = 'demand' | 'competitor' | 'pricing' | 'review' | 'trend' | 'monetization' | 'risk' | 'regulation' | 'distribution' | 'technical'
export type JefeHermesEvidenceQuality = 'high' | 'medium' | 'low' | 'unknown'
export interface JefeHermesEvidenceItem {
  evidenceId: string; kind: JefeHermesEvidenceKind; sourceType: JefeHermesAllowedSourceType; sourceName: string; title: string; summary: string; capturedAt: string
  url?: string; quote?: string; metric?: { name: string; value: number; unit?: string }; geography?: string; language?: string
  stance: 'supporting' | 'contradicting' | 'neutral' | 'unclear'; confidence: number; freshness: 'current' | 'recent' | 'stale' | 'unknown'
  sourceQuality: JefeHermesEvidenceQuality; relevance: 'high' | 'medium' | 'low'; riskFlags: string[]; notes: string[]
}

export interface JefeHermesCompetitorSnapshot { name: string; positioning: string; strengths: string[]; weaknesses: string[]; sourceEvidenceIds: string[] }
export interface JefeHermesPricingSignal { model: string; priceDescription: string; confidence: number; sourceEvidenceIds: string[] }
export interface JefeHermesDemandSignal { summary: string; strength: 'low' | 'medium' | 'high' | 'unknown'; sourceEvidenceIds: string[] }
export interface JefeHermesReviewSignal { theme: string; sentiment: 'positive' | 'mixed' | 'negative'; sourceEvidenceIds: string[] }
export interface JefeHermesTrendSignal { summary: string; direction: 'growing' | 'stable' | 'declining' | 'unknown'; sourceEvidenceIds: string[] }
export interface JefeHermesRiskFinding { riskId: string; severity: 'low' | 'medium' | 'high' | 'critical'; category: string; description: string; sourceEvidenceIds: string[] }
export interface JefeHermesMonetizationFinding { model: string; viability: 'low' | 'medium' | 'high' | 'unknown'; rationale: string; sourceEvidenceIds: string[] }

export interface JefeHermesResearchConfidence { score: number; level: JefeHermesEvidenceQuality; sourceCount: number; distinctSourceCount: number; qualityScore: number; freshnessScore: number; relevanceScore: number; contradictionPenalty: number; coverageRatio: number }
export interface JefeHermesEvidenceScoringResult { confidence: JefeHermesResearchConfidence; evidenceSufficient: boolean; warnings: string[]; risks: string[]; requiredCoverage: JefeHermesResearchQuestion[]; satisfiedCoverage: JefeHermesResearchQuestion[]; missingCoverage: JefeHermesResearchQuestion[]; suggestedNextAction: 'needs_more_sources' | 'human_review_required' | 'ready_for_jefe_review' }
export type JefeHermesDecisionRecommendation = 'reject' | 'hold' | 'request_more_research' | 'convert_to_factory_brief' | 'human_review_required'

export interface JefeHermesHandoffToJefe extends JefeHermesAdapterIdentity {
  handoffId: string; reportId: string; opportunityId: string; target: 'jefe'; createdAt: string
  decisionRecommendation: JefeHermesDecisionRecommendation; evidenceSummary: string; confidence: JefeHermesResearchConfidence
  topFindings: string[]; risks: JefeHermesRiskFinding[]; requiredCoverage: JefeHermesResearchQuestion[]; satisfiedCoverage: JefeHermesResearchQuestion[]; missingCoverage: JefeHermesResearchQuestion[]
  requiredHumanReview: boolean; codexAllowed: false; recommendedNextStep: string
}

export interface JefeHermesResearchReport extends JefeHermesAdapterIdentity {
  reportId: string; requestId: string; opportunityId: string; createdAt: string
  status: 'draft' | 'completed' | 'blocked' | 'needs_more_sources' | 'rejected_by_policy'; executiveSummary: string
  demandFindings: JefeHermesDemandSignal[]; competitorFindings: JefeHermesCompetitorSnapshot[]; pricingFindings: JefeHermesPricingSignal[]
  reviewFindings: JefeHermesReviewSignal[]; trendFindings: JefeHermesTrendSignal[]; monetizationFindings: JefeHermesMonetizationFinding[]; riskFindings: JefeHermesRiskFinding[]
  evidence: JefeHermesEvidenceItem[]; confidence: JefeHermesResearchConfidence; contradictions: string[]; openQuestions: string[]
  recommendedDecisionForJefe: JefeHermesDecisionRecommendation; handoffToJefe?: JefeHermesHandoffToJefe; limitations: string[]
  requiredCoverage: JefeHermesResearchQuestion[]; satisfiedCoverage: JefeHermesResearchQuestion[]; costEstimate: string; tokensUsed?: number
}

export interface JefeHermesResearchReportSummary { reportId: string; opportunityId: string; confidence: JefeHermesResearchConfidence; recommendation: JefeHermesDecisionRecommendation; topFindings: string[]; risks: Array<{ severity: string; category: string; description: string }>; missingCoverage: JefeHermesResearchQuestion[]; nextAction: string }
export interface JefeHermesValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface JefeHermesAdapterContractV1 { identity: JefeHermesAdapterIdentity; policy: JefeHermesAdapterPolicy; purpose: string }
