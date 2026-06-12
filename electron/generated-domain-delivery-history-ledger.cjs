const fs = require('node:fs')
const path = require('node:path')

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

function firstExistingPath(paths) {
  return paths.find((filePath) => filePath && fs.existsSync(filePath)) || ''
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

function listCaseDirectories(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
    return []
  }
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name))
    .sort()
}

function normalizeRootDirs(rootDirs) {
  if (Array.isArray(rootDirs)) {
    return rootDirs.filter(Boolean)
  }
  if (typeof rootDirs === 'string') {
    return rootDirs
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function loadDeliveryRoundtripArtifacts(caseDir, options = {}) {
  const caseName = options.caseName || path.basename(caseDir || '')
  const roundtripReportPath = firstExistingPath([
    path.join(caseDir, 'roundtrip-review', 'delivery-roundtrip-report.json'),
    path.join(caseDir, 'delivery-roundtrip-report.json'),
  ])
  const roundtripSummaryPath = firstExistingPath([
    path.join(caseDir, 'roundtrip-review', 'roundtrip-summary.md'),
    path.join(caseDir, 'roundtrip-summary.md'),
  ])
  const reviewReportPath = firstExistingPath([
    path.join(caseDir, 'roundtrip-review', 'initial-review', 'delivery-review-report.json'),
    path.join(caseDir, 'initial-review', 'delivery-review-report.json'),
    path.join(caseDir, 'delivery-review-report.json'),
  ])
  const taskPath = firstExistingPath([
    path.join(caseDir, 'roundtrip-review', 'correction-task', 'codex-correction-task.json'),
    path.join(caseDir, 'correction-task', 'codex-correction-task.json'),
    path.join(caseDir, 'codex-correction-task.json'),
  ])
  const handoffPath = firstExistingPath([
    path.join(caseDir, 'codex-correction-handoff.json'),
    path.join(caseDir, 'handoff', 'codex-correction-handoff.json'),
  ])
  const roundtripReport = readJsonFileIfExists(roundtripReportPath)
  const reviewReport = readJsonFileIfExists(reviewReportPath)
  const task = readJsonFileIfExists(taskPath)
  const handoff = readJsonFileIfExists(handoffPath)

  return {
    caseName,
    caseDir,
    sourceEvidenceDir:
      handoff?.sourceEvidenceDir ||
      roundtripReport?.metadata?.initialEvidenceDir ||
      task?.evidenceDir ||
      reviewReport?.evidenceDir ||
      '',
    correctedEvidenceDir:
      handoff?.correctedEvidenceDir ||
      roundtripReport?.metadata?.correctedEvidenceDir ||
      '',
    reviewReportPath,
    taskPath,
    handoffPath,
    roundtripReportPath,
    roundtripSummaryPath,
    reviewReport,
    task,
    handoff,
    roundtripReport,
    roundtripSummary: readTextFileIfExists(roundtripSummaryPath),
    metadata: options.metadata || {},
  }
}

function getIssues(source) {
  return Array.isArray(source?.issues) ? source.issues : []
}

function deriveStatus({ roundtripReport, task, handoff }) {
  if (!roundtripReport || roundtripReport.__parseError) {
    return 'missing_artifacts'
  }
  const roundtripStatus = roundtripReport.roundtripStatus || ''
  const initialStatus = roundtripReport.initialReviewStatus || roundtripReport.initialReview?.status || ''
  const followupStatus = roundtripReport.followupReviewStatus || roundtripReport.followupReview?.status || ''
  const taskStatus = roundtripReport.correctionTaskStatus || task?.taskStatus || ''
  const handoffStatus = handoff?.handoffStatus || ''

  if (
    roundtripStatus === 'blocked_requires_human' ||
    initialStatus === 'blocked' ||
    followupStatus === 'blocked' ||
    taskStatus === 'blocked_requires_human' ||
    handoffStatus === 'blocked_requires_human'
  ) {
    return 'blocked_requires_human'
  }
  if (roundtripStatus === 'completed_pass' || (initialStatus === 'needs_revision' && followupStatus === 'pass')) {
    return 'completed_pass'
  }
  if (roundtripStatus === 'no_action_needed' || initialStatus === 'pass') {
    return 'no_action_needed'
  }
  if (roundtripStatus === 'needs_more_revision' || followupStatus === 'needs_revision') {
    return 'needs_more_revision'
  }
  if (
    roundtripStatus === 'awaiting_manual_correction' ||
    (initialStatus === 'needs_revision' && taskStatus === 'ready' && !followupStatus)
  ) {
    return 'awaiting_manual_correction'
  }
  if (initialStatus === 'needs_revision') {
    return 'awaiting_manual_correction'
  }
  return 'missing_artifacts'
}

function deriveNextAction(status, entry) {
  if (status === 'completed_pass') {
    return 'archive_success_evidence'
  }
  if (status === 'no_action_needed') {
    return 'no_action_needed'
  }
  if (status === 'awaiting_manual_correction') {
    return entry.handoffStatus === 'ready' || entry.taskPath ? 'run_manual_correction' : 'generate_handoff'
  }
  if (status === 'needs_more_revision') {
    return entry.followupReviewStatus ? 'run_manual_correction' : 'run_followup_review'
  }
  if (status === 'blocked_requires_human') {
    return 'review_blocked_case'
  }
  return 'inspect_missing_artifacts'
}

function buildIssueKey(issue) {
  return [
    issue?.severity || '',
    issue?.category || '',
    issue?.message || '',
    issue?.evidence || '',
  ].join('|')
}

function deriveResolvedIssues(initialIssues, finalIssues, explicitResolvedIssues) {
  if (Array.isArray(explicitResolvedIssues) && explicitResolvedIssues.length) {
    return explicitResolvedIssues
  }
  const finalKeys = new Set(finalIssues.map(buildIssueKey))
  return initialIssues.filter((issue) => !finalKeys.has(buildIssueKey(issue)))
}

function buildDeliveryHistoryEntry(input = {}) {
  const roundtripReport = input.roundtripReport || readJsonFileIfExists(input.roundtripReportPath)
  const reviewReport = input.reviewReport || readJsonFileIfExists(input.reviewReportPath)
  const task = input.task || readJsonFileIfExists(input.taskPath)
  const handoff = input.handoff || readJsonFileIfExists(input.handoffPath)
  const initialReview = roundtripReport?.initialReview || reviewReport || {}
  const followupReview = roundtripReport?.followupReview || null
  const initialIssues = getIssues(initialReview)
  const finalIssues = followupReview ? getIssues(followupReview) : roundtripReport?.remainingIssues || initialIssues
  const resolvedIssues = deriveResolvedIssues(
    initialIssues,
    finalIssues,
    roundtripReport?.resolvedIssues,
  )
  const remainingIssues = roundtripReport?.remainingIssues || finalIssues
  const restrictionViolations = unique([
    ...(initialReview?.restrictionViolations || []),
    ...(followupReview?.restrictionViolations || []),
  ])
  const sandboxViolations = unique([
    ...(initialReview?.sandboxViolations || []),
    ...(followupReview?.sandboxViolations || []),
  ])
  const status = deriveStatus({ roundtripReport, task, handoff })
  const evidencePaths = unique([
    input.sourceEvidenceDir || handoff?.sourceEvidenceDir || roundtripReport?.metadata?.initialEvidenceDir,
    input.correctedEvidenceDir ||
      handoff?.correctedEvidenceDir ||
      roundtripReport?.metadata?.correctedEvidenceDir,
    input.reviewReportPath,
    input.taskPath,
    input.handoffPath,
    input.roundtripReportPath,
    input.roundtripSummaryPath,
  ])
  const entry = {
    caseName: input.caseName || handoff?.caseName || roundtripReport?.metadata?.projectName || '',
    status,
    initialReviewStatus: roundtripReport?.initialReviewStatus || initialReview?.status || '',
    correctionTaskStatus: roundtripReport?.correctionTaskStatus || task?.taskStatus || '',
    handoffStatus: handoff?.handoffStatus || '',
    followupReviewStatus: roundtripReport?.followupReviewStatus || followupReview?.status || '',
    roundtripStatus: roundtripReport?.roundtripStatus || '',
    issueCountInitial: initialIssues.length,
    issueCountFinal: remainingIssues.length,
    resolvedIssues,
    remainingIssues,
    blockedReasons: status === 'blocked_requires_human' ? remainingIssues : [],
    restrictionViolations,
    sandboxViolations,
    evidencePaths,
    nextAction: '',
    summary: '',
    metadata: {
      generatedAt: new Date().toISOString(),
      source: input.metadata?.source || '',
    },
  }
  entry.nextAction = deriveNextAction(status, entry)
  entry.summary = summarizeEntry(entry)
  return entry
}

function summarizeEntry(entry) {
  if (entry.status === 'completed_pass') {
    return `${entry.caseName} completo: ${entry.resolvedIssues.length} issue(s) resuelto(s), sin pendientes.`
  }
  if (entry.status === 'awaiting_manual_correction') {
    return `${entry.caseName} espera correccion manual: ${entry.issueCountFinal} issue(s) pendiente(s).`
  }
  if (entry.status === 'needs_more_revision') {
    return `${entry.caseName} requiere otra vuelta: ${entry.issueCountFinal} issue(s) pendiente(s).`
  }
  if (entry.status === 'blocked_requires_human') {
    return `${entry.caseName} bloqueado: requiere revision humana.`
  }
  if (entry.status === 'no_action_needed') {
    return `${entry.caseName} no requiere accion.`
  }
  return `${entry.caseName || '(sin caso)'} tiene artefactos incompletos.`
}

function discoverDeliveryHistoryCases(rootDirs, options = {}) {
  const roots = normalizeRootDirs(rootDirs)
  const seen = new Set()
  const artifacts = []
  for (const root of roots) {
    for (const caseDir of listCaseDirectories(root)) {
      const caseName = path.basename(caseDir)
      if (options.caseName && caseName !== options.caseName) {
        continue
      }
      const key = `${caseName}|${caseDir}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      artifacts.push(loadDeliveryRoundtripArtifacts(caseDir, {
        caseName,
        metadata: { sourceRoot: root },
      }))
    }
  }
  return artifacts
}

function buildDeliveryHistoryLedger(entries = [], options = {}) {
  const counts = {
    pass: 0,
    needsRevision: 0,
    awaitingManualCorrection: 0,
    completedPass: 0,
    needsMoreRevision: 0,
    blocked: 0,
    missingArtifacts: 0,
  }
  for (const entry of entries) {
    if (entry.status === 'no_action_needed') {
      counts.pass += 1
    } else if (entry.status === 'awaiting_manual_correction') {
      counts.awaitingManualCorrection += 1
      counts.needsRevision += 1
    } else if (entry.status === 'completed_pass') {
      counts.completedPass += 1
      counts.pass += 1
    } else if (entry.status === 'needs_more_revision') {
      counts.needsMoreRevision += 1
      counts.needsRevision += 1
    } else if (entry.status === 'blocked_requires_human') {
      counts.blocked += 1
    } else if (entry.status === 'missing_artifacts') {
      counts.missingArtifacts += 1
    }
  }
  const ledger = {
    generatedAt: new Date().toISOString(),
    totalCases: entries.length,
    counts,
    entries,
    recommendations: buildRecommendations(entries),
    summary: '',
    metadata: {
      title: options.title || 'Delivery Review History Ledger',
    },
  }
  ledger.summary = summarizeDeliveryHistoryLedger(ledger)
  return ledger
}

function buildRecommendations(entries) {
  const recommendations = []
  if (entries.some((entry) => entry.status === 'awaiting_manual_correction')) {
    recommendations.push('Run manual correction for awaiting cases.')
  }
  if (entries.some((entry) => entry.status === 'needs_more_revision')) {
    recommendations.push('Review remaining issues and run another correction round.')
  }
  if (entries.some((entry) => entry.status === 'blocked_requires_human')) {
    recommendations.push('Inspect blocked cases before any further writes.')
  }
  if (entries.some((entry) => entry.status === 'completed_pass')) {
    recommendations.push('Archive successful corrected evidence.')
  }
  if (entries.some((entry) => entry.status === 'missing_artifacts')) {
    recommendations.push('Inspect missing artifacts and regenerate reports if needed.')
  }
  if (!recommendations.length) {
    recommendations.push('No action needed.')
  }
  return recommendations
}

function summarizeDeliveryHistoryLedger(ledger) {
  return [
    `Total cases: ${ledger.totalCases}`,
    `Completed pass: ${ledger.counts.completedPass}`,
    `Awaiting manual correction: ${ledger.counts.awaitingManualCorrection}`,
    `Needs more revision: ${ledger.counts.needsMoreRevision}`,
    `Blocked: ${ledger.counts.blocked}`,
    `Missing artifacts: ${ledger.counts.missingArtifacts}`,
  ].join('\n')
}

function renderLedgerSummaryMarkdown(ledger) {
  const lines = [
    '# Delivery Review History Ledger',
    '',
    `Generated at: ${ledger.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total cases: ${ledger.totalCases}`,
    `- Completed pass: ${ledger.counts.completedPass}`,
    `- Pass/no action: ${ledger.counts.pass}`,
    `- Awaiting manual correction: ${ledger.counts.awaitingManualCorrection}`,
    `- Needs more revision: ${ledger.counts.needsMoreRevision}`,
    `- Blocked: ${ledger.counts.blocked}`,
    `- Missing artifacts: ${ledger.counts.missingArtifacts}`,
    '',
    '## Recommendations',
    '',
    ...ledger.recommendations.map((recommendation) => `- ${recommendation}`),
    '',
    '## Cases',
    '',
    '| Case | Status | Initial | Followup | Issues initial | Issues final | Next action |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
  ]
  for (const entry of ledger.entries) {
    lines.push(
      `| ${entry.caseName || '(missing)'} | ${entry.status} | ${entry.initialReviewStatus || ''} | ${entry.followupReviewStatus || ''} | ${entry.issueCountInitial} | ${entry.issueCountFinal} | ${entry.nextAction} |`,
    )
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

function writeDeliveryHistoryLedger(outputDir, ledger) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  fs.mkdirSync(outputDir, { recursive: true })
  const ledgerPath = path.join(outputDir, 'delivery-history-ledger.json')
  const summaryPath = path.join(outputDir, 'delivery-history-summary.md')
  writeTextFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`)
  writeTextFile(summaryPath, renderLedgerSummaryMarkdown(ledger))
  return {
    ledgerPath,
    summaryPath,
  }
}

module.exports = {
  buildDeliveryHistoryEntry,
  buildDeliveryHistoryLedger,
  loadDeliveryRoundtripArtifacts,
  discoverDeliveryHistoryCases,
  writeDeliveryHistoryLedger,
  summarizeDeliveryHistoryLedger,
}
