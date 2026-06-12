import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  loadCodexCorrectionHandoff,
  loadCodexCorrectionTask,
  buildDeliveryWorkerHandoff,
  writeDeliveryWorkerHandoff,
  validateDeliveryWorkerHandoff,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-worker-handoff.cjs'))

const FORBIDDEN_OUTPUT_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])

function printUsage() {
  console.log(`Uso: node scripts/generated-domain-delivery-worker-handoff.mjs \\
  [--handoff <path>] \\
  [--task <path>] \\
  [--prompt <path>] \\
  [--case <caseName>] \\
  [--evidence <path>] \\
  [--corrected-evidence <path>] \\
  --output <path> \\
  [--worker <workerId>] \\
  [--capability <capability>] \\
  [--json]`)
}

function parseArgs(argv) {
  const options = {
    workerId: 'codex-manual-correction',
    capability: 'sandbox.delivery.correct',
    json: false,
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
    if (arg === '--task') {
      options.taskPath = nextValue()
      continue
    }
    if (arg === '--prompt') {
      options.promptPath = nextValue()
      continue
    }
    if (arg === '--case') {
      options.caseName = nextValue()
      continue
    }
    if (arg === '--evidence') {
      options.evidenceDir = nextValue()
      continue
    }
    if (arg === '--corrected-evidence') {
      options.correctedEvidenceDir = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
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
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  return options
}

function resolveFromRepo(value) {
  if (!value) {
    return ''
  }
  return path.resolve(repoRoot, value)
}

function isSubpath(candidate, parent) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function pathSegments(filePath) {
  return path
    .resolve(filePath)
    .split(path.sep)
    .map((segment) => segment.toLowerCase())
    .filter(Boolean)
}

function validateSafeOutput(outputDir) {
  const resolved = resolveFromRepo(outputDir)
  const safeRoots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) =>
    path.resolve(root),
  )
  if (!safeRoots.some((root) => isSubpath(resolved, root))) {
    throw new Error(`Output inseguro: debe estar dentro de .codex-temp o temp seguro: ${resolved}`)
  }
  if (resolved === repoRoot) {
    throw new Error('Output inseguro: no puede ser la raiz del repo.')
  }
  for (const segment of pathSegments(resolved)) {
    if (FORBIDDEN_OUTPUT_SEGMENTS.has(segment)) {
      throw new Error(`Output inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`Output inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }
  return resolved
}

function readTextIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function requireExistingFile(label, filePath) {
  if (!filePath) {
    return ''
  }
  const resolved = resolveFromRepo(filePath)
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`${label} no existe o no es archivo: ${resolved}`)
  }
  return resolved
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (!options.outputDir) {
    throw new Error('--output es obligatorio.')
  }
  const outputDir = validateSafeOutput(options.outputDir)

  const handoffPath = requireExistingFile('handoff', options.handoffPath)
  const cliTaskPath = requireExistingFile('task', options.taskPath)
  const cliPromptPath = requireExistingFile('prompt', options.promptPath)
  const handoffLoad = handoffPath
    ? loadCodexCorrectionHandoff(handoffPath)
    : { handoff: null, prompt: '', path: '', promptPath: '' }
  const taskPath = cliTaskPath || handoffLoad.handoff?.taskPath || ''
  const taskLoad = taskPath
    ? loadCodexCorrectionTask(taskPath)
    : { task: null, prompt: '', path: '', promptPath: '' }
  const promptPath = cliPromptPath || handoffLoad.handoff?.promptPath || taskLoad.promptPath || ''
  const correctionPrompt =
    readTextIfExists(promptPath) ||
    handoffLoad.prompt ||
    taskLoad.prompt ||
    taskLoad.task?.prompt ||
    ''

  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: options.caseName,
    correctionTask: taskLoad.task,
    correctionPrompt,
    handoff: handoffLoad.handoff,
    evidenceDir: options.evidenceDir ? resolveFromRepo(options.evidenceDir) : '',
    correctedEvidenceDir: options.correctedEvidenceDir
      ? resolveFromRepo(options.correctedEvidenceDir)
      : '',
    capability: options.capability,
    workerId: options.workerId,
    handoffPath,
    taskPath,
    promptPath,
  })
  const validation = validateDeliveryWorkerHandoff(workerHandoff)
  if (!validation.valid) {
    workerHandoff.workerHandoffStatus =
      workerHandoff.workerHandoffStatus === 'ready' ? 'blocked' : workerHandoff.workerHandoffStatus
    workerHandoff.metadata = {
      ...workerHandoff.metadata,
      validationIssues: validation.issues,
    }
  }
  const written = writeDeliveryWorkerHandoff(outputDir, workerHandoff)
  return {
    workerHandoff,
    written,
  }
}

function main() {
  try {
    const result = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    console.log('Delivery Worker Handoff')
    console.log(`workerHandoffStatus: ${result.workerHandoff.workerHandoffStatus}`)
    console.log(`worker: ${result.workerHandoff.workerId}`)
    console.log(`caseName: ${result.workerHandoff.caseName || '(none)'}`)
    console.log(`output: ${result.written.handoffPath}`)
  } catch (error) {
    console.error(`[delivery-worker-handoff] ${error.message}`)
    process.exit(1)
  }
}

main()
