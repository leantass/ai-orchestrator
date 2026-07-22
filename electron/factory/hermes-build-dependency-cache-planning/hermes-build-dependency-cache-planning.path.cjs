const path = require('node:path');

function repoRoot() {
  return path.resolve(__dirname, '../../..');
}

function resolveFactoryHermesBuildDependencyCachePlanningPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  return {
    root,
    installRoot,
    sourceRoot: path.join(installRoot, 'source'),
    uvCacheRoot: path.join(root, '.codex-temp/external-tools/uv/cache'),
    materializationJefeReviewResult: path.join(installRoot, 'entrypoint-materialization-jefe-review-result.json'),
    materializationIngestionResult: path.join(installRoot, 'entrypoint-materialization-result-ingestion-result.json'),
    materializationRuntimeResult: path.join(installRoot, 'entrypoint-materialization-runtime-result.json'),
    materializationRuntimeManifest: path.join(installRoot, 'entrypoint-materialization-runtime-manifest.json'),
    materializationApprovalResult: path.join(installRoot, 'entrypoint-materialization-approval-result.json'),
    uvVerificationResult: path.join(root, '.codex-temp/external-tools/uv/provisioning-verification-result.json'),
    planningResult: path.join(installRoot, 'build-dependency-cache-planning-result.json'),
  };
}

function assertPlanningPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes root: ${target}`);
}

module.exports = { resolveFactoryHermesBuildDependencyCachePlanningPaths, assertPlanningPathContained };
