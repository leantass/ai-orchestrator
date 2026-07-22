const childProcess = require('node:child_process');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesResearchRuntimeAdapterPaths, assertAdapterPathContained } = require('./hermes-research-runtime-adapter.path.cjs');

const KIND = 'factory-hermes-research-runtime-adapter';
const VERSION = '1.0';
const NEXT = 'Proceed to Factory Hermes Research Result Ingestion Gate v1; this help probe is not a research result.';
const TIMEOUT_MS = 30000;
const MAX_OUTPUT_BYTES = 12000;
const secretKey = /SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE|OPENAI|GITHUB_TOKEN|NPM_TOKEN|NODE_AUTH_TOKEN|UV_INDEX|PIP_INDEX|PIP_EXTRA_INDEX|TWINE/iu;
const secretValue = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/giu;

async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
function toRef(root, file) { return path.relative(root, file).replace(/\\/g, '/'); }
function sanitizeCommandOutput(value) {
  return Buffer.from(String(value || '').replace(secretValue, '[REDACTED]')).subarray(0, MAX_OUTPUT_BYTES).toString('utf8');
}
function sanitizeEnvironment(env = process.env) {
  const allowed = ['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA'];
  const clean = {};
  for (const key of allowed) if (env[key] && !secretKey.test(key)) clean[key] = env[key];
  clean.HERMES_FACTORY_MODE = 'help_probe_only';
  clean.PYTHONNOUSERSITE = '1';
  clean.NO_COLOR = '1';
  clean.HERMES_DISABLE_TELEMETRY = '1';
  clean.HERMES_NO_NETWORK = '1';
  clean.HERMES_NO_MODEL_CALLS = '1';
  clean.HERMES_NO_CREDENTIALS = '1';
  return clean;
}
function createCommandResult(paths, patch = {}) {
  return {
    commandKind: 'hermes_help_probe',
    executableRef: toRef(paths.root, paths.executableRef),
    args: ['--help'],
    cwdRef: toRef(paths.root, paths.sourceRoot),
    shell: false,
    timeoutMs: TIMEOUT_MS,
    stdinStatus: 'closed',
    stdoutPreview: '',
    stderrPreview: '',
    exitCode: null,
    timedOut: false,
    killed: false,
    started: false,
    completed: false,
    ...patch,
  };
}
function createBaseResult(input, paths, approval = {}, patch = {}) {
  const selected = approval.approvedHermesResearchRuntimeAdapterEnvelope?.selectedInterface || approval.selectedInterface || {};
  return {
    adapterRunId: `hermes-research-runtime-adapter:75b300f:${input.executedAt}`,
    adapterKind: KIND,
    adapterVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'hermes_agent',
    selectedCandidateId: approval.selectedCandidateId || '',
    commandName: approval.commandName || selected.commandName || '',
    pythonEntrypoint: approval.pythonEntrypoint || selected.pythonEntrypoint || '',
    executableRef: toRef(paths.root, paths.executableRef),
    cwdRef: toRef(paths.root, paths.sourceRoot),
    outputRootRef: toRef(paths.root, paths.outputRoot),
    tempRootRef: toRef(paths.root, paths.tempRoot),
    mode: input.mode || 'help_probe_only',
    commandResults: [createCommandResult(paths)],
    stdoutPreview: '',
    stderrPreview: '',
    exitCode: null,
    timedOut: false,
    killed: false,
    status: 'blocked',
    decision: 'request_adapter_repair',
    blockers: [],
    warnings: [],
    networkStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    filesystemMutationStatus: 'bounded_artifacts_only',
    hermesExecutionStatus: 'not_executed',
    scriptsStatus: 'not_executed',
    pipStatus: 'not_executed',
    pythonDirectStatus: 'not_executed',
    setupPyStatus: 'not_executed',
    uvStatus: 'not_executed',
    canProceedToResultIngestion: false,
    canTreatAsResearchResult: false,
    canUseFindings: false,
    canCallModels: false,
    canUseCredentials: false,
    canUseNetwork: false,
    canDeploy: false,
    recommendedNextStep: NEXT,
    ...patch,
  };
}
function validateInputs(input, approval, boundary) {
  const envelope = approval.approvedHermesResearchRuntimeAdapterEnvelope;
  if (!envelope || approval.status !== 'approved_for_adapter_candidate' || approval.decision !== 'hermes_research_runtime_approved_for_adapter_candidate' || approval.canProceedToResearchRuntimeAdapter !== true || approval.canCreateRuntimeNow !== false || approval.canExecuteHermesNow !== false || envelope.executionAuthorizationScope !== 'future_runtime_adapter_only') return 'blocked_missing_approval_envelope';
  if (approval.selectedCandidateId !== 'pyproject-console-script-1' || approval.commandName !== 'hermes' || approval.pythonEntrypoint !== 'hermes_cli.main:main' || envelope.selectedInterface?.commandName !== 'hermes' || envelope.selectedInterface?.pythonEntrypoint !== 'hermes_cli.main:main') return 'blocked_missing_approval_envelope';
  const contract = boundary.hermesResearchRuntimeBoundaryContract;
  if (boundary.status !== 'boundary_contract_created' || boundary.canCreateRuntimeNow !== false || boundary.canExecuteHermes !== false || boundary.canUseNetwork !== false || boundary.canUseCredentials !== false || boundary.canCallModels !== false || contract?.commandBoundary?.futureCommandCandidate?.shell !== false || contract.commandBoundary.commandsAllowedNow.length !== 0 || contract.networkBoundary.networkAllowedNow !== false || contract.credentialBoundary.credentialsAllowedNow !== false || contract.modelBoundary.modelCallsAllowedNow !== false) return 'blocked_boundary_not_satisfied';
  if ((input.mode || 'help_probe_only') !== 'help_probe_only') return 'blocked_mode_not_allowed';
  return '';
}
function runHermesHelpProbe(paths) {
  return new Promise((resolve) => {
    const child = childProcess.execFile(paths.executableRef, ['--help'], {
      cwd: paths.sourceRoot,
      env: sanitizeEnvironment(),
      shell: false,
      timeout: TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: MAX_OUTPUT_BYTES * 2,
    }, (error, stdout, stderr) => {
      const timedOut = Boolean(error && error.killed && error.signal === 'SIGTERM');
      resolve(createCommandResult(paths, {
        stdoutPreview: sanitizeCommandOutput(stdout),
        stderrPreview: sanitizeCommandOutput(stderr || error?.message || ''),
        exitCode: typeof error?.code === 'number' ? error.code : 0,
        timedOut,
        killed: Boolean(error?.killed),
        started: true,
        completed: !timedOut,
      }));
    });
    if (child.stdin) child.stdin.end();
  });
}
async function writeResult(paths, result) {
  await fs.mkdir(paths.outputRoot, { recursive: true });
  await fs.mkdir(paths.tempRoot, { recursive: true });
  await fs.writeFile(paths.adapterResult, JSON.stringify(result, null, 2));
}
async function executeFactoryHermesResearchRuntimeAdapter(input = {}) {
  const paths = resolveFactoryHermesResearchRuntimeAdapterPaths();
  const codexTempRoot = path.join(paths.root, '.codex-temp');
  for (const target of [paths.installRoot, paths.sourceRoot, paths.pythonEnvRoot, paths.executableRef, paths.outputRoot, paths.tempRoot, paths.adapterResult]) assertAdapterPathContained(target, codexTempRoot);
  const runInput = { executedAt: input.executedAt || '2026-07-21T20:00:00.000Z', executedBy: input.executedBy || 'factory-hermes-research-runtime-adapter-smoke', mode: input.mode || 'help_probe_only' };
  let approval = {}; let boundary = {};
  try {
    approval = await readJson(paths.approvalResult);
    boundary = await readJson(paths.boundaryResult);
    await readJson(paths.interfaceSelectionResult);
    await readJson(paths.pythonInstallVerificationResult);
  } catch (error) {
    const result = createBaseResult(runInput, paths, approval, { status: 'blocked', decision: 'blocked_missing_approval_envelope', blockers: [`Missing or invalid input artifact: ${error.message}`] });
    await writeResult(paths, result);
    return result;
  }
  const blockedDecision = validateInputs(runInput, approval, boundary);
  if (blockedDecision) {
    const result = createBaseResult(runInput, paths, approval, { status: 'blocked', decision: blockedDecision, blockers: [`Adapter input validation failed: ${blockedDecision}`] });
    await writeResult(paths, result);
    return result;
  }
  if (!fsSync.existsSync(paths.executableRef)) {
    const result = createBaseResult(runInput, paths, approval, { status: 'blocked', decision: 'blocked_executable_missing', blockers: [`Executable not found: ${toRef(paths.root, paths.executableRef)}`], canProceedToResultIngestion: true });
    await writeResult(paths, result);
    return result;
  }
  if (!fsSync.existsSync(paths.sourceRoot)) {
    const result = createBaseResult(runInput, paths, approval, { status: 'blocked', decision: 'blocked_boundary_not_satisfied', blockers: [`Source root not found: ${toRef(paths.root, paths.sourceRoot)}`] });
    await writeResult(paths, result);
    return result;
  }
  await fs.mkdir(paths.outputRoot, { recursive: true });
  await fs.mkdir(paths.tempRoot, { recursive: true });
  const command = await runHermesHelpProbe(paths);
  const helpLike = /usage|help|options|commands/iu.test(`${command.stdoutPreview}\n${command.stderrPreview}`);
  const timedOut = command.timedOut;
  const completed = !timedOut && (command.exitCode === 0 || helpLike);
  const result = createBaseResult(runInput, paths, approval, {
    commandResults: [command],
    stdoutPreview: command.stdoutPreview,
    stderrPreview: command.stderrPreview,
    exitCode: command.exitCode,
    timedOut,
    killed: command.killed,
    status: timedOut ? 'timed_out' : completed ? 'completed' : 'failed',
    decision: timedOut ? 'timed_out_hermes_help_probe' : completed ? 'hermes_research_runtime_help_probe_completed' : 'failed_hermes_help_probe',
    hermesExecutionStatus: timedOut ? 'help_probe_only_timed_out' : completed ? 'help_probe_only_completed' : 'help_probe_only_failed',
    canProceedToResultIngestion: true,
  });
  await writeResult(paths, result);
  return result;
}

module.exports = { executeFactoryHermesResearchRuntimeAdapter, sanitizeEnvironment, sanitizeCommandOutput, runHermesHelpProbe };
