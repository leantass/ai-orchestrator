import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  buildLocalSmokeWorkerTask,
  runLocalSmokeWorkerTask,
  writeLocalSmokeWorkerReport,
  validateSafeOutputDir,
  commandsFromPreset,
} = require(path.join(repoRoot, 'electron', 'orchestrator-local-smoke-worker.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-local-smoke-worker.mjs \\
  [--commands <json-array-or-file>] \\
  [--preset <delivery-basic|delivery-full|registry-basic|quality-ci>] \\
  [--from-worker-handoff <path>] \\
  --output <path> \\
  [--execute] \\
  [--fail-fast] \\
  [--timeout-ms <number>] \\
  [--json]`)
}

function parseArgs(argv) {
  const options = {
    execute: false,
    failFast: false,
    json: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--execute') {
      options.execute = true
      continue
    }
    if (arg === '--fail-fast') {
      options.failFast = true
      continue
    }
    if (arg === '--json') {
      options.json = true
      continue
    }
    const nextValue = () => {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) {
        throw new Error(`Falta valor para ${arg}`)
      }
      index += 1
      return value
    }
    if (arg === '--commands') {
      options.commands = nextValue()
      continue
    }
    if (arg === '--preset') {
      options.preset = nextValue()
      continue
    }
    if (arg === '--from-worker-handoff') {
      options.fromWorkerHandoff = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    if (arg === '--timeout-ms') {
      options.timeoutMs = Number(nextValue())
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!options.outputDir) {
    throw new Error('--output es obligatorio')
  }
  return options
}

function readJsonMaybeFile(value, label) {
  if (!value) {
    return null
  }
  const potentialPath = path.resolve(repoRoot, value)
  const text = fs.existsSync(potentialPath) ? fs.readFileSync(potentialPath, 'utf8') : value
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`No se pudo parsear ${label} como JSON: ${error.message}`)
  }
}

function readHandoffCommands(handoffPath) {
  if (!handoffPath) {
    return []
  }
  const resolved = path.resolve(repoRoot, handoffPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`No existe --from-worker-handoff: ${resolved}`)
  }
  const handoff = JSON.parse(fs.readFileSync(resolved, 'utf8'))
  const commands = [
    ...(handoff.validationCommands || []),
    ...(handoff.workerEnvelope?.validationCommands || []),
  ]
  return {
    commands,
    sourceHandoffPath: resolved,
  }
}

function normalizeCommandsOption(value) {
  const parsed = readJsonMaybeFile(value, '--commands')
  if (!parsed) {
    return []
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error('--commands debe ser un array JSON de strings')
  }
  return parsed
}

function buildTaskFromOptions(options) {
  const outputDir = validateSafeOutputDir(options.outputDir)
  const handoffInput = readHandoffCommands(options.fromWorkerHandoff)
  const commands = [
    ...normalizeCommandsOption(options.commands),
    ...(options.preset ? commandsFromPreset(options.preset) : []),
    ...(handoffInput.commands || []),
  ]
  if (!commands.length) {
    throw new Error('No hay comandos para validar. Usar --commands, --preset o --from-worker-handoff.')
  }
  return buildLocalSmokeWorkerTask({
    taskTitle: options.preset
      ? `Validaciones locales supervisadas (${options.preset})`
      : 'Validaciones locales supervisadas',
    preset: '',
    commands,
    outputDir,
    dryRun: !options.execute,
    failFast: options.failFast,
    timeoutMs: options.timeoutMs,
    sourceHandoffPath: handoffInput.sourceHandoffPath || '',
    metadata: {
      cli: 'orchestrator-local-smoke-worker',
      preset: options.preset || '',
    },
  })
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const task = buildTaskFromOptions(options)
  const result = runLocalSmokeWorkerTask(task, { outputDir: task.outputDir })
  const written = writeLocalSmokeWorkerReport(task.outputDir, result)
  return {
    taskStatus: written.result.taskStatus,
    validationPassed: written.result.validationPassed,
    dryRun: written.result.dryRun,
    commandCount: written.result.commands.length,
    outputDir: written.outputDir,
    reportPath: written.reportPath,
    summaryPath: written.summaryPath,
    result: written.result,
  }
}

function main() {
  try {
    const output = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(output, null, 2))
      return
    }
    console.log('Local Smoke Worker')
    console.log(`taskStatus: ${output.taskStatus}`)
    console.log(`validationPassed: ${output.validationPassed}`)
    console.log(`dryRun: ${output.dryRun}`)
    console.log(`commands: ${output.commandCount}`)
    console.log(`output: ${output.reportPath}`)
  } catch (error) {
    console.error(`[local-smoke-worker] ${error.message}`)
    process.exit(1)
  }
}

main()
