import type { JefeHermesResearchReport, JefeHermesResearchReportSummary, JefeHermesResearchRequest } from './jefe-hermes-adapter.types.ts'

export const serializeJefeHermesResearchRequest = (request: JefeHermesResearchRequest): string => JSON.stringify(request, null, 2)
export const parseJefeHermesResearchRequest = (json: string): unknown => JSON.parse(json) as unknown
export const serializeJefeHermesResearchReport = (report: JefeHermesResearchReport): string => JSON.stringify(report, null, 2)
export const parseJefeHermesResearchReport = (json: string): unknown => JSON.parse(json) as unknown
const safe = (value: string, maximum = 180) => value.replace(/(api[_-]?key|password|secret|token)\s*[:=]\s*\S+/giu, '[REDACTED]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, '[REDACTED_EMAIL]').slice(0, maximum)

export function summarizeJefeHermesResearchReport(report: JefeHermesResearchReport): JefeHermesResearchReportSummary {
  const missingCoverage = report.requiredCoverage.filter((question) => !report.satisfiedCoverage.includes(question))
  return { reportId: report.reportId, opportunityId: report.opportunityId, confidence: { ...report.confidence }, recommendation: report.recommendedDecisionForJefe, topFindings: [report.demandFindings[0]?.summary, report.competitorFindings[0]?.positioning, report.monetizationFindings[0]?.rationale].filter((item): item is string => Boolean(item)).map((item) => safe(item)), risks: report.riskFindings.slice(0, 5).map((risk) => ({ severity: risk.severity, category: safe(risk.category, 80), description: safe(risk.description) })), missingCoverage, nextAction: safe(report.handoffToJefe?.recommendedNextStep ?? 'Create a governed handoff to JEFE.', 240) }
}
