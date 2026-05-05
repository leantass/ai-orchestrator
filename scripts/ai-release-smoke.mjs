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
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  buildLocalMaterializationTask,
  runLocalDeterministicTask,
} = require(
  path.join(repoRoot, 'electron', 'local-deterministic-executor.cjs'),
)

const smokeWorkspaceRoot = path.join(repoRoot, '.tmp', 'ai-release-smoke')
const continuationBasePhaseIds = [
  'fullstack-local-scaffold',
  'frontend-mock-flow',
  'backend-contracts',
  'database-design',
  'local-validation',
  'review-and-expand',
]
const requiredPlannerFunctions = ['buildLocalStrategicBrainDecision']
const medicalGoalCase = {
  goal:
    'Hacer un sistema fullstack local para turnos medicos con frontend, backend y base de datos local.',
  context: '',
  projectLabel: 'turnos medicos',
}
const veterinaryGoalCase = {
  goal:
    'Hacer un sistema fullstack local para turnos de veterinaria con frontend, backend y base de datos local.',
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

function summarizeUniqueStrings(entries, limit = 12) {
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
      `[ai-release-smoke] No se encontro el anchor inicial de ${name}: ${JSON.stringify(startMarker)}.`,
    )
  }

  const end = mainSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(
      `[ai-release-smoke] No se encontro el anchor final de ${name}: ${JSON.stringify(endMarker)}.`,
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
      filename: 'ai-release-smoke-harness.cjs',
    })
  } catch (error) {
    throw new Error(
      `[ai-release-smoke] No se pudo ejecutar el harness del planner: ${error.message}`,
    )
  }

  const exported = sandbox.module.exports || {}
  const missing = requiredPlannerFunctions.filter((name) => typeof exported[name] !== 'function')
  if (missing.length > 0) {
    throw new Error(
      `[ai-release-smoke] Faltan funciones requeridas en el harness: ${missing.join(', ')}.`,
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
      reason: 'release-smoke',
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

  if (!task) {
    throw new Error(`No se pudo construir la tarea local deterministica de ${phaseId}.`)
  }

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

  if (!task) {
    throw new Error(
      `No se pudo construir la tarea local deterministica del modulo ${moduleLabel}.`,
    )
  }

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
    goal: medicalGoalCase.goal,
    context: medicalGoalCase.context,
    projectLabel: medicalGoalCase.projectLabel,
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

function getActionIds(actions) {
  return summarizeUniqueStrings(
    (Array.isArray(actions) ? actions : []).map((entry) => String(entry?.id || '').trim()),
    40,
  )
}

function getOptionIds(expansionOptions) {
  return summarizeUniqueStrings(
    (Array.isArray(expansionOptions?.options) ? expansionOptions.options : []).map((entry) =>
      String(entry?.id || '').trim(),
    ),
    40,
  )
}

function getPhaseStatus(manifest, phaseId) {
  const phaseEntry = (Array.isArray(manifest?.phases) ? manifest.phases : []).find(
    (entry) => String(entry?.id || '').trim() === phaseId,
  )
  return String(phaseEntry?.status || '').trim().toLocaleLowerCase()
}

function getModuleStatus(manifest, moduleId) {
  const normalizedModuleId = normalizeIdentifier(moduleId)
  const moduleEntry = (Array.isArray(manifest?.modules) ? manifest.modules : []).find(
    (entry) => normalizeIdentifier(entry?.id || entry?.name) === normalizedModuleId,
  )
  return String(moduleEntry?.status || '').trim().toLocaleLowerCase()
}

function findActionById(actions, actionId) {
  return (Array.isArray(actions) ? actions : []).find(
    (entry) => normalizeIdentifier(entry?.id) === normalizeIdentifier(actionId),
  )
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

async function runPlanningFromZeroVetCase() {
  const failures = []
  const decision = await requestPlannerDecision({
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    workspacePath: path.join(smokeWorkspaceRoot, 'planning-veterinaria'),
  })
  const readiness = decision?.projectReadinessState || null

  pushFailure(failures, Boolean(decision?.scalableDeliveryPlan), 'Debe devolver scalableDeliveryPlan.')
  pushFailure(failures, Boolean(decision?.projectBlueprint), 'Debe devolver projectBlueprint.')
  pushFailure(
    failures,
    Boolean(decision?.implementationRoadmap),
    'Debe devolver implementationRoadmap.',
  )
  pushFailure(failures, Boolean(decision?.nextActionPlan), 'Debe devolver nextActionPlan.')
  pushFailure(failures, Boolean(readiness), 'Debe devolver projectReadinessState.')
  pushFailure(failures, readiness?.demoReady !== true, 'No debe marcar demoReady desde cero.')
  pushFailure(
    failures,
    readiness?.safeLocalDemoReady !== true,
    'No debe marcar safeLocalDemoReady desde cero.',
  )

  return {
    id: 'planning-zero-veterinaria',
    label: 'Planificacion desde cero para veterinaria',
    failures,
  }
}

async function runStockScaffoldCase() {
  const failures = []
  const fixture = await buildFullstackFixture({
    workspaceName: 'release-stock-scaffold',
    goal: stockGoalCase.goal,
    context: stockGoalCase.context,
    projectLabel: stockGoalCase.projectLabel,
  })
  const decision = await requestReviewExpandDecision(fixture)
  const readiness = decision?.projectReadinessState || null
  const continuation = decision?.projectContinuationState || null

  pushFailure(failures, fs.existsSync(fixture.manifestPath), 'Debe existir jefe-project.json.')
  pushFailure(
    failures,
    fs.existsSync(path.join(fixture.projectRootPath, 'frontend')),
    'Debe existir frontend en el scaffold fullstack-local.',
  )
  pushFailure(
    failures,
    fs.existsSync(path.join(fixture.projectRootPath, 'backend')),
    'Debe existir backend en el scaffold fullstack-local.',
  )
  pushFailure(
    failures,
    readiness?.demoReady !== true,
    'El scaffold inicial no debe marcar demoReady.',
  )
  pushFailure(
    failures,
    continuation?.nextRecommendedPhase === 'frontend-mock-flow',
    'Despues del scaffold debe recomendar frontend-mock-flow.',
  )

  return {
    id: 'stock-scaffold',
    label: 'Scaffold fullstack local para stock',
    failures,
  }
}

async function runPhaseRecommendationCase({ id, label, phaseStatuses, expectedNextPhase, includePhases = true, modulesMode }) {
  const failures = []
  let fixture = await buildFullstackFixture({
    workspaceName: `release-${id}`,
    goal: medicalGoalCase.goal,
    context: medicalGoalCase.context,
    projectLabel: medicalGoalCase.projectLabel,
  })
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses,
    includePhases,
    modulesMode,
    nextRecommendedPhase: '',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const continuation = decision?.projectContinuationState || null

  pushFailure(failures, Boolean(continuation), 'Debe devolver projectContinuationState.')
  pushFailure(
    failures,
    continuation?.nextRecommendedPhase === expectedNextPhase,
    `Debe recomendar ${expectedNextPhase}.`,
  )

  return { id, label, failures }
}

async function runBaseCompleteCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('release-base-complete')
  const decision = await requestReviewExpandDecision(fixture)
  const continuation = decision?.projectContinuationState || null
  const readiness = decision?.projectReadinessState || null
  const optionIds = getOptionIds(decision?.expansionOptions)

  pushFailure(
    failures,
    continuation?.nextRecommendedPhase === 'review-and-expand',
    'Con la base completa debe recomendar review-and-expand.',
  )
  pushFailure(
    failures,
    optionIds.includes('notifications') && optionIds.includes('reports') && optionIds.includes('inventory'),
    'Con la base completa debe sugerir notifications, reports e inventory.',
  )
  pushFailure(
    failures,
    readiness?.demoReady === true && readiness?.safeLocalDemoReady === true,
    'Con la base completa debe marcar demo local segura.',
  )

  return {
    id: 'base-complete',
    label: 'Base completa recomienda review-and-expand',
    failures,
  }
}

async function runNotificationsDoneCase() {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture('release-notifications-done')
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel: 'notifications',
    requestId: 'release-notifications',
  })
  const decision = await requestReviewExpandDecision(fixture)
  const optionIds = getOptionIds(decision?.expansionOptions)

  pushFailure(
    failures,
    !optionIds.includes('notifications'),
    'No debe sugerir notifications otra vez si ya esta done.',
  )
  pushFailure(
    failures,
    optionIds.includes('reports') || optionIds.includes('inventory'),
    'Debe sugerir reports o inventory si notifications ya existe.',
  )

  return {
    id: 'notifications-done',
    label: 'Notifications done no se duplica',
    failures,
  }
}

async function runAllSafeModulesDoneCase() {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture('release-all-safe-done')
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel: 'notifications',
    requestId: 'release-safe-notifications',
  })
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel: 'reports',
    requestId: 'release-safe-reports',
  })
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel: 'inventory',
    requestId: 'release-safe-inventory',
  })
  const decision = await requestReviewExpandDecision(fixture)
  const continuation = decision?.projectContinuationState || null
  const optionIds = getOptionIds(decision?.expansionOptions)

  pushFailure(
    failures,
    !optionIds.includes('notifications') &&
      !optionIds.includes('reports') &&
      !optionIds.includes('inventory'),
    'No debe sugerir modulos seguros iniciales ya hechos.',
  )
  pushFailure(
    failures,
    Array.isArray(continuation?.availablePlanningActions) &&
      continuation.availablePlanningActions.length > 0,
    'Cuando ya estan los modulos seguros, debe sugerir mejoras revisables.',
  )

  return {
    id: 'all-safe-modules-done',
    label: 'Todos los modulos seguros iniciales completos',
    failures,
  }
}

async function runSensitiveActionCase({
  id,
  label,
  goal,
  expectedActionId,
  expectedApprovalType,
  expectBlocked = false,
}) {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture(`release-${id}`)
  const decision = await requestSensitiveActionDecision(fixture, goal)
  const approvalPacket = decision?.approvalRequestPlan || null
  const runtimeApproval = decision?.runtimeApprovalState || null
  const continuationAction = decision?.continuationActionPlan || null
  const readiness = decision?.projectReadinessState || null
  const manifest = decision?.localProjectManifest || null

  pushFailure(
    failures,
    decision?.strategy === 'prepare-continuation-action-plan',
    'Debe usar prepare-continuation-action-plan.',
  )
  pushFailure(
    failures,
    decision?.executionMode === 'planner-only',
    'Debe quedar en planner-only.',
  )
  pushFailure(
    failures,
    !decision?.materializationPlan,
    'No debe devolver materializationPlan para una accion sensible.',
  )
  pushFailure(
    failures,
    Boolean(approvalPacket),
    'Debe devolver approvalRequestPlan.',
  )
  pushFailure(
    failures,
    Boolean(runtimeApproval),
    'Debe devolver runtimeApprovalState.',
  )
  pushFailure(
    failures,
    Boolean(continuationAction),
    'Debe devolver continuationActionPlan.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(continuationAction?.id) === normalizeIdentifier(expectedActionId),
    `continuationActionPlan.id deberia ser ${expectedActionId}.`,
  )
  pushFailure(
    failures,
    normalizeIdentifier(approvalPacket?.approvalType) === normalizeIdentifier(expectedApprovalType),
    `approvalRequestPlan.approvalType deberia ser ${expectedApprovalType}.`,
  )
  pushFailure(
    failures,
    normalizeIdentifier(runtimeApproval?.actionId) === normalizeIdentifier(expectedActionId),
    `runtimeApprovalState.actionId deberia ser ${expectedActionId}.`,
  )
  pushFailure(
    failures,
    normalizeIdentifier(runtimeApproval?.status) ===
      normalizeIdentifier(expectBlocked ? 'blocked' : 'preview'),
    `runtimeApprovalState.status deberia ser ${expectBlocked ? 'blocked' : 'preview'}.`,
  )
  pushFailure(
    failures,
    Array.isArray(approvalPacket?.willNotTouch) && approvalPacket.willNotTouch.length > 0,
    'approvalRequestPlan debe aclarar que no se ejecuto nada real.',
  )
  pushFailure(
    failures,
    Array.isArray(runtimeApproval?.commandsPreview) &&
      runtimeApproval.commandsPreview.length > 0,
    'runtimeApprovalState debe incluir commandsPreview.',
  )
  pushFailure(
    failures,
    typeof runtimeApproval?.approvalPhrase === 'string' &&
      runtimeApproval.approvalPhrase.trim().length > 0,
    'runtimeApprovalState debe incluir approvalPhrase.',
  )
  pushFailure(
    failures,
    typeof runtimeApproval?.notExecutedDisclaimer === 'string' &&
      runtimeApproval.notExecutedDisclaimer.toLocaleLowerCase().includes('no se ejecut'),
    'runtimeApprovalState debe incluir notExecutedDisclaimer.',
  )
  pushFailure(
    failures,
    runtimeApproval?.validationPlan && typeof runtimeApproval.validationPlan === 'object',
    'runtimeApprovalState debe incluir validationPlan.',
  )
  if (expectBlocked) {
    pushFailure(
      failures,
      continuationAction?.blocked === true || approvalPacket?.blockedByDefault === true,
      'La accion deberia quedar bloqueada por defecto.',
    )
    pushFailure(
      failures,
      Array.isArray(manifest?.blockedRuntimeActions) &&
        manifest.blockedRuntimeActions.length > 0,
      'El manifest deberia registrar blockedRuntimeActions.',
    )
    pushFailure(
      failures,
      Array.isArray(readiness?.blockedAreas) && readiness.blockedAreas.length > 0,
      'Readiness deberia reflejar el bloqueo sensible.',
    )
  } else {
    pushFailure(
      failures,
      continuationAction?.requiresApproval === true,
      'La accion deberia requerir aprobacion.',
    )
    pushFailure(
      failures,
      Array.isArray(manifest?.pendingApprovals) && manifest.pendingApprovals.length > 0,
      'El manifest deberia registrar pendingApprovals.',
    )
    pushFailure(
      failures,
      normalizeIdentifier(manifest?.runtimeReadiness) === 'approval-preview',
      'El manifest deberia marcar runtimeReadiness=approval-preview.',
    )
    pushFailure(
      failures,
      Array.isArray(readiness?.approvalRequiredAreas) &&
        readiness.approvalRequiredAreas.length > 0,
      'Readiness deberia reflejar approvalRequiredAreas.',
    )
  }

  return { id, label, failures }
}

async function runLegacyManifestCase() {
  const failures = []
  let fixture = await buildFullstackFixture({
    workspaceName: 'release-legacy-manifest',
    goal: medicalGoalCase.goal,
    context: medicalGoalCase.context,
    projectLabel: medicalGoalCase.projectLabel,
  })
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses: {},
    modulesMode: 'remove',
    nextRecommendedPhase: '',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const continuation = decision?.projectContinuationState || null

  pushFailure(
    failures,
    Boolean(continuation),
    'El manifest viejo no deberia romper projectContinuationState.',
  )
  pushFailure(
    failures,
    continuation?.nextRecommendedPhase === 'frontend-mock-flow',
    'El manifest viejo deberia normalizarse y recomendar frontend-mock-flow.',
  )

  return { id: 'legacy-manifest', label: 'Manifest viejo se normaliza', failures }
}

async function runIncompleteManifestCase() {
  const failures = []
  let fixture = await buildFullstackFixture({
    workspaceName: 'release-incomplete-manifest',
    goal: medicalGoalCase.goal,
    context: medicalGoalCase.context,
    projectLabel: medicalGoalCase.projectLabel,
  })
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    includePhases: false,
    modulesMode: 'remove',
    nextRecommendedPhase: '',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const readiness = decision?.projectReadinessState || null
  const continuation = decision?.projectContinuationState || null

  pushFailure(
    failures,
    Boolean(readiness),
    'El manifest incompleto no deberia romper projectReadinessState.',
  )
  pushFailure(
    failures,
    continuation?.nextRecommendedPhase === 'frontend-mock-flow',
    'Con manifest incompleto deberia volver a frontend-mock-flow.',
  )

  return { id: 'incomplete-manifest', label: 'Manifest incompleto no rompe', failures }
}

async function runPartialModuleCase() {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture('release-partial-module')
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses: {
      'frontend-mock-flow': 'done',
      'backend-contracts': 'done',
      'database-design': 'done',
      'local-validation': 'done',
      'review-and-expand': 'available',
    },
    modulesMode: 'replace',
    modules: [
      {
        id: 'reports',
        name: 'Reportes',
        status: 'partial',
        addedAt: 'scenario-manifest',
      },
    ],
    nextRecommendedPhase: 'review-and-expand',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const planningAction = findActionByModule(
    decision?.projectContinuationState?.availablePlanningActions,
    'reports',
  )
  const option = findOptionById(decision?.expansionOptions, 'reports')

  pushFailure(
    failures,
    Boolean(planningAction),
    'Un modulo partial deberia recomendar revisar/completar, no duplicar.',
  )
  pushFailure(
    failures,
    option?.safeToMaterialize !== true,
    'Un modulo partial no deberia volver a materializarse directo.',
  )

  return { id: 'partial-module', label: 'Modulo partial se revisa', failures }
}

async function runBlockedModuleCase() {
  const failures = []
  let fixture = await buildModuleExpansionReadyFixture('release-blocked-module')
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses: {
      'frontend-mock-flow': 'done',
      'backend-contracts': 'done',
      'database-design': 'done',
      'local-validation': 'done',
      'review-and-expand': 'available',
    },
    modulesMode: 'replace',
    modules: [
      {
        id: 'inventory',
        name: 'Inventario',
        status: 'blocked',
        addedAt: 'scenario-manifest',
      },
    ],
    nextRecommendedPhase: 'review-and-expand',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const blockedAction = findActionByModule(
    decision?.projectContinuationState?.blockedActions,
    'inventory',
  )
  const option = findOptionById(decision?.expansionOptions, 'inventory')

  pushFailure(
    failures,
    Boolean(blockedAction),
    'Un modulo blocked debe seguir bloqueado en continuidad.',
  )
  pushFailure(
    failures,
    option?.safeToMaterialize !== true,
    'Un modulo blocked no debe figurar como materializable.',
  )

  return { id: 'blocked-module', label: 'Modulo blocked no materializa', failures }
}

async function runDemoReadyCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('release-demo-ready')
  const decision = await requestReviewExpandDecision(fixture)
  const readiness = decision?.projectReadinessState || null

  pushFailure(
    failures,
    readiness?.demoReady === true,
    'Con base completa debe marcar demoReady.',
  )
  pushFailure(
    failures,
    readiness?.safeLocalDemoReady === true,
    'Con base completa debe marcar safeLocalDemoReady.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(readiness?.readinessLevel) === 'demo-ready',
    'El readinessLevel deberia ser demo-ready.',
  )

  return { id: 'demo-ready', label: 'Readiness demo-ready', failures }
}

async function runReadinessBlockedCase() {
  const failures = []
  let fixture = await buildFullstackFixture({
    workspaceName: 'release-readiness-blocked',
    goal: medicalGoalCase.goal,
    context: medicalGoalCase.context,
    projectLabel: medicalGoalCase.projectLabel,
  })
  const manifest = buildContinuationScenarioManifest(fixture.manifest, {
    phaseStatuses: {
      'frontend-mock-flow': 'done',
      'backend-contracts': 'done',
      'database-design': 'done',
      'local-validation': 'blocked',
      'review-and-expand': 'pending',
    },
    nextRecommendedPhase: 'local-validation',
  })
  fixture = writeFixtureManifest(fixture, manifest)
  const decision = await requestReviewExpandDecision(fixture)
  const readiness = decision?.projectReadinessState || null

  pushFailure(
    failures,
    readiness?.demoReady !== true,
    'Con local-validation bloqueada no debe marcar demoReady.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(readiness?.readinessLevel) === 'blocked',
    'Con una fase core bloqueada el readinessLevel deberia ser blocked.',
  )

  return { id: 'readiness-blocked', label: 'Readiness blocked', failures }
}

async function runRuntimePendingReadinessCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('release-runtime-pending')
  const decision = await requestSensitiveActionDecision(
    fixture,
    'Preparar un plan de runtime local para el proyecto fullstack local de turnos medicos.',
  )
  const readiness = decision?.projectReadinessState || null
  const manifest = decision?.localProjectManifest || null

  pushFailure(
    failures,
    readiness?.demoReady === true,
    'La demo local segura deberia seguir lista mientras runtime queda pendiente.',
  )
  pushFailure(
    failures,
    readiness?.realExecutionReady === false,
    'realExecutionReady deberia quedar en false.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(readiness?.runtimeReadiness) === 'approval-preview',
    'runtimeReadiness deberia ser approval-preview.',
  )
  pushFailure(
    failures,
    Array.isArray(readiness?.approvalRequiredAreas) &&
      readiness.approvalRequiredAreas.length > 0,
    'approvalRequiredAreas deberia listar el salto a runtime real.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(manifest?.runtimeReadiness) === 'approval-preview',
    'El manifest deberia persistir runtimeReadiness=approval-preview.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(manifest?.realExecutionReadiness) === 'requires-approval',
    'El manifest deberia persistir realExecutionReadiness=requires-approval.',
  )

  return {
    id: 'runtime-pending-readiness',
    label: 'Demo lista con runtime pendiente de aprobacion',
    failures,
  }
}

async function runApprovalPacketSanityCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('release-approval-packet')
  const decision = await requestSensitiveActionDecision(
    fixture,
    'Preparar un preview de npm install para el proyecto fullstack local de turnos medicos.',
  )
  const runtimeApproval = decision?.runtimeApprovalState || null
  const approvalPacket = decision?.approvalRequestPlan || null

  pushFailure(
    failures,
    typeof runtimeApproval?.approvalPhrase === 'string' &&
      runtimeApproval.approvalPhrase.trim().length > 0,
    'approvalPhrase deberia estar presente.',
  )
  pushFailure(
    failures,
    Array.isArray(runtimeApproval?.commandsPreview) &&
      runtimeApproval.commandsPreview.length > 0,
    'commandsPreview deberia estar presente.',
  )
  pushFailure(
    failures,
    typeof runtimeApproval?.notExecutedDisclaimer === 'string' &&
      runtimeApproval.notExecutedDisclaimer.trim().length > 0,
    'notExecutedDisclaimer deberia estar presente.',
  )
  pushFailure(
    failures,
    runtimeApproval?.validationPlan && typeof runtimeApproval.validationPlan === 'object',
    'validationPlan deberia estar presente.',
  )
  pushFailure(
    failures,
    Array.isArray(approvalPacket?.touches) && approvalPacket.touches.length > 0,
    'approvalRequestPlan deberia seguir siendo util para la UI y mostrar alcance.',
  )

  return {
    id: 'approval-packet-sanity',
    label: 'Approval packet sanity',
    failures,
  }
}

async function runUiContractSanityCase() {
  const failures = []
  const fixture = await buildModuleExpansionReadyFixture('release-ui-contract')
  const reviewDecision = await requestReviewExpandDecision(fixture)
  const sensitiveDecision = await requestSensitiveActionDecision(
    fixture,
    `Preparar un plan de runtime local para el proyecto fullstack local de ${fixture.projectLabel}.`,
  )

  pushFailure(
    failures,
    Boolean(reviewDecision?.projectContinuationState),
    'La UI deberia poder recibir projectContinuationState.',
  )
  pushFailure(
    failures,
    Boolean(reviewDecision?.projectReadinessState),
    'La UI deberia poder recibir projectReadinessState.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.availableSafeActions),
    'La UI deberia recibir availableSafeActions serializable.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.blockedActions),
    'La UI deberia recibir blockedActions serializable.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.approvalRequiredActions),
    'La UI deberia recibir approvalRequiredActions serializable.',
  )
  pushFailure(
    failures,
    Boolean(sensitiveDecision?.approvalRequestPlan),
    'La UI deberia poder recibir approvalRequestPlan.',
  )
  pushFailure(
    failures,
    Boolean(sensitiveDecision?.runtimeApprovalState),
    'La UI deberia poder recibir runtimeApprovalState.',
  )
  pushFailure(
    failures,
    Array.isArray(sensitiveDecision?.runtimeApprovalState?.commandsPreview),
    'La UI deberia recibir commandsPreview serializable.',
  )
  pushFailure(
    failures,
    Array.isArray(sensitiveDecision?.runtimeApprovalState?.filesPreview),
    'La UI deberia recibir filesPreview serializable.',
  )

  return { id: 'ui-contract-sanity', label: 'Contrato serializable para UI', failures }
}

async function main() {
  ensureCleanDirectory(smokeWorkspaceRoot)
  try {
    const results = []
    results.push(await runPlanningFromZeroVetCase())
    results.push(await runStockScaffoldCase())
    results.push(
      await runPhaseRecommendationCase({
        id: 'frontend-done',
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
        id: 'backend-done',
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
        id: 'database-done',
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
    results.push(await runBaseCompleteCase())
    results.push(await runNotificationsDoneCase())
    results.push(await runAllSafeModulesDoneCase())
    results.push(
      await runSensitiveActionCase({
        id: 'npm-install-approval',
        label: 'npm install queda en preview aprobado pendiente',
        goal: 'Preparar un preview de npm install para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-dependency-install-plan',
        expectedApprovalType: 'npm-install',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'runtime-approval',
        label: 'Runtime local requiere aprobacion',
        goal: 'Preparar un plan de runtime local para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-runtime-plan',
        expectedApprovalType: 'runtime-start',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'dev-server-approval',
        label: 'Dev server queda en preview aprobado pendiente',
        goal: 'Preparar un preview de dev server para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-runtime-plan',
        expectedApprovalType: 'dev-server',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'dependency-approval',
        label: 'Instalacion de dependencias requiere aprobacion',
        goal: 'Preparar un plan de instalacion de dependencias para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-dependency-install-plan',
        expectedApprovalType: 'dependency-install',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'db-real-approval',
        label: 'DB real requiere aprobacion',
        goal: 'Preparar un plan de base real para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-db-real-plan',
        expectedApprovalType: 'db-create',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'db-migrate-blocked',
        label: 'Migraciones reales quedan bloqueadas',
        goal: 'Preparar un preview de migraciones reales para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-db-real-plan',
        expectedApprovalType: 'db-migrate',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'db-seed-blocked',
        label: 'Seeds reales quedan bloqueados',
        goal: 'Preparar un preview de seeds reales para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-db-real-plan',
        expectedApprovalType: 'db-seed',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'auth-approval',
        label: 'Auth real requiere aprobacion',
        goal: 'Preparar un plan de auth real para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-auth-plan',
        expectedApprovalType: 'auth-real',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'payments-blocked',
        label: 'Pagos reales quedan bloqueados',
        goal: 'Preparar un plan de pagos reales para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-payments-plan',
        expectedApprovalType: 'payments-real',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'deploy-blocked',
        label: 'Deploy queda bloqueado',
        goal: 'Preparar un plan de deploy futuro para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-deploy-plan',
        expectedApprovalType: 'deploy',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'docker-blocked',
        label: 'Docker queda bloqueado',
        goal: 'Preparar un plan de Docker e infraestructura para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-docker-plan',
        expectedApprovalType: 'docker',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'dockerfile-blocked',
        label: 'Dockerfile queda bloqueado',
        goal: 'Preparar un preview de Dockerfile para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-docker-plan',
        expectedApprovalType: 'dockerfile',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'docker-compose-blocked',
        label: 'docker-compose queda bloqueado',
        goal: 'Preparar un preview de docker-compose para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-docker-plan',
        expectedApprovalType: 'docker-compose',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'integrations-approval',
        label: 'Integraciones externas requieren aprobacion',
        goal: 'Preparar un plan de integracion externa para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-external-integration-plan',
        expectedApprovalType: 'external-integration',
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'secrets-blocked',
        label: 'Secretos y .env quedan bloqueados',
        goal: 'Preparar un plan de secretos y .env para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-secrets-env-plan',
        expectedApprovalType: 'secrets-env',
        expectBlocked: true,
      }),
    )
    results.push(
      await runSensitiveActionCase({
        id: 'github-remote-blocked',
        label: 'GitHub remoto queda bloqueado',
        goal: 'Preparar un plan de GitHub remoto para el proyecto fullstack local de turnos medicos.',
        expectedActionId: 'prepare-github-remote-plan',
        expectedApprovalType: 'github-remote-write',
        expectBlocked: true,
      }),
    )
    results.push(await runLegacyManifestCase())
    results.push(await runIncompleteManifestCase())
    results.push(await runPartialModuleCase())
    results.push(await runBlockedModuleCase())
    results.push(await runDemoReadyCase())
    results.push(await runReadinessBlockedCase())
    results.push(await runRuntimePendingReadinessCase())
    results.push(await runApprovalPacketSanityCase())
    results.push(await runUiContractSanityCase())

    const failedResults = results.filter((result) => result.failures.length > 0)

    if (failedResults.length > 0) {
      console.error('checks de release readiness fallidos:')
      for (const result of failedResults) {
        console.error(`- ${result.id} (${result.label})`)
        for (const failure of result.failures) {
          console.error(`  - ${failure}`)
        }
      }
      process.exitCode = 1
      return
    }

    console.log(`OK. ${results.length}/${results.length} checks de release readiness pasaron.`)
  } finally {
    cleanupSmokeWorkspaceRoot()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
