const path = require('node:path')

const installBase = '.codex-temp/external-tools/hermes-agent/install'
const sourceRoot = '.codex-temp/external-tools/hermes-agent/source'

function normalizeRelative(value) {
  return value.replaceAll('\\', '/')
}

function assertNoTraversal(value) {
  const normalized = normalizeRelative(value)
  if (path.isAbsolute(value) || normalized.split('/').includes('..')) throw new Error(`Unsafe path: ${value}`)
}

function assertContained(root, target) {
  const rootResolved = path.resolve(root)
  const targetResolved = path.resolve(target)
  const relative = path.relative(rootResolved, targetResolved)
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return targetResolved
  throw new Error(`Path escapes root: ${target}`)
}

function auditedShort(head) {
  return head.slice(0, 7)
}

function resolveHermesInstallPaths(auditedHead) {
  if (!/^[a-f0-9]{40}$/u.test(auditedHead)) throw new Error('Invalid auditedHead.')
  const installRoot = normalizeRelative(`${installBase}/${auditedShort(auditedHead)}`)
  const sourceCopyRoot = normalizeRelative(`${installRoot}/source`)
  const logsRoot = normalizeRelative(`${installRoot}/logs`)
  const manifestPath = normalizeRelative(`${installRoot}/install-manifest.json`)
  const resultPath = normalizeRelative(`${installRoot}/install-result.json`)
  for (const value of [installRoot, sourceCopyRoot, logsRoot, manifestPath, resultPath]) assertNoTraversal(value)
  assertContained(installBase, installRoot)
  assertContained(installRoot, sourceCopyRoot)
  assertContained(installRoot, logsRoot)
  assertContained(installRoot, manifestPath)
  assertContained(installRoot, resultPath)
  return { sourceRoot, installRoot, sourceCopyRoot, logsRoot, manifestPath, resultPath }
}

module.exports = {
  assertContained,
  assertNoTraversal,
  resolveHermesInstallPaths,
}
