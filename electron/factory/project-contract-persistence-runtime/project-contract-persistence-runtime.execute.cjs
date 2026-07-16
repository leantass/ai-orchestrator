const { mkdir, readFile, rename, rm, writeFile } = require('node:fs/promises')
const path = require('node:path')
const { resolveFactoryContractPersistencePaths, isStorageRootInsideCodexTemp } = require('./project-contract-persistence-runtime.path.cjs')

const RUNTIME_KIND = 'factory-project-contract-persistence-runtime-adapter'
const RUNTIME_VERSION = '1.0'
const stableNormalize = (value) => Array.isArray(value) ? value.map(stableNormalize) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableNormalize(item)])) : value
const stableStringify = (value) => JSON.stringify(stableNormalize(value))
const sanitizeError = (error) => String(error && error.message || 'Unknown persistence failure.').replace(/[A-Za-z]:[\\/][^\s]+/gu, '[controlled-path]').replace(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]+/giu, '[redacted]').slice(0, 300)
const isMissing = (error) => Boolean(error && typeof error === 'object' && error.code === 'ENOENT')
const makeCheck = (checkId, category, passed, message) => ({ checkId, category, passed, message })

function validateBasicInput(input) {
  const errors = []
  if (!input || !input.persistenceResult) errors.push('persistenceResult is required.')
  if (!input || !input.storageRoot) errors.push('storageRoot is required.')
  else if (!isStorageRootInsideCodexTemp(input.storageRoot)) errors.push('storageRoot must be inside .codex-temp.')
  if (!input || !input.executedAt) errors.push('executedAt is required.')
  if (!input || !input.executedBy) errors.push('executedBy is required.')
  const persistence = input && input.persistenceResult
  if (persistence && (!persistence.fingerprint || !persistence.idempotencyKey || !persistence.canonicalPayload || !persistence.target)) errors.push('Persistence plan requires fingerprint, idempotency key, canonical payload and target.')
  return errors
}

async function executeFactoryProjectContractPersistence(input) {
  const value = structuredClone(input)
  const persistence = value && value.persistenceResult
  const runtimePersistenceId = `runtime-${persistence && persistence.persistenceId || 'invalid'}-${value && value.executedAt && value.executedAt.replace(/[^0-9]/g, '') || 'unknown'}`
  let targetAbsolutePath = ''; let metadataAbsolutePath = ''; let tempAbsolutePath; let backupAbsolutePath
  const checks = []; const blockers = []
  const base = (status, sanitizedError) => ({ runtimePersistenceId, runtimePersistenceKind: RUNTIME_KIND, runtimePersistenceVersion: RUNTIME_VERSION, executedAt: value && value.executedAt || '', executedBy: value && value.executedBy || '', persistenceId: persistence && persistence.persistenceId || '', approvalId: persistence && persistence.approvalId || '', candidateId: persistence && persistence.candidateId || '', storageRoot: value && value.storageRoot || '', status, targetAbsolutePath, metadataAbsolutePath, tempAbsolutePath, backupAbsolutePath, fingerprint: persistence && persistence.fingerprint && persistence.fingerprint.value || '', idempotencyKey: persistence && persistence.idempotencyKey && persistence.idempotencyKey.value || '', writeResult: { written: false, idempotent: false, contractWritten: false, metadataWritten: false, readbackVerified: false, rollbackAttempted: false, sanitizedError }, checks, blockers, warnings: [], canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, recommendedNextStep: status === 'blocked' ? 'Resolve runtime persistence blockers and repeat the controlled adapter.' : 'Send the persistence receipt to a future contract registry and MEMORIA review; do not execute Codex.' })
  const inputErrors = validateBasicInput(value)
  checks.push(makeCheck('valid-input', 'input', inputErrors.length === 0, 'Runtime persistence input must be valid.'))
  checks.push(makeCheck('ready-plan', 'plan', persistence && persistence.status === 'ready_for_runtime_persistence' && persistence.canPersistContract === true, 'Persistence plan must be ready and eligible.'))
  checks.push(makeCheck('execution-disabled', 'plan', Boolean(persistence && !persistence.canExecuteCodex && !persistence.canCreateProject && !persistence.canCreateRepository && !persistence.canDeploy), 'Upstream plan must not authorize execution or resource creation.'))
  if (inputErrors.length || !persistence || persistence.status !== 'ready_for_runtime_persistence' || !persistence.canPersistContract || persistence.canExecuteCodex || persistence.canCreateProject || persistence.canCreateRepository || persistence.canDeploy) {
    for (const item of checks.filter((item) => !item.passed)) blockers.push({ blockerId: item.checkId, category: item.category, message: item.message })
    for (const error of inputErrors) blockers.push({ blockerId: `input-${blockers.length + 1}`, category: 'input', message: error })
    return base('blocked')
  }
  try {
    const paths = resolveFactoryContractPersistencePaths(value); targetAbsolutePath = paths.targetAbsolutePath; metadataAbsolutePath = paths.metadataAbsolutePath; tempAbsolutePath = paths.tempAbsolutePath; backupAbsolutePath = paths.backupAbsolutePath
    checks.push(makeCheck('contained-paths', 'path', true, 'All runtime persistence paths are contained by storageRoot.'))
    const payload = persistence.canonicalPayload; const fingerprint = persistence.fingerprint; const idempotency = persistence.idempotencyKey
    try {
      const existingMetadata = JSON.parse(await readFile(metadataAbsolutePath, 'utf8')); await readFile(targetAbsolutePath, 'utf8')
      if (existingMetadata.fingerprint === fingerprint.value && existingMetadata.idempotencyKey === idempotency.value && value.allowOverwriteSameFingerprint !== false) {
        checks.push(makeCheck('idempotent-existing', 'idempotency', true, 'Existing contract has the same fingerprint and idempotency key.'))
        const result = base('idempotent_noop'); result.metadata = existingMetadata; result.writeResult.idempotent = true; result.writeResult.readbackVerified = true; return result
      }
      blockers.push({ blockerId: 'conflict-existing-contract', category: 'idempotency', message: 'A different persisted contract already exists at the controlled target.' }); return base('blocked')
    } catch (error) { if (!isMissing(error)) throw error }
    await mkdir(path.dirname(targetAbsolutePath), { recursive: true })
    const contractJson = `${payload.canonicalJson}\n`; await writeFile(tempAbsolutePath, contractJson, { encoding: 'utf8', flag: 'wx' })
    if (stableStringify(JSON.parse(await readFile(tempAbsolutePath, 'utf8'))) !== payload.canonicalJson) throw new Error('Temporary payload readback verification failed.')
    await rename(tempAbsolutePath, targetAbsolutePath)
    const metadata = { metadataKind: 'factory-project-contract-persistence-metadata', metadataVersion: '1.0', persistenceId: persistence.persistenceId, approvalId: persistence.approvalId, candidateId: persistence.candidateId, fingerprint: fingerprint.value, idempotencyKey: idempotency.value, targetPath: persistence.target.targetPath, writtenAt: value.executedAt, writtenBy: value.executedBy, sourceStatus: persistence.status, runtimePersistenceId, notExecutable: true, codexAllowed: false, projectCreated: false, repositoryCreated: false, deployed: false }
    await writeFile(metadataAbsolutePath, `${JSON.stringify(metadata, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    const targetReadback = await readFile(targetAbsolutePath, 'utf8'); const metadataReadback = JSON.parse(await readFile(metadataAbsolutePath, 'utf8'))
    if (stableStringify(JSON.parse(targetReadback)) !== payload.canonicalJson || metadataReadback.fingerprint !== fingerprint.value || metadataReadback.idempotencyKey !== idempotency.value) throw new Error('Final persistence readback verification failed.')
    checks.push(makeCheck('atomic-write', 'write', true, 'Temporary write and atomic rename completed.')); checks.push(makeCheck('readback', 'readback', true, 'Contract and metadata readback verified.'))
    const result = base('persisted'); result.metadata = metadata; result.writeResult = { written: true, idempotent: false, contractWritten: true, metadataWritten: true, readbackVerified: true, rollbackAttempted: false }; return result
  } catch (error) {
    let rollbackSucceeded = true; let rollbackAttempted = false
    if (tempAbsolutePath) { rollbackAttempted = true; try { await rm(tempAbsolutePath, { force: true }) } catch { rollbackSucceeded = false } }
    const result = base('failed', sanitizeError(error)); result.writeResult.rollbackAttempted = rollbackAttempted; result.writeResult.rollbackSucceeded = rollbackAttempted ? rollbackSucceeded : undefined; result.blockers.push({ blockerId: 'runtime-persistence-failed', category: 'write', message: 'Controlled runtime persistence failed.' }); return result
  }
}

module.exports = { executeFactoryProjectContractPersistence }
