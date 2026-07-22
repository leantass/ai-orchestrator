import type { FactoryExternalToolCategory, FactoryExternalToolGovernanceKind, FactoryExternalToolGovernanceVersion, FactoryExternalToolOrigin, FactoryExternalToolProfile, FactoryExternalToolRegistry } from './external-tool-governance.types.ts'

export const FACTORY_EXTERNAL_TOOL_GOVERNANCE_KIND: FactoryExternalToolGovernanceKind = 'factory-external-tool-governance'
export const FACTORY_EXTERNAL_TOOL_GOVERNANCE_VERSION: FactoryExternalToolGovernanceVersion = '1.0'
const profile = (toolId: string, displayName: string, category: FactoryExternalToolCategory, origin: FactoryExternalToolOrigin, stages: string[], notes: string[], lifecycleStatus: FactoryExternalToolProfile['lifecycleStatus'] = 'planned', integrationMode: FactoryExternalToolProfile['integrationMode'] = 'profile_only'): FactoryExternalToolProfile => ({ toolId, displayName, category, origin, lifecycleStatus, integrationMode, intendedFlowStages: stages, capabilities: stages, forbiddenActions: ['install_now', 'execute_now', 'access_credentials', 'modify_runtime', 'write_product_output', 'deploy', 'approve_own_output'], installAllowedNow: false, executionAllowedNow: false, networkAllowedNow: false, filesystemAllowedNow: integrationMode === 'source_checkout_audit', credentialsAllowedNow: false, runtimeBoundaryRequired: ['coding_agent', 'market_research', 'web_research'].includes(category), adapterRequired: ['coding_agent', 'market_research', 'web_research'].includes(category), resultIngestionRequired: true, jefeReviewRequired: true, riskLevel: ['coding_agent', 'security_scanning', 'monetization'].includes(category) ? 'high' : 'medium', notes })
export const DEFAULT_FACTORY_EXTERNAL_TOOL_REGISTRY: FactoryExternalToolRegistry = { registryKind: FACTORY_EXTERNAL_TOOL_GOVERNANCE_KIND, registryVersion: FACTORY_EXTERNAL_TOOL_GOVERNANCE_VERSION, generatedAt: '2026-07-17T00:00:00.000Z', recommendedNextStep: 'Proceed to Factory Hermes Installation Plan Gate v1 or Factory Hermes Runtime Boundary Contract v1; no direct execution.', tools: [
  profile('hermes-agent', 'Hermes Agent', 'market_research', 'external_tool', ['Hermes research', 'tool result ingestion'], ['Windows-safe sparse source checkout audit completed; install and execution remain forbidden.'], 'source_checked_out', 'source_checkout_audit'),
  profile('codex', 'Codex', 'coding_agent', 'external_tool', ['Codex task contract', 'prompt assembly', 'execution adapter'], ['Execution remains blocked until future gates.']),
  profile('gdelt', 'GDELT', 'market_research', 'external_platform', ['market radar'], ['Planned research source.']),
  profile('rsshub', 'RSS/RSSHub', 'web_research', 'external_tool', ['market radar'], ['Planned feed source.']),
  profile('github-search', 'GitHub Search', 'web_research', 'external_platform', ['market radar'], ['Planned repository signal source.']),
  profile('hacker-news-algolia', 'Hacker News Algolia', 'web_research', 'external_platform', ['market radar'], ['Planned market signal source.']),
  profile('vitest', 'Vitest', 'unit_testing', 'dev_tool', ['tests'], ['Planned or existing repo test surface; no dependency change.'], 'planned', 'dev_dependency'),
  profile('msw', 'MSW', 'api_mocking', 'dev_tool', ['tests'], ['Planned mock layer; not installed by this block.'], 'planned', 'dev_dependency'),
  profile('playwright', 'Playwright', 'e2e_testing', 'dev_tool', ['e2e tests'], ['Planned E2E gate; not installed by this block.'], 'planned', 'dev_dependency'),
  profile('gitleaks', 'Gitleaks', 'security_scanning', 'dev_tool', ['security'], ['Planned secret scanning gate.']),
  profile('semgrep', 'Semgrep', 'security_scanning', 'dev_tool', ['security'], ['Planned static analysis gate.']),
  profile('codeql', 'CodeQL', 'security_scanning', 'ci_service', ['security'], ['Planned GitHub security workflow.'], 'planned', 'ci_workflow'),
  profile('opengrep', 'Opengrep', 'security_scanning', 'dev_tool', ['security'], ['Planned static analysis alternative.']),
  profile('trivy', 'Trivy', 'dependency_scanning', 'dev_tool', ['security'], ['Planned dependency/container scan.']),
  profile('openssf-scorecard', 'OpenSSF Scorecard', 'security_scanning', 'external_platform', ['security'], ['Planned supply-chain scoring.']),
  profile('lighthouse-ci', 'Lighthouse CI', 'performance', 'dev_tool', ['performance'], ['Planned performance gate.']),
  profile('axe-core', 'axe-core', 'accessibility', 'dev_tool', ['accessibility'], ['Planned accessibility gate.']),
  profile('promptfoo', 'Promptfoo', 'prompt_eval', 'dev_tool', ['prompt eval'], ['Planned prompt evaluation gate.']),
  profile('github-actions', 'GitHub Actions', 'ci_cd', 'ci_service', ['ci'], ['CI platform, governed by workflow approval.'], 'profiled', 'ci_workflow'),
  profile('dependabot', 'Dependabot', 'dependency_maintenance', 'external_platform', ['dependency maintenance'], ['Planned dependency maintenance.']),
  profile('renovate', 'Renovate', 'dependency_maintenance', 'external_platform', ['dependency maintenance'], ['Planned dependency maintenance alternative.']),
  profile('opentelemetry', 'OpenTelemetry', 'observability', 'dev_tool', ['observability'], ['Planned observability foundation.']),
  profile('sentry', 'Sentry', 'observability', 'external_platform', ['observability'], ['Planned error reporting platform.']),
  profile('umami', 'Umami', 'analytics', 'external_platform', ['analytics'], ['Planned privacy-focused analytics.']),
  profile('posthog', 'PostHog', 'analytics', 'external_platform', ['analytics'], ['Planned product analytics.']),
  profile('stripe', 'Stripe', 'monetization', 'payment_provider', ['monetization'], ['Future payment provider.']),
  profile('mercado-pago', 'Mercado Pago', 'monetization', 'payment_provider', ['monetization'], ['Future LATAM payment provider.'])
] }

