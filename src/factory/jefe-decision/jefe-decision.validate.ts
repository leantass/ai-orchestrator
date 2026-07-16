import { JEFE_OPPORTUNITY_DECISION_GATE_KIND, JEFE_OPPORTUNITY_DECISION_GATE_VERSION, JEFE_OPPORTUNITY_DECISIONS, JEFE_SENSITIVE_OPPORTUNITY_CATEGORIES } from './jefe-decision.defaults.ts'
import type { JefeDecisionValidationResult, JefeOpportunityDecisionInput, JefeOpportunityDecisionResult } from './jefe-decision.types.ts'

const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const containsSecret = (value: unknown) => secretPattern.test(JSON.stringify(value))

export function validateJefeOpportunityDecisionInput(input: JefeOpportunityDecisionInput): JefeDecisionValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (!input?.opportunity) errors.push('opportunity is required.')
  if (!input?.radarEvaluation) errors.push('radarEvaluation is required.')
  if (!input?.decidedBy?.trim()) errors.push('decidedBy is required.')
  if (!input?.createdAt?.trim()) errors.push('createdAt is required.')
  if (input?.opportunity && !input.opportunity.id.trim()) errors.push('opportunity.id is required.')
  const score = input?.radarEvaluation?.score?.total
  if (typeof score !== 'number' || score < 0 || score > 100) errors.push('radarEvaluation score must be between 0 and 100.')
  if (input?.opportunity && input?.radarEvaluation && input.opportunity.id !== input.radarEvaluation.opportunityId) errors.push('Radar evaluation must match opportunityId.')
  if (input?.hermesReport && input?.opportunity && input.hermesReport.opportunityId !== input.opportunity.id) errors.push('Hermes report must match opportunityId.')
  if (input?.hermesHandoff && input?.opportunity && input.hermesHandoff.opportunityId !== input.opportunity.id) errors.push('Hermes handoff must match opportunityId.')
  if (containsSecret(input)) errors.push('Input appears to contain a secret value.')
  if (!input?.hermesReport) warnings.push('No Hermes report was supplied.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateJefeOpportunityDecisionResult(result: JefeOpportunityDecisionResult): JefeDecisionValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (result.decisionKind !== JEFE_OPPORTUNITY_DECISION_GATE_KIND) errors.push('decisionKind is invalid.')
  if (result.decisionVersion !== JEFE_OPPORTUNITY_DECISION_GATE_VERSION) errors.push('decisionVersion is invalid.')
  if (!result.opportunityId.trim()) errors.push('opportunityId is required.')
  if (!JEFE_OPPORTUNITY_DECISIONS.includes(result.decision)) errors.push('decision is invalid.')
  if (result.reasons.length === 0) errors.push('At least one decision reason is required.')
  if (!result.recommendedNextStep.trim()) errors.push('recommendedNextStep is required.')
  if (result.codexAllowed !== false) errors.push('codexAllowed must remain false.')
  if (result.projectCreationAllowed !== false) errors.push('projectCreationAllowed must remain false.')
  if (result.deployAllowed !== false) errors.push('deployAllowed must remain false.')
  if (result.decision === 'approve_brief_draft' && !result.briefDraftSignal) errors.push('approve_brief_draft requires briefDraftSignal.')
  if (result.decision === 'prepare_factory_project_candidate' && (!result.projectCandidateSignal || !result.requiredHumanReview.satisfied)) errors.push('Project candidate signal requires satisfied human approval.')
  const critical = result.risks.some((risk) => risk.severity === 'critical')
  if (critical && ['approve_brief_draft', 'prepare_factory_project_candidate'].includes(result.decision)) errors.push('Critical risk blocks brief and candidate approval.')
  if (result.appliedPolicy.requireHermesForBrief && !result.evidenceSummary.hermesReportPresent && ['approve_brief_draft', 'prepare_factory_project_candidate'].includes(result.decision)) errors.push('Hermes report is required for advancement.')
  if (result.evidenceSummary.missingCoverage.length > 0 && ['approve_brief_draft', 'prepare_factory_project_candidate'].includes(result.decision)) errors.push('Missing coverage blocks advancement.')
  if (result.evidenceSummary.contradictions >= 2 && ['approve_brief_draft', 'prepare_factory_project_candidate'].includes(result.decision)) errors.push('Strong contradictions block advancement.')
  if (result.requiredHumanReview.required && result.decision === 'approve_brief_draft') errors.push('Human-review cases cannot approve a brief directly.')
  if (result.projectCandidateSignal && (!result.projectCandidateSignal.repositoryRequired || !result.projectCandidateSignal.runtimeIndependenceRequired || !result.projectCandidateSignal.requiresFactoryProjectContract)) errors.push('Candidate signal must preserve repository, runtime and contract independence.')
  if (containsSecret(result)) errors.push('Result appears to contain a secret value.')
  if (JEFE_SENSITIVE_OPPORTUNITY_CATEGORIES.some((category) => result.risks.some((risk) => risk.category === category)) && !result.requiredHumanReview.required) warnings.push('Sensitive risk category should require human review.')
  return { ok: errors.length === 0, errors, warnings }
}
