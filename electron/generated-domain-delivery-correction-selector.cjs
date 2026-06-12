const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_FORBIDDEN_ACTIONS = [
  'No tocar web-prueba.',
  'No crear ni modificar .env.',
  'No crear ni modificar node_modules.',
  'No crear Dockerfile ni docker-compose.',
  'No hacer deploy.',
  'No usar servicios externos reales.',
  'No activar pagos reales.',
  'No usar DB productiva.',
  'No pedir, crear ni guardar credenciales reales.',
  'No cambiar package.json ni package-lock.json.',
  'No escribir fuera de .codex-temp.',
  'No usar git add .',
  'No hacer commit.',
  'No hacer push.',
]

const DEFAULT_EXPECTED_ARTIFACTS = [
  'request.json',
  'decisions-and-approvals.json',
  'generated-files.json',
  'summary.json',
  'validation-summary.json',
  'validation/report.json',
  'heartbeat.log',
]

const DEFAULT_VALIDATION_COMMANDS = [
  'node scripts/generated-domain-delivery-roundtrip-runner.mjs --help',
  'git diff --check',
  'git status --short',
]

function readTextFileIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return ''
    }
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

function readJsonFileIfExists(filePath) {
  const text = readTextFileIfExists(filePath)
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    return {
      __parseError: error.message,
      __rawText: text,
    }
  }
}

function writeTextFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, value, 'utf8')
}

function listCaseDirectories(root) {
  if (!root || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return []
  }
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .sort()
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

function getSeverity(issues = []) {
  if (issues.some((issue) => issue?.severity === 'blocking')) {
    return 'blocking'
  }
  if (issues.some((issue) => issue?.severity === 'major')) {
    return 'major'
  }
  if (issues.some((issue) => issue?.severity === 'minor')) {
    return 'minor'
  }
  return 'none'
}

function pathIfExists(filePath) {
  return filePath && fs.existsSync(filePath) ? filePath : ''
}

function buildCandidateFromRoundtrip(caseDir, input = {}) {
  const caseName = path.basename(caseDir)
  const roundtripReportPath = path.join(caseDir, 'delivery-roundtrip-report.json')
  const report = readJsonFileIfExists(roundtripReportPath)
  if (!report || report.__parseError) {
    return null
  }

  const localTaskPath = path.join(caseDir, 'correction-task', 'codex-correction-task.json')
  const localPromptPath = path.join(caseDir, 'correction-task', 'codex-correction-prompt.md')
  const fallbackTaskPath = input.taskRoot
    ? path.join(input.taskRoot, caseName, 'codex-correction-task.json')
    : ''
  const fallbackPromptPath = input.taskRoot
    ? path.join(input.taskRoot, caseName, 'codex-correction-prompt.md')
    : ''
  const taskPath = pathIfExists(localTaskPath) || pathIfExists(fallbackTaskPath)
  const promptPath = pathIfExists(localPromptPath) || pathIfExists(fallbackPromptPath)
  const task = readJsonFileIfExists(taskPath) || report.correctionTask || {}
  const issues = report.initialReview?.issues || task.issues || report.remainingIssues || []
  const categories = unique([
    ...(Array.isArray(task.categories) ? task.categories : []),
    ...issues.map((issue) => issue?.category),
  ])

  return {
    id: caseName,
    caseName,
    roundtripStatus: report.roundtripStatus || '',
    reviewStatus: report.initialReviewStatus || report.initialReview?.status || task.sourceReviewStatus || '',
    taskStatus: report.correctionTaskStatus || task.taskStatus || '',
    severity: task.severity || getSeverity(issues),
    categories,
    issueCount: issues.length,
    evidenceDir:
      report.metadata?.initialEvidenceDir ||
      task.evidenceDir ||
      report.correctionTask?.evidenceDir ||
      '',
    taskPath,
    promptPath,
    roundtripReportPath,
    reviewerSummary:
      report.initialReview?.reviewerSummary ||
      task.metadata?.reviewerSummary ||
      report.progressSummary ||
      '',
    correctionBrief:
      task.correctionBrief ||
      report.initialReview?.correctionBrief ||
      report.correctionTask?.correctionBrief ||
      '',
    requiredFixes: Array.isArray(task.requiredFixes) ? task.requiredFixes : [],
    validationCommands: Array.isArray(task.validationCommands) ? task.validationCommands : [],
    forbiddenActions: Array.isArray(task.forbiddenActions) ? task.forbiddenActions : [],
    task,
  }
}

function discoverCorrectionCandidates(input = {}) {
  const roundtripRoot = input.roundtripRoot || ''
  return listCaseDirectories(roundtripRoot)
    .map((caseDir) => buildCandidateFromRoundtrip(caseDir, input))
    .filter(Boolean)
}

function isReadyCandidate(candidate) {
  return (
    candidate?.taskStatus === 'ready' &&
    (candidate.roundtripStatus === 'awaiting_manual_correction' ||
      candidate.roundtripStatus === 'needs_more_revision' ||
      candidate.reviewStatus === 'needs_revision')
  )
}

function selectCorrectionCandidate(candidates = [], selector = {}) {
  const caseName = typeof selector === 'string' ? selector : selector.caseName || selector.id || ''
  if (caseName) {
    const selected = candidates.find(
      (candidate) => candidate.caseName === caseName || candidate.id === caseName,
    )
    if (!selected) {
      throw new Error(`No se encontro candidate para case: ${caseName}`)
    }
    return selected
  }

  const readyCandidates = candidates.filter(isReadyCandidate)
  if (readyCandidates.length === 1) {
    return readyCandidates[0]
  }

  if (readyCandidates.length > 1) {
    throw new Error('Hay varios candidates listos; usar --case para seleccionar uno.')
  }

  if (candidates.length === 1) {
    return candidates[0]
  }

  throw new Error('No hay un candidate listo unico; usar --list o --case.')
}

function hasMissingArtifacts(candidate, requiredPaths) {
  return requiredPaths.some((filePath) => !filePath || !fs.existsSync(filePath))
}

function quoteArg(value) {
  return `"${String(value || '').replace(/"/g, '\\"')}"`
}

function buildRoundtripCommand({ sourceEvidenceDir, correctedEvidenceDir, handoffOutputDir, caseName }) {
  return [
    'node scripts/generated-domain-delivery-roundtrip-runner.mjs',
    `  --initial-evidence ${quoteArg(sourceEvidenceDir)}`,
    `  --corrected-evidence ${quoteArg(correctedEvidenceDir)}`,
    `  --output ${quoteArg(path.join(handoffOutputDir, 'roundtrip-review'))}`,
    `  --project-name ${quoteArg(caseName)}`,
  ].join(' \\\n')
}

function deriveHandoffStatus(candidate) {
  if (!candidate) {
    return 'missing_artifacts'
  }
  if (candidate.roundtripStatus === 'no_action_needed' || candidate.taskStatus === 'no_action_needed') {
    return 'no_action_needed'
  }
  if (
    candidate.roundtripStatus === 'blocked_requires_human' ||
    candidate.taskStatus === 'blocked_requires_human'
  ) {
    return 'blocked_requires_human'
  }
  if (isReadyCandidate(candidate)) {
    return 'ready'
  }
  if (!candidate.taskPath || !candidate.promptPath) {
    return 'missing_artifacts'
  }
  return 'missing_artifacts'
}

function buildHandoffPrompt(handoff, candidate) {
  const lines = [
    'MANUAL CODEX CORRECTION HANDOFF',
    '',
    `Caso: ${handoff.caseName}`,
    `Estado del handoff: ${handoff.handoffStatus}`,
    `Evidencia inicial: ${handoff.sourceEvidenceDir || '(no disponible)'}`,
    `Task original: ${handoff.taskPath || '(no disponible)'}`,
    `Prompt original: ${handoff.promptPath || '(no disponible)'}`,
    `Evidencia corregida a crear: ${handoff.correctedEvidenceDir}`,
    '',
  ]

  if (handoff.handoffStatus === 'no_action_needed') {
    lines.push(
      'Este caso no requiere correccion. No generes cambios agresivos ni modifiques evidencia.',
    )
  } else if (handoff.handoffStatus === 'blocked_requires_human') {
    lines.push(
      'Este caso esta bloqueado y requiere diagnostico humano antes de cualquier correccion.',
      'No corrijas ni escribas archivos sin aprobacion humana explicita.',
    )
  } else if (handoff.handoffStatus === 'missing_artifacts') {
    lines.push(
      'Faltan artefactos criticos para una correccion segura.',
      'No corrijas la entrega; diagnostica que artefactos faltan y solicita regenerarlos.',
    )
  } else {
    lines.push(
      'Objetivo:',
      '- Corregir manualmente la entrega sandbox indicada por JEFE.',
      '- Trabajar solo dentro de la carpeta de evidencia corregida indicada.',
      '- Regenerar evidencia honesta y dejar listo el re-review.',
    )
  }

  lines.push(
    '',
    'Problema detectado por JEFE:',
    candidate.reviewerSummary || '(sin resumen)',
  )

  if (candidate.correctionBrief) {
    lines.push('', 'Correction brief original:', candidate.correctionBrief)
  }

  if (candidate.requiredFixes?.length) {
    lines.push('', 'Correcciones requeridas:')
    for (const fix of candidate.requiredFixes) {
      lines.push(`- ${fix}`)
    }
  }

  lines.push('', 'Restricciones duras:')
  for (const action of handoff.forbiddenActions) {
    lines.push(`- ${action.replace(/\.$/, '')}.`)
  }

  lines.push(
    '',
    'No modificar archivos versionados. No hacer commit ni push. No ejecutar Codex automaticamente.',
    'Trabajar solamente dentro de .codex-temp y no escribir fuera de la evidencia corregida.',
    '',
    'Evidencia que debe quedar regenerada:',
  )
  for (const artifact of handoff.expectedArtifacts) {
    lines.push(`- ${artifact}`)
  }

  lines.push(
    '',
    'Comando de re-review sugerido:',
    '```bash',
    handoff.roundtripCommand,
    '```',
  )

  return `${lines.join('\n')}\n`
}

function buildCodexCorrectionHandoff(candidate, options = {}) {
  const handoffOutputDir = options.outputDir || ''
  const correctedEvidenceDir =
    options.correctedEvidenceDir || (handoffOutputDir ? path.join(handoffOutputDir, 'corrected-evidence') : '')
  const sourceEvidenceDir =
    options.sourceEvidenceDir || candidate?.evidenceDir || options.evidenceDir || ''
  const status = deriveHandoffStatus(candidate)
  const missingCriticalArtifacts =
    status === 'ready' && hasMissingArtifacts(candidate, [candidate.taskPath, candidate.promptPath])
  const handoffStatus = missingCriticalArtifacts ? 'missing_artifacts' : status
  const forbiddenActions = unique([
    ...DEFAULT_FORBIDDEN_ACTIONS,
    ...(candidate?.forbiddenActions || []),
    ...(options.forbiddenActions || []),
  ])
  const validationCommands = unique([
    ...(candidate?.validationCommands || []),
    ...DEFAULT_VALIDATION_COMMANDS,
  ])
  const handoff = {
    handoffStatus,
    caseName: candidate?.caseName || options.caseName || '',
    sourceEvidenceDir,
    correctedEvidenceDir,
    handoffOutputDir,
    taskPath: candidate?.taskPath || '',
    promptPath: candidate?.promptPath || '',
    codexPrompt: '',
    roundtripCommand: buildRoundtripCommand({
      sourceEvidenceDir,
      correctedEvidenceDir,
      handoffOutputDir,
      caseName: candidate?.caseName || options.caseName || '',
    }),
    restrictions: [
      'solo .codex-temp',
      'correccion manual',
      'sin Codex automatico',
      'sin cambios versionados',
    ],
    forbiddenActions,
    expectedArtifacts: DEFAULT_EXPECTED_ARTIFACTS,
    validationCommands,
    metadata: {
      generatedAt: new Date().toISOString(),
      roundtripStatus: candidate?.roundtripStatus || '',
      reviewStatus: candidate?.reviewStatus || '',
      taskStatus: candidate?.taskStatus || '',
      severity: candidate?.severity || 'none',
      categories: candidate?.categories || [],
      issueCount: candidate?.issueCount || 0,
    },
  }
  handoff.codexPrompt = buildHandoffPrompt(handoff, candidate || {})
  return handoff
}

function validateCorrectionHandoff(handoff) {
  const issues = []
  if (!handoff || typeof handoff !== 'object') {
    return { valid: false, issues: ['handoff invalido'] }
  }
  if (!handoff.caseName) {
    issues.push('caseName faltante')
  }
  if (handoff.handoffStatus === 'ready' && !handoff.sourceEvidenceDir) {
    issues.push('sourceEvidenceDir faltante')
  }
  if (handoff.handoffStatus === 'ready' && !handoff.correctedEvidenceDir) {
    issues.push('correctedEvidenceDir faltante')
  }
  const unsafeDestinationText = [
    handoff.correctedEvidenceDir,
    handoff.handoffOutputDir,
    handoff.roundtripCommand,
  ].join('\n')
  if (/\b(?:web-prueba|node_modules|docker-compose|Dockerfile)\b/u.test(unsafeDestinationText)) {
    issues.push('handoff contiene destino o instruccion prohibida')
  }
  if (/(^|[\\/\s])\.env($|[\\/\s])/u.test(unsafeDestinationText)) {
    issues.push('handoff contiene .env')
  }
  if (!handoff.roundtripCommand) {
    issues.push('roundtripCommand faltante')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function renderReadme(handoff) {
  return [
    '# Codex Correction Handoff',
    '',
    `Case: ${handoff.caseName}`,
    `Status: ${handoff.handoffStatus}`,
    '',
    'Files:',
    '- codex-correction-handoff.json',
    '- codex-correction-handoff-prompt.md',
    '- roundtrip-command.txt',
    '',
    'Next step:',
    handoff.handoffStatus === 'ready'
      ? 'Pass the prompt to Codex manually, then run the roundtrip command after corrected evidence exists.'
      : 'Review the handoff status before doing any manual correction.',
    '',
  ].join('\n')
}

function writeCodexCorrectionHandoff(outputDir, handoff) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const handoffPath = path.join(outputDir, 'codex-correction-handoff.json')
  const promptPath = path.join(outputDir, 'codex-correction-handoff-prompt.md')
  const commandPath = path.join(outputDir, 'roundtrip-command.txt')
  const readmePath = path.join(outputDir, 'README.md')

  writeTextFile(handoffPath, `${JSON.stringify(handoff, null, 2)}\n`)
  writeTextFile(promptPath, handoff.codexPrompt)
  writeTextFile(commandPath, `${handoff.roundtripCommand}\n`)
  writeTextFile(readmePath, renderReadme(handoff))

  return {
    handoffPath,
    promptPath,
    commandPath,
    readmePath,
  }
}

module.exports = {
  discoverCorrectionCandidates,
  selectCorrectionCandidate,
  buildCodexCorrectionHandoff,
  writeCodexCorrectionHandoff,
  validateCorrectionHandoff,
}
