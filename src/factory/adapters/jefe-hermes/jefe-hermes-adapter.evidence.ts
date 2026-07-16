import { JEFE_HERMES_ADAPTER_IDENTITY } from './jefe-hermes-adapter.defaults.ts'
import type { JefeHermesEvidenceItem, JefeHermesEvidenceQuality, JefeHermesEvidenceScoringResult, JefeHermesHandoffToJefe, JefeHermesResearchQuestion, JefeHermesResearchReport } from './jefe-hermes-adapter.types.ts'

const QUALITY: Record<JefeHermesEvidenceQuality, number> = { high: 1, medium: 0.7, low: 0.3, unknown: 0.1 }
const FRESHNESS = { current: 1, recent: 0.8, stale: 0.3, unknown: 0.2 }
const RELEVANCE = { high: 1, medium: 0.65, low: 0.25 }
const KIND_TO_QUESTION: Partial<Record<JefeHermesEvidenceItem['kind'], JefeHermesResearchQuestion>> = { demand: 'demand', competitor: 'competitors', pricing: 'pricing', review: 'reviews', trend: 'trends', monetization: 'monetization', risk: 'risks', regulation: 'regulations', distribution: 'distribution', technical: 'technical_feasibility' }

export function scoreJefeHermesEvidenceQuality(evidence: readonly JefeHermesEvidenceItem[], requiredCoverage: readonly JefeHermesResearchQuestion[], declaredSatisfiedCoverage: readonly JefeHermesResearchQuestion[] = []): JefeHermesEvidenceScoringResult {
  const count = evidence.length
  const average = (select: (item: JefeHermesEvidenceItem) => number) => count === 0 ? 0 : evidence.reduce((sum, item) => sum + select(item), 0) / count
  const qualityScore = average((item) => QUALITY[item.sourceQuality]); const freshnessScore = average((item) => FRESHNESS[item.freshness]); const relevanceScore = average((item) => RELEVANCE[item.relevance])
  const evidenceCoverage = new Set(evidence.map((item) => KIND_TO_QUESTION[item.kind]).filter((item): item is JefeHermesResearchQuestion => Boolean(item)))
  const satisfiedCoverage = [...new Set(declaredSatisfiedCoverage.filter((question) => evidenceCoverage.has(question)))]
  const missingCoverage = requiredCoverage.filter((question) => !satisfiedCoverage.includes(question))
  const coverageRatio = requiredCoverage.length === 0 ? 1 : (requiredCoverage.length - missingCoverage.length) / requiredCoverage.length
  const supporting = evidence.filter((item) => item.stance === 'supporting').length; const contradicting = evidence.filter((item) => item.stance === 'contradicting').length
  const contradictionPenalty = contradicting >= 2 || (supporting > 0 && contradicting >= supporting) ? 0.25 : contradicting > 0 ? 0.1 : 0
  const distinctSourceCount = new Set(evidence.map((item) => `${item.sourceType}:${item.sourceName.trim().toLowerCase()}`)).size
  const evidenceSufficient = count >= 3 && distinctSourceCount >= 2 && qualityScore >= 0.6 && coverageRatio >= 0.6 && contradictionPenalty < 0.25
  const score = Math.round(Math.max(0, Math.min(1, qualityScore * 0.3 + freshnessScore * 0.15 + relevanceScore * 0.2 + coverageRatio * 0.2 + Math.min(distinctSourceCount / 3, 1) * 0.15 - contradictionPenalty)) * 100)
  const criticalRisk = evidence.some((item) => item.riskFlags.some((flag) => /critical|sensitive|illegal|privacy/iu.test(flag)))
  const warnings: string[] = []; const risks: string[] = []
  if (count < 3 || distinctSourceCount < 2) warnings.push('Evidence requires at least three items from two distinct sources.')
  if (qualityScore < 0.6) warnings.push('Low-quality sources cannot support brief conversion.')
  if (missingCoverage.length > 0) warnings.push('Required research coverage is incomplete.')
  if (contradictionPenalty >= 0.25) warnings.push('Strong contradictions block brief conversion.')
  if (criticalRisk) risks.push('Critical or sensitive evidence requires human review.')
  const suggestedNextAction = criticalRisk ? 'human_review_required' : evidenceSufficient ? 'ready_for_jefe_review' : 'needs_more_sources'
  return { confidence: { score, level: score >= 80 ? 'high' : score >= 60 ? 'medium' : score >= 35 ? 'low' : 'unknown', sourceCount: count, distinctSourceCount, qualityScore, freshnessScore, relevanceScore, contradictionPenalty, coverageRatio }, evidenceSufficient, warnings, risks, requiredCoverage: [...requiredCoverage], satisfiedCoverage, missingCoverage, suggestedNextAction }
}

export function createJefeHermesHandoffToJefe(report: JefeHermesResearchReport): JefeHermesHandoffToJefe {
  const scoring = scoreJefeHermesEvidenceQuality(report.evidence, report.requiredCoverage, report.satisfiedCoverage)
  const critical = report.riskFindings.some((risk) => risk.severity === 'critical') || scoring.suggestedNextAction === 'human_review_required'
  const contradictory = report.contradictions.length >= 2 || scoring.confidence.contradictionPenalty >= 0.25
  const recommendation = critical ? 'human_review_required' : !scoring.evidenceSufficient || contradictory ? 'request_more_research' : report.recommendedDecisionForJefe
  return { ...JEFE_HERMES_ADAPTER_IDENTITY, handoffId: `handoff-${report.reportId}`, reportId: report.reportId, opportunityId: report.opportunityId, target: 'jefe', createdAt: report.createdAt, decisionRecommendation: recommendation, evidenceSummary: report.executiveSummary.slice(0, 500), confidence: scoring.confidence, topFindings: [report.demandFindings[0]?.summary, report.monetizationFindings[0]?.rationale].filter((item): item is string => Boolean(item)).map((item) => item.slice(0, 180)), risks: report.riskFindings.map((risk) => ({ ...risk, sourceEvidenceIds: [...risk.sourceEvidenceIds] })), requiredCoverage: scoring.requiredCoverage, satisfiedCoverage: scoring.satisfiedCoverage, missingCoverage: scoring.missingCoverage, requiredHumanReview: critical, codexAllowed: false, recommendedNextStep: recommendation === 'convert_to_factory_brief' ? 'JEFE reviews evidence and decides whether to create a Factory brief.' : recommendation === 'human_review_required' ? 'Escalate to human review; no construction action is authorized.' : 'JEFE requests more bounded research or holds the opportunity.' }
}
