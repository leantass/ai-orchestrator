import type { JefeHermesAdapterContractV1, JefeHermesAdapterIdentity, JefeHermesAdapterPolicy, JefeHermesResearchRequest } from './jefe-hermes-adapter.types.ts'

export const JEFE_HERMES_ADAPTER_IDENTITY: Readonly<JefeHermesAdapterIdentity> = { adapterName: 'JefeHermesAdapter', adapterVersion: '1.0', adapterKind: 'jefe-hermes-adapter-contract', externalToolName: 'Hermes Agent', externalToolOrigin: 'external_tool', externalToolProvider: 'Nous Research', integrationMode: 'read_only_adapter', runtimeIntegrated: false }
export const DEFAULT_JEFE_HERMES_ADAPTER_POLICY: Readonly<JefeHermesAdapterPolicy> = { readOnly: true, mayModifyCode: false, mayModifyRepo: false, mayApproveProject: false, mayDeploy: false, codexAllowed: false, requiresApprovalForExternalCalls: true, requiresCitationForClaims: true, requiresSourceQualityRating: true, requiresEvidenceForRecommendation: true }
export const JEFE_HERMES_MAX_QUOTE_LENGTH = 280
export const JEFE_HERMES_MAX_SUMMARY_LENGTH = 1000
export const JEFE_HERMES_ALLOWED_SOURCE_TYPES = ['search_engine_future', 'google_trends_future', 'github_future', 'reddit_future', 'app_store_future', 'play_store_future', 'product_hunt_future', 'news_future', 'public_datasets_future', 'competitor_websites_future', 'review_sites_future', 'analytics_future', 'manual_input', 'uploaded_research', 'internal_memory_reference'] as const
export const JEFE_HERMES_DISALLOWED_SOURCE_TYPES = ['private_data_without_permission', 'paid_data_without_approval', 'credentialed_accounts_without_approval', 'scraping_disallowed_sites', 'personal_sensitive_data', 'illegal_sources', 'leaked_data', 'production_customer_data_without_policy'] as const

export const JEFE_HERMES_ADAPTER_CONTRACT_V1: Readonly<JefeHermesAdapterContractV1> = { identity: JEFE_HERMES_ADAPTER_IDENTITY, policy: DEFAULT_JEFE_HERMES_ADAPTER_POLICY, purpose: 'Govern future read-only requests, evidence, reports and handoffs between JEFE and external Hermes Agent.' }
export type JefeHermesResearchRequestInput = Omit<JefeHermesResearchRequest, keyof JefeHermesAdapterIdentity | 'mode' | 'policy' | 'handoffTarget'> & { policy?: Partial<JefeHermesAdapterPolicy> }

export function createJefeHermesResearchRequestV1(input: JefeHermesResearchRequestInput): JefeHermesResearchRequest {
  return JSON.parse(JSON.stringify({ ...input, ...JEFE_HERMES_ADAPTER_IDENTITY, mode: 'read_only', policy: { ...DEFAULT_JEFE_HERMES_ADAPTER_POLICY, ...input.policy, ...DEFAULT_JEFE_HERMES_ADAPTER_POLICY }, handoffTarget: 'jefe' })) as JefeHermesResearchRequest
}
