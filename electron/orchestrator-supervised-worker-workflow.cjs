const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  validateDeliveryWorkerHandoff,
} = require('./generated-domain-delivery-worker-handoff.cjs')
const {
  buildLocalSmokeWorkerTask,
  runLocalSmokeWorkerTask,
  writeLocalSmokeWorkerReport,
  validateSafeOutputDir,
  commandsFromPreset,
} = require('./orchestrator-local-smoke-worker.cjs')

const repoRoot = path.resolve(__dirname, '..')
const DEFAULT_VALIDATION_PRESET = 'delivery-basic'
const ALLOWED_VALIDATION_PRESETS = new Set([
  'registry-basic',
  'delivery-basic',
  'delivery-full',
  'quality-ci',
])
const FORBIDDEN_PATH_SEGMENTS = new Set([
  'web-prueba',
  '.git',
  'node_modules',
  'src',
  'electron',
  'scripts',
])

function nowIso() {
  return new Date().toISOString()
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))]
}

function isSubpath(candidate, parent) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function resolveRepoPath(value) {
  return path.resolve(repoRoot, value || '')
}

function pathSegments(filePath) {
  return path
    .resolve(filePath)
    .split(path.sep)
    .map((segment) => segment.toLowerCase())
    .filter(Boolean)
}

function safeJsonRead(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return null
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    return { __parseError: error.message }
  }
}

function validateSafeArtifactPath(filePath, label = 'path') {
  if (!filePath) {
    return ''
  }
  const resolved = resolveRepoPath(filePath)
  const safeRoots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) => path.resolve(root))
  if (!safeRoots.some((root) => isSubpath(resolved, root))) {
    throw new Error(`${label} inseguro: debe estar dentro de .codex-temp o temp seguro: ${resolved}`)
  }
  if (resolved === repoRoot) {
    throw new Error(`${label} inseguro: no puede ser la raiz del repo.`)
  }
  for (const segment of pathSegments(resolved)) {
    if (FORBIDDEN_PATH_SEGMENTS.has(segment)) {
      throw new Error(`${label} inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`${label} inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }
  return resolved
}

function normalizeValidationPreset(preset) {
  const value = preset || DEFAULT_VALIDATION_PRESET
  if (!ALLOWED_VALIDATION_PRESETS.has(value)) {
    throw new Error(`validationPreset no soportado: ${value}`)
  }
  return value
}

function loadCorrectionWorkerHandoff(workerHandoffPath) {
  const resolvedPath = workerHandoffPath ? resolveRepoPath(workerHandoffPath) : ''
  const handoff = safeJsonRead(resolvedPath)
  if (!resolvedPath || !handoff) {
    return {
      handoff: null,
      path: resolvedPath,
      issue: 'worker handoff faltante',
    }
  }
  if (handoff.__parseError) {
    return {
      handoff: null,
      path: resolvedPath,
      issue: `worker handoff invalido: ${handoff.__parseError}`,
    }
  }
  return {
    handoff,
    path: resolvedPath,
    issue: '',
  }
}

function validateSupervisedWorkerWorkflowInput(input = {}) {
  const issues = []
  const warnings = []
  let outputDir = ''
  let correctedEvidenceDir = ''

  try {
    outputDir = validateSafeOutputDir(input.outputDir)
  } catch (error) {
    issues.push(error.message)
  }

  try {
    correctedEvidenceDir = validateSafeArtifactPath(input.correctedEvidenceDir || '', 'correctedEvidenceDir')
  } catch (error) {
    issues.push(error.message)
  }

  if (!input.correctionWorkerHandoffPath) {
    issues.push('correctionWorkerHandoffPath faltante')
  }
  if (!ALLOWED_VALIDATION_PRESETS.has(input.validationPreset || DEFAULT_VALIDATION_PRESET)) {
    issues.push(`validationPreset no soportado: ${input.validationPreset}`)
  }
  if (input.correctedEvidenceDir && correctedEvidenceDir && !fs.existsSync(correctedEvidenceDir)) {
    warnings.push('correctedEvidenceDir no existe todavia')
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    outputDir,
    correctedEvidenceDir,
  }
}

function buildValidationCommands(input = {}) {
  const preset = normalizeValidationPreset(input.validationPreset)
  return unique([...(input.validationCommands || []), ...commandsFromPreset(preset)])
}

function buildSupervisedWorkerWorkflow(input = {}, options = {}) {
  const validation = validateSupervisedWorkerWorkflowInput({
    ...input,
    validationPreset: input.validationPreset || DEFAULT_VALIDATION_PRESET,
  })
  const outputDir = validation.outputDir || (input.outputDir ? resolveRepoPath(input.outputDir) : '')
  const validationOutputDir = outputDir ? path.join(outputDir, 'validation') : ''
  const handoffLoad = loadCorrectionWorkerHandoff(input.correctionWorkerHandoffPath)
  const handoff = handoffLoad.handoff
  const issues = [...validation.issues]
  if (handoffLoad.issue) {
    issues.push(handoffLoad.issue)
  }

  const caseName = input.caseName || handoff?.caseName || 'supervised-worker-case'
  const correctedEvidenceDir =
    validation.correctedEvidenceDir ||
    (input.correctedEvidenceDir ? resolveRepoPath(input.correctedEvidenceDir) : handoff?.correctedEvidenceDir || '')

  if (handoff) {
    const handoffValidation = validateDeliveryWorkerHandoff(handoff)
    if (!handoffValidation.valid) {
      issues.push(...handoffValidation.issues)
    }
  }

  const evidenceExists = !!(correctedEvidenceDir && fs.existsSync(correctedEvidenceDir))
  const commands = issues.length ? [] : buildValidationCommands(input)
  const validationTask = issues.length
    ? null
    : buildLocalSmokeWorkerTask({
      taskTitle: `Validacion supervisada para ${caseName}`,
      commands,
      outputDir: validationOutputDir,
      dryRun: input.executeValidation !== true,
      failFast: input.failFast === true,
      timeoutMs: input.timeoutMs,
      sourceHandoffPath: handoffLoad.path,
      metadata: {
        caseName,
        validationPreset: input.validationPreset || DEFAULT_VALIDATION_PRESET,
      },
    }, options)

  const initialResult = {
    workflowStatus: 'handoff_ready',
    caseName,
    correctionWorker: {
      workerId: handoff?.workerId || 'codex-manual-correction',
      handoffStatus: handoff?.workerHandoffStatus || (handoff ? 'unknown' : 'missing'),
      promptPath: handoff?.metadata?.promptPath || handoff?.promptPath || '',
      correctedEvidenceDir,
    },
    validationWorker: {
      workerId: 'local-smoke-runner',
      taskStatus: validationTask ? (validationTask.dryRun ? 'dry_run' : 'ready') : 'skipped',
      validationPassed: false,
      commands: commands.map((command) => ({ command, status: 'pending' })),
    },
    issues,
    artifacts: [],
    nextAction: '',
    summary: '',
    metadata: {
      generatedAt: nowIso(),
      mode: input.executeValidation === true ? 'execute-validation' : 'dry-run',
      validationPreset: input.validationPreset || DEFAULT_VALIDATION_PRESET,
      outputDir,
      correctionWorkerHandoffPath: handoffLoad.path,
      validationWarnings: validation.warnings,
      ...(input.metadata || {}),
    },
  }

  if (issues.length) {
    initialResult.workflowStatus = issues.some((issue) => /inseguro|prohibido/iu.test(issue))
      ? 'blocked_requires_human'
      : 'missing_artifacts'
  } else if (handoff?.workerHandoffStatus === 'blocked' || handoff?.workerHandoffStatus === 'requires_human_approval') {
    initialResult.workflowStatus = 'blocked_requires_human'
    initialResult.issues.push(`handoff no listo: ${handoff.workerHandoffStatus}`)
  } else if (!evidenceExists) {
    initialResult.workflowStatus = 'awaiting_corrected_evidence'
  }

  initialResult.nextAction = deriveSupervisedWorkerWorkflowStatus(initialResult).nextAction
  initialResult.summary = buildSupervisedWorkerWorkflowSummary(initialResult)
  return {
    ...initialResult,
    validationTask,
  }
}

function deriveSupervisedWorkerWorkflowStatus(result = {}) {
  if (result.workflowStatus === 'blocked_requires_human') {
    return { workflowStatus: 'blocked_requires_human', nextAction: 'review_blocked_workflow' }
  }
  if (result.workflowStatus === 'missing_artifacts') {
    return { workflowStatus: 'missing_artifacts', nextAction: 'inspect_missing_artifacts' }
  }
  if (result.workflowStatus === 'awaiting_corrected_evidence') {
    return { workflowStatus: 'awaiting_corrected_evidence', nextAction: 'run_codex_manual_correction' }
  }
  const validationStatus = result.validationWorker?.taskStatus || ''
  if (validationStatus === 'completed' && result.validationWorker?.validationPassed) {
    return { workflowStatus: 'validation_passed', nextAction: 'archive_success_evidence' }
  }
  if (validationStatus === 'failed') {
    return { workflowStatus: 'validation_failed', nextAction: 'review_validation_failures' }
  }
  if (validationStatus === 'blocked') {
    return { workflowStatus: 'blocked_requires_human', nextAction: 'review_blocked_workflow' }
  }
  return { workflowStatus: result.workflowStatus || 'handoff_ready', nextAction: 'run_validation_when_ready' }
}

function runSupervisedWorkerWorkflow(input = {}, options = {}) {
  const built = buildSupervisedWorkerWorkflow(input, options)
  if (built.workflowStatus !== 'handoff_ready' || !built.validationTask) {
    return {
      ...built,
      validationTask: undefined,
    }
  }

  const smokeResult = runLocalSmokeWorkerTask(built.validationTask, options)
  const derivedStatus =
    smokeResult.taskStatus === 'blocked'
      ? 'blocked_requires_human'
      : smokeResult.taskStatus === 'failed'
        ? 'validation_failed'
        : smokeResult.taskStatus === 'completed' && smokeResult.validationPassed
          ? 'validation_passed'
          : 'handoff_ready'

  const result = {
    ...built,
    workflowStatus: derivedStatus,
    validationTask: undefined,
    validationWorker: {
      workerId: smokeResult.workerId || 'local-smoke-runner',
      taskStatus: smokeResult.taskStatus,
      validationPassed: smokeResult.validationPassed === true,
      commands: smokeResult.commands || [],
      report: smokeResult,
    },
  }
  const derived = deriveSupervisedWorkerWorkflowStatus(result)
  result.workflowStatus = derived.workflowStatus
  result.nextAction = derived.nextAction
  result.summary = buildSupervisedWorkerWorkflowSummary(result)
  return result
}

function buildSupervisedWorkerWorkflowSummary(result = {}) {
  const issueText = (result.issues || []).length ? `${result.issues.length} issue(s)` : 'sin issues'
  const validationStatus = result.validationWorker?.taskStatus || 'sin validacion'
  return `Workflow ${result.workflowStatus || 'unknown'} para ${result.caseName || 'caso'}; handoff ${result.correctionWorker?.handoffStatus || 'unknown'}; validation ${validationStatus}; ${issueText}.`
}

function writeSupervisedWorkerWorkflowReport(outputDir, result) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  fs.mkdirSync(resolvedOutputDir, { recursive: true })

  let validationArtifacts = null
  if (result.validationWorker?.report) {
    validationArtifacts = writeLocalSmokeWorkerReport(path.join(resolvedOutputDir, 'validation'), result.validationWorker.report)
  }

  const reportPath = path.join(resolvedOutputDir, 'supervised-worker-workflow-report.json')
  const summaryPath = path.join(resolvedOutputDir, 'supervised-worker-workflow-summary.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...result,
    artifacts: unique([
      ...(result.artifacts || []),
      reportPath,
      summaryPath,
      readmePath,
      validationArtifacts?.reportPath,
      validationArtifacts?.summaryPath,
    ]),
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(summaryPath, `${buildSupervisedWorkerWorkflowSummary(serializable)}\n`, 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# Supervised Worker Workflow',
      '',
      `Case: ${serializable.caseName}`,
      `Status: ${serializable.workflowStatus}`,
      `Next action: ${serializable.nextAction}`,
      '',
      serializable.summary,
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    reportPath,
    summaryPath,
    readmePath,
    outputDir: resolvedOutputDir,
    validationArtifacts,
    result: serializable,
  }
}

module.exports = {
  buildSupervisedWorkerWorkflow,
  runSupervisedWorkerWorkflow,
  writeSupervisedWorkerWorkflowReport,
  buildSupervisedWorkerWorkflowSummary,
  validateSupervisedWorkerWorkflowInput,
  deriveSupervisedWorkerWorkflowStatus,
  validateSafeArtifactPath,
  normalizeValidationPreset,
}
