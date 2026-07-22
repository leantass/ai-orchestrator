const path = require('node:path');

function resolveFactoryHermesResearchRuntimeInterfaceSelectionPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    root,
    installRoot,
    planningResult: path.join(installRoot, 'research-runtime-planning-result.json'),
    jefeReviewResult: path.join(installRoot, 'python-install-jefe-review-result.json'),
    dossier: path.join(root, '.codex-temp', 'hermes-research-runtime-interface-selection-dossier-v1', 'INTERFACE_SELECTION_DOSSIER.md'),
    selectionResult: path.join(installRoot, 'research-runtime-interface-selection-result.json'),
    refs: {
      planningResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-planning-result.json',
      dossierRef: '.codex-temp/hermes-research-runtime-interface-selection-dossier-v1/INTERFACE_SELECTION_DOSSIER.md',
    },
  };
}
function assertInterfaceSelectionPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}
module.exports = { resolveFactoryHermesResearchRuntimeInterfaceSelectionPaths, assertInterfaceSelectionPathContained };
