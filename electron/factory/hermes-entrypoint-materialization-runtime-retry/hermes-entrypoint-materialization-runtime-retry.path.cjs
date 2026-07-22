const path = require('node:path');

function repoRoot() { return path.resolve(__dirname, '../../..'); }

function resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  const pythonEnvRoot = path.join(installRoot, 'python-env');
  const uvRoot = path.join(root, '.codex-temp', 'external-tools', 'uv');
  const logsRoot = path.join(installRoot, 'entrypoint-materialization-runtime-retry-logs');
  return {
    root,
    codexTempRoot: path.join(root, '.codex-temp'),
    installRoot,
    sourceRoot,
    pythonEnvRoot,
    uvRoot,
    uvExecutable: path.join(uvRoot, 'bin', 'uv.exe'),
    uvCacheRoot: path.join(uvRoot, 'cache'),
    expectedExecutable: path.join(pythonEnvRoot, 'Scripts', 'hermes.exe'),
    pythonExecutable: path.join(pythonEnvRoot, 'Scripts', 'python.exe'),
    pyproject: path.join(sourceRoot, 'pyproject.toml'),
    uvLock: path.join(sourceRoot, 'uv.lock'),
    setupPy: path.join(sourceRoot, 'setup.py'),
    cacheVerificationResult: path.join(installRoot, 'build-dependency-cache-verification-result.json'),
    cacheRuntimeResult: path.join(installRoot, 'build-dependency-cache-runtime-result.json'),
    cacheRuntimeManifest: path.join(installRoot, 'build-dependency-cache-runtime-manifest.json'),
    cacheApprovalResult: path.join(installRoot, 'build-dependency-cache-approval-result.json'),
    entrypointApprovalResult: path.join(installRoot, 'entrypoint-materialization-approval-result.json'),
    entrypointPlanningResult: path.join(installRoot, 'entrypoint-materialization-planning-result.json'),
    uvProvisioningVerificationResult: path.join(uvRoot, 'provisioning-verification-result.json'),
    logsRoot,
    manifest: path.join(installRoot, 'entrypoint-materialization-runtime-retry-manifest.json'),
    result: path.join(installRoot, 'entrypoint-materialization-runtime-retry-result.json'),
    refs: {
      installRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f',
      sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source',
      pythonEnvRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/',
      uvExecutableRef: '.codex-temp/external-tools/uv/bin/uv.exe',
      uvCacheRootRef: '.codex-temp/external-tools/uv/cache/',
      expectedExecutableRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe',
      logsRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-runtime-retry-logs/'
    }
  };
}

function assertEntrypointMaterializationRuntimeRetryPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths, assertEntrypointMaterializationRuntimeRetryPathContained };
