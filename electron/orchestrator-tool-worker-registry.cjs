const fs = require('node:fs')
const path = require('node:path')

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
  'No cambiar package.json ni package-lock.json sin aprobacion explicita.',
  'No escribir fuera de sandbox o scope aprobado.',
  'No usar git add .',
  'No borrar archivos fuera del scope aprobado.',
  'No ejecutar herramientas GUI automaticamente sin aprobacion.',
]

const GLOBAL_FORBIDDEN_PATTERNS = [
  /\bweb-prueba\b/iu,
  /(^|[\\/\s])\.env($|[\\/\s])/iu,
  /\bnode_modules\b/iu,
  /\bDockerfile\b/iu,
  /\bdocker-compose\b/iu,
  /\bdeploy\b/iu,
  /\bservicios?\s+externos?\s+reales?\b/iu,
  /\bpagos?\s+reales?\b/iu,
  /\bDB\s+productiva\b/iu,
  /\bbase\s+productiva\b/iu,
  /\bcredenciales?\s+reales?\b/iu,
  /\bpackage(?:-lock)?\.json\b.*\b(?:modificar|cambiar|actualizar)\b/iu,
  /\bgit\s+add\s+\./iu,
  /\bborrar\b.*\bfuera\b.*\bscope\b/iu,
  /\bejecutar\b.*\b(?:Blender|Unity|GUI)\b/iu,
  /\babrir\b.*\b(?:Blender|Unity)\b/iu,
]

const DEFAULT_VALIDATION_COMMANDS = [
  'git diff --check',
  'git status --short',
]

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

function normalizeRiskLevel(riskLevel) {
  return ['low', 'medium', 'high', 'critical'].includes(riskLevel) ? riskLevel : 'medium'
}

function normalizeExecutionMode(executionMode) {
  return ['manual', 'supervised', 'planned', 'future-automatic'].includes(executionMode)
    ? executionMode
    : 'manual'
}

function normalizeStatus(status) {
  return ['available', 'planned', 'disabled'].includes(status) ? status : 'available'
}

function normalizeToolWorker(worker = {}) {
  return {
    id: String(worker.id || '').trim(),
    displayName: String(worker.displayName || worker.id || '').trim(),
    kind: String(worker.kind || 'local-script').trim(),
    executionMode: normalizeExecutionMode(worker.executionMode),
    status: normalizeStatus(worker.status),
    capabilities: unique(worker.capabilities),
    inputContracts: unique(worker.inputContracts),
    outputContracts: unique(worker.outputContracts),
    allowedScopes: unique(worker.allowedScopes),
    forbiddenActions: unique([
      ...GLOBAL_FORBIDDEN_ACTIONS,
      ...ensureArray(worker.forbiddenActions),
    ]),
    requiresApproval: worker.requiresApproval !== false,
    riskLevel: normalizeRiskLevel(worker.riskLevel),
    defaultValidationCommands: unique([
      ...DEFAULT_VALIDATION_COMMANDS,
      ...ensureArray(worker.defaultValidationCommands),
    ]),
    notes: unique(worker.notes),
  }
}

function validateToolWorker(worker = {}) {
  const normalized = normalizeToolWorker(worker)
  const issues = []
  if (!normalized.id) {
    issues.push('id faltante')
  }
  if (!normalized.displayName) {
    issues.push('displayName faltante')
  }
  if (!normalized.kind) {
    issues.push('kind faltante')
  }
  if (!normalized.capabilities.length) {
    issues.push('capabilities faltantes')
  }
  if (!normalized.forbiddenActions.length) {
    issues.push('forbiddenActions faltantes')
  }
  return {
    valid: issues.length === 0,
    issues,
    worker: normalized,
  }
}

function getDefaultToolWorkerRegistry() {
  const workers = [
    {
      id: 'codex-manual-correction',
      displayName: 'Codex Manual Correction Worker',
      kind: 'code-agent',
      executionMode: 'manual',
      status: 'available',
      capabilities: ['code.fix', 'sandbox.delivery.correct', 'tests.update', 'docs.update'],
      inputContracts: ['correction-brief', 'delivery-review-report', 'sandbox-evidence'],
      outputContracts: ['corrected-sandbox-evidence', 'review-ready-artifacts'],
      allowedScopes: [
        '.codex-temp sandbox evidence',
        'versioned files only when the prompt explicitly allows it',
      ],
      forbiddenActions: [
        'No cambiar package.json ni package-lock.json sin aprobacion explicita.',
        'No hacer commit.',
        'No hacer push.',
      ],
      requiresApproval: true,
      riskLevel: 'medium',
      defaultValidationCommands: [
        'node scripts/generated-domain-delivery-review-loop-smoke.mjs',
        'node scripts/generated-domain-sandbox-approval-battery-smoke.mjs',
      ],
      notes: ['Manual handoff only. Codex is not invoked automatically.'],
    },
    {
      id: 'local-smoke-runner',
      displayName: 'Local Smoke Runner',
      kind: 'local-script',
      executionMode: 'supervised',
      status: 'available',
      capabilities: ['tests.run', 'quality.run', 'reports.generate'],
      inputContracts: ['validation-command-list'],
      outputContracts: ['test-output', 'quality-report'],
      allowedScopes: ['read-only repository checks', '.codex-temp reports'],
      forbiddenActions: [
        'No modificar codigo.',
        'No instalar dependencias.',
        'No tocar web-prueba.',
        'No tocar .env.',
      ],
      requiresApproval: true,
      riskLevel: 'low',
      defaultValidationCommands: ['npm run quality:ci'],
      notes: ['Runs must be initiated by a supervised human/operator flow.'],
    },
    {
      id: 'blender-manual-asset-worker',
      displayName: 'Blender Manual Asset Worker',
      kind: 'asset-tool',
      executionMode: 'planned',
      status: 'planned',
      capabilities: [
        'asset.blender.create',
        'asset.blender.modify',
        'asset.export.fbx',
        'asset.render.preview',
      ],
      inputContracts: ['asset-brief', 'approved-art-source'],
      outputContracts: ['preview-render', 'exported-asset'],
      allowedScopes: ['approved asset sandbox', 'approved art source folder'],
      forbiddenActions: [
        'No ejecutar Blender automaticamente en v0.1.',
        'No escribir fuera de sandbox/art source permitido.',
        'No tocar Unity directamente.',
        'No instalar addons.',
        'No usar paths no aprobados.',
      ],
      requiresApproval: true,
      riskLevel: 'high',
      defaultValidationCommands: [],
      notes: ['Planned worker. Produces preparation handoff only in v0.1.'],
    },
    {
      id: 'unity-manual-integration-worker',
      displayName: 'Unity Manual Integration Worker',
      kind: 'game-engine',
      executionMode: 'planned',
      status: 'planned',
      capabilities: [
        'unity.import.assets',
        'unity.validate.scene',
        'unity.run.tests',
        'unity.generate.prefab',
      ],
      inputContracts: ['unity-task-brief', 'approved-unity-project-scope'],
      outputContracts: ['unity-import-report', 'scene-validation-report'],
      allowedScopes: ['approved Unity sandbox branch', 'approved Unity asset folder'],
      forbiddenActions: [
        'No abrir Unity automaticamente en v0.1.',
        'No modificar proyecto real sin approval.',
        'No tocar escenas productivas sin rama/sandbox.',
        'No borrar assets.',
        'No generar builds.',
      ],
      requiresApproval: true,
      riskLevel: 'high',
      defaultValidationCommands: [],
      notes: ['Planned worker. No Unity process execution in v0.1.'],
    },
    {
      id: 'github-ci-observer',
      displayName: 'GitHub CI Observer',
      kind: 'github-tool',
      executionMode: 'manual',
      status: 'available',
      capabilities: ['git.status.read', 'github.ci.read', 'git.diff.inspect'],
      inputContracts: ['git-repo', 'ci-run-id'],
      outputContracts: ['ci-status-report', 'git-status-summary'],
      allowedScopes: ['read-only git and CI inspection'],
      forbiddenActions: [
        'No hacer commit automatico.',
        'No hacer push automatico.',
        'No hacer merge automatico.',
        'No borrar ramas.',
      ],
      requiresApproval: true,
      riskLevel: 'low',
      defaultValidationCommands: [],
      notes: ['Read-only observer for Git/GitHub state.'],
    },
    {
      id: 'mcp-future-worker',
      displayName: 'MCP Future Worker',
      kind: 'mcp-tool',
      executionMode: 'planned',
      status: 'planned',
      capabilities: ['mcp.invoke', 'tool.discover', 'tool.route'],
      inputContracts: ['mcp-task-brief'],
      outputContracts: ['mcp-plan', 'tool-routing-report'],
      allowedScopes: ['planned MCP routing only'],
      forbiddenActions: [
        'No invocar MCP real en v0.1.',
        'No usar credenciales.',
        'No usar servicios externos.',
        'No hacer filesystem write sin permiso.',
      ],
      requiresApproval: true,
      riskLevel: 'critical',
      defaultValidationCommands: [],
      notes: ['Future worker. Produces planning/handoff only.'],
    },
  ].map(normalizeToolWorker)

  return {
    version: '0.1',
    globalForbiddenActions: GLOBAL_FORBIDDEN_ACTIONS,
    workers,
  }
}

function listToolWorkers(registry = getDefaultToolWorkerRegistry(), filters = {}) {
  return (registry.workers || [])
    .map(normalizeToolWorker)
    .filter((worker) => {
      if (filters.status && worker.status !== filters.status) {
        return false
      }
      if (filters.executionMode && worker.executionMode !== filters.executionMode) {
        return false
      }
      if (filters.kind && worker.kind !== filters.kind) {
        return false
      }
      if (filters.capability && !worker.capabilities.includes(filters.capability)) {
        return false
      }
      return true
    })
}

function riskRank(riskLevel) {
  return {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  }[normalizeRiskLevel(riskLevel)]
}

function findToolWorkersForCapability(registry, capability, options = {}) {
  const maxRisk = options.maxRiskLevel ? riskRank(options.maxRiskLevel) : Infinity
  return listToolWorkers(registry, {
    capability,
    status: options.status,
    executionMode: options.executionMode,
  }).filter((worker) => riskRank(worker.riskLevel) <= maxRisk)
}

function taskText(task = {}) {
  return [
    task.title,
    task.goal,
    task.capability,
    ...(task.targetPaths || []),
    ...(task.inputArtifacts || []),
    ...(task.outputArtifacts || []),
    ...(task.constraints || []),
    ...(task.forbiddenActions || []),
  ]
    .filter(Boolean)
    .join('\n')
}

function findForbiddenRequests(task = {}) {
  const text = taskText(task)
  const violations = []
  for (const pattern of GLOBAL_FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(pattern.source)
    }
  }
  return violations
}

function scopeCompatible(worker, task = {}) {
  const targetPaths = ensureArray(task.targetPaths)
  if (!targetPaths.length) {
    return true
  }
  const lowerAllowedScopes = worker.allowedScopes.join('\n').toLowerCase()
  return targetPaths.every((targetPath) => {
    const value = String(targetPath || '').replaceAll('\\', '/').toLowerCase()
    if (!value) {
      return true
    }
    if (value.includes('web-prueba') || value.includes('node_modules') || value.includes('.env')) {
      return false
    }
    if (value.startsWith('.codex-temp/') || value.includes('/.codex-temp/')) {
      return true
    }
    if (lowerAllowedScopes.includes('versioned files only when the prompt explicitly allows it')) {
      return task.allowVersionedFiles === true
    }
    if (lowerAllowedScopes.includes('read-only')) {
      return task.readOnly === true
    }
    return false
  })
}

function validateWorkerTask(worker, task = {}) {
  const normalizedWorker = normalizeToolWorker(worker)
  const issues = []
  const warnings = []

  if (!task.capability) {
    issues.push('task capability faltante')
  } else if (!normalizedWorker.capabilities.includes(task.capability)) {
    issues.push(`worker no soporta capability: ${task.capability}`)
  }

  const forbiddenViolations = findForbiddenRequests(task)
  if (forbiddenViolations.length) {
    issues.push('task solicita accion globalmente prohibida')
  }

  if (!scopeCompatible(normalizedWorker, task)) {
    issues.push('task fuera del scope permitido para el worker')
  }

  if (normalizedWorker.status !== 'available') {
    warnings.push(`worker status ${normalizedWorker.status}`)
  }
  if (normalizedWorker.executionMode === 'planned' || normalizedWorker.executionMode === 'future-automatic') {
    warnings.push(`worker executionMode ${normalizedWorker.executionMode}`)
  }
  if (normalizedWorker.requiresApproval || task.approvalMode === 'human') {
    warnings.push('requiere aprobacion humana')
  }

  return {
    valid: issues.length === 0,
    blocked: issues.length > 0,
    requiresHumanApproval: normalizedWorker.requiresApproval || warnings.length > 0,
    issues,
    warnings,
    forbiddenViolations,
  }
}

function envelopeStatusFromValidation(worker, task, validation) {
  if (!worker) {
    return 'no_matching_worker'
  }
  if (validation.blocked) {
    return 'blocked'
  }
  if (worker.status !== 'available' || worker.executionMode === 'planned' || worker.executionMode === 'future-automatic') {
    return 'requires_human_approval'
  }
  if (validation.requiresHumanApproval && task.approvalMode !== 'preapproved') {
    return 'requires_human_approval'
  }
  return 'ready'
}

function selectWorkerForTask(registry, task = {}, options = {}) {
  if (options.workerId) {
    return listToolWorkers(registry).find((worker) => worker.id === options.workerId) || null
  }
  const matches = findToolWorkersForCapability(registry, task.capability, options)
  return matches[0] || null
}

function buildWorkerTaskEnvelope(worker, task = {}, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const selectedWorker = worker ? normalizeToolWorker(worker) : selectWorkerForTask(registry, task, options)
  if (!selectedWorker) {
    return {
      envelopeStatus: 'no_matching_worker',
      workerId: '',
      workerDisplayName: '',
      capability: task.capability || '',
      taskTitle: task.title || '',
      allowedScope: [],
      forbiddenActions: GLOBAL_FORBIDDEN_ACTIONS,
      requiredInputs: ensureArray(task.inputArtifacts),
      expectedOutputs: ensureArray(task.outputArtifacts),
      validationCommands: DEFAULT_VALIDATION_COMMANDS,
      prompt: '',
      safetyNotes: ['No matching worker found for requested capability.'],
      metadata: {
        generatedAt: new Date().toISOString(),
        dryRun: task.dryRun !== false,
      },
    }
  }

  const validation = validateWorkerTask(selectedWorker, task)
  const envelope = {
    envelopeStatus: envelopeStatusFromValidation(selectedWorker, task, validation),
    workerId: selectedWorker.id,
    workerDisplayName: selectedWorker.displayName,
    capability: task.capability || '',
    taskTitle: task.title || '',
    goal: task.goal || '',
    allowedScope: selectedWorker.allowedScopes,
    forbiddenActions: unique([
      ...selectedWorker.forbiddenActions,
      ...ensureArray(task.forbiddenActions),
    ]),
    requiredInputs: ensureArray(task.inputArtifacts),
    expectedOutputs: ensureArray(task.outputArtifacts),
    validationCommands: unique([
      ...selectedWorker.defaultValidationCommands,
      ...ensureArray(task.validationCommands),
    ]),
    prompt: '',
    safetyNotes: unique([
      ...validation.issues,
      ...validation.warnings,
      ...(options.safetyNotes || []),
    ]),
    metadata: {
      generatedAt: new Date().toISOString(),
      workerKind: selectedWorker.kind,
      executionMode: selectedWorker.executionMode,
      workerStatus: selectedWorker.status,
      riskLevel: selectedWorker.riskLevel,
      dryRun: task.dryRun !== false,
      requiresApproval: validation.requiresHumanApproval,
      validation,
    },
  }
  envelope.prompt = buildManualWorkerHandoffPrompt(envelope)
  return envelope
}

function buildManualWorkerHandoffPrompt(envelope = {}) {
  const isBlocked = envelope.envelopeStatus === 'blocked'
  const isPlanned = envelope.envelopeStatus === 'requires_human_approval'
  const lines = [
    'MANUAL TOOL WORKER HANDOFF',
    '',
    `Worker: ${envelope.workerDisplayName || '(none)'} (${envelope.workerId || 'no-worker'})`,
    `Capability: ${envelope.capability || '(none)'}`,
    `Task: ${envelope.taskTitle || '(untitled)'}`,
    `Status: ${envelope.envelopeStatus || '(unknown)'}`,
    `Dry run: ${envelope.metadata?.dryRun === false ? 'false' : 'true'}`,
    '',
    'Goal:',
    envelope.goal || '(no goal provided)',
    '',
    'Required inputs:',
    ...(envelope.requiredInputs?.length ? envelope.requiredInputs.map((item) => `- ${item}`) : ['- None']),
    '',
    'Expected outputs:',
    ...(envelope.expectedOutputs?.length ? envelope.expectedOutputs.map((item) => `- ${item}`) : ['- None']),
    '',
    'Allowed scope:',
    ...(envelope.allowedScope?.length ? envelope.allowedScope.map((item) => `- ${item}`) : ['- None']),
    '',
    'Forbidden actions:',
    ...envelope.forbiddenActions.map((item) => `- ${item}`),
    '',
    'Validation commands:',
    ...(envelope.validationCommands?.length
      ? envelope.validationCommands.map((item) => `- ${item}`)
      : ['- None']),
    '',
    'Safety notes:',
    ...(envelope.safetyNotes?.length ? envelope.safetyNotes.map((item) => `- ${item}`) : ['- None']),
    '',
  ]

  if (isBlocked) {
    lines.push(
      'This task is blocked. Do not execute or correct automatically. Ask for human review.',
      '',
    )
  } else if (isPlanned) {
    lines.push(
      'This worker is planned or requires approval. Produce only a preparation plan. Do not execute Blender, Unity, MCP, external tools, deploys, or writes outside the approved scope.',
      '',
    )
  } else {
    lines.push(
      'This is a manual/supervised handoff. Do not execute automatically from the registry. Follow the allowed scope and validation commands only after human approval.',
      '',
    )
  }

  return `${lines.join('\n')}\n`
}

function writeWorkerTaskEnvelope(outputDir, envelope) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  fs.mkdirSync(outputDir, { recursive: true })
  const envelopePath = path.join(outputDir, 'worker-task-envelope.json')
  const promptPath = path.join(outputDir, 'worker-handoff-prompt.md')
  fs.writeFileSync(envelopePath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8')
  fs.writeFileSync(promptPath, envelope.prompt || buildManualWorkerHandoffPrompt(envelope), 'utf8')
  return {
    envelopePath,
    promptPath,
  }
}

module.exports = {
  getDefaultToolWorkerRegistry,
  normalizeToolWorker,
  validateToolWorker,
  listToolWorkers,
  findToolWorkersForCapability,
  validateWorkerTask,
  buildWorkerTaskEnvelope,
  buildManualWorkerHandoffPrompt,
  writeWorkerTaskEnvelope,
}
