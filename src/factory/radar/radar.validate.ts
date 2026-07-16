import { RADAR_DECISIONS, RADAR_SIGNAL_STRENGTHS, RADAR_VERSION } from './radar.defaults.ts'
import type { RadarValidationResult } from './radar.types.ts'

type UnknownRecord = Record<string, unknown>
const record = (value: unknown): UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as UnknownRecord : {}
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const validRating = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 5
const looksSensitive = (value: unknown) => typeof value === 'string' && /(api[_-]?key|password|secret|token)\s*[:=]\s*\S+/iu.test(value)
const scanSensitive = (value: unknown) => looksSensitive(JSON.stringify(value))

export function validateMarketSignal(value: unknown): RadarValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const signal = record(value)
  if (signal.radarVersion !== RADAR_VERSION) errors.push(`radarVersion debe ser ${RADAR_VERSION}.`)
  for (const key of ['id', 'type', 'source', 'title', 'capturedAt']) if (!text(signal[key])) errors.push(`${key} es obligatorio.`)
  if (!RADAR_SIGNAL_STRENGTHS.includes(signal.strength as typeof RADAR_SIGNAL_STRENGTHS[number])) errors.push('strength no es valida.')
  if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 1) errors.push('confidence debe estar entre 0 y 1.')
  if (scanSensitive(signal.evidence)) errors.push('evidence parece contener un secreto y no puede persistirse en Radar.')
  if (!text(signal.summary)) warnings.push('summary deberia describir la señal.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateMarketOpportunity(value: unknown): RadarValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const opportunity = record(value)
  if (opportunity.radarVersion !== RADAR_VERSION) errors.push(`radarVersion debe ser ${RADAR_VERSION}.`)
  for (const key of ['id', 'title', 'description', 'problem', 'audience', 'category', 'status', 'createdAt']) if (!text(opportunity[key])) errors.push(`${key} es obligatorio.`)
  if (!Array.isArray(opportunity.signals) || opportunity.signals.length === 0) errors.push('signals no puede estar vacio.')
  else opportunity.signals.forEach((signal, index) => validateMarketSignal(signal).errors.forEach((error) => errors.push(`signals[${index}]: ${error}`)))
  if (!text(opportunity.monetizationHypothesis)) warnings.push('monetizationHypothesis esta ausente.')
  if (!Array.isArray(opportunity.evidence) || opportunity.evidence.length === 0) warnings.push('evidence esta vacia.')
  if (!validRating(opportunity.legalSensitivity)) errors.push('legalSensitivity debe ser un entero entre 0 y 5.')
  if (!validRating(opportunity.buildComplexity)) errors.push('buildComplexity debe ser un entero entre 0 y 5.')
  if (scanSensitive(opportunity.evidence)) errors.push('evidence parece contener valores sensibles.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateRadarEvaluationResult(value: unknown): RadarValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const result = record(value); const score = record(result.score); const decision = record(result.decision)
  if (!text(result.opportunityId)) errors.push('opportunityId es obligatorio.')
  if (typeof score.total !== 'number' || score.total < 0 || score.total > 100) errors.push('score.total debe estar entre 0 y 100.')
  if (Object.keys(record(score.breakdown)).length === 0 || typeof record(score.breakdown).rawTotal !== 'number') errors.push('score.breakdown debe ser consistente y contener rawTotal.')
  if (!RADAR_DECISIONS.includes(decision.type as typeof RADAR_DECISIONS[number])) errors.push('decision.type no es valida.')
  if (!Array.isArray(result.reasons) || result.reasons.length === 0) errors.push('reasons no puede estar vacio.')
  if (!Array.isArray(result.warnings)) errors.push('warnings debe ser un array.')
  if (!Array.isArray(result.risks)) errors.push('risks debe ser un array.')
  if (!text(result.recommendedNextStep)) errors.push('recommendedNextStep es obligatorio.')
  return { ok: errors.length === 0, errors, warnings }
}
