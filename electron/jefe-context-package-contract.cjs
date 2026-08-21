const crypto = require('crypto')

const AGENT_PURPOSES = Object.freeze({ cerebro: 'supervision', jefe: 'supervision', radar: 'discovery', hermes: 'research', scout: 'research', planner: 'planning', codex: 'execution', qa: 'validation' })
const PURPOSES = Object.freeze(['supervision', 'discovery', 'research', 'planning', 'execution', 'validation'])
const SCOPES = Object.freeze({ project: ['projectId'], run: ['projectId', 'runId'], version: ['projectId', 'runId', 'versionId'] })
const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u
const SENSITIVE = /password|access.?token|refresh.?token|api.?key|secret|cookie|authorization|bearer/iu

class ContextPackageError extends Error { constructor(code, message) { super(message); this.name = 'ContextPackageError'; this.code = code } }
function fail(code, message) { throw new ContextPackageError(code, message) }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (!value || typeof value !== 'object') return value; return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out }, {}) }
function canonical(value) { return JSON.stringify(stable(value)) }
function checksum(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function validIdentity(scope, identity) {
  const keys = SCOPES[scope]
  if (!keys || !identity || typeof identity !== 'object' || Array.isArray(identity) || canonical(Object.keys(identity).sort()) !== canonical(keys)) fail('INVALID_IDENTITY', 'La identidad del paquete no es compatible con su scope.')
  const out = {}; for (const key of keys) { if (typeof identity[key] !== 'string' || !ID.test(identity[key])) fail('INVALID_IDENTITY', 'La identidad del paquete no es compatible con su scope.'); out[key] = identity[key] }
  return out
}
function validBudget(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_BUDGET', 'El presupuesto del paquete no es valido.')
  const maxEntries = value.maxEntries === undefined ? 20 : value.maxEntries
  const maxCharacters = value.maxCharacters === undefined ? 8000 : value.maxCharacters
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || maxEntries > 50 || !Number.isSafeInteger(maxCharacters) || maxCharacters < 200 || maxCharacters > 16000) fail('INVALID_BUDGET', 'El presupuesto del paquete no es valido.')
  return { maxEntries, maxCharacters }
}
function validateRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) fail('INVALID_REQUEST', 'La solicitud de paquete no es valida.')
  const targetAgent = request.targetAgent
  const purpose = request.purpose
  if (!Object.hasOwn(AGENT_PURPOSES, targetAgent) || !PURPOSES.includes(purpose) || AGENT_PURPOSES[targetAgent] !== purpose) fail('INVALID_AGENT_PURPOSE', 'La combinacion agente/proposito no esta permitida.')
  const scope = request.scope
  return { targetAgent, purpose, scope, identity: validIdentity(scope, request.identity), budget: validBudget(request.budget) }
}
function safeText(value) { return typeof value === 'string' && value.length <= 4000 && !SENSITIVE.test(value) && !/[A-Za-z]:[\\/]/u.test(value) && !/(?:^|\s)(?:\/[^\s]*)/u.test(value) }
function validatePackage(value) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== 'jefe-context-package/v1') fail('INVALID_PACKAGE', 'El paquete de contexto no es valido.')
  const request = validateRequest(value)
  if (typeof value.packageId !== 'string' || !/^context-package-[a-f0-9]{32}$/u.test(value.packageId)) fail('INVALID_PACKAGE', 'El paquete de contexto no es valido.')
  if (!['ready', 'restricted', 'blocked'].includes(value.disposition) || !Array.isArray(value.blockers) || !Array.isArray(value.omissions) || !value.context || !value.source || !value.integrity) fail('INVALID_PACKAGE', 'El paquete de contexto no es valido.')
  if (canonical(request.identity) !== canonical(value.identity) || request.scope !== value.scope || request.targetAgent !== value.targetAgent || request.purpose !== value.purpose) fail('INVALID_PACKAGE', 'El paquete de contexto no es valido.')
  return stable(value)
}

module.exports = { AGENT_PURPOSES, PURPOSES, SCOPES, ContextPackageError, canonical, checksum, safeText, validateRequest, validatePackage }
