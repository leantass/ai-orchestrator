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
  normalizeGeneratedDomainDeliveryLevel,
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveRequiredPathGroupsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainContractDiagnostics,
  buildGeneratedDomainCapabilityProfile,
  buildGeneratedDomainContractComparison,
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
    startMarker: 'function summarizeGeneratedDomainContractDiagnosticsForDebug(diagnostics) {',
    endMarker: 'function createLocalRulesStrategicBrainProvider() {',
  })
const harness = `
${plannerSurface}
module.exports = {
  applyGeneratedDomainContractObservationToDecision,
  buildGeneratedDomainContractObservationFailureResult,
  buildBrainDecisionContract,
  buildLegacyDomainResolutionDiagnostics,
  buildLegacyCapabilityAlignmentDiagnostics,
  buildGeneratedDomainCapabilityProfile,
  buildGeneratedDomainContractObservationSystemPrompt,
  classifyGeneratedDomainContractObservationThrownError,
  buildOpenAIBrainSystemPrompt,
  buildOpenAIBrainSchema,
  buildSafeFirstDeliveryPlan,
  buildScalableDeliveryPlan,
  buildFullstackLocalMaterializationPlan,
  observeGeneratedDomainContractForPlannerDecision,
  summarizeGeneratedDomainContractDiagnosticsForDebug,
  summarizeGeneratedDomainContractObservationForDebug,
  summarizeLegacyCapabilityAlignmentDiagnosticsForDebug,
  summarizeLegacyDomainResolutionDiagnosticsForDebug,
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
    normalizeGeneratedDomainContract,
    validateGeneratedDomainContract,
    isContractSafeForLocalMaterialization,
    buildGeneratedDomainContractDiagnostics,
    buildGeneratedDomainCapabilityProfile,
    buildGeneratedDomainContractComparison,
    extractGeneratedDomainContractCandidate:
      require('../electron/generated-domain-contract.cjs').extractGeneratedDomainContractCandidate,
    AbortController,
    fetch: globalThis.fetch,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)
  vm.runInContext(harness, sandbox, {
    filename: 'generated-domain-contract-smoke-harness.cjs',
  })

  return {
    api: sandbox.module.exports || {},
    sandbox,
  }
}

const {
  api: observationHarness,
  sandbox: observationHarnessSandbox,
} = loadGeneratedDomainObservationHarness()

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

function createDotRelativeRootContract(rootValue = './plant-nursery-local') {
  const contract = createValidInventedContract()
  contract.root = {
    slug: 'plant-nursery-local',
    sourceRoot: rootValue,
    targetRoot: rootValue,
  }
  contract.materialization.requiredFiles = [
    `${rootValue}/frontend/public/index.html`,
    `${rootValue}/backend/src/server.js`,
  ]
  contract.materialization.allowedTargetPaths = [
    `${rootValue}/frontend/public/index.html`,
    `${rootValue}/backend/src/server.js`,
  ]
  contract.materialization.operations = [
    {
      type: 'replace-file',
      targetPath: `${rootValue}/frontend/public/index.html`,
      nextContent: "export const nursery = 'mock-local'\n",
    },
  ]
  contract.validation.requiredPathGroups = [
    [`${rootValue}/frontend/public/index.html`],
    [`${rootValue}/backend/src/server.js`],
  ]
  return contract
}

function createDiagnosticsPreviewInvalidContract() {
  const contract = createValidInventedContract()
  contract.frontendSurfaces = []
  contract.root = {
    slug: 'preview-debug-local',
    sourceRoot: 'preview-debug-local',
    targetRoot:
      'C:/Users/letas/Desktop/Proyectos/Desarrollo/orquestadoria/ai-orchestrator/tmp/generated-domain-contract-preview/with/a/very/long/absolute/root/path',
  }
  contract.materialization.requiredFiles = [
    `${contract.root.targetRoot}/frontend/public/index.html`,
    `${contract.root.targetRoot}/.env.local`,
  ]
  contract.materialization.allowedTargetPaths = [
    `${contract.root.targetRoot}/frontend/public/index.html`,
    `${contract.root.targetRoot}/.env.local`,
  ]
  contract.materialization.operations = [
    {
      type: 'replace-file',
      targetPath:
        'C:/Users/letas/Desktop/Proyectos/Desarrollo/orquestadoria/ai-orchestrator/tmp/generated-domain-contract-preview/secrets/sk-live-1234567890123456789012345678901234567890/backend/src/server.js',
      nextContent: "export const preview = 'invalid-contract'\n",
    },
    {
      type: 'replace-file',
      targetPath: `${contract.root.targetRoot}/.env.local`,
      nextContent: 'OPENAI_API_KEY=sk-live-1234567890123456789012345678901234567890\n',
    },
  ]
  contract.validation.requiredPathGroups = [[`${contract.root.targetRoot}/frontend/public/index.html`]]
  return contract
}

function createSparseDeliveryLevelContract(deliveryLevel) {
  return {
    contractVersion: '1.0',
    deliveryLevel,
    domain: {
      label: 'Sparse contract',
      slug: 'sparse-contract',
      summary: 'Contrato acotado sin señales suficientes de fullstack local.',
    },
    root: {
      slug: 'sparse-contract-local',
      sourceRoot: 'sparse-contract-local',
      targetRoot: 'sparse-contract-local',
    },
    roles: [],
    entities: [],
    states: {},
    workflows: [],
    frontendSurfaces: [],
    backend: {},
    database: {},
    shared: {},
    docs: [],
    scripts: [],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile', 'docker-compose.yml'],
      forbiddenSignals: [],
      explicitExclusions: [],
    },
    materialization: {
      requiredFiles: [],
      operations: [],
      allowedTargetPaths: [],
    },
    validation: {
      syntaxChecks: [],
      requiredPathGroups: [],
      forbiddenSearchPatterns: [],
    },
    approvals: [],
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

function runDeliveryLevelExactCase() {
  const contract = createValidInventedContract()
  contract.deliveryLevel = 'fullstack-local'
  const normalized = normalizeGeneratedDomainContract(contract)
  const validation = validateGeneratedDomainContract(normalized)

  assert.equal(normalized.deliveryLevel, 'fullstack-local')
  assert.equal(validation.ok, true, `deliveryLevel exacto deberia validar: ${validation.errors.join(' | ')}`)
}

function runCompatibleDeliveryLevelsCase() {
  const values = ['fullstack-local-large', 'fullstack-local-platform', 'local-fullstack']

  for (const deliveryLevel of values) {
    const contract = createValidInventedContract()
    contract.deliveryLevel = deliveryLevel
    const normalized = normalizeGeneratedDomainContract(contract)
    const validation = validateGeneratedDomainContract(normalized)
    const safety = isContractSafeForLocalMaterialization(normalized)

    assert.equal(
      normalized.deliveryLevel,
      'fullstack-local',
      `${deliveryLevel} deberia normalizar a fullstack-local.`,
    )
    assert.equal(validation.ok, true, `${deliveryLevel} deberia validar: ${validation.errors.join(' | ')}`)
    assert.equal(safety.ok, true, `${deliveryLevel} deberia seguir siendo seguro: ${safety.errors.join(' | ')}`)
  }
}

function runScalableDeliveryPlanWithFullstackSignalsCase() {
  const contract = createValidInventedContract()
  contract.deliveryLevel = 'scalable-delivery-plan'
  const normalized = normalizeGeneratedDomainContract(contract)
  const validation = validateGeneratedDomainContract(normalized)
  const safety = isContractSafeForLocalMaterialization(normalized)

  assert.equal(
    normalizeGeneratedDomainDeliveryLevel(contract.deliveryLevel, normalized),
    'fullstack-local',
    'scalable-delivery-plan con señales fuertes deberia normalizarse.',
  )
  assert.equal(normalized.deliveryLevel, 'fullstack-local')
  assert.equal(validation.ok, true, `scalable-delivery-plan deberia validar: ${validation.errors.join(' | ')}`)
  assert.equal(safety.ok, true, `scalable-delivery-plan deberia seguir siendo seguro: ${safety.errors.join(' | ')}`)
}

function runPlannerOnlyScalableDeliveryWithFullstackSignalsCase() {
  const contract = createValidInventedContract()
  contract.deliveryLevel = 'planner-only-scalable-delivery'
  const normalized = normalizeGeneratedDomainContract(contract)
  const validation = validateGeneratedDomainContract(normalized)
  const safety = isContractSafeForLocalMaterialization(normalized)
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: contract,
    },
    repoRoot,
  )

  assert.equal(
    normalizeGeneratedDomainDeliveryLevel(contract.deliveryLevel, normalized),
    'fullstack-local',
    'planner-only-scalable-delivery con señales fuertes deberia normalizarse.',
  )
  assert.equal(normalized.deliveryLevel, 'fullstack-local')
  assert.equal(
    validation.ok,
    true,
    `planner-only-scalable-delivery deberia validar: ${validation.errors.join(' | ')}`,
  )
  assert.equal(
    safety.ok,
    true,
    `planner-only-scalable-delivery deberia seguir siendo seguro: ${safety.errors.join(' | ')}`,
  )
  assert.ok(
    validation.warnings.some((entry) =>
      entry.includes('planner-only-scalable-delivery normalizado a fullstack-local'),
    ),
    'La normalizacion mezclada deberia dejar un warning no bloqueante.',
  )
  assert.equal(diagnostics.valid, true)
  assert.equal(diagnostics.safeForLocalMaterialization, true)
  assert.ok(
    diagnostics.warnings.some((entry) =>
      entry.includes('planner-only-scalable-delivery normalizado a fullstack-local'),
    ),
    'El diagnostico debe conservar el warning de normalizacion.',
  )
}

function runPlannerOnlyScalableDeliveryWithoutSignalsCase() {
  const contract = createSparseDeliveryLevelContract('planner-only-scalable-delivery')
  const normalized = normalizeGeneratedDomainContract(contract)
  const validation = validateGeneratedDomainContract(normalized)

  assert.equal(
    normalizeGeneratedDomainDeliveryLevel(contract.deliveryLevel, contract),
    'planner-only-scalable-delivery',
    'planner-only-scalable-delivery no debe aceptarse como alias libre.',
  )
  assert.equal(
    normalized.deliveryLevel,
    'planner-only-scalable-delivery',
    'Sin señales fuertes, planner-only-scalable-delivery debe quedar incompatible.',
  )
  assert.equal(
    validation.ok,
    false,
    'planner-only-scalable-delivery sin señales fullstack debe fallar.',
  )
  assert.ok(
    validation.errors.some(
      (entry) =>
        entry.includes('deliveryLevel incompatible') &&
        entry.includes('planner-only-scalable-delivery') &&
        entry.includes('fullstack-local'),
    ),
    'La validacion debe explicar la mezcla incompatible recibida.',
  )
}

function runScalableDeliveryPlanWithoutSignalsCase() {
  const contract = createSparseDeliveryLevelContract('scalable-delivery-plan')
  const normalized = normalizeGeneratedDomainContract(contract)
  const validation = validateGeneratedDomainContract(normalized)

  assert.equal(
    normalizeGeneratedDomainDeliveryLevel(contract.deliveryLevel, contract),
    'scalable-delivery-plan',
    'Sin señales fuertes, scalable-delivery-plan no debe colarse como fullstack-local.',
  )
  assert.equal(normalized.deliveryLevel, 'scalable-delivery-plan')
  assert.equal(validation.ok, false, 'scalable-delivery-plan sin señales fullstack debe fallar.')
  assert.ok(
    validation.errors.some(
      (entry) =>
        entry.includes('deliveryLevel incompatible') &&
        entry.includes('scalable-delivery-plan') &&
        entry.includes('fullstack-local'),
    ),
    'La validacion debe explicar el deliveryLevel incompatible recibido.',
  )
}

function runIncompatibleDeliveryLevelsCase() {
  const values = [
    'safe-first-delivery',
    'landing-page',
    'production',
    'external-service',
    'frontend-only',
  ]

  for (const deliveryLevel of values) {
    const contract = createValidInventedContract()
    contract.deliveryLevel = deliveryLevel
    const normalized = normalizeGeneratedDomainContract(contract)
    const validation = validateGeneratedDomainContract(normalized)

    assert.equal(
      normalized.deliveryLevel,
      deliveryLevel,
      `${deliveryLevel} no deberia normalizarse como fullstack-local.`,
    )
    assert.equal(validation.ok, false, `${deliveryLevel} debe seguir fallando.`)
    assert.ok(
      validation.errors.some(
        (entry) =>
          entry.includes('deliveryLevel incompatible') &&
          entry.includes(deliveryLevel) &&
          entry.includes('fullstack-local'),
      ),
      `${deliveryLevel} debe reportar el valor recibido y lo esperado.`,
    )
  }
}

function runDangerousDeliveryLevelsCase() {
  const values = ['real-payments', 'deploy']

  for (const deliveryLevel of values) {
    const contract = createValidInventedContract()
    contract.deliveryLevel = deliveryLevel
    const normalized = normalizeGeneratedDomainContract(contract)
    const validation = validateGeneratedDomainContract(normalized)

    assert.equal(validation.ok, false, `${deliveryLevel} debe fallar.`)
    assert.ok(
      validation.errors.some(
        (entry) =>
          entry.includes('deliveryLevel incompatible') &&
          entry.includes(deliveryLevel) &&
          entry.includes('fullstack-local'),
      ),
      `${deliveryLevel} debe seguir bloqueado con error claro.`,
    )
  }
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

function runRelativeDotRootCase() {
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: createDotRelativeRootContract('./plant-nursery-local'),
    },
    'C:/Users/letas/Desktop/Proyectos/Desarrollo/web-prueba',
  )

  assert.equal(diagnostics.valid, true, `./root deberia validarse: ${diagnostics.errors.join(' | ')}`)
  assert.equal(
    diagnostics.safeForLocalMaterialization,
    true,
    `./root deberia pasar safety: ${diagnostics.errors.join(' | ')}`,
  )
  assert.equal(diagnostics.sourceRoot, 'plant-nursery-local')
  assert.equal(diagnostics.targetRoot, 'plant-nursery-local')
  assert.equal(diagnostics.errors.length, 0, 'La normalizacion de ./root no debe dejar errores.')
}

function runRelativeBackslashRootCase() {
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: createDotRelativeRootContract('.\\plant-nursery-local'),
    },
    'C:/Users/letas/Desktop/Proyectos/Desarrollo/web-prueba',
  )

  assert.equal(diagnostics.valid, true, `.\\root deberia validarse: ${diagnostics.errors.join(' | ')}`)
  assert.equal(
    diagnostics.safeForLocalMaterialization,
    true,
    `.\\root deberia pasar safety: ${diagnostics.errors.join(' | ')}`,
  )
  assert.equal(diagnostics.sourceRoot, 'plant-nursery-local')
  assert.equal(diagnostics.targetRoot, 'plant-nursery-local')
  assert.equal(diagnostics.errors.length, 0, 'La normalizacion de .\\root no debe dejar errores.')
}

function runRelativeTraversalCase() {
  const parentTraversalValidation = validateGeneratedDomainContract(
    createDotRelativeRootContract('../plant-nursery-local'),
  )
  const deepTraversalValidation = validateGeneratedDomainContract(
    createDotRelativeRootContract('../../secret'),
  )

  assert.equal(parentTraversalValidation.ok, false, 'Un root relativo con ../ debe fallar.')
  assert.equal(deepTraversalValidation.ok, false, 'Un root relativo con ../../ debe fallar.')
  assert.ok(
    parentTraversalValidation.errors.some((entry) => entry.includes('workspace')),
    'El root con ../ debe reportar escape del workspace.',
  )
  assert.ok(
    deepTraversalValidation.errors.some((entry) => entry.includes('workspace')),
    'El root con ../../ debe reportar escape del workspace.',
  )
}

function runRelativeRootMismatchCase() {
  const contract = createDotRelativeRootContract('./plant-nursery-local')
  contract.root.targetRoot = './other-root'
  const validation = validateGeneratedDomainContract(contract)
  assert.equal(validation.ok, false, 'Un root mismatch relativo debe fallar.')
  assert.ok(
    validation.errors.some((entry) => entry.includes('sourceRoot') && entry.includes('targetRoot')),
    'El root mismatch relativo debe reportarse.',
  )
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

function runRelativeSystemPathCase() {
  const validation = validateGeneratedDomainContract(
    createDotRelativeRootContract('./C:/Windows/System32'),
  )

  assert.equal(validation.ok, false, 'Un root relativo disfrazando C:/Windows/System32 debe fallar.')
  assert.ok(
    validation.errors.some((entry) => entry.includes('peligroso') || entry.includes('workspace')),
    'El root relativo disfrazando system path debe reportarse.',
  )
}

function runOpenAIPromptContractRequestCase() {
  const prompt = String(observationHarness.buildOpenAIBrainSystemPrompt?.() || '')
  const observationPrompt = String(
    observationHarness.buildGeneratedDomainContractObservationSystemPrompt?.(prompt) || '',
  )
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
  assert.ok(
    prompt.includes('generatedDomainContract.deliveryLevel debe ser exactamente "fullstack-local"'),
    'El prompt base debe pedir deliveryLevel exacto fullstack-local.',
  )
  assert.ok(
    prompt.includes('No uses strategy, executionMode, planner-only, scalable-delivery-plan'),
    'El prompt base debe prohibir mezclar strategy/executionMode como deliveryLevel.',
  )
  assert.ok(
    observationPrompt.includes('No uses planner-only, scalable-delivery-plan, strategy ni executionMode como deliveryLevel del contrato.'),
    'El prompt de observacion debe reforzar la prohibicion de etiquetas mezcladas.',
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
  assert.ok(
    contractSchema.properties?.deliveryLevel?.description?.includes('exactamente fullstack-local'),
    'El schema debe reforzar deliveryLevel exacto fullstack-local.',
  )
  assert.ok(
    contractSchema.properties?.deliveryLevel?.description?.includes('planner-only'),
    'El schema debe prohibir mezclar planner-only como deliveryLevel.',
  )
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
  assert.equal(withContract.generatedDomainContractComparison?.present, true)
  assert.equal(withContract.generatedDomainContractComparison?.compared, true)
  assert.ok(
    ['compared', 'partial'].includes(withContract.generatedDomainContractComparison?.status),
    'El payload final debe adjuntar generatedDomainContractComparison sin romper el plan legacy.',
  )
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

function runLegacyDomainResolutionDiagnosticsUsedCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-safe-first-used',
    strategy: 'safe-first-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-safe-first-delivery',
    reason: 'Mantener una primera entrega segura local sin ejecutar archivos.',
    instruction: 'Planificar la primera entrega segura.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    safeFirstDeliveryPlan: {
      modules: ['cursos', 'alumnos', 'pagos mock'],
      mockData: ['Cursos mock y progreso del alumno en memoria local.'],
      screens: ['catalogo de cursos', 'panel alumno'],
      localBehavior: ['Cambiar progreso mock sin servicios externos.'],
      explicitExclusions: ['Sin checkout real'],
      approvalRequiredLater: ['Credenciales reales'],
      successCriteria: ['El resultado sigue siendo solo planner-only.'],
      legacyDomainResolution: {
        safeFirstDeliveryFamilyKey: 'online-courses',
        usedLegacyFamily: true,
      },
    },
    workspacePath: repoRoot,
  })
  const diagnostics = decision.legacyDomainResolutionDiagnostics
  const debugSummary =
    observationHarness.summarizeLegacyDomainResolutionDiagnosticsForDebug(diagnostics)

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.used, true)
  assert.equal(diagnostics?.status, 'used')
  assert.equal(diagnostics?.behaviorChanged, false)
  assert.equal(diagnostics?.safeFirstDeliveryFamily?.used, true)
  assert.equal(diagnostics?.safeFirstDeliveryFamily?.familyKey, 'online-courses')
  assert.equal(debugSummary.used, true)
  assert.equal(debugSummary.safeFirstDeliveryFamilyUsed, true)
  assert.equal(debugSummary.safeFirstDeliveryFamilyKey, 'online-courses')
  assert.equal(decision.strategy, 'safe-first-delivery-plan')
  assert.equal(decision.executionMode, 'planner-only')
  assert.equal(decision.nextExpectedAction, 'review-safe-first-delivery')
}

function runLegacyDomainResolutionDiagnosticsWithGeneratedContractCase() {
  const generatedDomainContract = createValidInventedContract()
  const scalableDeliveryPlan = observationHarness.buildScalableDeliveryPlan({
    goal:
      'Hacer un sistema fullstack local para una plataforma web de cursos online con frontend publico, panel admin, panel alumno y pagos mock.',
    context:
      'Sin deploy, sin Docker, sin servicios externos ni credenciales reales.',
    workspacePath: repoRoot,
    deliveryLevel: 'fullstack-local',
    domainUnderstanding: {
      domainLabel: 'Plataforma de cursos online',
      primaryModules: ['cursos', 'alumnos', 'pagos mock', 'reportes'],
      primaryEntities: ['courses', 'students', 'payments'],
    },
    reason: 'Preparar un review escalable fullstack-local.',
  })
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-scalable-with-generated-contract',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Mantener el review escalable y adjuntar diagnostico legacy.',
    instruction: 'No materializar nada todavía.',
    completed: false,
    requiresApproval: false,
    tasks: scalableDeliveryPlan.tasks,
    assumptions: scalableDeliveryPlan.assumptions,
    scalableDeliveryPlan: scalableDeliveryPlan.scalableDeliveryPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diagnostics = decision.legacyDomainResolutionDiagnostics

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.used, true)
  assert.equal(diagnostics?.status, 'used')
  assert.equal(diagnostics?.generatedDomainContractPresent, true)
  assert.equal(diagnostics?.generatedDomainContractValid, true)
  assert.equal(diagnostics?.generatedDomainContractSafe, true)
  assert.equal(diagnostics?.fullstackLocalArchetype?.used, true)
  assert.equal(diagnostics?.fullstackLocalArchetype?.archetype, 'online-courses')
  assert.ok(
    Array.isArray(diagnostics?.warnings) &&
      diagnostics.warnings.some((entry) =>
        String(entry).includes('generatedDomainContract valido y seguro'),
      ),
    'El diagnostico legacy debe advertir cuando sigue activo aun con contrato universal valido.',
  )
  assert.equal(decision.strategy, 'scalable-delivery-plan')
  assert.equal(decision.executionMode, 'planner-only')
  assert.equal(decision.nextExpectedAction, 'review-scalable-delivery')
}

function runLegacyDomainResolutionDiagnosticsNotUsedCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-not-used',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-product-architecture',
    reason: 'Arquitectura inicial sin legado de familias ni materializacion.',
    instruction: 'Mantener el analisis en modo review.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    workspacePath: repoRoot,
  })
  const diagnostics = decision.legacyDomainResolutionDiagnostics

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.used, false)
  assert.equal(diagnostics?.status, 'not-used')
  assert.equal(diagnostics?.safeFirstDeliveryFamily?.used, false)
  assert.equal(diagnostics?.fullstackLocalArchetype?.used, false)
  assert.equal(diagnostics?.canonicalMaterializationContract?.used, false)
  assert.equal(diagnostics?.materializationPlanProfile?.used, false)
}

function runLegacyCapabilityAlignmentDiagnosticsAlignedCase() {
  const generatedDomainContract = createValidInventedContract()
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-capability-alignment-aligned',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Observar alineacion sin activar resolvers legacy.',
    instruction: 'Mantener el review sin materializar.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diagnostics = decision.legacyCapabilityAlignmentDiagnostics
  const debugSummary =
    observationHarness.summarizeLegacyCapabilityAlignmentDiagnosticsForDebug(diagnostics)

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.compared, true)
  assert.equal(diagnostics?.status, 'aligned')
  assert.equal(diagnostics?.behaviorChanged, false)
  assert.equal(diagnostics?.alignment?.capabilityProfileSufficient, true)
  assert.equal(diagnostics?.alignment?.legacyUsedDespiteCapabilityProfile, false)
  assert.equal(diagnostics?.alignment?.migrationCandidate, false)
  assert.equal(diagnostics?.errorsCount, 0)
  assert.equal(debugSummary.legacyUsed, false)
}

function runLegacyCapabilityAlignmentDiagnosticsDivergentCase() {
  const generatedDomainContract = createValidInventedContract()
  const scalableDeliveryPlan = observationHarness.buildScalableDeliveryPlan({
    goal:
      'Hacer un sistema fullstack local para una plataforma web con frontend publico, panel admin, backend local y base de datos local.',
    context:
      'Sin deploy, sin Docker, sin servicios externos ni credenciales reales.',
    workspacePath: repoRoot,
    deliveryLevel: 'fullstack-local',
    domainUnderstanding: {
      domainLabel: 'Plataforma local fullstack',
      primaryModules: ['catalogo', 'reportes', 'inventario'],
      primaryEntities: ['products', 'reports', 'inventory_items'],
    },
    reason: 'Preparar observabilidad sobre la alineacion capability vs legacy.',
  })
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-capability-alignment-divergent',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Observar cuando el legacy sigue activo aunque el contrato universal ya alcanza.',
    instruction: 'No cambiar el comportamiento del planner.',
    completed: false,
    requiresApproval: false,
    tasks: scalableDeliveryPlan.tasks,
    assumptions: scalableDeliveryPlan.assumptions,
    scalableDeliveryPlan: scalableDeliveryPlan.scalableDeliveryPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diagnostics = decision.legacyCapabilityAlignmentDiagnostics

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.compared, true)
  assert.equal(diagnostics?.status, 'divergent')
  assert.equal(diagnostics?.behaviorChanged, false)
  assert.equal(diagnostics?.alignment?.capabilityProfileSufficient, true)
  assert.equal(diagnostics?.alignment?.legacyUsedDespiteCapabilityProfile, true)
  assert.equal(diagnostics?.alignment?.migrationCandidate, true)
  assert.ok(
    Array.isArray(diagnostics?.warnings) &&
      diagnostics.warnings.some((entry) =>
        String(entry).includes(
          'Legacy domain resolver was used even though generatedDomainCapabilityProfile appears sufficient.',
        ),
      ),
    'La alineacion debe advertir cuando legacy sigue activo aun con capability profile suficiente.',
  )
  assert.ok((diagnostics?.warningsCount || 0) > 0)
  assert.equal(diagnostics?.errorsCount, 0)
}

function runLegacyCapabilityAlignmentDiagnosticsLegacyFallbackCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-capability-alignment-fallback',
    strategy: 'safe-first-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-safe-first-delivery',
    reason: 'Observar fallback legacy cuando no existe generatedDomainContract.',
    instruction: 'Mantener solo observabilidad.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    safeFirstDeliveryPlan: {
      modules: ['catalogo', 'pedidos'],
      mockData: ['Datos mock locales.'],
      screens: ['catalogo'],
      localBehavior: ['Editar datos mock.'],
      explicitExclusions: ['Sin deploy'],
      legacyDomainResolution: {
        safeFirstDeliveryFamilyKey: 'ecommerce',
        usedLegacyFamily: true,
      },
    },
    workspacePath: repoRoot,
  })
  const diagnostics = decision.legacyCapabilityAlignmentDiagnostics

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.compared, true)
  assert.equal(diagnostics?.status, 'partial')
  assert.equal(diagnostics?.behaviorChanged, false)
  assert.equal(diagnostics?.alignment?.capabilityProfileSufficient, false)
  assert.equal(diagnostics?.alignment?.legacyFallbackLikelyNeeded, true)
  assert.equal(diagnostics?.alignment?.migrationCandidate, false)
  assert.ok(
    Array.isArray(diagnostics?.warnings) &&
      diagnostics.warnings.some((entry) =>
        String(entry).includes(
          'Legacy domain resolver is acting as fallback because generated capability profile is unavailable.',
        ),
      ),
    'La alineacion debe marcar fallback legacy cuando falta el capability profile.',
  )
}

function runLegacyCapabilityAlignmentDiagnosticsNotAvailableCase() {
  const diagnostics = observationHarness.buildLegacyCapabilityAlignmentDiagnostics({
    generatedDomainCapabilityProfile: null,
    legacyDomainResolutionDiagnostics: null,
  })

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.compared, false)
  assert.equal(diagnostics?.status, 'not-available')
  assert.equal(diagnostics?.behaviorChanged, false)
  assert.equal(diagnostics?.warningsCount, 0)
  assert.equal(diagnostics?.errorsCount, 0)
}

function createLegacyObservationDecision() {
  return observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-observation-plan',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Mantener el planner legacy mientras se observa el contrato universal.',
    instruction: 'No reemplazar materializationPlan ni executionScope.',
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
  })
}

function runPlannerObservationMergeOkCase() {
  const legacyDecision = createLegacyObservationDecision()
  const contract = createValidInventedContract()
  const observationResult = {
    attempted: true,
    ok: true,
    status: 'ok',
    elapsedMs: 4200,
    generatedDomainContract: normalizeGeneratedDomainContract(contract),
    generatedDomainContractDiagnostics: buildGeneratedDomainContractDiagnostics(
      {
        generatedDomainContract: contract,
      },
      repoRoot,
    ),
  }
  const merged = observationHarness.applyGeneratedDomainContractObservationToDecision({
    legacyDecision,
    observationResult,
  })

  assert.equal(merged.strategy, legacyDecision.strategy)
  assert.equal(merged.executionMode, legacyDecision.executionMode)
  assert.equal(merged.nextExpectedAction, legacyDecision.nextExpectedAction)
  assert.deepEqual(merged.materializationPlan, legacyDecision.materializationPlan)
  assert.deepEqual(merged.executionScope, legacyDecision.executionScope)
  assert.equal(merged.generatedDomainContractObservation?.status, 'ok')
  assert.equal(merged.generatedDomainContractDiagnostics?.present, true)
  assert.equal(merged.generatedDomainContractDiagnostics?.valid, true)
  assert.ok(merged.generatedDomainContract)
}

function runPlannerObservationMergeTimeoutCase() {
  const legacyDecision = createLegacyObservationDecision()
  const merged = observationHarness.applyGeneratedDomainContractObservationToDecision({
    legacyDecision,
    observationResult: {
      attempted: true,
      ok: false,
      status: 'timeout',
      elapsedMs: 75000,
      generatedDomainContractDiagnostics: { present: false },
    },
  })

  assert.equal(merged.generatedDomainContract, undefined)
  assert.equal(merged.generatedDomainContractObservation?.status, 'timeout')
  assert.equal(merged.generatedDomainContractDiagnostics?.present, false)
  assert.deepEqual(merged.materializationPlan, legacyDecision.materializationPlan)
  assert.deepEqual(merged.executionScope, legacyDecision.executionScope)
}

function runPlannerObservationLegacyAlreadyHasContractCase() {
  const contract = createValidInventedContract()
  const legacyDecision = observationHarness.buildBrainDecisionContract({
    ...createLegacyObservationDecision(),
    generatedDomainContract: contract,
    workspacePath: repoRoot,
  })
  const merged = observationHarness.applyGeneratedDomainContractObservationToDecision({
    legacyDecision,
    observationResult: {
      attempted: true,
      ok: true,
      status: 'ok',
      elapsedMs: 1200,
      generatedDomainContract: normalizeGeneratedDomainContract(contract),
      generatedDomainContractDiagnostics: buildGeneratedDomainContractDiagnostics(
        {
          generatedDomainContract: contract,
        },
        repoRoot,
      ),
    },
  })

  assert.equal(merged.generatedDomainContractDiagnostics?.present, true)
  assert.equal(merged.generatedDomainContractDiagnostics?.valid, true)
  assert.equal(
    merged.generatedDomainContractObservation?.status,
    'skipped',
    'Si legacy ya trae contrato valido, la observacion no debe sobrescribirlo.',
  )
}

function runPlannerObservationInvalidCase() {
  const legacyDecision = createLegacyObservationDecision()
  const merged = observationHarness.applyGeneratedDomainContractObservationToDecision({
    legacyDecision,
    observationResult: {
      attempted: true,
      ok: false,
      status: 'diagnostics-invalid',
      elapsedMs: 3300,
      generatedDomainContractDiagnostics: { present: false },
    },
  })

  assert.equal(merged.strategy, legacyDecision.strategy)
  assert.equal(merged.executionMode, legacyDecision.executionMode)
  assert.equal(merged.nextExpectedAction, legacyDecision.nextExpectedAction)
  assert.equal(merged.generatedDomainContractObservation?.status, 'diagnostics-invalid')
  assert.equal(merged.generatedDomainContractDiagnostics?.present, false)
}

function runPlannerObservationNoConfigStatusCase() {
  const result = observationHarness.buildGeneratedDomainContractObservationFailureResult({
    status: 'openai-unavailable',
    elapsedMs: 12,
    requestId: 'obs-no-config',
    errorKind: 'config-missing',
    errorPreview: 'OPENAI_API_KEY no configurada.',
  })

  assert.equal(result.status, 'openai-unavailable')
  assert.equal(result.errorKind, 'config-missing')
  assert.equal(result.generatedDomainContractDiagnostics?.present, false)
}

function runPlannerObservationTimeoutStatusCase() {
  const result = observationHarness.classifyGeneratedDomainContractObservationThrownError({
    name: 'AbortError',
    message: 'This operation was aborted',
  })

  assert.equal(result.status, 'timeout')
  assert.equal(result.errorKind, 'abort')
}

function runPlannerObservationOpenAIErrorStatusCase() {
  const result = observationHarness.buildGeneratedDomainContractObservationFailureResult({
    status: 'openai-error',
    elapsedMs: 2200,
    requestId: 'obs-http',
    errorKind: 'http',
    errorPreview: 'OpenAI Responses API devolvio 502 Bad Gateway.',
    httpStatus: 502,
  })

  assert.equal(result.status, 'openai-error')
  assert.equal(result.errorKind, 'http')
  assert.equal(result.httpStatus, 502)
}

function runPlannerObservationDebugSummaryCase() {
  const summary = observationHarness.summarizeGeneratedDomainContractObservationForDebug({
    attempted: true,
    ok: false,
    status: 'openai-error',
    elapsedMs: 61000,
    errorKind: 'TypeError',
    errorPreview: 'fetch failed',
    generatedDomainContractDiagnostics: { present: false },
  })

  assert.equal(summary.status, 'openai-error')
  assert.equal(summary.errorKind, 'TypeError')
  assert.equal(summary.errorPreview, 'fetch failed')
}

function createComparisonAlignedLegacyDecision() {
  const contract = createValidInventedContract()

  return {
    decisionKey: 'carnivorous-plant-nursery-fullstack-local-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    businessSector: 'carnivorous plant nursery',
    reason:
      'Fullstack local para carnivorous plant nursery con frontend publico, panel admin, panel care, backend local y database sqlite.',
    instruction:
      'Sin deploy, sin Docker, sin credenciales, sin servicios externos y con pagos solo mock.',
    sourceRoot: contract.root.sourceRoot,
    targetRoot: contract.root.targetRoot,
    tasks: [
      'Preparar frontend publico para catalogo de plantas carnivorous.',
      'Preparar panel admin para reportes y ventas mock.',
      'Preparar panel care para alertas de riego y mantenimiento.',
      'Definir backend routes y services locales.',
      'Definir database sqlite con schema y seed local.',
    ],
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      reason:
        'Entrega revisable con backend local, database sqlite, frontend publico, admin y care panel.',
      projectRoot: contract.root.targetRoot,
      allowedRootPaths: [
        contract.root.targetRoot,
        `${contract.root.targetRoot}/frontend/public/index.html`,
        `${contract.root.targetRoot}/frontend/admin/index.html`,
        `${contract.root.targetRoot}/frontend/care/index.html`,
        `${contract.root.targetRoot}/backend/src/server.js`,
      ],
      directories: [
        `${contract.root.targetRoot}/frontend/public`,
        `${contract.root.targetRoot}/frontend/admin`,
        `${contract.root.targetRoot}/frontend/care`,
        `${contract.root.targetRoot}/backend/src`,
        `${contract.root.targetRoot}/database`,
      ],
      filesToCreate: [
        { path: `${contract.root.targetRoot}/frontend/public/index.html` },
        { path: `${contract.root.targetRoot}/frontend/admin/index.html` },
        { path: `${contract.root.targetRoot}/frontend/care/index.html` },
        { path: `${contract.root.targetRoot}/backend/src/server.js` },
        { path: `${contract.root.targetRoot}/database/schema.sql` },
      ],
      explicitExclusions: [
        'Sin deploy',
        'Sin Docker',
        'Sin credenciales',
        'Sin servicios externos',
      ],
    },
    executionScope: {
      projectRoot: contract.root.targetRoot,
      allowedTargetPaths: [
        contract.root.targetRoot,
        `${contract.root.targetRoot}/frontend/public/index.html`,
        `${contract.root.targetRoot}/frontend/admin/index.html`,
        `${contract.root.targetRoot}/frontend/care/index.html`,
        `${contract.root.targetRoot}/backend/src/server.js`,
        `${contract.root.targetRoot}/database/schema.sql`,
      ],
    },
    generatedDomainContract: contract,
  }
}

function runGeneratedDomainContractComparisonComparedCase() {
  const comparison = buildGeneratedDomainContractComparison(
    createComparisonAlignedLegacyDecision(),
    repoRoot,
  )

  assert.equal(comparison.present, true)
  assert.equal(comparison.compared, true)
  assert.equal(comparison.status, 'compared')
  assert.equal(comparison.errorsCount, 0)
  assert.equal(comparison.warningsCount, 0)
  assert.equal(comparison.roots.aligned, true)
  assert.equal(comparison.backend.aligned, true)
  assert.equal(comparison.database.aligned, true)
  assert.equal(comparison.safety.aligned, true)
}

function runGeneratedDomainContractComparisonPartialCase() {
  const contract = createValidInventedContract()
  const comparison = buildGeneratedDomainContractComparison(
    {
      decisionKey: 'partial-generated-domain-contract-review',
      strategy: 'scalable-delivery-plan',
      executionMode: 'planner-only',
      nextExpectedAction: 'review-scalable-delivery',
      businessSector: 'education',
      reason: 'Plan legacy todavia incompleto para una entrega futura.',
      generatedDomainContract: contract,
    },
    repoRoot,
  )

  assert.equal(comparison.present, true)
  assert.equal(comparison.compared, true)
  assert.equal(comparison.status, 'partial')
  assert.ok(comparison.warningsCount > 0)
  assert.equal(comparison.errorsCount, 0)
}

function runGeneratedDomainContractComparisonNotAvailableCase() {
  const comparison = buildGeneratedDomainContractComparison(
    {
      decisionKey: 'legacy-only-plan',
      strategy: 'scalable-delivery-plan',
      executionMode: 'planner-only',
      nextExpectedAction: 'review-scalable-delivery',
    },
    repoRoot,
  )

  assert.equal(comparison.present, false)
  assert.equal(comparison.compared, false)
  assert.equal(comparison.status, 'not-available')
  assert.equal(comparison.warningsCount, 0)
  assert.equal(comparison.errorsCount, 0)
}

function runGeneratedDomainCapabilityProfileBuiltCase() {
  const contract = createValidInventedContract()
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    { generatedDomainContract: contract },
    repoRoot,
  )
  const profile = buildGeneratedDomainCapabilityProfile(contract, diagnostics)

  assert.equal(profile.present, true)
  assert.equal(profile.built, true)
  assert.equal(profile.status, 'built')
  assert.equal(profile.behaviorChanged, false)
  assert.equal(profile.delivery.fullstackLocal, true)
  assert.equal(profile.backend.present, true)
  assert.equal(profile.database.present, true)
  assert.equal(profile.materialization.hasAllowedTargets, true)
  assert.equal(profile.materialization.hasRequiredGroups, true)
  assert.equal(profile.safety.safeForLocalMaterialization, true)
}

function runGeneratedDomainCapabilityProfileNotAvailableCase() {
  const profile = buildGeneratedDomainCapabilityProfile(null)

  assert.equal(profile.present, false)
  assert.equal(profile.built, false)
  assert.equal(profile.status, 'not-available')
  assert.equal(profile.errorsCount, 0)
}

function runGeneratedDomainCapabilityProfilePartialCase() {
  const contract = createSparseDeliveryLevelContract('fullstack-local')
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    { generatedDomainContract: contract },
    repoRoot,
  )
  const profile = buildGeneratedDomainCapabilityProfile(contract, diagnostics)

  assert.equal(profile.present, true)
  assert.equal(profile.built, true)
  assert.ok(
    profile.status === 'partial' || (profile.status === 'built' && profile.warningsCount > 0),
    'El capability profile parcial debe construirse sin romper el flujo.',
  )
  assert.equal(profile.errorsCount, 0)
}

async function runPlannerObservationNormalizeAvailabilityCase() {
  assert.equal(
    typeof observationHarness.observeGeneratedDomainContractForPlannerDecision,
    'function',
    'El harness debe exponer la ruta real de observacion contract-only.',
  )

  const contract = createValidInventedContract()
  const originalApiKey = process.env.OPENAI_API_KEY
  const originalBaseUrl = process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_BASE_URL
  const originalFetch = observationHarnessSandbox.fetch

  process.env.OPENAI_API_KEY = 'sk-test-local-generated-domain-contract'
  process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_BASE_URL = 'https://example.invalid/v1/responses'
  observationHarnessSandbox.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        output_text: JSON.stringify({
          generatedDomainContract: contract,
        }),
      }),
  })

  try {
    const result = await observationHarness.observeGeneratedDomainContractForPlannerDecision({
      goal: 'Preparar una escuela de oficios barrial local segura.',
      context:
        'Cursos, alumnos, docentes, reportes, becas mock y pagos simulados sin integraciones externas.',
      workspacePath: repoRoot,
      legacyDecision: createLegacyObservationDecision(),
      costMode: 'standard',
      requestId: 'obs-normalize-available',
    })

    assert.equal(
      result.status,
      'ok',
      'La observacion local con fetch stub debe completar la normalizacion sin ReferenceError.',
    )
    assert.equal(result.ok, true)
    assert.equal(result.generatedDomainContractDiagnostics?.present, true)
    assert.equal(result.generatedDomainContractDiagnostics?.valid, true)
    assert.equal(result.generatedDomainContractDiagnostics?.safeForLocalMaterialization, true)
    assert.ok(result.generatedDomainContract)
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = originalApiKey
    }

    if (originalBaseUrl === undefined) {
      delete process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_BASE_URL
    } else {
      process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_BASE_URL = originalBaseUrl
    }

    observationHarnessSandbox.fetch = originalFetch
  }
}

function runDiagnosticsDebugPreviewCase() {
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    {
      generatedDomainContract: createDiagnosticsPreviewInvalidContract(),
    },
    repoRoot,
  )

  assert.equal(diagnostics.present, true)
  assert.ok(diagnostics.errors.length > 0, 'El contrato invalido debe producir errores.')
  assert.ok(diagnostics.warnings.length > 0, 'El contrato invalido debe producir warnings.')

  const previewDiagnostics = {
    ...diagnostics,
    errors: [
      ...diagnostics.errors,
      'headers: {"Authorization":"Bearer sk-live-abcdefghijklmnopqrstuvwxyz123456"} body: {"token":"sk-live-abcdefghijklmnopqrstuvwxyz123456","nested":"value"} payload={"apiKey":"sk-live-abcdefghijklmnopqrstuvwxyz123456"}',
      'Operacion fuera de scope o absoluta: C:/Users/letas/Desktop/Proyectos/Desarrollo/orquestadoria/ai-orchestrator/tmp/generated-domain-contract-preview/with/a/very/long/absolute/path/to/materialization/contracts/generated-domain-contract/debug-preview/backend/src/server.js',
      `Detalle extendido del contrato invalido ${'x'.repeat(320)}`,
    ],
    warnings: [
      ...diagnostics.warnings,
      'warning con token=sk-test-abcdefghijklmnopqrstuvwxyz123456 y path /Users/letas/Desktop/Proyectos/Desarrollo/orquestadoria/ai-orchestrator/tmp/generated-domain-contract-preview/frontend/public/index.html',
    ],
  }
  const summary =
    observationHarness.summarizeGeneratedDomainContractDiagnosticsForDebug(previewDiagnostics)

  assert.ok(summary.errorsCount > 0, 'El summary debe reportar errorsCount > 0.')
  assert.equal(typeof summary.firstError, 'string')
  assert.ok(summary.firstError.length > 0, 'El summary debe exponer firstError.')
  assert.ok(Array.isArray(summary.errorsPreview), 'El summary debe exponer errorsPreview.')
  assert.ok(summary.errorsPreview.length <= 3, 'errorsPreview debe truncarse a 3 entradas.')
  assert.equal(typeof summary.firstWarning, 'string')
  assert.ok(summary.firstWarning.length > 0, 'El summary debe exponer firstWarning.')
  assert.ok(Array.isArray(summary.warningsPreview), 'El summary debe exponer warningsPreview.')
  assert.ok(summary.warningsPreview.length <= 3, 'warningsPreview debe truncarse a 3 entradas.')

  for (const entry of [...summary.errorsPreview, ...summary.warningsPreview]) {
    assert.ok(entry.length <= 240, 'Cada preview debe truncarse a 240 caracteres.')
    assert.ok(!entry.includes('sk-live-'), 'Ningun preview debe exponer API keys.')
    assert.ok(!entry.includes('sk-test-'), 'Ningun preview debe exponer tokens.')
    assert.ok(!entry.includes('Bearer sk-'), 'Ningun preview debe exponer bearer tokens.')
    assert.ok(!entry.includes(repoRoot.replace(/\\/g, '/')), 'Los paths absolutos largos deben compactarse.')
  }

  assert.ok(
    summary.errorsPreview.some((entry) => entry.includes('[redacted]')),
    'Al menos un error preview debe mostrar sanitizacion.',
  )

  const observationSummary = observationHarness.summarizeGeneratedDomainContractObservationForDebug({
    attempted: true,
    ok: false,
    status: 'diagnostics-invalid',
    elapsedMs: 1500,
    generatedDomainContractDiagnostics: previewDiagnostics,
  })

  assert.equal(observationSummary.status, 'diagnostics-invalid')
  assert.equal(observationSummary.firstError, summary.firstError)
  assert.deepEqual(observationSummary.errorsPreview, summary.errorsPreview)
  assert.equal(observationSummary.firstWarning, summary.firstWarning)
  assert.deepEqual(observationSummary.warningsPreview, summary.warningsPreview)
}

async function main() {
  runValidContractCase()
  runDeliveryLevelExactCase()
  runCompatibleDeliveryLevelsCase()
  runScalableDeliveryPlanWithFullstackSignalsCase()
  runPlannerOnlyScalableDeliveryWithFullstackSignalsCase()
  runPlannerOnlyScalableDeliveryWithoutSignalsCase()
  runScalableDeliveryPlanWithoutSignalsCase()
  runIncompatibleDeliveryLevelsCase()
  runDangerousDeliveryLevelsCase()
  runWindowsDoubleSlashPathCase()
  runRelativeDotRootCase()
  runRelativeBackslashRootCase()
  runRelativeTraversalCase()
  runRelativeRootMismatchCase()
  runSystemPathOutsideWorkspaceCase()
  runRelativeSystemPathCase()
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
  runGeneratedDomainContractComparisonComparedCase()
  runGeneratedDomainContractComparisonPartialCase()
  runGeneratedDomainContractComparisonNotAvailableCase()
  runGeneratedDomainCapabilityProfileBuiltCase()
  runGeneratedDomainCapabilityProfileNotAvailableCase()
  runGeneratedDomainCapabilityProfilePartialCase()
  runBrainDecisionContractObservationCase()
  runLegacyDomainResolutionDiagnosticsUsedCase()
  runLegacyDomainResolutionDiagnosticsWithGeneratedContractCase()
  runLegacyDomainResolutionDiagnosticsNotUsedCase()
  runLegacyCapabilityAlignmentDiagnosticsAlignedCase()
  runLegacyCapabilityAlignmentDiagnosticsDivergentCase()
  runLegacyCapabilityAlignmentDiagnosticsLegacyFallbackCase()
  runLegacyCapabilityAlignmentDiagnosticsNotAvailableCase()
  runPlannerObservationMergeOkCase()
  runPlannerObservationMergeTimeoutCase()
  runPlannerObservationLegacyAlreadyHasContractCase()
  runPlannerObservationInvalidCase()
  runPlannerObservationNoConfigStatusCase()
  runPlannerObservationTimeoutStatusCase()
  runPlannerObservationOpenAIErrorStatusCase()
  runPlannerObservationDebugSummaryCase()
  await runPlannerObservationNormalizeAvailabilityCase()
  runDiagnosticsDebugPreviewCase()
  console.log('OK. GeneratedDomainContract smoke paso 52/52 checks.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
