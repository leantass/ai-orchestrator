const fs = require('fs')
const path = require('path')
const { canonical } = require('./jefe-context-package-contract.cjs')
const {
  FLOW_ID,
  FLOW_STATES,
  createExecutionFlow,
  validateExecutionFlow,
  transitionExecutionFlow,
} = require('./jefe-supervised-research-execution-contract.cjs')

const PROJECT_ID = /^[a-z][a-z0-9_-]{2,80}$/u
const locks = new Map()
let stageSequence = 0

class SupervisedResearchExecutionPersistenceError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SupervisedResearchExecutionPersistenceError'
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchExecutionPersistenceError(code, message)
}

function clone(value) {
  return JSON.parse(canonical(value))
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const item of Object.values(value)) deepFreeze(item)
  return Object.freeze(value)
}

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))
}

function normalizedRoot(value) {
  const resolved = path.resolve(value)
  return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved
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

function immutableIdentity(value) {
  return {
    executionFlowId: value.executionFlowId,
    identity: value.identity,
    intakeId: value.intakeId,
    routingFingerprint: value.routingFingerprint,
    createdAt: value.createdAt,
  }
}

function validateProjectId(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !PROJECT_ID.test(value)) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
  return value
}

function createSupervisedResearchExecutionPersistence({ root } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Root de ejecucion invalido.')
  const authorityRoot = path.resolve(root)
  const rootLockKey = normalizedRoot(authorityRoot)
  const flowFile = (executionFlowId) => path.join(authorityRoot, `${executionFlowId}.json`)
  const indexFile = path.join(authorityRoot, 'research-execution-index.json')
  const isFlowFile = (name) => /^research-execution-[a-f0-9]{32}\.json$/u.test(name)

  async function atomic(target, value) {
    const stage = `${target}.${process.pid}.${Date.now()}.${++stageSequence}.stage`
    await fs.promises.mkdir(authorityRoot, { recursive: true })
    try {
      await fs.promises.writeFile(stage, `${canonical(value)}\n`, 'utf8')
      await fs.promises.rename(stage, target)
    } finally {
      await fs.promises.rm(stage, { force: true }).catch(() => {})
    }
    return value
  }

  async function read(executionFlowId) {
    if (typeof executionFlowId !== 'string' || !FLOW_ID.test(executionFlowId)) fail('INVALID_EXECUTION_FLOW_ID', 'Identificador de flujo invalido.')
    try {
      const value = validateExecutionFlow(JSON.parse(await fs.promises.readFile(flowFile(executionFlowId), 'utf8')))
      if (value.executionFlowId !== executionFlowId) fail('CORRUPT_EXECUTION_FLOW', 'Flujo durable corrupto.')
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return null
      if (error.code === 'CORRUPT_EXECUTION_FLOW') throw error
      fail('CORRUPT_EXECUTION_FLOW', 'Flujo durable corrupto.')
    }
  }

  async function scanDetailed(projectId) {
    const safeProjectId = validateProjectId(projectId)
    try {
      const names = (await fs.promises.readdir(authorityRoot)).filter(isFlowFile).sort()
      const records = []
      const corruptions = []
      for (const name of names) {
        const executionFlowId = name.slice(0, -5)
        try {
          const record = await read(executionFlowId)
          if (record && (safeProjectId === null || record.identity.projectId === safeProjectId)) records.push(record)
        } catch (error) {
          if (error.code !== 'CORRUPT_EXECUTION_FLOW') throw error
          corruptions.push({ executionFlowId, code: 'CORRUPT_EXECUTION_FLOW' })
        }
      }
      records.sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.executionFlowId.localeCompare(right.executionFlowId))
      corruptions.sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId))
      return deepFreeze({ records: records.map(clone), corruptions })
    } catch (error) {
      if (error.code === 'ENOENT') return deepFreeze({ records: [], corruptions: [] })
      throw error
    }
  }

  async function create(record) {
    let clean
    try { clean = validateExecutionFlow(record) } catch { fail('INVALID_EXECUTION_FLOW', 'Flujo de ejecucion invalido.') }
    if (clean.revision !== 0 || clean.state !== 'prepare_context') fail('INVALID_EXECUTION_CREATE', 'El flujo inicial es invalido.')
    return locked(rootLockKey, async () => {
      const prior = await read(clean.executionFlowId)
      if (prior) {
        if (canonical(immutableIdentity(prior)) !== canonical(immutableIdentity(clean))) fail('EXECUTION_FLOW_ID_COLLISION', 'Colision de flujo de ejecucion.')
        return { record: prior, idempotent: true }
      }
      const saved = validateExecutionFlow(await atomic(flowFile(clean.executionFlowId), clean))
      return { record: saved, idempotent: false }
    })
  }

  function transitionSpec(value) {
    const fields = ['expectedStates', 'expectedRevision', 'nextState', 'patch', 'updatedAt']
    if (!plainObject(value) || canonical(Object.keys(value).sort()) !== canonical(fields.sort())) fail('INVALID_EXECUTION_TRANSITION', 'Transicion de flujo invalida.')
    if (!Array.isArray(value.expectedStates) || value.expectedStates.length < 1 || new Set(value.expectedStates).size !== value.expectedStates.length || value.expectedStates.some((item) => !FLOW_STATES.includes(item))) fail('INVALID_EXECUTION_TRANSITION', 'Estados esperados invalidos.')
    if (!Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0 || !FLOW_STATES.includes(value.nextState) || !plainObject(value.patch) || typeof value.updatedAt !== 'string') fail('INVALID_EXECUTION_TRANSITION', 'Transicion de flujo invalida.')
    return value
  }

  async function compareAndSet(executionFlowId, rawSpec) {
    if (typeof executionFlowId !== 'string' || !FLOW_ID.test(executionFlowId)) fail('INVALID_EXECUTION_FLOW_ID', 'Identificador de flujo invalido.')
    const spec = transitionSpec(rawSpec)
    return locked(rootLockKey, async () => {
      const prior = await read(executionFlowId)
      if (!prior) fail('EXECUTION_FLOW_NOT_FOUND', 'Flujo de ejecucion inexistente.')
      if (!spec.expectedStates.includes(prior.state) || prior.revision !== spec.expectedRevision) fail('STALE_EXECUTION_FLOW', 'Transicion de flujo obsoleta.')
      let proposed
      try { proposed = transitionExecutionFlow(prior, spec.nextState, spec.patch, spec.updatedAt) } catch (error) {
        fail(error.code || 'INVALID_EXECUTION_TRANSITION', 'Transicion de flujo invalida.')
      }
      let next
      try { next = validateExecutionFlow({ ...clone(proposed), revision: prior.revision + 1 }) } catch { fail('INVALID_EXECUTION_TRANSITION', 'Transicion de flujo invalida.') }
      if (canonical(immutableIdentity(prior)) !== canonical(immutableIdentity(next))) fail('IMMUTABLE_EXECUTION_IDENTITY', 'La identidad del flujo no puede cambiar.')
      const saved = validateExecutionFlow(await atomic(flowFile(executionFlowId), next))
      return { record: saved, idempotent: false }
    })
  }

  async function listDetailed(projectId) {
    return scanDetailed(projectId)
  }

  async function listAll(projectId) {
    return (await scanDetailed(projectId)).records
  }

  async function rebuildIndex() {
    return locked(rootLockKey, async () => {
      const detail = await scanDetailed(undefined)
      const index = deepFreeze({
        schemaVersion: 'jefe-supervised-research-execution-index/v1',
        executionFlowIds: detail.records.map((item) => item.executionFlowId).sort(),
        projectAssociations: detail.records.map((item) => ({ executionFlowId: item.executionFlowId, projectId: item.identity.projectId })).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId)),
        intakeAssociations: detail.records.map((item) => ({ executionFlowId: item.executionFlowId, intakeId: item.intakeId })).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId)),
        corruptions: detail.corruptions.map(clone),
        rebuiltAt: null,
      })
      let prior = null
      let recovered = false
      try { prior = JSON.parse(await fs.promises.readFile(indexFile, 'utf8')) } catch (error) {
        if (error.code !== 'ENOENT') recovered = true
      }
      if (prior && canonical(prior) === canonical(index)) return { index: deepFreeze(clone(prior)), idempotent: true, recovered: false }
      const saved = deepFreeze(clone(await atomic(indexFile, index)))
      return { index: saved, idempotent: false, recovered }
    })
  }

  return Object.freeze({
    authorityRoot,
    create,
    createFlow: create,
    read,
    getFlow: read,
    compareAndSet,
    transitionFlow: compareAndSet,
    listDetailed,
    listAll,
    rebuildIndex,
  })
}

module.exports = {
  SupervisedResearchExecutionPersistenceError,
  createSupervisedResearchExecutionPersistence,
  createExecutionFlow,
}
