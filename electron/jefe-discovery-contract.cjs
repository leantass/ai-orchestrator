const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')

const STATES = Object.freeze(['draft', 'needs_clarification', 'ready_for_discovery', 'restricted', 'blocked', 'not_connected', 'prepared', 'completed', 'failed'])
const PRIORITIES = Object.freeze(['low', 'normal', 'high', 'critical'])
const ID = /^[a-z][a-z0-9-]{2,80}$/u
const FORBIDDEN = /file:\/\/|password|token|secret|cookie|authorization|system.?prompt|ignore previous|command|shell|deploy|published/iu
class DiscoveryContractError extends Error { constructor(code, message) { super(message); this.code = code } }
function fail(code, message) { throw new DiscoveryContractError(code, message) }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function text(value, required = false, max = 1000) { if (value === undefined || value === null || value === '') { if (required) fail('MISSING_FIELD', 'Falta un dato requerido.'); return null }; if (typeof value !== 'string' || value.length > max || /[\x00-\x1f\x7f]/u.test(value) || /\.\.[\\/]|(?:^|\s)[a-z]:[\\/]|(?:^|\s)\/[\w.-]/iu.test(value) || FORBIDDEN.test(value)) fail('INVALID_TEXT', 'Texto invalido.'); return value.trim() || null }
function identity(value) { if (value === undefined) return null; if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_IDENTITY', 'Identidad invalida.'); const keys = Object.keys(value).sort(); const accepted = canonical(keys) === canonical(['projectId']) || canonical(keys) === canonical(['projectId', 'runId']) || canonical(keys) === canonical(['projectId', 'runId', 'versionId']); if (!accepted || Object.values(value).some((item) => typeof item !== 'string' || !ID.test(item))) fail('INVALID_IDENTITY', 'Identidad invalida.'); return Object.fromEntries(keys.map((key) => [key, value[key]])) }
function reference(value) { if (!value || typeof value !== 'object' || Array.isArray(value) || canonical(Object.keys(value).sort()) !== canonical(['kind', 'value']) || value.kind !== 'url' || typeof value.value !== 'string' || value.value.length > 500) fail('INVALID_REFERENCE', 'Referencia invalida.'); let url; try { url = new URL(value.value) } catch { fail('INVALID_REFERENCE', 'Referencia invalida.') }; const host = url.hostname.toLowerCase().replace(/^\[|\]$/gu, ''); if (url.protocol !== 'https:' || url.username || url.password || host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host === '0.0.0.0' || /^127(?:\.\d{1,3}){3}$/u.test(host)) fail('INVALID_REFERENCE', 'Referencia invalida.'); return { kind: 'url', value: url.toString(), trust: 'external_reference_unverified' } }
function list(value, max = 12) { if (value === undefined) return []; if (!Array.isArray(value) || value.length > max) fail('INVALID_LIST', 'Lista invalida.'); return value.map((item) => text(item, true, 500)) }
function validateIntake(raw, now) {
  const allowed = ['objective', 'expectedOutcome', 'audience', 'problem', 'scope', 'constraints', 'materials', 'references', 'questions', 'assumptions', 'risks', 'priority', 'responsible', 'projectType', 'platform', 'identity', 'revisionOf']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some((key) => !allowed.includes(key))) fail('INVALID_INTAKE', 'Intake invalido.')
  const record = { schemaVersion: 'jefe-supervised-intake/v1', objective: text(raw.objective, false), expectedOutcome: text(raw.expectedOutcome, false), audience: text(raw.audience), problem: text(raw.problem), scope: text(raw.scope), constraints: list(raw.constraints), materials: list(raw.materials), references: (raw.references || []).map(reference), questions: list(raw.questions), assumptions: list(raw.assumptions), risks: list(raw.risks), priority: raw.priority === undefined ? 'normal' : raw.priority, responsible: raw.responsible === undefined ? 'lean' : text(raw.responsible, true, 80), projectType: text(raw.projectType), platform: text(raw.platform), identity: identity(raw.identity), revisionOf: raw.revisionOf === undefined ? null : text(raw.revisionOf, true, 100), provenance: 'human_input', actor: 'lean', authority: 'human_decision', createdAt: now }
  if (!PRIORITIES.includes(record.priority)) fail('INVALID_PRIORITY', 'Prioridad invalida.')
  record.state = !record.objective || !record.expectedOutcome ? 'needs_clarification' : record.materials.length ? 'restricted' : record.identity && Object.hasOwn(record.identity, 'versionId') ? 'ready_for_discovery' : 'draft'
  record.nextResponsible = record.state === 'ready_for_discovery' ? 'jefe' : 'lean'
  record.intakeId = `intake-${digest({ ...record, intakeId: undefined }).slice(0, 32)}`
  return record
}
module.exports = { STATES, PRIORITIES, DiscoveryContractError, validateIntake }
