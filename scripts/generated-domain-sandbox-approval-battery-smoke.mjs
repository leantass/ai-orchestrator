import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { buildPlannerApprovalSurfaceViewModel } from '../src/planner-ui-state.js'

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
    filename: 'generated-domain-sandbox-approval-battery-smoke-harness.cjs',
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
    entities: ['tools', 'loans', 'neighbors', 'alerts'],
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
      tables: ['tools', 'loans', 'neighbors', 'alerts'],
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

function buildDecision({
  decisionKey,
  selectedOption,
  freeAnswer = '',
  summary = '',
  feedbackType = 'approval-granted',
  approvalDecision = 'approved',
  decisionStatus = 'approved',
  workspacePath = repoRoot,
}) {
  const contract = createToolBankContract()
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(contract, '.')
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(contract)

  return observationHarness.buildBrainDecisionContract({
    decisionKey: `generated-domain-sandbox-approval-battery:${decisionKey}:${selectedOption || 'none'}`,
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Ejercitar el bridge real de aprobacion sandbox.',
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
      title: 'Community tool bank approval battery',
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
    workspacePath,
    projectState: {
      resolvedDecisions: [
        {
          key: decisionKey,
          status: decisionStatus,
          source: 'planner',
          decision: approvalDecision,
          label: selectedOption || approvalDecision,
          responseMode: selectedOption ? 'options' : 'free-answer',
          selectedOption,
          freeAnswer,
          summary,
        },
      ],
    },
    resolvedDecisionMap: new Map([
      [
        decisionKey,
        {
          key: decisionKey,
          status: decisionStatus,
          source: 'planner',
          decision: approvalDecision,
          label: selectedOption || approvalDecision,
          responseMode: selectedOption ? 'options' : 'free-answer',
          selectedOption,
          freeAnswer,
          summary,
        },
      ],
    ]),
    plannerFeedback: {
      type: feedbackType,
      approvalDecision,
      approvalRequestDecisionKey: decisionKey,
      responseMode: selectedOption ? 'options' : 'free-answer',
      selectedOption,
      freeAnswer,
      approvalReason: summary,
      instruction: summary,
    },
  })
}

function ensureRemoved(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
}

function assertBlockedDecision(decision, message) {
  assert.equal(decision?.generatedDomainFileCreationApprovalEvaluation?.approved, false, message)
  assert.equal(decision?.generatedDomainFileCreationApprovalEvaluation?.blocked, true, message)
}

function runBlockedMaterializationAttempt(decision, message) {
  const report = observationHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan:
      decision.generatedDomainUniversalMaterializationPlan,
    generatedDomainFileCreationApprovalEvaluation:
      decision.generatedDomainFileCreationApprovalEvaluation,
  })
  assert.equal(report?.materialized, false, message)
  return report
}

const safeLocationFreeAnswer = `Apruebo crear/materializar unicamente en un sandbox seguro y aislado para esta prueba.

Usar como workspace alternativo seguro la ruta:

C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-toolbank-local

Dentro de ese workspace, materializar exclusivamente la carpeta:

sandbox-community-toolbank

No tocar web-prueba.
No tocar el workspace actual del proyecto ai-orchestrator.
No crear .env.
No crear node_modules.
No usar Docker.
No hacer deploy.
No llamar servicios externos.
No usar pagos reales.
No usar base de datos productiva.
No usar credenciales.

La materializacion debe ser mock-only, local, segura y validada con el flujo sandbox.`

const unsafeAuthorizationFreeAnswer = `${safeLocationFreeAnswer}

Autorizo tambien usar servicios externos reales, pagos reales, credenciales y base de datos productiva.`

const traversalFreeAnswer = `Apruebo usar el workspace C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-toolbank-local
y materializar la carpeta ..\\..\\web-prueba
en modo sandbox mock-only.`

const finalApprovedDecision = buildDecision({
  decisionKey: 'approve-sandbox-materialization-v1',
  selectedOption: 'approve',
  summary:
    'Aprobacion final para materializar solo la entrega segura mock dentro del sandbox controlado sin tocar web-prueba.',
})
const finalApprovalSurfaceViewModel = buildPlannerApprovalSurfaceViewModel({
  generatedDomainMaterializationApprovalSurface:
    finalApprovedDecision.generatedDomainMaterializationApprovalSurface,
  plannerExecutionMetadata: finalApprovedDecision,
  effectivePlannerExecutionMetadata: finalApprovedDecision,
})

assert.equal(finalApprovedDecision.generatedDomainFileCreationApprovalEvaluation?.approved, true)
assert.equal(finalApprovedDecision.generatedDomainFileCreationApprovalEvaluation?.blocked, false)
assert.equal(
  finalApprovedDecision.generatedDomainControlledRuntimeMaterializationSource?.selectedSource,
  'generated-domain-universal',
)
assert.equal(finalApprovedDecision.generatedDomainUniversalMaterializationPlan?.status, 'built')
assert.equal(finalApprovalSurfaceViewModel.status, 'approved-for-sandbox')
assert.notEqual(
  finalApprovalSurfaceViewModel.summary.includes('Todavia no se ejecuto ninguna instruccion'),
  true,
)

const finalMaterializationRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  'community-tool-bank-local',
)
ensureRemoved(finalMaterializationRoot)
const finalMaterializationReport = observationHarness.materializeGeneratedDomainSandboxPlan({
  generatedDomainUniversalMaterializationPlan:
    finalApprovedDecision.generatedDomainUniversalMaterializationPlan,
  generatedDomainFileCreationApprovalEvaluation:
    finalApprovedDecision.generatedDomainFileCreationApprovalEvaluation,
})
assert.equal(finalMaterializationReport?.materialized, true)
assert.equal(
  fs.existsSync(
    path.join(
      finalMaterializationRoot,
      finalApprovedDecision.generatedDomainUniversalMaterializationPlan.projectRoot,
      'validation',
      'report.json',
    ),
  ),
  true,
)
ensureRemoved(finalMaterializationRoot)

const rejectedDecision = buildDecision({
  decisionKey: 'approve-sandbox-materialization-v1',
  selectedOption: 'approve',
  approvalDecision: 'rejected',
  decisionStatus: 'rejected',
  feedbackType: 'approval-rejected',
  summary: 'Rechazar y mantener solo planificacion.',
})
assertBlockedDecision(
  rejectedDecision,
  'Rechazar la materializacion debe mantener el flujo en planificacion sin writes.',
)
runBlockedMaterializationAttempt(
  rejectedDecision,
  'Un rechazo no debe materializar archivos en sandbox.',
)

const deferredDecision = buildDecision({
  decisionKey: 'approve-sandbox-path',
  selectedOption: 'no-materialization-yet',
  approvalDecision: 'deferred',
  decisionStatus: 'deferred',
  feedbackType: 'approval-deferred',
  summary: 'No materializar todavia; mantener solo la planificacion revisable.',
})
assertBlockedDecision(
  deferredDecision,
  'no-materialization-yet no debe habilitar materializacion sandbox.',
)
runBlockedMaterializationAttempt(
  deferredDecision,
  'No materializar todavia no debe crear report.json ni writes en sandbox.',
)

for (const unsafeEntry of [
  {
    label: 'web-prueba',
    freeAnswer: 'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\web-prueba',
  },
  { label: '.env', freeAnswer: '.env' },
  { label: 'node_modules', freeAnswer: 'node_modules' },
  { label: 'Dockerfile', freeAnswer: 'Dockerfile' },
  { label: 'deploy', freeAnswer: 'deploy' },
]) {
  const decision = buildDecision({
    decisionKey: 'approve-sandbox-path',
    selectedOption: 'sandbox-external-new-workspace',
    freeAnswer: unsafeEntry.freeAnswer,
    summary: `Intento inseguro sobre ${unsafeEntry.label}.`,
  })
  assertBlockedDecision(
    decision,
    `${unsafeEntry.label} debe quedar bloqueado y no puede promover sandbox.`,
  )
}

const unsafeAuthorizationDecision = buildDecision({
  decisionKey: 'approval-sandbox-location-v1',
  selectedOption: 'custom-path-inside-workspace',
  freeAnswer: unsafeAuthorizationFreeAnswer,
  summary:
    'Intento inseguro que habilita servicios externos, pagos reales, base productiva y credenciales.',
})
assertBlockedDecision(
  unsafeAuthorizationDecision,
  'Una approval con autorizaciones inseguras debe quedar bloqueada.',
)

const traversalDecision = buildDecision({
  decisionKey: 'approval-sandbox-location-v1',
  selectedOption: 'custom-path-inside-workspace',
  freeAnswer: traversalFreeAnswer,
  summary: 'Intento inseguro con path traversal fuera del sandbox permitido.',
})
assertBlockedDecision(
  traversalDecision,
  'El path traversal con .. debe bloquear la materializacion sandbox.',
)

const safeLocationDecision = buildDecision({
  decisionKey: 'approval-sandbox-location-v1',
  selectedOption: 'custom-path-inside-workspace',
  freeAnswer: safeLocationFreeAnswer,
  summary:
    'Aprobacion segura con workspace externo controlado y carpeta sandbox explicita.',
})
assert.equal(safeLocationDecision.generatedDomainFileCreationApprovalEvaluation?.approved, true)
assert.equal(safeLocationDecision.generatedDomainFileCreationApprovalEvaluation?.blocked, false)
assert.equal(
  safeLocationDecision.generatedDomainFileCreationApprovalEvaluation?.sandboxRoot?.relative,
  '.codex-temp/generated-domain-materialization-approved/sandbox-toolbank-local/sandbox-community-toolbank',
)
assert.equal(
  safeLocationDecision.generatedDomainControlledRuntimeMaterializationSource?.selectedSource,
  'generated-domain-universal',
)

console.log(
  'OK. 9/9 checks de battery sandbox approval: final approve, rechazo, no-materialization-yet, web-prueba, .env, node_modules, Docker/deploy, unsafe authorizations y path traversal.',
)
