const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesPythonInstallVerificationPaths() {
  const root = repoRoot();
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  const pythonEnvRoot = path.join(installRoot, 'python-env');
  const uvRoot = path.join(root, '.codex-temp/external-tools/uv');
  const uvExecutable = path.join(uvRoot, 'bin/uv.exe');
  const pythonInstallManifest = path.join(installRoot, 'python-install-manifest.json');
  const pythonInstallResult = path.join(installRoot, 'python-install-result.json');
  const uvVerificationResult = path.join(uvRoot, 'provisioning-verification-result.json');
  const verificationResult = path.join(installRoot, 'python-install-verification-result.json');
  const pyvenvCfg = path.join(pythonEnvRoot, 'pyvenv.cfg');
  const pythonExecutable = path.join(pythonEnvRoot, 'Scripts/python.exe');
  const sitePackages = path.join(pythonEnvRoot, 'Lib/site-packages');
  return { root, installRoot, sourceRoot, pythonEnvRoot, uvRoot, uvExecutable, pythonInstallManifest, pythonInstallResult, uvVerificationResult, verificationResult, pyvenvCfg, pythonExecutable, sitePackages, refs: { installRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f', sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source', pythonEnvRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/', uvExecutableRef: '.codex-temp/external-tools/uv/bin/uv.exe', uvVerificationRef: '.codex-temp/external-tools/uv/provisioning-verification-result.json', pythonInstallManifestRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-manifest.json', pythonInstallResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-result.json', pythonInstallVerificationResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-verification-result.json' } };
}
function assertFactoryHermesPythonVerificationPathContained(target, root) { const rel = path.relative(path.resolve(root), path.resolve(target)); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes root: ${target}`); return path.resolve(target); }
function assertHermesPythonEnvAllowed(paths) { assertFactoryHermesPythonVerificationPathContained(paths.installRoot, path.join(paths.root, '.codex-temp')); assertFactoryHermesPythonVerificationPathContained(paths.sourceRoot, paths.installRoot); assertFactoryHermesPythonVerificationPathContained(paths.pythonEnvRoot, paths.installRoot); assertFactoryHermesPythonVerificationPathContained(paths.uvExecutable, paths.uvRoot); }
function sanitizeFilePreview(value) { return String(value ?? '').replace(/\r/g, '').replace(/[A-Z]:\\[^\n]+/giu, '[local-path]').slice(0, 500); }
async function readJsonFileSafe(filePath) { try { return { ok: true, value: JSON.parse(await fs.readFile(filePath, 'utf8')) }; } catch (error) { return { ok: false, error }; } }
async function hashFileIfPresent(filePath) { if (!fsSync.existsSync(filePath)) return undefined; const buffer = await fs.readFile(filePath); return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase(); }
async function sizeFileIfPresent(filePath) { if (!fsSync.existsSync(filePath)) return undefined; return (await fs.stat(filePath)).size; }
async function countDirectoryEntriesLimited(dirPath, limit = 500) { if (!fsSync.existsSync(dirPath)) return 0; const entries = await fs.readdir(dirPath); return Math.min(entries.length, limit); }

module.exports = { resolveFactoryHermesPythonInstallVerificationPaths, assertFactoryHermesPythonVerificationPathContained, assertHermesPythonEnvAllowed, sanitizeFilePreview, readJsonFileSafe, hashFileIfPresent, sizeFileIfPresent, countDirectoryEntriesLimited };
