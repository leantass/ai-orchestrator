import { JEFE_HERMES_ADAPTER_IDENTITY, JEFE_HERMES_ALLOWED_SOURCE_TYPES, JEFE_HERMES_DISALLOWED_SOURCE_TYPES, JEFE_HERMES_MAX_QUOTE_LENGTH, JEFE_HERMES_MAX_SUMMARY_LENGTH } from './jefe-hermes-adapter.defaults.ts'
import { scoreJefeHermesEvidenceQuality } from './jefe-hermes-adapter.evidence.ts'
import type { JefeHermesValidationResult } from './jefe-hermes-adapter.types.ts'
type R = Record<string, unknown>
const rec = (value: unknown): R => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as R : {}
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const secret = (value: unknown) => /(api[_-]?key|password|secret|token)\s*[:=]\s*\S+/iu.test(JSON.stringify(value))
const pii = (value: unknown) => /\b\d{3}-?\d{2}-?\d{4}\b|\b(?:\d[ -]*?){13,16}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(JSON.stringify(value))
const decisions = ['reject', 'hold', 'request_more_research', 'convert_to_factory_brief', 'human_review_required']
function validateIdentity(value: R, errors: string[]) { for (const [key, expected] of Object.entries(JEFE_HERMES_ADAPTER_IDENTITY)) if (value[key] !== expected) errors.push(`${key} debe ser ${String(expected)}.`) }

export function validateJefeHermesResearchRequest(value: unknown): JefeHermesValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const request = rec(value); const policy = rec(request.policy); validateIdentity(request, errors)
  for (const key of ['requestId', 'opportunityId', 'requestedBy', 'createdAt']) if (!text(request[key])) errors.push(`${key} es obligatorio.`)
  if (request.mode !== 'read_only') errors.push('mode debe ser read_only.')
  if (!Array.isArray(request.researchQuestions) || request.researchQuestions.length === 0) errors.push('researchQuestions no puede estar vacio.')
  const allowed = Array.isArray(request.allowedSources) ? request.allowedSources : []; const disallowed = Array.isArray(request.disallowedSources) ? request.disallowedSources : []
  if (allowed.length === 0) errors.push('allowedSources no puede estar vacio.')
  if (allowed.some((source) => !JEFE_HERMES_ALLOWED_SOURCE_TYPES.includes(source))) errors.push('allowedSources contiene una fuente no permitida.')
  if (disallowed.some((source) => !JEFE_HERMES_DISALLOWED_SOURCE_TYPES.includes(source))) errors.push('disallowedSources contiene una fuente restringida desconocida.')
  const overlap = allowed.filter((source) => disallowed.includes(source)); if (overlap.length > 0) errors.push('allowedSources y disallowedSources no pueden superponerse.')
  const requiredPolicy: Record<string, boolean> = { readOnly: true, mayModifyCode: false, mayModifyRepo: false, mayApproveProject: false, mayDeploy: false, codexAllowed: false, requiresApprovalForExternalCalls: true, requiresCitationForClaims: true, requiresSourceQualityRating: true, requiresEvidenceForRecommendation: true }
  for (const [key, expected] of Object.entries(requiredPolicy)) if (policy[key] !== expected) errors.push(`policy.${key} debe ser ${expected}.`)
  return { ok: errors.length === 0, errors, warnings }
}

export function validateJefeHermesEvidenceItem(value: unknown): JefeHermesValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const item = rec(value)
  for (const key of ['evidenceId', 'kind', 'sourceType', 'sourceName', 'title', 'summary', 'capturedAt']) if (!text(item[key])) errors.push(`${key} es obligatorio.`)
  if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) errors.push('confidence debe estar entre 0 y 1.')
  if (!['high', 'medium', 'low', 'unknown'].includes(String(item.sourceQuality))) errors.push('sourceQuality no es valida.')
  if (!['high', 'medium', 'low'].includes(String(item.relevance))) errors.push('relevance no es valida.')
  if (text(item.quote) && item.quote.length > JEFE_HERMES_MAX_QUOTE_LENGTH) errors.push(`quote no puede superar ${JEFE_HERMES_MAX_QUOTE_LENGTH} caracteres.`)
  if (text(item.summary) && item.summary.length > JEFE_HERMES_MAX_SUMMARY_LENGTH) errors.push(`summary no puede superar ${JEFE_HERMES_MAX_SUMMARY_LENGTH} caracteres.`)
  if (secret(item)) errors.push('La evidencia parece contener secretos.'); if (pii(item)) errors.push('La evidencia parece contener PII innecesaria.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateJefeHermesResearchReport(value: unknown): JefeHermesValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const report = rec(value); validateIdentity(report, errors)
  for (const key of ['reportId', 'requestId', 'opportunityId']) if (!text(report[key])) errors.push(`${key} es obligatorio.`)
  const evidence = Array.isArray(report.evidence) ? report.evidence : []; evidence.forEach((item, index) => validateJefeHermesEvidenceItem(item).errors.forEach((error) => errors.push(`evidence[${index}]: ${error}`)))
  const required = Array.isArray(report.requiredCoverage) ? report.requiredCoverage : []; const satisfied = Array.isArray(report.satisfiedCoverage) ? report.satisfiedCoverage : []
  const scoring = scoreJefeHermesEvidenceQuality(evidence as never[], required as never[], satisfied as never[])
  if (report.status === 'completed' && !scoring.evidenceSufficient) errors.push('Un report completed requiere evidencia suficiente, fuentes diversas y cobertura minima.')
  const confidence = rec(report.confidence); if (typeof confidence.score !== 'number' || Math.abs(Number(confidence.score) - scoring.confidence.score) > 1) errors.push('confidence no es consistente con la evidencia.')
  if (!decisions.includes(String(report.recommendedDecisionForJefe))) errors.push('recommendedDecisionForJefe no es valida.')
  if (!Array.isArray(report.limitations) || report.limitations.length === 0) errors.push('limitations debe explicitar limites.')
  if (report.recommendedDecisionForJefe === 'convert_to_factory_brief') {
    if (!scoring.evidenceSufficient || scoring.missingCoverage.length > 0) errors.push('No se puede convertir a brief con evidencia o cobertura insuficiente.')
    if (Array.isArray(report.contradictions) && report.contradictions.length >= 2) errors.push('Contradicciones fuertes impiden convertir a brief.')
    if (Array.isArray(report.riskFindings) && report.riskFindings.some((risk) => rec(risk).severity === 'critical')) errors.push('Riesgo critico requiere human_review_required.')
    if (scoring.confidence.qualityScore < 0.6) errors.push('Fuentes de baja calidad impiden convertir a brief.')
  }
  return { ok: errors.length === 0, errors, warnings: [...warnings, ...scoring.warnings] }
}

export function validateJefeHermesHandoffToJefe(value: unknown): JefeHermesValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const handoff = rec(value); validateIdentity(handoff, errors)
  for (const key of ['handoffId', 'reportId', 'opportunityId', 'decisionRecommendation', 'evidenceSummary', 'recommendedNextStep']) if (!text(handoff[key])) errors.push(`${key} es obligatorio.`)
  if (handoff.target !== 'jefe') errors.push('target debe ser jefe.'); if (typeof handoff.requiredHumanReview !== 'boolean') errors.push('requiredHumanReview debe ser boolean.'); if (handoff.codexAllowed !== false) errors.push('codexAllowed debe ser false.')
  const required = Array.isArray(handoff.requiredCoverage) ? handoff.requiredCoverage : []; const satisfied = Array.isArray(handoff.satisfiedCoverage) ? handoff.satisfiedCoverage : []; const missing = Array.isArray(handoff.missingCoverage) ? handoff.missingCoverage : []
  const expectedMissing = required.filter((item) => !satisfied.includes(item)); if (JSON.stringify(missing) !== JSON.stringify(expectedMissing)) errors.push('missingCoverage debe derivarse de requiredCoverage menos satisfiedCoverage.')
  return { ok: errors.length === 0, errors, warnings }
}
