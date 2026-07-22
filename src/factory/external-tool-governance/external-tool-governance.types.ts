export type FactoryExternalToolGovernanceVersion = '1.0'
export type FactoryExternalToolGovernanceKind = 'factory-external-tool-governance'
export type FactoryExternalToolId = string
export type FactoryExternalToolCategory = 'market_research' | 'web_research' | 'coding_agent' | 'unit_testing' | 'api_mocking' | 'e2e_testing' | 'security_scanning' | 'dependency_scanning' | 'accessibility' | 'performance' | 'prompt_eval' | 'ci_cd' | 'dependency_maintenance' | 'observability' | 'analytics' | 'monetization'
export type FactoryExternalToolOrigin = 'external_tool' | 'external_platform' | 'dev_tool' | 'ci_service' | 'payment_provider'
export type FactoryExternalToolLifecycleStatus = 'planned' | 'profiled' | 'source_checkout_planned' | 'source_checked_out' | 'source_checkout_failed' | 'install_planned' | 'installed' | 'runtime_boundary_planned' | 'runtime_ready' | 'adapter_planned' | 'adapter_ready' | 'disabled' | 'blocked'
export type FactoryExternalToolIntegrationMode = 'profile_only' | 'source_checkout_audit' | 'local_cli' | 'dev_dependency' | 'ci_workflow' | 'runtime_adapter' | 'external_platform' | 'manual_review_only'
export type FactoryExternalToolRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type FactoryExternalToolCapability = string
export type FactoryExternalToolForbiddenAction = 'install_now' | 'execute_now' | 'access_credentials' | 'modify_runtime' | 'write_product_output' | 'deploy' | 'approve_own_output'
export interface FactoryExternalToolIntegrationPlan { planId: string; summary: string; installAllowedNow: boolean; executionAllowedNow: boolean; nextGateRequired: string }
export interface FactoryExternalToolRuntimeBoundary { boundaryId: string; summary: string; filesystemScope: string; networkScope: string; credentialsScope: string; executionAllowedNow: boolean }
export interface FactoryExternalToolProfile { toolId: FactoryExternalToolId; displayName: string; category: FactoryExternalToolCategory; origin: FactoryExternalToolOrigin; lifecycleStatus: FactoryExternalToolLifecycleStatus; integrationMode: FactoryExternalToolIntegrationMode; intendedFlowStages: string[]; capabilities: FactoryExternalToolCapability[]; forbiddenActions: FactoryExternalToolForbiddenAction[]; installAllowedNow: boolean; executionAllowedNow: boolean; networkAllowedNow: boolean; filesystemAllowedNow: boolean; credentialsAllowedNow: boolean; runtimeBoundaryRequired: boolean; adapterRequired: boolean; resultIngestionRequired: boolean; jefeReviewRequired: boolean; riskLevel: FactoryExternalToolRiskLevel; notes: string[]; integrationPlan?: FactoryExternalToolIntegrationPlan; runtimeBoundary?: FactoryExternalToolRuntimeBoundary; adapterRef?: string }
export interface FactoryExternalToolRegistry { registryKind: FactoryExternalToolGovernanceKind; registryVersion: FactoryExternalToolGovernanceVersion; generatedAt: string; tools: FactoryExternalToolProfile[]; recommendedNextStep: string }
export interface FactoryExternalToolValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryExternalToolGovernanceSummary { registryKind: FactoryExternalToolGovernanceKind; registryVersion: FactoryExternalToolGovernanceVersion; toolCount: number; byLifecycle: Record<string, number>; executionEnabledCount: number; installEnabledCount: number; credentialsEnabledCount: number; recommendedNextStep: string }

