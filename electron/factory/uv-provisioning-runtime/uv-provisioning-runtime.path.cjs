const fs = require('node:fs');
const path = require('node:path');

const UV_ROOT_REF = '.codex-temp/external-tools/uv/';
function repoRoot() { return path.resolve(__dirname, '../../..'); }
function toRef(absPath) { return path.relative(repoRoot(), absPath).replace(/\\/g, '/'); }
function resolveFactoryUvProvisioningRuntimePaths() {
  const root = repoRoot();
  const uvRoot = path.resolve(root, '.codex-temp/external-tools/uv');
  const downloadsRoot = path.join(uvRoot, 'downloads');
  const binRoot = path.join(uvRoot, 'bin');
  return { repoRoot: root, uvRoot, downloadsRoot, binRoot, executablePath: path.join(binRoot, 'uv.exe'), uvxPath: path.join(binRoot, 'uvx.exe'), manifestPath: path.join(uvRoot, 'provisioning-manifest.json'), resultPath: path.join(uvRoot, 'provisioning-result.json'), refs: { uvRootRef: `${UV_ROOT_REF}`, downloadsRootRef: `${UV_ROOT_REF}downloads/`, binRootRef: `${UV_ROOT_REF}bin/`, executableRef: `${UV_ROOT_REF}bin/uv.exe`, uvxRef: `${UV_ROOT_REF}bin/uvx.exe`, manifestRef: `${UV_ROOT_REF}provisioning-manifest.json`, resultRef: `${UV_ROOT_REF}provisioning-result.json` } };
}
function assertFactoryUvProvisioningPathContained(targetPath, rootPath = resolveFactoryUvProvisioningRuntimePaths().uvRoot) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(rootPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes uv root: ${targetPath}`);
  return resolvedTarget;
}
function assertUvInstallRootAllowed(installRootRef) { if (installRootRef !== UV_ROOT_REF && installRootRef !== '.codex-temp/external-tools/uv') throw new Error('uv install root is not allowlisted.'); return true; }
function sanitizeCommandOutput(value) { return String(value ?? '').replace(/\r/g, '').slice(0, 4000); }
function sanitizeEnvironment(source = process.env) {
  const deny = /SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE|OPENAI|GITHUB_TOKEN|NPM_TOKEN|NODE_AUTH_TOKEN|UV_INDEX|PIP_INDEX|PIP_EXTRA_INDEX|TWINE/iu;
  const keep = ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA'];
  const env = {};
  for (const key of keep) if (source[key] && !deny.test(key)) env[key] = source[key];
  env.UV_NO_PROGRESS = '1';
  env.PYTHONNOUSERSITE = '1';
  return env;
}
function findUvOnPath() {
  const rawPath = process.env.Path || process.env.PATH || '';
  for (const entry of rawPath.split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(entry, 'uv.exe');
    try { fs.accessSync(candidate, fs.constants.X_OK); return path.resolve(candidate); } catch {}
  }
  return undefined;
}
module.exports = { resolveFactoryUvProvisioningRuntimePaths, assertFactoryUvProvisioningPathContained, assertUvInstallRootAllowed, sanitizeCommandOutput, sanitizeEnvironment, findUvOnPath, toRef };
