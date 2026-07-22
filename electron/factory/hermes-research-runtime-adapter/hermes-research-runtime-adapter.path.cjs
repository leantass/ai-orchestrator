const path = require('node:path');

function resolveFactoryHermesResearchRuntimeAdapterPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  const pythonEnvRoot = path.join(installRoot, 'python-env');
  return {
    root,
    installRoot,
    sourceRoot,
    pythonEnvRoot,
    executableRef: path.join(pythonEnvRoot, 'Scripts', 'hermes.exe'),
    outputRoot: path.join(installRoot, 'research-runtime-output'),
    tempRoot: path.join(installRoot, 'research-runtime-temp'),
    approvalResult: path.join(installRoot, 'research-runtime-approval-result.json'),
    boundaryResult: path.join(installRoot, 'research-runtime-boundary-result.json'),
    interfaceSelectionResult: path.join(installRoot, 'research-runtime-interface-selection-result.json'),
    pythonInstallVerificationResult: path.join(installRoot, 'python-install-verification-result.json'),
    adapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
  };
}

function assertAdapterPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesResearchRuntimeAdapterPaths, assertAdapterPathContained };
