const path = require('node:path')

function isSafeRelativeFactoryPersistencePath(value) {
  return Boolean(value && value.trim()) && !path.isAbsolute(value) && !value.split(/[\\/]+/u).includes('..')
}

function assertFactoryPersistencePathContained(root, target) {
  const rootAbsolute = path.resolve(root)
  const targetAbsolute = path.resolve(rootAbsolute, target)
  const relative = path.relative(rootAbsolute, targetAbsolute)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Persistence path is outside the controlled storage root.')
  return targetAbsolute
}

function isStorageRootInsideCodexTemp(storageRoot) {
  return path.resolve(storageRoot).split(path.sep).some((segment) => segment === '.codex-temp')
}

function resolveFactoryContractPersistencePaths(input) {
  const target = input.persistenceResult && input.persistenceResult.target
  const atomic = input.persistenceResult && input.persistenceResult.atomicWritePlan
  if (!target || !atomic) throw new Error('Persistence target and atomic write plan are required.')
  if (!isStorageRootInsideCodexTemp(input.storageRoot)) throw new Error('storageRoot must be contained inside .codex-temp.')
  for (const candidate of [target.targetPath, target.metadataPath, atomic.tempPath, atomic.backupPath, atomic.lockPath]) {
    if (!isSafeRelativeFactoryPersistencePath(candidate)) throw new Error('Persistence plan contains an unsafe target path.')
  }
  return {
    storageRootAbsolute: path.resolve(input.storageRoot),
    targetAbsolutePath: assertFactoryPersistencePathContained(input.storageRoot, target.targetPath),
    metadataAbsolutePath: assertFactoryPersistencePathContained(input.storageRoot, target.metadataPath),
    tempAbsolutePath: assertFactoryPersistencePathContained(input.storageRoot, atomic.tempPath),
    backupAbsolutePath: assertFactoryPersistencePathContained(input.storageRoot, atomic.backupPath),
    lockAbsolutePath: assertFactoryPersistencePathContained(input.storageRoot, atomic.lockPath),
  }
}

module.exports = { assertFactoryPersistencePathContained, isSafeRelativeFactoryPersistencePath, isStorageRootInsideCodexTemp, resolveFactoryContractPersistencePaths }
