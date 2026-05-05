import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainFilePath = path.join(repoRoot, 'electron', 'main.cjs')
const appFilePath = path.join(repoRoot, 'src', 'App.tsx')
const mainSource = fs.readFileSync(mainFilePath, 'utf8')
const {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  buildLocalMaterializationTask,
  runLocalDeterministicTask,
} = require(
  path.join(repoRoot, 'electron', 'local-deterministic-executor.cjs'),
)

const smokeWorkspaceRoot = path.join(repoRoot, '.tmp', 'ai-operator-e2e-smoke')
const continuationBasePhaseIds = [
  'fullstack-local-scaffold',
  'frontend-mock-flow',
  'backend-contracts',
  'database-design',
  'local-validation',
  'review-and-expand',
]
const requiredPlannerFunctions = ['buildLocalStrategicBrainDecision']
const veterinaryGoalCase = {
  goal:
    'Hacer un sistema fullstack local para turnos de veterinaria con clientes, mascotas, turnos, recordatorios y reportes.',
  context: '',
  projectLabel: 'turnos de veterinaria',
}
const stockGoalCase = {
  goal:
    'Hacer un sistema fullstack local para gestion de stock de un comercio con frontend, backend y base de datos local.',
  context: '',
  projectLabel: 'gestion de stock para comercio',
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function normalizeIdentifier(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function normalizePathForComparison(value) {
  return String(value || '').replace(/\\/g, '/')
}

function summarizeUniqueStrings(entries, limit = 16) {
  const values = []
  const seen = new Set()

  for (const entry of Array.isArray(entries) ? entries : []) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }

    const value = entry.trim()
    if (seen.has(value)) {
      continue
    }

    seen.add(value)
    values.push(value)
  }

  return values.slice(0, limit)
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function ensureCleanDirectory(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
  fs.mkdirSync(targetPath, { recursive: true })
}

function cleanupSmokeWorkspaceRoot() {
  fs.rmSync(smokeWorkspaceRoot, { recursive: true, force: true })

  const smokeParentPath = path.dirname(smokeWorkspaceRoot)
  if (!fs.existsSync(smokeParentPath)) {
    return
  }

  const remainingEntries = fs.readdirSync(smokeParentPath, { withFileTypes: true })
  if (remainingEntries.length === 0) {
    fs.rmSync(smokeParentPath, { recursive: true, force: true })
  }
}

function extractSegment({ name, startMarker, endMarker }) {
  const start = mainSource.indexOf(startMarker)
  if (start === -1) {
    throw new Error(
      `[ai-operator-e2e-smoke] No se encontro el anchor inicial de ${name}: ${JSON.stringify(startMarker)}.`,
    )
  }

  const end = mainSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(
      `[ai-operator-e2e-smoke] No se encontro el anchor final de ${name}: ${JSON.stringify(endMarker)}.`,
    )
  }

  return mainSource.slice(start, end)
}

function loadPlannerTestingSurface() {
  const plannerSurface = extractSegment({
    name: 'superficie local de planner',
    startMarker: 'function normalizeExecutorAttemptScope(',
    endMarker: 'function buildOpenAIBrainInputPayload(input) {',
  })
  const harness = `
${plannerSurface}
module.exports = {
  buildLocalStrategicBrainDecision,
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
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)

  try {
    vm.runInContext(harness, sandbox, {
      filename: 'ai-operator-e2e-smoke-harness.cjs',
    })
  } catch (error) {
    throw new Error(
      `[ai-operator-e2e-smoke] No se pudo ejecutar el harness del planner: ${error.message}`,
    )
  }

  const exported = sandbox.module.exports || {}
  const missing = requiredPlannerFunctions.filter((name) => typeof exported[name] !== 'function')
  if (missing.length > 0) {
    throw new Error(
      `[ai-operator-e2e-smoke] Faltan funciones requeridas en el harness: ${missing.join(', ')}.`,
    )
  }

  return exported
}

const plannerApi = loadPlannerTestingSurface()

function buildReusablePlanningContext() {
  return {
    reusableArtifactLookup: {
      executed: false,
      foundCount: 0,
      matches: [],
    },
    reusableArtifactsFound: 0,
    reuseDecision: false,
    reuseReason: '',
    reusedArtifactIds: [],
    reuseMode: 'none',
    creativeDirection: null,
  }
}

function buildFullstackLocalMaterializationPrompt({ goal, scalablePlan }) {
  const allowedRootPaths = summarizeUniqueStrings(scalablePlan?.allowedRootPaths, 8)
  const targetStructure = summarizeUniqueStrings(scalablePlan?.targetStructure, 16)
  const directories = summarizeUniqueStrings(scalablePlan?.directories, 24)
  const filesToCreate = Array.isArray(scalablePlan?.filesToCreate)
    ? scalablePlan.filesToCreate
        .map((entry) => (entry && typeof entry === 'object' ? String(entry.path || '').trim() : ''))
        .filter(Boolean)
        .slice(0, 24)
    : []
  const localOnlyConstraints = summarizeUniqueStrings(
    scalablePlan?.localOnlyConstraints,
    16,
  )
  const explicitExclusions = summarizeUniqueStrings(
    scalablePlan?.explicitExclusions,
    16,
  )

  return {
    goal: `Materializar fullstack-local revisado para "${goal}".`,
    context: [
      'deliveryLevel: fullstack-local.',
      'accion requerida: materializar fullstack-local.',
      allowedRootPaths.length > 0
        ? `allowedRootPaths: ${allowedRootPaths.join(', ')}`
        : '',
      targetStructure.length > 0 ? `targetStructure: ${targetStructure.join(', ')}` : '',
      directories.length > 0 ? `directories: ${directories.join(', ')}` : '',
      filesToCreate.length > 0 ? `filesToCreate: ${filesToCreate.join(', ')}` : '',
      localOnlyConstraints.length > 0
        ? `localOnlyConstraints: ${localOnlyConstraints.join(' | ')}`
        : '',
      explicitExclusions.length > 0
        ? `explicitExclusions: ${explicitExclusions.join(' | ')}`
        : '',
      'Archivos requeridos: README.md, package.json, frontend/package.json, frontend/index.html, frontend/src/main.js, frontend/src/styles.css, frontend/src/mock-data.js, frontend/src/components/App.js, backend/package.json, backend/src/server.js, backend/src/routes/health.js, backend/src/modules/appointments.js, backend/src/lib/response.js, shared/contracts/domain.js, shared/types/contracts.js, database/README.md, database/schema.sql, database/seeds/seed-local.sql, scripts/README.md, scripts/seed-local.js, docs/architecture.md, docs/local-runbook.md.',
      'Devolver un materialize-fullstack-local-plan ejecutable por el executor local deterministico.',
      'No instalar dependencias, no crear node_modules, no crear .env real y no levantar servicios.',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function findManifestPathInsideWorkspace(workspacePath) {
  if (!workspacePath || !fs.existsSync(workspacePath)) {
    return ''
  }

  const directManifestPath = path.join(workspacePath, 'jefe-project.json')
  if (fs.existsSync(directManifestPath)) {
    return directManifestPath
  }

  const entries = fs
    .readdirSync(workspacePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .slice(0, 12)

  for (const entry of entries) {
    const manifestPath = path.join(workspacePath, entry.name, 'jefe-project.json')
    if (fs.existsSync(manifestPath)) {
      return manifestPath
    }
  }

  return ''
}

async function requestPlannerDecision({
  goal,
  context = '',
  workspacePath = '',
}) {
  return plannerApi.buildLocalStrategicBrainDecision({
    goal,
    context,
    workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'operator-e2e-smoke',
    },
    reusablePlanningContext: buildReusablePlanningContext(),
  })
}

async function buildFullstackFixture({
  workspaceName,
  goal,
  context,
  projectLabel,
}) {
  const workspacePath = path.join(smokeWorkspaceRoot, workspaceName)
  ensureCleanDirectory(workspacePath)

  const phaseOneDecision = await requestPlannerDecision({
    goal,
    context,
    workspacePath,
  })
  const scalablePlan =
    phaseOneDecision?.scalableDeliveryPlan &&
    typeof phaseOneDecision.scalableDeliveryPlan === 'object'
      ? phaseOneDecision.scalableDeliveryPlan
      : null

  if (!scalablePlan) {
    throw new Error('No se pudo obtener scalableDeliveryPlan para el fixture.')
  }

  const prompt = buildFullstackLocalMaterializationPrompt({
    goal,
    scalablePlan,
  })
  const phaseTwoDecision = await requestPlannerDecision({
    goal: prompt.goal,
    context: prompt.context,
    workspacePath,
  })

  if (!phaseTwoDecision?.materializationPlan) {
    throw new Error('No se pudo construir el materializationPlan base del fixture.')
  }

  const task = buildLocalMaterializationTask({
    plan: phaseTwoDecision.materializationPlan,
    workspacePath,
    requestId: `${workspaceName}-base`,
    instruction: phaseTwoDecision.instruction || '',
    brainStrategy: phaseTwoDecision.strategy || '',
    businessSector: phaseTwoDecision.businessSector || '',
    businessSectorLabel: phaseTwoDecision.businessSectorLabel || '',
    creativeDirection: phaseTwoDecision.creativeDirection || null,
    reusableArtifactLookup: phaseTwoDecision.reusableArtifactLookup || null,
    reusableArtifactsFound: phaseTwoDecision.reusableArtifactsFound || 0,
    reuseDecision: phaseTwoDecision.reuseDecision === true,
    reuseReason: phaseTwoDecision.reuseReason || '',
    reusedArtifactIds: Array.isArray(phaseTwoDecision.reusedArtifactIds)
      ? phaseTwoDecision.reusedArtifactIds
      : [],
    reuseMode: phaseTwoDecision.reuseMode || 'none',
    reuseMaterialization: null,
    materializationPlanSource: phaseTwoDecision.materializationPlanSource || 'planner',
  })

  if (!task) {
    throw new Error('No se pudo construir la tarea local deterministica del fixture.')
  }

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    throw new Error(
      executionResult?.error ||
        'La materializacion base del fixture no termino en OK.',
    )
  }

  const manifestPath = findManifestPathInsideWorkspace(workspacePath)
  if (!manifestPath) {
    throw new Error('No se encontro jefe-project.json dentro del fixture.')
  }

  const projectRootPath = path.dirname(manifestPath)
  const projectRootRelativePath = normalizePathForComparison(
    path.relative(workspacePath, projectRootPath) || '.',
  )
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  return {
    workspacePath,
    manifestPath,
    manifest,
    projectRootPath,
    projectRootRelativePath,
    projectLabel,
    phaseOneDecision,
    phaseTwoDecision,
    executionResult,
  }
}

async function materializePhaseOnFixture({
  fixture,
  phaseId,
  requestId,
}) {
  const decision = await requestPlannerDecision({
    goal: `Materializar la fase ${phaseId} del proyecto fullstack local de ${fixture.projectLabel}.`,
    context: `phaseId: ${phaseId}`,
    workspacePath: fixture.workspacePath,
  })

  if (!decision?.materializationPlan) {
    throw new Error(`No se pudo construir el materializationPlan de ${phaseId}.`)
  }

  const task = buildLocalMaterializationTask({
    plan: decision.materializationPlan,
    workspacePath: fixture.workspacePath,
    requestId,
    instruction: decision.instruction || '',
    brainStrategy: decision.strategy || '',
    businessSector: decision.businessSector || '',
    businessSectorLabel: decision.businessSectorLabel || '',
    creativeDirection: decision.creativeDirection || null,
    reusableArtifactLookup: decision.reusableArtifactLookup || null,
    reusableArtifactsFound: decision.reusableArtifactsFound || 0,
    reuseDecision: decision.reuseDecision === true,
    reuseReason: decision.reuseReason || '',
    reusedArtifactIds: Array.isArray(decision.reusedArtifactIds)
      ? decision.reusedArtifactIds
      : [],
    reuseMode: decision.reuseMode || 'none',
    reuseMaterialization: null,
    materializationPlanSource: decision.materializationPlanSource || 'planner',
  })

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    throw new Error(
      executionResult?.error || `La materializacion local de ${phaseId} no termino en OK.`,
    )
  }

  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'))

  return {
    ...fixture,
    manifest,
    lastPhaseDecision: decision,
    lastPhaseExecutionResult: executionResult,
  }
}

async function materializeModuleExpansionOnFixture({
  fixture,
  moduleLabel,
  requestId,
}) {
  const decision = await requestPlannerDecision({
    goal: `Materializar la expansion de modulo de ${moduleLabel} para el proyecto fullstack local de ${fixture.projectLabel}.`,
    context: `moduleId: ${moduleLabel}`,
    workspacePath: fixture.workspacePath,
  })

  if (!decision?.materializationPlan) {
    throw new Error(`No se pudo construir el materializationPlan del modulo ${moduleLabel}.`)
  }

  const task = buildLocalMaterializationTask({
    plan: decision.materializationPlan,
    workspacePath: fixture.workspacePath,
    requestId,
    instruction: decision.instruction || '',
    brainStrategy: decision.strategy || '',
    businessSector: decision.businessSector || '',
    businessSectorLabel: decision.businessSectorLabel || '',
    creativeDirection: decision.creativeDirection || null,
    reusableArtifactLookup: decision.reusableArtifactLookup || null,
    reusableArtifactsFound: decision.reusableArtifactsFound || 0,
    reuseDecision: decision.reuseDecision === true,
    reuseReason: decision.reuseReason || '',
    reusedArtifactIds: Array.isArray(decision.reusedArtifactIds)
      ? decision.reusedArtifactIds
      : [],
    reuseMode: decision.reuseMode || 'none',
    reuseMaterialization: null,
    materializationPlanSource: decision.materializationPlanSource || 'planner',
  })

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    throw new Error(
      executionResult?.error ||
        `La materializacion local del modulo ${moduleLabel} no termino en OK.`,
    )
  }

  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'))

  return {
    ...fixture,
    manifest,
    lastModuleDecision: decision,
    lastModuleExecutionResult: executionResult,
  }
}

async function buildModuleExpansionReadyFixture(workspaceName) {
  let fixture = await buildFullstackFixture({
    workspaceName,
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    projectLabel: veterinaryGoalCase.projectLabel,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: `${workspaceName}-frontend`,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: `${workspaceName}-backend`,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: `${workspaceName}-database`,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: `${workspaceName}-validation`,
  })
  return fixture
}

function buildContinuationScenarioManifest(baseManifest, options = {}) {
  const manifest = cloneJson(baseManifest || {})
  const existingPhaseMap = new Map(
    (Array.isArray(manifest.phases) ? manifest.phases : []).map((entry) => [
      String(entry?.id || '').trim(),
      entry,
    ]),
  )
  const phaseStatuses =
    options.phaseStatuses && typeof options.phaseStatuses === 'object'
      ? options.phaseStatuses
      : {}

  manifest.version = Number.isFinite(manifest.version) ? manifest.version : 1
  manifest.projectType = 'fullstack-local'
  manifest.deliveryLevel = 'fullstack-local'

  if (options.includePhases === false) {
    delete manifest.phases
  } else {
    const declaredPhaseIds = summarizeUniqueStrings(
      [...continuationBasePhaseIds, ...Object.keys(phaseStatuses)],
      24,
    )
    manifest.phases = declaredPhaseIds
      .map((phaseId) => {
        const existingEntry = existingPhaseMap.get(phaseId) || {}
        const status =
          typeof phaseStatuses[phaseId] === 'string'
            ? phaseStatuses[phaseId]
            : String(existingEntry?.status || '').trim()

        if (!status) {
          return null
        }

        return {
          ...existingEntry,
          id: phaseId,
          status,
          createdAt: existingEntry?.createdAt || 'scenario-manifest',
          files: summarizeUniqueStrings(existingEntry?.files, 24),
        }
      })
      .filter(Boolean)
  }

  if (options.modulesMode === 'remove') {
    delete manifest.modules
  } else if (options.modulesMode === 'replace') {
    manifest.modules = Array.isArray(options.modules)
      ? options.modules.map((entry) => ({
          id: String(entry?.id || '').trim(),
          name: String(entry?.name || entry?.id || '').trim(),
          status: String(entry?.status || '').trim(),
          addedAt: String(entry?.addedAt || 'scenario-manifest').trim(),
          layers: summarizeUniqueStrings(entry?.layers, 16),
          files: summarizeUniqueStrings(entry?.files, 24),
        }))
      : []
  }

  if (Object.prototype.hasOwnProperty.call(options, 'nextRecommendedPhase')) {
    if (options.nextRecommendedPhase) {
      manifest.nextRecommendedPhase = String(options.nextRecommendedPhase).trim()
    } else {
      delete manifest.nextRecommendedPhase
    }
  }

  delete manifest.nextRecommendedAction
  delete manifest.lastCompletedPhase
  delete manifest.availableActions
  delete manifest.blockedActions
  delete manifest.approvalRequiredActions
  delete manifest.risks
  delete manifest.updatedAt
  delete manifest.history
  delete manifest.readinessLevel
  delete manifest.demoReady
  delete manifest.safeLocalDemoReady
  delete manifest.completedCoreFlow
  delete manifest.lastValidationSummary
  delete manifest.recommendedDemoScript
  delete manifest.warnings
  delete manifest.pendingApprovals
  delete manifest.blockedRuntimeActions
  delete manifest.runtimeReadiness
  delete manifest.realExecutionReadiness

  return manifest
}

function writeFixtureManifest(fixture, manifest) {
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return {
    ...fixture,
    manifest,
  }
}

async function requestReviewExpandDecision(fixture) {
  return requestPlannerDecision({
    goal: `Preparar la fase review-and-expand del proyecto fullstack local de ${fixture.projectLabel}.`,
    context: '',
    workspacePath: fixture.workspacePath,
  })
}

async function requestSensitiveActionDecision(fixture, goal) {
  return requestPlannerDecision({
    goal,
    context: '',
    workspacePath: fixture.workspacePath,
  })
}

function findActionByModule(actions, moduleId) {
  return (Array.isArray(actions) ? actions : []).find(
    (entry) => normalizeIdentifier(entry?.moduleId || entry?.id) === normalizeIdentifier(moduleId),
  )
}

function findOptionById(expansionOptions, optionId) {
  return (Array.isArray(expansionOptions?.options) ? expansionOptions.options : []).find(
    (entry) => normalizeIdentifier(entry?.id) === normalizeIdentifier(optionId),
  )
}

function pushFailure(failures, condition, message) {
  if (!condition) {
    failures.push(message)
  }
}

async function runZeroSystemCase() {
  const failures = []
  const decision = await requestPlannerDecision({
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    workspacePath: path.join(smokeWorkspaceRoot, 'operator-zero-vet'),
  })

  pushFailure(failures, Boolean(decision?.projectBlueprint), 'Debe devolver projectBlueprint.')
  pushFailure(failures, Boolean(decision?.implementationRoadmap), 'Debe devolver implementationRoadmap.')
  pushFailure(failures, Boolean(decision?.scalableDeliveryPlan), 'Debe devolver scalableDeliveryPlan.')
  pushFailure(failures, Boolean(decision?.nextActionPlan), 'Debe devolver nextActionPlan.')
  pushFailure(
    failures,
    decision?.projectReadinessState?.demoReady !== true,
    'Desde cero no debe marcar demoReady.',
  )
  pushFailure(
    failures,
    !decision?.materializationPlan,
    'Desde cero no debe materializar automaticamente.',
  )
  pushFailure(
    failures,
    decision?.nextActionPlan?.targetStrategy === 'materialize-fullstack-local-plan' ||
      normalizeIdentifier(decision?.projectContinuationState?.nextRecommendedPhase) ===
        'frontend-mock-flow',
    'Desde cero debe dejar listo el primer paso seguro: materializar el scaffold fullstack local o recomendar frontend-mock-flow si el proyecto ya existe.',
  )

  return { id: 'operator-zero-system', label: 'Sistema desde cero', failures }
}

async function runFullstackBaseCase() {
  const failures = []
  const fixture = await buildFullstackFixture({
    workspaceName: 'operator-stock-base',
    goal: stockGoalCase.goal,
    context: stockGoalCase.context,
    projectLabel: stockGoalCase.projectLabel,
  })
  const decision = await requestReviewExpandDecision(fixture)

  pushFailure(
    failures,
    fs.existsSync(path.join(fixture.projectRootPath, 'frontend')) &&
      fs.existsSync(path.join(fixture.projectRootPath, 'backend')) &&
      fs.existsSync(path.join(fixture.projectRootPath, 'shared')) &&
      fs.existsSync(path.join(fixture.projectRootPath, 'database')) &&
      fs.existsSync(path.join(fixture.projectRootPath, 'docs')),
    'El scaffold base debe dejar frontend/backend/shared/database/docs.',
  )
  pushFailure(
    failures,
    !fs.existsSync(path.join(fixture.projectRootPath, '.env')),
    'No debe crear .env real.',
  )
  pushFailure(
    failures,
    !fs.existsSync(path.join(fixture.projectRootPath, 'node_modules')),
    'No debe crear node_modules.',
  )
  pushFailure(
    failures,
    decision?.projectReadinessState?.demoReady !== true,
    'El scaffold inicial no debe marcar demoReady.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.projectContinuationState?.nextRecommendedPhase) ===
      'frontend-mock-flow',
    'Despues del scaffold debe recomendar frontend-mock-flow.',
  )

  return { id: 'operator-fullstack-base', label: 'Base fullstack local', failures }
}

async function runPhaseRecommendationCase({ id, label, phaseStatuses, expectedNextPhase, includePhases = true }) {
  const failures = []
  let fixture = await buildFullstackFixture({
    workspaceName: `operator-${id}`,
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    projectLabel: veterinaryGoalCase.projectLabel,
  })
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses,
    includePhases,
    modulesMode: 'remove',
    nextRecommendedPhase: '',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)

  const normalizedRecommendedPhase = normalizeIdentifier(
    decision?.projectContinuationState?.nextRecommendedPhase,
  )
  const matchesExpectedPhase =
    normalizedRecommendedPhase === normalizeIdentifier(expectedNextPhase)
  const safelyAdvancedAfterReviewExpand =
    normalizeIdentifier(expectedNextPhase) === 'review-and-expand' &&
    (normalizeIdentifier(decision?.projectContinuationState?.projectStatus) ===
      'safe-module-expansion-ready' ||
      (Array.isArray(decision?.projectContinuationState?.availableSafeActions) &&
        decision.projectContinuationState.availableSafeActions.length > 0))

  pushFailure(
    failures,
    matchesExpectedPhase || safelyAdvancedAfterReviewExpand,
    `Debe recomendar ${expectedNextPhase}.`,
  )

  return { id, label, failures }
}

async function runSafeModuleCase(moduleId) {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture(`operator-module-${moduleId}`)
  const prepareDecision = await requestPlannerDecision({
    goal: `Preparar una expansion de modulo de ${moduleId} para el proyecto fullstack local de ${fixture.projectLabel}.`,
    context: '',
    workspacePath: fixture.workspacePath,
  })

  pushFailure(
    failures,
    prepareDecision?.strategy === 'prepare-module-expansion-plan',
    `Preparar ${moduleId} debe usar prepare-module-expansion-plan.`,
  )
  pushFailure(
    failures,
    prepareDecision?.moduleExpansionPlan?.safeToMaterialize === true,
    `${moduleId} debe quedar marcado como materializable seguro al preparar.`,
  )

  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel: moduleId,
    requestId: `operator-materialize-${moduleId}`,
  })
  const reviewDecision = await requestReviewExpandDecision(fixture)
  const option = findOptionById(reviewDecision?.expansionOptions, moduleId)

  pushFailure(
    failures,
    normalizeIdentifier(
      (Array.isArray(fixture.manifest?.modules) ? fixture.manifest.modules : []).find(
        (entry) => normalizeIdentifier(entry?.id || entry?.name) === normalizeIdentifier(moduleId),
      )?.status,
    ) === 'done',
    `${moduleId} debe quedar en done dentro del manifest.`,
  )
  pushFailure(
    failures,
    !option || option.safeToMaterialize !== true,
    `${moduleId} no debe seguir apareciendo como nuevo materializable despues de agregarse.`,
  )

  return {
    id: `operator-safe-module-${moduleId}`,
    label: `Modulo seguro ${moduleId}`,
    failures,
  }
}

async function runModuleStatusCase() {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture('operator-module-status')
  let manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses: {
      'frontend-mock-flow': 'done',
      'backend-contracts': 'done',
      'database-design': 'done',
      'local-validation': 'done',
      'review-and-expand': 'available',
    },
    modulesMode: 'replace',
    modules: [
      { id: 'reports', name: 'Reportes', status: 'partial', addedAt: 'scenario-manifest' },
      { id: 'inventory', name: 'Inventario', status: 'blocked', addedAt: 'scenario-manifest' },
      { id: 'notifications', name: 'Notifications', status: 'done', addedAt: 'scenario-manifest' },
    ],
    nextRecommendedPhase: 'review-and-expand',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const reportsAction = findActionByModule(
    decision?.projectContinuationState?.availablePlanningActions,
    'reports',
  )
  const inventoryAction = findActionByModule(
    decision?.projectContinuationState?.blockedActions,
    'inventory',
  )
  const notificationsOption = findOptionById(decision?.expansionOptions, 'notifications')

  pushFailure(
    failures,
    Boolean(reportsAction),
    'Un modulo partial debe recomendar revisar/completar, no duplicar.',
  )
  pushFailure(
    failures,
    Boolean(inventoryAction),
    'Un modulo blocked debe seguir bloqueado en continuidad.',
  )
  pushFailure(
    failures,
    !notificationsOption || notificationsOption.safeToMaterialize !== true,
    'Un modulo done no debe reaparecer como materializable seguro.',
  )

  const unknownDecision = await requestPlannerDecision({
    goal: `Materializar la expansion de modulo de laboratorio para el proyecto fullstack local de ${fixture.projectLabel}.`,
    context: '',
    workspacePath: fixture.workspacePath,
  })
  pushFailure(
    failures,
    !unknownDecision?.materializationPlan,
    'Un modulo desconocido no debe devolver materializationPlan.',
  )
  pushFailure(
    failures,
    unknownDecision?.executionMode === 'planner-only',
    'Un modulo desconocido debe quedar en planner-only.',
  )

  return {
    id: 'operator-module-status',
    label: 'Modulos duplicados, partial, blocked y desconocidos',
    failures,
  }
}

async function runSensitivePreviewCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('operator-sensitive-preview')
  const cases = [
    {
      goal: 'Preparar un preview de npm install para el proyecto fullstack local de turnos medicos.',
      approvalType: 'npm-install',
    },
    {
      goal: 'Preparar un preview de dev server para el proyecto fullstack local de turnos medicos.',
      approvalType: 'dev-server',
    },
    {
      goal: 'Preparar un plan de base real para el proyecto fullstack local de turnos medicos.',
      approvalType: 'db-create',
    },
    {
      goal: 'Preparar un preview de migraciones reales para el proyecto fullstack local de turnos medicos.',
      approvalType: 'db-migrate',
    },
    {
      goal: 'Preparar un preview de seeds reales para el proyecto fullstack local de turnos medicos.',
      approvalType: 'db-seed',
    },
    {
      goal: 'Preparar un preview de Dockerfile para el proyecto fullstack local de turnos medicos.',
      approvalType: 'dockerfile',
    },
    {
      goal: 'Preparar un preview de docker-compose para el proyecto fullstack local de turnos medicos.',
      approvalType: 'docker-compose',
    },
    {
      goal: 'Preparar un plan de deploy futuro para el proyecto fullstack local de turnos medicos.',
      approvalType: 'deploy',
    },
    {
      goal: 'Preparar un plan de auth real para el proyecto fullstack local de turnos medicos.',
      approvalType: 'auth-real',
    },
    {
      goal: 'Preparar un plan de pagos reales para el proyecto fullstack local de turnos medicos.',
      approvalType: 'payments-real',
    },
    {
      goal: 'Preparar un plan de integracion externa para el proyecto fullstack local de turnos medicos.',
      approvalType: 'external-integration',
    },
    {
      goal: 'Preparar un plan de secretos y .env para el proyecto fullstack local de turnos medicos.',
      approvalType: 'secrets-env',
    },
    {
      goal: 'Preparar un plan de GitHub remoto para el proyecto fullstack local de turnos medicos.',
      approvalType: 'github-remote-write',
    },
  ]

  for (const previewCase of cases) {
    const decision = await requestSensitiveActionDecision(fixture, previewCase.goal)
    pushFailure(
      failures,
      decision?.strategy === 'prepare-continuation-action-plan',
      `La accion sensible ${previewCase.approvalType} debe usar prepare-continuation-action-plan.`,
    )
    pushFailure(
      failures,
      decision?.executionMode === 'planner-only',
      `La accion sensible ${previewCase.approvalType} debe quedar en planner-only.`,
    )
    pushFailure(
      failures,
      !decision?.materializationPlan,
      `La accion sensible ${previewCase.approvalType} no debe devolver materializationPlan.`,
    )
    pushFailure(
      failures,
      !decision?.executionScope,
      `La accion sensible ${previewCase.approvalType} no debe devolver executionScope ejecutable.`,
    )
    pushFailure(
      failures,
      normalizeIdentifier(decision?.approvalRequestPlan?.approvalType) ===
        normalizeIdentifier(previewCase.approvalType),
      `approvalRequestPlan debe reflejar ${previewCase.approvalType}.`,
    )
    pushFailure(
      failures,
      Array.isArray(decision?.runtimeApprovalState?.commandsPreview),
      `runtimeApprovalState debe incluir commandsPreview para ${previewCase.approvalType}.`,
    )
    pushFailure(
      failures,
      typeof decision?.runtimeApprovalState?.notExecutedDisclaimer === 'string',
      `runtimeApprovalState debe incluir notExecutedDisclaimer para ${previewCase.approvalType}.`,
    )
  }

  pushFailure(
    failures,
    !fs.existsSync(path.join(fixture.projectRootPath, '.env')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'Dockerfile')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'docker-compose.yml')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'node_modules')),
    'El preview sensible no debe crear .env, Dockerfile, docker-compose ni node_modules.',
  )

  return {
    id: 'operator-sensitive-preview',
    label: 'Runtime approval preview sin ejecucion real',
    failures,
  }
}

async function runFinalReadinessCase() {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture('operator-final-readiness')
  for (const moduleId of ['notifications', 'reports', 'inventory']) {
    fixture = await materializeModuleExpansionOnFixture({
      fixture,
      moduleLabel: moduleId,
      requestId: `operator-final-${moduleId}`,
    })
  }

  const reviewDecision = await requestReviewExpandDecision(fixture)
  const runtimeDecision = await requestSensitiveActionDecision(
    fixture,
    'Preparar un plan de runtime local para el proyecto fullstack local de turnos medicos.',
  )

  pushFailure(
    failures,
    reviewDecision?.projectReadinessState?.demoReady === true &&
      reviewDecision?.projectReadinessState?.safeLocalDemoReady === true,
    'Con base completa y modulos seguros debe marcar demo local segura.',
  )
  pushFailure(
    failures,
    runtimeDecision?.projectReadinessState?.realExecutionReady === false,
    'El salto a runtime real debe seguir en false.',
  )
  pushFailure(
    failures,
    Array.isArray(runtimeDecision?.projectReadinessState?.approvalRequiredAreas) &&
      runtimeDecision.projectReadinessState.approvalRequiredAreas.length > 0,
    'approvalRequiredAreas debe reflejar el salto a runtime real.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectReadinessState?.recommendedDemoScript) &&
      reviewDecision.projectReadinessState.recommendedDemoScript.length > 0,
    'recommendedDemoScript debe estar presente para la demo final.',
  )

  return {
    id: 'operator-final-readiness',
    label: 'Readiness final de demo',
    failures,
  }
}

async function runUiContractSanityCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('operator-ui-contract')
  const reviewDecision = await requestReviewExpandDecision(fixture)
  const sensitiveDecision = await requestSensitiveActionDecision(
    fixture,
    'Preparar un plan de runtime local para el proyecto fullstack local de turnos medicos.',
  )

  pushFailure(
    failures,
    Boolean(reviewDecision?.projectContinuationState),
    'La UI debe poder recibir projectContinuationState.',
  )
  pushFailure(
    failures,
    Boolean(reviewDecision?.projectReadinessState),
    'La UI debe poder recibir projectReadinessState.',
  )
  pushFailure(
    failures,
    Boolean(sensitiveDecision?.runtimeApprovalState),
    'La UI debe poder recibir runtimeApprovalState.',
  )
  pushFailure(
    failures,
    Boolean(sensitiveDecision?.approvalRequestPlan),
    'La UI debe poder recibir approvalRequestPlan.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.expansionOptions?.options),
    'La UI debe poder recibir expansionOptions serializable.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.localProjectManifest?.modules) ||
      Array.isArray(reviewDecision?.projectContinuationState?.modulesAvailable) ||
      Array.isArray(reviewDecision?.projectContinuationState?.modulesDone) ||
      Array.isArray(reviewDecision?.projectContinuationState?.modulesBlocked),
    'La UI debe poder recibir módulos serializables desde manifest o continuidad.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.availableSafeActions),
    'La UI debe poder recibir availableSafeActions serializable.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.blockedActions),
    'La UI debe poder recibir blockedActions serializable.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.approvalRequiredActions),
    'La UI debe poder recibir approvalRequiredActions serializable.',
  )

  return {
    id: 'operator-ui-contract',
    label: 'Contrato serializable para UI de operador',
    failures,
  }
}

async function runUiHelperSanityCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')

  pushFailure(
    failures,
    /const summarizeUniqueStrings\s*=\s*\(/.test(appSource),
    'App.tsx debe definir summarizeUniqueStrings para evitar crashes del renderer en continuidad.',
  )
  pushFailure(
    failures,
    /function ProjectContinuityCenterCard\(/.test(appSource),
    'App.tsx debe seguir exponiendo ProjectContinuityCenterCard para el flujo de continuidad.',
  )
  pushFailure(
    failures,
    /summarizeUniqueStrings\(/.test(appSource),
    'ProjectContinuityCenterCard debe seguir pudiendo resumir listas visibles sin depender de helpers faltantes.',
  )

  return {
    id: 'operator-ui-helper-sanity',
    label: 'Helpers criticos de continuidad definidos en UI',
    failures,
  }
}

async function main() {
  ensureCleanDirectory(smokeWorkspaceRoot)
  try {
    const results = []
    results.push(await runZeroSystemCase())
    results.push(await runFullstackBaseCase())
    results.push(
      await runPhaseRecommendationCase({
        id: 'operator-no-phases',
        label: 'Sin fases recomienda frontend-mock-flow',
        phaseStatuses: {},
        expectedNextPhase: 'frontend-mock-flow',
        includePhases: false,
      }),
    )
    results.push(
      await runPhaseRecommendationCase({
        id: 'operator-frontend-done',
        label: 'Frontend done recomienda backend-contracts',
        phaseStatuses: {
          'frontend-mock-flow': 'done',
          'backend-contracts': 'available',
          'database-design': 'pending',
          'local-validation': 'pending',
          'review-and-expand': 'pending',
        },
        expectedNextPhase: 'backend-contracts',
      }),
    )
    results.push(
      await runPhaseRecommendationCase({
        id: 'operator-backend-done',
        label: 'Frontend y backend done recomiendan database-design',
        phaseStatuses: {
          'frontend-mock-flow': 'done',
          'backend-contracts': 'done',
          'database-design': 'available',
          'local-validation': 'pending',
          'review-and-expand': 'pending',
        },
        expectedNextPhase: 'database-design',
      }),
    )
    results.push(
      await runPhaseRecommendationCase({
        id: 'operator-database-done',
        label: 'Frontend backend database done recomiendan local-validation',
        phaseStatuses: {
          'frontend-mock-flow': 'done',
          'backend-contracts': 'done',
          'database-design': 'done',
          'local-validation': 'available',
          'review-and-expand': 'pending',
        },
        expectedNextPhase: 'local-validation',
      }),
    )
    results.push(
      await runPhaseRecommendationCase({
        id: 'operator-base-complete',
        label: 'Base completa recomienda review-and-expand',
        phaseStatuses: {
          'frontend-mock-flow': 'done',
          'backend-contracts': 'done',
          'database-design': 'done',
          'local-validation': 'done',
          'review-and-expand': 'available',
        },
        expectedNextPhase: 'review-and-expand',
      }),
    )
    for (const moduleId of ['notifications', 'reports', 'inventory']) {
      results.push(await runSafeModuleCase(moduleId))
    }
    results.push(await runModuleStatusCase())
    results.push(await runSensitivePreviewCase())
    results.push(await runFinalReadinessCase())
    results.push(await runUiContractSanityCase())
    results.push(await runUiHelperSanityCase())

    const failedResults = results.filter((result) => result.failures.length > 0)

    if (failedResults.length > 0) {
      console.error('checks de operator e2e fallidos:')
      for (const result of failedResults) {
        console.error(`- ${result.id} (${result.label})`)
        for (const failure of result.failures) {
          console.error(`  - ${failure}`)
        }
      }
      process.exitCode = 1
      return
    }

    console.log(`OK. ${results.length}/${results.length} checks de operator e2e pasaron.`)
  } finally {
    cleanupSmokeWorkspaceRoot()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
