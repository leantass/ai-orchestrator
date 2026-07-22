const path = require('node:path');
function repoRoot() { return path.resolve(__dirname, '../../..'); }
function resolveFactoryHermesBuildDependencyCacheRuntimePaths(root = repoRoot()) {
  const installRoot = path.join(root, '.codex-temp/external-tools/hermes-agent/install/75b300f');
  return { root, installRoot, sourceRoot: path.join(installRoot, 'source'), pythonEnvRoot: path.join(installRoot, 'python-env'), tempEnvRoot: path.join(installRoot, 'build-dependency-cache-temp-env'), metadataRoot: path.join(installRoot, 'build-dependency-cache-metadata'), logsRoot: path.join(installRoot, 'build-dependency-cache-logs'), uvExecutable: path.join(root, '.codex-temp/external-tools/uv/bin/uv.exe'), uvCacheRoot: path.join(root, '.codex-temp/external-tools/uv/cache'), approvalResult: path.join(installRoot, 'build-dependency-cache-approval-result.json'), manifest: path.join(installRoot, 'build-dependency-cache-runtime-manifest.json'), result: path.join(installRoot, 'build-dependency-cache-runtime-result.json') };
}
function assertBuildDependencyCachePathContained(target, roots) { const ok = roots.some((root) => { const rel = path.relative(path.resolve(root), path.resolve(target)); return !rel.startsWith('..') && !path.isAbsolute(rel); }); if (!ok) throw new Error(`Path escapes allowed roots: ${target}`); }
module.exports = { resolveFactoryHermesBuildDependencyCacheRuntimePaths, assertBuildDependencyCachePathContained };
