const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesEntrypointMaterializationVerificationPaths, assertEntrypointMaterializationVerificationPathContained } = require('./hermes-entrypoint-materialization-verification.path.cjs');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function hashFile(file) { return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : ''; }
function size(file) { try { return fs.statSync(file).size; } catch { return null; } }
function contained(target, root) { const rel = path.relative(path.resolve(root), path.resolve(target)); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); }
function sourceEntries(sourceRoot) { try { return fs.readdirSync(sourceRoot, { withFileTypes: true }).map((x) => x.name); } catch { return []; } }
function inspectFactoryHermesEntrypointMaterializationVerificationState(root) {
  const paths = resolveFactoryHermesEntrypointMaterializationVerificationPaths(root);
  [paths.expectedExecutable, paths.runtimeRetryResult, paths.runtimeRetryManifest, paths.result].forEach((target) => assertEntrypointMaterializationVerificationPathContained(target, paths.installRoot));
  const runtimeRetryResult = readJson(paths.runtimeRetryResult);
  const runtimeRetryManifest = readJson(paths.runtimeRetryManifest);
  const cacheVerificationResult = readJson(paths.cacheVerificationResult);
  const entries = sourceEntries(paths.sourceRoot);
  const currentHashes = { pyprojectToml: hashFile(paths.pyproject), uvLock: hashFile(paths.uvLock), setupPy: hashFile(paths.setupPy) };
  return {
    paths,
    runtimeRetryResult,
    runtimeRetryManifest,
    cacheVerificationResult,
    cacheRuntimeResult: fs.existsSync(paths.cacheRuntimeResult) ? readJson(paths.cacheRuntimeResult) : null,
    entrypointApprovalResult: fs.existsSync(paths.entrypointApprovalResult) ? readJson(paths.entrypointApprovalResult) : null,
    entrypointPlanningResult: fs.existsSync(paths.entrypointPlanningResult) ? readJson(paths.entrypointPlanningResult) : null,
    uvVerificationResult: fs.existsSync(paths.uvVerificationResult) ? readJson(paths.uvVerificationResult) : null,
    executableInspection: { exists: fs.existsSync(paths.expectedExecutable), contained: contained(paths.expectedExecutable, paths.scriptsRoot), sizeBytes: size(paths.expectedExecutable), sha256: hashFile(paths.expectedExecutable), extension: path.extname(paths.expectedExecutable).toLowerCase() },
    sourceInspection: {
      keyFileHashesUnchanged: JSON.stringify(runtimeRetryResult.afterState?.keyFileHashes || {}) === JSON.stringify(currentHashes),
      sourceMutationStatus: runtimeRetryResult.sourceMutationStatus || 'unknown',
      knownWarnings: entries.filter((x) => x === '.codex-temp' || x === 'hermes_agent.egg-info').map((x) => x === '.codex-temp' ? 'source_nested_codex_temp_left_from_repaired_runtime_attempt' : 'source_metadata_egg_info_created_by_cache_runtime'),
      unexpectedSourceMutation: entries.some((x) => ['dist', 'build', '.venv'].includes(x))
    }
  };
}
module.exports = { inspectFactoryHermesEntrypointMaterializationVerificationState };
