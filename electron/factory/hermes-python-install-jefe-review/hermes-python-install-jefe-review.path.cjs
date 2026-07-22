const fs = require('node:fs/promises');
const path = require('node:path');

function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesPythonInstallJefeReviewPaths() {
  const root = repoRoot();
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  return { root, installRoot, verificationResult: path.join(installRoot, 'python-install-verification-result.json'), jefeReviewResult: path.join(installRoot, 'python-install-jefe-review-result.json'), refs: { installRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f', verificationResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-verification-result.json', jefeReviewResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-jefe-review-result.json' } };
}
function assertJefeReviewPathContained(target, root) { const rel = path.relative(path.resolve(root), path.resolve(target)); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes root: ${target}`); return path.resolve(target); }
async function readJsonFile(filePath) { return JSON.parse(await fs.readFile(filePath, 'utf8')); }
async function writeJsonFile(filePath, value) { await fs.writeFile(filePath, JSON.stringify(value, null, 2)); }
module.exports = { resolveFactoryHermesPythonInstallJefeReviewPaths, assertJefeReviewPathContained, readJsonFile, writeJsonFile };
