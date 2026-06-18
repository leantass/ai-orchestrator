const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  validateSafeOutputDir,
  findDangerousInstructions,
} = require('./orchestrator-planned-external-workers.cjs')

const {
  validateExternalToolExecutionPermitBundle,
  summarizeExternalToolExecutionPermitBundle,
} = require('./orchestrator-external-tool-execution-permit-bundle.cjs')

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

function isSubpath(candidate, parent) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function normalizeArtifact(value = {}) {
  if (value.manualSupervisedExecutionSession) {
    return value.manualSupervisedExecutionSession
  }
  if (value.session) {
    return value.session
  }
  if (value.bundle) {
    return value.bundle
  }
  return value
}

function loadExecutionPermitBundle(bundlePath) {
  if (!bundlePath) {
    return {
      status: 'missing',
      path: '',
      permitBundle: null,
      missingReason: 'permit bundle path faltante',
    }
  }
  const resolved = resolveRepoPath(bundlePath)
  if (!fs.existsSync(resolved)) {
    return {
      status: 'missing',
      path: resolved,
      permitBundle: null,
      missingReason: `permit bundle inexistente: ${bundlePath}`,
    }
  }
  return {
    status: 'present',
    path: resolved,
    permitBundle: normalizeArtifact(readJsonFile(resolved)),
    missingReason: '',
  }
}

function loadManualSupervisedExecutionSession(sessionPath) {
  if (!sessionPath) {
    throw new Error('--session es obligatorio')
  }
  const resolved = resolveRepoPath(sessionPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Sesion inexistente: ${sessionPath}`)
  }
  return normalizeArtifact(readJsonFile(resolved))
}

function toolLabel(toolKind) {
  if (toolKind === 'blender') {
    return 'Blender'
  }
  if (toolKind === 'unity') {
    return 'Unity'
  }
  if (toolKind === 'mcp') {
    return 'MCP'
  }
  return 'external tool'
}

function toolRules(toolKind) {
  if (toolKind === 'blender') {
    return {
      opening: 'El operador humano abre Blender manualmente fuera de JEFE, solo si mantiene los scopes aprobados.',
      evidence: ['screenshots o previews', 'archivo exportado futuro si aplica', 'manual notes o log de operador'],
      forbidden: ['No instalar addons.', 'No exportar fuera de scope aprobado.', 'No usar .env ni credenciales.'],
      rollback: ['Conservar copia de inputs originales.', 'Abortar si el output cae fuera del scope aprobado.'],
    }
  }
  if (toolKind === 'unity') {
    return {
      opening: 'El operador humano abre Unity manualmente fuera de JEFE, usando solo el proyecto/sandbox aprobado.',
      evidence: ['screenshots', 'import log', 'prefab/scene report si aplica', 'test report si aplica'],
      forbidden: ['No generar builds.', 'No tocar escenas productivas.', 'No borrar assets fuera de scope.'],
      rollback: ['Trabajar en rama/sandbox aprobado.', 'Registrar diff y restaurar cambios fuera de scope.'],
    }
  }
  if (toolKind === 'mcp') {
    return {
      opening: 'MCP real no se invoca desde JEFE en V1.5; cualquier proceso futuro debe ser humano, externo y aprobado.',
      evidence: ['payload redactado', 'scopes usados', 'response redacted si aplica'],
      forbidden: ['No incluir credenciales reales.', 'No hacer llamadas de red desde JEFE.', 'No invocar MCP real automaticamente.'],
      rollback: ['Revocar scopes si aparece riesgo.', 'Descartar payloads con secretos.'],
    }
  }
  return {
    opening: 'El operador humano controla la herramienta externa manualmente fuera de JEFE.',
    evidence: ['manual notes', 'screenshots si aplica', 'validation report'],
    forbidden: ['No ejecutar automaticamente.', 'No escribir fuera de scope aprobado.'],
    rollback: ['Abortar si aparece riesgo duro.'],
  }
}

function statusFromPermitBundle(bundle, loadedStatus) {
  if (loadedStatus !== 'present' || !bundle) {
    return 'missing_artifacts'
  }
  if (bundle.permitStatus === 'blocked') {
    return 'blocked'
  }
  if (bundle.permitStatus === 'requires_human_approval') {
    return 'requires_human_approval'
  }
  if (bundle.permitStatus === 'missing_artifacts') {
    return 'missing_artifacts'
  }
  if (bundle.permitStatus === 'needs_missing_inputs' || bundle.permitStatus === 'needs_more_planning' || bundle.permitStatus === 'invalid') {
    return 'not_ready_missing_inputs'
  }
  if (bundle.permitStatus === 'ready_for_manual_supervised_execution') {
    return 'ready_for_manual_operator'
  }
  return 'not_ready_missing_inputs'
}

function buildManualOperatorRunbook(session = {}) {
  const rules = toolRules(session.toolKind)
  return [
    `# Manual Operator Runbook - ${toolLabel(session.toolKind)}`,
    '',
    '## Safety boundary',
    '',
    '- JEFE does not execute Blender, Unity or MCP.',
    '- executionAllowed=false.',
    '- automaticExecutionAllowed=false.',
    '- externalToolExecutedByJefe=false.',
    '',
    '## Operator action',
    '',
    `- ${rules.opening}`,
    `- Requested action: ${session.metadata?.requestedAction || session.capability || 'manual supervised external action'}.`,
    `- Target project: ${session.metadata?.targetProject || '(not specified)'}.`,
    '',
    '## Preconditions',
    '',
    ...(session.executionPreconditions?.length ? session.executionPreconditions.map((item) => `- ${item}`) : ['- No preconditions declared.']),
    '',
    '## Checklist',
    '',
    ...(session.manualOperatorChecklist?.length ? session.manualOperatorChecklist.map((item) => `- ${item}`) : ['- Review scopes, evidence and abort conditions.']),
    '',
    '## Expected evidence',
    '',
    ...(session.evidenceContract?.length ? session.evidenceContract.map((item) => `- ${item}`) : rules.evidence.map((item) => `- ${item}`)),
    '',
    '## Abort conditions',
    '',
    ...(session.abortConditions?.length ? session.abortConditions.map((item) => `- ${item}`) : ['- Abort if any hard risk appears.']),
    '',
    '## Forbidden actions',
    '',
    ...(session.forbiddenActions?.length ? session.forbiddenActions.map((item) => `- ${item}`) : rules.forbidden.map((item) => `- ${item}`)),
    '',
  ].join('\n')
}

function buildEvidenceIntakeRules(session = {}) {
  return unique([
    'Evidence must be provided by a human operator.',
    'Evidence directory must exist before intake.',
    'Evidence must live inside .codex-temp or an approved scope from the permit bundle.',
    'Evidence must not contain .env, credentials, node_modules, web-prueba, Docker/deploy artifacts or package changes.',
    'Binary files are listed but not deeply analyzed in V1.5.',
    ...ensureArray(session.evidenceContract).map((item) => `Expected: ${item}`),
  ])
}

function buildManualSupervisedExecutionSession(input = {}, options = {}) {
  const loaded = input.permitBundle
    ? { status: 'present', path: input.permitBundlePath || '', permitBundle: input.permitBundle, missingReason: '' }
    : loadExecutionPermitBundle(input.permitBundlePath)
  const permitBundle = loaded.permitBundle
  const permitValidation = permitBundle
    ? validateExternalToolExecutionPermitBundle(permitBundle, { allowMissingIdentity: permitBundle.permitStatus === 'missing_artifacts' })
    : { valid: false, issues: [loaded.missingReason || 'permit bundle faltante'] }
  const toolKind = permitBundle?.toolKind || input.requestedTool || 'unknown'
  const rules = toolRules(toolKind)
  const sessionStatus = statusFromPermitBundle(permitBundle, loaded.status)
  const blockedReasons = unique([
    ...(permitBundle?.blockedReasons || []),
    ...(permitValidation.valid ? [] : permitValidation.issues.map((issue) => `permit bundle invalido: ${issue}`)),
    ...findDangerousInstructions([
      input.requestedTool,
      input.requestedAction,
      input.targetProject,
      input.evidenceDir,
      ...(permitBundle?.approvedScopes || []),
    ]).map((finding) => `accion peligrosa: ${finding.label}`),
  ])
  const normalizedStatus = blockedReasons.length && sessionStatus !== 'missing_artifacts'
    ? 'blocked'
    : sessionStatus
  const session = {
    sessionStatus: normalizedStatus,
    executionMode: 'manual_supervised',
    executionAllowed: false,
    automaticExecutionAllowed: false,
    externalToolExecutedByJefe: false,
    workerId: permitBundle?.workerId || '',
    workerDisplayName: permitBundle?.workerDisplayName || '',
    capability: permitBundle?.capability || '',
    toolKind,
    operator: {
      name: String(input.operatorName || '').trim(),
      role: String(input.operatorRole || '').trim() || 'Human Operator',
    },
    permitStatus: permitBundle?.permitStatus || 'missing_artifacts',
    approvedScopes: unique(permitBundle?.approvedScopes || []),
    forbiddenActions: unique([
      ...(permitBundle?.forbiddenActions || []),
      ...rules.forbidden,
      'No abrir herramientas GUI automaticamente.',
      'No ejecutar Blender automaticamente.',
      'No ejecutar Unity automaticamente.',
      'No invocar MCP real desde JEFE.',
      'No usar credenciales reales.',
      'No hacer deploy ni Docker.',
    ]),
    requiredInputs: unique([
      ...(permitBundle?.missingInputs || []),
      ...(permitBundle?.executionPreconditions || []),
    ]),
    expectedOutputs: unique([
      ...(permitBundle?.missingOutputs || []),
      ...(permitBundle?.evidenceContract || []),
      ...rules.evidence,
    ]),
    executionPreconditions: unique(permitBundle?.executionPreconditions || []),
    manualOperatorChecklist: unique([
      ...(permitBundle?.manualOperatorChecklist || []),
      'Confirmar operador humano y rol.',
      'Confirmar scopes aprobados.',
      'Confirmar evidencia esperada.',
      'Confirmar condiciones de aborto antes de tocar la herramienta.',
      'Confirmar que JEFE no ejecuta herramientas externas.',
    ]),
    operatorRunbook: '',
    evidenceContract: unique([
      ...(permitBundle?.evidenceContract || []),
      ...rules.evidence,
    ]),
    evidenceIntakeRules: [],
    validationPlan: unique(permitBundle?.validationPlan || []),
    abortConditions: unique([
      ...(permitBundle?.abortConditions || []),
      'Aparece .env, credenciales, node_modules, web-prueba, Docker o deploy.',
      'Se intenta ejecutar una herramienta desde JEFE.',
      'La evidencia cae fuera de .codex-temp o del scope aprobado.',
      'El operador detecta cambios fuera del objetivo aprobado.',
    ]),
    rollbackNotes: unique(rules.rollback),
    nextAction: '',
    safetySummary: [
      'V1.5 prepara una sesion manual supervisada, no una ejecucion automatica.',
      'JEFE no abre Blender, Unity ni MCP.',
      'La evidencia debe ser registrada luego por un operador humano.',
    ].join(' '),
    metadata: {
      generatedAt: nowIso(),
      mode: input.mode || 'prepare',
      permitBundlePath: loaded.path || input.permitBundlePath || '',
      requestedTool: input.requestedTool || toolKind,
      requestedAction: input.requestedAction || permitBundle?.capability || '',
      targetProject: input.targetProject || permitBundle?.metadata?.targetProject || '',
      evidenceDir: input.evidenceDir || '',
      noExternalToolExecuted: true,
      externalToolExecutedByJefe: false,
      permitValidation,
      originalMetadata: input.metadata || {},
    },
  }
  session.operatorRunbook = buildManualOperatorRunbook(session, options)
  session.evidenceIntakeRules = buildEvidenceIntakeRules(session)
  session.nextAction = nextActionForSession(session)
  return session
}

function nextActionForSession(session = {}) {
  if (session.sessionStatus === 'ready_for_manual_operator') {
    return 'Entregar runbook al operador humano y esperar evidencia manual futura.'
  }
  if (session.sessionStatus === 'not_ready_missing_inputs') {
    return 'Completar inputs, outputs, scopes o planificacion antes de preparar la sesion.'
  }
  if (session.sessionStatus === 'requires_human_approval') {
    return 'Registrar aprobacion humana usable antes de preparar la sesion.'
  }
  if (session.sessionStatus === 'blocked') {
    return 'Resolver bloqueos de seguridad antes de continuar.'
  }
  if (session.sessionStatus === 'missing_artifacts') {
    return 'Proveer execution permit bundle antes de continuar.'
  }
  if (session.sessionStatus === 'evidence_submitted') {
    return 'Preparar post-execution review futuro.'
  }
  if (session.sessionStatus === 'evidence_invalid') {
    return 'Corregir evidencia antes de post-execution review.'
  }
  if (session.sessionStatus === 'aborted') {
    return 'Mantener registro de aborto; no ejecutar herramientas.'
  }
  return 'Revisar estado de sesion.'
}

function validateManualSupervisedExecutionSession(session = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'ready_for_manual_operator',
    'not_ready_missing_inputs',
    'requires_human_approval',
    'blocked',
    'missing_artifacts',
    'evidence_pending',
    'evidence_submitted',
    'evidence_invalid',
    'aborted',
  ])
  if (!validStatuses.has(session.sessionStatus)) {
    issues.push(`sessionStatus invalido: ${session.sessionStatus || '(vacio)'}`)
  }
  if (session.executionMode !== 'manual_supervised') {
    issues.push('executionMode debe ser manual_supervised')
  }
  if (session.executionAllowed !== false) {
    issues.push('executionAllowed debe ser false')
  }
  if (session.automaticExecutionAllowed !== false) {
    issues.push('automaticExecutionAllowed debe ser false')
  }
  if (session.externalToolExecutedByJefe !== false) {
    issues.push('externalToolExecutedByJefe debe ser false')
  }
  if (session.sessionStatus === 'ready_for_manual_operator' && session.permitStatus !== 'ready_for_manual_supervised_execution') {
    issues.push('ready_for_manual_operator requiere permit bundle ready')
  }
  if (session.sessionStatus !== 'missing_artifacts' && (!session.workerId || !session.capability) && options.allowMissingIdentity !== true) {
    issues.push('workerId/capability faltantes')
  }
  if (!session.operatorRunbook) {
    issues.push('operatorRunbook faltante')
  }
  if (!Array.isArray(session.evidenceContract)) {
    issues.push('evidenceContract debe ser array')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeManualSupervisedExecutionSession(session = {}) {
  return [
    `Manual supervised external execution session ${session.sessionStatus || 'unknown'} para ${session.workerId || 'sin worker'} (${session.capability || 'sin capability'}).`,
    `Tool: ${toolLabel(session.toolKind)}.`,
    `Permit status: ${session.permitStatus || 'unknown'}.`,
    'executionAllowed=false.',
    'automaticExecutionAllowed=false.',
    'externalToolExecutedByJefe=false.',
    'JEFE no ejecuto ninguna herramienta externa.',
  ].join(' ')
}

function markdownList(title, values) {
  return [
    `# ${title}`,
    '',
    ...(values?.length ? values.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n')
}

function writeManualSupervisedExecutionSession(outputDir, session) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateManualSupervisedExecutionSession(session, {
    allowMissingIdentity: session.sessionStatus === 'missing_artifacts',
  })
  if (!validation.valid) {
    throw new Error(`Sesion manual supervisada invalida: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const sessionPath = path.join(resolvedOutputDir, 'manual-supervised-execution-session.json')
  const runbookPath = path.join(resolvedOutputDir, 'manual-operator-runbook.md')
  const checklistPath = path.join(resolvedOutputDir, 'manual-operator-checklist.md')
  const evidencePath = path.join(resolvedOutputDir, 'evidence-contract.md')
  const abortPath = path.join(resolvedOutputDir, 'abort-and-rollback.md')
  const validationPath = path.join(resolvedOutputDir, 'post-execution-validation-plan.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...session,
    artifacts: [sessionPath, runbookPath, checklistPath, evidencePath, abortPath, validationPath, readmePath],
  }
  writeJsonFile(sessionPath, serializable)
  fs.writeFileSync(runbookPath, `${session.operatorRunbook}\n`, 'utf8')
  fs.writeFileSync(checklistPath, markdownList('Manual Operator Checklist', session.manualOperatorChecklist), 'utf8')
  fs.writeFileSync(evidencePath, markdownList('Evidence Contract', session.evidenceContract), 'utf8')
  fs.writeFileSync(
    abortPath,
    [
      ...markdownList('Abort Conditions', session.abortConditions).split('\n'),
      'Rollback notes:',
      ...(session.rollbackNotes?.length ? session.rollbackNotes.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(validationPath, markdownList('Post-Execution Validation Plan', session.validationPlan), 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# Manual Supervised External Execution Session',
      '',
      summarizeManualSupervisedExecutionSession(session),
      '',
      'Artifacts:',
      '- manual-supervised-execution-session.json',
      '- manual-operator-runbook.md',
      '- manual-operator-checklist.md',
      '- evidence-contract.md',
      '- abort-and-rollback.md',
      '- post-execution-validation-plan.md',
      '- README.md',
      '',
      'Safety:',
      '- JEFE does not execute external tools.',
      '- Evidence intake is a later manual record.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    sessionPath,
    runbookPath,
    checklistPath,
    evidencePath,
    abortPath,
    validationPath,
    readmePath,
    session: serializable,
  }
}

function fileList(dir) {
  const result = []
  if (!fs.existsSync(dir)) {
    return result
  }
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        const stat = fs.statSync(fullPath)
        result.push({
          path: fullPath,
          relativePath: path.relative(dir, fullPath).replaceAll('\\', '/'),
          size: stat.size,
        })
      }
    }
  }
  walk(dir)
  return result
}

function pathHasForbiddenSegment(value) {
  const normalized = String(value || '').replaceAll('\\', '/').toLowerCase()
  return [
    /(^|\/)\.env($|\/)/u,
    /(^|\/)node_modules($|\/)/u,
    /(^|\/)web-prueba($|\/)/u,
    /(^|\/)\.git($|\/)/u,
    /dockerfile/u,
    /docker-compose/u,
    /(^|\/)(dist|build|release|out)($|\/)/u,
    /package-lock\.json$/u,
    /package\.json$/u,
  ].some((pattern) => pattern.test(normalized))
}

function approvedEvidenceRoots(session = {}) {
  const roots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()]
  for (const scope of ensureArray(session.approvedScopes)) {
    const resolved = resolveRepoPath(scope)
    roots.push(resolved)
  }
  return unique(roots.map((root) => path.resolve(root)))
}

function isEvidenceDirAllowed(evidenceDir, session) {
  const resolved = resolveRepoPath(evidenceDir)
  return approvedEvidenceRoots(session).some((root) => isSubpath(resolved, root))
}

function likelyTextFile(filePath) {
  return ['.txt', '.md', '.json', '.log', '.yaml', '.yml', '.csv'].includes(path.extname(filePath).toLowerCase())
}

function contentFindings(files) {
  const findings = []
  for (const file of files) {
    if (!likelyTextFile(file.path) || file.size > 512 * 1024) {
      continue
    }
    const text = fs.readFileSync(file.path, 'utf8')
    const lower = text.toLowerCase()
    if (/(api[_-]?key|secret[_-]?key|access[_-]?token|private[_-]?key|password)\s*[:=]\s*['"]?[a-z0-9_\-]{6,}/iu.test(text)) {
      findings.push(`posibles credenciales en ${file.relativePath}`)
    }
    if (lower.includes('-----begin private key-----')) {
      findings.push(`private key en ${file.relativePath}`)
    }
    if (/(^|\n)\s*[a-z0-9_]*(secret|token|password|api_key)[a-z0-9_]*\s*=/iu.test(text)) {
      findings.push(`variable sensible en ${file.relativePath}`)
    }
  }
  return unique(findings)
}

function evidenceKeyword(value) {
  const stop = new Set(['expected', 'evidence', 'futuro', 'future', 'manual', 'report', 'si', 'aplica', 'required'])
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ]+/giu, ' ')
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !stop.has(token))
}

function missingExpectedEvidence(session = {}, files = []) {
  const haystack = files.map((file) => file.relativePath.toLowerCase()).join(' ')
  const expected = ensureArray(session.evidenceContract)
  const missing = []
  for (const item of expected) {
    const keywords = evidenceKeyword(item)
    if (!keywords.length) {
      continue
    }
    if (!keywords.some((keyword) => haystack.includes(keyword))) {
      missing.push(item)
    }
  }
  return unique(missing)
}

function validateManualEvidenceIntake(input = {}, options = {}) {
  const session = input.session || loadManualSupervisedExecutionSession(input.sessionPath)
  const evidenceDir = input.evidenceDir || session.metadata?.evidenceDir || ''
  const resolvedEvidenceDir = evidenceDir ? resolveRepoPath(evidenceDir) : ''
  const blockedReasons = []
  const validationNotes = []

  if (!evidenceDir) {
    return {
      evidenceStatus: 'missing_evidence',
      externalToolExecutedByJefe: false,
      evidenceDir: '',
      filesFound: [],
      missingExpectedEvidence: ensureArray(session.evidenceContract),
      blockedReasons: [],
      validationNotes: ['evidenceDir faltante'],
      nextAction: 'Proveer evidenceDir antes de registrar evidencia.',
      metadata: {
        generatedAt: nowIso(),
        operatorName: input.operatorName || '',
        notes: input.notes || '',
        originalMetadata: input.metadata || {},
      },
    }
  }
  if (!fs.existsSync(resolvedEvidenceDir) || !fs.statSync(resolvedEvidenceDir).isDirectory()) {
    return {
      evidenceStatus: 'missing_evidence',
      externalToolExecutedByJefe: false,
      evidenceDir: resolvedEvidenceDir,
      filesFound: [],
      missingExpectedEvidence: ensureArray(session.evidenceContract),
      blockedReasons: [],
      validationNotes: ['evidenceDir inexistente o no es carpeta'],
      nextAction: 'Crear o seleccionar carpeta de evidencia entregada por humano.',
      metadata: {
        generatedAt: nowIso(),
        sessionStatus: session.sessionStatus,
        operatorName: input.operatorName || '',
        notes: input.notes || '',
        originalMetadata: input.metadata || {},
      },
    }
  }
  if (!isEvidenceDirAllowed(evidenceDir, session)) {
    blockedReasons.push(`evidenceDir fuera de .codex-temp o scopes aprobados: ${resolvedEvidenceDir}`)
  }
  if (pathHasForbiddenSegment(resolvedEvidenceDir)) {
    blockedReasons.push(`evidenceDir contiene segmento prohibido: ${resolvedEvidenceDir}`)
  }
  const filesFound = fileList(resolvedEvidenceDir)
  for (const file of filesFound) {
    if (pathHasForbiddenSegment(file.relativePath) || pathHasForbiddenSegment(file.path)) {
      blockedReasons.push(`archivo prohibido en evidencia: ${file.relativePath}`)
    }
  }
  blockedReasons.push(...contentFindings(filesFound))
  const missing = filesFound.length ? missingExpectedEvidence(session, filesFound) : ensureArray(session.evidenceContract)
  if (!filesFound.length) {
    validationNotes.push('No se encontraron archivos de evidencia.')
  }
  if (missing.length) {
    validationNotes.push(`Evidencia esperada faltante: ${missing.join('; ')}`)
  }
  let evidenceStatus = 'accepted_for_review'
  if (blockedReasons.length) {
    evidenceStatus = 'blocked'
  } else if (!filesFound.length) {
    evidenceStatus = 'missing_evidence'
  } else if (missing.length) {
    evidenceStatus = 'invalid_evidence'
  }
  return {
    evidenceStatus,
    externalToolExecutedByJefe: false,
    evidenceDir: resolvedEvidenceDir,
    filesFound,
    missingExpectedEvidence: missing,
    blockedReasons: unique(blockedReasons),
    validationNotes,
    nextAction: nextActionForEvidence(evidenceStatus),
    metadata: {
      generatedAt: nowIso(),
      sessionStatus: session.sessionStatus,
      operatorName: input.operatorName || '',
      notes: input.notes || '',
      noExternalToolExecuted: true,
      originalMetadata: input.metadata || {},
      options,
    },
  }
}

function nextActionForEvidence(status) {
  if (status === 'accepted_for_review') {
    return 'Preparar post-execution review futuro.'
  }
  if (status === 'missing_evidence') {
    return 'Solicitar evidencia al operador humano.'
  }
  if (status === 'invalid_evidence') {
    return 'Completar evidencia faltante antes de review.'
  }
  return 'Bloquear intake y revisar evidencia insegura.'
}

function writeManualEvidenceIntake(outputDir, intake) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const intakePath = path.join(resolvedOutputDir, 'manual-evidence-intake.json')
  const summaryPath = path.join(resolvedOutputDir, 'manual-evidence-summary.md')
  const filesPath = path.join(resolvedOutputDir, 'evidence-files.md')
  const blockedPath = path.join(resolvedOutputDir, 'blocked-evidence.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...intake,
    artifacts: [intakePath, summaryPath, filesPath, blockedPath, readmePath],
  }
  writeJsonFile(intakePath, serializable)
  fs.writeFileSync(
    summaryPath,
    [
      '# Manual Evidence Intake',
      '',
      `Status: ${intake.evidenceStatus}.`,
      'externalToolExecutedByJefe=false.',
      `Evidence dir: ${intake.evidenceDir || '(none)'}.`,
      `Next action: ${intake.nextAction}.`,
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    filesPath,
    [
      '# Evidence Files',
      '',
      ...(intake.filesFound?.length ? intake.filesFound.map((file) => `- ${file.relativePath} (${file.size} bytes)`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    blockedPath,
    [
      '# Blocked Evidence',
      '',
      ...(intake.blockedReasons?.length ? intake.blockedReasons.map((item) => `- ${item}`) : ['- None']),
      '',
      'Missing expected evidence:',
      ...(intake.missingExpectedEvidence?.length ? intake.missingExpectedEvidence.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    readmePath,
    [
      '# Manual Evidence Intake',
      '',
      'This intake records human-provided evidence only.',
      'JEFE did not execute Blender, Unity or MCP.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    intakePath,
    summaryPath,
    filesPath,
    blockedPath,
    readmePath,
    intake: serializable,
  }
}

function deriveManualSupervisedExecutionStatus(session = {}, evidence = null) {
  if (session.sessionStatus === 'aborted') {
    return 'aborted'
  }
  if (!evidence) {
    return session.sessionStatus === 'ready_for_manual_operator' ? 'evidence_pending' : session.sessionStatus
  }
  if (evidence.evidenceStatus === 'accepted_for_review') {
    return 'evidence_submitted'
  }
  if (evidence.evidenceStatus === 'blocked' || evidence.evidenceStatus === 'invalid_evidence') {
    return 'evidence_invalid'
  }
  return 'evidence_pending'
}

function abortManualSupervisedExecutionSession(session = {}, reason = '') {
  const aborted = {
    ...session,
    sessionStatus: 'aborted',
    executionAllowed: false,
    automaticExecutionAllowed: false,
    externalToolExecutedByJefe: false,
    nextAction: 'Sesion abortada; no ejecutar herramientas y conservar evidencia del aborto.',
    metadata: {
      ...(session.metadata || {}),
      abortedAt: nowIso(),
      abortReason: reason || 'Abortado por operador.',
      noExternalToolExecuted: true,
    },
  }
  return aborted
}

module.exports = {
  loadExecutionPermitBundle,
  buildManualSupervisedExecutionSession,
  validateManualSupervisedExecutionSession,
  writeManualSupervisedExecutionSession,
  summarizeManualSupervisedExecutionSession,
  buildManualOperatorRunbook,
  validateManualEvidenceIntake,
  writeManualEvidenceIntake,
  deriveManualSupervisedExecutionStatus,
  abortManualSupervisedExecutionSession,
  loadManualSupervisedExecutionSession,
  summarizeExternalToolExecutionPermitBundle,
}
