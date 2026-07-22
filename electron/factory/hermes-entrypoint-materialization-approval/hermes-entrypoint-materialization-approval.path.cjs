const path = require('node:path');

function resolveFactoryHermesEntrypointMaterializationApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    root,
    installRoot,
    planningResult: path.join(installRoot, 'entrypoint-materialization-planning-result.json'),
    approvalResult: path.join(installRoot, 'entrypoint-materialization-approval-result.json'),
  };
}

function assertApprovalPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesEntrypointMaterializationApprovalPaths, assertApprovalPathContained };
