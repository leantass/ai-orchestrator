const path = require('node:path');
function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesBuildDependencyCacheApprovalPaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  return { root, installRoot, planningResult: path.join(installRoot, 'build-dependency-cache-planning-result.json'), approvalResult: path.join(installRoot, 'build-dependency-cache-approval-result.json') };
}
function assertApprovalPathContained(target, root) { const rel = path.relative(path.resolve(root), path.resolve(target)); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes root: ${target}`); }
module.exports = { resolveFactoryHermesBuildDependencyCacheApprovalPaths, assertApprovalPathContained };
