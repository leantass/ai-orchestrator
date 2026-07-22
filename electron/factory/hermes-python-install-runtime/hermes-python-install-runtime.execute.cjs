const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const {
  resolveFactoryHermesPythonInstallRuntimePaths,
} = require('./hermes-python-install-runtime.path.cjs');

const KIND = 'factory_hermes_python_install_runtime';
const VERSION = '1.0';
const NEXT_STEP = 'Proceed to Factory Hermes Python Install Verification Gate v1 before planning any Hermes runtime.';
const FORBIDDEN_ENV = /(SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE|OPENAI|GITHUB_TOKEN|NPM_TOKEN|NODE_AUTH_TOKEN|UV_INDEX|PIP_INDEX|PIP_EXTRA_INDEX|TWINE)/iu;
const KEEP_ENV = new Set(['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA']);
const COMMAND_TIMEOUT_MS = 300000;

function sanitizeCommandOutput(value) {
  return String(value ?? '').replace(/(api[_-]?key|secret|token|password)\s*[:=]\s*[^\s]+/giu, '$1=<redacted>').slice(0, 4000);
}

function sanitizeEnvironment(baseEnv, pythonEnvRootRef) {
  const env = {};
  for (const [key, value] of Object.entries(baseEnv ?? process.env)) {
    if (FORBIDDEN_ENV.test(key)) continue;
    if (KEEP_ENV.has(key)) env[key] = value;
  }
  env.UV_PROJECT_ENVIRONMENT = pythonEnvRootRef;
  env.UV_NO_PROGRESS = '1';
  env.PYTHONNOUSERSITE = '1';
  env.PIP_CONFIG_FILE = process.platform === 'win32' ? 'NUL' : '/dev/null';
  return env;
}

function envSummary(env) {
  return {
    UV_PROJECT_ENVIRONMENT: env.UV_PROJECT_ENVIRONMENT,
    UV_NO_PROGRESS: env.UV_NO_PROGRESS,
    PYTHONNOUSERSITE: env.PYTHONNOUSERSITE,
    PIP_CONFIG_FILE: env.PIP_CONFIG_FILE,
  };
}

function commandResult(commandKind, executableUsed, command, cwd, env, exitCode, stdout, stderr, startedAt, timedOut) {
  return {
    commandKind,
    executableUsed,
    commandDisplay: command.join(' '),
    command,
    cwd,
    envSummary: envSummary(env),
    shell: false,
    exitCode,
    stdout: sanitizeCommandOutput(stdout),
    stderr: sanitizeCommandOutput(stderr),
    durationMs: Date.now() - startedAt,
    timedOut,
  };
}

function runAllowedPythonInstallCommand({ commandKind, executable, args, cwd, env }) {
  const allowed =
    (commandKind === 'uv_version' && args.length === 1 && args[0] === '--version') ||
    (commandKind === 'uv_venv' && args.length === 2 && args[0] === 'venv') ||
    (commandKind === 'uv_sync_locked_no_install_project' && args.length === 6 && args[0] === 'sync' && args[1] === '--locked' && args[2] === '--no-install-project' && args[3] === '--no-dev' && args[4] === '--project');
  if (!allowed) throw new Error(`Command is not allowlisted: ${commandKind}`);
  const startedAt = Date.now();
  return new Promise((resolve) => {
    execFile(executable, args, { cwd, env, shell: false, timeout: COMMAND_TIMEOUT_MS, windowsHide: true }, (error, stdout, stderr) => {
      resolve(commandResult(commandKind, executable, [executable, ...args], cwd, env, typeof error?.code === 'number' ? error.code : error ? 1 : 0, stdout, stderr, startedAt, Boolean(error?.killed)));
    });
  });
}

async function hashFile(file) {
  const content = await fs.readFile(file);
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
}

function findUvExecutable(envPath = process.env.PATH ?? process.env.Path ?? '') {
  const names = process.platform === 'win32' ? ['uv.exe', 'uv'] : ['uv'];
  const delimiter = process.platform === 'win32' ? ';' : ':';
  for (const dir of envPath.split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (fsSync.existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

function baseResult(input, envelope, extra) {
  return {
    pythonInstallRuntimeId: `hermes-python-install-runtime:${envelope?.auditedHead?.slice(0, 12) ?? 'blocked'}:${input.executedAt}`,
    pythonInstallRuntimeKind: KIND,
    pythonInstallRuntimeVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'hermes_agent',
    auditedHead: envelope?.auditedHead,
    sourceRootRef: envelope?.sourceRootRef,
    installRootRef: envelope?.installRootRef,
    pythonEnvRootRef: envelope?.pythonEnvRootRef,
    managerDecision: envelope?.managerDecision,
    pythonInstallMethodScope: envelope?.pythonInstallMethodScope,
    manifest: extra.manifest,
    commandResults: extra.commandResults ?? [],
    checks: extra.checks ?? [],
    blockers: extra.blockers ?? [],
    warnings: extra.warnings ?? [],
    status: extra.status,
    decision: extra.decision,
    uvStatus: extra.uvStatus ?? 'not_executed',
    venvStatus: extra.venvStatus ?? 'not_created',
    pythonInstallStatus: extra.pythonInstallStatus ?? 'not_installed',
    pipStatus: 'not_executed',
    setupPyStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    scriptsStatus: 'not_executed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: extra.nextStep ?? NEXT_STEP,
  };
}

async function writeArtifacts(paths, result) {
  await fs.mkdir(path.dirname(paths.manifestPath), { recursive: true });
  if (result.manifest) await fs.writeFile(paths.manifestPath, `${JSON.stringify(result.manifest, null, 2)}\n`);
  await fs.writeFile(paths.resultPath, `${JSON.stringify(result, null, 2)}\n`);
}

function createManifest({ input, envelope, paths, uvExecutable, uvVersion, commandResults, status }) {
  return {
    manifestKind: 'factory_hermes_python_install_manifest',
    manifestVersion: VERSION,
    toolId: 'hermes_agent',
    auditedHead: envelope.auditedHead,
    sourceRootRef: envelope.sourceRootRef,
    installRootRef: envelope.installRootRef,
    pythonEnvRootRef: envelope.pythonEnvRootRef,
    managerDecision: envelope.managerDecision,
    pythonInstallMethodScope: envelope.pythonInstallMethodScope,
    pyprojectPresent: fsSync.existsSync(path.join(paths.sourceRoot, 'pyproject.toml')),
    uvLockPresent: fsSync.existsSync(path.join(paths.sourceRoot, 'uv.lock')),
    setupPyPresent: fsSync.existsSync(path.join(paths.sourceRoot, 'setup.py')),
    uvExecutableUsed: uvExecutable,
    uvVersion,
    commandSummary: commandResults.map((command) => ({ commandKind: command.commandKind, exitCode: command.exitCode, shell: false })),
    pythonInstallStatus: status.success ? 'installed_with_uv_lock_isolated' : 'not_installed',
    venvStatus: status.success || status.venvCreated ? 'created_with_uv' : 'not_created',
    uvStatus: commandResults.length > 0 ? 'executed_allowlisted' : 'not_executed',
    pipStatus: 'not_executed',
    setupPyStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    scriptsStatus: 'not_executed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    installedAt: input.executedAt,
    installedBy: input.executedBy,
    nextRequiredGate: 'Factory Hermes Python Install Verification Gate v1',
  };
}

async function executeFactoryHermesPythonInstallRuntime(input, options = {}) {
  const approval = input?.hermesPythonInstallApprovalResult;
  const envelope = approval?.approvedPythonInstallEnvelope;
  const blockers = [];
  if (!approval || !envelope || approval.status !== 'python_install_envelope_candidate_approved') blockers.push({ blockerId: 'invalid_approval', message: 'Approved Python install envelope is required.' });
  if (envelope?.managerDecision !== 'prefer_uv_lock' || envelope?.pythonInstallMethodScope !== 'uv_lock_isolated_only') blockers.push({ blockerId: 'invalid_method_scope', message: 'Only prefer_uv_lock / uv_lock_isolated_only is allowed.' });
  if (blockers.length > 0) return baseResult(input, envelope, { status: 'blocked', decision: 'blocked_invalid_python_install_envelope', blockers });
  const paths = resolveFactoryHermesPythonInstallRuntimePaths(input, options);
  const checks = [];
  const commandResults = [];
  const beforePackageHash = await hashFile(path.join(paths.repoRoot, 'package.json'));
  const beforeLockHash = await hashFile(path.join(paths.repoRoot, 'package-lock.json'));
  if (!fsSync.existsSync(paths.sourceRoot)) blockers.push({ blockerId: 'missing_source_root', message: 'sourceRoot does not exist.' });
  if (!fsSync.existsSync(paths.installRoot)) blockers.push({ blockerId: 'missing_install_root', message: 'installRoot does not exist.' });
  if (!fsSync.existsSync(path.join(paths.sourceRoot, 'pyproject.toml'))) blockers.push({ blockerId: 'missing_pyproject', message: 'pyproject.toml is required.' });
  if (!fsSync.existsSync(path.join(paths.sourceRoot, 'uv.lock'))) blockers.push({ blockerId: 'missing_uv_lock', message: 'uv.lock is required.' });
  if (blockers.length > 0) return baseResult(input, envelope, { status: 'blocked', decision: 'blocked_invalid_python_install_envelope', blockers, checks });
  const uvExecutable = findUvExecutable(options.envPath);
  if (!uvExecutable) {
    const result = baseResult(input, envelope, {
      status: 'blocked',
      decision: 'blocked_uv_executable_not_found',
      uvStatus: 'not_found',
      blockers: [{ blockerId: 'uv_executable_not_found', message: 'uv executable was not found on PATH; no fallback is allowed.' }],
      checks,
      commandResults,
      nextStep: 'Install or approve uv runtime strategy, then rerun Python Install Runtime Adapter. Do not fallback to pip.',
    });
    await writeArtifacts(paths, result);
    return result;
  }
  await fs.mkdir(paths.logsRoot, { recursive: true });
  const env = sanitizeEnvironment(process.env, envelope.pythonEnvRootRef);
  const versionResult = await runAllowedPythonInstallCommand({ commandKind: 'uv_version', executable: uvExecutable, args: ['--version'], cwd: paths.sourceRoot, env });
  commandResults.push(versionResult);
  if (versionResult.exitCode !== 0) {
    const result = baseResult(input, envelope, { status: 'failed', decision: 'request_python_install_repair', uvStatus: 'executed_allowlisted', commandResults, checks, blockers: [{ blockerId: 'uv_version_failed', message: 'uv --version failed.' }] });
    result.manifest = createManifest({ input, envelope, paths, uvExecutable, uvVersion: versionResult.stdout.trim(), commandResults, status: { success: false } });
    await writeArtifacts(paths, result);
    return result;
  }
  const venvResult = await runAllowedPythonInstallCommand({ commandKind: 'uv_venv', executable: uvExecutable, args: ['venv', paths.pythonEnvRoot], cwd: paths.repoRoot, env });
  commandResults.push(venvResult);
  if (venvResult.exitCode !== 0) {
    const result = baseResult(input, envelope, { status: 'failed', decision: 'failed_uv_venv', uvStatus: 'executed_allowlisted', commandResults, checks, blockers: [{ blockerId: 'uv_venv_failed', message: 'uv venv failed.' }] });
    result.manifest = createManifest({ input, envelope, paths, uvExecutable, uvVersion: versionResult.stdout.trim(), commandResults, status: { success: false } });
    await writeArtifacts(paths, result);
    return result;
  }
  const syncResult = await runAllowedPythonInstallCommand({ commandKind: 'uv_sync_locked_no_install_project', executable: uvExecutable, args: ['sync', '--locked', '--no-install-project', '--no-dev', '--project', envelope.sourceRootRef], cwd: paths.sourceRoot, env });
  commandResults.push(syncResult);
  if (syncResult.exitCode !== 0) {
    const result = baseResult(input, envelope, { status: 'failed', decision: 'failed_uv_sync', uvStatus: 'executed_allowlisted', venvStatus: 'created_with_uv', commandResults, checks, blockers: [{ blockerId: 'uv_sync_failed', message: 'uv sync failed.' }] });
    result.manifest = createManifest({ input, envelope, paths, uvExecutable, uvVersion: versionResult.stdout.trim(), commandResults, status: { success: false, venvCreated: true } });
    await writeArtifacts(paths, result);
    return result;
  }
  const afterPackageHash = await hashFile(path.join(paths.repoRoot, 'package.json'));
  const afterLockHash = await hashFile(path.join(paths.repoRoot, 'package-lock.json'));
  if (beforePackageHash !== afterPackageHash || beforeLockHash !== afterLockHash) blockers.push({ blockerId: 'jefe_package_files_changed', message: 'JEFE package files changed during Python install runtime.' });
  const success = blockers.length === 0;
  const result = baseResult(input, envelope, {
    status: success ? 'success' : 'failed',
    decision: success ? 'python_install_completed_with_uv_lock_isolated' : 'request_python_install_repair',
    uvStatus: 'executed_allowlisted',
    venvStatus: 'created_with_uv',
    pythonInstallStatus: success ? 'installed_with_uv_lock_isolated' : 'not_installed',
    commandResults,
    checks,
    blockers,
  });
  result.manifest = createManifest({ input, envelope, paths, uvExecutable, uvVersion: versionResult.stdout.trim(), commandResults, status: { success } });
  await writeArtifacts(paths, result);
  return result;
}

module.exports = {
  executeFactoryHermesPythonInstallRuntime,
  findUvExecutable,
  runAllowedPythonInstallCommand,
  sanitizeCommandOutput,
  sanitizeEnvironment,
};
