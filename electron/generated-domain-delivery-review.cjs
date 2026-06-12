const path = require('node:path')

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

const DEFAULT_MINIMUM_DELIVERY_CONCEPTS = [
  'README',
  'frontend',
  'panel',
  'backend mock',
  'base local',
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizePathText(value) {
  return String(value || '').replace(/\\/g, '/').trim()
}

function unique(values) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const normalized = normalizeText(value).trim()
    if (!normalized || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(String(value).trim())
  }
  return result
}

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getGeneratedFilePath(file) {
  if (typeof file === 'string') {
    return file
  }
  if (file && typeof file === 'object') {
    return (
      file.relativePath ||
      file.path ||
      file.filePath ||
      file.targetPath ||
      file.absolutePath ||
      ''
    )
  }
  return ''
}

function getGeneratedFileContent(file) {
  if (file && typeof file === 'object') {
    return file.content || file.text || file.body || ''
  }
  return ''
}

function collectEvidenceText(input) {
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const parts = [
    input.requestText,
    input.expectedDomain,
    input.summary,
    input.validationReport,
    input.constraints,
    input.sandboxPath,
    input.approvalStatus,
  ]

  for (const file of generatedFiles) {
    parts.push(getGeneratedFilePath(file), getGeneratedFileContent(file))
  }

  return normalizeText(
    parts
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }
        if (part && typeof part === 'object') {
          return JSON.stringify(part)
        }
        return ''
      })
      .join('\n'),
  )
}

function collectDeliveryText(input) {
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const parts = [
    input.summary,
    input.validationReport,
    input.validationSummary,
    input.sandboxPath,
    input.approvalStatus,
  ]

  for (const file of generatedFiles) {
    parts.push(getGeneratedFilePath(file), getGeneratedFileContent(file))
  }

  return normalizeText(
    parts
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }
        if (part && typeof part === 'object') {
          return JSON.stringify(part)
        }
        return ''
      })
      .join('\n'),
  )
}

function findMissingTerms(evidenceText, expectedConcepts) {
  return unique(expectedConcepts || []).filter((concept) => {
    const normalized = normalizeText(concept)
    return normalized && !evidenceText.includes(normalized)
  })
}

function findForbiddenTerms(evidenceText, forbiddenTerms) {
  return unique(forbiddenTerms || []).filter((term) => {
    const normalized = normalizeText(term)
    return normalized && evidenceText.includes(normalized)
  })
}

function hasPositiveForbiddenIntent(evidenceText, term) {
  const normalizedTerm = normalizeText(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!normalizedTerm) {
    return false
  }

  const matcher = new RegExp(
    `\\b(?:usar|usa|crear|crea|conectar|conecta|habilitar|habilita|activar|activa|pedir|pide|solicitar|solicita|requiere|configurar|configura|escribir|escribe|deployar|publicar)\\b.{0,50}\\b${normalizedTerm}\\b`,
    'u',
  )
  const match = evidenceText.match(matcher)
  if (!match || typeof match.index !== 'number') {
    return false
  }

  const previousWindow = evidenceText.slice(Math.max(0, match.index - 30), match.index)
  return !/\b(?:sin|no|nunca|evitar|prohibir|prohibido|no quiero|no debe)\b/u.test(previousWindow)
}

function matchesForbiddenArtifactPath(filePath, forbiddenArtifact) {
  const normalizedPath = normalizePathText(filePath).toLowerCase()
  const normalizedArtifact = normalizePathText(forbiddenArtifact).toLowerCase()

  if (!normalizedPath || !normalizedArtifact) {
    return false
  }

  if (normalizedArtifact === '.env') {
    return /(^|\/)\.env($|[./])/.test(normalizedPath)
  }

  if (normalizedArtifact === 'node_modules') {
    return /(^|\/)node_modules($|\/)/.test(normalizedPath)
  }

  if (normalizedArtifact === 'dockerfile') {
    return /(^|\/)dockerfile$/i.test(normalizedPath)
  }

  if (normalizedArtifact === 'docker-compose') {
    return /(^|\/)docker-compose(\.ya?ml)?$/i.test(normalizedPath)
  }

  if (normalizedArtifact === 'web-prueba') {
    return /(^|\/)web-prueba($|\/)/.test(normalizedPath)
  }

  return normalizedPath.includes(normalizedArtifact)
}

function findRestrictionViolations(input, evidenceText) {
  const forbiddenArtifacts = unique([
    ...DEFAULT_FORBIDDEN_ARTIFACTS,
    ...(input.forbiddenArtifacts || []),
  ])
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const fileViolations = []

  for (const file of generatedFiles) {
    const filePath = getGeneratedFilePath(file)
    for (const artifact of forbiddenArtifacts) {
      if (matchesForbiddenArtifactPath(filePath, artifact)) {
        fileViolations.push(`${artifact}: ${filePath}`)
      }
    }
  }

  const textViolations = [
    'servicios externos reales',
    'webhooks reales',
    'pagos reales',
    'credenciales reales',
    'db productiva',
    'base productiva',
    'deploy productivo',
    'escritura en web-prueba',
  ].filter((term) => hasPositiveForbiddenIntent(evidenceText, term))

  return unique([...fileViolations, ...textViolations])
}

function isAbsoluteDangerousPath(filePath) {
  const normalized = normalizePathText(filePath)
  return (
    /^[a-zA-Z]:\//.test(normalized) ||
    normalized.startsWith('//') ||
    normalized.startsWith('\\\\') ||
    normalized.startsWith('/')
  )
}

function findSandboxViolations(input) {
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const sandboxPath = normalizePathText(input.sandboxPath || input.summary?.projectRoot || '')
  const violations = []

  for (const file of generatedFiles) {
    const filePath = getGeneratedFilePath(file)
    const normalized = normalizePathText(filePath)
    const lower = normalized.toLowerCase()
    const pathParts = normalized.split('/').filter(Boolean)

    if (!normalized) {
      violations.push('archivo sin path relativo')
      continue
    }

    if (pathParts.includes('..') || normalized === '..' || normalized.startsWith('../')) {
      violations.push(`path traversal: ${filePath}`)
    }

    if (isAbsoluteDangerousPath(normalized)) {
      violations.push(`path absoluto o slash-root no normalizado: ${filePath}`)
    }

    if (/(^|\/)web-prueba($|\/)/.test(lower)) {
      violations.push(`path prohibido web-prueba: ${filePath}`)
    }

    const absolutePath = normalizePathText(file.absolutePath || file.fullPath || '')
    if (sandboxPath && absolutePath && !absolutePath.toLowerCase().startsWith(sandboxPath.toLowerCase())) {
      violations.push(`archivo fuera de sandbox: ${absolutePath}`)
    }
  }

  const validationSandbox = input.validationReport?.sandbox || input.validationSummary?.sandbox
  if (validationSandbox && validationSandbox.passed === false) {
    violations.push('validation sandbox failed')
  }

  return unique(violations)
}

function hasEvidenceFile(generatedFiles, expectedPath) {
  const expected = normalizePathText(expectedPath).toLowerCase()
  return generatedFiles.some((file) => normalizePathText(getGeneratedFilePath(file)).toLowerCase() === expected)
}

function evaluateEvidence(input) {
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const missing = []

  if (!input.summary) {
    missing.push('summary')
  }

  if (!generatedFiles.length) {
    missing.push('generated files list')
  }

  if (!input.sandboxPath && !input.summary?.projectRoot && !input.validationReport?.sandbox?.projectRoot) {
    missing.push('sandbox path')
  }

  if (!input.approvalStatus && !input.summary?.approvalStatus && !input.validationReport?.approvals?.approvalStatus) {
    missing.push('sandbox approval')
  }

  if (!input.validationReport && !hasEvidenceFile(generatedFiles, 'validation/report.json')) {
    missing.push('validation/report.json')
  }

  return missing
}

function evaluateQuality(input, evidenceText) {
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const missing = []
  const paths = generatedFiles.map((file) => normalizePathText(getGeneratedFilePath(file)).toLowerCase())

  if (!paths.some((filePath) => filePath.endsWith('readme.md') || filePath.includes('/docs/domain.md'))) {
    missing.push('README/domain doc')
  }

  if (!paths.some((filePath) => filePath.includes('frontend/'))) {
    missing.push('frontend/paneles')
  }

  if (!evidenceText.includes('backend mock') && !paths.some((filePath) => filePath.includes('backend/'))) {
    missing.push('backend mock')
  }

  if (
    !evidenceText.includes('base local') &&
    !evidenceText.includes('database') &&
    !paths.some((filePath) => filePath.includes('database/') || filePath.includes('schema'))
  ) {
    missing.push('base local/diseno de datos')
  }

  if (generatedFiles.length > 0 && generatedFiles.length < 5) {
    missing.push('menos archivos de lo esperado')
  }

  const contentLength = generatedFiles.reduce(
    (total, file) => total + String(getGeneratedFileContent(file)).trim().length,
    0,
  )
  if (generatedFiles.length > 0 && contentLength > 0 && contentLength < 500) {
    missing.push('contenido demasiado generico')
  }

  for (const concept of DEFAULT_MINIMUM_DELIVERY_CONCEPTS) {
    if (!evidenceText.includes(normalizeText(concept))) {
      missing.push(concept)
    }
  }

  return unique(missing)
}

function buildCorrectionBrief({
  status,
  issues,
  missingConcepts,
  contaminationFound,
  restrictionViolations,
  sandboxViolations,
  input,
}) {
  const expectedDomain = input.expectedDomain || 'dominio solicitado'
  const mustNotTouch = [
    'No tocar web-prueba.',
    'No crear .env ni node_modules.',
    'No usar Docker, deploy, servicios externos, pagos reales, DB productiva ni credenciales reales.',
    'No escribir fuera del sandbox aprobado.',
  ]
  const action =
    status === 'blocked'
      ? 'Corregir primero las violaciones de seguridad/sandbox antes de intentar una nueva materializacion.'
      : 'Regenerar o ajustar la entrega para cumplir el dominio y la cobertura esperada.'

  const lines = [
    'BRIEF DE CORRECCION PARA CODEX',
    '',
    `Estado del review: ${status}.`,
    `Dominio esperado: ${expectedDomain}.`,
    '',
    'Que salio mal:',
    ...issues.map((issue) => `- [${issue.severity}/${issue.category}] ${issue.message}`),
    '',
    'Que debe corregir:',
    `- Mantener como dominio principal: ${expectedDomain}.`,
  ]

  if (missingConcepts.length) {
    lines.push(`- Cubrir conceptos faltantes: ${missingConcepts.join(', ')}.`)
  }

  if (contaminationFound.length) {
    lines.push(`- Eliminar contaminacion de otros dominios: ${contaminationFound.join(', ')}.`)
  }

  if (restrictionViolations.length) {
    lines.push(`- Remover violaciones de restricciones: ${restrictionViolations.join(', ')}.`)
  }

  if (sandboxViolations.length) {
    lines.push(`- Corregir paths sandbox: ${sandboxViolations.join(', ')}.`)
  }

  lines.push('', 'Que no debe tocar:', ...mustNotTouch.map((item) => `- ${item}`))
  lines.push(
    '',
    'Evidencia a regenerar:',
    '- request usado, decisiones/approvals, sandbox path, lista de archivos generados, summary, validation-summary y validation/report.json.',
    '',
    'Validaciones a correr:',
    '- Ejecutar el smoke del Delivery Review Loop y los smokes de generated-domain/sandbox relevantes.',
    '',
    'Modo de correccion:',
    `- ${action}`,
  )

  return lines.join('\n')
}

function addIssue(issues, severity, category, message, evidence = '') {
  issues.push({ severity, category, message, evidence })
}

function buildReviewerSummary(status, issues, missingConcepts) {
  if (status === 'pass') {
    return 'La entrega cumple dominio, restricciones, sandbox y evidencia minima.'
  }
  const severeCount = issues.filter((issue) => issue.severity === 'blocking').length
  const majorCount = issues.filter((issue) => issue.severity === 'major').length
  return `La entrega requiere revision: ${severeCount} bloqueantes, ${majorCount} mayores, ${missingConcepts.length} conceptos faltantes.`
}

function reviewGeneratedDomainDelivery(input = {}) {
  const generatedFiles = Array.isArray(input.generatedFiles) ? input.generatedFiles : []
  const evidenceText = collectEvidenceText(input)
  const deliveryText = collectDeliveryText(input)
  const issues = []
  const expectedDomain = String(input.expectedDomain || '').trim()
  const expectedDomainFound = expectedDomain ? deliveryText.includes(normalizeText(expectedDomain)) : false
  const missingConcepts = findMissingTerms(deliveryText, input.expectedConcepts || [])
  const contaminationFound = findForbiddenTerms(deliveryText, input.forbiddenDomainTerms || [])
  const restrictionViolations = findRestrictionViolations(input, evidenceText)
  const sandboxViolations = findSandboxViolations(input)
  const missingEvidence = evaluateEvidence(input)
  const qualityGaps = evaluateQuality(input, deliveryText)

  if (expectedDomain && !expectedDomainFound) {
    addIssue(
      issues,
      'major',
      'domain',
      `No aparece el dominio esperado "${expectedDomain}".`,
      expectedDomain,
    )
  }

  if (missingConcepts.length) {
    addIssue(
      issues,
      'major',
      'completeness',
      `Faltan conceptos esperados: ${missingConcepts.join(', ')}.`,
      missingConcepts.join(', '),
    )
  }

  if (contaminationFound.length) {
    addIssue(
      issues,
      'major',
      'contamination',
      `Aparecen terminos de dominios ajenos: ${contaminationFound.join(', ')}.`,
      contaminationFound.join(', '),
    )
  }

  if (restrictionViolations.length) {
    addIssue(
      issues,
      'blocking',
      'restrictions',
      `Hay violaciones de restricciones duras: ${restrictionViolations.join(', ')}.`,
      restrictionViolations.join(', '),
    )
  }

  if (sandboxViolations.length) {
    addIssue(
      issues,
      'blocking',
      'sandbox',
      `Hay violaciones de sandbox: ${sandboxViolations.join(', ')}.`,
      sandboxViolations.join(', '),
    )
  }

  if (missingEvidence.length) {
    addIssue(
      issues,
      'major',
      'evidence',
      `Falta evidencia minima: ${missingEvidence.join(', ')}.`,
      missingEvidence.join(', '),
    )
  }

  if (qualityGaps.length) {
    addIssue(
      issues,
      'minor',
      'quality',
      `La entrega queda pobre o generica: ${qualityGaps.join(', ')}.`,
      qualityGaps.join(', '),
    )
  }

  const hasBlocking = issues.some((issue) => issue.severity === 'blocking')
  const status = hasBlocking ? 'blocked' : issues.length ? 'needs_revision' : 'pass'
  const scores = {
    domain: expectedDomainFound && !contaminationFound.length ? 100 : expectedDomainFound ? 70 : 25,
    completeness: clampScore(100 - missingConcepts.length * 14 - qualityGaps.length * 5),
    restrictions: restrictionViolations.length ? 0 : 100,
    sandbox: sandboxViolations.length ? 0 : 100,
    evidence: clampScore(100 - missingEvidence.length * 20),
  }

  return {
    status,
    score: scores,
    issues,
    missingConcepts,
    contaminationFound,
    restrictionViolations,
    sandboxViolations,
    correctionBrief: buildCorrectionBrief({
      status,
      issues,
      missingConcepts,
      contaminationFound,
      restrictionViolations,
      sandboxViolations,
      input,
    }),
    reviewerSummary: buildReviewerSummary(status, issues, missingConcepts),
    metadata: {
      generatedFilesCount: generatedFiles.length,
      expectedDomainFound,
    },
  }
}

module.exports = {
  reviewGeneratedDomainDelivery,
  normalizeText,
  findSandboxViolations,
  findRestrictionViolations,
}
