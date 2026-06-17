const fs = require('node:fs')
const path = require('node:path')

const {
  validateSafeOutputDir,
  findDangerousInstructions,
} = require('./orchestrator-planned-external-workers.cjs')

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

function normalizeManualExecutionPacket(value = {}) {
  if (value.packet && value.packetStatus === undefined) {
    return value.packet
  }
  return value
}

function loadManualExecutionPacket(packetPath) {
  if (!packetPath) {
    return {
      status: 'missing',
      path: '',
      packet: null,
      missingReason: 'manual execution packet path faltante',
    }
  }
  const resolved = path.resolve(packetPath)
  if (!fs.existsSync(resolved)) {
    return {
      status: 'missing',
      path: resolved,
      packet: null,
      missingReason: `manual execution packet inexistente: ${packetPath}`,
    }
  }
  return {
    status: 'present',
    path: resolved,
    packet: normalizeManualExecutionPacket(readJsonFile(resolved)),
    missingReason: '',
  }
}

function hardForbiddenActions() {
  return [
    'No tocar web-prueba.',
    'No crear ni modificar .env.',
    'No crear ni modificar node_modules.',
    'No usar Docker ni crear Dockerfile/docker-compose.',
    'No hacer deploy.',
    'No usar servicios externos reales.',
    'No activar pagos reales.',
    'No usar DB productiva.',
    'No pedir, crear ni guardar credenciales reales.',
    'No cambiar package.json ni package-lock.json.',
    'No escribir fuera de scope aprobado.',
    'No usar git add .',
    'No borrar assets fuera de scope.',
    'No abrir herramientas GUI automaticamente.',
    'No ejecutar Blender automaticamente.',
    'No ejecutar Unity automaticamente.',
    'No invocar MCP real.',
    'No instalar addons.',
    'No generar builds.',
    'No tocar escenas productivas sin aprobacion.',
    'No exportar a rutas no aprobadas.',
  ]
}

function toolKindForCapability(capability, fallback) {
  const value = String(capability || '')
  if (fallback) {
    return fallback
  }
  if (value.startsWith('asset.')) {
    return 'blender'
  }
  if (value.startsWith('unity.')) {
    return 'unity'
  }
  if (value.startsWith('mcp.') || value.startsWith('tool.')) {
    return 'mcp'
  }
  return 'unknown'
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

function toolApprovalRules(toolKind) {
  if (toolKind === 'blender') {
    return {
      requiredInputs: ['approved input folder', 'asset brief', 'source references'],
      expectedOutputs: ['approved output folder', 'future previews', 'future exported files'],
      evidenceRequired: ['preview/export checklist', 'visual checklist', 'manual operator notes'],
      validationRequired: ['material/name validation', 'repo status/diff review'],
      approvalConditions: [
        'Carpeta input aprobada.',
        'Carpeta output aprobada.',
        'Tipo de asset o accion futura documentada.',
        'No ejecutar Blender automaticamente.',
      ],
      nextAction: 'Completar inputs y conservar aprobacion humana formal antes de cualquier ejecucion manual futura de Blender.',
    }
  }
  if (toolKind === 'unity') {
    return {
      requiredInputs: ['approved Unity project/sandbox', 'approved branch or sandbox', 'input assets'],
      expectedOutputs: ['future prefab/scene report', 'future import logs'],
      evidenceRequired: ['screenshots futuros', 'prefab/scene report futuro', 'manual Unity integration report'],
      validationRequired: ['post-import validation', 'repo status/diff review', 'no builds generated'],
      approvalConditions: [
        'Proyecto Unity aprobado.',
        'Rama/sandbox aprobada.',
        'Assets de entrada aprobados.',
        'Escena/prefab objetivo documentado.',
        'No abrir Unity automaticamente.',
        'No generar builds.',
      ],
      nextAction: 'Completar proyecto/rama/assets y conservar aprobacion humana formal antes de cualquier ejecucion manual futura de Unity.',
    }
  }
  if (toolKind === 'mcp') {
    return {
      requiredInputs: ['exact MCP capability', 'future permission scopes', 'redacted expected payload'],
      expectedOutputs: ['routing report', 'redacted output plan'],
      evidenceRequired: ['permission checklist without secrets', 'tool routing report', 'redacted payload plan'],
      validationRequired: ['confirm no credentials were used', 'confirm no external calls were made'],
      approvalConditions: [
        'Capability MCP exacta aprobada.',
        'Scopes futuros aprobados.',
        'Payload esperado redactado.',
        'No registrar credenciales reales.',
        'No invocar MCP real.',
      ],
      nextAction: 'Completar capability/scopes/payload redactado y conservar aprobacion humana formal antes de cualquier invocacion MCP futura.',
    }
  }
  return {
    requiredInputs: ['approved external tool scope'],
    expectedOutputs: ['manual execution evidence'],
    evidenceRequired: ['manual operator notes'],
    validationRequired: ['repo status/diff review'],
    approvalConditions: ['Aprobacion humana explicita registrada.'],
    nextAction: 'Completar scope y aprobacion humana formal.',
  }
}

function pathSafetyFindings(values = []) {
  const findings = []
  for (const rawValue of values) {
    const value = String(rawValue || '').replaceAll('\\', '/')
    const lower = value.toLowerCase()
    if (!lower) {
      continue
    }
    if (lower.includes('web-prueba')) {
      findings.push(`scope prohibido web-prueba: ${value}`)
    }
    if (/(^|[/\s])\.env($|[/\s])/u.test(lower)) {
      findings.push(`scope prohibido .env: ${value}`)
    }
    if (lower.includes('node_modules')) {
      findings.push(`scope prohibido node_modules: ${value}`)
    }
    if (lower.includes('dockerfile') || lower.includes('docker-compose')) {
      findings.push(`scope prohibido Docker: ${value}`)
    }
    if (lower.includes('/.git/') || lower.endsWith('/.git') || lower === '.git') {
      findings.push(`scope prohibido .git: ${value}`)
    }
  }
  return unique(findings)
}

function isExpired(expiresAt, now = new Date()) {
  if (!expiresAt) {
    return false
  }
  const timestamp = Date.parse(expiresAt)
  if (Number.isNaN(timestamp)) {
    return false
  }
  return timestamp <= now.getTime()
}

function normalizeDecision(value) {
  const normalized = String(value || 'draft').trim().toLowerCase()
  if (['approved', 'denied', 'draft', 'revoked', 'expired'].includes(normalized)) {
    return normalized
  }
  return 'invalid'
}

function deriveApprovalStatus(decision, expiresAt, invalidationReasons) {
  if (invalidationReasons.length) {
    return decision === 'draft' ? 'draft' : 'invalid'
  }
  if (decision === 'approved' && isExpired(expiresAt)) {
    return 'expired'
  }
  return decision
}

function buildSafetySummary(record = {}) {
  return [
    `Approval status: ${record.approvalStatus}.`,
    `Approval usable: ${record.approvalUsable ? 'true' : 'false'}.`,
    'executionAuthorized permanece false en v0.1.',
    record.invalidationReasons?.length ? `Invalidaciones: ${record.invalidationReasons.join('; ')}.` : '',
    'Este registro no ejecuta herramientas reales.',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildNextAction(record = {}, rules = {}) {
  if (record.approvalStatus === 'approved' && record.approvalUsable) {
    return `Aprobacion humana formal registrada para revision futura de ${toolLabel(record.toolKind)}; completar preflight antes de cualquier ejecucion manual fuera de este bloque.`
  }
  if (record.approvalStatus === 'denied') {
    return 'No avanzar con ejecucion externa; registrar nueva aprobacion si cambia la decision humana.'
  }
  if (record.approvalStatus === 'revoked') {
    return 'Aprobacion revocada; bloquear cualquier ejecucion futura hasta nuevo registro formal.'
  }
  if (record.approvalStatus === 'expired') {
    return 'Aprobacion expirada; solicitar una nueva aprobacion humana formal.'
  }
  if (record.invalidationReasons?.length) {
    return `Corregir registro antes de usarlo: ${record.invalidationReasons.join('; ')}.`
  }
  return rules.nextAction || 'Completar datos de aprobacion humana.'
}

function isExternalToolHumanApprovalUsable(record, options = {}) {
  if (!record || record.approvalStatus !== 'approved') {
    return false
  }
  if (record.executionAuthorized === true) {
    return false
  }
  if (!record.approver?.name || !record.approvalReason) {
    return false
  }
  if (!record.approvedScopes?.length || !record.requiredInputs?.length) {
    return false
  }
  if (record.invalidationReasons?.length) {
    return false
  }
  if (isExpired(record.expiresAt, options.now || new Date())) {
    return false
  }
  return true
}

function buildExternalToolHumanApprovalRecord(input = {}, options = {}) {
  const loaded = input.manualExecutionPacket
    ? {
        status: 'present',
        path: input.manualExecutionPacketPath ? path.resolve(input.manualExecutionPacketPath) : '',
        packet: normalizeManualExecutionPacket(input.manualExecutionPacket),
        missingReason: '',
      }
    : loadManualExecutionPacket(input.manualExecutionPacketPath)
  const packet = loaded.packet || null
  const decision = normalizeDecision(input.approvalDecision)
  const toolKind = toolKindForCapability(packet?.capability, packet?.toolKind)
  const rules = toolApprovalRules(toolKind)
  const approvedScopes = unique(input.approvedScopes || [])
  const approvedInputs = unique(input.approvedInputs || [])
  const approvedOutputs = unique(input.approvedOutputs || [])
  const approvalConditions = unique([
    ...ensureArray(input.approvalConditions),
    ...rules.approvalConditions,
  ])
  const requiredInputs = unique([
    ...approvedInputs,
    ...ensureArray(packet?.missingInputs),
    ...rules.requiredInputs,
  ])
  const expectedOutputs = unique([
    ...approvedOutputs,
    ...ensureArray(packet?.missingOutputs),
    ...rules.expectedOutputs,
  ])
  const evidenceRequired = unique([
    ...ensureArray(packet?.expectedEvidence),
    ...rules.evidenceRequired,
  ])
  const validationRequired = unique([
    ...ensureArray(packet?.validationPlan),
    ...rules.validationRequired,
  ])
  const forbiddenActions = unique([
    ...hardForbiddenActions(),
    ...ensureArray(packet?.forbiddenActions),
  ])
  const safetyText = [
    input.approvalReason,
    ...approvedScopes,
    ...approvedInputs,
    ...approvedOutputs,
    ...approvalConditions,
  ]
  const dangerousFindings = findDangerousInstructions(safetyText)
  const dangerousReasons = dangerousFindings.map((finding) => `accion peligrosa: ${finding.label}`)
  const pathReasons = pathSafetyFindings([
    ...approvedScopes,
    ...approvedInputs,
    ...approvedOutputs,
  ])
  const invalidationReasons = unique([
    loaded.status === 'missing' ? loaded.missingReason : '',
    decision === 'invalid' ? `decision invalida: ${input.approvalDecision || '(vacia)'}` : '',
    decision === 'approved' && !input.approverName ? 'approverName faltante' : '',
    decision === 'approved' && !input.approvalReason ? 'approvalReason faltante' : '',
    decision === 'approved' && !approvedScopes.length ? 'approvedScopes faltantes' : '',
    decision === 'approved' && !requiredInputs.length ? 'requiredInputs faltantes' : '',
    input.expiration && Number.isNaN(Date.parse(input.expiration)) ? `expiration invalida: ${input.expiration}` : '',
    ...dangerousReasons,
    ...pathReasons,
  ])
  const approvalStatus = deriveApprovalStatus(decision, input.expiration, invalidationReasons)
  const record = {
    approvalStatus,
    approvalUsable: false,
    executionAuthorized: false,
    workerId: packet?.workerId || '',
    workerDisplayName: packet?.workerDisplayName || '',
    capability: packet?.capability || '',
    toolKind,
    approver: {
      name: input.approverName || '',
      role: input.approverRole || '',
    },
    approvalDecision: decision,
    approvalReason: input.approvalReason || '',
    approvedScopes,
    forbiddenActions,
    requiredInputs,
    expectedOutputs,
    evidenceRequired,
    validationRequired,
    approvalConditions,
    expiresAt: input.expiration || '',
    invalidationReasons,
    safetySummary: '',
    nextAction: '',
    metadata: {
      generatedAt: nowIso(),
      noExternalToolExecuted: true,
      executionAuthorized: false,
      manualExecutionPacketPath: loaded.path,
      manualExecutionPacketStatus: loaded.status,
      manualExecutionPacketMissingReason: loaded.missingReason,
      sourcePacketGeneratedAt: packet?.metadata?.generatedAt || '',
      packetStatus: packet?.packetStatus || '',
      packetApprovalUsable: packet?.packetStatus === 'ready_for_human_review',
      originalMetadata: input.metadata || {},
      toolLabel: toolLabel(toolKind),
    },
  }
  record.approvalUsable = isExternalToolHumanApprovalUsable(record, options)
  record.safetySummary = buildSafetySummary(record)
  record.nextAction = buildNextAction(record, rules)
  return record
}

function validateExternalToolHumanApprovalRecord(record = {}, options = {}) {
  const issues = []
  const validStatuses = new Set(['draft', 'approved', 'denied', 'revoked', 'expired', 'invalid'])
  if (!validStatuses.has(record.approvalStatus)) {
    issues.push(`approvalStatus invalido: ${record.approvalStatus || '(vacio)'}`)
  }
  if (record.executionAuthorized !== false) {
    issues.push('executionAuthorized debe ser false')
  }
  if (record.metadata?.executionAuthorized !== false) {
    issues.push('metadata.executionAuthorized debe ser false')
  }
  if (!record.metadata?.noExternalToolExecuted) {
    issues.push('metadata debe declarar noExternalToolExecuted')
  }
  if (record.approvalUsable && record.approvalStatus !== 'approved') {
    issues.push('approvalUsable solo puede ser true con approvalStatus approved')
  }
  if (record.approvalUsable && record.invalidationReasons?.length) {
    issues.push('approvalUsable true no puede tener invalidationReasons')
  }
  if (!Array.isArray(record.forbiddenActions) || !record.forbiddenActions.length) {
    issues.push('forbiddenActions faltantes')
  }
  if (!record.safetySummary) {
    issues.push('safetySummary faltante')
  }
  if (!record.nextAction) {
    issues.push('nextAction faltante')
  }
  if (
    record.approvalStatus !== 'invalid' &&
    record.approvalStatus !== 'draft' &&
    (!record.workerId || !record.capability) &&
    options.allowMissingIdentity !== true
  ) {
    issues.push('workerId/capability faltantes')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeExternalToolHumanApprovalRecord(record = {}) {
  return [
    `Human approval record ${record.approvalStatus || 'unknown'} para ${record.workerId || 'sin worker'} (${record.capability || 'sin capability'}).`,
    `Tool: ${toolLabel(record.toolKind)}.`,
    `Approver: ${record.approver?.name || '(sin approver)'}.`,
    `Usable: ${record.approvalUsable ? 'true' : 'false'}.`,
    'executionAuthorized=false.',
    'No se ejecuto ninguna herramienta externa.',
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

function writeExternalToolHumanApprovalRecord(outputDir, record) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolHumanApprovalRecord(record, {
    allowMissingIdentity: ['invalid', 'draft'].includes(record.approvalStatus),
  })
  if (!validation.valid) {
    throw new Error(`Human approval record invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const recordPath = path.join(resolvedOutputDir, 'human-approval-record.json')
  const summaryPath = path.join(resolvedOutputDir, 'human-approval-summary.md')
  const approvedScopePath = path.join(resolvedOutputDir, 'approved-scope.md')
  const conditionsPath = path.join(resolvedOutputDir, 'approval-conditions.md')
  const nextActionPath = path.join(resolvedOutputDir, 'next-action.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...record,
    artifacts: [
      recordPath,
      summaryPath,
      approvedScopePath,
      conditionsPath,
      nextActionPath,
      readmePath,
    ],
  }
  fs.writeFileSync(recordPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# Human Approval Summary',
      '',
      summarizeExternalToolHumanApprovalRecord(record),
      '',
      record.safetySummary,
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    approvedScopePath,
    [
      ...markdownList('Approved Scopes', record.approvedScopes).split('\n'),
      'Forbidden actions:',
      ...(record.forbiddenActions?.length ? record.forbiddenActions.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    conditionsPath,
    [
      ...markdownList('Approval Conditions', record.approvalConditions).split('\n'),
      'Required inputs:',
      ...(record.requiredInputs?.length ? record.requiredInputs.map((item) => `- ${item}`) : ['- None']),
      '',
      'Expected outputs:',
      ...(record.expectedOutputs?.length ? record.expectedOutputs.map((item) => `- ${item}`) : ['- None']),
      '',
      'Evidence required:',
      ...(record.evidenceRequired?.length ? record.evidenceRequired.map((item) => `- ${item}`) : ['- None']),
      '',
      'Validation required:',
      ...(record.validationRequired?.length ? record.validationRequired.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    nextActionPath,
    [
      '# Next Action',
      '',
      record.nextAction,
      '',
      'Invalidation reasons:',
      ...(record.invalidationReasons?.length ? record.invalidationReasons.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Human Approval Record',
      '',
      summarizeExternalToolHumanApprovalRecord(record),
      '',
      'Artifacts:',
      '- human-approval-record.json',
      '- human-approval-summary.md',
      '- approved-scope.md',
      '- approval-conditions.md',
      '- next-action.md',
      '- README.md',
      '',
      'Safety:',
      '- executionAuthorized is always false in v0.1.',
      '- This record does not execute external tools.',
      '- Human approval still requires a future controlled execution step.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    recordPath,
    summaryPath,
    approvedScopePath,
    conditionsPath,
    nextActionPath,
    readmePath,
    record: serializable,
  }
}

module.exports = {
  loadManualExecutionPacket,
  buildExternalToolHumanApprovalRecord,
  validateExternalToolHumanApprovalRecord,
  writeExternalToolHumanApprovalRecord,
  summarizeExternalToolHumanApprovalRecord,
  isExternalToolHumanApprovalUsable,
}
