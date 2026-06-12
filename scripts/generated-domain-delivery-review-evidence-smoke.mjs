import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const {
  reviewGeneratedDomainEvidence,
  writeDeliveryReviewReport,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-review-evidence.cjs'))

const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-review-evidence-smoke')

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${value}\n`, 'utf8')
}

function baseRequest(domain = 'centro barrial de talleres culturales y oficios') {
  return {
    objective: `Quiero crear una app local para gestionar un ${domain}.`,
    context:
      'La app debe contemplar vecinos, coordinadores, docentes, talleres, categorias, inscripciones, cupos, horarios, espacios/aulas, asistencia, materiales, observaciones, estados de inscripcion, reportes simples, panel publico, panel operativo, panel administrativo, backend mock y base local.',
    expectedConfiguration: [
      'Maxima calidad',
      'No reutilizar',
      'Zona de prueba segura',
      'Sin deploy',
      'Sin servicios externos',
      'Sin credenciales reales',
    ],
  }
}

function culturalTerms() {
  return [
    'centro barrial de talleres culturales y oficios',
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
}

function makeEvidenceCase(caseName, options = {}) {
  const evidenceDir = path.join(smokeRoot, caseName)
  const projectRoot = path.join(evidenceDir, 'sandbox-project')
  const domain = options.domain || 'centro barrial de talleres culturales y oficios'
  const request = options.request || baseRequest(domain)
  const summaryDomain = options.summaryDomain || domain
  const requiredTerms = options.requiredTerms || culturalTerms()
  const files = options.files || [
    {
      relativePath: 'README.md',
      content: `${domain}. Panel publico, panel operativo, panel administrativo, backend mock y base local.`,
    },
    {
      relativePath: 'docs/domain.md',
      content: `${requiredTerms.join(', ')}. Sin deploy, sin servicios externos y sin credenciales reales.`,
    },
    { relativePath: 'frontend/index.html', content: '<main>Panel publico</main>' },
    { relativePath: 'frontend/src/main.js', content: 'const panels = ["panel operativo"]' },
    { relativePath: 'backend/src/index.js', content: '// backend mock' },
    { relativePath: 'database/schema.sql', content: '-- base local' },
    { relativePath: 'validation/report.json', content: '{"status":"materialized"}' },
  ]

  fs.mkdirSync(evidenceDir, { recursive: true })
  writeJson(path.join(evidenceDir, 'request.json'), request)
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
      expectedDomain: options.expectedDomainInValidation === false ? undefined : domain,
      actualDomain: summaryDomain,
      requiredTerms,
      missingRequiredTerms: options.missingRequiredTerms || [],
    },
    noContamination: { passed: !options.contaminatedTerms, contaminatedTerms: options.contaminatedTerms || [] },
    restrictions: { passed: !options.forbiddenGeneratedArtifacts, forbiddenGeneratedArtifacts: options.forbiddenGeneratedArtifacts || [] },
    sandbox: {
      passed: !options.sandboxFailed,
      projectRoot,
      reportPath: path.join(projectRoot, 'validation', 'report.json'),
      reportExists: options.skipValidationReport ? false : true,
    },
    approvals: {
      passed: true,
      approvalStatus: 'approved-for-sandbox',
    },
  })
  writeJson(path.join(evidenceDir, 'decisions-and-approvals.json'), {
    planningDecision: {
      domainUnderstanding: {
        domainLabel: summaryDomain,
        intentLabel: `gestionar ${domain}`,
        primaryModules: requiredTerms,
      },
    },
  })
  writeJson(path.join(evidenceDir, 'generated-files.json'), {
    projectRoot,
    files: files.map(({ relativePath, size }) => ({
      relativePath,
      size: size || 100,
    })),
    filesCount: files.length,
  })
  writeText(path.join(evidenceDir, 'heartbeat.log'), 'fixture heartbeat')

  for (const file of files) {
    if (file.materialize === false) {
      continue
    }
    writeText(path.join(projectRoot, file.relativePath), file.content || '')
  }

  if (!options.skipValidationReport) {
    writeJson(path.join(projectRoot, 'validation', 'report.json'), {
      status: 'materialized',
      projectRoot,
      validations: ['sandbox-only', 'no-dot-env', 'no-node-modules'],
    })
  } else if (fs.existsSync(path.join(projectRoot, 'validation', 'report.json'))) {
    fs.rmSync(path.join(projectRoot, 'validation', 'report.json'), { force: true })
  }

  return evidenceDir
}

function assertIssueCategory(review, category) {
  assert.ok(
    review.issues.some((issue) => issue.category === category),
    `No se encontro issue category ${category}. Issues: ${JSON.stringify(review.issues, null, 2)}`,
  )
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

removeDir(smokeRoot)
fs.mkdirSync(smokeRoot, { recursive: true })

runCase('PASS evidencia centro cultural', () => {
  const evidenceDir = makeEvidenceCase('pass-centro-cultural')
  const output = reviewGeneratedDomainEvidence(evidenceDir)
  assert.equal(output.review.status, 'pass')
  const written = writeDeliveryReviewReport(path.join(smokeRoot, 'reports', 'pass-centro-cultural'), output)
  assert.ok(fs.existsSync(written.reportPath))
  assert.ok(fs.existsSync(written.briefPath))
})

runCase('NEEDS_REVISION dominio perdido', () => {
  const evidenceDir = makeEvidenceCase('needs-revision-domain', {
    summaryDomain: 'zona de prueba segura',
    expectedDomainInValidation: false,
    requiredTerms: ['panel publico', 'backend mock', 'base local'],
    files: [
      { relativePath: 'README.md', content: 'zona de prueba segura con backend mock y base local' },
      { relativePath: 'validation/report.json', content: '{"status":"materialized"}' },
    ],
  })
  const output = reviewGeneratedDomainEvidence(evidenceDir)
  assert.equal(output.review.status, 'needs_revision')
  assertIssueCategory(output.review, 'domain')
  assertIssueCategory(output.review, 'completeness')
  assert.match(output.review.correctionBrief, /centro barrial de talleres culturales y oficios/)
})

runCase('NEEDS_REVISION contaminacion vivero', () => {
  const domain = 'vivero comunitario de intercambio de plantas'
  const request = {
    objective: `Quiero crear una app local para gestionar un ${domain}.`,
    context:
      'Debe incluir plantas, especies, esquejes, semillas, vecinos, solicitudes de intercambio, reservas, entregas, disponibilidad, cuidados basicos, coordinadores, panel publico, panel operativo, panel administrativo, backend mock y base local.',
    expectedConfiguration: ['Zona de prueba segura', 'Sin deploy'],
  }
  const evidenceDir = makeEvidenceCase('needs-revision-contamination', {
    domain,
    request,
    requiredTerms: [
      domain,
      'plantas',
      'especies',
      'esquejes',
      'semillas',
      'vecinos',
      'solicitudes de intercambio',
      'reservas',
      'entregas',
      'disponibilidad',
      'cuidados basicos',
      'coordinadores',
      'panel publico',
      'panel operativo',
      'panel administrativo',
      'backend mock',
      'base local',
    ],
    contaminatedTerms: ['taller de bicicletas'],
    files: [
      {
        relativePath: 'README.md',
        content:
          'vivero comunitario de intercambio de plantas con plantas, especies, esquejes, semillas, vecinos, solicitudes de intercambio, reservas, entregas, disponibilidad, cuidados basicos, coordinadores, panel publico, panel operativo, panel administrativo, backend mock y base local. Contaminado por taller de bicicletas y repuestos.',
      },
      { relativePath: 'frontend/index.html', content: '<main>panel publico</main>' },
      { relativePath: 'backend/src/index.js', content: '// backend mock' },
      { relativePath: 'database/schema.sql', content: '-- base local' },
      { relativePath: 'validation/report.json', content: '{"status":"materialized"}' },
    ],
  })
  const output = reviewGeneratedDomainEvidence(evidenceDir)
  assert.equal(output.review.status, 'needs_revision')
  assert.ok(output.review.contaminationFound.length > 0)
})

runCase('BLOCKED restriccion', () => {
  const evidenceDir = makeEvidenceCase('blocked-restriction', {
    files: [
      ...[
        { relativePath: 'README.md', content: `${culturalTerms().join(', ')}, backend mock, base local.` },
        { relativePath: 'frontend/index.html', content: '<main>panel publico</main>' },
        { relativePath: 'backend/src/index.js', content: '// backend mock' },
        { relativePath: 'database/schema.sql', content: '-- base local' },
        { relativePath: 'validation/report.json', content: '{"status":"materialized"}' },
      ],
      { relativePath: '.env', content: '', materialize: false },
      { relativePath: 'node_modules/package.json', content: '{}', materialize: false },
    ],
  })
  const output = reviewGeneratedDomainEvidence(evidenceDir)
  assert.equal(output.review.status, 'blocked')
  assertIssueCategory(output.review, 'restrictions')
})

runCase('BLOCKED sandbox', () => {
  const evidenceDir = makeEvidenceCase('blocked-sandbox', {
    files: [
      { relativePath: 'README.md', content: `${culturalTerms().join(', ')}, backend mock, base local.` },
      { relativePath: 'frontend/index.html', content: '<main>panel publico</main>' },
      { relativePath: 'backend/src/index.js', content: '// backend mock' },
      { relativePath: 'database/schema.sql', content: '-- base local' },
      { relativePath: 'validation/report.json', content: '{"status":"materialized"}' },
      { relativePath: '../escape.txt', content: 'escape', materialize: false },
      { relativePath: '/web-prueba/evil.txt', content: 'evil', materialize: false },
    ],
  })
  const output = reviewGeneratedDomainEvidence(evidenceDir)
  assert.equal(output.review.status, 'blocked')
  assertIssueCategory(output.review, 'sandbox')
})

runCase('NEEDS_REVISION evidencia incompleta', () => {
  const evidenceDir = makeEvidenceCase('needs-revision-incomplete-evidence', {
    skipValidationReport: true,
    files: [
      { relativePath: 'README.md', content: `${culturalTerms().join(', ')}, backend mock, base local.` },
      { relativePath: 'frontend/index.html', content: '<main>panel publico</main>' },
      { relativePath: 'backend/src/index.js', content: '// backend mock' },
      { relativePath: 'database/schema.sql', content: '-- base local' },
    ],
  })
  const output = reviewGeneratedDomainEvidence(evidenceDir)
  assert.equal(output.review.status, 'needs_revision')
  assertIssueCategory(output.review, 'evidence')
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('OK. Delivery Review Evidence smoke completo.')
