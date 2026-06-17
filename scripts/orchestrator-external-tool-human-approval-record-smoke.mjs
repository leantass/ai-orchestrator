import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-human-approval-record-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-human-approval-record.mjs')

const {
  buildExternalToolHumanApprovalRecord,
  writeExternalToolHumanApprovalRecord,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-human-approval-record.cjs'))

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

function basePacket(overrides = {}) {
  const toolKind = overrides.toolKind || 'blender'
  const capability = overrides.capability || 'asset.blender.create'
  const workerId = overrides.workerId || 'blender-manual-asset-worker'
  return {
    packetStatus: overrides.packetStatus || 'ready_for_human_review',
    workerId,
    workerDisplayName: overrides.workerDisplayName || 'Manual External Tool Worker',
    capability,
    toolKind,
    readinessStatus: overrides.readinessStatus || 'ready_for_human_execution_approval',
    missingInputs: overrides.missingInputs || ['asset brief', 'approved input scope'],
    missingOutputs: overrides.missingOutputs || [],
    requiredHumanApprovals: overrides.requiredHumanApprovals || [
      'Aprobacion humana explicita antes de cualquier ejecucion real futura.',
    ],
    allowedScopes: overrides.allowedScopes || ['approved sandbox', '.codex-temp'],
    forbiddenActions: overrides.forbiddenActions || ['No ejecutar herramientas reales.'],
    forbiddenPaths: overrides.forbiddenPaths || ['web-prueba', '.env', 'node_modules'],
    operatorChecklist: overrides.operatorChecklist || ['Revisar inputs faltantes.'],
    approvalChecklist: overrides.approvalChecklist || ['Confirmar aprobacion humana.'],
    executionPreconditions: overrides.executionPreconditions || ['Aprobacion humana explicita registrada.'],
    abortConditions: overrides.abortConditions || ['Falta aprobacion humana explicita.'],
    expectedEvidence: overrides.expectedEvidence || ['manual operator notes'],
    validationPlan: overrides.validationPlan || ['repo status/diff review'],
    goNoGoSummary: overrides.goNoGoSummary || 'GO para revision humana.',
    manualOperatorPrompt: overrides.manualOperatorPrompt || 'No ejecutar herramientas desde JEFE.',
    approvalRequest: overrides.approvalRequest || 'Solicitud de aprobacion humana.',
    blockedReasons: overrides.blockedReasons || [],
    riskLevel: overrides.riskLevel || (toolKind === 'mcp' ? 'critical' : 'high'),
    metadata: {
      generatedAt: '2026-06-17T00:00:00.000Z',
      targetProject: overrides.targetProject || 'human approval smoke sandbox',
      noExternalToolExecuted: true,
      executionAuthorized: false,
      ...(overrides.metadata || {}),
    },
  }
}

function writePacket(name, packet) {
  const packetPath = path.join(smokeRoot, name, 'manual-execution-packet.json')
  writeJson(packetPath, packet)
  return packetPath
}

function recordFor(packetPath, overrides = {}) {
  return buildExternalToolHumanApprovalRecord({
    manualExecutionPacketPath: packetPath,
    approverName: 'Lean',
    approverRole: 'Human Owner',
    approvalDecision: 'approved',
    approvalReason: 'Aprobacion controlada de smoke; no autoriza ejecucion automatica.',
    approvedScopes: ['.codex-temp/external-tool-human-approval-record-smoke/approved-scope'],
    ...overrides,
  })
}

function assertNoExecution(record) {
  assert(record.executionAuthorized === false, 'record autorizo ejecucion')
  assert(record.metadata.executionAuthorized === false, 'metadata autorizo ejecucion')
  assert(record.metadata.noExternalToolExecuted === true, 'record no declara noExternalToolExecuted')
  assert(!JSON.stringify(record).includes('"executionAllowed":true'), 'record contiene executionAllowed true')
}

resetDir(smokeRoot)

runCase('Approved Blender packet completo', () => {
  const packetPath = writePacket('approved-blender', basePacket())
  const record = recordFor(packetPath)
  assert(record.approvalStatus === 'approved', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === true, 'approval no quedo usable')
  assertNoExecution(record)
})

runCase('Approved sin approver', () => {
  const packetPath = writePacket('approved-no-approver', basePacket())
  const record = recordFor(packetPath, { approverName: '' })
  assert(['invalid', 'draft'].includes(record.approvalStatus), `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'approval sin approver quedo usable')
  assertNoExecution(record)
})

runCase('Denied', () => {
  const packetPath = writePacket('denied', basePacket())
  const record = recordFor(packetPath, { approvalDecision: 'denied' })
  assert(record.approvalStatus === 'denied', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'denied quedo usable')
  assertNoExecution(record)
})

runCase('Revoked', () => {
  const packetPath = writePacket('revoked', basePacket())
  const record = recordFor(packetPath, { approvalDecision: 'revoked' })
  assert(record.approvalStatus === 'revoked', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'revoked quedo usable')
  assertNoExecution(record)
})

runCase('Expired', () => {
  const packetPath = writePacket('expired', basePacket())
  const record = recordFor(packetPath, { expiration: '2020-01-01T00:00:00.000Z' })
  assert(record.approvalStatus === 'expired', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'expired quedo usable')
  assertNoExecution(record)
})

runCase('Scope peligroso', () => {
  const packetPath = writePacket('dangerous-scope', basePacket())
  const record = recordFor(packetPath, { approvedScopes: ['web-prueba/.env'] })
  assert(record.approvalStatus === 'invalid', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'scope peligroso quedo usable')
  assert(record.invalidationReasons.some((reason) => /web-prueba|env/iu.test(reason)), 'no detecto scope peligroso')
  assertNoExecution(record)
})

runCase('MCP con credenciales reales', () => {
  const packetPath = writePacket('mcp-credentials', basePacket({
    toolKind: 'mcp',
    capability: 'mcp.invoke',
    workerId: 'mcp-future-worker',
    missingInputs: ['MCP capability', 'future permission scopes'],
  }))
  const record = recordFor(packetPath, {
    approvalReason: 'Usar credenciales reales para invocar MCP futuro.',
  })
  assert(record.approvalStatus === 'invalid', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'MCP peligroso quedo usable')
  assert(record.invalidationReasons.some((reason) => /credenciales/iu.test(reason)), 'no detecto credenciales')
  assertNoExecution(record)
})

runCase('Negacion segura no bloquea', () => {
  const packetPath = writePacket('safe-negation', basePacket())
  const record = recordFor(packetPath, {
    approvalConditions: ['no deploy, no Docker, no credenciales, no crear .env'],
  })
  assert(record.approvalStatus === 'approved', `negacion segura bloqueo: ${record.approvalStatus}`)
  assert(record.approvalUsable === true, 'negacion segura no quedo usable')
  assertNoExecution(record)
})

runCase('Missing packet', () => {
  const record = recordFor(path.join(smokeRoot, 'missing-packet.json'))
  assert(record.approvalStatus === 'invalid', `status inesperado: ${record.approvalStatus}`)
  assert(record.approvalUsable === false, 'missing packet quedo usable')
  assert(record.metadata.manualExecutionPacketStatus === 'missing', 'no marco packet missing')
  assertNoExecution(record)
})

runCase('Output inseguro falla', () => {
  const packetPath = writePacket('unsafe-output', basePacket())
  const result = runCli([
    '--packet',
    packetPath,
    '--approver',
    'Lean',
    '--decision',
    'approved',
    '--reason',
    'Aprobacion controlada.',
    '--approved-scope',
    '.codex-temp/safe-scope',
    '--output',
    'scripts/external-tool-human-approval-record-unsafe',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const packetPath = writePacket('json-mode', basePacket({
    toolKind: 'unity',
    capability: 'unity.import.assets',
    workerId: 'unity-manual-integration-worker',
    missingInputs: ['approved Unity project/sandbox', 'assets de entrada'],
  }))
  const result = runCli([
    '--packet',
    packetPath,
    '--approver',
    'Lean',
    '--role',
    'Human Owner',
    '--decision',
    'approved',
    '--reason',
    'Aprobacion controlada JSON.',
    '--approved-scope',
    '.codex-temp/unity-safe-scope',
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-human-approval-record-smoke', 'json-output'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.approvalStatus === 'approved', `JSON status inesperado: ${parsed.approvalStatus}`)
  assert(parsed.executionAuthorized === false, 'JSON autorizo ejecucion')
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
})

runCase('Escritura de artefactos', () => {
  const packetPath = writePacket('write-artifacts', basePacket())
  const record = recordFor(packetPath)
  const written = writeExternalToolHumanApprovalRecord(path.join(smokeRoot, 'record-artifacts'), record)
  assert(fs.existsSync(written.recordPath), 'no escribio record JSON')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.approvedScopePath), 'no escribio approved scope')
  assert(fs.existsSync(written.conditionsPath), 'no escribio conditions')
  assert(fs.existsSync(written.nextActionPath), 'no escribio next action')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

console.log('OK. External Tool Human Approval Record smoke completo.')
