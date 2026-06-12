import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  runSupervisedCorrectionWorkflow,
  writeSupervisedCorrectionWorkflowReport,
  validateSupervisedWorkflowPaths,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-supervised-workflow.cjs'))

const FORBIDDEN_PATH_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])

function printUsage() {
  console.log(`Uso: node scripts/generated-domain-delivery-supervised-workflow.mjs \\
  [--mode <list|prepare-handoff|review-correction|full-supervised>] \\
  [--case <caseName>] \\
  [--roundtrip-root <path>] \\
  [--task-root <path>] \\
  [--evidence-root <path>] \\
  [--corrected-evidence <path>] \\
  --output <path> \\
  [--ledger-root <path>] \\
  [--project-name <name>] \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    mode: 'full-supervised',
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
    if (arg === '--case') {
      options.caseName = nextValue()
      continue
    }
    if (arg === '--roundtrip-root') {
      options.roundtripRoot = nextValue()
      continue
    }
    if (arg === '--task-root') {
      options.taskRoot = nextValue()
      continue
    }
    if (arg === '--evidence-root') {
      options.evidenceRoot = nextValue()
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
    if (arg === '--ledger-root') {
      options.ledgerRoot = nextValue()
      continue
    }
    if (arg === '--project-name') {
      options.projectName = nextValue()
      continue
    }

    throw new Error(`Argumento no soportado: ${arg}`)
  }

  return options
}

function resolveFromRepo(value) {
  return value ? path.resolve(repoRoot, value) : ''
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

function validateCliSafePath(label, value, options = {}) {
  if (!value) {
    if (options.required) {
      throw new Error(`${label} es obligatorio.`)
    }
    return ''
  }
  const resolved = resolveFromRepo(value)
  const safeRoots = [path.join(repoRoot, '.codex-temp'), os.tmpdir()].map((root) =>
    path.resolve(root),
  )
  if (!safeRoots.some((root) => isSubpath(resolved, root))) {
    throw new Error(`${label} inseguro: debe estar dentro de .codex-temp o temp seguro: ${resolved}`)
  }
  if (resolved === repoRoot) {
    throw new Error(`${label} inseguro: no puede ser la raiz del repo.`)
  }
  for (const segment of pathSegments(resolved)) {
    if (FORBIDDEN_PATH_SEGMENTS.has(segment)) {
      throw new Error(`${label} inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`${label} inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }
  if (options.mustExist && (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory())) {
    throw new Error(`${label} no existe o no es un directorio: ${resolved}`)
  }
  return resolved
}

function summarize(result, written) {
  return {
    workflowStatus: result.workflowStatus,
    caseName: result.caseName || result.selectedCandidate?.caseName || '',
    nextAction: result.nextAction,
    selectedCandidate: result.selectedCandidate?.caseName || '',
    roundtripStatus: result.roundtrip?.roundtripStatus || '',
    ledgerTotalCases: result.ledger?.totalCases || 0,
    reportPath: written.reportPath,
    summaryPath: written.summaryPath,
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (!options.outputDir) {
    throw new Error('--output es obligatorio.')
  }
  validateCliSafePath('output', options.outputDir, { required: true })
  if (options.correctedEvidenceDir) {
    validateCliSafePath('corrected-evidence', options.correctedEvidenceDir, {
      mustExist: options.mode === 'review-correction' || options.mode === 'full-supervised',
    })
  }
  validateSupervisedWorkflowPaths(options)

  const result = runSupervisedCorrectionWorkflow(options)
  const written = writeSupervisedCorrectionWorkflowReport(resolveFromRepo(options.outputDir), result)
  return {
    result,
    written,
    summary: summarize(result, written),
  }
}

function main() {
  try {
    const output = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(output, null, 2))
      return
    }
    if (process.argv.includes('--summary')) {
      console.log(output.result.summary)
      console.log('')
      console.log(`report: ${output.written.reportPath}`)
      return
    }
    console.log('Supervised Delivery Correction Workflow')
    console.log(`workflowStatus: ${output.summary.workflowStatus}`)
    console.log(`caseName: ${output.summary.caseName || '(none)'}`)
    console.log(`nextAction: ${output.summary.nextAction}`)
    console.log(`report: ${output.written.reportPath}`)
  } catch (error) {
    console.error(`[supervised-workflow] ${error.message}`)
    process.exit(1)
  }
}

main()
