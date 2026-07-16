import type { FactoryBriefDraft, FactoryBriefDraftIndependencePolicy } from '../brief-draft/index.ts'

export type FactoryProjectContractCandidateVersion = '1.0'
export type FactoryProjectContractCandidateKind = 'factory-project-contract-candidate'
export type FactoryProjectContractCandidateStatus = 'draft_candidate' | 'needs_human_review' | 'ready_for_contract_draft' | 'blocked'
export interface FactoryProjectContractCandidatePolicy { requireBriefDraftId: true; requireOpportunityId: true; requireDecisionId: true; requireProductIdentity: true; requireSlug: true; requireOwnRepository: true; requireOwnRoot: true; requireRuntimeIndependence: true; forbidJefeRuntimeDependency: true; forbidJefeModuleImports: true; requireEnvironmentVariablesWithoutValues: true; requireQualityProfile: true; requireSecurityProfile: true; requireEvidenceRequirements: true; requireHumanApprovalBeforeContractCreation: true; requireHumanApprovalBeforeCodex: true; forbidCodexExecution: true; forbidProjectCreation: true; forbidRepositoryCreation: true; forbidDeploy: true }
export interface FactoryProjectContractCandidateIdentity { projectIdSuggestion: string; slugSuggestion: string; name: string; displayName: string; description: string; projectType: string; businessDomain?: string; owner?: string }
export interface FactoryProjectContractCandidateLineage { briefDraftId: string; opportunityId: string; decisionId: string; radarScore?: number; hermesConfidence?: number; evidenceRefs: string[]; humanReviewRef?: string; generatedBy: 'JEFE'; derivedFrom: 'FactoryBriefDraft' }
export interface FactoryProjectContractCandidateStack { language: string; frontend: string; backend: string; runtime: string; database: string; packageManager: string; testFrameworks: string[]; deploymentTarget: string }
export interface FactoryProjectContractCandidateRepository { repositoryRequired: true; provider: 'GitHub'; owner?: string; repoNameSuggestion: string; ownRootRequired: true; creationAllowed: false }
export interface FactoryProjectContractCandidateEnvironmentVariable { name: string; required: boolean; secret: boolean; scope: 'build' | 'runtime' | 'test' | 'deployment'; description: string; defaultAllowed: boolean; productionRequired: boolean }
export interface FactoryProjectContractCandidateQualityProfile { profile: 'factory_baseline_v1'; preliminaryAcceptanceCriteria: string[]; requiredChecks: string[]; unitTestsPlanned: boolean; integrationTestsPlanned: boolean; e2eTestsPlanned: boolean; accessibilityPlanned: boolean; performancePlanned: boolean }
export interface FactoryProjectContractCandidateSecurityProfile { profile: 'factory_secure_default_v1'; secretValuesForbidden: true; leastPrivilegeRequired: true; externalCallsRequireApproval: true; deployRequiresApproval: true; promptInjectionReviewRequired: true; dependencyReviewRequired: true }
export interface FactoryProjectContractCandidateEvidenceRequirement { requirementId: string; description: string; source: 'brief_acceptance_criterion' | 'brief_evidence' | 'independence'; required: true; status: 'pending' }
export interface FactoryProjectContractCandidateApprovalRequirement { approvalId: string; stage: 'contract_creation' | 'before_codex'; required: true; status: 'pending' | 'approved'; approvalRef?: string }
export interface FactoryProjectContractCandidateReadiness { status: 'not_ready' | 'needs_human_review' | 'ready_for_contract_draft'; blockersCount: number; approvalsPending: number; evidenceRequirementsCount: number }
export interface FactoryProjectContractCandidateBlocker { blockerId: string; category: 'brief' | 'evidence' | 'approval' | 'independence'; description: string; blocking: true }
export interface FactoryProjectContractCandidateExecutionPolicy { codexExecutionAllowed: false; projectCreationAllowed: false; repositoryCreationAllowed: false; deployAllowed: false }

export interface FactoryProjectContractCandidateInput { draft: FactoryBriefDraft; createdAt: string; createdBy: string; humanReviewRef?: string; policy?: Partial<FactoryProjectContractCandidatePolicy>; stackSuggestion?: Partial<FactoryProjectContractCandidateStack>; repositoryOwner?: string; packageManagerSuggestion?: string; environmentVariables?: FactoryProjectContractCandidateEnvironmentVariable[] }
export interface FactoryProjectContractCandidate {
  candidateId: string; candidateKind: FactoryProjectContractCandidateKind; candidateVersion: FactoryProjectContractCandidateVersion; createdAt: string; createdBy: string; status: FactoryProjectContractCandidateStatus
  source: { briefDraftId: string; generatedBy: 'JEFE'; derivedFrom: 'FactoryBriefDraft' }; identity: FactoryProjectContractCandidateIdentity; lineage: FactoryProjectContractCandidateLineage
  projectType: string; description: string; problem: string; audience: string; proposedSolution: string; monetization: string
  stack: FactoryProjectContractCandidateStack; repository: FactoryProjectContractCandidateRepository; environmentVariables: FactoryProjectContractCandidateEnvironmentVariable[]
  qualityProfile: FactoryProjectContractCandidateQualityProfile; securityProfile: FactoryProjectContractCandidateSecurityProfile; evidenceRequirements: FactoryProjectContractCandidateEvidenceRequirement[]
  approvalRequirements: FactoryProjectContractCandidateApprovalRequirement[]; independencePolicy: FactoryBriefDraftIndependencePolicy; executionPolicy: FactoryProjectContractCandidateExecutionPolicy
  policy: FactoryProjectContractCandidatePolicy; readiness: FactoryProjectContractCandidateReadiness; blockers: FactoryProjectContractCandidateBlocker[]; warnings: string[]; recommendedNextStep: string
}
export interface FactoryProjectContractCandidateValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryProjectContractCandidateSummary { candidateId: string; briefDraftId: string; opportunityId: string; slugSuggestion: string; name: string; readiness: FactoryProjectContractCandidateReadiness['status']; blockersCount: number; approvalsPending: number; repositoryRequired: boolean; runtimeIndependenceRequired: boolean; recommendedNextStep: string }
