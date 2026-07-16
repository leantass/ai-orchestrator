import { createJefeHermesResearchRequestV1 } from '../../adapters/jefe-hermes/index.ts'
import type { JefeHermesResearchQuestion } from '../../adapters/jefe-hermes/index.ts'
import { RADAR_TO_HERMES_ALLOWED_SOURCES, RADAR_TO_HERMES_DISALLOWED_SOURCES, RADAR_TO_HERMES_HANDOFF_KIND, RADAR_TO_HERMES_HANDOFF_VERSION, RADAR_TO_HERMES_MINIMUM_QUESTIONS } from './radar-to-hermes.defaults.ts'
import type { RadarToHermesBlockedReason, RadarToHermesHandoffInput, RadarToHermesHandoffResult, RadarToHermesResearchQuestionMapping } from './radar-to-hermes.types.ts'

const SENSITIVE_CATEGORIES = new Set(['finance', 'health_sensitive', 'legal_sensitive'])
const truncate = (value: string, maximum: number) => value.trim().slice(0, maximum)
function mapOpenQuestion(question: string): JefeHermesResearchQuestion {
  if (/price|pricing|precio|pagar/iu.test(question)) return 'pricing'
  if (/compet|alternative|alternativa/iu.test(question)) return 'competitors'
  if (/moneti|revenue|ingreso/iu.test(question)) return 'monetization'
  if (/risk|legal|regulat|riesgo/iu.test(question)) return 'risks'
  if (/acqui|distribution|channel|canal/iu.test(question)) return 'distribution'
  if (/retain|retention|frequen|uso/iu.test(question)) return 'retention'
  if (/technical|tecnic|build/iu.test(question)) return 'technical_feasibility'
  return 'differentiation'
}

function blockedReason(decision: RadarToHermesHandoffInput['evaluation']['decision']['type']): RadarToHermesBlockedReason | undefined {
  if (decision === 'reject') return 'opportunity_rejected_by_radar'
  if (decision === 'hold') return 'opportunity_on_hold'
  if (decision === 'needs_human_review') return 'human_review_required_before_research'
  if (decision === 'draft_factory_brief') return 'draft_factory_brief_requires_research_policy_review'
  if (decision !== 'research_with_hermes') return 'radar_decision_not_eligible'
  return undefined
}

export function createRadarToHermesResearchRequest(input: RadarToHermesHandoffInput): RadarToHermesHandoffResult {
  const opportunity = structuredClone(input.opportunity); const evaluation = structuredClone(input.evaluation)
  const mappings: RadarToHermesResearchQuestionMapping[] = RADAR_TO_HERMES_MINIMUM_QUESTIONS.map((question) => ({ source: 'required_baseline', sourceText: question, targetQuestion: question }))
  for (const question of opportunity.openQuestions) mappings.push({ source: 'open_question', sourceText: truncate(question, 240), targetQuestion: mapOpenQuestion(question) })
  if (opportunity.monetizationHypothesis.trim()) mappings.push({ source: 'opportunity_hypothesis', sourceText: 'monetizationHypothesis', targetQuestion: 'monetization' })
  if (opportunity.competitorHypothesis.trim()) mappings.push({ source: 'opportunity_hypothesis', sourceText: 'competitorHypothesis', targetQuestion: 'competitors' })
  const researchQuestions = [...new Set(mappings.map((mapping) => mapping.targetQuestion))]
  const geography = [...new Set(opportunity.signals.map((signal) => signal.geography).filter((value): value is string => Boolean(value)))]
  const language = [...new Set(opportunity.signals.map((signal) => signal.language).filter((value): value is string => Boolean(value)))]
  const warnings: string[] = []; const risks = opportunity.risks.filter((risk) => risk.severity === 'high' || risk.severity === 'critical').map((risk) => truncate(risk.description, 180))
  if (!opportunity.monetizationHypothesis.trim()) warnings.push('Monetization hypothesis is missing and must be researched.')
  if (opportunity.openQuestions.length === 0) warnings.push('No explicit open questions were provided; baseline research questions were used.')
  const sensitive = SENSITIVE_CATEGORIES.has(opportunity.category)
  let reason = blockedReason(evaluation.decision.type)
  if (!reason && sensitive && !input.sensitiveResearchApprovedByHuman) reason = 'sensitive_category_requires_human_approval'
  if (evaluation.decision.type === 'draft_factory_brief') warnings.push('Policy forbids skipping Hermes research before a brief without future human override.')
  const base = {
    handoffId: `radar-hermes-${opportunity.id}-${input.createdAt}`,
    handoffKind: RADAR_TO_HERMES_HANDOFF_KIND,
    handoffVersion: RADAR_TO_HERMES_HANDOFF_VERSION,
    createdAt: input.createdAt,
    opportunityId: opportunity.id,
    ...(input.evaluationId ? { radarEvaluationId: input.evaluationId } : {}),
    radarDecision: evaluation.decision.type,
    radarScore: evaluation.score.total,
    sourceOpportunitySummary: truncate(`${opportunity.description} Problem: ${opportunity.problem}. Signals: ${opportunity.signals.length}.`, 800),
    targetAdapterName: 'JefeHermesAdapter' as const,
    targetExternalToolName: 'Hermes Agent' as const,
    targetMode: 'read_only_adapter' as const,
    questionMappings: mappings,
    sourcePolicyMapping: { allowedSources: [...RADAR_TO_HERMES_ALLOWED_SOURCES], disallowedSources: [...RADAR_TO_HERMES_DISALLOWED_SOURCES] },
    requiredHumanReview: sensitive || evaluation.decision.type === 'needs_human_review',
    codexAllowed: false as const,
    directProjectCreationAllowed: false as const,
    runtimeExecutionAllowed: false as const,
    mappingWarnings: warnings,
    mappingRisks: risks,
  }
  if (reason) return { ...base, requestCreated: false, blockedReason: reason, recommendedNextStep: reason === 'sensitive_category_requires_human_approval' || reason === 'human_review_required_before_research' ? 'Obtain human approval before preparing any external research request.' : 'Return the blocked handoff to JEFE for policy review.' }
  const researchRequest = createJefeHermesResearchRequestV1({ requestId: `jefe-hermes-${opportunity.id}`, opportunityId: opportunity.id, source: 'radar', createdAt: input.createdAt, requestedBy: input.requestedBy, title: truncate(opportunity.title, 180), opportunitySummary: base.sourceOpportunitySummary, targetAudience: truncate(opportunity.audience, 300), geography: geography.length > 0 ? geography : ['unspecified'], language: language.length > 0 ? language : ['unspecified'], category: opportunity.category, researchQuestions, scope: { includedQuestions: researchQuestions, excludedTopics: ['personal data', 'credentialed sources', 'project creation', 'code modification'], maximumSources: 20, allowPersonalData: false, allowCredentialedSources: false }, allowedSources: [...RADAR_TO_HERMES_ALLOWED_SOURCES], disallowedSources: [...RADAR_TO_HERMES_DISALLOWED_SOURCES], budgetPolicy: 'free/open-source-first; external spend requires human approval', timeboxPolicy: 'bounded research request; no autonomous retry loop', sensitiveTopicPolicy: sensitive ? 'human approval required before external calls; return sensitive findings to JEFE' : `risk context: ${risks.length} elevated findings; escalate critical findings to JEFE`, requiredEvidence: researchQuestions.map((question) => `${question}: cited evidence from quality-rated sources`) })
  return { ...base, researchRequest, requestCreated: true, recommendedNextStep: 'Submit the governed request to JEFE for approval before any future Hermes Agent call.' }
}
