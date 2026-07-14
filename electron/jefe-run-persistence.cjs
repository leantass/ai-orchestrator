const fs = require('fs')
const path = require('path')

const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/
const MAX_BRIEF_LENGTH = 20000
const MAX_TEXT_LENGTH = 4000
const MAX_ITEMS = 24
const RUNS_RELATIVE_ROOT = path.join('.codex-temp', 'jefe-ui-real-flow', 'runs')
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F]/

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error || '')

  if (message.includes('runId')) return message
  if (message.includes('brief')) return message
  if (message.includes('path')) return 'La ruta del run no es segura.'

  return 'No se pudo persistir el run controlado.'
}

function buildFailure(error) {
  return {
    ok: false,
    error: sanitizeError(error),
  }
}

function normalizeText(value, fallback = '', maxLength = MAX_TEXT_LENGTH) {
  const text = typeof value === 'string' ? value : fallback
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()

  if (CONTROL_CHARS_PATTERN.test(normalizedText)) {
    throw new Error('El contenido contiene caracteres no permitidos.')
  }

  return normalizedText.slice(0, maxLength)
}

function normalizeList(value, maxItems = MAX_ITEMS) {
  if (!Array.isArray(value)) return []

  return value
    .slice(0, maxItems)
    .map((item) => normalizeText(item, '', 280))
    .filter(Boolean)
}

function mergeLists(left, right, maxItems = MAX_ITEMS) {
  return Array.from(new Set([...normalizeList(left), ...normalizeList(right)])).slice(0, maxItems)
}

function normalizeSteps(value) {
  if (!Array.isArray(value)) return []

  return value.slice(0, MAX_ITEMS).map((step, index) => {
    const label = normalizeText(step?.label, `Paso ${index + 1}`, 120)
    const status = normalizeText(step?.status, 'pending', 40) || 'pending'

    return {
      label,
      status,
    }
  })
}

function validateRunId(runId) {
  const normalizedRunId = normalizeText(runId, '', 90)

  if (!RUN_ID_PATTERN.test(normalizedRunId)) {
    throw new Error('runId invalido. Solo se permiten letras, numeros, guion y guion bajo.')
  }

  return normalizedRunId
}

function getRepoRoot(options = {}) {
  return path.resolve(options.repoRoot || path.join(__dirname, '..'))
}

function getRunsRoot(options = {}) {
  const runsRoot = path.resolve(getRepoRoot(options), RUNS_RELATIVE_ROOT)
  const codexTempRoot = path.resolve(getRepoRoot(options), '.codex-temp')

  if (!runsRoot.startsWith(codexTempRoot + path.sep)) {
    throw new Error('path root inseguro para runs.')
  }

  return runsRoot
}

function resolveRunPaths(runId, options = {}) {
  const safeRunId = validateRunId(runId)
  const runsRoot = getRunsRoot(options)
  const runPath = path.resolve(runsRoot, safeRunId)

  if (runPath !== runsRoot && !runPath.startsWith(runsRoot + path.sep)) {
    throw new Error('path traversal bloqueado.')
  }

  return {
    runId: safeRunId,
    runsRoot,
    runPath,
    logsPath: path.join(runPath, 'logs'),
    reportsPath: path.join(runPath, 'reports'),
    runJsonPath: path.join(runPath, 'run.json'),
    briefPath: path.join(runPath, 'brief.md'),
    statusPath: path.join(runPath, 'status.json'),
    eventsPath: path.join(runPath, 'logs', 'events.log'),
    summaryPath: path.join(runPath, 'reports', 'RUN_SUMMARY.md'),
  }
}

function toRelativeRepoPath(absolutePath, options = {}) {
  return path.relative(getRepoRoot(options), absolutePath).replace(/\\/g, '/')
}

async function ensureRunDirectories(paths) {
  await fs.promises.mkdir(paths.logsPath, { recursive: true })
  await fs.promises.mkdir(paths.reportsPath, { recursive: true })
}

async function writeJsonFile(filePath, value) {
  await fs.promises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function buildEventsLogLines({ event, runId, status, currentStep, warnings = [] }) {
  const timestamp = new Date().toISOString()
  const lines = [
    `[${timestamp}] ${event}`,
    `[${timestamp}] runId=${runId}`,
    `[${timestamp}] status=${status}`,
  ]

  if (currentStep) {
    lines.push(`[${timestamp}] currentStep=${currentStep}`)
  }

  for (const warning of warnings) {
    lines.push(`[${timestamp}] warning=${warning}`)
  }

  return `${lines.join('\n')}\n`
}

function buildBriefMarkdown({ brief, createdAt }) {
  return [
    '# JEFE commercial UI brief',
    '',
    `Fecha: ${createdAt}`,
    'Origen: JEFE commercial UI',
    'Tipo: dry-run funcional',
    '',
    'Aclaracion: este run no ejecuto generacion real ni servicios externos.',
    '',
    '## Pedido',
    '',
    brief,
    '',
  ].join('\n')
}

function buildRunSummaryMarkdown({ run, status }) {
  const steps = Array.isArray(status.steps) ? status.steps : []
  const warnings = Array.isArray(status.warnings) ? status.warnings : []

  return [
    '# RUN SUMMARY',
    '',
    `Run: ${run.runId}`,
    `Titulo: ${run.title}`,
    `Tipo: ${run.runType}`,
    `Estado: ${status.status}`,
    `Creado: ${run.createdAt}`,
    `Actualizado: ${run.updatedAt}`,
    '',
    '## Rutas',
    '',
    `- Run: ${run.paths.run}`,
    `- Brief: ${run.paths.brief}`,
    `- Status: ${run.paths.status}`,
    `- Logs: ${run.paths.eventsLog}`,
    '',
    '## Pasos',
    '',
    ...(steps.length > 0
      ? steps.map((step) => `- ${step.label}: ${step.status}`)
      : ['- Sin pasos registrados.']),
    '',
    '## Warnings',
    '',
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ['- Sin warnings.']),
    '',
    '## Alcance',
    '',
    'No se ejecuto generacion pesada, Codex real, scripts de generacion, AISO real ni Scarlett real.',
    '',
  ].join('\n')
}

function buildRunRecord(payload, paths, options = {}) {
  const now = new Date().toISOString()
  const createdAt = normalizeText(payload?.createdAt, now, 80) || now
  const brief = normalizeText(payload?.brief, '', MAX_BRIEF_LENGTH)

  if (!brief) {
    throw new Error('brief requerido para persistir el run.')
  }

  const title = normalizeText(payload?.title, 'Nuevo sistema', 180) || 'Nuevo sistema'
  const steps = normalizeSteps(payload?.steps)
  const warnings = normalizeList(payload?.warnings)
  const expectedArtifacts = normalizeList(payload?.expectedArtifacts)
  const status = normalizeText(payload?.status, 'running', 40) || 'running'
  const currentStep = normalizeText(payload?.currentStep, steps[0]?.label || '', 160)

  const run = {
    runId: paths.runId,
    title,
    runType: 'dry-run',
    createdAt,
    updatedAt: now,
    source: 'commercial-ui',
    status,
    briefPreview: brief.slice(0, 280),
    expectedArtifacts,
    paths: {
      run: toRelativeRepoPath(paths.runPath, options),
      brief: toRelativeRepoPath(paths.briefPath, options),
      status: toRelativeRepoPath(paths.statusPath, options),
      eventsLog: toRelativeRepoPath(paths.eventsPath, options),
      summary: toRelativeRepoPath(paths.summaryPath, options),
    },
    warnings,
  }

  const statusRecord = {
    runId: paths.runId,
    status,
    currentStep,
    steps,
    completedAt: status === 'completed' ? now : undefined,
    validation: normalizeText(payload?.validation, 'Dry-run pendiente', 120),
    warnings,
    errors: normalizeList(payload?.errors),
  }

  return {
    brief,
    run,
    statusRecord,
  }
}

async function createDryRun(payload, options = {}) {
  try {
    const paths = resolveRunPaths(payload?.runId, options)
    const { brief, run, statusRecord } = buildRunRecord(payload, paths, options)

    await ensureRunDirectories(paths)
    await writeJsonFile(paths.runJsonPath, run)
    await fs.promises.writeFile(paths.briefPath, buildBriefMarkdown({ brief, createdAt: run.createdAt }), 'utf8')
    await writeJsonFile(paths.statusPath, statusRecord)
    await fs.promises.writeFile(
      paths.eventsPath,
      buildEventsLogLines({
        event: 'run created',
        runId: paths.runId,
        status: statusRecord.status,
        currentStep: statusRecord.currentStep,
        warnings: statusRecord.warnings,
      }),
      'utf8',
    )
    await fs.promises.writeFile(
      paths.summaryPath,
      buildRunSummaryMarkdown({ run, status: statusRecord }),
      'utf8',
    )

    return {
      ok: true,
      runId: paths.runId,
      run,
      status: statusRecord,
      path: toRelativeRepoPath(paths.runPath, options),
      artifacts: {
        runJson: toRelativeRepoPath(paths.runJsonPath, options),
        brief: toRelativeRepoPath(paths.briefPath, options),
        status: toRelativeRepoPath(paths.statusPath, options),
        eventsLog: toRelativeRepoPath(paths.eventsPath, options),
        summary: toRelativeRepoPath(paths.summaryPath, options),
      },
    }
  } catch (error) {
    return buildFailure(error)
  }
}

async function readJsonIfExists(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8')
  return JSON.parse(content)
}

async function updateDryRunStatus(runId, statusPayload = {}, options = {}) {
  try {
    const paths = resolveRunPaths(runId, options)
    const existingRun = await readJsonIfExists(paths.runJsonPath)
    const existingStatus = await readJsonIfExists(paths.statusPath)
    const now = new Date().toISOString()
    const nextSteps = Array.isArray(statusPayload.steps)
      ? normalizeSteps(statusPayload.steps)
      : existingStatus.steps || []
    const nextWarnings = mergeLists(existingStatus.warnings, statusPayload.warnings)
    const nextStatus = normalizeText(statusPayload.status, existingStatus.status || 'running', 40)
    const nextCurrentStep = normalizeText(
      statusPayload.currentStep,
      existingStatus.currentStep || nextSteps[0]?.label || '',
      160,
    )
    const nextErrors = mergeLists(existingStatus.errors, statusPayload.errors)

    const nextStatusRecord = {
      ...existingStatus,
      runId: paths.runId,
      status: nextStatus,
      currentStep: nextCurrentStep,
      steps: nextSteps,
      completedAt:
        normalizeText(statusPayload.completedAt, '', 80) ||
        (nextStatus === 'completed' ? now : existingStatus.completedAt),
      validation: normalizeText(
        statusPayload.validation,
        existingStatus.validation || 'Dry-run pendiente',
        120,
      ),
      warnings: nextWarnings,
      errors: nextErrors,
    }
    const nextRun = {
      ...existingRun,
      status: nextStatus,
      updatedAt: now,
      warnings: nextWarnings,
    }

    await writeJsonFile(paths.statusPath, nextStatusRecord)
    await writeJsonFile(paths.runJsonPath, nextRun)
    await fs.promises.appendFile(
      paths.eventsPath,
      buildEventsLogLines({
        event: 'status updated',
        runId: paths.runId,
        status: nextStatus,
        currentStep: nextCurrentStep,
        warnings: normalizeList(statusPayload.warnings),
      }),
      'utf8',
    )
    await fs.promises.writeFile(
      paths.summaryPath,
      buildRunSummaryMarkdown({ run: nextRun, status: nextStatusRecord }),
      'utf8',
    )

    return {
      ok: true,
      runId: paths.runId,
      run: nextRun,
      status: nextStatusRecord,
      path: toRelativeRepoPath(paths.runPath, options),
    }
  } catch (error) {
    return buildFailure(error)
  }
}

async function readDryRun(runId, options = {}) {
  try {
    const paths = resolveRunPaths(runId, options)
    const run = await readJsonIfExists(paths.runJsonPath)
    const status = await readJsonIfExists(paths.statusPath)
    const summary = await fs.promises.readFile(paths.summaryPath, 'utf8')

    return {
      ok: true,
      runId: paths.runId,
      run,
      status,
      summary,
      path: toRelativeRepoPath(paths.runPath, options),
    }
  } catch (error) {
    return buildFailure(error)
  }
}

async function listDryRuns(options = {}) {
  try {
    const runsRoot = getRunsRoot(options)
    await fs.promises.mkdir(runsRoot, { recursive: true })
    const entries = await fs.promises.readdir(runsRoot, { withFileTypes: true })
    const runs = []

    for (const entry of entries) {
      if (!entry.isDirectory() || !RUN_ID_PATTERN.test(entry.name)) continue

      const paths = resolveRunPaths(entry.name, options)

      try {
        const run = await readJsonIfExists(paths.runJsonPath)
        const status = await readJsonIfExists(paths.statusPath)

        runs.push({
          runId: entry.name,
          title: run.title || entry.name,
          status: status.status || run.status || 'unknown',
          runType: run.runType || 'dry-run',
          updatedAt: run.updatedAt || run.createdAt || '',
          path: toRelativeRepoPath(paths.runPath, options),
        })
      } catch {
        runs.push({
          runId: entry.name,
          title: entry.name,
          status: 'unreadable',
          runType: 'dry-run',
          updatedAt: '',
          path: toRelativeRepoPath(paths.runPath, options),
        })
      }
    }

    runs.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))

    return {
      ok: true,
      runs,
      root: toRelativeRepoPath(runsRoot, options),
    }
  } catch (error) {
    return buildFailure(error)
  }
}

module.exports = {
  RUNS_RELATIVE_ROOT,
  createDryRun,
  updateDryRunStatus,
  readDryRun,
  listDryRuns,
  resolveRunPaths,
}
