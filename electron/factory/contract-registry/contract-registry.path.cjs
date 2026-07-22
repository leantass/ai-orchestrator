const path = require('node:path')

function isSafeFactoryRegistryRelativePath(value) {
  return Boolean(value && value.trim()) && !path.isAbsolute(value) && !value.split(/[\\/]+/u).includes('..')
}

function assertFactoryContractRegistryRootAllowed(storageRoot) {
  const absolute = path.resolve(storageRoot)
  if (!absolute.split(path.sep).some((segment) => segment === '.codex-temp')) throw new Error('Registry storageRoot must be inside .codex-temp.')
  return absolute
}

function assertFactoryRegistryPathContained(root, target) {
  const rootAbsolute = assertFactoryContractRegistryRootAllowed(root)
  const targetAbsolute = path.isAbsolute(target) ? path.resolve(target) : path.resolve(rootAbsolute, target)
  const relative = path.relative(rootAbsolute, targetAbsolute)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Registry path is outside storageRoot.')
  return targetAbsolute
}

function resolveFactoryContractRegistryRoot(input) {
  const storageRootAbsolute = assertFactoryContractRegistryRootAllowed(input.storageRoot)
  return { storageRootAbsolute, indexRelativePath: 'factory-contract-registry/index.v1.json', indexAbsolutePath: assertFactoryRegistryPathContained(storageRootAbsolute, 'factory-contract-registry/index.v1.json'), tempAbsolutePath: assertFactoryRegistryPathContained(storageRootAbsolute, 'factory-contract-registry/index.v1.json.tmp') }
}

module.exports = { assertFactoryContractRegistryRootAllowed, assertFactoryRegistryPathContained, isSafeFactoryRegistryRelativePath, resolveFactoryContractRegistryRoot }
