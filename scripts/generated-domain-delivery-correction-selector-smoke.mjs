import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-delivery-correction-selector-smoke',
)
const roundtripRoot = path.join(smokeRoot, 'roundtrips')
const taskRoot = path.join(smokeRoot, 'tasks')
const selectorPath = path.join(repoRoot, 'scripts', 'generated-domain-delivery-correction-selector.mjs')

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
  const taskDir = path.join(roundtripRoot, caseName, 'correction-task')
  const externalTaskDir = path.join(taskRoot, caseName)
  const task = {
    taskStatus: options.taskStatus || 'ready',
    sourceReviewStatus: options.reviewStatus || 'needs_revision',
    title: `Corregir entrega generada para ${caseName}`,
    severity: options.severity || 'major',
    categories: options.categories || ['completeness'],
    evidenceDir: path.join(smokeRoot, 'evidence', caseName),
    forbiddenActions: [
      'No tocar web-prueba.',
      'No crear ni modificar .env.',
      'No crear ni modificar node_modules.',
      'No usar git add .',
    ],
    requiredFixes: options.requiredFixes || ['Cubrir conceptos faltantes: reportes simples.'],
    validationCommands: ['git diff --check', 'git status --short'],
    issues: options.issues || [
      {
        severity: options.severity || 'major',
        category: 'completeness',
        message: 'Faltan conceptos esperados: reportes simples.',
        evidence: 'reportes simples',
      },
    ],
    correctionBrief:
      options.correctionBrief ||
      'Mantener el dominio principal y cubrir reportes simples sin tocar fuera de .codex-temp.',
    metadata: {
      reviewerSummary: 'La entrega requiere revision: 0 bloqueantes, 1 mayores.',
      issueCount: 1,
    },
  }
  const prompt = `CODEX CORRECTION TASK\n\nCaso ${caseName}. Corregir solo dentro de .codex-temp.`

  if (options.localTask !== false) {
    writeJson(path.join(taskDir, 'codex-correction-task.json'), task)
    writeText(path.join(taskDir, 'codex-correction-prompt.md'), prompt)
  }
  if (options.externalTask) {
    writeJson(path.join(externalTaskDir, 'codex-correction-task.json'), task)
    writeText(path.join(externalTaskDir, 'codex-correction-prompt.md'), prompt)
  }

  return task
}

function makeRoundtrip(caseName, options = {}) {
  const caseDir = path.join(roundtripRoot, caseName)
  const task = options.includeTask === false ? null : makeTask(caseName, options)
  const issues =
    options.issues ||
    task?.issues || [
      {
        severity: 'major',
        category: 'completeness',
        message: 'Faltan conceptos esperados: reportes simples.',
        evidence: 'reportes simples',
      },
    ]

  writeJson(path.join(caseDir, 'delivery-roundtrip-report.json'), {
    roundtripStatus: options.roundtripStatus || 'awaiting_manual_correction',
    initialReviewStatus: options.reviewStatus || 'needs_revision',
    correctionTaskStatus: options.taskStatus || task?.taskStatus || '',
    followupReviewStatus: options.followupReviewStatus || '',
    initialReview: {
      status: options.reviewStatus || 'needs_revision',
      issues,
      missingConcepts: options.missingConcepts || ['reportes simples'],
      reviewerSummary:
        options.reviewerSummary || 'La entrega requiere revision: 0 bloqueantes, 1 mayores.',
      correctionBrief: options.correctionBrief || task?.correctionBrief || '',
    },
    correctionTask: task || undefined,
    remainingIssues: issues,
    metadata: {
      mode: 'dry-run',
      initialEvidenceDir: path.join(smokeRoot, 'evidence', caseName),
      projectName: caseName,
    },
  })

  if (options.includeTask === false) {
    const taskDir = path.join(caseDir, 'correction-task')
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true })
    }
  }

  return caseDir
}

function runSelector(args) {
  return spawnSync(process.execPath, [selectorPath, ...args], {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
  })
}

function runJson(args) {
  const result = runSelector([...args, '--json'])
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

runCase('Listado de candidatos', () => {
  makeRoundtrip('awaiting-case')
  makeRoundtrip('pass-case', {
    roundtripStatus: 'no_action_needed',
    reviewStatus: 'pass',
    taskStatus: 'no_action_needed',
    issues: [],
    missingConcepts: [],
  })
  const result = runJson(['--roundtrip-root', roundtripRoot, '--list'])
  assert.equal(result.action, 'list')
  assert.equal(result.candidates.length, 2)
  assert.equal(result.candidates.find((candidate) => candidate.caseName === 'awaiting-case').needsAction, true)
  assert.equal(result.candidates.find((candidate) => candidate.caseName === 'pass-case').needsAction, false)
})

runCase('Seleccion ready genera handoff', () => {
  const output = path.join(smokeRoot, 'outputs', 'awaiting-case')
  const corrected = path.join(output, 'corrected-evidence')
  const result = runJson([
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'awaiting-case',
    '--output',
    output,
    '--corrected-evidence',
    corrected,
  ])
  assert.equal(result.handoff.handoffStatus, 'ready')
  assert.match(result.handoff.codexPrompt, /MANUAL CODEX CORRECTION HANDOFF/)
  assert.match(result.handoff.codexPrompt, /reportes simples/)
  assert.equal(result.handoff.correctedEvidenceDir, corrected)
  assert.ok(fs.existsSync(path.join(output, 'codex-correction-handoff.json')))
  assert.ok(fs.existsSync(path.join(output, 'codex-correction-handoff-prompt.md')))
  assert.ok(fs.existsSync(path.join(output, 'roundtrip-command.txt')))
  assert.ok(fs.existsSync(path.join(output, 'README.md')))
})

runCase('Caso pass no genera prompt agresivo', () => {
  const output = path.join(smokeRoot, 'outputs', 'pass-case')
  const result = runJson([
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'pass-case',
    '--output',
    output,
  ])
  assert.equal(result.handoff.handoffStatus, 'no_action_needed')
  assert.match(result.handoff.codexPrompt, /no requiere correccion/i)
})

runCase('Caso blocked genera diagnostico', () => {
  makeRoundtrip('blocked-case', {
    roundtripStatus: 'blocked_requires_human',
    reviewStatus: 'blocked',
    taskStatus: 'blocked_requires_human',
    severity: 'blocking',
    issues: [
      {
        severity: 'blocking',
        category: 'sandbox',
        message: 'Hay path traversal.',
        evidence: '../escape.txt',
      },
    ],
  })
  const output = path.join(smokeRoot, 'outputs', 'blocked-case')
  const result = runJson([
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'blocked-case',
    '--output',
    output,
  ])
  assert.equal(result.handoff.handoffStatus, 'blocked_requires_human')
  assert.match(result.handoff.codexPrompt, /diagnostico humano/i)
  assert.doesNotMatch(result.handoff.codexPrompt, /Corregir manualmente la entrega sandbox indicada por JEFE/)
})

runCase('Missing artifacts', () => {
  makeRoundtrip('missing-artifacts-case', {
    includeTask: false,
    taskStatus: 'ready',
  })
  const output = path.join(smokeRoot, 'outputs', 'missing-artifacts-case')
  const result = runJson([
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'missing-artifacts-case',
    '--output',
    output,
  ])
  assert.equal(result.handoff.handoffStatus, 'missing_artifacts')
  assert.match(result.handoff.codexPrompt, /Faltan artefactos criticos/)
})

runCase('Output inseguro falla sin escribir', () => {
  const unsafeOutputs = [
    path.join(repoRoot, 'scripts', 'selector-unsafe-output'),
    path.join(smokeRoot, 'web-prueba', 'selector-output'),
  ]
  for (const unsafeOutput of unsafeOutputs) {
    if (fs.existsSync(unsafeOutput)) {
      fs.rmSync(unsafeOutput, { recursive: true, force: true })
    }
    const result = runSelector([
      '--roundtrip-root',
      roundtripRoot,
      '--case',
      'awaiting-case',
      '--output',
      unsafeOutput,
    ])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /inseguro/)
    assert.equal(fs.existsSync(unsafeOutput), false)
  }
})

runCase('JSON mode parseable', () => {
  const output = path.join(smokeRoot, 'outputs', 'json-mode')
  const result = runJson([
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'awaiting-case',
    '--output',
    output,
  ])
  assert.equal(result.action, 'handoff')
  assert.equal(result.handoff.caseName, 'awaiting-case')
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('OK. Delivery Correction Selector smoke completo.')
