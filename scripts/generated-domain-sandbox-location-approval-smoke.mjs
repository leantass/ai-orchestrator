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
    filename: 'generated-domain-sandbox-location-approval-smoke-harness.cjs',
  })

  return sandbox.module.exports || {}
}

const observationHarness = loadObservationHarness()

function createToolBankContract() {
  return {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      slug: 'community-tool-bank',
      label: 'Banco comunitario de herramientas barriales',
    },
    root: {
      slug: 'community-tool-bank-local',
      sourceRoot: 'community-tool-bank-local',
      targetRoot: 'community-tool-bank-local',
    },
    roles: ['vecino', 'coordinacion', 'voluntariado'],
    entities: ['tools', 'loans', 'members', 'maintenance'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Catalogo', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['loans'] },
    ],
    workflows: ['register tool loans', 'track returns', 'schedule maintenance'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/tools.js' }],
      services: [{ path: 'backend/src/services/maintenance.js' }],
      modules: [{ path: 'backend/src/modules/toolbank.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['tools', 'loans', 'members', 'maintenance'],
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
  }
}

function createBikeWorkshopContract() {
  return {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      slug: 'bike-repair-workshop',
      label: 'Taller barrial de reparacion de bicicletas',
    },
    root: {
      slug: 'bike-repair-workshop-local',
      sourceRoot: 'bike-repair-workshop-local',
      targetRoot: 'bike-repair-workshop-local',
    },
    roles: ['vecino', 'mecanico', 'operador', 'administrador'],
    entities: [
      'bicicletas',
      'vecinos',
      'turnos',
      'ordenes de trabajo',
      'repuestos',
      'presupuestos estimados',
      'avisos simulados',
    ],
    states: {
      workOrder: ['pendiente', 'diagnostico', 'en reparacion', 'presupuestado', 'listo'],
    },
    frontendSurfaces: [
      { key: 'public', label: 'Panel publico', path: 'frontend/public', screens: ['status'] },
      { key: 'operator', label: 'Panel operativo', path: 'frontend/operator', screens: ['work-orders'] },
      { key: 'admin', label: 'Panel administrativo', path: 'frontend/admin', screens: ['settings'] },
    ],
    workflows: [
      'registrar bicicletas y vecinos',
      'pedir turnos de reparacion',
      'gestionar ordenes de trabajo',
      'registrar repuestos usados',
      'emitir avisos simulados',
      'revisar reportes simples',
    ],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [
        { path: 'backend/src/routes/bicycles.js' },
        { path: 'backend/src/routes/work-orders.js' },
        { path: 'backend/src/routes/reports.js' },
      ],
      services: [{ path: 'backend/src/services/notices.js' }],
      modules: [{ path: 'backend/src/modules/workshop.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['bicicletas', 'vecinos', 'turnos', 'ordenes de trabajo', 'repuestos'],
    },
    shared: {
      files: ['shared/contracts/domain.js'],
    },
    docs: ['docs/API.md'],
    scripts: ['scripts/seed-local.js'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile', 'docker-compose.yml'],
      forbiddenSignals: ['ACCESS_TOKEN', 'web-prueba', 'pagos reales'],
      explicitExclusions: [
        'deploy',
        'docker',
        'node_modules',
        'servicios externos',
        'credenciales reales',
        'DB productiva',
      ],
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
  }
}

function createDecision({
  contract = createToolBankContract(),
  approvedExternalSandboxPath =
    'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-toolbank-local',
  approvedSandboxFolder = 'sandbox-community-toolbank',
  intent = 'gestionar prestamos y devoluciones de herramientas',
  modules = ['catalog', 'loans', 'maintenance'],
  reason = 'Reproducir la aprobacion real approval-sandbox-location-v1 en harness.',
  instruction = 'Materializar solo la SFD local segura dentro del sandbox aprobado.',
} = {}) {
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(contract, '.')
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(contract)
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

  return observationHarness.buildBrainDecisionContract({
    decisionKey: 'generated-domain-sandbox-location-approval-smoke',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason,
    instruction,
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: contract.root.sourceRoot,
    targetRoot: contract.root.targetRoot,
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: contract.domain.label,
      intent,
      deliveryLevel: 'fullstack-local',
      roles: contract.roles,
      modules,
      entities: contract.entities,
      coreFlows: contract.workflows,
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: contract.domain.label,
      users: contract.roles,
      roles: contract.roles,
      coreModules: modules,
      dataEntities: contract.entities,
      keyFlows: contract.workflows,
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: contract.root.targetRoot,
      domain: contract.domain.label,
      title: 'Community tool bank location approval smoke',
      targetStructure: [
        `${contract.root.targetRoot}/`,
        `${contract.root.targetRoot}/frontend/public/`,
        `${contract.root.targetRoot}/backend/src/`,
        `${contract.root.targetRoot}/database/`,
        `${contract.root.targetRoot}/docs/`,
      ],
      allowedRootPaths: [contract.root.targetRoot],
      directories: [
        `${contract.root.targetRoot}/frontend/public`,
        `${contract.root.targetRoot}/backend/src`,
        `${contract.root.targetRoot}/database`,
        `${contract.root.targetRoot}/docs`,
      ],
      modules,
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: contract.root.targetRoot,
      domain: contract.domain.label,
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: contract.root.targetRoot,
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === contract.root.targetRoot ? 'create-folder' : 'create-or-edit-file',
        targetPath,
      })),
      contractDefinition: {
        requiredPathGroups,
      },
    },
    generatedDomainContract: contract,
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
      approvalDecision: 'approved',
      approvalRequestDecisionKey: 'approval-sandbox-location-v1',
      selectedOption: 'custom-path-inside-workspace',
      freeAnswer: approvalFreeAnswer,
      approvalReason:
        'Materializar solo la SFD local segura dentro del sandbox externo aprobado y validarla con el flujo sandbox.',
    },
    workspacePath: repoRoot,
  })
}

function ensureRemoved(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
}

const decision = createDecision()
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
assert.equal(universalPlan?.status, 'built')
assert.equal(universalPlan?.canMaterializeInSandbox, true)
assert.equal(universalPlan?.safety?.safeForLocalMaterialization, true)
assert.equal(runtimeSource?.enabled, true)
assert.equal(runtimeSource?.selectedSource, 'generated-domain-universal')

const materializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
  generatedDomainUniversalMaterializationPlan: universalPlan,
  generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
})

assert.equal(materializationReport?.materialized, true)
assert.equal(materializationReport?.status, 'materialized')

const sandboxProjectRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  'sandbox-toolbank-local',
  'sandbox-community-toolbank',
  universalPlan.projectRoot,
)
const reportPath = path.join(sandboxProjectRoot, 'validation', 'report.json')

assert.equal(fs.existsSync(reportPath), true)
assert.equal(fs.existsSync(path.join(sandboxProjectRoot, '.env')), false)
assert.equal(fs.existsSync(path.join(sandboxProjectRoot, 'node_modules')), false)
assert.equal(
  sandboxProjectRoot.replace(/\\/g, '/').includes('/web-prueba/'),
  false,
)

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
assert.equal(report?.status, 'materialized')

const bikeDecision = createDecision({
  contract: createBikeWorkshopContract(),
  approvedExternalSandboxPath:
    'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-bike-repair-local',
  approvedSandboxFolder: 'sandbox-bike-repair-workshop',
  intent:
    'gestionar bicicletas, vecinos, turnos, ordenes de trabajo, repuestos y presupuestos estimados',
  modules: [
    'bicicletas',
    'vecinos',
    'turnos',
    'ordenes de trabajo',
    'mecanicos',
    'repuestos',
    'presupuestos estimados',
    'panel publico',
    'panel operativo',
    'panel administrativo',
    'backend mock',
    'base local',
  ],
  reason:
    'Reproducir approval-sandbox-location-v1 con dominio nuevo de taller barrial de bicicletas.',
  instruction:
    'Materializar solo el taller de bicicletas mock/local dentro del sandbox aprobado.',
})
const bikeApprovalEvaluation = bikeDecision.generatedDomainFileCreationApprovalEvaluation
const bikeUniversalPlan = bikeDecision.generatedDomainUniversalMaterializationPlan

assert.equal(bikeApprovalEvaluation?.approved, true)
assert.equal(bikeApprovalEvaluation?.blocked, false)
assert.equal(bikeApprovalEvaluation?.status, 'approved-for-sandbox')
assert.equal(
  bikeApprovalEvaluation?.sandboxRoot?.relative,
  '.codex-temp/generated-domain-materialization-approved/sandbox-bike-repair-local/sandbox-bike-repair-workshop',
)
assert.equal(bikeUniversalPlan?.status, 'built')
assert.equal(bikeUniversalPlan?.canMaterializeInSandbox, true)
assert.equal(bikeUniversalPlan?.safety?.safeForLocalMaterialization, true)

const bikeMaterializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
  generatedDomainUniversalMaterializationPlan: bikeUniversalPlan,
  generatedDomainFileCreationApprovalEvaluation: bikeApprovalEvaluation,
})

assert.equal(bikeMaterializationReport?.materialized, true)
assert.equal(bikeMaterializationReport?.status, 'materialized')

const bikeSandboxProjectRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  'sandbox-bike-repair-local',
  'sandbox-bike-repair-workshop',
  bikeUniversalPlan.projectRoot,
)
const bikeReportPath = path.join(bikeSandboxProjectRoot, 'validation', 'report.json')

assert.equal(fs.existsSync(bikeReportPath), true)
assert.equal(fs.existsSync(path.join(bikeSandboxProjectRoot, '.env')), false)
assert.equal(fs.existsSync(path.join(bikeSandboxProjectRoot, 'node_modules')), false)
assert.equal(fs.existsSync(path.join(bikeSandboxProjectRoot, 'Dockerfile')), false)
assert.equal(
  bikeSandboxProjectRoot.replace(/\\/g, '/').includes('/web-prueba/'),
  false,
)
assert.equal(JSON.parse(fs.readFileSync(bikeReportPath, 'utf8'))?.status, 'materialized')

console.log(
  'OK. approval-sandbox-location-v1 con custom-path-inside-workspace se promovio a sandbox seguro y validation/report.json quedo materializado, incluido el taller de bicicletas.',
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
    'sandbox-bike-repair-local',
    'sandbox-bike-repair-workshop',
  ),
)
