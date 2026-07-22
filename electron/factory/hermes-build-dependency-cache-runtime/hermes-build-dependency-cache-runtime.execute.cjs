const fs = require('node:fs/promises');
const fss = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { resolveFactoryHermesBuildDependencyCacheRuntimePaths, assertBuildDependencyCachePathContained } = require('./hermes-build-dependency-cache-runtime.path.cjs');

const KIND = 'factory-hermes-build-dependency-cache-runtime';
const VERSION = '1.0';
const SUCCESS_NEXT = 'Proceed to Factory Hermes Build Dependency Cache Verification Gate v1; do not retry materialization until cache verification passes.';
const FAILURE_NEXT = 'Review Factory Hermes Build Dependency Cache Runtime result before repair; do not retry materialization or execute Hermes.';
function ref(paths, full) { return path.relative(paths.root, full).replace(/\\/gu, '/'); }
async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function hashIfExists(file) { if (!(await exists(file))) return null; return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'); }
function sanitizeOutput(text) { return String(text || '').replace(/(token|password|secret|api[_-]?key)=\S+/giu, '$1=[redacted]').slice(0, 12000); }
function sanitizeEnvironment(paths) {
  const keep = ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA'];
  const env = {};
  for (const key of keep) if (process.env[key]) env[key] = process.env[key];
  env.UV_PROJECT_ENVIRONMENT = paths.tempEnvRoot;
  env.UV_CACHE_DIR = paths.uvCacheRoot;
  env.UV_NO_PROGRESS = '1'; env.PYTHONNOUSERSITE = '1'; env.PIP_CONFIG_FILE = 'NUL'; env.NO_COLOR = '1';
  env.HERMES_NO_NETWORK = '1'; env.HERMES_NO_MODEL_CALLS = '1'; env.HERMES_NO_CREDENTIALS = '1';
  return env;
}
async function countLimited(root, limit = 10000) { let count = 0; const stack = [root]; while (stack.length && count < limit) { const dir = stack.pop(); const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []); for (const e of entries) { count++; if (e.isDirectory()) stack.push(path.join(dir, e.name)); if (count >= limit) break; } } return count; }
async function snapshot(paths) {
  const suspicious = [];
  for (const name of ['dist', 'build', '.venv', '.codex-temp']) if (await exists(path.join(paths.sourceRoot, name))) suspicious.push(name);
  const top = await fs.readdir(paths.sourceRoot, { withFileTypes: true }).catch(() => []);
  for (const e of top) if (/\.egg-info$/u.test(e.name) || e.name === '__pycache__') suspicious.push(e.name);
  return { cacheFileCountLimited: await countLimited(paths.uvCacheRoot), tempEnvExists: await exists(paths.tempEnvRoot), realPythonEnvHermesExeExists: await exists(path.join(paths.pythonEnvRoot, 'Scripts/hermes.exe')), sourceKeyHashes: { pyprojectToml: await hashIfExists(path.join(paths.sourceRoot, 'pyproject.toml')), uvLock: await hashIfExists(path.join(paths.sourceRoot, 'uv.lock')), setupPy: await hashIfExists(path.join(paths.sourceRoot, 'setup.py')) }, sourceSuspiciousEntries: suspicious };
}
function runUv(paths, timeoutMs) {
  const actualArgs = ['sync', '--locked', '--no-dev', '--project', paths.sourceRoot];
  const args = ['sync', '--locked', '--no-dev', '--project', ref(paths, paths.sourceRoot)];
  const env = sanitizeEnvironment(paths);
  return new Promise((resolve) => {
    execFile(paths.uvExecutable, actualArgs, { cwd: paths.sourceRoot, env, shell: false, timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
      resolve({ commandKind: 'uv_sync_temp_env_for_cache_prefetch', executableRef: ref(paths, paths.uvExecutable), args, cwdRef: ref(paths, paths.sourceRoot), shell: false, timeoutMs, envRefs: { UV_PROJECT_ENVIRONMENT: `${ref(paths, paths.tempEnvRoot)}/`, UV_CACHE_DIR: `${ref(paths, paths.uvCacheRoot)}/`, UV_OFFLINE: undefined, UV_NO_PROGRESS: '1', PYTHONNOUSERSITE: '1', PIP_CONFIG_FILE: 'NUL', NO_COLOR: '1' }, stdoutPreview: sanitizeOutput(stdout), stderrPreview: sanitizeOutput(stderr), exitCode: typeof error?.code === 'number' ? error.code : 0, timedOut: Boolean(error?.killed), started: true, completed: !error });
    });
  });
}
async function extractLockMetadata(paths) {
  const raw = await fs.readFile(path.join(paths.sourceRoot, 'uv.lock'), 'utf8').catch(() => '');
  const urls = [...raw.matchAll(/url = "(https:\/\/[^"]*setuptools-81\.0\.0[^"]*)"/gu)].map((m) => m[1]);
  const hashes = [...raw.matchAll(/hash = "sha256:([a-f0-9]{64})"/gu)].map((m) => `sha256:${m[1]}`).slice(0, 10);
  const hosts = [...new Set(urls.map((u) => new URL(u).host))];
  return { recordedSourceUrls: urls, recordedHashes: hashes, recordedHosts: hosts };
}
function base(input, approval, paths) {
  const env = approval?.approvedBuildDependencyCacheRuntimeEnvelope || {};
  return { cacheRunId: `hermes-build-dependency-cache-runtime:75b300f:${input.executedAt}`, cacheKind: KIND, cacheVersion: VERSION, executedAt: input.executedAt, executedBy: input.executedBy, toolId: 'hermes_agent', missingBuildDependency: approval?.missingBuildDependency || env.missingBuildDependency || '', lockedPackageName: approval?.lockedPackageName || env.lockedPackageName || '', lockedPackageVersion: approval?.lockedPackageVersion || env.lockedPackageVersion || null, selectedMethodCandidate: approval?.selectedMethodCandidate || env.selectedMethodCandidate || '', uvExecutableRef: ref(paths, paths.uvExecutable), uvCacheRootRef: ref(paths, paths.uvCacheRoot) + '/', metadataRootRef: ref(paths, paths.metadataRoot) + '/', tempEnvRootRef: ref(paths, paths.tempEnvRoot) + '/', sourceRootRef: ref(paths, paths.sourceRoot), pythonEnvRootRef: ref(paths, paths.pythonEnvRoot), commandResults: [], beforeState: {}, afterState: {}, cacheStatus: 'not_prefetched', tempEnvStatus: 'not_created', uvStatus: 'not_executed', networkStatus: 'not_used', credentialsStatus: 'not_allowed', modelCallStatus: 'not_allowed', pipStatus: 'not_executed', pythonDirectStatus: 'not_executed', setupPyDirectStatus: 'not_executed', hermesExecutionStatus: 'not_executed', scriptsStatus: 'not_executed', materializationStatus: 'not_attempted', adapterRetryStatus: 'not_attempted', metadataStatus: 'not_written', status: 'blocked', decision: 'blocked_missing_cache_approval', blockers: [], warnings: [], checks: [], canProceedToBuildDependencyCacheVerification: false, canRetryMaterializationNow: false, canExecuteHermes: false, canUseCredentials: false, canCallModels: false, canDeploy: false, recommendedNextStep: FAILURE_NEXT };
}
async function executeFactoryHermesBuildDependencyCacheRuntime(input = {}) {
  const paths = resolveFactoryHermesBuildDependencyCacheRuntimePaths();
  const allowed = [paths.uvCacheRoot, paths.metadataRoot, paths.tempEnvRoot, paths.logsRoot, paths.installRoot];
  for (const target of [paths.manifest, paths.result, paths.metadataRoot, paths.tempEnvRoot, paths.logsRoot]) assertBuildDependencyCachePathContained(target, allowed);
  const runInput = { executedAt: input.executedAt || '2026-07-22T01:20:00.000Z', executedBy: input.executedBy || 'factory-hermes-build-dependency-cache-runtime-smoke' };
  const approval = input.approvalResult || await readJson(paths.approvalResult).catch(() => null);
  const result = base(runInput, approval, paths);
  await fs.mkdir(paths.metadataRoot, { recursive: true }); await fs.mkdir(paths.logsRoot, { recursive: true }); await fs.mkdir(paths.uvCacheRoot, { recursive: true });
  if (!approval) return writeAll(paths, { ...result, blockers: [{ blockerId: 'blocked_missing_cache_approval', message: 'Approval result is required.' }] }, null);
  const env = approval.approvedBuildDependencyCacheRuntimeEnvelope;
  if (approval.status !== 'approved_for_runtime_candidate' || approval.canProceedToBuildDependencyCacheRuntime !== true || env?.futureRuntimeMayCacheBuildDependencyUnderEnvelope !== true || env?.futureRuntimeMayUseNetworkForCachePrefetch !== true) return writeAll(paths, { ...result, decision: 'blocked_approved_cache_policy_invalid', blockers: [{ blockerId: 'blocked_approved_cache_policy_invalid', message: 'Approval envelope is invalid.' }] }, null);
  if (!(await exists(paths.uvExecutable))) return writeAll(paths, { ...result, decision: 'blocked_uv_not_verified', blockers: [{ blockerId: 'blocked_uv_not_verified', message: 'Verified uv executable missing.' }] }, null);
  if (!(await exists(paths.sourceRoot)) || !(await exists(path.join(paths.sourceRoot, 'pyproject.toml'))) || !(await exists(path.join(paths.sourceRoot, 'uv.lock')))) return writeAll(paths, { ...result, decision: 'blocked_source_missing', blockers: [{ blockerId: 'blocked_source_missing', message: 'Source root or lock files missing.' }] }, null);
  const beforeState = await snapshot(paths);
  const command = await runUv(paths, 600000);
  const afterState = await snapshot(paths);
  const sourceMutated = JSON.stringify(beforeState.sourceKeyHashes) !== JSON.stringify(afterState.sourceKeyHashes);
  const materialized = beforeState.realPythonEnvHermesExeExists !== afterState.realPythonEnvHermesExeExists && afterState.realPythonEnvHermesExeExists;
  const lockMeta = await extractLockMetadata(paths);
  const success = command.exitCode === 0 && !sourceMutated && !materialized;
  const metadata = { packageName: 'setuptools', versionConstraint: '>=77,<83', lockedPackageVersion: result.lockedPackageVersion, buildBackend: 'setuptools.build_meta', selectedMethodCandidate: result.selectedMethodCandidate, uvCacheRootRef: result.uvCacheRootRef, tempEnvRootRef: result.tempEnvRootRef, sourceRootRef: result.sourceRootRef, commandExecuted: { commandKind: command.commandKind, args: command.args, shell: command.shell, exitCode: command.exitCode }, networkScope: 'cache_prefetch_only', noCredentials: true, noModelCalls: true, stdoutPreview: command.stdoutPreview, stderrPreview: command.stderrPreview, cacheBefore: beforeState.cacheFileCountLimited, cacheAfter: afterState.cacheFileCountLimited, sourceMutationSummary: { sourceMutated, materialized }, resultStatus: success ? 'success' : 'controlled_failure', ...lockMeta };
  const metadataRecord = path.join(paths.metadataRoot, 'build-dependency-cache-record.json');
  const commandSummary = path.join(paths.metadataRoot, 'build-dependency-cache-command-summary.json');
  await fs.writeFile(metadataRecord, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  await fs.writeFile(commandSummary, `${JSON.stringify(command, null, 2)}\n`, 'utf8');
  const final = { ...result, commandResults: [command], beforeState, afterState, cacheStatus: success ? 'prefetched' : 'controlled_failure', tempEnvStatus: afterState.tempEnvExists ? 'created_or_updated' : 'not_created', uvStatus: command.exitCode === 0 ? 'executed_cache_prefetch' : 'failed_uv_cache_prefetch', networkStatus: 'used_for_cache_prefetch_only', metadataStatus: 'written', status: success ? 'success' : 'controlled_failure', decision: success ? 'hermes_build_dependency_cache_prefetch_completed' : sourceMutated || materialized ? 'failed_cache_prefetch_unexpected_project_mutation' : 'failed_uv_cache_prefetch', blockers: success ? [] : [{ blockerId: command.exitCode === 0 ? 'cache_runtime_boundary_failure' : 'uv_cache_prefetch_failed', message: command.stderrPreview || command.stdoutPreview || 'uv cache prefetch failed' }], warnings: afterState.sourceSuspiciousEntries.filter((x) => /\.egg-info$/u.test(x)).map((x) => ({ warningId: 'source_egg_info_present', message: x })), canProceedToBuildDependencyCacheVerification: success, recommendedNextStep: success ? SUCCESS_NEXT : FAILURE_NEXT };
  return writeAll(paths, final, { metadataRecordRef: ref(paths, metadataRecord), commandSummaryRef: ref(paths, commandSummary) });
}
async function writeAll(paths, result, refs) {
  const manifest = { manifestKind: 'factory-hermes-build-dependency-cache-runtime-manifest', manifestVersion: VERSION, toolId: 'hermes_agent', missingBuildDependency: result.missingBuildDependency, lockedPackageName: result.lockedPackageName, lockedPackageVersion: result.lockedPackageVersion, selectedMethodCandidate: result.selectedMethodCandidate, uvExecutableRef: result.uvExecutableRef, uvCacheRootRef: result.uvCacheRootRef, metadataRootRef: result.metadataRootRef, tempEnvRootRef: result.tempEnvRootRef, sourceRootRef: result.sourceRootRef, pythonEnvRootRef: result.pythonEnvRootRef, commandSummary: result.commandResults[0] || null, networkScope: 'cache_prefetch_only', credentialsStatus: result.credentialsStatus, modelCallStatus: result.modelCallStatus, pipStatus: result.pipStatus, pythonDirectStatus: result.pythonDirectStatus, setupPyDirectStatus: result.setupPyDirectStatus, hermesExecutionStatus: result.hermesExecutionStatus, materializationStatus: result.materializationStatus, adapterRetryStatus: result.adapterRetryStatus, beforeState: result.beforeState, afterState: result.afterState, metadataRecordRef: refs?.metadataRecordRef || null, cacheStatus: result.cacheStatus, tempEnvStatus: result.tempEnvStatus, executedAt: result.executedAt, executedBy: result.executedBy, nextRequiredGate: 'Factory Hermes Build Dependency Cache Verification Gate v1' };
  await fs.writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(paths.result, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}
module.exports = { executeFactoryHermesBuildDependencyCacheRuntime, sanitizeEnvironment, sanitizeOutput, snapshotCacheState: snapshot, snapshotSourceState: snapshot, runControlledCachePrefetch: runUv };
