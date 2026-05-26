import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainFilePath = path.join(repoRoot, 'electron', 'main.cjs')
const mainSource = fs.readFileSync(mainFilePath, 'utf8')
const {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveRequiredPathGroupsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainContractDiagnostics,
} = require('../electron/generated-domain-contract.cjs')
const {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
} = require(path.join(repoRoot, 'electron', 'local-deterministic-executor.cjs'))
const {
  FULLSTACK_LOCAL_BASE_PHASES,
  getFullstackLocalBasePhaseDefinition,
  buildFullstackLocalManifestPhaseBlueprints,
} = require(path.join(repoRoot, 'electron', 'fullstack-phase-contracts.cjs'))
const {
  classifyWorkspaceProjectIntent,
  selectBestWorkspaceProjectCandidate,
  shouldIgnoreWorkspaceDirectoryEntry,
} = require(path.join(repoRoot, 'electron', 'workspace-project-detection.cjs'))

function extractSegment({ startMarker, endMarker }) {
  const start = mainSource.indexOf(startMarker)
  if (start === -1) {
    throw new Error(`No se encontro el anchor inicial ${JSON.stringify(startMarker)}.`)
  }

  const end = mainSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(`No se encontro el anchor final ${JSON.stringify(endMarker)}.`)
  }

  return mainSource.slice(start, end)
}

function loadGeneratedDomainObservationHarness() {
  const plannerSurface = extractSegment({
    startMarker: 'function normalizeExecutorAttemptScope(',
    endMarker: 'function buildOpenAIBrainInputPayload(input) {',
  })
  const harness = `
${plannerSurface}
module.exports = {
  buildBrainDecisionContract,
  buildOpenAIBrainSystemPrompt,
  buildOpenAIBrainSchema,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    console,
    process,
    Buffer,
    fs,
    path,
    LOCAL_MATERIALIZATION_PLAN_VERSION,
    FULLSTACK_LOCAL_BASE_PHASES,
    getFullstackLocalBasePhaseDefinition,
    buildFullstackLocalManifestPhaseBlueprints,
    classifyWorkspaceProjectIntent,
    selectBestWorkspaceProjectCandidate,
    shouldIgnoreWorkspaceDirectoryEntry,
    buildGeneratedDomainContractDiagnostics,
    extractGeneratedDomainContractCandidate:
      require('../electron/generated-domain-contract.cjs').extractGeneratedDomainContractCandidate,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)
  vm.runInContext(harness, sandbox, {
    filename: 'generated-domain-contract-smoke-harness.cjs',
  })

  return sandbox.module.exports || {}
}

const observationHarness = loadGeneratedDomainObservationHarness()

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

function createWindowsDoubleSlashRootContract({ absoluteOperationPaths = false } = {}) {
  const rootPath = 'C://Users//letas//Desktop//Proyectos//Desarrollo//web-prueba//criaderos-carnivoras'
  const contract = createValidInventedContract()
  contract.domain = {
    label: 'Criaderos de carnivoras',
    slug: 'criaderos-carnivoras',
    summary: 'Gestion local de visitas, cuidados, ventas mock y reportes.',
  }
  contract.root = {
    slug: 'criaderos-carnivoras',
    sourceRoot: rootPath,
    targetRoot: rootPath,
  }

  if (absoluteOperationPaths) {
    contract.materialization.operations = contract.materialization.operations.map((entry) => ({
      ...entry,
      targetPath: `${rootPath}/${entry.targetPath}`,
    }))
  }

  return contract
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

function runDecisionWithoutGeneratedDomainContractCase() {
  const decision = {
    decisionKey: 'invented-domain-plan',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    executionScope: {
      allowedTargetPaths: ['legacy-root', 'legacy-root/README.md'],
    },
  }
  const diagnostics = buildGeneratedDomainContractDiagnostics(decision, '.')
  assert.deepEqual(diagnostics, { present: false }, 'Sin generatedDomainContract debe devolver present=false.')
}

function runDecisionWithValidGeneratedDomainContractCase() {
  const contract = createValidInventedContract()
  const decision = {
    decisionKey: 'invented-domain-materialize',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    executionScope: {
      allowedTargetPaths: ['legacy-root', 'legacy-root/README.md'],
    },
    generatedDomainContract: contract,
  }
  const originalExecutionScope = JSON.stringify(decision.executionScope)
  const diagnostics = buildGeneratedDomainContractDiagnostics(decision, '.')
  assert.equal(diagnostics.present, true, 'Un contrato presente debe marcar present=true.')
  assert.equal(diagnostics.valid, true, 'Un contrato valido debe marcar valid=true.')
  assert.equal(
    diagnostics.safeForLocalMaterialization,
    true,
    'Un contrato valido y mock-only debe marcar safeForLocalMaterialization=true.',
  )
  assert.equal(diagnostics.domainSlug, 'carnivorous-plant-nursery')
  assert.equal(diagnostics.rootSlug, 'carnivorous-plants-local')
  assert.equal(diagnostics.sourceRoot, 'carnivorous-plants-local')
  assert.equal(diagnostics.targetRoot, 'carnivorous-plants-local')
  assert.ok(diagnostics.frontendSurfacesCount >= 3)
  assert.ok(diagnostics.backendRoutesCount >= 6)
  assert.ok(diagnostics.databaseTablesCount >= 5)
  assert.ok(diagnostics.allowedTargetPathsCount > 0)
  assert.equal(
    JSON.stringify(decision.executionScope),
    originalExecutionScope,
    'El diagnostico paralelo no debe mutar executionScope legacy.',
  )
}

function runDecisionWithRootMismatchCase() {
  const contract = createValidInventedContract()
  contract.root.targetRoot = 'other-root-local'
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: contract,
      executionScope: {
        allowedTargetPaths: ['legacy-root'],
      },
    },
    '.',
  )
  assert.equal(diagnostics.present, true)
  assert.equal(
    diagnostics.valid,
    false,
    'Un root mismatch debe dejar valid=false en el diagnostico.',
  )
  assert.equal(
    diagnostics.safeForLocalMaterialization,
    false,
    'Un root mismatch debe dejar safeForLocalMaterialization=false.',
  )
  assert.ok(
    diagnostics.errors.some((entry) => entry.includes('sourceRoot') && entry.includes('targetRoot')),
    'El diagnostico debe reportar root mismatch.',
  )
}

function runDecisionWithForbiddenEnvCase() {
  const contract = createValidInventedContract()
  contract.materialization.requiredFiles.push('.env')
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: contract,
    },
    '.',
  )
  assert.equal(diagnostics.present, true)
  assert.equal(diagnostics.safeForLocalMaterialization, false)
  assert.ok(
    diagnostics.errors.some((entry) => entry.includes('archivos prohibidos')),
    'El diagnostico debe reportar .env prohibido.',
  )
}

function runDecisionWithExternalApiCase() {
  const contract = createValidInventedContract()
  contract.materialization.operations.push({
    type: 'replace-file',
    targetPath: 'backend/src/services/real-payment.js',
    nextContent: "fetch('https://api.mercadopago.com/v1/payments')\n",
  })
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContractV1: contract,
    },
    '.',
  )
  assert.equal(diagnostics.present, true)
  assert.equal(diagnostics.safeForLocalMaterialization, false)
  assert.ok(
    diagnostics.errors.some((entry) => entry.includes('integracion real') || entry.includes('secreto')),
    'El diagnostico debe reportar API real externa.',
  )
}

function runWindowsDoubleSlashPathCase() {
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: createWindowsDoubleSlashRootContract({
        absoluteOperationPaths: true,
      }),
    },
    '.',
  )

  assert.equal(diagnostics.present, true)
  assert.equal(diagnostics.valid, true, `No deberia fallar por C:// solo: ${diagnostics.errors.join(' | ')}`)
  assert.equal(
    diagnostics.safeForLocalMaterialization,
    true,
    `No deberia fallar por roots/operations absolutos normalizables: ${diagnostics.errors.join(' | ')}`,
  )
  assert.equal(diagnostics.rootSlug, 'criaderos-carnivoras')
  assert.equal(diagnostics.sourceRoot, 'criaderos-carnivoras')
  assert.equal(diagnostics.targetRoot, 'criaderos-carnivoras')
}

function runSystemPathOutsideWorkspaceCase() {
  const contract = createValidInventedContract()
  contract.root = {
    slug: 'system32-local',
    sourceRoot: 'C://Windows//System32',
    targetRoot: 'C://Windows//System32',
  }
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: contract,
    },
    '.',
  )

  assert.equal(diagnostics.present, true)
  assert.equal(diagnostics.valid, false)
  assert.equal(diagnostics.safeForLocalMaterialization, false)
  assert.ok(
    diagnostics.errors.some((entry) => entry.includes('segmento reservado') || entry.includes('absoluto')),
    'C://Windows//System32 debe seguir fallando por seguridad.',
  )
}

function runOpenAIPromptContractRequestCase() {
  const prompt = String(observationHarness.buildOpenAIBrainSystemPrompt?.() || '')
  assert.ok(prompt.includes('generatedDomainContract'), 'El prompt debe pedir generatedDomainContract.')
  assert.ok(
    prompt.includes('dominio como datos'),
    'El prompt debe pedir que el dominio se trate como datos y no como rubro hardcodeado.',
  )
  assert.ok(
    prompt.includes('sourceRoot y targetRoot'),
    'El prompt debe exigir coherencia entre sourceRoot y targetRoot.',
  )
  assert.ok(
    prompt.includes('Mock-only esta permitido'),
    'El prompt debe aclarar que mock-only esta permitido para integraciones locales.',
  )
}

function runOpenAISchemaContractFieldCase() {
  const schema = observationHarness.buildOpenAIBrainSchema?.()
  const contractSchema = schema?.properties?.generatedDomainContract
  assert.ok(contractSchema, 'El schema de OpenAI debe aceptar generatedDomainContract.')
  assert.equal(contractSchema.type, 'object')
  assert.ok(contractSchema.properties?.domain, 'El schema debe incluir domain.')
  assert.ok(contractSchema.properties?.root, 'El schema debe incluir root.')
  assert.ok(contractSchema.properties?.frontendSurfaces, 'El schema debe incluir frontendSurfaces.')
  assert.ok(contractSchema.properties?.materialization, 'El schema debe incluir materialization.')
  assert.ok(contractSchema.properties?.validation, 'El schema debe incluir validation.')
}

function runBrainDecisionContractObservationCase() {
  const generatedDomainContract = createValidInventedContract()
  const baseDecision = {
    decisionKey: 'invented-domain-plan',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Observacion paralela del contrato universal.',
    instruction: 'Mantener el plan legacy y adjuntar diagnostico del contrato generado.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    materializationPlan: {
      planVersion: 'legacy-observation-only',
      operations: [],
    },
    executionScope: {
      objectiveScope: 'legacy-planner-scope',
      allowedTargetPaths: ['legacy-root', 'legacy-root/README.md'],
    },
    workspacePath: repoRoot,
  }

  const withoutContract = observationHarness.buildBrainDecisionContract(baseDecision)
  const withContract = observationHarness.buildBrainDecisionContract({
    ...baseDecision,
    generatedDomainContract,
  })

  assert.equal(withoutContract.generatedDomainContractDiagnostics?.present, false)
  assert.equal(withContract.generatedDomainContractDiagnostics?.present, true)
  assert.equal(withContract.generatedDomainContractDiagnostics?.valid, true)
  assert.equal(withContract.generatedDomainContractDiagnostics?.safeForLocalMaterialization, true)
  assert.equal(withContract.strategy, withoutContract.strategy)
  assert.equal(withContract.executionMode, withoutContract.executionMode)
  assert.equal(withContract.nextExpectedAction, withoutContract.nextExpectedAction)
  assert.deepEqual(
    withContract.materializationPlan,
    withoutContract.materializationPlan,
    'generatedDomainContract no debe reemplazar materializationPlan.',
  )
  assert.deepEqual(
    withContract.executionScope,
    withoutContract.executionScope,
    'generatedDomainContract no debe reemplazar executionScope.',
  )
  assert.ok(withContract.generatedDomainContract, 'El payload final debe conservar generatedDomainContract.')
}

function main() {
  runValidContractCase()
  runWindowsDoubleSlashPathCase()
  runSystemPathOutsideWorkspaceCase()
  runRootMismatchCase()
  runOutOfScopeOperationCase()
  runForbiddenEnvCase()
  runExternalApiCase()
  runMockPaymentAllowedCase()
  runDecisionWithoutGeneratedDomainContractCase()
  runDecisionWithValidGeneratedDomainContractCase()
  runDecisionWithRootMismatchCase()
  runDecisionWithForbiddenEnvCase()
  runDecisionWithExternalApiCase()
  runOpenAIPromptContractRequestCase()
  runOpenAISchemaContractFieldCase()
  runBrainDecisionContractObservationCase()
  console.log('OK. GeneratedDomainContract smoke paso 16/16 checks.')
}

main()
