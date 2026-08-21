const { AGENT_PURPOSES, canonical, checksum, validatePackage } = require('./jefe-context-package-contract.cjs')
const HANDOFF_SCHEMA = 'jefe-agent-context-handoff/v1'
const AGENTS = Object.freeze(Object.keys(AGENT_PURPOSES))
const PACKAGE_ALLOWED_USE = Object.freeze({ ready: Object.freeze(['read_context', 'prepare_draft']), restricted: Object.freeze(['read_context', 'clarify', 'research', 'prepare_draft']), blocked: Object.freeze([]) })
const ADAPTER_VIEWS = Object.freeze({
  cerebro: Object.freeze({ role: 'supervision', sections: Object.freeze(['objective', 'decisions', 'risks', 'conflicts', 'outcomes', 'failures', 'corrections']) }),
  radar: Object.freeze({ role: 'discovery', sections: Object.freeze(['objective', 'requirements', 'constraints', 'evidence', 'assumptions', 'questions']) }),
  hermes: Object.freeze({ role: 'research', sections: Object.freeze(['objective', 'questions', 'constraints', 'evidence', 'risks']) }),
  scout: Object.freeze({ role: 'research_support', sections: Object.freeze(['objective', 'questions', 'constraints', 'evidence', 'risks']) }),
  jefe: Object.freeze({ role: 'supervision_control', sections: Object.freeze(['objective', 'decisions', 'risks', 'conflicts', 'outcomes', 'failures', 'corrections']) }),
  planner: Object.freeze({ role: 'planning', sections: Object.freeze(['objective', 'requirements', 'constraints', 'decisions', 'evidence', 'risks', 'corrections']) }),
  codex: Object.freeze({ role: 'implementation_draft', sections: Object.freeze(['objective', 'requirements', 'constraints', 'decisions', 'corrections', 'evidence']) }),
  qa: Object.freeze({ role: 'validation_review', sections: Object.freeze(['requirements', 'decisions', 'evidence', 'validations', 'failures', 'corrections', 'risks']) }),
})
const POLICY_BOUNDARY = Object.freeze({ contextIsData: true, noCapabilitiesGranted: true, noNetworkGranted: true, noFilesystemGranted: true, noDeployGranted: true, noPushGranted: true, noHumanAuthorityGranted: true, referencesAreNotEvidence: true, outputsAreUntrusted: true })
class AgentContextError extends Error { constructor(code, message) { super(message); this.name = 'AgentContextError'; this.code = code } }
function fail(code, message) { throw new AgentContextError(code, message) }
function clone(value) { return JSON.parse(canonical(value)) }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const item of Object.values(value)) freeze(item) }; return value }
function same(left, right) { return canonical(left) === canonical(right) }
function exactKeys(value, keys) { return value && typeof value === 'object' && !Array.isArray(value) && same(Object.keys(value).sort(), [...keys].sort()) }
function packageBase(value) { const { packageId, integrity, ...base } = value; return base }
function expectedPackageId(value) { return `context-package-${checksum(packageBase(value)).slice(0, 32)}` }
function allowedUseFor(agent, disposition) { if (disposition === 'blocked') return []; return ['radar', 'hermes', 'scout'].includes(agent) ? ['read_context', 'clarify', 'research'] : ['read_context', 'prepare_draft'] }
function validatePackageIntegrity(value) {
  const pkg = validatePackage(value)
  if (!same(pkg.allowedUse, PACKAGE_ALLOWED_USE[pkg.disposition])) fail('INVALID_ALLOWED_USE', 'Los usos permitidos del paquete no son validos.')
  const packageId = expectedPackageId(pkg)
  if (pkg.packageId !== packageId || !pkg.integrity || pkg.integrity.algorithm !== 'sha256' || pkg.integrity.deterministic !== true || pkg.integrity.checksum !== checksum({ ...packageBase(pkg), packageId })) fail('PACKAGE_INTEGRITY_FAILED', 'La integridad del paquete de contexto no es valida.')
  return clone(pkg)
}
function handoffBase(pkg, consumerStatus) { return { schemaVersion: HANDOFF_SCHEMA, packageId: pkg.packageId, targetAgent: pkg.targetAgent, purpose: pkg.purpose, identity: clone(pkg.identity), disposition: pkg.disposition, allowedUse: allowedUseFor(pkg.targetAgent, pkg.disposition), policyBoundary: clone(POLICY_BOUNDARY), contextData: { adapterView: clone(ADAPTER_VIEWS[pkg.targetAgent]), sections: clone(pkg.context) }, sourceIntegrity: clone(pkg.integrity), consumerStatus } }
function makeHandoff(pkg, consumerStatus = 'not_connected') {
  if (!['not_connected', 'registered_internal'].includes(consumerStatus)) fail('INVALID_CONSUMER_STATUS', 'El estado del consumidor no es valido.')
  const valid = validatePackageIntegrity(pkg); const base = handoffBase(valid, consumerStatus)
  return freeze({ schemaVersion: HANDOFF_SCHEMA, handoffId: `agent-handoff-${checksum(base).slice(0, 32)}`, ...base })
}
function validateHandoff(value, expectedAgent) {
  const keys = ['schemaVersion', 'handoffId', 'packageId', 'targetAgent', 'purpose', 'identity', 'disposition', 'allowedUse', 'policyBoundary', 'contextData', 'sourceIntegrity', 'consumerStatus']
  if (!exactKeys(value, keys) || value.schemaVersion !== HANDOFF_SCHEMA || typeof value.handoffId !== 'string' || !/^agent-handoff-[a-f0-9]{32}$/u.test(value.handoffId) || !AGENTS.includes(value.targetAgent) || (expectedAgent && value.targetAgent !== expectedAgent)) fail('INVALID_HANDOFF', 'El handoff de contexto no es valido.')
  const base = { ...value }; delete base.handoffId
  if (value.handoffId !== `agent-handoff-${checksum(base).slice(0, 32)}` || !same(value.policyBoundary, POLICY_BOUNDARY) || !same(value.allowedUse, allowedUseFor(value.targetAgent, value.disposition)) || !ADAPTER_VIEWS[value.targetAgent] || !same(value.contextData.adapterView, ADAPTER_VIEWS[value.targetAgent])) fail('HANDOFF_INTEGRITY_FAILED', 'La integridad del handoff no es valida.')
  return freeze(clone(value))
}
function createAgentContextAdapters() { return freeze(Object.fromEntries(AGENTS.map((agent) => [agent, (pkg, consumerStatus) => { const valid = validatePackageIntegrity(pkg); if (valid.targetAgent !== agent || valid.purpose !== AGENT_PURPOSES[agent]) fail('WRONG_TARGET_AGENT', 'El paquete no pertenece al adaptador solicitado.'); return makeHandoff(valid, consumerStatus) }]))) }
module.exports = { ADAPTER_VIEWS, AGENTS, HANDOFF_SCHEMA, POLICY_BOUNDARY, AgentContextError, createAgentContextAdapters, freeze, makeHandoff, validateHandoff, validatePackageIntegrity }
