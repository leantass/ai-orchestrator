const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { resolveRunPaths: resolveDryRunPaths } = require('./jefe-run-persistence.cjs')

const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/
const GENERATION_RELATIVE_ROOT = path.join('.codex-temp', 'jefe-real-generation', 'runs')
const GENERATOR_SCRIPT_RELATIVE_PATH = path.join('scripts', 'generated-domain-real-project-from-brief.mjs')
const MAX_LOG_LENGTH = 6000
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F]/
const SECRET_ENV_PATTERNS = [
  /KEY/iu,
  /TOKEN/iu,
  /SECRET/iu,
  /PASSWORD/iu,
  /CREDENTIAL/iu,
  /AUTH/iu,
]

const GENERATION_STEPS = [
  'Preparando brief',
  'Ejecutando generador',
  'Creando proyecto',
  'Validando estructura',
  'Corriendo smoke basico',
  'Preparando entrega',
]

function getRepoRoot(options = {}) {
  return path.resolve(options.repoRoot || path.join(__dirname, '..'))
}

function validateRunId(runId) {
  const normalizedRunId = typeof runId === 'string' ? runId.trim() : ''

  if (!RUN_ID_PATTERN.test(normalizedRunId)) {
    throw new Error('runId invalido. Solo se permiten letras, numeros, guion y guion bajo.')
  }

  return normalizedRunId
}

function toRelativeRepoPath(absolutePath, options = {}) {
  return path.relative(getRepoRoot(options), absolutePath).replace(/\\/g, '/')
}

function ensureInsidePath(targetPath, rootPath, label = 'path') {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(rootPath)

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`${label} fuera del root permitido.`)
  }

  return resolvedTarget
}

function getGenerationRoot(options = {}) {
  const repoRoot = getRepoRoot(options)
  const codexTempRoot = path.resolve(repoRoot, '.codex-temp')
  const generationRoot = path.resolve(repoRoot, GENERATION_RELATIVE_ROOT)

  ensureInsidePath(generationRoot, codexTempRoot, 'generation root')

  return generationRoot
}

function resolveGenerationPaths(runId, options = {}) {
  const safeRunId = validateRunId(runId)
  const repoRoot = getRepoRoot(options)
  const generationRoot = getGenerationRoot(options)
  const runPath = ensureInsidePath(path.join(generationRoot, safeRunId), generationRoot, 'generation run')
  const outputPath = ensureInsidePath(path.join(runPath, 'output'), runPath, 'generation output')
  const logsPath = path.join(runPath, 'logs')
  const reportsPath = path.join(runPath, 'reports')

  return {
    runId: safeRunId,
    repoRoot,
    generationRoot,
    runPath,
    outputPath,
    logsPath,
    reportsPath,
    statusPath: path.join(runPath, 'status.json'),
    summaryPath: path.join(reportsPath, 'GENERATION_SUMMARY.md'),
    generationLogPath: path.join(logsPath, 'generation.log'),
    seedLogPath: path.join(logsPath, 'seed.log'),
    buildLogPath: path.join(logsPath, 'build.log'),
    smokeLogPath: path.join(logsPath, 'smoke.log'),
    domainSmokeLogPath: path.join(logsPath, 'domain-smoke.log'),
    generatorScriptPath: path.join(repoRoot, GENERATOR_SCRIPT_RELATIVE_PATH),
  }
}

function sanitizeText(value, maxLength = MAX_LOG_LENGTH) {
  const text = typeof value === 'string' ? value : String(value || '')
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(CONTROL_CHARS_PATTERN, '')
    .trim()

  return normalized.slice(0, maxLength)
}

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error || '')

  if (/runId/iu.test(message)) return message
  if (/brief/iu.test(message)) return 'No pude leer el brief guardado para este run.'
  if (/fuera|path|traversal|root/iu.test(message)) return 'La ruta de generacion no es segura.'
  if (/soportado|mapper minimo/iu.test(message)) return 'El brief no esta soportado por el generador real controlado actual.'

  return 'No se pudo ejecutar la generacion real controlada.'
}

function buildFailure(error) {
  return {
    ok: false,
    error: sanitizeError(error),
  }
}

async function ensureGenerationDirectories(paths) {
  await fs.promises.mkdir(paths.logsPath, { recursive: true })
  await fs.promises.mkdir(paths.reportsPath, { recursive: true })
}

async function writeJsonFile(filePath, value) {
  await fs.promises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function buildSteps(currentStep, failed = false) {
  const currentIndex = Math.max(0, GENERATION_STEPS.indexOf(currentStep))

  return GENERATION_STEPS.map((label, index) => {
    if (failed && index === currentIndex) return { label, status: 'error' }
    if (index < currentIndex) return { label, status: 'completed' }
    if (index === currentIndex) return { label, status: 'in-progress' }
    return { label, status: 'pending' }
  })
}

function buildCompletedSteps() {
  return GENERATION_STEPS.map((label) => ({ label, status: 'completed' }))
}

function buildSafeEnv(baseEnv = process.env) {
  const safeEnv = {}

  for (const [key, value] of Object.entries(baseEnv)) {
    if (SECRET_ENV_PATTERNS.some((pattern) => pattern.test(key))) continue
    safeEnv[key] = value
  }

  safeEnv.AISO_PROVIDER = 'disabled'
  safeEnv.SCARLETT_PROVIDER = 'disabled'
  safeEnv.NODE_ENV = safeEnv.NODE_ENV || 'test'

  return safeEnv
}

function commandToText(command, args) {
  return [command, ...args].join(' ')
}

function resolveSpawnCommand(command, args) {
  if (process.platform === 'win32' && command.endsWith('.cmd')) {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', command, ...args],
      displayCommand: commandToText(command, args),
    }
  }

  return {
    command,
    args,
    displayCommand: commandToText(command, args),
  }
}

function runSpawnCommand({ command, args, cwd, logPath, env, timeoutMs = 180000 }) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString()
    let stdout = ''
    let stderr = ''
    let settled = false
    const resolvedCommand = resolveSpawnCommand(command, args)
    const child = spawn(resolvedCommand.command, resolvedCommand.args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const timeoutId = setTimeout(() => {
      if (settled) return
      child.kill()
      settled = true
      resolve({
        command: resolvedCommand.displayCommand,
        status: 124,
        stdout,
        stderr: `${stderr}\nTimeout despues de ${timeoutMs}ms`,
        startedAt,
        finishedAt: new Date().toISOString(),
      })
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => {
      if (settled) return
      clearTimeout(timeoutId)
      settled = true
      resolve({
        command: resolvedCommand.displayCommand,
        status: 1,
        stdout,
        stderr: error instanceof Error ? error.message : String(error),
        startedAt,
        finishedAt: new Date().toISOString(),
      })
    })
    child.on('close', (status) => {
      if (settled) return
      clearTimeout(timeoutId)
      settled = true
      resolve({
        command: resolvedCommand.displayCommand,
        status: status ?? 1,
        stdout,
        stderr,
        startedAt,
        finishedAt: new Date().toISOString(),
      })
    })
  }).then(async (result) => {
    const log = [
      `$ ${result.command}`,
      `cwd=${toRelativeRepoPath(cwd, { repoRoot: cwd === getRepoRoot({ repoRoot: cwd }) ? cwd : undefined })}`,
      `exit=${result.status}`,
      sanitizeText(result.stdout, 20000),
      sanitizeText(result.stderr, 20000),
    ].filter(Boolean).join('\n')

    await fs.promises.writeFile(logPath, `${log}\n`, 'utf8')

    return result
  })
}

function readPackageScripts(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    return packageJson && typeof packageJson.scripts === 'object' && packageJson.scripts
      ? packageJson.scripts
      : {}
  } catch {
    return {}
  }
}

async function writeStatus(paths, status) {
  await writeJsonFile(paths.statusPath, {
    ...status,
    updatedAt: new Date().toISOString(),
  })
}

function buildSummaryMarkdown({ paths, status, commands }) {
  const validations = Array.isArray(status.validation) ? status.validation : []
  const errors = Array.isArray(status.errors) ? status.errors : []
  const warnings = Array.isArray(status.warnings) ? status.warnings : []

  return [
    '# GENERATION SUMMARY',
    '',
    `Run: ${paths.runId}`,
    `Estado: ${status.status}`,
    `Tipo: real generation controlada`,
    `Output: ${toRelativeRepoPath(paths.outputPath, { repoRoot: paths.repoRoot })}`,
    '',
    '## Comandos permitidos',
    '',
    ...commands.map((entry) => `- \`${entry.command}\`: ${entry.status === 0 ? 'PASS' : entry.status === 'skipped' ? 'SKIPPED' : 'FAILED'}`),
    '',
    '## Validaciones',
    '',
    ...(validations.length > 0
      ? validations.map((entry) => `- ${entry.name}: ${entry.status}`)
      : ['- Sin validaciones ejecutadas.']),
    '',
    '## Warnings',
    '',
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ['- Sin warnings.']),
    '',
    '## Errores',
    '',
    ...(errors.length > 0 ? errors.map((error) => `- ${error}`) : ['- Sin errores.']),
    '',
    '## Alcance',
    '',
    'No se ejecuto Codex real, no se llamaron servicios externos, no se leyo `.env`, no se tocaron proyectos externos y no hubo deploy.',
    '',
  ].join('\n')
}

async function readGenerationStatus(runId, options = {}) {
  try {
    const paths = resolveGenerationPaths(runId, options)
    const status = JSON.parse(await fs.promises.readFile(paths.statusPath, 'utf8'))

    return {
      ok: true,
      runId: paths.runId,
      status,
      path: toRelativeRepoPath(paths.runPath, options),
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      logs: await readLogs(paths),
    }
  } catch (error) {
    return buildFailure(error)
  }
}

async function readLogs(paths) {
  const logs = {}
  for (const [key, filePath] of Object.entries({
    generation: paths.generationLogPath,
    seed: paths.seedLogPath,
    build: paths.buildLogPath,
    smoke: paths.smokeLogPath,
    domainSmoke: paths.domainSmokeLogPath,
  })) {
    try {
      logs[key] = sanitizeText(await fs.promises.readFile(filePath, 'utf8'))
    } catch {
      logs[key] = ''
    }
  }
  return logs
}

async function readGenerationResult(runId, options = {}) {
  try {
    const paths = resolveGenerationPaths(runId, options)
    const status = JSON.parse(await fs.promises.readFile(paths.statusPath, 'utf8'))
    const summary = await fs.promises.readFile(paths.summaryPath, 'utf8')
    const logs = await readLogs(paths)

    return {
      ok: true,
      runId: paths.runId,
      status,
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      path: toRelativeRepoPath(paths.runPath, options),
      summary: sanitizeText(summary, 12000),
      logs,
      artifacts: {
        status: toRelativeRepoPath(paths.statusPath, options),
        summary: toRelativeRepoPath(paths.summaryPath, options),
        generationLog: toRelativeRepoPath(paths.generationLogPath, options),
        output: toRelativeRepoPath(paths.outputPath, options),
      },
    }
  } catch (error) {
    return buildFailure(error)
  }
}

async function runValidationIfAvailable({ name, scriptName, command, args, cwd, logPath, env, commands }) {
  if (scriptName) {
    const scripts = readPackageScripts(path.join(cwd, 'package.json'))
    if (!scripts[scriptName]) {
      const skipped = { name, status: 'skipped', reason: `script ${scriptName} no disponible` }
      commands.push({ command: `npm run ${scriptName}`, status: 'skipped' })
      await fs.promises.writeFile(logPath, `${skipped.reason}\n`, 'utf8')
      return skipped
    }
  }

  const result = await runSpawnCommand({ command, args, cwd, logPath, env, timeoutMs: 180000 })
  commands.push({ command: result.command, status: result.status })

  return {
    name,
    status: result.status === 0 ? 'PASS' : 'FAILED',
    exitCode: result.status,
  }
}

async function startGenerationFromRun(runId, options = {}) {
  let paths
  const commands = []

  try {
    paths = resolveGenerationPaths(runId, options)
    const dryRunPaths = resolveDryRunPaths(paths.runId, options)
    const safeEnv = buildSafeEnv(options.env || process.env)

    ensureInsidePath(dryRunPaths.briefPath, dryRunPaths.runPath, 'brief path')
    await ensureGenerationDirectories(paths)

    const now = new Date().toISOString()
    await writeStatus(paths, {
      runId: paths.runId,
      status: 'running',
      currentStep: GENERATION_STEPS[0],
      steps: buildSteps(GENERATION_STEPS[0]),
      startedAt: now,
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      validation: [],
      warnings: ['Generacion real controlada: no se ejecuta Codex real ni servicios externos.'],
      errors: [],
    })

    if (!fs.existsSync(dryRunPaths.briefPath)) {
      throw new Error('brief persistido no encontrado.')
    }
    if (!fs.existsSync(paths.generatorScriptPath)) {
      throw new Error('entrypoint oficial no encontrado.')
    }

    await writeStatus(paths, {
      runId: paths.runId,
      status: 'running',
      currentStep: GENERATION_STEPS[1],
      steps: buildSteps(GENERATION_STEPS[1]),
      startedAt: now,
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      validation: [],
      warnings: ['Generacion real controlada: no se ejecuta Codex real ni servicios externos.'],
      errors: [],
    })

    const generatorArgs = [
      GENERATOR_SCRIPT_RELATIVE_PATH.replace(/\\/g, '/'),
      '--brief',
      toRelativeRepoPath(dryRunPaths.briefPath, options),
      '--output',
      toRelativeRepoPath(paths.outputPath, options),
      '--mode',
      'real-project',
      '--reports-dir',
      toRelativeRepoPath(paths.reportsPath, options),
      '--logs-dir',
      toRelativeRepoPath(paths.logsPath, options),
    ]
    const generation = await runSpawnCommand({
      command: process.execPath,
      args: generatorArgs,
      cwd: paths.repoRoot,
      logPath: paths.generationLogPath,
      env: safeEnv,
      timeoutMs: 180000,
    })
    commands.push({ command: generation.command, status: generation.status })

    if (generation.status !== 0) {
      throw new Error(sanitizeText(generation.stderr || generation.stdout || 'Generacion fallida.'))
    }

    await writeStatus(paths, {
      runId: paths.runId,
      status: 'running',
      currentStep: GENERATION_STEPS[3],
      steps: buildSteps(GENERATION_STEPS[3]),
      startedAt: now,
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      validation: [{ name: 'structure', status: fs.existsSync(path.join(paths.outputPath, 'package.json')) ? 'PASS' : 'FAILED' }],
      warnings: ['Generacion real controlada: no se ejecuta Codex real ni servicios externos.'],
      errors: [],
    })

    const validations = []
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    validations.push(await runValidationIfAvailable({
      name: 'seed',
      scriptName: 'seed',
      command: npmCommand,
      args: ['run', 'seed'],
      cwd: paths.outputPath,
      logPath: paths.seedLogPath,
      env: safeEnv,
      commands,
    }))
    validations.push(await runValidationIfAvailable({
      name: 'build',
      scriptName: 'build',
      command: npmCommand,
      args: ['run', 'build'],
      cwd: paths.outputPath,
      logPath: paths.buildLogPath,
      env: safeEnv,
      commands,
    }))
    validations.push(await runValidationIfAvailable({
      name: 'smoke',
      scriptName: 'smoke',
      command: npmCommand,
      args: ['run', 'smoke'],
      cwd: paths.outputPath,
      logPath: paths.smokeLogPath,
      env: safeEnv,
      commands,
    }))

    const domainSmokePath = path.join(paths.outputPath, 'scripts', 'domain-smoke.mjs')
    if (fs.existsSync(domainSmokePath)) {
      validations.push(await runValidationIfAvailable({
        name: 'domain-smoke',
        command: process.execPath,
        args: ['scripts/domain-smoke.mjs'],
        cwd: paths.outputPath,
        logPath: paths.domainSmokeLogPath,
        env: safeEnv,
        commands,
      }))
    } else {
      validations.push({ name: 'domain-smoke', status: 'skipped', reason: 'script no disponible' })
      commands.push({ command: 'node scripts/domain-smoke.mjs', status: 'skipped' })
      await fs.promises.writeFile(paths.domainSmokeLogPath, 'script no disponible\n', 'utf8')
    }

    const failedValidation = validations.find((entry) => entry.status === 'FAILED')
    const completedAt = new Date().toISOString()
    const finalStatus = {
      runId: paths.runId,
      status: failedValidation ? 'failed' : 'completed',
      currentStep: failedValidation ? GENERATION_STEPS[4] : GENERATION_STEPS[5],
      steps: failedValidation ? buildSteps(GENERATION_STEPS[4], true) : buildCompletedSteps(),
      startedAt: now,
      completedAt,
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      validation: validations,
      warnings: ['Generacion real controlada: no se ejecuto Codex real ni servicios externos.'],
      errors: failedValidation ? [`Fallo validacion: ${failedValidation.name}`] : [],
    }

    await writeStatus(paths, finalStatus)
    await fs.promises.writeFile(
      paths.summaryPath,
      buildSummaryMarkdown({ paths, status: finalStatus, commands }),
      'utf8',
    )

    return {
      ok: !failedValidation,
      runId: paths.runId,
      status: finalStatus,
      outputPath: toRelativeRepoPath(paths.outputPath, options),
      path: toRelativeRepoPath(paths.runPath, options),
      artifacts: {
        status: toRelativeRepoPath(paths.statusPath, options),
        summary: toRelativeRepoPath(paths.summaryPath, options),
        generationLog: toRelativeRepoPath(paths.generationLogPath, options),
        output: toRelativeRepoPath(paths.outputPath, options),
      },
      error: failedValidation ? `Fallo validacion: ${failedValidation.name}` : undefined,
    }
  } catch (error) {
    if (paths) {
      const failedStatus = {
        runId: paths.runId,
        status: 'failed',
        currentStep: GENERATION_STEPS[1],
        steps: buildSteps(GENERATION_STEPS[1], true),
        completedAt: new Date().toISOString(),
        outputPath: toRelativeRepoPath(paths.outputPath, options),
        validation: [],
        warnings: ['Generacion real controlada fallida sin tocar proyectos externos.'],
        errors: [sanitizeError(error)],
      }

      await ensureGenerationDirectories(paths)
      await writeStatus(paths, failedStatus)
      await fs.promises.writeFile(
        paths.summaryPath,
        buildSummaryMarkdown({ paths, status: failedStatus, commands }),
        'utf8',
      )
    }

    return buildFailure(error)
  }
}

module.exports = {
  GENERATION_RELATIVE_ROOT,
  GENERATION_STEPS,
  resolveGenerationPaths,
  startGenerationFromRun,
  getGenerationStatus: readGenerationStatus,
  readGenerationResult,
  sanitizeError,
}
