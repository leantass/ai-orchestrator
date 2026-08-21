const { canonical, validateRequest } = require('./jefe-context-package-contract.cjs')
const { buildContextPackage } = require('./jefe-context-package-builder.cjs')
const { AGENTS, AgentContextError, createAgentContextAdapters, freeze, validateHandoff, validatePackageIntegrity } = require('./jefe-agent-context-adapters.cjs')
function fail(code, message) { throw new AgentContextError(code, message) }
function clone(value) { return JSON.parse(canonical(value)) }
function hasOnly(value, keys) { return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key)) }
function cleanRequest(value) { if (!hasOnly(value, ['targetAgent', 'purpose', 'scope', 'identity', 'budget'])) fail('INVALID_PREPARE_REQUEST', 'La solicitud de contexto no es valida.'); return validateRequest(value) }
function cleanConsumers(consumers = {}) {
  if (!consumers || typeof consumers !== 'object' || Array.isArray(consumers)) fail('INVALID_CONSUMER_REGISTRY', 'El registro de consumidores no es valido.')
  const result = {}; for (const [agent, consumer] of Object.entries(consumers)) { if (!AGENTS.includes(agent) || typeof consumer !== 'function') fail('UNKNOWN_CONSUMER', 'El consumidor registrado no es valido.'); result[agent] = consumer }
  return Object.freeze(result)
}
function sanitizeResult(value, depth = 0) {
  if (depth > 6 || value === null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return value.length <= 2000 ? value : value.slice(0, 2000)
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeResult(item, depth + 1))
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 50).filter(([key]) => !/password|token|secret|authorization|cookie/iu.test(key)).map(([key, item]) => [key, sanitizeResult(item, depth + 1)]))
  return null
}
function createAgentContextService({ readMemory, buildPackage = buildContextPackage, consumers = {} } = {}) {
  if (typeof readMemory !== 'function' || typeof buildPackage !== 'function') fail('INVALID_DEPENDENCY', 'Las dependencias del servicio no son validas.')
  const registry = cleanConsumers(consumers); const adapters = createAgentContextAdapters()
  async function prepareAgentContext(request) {
    const safeRequest = cleanRequest(request)
    const memory = await readMemory(freeze(clone({ scope: safeRequest.scope, identity: safeRequest.identity })))
    if (!memory || typeof memory !== 'object' || Array.isArray(memory) || !Object.hasOwn(memory, 'snapshot') || !Object.hasOwn(memory, 'syncStatus')) fail('INVALID_MEMORY_READ', 'La lectura de MEMORIA no es valida.')
    const pkg = validatePackageIntegrity(buildPackage({ ...safeRequest, snapshot: memory.snapshot, syncStatus: memory.syncStatus }))
    if (pkg.targetAgent !== safeRequest.targetAgent || pkg.purpose !== safeRequest.purpose || canonical(pkg.identity) !== canonical(safeRequest.identity)) fail('PACKAGE_REQUEST_MISMATCH', 'El paquete no coincide con la solicitud.')
    const consumerStatus = registry[pkg.targetAgent] ? 'registered_internal' : 'not_connected'
    return freeze({ package: freeze(clone(pkg)), handoff: adapters[pkg.targetAgent](pkg, consumerStatus) })
  }
  async function consumeAgentContext(prepared) {
    if (!prepared || typeof prepared !== 'object' || Array.isArray(prepared) || !Object.hasOwn(prepared, 'package') || !Object.hasOwn(prepared, 'handoff')) fail('INVALID_CONSUME_REQUEST', 'El consumo de contexto no es valido.')
    const pkg = validatePackageIntegrity(prepared.package); const handoff = validateHandoff(prepared.handoff, pkg.targetAgent)
    const expectedStatus = registry[pkg.targetAgent] ? 'registered_internal' : 'not_connected'; const expected = adapters[pkg.targetAgent](pkg, expectedStatus)
    if (canonical(handoff) !== canonical(expected)) fail('HANDOFF_PACKAGE_MISMATCH', 'El handoff no coincide con el paquete validado.')
    if (pkg.disposition === 'blocked') return freeze({ package: freeze(clone(pkg)), handoff, consumerStatus: expectedStatus, deliveryStatus: 'blocked', consumerResult: null })
    const consumer = registry[pkg.targetAgent]
    if (!consumer) return freeze({ package: freeze(clone(pkg)), handoff, consumerStatus: 'not_connected', deliveryStatus: 'not_connected', consumerResult: null })
    try { const result = await consumer(freeze({ package: freeze(clone(pkg)), handoff: freeze(clone(handoff)) })); return freeze({ package: freeze(clone(pkg)), handoff, consumerStatus: 'consumed_internal', deliveryStatus: 'consumed', consumerResult: { trust: 'untrusted', persistence: 'not_persisted', authority: 'not_authoritative', data: sanitizeResult(result) } }) } catch { return freeze({ package: freeze(clone(pkg)), handoff, consumerStatus: 'failed', deliveryStatus: 'failed', consumerResult: null, error: { code: 'CONSUMER_FAILED', message: 'El consumidor interno no pudo procesar el contexto.' } }) }
  }
  return freeze({ prepareAgentContext, consumeAgentContext })
}
module.exports = { createAgentContextService, sanitizeResult }
