const path = require('node:path');
function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesResearchResultIngestionV2Paths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return { root, installRoot, retryResult: path.join(installRoot, 'research-runtime-adapter-retry-result.json'), retryManifest: path.join(installRoot, 'research-runtime-adapter-retry-manifest.json'), entrypointVerificationResult: path.join(installRoot, 'entrypoint-materialization-verification-result.json'), boundaryResult: path.join(installRoot, 'research-runtime-boundary-result.json'), approvalResult: path.join(installRoot, 'research-runtime-approval-result.json'), interfaceSelectionResult: path.join(installRoot, 'research-runtime-interface-selection-result.json'), ingestionV2Result: path.join(installRoot, 'research-result-ingestion-v2-result.json') };
}
function assertResearchResultIngestionV2PathContained(target, root) { const rel = path.relative(path.resolve(root), path.resolve(target)); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`); }
module.exports = { resolveFactoryHermesResearchResultIngestionV2Paths, assertResearchResultIngestionV2PathContained };
