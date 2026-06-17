import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildExternalToolExecutionPermitBundle,
  writeExternalToolExecutionPermitBundle,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-execution-permit-bundle.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-execution-permit-bundle.mjs \\
  [--planned-handoff <path>] \\
  [--approval-gate <path>] \\
  [--dry-run-plan <path>] \\
  [--supervised-execution <path>] \\
  [--readiness-review <path>] \\
  [--manual-packet <path>] \\
  [--human-approval <path>] \\
  [--worker <workerId>] \\
  [--capability <capability>] \\
  [--target-project <path-or-name>] \\
  --output <path> \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
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
    if (arg === '--planned-handoff') {
      options.plannedHandoffPath = nextValue()
      continue
    }
    if (arg === '--approval-gate') {
      options.approvalGatePath = nextValue()
      continue
    }
    if (arg === '--dry-run-plan') {
      options.dryRunPlanPath = nextValue()
      continue
    }
    if (arg === '--supervised-execution') {
      options.supervisedExecutionPath = nextValue()
      continue
    }
    if (arg === '--readiness-review') {
      options.readinessReviewPath = nextValue()
      continue
    }
    if (arg === '--manual-packet') {
      options.manualExecutionPacketPath = nextValue()
      continue
    }
    if (arg === '--human-approval') {
      options.humanApprovalRecordPath = nextValue()
      continue
    }
    if (arg === '--worker') {
      options.workerId = nextValue()
      continue
    }
    if (arg === '--capability') {
      options.capability = nextValue()
      continue
    }
    if (arg === '--target-project') {
      options.targetProject = nextValue()
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
  return options
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const outputDir = validateSafeOutputDir(options.outputDir)
  const bundle = buildExternalToolExecutionPermitBundle(options)
  const written = writeExternalToolExecutionPermitBundle(outputDir, bundle)
  return {
    permitStatus: written.bundle.permitStatus,
    executionAllowed: written.bundle.executionAllowed,
    automaticExecutionAllowed: written.bundle.automaticExecutionAllowed,
    manualSupervisedExecutionCandidate: written.bundle.manualSupervisedExecutionCandidate,
    workerId: written.bundle.workerId,
    workerDisplayName: written.bundle.workerDisplayName,
    capability: written.bundle.capability,
    toolKind: written.bundle.toolKind,
    artifactStatus: written.bundle.artifactStatus,
    blockedReasons: written.bundle.blockedReasons,
    missingInputs: written.bundle.missingInputs,
    missingOutputs: written.bundle.missingOutputs,
    approvedScopes: written.bundle.approvedScopes,
    nextAction: written.bundle.nextAction,
    outputDir: written.outputDir,
    bundlePath: written.bundlePath,
    summaryPath: written.summaryPath,
    goNoGoPath: written.goNoGoPath,
    preconditionsPath: written.preconditionsPath,
    evidencePath: written.evidencePath,
    bundle: written.bundle,
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
      console.log(`${result.permitStatus}: candidate=${result.manualSupervisedExecutionCandidate ? 'true' : 'false'} executionAllowed=false`)
      console.log(`permit bundle: ${result.bundlePath}`)
      return
    }
    console.log('External Tool Execution Permit Bundle')
    console.log(`permitStatus: ${result.permitStatus}`)
    console.log(`manualSupervisedExecutionCandidate: ${result.manualSupervisedExecutionCandidate ? 'true' : 'false'}`)
    console.log('executionAllowed: false')
    console.log('automaticExecutionAllowed: false')
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability || '(none)'}`)
    console.log(`output: ${result.bundlePath}`)
  } catch (error) {
    console.error(`[external-tool-execution-permit-bundle] ${error.message}`)
    process.exit(1)
  }
}

main()
