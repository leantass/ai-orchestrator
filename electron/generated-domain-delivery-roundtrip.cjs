const fs = require('node:fs')
const path = require('node:path')

const {
  reviewGeneratedDomainEvidence,
  writeDeliveryReviewReport,
} = require('./generated-domain-delivery-review-evidence.cjs')
const {
  buildCodexCorrectionTask,
  writeCodexCorrectionTask,
} = require('./generated-domain-delivery-codex-task.cjs')

function reviewPayloadFromOutput(reviewOutput) {
  return {
    evidenceDir: reviewOutput.evidenceDir,
    ...reviewOutput.review,
  }
}

function getIssues(review) {
  return Array.isArray(review?.issues) ? review.issues : []
}

function issueKey(issue) {
  return [
    issue?.severity || '',
    issue?.category || '',
    issue?.message || '',
    issue?.evidence || '',
  ].join('|')
}

function evaluateRoundtripProgress(initialReview, correctionTask, followupReview) {
  const initialIssues = getIssues(initialReview)
  const followupIssues = getIssues(followupReview)
  const followupIssueKeys = new Set(followupIssues.map(issueKey))
  const resolvedIssues = initialIssues.filter((issue) => !followupIssueKeys.has(issueKey(issue)))
  const remainingIssues = followupIssues

  if (!followupReview) {
    return {
      progressSummary:
        correctionTask?.taskStatus === 'ready'
          ? 'La tarea de correccion esta lista y queda esperando correccion manual.'
          : 'No hay followup review disponible.',
      resolvedIssues: [],
      remainingIssues: initialIssues,
    }
  }

  if (followupReview.status === 'pass') {
    return {
      progressSummary: 'La evidencia corregida paso el review.',
      resolvedIssues,
      remainingIssues: [],
    }
  }

  if (followupReview.status === 'blocked') {
    return {
      progressSummary: 'La evidencia corregida introdujo o conserva un bloqueo de seguridad.',
      resolvedIssues,
      remainingIssues,
    }
  }

  return {
    progressSummary: 'La evidencia corregida mejoro parcialmente o todavia requiere revision.',
    resolvedIssues,
    remainingIssues,
  }
}

function deriveRoundtripStatus({ initialReview, correctionTask, followupReview }) {
  if (initialReview?.status === 'pass') {
    return 'no_action_needed'
  }

  if (initialReview?.status === 'blocked' || correctionTask?.taskStatus === 'blocked_requires_human') {
    return 'blocked_requires_human'
  }

  if (!followupReview) {
    return correctionTask?.taskStatus === 'ready'
      ? 'awaiting_manual_correction'
      : 'ready_for_followup_review'
  }

  if (followupReview.status === 'pass') {
    return 'completed_pass'
  }

  if (followupReview.status === 'blocked') {
    return 'blocked_requires_human'
  }

  return 'needs_more_revision'
}

function createDeliveryReviewRoundtrip(input = {}) {
  const initialReview = input.initialReview || null
  const correctionTask =
    input.correctionTask ||
    (initialReview
      ? buildCodexCorrectionTask(reviewPayloadFromOutput({
          evidenceDir: input.initialEvidenceDir || '',
          review: initialReview,
        }))
      : null)
  const followupReview = input.followupReview || null
  const progress = evaluateRoundtripProgress(initialReview, correctionTask, followupReview)
  const roundtripStatus = deriveRoundtripStatus({
    initialReview,
    correctionTask,
    followupReview,
  })

  return {
    roundtripStatus,
    initialReviewStatus: initialReview?.status || '',
    correctionTaskStatus: correctionTask?.taskStatus || '',
    followupReviewStatus: followupReview?.status || '',
    initialReview,
    correctionTask,
    followupReview,
    progressSummary: progress.progressSummary,
    remainingIssues: progress.remainingIssues,
    resolvedIssues: progress.resolvedIssues,
    generatedArtifacts: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      mode: input.mode || 'dry-run',
      initialEvidenceDir: input.initialEvidenceDir || '',
      correctedEvidenceDir: input.correctedEvidenceDir || '',
      projectName: input.projectName || '',
    },
  }
}

function buildReviewOptions(options = {}) {
  return {
    expectedDomain: options.expectedDomain,
    expectedConcepts: options.expectedConcepts,
    forbiddenDomainTerms: options.forbiddenDomainTerms,
    forbiddenArtifacts: options.forbiddenArtifacts,
  }
}

function runDeliveryReviewRoundtrip(options = {}) {
  if (!options.initialEvidenceDir) {
    throw new Error('initialEvidenceDir is required')
  }

  const reviewOptions = buildReviewOptions(options)
  const initialReviewOutput = reviewGeneratedDomainEvidence(
    options.initialEvidenceDir,
    reviewOptions,
  )
  const initialReview = initialReviewOutput.review
  const correctionTask = buildCodexCorrectionTask(reviewPayloadFromOutput(initialReviewOutput), {
    title: options.projectName
      ? `Corregir entrega generada para ${options.projectName}`
      : undefined,
    evidenceDir: initialReviewOutput.evidenceDir,
    sandboxPath: options.sandboxPath,
  })

  let followupReviewOutput = null
  let followupReview = null
  if (
    options.correctedEvidenceDir &&
    fs.existsSync(options.correctedEvidenceDir) &&
    fs.statSync(options.correctedEvidenceDir).isDirectory()
  ) {
    followupReviewOutput = reviewGeneratedDomainEvidence(
      options.correctedEvidenceDir,
      reviewOptions,
    )
    followupReview = followupReviewOutput.review
  }

  const result = createDeliveryReviewRoundtrip({
    initialEvidenceDir: initialReviewOutput.evidenceDir,
    correctedEvidenceDir: followupReviewOutput?.evidenceDir || options.correctedEvidenceDir || '',
    projectName: options.projectName,
    mode: options.mode || 'dry-run',
    initialReview,
    correctionTask,
    followupReview,
  })

  result.initialReviewOutput = initialReviewOutput
  result.followupReviewOutput = followupReviewOutput
  return result
}

function renderRoundtripSummary(result) {
  const lines = [
    '# Delivery Review Roundtrip',
    '',
    `Status: ${result.roundtripStatus}`,
    `Mode: ${result.metadata?.mode || ''}`,
    `Initial review: ${result.initialReviewStatus || '(none)'}`,
    `Correction task: ${result.correctionTaskStatus || '(none)'}`,
    `Followup review: ${result.followupReviewStatus || '(none)'}`,
    '',
    'Progress:',
    result.progressSummary || '(no summary)',
    '',
    'Remaining issues:',
  ]

  if (result.remainingIssues?.length) {
    for (const issue of result.remainingIssues) {
      lines.push(`- [${issue.severity}/${issue.category}] ${issue.message}`)
    }
  } else {
    lines.push('- None')
  }

  lines.push('', 'Resolved issues:')
  if (result.resolvedIssues?.length) {
    for (const issue of result.resolvedIssues) {
      lines.push(`- [${issue.severity}/${issue.category}] ${issue.message}`)
    }
  } else {
    lines.push('- None')
  }

  return `${lines.join('\n')}\n`
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeDeliveryRoundtripReport(outputDir, roundtripResult) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const artifacts = []

  if (roundtripResult.initialReviewOutput) {
    const initialReviewArtifacts = writeDeliveryReviewReport(
      path.join(outputDir, 'initial-review'),
      roundtripResult.initialReviewOutput,
    )
    artifacts.push(initialReviewArtifacts.reportPath, initialReviewArtifacts.briefPath)
  }

  if (roundtripResult.correctionTask) {
    const taskArtifacts = writeCodexCorrectionTask(
      path.join(outputDir, 'correction-task'),
      roundtripResult.correctionTask,
    )
    artifacts.push(taskArtifacts.taskPath, taskArtifacts.promptPath)
  }

  if (roundtripResult.followupReviewOutput) {
    const followupReviewArtifacts = writeDeliveryReviewReport(
      path.join(outputDir, 'followup-review'),
      roundtripResult.followupReviewOutput,
    )
    artifacts.push(followupReviewArtifacts.reportPath, followupReviewArtifacts.briefPath)
  }

  const reportPath = path.join(outputDir, 'delivery-roundtrip-report.json')
  const summaryPath = path.join(outputDir, 'roundtrip-summary.md')
  const serializable = {
    ...roundtripResult,
    generatedArtifacts: artifacts,
    initialReviewOutput: undefined,
    followupReviewOutput: undefined,
  }
  writeJson(reportPath, serializable)
  fs.writeFileSync(summaryPath, renderRoundtripSummary(roundtripResult), 'utf8')
  artifacts.push(reportPath, summaryPath)

  return {
    reportPath,
    summaryPath,
    generatedArtifacts: artifacts,
  }
}

function loadRoundtripInputFromEvidence(initialEvidenceDir, options = {}) {
  return {
    initialEvidenceDir,
    correctedEvidenceDir: options.correctedEvidenceDir || '',
    outputDir: options.outputDir || '',
    projectName: options.projectName || '',
    expectedDomain: options.expectedDomain,
    expectedConcepts: options.expectedConcepts,
    forbiddenDomainTerms: options.forbiddenDomainTerms,
    mode: options.mode || 'dry-run',
  }
}

module.exports = {
  createDeliveryReviewRoundtrip,
  runDeliveryReviewRoundtrip,
  writeDeliveryRoundtripReport,
  loadRoundtripInputFromEvidence,
  evaluateRoundtripProgress,
  deriveRoundtripStatus,
}
