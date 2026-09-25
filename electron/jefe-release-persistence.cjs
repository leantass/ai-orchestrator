const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { physicalRootKey, resolvePhysicalRoot } = require('./jefe-physical-root.cjs')
const { validateReleaseRequest, validateRemoteActionAuthorization, hashDeliveryManifest } = require('./jefe-release-contract.cjs')

const FLOW_SCHEMA = 'jefe-release-flow/v1'
const OUTBOX_SCHEMA = 'jefe-release-outbox/v1'
const INDEX_SCHEMA = 'jefe-release-index/v1'
const FLOW_STATES = Object.freeze(['prepared', 'preflight_passed', 'waiting_authorization', 'ready_for_execution', 'outbox_pending', 'completed_local', 'stale', 'blocked', 'executing', 'evidence_pending', 'completed', 'failed'])
const locks = new Map()
let sequence = 0

class ReleasePersistenceError extends Error { constructor(code, message, details = {}) { super(message); this.name = 'ReleasePersistenceError'; this.code = code; this.details = details } }
function fail(code, message, details = {}) { throw new ReleasePersistenceError(code, message, details) }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (!value || typeof value !== 'object') return JSON.stringify(value); return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
function clone(value) { return JSON.parse(canonical(value)) }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function id(value, field) { if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,40}$/u.test(value)) fail('INVALID_RELEASE_ID', `${field} is invalid.`); return value }
function timestamp(value, field) { if (typeof value !== 'string' || !value.trim() || Number.isNaN(Date.parse(value))) fail('INVALID_RELEASE_FIELD', `${field} is invalid.`); return value }
function locked(key, work) { const previous = locks.get(key) || Promise.resolve(); let release; const tail = new Promise((resolve) => { release = resolve }); locks.set(key, tail); return previous.then(work).finally(() => { release(); if (locks.get(key) === tail) locks.delete(key) }) }
function safeAction(value) { if (!['prepare_local_delivery', 'prepare_git_commit', 'request_ci', 'prepare_release'].includes(value)) fail('RELEASE_ACTION_INVALID', 'Release action is not allowed.'); return value }
function safeState(value) { if (!FLOW_STATES.includes(value)) fail('RELEASE_FLOW_STATE_INVALID', 'Release flow state is not allowed.'); return value }
function validateFlow(flow) {
  if (!flow || flow.schemaVersion !== FLOW_SCHEMA) fail('CORRUPT_RELEASE_FLOW', 'Release flow schema is invalid.')
  id(flow.releaseFlowId, 'releaseFlowId'); id(flow.requestId, 'requestId'); safeAction(flow.requestedAction); safeState(flow.state)
  if (!Number.isInteger(flow.revision) || flow.revision < 0) fail('CORRUPT_RELEASE_FLOW', 'Release flow revision is invalid.')
  const identity = flow.identity
  if (!identity || id(identity.projectId, 'identity.projectId') !== identity.projectId || id(identity.versionId, 'identity.versionId') !== identity.versionId || !/^[a-f0-9]{64}$/u.test(identity.snapshotSha256) || identity.snapshotSha256 !== identity.approvalSnapshotSha256 || id(identity.approvalId, 'identity.approvalId') !== identity.approvalId) fail('CORRUPT_RELEASE_FLOW', 'Release flow identity is invalid.')
  if (!flow.repositoryBaseline || typeof flow.repositoryBaseline !== 'object' || typeof flow.repositoryBaseline.repoIdentity !== 'string' || typeof flow.repositoryBaseline.expectedBranch !== 'string' || !/^[a-f0-9]{64}$/u.test(flow.repositoryBaseline.expectedHeadSha)) fail('CORRUPT_RELEASE_FLOW', 'Release flow repository binding is invalid.')
  if (flow.deliveryBinding !== null && (!flow.deliveryBinding || typeof flow.deliveryBinding.deliveryId !== 'string' || !/^[a-f0-9]{64}$/u.test(flow.deliveryBinding.deliveryManifestSha256))) fail('CORRUPT_RELEASE_FLOW', 'Release flow delivery binding is invalid.')
  if (!Array.isArray(flow.authorizationRefs) || !Array.isArray(flow.outboxRefs)) fail('CORRUPT_RELEASE_FLOW', 'Release flow references are invalid.')
  timestamp(flow.createdAt, 'createdAt'); timestamp(flow.updatedAt, 'updatedAt')
  return flow
}
function validateOutbox(item) {
  if (!item || item.schemaVersion !== OUTBOX_SCHEMA) fail('CORRUPT_RELEASE_OUTBOX', 'Outbox schema is invalid.')
  for (const [field, value] of Object.entries({ outboxId: item.outboxId, requestId: item.requestId, releaseFlowId: item.releaseFlowId, projectId: item.projectId, versionId: item.versionId, authorizationId: item.authorizationId })) id(value, field)
  safeAction(item.action === 'trigger_ci' ? 'request_ci' : item.action === 'release_tag' ? 'prepare_release' : item.action)
  if (!item.repository || typeof item.repository.repoIdentity !== 'string' || typeof item.repository.expectedBranch !== 'string' || !/^[a-f0-9]{64}$/u.test(item.repository.expectedHeadSha)) fail('CORRUPT_RELEASE_OUTBOX', 'Outbox repository binding is invalid.')
  if (!/^[a-f0-9]{64}$/u.test(item.payloadFingerprint)) fail('CORRUPT_RELEASE_OUTBOX', 'Outbox payload fingerprint is invalid.')
  timestamp(item.createdAt, 'createdAt'); return item
}
function validateStoredAuthorization(value) { return validateRemoteActionAuthorization(value) }

function createReleasePersistence({ root, failureInjection = null } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Release root must be absolute.')
  if (failureInjection !== null && typeof failureInjection !== 'function') fail('INVALID_FAILURE_INJECTION', 'Failure injection must be a function.')
  const authorityRoot = resolvePhysicalRoot(path.join(root, '.jefe-release'))
  const lockKey = physicalRootKey(authorityRoot)
  const dirs = { requests: path.join(authorityRoot, 'requests'), flows: path.join(authorityRoot, 'flows'), authorizations: path.join(authorityRoot, 'authorizations'), outbox: path.join(authorityRoot, 'outbox'), indices: path.join(authorityRoot, 'indices') }
  const file = (kind, recordId) => { id(recordId, `${kind}Id`); return path.join(dirs[kind], `${recordId}.json`) }
  async function atomic(target, value) {
    const stage = `${target}.${process.pid}.${Date.now()}.${++sequence}.${crypto.randomBytes(4).toString('hex')}.stage`
    await fs.promises.mkdir(path.dirname(target), { recursive: true })
    try { await fs.promises.writeFile(stage, `${canonical(value)}\n`, 'utf8'); if (failureInjection && await failureInjection({ target, value: clone(value) })) fail('INJECTED_FAILURE', 'Injected durable write failure.'); await fs.promises.rename(stage, target); return value } finally { await fs.promises.rm(stage, { force: true }).catch(() => {}) }
  }
  async function readRaw(target, code) { try { return JSON.parse(await fs.promises.readFile(target, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return null; fail(code, 'Durable release record is corrupt.', { path: path.basename(target) }) } }
  async function readRequest(requestId) { const value = await readRaw(file('requests', requestId), 'CORRUPT_RELEASE_REQUEST'); if (!value) return null; try { if (value.requestId !== requestId) fail('CORRUPT_RELEASE_REQUEST', 'Release request identity does not match its path.'); return validateReleaseRequest(value) } catch (error) { if (error.code === 'CORRUPT_RELEASE_REQUEST') throw error; fail('CORRUPT_RELEASE_REQUEST', 'Durable release request is invalid.') } }
  async function readFlow(releaseFlowId) { const value = await readRaw(file('flows', releaseFlowId), 'CORRUPT_RELEASE_FLOW'); if (!value) return null; try { if (value.releaseFlowId !== releaseFlowId) fail('CORRUPT_RELEASE_FLOW', 'Release flow identity does not match its path.'); return validateFlow(value) } catch (error) { if (error.code === 'CORRUPT_RELEASE_FLOW') throw error; fail('CORRUPT_RELEASE_FLOW', 'Durable release flow is invalid.') } }
  async function readAuthorization(authorizationId) { const value = await readRaw(file('authorizations', authorizationId), 'CORRUPT_RELEASE_AUTHORIZATION'); if (!value) return null; try { if (value.authorizationId !== authorizationId) fail('CORRUPT_RELEASE_AUTHORIZATION', 'Authorization identity does not match its path.'); return validateStoredAuthorization(value) } catch (error) { if (error.code === 'CORRUPT_RELEASE_AUTHORIZATION') throw error; fail('CORRUPT_RELEASE_AUTHORIZATION', 'Durable authorization is invalid.') } }
  async function readOutbox(outboxId) { const value = await readRaw(file('outbox', outboxId), 'CORRUPT_RELEASE_OUTBOX'); if (!value) return null; try { if (value.outboxId !== outboxId) fail('CORRUPT_RELEASE_OUTBOX', 'Outbox identity does not match its path.'); return validateOutbox(value) } catch (error) { if (error.code === 'CORRUPT_RELEASE_OUTBOX') throw error; fail('CORRUPT_RELEASE_OUTBOX', 'Durable outbox item is invalid.') } }
  async function saveImmutable(kind, value, read, collisionCode) { const target = file(kind, value[`${kind === 'requests' ? 'request' : kind === 'authorizations' ? 'authorization' : 'outbox'}Id`]); return locked(lockKey, async () => { const key = kind === 'requests' ? 'requestId' : kind === 'authorizations' ? 'authorizationId' : 'outboxId'; const prior = await read(value[key]); const comparable = (record) => { const copyValue = clone(record); if (kind === 'outbox') delete copyValue.createdAt; return copyValue }; if (prior && canonical(comparable(prior)) !== canonical(comparable(value))) fail(collisionCode, 'Durable identity collision.'); if (prior) return { record: clone(prior), idempotent: true }; return { record: clone(await atomic(target, value)), idempotent: false } }) }
  async function saveRequest(request) { validateReleaseRequest(request); return saveImmutable('requests', request, readRequest, 'RELEASE_REQUEST_COLLISION') }
  async function saveAuthorization(auth) { validateStoredAuthorization(auth); return saveImmutable('authorizations', auth, readAuthorization, 'AUTHORIZATION_COLLISION') }
  async function saveOutbox(outbox) { validateOutbox(outbox); return saveImmutable('outbox', outbox, readOutbox, 'OUTBOX_COLLISION') }
  async function saveFlow(flow) { validateFlow(flow); return locked(lockKey, async () => { const prior = await readFlow(flow.releaseFlowId); if (prior && prior.revision >= flow.revision) fail('RELEASE_FLOW_WRITE_REQUIRES_CAS', 'Release flows require a compare-and-swap transition.'); return { record: clone(await atomic(file('flows', flow.releaseFlowId), flow)), idempotent: false } }) }
  async function scan(kind, validator) { let names = []; try { names = await fs.promises.readdir(dirs[kind]) } catch (error) { if (error.code !== 'ENOENT') throw error } const records = []; const corruptions = []; for (const name of names.filter((item) => item.endsWith('.json')).sort()) { const recordId = name.slice(0, -5); try { const value = await validator(recordId); if (value) records.push(value) } catch (error) { corruptions.push({ kind, recordId, code: error.code || `CORRUPT_${kind.toUpperCase()}` }) } } return { records, corruptions } }
  async function rebuildIndex() { return locked(lockKey, async () => { const [requests, flows, authorizations, outbox] = await Promise.all([scan('requests', readRequest), scan('flows', readFlow), scan('authorizations', readAuthorization), scan('outbox', readOutbox)]); const index = { schemaVersion: INDEX_SCHEMA, requestToFlow: Object.fromEntries(flows.records.map((item) => [item.requestId, item.releaseFlowId])), projectToFlows: flows.records.reduce((out, item) => { (out[item.identity.projectId] ||= []).push(item.releaseFlowId); return out }, {}), versionToFlows: flows.records.reduce((out, item) => { (out[item.identity.versionId] ||= []).push(item.releaseFlowId); return out }, {}), outboxToRequest: Object.fromEntries(outbox.records.map((item) => [item.outboxId, item.requestId])), authorizationToRequest: Object.fromEntries(authorizations.records.map((item) => [item.authorizationId, item.requestId])), corruptions: [...requests.corruptions, ...flows.corruptions, ...authorizations.corruptions, ...outbox.corruptions] }; let recovered = false; try { const prior = JSON.parse(await fs.promises.readFile(path.join(dirs.indices, 'index.json'), 'utf8')); recovered = canonical(prior) !== canonical(index) } catch (error) { recovered = error.code !== 'ENOENT' } return { index: clone(await atomic(path.join(dirs.indices, 'index.json'), index)), corruptions: index.corruptions, recovered } }) }
  return Object.freeze({ authorityRoot, dirs, readRequest, readFlow, readAuthorization, readOutbox, saveRequest, saveAuthorization, saveOutbox, saveFlow, scan: async () => ({ requests: await scan('requests', readRequest), flows: await scan('flows', readFlow), authorizations: await scan('authorizations', readAuthorization), outbox: await scan('outbox', readOutbox) }), rebuildIndex })
}

module.exports = { FLOW_SCHEMA, OUTBOX_SCHEMA, INDEX_SCHEMA, FLOW_STATES, ReleasePersistenceError, validateFlow, validateOutbox, createReleasePersistence, digest, canonical }
