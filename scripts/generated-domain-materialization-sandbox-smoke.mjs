import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { loadMainPlannerExtractedHelperDependencies } from './main-planner-extracted-helper-dependencies.mjs'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainPlannerExtractedHelperDependencies =
  loadMainPlannerExtractedHelperDependencies(repoRoot)
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
  buildGeneratedDomainCapabilityProfile,
  buildGeneratedDomainMaterializationShadowPlan,
  buildGeneratedDomainContractComparison,
  extractGeneratedDomainContractCandidate,
} = require(path.join(repoRoot, 'electron', 'generated-domain-contract.cjs'))
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
const generatedDomainOrchestrationDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-orchestration-diagnostics.cjs'),
)
const generatedDomainLegacyDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-legacy-diagnostics.cjs'),
)
const generatedDomainMaterializationPolicies = require(
  path.join(repoRoot, 'electron', 'generated-domain-materialization-policies.cjs'),
)
const generatedDomainInspectionDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-inspection-diagnostics.cjs'),
)
const generatedDomainMaterializationPlanDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-materialization-plan-diagnostics.cjs'),
)

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

function loadObservationHarness() {
  const plannerSurface = extractSegment({
    startMarker: 'function summarizeGeneratedDomainContractDiagnosticsForDebug(diagnostics) {',
    endMarker: 'function createLocalRulesStrategicBrainProvider() {',
  })
  const harness = `
${plannerSurface}
module.exports = {
  buildBrainDecisionContract,
  buildGeneratedDomainMaterializationApprovalSurface,
  buildGeneratedDomainUniversalMaterializationPlan,
  resolveGeneratedDomainControlledRuntimeMaterializationSource,
  evaluateGeneratedDomainFileCreationApproval,
  materializeGeneratedDomainSandboxPlan,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    __dirname: path.join(repoRoot, 'electron'),
    console,
    process,
    Buffer,
    fs,
    path,
    LOCAL_MATERIALIZATION_PLAN_VERSION,
    FULLSTACK_LOCAL_BASE_PHASES,
    getFullstackLocalBasePhaseDefinition,
    buildFullstackLocalManifestPhaseBlueprints,
    ...mainPlannerExtractedHelperDependencies,
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
    extractGeneratedDomainContractCandidate,
    generatedDomainOrchestrationDiagnostics,
    generatedDomainLegacyDiagnostics,
    generatedDomainMaterializationPolicies,
    generatedDomainInspectionDiagnostics,
    generatedDomainMaterializationPlanDiagnostics,
    AbortController,
    fetch: globalThis.fetch,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)
  vm.runInContext(harness, sandbox, {
    filename: 'generated-domain-materialization-sandbox-smoke-harness.cjs',
  })

  return sandbox.module.exports || {}
}

const observationHarness = loadObservationHarness()
const sandboxRootRelative = '.codex-temp/generated-domain-materialization-sandbox'
const smokeSandboxPath = path.join(repoRoot, '.codex-temp', 'generated-domain-materialization-sandbox')

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function createValidInventedContract() {
  return {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      label: 'Community Libraries',
      slug: 'community-libraries',
      summary: 'Gestion local de catalogo, prestamos y reportes comunitarios.',
    },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: ['member', 'librarian', 'admin'],
    entities: ['books', 'loans', 'members'],
    states: {
      loan: ['pending', 'active', 'returned'],
    },
    workflows: ['manage catalog', 'register loans', 'review reports'],
    frontendSurfaces: [
      { key: 'public', label: 'Publico', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [
        { path: 'backend/src/routes/books.js' },
        { path: 'backend/src/routes/loans.js' },
        { path: 'backend/src/routes/reports.js' },
      ],
      services: [{ path: 'backend/src/services/reporting.js' }],
      modules: [{ path: 'backend/src/modules/loans.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
      relationships: ['loans.book_id -> books.id'],
      seedData: ['books base', 'loans base'],
    },
    shared: {
      files: ['shared/contracts/domain.js'],
    },
    docs: ['docs/API.md'],
    scripts: ['scripts/seed-local.js'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile', 'docker-compose.yml'],
      forbiddenSignals: ['real token', 'external api call'],
      explicitExclusions: ['deploy', 'node_modules', 'real-webhooks'],
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
    scenarioModules: ['catalog', 'loans', 'reports'],
  }
}

function createEcommerceMockContract() {
  const contract = cloneJson(createValidInventedContract())
  contract.domain = {
    label: 'Mock Neighborhood Store',
    slug: 'mock-neighborhood-store',
    summary: 'Catalogo local, carrito mock y reportes sin pagos reales ni servicios externos.',
  }
  contract.root = {
    slug: 'mock-neighborhood-store-local',
    sourceRoot: 'mock-neighborhood-store-local',
    targetRoot: 'mock-neighborhood-store-local',
  }
  contract.roles = ['shopper', 'operator', 'admin']
  contract.entities = ['products', 'orders', 'customers']
  contract.workflows = ['browse catalog', 'simulate cart', 'review mock orders']
  contract.frontendSurfaces = [
    { key: 'public', label: 'Catalogo', path: 'frontend/public', screens: ['catalog', 'cart'] },
    { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['orders', 'reports'] },
  ]
  contract.backend.routes = [
    { path: 'backend/src/routes/products.js' },
    { path: 'backend/src/routes/orders.js' },
    { path: 'backend/src/routes/reports.js' },
  ]
  contract.backend.modules = [{ path: 'backend/src/modules/catalog.js' }]
  contract.database.tables = ['products', 'orders', 'customers']
  contract.database.relationships = ['orders.customer_id -> customers.id']
  contract.database.seedData = ['products base', 'orders mock']
  contract.validation.requiredPathGroups = [
    { candidates: ['backend/src/routes/products.js'] },
    { candidates: ['database/schema.sql'] },
    { candidates: ['frontend/public/index.html'] },
  ]
  contract.scenarioModules = ['catalog', 'cart', 'orders']
  return contract
}

function createSchedulingAdminContract() {
  const contract = cloneJson(createValidInventedContract())
  contract.domain = {
    label: 'Local Scheduling Desk',
    slug: 'local-scheduling-desk',
    summary: 'Agenda local, turnos y panel administrativo sin backend real activo ni externos.',
  }
  contract.root = {
    slug: 'local-scheduling-desk',
    sourceRoot: 'local-scheduling-desk',
    targetRoot: 'local-scheduling-desk',
  }
  contract.roles = ['patient', 'operator', 'admin']
  contract.entities = ['appointments', 'customers', 'staff']
  contract.workflows = ['book appointment', 'review agenda', 'generate local reports']
  contract.frontendSurfaces = [
    { key: 'public', label: 'Turnos', path: 'frontend/public', screens: ['agenda'] },
    { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['calendar', 'reports'] },
  ]
  contract.backend.routes = [
    { path: 'backend/src/routes/appointments.js' },
    { path: 'backend/src/routes/calendar.js' },
    { path: 'backend/src/routes/reports.js' },
  ]
  contract.backend.modules = [{ path: 'backend/src/modules/scheduling.js' }]
  contract.database.tables = ['appointments', 'customers', 'staff']
  contract.database.relationships = ['appointments.staff_id -> staff.id']
  contract.database.seedData = ['appointments base', 'calendar base']
  contract.validation.requiredPathGroups = [
    { candidates: ['backend/src/routes/appointments.js'] },
    { candidates: ['database/schema.sql'] },
    { candidates: ['frontend/public/index.html'] },
  ]
  contract.scenarioModules = ['appointments', 'calendar', 'reports']
  return contract
}

function createToolBankContract() {
  const contract = cloneJson(createValidInventedContract())
  contract.domain = {
    label: 'Banco comunitario de herramientas barriales',
    slug: 'community-tool-bank',
    summary:
      'Gestion local de prestamos, devoluciones, mantenimiento y disponibilidad de herramientas barriales.',
  }
  contract.root = {
    slug: 'community-tool-bank-local',
    sourceRoot: 'community-tool-bank-local',
    targetRoot: 'community-tool-bank-local',
  }
  contract.roles = ['vecino', 'coordinacion', 'voluntariado']
  contract.entities = ['tools', 'loans', 'members', 'maintenance']
  contract.workflows = [
    'register tool loans',
    'track returns',
    'schedule maintenance',
  ]
  contract.frontendSurfaces = [
    { key: 'public', label: 'Catalogo', path: 'frontend/public', screens: ['catalog'] },
    { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['loans', 'maintenance'] },
  ]
  contract.backend.routes = [
    { path: 'backend/src/routes/tools.js' },
    { path: 'backend/src/routes/loans.js' },
    { path: 'backend/src/routes/maintenance.js' },
  ]
  contract.backend.modules = [{ path: 'backend/src/modules/toolbank.js' }]
  contract.database.tables = ['tools', 'loans', 'members', 'maintenance']
  contract.database.relationships = ['loans.tool_id -> tools.id']
  contract.database.seedData = ['tools base', 'members base', 'maintenance base']
  contract.validation.requiredPathGroups = [
    { candidates: ['backend/src/routes/tools.js'] },
    { candidates: ['database/schema.sql'] },
    { candidates: ['frontend/public/index.html'] },
  ]
  contract.scenarioModules = ['catalog', 'loans', 'maintenance']
  return contract
}

function buildInspectionReadyMaterializationPlan(contract) {
  const normalizedContract = normalizeGeneratedDomainContract(contract)
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(normalizedContract, '.')
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(normalizedContract)

  return {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'fullstack-local-materialization',
    strategy: 'materialize-fullstack-local-plan',
    projectRoot: normalizedContract.root.targetRoot,
    allowedTargetPaths,
    operations: allowedTargetPaths.map((targetPath) => ({
      type: targetPath === normalizedContract.root.targetRoot ? 'create-folder' : 'create-or-edit-file',
      targetPath,
    })),
    contractDefinition: {
      requiredPathGroups,
    },
  }
}

function createUniversalDecision(
  generatedDomainContract = createValidInventedContract(),
  overrides = {},
) {
  const materializationPlan = buildInspectionReadyMaterializationPlan(generatedDomainContract)
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(generatedDomainContract, '.')
  const scenarioModules =
    Array.isArray(generatedDomainContract.scenarioModules) &&
    generatedDomainContract.scenarioModules.length > 0
      ? generatedDomainContract.scenarioModules
      : ['catalog', 'loans', 'reports']

  return observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-sandbox-materialization-smoke',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Validar materializacion universal segura en sandbox interno.',
    instruction: 'No tocar runtime real ni web-prueba.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: generatedDomainContract.root.sourceRoot,
    targetRoot: generatedDomainContract.root.targetRoot,
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: generatedDomainContract.domain.label,
      intent: 'manage local tool loans and reports',
      deliveryLevel: 'fullstack-local',
      roles: generatedDomainContract.roles,
      modules: scenarioModules,
      entities: generatedDomainContract.entities,
      coreFlows: generatedDomainContract.workflows,
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: generatedDomainContract.domain.label,
      users: generatedDomainContract.roles,
      roles: generatedDomainContract.roles,
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: generatedDomainContract.entities,
      keyFlows: generatedDomainContract.workflows,
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: generatedDomainContract.root.targetRoot,
      domain: generatedDomainContract.domain.label,
      title: `${generatedDomainContract.domain.label} local review`,
      targetStructure: [
        `${generatedDomainContract.root.targetRoot}/`,
        `${generatedDomainContract.root.targetRoot}/frontend/public/`,
        `${generatedDomainContract.root.targetRoot}/backend/src/`,
        `${generatedDomainContract.root.targetRoot}/database/`,
        `${generatedDomainContract.root.targetRoot}/docs/`,
      ],
      allowedRootPaths: [generatedDomainContract.root.targetRoot],
      directories: [
        `${generatedDomainContract.root.targetRoot}/frontend/public`,
        `${generatedDomainContract.root.targetRoot}/backend/src`,
        `${generatedDomainContract.root.targetRoot}/database`,
        `${generatedDomainContract.root.targetRoot}/docs`,
      ],
      modules: scenarioModules,
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: generatedDomainContract.root.targetRoot,
      domain: generatedDomainContract.domain.label,
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan,
    generatedDomainContract,
    workspacePath: repoRoot,
    ...overrides,
  })
}

function ensureRemoved(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
}

function listRelativeFiles(rootPath) {
  const files = []

  function visit(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const resolved = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        visit(resolved)
        continue
      }
      files.push(path.relative(rootPath, resolved).replace(/\\/g, '/'))
    }
  }

  if (fs.existsSync(rootPath)) {
    visit(rootPath)
  }

  return files.sort()
}

function assertNodeCheck(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    encoding: 'utf8',
  })

  assert.equal(
    result.status,
    0,
    `node --check fallo para ${filePath}: ${result.stderr || result.stdout || 'sin detalle'}`,
  )
}

function runBlockedCases(universalPlan) {
  const blockedByApproval = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    approvalDecision: {
      approved: false,
      scope: 'sandbox-only',
    },
    workspacePath: repoRoot,
    sandboxRoot: `${sandboxRootRelative}/blocked-by-approval`,
  })
  assert.equal(blockedByApproval.status, 'blocked')
  assert.equal(blockedByApproval.approved, false)
  const blockedControlledSource =
    observationHarness.resolveGeneratedDomainControlledRuntimeMaterializationSource({
      generatedDomainRuntimeShadowReadinessDecision: {
        present: true,
        status: 'requires-Lean-approval',
        readiness: { runtimeNormalStillOff: true },
        safeguards: {
          materializationPlanChanged: false,
          executionScopeChanged: false,
        },
      },
      generatedDomainControlledEnablePolicy: {
        present: true,
        status: 'eligible-for-controlled-runtime-enable',
      },
      generatedDomainFirstControlledEnableScenario: {
        present: true,
        status: 'ready-for-review',
      },
      generatedDomainUniversalMaterializationPlan: universalPlan,
      generatedDomainMaterializationPlanDecouplingReport: {
        present: true,
        currentPlanSource: 'legacy-materialization-plan',
        legacyPlanPresent: true,
        universalCanRepresentPlan: true,
        migrationStatus: 'ready-for-harness',
      },
      generatedDomainMaterializationPlanCandidateLegacyComparison: {
        present: true,
        status: 'aligned',
      },
      generatedDomainFileCreationApprovalEvaluation: blockedByApproval,
      domainConsistencyDiagnostics: {
        present: true,
        status: 'consistent',
        semanticStatus: 'consistent',
      },
      controlledRuntimeSourceOptions: {
        harnessControlledEnable: true,
      },
    })
  assert.equal(blockedControlledSource?.mode, 'blocked')
  assert.equal(blockedControlledSource?.selectedSource, 'blocked')
  const blockedApprovalSurface =
    observationHarness.buildGeneratedDomainMaterializationApprovalSurface({
      generatedDomainFileCreationApprovalPolicy: {
        present: true,
        evaluated: true,
        approvalRequired: true,
        requiresLeanApproval: true,
        safeguards: {
          noDotEnv: true,
          noNodeModules: true,
          noDocker: true,
          noDeploy: true,
          noExternalServices: true,
          noRealPayments: true,
          noProductionDb: true,
          noCredentials: true,
          noWebPrueba: true,
        },
      },
      generatedDomainFileCreationApprovalEvaluation: blockedByApproval,
      generatedDomainMaterializationApprovalPayload: {
        present: true,
        review: {
          root: universalPlan.projectRoot,
          sourceRoot: universalPlan.sourceRoot,
          targetRoot: universalPlan.targetRoot,
          filesPreview: universalPlan.filesToCreate.map((entry) => entry.path),
        },
      },
      generatedDomainUniversalMaterializationPlan: universalPlan,
      generatedDomainControlledRuntimeMaterializationSource: blockedControlledSource,
      generatedDomainRuntimeShadowReadinessDecision: {
        present: true,
        runtimeEnabled: false,
        controlledRuntimeEnable: false,
      },
    })
  assert.equal(blockedApprovalSurface?.status, 'blocked')

  const blockedByWebPrueba = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    approvalDecision: {
      approved: true,
      scope: 'sandbox-only',
    },
    workspacePath: repoRoot,
    sandboxRoot: 'web-prueba/generated-domain-materialization-sandbox',
  })
  assert.equal(blockedByWebPrueba.status, 'blocked')

  const blockedByEnvPlan = cloneJson(universalPlan)
  blockedByEnvPlan.filesToCreate.push({
    path: `${blockedByEnvPlan.projectRoot}/.env`,
    area: 'forbidden',
    content: 'SECRET=blocked',
  })
  const blockedEnvEvaluation = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: blockedByEnvPlan,
    approvalDecision: {
      approved: true,
      scope: 'sandbox-only',
    },
    workspacePath: repoRoot,
    sandboxRoot: `${sandboxRootRelative}/blocked-by-env`,
  })
  assert.equal(blockedEnvEvaluation.status, 'blocked')

  const blockedByOutsideRootPlan = cloneJson(universalPlan)
  blockedByOutsideRootPlan.filesToCreate.push({
    path: '../outside-root.js',
    area: 'forbidden',
    content: 'module.exports = {}',
  })
  const blockedOutsideEvaluation = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: blockedByOutsideRootPlan,
    approvalDecision: {
      approved: true,
      scope: 'sandbox-only',
    },
    workspacePath: repoRoot,
    sandboxRoot: `${sandboxRootRelative}/blocked-by-outside-root`,
  })
  assert.equal(blockedOutsideEvaluation.status, 'blocked')

  const blockedMaterializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: blockedByApproval,
  })
  assert.equal(blockedMaterializationReport.status, 'blocked')
  assert.equal(blockedMaterializationReport.materialized, false)
}

function runHappyPathScenario({ id, contract, expectedDomainLabel }) {
  const decision = createUniversalDecision(contract)
  const universalPlan = decision.generatedDomainUniversalMaterializationPlan
  const readinessReport = decision.generatedDomainMvpReadinessExecutiveReport
  const runtimeSource = decision.generatedDomainControlledRuntimeMaterializationSource
  const approvalSurface = decision.generatedDomainMaterializationApprovalSurface

  assert.equal(universalPlan?.present, true)
  assert.equal(universalPlan?.built, true)
  assert.equal(universalPlan?.canMaterializeInSandbox, true)
  assert.equal(readinessReport?.present, true)
  assert.equal(readinessReport?.runtime?.runtimeEnabled, false)
  assert.equal(readinessReport?.runtime?.controlledRuntimeEnable, false)
  assert.equal(runtimeSource?.present, true)
  assert.equal(runtimeSource?.enabled, false)
  assert.equal(runtimeSource?.mode, 'runtime-disabled')
  assert.equal(approvalSurface?.present, true)
  assert.equal(approvalSurface?.status, 'ready-for-review')
  assert.equal(Array.isArray(approvalSurface?.files?.preview), true)

  const approvalEvaluation = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    approvalDecision: {
      approved: true,
      scope: 'sandbox-only',
      approvalReason: `Sandbox validation smoke for ${id}.`,
    },
    workspacePath: repoRoot,
    sandboxRoot: `${sandboxRootRelative}/${id}`,
  })

  assert.equal(approvalEvaluation?.status, 'approved-for-sandbox')
  assert.equal(approvalEvaluation?.approved, true)
  assert.equal(approvalEvaluation?.blocked, false)
  const controlledRuntimeSource =
    observationHarness.resolveGeneratedDomainControlledRuntimeMaterializationSource({
      generatedDomainRuntimeShadowReadinessDecision:
        decision.generatedDomainRuntimeShadowReadinessDecision,
      generatedDomainControlledEnablePolicy:
        decision.generatedDomainControlledEnablePolicy,
      generatedDomainFirstControlledEnableScenario:
        decision.generatedDomainFirstControlledEnableScenario,
      generatedDomainUniversalMaterializationPlan: universalPlan,
      generatedDomainMaterializationPlanDecouplingReport:
        decision.generatedDomainMaterializationPlanDecouplingReport,
      generatedDomainMaterializationPlanCandidateLegacyComparison:
        decision.generatedDomainMaterializationPlanCandidateLegacyComparison,
      generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
      domainConsistencyDiagnostics: decision.domainConsistencyDiagnostics,
      controlledRuntimeSourceOptions: {
        harnessControlledEnable: true,
        simulateLeanApproval: true,
      },
    })

  assert.equal(controlledRuntimeSource?.present, true)
  assert.equal(controlledRuntimeSource?.enabled, true)
  assert.equal(controlledRuntimeSource?.mode, 'harness-controlled')
  assert.equal(
    controlledRuntimeSource?.selectedSource,
    'generated-domain-universal',
  )
  assert.equal(controlledRuntimeSource?.fallbackLegacyAvailable, true)
  const approvedSurface = observationHarness.buildGeneratedDomainMaterializationApprovalSurface({
    generatedDomainFileCreationApprovalPolicy:
      decision.generatedDomainFileCreationApprovalPolicy,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
    generatedDomainMaterializationApprovalPayload:
      decision.generatedDomainMaterializationApprovalPayload,
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainControlledRuntimeMaterializationSource: controlledRuntimeSource,
    generatedDomainRuntimeShadowReadinessDecision:
      decision.generatedDomainRuntimeShadowReadinessDecision,
  })
  assert.equal(approvedSurface?.status, 'approved-for-sandbox')
  assert.equal(approvedSurface?.target?.isSandbox, true)

  const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
  })

  assert.equal(materializationReport?.status, 'materialized')
  assert.equal(materializationReport?.materialized, true)

  const projectRootPath = path.join(
    repoRoot,
    '.codex-temp',
    'generated-domain-materialization-sandbox',
    id,
    universalPlan.projectRoot,
  )
  const expectedFiles = [
    'README.md',
    'docs/domain.md',
    'frontend/index.html',
    'frontend/src/main.js',
    'frontend/src/mock-data.js',
    'backend/src/index.js',
    'shared/contracts/domain.js',
    'database/schema.sql',
    'database/seed.json',
    'validation/report.json',
  ]

  for (const relativePath of expectedFiles) {
    assert.equal(
      fs.existsSync(path.join(projectRootPath, relativePath)),
      true,
      `Falta el archivo esperado ${relativePath} para ${id}.`,
    )
  }

  const allFiles = listRelativeFiles(projectRootPath)
  assert.equal(allFiles.some((entry) => /(^|\/)\.env($|\/)/iu.test(entry)), false)
  assert.equal(allFiles.some((entry) => /(^|\/)node_modules($|\/)/iu.test(entry)), false)
  assert.equal(allFiles.some((entry) => /(^|\/)web-prueba($|\/)/iu.test(entry)), false)
  assert.equal(allFiles.some((entry) => /(^|\/)deploy($|\/)/iu.test(entry)), false)
  assert.equal(allFiles.some((entry) => /(^|\/)dockerfile($|\/)/iu.test(entry)), false)

  assertNodeCheck(path.join(projectRootPath, 'frontend', 'src', 'main.js'))
  assertNodeCheck(path.join(projectRootPath, 'frontend', 'src', 'mock-data.js'))
  assertNodeCheck(path.join(projectRootPath, 'backend', 'src', 'index.js'))
  assertNodeCheck(path.join(projectRootPath, 'shared', 'contracts', 'domain.js'))

  JSON.parse(fs.readFileSync(path.join(projectRootPath, 'database', 'seed.json'), 'utf8'))
  const validationReport = JSON.parse(
    fs.readFileSync(path.join(projectRootPath, 'validation', 'report.json'), 'utf8'),
  )
  assert.equal(
    String(validationReport?.projectRoot || '').trim(),
    String(universalPlan?.projectRoot || '').trim(),
    `validation/report.json deberia conservar el projectRoot materializado para ${expectedDomainLabel}.`,
  )

  return {
    createdCount: materializationReport.created.length,
    universalPlan,
  }
}

function runApprovedToolBankScenario() {
  const approvedExternalSandboxPath =
    'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-toolbank-local'
  const contract = createToolBankContract()
  const decision = createUniversalDecision(contract, {
    resolvedDecisionMap: new Map([
      [
        'approve-sandbox-path',
        {
          status: 'approved',
          decision: 'approved',
          selectedOption: 'sandbox-external-new-workspace',
          freeAnswer: approvedExternalSandboxPath,
          summary:
            'Lean aprobó materializar solo la SFD local segura en sandbox controlado.',
        },
      ],
    ]),
    plannerFeedback: {
      type: 'approval-granted',
      approvalRequestDecisionKey: 'approve-sandbox-path',
      selectedOption: 'sandbox-external-new-workspace',
      freeAnswer: approvedExternalSandboxPath,
      approvalReason:
        'Materializar solo la SFD local segura y validarla con el flujo de sandbox.',
    },
  })
  const approvalEvaluation = decision.generatedDomainFileCreationApprovalEvaluation
  const approvalSurface = decision.generatedDomainMaterializationApprovalSurface
  const runtimeSource = decision.generatedDomainControlledRuntimeMaterializationSource
  const universalPlan = decision.generatedDomainUniversalMaterializationPlan

  assert.equal(approvalEvaluation?.approved, true)
  assert.equal(approvalEvaluation?.blocked, false)
  assert.equal(approvalEvaluation?.status, 'approved-for-sandbox')
  assert.equal(
    approvalEvaluation?.sandboxRoot?.relative,
    '.codex-temp/generated-domain-materialization-approved/sandbox-toolbank-local',
  )
  assert.equal(approvalSurface?.status, 'approved-for-sandbox')
  assert.equal(runtimeSource?.enabled, true)
  assert.equal(runtimeSource?.mode, 'harness-controlled')
  assert.equal(runtimeSource?.selectedSource, 'generated-domain-universal')

  const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
  })

  assert.equal(materializationReport?.status, 'materialized')
  assert.equal(materializationReport?.materialized, true)
  assert.equal(
    materializationReport?.sandboxRoot?.relative,
    '.codex-temp/generated-domain-materialization-approved/sandbox-toolbank-local',
  )

  const projectRootPath = path.join(
    repoRoot,
    '.codex-temp',
    'generated-domain-materialization-approved',
    'sandbox-toolbank-local',
    universalPlan.projectRoot,
  )
  const expectedFiles = [
    'README.md',
    'docs/domain.md',
    'frontend/index.html',
    'frontend/src/main.js',
    'frontend/src/mock-data.js',
    'backend/src/index.js',
    'shared/contracts/domain.js',
    'database/schema.sql',
    'database/seed.json',
    'validation/report.json',
  ]
  for (const relativePath of expectedFiles) {
    assert.equal(
      fs.existsSync(path.join(projectRootPath, relativePath)),
      true,
      `Falta el archivo esperado ${relativePath} en el smoke toolbank.`,
    )
  }

  const contentPool = expectedFiles
    .filter((entry) => entry !== 'validation/report.json')
    .map((entry) => fs.readFileSync(path.join(projectRootPath, entry), 'utf8'))
    .join('\n')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
  assert.equal(contentPool.includes('banco comunitario de herramientas'), true)
  ;['refugios', 'comercio online', 'salud', 'cursos', 'ecommerce'].forEach((token) => {
    assert.equal(
      contentPool.includes(token),
      false,
      `El scaffold toolbank no debe contaminarse con ${token}.`,
    )
  })

  return {
    createdCount: materializationReport.created.length,
  }
}

function runSandboxLocationApprovalScenario() {
  const approvedExternalSandboxPath =
    'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-toolbank-local'
  const approvedSandboxFolder = 'sandbox-community-toolbank'
  const approvalFreeAnswer = `Apruebo crear/materializar unicamente en un sandbox seguro y aislado para esta prueba.

Usar como workspace alternativo seguro la ruta:

${approvedExternalSandboxPath}

Dentro de ese workspace, materializar exclusivamente la carpeta:

${approvedSandboxFolder}

No tocar web-prueba.
No crear .env.
No crear node_modules.
No usar Docker.
No hacer deploy.
No llamar servicios externos.
No usar pagos reales.
No usar base de datos productiva.
No usar credenciales.

La materializacion debe ser mock-only, local, segura y validada con el flujo sandbox.`
  const contract = createToolBankContract()
  const decision = createUniversalDecision(contract, {
    resolvedDecisionMap: new Map([
      [
        'approval-sandbox-location-v1',
        {
          status: 'approved',
          decision: 'approved',
          selectedOption: 'custom-path-inside-workspace',
          freeAnswer: approvalFreeAnswer,
          summary:
            'Lean aprobo materializar solo la SFD local segura dentro de un workspace externo controlado.',
        },
      ],
    ]),
    plannerFeedback: {
      type: 'approval-granted',
      approvalRequestDecisionKey: 'approval-sandbox-location-v1',
      selectedOption: 'custom-path-inside-workspace',
      freeAnswer: approvalFreeAnswer,
      approvalReason:
        'Materializar solo la SFD local segura dentro del sandbox externo aprobado y validarla con el flujo sandbox.',
    },
  })
  const approvalEvaluation = decision.generatedDomainFileCreationApprovalEvaluation
  const runtimeSource = decision.generatedDomainControlledRuntimeMaterializationSource
  const universalPlan = decision.generatedDomainUniversalMaterializationPlan

  assert.equal(approvalEvaluation?.approved, true)
  assert.equal(approvalEvaluation?.blocked, false)
  assert.equal(approvalEvaluation?.status, 'approved-for-sandbox')
  assert.equal(
    approvalEvaluation?.sandboxRoot?.relative,
    '.codex-temp/generated-domain-materialization-approved/sandbox-toolbank-local/sandbox-community-toolbank',
  )
  assert.equal(runtimeSource?.enabled, true)
  assert.equal(runtimeSource?.selectedSource, 'generated-domain-universal')
  assert.equal(universalPlan?.status, 'built')
  assert.equal(universalPlan?.canMaterializeInSandbox, true)
  assert.equal(universalPlan?.safety?.safeForLocalMaterialization, true)

  const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
  })

  assert.equal(materializationReport?.status, 'materialized')
  assert.equal(materializationReport?.materialized, true)
  assert.equal(
    materializationReport?.sandboxRoot?.relative,
    '.codex-temp/generated-domain-materialization-approved/sandbox-toolbank-local/sandbox-community-toolbank',
  )

  const projectRootPath = path.join(
    repoRoot,
    '.codex-temp',
    'generated-domain-materialization-approved',
    'sandbox-toolbank-local',
    'sandbox-community-toolbank',
    universalPlan.projectRoot,
  )
  assert.equal(
    fs.existsSync(path.join(projectRootPath, 'validation', 'report.json')),
    true,
    'La variante approval-sandbox-location-v1 debe persistir validation/report.json en el sandbox controlado.',
  )

  return {
    createdCount: materializationReport.created.length,
  }
}

function runFinalSandboxMaterializationApprovalScenario() {
  const contract = createToolBankContract()
  const decision = createUniversalDecision(contract, {
    resolvedDecisionMap: new Map([
      [
        'approve-sandbox-materialization-v1',
        {
          status: 'approved',
          decision: 'approved',
          selectedOption: 'approve',
          summary:
            'Lean aprobo materializar la primera entrega segura mock dentro del sandbox controlado.',
        },
      ],
    ]),
    plannerFeedback: {
      type: 'approval-granted',
      approvalDecision: 'approved',
      approvalRequestDecisionKey: 'approve-sandbox-materialization-v1',
      selectedOption: 'approve',
      approvalReason:
        'Aprobacion final para materializar solo la entrega segura mock dentro del sandbox controlado sin tocar web-prueba.',
    },
  })
  const approvalEvaluation = decision.generatedDomainFileCreationApprovalEvaluation
  const runtimeSource = decision.generatedDomainControlledRuntimeMaterializationSource
  const universalPlan = decision.generatedDomainUniversalMaterializationPlan

  assert.equal(approvalEvaluation?.approved, true)
  assert.equal(approvalEvaluation?.blocked, false)
  assert.equal(approvalEvaluation?.status, 'approved-for-sandbox')
  assert.equal(
    approvalEvaluation?.sandboxRoot?.relative,
    '.codex-temp/generated-domain-materialization-approved/community-tool-bank-local',
  )
  assert.equal(runtimeSource?.enabled, true)
  assert.equal(runtimeSource?.selectedSource, 'generated-domain-universal')
  assert.equal(universalPlan?.status, 'built')
  assert.equal(universalPlan?.canMaterializeInSandbox, true)
  assert.equal(universalPlan?.safety?.safeForLocalMaterialization, true)

  const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
  })

  assert.equal(materializationReport?.status, 'materialized')
  assert.equal(materializationReport?.materialized, true)
  assert.equal(
    materializationReport?.sandboxRoot?.relative,
    '.codex-temp/generated-domain-materialization-approved/community-tool-bank-local',
  )

  const projectRootPath = path.join(
    repoRoot,
    '.codex-temp',
    'generated-domain-materialization-approved',
    'community-tool-bank-local',
    universalPlan.projectRoot,
  )
  assert.equal(
    fs.existsSync(path.join(projectRootPath, 'validation', 'report.json')),
    true,
    'La aprobacion final approve-sandbox-materialization-v1 debe persistir validation/report.json en el sandbox controlado.',
  )

  return {
    createdCount: materializationReport.created.length,
  }
}

function runSandboxRootStylePathNormalizationScenario() {
  const sandboxRootRelative =
    '.codex-temp/generated-domain-materialization-approved/root-style-path-normalization'
  const sandboxRootResolved = path.join(
    repoRoot,
    '.codex-temp',
    'generated-domain-materialization-approved',
    'root-style-path-normalization',
  )
  ensureRemoved(sandboxRootResolved)

  const universalPlan = {
    built: true,
    canMaterializeInSandbox: true,
    projectRoot: 'root-style-path-normalization',
    filesToCreate: [
      { path: '/README.md', area: 'docs', content: '# Root style path\n' },
      { path: '/docs/domain.md', area: 'docs', content: '# Domain\n' },
      { path: '/frontend/index.html', area: 'frontend', content: '<!doctype html>\n' },
    ],
    report: {
      reportFile: '/validation/report.json',
    },
  }

  const approvalEvaluation = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    approvalDecision: {
      approved: true,
      scope: 'sandbox-only',
    },
    workspacePath: repoRoot,
    sandboxRoot: sandboxRootRelative,
  })

  assert.equal(approvalEvaluation?.approved, true)
  assert.equal(approvalEvaluation?.blocked, false)
  assert.equal(approvalEvaluation?.status, 'approved-for-sandbox')
  assert.deepStrictEqual(
    Array.from(approvalEvaluation.allowedFiles.map((entry) => entry.path)),
    ['README.md', 'docs/domain.md', 'frontend/index.html'],
  )

  const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
  })

  assert.equal(materializationReport?.materialized, true)
  assert.equal(fs.existsSync(path.join(sandboxRootResolved, 'README.md')), true)
  assert.equal(fs.existsSync(path.join(sandboxRootResolved, 'docs', 'domain.md')), true)
  assert.equal(fs.existsSync(path.join(sandboxRootResolved, 'frontend', 'index.html')), true)
  assert.equal(fs.existsSync(path.join(sandboxRootResolved, 'validation', 'report.json')), true)
  assert.equal(fs.existsSync(path.join(repoRoot, 'README.md')), true)

  ensureRemoved(sandboxRootResolved)
  return {
    createdCount: materializationReport.created.length,
  }
}

function runDangerousSandboxPathBlockedScenario() {
  const sandboxRootRelative =
    '.codex-temp/generated-domain-materialization-approved/dangerous-path-blocked'
  const universalPlan = {
    built: true,
    canMaterializeInSandbox: true,
    projectRoot: 'dangerous-path-blocked',
    filesToCreate: [
      { path: '../escape.txt', area: 'docs', content: 'escape' },
      { path: '/web-prueba/evil.txt', area: 'docs', content: 'evil' },
      { path: '.env', area: 'config', content: 'TOKEN=real' },
      { path: 'node_modules/package.json', area: 'deps', content: '{}' },
    ],
  }

  const approvalEvaluation = observationHarness.evaluateGeneratedDomainFileCreationApproval({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    approvalDecision: {
      approved: true,
      scope: 'sandbox-only',
    },
    workspacePath: repoRoot,
    sandboxRoot: sandboxRootRelative,
  })

  assert.equal(approvalEvaluation?.approved, false)
  assert.equal(approvalEvaluation?.blocked, true)
  assert.equal(approvalEvaluation?.status, 'blocked')
  assert.equal(approvalEvaluation.blockedFiles.length, 4)
  assert.equal(
    approvalEvaluation.blockedFiles.some((entry) => entry.path === '../escape.txt'),
    true,
  )
  assert.equal(
    approvalEvaluation.blockedFiles.some((entry) =>
      String(entry.path || '').endsWith('web-prueba/evil.txt'),
    ),
    true,
  )
  assert.equal(
    approvalEvaluation.blockedFiles.some((entry) => entry.path === '.env'),
    true,
  )
  assert.equal(
    approvalEvaluation.blockedFiles.some((entry) => entry.path === 'node_modules/package.json'),
    true,
  )

  const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: universalPlan,
    generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
  })

  assert.equal(materializationReport?.materialized, false)
  assert.equal(materializationReport?.status, 'blocked')
}

async function main() {
  ensureRemoved(smokeSandboxPath)

  try {
    const scenarios = [
      {
        id: 'community-system',
        contract: createValidInventedContract(),
        expectedDomainLabel: 'Community Libraries',
      },
      {
        id: 'mock-ecommerce',
        contract: createEcommerceMockContract(),
        expectedDomainLabel: 'Mock Neighborhood Store',
      },
      {
        id: 'scheduling-admin',
        contract: createSchedulingAdminContract(),
        expectedDomainLabel: 'Local Scheduling Desk',
      },
    ]
    const results = scenarios.map((scenario) => runHappyPathScenario(scenario))
    const toolBankResult = runApprovedToolBankScenario()
    const sandboxLocationResult = runSandboxLocationApprovalScenario()
    const finalSandboxMaterializationResult =
      runFinalSandboxMaterializationApprovalScenario()
    const rootStylePathNormalizationResult = runSandboxRootStylePathNormalizationScenario()
    runDangerousSandboxPathBlockedScenario()
    runBlockedCases(results[0].universalPlan)

    const totalCreated = results.reduce(
      (sum, entry) => sum + (Number.isInteger(entry.createdCount) ? entry.createdCount : 0),
      0,
    ) +
      (Number.isInteger(toolBankResult.createdCount) ? toolBankResult.createdCount : 0) +
      (Number.isInteger(sandboxLocationResult.createdCount)
        ? sandboxLocationResult.createdCount
        : 0) +
      (Number.isInteger(finalSandboxMaterializationResult.createdCount)
        ? finalSandboxMaterializationResult.createdCount
        : 0) +
      (Number.isInteger(rootStylePathNormalizationResult.createdCount)
        ? rootStylePathNormalizationResult.createdCount
        : 0)

    console.log(
      `OK. Generated domain sandbox materialization smoke completado. Dominios validados: ${scenarios.length + 5}. Archivos creados: ${totalCreated}.`,
    )
  } finally {
    ensureRemoved(smokeSandboxPath)
    ensureRemoved(
      path.join(
        repoRoot,
        '.codex-temp',
        'generated-domain-materialization-approved',
        'community-tool-bank-local',
      ),
    )
    ensureRemoved(
      path.join(
        repoRoot,
        '.codex-temp',
        'generated-domain-materialization-approved',
        'sandbox-toolbank-local',
      ),
    )
    ensureRemoved(
      path.join(
        repoRoot,
        '.codex-temp',
        'generated-domain-materialization-approved',
        'sandbox-toolbank-local',
        'sandbox-community-toolbank',
      ),
    )
    ensureRemoved(
      path.join(
        repoRoot,
        '.codex-temp',
        'generated-domain-materialization-approved',
        'root-style-path-normalization',
      ),
    )
    ensureRemoved(
      path.join(
        repoRoot,
        '.codex-temp',
        'generated-domain-materialization-approved',
        'dangerous-path-blocked',
      ),
    )
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
