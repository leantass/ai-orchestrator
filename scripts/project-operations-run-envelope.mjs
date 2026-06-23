import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildProjectOperationsRunEnvelope,
  loadProjectOperationsRunEnvelope,
  writeProjectOperationsRunEnvelope,
  summarizeProjectOperationsRunEnvelope,
} = require(path.join(repoRoot, 'electron', 'project-operations-run-envelope.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/project-operations-run-envelope.mjs \\
  --mode <build|status> \\
  [--input <path>] \\
  [--envelope <path>] \\
  [--output <path>] \\
  [--json] \\
  [--summary]`)
}

function resolveRepoPath(value) {
  return path.resolve(repoRoot, value || '')
}

function loadInputPayload(inputPath) {
  if (!inputPath) {
    throw new Error('--input es obligatorio')
  }
  const resolved = resolveRepoPath(inputPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input inexistente: ${inputPath}`)
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/u, ''))
}

function parseArgs(argv) {
  const options = {
    mode: 'build',
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
    if (arg === '--input') {
      options.inputPath = nextValue()
      continue
    }
    if (arg === '--envelope') {
      options.envelopePath = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!['build', 'status'].includes(options.mode)) {
    throw new Error(`--mode no soportado: ${options.mode}`)
  }
  if (options.mode === 'build') {
    if (!options.inputPath) {
      throw new Error('--input es obligatorio en mode build')
    }
    if (!options.outputDir) {
      throw new Error('--output es obligatorio en mode build')
    }
  }
  if (options.mode === 'status' && !options.envelopePath && !options.inputPath) {
    throw new Error('mode status requiere --envelope o --input')
  }
  return options
}

function resultFromEnvelope(mode, envelope, extra = {}) {
  return {
    mode,
    workState: envelope.workState,
    reasoningProvider: envelope.routing?.reasoningProvider || 'unknown',
    executionPath: envelope.routing?.executionPath || 'unknown',
    validationStatus: envelope.validation?.status || 'unknown',
    ciStatus: envelope.validation?.ciStatus || 'unknown',
    reviewStatus: envelope.review?.status || 'unknown',
    retryCount: envelope.revisionLoop?.retryCount || 0,
    maxRetries: envelope.revisionLoop?.maxRetries || 0,
    nextAction: envelope.revisionLoop?.nextAction || '',
    summary: summarizeProjectOperationsRunEnvelope(envelope),
    envelope,
    ...extra,
  }
}

function runBuild(options) {
  const payload = loadInputPayload(options.inputPath)
  const envelope = buildProjectOperationsRunEnvelope(payload)
  const written = writeProjectOperationsRunEnvelope(options.outputDir, envelope)
  return resultFromEnvelope('build', written.envelope, {
    outputDir: written.outputDir,
    envelopePath: written.envelopePath,
    summaryPath: written.summaryPath,
  })
}

function runStatus(options) {
  const envelope = options.envelopePath
    ? loadProjectOperationsRunEnvelope(options.envelopePath)
    : buildProjectOperationsRunEnvelope(loadInputPayload(options.inputPath))
  return resultFromEnvelope('status', envelope, {
    envelopePath: options.envelopePath ? resolveRepoPath(options.envelopePath) : '',
  })
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.mode === 'build') {
    return runBuild(options)
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
      console.log(`${result.workState}: ${result.reasoningProvider}/${result.executionPath}`)
      console.log(`nextAction: ${result.nextAction}`)
      console.log(`envelope: ${result.envelopePath || '(not written)'}`)
      return
    }
    console.log('Project Operations Run Envelope')
    console.log(`mode: ${result.mode}`)
    console.log(`state: ${result.workState}`)
    console.log(`reasoningProvider: ${result.reasoningProvider}`)
    console.log(`executionPath: ${result.executionPath}`)
    console.log(`validation: ${result.validationStatus}`)
    console.log(`ciStatus: ${result.ciStatus}`)
    console.log(`review: ${result.reviewStatus}`)
    console.log(`retryBudget: ${result.retryCount}/${result.maxRetries}`)
    console.log(`nextAction: ${result.nextAction}`)
  } catch (error) {
    console.error(`[project-operations-run-envelope] ${error.message}`)
    process.exit(1)
  }
}

main()