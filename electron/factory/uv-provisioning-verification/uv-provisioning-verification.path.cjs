const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);

function repoRoot() { return path.resolve(__dirname, '../../..'); }
function toRef(absPath) { return path.relative(repoRoot(), absPath).replace(/\\/g, '/'); }
function resolveFactoryUvProvisioningVerificationPaths() {
  const root = repoRoot();
  const uvRoot = path.join(root, '.codex-temp/external-tools/uv');
  const binRoot = path.join(uvRoot, 'bin');
  return { repoRoot: root, uvRoot, binRoot, executablePath: path.join(binRoot, 'uv.exe'), manifestPath: path.join(uvRoot, 'provisioning-manifest.json'), provisioningResultPath: path.join(uvRoot, 'provisioning-result.json'), verificationResultPath: path.join(uvRoot, 'provisioning-verification-result.json'), refs: { uvRootRef: '.codex-temp/external-tools/uv/', executableRef: '.codex-temp/external-tools/uv/bin/uv.exe', manifestRef: '.codex-temp/external-tools/uv/provisioning-manifest.json', provisioningResultRef: '.codex-temp/external-tools/uv/provisioning-result.json', verificationResultRef: '.codex-temp/external-tools/uv/provisioning-verification-result.json' } };
}
function assertFactoryUvVerificationPathContained(targetPath, rootPath = resolveFactoryUvProvisioningVerificationPaths().uvRoot) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(rootPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes uv root: ${targetPath}`);
  return resolvedTarget;
}
function assertUvExecutableAllowed(executablePath) {
  const paths = resolveFactoryUvProvisioningVerificationPaths();
  const resolved = assertFactoryUvVerificationPathContained(executablePath, paths.uvRoot);
  if (resolved !== paths.executablePath) throw new Error('uv executable path is not allowlisted.');
  return resolved;
}
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
async function runUvVersionRecheck(executablePath, cwd) {
  try {
    const { stdout, stderr } = await runFile(assertUvExecutableAllowed(executablePath), ['--version'], { cwd, env: sanitizeEnvironment(), shell: false, timeout: 60000, windowsHide: true });
    return { ok: true, command: { kind: 'uv_version_recheck', commandRef: toRef(executablePath), args: ['--version'], exitCode: 0, shell: false, stdout: sanitizeCommandOutput(stdout), stderr: sanitizeCommandOutput(stderr), timedOut: false } };
  } catch (error) {
    return { ok: false, command: { kind: 'uv_version_recheck', commandRef: toRef(executablePath), args: ['--version'], exitCode: typeof error.code === 'number' ? error.code : null, shell: false, stdout: sanitizeCommandOutput(error.stdout), stderr: sanitizeCommandOutput(error.stderr || error.message), timedOut: Boolean(error.killed) } };
  }
}
module.exports = { resolveFactoryUvProvisioningVerificationPaths, assertFactoryUvVerificationPathContained, assertUvExecutableAllowed, sanitizeCommandOutput, sanitizeEnvironment, runUvVersionRecheck };
