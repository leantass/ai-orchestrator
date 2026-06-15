import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildPlannedExternalWorkerTask,
  buildPlannedExternalWorkerHandoff,
  writePlannedExternalWorkerHandoff,
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-planned-external-workers.mjs \\
  --capability <capability> \\
  [--task <json-or-file>] \\
  [--title <title>] \\
  [--target-project <path-or-name>] \\
  [--input <path>]... \\
  [--output-artifact <path>]... \\
  --output <path> \\
  [--worker <workerId>] \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    inputs: [],
    outputArtifacts: [],
    json: false,
    summary: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--json') {
      options.json = true
      continue
    }
    if (arg === '--summary') {
      options.summary = true
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
    if (arg === '--capability') {
      options.capability = nextValue()
      continue
    }
    if (arg === '--task') {
      options.task = nextValue()
      continue
    }
    if (arg === '--title') {
      options.title = nextValue()
      continue
    }
    if (arg === '--target-project') {
      options.targetProject = nextValue()
      continue
    }
    if (arg === '--input') {
      options.inputs.push(nextValue())
      continue
    }
    if (arg === '--output-artifact') {
      options.outputArtifacts.push(nextValue())
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    if (arg === '--worker') {
      options.workerPreference = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!options.capability && !options.task) {
    throw new Error('--capability es obligatorio salvo que --task lo defina')
  }
  if (!options.outputDir) {
    throw new Error('--output es obligatorio')
  }
  return options
}

function readJsonMaybeFile(value, label) {
  if (!value) {
    return {}
  }
  const potentialPath = path.resolve(repoRoot, value)
  const text = fs.existsSync(potentialPath) ? fs.readFileSync(potentialPath, 'utf8') : value
  try {
    return JSON.parse(text.replace(/^\uFEFF/u, ''))
  } catch (error) {
    throw new Error(`No se pudo parsear ${label} como JSON: ${error.message}`)
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const taskInput = {
    ...readJsonMaybeFile(options.task, '--task'),
    capability: options.capability || readJsonMaybeFile(options.task, '--task').capability,
    taskTitle: options.title || readJsonMaybeFile(options.task, '--task').taskTitle,
    targetProject: options.targetProject || readJsonMaybeFile(options.task, '--task').targetProject,
    inputArtifacts: options.inputs.length ? options.inputs : readJsonMaybeFile(options.task, '--task').inputArtifacts,
    outputArtifacts: options.outputArtifacts.length
      ? options.outputArtifacts
      : readJsonMaybeFile(options.task, '--task').outputArtifacts,
    workerPreference: options.workerPreference || readJsonMaybeFile(options.task, '--task').workerPreference,
  }
  const outputDir = validateSafeOutputDir(options.outputDir)
  const task = buildPlannedExternalWorkerTask(taskInput)
  const handoff = buildPlannedExternalWorkerHandoff(task)
  const written = writePlannedExternalWorkerHandoff(outputDir, handoff)
  return {
    handoffStatus: written.handoff.handoffStatus,
    workerId: written.handoff.workerId,
    workerDisplayName: written.handoff.workerDisplayName,
    capability: written.handoff.capability,
    outputDir: written.outputDir,
    handoffPath: written.handoffPath,
    promptPath: written.promptPath,
    summaryPath: written.summaryPath,
    handoff: written.handoff,
  }
}

function main() {
  try {
    const result = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    if (process.argv.includes('--summary')) {
      console.log(`${result.handoffStatus}: ${result.workerId || 'no worker'} (${result.capability})`)
      console.log(`handoff: ${result.handoffPath}`)
      return
    }
    console.log('Planned External Worker Handoff')
    console.log(`handoffStatus: ${result.handoffStatus}`)
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability}`)
    console.log(`output: ${result.handoffPath}`)
  } catch (error) {
    console.error(`[planned-external-workers] ${error.message}`)
    process.exit(1)
  }
}

main()
