const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  getDefaultToolWorkerRegistry,
  findToolWorkersForCapability,
  validateWorkerTask,
  buildWorkerTaskEnvelope,
  buildManualWorkerHandoffPrompt,
} = require('./orchestrator-tool-worker-registry.cjs')

const repoRoot = path.resolve(__dirname, '..')

const SUPPORTED_CAPABILITIES = new Set([
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

const HARD_FORBIDDEN_ACTIONS = [
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

const DANGEROUS_PATTERNS = [
  { label: 'tocar web-prueba', pattern: /\b(?:tocar|modificar|escribir|borrar|usar)\b.*\bweb-prueba\b/iu },
  { label: 'crear .env', pattern: /\b(?:crear|generar|escribir|modificar|actualizar|usar)\b.*(^|[\\/\s])\.env($|[\\/\s])/iu },
  { label: 'crear node_modules', pattern: /\b(?:crear|generar|escribir|modificar|actualizar|usar)\b.*\bnode_modules\b/iu },
  { label: 'usar Docker', pattern: /\b(?:usar|crear|generar|ejecutar|preparar)\b.*\b(?:Dockerfile|docker|docker-compose)\b/iu },
  { label: 'hacer deploy', pattern: /\b(?:hacer|ejecutar|preparar|lanzar|publicar)\b.*\bdeploy\b/iu },
  { label: 'servicios externos reales', pattern: /\b(?:usar|conectar|invocar|llamar)\b.*\bservicios?\s+externos?\b/iu },
  { label: 'pagos reales', pattern: /\b(?:usar|activar|procesar|cobrar)\b.*\bpagos?\s+reales?\b/iu },
  { label: 'DB productiva', pattern: /\b(?:usar|conectar|escribir)\b.*\bDB\s+productiva\b/iu },
  { label: 'credenciales reales', pattern: /\b(?:usar|crear|guardar|pedir|solicitar)\b.*\bcredenciales?\s+reales?\b/iu },
  { label: 'package changes', pattern: /\b(?:modificar|cambiar|actualizar)\b.*\bpackage(?:-lock)?\.json\b/iu },
  { label: 'git add punto', pattern: /\bgit\s+add\s+\./iu },
  { label: 'abrir Blender automaticamente', pattern: /\b(?:abrir|ejecutar|lanzar)\b.*\bBlender\b/iu },
  { label: 'abrir Unity automaticamente', pattern: /\b(?:abrir|ejecutar|lanzar)\b.*\bUnity\b/iu },
  { label: 'invocar MCP real', pattern: /\b(?:invocar|ejecutar|llamar)\b.*\bMCP\b/iu },
  { label: 'instalar addons', pattern: /\binstalar\b.*\baddons?\b/iu },
  { label: 'generar builds', pattern: /\bgenerar\b.*\bbuilds?\b/iu },
  { label: 'borrar assets', pattern: /\bborrar\b.*\bassets?\b/iu },
]

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

function isSubpath(candidate, parent) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function resolveRepoPath(value) {
  return path.resolve(repoRoot, value || '')
}

function pathSegments(filePath) {
  return path
    .resolve(filePath)
    .split(path.sep)
    .map((segment) => segment.toLowerCase())
    .filter(Boolean)
}

function validateSafeOutputDir(outputDir) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  const resolved = resolveRepoPath(outputDir)
  const safeRoots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) => path.resolve(root))
  if (!safeRoots.some((root) => isSubpath(resolved, root))) {
    throw new Error(`Output inseguro: debe estar dentro de .codex-temp o temp seguro: ${resolved}`)
  }
  if (resolved === repoRoot) {
    throw new Error('Output inseguro: no puede ser la raiz del repo.')
  }
  for (const segment of pathSegments(resolved)) {
    if (['web-prueba', 'src', 'electron', 'scripts', '.git', 'node_modules'].includes(segment)) {
      throw new Error(`Output inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`Output inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }
  return resolved
}

function hasSafeNegation(line, matchIndex) {
  const prefix = line.slice(Math.max(0, matchIndex - 32), matchIndex).toLowerCase()
  return /\b(no|sin|nunca|prohibid[oa]|evitar)\b/u.test(prefix)
}

function findDangerousInstructions(values = []) {
  const findings = []
  const lines = unique(values).flatMap((value) => String(value || '').split(/\r?\n/u))
  for (const line of lines) {
    for (const check of DANGEROUS_PATTERNS) {
      const match = check.pattern.exec(line)
      if (match && !hasSafeNegation(line, match.index)) {
        findings.push({
          label: check.label,
          evidence: line.trim(),
        })
      }
      check.pattern.lastIndex = 0
    }
  }
  return findings
}

function workerTypeForCapability(capability) {
  if (String(capability || '').startsWith('asset.') || String(capability || '').startsWith('asset.blender')) {
    return 'blender'
  }
  if (String(capability || '').startsWith('unity.')) {
    return 'unity'
  }
  if (String(capability || '').startsWith('mcp.') || String(capability || '').startsWith('tool.')) {
    return 'mcp'
  }
  return 'unknown'
}

function defaultOutputsForCapability(capability) {
  const type = workerTypeForCapability(capability)
  if (type === 'blender') {
    return ['asset brief review', 'manual Blender preparation plan', 'preview/export checklist']
  }
  if (type === 'unity') {
    return ['Unity import/integration plan', 'scene or prefab validation checklist', 'manual test notes']
  }
  if (type === 'mcp') {
    return ['MCP readiness plan', 'tool routing report', 'approval and credentials checklist']
  }
  return ['planned worker handoff']
}

function validationPlanForWorkerType(type) {
  if (type === 'blender') {
    return [
      'Revision humana del brief de asset.',
      'Confirmar carpeta de entrada y salida aprobadas.',
      'Validar naming, formato esperado y checklist visual antes de cualquier ejecucion real.',
    ]
  }
  if (type === 'unity') {
    return [
      'Confirmar proyecto Unity objetivo y scope aprobado.',
      'Validar assets de entrada y escena/prefab esperada.',
      'Planificar validacion manual; no generar builds ni abrir Unity automaticamente.',
    ]
  }
  if (type === 'mcp') {
    return [
      'Confirmar capability y herramienta deseada.',
      'Documentar inputs/outputs esperados.',
      'Requerir aprobacion/credenciales futuras antes de cualquier invocacion real.',
    ]
  }
  return ['Revision humana del plan antes de ejecutar cualquier herramienta externa.']
}

function manualStepsForWorkerType(type) {
  if (type === 'blender') {
    return [
      'Preparar brief del asset, referencias aprobadas y carpeta sandbox de salida.',
      'Definir formato esperado, naming sugerido y criterios visuales.',
      'No abrir ni ejecutar Blender desde JEFE en esta version.',
      'Registrar resultados manuales y evidencia en .codex-temp.',
    ]
  }
  if (type === 'unity') {
    return [
      'Preparar lista de assets aprobados y proyecto/escena objetivo.',
      'Definir prefab/escena esperada y checklist de validacion.',
      'No abrir Unity ni generar builds desde JEFE en esta version.',
      'Registrar reporte manual de integracion y validacion.',
    ]
  }
  if (type === 'mcp') {
    return [
      'Describir herramienta/capability deseada y motivo.',
      'Enumerar inputs, outputs y permisos necesarios.',
      'No invocar MCP real desde JEFE en esta version.',
      'Registrar bloqueo o aprobacion futura requerida.',
    ]
  }
  return ['Preparar plan manual y esperar aprobacion humana.']
}

function buildPlannedExternalWorkerTask(input = {}) {
  return {
    taskTitle: input.taskTitle || input.title || `Planificar worker externo ${input.capability || 'sin capability'}`,
    capability: input.capability || '',
    targetProject: input.targetProject || '',
    targetPaths: unique(input.targetPaths || []),
    inputArtifacts: unique(input.inputArtifacts || []),
    outputArtifacts: unique(input.outputArtifacts || defaultOutputsForCapability(input.capability)),
    constraints: unique(input.constraints || []),
    forbiddenActions: unique(input.forbiddenActions || []),
    approvalMode: input.approvalMode || 'human',
    dryRun: input.dryRun !== false,
    workerPreference: input.workerPreference || input.workerId || '',
    metadata: {
      ...(input.metadata || {}),
      generatedAt: nowIso(),
    },
  }
}

function selectPlannedExternalWorker(task, registry = getDefaultToolWorkerRegistry(), options = {}) {
  const matches = findToolWorkersForCapability(registry, task.capability || '', {
    maxRiskLevel: options.maxRiskLevel,
  })
  if (task.workerPreference) {
    return matches.find((worker) => worker.id === task.workerPreference) || null
  }
  return matches.find((worker) => worker.executionMode === 'planned' || worker.status === 'planned') || matches[0] || null
}

function buildRegistryTask(task) {
  return {
    title: task.taskTitle,
    goal: `Preparar handoff manual planificado para capability ${task.capability}.`,
    capability: task.capability,
    targetPaths: task.targetPaths,
    inputArtifacts: task.inputArtifacts,
    outputArtifacts: task.outputArtifacts,
    constraints: ['planned external worker handoff only'],
    forbiddenActions: [],
    approvalMode: 'human',
    dryRun: true,
  }
}

function validatePlannedExternalWorkerTask(task, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const issues = []
  const warnings = []
  if (!task.capability) {
    issues.push('capability faltante')
  } else if (!SUPPORTED_CAPABILITIES.has(task.capability)) {
    issues.push(`capability no soportada: ${task.capability}`)
  }
  const worker = selectPlannedExternalWorker(task, registry, options)
  if (!worker) {
    issues.push('no_matching_worker')
  }
  if (!task.taskTitle) {
    issues.push('taskTitle faltante')
  }
  const dangerous = findDangerousInstructions([
    task.taskTitle,
    task.capability,
    task.targetProject,
    ...(task.targetPaths || []),
    ...(task.inputArtifacts || []),
    ...(task.outputArtifacts || []),
    ...(task.constraints || []),
    ...(task.forbiddenActions || []),
  ])
  if (dangerous.length) {
    issues.push('task pide accion peligrosa o fuera de scope')
  }
  const registryValidation = worker ? validateWorkerTask(worker, buildRegistryTask(task)) : null
  if (registryValidation?.blocked) {
    issues.push(...registryValidation.issues)
  }
  if (worker && (worker.status === 'planned' || worker.executionMode === 'planned')) {
    warnings.push('worker planned: no executable automaticamente')
  }
  if (worker?.requiresApproval) {
    warnings.push('requiere aprobacion humana')
  }
  return {
    valid: issues.length === 0,
    blocked: dangerous.length > 0 || issues.some((issue) => !['no_matching_worker'].includes(issue)),
    issues: unique(issues),
    warnings: unique(warnings),
    dangerous,
    worker,
    registryValidation,
  }
}

function handoffStatusFor(task, worker, validation) {
  if (!worker) {
    return 'no_matching_worker'
  }
  if (validation.dangerous.length || validation.issues.some((issue) => issue !== 'no_matching_worker')) {
    return 'blocked'
  }
  if ((task.inputArtifacts || []).some((artifact) => /missing|required/iu.test(artifact))) {
    return 'missing_artifacts'
  }
  if (worker.status === 'planned' || worker.executionMode === 'planned') {
    return 'planned_ready'
  }
  if (worker.requiresApproval) {
    return 'requires_human_approval'
  }
  return 'planned_ready'
}

function buildPlannedExternalWorkerHandoff(task, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const validation = validatePlannedExternalWorkerTask(task, { ...options, registry })
  const worker = validation.worker
  const type = workerTypeForCapability(task.capability)
  const registryEnvelope = worker ? buildWorkerTaskEnvelope(worker, buildRegistryTask(task), { registry }) : null
  const handoff = {
    handoffStatus: handoffStatusFor(task, worker, validation),
    workerId: worker?.id || '',
    workerDisplayName: worker?.displayName || '',
    workerKind: worker?.kind || '',
    capability: task.capability,
    taskTitle: task.taskTitle,
    targetProject: task.targetProject,
    allowedScope: worker?.allowedScopes || [],
    forbiddenActions: unique([
      ...HARD_FORBIDDEN_ACTIONS,
      ...(worker?.forbiddenActions || []),
      ...(task.forbiddenActions || []),
    ]),
    requiredInputs: task.inputArtifacts || [],
    expectedOutputs: task.outputArtifacts || [],
    validationPlan: validationPlanForWorkerType(type),
    manualSteps: manualStepsForWorkerType(type),
    prompt: '',
    safetyNotes: unique([
      ...validation.warnings,
      ...(validation.dangerous || []).map((finding) => `bloqueado: ${finding.label}`),
      'No ejecutar herramientas externas automaticamente.',
    ]),
    workerEnvelope: registryEnvelope,
    metadata: {
      generatedAt: nowIso(),
      workerType: type,
      validation,
      dryRun: true,
      plannedOnly: true,
    },
  }
  handoff.prompt = buildPlannedExternalWorkerPrompt(handoff, options)
  return handoff
}

function buildPlannedExternalWorkerPrompt(handoff, options = {}) {
  const mode = handoff.handoffStatus === 'blocked' ? 'DIAGNOSTICO/BLOQUEO' : 'PLANIFICACION MANUAL'
  const registryPrompt = handoff.workerEnvelope ? buildManualWorkerHandoffPrompt(handoff.workerEnvelope) : ''
  return [
    `PLANNED EXTERNAL WORKER HANDOFF - ${mode}`,
    '',
    `Worker: ${handoff.workerDisplayName || '(sin worker)'} (${handoff.workerId || 'no_matching_worker'})`,
    `Capability: ${handoff.capability}`,
    `Task: ${handoff.taskTitle}`,
    `Status: ${handoff.handoffStatus}`,
    `Target project: ${handoff.targetProject || '(no especificado)'}`,
    '',
    'Este handoff NO ejecuta herramientas externas. Requiere aprobacion humana antes de cualquier ejecucion real.',
    '',
    'Required inputs:',
    ...(handoff.requiredInputs.length ? handoff.requiredInputs.map((item) => `- ${item}`) : ['- Definir inputs aprobados antes de continuar.']),
    '',
    'Expected outputs:',
    ...handoff.expectedOutputs.map((item) => `- ${item}`),
    '',
    'Allowed scope:',
    ...(handoff.allowedScope.length ? handoff.allowedScope.map((item) => `- ${item}`) : ['- Scope aprobado pendiente.']),
    '',
    'Forbidden actions:',
    ...handoff.forbiddenActions.map((item) => `- ${item}`),
    '',
    'Manual steps:',
    ...handoff.manualSteps.map((item) => `- ${item}`),
    '',
    'Validation plan:',
    ...handoff.validationPlan.map((item) => `- ${item}`),
    '',
    registryPrompt ? 'Registry envelope context:' : '',
    registryPrompt,
    options.extraPrompt ? `\n${options.extraPrompt}` : '',
  ].filter((line) => line !== '').join('\n')
}

function summarizePlannedExternalWorkerHandoff(handoff = {}) {
  return `Planned external handoff ${handoff.handoffStatus || 'unknown'} para ${handoff.workerId || 'sin worker'} (${handoff.capability || 'sin capability'}).`
}

function writePlannedExternalWorkerHandoff(outputDir, handoff) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const handoffPath = path.join(resolvedOutputDir, 'planned-worker-handoff.json')
  const promptPath = path.join(resolvedOutputDir, 'planned-worker-handoff-prompt.md')
  const summaryPath = path.join(resolvedOutputDir, 'planned-worker-summary.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...handoff,
    artifacts: [handoffPath, promptPath, summaryPath, readmePath],
  }
  fs.writeFileSync(handoffPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(promptPath, handoff.prompt || buildPlannedExternalWorkerPrompt(handoff), 'utf8')
  fs.writeFileSync(summaryPath, `${summarizePlannedExternalWorkerHandoff(handoff)}\n`, 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# Planned External Worker Handoff',
      '',
      summarizePlannedExternalWorkerHandoff(handoff),
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    handoffPath,
    promptPath,
    summaryPath,
    readmePath,
    outputDir: resolvedOutputDir,
    handoff: serializable,
  }
}

module.exports = {
  buildPlannedExternalWorkerTask,
  validatePlannedExternalWorkerTask,
  selectPlannedExternalWorker,
  buildPlannedExternalWorkerHandoff,
  buildPlannedExternalWorkerPrompt,
  writePlannedExternalWorkerHandoff,
  summarizePlannedExternalWorkerHandoff,
  validateSafeOutputDir,
  findDangerousInstructions,
  SUPPORTED_CAPABILITIES,
}
