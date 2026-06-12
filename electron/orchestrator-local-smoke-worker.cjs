const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const {
  getDefaultToolWorkerRegistry,
  findToolWorkersForCapability,
  validateWorkerTask,
  buildWorkerTaskEnvelope,
} = require('./orchestrator-tool-worker-registry.cjs')

const repoRoot = path.resolve(__dirname, '..')
const DEFAULT_WORKER_ID = 'local-smoke-runner'
const DEFAULT_TIMEOUT_MS = 120000
const DEFAULT_MAX_COMMAND_COUNT = 30
const PREVIEW_LIMIT = 4000

const FORBIDDEN_COMMAND_PATTERNS = [
  /\bnpm\s+(install|add|i)\b/iu,
  /\bpnpm\b/iu,
  /\byarn\b/iu,
  /\bnpx\b/iu,
  /\bdocker(?:-compose)?\b/iu,
  /\bgit\s+(add|commit|push)\b/iu,
  /\bgh\b/iu,
  /\bcurl\b/iu,
  /\bwget\b/iu,
  /\bssh\b/iu,
  /\bscp\b/iu,
  /\bpowershell\b/iu,
  /\bcmd\b/iu,
  /(^|[^>])>{1,2}($|[^>])/u,
  /\|/u,
  /&&/u,
  /;/u,
  /(^|[\\/])\.\.($|[\\/])/u,
  /\.\./u,
  /(^|[\\/\s])\.env($|[\\/\s])/iu,
  /\bweb-prueba\b/iu,
  /\bnode_modules\b/iu,
]

const FORBIDDEN_PATH_SEGMENTS = new Set([
  'web-prueba',
  '.git',
  'node_modules',
])

const DEFAULT_FORBIDDEN_ACTIONS = [
  'No ejecutar comandos fuera de la allowlist.',
  'No instalar dependencias.',
  'No modificar codigo ni archivos versionados.',
  'No tocar web-prueba.',
  'No tocar .env.',
  'No tocar node_modules.',
  'No usar Docker.',
  'No hacer deploy.',
  'No usar servicios externos.',
  'No hacer commit.',
  'No hacer push.',
  'No usar git add .',
]

const PRESETS = {
  'delivery-basic': [
    'node scripts/generated-domain-delivery-review-loop-smoke.mjs',
    'node scripts/generated-domain-delivery-review-evidence-smoke.mjs',
    'node scripts/generated-domain-delivery-codex-task-smoke.mjs',
    'node scripts/generated-domain-delivery-roundtrip-smoke.mjs',
  ],
  'delivery-full': [
    'node scripts/generated-domain-delivery-review-loop-smoke.mjs',
    'node scripts/generated-domain-delivery-review-evidence-smoke.mjs',
    'node scripts/generated-domain-delivery-codex-task-smoke.mjs',
    'node scripts/generated-domain-delivery-roundtrip-smoke.mjs',
    'node scripts/generated-domain-delivery-roundtrip-runner-smoke.mjs',
    'node scripts/generated-domain-delivery-correction-selector-smoke.mjs',
    'node scripts/generated-domain-delivery-history-ledger-smoke.mjs',
    'node scripts/generated-domain-delivery-supervised-workflow-smoke.mjs',
    'node scripts/generated-domain-delivery-worker-handoff-smoke.mjs',
  ],
  'registry-basic': [
    'node scripts/orchestrator-tool-worker-registry-smoke.mjs',
    'node scripts/generated-domain-delivery-worker-handoff-smoke.mjs',
  ],
  'quality-ci': ['npm run quality:ci'],
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))]
}

function nowIso() {
  return new Date().toISOString()
}

function previewText(value) {
  const text = String(value || '')
  return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}\n...[truncated]` : text
}

function isSubpath(candidate, parent) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function pathSegments(filePath) {
  return path
    .resolve(filePath)
    .split(path.sep)
    .map((segment) => segment.toLowerCase())
    .filter(Boolean)
}

function resolveRepoPath(value) {
  return path.resolve(repoRoot, value || '')
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, path.resolve(filePath)).replaceAll('\\', '/')
}

function validateSafeOutputDir(outputDir) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  const resolved = resolveRepoPath(outputDir)
  const safeRoots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) => path.resolve(root))
  if (!safeRoots.some((root) => isSubpath(resolved, root))) {
    throw new Error(`Output inseguro: debe estar dentro de .codex-temp o temp seguro: ${resolved}`)
  }
  if (resolved === repoRoot) {
    throw new Error('Output inseguro: no puede ser la raiz del repo.')
  }
  for (const segment of pathSegments(resolved)) {
    if (FORBIDDEN_PATH_SEGMENTS.has(segment) || segment === 'src' || segment === 'electron' || segment === 'scripts') {
      throw new Error(`Output inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`Output inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }
  return resolved
}

function tokenizeCommand(command) {
  const text = String(command || '').trim()
  const tokens = []
  let current = ''
  let quote = ''
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quote) {
      if (char === quote) {
        quote = ''
      } else {
        current += char
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (/\s/u.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }
    current += char
  }
  if (quote) {
    throw new Error('comillas sin cerrar')
  }
  if (current) {
    tokens.push(current)
  }
  return tokens
}

function normalizeExecutableName(value) {
  return String(value || '').toLowerCase().replace(/\.cmd$/iu, '')
}

function normalizeSmokeCommand(command) {
  const raw = String(command || '').trim()
  const argv = tokenizeCommand(raw)
  return {
    raw,
    argv,
    executable: normalizeExecutableName(argv[0]),
    args: argv.slice(1),
    normalized: argv.join(' '),
  }
}

function containsForbiddenCommandText(command) {
  const text = String(command || '')
  return FORBIDDEN_COMMAND_PATTERNS.find((pattern) => pattern.test(text)) || null
}

function isVersionedRepoPath(repoRelativePath) {
  const result = spawnSync('git', ['ls-files', '--error-unmatch', repoRelativePath], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  })
  return result.status === 0
}

function validateNodeCheck(normalized) {
  if (normalized.args.length !== 2 || normalized.args[0] !== '--check') {
    return { allowed: false, reason: 'node --check solo acepta un archivo.' }
  }
  const target = normalized.args[1]
  const resolved = resolveRepoPath(target)
  const repoRelative = toRepoRelative(resolved)
  if (!isSubpath(resolved, repoRoot)) {
    return { allowed: false, reason: 'node --check fuera del repo.' }
  }
  if (repoRelative.startsWith('.codex-temp/') || repoRelative.includes('/.codex-temp/')) {
    return { allowed: false, reason: 'node --check no permite .codex-temp.' }
  }
  if (repoRelative.includes('..') || repoRelative.includes('.env') || repoRelative.includes('web-prueba') || repoRelative.includes('node_modules')) {
    return { allowed: false, reason: 'node --check apunta a ruta prohibida.' }
  }
  if (!fs.existsSync(resolved)) {
    return { allowed: false, reason: 'archivo de node --check no existe.' }
  }
  if (!isVersionedRepoPath(repoRelative)) {
    return { allowed: false, reason: 'node --check solo permite archivos versionados.' }
  }
  return { allowed: true, executable: 'node', args: ['--check', repoRelative] }
}

function isAllowedScriptPath(scriptPath) {
  const normalized = String(scriptPath || '').replaceAll('\\', '/')
  if (!normalized.startsWith('scripts/') || !normalized.endsWith('.mjs')) {
    return false
  }
  const basename = path.posix.basename(normalized)
  return (
    basename.endsWith('-smoke.mjs') ||
    basename === 'ai-planner-smoke.mjs' ||
    basename === 'ai-release-smoke.mjs' ||
    basename === 'ai-operator-e2e-smoke.mjs' ||
    /^generated-domain-.*\.mjs$/u.test(basename) ||
    /^orchestrator-.*-smoke\.mjs$/u.test(basename)
  )
}

function validateNodeScript(normalized) {
  if (normalized.args.length !== 1) {
    return { allowed: false, reason: 'node scripts solo permite ejecutar el script sin argumentos.' }
  }
  const scriptPath = normalized.args[0].replaceAll('\\', '/')
  const resolved = resolveRepoPath(scriptPath)
  const repoRelative = toRepoRelative(resolved)
  if (!isSubpath(resolved, repoRoot)) {
    return { allowed: false, reason: 'script fuera del repo.' }
  }
  if (!isAllowedScriptPath(repoRelative)) {
    return { allowed: false, reason: 'script no permitido por allowlist.' }
  }
  if (!fs.existsSync(resolved)) {
    return { allowed: false, reason: 'script no existe.' }
  }
  if (!isVersionedRepoPath(repoRelative)) {
    return { allowed: false, reason: 'script no versionado.' }
  }
  return { allowed: true, executable: 'node', args: [repoRelative] }
}

function validateNpmQuality(normalized) {
  if (normalized.args.length === 2 && normalized.args[0] === 'run' && normalized.args[1] === 'quality:ci') {
    return {
      allowed: true,
      executable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['run', 'quality:ci'],
    }
  }
  return { allowed: false, reason: 'npm solo permite npm run quality:ci.' }
}

function getDefaultSmokeWorkerCommandAllowlist() {
  return {
    presets: { ...PRESETS },
    allowedForms: [
      'node --check <archivo versionado permitido>',
      'node scripts/*-smoke.mjs',
      'node scripts/ai-planner-smoke.mjs',
      'node scripts/ai-release-smoke.mjs',
      'node scripts/ai-operator-e2e-smoke.mjs',
      'node scripts/generated-domain-*.mjs',
      'node scripts/orchestrator-*-smoke.mjs',
      'npm run quality:ci',
    ],
    forbiddenPatterns: FORBIDDEN_COMMAND_PATTERNS.map((pattern) => pattern.source),
  }
}

function validateSmokeCommand(command, options = {}) {
  let normalized
  try {
    normalized = normalizeSmokeCommand(command)
  } catch (error) {
    return { command, status: 'blocked', allowed: false, reason: `comando invalido: ${error.message}` }
  }
  if (!normalized.raw) {
    return { command, status: 'blocked', allowed: false, reason: 'comando vacio' }
  }
  const forbiddenPattern = containsForbiddenCommandText(normalized.raw)
  if (forbiddenPattern) {
    return {
      command: normalized.raw,
      normalized,
      status: 'blocked',
      allowed: false,
      reason: `patron prohibido: ${forbiddenPattern.source}`,
    }
  }
  let validation
  if (normalized.executable === 'node') {
    validation = normalized.args[0] === '--check' ? validateNodeCheck(normalized) : validateNodeScript(normalized)
  } else if (normalized.executable === 'npm') {
    validation = validateNpmQuality(normalized)
  } else {
    validation = { allowed: false, reason: `ejecutable no permitido: ${normalized.argv[0] || '(vacio)'}` }
  }
  return {
    command: normalized.raw,
    normalized,
    status: validation.allowed ? 'allowed' : 'blocked',
    allowed: validation.allowed,
    reason: validation.reason || '',
    executable: validation.executable,
    args: validation.args || [],
    cwd: options.cwd || repoRoot,
  }
}

function commandsFromPreset(preset) {
  if (!preset) {
    return []
  }
  if (!PRESETS[preset]) {
    throw new Error(`Preset no soportado: ${preset}`)
  }
  return [...PRESETS[preset]]
}

function buildLocalSmokeWorkerTask(input = {}, options = {}) {
  const presetCommands = commandsFromPreset(input.preset)
  const commands = unique([...(input.commands || []), ...presetCommands])
  return {
    taskTitle: input.taskTitle || `Validaciones locales supervisadas${input.preset ? ` (${input.preset})` : ''}`,
    title: input.taskTitle || `Validaciones locales supervisadas${input.preset ? ` (${input.preset})` : ''}`,
    goal: 'Ejecutar solamente comandos de validacion allowlisted en modo supervisado.',
    capability: input.capability || (input.preset === 'quality-ci' ? 'quality.run' : 'tests.run'),
    commands,
    cwd: path.resolve(input.cwd || options.cwd || repoRoot),
    outputDir: input.outputDir || options.outputDir || '',
    dryRun: input.dryRun !== false,
    failFast: input.failFast === true,
    maxCommandCount: Number(input.maxCommandCount || options.maxCommandCount || DEFAULT_MAX_COMMAND_COUNT),
    timeoutMs: Number(input.timeoutMs || options.timeoutMs || DEFAULT_TIMEOUT_MS),
    sourceHandoffPath: input.sourceHandoffPath || '',
    metadata: {
      ...(input.metadata || {}),
      preset: input.preset || '',
      generatedAt: nowIso(),
    },
  }
}

function buildLocalSmokeWorkerEnvelope(task, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const worker =
    findToolWorkersForCapability(registry, task.capability || 'tests.run', {
      status: 'available',
      executionMode: 'supervised',
    }).find((candidate) => candidate.id === DEFAULT_WORKER_ID) ||
    findToolWorkersForCapability(registry, task.capability || 'tests.run').find(
      (candidate) => candidate.id === DEFAULT_WORKER_ID,
    )
  if (!worker) {
    return {
      workerId: DEFAULT_WORKER_ID,
      workerDisplayName: 'Local Smoke Runner',
      taskStatus: 'blocked',
      dryRun: task.dryRun !== false,
      commands: [],
      summary: 'No se encontro worker local-smoke-runner para la capability solicitada.',
      validationPassed: false,
      forbiddenActions: DEFAULT_FORBIDDEN_ACTIONS,
      artifacts: [],
      metadata: { generatedAt: nowIso(), reason: 'no_matching_worker' },
    }
  }

  const commandResults = (task.commands || []).slice(0, task.maxCommandCount).map((command) =>
    validateSmokeCommand(command, { cwd: task.cwd }),
  )
  if ((task.commands || []).length > task.maxCommandCount) {
    commandResults.push({
      command: '',
      status: 'blocked',
      allowed: false,
      reason: `demasiados comandos: maximo ${task.maxCommandCount}`,
    })
  }

  const registryTask = {
    title: task.taskTitle || task.title,
    goal: 'Ejecutar validaciones locales allowlisted sin modificar codigo.',
    capability: task.capability || 'tests.run',
    targetPaths: [],
    inputArtifacts: unique([task.sourceHandoffPath].filter(Boolean)),
    outputArtifacts: ['local-smoke-worker-report.json', 'local-smoke-worker-summary.md', 'commands/*.log'],
    constraints: ['read-only repository checks', '.codex-temp reports'],
    forbiddenActions: [],
    approvalMode: 'preapproved',
    dryRun: task.dryRun !== false,
  }
  const validation = validateWorkerTask(worker, registryTask)
  const workerEnvelope = buildWorkerTaskEnvelope(worker, registryTask, { registry })
  const blocked = validation.blocked || commandResults.some((command) => !command.allowed)
  const taskStatus = blocked ? 'blocked' : task.dryRun !== false ? 'dry_run' : 'ready'

  return {
    workerId: worker.id,
    workerDisplayName: worker.displayName,
    taskStatus,
    dryRun: task.dryRun !== false,
    commands: commandResults.map((command) => ({
      command: command.command,
      status: command.allowed ? (task.dryRun !== false ? 'skipped' : 'allowed') : 'blocked',
      exitCode: null,
      durationMs: 0,
      reason: command.reason || '',
      stdoutPreview: '',
      stderrPreview: '',
      logPath: '',
      executable: command.executable || '',
      args: command.args || [],
    })),
    summary: blocked
      ? 'Hay comandos bloqueados o la task no cumple el registry.'
      : task.dryRun !== false
        ? 'Dry-run: todos los comandos fueron validados, no ejecutados.'
        : 'Comandos listos para ejecucion supervisada.',
    validationPassed: !blocked,
    forbiddenActions: unique([...DEFAULT_FORBIDDEN_ACTIONS, ...(worker.forbiddenActions || [])]),
    artifacts: [],
    workerEnvelope,
    metadata: {
      generatedAt: nowIso(),
      capability: task.capability || 'tests.run',
      registryValidation: validation,
      timeoutMs: task.timeoutMs,
      maxCommandCount: task.maxCommandCount,
      sourceHandoffPath: task.sourceHandoffPath || '',
    },
  }
}

function runLocalSmokeWorkerTask(task, options = {}) {
  const outputDir = validateSafeOutputDir(task.outputDir || options.outputDir)
  const envelope = buildLocalSmokeWorkerEnvelope(task, options)
  const result = {
    ...envelope,
    taskStatus: envelope.taskStatus,
    artifacts: [],
    metadata: {
      ...(envelope.metadata || {}),
      startedAt: nowIso(),
      outputDir,
    },
  }

  if (envelope.taskStatus === 'blocked') {
    result.metadata.finishedAt = nowIso()
    return result
  }
  if (task.dryRun !== false) {
    result.taskStatus = 'dry_run'
    result.metadata.finishedAt = nowIso()
    return result
  }

  const commandsDir = path.join(outputDir, 'commands')
  fs.mkdirSync(commandsDir, { recursive: true })
  let failed = false
  result.commands = envelope.commands.map((commandResult, index) => {
    if (failed && task.failFast) {
      return { ...commandResult, status: 'skipped', reason: 'fail-fast activo' }
    }
    const started = Date.now()
    const spawned = spawnSync(commandResult.executable, commandResult.args, {
      cwd: task.cwd || repoRoot,
      encoding: 'utf8',
      shell: false,
      timeout: task.timeoutMs || DEFAULT_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 12,
    })
    const durationMs = Date.now() - started
    const stdout = spawned.stdout || ''
    const stderr = spawned.stderr || spawned.error?.message || ''
    const stdoutPath = path.join(commandsDir, `${String(index + 1).padStart(2, '0')}-stdout.log`)
    const stderrPath = path.join(commandsDir, `${String(index + 1).padStart(2, '0')}-stderr.log`)
    fs.writeFileSync(stdoutPath, stdout, 'utf8')
    fs.writeFileSync(stderrPath, stderr, 'utf8')
    const exitCode = typeof spawned.status === 'number' ? spawned.status : 1
    const status = exitCode === 0 ? 'passed' : 'failed'
    if (status === 'failed') {
      failed = true
    }
    return {
      ...commandResult,
      status,
      exitCode,
      durationMs,
      stdoutPreview: previewText(stdout),
      stderrPreview: previewText(stderr),
      logPath: stdoutPath,
      stdoutLogPath: stdoutPath,
      stderrLogPath: stderrPath,
      reason: status === 'failed' && spawned.error ? spawned.error.message : commandResult.reason,
    }
  })
  result.validationPassed = result.commands.every((command) => command.status === 'passed')
  result.taskStatus = result.validationPassed ? 'completed' : 'failed'
  result.summary = summarizeLocalSmokeWorkerResult(result)
  result.metadata.finishedAt = nowIso()
  return result
}

function summarizeLocalSmokeWorkerResult(result = {}) {
  const commands = result.commands || []
  const passed = commands.filter((command) => command.status === 'passed').length
  const failed = commands.filter((command) => command.status === 'failed').length
  const blocked = commands.filter((command) => command.status === 'blocked').length
  const skipped = commands.filter((command) => command.status === 'skipped').length
  if (result.taskStatus === 'dry_run') {
    return `Dry-run completado: ${commands.length} comando(s) allowlisted, 0 ejecutados.`
  }
  if (result.taskStatus === 'blocked') {
    return `Task bloqueada: ${blocked} comando(s) bloqueados.`
  }
  return `Validacion local: ${passed} passed, ${failed} failed, ${blocked} blocked, ${skipped} skipped.`
}

function writeLocalSmokeWorkerReport(outputDir, result) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const commandsDir = path.join(resolvedOutputDir, 'commands')
  fs.mkdirSync(commandsDir, { recursive: true })

  const withArtifacts = {
    ...result,
    summary: result.summary || summarizeLocalSmokeWorkerResult(result),
    artifacts: [],
  }

  for (const [index, command] of (withArtifacts.commands || []).entries()) {
    if (!command.stdoutLogPath) {
      const stdoutPath = path.join(commandsDir, `${String(index + 1).padStart(2, '0')}-stdout.log`)
      fs.writeFileSync(stdoutPath, command.stdoutPreview || '', 'utf8')
      command.stdoutLogPath = stdoutPath
      command.logPath = command.logPath || stdoutPath
    }
    if (!command.stderrLogPath) {
      const stderrPath = path.join(commandsDir, `${String(index + 1).padStart(2, '0')}-stderr.log`)
      fs.writeFileSync(stderrPath, command.stderrPreview || '', 'utf8')
      command.stderrLogPath = stderrPath
    }
  }

  const reportPath = path.join(resolvedOutputDir, 'local-smoke-worker-report.json')
  const summaryPath = path.join(resolvedOutputDir, 'local-smoke-worker-summary.md')
  fs.writeFileSync(reportPath, `${JSON.stringify(withArtifacts, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# Local Smoke Worker Summary',
      '',
      `Status: ${withArtifacts.taskStatus}`,
      `Validation passed: ${withArtifacts.validationPassed ? 'yes' : 'no'}`,
      '',
      withArtifacts.summary || summarizeLocalSmokeWorkerResult(withArtifacts),
      '',
      '## Commands',
      ...((withArtifacts.commands || []).map(
        (command, index) => `- ${index + 1}. ${command.status}: ${command.command}${command.reason ? ` (${command.reason})` : ''}`,
      )),
      '',
    ].join('\n'),
    'utf8',
  )
  withArtifacts.artifacts = unique([
    reportPath,
    summaryPath,
    ...withArtifacts.commands.flatMap((command) => [command.stdoutLogPath, command.stderrLogPath].filter(Boolean)),
  ])
  fs.writeFileSync(reportPath, `${JSON.stringify(withArtifacts, null, 2)}\n`, 'utf8')
  return {
    reportPath,
    summaryPath,
    outputDir: resolvedOutputDir,
    result: withArtifacts,
  }
}

module.exports = {
  getDefaultSmokeWorkerCommandAllowlist,
  normalizeSmokeCommand,
  validateSmokeCommand,
  buildLocalSmokeWorkerTask,
  buildLocalSmokeWorkerEnvelope,
  runLocalSmokeWorkerTask,
  writeLocalSmokeWorkerReport,
  summarizeLocalSmokeWorkerResult,
  validateSafeOutputDir,
  commandsFromPreset,
}
