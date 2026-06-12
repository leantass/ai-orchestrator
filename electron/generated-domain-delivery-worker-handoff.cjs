const fs = require('node:fs')
const path = require('node:path')

const {
  getDefaultToolWorkerRegistry,
  findToolWorkersForCapability,
  buildWorkerTaskEnvelope,
  buildManualWorkerHandoffPrompt,
  writeWorkerTaskEnvelope,
} = require('./orchestrator-tool-worker-registry.cjs')

const DEFAULT_CAPABILITY = 'sandbox.delivery.correct'
const DEFAULT_WORKER_ID = 'codex-manual-correction'
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
  'No escribir fuera de .codex-temp o scope aprobado.',
  'No usar git add .',
  'No hacer commit.',
  'No hacer push.',
]
const DEFAULT_VALIDATION_COMMANDS = [
  'node scripts/generated-domain-delivery-review-loop-smoke.mjs',
  'node scripts/generated-domain-delivery-review-evidence-smoke.mjs',
  'node scripts/generated-domain-sandbox-approval-battery-smoke.mjs',
  'git diff --check',
  'git status --short',
]
const DANGEROUS_PROMPT_PATTERNS = [
  { label: 'crear .env', pattern: /\b(?:crear|generar|escribir|modificar|actualizar)\b.*(^|[\\/\s])\.env($|[\\/\s])/iu },
  { label: 'instalar dependencias', pattern: /\b(?:instalar|agregar)\b.*\bdependencias?\b/iu },
  { label: 'usar Docker', pattern: /\b(?:usar|crear|generar|ejecutar)\b.*\b(?:Dockerfile|docker|docker-compose)\b/iu },
  { label: 'hacer deploy', pattern: /\b(?:hacer|ejecutar|preparar|lanzar)\b.*\bdeploy\b/iu },
  { label: 'tocar web-prueba', pattern: /\b(?:tocar|modificar|escribir|borrar)\b.*\bweb-prueba\b/iu },
  { label: 'modificar packages', pattern: /\b(?:modificar|cambiar|actualizar)\b.*\bpackage(?:-lock)?\.json\b/iu },
  { label: 'usar credenciales', pattern: /\b(?:usar|crear|guardar|pedir)\b.*\bcredenciales?\b/iu },
]

function readTextFileIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return ''
    }
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

function readJsonFileIfExists(filePath) {
  const text = readTextFileIfExists(filePath)
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    return {
      __parseError: error.message,
      __rawText: text,
    }
  }
}

function writeTextFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, value, 'utf8')
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

function loadCodexCorrectionHandoff(handoffPath) {
  const handoff = readJsonFileIfExists(handoffPath)
  if (!handoff || handoff.__parseError) {
    return {
      handoff: null,
      prompt: '',
      path: handoffPath || '',
      error: handoff?.__parseError || 'handoff faltante',
    }
  }
  const promptPath = handoff.promptPath || path.join(path.dirname(handoffPath), 'codex-correction-handoff-prompt.md')
  return {
    handoff,
    prompt: readTextFileIfExists(promptPath) || handoff.codexPrompt || '',
    path: handoffPath || '',
    promptPath,
    error: '',
  }
}

function loadCodexCorrectionTask(taskPath) {
  const task = readJsonFileIfExists(taskPath)
  if (!task || task.__parseError) {
    return {
      task: null,
      prompt: '',
      path: taskPath || '',
      error: task?.__parseError || 'task faltante',
    }
  }
  const promptPath = path.join(path.dirname(taskPath), 'codex-correction-prompt.md')
  return {
    task,
    prompt: readTextFileIfExists(promptPath) || task.prompt || '',
    path: taskPath || '',
    promptPath,
    error: '',
  }
}

function hasSafeNegation(line, matchIndex) {
  const before = line.slice(0, Math.max(0, matchIndex)).toLowerCase()
  return /(?:^|[\s.;:,-])(?:no|sin|nunca|prohibido|evitar|no debe|no usar|no crear|no tocar|no hacer|no instalar|no modificar)\b/u.test(before)
}

function detectDangerousPromptInstructions(promptText) {
  const dangerous = []
  const lines = String(promptText || '').split(/\r?\n/u)
  for (const line of lines) {
    for (const { label, pattern } of DANGEROUS_PROMPT_PATTERNS) {
      const match = pattern.exec(line)
      if (!match) {
        continue
      }
      if (hasSafeNegation(line, match.index)) {
        continue
      }
      dangerous.push({
        label,
        evidence: line.trim(),
      })
    }
  }
  return dangerous
}

function sourceStatus({ correctionTask, handoff }) {
  return (
    correctionTask?.taskStatus ||
    handoff?.handoffStatus ||
    correctionTask?.sourceReviewStatus ||
    ''
  )
}

function buildDeliveryWorkerTaskFromCodexCorrection(input = {}) {
  const correctionTask = input.correctionTask || {}
  const handoff = input.handoff || {}
  const caseName =
    input.caseName ||
    handoff.caseName ||
    correctionTask.title?.replace(/^Corregir entrega generada para\s+/iu, '') ||
    ''
  const evidenceDir =
    input.evidenceDir ||
    handoff.sourceEvidenceDir ||
    correctionTask.evidenceDir ||
    ''
  const correctedEvidenceDir =
    input.correctedEvidenceDir ||
    handoff.correctedEvidenceDir ||
    ''
  const outputArtifacts = unique([
    ...(handoff.expectedArtifacts || []),
    ...(correctionTask.outputArtifacts || []),
    'request.json',
    'decisions-and-approvals.json',
    'generated-files.json',
    'summary.json',
    'validation-summary.json',
    'validation/report.json',
  ])

  return {
    title: correctionTask.title || `Corregir entrega generada para ${caseName || 'caso sin nombre'}`,
    goal:
      input.goal ||
      `Corregir solo la entrega sandbox indicada por el review${caseName ? ` para ${caseName}` : ''}.`,
    capability: input.capability || DEFAULT_CAPABILITY,
    targetPaths: unique([correctedEvidenceDir].filter(Boolean)),
    inputArtifacts: unique([
      evidenceDir,
      input.taskPath,
      input.promptPath,
      input.handoffPath,
      ...(correctionTask.inputArtifacts || []),
    ]),
    outputArtifacts,
    constraints: unique([
      'solo .codex-temp',
      'sin cambios versionados',
      'correccion manual/supervisada',
      ...(handoff.restrictions || []),
      ...(correctionTask.allowedScope || []),
    ]),
    forbiddenActions: [],
    validationCommands: unique([
      ...(handoff.validationCommands || []),
      ...(correctionTask.validationCommands || []),
      ...DEFAULT_VALIDATION_COMMANDS,
      handoff.roundtripCommand || '',
    ]),
    approvalMode: 'preapproved',
    dryRun: true,
    caseName,
    evidenceDir,
    correctedEvidenceDir,
  }
}

function findWorker(registry, workerId, capability) {
  const workers = findToolWorkersForCapability(registry, capability)
  if (workerId) {
    return workers.find((worker) => worker.id === workerId) || null
  }
  return workers[0] || null
}

function statusFromInputs({ correctionTask, handoff, correctionPrompt, evidenceDir, correctedEvidenceDir }) {
  const status = sourceStatus({ correctionTask, handoff })
  if (!correctionTask && !handoff) {
    return 'missing_artifacts'
  }
  if (!correctionPrompt) {
    return 'missing_artifacts'
  }
  if (!evidenceDir) {
    return 'missing_artifacts'
  }
  if (status === 'no_action_needed') {
    return 'no_action_needed'
  }
  if (status === 'blocked_requires_human' || status === 'blocked') {
    return 'blocked'
  }
  if (!correctedEvidenceDir) {
    return 'missing_artifacts'
  }
  return ''
}

function buildFinalPrompt({ workerEnvelope, correctionPrompt, handoff, correctionTask, dangerousInstructions }) {
  if (dangerousInstructions.length || workerEnvelope.envelopeStatus === 'blocked') {
    return [
      'CODEX WORKER HANDOFF - SECURITY DIAGNOSTIC',
      '',
      'This worker handoff is blocked or requires human safety review.',
      'Do not correct files automatically. Do not modify evidence.',
      '',
      'Detected safety issues:',
      ...dangerousInstructions.map((item) => `- ${item.label}: ${item.evidence}`),
      ...workerEnvelope.safetyNotes.map((note) => `- ${note}`),
      '',
      buildManualWorkerHandoffPrompt(workerEnvelope),
    ].join('\n')
  }

  return [
    'CODEX MANUAL CORRECTION WORKER HANDOFF',
    '',
    `Worker: ${workerEnvelope.workerDisplayName}`,
    `Case: ${workerEnvelope.metadata?.caseName || '(sin caso)'}`,
    `Capability: ${workerEnvelope.capability}`,
    '',
    'Mode:',
    '- Manual/supervised.',
    '- Do not execute Codex automatically from JEFE.',
    '- Do not commit, push, deploy, install dependencies, or open external tools.',
    '',
    'Evidence:',
    `- Initial evidence: ${workerEnvelope.metadata?.evidenceDir || '(no disponible)'}`,
    `- Corrected evidence destination: ${workerEnvelope.metadata?.correctedEvidenceDir || '(no disponible)'}`,
    `- Source handoff: ${workerEnvelope.metadata?.handoffPath || '(no disponible)'}`,
    `- Source task: ${workerEnvelope.metadata?.taskPath || '(no disponible)'}`,
    '',
    'Allowed scope:',
    '- Work only inside the corrected evidence folder under .codex-temp.',
    '- Do not modify versioned product files.',
    '',
    'Hard restrictions:',
    ...workerEnvelope.forbiddenActions.map((action) => `- ${action}`),
    '',
    'Validation commands:',
    ...workerEnvelope.validationCommands.map((command) => `- ${command}`),
    '',
    'Expected report after manual work:',
    '- What changed in corrected evidence.',
    '- Which restrictions were respected.',
    '- Which validations were executed.',
    '- Whether re-review should pass or needs another round.',
    '',
    'Original correction prompt:',
    correctionPrompt || correctionTask?.prompt || handoff?.codexPrompt || '(no prompt)',
    '',
  ].join('\n')
}

function buildDeliveryWorkerHandoff(input = {}, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const capability = input.capability || options.capability || DEFAULT_CAPABILITY
  const workerId = input.workerId || options.workerId || DEFAULT_WORKER_ID
  const correctionTask = input.correctionTask || null
  const handoff = input.handoff || null
  const correctionPrompt = input.correctionPrompt || input.prompt || handoff?.codexPrompt || correctionTask?.prompt || ''
  const evidenceDir = input.evidenceDir || handoff?.sourceEvidenceDir || correctionTask?.evidenceDir || ''
  const correctedEvidenceDir = input.correctedEvidenceDir || handoff?.correctedEvidenceDir || ''
  const earlyStatus = statusFromInputs({
    correctionTask,
    handoff,
    correctionPrompt,
    evidenceDir,
    correctedEvidenceDir,
  })
  const worker = findWorker(registry, workerId, capability)
  if (!worker) {
    return {
      workerHandoffStatus: 'no_matching_worker',
      workerId,
      workerDisplayName: '',
      capability,
      caseName: input.caseName || handoff?.caseName || '',
      sourceTaskStatus: sourceStatus({ correctionTask, handoff }),
      evidenceDir,
      correctedEvidenceDir,
      workerEnvelope: null,
      finalPrompt: '',
      restrictions: [],
      forbiddenActions: HARD_FORBIDDEN_ACTIONS,
      validationCommands: DEFAULT_VALIDATION_COMMANDS,
      artifacts: [],
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    }
  }

  const workerTask = buildDeliveryWorkerTaskFromCodexCorrection({
    ...input,
    capability,
    correctionTask,
    handoff,
    evidenceDir,
    correctedEvidenceDir,
  })
  const dangerousInstructions = detectDangerousPromptInstructions(correctionPrompt)
  const workerEnvelope = buildWorkerTaskEnvelope(worker, workerTask, {
    registry,
    workerId,
  })
  workerEnvelope.forbiddenActions = unique([
    ...workerEnvelope.forbiddenActions,
    ...HARD_FORBIDDEN_ACTIONS,
    ...(handoff?.forbiddenActions || []),
    ...(correctionTask?.forbiddenActions || []),
  ])
  workerEnvelope.metadata = {
    ...workerEnvelope.metadata,
    caseName: workerTask.caseName,
    evidenceDir,
    correctedEvidenceDir,
    handoffPath: input.handoffPath || '',
    taskPath: input.taskPath || '',
    promptPath: input.promptPath || '',
    dangerousInstructions,
  }

  let workerHandoffStatus = earlyStatus || workerEnvelope.envelopeStatus
  if (dangerousInstructions.length) {
    workerHandoffStatus = 'blocked'
  } else if (workerHandoffStatus === 'requires_human_approval' && sourceStatus({ correctionTask, handoff }) === 'ready') {
    workerHandoffStatus = 'ready'
  }
  if (workerHandoffStatus === 'no_action_needed') {
    workerEnvelope.envelopeStatus = 'no_action_needed'
  } else if (workerHandoffStatus === 'blocked') {
    workerEnvelope.envelopeStatus = 'blocked'
  } else if (workerHandoffStatus === 'ready') {
    workerEnvelope.envelopeStatus = 'ready'
  }

  const finalPrompt =
    workerHandoffStatus === 'no_action_needed'
      ? [
          'CODEX WORKER HANDOFF - NO ACTION NEEDED',
          '',
          'The source correction task is already no_action_needed.',
          'Do not generate an aggressive correction prompt.',
          buildManualWorkerHandoffPrompt(workerEnvelope),
        ].join('\n')
      : buildFinalPrompt({
          workerEnvelope,
          correctionPrompt,
          handoff,
          correctionTask,
          dangerousInstructions,
        })

  return {
    workerHandoffStatus,
    workerId: worker.id,
    workerDisplayName: worker.displayName,
    capability,
    caseName: workerTask.caseName,
    sourceTaskStatus: sourceStatus({ correctionTask, handoff }),
    evidenceDir,
    correctedEvidenceDir,
    workerEnvelope,
    finalPrompt,
    restrictions: unique(workerTask.constraints),
    forbiddenActions: unique(workerEnvelope.forbiddenActions),
    validationCommands: unique(workerEnvelope.validationCommands),
    artifacts: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      handoffPath: input.handoffPath || '',
      taskPath: input.taskPath || '',
      promptPath: input.promptPath || '',
      dangerousInstructions,
    },
  }
}

function validateDeliveryWorkerHandoff(workerHandoff = {}) {
  const issues = []
  if (!workerHandoff.workerHandoffStatus) {
    issues.push('workerHandoffStatus faltante')
  }
  if (workerHandoff.workerHandoffStatus === 'ready' && workerHandoff.workerId !== DEFAULT_WORKER_ID) {
    issues.push('worker inesperado para handoff ready')
  }
  if (workerHandoff.workerHandoffStatus === 'ready' && !workerHandoff.correctedEvidenceDir) {
    issues.push('correctedEvidenceDir faltante')
  }
  if (workerHandoff.workerHandoffStatus === 'ready' && !workerHandoff.finalPrompt) {
    issues.push('finalPrompt faltante')
  }
  if (/\bweb-prueba\b/iu.test(workerHandoff.correctedEvidenceDir || '')) {
    issues.push('destino web-prueba prohibido')
  }
  if (/(^|[\\/\s])\.env($|[\\/\s])/iu.test(workerHandoff.correctedEvidenceDir || '')) {
    issues.push('destino .env prohibido')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function renderReadme(workerHandoff) {
  return [
    '# Delivery Worker Handoff',
    '',
    `Case: ${workerHandoff.caseName || '(none)'}`,
    `Worker: ${workerHandoff.workerDisplayName || workerHandoff.workerId}`,
    `Status: ${workerHandoff.workerHandoffStatus}`,
    '',
    'Files:',
    '- worker-handoff.json',
    '- worker-handoff-prompt.md',
    '- worker-envelope.json',
    '- README.md',
    '',
    'This handoff does not execute Codex automatically.',
    '',
  ].join('\n')
}

function writeDeliveryWorkerHandoff(outputDir, workerHandoff) {
  if (!outputDir) {
    throw new Error('outputDir is required')
  }
  fs.mkdirSync(outputDir, { recursive: true })
  const handoffPath = path.join(outputDir, 'worker-handoff.json')
  const promptPath = path.join(outputDir, 'worker-handoff-prompt.md')
  const envelopeDir = path.join(outputDir, 'envelope')
  const envelopeArtifacts = workerHandoff.workerEnvelope
    ? writeWorkerTaskEnvelope(envelopeDir, workerHandoff.workerEnvelope)
    : null
  const envelopePath = path.join(outputDir, 'worker-envelope.json')
  const readmePath = path.join(outputDir, 'README.md')
  const serializable = {
    ...workerHandoff,
    artifacts: [
      handoffPath,
      promptPath,
      envelopePath,
      readmePath,
      ...(envelopeArtifacts ? [envelopeArtifacts.envelopePath, envelopeArtifacts.promptPath] : []),
    ],
  }
  writeTextFile(handoffPath, `${JSON.stringify(serializable, null, 2)}\n`)
  writeTextFile(promptPath, workerHandoff.finalPrompt || '')
  writeTextFile(envelopePath, `${JSON.stringify(workerHandoff.workerEnvelope || null, null, 2)}\n`)
  writeTextFile(readmePath, renderReadme(workerHandoff))
  return {
    handoffPath,
    promptPath,
    envelopePath,
    readmePath,
  }
}

module.exports = {
  loadCodexCorrectionHandoff,
  loadCodexCorrectionTask,
  buildDeliveryWorkerTaskFromCodexCorrection,
  buildDeliveryWorkerHandoff,
  writeDeliveryWorkerHandoff,
  validateDeliveryWorkerHandoff,
}
