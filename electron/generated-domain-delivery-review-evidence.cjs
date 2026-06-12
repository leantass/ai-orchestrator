const fs = require('node:fs')
const path = require('node:path')

const { reviewGeneratedDomainDelivery, normalizeText } = require(
  './generated-domain-delivery-review.cjs',
)

const DEFAULT_FORBIDDEN_DOMAIN_TERMS = [
  'taller de bicicletas',
  'bicicletas',
  'mecanicos',
  'repuestos',
  'vivero comunitario',
  'plantas',
  'operaciones portuarias',
  'operacion portuaria',
  'ecommerce local',
  'tracking logistico',
  'banco comunitario de herramientas',
  'repo publico',
]

const DEFAULT_FORBIDDEN_ARTIFACTS = [
  '.env',
  'node_modules',
  'Dockerfile',
  'docker-compose',
  'deploy',
  'servicios externos reales',
  'webhooks reales',
  'pagos reales',
  'credenciales reales',
  'DB productiva',
  'web-prueba',
]

const SANDBOX_DOMAIN_LABELS = new Set([
  'zona de prueba segura',
  'zona de prueba',
  'sandbox',
  'sandbox local',
  'backend mock',
  'base local',
  'mvp local',
  'app local',
  'primera version local',
  'confirmacion humana',
  'planificacion segura',
  'fullstack local',
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

function normalizeSlashPath(value) {
  return String(value || '').replace(/\\/g, '/').trim()
}

function isSandboxConstraintLabel(value) {
  const normalized = normalizeText(value).trim()
  if (!normalized) {
    return true
  }
  if (SANDBOX_DOMAIN_LABELS.has(normalized)) {
    return true
  }
  return /^(?:sin|no)\s+(?:deploy|docker|credenciales|servicios externos|pagos reales|db productiva|webhooks|tocar web-prueba)\b/u.test(
    normalized,
  )
}

function sanitizeDomainCandidate(value) {
  const candidate = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[.;:,]+$/g, '')
    .trim()

  if (!candidate || isSandboxConstraintLabel(candidate)) {
    return ''
  }

  return candidate
}

function extractDomainFromRequestText(requestText) {
  const text = String(requestText || '').replace(/\r/g, '')
  const patterns = [
    /\b(?:app|aplicacion|sistema|plataforma|herramienta)\s+local\s+para\s+(?:gestionar|administrar|coordinar|organizar)\s+(.+?)(?=(?:\.\s|\n|,?\s+con\s+|\s+todo\s+en\s+|\s+no\s+quiero\s+|\s+primero\s+quiero\s+|$))/iu,
    /\b(?:app|aplicacion|sistema|plataforma|herramienta)\s+para\s+(?:gestionar|administrar|coordinar|organizar)\s+(.+?)(?=(?:\.\s|\n|,?\s+con\s+|\s+todo\s+en\s+|\s+no\s+quiero\s+|\s+primero\s+quiero\s+|$))/iu,
    /\bproyecto\s+(?:sobre|para)\s+(.+?)(?=(?:\.\s|\n|,?\s+con\s+|\s+todo\s+en\s+|$))/iu,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    const candidate = sanitizeDomainCandidate(match?.[1])
    if (candidate) {
      return candidate
    }
  }

  return ''
}

function collectRequestText(request) {
  if (typeof request === 'string') {
    return request
  }
  if (!request || typeof request !== 'object') {
    return ''
  }
  return [request.objective, request.context, request.prompt, request.requestText]
    .filter(Boolean)
    .join('\n\n')
}

function collectConstraints(request) {
  const constraints = []
  if (Array.isArray(request?.expectedConfiguration)) {
    constraints.push(...request.expectedConfiguration)
  }
  const requestText = collectRequestText(request)
  const normalized = normalizeText(requestText)
  for (const term of [
    'sin deploy',
    'sin servicios externos',
    'sin credenciales reales',
    'sin docker',
    'sin pagos reales',
    'sin webhooks',
    'no tocar web-prueba',
    'zona de prueba segura',
  ]) {
    if (normalized.includes(normalizeText(term))) {
      constraints.push(term)
    }
  }
  return [...new Set(constraints.filter(Boolean))]
}

function getNestedValue(source, pathParts) {
  let current = source
  for (const part of pathParts) {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    current = current[part]
  }
  return current
}

function inferExpectedDomain({ requestText, summary, validationSummary, decisionsAndApprovals }) {
  const candidates = [
    getNestedValue(validationSummary, ['domain', 'expectedDomain']),
    summary?.planningDomain,
    summary?.executionDomain,
    getNestedValue(decisionsAndApprovals, ['planningDecision', 'domainUnderstanding', 'domainLabel']),
    getNestedValue(decisionsAndApprovals, ['executionDecision', 'domainUnderstanding', 'domainLabel']),
    extractDomainFromRequestText(requestText),
    getNestedValue(decisionsAndApprovals, ['planningDecision', 'domainUnderstanding', 'intentLabel']),
  ]

  for (const candidate of candidates) {
    const sanitized = sanitizeDomainCandidate(candidate)
    if (sanitized) {
      return sanitized
    }
  }

  return ''
}

function inferExpectedConcepts({ validationSummary, decisionsAndApprovals, requestText }) {
  const concepts = []
  if (Array.isArray(validationSummary?.domain?.requiredTerms)) {
    concepts.push(...validationSummary.domain.requiredTerms)
  } else if (validationSummary?.domain && typeof validationSummary.domain === 'object') {
    for (const [term, present] of Object.entries(validationSummary.domain)) {
      if (present === true) {
        concepts.push(term)
      }
    }
  }
  const primaryModules = getNestedValue(decisionsAndApprovals, [
    'planningDecision',
    'domainUnderstanding',
    'primaryModules',
  ])
  if (!concepts.length && Array.isArray(primaryModules)) {
    concepts.push(...primaryModules)
  }

  const normalized = normalizeText(requestText)
  for (const concept of [
    'panel publico',
    'panel operativo',
    'panel administrativo',
    'backend mock',
    'base local',
    'reportes simples',
  ]) {
    if (normalized.includes(normalizeText(concept))) {
      concepts.push(concept)
    }
  }

  return [...new Set(concepts.map((concept) => String(concept || '').trim()).filter(Boolean))]
}

function normalizeValidationSummaryForReview(validationSummary) {
  if (!validationSummary || typeof validationSummary !== 'object') {
    return validationSummary
  }

  const normalized = { ...validationSummary }

  if (
    validationSummary.domain &&
    typeof validationSummary.domain === 'object' &&
    !Array.isArray(validationSummary.domain) &&
    !Array.isArray(validationSummary.domain.requiredTerms)
  ) {
    const requiredTerms = Object.entries(validationSummary.domain)
      .filter(([, present]) => present === true)
      .map(([term]) => term)
    normalized.domain = {
      passed: requiredTerms.length > 0,
      requiredTerms,
      missingRequiredTerms: Object.entries(validationSummary.domain)
        .filter(([, present]) => present === false)
        .map(([term]) => term),
    }
  }

  if (
    validationSummary.contamination &&
    typeof validationSummary.contamination === 'object' &&
    !Array.isArray(validationSummary.contamination)
  ) {
    const contaminatedTerms = Object.entries(validationSummary.contamination)
      .filter(([, present]) => present === true)
      .map(([term]) => term)
    normalized.noContamination = {
      passed: contaminatedTerms.length === 0,
      contaminatedTerms,
    }
    delete normalized.contamination
  }

  return normalized
}

function resolveProjectRoot(evidenceDir, generatedFiles, summary, validationSummary) {
  const candidates = [
    generatedFiles?.projectRoot,
    summary?.projectRoot,
    validationSummary?.sandbox?.projectRoot,
    validationSummary?.sandbox?.sandboxRoot?.resolved,
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(evidenceDir, candidate)
    if (fs.existsSync(resolved)) {
      return resolved
    }
    return resolved
  }

  return ''
}

function loadGeneratedFiles({ evidenceDir, generatedFiles, projectRoot }) {
  const files = Array.isArray(generatedFiles?.files) ? generatedFiles.files : []
  return files.map((file) => {
    const relativePath =
      typeof file === 'string' ? file : file.relativePath || file.path || file.filePath || ''
    const loaded = typeof file === 'string' ? { relativePath } : { ...file, relativePath }
    const candidatePaths = []

    if (projectRoot && relativePath && !path.isAbsolute(relativePath)) {
      candidatePaths.push(path.join(projectRoot, relativePath))
    }
    if (relativePath) {
      candidatePaths.push(path.resolve(evidenceDir, relativePath))
    }

    for (const [index, candidatePath] of candidatePaths.entries()) {
      const content = readTextFileIfExists(candidatePath)
      if (content) {
        loaded.content = content
        if (index === 0 && projectRoot) {
          loaded.absolutePath = candidatePath
        } else {
          loaded.evidencePath = candidatePath
        }
        break
      }
    }

    return loaded
  })
}

function loadValidationReport(evidenceDir, projectRoot, validationSummary) {
  const candidatePaths = [
    path.join(evidenceDir, 'validation', 'report.json'),
    validationSummary?.sandbox?.reportPath,
    projectRoot ? path.join(projectRoot, 'validation', 'report.json') : '',
  ].filter(Boolean)

  for (const candidatePath of candidatePaths) {
    const report = readJsonFileIfExists(candidatePath)
    if (report) {
      return report
    }
  }

  return null
}

function loadGeneratedDomainEvidence(evidenceDir) {
  if (!evidenceDir || !fs.existsSync(evidenceDir) || !fs.statSync(evidenceDir).isDirectory()) {
    throw new Error(`Evidence directory not found: ${evidenceDir}`)
  }

  const resolvedEvidenceDir = path.resolve(evidenceDir)
  const request = readJsonFileIfExists(path.join(resolvedEvidenceDir, 'request.json'))
  const decisionsAndApprovals = readJsonFileIfExists(
    path.join(resolvedEvidenceDir, 'decisions-and-approvals.json'),
  )
  const generatedFiles = readJsonFileIfExists(path.join(resolvedEvidenceDir, 'generated-files.json'))
  const summary = readJsonFileIfExists(path.join(resolvedEvidenceDir, 'summary.json'))
  const validationSummary = readJsonFileIfExists(
    path.join(resolvedEvidenceDir, 'validation-summary.json'),
  )
  const normalizedValidationSummary = normalizeValidationSummaryForReview(validationSummary)
  const heartbeat = readTextFileIfExists(path.join(resolvedEvidenceDir, 'heartbeat.log'))
  const projectRoot = resolveProjectRoot(
    resolvedEvidenceDir,
    generatedFiles,
    summary,
    normalizedValidationSummary,
  )
  const loadedGeneratedFiles = loadGeneratedFiles({
    evidenceDir: resolvedEvidenceDir,
    generatedFiles,
    projectRoot,
  })
  const validationReport = loadValidationReport(
    resolvedEvidenceDir,
    projectRoot,
    normalizedValidationSummary,
  )

  return {
    evidenceDir: resolvedEvidenceDir,
    request,
    decisionsAndApprovals,
    generatedFiles,
    loadedGeneratedFiles,
    summary,
    validationSummary: normalizedValidationSummary,
    validationReport,
    heartbeat,
    projectRoot,
  }
}

function buildDeliveryReviewInputFromEvidence(evidence, options = {}) {
  const requestText = collectRequestText(evidence.request)
  const expectedDomain =
    options.expectedDomain ||
    inferExpectedDomain({
      requestText,
      summary: evidence.summary,
      validationSummary: evidence.validationSummary,
      decisionsAndApprovals: evidence.decisionsAndApprovals,
    })
  const expectedConcepts =
    options.expectedConcepts ||
    inferExpectedConcepts({
      validationSummary: evidence.validationSummary,
      decisionsAndApprovals: evidence.decisionsAndApprovals,
      requestText,
    })
  const expectedDomainText = normalizeText(expectedDomain)
  const expectedConceptsText = expectedConcepts.map((concept) => normalizeText(concept)).join('\n')
  const forbiddenDomainTerms = (options.forbiddenDomainTerms || DEFAULT_FORBIDDEN_DOMAIN_TERMS).filter(
    (term) => {
      const normalized = normalizeText(term)
      return (
        normalized &&
        !expectedDomainText.includes(normalized) &&
        !expectedConceptsText.includes(normalized)
      )
    },
  )

  return {
    requestText,
    expectedDomain,
    expectedConcepts,
    forbiddenDomainTerms,
    forbiddenArtifacts: options.forbiddenArtifacts || DEFAULT_FORBIDDEN_ARTIFACTS,
    generatedFiles: evidence.loadedGeneratedFiles || [],
    validationReport: evidence.validationReport,
    validationSummary: evidence.validationSummary,
    summary: evidence.summary,
    constraints: collectConstraints(evidence.request),
    sandboxPath:
      evidence.projectRoot ||
      evidence.summary?.projectRoot ||
      evidence.validationSummary?.sandbox?.projectRoot ||
      '',
    approvalStatus:
      evidence.summary?.approvalStatus ||
      evidence.validationSummary?.approvals?.approvalStatus ||
      '',
    approvals: evidence.validationSummary?.approvals || {},
  }
}

function reviewGeneratedDomainEvidence(evidenceDir, options = {}) {
  const evidence = loadGeneratedDomainEvidence(evidenceDir)
  const input = buildDeliveryReviewInputFromEvidence(evidence, options)
  const review = reviewGeneratedDomainDelivery(input)
  return {
    evidenceDir: evidence.evidenceDir,
    input,
    review,
  }
}

function writeDeliveryReviewReport(outputDir, reviewOutput) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const report = {
    evidenceDir: reviewOutput.evidenceDir,
    reviewedAt: new Date().toISOString(),
    status: reviewOutput.review.status,
    scores: reviewOutput.review.score,
    issues: reviewOutput.review.issues,
    missingConcepts: reviewOutput.review.missingConcepts,
    contaminationFound: reviewOutput.review.contaminationFound,
    restrictionViolations: reviewOutput.review.restrictionViolations,
    sandboxViolations: reviewOutput.review.sandboxViolations,
    reviewerSummary: reviewOutput.review.reviewerSummary,
    correctionBrief: reviewOutput.review.correctionBrief,
  }
  const reportPath = path.join(outputDir, 'delivery-review-report.json')
  const briefPath = path.join(outputDir, 'correction-brief.md')

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  fs.writeFileSync(briefPath, `${reviewOutput.review.correctionBrief}\n`, 'utf8')

  return {
    reportPath,
    briefPath,
    report,
  }
}

module.exports = {
  loadGeneratedDomainEvidence,
  buildDeliveryReviewInputFromEvidence,
  reviewGeneratedDomainEvidence,
  writeDeliveryReviewReport,
  extractDomainFromRequestText,
  inferExpectedDomain,
}
