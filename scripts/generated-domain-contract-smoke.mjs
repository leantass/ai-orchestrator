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
  buildGeneratedDomainMaterializationShadowPlan,
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
  buildGeneratedDomainMaterializationPreferenceSwitch,
  buildGeneratedDomainMaterializationSwitchReadinessReport,
  resolveGeneratedDomainMaterializationSource,
  buildGeneratedDomainShadowMaterializationCandidatePlan,
  buildGeneratedDomainShadowCandidateLegacyComparison,
  buildGeneratedDomainShadowMaterializationEndToEndReadiness,
  buildGeneratedDomainControlledEnablePolicy,
  buildGeneratedDomainFirstControlledEnableScenario,
  buildGeneratedDomainFileCreationApprovalPolicy,
  buildGeneratedDomainUniversalMaterializationPlanPreview,
  buildGeneratedDomainUniversalMaterializationPlanPreviewComparison,
  deriveGeneratedDomainStructuralCapabilities,
  buildLegacyDomainHardcodingDebtReport,
  buildLocalDeterministicExecutorLegacyDebtReport,
  buildLocalDeterministicExecutorCapabilityMigrationPlan,
  buildGeneratedDomainMaterializationInspectionSourceResolution,
  buildGeneratedDomainMaterializationApprovalPayload,
  buildGeneratedDomainRuntimeShadowReadinessDecision,
  buildLegacyDomainResolutionDiagnostics,
  buildLegacyCapabilityAlignmentDiagnostics,
  buildLegacyMigrationCandidateReport,
  buildGeneratedDomainCapabilityProfile,
  buildGeneratedDomainMaterializationShadowPlan,
  inspectFullstackLocalMaterializationContract,
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
  summarizeFullstackLocalInspectionSourceDiagnosticsForDebug,
  summarizeGeneratedDomainMaterializationShadowPlanForDebug,
  summarizeGeneratedDomainMaterializationShadowComparisonForDebug,
  summarizeGeneratedDomainMaterializationShadowDiffForDebug,
  summarizeGeneratedDomainMaterializationPreferenceDecisionForDebug,
  summarizeGeneratedDomainMaterializationPreferenceSwitchForDebug,
  summarizeGeneratedDomainMaterializationSwitchReadinessReportForDebug,
  summarizeGeneratedDomainMaterializationSourceResolutionForDebug,
  summarizeGeneratedDomainShadowMaterializationCandidatePlanForDebug,
  summarizeGeneratedDomainShadowCandidateLegacyComparisonForDebug,
  summarizeGeneratedDomainShadowMaterializationEndToEndReadinessForDebug,
  summarizeGeneratedDomainControlledEnablePolicyForDebug,
  summarizeGeneratedDomainFirstControlledEnableScenarioForDebug,
  summarizeGeneratedDomainFileCreationApprovalPolicyForDebug,
  summarizeGeneratedDomainUniversalMaterializationPlanPreviewForDebug,
  summarizeGeneratedDomainUniversalMaterializationPlanPreviewComparisonForDebug,
  summarizeGeneratedDomainStructuralCapabilitiesForDebug,
  summarizeLegacyDomainHardcodingDebtReportForDebug,
  summarizeLocalDeterministicExecutorLegacyDebtReportForDebug,
  summarizeLocalDeterministicExecutorCapabilityMigrationPlanForDebug,
  summarizeGeneratedDomainMaterializationInspectionSourceResolutionForDebug,
  summarizeGeneratedDomainMaterializationApprovalPayloadForDebug,
  summarizeGeneratedDomainRuntimeShadowReadinessDecisionForDebug,
  summarizeDomainConsistencyDiagnosticsForDebug,
  summarizeLegacyCapabilityAlignmentDiagnosticsForDebug,
  summarizeLegacyMigrationCandidateReportForDebug,
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
    deriveAllowedTargetPathsFromContract,
    deriveRequiredPathGroupsFromContract,
    deriveForbiddenSearchPatternsFromContract,
    isContractSafeForLocalMaterialization,
    buildGeneratedDomainContractDiagnostics,
    buildGeneratedDomainCapabilityProfile,
    buildGeneratedDomainMaterializationShadowPlan,
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

function runLegacyMigrationCandidateReportNoActionCase() {
  const generatedDomainContract = createValidInventedContract()
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-migration-report-no-action',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Observar un caso alineado sin uso legacy.',
    instruction: 'Mantener el review sin cambios.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const report = decision.legacyMigrationCandidateReport
  const debugSummary =
    observationHarness.summarizeLegacyMigrationCandidateReportForDebug(report)

  assert.equal(report?.present, true)
  assert.equal(report?.evaluated, true)
  assert.equal(report?.status, 'no-action')
  assert.equal(report?.behaviorChanged, false)
  assert.equal(report?.recommendation?.action, 'observe')
  assert.equal(report?.capabilityProfile?.sufficient, true)
  assert.equal(report?.legacy?.used, false)
  assert.equal(report?.warningsCount, 0)
  assert.equal(debugSummary.recommendedAction, 'observe')
}

function runLegacyMigrationCandidateReportCandidateCase() {
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
    reason: 'Forzar uso legacy observacional con capability profile suficiente.',
  })
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-migration-report-candidate',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Detectar candidato de migracion sin cambiar comportamiento.',
    instruction: 'Solo observar.',
    completed: false,
    requiresApproval: false,
    tasks: scalableDeliveryPlan.tasks,
    assumptions: scalableDeliveryPlan.assumptions,
    scalableDeliveryPlan: scalableDeliveryPlan.scalableDeliveryPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const report = decision.legacyMigrationCandidateReport

  assert.equal(report?.present, true)
  assert.equal(report?.evaluated, true)
  assert.equal(report?.status, 'candidate')
  assert.equal(report?.behaviorChanged, false)
  assert.equal(report?.recommendation?.action, 'prepare-capability-preference')
  assert.equal(report?.alignment?.migrationCandidate, true)
  assert.ok((report?.warningsCount || 0) > 0)
}

function runLegacyMigrationCandidateReportFallbackNeededCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'legacy-migration-report-fallback-needed',
    strategy: 'safe-first-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-safe-first-delivery',
    reason: 'Observar fallback legacy cuando falta capability profile.',
    instruction: 'No cambiar nada.',
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
  const report = decision.legacyMigrationCandidateReport

  assert.equal(report?.present, true)
  assert.equal(report?.evaluated, true)
  assert.equal(report?.status, 'fallback-needed')
  assert.equal(report?.behaviorChanged, false)
  assert.equal(report?.recommendation?.action, 'keep-legacy-fallback')
  assert.equal(report?.alignment?.legacyFallbackLikelyNeeded, true)
}

function runLegacyMigrationCandidateReportErrorCase() {
  const report = observationHarness.buildLegacyMigrationCandidateReport({
    generatedDomainCapabilityProfile: {},
    legacyDomainResolutionDiagnostics: {},
    legacyCapabilityAlignmentDiagnostics: {
      present: true,
      compared: true,
      status: 'error',
      behaviorChanged: false,
      alignment: {},
      errors: ['alignment exploded in observation'],
    },
  })

  assert.equal(report?.present, true)
  assert.equal(report?.evaluated, true)
  assert.equal(report?.status, 'error')
  assert.equal(report?.behaviorChanged, false)
  assert.equal(report?.recommendation?.action, 'investigate')
  assert.ok((report?.errorsCount || 0) > 0)
}

function buildInspectionReadyMaterializationPlan(contract, { includeExplicitContract = false } = {}) {
  const normalizedContract = normalizeGeneratedDomainContract(contract)
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(normalizedContract, '.')
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(normalizedContract)
  const explicitRequiredPathGroups = requiredPathGroups.map((entry, index) => ({
    label: Array.isArray(entry) ? entry.join('|') : `group-${index + 1}`,
    candidates: Array.isArray(entry) ? entry.filter(Boolean) : [],
  }))

  return {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: normalizedContract.root.targetRoot,
    allowedTargetPaths,
    ...(includeExplicitContract
      ? {
          contractDefinition: {
            contractKind: 'explicit-materialization-contract',
            rootFolder: normalizedContract.root.targetRoot,
            allowedRootBasenames: [normalizedContract.root.targetRoot],
            preferredRootBasenames: [normalizedContract.root.targetRoot],
            forbiddenSignals: ['web-scaffold-base'],
            primaryPersistencePaths: [
              normalizedContract.database.schemaFile,
              normalizedContract.database.seedFile,
            ],
            jsonPrimaryPersistencePaths: [],
            requiredPathGroups: explicitRequiredPathGroups,
            requiredPaths: explicitRequiredPathGroups.map((entry) => entry.label),
            expectedTargetPaths: explicitRequiredPathGroups
              .map((entry) => entry.candidates[0])
              .filter(Boolean),
          },
        }
      : {}),
    operations: allowedTargetPaths.map((targetPath) => ({
      type: 'create-or-edit-file',
      targetPath,
      nextContent: `// ${targetPath}\n`,
    })),
  }
}

function runCapabilityPreferredInspectionUsesGeneratedContractCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract)
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'capability-preferred-inspection-generated-contract',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Preferir generatedDomainContract valido para inspeccion fullstack local.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diagnostics = decision.fullstackLocalInspectionSourceDiagnostics
  const contractInspection = observationHarness.inspectFullstackLocalMaterializationContract({
    goal: 'Inspeccionar scaffold fullstack local con contrato universal.',
    context: '',
    decisionKey: decision.decisionKey,
    strategy: decision.strategy,
    executionMode: decision.executionMode,
    nextExpectedAction: decision.nextExpectedAction,
    executionScope: decision.executionScope,
    materializationPlan: decision.materializationPlan,
    localProjectManifest: decision.localProjectManifest,
    existingProjectDetection: decision.existingProjectDetection,
    generatedDomainContract: decision.generatedDomainContract,
    generatedDomainContractDiagnostics: decision.generatedDomainContractDiagnostics,
    generatedDomainCapabilityProfile: decision.generatedDomainCapabilityProfile,
  })

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.source, 'generated-domain-contract')
  assert.equal(diagnostics?.generatedDomainContractUsed, true)
  assert.equal(diagnostics?.legacyCanonicalContractUsed, false)
  assert.equal(diagnostics?.behaviorChanged, false)
  assert.equal(contractInspection?.fullstackLocalInspectionSourceDiagnostics?.source, 'generated-domain-contract')
  assert.equal(decision.strategy, 'materialize-fullstack-local-plan')
  assert.equal(decision.executionMode, 'executor')
  assert.equal(decision.nextExpectedAction, 'execute-plan')
}

function runCapabilityPreferredInspectionUsesExplicitContractCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract, {
    includeExplicitContract: true,
  })
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'capability-preferred-inspection-explicit-contract',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Respetar contractDefinition explicito antes del contrato universal.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  assert.equal(decision.fullstackLocalInspectionSourceDiagnostics?.present, true)
  assert.equal(
    decision.fullstackLocalInspectionSourceDiagnostics?.source,
    'explicit-materialization-contract',
  )
  assert.equal(
    decision.fullstackLocalInspectionSourceDiagnostics?.explicitMaterializationContractUsed,
    true,
  )
  assert.equal(
    decision.fullstackLocalInspectionSourceDiagnostics?.legacyCanonicalContractUsed,
    false,
  )
}

function runCapabilityPreferredInspectionUsesLegacyFallbackCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'capability-preferred-inspection-legacy-fallback',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Mantener fallback legacy cuando falta generatedDomainContract.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: [
        'generic-ops-local',
        'generic-ops-local/backend/src/server.js',
        'generic-ops-local/database/schema.sql',
      ],
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'generic-ops-local',
      allowedTargetPaths: [
        'generic-ops-local',
        'generic-ops-local/backend/src/server.js',
        'generic-ops-local/database/schema.sql',
      ],
      operations: [
        { type: 'create-folder', targetPath: 'generic-ops-local' },
        { type: 'create-or-edit-file', targetPath: 'generic-ops-local/backend/src/server.js' },
      ],
    },
    workspacePath: repoRoot,
  })

  assert.equal(decision.fullstackLocalInspectionSourceDiagnostics?.present, true)
  assert.equal(decision.fullstackLocalInspectionSourceDiagnostics?.source, 'legacy-canonical-contract')
  assert.equal(decision.fullstackLocalInspectionSourceDiagnostics?.fallbackUsed, true)
  assert.equal(decision.fullstackLocalInspectionSourceDiagnostics?.behaviorChanged, false)
}

function runCapabilityPreferredInspectionUnavailableCase() {
  const inspection = observationHarness.inspectFullstackLocalMaterializationContract({
    goal: '',
    context: '',
    decisionKey: 'capability-preferred-inspection-unavailable',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    executionScope: null,
    materializationPlan: null,
    localProjectManifest: null,
    existingProjectDetection: null,
    generatedDomainContract: null,
    generatedDomainContractDiagnostics: null,
    generatedDomainCapabilityProfile: null,
  })
  const debugSummary =
    observationHarness.summarizeFullstackLocalInspectionSourceDiagnosticsForDebug(
      inspection.fullstackLocalInspectionSourceDiagnostics,
    )

  assert.equal(inspection?.fullstackLocalInspectionSourceDiagnostics?.source, 'unavailable')
  assert.equal(inspection?.ok, false)
  assert.equal(debugSummary.source, 'unavailable')
}

function runGeneratedDomainMaterializationShadowComparisonWithoutLegacyCase() {
  const generatedDomainContract = createValidInventedContract()
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-without-legacy',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Construir shadow plan observacional sin plan legacy comparable.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const shadowPlan = decision.generatedDomainMaterializationShadowPlan
  const comparison = decision.generatedDomainMaterializationShadowComparison

  assert.equal(shadowPlan?.present, true)
  assert.equal(shadowPlan?.status, 'built')
  assert.equal(comparison?.present, true)
  assert.equal(comparison?.compared, false)
  assert.equal(comparison?.status, 'partial')
  assert.equal(comparison?.recommendation, 'observe')
  assert.equal(comparison?.behaviorChanged, false)
  assert.equal(decision.strategy, 'scalable-delivery-plan')
  assert.equal(decision.executionMode, 'planner-only')
  assert.equal(decision.nextExpectedAction, 'review-scalable-delivery')
}

function runGeneratedDomainMaterializationShadowComparisonAlignedCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract)
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-aligned',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Comparar shadow plan universal con materializationPlan compatible.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const comparison = decision.generatedDomainMaterializationShadowComparison
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationShadowComparisonForDebug(
      comparison,
    )

  assert.equal(decision.generatedDomainMaterializationShadowPlan?.status, 'built')
  assert.equal(comparison?.present, true)
  assert.equal(comparison?.compared, true)
  assert.equal(comparison?.status, 'aligned')
  assert.equal(comparison?.migrationCandidate, true)
  assert.equal(comparison?.recommendation, 'prepare-shadow-preference')
  assert.equal(comparison?.behaviorChanged, false)
  assert.equal(debugSummary.status, 'aligned')
}

function runGeneratedDomainMaterializationShadowComparisonKeepLegacyCase() {
  const generatedDomainContract = createSparseDeliveryLevelContract('safe-first-delivery')
  const materializationPlan = {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: 'sparse-contract-local',
    allowedTargetPaths: [
      'sparse-contract-local',
      'sparse-contract-local/backend/src/server.js',
      'sparse-contract-local/database/schema.sql',
    ],
    operations: [
      { type: 'create-folder', targetPath: 'sparse-contract-local' },
      {
        type: 'create-or-edit-file',
        targetPath: 'sparse-contract-local/backend/src/server.js',
      },
      {
        type: 'create-or-edit-file',
        targetPath: 'sparse-contract-local/database/schema.sql',
      },
    ],
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-keep-legacy',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Mantener legacy cuando el shadow plan universal es incompleto.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const comparison = decision.generatedDomainMaterializationShadowComparison

  assert.equal(decision.generatedDomainMaterializationShadowPlan?.status, 'partial')
  assert.equal(comparison?.present, true)
  assert.equal(comparison?.status, 'partial')
  assert.equal(comparison?.recommendation, 'keep-legacy')
  assert.equal(comparison?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationShadowComparisonWithoutContractCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-no-contract',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Mantener legacy cuando no existe generatedDomainContract.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: [
        'generic-ops-local',
        'generic-ops-local/backend/src/server.js',
        'generic-ops-local/database/schema.sql',
      ],
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'generic-ops-local',
      allowedTargetPaths: [
        'generic-ops-local',
        'generic-ops-local/backend/src/server.js',
        'generic-ops-local/database/schema.sql',
      ],
      operations: [
        { type: 'create-folder', targetPath: 'generic-ops-local' },
        {
          type: 'create-or-edit-file',
          targetPath: 'generic-ops-local/backend/src/server.js',
        },
      ],
    },
    workspacePath: repoRoot,
  })
  const shadowPlan = decision.generatedDomainMaterializationShadowPlan
  const comparison = decision.generatedDomainMaterializationShadowComparison

  assert.equal(shadowPlan?.present, false)
  assert.equal(shadowPlan?.status, 'not-available')
  assert.equal(comparison?.present, true)
  assert.equal(comparison?.status, 'partial')
  assert.equal(comparison?.recommendation, 'keep-legacy')
  assert.equal(comparison?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceGateEligibleCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract)
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-gate-eligible',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Evaluar elegibilidad futura del shadow plan cuando la comparacion esta alineada.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const gate = decision.generatedDomainMaterializationPreferenceGate

  assert.equal(gate?.present, true)
  assert.equal(gate?.evaluated, true)
  assert.equal(gate?.status, 'eligible')
  assert.equal(gate?.eligibility?.canPreferShadowInFuture, true)
  assert.equal(gate?.eligibility?.blockedByDivergence, false)
  assert.equal(gate?.recommendation?.action, 'prepare-preference-switch')
  assert.equal(gate?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceGateNeedsMoreEvidenceCase() {
  const generatedDomainContract = createValidInventedContract()
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-gate-needs-evidence',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Evaluar gate sin materializationPlan legacy comparable.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const gate = decision.generatedDomainMaterializationPreferenceGate

  assert.equal(gate?.present, true)
  assert.equal(gate?.status, 'not-ready')
  assert.equal(gate?.eligibility?.needsMoreEvidence, true)
  assert.equal(gate?.eligibility?.canPreferShadowInFuture, false)
  assert.equal(gate?.recommendation?.action, 'observe')
  assert.equal(gate?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceGateNotReadyCase() {
  const generatedDomainContract = createSparseDeliveryLevelContract('safe-first-delivery')
  const materializationPlan = {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: 'sparse-contract-local',
    allowedTargetPaths: [
      'sparse-contract-local',
      'sparse-contract-local/backend/src/server.js',
      'sparse-contract-local/database/schema.sql',
    ],
    operations: [
      { type: 'create-folder', targetPath: 'sparse-contract-local' },
      {
        type: 'create-or-edit-file',
        targetPath: 'sparse-contract-local/backend/src/server.js',
      },
    ],
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-gate-not-ready',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'El shadow plan aun no tiene cobertura suficiente para preferencia futura.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const gate = decision.generatedDomainMaterializationPreferenceGate

  assert.equal(gate?.present, true)
  assert.equal(gate?.status, 'not-ready')
  assert.equal(
    gate?.eligibility?.blockedByMissingRequiredGroups === true ||
      gate?.eligibility?.blockedByMissingAllowedTargets === true ||
      gate?.eligibility?.needsLegacyFallback === true,
    true,
  )
  assert.equal(gate?.eligibility?.canPreferShadowInFuture, false)
  assert.equal(
    gate?.recommendation?.action === 'keep-legacy' || gate?.recommendation?.action === 'observe',
    true,
  )
  assert.equal(gate?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceGateBlockedCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: 'legacy-mismatch-root',
    allowedTargetPaths: [
      'legacy-mismatch-root',
      'legacy-mismatch-root/backend/src/server.js',
      'legacy-mismatch-root/database/schema.sql',
    ],
    operations: [
      { type: 'create-folder', targetPath: 'legacy-mismatch-root' },
      {
        type: 'create-or-edit-file',
        targetPath: 'legacy-mismatch-root/backend/src/server.js',
      },
      {
        type: 'create-or-edit-file',
        targetPath: 'legacy-mismatch-root/database/schema.sql',
      },
    ],
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-gate-blocked',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Detectar divergencia entre shadow plan y legacy plan.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const gate = decision.generatedDomainMaterializationPreferenceGate

  assert.equal(gate?.present, true)
  assert.equal(gate?.status, 'blocked')
  assert.equal(gate?.eligibility?.blockedByDivergence, true)
  assert.equal(gate?.eligibility?.canPreferShadowInFuture, false)
  assert.equal(gate?.recommendation?.action, 'investigate')
  assert.equal(gate?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationShadowDiffWithoutLegacyCase() {
  const generatedDomainContract = createValidInventedContract()
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-diff-without-legacy',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Comparar shadow plan sin legacy materializationPlan disponible.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diff = decision.generatedDomainMaterializationShadowDiff
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationShadowDiffForDebug(diff)

  assert.equal(diff?.present, true)
  assert.equal(diff?.compared, false)
  assert.equal(diff?.status, 'partial')
  assert.equal(diff?.recommendation?.action, 'observe')
  assert.equal(diff?.warningsCount > 0, true)
  assert.equal(diff?.behaviorChanged, false)
  assert.equal(debugSummary.status, 'partial')
}

function runGeneratedDomainMaterializationShadowDiffComparedCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract)
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-diff-compared',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Comparar shadow plan con un legacy materializationPlan compatible.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diff = decision.generatedDomainMaterializationShadowDiff

  assert.equal(diff?.present, true)
  assert.equal(diff?.compared, true)
  assert.equal(diff?.status, 'compared')
  assert.equal(diff?.allowedTargets?.overlapCount > 0, true)
  assert.equal(diff?.requiredGroups?.overlapCount > 0, true)
  assert.equal(
    diff?.recommendation?.action === 'prepare-preference-switch' ||
      diff?.recommendation?.action === 'observe',
    true,
  )
  assert.equal(diff?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationShadowDiffDivergentCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: 'legacy-shadow-diff-mismatch',
    allowedTargetPaths: [
      'legacy-shadow-diff-mismatch',
      'legacy-shadow-diff-mismatch/backend/src/server.js',
      'legacy-shadow-diff-mismatch/README.md',
    ],
    operations: [
      { type: 'create-folder', targetPath: 'legacy-shadow-diff-mismatch' },
      {
        type: 'create-or-edit-file',
        targetPath: 'legacy-shadow-diff-mismatch/backend/src/server.js',
      },
      {
        type: 'create-or-edit-file',
        targetPath: 'legacy-shadow-diff-mismatch/README.md',
        nextContent: 'ACCESS_TOKEN=legacy',
      },
    ],
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-diff-divergent',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Detectar divergencia entre shadow plan y materializationPlan legacy.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diff = decision.generatedDomainMaterializationShadowDiff

  assert.equal(diff?.present, true)
  assert.equal(diff?.status, 'divergent')
  assert.equal(diff?.recommendation?.action, 'investigate')
  assert.equal(diff?.roots?.aligned, false)
  assert.equal(diff?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationShadowDiffWithoutContractCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-diff-no-contract',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Mantener legacy cuando no hay shadow plan universal para diff.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: [
        'generic-shadow-diff-local',
        'generic-shadow-diff-local/backend/src/server.js',
      ],
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'generic-shadow-diff-local',
      allowedTargetPaths: [
        'generic-shadow-diff-local',
        'generic-shadow-diff-local/backend/src/server.js',
      ],
      operations: [
        { type: 'create-folder', targetPath: 'generic-shadow-diff-local' },
        {
          type: 'create-or-edit-file',
          targetPath: 'generic-shadow-diff-local/backend/src/server.js',
        },
      ],
    },
    workspacePath: repoRoot,
  })
  const diff = decision.generatedDomainMaterializationShadowDiff

  assert.equal(diff?.present, true)
  assert.equal(diff?.status, 'partial')
  assert.equal(diff?.recommendation?.action, 'keep-legacy')
  assert.equal(diff?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceDecisionWouldPreferShadowCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract)
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-decision-shadow',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Simular la preferencia shadow sin activarla cuando la evidencia estructural esta alineada.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'carnivorous-plants-local',
    targetRoot: 'carnivorous-plants-local',
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'carnivorous plant nursery',
      coreModules: ['plants', 'visits', 'reports'],
    },
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'carnivorous plant nursery',
      intent: 'manage visits, care routines and local reports',
      deliveryLevel: 'fullstack-local',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'carnivorous-plants-local',
      domain: 'carnivorous plant nursery',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const dryRun = decision.generatedDomainMaterializationPreferenceDecision
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationPreferenceDecisionForDebug(
      dryRun,
    )

  assert.equal(dryRun?.present, true)
  assert.equal(dryRun?.evaluated, true)
  assert.equal(dryRun?.mode, 'dry-run')
  assert.equal(dryRun?.enabled, false)
  assert.equal(dryRun?.status, 'would-prefer-shadow')
  assert.equal(dryRun?.dryRun?.wouldPreferShadow, true)
  assert.equal(dryRun?.actual?.materializationSource, 'legacy')
  assert.equal(dryRun?.inputs?.domainConsistencyStatus, 'consistent')
  assert.equal(dryRun?.recommendation?.action, 'enable-shadow-preference-later')
  assert.equal(dryRun?.behaviorChanged, false)
  assert.equal(debugSummary.status, 'would-prefer-shadow')
}

function runGeneratedDomainMaterializationPreferenceDecisionWouldKeepLegacyCase() {
  const generatedDomainContract = createValidInventedContract()
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-decision-legacy',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Mantener legacy en dry-run cuando falta evidencia comparativa.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'carnivorous-plants-local',
    targetRoot: 'carnivorous-plants-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'carnivorous plant nursery',
      intent: 'manage visits, care routines and local reports',
      deliveryLevel: 'fullstack-local',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'carnivorous-plants-local',
      domain: 'carnivorous plant nursery',
      projectType: 'fullstack-local-app',
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const dryRun = decision.generatedDomainMaterializationPreferenceDecision

  assert.equal(dryRun?.present, true)
  assert.equal(dryRun?.status, 'would-keep-legacy')
  assert.equal(dryRun?.dryRun?.wouldKeepLegacy, true)
  assert.equal(dryRun?.recommendation?.action, 'observe')
  assert.equal(dryRun?.actual?.materializationSource, 'none')
  assert.equal(dryRun?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceDecisionBlockedCase() {
  const generatedDomainContract = createValidInventedContract()
  const materializationPlan = {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: 'legacy-preference-decision-mismatch',
    allowedTargetPaths: [
      'legacy-preference-decision-mismatch',
      'legacy-preference-decision-mismatch/backend/src/server.js',
      'legacy-preference-decision-mismatch/README.md',
    ],
    operations: [
      { type: 'create-folder', targetPath: 'legacy-preference-decision-mismatch' },
      {
        type: 'create-or-edit-file',
        targetPath: 'legacy-preference-decision-mismatch/backend/src/server.js',
      },
      {
        type: 'create-or-edit-file',
        targetPath: 'legacy-preference-decision-mismatch/README.md',
      },
    ],
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-decision-blocked',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Detectar bloqueo observacional cuando hay divergencia estructural.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    executionScope: {
      allowedTargetPaths: materializationPlan.allowedTargetPaths,
    },
    materializationPlan,
    workspacePath: repoRoot,
  })
  const dryRun = decision.generatedDomainMaterializationPreferenceDecision

  assert.equal(dryRun?.present, true)
  assert.equal(dryRun?.status, 'blocked')
  assert.equal(dryRun?.dryRun?.wouldBlock, true)
  assert.equal(dryRun?.recommendation?.action, 'investigate')
  assert.equal(dryRun?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceDecisionNotAvailableCase() {
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-decision-not-available',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-plan',
    reason: 'Mantener el dry-run inactivo cuando no hay insumos estructurales suficientes.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    workspacePath: repoRoot,
  })
  const dryRun = decision.generatedDomainMaterializationPreferenceDecision

  assert.equal(dryRun?.status, 'not-available')
  assert.equal(dryRun?.enabled, false)
  assert.equal(dryRun?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceSwitchDisabledWouldPreferShadowCase() {
  const preferenceSwitch =
    observationHarness.buildGeneratedDomainMaterializationPreferenceSwitch({
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowComparison: {
        present: true,
        status: 'aligned',
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        status: 'compared',
        recommendation: { action: 'prepare-preference-switch' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'eligible',
        errorsCount: 0,
        eligibility: {
          canPreferShadowInFuture: true,
          needsMoreEvidence: false,
          blockedByDivergence: false,
          blockedByErrors: false,
        },
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        enabled: false,
        status: 'would-prefer-shadow',
        errorsCount: 0,
        dryRun: {
          wouldPreferShadow: true,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
    })
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationPreferenceSwitchForDebug(
      preferenceSwitch,
    )

  assert.equal(preferenceSwitch?.present, true)
  assert.equal(preferenceSwitch?.evaluated, true)
  assert.equal(preferenceSwitch?.enabled, false)
  assert.equal(preferenceSwitch?.mode, 'disabled')
  assert.equal(preferenceSwitch?.candidate?.wouldSelectShadowIfEnabled, true)
  assert.equal(preferenceSwitch?.candidate?.shadowEligible, true)
  assert.equal(preferenceSwitch?.actual?.selectedSource, 'legacy')
  assert.equal(preferenceSwitch?.actual?.materializationPlanChanged, false)
  assert.equal(preferenceSwitch?.actual?.executionScopeChanged, false)
  assert.equal(preferenceSwitch?.recommendation?.action, 'ready-to-enable-later')
  assert.equal(preferenceSwitch?.behaviorChanged, false)
  assert.equal(debugSummary.enabled, false)
  assert.equal(debugSummary.wouldSelectShadowIfEnabled, true)
}

function runGeneratedDomainMaterializationPreferenceSwitchDisabledKeepLegacyCase() {
  const preferenceSwitch =
    observationHarness.buildGeneratedDomainMaterializationPreferenceSwitch({
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        status: 'partial',
        recommendation: { action: 'observe' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'not-ready',
        errorsCount: 0,
        eligibility: {
          canPreferShadowInFuture: false,
          needsMoreEvidence: true,
          blockedByDivergence: false,
          blockedByErrors: false,
        },
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        enabled: false,
        status: 'would-keep-legacy',
        errorsCount: 0,
        dryRun: {
          wouldPreferShadow: false,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })

  assert.equal(preferenceSwitch?.present, true)
  assert.equal(preferenceSwitch?.enabled, false)
  assert.equal(preferenceSwitch?.candidate?.wouldSelectShadowIfEnabled, false)
  assert.equal(preferenceSwitch?.recommendation?.action, 'observe')
  assert.equal(preferenceSwitch?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceSwitchInvestigateCase() {
  const preferenceSwitch =
    observationHarness.buildGeneratedDomainMaterializationPreferenceSwitch({
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        status: 'divergent',
        recommendation: { action: 'investigate' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'blocked',
        errorsCount: 0,
        eligibility: {
          canPreferShadowInFuture: false,
          needsMoreEvidence: false,
          blockedByDivergence: true,
          blockedByErrors: false,
        },
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        enabled: false,
        status: 'blocked',
        errorsCount: 0,
        dryRun: {
          wouldPreferShadow: false,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'mismatch',
        semanticStatus: 'mismatch',
        errorsCount: 0,
      },
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
    })

  assert.equal(preferenceSwitch?.present, true)
  assert.equal(preferenceSwitch?.enabled, false)
  assert.equal(preferenceSwitch?.recommendation?.action, 'investigate')
  assert.equal(preferenceSwitch?.candidate?.wouldSelectShadowIfEnabled, false)
  assert.equal(preferenceSwitch?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationPreferenceSwitchTestEnabledCase() {
  const preferenceSwitch =
    observationHarness.buildGeneratedDomainMaterializationPreferenceSwitch({
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowComparison: {
        present: true,
        status: 'aligned',
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        status: 'compared',
        recommendation: { action: 'prepare-preference-switch' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'eligible',
        errorsCount: 0,
        eligibility: {
          canPreferShadowInFuture: true,
          needsMoreEvidence: false,
          blockedByDivergence: false,
          blockedByErrors: false,
        },
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        enabled: false,
        status: 'would-prefer-shadow',
        errorsCount: 0,
        dryRun: {
          wouldPreferShadow: true,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
      preferenceSwitchOptions: {
        testEnabled: true,
      },
    })

  assert.equal(preferenceSwitch?.present, true)
  assert.equal(preferenceSwitch?.enabled, true)
  assert.equal(preferenceSwitch?.mode, 'test-enabled')
  assert.equal(preferenceSwitch?.actual?.selectedSource, 'shadow')
  assert.equal(preferenceSwitch?.actual?.materializationPlanChanged, false)
  assert.equal(preferenceSwitch?.actual?.executionScopeChanged, false)
  assert.equal(preferenceSwitch?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationSwitchReadinessReportNotReadyCase() {
  const readinessReport =
    observationHarness.buildGeneratedDomainMaterializationSwitchReadinessReport({
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        behaviorChanged: false,
        candidate: {
          shadowAvailable: true,
          shadowEligible: false,
          wouldSelectShadowIfEnabled: false,
        },
        recommendation: { action: 'observe' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        status: 'would-keep-legacy',
        dryRun: { wouldPreferShadow: false },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'not-ready',
        eligibility: {
          canPreferShadowInFuture: false,
          needsMoreEvidence: true,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        compared: false,
        status: 'partial',
        recommendation: { action: 'observe' },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowComparison: {
        present: true,
        compared: false,
        status: 'partial',
        legacyPlanPresent: false,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })

  assert.equal(readinessReport?.present, true)
  assert.equal(readinessReport?.status, 'not-ready')
  assert.equal(readinessReport?.blockers?.missingLegacyComparison, true)
  assert.equal(readinessReport?.recommendation?.action, 'observe')
  assert.equal(readinessReport?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationSwitchReadinessReportReadyCase() {
  const readinessReport =
    observationHarness.buildGeneratedDomainMaterializationSwitchReadinessReport({
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        behaviorChanged: false,
        candidate: {
          shadowAvailable: true,
          shadowEligible: true,
          wouldSelectShadowIfEnabled: true,
        },
        recommendation: { action: 'ready-to-enable-later' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        status: 'would-prefer-shadow',
        dryRun: { wouldPreferShadow: true },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'eligible',
        eligibility: {
          canPreferShadowInFuture: true,
          needsMoreEvidence: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        compared: true,
        status: 'compared',
        recommendation: { action: 'prepare-preference-switch' },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowComparison: {
        present: true,
        compared: true,
        status: 'aligned',
        legacyPlanPresent: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      legacyMigrationCandidateReport: {
        present: true,
        evaluated: true,
        status: 'no-action',
      },
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
    })

  assert.equal(readinessReport?.present, true)
  assert.equal(readinessReport?.status, 'ready-for-test-harness')
  assert.equal(readinessReport?.readiness?.shadowEligible, true)
  assert.equal(readinessReport?.readiness?.legacyComparisonAvailable, true)
  assert.equal(readinessReport?.recommendation?.action, 'test-harness-only')
  assert.equal(readinessReport?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationSwitchReadinessReportDomainBlockedCase() {
  const readinessReport =
    observationHarness.buildGeneratedDomainMaterializationSwitchReadinessReport({
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        behaviorChanged: false,
        candidate: {
          shadowAvailable: true,
          shadowEligible: false,
          wouldSelectShadowIfEnabled: false,
        },
        recommendation: { action: 'investigate' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        status: 'blocked',
        dryRun: { wouldPreferShadow: false },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'blocked',
        eligibility: {
          canPreferShadowInFuture: false,
          blockedByDivergence: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        compared: true,
        status: 'compared',
        recommendation: { action: 'observe' },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowComparison: {
        present: true,
        compared: true,
        status: 'aligned',
        legacyPlanPresent: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'mismatch',
        semanticStatus: 'mismatch',
        errorsCount: 0,
      },
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
    })

  assert.equal(readinessReport?.status, 'blocked')
  assert.equal(readinessReport?.blockers?.domainMismatch, true)
  assert.equal(readinessReport?.recommendation?.action, 'investigate')
}

function runGeneratedDomainMaterializationSwitchReadinessReportDiffBlockedCase() {
  const readinessReport =
    observationHarness.buildGeneratedDomainMaterializationSwitchReadinessReport({
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        behaviorChanged: false,
        candidate: {
          shadowAvailable: true,
          shadowEligible: false,
          wouldSelectShadowIfEnabled: false,
        },
        recommendation: { action: 'investigate' },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        status: 'blocked',
        dryRun: { wouldPreferShadow: false },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'blocked',
        eligibility: {
          canPreferShadowInFuture: false,
          blockedByDivergence: true,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        compared: true,
        status: 'divergent',
        recommendation: { action: 'investigate' },
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowComparison: {
        present: true,
        compared: true,
        status: 'divergent',
        legacyPlanPresent: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
    })

  assert.equal(readinessReport?.status, 'blocked')
  assert.equal(readinessReport?.blockers?.diffDivergent, true)
  assert.equal(readinessReport?.recommendation?.action, 'investigate')
}

function runGeneratedDomainMaterializationSourceResolutionRuntimeLegacyCase() {
  const sourceResolution =
    observationHarness.resolveGeneratedDomainMaterializationSource({
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        actual: {
          selectedSource: 'legacy',
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSwitchReadinessReport: {
        present: true,
        evaluated: true,
        status: 'not-ready',
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        dryRun: { wouldPreferShadow: false },
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationSourceResolutionForDebug(
      sourceResolution,
    )

  assert.equal(sourceResolution?.present, true)
  assert.equal(sourceResolution?.source, 'legacy')
  assert.equal(sourceResolution?.mode, 'runtime-disabled')
  assert.equal(sourceResolution?.runtime?.selectedSource, 'legacy')
  assert.equal(sourceResolution?.testProjection?.projectedSource, 'legacy')
  assert.equal(sourceResolution?.behaviorChanged, false)
  assert.equal(sourceResolution?.runtime?.materializationPlanChanged, false)
  assert.equal(sourceResolution?.runtime?.executionScopeChanged, false)
  assert.equal(debugSummary.source, 'legacy')
}

function runGeneratedDomainMaterializationSourceResolutionRuntimeNoneCase() {
  const sourceResolution =
    observationHarness.resolveGeneratedDomainMaterializationSource({
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        actual: {
          selectedSource: 'none',
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSwitchReadinessReport: {
        present: true,
        evaluated: true,
        status: 'not-ready',
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        dryRun: { wouldPreferShadow: false },
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: false,
        status: 'not-available',
        semanticStatus: 'not-available',
        errorsCount: 0,
      },
    })

  assert.equal(sourceResolution?.present, true)
  assert.equal(sourceResolution?.source, 'none')
  assert.equal(sourceResolution?.runtime?.selectedSource, 'none')
  assert.equal(sourceResolution?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationSourceResolutionRuntimeDisabledShadowCandidateCase() {
  const sourceResolution =
    observationHarness.resolveGeneratedDomainMaterializationSource({
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        actual: {
          selectedSource: 'legacy',
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSwitchReadinessReport: {
        present: true,
        evaluated: true,
        status: 'ready-for-test-harness',
        blockers: {
          missingLegacyComparison: false,
          gateNotReady: false,
          domainMismatch: false,
          diffDivergent: false,
          errorsPresent: false,
          switchAlreadyEnabled: false,
          missingShadowPlan: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        dryRun: { wouldPreferShadow: true },
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })

  assert.equal(sourceResolution?.present, true)
  assert.equal(sourceResolution?.mode, 'runtime-disabled')
  assert.equal(sourceResolution?.source, 'legacy')
  assert.equal(sourceResolution?.runtime?.selectedSource, 'legacy')
  assert.equal(sourceResolution?.testProjection?.wouldSelectShadow, false)
  assert.equal(sourceResolution?.testProjection?.projectedSource, 'legacy')
  assert.equal(sourceResolution?.runtime?.materializationPlanChanged, false)
  assert.equal(sourceResolution?.runtime?.executionScopeChanged, false)
  assert.equal(sourceResolution?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationSourceResolutionTestEnabledShadowCase() {
  const sourceResolution =
    observationHarness.resolveGeneratedDomainMaterializationSource({
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        actual: {
          selectedSource: 'legacy',
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSwitchReadinessReport: {
        present: true,
        evaluated: true,
        status: 'ready-for-test-harness',
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        dryRun: { wouldPreferShadow: true },
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      sourceResolutionOptions: {
        testEnabled: true,
      },
    })

  assert.equal(sourceResolution?.present, true)
  assert.equal(sourceResolution?.mode, 'test-enabled')
  assert.equal(sourceResolution?.source, 'generated-domain-shadow')
  assert.equal(sourceResolution?.testProjection?.projectedSource, 'generated-domain-shadow')
  assert.equal(sourceResolution?.testProjection?.wouldSelectShadow, true)
  assert.equal(sourceResolution?.runtime?.selectedSource, 'legacy')
  assert.equal(sourceResolution?.runtime?.materializationPlanChanged, false)
  assert.equal(sourceResolution?.runtime?.executionScopeChanged, false)
  assert.equal(sourceResolution?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationSourceResolutionTestBlockedCase() {
  const sourceResolution =
    observationHarness.resolveGeneratedDomainMaterializationSource({
      materializationPlan: {
        kind: 'fullstack-local-materialization',
      },
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceSwitch: {
        present: true,
        evaluated: true,
        enabled: false,
        mode: 'disabled',
        actual: {
          selectedSource: 'legacy',
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSwitchReadinessReport: {
        present: true,
        evaluated: true,
        status: 'blocked',
        blockers: {
          domainMismatch: true,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceDecision: {
        present: true,
        evaluated: true,
        dryRun: { wouldPreferShadow: true },
        errorsCount: 0,
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'mismatch',
        semanticStatus: 'mismatch',
        errorsCount: 0,
      },
      sourceResolutionOptions: {
        testEnabled: true,
      },
    })

  assert.equal(sourceResolution?.present, true)
  assert.equal(sourceResolution?.source, 'blocked')
  assert.equal(sourceResolution?.testProjection?.projectedSource, 'blocked')
  assert.equal(sourceResolution?.recommendation?.action, 'investigate')
  assert.equal(sourceResolution?.behaviorChanged, false)
}

function runGeneratedDomainShadowMaterializationCandidatePlanBuiltCase() {
  const contract = createValidInventedContract()
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    { generatedDomainContract: contract },
    repoRoot,
  )
  const capabilityProfile = buildGeneratedDomainCapabilityProfile(contract, diagnostics)
  const shadowPlan = buildGeneratedDomainMaterializationShadowPlan(
    contract,
    diagnostics,
    capabilityProfile,
  )
  const candidatePlan =
    observationHarness.buildGeneratedDomainShadowMaterializationCandidatePlan({
      generatedDomainMaterializationShadowPlan: shadowPlan,
      generatedDomainContract: contract,
      generatedDomainContractDiagnostics: diagnostics,
      generatedDomainCapabilityProfile: capabilityProfile,
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'eligible',
        eligibility: {
          canPreferShadowInFuture: true,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSourceResolution: {
        present: true,
        resolved: true,
        source: 'legacy',
        testProjection: {
          wouldSelectShadow: true,
        },
        recommendation: {
          action: 'test-harness-only',
        },
      },
    })
  const debugSummary =
    observationHarness.summarizeGeneratedDomainShadowMaterializationCandidatePlanForDebug(
      candidatePlan,
    )

  assert.equal(candidatePlan?.present, true)
  assert.equal(candidatePlan?.built, true)
  assert.equal(candidatePlan?.status, 'built')
  assert.equal(candidatePlan?.compatibility?.resemblesMaterializationPlan, true)
  assert.equal(candidatePlan?.compatibility?.canBeInspected, true)
  assert.equal(candidatePlan?.compatibility?.canBeUsedByFutureSwitch, true)
  assert.equal(candidatePlan?.behaviorChanged, false)
  assert.equal(Array.isArray(candidatePlan?.candidate?.allowedTargetPaths), true)
  assert.equal(Array.isArray(candidatePlan?.candidate?.requiredPathGroups), true)
  assert.equal('operations' in (candidatePlan?.candidate || {}), false)
  assert.equal(debugSummary?.status, 'built')
}

function runGeneratedDomainShadowMaterializationCandidatePlanPartialCase() {
  const candidatePlan =
    observationHarness.buildGeneratedDomainShadowMaterializationCandidatePlan({
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        status: 'built',
        root: 'partial-local',
        sourceRoot: 'partial-local',
        targetRoot: 'partial-local',
        plannedBuckets: {
          frontend: { present: true },
          backend: { present: false },
          database: { present: false },
          shared: { present: false },
          docs: { present: false },
          scripts: { present: false },
          validation: { present: false },
        },
        safety: {
          safeForLocalMaterialization: true,
          forbidsSecrets: true,
          forbidsDeploy: true,
          forbidsRealPayments: true,
          forbidsExternalServices: true,
        },
        errorsCount: 0,
      },
      generatedDomainContractDiagnostics: {
        targetRoot: 'partial-local',
        safeForLocalMaterialization: true,
        allowedTargetPaths: ['partial-local', 'partial-local/frontend/public/index.html'],
        requiredPathGroups: [],
      },
      generatedDomainCapabilityProfile: {
        safety: {
          safeForLocalMaterialization: true,
          forbidsSecrets: true,
          forbidsDeploy: true,
          forbidsRealPayments: true,
          forbidsExternalServices: true,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'not-ready',
        eligibility: {
          canPreferShadowInFuture: false,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSourceResolution: {
        present: true,
        resolved: true,
        source: 'none',
        testProjection: {
          wouldSelectShadow: false,
        },
        recommendation: {
          action: 'observe',
        },
      },
    })

  assert.equal(candidatePlan?.present, true)
  assert.equal(candidatePlan?.status, 'partial')
  assert.equal(candidatePlan?.built, false)
  assert.equal(candidatePlan?.compatibility?.canBeUsedByFutureSwitch, false)
  assert.equal(candidatePlan?.behaviorChanged, false)
  assert.ok((candidatePlan?.limitations || []).length > 0)
}

function runGeneratedDomainShadowMaterializationCandidatePlanNotAvailableCase() {
  const candidatePlan =
    observationHarness.buildGeneratedDomainShadowMaterializationCandidatePlan({
      generatedDomainMaterializationSourceResolution: {
        present: true,
        resolved: true,
        source: 'none',
      },
    })

  assert.equal(candidatePlan?.present, true)
  assert.equal(candidatePlan?.built, false)
  assert.equal(candidatePlan?.status, 'not-available')
  assert.equal(candidatePlan?.behaviorChanged, false)
}

function runGeneratedDomainShadowMaterializationCandidatePlanBlockedCase() {
  const candidatePlan =
    observationHarness.buildGeneratedDomainShadowMaterializationCandidatePlan({
      generatedDomainMaterializationShadowPlan: {
        present: true,
        built: true,
        status: 'built',
        root: 'unsafe-local',
        sourceRoot: 'unsafe-local',
        targetRoot: 'unsafe-local',
        plannedBuckets: {
          frontend: { present: true },
          backend: { present: true },
          database: { present: true },
          shared: { present: true },
          docs: { present: true },
          scripts: { present: false },
          validation: { present: true },
        },
        safety: {
          safeForLocalMaterialization: true,
          forbidsSecrets: true,
          forbidsDeploy: true,
          forbidsRealPayments: true,
          forbidsExternalServices: true,
        },
        errorsCount: 0,
      },
      generatedDomainContractDiagnostics: {
        targetRoot: 'unsafe-local',
        safeForLocalMaterialization: true,
        allowedTargetPaths: [
          'unsafe-local',
          'unsafe-local/backend/src/server.js',
          '.env',
          '../escape/path.txt',
        ],
        requiredPathGroups: [{ candidates: ['unsafe-local/backend/src/server.js'] }],
      },
      generatedDomainCapabilityProfile: {
        safety: {
          safeForLocalMaterialization: true,
          forbidsSecrets: true,
          forbidsDeploy: true,
          forbidsRealPayments: true,
          forbidsExternalServices: true,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
      generatedDomainMaterializationPreferenceGate: {
        present: true,
        evaluated: true,
        status: 'eligible',
        eligibility: {
          canPreferShadowInFuture: true,
        },
        errorsCount: 0,
      },
      generatedDomainMaterializationSourceResolution: {
        present: true,
        resolved: true,
        source: 'legacy',
        testProjection: {
          wouldSelectShadow: true,
        },
        recommendation: {
          action: 'test-harness-only',
        },
      },
    })

  assert.equal(candidatePlan?.present, true)
  assert.equal(candidatePlan?.built, false)
  assert.equal(candidatePlan?.status, 'blocked')
  assert.equal(candidatePlan?.compatibility?.canBeUsedByFutureSwitch, false)
  assert.equal(candidatePlan?.behaviorChanged, false)
  assert.ok((candidatePlan?.errors || []).length > 0)
  assert.equal('operations' in (candidatePlan?.candidate || {}), false)
}

function runGeneratedDomainShadowCandidateLegacyComparisonAlignedCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const comparison = decision.generatedDomainShadowCandidateLegacyComparison
  const debugSummary =
    observationHarness.summarizeGeneratedDomainShadowCandidateLegacyComparisonForDebug(
      comparison,
    )

  assert.equal(comparison?.present, true)
  assert.equal(comparison?.compared, true)
  assert.equal(comparison?.status, 'aligned')
  assert.equal(comparison?.roots?.aligned, true)
  assert.equal(comparison?.allowedTargets?.aligned, true)
  assert.equal(comparison?.requiredGroups?.aligned, true)
  assert.equal(comparison?.buckets?.allAligned, true)
  assert.equal(comparison?.safety?.aligned, true)
  assert.equal(comparison?.operations?.candidateHasOperations, false)
  assert.equal(comparison?.operations?.candidateHasCommands, false)
  assert.equal(comparison?.operations?.candidateHasWrites, false)
  assert.equal(comparison?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'aligned')
}

function runGeneratedDomainShadowCandidateLegacyComparisonBlockedCase() {
  const comparison =
    observationHarness.buildGeneratedDomainShadowCandidateLegacyComparison({
      generatedDomainShadowMaterializationCandidatePlan: {
        present: true,
        built: true,
        status: 'built',
        behaviorChanged: false,
        candidate: {
          root: 'unsafe-local',
          targetRoot: 'unsafe-local',
          allowedTargetPaths: ['unsafe-local', 'unsafe-local/backend/src/server.js'],
          requiredPathGroups: [{ candidates: ['unsafe-local/backend/src/server.js'] }],
          plannedBuckets: {
            frontend: false,
            backend: true,
            database: false,
            shared: false,
            docs: false,
            scripts: false,
            validation: false,
          },
          safety: {
            safeForLocalMaterialization: true,
            forbidsSecrets: true,
            forbidsDeploy: true,
            forbidsRealPayments: true,
            forbidsExternalServices: true,
          },
          operations: [{ type: 'create-or-edit-file', targetPath: 'unsafe-local/backend/src/server.js' }],
        },
      },
      generatedDomainMaterializationShadowDiff: {
        present: true,
        compared: true,
        status: 'compared',
      },
      materializationPlan: {
        projectRoot: 'unsafe-local',
        allowedTargetPaths: ['unsafe-local', 'unsafe-local/backend/src/server.js'],
        operations: [{ type: 'create-or-edit-file', targetPath: 'unsafe-local/backend/src/server.js' }],
        contractDefinition: {
          requiredPathGroups: [{ candidates: ['unsafe-local/backend/src/server.js'] }],
        },
      },
    })

  assert.equal(comparison?.present, true)
  assert.equal(comparison?.status, 'blocked')
  assert.equal(comparison?.operations?.candidateHasOperations, true)
  assert.equal(comparison?.recommendation?.action, 'investigate')
  assert.equal(comparison?.behaviorChanged, false)
}

function createGeneratedDomainShadowReadyPipelineFixture() {
  const generatedDomainContract = createValidInventedContract()
  const generatedDomainContractDiagnostics = buildGeneratedDomainContractDiagnostics(
    { generatedDomainContract },
    repoRoot,
  )
  const generatedDomainCapabilityProfile = buildGeneratedDomainCapabilityProfile(
    generatedDomainContract,
    generatedDomainContractDiagnostics,
  )
  const generatedDomainMaterializationShadowPlan = buildGeneratedDomainMaterializationShadowPlan(
    generatedDomainContract,
    generatedDomainContractDiagnostics,
    generatedDomainCapabilityProfile,
  )
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const materializationPlan = {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot:
      generatedDomainContract.root?.targetRoot ||
      generatedDomainContractDiagnostics.targetRoot ||
      'invented-local',
    allowedTargetPaths,
    operations: allowedTargetPaths.map((targetPath) => ({
      type:
        targetPath ===
        (generatedDomainContract.root?.targetRoot ||
          generatedDomainContractDiagnostics.targetRoot ||
          'invented-local')
          ? 'create-folder'
          : 'create-or-edit-file',
      targetPath,
    })),
    contractDefinition: {
      requiredPathGroups: deriveRequiredPathGroupsFromContract(generatedDomainContract),
    },
  }
  const domainConsistencyDiagnostics = {
    present: true,
    checked: true,
    status: 'consistent',
    semanticStatus: 'consistent',
    errorsCount: 0,
  }
  const generatedDomainMaterializationShadowComparison = {
    present: true,
    compared: true,
    status: 'aligned',
    legacyPlanPresent: true,
    errorsCount: 0,
  }
  const generatedDomainMaterializationShadowDiff = {
    present: true,
    compared: true,
    status: 'compared',
    recommendation: {
      action: 'prepare-preference-switch',
    },
    errorsCount: 0,
  }
  const generatedDomainMaterializationPreferenceGate = {
    present: true,
    evaluated: true,
    status: 'eligible',
    eligibility: {
      canPreferShadowInFuture: true,
      blockedByDivergence: false,
      needsMoreEvidence: false,
    },
    errorsCount: 0,
  }
  const generatedDomainMaterializationPreferenceDecision = {
    present: true,
    evaluated: true,
    enabled: false,
    status: 'would-prefer-shadow',
    dryRun: {
      wouldPreferShadow: true,
      wouldKeepLegacy: false,
      wouldBlock: false,
    },
    actual: {
      materializationSource: 'legacy',
      reason: 'Keep legacy until the real switch exists.',
    },
    errorsCount: 0,
  }
  const generatedDomainMaterializationPreferenceSwitch =
    observationHarness.buildGeneratedDomainMaterializationPreferenceSwitch({
      generatedDomainMaterializationShadowPlan,
      generatedDomainMaterializationShadowComparison,
      generatedDomainMaterializationShadowDiff,
      generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationPreferenceDecision,
      domainConsistencyDiagnostics,
      materializationPlan,
    })
  const generatedDomainMaterializationSwitchReadinessReport =
    observationHarness.buildGeneratedDomainMaterializationSwitchReadinessReport({
      generatedDomainMaterializationPreferenceSwitch,
      generatedDomainMaterializationPreferenceDecision,
      generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationShadowDiff,
      generatedDomainMaterializationShadowComparison,
      generatedDomainMaterializationShadowPlan,
      domainConsistencyDiagnostics,
      materializationPlan,
    })
  const generatedDomainMaterializationSourceResolution =
    observationHarness.resolveGeneratedDomainMaterializationSource({
      materializationPlan,
      generatedDomainMaterializationShadowPlan,
      generatedDomainMaterializationPreferenceSwitch,
      generatedDomainMaterializationSwitchReadinessReport,
      generatedDomainMaterializationPreferenceDecision,
      domainConsistencyDiagnostics,
    })
  const generatedDomainShadowMaterializationCandidatePlan =
    observationHarness.buildGeneratedDomainShadowMaterializationCandidatePlan({
      generatedDomainMaterializationShadowPlan,
      generatedDomainContract,
      generatedDomainContractDiagnostics,
      generatedDomainCapabilityProfile,
      domainConsistencyDiagnostics,
      generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationSourceResolution,
    })
  const generatedDomainShadowCandidateLegacyComparison =
    observationHarness.buildGeneratedDomainShadowCandidateLegacyComparison({
      generatedDomainShadowMaterializationCandidatePlan,
      generatedDomainMaterializationShadowDiff,
      materializationPlan,
    })

  return {
    generatedDomainContract,
    generatedDomainContractDiagnostics,
    generatedDomainCapabilityProfile,
    generatedDomainMaterializationShadowPlan,
    generatedDomainMaterializationShadowComparison,
    generatedDomainMaterializationShadowDiff,
    generatedDomainMaterializationPreferenceGate,
    generatedDomainMaterializationPreferenceDecision,
    generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSwitchReadinessReport,
    generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowCandidateLegacyComparison,
    materializationPlan,
  }
}

function createGeneratedDomainAlignedApprovalObservationDecision({
  generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: ['member', 'librarian', 'admin'],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['manage catalog', 'register loans', 'review reports'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [{ path: 'backend/src/modules/loans.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: {
      files: ['shared/contracts/domain.js'],
    },
    docs: ['docs/API.md'],
    scripts: ['scripts/seed-local.js'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env'],
      forbiddenSignals: ['ACCESS_TOKEN'],
      explicitExclusions: ['deploy', 'docker'],
    },
    materialization: {
      requiredFiles: [
        'backend/src/server.js',
        'database/schema.sql',
        'frontend/public/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'frontend/public/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['frontend/public/index.html'] },
      ],
    },
    approvals: [],
  },
  decisionKey = 'generated-domain-aligned-approval-observation',
} = {}) {
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const domainLabel =
    String(generatedDomainContract?.domain?.label || 'community libraries').trim() ||
    'community libraries'
  const rootPath =
    String(generatedDomainContract?.root?.targetRoot || 'community-libraries-local').trim() ||
    'community-libraries-local'
  const inferredModules = [
    ...(Array.isArray(generatedDomainContract?.frontendSurfaces)
      ? generatedDomainContract.frontendSurfaces.map((entry) => entry?.key)
      : []),
    ...(Array.isArray(generatedDomainContract?.entities)
      ? generatedDomainContract.entities
      : []),
  ]
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .slice(0, 6)

  return observationHarness.buildBrainDecisionContract({
    decisionKey,
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Construir una cadena observacional alineada para comparar candidate, policy y approvals.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: rootPath,
    targetRoot: rootPath,
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: domainLabel,
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: Array.isArray(generatedDomainContract?.roles) ? generatedDomainContract.roles : [],
      modules: inferredModules,
      entities: Array.isArray(generatedDomainContract?.entities)
        ? generatedDomainContract.entities
        : [],
      coreFlows: Array.isArray(generatedDomainContract?.workflows)
        ? generatedDomainContract.workflows
        : [],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: domainLabel,
      users: Array.isArray(generatedDomainContract?.roles) ? generatedDomainContract.roles : [],
      roles: Array.isArray(generatedDomainContract?.roles) ? generatedDomainContract.roles : [],
      coreModules: inferredModules,
      dataEntities: Array.isArray(generatedDomainContract?.entities)
        ? generatedDomainContract.entities
        : [],
      keyFlows: Array.isArray(generatedDomainContract?.workflows)
        ? generatedDomainContract.workflows
        : [],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: rootPath,
      domain: domainLabel,
      title: `${domainLabel} local review`,
      targetStructure: [
        `${rootPath}/`,
        `${rootPath}/frontend/public/`,
        `${rootPath}/frontend/admin/`,
        `${rootPath}/backend/src/`,
        `${rootPath}/database/`,
        `${rootPath}/docs/`,
      ],
      allowedRootPaths: [rootPath],
      directories: [
        `${rootPath}/frontend/public`,
        `${rootPath}/frontend/admin`,
        `${rootPath}/backend/src`,
        `${rootPath}/database`,
        `${rootPath}/docs`,
      ],
      modules: inferredModules,
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: rootPath,
      domain: domainLabel,
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: rootPath,
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === rootPath
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
      contractDefinition: {
        requiredPathGroups,
      },
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })
}

function runGeneratedDomainShadowMaterializationEndToEndReadinessReadyCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const readiness =
    observationHarness.buildGeneratedDomainShadowMaterializationEndToEndReadiness({
      materializationPlan: fixture.materializationPlan,
      generatedDomainContractDiagnostics: fixture.generatedDomainContractDiagnostics,
      generatedDomainMaterializationShadowPlan:
        fixture.generatedDomainMaterializationShadowPlan,
      generatedDomainShadowMaterializationCandidatePlan:
        fixture.generatedDomainShadowMaterializationCandidatePlan,
      generatedDomainMaterializationShadowDiff:
        fixture.generatedDomainMaterializationShadowDiff,
      generatedDomainMaterializationPreferenceGate:
        fixture.generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationPreferenceDecision:
        fixture.generatedDomainMaterializationPreferenceDecision,
      generatedDomainMaterializationPreferenceSwitch:
        fixture.generatedDomainMaterializationPreferenceSwitch,
      generatedDomainMaterializationSwitchReadinessReport:
        fixture.generatedDomainMaterializationSwitchReadinessReport,
      generatedDomainMaterializationSourceResolution:
        fixture.generatedDomainMaterializationSourceResolution,
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })
  const debugSummary =
    observationHarness.summarizeGeneratedDomainShadowMaterializationEndToEndReadinessForDebug(
      readiness,
    )

  assert.equal(readiness?.present, true)
  assert.equal(readiness?.status, 'ready-for-test-harness')
  assert.equal(readiness?.pipeline?.contractValid, true)
  assert.equal(readiness?.pipeline?.shadowPlanBuilt, true)
  assert.equal(readiness?.pipeline?.candidateBuilt, true)
  assert.equal(readiness?.pipeline?.candidateInspectable, true)
  assert.equal(readiness?.pipeline?.candidateUsableByFutureSwitch, true)
  assert.equal(readiness?.pipeline?.gateEligible, true)
  assert.equal(readiness?.pipeline?.diffAligned, true)
  assert.equal(readiness?.pipeline?.switchReadyForTestHarness, true)
  assert.equal(readiness?.pipeline?.sourceResolutionProjectsShadowInTest, true)
  assert.equal(readiness?.pipeline?.runtimeStillDisabled, true)
  assert.equal(readiness?.safeguards?.noOperations, true)
  assert.equal(readiness?.safeguards?.noCommands, true)
  assert.equal(readiness?.safeguards?.noFileWrites, true)
  assert.equal(readiness?.safeguards?.noWebPrueba, true)
  assert.equal(readiness?.safeguards?.materializationPlanChanged, false)
  assert.equal(readiness?.safeguards?.executionScopeChanged, false)
  assert.equal(readiness?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'ready-for-test-harness')
}

function runGeneratedDomainShadowMaterializationEndToEndReadinessBlockedCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const blockedReadiness =
    observationHarness.buildGeneratedDomainShadowMaterializationEndToEndReadiness({
      materializationPlan: fixture.materializationPlan,
      generatedDomainContractDiagnostics: fixture.generatedDomainContractDiagnostics,
      generatedDomainMaterializationShadowPlan:
        fixture.generatedDomainMaterializationShadowPlan,
      generatedDomainShadowMaterializationCandidatePlan: {
        ...fixture.generatedDomainShadowMaterializationCandidatePlan,
        built: false,
        status: 'blocked',
        compatibility: {
          ...fixture.generatedDomainShadowMaterializationCandidatePlan?.compatibility,
          canBeInspected: false,
          canBeUsedByFutureSwitch: false,
        },
        errors: ['Blocked candidate fixture.'],
        errorsCount: 1,
      },
      generatedDomainMaterializationShadowDiff:
        fixture.generatedDomainMaterializationShadowDiff,
      generatedDomainMaterializationPreferenceGate:
        fixture.generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationPreferenceDecision:
        fixture.generatedDomainMaterializationPreferenceDecision,
      generatedDomainMaterializationPreferenceSwitch:
        fixture.generatedDomainMaterializationPreferenceSwitch,
      generatedDomainMaterializationSwitchReadinessReport: {
        ...fixture.generatedDomainMaterializationSwitchReadinessReport,
        status: 'blocked',
        blockers: {
          ...fixture.generatedDomainMaterializationSwitchReadinessReport?.blockers,
          errorsPresent: true,
        },
        errorsCount: 1,
      },
      generatedDomainMaterializationSourceResolution:
        fixture.generatedDomainMaterializationSourceResolution,
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })

  assert.equal(blockedReadiness?.present, true)
  assert.equal(blockedReadiness?.status, 'blocked')
  assert.equal(blockedReadiness?.pipeline?.candidateUsableByFutureSwitch, false)
  assert.equal(blockedReadiness?.pipeline?.sourceResolutionProjectsShadowInTest, false)
  assert.equal(blockedReadiness?.recommendation?.action, 'investigate')
  assert.equal(blockedReadiness?.behaviorChanged, false)
}

function runGeneratedDomainControlledEnablePolicyNotReadyWithoutLegacyCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const policy = observationHarness.buildGeneratedDomainControlledEnablePolicy({
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSwitchReadinessReport:
      fixture.generatedDomainMaterializationSwitchReadinessReport,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan:
      fixture.generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowMaterializationEndToEndReadiness: {
      present: true,
      evaluated: true,
      status: 'ready-for-test-harness',
      pipeline: {
        contractValid: true,
        shadowPlanBuilt: true,
        candidateBuilt: true,
        candidateInspectable: true,
        candidateUsableByFutureSwitch: true,
        gateEligible: true,
        diffAligned: true,
        switchReadyForTestHarness: true,
        sourceResolutionProjectsShadowInTest: true,
        runtimeStillDisabled: true,
      },
      errorsCount: 0,
    },
    generatedDomainMaterializationShadowDiff:
      fixture.generatedDomainMaterializationShadowDiff,
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'consistent',
      semanticStatus: 'consistent',
      errorsCount: 0,
    },
    materializationPlan: null,
  })

  assert.equal(policy?.present, true)
  assert.equal(policy?.status, 'not-ready')
  assert.equal(policy?.runtimeEnabled, false)
  assert.equal(policy?.eligibility?.hasLegacyMaterializationPlan, false)
  assert.equal(policy?.blockers?.missingLegacyMaterializationPlan, true)
  assert.equal(policy?.allowedModes?.controlledRuntimeEnable, false)
  assert.equal(policy?.behaviorChanged, false)
}

function runGeneratedDomainControlledEnablePolicyEligibleCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const endToEndReadiness =
    observationHarness.buildGeneratedDomainShadowMaterializationEndToEndReadiness({
      materializationPlan: fixture.materializationPlan,
      generatedDomainContractDiagnostics: fixture.generatedDomainContractDiagnostics,
      generatedDomainMaterializationShadowPlan:
        fixture.generatedDomainMaterializationShadowPlan,
      generatedDomainShadowMaterializationCandidatePlan:
        fixture.generatedDomainShadowMaterializationCandidatePlan,
      generatedDomainMaterializationShadowDiff:
        fixture.generatedDomainMaterializationShadowDiff,
      generatedDomainMaterializationPreferenceGate:
        fixture.generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationPreferenceDecision:
        fixture.generatedDomainMaterializationPreferenceDecision,
      generatedDomainMaterializationPreferenceSwitch:
        fixture.generatedDomainMaterializationPreferenceSwitch,
      generatedDomainMaterializationSwitchReadinessReport:
        fixture.generatedDomainMaterializationSwitchReadinessReport,
      generatedDomainMaterializationSourceResolution:
        fixture.generatedDomainMaterializationSourceResolution,
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })
  const policy = observationHarness.buildGeneratedDomainControlledEnablePolicy({
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSwitchReadinessReport:
      fixture.generatedDomainMaterializationSwitchReadinessReport,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan:
      fixture.generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowMaterializationEndToEndReadiness: endToEndReadiness,
    generatedDomainMaterializationShadowDiff:
      fixture.generatedDomainMaterializationShadowDiff,
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'consistent',
      semanticStatus: 'consistent',
      errorsCount: 0,
    },
    materializationPlan: fixture.materializationPlan,
  })
  const debugSummary =
    observationHarness.summarizeGeneratedDomainControlledEnablePolicyForDebug(policy)

  assert.equal(policy?.present, true)
  assert.equal(policy?.status, 'eligible-for-controlled-runtime-enable')
  assert.equal(policy?.runtimeEnabled, false)
  assert.equal(policy?.eligibility?.hasLegacyMaterializationPlan, true)
  assert.equal(policy?.eligibility?.candidateUsableByFutureSwitch, true)
  assert.equal(policy?.eligibility?.endToEndReadyForHarness, true)
  assert.equal(policy?.allowedModes?.testHarnessEnable, true)
  assert.equal(policy?.allowedModes?.controlledRuntimeEnable, false)
  assert.equal(policy?.recommendation?.action, 'prepare-runtime-enable-review')
  assert.equal(policy?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'eligible-for-controlled-runtime-enable')
}

function runGeneratedDomainControlledEnablePolicyDomainMismatchCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const policy = observationHarness.buildGeneratedDomainControlledEnablePolicy({
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSwitchReadinessReport:
      fixture.generatedDomainMaterializationSwitchReadinessReport,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan:
      fixture.generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowMaterializationEndToEndReadiness: {
      present: true,
      evaluated: true,
      status: 'blocked',
      errorsCount: 0,
    },
    generatedDomainMaterializationShadowDiff:
      fixture.generatedDomainMaterializationShadowDiff,
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'mismatch',
      semanticStatus: 'mismatch',
      errorsCount: 0,
    },
    materializationPlan: fixture.materializationPlan,
  })

  assert.equal(policy?.present, true)
  assert.equal(policy?.status, 'blocked')
  assert.equal(policy?.blockers?.domainMismatch, true)
  assert.equal(policy?.allowedModes?.controlledRuntimeEnable, false)
  assert.equal(policy?.recommendation?.action, 'investigate')
  assert.equal(policy?.behaviorChanged, false)
}

function runGeneratedDomainControlledEnablePolicyCandidateBlockedCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const policy = observationHarness.buildGeneratedDomainControlledEnablePolicy({
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSwitchReadinessReport:
      fixture.generatedDomainMaterializationSwitchReadinessReport,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan: {
      ...fixture.generatedDomainShadowMaterializationCandidatePlan,
      built: false,
      status: 'blocked',
      compatibility: {
        ...fixture.generatedDomainShadowMaterializationCandidatePlan?.compatibility,
        canBeUsedByFutureSwitch: false,
      },
      errors: ['Blocked candidate fixture.'],
      errorsCount: 1,
    },
    generatedDomainShadowMaterializationEndToEndReadiness: {
      present: true,
      evaluated: true,
      status: 'blocked',
      errorsCount: 1,
    },
    generatedDomainMaterializationShadowDiff:
      fixture.generatedDomainMaterializationShadowDiff,
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'consistent',
      semanticStatus: 'consistent',
      errorsCount: 0,
    },
    materializationPlan: fixture.materializationPlan,
  })

  assert.equal(policy?.present, true)
  assert.equal(policy?.status, 'blocked')
  assert.equal(policy?.blockers?.candidateNotUsable, true)
  assert.equal(policy?.allowedModes?.controlledRuntimeEnable, false)
  assert.equal(policy?.behaviorChanged, false)
}

function runGeneratedDomainFirstControlledEnableScenarioReadyForReviewCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const endToEndReadiness =
    observationHarness.buildGeneratedDomainShadowMaterializationEndToEndReadiness({
      materializationPlan: fixture.materializationPlan,
      generatedDomainContractDiagnostics: fixture.generatedDomainContractDiagnostics,
      generatedDomainMaterializationShadowPlan:
        fixture.generatedDomainMaterializationShadowPlan,
      generatedDomainShadowMaterializationCandidatePlan:
        fixture.generatedDomainShadowMaterializationCandidatePlan,
      generatedDomainMaterializationShadowDiff:
        fixture.generatedDomainMaterializationShadowDiff,
      generatedDomainMaterializationPreferenceGate:
        fixture.generatedDomainMaterializationPreferenceGate,
      generatedDomainMaterializationPreferenceDecision:
        fixture.generatedDomainMaterializationPreferenceDecision,
      generatedDomainMaterializationPreferenceSwitch:
        fixture.generatedDomainMaterializationPreferenceSwitch,
      generatedDomainMaterializationSwitchReadinessReport:
        fixture.generatedDomainMaterializationSwitchReadinessReport,
      generatedDomainMaterializationSourceResolution:
        fixture.generatedDomainMaterializationSourceResolution,
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
        errorsCount: 0,
      },
    })
  const policy = observationHarness.buildGeneratedDomainControlledEnablePolicy({
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSwitchReadinessReport:
      fixture.generatedDomainMaterializationSwitchReadinessReport,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan:
      fixture.generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowMaterializationEndToEndReadiness: endToEndReadiness,
    generatedDomainMaterializationShadowDiff:
      fixture.generatedDomainMaterializationShadowDiff,
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'consistent',
      semanticStatus: 'consistent',
      errorsCount: 0,
    },
    materializationPlan: fixture.materializationPlan,
  })
  const scenario = observationHarness.buildGeneratedDomainFirstControlledEnableScenario({
    generatedDomainControlledEnablePolicy: policy,
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan:
      fixture.generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowMaterializationEndToEndReadiness: endToEndReadiness,
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'consistent',
      semanticStatus: 'consistent',
      errorsCount: 0,
    },
    materializationPlan: fixture.materializationPlan,
  })
  const debugSummary =
    observationHarness.summarizeGeneratedDomainFirstControlledEnableScenarioForDebug(
      scenario,
    )

  assert.equal(scenario?.present, true)
  assert.equal(scenario?.status, 'ready-for-review')
  assert.equal(scenario?.allowedNow, false)
  assert.equal(scenario?.requiresLeanApproval, true)
  assert.equal(scenario?.conditions?.fullstackLocalOnly, true)
  assert.equal(scenario?.conditions?.controlledRuntimeEnable, false)
  assert.equal(scenario?.conditions?.runtimeEnabled, false)
  assert.equal(scenario?.conditions?.noCommands, true)
  assert.equal(scenario?.conditions?.noFileWrites, true)
  assert.equal(scenario?.conditions?.noWebPrueba, true)
  assert.equal(scenario?.recommendation?.action, 'request-lean-approval')
  assert.equal(scenario?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'ready-for-review')
}

function runGeneratedDomainFirstControlledEnableScenarioBlockedCase() {
  const fixture = createGeneratedDomainShadowReadyPipelineFixture()
  const scenario = observationHarness.buildGeneratedDomainFirstControlledEnableScenario({
    generatedDomainControlledEnablePolicy: {
      present: true,
      evaluated: true,
      status: 'blocked',
      behaviorChanged: false,
      runtimeEnabled: false,
      allowedModes: {
        observeOnly: true,
        testHarnessEnable: false,
        controlledRuntimeEnable: false,
      },
      errorsCount: 1,
    },
    generatedDomainMaterializationPreferenceSwitch:
      fixture.generatedDomainMaterializationPreferenceSwitch,
    generatedDomainMaterializationSourceResolution:
      fixture.generatedDomainMaterializationSourceResolution,
    generatedDomainShadowMaterializationCandidatePlan:
      fixture.generatedDomainShadowMaterializationCandidatePlan,
    generatedDomainShadowMaterializationEndToEndReadiness: {
      present: true,
      evaluated: true,
      status: 'blocked',
      safeguards: {
        noCommands: true,
        noFileWrites: true,
        noWebPrueba: true,
      },
      errorsCount: 1,
    },
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'mismatch',
      semanticStatus: 'mismatch',
      errorsCount: 0,
    },
    materializationPlan: fixture.materializationPlan,
  })

  assert.equal(scenario?.present, true)
  assert.equal(scenario?.status, 'blocked')
  assert.equal(scenario?.allowedNow, false)
  assert.equal(scenario?.blockers?.domainMismatch, true)
  assert.equal(scenario?.blockers?.semanticMismatch, true)
  assert.equal(scenario?.conditions?.controlledRuntimeEnable, false)
  assert.equal(scenario?.behaviorChanged, false)
}

function runGeneratedDomainFileCreationApprovalPolicyReadyCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const approvalPolicy = decision.generatedDomainFileCreationApprovalPolicy
  const debugSummary =
    observationHarness.summarizeGeneratedDomainFileCreationApprovalPolicyForDebug(
      approvalPolicy,
    )

  assert.equal(approvalPolicy?.present, true)
  assert.equal(approvalPolicy?.status, 'ready-for-manual-approval-review')
  assert.equal(approvalPolicy?.approvalRequired, true)
  assert.equal(approvalPolicy?.allowedNow, false)
  assert.equal(approvalPolicy?.requiresLeanApproval, true)
  assert.equal(approvalPolicy?.evidence?.candidateComparisonStatus, 'aligned')
  assert.equal(approvalPolicy?.safeguards?.noDotEnv, true)
  assert.equal(approvalPolicy?.safeguards?.noNodeModules, true)
  assert.equal(approvalPolicy?.safeguards?.noCommands, true)
  assert.equal(approvalPolicy?.safeguards?.noWritesExecuted, true)
  assert.equal(approvalPolicy?.safeguards?.noWebPrueba, true)
  assert.equal(approvalPolicy?.safeguards?.materializationPlanChanged, false)
  assert.equal(approvalPolicy?.safeguards?.executionScopeChanged, false)
  assert.equal(approvalPolicy?.recommendation?.action, 'request-lean-approval')
  assert.equal(approvalPolicy?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'ready-for-manual-approval-review')
}

function runGeneratedDomainFileCreationApprovalPolicyBlockedCase() {
  const approvalPolicy = observationHarness.buildGeneratedDomainFileCreationApprovalPolicy({
    materializationPlan: {
      projectRoot: 'unsafe-local',
      allowedTargetPaths: ['unsafe-local', '.env', 'web-prueba/index.html'],
      operations: [{ targetPath: 'unsafe-local/backend/src/server.js' }],
    },
    generatedDomainMaterializationSourceResolution: {
      present: true,
      resolved: true,
      source: 'generated-domain-shadow',
      runtime: {
        materializationPlanChanged: true,
        executionScopeChanged: true,
      },
      testProjection: {
        projectedSource: 'generated-domain-shadow',
      },
    },
    generatedDomainShadowMaterializationCandidatePlan: {
      present: true,
      built: false,
      status: 'blocked',
      compatibility: {
        canBeUsedByFutureSwitch: false,
      },
      candidate: {
        root: 'unsafe-local',
        targetRoot: 'unsafe-local',
        allowedTargetPaths: ['unsafe-local', '.env', 'web-prueba/index.html'],
        safety: {
          forbidsExternalServices: false,
          forbidsRealPayments: false,
        },
      },
      errorsCount: 1,
    },
    generatedDomainShadowCandidateLegacyComparison: {
      present: true,
      compared: true,
      status: 'blocked',
      operations: {
        candidateHasCommands: true,
        candidateHasWrites: true,
      },
      errorsCount: 1,
    },
    generatedDomainShadowMaterializationEndToEndReadiness: {
      present: true,
      evaluated: true,
      status: 'blocked',
      errorsCount: 1,
    },
    generatedDomainControlledEnablePolicy: {
      present: true,
      evaluated: true,
      status: 'blocked',
      errorsCount: 1,
    },
    generatedDomainFirstControlledEnableScenario: {
      present: true,
      evaluated: true,
      status: 'blocked',
      errorsCount: 1,
    },
  })

  assert.equal(approvalPolicy?.present, true)
  assert.equal(approvalPolicy?.status, 'blocked')
  assert.equal(approvalPolicy?.allowedNow, false)
  assert.equal(approvalPolicy?.blockers?.unsafePaths, true)
  assert.equal(approvalPolicy?.blockers?.runtimeStillMutable, true)
  assert.equal(approvalPolicy?.recommendation?.action, 'investigate')
  assert.equal(approvalPolicy?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationApprovalPayloadReadyCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const payload = decision.generatedDomainMaterializationApprovalPayload
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationApprovalPayloadForDebug(
      payload,
    )

  assert.equal(payload?.present, true)
  assert.equal(payload?.status, 'ready-for-review')
  assert.equal(payload?.approvalRequired, true)
  assert.equal(payload?.approved, false)
  assert.equal(payload?.allowedNow, false)
  assert.equal(payload?.requiresLeanApproval, true)
  assert.equal(Array.isArray(payload?.review?.pathsPreview), true)
  assert.equal((payload?.review?.pathsPreview || []).length > 0, true)
  assert.equal((payload?.review?.filesPreview || []).length > 0, true)
  assert.equal((payload?.review?.forbiddenPaths || []).length, 0)
  assert.equal(payload?.evidence?.approvalPolicyStatus, 'ready-for-manual-approval-review')
  assert.equal(payload?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'ready-for-review')
}

function runGeneratedDomainMaterializationApprovalPayloadBlockedCase() {
  const payload = observationHarness.buildGeneratedDomainMaterializationApprovalPayload({
    generatedDomainFileCreationApprovalPolicy: {
      present: true,
      evaluated: true,
      status: 'blocked',
      approvalRequired: true,
      approved: false,
      allowedNow: false,
      scope: {
        targetRoot: 'unsafe-local',
        previewPaths: ['unsafe-local', '.env', 'web-prueba/index.html'],
      },
      blockers: {
        unsafePaths: true,
        forbiddenSignals: true,
      },
      safeguards: {
        withinAllowedRootOnly: false,
        noDotEnv: false,
        noNodeModules: true,
        noDocker: false,
        noDeploy: false,
        noExternalServices: false,
        noRealPayments: false,
        noCommands: false,
        noWritesExecuted: true,
        noWebPrueba: false,
      },
    },
    generatedDomainUniversalMaterializationPlanPreview: {
      present: true,
      built: false,
      status: 'blocked',
      root: 'unsafe-local',
      sourceRoot: 'unsafe-local',
      targetRoot: 'unsafe-local',
      allowedTargetPaths: ['unsafe-local', '.env', 'web-prueba/index.html'],
      forbiddenSignals: ['docker', 'deploy'],
      frontend: { present: true },
      backend: { present: true },
      validation: { present: true },
      safety: { safeForLocalMaterialization: false },
    },
    generatedDomainUniversalMaterializationPlanPreviewComparison: {
      present: true,
      compared: true,
      status: 'blocked',
    },
    generatedDomainShadowMaterializationCandidatePlan: {
      present: true,
      status: 'blocked',
      candidate: {
        targetRoot: 'unsafe-local',
      },
    },
    generatedDomainMaterializationInspectionSourceResolution: {
      present: true,
      resolved: true,
      source: 'blocked',
    },
    generatedDomainStructuralCapabilities: {
      present: true,
      evaluated: true,
      capabilities: {
        hasBackend: true,
      },
    },
  })

  assert.equal(payload?.present, true)
  assert.equal(payload?.status, 'blocked')
  assert.equal((payload?.review?.forbiddenPaths || []).length > 0, true)
  assert.equal((payload?.blockedReasons || []).length > 0, true)
  assert.equal(payload?.behaviorChanged, false)
}

function runGeneratedDomainRuntimeShadowReadinessDecisionRequiresApprovalCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const readinessDecision = decision.generatedDomainRuntimeShadowReadinessDecision
  const debugSummary =
    observationHarness.summarizeGeneratedDomainRuntimeShadowReadinessDecisionForDebug(
      readinessDecision,
    )

  assert.equal(readinessDecision?.present, true)
  assert.equal(readinessDecision?.status, 'requires-Lean-approval')
  assert.equal(readinessDecision?.runtimeEnabled, false)
  assert.equal(readinessDecision?.controlledRuntimeEnable, false)
  assert.equal(readinessDecision?.requiresLeanApproval, true)
  assert.equal(readinessDecision?.readiness?.readyForHarness, true)
  assert.equal(readinessDecision?.readiness?.approvalPayloadReady, true)
  assert.equal(readinessDecision?.safeguards?.materializationPlanChanged, false)
  assert.equal(readinessDecision?.safeguards?.executionScopeChanged, false)
  assert.equal(readinessDecision?.recommendation?.action, 'request-lean-approval')
  assert.equal(readinessDecision?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'requires-Lean-approval')
}

function runGeneratedDomainRuntimeShadowReadinessDecisionHarnessOnlyCase() {
  const readinessDecision =
    observationHarness.buildGeneratedDomainRuntimeShadowReadinessDecision({
      generatedDomainControlledEnablePolicy: {
        present: true,
        evaluated: true,
        status: 'eligible-for-test-enable',
        allowedModes: {
          testHarnessEnable: true,
          controlledRuntimeEnable: false,
        },
      },
      generatedDomainFileCreationApprovalPolicy: {
        present: true,
        evaluated: true,
        status: 'not-ready',
        approvalRequired: true,
        approved: false,
        safeguards: {
          noCommands: true,
          noWritesExecuted: true,
          noWebPrueba: true,
        },
      },
      generatedDomainFirstControlledEnableScenario: {
        present: true,
        evaluated: true,
        status: 'not-ready',
      },
      generatedDomainShadowMaterializationCandidatePlan: {
        present: true,
        status: 'built',
      },
      generatedDomainUniversalMaterializationPlanPreview: {
        present: true,
        built: true,
        status: 'built',
      },
      generatedDomainUniversalMaterializationPlanPreviewComparison: {
        present: true,
        compared: true,
        status: 'aligned',
      },
      generatedDomainShadowCandidateLegacyComparison: {
        present: true,
        compared: true,
        status: 'aligned',
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'consistent',
        semanticStatus: 'consistent',
      },
      generatedDomainMaterializationSourceResolution: {
        present: true,
        resolved: true,
        source: 'current',
        runtime: {
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
        testProjection: {
          projectedSource: 'generated-domain-shadow',
        },
      },
      generatedDomainShadowMaterializationEndToEndReadiness: {
        present: true,
        evaluated: true,
        status: 'ready-for-test-harness',
      },
      generatedDomainMaterializationApprovalPayload: {
        present: true,
        evaluated: true,
        status: 'not-ready',
      },
    })

  assert.equal(readinessDecision?.present, true)
  assert.equal(readinessDecision?.status, 'ready-for-harness')
  assert.equal(readinessDecision?.readiness?.readyForHarness, true)
  assert.equal(readinessDecision?.readiness?.approvalPayloadReady, false)
  assert.equal(readinessDecision?.runtimeEnabled, false)
  assert.equal(readinessDecision?.behaviorChanged, false)
}

function runGeneratedDomainRuntimeShadowReadinessDecisionBlockedCase() {
  const readinessDecision =
    observationHarness.buildGeneratedDomainRuntimeShadowReadinessDecision({
      generatedDomainControlledEnablePolicy: {
        present: true,
        evaluated: true,
        status: 'blocked',
      },
      generatedDomainFileCreationApprovalPolicy: {
        present: true,
        evaluated: true,
        status: 'blocked',
        safeguards: {
          noCommands: false,
          noWritesExecuted: false,
          noWebPrueba: false,
        },
      },
      generatedDomainFirstControlledEnableScenario: {
        present: true,
        evaluated: true,
        status: 'blocked',
      },
      generatedDomainShadowMaterializationCandidatePlan: {
        present: true,
        status: 'blocked',
      },
      generatedDomainUniversalMaterializationPlanPreview: {
        present: true,
        built: false,
        status: 'blocked',
      },
      generatedDomainUniversalMaterializationPlanPreviewComparison: {
        present: true,
        compared: true,
        status: 'blocked',
      },
      generatedDomainShadowCandidateLegacyComparison: {
        present: true,
        compared: true,
        status: 'blocked',
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'mismatch',
        semanticStatus: 'mismatch',
      },
      generatedDomainMaterializationSourceResolution: {
        present: true,
        resolved: true,
        source: 'generated-domain-shadow',
        runtime: {
          materializationPlanChanged: true,
          executionScopeChanged: true,
        },
      },
      generatedDomainShadowMaterializationEndToEndReadiness: {
        present: true,
        evaluated: true,
        status: 'blocked',
      },
      generatedDomainMaterializationApprovalPayload: {
        present: true,
        evaluated: true,
        status: 'blocked',
      },
    })

  assert.equal(readinessDecision?.present, true)
  assert.equal(readinessDecision?.status, 'blocked')
  assert.equal(readinessDecision?.blockers?.domainMismatch, true)
  assert.equal(readinessDecision?.blockers?.runtimeNormalNotOff, true)
  assert.equal(readinessDecision?.behaviorChanged, false)
}

function runGeneratedDomainUniversalMaterializationPlanPreviewBuiltCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const preview = decision.generatedDomainUniversalMaterializationPlanPreview
  const debugSummary =
    observationHarness.summarizeGeneratedDomainUniversalMaterializationPlanPreviewForDebug(
      preview,
    )

  assert.equal(preview?.present, true)
  assert.equal(preview?.built, true)
  assert.equal(preview?.status, 'built')
  assert.equal(preview?.approvalRequired, true)
  assert.equal(preview?.canBecomeMaterializationPlan, true)
  assert.equal(preview?.frontend?.present, true)
  assert.equal(preview?.backend?.present, true)
  assert.equal(preview?.database?.present, true)
  assert.equal(preview?.safety?.safeForLocalMaterialization, true)
  assert.equal(preview?.safety?.noDotEnv, true)
  assert.equal(preview?.safety?.noNodeModules, true)
  assert.equal(preview?.safety?.noDocker, true)
  assert.equal(preview?.safety?.noCommands, true)
  assert.equal(preview?.safety?.noWrites, true)
  assert.equal('operations' in preview, false)
  assert.equal(preview?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'built')
}

function runGeneratedDomainUniversalMaterializationPlanPreviewBlockedCase() {
  const preview = observationHarness.buildGeneratedDomainUniversalMaterializationPlanPreview({
    generatedDomainContract: {
      ...createValidInventedContract(),
      root: {
        slug: 'unsafe-local',
        sourceRoot: 'unsafe-local',
        targetRoot: 'unsafe-local',
      },
      safety: {
        forbiddenFiles: ['.env'],
        forbiddenSignals: ['ACCESS_TOKEN'],
        explicitExclusions: ['deploy', 'docker'],
      },
      materialization: {
        requiredFiles: ['backend/src/server.js', '.env', 'web-prueba/index.html'],
        operations: [{ targetPath: 'backend/src/server.js' }],
      },
    },
    generatedDomainContractDiagnostics: null,
    generatedDomainCapabilityProfile: null,
    generatedDomainShadowMaterializationCandidatePlan: {
      present: true,
      built: false,
      candidate: {
        safety: {
          safeForLocalMaterialization: false,
        },
      },
    },
    generatedDomainFileCreationApprovalPolicy: {
      present: true,
      evaluated: true,
      approvalRequired: true,
      approved: false,
      allowedNow: false,
    },
    domainConsistencyDiagnostics: {
      present: true,
      checked: true,
      status: 'mismatch',
      semanticStatus: 'mismatch',
    },
  })

  assert.equal(preview?.present, true)
  assert.equal(preview?.status, 'blocked')
  assert.equal(preview?.built, false)
  assert.equal(preview?.canBecomeMaterializationPlan, false)
  assert.equal(preview?.approvalRequired, true)
  assert.equal(preview?.behaviorChanged, false)
}

function runGeneratedDomainUniversalMaterializationPlanPreviewComparisonAlignedCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const comparison =
    decision.generatedDomainUniversalMaterializationPlanPreviewComparison
  const debugSummary =
    observationHarness.summarizeGeneratedDomainUniversalMaterializationPlanPreviewComparisonForDebug(
      comparison,
    )

  assert.equal(comparison?.present, true)
  assert.equal(comparison?.compared, true)
  assert.equal(comparison?.status, 'aligned')
  assert.equal(comparison?.roots?.aligned, true)
  assert.equal(comparison?.allowedTargets?.aligned, true)
  assert.equal(comparison?.requiredGroups?.aligned, true)
  assert.equal(comparison?.buckets?.allAligned, true)
  assert.equal(comparison?.safety?.aligned, true)
  assert.equal(comparison?.recommendation?.action, 'ready-for-harness')
  assert.equal(comparison?.behaviorChanged, false)
  assert.equal(debugSummary?.status, 'aligned')
}

function runGeneratedDomainUniversalMaterializationPlanPreviewComparisonBlockedCase() {
  const comparison =
    observationHarness.buildGeneratedDomainUniversalMaterializationPlanPreviewComparison({
      generatedDomainUniversalMaterializationPlanPreview: {
        present: true,
        built: false,
        status: 'blocked',
        root: 'unsafe-local',
        targetRoot: 'unsafe-local',
        allowedTargetPaths: ['unsafe-local', '.env'],
        requiredPathGroups: [{ candidates: ['backend/src/server.js'] }],
        frontend: { present: true },
        backend: { present: true, entryFile: 'backend/src/server.js' },
        database: { present: true, schemaFile: 'database/schema.sql' },
        safety: {
          safeForLocalMaterialization: false,
          noDotEnv: false,
          noNodeModules: true,
          noDocker: true,
          noCommands: false,
          noWrites: false,
        },
      },
      materializationPlan: {
        projectRoot: 'unsafe-local',
        allowedTargetPaths: ['unsafe-local/backend/src/server.js'],
      },
      generatedDomainShadowMaterializationCandidatePlan: {
        present: true,
        candidate: {
          targetRoot: 'unsafe-local',
          allowedTargetPaths: ['unsafe-local/.env'],
          plannedBuckets: { frontend: true, backend: true, database: true },
          safety: {
            safeForLocalMaterialization: false,
          },
        },
      },
    })

  assert.equal(comparison?.present, true)
  assert.equal(comparison?.status, 'blocked')
  assert.equal(comparison?.recommendation?.action, 'investigate')
  assert.equal(comparison?.behaviorChanged, false)
}

function runGeneratedDomainUniversalMaterializationPlanPreviewInventedDomainsCase() {
  const inventedContracts = [
    {
      label: 'Banco comunitario de herramientas',
      slug: 'banco-comunitario-herramientas',
      root: 'banco-herramientas-local',
      entities: ['herramientas', 'prestamos', 'socios'],
      workflows: ['loan-checkout', 'returns', 'maintenance'],
    },
    {
      label: 'Refugios de animales barriales',
      slug: 'refugios-animales-barriales',
      root: 'refugios-animales-local',
      entities: ['animales', 'adopciones', 'voluntarios'],
      workflows: ['adoption-tracking', 'medical-checks', 'volunteer-shifts'],
    },
    {
      label: 'Centros de apoyo escolar',
      slug: 'centros-apoyo-escolar',
      root: 'apoyo-escolar-local',
      entities: ['centros', 'estudiantes', 'tutores'],
      workflows: ['attendance', 'class-scheduling', 'community-reporting'],
    },
    {
      label: 'Talleres textiles cooperativos',
      slug: 'talleres-textiles-cooperativos',
      root: 'talleres-textiles-local',
      entities: ['talleres', 'prendas', 'pedidos'],
      workflows: ['production-planning', 'inventory-tracking', 'community-reporting'],
    },
    {
      label: 'Comedores comunitarios barriales',
      slug: 'comedores-comunitarios-barriales',
      root: 'comedores-comunitarios-local',
      entities: ['comedores', 'beneficiarios', 'raciones'],
      workflows: ['meal-planning', 'stock-control', 'attendance-reporting'],
    },
    {
      label: 'Huertas urbanas compartidas',
      slug: 'huertas-urbanas-compartidas',
      root: 'huertas-urbanas-local',
      entities: ['huertas', 'parcelas', 'cultivos'],
      workflows: ['harvest-tracking', 'task-scheduling', 'community-reporting'],
    },
    {
      label: 'Criadero local de plantas carnivoras',
      slug: 'criadero-plantas-carnivoras',
      root: 'plantas-carnivoras-local',
      entities: ['plantas', 'especies', 'reservas'],
      workflows: ['visit-reservations', 'care-routine', 'mock-sales'],
    },
  ]

  inventedContracts.forEach((fixture) => {
    const contract = createValidInventedContract()
    contract.domain = {
      label: fixture.label,
      slug: fixture.slug,
      summary: `Gestion local para ${fixture.label.toLowerCase()}.`,
    }
    contract.root = {
      slug: fixture.root,
      sourceRoot: fixture.root,
      targetRoot: fixture.root,
    }
    contract.entities = fixture.entities
    contract.workflows = fixture.workflows
    const decision = createGeneratedDomainAlignedApprovalObservationDecision({
      generatedDomainContract: contract,
      decisionKey: `generated-domain-preview-${fixture.slug}`,
    })

    assert.equal(decision.generatedDomainUniversalMaterializationPlanPreview?.present, true)
    assert.equal(decision.generatedDomainUniversalMaterializationPlanPreview?.status, 'built')
    assert.equal(
      decision.generatedDomainUniversalMaterializationPlanPreview?.canBecomeMaterializationPlan,
      true,
    )
    assert.equal(
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison?.status,
      'aligned',
    )
  })
}

function runGeneratedDomainStructuralCapabilitiesInventedCase() {
  const contract = createValidInventedContract()
  contract.domain = {
    label: 'Cooperativa barrial de herramientas raras',
    slug: 'cooperativa-herramientas-raras',
    summary: 'Gestion local de prestamos, mantenimiento, reportes y coordinacion comunitaria.',
  }
  contract.root = {
    slug: 'cooperativa-herramientas-raras-local',
    sourceRoot: 'cooperativa-herramientas-raras-local',
    targetRoot: 'cooperativa-herramientas-raras-local',
  }
  contract.entities = ['herramientas', 'prestamos', 'coordinaciones', 'mantenimientos']
  contract.workflows = ['loan-checkout', 'maintenance', 'community-reporting']
  const decision = createGeneratedDomainAlignedApprovalObservationDecision({
    generatedDomainContract: contract,
    decisionKey: 'generated-domain-structural-capabilities-invented',
  })
  const capabilities = decision.generatedDomainStructuralCapabilities
  const debugSummary =
    observationHarness.summarizeGeneratedDomainStructuralCapabilitiesForDebug(
      capabilities,
    )

  assert.equal(capabilities?.present, true)
  assert.equal(capabilities?.evaluated, true)
  assert.equal(capabilities?.hasPublicFrontend, true)
  assert.equal(capabilities?.hasAdminPanel, true)
  assert.equal(capabilities?.hasBackend, true)
  assert.equal(capabilities?.hasDatabase, true)
  assert.equal(capabilities?.hasReporting, true)
  assert.equal(capabilities?.hasValidation, true)
  assert.equal(capabilities?.hasSafeLocalMaterialization, true)
  assert.equal(capabilities?.behaviorChanged, false)
  assert.equal(debugSummary?.hasSafeLocalMaterialization, true)
}

function runLegacyDomainHardcodingDebtReportCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const report = decision.legacyDomainHardcodingDebtReport
  const debugSummary =
    observationHarness.summarizeLegacyDomainHardcodingDebtReportForDebug(report)

  assert.equal(report?.present, true)
  assert.equal(report?.evaluated, true)
  assert.equal(report?.behaviorChanged, false)
  assert.equal(report?.legacyResolversDetected > 0, true)
  assert.equal(report?.runtimeCriticalCount > 0, true)
  assert.equal(report?.fixtureOnlyCount > 0, true)
  assert.equal(Array.isArray(report?.migrationCandidates), true)
  assert.equal(Array.isArray(report?.riskyAreas), true)
  assert.equal(
    report?.migrationCandidates?.some(
      (entry) => entry?.area === 'buildCanonicalFullstackLocalMaterializationContract',
    ),
    true,
  )
  assert.equal(
    report?.riskyAreas?.some(
      (entry) => entry?.area === 'buildFullstackLocalMaterializationPlan',
    ),
    true,
  )
  assert.equal(debugSummary?.runtimeCriticalCount > 0, true)
}

function runLocalDeterministicExecutorLegacyDebtReportCase() {
  const report = observationHarness.buildLocalDeterministicExecutorLegacyDebtReport()
  const debugSummary =
    observationHarness.summarizeLocalDeterministicExecutorLegacyDebtReportForDebug(report)

  assert.equal(report?.present, true)
  assert.equal(report?.evaluated, true)
  assert.equal(report?.behaviorChanged, false)
  assert.equal(report?.executorFilePresent, true)
  assert.equal(report?.legacyBranchesDetected > 0, true)
  assert.equal(report?.runtimeCriticalCount > 0, true)
  assert.equal(Array.isArray(report?.domainSpecificSignals), true)
  assert.equal(Array.isArray(report?.capabilityMigrationCandidates), true)
  assert.equal(Array.isArray(report?.riskyAreas), true)
  assert.equal(
    report?.domainSpecificSignals?.includes('ecommerce') &&
      report?.domainSpecificSignals?.includes('school-crm') &&
      report?.domainSpecificSignals?.includes('generic'),
    true,
  )
  assert.equal(
    report?.capabilityMigrationCandidates?.some((entry) => entry?.capability === 'catalog'),
    true,
  )
  assert.equal(
    report?.riskyAreas?.some((entry) => entry?.area === 'buildSafeFirstDeliveryRuntimeModeConfig'),
    true,
  )
  assert.equal(debugSummary?.runtimeCriticalCount > 0, true)
}

function runLocalDeterministicExecutorCapabilityMigrationPlanCase() {
  const debtReport = observationHarness.buildLocalDeterministicExecutorLegacyDebtReport()
  const plan = observationHarness.buildLocalDeterministicExecutorCapabilityMigrationPlan({
    localDeterministicExecutorLegacyDebtReport: debtReport,
  })
  const debugSummary =
    observationHarness.summarizeLocalDeterministicExecutorCapabilityMigrationPlanForDebug(plan)

  assert.equal(plan?.present, true)
  assert.equal(plan?.evaluated, true)
  assert.equal(plan?.behaviorChanged, false)
  assert.equal(Array.isArray(plan?.capabilityTargets), true)
  assert.equal(plan?.branchMappedCount > 0, true)
  assert.equal(plan?.notReadyCount > 0, true)
  assert.equal(
    plan?.capabilityTargets?.some(
      (entry) =>
        entry?.capability === 'catalog' && Array.isArray(entry?.currentBranches) && entry.currentBranches.length > 0,
    ),
    true,
  )
  assert.equal(
    plan?.capabilityTargets?.some(
      (entry) => entry?.capability === 'backend-api' && entry?.migrationReadiness === 'not-ready',
    ),
    true,
  )
  assert.equal(debugSummary?.capabilityTargetsCount > 0, true)
}

function runGeneratedDomainMaterializationInspectionSourceResolutionCandidateCase() {
  const decision = createGeneratedDomainAlignedApprovalObservationDecision()
  const resolution =
    decision.generatedDomainMaterializationInspectionSourceResolution
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationInspectionSourceResolutionForDebug(
      resolution,
    )

  assert.equal(resolution?.present, true)
  assert.equal(resolution?.resolved, true)
  assert.equal(resolution?.source, 'generated-domain-candidate')
  assert.equal(resolution?.candidatePreferred, true)
  assert.equal(resolution?.legacyUsedAsFallback, false)
  assert.equal(resolution?.runtime?.materializationPlanChanged, false)
  assert.equal(resolution?.runtime?.executionScopeChanged, false)
  assert.equal(resolution?.behaviorChanged, false)
  assert.equal(debugSummary?.source, 'generated-domain-candidate')
}

function runGeneratedDomainMaterializationInspectionSourceResolutionLegacyFallbackCase() {
  const alignedDecision = createGeneratedDomainAlignedApprovalObservationDecision()
  const resolution =
    observationHarness.buildGeneratedDomainMaterializationInspectionSourceResolution({
      generatedDomainShadowMaterializationCandidatePlan: {
        ...alignedDecision.generatedDomainShadowMaterializationCandidatePlan,
        status: 'partial',
        compatibility: {
          ...alignedDecision.generatedDomainShadowMaterializationCandidatePlan
            ?.compatibility,
          canBeInspected: false,
          canBeUsedByFutureSwitch: false,
        },
      },
      generatedDomainShadowCandidateLegacyComparison: {
        ...alignedDecision.generatedDomainShadowCandidateLegacyComparison,
        status: 'partial',
      },
      generatedDomainFileCreationApprovalPolicy: {
        ...alignedDecision.generatedDomainFileCreationApprovalPolicy,
        status: 'not-ready',
      },
      domainConsistencyDiagnostics: alignedDecision.domainConsistencyDiagnostics,
      materializationPlan: alignedDecision.materializationPlan,
      fullstackLocalInspectionSourceDiagnostics:
        {
          ...alignedDecision.fullstackLocalInspectionSourceDiagnostics,
          source: 'legacy-canonical-contract',
          generatedDomainContractUsed: false,
          legacyCanonicalContractUsed: true,
          fallbackUsed: true,
        },
    })

  assert.equal(resolution?.present, true)
  assert.equal(resolution?.source, 'legacy')
  assert.equal(resolution?.candidatePreferred, false)
  assert.equal(resolution?.legacyUsedAsFallback, true)
  assert.equal(resolution?.runtime?.materializationPlanChanged, false)
  assert.equal(resolution?.runtime?.executionScopeChanged, false)
  assert.equal(resolution?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationInspectionSourceResolutionBlockedCase() {
  const resolution =
    observationHarness.buildGeneratedDomainMaterializationInspectionSourceResolution({
      generatedDomainShadowMaterializationCandidatePlan: {
        present: true,
        built: false,
        status: 'blocked',
        compatibility: {
          canBeInspected: false,
          canBeUsedByFutureSwitch: false,
        },
        candidate: {
          safety: {
            safeForLocalMaterialization: false,
          },
        },
      },
      generatedDomainShadowCandidateLegacyComparison: {
        present: true,
        compared: true,
        status: 'blocked',
      },
      generatedDomainFileCreationApprovalPolicy: {
        present: true,
        evaluated: true,
        status: 'blocked',
        safeguards: {
          noCommands: false,
          noWritesExecuted: true,
          noWebPrueba: false,
        },
      },
      domainConsistencyDiagnostics: {
        present: true,
        checked: true,
        status: 'mismatch',
        semanticStatus: 'mismatch',
      },
      materializationPlan: null,
      fullstackLocalInspectionSourceDiagnostics: {
        present: true,
        source: 'unavailable',
      },
    })

  assert.equal(resolution?.present, true)
  assert.equal(resolution?.source, 'blocked')
  assert.equal(resolution?.legacyUsedAsFallback, false)
  assert.equal(resolution?.blockers?.domainMismatch, true)
  assert.equal(resolution?.blockers?.approvalBlocked, true)
  assert.equal(resolution?.behaviorChanged, false)
}

function runGeneratedDomainMaterializationInspectionSourceResolutionNoneCase() {
  const resolution =
    observationHarness.buildGeneratedDomainMaterializationInspectionSourceResolution({
      generatedDomainShadowMaterializationCandidatePlan: null,
      generatedDomainShadowCandidateLegacyComparison: null,
      generatedDomainFileCreationApprovalPolicy: null,
      domainConsistencyDiagnostics: null,
      materializationPlan: null,
      fullstackLocalInspectionSourceDiagnostics: null,
    })

  assert.equal(resolution?.present, false)
  assert.equal(resolution?.source, 'none')
  assert.equal(resolution?.behaviorChanged, false)
}

function runDomainConsistencyDiagnosticsDiscardResidualMetadataCase() {
  const generatedDomainContract = {
    ...createValidInventedContract(),
    domain: {
      label: 'Gestion de merenderos barriales',
      slug: 'gestion-merenderos',
      summary: 'Gestion local de merenderos, asistencia, stock y reportes comunitarios.',
    },
    root: {
      slug: 'merenderos-local',
      sourceRoot: 'merenderos-local',
      targetRoot: 'merenderos-local',
    },
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'merenderos-arch-plan-v1',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-plan',
    reason: 'Construir una arquitectura local para un servicio comunitario nuevo.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    selectedDomain: 'community-services',
    selectedContractKind: 'generic-fullstack-local',
    sourceRoot: 'merenderos-local',
    targetRoot: 'merenderos-local',
    productArchitecture: {
      productType: 'crm local',
      domain: 'gestion escolar',
      coreModules: ['alumnos', 'familias', 'seguimiento'],
    },
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'gestion escolar',
      intent: 'gestionar seguimiento escolar y comunicaciones',
      deliveryLevel: 'fullstack-local',
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      reason: 'Plan legado residual de un dominio anterior.',
      allowedRootPaths: ['fullstack-local-gestion-escolar'],
      targetStructure: ['fullstack-local-gestion-escolar/'],
      directories: ['fullstack-local-gestion-escolar/frontend/admin'],
      filesToCreate: [{ path: 'fullstack-local-gestion-escolar/frontend/admin/index.html' }],
    },
    projectPhaseExecutionPlan: {
      phaseId: 'frontend-mock-flow',
      projectRoot: 'fullstack-local-gestion-escolar',
      goal: 'Continuar la maqueta escolar previa.',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'fullstack-local-gestion-escolar',
      domain: 'gestion escolar',
      projectType: 'fullstack-local-app',
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diagnostics = decision.domainConsistencyDiagnostics
  const debugSummary =
    observationHarness.summarizeDomainConsistencyDiagnosticsForDebug(diagnostics)

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.checked, true)
  assert.equal(diagnostics?.status, 'mismatch')
  assert.equal(diagnostics?.currentRootSlug, 'merenderos-local')
  assert.equal(diagnostics?.visibleRoot, 'fullstack-local-gestion-escolar')
  assert.equal((diagnostics?.mismatches || []).length > 0, true)
  assert.equal(debugSummary.status, 'mismatch')
  assert.equal(Boolean(decision.productArchitecture), false)
  assert.equal(Boolean(decision.projectBlueprint), false)
  assert.equal(Boolean(decision.scalableDeliveryPlan), false)
  assert.equal(Boolean(decision.projectPhaseExecutionPlan), false)
  assert.equal(Boolean(decision.localProjectManifest), false)
  assert.equal(decision.strategy, 'product-architecture-plan')
  assert.equal(decision.executionMode, 'planner-only')
  assert.equal(decision.nextExpectedAction, 'review-plan')
  assert.equal(decision.generatedDomainMaterializationShadowPlan?.present, true)
  assert.equal(decision.generatedDomainMaterializationPreferenceGate?.present, true)
  assert.equal(decision.generatedDomainMaterializationShadowDiff?.present, true)
}

function runDomainConsistencyDiagnosticsSemanticMismatchCase() {
  const generatedDomainContract = {
    ...createValidInventedContract(),
    domain: {
      label: 'App de gestion de comedores comunitarios barriales',
      slug: 'comedores-comunitarios',
      summary: 'Gestion local de comedores, raciones, beneficiarios e insumos comunitarios.',
    },
    root: {
      slug: 'comedores-comunitarios-local',
      sourceRoot: 'comedores-comunitarios-local',
      targetRoot: 'comedores-comunitarios-local',
    },
    roles: ['coordinacion', 'voluntariado', 'referente territorial'],
    entities: ['comedores', 'beneficiarios', 'raciones', 'insumos'],
    workflows: ['serving-shifts', 'inventory', 'community-reporting'],
  }
  const decision = observationHarness.buildBrainDecisionContract({
    decisionKey: 'comedores-arch-plan-v1',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-plan',
    reason: 'Construir una arquitectura local para una red de comedores comunitarios.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    selectedDomain: 'community-services',
    selectedContractKind: 'generic-fullstack-local',
    sourceRoot: 'comedores-comunitarios-local',
    targetRoot: 'comedores-comunitarios-local',
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'app de gestion de comedores comunitarios barriales',
      roles: ['pacientes', 'profesionales', 'operador interno'],
      coreModules: ['agenda clinica', 'profesionales', 'turnos'],
      dataEntities: ['pacientes', 'profesionales', 'especialidades', 'turnos'],
      keyFlows: ['agendar turnos', 'asignar profesionales', 'confirmar asistencia'],
    },
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'app de gestion de comedores comunitarios barriales',
      intent: 'gestionar operacion local del comedor comunitario',
      deliveryLevel: 'fullstack-local',
      roles: ['pacientes', 'profesionales', 'operador interno'],
      modules: ['agenda clinica', 'profesionales', 'turnos'],
      entities: ['pacientes', 'profesionales', 'especialidades', 'turnos'],
      coreFlows: ['agendar turnos', 'asignar profesionales'],
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })
  const diagnostics = decision.domainConsistencyDiagnostics
  const debugSummary =
    observationHarness.summarizeDomainConsistencyDiagnosticsForDebug(diagnostics)

  assert.equal(diagnostics?.present, true)
  assert.equal(diagnostics?.status, 'mismatch')
  assert.equal(diagnostics?.semanticChecked, true)
  assert.equal(diagnostics?.semanticStatus, 'mismatch')
  assert.equal((diagnostics?.incompatibleBlocks || []).includes('productArchitecture'), true)
  assert.equal((diagnostics?.incompatibleBlocks || []).includes('projectBlueprint'), true)
  assert.equal((diagnostics?.discardedBlocks || []).includes('productArchitecture'), true)
  assert.equal((diagnostics?.discardedBlocks || []).includes('projectBlueprint'), true)
  assert.equal(typeof diagnostics?.semanticOverlapScore, 'number')
  assert.equal(diagnostics?.semanticOverlapScore < 0.2, true)
  assert.equal(debugSummary.semanticStatus, 'mismatch')
  assert.equal(Boolean(decision.productArchitecture), false)
  assert.equal(Boolean(decision.projectBlueprint), false)
  assert.equal(decision.strategy, 'product-architecture-plan')
  assert.equal(decision.executionMode, 'planner-only')
  assert.equal(decision.nextExpectedAction, 'review-plan')
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

function runGeneratedDomainMaterializationShadowPlanBuiltCase() {
  const contract = createValidInventedContract()
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    { generatedDomainContract: contract },
    repoRoot,
  )
  const capabilityProfile = buildGeneratedDomainCapabilityProfile(contract, diagnostics)
  const shadowPlan = buildGeneratedDomainMaterializationShadowPlan(
    contract,
    diagnostics,
    capabilityProfile,
  )
  const debugSummary =
    observationHarness.summarizeGeneratedDomainMaterializationShadowPlanForDebug(shadowPlan)

  assert.equal(shadowPlan.present, true)
  assert.equal(shadowPlan.built, true)
  assert.equal(shadowPlan.status, 'built')
  assert.equal(shadowPlan.behaviorChanged, false)
  assert.equal(shadowPlan.backendPresent, true)
  assert.equal(shadowPlan.databasePresent, true)
  assert.ok(shadowPlan.allowedTargetPathsCount > 0)
  assert.ok(shadowPlan.requiredPathGroupsCount > 0)
  assert.equal(debugSummary.present, true)
  assert.equal(debugSummary.status, 'built')
}

function runGeneratedDomainMaterializationShadowPlanNotAvailableCase() {
  const shadowPlan = buildGeneratedDomainMaterializationShadowPlan(null, null, null)

  assert.equal(shadowPlan.present, false)
  assert.equal(shadowPlan.built, false)
  assert.equal(shadowPlan.status, 'not-available')
  assert.equal(shadowPlan.behaviorChanged, false)
}

function runGeneratedDomainMaterializationShadowPlanPartialCase() {
  const contract = createSparseDeliveryLevelContract('safe-first-delivery')
  const diagnostics = buildGeneratedDomainContractDiagnostics(
    { generatedDomainContract: contract },
    repoRoot,
  )
  const capabilityProfile = buildGeneratedDomainCapabilityProfile(contract, diagnostics)
  const shadowPlan = buildGeneratedDomainMaterializationShadowPlan(
    contract,
    diagnostics,
    capabilityProfile,
  )

  assert.equal(shadowPlan.present, true)
  assert.equal(shadowPlan.built, false)
  assert.equal(shadowPlan.status, 'partial')
  assert.equal(shadowPlan.behaviorChanged, false)
  assert.ok(shadowPlan.warningsCount > 0)
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
  runGeneratedDomainMaterializationShadowPlanBuiltCase()
  runGeneratedDomainMaterializationShadowPlanNotAvailableCase()
  runGeneratedDomainMaterializationShadowPlanPartialCase()
  runBrainDecisionContractObservationCase()
  runLegacyDomainResolutionDiagnosticsUsedCase()
  runLegacyDomainResolutionDiagnosticsWithGeneratedContractCase()
  runLegacyDomainResolutionDiagnosticsNotUsedCase()
  runLegacyCapabilityAlignmentDiagnosticsAlignedCase()
  runLegacyCapabilityAlignmentDiagnosticsDivergentCase()
  runLegacyCapabilityAlignmentDiagnosticsLegacyFallbackCase()
  runLegacyCapabilityAlignmentDiagnosticsNotAvailableCase()
  runLegacyMigrationCandidateReportNoActionCase()
  runLegacyMigrationCandidateReportCandidateCase()
  runLegacyMigrationCandidateReportFallbackNeededCase()
  runLegacyMigrationCandidateReportErrorCase()
  runCapabilityPreferredInspectionUsesGeneratedContractCase()
  runCapabilityPreferredInspectionUsesExplicitContractCase()
  runCapabilityPreferredInspectionUsesLegacyFallbackCase()
  runCapabilityPreferredInspectionUnavailableCase()
  runGeneratedDomainMaterializationShadowComparisonWithoutLegacyCase()
  runGeneratedDomainMaterializationShadowComparisonAlignedCase()
  runGeneratedDomainMaterializationShadowComparisonKeepLegacyCase()
  runGeneratedDomainMaterializationShadowComparisonWithoutContractCase()
  runGeneratedDomainMaterializationPreferenceGateEligibleCase()
  runGeneratedDomainMaterializationPreferenceGateNeedsMoreEvidenceCase()
  runGeneratedDomainMaterializationPreferenceGateNotReadyCase()
  runGeneratedDomainMaterializationPreferenceGateBlockedCase()
  runGeneratedDomainMaterializationShadowDiffWithoutLegacyCase()
  runGeneratedDomainMaterializationShadowDiffComparedCase()
  runGeneratedDomainMaterializationShadowDiffDivergentCase()
  runGeneratedDomainMaterializationShadowDiffWithoutContractCase()
  runGeneratedDomainMaterializationPreferenceDecisionWouldPreferShadowCase()
  runGeneratedDomainMaterializationPreferenceDecisionWouldKeepLegacyCase()
  runGeneratedDomainMaterializationPreferenceDecisionBlockedCase()
  runGeneratedDomainMaterializationPreferenceDecisionNotAvailableCase()
  runGeneratedDomainMaterializationPreferenceSwitchDisabledWouldPreferShadowCase()
  runGeneratedDomainMaterializationPreferenceSwitchDisabledKeepLegacyCase()
  runGeneratedDomainMaterializationPreferenceSwitchInvestigateCase()
  runGeneratedDomainMaterializationPreferenceSwitchTestEnabledCase()
  runGeneratedDomainMaterializationSwitchReadinessReportNotReadyCase()
  runGeneratedDomainMaterializationSwitchReadinessReportReadyCase()
  runGeneratedDomainMaterializationSwitchReadinessReportDomainBlockedCase()
  runGeneratedDomainMaterializationSwitchReadinessReportDiffBlockedCase()
  runGeneratedDomainMaterializationSourceResolutionRuntimeLegacyCase()
  runGeneratedDomainMaterializationSourceResolutionRuntimeNoneCase()
  runGeneratedDomainMaterializationSourceResolutionRuntimeDisabledShadowCandidateCase()
  runGeneratedDomainMaterializationSourceResolutionTestEnabledShadowCase()
  runGeneratedDomainMaterializationSourceResolutionTestBlockedCase()
  runGeneratedDomainShadowMaterializationCandidatePlanBuiltCase()
  runGeneratedDomainShadowMaterializationCandidatePlanPartialCase()
  runGeneratedDomainShadowMaterializationCandidatePlanNotAvailableCase()
  runGeneratedDomainShadowMaterializationCandidatePlanBlockedCase()
  runGeneratedDomainShadowCandidateLegacyComparisonAlignedCase()
  runGeneratedDomainShadowCandidateLegacyComparisonBlockedCase()
  runGeneratedDomainShadowMaterializationEndToEndReadinessReadyCase()
  runGeneratedDomainShadowMaterializationEndToEndReadinessBlockedCase()
  runGeneratedDomainControlledEnablePolicyNotReadyWithoutLegacyCase()
  runGeneratedDomainControlledEnablePolicyEligibleCase()
  runGeneratedDomainControlledEnablePolicyDomainMismatchCase()
  runGeneratedDomainControlledEnablePolicyCandidateBlockedCase()
runGeneratedDomainFirstControlledEnableScenarioReadyForReviewCase()
runGeneratedDomainFirstControlledEnableScenarioBlockedCase()
runGeneratedDomainFileCreationApprovalPolicyReadyCase()
runGeneratedDomainFileCreationApprovalPolicyBlockedCase()
runGeneratedDomainMaterializationApprovalPayloadReadyCase()
runGeneratedDomainMaterializationApprovalPayloadBlockedCase()
runGeneratedDomainRuntimeShadowReadinessDecisionRequiresApprovalCase()
runGeneratedDomainRuntimeShadowReadinessDecisionHarnessOnlyCase()
runGeneratedDomainRuntimeShadowReadinessDecisionBlockedCase()
runGeneratedDomainUniversalMaterializationPlanPreviewBuiltCase()
runGeneratedDomainUniversalMaterializationPlanPreviewBlockedCase()
runGeneratedDomainUniversalMaterializationPlanPreviewComparisonAlignedCase()
runGeneratedDomainUniversalMaterializationPlanPreviewComparisonBlockedCase()
  runGeneratedDomainUniversalMaterializationPlanPreviewInventedDomainsCase()
  runGeneratedDomainStructuralCapabilitiesInventedCase()
  runLegacyDomainHardcodingDebtReportCase()
  runLocalDeterministicExecutorLegacyDebtReportCase()
  runLocalDeterministicExecutorCapabilityMigrationPlanCase()
  runGeneratedDomainMaterializationInspectionSourceResolutionCandidateCase()
runGeneratedDomainMaterializationInspectionSourceResolutionLegacyFallbackCase()
runGeneratedDomainMaterializationInspectionSourceResolutionBlockedCase()
runGeneratedDomainMaterializationInspectionSourceResolutionNoneCase()
runDomainConsistencyDiagnosticsDiscardResidualMetadataCase()
  runDomainConsistencyDiagnosticsSemanticMismatchCase()
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
  console.log('OK. GeneratedDomainContract smoke completado.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
