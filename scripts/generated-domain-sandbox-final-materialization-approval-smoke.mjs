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
    filename: 'generated-domain-sandbox-final-materialization-approval-smoke-harness.cjs',
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

function ensureRemoved(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
}

const contract = createToolBankContract()
const allowedTargetPaths = deriveAllowedTargetPathsFromContract(contract, '.')
const requiredPathGroups = deriveRequiredPathGroupsFromContract(contract)
const previousExecutionResult =
  '__orchestrator_feedback__:' +
  JSON.stringify({
    type: 'approval-granted',
    source: 'planner',
    approvalMode: 'once',
    approvalDecision: 'approved',
    approvalRequestDecisionKey: 'approve-sandbox-materialization-v1',
    responseMode: 'options',
    selectedOption: 'approve',
  })

const decision = observationHarness.buildBrainDecisionContract({
  decisionKey: 'generated-domain-sandbox-final-materialization-approval-smoke',
  strategy: 'materialize-fullstack-local-plan',
  executionMode: 'executor',
  nextExpectedAction: 'execute-plan',
  reason: 'Reproducir la aprobacion final approve-sandbox-materialization-v1 en harness.',
  instruction: 'Materializar solo la SFD local segura dentro del sandbox aprobado.',
  completed: false,
  requiresApproval: false,
  tasks: [],
  assumptions: [],
  sourceRoot: contract.root.sourceRoot,
  targetRoot: contract.root.targetRoot,
  projectBlueprint: {
    productType: 'fullstack-local-app',
    domain: contract.domain.label,
    intent: 'gestionar prestamos y devoluciones de herramientas',
    deliveryLevel: 'fullstack-local',
    roles: contract.roles,
    modules: ['catalog', 'loans', 'maintenance'],
    entities: contract.entities,
    coreFlows: contract.workflows,
  },
  productArchitecture: {
    productType: 'fullstack-local-app',
    domain: contract.domain.label,
    users: contract.roles,
    roles: contract.roles,
    coreModules: ['catalog', 'loans', 'maintenance'],
    dataEntities: contract.entities,
    keyFlows: contract.workflows,
  },
  scalableDeliveryPlan: {
    deliveryLevel: 'fullstack-local',
    projectRoot: contract.root.targetRoot,
    domain: contract.domain.label,
    title: 'Community tool bank final approval smoke',
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
    modules: ['catalog', 'loans', 'maintenance'],
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
  workspacePath: repoRoot,
  projectState: {
    resolvedDecisions: [
      {
        key: 'approve-sandbox-materialization-v1',
        status: 'approved',
        source: 'planner',
        decision: 'approved',
        label: 'approve',
        responseMode: 'options',
        selectedOption: 'approve',
      },
    ],
  },
  resolvedDecisionMap: new Map([
    [
      'approve-sandbox-materialization-v1',
      {
        key: 'approve-sandbox-materialization-v1',
        status: 'approved',
        source: 'planner',
        decision: 'approved',
        label: 'approve',
        responseMode: 'options',
        selectedOption: 'approve',
      },
    ],
  ]),
  plannerFeedback: JSON.parse(
    previousExecutionResult.slice('__orchestrator_feedback__:'.length),
  ),
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

assert.equal(materializationReport?.materialized, true)
assert.equal(materializationReport?.status, 'materialized')

const sandboxProjectRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  'community-tool-bank-local',
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

console.log(
  'OK. approve-sandbox-materialization-v1 con selectedOption approve materializo en sandbox controlado y genero validation/report.json.',
)

ensureRemoved(
  path.join(
    repoRoot,
    '.codex-temp',
    'generated-domain-materialization-approved',
    'community-tool-bank-local',
  ),
)
