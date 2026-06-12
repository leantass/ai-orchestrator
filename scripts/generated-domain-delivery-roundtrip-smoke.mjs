import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  runDeliveryReviewRoundtrip,
  writeDeliveryRoundtripReport,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-roundtrip.cjs'))

const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-roundtrip-smoke')
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
    context: `Debe incluir ${expectedConcepts.join(', ')}. Todo mock/local en zona de prueba segura.`,
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
      reportExists: !options.skipValidationReport,
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

  for (const file of files) {
    if (file.materialize === false) {
      continue
    }
    writeText(path.join(projectRoot, file.relativePath), file.content || '')
  }
  if (!options.skipValidationReport) {
    writeJson(path.join(projectRoot, 'validation', 'report.json'), {
      status: 'materialized',
      validations: ['sandbox-only'],
    })
  }
  return evidenceDir
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

function runRoundtrip(initialEvidenceDir, correctedEvidenceDir = '') {
  return runDeliveryReviewRoundtrip({
    initialEvidenceDir,
    correctedEvidenceDir,
    expectedDomain,
    expectedConcepts,
    projectName: expectedDomain,
    mode: 'dry-run',
  })
}

resetSmokeRoot()

runCase('PASS inicial no action needed', () => {
  const initial = makeEvidence('pass-initial')
  const result = runRoundtrip(initial)
  assert.equal(result.roundtripStatus, 'no_action_needed')
  assert.equal(result.correctionTask.taskStatus, 'no_action_needed')
})

runCase('NEEDS_REVISION sin evidencia corregida awaiting manual', () => {
  const initial = makeEvidence('needs-revision-no-followup', {
    summaryDomain: 'zona de prueba segura',
    includeExpectedDomain: false,
    requiredTerms: ['panel publico'],
    files: baseFiles({ domain: 'zona de prueba segura', complete: false }),
  })
  const result = runRoundtrip(initial)
  assert.equal(result.roundtripStatus, 'awaiting_manual_correction')
  assert.equal(result.correctionTask.taskStatus, 'ready')
  assert.match(result.correctionTask.prompt, /CODEX CORRECTION TASK/)
})

runCase('NEEDS_REVISION con evidencia corregida exitosa completed pass', () => {
  const initial = makeEvidence('needs-revision-followup-pass-initial', {
    files: baseFiles({ complete: false }),
  })
  const corrected = makeEvidence('needs-revision-followup-pass-corrected')
  const result = runRoundtrip(initial, corrected)
  assert.equal(result.roundtripStatus, 'completed_pass')
  assert.equal(result.followupReview.status, 'pass')
})

runCase('NEEDS_REVISION con evidencia corregida incompleta needs more', () => {
  const initial = makeEvidence('needs-revision-followup-incomplete-initial', {
    files: baseFiles({ complete: false }),
  })
  const corrected = makeEvidence('needs-revision-followup-incomplete-corrected', {
    files: baseFiles({ complete: false }),
  })
  const result = runRoundtrip(initial, corrected)
  assert.equal(result.roundtripStatus, 'needs_more_revision')
  assert.ok(result.remainingIssues.length > 0)
})

runCase('BLOCKED inicial requiere humano', () => {
  const initial = makeEvidence('blocked-initial', {
    extraFiles: [],
    files: baseFiles({
      extraFiles: [{ relativePath: '.env', content: 'SECRET=real', materialize: false }],
    }),
  })
  const result = runRoundtrip(initial)
  assert.equal(result.roundtripStatus, 'blocked_requires_human')
  assert.equal(result.correctionTask.taskStatus, 'blocked_requires_human')
})

runCase('BLOCKED en followup requiere humano', () => {
  const initial = makeEvidence('blocked-followup-initial', {
    files: baseFiles({ complete: false }),
  })
  const corrected = makeEvidence('blocked-followup-corrected', {
    files: baseFiles({
      extraFiles: [{ relativePath: '../escape.txt', content: 'escape', materialize: false }],
    }),
  })
  const result = runRoundtrip(initial, corrected)
  assert.equal(result.roundtripStatus, 'blocked_requires_human')
  assert.equal(result.followupReview.status, 'blocked')
})

runCase('Escritura de artefactos roundtrip', () => {
  const initial = makeEvidence('write-artifacts-initial', {
    files: baseFiles({ complete: false }),
  })
  const result = runRoundtrip(initial)
  const output = writeDeliveryRoundtripReport(path.join(smokeRoot, 'roundtrip-output'), result)
  assert.ok(fs.existsSync(output.reportPath))
  assert.ok(fs.existsSync(output.summaryPath))
  assert.ok(fs.existsSync(path.join(smokeRoot, 'roundtrip-output', 'initial-review', 'delivery-review-report.json')))
  assert.ok(fs.existsSync(path.join(smokeRoot, 'roundtrip-output', 'correction-task', 'codex-correction-task.json')))
  assert.ok(fs.existsSync(path.join(smokeRoot, 'roundtrip-output', 'correction-task', 'codex-correction-prompt.md')))
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('OK. Delivery Review Roundtrip smoke completo.')
