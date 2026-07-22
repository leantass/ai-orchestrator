const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesEntrypointMaterializationRuntimePaths, assertEntrypointMaterializationPathContained } = require('./hermes-entrypoint-materialization-runtime.path.cjs');

const KIND = 'factory-hermes-entrypoint-materialization-runtime';
const VERSION = '1.0';
const TIMEOUT_MS = 300000;
const MAX_TIMEOUT_MS = 600000;
const MAX_OUTPUT_BYTES = 12000;
const SUCCESS_NEXT = 'Proceed to Factory Hermes Entrypoint Materialization Verification Gate v1; do not retry the research adapter yet.';
const REPAIR_NEXT = 'Review Factory Hermes Entrypoint Materialization Runtime Adapter v1 result and repair before retrying; do not execute Hermes.';
const secretKey = /SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE|OPENAI|GITHUB_TOKEN|NPM_TOKEN|NODE_AUTH_TOKEN|UV_INDEX|PIP_INDEX|PIP_EXTRA_INDEX|TWINE/iu;
const secretValue = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/giu;

async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
function sanitizeCommandOutput(value) { return Buffer.from(String(value || '').replace(secretValue, '[REDACTED]').replace(/\r/g, '')).subarray(0, MAX_OUTPUT_BYTES).toString('utf8'); }
function hashFile(file) { return fsSync.existsSync(file) ? crypto.createHash('sha256').update(fsSync.readFileSync(file)).digest('hex') : null; }
function fileSize(file) { try { return fsSync.statSync(file).size; } catch { return null; } }
function exists(file) { return fsSync.existsSync(file); }
function topLevelSourceEntries(sourceRoot) { try { return fsSync.readdirSync(sourceRoot, { withFileTypes: true }).slice(0, 80).map((d) => d.name); } catch { return []; } }

function sanitizeEnvironment(paths, env = process.env) {
  const keep = ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA'];
  const clean = {};
  for (const key of keep) if (env[key] && !secretKey.test(key)) clean[key] = env[key];
  clean.UV_PROJECT_ENVIRONMENT = paths.pythonEnvRoot;
  clean.UV_CACHE_DIR = paths.uvCacheRoot;
  clean.UV_NO_PROGRESS = '1';
  clean.UV_OFFLINE = '1';
  clean.PYTHONNOUSERSITE = '1';
  clean.PIP_CONFIG_FILE = 'NUL';
  clean.NO_COLOR = '1';
  clean.HERMES_NO_NETWORK = '1';
  clean.HERMES_NO_MODEL_CALLS = '1';
  clean.HERMES_NO_CREDENTIALS = '1';
  return clean;
}

function snapshotFilesystemState(paths) {
  const suspicious = topLevelSourceEntries(paths.sourceRoot).filter((name) => name === 'dist' || name === 'build' || name === '.venv' || name === '__pycache__' || name.endsWith('.egg-info'));
  return {
    expectedExecutableExists: exists(paths.expectedExecutable),
    expectedExecutableSize: fileSize(paths.expectedExecutable),
    expectedExecutableSha256: hashFile(paths.expectedExecutable),
    pythonEnvRootExists: exists(paths.pythonEnvRoot),
    sourceRootExists: exists(paths.sourceRoot),
    pyprojectExists: exists(paths.pyproject),
    uvLockExists: exists(paths.uvLock),
    setupPyExists: exists(paths.setupPy),
    pythonExecutableExists: exists(paths.pythonExecutable),
    keyFileHashes: {
      pyprojectToml: hashFile(paths.pyproject),
      uvLock: hashFile(paths.uvLock),
      setupPy: hashFile(paths.setupPy),
    },
    sourceTopLevelEntryCount: topLevelSourceEntries(paths.sourceRoot).length,
    sourceMutationHints: suspicious,
  };
}

function detectUnexpectedSourceMutation(beforeState, afterState) {
  const warnings = [];
  for (const key of ['pyprojectToml', 'uvLock', 'setupPy']) if (beforeState.keyFileHashes[key] !== afterState.keyFileHashes[key]) warnings.push({ warningId: 'source_key_file_hash_changed', message: `${key} hash changed.` });
  for (const hint of afterState.sourceMutationHints || []) {
    if (hint === 'dist' || hint === 'build' || hint === '.venv') warnings.push({ warningId: 'source_disallowed_build_artifact_detected', message: `${hint} appeared in sourceRoot.` });
    else warnings.push({ warningId: 'source_metadata_artifact_detected', message: `${hint} detected in sourceRoot.` });
  }
  return warnings;
}

function validateInputs(paths, approval, planning, pythonInstallVerification, uvVerification) {
  const blockers = [];
  const envelope = approval && approval.approvedEntrypointMaterializationRuntimeEnvelope;
  if (!approval || !envelope || approval.status !== 'approved_for_runtime_candidate' || approval.decision !== 'hermes_entrypoint_materialization_approved_for_runtime_candidate' || approval.canProceedToEntrypointMaterializationRuntime !== true || approval.canMaterializeEntrypointNow !== false || approval.canRetryAdapterNow !== false) blockers.push({ blockerId: 'blocked_missing_approval_envelope', message: 'Approval envelope is missing or not approved.' });
  if (approval && (approval.commandName !== 'hermes' || approval.pythonEntrypoint !== 'hermes_cli.main:main' || approval.selectedMethodCandidate !== 'uv_sync_install_project_locked_existing_env')) blockers.push({ blockerId: 'blocked_approved_command_not_safe', message: 'Approval identity or method is not safe.' });
  if (envelope) {
    const args = envelope.approvedRuntimeCommand && envelope.approvedRuntimeCommand.args || [];
    if (envelope.uvExecutableRef !== paths.refs.uvExecutableRef || envelope.selectedMethodCandidate !== 'uv_sync_install_project_locked_existing_env' || envelope.approvedRuntimeCommand.shell !== false || JSON.stringify(args) !== JSON.stringify(['sync', '--locked', '--no-dev', '--project', '<sourceRoot>']) || args.includes('--no-install-project') || envelope.buildRiskAcceptance.setupPyDirectExecutionAllowed !== false || envelope.futureRuntimeMayMaterializeEntrypointUnderEnvelope !== true) blockers.push({ blockerId: 'blocked_approved_command_not_safe', message: 'Approved runtime command does not match the required safe shape.' });
  }
  if (!planning || planning.status !== 'plan_candidate_created') blockers.push({ blockerId: 'blocked_missing_approval_envelope', message: 'Planning result is missing or invalid.' });
  if (!uvVerification || uvVerification.status !== 'verified' || uvVerification.decision !== 'uv_provisioning_verified' || uvVerification.executableRef !== paths.refs.uvExecutableRef) blockers.push({ blockerId: 'blocked_uv_not_verified', message: 'uv verification is missing or not verified.' });
  if (!pythonInstallVerification || pythonInstallVerification.status !== 'verified' || pythonInstallVerification.decision !== 'hermes_python_install_verified') blockers.push({ blockerId: 'blocked_python_env_missing', message: 'Python install verification is missing or not verified.' });
  if (!exists(paths.uvExecutable)) blockers.push({ blockerId: 'blocked_uv_not_verified', message: 'uv.exe is missing.' });
  if (!exists(paths.sourceRoot) || !exists(paths.pyproject) || !exists(paths.uvLock)) blockers.push({ blockerId: 'blocked_source_missing', message: 'sourceRoot, pyproject.toml or uv.lock is missing.' });
  if (!exists(paths.pythonEnvRoot) || !exists(paths.pythonExecutable)) blockers.push({ blockerId: 'blocked_python_env_missing', message: 'pythonEnvRoot or Scripts/python.exe is missing.' });
  return blockers;
}

function baseResult(input, paths, approval = {}, patch = {}) {
  const envelope = approval.approvedEntrypointMaterializationRuntimeEnvelope || {};
  return {
    materializationRunId: `hermes-entrypoint-materialization-runtime:75b300f:${input.executedAt}`,
    materializationKind: KIND,
    materializationVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'hermes_agent',
    selectedCandidateId: approval.selectedCandidateId || envelope.selectedCandidateId || '',
    commandName: approval.commandName || envelope.commandName || '',
    pythonEntrypoint: approval.pythonEntrypoint || envelope.pythonEntrypoint || '',
    selectedMethodCandidate: approval.selectedMethodCandidate || envelope.selectedMethodCandidate || '',
    uvExecutableRef: paths.refs.uvExecutableRef,
    sourceRootRef: paths.refs.sourceRootRef,
    pythonEnvRootRef: paths.refs.pythonEnvRootRef,
    expectedExecutableRef: paths.refs.expectedExecutableRef,
    setupPyPresent: exists(paths.setupPy),
    buildBackend: envelope.buildRiskAcceptance && envelope.buildRiskAcceptance.buildBackend || 'setuptools.build_meta',
    commandResults: [],
    beforeState: {},
    afterState: {},
    executableStatusBefore: 'unknown',
    executableStatusAfter: 'unknown',
    materializationStatus: 'not_materialized',
    uvStatus: 'not_executed',
    pipStatus: 'not_executed',
    pythonDirectStatus: 'not_executed',
    setupPyDirectStatus: 'not_executed',
    hermesExecutionStatus: 'not_executed',
    scriptsStatus: 'not_executed',
    networkStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'bounded_python_env_and_uv_cache_only',
    status: 'blocked',
    decision: 'request_materialization_runtime_repair',
    blockers: [],
    warnings: [],
    checks: [],
    canProceedToEntrypointMaterializationVerification: false,
    canRetryResearchAdapterNow: false,
    canExecuteHermesNow: false,
    canTreatAsResearchResult: false,
    canUseFindings: false,
    canUseCredentials: false,
    canCallModels: false,
    canDeploy: false,
    recommendedNextStep: REPAIR_NEXT,
    ...patch,
  };
}

function createCommandResult(paths, patch = {}) {
  return {
    commandKind: 'uv_sync_install_project_locked_existing_env',
    executableRef: paths.refs.uvExecutableRef,
    args: ['sync', '--locked', '--no-dev', '--project', paths.refs.sourceRootRef],
    cwdRef: paths.refs.sourceRootRef,
    shell: false,
    timeoutMs: TIMEOUT_MS,
    envRefs: { UV_PROJECT_ENVIRONMENT: paths.refs.pythonEnvRootRef, UV_CACHE_DIR: paths.refs.uvCacheRootRef, UV_OFFLINE: '1' },
    stdoutPreview: '',
    stderrPreview: '',
    exitCode: null,
    timedOut: false,
    started: false,
    completed: false,
    ...patch,
  };
}

async function runApprovedUvSyncProjectInstall(paths, timeoutMs = TIMEOUT_MS) {
  const args = ['sync', '--locked', '--no-dev', '--project', paths.sourceRoot];
  return await new Promise((resolve) => {
    childProcess.execFile(paths.uvExecutable, args, {
      cwd: paths.sourceRoot,
      env: sanitizeEnvironment(paths),
      shell: false,
      timeout: Math.min(Math.max(timeoutMs, TIMEOUT_MS), MAX_TIMEOUT_MS),
      windowsHide: true,
      maxBuffer: MAX_OUTPUT_BYTES * 2,
    }, (error, stdout, stderr) => {
      resolve(createCommandResult(paths, {
        stdoutPreview: sanitizeCommandOutput(stdout),
        stderrPreview: sanitizeCommandOutput(stderr || error?.message || ''),
        exitCode: typeof error?.code === 'number' ? error.code : 0,
        timedOut: Boolean(error?.killed),
        started: true,
        completed: !error,
      }));
    });
  });
}

async function writeArtifacts(paths, result) {
  await fs.mkdir(paths.logsRoot, { recursive: true });
  await fs.mkdir(paths.uvCacheRoot, { recursive: true });
  const manifest = {
    manifestKind: 'factory_hermes_entrypoint_materialization_runtime_manifest',
    manifestVersion: VERSION,
    toolId: 'hermes_agent',
    selectedCandidateId: result.selectedCandidateId,
    commandName: result.commandName,
    pythonEntrypoint: result.pythonEntrypoint,
    selectedMethodCandidate: result.selectedMethodCandidate,
    uvExecutableRef: result.uvExecutableRef,
    sourceRootRef: result.sourceRootRef,
    pythonEnvRootRef: result.pythonEnvRootRef,
    expectedExecutableRef: result.expectedExecutableRef,
    buildBackend: result.buildBackend,
    setupPyPresent: result.setupPyPresent,
    approvedCommandSummary: { executableRef: paths.refs.uvExecutableRef, args: ['sync', '--locked', '--no-dev', '--project', paths.refs.sourceRootRef], shell: false },
    commandResultSummary: result.commandResults.map((c) => ({ commandKind: c.commandKind, exitCode: c.exitCode, shell: c.shell, timedOut: c.timedOut })),
    beforeState: result.beforeState,
    afterState: result.afterState,
    materializationStatus: result.materializationStatus,
    executableStatusBefore: result.executableStatusBefore,
    executableStatusAfter: result.executableStatusAfter,
    uvStatus: result.uvStatus,
    pipStatus: 'not_executed',
    pythonDirectStatus: 'not_executed',
    setupPyDirectStatus: 'not_executed',
    hermesExecutionStatus: 'not_executed',
    scriptsStatus: 'not_executed',
    networkStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    materializedAt: result.executedAt,
    materializedBy: result.executedBy,
    nextRequiredGate: 'Factory Hermes Entrypoint Materialization Verification Gate v1',
  };
  await fs.writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(paths.result, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

async function executeFactoryHermesEntrypointMaterializationRuntime(input = {}) {
  const paths = resolveFactoryHermesEntrypointMaterializationRuntimePaths();
  const runInput = { executedAt: input.executedAt || '2026-07-21T23:45:00.000Z', executedBy: input.executedBy || 'factory-hermes-entrypoint-materialization-runtime-smoke' };
  for (const target of [paths.installRoot, paths.sourceRoot, paths.pythonEnvRoot, paths.uvRoot, paths.uvExecutable, paths.uvCacheRoot, paths.expectedExecutable, paths.logsRoot, paths.manifest, paths.result]) assertEntrypointMaterializationPathContained(target, paths.codexTempRoot);
  let approval = {}; let planning = {}; let pythonInstallVerification = {}; let uvVerification = {};
  try {
    approval = await readJson(paths.approvalResult);
    planning = await readJson(paths.planningResult);
    pythonInstallVerification = await readJson(paths.pythonInstallVerificationResult);
    uvVerification = await readJson(paths.uvProvisioningVerificationResult);
  } catch (error) {
    const result = baseResult(runInput, paths, approval, { decision: 'blocked_missing_approval_envelope', blockers: [{ blockerId: 'blocked_missing_approval_envelope', message: sanitizeCommandOutput(error.message) }] });
    await writeArtifacts(paths, result);
    return result;
  }
  const beforeState = snapshotFilesystemState(paths);
  const executableStatusBefore = beforeState.expectedExecutableExists ? 'present' : 'missing';
  const blockers = validateInputs(paths, approval, planning, pythonInstallVerification, uvVerification);
  if (blockers.length) {
    const decision = blockers[0].blockerId;
    const result = baseResult(runInput, paths, approval, { beforeState, afterState: beforeState, executableStatusBefore, executableStatusAfter: executableStatusBefore, decision, blockers });
    await writeArtifacts(paths, result);
    return result;
  }
  await fs.mkdir(paths.logsRoot, { recursive: true });
  await fs.mkdir(paths.uvCacheRoot, { recursive: true });
  const command = await runApprovedUvSyncProjectInstall(paths, input.timeoutMs || TIMEOUT_MS);
  const afterState = snapshotFilesystemState(paths);
  const executableStatusAfter = afterState.expectedExecutableExists ? 'present' : 'missing';
  const warnings = detectUnexpectedSourceMutation(beforeState, afterState);
  if (!command.completed || command.exitCode !== 0) {
    const networkRequired = /offline|network|cache|download|fetch|registry|index/iu.test(`${command.stdoutPreview}\n${command.stderrPreview}`);
    const result = baseResult(runInput, paths, approval, {
      status: 'failed',
      decision: networkRequired ? 'blocked_network_required' : 'failed_uv_sync_project_install',
      commandResults: [command],
      beforeState,
      afterState,
      executableStatusBefore,
      executableStatusAfter,
      materializationStatus: 'not_materialized',
      uvStatus: 'failed_uv_sync_project_install',
      blockers: [{ blockerId: networkRequired ? 'blocked_network_required' : 'failed_uv_sync_project_install', message: command.stderrPreview || command.stdoutPreview }],
      warnings,
    });
    await writeArtifacts(paths, result);
    return result;
  }
  if (!afterState.expectedExecutableExists) {
    const result = baseResult(runInput, paths, approval, { status: 'failed', decision: 'failed_entrypoint_not_created_after_sync', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, materializationStatus: 'not_materialized', uvStatus: 'executed_verified_allowlisted', blockers: [{ blockerId: 'failed_entrypoint_not_created_after_sync', message: 'uv sync completed but hermes.exe was not created.' }], warnings });
    await writeArtifacts(paths, result);
    return result;
  }
  const result = baseResult(runInput, paths, approval, { status: 'success', decision: 'hermes_entrypoint_materialized_with_uv_sync_project_install', commandResults: [command], beforeState, afterState, executableStatusBefore, executableStatusAfter, materializationStatus: 'materialized', uvStatus: 'executed_verified_allowlisted', warnings, canProceedToEntrypointMaterializationVerification: true, recommendedNextStep: SUCCESS_NEXT });
  await writeArtifacts(paths, result);
  return result;
}

module.exports = { executeFactoryHermesEntrypointMaterializationRuntime, resolveFactoryHermesEntrypointMaterializationRuntimePaths, assertEntrypointMaterializationPathContained, sanitizeEnvironment, sanitizeCommandOutput, snapshotFilesystemState, detectUnexpectedSourceMutation, runApprovedUvSyncProjectInstall };
