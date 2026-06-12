const fs = require('node:fs')
const path = require('node:path')

const ALWAYS_FORBIDDEN_ACTIONS = [
  'No tocar web-prueba.',
  'No crear ni modificar .env.',
  'No crear ni modificar node_modules.',
  'No crear Dockerfile ni docker-compose.',
  'No hacer deploy ni preparar deploy real.',
  'No usar servicios externos reales.',
  'No activar pagos reales.',
  'No usar DB productiva.',
  'No pedir, crear ni guardar credenciales reales.',
  'No cambiar package.json ni package-lock.json salvo autorizacion explicita.',
  'No escribir fuera del sandbox aprobado.',
  'No usar git add .',
]

const DEFAULT_ALLOWED_SCOPE = [
  'Leer el reporte de review y la evidencia indicada.',
  'Proponer o aplicar solo correcciones dentro del sandbox aprobado si el prompt final lo permite.',
  'Regenerar evidencia de review local bajo .codex-temp si corresponde.',
]

const DEFAULT_VALIDATION_COMMANDS = [
  'node scripts/generated-domain-delivery-review-loop-smoke.mjs',
  'node scripts/generated-domain-delivery-review-evidence-smoke.mjs',
  'node scripts/generated-domain-electron-ui-e2e-smoke.mjs',
  'node scripts/generated-domain-sandbox-approval-battery-smoke.mjs',
  'git diff --check',
  'git status --short',
]

const DANGEROUS_BRIEF_PATTERNS = [
  { pattern: /\b(?:crear|generar|escribir|modificar|agregar)\s+\.env\b/i, label: 'crear .env' },
  {
    pattern: /\b(?:crear|generar|escribir|modificar|agregar)\s+(?:en\s+)?node_modules\b/i,
    label: 'node_modules',
  },
  { pattern: /\binstalar\s+(?:dependencias|paquetes|packages)\b/i, label: 'instalar dependencias' },
  { pattern: /\bnpm\s+install\b/i, label: 'npm install' },
  {
    pattern: /\b(?:crear|usar|agregar|configurar|levantar)\s+docker(?:file|-compose| compose)?\b/i,
    label: 'Docker',
  },
  { pattern: /\b(?:hacer|ejecutar|preparar|publicar|subir)\s+deploy\b/i, label: 'deploy' },
  {
    pattern: /\b(?:tocar|escribir|modificar|crear|usar)\s+(?:en\s+)?web-prueba\b/i,
    label: 'web-prueba',
  },
  {
    pattern: /\b(?:pedir|usar|guardar|crear|configurar)\s+credenciales?\s+reales?\b/i,
    label: 'credenciales reales',
  },
  { pattern: /\b(?:activar|usar|cobrar|procesar)\s+pagos?\s+reales?\b/i, label: 'pagos reales' },
  {
    pattern: /\b(?:usar|conectar|escribir|crear)\s+(?:db\s+productiva|base\s+productiva)\b/i,
    label: 'DB productiva',
  },
  { pattern: /\bgit\s+add\s+\.\b/i, label: 'git add .' },
]

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

function loadDeliveryReviewReport(reportPath) {
  if (!reportPath || !fs.existsSync(reportPath) || !fs.statSync(reportPath).isFile()) {
    throw new Error(`Delivery review report not found: ${reportPath}`)
  }
  return readJsonFile(reportPath)
}

function normalizeIssueSeverity(issues) {
  if (!Array.isArray(issues) || !issues.length) {
    return 'none'
  }
  if (issues.some((issue) => issue.severity === 'blocking')) {
    return 'blocking'
  }
  if (issues.some((issue) => issue.severity === 'major')) {
    return 'major'
  }
  return 'minor'
}

function unique(values) {
  const seen = new Set()
  const result = []
  for (const value of values || []) {
    const text = String(value || '').trim()
    const key = text.toLowerCase()
    if (!text || seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(text)
  }
  return result
}

function detectDangerousBriefActions(correctionBrief = '') {
  const hits = []
  for (const { pattern, label } of DANGEROUS_BRIEF_PATTERNS) {
    const matcher = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
    for (const match of correctionBrief.matchAll(matcher)) {
      const index = typeof match.index === 'number' ? match.index : 0
      const previousWindow = correctionBrief.slice(Math.max(0, index - 35), index)
      if (/\b(?:no|sin|nunca|evitar|prohibir|prohibido)\s*$/i.test(previousWindow)) {
        continue
      }
      hits.push(label)
      break
    }
  }
  return unique(hits)
}

function summarizeRequiredFixes(reviewResult) {
  const fixes = []
  if (Array.isArray(reviewResult.missingConcepts) && reviewResult.missingConcepts.length) {
    fixes.push(`Cubrir conceptos faltantes: ${reviewResult.missingConcepts.join(', ')}.`)
  }
  if (Array.isArray(reviewResult.contaminationFound) && reviewResult.contaminationFound.length) {
    fixes.push(`Quitar contaminacion de dominio: ${reviewResult.contaminationFound.join(', ')}.`)
  }
  if (Array.isArray(reviewResult.restrictionViolations) && reviewResult.restrictionViolations.length) {
    fixes.push(`Resolver violaciones de restricciones: ${reviewResult.restrictionViolations.join(', ')}.`)
  }
  if (Array.isArray(reviewResult.sandboxViolations) && reviewResult.sandboxViolations.length) {
    fixes.push(`Resolver violaciones de sandbox: ${reviewResult.sandboxViolations.join(', ')}.`)
  }
  for (const issue of reviewResult.issues || []) {
    if (issue?.message) {
      fixes.push(issue.message)
    }
  }
  return unique(fixes)
}

function inferTaskStatus(reviewStatus, dangerousActions) {
  if (dangerousActions.length) {
    return 'blocked_requires_human'
  }
  if (reviewStatus === 'pass') {
    return 'no_action_needed'
  }
  if (reviewStatus === 'blocked') {
    return 'blocked_requires_human'
  }
  return 'ready'
}

function buildCodexCorrectionPrompt(task) {
  const isReady = task.taskStatus === 'ready'
  const isBlocked = task.taskStatus === 'blocked_requires_human'
  const header = isReady
    ? 'CODEX CORRECTION TASK'
    : isBlocked
      ? 'CODEX DIAGNOSTIC TASK - HUMAN APPROVAL REQUIRED'
      : 'CODEX REVIEW TASK - NO ACTION NEEDED'

  const lines = [
    header,
    '',
    'Contexto del proyecto:',
    `- Titulo: ${task.title}`,
    `- Estado del reviewer: ${task.sourceReviewStatus}`,
    `- Severidad: ${task.severity}`,
    `- Evidencia revisada: ${task.evidenceDir || '(no especificada)'}`,
    `- Sandbox permitido: ${task.sandboxPath || '(no especificado)'}`,
    '',
    'IMPORTANTE:',
    '- NO ejecutes cambios automaticamente si este prompt esta siendo usado en modo dry-run.',
  ]

  if (task.taskStatus === 'no_action_needed') {
    lines.push(
      '- El reviewer marco la entrega como pass. No generes una correccion agresiva.',
      '- Solo resume que no hay accion correctiva pendiente.',
    )
  }

  if (isBlocked) {
    lines.push(
      '- Esta tarea esta bloqueada o contiene senales peligrosas.',
      '- No corrijas archivos ni toques la entrega sin aprobacion humana explicita.',
      '- Haz diagnostico de seguridad y explica el siguiente paso seguro.',
    )
  }

  if (isReady) {
    lines.push(
      '- Puedes preparar una correccion segura y acotada dentro del sandbox aprobado.',
      '- No modifiques material de producto fuera del alcance permitido.',
    )
  }

  lines.push('', 'Issues detectados:')
  if (task.issues.length) {
    for (const issue of task.issues) {
      lines.push(`- [${issue.severity}/${issue.category}] ${issue.message}`)
    }
  } else {
    lines.push('- Sin issues.')
  }

  lines.push('', 'Correcciones requeridas:')
  if (task.requiredFixes.length) {
    for (const fix of task.requiredFixes) {
      lines.push(`- ${fix}`)
    }
  } else {
    lines.push('- Ninguna correccion requerida.')
  }

  lines.push('', 'Alcance permitido:')
  for (const item of task.allowedScope) {
    lines.push(`- ${item}`)
  }

  lines.push('', 'Cosas que NO puede tocar:')
  for (const item of task.forbiddenActions) {
    lines.push(`- ${item}`)
  }

  lines.push(
    '',
    'Evidencia que debe regenerar si realiza una correccion:',
    '- request usado.',
    '- decisiones/approvals.',
    '- sandbox path.',
    '- lista de archivos generados.',
    '- summary.',
    '- validation-summary.',
    '- validation/report.json.',
    '- delivery-review-report.json actualizado.',
    '- correction-brief.md actualizado si sigue habiendo issues.',
  )

  lines.push('', 'Validaciones que debe ejecutar:')
  for (const command of task.validationCommands) {
    lines.push(`- ${command}`)
  }

  lines.push(
    '',
    'Auditoria Git obligatoria:',
    '- git diff --check',
    '- git status --short',
    '- git diff --stat',
    '- git diff --name-status',
    '',
    'Commit / push:',
    task.allowCommit
      ? '- Commit/push solo si el prompt del bloque lo autoriza explicitamente y todas las validaciones pasan.'
      : '- No hacer commit ni push desde esta tarea.',
  )

  if (task.correctionBrief) {
    lines.push('', 'Correction brief original:', task.correctionBrief)
  }

  if (task.safetyNotes.length) {
    lines.push('', 'Notas de seguridad:', ...task.safetyNotes.map((note) => `- ${note}`))
  }

  return lines.join('\n')
}

function buildCodexCorrectionTask(reviewResult = {}, options = {}) {
  const reviewStatus = reviewResult.status || reviewResult.sourceReviewStatus || 'needs_revision'
  const issues = Array.isArray(reviewResult.issues) ? reviewResult.issues : []
  const dangerousActions = detectDangerousBriefActions(reviewResult.correctionBrief || '')
  const taskStatus = inferTaskStatus(reviewStatus, dangerousActions)
  const severity = normalizeIssueSeverity(issues)
  const categories = unique(issues.map((issue) => issue.category).filter(Boolean))
  const safetyNotes = dangerousActions.map(
    (action) => `El correctionBrief contiene una accion peligrosa o fuera de alcance: ${action}.`,
  )
  const task = {
    taskStatus,
    sourceReviewStatus: reviewStatus,
    title:
      options.title ||
      (reviewStatus === 'pass'
        ? 'No hay correccion pendiente para la entrega revisada'
        : 'Corregir entrega generada a partir del review estructurado'),
    severity,
    categories,
    evidenceDir: options.evidenceDir || reviewResult.evidenceDir || '',
    reviewReportPath: options.reviewReportPath || '',
    sandboxPath: options.sandboxPath || reviewResult.sandboxPath || '',
    allowedScope: unique([...(options.allowedScope || DEFAULT_ALLOWED_SCOPE)]),
    forbiddenActions: unique([...(options.forbiddenActions || []), ...ALWAYS_FORBIDDEN_ACTIONS]),
    requiredFixes: summarizeRequiredFixes(reviewResult),
    validationCommands: unique([...(options.validationCommands || DEFAULT_VALIDATION_COMMANDS)]),
    issues,
    correctionBrief: reviewResult.correctionBrief || '',
    safetyNotes,
    allowCommit: options.allowCommit === true,
    metadata: {
      generatedAt: new Date().toISOString(),
      reviewerSummary: reviewResult.reviewerSummary || '',
      issueCount: issues.length,
      dangerousActions,
    },
  }

  task.prompt = buildCodexCorrectionPrompt(task)
  return task
}

function buildCodexCorrectionTaskFromReport(reportPath, options = {}) {
  const reviewReport = loadDeliveryReviewReport(reportPath)
  return buildCodexCorrectionTask(reviewReport, {
    ...options,
    reviewReportPath: path.resolve(reportPath),
    evidenceDir: options.evidenceDir || reviewReport.evidenceDir || '',
  })
}

function writeCodexCorrectionTask(outputDir, task) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  fs.mkdirSync(outputDir, { recursive: true })
  const taskPath = path.join(outputDir, 'codex-correction-task.json')
  const promptPath = path.join(outputDir, 'codex-correction-prompt.md')
  fs.writeFileSync(taskPath, `${JSON.stringify(task, null, 2)}\n`, 'utf8')
  fs.writeFileSync(promptPath, `${task.prompt || buildCodexCorrectionPrompt(task)}\n`, 'utf8')
  return {
    taskPath,
    promptPath,
  }
}

module.exports = {
  buildCodexCorrectionTask,
  buildCodexCorrectionPrompt,
  writeCodexCorrectionTask,
  loadDeliveryReviewReport,
  buildCodexCorrectionTaskFromReport,
  detectDangerousBriefActions,
  ALWAYS_FORBIDDEN_ACTIONS,
}
