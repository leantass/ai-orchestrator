const path = require('node:path');

function repoRoot() {
  return path.resolve(__dirname, '../../..');
}

function resolveFactoryHermesBuildDependencyCacheVerificationPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  const metadataRoot = path.join(installRoot, 'build-dependency-cache-metadata');
  return {
    root,
    installRoot,
    sourceRoot: path.join(installRoot, 'source'),
    pythonEnvRoot: path.join(installRoot, 'python-env'),
    realHermesExecutable: path.join(installRoot, 'python-env/Scripts/hermes.exe'),
    uvExecutable: path.join(root, '.codex-temp/external-tools/uv/bin/uv.exe'),
    uvVerificationResult: path.join(root, '.codex-temp/external-tools/uv/provisioning-verification-result.json'),
    cacheRuntimeResult: path.join(installRoot, 'build-dependency-cache-runtime-result.json'),
    cacheRuntimeManifest: path.join(installRoot, 'build-dependency-cache-runtime-manifest.json'),
    cacheApprovalResult: path.join(installRoot, 'build-dependency-cache-approval-result.json'),
    cachePlanningResult: path.join(installRoot, 'build-dependency-cache-planning-result.json'),
    metadataRoot,
    metadataRecord: path.join(metadataRoot, 'build-dependency-cache-record.json'),
    commandSummary: path.join(metadataRoot, 'build-dependency-cache-command-summary.json'),
    materializationRuntimeResult: path.join(installRoot, 'entrypoint-materialization-runtime-result.json'),
    materializationRuntimeRetryResult: path.join(installRoot, 'entrypoint-materialization-runtime-retry-result.json'),
    materializationRuntimeRetryManifest: path.join(installRoot, 'entrypoint-materialization-runtime-retry-manifest.json'),
    verificationResult: path.join(installRoot, 'build-dependency-cache-verification-result.json')
  };
}

function assertBuildDependencyCacheVerificationPathContained(target, roots) {
  const resolvedTarget = path.resolve(target);
  const ok = roots.some((root) => {
    const rel = path.relative(path.resolve(root), resolvedTarget);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  });
  if (!ok) throw new Error(`Path escapes allowed roots: ${target}`);
}

module.exports = {
  resolveFactoryHermesBuildDependencyCacheVerificationPaths,
  assertBuildDependencyCacheVerificationPathContained
};
