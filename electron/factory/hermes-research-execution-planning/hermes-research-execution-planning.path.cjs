const path = require('node:path');

function repoRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function resolveFactoryHermesResearchExecutionPlanningPaths() {
  const root = repoRoot();
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  return {
    repoRoot: root,
    installRoot,
    sourceRoot,
    reviewV2Result: path.join(installRoot, 'research-jefe-review-v2-result.json'),
    adapterRetryResult: path.join(installRoot, 'research-runtime-adapter-retry-result.json'),
    planningResult: path.join(installRoot, 'research-execution-planning-result.json'),
  };
}

function assertResearchExecutionPlanningPathContained(target, root) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`path_not_contained: ${target}`);
  }
}

function toRef(absPath) {
  const rel = path.relative(repoRoot(), absPath).replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `.${path.posix.sep}${rel}`;
}

module.exports = { resolveFactoryHermesResearchExecutionPlanningPaths, assertResearchExecutionPlanningPathContained, toRef };
