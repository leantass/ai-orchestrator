import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildExternalToolSupervisedExecutionRequest,
  buildExternalToolSupervisedExecutionContract,
  buildExternalToolSupervisedExecutionHandoff,
  writeExternalToolSupervisedExecutionHandoff,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-supervised-execution.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-supervised-execution.mjs \\
  [--dry-run-plan <path>] \\
  [--gate <path>] \\
  [--handoff <path>] \\
  [--capability <capability>] \\
  [--worker <workerId>] \\
  [--requested-action <text>] \\
  [--target-project <path-or-name>] \\
  [--target-path <path>]... \\
  [--input <path>]... \\
  [--output-artifact <path>]... \\
  [--human-approval] \\
  --output <path> \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    targetPaths: [],
    inputArtifacts: [],
    outputArtifacts: [],
    humanApproval: false,
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
    if (arg === '--human-approval') {
      options.humanApproval = true
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
    if (arg === '--dry-run-plan') {
      options.dryRunPlanPath = nextValue()
      continue
    }
    if (arg === '--gate') {
      options.approvalGatePath = nextValue()
      continue
    }
    if (arg === '--handoff') {
      options.handoffPath = nextValue()
      continue
    }
    if (arg === '--capability') {
      options.capability = nextValue()
      continue
    }
    if (arg === '--worker') {
      options.workerId = nextValue()
      continue
    }
    if (arg === '--requested-action') {
      options.requestedAction = nextValue()
      continue
    }
    if (arg === '--target-project') {
      options.targetProject = nextValue()
      continue
    }
    if (arg === '--target-path') {
      options.targetPaths.push(nextValue())
      continue
    }
    if (arg === '--input') {
      options.inputArtifacts.push(nextValue())
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
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!options.outputDir) {
    throw new Error('--output es obligatorio')
  }
  if (!options.dryRunPlanPath && !options.approvalGatePath && !options.handoffPath && !options.capability && !options.workerId) {
    throw new Error('--dry-run-plan, --gate, --handoff, --capability o --worker es obligatorio')
  }
  return options
}

function readJsonFile(relativePath) {
  const resolved = path.resolve(repoRoot, relativePath)
  const text = fs.readFileSync(resolved, 'utf8')
  return JSON.parse(text.replace(/^\uFEFF/u, ''))
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const outputDir = validateSafeOutputDir(options.outputDir)
  const handoff = options.handoffPath && fs.existsSync(path.resolve(repoRoot, options.handoffPath))
    ? readJsonFile(options.handoffPath)
    : null
  const request = buildExternalToolSupervisedExecutionRequest({
    dryRunPlanPath: options.dryRunPlanPath,
    approvalGatePath: options.approvalGatePath,
    handoffPath: options.handoffPath || '',
    handoff,
    workerId: options.workerId,
    capability: options.capability,
    requestedAction: options.requestedAction,
    targetProject: options.targetProject,
    targetPaths: options.targetPaths,
    inputArtifacts: options.inputArtifacts,
    outputArtifacts: options.outputArtifacts,
    humanApproval: options.humanApproval,
  })
  const contract = buildExternalToolSupervisedExecutionContract(request)
  const handoffResult = buildExternalToolSupervisedExecutionHandoff(contract)
  const written = writeExternalToolSupervisedExecutionHandoff(outputDir, handoffResult)
  return {
    executionStatus: written.handoff.executionStatus,
    workerId: written.handoff.workerId,
    workerDisplayName: written.handoff.workerDisplayName,
    capability: written.handoff.capability,
    riskLevel: written.handoff.riskLevel,
    executionAllowed: written.handoff.executionAllowed,
    supervisedOnly: written.handoff.supervisedOnly,
    outputDir: written.outputDir,
    handoffPath: written.handoffPath,
    summaryPath: written.summaryPath,
    checklistPath: written.checklistPath,
    evidencePath: written.evidencePath,
    validationPath: written.validationPath,
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
      console.log(`${result.executionStatus}: ${result.workerId || 'no worker'} (${result.capability || 'no capability'})`)
      console.log(`supervised execution handoff: ${result.handoffPath}`)
      return
    }
    console.log('External Tool Supervised Execution')
    console.log(`executionStatus: ${result.executionStatus}`)
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability || '(none)'}`)
    console.log(`executionAllowed: ${result.executionAllowed}`)
    console.log(`output: ${result.handoffPath}`)
  } catch (error) {
    console.error(`[external-tool-supervised-execution] ${error.message}`)
    process.exit(1)
  }
}

main()
