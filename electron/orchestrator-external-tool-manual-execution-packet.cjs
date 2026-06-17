const fs = require('node:fs')
const path = require('node:path')

const {
  validateSafeOutputDir,
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

function normalizeReadinessReview(value = {}) {
  if (value.review && value.readinessStatus === undefined) {
    return value.review
  }
  return value
}

function loadExternalToolReadinessReview(reviewPath) {
  if (!reviewPath) {
    return {
      status: 'missing',
      path: '',
      review: null,
      missingReason: 'readiness review path faltante',
    }
  }
  const resolved = path.resolve(reviewPath)
  if (!fs.existsSync(resolved)) {
    return {
      status: 'missing',
      path: resolved,
      review: null,
      missingReason: `readiness review inexistente: ${reviewPath}`,
    }
  }
  return {
    status: 'present',
    path: resolved,
    review: normalizeReadinessReview(readJsonFile(resolved)),
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
    'No generar builds.',
    'No instalar addons.',
    'No abrir GUI automaticamente.',
    'No ejecutar Blender real sin aprobacion humana explicita.',
    'No abrir Unity real sin aprobacion humana explicita.',
    'No invocar MCP real sin aprobacion humana explicita.',
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

function toolPacketRules(toolKind) {
  if (toolKind === 'blender') {
    return {
      missingInputs: [
        'asset brief',
        'source references',
        'approved input scope',
        'approved output scope',
        'expected format',
        'visual checklist',
      ],
      approvalChecklist: [
        'Aprobar asset brief y referencias visuales.',
        'Aprobar carpeta de input.',
        'Aprobar carpeta de output/export.',
        'Aprobar formato esperado y checklist visual.',
        'Confirmar que Blender no se ejecuta desde JEFE en este paso.',
      ],
      expectedEvidence: [
        'previews futuros',
        'manual operator notes',
        'archivos exportados futuros dentro del scope aprobado',
        'preview/export checklist',
      ],
      validationPlan: [
        'Validar naming, materiales y formato contra checklist visual.',
        'Revisar git status/diff si hubo evidencia manual futura.',
        'Confirmar que no se ejecuto Python Blender desde JEFE.',
      ],
      executionPreconditions: [
        'Asset brief revisado.',
        'Referencias visuales revisadas.',
        'Carpetas de entrada y salida aprobadas.',
        'Aprobacion humana explicita registrada.',
      ],
      manualSteps: [
        'Leer el asset brief completo.',
        'Confirmar referencias/source references.',
        'Confirmar input scope y output scope.',
        'Preparar evidencia manual requerida antes de cualquier ejecucion futura.',
        'No ejecutar Blender desde JEFE.',
      ],
    }
  }
  if (toolKind === 'unity') {
    return {
      missingInputs: [
        'approved Unity project/sandbox',
        'approved branch or sandbox',
        'assets de entrada',
        'target scene or prefab',
        'post-validation checklist',
      ],
      approvalChecklist: [
        'Aprobar proyecto Unity y rama/sandbox.',
        'Aprobar assets de entrada.',
        'Aprobar escena/prefab objetivo.',
        'Confirmar validaciones posteriores.',
        'Confirmar que Unity no se abre desde JEFE en este paso.',
      ],
      expectedEvidence: [
        'logs futuros de importacion',
        'screenshots futuros',
        'prefab/scene report futuro',
        'manual Unity integration report',
      ],
      validationPlan: [
        'Confirmar que no se generaron builds.',
        'Confirmar que no se borraron assets.',
        'Revisar reporte de escena/prefab.',
        'Revisar git status/diff si hubo ejecucion manual futura.',
      ],
      executionPreconditions: [
        'Proyecto Unity aprobado.',
        'Rama/sandbox aprobada.',
        'Assets de entrada aprobados.',
        'Escena/prefab objetivo aprobado.',
        'Aprobacion humana explicita registrada.',
      ],
      manualSteps: [
        'Revisar proyecto Unity y rama/sandbox.',
        'Confirmar assets de entrada.',
        'Confirmar escena o prefab objetivo.',
        'Preparar reporte de validacion manual futuro.',
        'No abrir Unity desde JEFE.',
      ],
    }
  }
  if (toolKind === 'mcp') {
    return {
      missingInputs: [
        'MCP capability exacta',
        'future permission scopes',
        'redacted expected payload',
        'expected outputs',
      ],
      approvalChecklist: [
        'Aprobar capability MCP exacta.',
        'Aprobar scopes futuros.',
        'Revisar permisos/credenciales futuras sin exponer secretos.',
        'Aprobar payload esperado redactado.',
        'Confirmar que MCP no se invoca en este paso.',
      ],
      expectedEvidence: [
        'tool routing report',
        'permission checklist without secrets',
        'redacted payload plan',
        'approval and credentials checklist sin secretos',
      ],
      validationPlan: [
        'Confirmar que no se usaron credenciales reales.',
        'Confirmar que no hubo llamadas de red.',
        'Confirmar que no hubo servicios externos reales.',
        'Revisar routing report sin secretos.',
      ],
      executionPreconditions: [
        'Capability MCP exacta documentada.',
        'Scopes futuros aprobados.',
        'Payload esperado redactado.',
        'Outputs esperados documentados.',
        'Aprobacion humana explicita registrada.',
      ],
      manualSteps: [
        'Revisar capability MCP exacta.',
        'Revisar scopes futuros.',
        'Revisar payload esperado sin secretos.',
        'Preparar evidencia de routing sin credenciales.',
        'No invocar MCP desde JEFE.',
      ],
    }
  }
  return {
    missingInputs: ['external tool brief', 'approved scope'],
    approvalChecklist: ['Aprobar herramienta, scope y evidencia esperada.'],
    expectedEvidence: ['manual operator notes'],
    validationPlan: ['Revisar repo status/diff.'],
    executionPreconditions: ['Aprobacion humana explicita registrada.'],
    manualSteps: ['Revisar scope y restricciones antes de cualquier accion futura.'],
  }
}

function derivePacketStatus(reviewLoaded, review, missingInputs, missingOutputs) {
  if (!reviewLoaded || reviewLoaded.status === 'missing' || !review) {
    return 'missing_artifacts'
  }
  if (review.readinessStatus === 'missing_artifacts') {
    return 'missing_artifacts'
  }
  if (review.readinessStatus === 'blocked' || ensureArray(review.blockedReasons).length > 0) {
    return 'blocked'
  }
  if (missingInputs.length > 0 || missingOutputs.length > 0) {
    return 'needs_missing_inputs'
  }
  return 'ready_for_human_review'
}

function buildApprovalRequest(review = {}, packet = {}) {
  const label = toolLabel(packet.toolKind)
  return [
    `Solicitud de aprobacion humana para futura ejecucion manual supervisada de ${label}.`,
    `Worker: ${packet.workerId || '(sin worker)'}.`,
    `Capability: ${packet.capability || '(sin capability)'}.`,
    `Riesgo: ${packet.riskLevel || 'unknown'}.`,
    `Readiness actual: ${packet.readinessStatus || 'unknown'}.`,
    packet.humanApprovalRequest ? `Solicitud adicional: ${packet.humanApprovalRequest}.` : '',
    'Esta solicitud no autoriza ejecucion automatica.',
    'No se autoriza abrir GUI, ejecutar Blender/Unity, invocar MCP, usar credenciales, deployar ni escribir fuera de scope.',
    review.nextAction ? `Siguiente accion sugerida: ${review.nextAction}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildOperatorChecklist(packet = {}) {
  return unique([
    'Revisar inputs faltantes.',
    'Revisar rutas y scopes permitidos.',
    'Revisar rutas y acciones prohibidas.',
    'Confirmar evidencia esperada.',
    'Confirmar validaciones posteriores.',
    'Confirmar condiciones de aborto.',
    'Confirmar que no existe autorizacion automatica de ejecucion.',
    ...(packet.toolRules?.manualSteps || []),
  ])
}

function buildAbortConditions(packet = {}) {
  return unique([
    'Falta cualquier input requerido.',
    'Falta aprobacion humana explicita.',
    'Aparece una ruta prohibida o fuera de scope.',
    'Se requiere credencial real o secreto.',
    'Se requiere instalar dependencias, addons, Docker o paquetes.',
    'Se requiere deploy, servicio externo, pago real o DB productiva.',
    'Se intenta abrir GUI automaticamente.',
    'Se intenta ejecutar Blender, abrir Unity o invocar MCP desde JEFE.',
    'Git status muestra cambios versionados inesperados antes de la ejecucion futura.',
    ...(packet.blockedReasons || []).map((reason) => `Bloqueo heredado del readiness review: ${reason}`),
  ])
}

function buildGoNoGoSummary(packet = {}) {
  const go = packet.packetStatus === 'ready_for_human_review'
  return [
    `Decision: ${go ? 'GO para revision humana' : 'NO-GO para ejecucion real'}.`,
    `Packet status: ${packet.packetStatus}.`,
    `Readiness status: ${packet.readinessStatus || 'unknown'}.`,
    packet.missingInputs?.length ? `Inputs faltantes: ${packet.missingInputs.join('; ')}.` : '',
    packet.missingOutputs?.length ? `Outputs faltantes: ${packet.missingOutputs.join('; ')}.` : '',
    packet.blockedReasons?.length ? `Bloqueos: ${packet.blockedReasons.join('; ')}.` : '',
    'Este paquete no autoriza ejecucion automatica ni ejecucion real de herramientas externas.',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildManualOperatorPrompt(packet = {}) {
  return [
    `Manual execution packet para ${toolLabel(packet.toolKind)}.`,
    packet.approvalRequest,
    '',
    'Antes de cualquier ejecucion futura, el operador humano debe:',
    ...packet.operatorChecklist.map((item) => `- ${item}`),
    '',
    'Abortar si aparece cualquier condicion de aborto.',
    'No ejecutar herramientas desde JEFE con este paquete.',
  ].join('\n')
}

function buildExternalToolManualExecutionPacket(input = {}, options = {}) {
  const loaded = input.readinessReview
    ? {
        status: 'present',
        path: input.readinessReviewPath ? path.resolve(input.readinessReviewPath) : '',
        review: normalizeReadinessReview(input.readinessReview),
        missingReason: '',
      }
    : loadExternalToolReadinessReview(input.readinessReviewPath)
  const review = loaded.review || null
  const toolKind = toolKindForCapability(input.capability || review?.capability, review?.toolKind)
  const rules = toolPacketRules(toolKind)
  const reviewHasMissingInputs = review && Object.prototype.hasOwnProperty.call(review, 'missingInputs')
  const reviewHasMissingOutputs = review && Object.prototype.hasOwnProperty.call(review, 'missingOutputs')
  const missingInputs = unique(reviewHasMissingInputs ? ensureArray(review.missingInputs) : rules.missingInputs)
  const missingOutputs = unique(reviewHasMissingOutputs ? ensureArray(review.missingOutputs) : [])
  const packetSeed = {
    humanApprovalRequest: input.humanApprovalRequest || '',
    toolKind,
    riskLevel: review?.riskLevel || (toolKind === 'mcp' ? 'critical' : 'high'),
    workerId: input.workerId || review?.workerId || '',
    capability: input.capability || review?.capability || '',
    readinessStatus: review?.readinessStatus || '',
  }
  const packet = {
    packetStatus: derivePacketStatus(loaded, review, missingInputs, missingOutputs),
    workerId: packetSeed.workerId,
    workerDisplayName: review?.workerDisplayName || '',
    capability: packetSeed.capability,
    toolKind,
    readinessStatus: packetSeed.readinessStatus,
    missingInputs,
    missingOutputs,
    requiredHumanApprovals: unique([
      ...ensureArray(review?.requiredHumanApprovals),
      'Aprobacion humana explicita antes de cualquier ejecucion real futura.',
    ]),
    allowedScopes: unique([
      ...ensureArray(review?.allowedScopes),
      '.codex-temp',
    ]),
    forbiddenActions: unique([
      ...hardForbiddenActions(),
      ...ensureArray(review?.forbiddenActions),
    ]),
    forbiddenPaths: unique([
      ...ensureArray(review?.forbiddenPaths),
      'web-prueba',
      '.env',
      'node_modules',
      'Dockerfile',
      'docker-compose',
      '.git',
    ]),
    operatorChecklist: [],
    approvalChecklist: unique([
      ...rules.approvalChecklist,
      ...ensureArray(review?.requiredHumanApprovals),
    ]),
    executionPreconditions: unique(rules.executionPreconditions),
    abortConditions: [],
    expectedEvidence: unique([
      ...ensureArray(review?.evidenceChecklist),
      ...rules.expectedEvidence,
    ]),
    validationPlan: unique([
      ...ensureArray(review?.validationChecklist),
      ...rules.validationPlan,
    ]),
    goNoGoSummary: '',
    manualOperatorPrompt: '',
    approvalRequest: '',
    blockedReasons: unique(ensureArray(review?.blockedReasons)),
    riskLevel: packetSeed.riskLevel,
    metadata: {
      generatedAt: nowIso(),
      targetProject: input.targetProject || review?.metadata?.targetProject || '',
      operatorName: input.operatorName || '',
      noExternalToolExecuted: true,
      executionAuthorized: false,
      readinessReviewPath: loaded.path,
      readinessReviewStatus: loaded.status,
      readinessReviewMissingReason: loaded.missingReason,
      sourceReadinessGeneratedAt: review?.metadata?.generatedAt || '',
      originalMetadata: input.metadata || {},
      toolLabel: toolLabel(toolKind),
    },
  }
  packet.approvalRequest = buildApprovalRequest(review || {}, {
    ...packet,
    humanApprovalRequest: input.humanApprovalRequest || '',
  })
  packet.toolRules = rules
  packet.operatorChecklist = buildOperatorChecklist(packet)
  packet.abortConditions = buildAbortConditions(packet)
  delete packet.toolRules
  packet.goNoGoSummary = buildGoNoGoSummary(packet)
  packet.manualOperatorPrompt = buildManualOperatorPrompt(packet)
  return packet
}

function validateExternalToolManualExecutionPacket(packet = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'ready_for_human_review',
    'needs_missing_inputs',
    'blocked',
    'missing_artifacts',
  ])
  if (!validStatuses.has(packet.packetStatus)) {
    issues.push(`packetStatus invalido: ${packet.packetStatus || '(vacio)'}`)
  }
  if (!packet.metadata?.noExternalToolExecuted) {
    issues.push('metadata debe declarar noExternalToolExecuted')
  }
  if (packet.metadata?.executionAuthorized === true) {
    issues.push('packet no debe autorizar ejecucion automaticamente')
  }
  if (!Array.isArray(packet.operatorChecklist) || !packet.operatorChecklist.length) {
    issues.push('operatorChecklist faltante')
  }
  if (!Array.isArray(packet.abortConditions) || !packet.abortConditions.length) {
    issues.push('abortConditions faltantes')
  }
  if (!Array.isArray(packet.forbiddenActions) || !packet.forbiddenActions.length) {
    issues.push('forbiddenActions faltantes')
  }
  if (!packet.approvalRequest) {
    issues.push('approvalRequest faltante')
  }
  if (!packet.goNoGoSummary) {
    issues.push('goNoGoSummary faltante')
  }
  if (
    packet.packetStatus !== 'missing_artifacts' &&
    (!packet.workerId || !packet.capability) &&
    options.allowMissingIdentity !== true
  ) {
    issues.push('workerId/capability faltantes')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeExternalToolManualExecutionPacket(packet = {}) {
  return [
    `Manual execution packet ${packet.packetStatus || 'unknown'} para ${packet.workerId || 'sin worker'} (${packet.capability || 'sin capability'}).`,
    `Readiness: ${packet.readinessStatus || 'unknown'}.`,
    `Tool: ${toolLabel(packet.toolKind)}.`,
    'No se ejecuto ninguna herramienta externa.',
    packet.goNoGoSummary || '',
  ]
    .filter(Boolean)
    .join(' ')
}

function markdownList(title, values) {
  return [
    `# ${title}`,
    '',
    ...(values?.length ? values.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n')
}

function buildPacketSummaryMarkdown(packet = {}) {
  return [
    '# Manual Execution Packet Summary',
    '',
    summarizeExternalToolManualExecutionPacket(packet),
    '',
    `Packet status: ${packet.packetStatus}`,
    `Readiness status: ${packet.readinessStatus || '(none)'}`,
    `Worker: ${packet.workerId || '(none)'}`,
    `Capability: ${packet.capability || '(none)'}`,
    `Risk: ${packet.riskLevel || '(none)'}`,
    '',
    'No external tool was executed.',
    '',
  ].join('\n')
}

function buildReadmeMarkdown(packet = {}) {
  return [
    '# External Tool Manual Execution Packet',
    '',
    summarizeExternalToolManualExecutionPacket(packet),
    '',
    'Artifacts:',
    '- manual-execution-packet.json',
    '- manual-execution-packet-summary.md',
    '- human-approval-request.md',
    '- operator-checklist.md',
    '- missing-inputs.md',
    '- go-no-go-summary.md',
    '- README.md',
    '',
    'Safety:',
    '- This packet does not authorize automatic execution.',
    '- No external tool was executed.',
    '- Human approval is required before any future real execution.',
    '',
  ].join('\n')
}

function writeExternalToolManualExecutionPacket(outputDir, packet) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolManualExecutionPacket(packet, {
    allowMissingIdentity: packet.packetStatus === 'missing_artifacts',
  })
  if (!validation.valid) {
    throw new Error(`Manual execution packet invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const packetPath = path.join(resolvedOutputDir, 'manual-execution-packet.json')
  const summaryPath = path.join(resolvedOutputDir, 'manual-execution-packet-summary.md')
  const approvalPath = path.join(resolvedOutputDir, 'human-approval-request.md')
  const checklistPath = path.join(resolvedOutputDir, 'operator-checklist.md')
  const missingInputsPath = path.join(resolvedOutputDir, 'missing-inputs.md')
  const goNoGoPath = path.join(resolvedOutputDir, 'go-no-go-summary.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...packet,
    artifacts: [
      packetPath,
      summaryPath,
      approvalPath,
      checklistPath,
      missingInputsPath,
      goNoGoPath,
      readmePath,
    ],
  }
  fs.writeFileSync(packetPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(summaryPath, buildPacketSummaryMarkdown(packet), 'utf8')
  fs.writeFileSync(
    approvalPath,
    [
      '# Human Approval Request',
      '',
      packet.approvalRequest,
      '',
      'Required approvals:',
      ...(packet.requiredHumanApprovals?.length ? packet.requiredHumanApprovals.map((item) => `- ${item}`) : ['- None']),
      '',
      'Not authorized yet:',
      '- Automatic execution.',
      '- Real external tool execution.',
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    checklistPath,
    [
      ...markdownList('Operator Checklist', packet.operatorChecklist).split('\n'),
      'Approval checklist:',
      ...(packet.approvalChecklist?.length ? packet.approvalChecklist.map((item) => `- ${item}`) : ['- None']),
      '',
      'Abort conditions:',
      ...(packet.abortConditions?.length ? packet.abortConditions.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    missingInputsPath,
    [
      ...markdownList('Missing Inputs', packet.missingInputs).split('\n'),
      'Missing outputs:',
      ...(packet.missingOutputs?.length ? packet.missingOutputs.map((item) => `- ${item}`) : ['- None']),
      '',
      'Allowed scopes:',
      ...(packet.allowedScopes?.length ? packet.allowedScopes.map((item) => `- ${item}`) : ['- None']),
      '',
      'Forbidden paths:',
      ...(packet.forbiddenPaths?.length ? packet.forbiddenPaths.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    goNoGoPath,
    [
      '# Go/No-Go Summary',
      '',
      packet.goNoGoSummary,
      '',
      'Expected evidence:',
      ...(packet.expectedEvidence?.length ? packet.expectedEvidence.map((item) => `- ${item}`) : ['- None']),
      '',
      'Validation plan:',
      ...(packet.validationPlan?.length ? packet.validationPlan.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(readmePath, buildReadmeMarkdown(packet), 'utf8')
  return {
    outputDir: resolvedOutputDir,
    packetPath,
    summaryPath,
    approvalPath,
    checklistPath,
    missingInputsPath,
    goNoGoPath,
    readmePath,
    packet: serializable,
  }
}

module.exports = {
  loadExternalToolReadinessReview,
  buildExternalToolManualExecutionPacket,
  validateExternalToolManualExecutionPacket,
  writeExternalToolManualExecutionPacket,
  summarizeExternalToolManualExecutionPacket,
}
