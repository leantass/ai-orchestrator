import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-supervised-workflow-smoke')
const roundtripRoot = path.join(smokeRoot, 'roundtrips')
const workflowCliPath = path.join(repoRoot, 'scripts', 'generated-domain-delivery-supervised-workflow.mjs')
const expectedDomain = 'centro barrial de talleres culturales y oficios'
const expectedConcepts = [
  expectedDomain,
  'vecinos',
  'coordinadores',
  'docentes',
  'talleres',
  'categorias',
  'inscripciones',
  'cupos',
  'horarios',
  'espacios/aulas',
  'asistencia',
  'materiales',
  'observaciones',
  'estados de inscripcion',
  'reportes simples',
  'panel publico',
  'panel operativo',
  'panel administrativo',
  'backend mock',
  'base local',
]

function resetSmokeRoot() {
  if (fs.existsSync(smokeRoot)) {
    fs.rmSync(smokeRoot, { recursive: true, force: true })
  }
  fs.mkdirSync(roundtripRoot, { recursive: true })
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${value}\n`, 'utf8')
}

function baseFiles({ complete = true, extraFiles = [] } = {}) {
  const content = complete
    ? `${expectedConcepts.join(', ')}. Backend mock y base local.`
    : `${expectedDomain}. Panel publico y panel operativo.`
  return [
    { relativePath: 'README.md', content },
    { relativePath: 'docs/domain.md', content },
    { relativePath: 'frontend/index.html', content: '<main>panel publico</main>' },
    { relativePath: 'backend/src/index.js', content: complete ? '// backend mock' : '' },
    { relativePath: 'database/schema.sql', content: complete ? '-- base local' : '' },
    { relativePath: 'validation/report.json', content: '{"status":"materialized"}' },
    ...extraFiles,
  ]
}

function makeEvidence(caseName, variant, options = {}) {
  const evidenceDir = path.join(smokeRoot, 'evidence', caseName, variant)
  const projectRoot = path.join(evidenceDir, 'sandbox-project')
  const files = options.files || baseFiles({ complete: options.complete !== false })
  const requiredTerms = options.requiredTerms || expectedConcepts

  fs.mkdirSync(evidenceDir, { recursive: true })
  writeJson(path.join(evidenceDir, 'request.json'), {
    objective: `Quiero crear una app local para gestionar un ${expectedDomain}.`,
    context: `Debe incluir ${requiredTerms.join(', ')}. Todo mock/local en zona de prueba segura.`,
    expectedConfiguration: ['Zona de prueba segura', 'Sin deploy', 'Sin servicios externos'],
  })
  writeJson(path.join(evidenceDir, 'summary.json'), {
    status: 'passed',
    planningDomain: expectedDomain,
    executionDomain: expectedDomain,
    approvalStatus: 'approved-for-sandbox',
    materialized: true,
    projectRoot,
  })
  writeJson(path.join(evidenceDir, 'validation-summary.json'), {
    domain: {
      passed: true,
      expectedDomain,
      actualDomain: expectedDomain,
      requiredTerms,
      missingRequiredTerms: options.missingRequiredTerms || [],
    },
    noContamination: { passed: true, contaminatedTerms: [] },
    restrictions: { passed: true, forbiddenGeneratedArtifacts: [] },
    sandbox: {
      passed: !options.sandboxFailed,
      projectRoot,
      reportPath: path.join(projectRoot, 'validation', 'report.json'),
      reportExists: true,
    },
    approvals: { passed: true, approvalStatus: 'approved-for-sandbox' },
  })
  writeJson(path.join(evidenceDir, 'decisions-and-approvals.json'), {
    planningDecision: {
      domainUnderstanding: {
        domainLabel: expectedDomain,
        primaryModules: requiredTerms,
      },
    },
  })
  writeJson(path.join(evidenceDir, 'generated-files.json'), {
    projectRoot,
    files: files.map((file) => ({ relativePath: file.relativePath, size: 100 })),
    filesCount: files.length,
  })
  writeText(path.join(evidenceDir, 'heartbeat.log'), 'supervised workflow fixture heartbeat')

  for (const file of files) {
    if (file.materialize === false) {
      continue
    }
    writeText(path.join(projectRoot, file.relativePath), file.content || '')
  }
  writeJson(path.join(projectRoot, 'validation', 'report.json'), {
    status: 'materialized',
    validations: ['sandbox-only'],
  })

  return evidenceDir
}

function issue(message, category = 'completeness', severity = 'major') {
  return {
    severity,
    category,
    message,
    evidence: message,
  }
}

function makeRoundtripCandidate(caseName, options = {}) {
  const caseDir = path.join(roundtripRoot, caseName)
  const initialEvidenceDir =
    options.initialEvidenceDir ||
    makeEvidence(caseName, 'initial', {
      files: baseFiles({ complete: options.initialComplete !== false }),
    })
  const issues = options.issues || []
  const taskStatus = options.taskStatus || ''
  const roundtripStatus = options.roundtripStatus || 'awaiting_manual_correction'
  const initialReviewStatus = options.initialReviewStatus || 'needs_revision'

  writeJson(path.join(caseDir, 'delivery-roundtrip-report.json'), {
    roundtripStatus,
    initialReviewStatus,
    correctionTaskStatus: taskStatus,
    followupReviewStatus: options.followupReviewStatus || '',
    initialReview: {
      status: initialReviewStatus,
      issues,
      missingConcepts: issues.map((entry) => entry.evidence),
      reviewerSummary: `${caseName} initial review`,
      correctionBrief: 'Corregir cobertura faltante sin tocar fuera de .codex-temp.',
    },
    correctionTask: taskStatus
      ? {
          taskStatus,
          sourceReviewStatus: initialReviewStatus,
          title: `Corregir ${caseName}`,
          severity: options.severity || 'major',
          categories: ['completeness'],
          evidenceDir: initialEvidenceDir,
          forbiddenActions: ['No tocar web-prueba.', 'No crear ni modificar .env.'],
          requiredFixes: ['Cubrir reportes simples.'],
          validationCommands: ['git diff --check'],
          issues,
          correctionBrief: 'Cubrir reportes simples.',
        }
      : undefined,
    remainingIssues: issues,
    metadata: {
      mode: 'dry-run',
      initialEvidenceDir,
      projectName: caseName,
    },
  })

  if (taskStatus) {
    writeJson(path.join(caseDir, 'correction-task', 'codex-correction-task.json'), {
      taskStatus,
      sourceReviewStatus: initialReviewStatus,
      title: `Corregir ${caseName}`,
      severity: options.severity || 'major',
      categories: ['completeness'],
      evidenceDir: initialEvidenceDir,
      forbiddenActions: ['No tocar web-prueba.', 'No crear ni modificar .env.'],
      requiredFixes: ['Cubrir reportes simples.'],
      validationCommands: ['git diff --check'],
      issues,
      correctionBrief: 'Cubrir reportes simples.',
    })
    writeText(
      path.join(caseDir, 'correction-task', 'codex-correction-prompt.md'),
      `CODEX TASK ${caseName}`,
    )
  }

  return {
    caseDir,
    initialEvidenceDir,
  }
}

function runWorkflow(args) {
  return spawnSync(process.execPath, [workflowCliPath, ...args], {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
  })
}

function runJson(args) {
  const result = runWorkflow([...args, '--json'])
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

runCase('Fixture setup', () => {
  makeRoundtripCandidate('pending-case', {
    initialComplete: false,
    taskStatus: 'ready',
    issues: [issue('Faltan reportes simples.')],
  })
  makeRoundtripCandidate('pass-case', {
    roundtripStatus: 'no_action_needed',
    initialReviewStatus: 'pass',
    taskStatus: 'no_action_needed',
    issues: [],
  })
  makeRoundtripCandidate('blocked-case', {
    roundtripStatus: 'blocked_requires_human',
    initialReviewStatus: 'blocked',
    taskStatus: 'blocked_requires_human',
    severity: 'blocking',
    issues: [issue('Se intento escribir .env.', 'restrictions', 'blocking')],
  })
  assert.ok(fs.existsSync(roundtripRoot))
})

runCase('list encuentra candidatos', () => {
  const output = path.join(smokeRoot, 'outputs', 'list')
  const result = runJson(['--mode', 'list', '--roundtrip-root', roundtripRoot, '--output', output])
  assert.equal(result.result.workflowStatus, 'candidates_found')
  assert.ok(result.result.candidates.some((candidate) => candidate.caseName === 'pending-case'))
  assert.ok(fs.existsSync(path.join(output, 'supervised-workflow-report.json')))
})

runCase('prepare-handoff genera handoff', () => {
  const output = path.join(smokeRoot, 'outputs', 'prepare-handoff')
  const result = runJson([
    '--mode',
    'prepare-handoff',
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'pending-case',
    '--output',
    output,
  ])
  assert.equal(result.result.workflowStatus, 'awaiting_manual_correction')
  assert.equal(result.result.handoff.handoffStatus, 'ready')
  assert.ok(fs.existsSync(path.join(output, 'handoff', 'codex-correction-handoff.json')))
  assert.ok(fs.existsSync(path.join(output, 'handoff', 'codex-correction-handoff-prompt.md')))
})

runCase('review-correction completed_pass', () => {
  const corrected = makeEvidence('pending-case', 'corrected-pass')
  const output = path.join(smokeRoot, 'outputs', 'review-completed')
  const result = runJson([
    '--mode',
    'review-correction',
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'pending-case',
    '--corrected-evidence',
    corrected,
    '--output',
    output,
  ])
  assert.equal(result.result.workflowStatus, 'completed_pass')
  assert.equal(result.result.roundtrip.followupReviewStatus, 'pass')
  assert.ok(fs.existsSync(path.join(output, 'roundtrip', 'delivery-roundtrip-report.json')))
  assert.ok(fs.existsSync(path.join(output, 'ledger', 'delivery-history-ledger.json')))
})

runCase('review-correction needs_more_revision', () => {
  const corrected = makeEvidence('pending-case', 'corrected-incomplete', {
    files: baseFiles({ complete: false }),
  })
  const output = path.join(smokeRoot, 'outputs', 'review-needs-more')
  const result = runJson([
    '--mode',
    'review-correction',
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'pending-case',
    '--corrected-evidence',
    corrected,
    '--output',
    output,
  ])
  assert.equal(result.result.workflowStatus, 'needs_more_revision')
  assert.equal(result.result.roundtrip.followupReviewStatus, 'needs_revision')
})

runCase('blocked devuelve blocked_requires_human', () => {
  const output = path.join(smokeRoot, 'outputs', 'blocked')
  const result = runJson([
    '--mode',
    'prepare-handoff',
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'blocked-case',
    '--output',
    output,
  ])
  assert.equal(result.result.workflowStatus, 'blocked_requires_human')
  assert.equal(result.result.nextAction, 'review_blocked_case')
})

runCase('no_action_needed no genera handoff agresivo', () => {
  const output = path.join(smokeRoot, 'outputs', 'pass')
  const result = runJson([
    '--mode',
    'full-supervised',
    '--roundtrip-root',
    roundtripRoot,
    '--case',
    'pass-case',
    '--output',
    output,
  ])
  assert.equal(result.result.workflowStatus, 'no_action_needed')
  assert.equal(result.result.handoff, null)
})

runCase('Output inseguro bloqueado', () => {
  const unsafeOutput = path.join(repoRoot, 'scripts', 'supervised-workflow-smoke-output')
  const result = runWorkflow(['--mode', 'list', '--roundtrip-root', roundtripRoot, '--output', unsafeOutput])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /inseguro/)
  assert.equal(fs.existsSync(path.join(unsafeOutput, 'supervised-workflow-report.json')), false)
})

runCase('JSON mode parseable', () => {
  const output = path.join(smokeRoot, 'outputs', 'json-mode')
  const result = runJson(['--mode', 'list', '--roundtrip-root', roundtripRoot, '--output', output])
  assert.equal(result.summary.workflowStatus, 'candidates_found')
})

if (process.exitCode) {
  process.exit(process.exitCode)
}
