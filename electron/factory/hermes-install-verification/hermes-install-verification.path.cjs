const path = require('node:path')

function assertContained(root, target) {
  const rootResolved = path.resolve(root)
  const targetResolved = path.resolve(target)
  const relative = path.relative(rootResolved, targetResolved)
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return targetResolved
  throw new Error(`Path escapes root: ${target}`)
}

function resolveFactoryHermesInstallVerificationRoot(installRoot) {
  const normalized = installRoot.replaceAll('\\', '/')
  if (!normalized.startsWith('.codex-temp/external-tools/hermes-agent/install/')) throw new Error('installRoot must be under Hermes .codex-temp install root.')
  assertContained('.codex-temp/external-tools/hermes-agent/install', installRoot)
  return {
    installRoot: normalized,
    sourceCopyRoot: `${normalized}/source`,
    manifestPath: `${normalized}/install-manifest.json`,
    resultPath: `${normalized}/install-result.json`,
  }
}

module.exports = { assertContained, resolveFactoryHermesInstallVerificationRoot }
