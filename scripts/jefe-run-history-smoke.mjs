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

const stamp = Date.now()
const olderRunId = `history-smoke-old-${stamp}`
const newestRunId = `history-smoke-new-${stamp}`
const basePayload = {
  title: 'Historial JEFE smoke',
  brief:
    'Crear un sistema de prueba para validar listado y lectura de runs persistidos desde la UI.',
  runType: 'dry-run',
  status: 'running',
  currentStep: 'Leyendo brief',
  validation: 'Smoke en curso',
  steps: [
    { label: 'Leyendo brief', status: 'completed' },
    { label: 'Detectando tipo de sistema', status: 'completed' },
    { label: 'Definiendo modulos', status: 'in-progress' },
  ],
  expectedArtifacts: [
    'run.json',
    'brief.md',
    'status.json',
    'logs/events.log',
    'reports/RUN_SUMMARY.md',
  ],
  warnings: ['Smoke local: no ejecuta generacion pesada.'],
}

const olderCreate = await createDryRun(
  {
    ...basePayload,
    runId: olderRunId,
    createdAt: new Date(stamp - 10000).toISOString(),
  },
  { repoRoot },
)
assert(olderCreate.ok, olderCreate.error || 'No se pudo crear olderRun')

const newestCreate = await createDryRun(
  {
    ...basePayload,
    runId: newestRunId,
    title: 'Historial JEFE smoke reciente',
    createdAt: new Date(stamp).toISOString(),
  },
  { repoRoot },
)
assert(newestCreate.ok, newestCreate.error || 'No se pudo crear newestRun')

const updateResponse = await updateDryRunStatus(
  newestRunId,
  {
    status: 'completed',
    currentStep: 'Preparando entrega',
    validation: 'History smoke PASS',
    steps: [
      { label: 'Leyendo brief', status: 'completed' },
      { label: 'Detectando tipo de sistema', status: 'completed' },
      { label: 'Definiendo modulos', status: 'completed' },
      { label: 'Generando proyecto', status: 'completed' },
      { label: 'Validando', status: 'completed' },
      { label: 'Preparando entrega', status: 'completed' },
    ],
    warnings: ['Smoke de historial completado sin scripts externos.'],
    completedAt: new Date(stamp + 1000).toISOString(),
  },
  { repoRoot },
)
assert(updateResponse.ok, updateResponse.error || 'No se pudo actualizar newestRun')

const paths = resolveRunPaths(newestRunId, { repoRoot })
const sizes = {
  runJson: await assertFileExists(paths.runJsonPath, 'run.json'),
  brief: await assertFileExists(paths.briefPath, 'brief.md'),
  status: await assertFileExists(paths.statusPath, 'status.json'),
  eventsLog: await assertFileExists(paths.eventsPath, 'events.log'),
  summary: await assertFileExists(paths.summaryPath, 'RUN_SUMMARY.md'),
}

const listResponse = await listDryRuns({ repoRoot })
assert(listResponse.ok, listResponse.error || 'No se pudo listar runs')
const newestIndex = listResponse.runs.findIndex((run) => run.runId === newestRunId)
const olderIndex = listResponse.runs.findIndex((run) => run.runId === olderRunId)
assert(newestIndex >= 0, 'El run reciente no aparece en la lista')
assert(olderIndex >= 0, 'El run anterior no aparece en la lista')
assert(newestIndex < olderIndex, 'La lista no queda ordenada por fecha descendente')
assert(listResponse.runs[newestIndex].validation === 'History smoke PASS', 'La lista no expone validation')
assert(listResponse.runs[newestIndex].persisted === true, 'La lista no marca persisted')

const readResponse = await readDryRun(newestRunId, { repoRoot })
assert(readResponse.ok, readResponse.error || 'No se pudo leer el run reciente')
assert(readResponse.brief.includes('Crear un sistema de prueba'), 'readDryRun no devuelve brief.md')
assert(readResponse.eventsLog.includes('status updated'), 'readDryRun no devuelve events.log actualizado')
assert(readResponse.summary.includes('No se ejecuto generacion pesada'), 'readDryRun no devuelve summary valido')
assert(readResponse.artifacts.summary.endsWith('RUN_SUMMARY.md'), 'readDryRun no devuelve artefactos')

const invalidRead = await readDryRun('../bad-run', { repoRoot })
assert(!invalidRead.ok, 'readDryRun acepto path traversal')
assert(!String(invalidRead.error).includes(repoRoot), 'El error expone ruta local')

const invalidCreate = await createDryRun(
  {
    ...basePayload,
    runId: '..\\bad-run',
    createdAt: new Date().toISOString(),
  },
  { repoRoot },
)
assert(!invalidCreate.ok, 'createDryRun acepto runId invalido')

const runPath = path.relative(repoRoot, paths.runPath).replace(/\\/g, '/')
assert(runPath.startsWith('.codex-temp/'), 'El run no queda dentro de .codex-temp')

console.log(
  JSON.stringify(
    {
      ok: true,
      newestRunId,
      olderRunId,
      runPath,
      files: sizes,
      checks: 12,
    },
    null,
    2,
  ),
)
