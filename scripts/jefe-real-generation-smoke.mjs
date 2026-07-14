import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  createDryRun,
  resolveRunPaths,
} = require(path.join(repoRoot, 'electron', 'jefe-run-persistence.cjs'))
const {
  resolveGenerationPaths,
  startGenerationFromRun,
  getGenerationStatus,
  readGenerationResult,
} = require(path.join(repoRoot, 'electron', 'jefe-real-generation.cjs'))

const successRunId = `realgen-smoke-ok-${Date.now()}`
const failedRunId = `realgen-smoke-fail-${Date.now()}`
const checks = []

function record(name, ok, evidence = '') {
  checks.push({ name, ok, evidence })
  if (!ok) {
    console.error('FAIL', name, evidence)
  }
}

function relativeFromRepo(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/')
}

function assertInsideCodexTemp(absolutePath) {
  const codexTempRoot = path.join(repoRoot, '.codex-temp')
  const resolved = path.resolve(absolutePath)
  assert.equal(
    resolved === codexTempRoot || resolved.startsWith(codexTempRoot + path.sep),
    true,
    `${relativeFromRepo(absolutePath)} debe quedar dentro de .codex-temp`,
  )
}

async function createPersistedRun(runId, brief) {
  const response = await createDryRun({
    runId,
    title: 'Smoke generacion real controlada',
    brief,
    runType: 'dry-run',
    createdAt: new Date().toISOString(),
    status: 'completed',
    currentStep: 'Preparando entrega',
    validation: 'Dry-run listo para generacion real controlada',
    steps: [
      { label: 'Leyendo brief', status: 'completed' },
      { label: 'Detectando tipo de sistema', status: 'completed' },
      { label: 'Definiendo modulos', status: 'completed' },
      { label: 'Generando proyecto', status: 'completed' },
      { label: 'Validando', status: 'completed' },
      { label: 'Preparando entrega', status: 'completed' },
    ],
    expectedArtifacts: ['run.json', 'brief.md', 'status.json'],
    warnings: ['Smoke local sin servicios externos.'],
  }, { repoRoot })

  assert.equal(response.ok, true, response.error)
  return response
}

const supportedBrief = `# Viandas Corporativas B2B smoke

Sistema local de viandas para empresas con empleados, centro de costo, menu diario, pedidos, produccion, etiquetas y reportes.

Debe incluir proveedor, cocina, empresa, empleado activo e inactivo, cancelaciones antes del corte, produccion sin cancelados y reportes.

Restricciones: local only, SQLite real, REST CRUD, backoffice, sin credenciales, sin servicios externos, sin deploy.
`

const unsupportedBrief = `# Sistema simple de turnos

Sistema simple de turnos con clientes, agenda, estados y reportes.
`

await createPersistedRun(successRunId, supportedBrief)
const dryRunPaths = resolveRunPaths(successRunId, { repoRoot })
record('1 crear run persistido', fs.existsSync(dryRunPaths.briefPath), relativeFromRepo(dryRunPaths.briefPath))

const generation = await startGenerationFromRun(successRunId, { repoRoot })
record('2 generacion completada', generation.ok === true && generation.status?.status === 'completed', generation.error || generation.outputPath)

const generationPaths = resolveGenerationPaths(successRunId, { repoRoot })
assertInsideCodexTemp(generationPaths.runPath)
assertInsideCodexTemp(generationPaths.outputPath)
record('3 output bajo codex-temp', fs.existsSync(generationPaths.outputPath), relativeFromRepo(generationPaths.outputPath))
record('4 logs generados', fs.existsSync(generationPaths.generationLogPath), relativeFromRepo(generationPaths.generationLogPath))
record('5 status generado', fs.existsSync(generationPaths.statusPath), relativeFromRepo(generationPaths.statusPath))
record('6 summary generado', fs.existsSync(generationPaths.summaryPath), relativeFromRepo(generationPaths.summaryPath))
record('7 no escribe fuera de codex-temp', true, relativeFromRepo(generationPaths.runPath))

const statusResponse = await getGenerationStatus(successRunId, { repoRoot })
record('8 status legible', statusResponse.ok === true && statusResponse.status?.status === 'completed', statusResponse.error || '')

const resultResponse = await readGenerationResult(successRunId, { repoRoot })
record('9 result legible', resultResponse.ok === true && Boolean(resultResponse.summary), resultResponse.error || '')

const commandLog = fs.readFileSync(generationPaths.generationLogPath, 'utf8')
record(
  '10 entrypoint permitido',
  commandLog.includes('scripts/generated-domain-real-project-from-brief.mjs') &&
    !commandLog.includes('npm install') &&
    !/codex\s+(exec|run|task)/iu.test(commandLog),
  commandLog.split('\n')[0],
)

const invalid = await startGenerationFromRun('../bad', { repoRoot })
record('11 path traversal rechazado', invalid.ok === false && /runId|ruta|segura|path/iu.test(invalid.error || ''), invalid.error)

const outputFiles = fs.readdirSync(generationPaths.outputPath)
record('12 no credenciales', !outputFiles.includes('.env'), outputFiles.join(', '))
record('13 no proyectos externos', !fs.existsSync(path.join(repoRoot, '..', 'tuvianda', '.codex-touch')), 'solo .codex-temp')

await createPersistedRun(failedRunId, unsupportedBrief)
const failed = await startGenerationFromRun(failedRunId, { repoRoot })
const failedPaths = resolveGenerationPaths(failedRunId, { repoRoot })
const failedStatus = JSON.parse(fs.readFileSync(failedPaths.statusPath, 'utf8'))
record('14 falla controlada', failed.ok === false, failed.error)
record('15 status failed', failedStatus.status === 'failed', failedStatus.status)

assert.equal(checks.every((check) => check.ok), true, JSON.stringify(checks.filter((check) => !check.ok), null, 2))

console.log(JSON.stringify({
  ok: true,
  checks: checks.length,
  successRunId,
  failedRunId,
  outputPath: relativeFromRepo(generationPaths.outputPath),
  statusPath: relativeFromRepo(generationPaths.statusPath),
  summaryPath: relativeFromRepo(generationPaths.summaryPath),
}, null, 2))
