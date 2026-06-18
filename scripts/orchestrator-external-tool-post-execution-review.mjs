import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  loadExternalToolPostExecutionReview,
  buildExternalToolPostExecutionReview,
  writeExternalToolPostExecutionReview,
  summarizeExternalToolPostExecutionReview,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-post-execution-review.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-post-execution-review.mjs \\
  --mode <review|status> \\
  [--session <path>] \\
  [--intake <path>] \\
  [--review <path>] \\
  [--reviewer <name>] \\
  [--role <role>] \\
  [--notes <text>] \\
  [--output <path>] \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    mode: 'review',
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
    if (arg === '--mode') {
      options.mode = nextValue()
      continue
    }
    if (arg === '--session') {
      options.sessionPath = nextValue()
      continue
    }
    if (arg === '--intake') {
      options.intakePath = nextValue()
      continue
    }
    if (arg === '--review') {
      options.reviewPath = nextValue()
      continue
    }
    if (arg === '--reviewer') {
      options.reviewerName = nextValue()
      continue
    }
    if (arg === '--role') {
      options.reviewerRole = nextValue()
      continue
    }
    if (arg === '--notes') {
      options.notes = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!['review', 'status'].includes(options.mode)) {
    throw new Error(`--mode no soportado: ${options.mode}`)
  }
  if (options.mode === 'review') {
    if (!options.sessionPath) {
      throw new Error('--session es obligatorio en mode review')
    }
    if (!options.intakePath) {
      throw new Error('--intake es obligatorio en mode review')
    }
    if (!options.outputDir) {
      throw new Error('--output es obligatorio en mode review')
    }
  }
  if (options.mode === 'status' && !options.reviewPath && (!options.sessionPath || !options.intakePath)) {
    throw new Error('mode status requiere --review o el par --session/--intake')
  }
  return options
}

function runReview(options) {
  const outputDir = validateSafeOutputDir(options.outputDir)
  const review = buildExternalToolPostExecutionReview({
    sessionPath: options.sessionPath,
    intakePath: options.intakePath,
    reviewerName: options.reviewerName,
    reviewerRole: options.reviewerRole,
    notes: options.notes,
  })
  const written = writeExternalToolPostExecutionReview(outputDir, review)
  return {
    mode: 'review',
    reviewStatus: written.review.reviewStatus,
    executionAllowed: written.review.executionAllowed,
    automaticExecutionAllowed: written.review.automaticExecutionAllowed,
    externalToolExecutedByJefe: written.review.externalToolExecutedByJefe,
    evidenceStatus: written.review.evidenceStatus,
    nextAction: written.review.nextAction,
    outputDir: written.outputDir,
    reviewPath: written.reviewPath,
    review: written.review,
  }
}

function runStatus(options) {
  const review = options.reviewPath
    ? loadExternalToolPostExecutionReview(options.reviewPath)
    : buildExternalToolPostExecutionReview({
      sessionPath: options.sessionPath,
      intakePath: options.intakePath,
      reviewerName: options.reviewerName,
      reviewerRole: options.reviewerRole,
      notes: options.notes,
    })

  return {
    mode: 'status',
    reviewStatus: review.reviewStatus,
    executionAllowed: review.executionAllowed,
    automaticExecutionAllowed: review.automaticExecutionAllowed,
    externalToolExecutedByJefe: review.externalToolExecutedByJefe,
    evidenceStatus: review.evidenceStatus,
    nextAction: review.nextAction,
    summary: summarizeExternalToolPostExecutionReview(review),
    review,
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.mode === 'review') {
    return runReview(options)
  }
  return runStatus(options)
}

function main() {
  try {
    const result = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    if (process.argv.includes('--summary')) {
      console.log(`${result.reviewStatus}: evidence=${result.evidenceStatus} externalToolExecutedByJefe=false`)
      console.log(`review: ${result.reviewPath || '(not written)'}`)
      return
    }
    console.log('External Tool Post-Execution Review')
    console.log(`mode: ${result.mode}`)
    console.log(`status: ${result.reviewStatus}`)
    console.log(`evidenceStatus: ${result.evidenceStatus}`)
    console.log('executionAllowed: false')
    console.log('automaticExecutionAllowed: false')
    console.log('externalToolExecutedByJefe: false')
    console.log(`nextAction: ${result.nextAction}`)
  } catch (error) {
    console.error(`[post-execution-review] ${error.message}`)
    process.exit(1)
  }
}

main()