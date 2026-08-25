const fs = require('fs')
const path = require('path')
const { physicalRootKey, resolvePhysicalRoot } = require('./jefe-physical-root.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { validateIntake } = require('./jefe-discovery-contract.cjs')

const INTAKE_ID = /^intake-[a-f0-9]{32}$/u
const PROJECT_ID = /^[a-z][a-z0-9_-]{2,80}$/u
const RECORD_FIELDS = Object.freeze([
  'schemaVersion',
  'objective',
  'expectedOutcome',
  'audience',
  'problem',
  'scope',
  'constraints',
  'materials',
  'references',
  'questions',
  'assumptions',
  'risks',
  'priority',
  'responsible',
  'projectType',
  'platform',
  'identity',
  'revisionOf',
  'provenance',
  'actor',
  'authority',
  'createdAt',
  'state',
  'nextResponsible',
  'intakeId',
])
const locks = new Map()
let stageSequence = 0

class DiscoveryPersistenceError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new DiscoveryPersistenceError(code, message)
}

function clone(value) {
  return JSON.parse(canonical(value))
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const item of Object.values(value)) deepFreeze(item)
  return Object.freeze(value)
}

function plain(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))
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
  if (!plain(value) || canonical(Object.keys(value).sort()) !== canonical([...RECORD_FIELDS].sort())) fail('INVALID_INTAKE', 'Registro de intake invalido.')
  if (value.schemaVersion !== 'jefe-supervised-intake/v1' || !INTAKE_ID.test(value.intakeId) || typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt) fail('INVALID_INTAKE', 'Registro de intake invalido.')
  const raw = {
    objective: value.objective,
    expectedOutcome: value.expectedOutcome,
    audience: value.audience,
    problem: value.problem,
    scope: value.scope,
    constraints: value.constraints,
    materials: value.materials,
    references: value.references.map((item) => ({ kind: item.kind, value: item.value })),
    questions: value.questions,
    assumptions: value.assumptions,
    risks: value.risks,
    priority: value.priority,
    responsible: value.responsible,
    projectType: value.projectType,
    platform: value.platform,
    ...(value.identity === null ? {} : { identity: value.identity }),
    ...(value.revisionOf === null ? {} : { revisionOf: value.revisionOf }),
  }
  let rebuilt
  try { rebuilt = validateIntake(raw, value.createdAt) } catch { fail('INVALID_INTAKE', 'Registro de intake invalido.') }
  if (canonical(rebuilt) !== canonical(value)) fail('INVALID_INTAKE', 'Registro de intake invalido.')
  return deepFreeze(clone(rebuilt))
}

function validateProjectId(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !PROJECT_ID.test(value)) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
  return value
}

function createDiscoveryPersistence({ root, failureInjection = null } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Root invalido.')
  if (failureInjection !== null && typeof failureInjection !== 'function' && failureInjection !== 'before_rename') fail('INVALID_FAILURE_INJECTION', 'Inyeccion de fallo invalida.')
  const authorityRoot = resolvePhysicalRoot(root)
  const rootLockKey = physicalRootKey(authorityRoot)
  const file = (id) => path.join(authorityRoot, `${id}.json`)
  const indexFile = path.join(authorityRoot, 'discovery-index.json')
  const isIntakeFile = (name) => /^intake-[a-f0-9]{32}\.json$/u.test(name)

  async function atomic(target, value) {
    const stage = `${target}.${process.pid}.${Date.now()}.${++stageSequence}.stage`
    await fs.promises.mkdir(authorityRoot, { recursive: true })
    try {
      await fs.promises.writeFile(stage, `${canonical(value)}\n`, 'utf8')
      if (failureInjection === 'before_rename' || (typeof failureInjection === 'function' && await failureInjection({ target, value: clone(value) }))) fail('INJECTED_FAILURE', 'Fallo durable inyectado.')
      await fs.promises.rename(stage, target)
    } finally {
      await fs.promises.rm(stage, { force: true }).catch(() => {})
    }
    return value
  }

  async function read(id) {
    if (typeof id !== 'string' || !INTAKE_ID.test(id)) fail('INVALID_ID', 'Identificador invalido.')
    try {
      const value = validateRecord(JSON.parse(await fs.promises.readFile(file(id), 'utf8')))
      if (value.intakeId !== id) fail('CORRUPT_INTAKE', 'Registro durable invalido.')
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return null
      if (error.code === 'CORRUPT_INTAKE') throw error
      fail('CORRUPT_INTAKE', 'Registro durable invalido.')
    }
  }

  async function scanDetailed(projectId) {
    const safeProjectId = validateProjectId(projectId)
    try {
      const names = (await fs.promises.readdir(authorityRoot)).filter(isIntakeFile).sort()
      const records = []
      const corruptions = []
      for (const name of names) {
        const intakeId = name.slice(0, -5)
        try {
          const record = await read(intakeId)
          if (record && (safeProjectId === null || record.identity?.projectId === safeProjectId)) records.push(record)
        } catch (error) {
          if (error.code !== 'CORRUPT_INTAKE') throw error
          corruptions.push({ intakeId, code: 'CORRUPT_INTAKE' })
        }
      }
      records.sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.intakeId.localeCompare(right.intakeId))
      return deepFreeze({ records, corruptions })
    } catch (error) {
      if (error.code === 'ENOENT') return deepFreeze({ records: [], corruptions: [] })
      throw error
    }
  }

  async function save(record) {
    let clean
    try { clean = validateRecord(record) } catch { fail('INVALID_INTAKE', 'Registro de intake invalido.') }
    return locked(rootLockKey, async () => {
      const prior = await read(clean.intakeId)
      if (prior) {
        if (canonical(prior) === canonical(clean)) return { record: prior, idempotent: true }
        fail('INTAKE_COLLISION', 'Colision de intake.')
      }
      return { record: validateRecord(await atomic(file(clean.intakeId), clean)), idempotent: false }
    })
  }

  async function listDetailed(projectId, limit = 100) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) fail('INVALID_LIMIT', 'Limite invalido.')
    const detail = await scanDetailed(projectId)
    return deepFreeze({ records: detail.records.slice(0, limit), corruptions: detail.corruptions.slice(0, limit) })
  }

  async function listAll(projectId) {
    return (await scanDetailed(projectId)).records
  }

  async function listAllDetailed(projectId) {
    return scanDetailed(projectId)
  }

  async function rebuildIndex() {
    return locked(rootLockKey, async () => {
      const detail = await scanDetailed(undefined)
      const index = deepFreeze({
        schemaVersion: 'jefe-supervised-discovery-index/v1',
        intakeIds: detail.records.map((item) => item.intakeId).sort(),
        projectAssociations: detail.records.filter((item) => item.identity?.projectId).map((item) => ({ intakeId: item.intakeId, projectId: item.identity.projectId })).sort((left, right) => left.intakeId.localeCompare(right.intakeId)),
        corruptions: detail.corruptions,
        rebuiltAt: null,
      })
      let prior = null
      let recovered = false
      try { prior = JSON.parse(await fs.promises.readFile(indexFile, 'utf8')) } catch (error) {
        if (error.code !== 'ENOENT') recovered = true
      }
      if (prior && canonical(prior) === canonical(index)) return { index: deepFreeze(clone(prior)), idempotent: true, recovered: false }
      return { index: deepFreeze(clone(await atomic(indexFile, index))), idempotent: false, recovered }
    })
  }

  return Object.freeze({ authorityRoot, save, read, listDetailed, listAll, listAllDetailed, rebuildIndex })
}

module.exports = { DiscoveryPersistenceError, createDiscoveryPersistence }
