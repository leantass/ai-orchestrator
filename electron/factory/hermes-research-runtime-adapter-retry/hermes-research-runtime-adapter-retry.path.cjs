const path = require('node:path');
function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesResearchRuntimeAdapterRetryPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  const pythonEnvRoot = path.join(installRoot, 'python-env');
  const executable = path.join(pythonEnvRoot, 'Scripts', 'hermes.exe');
  const logsRoot = path.join(installRoot, 'research-runtime-adapter-retry-logs');
  return { root, installRoot, sourceRoot, pythonEnvRoot, executable, logsRoot, verificationResult: path.join(installRoot, 'entrypoint-materialization-verification-result.json'), boundaryResult: path.join(installRoot, 'research-runtime-boundary-result.json'), approvalResult: path.join(installRoot, 'research-runtime-approval-result.json'), interfaceSelectionResult: path.join(installRoot, 'research-runtime-interface-selection-result.json'), manifest: path.join(installRoot, 'research-runtime-adapter-retry-manifest.json'), result: path.join(installRoot, 'research-runtime-adapter-retry-result.json'), refs: { sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source', executableRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe', logsRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-logs/' } };
}
function assertResearchRuntimeAdapterRetryPathContained(target, root) { const rel = path.relative(path.resolve(root), path.resolve(target)); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`); }
module.exports = { resolveFactoryHermesResearchRuntimeAdapterRetryPaths, assertResearchRuntimeAdapterRetryPathContained };
