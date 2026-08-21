import assert from 'node:assert/strict'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Frontera de compatibilidad: no prueba una generación alternativa.
const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const legacy = require(path.join(repoRoot, 'electron', 'jefe-real-generation.cjs'))
const creation = require(path.join(repoRoot, 'electron', 'jefe-project-creation.cjs'))

assert.equal(typeof legacy.MaterializationError, 'function', 'expone el error canónico de materialización')
assert.equal(typeof legacy.materializeProject, 'function', 'conserva el materializador canónico')
assert.equal(typeof legacy.readMaterializedManifest, 'function', 'conserva la lectura canónica de manifests')
assert.equal(typeof creation.createFirstVersionFromRun, 'function', 'conserva la creación canónica')
assert.equal(Object.hasOwn(legacy, 'resolveGenerationPaths'), false, 'no expone rutas de generación heredada')

const forbiddenFields = ['project', 'version', 'delivery', 'preview', 'deploy', 'command', 'runner', 'pid', 'outputPath']
for (const [name, input] of [
  ['startGenerationFromRun', '../arbitrary-path'],
  ['getGenerationStatus', 'C:\\arbitrary-path'],
  ['readGenerationResult', { path: '../arbitrary-path', command: 'ignored' }],
]) {
  assert.equal(typeof legacy[name], 'function', `${name} conserva compatibilidad de llamada`)
  const result = legacy[name](input, { repoRoot, command: 'ignored' })
  assert.deepEqual(result, {
    ok: false,
    status: 'not_available',
    error: 'La generación heredada fue reemplazada por creación canónica materializada.',
  }, `${name} rechaza honestamente la vía heredada`)
  for (const field of forbiddenFields) assert.equal(Object.hasOwn(result, field), false, `${name} no declara ${field}`)
}

console.log('PASS jefe-real-generation-smoke: frontera heredada not_available')
