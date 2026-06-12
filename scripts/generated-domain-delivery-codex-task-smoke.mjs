import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  buildCodexCorrectionTask,
  buildCodexCorrectionTaskFromReport,
  writeCodexCorrectionTask,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-codex-task.cjs'))

const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-codex-task-smoke')

function resetSmokeRoot() {
  if (fs.existsSync(smokeRoot)) {
    fs.rmSync(smokeRoot, { recursive: true, force: true })
  }
  fs.mkdirSync(smokeRoot, { recursive: true })
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function baseReview(overrides = {}) {
  return {
    evidenceDir: '.codex-temp/example-evidence',
    status: 'needs_revision',
    scores: {
      domain: 25,
      completeness: 80,
      restrictions: 100,
      sandbox: 100,
      evidence: 100,
    },
    issues: [
      {
        severity: 'major',
        category: 'domain',
        message: 'No aparece el dominio esperado centro barrial de talleres culturales y oficios.',
        evidence: 'zona de prueba segura',
      },
    ],
    missingConcepts: ['centro barrial de talleres culturales y oficios'],
    contaminationFound: [],
    restrictionViolations: [],
    sandboxViolations: [],
    reviewerSummary: 'La entrega requiere revision.',
    correctionBrief:
      'BRIEF DE CORRECCION PARA CODEX\n\nDominio esperado: centro barrial de talleres culturales y oficios.\nCubrir conceptos faltantes y regenerar evidencia.',
    ...overrides,
  }
}

function assertHardRestrictions(prompt) {
  for (const expected of [
    'web-prueba',
    '.env',
    'node_modules',
    'Docker',
    'deploy',
    'servicios externos',
    'pagos reales',
    'DB productiva',
    'credenciales',
    'git add .',
  ]) {
    assert.match(prompt, new RegExp(expected.replace('.', '\\.'), 'i'))
  }
}

function runCase(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

resetSmokeRoot()

runCase('PASS review no action needed', () => {
  const task = buildCodexCorrectionTask(
    baseReview({
      status: 'pass',
      issues: [],
      missingConcepts: [],
      reviewerSummary: 'La entrega cumple dominio, restricciones, sandbox y evidencia minima.',
      correctionBrief: '',
    }),
  )
  assert.equal(task.taskStatus, 'no_action_needed')
  assert.match(task.prompt, /No hay correccion pendiente|no hay accion/i)
  assert.doesNotMatch(task.prompt, /Puedes preparar una correccion segura/i)
})

runCase('NEEDS_REVISION dominio incorrecto ready', () => {
  const task = buildCodexCorrectionTask(baseReview())
  assert.equal(task.taskStatus, 'ready')
  assert.match(task.prompt, /centro barrial de talleres culturales y oficios/i)
  assert.match(task.prompt, /Validaciones que debe ejecutar/i)
  assertHardRestrictions(task.prompt)
})

runCase('NEEDS_REVISION contaminacion ready', () => {
  const task = buildCodexCorrectionTask(
    baseReview({
      issues: [
        {
          severity: 'major',
          category: 'contamination',
          message: 'Aparecen terminos de dominios ajenos: bicicletas.',
          evidence: 'bicicletas',
        },
      ],
      contaminationFound: ['bicicletas'],
      correctionBrief:
        'Quitar contaminacion de bicicletas en vivero comunitario y preservar sandbox/restricciones.',
    }),
  )
  assert.equal(task.taskStatus, 'ready')
  assert.match(task.prompt, /Quitar contaminacion/i)
  assert.match(task.prompt, /sandbox/i)
  assertHardRestrictions(task.prompt)
})

runCase('BLOCKED por .env requiere humano', () => {
  const task = buildCodexCorrectionTask(
    baseReview({
      status: 'blocked',
      issues: [
        {
          severity: 'blocking',
          category: 'restrictions',
          message: 'Hay violaciones de restricciones duras: .env.',
          evidence: '.env',
        },
      ],
      restrictionViolations: ['.env'],
      correctionBrief: 'Diagnosticar violacion .env.',
    }),
  )
  assert.equal(task.taskStatus, 'blocked_requires_human')
  assert.match(task.prompt, /HUMAN APPROVAL REQUIRED|aprobacion humana/i)
  assert.match(task.prompt, /No corrijas archivos/i)
})

runCase('BLOCKED por path fuera de sandbox requiere humano', () => {
  const task = buildCodexCorrectionTask(
    baseReview({
      status: 'blocked',
      issues: [
        {
          severity: 'blocking',
          category: 'sandbox',
          message: 'Hay violaciones de sandbox: ../escape.txt.',
          evidence: '../escape.txt',
        },
      ],
      sandboxViolations: ['../escape.txt'],
      correctionBrief: 'Diagnosticar escritura fuera de sandbox.',
    }),
  )
  assert.equal(task.taskStatus, 'blocked_requires_human')
  assert.match(task.prompt, /fuera del sandbox|sandbox/i)
  assert.match(task.prompt, /No corrijas archivos/i)
})

runCase('Brief peligroso bloquea tarea', () => {
  const task = buildCodexCorrectionTask(
    baseReview({
      correctionBrief:
        'Crear .env, instalar dependencias con npm install y hacer deploy para corregir la entrega.',
    }),
  )
  assert.equal(task.taskStatus, 'blocked_requires_human')
  assert.ok(task.metadata.dangerousActions.length >= 2)
  assert.match(task.prompt, /accion peligrosa|HUMAN APPROVAL REQUIRED/i)
  assert.doesNotMatch(task.prompt, /Puedes preparar una correccion segura/i)
})

runCase('Escritura local de task y prompt', () => {
  const reportPath = path.join(smokeRoot, 'input-report', 'delivery-review-report.json')
  writeJson(reportPath, baseReview())
  const task = buildCodexCorrectionTaskFromReport(reportPath)
  const output = writeCodexCorrectionTask(path.join(smokeRoot, 'output-task'), task)
  assert.ok(fs.existsSync(output.taskPath))
  assert.ok(fs.existsSync(output.promptPath))
  const writtenTask = JSON.parse(fs.readFileSync(output.taskPath, 'utf8'))
  assert.equal(writtenTask.taskStatus, 'ready')
  assert.match(fs.readFileSync(output.promptPath, 'utf8'), /CODEX CORRECTION TASK/)
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('OK. Delivery Codex Correction Task smoke completo.')
