const fs = require('node:fs')
const path = require('node:path')

const {
  getDefaultToolWorkerRegistry,
  listToolWorkers,
} = require('./orchestrator-tool-worker-registry.cjs')

const {
  validateSafeOutputDir,
  findDangerousInstructions,
} = require('./orchestrator-planned-external-workers.cjs')

const {
  buildExternalToolApprovalGate,
} = require('./orchestrator-external-tool-approval-gates.cjs')

const {
  buildExternalToolDryRunPlan,
  validateExternalToolDryRunPlan,
  loadExternalToolApprovalGate,
} = require('./orchestrator-external-tool-dry-run-planner.cjs')

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

function normalizeDryRunPlan(value = {}) {
  if (value.plan) {
    return value.plan
  }
  return value
}

function loadDryRunPlan(dryRunPlanPath) {
  if (!dryRunPlanPath) {
    return {
      missing: true,
      missingReason: 'dryRunPlanPath faltante',
      plan: null,
    }
  }
  const resolved = path.resolve(dryRunPlanPath)
  if (!fs.existsSync(resolved)) {
    return {
      missing: true,
      missingReason: `dry-run plan inexistente: ${dryRunPlanPath}`,
      plan: null,
    }
  }
  return {
    missing: false,
    missingReason: '',
    plan: normalizeDryRunPlan(readJsonFile(resolved)),
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

function defaultForbiddenPaths() {
  return ['web-prueba', '.env', 'node_modules', 'Dockerfile', 'docker-compose', '.git']
}

function globalForbiddenActions() {
  return [
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
}

function toolSpecificContract(type) {
  if (type === 'blender') {
    return {
      requiredApprovals: [
        'Aprobacion humana explicita para cualquier ejecucion real futura.',
        'Carpeta de entrada aprobada.',
        'Carpeta de salida/export aprobada.',
        'Naming esperado y checklist visual aprobados.',
      ],
      evidenceContract: [
        'Registro del operador humano.',
        'Checklist visual de asset/materiales/nombres.',
        'Rutas de entrada y salida aprobadas.',
        'Preview/export checklist sin secretos.',
      ],
      rollbackPlan: [
        'Abortar si Blender se abre automaticamente.',
        'Abortar si se requiere instalar addons.',
        'Abortar si la ruta de export no esta aprobada.',
        'Restaurar solo desde backup/sandbox aprobado si una ejecucion futura manual lo requiere.',
      ],
      forbiddenActions: [
        'No ejecutar Blender automaticamente en v0.8.',
        'No ejecutar Python Blender automaticamente.',
        'No instalar addons.',
        'No exportar a rutas no aprobadas.',
      ],
      manualOperatorChecklist: [
        'Confirmar brief, naming esperado y referencias.',
        'Confirmar carpeta de entrada y salida aprobadas.',
        'Confirmar que no se instalaran addons.',
        'Registrar evidencia visual y notas de operador si la ejecucion futura ocurre fuera de JEFE.',
      ],
      validationPlan: [
        'Confirmar que no se abrio Blender desde JEFE.',
        'Confirmar que no se ejecuto Python Blender.',
        'Validar naming/materiales contra checklist.',
        'Revisar git status/diff luego de cualquier evidencia manual futura.',
      ],
      abortConditions: [
        'Intento de ejecucion automatica de Blender.',
        'Solicitud de addon o credenciales.',
        'Ruta fuera de scope aprobado.',
        'Export o render real no autorizado.',
      ],
    }
  }
  if (type === 'unity') {
    return {
      requiredApprovals: [
        'Aprobacion humana explicita para cualquier ejecucion real futura.',
        'Proyecto Unity aprobado.',
        'Rama/sandbox Unity aprobada.',
        'Assets de entrada y escena/prefab objetivo aprobados.',
      ],
      evidenceContract: [
        'Registro del operador humano.',
        'Reporte de importacion/prefab futuro.',
        'Checklist de escena/prefab.',
        'Notas de validacion/tests manuales.',
      ],
      rollbackPlan: [
        'Abortar si Unity se abre automaticamente.',
        'Abortar si se intenta borrar assets.',
        'Abortar si se intenta generar build.',
        'Usar solo rama/sandbox aprobada para revertir cambios futuros manuales.',
      ],
      forbiddenActions: [
        'No abrir Unity automaticamente en v0.8.',
        'No borrar assets.',
        'No generar builds.',
        'No tocar escenas productivas sin aprobacion.',
        'No modificar proyecto real sin aprobacion.',
      ],
      manualOperatorChecklist: [
        'Confirmar proyecto, rama/sandbox y assets de entrada.',
        'Confirmar escena/prefab objetivo.',
        'Confirmar que no se haran builds ni borrado de assets.',
        'Registrar reporte de importacion y evidencia de validacion si ocurre ejecucion futura manual.',
      ],
      validationPlan: [
        'Confirmar que no se abrio Unity desde JEFE.',
        'Confirmar que no se generaron builds.',
        'Confirmar que no se borraron assets.',
        'Revisar reporte/checklist y git status/diff si hubo ejecucion futura manual.',
      ],
      abortConditions: [
        'Intento de abrir Unity automaticamente.',
        'Solicitud de build.',
        'Borrado de assets.',
        'Escena productiva sin aprobacion.',
      ],
    }
  }
  if (type === 'mcp') {
    return {
      requiredApprovals: [
        'Aprobacion humana explicita para cualquier invocacion MCP futura.',
        'Capability MCP y scopes aprobados.',
        'Revision de credenciales sin exponer secretos.',
      ],
      evidenceContract: [
        'Registro del operador humano.',
        'Payload futuro redactado sin secretos.',
        'Tool routing report.',
        'Checklist de permisos/scopes sin credenciales.',
      ],
      rollbackPlan: [
        'Abortar si se intenta invocar MCP real.',
        'Abortar si aparecen credenciales.',
        'Abortar si se requiere servicio externo real.',
        'Abortar ante cualquier filesystem write sin permiso.',
      ],
      forbiddenActions: [
        'No invocar MCP real en v0.8.',
        'No usar credenciales.',
        'No llamar servicios externos reales.',
        'No hacer filesystem write sin permiso.',
        'No hacer llamadas de red.',
      ],
      manualOperatorChecklist: [
        'Confirmar herramienta/capability MCP futura.',
        'Confirmar payload esperado sin secretos.',
        'Confirmar scopes y permisos.',
        'Registrar tool routing report si una invocacion futura se aprueba fuera de JEFE.',
      ],
      validationPlan: [
        'Confirmar que no se invoco MCP desde JEFE.',
        'Confirmar que no se usaron credenciales.',
        'Confirmar que no hubo llamadas de red ni servicios externos.',
        'Revisar evidencia de routing sin secretos.',
      ],
      abortConditions: [
        'Intento de invocacion MCP real.',
        'Presencia de credenciales o tokens.',
        'Solicitud de red/servicio externo real.',
        'Filesystem write no aprobado.',
      ],
    }
  }
  return {
    requiredApprovals: ['Aprobacion humana explicita para cualquier herramienta externa.'],
    evidenceContract: ['Registro del operador humano.', 'Reporte de ejecucion supervisada futura.'],
    rollbackPlan: ['Abortar ante cualquier ejecucion automatica o scope no aprobado.'],
    forbiddenActions: [],
    manualOperatorChecklist: ['Definir herramienta, scope, permisos y evidencia esperada.'],
    validationPlan: ['Confirmar que no se ejecuto herramienta externa desde JEFE.'],
    abortConditions: ['Scope o herramienta no definidos.'],
  }
}

function buildExternalToolSupervisedExecutionRequest(input = {}, options = {}) {
  return {
    dryRunPlanPath: input.dryRunPlanPath || '',
    dryRunPlan: input.dryRunPlan || null,
    approvalGatePath: input.approvalGatePath || '',
    approvalGate: input.approvalGate || null,
    handoffPath: input.handoffPath || '',
    handoff: input.handoff || null,
    workerId: input.workerId || '',
    capability: input.capability || '',
    requestedAction: input.requestedAction || '',
    targetProject: input.targetProject || '',
    targetPaths: unique(input.targetPaths || []),
    inputArtifacts: unique(input.inputArtifacts || []),
    outputArtifacts: unique(input.outputArtifacts || []),
    humanApproval: input.humanApproval === true,
    executionMode: input.executionMode || 'supervised-design-v0.8',
    metadata: {
      ...(input.metadata || {}),
      ...(options.metadata || {}),
      generatedAt: nowIso(),
    },
  }
}

function sourcePlanForRequest(request) {
  if (request.dryRunPlanPath) {
    const loaded = loadDryRunPlan(request.dryRunPlanPath)
    return {
      plan: loaded.plan,
      missingReason: loaded.missingReason,
    }
  }
  if (request.dryRunPlan) {
    return {
      plan: normalizeDryRunPlan(request.dryRunPlan),
      missingReason: '',
    }
  }
  if (request.approvalGatePath) {
    const loadedGate = loadExternalToolApprovalGate(request.approvalGatePath)
    if (loadedGate.missing) {
      return {
        plan: null,
        missingReason: loadedGate.missingReason,
      }
    }
    return {
      plan: buildExternalToolDryRunPlan({
        approvalGate: loadedGate.gate,
        humanApproval: request.humanApproval,
      }),
      missingReason: '',
    }
  }
  if (request.approvalGate) {
    return {
      plan: buildExternalToolDryRunPlan({
        approvalGate: request.approvalGate,
        humanApproval: request.humanApproval,
      }),
      missingReason: '',
    }
  }
  const gate = buildExternalToolApprovalGate({
    handoffPath: request.handoffPath,
    handoff: request.handoff,
    workerId: request.workerId,
    capability: request.capability,
    requestedAction: request.requestedAction,
    targetProject: request.targetProject,
    targetPaths: request.targetPaths,
    inputArtifacts: request.inputArtifacts,
    outputArtifacts: request.outputArtifacts,
    humanApproval: request.humanApproval,
  })
  return {
    plan: buildExternalToolDryRunPlan({
      approvalGate: gate,
      humanApproval: request.humanApproval,
    }),
    missingReason: '',
  }
}

function validateExternalToolSupervisedExecutionRequest(request, options = {}) {
  const { plan, missingReason } = sourcePlanForRequest(request)
  const issues = []
  const warnings = []
  if (missingReason) {
    issues.push(missingReason)
  }
  if (plan) {
    const planValidation = validateExternalToolDryRunPlan(plan, { allowBlockedReady: true })
    if (!planValidation.valid) {
      warnings.push(...planValidation.issues)
    }
  }
  const dangerous = findDangerousInstructions([
    request.requestedAction,
    request.capability,
    request.workerId,
    request.targetProject,
    ...(request.targetPaths || []),
    ...(request.inputArtifacts || []),
    ...(request.outputArtifacts || []),
    ...(plan?.blockedReasons || []),
  ])
  if (dangerous.length) {
    issues.push(...dangerous.map((finding) => `accion peligrosa: ${finding.label}`))
  }
  if (!plan && !missingReason) {
    issues.push('dry-run plan no disponible')
  }
  if (!request.humanApproval) {
    warnings.push('requiere aprobacion humana antes de cualquier ejecucion real')
  }
  return {
    valid: issues.length === 0,
    issues: unique(issues),
    warnings: unique(warnings),
    plan,
    missingReason,
    dangerous,
    metadata: {
      generatedAt: nowIso(),
      registryWorkers: listToolWorkers(options.registry || getDefaultToolWorkerRegistry()).length,
    },
  }
}

function statusForContract(request, validation, plan) {
  if (validation.missingReason || plan?.planStatus === 'missing_artifacts') {
    return 'missing_artifacts'
  }
  if (validation.issues.length || plan?.planStatus === 'blocked' || plan?.blockedReasons?.length) {
    return 'blocked'
  }
  if (!request.humanApproval) {
    return 'requires_human_approval'
  }
  if (plan?.planStatus === 'not_executable_in_v0_7') {
    return 'not_executable_in_v0_8'
  }
  return 'design_ready'
}

function phaseFromDryRunStep(step, contract, toolContract) {
  return {
    id: `supervised-${step.id || 'step'}`,
    title: step.title || 'Supervised external tool phase',
    purpose: step.description || 'Disenar fase futura supervisada sin ejecucion real.',
    preconditions: unique([
      'Aprobacion humana registrada.',
      'Scope aprobado confirmado.',
      ...(step.allowedPaths || []).map((item) => `Permitido: ${item}`),
    ]),
    manualSteps: [
      `Revisar paso dry-run: ${step.title || step.id || 'sin titulo'}.`,
      'Confirmar que la herramienta no se ejecuta automaticamente desde JEFE.',
      'Ejecutar solo fuera de JEFE y solo si existe aprobacion humana futura.',
    ],
    wouldExecute: false,
    tool: step.tool || contract.metadata.tool,
    inputs: ensureArray(step.inputs),
    outputs: ensureArray(step.outputs),
    evidenceRequired: unique([
      ...(step.outputs || []),
      ...toolContract.evidenceContract,
    ]),
    validationRequired: unique([
      ...(step.validation || []),
      ...toolContract.validationPlan,
    ]),
    abortConditions: toolContract.abortConditions,
  }
}

function buildExternalToolSupervisedExecutionContract(request, options = {}) {
  const validation = validateExternalToolSupervisedExecutionRequest(request, options)
  const plan = validation.plan || {}
  const type = workerTypeForCapability(plan.capability || request.capability)
  const toolContract = toolSpecificContract(type)
  const executionStatus = statusForContract(request, validation, plan)
  const contract = {
    executionStatus,
    workerId: plan.workerId || request.workerId || '',
    workerDisplayName: plan.workerDisplayName || '',
    capability: plan.capability || request.capability || '',
    requestedAction: plan.requestedAction || request.requestedAction || '',
    targetProject: plan.targetProject || request.targetProject || '',
    riskLevel: plan.riskLevel || (type === 'mcp' ? 'critical' : 'high'),
    executionAllowed: false,
    supervisedOnly: true,
    requiredApprovals: toolContract.requiredApprovals,
    allowedScopes: unique([
      ...(plan.allowedScopes || []),
      ...(plan.allowedPaths || []),
      '.codex-temp',
    ]),
    forbiddenActions: unique([
      ...globalForbiddenActions(),
      ...(plan.forbiddenActions || []),
      ...toolContract.forbiddenActions,
    ]),
    forbiddenPaths: unique([
      ...(plan.forbiddenPaths || []),
      ...defaultForbiddenPaths(),
    ]),
    blockedReasons: unique([
      ...(plan.blockedReasons || []),
      ...validation.issues,
    ]),
    executionPhases: [],
    evidenceContract: unique([
      ...(plan.expectedEvidence || []),
      ...toolContract.evidenceContract,
    ]),
    validationPlan: unique([
      ...(plan.validationPlan || []),
      ...toolContract.validationPlan,
    ]),
    rollbackPlan: toolContract.rollbackPlan,
    manualOperatorChecklist: unique([
      ...(plan.manualExecutionChecklist || []),
      ...toolContract.manualOperatorChecklist,
    ]),
    handoffPrompt: '',
    summary: '',
    metadata: {
      generatedAt: nowIso(),
      executionMode: request.executionMode,
      executionAllowed: false,
      supervisedOnly: true,
      sourceDryRunPlanPath: request.dryRunPlanPath || '',
      sourceApprovalGatePath: request.approvalGatePath || plan.metadata?.approvalGatePath || '',
      sourceHandoffPath: request.handoffPath || plan.metadata?.handoffPath || '',
      sourcePlanStatus: plan.planStatus || '',
      workerType: type,
      tool: toolLabelForType(type),
      humanApproval: request.humanApproval,
      validation,
      noExternalToolExecuted: true,
    },
  }
  contract.executionPhases = (plan.steps?.length ? plan.steps : [{
    id: 'manual-design-placeholder',
    title: 'Disenar ejecucion supervisada futura',
    description: 'Fase placeholder por falta de steps dry-run completos.',
    tool: toolLabelForType(type),
    inputs: request.inputArtifacts,
    outputs: request.outputArtifacts,
    validation: ['Completar dry-run plan antes de ejecutar cualquier herramienta.'],
    allowedPaths: contract.allowedScopes,
  }]).map((step) => phaseFromDryRunStep(step, contract, toolContract))
  contract.summary = summarizeExternalToolSupervisedExecutionHandoff(contract)
  contract.handoffPrompt = buildExternalToolSupervisedExecutionHandoff(contract, options).handoffPrompt
  return contract
}

function buildExternalToolSupervisedExecutionHandoff(contract, options = {}) {
  const lines = [
    'EXTERNAL TOOL SUPERVISED EXECUTION DESIGN - v0.8',
    '',
    `Tool: ${contract.metadata?.tool || '(unknown)'}`,
    `Worker: ${contract.workerDisplayName || '(sin worker)'} (${contract.workerId || 'no-worker'})`,
    `Capability: ${contract.capability || '(none)'}`,
    `Requested action: ${contract.requestedAction || '(none)'}`,
    `Status: ${contract.executionStatus}`,
    `Target project: ${contract.targetProject || '(none)'}`,
    '',
    'Este documento es diseno/plan de ejecucion supervisada.',
    'No ejecutar esta herramienta automaticamente en v0.8.',
    'Requiere aprobacion humana antes de cualquier ejecucion real.',
    '',
    'Required approvals:',
    ...(contract.requiredApprovals.length ? contract.requiredApprovals.map((item) => `- ${item}`) : ['- None']),
    '',
    'Inputs expected:',
    ...unique(contract.executionPhases.flatMap((phase) => phase.inputs || [])).map((item) => `- ${item}`),
    '',
    'Outputs expected:',
    ...unique(contract.executionPhases.flatMap((phase) => phase.outputs || [])).map((item) => `- ${item}`),
    '',
    'Allowed scope:',
    ...(contract.allowedScopes.length ? contract.allowedScopes.map((item) => `- ${item}`) : ['- None']),
    '',
    'Forbidden actions:',
    ...contract.forbiddenActions.map((item) => `- ${item}`),
    '',
    'Manual operator checklist:',
    ...(contract.manualOperatorChecklist.length ? contract.manualOperatorChecklist.map((item) => `- ${item}`) : ['- None']),
    '',
    'Evidence required:',
    ...(contract.evidenceContract.length ? contract.evidenceContract.map((item) => `- ${item}`) : ['- None']),
    '',
    'Post validations:',
    ...(contract.validationPlan.length ? contract.validationPlan.map((item) => `- ${item}`) : ['- None']),
    '',
    'Abort conditions:',
    ...unique(contract.executionPhases.flatMap((phase) => phase.abortConditions || [])).map((item) => `- ${item}`),
    '',
    options.extraPrompt ? String(options.extraPrompt) : '',
  ].filter((line) => line !== '').join('\n')
  return {
    ...contract,
    handoffPrompt: lines,
  }
}

function validateExternalToolSupervisedExecutionHandoff(handoff = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'design_ready',
    'requires_human_approval',
    'blocked',
    'missing_artifacts',
    'not_executable_in_v0_8',
  ])
  if (!validStatuses.has(handoff.executionStatus)) {
    issues.push(`executionStatus invalido: ${handoff.executionStatus || '(vacio)'}`)
  }
  if (handoff.executionAllowed !== false) {
    issues.push('executionAllowed debe ser false en v0.8')
  }
  if (handoff.supervisedOnly !== true) {
    issues.push('supervisedOnly debe ser true')
  }
  if (!Array.isArray(handoff.executionPhases) || !handoff.executionPhases.length) {
    issues.push('executionPhases faltantes')
  }
  for (const phase of handoff.executionPhases || []) {
    if (phase.wouldExecute !== false) {
      issues.push(`phase ${phase.id || '(sin id)'} debe tener wouldExecute=false`)
    }
  }
  if (!handoff.handoffPrompt || !/No ejecutar esta herramienta automaticamente en v0\.8/u.test(handoff.handoffPrompt)) {
    issues.push('handoffPrompt no declara bloqueo de ejecucion automatica v0.8')
  }
  if (!handoff.handoffPrompt || !/Requiere aprobacion humana/u.test(handoff.handoffPrompt)) {
    issues.push('handoffPrompt no declara aprobacion humana')
  }
  if (handoff.executionStatus === 'design_ready' && !handoff.metadata?.humanApproval && options.allowDesignReadyWithoutApproval !== true) {
    issues.push('design_ready requiere humanApproval')
  }
  return {
    valid: issues.length === 0,
    issues: unique(issues),
  }
}

function summarizeExternalToolSupervisedExecutionHandoff(handoff = {}) {
  return [
    `External tool supervised execution ${handoff.executionStatus || 'unknown'} para ${handoff.workerId || 'sin worker'} (${handoff.capability || 'sin capability'}).`,
    'executionAllowed=false.',
    'supervisedOnly=true.',
    'No se ejecuto ninguna herramienta externa.',
    handoff.blockedReasons?.length ? `Bloqueos: ${handoff.blockedReasons.join('; ')}.` : '',
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

function writeExternalToolSupervisedExecutionHandoff(outputDir, handoff) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolSupervisedExecutionHandoff(handoff, { allowDesignReadyWithoutApproval: true })
  if (!validation.valid) {
    throw new Error(`Supervised execution handoff invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const handoffPath = path.join(resolvedOutputDir, 'external-tool-supervised-execution.json')
  const summaryPath = path.join(resolvedOutputDir, 'external-tool-supervised-execution-summary.md')
  const checklistPath = path.join(resolvedOutputDir, 'manual-operator-checklist.md')
  const evidencePath = path.join(resolvedOutputDir, 'evidence-contract.md')
  const validationPath = path.join(resolvedOutputDir, 'validation-plan.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...handoff,
    artifacts: [handoffPath, summaryPath, checklistPath, evidencePath, validationPath, readmePath],
  }
  fs.writeFileSync(handoffPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# External Tool Supervised Execution',
      '',
      summarizeExternalToolSupervisedExecutionHandoff(handoff),
      '',
      `Status: ${handoff.executionStatus}`,
      `Worker: ${handoff.workerId || '(none)'}`,
      `Capability: ${handoff.capability || '(none)'}`,
      '',
      'No external tool was executed.',
      '',
      '## Handoff Prompt',
      '',
      handoff.handoffPrompt,
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(checklistPath, markdownList('Manual Operator Checklist', handoff.manualOperatorChecklist), 'utf8')
  fs.writeFileSync(evidencePath, markdownList('Evidence Contract', handoff.evidenceContract), 'utf8')
  fs.writeFileSync(validationPath, markdownList('Validation Plan', handoff.validationPlan), 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Supervised Execution',
      '',
      summarizeExternalToolSupervisedExecutionHandoff(handoff),
      '',
      'Artifacts:',
      '- external-tool-supervised-execution.json',
      '- external-tool-supervised-execution-summary.md',
      '- manual-operator-checklist.md',
      '- evidence-contract.md',
      '- validation-plan.md',
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    handoffPath,
    summaryPath,
    checklistPath,
    evidencePath,
    validationPath,
    readmePath,
    handoff: serializable,
  }
}

module.exports = {
  buildExternalToolSupervisedExecutionRequest,
  validateExternalToolSupervisedExecutionRequest,
  buildExternalToolSupervisedExecutionContract,
  buildExternalToolSupervisedExecutionHandoff,
  validateExternalToolSupervisedExecutionHandoff,
  writeExternalToolSupervisedExecutionHandoff,
  summarizeExternalToolSupervisedExecutionHandoff,
}
