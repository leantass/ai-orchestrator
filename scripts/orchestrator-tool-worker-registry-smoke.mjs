import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-tool-worker-registry-smoke')
const registryCliPath = path.join(repoRoot, 'scripts', 'orchestrator-tool-worker-registry.mjs')
const {
  getDefaultToolWorkerRegistry,
  validateToolWorker,
  findToolWorkersForCapability,
  validateWorkerTask,
  buildWorkerTaskEnvelope,
  writeWorkerTaskEnvelope,
} = require(path.join(repoRoot, 'electron', 'orchestrator-tool-worker-registry.cjs'))

function resetSmokeRoot() {
  if (fs.existsSync(smokeRoot)) {
    fs.rmSync(smokeRoot, { recursive: true, force: true })
  }
  fs.mkdirSync(smokeRoot, { recursive: true })
}

function runCli(args) {
  return spawnSync(process.execPath, [registryCliPath, ...args], {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
  })
}

function runJson(args) {
  const result = runCli([...args, '--json'])
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return JSON.parse(result.stdout)
}

function runCase(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

function findWorker(registry, id) {
  return registry.workers.find((worker) => worker.id === id)
}

resetSmokeRoot()
const registry = getDefaultToolWorkerRegistry()

runCase('Registry default valido', () => {
  assert.equal(registry.version, '0.1')
  assert.equal(registry.workers.length, 6)
  for (const worker of registry.workers) {
    const validation = validateToolWorker(worker)
    assert.equal(validation.valid, true, `${worker.id}: ${validation.issues.join(', ')}`)
    assert.ok(worker.id)
    assert.ok(worker.kind)
    assert.ok(worker.capabilities.length)
    assert.ok(worker.forbiddenActions.length)
  }
})

runCase('Matching Codex sandbox delivery correction', () => {
  const matches = findToolWorkersForCapability(registry, 'sandbox.delivery.correct')
  assert.equal(matches[0].id, 'codex-manual-correction')
})

runCase('Matching scripts tests.run', () => {
  const matches = findToolWorkersForCapability(registry, 'tests.run')
  assert.equal(matches[0].id, 'local-smoke-runner')
})

runCase('Blender planned no permite ejecucion automatica', () => {
  const worker = findToolWorkersForCapability(registry, 'asset.blender.create')[0]
  assert.equal(worker.id, 'blender-manual-asset-worker')
  assert.equal(worker.status, 'planned')
  const envelope = buildWorkerTaskEnvelope(worker, {
    title: 'Preparar asset Blender',
    goal: 'Crear plan de asset y checklist de preparacion.',
    capability: 'asset.blender.create',
    targetPaths: ['.codex-temp/assets/blender'],
    dryRun: true,
  })
  assert.equal(envelope.envelopeStatus, 'requires_human_approval')
  assert.match(envelope.prompt, /Do not execute Blender/i)
})

runCase('Unity planned no permite ejecucion automatica', () => {
  const worker = findToolWorkersForCapability(registry, 'unity.import.assets')[0]
  assert.equal(worker.id, 'unity-manual-integration-worker')
  assert.equal(worker.status, 'planned')
  const envelope = buildWorkerTaskEnvelope(worker, {
    title: 'Preparar import Unity',
    goal: 'Planificar import de assets y checklist de preparacion.',
    capability: 'unity.import.assets',
    targetPaths: ['.codex-temp/assets/unity'],
    dryRun: true,
  })
  assert.equal(envelope.envelopeStatus, 'requires_human_approval')
  assert.match(envelope.prompt, /Do not execute Blender, Unity, MCP/i)
})

runCase('MCP planned queda bajo aprobacion humana', () => {
  const worker = findToolWorkersForCapability(registry, 'mcp.invoke')[0]
  assert.equal(worker.id, 'mcp-future-worker')
  assert.equal(worker.status, 'planned')
  const envelope = buildWorkerTaskEnvelope(worker, {
    title: 'Preparar MCP futuro',
    goal: 'Solo planificar routing MCP.',
    capability: 'mcp.invoke',
    dryRun: true,
  })
  assert.equal(envelope.envelopeStatus, 'requires_human_approval')
  assert.match(envelope.prompt, /Do not execute Blender, Unity, MCP/i)
})

runCase('Task prohibida con .env o deploy queda blocked', () => {
  const worker = findWorker(registry, 'codex-manual-correction')
  const validation = validateWorkerTask(worker, {
    title: 'Crear env',
    goal: 'Crear .env y preparar deploy real.',
    capability: 'sandbox.delivery.correct',
    targetPaths: ['.codex-temp/project/.env'],
  })
  assert.equal(validation.blocked, true)
  const envelope = buildWorkerTaskEnvelope(worker, {
    title: 'Crear env',
    goal: 'Crear .env y preparar deploy real.',
    capability: 'sandbox.delivery.correct',
    targetPaths: ['.codex-temp/project/.env'],
  })
  assert.equal(envelope.envelopeStatus, 'blocked')
})

runCase('Task con git add punto queda blocked', () => {
  const worker = findWorker(registry, 'codex-manual-correction')
  const envelope = buildWorkerTaskEnvelope(worker, {
    title: 'Staging peligroso',
    goal: 'Ejecutar git add . antes de commit.',
    capability: 'sandbox.delivery.correct',
    targetPaths: ['.codex-temp/project'],
  })
  assert.equal(envelope.envelopeStatus, 'blocked')
  assert.match(envelope.prompt, /blocked/i)
})

runCase('Safe Codex sandbox correction task genera envelope ready', () => {
  const worker = findWorker(registry, 'codex-manual-correction')
  const envelope = buildWorkerTaskEnvelope(worker, {
    title: 'Corregir evidencia sandbox',
    goal: 'Agregar reportes simples en evidencia sandbox corregida.',
    capability: 'sandbox.delivery.correct',
    targetPaths: ['.codex-temp/delivery-review-loop-v06/real-trial-01/corrected-evidence'],
    inputArtifacts: ['delivery-review-report.json', 'correction-brief.md'],
    outputArtifacts: ['validation/report.json', 'generated-files.json'],
    approvalMode: 'preapproved',
    dryRun: true,
  })
  assert.equal(envelope.envelopeStatus, 'ready')
  assert.match(envelope.prompt, /No tocar web-prueba/)
  assert.match(envelope.prompt, /No crear ni modificar \.env/)
  const written = writeWorkerTaskEnvelope(path.join(smokeRoot, 'safe-envelope'), envelope)
  assert.ok(fs.existsSync(written.envelopePath))
  assert.ok(fs.existsSync(written.promptPath))
})

runCase('CLI JSON mode parseable', () => {
  const result = runJson(['--capability', 'sandbox.delivery.correct'])
  assert.equal(result.action, 'capability')
  assert.equal(result.workers[0].id, 'codex-manual-correction')
})

runCase('CLI genera envelope desde task JSON', () => {
  const task = JSON.stringify({
    title: 'Corregir evidencia sandbox',
    goal: 'Agregar reportes simples en evidencia sandbox corregida.',
    capability: 'sandbox.delivery.correct',
    targetPaths: ['.codex-temp/workers/safe-codex'],
    approvalMode: 'preapproved',
    dryRun: true,
  })
  const output = path.join(smokeRoot, 'cli-envelope')
  const result = runJson(['--task', task, '--output', output])
  assert.equal(result.action, 'task-envelope')
  assert.equal(result.envelope.envelopeStatus, 'ready')
  assert.ok(fs.existsSync(path.join(output, 'worker-task-envelope.json')))
})

runCase('Output inseguro bloqueado', () => {
  const task = JSON.stringify({
    title: 'Safe task',
    goal: 'Safe goal.',
    capability: 'tests.run',
    dryRun: true,
  })
  const unsafeOutput = path.join(repoRoot, 'scripts', 'worker-registry-output')
  const result = runCli(['--task', task, '--output', unsafeOutput])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Output inseguro/)
  assert.equal(fs.existsSync(path.join(unsafeOutput, 'worker-task-envelope.json')), false)
})

if (process.exitCode) {
  process.exit(process.exitCode)
}
