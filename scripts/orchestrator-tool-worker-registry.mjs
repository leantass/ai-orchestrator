import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  getDefaultToolWorkerRegistry,
  listToolWorkers,
  findToolWorkersForCapability,
  buildWorkerTaskEnvelope,
  writeWorkerTaskEnvelope,
} = require(path.join(repoRoot, 'electron', 'orchestrator-tool-worker-registry.cjs'))

const FORBIDDEN_OUTPUT_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-tool-worker-registry.mjs \\
  [--list] \\
  [--capability <capability>] \\
  [--task <json|path>] \\
  [--output <path>] \\
  [--json]`)
}

function parseArgs(argv) {
  const options = {
    list: false,
    json: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--list') {
      options.list = true
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
    if (arg === '--capability') {
      options.capability = nextValue()
      continue
    }
    if (arg === '--task') {
      options.task = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  return options
}

function resolveFromRepo(value) {
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

function readTask(value) {
  if (!value) {
    return null
  }
  const potentialPath = path.resolve(repoRoot, value)
  const text = fs.existsSync(potentialPath)
    ? fs.readFileSync(potentialPath, 'utf8')
    : value
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`No se pudo parsear --task como JSON: ${error.message}`)
  }
}

function summarizeWorker(worker) {
  return {
    id: worker.id,
    displayName: worker.displayName,
    kind: worker.kind,
    executionMode: worker.executionMode,
    status: worker.status,
    riskLevel: worker.riskLevel,
    capabilities: worker.capabilities,
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const registry = getDefaultToolWorkerRegistry()

  if (options.task) {
    const task = readTask(options.task)
    const envelope = buildWorkerTaskEnvelope(null, task, { registry })
    let written = null
    if (options.outputDir) {
      const outputDir = validateSafeOutput(options.outputDir)
      written = writeWorkerTaskEnvelope(outputDir, envelope)
    }
    return {
      action: 'task-envelope',
      envelope,
      written,
    }
  }

  if (options.capability) {
    const workers = findToolWorkersForCapability(registry, options.capability)
    return {
      action: 'capability',
      capability: options.capability,
      workers: workers.map(summarizeWorker),
    }
  }

  if (options.list || !options.capability) {
    return {
      action: 'list',
      workers: listToolWorkers(registry).map(summarizeWorker),
    }
  }

  return {
    action: 'noop',
  }
}

function main() {
  try {
    const result = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    if (result.action === 'task-envelope') {
      console.log(`envelopeStatus: ${result.envelope.envelopeStatus}`)
      console.log(`worker: ${result.envelope.workerId || '(none)'}`)
      if (result.written) {
        console.log(`output: ${result.written.envelopePath}`)
      }
      return
    }
    if (result.action === 'capability') {
      console.log(`Capability: ${result.capability}`)
      for (const worker of result.workers) {
        console.log(`- ${worker.id} [${worker.status}/${worker.executionMode}]`)
      }
      return
    }
    console.log('Tool workers')
    for (const worker of result.workers) {
      console.log(`- ${worker.id} [${worker.kind}/${worker.status}]`)
    }
  } catch (error) {
    console.error(`[tool-worker-registry] ${error.message}`)
    process.exit(1)
  }
}

main()
