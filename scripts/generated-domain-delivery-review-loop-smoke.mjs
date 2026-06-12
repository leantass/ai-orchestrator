import assert from 'node:assert/strict'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const { reviewGeneratedDomainDelivery } = require(
  path.join(repoRoot, 'electron', 'generated-domain-delivery-review.cjs'),
)

const culturalExpectedConcepts = [
  'centro barrial',
  'talleres culturales',
  'oficios',
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

const nurseryExpectedConcepts = [
  'vivero comunitario',
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
]

const defaultForbiddenDomainTerms = [
  'taller de bicicletas',
  'bicicletas',
  'vivero comunitario',
  'plantas',
  'operaciones portuarias',
  'ecommerce local',
  'tracking logistico',
  'banco comunitario de herramientas',
]

function buildBaseFiles(domainText, extraFiles = []) {
  const domainDoc = [
    domainText,
    'Incluye vecinos, coordinadores, docentes, talleres, categorias, inscripciones, cupos, horarios, espacios/aulas, asistencia, materiales, observaciones, estados de inscripcion, reportes simples.',
    'Incluye panel publico, panel operativo, panel administrativo, backend mock y base local.',
  ].join('\n')

  return [
    { relativePath: 'README.md', content: `${domainText}\nBackend mock y base local.` },
    { relativePath: 'docs/domain.md', content: domainDoc },
    { relativePath: 'frontend/index.html', content: '<main>Panel publico y panel operativo</main>' },
    { relativePath: 'frontend/src/main.js', content: 'const panels = ["panel publico", "panel operativo", "panel administrativo"]' },
    { relativePath: 'backend/src/index.js', content: '// backend mock local sin servicios externos' },
    { relativePath: 'database/schema.sql', content: '-- base local para talleres e inscripciones' },
    { relativePath: 'shared/contracts/domain.js', content: 'module.exports = { mock: true }' },
    { relativePath: 'validation/report.json', content: '{"passed":true}' },
    ...extraFiles,
  ]
}

function buildInput(overrides = {}) {
  const domainText = 'centro barrial de talleres culturales y oficios'
  return {
    requestText:
      'Quiero crear una app local para gestionar un centro barrial de talleres culturales y oficios. Todo en zona de prueba segura, sin deploy, sin Docker, sin servicios externos y sin credenciales reales.',
    expectedDomain: domainText,
    expectedConcepts: culturalExpectedConcepts,
    forbiddenDomainTerms: defaultForbiddenDomainTerms.filter((term) => !['vivero comunitario', 'plantas'].includes(term)),
    forbiddenArtifacts: ['.env', 'node_modules', 'Dockerfile', 'docker-compose', 'web-prueba'],
    generatedFiles: buildBaseFiles(domainText),
    validationReport: {
      sandbox: { passed: true, projectRoot: '.codex-temp/generated-domain-materialization-approved/centro-cultural' },
      approvals: { passed: true, approvalStatus: 'approved-for-sandbox' },
    },
    summary: {
      status: 'passed',
      planningDomain: domainText,
      executionDomain: domainText,
      approvalStatus: 'approved-for-sandbox',
      projectRoot: '.codex-temp/generated-domain-materialization-approved/centro-cultural',
    },
    sandboxPath: '.codex-temp/generated-domain-materialization-approved/centro-cultural',
    approvalStatus: 'approved-for-sandbox',
    constraints: ['sandbox seguro', 'sin deploy', 'sin servicios externos', 'sin credenciales reales'],
    ...overrides,
  }
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

runCase('PASS centro cultural correcto', () => {
  const review = reviewGeneratedDomainDelivery(buildInput())
  assert.equal(review.status, 'pass')
  assert.equal(review.missingConcepts.length, 0)
  assert.equal(review.restrictionViolations.length, 0)
  assert.equal(review.sandboxViolations.length, 0)
})

runCase('NEEDS_REVISION dominio incorrecto', () => {
  const review = reviewGeneratedDomainDelivery(
    buildInput({
      summary: {
        status: 'passed',
        planningDomain: 'zona de prueba segura',
        executionDomain: 'zona de prueba segura',
        approvalStatus: 'approved-for-sandbox',
        projectRoot: '.codex-temp/generated-domain-materialization-approved/zona-de-prueba-segura',
      },
      generatedFiles: buildBaseFiles('zona de prueba segura'),
    }),
  )
  assert.equal(review.status, 'needs_revision')
  assertIssueCategory(review, 'domain')
  assert.match(review.correctionBrief, /centro barrial de talleres culturales y oficios/)
})

runCase('NEEDS_REVISION contaminacion vivero con bicicletas', () => {
  const review = reviewGeneratedDomainDelivery(
    buildInput({
      requestText:
        'Quiero crear una app local para gestionar un vivero comunitario de intercambio de plantas.',
      expectedDomain: 'vivero comunitario de intercambio de plantas',
      expectedConcepts: nurseryExpectedConcepts,
      forbiddenDomainTerms: ['taller de bicicletas', 'bicicletas', 'mecanicos', 'repuestos'],
      generatedFiles: [
        ...buildBaseFiles(
          'vivero comunitario de intercambio de plantas con plantas, especies, esquejes, semillas, vecinos, solicitudes de intercambio, reservas, entregas, disponibilidad, cuidados basicos, coordinadores, panel publico, panel operativo, panel administrativo, backend mock y base local',
        ),
        {
          relativePath: 'docs/contamination.md',
          content: 'Plan heredado del taller de bicicletas con turnos, mecanicos y repuestos.',
        },
      ],
      summary: {
        status: 'passed',
        planningDomain: 'vivero comunitario de intercambio de plantas',
        executionDomain: 'vivero comunitario de intercambio de plantas',
        approvalStatus: 'approved-for-sandbox',
        projectRoot: '.codex-temp/generated-domain-materialization-approved/vivero',
      },
    }),
  )
  assert.equal(review.status, 'needs_revision')
  assertIssueCategory(review, 'contamination')
  assert.ok(review.contaminationFound.some((term) => /bicicletas|taller/.test(term)))
})

runCase('BLOCKED restriccion violada', () => {
  const review = reviewGeneratedDomainDelivery(
    buildInput({
      generatedFiles: [
        ...buildBaseFiles('centro barrial de talleres culturales y oficios'),
        { relativePath: '.env', content: 'SECRET=real' },
        { relativePath: 'node_modules/package.json', content: '{}' },
      ],
    }),
  )
  assert.equal(review.status, 'blocked')
  assertIssueCategory(review, 'restrictions')
})

runCase('BLOCKED sandbox path peligroso', () => {
  const review = reviewGeneratedDomainDelivery(
    buildInput({
      generatedFiles: [
        ...buildBaseFiles('centro barrial de talleres culturales y oficios'),
        { relativePath: '../escape.txt', content: 'fuera del sandbox' },
        { relativePath: '/web-prueba/evil.txt', content: 'no tocar web-prueba' },
      ],
    }),
  )
  assert.equal(review.status, 'blocked')
  assertIssueCategory(review, 'sandbox')
})

runCase('NEEDS_REVISION incompleto', () => {
  const review = reviewGeneratedDomainDelivery(
    buildInput({
      generatedFiles: [
        {
          relativePath: 'README.md',
          content:
            'centro barrial de talleres culturales y oficios con vecinos, coordinadores, docentes, talleres, categorias, inscripciones, cupos, horarios, espacios/aulas, asistencia, materiales, observaciones, estados de inscripcion, reportes simples, panel publico, panel operativo y panel administrativo.',
        },
        { relativePath: 'validation/report.json', content: '{"passed":true}' },
      ],
    }),
  )
  assert.equal(review.status, 'needs_revision')
  assertIssueCategory(review, 'completeness')
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('OK. Delivery Review Loop foundation smoke completo.')
