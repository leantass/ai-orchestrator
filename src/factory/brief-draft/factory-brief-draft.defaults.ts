import type { FactoryBriefDraftIndependencePolicy, FactoryBriefDraftPolicy } from './factory-brief-draft.types.ts'

export const FACTORY_BRIEF_DRAFT_KIND = 'factory-brief-draft' as const
export const FACTORY_BRIEF_DRAFT_VERSION = '1.0' as const
export const DEFAULT_FACTORY_BRIEF_DRAFT_POLICY: Readonly<FactoryBriefDraftPolicy> = { requireOpportunityId: true, requireDecisionId: true, requireProblem: true, requireAudience: true, requireProposedSolution: true, requireMonetizationHypothesis: true, requireEvidenceSummary: true, requireAcceptanceCriteria: true, requireScopeBoundaries: true, requireRuntimeIndependencePolicy: true, forbidCodexExecution: true, forbidProjectCreation: true, forbidRepositoryCreation: true, forbidDeploy: true, requireHumanReviewBeforeContract: true }
export const DEFAULT_FACTORY_BRIEF_DRAFT_INDEPENDENCE_POLICY: Readonly<FactoryBriefDraftIndependencePolicy> = { generatedProductMustBeIndependent: true, mustHaveOwnRoot: true, mustHaveOwnRepository: true, mustNotDependOnJefeRuntime: true, mustNotImportJefeModules: true, traceabilityOnly: true, requiresFactoryProjectContractBeforeCodex: true, requiresHumanApprovalBeforeCodex: true }

export function createFactoryBriefDraftPolicy(overrides: Partial<FactoryBriefDraftPolicy> = {}): FactoryBriefDraftPolicy {
  return structuredClone({ ...DEFAULT_FACTORY_BRIEF_DRAFT_POLICY, ...overrides, ...DEFAULT_FACTORY_BRIEF_DRAFT_POLICY })
}
