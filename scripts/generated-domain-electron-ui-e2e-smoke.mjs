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

function extractAppSegment({ startMarker, endMarker }) {
  const start = appSource.indexOf(startMarker)
  if (start === -1) {
    throw new Error(`No se encontro el anchor inicial de App ${JSON.stringify(startMarker)}.`)
  }

  const end = appSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(`No se encontro el anchor final de App ${JSON.stringify(endMarker)}.`)
  }

  return appSource.slice(start, end)
}

function loadAppApprovalIntentHarness() {
  const deferredApprovalIntentSource = extractAppSegment({
    startMarker: 'const detectDeferredApprovalIntent = (...texts: unknown[]) => {',
    endMarker: 'const deriveApprovalEquivalenceFamily = (...texts: unknown[]) => {',
  })
    .replace(
      'const detectDeferredApprovalIntent = (...texts: unknown[]) => {',
      'const detectDeferredApprovalIntent = (...texts) => {',
    )
    .replaceAll('.filter((value): value is string =>', '.filter((value) =>')

  const harness = `
${deferredApprovalIntentSource}
module.exports = {
  detectDeferredApprovalIntent,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
  }

  vm.createContext(sandbox)
  vm.runInContext(harness, sandbox, {
    filename: 'generated-domain-app-approval-intent-harness.cjs',
  })

  return sandbox.module.exports || {}
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
  buildBlueprintIntegrations,
  detectBlueprintDataSensitivity,
  detectNoDeployLocalContinuationIntent,
  deriveApprovalEquivalenceFamily,
  detectSensitiveApprovalRequirement,
  detectRemoteOrCriticalAction,
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
const appApprovalIntentHarness = loadAppApprovalIntentHarness()

const deferredApprovalIntentCases = [
  {
    label: 'no materializar todavia',
    text: 'No materializar todavía, dejalo para después.',
    expectedDeferred: true,
  },
  {
    label: 'esperar aprobacion',
    text: 'No avanzar todavía, esperá mi aprobación.',
    expectedDeferred: true,
  },
  {
    label: 'solo planificacion',
    text: 'Primero quiero solo planificación, no crear archivos.',
    expectedDeferred: true,
  },
  {
    label: 'pagos futuros mock local',
    text: 'Más adelante agregamos pagos reales, pero ahora quiero seguir con mock local.',
    expectedDeferred: false,
  },
  {
    label: 'deploy futuro sandbox local',
    text: 'Luego vemos deploy, ahora seguir con sandbox local.',
    expectedDeferred: false,
  },
  {
    label: 'fase futura servicios externos',
    text: 'Fase 2 con servicios externos, ahora solo MVP local.',
    expectedDeferred: false,
  },
  {
    label: 'restriccion actual segura',
    text: 'Por ahora sin pagos y sin servicios externos, seguir con zona de prueba segura.',
    expectedDeferred: false,
  },
  {
    label: 'mock ahora',
    text: 'Continuar mock ahora con primera versión local.',
    expectedDeferred: false,
  },
]

for (const testCase of deferredApprovalIntentCases) {
  assert.equal(
    appApprovalIntentHarness.detectDeferredApprovalIntent(testCase.text),
    testCase.expectedDeferred,
    `detectDeferredApprovalIntent debe devolver ${testCase.expectedDeferred} para "${testCase.label}".`,
  )
}

const noDeployLocalContinuationCases = [
  {
    label: 'local seguro',
    text: 'Solo local, sin deploy, sin Docker, sin servicios externos, no tocar web-prueba.',
    expectedLocalContinuation: true,
  },
  {
    label: 'sandbox seguro',
    text: 'Primera versión en zona de prueba segura, sin publicar y sin credenciales reales.',
    expectedLocalContinuation: true,
  },
  {
    label: 'mvp local',
    text: 'Quiero un MVP local con backend mock, sin deploy y sin DB productiva.',
    expectedLocalContinuation: true,
  },
  {
    label: 'sandbox local',
    text: 'Ahora seguir con sandbox local, luego vemos deploy.',
    expectedLocalContinuation: true,
  },
  {
    label: 'produccion positiva',
    text: 'Quiero hacer deploy ahora a producción.',
    expectedLocalContinuation: false,
  },
  {
    label: 'publicacion positiva',
    text: 'Quiero publicar ahora un repo público.',
    expectedLocalContinuation: false,
  },
  {
    label: 'docker positivo',
    text: 'Quiero usar Docker para producción.',
    expectedLocalContinuation: false,
  },
  {
    label: 'web-prueba positivo',
    text: 'Quiero escribir en web-prueba.',
    expectedLocalContinuation: false,
  },
  {
    label: 'deploy futuro ahora local',
    text: 'Preparar para deploy futuro, pero ahora solo local y sandbox.',
    expectedLocalContinuation: true,
  },
]

for (const testCase of noDeployLocalContinuationCases) {
  assert.equal(
    uiHarness.detectNoDeployLocalContinuationIntent(testCase.text),
    testCase.expectedLocalContinuation,
    `detectNoDeployLocalContinuationIntent debe devolver ${testCase.expectedLocalContinuation} para "${testCase.label}".`,
  )
}

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

const smokeRunId = `generated-domain-electron-ui-e2e-${process.pid}-${Date.now()}`
const safeWorkspacePath = [
  '.codex-temp',
  'generated-domain-materialization-approved',
  smokeRunId,
].join('\\')

const shortSafeGoal = 'Quiero una app para banco de herramientas barriales.'
const shortSafeContext =
  'Solo local. No deploy. No Docker. No servicios externos. No tocar web-prueba. Primera version en zona de prueba segura.'
const visualReviewGoal =
  'Quiero revisar el banco comunitario de herramientas y dejar solo el plan.'
const visualReviewContext =
  'Proyecto actual: banco comunitario de herramientas. No tocar web-prueba. No deploy. No Docker. No servicios externos.'

assert.equal(
  uiHarness.deriveApprovalEquivalenceFamily(shortSafeGoal, shortSafeContext),
  '',
  'Un pedido corto de banco de herramientas en zona segura no debe derivar public-repo-creation.',
)
assert.equal(
  uiHarness.deriveApprovalEquivalenceFamily(visualReviewGoal, visualReviewContext),
  '',
  'La variante resumida de revision local no debe derivar public-repo-creation.',
)

const visualReviewDecision = await uiHarness.buildLocalStrategicBrainDecision({
  goal: visualReviewGoal,
  context: visualReviewContext,
  workspacePath: safeWorkspacePath,
  iteration: 1,
  previousExecutionResult: '',
  requiresApproval: false,
  userParticipationMode: 'operator-approves-sensitive',
  projectState: {
    resolvedDecisions: [],
  },
})

assert.notEqual(
  visualReviewDecision?.approvalRequest?.decisionKey,
  'approve-public-repo-creation',
  'La revision local de banco de herramientas no debe pedir approve-public-repo-creation.',
)

const negatedIntentCases = [
  {
    label: 'no deploy',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'Solo plan local. No deploy. No publicar. Zona de prueba segura.',
  },
  {
    label: 'no pagos reales',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No pagos reales ni checkout real. Solo mock local.',
  },
  {
    label: 'no servicios externos',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No servicios externos. Sin integraciones externas. Primera version local.',
  },
  {
    label: 'no credenciales',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No credenciales, no secrets y no usar .env. Solo zona segura.',
  },
  {
    label: 'no DB productiva',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No DB productiva ni base real. Solo base local mock.',
  },
  {
    label: 'no Docker',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No Docker ni Dockerfile. Solo archivos locales revisables.',
  },
  {
    label: 'no tocar web-prueba',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No tocar web-prueba. Solo sandbox seguro dentro del workspace.',
  },
  {
    label: 'futuro fuera de alcance',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context:
      'Mas adelante podriamos publicar, pero ahora no. Dejar deploy y repo publico fuera de alcance por ahora.',
  },
]

for (const testCase of negatedIntentCases) {
  assert.equal(
    uiHarness.detectSensitiveApprovalRequirement(testCase.goal, testCase.context),
    false,
    `El caso negado "${testCase.label}" no debe activar sensitive approval inmediato.`,
  )
  assert.equal(
    uiHarness.detectRemoteOrCriticalAction(testCase.goal, testCase.context),
    false,
    `El caso negado "${testCase.label}" no debe activar remote/critical inmediato.`,
  )
}

const positiveSensitiveCases = [
  {
    label: 'repo publico',
    goal: 'Quiero crear un repo publico para este proyecto.',
    context: 'Subir repo ahora y dejarlo visible en GitHub.',
    expectedFamily: 'public-repo-creation',
  },
  {
    label: 'pagos reales',
    goal: 'Quiero usar pagos reales con Mercado Pago.',
    context: 'Conectar Mercado Pago ahora con checkout real.',
    expectedFamily: 'real-payments',
  },
]

for (const testCase of positiveSensitiveCases) {
  assert.equal(
    uiHarness.deriveApprovalEquivalenceFamily(testCase.goal, testCase.context),
    testCase.expectedFamily,
    `El caso positivo "${testCase.label}" debe conservar su approval family.`,
  )
  assert.equal(
    uiHarness.detectSensitiveApprovalRequirement(testCase.goal, testCase.context),
    true,
    `El caso positivo "${testCase.label}" debe activar sensitive approval.`,
  )
  assert.equal(
    uiHarness.detectRemoteOrCriticalAction(testCase.goal, testCase.context),
    true,
    `El caso positivo "${testCase.label}" debe activar remote/critical.`,
  )
}

const negativeBlueprintIntegrationCases = [
  {
    label: 'no pagos reales',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'No pagos reales ni checkout real. Solo mock local.',
    forbiddenType: 'payments',
  },
  {
    label: 'sin servicios externos',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'Sin servicios externos, sin integraciones externas y sin webhooks.',
    forbiddenType: 'external-service',
  },
  {
    label: 'Mercado Pago mas adelante',
    goal: 'Quiero una app local para banco de herramientas barriales.',
    context: 'Mercado Pago mas adelante, por ahora fuera de alcance.',
    forbiddenType: 'payments',
  },
]

for (const testCase of negativeBlueprintIntegrationCases) {
  const integrations = uiHarness.buildBlueprintIntegrations({
    goal: testCase.goal,
    context: testCase.context,
    deliveryLevel: 'fullstack-local',
  })
  assert.equal(
    integrations.some((entry) => entry?.type === testCase.forbiddenType),
    false,
    `El blueprint no debe activar ${testCase.forbiddenType} para "${testCase.label}".`,
  )
}

const positiveBlueprintIntegrationCases = [
  {
    label: 'pagos reales con Mercado Pago',
    goal: 'Quiero usar pagos reales con Mercado Pago.',
    context: 'Conectar Mercado Pago ahora con checkout real.',
    expectedType: 'payments',
  },
  {
    label: 'webhooks externos',
    goal: 'Quiero integrar webhooks externos.',
    context: 'Necesito webhooks y usar API externa ahora.',
    expectedType: 'external-service',
  },
]

for (const testCase of positiveBlueprintIntegrationCases) {
  const integrations = uiHarness.buildBlueprintIntegrations({
    goal: testCase.goal,
    context: testCase.context,
    deliveryLevel: 'fullstack-local',
  })
  assert.equal(
    integrations.some((entry) => entry?.type === testCase.expectedType),
    true,
    `El blueprint debe conservar ${testCase.expectedType} para "${testCase.label}".`,
  )
}

const blueprintDataSensitivityCases = [
  {
    label: 'sensibilidad negada',
    goal: 'Quiero una app local con usuarios ficticios, sin datos reales, sin pagos reales y sin credenciales.',
    context: 'Solo mock local y datos de prueba en una base local.',
    expectedSensitivity: 'low',
  },
  {
    label: 'sensibilidad real positiva',
    goal: 'Quiero usar usuarios reales, pagos reales y credenciales reales.',
    context: 'La app operara con datos reales inmediatos.',
    expectedSensitivity: 'high',
  },
  {
    label: 'futuro de pagos',
    goal: 'Mas adelante agregamos pagos reales, pero ahora solo mock local.',
    context: 'Por ahora fuera de alcance.',
    expectedSensitivity: 'low',
  },
  {
    label: 'futuro de usuarios reales',
    goal: 'Mas adelante usara usuarios reales, ahora mock.',
    context: 'No en esta etapa.',
    expectedSensitivity: 'low',
  },
  {
    label: 'datos ficticios',
    goal: 'Necesito clientes ficticios y datos de prueba en una base local.',
    context: 'Solo mock local.',
    expectedSensitivity: 'low',
  },
  {
    label: 'datos reales de clientes',
    goal: 'La app manejara datos reales de clientes y datos personales.',
    context: 'Se operara con informacion sensible real.',
    expectedSensitivity: 'high',
  },
  {
    label: 'db productiva negada',
    goal: 'Solo base local de prueba, sin DB productiva y sin produccion.',
    context: 'Nada real en esta etapa.',
    expectedSensitivity: 'low',
  },
  {
    label: 'db productiva positiva',
    goal: 'Debe conectarse a una base productiva con usuarios reales.',
    context: 'Usar produccion en esta fase.',
    expectedSensitivity: 'high',
  },
]

for (const testCase of blueprintDataSensitivityCases) {
  assert.equal(
    uiHarness.detectBlueprintDataSensitivity(testCase.goal, testCase.context, {
      domainLabel: 'Proyecto local de prueba',
      primaryEntities: ['usuarios', 'clientes'],
    }),
    testCase.expectedSensitivity,
    `La sensibilidad de datos para "${testCase.label}" debe ser ${testCase.expectedSensitivity}.`,
  )
}

const communityNurseryGoal = `Quiero crear una app local para gestionar un vivero comunitario de intercambio de plantas.

La app tiene que permitir que vecinos registren plantas, esquejes o semillas disponibles, consulten especies, pidan intercambios, reserven plantas, registren entregas y vean consejos basicos de cuidado.

Tambien tiene que tener un panel operativo para coordinadores del vivero, donde puedan aprobar solicitudes, cambiar estados, marcar entregas realizadas, registrar observaciones y actualizar disponibilidad.

Ademas tiene que tener un panel administrativo para cargar especies, categorias, zonas de cultivo, usuarios operadores, reglas de intercambio y reportes simples.

Tiene que incluir frontend publico, panel operativo, panel administrativo, backend local mock y diseno de base de datos local.

No quiero pagos reales, no quiero credenciales reales, no quiero deploy, no quiero Docker, no quiero servicios externos, no quiero webhooks, no quiero DB productiva y no quiero tocar web-prueba.

Primero quiero planificacion segura, confirmacion humana y una primera version solo en zona de prueba segura.`

const communityNurseryContext = `Es una segunda prueba real controlada para validar que JEFE puede resolver un dominio nuevo sin depender de plantillas rigidas, sin sobreajustarse al caso taller de bicicletas y sin arrastrar dominios anteriores.

La app debe funcionar como MVP local seguro. Los usuarios principales son vecinos, coordinadores del vivero y administradores.

El sistema debe contemplar plantas, especies, esquejes, semillas, vecinos, solicitudes de intercambio, reservas, entregas, disponibilidad, cuidados basicos, observaciones, panel publico, panel operativo, panel administrativo, backend mock y base local.

Todo debe ser mock/local. No debe crear archivos reales fuera de una zona de prueba segura. No debe tocar web-prueba. No debe crear .env, node_modules, Docker, deploy ni usar servicios externos.`

const communityNurseryDecision = await uiHarness.buildLocalStrategicBrainDecision({
  goal: communityNurseryGoal,
  context: communityNurseryContext,
  workspacePath: safeWorkspacePath,
  iteration: 1,
  previousExecutionResult: '',
  requiresApproval: false,
  userParticipationMode: 'operator-approves-sensitive',
  projectState: {
    resolvedDecisions: [],
  },
})

const communityNurseryDomainText = JSON.stringify(
  {
    domainUnderstanding: communityNurseryDecision?.domainUnderstanding,
    projectBlueprint: communityNurseryDecision?.projectBlueprint,
    productArchitecture: communityNurseryDecision?.productArchitecture,
    safeFirstDeliveryPlan: communityNurseryDecision?.safeFirstDeliveryPlan,
    scalableDeliveryPlan: communityNurseryDecision?.scalableDeliveryPlan,
  },
  null,
  2,
)
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase()

for (const requiredTerm of [
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
]) {
  assert.equal(
    communityNurseryDomainText.includes(requiredTerm),
    true,
    `El contrato del vivero comunitario debe conservar ${requiredTerm}.`,
  )
}

for (const forbiddenDomain of [
  'taller barrial de reparacion de bicicletas',
  'bicicletas',
  'mecanicos',
  'repuestos',
  'operaciones portuarias',
  'ecommerce local',
  'banco comunitario de herramientas',
  'tracking logistico',
]) {
  assert.equal(
    communityNurseryDomainText.includes(forbiddenDomain),
    false,
    `El contrato del vivero comunitario no debe contaminarse con ${forbiddenDomain}.`,
  )
}

async function assertGenericManagedDomainUnderstanding({
  label,
  goal,
  context,
  expectedDomain,
  requiredTerms,
}) {
  const decision = await uiHarness.buildLocalStrategicBrainDecision({
    goal,
    context,
    workspacePath: safeWorkspacePath,
    qualityPreference: 'max',
    reusePolicy: 'none',
    previousExecutionResult: '',
  })
  const actualDomain = String(decision?.domainUnderstanding?.domainLabel || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
  const expectedDomainNormalized = expectedDomain
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
  const domainText = JSON.stringify(
    {
      domainUnderstanding: decision?.domainUnderstanding,
      projectBlueprint: decision?.projectBlueprint,
      scalableDeliveryPlan: decision?.scalableDeliveryPlan,
    },
    null,
    2,
  )
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()

  assert.equal(actualDomain, expectedDomainNormalized, `${label} debe conservar domainLabel.`)

  for (const forbiddenDomainLabel of [
    'zona de prueba segura',
    'sandbox',
    'backend mock',
    'base local',
    'fullstack local',
  ]) {
    assert.notEqual(
      actualDomain,
      forbiddenDomainLabel,
      `${label} no debe usar ${forbiddenDomainLabel} como dominio principal.`,
    )
  }

  for (const requiredTerm of requiredTerms) {
    assert.equal(
      domainText.includes(requiredTerm),
      true,
      `${label} debe conservar ${requiredTerm}.`,
    )
  }

  for (const forbiddenApproval of [
    'repo publico',
    'pagos reales',
    'servicios externos',
    'deploy',
    'docker',
    'credenciales',
  ]) {
    assert.equal(
      JSON.stringify(decision?.approvalRequest || {})
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase()
        .includes(forbiddenApproval),
      false,
      `${label} no debe pedir approval de ${forbiddenApproval}.`,
    )
  }
}

await assertGenericManagedDomainUnderstanding({
  label: 'centro cultural no perfilado',
  goal: `Quiero crear una app local para gestionar un centro barrial de talleres culturales y oficios.

La app permite consultar talleres, horarios, cupos, docentes, materiales, inscripciones y estados de inscripcion.

Tambien incluye panel publico, panel operativo, panel administrativo, backend mock y base local.

Todo en zona de prueba segura, sin deploy, sin servicios externos, sin Docker y sin credenciales reales.`,
  context:
    'El sistema contempla vecinos, coordinadores, docentes, categorias, talleres, inscripciones, cupos, horarios, espacios/aulas, asistencia, materiales, observaciones, estados de inscripcion, reportes simples, panel publico, panel operativo, panel administrativo, backend mock y base local.',
  expectedDomain: 'centro barrial de talleres culturales y oficios',
  requiredTerms: [
    'talleres',
    'categorias',
    'docentes',
    'vecinos',
    'coordinadores',
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
  ],
})

await assertGenericManagedDomainUnderstanding({
  label: 'biblioteca vecinal no perfilada',
  goal:
    'Quiero crear una app local para gestionar una biblioteca vecinal de intercambio de libros, con socios, libros, prestamos, devoluciones, reservas, categorias, operadores, reportes simples, backend mock y base local. Todo en zona de prueba segura, sin deploy, sin servicios externos y sin credenciales reales.',
  context:
    'Validar dominio generico no perfilado. La zona de prueba segura es restriccion, no dominio.',
  expectedDomain: 'biblioteca vecinal de intercambio de libros',
  requiredTerms: [
    'socios',
    'libros',
    'prestamos',
    'devoluciones',
    'reservas',
    'categorias',
    'operadores',
    'reportes simples',
    'backend mock',
    'base local',
  ],
})

const communityNurseryExecutionGoal = communityNurseryGoal.replace(
  'Primero quiero planificacion segura, confirmacion humana y una primera version solo en zona de prueba segura.',
  'La planificacion segura ya fue revisada y la confirmacion humana ya fue concedida; materializar ahora una primera version solo en zona de prueba segura.',
)

const communityNurseryDecisionForMaterialization =
  await uiHarness.buildLocalStrategicBrainDecision({
    goal: communityNurseryExecutionGoal,
    context: communityNurseryContext,
    workspacePath: safeWorkspacePath,
    iteration: 2,
    previousExecutionResult: JSON.stringify({
      source: 'planner',
      approvalMode: 'once',
      approvalDecision: 'approved',
      approvalRequestDecisionKey: 'approve-sandbox-materialization-v1',
      responseMode: 'options',
      selectedOption: 'approve',
      approvalReason:
        'Materializar solo la primera version local segura dentro del sandbox aprobado.',
    }),
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
          summary:
            'Aprobacion humana para materializar solo el vivero comunitario en sandbox seguro.',
        },
      ],
    },
  })

const communityNurseryApprovalEvaluation =
  communityNurseryDecisionForMaterialization.generatedDomainFileCreationApprovalEvaluation
const communityNurseryUniversalPlan =
  communityNurseryDecisionForMaterialization.generatedDomainUniversalMaterializationPlan

assert.equal(
  communityNurseryDecisionForMaterialization?.strategy,
  'materialize-fullstack-local-plan',
)
assert.equal(communityNurseryDecisionForMaterialization?.nextExpectedAction, 'execute-plan')
assert.equal(communityNurseryApprovalEvaluation?.approved, true)
assert.equal(communityNurseryApprovalEvaluation?.blocked, false)
assert.equal(communityNurseryApprovalEvaluation?.status, 'approved-for-sandbox')
assert.equal(communityNurseryUniversalPlan?.status, 'built')
assert.equal(communityNurseryUniversalPlan?.canMaterializeInSandbox, true)

const communityNurserySandboxRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  communityNurseryUniversalPlan.projectRoot,
)
ensureRemoved(communityNurserySandboxRoot)

const communityNurseryMaterializationReport =
  uiHarness.materializeGeneratedDomainSandboxPlan({
    generatedDomainUniversalMaterializationPlan: communityNurseryUniversalPlan,
    generatedDomainFileCreationApprovalEvaluation: communityNurseryApprovalEvaluation,
  })

assert.equal(communityNurseryMaterializationReport?.materialized, true)
assert.equal(communityNurseryMaterializationReport?.status, 'materialized')

const communityNurseryMaterializedProjectRoot = path.resolve(
  communityNurseryMaterializationReport.sandboxRoot.resolved,
  communityNurseryUniversalPlan.projectRoot,
)
assert.equal(
  fs.existsSync(path.join(communityNurseryMaterializedProjectRoot, 'validation', 'report.json')),
  true,
)
assert.equal(fs.existsSync(path.join(communityNurseryMaterializedProjectRoot, '.env')), false)
assert.equal(
  fs.existsSync(path.join(communityNurseryMaterializedProjectRoot, 'node_modules')),
  false,
)
assert.equal(
  communityNurseryMaterializedProjectRoot.replace(/\\/g, '/').includes('/web-prueba/'),
  false,
)

const bikeWorkshopGoal = `Quiero crear una app local para gestionar un taller barrial de reparacion de bicicletas.

La app tiene que permitir que vecinos registren bicicletas, pidan turnos de reparacion, consulten el estado del trabajo, vean presupuestos estimados y reciban avisos simulados.

Tambien tiene que tener un panel operativo para mecanicos, donde puedan ver ordenes de trabajo, cambiar estados, registrar repuestos usados, marcar una bici como lista y cargar observaciones.

Ademas tiene que tener un panel administrativo para cargar tipos de reparacion, repuestos, precios de referencia, usuarios operadores y reportes simples.

Tiene que incluir frontend publico, panel operativo, panel administrativo, backend local mock y diseno de base de datos local.

No quiero pagos reales, no quiero credenciales reales, no quiero deploy, no quiero Docker, no quiero servicios externos, no quiero webhooks, no quiero DB productiva y no quiero tocar web-prueba.

Primero quiero planificacion segura, confirmacion humana y una primera version solo en zona de prueba segura.`

const bikeWorkshopContext = `Es una prueba real controlada para validar que JEFE puede resolver un dominio nuevo sin depender de plantillas rigidas ni arrastrar datos viejos de otros proyectos.

La app debe funcionar como MVP local seguro. Los usuarios principales son vecinos, mecanicos/operadores y administradores.

Todo debe ser mock/local, en zona de prueba segura, sin deploy, sin servicios externos y sin credenciales reales.`

const bikeWorkshopApprovedExternalSandboxPath =
  'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-bike-repair-local'
const bikeWorkshopApprovedSandboxFolder = 'sandbox-bike-repair-workshop'
const bikeWorkshopApprovalFreeAnswer = `Apruebo crear/materializar unicamente en un sandbox seguro y aislado para esta prueba.

Usar como workspace alternativo seguro la ruta:

${bikeWorkshopApprovedExternalSandboxPath}

Dentro de ese workspace, materializar exclusivamente la carpeta:

${bikeWorkshopApprovedSandboxFolder}

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

const bikeWorkshopPreviousExecutionResult =
  '__orchestrator_feedback__:' +
  JSON.stringify({
    type: 'approval-granted',
    source: 'planner',
    approvalMode: 'once',
    approvalDecision: 'approved',
    approvalRequestDecisionKey: 'approve-sandbox-materialization-v1',
    responseMode: 'options',
    selectedOption: 'approve',
    approvalReason:
      'Materializar solo la primera version local segura dentro del sandbox aprobado.',
  })

const bikeWorkshopPlanningDecision = await uiHarness.buildLocalStrategicBrainDecision({
  goal: bikeWorkshopGoal,
  context: bikeWorkshopContext,
  workspacePath: safeWorkspacePath,
  iteration: 1,
  previousExecutionResult: '',
  requiresApproval: false,
  userParticipationMode: 'operator-approves-sensitive',
  projectState: {
    resolvedDecisions: [],
  },
})

const bikeWorkshopExecutionGoal = bikeWorkshopGoal.replace(
  'Primero quiero planificacion segura, confirmacion humana y una primera version solo en zona de prueba segura.',
  'La planificacion segura ya fue revisada y la confirmacion humana ya fue concedida; materializar ahora una primera version solo en zona de prueba segura.',
)

const bikeWorkshopDecision = await uiHarness.buildLocalStrategicBrainDecision({
  goal: bikeWorkshopExecutionGoal,
  context: bikeWorkshopContext,
  workspacePath: safeWorkspacePath,
  iteration: 2,
  previousExecutionResult: bikeWorkshopPreviousExecutionResult,
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
        summary:
          'Aprobacion humana para materializar solo el taller de bicicletas en sandbox seguro.',
      },
    ],
  },
})

const bikeWorkshopDomainText = JSON.stringify(
  {
    planning: {
      domainUnderstanding: bikeWorkshopPlanningDecision?.domainUnderstanding,
      projectBlueprint: bikeWorkshopPlanningDecision?.projectBlueprint,
      productArchitecture: bikeWorkshopPlanningDecision?.productArchitecture,
      safeFirstDeliveryPlan: bikeWorkshopPlanningDecision?.safeFirstDeliveryPlan,
      scalableDeliveryPlan: bikeWorkshopPlanningDecision?.scalableDeliveryPlan,
    },
    execution: {
      domainUnderstanding: bikeWorkshopDecision?.domainUnderstanding,
      projectBlueprint: bikeWorkshopDecision?.projectBlueprint,
      productArchitecture: bikeWorkshopDecision?.productArchitecture,
      safeFirstDeliveryPlan: bikeWorkshopDecision?.safeFirstDeliveryPlan,
      scalableDeliveryPlan: bikeWorkshopDecision?.scalableDeliveryPlan,
      materializationPlan: bikeWorkshopDecision?.materializationPlan,
      localProjectManifest: bikeWorkshopDecision?.localProjectManifest,
      generatedDomainContract: bikeWorkshopDecision?.generatedDomainContract,
      universalPlan: bikeWorkshopDecision?.generatedDomainUniversalMaterializationPlan,
    },
  },
  null,
  2,
)
const normalizedBikeWorkshopDomainText = bikeWorkshopDomainText
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase()

for (const requiredTerm of [
  'taller barrial de reparacion de bicicletas',
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
]) {
  assert.equal(
    normalizedBikeWorkshopDomainText.includes(requiredTerm),
    true,
    `El contrato del taller de bicicletas debe conservar ${requiredTerm}.`,
  )
}

for (const forbiddenDomain of [
  'operaciones portuarias',
  'operacion portuaria',
  'ecommerce local',
  'banco comunitario de herramientas',
  'tracking logistico',
]) {
  assert.equal(
    normalizedBikeWorkshopDomainText.includes(forbiddenDomain),
    false,
    `El contrato del taller de bicicletas no debe contaminarse con ${forbiddenDomain}.`,
  )
}

const bikeWorkshopApprovalEvaluation =
  bikeWorkshopDecision.generatedDomainFileCreationApprovalEvaluation
const bikeWorkshopUniversalPlan =
  bikeWorkshopDecision.generatedDomainUniversalMaterializationPlan

assert.equal(bikeWorkshopDecision?.strategy, 'materialize-fullstack-local-plan')
assert.equal(bikeWorkshopDecision?.executionMode, 'executor')
assert.equal(bikeWorkshopDecision?.nextExpectedAction, 'execute-plan')
assert.equal(bikeWorkshopApprovalEvaluation?.approved, true)
assert.equal(bikeWorkshopApprovalEvaluation?.blocked, false)
assert.equal(bikeWorkshopApprovalEvaluation?.status, 'approved-for-sandbox')
assert.equal(bikeWorkshopUniversalPlan?.status, 'built')
assert.equal(bikeWorkshopUniversalPlan?.canMaterializeInSandbox, true)
assert.equal(bikeWorkshopUniversalPlan?.safety?.safeForLocalMaterialization, true)

const bikeWorkshopSandboxRoot = path.join(
  repoRoot,
  '.codex-temp',
  'generated-domain-materialization-approved',
  bikeWorkshopUniversalPlan.projectRoot,
)
ensureRemoved(bikeWorkshopSandboxRoot)

const bikeWorkshopMaterializationReport = uiHarness.materializeGeneratedDomainSandboxPlan({
  generatedDomainUniversalMaterializationPlan: bikeWorkshopUniversalPlan,
  generatedDomainFileCreationApprovalEvaluation: bikeWorkshopApprovalEvaluation,
})

assert.equal(bikeWorkshopMaterializationReport?.materialized, true)
assert.equal(bikeWorkshopMaterializationReport?.status, 'materialized')

const bikeWorkshopSandboxRootResolved =
  typeof bikeWorkshopMaterializationReport?.sandboxRoot?.resolved === 'string' &&
  bikeWorkshopMaterializationReport.sandboxRoot.resolved.trim()
    ? bikeWorkshopMaterializationReport.sandboxRoot.resolved.trim()
    : bikeWorkshopSandboxRoot
const bikeWorkshopMaterializedProjectRoot = path.resolve(
  bikeWorkshopSandboxRootResolved,
  bikeWorkshopUniversalPlan.projectRoot,
)
const bikeWorkshopReportPath = path.join(
  bikeWorkshopMaterializedProjectRoot,
  'validation',
  'report.json',
)
assert.equal(fs.existsSync(bikeWorkshopReportPath), true)
assert.equal(fs.existsSync(path.join(bikeWorkshopMaterializedProjectRoot, '.env')), false)
assert.equal(fs.existsSync(path.join(bikeWorkshopMaterializedProjectRoot, 'node_modules')), false)
assert.equal(fs.existsSync(path.join(bikeWorkshopMaterializedProjectRoot, 'Dockerfile')), false)
assert.equal(
  bikeWorkshopMaterializedProjectRoot.replace(/\\/g, '/').includes('/web-prueba/'),
  false,
)

const bikeWorkshopReport = JSON.parse(fs.readFileSync(bikeWorkshopReportPath, 'utf8'))
assert.equal(bikeWorkshopReport?.status, 'materialized')
const bikeWorkshopSchemaPath = path.join(
  bikeWorkshopMaterializedProjectRoot,
  'database',
  'schema.sql',
)
assert.equal(
  /\bcreate\s+table\s+(?:bicycles|bicicletas)\b/u.test(
    fs.readFileSync(bikeWorkshopSchemaPath, 'utf8').toLocaleLowerCase(),
  ),
  true,
)

ensureRemoved(bikeWorkshopSandboxRootResolved)

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
