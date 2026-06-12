import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  runDeliveryReviewRoundtrip,
  writeDeliveryRoundtripReport,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-roundtrip.cjs'))

const FORBIDDEN_OUTPUT_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])

function printUsage() {
  console.log(`Uso: node scripts/generated-domain-delivery-roundtrip-runner.mjs \\
  --initial-evidence <path> \\
  --output <path> \\
  [--corrected-evidence <path>] \\
  [--project-name <name>] \\
  [--expected-domain <domain>] \\
  [--mode <dry-run|manual-roundtrip>] \\
  [--json]`)
}

function parseArgs(argv) {
  const options = {
    mode: 'manual-roundtrip',
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

    if (arg === '--initial-evidence') {
      options.initialEvidenceDir = nextValue()
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

    if (arg === '--project-name') {
      options.projectName = nextValue()
      continue
    }

    if (arg === '--expected-domain') {
      options.expectedDomain = nextValue()
      continue
    }

    if (arg === '--mode') {
      options.mode = nextValue()
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

function validateExistingDirectory(label, dirPath) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`${label} no existe o no es un directorio: ${dirPath}`)
  }
}

function validateOutputDirectory(outputDir) {
  const resolved = path.resolve(outputDir)
  const safeRoots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) =>
    path.resolve(root),
  )
  const insideSafeRoot = safeRoots.some((root) => isSubpath(resolved, root))

  if (!insideSafeRoot) {
    throw new Error(`Output inseguro: debe estar dentro de .codex-temp o temp seguro: ${resolved}`)
  }

  const segments = pathSegments(resolved)
  const repoRelative = path.relative(repoRoot, resolved)

  if (path.resolve(resolved) === repoRoot || repoRelative === '') {
    throw new Error('Output inseguro: no puede ser la raiz del repo.')
  }

  for (const segment of segments) {
    if (FORBIDDEN_OUTPUT_SEGMENTS.has(segment)) {
      throw new Error(`Output inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`Output inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }
}

function statusNextStep(status) {
  if (status === 'no_action_needed') {
    return 'La entrega ya pasa el review; no hace falta correccion.'
  }
  if (status === 'awaiting_manual_correction') {
    return 'Usar la correction task generada, corregir manualmente en sandbox y volver a correr con --corrected-evidence.'
  }
  if (status === 'completed_pass') {
    return 'Roundtrip completado; conservar la evidencia corregida y el reporte.'
  }
  if (status === 'needs_more_revision') {
    return 'Revisar remainingIssues y preparar otra correccion manual acotada.'
  }
  if (status === 'blocked_requires_human') {
    return 'Detenerse y revisar el bloqueo con aprobacion humana.'
  }
  return 'Revisar el reporte generado para decidir el siguiente paso.'
}

function summarize(result, outputDir) {
  return {
    roundtripStatus: result.roundtripStatus,
    initialReviewStatus: result.initialReviewStatus,
    correctionTaskStatus: result.correctionTaskStatus,
    followupReviewStatus: result.followupReviewStatus,
    outputDir,
    nextStep: statusNextStep(result.roundtripStatus),
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)

  if (!options.initialEvidenceDir) {
    throw new Error('--initial-evidence es obligatorio.')
  }
  if (!options.outputDir) {
    throw new Error('--output es obligatorio.')
  }
  if (options.mode !== 'dry-run' && options.mode !== 'manual-roundtrip') {
    throw new Error(`--mode no soportado: ${options.mode}`)
  }

  const initialEvidenceDir = resolveFromRepo(options.initialEvidenceDir)
  const correctedEvidenceDir = options.correctedEvidenceDir
    ? resolveFromRepo(options.correctedEvidenceDir)
    : ''
  const outputDir = resolveFromRepo(options.outputDir)

  validateExistingDirectory('initial-evidence', initialEvidenceDir)
  if (correctedEvidenceDir) {
    validateExistingDirectory('corrected-evidence', correctedEvidenceDir)
  }
  validateOutputDirectory(outputDir)

  const result = runDeliveryReviewRoundtrip({
    initialEvidenceDir,
    correctedEvidenceDir,
    outputDir,
    projectName: options.projectName,
    expectedDomain: options.expectedDomain,
    mode: options.mode,
  })
  writeDeliveryRoundtripReport(outputDir, result)

  return summarize(result, outputDir)
}

function main() {
  try {
    const summary = run()
    if (summary.outputDir && process.argv.includes('--json')) {
      console.log(JSON.stringify(summary, null, 2))
      return
    }

    console.log('Delivery Review Roundtrip Runner')
    console.log(`roundtripStatus: ${summary.roundtripStatus}`)
    console.log(`initialReviewStatus: ${summary.initialReviewStatus || '(none)'}`)
    console.log(`correctionTaskStatus: ${summary.correctionTaskStatus || '(none)'}`)
    console.log(`followupReviewStatus: ${summary.followupReviewStatus || '(none)'}`)
    console.log(`outputDir: ${summary.outputDir}`)
    console.log(`nextStep: ${summary.nextStep}`)
  } catch (error) {
    console.error(`[roundtrip-runner] ${error.message}`)
    process.exit(1)
  }
}

main()
