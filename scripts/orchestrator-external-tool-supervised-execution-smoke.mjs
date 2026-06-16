import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-supervised-execution-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-supervised-execution.mjs')

const {
  buildExternalToolSupervisedExecutionRequest,
  buildExternalToolSupervisedExecutionContract,
  buildExternalToolSupervisedExecutionHandoff,
  writeExternalToolSupervisedExecutionHandoff,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-supervised-execution.cjs'))

const {
  buildExternalToolDryRunPlan,
  writeExternalToolDryRunPlan,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-dry-run-planner.cjs'))

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

function handoffFor(input) {
  const request = buildExternalToolSupervisedExecutionRequest({
    targetProject: 'supervised execution smoke sandbox',
    ...input,
  })
  return buildExternalToolSupervisedExecutionHandoff(buildExternalToolSupervisedExecutionContract(request))
}

function assertNeverExecutes(handoff) {
  assert(handoff.executionAllowed === false, 'executionAllowed no es false')
  assert(handoff.supervisedOnly === true, 'supervisedOnly no es true')
  assert(handoff.executionPhases.every((phase) => phase.wouldExecute === false), 'alguna phase intenta ejecutar')
  assert(/No ejecutar esta herramienta automaticamente en v0\.8/u.test(handoff.handoffPrompt), 'prompt no bloquea ejecucion automatica')
  assert(/Requiere aprobacion humana/u.test(handoff.handoffPrompt), 'prompt no exige aprobacion humana')
}

resetDir(smokeRoot)

runCase('Blender supervised design desde args', () => {
  const handoff = handoffFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset manual en Blender',
    targetPaths: ['approved asset sandbox/hero'],
    humanApproval: true,
  })
  assert(['design_ready', 'requires_human_approval'].includes(handoff.executionStatus), `status inesperado: ${handoff.executionStatus}`)
  assert(handoff.workerId === 'blender-manual-asset-worker', 'worker Blender incorrecto')
  assert(handoff.executionPhases.some((phase) => /Blender/u.test(phase.tool)), 'no genero fases Blender')
  assertNeverExecutes(handoff)
})

runCase('Blender desde dry-run plan', () => {
  const plan = buildExternalToolDryRunPlan({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset manual en Blender',
    targetProject: 'supervised execution smoke sandbox',
    targetPaths: ['approved asset sandbox/hero'],
    humanApproval: true,
  })
  const writtenPlan = writeExternalToolDryRunPlan(path.join(smokeRoot, 'blender-plan'), plan)
  const handoff = handoffFor({
    dryRunPlanPath: writtenPlan.planPath,
    humanApproval: true,
  })
  assert(handoff.executionStatus === 'design_ready', `status inesperado: ${handoff.executionStatus}`)
  assertNeverExecutes(handoff)
})

runCase('Unity supervised design', () => {
  const handoff = handoffFor({
    capability: 'unity.import.assets',
    requestedAction: 'Importar assets manualmente en Unity',
    targetPaths: ['approved Unity sandbox branch/Assets'],
    humanApproval: true,
  })
  assert(handoff.executionStatus === 'design_ready', `status inesperado: ${handoff.executionStatus}`)
  assert(handoff.workerId === 'unity-manual-integration-worker', 'worker Unity incorrecto')
  assert(handoff.executionPhases.some((phase) => /Unity/u.test(phase.tool)), 'no genero fases Unity')
  assertNeverExecutes(handoff)
})

runCase('MCP supervised design', () => {
  const handoff = handoffFor({
    capability: 'mcp.invoke',
    requestedAction: 'Planificar futura invocacion MCP',
    targetPaths: ['planned MCP routing only'],
    humanApproval: true,
  })
  assert(['design_ready', 'blocked', 'requires_human_approval'].includes(handoff.executionStatus), `status inesperado: ${handoff.executionStatus}`)
  assert(handoff.workerId === 'mcp-future-worker', 'worker MCP incorrecto')
  assertNeverExecutes(handoff)
})

runCase('Accion peligrosa .env bloqueada', () => {
  const handoff = handoffFor({
    capability: 'asset.blender.create',
    requestedAction: 'Crear asset y crear .env con credenciales reales',
    humanApproval: true,
  })
  assert(handoff.executionStatus === 'blocked', `status inesperado: ${handoff.executionStatus}`)
  assert(handoff.blockedReasons.some((reason) => /env|credenciales/iu.test(reason)), 'no detecto .env/credenciales')
  assertNeverExecutes(handoff)
})

runCase('Accion peligrosa deploy Docker bloqueada', () => {
  const handoff = handoffFor({
    capability: 'unity.import.assets',
    requestedAction: 'Preparar deploy usando Docker y generar builds',
    humanApproval: true,
  })
  assert(handoff.executionStatus === 'blocked', `status inesperado: ${handoff.executionStatus}`)
  assert(handoff.blockedReasons.some((reason) => /Docker|deploy|build/iu.test(reason)), 'no detecto deploy/Docker/build')
  assertNeverExecutes(handoff)
})

runCase('Negacion segura no bloquea', () => {
  const handoff = handoffFor({
    capability: 'mcp.invoke',
    requestedAction: 'Documentar plan futuro: no Docker, no deploy, no credenciales',
    humanApproval: true,
  })
  assert(handoff.executionStatus !== 'blocked', `negacion segura bloqueada: ${handoff.executionStatus}`)
  assertNeverExecutes(handoff)
})

runCase('Missing artifacts controlado', () => {
  const handoff = handoffFor({
    dryRunPlanPath: path.join(smokeRoot, 'missing-dry-run-plan.json'),
    humanApproval: true,
  })
  assert(handoff.executionStatus === 'missing_artifacts', `status inesperado: ${handoff.executionStatus}`)
  assert(handoff.blockedReasons.some((reason) => /inexistente/iu.test(reason)), 'no reporto missing plan')
  assertNeverExecutes(handoff)
})

runCase('Output inseguro falla', () => {
  const result = runCli([
    '--capability',
    'asset.blender.create',
    '--requested-action',
    'Crear asset manual',
    '--output',
    'scripts/external-tool-supervised-unsafe',
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
    '--human-approval',
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-supervised-execution-smoke', 'json-mode'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
  assert(parsed.executionAllowed === false, 'JSON permite ejecucion')
})

runCase('Escritura de artefactos', () => {
  const handoff = handoffFor({
    capability: 'unity.import.assets',
    requestedAction: 'Importar assets manualmente en Unity',
    targetPaths: ['approved Unity sandbox branch/Assets'],
    humanApproval: true,
  })
  const written = writeExternalToolSupervisedExecutionHandoff(path.join(smokeRoot, 'write-artifacts'), handoff)
  assert(fs.existsSync(written.handoffPath), 'no escribio handoff')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.checklistPath), 'no escribio checklist')
  assert(fs.existsSync(written.evidencePath), 'no escribio evidence')
  assert(fs.existsSync(written.validationPath), 'no escribio validation')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

console.log('OK. External Tool Supervised Execution smoke completo.')
