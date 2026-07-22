const path = require('node:path');
function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesEntrypointMaterializationVerificationPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  const pythonEnvRoot = path.join(installRoot, 'python-env');
  const scriptsRoot = path.join(pythonEnvRoot, 'Scripts');
  const uvRoot = path.join(root, '.codex-temp', 'external-tools', 'uv');
  return {
    root, installRoot, sourceRoot, pythonEnvRoot, scriptsRoot, uvCacheRoot: path.join(uvRoot, 'cache'),
    expectedExecutable: path.join(scriptsRoot, 'hermes.exe'),
    pythonExecutable: path.join(scriptsRoot, 'python.exe'),
    pyproject: path.join(sourceRoot, 'pyproject.toml'),
    uvLock: path.join(sourceRoot, 'uv.lock'),
    setupPy: path.join(sourceRoot, 'setup.py'),
    runtimeRetryResult: path.join(installRoot, 'entrypoint-materialization-runtime-retry-result.json'),
    runtimeRetryManifest: path.join(installRoot, 'entrypoint-materialization-runtime-retry-manifest.json'),
    cacheVerificationResult: path.join(installRoot, 'build-dependency-cache-verification-result.json'),
    cacheRuntimeResult: path.join(installRoot, 'build-dependency-cache-runtime-result.json'),
    entrypointApprovalResult: path.join(installRoot, 'entrypoint-materialization-approval-result.json'),
    entrypointPlanningResult: path.join(installRoot, 'entrypoint-materialization-planning-result.json'),
    uvVerificationResult: path.join(uvRoot, 'provisioning-verification-result.json'),
    result: path.join(installRoot, 'entrypoint-materialization-verification-result.json'),
    refs: {
      expectedExecutableRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe',
      sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source',
      pythonEnvRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env'
    }
  };
}
function assertEntrypointMaterializationVerificationPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}
module.exports = { resolveFactoryHermesEntrypointMaterializationVerificationPaths, assertEntrypointMaterializationVerificationPathContained };
