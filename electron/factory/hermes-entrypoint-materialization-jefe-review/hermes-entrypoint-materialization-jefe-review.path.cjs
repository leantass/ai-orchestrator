const path = require('node:path');

function repoRoot() {
  return path.resolve(__dirname, '../../..');
}

function resolveFactoryHermesEntrypointMaterializationJefeReviewPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  return {
    root,
    installRoot,
    ingestionResult: path.join(installRoot, 'entrypoint-materialization-result-ingestion-result.json'),
    runtimeResult: path.join(installRoot, 'entrypoint-materialization-runtime-result.json'),
    runtimeManifest: path.join(installRoot, 'entrypoint-materialization-runtime-manifest.json'),
    approvalResult: path.join(installRoot, 'entrypoint-materialization-approval-result.json'),
    uvVerificationResult: path.join(root, '.codex-temp/external-tools/uv/provisioning-verification-result.json'),
    jefeReviewResult: path.join(installRoot, 'entrypoint-materialization-jefe-review-result.json'),
  };
}

function assertJefeReviewPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes root: ${target}`);
}

module.exports = { resolveFactoryHermesEntrypointMaterializationJefeReviewPaths, assertJefeReviewPathContained };
