const fs = require('node:fs')
const path = require('node:path')

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

const {
  validateExternalToolReadinessReview,
} = require('./orchestrator-external-tool-readiness-review.cjs')

const {
  validateExternalToolManualExecutionPacket,
} = require('./orchestrator-external-tool-manual-execution-packet.cjs')

const {
  validateExternalToolHumanApprovalRecord,
  isExternalToolHumanApprovalUsable,
} = require('./orchestrator-external-tool-human-approval-record.cjs')

const {
  getDefaultToolWorkerRegistry,
  listToolWorkers,
  findToolWorkersForCapability,
} = require('./orchestrator-tool-worker-registry.cjs')

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

function loadOptionalJson(filePath, wrapperKey, label) {
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
    value: normalizeArtifact(readJsonFile(resolved), wrapperKey),
    missingReason: '',
  }
}

function artifactStatusFromLoaded(loaded) {
  return loaded.status === 'present' ? 'present' : 'missing'
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

function pathSafetyFindings(values = []) {
  const findings = []
  for (const rawValue of values) {
    const value = String(rawValue || '').replaceAll('\\', '/')
    const lower = value.toLowerCase()
    if (!lower) {
      continue
    }
    if (lower.includes('web-prueba')) {
      findings.push(`ruta prohibida web-prueba: ${value}`)
    }
    if (/(^|[/\s])\.env($|[/\s])/u.test(lower)) {
      findings.push(`ruta prohibida .env: ${value}`)
    }
    if (lower.includes('node_modules')) {
      findings.push(`ruta prohibida node_modules: ${value}`)
    }
    if (lower.includes('dockerfile') || lower.includes('docker-compose')) {
      findings.push(`ruta prohibida Docker: ${value}`)
    }
    if (lower.includes('/.git/') || lower.endsWith('/.git') || lower === '.git') {
      findings.push(`ruta prohibida .git: ${value}`)
    }
  }
  return unique(findings)
}

function toolPermitRequirements(toolKind) {
  if (toolKind === 'blender') {
    return {
      requiredInputs: ['asset brief', 'source references', 'input scope aprobado', 'output scope aprobado'],
      evidence: ['evidencia visual esperada', 'preview/export checklist'],
      validation: ['validaciones posteriores', 'repo status/diff review'],
    }
  }
  if (toolKind === 'unity') {
    return {
      requiredInputs: ['proyecto Unity aprobado', 'rama/sandbox aprobado', 'assets de entrada', 'escena/prefab objetivo'],
      evidence: ['logs/screenshots futuros', 'prefab/scene report futuro'],
      validation: ['validaciones posteriores', 'no builds generated'],
    }
  }
  if (toolKind === 'mcp') {
    return {
      requiredInputs: ['capability MCP exacta', 'scopes futuros', 'payload redactado'],
      evidence: ['routing report', 'permission checklist without secrets'],
      validation: ['sin credenciales reales', 'sin invocacion real'],
    }
  }
  return {
    requiredInputs: ['external tool scope'],
    evidence: ['manual evidence'],
    validation: ['repo status/diff review'],
  }
}

function loadExternalToolPermitArtifacts(input = {}, options = {}) {
  const artifacts = {
    plannedHandoff: loadOptionalJson(input.plannedHandoffPath, 'handoff', 'planned handoff'),
    approvalGate: loadOptionalJson(input.approvalGatePath, 'gate', 'approval gate'),
    dryRunPlan: loadOptionalJson(input.dryRunPlanPath, 'plan', 'dry-run plan'),
    supervisedExecutionDesign: loadOptionalJson(input.supervisedExecutionPath, 'handoff', 'supervised execution design'),
    readinessReview: loadOptionalJson(input.readinessReviewPath, 'review', 'readiness review'),
    manualExecutionPacket: loadOptionalJson(input.manualExecutionPacketPath, 'packet', 'manual execution packet'),
    humanApprovalRecord: loadOptionalJson(input.humanApprovalRecordPath, 'record', 'human approval record'),
  }
  return {
    ...artifacts,
    artifactStatus: {
      plannedHandoff: artifactStatusFromLoaded(artifacts.plannedHandoff),
      approvalGate: artifactStatusFromLoaded(artifacts.approvalGate),
      dryRunPlan: artifactStatusFromLoaded(artifacts.dryRunPlan),
      supervisedExecutionDesign: artifactStatusFromLoaded(artifacts.supervisedExecutionDesign),
      readinessReview: artifactStatusFromLoaded(artifacts.readinessReview),
      manualExecutionPacket: artifactStatusFromLoaded(artifacts.manualExecutionPacket),
      humanApprovalRecord: artifactStatusFromLoaded(artifacts.humanApprovalRecord),
    },
    metadata: {
      generatedAt: nowIso(),
      noExternalToolExecuted: true,
      registryWorkers: listToolWorkers(options.registry || getDefaultToolWorkerRegistry()).length,
    },
  }
}

function collectIdentitySources(input, artifacts) {
  return [
    artifacts.humanApprovalRecord.value,
    artifacts.manualExecutionPacket.value,
    artifacts.readinessReview.value,
    artifacts.supervisedExecutionDesign.value,
    artifacts.dryRunPlan.value,
    artifacts.approvalGate.value,
    artifacts.plannedHandoff.value,
    input,
  ]
}

function buildIdentityCheck(input, artifacts, registry, capability, workerId) {
  const sources = collectIdentitySources(input, artifacts)
  const workerIds = unique([
    input.workerId,
    ...sources.map((source) => source?.workerId),
  ])
  const capabilities = unique([
    input.capability,
    ...sources.map((source) => source?.capability),
  ])
  const toolKinds = unique(sources.map((source) => source?.toolKind))
  const worker = workerId ? listToolWorkers(registry).find((item) => item.id === workerId) : findToolWorkersForCapability(registry, capability || '')[0]
  const coherent = workerIds.length <= 1 && capabilities.length <= 1 && toolKinds.length <= 1 && !!(worker || workerId || capability)
  return check(
    'identity-consistency',
    'Coherencia worker/capability/toolKind',
    coherent ? 'pass' : 'fail',
    `workers=${workerIds.join(', ') || '(none)'} capabilities=${capabilities.join(', ') || '(none)'} toolKinds=${toolKinds.join(', ') || '(none)'}`,
    coherent ? 'Identidad consistente.' : 'Alinear workerId, capability y toolKind entre artefactos.',
  )
}

function buildScopeCheck(packet, record) {
  const packetScopes = ensureArray(packet?.allowedScopes)
  const approvedScopes = ensureArray(record?.approvedScopes)
  const missingScopeEvidence = approvedScopes.filter((scope) => {
    const normalized = String(scope || '').toLowerCase()
    return !packetScopes.some((candidate) => normalized.includes(String(candidate || '').toLowerCase()) || String(candidate || '').toLowerCase().includes(normalized))
  })
  return check(
    'scope-consistency',
    'Coherencia de scopes aprobados',
    !approvedScopes.length || missingScopeEvidence.length ? 'warn' : 'pass',
    approvedScopes.join('; ') || '(sin scopes aprobados)',
    missingScopeEvidence.length
      ? `Revisar scopes no evidentes en manual packet: ${missingScopeEvidence.join('; ')}`
      : 'Scopes aprobados presentes.',
  )
}

function buildExternalToolExecutionPermitBundle(input = {}, options = {}) {
  const registry = options.registry || getDefaultToolWorkerRegistry()
  const artifacts = loadExternalToolPermitArtifacts(input, { registry })
  const sources = collectIdentitySources(input, artifacts)
  const capability = input.capability || valueFromSources(sources, ['capability'])
  const workerId = input.workerId || valueFromSources(sources, ['workerId'])
  const toolKind = toolKindForCapability(capability, valueFromSources(sources, ['toolKind']))
  const targetProject = input.targetProject || valueFromSources(sources, ['targetProject'])
  const requirements = toolPermitRequirements(toolKind)
  const readiness = artifacts.readinessReview.value
  const packet = artifacts.manualExecutionPacket.value
  const record = artifacts.humanApprovalRecord.value
  const dryRunPlan = artifacts.dryRunPlan.value
  const supervised = artifacts.supervisedExecutionDesign.value
  const gate = artifacts.approvalGate.value
  const planned = artifacts.plannedHandoff.value
  const missingInputs = unique([
    ...ensureArray(readiness?.missingInputs),
    ...ensureArray(packet?.missingInputs),
  ])
  const missingOutputs = unique([
    ...ensureArray(readiness?.missingOutputs),
    ...ensureArray(packet?.missingOutputs),
  ])
  const approvedScopes = unique(ensureArray(record?.approvedScopes))
  const forbiddenActions = unique(arrayFromSources([
    record,
    packet,
    readiness,
    supervised,
    dryRunPlan,
    gate,
    planned,
  ], ['forbiddenActions']))
  const requiredHumanApprovals = unique([
    ...arrayFromSources([readiness, packet, planned, gate], ['requiredHumanApprovals', 'requiredApprovals']),
    'Aprobacion humana usable antes de cualquier ejecucion manual futura.',
  ])
  const evidenceContract = unique([
    ...arrayFromSources([record, packet, readiness, supervised, dryRunPlan, gate], ['evidenceRequired', 'expectedEvidence', 'evidenceChecklist', 'evidenceContract']),
    ...requirements.evidence,
  ])
  const validationPlan = unique([
    ...arrayFromSources([record, packet, readiness, supervised, dryRunPlan, gate], ['validationRequired', 'validationPlan', 'validationChecklist']),
    ...requirements.validation,
  ])
  const executionPreconditions = unique([
    ...ensureArray(packet?.executionPreconditions),
    ...ensureArray(record?.approvalConditions),
    ...requirements.requiredInputs,
  ])
  const manualOperatorChecklist = unique([
    ...ensureArray(packet?.operatorChecklist),
    'Confirmar que executionAllowed=false y automaticExecutionAllowed=false.',
    'Confirmar aprobacion humana usable antes de cualquier ejecucion futura.',
  ])
  const abortConditions = unique([
    ...ensureArray(packet?.abortConditions),
    'Falta cualquier artefacto critico.',
    'Falta aprobacion humana usable.',
    'Aparece riesgo duro o ruta prohibida.',
    'Se intenta ejecutar herramienta externa automaticamente.',
  ])
  const validationResults = {
    approvalGate: gate ? validateExternalToolApprovalGate(gate, { allowApprovedState: true }) : null,
    dryRunPlan: dryRunPlan ? validateExternalToolDryRunPlan(dryRunPlan, { allowBlockedReady: true }) : null,
    supervisedExecutionDesign: supervised ? validateExternalToolSupervisedExecutionHandoff(supervised, { allowDesignReadyWithoutApproval: true }) : null,
    readinessReview: readiness ? validateExternalToolReadinessReview(readiness, { allowReadyWithoutApproval: true }) : null,
    manualExecutionPacket: packet ? validateExternalToolManualExecutionPacket(packet, { allowMissingIdentity: packet.packetStatus === 'missing_artifacts' }) : null,
    humanApprovalRecord: record ? validateExternalToolHumanApprovalRecord(record, { allowMissingIdentity: ['invalid', 'draft'].includes(record.approvalStatus) }) : null,
  }
  const consistencyChecks = [
    check(
      'artifacts-present',
      'Artefactos presentes',
      Object.values(artifacts.artifactStatus).every((status) => status === 'present') ? 'pass' : 'fail',
      JSON.stringify(artifacts.artifactStatus),
      'Todos los artefactos criticos deben estar presentes.',
    ),
    buildIdentityCheck(input, artifacts, registry, capability, workerId),
    buildScopeCheck(packet, record),
    check(
      'human-approval-usable',
      'Aprobacion humana usable',
      record && isExternalToolHumanApprovalUsable(record) ? 'pass' : 'fail',
      record ? `status=${record.approvalStatus} usable=${record.approvalUsable ? 'true' : 'false'}` : '(sin human approval record)',
      'Registrar aprobacion humana usable sin autorizar ejecucion automatica.',
    ),
    check(
      'evidence-defined',
      'Evidencia definida',
      evidenceContract.length ? 'pass' : 'fail',
      evidenceContract.join('; ') || '(sin evidencia)',
      'Definir evidencia esperada antes de cualquier ejecucion futura.',
    ),
    check(
      'validation-defined',
      'Validaciones posteriores definidas',
      validationPlan.length ? 'pass' : 'fail',
      validationPlan.join('; ') || '(sin validaciones)',
      'Definir validaciones posteriores antes de cualquier ejecucion futura.',
    ),
  ]
  const invalidReasons = unique(Object.entries(validationResults)
    .flatMap(([name, result]) => result && result.valid === false ? result.issues.map((issue) => `${name}: ${issue}`) : []))
  const dangerousText = [
    targetProject,
    capability,
    workerId,
    ...approvedScopes,
    ...missingInputs,
    ...missingOutputs,
    ...executionPreconditions,
    ...evidenceContract,
    ...validationPlan,
  ]
  const dangerousReasons = findDangerousInstructions(dangerousText).map((finding) => `accion peligrosa: ${finding.label}`)
  const pathReasons = pathSafetyFindings([
    targetProject,
    ...approvedScopes,
    ...arrayFromSources([gate, dryRunPlan, readiness, packet], ['allowedScopes', 'allowedPaths']),
  ])
  const blockedReasons = unique([
    ...ensureArray(readiness?.blockedReasons),
    ...ensureArray(packet?.blockedReasons),
    ...ensureArray(record?.invalidationReasons).filter((reason) => /credenciales|\.env|web-prueba|docker|deploy|node_modules|package|build|mcp real/iu.test(reason)),
    readiness?.readinessStatus === 'blocked' ? 'readiness review bloqueado' : '',
    packet?.packetStatus === 'blocked' ? 'manual execution packet bloqueado' : '',
    dryRunPlan?.planStatus === 'blocked' ? 'dry-run plan bloqueado' : '',
    supervised?.executionStatus === 'blocked' ? 'supervised execution design bloqueado' : '',
    ...dangerousReasons,
    ...pathReasons,
  ])
  const bundle = {
    permitStatus: 'needs_more_planning',
    executionAllowed: false,
    automaticExecutionAllowed: false,
    manualSupervisedExecutionCandidate: false,
    workerId,
    workerDisplayName: valueFromSources(sources, ['workerDisplayName']),
    capability,
    toolKind,
    artifactStatus: artifacts.artifactStatus,
    consistencyChecks,
    blockedReasons,
    missingInputs,
    missingOutputs,
    requiredHumanApprovals,
    approvedScopes,
    forbiddenActions,
    executionPreconditions,
    manualOperatorChecklist,
    evidenceContract,
    validationPlan,
    abortConditions,
    goNoGoSummary: '',
    nextAction: '',
    metadata: {
      generatedAt: nowIso(),
      targetProject,
      noExternalToolExecuted: true,
      executionAllowed: false,
      automaticExecutionAllowed: false,
      artifactPaths: {
        plannedHandoffPath: artifacts.plannedHandoff.path,
        approvalGatePath: artifacts.approvalGate.path,
        dryRunPlanPath: artifacts.dryRunPlan.path,
        supervisedExecutionPath: artifacts.supervisedExecutionDesign.path,
        readinessReviewPath: artifacts.readinessReview.path,
        manualExecutionPacketPath: artifacts.manualExecutionPacket.path,
        humanApprovalRecordPath: artifacts.humanApprovalRecord.path,
      },
      statuses: {
        readinessStatus: readiness?.readinessStatus || '',
        packetStatus: packet?.packetStatus || '',
        approvalStatus: record?.approvalStatus || '',
        approvalUsable: record?.approvalUsable === true,
        dryRunPlanStatus: dryRunPlan?.planStatus || '',
        supervisedExecutionStatus: supervised?.executionStatus || '',
      },
      validation: validationResults,
      invalidReasons,
      registryWorkers: listToolWorkers(registry).length,
      toolLabel: toolLabel(toolKind),
      originalMetadata: input.metadata || {},
    },
  }
  bundle.permitStatus = deriveExternalToolExecutionPermitStatus(bundle)
  bundle.manualSupervisedExecutionCandidate = bundle.permitStatus === 'ready_for_manual_supervised_execution'
  bundle.goNoGoSummary = buildGoNoGoSummary(bundle)
  bundle.nextAction = buildNextAction(bundle)
  return bundle
}

function deriveExternalToolExecutionPermitStatus(bundle = {}) {
  if (Object.values(bundle.artifactStatus || {}).some((status) => status === 'missing')) {
    return 'missing_artifacts'
  }
  if (bundle.blockedReasons?.length) {
    return 'blocked'
  }
  if (bundle.metadata?.invalidReasons?.length) {
    return 'invalid'
  }
  if (bundle.consistencyChecks?.some((item) => item.id === 'identity-consistency' && item.status === 'fail')) {
    return 'invalid'
  }
  if (bundle.metadata?.statuses?.readinessStatus === 'requires_human_approval') {
    return 'requires_human_approval'
  }
  if (bundle.metadata?.statuses?.approvalStatus === 'approved' && !bundle.approvedScopes?.length) {
    return 'needs_missing_inputs'
  }
  if (bundle.metadata?.statuses?.approvalUsable !== true) {
    return 'requires_human_approval'
  }
  if (bundle.missingInputs?.length || bundle.missingOutputs?.length || !bundle.approvedScopes?.length) {
    return 'needs_missing_inputs'
  }
  if (bundle.consistencyChecks?.some((item) => item.status === 'fail' || item.status === 'warn')) {
    return 'needs_more_planning'
  }
  return 'ready_for_manual_supervised_execution'
}

function buildGoNoGoSummary(bundle = {}) {
  const ready = bundle.permitStatus === 'ready_for_manual_supervised_execution'
  return [
    `Decision: ${ready ? 'GO para preparacion de ejecucion manual supervisada futura' : 'NO-GO para ejecucion real'}.`,
    `Permit status: ${bundle.permitStatus}.`,
    `Tool: ${toolLabel(bundle.toolKind)}.`,
    `Worker: ${bundle.workerId || '(sin worker)'}.`,
    bundle.missingInputs?.length ? `Inputs faltantes: ${bundle.missingInputs.join('; ')}.` : '',
    bundle.missingOutputs?.length ? `Outputs faltantes: ${bundle.missingOutputs.join('; ')}.` : '',
    bundle.blockedReasons?.length ? `Bloqueos: ${bundle.blockedReasons.join('; ')}.` : '',
    'executionAllowed=false y automaticExecutionAllowed=false en v0.1.',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildNextAction(bundle = {}) {
  if (bundle.permitStatus === 'ready_for_manual_supervised_execution') {
    return 'Preparar revision humana final del preflight manual; este bundle no ejecuta herramientas.'
  }
  if (bundle.permitStatus === 'missing_artifacts') {
    return 'Completar artefactos faltantes antes de evaluar permiso.'
  }
  if (bundle.permitStatus === 'blocked') {
    return 'Resolver bloqueos de seguridad antes de continuar.'
  }
  if (bundle.permitStatus === 'requires_human_approval') {
    return 'Registrar aprobacion humana usable antes de continuar.'
  }
  if (bundle.permitStatus === 'needs_missing_inputs') {
    return 'Completar inputs, outputs o scopes aprobados faltantes.'
  }
  if (bundle.permitStatus === 'invalid') {
    return 'Corregir inconsistencias o artefactos invalidos.'
  }
  return 'Completar planificacion y consistencia entre artefactos.'
}

function validateExternalToolExecutionPermitBundle(bundle = {}, options = {}) {
  const issues = []
  const validStatuses = new Set([
    'ready_for_manual_supervised_execution',
    'needs_more_planning',
    'requires_human_approval',
    'needs_missing_inputs',
    'blocked',
    'missing_artifacts',
    'invalid',
  ])
  if (!validStatuses.has(bundle.permitStatus)) {
    issues.push(`permitStatus invalido: ${bundle.permitStatus || '(vacio)'}`)
  }
  if (bundle.executionAllowed !== false) {
    issues.push('executionAllowed debe ser false')
  }
  if (bundle.automaticExecutionAllowed !== false) {
    issues.push('automaticExecutionAllowed debe ser false')
  }
  if (bundle.metadata?.noExternalToolExecuted !== true) {
    issues.push('metadata debe declarar noExternalToolExecuted')
  }
  if (bundle.manualSupervisedExecutionCandidate && bundle.permitStatus !== 'ready_for_manual_supervised_execution') {
    issues.push('manualSupervisedExecutionCandidate solo puede ser true si permitStatus esta ready')
  }
  if (!Array.isArray(bundle.consistencyChecks) || !bundle.consistencyChecks.length) {
    issues.push('consistencyChecks faltantes')
  }
  if (!bundle.goNoGoSummary) {
    issues.push('goNoGoSummary faltante')
  }
  if (!bundle.nextAction) {
    issues.push('nextAction faltante')
  }
  if (bundle.permitStatus !== 'missing_artifacts' && (!bundle.workerId || !bundle.capability) && options.allowMissingIdentity !== true) {
    issues.push('workerId/capability faltantes')
  }
  return {
    valid: issues.length === 0,
    issues,
  }
}

function summarizeExternalToolExecutionPermitBundle(bundle = {}) {
  return [
    `External tool execution permit bundle ${bundle.permitStatus || 'unknown'} para ${bundle.workerId || 'sin worker'} (${bundle.capability || 'sin capability'}).`,
    `Tool: ${toolLabel(bundle.toolKind)}.`,
    `Manual supervised candidate: ${bundle.manualSupervisedExecutionCandidate ? 'true' : 'false'}.`,
    'executionAllowed=false.',
    'automaticExecutionAllowed=false.',
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

function writeExternalToolExecutionPermitBundle(outputDir, bundle) {
  const resolvedOutputDir = validateSafeOutputDir(outputDir)
  const validation = validateExternalToolExecutionPermitBundle(bundle, {
    allowMissingIdentity: bundle.permitStatus === 'missing_artifacts',
  })
  if (!validation.valid) {
    throw new Error(`Execution permit bundle invalido: ${validation.issues.join('; ')}`)
  }
  fs.mkdirSync(resolvedOutputDir, { recursive: true })
  const bundlePath = path.join(resolvedOutputDir, 'external-tool-execution-permit-bundle.json')
  const summaryPath = path.join(resolvedOutputDir, 'external-tool-execution-permit-summary.md')
  const goNoGoPath = path.join(resolvedOutputDir, 'go-no-go-final.md')
  const preconditionsPath = path.join(resolvedOutputDir, 'manual-supervised-execution-preconditions.md')
  const evidencePath = path.join(resolvedOutputDir, 'evidence-and-validation-contract.md')
  const readmePath = path.join(resolvedOutputDir, 'README.md')
  const serializable = {
    ...bundle,
    artifacts: [bundlePath, summaryPath, goNoGoPath, preconditionsPath, evidencePath, readmePath],
  }
  fs.writeFileSync(bundlePath, `${JSON.stringify(serializable, null, 2)}\n`, 'utf8')
  fs.writeFileSync(
    summaryPath,
    [
      '# External Tool Execution Permit Bundle',
      '',
      summarizeExternalToolExecutionPermitBundle(bundle),
      '',
      bundle.goNoGoSummary,
      '',
      'No external tool was executed.',
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    goNoGoPath,
    [
      '# Final Go/No-Go',
      '',
      bundle.goNoGoSummary,
      '',
      'Consistency checks:',
      ...(bundle.consistencyChecks || []).map((item) => `- ${item.status.toUpperCase()} ${item.label}: ${item.recommendation}`),
      '',
      'Next action:',
      `- ${bundle.nextAction}`,
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    preconditionsPath,
    [
      ...markdownList('Manual Supervised Execution Preconditions', bundle.executionPreconditions).split('\n'),
      'Manual operator checklist:',
      ...(bundle.manualOperatorChecklist?.length ? bundle.manualOperatorChecklist.map((item) => `- ${item}`) : ['- None']),
      '',
      'Abort conditions:',
      ...(bundle.abortConditions?.length ? bundle.abortConditions.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    evidencePath,
    [
      ...markdownList('Evidence Contract', bundle.evidenceContract).split('\n'),
      'Validation plan:',
      ...(bundle.validationPlan?.length ? bundle.validationPlan.map((item) => `- ${item}`) : ['- None']),
      '',
      'Forbidden actions:',
      ...(bundle.forbiddenActions?.length ? bundle.forbiddenActions.map((item) => `- ${item}`) : ['- None']),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    readmePath,
    [
      '# External Tool Execution Permit Bundle',
      '',
      summarizeExternalToolExecutionPermitBundle(bundle),
      '',
      'Artifacts:',
      '- external-tool-execution-permit-bundle.json',
      '- external-tool-execution-permit-summary.md',
      '- go-no-go-final.md',
      '- manual-supervised-execution-preconditions.md',
      '- evidence-and-validation-contract.md',
      '- README.md',
      '',
      'Safety:',
      '- executionAllowed is always false in v0.1.',
      '- automaticExecutionAllowed is always false in v0.1.',
      '- This bundle does not execute external tools.',
      '',
    ].join('\n'),
    'utf8',
  )
  return {
    outputDir: resolvedOutputDir,
    bundlePath,
    summaryPath,
    goNoGoPath,
    preconditionsPath,
    evidencePath,
    readmePath,
    bundle: serializable,
  }
}

module.exports = {
  loadExternalToolPermitArtifacts,
  buildExternalToolExecutionPermitBundle,
  validateExternalToolExecutionPermitBundle,
  writeExternalToolExecutionPermitBundle,
  summarizeExternalToolExecutionPermitBundle,
  deriveExternalToolExecutionPermitStatus,
}
