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

const {
  validateExternalToolApprovalGate,
} = require('./orchestrator-external-tool-approval-gates.cjs')

const {
  validateExternalToolDryRunPlan,
} = require('./orchestrator-external-tool-dry-run-planner.cjs')

const {
  validateExternalToolSupervisedExecutionHandoff,
} = require('./orchestrator-external-tool-supervised-execution.cjs')

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

function normalizeArtifact(value = {}, wrapperKey) {
  if (wrapperKey && value[wrapperKey]) {
    return value[wrapperKey]
  }
  return value
}

function normalizePlannedHandoff(value = {}) {
  return normalizeArtifact(value, 'handoff')
}

function normalizeApprovalGate(value = {}) {
  return normalizeArtifact(value, 'gate')
}

function normalizeDryRunPlan(value = {}) {
  return normalizeArtifact(value, 'plan')
}

function normalizeSupervisedExecution(value = {}) {
  return normalizeArtifact(value, 'handoff')
}

function loadOptionalJson(filePath, normalize, label) {
  if (!filePath) {
    return {
      status: 'missing',
      label,
      path: '',
      value: null,
      missingReason: `${label} path faltante`,
    }
  }
  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    return {
      status: 'missing',
      label,
      path: resolved,
      value: null,
      missingReason: `${label} inexistente: ${filePath}`,
    }
  }
  return {
    status: 'present',
    label,
    path: resolved,
    value: normalize(readJsonFile(resolved)),
    missingReason: '',
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

function workerLabelForType(type) {
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

function selectWorker(workerId, capability, registry) {
  if (workerId) {
    return listToolWorkers(registry).find((worker) => worker.id === workerId) || null
  }
  return findToolWorkersForCapability(registry, capability || '')[0] || null
}

function artifactStatusFromLoaded(loaded) {
  return loaded.status === 'present' ? 'present' : 'missing'
}

function loadExternalToolReadinessArtifacts(input = {}, options = {}) {
  const artifacts = {
    plannedHandoff: loadOptionalJson(
      input.plannedHandoffPath,
      normalizePlannedHandoff,
      'planned handoff',
    ),
    approvalGate: loadOptionalJson(
      input.approvalGatePath,
      normalizeApprovalGate,
      'approval gate',
    ),
    dryRunPlan: loadOptionalJson(
      input.dryRunPlanPath,
      normalizeDryRunPlan,
      'dry-run plan',
    ),
    supervisedExecutionDesign: loadOptionalJson(
      input.supervisedExecutionPath,
      normalizeSupervisedExecution,
      'supervised execution design',
    ),
  }

  return {
    ...artifacts,
    artifactStatus: {
      plannedHandoff: artifactStatusFromLoaded(artifacts.plannedHandoff),
      approvalGate: artifactStatusFromLoaded(artifacts.approvalGate),
      dryRunPlan: artifactStatusFromLoaded(artifacts.dryRunPlan),
      supervisedExecutionDesign: artifactStatusFromLoaded(artifacts.supervisedExecutionDesign),
    },
    metadata: {
      generatedAt: nowIso(),
      noExternalToolExecuted: true,
      registryWorkers: listToolWorkers(options.registry || getDefaultToolWorkerRegistry()).length,
    },
  }
}

function valueFromSources(sources, fieldNames) {
  for (const source of sources) {
    for (const fieldName of fieldNames) {
      const value = source?.[fieldName]
      if (value !== undefined && value !== null && value !== '') {
        return value
      }
    }
  }
  return ''
}

function arrayFromSources(sources, fieldNames) {
  const values = []
  for (const source of sources) {
    for (const fieldName of fieldNames) {
      values.push(...ensureArray(source?.[fieldName]))
    }
  }
  return unique(values)
}

function check(id, label, status, evidence, recommendation) {
  return {
    id,
    label,
    status,
    evidence,
    recommendation,
  }
}

function hasUsefulValues(values) {
  return ensureArray(values).some((value) => String(value || '').trim())
}

function collectDangerousText(input, artifacts, reviewSeed) {
  return [
    input.capability,
    input.workerId,
    input.targetProject,
    ...(input.expectedInputs || []),
    ...(input.expectedOutputs || []),
    artifacts.plannedHandoff.value?.taskTitle,
    artifacts.plannedHandoff.value?.capability,
    artifacts.plannedHandoff.value?.targetProject,
    ...(artifacts.plannedHandoff.value?.requiredInputs || []),
    ...(artifacts.plannedHandoff.value?.expectedOutputs || []),
    artifacts.approvalGate.value?.requestedAction,
    artifacts.approvalGate.value?.capability,
    artifacts.approvalGate.value?.targetProject,
    ...(artifacts.approvalGate.value?.allowedPaths || []),
    ...(artifacts.approvalGate.value?.forbiddenPaths || []),
    artifacts.dryRunPlan.value?.requestedAction,
    artifacts.dryRunPlan.value?.capability,
    artifacts.dryRunPlan.value?.targetProject,
    ...(artifacts.dryRunPlan.value?.allowedPaths || []),
    artifacts.supervisedExecutionDesign.value?.requestedAction,
    artifacts.supervisedExecutionDesign.value?.capability,
    artifacts.supervisedExecutionDesign.value?.targetProject,
    ...(artifacts.supervisedExecutionDesign.value?.allowedScopes || []),
    ...(reviewSeed.allowedScopes || []),
    ...(reviewSeed.forbiddenActions || []),
  ]
}

function findForbiddenPathHints(values = []) {
  const findings = []
  for (const rawValue of values) {
    const value = String(rawValue || '').replaceAll('\\', '/')
    const lower = value.toLowerCase()
    if (!lower) {
      continue
    }
    if (lower.includes('web-prueba')) {
      findings.push(`web-prueba: ${value}`)
    }
    if (/(^|[/\s])\.env($|[/\s])/u.test(lower)) {
      findings.push(`.env: ${value}`)
    }
    if (lower.includes('node_modules')) {
      findings.push(`node_modules: ${value}`)
    }
    if (lower.includes('dockerfile') || lower.includes('docker-compose')) {
      findings.push(`Docker: ${value}`)
    }
    if (lower.includes('/.git/') || lower.endsWith('/.git') || lower === '.git') {
      findings.push(`.git: ${value}`)
    }
  }
  return unique(findings)
}

function toolReadinessRequirements(toolKind) {
  if (toolKind === 'blender') {
    return {
      requiredInputs: ['asset brief or source references', 'approved input scope'],
      requiredOutputs: ['preview/export evidence or checklist', 'approved output scope'],
      requiredEvidence: ['visual evidence or preview checklist', 'manual operator notes'],
      requiredValidation: ['manual material/name validation', 'repo status/diff review'],
      nextAction: 'Solicitar aprobacion humana para ejecucion manual supervisada de Blender.',
    }
  }
  if (toolKind === 'unity') {
    return {
      requiredInputs: ['approved Unity project/sandbox', 'assets de entrada'],
      requiredOutputs: ['Unity import/prefab report', 'scene or test validation notes'],
      requiredEvidence: ['manual Unity integration report', 'scene/prefab checklist'],
      requiredValidation: ['post-import validation checklist', 'repo status/diff review'],
      nextAction: 'Solicitar aprobacion humana para ejecucion manual supervisada de Unity.',
    }
  }
  if (toolKind === 'mcp') {
    return {
      requiredInputs: ['MCP capability', 'future permission scopes'],
      requiredOutputs: ['tool routing report', 'redacted payload/output plan'],
      requiredEvidence: ['permission checklist without secrets', 'routing report'],
      requiredValidation: ['confirm no credentials or external calls were used'],
      nextAction: 'Solicitar aprobacion humana para revisar scopes antes de cualquier invocacion MCP futura.',
    }
  }
  return {
    requiredInputs: ['external tool brief'],
    requiredOutputs: ['manual readiness report'],
    requiredEvidence: ['operator checklist'],
    requiredValidation: ['repo status/diff review'],
    nextAction: 'Completar herramienta, capability, scope y aprobacion humana.',
  }
}

function statusSeverity(status) {
  return {
    pass: 0,
    warn: 1,
    fail: 2,
  }[status] ?? 0
}

function buildExternalToolReadinessReview(input = {}, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const artifacts = loadExternalToolReadinessArtifacts(input, { registry })
  const sources = [
    artifacts.supervisedExecutionDesign.value,
    artifacts.dryRunPlan.value,
    artifacts.approvalGate.value,
    artifacts.plannedHandoff.value,
    input,
  ]

  const capability = input.capability || valueFromSources(sources, ['capability'])
  const workerId = input.workerId || valueFromSources(sources, ['workerId'])
  const worker = selectWorker(workerId, capability, registry)
  const toolKind = workerTypeForCapability(capability)
  const requirements = toolReadinessRequirements(toolKind)
  const targetProject = input.targetProject || valueFromSources(sources, ['targetProject'])
  const expectedInputs = unique([
    ...(input.expectedInputs || []),
    ...arrayFromSources(sources, ['expectedInputs', 'requiredInputs', 'inputArtifacts']),
  ])
  const expectedOutputs = unique([
    ...(input.expectedOutputs || []),
    ...arrayFromSources(sources, ['expectedOutputs', 'outputArtifacts']),
  ])
  const allowedScopes = arrayFromSources(sources, ['allowedScopes', 'allowedScope', 'allowedPaths'])
  const forbiddenActions = arrayFromSources(sources, ['forbiddenActions'])
  const forbiddenPaths = arrayFromSources(sources, ['forbiddenPaths'])
  const evidenceChecklist = unique([
    ...arrayFromSources(sources, ['evidenceChecklist', 'expectedEvidence', 'evidenceContract']),
    ...requirements.requiredEvidence,
  ])
  const validationChecklist = unique([
    ...arrayFromSources(sources, ['validationChecklist', 'validationPlan']),
    ...requirements.requiredValidation,
  ])
  const blockedReasons = unique([
    ...arrayFromSources(sources, ['blockedReasons']),
  ])
  const requiredHumanApprovals = unique([
    ...arrayFromSources(sources, ['requiredHumanApprovals', 'requiredApprovals']),
    'Aprobacion humana explicita antes de cualquier ejecucion real.',
  ])
  const reviewSeed = {
    allowedScopes,
    forbiddenActions,
  }

  const checks = []
  const artifactValues = Object.values(artifacts.artifactStatus)
  const missingArtifactReasons = [
    artifacts.plannedHandoff,
    artifacts.approvalGate,
    artifacts.dryRunPlan,
    artifacts.supervisedExecutionDesign,
  ]
    .filter((artifact) => artifact.status === 'missing')
    .map((artifact) => artifact.missingReason)

  checks.push(check(
    'artifacts-present',
    'Artefactos presentes',
    artifactValues.every((status) => status === 'present') ? 'pass' : 'fail',
    JSON.stringify(artifacts.artifactStatus),
    missingArtifactReasons.length
      ? `Completar artefactos faltantes: ${missingArtifactReasons.join('; ')}`
      : 'Todos los artefactos requeridos estan presentes.',
  ))

  const workerIds = unique([
    input.workerId,
    artifacts.plannedHandoff.value?.workerId,
    artifacts.approvalGate.value?.workerId,
    artifacts.dryRunPlan.value?.workerId,
    artifacts.supervisedExecutionDesign.value?.workerId,
  ])
  const capabilities = unique([
    input.capability,
    artifacts.plannedHandoff.value?.capability,
    artifacts.approvalGate.value?.capability,
    artifacts.dryRunPlan.value?.capability,
    artifacts.supervisedExecutionDesign.value?.capability,
  ])
  const workerCoherent = workerIds.length <= 1 && capabilities.length <= 1 && !!worker
  checks.push(check(
    'worker-capability-coherence',
    'Coherencia worker/capability',
    workerCoherent ? 'pass' : 'fail',
    `workers=${workerIds.join(', ') || '(none)'} capabilities=${capabilities.join(', ') || '(none)'}`,
    workerCoherent
      ? 'Worker y capability consistentes.'
      : 'Alinear worker/capability entre handoff, gate, dry-run y supervised design.',
  ))

  const dangerous = findDangerousInstructions(collectDangerousText(input, artifacts, reviewSeed))
  const forbiddenPathFindings = findForbiddenPathHints([
    targetProject,
    ...expectedInputs,
    ...expectedOutputs,
    ...allowedScopes,
  ])
  const safetyFindings = unique([
    ...dangerous.map((finding) => `accion peligrosa: ${finding.label}`),
    ...forbiddenPathFindings.map((finding) => `ruta prohibida: ${finding}`),
    ...blockedReasons,
  ])
  checks.push(check(
    'safety',
    'Seguridad global',
    safetyFindings.length ? 'fail' : 'pass',
    safetyFindings.length ? safetyFindings.join('; ') : 'Sin riesgos bloqueantes detectados.',
    safetyFindings.length
      ? 'Bloquear hasta retirar riesgos prohibidos o rutas inseguras.'
      : 'Mantener ejecucion real deshabilitada y continuar con aprobacion humana.',
  ))

  checks.push(check(
    'inputs-defined',
    'Inputs definidos',
    hasUsefulValues(expectedInputs) ? 'pass' : 'fail',
    expectedInputs.join('; ') || '(sin inputs)',
    hasUsefulValues(expectedInputs)
      ? 'Inputs suficientes para pedir aprobacion humana.'
      : `Definir inputs requeridos: ${requirements.requiredInputs.join('; ')}`,
  ))

  checks.push(check(
    'outputs-defined',
    'Outputs esperados definidos',
    hasUsefulValues(expectedOutputs) ? 'pass' : 'fail',
    expectedOutputs.join('; ') || '(sin outputs)',
    hasUsefulValues(expectedOutputs)
      ? 'Outputs esperados claros.'
      : `Definir outputs esperados: ${requirements.requiredOutputs.join('; ')}`,
  ))

  checks.push(check(
    'evidence-defined',
    'Evidencia esperada definida',
    hasUsefulValues(evidenceChecklist) ? 'pass' : 'fail',
    evidenceChecklist.join('; ') || '(sin evidencia)',
    hasUsefulValues(evidenceChecklist)
      ? 'Evidencia esperada clara.'
      : `Definir evidencia esperada: ${requirements.requiredEvidence.join('; ')}`,
  ))

  checks.push(check(
    'post-validation-defined',
    'Validacion posterior definida',
    hasUsefulValues(validationChecklist) ? 'pass' : 'fail',
    validationChecklist.join('; ') || '(sin validacion)',
    hasUsefulValues(validationChecklist)
      ? 'Validacion posterior definida.'
      : `Definir validaciones: ${requirements.requiredValidation.join('; ')}`,
  ))

  const hasHumanApproval =
    input.humanApproval === true ||
    artifacts.approvalGate.value?.metadata?.humanApproval === true ||
    artifacts.supervisedExecutionDesign.value?.metadata?.humanApproval === true
  checks.push(check(
    'human-approval',
    'Aprobacion humana',
    hasHumanApproval ? 'pass' : 'warn',
    hasHumanApproval ? 'humanApproval=true' : 'humanApproval faltante para ejecucion real',
    hasHumanApproval
      ? 'Puede revisarse para aprobacion humana de ejecucion futura.'
      : 'Pedir aprobacion humana explicita antes de cualquier ejecucion real.',
  ))

  const highestSeverity = Math.max(...checks.map((item) => statusSeverity(item.status)))
  const review = {
    readinessStatus: 'needs_more_planning',
    workerId: worker?.id || workerId || '',
    workerDisplayName: worker?.displayName || valueFromSources(sources, ['workerDisplayName']) || '',
    capability,
    toolKind,
    artifactStatus: artifacts.artifactStatus,
    checks,
    missingInputs: hasUsefulValues(expectedInputs) ? [] : requirements.requiredInputs,
    missingOutputs: hasUsefulValues(expectedOutputs) ? [] : requirements.requiredOutputs,
    blockedReasons: safetyFindings,
    riskLevel: valueFromSources(sources, ['riskLevel']) || worker?.riskLevel || (toolKind === 'mcp' ? 'critical' : 'high'),
    requiredHumanApprovals,
    allowedScopes,
    forbiddenActions,
    forbiddenPaths,
    evidenceChecklist,
    validationChecklist,
    nextAction: requirements.nextAction,
    summary: '',
    metadata: {
      generatedAt: nowIso(),
      targetProject,
      humanApproval: hasHumanApproval,
      noExternalToolExecuted: true,
      artifactPaths: {
        plannedHandoffPath: artifacts.plannedHandoff.path,
        approvalGatePath: artifacts.approvalGate.path,
        dryRunPlanPath: artifacts.dryRunPlan.path,
        supervisedExecutionPath: artifacts.supervisedExecutionDesign.path,
      },
      validation: {
        approvalGate: artifacts.approvalGate.value
          ? validateExternalToolApprovalGate(artifacts.approvalGate.value, { allowApprovedState: true })
          : null,
        dryRunPlan: artifacts.dryRunPlan.value
          ? validateExternalToolDryRunPlan(artifacts.dryRunPlan.value, { allowBlockedReady: true })
          : null,
        supervisedExecutionDesign: artifacts.supervisedExecutionDesign.value
          ? validateExternalToolSupervisedExecutionHandoff(artifacts.supervisedExecutionDesign.value, { allowDesignReadyWithoutApproval: true })
          : null,
      },
      highestSeverity,
      registryWorkers: listToolWorkers(registry).length,
      toolLabel: workerLabelForType(toolKind),
    },
  }
  review.readinessStatus = deriveExternalToolReadinessStatus(review)
  review.summary = summarizeExternalToolReadinessReview(review)
  return review
}

function deriveExternalToolReadinessStatus(review = {}) {
  if (Object.values(review.artifactStatus || {}).some((status) => status === 'missing')) {
    return 'missing_artifacts'
  }
  if (review.blockedReasons?.length || review.checks?.some((item) => item.id === 'safety' && item.status === 'fail')) {
    return 'blocked'
  }
  if (review.checks?.some((item) => item.status === 'fail')) {
    return 'needs_more_planning'
  }
  if (review.metadata?.humanApproval !== true) {
    return 'requires_human_approval'
  }
  if (review.checks?.some((item) => item.status === 'warn')) {
    return 'requires_human_approval'
  }
  return 'ready_for_human_execution_approval'
}

function validateExternalToolReadinessReview(review = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'ready_for_human_execution_approval',
    'needs_more_planning',
    'requires_human_approval',
    'blocked',
    'missing_artifacts',
  ])
  if (!validStatuses.has(review.readinessStatus)) {
    issues.push(`readinessStatus invalido: ${review.readinessStatus || '(vacio)'}`)
  }
  if (!review.capability && review.readinessStatus !== 'missing_artifacts') {
    issues.push('capability faltante')
  }
  if (!review.workerId && review.readinessStatus !== 'missing_artifacts') {
    issues.push('workerId faltante')
  }
  if (!review.metadata?.noExternalToolExecuted) {
    issues.push('metadata debe declarar noExternalToolExecuted')
  }
  if (!Array.isArray(review.checks) || !review.checks.length) {
    issues.push('checks faltantes')
  }
  if (
    review.readinessStatus === 'ready_for_human_execution_approval' &&
    review.metadata?.humanApproval !== true &&
    options.allowReadyWithoutApproval !== true
  ) {
    issues.push('ready_for_human_execution_approval requiere humanApproval')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeExternalToolReadinessReview(review = {}) {
  return [
    `External tool readiness review ${review.readinessStatus || 'unknown'} para ${review.workerId || 'sin worker'} (${review.capability || 'sin capability'}).`,
    `Tool kind: ${review.toolKind || 'unknown'}.`,
    'No se ejecuto ninguna herramienta externa.',
    review.blockedReasons?.length ? `Bloqueos: ${review.blockedReasons.join('; ')}.` : '',
    review.nextAction ? `Proximo paso: ${review.nextAction}` : '',
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

function buildGoNoGoChecklist(review = {}) {
  return [
    '# Go/No-Go Checklist',
    '',
    summarizeExternalToolReadinessReview(review),
    '',
    `Readiness status: ${review.readinessStatus}`,
    '',
    'Checks:',
    ...(review.checks || []).map((item) => `- ${item.status.toUpperCase()} ${item.label}: ${item.recommendation}`),
    '',
    'Next action:',
    `- ${review.nextAction || 'Definir siguiente paso.'}`,
    '',
    'No external tool was executed.',
    '',
  ].join('\n')
}

function buildMissingArtifactsReport(review = {}) {
  const missing = Object.entries(review.artifactStatus || {})
    .filter(([, status]) => status === 'missing')
    .map(([name]) => name)
  return [
    '# Missing Artifacts',
    '',
    ...(missing.length ? missing.map((name) => `- ${name}`) : ['- None']),
    '',
    'Missing inputs:',
    ...(review.missingInputs?.length ? review.missingInputs.map((item) => `- ${item}`) : ['- None']),
    '',
    'Missing outputs:',
    ...(review.missingOutputs?.length ? review.missingOutputs.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n')
}

function writeExternalToolReadinessReview(outputDir, review) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolReadinessReview(review, { allowReadyWithoutApproval: true })
  if (!validation.valid) {
    throw new Error(`Readiness review invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const reviewPath = path.join(resolvedOutputDir, 'external-tool-readiness-review.json')
  const summaryPath = path.join(resolvedOutputDir, 'external-tool-readiness-summary.md')
  const checklistPath = path.join(resolvedOutputDir, 'go-no-go-checklist.md')
  const missingPath = path.join(resolvedOutputDir, 'missing-artifacts.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...review,
    artifacts: [reviewPath, summaryPath, checklistPath, missingPath, readmePath],
  }
  fs.writeFileSync(reviewPath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# External Tool Readiness Review',
      '',
      summarizeExternalToolReadinessReview(review),
      '',
      `Status: ${review.readinessStatus}`,
      `Worker: ${review.workerId || '(none)'}`,
      `Capability: ${review.capability || '(none)'}`,
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(checklistPath, buildGoNoGoChecklist(review), 'utf8')
  fs.writeFileSync(missingPath, buildMissingArtifactsReport(review), 'utf8')
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Readiness Review',
      '',
      summarizeExternalToolReadinessReview(review),
      '',
      'Artifacts:',
      '- external-tool-readiness-review.json',
      '- external-tool-readiness-summary.md',
      '- go-no-go-checklist.md',
      '- missing-artifacts.md',
      '',
      'Evidence checklist:',
      ...(review.evidenceChecklist?.length ? review.evidenceChecklist.map((item) => `- ${item}`) : ['- None']),
      '',
      'Validation checklist:',
      ...(review.validationChecklist?.length ? review.validationChecklist.map((item) => `- ${item}`) : ['- None']),
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    reviewPath,
    summaryPath,
    checklistPath,
    missingPath,
    readmePath,
    review: serializable,
  }
}

module.exports = {
  loadExternalToolReadinessArtifacts,
  buildExternalToolReadinessReview,
  validateExternalToolReadinessReview,
  writeExternalToolReadinessReview,
  summarizeExternalToolReadinessReview,
  deriveExternalToolReadinessStatus,
}
