const path = require('node:path');
function resolveFactoryHermesResearchRuntimeBoundaryPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return { root, installRoot, interfaceSelectionResult: path.join(installRoot, 'research-runtime-interface-selection-result.json'), boundaryResult: path.join(installRoot, 'research-runtime-boundary-result.json') };
}
function assertBoundaryPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}
module.exports = { resolveFactoryHermesResearchRuntimeBoundaryPaths, assertBoundaryPathContained };
