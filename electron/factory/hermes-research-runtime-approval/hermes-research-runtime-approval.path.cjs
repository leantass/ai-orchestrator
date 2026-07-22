const path = require('node:path');
function resolveFactoryHermesResearchRuntimeApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return { root, installRoot, boundaryResult: path.join(installRoot, 'research-runtime-boundary-result.json'), approvalResult: path.join(installRoot, 'research-runtime-approval-result.json') };
}
function assertApprovalPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}
module.exports = { resolveFactoryHermesResearchRuntimeApprovalPaths, assertApprovalPathContained };
