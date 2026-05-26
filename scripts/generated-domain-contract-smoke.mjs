import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveRequiredPathGroupsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  isContractSafeForLocalMaterialization,
} = require('../electron/generated-domain-contract.cjs')

function createValidInventedContract() {
  return {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      label: 'Carnivorous Plant Nursery',
      slug: 'carnivorous-plant-nursery',
      summary: 'Gestion local de visitas, cuidados, ventas mock y reportes.',
    },
    root: {
      slug: 'carnivorous-plants-local',
      sourceRoot: 'carnivorous-plants-local',
      targetRoot: 'carnivorous-plants-local',
    },
    roles: ['visitor', 'caretaker', 'nursery-admin'],
    entities: [
      'plants',
      'species',
      'care-schedules',
      'visit-reservations',
      'mock-sales',
      'reports',
    ],
    states: {
      reservation: ['pending', 'confirmed', 'cancelled'],
      payment: ['pending', 'approved', 'rejected', 'cancelled'],
    },
    workflows: ['visit-reservations', 'care-routine', 'mock-sales'],
    frontendSurfaces: [
      { key: 'public', label: 'Publico', path: 'frontend/public', screens: ['catalog'] },
      { key: 'care', label: 'Cuidados', path: 'frontend/care', screens: ['alerts'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [
        'backend/src/routes/plants.js',
        'backend/src/routes/species.js',
        'backend/src/routes/visit-reservations.js',
        'backend/src/routes/care-schedules.js',
        'backend/src/routes/mock-sales.js',
        'backend/src/routes/reports.js',
      ],
      services: ['backend/src/services/mock-payment-provider.js'],
      modules: ['backend/src/modules/reports.js'],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['plants', 'species', 'care_schedules', 'visit_reservations', 'mock_sales'],
      relationships: ['plants.species_id -> species.id'],
      seedData: ['species base', 'plants base', 'visit reservations mock'],
    },
    shared: {
      files: [
        'shared/plant-statuses.js',
        'shared/payment-statuses.js',
        'shared/reservation-statuses.js',
      ],
    },
    docs: [
      'docs/API.md',
      'docs/ARCHITECTURE.md',
      'docs/DB_SCHEMA.md',
      'docs/PAYMENTS_MOCK.md',
      'docs/LOCAL_VALIDATION.md',
    ],
    scripts: ['scripts/seed-local.js'],
    integrations: [
      {
        name: 'payment-provider',
        mode: 'mock-only',
        realIntegrationAllowedNow: false,
      },
    ],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile', 'docker-compose.yml'],
      forbiddenSignals: ['real token', 'external api call'],
      explicitExclusions: ['deploy', 'node_modules', 'real-webhooks'],
    },
    materialization: {
      requiredFiles: [
        'backend/src/server.js',
        'database/schema.sql',
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/public/app.js',
        'frontend/care/index.html',
        'frontend/care/app.js',
        'frontend/admin/index.html',
        'frontend/admin/app.js',
        'scripts/seed-local.js',
      ],
      operations: [
        {
          type: 'replace-file',
          targetPath: 'backend/src/server.js',
          nextContent: "export const server = 'mock-local'\n",
        },
        {
          type: 'replace-file',
          targetPath: 'backend/src/services/mock-payment-provider.js',
          nextContent:
            "export const PAYMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled']\n",
        },
      ],
      allowedTargetPaths: [],
    },
    validation: {
      syntaxChecks: ['node --check backend/src/server.js'],
      requiredPathGroups: [],
      forbiddenSearchPatterns: ['ACCESS_TOKEN', 'client_secret', 'api.mercadopago.com'],
    },
    approvals: [
      {
        key: 'payment-provider-real',
        scope: 'real-payments',
        status: 'deferred',
        allowsNow: ['mock-payments'],
        forbidsNow: ['real-payments', '.env'],
      },
    ],
  }
}

function runValidContractCase() {
  const contract = createValidInventedContract()
  const normalized = normalizeGeneratedDomainContract(contract)
  const validation = validateGeneratedDomainContract(normalized)
  const safety = isContractSafeForLocalMaterialization(normalized)
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(normalized, '.')
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(normalized)
  const forbiddenPatterns = deriveForbiddenSearchPatternsFromContract(normalized)

  assert.equal(validation.ok, true, `Contrato valido no paso validacion: ${validation.errors.join(' | ')}`)
  assert.equal(safety.ok, true, `Contrato valido no paso safety: ${safety.errors.join(' | ')}`)
  assert.ok(
    allowedTargetPaths.some((entry) => entry.includes('carnivorous-plants-local')),
    'allowedTargetPaths debe quedar anclado al root del contrato.',
  )
  assert.ok(
    requiredPathGroups.some((group) => group.includes('frontend/public/index.html')),
    'requiredPathGroups debe derivar archivos requeridos de frontend.',
  )
  assert.ok(
    forbiddenPatterns.includes('api.mercadopago.com'),
    'forbiddenSearchPatterns debe incluir patrones reales de pago.',
  )
}

function runRootMismatchCase() {
  const contract = createValidInventedContract()
  contract.root.targetRoot = 'other-root-local'
  const validation = validateGeneratedDomainContract(contract)
  assert.equal(validation.ok, false, 'Un root mismatch debe invalidar el contrato.')
  assert.ok(
    validation.errors.some((entry) => entry.includes('sourceRoot') && entry.includes('targetRoot')),
    'La validacion debe reportar root mismatch.',
  )
}

function runOutOfScopeOperationCase() {
  const contract = createValidInventedContract()
  contract.materialization.operations.push({
    type: 'replace-file',
    targetPath: '../escape.js',
    nextContent: 'export const escape = true\n',
  })
  const safety = isContractSafeForLocalMaterialization(contract)
  assert.equal(safety.ok, false, 'Una operacion fuera de scope debe fallar safety.')
  assert.ok(
    safety.errors.some((entry) => entry.includes('fuera de scope') || entry.includes('allowedTargetPaths')),
    'Safety debe reportar la operacion fuera de scope.',
  )
}

function runForbiddenEnvCase() {
  const contract = createValidInventedContract()
  contract.materialization.requiredFiles.push('.env')
  const validation = validateGeneratedDomainContract(contract)
  assert.equal(validation.ok, false, 'Un contrato con .env debe fallar validacion.')
  assert.ok(
    validation.errors.some((entry) => entry.includes('archivos prohibidos')),
    'La validacion debe reportar archivos prohibidos.',
  )
}

function runExternalApiCase() {
  const contract = createValidInventedContract()
  contract.materialization.operations.push({
    type: 'replace-file',
    targetPath: 'backend/src/services/real-payment.js',
    nextContent: "fetch('https://api.mercadopago.com/v1/payments')\n",
  })
  const safety = isContractSafeForLocalMaterialization(contract)
  assert.equal(safety.ok, false, 'Una llamada real externa debe fallar safety.')
  assert.ok(
    safety.errors.some((entry) => entry.includes('integracion real') || entry.includes('secreto')),
    'Safety debe reportar llamada real externa.',
  )
}

function runMockPaymentAllowedCase() {
  const contract = createValidInventedContract()
  const safety = isContractSafeForLocalMaterialization(contract)
  assert.equal(safety.ok, true, `Mock payment permitido no deberia fallar: ${safety.errors.join(' | ')}`)
  assert.equal(
    contract.integrations[0].realIntegrationAllowedNow,
    false,
    'El contrato mock no debe habilitar integracion real.',
  )
}

function main() {
  runValidContractCase()
  runRootMismatchCase()
  runOutOfScopeOperationCase()
  runForbiddenEnvCase()
  runExternalApiCase()
  runMockPaymentAllowedCase()
  console.log('OK. GeneratedDomainContract smoke paso 6/6 checks.')
}

main()
