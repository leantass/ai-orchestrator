import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildExternalToolApprovalGate,
  writeExternalToolApprovalGate,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-approval-gates.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-approval-gates.mjs \\
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
  if (!options.handoffPath && !options.capability && !options.workerId) {
    throw new Error('--handoff, --capability o --worker es obligatorio')
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
  const handoff = options.handoffPath ? readJsonFile(options.handoffPath) : null
  const outputDir = validateSafeOutputDir(options.outputDir)
  const gate = buildExternalToolApprovalGate({
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
  const written = writeExternalToolApprovalGate(outputDir, gate)
  return {
    gateStatus: written.gate.gateStatus,
    workerId: written.gate.workerId,
    workerDisplayName: written.gate.workerDisplayName,
    capability: written.gate.capability,
    riskLevel: written.gate.riskLevel,
    outputDir: written.outputDir,
    gatePath: written.gatePath,
    summaryPath: written.summaryPath,
    checklistPath: written.checklistPath,
    gate: written.gate,
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
      console.log(`${result.gateStatus}: ${result.workerId || 'no worker'} (${result.capability})`)
      console.log(`approval gate: ${result.gatePath}`)
      return
    }
    console.log('External Tool Approval Gate')
    console.log(`gateStatus: ${result.gateStatus}`)
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability}`)
    console.log(`output: ${result.gatePath}`)
  } catch (error) {
    console.error(`[external-tool-approval-gates] ${error.message}`)
    process.exit(1)
  }
}

main()
