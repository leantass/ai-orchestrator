import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import {
  buildPlannerApprovalSurfaceViewModel,
  derivePlannerMaterializationUiState,
  inspectPreparedFullstackLocalMaterialization,
  isPreparedFullstackLocalMaterializationResponse,
} from '../src/planner-ui-state.js'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainFilePath = path.join(repoRoot, 'electron', 'main.cjs')
const mainSource = fs.readFileSync(mainFilePath, 'utf8')
const appFilePath = path.join(repoRoot, 'src', 'App.tsx')
const appSource = fs.readFileSync(appFilePath, 'utf8')
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

assert.equal(
  appSource.includes('sin lenguaje de tracking logistico'),
  false,
  'App.tsx no debe volver a mostrar el copy heredado "sin lenguaje de tracking logistico".',
)
assert.equal(
  appSource.includes('sin reciclar tracking logistico'),
  false,
  'App.tsx no debe volver a mostrar el copy heredado "sin reciclar tracking logistico".',
)
assert.equal(
  appSource.includes('no reciclar logistica, tracking'),
  false,
  'App.tsx no debe volver a incluir guidance heredada con "logistica, tracking".',
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

function loadUiHarness() {
  const plannerSurface = extractSegment({
    startMarker: 'function summarizeGeneratedDomainContractDiagnosticsForDebug(diagnostics) {',
    endMarker: 'function createLocalRulesStrategicBrainProvider() {',
  })
  const harness = `
${plannerSurface}
module.exports = {
  buildBrainRoutingDecision,
  buildLocalStrategicBrainDecision,
  materializeGeneratedDomainSandboxPlan,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    __dirname: path.join(repoRoot, 'electron'),
    app: {
      getPath: (name) =>
        name === 'userData'
          ? path.join(repoRoot, '.codex-temp', 'generated-domain-electron-ui-e2e-user-data')
          : repoRoot,
    },
    lookupReusableArtifactsForPlanning: async () => ({
      matches: [],
      total: 0,
      query: '',
      source: 'generated-domain-electron-ui-e2e-stub',
    }),
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
    filename: 'generated-domain-electron-ui-e2e-smoke-harness.cjs',
  })

  return sandbox.module.exports || {}
}

function ensureRemoved(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
}

const uiHarness = loadUiHarness()
const goal = `Quiero crear una app local para gestionar un banco comunitario de herramientas barriales.

La idea es que vecinos puedan consultar herramientas disponibles, solicitar prestamos, reservar herramientas, registrar devoluciones, ver el estado de cada herramienta y que un operador pueda aprobar prestamos, marcar herramientas como devueltas o danadas, cargar nuevas herramientas y ver reportes simples.

Tiene que tener frontend publico, panel operativo, panel administrativo, backend local mock y diseno de base de datos local.

No quiero pagos reales, no quiero credenciales reales, no quiero deploy, no quiero Docker, no quiero servicios externos y no quiero tocar web-prueba.

Primero quiero una planificacion segura, approval surface y una materializacion solo en sandbox si todo esta aprobado por el flujo seguro.`
const context = `Es una prueba real controlada para validar que JEFE puede resolver un dominio nuevo sin depender de templates hardcodeados ni arrastrar metadata vieja de otros proyectos.

El sistema debe funcionar como fullstack local seguro, orientado a un MVP inicial. Los usuarios principales son vecinos, operadores del banco de herramientas y administradores.

La app debe contemplar herramientas, categorias, disponibilidad, estado de conservacion, solicitudes de prestamo, reservas, devoluciones, danos, vecinos, operadores, panel administrativo, panel operativo y reportes simples.

La prueba debe validar el flujo completo:
pedido -> contrato universal -> plan -> approval surface -> aprobacion humana -> materializacion sandbox -> validacion -> reporte.

No debe crear archivos reales fuera del sandbox seguro. No debe tocar web-prueba. No debe crear .env, node_modules, Docker, deploy ni usar servicios externos.`
const preparedUnsafeWorkspaceGoal =
  'Preparar la materializacion controlada de un fullstack-local local y revisable dentro de una carpeta nueva del workspace. Si el workspace activo no es un sandbox interno aprobado, no devolver un materialize-fullstack-local-plan ejecutable todavia: primero devolver una approvalRequest para ubicar el sandbox seguro.'
const preparedUnsafeWorkspaceContext = [
  `Objetivo original: ${goal}.`,
  `Contexto previo del operador: ${context}.`,
  'sourceStrategy: scalable-delivery-plan.',
  'sourceNextExpectedAction: review-scalable-delivery.',
  'deliveryLevel: fullstack-local.',
  'projectIntent: new-project-intent.',
  'accion requerida: materializar fullstack-local.',
  'modo esperado: scaffold fullstack local, estatico y revisable.',
  'strategyEsperada: scalable-delivery-plan con approval sandbox pendiente.',
  'executionModeEsperado: planner-only hasta resolver approval sandbox.',
  'nextExpectedActionEsperado: user-approval.',
  'requiresApprovalEsperado: true.',
  'Devolver approvalRequest decisionKey approval-sandbox-location-v1 con opcion custom-path-inside-workspace, allowFreeAnswer true y una alternativa no-materialization-yet.',
  `El workspace activo (${repoRoot}) no puede recibir writes directos; primero hace falta una ubicacion sandbox aprobada que luego se mapee a .codex-temp/generated-domain-materialization-approved/.`,
].join('\n')
const unsafeWorkspaceDecision = await uiHarness.buildLocalStrategicBrainDecision({
  goal: preparedUnsafeWorkspaceGoal,
  context: preparedUnsafeWorkspaceContext,
  workspacePath: repoRoot,
  iteration: 1,
  previousExecutionResult: '',
  requiresApproval: false,
  userParticipationMode: 'operator-approves-sensitive',
  projectState: {
    resolvedDecisions: [],
  },
})

assert.equal(unsafeWorkspaceDecision?.requiresApproval, true)
assert.equal(unsafeWorkspaceDecision?.executionMode, 'planner-only')
assert.equal(unsafeWorkspaceDecision?.strategy, 'scalable-delivery-plan')
assert.equal(
  unsafeWorkspaceDecision?.approvalRequest?.decisionKey,
  'approval-sandbox-location-v1',
)
assert.equal(
  unsafeWorkspaceDecision?.nextExpectedAction,
  'user-approval',
)
assert.equal(
  unsafeWorkspaceDecision?.instruction.includes('ubicacion sandbox segura'),
  true,
)

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
const smokeRunId = `generated-domain-electron-ui-e2e-${process.pid}-${Date.now()}`
const safeWorkspacePath = [
  '.codex-temp',
  'generated-domain-materialization-approved',
  smokeRunId,
].join('\\')

const maxQualityRoutingDecision = uiHarness.buildBrainRoutingDecision({
  goal,
  context,
  workspacePath: safeWorkspacePath,
  iteration: 1,
  previousExecutionResult: '',
  requiresApproval: false,
  costMode: 'max-quality',
  routingHints: null,
})

assert.equal(maxQualityRoutingDecision?.selectedProvider, 'local-rules')
assert.equal(maxQualityRoutingDecision?.fallbackProvider, 'openai')
assert.equal(maxQualityRoutingDecision?.routingMode, 'max-quality-policy')

const decision = await uiHarness.buildLocalStrategicBrainDecision({
  goal,
  context,
  workspacePath: safeWorkspacePath,
  iteration: 1,
  previousExecutionResult,
  requiresApproval: false,
  userParticipationMode: 'operator-approves-sensitive',
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
})

assert.equal(decision?.strategy, 'materialize-fullstack-local-plan')
assert.equal(decision?.executionMode, 'executor')
assert.equal(decision?.nextExpectedAction, 'execute-plan')
assert.equal(isPreparedFullstackLocalMaterializationResponse(decision), true)

const approvalEvaluation = decision.generatedDomainFileCreationApprovalEvaluation
const runtimeSource = decision.generatedDomainControlledRuntimeMaterializationSource
const universalPlan = decision.generatedDomainUniversalMaterializationPlan
const approvalSurface = decision.generatedDomainMaterializationApprovalSurface

assert.equal(approvalEvaluation?.approved, true)
assert.equal(approvalEvaluation?.blocked, false)
assert.equal(approvalEvaluation?.status, 'approved-for-sandbox')
assert.equal(runtimeSource?.enabled, true)
assert.equal(runtimeSource?.selectedSource, 'generated-domain-universal')
assert.equal(universalPlan?.status, 'built')
assert.equal(universalPlan?.canMaterializeInSandbox, true)
assert.equal(universalPlan?.safety?.safeForLocalMaterialization, true)
assert.equal(approvalSurface?.status, 'approved-for-sandbox')

const materializationUiState = derivePlannerMaterializationUiState({
  plannerExecutionMetadata: decision,
  effectivePlannerExecutionMetadata: decision,
})
const approvalSurfaceViewModel = buildPlannerApprovalSurfaceViewModel({
  generatedDomainMaterializationApprovalSurface: approvalSurface,
  plannerExecutionMetadata: decision,
  effectivePlannerExecutionMetadata: decision,
})
const contractInspection = inspectPreparedFullstackLocalMaterialization({
  metadata: decision,
  sourcePlan: decision.scalableDeliveryPlan,
})

assert.equal(materializationUiState.fullstackMaterializationResponseReady, true)
assert.equal(materializationUiState.fullstackMaterializationContractReady, true)
assert.equal(materializationUiState.materializeCtaVisible, true)
assert.equal(materializationUiState.materializeCtaEnabled, true)
assert.equal(materializationUiState.uiState, 'materialization-ready')
assert.equal(contractInspection.ok, true)
assert.equal(approvalSurfaceViewModel.present, true)
assert.equal(approvalSurfaceViewModel.status, 'approved-for-sandbox')
assert.equal(approvalSurfaceViewModel.approvalState, 'approved')
assert.notEqual(approvalSurfaceViewModel.summary.includes('Todavia no se ejecuto ninguna instruccion'), true)

const sandboxControlRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  smokeRunId,
)
const sandboxProjectRoot = path.join(sandboxControlRoot, universalPlan.projectRoot)
ensureRemoved(sandboxControlRoot)
ensureRemoved(sandboxProjectRoot)

const materializationReport = uiHarness.materializeGeneratedDomainSandboxPlan({
  generatedDomainUniversalMaterializationPlan: universalPlan,
  generatedDomainFileCreationApprovalEvaluation: approvalEvaluation,
})

assert.equal(materializationReport?.materialized, true)
assert.equal(materializationReport?.status, 'materialized')

const sandboxRootResolved =
  typeof materializationReport?.sandboxRoot?.resolved === 'string' &&
  materializationReport.sandboxRoot.resolved.trim()
    ? materializationReport.sandboxRoot.resolved.trim()
    : sandboxControlRoot
const materializedProjectRoot = path.resolve(
  sandboxRootResolved,
  universalPlan.projectRoot,
)
const reportPath =
  typeof materializationReport?.reportFile === 'string' && materializationReport.reportFile.trim()
    ? path.resolve(sandboxRootResolved, materializationReport.reportFile.trim())
    : path.join(materializedProjectRoot, 'validation', 'report.json')

assert.equal(fs.existsSync(reportPath), true)
assert.equal(fs.existsSync(path.join(materializedProjectRoot, '.env')), false)
assert.equal(fs.existsSync(path.join(materializedProjectRoot, 'node_modules')), false)
assert.equal(materializedProjectRoot.replace(/\\/g, '/').includes('/web-prueba/'), false)

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
assert.equal(report?.status, 'materialized')

console.log(
  'OK. El flujo UI/E2E alternativo ya no queda en revision: approve-sandbox-materialization-v1 promueve execute-plan, habilita generated-domain-universal y materializa validation/report.json en sandbox controlado.',
)

if (
  sandboxRootResolved.replace(/\\/g, '/').startsWith(
    path
      .join(repoRoot, '.codex-temp', 'generated-domain-materialization-approved')
      .replace(/\\/g, '/'),
  )
) {
  ensureRemoved(sandboxRootResolved)
} else {
  ensureRemoved(sandboxControlRoot)
}
