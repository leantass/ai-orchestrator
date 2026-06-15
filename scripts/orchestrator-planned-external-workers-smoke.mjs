import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-planned-external-workers-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-planned-external-workers.mjs')

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

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  })
}

function handoffFor(input) {
  return buildPlannedExternalWorkerHandoff(buildPlannedExternalWorkerTask(input))
}

resetDir(smokeRoot)

runCase('Blender planned create', () => {
  const handoff = handoffFor({
    capability: 'asset.blender.create',
    taskTitle: 'Preparar hero asset ceremonial',
    targetProject: 'HeroesOfHistory_Reborn',
  })
  assert(handoff.workerId === 'blender-manual-asset-worker', 'worker Blender incorrecto')
  assert(['planned_ready', 'requires_human_approval'].includes(handoff.handoffStatus), `status inesperado: ${handoff.handoffStatus}`)
  assert(/NO ejecuta herramientas externas|No ejecutar Blender automaticamente/iu.test(handoff.prompt), 'prompt permite ejecucion automatica')
})

runCase('Blender export FBX manual futuro', () => {
  const handoff = handoffFor({
    capability: 'asset.export.fbx',
    taskTitle: 'Planificar export FBX futuro',
  })
  assert(handoff.workerId === 'blender-manual-asset-worker', 'worker export FBX incorrecto')
  assert(/export/i.test(handoff.prompt), 'prompt no menciona export')
  assert(/No ejecutar Blender automaticamente/iu.test(handoff.prompt), 'prompt no prohibe ejecutar Blender')
})

runCase('Unity import assets planned', () => {
  const handoff = handoffFor({
    capability: 'unity.import.assets',
    taskTitle: 'Planificar importacion de assets',
    targetProject: 'HeroesOfHistory_Reborn',
  })
  assert(handoff.workerId === 'unity-manual-integration-worker', 'worker Unity incorrecto')
  assert(/No abrir Unity automaticamente|No abrir Unity/iu.test(handoff.prompt), 'prompt no prohibe abrir Unity')
})

runCase('Unity run tests planned manual', () => {
  const handoff = handoffFor({
    capability: 'unity.run.tests',
    taskTitle: 'Planificar tests Unity futuros',
  })
  assert(handoff.workerId === 'unity-manual-integration-worker', 'worker Unity tests incorrecto')
  assert(['planned_ready', 'requires_human_approval'].includes(handoff.handoffStatus), 'Unity tests no quedo planned/manual')
  assert(/No generar builds/iu.test(handoff.prompt), 'prompt no prohibe generar builds')
})

runCase('MCP invoke planned sin invocacion real', () => {
  const handoff = handoffFor({
    capability: 'mcp.invoke',
    taskTitle: 'Planificar invocacion MCP futura',
  })
  assert(handoff.workerId === 'mcp-future-worker', 'worker MCP incorrecto')
  assert(['planned_ready', 'requires_human_approval', 'blocked'].includes(handoff.handoffStatus), 'MCP status inesperado')
  assert(/No invocar MCP real|no invocar MCP/iu.test(handoff.prompt), 'prompt no prohibe MCP real')
})

runCase('Capability inexistente', () => {
  const handoff = handoffFor({
    capability: 'external.unknown.run',
    taskTitle: 'Capability inexistente',
  })
  assert(handoff.handoffStatus === 'no_matching_worker', `status inesperado: ${handoff.handoffStatus}`)
})

runCase('Task peligrosa bloqueada', () => {
  const handoff = handoffFor({
    capability: 'asset.blender.create',
    taskTitle: 'Crear .env y hacer deploy con Docker',
  })
  assert(handoff.handoffStatus === 'blocked', `task peligrosa no bloqueada: ${handoff.handoffStatus}`)
  assert(handoff.safetyNotes.some((note) => /bloqueado/iu.test(note)), 'no registro safety note')
})

runCase('Negacion segura no bloquea', () => {
  const handoff = handoffFor({
    capability: 'asset.blender.create',
    taskTitle: 'Preparar asset sin credenciales',
    constraints: ['no deploy', 'no usar Docker', 'no tocar web-prueba', 'sin credenciales'],
  })
  assert(handoff.handoffStatus !== 'blocked', `negacion segura bloqueada: ${handoff.handoffStatus}`)
})

runCase('Escritura de artefactos', () => {
  const handoff = handoffFor({
    capability: 'unity.import.assets',
    taskTitle: 'Planificar import Unity',
  })
  const written = writePlannedExternalWorkerHandoff(path.join(smokeRoot, 'write-artifacts'), handoff)
  assert(fs.existsSync(written.handoffPath), 'no escribio handoff')
  assert(fs.existsSync(written.promptPath), 'no escribio prompt')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

runCase('Output inseguro falla', () => {
  const result = runCli([
    '--capability',
    'asset.blender.create',
    '--title',
    'Output inseguro',
    '--output',
    'scripts/planned-external-workers-output',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const result = runCli([
    '--capability',
    'unity.import.assets',
    '--title',
    'JSON mode Unity',
    '--target-project',
    'HeroesOfHistory_Reborn',
    '--output',
    path.join('.codex-temp', 'orchestrator-planned-external-workers-smoke', 'json-mode'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
  assert(parsed.handoffStatus !== 'blocked', 'JSON quedo bloqueado inesperadamente')
})

console.log('OK. Planned External Workers smoke completo.')
