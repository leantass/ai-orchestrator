const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  discoverCorrectionCandidates,
  selectCorrectionCandidate,
  buildCodexCorrectionHandoff,
  writeCodexCorrectionHandoff,
  validateCorrectionHandoff,
} = require('./generated-domain-delivery-correction-selector.cjs')
const {
  runDeliveryReviewRoundtrip,
  writeDeliveryRoundtripReport,
} = require('./generated-domain-delivery-roundtrip.cjs')
const {
  buildDeliveryHistoryEntry,
  buildDeliveryHistoryLedger,
  writeDeliveryHistoryLedger,
} = require('./generated-domain-delivery-history-ledger.cjs')

const repoRoot = path.resolve(__dirname, '..')
const FORBIDDEN_PATH_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])
const SUPPORTED_MODES = new Set([
  'list',
  'prepare-handoff',
  'review-correction',
  'full-supervised',
])

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

function writeTextFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, value, 'utf8')
}

function resolveFromRepo(value, fallback = '') {
  const selected = value || fallback
  return selected ? path.resolve(repoRoot, selected) : ''
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

function safeRoots() {
  return [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) => path.resolve(root))
}

function validateSafePath(label, targetPath, options = {}) {
  const resolved = path.resolve(targetPath)
  if (!safeRoots().some((root) => isSubpath(resolved, root))) {
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
  if (options.mustExist && (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory())) {
    throw new Error(`${label} no existe o no es un directorio: ${resolved}`)
  }
  return resolved
}

function validateSupervisedWorkflowPaths(input = {}) {
  const mode = input.mode || 'full-supervised'
  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(`Modo no soportado: ${mode}`)
  }
  if (!input.outputDir) {
    throw new Error('outputDir is required')
  }
  const outputDir = validateSafePath('output', resolveFromRepo(input.outputDir))
  const roundtripRoot = validateSafePath(
    'roundtripRoot',
    resolveFromRepo(input.roundtripRoot, '.codex-temp/delivery-review-loop-v04'),
    { mustExist: true },
  )
  const taskRoot = resolveFromRepo(input.taskRoot, '.codex-temp/delivery-review-loop-v03')
  if (taskRoot && fs.existsSync(taskRoot)) {
    validateSafePath('taskRoot', taskRoot, { mustExist: true })
  }
  const evidenceRoot = resolveFromRepo(input.evidenceRoot, '.codex-temp')
  if (evidenceRoot && fs.existsSync(evidenceRoot)) {
    validateSafePath('evidenceRoot', evidenceRoot, { mustExist: true })
  }
  const ledgerRoot = resolveFromRepo(
    input.ledgerRoot,
    '.codex-temp/delivery-review-loop-v07/history-ledger',
  )
  if (ledgerRoot && fs.existsSync(ledgerRoot)) {
    validateSafePath('ledgerRoot', ledgerRoot, { mustExist: true })
  }
  const correctedEvidenceDir = input.correctedEvidenceDir
    ? validateSafePath('correctedEvidenceDir', resolveFromRepo(input.correctedEvidenceDir), {
        mustExist: mode === 'review-correction' || mode === 'full-supervised',
      })
    : ''

  return {
    mode,
    caseName: input.caseName || '',
    outputDir,
    roundtripRoot,
    taskRoot,
    evidenceRoot,
    ledgerRoot,
    correctedEvidenceDir,
    projectName: input.projectName || input.caseName || '',
  }
}

function summarizeCandidate(candidate) {
  return {
    id: candidate.id,
    caseName: candidate.caseName,
    roundtripStatus: candidate.roundtripStatus,
    reviewStatus: candidate.reviewStatus,
    taskStatus: candidate.taskStatus,
    severity: candidate.severity,
    categories: candidate.categories || [],
    issueCount: candidate.issueCount || 0,
    evidenceDir: candidate.evidenceDir || '',
    taskPath: candidate.taskPath || '',
    promptPath: candidate.promptPath || '',
    needsAction:
      candidate.roundtripStatus === 'awaiting_manual_correction' ||
      candidate.roundtripStatus === 'needs_more_revision' ||
      candidate.reviewStatus === 'needs_revision',
  }
}

function getCandidates(paths) {
  return discoverCorrectionCandidates({
    roundtripRoot: paths.roundtripRoot,
    taskRoot: paths.taskRoot,
    evidenceRoot: paths.evidenceRoot,
  })
}

function selectCandidate(paths, candidates) {
  return selectCorrectionCandidate(candidates, {
    caseName: paths.caseName,
  })
}

function workflowStatusFromRoundtrip(roundtrip) {
  if (!roundtrip) {
    return 'missing_artifacts'
  }
  if (roundtrip.roundtripStatus === 'completed_pass') {
    return 'completed_pass'
  }
  if (roundtrip.roundtripStatus === 'needs_more_revision') {
    return 'needs_more_revision'
  }
  if (roundtrip.roundtripStatus === 'blocked_requires_human') {
    return 'blocked_requires_human'
  }
  if (roundtrip.roundtripStatus === 'no_action_needed') {
    return 'no_action_needed'
  }
  if (roundtrip.roundtripStatus === 'awaiting_manual_correction') {
    return 'awaiting_manual_correction'
  }
  return 'missing_artifacts'
}

function deriveSupervisedWorkflowNextAction(result) {
  if (result.workflowStatus === 'candidates_found') {
    return result.candidates?.some((candidate) => candidate.needsAction)
      ? 'prepare_handoff'
      : 'no_action_needed'
  }
  if (result.workflowStatus === 'handoff_ready' || result.workflowStatus === 'awaiting_manual_correction') {
    return 'run_manual_correction'
  }
  if (result.workflowStatus === 'completed_pass') {
    return 'archive_success_evidence'
  }
  if (result.workflowStatus === 'needs_more_revision') {
    return 'prepare_next_handoff'
  }
  if (result.workflowStatus === 'blocked_requires_human') {
    return 'review_blocked_case'
  }
  if (result.workflowStatus === 'no_action_needed') {
    return 'no_action_needed'
  }
  return 'inspect_missing_artifacts'
}

function buildCommands({ paths, handoff }) {
  const correctionInstruction =
    handoff?.handoffStatus === 'ready'
      ? `Use handoff prompt at ${path.join(paths.outputDir, 'handoff', 'codex-correction-handoff-prompt.md')}`
      : ''
  const reReviewCommand =
    handoff?.roundtripCommand ||
    [
      'node scripts/generated-domain-delivery-roundtrip-runner.mjs',
      `  --initial-evidence "${handoff?.sourceEvidenceDir || ''}"`,
      `  --corrected-evidence "${paths.correctedEvidenceDir || handoff?.correctedEvidenceDir || ''}"`,
      `  --output "${path.join(paths.outputDir, 'roundtrip')}"`,
      `  --project-name "${paths.projectName || paths.caseName || ''}"`,
    ].join(' \\\n')
  const ledgerCommand = [
    'node scripts/generated-domain-delivery-history-ledger.mjs',
    `  --root "${paths.outputDir}"`,
    `  --output "${path.join(paths.outputDir, 'ledger')}"`,
    '  --summary',
  ].join(' \\\n')
  return {
    correctionInstruction,
    reReviewCommand,
    ledgerCommand,
  }
}

function prepareSupervisedCorrectionWorkflow(input = {}) {
  const paths = validateSupervisedWorkflowPaths(input)
  const candidates = getCandidates(paths)
  const result = {
    workflowStatus: 'candidates_found',
    caseName: paths.caseName,
    candidates: candidates.map(summarizeCandidate),
    selectedCandidate: null,
    handoff: null,
    roundtrip: null,
    ledger: null,
    nextAction: '',
    commands: buildCommands({ paths }),
    artifacts: [],
    summary: '',
    metadata: {
      generatedAt: new Date().toISOString(),
      mode: paths.mode,
      outputDir: paths.outputDir,
      roundtripRoot: paths.roundtripRoot,
      taskRoot: paths.taskRoot,
      evidenceRoot: paths.evidenceRoot,
    },
  }

  if (paths.mode === 'list') {
    result.nextAction = deriveSupervisedWorkflowNextAction(result)
    result.summary = buildSupervisedCorrectionWorkflowSummary(result)
    return result
  }

  const selectedCandidate = selectCandidate(paths, candidates)
  result.caseName = selectedCandidate.caseName
  result.selectedCandidate = summarizeCandidate(selectedCandidate)

  if (
    selectedCandidate.roundtripStatus === 'no_action_needed' ||
    selectedCandidate.taskStatus === 'no_action_needed'
  ) {
    result.workflowStatus = 'no_action_needed'
    result.nextAction = deriveSupervisedWorkflowNextAction(result)
    result.summary = buildSupervisedCorrectionWorkflowSummary(result)
    return result
  }
  if (
    selectedCandidate.roundtripStatus === 'blocked_requires_human' ||
    selectedCandidate.taskStatus === 'blocked_requires_human'
  ) {
    result.workflowStatus = 'blocked_requires_human'
    result.nextAction = deriveSupervisedWorkflowNextAction(result)
    result.summary = buildSupervisedCorrectionWorkflowSummary(result)
    return result
  }

  const handoffOutputDir = path.join(paths.outputDir, 'handoff')
  const handoff = buildCodexCorrectionHandoff(selectedCandidate, {
    outputDir: handoffOutputDir,
    correctedEvidenceDir: paths.correctedEvidenceDir || path.join(paths.outputDir, 'corrected-evidence'),
    caseName: selectedCandidate.caseName,
  })
  const validation = validateCorrectionHandoff(handoff)
  if (!validation.valid) {
    result.workflowStatus = 'missing_artifacts'
    result.handoff = {
      ...handoff,
      validationIssues: validation.issues,
    }
    result.nextAction = deriveSupervisedWorkflowNextAction(result)
    result.summary = buildSupervisedCorrectionWorkflowSummary(result)
    return result
  }

  result.workflowStatus = handoff.handoffStatus === 'ready' ? 'handoff_ready' : handoff.handoffStatus
  result.handoff = handoff
  result.commands = buildCommands({ paths, handoff })
  result.nextAction = deriveSupervisedWorkflowNextAction(result)
  result.summary = buildSupervisedCorrectionWorkflowSummary(result)
  return result
}

function buildLedgerFromRoundtrip({ paths, roundtripResult, roundtripArtifacts, handoff }) {
  const entry = buildDeliveryHistoryEntry({
    caseName: paths.caseName || paths.projectName,
    sourceEvidenceDir: roundtripResult.metadata?.initialEvidenceDir,
    correctedEvidenceDir: roundtripResult.metadata?.correctedEvidenceDir,
    taskPath: roundtripArtifacts?.generatedArtifacts?.find((artifact) =>
      artifact.endsWith(path.join('correction-task', 'codex-correction-task.json')),
    ),
    handoffPath: handoff ? path.join(paths.outputDir, 'handoff', 'codex-correction-handoff.json') : '',
    roundtripReportPath: roundtripArtifacts?.reportPath,
    roundtripSummaryPath: roundtripArtifacts?.summaryPath,
    roundtripReport: {
      ...roundtripResult,
      initialReviewOutput: undefined,
      followupReviewOutput: undefined,
    },
    handoff,
  })
  return buildDeliveryHistoryLedger([entry], {
    title: 'Delivery Review Supervised Workflow Ledger',
  })
}

function reviewCorrection(paths, prepared = null) {
  const candidates = getCandidates(paths)
  const selectedCandidate = prepared?.selectedCandidate
    ? candidates.find((candidate) => candidate.caseName === prepared.selectedCandidate.caseName) ||
      selectCandidate(paths, candidates)
    : selectCandidate(paths, candidates)
  const handoff =
    prepared?.handoff ||
    buildCodexCorrectionHandoff(selectedCandidate, {
      outputDir: path.join(paths.outputDir, 'handoff'),
      correctedEvidenceDir: paths.correctedEvidenceDir,
      caseName: selectedCandidate.caseName,
    })
  const roundtrip = runDeliveryReviewRoundtrip({
    initialEvidenceDir: selectedCandidate.evidenceDir,
    correctedEvidenceDir: paths.correctedEvidenceDir,
    projectName: paths.projectName || selectedCandidate.caseName,
    mode: 'manual-roundtrip',
  })
  const roundtripArtifacts = writeDeliveryRoundtripReport(path.join(paths.outputDir, 'roundtrip'), roundtrip)
  const ledger = buildLedgerFromRoundtrip({
    paths: {
      ...paths,
      caseName: selectedCandidate.caseName,
    },
    roundtripResult: roundtrip,
    roundtripArtifacts,
    handoff,
  })
  const ledgerArtifacts = writeDeliveryHistoryLedger(path.join(paths.outputDir, 'ledger'), ledger)

  return {
    selectedCandidate,
    handoff,
    roundtrip,
    roundtripArtifacts,
    ledger,
    ledgerArtifacts,
  }
}

function runSupervisedCorrectionWorkflow(input = {}) {
  const paths = validateSupervisedWorkflowPaths(input)
  const result = prepareSupervisedCorrectionWorkflow({
    ...input,
    mode: paths.mode,
    outputDir: paths.outputDir,
    roundtripRoot: paths.roundtripRoot,
    taskRoot: paths.taskRoot,
    evidenceRoot: paths.evidenceRoot,
    ledgerRoot: paths.ledgerRoot,
    correctedEvidenceDir: paths.correctedEvidenceDir,
  })

  if (paths.mode === 'prepare-handoff' || (paths.mode === 'full-supervised' && !paths.correctedEvidenceDir)) {
    if (result.handoff) {
      const writtenHandoff = writeCodexCorrectionHandoff(path.join(paths.outputDir, 'handoff'), result.handoff)
      result.artifacts.push(
        writtenHandoff.handoffPath,
        writtenHandoff.promptPath,
        writtenHandoff.commandPath,
        writtenHandoff.readmePath,
      )
    }
    result.workflowStatus =
      result.workflowStatus === 'handoff_ready' ? 'awaiting_manual_correction' : result.workflowStatus
    result.nextAction = deriveSupervisedWorkflowNextAction(result)
    result.summary = buildSupervisedCorrectionWorkflowSummary(result)
    return result
  }

  if (paths.mode === 'review-correction' || (paths.mode === 'full-supervised' && paths.correctedEvidenceDir)) {
    if (!paths.correctedEvidenceDir) {
      throw new Error('correctedEvidenceDir is required for review-correction')
    }
    const review = reviewCorrection(paths, result)
    result.selectedCandidate = summarizeCandidate(review.selectedCandidate)
    result.handoff = review.handoff
    result.roundtrip = {
      roundtripStatus: review.roundtrip.roundtripStatus,
      initialReviewStatus: review.roundtrip.initialReviewStatus,
      correctionTaskStatus: review.roundtrip.correctionTaskStatus,
      followupReviewStatus: review.roundtrip.followupReviewStatus,
      remainingIssues: review.roundtrip.remainingIssues || [],
      resolvedIssues: review.roundtrip.resolvedIssues || [],
      progressSummary: review.roundtrip.progressSummary || '',
    }
    result.ledger = review.ledger
    result.workflowStatus = workflowStatusFromRoundtrip(review.roundtrip)
    result.artifacts.push(
      review.roundtripArtifacts.reportPath,
      review.roundtripArtifacts.summaryPath,
      review.ledgerArtifacts.ledgerPath,
      review.ledgerArtifacts.summaryPath,
    )
    result.commands = buildCommands({ paths, handoff: review.handoff })
    result.nextAction = deriveSupervisedWorkflowNextAction(result)
    result.summary = buildSupervisedCorrectionWorkflowSummary(result)
    return result
  }

  result.nextAction = deriveSupervisedWorkflowNextAction(result)
  result.summary = buildSupervisedCorrectionWorkflowSummary(result)
  return result
}

function buildSupervisedCorrectionWorkflowSummary(result) {
  const lines = [
    `Workflow status: ${result.workflowStatus}`,
    `Case: ${result.caseName || result.selectedCandidate?.caseName || '(none)'}`,
    `Next action: ${result.nextAction || deriveSupervisedWorkflowNextAction(result)}`,
  ]
  if (result.selectedCandidate) {
    lines.push(
      `Selected candidate: ${result.selectedCandidate.caseName} (${result.selectedCandidate.roundtripStatus})`,
    )
  }
  if (result.roundtrip) {
    lines.push(
      `Roundtrip: ${result.roundtrip.roundtripStatus} / followup ${result.roundtrip.followupReviewStatus || '(none)'}`,
    )
  }
  if (result.ledger) {
    lines.push(`Ledger cases: ${result.ledger.totalCases}`)
  }
  return lines.join('\n')
}

function renderSupervisedWorkflowMarkdown(result) {
  const lines = [
    '# Supervised Delivery Correction Workflow',
    '',
    `Generated at: ${result.metadata?.generatedAt || new Date().toISOString()}`,
    `Status: ${result.workflowStatus}`,
    `Case: ${result.caseName || result.selectedCandidate?.caseName || '(none)'}`,
    `Next action: ${result.nextAction}`,
    '',
    '## Summary',
    '',
    result.summary || '(no summary)',
    '',
    '## Commands',
    '',
    'Correction instruction:',
    result.commands?.correctionInstruction || '(none)',
    '',
    'Re-review command:',
    '```bash',
    result.commands?.reReviewCommand || '',
    '```',
    '',
    'Ledger command:',
    '```bash',
    result.commands?.ledgerCommand || '',
    '```',
    '',
    '## Artifacts',
    '',
  ]
  if (result.artifacts?.length) {
    for (const artifact of result.artifacts) {
      lines.push(`- ${artifact}`)
    }
  } else {
    lines.push('- None')
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

function writeSupervisedCorrectionWorkflowReport(outputDir, result) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'supervised-workflow-report.json')
  const summaryPath = path.join(outputDir, 'supervised-workflow-summary.md')
  writeTextFile(reportPath, `${JSON.stringify(result, null, 2)}\n`)
  writeTextFile(summaryPath, renderSupervisedWorkflowMarkdown(result))
  return {
    reportPath,
    summaryPath,
  }
}

module.exports = {
  prepareSupervisedCorrectionWorkflow,
  runSupervisedCorrectionWorkflow,
  writeSupervisedCorrectionWorkflowReport,
  buildSupervisedCorrectionWorkflowSummary,
  validateSupervisedWorkflowPaths,
  deriveSupervisedWorkflowNextAction,
}
