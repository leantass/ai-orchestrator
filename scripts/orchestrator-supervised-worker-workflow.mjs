import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  runSupervisedWorkerWorkflow,
  writeSupervisedWorkerWorkflowReport,
  validateSafeArtifactPath,
} = require(path.join(repoRoot, 'electron', 'orchestrator-supervised-worker-workflow.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-supervised-worker-workflow.mjs \\
  [--case <caseName>] \\
  --worker-handoff <path> \\
  [--corrected-evidence <path>] \\
  [--validation-preset <preset>] \\
  [--validation-commands <json-array-or-file>] \\
  --output <path> \\
  [--execute-validation] \\
  [--fail-fast] \\
  [--timeout-ms <number>] \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    validationPreset: 'delivery-basic',
    executeValidation: false,
    failFast: false,
    json: false,
    summary: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--execute-validation') {
      options.executeValidation = true
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
    if (arg === '--case') {
      options.caseName = nextValue()
      continue
    }
    if (arg === '--worker-handoff') {
      options.correctionWorkerHandoffPath = nextValue()
      continue
    }
    if (arg === '--corrected-evidence') {
      options.correctedEvidenceDir = nextValue()
      continue
    }
    if (arg === '--validation-preset') {
      options.validationPreset = nextValue()
      continue
    }
    if (arg === '--validation-commands') {
      options.validationCommandsRaw = nextValue()
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
  if (!options.correctionWorkerHandoffPath) {
    throw new Error('--worker-handoff es obligatorio')
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
    return JSON.parse(text.replace(/^\uFEFF/u, ''))
  } catch (error) {
    throw new Error(`No se pudo parsear ${label} como JSON: ${error.message}`)
  }
}

function readValidationCommands(raw) {
  const parsed = readJsonMaybeFile(raw, '--validation-commands')
  if (!parsed) {
    return []
  }
  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'string')) {
    throw new Error('--validation-commands debe ser un array JSON de strings')
  }
  return parsed
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  validateSafeArtifactPath(options.outputDir, 'output')
  if (options.correctedEvidenceDir) {
    validateSafeArtifactPath(options.correctedEvidenceDir, 'correctedEvidenceDir')
  }
  const result = runSupervisedWorkerWorkflow({
    caseName: options.caseName,
    correctionWorkerHandoffPath: options.correctionWorkerHandoffPath,
    correctedEvidenceDir: options.correctedEvidenceDir,
    validationPreset: options.validationPreset,
    validationCommands: readValidationCommands(options.validationCommandsRaw),
    outputDir: options.outputDir,
    executeValidation: options.executeValidation,
    failFast: options.failFast,
    timeoutMs: options.timeoutMs,
    metadata: {
      cli: 'orchestrator-supervised-worker-workflow',
    },
  })
  const written = writeSupervisedWorkerWorkflowReport(options.outputDir, result)
  return {
    workflowStatus: written.result.workflowStatus,
    caseName: written.result.caseName,
    nextAction: written.result.nextAction,
    validationTaskStatus: written.result.validationWorker?.taskStatus || '',
    validationPassed: written.result.validationWorker?.validationPassed === true,
    outputDir: written.outputDir,
    reportPath: written.reportPath,
    summaryPath: written.summaryPath,
    result: written.result,
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
      console.log(`${result.workflowStatus}: ${result.nextAction}`)
      console.log(`report: ${result.reportPath}`)
      return
    }
    console.log('Supervised Worker Workflow')
    console.log(`workflowStatus: ${result.workflowStatus}`)
    console.log(`caseName: ${result.caseName}`)
    console.log(`validationTaskStatus: ${result.validationTaskStatus}`)
    console.log(`validationPassed: ${result.validationPassed}`)
    console.log(`nextAction: ${result.nextAction}`)
    console.log(`output: ${result.reportPath}`)
  } catch (error) {
    console.error(`[supervised-worker-workflow] ${error.message}`)
    process.exit(1)
  }
}

main()
