import type { JefeOpportunityDecisionPolicy } from './jefe-decision.types.ts'

export const JEFE_OPPORTUNITY_DECISION_GATE_KIND = 'jefe-opportunity-decision-gate' as const
export const JEFE_OPPORTUNITY_DECISION_GATE_VERSION = '1.0' as const
export const JEFE_OPPORTUNITY_DECISIONS = ['reject_opportunity', 'hold_opportunity', 'request_more_research', 'human_review_required', 'approve_brief_draft', 'prepare_factory_project_candidate', 'blocked'] as const
export const JEFE_SENSITIVE_OPPORTUNITY_CATEGORIES = ['finance', 'health_sensitive', 'legal_sensitive'] as const
export const DEFAULT_JEFE_OPPORTUNITY_DECISION_POLICY: Readonly<JefeOpportunityDecisionPolicy> = {
  requireHermesForBrief: true, requireHermesForProjectCandidate: true, minimumRadarScoreForBrief: 70,
  minimumHermesConfidenceForBrief: 0.7, minimumEvidenceItemsForBrief: 3, requireDiverseSources: true,
  blockOnCriticalRisk: true, blockOnStrongContradictions: true, requireHumanReviewForSensitiveCategories: true,
  requireHumanApprovalForProjectCandidate: true, codexSelfApprovalAllowed: false, codexAllowedByDecisionGate: false,
  projectCreationAllowedByDecisionGate: false, deployAllowedByDecisionGate: false,
}

export function createJefeOpportunityDecisionPolicy(overrides: Partial<JefeOpportunityDecisionPolicy> = {}): JefeOpportunityDecisionPolicy {
  return structuredClone({ ...DEFAULT_JEFE_OPPORTUNITY_DECISION_POLICY, ...overrides,
    requireHermesForBrief: true, requireHermesForProjectCandidate: true, requireDiverseSources: true,
    blockOnCriticalRisk: true, blockOnStrongContradictions: true, requireHumanReviewForSensitiveCategories: true,
    requireHumanApprovalForProjectCandidate: true, codexSelfApprovalAllowed: false, codexAllowedByDecisionGate: false,
    projectCreationAllowedByDecisionGate: false, deployAllowedByDecisionGate: false,
  })
}
