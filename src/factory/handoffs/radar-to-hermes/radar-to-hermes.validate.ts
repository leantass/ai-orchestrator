import { validateJefeHermesResearchRequest } from '../../adapters/jefe-hermes/index.ts'
import { validateMarketOpportunity, validateRadarEvaluationResult } from '../../radar/index.ts'
import { RADAR_TO_HERMES_HANDOFF_KIND, RADAR_TO_HERMES_HANDOFF_VERSION } from './radar-to-hermes.defaults.ts'
import type { RadarToHermesValidationResult } from './radar-to-hermes.types.ts'
type R = Record<string, unknown>
const rec = (value: unknown): R => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as R : {}
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const secret = (value: unknown) => /(api[_-]?key|password|secret|token)\s*[:=]\s*\S+/iu.test(JSON.stringify(value))

export function validateRadarToHermesHandoffInput(value: unknown): RadarToHermesValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const input = rec(value); const opportunity = rec(input.opportunity); const evaluation = rec(input.evaluation)
  if (Object.keys(opportunity).length === 0) errors.push('opportunity es obligatoria.')
  if (Object.keys(evaluation).length === 0) errors.push('evaluation es obligatoria.')
  if (!text(input.requestedBy)) errors.push('requestedBy es obligatorio.'); if (!text(input.createdAt)) errors.push('createdAt es obligatorio.')
  if (!text(opportunity.id)) errors.push('opportunity.id es obligatorio.'); if (!text(opportunity.problem)) errors.push('opportunity.problem es obligatorio.'); if (!text(opportunity.audience)) errors.push('opportunity.audience es obligatoria.')
  if (Object.keys(opportunity).length > 0) { const result = validateMarketOpportunity(opportunity); errors.push(...result.errors.map((error) => `opportunity: ${error}`)); warnings.push(...result.warnings.map((warning) => `opportunity: ${warning}`)) }
  if (Object.keys(evaluation).length > 0) { const result = validateRadarEvaluationResult(evaluation); errors.push(...result.errors.map((error) => `evaluation: ${error}`)); warnings.push(...result.warnings.map((warning) => `evaluation: ${warning}`)) }
  const decision = rec(evaluation.decision); if (!text(decision.type)) errors.push('evaluation.decision.type es obligatorio.')
  const score = rec(evaluation.score); if (typeof score.total !== 'number' || score.total < 0 || score.total > 100) errors.push('evaluation.score.total debe estar entre 0 y 100.')
  if (secret(value)) errors.push('El input parece contener secretos.')
  const rawEvidenceLength = JSON.stringify(opportunity.evidence ?? []).length + JSON.stringify(opportunity.signals ?? []).length
  if (rawEvidenceLength > 50000) errors.push('El input contiene evidencia cruda excesiva para un handoff.')
  else if (rawEvidenceLength > 15000) warnings.push('El input contiene evidencia extensa; el mapper solo conservara contexto resumido.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateRadarToHermesHandoffResult(value: unknown): RadarToHermesValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const result = rec(value)
  if (result.handoffKind !== RADAR_TO_HERMES_HANDOFF_KIND) errors.push('handoffKind no es valido.'); if (result.handoffVersion !== RADAR_TO_HERMES_HANDOFF_VERSION) errors.push('handoffVersion no es valida.')
  if (result.targetAdapterName !== 'JefeHermesAdapter') errors.push('targetAdapterName debe ser JefeHermesAdapter.'); if (result.targetExternalToolName !== 'Hermes Agent') errors.push('targetExternalToolName debe ser Hermes Agent.'); if (result.targetMode !== 'read_only_adapter') errors.push('targetMode debe ser read_only_adapter.')
  if (result.codexAllowed !== false) errors.push('codexAllowed debe ser false.'); if (result.directProjectCreationAllowed !== false) errors.push('directProjectCreationAllowed debe ser false.'); if (result.runtimeExecutionAllowed !== false) errors.push('runtimeExecutionAllowed debe ser false.')
  if (!text(result.recommendedNextStep)) errors.push('recommendedNextStep es obligatorio.')
  if (result.requestCreated === true) {
    if (Object.keys(rec(result.researchRequest)).length === 0) errors.push('researchRequest es obligatorio cuando requestCreated=true.')
    else { const validation = validateJefeHermesResearchRequest(result.researchRequest); errors.push(...validation.errors.map((error) => `researchRequest: ${error}`)); warnings.push(...validation.warnings) }
    if (text(result.blockedReason)) errors.push('Un handoff con request no debe tener blockedReason.')
  } else if (!text(result.blockedReason)) errors.push('blockedReason es obligatorio cuando no se crea request.')
  return { ok: errors.length === 0, errors, warnings }
}
