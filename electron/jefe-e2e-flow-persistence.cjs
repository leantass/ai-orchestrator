const fs = require('node:fs/promises')
const path = require('node:path')
const { canonical, validateFlow } = require('./jefe-e2e-flow-contract.cjs')

class E2EFlowPersistenceError extends Error { constructor(code, message) { super(message); this.name = 'E2EFlowPersistenceError'; this.code = code } }
function fail(code, message) { throw new E2EFlowPersistenceError(code, message) }
function inside(root, target) { const relative = path.relative(root, target); return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)) }
function createE2EFlowPersistence({ root } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Root invalido.')
  const authorityRoot = path.resolve(root); const flows = path.join(authorityRoot, 'flows'); const routing = path.join(authorityRoot, 'routing'); const receipts = path.join(authorityRoot, 'receipts'); const indexFile = path.join(authorityRoot, 'index.json'); const locks = new Map()
  const lock = async (key, work) => { const prior = locks.get(key) || Promise.resolve(); let release; const current = new Promise((resolve) => { release = resolve }); locks.set(key, current); await prior; try { return await work() } finally { release(); if (locks.get(key) === current) locks.delete(key) } }
  const target = (base, id) => { const result = path.resolve(base, `${id}.json`); if (!inside(authorityRoot, result)) fail('PATH_OUTSIDE_ROOT', 'Persistencia fuera del root.'); return result }
  async function atomic(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); const temp = `${file}.stage-${process.pid}-${Date.now()}`; await fs.writeFile(temp, `${canonical(value)}\n`, 'utf8'); await fs.rename(temp, file); return value }
  async function readJson(file) { try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return null; fail('CORRUPT_RECORD', 'Registro E2E corrupto.') } }
  async function readFlow(id) { const record = await readJson(target(flows, id)); return record ? validateFlow(record) : null }
  async function saveFlow(flow, { expectedRevision = null } = {}) { const clean = validateFlow(flow); return lock(clean.e2eFlowId, async () => { const prior = await readFlow(clean.e2eFlowId); if (prior) { if (expectedRevision === null && prior.inputFingerprint === clean.inputFingerprint) return { flow: prior, idempotent: true }; if (canonical(prior) === canonical(clean)) return { flow: prior, idempotent: true }; if (expectedRevision === null) fail('FLOW_COLLISION', 'La identidad E2E ya existe con otro contenido.'); if (prior.revision !== expectedRevision) fail('STALE_FLOW', 'El flow cambio antes de guardar.'); if (clean.revision !== prior.revision + 1) fail('INVALID_REVISION', 'La revision del flow no es consecutiva.') } else if (clean.revision !== 0) fail('INVALID_REVISION', 'El flow inicial debe tener revision cero.'); return { flow: validateFlow(await atomic(target(flows, clean.e2eFlowId), clean)), idempotent: false } }) }
  async function saveRouting(decision) { const file = target(routing, decision.routeDecisionId); return lock(decision.routeDecisionId, async () => { const prior = await readJson(file); if (prior && canonical(prior) !== canonical(decision)) fail('ROUTING_COLLISION', 'La decision de routing es inmutable.'); return prior || atomic(file, decision) }) }
  async function readRouting(id) { return readJson(target(routing, id)) }
  async function saveReceipt(id, value) { return lock(id, async () => { const file = target(receipts, id); const prior = await readJson(file); if (prior && canonical(prior) !== canonical(value)) fail('RECEIPT_COLLISION', 'Receipt incompatible.'); return prior || atomic(file, value) }) }
  async function readReceipt(id) { return readJson(target(receipts, id)) }
  async function listFlows() { const names = await fs.readdir(flows).catch(() => []); const result = []; for (const name of names.filter((item) => item.endsWith('.json')).sort()) { try { const flow = await readFlow(name.slice(0, -5)); if (flow) result.push(flow) } catch {} } return result }
  async function rebuildIndex() { const records = await listFlows(); const index = { schemaVersion: 'jefe-e2e-index/v1', flowIds: records.map((item) => item.e2eFlowId).sort(), projectAssociations: records.map((item) => ({ e2eFlowId: item.e2eFlowId, projectId: item.identity.projectId })).sort((a, b) => a.e2eFlowId.localeCompare(b.e2eFlowId)) }; await atomic(indexFile, index); return index }
  async function readIndex() { const index = await readJson(indexFile); return index || rebuildIndex() }
  return Object.freeze({ authorityRoot, readFlow, saveFlow, saveRouting, readRouting, saveReceipt, readReceipt, listFlows, rebuildIndex, readIndex })
}
module.exports = { E2EFlowPersistenceError, createE2EFlowPersistence }
