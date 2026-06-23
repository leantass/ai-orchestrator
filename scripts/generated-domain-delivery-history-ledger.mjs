import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  buildDeliveryHistoryEntry,
  buildDeliveryHistoryLedger,
  discoverDeliveryHistoryCases,
  writeDeliveryHistoryLedger,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-history-ledger.cjs'))

const FORBIDDEN_OUTPUT_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])

function printUsage() {
  console.log(`Uso: node scripts/generated-domain-delivery-history-ledger.mjs \\
  [--root <path>[,<path>]] \\
  [--case <caseName>] \\
  --output <path> \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    roots: [],
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

    if (arg === '--root') {
      options.roots.push(...nextValue().split(',').map((entry) => entry.trim()).filter(Boolean))
      continue
    }
    if (arg === '--case') {
      options.caseName = nextValue()
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
  const resolved = path.resolve(outputDir)
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
}

function defaultRoots() {
  return [
    path.join(repoRoot, '.codex-temp', 'delivery-review-loop-v04'),
    path.join(repoRoot, '.codex-temp', 'delivery-review-loop-v06'),
  ]
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (!options.outputDir) {
    throw new Error('--output es obligatorio.')
  }
  const outputDir = resolveFromRepo(options.outputDir)
  validateSafeOutput(outputDir)

  const roots = (options.roots.length ? options.roots.map(resolveFromRepo) : defaultRoots()).filter(
    (root) => fs.existsSync(root) && fs.statSync(root).isDirectory(),
  )
  const artifacts = discoverDeliveryHistoryCases(roots, {
    caseName: options.caseName,
  })
  const entries = artifacts.map((artifact) =>
    buildDeliveryHistoryEntry({
      ...artifact,
      metadata: {
        source: artifact.metadata?.sourceRoot || '',
      },
    }),
  )
  const ledger = buildDeliveryHistoryLedger(entries, {
    title: 'Delivery Review History Ledger',
  })
  const written = writeDeliveryHistoryLedger(outputDir, ledger)

  return {
    ledger,
    written,
    roots,
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
      console.log(result.ledger.summary)
      console.log('')
      for (const entry of result.ledger.entries) {
        console.log(`- ${entry.caseName}: ${entry.status} -> ${entry.nextAction}`)
      }
      return
    }
    console.log('Delivery History Ledger')
    console.log(`totalCases: ${result.ledger.totalCases}`)
    console.log(`completedPass: ${result.ledger.counts.completedPass}`)
    console.log(`awaitingManualCorrection: ${result.ledger.counts.awaitingManualCorrection}`)
    console.log(`needsMoreRevision: ${result.ledger.counts.needsMoreRevision}`)
    console.log(`blocked: ${result.ledger.counts.blocked}`)
    console.log(`output: ${result.written.ledgerPath}`)
    console.log(`runEnvelope: ${result.written.envelopePath}`)
  } catch (error) {
    console.error(`[history-ledger] ${error.message}`)
    process.exit(1)
  }
}

main()
