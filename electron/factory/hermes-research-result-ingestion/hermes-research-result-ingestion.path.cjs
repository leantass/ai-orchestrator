const path = require('node:path');

function resolveFactoryHermesResearchResultIngestionPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    root,
    installRoot,
    adapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    approvalResult: path.join(installRoot, 'research-runtime-approval-result.json'),
    boundaryResult: path.join(installRoot, 'research-runtime-boundary-result.json'),
    interfaceSelectionResult: path.join(installRoot, 'research-runtime-interface-selection-result.json'),
    ingestionResult: path.join(installRoot, 'research-result-ingestion-result.json'),
  };
}
function assertIngestionPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}
module.exports = { resolveFactoryHermesResearchResultIngestionPaths, assertIngestionPathContained };
