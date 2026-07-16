import type { RadarToHermesHandoffPolicy } from './radar-to-hermes.types.ts'

export const RADAR_TO_HERMES_HANDOFF_KIND = 'radar-to-jefe-hermes-adapter-handoff' as const
export const RADAR_TO_HERMES_HANDOFF_VERSION = '1.0' as const
export const DEFAULT_RADAR_TO_HERMES_HANDOFF_POLICY: Readonly<RadarToHermesHandoffPolicy> = {
  onlyAllowResearchWhenRadarDecisionIsResearchWithHermes: true,
  allowDraftFactoryBriefToSkipHermes: false,
  requireHumanReviewForSensitiveCategories: true,
  requireAtLeastOneOpenQuestion: true,
  requireMarketProblem: true,
  requireAudience: true,
  requireMonetizationHypothesisOrWarning: true,
  forceReadOnlyAdapter: true,
  forbidCodexAccess: true,
  forbidDirectProjectCreation: true,
  forbidRuntimeExecution: true,
}

export const RADAR_TO_HERMES_MINIMUM_QUESTIONS = ['demand', 'competitors', 'pricing', 'reviews', 'trends', 'monetization', 'risks', 'differentiation', 'distribution'] as const
export const RADAR_TO_HERMES_ALLOWED_SOURCES = ['manual_input', 'uploaded_research', 'internal_memory_reference', 'search_engine_future', 'google_trends_future', 'github_future', 'reddit_future', 'news_future', 'competitor_websites_future', 'review_sites_future', 'public_datasets_future'] as const
export const RADAR_TO_HERMES_DISALLOWED_SOURCES = ['private_data_without_permission', 'paid_data_without_approval', 'credentialed_accounts_without_approval', 'scraping_disallowed_sites', 'personal_sensitive_data', 'illegal_sources', 'leaked_data', 'production_customer_data_without_policy'] as const
