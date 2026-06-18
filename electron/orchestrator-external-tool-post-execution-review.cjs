const fs = require('node:fs')
const path = require('node:path')

const {
  validateSafeOutputDir,
} = require('./orchestrator-planned-external-workers.cjs')

const {
  loadManualSupervisedExecutionSession,
} = require('./orchestrator-external-tool-manual-supervised-runner.cjs')

const repoRoot = path.resolve(__dirname, '..')

function nowIso() {
  return new Date().toISOString()
}

function unique(values) {
  const seen = new Set()
  const result = []
  for (const value of values || []) {
    const normalized = String(value || '').trim()
    if (!normalized || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(normalized)
  }
  return result
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

function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(text.replace(/^\uFEFF/u, ''))
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function resolveRepoPath(value) {
  if (!value) {
    return ''
  }
  return path.resolve(repoRoot, value)
}

function normalizeArtifact(value = {}) {
  if (value.externalToolPostExecutionReview) {
    return value.externalToolPostExecutionReview
  }
  if (value.manualEvidenceIntake) {
    return value.manualEvidenceIntake
  }
  if (value.review) {
    return value.review
  }
  return value
}

function loadManualEvidenceIntake(intakePath) {
  if (!intakePath) {
    throw new Error('--intake es obligatorio')
  }
  const resolved = resolveRepoPath(intakePath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Evidence intake inexistente: ${intakePath}`)
  }
  return normalizeArtifact(readJsonFile(resolved))
}

function loadExternalToolPostExecutionReview(reviewPath) {
  if (!reviewPath) {
    throw new Error('--review es obligatorio')
  }
  const resolved = resolveRepoPath(reviewPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Post-execution review inexistente: ${reviewPath}`)
  }
  return normalizeArtifact(readJsonFile(resolved))
}

function classifyScopeFinding(value) {
  const text = String(value || '').toLowerCase()
  if (!text) {
    return false
  }
  return (
    text.includes('fuera de .codex-temp o scopes aprobados') ||
    text.includes('fuera de scope') ||
    text.includes('path traversal') ||
    text.includes('path absoluto') ||
    text.includes('slash-root') ||
    text.includes('web-prueba') ||
    text.includes('node_modules') ||
    text.includes('dist/') ||
    text.includes('build/') ||
    text.includes('release/') ||
    text.includes('out/') ||
    text.includes('dockerfile') ||
    text.includes('docker-compose') ||
    text.includes('deploy') ||
    text.includes('package.json') ||
    text.includes('package-lock.json')
  )
}

function classifySecurityFinding(value) {
  const text = String(value || '').toLowerCase()
  if (!text) {
    return false
  }
  return (
    text.includes('.env') ||
    text.includes('credencial') ||
    text.includes('credential') ||
    text.includes('secret') ||
    text.includes('token') ||
    text.includes('api_key') ||
    text.includes('apikey')
  )
}

function nextActionForReview(status) {
  if (status === 'pass') {
    return 'Cerrar revision y dejar la sesion lista para seguimiento posterior.'
  }
  if (status === 'needs_revision') {
    return 'Solicitar evidencia adicional o correcciones al operador humano.'
  }
  if (status === 'missing_evidence') {
    return 'Solicitar evidence intake antes de revisar.'
  }
  if (status === 'invalid_scope') {
    return 'Rechazar la evidencia y pedir nueva entrega dentro del scope aprobado.'
  }
  return 'Bloquear la revision y escalar el riesgo de seguridad.'
}

function buildDecisionSummary(review) {
  return [
    `Review ${review.reviewStatus || 'unknown'} para ${review.workerId || 'sin worker'} (${review.capability || 'sin capability'}).`,
    `Session: ${review.sessionStatus || 'unknown'}.`,
    `Evidence: ${review.evidenceStatus || 'unknown'}.`,
    'executionAllowed=false.',
    'automaticExecutionAllowed=false.',
    'externalToolExecutedByJefe=false.',
  ].join(' ')
}

function buildDecisionRationale(review) {
  if (review.reviewStatus === 'pass') {
    return 'La evidencia entregada por el operador cumple el contrato estructural esperado y no expone riesgos duros detectables en V1.6.'
  }
  if (review.reviewStatus === 'needs_revision') {
    return 'La evidencia existe pero no cubre completamente el contrato esperado; se requiere una nueva entrega o ampliacion controlada.'
  }
  if (review.reviewStatus === 'missing_evidence') {
    return 'No existe evidencia suficiente para revisar la ejecucion manual supervisada.'
  }
  if (review.reviewStatus === 'invalid_scope') {
    return 'La evidencia apunta a rutas o artefactos fuera del scope aprobado; la entrega no puede aceptarse.'
  }
  return 'Se detecto un riesgo de seguridad o una condicion bloqueante que invalida la revision.'
}

function markdownList(title, values) {
  return [
    `# ${title}`,
    '',
    ...(values?.length ? values.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n')
}

function buildExternalToolPostExecutionReview(input = {}) {
  const session = input.session || loadManualSupervisedExecutionSession(input.sessionPath)
  const intake = input.intake || loadManualEvidenceIntake(input.intakePath)
  const sessionIssues = []
  const blockingFindings = []
  const revisionFindings = []
  const scopeFindings = []
  const securityFindings = []

  if (session.executionMode !== 'manual_supervised') {
    sessionIssues.push('executionMode debe ser manual_supervised')
  }
  if (session.executionAllowed !== false) {
    sessionIssues.push('executionAllowed debe ser false')
  }
  if (session.automaticExecutionAllowed !== false) {
    sessionIssues.push('automaticExecutionAllowed debe ser false')
  }
  if (session.externalToolExecutedByJefe !== false) {
    sessionIssues.push('externalToolExecutedByJefe debe ser false')
  }
  if (session.sessionStatus === 'aborted') {
    blockingFindings.push('La sesion fue abortada antes del review.')
  }
  if (session.sessionStatus === 'blocked') {
    blockingFindings.push('La sesion ya estaba bloqueada antes del review.')
  }
  if (session.sessionStatus === 'missing_artifacts') {
    revisionFindings.push('La sesion original no contaba con todos los artefactos requeridos.')
  }

  const intakeBlockedReasons = unique(intake.blockedReasons || [])
  for (const finding of intakeBlockedReasons) {
    if (classifySecurityFinding(finding)) {
      securityFindings.push(finding)
      continue
    }
    if (classifyScopeFinding(finding)) {
      scopeFindings.push(finding)
      continue
    }
    blockingFindings.push(finding)
  }

  const missingExpectedEvidence = unique(intake.missingExpectedEvidence || [])
  if (!intake.filesFound?.length) {
    revisionFindings.push('No se encontraron archivos de evidencia para revisar.')
  }
  for (const item of missingExpectedEvidence) {
    revisionFindings.push(`Falta evidencia esperada: ${item}`)
  }
  for (const note of unique(intake.validationNotes || [])) {
    if (note.toLowerCase().includes('faltante')) {
      revisionFindings.push(note)
    }
  }

  let reviewStatus = 'pass'
  if (sessionIssues.length || securityFindings.length || blockingFindings.length) {
    reviewStatus = 'blocked'
  } else if (scopeFindings.length) {
    reviewStatus = 'invalid_scope'
  } else if (intake.evidenceStatus === 'missing_evidence' || !intake.filesFound?.length) {
    reviewStatus = 'missing_evidence'
  } else if (intake.evidenceStatus === 'invalid_evidence' || missingExpectedEvidence.length || revisionFindings.length) {
    reviewStatus = 'needs_revision'
  } else if (intake.evidenceStatus === 'blocked') {
    reviewStatus = 'blocked'
  }

  const findings = {
    blocking: unique([...sessionIssues, ...blockingFindings, ...securityFindings]),
    revision: unique(revisionFindings),
    scope: unique(scopeFindings),
  }

  const review = {
    reviewStatus,
    executionMode: 'manual_supervised_post_execution_review',
    executionAllowed: false,
    automaticExecutionAllowed: false,
    externalToolExecutedByJefe: false,
    reviewer: {
      name: String(input.reviewerName || '').trim(),
      role: String(input.reviewerRole || '').trim() || 'Human Reviewer',
    },
    workerId: session.workerId || '',
    workerDisplayName: session.workerDisplayName || '',
    capability: session.capability || '',
    toolKind: session.toolKind || '',
    sessionStatus: session.sessionStatus || '',
    permitStatus: session.permitStatus || '',
    evidenceStatus: intake.evidenceStatus || '',
    filesReviewed: ensureArray(intake.filesFound).map((file) => ({
      relativePath: file.relativePath,
      size: file.size,
    })),
    findings,
    decisionSummary: '',
    decisionRationale: '',
    nextAction: '',
    readyForFutureSessionUi: reviewStatus === 'pass',
    metadata: {
      generatedAt: nowIso(),
      sessionPath: input.sessionPath || '',
      intakePath: input.intakePath || '',
      notes: input.notes || '',
      noExternalToolExecuted: true,
      sourceSessionMetadata: session.metadata || {},
      sourceIntakeMetadata: intake.metadata || {},
    },
  }

  review.decisionSummary = buildDecisionSummary(review)
  review.decisionRationale = buildDecisionRationale(review)
  review.nextAction = nextActionForReview(review.reviewStatus)
  return review
}

function validateExternalToolPostExecutionReview(review = {}) {
  const issues = []
  const validStatuses = new Set(['pass', 'needs_revision', 'blocked', 'missing_evidence', 'invalid_scope'])
  if (!validStatuses.has(review.reviewStatus)) {
    issues.push(`reviewStatus invalido: ${review.reviewStatus || '(vacio)'}`)
  }
  if (review.executionMode !== 'manual_supervised_post_execution_review') {
    issues.push('executionMode debe ser manual_supervised_post_execution_review')
  }
  if (review.executionAllowed !== false) {
    issues.push('executionAllowed debe ser false')
  }
  if (review.automaticExecutionAllowed !== false) {
    issues.push('automaticExecutionAllowed debe ser false')
  }
  if (review.externalToolExecutedByJefe !== false) {
    issues.push('externalToolExecutedByJefe debe ser false')
  }
  if (!review.workerId || !review.capability) {
    issues.push('workerId/capability faltantes')
  }
  if (!review.decisionSummary) {
    issues.push('decisionSummary faltante')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeExternalToolPostExecutionReview(review = {}) {
  return review.decisionSummary || buildDecisionSummary(review)
}

function writeExternalToolPostExecutionReview(outputDir, review) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolPostExecutionReview(review)
  if (!validation.valid) {
    throw new Error(`Post-execution review invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const reviewPath = path.join(resolvedOutputDir, 'external-tool-post-execution-review.json')
  const summaryPath = path.join(resolvedOutputDir, 'post-execution-review-summary.md')
  const findingsPath = path.join(resolvedOutputDir, 'post-execution-review-findings.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...review,
    artifacts: [reviewPath, summaryPath, findingsPath, readmePath],
  }
  writeJsonFile(reviewPath, serializable)
  fs.writeFileSync(
    summaryPath,
    [
      '# External Tool Post-Execution Review',
      '',
      `Status: ${review.reviewStatus}.`,
      `Tool: ${review.toolKind || '(unknown)'}.`,
      `Evidence: ${review.evidenceStatus || '(unknown)'}.`,
      'executionAllowed=false.',
      'automaticExecutionAllowed=false.',
      'externalToolExecutedByJefe=false.',
      '',
      review.decisionRationale,
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    findingsPath,
    [
      markdownList('Blocking Findings', review.findings?.blocking || []),
      markdownList('Scope Findings', review.findings?.scope || []),
      markdownList('Revision Findings', review.findings?.revision || []),
    ].join(''),
    'utf8',
  )
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Post-Execution Review',
      '',
      summarizeExternalToolPostExecutionReview(review),
      '',
      'Artifacts:',
      '- external-tool-post-execution-review.json',
      '- post-execution-review-summary.md',
      '- post-execution-review-findings.md',
      '- README.md',
      '',
      'Safety:',
      '- JEFE does not execute Blender, Unity or MCP during review.',
      '- Review consumes human-provided artifacts only.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    reviewPath,
    summaryPath,
    findingsPath,
    readmePath,
    review: serializable,
  }
}

module.exports = {
  loadExternalToolPostExecutionReview,
  loadManualEvidenceIntake,
  buildExternalToolPostExecutionReview,
  validateExternalToolPostExecutionReview,
  writeExternalToolPostExecutionReview,
  summarizeExternalToolPostExecutionReview,
}