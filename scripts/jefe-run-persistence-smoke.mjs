import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const {
  createDryRun,
  updateDryRunStatus,
  readDryRun,
  listDryRuns,
  resolveRunPaths,
} = require('../electron/jefe-run-persistence.cjs')

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function assertFileExists(filePath, label) {
  const stat = await fs.stat(filePath)
  assert(stat.isFile(), `${label} no es un archivo`)
  assert(stat.size > 0, `${label} esta vacio`)
  return stat.size
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

const runId = `smoke-jefe-run-${Date.now()}`
const createResponse = await createDryRun(
  {
    runId,
    title: 'Smoke JEFE dry-run persistence',
    brief:
      'Crear un sistema de prueba para validar persistencia segura de runs sin ejecutar generacion pesada.',
    runType: 'dry-run',
    createdAt: new Date().toISOString(),
    status: 'running',
    currentStep: 'Leyendo brief',
    validation: 'Smoke en curso',
    steps: [
      { label: 'Leyendo brief', status: 'completed' },
      { label: 'Detectando tipo de sistema', status: 'in-progress' },
      { label: 'Definiendo modulos', status: 'pending' },
    ],
    expectedArtifacts: [
      'run.json',
      'brief.md',
      'status.json',
      'logs/events.log',
      'reports/RUN_SUMMARY.md',
    ],
    warnings: ['Smoke local: no ejecuta generacion pesada.'],
    path: 'C:/outside/ignored',
  },
  { repoRoot: repoRoot },
)

assert(createResponse.ok, createResponse.error || 'createDryRun fallo')

const paths = resolveRunPaths(runId, { repoRoot: repoRoot })
const codexTempRoot = path.resolve(repoRoot, '.codex-temp')
assert(paths.runPath.startsWith(codexTempRoot + path.sep), 'run fuera de .codex-temp')

const sizes = {
  runJson: await assertFileExists(paths.runJsonPath, 'run.json'),
  brief: await assertFileExists(paths.briefPath, 'brief.md'),
  status: await assertFileExists(paths.statusPath, 'status.json'),
  eventsLog: await assertFileExists(paths.eventsPath, 'logs/events.log'),
  summary: await assertFileExists(paths.summaryPath, 'reports/RUN_SUMMARY.md'),
}

const runJson = await readJson(paths.runJsonPath)
const statusJson = await readJson(paths.statusPath)
assert(runJson.runId === runId, 'run.json no conserva runId')
assert(runJson.paths.run.startsWith('.codex-temp/'), 'run.json expone ruta fuera del contrato')
assert(statusJson.runId === runId, 'status.json no conserva runId')

const updateResponse = await updateDryRunStatus(
  runId,
  {
    status: 'completed',
    currentStep: 'Preparando entrega',
    validation: 'Smoke PASS',
    steps: [
      { label: 'Leyendo brief', status: 'completed' },
      { label: 'Detectando tipo de sistema', status: 'completed' },
      { label: 'Definiendo modulos', status: 'completed' },
      { label: 'Generando proyecto', status: 'completed' },
      { label: 'Validando', status: 'completed' },
      { label: 'Preparando entrega', status: 'completed' },
    ],
    warnings: ['Smoke completado sin scripts externos.'],
    completedAt: new Date().toISOString(),
  },
  { repoRoot: repoRoot },
)
assert(updateResponse.ok, updateResponse.error || 'updateDryRunStatus fallo')

const readResponse = await readDryRun(runId, { repoRoot: repoRoot })
assert(readResponse.ok, readResponse.error || 'readDryRun fallo')
assert(readResponse.status.status === 'completed', 'readDryRun no refleja status actualizado')
assert(readResponse.summary.includes('No se ejecuto generacion pesada'), 'summary no declara alcance')

const listResponse = await listDryRuns({ repoRoot: repoRoot })
assert(listResponse.ok, listResponse.error || 'listDryRuns fallo')
assert(
  listResponse.runs.some((run) => run.runId === runId),
  'listDryRuns no incluye el run creado',
)

const traversalResponse = await createDryRun(
  {
    runId: '../bad-run',
    title: 'Traversal',
    brief: 'Intento invalido',
    runType: 'dry-run',
    createdAt: new Date().toISOString(),
    steps: [],
    expectedArtifacts: [],
    warnings: [],
  },
  { repoRoot: repoRoot },
)
assert(!traversalResponse.ok, 'runId con path traversal fue aceptado')
assert(!String(traversalResponse.error).includes(repoRoot), 'error expone ruta local')

console.log(
  JSON.stringify(
    {
      ok: true,
      runId,
      runPath: path.relative(repoRoot, paths.runPath).replace(/\\/g, '/'),
      files: sizes,
      checks: 12,
    },
    null,
    2,
  ),
)
