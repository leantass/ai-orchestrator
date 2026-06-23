const fs = require('node:fs')
const path = require('node:path')

const {
  validateSafeOutputDir,
} = require('./orchestrator-planned-external-workers.cjs')

const repoRoot = path.resolve(__dirname, '..')

const VALID_WORK_STATES = new Set([
  'planned',
  'in_progress',
  'needs_context',
  'requires_openai',
  'requires_human_approval',
  'running_codex_worker',
  'validating',
  'needs_revision',
  'blocked',
  'blocked_after_retries',
  'completed_local',
  'pushed',
  'ci_pending',
  'ci_failed',
  'ci_success',
  'accepted',
])

const VALID_EXECUTION_PATHS = new Set([
  'none',
  'local',
  'codex-worker',
  'tool-worker',
  'manual-supervised',
  'human-approval',
  'blocked',
])

const VALID_EXECUTION_STATUSES = new Set([
  'not_started',
  'pending',
  'running',
  'completed',
  'blocked',
])

const VALID_VALIDATION_STATUSES = new Set([
  'unknown',
  'pending',
  'running',
  'passed',
  'failed',
  'skipped',
])

const VALID_CI_STATUSES = new Set([
  'unknown',
  'pending',
  'failed',
  'success',
])

const VALID_REVIEW_STATUSES = new Set([
  'unknown',
  'pending',
  'accepted',
  'needs_revision',
  'blocked',
])

function nowIso() {
  return new Date().toISOString()
}

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (value === undefined || value === null || value === '') {
    return []
  }
  return [value]
}

function unique(values) {
  const seen = new Set()
  const result = []
  for (const value of ensureArray(values)) {
    const normalized = String(value || '').trim()
    if (!normalized || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(text.replace(/^\uFEFF/u, ''))
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function resolveRepoPath(value) {
  if (!value) {
    return ''
  }
  return path.resolve(repoRoot, value)
}

function normalizeArtifact(value = {}) {
  if (value.projectOperationsRunEnvelope) {
    return value.projectOperationsRunEnvelope
  }
  return value
}

function loadProjectOperationsRunEnvelope(envelopePath) {
  if (!envelopePath) {
    throw new Error('--envelope es obligatorio')
  }
  const resolved = resolveRepoPath(envelopePath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Run envelope inexistente: ${envelopePath}`)
  }
  return normalizeArtifact(readJsonFile(resolved))
}

function normalizePathEntry(entry) {
  if (!entry) {
    return ''
  }
  return String(entry).replace(/\\/gu, '/').trim()
}

function normalizeCommandEntry(entry) {
  if (!entry) {
    return ''
  }
  if (typeof entry === 'string') {
    return entry.trim()
  }
  if (Array.isArray(entry)) {
    return entry.map((part) => String(part || '').trim()).filter(Boolean).join(' ')
  }
  if (typeof entry === 'object') {
    const command = normalizeOptionalString(entry.command)
    const args = ensureArray(entry.args)
      .map((part) => String(part || '').trim())
      .filter(Boolean)
    return [command, ...args].filter(Boolean).join(' ')
  }
  return String(entry).trim()
}

function normalizeStateCandidate(value, fallback) {
  const normalized = normalizeOptionalString(value)
  return VALID_WORK_STATES.has(normalized) ? normalized : fallback
}

function normalizeStatusCandidate(value, validStatuses, fallback) {
  const normalized = normalizeOptionalString(value)
  return validStatuses.has(normalized) ? normalized : fallback
}

function deriveWorkState(input) {
  const explicitState = normalizeOptionalString(input.workState || input.currentState)
  if (VALID_WORK_STATES.has(explicitState)) {
    return explicitState
  }

  const request = input.request || {}
  const routing = input.routing || {}
  const execution = input.execution || {}
  const validation = input.validation || {}
  const review = input.review || {}
  const revisionLoop = input.revisionLoop || {}
  const retryCount = Number.isFinite(revisionLoop.retryCount)
    ? revisionLoop.retryCount
    : Number.isFinite(review.retryCount)
      ? review.retryCount
      : 0
  const maxRetries = Number.isFinite(revisionLoop.maxRetries)
    ? revisionLoop.maxRetries
    : Number.isFinite(review.maxRetries)
      ? review.maxRetries
      : 3
  const blockerReason =
    normalizeOptionalString(revisionLoop.blockerReason) ||
    normalizeOptionalString(review.blockerReason) ||
    normalizeOptionalString(execution.blockerReason)
  const reviewStatus = normalizeStatusCandidate(review.status, VALID_REVIEW_STATUSES, 'unknown')
  const validationStatus = normalizeStatusCandidate(
    validation.status,
    VALID_VALIDATION_STATUSES,
    'unknown',
  )
  const ciStatus = normalizeStatusCandidate(validation.ciStatus, VALID_CI_STATUSES, 'unknown')
  const executionStatus = normalizeStatusCandidate(
    execution.status,
    VALID_EXECUTION_STATUSES,
    'not_started',
  )
  const executionPath = normalizeStatusCandidate(
    routing.executionPath,
    VALID_EXECUTION_PATHS,
    'none',
  )
  const objective = normalizeOptionalString(request.objective || request.summary)

  if (!objective) {
    return 'needs_context'
  }
  if (reviewStatus === 'accepted' && ciStatus === 'success') {
    return 'accepted'
  }
  if (ciStatus === 'pending') {
    return 'ci_pending'
  }
  if (ciStatus === 'failed') {
    return 'ci_failed'
  }
  if (ciStatus === 'success') {
    return 'ci_success'
  }
  if (blockerReason && retryCount >= maxRetries) {
    return 'blocked_after_retries'
  }
  if (blockerReason || reviewStatus === 'blocked' || executionStatus === 'blocked') {
    return 'blocked'
  }
  if (reviewStatus === 'needs_revision') {
    return retryCount >= maxRetries ? 'blocked_after_retries' : 'needs_revision'
  }
  if (validationStatus === 'running' || validationStatus === 'pending') {
    return 'validating'
  }
  if (
    executionPath === 'codex-worker' &&
    (executionStatus === 'running' || executionStatus === 'pending')
  ) {
    return 'running_codex_worker'
  }
  if (routing.requiresHumanApproval === true || executionPath === 'human-approval') {
    return 'requires_human_approval'
  }
  if (routing.requiresOpenAI === true) {
    return 'requires_openai'
  }
  if (reviewStatus === 'accepted' || validationStatus === 'passed' || executionStatus === 'completed') {
    return 'completed_local'
  }
  if (executionStatus === 'running' || executionStatus === 'pending') {
    return 'in_progress'
  }
  return 'planned'
}

function defaultNextActionForState(workState) {
  if (workState === 'needs_context') {
    return 'Solicitar objetivo, alcance o contexto faltante antes de planificar.'
  }
  if (workState === 'requires_openai') {
    return 'Escalar el razonamiento al provider OpenAI existente o reportar que no esta configurado.'
  }
  if (workState === 'requires_human_approval') {
    return 'Pedir aprobacion humana antes de continuar con la ruta elegida.'
  }
  if (workState === 'running_codex_worker') {
    return 'Esperar o revisar el resultado del worker antes de validar.'
  }
  if (workState === 'validating') {
    return 'Cerrar los checks tecnicos y consolidar la evidencia.'
  }
  if (workState === 'needs_revision') {
    return 'Preparar una vuelta de correccion acotada y revalidar.'
  }
  if (workState === 'blocked_after_retries') {
    return 'Detener el loop y escalar el bloqueo con evidencia y decision humana requerida.'
  }
  if (workState === 'blocked') {
    return 'Detener la ejecucion y reportar el bloqueo real.'
  }
  if (workState === 'completed_local') {
    return 'Preparar cierre honesto con validacion, diff y siguiente paso.'
  }
  if (workState === 'ci_pending') {
    return 'Esperar CI remota o registrar que sigue pendiente.'
  }
  if (workState === 'ci_failed') {
    return 'Inspeccionar la falla de CI y abrir correccion si corresponde.'
  }
  if (workState === 'ci_success') {
    return 'Cerrar el bloque o solicitar aceptacion final segun el flujo.'
  }
  if (workState === 'accepted') {
    return 'Archivar el bloque como aceptado y registrar el siguiente objetivo.'
  }
  if (workState === 'in_progress') {
    return 'Continuar la implementacion dentro del scope aprobado.'
  }
  return 'Definir plan, ruta y validacion antes de ejecutar.'
}

function buildProjectOperationsRunEnvelope(input = {}) {
  const generatedAt = nowIso()
  const request = input.request || {}
  const project = input.project || {}
  const preflight = input.preflight || {}
  const routing = input.routing || {}
  const execution = input.execution || {}
  const validation = input.validation || {}
  const review = input.review || {}
  const revisionLoop = input.revisionLoop || {}
  const history = input.history || {}
  const workState = deriveWorkState(input)
  const retryCount = Number.isFinite(revisionLoop.retryCount)
    ? revisionLoop.retryCount
    : Number.isFinite(review.retryCount)
      ? review.retryCount
      : 0
  const maxRetries = Number.isFinite(revisionLoop.maxRetries)
    ? revisionLoop.maxRetries
    : Number.isFinite(review.maxRetries)
      ? review.maxRetries
      : 3
  const blockerReason =
    normalizeOptionalString(revisionLoop.blockerReason) ||
    normalizeOptionalString(review.blockerReason) ||
    normalizeOptionalString(execution.blockerReason)
  const nextAction =
    normalizeOptionalString(revisionLoop.nextAction) ||
    normalizeOptionalString(review.nextAction) ||
    defaultNextActionForState(workState)

  const envelope = {
    schemaVersion: 'v1.8-project-operations-run-envelope@1',
    workState,
    request: {
      requestId: normalizeOptionalString(request.requestId),
      objective: normalizeOptionalString(request.objective),
      summary: normalizeOptionalString(request.summary),
      requestedBy: normalizeOptionalString(request.requestedBy),
      workspacePath: normalizePathEntry(request.workspacePath),
    },
    project: {
      projectPath: normalizePathEntry(project.projectPath),
      projectKind: normalizeOptionalString(project.projectKind),
      continuationMode: normalizeOptionalString(project.continuationMode),
      contextSources: unique(project.contextSources),
    },
    preflight: {
      gitBranch: normalizeOptionalString(preflight.gitBranch),
      gitHead: normalizeOptionalString(preflight.gitHead),
      workingTreeStatus: normalizeOptionalString(preflight.workingTreeStatus) || 'unknown',
      ciStatus: normalizeStatusCandidate(preflight.ciStatus, VALID_CI_STATUSES, 'unknown'),
      risks: unique(preflight.risks),
      summary: normalizeOptionalString(preflight.summary),
    },
    routing: {
      reasoningProvider: normalizeOptionalString(routing.reasoningProvider) || 'local-rules',
      executionPath: normalizeStatusCandidate(routing.executionPath, VALID_EXECUTION_PATHS, 'none'),
      requiresOpenAI: routing.requiresOpenAI === true,
      requiresHumanApproval: routing.requiresHumanApproval === true,
      selectedWorkerId: normalizeOptionalString(routing.selectedWorkerId),
      capability: normalizeOptionalString(routing.capability),
      rationale: normalizeOptionalString(routing.rationale),
    },
    execution: {
      status: normalizeStatusCandidate(execution.status, VALID_EXECUTION_STATUSES, 'not_started'),
      executionMode: normalizeOptionalString(execution.executionMode) || 'none',
      workerId: normalizeOptionalString(execution.workerId),
      capability: normalizeOptionalString(execution.capability),
      outputArtifacts: unique(ensureArray(execution.outputArtifacts).map(normalizePathEntry)),
      validationCommands: unique(ensureArray(execution.validationCommands).map(normalizeCommandEntry)),
      blockerReason: normalizeOptionalString(execution.blockerReason),
      externalToolExecutedByJefe: execution.externalToolExecutedByJefe === true,
    },
    validation: {
      status: normalizeStatusCandidate(validation.status, VALID_VALIDATION_STATUSES, 'unknown'),
      ciStatus: normalizeStatusCandidate(validation.ciStatus, VALID_CI_STATUSES, 'unknown'),
      commands: unique(ensureArray(validation.commands).map(normalizeCommandEntry)),
      evidence: unique(ensureArray(validation.evidence).map(normalizePathEntry)),
      summary: normalizeOptionalString(validation.summary),
    },
    review: {
      status: normalizeStatusCandidate(review.status, VALID_REVIEW_STATUSES, 'unknown'),
      reviewer: normalizeOptionalString(review.reviewer),
      summary: normalizeOptionalString(review.summary),
      blockerReason: normalizeOptionalString(review.blockerReason),
    },
    revisionLoop: {
      retryCount,
      maxRetries,
      nextAction,
      blockerReason,
    },
    history: {
      previousState: normalizeStateCandidate(history.previousState, ''),
      transitionReason: normalizeOptionalString(history.transitionReason),
      relatedArtifacts: unique(ensureArray(history.relatedArtifacts).map(normalizePathEntry)),
    },
    metadata: {
      generatedAt,
      updatedAt: generatedAt,
      notes: normalizeOptionalString(input.metadata?.notes),
      sourcePaths: unique(ensureArray(input.metadata?.sourcePaths).map(normalizePathEntry)),
      noExternalToolExecuted: input.metadata?.noExternalToolExecuted !== false,
    },
  }

  envelope.summary = summarizeProjectOperationsRunEnvelope(envelope)
  return envelope
}

function validateProjectOperationsRunEnvelope(envelope = {}) {
  const issues = []
  if (!VALID_WORK_STATES.has(envelope.workState)) {
    issues.push(`workState invalido: ${envelope.workState || '(vacio)'}`)
  }
  if (!normalizeOptionalString(envelope.request?.objective || envelope.request?.summary)) {
    issues.push('request.objective o request.summary es obligatorio')
  }
  if (!VALID_EXECUTION_PATHS.has(envelope.routing?.executionPath || '')) {
    issues.push(`routing.executionPath invalido: ${envelope.routing?.executionPath || '(vacio)'}`)
  }
  if (!VALID_EXECUTION_STATUSES.has(envelope.execution?.status || '')) {
    issues.push(`execution.status invalido: ${envelope.execution?.status || '(vacio)'}`)
  }
  if (!VALID_VALIDATION_STATUSES.has(envelope.validation?.status || '')) {
    issues.push(`validation.status invalido: ${envelope.validation?.status || '(vacio)'}`)
  }
  if (!VALID_CI_STATUSES.has(envelope.validation?.ciStatus || '')) {
    issues.push(`validation.ciStatus invalido: ${envelope.validation?.ciStatus || '(vacio)'}`)
  }
  if (!VALID_REVIEW_STATUSES.has(envelope.review?.status || '')) {
    issues.push(`review.status invalido: ${envelope.review?.status || '(vacio)'}`)
  }

  const retryCount = Number(envelope.revisionLoop?.retryCount)
  const maxRetries = Number(envelope.revisionLoop?.maxRetries)
  if (!Number.isInteger(retryCount) || retryCount < 0) {
    issues.push('revisionLoop.retryCount debe ser entero >= 0')
  }
  if (!Number.isInteger(maxRetries) || maxRetries < 1) {
    issues.push('revisionLoop.maxRetries debe ser entero >= 1')
  }
  if (Number.isInteger(retryCount) && Number.isInteger(maxRetries) && retryCount > maxRetries) {
    issues.push('revisionLoop.retryCount no puede superar revisionLoop.maxRetries')
  }
  if (
    envelope.workState === 'blocked_after_retries' &&
    Number.isInteger(retryCount) &&
    Number.isInteger(maxRetries) &&
    retryCount < maxRetries
  ) {
    issues.push('blocked_after_retries requiere retryCount >= maxRetries')
  }
  if (envelope.workState === 'requires_human_approval' && envelope.routing?.requiresHumanApproval !== true) {
    issues.push('requires_human_approval requiere routing.requiresHumanApproval=true')
  }
  if (envelope.workState === 'requires_openai' && envelope.routing?.requiresOpenAI !== true) {
    issues.push('requires_openai requiere routing.requiresOpenAI=true')
  }
  if (
    envelope.workState === 'running_codex_worker' &&
    envelope.routing?.executionPath !== 'codex-worker'
  ) {
    issues.push('running_codex_worker requiere routing.executionPath=codex-worker')
  }
  if (
    envelope.workState === 'running_codex_worker' &&
    !['running', 'pending'].includes(envelope.execution?.status)
  ) {
    issues.push('running_codex_worker requiere execution.status running o pending')
  }
  if (envelope.workState === 'ci_pending' && envelope.validation?.ciStatus !== 'pending') {
    issues.push('ci_pending requiere validation.ciStatus=pending')
  }
  if (envelope.workState === 'ci_failed' && envelope.validation?.ciStatus !== 'failed') {
    issues.push('ci_failed requiere validation.ciStatus=failed')
  }
  if (envelope.workState === 'ci_success' && envelope.validation?.ciStatus !== 'success') {
    issues.push('ci_success requiere validation.ciStatus=success')
  }
  if (envelope.workState === 'accepted') {
    if (envelope.review?.status !== 'accepted') {
      issues.push('accepted requiere review.status=accepted')
    }
    if (envelope.validation?.ciStatus !== 'success') {
      issues.push('accepted requiere validation.ciStatus=success')
    }
  }
  return issues
}

function renderProjectOperationsRunEnvelopeSummary(envelope = {}) {
  const lines = [
    '# Project Operations Run Envelope',
    '',
    `State: ${envelope.workState || 'unknown'}`,
    `Objective: ${envelope.request?.objective || envelope.request?.summary || '(missing)'}`,
    `Project path: ${envelope.project?.projectPath || '(missing)'}`,
    `Reasoning provider: ${envelope.routing?.reasoningProvider || 'unknown'}`,
    `Execution path: ${envelope.routing?.executionPath || 'unknown'}`,
    `Execution status: ${envelope.execution?.status || 'unknown'}`,
    `Validation: ${envelope.validation?.status || 'unknown'} / CI: ${envelope.validation?.ciStatus || 'unknown'}`,
    `Review: ${envelope.review?.status || 'unknown'}`,
    `Retry budget: ${envelope.revisionLoop?.retryCount || 0}/${envelope.revisionLoop?.maxRetries || 0}`,
    '',
    'Next action:',
    envelope.revisionLoop?.nextAction || '(missing)',
    '',
    'Summary:',
    envelope.summary || '(missing)',
    '',
    'Validation commands:',
  ]

  if (envelope.execution?.validationCommands?.length) {
    for (const command of envelope.execution.validationCommands) {
      lines.push(`- ${command}`)
    }
  } else if (envelope.validation?.commands?.length) {
    for (const command of envelope.validation.commands) {
      lines.push(`- ${command}`)
    }
  } else {
    lines.push('- None')
  }

  lines.push('', 'Related artifacts:')
  if (envelope.history?.relatedArtifacts?.length) {
    for (const artifact of envelope.history.relatedArtifacts) {
      lines.push(`- ${artifact}`)
    }
  } else {
    lines.push('- None')
  }

  if (envelope.revisionLoop?.blockerReason) {
    lines.push('', 'Blocker reason:', envelope.revisionLoop.blockerReason)
  }

  return `${lines.join('\n')}\n`
}

function writeProjectOperationsRunEnvelope(outputDir, envelope) {
  const issues = validateProjectOperationsRunEnvelope(envelope)
  if (issues.length) {
    throw new Error(`Run envelope invalido:\n- ${issues.join('\n- ')}`)
  }

  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const envelopePath = path.join(resolvedOutputDir, 'project-operations-run-envelope.json')
  const summaryPath = path.join(resolvedOutputDir, 'project-operations-run-envelope-summary.md')
  writeJsonFile(envelopePath, envelope)
  fs.writeFileSync(summaryPath, renderProjectOperationsRunEnvelopeSummary(envelope), 'utf8')

  return {
    outputDir: resolvedOutputDir,
    envelopePath,
    summaryPath,
    envelope,
  }
}

function summarizeProjectOperationsRunEnvelope(envelope = {}) {
  const objective = envelope.request?.objective || envelope.request?.summary || 'sin objetivo'
  const provider = envelope.routing?.reasoningProvider || 'unknown'
  const executionPath = envelope.routing?.executionPath || 'unknown'
  const validationStatus = envelope.validation?.status || 'unknown'
  const reviewStatus = envelope.review?.status || 'unknown'
  const nextAction = envelope.revisionLoop?.nextAction || 'sin siguiente paso'
  return [
    `State ${envelope.workState || 'unknown'}`,
    `for "${objective}"`,
    `via ${provider}/${executionPath}.`,
    `Validation=${validationStatus}.`,
    `Review=${reviewStatus}.`,
    `Next=${nextAction}`,
  ].join(' ')
}

module.exports = {
  VALID_WORK_STATES,
  buildProjectOperationsRunEnvelope,
  validateProjectOperationsRunEnvelope,
  writeProjectOperationsRunEnvelope,
  loadProjectOperationsRunEnvelope,
  renderProjectOperationsRunEnvelopeSummary,
  summarizeProjectOperationsRunEnvelope,
  deriveWorkState,
}