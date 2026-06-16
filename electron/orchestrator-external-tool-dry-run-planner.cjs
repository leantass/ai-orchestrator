const fs = require('node:fs')
const path = require('node:path')

const {
  validateSafeOutputDir,
  findDangerousInstructions,
} = require('./orchestrator-planned-external-workers.cjs')

const {
  buildExternalToolApprovalGate,
  writeExternalToolApprovalGate,
  summarizeExternalToolApprovalGate,
} = require('./orchestrator-external-tool-approval-gates.cjs')

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

function normalizeApprovalGate(value = {}) {
  if (value.gate) {
    return value.gate
  }
  return value
}

function loadExternalToolApprovalGate(gatePath) {
  if (!gatePath) {
    return {
      missing: true,
      missingReason: 'approvalGatePath faltante',
      gate: null,
    }
  }
  const resolved = path.resolve(gatePath)
  if (!fs.existsSync(resolved)) {
    return {
      missing: true,
      missingReason: `approval gate inexistente: ${gatePath}`,
      gate: null,
    }
  }
  return {
    missing: false,
    missingReason: '',
    gate: normalizeApprovalGate(readJsonFile(resolved)),
    resolvedPath: resolved,
  }
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

function toolLabelForType(type) {
  if (type === 'blender') {
    return 'Blender'
  }
  if (type === 'unity') {
    return 'Unity'
  }
  if (type === 'mcp') {
    return 'MCP'
  }
  return 'external-tool'
}

function defaultInputsForType(type, gate) {
  if (gate?.inputArtifacts?.length) {
    return gate.inputArtifacts
  }
  if (type === 'blender') {
    return ['approved asset brief', 'approved references', 'approved input asset folder']
  }
  if (type === 'unity') {
    return ['approved Unity project scope', 'approved asset list', 'target scene or prefab brief']
  }
  if (type === 'mcp') {
    return ['MCP capability brief', 'future permission scope', 'expected input schema']
  }
  return ['external tool task brief']
}

function defaultOutputsForType(type, gate) {
  if (gate?.outputArtifacts?.length) {
    return gate.outputArtifacts
  }
  if (gate?.expectedEvidence?.length) {
    return gate.expectedEvidence
  }
  if (type === 'blender') {
    return ['asset preparation notes', 'future preview/export checklist', 'manual evidence report']
  }
  if (type === 'unity') {
    return ['future Unity import report', 'scene/prefab validation checklist', 'manual test notes']
  }
  if (type === 'mcp') {
    return ['future MCP invocation plan', 'tool routing report', 'permission checklist without secrets']
  }
  return ['dry-run execution report']
}

function defaultAllowedPaths(gate = {}) {
  return unique([
    ...(gate.allowedPaths || []),
    ...(gate.allowedScopes || []),
    '.codex-temp',
  ])
}

function defaultForbiddenPaths(gate = {}) {
  return unique([
    ...(gate.forbiddenPaths || []),
    'web-prueba',
    '.env',
    'node_modules',
    'Dockerfile',
    'docker-compose',
    '.git',
  ])
}

function baseStep(id, title, description, tool, gate, extra = {}) {
  return {
    id,
    title,
    description,
    wouldRun: false,
    tool,
    inputs: ensureArray(extra.inputs),
    outputs: ensureArray(extra.outputs),
    allowedPaths: defaultAllowedPaths(gate),
    forbiddenPaths: defaultForbiddenPaths(gate),
    validation: ensureArray(extra.validation),
    requiresApproval: extra.requiresApproval !== false,
  }
}

function stepsForBlender(gate) {
  const inputs = defaultInputsForType('blender', gate)
  const outputs = defaultOutputsForType('blender', gate)
  return [
    baseStep(
      'blender-01-verify-inputs',
      'Verificar inputs aprobados',
      'Validar brief, referencias y carpetas sandbox. No se abre Blender.',
      'Blender',
      gate,
      {
        inputs,
        outputs: ['input readiness notes'],
        validation: ['Confirmar scope de entrada y salida aprobado.'],
      },
    ),
    baseStep(
      'blender-02-open-file-future',
      'Simular apertura futura de archivo Blender',
      'Describir que una ejecucion futura podria abrir Blender manualmente; v0.7 no abre GUI ni Python Blender.',
      'Blender',
      gate,
      {
        inputs,
        outputs: ['future open-file checklist'],
        validation: ['Confirmar que no se ejecuto Blender ni scripts Python.'],
      },
    ),
    baseStep(
      'blender-03-create-or-modify-asset-future',
      'Simular creacion o modificacion futura de asset',
      'Planificar nombres, materiales y estructura del asset sin escribir archivos reales.',
      'Blender',
      gate,
      {
        inputs,
        outputs: ['asset structure plan', 'materials/naming checklist'],
        validation: ['Revisar naming y materiales antes de cualquier ejecucion futura.'],
      },
    ),
    baseStep(
      'blender-04-export-preview-future',
      'Simular export/preview futuro',
      'Definir FBX/glTF/render futuro, sin exportar ni renderizar nada en v0.7.',
      'Blender',
      gate,
      {
        inputs,
        outputs,
        validation: ['Confirmar que no hubo export real, render real ni instalacion de addons.'],
      },
    ),
  ]
}

function stepsForUnity(gate) {
  const inputs = defaultInputsForType('unity', gate)
  const outputs = defaultOutputsForType('unity', gate)
  return [
    baseStep(
      'unity-01-verify-project',
      'Verificar proyecto Unity objetivo',
      'Validar proyecto/rama/sandbox aprobados. No se abre Unity.',
      'Unity',
      gate,
      {
        inputs,
        outputs: ['Unity project readiness notes'],
        validation: ['Confirmar proyecto/rama/sandbox aprobado.'],
      },
    ),
    baseStep(
      'unity-02-verify-assets',
      'Verificar assets de entrada',
      'Listar assets permitidos y destino futuro sin copiar ni borrar assets.',
      'Unity',
      gate,
      {
        inputs,
        outputs: ['asset import readiness checklist'],
        validation: ['Confirmar que no se borraron assets.'],
      },
    ),
    baseStep(
      'unity-03-import-prefab-future',
      'Simular importacion y prefab futuro',
      'Planificar importacion y generacion de prefab futura; v0.7 no modifica proyecto ni escenas.',
      'Unity',
      gate,
      {
        inputs,
        outputs: ['future prefab/import plan'],
        validation: ['Confirmar que no se escribieron escenas productivas.'],
      },
    ),
    baseStep(
      'unity-04-validate-tests-future',
      'Simular validacion y tests Unity futuros',
      'Definir checks de escena/prefab/tests sin abrir Unity ni generar builds.',
      'Unity',
      gate,
      {
        inputs,
        outputs,
        validation: ['Confirmar que no se hicieron builds ni tests Unity reales.'],
      },
    ),
  ]
}

function stepsForMcp(gate) {
  const inputs = defaultInputsForType('mcp', gate)
  const outputs = defaultOutputsForType('mcp', gate)
  return [
    baseStep(
      'mcp-01-identify-tool',
      'Identificar herramienta/capability MCP futura',
      'Documentar capability, inputs y motivo. No se invoca MCP.',
      'MCP',
      gate,
      {
        inputs,
        outputs: ['MCP capability readiness notes'],
        validation: ['Confirmar capability y herramienta futura.'],
      },
    ),
    baseStep(
      'mcp-02-validate-permissions',
      'Validar permisos futuros',
      'Definir scopes y aprobaciones futuras sin usar credenciales ni servicios externos.',
      'MCP',
      gate,
      {
        inputs,
        outputs: ['permission checklist without secrets'],
        validation: ['Confirmar que no se usaron credenciales.'],
      },
    ),
    baseStep(
      'mcp-03-map-io',
      'Mapear inputs y outputs esperados',
      'Definir contrato de entrada/salida para una invocacion futura controlada.',
      'MCP',
      gate,
      {
        inputs,
        outputs,
        validation: ['Confirmar que no se llamo ningun servicio externo.'],
      },
    ),
  ]
}

function stepsForGate(gate = {}) {
  const type = workerTypeForCapability(gate.capability)
  if (type === 'blender') {
    return stepsForBlender(gate)
  }
  if (type === 'unity') {
    return stepsForUnity(gate)
  }
  if (type === 'mcp') {
    return stepsForMcp(gate)
  }
  return [
    baseStep(
      'external-01-define-scope',
      'Definir scope externo',
      'Planificar herramienta externa desconocida sin ejecucion real.',
      'external-tool',
      gate,
      {
        inputs: defaultInputsForType(type, gate),
        outputs: defaultOutputsForType(type, gate),
        validation: ['Requiere aprobacion humana antes de cualquier accion externa.'],
      },
    ),
  ]
}

function normalizeInputToGate(input = {}, options = {}) {
  if (input.approvalGatePath) {
    const loaded = loadExternalToolApprovalGate(input.approvalGatePath)
    if (loaded.missing) {
      return {
        gate: null,
        missingReason: loaded.missingReason,
      }
    }
    return {
      gate: loaded.gate,
      missingReason: '',
    }
  }
  if (input.approvalGate) {
    return {
      gate: normalizeApprovalGate(input.approvalGate),
      missingReason: '',
    }
  }
  const gate = buildExternalToolApprovalGate({
    handoffPath: input.handoffPath || '',
    handoff: input.handoff,
    workerId: input.workerId,
    capability: input.capability,
    requestedAction: input.requestedAction,
    targetProject: input.targetProject,
    targetPaths: input.targetPaths,
    inputArtifacts: input.inputArtifacts,
    outputArtifacts: input.outputArtifacts,
    humanApproval: input.humanApproval,
    metadata: {
      dryRunPlannerInput: true,
      ...(input.metadata || {}),
      ...(options.metadata || {}),
    },
  })
  return {
    gate,
    missingReason: '',
  }
}

function statusForGate(gate, input = {}, missingReason = '') {
  if (missingReason) {
    return 'missing_artifacts'
  }
  if (!gate) {
    return 'missing_artifacts'
  }
  if (!gate.capability || !gate.workerId) {
    return 'missing_artifacts'
  }
  if (gate.gateStatus === 'blocked' || gate.blockedReasons?.length) {
    return 'blocked'
  }
  if (gate.gateStatus === 'requires_human_approval' && input.humanApproval !== true) {
    return 'requires_human_approval'
  }
  return 'dry_run_ready'
}

function findAdditionalDanger(gate, input = {}) {
  return findDangerousInstructions([
    gate?.requestedAction,
    gate?.capability,
    gate?.targetProject,
    ...(gate?.allowedPaths || []),
    ...(gate?.forbiddenPaths || []),
    ...(input.targetPaths || []),
    ...(input.inputArtifacts || []),
    ...(input.outputArtifacts || []),
  ])
}

function buildExternalToolDryRunPlan(input = {}, options = {}) {
  const { gate, missingReason } = normalizeInputToGate(input, options)
  const additionalDanger = findAdditionalDanger(gate, input)
  const blockedReasons = unique([
    ...(gate?.blockedReasons || []),
    ...(missingReason ? [missingReason] : []),
    ...additionalDanger.map((finding) => `accion peligrosa: ${finding.label}`),
  ])
  const sourceStatus = statusForGate(gate, input, missingReason)
  const planStatus = blockedReasons.length && !missingReason ? 'blocked' : sourceStatus
  const type = workerTypeForCapability(gate?.capability || input.capability)
  const normalizedGate = gate || {
    workerId: input.workerId || '',
    workerDisplayName: '',
    capability: input.capability || '',
    requestedAction: input.requestedAction || '',
    targetProject: input.targetProject || '',
    riskLevel: type === 'mcp' ? 'critical' : 'high',
    allowedScopes: [],
    allowedPaths: [],
    forbiddenPaths: [],
    forbiddenActions: [],
    expectedEvidence: [],
    validationPlan: [],
    manualExecutionChecklist: [],
  }
  const plan = {
    planStatus,
    workerId: normalizedGate.workerId || '',
    workerDisplayName: normalizedGate.workerDisplayName || '',
    capability: normalizedGate.capability || '',
    requestedAction: normalizedGate.requestedAction || '',
    targetProject: normalizedGate.targetProject || '',
    riskLevel: normalizedGate.riskLevel || (type === 'mcp' ? 'critical' : 'high'),
    dryRunOnly: true,
    executionAllowed: false,
    steps: stepsForGate(normalizedGate),
    allowedScopes: unique(normalizedGate.allowedScopes || []),
    allowedPaths: defaultAllowedPaths(normalizedGate),
    forbiddenPaths: defaultForbiddenPaths(normalizedGate),
    forbiddenActions: unique(normalizedGate.forbiddenActions || []),
    blockedReasons,
    expectedEvidence: defaultOutputsForType(type, normalizedGate),
    validationPlan: unique(normalizedGate.validationPlan || ['Revisar diff/status del repo.']),
    manualExecutionChecklist: unique(normalizedGate.manualExecutionChecklist || []),
    dryRunSummary: '',
    metadata: {
      generatedAt: nowIso(),
      dryRunMode: input.dryRunMode || 'external-tool-v0.7',
      dryRunOnly: true,
      executionAllowed: false,
      approvalGatePath: input.approvalGatePath || '',
      handoffPath: input.handoffPath || normalizedGate.metadata?.handoffPath || '',
      sourceGateStatus: normalizedGate.gateStatus || '',
      workerType: type,
      tool: toolLabelForType(type),
      humanApproval: input.humanApproval === true || normalizedGate.metadata?.humanApproval === true,
      missingReason,
      additionalDanger,
      noExternalToolExecuted: true,
      ...(options.metadata || {}),
    },
  }
  plan.dryRunSummary = summarizeExternalToolDryRunPlan(plan)
  return plan
}

function buildExternalToolDryRunPlanFromGate(gatePath, options = {}) {
  return buildExternalToolDryRunPlan({
    approvalGatePath: gatePath,
    humanApproval: options.humanApproval === true,
  }, options)
}

function validateExternalToolDryRunPlan(plan = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'dry_run_ready',
    'requires_human_approval',
    'blocked',
    'missing_artifacts',
    'not_executable_in_v0_7',
  ])
  if (!validStatuses.has(plan.planStatus)) {
    issues.push(`planStatus invalido: ${plan.planStatus || '(vacio)'}`)
  }
  if (plan.dryRunOnly !== true) {
    issues.push('dryRunOnly debe ser true')
  }
  if (plan.executionAllowed !== false) {
    issues.push('executionAllowed debe ser false en v0.7')
  }
  if (!Array.isArray(plan.steps) || !plan.steps.length) {
    issues.push('steps faltantes')
  }
  for (const step of plan.steps || []) {
    if (step.wouldRun !== false) {
      issues.push(`step ${step.id || '(sin id)'} debe tener wouldRun=false`)
    }
  }
  if (plan.planStatus !== 'missing_artifacts' && !plan.capability) {
    issues.push('capability faltante')
  }
  if (plan.planStatus === 'dry_run_ready' && plan.blockedReasons?.length && options.allowBlockedReady !== true) {
    issues.push('dry_run_ready no debe tener blockedReasons')
  }
  return {
    valid: issues.length === 0,
    issues: unique(issues),
  }
}

function summarizeExternalToolDryRunPlan(plan = {}) {
  return [
    `External tool dry-run plan ${plan.planStatus || 'unknown'} para ${plan.workerId || 'sin worker'} (${plan.capability || 'sin capability'}).`,
    'dryRunOnly=true.',
    'executionAllowed=false.',
    'No se ejecuto ninguna herramienta externa.',
    plan.blockedReasons?.length ? `Bloqueos: ${plan.blockedReasons.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildManualExecutionPreview(plan = {}) {
  const lines = [
    '# Manual Execution Preview',
    '',
    summarizeExternalToolDryRunPlan(plan),
    '',
    'Steps:',
  ]
  for (const step of plan.steps || []) {
    lines.push(
      '',
      `## ${step.id}: ${step.title}`,
      '',
      step.description || '',
      '',
      `Tool: ${step.tool || '(none)'}`,
      `Would run now: ${step.wouldRun ? 'yes' : 'no'}`,
      `Requires approval: ${step.requiresApproval ? 'yes' : 'no'}`,
      '',
      'Inputs:',
      ...(step.inputs?.length ? step.inputs.map((item) => `- ${item}`) : ['- None']),
      '',
      'Outputs:',
      ...(step.outputs?.length ? step.outputs.map((item) => `- ${item}`) : ['- None']),
      '',
      'Validation:',
      ...(step.validation?.length ? step.validation.map((item) => `- ${item}`) : ['- None']),
    )
  }
  lines.push('', 'This preview never executes Blender, Unity, MCP, Codex, Docker, installs, deploys, or external services.', '')
  return lines.join('\n')
}

function buildExpectedEvidenceChecklist(plan = {}) {
  return [
    '# Expected Evidence Checklist',
    '',
    summarizeExternalToolDryRunPlan(plan),
    '',
    'Expected evidence:',
    ...(plan.expectedEvidence?.length ? plan.expectedEvidence.map((item) => `- ${item}`) : ['- None']),
    '',
    'Allowed paths/scopes:',
    ...(plan.allowedPaths?.length ? plan.allowedPaths.map((item) => `- ${item}`) : ['- None']),
    '',
    'Forbidden paths:',
    ...(plan.forbiddenPaths?.length ? plan.forbiddenPaths.map((item) => `- ${item}`) : ['- None']),
    '',
    'Post validations:',
    ...(plan.validationPlan?.length ? plan.validationPlan.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n')
}

function writeExternalToolDryRunPlan(outputDir, plan) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolDryRunPlan(plan)
  if (!validation.valid) {
    throw new Error(`Dry-run plan invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const planPath = path.join(resolvedOutputDir, 'external-tool-dry-run-plan.json')
  const summaryPath = path.join(resolvedOutputDir, 'external-tool-dry-run-summary.md')
  const previewPath = path.join(resolvedOutputDir, 'manual-execution-preview.md')
  const evidencePath = path.join(resolvedOutputDir, 'expected-evidence-checklist.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...plan,
    artifacts: [planPath, summaryPath, previewPath, evidencePath, readmePath],
  }
  fs.writeFileSync(planPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# External Tool Dry-Run Plan',
      '',
      summarizeExternalToolDryRunPlan(plan),
      '',
      `Status: ${plan.planStatus}`,
      `Worker: ${plan.workerId || '(none)'}`,
      `Capability: ${plan.capability || '(none)'}`,
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(previewPath, buildManualExecutionPreview(plan), 'utf8')
  fs.writeFileSync(evidencePath, buildExpectedEvidenceChecklist(plan), 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Dry-Run Plan',
      '',
      summarizeExternalToolDryRunPlan(plan),
      '',
      'Artifacts:',
      '- external-tool-dry-run-plan.json',
      '- external-tool-dry-run-summary.md',
      '- manual-execution-preview.md',
      '- expected-evidence-checklist.md',
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    planPath,
    summaryPath,
    previewPath,
    evidencePath,
    readmePath,
    plan: serializable,
  }
}

module.exports = {
  buildExternalToolDryRunPlan,
  validateExternalToolDryRunPlan,
  loadExternalToolApprovalGate,
  buildExternalToolDryRunPlanFromGate,
  writeExternalToolDryRunPlan,
  summarizeExternalToolDryRunPlan,
  writeExternalToolApprovalGate,
  summarizeExternalToolApprovalGate,
}
