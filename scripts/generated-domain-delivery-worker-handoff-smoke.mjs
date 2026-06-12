import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-worker-handoff-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'generated-domain-delivery-worker-handoff.mjs')
const {
  buildDeliveryWorkerHandoff,
  writeDeliveryWorkerHandoff,
  validateDeliveryWorkerHandoff,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-worker-handoff.cjs'))

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

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${value}\n`, 'utf8')
}

function makeTask(caseName, options = {}) {
  return {
    taskStatus: options.taskStatus || 'ready',
    sourceReviewStatus: options.sourceReviewStatus || 'needs_revision',
    title: `Corregir entrega generada para ${caseName}`,
    severity: options.severity || 'major',
    categories: ['completeness'],
    evidenceDir: options.evidenceDir || path.join(smokeRoot, 'evidence', caseName, 'initial'),
    allowedScope: [
      'Leer el reporte de review y la evidencia indicada.',
      'Regenerar evidencia de review local bajo .codex-temp si corresponde.',
    ],
    forbiddenActions: [
      'No tocar web-prueba.',
      'No crear ni modificar .env.',
      'No crear ni modificar node_modules.',
      'No usar git add .',
    ],
    requiredFixes: ['Cubrir conceptos faltantes: reportes simples.'],
    validationCommands: ['node scripts/generated-domain-delivery-review-loop-smoke.mjs'],
    issues: [
      {
        severity: 'major',
        category: 'completeness',
        message: 'Faltan conceptos esperados: reportes simples.',
        evidence: 'reportes simples',
      },
    ],
    correctionBrief: 'Cubrir reportes simples sin tocar fuera de .codex-temp.',
    allowCommit: false,
  }
}

function makeHandoff(caseName, options = {}) {
  const taskDir = path.join(smokeRoot, 'tasks', caseName)
  const taskPath = path.join(taskDir, 'codex-correction-task.json')
  const promptPath = path.join(taskDir, 'codex-correction-prompt.md')
  const task = makeTask(caseName, options)
  const prompt =
    options.prompt ||
    [
      'CODEX CORRECTION TASK',
      '',
      'Corregir reportes simples dentro de la evidencia corregida.',
      'No crear .env.',
      'No usar Docker.',
      'No tocar web-prueba.',
    ].join('\n')
  writeJson(taskPath, task)
  writeText(promptPath, prompt)
  return {
    handoffStatus: options.handoffStatus || 'ready',
    caseName,
    sourceEvidenceDir: task.evidenceDir,
    correctedEvidenceDir:
      options.correctedEvidenceDir || path.join(smokeRoot, 'evidence', caseName, 'corrected'),
    taskPath,
    promptPath,
    codexPrompt: prompt,
    roundtripCommand: `node scripts/generated-domain-delivery-roundtrip-runner.mjs --initial-evidence "${task.evidenceDir}" --corrected-evidence "${path.join(smokeRoot, 'evidence', caseName, 'corrected')}" --output "${path.join(smokeRoot, 'roundtrip', caseName)}"`,
    restrictions: ['solo .codex-temp', 'sin cambios versionados'],
    forbiddenActions: ['No tocar web-prueba.', 'No crear ni modificar .env.'],
    expectedArtifacts: ['request.json', 'generated-files.json', 'validation/report.json'],
    validationCommands: ['git diff --check', 'git status --short'],
  }
}

function writeHandoffFixture(caseName, options = {}) {
  const handoff = makeHandoff(caseName, options)
  const dir = path.join(smokeRoot, 'handoffs', caseName)
  const handoffPath = path.join(dir, 'codex-correction-handoff.json')
  const promptPath = path.join(dir, 'codex-correction-handoff-prompt.md')
  writeJson(handoffPath, handoff)
  writeText(promptPath, handoff.codexPrompt)
  return {
    handoff,
    handoffPath,
    promptPath,
    taskPath: handoff.taskPath,
  }
}

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
  })
}

function runJson(args) {
  const result = runCli([...args, '--json'])
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return JSON.parse(result.stdout)
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

runCase('Ready desde handoff v0.6', () => {
  const { handoff } = writeHandoffFixture('ready-handoff')
  const task = makeTask('ready-handoff')
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'ready-handoff',
    correctionTask: task,
    correctionPrompt: handoff.codexPrompt,
    handoff,
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'ready')
  assert.equal(workerHandoff.workerId, 'codex-manual-correction')
  assert.match(workerHandoff.finalPrompt, /No tocar web-prueba/)
  assert.match(workerHandoff.finalPrompt, /Codex Manual Correction Worker/i)
  assert.equal(validateDeliveryWorkerHandoff(workerHandoff).valid, true)
})

runCase('Ready desde task prompt', () => {
  const task = makeTask('ready-task')
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'ready-task',
    correctionTask: task,
    correctionPrompt: 'Cubrir reportes simples. No crear .env. No usar Docker.',
    correctedEvidenceDir: path.join(smokeRoot, 'evidence', 'ready-task', 'corrected'),
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'ready')
})

runCase('No action needed no genera prompt agresivo', () => {
  const task = makeTask('no-action', { taskStatus: 'no_action_needed' })
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'no-action',
    correctionTask: task,
    correctionPrompt: 'No action needed.',
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'no_action_needed')
  assert.match(workerHandoff.finalPrompt, /NO ACTION NEEDED/)
})

runCase('Blocked original', () => {
  const task = makeTask('blocked-original', { taskStatus: 'blocked_requires_human' })
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'blocked-original',
    correctionTask: task,
    correctionPrompt: 'Diagnosticar bloqueo.',
    correctedEvidenceDir: path.join(smokeRoot, 'evidence', 'blocked-original', 'corrected'),
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'blocked')
})

runCase('Prompt peligroso bloquea', () => {
  const task = makeTask('dangerous')
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'dangerous',
    correctionTask: task,
    correctionPrompt: 'Crear .env e instalar dependencias para hacer deploy.',
    correctedEvidenceDir: path.join(smokeRoot, 'evidence', 'dangerous', 'corrected'),
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'blocked')
  assert.match(workerHandoff.finalPrompt, /SECURITY DIAGNOSTIC/)
})

runCase('Prompt con negacion segura no bloquea', () => {
  const task = makeTask('safe-negation')
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'safe-negation',
    correctionTask: task,
    correctionPrompt: 'Corregir reportes simples. No crear .env. No usar Docker. No tocar web-prueba.',
    correctedEvidenceDir: path.join(smokeRoot, 'evidence', 'safe-negation', 'corrected'),
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'ready')
})

runCase('No matching worker', () => {
  const task = makeTask('no-match')
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'no-match',
    correctionTask: task,
    correctionPrompt: 'Corregir.',
    correctedEvidenceDir: path.join(smokeRoot, 'evidence', 'no-match', 'corrected'),
    capability: 'unknown.capability',
  })
  assert.equal(workerHandoff.workerHandoffStatus, 'no_matching_worker')
})

runCase('Escritura de artefactos', () => {
  const task = makeTask('write-artifacts')
  const workerHandoff = buildDeliveryWorkerHandoff({
    caseName: 'write-artifacts',
    correctionTask: task,
    correctionPrompt: 'Corregir reportes simples. No crear .env.',
    correctedEvidenceDir: path.join(smokeRoot, 'evidence', 'write-artifacts', 'corrected'),
  })
  const written = writeDeliveryWorkerHandoff(path.join(smokeRoot, 'outputs', 'write-artifacts'), workerHandoff)
  assert.ok(fs.existsSync(written.handoffPath))
  assert.ok(fs.existsSync(written.promptPath))
  assert.ok(fs.existsSync(written.envelopePath))
  assert.ok(fs.existsSync(written.readmePath))
})

runCase('CLI JSON mode desde handoff', () => {
  const { handoffPath } = writeHandoffFixture('cli-ready')
  const output = path.join(smokeRoot, 'outputs', 'cli-ready')
  const result = runJson(['--handoff', handoffPath, '--output', output])
  assert.equal(result.workerHandoff.workerHandoffStatus, 'ready')
  assert.equal(result.workerHandoff.workerId, 'codex-manual-correction')
  assert.ok(fs.existsSync(path.join(output, 'worker-handoff.json')))
})

runCase('CLI output inseguro falla', () => {
  const { handoffPath } = writeHandoffFixture('unsafe-output')
  const unsafeOutput = path.join(repoRoot, 'scripts', 'worker-handoff-output')
  const result = runCli(['--handoff', handoffPath, '--output', unsafeOutput])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Output inseguro/)
  assert.equal(fs.existsSync(path.join(unsafeOutput, 'worker-handoff.json')), false)
})

if (process.exitCode) {
  process.exit(process.exitCode)
}
