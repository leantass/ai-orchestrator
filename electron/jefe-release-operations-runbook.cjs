'use strict'

const RUNBOOK_SCHEMA = 'jefe-release-operations-runbook/v1'

const DEFINITIONS = Object.freeze([
  ['historical_lint_debt', 'Deuda historica de calidad', 'La calidad CI remota esta bloqueada por deuda tecnica historica.', 'fix_local_quality_debt', false, 'quality', 'quality-owner', 'medium'],
  ['remote_ci_failed', 'CI remoto fallido', 'La ejecucion remota de CI termino con fallo.', 'review_ci_failure', true, 'ci', 'release-operations', 'medium'],
  ['remote_ci_unavailable', 'CI remoto no disponible', 'No hay evidencia remota confiable para decidir.', 'retry_ci_observation', true, 'ci', 'release-operations', 'medium'],
  ['repository_stale', 'Repositorio desactualizado', 'La base del repositorio ya no coincide con la evidencia aprobada.', 'create_new_repository_baseline', true, 'release', 'release-recovery', 'high'],
  ['delivery_tampered', 'Entrega alterada', 'La entrega no coincide con su integridad registrada.', 'create_new_repository_baseline', true, 'delivery', 'e2e-recovery', 'high'],
  ['human_rejection', 'Revision humana rechazo la version', 'La decision humana requiere una nueva correccion.', 'create_correction', true, 'human-gate', 'human-gate', 'medium'],
  ['qa_failed', 'QA fallo', 'La version no supero la evidencia QA requerida.', 'repair_qa_failure', true, 'qa', 'qa-owner', 'medium'],
  ['remote_authorization_missing', 'Falta autorizacion remota', 'La accion remota no tiene autorizacion durable compatible.', 'request_remote_authorization', true, 'authorization', 'release-governance', 'high'],
  ['remote_authorization_expired', 'Autorizacion expirada', 'La autorizacion ya no puede utilizarse.', 'request_remote_authorization', true, 'authorization', 'release-governance', 'high'],
  ['remote_authorization_revoked', 'Autorizacion revocada', 'La autorizacion fue revocada y no se puede reutilizar.', 'request_remote_authorization', true, 'authorization', 'release-governance', 'high'],
  ['governance_decision_stale', 'Decision de governance desactualizada', 'La evidencia ligada a la decision cambio.', 'create_new_governance_snapshot', true, 'governance', 'governance-recovery', 'high'],
  ['e2e_recovery_required', 'Recovery E2E requerido', 'La evidencia E2E necesita diagnostico o reconciliacion.', 'run_e2e_recovery', true, 'e2e', 'e2e-recovery', 'high'],
  ['release_recovery_required', 'Recovery de release requerido', 'La evidencia de release necesita reconciliacion.', 'run_release_recovery', true, 'release', 'release-recovery', 'high'],
  ['governance_recovery_required', 'Recovery de governance requerido', 'La evidencia de governance necesita diagnostico.', 'run_governance_recovery', true, 'governance', 'governance-recovery', 'high'],
  ['source_unavailable', 'Fuente no disponible', 'Una fuente operativa no pudo leerse.', 'wait', false, 'observability', 'operations', 'low'],
  ['deploy_not_connected', 'Deploy no conectado', 'No existe un adaptador de deploy conectado.', 'capability_not_connected', false, 'production', 'platform', 'high'],
])

const ACTION_LABELS = Object.freeze({
  fix_local_quality_debt: 'Corregir deuda de calidad local', review_ci_failure: 'Revisar el fallo de CI', retry_ci_observation: 'Esperar o consultar CI de nuevo', create_new_repository_baseline: 'Crear una nueva base verificable', request_human_review: 'Solicitar revision humana', create_correction: 'Crear una correccion', repair_qa_failure: 'Corregir y repetir QA', request_remote_authorization: 'Obtener autorizacion remota explicita', create_new_governance_snapshot: 'Crear un snapshot de governance nuevo', run_e2e_recovery: 'Ejecutar recovery E2E controlado', run_release_recovery: 'Ejecutar recovery de release controlado', run_governance_recovery: 'Ejecutar recovery de governance controlado', wait_for_human: 'Esperar decision humana', wait: 'Esperar una fuente confiable', capability_not_connected: 'Conectar la capacidad fuera de este flujo',
})

function createRunbookRegistry() {
  const entries = DEFINITIONS.map(([code, label, reason, nextAction, humanRequired, domain, recoveryOwner, productionRisk]) => Object.freeze({ schemaVersion: RUNBOOK_SCHEMA, code, label, reason, nextAction, nextActionLabel: ACTION_LABELS[nextAction] || nextAction, humanRequired, automatic: false, domain, recoveryOwner, productionRisk }))
  const byCode = new Map(entries.map((entry) => [entry.code, entry]))
  return Object.freeze({ schemaVersion: RUNBOOK_SCHEMA, entries, get: (code) => byCode.get(code) || byCode.get('source_unavailable'), nextActionLabel: (code) => ACTION_LABELS[code] || 'Revisar evidencia', })
}

module.exports = { RUNBOOK_SCHEMA, ACTION_LABELS, createRunbookRegistry }
