const fs = require('node:fs')
const path = require('node:path')

const {
  getDefaultToolWorkerRegistry,
  listToolWorkers,
  findToolWorkersForCapability,
} = require('./orchestrator-tool-worker-registry.cjs')

const {
  validateSafeOutputDir,
  findDangerousInstructions,
} = require('./orchestrator-planned-external-workers.cjs')

const EXTERNAL_TOOL_CAPABILITIES = new Set([
  'asset.blender.create',
  'asset.blender.modify',
  'asset.export.fbx',
  'asset.render.preview',
  'unity.import.assets',
  'unity.validate.scene',
  'unity.generate.prefab',
  'unity.run.tests',
  'mcp.invoke',
  'tool.discover',
  'tool.route',
])

const GLOBAL_FORBIDDEN_ACTIONS = [
  'No tocar web-prueba.',
  'No crear ni modificar .env.',
  'No crear ni modificar node_modules.',
  'No crear Dockerfile ni docker-compose.',
  'No hacer deploy.',
  'No usar servicios externos reales.',
  'No activar pagos reales.',
  'No usar DB productiva.',
  'No pedir, crear ni guardar credenciales reales.',
  'No cambiar package.json ni package-lock.json sin autorizacion explicita.',
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

const PLAN_ONLY_PATTERN = /\b(planificar|documentar|preparar\s+plan|preparar\s+handoff|readiness|routing|checklist|resumen|summary|revision|revisar)\b/iu

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

function normalizeHandoff(input = {}) {
  const handoff = input.handoff || {}
  return handoff.handoff ? handoff.handoff : handoff
}

function workerTypeForCapability(capability) {
  const value = String(capability || '')
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

function selectExternalWorker(request, registry) {
  if (request.workerId) {
    return listToolWorkers(registry).find((worker) => worker.id === request.workerId) || null
  }
  return findToolWorkersForCapability(registry, request.capability || {})[0] || null
}

function isPlanOnlyRequest(request) {
  const text = [
    request.requestedAction,
    request.handoff?.taskTitle,
    request.handoff?.handoffStatus,
  ]
    .filter(Boolean)
    .join('\n')

  if (request.approvalMode === 'plan_only') {
    return true
  }
  if (request.handoff?.handoffStatus === 'plan_only') {
    return true
  }
  return PLAN_ONLY_PATTERN.test(text)
}

function normalizePathToken(value) {
  return String(value || '').replaceAll('\\', '/').trim()
}

function pathFindingFor(value) {
  const normalized = normalizePathToken(value).toLowerCase()
  if (!normalized) {
    return null
  }
  if (normalized.includes('web-prueba')) {
    return { label: 'web-prueba', evidence: value }
  }
  if (/(^|[/\s])\.env($|[/\s])/u.test(normalized)) {
    return { label: '.env', evidence: value }
  }
  if (normalized.includes('node_modules')) {
    return { label: 'node_modules', evidence: value }
  }
  if (normalized.includes('dockerfile') || normalized.includes('docker-compose')) {
    return { label: 'Docker', evidence: value }
  }
  if (normalized.includes('/.git/') || normalized.endsWith('/.git') || normalized === '.git') {
    return { label: '.git', evidence: value }
  }
  return null
}

function findForbiddenPaths(request) {
  const values = [
    ...(request.targetPaths || []),
    ...(request.inputArtifacts || []),
    ...(request.outputArtifacts || []),
  ]
  return values.map(pathFindingFor).filter(Boolean)
}

function approvedPathHintsForWorkerType(type) {
  if (type === 'blender') {
    return ['approved asset sandbox', 'approved art source folder', '.codex-temp']
  }
  if (type === 'unity') {
    return ['approved Unity sandbox branch', 'approved Unity asset folder', '.codex-temp']
  }
  if (type === 'mcp') {
    return ['planned MCP routing only', '.codex-temp']
  }
  return ['.codex-temp']
}

function isConcretePath(value) {
  const normalized = normalizePathToken(value)
  return normalized.includes('/') || normalized.includes(':') || normalized.startsWith('.')
}

function approvedPathReason(value, workerType) {
  const normalized = normalizePathToken(value).toLowerCase()
  if (!normalized) {
    return ''
  }
  if (normalized.startsWith('.codex-temp/') || normalized.includes('/.codex-temp/')) {
    return '.codex-temp'
  }
  if (normalized.includes('approved') || normalized.includes('sandbox')) {
    return 'approved sandbox hint'
  }
  if (!isConcretePath(value)) {
    return 'descriptive scope'
  }
  if (workerType === 'mcp' && normalized.includes('planned')) {
    return 'planned routing hint'
  }
  return ''
}

function classifyPaths(request, workerType) {
  const values = unique([
    ...(request.targetPaths || []),
    ...(request.inputArtifacts || []),
    ...(request.outputArtifacts || []),
  ])
  const allowedPaths = []
  const forbiddenPaths = []
  const pathWarnings = []

  for (const value of values) {
    const forbidden = pathFindingFor(value)
    if (forbidden) {
      forbiddenPaths.push(`${value} (${forbidden.label})`)
      continue
    }
    const reason = approvedPathReason(value, workerType)
    if (reason) {
      allowedPaths.push(`${value} (${reason})`)
      continue
    }
    pathWarnings.push(`ruta requiere scope aprobado explicito: ${value}`)
  }

  return {
    allowedPaths,
    forbiddenPaths,
    pathWarnings,
  }
}

function toolRulesForType(type) {
  if (type === 'blender') {
    return {
      requiredApprovals: [
        'Aprobacion humana para cualquier apertura o ejecucion manual de Blender.',
        'Scope aprobado de carpeta de entrada.',
        'Scope aprobado de carpeta de salida/export.',
      ],
      manualExecutionChecklist: [
        'Confirmar brief de asset y referencias aprobadas.',
        'Confirmar carpeta sandbox de entrada y salida.',
        'Confirmar que no se instalaran addons.',
        'Confirmar que JEFE no ejecutara Blender automaticamente.',
      ],
      expectedEvidence: [
        'approval-gate JSON',
        'manual Blender execution notes si se aprueba fuera de JEFE',
        'preview/export checklist',
        'rutas de entrada/salida aprobadas',
      ],
      validationPlan: [
        'Revisar diff/status del repo.',
        'Validar que los artefactos queden dentro del scope aprobado.',
        'Adjuntar evidencia visual/manual si la ejecucion futura ocurre fuera de JEFE.',
      ],
      extraForbiddenActions: [
        'No ejecutar Blender automaticamente en v0.6.',
        'No instalar addons.',
        'No exportar a rutas no aprobadas.',
      ],
    }
  }
  if (type === 'unity') {
    return {
      requiredApprovals: [
        'Aprobacion humana para cualquier apertura o ejecucion manual de Unity.',
        'Proyecto/rama/sandbox Unity aprobado.',
        'Carpeta de assets aprobada.',
      ],
      manualExecutionChecklist: [
        'Confirmar proyecto Unity objetivo y rama/sandbox.',
        'Confirmar assets de entrada aprobados.',
        'Confirmar que no se generaran builds.',
        'Confirmar que JEFE no abrira Unity automaticamente.',
      ],
      expectedEvidence: [
        'approval-gate JSON',
        'Unity import/integration notes si se aprueba fuera de JEFE',
        'scene/prefab validation checklist',
        'rutas de assets aprobadas',
      ],
      validationPlan: [
        'Revisar diff/status del repo.',
        'Validar reporte de importacion o checklist manual.',
        'Confirmar que no hubo builds ni borrado de assets.',
      ],
      extraForbiddenActions: [
        'No abrir Unity automaticamente en v0.6.',
        'No generar builds.',
        'No borrar assets.',
        'No tocar escenas productivas sin aprobacion.',
      ],
    }
  }
  if (type === 'mcp') {
    return {
      requiredApprovals: [
        'Aprobacion humana para cualquier invocacion MCP futura.',
        'Permisos/capability MCP definidos.',
        'Revision humana de credenciales sin exponer secretos.',
      ],
      manualExecutionChecklist: [
        'Confirmar herramienta MCP y capability deseada.',
        'Confirmar inputs/outputs esperados.',
        'Confirmar que no se usaran credenciales reales en JEFE.',
        'Confirmar que JEFE no invocara MCP real en v0.6.',
      ],
      expectedEvidence: [
        'approval-gate JSON',
        'MCP readiness plan',
        'tool routing report',
        'approval and credentials checklist sin secretos',
      ],
      validationPlan: [
        'Revisar diff/status del repo.',
        'Validar que no se usaron credenciales.',
        'Validar que no hubo servicios externos reales.',
      ],
      extraForbiddenActions: [
        'No invocar MCP real en v0.6.',
        'No usar credenciales.',
        'No usar servicios externos reales.',
      ],
    }
  }
  return {
    requiredApprovals: ['Aprobacion humana antes de cualquier herramienta externa.'],
    manualExecutionChecklist: ['Definir worker, capability, scope y evidencia esperada.'],
    expectedEvidence: ['approval-gate JSON', 'manual evidence report'],
    validationPlan: ['Revisar diff/status del repo.'],
    extraForbiddenActions: [],
  }
}

function buildExternalToolApprovalRequest(input = {}, options = {}) {
  const handoff = normalizeHandoff(input)
  const request = {
    handoffPath: input.handoffPath || '',
    handoff: Object.keys(handoff).length ? handoff : null,
    workerId: input.workerId || handoff.workerId || '',
    capability: input.capability || handoff.capability || '',
    requestedAction: input.requestedAction || handoff.taskTitle || '',
    targetProject: input.targetProject || handoff.targetProject || '',
    targetPaths: unique(input.targetPaths || handoff.targetPaths || []),
    inputArtifacts: unique(input.inputArtifacts || handoff.requiredInputs || []),
    outputArtifacts: unique(input.outputArtifacts || handoff.expectedOutputs || []),
    approvalMode: input.approvalMode || '',
    humanApproval: input.humanApproval === true,
    constraints: unique(input.constraints || []),
    metadata: {
      ...(input.metadata || {}),
      generatedAt: nowIso(),
      dryRun: true,
      source: input.handoffPath ? 'handoff-file' : input.handoff ? 'handoff-object' : 'direct-args',
      ...options.metadata,
    },
  }
  return request
}

function evaluateExternalToolApprovalRequest(request, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const worker = selectExternalWorker(request, registry)
  const workerType = workerTypeForCapability(request.capability)
  const rules = toolRulesForType(workerType)
  const pathClassification = classifyPaths(request, workerType)
  const dangerous = findDangerousInstructions([
    request.requestedAction,
    request.capability,
    request.workerId,
    request.targetProject,
    ...(request.targetPaths || []),
    ...(request.inputArtifacts || []),
    ...(request.outputArtifacts || []),
    ...(request.constraints || []),
  ])
  const forbiddenPaths = findForbiddenPaths(request)
  const blockedReasons = []

  if (!request.capability) {
    blockedReasons.push('capability faltante')
  } else if (!EXTERNAL_TOOL_CAPABILITIES.has(request.capability)) {
    blockedReasons.push(`capability externa no soportada: ${request.capability}`)
  }
  if (!worker) {
    blockedReasons.push('no_matching_worker')
  }
  if (request.handoff?.handoffStatus === 'blocked') {
    blockedReasons.push('handoff planificado ya estaba bloqueado')
  }
  if (dangerous.length) {
    blockedReasons.push(...dangerous.map((finding) => `accion peligrosa: ${finding.label}`))
  }
  if (forbiddenPaths.length) {
    blockedReasons.push(...forbiddenPaths.map((finding) => `ruta prohibida: ${finding.label}`))
  }

  const planOnly = isPlanOnlyRequest(request)
  let gateStatus = 'requires_human_approval'
  if (blockedReasons.length) {
    gateStatus = 'blocked'
  } else if (planOnly) {
    gateStatus = 'plan_only'
  } else if (request.humanApproval) {
    gateStatus = 'approved_for_manual_execution'
  }

  const allowedScopes = unique([
    ...(worker?.allowedScopes || approvedPathHintsForWorkerType(workerType)),
    ...approvedPathHintsForWorkerType(workerType),
  ])
  const forbiddenActions = unique([
    ...GLOBAL_FORBIDDEN_ACTIONS,
    ...(worker?.forbiddenActions || []),
    ...rules.extraForbiddenActions,
  ])
  const warnings = unique([
    ...(worker?.status === 'planned' ? ['worker planned: no automatic execution'] : []),
    ...(worker?.executionMode === 'planned' ? ['executionMode planned'] : []),
    ...(request.humanApproval ? ['humanApproval simulated: state only, no execution'] : ['requires human approval before execution']),
    ...pathClassification.pathWarnings,
  ])

  return {
    gateStatus,
    workerId: worker?.id || request.workerId || '',
    workerDisplayName: worker?.displayName || '',
    capability: request.capability,
    requestedAction: request.requestedAction,
    targetProject: request.targetProject,
    riskLevel: worker?.riskLevel || (workerType === 'mcp' ? 'critical' : 'high'),
    requiredApprovals: rules.requiredApprovals,
    allowedScopes,
    allowedPaths: pathClassification.allowedPaths,
    forbiddenPaths: pathClassification.forbiddenPaths,
    forbiddenActions,
    blockedReasons: unique(blockedReasons),
    manualExecutionChecklist: rules.manualExecutionChecklist,
    expectedEvidence: rules.expectedEvidence,
    validationPlan: rules.validationPlan,
    approvalSummary: '',
    safetyNotes: unique([
      'No external tool was executed.',
      'This approval gate only evaluates future manual execution readiness.',
      ...warnings,
    ]),
    metadata: {
      generatedAt: nowIso(),
      workerType,
      dryRun: true,
      approvalGateOnly: true,
      planOnly,
      humanApproval: request.humanApproval,
      handoffPath: request.handoffPath,
      dangerous,
      forbiddenPaths,
      warnings,
    },
  }
}

function buildExternalToolApprovalGate(handoffOrInput = {}, options = {}) {
  const request = buildExternalToolApprovalRequest(handoffOrInput, options)
  const gate = evaluateExternalToolApprovalRequest(request, options)
  gate.approvalSummary = summarizeExternalToolApprovalGate(gate)
  return gate
}

function validateExternalToolApprovalGate(gate = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'plan_only',
    'requires_human_approval',
    'approved_for_manual_execution',
    'blocked',
  ])
  if (!validStatuses.has(gate.gateStatus)) {
    issues.push(`gateStatus invalido: ${gate.gateStatus || '(vacio)'}`)
  }
  if (!gate.capability) {
    issues.push('capability faltante')
  }
  if (!gate.workerId && gate.gateStatus !== 'blocked') {
    issues.push('workerId faltante')
  }
  if (gate.metadata?.dryRun !== true || gate.metadata?.approvalGateOnly !== true) {
    issues.push('metadata debe declarar dryRun y approvalGateOnly')
  }
  if (gate.gateStatus === 'approved_for_manual_execution' && options.allowApprovedState !== true) {
    if (gate.metadata?.humanApproval !== true) {
      issues.push('approved_for_manual_execution requiere humanApproval true')
    }
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeExternalToolApprovalGate(gate = {}) {
  return [
    `External tool approval gate ${gate.gateStatus || 'unknown'} para ${gate.workerId || 'sin worker'} (${gate.capability || 'sin capability'}).`,
    `Ejecucion real: no ejecutada.`,
    gate.blockedReasons?.length ? `Bloqueos: ${gate.blockedReasons.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildManualExecutionChecklist(gate = {}) {
  return [
    '# Manual Execution Checklist',
    '',
    summarizeExternalToolApprovalGate(gate),
    '',
    'Required approvals:',
    ...(gate.requiredApprovals?.length ? gate.requiredApprovals.map((item) => `- ${item}`) : ['- None']),
    '',
    'Allowed paths/scopes:',
    ...(gate.allowedPaths?.length ? gate.allowedPaths.map((item) => `- ${item}`) : gate.allowedScopes.map((item) => `- ${item}`)),
    '',
    'Forbidden paths:',
    ...(gate.forbiddenPaths?.length ? gate.forbiddenPaths.map((item) => `- ${item}`) : ['- None detected']),
    '',
    'Checklist:',
    ...(gate.manualExecutionChecklist?.length ? gate.manualExecutionChecklist.map((item) => `- ${item}`) : ['- None']),
    '',
    'Expected evidence:',
    ...(gate.expectedEvidence?.length ? gate.expectedEvidence.map((item) => `- ${item}`) : ['- None']),
    '',
    'Validation plan:',
    ...(gate.validationPlan?.length ? gate.validationPlan.map((item) => `- ${item}`) : ['- None']),
    '',
    'This file is a planning artifact only. It does not execute Blender, Unity, MCP, deploys, Docker, installs, or external services.',
    '',
  ].join('\n')
}

function writeExternalToolApprovalGate(outputDir, gate) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolApprovalGate(gate, { allowApprovedState: true })
  if (!validation.valid) {
    throw new Error(`Approval gate invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const gatePath = path.join(resolvedOutputDir, 'external-tool-approval-gate.json')
  const summaryPath = path.join(resolvedOutputDir, 'external-tool-approval-summary.md')
  const checklistPath = path.join(resolvedOutputDir, 'manual-execution-checklist.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...gate,
    artifacts: [gatePath, summaryPath, checklistPath, readmePath],
  }
  fs.writeFileSync(gatePath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# External Tool Approval Gate',
      '',
      summarizeExternalToolApprovalGate(gate),
      '',
      `Status: ${gate.gateStatus}`,
      `Worker: ${gate.workerId || '(none)'}`,
      `Capability: ${gate.capability || '(none)'}`,
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(checklistPath, buildManualExecutionChecklist(gate), 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Approval Gate',
      '',
      summarizeExternalToolApprovalGate(gate),
      '',
      'Artifacts:',
      '- external-tool-approval-gate.json',
      '- external-tool-approval-summary.md',
      '- manual-execution-checklist.md',
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    gatePath,
    summaryPath,
    checklistPath,
    readmePath,
    gate: serializable,
  }
}

module.exports = {
  buildExternalToolApprovalRequest,
  evaluateExternalToolApprovalRequest,
  buildExternalToolApprovalGate,
  validateExternalToolApprovalGate,
  writeExternalToolApprovalGate,
  summarizeExternalToolApprovalGate,
  EXTERNAL_TOOL_CAPABILITIES,
}
