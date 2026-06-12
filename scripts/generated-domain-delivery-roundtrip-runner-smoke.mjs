import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-roundtrip-runner-smoke')
const runnerPath = path.join(repoRoot, 'scripts', 'generated-domain-delivery-roundtrip-runner.mjs')
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

function baseFiles({ domain = expectedDomain, complete = true, extraFiles = [] } = {}) {
  const content = complete
    ? `${expectedConcepts.join(', ')}. Backend mock y base local.`
    : `${domain}. Panel publico y panel operativo.`
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

function makeEvidence(caseName, options = {}) {
  const evidenceDir = path.join(smokeRoot, caseName)
  const projectRoot = path.join(evidenceDir, 'sandbox-project')
  const domain = options.domain || expectedDomain
  const summaryDomain = options.summaryDomain || domain
  const files = options.files || baseFiles({ domain, complete: options.complete !== false })
  const requiredTerms = options.requiredTerms || expectedConcepts

  fs.mkdirSync(evidenceDir, { recursive: true })
  writeJson(path.join(evidenceDir, 'request.json'), {
    objective: `Quiero crear una app local para gestionar un ${domain}.`,
    context: `Debe incluir ${requiredTerms.join(', ')}. Todo mock/local en zona de prueba segura.`,
    expectedConfiguration: ['Zona de prueba segura', 'Sin deploy', 'Sin servicios externos'],
  })
  writeJson(path.join(evidenceDir, 'summary.json'), {
    status: 'passed',
    planningDomain: summaryDomain,
    executionDomain: summaryDomain,
    approvalStatus: 'approved-for-sandbox',
    materialized: true,
    projectRoot,
  })
  writeJson(path.join(evidenceDir, 'validation-summary.json'), {
    domain: {
      passed: summaryDomain === domain,
      expectedDomain: options.includeExpectedDomain === false ? undefined : domain,
      actualDomain: summaryDomain,
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
        domainLabel: summaryDomain,
        primaryModules: requiredTerms,
      },
    },
  })
  writeJson(path.join(evidenceDir, 'generated-files.json'), {
    projectRoot,
    files: files.map((file) => ({ relativePath: file.relativePath, size: 100 })),
    filesCount: files.length,
  })
  writeText(path.join(evidenceDir, 'heartbeat.log'), 'runner fixture heartbeat')

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

function runRunner(args) {
  return spawnSync(process.execPath, [runnerPath, ...args], {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
  })
}

function runJsonRoundtrip({ initial, corrected = '', output }) {
  const args = [
    '--initial-evidence',
    initial,
    '--output',
    output,
    '--project-name',
    expectedDomain,
    '--expected-domain',
    expectedDomain,
    '--mode',
    'dry-run',
    '--json',
  ]
  if (corrected) {
    args.splice(2, 0, '--corrected-evidence', corrected)
  }

  const result = runRunner(args)
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

runCase('PASS inicial sin corrected evidence', () => {
  const initial = makeEvidence('pass-initial')
  const output = path.join(smokeRoot, 'outputs', 'pass-initial')
  const summary = runJsonRoundtrip({ initial, output })
  assert.equal(summary.roundtripStatus, 'no_action_needed')
  assert.ok(fs.existsSync(path.join(output, 'delivery-roundtrip-report.json')))
})

runCase('NEEDS_REVISION sin corrected evidence', () => {
  const initial = makeEvidence('needs-revision-no-followup', {
    files: baseFiles({ complete: false }),
  })
  const output = path.join(smokeRoot, 'outputs', 'needs-revision-no-followup')
  const summary = runJsonRoundtrip({ initial, output })
  assert.equal(summary.roundtripStatus, 'awaiting_manual_correction')
  assert.ok(fs.existsSync(path.join(output, 'correction-task', 'codex-correction-task.json')))
  assert.ok(fs.existsSync(path.join(output, 'correction-task', 'codex-correction-prompt.md')))
})

runCase('NEEDS_REVISION con corrected evidence pass', () => {
  const initial = makeEvidence('needs-revision-followup-pass-initial', {
    files: baseFiles({ complete: false }),
  })
  const corrected = makeEvidence('needs-revision-followup-pass-corrected')
  const output = path.join(smokeRoot, 'outputs', 'needs-revision-followup-pass')
  const summary = runJsonRoundtrip({ initial, corrected, output })
  assert.equal(summary.roundtripStatus, 'completed_pass')
  assert.equal(summary.followupReviewStatus, 'pass')
  assert.ok(fs.existsSync(path.join(output, 'followup-review', 'delivery-review-report.json')))
})

runCase('NEEDS_REVISION con corrected evidence incompleta', () => {
  const initial = makeEvidence('needs-revision-followup-incomplete-initial', {
    files: baseFiles({ complete: false }),
  })
  const corrected = makeEvidence('needs-revision-followup-incomplete-corrected', {
    files: baseFiles({ complete: false }),
  })
  const output = path.join(smokeRoot, 'outputs', 'needs-revision-followup-incomplete')
  const summary = runJsonRoundtrip({ initial, corrected, output })
  assert.equal(summary.roundtripStatus, 'needs_more_revision')
})

runCase('BLOCKED inicial', () => {
  const initial = makeEvidence('blocked-initial', {
    files: baseFiles({
      extraFiles: [{ relativePath: '.env', content: 'SECRET=real', materialize: false }],
    }),
  })
  const output = path.join(smokeRoot, 'outputs', 'blocked-initial')
  const summary = runJsonRoundtrip({ initial, output })
  assert.equal(summary.roundtripStatus, 'blocked_requires_human')
})

runCase('Output inseguro falla sin escribir', () => {
  const initial = makeEvidence('unsafe-output-initial')
  const unsafeScriptsOutput = path.join(repoRoot, 'scripts', 'roundtrip-runner-unsafe-output')
  const unsafeWebPruebaOutput = path.join(smokeRoot, 'web-prueba', 'runner-output')

  for (const unsafeOutput of [unsafeScriptsOutput, unsafeWebPruebaOutput]) {
    if (fs.existsSync(unsafeOutput)) {
      fs.rmSync(unsafeOutput, { recursive: true, force: true })
    }
    const result = runRunner([
      '--initial-evidence',
      initial,
      '--output',
      unsafeOutput,
      '--json',
    ])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Output inseguro/)
    assert.equal(fs.existsSync(unsafeOutput), false)
  }
})

runCase('JSON mode imprime JSON parseable', () => {
  const initial = makeEvidence('json-mode-initial')
  const output = path.join(smokeRoot, 'outputs', 'json-mode')
  const result = runRunner([
    '--initial-evidence',
    initial,
    '--output',
    output,
    '--project-name',
    expectedDomain,
    '--json',
  ])
  assert.equal(result.status, 0, result.stderr || result.stdout)
  const parsed = JSON.parse(result.stdout)
  assert.equal(parsed.roundtripStatus, 'no_action_needed')
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('OK. Delivery Review Roundtrip Runner smoke completo.')
