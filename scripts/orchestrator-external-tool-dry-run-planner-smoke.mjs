import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-dry-run-planner-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-dry-run-planner.mjs')

const {
  buildExternalToolDryRunPlan,
  writeExternalToolDryRunPlan,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-dry-run-planner.cjs'))

const {
  buildExternalToolApprovalGate,
  writeExternalToolApprovalGate,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-approval-gates.cjs'))

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

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function planFor(input) {
  return buildExternalToolDryRunPlan({
    targetProject: 'dry-run planner smoke sandbox',
    ...input,
  })
}

function assertNeverExecutes(plan) {
  assert(plan.dryRunOnly === true, 'dryRunOnly no es true')
  assert(plan.executionAllowed === false, 'executionAllowed no es false')
  assert(plan.steps.every((step) => step.wouldRun === false), 'algun step intenta ejecutar')
}

resetDir(smokeRoot)

runCase('Blender dry-run desde args', () => {
  const plan = planFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset manual en Blender',
    targetPaths: ['approved asset sandbox/hero'],
  })
  assert(['dry_run_ready', 'requires_human_approval'].includes(plan.planStatus), `status inesperado: ${plan.planStatus}`)
  assert(plan.workerId === 'blender-manual-asset-worker', 'worker Blender incorrecto')
  assert(plan.steps.some((step) => /Blender/u.test(step.tool)), 'no genero steps Blender')
  assertNeverExecutes(plan)
})

runCase('Blender dry-run desde approval gate con aprobacion simulada', () => {
  const gate = buildExternalToolApprovalGate({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset manual en Blender',
    targetProject: 'dry-run planner smoke sandbox',
    targetPaths: ['approved asset sandbox/hero'],
    humanApproval: true,
  })
  const writtenGate = writeExternalToolApprovalGate(path.join(smokeRoot, 'blender-gate'), gate)
  const plan = buildExternalToolDryRunPlan({
    approvalGatePath: writtenGate.gatePath,
    humanApproval: true,
  })
  assert(plan.planStatus === 'dry_run_ready', `status inesperado: ${plan.planStatus}`)
  assertNeverExecutes(plan)
})

runCase('Unity dry-run', () => {
  const plan = planFor({
    capability: 'unity.import.assets',
    requestedAction: 'Importar assets manualmente en Unity',
    targetPaths: ['approved Unity sandbox branch/Assets'],
  })
  assert(['dry_run_ready', 'requires_human_approval'].includes(plan.planStatus), `status inesperado: ${plan.planStatus}`)
  assert(plan.workerId === 'unity-manual-integration-worker', 'worker Unity incorrecto')
  assert(plan.steps.some((step) => /Unity/u.test(step.tool)), 'no genero steps Unity')
  assertNeverExecutes(plan)
})

runCase('MCP dry-run', () => {
  const plan = planFor({
    capability: 'mcp.invoke',
    requestedAction: 'Planificar futura invocacion MCP',
    targetPaths: ['planned MCP routing only'],
  })
  assert(['dry_run_ready', 'requires_human_approval', 'blocked'].includes(plan.planStatus), `status inesperado: ${plan.planStatus}`)
  assert(plan.workerId === 'mcp-future-worker', 'worker MCP incorrecto')
  assertNeverExecutes(plan)
})

runCase('Accion peligrosa .env bloqueada', () => {
  const plan = planFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset y crear .env con credenciales reales',
  })
  assert(plan.planStatus === 'blocked', `status inesperado: ${plan.planStatus}`)
  assert(plan.blockedReasons.some((reason) => /env|credenciales/iu.test(reason)), 'no detecto .env/credenciales')
  assertNeverExecutes(plan)
})

runCase('Accion peligrosa deploy Docker bloqueada', () => {
  const plan = planFor({
    capability: 'unity.import.assets',
    requestedAction: 'Preparar deploy usando Docker y generar builds',
  })
  assert(plan.planStatus === 'blocked', `status inesperado: ${plan.planStatus}`)
  assert(plan.blockedReasons.some((reason) => /Docker|deploy|build/iu.test(reason)), 'no detecto deploy/Docker/build')
  assertNeverExecutes(plan)
})

runCase('Negacion segura no bloquea', () => {
  const plan = planFor({
    capability: 'mcp.invoke',
    requestedAction: 'Documentar plan futuro: no Docker, no deploy, no credenciales',
  })
  assert(plan.planStatus !== 'blocked', `negacion segura bloqueada: ${plan.planStatus}`)
  assertNeverExecutes(plan)
})

runCase('Missing artifacts controlado', () => {
  const plan = buildExternalToolDryRunPlan({
    approvalGatePath: path.join(smokeRoot, 'missing-gate.json'),
  })
  assert(plan.planStatus === 'missing_artifacts', `status inesperado: ${plan.planStatus}`)
  assert(plan.blockedReasons.some((reason) => /inexistente/iu.test(reason)), 'no reporto missing gate')
  assertNeverExecutes(plan)
})

runCase('Output inseguro falla', () => {
  const result = runCli([
    '--capability',
    'asset.blender.create',
    '--requested-action',
    'Crear asset manual',
    '--output',
    'scripts/external-tool-dry-run-unsafe',
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
    path.join('.codex-temp', 'orchestrator-external-tool-dry-run-planner-smoke', 'json-mode'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
  assert(parsed.executionAllowed === false, 'JSON permite ejecucion')
})

runCase('Escritura de artefactos', () => {
  const plan = planFor({
    capability: 'unity.import.assets',
    requestedAction: 'Importar assets manualmente en Unity',
    targetPaths: ['approved Unity sandbox branch/Assets'],
    humanApproval: true,
  })
  const written = writeExternalToolDryRunPlan(path.join(smokeRoot, 'write-artifacts'), plan)
  assert(fs.existsSync(written.planPath), 'no escribio plan')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.previewPath), 'no escribio preview')
  assert(fs.existsSync(written.evidencePath), 'no escribio evidence checklist')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

console.log('OK. External Tool Dry-Run Planner smoke completo.')
