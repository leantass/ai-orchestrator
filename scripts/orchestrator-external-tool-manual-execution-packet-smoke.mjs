import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-manual-execution-packet-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-manual-execution-packet.mjs')

const {
  buildExternalToolManualExecutionPacket,
  writeExternalToolManualExecutionPacket,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-manual-execution-packet.cjs'))

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

function runCase(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error.stack || error.message)
    process.exit(1)
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function baseReview(overrides = {}) {
  const toolKind = overrides.toolKind || 'blender'
  const capability = overrides.capability || 'asset.blender.create'
  const workerId = overrides.workerId || 'blender-manual-asset-worker'
  return {
    readinessStatus: overrides.readinessStatus || 'needs_more_planning',
    workerId,
    workerDisplayName: overrides.workerDisplayName || 'Manual External Tool Worker',
    capability,
    toolKind,
    artifactStatus: {
      plannedHandoff: 'present',
      approvalGate: 'present',
      dryRunPlan: 'present',
      supervisedExecutionDesign: 'present',
    },
    checks: overrides.checks || [
      {
        id: 'inputs-defined',
        label: 'Inputs definidos',
        status: 'fail',
        evidence: '(sin inputs)',
        recommendation: 'Completar inputs.',
      },
    ],
    missingInputs: overrides.missingInputs || ['asset brief', 'source references'],
    missingOutputs: overrides.missingOutputs || [],
    blockedReasons: overrides.blockedReasons || [],
    riskLevel: overrides.riskLevel || (toolKind === 'mcp' ? 'critical' : 'high'),
    requiredHumanApprovals: overrides.requiredHumanApprovals || [
      'Aprobacion humana explicita antes de cualquier ejecucion real.',
    ],
    allowedScopes: overrides.allowedScopes || ['approved sandbox', '.codex-temp'],
    forbiddenActions: overrides.forbiddenActions || ['No ejecutar herramientas reales.'],
    forbiddenPaths: overrides.forbiddenPaths || ['web-prueba', '.env', 'node_modules'],
    evidenceChecklist: overrides.evidenceChecklist || ['manual operator notes'],
    validationChecklist: overrides.validationChecklist || ['repo status/diff review'],
    nextAction: overrides.nextAction || 'Solicitar aprobacion humana.',
    summary: overrides.summary || 'Readiness fixture sin ejecucion real.',
    metadata: {
      generatedAt: '2026-06-17T00:00:00.000Z',
      targetProject: overrides.targetProject || 'manual packet smoke sandbox',
      humanApproval: overrides.humanApproval === true,
      noExternalToolExecuted: true,
      ...(overrides.metadata || {}),
    },
  }
}

function writeReview(name, review) {
  const reviewPath = path.join(smokeRoot, name, 'external-tool-readiness-review.json')
  writeJson(reviewPath, review)
  return reviewPath
}

function packetFor(reviewPath, overrides = {}) {
  return buildExternalToolManualExecutionPacket({
    readinessReviewPath: reviewPath,
    ...overrides,
  })
}

function assertNoExecution(packet) {
  assert(packet.metadata.noExternalToolExecuted === true, 'packet no declara noExternalToolExecuted')
  assert(packet.metadata.executionAuthorized === false, 'packet autorizo ejecucion')
  assert(!JSON.stringify(packet).includes('"executionAllowed":true'), 'packet contiene executionAllowed true')
}

resetDir(smokeRoot)

runCase('Blender readiness needs_more_planning', () => {
  const reviewPath = writeReview('blender-needs-inputs', baseReview())
  const packet = packetFor(reviewPath)
  assert(packet.packetStatus === 'needs_missing_inputs', `status inesperado: ${packet.packetStatus}`)
  assert(packet.missingInputs.some((item) => /asset brief|source references/iu.test(item)), 'no reporto inputs Blender')
  assert(packet.approvalRequest.includes('Blender'), 'approval request no menciona Blender')
  assertNoExecution(packet)
})

runCase('Unity readiness needs_more_planning', () => {
  const reviewPath = writeReview('unity-needs-inputs', baseReview({
    toolKind: 'unity',
    capability: 'unity.import.assets',
    workerId: 'unity-manual-integration-worker',
    missingInputs: ['approved Unity project/sandbox', 'assets de entrada'],
  }))
  const packet = packetFor(reviewPath)
  assert(packet.packetStatus === 'needs_missing_inputs', `status inesperado: ${packet.packetStatus}`)
  assert(packet.missingInputs.some((item) => /Unity project|assets de entrada/iu.test(item)), 'no reporto inputs Unity')
  assert(packet.approvalRequest.includes('Unity'), 'approval request no menciona Unity')
  assertNoExecution(packet)
})

runCase('MCP readiness needs_more_planning', () => {
  const reviewPath = writeReview('mcp-needs-inputs', baseReview({
    toolKind: 'mcp',
    capability: 'mcp.invoke',
    workerId: 'mcp-future-worker',
    missingInputs: ['MCP capability', 'future permission scopes'],
  }))
  const packet = packetFor(reviewPath)
  assert(packet.packetStatus === 'needs_missing_inputs', `status inesperado: ${packet.packetStatus}`)
  assert(packet.missingInputs.some((item) => /MCP capability|future permission scopes/iu.test(item)), 'no reporto inputs MCP')
  assert(packet.approvalRequest.includes('MCP'), 'approval request no menciona MCP')
  assertNoExecution(packet)
})

runCase('Readiness blocked', () => {
  const reviewPath = writeReview('blocked', baseReview({
    readinessStatus: 'blocked',
    blockedReasons: ['scope prohibido detectado'],
  }))
  const packet = packetFor(reviewPath)
  assert(packet.packetStatus === 'blocked', `status inesperado: ${packet.packetStatus}`)
  assert(packet.abortConditions.some((item) => /scope prohibido/iu.test(item)), 'no heredo bloqueo')
  assertNoExecution(packet)
})

runCase('Readiness lista para aprobacion humana', () => {
  const reviewPath = writeReview('ready-for-approval', baseReview({
    readinessStatus: 'ready_for_human_execution_approval',
    missingInputs: [],
    missingOutputs: [],
    checks: [
      { id: 'inputs-defined', label: 'Inputs definidos', status: 'pass', evidence: 'ok', recommendation: 'ok' },
      { id: 'human-approval', label: 'Aprobacion humana', status: 'pass', evidence: 'ok', recommendation: 'ok' },
    ],
    humanApproval: true,
  }))
  const packet = packetFor(reviewPath)
  assert(packet.packetStatus === 'ready_for_human_review', `status inesperado: ${packet.packetStatus}`)
  assert(packet.goNoGoSummary.includes('GO para revision humana'), 'no genero GO humano')
  assertNoExecution(packet)
})

runCase('Missing readiness review', () => {
  const packet = packetFor(path.join(smokeRoot, 'missing-review.json'))
  assert(packet.packetStatus === 'missing_artifacts', `status inesperado: ${packet.packetStatus}`)
  assert(packet.metadata.readinessReviewStatus === 'missing', 'no marco review missing')
  assertNoExecution(packet)
})

runCase('Output inseguro falla', () => {
  const reviewPath = writeReview('unsafe-output', baseReview())
  const result = runCli([
    '--readiness-review',
    reviewPath,
    '--output',
    'scripts/external-tool-manual-execution-packet-unsafe',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const reviewPath = writeReview('json-mode', baseReview({
    toolKind: 'unity',
    capability: 'unity.import.assets',
    workerId: 'unity-manual-integration-worker',
    missingInputs: ['approved Unity project/sandbox'],
  }))
  const result = runCli([
    '--readiness-review',
    reviewPath,
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-manual-execution-packet-smoke', 'json-output'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.packetStatus === 'needs_missing_inputs', `JSON status inesperado: ${parsed.packetStatus}`)
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
})

runCase('Escritura de artefactos', () => {
  const reviewPath = writeReview('write-artifacts', baseReview())
  const packet = packetFor(reviewPath)
  const written = writeExternalToolManualExecutionPacket(path.join(smokeRoot, 'packet-artifacts'), packet)
  assert(fs.existsSync(written.packetPath), 'no escribio packet JSON')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.approvalPath), 'no escribio approval request')
  assert(fs.existsSync(written.checklistPath), 'no escribio operator checklist')
  assert(fs.existsSync(written.missingInputsPath), 'no escribio missing inputs')
  assert(fs.existsSync(written.goNoGoPath), 'no escribio go/no-go')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

console.log('OK. External Tool Manual Execution Packet smoke completo.')
