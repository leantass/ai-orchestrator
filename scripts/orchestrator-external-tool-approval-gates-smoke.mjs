import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-approval-gates-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-approval-gates.mjs')

const {
  buildExternalToolApprovalGate,
  writeExternalToolApprovalGate,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-approval-gates.cjs'))

const {
  buildPlannedExternalWorkerTask,
  buildPlannedExternalWorkerHandoff,
  writePlannedExternalWorkerHandoff,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

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

function gateFor(input) {
  return buildExternalToolApprovalGate({
    targetProject: 'approval gates smoke sandbox',
    ...input,
  })
}

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

resetDir(smokeRoot)

runCase('Blender sin aprobacion humana requiere approval', () => {
  const gate = gateFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset hero manual en Blender',
    targetPaths: ['approved asset sandbox/hero'],
  })
  assert(gate.gateStatus === 'requires_human_approval', `status inesperado: ${gate.gateStatus}`)
  assert(gate.workerId === 'blender-manual-asset-worker', 'worker Blender incorrecto')
  assert(gate.safetyNotes.some((note) => /No external tool was executed/u.test(note)), 'falta nota no execution')
})

runCase('Blender con aprobacion humana queda manual approved state', () => {
  const gate = gateFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset hero manual en Blender',
    targetPaths: ['approved asset sandbox/hero'],
    humanApproval: true,
  })
  assert(gate.gateStatus === 'approved_for_manual_execution', `status inesperado: ${gate.gateStatus}`)
  assert(gate.metadata.dryRun === true && gate.metadata.approvalGateOnly === true, 'no quedo dry-run only')
})

runCase('Unity sin aprobacion humana requiere approval', () => {
  const gate = gateFor({
    capability: 'unity.import.assets',
    requestedAction: 'Importar assets manualmente en Unity',
    targetPaths: ['approved Unity sandbox branch/Assets'],
  })
  assert(gate.gateStatus === 'requires_human_approval', `status inesperado: ${gate.gateStatus}`)
  assert(gate.workerId === 'unity-manual-integration-worker', 'worker Unity incorrecto')
})

runCase('MCP sin aprobacion humana requiere approval o bloquea controlado', () => {
  const gate = gateFor({
    capability: 'mcp.invoke',
    requestedAction: 'Preparar futura invocacion MCP',
    targetPaths: ['planned MCP routing only'],
  })
  assert(['requires_human_approval', 'plan_only', 'blocked'].includes(gate.gateStatus), `status inesperado: ${gate.gateStatus}`)
  assert(gate.workerId === 'mcp-future-worker', 'worker MCP incorrecto')
})

runCase('Accion peligrosa .env bloqueada', () => {
  const gate = gateFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset y crear .env con credenciales reales',
  })
  assert(gate.gateStatus === 'blocked', `status inesperado: ${gate.gateStatus}`)
  assert(gate.blockedReasons.some((reason) => /env|credenciales/iu.test(reason)), 'no detecto .env/credenciales')
})

runCase('Accion peligrosa deploy Docker bloqueada', () => {
  const gate = gateFor({
    capability: 'unity.import.assets',
    requestedAction: 'Preparar deploy usando Docker y generar builds',
  })
  assert(gate.gateStatus === 'blocked', `status inesperado: ${gate.gateStatus}`)
  assert(gate.blockedReasons.some((reason) => /Docker|deploy|build/iu.test(reason)), 'no detecto deploy/Docker/build')
})

runCase('Negacion segura no bloquea', () => {
  const gate = gateFor({
    capability: 'mcp.invoke',
    requestedAction: 'Documentar plan futuro: no Docker, no deploy, no credenciales',
  })
  assert(gate.gateStatus !== 'blocked', `negacion segura bloqueada: ${gate.gateStatus}`)
})

runCase('Escritura de artefactos', () => {
  const gate = gateFor({
    capability: 'unity.import.assets',
    requestedAction: 'Importar assets manualmente en Unity',
    targetPaths: ['approved Unity sandbox branch/Assets'],
  })
  const written = writeExternalToolApprovalGate(path.join(smokeRoot, 'write-artifacts'), gate)
  assert(fs.existsSync(written.gatePath), 'no escribio gate')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.checklistPath), 'no escribio checklist')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

runCase('Output inseguro falla', () => {
  const result = runCli([
    '--capability',
    'asset.blender.create',
    '--requested-action',
    'Crear asset manual',
    '--output',
    'scripts/external-tool-approval-gates-unsafe',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const result = runCli([
    '--capability',
    'unity.import.assets',
    '--requested-action',
    'Importar assets manualmente en Unity',
    '--target-path',
    'approved Unity sandbox branch/Assets',
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-approval-gates-smoke', 'json-mode'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
  assert(parsed.gateStatus === 'requires_human_approval', `JSON status inesperado: ${parsed.gateStatus}`)
})

runCase('Handoff planificado fixture', () => {
  const handoff = buildPlannedExternalWorkerHandoff(buildPlannedExternalWorkerTask({
    capability: 'asset.blender.create',
    taskTitle: 'Planificar creacion manual de asset Blender',
    targetProject: 'approval gates smoke sandbox',
  }))
  const handoffOut = writePlannedExternalWorkerHandoff(path.join(smokeRoot, 'planned-fixture'), handoff)
  const result = runCli([
    '--handoff',
    path.relative(repoRoot, handoffOut.handoffPath),
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-approval-gates-smoke', 'handoff-gate'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI handoff fallo')
  const parsed = JSON.parse(result.stdout)
  assert(['plan_only', 'requires_human_approval'].includes(parsed.gateStatus), `handoff status inesperado: ${parsed.gateStatus}`)
  assert(parsed.workerId === 'blender-manual-asset-worker', 'handoff worker incorrecto')
})

console.log('OK. External Tool Approval Gates smoke completo.')
