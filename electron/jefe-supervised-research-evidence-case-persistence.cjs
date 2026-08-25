const fs = require('fs')
const path = require('path')
const { canonical } = require('./jefe-context-package-contract.cjs')

const CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const REQUEST_ID = /^research-[a-f0-9]{32}$/u
const CASE_STATES = Object.freeze([
  'preparing',
  'ready',
  'needs_corroboration',
  'accepted_for_context',
  'requires_human',
  'evidence_pending',
])
const locks = new Map()
let stageSequence = 0

class EvidenceCasePersistenceError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new EvidenceCasePersistenceError(code, message)
}

function locked(key, work) {
  const previous = locks.get(key) || Promise.resolve()
  let release
  const tail = new Promise((resolve) => { release = resolve })
  locks.set(key, tail)
  return previous.then(work).finally(() => {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  })
}

function validateRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  if (value.schemaVersion !== 'jefe-supervised-research-evidence-case/v1' || !CASE_ID.test(value.evidenceCaseId) || !PLAN_ID.test(value.researchPlanId)) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  if (!CASE_STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  if (typeof value.projectId !== 'string' || typeof value.discoveryId !== 'string' || typeof value.intakeId !== 'string') fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  if (!Array.isArray(value.requests) || value.requests.length < 1 || value.requests.some((item) => !item || !REQUEST_ID.test(item.researchRequestId))) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  if (new Set(value.requests.map((item) => item.researchRequestId)).size !== value.requests.length) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  for (const key of ['preparedRequestIds', 'receipts', 'contributions', 'evidenceDecisions', 'pendingOperations']) if (!Array.isArray(value[key])) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  return JSON.parse(canonical(value))
}

function sameIdentity(left, right) {
  return left.researchPlanId === right.researchPlanId &&
    left.projectId === right.projectId &&
    left.discoveryId === right.discoveryId &&
    left.intakeId === right.intakeId
}

function createEvidenceCasePersistence({ root, failureInjection = null } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Caso de evidencia invalido.')
  const authorityRoot = path.resolve(root)
  const caseFile = (id) => path.join(authorityRoot, `${id}.json`)
  const indexFile = path.join(authorityRoot, 'evidence-case-index.json')
  const lockKey = (id) => `${authorityRoot}:${id}`
  const isCaseFile = (name) => /^evidence-case-[a-f0-9]{32}\.json$/u.test(name)

  async function atomic(target, value) {
    const stage = `${target}.${process.pid}.${Date.now()}.${++stageSequence}.stage`
    await fs.promises.mkdir(authorityRoot, { recursive: true })
    try {
      await fs.promises.writeFile(stage, `${canonical(value)}\n`, 'utf8')
      if (failureInjection === 'before_rename' || (typeof failureInjection === 'function' && await failureInjection({ target, value }))) fail('INJECTED_FAILURE', 'Fallo durable inyectado.')
      await fs.promises.rename(stage, target)
    } finally {
      await fs.promises.rm(stage, { force: true }).catch(() => {})
    }
    return value
  }

  async function read(evidenceCaseId) {
    if (typeof evidenceCaseId !== 'string' || !CASE_ID.test(evidenceCaseId)) fail('INVALID_EVIDENCE_CASE_ID', 'Caso de evidencia invalido.')
    try {
      const value = validateRecord(JSON.parse(await fs.promises.readFile(caseFile(evidenceCaseId), 'utf8')))
      if (value.evidenceCaseId !== evidenceCaseId) fail('CORRUPT_EVIDENCE_CASE', 'Caso de evidencia corrupto.')
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return null
      if (error.code === 'CORRUPT_EVIDENCE_CASE') throw error
      fail('CORRUPT_EVIDENCE_CASE', 'Caso de evidencia corrupto.')
    }
  }

  async function write(record) {
    const clean = validateRecord({ ...record, revision: Number.isSafeInteger(record?.revision) ? record.revision : 0 })
    return locked(lockKey(clean.evidenceCaseId), async () => {
      const prior = await read(clean.evidenceCaseId)
      if (prior && canonical(prior) === canonical(clean)) return { record: prior, idempotent: true }
      if (prior && prior.researchPlanId !== clean.researchPlanId) fail('EVIDENCE_CASE_ID_COLLISION', 'Colision de caso de evidencia.')
      if (prior && !sameIdentity(prior, clean)) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Caso de evidencia incompatible.')
      if (prior && clean.revision !== prior.revision + 1) fail('STALE_EVIDENCE_CASE', 'Caso de evidencia obsoleto.')
      if (!prior && clean.revision !== 0) fail('STALE_EVIDENCE_CASE', 'Caso de evidencia obsoleto.')
      return { record: await atomic(caseFile(clean.evidenceCaseId), clean), idempotent: false }
    })
  }

  async function update(evidenceCaseId, updater) {
    if (typeof updater !== 'function') fail('INVALID_EVIDENCE_CASE_UPDATE', 'Actualizacion de caso invalida.')
    return locked(lockKey(evidenceCaseId), async () => {
      const prior = await read(evidenceCaseId)
      if (!prior) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
      const proposed = updater(JSON.parse(canonical(prior)))
      const comparable = validateRecord({ ...proposed, revision: prior.revision })
      if (!sameIdentity(prior, comparable) || prior.evidenceCaseId !== comparable.evidenceCaseId) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Caso de evidencia incompatible.')
      if (canonical(prior) === canonical(comparable)) return { record: prior, idempotent: true }
      const next = validateRecord({ ...comparable, revision: prior.revision + 1 })
      return { record: await atomic(caseFile(evidenceCaseId), next), idempotent: false }
    })
  }

  async function listDetailed(projectId, limit = 100) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) fail('INVALID_LIMIT', 'Limite invalido.')
    try {
      const names = (await fs.promises.readdir(authorityRoot)).filter(isCaseFile).sort()
      const records = []
      const corruptions = []
      for (const name of names) {
        const evidenceCaseId = name.slice(0, -5)
        try {
          const item = await read(evidenceCaseId)
          if (item && (!projectId || item.projectId === projectId)) records.push(item)
        } catch (error) {
          if (error.code !== 'CORRUPT_EVIDENCE_CASE') throw error
          corruptions.push({ evidenceCaseId, code: 'CORRUPT_EVIDENCE_CASE' })
        }
      }
      return { records: records.slice(0, limit), corruptions: corruptions.slice(0, limit) }
    } catch (error) {
      if (error.code === 'ENOENT') return { records: [], corruptions: [] }
      throw error
    }
  }

  async function list(projectId, limit = 100) {
    return (await listDetailed(projectId, limit)).records
  }

  async function findByRequestId(researchRequestId) {
    if (typeof researchRequestId !== 'string' || !REQUEST_ID.test(researchRequestId)) return null
    const detail = await listDetailed(undefined, 1000)
    return detail.records.find((item) => item.requests.some((request) => request.researchRequestId === researchRequestId)) || null
  }

  async function rebuildIndex() {
    return locked(lockKey('index'), async () => {
      const detail = await listDetailed(undefined, 1000)
      const index = {
        schemaVersion: 'jefe-supervised-research-evidence-case-index/v1',
        evidenceCaseIds: detail.records.map((item) => item.evidenceCaseId).sort(),
        requestAssociations: detail.records.flatMap((item) => item.requests.map((request) => ({ evidenceCaseId: item.evidenceCaseId, researchRequestId: request.researchRequestId }))).sort((a, b) => a.researchRequestId.localeCompare(b.researchRequestId)),
        corruptions: detail.corruptions,
        rebuiltAt: null,
      }
      let prior = null
      let recovered = false
      try { prior = JSON.parse(await fs.promises.readFile(indexFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') recovered = true }
      if (prior && canonical(prior) === canonical(index)) return { index: prior, idempotent: true }
      return { index: await atomic(indexFile, index), idempotent: false, recovered }
    })
  }

  return { authorityRoot, read, write, create: write, update, list, listDetailed, findByRequestId, rebuildIndex }
}

module.exports = { CASE_STATES, EvidenceCasePersistenceError, createEvidenceCasePersistence }
