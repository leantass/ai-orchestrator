import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-local-smoke-worker-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-local-smoke-worker.mjs')

const {
  findToolWorkersForCapability,
  getDefaultToolWorkerRegistry,
} = require(path.join(repoRoot, 'electron', 'orchestrator-tool-worker-registry.cjs'))
const {
  validateSmokeCommand,
  buildLocalSmokeWorkerTask,
  buildLocalSmokeWorkerEnvelope,
  runLocalSmokeWorkerTask,
  writeLocalSmokeWorkerReport,
  commandsFromPreset,
} = require(path.join(repoRoot, 'electron', 'orchestrator-local-smoke-worker.cjs'))

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

resetDir(smokeRoot)

runCase('Registry worker existe', () => {
  const registry = getDefaultToolWorkerRegistry()
  const matches = findToolWorkersForCapability(registry, 'tests.run')
  assert(matches.some((worker) => worker.id === 'local-smoke-runner'), 'local-smoke-runner no encontrado')
})

runCase('Comando seguro permitido', () => {
  const validation = validateSmokeCommand('node --check src/planner-ui-state.js')
  assert(validation.allowed, validation.reason || 'comando seguro bloqueado')
  assert(validation.executable === 'node', 'ejecutable inesperado')
})

runCase('Dry-run genera reporte sin ejecutar', () => {
  const outputDir = path.join(smokeRoot, 'dry-run')
  const task = buildLocalSmokeWorkerTask({
    commands: ['node --check src/planner-ui-state.js'],
    outputDir,
    dryRun: true,
  })
  const result = runLocalSmokeWorkerTask(task)
  const written = writeLocalSmokeWorkerReport(outputDir, result)
  assert(written.result.taskStatus === 'dry_run', 'dry-run no quedo en dry_run')
  assert(written.result.commands[0].status === 'skipped', 'dry-run ejecuto comando')
  assert(fs.existsSync(written.reportPath), 'no escribio reporte dry-run')
})

runCase('Execute seguro pasa', () => {
  const outputDir = path.join(smokeRoot, 'execute-safe')
  const task = buildLocalSmokeWorkerTask({
    commands: ['node --check src/planner-ui-state.js'],
    outputDir,
    dryRun: false,
  })
  const result = runLocalSmokeWorkerTask(task)
  const written = writeLocalSmokeWorkerReport(outputDir, result)
  assert(written.result.taskStatus === 'completed', `status inesperado: ${written.result.taskStatus}`)
  assert(written.result.commands[0].status === 'passed', 'node --check no paso')
  assert(fs.existsSync(written.result.commands[0].stdoutLogPath), 'no escribio stdout log')
})

runCase('Preset registry-basic dry-run', () => {
  const commands = commandsFromPreset('registry-basic')
  assert(commands.length >= 2, 'preset registry-basic incompleto')
  const task = buildLocalSmokeWorkerTask({
    commands,
    outputDir: path.join(smokeRoot, 'registry-basic'),
    dryRun: true,
  })
  const envelope = buildLocalSmokeWorkerEnvelope(task)
  assert(envelope.taskStatus === 'dry_run', `preset no quedo dry_run: ${envelope.taskStatus}`)
  assert(envelope.commands.every((command) => command.status === 'skipped'), 'preset tiene comando bloqueado')
})

runCase('Comando peligroso npm install bloqueado', () => {
  const validation = validateSmokeCommand('npm install')
  assert(!validation.allowed && validation.status === 'blocked', 'npm install no fue bloqueado')
})

runCase('Comando peligroso git add punto bloqueado', () => {
  const validation = validateSmokeCommand('git add .')
  assert(!validation.allowed && validation.status === 'blocked', 'git add . no fue bloqueado')
})

runCase('Comando peligroso Docker/deploy bloqueado', () => {
  const dockerValidation = validateSmokeCommand('docker ps')
  const deployValidation = validateSmokeCommand('node scripts/deploy-smoke.mjs')
  assert(!dockerValidation.allowed, 'docker no fue bloqueado')
  assert(!deployValidation.allowed, 'deploy smoke inventado no fue bloqueado')
})

runCase('Ruta prohibida .env bloqueada', () => {
  const validation = validateSmokeCommand('node --check .env')
  assert(!validation.allowed, '.env no fue bloqueado')
})

runCase('Output inseguro falla en CLI', () => {
  const result = runCli([
    '--commands',
    '["node --check src/planner-ui-state.js"]',
    '--output',
    'scripts/orchestrator-local-smoke-worker-smoke-output',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const result = runCli([
    '--commands',
    '["node --check src/planner-ui-state.js"]',
    '--output',
    path.join('.codex-temp', 'orchestrator-local-smoke-worker-smoke', 'cli-json'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.taskStatus === 'dry_run', 'JSON no contiene dry_run')
  assert(parsed.commandCount === 1, 'JSON commandCount inesperado')
})

console.log('OK. Local Smoke Worker smoke completo.')
