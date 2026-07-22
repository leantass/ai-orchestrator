const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths, assertEntrypointMaterializationRuntimeRetryPathContained } = require('./hermes-entrypoint-materialization-runtime-retry.path.cjs');

const KIND = 'factory-hermes-entrypoint-materialization-runtime-retry';
const VERSION = '1.0';
const TIMEOUT_MS = 300000;
const MAX_TIMEOUT_MS = 600000;
const MAX_OUTPUT_BYTES = 12000;
const SUCCESS_NEXT = 'Proceed to Factory Hermes Entrypoint Materialization Verification Gate v1; do not execute Hermes or retry the research adapter yet.';
const REPAIR_NEXT = 'Review Factory Hermes Entrypoint Materialization Runtime Retry result before repair; do not execute Hermes.';
const secretKey = /SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE|OPENAI|GITHUB_TOKEN|NPM_TOKEN|NODE_AUTH_TOKEN|UV_INDEX|PIP_INDEX|PIP_EXTRA_INDEX|TWINE/iu;
const secretValue = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/giu;

function rel(paths, full) { return path.relative(paths.root, full).replace(/\\/gu, '/'); }
async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
function exists(file) { return fsSync.existsSync(file); }
function hashFile(file) { return exists(file) ? crypto.createHash('sha256').update(fsSync.readFileSync(file)).digest('hex') : null; }
function fileSize(file) { try { return fsSync.statSync(file).size; } catch { return null; } }
function sanitizeCommandOutput(value) { return Buffer.from(String(value || '').replace(secretValue, '[REDACTED]').replace(/\r/g, '')).subarray(0, MAX_OUTPUT_BYTES).toString('utf8'); }

function sanitizeEnvironment(paths, env = process.env) {
  const keep = ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA'];
  const clean = {};
  for (const key of keep) if (env[key] && !secretKey.test(key)) clean[key] = env[key];
  clean.UV_PROJECT_ENVIRONMENT = paths.pythonEnvRoot;
  clean.UV_CACHE_DIR = paths.uvCacheRoot;
  clean.UV_OFFLINE = '1';
  clean.UV_NO_PROGRESS = '1';
  clean.PYTHONNOUSERSITE = '1';
  clean.PIP_CONFIG_FILE = 'NUL';
  clean.NO_COLOR = '1';
  clean.HERMES_NO_NETWORK = '1';
  clean.HERMES_NO_MODEL_CALLS = '1';
  clean.HERMES_NO_CREDENTIALS = '1';
  return clean;
}

function sourceEntries(sourceRoot) {
  try { return fsSync.readdirSync(sourceRoot, { withFileTypes: true }).map((entry) => entry.name).sort(); } catch { return []; }
}

function snapshotFilesystemState(paths) {
  const entries = sourceEntries(paths.sourceRoot);
  const warnings = entries.filter((name) => name === '.codex-temp' || name === 'hermes_agent.egg-info');
  const forbidden = entries.filter((name) => ['dist', 'build', '.venv'].includes(name));
  return {
    expectedExecutableExists: exists(paths.expectedExecutable),
    expectedExecutableSize: fileSize(paths.expectedExecutable),
    expectedExecutableSha256: hashFile(paths.expectedExecutable),
    pythonEnvRootExists: exists(paths.pythonEnvRoot),
    sourceRootExists: exists(paths.sourceRoot),
    uvCacheRootExists: exists(paths.uvCacheRoot),
    verifiedSetuptoolsCacheRecordAvailable: exists(path.join(paths.installRoot, 'build-dependency-cache-metadata', 'build-dependency-cache-record.json')),
    pyprojectExists: exists(paths.pyproject),
    uvLockExists: exists(paths.uvLock),
    setupPyExists: exists(paths.setupPy),
    pythonExecutableExists: exists(paths.pythonExecutable),
    keyFileHashes: {
      pyprojectToml: hashFile(paths.pyproject),
      uvLock: hashFile(paths.uvLock),
      setupPy: hashFile(paths.setupPy)
    },
    knownSourceWarnings: warnings,
    forbiddenSourceMutations: forbidden
  };
}

function detectUnexpectedSourceMutation(beforeState, afterState) {
  const warnings = [];
  const blockers = [];
  for (const key of ['pyprojectToml', 'uvLock', 'setupPy']) if (beforeState.keyFileHashes?.[key] !== afterState.keyFileHashes?.[key]) blockers.push({ blockerId: 'source_key_file_hash_changed', message: `${key} hash changed.` });
  for (const item of afterState.forbiddenSourceMutations || []) blockers.push({ blockerId: 'source_forbidden_mutation_detected', message: `${item} detected in sourceRoot.` });
  for (const item of afterState.knownSourceWarnings || []) warnings.push({ warningId: item === '.codex-temp' ? 'source_nested_codex_temp_left_from_repaired_runtime_attempt' : 'source_metadata_egg_info_created_by_cache_runtime', message: item });
  return { warnings, blockers, sourceMutationStatus: blockers.length ? 'unexpected_source_mutation' : warnings.length ? 'metadata_warning_only' : 'unchanged' };
}

function createCommandResult(paths, patch = {}) {
  return {
    commandKind: 'uv_sync_install_project_locked_existing_env',
    executableRef: paths.refs.uvExecutableRef,
    args: ['sync', '--locked', '--no-dev', '--project', paths.refs.sourceRootRef],
    cwdRef: paths.refs.sourceRootRef,
    shell: false,
    timeoutMs: TIMEOUT_MS,
    envRefs: { UV_PROJECT_ENVIRONMENT: paths.refs.pythonEnvRootRef, UV_CACHE_DIR: paths.refs.uvCacheRootRef, UV_OFFLINE: '1', UV_NO_PROGRESS: '1', PYTHONNOUSERSITE: '1', PIP_CONFIG_FILE: 'NUL', NO_COLOR: '1' },
    stdoutPreview: '',
    stderrPreview: '',
    exitCode: null,
    timedOut: false,
    started: false,
    completed: false,
    ...patch
  };
}

function runApprovedOfflineUvSyncRetry(paths, timeoutMs = TIMEOUT_MS) {
  const actualArgs = ['sync', '--locked', '--no-dev', '--project', paths.sourceRoot];
  return new Promise((resolve) => {
    childProcess.execFile(paths.uvExecutable, actualArgs, {
      cwd: paths.sourceRoot,
      env: sanitizeEnvironment(paths),
      shell: false,
      timeout: Math.min(Math.max(timeoutMs, TIMEOUT_MS), MAX_TIMEOUT_MS),
      windowsHide: true,
      maxBuffer: MAX_OUTPUT_BYTES * 2
    }, (error, stdout, stderr) => {
      resolve(createCommandResult(paths, {
        stdoutPreview: sanitizeCommandOutput(stdout),
        stderrPreview: sanitizeCommandOutput(stderr || error?.message || ''),
        exitCode: typeof error?.code === 'number' ? error.code : 0,
        timedOut: Boolean(error?.killed),
        started: true,
        completed: !error
      }));
    });
  });
}

function baseResult(input, paths, cacheVerification = {}, patch = {}) {
  const envelope = cacheVerification.approvedEntrypointMaterializationRuntimeRetryEnvelope || {};
  return {
    retryRunId: `hermes-entrypoint-materialization-runtime-retry:75b300f:${input.executedAt}`,
    retryKind: KIND,
    retryVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'hermes_agent',
    commandName: 'hermes',
    pythonEntrypoint: 'hermes_cli.main:main',
    selectedMethodCandidate: 'uv_sync_install_project_locked_existing_env',
    verifiedBuildDependency: envelope.verifiedBuildDependency || { packageName: 'setuptools', lockedPackageVersion: '81.0.0', versionConstraint: 'setuptools>=77,<83', cacheStatus: 'prefetched' },
    uvExecutableRef: paths.refs.uvExecutableRef,
    uvCacheRootRef: paths.refs.uvCacheRootRef,
    sourceRootRef: paths.refs.sourceRootRef,
    pythonEnvRootRef: paths.refs.pythonEnvRootRef,
    expectedExecutableRef: paths.refs.expectedExecutableRef,
    commandResults: [],
    beforeState: {},
    afterState: {},
    executableStatusBefore: 'unknown',
    executableStatusAfter: 'unknown',
    materializationStatus: 'not_materialized',
    sourceMutationStatus: 'unknown',
    uvStatus: 'not_executed',
    networkStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    pipStatus: 'not_executed',
    pythonDirectStatus: 'not_executed',
    setupPyDirectStatus: 'not_executed',
    hermesExecutionStatus: 'not_executed',
    scriptsStatus: 'not_executed',
    researchAdapterRetryStatus: 'not_attempted',
    status: 'blocked',
    decision: 'request_materialization_retry_repair',
    blockers: [],
    warnings: [],
    canProceedToEntrypointMaterializationVerification: false,
    canRetryResearchAdapterNow: false,
    canExecuteHermesNow: false,
    canTreatAsResearchResult: false,
    canUseFindings: false,
    canUseNetwork: false,
    canUseCredentials: false,
    canCallModels: false,
    canDeploy: false,
    recommendedNextStep: REPAIR_NEXT,
    ...patch
  };
}

function validateReadiness(paths, cacheVerification, uvVerification) {
  const blockers = [];
  const envelope = cacheVerification?.approvedEntrypointMaterializationRuntimeRetryEnvelope;
  if (!cacheVerification) blockers.push({ blockerId: 'blocked_missing_cache_verification', message: 'Cache verification result is required.' });
  else if (!['verified', 'warning_verified'].includes(cacheVerification.status) || cacheVerification.decision !== 'hermes_build_dependency_cache_verified_for_materialization_retry' || cacheVerification.canProceedToEntrypointMaterializationRuntimeRetry !== true || cacheVerification.canRetryMaterializationNow !== false || !envelope) blockers.push({ blockerId: 'blocked_cache_verification_not_ready', message: 'Cache verification is not ready for runtime retry.' });
  if (envelope && (envelope.futureRetryMustUseUvOffline !== true || envelope.futureRetryMustNotUseNetwork !== true || envelope.futureRetryMustNotExecuteHermes !== true || envelope.futureRetryMustNotUsePip !== true || envelope.verifiedBuildDependency?.packageName !== 'setuptools' || envelope.verifiedBuildDependency?.lockedPackageVersion !== '81.0.0')) blockers.push({ blockerId: 'blocked_retry_command_not_safe', message: 'Retry envelope does not enforce the required offline safety policy.' });
  if (!uvVerification || uvVerification.status !== 'verified' || !exists(paths.uvExecutable)) blockers.push({ blockerId: 'blocked_uv_not_verified', message: 'Verified uv executable is missing.' });
  if (!exists(paths.sourceRoot) || !exists(paths.pyproject) || !exists(paths.uvLock)) blockers.push({ blockerId: 'blocked_source_missing', message: 'sourceRoot, pyproject.toml or uv.lock is missing.' });
  if (!exists(paths.pythonEnvRoot) || !exists(paths.pythonExecutable)) blockers.push({ blockerId: 'blocked_python_env_missing', message: 'pythonEnvRoot or Scripts/python.exe is missing.' });
  if (!exists(paths.uvCacheRoot)) blockers.push({ blockerId: 'blocked_uv_not_verified', message: 'uv cache root is missing.' });
  return blockers;
}

async function writeArtifacts(paths, result) {
  await fs.mkdir(paths.logsRoot, { recursive: true });
  const manifest = {
    manifestKind: 'factory-hermes-entrypoint-materialization-runtime-retry-manifest',
    manifestVersion: VERSION,
    toolId: 'hermes_agent',
    commandName: result.commandName,
    pythonEntrypoint: result.pythonEntrypoint,
    selectedMethodCandidate: result.selectedMethodCandidate,
    verifiedBuildDependency: result.verifiedBuildDependency,
    uvExecutableRef: result.uvExecutableRef,
    uvCacheRootRef: result.uvCacheRootRef,
    sourceRootRef: result.sourceRootRef,
    pythonEnvRootRef: result.pythonEnvRootRef,
    expectedExecutableRef: result.expectedExecutableRef,
    approvedCommandSummary: { executableRef: paths.refs.uvExecutableRef, args: ['sync', '--locked', '--no-dev', '--project', paths.refs.sourceRootRef], shell: false, envRefs: { UV_OFFLINE: '1' } },
    commandResultSummary: result.commandResults.map((command) => ({ commandKind: command.commandKind, exitCode: command.exitCode, shell: command.shell, timedOut: command.timedOut })),
    beforeState: result.beforeState,
    afterState: result.afterState,
    materializationStatus: result.materializationStatus,
    executableStatusBefore: result.executableStatusBefore,
    executableStatusAfter: result.executableStatusAfter,
    sourceMutationStatus: result.sourceMutationStatus,
    uvStatus: result.uvStatus,
    networkStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    pipStatus: 'not_executed',
    pythonDirectStatus: 'not_executed',
    setupPyDirectStatus: 'not_executed',
    hermesExecutionStatus: 'not_executed',
    scriptsStatus: 'not_executed',
    researchAdapterRetryStatus: 'not_attempted',
    retriedAt: result.executedAt,
    retriedBy: result.executedBy,
    nextRequiredGate: 'Factory Hermes Entrypoint Materialization Verification Gate v1'
  };
  await fs.writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(paths.result, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

async function executeFactoryHermesEntrypointMaterializationRuntimeRetry(input = {}) {
  const paths = resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths();
  const allowedRoots = [paths.pythonEnvRoot, paths.uvCacheRoot, paths.logsRoot, paths.installRoot];
  for (const target of [paths.pythonEnvRoot, paths.uvCacheRoot, paths.logsRoot, paths.manifest, paths.result, paths.expectedExecutable]) {
    if (!allowedRoots.some((root) => {
      const relPath = path.relative(path.resolve(root), path.resolve(target));
      return relPath === '' || (!relPath.startsWith('..') && !path.isAbsolute(relPath));
    })) assertEntrypointMaterializationRuntimeRetryPathContained(target, paths.codexTempRoot);
  }
  const runInput = { executedAt: input.executedAt || '2026-07-22T03:10:00.000Z', executedBy: input.executedBy || 'factory-hermes-entrypoint-materialization-runtime-retry-smoke' };
  let cacheVerification = null;
  let uvVerification = null;
  try {
    cacheVerification = input.cacheVerificationResult || await readJson(paths.cacheVerificationResult);
    await readJson(paths.cacheRuntimeResult);
    await readJson(paths.cacheRuntimeManifest);
    await readJson(paths.cacheApprovalResult);
    await readJson(paths.entrypointApprovalResult);
    await readJson(paths.entrypointPlanningResult);
    uvVerification = await readJson(paths.uvProvisioningVerificationResult);
  } catch (error) {
    const result = baseResult(runInput, paths, cacheVerification || {}, { decision: 'blocked_missing_cache_verification', blockers: [{ blockerId: 'blocked_missing_cache_verification', message: sanitizeCommandOutput(error.message) }] });
    await writeArtifacts(paths, result);
    return result;
  }
  const beforeState = snapshotFilesystemState(paths);
  const executableStatusBefore = beforeState.expectedExecutableExists ? 'present' : 'missing';
  const readinessBlockers = validateReadiness(paths, cacheVerification, uvVerification);
  if (readinessBlockers.length) {
    const result = baseResult(runInput, paths, cacheVerification, { beforeState, afterState: beforeState, executableStatusBefore, executableStatusAfter: executableStatusBefore, decision: readinessBlockers[0].blockerId, blockers: readinessBlockers });
    await writeArtifacts(paths, result);
    return result;
  }
  await fs.mkdir(paths.logsRoot, { recursive: true });
  const command = await runApprovedOfflineUvSyncRetry(paths, input.timeoutMs || TIMEOUT_MS);
  const afterState = snapshotFilesystemState(paths);
  const executableStatusAfter = afterState.expectedExecutableExists ? 'present' : 'missing';
  const source = detectUnexpectedSourceMutation(beforeState, afterState);
  if (source.blockers.length) {
    const result = baseResult(runInput, paths, cacheVerification, { status: 'blocked', decision: 'blocked_unexpected_source_mutation', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, sourceMutationStatus: source.sourceMutationStatus, uvStatus: command.exitCode === 0 ? 'executed_offline_uv_sync' : 'failed_offline_uv_sync', blockers: source.blockers, warnings: source.warnings });
    await writeArtifacts(paths, result);
    return result;
  }
  const output = `${command.stdoutPreview}\n${command.stderrPreview}`;
  if (/download|fetch|network|internet|connection|resolve host|tls|http|https/iu.test(output) && command.exitCode !== 0) {
    const result = baseResult(runInput, paths, cacheVerification, { status: 'blocked', decision: 'blocked_network_attempt_detected', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, sourceMutationStatus: source.sourceMutationStatus, uvStatus: 'failed_offline_uv_sync', blockers: [{ blockerId: 'blocked_network_attempt_detected', message: command.stderrPreview || command.stdoutPreview }], warnings: source.warnings });
    await writeArtifacts(paths, result);
    return result;
  }
  if (!command.completed || command.exitCode !== 0) {
    const result = baseResult(runInput, paths, cacheVerification, { status: 'controlled_failure', decision: 'failed_uv_sync_offline_retry', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, sourceMutationStatus: source.sourceMutationStatus, uvStatus: 'failed_offline_uv_sync', blockers: [{ blockerId: 'failed_uv_sync_offline_retry', message: command.stderrPreview || command.stdoutPreview || 'uv sync offline retry failed.' }], warnings: source.warnings });
    await writeArtifacts(paths, result);
    return result;
  }
  if (!afterState.expectedExecutableExists) {
    const result = baseResult(runInput, paths, cacheVerification, { status: 'failed', decision: 'failed_entrypoint_not_created_after_retry', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, sourceMutationStatus: source.sourceMutationStatus, uvStatus: 'executed_offline_uv_sync', blockers: [{ blockerId: 'failed_entrypoint_not_created_after_retry', message: 'uv sync completed but hermes.exe was not created.' }], warnings: source.warnings });
    await writeArtifacts(paths, result);
    return result;
  }
  const result = baseResult(runInput, paths, cacheVerification, { status: 'success', decision: 'hermes_entrypoint_materialized_after_cache_verified_retry', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, materializationStatus: 'materialized', sourceMutationStatus: source.sourceMutationStatus, uvStatus: 'executed_offline_uv_sync', warnings: source.warnings, canProceedToEntrypointMaterializationVerification: true, recommendedNextStep: SUCCESS_NEXT });
  await writeArtifacts(paths, result);
  return result;
}

module.exports = { executeFactoryHermesEntrypointMaterializationRuntimeRetry, resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths, assertEntrypointMaterializationRuntimeRetryPathContained, sanitizeEnvironment, sanitizeCommandOutput, snapshotFilesystemState, detectUnexpectedSourceMutation, runApprovedOfflineUvSyncRetry };
