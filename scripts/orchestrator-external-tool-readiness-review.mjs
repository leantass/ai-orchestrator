import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildExternalToolReadinessReview,
  writeExternalToolReadinessReview,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-readiness-review.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-readiness-review.mjs \\
  [--planned-handoff <path>] \\
  [--approval-gate <path>] \\
  [--dry-run-plan <path>] \\
  [--supervised-execution <path>] \\
  [--capability <capability>] \\
  [--worker <workerId>] \\
  [--target-project <path-or-name>] \\
  [--human-approval] \\
  --output <path> \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
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
    if (arg === '--capability') {
      options.capability = nextValue()
      continue
    }
    if (arg === '--worker') {
      options.workerId = nextValue()
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
  if (
    !options.plannedHandoffPath &&
    !options.approvalGatePath &&
    !options.dryRunPlanPath &&
    !options.supervisedExecutionPath &&
    !options.capability &&
    !options.workerId
  ) {
    throw new Error('--planned-handoff, --approval-gate, --dry-run-plan, --supervised-execution, --capability o --worker es obligatorio')
  }
  return options
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const outputDir = validateSafeOutputDir(options.outputDir)
  const review = buildExternalToolReadinessReview({
    plannedHandoffPath: options.plannedHandoffPath,
    approvalGatePath: options.approvalGatePath,
    dryRunPlanPath: options.dryRunPlanPath,
    supervisedExecutionPath: options.supervisedExecutionPath,
    workerId: options.workerId,
    capability: options.capability,
    targetProject: options.targetProject,
    humanApproval: options.humanApproval,
  })
  const written = writeExternalToolReadinessReview(outputDir, review)
  return {
    readinessStatus: written.review.readinessStatus,
    workerId: written.review.workerId,
    workerDisplayName: written.review.workerDisplayName,
    capability: written.review.capability,
    toolKind: written.review.toolKind,
    riskLevel: written.review.riskLevel,
    artifactStatus: written.review.artifactStatus,
    nextAction: written.review.nextAction,
    outputDir: written.outputDir,
    reviewPath: written.reviewPath,
    summaryPath: written.summaryPath,
    checklistPath: written.checklistPath,
    missingPath: written.missingPath,
    review: written.review,
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
      console.log(`${result.readinessStatus}: ${result.workerId || 'no worker'} (${result.capability || 'no capability'})`)
      console.log(`readiness review: ${result.reviewPath}`)
      return
    }
    console.log('External Tool Readiness Review')
    console.log(`readinessStatus: ${result.readinessStatus}`)
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability || '(none)'}`)
    console.log(`output: ${result.reviewPath}`)
  } catch (error) {
    console.error(`[external-tool-readiness-review] ${error.message}`)
    process.exit(1)
  }
}

main()
