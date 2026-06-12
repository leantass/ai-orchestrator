import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  discoverCorrectionCandidates,
  selectCorrectionCandidate,
  buildCodexCorrectionHandoff,
  writeCodexCorrectionHandoff,
  validateCorrectionHandoff,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-correction-selector.cjs'))

const FORBIDDEN_OUTPUT_SEGMENTS = new Set([
  'web-prueba',
  'src',
  'electron',
  'scripts',
  '.git',
  'node_modules',
])

function printUsage() {
  console.log(`Uso: node scripts/generated-domain-delivery-correction-selector.mjs \\
  [--roundtrip-root <path>] \\
  [--task-root <path>] \\
  [--evidence-root <path>] \\
  [--case <caseName>] \\
  [--output <path>] \\
  [--corrected-evidence <path>] \\
  [--list] \\
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
    if (arg === '--case') {
      options.caseName = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    if (arg === '--corrected-evidence') {
      options.correctedEvidenceDir = nextValue()
      continue
    }

    throw new Error(`Argumento no soportado: ${arg}`)
  }

  return options
}

function resolveFromRepo(value, fallback = '') {
  const selected = value || fallback
  return selected ? path.resolve(repoRoot, selected) : ''
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

function validateSafePath(label, targetPath, { mustExist = false } = {}) {
  const resolved = path.resolve(targetPath)
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
    if (FORBIDDEN_OUTPUT_SEGMENTS.has(segment)) {
      throw new Error(`${label} inseguro: contiene segmento prohibido "${segment}".`)
    }
    if (segment === '.env' || segment === 'dockerfile' || segment.startsWith('docker-compose')) {
      throw new Error(`${label} inseguro: contiene artefacto prohibido "${segment}".`)
    }
  }

  if (mustExist && (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory())) {
    throw new Error(`${label} no existe o no es un directorio: ${resolved}`)
  }
}

function summarizeCandidate(candidate) {
  return {
    id: candidate.id,
    caseName: candidate.caseName,
    roundtripStatus: candidate.roundtripStatus,
    reviewStatus: candidate.reviewStatus,
    taskStatus: candidate.taskStatus,
    severity: candidate.severity,
    categories: candidate.categories,
    issueCount: candidate.issueCount,
    evidenceDir: candidate.evidenceDir,
    taskPath: candidate.taskPath,
    promptPath: candidate.promptPath,
    needsAction:
      candidate.roundtripStatus === 'awaiting_manual_correction' ||
      candidate.roundtripStatus === 'needs_more_revision' ||
      candidate.reviewStatus === 'needs_revision',
  }
}

function printCandidateList(candidates) {
  console.log('Delivery correction candidates')
  if (!candidates.length) {
    console.log('- none')
    return
  }
  for (const candidate of candidates) {
    const mark =
      candidate.roundtripStatus === 'awaiting_manual_correction' ? 'requires-action' : 'observed'
    console.log(
      `- ${candidate.caseName} [${mark}] roundtrip=${candidate.roundtripStatus} task=${candidate.taskStatus} issues=${candidate.issueCount}`,
    )
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const roundtripRoot = resolveFromRepo(
    options.roundtripRoot,
    '.codex-temp/delivery-review-loop-v04',
  )
  const taskRoot = resolveFromRepo(options.taskRoot, '.codex-temp/delivery-review-loop-v03')
  const evidenceRoot = resolveFromRepo(options.evidenceRoot, '.codex-temp')
  const outputDir = resolveFromRepo(options.outputDir)
  const correctedEvidenceDir = resolveFromRepo(options.correctedEvidenceDir)

  if (!fs.existsSync(roundtripRoot) || !fs.statSync(roundtripRoot).isDirectory()) {
    throw new Error(`roundtrip-root no existe o no es directorio: ${roundtripRoot}`)
  }
  validateSafePath('roundtrip-root', roundtripRoot, { mustExist: true })
  if (taskRoot && fs.existsSync(taskRoot)) {
    validateSafePath('task-root', taskRoot, { mustExist: true })
  }
  if (evidenceRoot && fs.existsSync(evidenceRoot)) {
    validateSafePath('evidence-root', evidenceRoot, { mustExist: true })
  }

  const candidates = discoverCorrectionCandidates({
    roundtripRoot,
    taskRoot,
    evidenceRoot,
  })

  if (options.list && !options.caseName) {
    return {
      action: 'list',
      candidates: candidates.map(summarizeCandidate),
    }
  }

  if (!outputDir) {
    throw new Error('--output es obligatorio para generar handoff.')
  }
  validateSafePath('output', outputDir)
  if (correctedEvidenceDir) {
    validateSafePath('corrected-evidence', correctedEvidenceDir)
  }

  const selected = selectCorrectionCandidate(candidates, { caseName: options.caseName })
  const handoff = buildCodexCorrectionHandoff(selected, {
    outputDir,
    correctedEvidenceDir,
  })
  const validation = validateCorrectionHandoff(handoff)
  if (!validation.valid && handoff.handoffStatus === 'ready') {
    throw new Error(`handoff invalido: ${validation.issues.join(', ')}`)
  }
  const written = writeCodexCorrectionHandoff(outputDir, handoff)

  return {
    action: 'handoff',
    selected: summarizeCandidate(selected),
    handoff,
    validation,
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

    if (result.action === 'list') {
      printCandidateList(result.candidates)
      return
    }

    console.log('Delivery Correction Handoff')
    console.log(`caseName: ${result.handoff.caseName}`)
    console.log(`handoffStatus: ${result.handoff.handoffStatus}`)
    console.log(`sourceEvidenceDir: ${result.handoff.sourceEvidenceDir}`)
    console.log(`correctedEvidenceDir: ${result.handoff.correctedEvidenceDir}`)
    console.log(`outputDir: ${result.handoff.handoffOutputDir}`)
    console.log(`roundtripCommand: ${result.handoff.roundtripCommand.replace(/\n/g, ' ')}`)
  } catch (error) {
    console.error(`[correction-selector] ${error.message}`)
    process.exit(1)
  }
}

main()
