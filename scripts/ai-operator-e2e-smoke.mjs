import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  buildPlannerApprovalSurfaceViewModel,
  canGenerateContinuationReviewFallbackForUi,
  canPrepareProjectContinuityNextActionForUi,
  derivePlannerMaterializationUiState,
  getProjectContinuityPrimaryActionLabelForUi,
  inspectPreparedFullstackLocalMaterialization,
  resolveProjectContinuityNextRecommendedActionForUi,
} from '../src/planner-ui-state.js'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainFilePath = path.join(repoRoot, 'electron', 'main.cjs')
const appFilePath = path.join(repoRoot, 'src', 'App.tsx')
const plannerUiStateFilePath = path.join(repoRoot, 'src', 'planner-ui-state.js')
const mainSource = fs.readFileSync(mainFilePath, 'utf8')
const {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  buildLocalMaterializationTask,
  runLocalDeterministicTask,
} = require(
  path.join(repoRoot, 'electron', 'local-deterministic-executor.cjs'),
)
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
const {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  deriveRequiredPathGroupsFromContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainCapabilityProfile,
  buildGeneratedDomainMaterializationShadowPlan,
  buildGeneratedDomainContractComparison,
  buildGeneratedDomainContractDiagnostics,
  extractGeneratedDomainContractCandidate,
} = require(path.join(repoRoot, 'electron', 'generated-domain-contract.cjs'))
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

const smokeWorkspaceRoot = path.join(repoRoot, '.tmp', 'ai-operator-e2e-smoke')
const continuationBasePhaseIds = [
  'fullstack-local-scaffold',
  'frontend-mock-flow',
  'backend-contracts',
  'database-design',
  'local-validation',
  'review-and-expand',
]
const requiredPlannerFunctions = [
  'buildLocalStrategicBrainDecision',
  'normalizeOpenAIBrainDecision',
  'shouldBlockWebScaffoldExecutionForFullstackRequest',
  'buildBlockedFullstackWebScaffoldExecutionResponse',
  'inspectFullstackLocalMaterializationContract',
]
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
const sportsGoalCase = {
  goal:
    'Hacer un sistema fullstack local para reservas de canchas con clientes, canchas, reservas, alertas y utileria local.',
  context: '',
  projectLabel: 'reservas de canchas',
}
const ecommerceGoalCase = {
  goal:
    'Hacer un sistema fullstack local para ecommerce de indumentaria con catalogo, clientes, pedidos, reportes y stock local.',
  context: '',
  projectLabel: 'ecommerce de indumentaria',
}
const documentGoalCase = {
  goal:
    'Hacer un sistema fullstack local documental para expedientes, vencimientos, revisiones, responsables y alertas operativas.',
  context: '',
  projectLabel: 'sistema documental',
}
const schoolGoalCase = {
  goal:
    'Hacer un sistema fullstack local escolar con alumnos, familias, cursos, seguimiento academico y reportes locales.',
  context: '',
  projectLabel: 'gestion escolar',
}
const onlineCoursesGoalCase = {
  goal:
    'Crear una primera entrega fullstack local para una plataforma web de cursos online con backend local, base local SQLite, frontend publico, frontend admin, panel de alumno, cursos, categorias, modulos, clases, planes Free Plata y Oro, inscripciones, progreso y pagos mock de Mercado Pago.',
  context: [
    'No landing. No demo solamente visual.',
    'Mercado Pago solo como mock o sandbox local, sin tokens, sin .env y sin llamadas reales.',
    'Sin deploy, sin Docker, sin servicios externos y sin credenciales reales.',
  ].join(' '),
  projectLabel: 'plataforma de cursos online',
}
const realEstateGoalCase = {
  goal:
    'Hacer un sistema fullstack local para inmobiliaria con propiedades, consultas, visitas, corredores y seguimiento comercial.',
  context: '',
  projectLabel: 'inmobiliaria',
}
const securityGoalCase = {
  goal:
    'Hacer un sistema fullstack local de seguridad con accesos, alertas, sensores, incidentes y rondas operativas.',
  context: '',
  projectLabel: 'seguridad y monitoreo',
}
const communityGoalCase = {
  goal:
    'Hacer un sistema fullstack local para comunidad social con grupos, publicaciones, miembros, moderacion y actividad reciente.',
  context: '',
  projectLabel: 'comunidad social',
}
const genericOperationsGoalCase = {
  goal:
    'Hacer un sistema fullstack local para gestion operativa de solicitudes internas, prioridades, actividad y seguimiento de casos.',
  context: '',
  projectLabel: 'gestion operativa generica',
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

function continuationActionMatchesId(action, expectedId) {
  const normalizedExpectedId = normalizeIdentifier(expectedId)
  if (!normalizedExpectedId || !action || typeof action !== 'object') {
    return false
  }

  const candidateValues = [
    action.id,
    action.phaseId,
    action.title,
    action.description,
    action.reason,
  ]

  return candidateValues.some((value) =>
    normalizeIdentifier(value).includes(normalizedExpectedId),
  )
}

function normalizePathForComparison(value) {
  return String(value || '').replace(/\\/g, '/').toLocaleLowerCase()
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

function listRelativeWorkspaceFiles(rootPath) {
  const files = []

  function visit(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const resolvedPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        visit(resolvedPath)
        continue
      }

      files.push(normalizePathForComparison(path.relative(rootPath, resolvedPath)))
    }
  }

  if (fs.existsSync(rootPath)) {
    visit(rootPath)
  }

  return files.sort()
}

function extractOrderedStaticScriptSources(html) {
  return [...String(html || '').matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/gi)].map(
    (match) => String(match[1] || '').trim(),
  )
}

function buildVmRootElement() {
  let innerHtml = ''
  const listeners = {}

  return {
    get innerHTML() {
      return innerHtml
    },
    set innerHTML(value) {
      innerHtml = String(value ?? '')
    },
    addEventListener(eventName, handler) {
      if (typeof eventName !== 'string' || typeof handler !== 'function') {
        return
      }

      if (!Array.isArray(listeners[eventName])) {
        listeners[eventName] = []
      }

      listeners[eventName].push(handler)
    },
    removeEventListener(eventName, handler) {
      if (!Array.isArray(listeners[eventName])) {
        return
      }

      listeners[eventName] = listeners[eventName].filter((entry) => entry !== handler)
    },
    dispatchEvent(event) {
      const eventName = String(event?.type || '').trim()
      const handlers = Array.isArray(listeners[eventName]) ? listeners[eventName] : []

      for (const handler of handlers) {
        handler(event)
      }

      return handlers.length > 0
    },
  }
}

function resolvePrimaryFrontendIndexPath(projectRootPath) {
  const frontendRootPath = path.join(projectRootPath, 'frontend')
  const candidatePaths = [
    path.join(frontendRootPath, 'index.html'),
    path.join(frontendRootPath, 'public', 'index.html'),
    path.join(frontendRootPath, 'admin', 'index.html'),
    path.join(frontendRootPath, 'student', 'index.html'),
  ]

  return candidatePaths.find((entry) => fs.existsSync(entry)) || candidatePaths[0]
}

function executeStaticFrontendBundle(projectRootPath) {
  const indexHtmlPath = resolvePrimaryFrontendIndexPath(projectRootPath)
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
  const scriptSources = extractOrderedStaticScriptSources(indexHtml)
  const rootElement = buildVmRootElement()
  const document = {
    getElementById(id) {
      return id === 'app' ? rootElement : null
    },
  }
  const windowObject = {
    document,
    location: {
      href: pathToFileURL(indexHtmlPath).href,
    },
  }
  const sandbox = {
    window: windowObject,
    document,
    console,
    setTimeout,
    clearTimeout,
  }

  sandbox.globalThis = sandbox
  windowObject.window = windowObject
  windowObject.globalThis = sandbox

  const context = vm.createContext(sandbox)
  const indexHtmlDirectoryPath = path.dirname(indexHtmlPath)

  for (const scriptSource of scriptSources) {
    const scriptPath = path.resolve(indexHtmlDirectoryPath, scriptSource)
    const scriptContent = fs.readFileSync(scriptPath, 'utf8')
    vm.runInContext(scriptContent, context, { filename: scriptPath })
  }

  return {
    indexHtmlPath,
    scriptSources,
    renderedHtml: rootElement.innerHTML,
    windowObject,
  }
}

function readStaticFrontendArtifacts(projectRootPath) {
  const frontendRootPath = path.join(projectRootPath, 'frontend')
  const indexHtmlPath = resolvePrimaryFrontendIndexPath(projectRootPath)
  const mainJsPath = path.join(frontendRootPath, 'src', 'main.js')
  const mockDataPath = path.join(frontendRootPath, 'src', 'mock-data.js')
  const appPath = path.join(frontendRootPath, 'src', 'components', 'App.js')
  const stylesPath = path.join(frontendRootPath, 'src', 'styles.css')
  const readmePath = path.join(projectRootPath, 'README.md')
  const runbookPath = path.join(projectRootPath, 'docs', 'local-runbook.md')
  const readFileIfExists = (targetPath) =>
    fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : ''

  return {
    frontendRootPath,
    indexHtmlPath,
    mainJsPath,
    mockDataPath,
    appPath,
    stylesPath,
    readmePath,
    runbookPath,
    indexHtml: readFileIfExists(indexHtmlPath),
    mainJs: readFileIfExists(mainJsPath),
    mockDataJs: readFileIfExists(mockDataPath),
    appJs: readFileIfExists(appPath),
    stylesCss: readFileIfExists(stylesPath),
    readmeContent: readFileIfExists(readmePath),
    runbookContent: readFileIfExists(runbookPath),
  }
}

function pushStaticFrontendCompatibilityFailures(failures, frontendArtifacts) {
  const orderedScripts = extractOrderedStaticScriptSources(frontendArtifacts.indexHtml)

  pushFailure(
    failures,
    !frontendArtifacts.indexHtml.includes('type="module"'),
    'frontend/index.html no debe usar type="module" para file://.',
  )
  pushFailure(
    failures,
    JSON.stringify(orderedScripts) ===
      JSON.stringify([
        './src/mock-data.js',
        './src/components/App.js',
        './src/main.js',
      ]),
    'frontend/index.html debe cargar mock-data.js, App.js y main.js como scripts clásicos en ese orden.',
  )
  pushFailure(
    failures,
    !/\bimport\s/.test(frontendArtifacts.mainJs),
    'frontend/src/main.js no debe usar import en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    !/\bexport\s/.test(frontendArtifacts.mainJs),
    'frontend/src/main.js no debe usar export en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    !/\bexport\s/.test(frontendArtifacts.mockDataJs),
    'frontend/src/mock-data.js no debe usar export en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    !/\bexport\s/.test(frontendArtifacts.appJs),
    'frontend/src/components/App.js no debe usar export en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    !/\bfetch\s*\(/.test(
      `${frontendArtifacts.mainJs}\n${frontendArtifacts.mockDataJs}\n${frontendArtifacts.appJs}`,
    ),
    'El frontend estático no debe usar fetch.',
  )
  pushFailure(
    failures,
    frontendArtifacts.mockDataJs.includes('window.fullstackPlan'),
    'frontend/src/mock-data.js debe exponer window.fullstackPlan.',
  )
  pushFailure(
    failures,
    frontendArtifacts.appJs.includes('window.renderApp'),
    'frontend/src/components/App.js debe exponer window.renderApp.',
  )
  pushFailure(
    failures,
    frontendArtifacts.mainJs.includes('window.fullstackPlan') &&
      frontendArtifacts.mainJs.includes('window.renderApp'),
    'frontend/src/main.js debe usar window.fullstackPlan y window.renderApp.',
  )
  pushFailure(
    failures,
    frontendArtifacts.stylesCss.includes('.app-shell') ||
      frontendArtifacts.stylesCss.includes('.hero-grid'),
    'frontend/src/styles.css debe contener una presentacion rica para la demo local.',
  )
  pushFailure(
    failures,
    normalizeText(`${frontendArtifacts.readmeContent}\n${frontendArtifacts.runbookContent}`).includes(
      'frontend/index.html',
    ) &&
      normalizeText(`${frontendArtifacts.readmeContent}\n${frontendArtifacts.runbookContent}`).includes(
        'file://',
      ),
    'README y runbook deben explicar que frontend/index.html se abre directo por file://.',
  )
}

async function tryVerifyStaticFrontendInBrowser(indexHtmlPath, options = {}) {
  try {
    const playwrightModule = await import('playwright')
    const chromium =
      playwrightModule?.chromium || playwrightModule?.default?.chromium || null

    if (!chromium) {
      return {
        available: false,
        attempted: false,
        reason: 'playwright-sin-chromium',
      }
    }

    const browser = await chromium.launch({ headless: true })

    try {
      const page = await browser.newPage()
      const pageErrors = []
      const consoleErrors = []
      const clickTexts = Array.isArray(options?.clickTexts)
        ? options.clickTexts.filter((value) => typeof value === 'string' && value.trim())
        : []
      const interactionSnapshots = []

      page.on('pageerror', (error) => {
        pageErrors.push(error instanceof Error ? error.message : String(error))
      })
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text())
        }
      })

      await page.goto(pathToFileURL(indexHtmlPath).href, {
        waitUntil: 'load',
      })

      const bodyText = await page.locator('body').innerText()

      for (const label of clickTexts) {
        const button =
          page.getByRole('button', { name: new RegExp(escapeRegExp(label), 'i') }).first()
        if ((await button.count()) > 0) {
          await button.click()
          await page.waitForTimeout(80)
          interactionSnapshots.push({
            label,
            bodyText: await page.locator('body').innerText(),
          })
        }
      }

      return {
        available: true,
        attempted: true,
        ok: pageErrors.length === 0 && consoleErrors.length === 0,
        bodyText,
        interactionSnapshots,
        pageErrors,
        consoleErrors,
      }
    } finally {
      await browser.close()
    }
  } catch (error) {
    return {
      available: false,
      attempted: false,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

function getRoadmapPhaseEntry(implementationRoadmap, phaseId) {
  const normalizedPhaseId = normalizeIdentifier(phaseId)
  const phaseEntries = Array.isArray(implementationRoadmap?.phases)
    ? implementationRoadmap.phases
    : []

  return (
    phaseEntries.find(
      (entry) => normalizeIdentifier(entry?.id || entry?.phaseId || '') === normalizedPhaseId,
    ) || null
  )
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
  const debugDiagnosticsSurface = extractSegment({
    name: 'diagnosticos legacy de main-debug',
    startMarker: 'function summarizeGeneratedDomainContractDiagnosticsForDebug(diagnostics) {',
    endMarker: 'function buildSafeGeneratedDomainContractObservationErrorPreview(value) {',
  })
  const plannerSurface = extractSegment({
    name: 'superficie local de planner',
    startMarker: 'function normalizeExecutorAttemptScope(',
    endMarker: 'function createLocalRulesStrategicBrainProvider() {',
  })
  const harness = `
${debugDiagnosticsSurface}
${plannerSurface}
module.exports = {
  buildLocalStrategicBrainDecision,
  buildBrainDecisionContract,
  normalizeOpenAIBrainDecision,
  shouldBlockWebScaffoldExecutionForFullstackRequest,
  buildBlockedFullstackWebScaffoldExecutionResponse,
  inspectFullstackLocalMaterializationContract,
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
    deriveForbiddenSearchPatternsFromContract,
    deriveRequiredPathGroupsFromContract,
    isContractSafeForLocalMaterialization,
    buildGeneratedDomainCapabilityProfile,
    buildGeneratedDomainMaterializationShadowPlan,
    buildGeneratedDomainContractComparison,
    buildGeneratedDomainContractDiagnostics,
    extractGeneratedDomainContractCandidate,
    generatedDomainOrchestrationDiagnostics,
    generatedDomainLegacyDiagnostics,
    generatedDomainMaterializationPolicies,
    generatedDomainInspectionDiagnostics,
    generatedDomainMaterializationPlanDiagnostics,
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

function inspectDecisionMaterializationContract({
  decision,
  goal,
  context,
}) {
  return plannerApi.inspectFullstackLocalMaterializationContract({
    goal,
    context,
    decisionKey: decision?.decisionKey,
    strategy: decision?.strategy,
    executionMode: decision?.executionMode,
    nextExpectedAction: decision?.nextExpectedAction,
    executionScope: decision?.executionScope,
    materializationPlan: decision?.materializationPlan,
    localProjectManifest: decision?.localProjectManifest,
    existingProjectDetection: decision?.existingProjectDetection,
    generatedDomainContract: decision?.generatedDomainContract,
    generatedDomainContractDiagnostics: decision?.generatedDomainContractDiagnostics,
    generatedDomainCapabilityProfile: decision?.generatedDomainCapabilityProfile,
  })
}

function detectOnlineCoursesIntentFromPlanPrompt({
  goal,
  context = '',
  scalablePlan,
}) {
  const planFiles = Array.isArray(scalablePlan?.filesToCreate)
    ? scalablePlan.filesToCreate
        .map((entry) => (entry && typeof entry === 'object' ? String(entry.path || '').trim() : ''))
        .filter(Boolean)
        .join(' ')
    : ''
  const inspectionSurface = normalizeText(
    [
      goal,
      context,
      scalablePlan?.domainLabel,
      scalablePlan?.businessSector,
      scalablePlan?.projectType,
      scalablePlan?.deliveryLevel,
      ...(Array.isArray(scalablePlan?.modules) ? scalablePlan.modules : []),
      ...(Array.isArray(scalablePlan?.allowedRootPaths)
        ? scalablePlan.allowedRootPaths
        : []),
      planFiles,
    ].join(' '),
  )
  const learningCore =
    /\b(?:cursos?|clases?|lecciones?|panel alumno)\b/u.test(inspectionSurface)
  const learningActors =
    /\b(?:alumnos?|estudiantes?|instructores?|inscripciones?)\b/u.test(inspectionSurface)
  const commercialSignals =
    /\b(?:planes?|free|plata|oro|premium|progreso)\b/u.test(
      inspectionSurface,
    )
  const onlinePlatformSignals =
    /\b(?:cursos? online|plataforma web de cursos|plataforma de cursos|frontend\/student|panel alumno)\b/u.test(
      inspectionSurface,
    )

  return learningCore && (learningActors || onlinePlatformSignals) && (commercialSignals || onlinePlatformSignals)
}

function buildFullstackLocalMaterializationPrompt({ goal, context = '', scalablePlan }) {
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
  const isOnlineCoursesPlan = detectOnlineCoursesIntentFromPlanPrompt({
    goal,
    context,
    scalablePlan,
  })
  const isLogisticsPlan = /\b(?:logistica|logistico|tracking|envios?|consulta publica por codigo)\b/u.test(
    normalizeText(
      [
        goal,
        context,
        scalablePlan?.domainLabel,
        ...(Array.isArray(scalablePlan?.modules) ? scalablePlan.modules : []),
      ].join(' '),
    ),
  )
  if (!isOnlineCoursesPlan && !isLogisticsPlan) {
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
        'Archivos requeridos: README.md, package.json, frontend/package.json, frontend/admin/README.md, frontend/public/README.md, frontend/index.html, frontend/src/main.js, frontend/src/routes/index.js, frontend/src/features/appointments.js, frontend/src/styles.css, frontend/src/mock-data.js, frontend/src/components/App.js, backend/package.json, backend/src/server.js, backend/src/routes/health.js, backend/src/routes/appointments.js, backend/src/modules/appointments.js, backend/src/lib/response.js, shared/contracts/domain.js, shared/types/contracts.js, database/README.md, database/schema.sql, database/seeds/seed-local.sql, scripts/README.md, scripts/seed-local.js, docs/architecture.md, docs/api.md, docs/data-model.md, docs/local-runbook.md.',
        'Devolver un materialize-fullstack-local-plan ejecutable por el executor local deterministico.',
        'No instalar dependencias, no crear node_modules, no crear .env real y no levantar servicios.',
      ]
        .filter(Boolean)
        .join('\n'),
    }
  }
  const domainGuidance = isOnlineCoursesPlan
    ? [
        'Mantener un contrato canonico coherente de cursos online y no reciclar logistica, tracking, veterinaria ni ecommerce generico de productos.',
        'Usar la misma raiz objetivo para todo el contrato materializable y no arrastrar roots previos fuera de alcance.',
        'Archivos requeridos: README.md, package.json, backend/package.json, backend/src/server.js, backend/src/routes/courses.js, backend/src/routes/categories.js, backend/src/routes/modules.js, backend/src/routes/lessons.js, backend/src/routes/students.js, backend/src/routes/enrollments.js, backend/src/routes/plans.js, backend/src/routes/payments.js, backend/src/routes/progress.js, backend/src/services/mock-mercado-pago.js, shared/plans.js, shared/payment-statuses.js, shared/course-statuses.js, database/schema.sql, database/seed.sql, frontend/admin/index.html, frontend/admin/app.js, frontend/public/index.html, frontend/public/app.js, frontend/student/index.html, frontend/student/app.js, scripts/seed-local.js o scripts/README.md, docs/API.md, docs/ARCHITECTURE.md, docs/DB_SCHEMA.md, docs/PAYMENTS_MOCK.md y docs/LOCAL_VALIDATION.md.',
        'Mercado Pago debe quedar solo como mock local documentado con estados pending, approved, rejected y cancelled, sin .env, sin tokens y sin llamadas externas.',
      ]
    : [
        'Archivos requeridos: README.md, package.json, backend/package.json, backend/src/server.js, backend/src/routes/shipments.js, backend/src/routes/tracking.js, shared/statuses.js, database/schema.sql, database/seed.sql, frontend/admin/index.html, frontend/admin/app.js, frontend/public/index.html, frontend/public/app.js, scripts/seed-local.js o scripts/README.md, docs/API.md, docs/ARCHITECTURE.md y docs/DB_SCHEMA.md.',
        'No devolver logistica contaminada con veterinaria, appointments ni proyectos previos fuera de alcance.',
      ]

  return {
    goal: [
      'Preparar la materializacion controlada de un fullstack-local local y revisable dentro de una carpeta nueva del workspace.',
      'Esto corresponde a un proyecto nuevo y no a una continuidad read-only de un proyecto existente.',
      'No devolver otro scalable-delivery-plan.',
      'No devolver materialize-safe-first-delivery-plan.',
      'No devolver materialize-frontend-project-plan.',
      'No devolver prepare-continuation-action-plan.',
      'No devolver prepare-project-phase-plan.',
      'No devolver edit-single-existing-file.',
      `Devolver un materialize-fullstack-local-plan ejecutable por el executor local deterministico para "${goal}".`,
    ].join(' '),
    context: [
      `Objetivo original: ${goal}.`,
      context ? `Contexto previo del operador: ${context}.` : '',
      'sourceStrategy: scalable-delivery-plan.',
      'sourceNextExpectedAction: review-scalable-delivery.',
      'deliveryLevel: fullstack-local.',
      'accion requerida: materializar fullstack-local.',
      'projectIntent: new-project-intent.',
      'modo esperado: scaffold fullstack local, estatico y revisable.',
      'strategyEsperada: materialize-fullstack-local-plan.',
      'executionModeEsperado: executor.',
      'nextExpectedActionEsperado: execute-plan.',
      'requiresApprovalEsperado: false.',
      'No interpretar esta preparacion como una edicion puntual sobre un archivo existente.',
      'No devolver strategy executor para editar un archivo existente.',
      'No devolver nextExpectedAction=user-approval.',
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
      'Si el workspace detecta un proyecto existente pero applicable=false o projectIntent=new-project-intent, ignorarlo por completo dentro del contrato materializable.',
      'No reutilizar manifest, roadmap, phaseExpansionPlan, modulos ni dominio de proyectos detectados fuera de alcance como fullstack-local-veterinaria.',
      ...domainGuidance,
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
    context,
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
    normalizeIdentifier(decision?.projectReadinessState?.readinessLevel) ===
      'scaffold-materialized',
    'Después del scaffold el readiness debe marcar scaffold-materialized.',
  )
  pushFailure(
    failures,
    normalizeText(decision?.projectReadinessState?.operatorSummary || '').includes(
      'base local materializada',
    ),
    'Despues del scaffold la lectura para operador debe mencionar base local materializada.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.projectContinuationState?.nextRecommendedPhase) ===
      'frontend-mock-flow',
    'Despues del scaffold debe recomendar frontend-mock-flow.',
  )

  return { id: 'operator-fullstack-base', label: 'Base fullstack local', failures }
}

async function runExistingWorkspaceProjectDetectionCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const fixture = await buildFullstackFixture({
    workspaceName: 'operator-existing-workspace-veterinary',
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    projectLabel: veterinaryGoalCase.projectLabel,
  })
  const decision = await requestPlannerDecision({
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    workspacePath: fixture.workspacePath,
  })

  pushFailure(
    failures,
    decision?.strategy === 'prepare-project-phase-plan',
    'Con un proyecto fullstack local existente debe priorizar continuidad de fase, no el scaffold inicial.',
  )
  pushFailure(
    failures,
    decision?.executionMode === 'planner-only',
    'La continuidad desde un proyecto existente debe volver en planner-only.',
  )
  pushFailure(
    failures,
    decision?.nextExpectedAction === 'review-project-phase',
    'La continuidad desde un proyecto existente debe volver a review-project-phase.',
  )
  pushFailure(
    failures,
    !decision?.scalableDeliveryPlan,
    'No debe volver a devolver scalableDeliveryPlan cuando el proyecto ya existe en disco.',
  )
  pushFailure(
    failures,
    !decision?.materializationPlan,
    'No debe intentar recrear el scaffold cuando ya existe un proyecto local compatible.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.projectPhaseExecutionPlan?.phaseId) === 'frontend-mock-flow',
    'La continuidad detectada desde disco debe arrancar en frontend-mock-flow.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.projectPhaseExecutionPlan?.targetStrategy) ===
      'materialize-project-phase-plan',
    'La fase detectada desde disco debe apuntar a materialize-project-phase-plan.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.projectContinuationState?.nextRecommendedPhase) ===
      'frontend-mock-flow',
    'El siguiente paso seguro debe seguir siendo frontend-mock-flow.',
  )
  pushFailure(
    failures,
    continuationActionMatchesId(
      decision?.projectContinuationState?.nextRecommendedAction,
      'frontend-mock-flow',
    ),
    'La acción recomendada debe apuntar al frontend mock flow.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.projectReadinessState?.readinessLevel) ===
      'scaffold-materialized',
    'El readiness debe rehidratarse como scaffold-materialized desde el manifest detectado.',
  )
  pushFailure(
    failures,
    !normalizeText(decision?.projectReadinessState?.operatorSummary || '').includes(
      'planificacion',
    ),
    'El readiness no debe volver a mostrarse como planificación si el scaffold ya existe.',
  )
  pushFailure(
    failures,
    normalizePathForComparison(decision?.localProjectManifest?.projectRoot || '') ===
      fixture.projectRootRelativePath,
    'El manifest detectado debe apuntar a la carpeta existente dentro del workspace.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(decision?.localProjectManifest?.lastCompletedPhase) ===
      'fullstack-local-scaffold',
    'El manifest detectado debe conservar la última fase completada del scaffold.',
  )
  pushFailure(
    failures,
    !decision?.approvalRequestPlan && !decision?.runtimeApprovalState,
    'Context Hub no disponible y el proyecto detectado no deben bloquear la continuidad con aprobaciones sensibles falsas.',
  )
  pushFailure(
    failures,
    normalizeText(decision?.reason || '').includes('proyecto existente') &&
      normalizeText(decision?.instruction || '').includes('proyecto existente detectado'),
    'La decisión debe explicar que se detectó un proyecto existente dentro del workspace.',
  )
  const allowedTargetPaths = Array.isArray(
    decision?.projectPhaseExecutionPlan?.allowedTargetPaths,
  )
    ? decision.projectPhaseExecutionPlan.allowedTargetPaths.map((entry) =>
        normalizePathForComparison(entry),
      )
    : []
  const expectedAllowedPathTokens = [
    '/frontend/src/mock-data.js',
    '/frontend/src/components/App.js',
    '/frontend/src/styles.css',
    '/docs/local-runbook.md',
    '/jefe-project.json',
  ]
  pushFailure(
    failures,
    expectedAllowedPathTokens.every((token) =>
      allowedTargetPaths.some((entry) => entry.endsWith(normalizePathForComparison(token))),
    ),
    'Los allowedTargetPaths deben seguir acotados a frontend/src, docs/local-runbook.md y jefe-project.json.',
  )
  pushFailure(
    failures,
    allowedTargetPaths.every(
      (entry) =>
        entry.startsWith(`${fixture.projectRootRelativePath}/`) &&
        !entry.includes('/backend/') &&
        !entry.includes('/database/') &&
        !entry.includes('/shared/') &&
        !entry.includes('node_modules') &&
        !entry.endsWith('/.env') &&
        !entry.toLocaleLowerCase().includes('docker'),
    ),
    'frontend-mock-flow no debe reabrir backend, database, shared, node_modules, .env ni Docker.',
  )
  pushFailure(
    failures,
    mainSource.includes('Proyecto existente detectado'),
    'La UI debe poder mostrar Proyecto existente detectado en el centro de continuidad.',
  )
  pushFailure(
    failures,
    appSource.includes('Preparar materializacion de fase') &&
      appSource.includes('plannerProjectPhaseReviewCanMaterialize') &&
      appSource.includes('handleMaterializeProjectPhase(plannerProjectPhaseReviewId)'),
    'La UI debe exponer un CTA principal habilitable para preparar la materialización de la fase segura detectada.',
  )
  pushFailure(
    failures,
    mainSource.includes('requiresLocalProjectPhaseMaterialization') &&
      mainSource.includes('isMaterializeProjectPhaseDecisionKey(decisionKey)') &&
      mainSource.includes("materialize-project-phase-plan"),
    'Electron debe tratar materialize-project-phase-plan como una ruta local determinística y no delegarla al bridge por defecto.',
  )

  return {
    id: 'operator-existing-workspace-project',
    label: 'Proyecto existente detectado desde workspace',
    failures,
  }
}

async function runFullstackStaticFileCompatibilityCase() {
  const failures = []
  const fixture = await buildFullstackFixture({
    workspaceName: 'operator-file-compatibility',
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    projectLabel: veterinaryGoalCase.projectLabel,
  })
  const frontendRootPath = path.join(fixture.projectRootPath, 'frontend')
  const indexHtmlPath = path.join(frontendRootPath, 'index.html')
  const mainJsPath = path.join(frontendRootPath, 'src', 'main.js')
  const mockDataPath = path.join(frontendRootPath, 'src', 'mock-data.js')
  const appPath = path.join(frontendRootPath, 'src', 'components', 'App.js')
  const runbookPath = path.join(fixture.projectRootPath, 'docs', 'local-runbook.md')
  const readmePath = path.join(fixture.projectRootPath, 'README.md')
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
  const mainJs = fs.readFileSync(mainJsPath, 'utf8')
  const mockDataJs = fs.readFileSync(mockDataPath, 'utf8')
  const appJs = fs.readFileSync(appPath, 'utf8')
  const runbookContent = fs.readFileSync(runbookPath, 'utf8')
  const readmeContent = fs.readFileSync(readmePath, 'utf8')
  const orderedScripts = extractOrderedStaticScriptSources(indexHtml)
  const normalizedFrontendSurface = normalizeText(`${indexHtml}\n${mainJs}\n${mockDataJs}\n${appJs}`)

  pushFailure(
    failures,
    !indexHtml.includes('type="module"'),
    'frontend/index.html no debe usar type="module" para file://.',
  )
  pushFailure(
    failures,
    JSON.stringify(orderedScripts) ===
      JSON.stringify([
        './src/mock-data.js',
        './src/components/App.js',
        './src/main.js',
      ]),
    'frontend/index.html debe cargar mock-data.js, App.js y main.js como scripts clasicos en ese orden.',
  )
  pushFailure(
    failures,
    !/\bimport\s/.test(mainJs),
    'frontend/src/main.js no debe usar import en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    !/\bexport\s/.test(mockDataJs),
    'frontend/src/mock-data.js no debe usar export en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    !/\bexport\s/.test(appJs),
    'frontend/src/components/App.js no debe usar export en el scaffold fullstack local.',
  )
  pushFailure(
    failures,
    mockDataJs.includes('window.fullstackPlan'),
    'frontend/src/mock-data.js debe exponer window.fullstackPlan.',
  )
  pushFailure(
    failures,
    appJs.includes('window.renderApp'),
    'frontend/src/components/App.js debe exponer window.renderApp.',
  )
  pushFailure(
    failures,
    mainJs.includes('window.fullstackPlan') && mainJs.includes('window.renderApp'),
    'frontend/src/main.js debe usar window.fullstackPlan y window.renderApp.',
  )
  pushFailure(
    failures,
    mockDataJs.includes('clients') &&
      mockDataJs.includes('pets') &&
      mockDataJs.includes('appointments') &&
      mockDataJs.includes('reminders') &&
      mockDataJs.includes('inventory') &&
      mockDataJs.includes('reports'),
    'frontend/src/mock-data.js debe incluir datasets ricos para clientes, mascotas, turnos, recordatorios, inventario y reportes.',
  )
  pushFailure(
    failures,
    readmeContent.includes('Veterinaria') || mockDataJs.includes('Veterinaria') || appJs.includes('Veterinaria'),
    'La demo veterinaria debe usar un título visible presentable como Veterinaria.',
  )
  pushFailure(
    failures,
    normalizedFrontendSurface.includes('atencion veterinaria general'),
    'La demo veterinaria debe usar Atención veterinaria general en lugar de Clínica general.',
  )
  pushFailure(
    failures,
    !normalizedFrontendSurface.includes('ingreso de paciente') &&
      !normalizedFrontendSurface.includes('clinica medica') &&
      !normalizedFrontendSurface.includes('pediatria') &&
      !normalizedFrontendSurface.includes('pacientes'),
    'El frontend veterinario generado no debe arrastrar terminos de clinica humana en sus archivos.',
  )
  pushFailure(
    failures,
    normalizeText(`${readmeContent}
${runbookContent}`).includes('frontend/index.html') &&
      normalizeText(`${readmeContent}
${runbookContent}`).includes('doble click'),
    'README y runbook deben declarar que frontend/index.html se puede abrir directo con doble click.',
  )

  try {
    const simulatedBundle = executeStaticFrontendBundle(fixture.projectRootPath)
    const renderedText = normalizeText(simulatedBundle.renderedHtml)
    const serializedPlan = normalizeText(
      JSON.stringify(simulatedBundle.windowObject?.fullstackPlan || {}),
    )
    const visibleVeterinarySections = [
      'clientes',
      'mascotas',
      'turnos',
      'recordatorios',
      'reportes',
      'inventario',
    ].filter((token) => renderedText.includes(normalizeText(token))).length

    pushFailure(
      failures,
      renderedText.includes('fullstack local') ||
        renderedText.includes('modo local seguro') ||
        renderedText.includes('veterinaria local'),
      'El bundle estatico debe renderizar una superficie visible de demo local segura.',
    )
    pushFailure(
      failures,
      renderedText.includes('veterinaria') || renderedText.includes('turnos'),
      'El bundle estatico debe renderizar el dominio esperado sin quedar en blanco.',
    )
    pushFailure(
      failures,
      visibleVeterinarySections >= 4,
      'La demo veterinaria debe mostrar varias secciones reales para clientes, mascotas, turnos, recordatorios, reportes e inventario.',
    )
    pushFailure(
      failures,
      serializedPlan.includes('veterinaria') &&
        serializedPlan.includes('mascotas') &&
        serializedPlan.includes('recordatorios') &&
        serializedPlan.includes('inventario'),
      'Los datos mock del scaffold deben reflejar el dominio veterinario real.',
    )
    pushFailure(
      failures,
      !renderedText.includes('clinica medica') &&
        !renderedText.includes('pediatria') &&
        !serializedPlan.includes('clinica medica') &&
        !serializedPlan.includes('pediatria') &&
        !serializedPlan.includes('pacientes'),
      'La demo veterinaria no debe contaminarse con clinica humana ni pacientes como concepto principal.',
    )
  } catch (error) {
    failures.push(
      `La ejecucion simulada del frontend estatico fallo: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  const browserVerification = await tryVerifyStaticFrontendInBrowser(indexHtmlPath, {
    clickTexts: ['Turnos', 'Recordatorios', 'Inventario'],
  })
  if (browserVerification.available && browserVerification.attempted) {
    const normalizedBodyText = normalizeText(browserVerification.bodyText)
    const visibleBodyVeterinarySections = [
      'clientes',
      'mascotas',
      'turnos',
      'recordatorios',
      'reportes',
      'inventario',
    ].filter((token) => normalizedBodyText.includes(normalizeText(token))).length

    pushFailure(
      failures,
      browserVerification.ok === true,
      `La validacion opcional en navegador no debe arrojar errores: ${[
        ...(browserVerification.pageErrors || []),
        ...(browserVerification.consoleErrors || []),
      ].join(' | ')}`,
    )
    pushFailure(
      failures,
      (normalizedBodyText.includes('fullstack local') ||
        normalizedBodyText.includes('modo local seguro') ||
        normalizedBodyText.includes('veterinaria local')) &&
        normalizedBodyText.includes('veterinaria') &&
        visibleBodyVeterinarySections >= 4,
      'La validacion opcional en navegador debe mostrar una demo veterinaria rica en el body.',
    )
    pushFailure(
      failures,
      !normalizedBodyText.includes('clinica medica') &&
        !normalizedBodyText.includes('pediatria') &&
        !normalizedBodyText.includes('pacientes'),
      'La validacion opcional en navegador no debe mostrar terminos de clinica humana dentro de la demo veterinaria.',
    )
    pushFailure(
      failures,
      normalizedBodyText.includes('dashboard') &&
        normalizedBodyText.includes('clientes') &&
        normalizedBodyText.includes('mascotas') &&
        normalizedBodyText.includes('turnos') &&
        normalizedBodyText.includes('recordatorios') &&
        normalizedBodyText.includes('reportes') &&
        normalizedBodyText.includes('inventario'),
      'La validación opcional en navegador debe mostrar la navegación principal de la demo veterinaria.',
    )
    const interactionSnapshots = Array.isArray(browserVerification.interactionSnapshots)
      ? browserVerification.interactionSnapshots
      : []
    pushFailure(
      failures,
      interactionSnapshots.length >= 3,
      'La validación opcional en navegador debe poder navegar Turnos, Recordatorios e Inventario sin romper la demo.',
    )
    for (const entry of [
      { label: 'Turnos', expectedToken: 'turnos' },
      { label: 'Recordatorios', expectedToken: 'recordatorios' },
      { label: 'Inventario', expectedToken: 'inventario' },
    ]) {
      const snapshot = interactionSnapshots.find(
        (item) => normalizeText(item.label) === normalizeText(entry.label),
      )
      pushFailure(
        failures,
        Boolean(snapshot) &&
          normalizeText(snapshot?.bodyText || '').includes(normalizeText(entry.expectedToken)),
        `La navegación ${entry.label} debe seguir mostrando contenido visible del dominio veterinario.`,
      )
    }
  }

  pushFailure(
    failures,
    !fs.existsSync(path.join(fixture.projectRootPath, 'node_modules')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, '.env')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'Dockerfile')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'docker-compose.yml')),
    'El scaffold file:// no debe crear node_modules, .env, Dockerfile ni docker-compose.yml.',
  )

  return {
    id: 'operator-fullstack-file-compatibility',
    label: 'Scaffold fullstack local compatible con file://',
    failures,
  }
}

async function runDomainRichnessCase({
  id,
  label,
  workspaceName,
  goalCase,
  expectedTokens,
  forbiddenTokens = [],
  browserValidation = false,
}) {
  const failures = []
  const fixture = await buildFullstackFixture({
    workspaceName,
    goal: goalCase.goal,
    context: goalCase.context,
    projectLabel: goalCase.projectLabel,
  })
  const reviewDecision = await requestReviewExpandDecision(fixture)
  const frontendArtifacts = readStaticFrontendArtifacts(fixture.projectRootPath)
  const combinedArtifacts = [
    frontendArtifacts.indexHtml,
    frontendArtifacts.mainJs,
    frontendArtifacts.mockDataJs,
    frontendArtifacts.appJs,
    frontendArtifacts.stylesCss,
    frontendArtifacts.readmeContent,
    frontendArtifacts.runbookContent,
  ].join('\n')
  const normalizedArtifacts = normalizeText(combinedArtifacts)

  pushStaticFrontendCompatibilityFailures(failures, frontendArtifacts)
  pushFailure(
    failures,
    normalizeIdentifier(reviewDecision?.projectContinuationState?.nextRecommendedPhase) ===
      'frontend-mock-flow',
    'Después del scaffold debe recomendar frontend-mock-flow.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(reviewDecision?.projectReadinessState?.readinessLevel) ===
      'scaffold-materialized',
    `Después del scaffold ${label} debe marcar scaffold-materialized.`,
  )
  pushFailure(
    failures,
    normalizeText(reviewDecision?.projectReadinessState?.operatorSummary || '').includes(
      'base local materializada',
    ),
    `Despues del scaffold ${label} debe explicar que la base local ya fue materializada.`,
  )
  pushFailure(
    failures,
    !reviewDecision?.runtimeApprovalState,
    'El scaffold seguro no debe generar runtimeApprovalState activo.',
  )
  pushFailure(
    failures,
    !reviewDecision?.approvalRequestPlan,
    'El scaffold seguro no debe generar approvalRequestPlan activo.',
  )
  pushFailure(
    failures,
    !fs.existsSync(path.join(fixture.projectRootPath, 'node_modules')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, '.env')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'Dockerfile')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'docker-compose.yml')),
    'El scaffold multi-dominio no debe crear node_modules, .env, Dockerfile ni docker-compose.yml.',
  )

  for (const token of expectedTokens) {
    pushFailure(
      failures,
      normalizedArtifacts.includes(normalizeText(token)),
      `La demo ${label} debe incluir ${token}.`,
    )
  }

  for (const token of forbiddenTokens) {
    pushFailure(
      failures,
      !normalizedArtifacts.includes(normalizeText(token)),
      `La demo ${label} no debe contaminarse con ${token}.`,
    )
  }

  try {
    const simulatedBundle = executeStaticFrontendBundle(fixture.projectRootPath)
    const renderedText = normalizeText(simulatedBundle.renderedHtml)
    const serializedPlan = normalizeText(
      JSON.stringify(simulatedBundle.windowObject?.fullstackPlan || {}),
    )

    for (const token of expectedTokens.slice(0, 6)) {
      pushFailure(
        failures,
        renderedText.includes(normalizeText(token)) ||
          serializedPlan.includes(normalizeText(token)),
        `La demo ${label} debe renderizar o serializar ${token} en el bundle estático.`,
      )
    }

    for (const token of forbiddenTokens) {
      pushFailure(
        failures,
        !renderedText.includes(normalizeText(token)) &&
          !serializedPlan.includes(normalizeText(token)),
        `La demo ${label} no debe renderizar ${token} en el bundle estático.`,
      )
    }
  } catch (error) {
    failures.push(
      `La ejecución simulada del frontend estático de ${label} falló: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  if (browserValidation) {
    const browserVerification = await tryVerifyStaticFrontendInBrowser(
      frontendArtifacts.indexHtmlPath,
    )
    if (browserVerification.available && browserVerification.attempted) {
      pushFailure(
        failures,
        browserVerification.ok === true,
        `La validación opcional en navegador de ${label} no debe arrojar errores: ${[
          ...(browserVerification.pageErrors || []),
          ...(browserVerification.consoleErrors || []),
        ].join(' | ')}`,
      )
      const normalizedBodyText = normalizeText(browserVerification.bodyText)
      for (const token of expectedTokens.slice(0, 4)) {
        pushFailure(
          failures,
          normalizedBodyText.includes(normalizeText(token)),
          `La validación en navegador de ${label} debe mostrar ${token}.`,
        )
      }
      for (const token of forbiddenTokens) {
        pushFailure(
          failures,
          !normalizedBodyText.includes(normalizeText(token)),
          `La validación en navegador de ${label} no debe mostrar ${token}.`,
        )
      }
    }
  }

  return { id, label, failures }
}

async function runUtf8SurfaceCase() {
  const failures = []
  const files = [
    'electron/main.cjs',
    'src/App.tsx',
    'scripts/ai-operator-e2e-smoke.mjs',
    'docs/operator-demo-flow.md',
    'docs/release-candidate-checklist.md',
  ]
  const suspiciousPatterns = [
    { re: /\uFFFD/g, label: 'caracter de reemplazo' },
    { re: /\u00C3/g, label: 'secuencia mojibake C3' },
    { re: /\u00C2/g, label: 'secuencia mojibake C2' },
    {
      re: /[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00E1\u00E9\u00ED\u00F3\u00FA\u00D1\u00F1]+\?[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00E1\u00E9\u00ED\u00F3\u00FA\u00D1\u00F1]+/g,
      label: 'palabra visible con ? en el medio',
    },
  ]

  for (const relativePath of files) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
    for (const entry of suspiciousPatterns) {
      if (entry.re.test(source)) {
        failures.push(`${relativePath} contiene ${entry.label}.`)
      }
      entry.re.lastIndex = 0
    }
  }

  return {
    id: 'operator-utf8-surface',
    label: 'Superficie visible sin mojibake',
    failures,
  }
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

async function runPhaseMaterializationFlowCase() {
  const failures = []
  let fixture = await buildFullstackFixture({
    workspaceName: 'operator-phase-materialization-flow',
    goal: veterinaryGoalCase.goal,
    context: veterinaryGoalCase.context,
    projectLabel: veterinaryGoalCase.projectLabel,
  })

  const getManifestPhase = (phaseId) =>
    (Array.isArray(fixture.manifest?.phases) ? fixture.manifest.phases : []).find(
      (entry) => normalizeIdentifier(entry?.id) === normalizeIdentifier(phaseId),
    ) || null

  pushFailure(
    failures,
    normalizeIdentifier(fixture.manifest?.readinessLevel) === 'scaffold-materialized',
    'El manifest base debe dejar scaffold-materialized después del scaffold fullstack local.',
  )
  pushFailure(
    failures,
    normalizeText(fixture.manifest?.recommendedDemoScript || '').includes('frontend/index.html') &&
      normalizeText(fixture.manifest?.recommendedDemoScript || '').includes('doble click'),
    'El manifest base debe explicar cómo abrir frontend/index.html con doble click.',
  )

  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'operator-phase-frontend',
  })
  const frontendArtifacts = readStaticFrontendArtifacts(fixture.projectRootPath)
  const frontendValidationResults = Array.isArray(
    fixture.lastPhaseExecutionResult?.details?.validationResults,
  )
    ? fixture.lastPhaseExecutionResult.details.validationResults
    : []
  const frontendTouchedPaths = summarizeUniqueStrings(
    fixture.lastPhaseExecutionResult?.details?.touchedPaths,
    24,
  ).map(normalizePathForComparison)
  pushStaticFrontendCompatibilityFailures(failures, frontendArtifacts)
  pushFailure(
    failures,
    normalizeIdentifier(getManifestPhase('frontend-mock-flow')?.status) === 'done',
    'frontend-mock-flow debe quedar en done dentro del manifest.',
  )
  pushFailure(
    failures,
    normalizeText(getManifestPhase('frontend-mock-flow')?.objective || '').includes('frontend'),
    'frontend-mock-flow debe conservar un objective visible dentro del manifest.',
  )
  pushFailure(
    failures,
    (getManifestPhase('frontend-mock-flow')?.allowedTargetPaths || []).some((entry) =>
      normalizePathForComparison(entry).endsWith('/frontend/src/mock-data.js'),
    ),
    'frontend-mock-flow debe exponer allowedTargetPaths ricos dentro del manifest.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(fixture.manifest?.nextRecommendedPhase) === 'backend-contracts',
    'Después de frontend-mock-flow debe recomendar backend-contracts.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(fixture.manifest?.lastCompletedPhase) === 'frontend-mock-flow',
    'Después de frontend-mock-flow debe marcar lastCompletedPhase como frontend-mock-flow.',
  )
  pushFailure(
    failures,
    frontendValidationResults.length > 0 &&
      frontendValidationResults.every((entry) => entry?.ok !== false),
    'frontend-mock-flow debe cerrar con validaciones finales OK.',
  )
  pushFailure(
    failures,
    !normalizeText(fixture.lastPhaseExecutionResult?.result || '').includes('pendiente de ejecucion'),
    'frontend-mock-flow no debe cerrar como pendiente de ejecución si ya materializó archivos.',
  )
  pushFailure(
    failures,
    frontendArtifacts.mockDataJs.includes('window.fullstackPlan') &&
      frontendArtifacts.mockDataJs.includes('backend-contracts'),
    'frontend-mock-flow debe dejar mock-data.js con window.fullstackPlan y la siguiente fase segura.',
  )
  pushFailure(
    failures,
    frontendArtifacts.appJs.includes('window.renderApp') &&
      frontendArtifacts.appJs.includes('data-view-id'),
    'frontend-mock-flow debe dejar App.js con renderer y navegación local.',
  )
  pushFailure(
    failures,
    frontendArtifacts.stylesCss.includes('.toolbar-card') &&
      frontendArtifacts.stylesCss.includes('.hero-safe-pill'),
    'frontend-mock-flow debe mantener el frontend rico y navegable.',
  )
  pushFailure(
    failures,
    normalizeText(frontendArtifacts.runbookContent).includes('backend-contracts') &&
      normalizeText(frontendArtifacts.runbookContent).includes('doble click'),
    'frontend-mock-flow debe actualizar el runbook con doble click y backend-contracts.',
  )
  pushFailure(
    failures,
    Buffer.byteLength(frontendArtifacts.mockDataJs, 'utf8') > 0 &&
      Buffer.byteLength(frontendArtifacts.appJs, 'utf8') > 0 &&
      Buffer.byteLength(frontendArtifacts.stylesCss, 'utf8') > 0,
    'frontend-mock-flow no debe dejar mock-data.js, App.js ni styles.css en 0 bytes.',
  )
  pushFailure(
    failures,
    frontendTouchedPaths.some((entry) => entry.endsWith('/frontend/src/mock-data.js')) &&
      frontendTouchedPaths.some((entry) => entry.endsWith('/frontend/src/components/app.js')) &&
      frontendTouchedPaths.some((entry) => entry.endsWith('/frontend/src/styles.css')) &&
      !frontendTouchedPaths.some((entry) =>
        /\/backend\/|\/database\/|\/shared\/|package\.json$|node_modules|\/\.env$|docker|deploy/i.test(
          entry,
        ),
      ),
    'frontend-mock-flow debe tocar solo frontend/src, docs/local-runbook.md y jefe-project.json.',
  )
  try {
    const simulatedBundle = executeStaticFrontendBundle(fixture.projectRootPath)
    const renderedText = normalizeText(simulatedBundle.renderedHtml)
    pushFailure(
      failures,
      renderedText.includes('veterinaria') &&
        renderedText.includes('mascotas') &&
        renderedText.includes('recordatorios'),
      'frontend-mock-flow no debe romper la demo veterinaria rica ni su render estático.',
    )
  } catch (error) {
    failures.push(
      `La demo estática luego de frontend-mock-flow falló al renderizar: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'operator-phase-backend',
  })
  const backendServerSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'backend', 'src', 'server.js'),
    'utf8',
  )
  const backendModuleSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
    'utf8',
  )
  const sharedDomainSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
    'utf8',
  )
  const sharedContractsSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'shared', 'types', 'contracts.js'),
    'utf8',
  )
  const backendArchitectureSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'architecture.md'),
    'utf8',
  )
  const backendRunbookSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'local-runbook.md'),
    'utf8',
  )
  const normalizedBackendSurface = normalizeText(
    [
      backendServerSource,
      backendModuleSource,
      sharedDomainSource,
      sharedContractsSource,
      backendArchitectureSource,
      backendRunbookSource,
    ].join('\n'),
  )
  pushFailure(
    failures,
    normalizeIdentifier(getManifestPhase('backend-contracts')?.status) === 'done',
    'backend-contracts debe quedar en done dentro del manifest.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(fixture.manifest?.nextRecommendedPhase) === 'database-design',
    'Después de backend-contracts debe recomendar database-design.',
  )
  pushFailure(
    failures,
    backendServerSource.includes('createServerContract') &&
      backendModuleSource.includes('transitionAppointmentStatus') &&
      backendModuleSource.includes('markReminderReviewed') &&
      sharedDomainSource.includes('domainContracts') &&
      sharedContractsSource.includes('sharedContracts'),
    'backend-contracts debe dejar modulos y contratos compartidos revisables.'
  )
  pushFailure(
    failures,
    normalizedBackendSurface.includes('veterin') &&
      normalizedBackendSurface.includes('mascotas') &&
      !normalizedBackendSurface.includes('clinica medica') &&
      !normalizedBackendSurface.includes('pediatria') &&
      !normalizedBackendSurface.includes('paciente local'),
    'backend-contracts debe mantenerse coherente con veterinaria y sin contaminación humana.',
  )

  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'operator-phase-database',
  })
  const schemaSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'database', 'schema.sql'),
    'utf8',
  )
  const seedSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'database', 'seeds', 'seed-local.sql'),
    'utf8',
  )
  const seedScriptSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'scripts', 'seed-local.js'),
    'utf8',
  )
  const normalizedSchemaSurface = normalizeText(`${schemaSource}\n${seedSource}\n${seedScriptSource}`)
  pushFailure(
    failures,
    normalizeIdentifier(getManifestPhase('database-design')?.status) === 'done',
    'database-design debe quedar en done dentro del manifest.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(fixture.manifest?.nextRecommendedPhase) === 'local-validation',
    'Después de database-design debe recomendar local-validation.',
  )
  pushFailure(
    failures,
    normalizedSchemaSurface.includes('create table pets') &&
      normalizedSchemaSurface.includes('create table clients') &&
      normalizedSchemaSurface.includes('create table veterinarians') &&
      normalizedSchemaSurface.includes('create table report_snapshots') &&
      normalizedSchemaSurface.includes('insert into pets') &&
      normalizedSchemaSurface.includes('insert into clients') &&
      normalizedSchemaSurface.includes('seedpreview'),
    'database-design debe dejar schema y seed coherentes con veterinaria.',
  )
  pushFailure(
    failures,
    !normalizedSchemaSurface.includes('create table patients') &&
      !normalizedSchemaSurface.includes('insert into patients') &&
      !normalizedSchemaSurface.includes('pediatria'),
    'database-design no debe volver a contaminar el dominio veterinario con tablas o seeds humanos.',
  )

  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'operator-phase-validation',
  })
  const validationReportSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'validation-report.md'),
    'utf8',
  )
  const validationRunbookSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'local-runbook.md'),
    'utf8',
  )
  const validationMockDataSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'frontend', 'src', 'mock-data.js'),
    'utf8',
  )
  const normalizedValidationSurface = normalizeText(
    `${validationReportSource}\n${validationRunbookSource}`,
  )
  const normalizedValidationMockData = normalizeText(validationMockDataSource)
  pushFailure(
    failures,
    normalizeIdentifier(getManifestPhase('local-validation')?.status) === 'done',
    'local-validation debe quedar en done dentro del manifest.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(getManifestPhase('local-validation')?.nextRecommendedPhase) ===
      'review-and-expand',
    'local-validation debe declarar review-and-expand como siguiente fase.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(fixture.manifest?.nextRecommendedPhase) === 'review-and-expand',
    'Después de local-validation debe recomendar review-and-expand.',
  )
  pushFailure(
    failures,
    normalizedValidationSurface.includes('frontend/index.html') &&
      normalizedValidationSurface.includes('review-and-expand') &&
      normalizedValidationSurface.includes('scaffold fullstack local') &&
      normalizedValidationSurface.includes('backend contracts') &&
      normalizedValidationSurface.includes('75%') &&
      normalizedValidationSurface.includes('65%') &&
      normalizedValidationSurface.includes('no se instalaron dependencias') &&
      normalizedValidationSurface.includes('no se levanto backend real') &&
      normalizedValidationSurface.includes('docker'),
    'local-validation debe dejar un validation-report útil con paths, límites y próxima fase.',
  )
  pushFailure(
    failures,
    normalizedValidationMockData.includes('entrega funcional local validada') &&
      normalizedValidationMockData.includes('review-and-expand') &&
      normalizedValidationMockData.includes('core flow completo') &&
      normalizedValidationMockData.includes('local-validation'),
    'local-validation debe resincronizar frontend/src/mock-data.js con entrega funcional local validada y review-and-expand.',
  )
  pushFailure(
    failures,
    !normalizedValidationMockData.includes('siguiente paso: backend-contracts') &&
      !normalizedValidationMockData.includes('el proximo paso seguro es backend-contracts'),
    'local-validation no debe seguir mostrando backend-contracts como siguiente paso principal en el frontend mock.',
  )
  pushFailure(
    failures,
    fixture.manifest?.safeLocalDemoReady === true &&
      fixture.manifest?.demoReady === true &&
      fixture.manifest?.completedCoreFlow === true &&
      normalizeIdentifier(fixture.manifest?.lastCompletedPhase) === 'local-validation' &&
      Array.isArray(fixture.manifest?.availableActions) &&
      fixture.manifest.availableActions.includes('review-and-expand') &&
      normalizeIdentifier(fixture.manifest?.readinessLevel) === 'demo-ready',
    'Despues de local-validation el manifest debe marcar la entrega funcional local segura como lista.',
  )
  pushFailure(
    failures,
    !fs.existsSync(path.join(fixture.projectRootPath, 'node_modules')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, '.env')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'Dockerfile')) &&
      !fs.existsSync(path.join(fixture.projectRootPath, 'docker-compose.yml')),
    'La cadena completa de fases seguras no debe crear node_modules, .env ni Docker.',
  )
  const validatedFrontendExecution = executeStaticFrontendBundle(fixture.projectRootPath)
  const normalizedValidatedFrontendHtml = normalizeText(
    validatedFrontendExecution.renderedHtml,
  )
  pushFailure(
    failures,
    (normalizedValidatedFrontendHtml.includes('entrega funcional local validada') ||
      normalizedValidatedFrontendHtml.includes('base local segura ya fue validada')) &&
      normalizedValidatedFrontendHtml.includes('review-and-expand') &&
      normalizedValidatedFrontendHtml.includes('core flow completo') &&
      normalizedValidatedFrontendHtml.includes('backend contracts') &&
      normalizedValidatedFrontendHtml.includes('database design') &&
      normalizedValidatedFrontendHtml.includes('local validation'),
    'La entrega renderizada por file:// debe mostrar entrega funcional local validada, core flow completo y review-and-expand.',
  )
  pushFailure(
    failures,
    !normalizedValidatedFrontendHtml.includes('siguiente fase segura</span><strong>backend-contracts') &&
      !normalizedValidatedFrontendHtml.includes('siguiente paso: backend-contracts'),
    'La demo renderizada por file:// no debe seguir mostrando backend-contracts como siguiente fase principal despues de local-validation.',
  )

  const reviewDecision = await requestReviewExpandDecision(fixture)
  pushFailure(
    failures,
    normalizeIdentifier(reviewDecision?.projectContinuationState?.nextRecommendedPhase) ===
      'review-and-expand',
    'Después de local-validation la continuidad debe dejar review-and-expand como siguiente fase.',
  )
  pushFailure(
    failures,
    !reviewDecision?.runtimeApprovalState && !reviewDecision?.approvalRequestPlan,
    'La continuidad segura completa no debe disparar approvals sensibles falsos.',
  )

  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'review-and-expand',
    requestId: 'operator-phase-review-and-expand',
  })
  const reviewManifest = fixture.manifest || {}
  const reviewAndExpandSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'review-and-expand.md'),
    'utf8',
  )
  const reviewValidationSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'validation-report.md'),
    'utf8',
  )
  const reviewRunbookSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'local-runbook.md'),
    'utf8',
  )
  const reviewMockDataSource = fs.readFileSync(
    path.join(fixture.projectRootPath, 'frontend', 'src', 'mock-data.js'),
    'utf8',
  )
  const normalizedReviewSurface = normalizeText(
    `${reviewAndExpandSource}\n${reviewValidationSource}\n${reviewRunbookSource}\n${reviewMockDataSource}`,
  )
  pushFailure(
    failures,
    normalizeIdentifier(getManifestPhase('review-and-expand')?.status) === 'done',
    'review-and-expand debe quedar en done dentro del manifest.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(reviewManifest?.lastCompletedPhase) === 'review-and-expand' &&
      normalizeIdentifier(reviewManifest?.nextRecommendedPhase) ===
        'prepare-reusable-candidate-plan',
    'review-and-expand debe dejar prepare-reusable-candidate-plan como siguiente accion segura.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewManifest?.availableActions) &&
      reviewManifest.availableActions.includes('prepare-reusable-candidate-plan') &&
      !reviewManifest.availableActions.includes('backend-contracts'),
    'review-and-expand no debe volver a ofrecer backend-contracts y debe exponer prepare-reusable-candidate-plan.',
  )
  pushFailure(
    failures,
    reviewManifest?.demoReady === true &&
      reviewManifest?.safeLocalDemoReady === true &&
      reviewManifest?.completedCoreFlow === true,
    'review-and-expand debe mantener demoReady, safeLocalDemoReady y completedCoreFlow en true.',
  )
  pushFailure(
    failures,
    normalizedReviewSurface.includes('review and expand') &&
      normalizedReviewSurface.includes('reusable candidate') &&
      normalizedReviewSurface.includes('prepare-reusable-candidate-plan') &&
      (normalizedReviewSurface.includes('no backend real') ||
        normalizedReviewSurface.includes('no se levanto backend real')) &&
      (normalizedReviewSurface.includes('no db real') ||
        normalizedReviewSurface.includes('no se creo una base de datos real')) &&
      normalizedReviewSurface.includes('docker') &&
      normalizedReviewSurface.includes('deploy'),
    'review-and-expand debe dejar docs y frontend sincronizados con reusable candidate y limites mock.',
  )
  const reviewedFrontendExecution = executeStaticFrontendBundle(fixture.projectRootPath)
  const normalizedReviewedFrontendHtml = normalizeText(
    reviewedFrontendExecution.renderedHtml,
  )
  pushFailure(
    failures,
    normalizedReviewedFrontendHtml.includes('review and expand completado') &&
      normalizedReviewedFrontendHtml.includes('prepare-reusable-candidate-plan') &&
      normalizedReviewedFrontendHtml.includes('core flow completo'),
    'La demo renderizada por file:// debe reflejar review-and-expand completado y reusable candidate.',
  )

  return {
    id: 'operator-phase-materialization-flow',
    label: 'Cadena segura scaffold -> frontend -> backend -> database -> validation -> review',
    failures,
  }
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

  const frontendArtifacts = readStaticFrontendArtifacts(fixture.projectRootPath)
  const simulatedBundle = executeStaticFrontendBundle(fixture.projectRootPath)
  const schemaContent = fs.readFileSync(
    path.join(fixture.projectRootPath, 'database', 'schema.sql'),
    'utf8',
  )
  const runbookContent = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'local-runbook.md'),
    'utf8',
  )
  const validationReportContent = fs.readFileSync(
    path.join(fixture.projectRootPath, 'docs', 'validation-report.md'),
    'utf8',
  )
  const sharedDomainContent = fs.readFileSync(
    path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
    'utf8',
  )
  const normalizedExpansionSurface = normalizeText(
    [
      frontendArtifacts.mockDataJs,
      frontendArtifacts.appJs,
      schemaContent,
      runbookContent,
      validationReportContent,
      sharedDomainContent,
    ].join('\n'),
  )
  const normalizedRenderedHtml = normalizeText(simulatedBundle.renderedHtml)

  pushStaticFrontendCompatibilityFailures(failures, frontendArtifacts)
  pushFailure(
    failures,
    normalizedExpansionSurface.includes('veterinaria') &&
      normalizedExpansionSurface.includes('mascotas'),
    `La expansion ${moduleId} debe seguir mostrando vocabulario de veterinaria dentro del flujo seguro.`,
  )
  pushFailure(
    failures,
    !normalizedExpansionSurface.includes('clinica medica') &&
      !normalizedExpansionSurface.includes('pediatria') &&
      !normalizedExpansionSurface.includes('paciente local'),
    `La expansion ${moduleId} no debe reintroducir clínica médica humana en un proyecto de veterinaria.`,
  )
  pushFailure(
    failures,
    normalizedRenderedHtml.includes('veterinaria') &&
      normalizedRenderedHtml.includes('modo local seguro'),
    `La demo renderizada tras expandir ${moduleId} debe seguir mostrándose como veterinaria local segura.`,
  )

  if (moduleId === 'notifications') {
    pushFailure(
      failures,
      normalizedExpansionSurface.includes('notificaciones'),
      'El modulo notifications debe dejar una superficie visible de notificaciones mock.',
    )
  }

  if (moduleId === 'reports') {
    pushFailure(
      failures,
      normalizedExpansionSurface.includes('reportes'),
      'El modulo reports debe dejar una superficie visible de reportes mock.',
    )
  }

  if (moduleId === 'inventory') {
    pushFailure(
      failures,
      normalizedExpansionSurface.includes('inventario') &&
        normalizedExpansionSurface.includes('stock'),
      'El modulo inventory debe dejar una superficie visible de inventario y stock mock.',
    )
  }

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
      goal: `Preparar un preview de npm install para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'npm-install',
    },
    {
      goal: `Preparar un preview de dev server para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'dev-server',
    },
    {
      goal: `Preparar un plan de base real para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'db-create',
    },
    {
      goal: `Preparar un preview de migraciones reales para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'db-migrate',
    },
    {
      goal: `Preparar un preview de seeds reales para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'db-seed',
    },
    {
      goal: `Preparar un preview de Dockerfile para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'dockerfile',
    },
    {
      goal: `Preparar un preview de docker-compose para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'docker-compose',
    },
    {
      goal: `Preparar un plan de deploy futuro para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'deploy',
    },
    {
      goal: `Preparar un plan de auth real para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'auth-real',
    },
    {
      goal: `Preparar un plan de pagos reales para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'payments-real',
    },
    {
      goal: `Preparar un plan de integracion externa para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'external-integration',
    },
    {
      goal: `Preparar un plan de secretos y .env para el proyecto ${fixture.projectRootRelativePath}.`,
      approvalType: 'secrets-env',
    },
    {
      goal: `Preparar un plan de GitHub remoto para el proyecto ${fixture.projectRootRelativePath}.`,
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

async function runExplicitRestrictionsSafeFlowCase() {
  const failures = []
  const goal =
    'Haceme un sistema fullstack local para una veterinaria, con clientes, mascotas, turnos, recordatorios, reportes e inventario básico. Quiero una demo local segura con datos mock, sin instalar dependencias, sin levantar backend real, sin crear base de datos real, sin ejecutar SQL, sin Docker, sin deploy y sin tocar integraciones externas.'
  const fixture = await buildFullstackFixture({
    workspaceName: 'operator-explicit-restrictions',
    goal,
    context: '',
    projectLabel: 'veterinaria segura',
  })
  const reviewDecision = await requestReviewExpandDecision(fixture)
  const scaffoldRoadmapPhase = getRoadmapPhaseEntry(
    fixture.phaseOneDecision?.implementationRoadmap,
    'scaffold-fullstack-local',
  )
  const approvalAreaTexts = Array.isArray(reviewDecision?.projectReadinessState?.approvalRequiredAreas)
    ? reviewDecision.projectReadinessState.approvalRequiredAreas
    : []
  const nextActionLabel = normalizeText(
    reviewDecision?.projectContinuationState?.nextRecommendedAction?.title ||
      reviewDecision?.nextActionPlan?.userFacingLabel ||
      '',
  )
  const initialPlannerNextActionLabel = normalizeText(
    fixture.phaseOneDecision?.nextActionPlan?.userFacingLabel ||
      fixture.phaseOneDecision?.nextActionPlan?.recommendedAction ||
      '',
  )

  pushFailure(
    failures,
    !reviewDecision?.runtimeApprovalState,
    'El scaffold seguro no debe crear runtimeApprovalState por restricciones explícitas ya respetadas.',
  )
  pushFailure(
    failures,
    !reviewDecision?.approvalRequestPlan,
    'El scaffold seguro no debe crear approvalRequestPlan por restricciones explícitas ya respetadas.',
  )
  pushFailure(
    failures,
    !fixture.phaseOneDecision?.runtimeApprovalState &&
      !fixture.phaseOneDecision?.approvalRequestPlan,
    'El plan fullstack inicial tampoco debe inflar approvalRequestPlan ni runtimeApprovalState cuando el pedido ya excluye todo lo sensible.',
  )
  pushFailure(
    failures,
    normalizeIdentifier(reviewDecision?.projectContinuationState?.nextRecommendedPhase) ===
      'frontend-mock-flow',
    'Después del scaffold seguro debe recomendar frontend-mock-flow.',
  )
  pushFailure(
    failures,
    scaffoldRoadmapPhase?.approvalRequired !== true,
    'implementationRoadmap.phases.scaffold-fullstack-local no debe pedir aprobación para la base local segura.',
  )
  pushFailure(
    failures,
    !nextActionLabel.includes('resolver aprobacion sensible'),
    'El siguiente paso no debe sugerir resolver una aprobación sensible cuando el flujo base sigue seguro.',
  )
  pushFailure(
    failures,
    !initialPlannerNextActionLabel.includes('resolver aprobacion sensible'),
    'El plan fullstack inicial no debe empujar a resolver una aprobación sensible si el pedido ya pidió evitar esas acciones.',
  )
  pushFailure(
    failures,
    !approvalAreaTexts.some((entry) =>
      normalizeText(entry).includes('resolver aprobacion sensible'),
    ),
    'approvalRequiredAreas no debe inflar un preview de resolver aprobación sensible para restricciones explícitas ya aceptadas.',
  )
  pushFailure(
    failures,
    Array.isArray(reviewDecision?.projectContinuationState?.availableSafeActions) &&
      reviewDecision.projectContinuationState.availableSafeActions.some(
        (entry) =>
          normalizeIdentifier(entry?.phaseId || entry?.id) === 'frontend-mock-flow' ||
          normalizeIdentifier(entry?.phaseId || entry?.id) === 'phase-frontend-mock-flow',
      ),
    'La continuidad debe dejar frontend-mock-flow como acción segura disponible.',
  )

  return {
    id: 'operator-explicit-restrictions-safe-flow',
    label: 'Restricciones explícitas no inflan aprobaciones del flujo seguro',
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
    `Preparar un plan de runtime local para el proyecto ${fixture.projectRootRelativePath}.`,
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
    `Preparar un plan de runtime local para el proyecto ${fixture.projectRootRelativePath}.`,
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
  pushFailure(
    failures,
    appSource.includes('Preparar entrega funcional local'),
    'La UI debe exponer el CTA para preparar una entrega funcional local.',
  )
  pushFailure(
    failures,
    appSource.includes('Aprobaciones futuras'),
    'La UI debe distinguir aprobaciones futuras del bloqueo actual.',
  )
  pushFailure(
    failures,
    appSource.includes('Preparar ejecucion local segura'),
    'La UI debe exponer el CTA para preparar una materialización segura desde un plan revisable.',
  )
  pushFailure(
    failures,
    appSource.includes('Preparar frontend local ejecutable'),
    'La UI debe exponer el CTA para preparar una materialización frontend local cuando corresponda.',
  )
  pushFailure(
    failures,
    appSource.includes('Materializar seguro'),
    'La UI debe mantener el CTA de materialización segura cuando corresponda.',
  )
  pushFailure(
    failures,
    !appSource.includes('Resolver aprobación sensible'),
    'La UI no debe exponer “Resolver aprobación sensible” como texto principal del flujo seguro.',
  )
  pushFailure(
    failures,
    appSource.includes('handlePrepareProjectPhase(resultMaterializationNextPhaseId)'),
    'El resultado final debe permitir preparar la siguiente fase segura sin obligar a volver al plan.',
  )
  pushFailure(
    failures,
    appSource.includes('Base local materializada'),
    'La UI debe poder mostrar Base local materializada como readiness visible luego del scaffold.',
  )
  pushFailure(
    failures,
    appSource.includes('Guardar como reusable después de validar'),
    'La UI debe bajar la sugerencia reusable hasta después de la validación local.',
  )
  pushFailure(
    failures,
    appSource.includes('Carpetas creadas') &&
      appSource.includes('Archivos escritos confirmados') &&
      appSource.includes('Archivos tocados') &&
      appSource.includes('Archivos previstos por plan'),
    'El resultado final debe resumir carpetas creadas y archivos escritos por separado.',
  )
  pushFailure(
    failures,
    appSource.includes('MEMORIA / Context Hub'),
    'La UI final debe mostrar si MEMORIA / Context Hub estuvo disponible o no.',
  )
  pushFailure(
    failures,
    appSource.includes('Próxima fase segura'),
    'La UI final debe seguir destacando la próxima fase segura para el operador.',
  )
  pushFailure(
    failures,
    appSource.includes('Contiene el texto esperado.'),
    'El detalle de validaciones debe explicar file-contains con un texto útil.',
  )

  pushFailure(
    failures,
    /const settlePlannerReviewRun\s*=\s*\(\)\s*=>\s*\{/.test(appSource),
    'App.tsx debe definir settlePlannerReviewRun para cerrar approval-pending cuando la replanificacion termina en review-only.',
  )
  pushFailure(
    failures,
    /settlePlannerReviewRun\(\)\s*[\r\n\s]*setSessionStatus\('Plan listo para revision'\)/.test(
      appSource,
    ),
    'La rama review-only debe cerrar la corrida antes de dejar el estado en Plan listo para revision.',
  )
  pushFailure(
    failures,
    /if \(response\.completed\)\s*\{[\s\S]{0,400}?settlePlannerReviewRun\(\)[\s\S]{0,200}?setSessionStatus\('Ejecuci.n completada'\)/.test(
      appSource,
    ),
    'La rama completed despues de una replanificacion debe cerrar la corrida activa y no dejar approval-pending colgado.',
  )

  return {
    id: 'operator-ui-helper-sanity',
    label: 'Helpers criticos de continuidad definidos en UI',
    failures,
  }
}

async function runTrackingLogisticsPostApprovalUiStateRealCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')

  pushFailure(
    failures,
    /const sanitizePlannerDecisionResponse\s*=\s*\(/.test(appSource),
    'App.tsx debe sanear respuestas planner-only antes de renderizar el estado post-approval.',
  )
  pushFailure(
    failures,
    /approvalRequired:\s*false[\s\S]{0,200}?requiresApproval:\s*false[\s\S]{0,200}?question:\s*''[\s\S]{0,200}?approvalRequest:\s*undefined/.test(
      appSource,
    ),
    'La sanitizacion post-approval debe limpiar approvalRequired, requiresApproval, question y approvalRequest stale.',
  )
  pushFailure(
    failures,
    /approvalRequestPlan:\s*null[\s\S]{0,120}?runtimeApprovalState:\s*null/.test(
      appSource,
    ),
    'La sanitizacion post-approval debe bajar approvalRequestPlan y runtimeApprovalState.',
  )
  pushFailure(
    failures,
    /actionType:\s*replaceWithReviewPlan\s*\?\s*'review-plan'/.test(appSource) &&
      /review-scalable-delivery/.test(appSource),
    'La proxima accion stale debe volver a review-plan/review-scalable-delivery.',
  )
  pushFailure(
    failures,
    /const rawResponse = await window\.aiOrchestrator\?\.planTask\?\.\([\s\S]{0,220}?const response = sanitizePlannerDecisionResponse\(rawResponse\)[\s\S]{0,160}?const plannerApprovalRequired =[\s\S]{0,120}?shouldTreatPlannerResponseAsApprovalRequired\(response\)/.test(
      appSource,
    ),
    'replanManualFlow debe sanear la respuesta antes de decidir aprobacion o error.',
  )
  pushFailure(
    failures,
    /const rawPlanResponse = await window\.aiOrchestrator\?\.planTask\?\.\([\s\S]{0,520}?const planResponse = sanitizePlannerDecisionResponse\(rawPlanResponse\)[\s\S]{0,260}?const plannerApprovalRequired =[\s\S]{0,220}?shouldTreatPlannerResponseAsApprovalRequired\(planResponse\)/.test(
      appSource,
    ),
    'runAutoFlowLoop debe sanear la replanificacion antes de mostrar pending approval.',
  )
  pushFailure(
    failures,
    /const rawResponse = await window\.aiOrchestrator\?\.planTask\?\.\(\{[\s\S]{0,260}?const response = sanitizePlannerDecisionResponse\(rawResponse\)[\s\S]{0,160}?const plannerApprovalRequired =[\s\S]{0,120}?shouldTreatPlannerResponseAsApprovalRequired\(response\)/.test(
      appSource,
    ),
    'handleGenerateNextStep debe sanear el payload antes de ramificar por approval.',
  )
  pushFailure(
    failures,
    /status:\s*plannerApprovalRequired\s*\?\s*'warning'\s*:\s*'success'/.test(
      appSource,
    ),
    'La UI debe derivar el estado visual desde plannerApprovalRequired ya saneado.',
  )
  pushFailure(
    failures,
    /if \(shouldIgnoreStaleApprovalRequestPayload\(sanitizedPayload\)\)\s*\{\s*return null/.test(
      appSource,
    ),
    'approvalRequest stale debe ignorarse cuando la nueva respuesta ya volvio a review-only.',
  )

  return {
    id: 'tracking-logistico-fullstack-post-approval-ui-state-real',
    label: 'Tracking logistico fullstack post approval UI state real',
    failures,
  }
}

async function runTrackingLogisticsOpenAIWebScaffoldGuardCase() {
  const failures = []
  const mainSource = fs.readFileSync(mainFilePath, 'utf8')

  pushFailure(
    failures,
    /function looksLikeWebScaffoldDecisionPayload\(rawDecision\)/.test(mainSource),
    'electron/main.cjs debe definir un detector de payload degradado tipo web-scaffold-base.',
  )
  pushFailure(
    failures,
    /const shouldGuardOpenAIWebScaffoldRegression =[\s\S]{0,500}?fallbackDecision\?\.strategy === 'scalable-delivery-plan'[\s\S]{0,500}?originalFullstackLocalIntent[\s\S]{0,500}?rawLooksLikeWebScaffoldRegression/.test(
      mainSource,
    ),
    'normalizeOpenAIBrainDecision debe activar un guard fuerte contra degradacion OpenAI a web-scaffold-base.',
  )
  pushFailure(
    failures,
    /const shouldForceFallbackFullstackLocalContracts =[\s\S]{0,180}?shouldGuardOpenAIWebScaffoldRegression/.test(
      mainSource,
    ),
    'El guard de web-scaffold-base debe forzar los contratos fallback fullstack-local.',
  )
  pushFailure(
    failures,
    /question:\s*brainDecision\.requiresApproval === true \? brainDecision\.question : ''/.test(
      mainSource,
    ),
    'La salida final no debe exponer question stale cuando ya no hay approval activa.',
  )
  pushFailure(
    failures,
    /approvalRequest:\s*[\r\n\s]*brainDecision\.requiresApproval === true \? brainDecision\.approvalRequest : null/.test(
      mainSource,
    ),
    'La salida final no debe exponer approvalRequest stale cuando ya no hay approval activa.',
  )

  return {
    id: 'tracking-logistico-fullstack-openai-web-scaffold-guard',
    label: 'Tracking logistico fullstack OpenAI web scaffold guard',
    failures,
  }
}

async function runTrackingLogisticsPostApprovalReviewStateCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')

  pushFailure(
    failures,
    /const replanGoal =/.test(appSource) &&
      /setPlannerRequestSnapshot\(\{\s*[\r\n\s]*goal: replanGoal,\s*[\r\n\s]*context: currentExecutionContext,/.test(
        appSource,
      ),
    'replanManualFlow debe persistir el goal/context efectivos del replan para no perder la continuacion post-approval.',
  )
  pushFailure(
    failures,
    /if \(isReviewOnlyPlannerResponse\(response\)\) \{[\s\S]{0,220}?clearVisibleExecutionRuntimeState\(\)[\s\S]{0,120}?settlePlannerReviewRun\(\)[\s\S]{0,220}?setSessionStatus\('Plan listo para revision'\)/.test(
      appSource,
    ),
    'replanManualFlow debe cerrar la corrida review-only antes de dejar la UI en Plan listo para revision.',
  )
  pushFailure(
    failures,
    /if \(isReviewOnlyPlannerResponse\(planResponse\)\) \{[\s\S]{0,220}?clearVisibleExecutionRuntimeState\(\)[\s\S]{0,120}?settlePlannerReviewRun\(\)[\s\S]{0,220}?setSessionStatus\('Plan listo para revision'\)/.test(
      appSource,
    ),
    'runAutoFlowLoop debe cerrar la corrida review-only antes de dejar la UI en Plan listo para revision.',
  )
  pushFailure(
    failures,
    /if \(isReviewOnlyPlannerResponse\(response\)\) \{[\s\S]{0,220}?clearVisibleExecutionRuntimeState\(\)[\s\S]{0,120}?settlePlannerReviewRun\(\)[\s\S]{0,220}?setSessionStatus\('Plan listo para revision'\)/.test(
      appSource,
    ),
    'handleGenerateNextStep debe cerrar la corrida review-only antes de dejar la UI en Plan listo para revision.',
  )
  pushFailure(
    failures,
    !/const replanManualFlow = async \([\s\S]{0,5000}?setPlannerRequestSnapshot\(\{\s*[\r\n\s]*goal: plannerGoal,\s*[\r\n\s]*context: plannerContext,/.test(
      appSource,
    ),
    'replanManualFlow no debe seguir usando plannerGoal/plannerContext fuera de scope.',
  )

  return {
    id: 'tracking-logistico-fullstack-post-approval-review-state',
    label: 'Tracking logistico fullstack post approval review state',
    failures,
  }
}

async function runTrackingLogisticsPreparedPlanUpdatesUiCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const helperSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')
  const preparedFullstackResponseIndex = appSource.indexOf(
    'const plannerHasPreparedFullstackLocalMaterializationResponse =',
  )
  const preparedFullstackIndex = appSource.indexOf(
    'const plannerHasPreparedFullstackLocalMaterialization =',
  )
  const preparedExecutorIndex = appSource.indexOf(
    'const plannerHasPreparedExecutorMaterialization =',
  )
  const scalableDeliveryVisibilityIndex = appSource.indexOf(
    'const shouldShowScalableDeliveryPlan =',
  )
  const planOverviewTitleIndex = appSource.indexOf('const planOverviewTitle =')
  const planOverviewHelperTextIndex = appSource.indexOf(
    'const planOverviewHelperText =',
  )

  pushFailure(
    failures,
    helperSource.includes(
      "export const isPreparedFullstackLocalMaterializationResponse = (value) => {",
    ) &&
      helperSource.includes("normalizedStrategy === 'materialize-fullstack-local-plan'") &&
      helperSource.includes("normalizedExecutionMode === 'executor'") &&
      helperSource.includes("normalizedNextExpectedAction === 'execute-plan'") &&
      helperSource.includes("normalizedDecisionKey.startsWith('materialize-fullstack-local-')") &&
      helperSource.includes('value?.approvalRequired !== true') &&
      helperSource.includes('value?.requiresApproval !== true') &&
      /const plannerHasPreparedFullstackLocalMaterializationResponse =[\s\S]{0,160}?isPreparedFullstackLocalMaterializationResponse\(plannerExecutionMetadata\)/.test(
        appSource,
      ) &&
      /const plannerHasPreparedFullstackLocalMaterialization =[\s\S]{0,220}?plannerMaterializationUiState\.fullstackMaterializationResponseReady[\s\S]{0,220}?!plannerMaterializationUiState\.effectiveReviewOnly/.test(
        appSource,
      ),
    'La UI debe detectar la respuesta materialize-fullstack-local-plan activa aun antes de completar el contrato canonico.',
  )
  pushFailure(
    failures,
    /const plannerHasPreparedExecutorMaterialization =[\s\S]{0,160}?plannerHasPreparedSafeMaterialization[\s\S]{0,160}?plannerHasCanonicalFullstackLocalMaterialization/.test(
      appSource,
    ),
    'La UI debe reservar el estado ejecutable para safe-first o contratos fullstack canonicos completos.',
  )
  pushFailure(
    failures,
    /const shouldShowScalableDeliveryPlan =[\s\S]{0,160}?plannerMaterializationUiState\.shouldShowScalableDeliveryPlan/.test(
      appSource,
    ),
    'La UI no debe seguir mostrando el scalableDeliveryPlan cuando ya hay una materialización fullstack local preparada.',
  )
  pushFailure(
    failures,
    /const planOverviewTitle = plannerHasPreparedExecutorMaterialization[\s\S]{0,120}\?\s*'Entrega lista para materializar'/.test(
      appSource,
    ),
    'El overview del plan debe pasar a Entrega lista para materializar cuando el plan materializable ya quedó activo.',
  )
  pushFailure(
    failures,
    /const planOverviewTitle = plannerHasPreparedExecutorMaterialization[\s\S]{0,220}: plannerHasPreparedFullstackLocalMaterialization[\s\S]{0,120}\?\s*'Entrega preparada con diagnostico pendiente'/.test(
      appSource,
    ),
    'La UI debe distinguir una materializacion fullstack activa pero incompleta antes de mostrar Entrega lista para materializar.',
  )
  pushFailure(
    failures,
    appSource.includes('derivePlannerMaterializationUiState({') &&
      appSource.includes('plannerExecutionMetadata: nextExecutionMetadata') &&
      appSource.includes('effectivePlannerExecutionMetadata: nextExecutionMetadata') &&
      /if \([\s\S]{0,140}?preparedSafeMaterializationReady[\s\S]{0,140}?\|\|[\s\S]{0,140}?preparedFullstackLocalMaterializationReady[\s\S]{0,800}?setSessionStatus\('Plan generado'\)/.test(
        appSource,
      ),
    'handleGenerateNextStep debe aplicar un materialize-fullstack-local-plan valido como Plan generado.',
  )
  pushFailure(
    failures,
    /preparedFullstackLocalMaterializationReady[\s\S]{0,500}?Materializar entrega/.test(
      appSource,
    ),
    'La rama materializable fullstack local debe dejar trazas explicitas del estado Materializar entrega, incluso cuando el contrato quede bloqueado por diagnostico.',
  )
  pushFailure(
    failures,
    preparedFullstackResponseIndex >= 0 &&
      preparedFullstackIndex > preparedFullstackResponseIndex &&
      preparedExecutorIndex > preparedFullstackIndex &&
      scalableDeliveryVisibilityIndex > preparedFullstackIndex &&
      planOverviewTitleIndex > preparedFullstackIndex &&
      planOverviewHelperTextIndex > preparedFullstackIndex,
    'Las banderas de respuesta materializable fullstack deben declararse antes de cualquier derivación visible que las use para evitar TDZ en el renderer.',
  )

  return {
    id: 'tracking-logistico-fullstack-prepared-plan-updates-ui',
    label: 'Tracking logistico fullstack prepared plan updates UI',
    failures,
  }
}

async function runTrackingLogisticsCanonicalPreparedContractUiCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const helperSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')

  pushFailure(
    failures,
    /export const inspectPreparedFullstackLocalMaterialization = \(\{/.test(helperSource),
    'La UI debe concentrar la inspeccion del contrato materializable fullstack local en un helper reutilizable.',
  )
  pushFailure(
    failures,
    /const buildFullstackLocalMaterializationCoherenceIssue =[\s\S]{0,1200}?inspectPreparedFullstackLocalMaterialization\(\{[\s\S]{0,160}?metadata,[\s\S]{0,160}?sourcePlan[\s\S]{0,160}?\}\)/.test(
      appSource,
    ),
    'La coherencia fullstack del renderer debe delegar en la inspeccion canonica del contrato materializable.',
  )
  pushFailure(
    failures,
    !/const missingExpectedPaths =/.test(appSource),
    'La validacion del renderer no debe exigir una preservacion 1:1 de todos los paths prometidos por el scalable plan si el contrato canonico fullstack ya es valido.',
  )
  pushFailure(
    failures,
    /const plannerMaterializationUiState =[\s\S]{0,220}?derivePlannerMaterializationUiState\(/.test(
      appSource,
    ) &&
      /const preparedFullstackLocalMaterializationInspection =[\s\S]{0,160}?plannerMaterializationUiState\.contractInspection/.test(
        appSource,
      ) &&
      /const plannerHasCanonicalFullstackLocalMaterialization =[\s\S]{0,160}?plannerMaterializationUiState\.fullstackMaterializationContractReady/.test(
        appSource,
      ),
    'El renderer debe conservar una señal canonica separada para el contrato fullstack materializable.',
  )
  pushFailure(
    failures,
    /const preparedFullstackLocalMaterializationInspection =[\s\S]{0,260}?inspectPreparedFullstackLocalMaterialization\(\{[\s\S]{0,120}?nextExecutionMetadata[\s\S]{0,120}?activeScalableDeliveryPlan[\s\S]{0,120}?\}\)/.test(
      appSource,
    ),
    'handleGenerateNextStep debe seguir usando la misma inspeccion canonica para diagnosticar el contrato fullstack materializable.',
  )

  return {
    id: 'tracking-logistico-fullstack-canonical-prepared-contract-ui',
    label: 'Tracking logistico fullstack canonical prepared contract UI',
    failures,
  }
}

async function runTrackingLogisticsHeaderOnlyMaterializeFallbackExitsReviewCase() {
  const failures = []
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const scalableMetadata =
    result.baseDecision && typeof result.baseDecision === 'object'
      ? result.baseDecision
      : null

  if (!scalableMetadata?.scalableDeliveryPlan) {
    return {
      id: 'tracking-logistico-header-only-materialize-fallback-exits-review',
      label: 'Tracking logistico header-only materialize fallback exits review',
      failures: [
        'No se pudo obtener un scalableDeliveryPlan base para simular el fallback header-only del renderer.',
      ],
    }
  }

  const headerOnlyMaterializeMetadata = {
    ...scalableMetadata,
    decisionKey: 'materialize-fullstack-local-plan',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    approvalRequired: false,
    requiresApproval: false,
    reason: 'OpenAI superó timeout; local-rules devolvió la cabecera materializable.',
    tasks: Array.isArray(scalableMetadata.tasks)
      ? scalableMetadata.tasks.slice(0, 3)
      : [{ title: 'Preparar scaffold local' }],
    executionScope: null,
    materializationPlan: null,
    brainAdapter: { id: 'local-rules' },
    brainRoutingDecision: {
      selectedProvider: 'local-rules',
      fallbackUsed: true,
      fallbackReason: 'OpenAI superó timeout',
    },
  }
  const scalableUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableMetadata,
    effectivePlannerExecutionMetadata: scalableMetadata,
  })
  const materializeUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: headerOnlyMaterializeMetadata,
    effectivePlannerExecutionMetadata: headerOnlyMaterializeMetadata,
  })

  pushFailure(
    failures,
    scalableUiState.effectiveReviewOnly === true,
    'La fase 1 debe seguir en review-only mientras la decision base sea scalable-delivery-plan.',
  )
  pushFailure(
    failures,
    scalableUiState.shouldShowScalableDeliveryPlan === true,
    'La fase 1 debe seguir mostrando el scalableDeliveryPlan revisable.',
  )
  pushFailure(
    failures,
    materializeUiState.fullstackMaterializationResponseReady === true,
    'La fase 2 debe reconocer la cabecera materializable fullstack aunque el fallback no haya completado el contrato canonico.',
  )
  pushFailure(
    failures,
    materializeUiState.fullstackMaterializationContractReady === false,
    'La simulacion header-only debe conservar el contrato incompleto para reproducir el bug real del renderer.',
  )
  pushFailure(
    failures,
    materializeUiState.effectiveReviewOnly === false,
    'La UI no debe seguir en review-only cuando ya entro una respuesta executor materialize-fullstack-local-plan.',
  )
  pushFailure(
    failures,
    materializeUiState.shouldShowScalableDeliveryPlan === false,
    'La UI no debe seguir mostrando el scalableDeliveryPlan anterior cuando la respuesta materializable ya quedo activa.',
  )
  pushFailure(
    failures,
    materializeUiState.materializeCtaVisible === true,
    'La UI final debe mostrar el estado materializable aunque el fallback solo haya traido la cabecera.',
  )
  pushFailure(
    failures,
    materializeUiState.materializeCtaEnabled === false,
    'La UI no debe habilitar Materializar entrega si el fallback solo trajo una cabecera materializable sin contrato canonico.',
  )
  pushFailure(
    failures,
    typeof materializeUiState.materializeCtaDisabledReason === 'string' &&
      materializeUiState.materializeCtaDisabledReason.trim().length > 0,
    'La UI debe exponer un diagnostico explicito cuando la materializacion fullstack quede incompleta.',
  )
  pushFailure(
    failures,
    materializeUiState.uiState === 'materialization-incomplete',
    'La fase 2 header-only debe quedar en un estado materializable incompleto, no en review escalable ni en ejecucion habilitada.',
  )

  return {
    id: 'tracking-logistico-header-only-materialize-fallback-exits-review',
    label: 'Tracking logistico header-only materialize fallback exits review',
    failures,
  }
}

async function runTrackingLogisticsDerivedExecutePlanMaterializeCase() {
  const failures = []
  const scalableMetadata = {
    decisionKey: 'logitrack-fullstack-local-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    businessSector: 'logistics',
    creativeProfile: 'admin-console-practical',
    requiresApproval: false,
    scalableDeliveryPlan: {
      reason: 'Tracking logistico fullstack local revisable.',
      directories: ['backend/src/routes', 'frontend/admin', 'frontend/public', 'database', 'docs', 'shared'],
      filesToCreate: [
        { path: 'backend/src/server.js' },
        { path: 'frontend/admin/index.html' },
        { path: 'database/schema.sql' },
      ],
      targetStructure: ['backend', 'frontend', 'database', 'docs', 'shared'],
      allowedRootPaths: ['logitrack-local-v1'],
    },
    tasks: [
      { title: 'API', targetPath: 'backend/src/server.js' },
      { title: 'Tracking', targetPath: 'backend/src/routes/tracking.js' },
      { title: 'DB', targetPath: 'database/schema.sql' },
    ],
  }
  const phaseTwoMetadata = {
    ...scalableMetadata,
    decisionKey: 'materialize-fullstack-local-logitrack-v1-001',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: '',
    requiresApproval: false,
    approvalRequired: false,
    businessSector: 'logistics',
    creativeProfile: 'system-default',
  }
  const scalableUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableMetadata,
    effectivePlannerExecutionMetadata: scalableMetadata,
  })
  const materializeUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: phaseTwoMetadata,
    effectivePlannerExecutionMetadata: phaseTwoMetadata,
  })

  pushFailure(
    failures,
    scalableUiState.prepareCtaVisible === true,
    'El Caso A debe seguir mostrando Preparar entrega funcional local antes del click.',
  )
  pushFailure(
    failures,
    materializeUiState.fullstackMaterializationResponseReady === true,
    'La fase 2 debe reconocer una respuesta materializable activa aunque nextExpectedAction venga ausente pero derivable.',
  )
  pushFailure(
    failures,
    materializeUiState.effectiveReviewOnly === false,
    'La fase 2 derivable no debe seguir en review-only.',
  )
  pushFailure(
    failures,
    materializeUiState.shouldShowScalableDeliveryPlan === false,
    'La fase 2 derivable no debe volver a mostrar el scalable-delivery-plan como estado activo.',
  )
  pushFailure(
    failures,
    materializeUiState.materializeCtaVisible === true,
    'La fase 2 derivable debe pasar a estado materializable visible.',
  )
  pushFailure(
    failures,
    materializeUiState.uiState === 'materialization-incomplete',
    'Sin contrato canónico completo, la fase 2 derivable debe quedar en materialization-incomplete y no volver al review escalable.',
  )
  pushFailure(
    failures,
    materializeUiState.materializeCtaEnabled === false,
    'La fase 2 derivable no debe habilitar Materializar entrega si todavía no hay contrato canónico.',
  )

  return {
    id: 'tracking-logistico-derived-execute-plan-materialize',
    label: 'Tracking logistico derived execute plan materialize',
    failures,
  }
}

async function runRendererDoesNotInventOnlineCoursesMaterializationContractCase() {
  const failures = []
  const plannerUiStateSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')
  const metadata = {
    decisionKey: 'materialize-fullstack-local-generic-v1',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    requiresApproval: false,
    approvalRequired: false,
    businessSector: 'education-training',
    executionScope: {
      allowedTargetPaths: ['generic-local', 'generic-local/**'],
    },
    materializationPlan: {
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'generic-local',
      allowedTargetPaths: ['generic-local', 'generic-local/**'],
      operations: [
        { targetPath: 'generic-local/backend/src/server.js' },
        { targetPath: 'generic-local/database/schema.sql' },
      ],
    },
  }
  const inspection = inspectPreparedFullstackLocalMaterialization({
    metadata,
    sourcePlan: null,
  })
  const uiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: metadata,
    effectivePlannerExecutionMetadata: metadata,
  })
  const inspectionSurface = normalizeText(JSON.stringify(inspection || {}))

  pushFailure(
    failures,
    !plannerUiStateSource.includes('online-courses-fullstack-local'),
    'planner-ui-state.js no debe reconstruir contractKind online-courses-fullstack-local en runtime del renderer.',
  )
  pushFailure(
    failures,
    !plannerUiStateSource.includes('edu-platform-local'),
    'planner-ui-state.js no debe inventar roots tipo edu-platform-local en el renderer.',
  )
  pushFailure(
    failures,
    !plannerUiStateSource.includes('backend/src/routes/courses.js'),
    'planner-ui-state.js no debe imponer requiredPathGroups específicos de cursos online.',
  )
  pushFailure(
    failures,
    inspection?.ok === false,
    'Sin generatedDomainContract ni materializationContract explícito, la inspección debe quedar incompleta.',
  )
  pushFailure(
    failures,
    inspection?.contractKind === '',
    `Sin contrato universal, el renderer no debe inventar contractKind por dominio. Recibido: ${inspection?.contractKind || '(vacío)'}.`,
  )
  pushFailure(
    failures,
    normalizeText(inspection?.reason || '').includes('generateddomaincontract') ||
      normalizeText(inspection?.reason || '').includes('materializationcontract universal'),
    'La inspección incompleta debe explicar que falta un contrato universal explícito.',
  )
  pushFailure(
    failures,
    !inspectionSurface.includes('online-courses') && !inspectionSurface.includes('edu-platform-local'),
    'La inspección genérica no debe contaminarse con online-courses ni roots canónicos inventados.',
  )
  pushFailure(
    failures,
    uiState?.fullstackMaterializationResponseReady === true &&
      uiState?.fullstackMaterializationContractReady === false &&
      uiState?.materializeCtaVisible === true &&
      uiState?.materializeCtaEnabled === false &&
      uiState?.uiState === 'materialization-incomplete',
    'La UI debe seguir mostrando la fase materializable como incompleta cuando falta contrato universal, sin volver al review ni habilitar materialización.',
  )

  return {
    id: 'renderer-does-not-invent-online-courses-materialization-contract',
    label: 'Renderer does not invent online courses materialization contract',
    failures,
  }
}

async function runTrackingLogisticsCompleteMaterializeEnablesCtaCase() {
  const failures = []
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const decision = result.decision && typeof result.decision === 'object' ? result.decision : null

  if (!decision) {
    return {
      id: 'tracking-logistico-complete-materialize-enables-cta',
      label: 'Tracking logistico complete materialize enables CTA',
      failures: [
        'No se pudo obtener la decision materialize-fullstack-local-plan para validar el estado ejecutable.',
      ],
    }
  }

  const materializeUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: decision,
    effectivePlannerExecutionMetadata: decision,
  })

  pushFailure(
    failures,
    materializeUiState.fullstackMaterializationResponseReady === true,
    'La fase materializable completa debe reconocer la respuesta executor fullstack local.',
  )
  pushFailure(
    failures,
    materializeUiState.fullstackMaterializationContractReady === true,
    'La fase materializable completa debe pasar la validacion canonica del contrato.',
  )
  pushFailure(
    failures,
    materializeUiState.effectiveReviewOnly === false,
    'La fase materializable completa no debe seguir en review-only.',
  )
  pushFailure(
    failures,
    materializeUiState.shouldShowScalableDeliveryPlan === false,
    'La fase materializable completa no debe seguir mostrando el scalableDeliveryPlan anterior.',
  )
  pushFailure(
    failures,
    materializeUiState.materializeCtaVisible === true,
    'La fase materializable completa debe mostrar Materializar entrega.',
  )
  pushFailure(
    failures,
    materializeUiState.materializeCtaEnabled === true,
    'La fase materializable completa debe habilitar Materializar entrega solo cuando el contrato canonico este completo.',
  )
  pushFailure(
    failures,
    materializeUiState.uiState === 'materialization-ready',
    'La fase materializable completa debe quedar en estado materialization-ready.',
  )

  return {
    id: 'tracking-logistico-complete-materialize-enables-cta',
    label: 'Tracking logistico complete materialize enables CTA',
    failures,
  }
}

async function runTrackingLogisticsIgnoredDetectedProjectDoesNotBlockMaterializeCase() {
  const failures = []
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const decision = result.decision && typeof result.decision === 'object' ? result.decision : null

  if (!decision) {
    return {
      id: 'tracking-logistico-ignored-detected-project-does-not-block-materialize',
      label: 'Tracking logistico ignored detected project does not block materialize',
      failures: [
        'No se pudo obtener la decision materialize-fullstack-local-plan para validar la contaminación de proyecto detectado fuera de alcance.',
      ],
    }
  }

  const contaminatedDecision = {
    ...cloneJson(decision),
    existingProjectDetection: {
      detected: true,
      applicable: false,
      projectRoot: 'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\web-prueba\\fullstack-local-veterinaria',
      domain: 'fullstack-local-veterinaria',
      reason: 'Proyecto detectado pero fuera de alcance para esta corrida.',
    },
    localProjectManifest: {
      domain: 'fullstack-local-veterinaria',
      modules: ['turnos', 'pacientes', 'mascotas'],
    },
    activeProjectContext: {
      mode: 'new-project',
      source: 'new-project-plan',
      note: 'Se detectó fullstack-local-veterinaria, pero el pedido actual describe un proyecto nuevo y queda fuera de alcance para esta corrida.',
    },
  }
  const inspection = inspectPreparedFullstackLocalMaterialization({
    metadata: contaminatedDecision,
    sourcePlan:
      contaminatedDecision.scalableDeliveryPlan &&
      typeof contaminatedDecision.scalableDeliveryPlan === 'object'
        ? contaminatedDecision.scalableDeliveryPlan
        : null,
  })

  pushFailure(
    failures,
    inspection.ok === true,
    'Un proyecto detectado pero marcado como applicable=false no debe contaminar ni bloquear una materializacion fullstack valida.',
  )
  pushFailure(
    failures,
    Array.isArray(inspection.forbiddenSignalsFound) &&
      inspection.forbiddenSignalsFound.length === 0,
    'La inspeccion canonica no debe marcar veterinaria como contaminación si ese proyecto ya quedó fuera de alcance.',
  )

  return {
    id: 'tracking-logistico-ignored-detected-project-does-not-block-materialize',
    label: 'Tracking logistico ignored detected project does not block materialize',
    failures,
  }
}

async function runMaterializeFullstackLocalPlanResponseOverridesReviewStateCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const plannerUiStateSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')

  pushFailure(
    failures,
    /const plannerIsScalableDeliveryReview =\s*plannerReviewUiState\.isScalableReview === true/.test(
      appSource,
    ) &&
      /const plannerMaterializationUiState =[\s\S]{0,220}?derivePlannerMaterializationUiState\(/.test(
        appSource,
      ),
    'App.tsx debe consumir el estado review escalable desde el helper central para no duplicar reglas y no dejar stale el renderer.',
  )
  pushFailure(
    failures,
    plannerUiStateSource.includes("normalizedExecutionMode !== 'executor'") &&
      plannerUiStateSource.includes('!responseReady'),
    'El helper debe distinguir review planner-only de respuesta materializable activa para que materialize-fullstack-local-plan salga del review escalable.',
  )
  pushFailure(
    failures,
    /const canExecuteInstruction =[\s\S]{0,260}?!plannerIsReviewOnly[\s\S]{0,260}!plannerHasPreparedFullstackLocalMaterialization[\s\S]{0,260}\|\|[\s\S]{0,260}plannerHasCanonicalFullstackLocalMaterialization/.test(
      appSource,
    ),
    'El CTA Materializar entrega debe depender de salir del review-only y de tener contrato canonico completo cuando la respuesta sea materialize-fullstack-local-plan.',
  )

  return {
    id: 'materialize-fullstack-local-plan-response-overrides-review-state',
    label: 'Materialize fullstack local plan response overrides review state',
    failures,
  }
}

async function runTrackingLogisticsScalableReviewShowsPrepareCtaCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const plannerUiStateSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')
  const scalableReviewMetadata = {
    decisionKey: 'logitrack-fullstack-local-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    businessSector: 'logistics',
    creativeProfile: 'admin-console-practical',
    requiresApproval: false,
    scalableDeliveryPlan: {
      reason: 'Tracking logistico fullstack local revisable antes de preparar la materializacion.',
      directories: ['backend/src/routes', 'frontend/admin', 'frontend/public', 'database', 'docs', 'shared'],
      filesToCreate: [
        { path: 'backend/src/server.js' },
        { path: 'backend/src/routes/shipments.js' },
        { path: 'frontend/admin/index.html' },
        { path: 'frontend/public/index.html' },
        { path: 'database/schema.sql' },
      ],
      targetStructure: ['backend', 'frontend', 'database', 'docs', 'shared'],
      allowedRootPaths: ['logitrack-fullstack-local-v1'],
    },
    tasks: [
      { title: 'API de envios', targetPath: 'backend/src/server.js' },
      { title: 'Rutas de tracking', targetPath: 'backend/src/routes/tracking.js' },
      { title: 'Panel admin', targetPath: 'frontend/admin/index.html' },
      { title: 'Consulta publica', targetPath: 'frontend/public/index.html' },
      { title: 'Base local', targetPath: 'database/schema.sql' },
    ],
  }
  const scalableReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableReviewMetadata,
    effectivePlannerExecutionMetadata: scalableReviewMetadata,
  })

  pushFailure(
    failures,
    scalableReviewUiState.effectiveReviewOnly === true,
    'El review inicial fullstack local debe seguir en planner-only/review-only antes de preparar la entrega.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.isScalableReview === true,
    'El payload real review-scalable-delivery debe quedar reconocido como review escalable activo.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.looksLikeFullstackLocalReview === true,
    'La UI debe detectar el review fullstack local aun cuando OpenAI no complete deliveryLevel ni nextActionPlan, usando decisionKey, estructura y tareas.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.canPrepareFullstackLocal === true,
    'El review escalable fullstack local debe habilitar la preparación segura antes de cualquier materialización.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaVisible === true,
    'El CTA Preparar entrega funcional local debe quedar visible en el review inicial válido.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaLabel === 'Preparar entrega funcional local',
    'El review escalable fullstack local debe mostrar el label Preparar entrega funcional local.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.materializeCtaVisible === false,
    'El review escalable inicial no debe mostrar Materializar entrega todavía.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.materializeCtaEnabled === false,
    'El review escalable inicial no debe habilitar Materializar entrega todavía.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.uiState === 'review-scalable-delivery',
    'El caso A debe mantener el uiState review-scalable-delivery hasta preparar la entrega.',
  )
  pushFailure(
    failures,
    plannerUiStateSource.includes('currentMetadata?.decisionKey') &&
      plannerUiStateSource.includes('currentMetadata?.businessSector') &&
      plannerUiStateSource.includes('task.targetPath'),
    'El helper del renderer debe considerar decisionKey, businessSector y tareas reales para no perder el CTA de preparación cuando OpenAI omite deliveryLevel o nextActionPlan.',
  )
  pushFailure(
    failures,
    /prepareMaterializationKind=\{plannerScalableReviewPreparationKind\}/.test(appSource),
    'La card del scalableDeliveryPlan debe recibir el kind de preparación derivado para no perder el CTA cuando falten campos opcionales del plan.',
  )
  pushFailure(
    failures,
    /if \(plannerScalableReviewPreparationKind !== 'fullstack-local'\)/.test(appSource),
    'El handler real del CTA debe usar la misma inferencia de preparación que el renderer para evitar botones visibles pero no accionables.',
  )

  return {
    id: 'tracking-logistico-scalable-review-shows-prepare-cta',
    label: 'Tracking logistico scalable review shows prepare CTA',
    failures,
  }
}

async function requestOnlineCoursesPreparedMaterializationDecision({
  workspacePath = smokeWorkspaceRoot,
  previousExecutionResult = '',
  projectState = { resolvedDecisions: [] },
} = {}) {
  const goal = onlineCoursesGoalCase.goal
  const context = onlineCoursesGoalCase.context
  const baseDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal,
    context,
    workspacePath,
    iteration: 2,
    previousExecutionResult,
    requiresApproval: false,
    projectState,
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const scalablePlan =
    baseDecision?.scalableDeliveryPlan &&
    typeof baseDecision.scalableDeliveryPlan === 'object'
      ? baseDecision.scalableDeliveryPlan
      : null

  if (!scalablePlan) {
    return {
      goal,
      context,
      baseDecision,
      decision: null,
      failures: [
        'La base reviewed online-courses no devolvió scalableDeliveryPlan para preparar la entrega funcional local.',
      ],
    }
  }

  const prompt = buildFullstackLocalMaterializationPrompt({
    goal,
    context,
    scalablePlan,
  })

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: prompt.goal,
    context: [prompt.context, 'No ejecutar todavía.'].filter(Boolean).join('\n'),
    workspacePath,
    iteration: 3,
    previousExecutionResult,
    requiresApproval: false,
    projectState,
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  return { goal, context, baseDecision, decision, failures: [] }
}

function buildDeferredRealPaymentsResolvedDecisions({
  decision = 'deferred',
  selectedOption = 'Prepararlo más adelante',
  freeAnswer = 'Continuar mock, pagos reales después.',
} = {}) {
  const sharedRecord = {
    status: 'resolved',
    source: 'user',
    decision,
    label:
      decision === 'draft'
        ? 'Redactar borrador de approval futuro'
        : 'Prepararlo más adelante',
    scope: 'real-payments',
    summary:
      decision === 'draft'
        ? 'La integracion real de Mercado Pago queda como borrador futuro; la entrega actual sigue con mock local.'
        : 'La integracion real de Mercado Pago queda diferida; la entrega actual sigue con mock local.',
    responseMode: selectedOption ? 'mixed' : 'free-answer',
    approvalFamily: 'real-payments',
    selectedOption,
    freeAnswer,
    allowsNow: [
      'local-mock-payments',
      'mock-mercado-pago-adapter',
      'seed/mock payment statuses',
    ],
    forbidsNow: [
      'real-payments',
      'real-webhooks',
      'real-secrets',
      '.env',
      'external-api-calls',
    ],
    updatedAt: '2026-05-22T00:00:00.000Z',
  }

  return [
    {
      key: 'approve-real-payments',
      ...sharedRecord,
    },
    {
      key: 'approval-family:real-payments',
      ...sharedRecord,
    },
  ]
}

async function runOnlineCoursesScalableReviewShowsPrepareCtaCase() {
  const failures = []
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: onlineCoursesGoalCase.goal,
    context: onlineCoursesGoalCase.context,
    workspacePath: smokeWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })
  const scalableReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: decision,
    effectivePlannerExecutionMetadata: decision,
  })
  const scalablePlan =
    decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
      ? decision.scalableDeliveryPlan
      : null
  const reviewSurface = normalizeText(
    JSON.stringify({
      strategy: decision?.strategy,
      decisionKey: decision?.decisionKey,
      nextExpectedAction: decision?.nextExpectedAction,
      reason: decision?.reason,
      domainUnderstanding: decision?.domainUnderstanding,
      scalableDeliveryPlan: decision?.scalableDeliveryPlan,
    }),
  )
  const rootPath = summarizeUniqueStrings(scalablePlan?.allowedRootPaths, 1)[0] || ''

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'scalable-delivery-plan',
    'Cursos online debe seguir empezando en scalable-delivery-plan.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'planner-only',
    'Cursos online no debe saltar directo a executor en el review inicial.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'review-scalable-delivery',
    'Cursos online debe quedar en review-scalable-delivery antes del click.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaVisible === true,
    'Cursos online debe mostrar Preparar entrega funcional local en Paso 5.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaLabel === 'Preparar entrega funcional local',
    'Cursos online debe conservar el label Preparar entrega funcional local.',
  )
  pushFailure(
    failures,
    normalizeText(rootPath).includes('edu-platform-local'),
    `Cursos online debe usar un root coherente tipo edu-platform-local. Recibido: ${rootPath || '(vacío)'}.`,
  )
  ;['logitrack-local-v1', 'shipments', 'tracking', 'veterinaria', 'appointments'].forEach(
    (token) => {
      pushFailure(
        failures,
        !reviewSurface.includes(normalizeText(token)),
        `El review escalable de cursos online no debe contaminarse con ${token}.`,
      )
    },
  )
  ;['cursos', 'alumnos', 'planes', 'progreso'].forEach((token) => {
    pushFailure(
      failures,
      reviewSurface.includes(normalizeText(token)),
      `El review escalable de cursos online debe incluir ${token}.`,
    )
  })

  return {
    id: 'online-courses-scalable-review-shows-prepare-cta',
    label: 'Online courses scalable review shows prepare CTA',
    failures,
  }
}

async function runEducationTrainingGeneratedDomainContractShowsPrepareCtaCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const plannerUiStateSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')
  const scalableReviewMetadata = {
    decisionKey: 'escuela-oficios-barrial-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    businessSector: 'education-training',
    requiresApproval: false,
    approvalRequired: false,
    contextHubStatus: {
      source: 'context-hub',
      endpoint: '/v1/packs/suggested',
      available: false,
      reason: 'unavailable',
    },
    scalableDeliveryPlan: {
      reason:
        'Entrega funcional local revisable para escuela de oficios barrial antes de preparar la materializacion segura.',
    },
    generatedDomainContract: {
      deliveryLevel: 'fullstack-local',
      domain: { slug: 'escuela-oficios-barrial' },
      root: {
        slug: 'escuela-oficios-local',
        sourceRoot: 'escuela-oficios-local',
        targetRoot: 'escuela-oficios-local',
      },
      materialization: {
        requiredFiles: [
          'backend/src/server.js',
          'frontend/admin/index.html',
          'database/schema.sql',
        ],
      },
      validation: {
        requiredPathGroups: [
          { candidates: ['backend/src/server.js'] },
          { candidates: ['frontend/admin/index.html'] },
          { candidates: ['database/schema.sql'] },
        ],
      },
    },
    generatedDomainContractDiagnostics: {
      present: true,
      valid: true,
      safeForLocalMaterialization: true,
      sourceRoot: 'escuela-oficios-local',
      targetRoot: 'escuela-oficios-local',
      rootSlug: 'escuela-oficios-local',
      errorsCount: 0,
      warningsCount: 0,
    },
  }
  const scalableReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableReviewMetadata,
    effectivePlannerExecutionMetadata: scalableReviewMetadata,
  })

  pushFailure(
    failures,
    scalableReviewUiState.effectiveReviewOnly === true,
    'Escuela de oficios debe seguir en planner-only/review-only antes de preparar la entrega.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.isScalableReview === true,
    'Un generatedDomainContract valido en review-scalable-delivery debe seguir reconocido como review escalable.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.looksLikeFullstackLocalReview === true,
    'El generatedDomainContract valido y seguro debe marcar el review como fullstack local aunque falten pistas clasicas en scalableDeliveryPlan.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.canPrepareFullstackLocal === true,
    'Escuela de oficios debe habilitar Preparar entrega funcional local cuando el generatedDomainContract ya es valido y seguro.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaVisible === true,
    'El review escalable con generatedDomainContract valido debe mostrar un CTA de avance seguro.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaLabel === 'Preparar entrega funcional local',
    'El CTA principal debe seguir usando el label Preparar entrega funcional local.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.materializeCtaVisible === false,
    'El CTA de generatedDomainContract valido no debe materializar automaticamente en el review.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.uiState === 'review-scalable-delivery',
    'El review con generatedDomainContract valido debe permanecer en review-scalable-delivery hasta el siguiente click.',
  )
  pushFailure(
    failures,
    plannerUiStateSource.includes('generatedDomainContractDiagnostics') &&
      plannerUiStateSource.includes('safeForLocalMaterialization') &&
      plannerUiStateSource.includes('hasPendingApproval === false'),
    'El helper central debe usar generatedDomainContractDiagnostics valid/safe y respetar approvals antes de habilitar el CTA.',
  )
  pushFailure(
    failures,
    appSource.includes('generatedDomainContractDiagnostics') &&
      appSource.includes('generatedDomainContractObservation'),
    'App.tsx debe preservar el generatedDomainContract y sus diagnosticos dentro de PlannerExecutionMetadata para que el CTA no dependa solo del plan legacy.',
  )

  return {
    id: 'education-training-generated-domain-contract-shows-prepare-cta',
    label: 'Education training generated domain contract shows prepare CTA',
    failures,
  }
}

async function runGeneratedDomainContractValidReviewShowsNextSafeActionCase() {
  const failures = []
  const scalableReviewMetadata = {
    decisionKey: 'general-reviewable-domain-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    businessSector: 'community-services',
    requiresApproval: false,
    approvalRequired: false,
    scalableDeliveryPlan: {
      reason: 'Revision segura previa a preparar la entrega local.',
    },
    generatedDomainContractDiagnostics: {
      present: true,
      valid: true,
      safeForLocalMaterialization: true,
      sourceRoot: 'community-services-local',
      targetRoot: 'community-services-local',
      errorsCount: 0,
      warningsCount: 0,
    },
  }
  const scalableReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableReviewMetadata,
    effectivePlannerExecutionMetadata: scalableReviewMetadata,
  })

  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaVisible === true &&
      scalableReviewUiState.prepareCtaKind === 'fullstack-local',
    'Cualquier generatedDomainContract valido/seguro en review-scalable-delivery debe mostrar una accion segura de avance.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.materializeCtaVisible === false,
    'La accion segura de avance no debe transformarse en materializacion directa.',
  )

  return {
    id: 'generated-domain-contract-valid-review-shows-next-safe-action',
    label: 'Generated domain contract valid review shows next safe action',
    failures,
  }
}

async function runScalableReviewDoesNotDegradeToProjectPhaseReviewCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const scalableReviewMetadata = {
    decisionKey: 'fullstack-local-scalable-plan-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    businessSector: 'auto_services_local_workshops',
    requiresApproval: false,
    approvalRequired: false,
    tasks: [
      { title: 'Panel operativo', targetPath: 'frontend/admin/app.js' },
      { title: 'API local', targetPath: 'backend/src/server.js' },
      { title: 'SQLite local', targetPath: 'database/schema.sql' },
    ],
    generatedDomainContractDiagnostics: {
      present: true,
      valid: true,
      safeForLocalMaterialization: true,
      domainSlug: 'talleres-mecanicos',
      rootSlug: 'talleres-mecanicos-local',
      sourceRoot: 'talleres-mecanicos-local',
      targetRoot: 'talleres-mecanicos-local',
      errorsCount: 0,
      warningsCount: 0,
      allowedTargetPathsCount: 52,
      requiredPathGroupsCount: 47,
    },
    generatedDomainContractComparison: {
      present: true,
      compared: true,
      status: 'partial',
      safeForDiagnostics: true,
      warningsCount: 2,
      errorsCount: 0,
    },
    projectPhaseExecutionPlan: {
      phaseId: 'frontend-mock-flow',
      deliveryLevel: 'fullstack-local',
      targetStrategy: 'prepare-project-phase-plan',
      projectRoot: 'otro-proyecto-local',
      executableNow: false,
      approvalRequired: false,
      allowedTargetPaths: [],
    },
  }
  const scalableReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableReviewMetadata,
    effectivePlannerExecutionMetadata: scalableReviewMetadata,
  })

  pushFailure(
    failures,
    scalableReviewUiState.isScalableReview === true &&
      scalableReviewUiState.canPrepareFullstackLocal === true &&
      scalableReviewUiState.prepareCtaVisible === true &&
      scalableReviewUiState.prepareCtaLabel === 'Preparar entrega funcional local',
    'Un review escalable con generatedDomainContractDiagnostics válidos debe conservar el CTA seguro aunque exista un projectPhaseExecutionPlan colgado en metadata.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.materializeCtaVisible === false,
    'El review escalable no debe saltar a materialización directa por tener diagnostics completos.',
  )
  pushFailure(
    failures,
    appSource.includes('const plannerHasImplicitProjectPhaseReviewSignal =') &&
      appSource.includes('plannerReviewUiState.isScalableReview !== true'),
    'App.tsx debe impedir que un projectPhaseExecutionPlan implícito tape un review escalable válido.',
  )

  return {
    id: 'scalable-review-does-not-degrade-to-project-phase-review',
    label: 'Scalable review does not degrade to project phase review',
    failures,
  }
}

async function runProductArchitectureReviewDoesNotDegradeToProjectPhaseReviewCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const productArchitectureReviewMetadata = {
    decisionKey: 'arch-plan-online-courses-v1',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-product-architecture',
    businessSector: 'education-elearning',
    requiresApproval: false,
    approvalRequired: false,
    tasks: [
      { title: 'Arquitectura inicial', targetPath: 'docs/architecture/overview.md' },
      { title: 'Mapa de modulos', targetPath: 'docs/architecture/modules.md' },
    ],
    generatedDomainContractDiagnostics: {
      present: true,
      valid: true,
      safeForLocalMaterialization: true,
      domainSlug: 'online-courses-local',
      rootSlug: 'online-courses-local',
      sourceRoot: 'online-courses-local',
      targetRoot: 'online-courses-local',
      errorsCount: 0,
      warningsCount: 0,
      allowedTargetPathsCount: 49,
      requiredPathGroupsCount: 48,
    },
    generatedDomainContractComparison: {
      present: true,
      compared: true,
      status: 'partial',
      errorsCount: 0,
    },
    legacyDomainResolutionDiagnostics: {
      present: true,
      used: false,
      status: 'not-used',
      behaviorChanged: false,
      generatedDomainContractPresent: true,
      generatedDomainContractValid: true,
      generatedDomainContractSafe: true,
      warningsCount: 0,
      errorsCount: 0,
    },
    projectPhaseExecutionPlan: {
      phaseId: 'legacy-phase-shadow',
      deliveryLevel: 'fullstack-local',
      targetStrategy: 'prepare-project-phase-plan',
      projectRoot: 'legacy-shadow-project',
      executableNow: false,
      approvalRequired: false,
      allowedTargetPaths: [],
    },
  }
  const productArchitectureReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: productArchitectureReviewMetadata,
    effectivePlannerExecutionMetadata: productArchitectureReviewMetadata,
  })

  pushFailure(
    failures,
    productArchitectureReviewUiState.effectiveReviewOnly === true,
    'El payload real de product-architecture review debe seguir en modo review-only.',
  )
  pushFailure(
    failures,
    /const plannerHasImplicitProjectPhaseReviewSignal =[\s\S]*!plannerIsSafeFirstDeliveryReview &&[\s\S]*!plannerIsProductArchitectureReview &&[\s\S]*plannerReviewUiState\.isScalableReview !== true/.test(
      appSource,
    ),
    'App.tsx debe impedir que un projectPhaseExecutionPlan implícito tape un review de product-architecture o safe-first válido.',
  )
  pushFailure(
    failures,
    /const plannerReviewPrimaryActionLabel =[\s\S]*plannerIsProductArchitectureReview[\s\S]*'Preparar primera entrega segura'/.test(
      appSource,
    ),
    'El review de product-architecture debe conservar el CTA principal "Preparar primera entrega segura".',
  )
  pushFailure(
    failures,
    /const handlePlannerReviewPrimaryAction =[\s\S]*plannerIsProductArchitectureReview[\s\S]*handlePrepareSafeFirstDeliveryPlan/.test(
      appSource,
    ),
    'El CTA de product-architecture debe seguir apuntando a handlePrepareSafeFirstDeliveryPlan sin materializar automaticamente.',
  )
  pushFailure(
    failures,
    !/legacyDomainResolutionDiagnostics[\s\S]{0,600}plannerIsProductArchitectureReview/.test(
      appSource,
    ),
    'legacyDomainResolutionDiagnostics no debe alterar la rama de review de product-architecture en App.tsx.',
  )

  return {
    id: 'product-architecture-review-does-not-degrade-to-project-phase-review',
    label: 'Product architecture review does not degrade to project phase review',
    failures,
  }
}

async function runGeneratedDomainContractComparisonPayloadCase() {
  const failures = []
  const comparison = buildGeneratedDomainContractComparison(
    {
      decisionKey: 'school-of-trades-comparison-v1',
      strategy: 'scalable-delivery-plan',
      executionMode: 'planner-only',
      nextExpectedAction: 'review-scalable-delivery',
      businessSector: 'education-training',
      reason:
        'Entrega funcional local segura con backend local, database sqlite, frontend admin y reportes mock sin deploy.',
      sourceRoot: 'school-of-trades-local',
      targetRoot: 'school-of-trades-local',
      generatedDomainContract: {
        deliveryLevel: 'fullstack-local',
        domain: { slug: 'school-of-trades', label: 'School of Trades' },
        root: {
          slug: 'school-of-trades-local',
          sourceRoot: 'school-of-trades-local',
          targetRoot: 'school-of-trades-local',
        },
        frontendSurfaces: [{ key: 'admin', label: 'Admin', path: 'frontend/admin' }],
        backend: {
          entryFile: 'backend/src/server.js',
          routes: [{ path: 'backend/src/routes/reports.js' }],
        },
        database: {
          schemaFile: 'database/schema.sql',
          tables: ['courses', 'students', 'teachers'],
        },
        materialization: {
          requiredFiles: [
            'frontend/admin/index.html',
            'backend/src/server.js',
            'database/schema.sql',
          ],
        },
        validation: {
          requiredPathGroups: [
            { candidates: ['frontend/admin/index.html'] },
            { candidates: ['backend/src/server.js'] },
            { candidates: ['database/schema.sql'] },
          ],
        },
      },
    },
    repoRoot,
  )

  pushFailure(
    failures,
    comparison.present === true && comparison.compared === true,
    'La comparacion generatedDomainContract vs legacy debe quedar disponible como diagnostico puro.',
  )
  pushFailure(
    failures,
    ['compared', 'partial'].includes(comparison.status),
    'La comparacion diagnostica debe devolver un status estable sin romper el flujo.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-contract:comparison') &&
      mainSource.includes('generatedDomainContractComparison'),
    'main.cjs debe adjuntar generatedDomainContractComparison al payload y loguear generated-domain-contract:comparison.',
  )

  return {
    id: 'generated-domain-contract-comparison-payload',
    label: 'Generated domain contract comparison payload',
    failures,
  }
}

async function runGeneratedDomainCapabilityProfilePayloadCase() {
  const failures = []
  const generatedDomainContract = {
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'mechanic-workshops-local', label: 'Mechanic Workshops Local' },
    root: {
      slug: 'mechanic-workshops-local',
      sourceRoot: 'mechanic-workshops-local',
      targetRoot: 'mechanic-workshops-local',
    },
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['dashboard'] },
    ],
    entities: ['appointments', 'reports', 'inventory_items'],
    workflows: ['appointments', 'reporting', 'inventory-sync'],
    backend: {
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/appointments.js' }],
      services: [{ path: 'backend/src/services/mock-payment.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      tables: ['appointments', 'reports', 'inventory_items'],
    },
    integrations: [{ name: 'payment-provider', mode: 'mock-only', realIntegrationAllowedNow: false }],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile'],
      forbiddenSignals: ['ACCESS_TOKEN', 'client_secret'],
      explicitExclusions: ['deploy', 'docker', 'real-payments', 'servicios externos'],
    },
    materialization: {
      requiredFiles: [
        'frontend/public/index.html',
        'frontend/admin/index.html',
        'backend/src/server.js',
        'database/schema.sql',
      ],
      operations: [
        {
          type: 'replace-file',
          targetPath: 'backend/src/server.js',
          nextContent: "export const server = 'mock-local'\n",
        },
      ],
    },
    validation: {
      requiredPathGroups: [
        ['frontend/public/index.html'],
        ['frontend/admin/index.html'],
        ['backend/src/server.js'],
        ['database/schema.sql'],
      ],
      forbiddenSearchPatterns: ['ACCESS_TOKEN', 'client_secret'],
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
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-capability-profile-observability',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Adjuntar el capability profile universal sin cambiar el comportamiento del planner.',
    instruction: 'Mantener el flujo en revision.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainCapabilityProfile?.present === true &&
      decision.generatedDomainCapabilityProfile?.built === true &&
      ['built', 'partial'].includes(decision.generatedDomainCapabilityProfile?.status),
    'buildBrainDecisionContract debe adjuntar generatedDomainCapabilityProfile al payload cuando haya generatedDomainContract.',
  )
  pushFailure(
    failures,
    decision.generatedDomainCapabilityProfile?.behaviorChanged === false,
    'generatedDomainCapabilityProfile debe declarar behaviorChanged=false.',
  )
  pushFailure(
    failures,
    decision.generatedDomainCapabilityProfile?.delivery?.fullstackLocal === true &&
      decision.generatedDomainCapabilityProfile?.backend?.present === true &&
      decision.generatedDomainCapabilityProfile?.database?.present === true,
    'El capability profile universal debe reflejar las capacidades estructurales del contrato sin depender del dominio.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-contract:capability-profile') &&
      mainSource.includes('generatedDomainCapabilityProfile') &&
      mainSource.includes('summarizeGeneratedDomainCapabilityProfileForDebug'),
    'main.cjs debe adjuntar generatedDomainCapabilityProfile y loguear generated-domain-contract:capability-profile.',
  )
  pushFailure(
    failures,
    decision.strategy === 'scalable-delivery-plan' &&
      decision.executionMode === 'planner-only' &&
      decision.nextExpectedAction === 'review-scalable-delivery',
    'generatedDomainCapabilityProfile no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-capability-profile-payload',
    label: 'Generated domain capability profile payload',
    failures,
  }
}

async function runLegacyDomainResolutionDiagnosticsPayloadCase() {
  const failures = []
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'legacy-domain-resolution-observability',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Adjuntar observabilidad legacy sin cambiar comportamiento.',
    instruction: 'Mantener el plan legacy y marcar solo diagnostics.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      modules: ['cursos', 'alumnos', 'pagos mock'],
      allowedRootPaths: ['edu-platform-local'],
      legacyDomainResolution: {
        fullstackLocalArchetype: 'online-courses',
        usedLegacyArchetype: true,
        materializationPlanProfileKey: 'online-courses',
        usedLegacyMaterializationProfile: true,
      },
    },
    selectedDomain: 'online-courses',
    selectedContractKind: 'online-courses-fullstack-local',
    generatedDomainContract: {
      deliveryLevel: 'fullstack-local',
      domain: { slug: 'school-of-trades', label: 'School of Trades' },
      root: {
        slug: 'school-of-trades-local',
        sourceRoot: 'school-of-trades-local',
        targetRoot: 'school-of-trades-local',
      },
      frontendSurfaces: [{ key: 'admin', label: 'Admin', path: 'frontend/admin' }],
      backend: {
        entryFile: 'backend/src/server.js',
        routes: [{ path: 'backend/src/routes/reports.js' }],
      },
      database: {
        schemaFile: 'database/schema.sql',
        tables: ['courses', 'students', 'teachers'],
      },
      materialization: {
        requiredFiles: [
          'frontend/admin/index.html',
          'backend/src/server.js',
          'database/schema.sql',
        ],
      },
      validation: {
        requiredPathGroups: [
          { candidates: ['frontend/admin/index.html'] },
          { candidates: ['backend/src/server.js'] },
          { candidates: ['database/schema.sql'] },
        ],
      },
    },
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.legacyDomainResolutionDiagnostics?.present === true,
    'buildBrainDecisionContract debe adjuntar legacyDomainResolutionDiagnostics al payload cuando exista contexto legacy.',
  )
  pushFailure(
    failures,
    decision.legacyDomainResolutionDiagnostics?.used === true &&
      decision.legacyDomainResolutionDiagnostics?.status === 'used',
    'El diagnostico legacy debe marcar used/status=used cuando entra un resolver legacy observacional.',
  )
  pushFailure(
    failures,
    decision.legacyDomainResolutionDiagnostics?.behaviorChanged === false,
    'legacyDomainResolutionDiagnostics debe declarar behaviorChanged=false.',
  )
  pushFailure(
    failures,
    decision.legacyDomainResolutionDiagnostics?.generatedDomainContractPresent === true &&
      decision.legacyDomainResolutionDiagnostics?.generatedDomainContractValid === true &&
      decision.legacyDomainResolutionDiagnostics?.generatedDomainContractSafe === true,
    'El diagnostico legacy debe informar generatedDomainContract present/valid/safe sin romper el flujo.',
  )
  pushFailure(
    failures,
    mainSource.includes('legacy-domain-resolution:diagnostics') &&
      mainSource.includes('legacyDomainResolutionDiagnostics') &&
      mainSource.includes('summarizeLegacyDomainResolutionDiagnosticsForDebug'),
    'main.cjs debe adjuntar legacyDomainResolutionDiagnostics al payload y loguear legacy-domain-resolution:diagnostics.',
  )

  return {
    id: 'legacy-domain-resolution-diagnostics-payload',
    label: 'Legacy domain resolution diagnostics payload',
    failures,
  }
}

async function runLegacyCapabilityAlignmentDiagnosticsPayloadCase() {
  const failures = []
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'legacy-capability-alignment-observability',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Adjuntar alineacion legacy vs capability sin cambiar comportamiento.',
    instruction: 'Mantener el review y no materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      modules: ['catalogo', 'reportes', 'inventario'],
      allowedRootPaths: ['fairs-local'],
      legacyDomainResolution: {
        fullstackLocalArchetype: 'operations',
        usedLegacyArchetype: false,
        materializationPlanProfileKey: 'logistics-tracking',
        usedLegacyMaterializationProfile: true,
      },
    },
    selectedDomain: 'logistics-tracking',
    selectedContractKind: 'generic-fullstack-local',
    generatedDomainContract: {
      deliveryLevel: 'fullstack-local',
      domain: { slug: 'neighborhood-fairs', label: 'Neighborhood Fairs' },
      root: {
        slug: 'fairs-local',
        sourceRoot: 'fairs-local',
        targetRoot: 'fairs-local',
      },
      frontendSurfaces: [
        { key: 'public', label: 'Public', path: 'frontend/public', screens: ['agenda'] },
        { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['dashboard'] },
      ],
      workflows: ['scheduling', 'reporting', 'inventory', 'tracking'],
      backend: {
        entryFile: 'backend/src/server.js',
        routes: [{ path: 'backend/src/routes/fairs.js' }],
      },
      database: {
        schemaFile: 'database/schema.sql',
        tables: ['fairs', 'stands', 'inventory'],
      },
      materialization: {
        requiredFiles: [
          'frontend/public/index.html',
          'frontend/admin/index.html',
          'backend/src/server.js',
          'database/schema.sql',
        ],
      },
      validation: {
        requiredPathGroups: [
          { candidates: ['frontend/public/index.html'] },
          { candidates: ['frontend/admin/index.html'] },
          { candidates: ['backend/src/server.js'] },
          { candidates: ['database/schema.sql'] },
        ],
      },
      safety: {
        forbiddenFiles: ['.env'],
        forbiddenSignals: ['ACCESS_TOKEN'],
        explicitExclusions: ['deploy', 'real-payments'],
      },
    },
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.legacyCapabilityAlignmentDiagnostics?.present === true &&
      decision.legacyCapabilityAlignmentDiagnostics?.compared === true,
    'buildBrainDecisionContract debe adjuntar legacyCapabilityAlignmentDiagnostics al payload.',
  )
  pushFailure(
    failures,
    ['divergent', 'partial'].includes(decision.legacyCapabilityAlignmentDiagnostics?.status) &&
      decision.legacyCapabilityAlignmentDiagnostics?.alignment?.migrationCandidate === true,
    'La alineacion debe marcar migracion candidata cuando legacy sigue activo con capability profile suficiente.',
  )
  pushFailure(
    failures,
    decision.legacyCapabilityAlignmentDiagnostics?.behaviorChanged === false,
    'legacyCapabilityAlignmentDiagnostics debe declarar behaviorChanged=false.',
  )
  pushFailure(
    failures,
    mainSource.includes('legacy-capability-alignment:diagnostics') &&
      mainSource.includes('legacyCapabilityAlignmentDiagnostics') &&
      mainSource.includes('summarizeLegacyCapabilityAlignmentDiagnosticsForDebug'),
    'main.cjs debe adjuntar legacyCapabilityAlignmentDiagnostics y loguear legacy-capability-alignment:diagnostics.',
  )
  pushFailure(
    failures,
    decision.strategy === 'scalable-delivery-plan' &&
      decision.executionMode === 'planner-only' &&
      decision.nextExpectedAction === 'review-scalable-delivery',
    'legacyCapabilityAlignmentDiagnostics no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'legacy-capability-alignment-diagnostics-payload',
    label: 'Legacy capability alignment diagnostics payload',
    failures,
  }
}

async function runLegacyMigrationCandidateReportPayloadCase() {
  const failures = []
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'legacy-migration-candidate-observability',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    reason: 'Adjuntar reporte observacional de migracion legacy sin cambiar comportamiento.',
    instruction: 'Mantener el review y no materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      modules: ['catalogo', 'reportes', 'inventario'],
      allowedRootPaths: ['club-nexus-local'],
      legacyDomainResolution: {
        fullstackLocalArchetype: 'operations',
        usedLegacyArchetype: false,
        materializationPlanProfileKey: 'logistics-tracking',
        usedLegacyMaterializationProfile: true,
      },
    },
    selectedDomain: 'logistics-tracking',
    selectedContractKind: 'generic-fullstack-local',
    generatedDomainContract: {
      deliveryLevel: 'fullstack-local',
      domain: { slug: 'neighborhood-clubs', label: 'Neighborhood Clubs' },
      root: {
        slug: 'club-nexus-local',
        sourceRoot: 'club-nexus-local',
        targetRoot: 'club-nexus-local',
      },
      frontendSurfaces: [
        { key: 'public', label: 'Public', path: 'frontend/public', screens: ['agenda'] },
        { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['dashboard'] },
      ],
      workflows: ['scheduling', 'reporting', 'inventory', 'messaging'],
      backend: {
        entryFile: 'backend/src/server.js',
        routes: [{ path: 'backend/src/routes/clubs.js' }],
      },
      database: {
        schemaFile: 'database/schema.sql',
        tables: ['clubs', 'members', 'inventory'],
      },
      materialization: {
        requiredFiles: [
          'frontend/public/index.html',
          'frontend/admin/index.html',
          'backend/src/server.js',
          'database/schema.sql',
        ],
      },
      validation: {
        requiredPathGroups: [
          { candidates: ['frontend/public/index.html'] },
          { candidates: ['frontend/admin/index.html'] },
          { candidates: ['backend/src/server.js'] },
          { candidates: ['database/schema.sql'] },
        ],
      },
      safety: {
        forbiddenFiles: ['.env'],
        forbiddenSignals: ['ACCESS_TOKEN'],
        explicitExclusions: ['deploy', 'real-payments'],
      },
    },
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.legacyMigrationCandidateReport?.present === true &&
      decision.legacyMigrationCandidateReport?.evaluated === true,
    'buildBrainDecisionContract debe adjuntar legacyMigrationCandidateReport al payload.',
  )
  pushFailure(
    failures,
    ['candidate', 'blocked'].includes(decision.legacyMigrationCandidateReport?.status) &&
      decision.legacyMigrationCandidateReport?.recommendation?.action ===
        'prepare-capability-preference',
    'El reporte de migracion debe recomendar prepare-capability-preference cuando detecta un candidato real.',
  )
  pushFailure(
    failures,
    decision.legacyMigrationCandidateReport?.behaviorChanged === false,
    'legacyMigrationCandidateReport debe declarar behaviorChanged=false.',
  )
  pushFailure(
    failures,
    mainSource.includes('legacy-migration-candidate:report') &&
      mainSource.includes('legacyMigrationCandidateReport') &&
      mainSource.includes('summarizeLegacyMigrationCandidateReportForDebug'),
    'main.cjs debe adjuntar legacyMigrationCandidateReport y loguear legacy-migration-candidate:report.',
  )
  pushFailure(
    failures,
    decision.strategy === 'scalable-delivery-plan' &&
      decision.executionMode === 'planner-only' &&
      decision.nextExpectedAction === 'review-scalable-delivery',
    'legacyMigrationCandidateReport no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'legacy-migration-candidate-report-payload',
    label: 'Legacy migration candidate report payload',
    failures,
  }
}

async function runFullstackLocalInspectionSourceDiagnosticsPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'neighborhood-clubs', label: 'Neighborhood Clubs' },
    root: {
      slug: 'club-nexus-local',
      sourceRoot: 'club-nexus-local',
      targetRoot: 'club-nexus-local',
    },
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['agenda'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['dashboard'] },
    ],
    workflows: ['scheduling', 'reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: ['backend/src/routes/clubs.js'],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['clubs', 'members', 'inventory'],
    },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md', 'docs/DB_SCHEMA.md'],
    scripts: ['scripts/seed-local.js'],
    safety: {
      forbiddenFiles: ['.env'],
      forbiddenSignals: ['ACCESS_TOKEN'],
      explicitExclusions: ['deploy', 'real-payments'],
    },
    materialization: {
      requiredFiles: [
        'backend/src/server.js',
        'database/schema.sql',
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
  }
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'fullstack-local-inspection-source-generated-contract',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Preferir generatedDomainContract valido para la inspeccion sin tocar el plan.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths: [
        'club-nexus-local',
        'club-nexus-local/backend/src/server.js',
        'club-nexus-local/database/schema.sql',
        'club-nexus-local/database/seed.sql',
        'club-nexus-local/frontend/public/index.html',
        'club-nexus-local/frontend/admin/index.html',
        'club-nexus-local/docs/API.md',
        'club-nexus-local/docs/ARCHITECTURE.md',
        'club-nexus-local/docs/DB_SCHEMA.md',
        'club-nexus-local/scripts/seed-local.js',
      ],
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'club-nexus-local',
      allowedTargetPaths: [
        'club-nexus-local',
        'club-nexus-local/backend/src/server.js',
        'club-nexus-local/database/schema.sql',
        'club-nexus-local/database/seed.sql',
        'club-nexus-local/frontend/public/index.html',
        'club-nexus-local/frontend/admin/index.html',
        'club-nexus-local/docs/API.md',
        'club-nexus-local/docs/ARCHITECTURE.md',
        'club-nexus-local/docs/DB_SCHEMA.md',
        'club-nexus-local/scripts/seed-local.js',
      ],
      operations: [
        { type: 'create-folder', targetPath: 'club-nexus-local' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/backend/src/server.js' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/database/schema.sql' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/database/seed.sql' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/frontend/public/index.html' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/frontend/admin/index.html' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/docs/API.md' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/docs/ARCHITECTURE.md' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/docs/DB_SCHEMA.md' },
        { type: 'create-or-edit-file', targetPath: 'club-nexus-local/scripts/seed-local.js' },
      ],
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.fullstackLocalInspectionSourceDiagnostics?.present === true &&
      decision.fullstackLocalInspectionSourceDiagnostics?.source ===
        'generated-domain-contract',
    'buildBrainDecisionContract debe adjuntar fullstackLocalInspectionSourceDiagnostics usando generated-domain-contract cuando el contrato universal es suficiente.',
  )
  pushFailure(
    failures,
    decision.fullstackLocalInspectionSourceDiagnostics?.generatedDomainContractUsed === true &&
      decision.fullstackLocalInspectionSourceDiagnostics?.legacyCanonicalContractUsed !== true,
    'La inspeccion no debe usar el contrato canonico legacy como fuente primaria cuando generatedDomainContract ya alcanza.',
  )
  pushFailure(
    failures,
    decision.fullstackLocalInspectionSourceDiagnostics?.behaviorChanged === false,
    'fullstackLocalInspectionSourceDiagnostics debe declarar behaviorChanged=false.',
  )
  pushFailure(
    failures,
    mainSource.includes('fullstack-local-inspection-source:diagnostics') &&
      mainSource.includes('fullstackLocalInspectionSourceDiagnostics') &&
      mainSource.includes('buildGeneratedDomainContractInspectionDefinition'),
    'main.cjs debe adjuntar fullstackLocalInspectionSourceDiagnostics y loguear fullstack-local-inspection-source:diagnostics.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'La preferencia de inspeccion no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'fullstack-local-inspection-source-diagnostics-payload',
    label: 'Fullstack local inspection source diagnostics payload',
    failures,
  }
}

async function runGeneratedDomainInspectionContractDecouplingReportPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'club-nexus', label: 'Club Nexus' },
    root: {
      slug: 'club-nexus-local',
      sourceRoot: 'club-nexus-local',
      targetRoot: 'club-nexus-local',
    },
    roles: [],
    entities: ['members', 'events', 'bookings'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['home'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['dashboard'] },
    ],
    workflows: ['scheduling', 'reporting', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/members.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['members', 'events', 'bookings'],
    },
    shared: { files: [] },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md', 'docs/DB_SCHEMA.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'inspection-contract-decoupling-report',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Evaluar el desacople observacional contract-first de la inspeccion sin tocar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'club-nexus-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type: targetPath === 'club-nexus-local' ? 'create-folder' : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainInspectionContractDecouplingReport?.present === true &&
      ['ready-for-harness', 'partial'].includes(
        decision.generatedDomainInspectionContractDecouplingReport?.migrationStatus,
      ),
    'buildBrainDecisionContract debe adjuntar generatedDomainInspectionContractDecouplingReport como diagnostico observacional del desacople de inspeccion.',
  )
  pushFailure(
    failures,
    decision.generatedDomainInspectionContractDecouplingReport?.behaviorChanged === false &&
      decision.generatedDomainInspectionContractDecouplingReport?.currentInspectionSource ===
        'generated-domain-contract',
    'generatedDomainInspectionContractDecouplingReport debe declarar behaviorChanged=false y preservar la fuente actual de inspeccion.',
  )
  pushFailure(
    failures,
    decision.generatedDomainInspectionContractDecouplingReport?.legacyFallbackAvailable ===
      true &&
      decision.generatedDomainInspectionContractDecouplingReport?.contractCanInspect ===
        true,
    'El reporte de desacople debe reconocer fallback legacy disponible y capacidad de inspeccion contract-first.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-inspection-contract:decoupling-report') &&
      mainSource.includes('generatedDomainInspectionContractDecouplingReport') &&
      mainSource.includes('resolveGeneratedDomainContractFirstInspectionDefinition'),
    'main.cjs debe adjuntar y loguear generated-domain-inspection-contract:decoupling-report.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El desacople observacional de inspeccion no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-inspection-contract-decoupling-report-payload',
    label: 'Generated domain inspection contract decoupling report payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationShadowPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: {
      files: [],
    },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-aligned-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Comparar shadow plan universal contra materializationPlan legacy sin ejecutar archivos.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowPlan?.present === true &&
      decision.generatedDomainMaterializationShadowPlan?.status === 'built',
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationShadowPlan cuando el contrato universal es suficiente.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowComparison?.present === true &&
      decision.generatedDomainMaterializationShadowComparison?.status === 'aligned',
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationShadowComparison alineado cuando el plan legacy es compatible.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowComparison?.recommendation ===
      'prepare-shadow-preference' &&
      decision.generatedDomainMaterializationShadowComparison?.behaviorChanged === false,
    'La comparacion shadow vs legacy debe permanecer observacional y recomendar prepare-shadow-preference solo como preview.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-shadow:plan') &&
      mainSource.includes('generated-domain-materialization-shadow:comparison') &&
      mainSource.includes('generatedDomainMaterializationShadowPlan') &&
      mainSource.includes('generatedDomainMaterializationShadowComparison'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-shadow:plan y generated-domain-materialization-shadow:comparison.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El shadow materialization plan no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-shadow-payload',
    label: 'Generated domain materialization shadow payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationPreferenceGatePayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'urban-gardens', label: 'Urban Gardens' },
    root: {
      slug: 'urban-gardens-local',
      sourceRoot: 'urban-gardens-local',
      targetRoot: 'urban-gardens-local',
    },
    roles: [],
    entities: ['plots', 'members', 'harvests'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['plots'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['dashboard'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/plots.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['plots', 'members', 'harvests'],
    },
    shared: {
      files: [],
    },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-gate-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Evaluar la puerta observacional de preferencia futura sin tocar el plan real.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'urban-gardens-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type: targetPath === 'urban-gardens-local' ? 'create-folder' : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceGate?.present === true &&
      decision.generatedDomainMaterializationPreferenceGate?.evaluated === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationPreferenceGate al payload.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceGate?.status === 'eligible' &&
      decision.generatedDomainMaterializationPreferenceGate?.eligibility
        ?.canPreferShadowInFuture === true,
    'El preference gate debe marcar eligible cuando shadow plan y comparison estan alineados.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceGate?.recommendation?.action ===
      'prepare-preference-switch' &&
      decision.generatedDomainMaterializationPreferenceGate?.behaviorChanged === false,
    'generatedDomainMaterializationPreferenceGate debe permanecer observacional y recomendar prepare-preference-switch sin cambiar runtime.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-preference:gate') &&
      mainSource.includes('generatedDomainMaterializationPreferenceGate') &&
      mainSource.includes('buildGeneratedDomainMaterializationPreferenceGate'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-preference:gate.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El preference gate no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-preference-gate-payload',
    label: 'Generated domain materialization preference gate payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationPreferenceDecisionPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: { files: [] },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-decision-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Simular la decision de preferencia shadow sin activar el cambio real de materialization source.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceDecision?.present === true &&
      decision.generatedDomainMaterializationPreferenceDecision?.evaluated === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationPreferenceDecision al payload.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceDecision?.status ===
      'would-prefer-shadow' &&
      decision.generatedDomainMaterializationPreferenceDecision?.enabled === false &&
      decision.generatedDomainMaterializationPreferenceDecision?.dryRun
        ?.wouldPreferShadow === true,
    'La decision dry-run debe marcar would-prefer-shadow sin activar la preferencia real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceDecision?.actual
      ?.materializationSource === 'legacy' &&
      decision.generatedDomainMaterializationPreferenceDecision?.behaviorChanged === false,
    'La decision dry-run debe mantener legacy como fuente real actual y seguir siendo observacional.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-preference:decision') &&
      mainSource.includes('generatedDomainMaterializationPreferenceDecision') &&
      mainSource.includes('buildGeneratedDomainMaterializationPreferenceDecision'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-preference:decision.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'La decision dry-run no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-preference-decision-payload',
    label: 'Generated domain materialization preference decision payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationPreferenceSwitchPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: { files: [] },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-preference-switch-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Construir el scaffold apagado del switch de preferencia sin cambiar la fuente real.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceSwitch?.present === true &&
      decision.generatedDomainMaterializationPreferenceSwitch?.evaluated === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationPreferenceSwitch al payload.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceSwitch?.enabled === false &&
      decision.generatedDomainMaterializationPreferenceSwitch?.mode === 'disabled' &&
      decision.generatedDomainMaterializationPreferenceSwitch?.candidate
        ?.shadowAvailable === true &&
      ['observe', 'ready-to-enable-later', 'keep-disabled', 'investigate'].includes(
        decision.generatedDomainMaterializationPreferenceSwitch?.recommendation?.action,
      ),
    'El scaffold del switch debe quedar apagado en runtime, con shadow disponible como candidato observacional y una recomendacion segura sin activar el cambio real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceSwitch?.actual?.selectedSource ===
      'legacy' &&
      decision.generatedDomainMaterializationPreferenceSwitch?.actual
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationPreferenceSwitch?.actual
        ?.executionScopeChanged === false &&
      decision.generatedDomainMaterializationPreferenceSwitch?.behaviorChanged === false,
    'generatedDomainMaterializationPreferenceSwitch debe seguir observacional y no mutar materializationPlan ni executionScope.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-preference:switch') &&
      mainSource.includes('generatedDomainMaterializationPreferenceSwitch') &&
      mainSource.includes('buildGeneratedDomainMaterializationPreferenceSwitch'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-preference:switch.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El switch scaffold no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-preference-switch-payload',
    label: 'Generated domain materialization preference switch payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationSwitchReadinessReportPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: { files: [] },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-switch-readiness-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Resumir readiness del switch sin cambiar comportamiento.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationSwitchReadinessReport?.present === true &&
      decision.generatedDomainMaterializationSwitchReadinessReport?.evaluated === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationSwitchReadinessReport al payload.',
  )
  pushFailure(
    failures,
    ['not-ready', 'ready-for-test-harness', 'ready-for-controlled-enable', 'blocked'].includes(
      decision.generatedDomainMaterializationSwitchReadinessReport?.status,
    ) &&
      ['observe', 'test-harness-only', 'prepare-controlled-enable', 'investigate'].includes(
        decision.generatedDomainMaterializationSwitchReadinessReport?.recommendation?.action,
      ),
    'El readiness report debe devolver un estado observacional válido y una recomendación segura.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationSwitchReadinessReport?.behaviorChanged === false &&
      decision.generatedDomainMaterializationSwitchReadinessReport?.readiness
        ?.switchEnabled === false,
    'generatedDomainMaterializationSwitchReadinessReport debe seguir observacional y no marcar cambios de comportamiento.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-switch:readiness') &&
      mainSource.includes('generatedDomainMaterializationSwitchReadinessReport') &&
      mainSource.includes('buildGeneratedDomainMaterializationSwitchReadinessReport'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-switch:readiness.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El readiness report no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-switch-readiness-payload',
    label: 'Generated domain materialization switch readiness payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationSourceResolutionPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: { files: [] },
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-materialization-source-resolution-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Resolver la fuente observacional sin cambiar el runtime real.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationSourceResolution?.present === true &&
      decision.generatedDomainMaterializationSourceResolution?.resolved === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationSourceResolution al payload.',
  )
  pushFailure(
    failures,
    ['current', 'legacy', 'none', 'generated-domain-shadow', 'blocked'].includes(
      decision.generatedDomainMaterializationSourceResolution?.source,
    ) &&
      ['runtime-disabled', 'test-enabled'].includes(
        decision.generatedDomainMaterializationSourceResolution?.mode,
      ),
    'La resolución de fuente debe devolver una source y un mode válidos.',
  )
  pushFailure(
    failures,
    ['current', 'legacy'].includes(
      decision.generatedDomainMaterializationSourceResolution?.source,
    ) &&
      decision.generatedDomainMaterializationSourceResolution?.behaviorChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'generatedDomainMaterializationSourceResolution debe conservar current/legacy en runtime normal y no mutar materializationPlan ni executionScope.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-source:resolution') &&
      mainSource.includes('generatedDomainMaterializationSourceResolution') &&
      mainSource.includes('resolveGeneratedDomainMaterializationSource'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-source:resolution.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'La resolución observacional no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-source-resolution-payload',
    label: 'Generated domain materialization source resolution payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationSourceResolutionTestEnabledProjectionPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: {
      files: [],
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const baseDecisionInput = {
    decisionKey: 'generated-domain-materialization-source-resolution-test-enabled-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Proyectar shadow en harness sin cambiar el runtime real.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  }
  const runtimeDecision = plannerApi.buildBrainDecisionContract(baseDecisionInput)
  const testEnabledDecision = plannerApi.buildBrainDecisionContract({
    ...baseDecisionInput,
    generatedDomainMaterializationPreferenceSwitchOptions: {
      testEnabled: true,
    },
    generatedDomainMaterializationSourceResolutionOptions: {
      testEnabled: true,
    },
  })

  pushFailure(
    failures,
    runtimeDecision.generatedDomainMaterializationSourceResolution?.present === true &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.mode ===
        'runtime-disabled' &&
      ['current', 'legacy'].includes(
        runtimeDecision.generatedDomainMaterializationSourceResolution?.source,
      ) &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.source !==
        'generated-domain-shadow' &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.behaviorChanged === false,
    'Sin opcion explicita de harness, la resolucion debe quedarse en runtime-disabled y nunca seleccionar generated-domain-shadow como fuente real.',
  )
  pushFailure(
    failures,
    testEnabledDecision.generatedDomainMaterializationSourceResolution?.present === true &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.mode ===
        'test-enabled' &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.testProjection
        ?.wouldSelectShadow === true &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.testProjection
        ?.projectedSource === 'generated-domain-shadow' &&
      ['current', 'legacy'].includes(
        testEnabledDecision.generatedDomainMaterializationSourceResolution?.runtime
          ?.selectedSource,
      ) &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.behaviorChanged === false,
    'Con opcion test-enabled explicita, el harness debe poder proyectar generated-domain-shadow sin mutar materializationPlan ni executionScope reales.',
  )
  pushFailure(
    failures,
    testEnabledDecision.generatedDomainMaterializationPreferenceSwitch?.enabled === true &&
      testEnabledDecision.generatedDomainMaterializationPreferenceSwitch?.mode ===
        'test-enabled' &&
      testEnabledDecision.generatedDomainMaterializationSwitchReadinessReport?.status ===
        'ready-for-test-harness' &&
      testEnabledDecision.generatedDomainMaterializationPreferenceDecision?.dryRun
        ?.wouldPreferShadow === true &&
      testEnabledDecision.generatedDomainMaterializationPreferenceGate?.status ===
        'eligible',
    'El test-enabled projection debe quedar respaldado por switch, readiness, dry-run y gate elegibles dentro del harness.',
  )
  pushFailure(
    failures,
    runtimeDecision.strategy === 'materialize-fullstack-local-plan' &&
      runtimeDecision.executionMode === 'executor' &&
      runtimeDecision.nextExpectedAction === 'execute-plan' &&
      testEnabledDecision.strategy === 'materialize-fullstack-local-plan' &&
      testEnabledDecision.executionMode === 'executor' &&
      testEnabledDecision.nextExpectedAction === 'execute-plan',
    'Ni runtime normal ni test-enabled deben cambiar strategy, executionMode o nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-source-resolution-test-enabled-projection-payload',
    label: 'Generated domain materialization source resolution test-enabled projection payload',
    failures,
  }
}

async function runGeneratedDomainShadowMaterializationCandidatePlanPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-materialization-candidate-plan-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Adjuntar un candidate observacional sin cambiar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainShadowMaterializationCandidatePlan?.present === true &&
      decision.generatedDomainShadowMaterializationCandidatePlan?.status === 'built' &&
      decision.generatedDomainShadowMaterializationCandidatePlan?.built === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainShadowMaterializationCandidatePlan cuando el shadow plan sea convertible.',
  )
  pushFailure(
    failures,
    decision.generatedDomainShadowMaterializationCandidatePlan?.compatibility
      ?.resemblesMaterializationPlan === true &&
      decision.generatedDomainShadowMaterializationCandidatePlan?.compatibility
        ?.canBeInspected === true &&
      Array.isArray(
        decision.generatedDomainShadowMaterializationCandidatePlan?.candidate
          ?.allowedTargetPaths,
      ) &&
      Array.isArray(
        decision.generatedDomainShadowMaterializationCandidatePlan?.candidate
          ?.requiredPathGroups,
      ),
    'El candidate plan debe parecerse a materializationPlan y exponer allowedTargetPaths + requiredPathGroups inspeccionables.',
  )
  pushFailure(
    failures,
    !Object.prototype.hasOwnProperty.call(
      decision.generatedDomainShadowMaterializationCandidatePlan?.candidate || {},
      'operations',
    ) &&
      decision.generatedDomainShadowMaterializationCandidatePlan?.behaviorChanged === false,
    'El candidate plan no debe incluir operations ejecutables ni cambiar comportamiento runtime.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.materializationPlan?.projectRoot === 'community-libraries-local' &&
      Array.isArray(decision.executionScope?.allowedTargetPaths),
    'El candidate observacional no debe cambiar strategy, executionMode, nextExpectedAction, materializationPlan real ni executionScope real.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-shadow-materialization-candidate:plan') &&
      mainSource.includes('generatedDomainShadowMaterializationCandidatePlan') &&
      mainSource.includes('buildGeneratedDomainShadowMaterializationCandidatePlan'),
    'main.cjs debe adjuntar y loguear generated-domain-shadow-materialization-candidate:plan.',
  )

  return {
    id: 'generated-domain-shadow-materialization-candidate-plan-payload',
    label: 'Generated domain shadow materialization candidate plan payload',
    failures,
  }
}

async function runGeneratedDomainShadowMaterializationEndToEndReadinessPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const baseDecisionInput = {
    decisionKey: 'generated-domain-shadow-end-to-end-readiness-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Validar el pipeline shadow completo sin cambiar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  }
  const runtimeDecision = plannerApi.buildBrainDecisionContract(baseDecisionInput)
  const testEnabledDecision = plannerApi.buildBrainDecisionContract({
    ...baseDecisionInput,
    generatedDomainMaterializationPreferenceSwitchOptions: {
      testEnabled: true,
    },
    generatedDomainMaterializationSourceResolutionOptions: {
      testEnabled: true,
    },
  })

  pushFailure(
    failures,
    runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.present ===
      true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.status ===
        'ready-for-test-harness' &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.contractValid === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.shadowPlanBuilt === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.candidateBuilt === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.candidateInspectable === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.candidateUsableByFutureSwitch === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.gateEligible === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.diffAligned === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.switchReadyForTestHarness === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.sourceResolutionProjectsShadowInTest === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.pipeline
        ?.runtimeStillDisabled === true,
    'El readiness end-to-end debe marcar el pipeline shadow como listo para harness cuando todas las piezas observacionales estan alineadas.',
  )
  pushFailure(
    failures,
    runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.safeguards
      ?.noOperations === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.safeguards
        ?.noCommands === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.safeguards
        ?.noFileWrites === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.safeguards
        ?.noWebPrueba === true &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.safeguards
        ?.materializationPlanChanged === false &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness?.safeguards
        ?.executionScopeChanged === false &&
      runtimeDecision.generatedDomainShadowMaterializationEndToEndReadiness
        ?.behaviorChanged === false,
    'El readiness end-to-end debe seguir observacional, sin operations, commands, writes ni mutaciones reales.',
  )
  pushFailure(
    failures,
    ['current', 'legacy'].includes(
      runtimeDecision.generatedDomainMaterializationSourceResolution?.source,
    ) &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.source !==
        'generated-domain-shadow' &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      runtimeDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'En runtime normal, el pipeline end-to-end no debe permitir que generated-domain-shadow se vuelva la fuente real.',
  )
  pushFailure(
    failures,
    testEnabledDecision.generatedDomainMaterializationSourceResolution?.mode ===
      'test-enabled' &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.testProjection
        ?.projectedSource === 'generated-domain-shadow' &&
      ['current', 'legacy'].includes(
        testEnabledDecision.generatedDomainMaterializationSourceResolution?.runtime
          ?.selectedSource,
      ) &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      testEnabledDecision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'En test-enabled, el pipeline end-to-end debe poder proyectar generated-domain-shadow sin mutar el runtime real.',
  )
  pushFailure(
    failures,
    runtimeDecision.strategy === 'materialize-fullstack-local-plan' &&
      runtimeDecision.executionMode === 'executor' &&
      runtimeDecision.nextExpectedAction === 'execute-plan' &&
      testEnabledDecision.strategy === 'materialize-fullstack-local-plan' &&
      testEnabledDecision.executionMode === 'executor' &&
      testEnabledDecision.nextExpectedAction === 'execute-plan',
    'El readiness end-to-end no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-shadow-materialization:end-to-end') &&
      mainSource.includes('generatedDomainShadowMaterializationEndToEndReadiness') &&
      mainSource.includes('buildGeneratedDomainShadowMaterializationEndToEndReadiness'),
    'main.cjs debe adjuntar y loguear generated-domain-shadow-materialization:end-to-end.',
  )

  return {
    id: 'generated-domain-shadow-materialization-end-to-end-readiness-payload',
    label: 'Generated domain shadow materialization end-to-end readiness payload',
    failures,
  }
}

async function runGeneratedDomainControlledEnablePolicyPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-controlled-enable-policy-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Validar la policy observacional de controlled enable sin cambiar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainControlledEnablePolicy?.present === true &&
      [
        'eligible-for-test-enable',
        'eligible-for-controlled-runtime-enable',
      ].includes(decision.generatedDomainControlledEnablePolicy?.status) &&
      decision.generatedDomainControlledEnablePolicy?.runtimeEnabled === false,
    'buildBrainDecisionContract debe adjuntar generatedDomainControlledEnablePolicy sin activar runtime real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainControlledEnablePolicy?.eligibility
      ?.hasLegacyMaterializationPlan === true &&
      decision.generatedDomainControlledEnablePolicy?.eligibility
        ?.hasShadowCandidate === true &&
      decision.generatedDomainControlledEnablePolicy?.eligibility
        ?.candidateUsableByFutureSwitch === true &&
      decision.generatedDomainControlledEnablePolicy?.eligibility
        ?.endToEndReadyForHarness === true &&
      decision.generatedDomainControlledEnablePolicy?.allowedModes
        ?.controlledRuntimeEnable === false,
    'La policy debe reflejar la elegibilidad observacional sin habilitar controlledRuntimeEnable.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceSwitch?.enabled === false &&
      decision.generatedDomainMaterializationSourceResolution?.source !==
        'generated-domain-shadow' &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'La policy no debe activar el switch ni convertir generated-domain-shadow en la fuente real.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.materializationPlan?.projectRoot === 'community-libraries-local' &&
      Array.isArray(decision.executionScope?.allowedTargetPaths),
    'La policy observacional no debe cambiar strategy, executionMode, nextExpectedAction, materializationPlan real ni executionScope real.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-controlled-enable:policy') &&
      mainSource.includes('generatedDomainControlledEnablePolicy') &&
      mainSource.includes('buildGeneratedDomainControlledEnablePolicy'),
    'main.cjs debe adjuntar y loguear generated-domain-controlled-enable:policy.',
  )

  return {
    id: 'generated-domain-controlled-enable-policy-payload',
    label: 'Generated domain controlled enable policy payload',
    failures,
  }
}

async function runGeneratedDomainFirstControlledEnableScenarioPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: {
      files: [],
    },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-first-controlled-enable-scenario-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Validar el escenario ultra acotado del primer enable real sin activar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainFirstControlledEnableScenario?.present === true &&
      decision.generatedDomainFirstControlledEnableScenario?.status ===
        'ready-for-review' &&
      decision.generatedDomainFirstControlledEnableScenario?.allowedNow === false &&
      decision.generatedDomainFirstControlledEnableScenario?.requiresLeanApproval ===
        true,
    'buildBrainDecisionContract debe adjuntar el primer escenario controlado sin habilitarlo.',
  )
  pushFailure(
    failures,
    decision.generatedDomainFirstControlledEnableScenario?.conditions
      ?.fullstackLocalOnly === true &&
      decision.generatedDomainFirstControlledEnableScenario?.conditions
        ?.hasLegacyMaterializationPlan === true &&
      decision.generatedDomainFirstControlledEnableScenario?.conditions
        ?.candidateUsableByFutureSwitch === true &&
      decision.generatedDomainFirstControlledEnableScenario?.conditions
        ?.controlledRuntimeEnable === false,
    'El escenario controlado debe reflejar condiciones estructurales fuertes sin controlledRuntimeEnable real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceSwitch?.enabled === false &&
      decision.generatedDomainMaterializationSourceResolution?.source !==
        'generated-domain-shadow' &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'El primer escenario controlado no debe activar switch, source shadow real ni mutaciones de runtime.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.materializationPlan?.projectRoot === 'community-libraries-local' &&
      Array.isArray(decision.executionScope?.allowedTargetPaths),
    'El escenario controlado no debe cambiar strategy, executionMode, nextExpectedAction, materializationPlan real ni executionScope real.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-controlled-enable:first-scenario') &&
      mainSource.includes('generatedDomainFirstControlledEnableScenario') &&
      mainSource.includes('buildGeneratedDomainFirstControlledEnableScenario'),
    'main.cjs debe adjuntar y loguear generated-domain-controlled-enable:first-scenario.',
  )

  return {
    id: 'generated-domain-first-controlled-enable-scenario-payload',
    label: 'Generated domain first controlled enable scenario payload',
    failures,
  }
}

async function runGeneratedDomainShadowCandidateLegacyComparisonPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-candidate-legacy-comparison-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Comparar candidate shadow y materializationPlan legacy sin cambiar runtime ni escribir archivos.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
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

  pushFailure(
    failures,
    decision.generatedDomainShadowCandidateLegacyComparison?.present === true &&
      decision.generatedDomainShadowCandidateLegacyComparison?.compared === true &&
      decision.generatedDomainShadowCandidateLegacyComparison?.status === 'aligned',
    'buildBrainDecisionContract debe adjuntar generatedDomainShadowCandidateLegacyComparison alineado cuando candidate y legacy comparten la misma forma segura.',
  )
  pushFailure(
    failures,
    decision.generatedDomainShadowCandidateLegacyComparison?.roots?.aligned === true &&
      decision.generatedDomainShadowCandidateLegacyComparison?.allowedTargets?.aligned ===
        true &&
      decision.generatedDomainShadowCandidateLegacyComparison?.requiredGroups?.aligned ===
        true &&
      decision.generatedDomainShadowCandidateLegacyComparison?.safety?.aligned === true,
    'La comparacion candidate-vs-legacy debe alinear root, allowedTargetPaths, requiredPathGroups y safety.',
  )
  pushFailure(
    failures,
    decision.generatedDomainShadowCandidateLegacyComparison?.operations
      ?.candidateHasOperations === false &&
      decision.generatedDomainShadowCandidateLegacyComparison?.operations
        ?.candidateHasCommands === false &&
      decision.generatedDomainShadowCandidateLegacyComparison?.operations
        ?.candidateHasWrites === false &&
      decision.generatedDomainShadowCandidateLegacyComparison?.behaviorChanged === false,
    'La comparacion candidate-vs-legacy debe seguir observacional, sin operations, commands ni writes en el candidate.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'La comparacion candidate-vs-legacy no debe cambiar strategy, executionMode, nextExpectedAction ni mutar runtime real.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-shadow-candidate:comparison') &&
      mainSource.includes('generatedDomainShadowCandidateLegacyComparison') &&
      mainSource.includes('buildGeneratedDomainShadowCandidateLegacyComparison'),
    'main.cjs debe adjuntar y loguear generated-domain-shadow-candidate:comparison.',
  )

  return {
    id: 'generated-domain-shadow-candidate-legacy-comparison-payload',
    label: 'Generated domain shadow candidate legacy comparison payload',
    failures,
  }
}

async function runGeneratedDomainFileCreationApprovalPolicyPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-file-creation-approval-policy-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Preparar una policy observacional para futura creacion real de archivos con aprobacion explicita.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
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

  pushFailure(
    failures,
    decision.generatedDomainFileCreationApprovalPolicy?.present === true &&
      decision.generatedDomainFileCreationApprovalPolicy?.status ===
        'ready-for-manual-approval-review' &&
      decision.generatedDomainFileCreationApprovalPolicy?.approvalRequired === true &&
      decision.generatedDomainFileCreationApprovalPolicy?.approved === false &&
      decision.generatedDomainFileCreationApprovalPolicy?.allowedNow === false &&
      decision.generatedDomainFileCreationApprovalPolicy?.requiresLeanApproval === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainFileCreationApprovalPolicy como gate observacional antes de cualquier escritura real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainFileCreationApprovalPolicy?.evidence
      ?.candidateComparisonStatus === 'aligned' &&
      decision.generatedDomainFileCreationApprovalPolicy?.safeguards?.noDotEnv ===
        true &&
      decision.generatedDomainFileCreationApprovalPolicy?.safeguards
        ?.noNodeModules === true &&
      decision.generatedDomainFileCreationApprovalPolicy?.safeguards?.noCommands ===
        true &&
      decision.generatedDomainFileCreationApprovalPolicy?.safeguards
        ?.noWritesExecuted === true &&
      decision.generatedDomainFileCreationApprovalPolicy?.safeguards?.noWebPrueba ===
        true,
    'La policy de aprobacion debe exigir comparacion alineada y excluir .env, node_modules, commands, writes y web-prueba.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPreferenceSwitch?.enabled === false &&
      decision.generatedDomainMaterializationSourceResolution?.source !==
        'generated-domain-shadow' &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false &&
      decision.generatedDomainFileCreationApprovalPolicy?.behaviorChanged === false,
    'La policy de aprobacion no debe activar runtime shadow ni mutar materializationPlan o executionScope reales.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.generatedDomainFileCreationApprovalPolicy?.recommendation?.action ===
        'request-lean-approval',
    'La policy de aprobacion debe dejar el flujo igual y solo pedir revision explicita de Lean.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-file-creation:approval-policy') &&
      mainSource.includes('generatedDomainFileCreationApprovalPolicy') &&
      mainSource.includes('buildGeneratedDomainFileCreationApprovalPolicy'),
    'main.cjs debe adjuntar y loguear generated-domain-file-creation:approval-policy.',
  )

  return {
    id: 'generated-domain-file-creation-approval-policy-payload',
    label: 'Generated domain file creation approval policy payload',
    failures,
  }
}

async function runGeneratedDomainUniversalMaterializationPlanPreviewPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'tool-bank', label: 'Tool Bank' },
    root: {
      slug: 'tool-bank-local',
      sourceRoot: 'tool-bank-local',
      targetRoot: 'tool-bank-local',
    },
    roles: ['neighbor', 'coordinator', 'repair-team'],
    entities: ['tools', 'loans', 'maintenance'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['loan-checkout', 'returns', 'maintenance'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/tools.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [{ path: 'backend/src/modules/loans.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['tools', 'loans', 'maintenance'],
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-universal-materialization-preview-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Construir el universal materialization preview desde el contrato sin tocar runtime real.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'tool-bank-local',
    targetRoot: 'tool-bank-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'tool bank',
      intent: 'manage tools, loans and maintenance',
      deliveryLevel: 'fullstack-local',
      roles: ['neighbor', 'coordinator', 'repair-team'],
      modules: ['catalog', 'loans', 'maintenance'],
      entities: ['tools', 'loans', 'maintenance'],
      coreFlows: ['loan-checkout', 'returns', 'maintenance'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'tool bank',
      users: ['neighbors', 'coordinators', 'repair team'],
      roles: ['neighbor', 'coordinator', 'repair-team'],
      coreModules: ['catalog', 'loans', 'maintenance'],
      dataEntities: ['tools', 'loans', 'maintenance'],
      keyFlows: ['loan-checkout', 'returns', 'maintenance'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'tool-bank-local',
      domain: 'tool bank',
      title: 'Tool bank local review',
      targetStructure: [
        'tool-bank-local/',
        'tool-bank-local/frontend/public/',
        'tool-bank-local/frontend/admin/',
        'tool-bank-local/backend/src/',
        'tool-bank-local/database/',
        'tool-bank-local/docs/',
      ],
      allowedRootPaths: ['tool-bank-local'],
      directories: [
        'tool-bank-local/frontend/public',
        'tool-bank-local/frontend/admin',
        'tool-bank-local/backend/src',
        'tool-bank-local/database',
        'tool-bank-local/docs',
      ],
      modules: ['catalog', 'loans', 'maintenance'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'tool-bank-local',
      domain: 'tool bank',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'tool-bank-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'tool-bank-local'
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

  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlanPreview?.present === true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.built === true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.status === 'built' &&
      decision.generatedDomainUniversalMaterializationPlanPreview
        ?.canBecomeMaterializationPlan === true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.approvalRequired === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainUniversalMaterializationPlanPreview built como evidencia universal sin volverlo plan real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlanPreview?.safety
      ?.safeForLocalMaterialization === true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.safety?.noDotEnv ===
        true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.safety
        ?.noNodeModules === true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.safety?.noDocker ===
        true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.safety?.noCommands ===
        true &&
      decision.generatedDomainUniversalMaterializationPlanPreview?.safety?.noWrites ===
        true,
    'El universal preview debe seguir libre de .env, node_modules, Docker, commands y writes.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainUniversalMaterializationPlanPreview') &&
      mainSource.includes('generated-domain-universal-materialization:preview') &&
      mainSource.includes('buildGeneratedDomainUniversalMaterializationPlanPreview'),
    'main.cjs debe adjuntar y loguear generated-domain-universal-materialization:preview.',
  )

  return {
    id: 'generated-domain-universal-materialization-preview-payload',
    label: 'Generated domain universal materialization preview payload',
    failures,
  }
}

async function runGeneratedDomainUniversalMaterializationPlanPreviewComparisonPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'animal-shelters', label: 'Animal Shelters' },
    root: {
      slug: 'animal-shelters-local',
      sourceRoot: 'animal-shelters-local',
      targetRoot: 'animal-shelters-local',
    },
    roles: ['volunteer', 'coordinator', 'adoption-team'],
    entities: ['animals', 'adoptions', 'volunteers'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['adoption-tracking', 'medical-checks', 'volunteer-shifts'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/animals.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [{ path: 'backend/src/modules/adoptions.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['animals', 'adoptions', 'volunteers'],
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-universal-materialization-preview-comparison-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Comparar preview universal, candidate shadow y materializationPlan legacy sin cambiar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'animal-shelters-local',
    targetRoot: 'animal-shelters-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'animal shelters',
      intent: 'manage animals, adoptions and volunteers',
      deliveryLevel: 'fullstack-local',
      roles: ['volunteer', 'coordinator', 'adoption-team'],
      modules: ['catalog', 'adoptions', 'reports'],
      entities: ['animals', 'adoptions', 'volunteers'],
      coreFlows: ['adoption-tracking', 'medical-checks', 'volunteer-shifts'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'animal shelters',
      users: ['volunteers', 'coordinators', 'adoption team'],
      roles: ['volunteer', 'coordinator', 'adoption-team'],
      coreModules: ['catalog', 'adoptions', 'reports'],
      dataEntities: ['animals', 'adoptions', 'volunteers'],
      keyFlows: ['adoption-tracking', 'medical-checks', 'volunteer-shifts'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'animal-shelters-local',
      domain: 'animal shelters',
      title: 'Animal shelters local review',
      targetStructure: [
        'animal-shelters-local/',
        'animal-shelters-local/frontend/public/',
        'animal-shelters-local/frontend/admin/',
        'animal-shelters-local/backend/src/',
        'animal-shelters-local/database/',
        'animal-shelters-local/docs/',
      ],
      allowedRootPaths: ['animal-shelters-local'],
      directories: [
        'animal-shelters-local/frontend/public',
        'animal-shelters-local/frontend/admin',
        'animal-shelters-local/backend/src',
        'animal-shelters-local/database',
        'animal-shelters-local/docs',
      ],
      modules: ['catalog', 'adoptions', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'animal-shelters-local',
      domain: 'animal shelters',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'animal-shelters-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'animal-shelters-local'
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

  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlanPreviewComparison?.present ===
      true &&
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison?.compared ===
        true &&
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison?.status ===
        'aligned',
    'buildBrainDecisionContract debe adjuntar generatedDomainUniversalMaterializationPlanPreviewComparison alineado cuando preview, candidate y legacy comparten forma segura.',
  )
  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlanPreviewComparison?.roots
      ?.aligned === true &&
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison
        ?.allowedTargets?.aligned === true &&
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison
        ?.requiredGroups?.aligned === true &&
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison
        ?.safety?.aligned === true &&
      decision.generatedDomainUniversalMaterializationPlanPreviewComparison
        ?.behaviorChanged === false,
    'La comparacion del universal preview debe quedar alineada y seguir solo observacional.',
  )
  pushFailure(
    failures,
    mainSource.includes(
      'generatedDomainUniversalMaterializationPlanPreviewComparison',
    ) &&
      mainSource.includes(
        'generated-domain-universal-materialization:preview-comparison',
      ) &&
      mainSource.includes(
        'buildGeneratedDomainUniversalMaterializationPlanPreviewComparison',
      ),
    'main.cjs debe adjuntar y loguear generated-domain-universal-materialization:preview-comparison.',
  )

  return {
    id: 'generated-domain-universal-materialization-preview-comparison-payload',
    label: 'Generated domain universal materialization preview comparison payload',
    failures,
  }
}

async function runGeneratedDomainStructuralCapabilitiesPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      slug: 'cooperativa-herramientas-raras',
      label: 'Cooperativa de Herramientas Raras',
    },
    root: {
      slug: 'cooperativa-herramientas-raras-local',
      sourceRoot: 'cooperativa-herramientas-raras-local',
      targetRoot: 'cooperativa-herramientas-raras-local',
    },
    roles: ['neighbor', 'coordinator', 'repair-team'],
    entities: ['tools', 'loans', 'maintenance', 'reports'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
      { key: 'operator', label: 'Operator', path: 'frontend/operator', screens: ['scheduling'] },
    ],
    workflows: ['loan-checkout', 'maintenance', 'community-reporting'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/tools.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [{ path: 'backend/src/modules/loans.js' }],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['tools', 'loans', 'maintenance'],
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-structural-capabilities-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Derivar capabilities estructurales sin tocar runtime real.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'cooperativa-herramientas-raras-local',
    targetRoot: 'cooperativa-herramientas-raras-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'cooperativa de herramientas raras',
      intent: 'manage tools, maintenance and community reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['neighbor', 'coordinator', 'repair-team'],
      modules: ['catalog', 'maintenance', 'reports', 'scheduling'],
      entities: ['tools', 'loans', 'maintenance'],
      coreFlows: ['loan-checkout', 'maintenance', 'community-reporting'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'cooperativa de herramientas raras',
      users: ['neighbors', 'coordinators', 'repair team'],
      roles: ['neighbor', 'coordinator', 'repair-team'],
      coreModules: ['catalog', 'maintenance', 'reports', 'scheduling'],
      dataEntities: ['tools', 'loans', 'maintenance'],
      keyFlows: ['loan-checkout', 'maintenance', 'community-reporting'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'cooperativa-herramientas-raras-local',
      domain: 'cooperativa de herramientas raras',
      title: 'Cooperativa herramientas raras local review',
      targetStructure: [
        'cooperativa-herramientas-raras-local/',
        'cooperativa-herramientas-raras-local/frontend/public/',
        'cooperativa-herramientas-raras-local/frontend/admin/',
        'cooperativa-herramientas-raras-local/frontend/operator/',
        'cooperativa-herramientas-raras-local/backend/src/',
        'cooperativa-herramientas-raras-local/database/',
      ],
      allowedRootPaths: ['cooperativa-herramientas-raras-local'],
      directories: [
        'cooperativa-herramientas-raras-local/frontend/public',
        'cooperativa-herramientas-raras-local/frontend/admin',
        'cooperativa-herramientas-raras-local/frontend/operator',
        'cooperativa-herramientas-raras-local/backend/src',
        'cooperativa-herramientas-raras-local/database',
      ],
      modules: ['catalog', 'maintenance', 'reports', 'scheduling'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'cooperativa-herramientas-raras-local',
      domain: 'cooperativa de herramientas raras',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'cooperativa-herramientas-raras-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'cooperativa-herramientas-raras-local'
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

  pushFailure(
    failures,
    decision.generatedDomainStructuralCapabilities?.present === true &&
      decision.generatedDomainStructuralCapabilities?.evaluated === true &&
      decision.generatedDomainStructuralCapabilities?.hasPublicFrontend === true &&
      decision.generatedDomainStructuralCapabilities?.hasAdminPanel === true &&
      decision.generatedDomainStructuralCapabilities?.hasBackend === true &&
      decision.generatedDomainStructuralCapabilities?.hasDatabase === true &&
      decision.generatedDomainStructuralCapabilities?.hasReporting === true &&
      decision.generatedDomainStructuralCapabilities?.hasValidation === true &&
      decision.generatedDomainStructuralCapabilities?.hasSafeLocalMaterialization === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainStructuralCapabilities derivadas por estructura y no por rubro.',
  )
  pushFailure(
    failures,
    decision.generatedDomainStructuralCapabilities?.behaviorChanged === false &&
      decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'Las capabilities estructurales deben seguir solo observacionales y no cambiar el contrato de ejecucion real.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainStructuralCapabilities') &&
      mainSource.includes('generated-domain-structural-capabilities') &&
      mainSource.includes('deriveGeneratedDomainStructuralCapabilities'),
    'main.cjs debe adjuntar y loguear generated-domain-structural-capabilities.',
  )

  return {
    id: 'generated-domain-structural-capabilities-payload',
    label: 'Generated domain structural capabilities payload',
    failures,
  }
}

async function runLegacyDomainHardcodingDebtReportPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
    shared: { files: ['shared/contracts/domain.js'] },
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    ...buildReusablePlanningContext(),
    decisionKey: 'legacy-domain-hardcoding-debt-report-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Emitir un reporte observacional de deuda legacy sin cambiar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
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

  pushFailure(
    failures,
    decision.legacyDomainHardcodingDebtReport?.present === true &&
      decision.legacyDomainHardcodingDebtReport?.evaluated === true &&
      decision.legacyDomainHardcodingDebtReport?.behaviorChanged === false &&
      decision.legacyDomainHardcodingDebtReport?.runtimeCriticalCount > 0 &&
      decision.legacyDomainHardcodingDebtReport?.fixtureOnlyCount > 0,
    'buildBrainDecisionContract debe adjuntar legacyDomainHardcodingDebtReport como diagnostico compacto de deuda legacy sin alterar runtime.',
  )
  pushFailure(
    failures,
    Array.isArray(decision.legacyDomainHardcodingDebtReport?.migrationCandidates) &&
      decision.legacyDomainHardcodingDebtReport?.migrationCandidates.some(
        (entry) => entry?.area === 'buildCanonicalFullstackLocalMaterializationContract',
      ) &&
      Array.isArray(decision.legacyDomainHardcodingDebtReport?.riskyAreas) &&
      decision.legacyDomainHardcodingDebtReport?.riskyAreas.some(
        (entry) => entry?.area === 'buildFullstackLocalMaterializationPlan',
      ),
    'El debt report debe distinguir candidatos de migracion segura y zonas legacy mas riesgosas.',
  )
  pushFailure(
    failures,
    mainSource.includes('legacyDomainHardcodingDebtReport') &&
      mainSource.includes('legacy-domain-hardcoding:debt-report') &&
      mainSource.includes('buildLegacyDomainHardcodingDebtReport'),
    'main.cjs debe adjuntar y loguear legacy-domain-hardcoding:debt-report.',
  )

  return {
    id: 'legacy-domain-hardcoding-debt-report-payload',
    label: 'Legacy domain hardcoding debt report payload',
    failures,
  }
}

async function runLocalDeterministicExecutorLegacyDebtReportPayloadCase() {
  const failures = []
  const decision = plannerApi.buildBrainDecisionContract({
    ...buildReusablePlanningContext(),
    decisionKey: 'local-deterministic-executor-legacy-debt-report-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Emitir un reporte observacional del executor legacy sin tocar runtime.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.localDeterministicExecutorLegacyDebtReport?.present === true &&
      decision.localDeterministicExecutorLegacyDebtReport?.evaluated === true &&
      decision.localDeterministicExecutorLegacyDebtReport?.behaviorChanged === false &&
      decision.localDeterministicExecutorLegacyDebtReport?.executorFilePresent === true &&
      decision.localDeterministicExecutorLegacyDebtReport?.runtimeCriticalCount > 0,
    'buildBrainDecisionContract debe poder adjuntar localDeterministicExecutorLegacyDebtReport como diagnostico observacional del executor.',
  )
  pushFailure(
    failures,
    Array.isArray(decision.localDeterministicExecutorLegacyDebtReport?.domainSpecificSignals) &&
      decision.localDeterministicExecutorLegacyDebtReport?.domainSpecificSignals.includes('ecommerce') &&
      decision.localDeterministicExecutorLegacyDebtReport?.domainSpecificSignals.includes('school-crm') &&
      decision.localDeterministicExecutorLegacyDebtReport?.domainSpecificSignals.includes('generic'),
    'El debt report del executor debe detectar senales legacy conocidas sin crear ramas nuevas.',
  )
  pushFailure(
    failures,
    mainSource.includes('localDeterministicExecutorLegacyDebtReport') &&
      mainSource.includes('local-deterministic-executor:legacy-debt-report') &&
      mainSource.includes('buildLocalDeterministicExecutorLegacyDebtReport'),
    'main.cjs debe adjuntar y loguear local-deterministic-executor:legacy-debt-report.',
  )

  return {
    id: 'local-deterministic-executor-legacy-debt-report-payload',
    label: 'Local deterministic executor legacy debt report payload',
    failures,
  }
}

async function runLocalDeterministicExecutorCapabilityMigrationPlanPayloadCase() {
  const failures = []
  const decision = plannerApi.buildBrainDecisionContract({
    ...buildReusablePlanningContext(),
    decisionKey: 'local-deterministic-executor-capability-migration-plan-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Emitir un plan observacional de migracion del executor a capabilities.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.localDeterministicExecutorCapabilityMigrationPlan?.present === true &&
      decision.localDeterministicExecutorCapabilityMigrationPlan?.evaluated === true &&
      decision.localDeterministicExecutorCapabilityMigrationPlan?.behaviorChanged === false &&
      Array.isArray(decision.localDeterministicExecutorCapabilityMigrationPlan?.capabilityTargets) &&
      decision.localDeterministicExecutorCapabilityMigrationPlan?.branchMappedCount > 0,
    'buildBrainDecisionContract debe adjuntar localDeterministicExecutorCapabilityMigrationPlan como mapa de migracion sin alterar el executor real.',
  )
  pushFailure(
    failures,
    decision.localDeterministicExecutorCapabilityMigrationPlan?.capabilityTargets?.some(
      (entry) =>
        entry?.capability === 'catalog' &&
        Array.isArray(entry?.currentBranches) &&
        entry.currentBranches.includes('ecommerce-mode-branches'),
    ) &&
      decision.localDeterministicExecutorCapabilityMigrationPlan?.capabilityTargets?.some(
        (entry) =>
          entry?.capability === 'backend-api' && entry?.migrationReadiness === 'not-ready',
      ),
    'El plan de migracion del executor debe distinguir capacidades ya mapeables de las que aun no conviene tocar.',
  )
  pushFailure(
    failures,
    mainSource.includes('localDeterministicExecutorCapabilityMigrationPlan') &&
      mainSource.includes('local-deterministic-executor:capability-migration-plan') &&
      mainSource.includes('buildLocalDeterministicExecutorCapabilityMigrationPlan'),
    'main.cjs debe adjuntar y loguear el plan observacional de migracion del executor.',
  )

  return {
    id: 'local-deterministic-executor-capability-migration-plan-payload',
    label: 'Local deterministic executor capability migration plan payload',
    failures,
  }
}

async function runGeneratedDomainMaterializationInspectionSourceResolutionPayloadCase() {
  const failures = []
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-materialization-inspection-source-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Preferir candidate o contract en la inspeccion solo de forma observacional, con fallback legacy controlado.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
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

  pushFailure(
    failures,
    decision.generatedDomainMaterializationInspectionSourceResolution?.present === true &&
      decision.generatedDomainMaterializationInspectionSourceResolution?.resolved ===
        true &&
      decision.generatedDomainMaterializationInspectionSourceResolution?.source ===
        'generated-domain-candidate' &&
      decision.generatedDomainMaterializationInspectionSourceResolution
        ?.candidatePreferred === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationInspectionSourceResolution prefiriendo candidate cuando la cadena observacional es segura.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationInspectionSourceResolution?.runtime
      ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationInspectionSourceResolution?.runtime
        ?.executionScopeChanged === false &&
      decision.generatedDomainMaterializationInspectionSourceResolution
        ?.behaviorChanged === false,
    'La resolucion de fuente de inspeccion no debe mutar materializationPlan ni executionScope reales.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'La resolucion de fuente de inspeccion no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainMaterializationInspectionSourceResolution') &&
      mainSource.includes(
        'generated-domain-materialization-inspection-source:resolution',
      ) &&
      mainSource.includes(
        'buildGeneratedDomainMaterializationInspectionSourceResolution',
      ),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-inspection-source:resolution.',
  )

  return {
    id: 'generated-domain-materialization-inspection-source-resolution-payload',
    label: 'Generated domain materialization inspection source resolution payload',
    failures,
  }
}

function createAlignedGeneratedDomainObservationDecision({
  decisionKey = 'generated-domain-aligned-observation-decision',
} = {}) {
  const generatedDomainContract = {
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
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)

  return plannerApi.buildBrainDecisionContract({
    ...buildReusablePlanningContext(),
    decisionKey,
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Construir una cadena observacional alineada para candidate, approvals y readiness sin materializar nada.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-libraries-local',
    targetRoot: 'community-libraries-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      intent: 'manage catalog, loans and local reporting',
      deliveryLevel: 'fullstack-local',
      roles: ['member', 'librarian', 'admin'],
      modules: ['catalog', 'loans', 'reports'],
      entities: ['books', 'loans', 'members'],
      coreFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'community libraries',
      users: ['members', 'librarians', 'admins'],
      roles: ['member', 'librarian', 'admin'],
      coreModules: ['catalog', 'loans', 'reports'],
      dataEntities: ['books', 'loans', 'members'],
      keyFlows: ['manage catalog', 'register loans', 'review reports'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      title: 'Community libraries local review',
      targetStructure: [
        'community-libraries-local/',
        'community-libraries-local/frontend/public/',
        'community-libraries-local/frontend/admin/',
        'community-libraries-local/backend/src/',
        'community-libraries-local/database/',
        'community-libraries-local/docs/',
      ],
      allowedRootPaths: ['community-libraries-local'],
      directories: [
        'community-libraries-local/frontend/public',
        'community-libraries-local/frontend/admin',
        'community-libraries-local/backend/src',
        'community-libraries-local/database',
        'community-libraries-local/docs',
      ],
      modules: ['catalog', 'loans', 'reports'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-libraries-local',
      domain: 'community libraries',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
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

function createApprovedToolBankObservationDecision() {
  const approvedSandboxPath =
    'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\sandbox-toolbank-local'
  const generatedDomainContract = {
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
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const requiredPathGroups = deriveRequiredPathGroupsFromContract(generatedDomainContract)

  return plannerApi.buildBrainDecisionContract({
    ...buildReusablePlanningContext(),
    decisionKey: 'toolbank-approved-sandbox-observation',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason:
      'Reproducir la aprobacion humana de sandbox para un banco comunitario de herramientas barriales.',
    instruction:
      'Materializar solo la SFD local segura dentro del sandbox aprobado y no tocar web-prueba.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    sourceRoot: 'community-tool-bank-local',
    targetRoot: 'community-tool-bank-local',
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'banco comunitario de herramientas barriales',
      intent: 'gestionar prestamos y devoluciones de herramientas',
      deliveryLevel: 'fullstack-local',
      roles: ['vecino', 'coordinacion', 'voluntariado'],
      modules: ['catalog', 'loans', 'maintenance'],
      entities: ['tools', 'loans', 'members', 'maintenance'],
      coreFlows: ['register tool loans', 'track returns', 'schedule maintenance'],
    },
    productArchitecture: {
      productType: 'fullstack-local-app',
      domain: 'banco comunitario de herramientas barriales',
      users: ['vecino', 'coordinacion', 'voluntariado'],
      roles: ['vecino', 'coordinacion', 'voluntariado'],
      coreModules: ['catalog', 'loans', 'maintenance'],
      dataEntities: ['tools', 'loans', 'members', 'maintenance'],
      keyFlows: ['register tool loans', 'track returns', 'schedule maintenance'],
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-tool-bank-local',
      domain: 'banco comunitario de herramientas barriales',
      title: 'Community tool bank local review',
      targetStructure: [
        'community-tool-bank-local/',
        'community-tool-bank-local/frontend/public/',
        'community-tool-bank-local/frontend/admin/',
        'community-tool-bank-local/backend/src/',
        'community-tool-bank-local/database/',
        'community-tool-bank-local/docs/',
      ],
      allowedRootPaths: ['community-tool-bank-local'],
      directories: [
        'community-tool-bank-local/frontend/public',
        'community-tool-bank-local/frontend/admin',
        'community-tool-bank-local/backend/src',
        'community-tool-bank-local/database',
        'community-tool-bank-local/docs',
      ],
      modules: ['catalog', 'loans', 'maintenance'],
      successCriteria: [
        'Keep a local fullstack structure ready for review.',
        'Do not materialize files during the planner stage.',
      ],
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'community-tool-bank-local',
      domain: 'banco comunitario de herramientas barriales',
      projectType: 'fullstack-local-app',
    },
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-tool-bank-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-tool-bank-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
      contractDefinition: {
        requiredPathGroups,
      },
    },
    generatedDomainContract,
    resolvedDecisionMap: new Map([
      [
        'approve-sandbox-path',
        {
          status: 'approved',
          selectedOption: 'approved',
          freeAnswer: approvedSandboxPath,
          summary: 'Aprobacion humana explicita para materializacion sandbox controlada.',
        },
      ],
    ]),
    plannerFeedback: {
      type: 'approval-granted',
      approvalRequestDecisionKey: 'approve-sandbox-path',
      selectedOption: 'approved',
      freeAnswer: approvedSandboxPath,
      approvalReason:
        'No tocar web-prueba, no crear .env, no instalar dependencias ni usar servicios externos.',
    },
    workspacePath: repoRoot,
  })
}

async function runGeneratedDomainMaterializationApprovalPayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-materialization-approval-payload',
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationApprovalPayload?.present === true &&
      decision.generatedDomainMaterializationApprovalPayload?.status ===
        'ready-for-review' &&
      decision.generatedDomainMaterializationApprovalPayload?.approvalRequired ===
        true &&
      decision.generatedDomainMaterializationApprovalPayload?.approved === false,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationApprovalPayload como revision observacional de aprobacion de archivos.',
  )
  pushFailure(
    failures,
    Array.isArray(decision.generatedDomainMaterializationApprovalPayload?.review?.pathsPreview) &&
      decision.generatedDomainMaterializationApprovalPayload.review.pathsPreview
        .length > 0 &&
      Array.isArray(
        decision.generatedDomainMaterializationApprovalPayload?.blockedReasons,
      ) &&
      decision.generatedDomainMaterializationApprovalPayload.behaviorChanged === false,
    'El approval payload debe exponer pathsPreview, blockedReasons serializables y seguir sin cambiar comportamiento.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El approval payload no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainMaterializationApprovalPayload') &&
      mainSource.includes('generated-domain-materialization:approval-payload') &&
      mainSource.includes('buildGeneratedDomainMaterializationApprovalPayload'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization:approval-payload.',
  )

  return {
    id: 'generated-domain-materialization-approval-payload',
    label: 'Generated domain materialization approval payload',
    failures,
  }
}

async function runGeneratedDomainRuntimeShadowReadinessDecisionPayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-runtime-shadow-readiness-decision',
  })

  pushFailure(
    failures,
    decision.generatedDomainRuntimeShadowReadinessDecision?.present === true &&
      ['requires-Lean-approval', 'ready-for-harness'].includes(
        decision.generatedDomainRuntimeShadowReadinessDecision?.status,
      ) &&
      decision.generatedDomainRuntimeShadowReadinessDecision?.runtimeEnabled ===
        false &&
      decision.generatedDomainRuntimeShadowReadinessDecision
        ?.controlledRuntimeEnable === false,
    'buildBrainDecisionContract debe adjuntar generatedDomainRuntimeShadowReadinessDecision sin activar runtime real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainRuntimeShadowReadinessDecision?.safeguards
      ?.materializationPlanChanged === false &&
      decision.generatedDomainRuntimeShadowReadinessDecision?.safeguards
        ?.executionScopeChanged === false &&
      decision.generatedDomainRuntimeShadowReadinessDecision?.behaviorChanged ===
        false,
    'La decision final de readiness shadow no debe mutar materializationPlan ni executionScope reales.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainRuntimeShadowReadinessDecision') &&
      mainSource.includes('generated-domain-runtime-shadow:readiness-decision') &&
      mainSource.includes('buildGeneratedDomainRuntimeShadowReadinessDecision'),
    'main.cjs debe adjuntar y loguear generated-domain-runtime-shadow:readiness-decision.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationSourceResolution?.source !==
      'generated-domain-shadow',
    'La decision final de readiness shadow no debe convertir generated-domain-shadow en fuente real del runtime normal.',
  )

  return {
    id: 'generated-domain-runtime-shadow-readiness-decision',
    label: 'Generated domain runtime shadow readiness decision',
    failures,
  }
}

async function runGeneratedDomainMvpReadinessExecutiveReportPayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-mvp-readiness-executive-report',
  })

  pushFailure(
    failures,
    decision.generatedDomainMvpReadinessExecutiveReport?.present === true &&
      ['requires-Lean-approval', 'ready'].includes(
        decision.generatedDomainMvpReadinessExecutiveReport?.status,
      ) &&
      decision.generatedDomainMvpReadinessExecutiveReport?.mvpFlow?.contractReady === true &&
      decision.generatedDomainMvpReadinessExecutiveReport?.mvpFlow?.planReady === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMvpReadinessExecutiveReport como resumen ejecutivo del MVP sin activar runtime real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMvpReadinessExecutiveReport?.runtime?.runtimeEnabled === false &&
      decision.generatedDomainMvpReadinessExecutiveReport?.runtime
        ?.controlledRuntimeEnable === false &&
      decision.generatedDomainMvpReadinessExecutiveReport?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMvpReadinessExecutiveReport?.runtime
        ?.executionScopeChanged === false,
    'El readiness ejecutivo del MVP no debe cambiar runtimeEnabled, controlledRuntimeEnable, materializationPlan ni executionScope.',
  )
  pushFailure(
    failures,
    Array.isArray(decision.generatedDomainMvpReadinessExecutiveReport?.approvals?.pendingItems) &&
      Array.isArray(decision.generatedDomainMvpReadinessExecutiveReport?.recommendedNextActions) &&
      decision.generatedDomainMvpReadinessExecutiveReport?.behaviorChanged === false,
    'El readiness ejecutivo del MVP debe exponer pendingItems y recommendedNextActions serializables sin cambiar comportamiento.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainMvpReadinessExecutiveReport') &&
      mainSource.includes('generated-domain-mvp:readiness-report') &&
      mainSource.includes('buildGeneratedDomainMvpReadinessExecutiveReport'),
    'main.cjs debe adjuntar y loguear generated-domain-mvp:readiness-report.',
  )

  return {
    id: 'generated-domain-mvp-readiness-executive-report',
    label: 'Generated domain MVP readiness executive report',
    failures,
  }
}

async function runGeneratedDomainUniversalMaterializationPlanPayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-universal-materialization-plan',
  })

  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlan?.present === true &&
      decision.generatedDomainUniversalMaterializationPlan?.built === true &&
      decision.generatedDomainUniversalMaterializationPlan?.status === 'built' &&
      decision.generatedDomainUniversalMaterializationPlan?.approvalRequired === true &&
      decision.generatedDomainUniversalMaterializationPlan?.approved === false &&
      decision.generatedDomainUniversalMaterializationPlan?.canMaterializeInSandbox === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainUniversalMaterializationPlan como candidate ejecutable seguro solo para sandbox.',
  )
  pushFailure(
    failures,
    Array.isArray(decision.generatedDomainUniversalMaterializationPlan?.filesToCreate) &&
      decision.generatedDomainUniversalMaterializationPlan.filesToCreate.length > 0 &&
      Array.isArray(decision.generatedDomainUniversalMaterializationPlan?.fileChecks) &&
      Array.isArray(decision.generatedDomainUniversalMaterializationPlan?.validationPlan?.syntaxChecks),
    'El universal materialization plan debe exponer filesToCreate, fileChecks y validationPlan serializables.',
  )
  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlan?.safety?.noDotEnv === true &&
      decision.generatedDomainUniversalMaterializationPlan?.safety?.noNodeModules === true &&
      decision.generatedDomainUniversalMaterializationPlan?.safety?.noDocker === true &&
      decision.generatedDomainUniversalMaterializationPlan?.safety?.noCommands === true,
    'El universal materialization plan debe mantener reglas duras de seguridad.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainUniversalMaterializationPlan') &&
      mainSource.includes('generated-domain-universal-materialization:plan') &&
      mainSource.includes('buildGeneratedDomainUniversalMaterializationPlan'),
    'main.cjs debe adjuntar y loguear generated-domain-universal-materialization:plan.',
  )

  return {
    id: 'generated-domain-universal-materialization-plan',
    label: 'Generated domain universal materialization plan',
    failures,
  }
}

async function runGeneratedDomainMaterializationPlanDecouplingPayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-materialization-plan-decoupling-report',
  })

  pushFailure(
    failures,
    decision.generatedDomainUniversalMaterializationPlanCandidate?.present === true &&
      ['built', 'partial'].includes(
        decision.generatedDomainUniversalMaterializationPlanCandidate?.status,
      ) &&
      decision.generatedDomainUniversalMaterializationPlanCandidate?.approvalRequired === true &&
      decision.generatedDomainUniversalMaterializationPlanCandidate?.approved === false,
    'buildBrainDecisionContract debe adjuntar generatedDomainUniversalMaterializationPlanCandidate como evidencia paralela sin promoverlo a plan real.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPlanCandidateLegacyComparison?.present === true &&
      ['aligned', 'partial'].includes(
        decision.generatedDomainMaterializationPlanCandidateLegacyComparison?.status,
      ) &&
      decision.generatedDomainMaterializationPlanCandidateLegacyComparison?.behaviorChanged === false,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationPlanCandidateLegacyComparison sin cambiar el comportamiento real del plan legacy.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationPlanDecouplingReport?.present === true &&
      ['partial', 'ready-for-harness'].includes(
        decision.generatedDomainMaterializationPlanDecouplingReport?.migrationStatus,
      ) &&
      decision.generatedDomainMaterializationPlanDecouplingReport?.behaviorChanged === false,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationPlanDecouplingReport como diagnostico observacional del desacople del plan.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false,
    'El desacople del materialization plan no debe cambiar strategy, executionMode, nextExpectedAction ni materializationPlan real.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainUniversalMaterializationPlanCandidate') &&
      mainSource.includes('generatedDomainMaterializationPlanCandidateLegacyComparison') &&
      mainSource.includes('generatedDomainMaterializationPlanDecouplingReport') &&
      mainSource.includes('generated-domain-materialization-plan:candidate') &&
      mainSource.includes(
        'generated-domain-materialization-plan:candidate-legacy-comparison',
      ) &&
      mainSource.includes('generated-domain-materialization-plan:decoupling-report'),
    'main.cjs debe adjuntar y loguear candidate, comparison y decoupling report del materialization plan.',
  )

  return {
    id: 'generated-domain-materialization-plan-decoupling',
    label: 'Generated domain materialization plan decoupling',
    failures,
  }
}

async function runGeneratedDomainControlledRuntimeMaterializationSourcePayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-controlled-runtime-materialization-source',
  })

  pushFailure(
    failures,
    decision.generatedDomainControlledRuntimeMaterializationSource?.present === true &&
      decision.generatedDomainControlledRuntimeMaterializationSource?.evaluated === true &&
      decision.generatedDomainControlledRuntimeMaterializationSource?.enabled === false &&
      decision.generatedDomainControlledRuntimeMaterializationSource?.mode ===
        'runtime-disabled' &&
      ['legacy', 'current', 'none'].includes(
        decision.generatedDomainControlledRuntimeMaterializationSource?.selectedSource,
      ),
    'buildBrainDecisionContract debe adjuntar generatedDomainControlledRuntimeMaterializationSource con runtime normal apagado por defecto.',
  )
  pushFailure(
    failures,
    decision.generatedDomainControlledRuntimeMaterializationSource?.behaviorChanged ===
      false &&
      decision.generatedDomainControlledRuntimeMaterializationSource
        ?.materializationPlanChanged === false &&
      decision.generatedDomainControlledRuntimeMaterializationSource
        ?.executionScopeChanged === false,
    'generatedDomainControlledRuntimeMaterializationSource no debe cambiar behavior, materializationPlan ni executionScope en runtime normal.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.generatedDomainRuntimeShadowReadinessDecision?.runtimeEnabled === false &&
      decision.generatedDomainRuntimeShadowReadinessDecision
        ?.controlledRuntimeEnable === false,
    'El controlled runtime source debe preservar strategy, executionMode, nextExpectedAction y mantener runtime real apagado.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainControlledRuntimeMaterializationSource') &&
      mainSource.includes(
        'generated-domain-controlled-runtime:materialization-source',
      ) &&
      mainSource.includes(
        'resolveGeneratedDomainControlledRuntimeMaterializationSource',
      ),
    'main.cjs debe adjuntar y loguear generated-domain-controlled-runtime:materialization-source.',
  )

  return {
    id: 'generated-domain-controlled-runtime-materialization-source',
    label: 'Generated domain controlled runtime materialization source',
    failures,
  }
}

async function runGeneratedDomainMaterializationApprovalSurfacePayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-materialization-approval-surface',
  })
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const plannerUiStateSource = fs.readFileSync(plannerUiStateFilePath, 'utf8')
  const approvalSurfaceViewModel = buildPlannerApprovalSurfaceViewModel({
    generatedDomainMaterializationApprovalSurface:
      decision.generatedDomainMaterializationApprovalSurface,
    plannerExecutionMetadata: decision,
    effectivePlannerExecutionMetadata: decision,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationApprovalSurface?.present === true &&
      decision.generatedDomainMaterializationApprovalSurface?.built === true &&
      decision.generatedDomainMaterializationApprovalSurface?.status ===
        'ready-for-review' &&
      decision.generatedDomainMaterializationApprovalSurface?.review
        ?.requiresLeanApproval === true &&
      decision.generatedDomainMaterializationApprovalSurface?.review
        ?.approvalState === 'pending-review',
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationApprovalSurface lista para revision cuando el plan universal esta listo pero todavia no existe approval explicita.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationApprovalSurface?.behaviorChanged ===
      false &&
      decision.generatedDomainMaterializationApprovalSurface?.target
        ?.isWebPrueba === false &&
      decision.generatedDomainMaterializationApprovalSurface?.target
        ?.isSafeRoot === true &&
      Array.isArray(
        decision.generatedDomainMaterializationApprovalSurface?.files?.preview,
      ) &&
      decision.generatedDomainMaterializationApprovalSurface?.files?.preview.length > 0,
    'La approval surface debe exponer root seguro y preview de archivos sin tocar web-prueba ni ejecutar writes.',
  )
  pushFailure(
    failures,
    approvalSurfaceViewModel.present === true &&
      approvalSurfaceViewModel.status === 'ready-for-review' &&
      approvalSurfaceViewModel.filesCount > 0 &&
      approvalSurfaceViewModel.safetyLabels.includes('Sin .env') &&
      approvalSurfaceViewModel.nextActionLabel === 'Revisar aprobacion',
    'buildPlannerApprovalSurfaceViewModel debe resumir la approval surface en un view model de solo lectura con labels seguros para el renderer.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan' &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.materializationPlanChanged === false &&
      decision.generatedDomainMaterializationSourceResolution?.runtime
        ?.executionScopeChanged === false,
    'La approval surface no debe cambiar strategy, executionMode, nextExpectedAction, materializationPlan real ni executionScope real.',
  )
  pushFailure(
    failures,
    plannerUiStateSource.includes('buildPlannerApprovalSurfaceViewModel') &&
      appSource.includes('generatedDomainMaterializationApprovalSurface') &&
      appSource.includes('Aprobacion de materializacion') &&
      appSource.includes('No ejecuta todavia.') &&
      !appSource.includes('Ejecutar aprobacion') &&
      !appSource.includes('Materializar aprobacion'),
    'App.tsx y planner-ui-state.js deben consumir generatedDomainMaterializationApprovalSurface como lectura tecnica sin agregar ejecucion directa.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainMaterializationApprovalSurface') &&
      mainSource.includes('generated-domain-materialization:approval-surface') &&
      mainSource.includes('buildGeneratedDomainMaterializationApprovalSurface'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization:approval-surface.',
  )

  return {
    id: 'generated-domain-materialization-approval-surface',
    label: 'Generated domain materialization approval surface',
    failures,
  }
}

async function runGeneratedDomainFileCreationApprovalEvaluationPayloadCase() {
  const failures = []
  const decision = createAlignedGeneratedDomainObservationDecision({
    decisionKey: 'generated-domain-file-creation-approval-evaluation',
  })

  pushFailure(
    failures,
    decision.generatedDomainFileCreationApprovalEvaluation?.present === true &&
      decision.generatedDomainFileCreationApprovalEvaluation?.evaluated === true &&
      decision.generatedDomainFileCreationApprovalEvaluation?.status === 'blocked' &&
      decision.generatedDomainFileCreationApprovalEvaluation?.approved === false &&
      decision.generatedDomainFileCreationApprovalEvaluation?.blocked === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainFileCreationApprovalEvaluation bloqueado por default cuando no existe approval explicita.',
  )
  pushFailure(
    failures,
    Array.isArray(decision.generatedDomainFileCreationApprovalEvaluation?.reasons) &&
      decision.generatedDomainFileCreationApprovalEvaluation.reasons.length > 0 &&
      Array.isArray(decision.generatedDomainFileCreationApprovalEvaluation?.allowedFiles),
    'La evaluacion de approval debe exponer reasons y allowedFiles serializables aunque siga bloqueada por default.',
  )
  pushFailure(
    failures,
    mainSource.includes('generatedDomainFileCreationApprovalEvaluation') &&
      mainSource.includes('generated-domain-file-creation:approval-evaluation') &&
      mainSource.includes('evaluateGeneratedDomainFileCreationApproval'),
    'main.cjs debe adjuntar y loguear generated-domain-file-creation:approval-evaluation.',
  )
  pushFailure(
    failures,
    decision.generatedDomainRuntimeShadowReadinessDecision?.runtimeEnabled === false &&
      decision.generatedDomainMaterializationSourceResolution?.source !== 'generated-domain-shadow',
    'La evaluacion de approval no debe activar runtime ni cambiar la fuente real.',
  )

  return {
    id: 'generated-domain-file-creation-approval-evaluation',
    label: 'Generated domain file creation approval evaluation',
    failures,
  }
}

async function runGeneratedDomainSandboxApprovalBridgeCase() {
  const failures = []
  const decision = createApprovedToolBankObservationDecision()
  const appSource = fs.readFileSync(appFilePath, 'utf8')

  pushFailure(
    failures,
    decision.generatedDomainFileCreationApprovalEvaluation?.present === true &&
      decision.generatedDomainFileCreationApprovalEvaluation?.approved === true &&
      decision.generatedDomainFileCreationApprovalEvaluation?.blocked === false &&
      decision.generatedDomainFileCreationApprovalEvaluation?.status ===
        'approved-for-sandbox',
    'La aprobacion humana approve-sandbox-path debe convertirse en approval evaluation efectiva para sandbox.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationApprovalSurface?.status ===
      'approved-for-sandbox' &&
      decision.generatedDomainMaterializationApprovalSurface?.review?.approvalState ===
        'approved' &&
      decision.generatedDomainMaterializationApprovalSurface?.target?.isWebPrueba === false,
    'La approval surface debe reflejar approved-for-sandbox y seguir bloqueando web-prueba.',
  )
  pushFailure(
    failures,
    decision.generatedDomainControlledRuntimeMaterializationSource?.enabled === true &&
      decision.generatedDomainControlledRuntimeMaterializationSource?.mode ===
        'harness-controlled' &&
      decision.generatedDomainControlledRuntimeMaterializationSource?.selectedSource ===
        'generated-domain-universal' &&
      decision.generatedDomainControlledRuntimeMaterializationSource
        ?.fallbackLegacyAvailable === true,
    'La seleccion controlada debe poder elegir generated-domain-universal solo en harness/sandbox aprobado.',
  )
  pushFailure(
    failures,
    decision.generatedDomainFileCreationApprovalEvaluation?.sandboxRoot?.relative ===
      '.codex-temp/generated-domain-materialization-approved/sandbox-toolbank-local' &&
      decision.generatedDomainFileCreationApprovalEvaluation?.sandboxRoot
        ?.withinWorkspace === true,
    'Una ruta externa aprobada debe mapearse a un sandbox interno seguro dentro del workspace.',
  )
  pushFailure(
    failures,
    mainSource.includes('resolveGeneratedDomainSandboxApprovalDecision') &&
      mainSource.includes('generated-domain-sandbox-materialization:attempt') &&
      mainSource.includes('generatedDomainUniversalMaterializationPlan') &&
      appSource.includes('generatedDomainFileCreationApprovalEvaluation') &&
      appSource.includes('generatedDomainControlledRuntimeMaterializationSource'),
    'El bridge approval-granted -> execute payload -> materializacion sandbox debe quedar cableado entre main.cjs y App.tsx.',
  )

  return {
    id: 'generated-domain-sandbox-approval-bridge',
    label: 'Generated domain sandbox approval bridge',
    failures,
  }
}

async function runGeneratedDomainMaterializationShadowDiffPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'community-libraries', label: 'Community Libraries' },
    root: {
      slug: 'community-libraries-local',
      sourceRoot: 'community-libraries-local',
      targetRoot: 'community-libraries-local',
    },
    roles: [],
    entities: ['books', 'loans', 'members'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Public', path: 'frontend/public', screens: ['catalog'] },
      { key: 'admin', label: 'Admin', path: 'frontend/admin', screens: ['reports'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/books.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['books', 'loans', 'members'],
    },
    shared: {
      files: [],
    },
    docs: ['docs/API.md', 'docs/ARCHITECTURE.md'],
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
        'database/seed.sql',
        'frontend/public/index.html',
        'frontend/admin/index.html',
      ],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'database/schema.sql' },
        { targetPath: 'database/seed.sql' },
        { targetPath: 'frontend/public/index.html' },
        { targetPath: 'frontend/admin/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['database/schema.sql'] },
        { candidates: ['database/seed.sql'] },
        { candidates: ['frontend/public/index.html'] },
        { candidates: ['frontend/admin/index.html'] },
      ],
    },
    approvals: [],
  }
  const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
    generatedDomainContract,
    '.',
  )
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'generated-domain-shadow-diff-payload',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    reason: 'Comparar en detalle shadow plan y legacy materializationPlan sin ejecutar archivos.',
    instruction: 'No materializar nada.',
    completed: false,
    requiresApproval: false,
    tasks: [],
    assumptions: [],
    executionScope: {
      allowedTargetPaths,
    },
    materializationPlan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'community-libraries-local',
      allowedTargetPaths,
      operations: allowedTargetPaths.map((targetPath) => ({
        type:
          targetPath === 'community-libraries-local'
            ? 'create-folder'
            : 'create-or-edit-file',
        targetPath,
      })),
    },
    generatedDomainContract,
    workspacePath: repoRoot,
  })

  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowDiff?.present === true &&
      decision.generatedDomainMaterializationShadowDiff?.compared === true,
    'buildBrainDecisionContract debe adjuntar generatedDomainMaterializationShadowDiff al payload.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowDiff?.status === 'compared' &&
      decision.generatedDomainMaterializationShadowDiff?.allowedTargets?.overlapCount > 0 &&
      decision.generatedDomainMaterializationShadowDiff?.requiredGroups?.overlapCount > 0,
    'El shadow diff debe reflejar solapamiento real entre shadow plan y materializationPlan legacy compatible.',
  )
  pushFailure(
    failures,
    (decision.generatedDomainMaterializationShadowDiff?.recommendation?.action ===
      'prepare-preference-switch' ||
      decision.generatedDomainMaterializationShadowDiff?.recommendation?.action === 'observe') &&
      decision.generatedDomainMaterializationShadowDiff?.behaviorChanged === false,
    'generatedDomainMaterializationShadowDiff debe seguir siendo observacional y no cambiar runtime.',
  )
  pushFailure(
    failures,
    mainSource.includes('generated-domain-materialization-shadow:diff') &&
      mainSource.includes('generatedDomainMaterializationShadowDiff') &&
      mainSource.includes('buildGeneratedDomainMaterializationShadowDiff'),
    'main.cjs debe adjuntar y loguear generated-domain-materialization-shadow:diff.',
  )
  pushFailure(
    failures,
    decision.strategy === 'materialize-fullstack-local-plan' &&
      decision.executionMode === 'executor' &&
      decision.nextExpectedAction === 'execute-plan',
    'El shadow diff no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )

  return {
    id: 'generated-domain-materialization-shadow-diff-payload',
    label: 'Generated domain materialization shadow diff payload',
    failures,
  }
}

async function runDomainConsistencyDiagnosticsPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: { slug: 'gestion-merenderos', label: 'Gestion de merenderos barriales' },
    root: {
      slug: 'merenderos-local',
      sourceRoot: 'merenderos-local',
      targetRoot: 'merenderos-local',
    },
    roles: [],
    entities: ['beneficiaries', 'shifts', 'stock'],
    states: {},
    frontendSurfaces: [
      { key: 'public', label: 'Publico', path: 'frontend/public', screens: ['dashboard'] },
    ],
    workflows: ['reporting', 'inventory', 'messaging'],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/beneficiaries.js' }],
      services: [{ path: 'backend/src/services/reports.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['beneficiaries', 'shifts', 'stock_entries'],
    },
    shared: { files: [] },
    docs: ['docs/API.md'],
    scripts: ['scripts/seed-local.js'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env'],
      forbiddenSignals: ['ACCESS_TOKEN'],
      explicitExclusions: ['deploy', 'docker'],
    },
    materialization: {
      requiredFiles: ['backend/src/server.js', 'frontend/public/index.html'],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'frontend/public/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['frontend/public/index.html'] },
      ],
    },
    approvals: [],
  }
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'merenderos-arch-plan-v1',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-plan',
    reason: 'Evitar fuga de metadata residual entre dominios consecutivos.',
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
      productType: 'fullstack-local-app',
      domain: 'gestion escolar',
      coreModules: ['alumnos', 'familias'],
    },
    projectBlueprint: {
      productType: 'fullstack-local-app',
      domain: 'gestion escolar',
      intent: 'gestionar seguimiento escolar y comunicaciones',
      deliveryLevel: 'fullstack-local',
    },
    scalableDeliveryPlan: {
      deliveryLevel: 'fullstack-local',
      reason: 'Metadata residual de un dominio anterior.',
      allowedRootPaths: ['fullstack-local-gestion-escolar'],
      targetStructure: ['fullstack-local-gestion-escolar/'],
      directories: ['fullstack-local-gestion-escolar/frontend/admin'],
      filesToCreate: [{ path: 'fullstack-local-gestion-escolar/frontend/admin/index.html' }],
    },
    projectPhaseExecutionPlan: {
      phaseId: 'frontend-mock-flow',
      projectRoot: 'fullstack-local-gestion-escolar',
      goal: 'Continuar una fase escolar previa.',
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

  pushFailure(
    failures,
    decision.domainConsistencyDiagnostics?.present === true &&
      decision.domainConsistencyDiagnostics?.status === 'mismatch' &&
      Array.isArray(decision.domainConsistencyDiagnostics?.mismatches) &&
      decision.domainConsistencyDiagnostics.mismatches.length > 0,
    'buildBrainDecisionContract debe adjuntar domainConsistencyDiagnostics cuando detecta metadata residual incompatible.',
  )
  pushFailure(
    failures,
    !decision.productArchitecture &&
      !decision.projectBlueprint &&
      !decision.scalableDeliveryPlan &&
      !decision.projectPhaseExecutionPlan &&
      !decision.localProjectManifest,
    'La metadata residual incompatible no debe sobrevivir como metadata activa del run actual.',
  )
  pushFailure(
    failures,
    mainSource.includes('domain-consistency:diagnostics') &&
      mainSource.includes('domainConsistencyDiagnostics') &&
      mainSource.includes('buildDomainConsistencyDiagnostics'),
    'main.cjs debe adjuntar y loguear domain-consistency:diagnostics.',
  )
  pushFailure(
    failures,
    decision.strategy === 'product-architecture-plan' &&
      decision.executionMode === 'planner-only' &&
      decision.nextExpectedAction === 'review-plan',
    'La proteccion de consistencia de dominio no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowPlan?.present === true &&
      decision.generatedDomainMaterializationPreferenceGate?.present === true &&
      decision.generatedDomainMaterializationShadowDiff?.present === true,
    'Shadow plan, gate y diff deben seguir presentes aunque se descarte metadata residual incompatible.',
  )

  return {
    id: 'domain-consistency-diagnostics-payload',
    label: 'Domain consistency diagnostics payload',
    failures,
  }
}

async function runDomainConsistencySemanticMismatchPayloadCase() {
  const failures = []
  const generatedDomainContract = {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      slug: 'comedores-comunitarios',
      label: 'App de gestion de comedores comunitarios barriales',
    },
    root: {
      slug: 'comedores-comunitarios-local',
      sourceRoot: 'comedores-comunitarios-local',
      targetRoot: 'comedores-comunitarios-local',
    },
    roles: ['coordinacion', 'voluntariado', 'referente territorial'],
    entities: ['comedores', 'beneficiarios', 'raciones', 'insumos'],
    states: {},
    workflows: ['serving-shifts', 'inventory', 'community-reporting'],
    frontendSurfaces: [
      { key: 'public', label: 'Publico', path: 'frontend/public', screens: ['overview'] },
    ],
    backend: {
      packageFile: 'backend/package.json',
      entryFile: 'backend/src/server.js',
      routes: [{ path: 'backend/src/routes/beneficiaries.js' }],
      services: [{ path: 'backend/src/services/inventory.js' }],
      modules: [],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'database/seed.sql',
      tables: ['comedores', 'beneficiarios', 'raciones', 'insumos'],
    },
    shared: { files: [] },
    docs: ['docs/API.md'],
    scripts: ['scripts/seed-local.js'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env'],
      forbiddenSignals: ['ACCESS_TOKEN'],
      explicitExclusions: ['deploy', 'docker'],
    },
    materialization: {
      requiredFiles: ['backend/src/server.js', 'frontend/public/index.html'],
      operations: [
        { targetPath: 'backend/src/server.js' },
        { targetPath: 'frontend/public/index.html' },
      ],
    },
    validation: {
      requiredPathGroups: [
        { candidates: ['backend/src/server.js'] },
        { candidates: ['frontend/public/index.html'] },
      ],
    },
    approvals: [],
  }
  const decision = plannerApi.buildBrainDecisionContract({
    decisionKey: 'comedores-arch-plan-v1',
    strategy: 'product-architecture-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-plan',
    reason: 'Evitar fuga semantica residual en metadata visible del blueprint.',
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
      keyFlows: ['agendar turnos', 'asignar profesionales'],
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

  pushFailure(
    failures,
    decision.domainConsistencyDiagnostics?.present === true &&
      decision.domainConsistencyDiagnostics?.status === 'mismatch' &&
      decision.domainConsistencyDiagnostics?.semanticStatus === 'mismatch' &&
      Array.isArray(decision.domainConsistencyDiagnostics?.discardedBlocks) &&
      decision.domainConsistencyDiagnostics.discardedBlocks.length >= 2,
    'domainConsistencyDiagnostics debe detectar y marcar mismatch semantico cuando el contenido visible no coincide con el contrato actual.',
  )
  pushFailure(
    failures,
    !decision.productArchitecture && !decision.projectBlueprint,
    'La metadata visible semanticamente incompatible no debe sobrevivir como productArchitecture o projectBlueprint actual.',
  )
  pushFailure(
    failures,
    mainSource.includes('semanticStatus') &&
      mainSource.includes('semanticOverlapScore') &&
      mainSource.includes('discardedBlocks') &&
      mainSource.includes('domain-consistency:diagnostics'),
    'main.cjs debe exponer diagnostico semantico dentro de domainConsistencyDiagnostics y seguir logueandolo.',
  )
  pushFailure(
    failures,
    decision.strategy === 'product-architecture-plan' &&
      decision.executionMode === 'planner-only' &&
      decision.nextExpectedAction === 'review-plan',
    'El saneamiento semantico no debe cambiar strategy, executionMode ni nextExpectedAction.',
  )
  pushFailure(
    failures,
    decision.generatedDomainMaterializationShadowPlan?.present === true &&
      decision.generatedDomainMaterializationPreferenceGate?.present === true &&
      decision.generatedDomainMaterializationShadowDiff?.present === true &&
      decision.generatedDomainMaterializationPreferenceDecision?.present === true,
    'Shadow plan, gate, diff y decision dry-run deben seguir presentes aunque se descarte metadata semantica incompatible.',
  )

  return {
    id: 'domain-consistency-semantic-mismatch-payload',
    label: 'Domain consistency semantic mismatch payload',
    failures,
  }
}

async function runGeneratedDomainContractComparisonTechnicalPanelCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const scalableReviewMetadata = {
    decisionKey: 'school-of-trades-comparison-panel-v1',
    strategy: 'scalable-delivery-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-scalable-delivery',
    requiresApproval: false,
    approvalRequired: false,
    generatedDomainContractDiagnostics: {
      present: true,
      valid: true,
      safeForLocalMaterialization: true,
      domainSlug: 'school-of-trades',
      rootSlug: 'school-of-trades-local',
      sourceRoot: 'school-of-trades-local',
      targetRoot: 'school-of-trades-local',
      errorsCount: 0,
      warningsCount: 0,
    },
    generatedDomainContractComparison: {
      present: true,
      compared: true,
      status: 'partial',
      safeForDiagnostics: true,
      domain: {
        contractSlug: 'school-of-trades',
        aligned: true,
      },
      roots: {
        contractRoot: 'school-of-trades-local',
        aligned: false,
      },
      backend: {
        aligned: false,
      },
      database: {
        aligned: false,
      },
      safety: {
        aligned: true,
      },
      materialization: {
        aligned: false,
      },
      warningsCount: 5,
      errorsCount: 0,
      warnings: [
        'No hay root relativo legacy suficiente para comparar con generatedDomainContract.',
      ],
      errors: [],
    },
  }
  const scalableReviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: scalableReviewMetadata,
    effectivePlannerExecutionMetadata: scalableReviewMetadata,
  })

  pushFailure(
    failures,
    scalableReviewUiState.prepareCtaVisible === true &&
      scalableReviewUiState.prepareCtaKind === 'fullstack-local',
    'generatedDomainContractComparison partial debe seguir siendo diagnostico y no bloquear el CTA seguro del review escalable.',
  )
  pushFailure(
    failures,
    scalableReviewUiState.materializeCtaVisible === false,
    'generatedDomainContractComparison partial no debe convertir el review en materializacion directa.',
  )
  pushFailure(
    failures,
    appSource.includes('generatedDomainContractComparison:') &&
      appSource.includes('Comparacion contrato vs plan legacy') &&
      appSource.includes('Diagnostico observacional') &&
      appSource.includes('No gobierna la materializacion'),
    'App.tsx debe preservar generatedDomainContractComparison y mostrarlo como diagnostico tecnico de lectura.',
  )
  pushFailure(
    failures,
    appSource.includes('Los warnings no bloquean esta') &&
      appSource.includes('generatedDomainContractComparisonStatusLabel'),
    'La UI tecnica debe tratar comparison.status partial como warning observacional y no como bloqueo.',
  )

  return {
    id: 'generated-domain-contract-comparison-technical-panel',
    label: 'Generated domain contract comparison technical panel',
    failures,
  }
}

async function runPrepareContinuationActionPlanShowsPrimaryCtaCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const continuationReviewMetadata = {
    decisionKey: 'escuela-oficios-continuation-v1',
    strategy: 'prepare-continuation-action-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-plan',
    requiresApproval: false,
    approvalRequired: false,
    existingProjectDetection: {
      detected: true,
      applicable: true,
      projectRoot: 'escuela-oficios-local',
    },
    activeProjectContext: {
      mode: 'existing-project',
      projectRoot: 'escuela-oficios-local',
      domain: 'gestion integral de escuela de oficios barrial',
    },
    localProjectManifest: {
      deliveryLevel: 'fullstack-local',
      projectRoot: 'escuela-oficios-local',
      domain: 'gestion integral de escuela de oficios barrial',
      phases: [
        { id: 'frontend-mock-flow', title: 'Frontend mock flow' },
        { id: 'review-and-expand', title: 'Review and expand' },
      ],
      nextRecommendedPhase: 'review-and-expand',
    },
    continuationActionPlan: {
      id: 'continuar-reportes-y-horarios',
      title: 'Continuar reportes y horarios mock',
      description:
        'Preparar la siguiente accion segura para reportes, horarios y panel operativo local.',
      targetStrategy: 'prepare-continuation-action-plan',
      safeToPrepare: true,
      safeToMaterialize: false,
      requiresApproval: false,
      blocked: false,
      projectRoot: 'escuela-oficios-local',
      deliveryLevel: 'fullstack-local',
    },
    projectContinuationState: {
      projectStatus: 'review-only',
      operatorMessage:
        'Hay una siguiente accion segura lista para preparar sin tocar archivos reales.',
      nextRecommendedAction: {
        id: 'continuar-reportes-y-horarios',
        title: 'Continuar reportes y horarios mock',
        description:
          'Preparar la siguiente accion segura para reportes, horarios y panel operativo local.',
        targetStrategy: 'prepare-continuation-action-plan',
        safeToPrepare: true,
        safeToMaterialize: false,
        requiresApproval: false,
        blocked: false,
        projectRoot: 'escuela-oficios-local',
        deliveryLevel: 'fullstack-local',
      },
    },
  }
  const nextRecommendedAction = resolveProjectContinuityNextRecommendedActionForUi({
    projectContinuationState: continuationReviewMetadata.projectContinuationState,
    projectReadinessState: null,
    continuationActionPlan: continuationReviewMetadata.continuationActionPlan,
    moduleExpansionPlan: null,
    projectPhaseExecutionPlan: null,
    localProjectManifest: continuationReviewMetadata.localProjectManifest,
  })
  const canPrepare = canPrepareProjectContinuityNextActionForUi(nextRecommendedAction)
  const primaryLabel = getProjectContinuityPrimaryActionLabelForUi(nextRecommendedAction)

  pushFailure(
    failures,
    canPrepare === true,
    'prepare-continuation-action-plan debe resolver una siguiente accion segura preparable.',
  )
  pushFailure(
    failures,
    primaryLabel === 'Preparar siguiente paso seguro',
    `El CTA primario de continuation review debe ser Preparar siguiente paso seguro. Recibido: ${primaryLabel || '(vacio)'}.`,
  )
  pushFailure(
    failures,
    /plannerCanPrepareContinuationReviewAction/.test(appSource) &&
      /plannerContinuationReviewPrimaryActionLabel/.test(appSource),
    'App.tsx debe derivar un CTA primario especifico para continuity review en vez de caer solo en Regenerar plan.',
  )
  pushFailure(
    failures,
    appSource.indexOf('const activeProjectContinuationState =') !== -1 &&
      appSource.indexOf('const plannerContinuationReviewAction =') !== -1 &&
      appSource.indexOf('const activeProjectContinuationState =') <
        appSource.indexOf('const plannerContinuationReviewAction ='),
    'App.tsx debe inicializar activeProjectContinuationState antes de plannerContinuationReviewAction para no romper el renderer por TDZ.',
  )
  pushFailure(
    failures,
    /plannerCanPrepareContinuationReviewAction && plannerContinuationReviewAction[\s\S]{0,120}\? \(\) => handlePrepareContinuationAction\(plannerContinuationReviewAction\)/.test(
      appSource,
    ),
    'El CTA primario de continuation review debe usar handlePrepareContinuationAction y no ejecutar ni materializar directo.',
  )
  pushFailure(
    failures,
    /plannerCanPrepareContinuationReviewAction[\s\S]{0,120}\? plannerContinuationReviewPrimaryActionLabel/.test(
      appSource,
    ),
    'El label visible del boton primario debe salir de la rama real de continuation review.',
  )
  pushFailure(
    failures,
    !/plannerCanPrepareContinuationReviewAction[\s\S]{0,240}handleMaterializeContinuationAction/.test(
      appSource,
    ),
    'La rama primaria de continuation review no debe disparar materializacion automatica.',
  )

  return {
    id: 'prepare-continuation-action-plan-shows-primary-cta',
    label: 'Prepare continuation action plan shows primary CTA',
    failures,
  }
}

async function runPrepareContinuationActionPlanFallbackCtaCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const continuationReviewMetadata = {
    decisionKey: 'prepare-continuation-action-plan',
    strategy: 'prepare-continuation-action-plan',
    executionMode: 'planner-only',
    nextExpectedAction: 'review-continuation-action',
    businessSector: 'education-training',
    requiresApproval: false,
    approvalRequired: false,
    tasks: ['Definir siguiente modulo', 'Revisar continuidad segura'],
    generatedDomainContractDiagnostics: {
      present: true,
      valid: true,
      safeForLocalMaterialization: true,
      rootSlug: 'oficios-escuela-local',
      sourceRoot: 'oficios-escuela-local',
      targetRoot: 'oficios-escuela-local',
      errorsCount: 0,
      warningsCount: 0,
    },
    generatedDomainContractComparison: {
      present: true,
      compared: true,
      status: 'partial',
      safeForDiagnostics: true,
      warningsCount: 4,
      errorsCount: 0,
    },
  }
  const reviewUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: continuationReviewMetadata,
    effectivePlannerExecutionMetadata: continuationReviewMetadata,
  })
  const canFallbackGenerate = canGenerateContinuationReviewFallbackForUi({
    plannerExecutionMetadata: continuationReviewMetadata,
    effectivePlannerExecutionMetadata: continuationReviewMetadata,
  })

  pushFailure(
    failures,
    reviewUiState.effectiveReviewOnly === true,
    'prepare-continuation-action-plan real debe seguir en review-only.',
  )
  pushFailure(
    failures,
    reviewUiState.isScalableReview === false,
    'El review de continuidad no debe confundirse con review escalable.',
  )
  pushFailure(
    failures,
    canFallbackGenerate === true,
    'Sin continuationActionPlan rico, el review-continuation-action seguro debe habilitar fallback de Generar siguiente paso.',
  )
  pushFailure(
    failures,
    /plannerCanFallbackGenerateContinuationReviewAction/.test(appSource) &&
      /Generar siguiente paso/.test(appSource) &&
      /plannerCanFallbackGenerateContinuationReviewAction[\s\S]{0,140}\? \(\) => handleGenerateNextStep\(\)/.test(
        appSource,
      ),
    'El CTA fallback de continuation review debe usar handleGenerateNextStep sin materializar.',
  )
  pushFailure(
    failures,
    !/plannerCanFallbackGenerateContinuationReviewAction[\s\S]{0,220}handleMaterialize/.test(
      appSource,
    ),
    'El fallback de continuation review no debe disparar materializacion automatica.',
  )

  return {
    id: 'prepare-continuation-action-plan-fallback-cta',
    label: 'Prepare continuation action plan fallback CTA',
    failures,
  }
}

async function runOnlineCoursesMaterializationContractCase() {
  const result = await requestOnlineCoursesPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const allowedTargetPaths = [
    ...(Array.isArray(decision?.executionScope?.allowedTargetPaths)
      ? decision.executionScope.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.materializationPlan?.allowedTargetPaths)
      ? decision.materializationPlan.allowedTargetPaths
      : []),
  ].map((entry) => normalizePathForComparison(entry))
  const materializationUiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: decision,
    effectivePlannerExecutionMetadata: decision,
  })
  const materializationOperations = Array.isArray(decision?.materializationPlan?.operations)
    ? decision.materializationPlan.operations
    : []
  const getOperationContent = (relativePath) =>
    String(
      materializationOperations.find((entry) =>
        normalizePathForComparison(entry?.targetPath || '').endsWith(
          normalizePathForComparison(relativePath),
        ),
      )?.nextContent || '',
    )
  const publicAppContent = getOperationContent('frontend/public/app.js')
  const adminAppContent = getOperationContent('frontend/admin/app.js')
  const studentAppContent = getOperationContent('frontend/student/app.js')
  const canonicalSeedContent = getOperationContent('database/seed.sql')
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal: result.goal,
    context: result.context,
  })
  const targetSummary = normalizeText(
    JSON.stringify({
      projectRoot: decision?.materializationPlan?.projectRoot,
      selectedDomain:
        decision?.selectedDomain || contractInspection?.selectedDomain || '',
      selectedContractKind:
        decision?.selectedContractKind ||
        decision?.materializationPlan?.contractDefinition?.contractKind ||
        contractInspection?.contractKind ||
        '',
      sourceRoot: decision?.sourceRoot || '',
      targetRoot: decision?.targetRoot || decision?.materializationPlan?.projectRoot || '',
      allowedTargetPaths,
      operations: Array.isArray(decision?.materializationPlan?.operations)
        ? decision.materializationPlan.operations.map((entry) =>
            normalizePathForComparison(entry?.targetPath || ''),
          )
        : [],
    }),
  )

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan',
    'Cursos online post-click debe devolver materialize-fullstack-local-plan.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'executor',
    'Cursos online post-click debe devolver executionMode executor.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'execute-plan',
    'Cursos online post-click debe devolver nextExpectedAction execute-plan.',
  )
  pushFailure(
    failures,
    String(
      decision?.selectedDomain || contractInspection?.selectedDomain || '',
    ).trim() === 'online-courses',
    `La materialización de cursos online debe marcar selectedDomain=online-courses. Recibido: ${decision?.selectedDomain || contractInspection?.selectedDomain || '(vacío)'}.`,
  )
  pushFailure(
    failures,
    String(
      decision?.selectedContractKind ||
        decision?.materializationPlan?.contractDefinition?.contractKind ||
        contractInspection?.contractKind ||
        '',
    ).trim() === 'online-courses-fullstack-local',
    'La materialización de cursos online debe marcar selectedContractKind=online-courses-fullstack-local.',
  )
  pushFailure(
    failures,
    String(decision?.sourceRoot || '').trim() === 'edu-platform-local',
    `La materialización de cursos online debe heredar sourceRoot=edu-platform-local. Recibido: ${decision?.sourceRoot || '(vacío)'}.`,
  )
  pushFailure(
    failures,
    String(decision?.targetRoot || '').trim() === 'edu-platform-local',
    `La materialización de cursos online debe heredar targetRoot=edu-platform-local. Recibido: ${decision?.targetRoot || '(vacío)'}.`,
  )
  pushFailure(
    failures,
    normalizeText(decision?.targetRoot || decision?.materializationPlan?.projectRoot || '').includes(
      'edu-platform-local',
    ),
    'La materialización de cursos online debe mantener un root coherente tipo edu-platform-local.',
  )
  pushFailure(
    failures,
    allowedTargetPaths.some((entry) => entry.includes('edu-platform-local/')),
    'allowedTargetPaths debe quedar anclado a edu-platform-local.',
  )
  ;[
    'frontend/admin/index.html',
    'frontend/public/index.html',
    'frontend/student/index.html',
    'backend/src/routes/courses.js',
    'backend/src/routes/payments.js',
    'backend/src/services/mock-mercado-pago.js',
    'shared/plans.js',
    'shared/payment-statuses.js',
    'shared/course-statuses.js',
    'docs/payments_mock.md',
    'docs/local_validation.md',
  ].forEach((token) => {
    pushFailure(
      failures,
      targetSummary.includes(normalizeText(token)),
      `La materialización de cursos online debe incluir ${token}.`,
    )
  })
  ;['logitrack-local-v1', 'shipments', 'tracking', 'veterinaria', 'appointments'].forEach(
    (token) => {
      pushFailure(
        failures,
        !targetSummary.includes(normalizeText(token)),
        `La materialización de cursos online no debe contaminarse con ${token}.`,
      )
    },
  )
  pushFailure(
    failures,
    !targetSummary.includes(normalizeText('online-courses-platform')),
    'La materialización de cursos online no debe cambiar el root a online-courses-platform.',
  )
  pushFailure(
    failures,
    contractInspection?.ok === true,
    `El contrato canónico de cursos online debe quedar OK. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
  )
  pushFailure(
    failures,
    materializationUiState.materializeCtaEnabled === true &&
      materializationUiState.uiState === 'materialization-ready',
    'El helper del renderer debe considerar materialization-ready al contrato completo de cursos online.',
  )
  pushFailure(
    failures,
    !/"courses":\s*\[\s*\]/.test(publicAppContent),
    'frontend/public/app.js no debe materializarse con courses vacío.',
  )
  pushFailure(
    failures,
    publicAppContent.includes('React desde cero') &&
      publicAppContent.includes('Node y APIs locales') &&
      publicAppContent.includes('Analítica para cohortes') &&
      publicAppContent.includes('Free') &&
      publicAppContent.includes('Plata') &&
      publicAppContent.includes('Oro'),
    'frontend/public/app.js debe incluir cursos mock Free, Plata y Oro.',
  )
  pushFailure(
    failures,
    publicAppContent.includes('class="card-title"') &&
      publicAppContent.includes('Categoría:') &&
      publicAppContent.includes('Plan base:') &&
      publicAppContent.includes('Clases:'),
    'frontend/public/app.js debe separar título, categoría, plan y clases con bloques legibles.',
  )
  pushFailure(
    failures,
    !/"courses":\s*\[\s*\]/.test(adminAppContent),
    'frontend/admin/app.js no debe materializarse con courses vacío.',
  )
  pushFailure(
    failures,
    adminAppContent.includes('22 clases') &&
      adminAppContent.includes('18 clases') &&
      adminAppContent.includes('Recordá'),
    'frontend/admin/app.js debe mostrar cursos mock con clases y alertas legibles.',
  )
  pushFailure(
    failures,
    adminAppContent.includes('class="metric-value"') &&
      adminAppContent.includes('Estado:') &&
      adminAppContent.includes('Plan requerido:') &&
      adminAppContent.includes('Clases:'),
    'frontend/admin/app.js debe separar métricas y metadatos de cursos con bloques claros.',
  )
  pushFailure(
    failures,
    !/"students":\s*\[\s*\]/.test(studentAppContent) &&
      !/"progress":\s*\[\s*\]/.test(studentAppContent) &&
      !/"payments":\s*\[\s*\]/.test(studentAppContent),
    'frontend/student/app.js no debe materializarse con students, progress o payments vacíos.',
  )
  pushFailure(
    failures,
    studentAppContent.includes('"approved"') &&
      studentAppContent.includes('"pending"') &&
      studentAppContent.includes('"rejected"') &&
      studentAppContent.includes('"cancelled"'),
    'frontend/student/app.js debe incluir los cuatro estados mock de pago.',
  )
  pushFailure(
    failures,
    studentAppContent.includes('class="card-title"') &&
      studentAppContent.includes('Plan:') &&
      studentAppContent.includes('Avance:') &&
      studentAppContent.includes('Estado:') &&
      studentAppContent.includes('Monto:'),
    'frontend/student/app.js debe separar nombre, avance, plan y estado de pagos con bloques legibles.',
  )
  pushFailure(
    failures,
    canonicalSeedContent.trim().length > 0 &&
      canonicalSeedContent.includes('insert into courses') &&
      canonicalSeedContent.includes('insert into payments'),
    'database/seed.sql debe tener contenido útil y no quedar vacío.',
  )
  ;['Público', 'Catálogo', 'Simulación', 'categorías', 'aprobación', 'Recordá'].forEach(
    (token) => {
      pushFailure(
        failures,
        [publicAppContent, adminAppContent, studentAppContent].some((entry) =>
          entry.includes(token),
        ),
        `Las superficies de cursos online deben conservar el texto legible "${token}".`,
      )
    },
  )

  return {
    id: 'online-courses-materialization-contract',
    label: 'Online courses materialization contract',
    failures,
  }
}

async function runOnlineCoursesRootMismatchBlockedCase() {
  const result = await requestOnlineCoursesPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision && typeof result.decision === 'object' ? result.decision : null

  if (!decision) {
    return {
      id: 'online-courses-root-mismatch-blocked',
      label: 'Online courses root mismatch blocked',
      failures: [
        'No se pudo obtener la decision materializable de cursos online para simular el root mismatch.',
      ],
    }
  }

  const originalRoot =
    String(decision?.targetRoot || decision?.materializationPlan?.projectRoot || '').trim() ||
    'edu-platform-local'
  const mismatchedRoot = path.join(smokeWorkspaceRoot, 'online-courses-platform')
  const mismatchedDecision = {
    ...decision,
    targetRoot: mismatchedRoot,
    executionScope:
      decision?.executionScope && typeof decision.executionScope === 'object'
        ? {
            ...decision.executionScope,
            allowedTargetPaths: [mismatchedRoot, path.join(mismatchedRoot, '**')],
          }
        : decision?.executionScope,
    materializationPlan:
      decision?.materializationPlan && typeof decision.materializationPlan === 'object'
        ? {
            ...decision.materializationPlan,
            projectRoot: mismatchedRoot,
            allowedTargetPaths: [mismatchedRoot, path.join(mismatchedRoot, '**')],
          }
        : decision?.materializationPlan,
  }
  const uiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: mismatchedDecision,
    effectivePlannerExecutionMetadata: mismatchedDecision,
  })

  pushFailure(
    failures,
    uiState.uiState === 'materialization-incomplete',
    'Un root mismatch debe dejar la UI en materialization-incomplete.',
  )
  pushFailure(
    failures,
    uiState.materializeCtaEnabled === false,
    'Un root mismatch no debe habilitar Materializar entrega.',
  )
  pushFailure(
    failures,
    typeof uiState.materializeCtaDisabledReason === 'string' &&
      uiState.materializeCtaDisabledReason.includes(
        'El root permitido del plan materializable no coincide con el plan fullstack activo.',
      ),
    `El root mismatch debe exponer el diagnóstico correcto. Recibido: ${uiState.materializeCtaDisabledReason || '(vacío)'}.`,
  )
  pushFailure(
    failures,
    String(mismatchedDecision.targetRoot || '').trim() !== originalRoot,
    'La simulación del mismatch debe usar un targetRoot distinto al root canónico.',
  )

  return {
    id: 'online-courses-root-mismatch-blocked',
    label: 'Online courses root mismatch blocked',
    failures,
  }
}

async function runOnlineCoursesInvalidOpenAIMaterializationFallsBackCase() {
  const failures = []
  const baseDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: onlineCoursesGoalCase.goal,
    context: onlineCoursesGoalCase.context,
    workspacePath: smokeWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })
  const scalablePlan =
    baseDecision?.scalableDeliveryPlan &&
    typeof baseDecision.scalableDeliveryPlan === 'object'
      ? baseDecision.scalableDeliveryPlan
      : null

  if (!scalablePlan) {
    return {
      id: 'online-courses-invalid-openai-materialization-falls-back',
      label: 'Online courses invalid OpenAI materialization falls back',
      failures: [
        'La base de cursos online no devolvió scalableDeliveryPlan para construir la fase materializable.',
      ],
    }
  }

  const prompt = buildFullstackLocalMaterializationPrompt({
    goal: onlineCoursesGoalCase.goal,
    context: onlineCoursesGoalCase.context,
    scalablePlan,
  })
  const invalidRawDecision = {
    decisionKey: 'materialize-fullstack-local-online-courses-v1',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
    requiresApproval: false,
    businessSector: 'education-tech',
    businessSectorLabel: 'EdTech - Cursos online',
    tasks: [
      {
        step: 1,
        title: 'Materializar scaffold local de cursos online',
        operation: 'create-or-edit-files',
        targetPath: 'online-courses-local',
      },
    ],
    executionScope: {
      allowedTargetPaths: [
        path.join(smokeWorkspaceRoot, 'online-courses-local'),
        path.join(smokeWorkspaceRoot, 'online-courses-local', '**'),
      ],
      blockedTargetPaths: [
        path.join(smokeWorkspaceRoot, '.env'),
        path.join(smokeWorkspaceRoot, 'node_modules'),
      ],
      successCriteria: ['Dejar un scaffold fullstack local revisable.'],
    },
    materializationPlan: {
      version: 'test-invalid-openai',
      kind: 'fullstack-local-materialization',
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: path.join(smokeWorkspaceRoot, 'online-courses-local'),
      allowedTargetPaths: [
        path.join(smokeWorkspaceRoot, 'online-courses-local'),
        path.join(smokeWorkspaceRoot, 'online-courses-local', '**'),
      ],
      operations: [
        {
          type: 'replace-file',
          targetPath: path.join(
            smokeWorkspaceRoot,
            'online-courses-local',
            'frontend',
            'public',
            'src',
            'main.js',
          ),
          nextContent: 'window.renderApp = true\n',
        },
        {
          type: 'replace-file',
          targetPath: path.join(
            smokeWorkspaceRoot,
            'online-courses-local',
            'frontend',
            'admin',
            'src',
            'main.js',
          ),
          nextContent: 'window.renderAdmin = true\n',
        },
        {
          type: 'replace-file',
          targetPath: path.join(
            smokeWorkspaceRoot,
            'online-courses-local',
            'frontend',
            'student',
            'src',
            'main.js',
          ),
          nextContent: 'window.renderStudent = true\n',
        },
        {
          type: 'replace-file',
          targetPath: path.join(
            smokeWorkspaceRoot,
            'online-courses-local',
            'scripts',
            'seed-runner.md',
          ),
          nextContent: '# seed runner\n',
        },
        {
          type: 'replace-file',
          targetPath: path.join(
            smokeWorkspaceRoot,
            'online-courses',
            'online-courses-local',
            'docs',
            'LOCAL_VALIDATION.md',
          ),
          nextContent: '# local validation\n',
        },
      ],
    },
  }

  const normalizedDecision = await plannerApi.normalizeOpenAIBrainDecision(
    invalidRawDecision,
    {
      goal: prompt.goal,
      context: [prompt.context, 'No ejecutar todavía.'].filter(Boolean).join('\n'),
      workspacePath: smokeWorkspaceRoot,
      iteration: 3,
      previousExecutionResult: '',
      requiresApproval: false,
      projectState: { resolvedDecisions: [] },
      userParticipationMode: 'brain-decides-missing',
      costMode: 'max-quality',
      attachedInputs: [],
      existingProjectContext: null,
      projectWorkMode: 'auto',
      reusablePlanningContext: buildReusablePlanningContext(),
    },
  )
  const contractInspection = inspectDecisionMaterializationContract({
    decision: normalizedDecision,
    goal: prompt.goal,
    context: [prompt.context, 'No ejecutar todavía.'].filter(Boolean).join('\n'),
  })
  const normalizedSurface = normalizeText(
    JSON.stringify({
      selectedDomain: normalizedDecision?.selectedDomain,
      selectedContractKind: normalizedDecision?.selectedContractKind,
      targetRoot: normalizedDecision?.targetRoot,
      executionScope: normalizedDecision?.executionScope,
      materializationPlan: normalizedDecision?.materializationPlan,
    }),
  )

  pushFailure(
    failures,
    String(normalizedDecision?.selectedDomain || '').trim() === 'online-courses',
    'Una materialización OpenAI inválida de cursos online debe volver al dominio canónico online-courses.',
  )
  pushFailure(
    failures,
    String(normalizedDecision?.selectedContractKind || '').trim() ===
      'online-courses-fullstack-local',
    'Una materialización OpenAI inválida de cursos online debe volver al contrato canónico online-courses-fullstack-local.',
  )
  pushFailure(
    failures,
    normalizeText(normalizedDecision?.targetRoot || '').includes('edu-platform-local'),
    'Una materialización OpenAI inválida de cursos online debe recuperar el root canónico edu-platform-local.',
  )
  pushFailure(
    failures,
    contractInspection?.ok === true,
    `La normalización debe reemplazar el payload inválido por un contrato canónico OK. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
  )
  ;[
    'backend/src/server.js',
    'frontend/public/app.js',
    'frontend/admin/app.js',
    'frontend/student/app.js',
    'scripts/seed-local.js',
    'docs/local_validation.md',
  ].forEach((token) => {
    pushFailure(
      failures,
      normalizedSurface.includes(normalizeText(token)),
      `La normalización fallback debe recuperar ${token}.`,
    )
  })
  ;[
    'frontend/public/src/main.js',
    'frontend/admin/src/main.js',
    'frontend/student/src/main.js',
    'scripts/seed-runner.md',
    'online-courses/online-courses-local',
  ].forEach((token) => {
    pushFailure(
      failures,
      !normalizedSurface.includes(normalizeText(token)),
      `La normalización fallback no debe conservar ${token}.`,
    )
  })

  return {
    id: 'online-courses-invalid-openai-materialization-falls-back',
    label: 'Online courses invalid OpenAI materialization falls back',
    failures,
  }
}

async function runOnlineCoursesPaymentsMockSafetyCase() {
  const result = await requestOnlineCoursesPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const normalizedDecision = normalizeText(JSON.stringify(decision || {}))

  ;[
    'mock-mercado-pago',
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'payment-statuses',
    'payments_mock',
  ].forEach((token) => {
    pushFailure(
      failures,
      normalizedDecision.includes(normalizeText(token)),
      `La materialización de cursos online debe documentar ${token}.`,
    )
  })
  ;['access token', 'client_secret', 'bearer ', 'api.mercadopago', 'fetch('].forEach(
    (token) => {
      pushFailure(
        failures,
        !normalizedDecision.includes(normalizeText(token)),
        `La simulación de Mercado Pago no debe incluir ${token}.`,
      )
    },
  )

  return {
    id: 'online-courses-payments-mock-safety',
    label: 'Online courses payments mock safety',
    failures,
  }
}

async function runOnlineCoursesApprovalLaterContinuesToMaterializationCase() {
  const previousExecutionResult =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-deferred',
      approvalDecision: 'deferred',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar con la entrega local mock y dejar pagos reales para una fase futura documentada.',
      approvalReason:
        'La integracion real de Mercado Pago queda diferida; solo puede continuar el mock local.',
      approvalRequestDecisionKey: 'approve-real-payments',
      selectedOption: 'Prepararlo más adelante',
      freeAnswer: 'Continuar mock, pagos reales después.',
    })
  const projectState = {
    resolvedDecisions: buildDeferredRealPaymentsResolvedDecisions(),
  }
  const result = await requestOnlineCoursesPreparedMaterializationDecision({
    previousExecutionResult,
    projectState,
  })
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal: result.goal,
    context: result.context,
  })
  const uiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: decision,
    effectivePlannerExecutionMetadata: decision,
  })

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan',
    'Después de elegir later, cursos online debe continuar hacia materialize-fullstack-local-plan.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'executor',
    'Después de elegir later, cursos online debe quedar en executionMode executor.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'execute-plan',
    'Después de elegir later, cursos online debe quedar en nextExpectedAction execute-plan.',
  )
  pushFailure(
    failures,
    decision?.requiresApproval !== true &&
      !decision?.approvalRequest &&
      !decision?.approvalRequestPlan &&
      !decision?.runtimeApprovalState,
    'Después de elegir later no debe quedar approvalRequest ni runtimeApprovalState activos.',
  )
  pushFailure(
    failures,
    String(decision?.selectedDomain || '').trim() === 'online-courses',
    'Después de elegir later, cursos online debe conservar selectedDomain=online-courses.',
  )
  pushFailure(
    failures,
    String(decision?.selectedContractKind || '').trim() === 'online-courses-fullstack-local',
    'Después de elegir later, cursos online debe conservar selectedContractKind=online-courses-fullstack-local.',
  )
  pushFailure(
    failures,
    contractInspection?.ok === true,
    `Después de elegir later, el contrato canónico de cursos online debe quedar OK. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
  )
  pushFailure(
    failures,
    uiState?.uiState === 'materialization-ready' &&
      uiState?.materializeCtaVisible === true &&
      uiState?.materializeCtaEnabled === true &&
      uiState?.shouldShowScalableDeliveryPlan !== true,
    'Después de elegir later, la UI debe quedar en materialization-ready con Materializar entrega habilitado y sin volver al scalable review.',
  )

  return {
    id: 'online-courses-approval-later-continues-to-materialization',
    label: 'Online courses approval later continues to materialization',
    failures,
  }
}

async function runOnlineCoursesApprovalFreeAnswerDeferredCase() {
  const previousExecutionResult =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-deferred',
      approvalDecision: 'deferred',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar con mock local; pagos reales, secretos y webhooks quedan para despues.',
      approvalReason:
        'El usuario pidio seguir con mock local y postergar la integracion comercial sensible.',
      approvalRequestDecisionKey: 'approve-real-payments',
      freeAnswer: 'Continuar mock, pagos reales después.',
    })
  const projectState = {
    resolvedDecisions: buildDeferredRealPaymentsResolvedDecisions({
      selectedOption: '',
      freeAnswer: 'Continuar mock, pagos reales después.',
    }),
  }
  const result = await requestOnlineCoursesPreparedMaterializationDecision({
    previousExecutionResult,
    projectState,
  })
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan',
    'Una respuesta libre del tipo "continuar mock, pagos reales después" debe seguir a materialize-fullstack-local-plan.',
  )
  pushFailure(
    failures,
    String(decision?.selectedDomain || '').trim() === 'online-courses',
    'La respuesta libre diferida debe conservar el dominio online-courses.',
  )
  pushFailure(
    failures,
    decision?.requiresApproval !== true &&
      !decision?.approvalRequest &&
      !decision?.approvalRequestPlan &&
      !decision?.runtimeApprovalState,
    'La respuesta libre diferida no debe reabrir el mismo approval de pagos reales.',
  )

  return {
    id: 'online-courses-approval-free-answer-deferred',
    label: 'Online courses approval free answer deferred',
    failures,
  }
}

async function runOnlineCoursesApprovalLaterReturnsScalableReviewCase() {
  const previousExecutionResult =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-deferred',
      approvalDecision: 'deferred',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Mantener pagos reales para más adelante y continuar solo con el plan local mock.',
      approvalReason:
        'La integracion real de Mercado Pago queda diferida; seguir con mock local y sin credenciales.',
      approvalRequestDecisionKey: 'approve-real-payments',
      selectedOption: 'Prepararlo más adelante',
      freeAnswer: 'Continuar mock, pagos reales después.',
    })
  const resolvedDecisions = buildDeferredRealPaymentsResolvedDecisions()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: onlineCoursesGoalCase.goal,
    context: onlineCoursesGoalCase.context,
    workspacePath: smokeWorkspaceRoot,
    iteration: 2,
    previousExecutionResult,
    requiresApproval: true,
    projectState: { resolvedDecisions },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })
  const failures = []
  const uiState = derivePlannerMaterializationUiState({
    plannerExecutionMetadata: decision,
    effectivePlannerExecutionMetadata: decision,
  })

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'scalable-delivery-plan',
    'Después de elegir later en el review inicial, cursos online debe volver a scalable-delivery-plan revisable.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'planner-only',
    'Después de elegir later en el review inicial, cursos online debe quedar en planner-only.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'review-scalable-delivery',
    'Después de elegir later en el review inicial, cursos online debe volver a review-scalable-delivery.',
  )
  pushFailure(
    failures,
    decision?.requiresApproval !== true &&
      !decision?.approvalRequest &&
      !decision?.approvalRequestPlan &&
      !decision?.runtimeApprovalState,
    'Después de elegir later en el review inicial no debe seguir activo el mismo approval.',
  )
  pushFailure(
    failures,
    uiState?.isScalableReview === true &&
      uiState?.prepareCtaVisible === true &&
      uiState?.prepareCtaLabel === 'Preparar entrega funcional local' &&
      uiState?.materializeCtaEnabled !== true,
    'Después de elegir later en el review inicial, la UI debe volver a Paso 5 con Preparar entrega funcional local visible y sin Materializar entrega habilitado todavía.',
  )

  return {
    id: 'online-courses-approval-later-returns-scalable-review',
    label: 'Online courses approval later returns scalable review',
    failures,
  }
}

async function requestTrackingLogisticsPreparedMaterializationDecision({
  workspacePath = smokeWorkspaceRoot,
} = {}) {
  const goal =
    'Sistema fullstack local de tracking logistico para una empresa de logistica con backend local, API local, SQLite o base local, frontend administrativo, consulta publica por codigo, entidades y relaciones, envios, historial de eventos, incidencias y reportes basicos.'
  const context =
    'No landing. No demo solamente visual. No deploy. No credenciales. No servicios externos. No pagos. No Docker. No base productiva.'
  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No deploy. Seguir local con backend local, API local y SQLite/base local. No externos.',
    })

  const baseDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal,
    context,
    workspacePath,
    iteration: 2,
    previousExecutionResult: approvalFeedback,
    requiresApproval: true,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const scalablePlan =
    baseDecision?.scalableDeliveryPlan &&
    typeof baseDecision.scalableDeliveryPlan === 'object'
      ? baseDecision.scalableDeliveryPlan
      : null

  if (!scalablePlan) {
    return {
      baseDecision,
      decision: null,
      failures: ['La base reviewed fullstack local no devolvio scalableDeliveryPlan para preparar la entrega funcional local.'],
    }
  }

  const prompt = buildFullstackLocalMaterializationPrompt({
    goal,
    context,
    scalablePlan,
  })

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: prompt.goal,
    context: [
      prompt.context,
      'approvalAlreadyGranted: true.',
      'No devolver web-scaffold-base.',
      'No ejecutar todavía.',
    ]
      .filter(Boolean)
      .join('\n'),
    workspacePath,
    iteration: 3,
    previousExecutionResult: approvalFeedback,
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  return { goal, context, baseDecision, decision, failures: [] }
}

async function runTrackingLogisticsPrepareFunctionalDeliveryTransitionCase() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const targetSummary = summarizeUniqueStrings([
    decision?.materializationPlan?.projectRoot,
    ...(Array.isArray(materializationPlan?.allowedTargetPaths)
      ? materializationPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(materializationPlan?.operations)
      ? materializationPlan.operations.map((entry) => entry?.targetPath || '')
      : []),
  ], 160).map((entry) => normalizePathForComparison(entry))

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan',
    'Preparar entrega funcional local debe devolver materialize-fullstack-local-plan.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'executor',
    'Preparar entrega funcional local debe devolver executionMode executor.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'execute-plan',
    'Preparar entrega funcional local debe devolver nextExpectedAction execute-plan.',
  )
  pushFailure(
    failures,
    String(decision?.strategy || '').trim() !== 'edit-single-existing-file',
    'Preparar entrega funcional local no debe degradar a edit-single-existing-file.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() !== 'user-approval' &&
      decision?.requiresApproval !== true &&
      decision?.approvalRequired !== true,
    'Preparar entrega funcional local no debe reabrir user-approval.',
  )
  pushFailure(
    failures,
    !(decision?.approvalRequest || decision?.requiresApproval === true),
    'La transicion fullstack no debe reabrir approvals pendientes.',
  )
  pushFailure(
    failures,
    String(decision?.strategy || '').trim() !== 'prepare-continuation-action-plan' &&
      String(decision?.decisionKey || '').trim() !== 'web-scaffold-base',
    'La transicion fullstack no debe caer en continuation action ni en web-scaffold-base.',
  )
  ;[
    'frontend/admin/readme.md',
    'frontend/public/readme.md',
    'frontend/admin/index.html',
    'frontend/admin/app.js',
    'frontend/public/index.html',
    'frontend/public/app.js',
    'backend/src/routes/shipments.js',
    'backend/src/routes/tracking.js',
    'database/schema.sql',
    'database/seed.sql',
    'docs/api.md',
    'docs/db_schema.md',
  ].forEach((token) => {
    pushFailure(
      failures,
      targetSummary.some((entry) => entry.endsWith(normalizePathForComparison(token))),
      `La transicion fullstack debe incluir ${token}.`,
    )
  })

  return {
    id: 'tracking-logistico-fullstack-prepare-functional-delivery-transition',
    label: 'Tracking logistico fullstack prepare functional delivery transition',
    failures,
  }
}

async function runFullstackLocalPreparationPromptGuardsWrongExecutorRouteCase() {
  const failures = []
  const appSource = fs.readFileSync(appFilePath, 'utf8')
  const smokeSource = fs.readFileSync(new URL(import.meta.url), 'utf8')

  pushFailure(
    failures,
    /No devolver edit-single-existing-file\./.test(appSource) &&
      /No devolver nextExpectedAction=user-approval\./.test(appSource) &&
      /No devolver strategy executor para editar un archivo existente\./.test(appSource),
    'El prompt de preparacion fullstack local debe bloquear explicitamente edit-single-existing-file y user-approval.',
  )
  pushFailure(
    failures,
    /La preparacion fullstack local no puede degradar a edit-single-existing-file\./.test(
      appSource,
    ) &&
      /La preparacion fullstack local no debe reabrir user-approval\./.test(appSource),
    'La validacion del renderer debe rechazar rutas desviadas de edit-single-existing-file o user-approval.',
  )
  pushFailure(
    failures,
    /No devolver edit-single-existing-file\./.test(smokeSource) &&
      /No devolver nextExpectedAction=user-approval\./.test(smokeSource),
    'El helper espejo del smoke debe conservar las mismas restricciones que el prompt real de App.tsx.',
  )

  return {
    id: 'fullstack-local-preparation-prompt-guards-wrong-executor-route',
    label: 'Fullstack local preparation prompt guards wrong executor route',
    failures,
  }
}

async function runTrackingLogisticsMaterializationContractCase() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const contentPool = normalizeText(
    normalizePathForComparison(
      [
        decision?.reason,
        decision?.instruction,
        decision?.domainUnderstanding?.domainLabel,
        ...(Array.isArray(decision?.domainUnderstanding?.primaryModules)
          ? decision.domainUnderstanding.primaryModules
          : []),
        ...(Array.isArray(decision?.domainUnderstanding?.primaryEntities)
          ? decision.domainUnderstanding.primaryEntities
          : []),
        ...(Array.isArray(materializationPlan?.operations)
          ? materializationPlan.operations.flatMap((entry) => [
              entry?.targetPath || '',
              typeof entry?.nextContent === 'string' ? entry.nextContent.slice(0, 1200) : '',
            ])
          : []),
      ]
        .filter(Boolean)
        .join(' '),
    ),
  )

  ;[
    'veterinaria',
    'turnos medicos',
    'appointments',
    'pacientes',
    'mascotas',
    'reservas',
    'prepare-continuation-action-plan',
    'fullstack-local-veterinaria',
  ].forEach(
    (token) => {
      pushFailure(
        failures,
        !contentPool.includes(normalizeText(token)),
        `La materializacion logistica no debe contaminarse con ${token}.`,
      )
    },
  )
  pushFailure(
    failures,
    contentPool.includes(normalizeText('envios')) &&
      contentPool.includes(normalizeText('tracking')),
    'La materializacion logistica debe conservar envios y tracking en el contrato.',
  )
  ;[
    'database/schema.sql',
    'database/seed.sql',
    'docs/api.md',
    'docs/db_schema.md',
    'frontend/admin/index.html',
    'frontend/public/index.html',
    'backend/src/routes/shipments.js',
    'backend/src/routes/tracking.js',
  ].forEach((token) => {
    pushFailure(
      failures,
      contentPool.includes(normalizeText(token)),
      `La materializacion logistica debe incluir ${token} dentro del contrato final.`,
    )
  })
  pushFailure(
    failures,
    !contentPool.includes(normalizeText('database/shipments.json')),
    'La materializacion logistica no debe usar database/shipments.json como persistencia principal.',
  )

  return {
    id: 'tracking-logistico-fullstack-materialization-contract',
    label: 'Tracking logistico fullstack materialization contract',
    failures,
  }
}

async function runTrackingLogisticsTimeoutFallbackNoWebScaffoldCase() {
  const failures = []
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal:
      'Sistema fullstack local de tracking logistico para una empresa de logistica con backend local, API local, SQLite o base local, frontend administrativo, consulta publica por codigo, entidades y relaciones, envios, historial de eventos, incidencias y reportes basicos.',
    context:
      'No landing. No demo solamente visual. No deploy. No credenciales. No servicios externos. No pagos. No Docker. No base productiva.',
    workspacePath: smokeWorkspaceRoot,
    iteration: 1,
    previousExecutionResult:
      'OpenAI superó el timeout configurado para el Cerebro (~62000 ms, limite 60000 ms).',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'scalable-delivery-plan',
    'El fallback local-rules post-timeout debe volver a scalable-delivery-plan.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'planner-only',
    'El fallback local-rules post-timeout debe quedar en planner-only.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'review-scalable-delivery',
    'El fallback local-rules post-timeout debe volver a review-scalable-delivery.',
  )
  pushFailure(
    failures,
    String(decision?.decisionKey || '').trim() !== 'web-scaffold-base',
    'El fallback local-rules post-timeout no debe caer en decisionKey web-scaffold-base.',
  )
  pushFailure(
    failures,
    !(decision?.materializationPlan && typeof decision.materializationPlan === 'object'),
    'El fallback local-rules post-timeout no debe devolver materializationPlan de landing.',
  )

  return {
    id: 'tracking-logistico-fullstack-timeout-fallback-no-web-scaffold',
    label: 'Tracking logistico fullstack timeout fallback no web scaffold',
    failures,
  }
}

async function runTrackingLogisticsExecutorBlocksWebScaffoldCase() {
  const failures = []
  const mainSource = fs.readFileSync(mainFilePath, 'utf8')
  const guardDecision = plannerApi.shouldBlockWebScaffoldExecutionForFullstackRequest({
    goal:
      'Sistema fullstack local de tracking logistico con backend local, SQLite local, API local, frontend administrativo y consulta publica por codigo.',
    context:
      'Entidades y relaciones, envios, historial de eventos, incidencias. No landing. No demo visual solamente.',
    decisionKey: 'web-scaffold-base',
    strategy: 'web-scaffold-base',
    instruction:
      'Rediseñar la landing y materializar la carpeta web-sistema-de-tracking-logistico con index.html, styles.css y script.js.',
    executionScope: {
      allowedTargetPaths: ['web-sistema-de-tracking-logistico/index.html'],
    },
    materializationPlan: {
      projectRoot: 'web-sistema-de-tracking-logistico',
      allowedTargetPaths: ['web-sistema-de-tracking-logistico'],
    },
  })
  const blockedResponse = plannerApi.buildBlockedFullstackWebScaffoldExecutionResponse({
    requestId: 'operator-smoke-block',
    instruction:
      'Rediseñar la landing y materializar la carpeta web-sistema-de-tracking-logistico con index.html, styles.css y script.js.',
    decisionKey: 'web-scaffold-base',
    context:
      'Backend local, SQLite local, API local, frontend administrativo y consulta publica por codigo.',
    executionScope: {
      allowedTargetPaths: ['web-sistema-de-tracking-logistico/index.html'],
    },
    materializationPlan: {
      projectRoot: 'web-sistema-de-tracking-logistico',
      allowedTargetPaths: ['web-sistema-de-tracking-logistico'],
    },
    reason: guardDecision.reason,
  })

  pushFailure(
    failures,
    guardDecision?.blocked === true,
    'El guard del executor debe bloquear web scaffold cuando el pedido original es fullstack fuerte.',
  )
  pushFailure(
    failures,
    blockedResponse?.ok === false &&
      String(blockedResponse?.status || '').trim() === 'blocked' &&
      String(blockedResponse?.reason || '').trim() === 'fullstack request cannot execute web scaffold',
    'La respuesta bloqueada del executor debe devolver ok:false, status:blocked y el reason canonico.',
  )
  pushFailure(
    failures,
    /const fullstackWebScaffoldSafetyBlock = shouldBlockWebScaffoldExecutionForFullstackRequest\(\{[\s\S]{0,320}?decisionKey[\s\S]{0,240}?materializationPlan[\s\S]{0,180}?\}\)/.test(
      mainSource,
    ),
    'execute-task debe evaluar el safety gate fullstack antes de materializar web scaffold.',
  )
  pushFailure(
    failures,
    mainSource.includes("title: 'Ruta bloqueada por safety gate'") &&
      mainSource.includes('buildBlockedFullstackWebScaffoldExecutionResponse({') &&
      mainSource.includes('emitExecutionCompleteEvent(webContents, blockedResponse)'),
    'execute-task debe devolver un blocked seguro cuando detecta web scaffold degradado para un pedido fullstack.',
  )
  pushFailure(
    failures,
    mainSource.includes('runExecutorTask bloqueó scaffold web degradado') &&
      mainSource.includes('materializationPlan: responseMaterializationPlan') &&
      mainSource.includes('return attachExecutorRuntimeMetadata('),
    'runExecutorTask debe bloquear también materializationPlan degradado a web scaffold antes de materializar localmente.',
  )

  return {
    id: 'tracking-logistico-fullstack-executor-blocks-web-scaffold',
    label: 'Tracking logistico fullstack executor blocks web scaffold',
    failures,
  }
}

async function runTrackingLogisticsValidMaterializationNotBlockedCase() {
  const failures = []
  const mainSource = fs.readFileSync(mainFilePath, 'utf8')
  const guardDecision = plannerApi.shouldBlockWebScaffoldExecutionForFullstackRequest({
    goal:
      'Sistema fullstack local de tracking logistico con backend local, SQLite local, API local, frontend administrativo, frontend publico y consulta publica por codigo.',
    context:
      'Entidades y relaciones, envios, historial de eventos, incidencias y reportes basicos. No landing. No demo visual solamente.',
    decisionKey: 'materialize-fullstack-logistics-tracker-local-v1',
    strategy: 'materialize-fullstack-local-plan',
    instruction:
      'Materializar una entrega fullstack local valida con backend, database, frontend admin/public, shared, scripts y docs, sin deploy ni servicios externos.',
    executionScope: {
      allowedTargetPaths: [
        'logistics-tracker-local/backend',
        'logistics-tracker-local/frontend/admin',
        'logistics-tracker-local/frontend/public',
        'logistics-tracker-local/database',
        'logistics-tracker-local/docs',
        'logistics-tracker-local/shared',
        'logistics-tracker-local/scripts',
      ],
    },
    materializationPlan: {
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'logistics-tracker-local',
      allowedTargetPaths: [
        'logistics-tracker-local/backend',
        'logistics-tracker-local/frontend/admin',
        'logistics-tracker-local/frontend/public',
        'logistics-tracker-local/database',
        'logistics-tracker-local/docs',
        'logistics-tracker-local/shared',
        'logistics-tracker-local/scripts',
      ],
      operations: [
        { targetPath: 'logistics-tracker-local/README.md' },
        { targetPath: 'logistics-tracker-local/backend/package.json' },
        { targetPath: 'logistics-tracker-local/backend/src/server.js' },
        { targetPath: 'logistics-tracker-local/backend/src/routes/shipments.js' },
        { targetPath: 'logistics-tracker-local/backend/src/routes/tracking.js' },
        { targetPath: 'logistics-tracker-local/database/schema.sql' },
        { targetPath: 'logistics-tracker-local/database/seed.sql' },
        { targetPath: 'logistics-tracker-local/frontend/public/index.html' },
        { targetPath: 'logistics-tracker-local/frontend/public/app.js' },
        { targetPath: 'logistics-tracker-local/frontend/admin/index.html' },
        { targetPath: 'logistics-tracker-local/frontend/admin/app.js' },
        { targetPath: 'logistics-tracker-local/frontend/admin/styles.css' },
        { targetPath: 'logistics-tracker-local/docs/API.md' },
        { targetPath: 'logistics-tracker-local/docs/ARCHITECTURE.md' },
        { targetPath: 'logistics-tracker-local/docs/api.md' },
        { targetPath: 'logistics-tracker-local/docs/db_schema.md' },
        { targetPath: 'logistics-tracker-local/docs/architecture.md' },
        { targetPath: 'logistics-tracker-local/shared/contracts/domain.js' },
        { targetPath: 'logistics-tracker-local/shared/statuses.js' },
        { targetPath: 'logistics-tracker-local/scripts/seed-local.js' },
      ],
    },
  })
  const contractInspection = guardDecision?.contractInspection

  pushFailure(
    failures,
    guardDecision?.blocked === false,
    'El guard del executor no debe bloquear una materializacion fullstack valida solo por tener HTML/CSS/JS en frontend.',
  )
  pushFailure(
    failures,
    guardDecision?.looksLikeValidFullstackLocalMaterialization === true,
    'El guard debe reconocer la estructura como fullstack local valida antes de decidir bloqueo.',
  )
  pushFailure(
    failures,
    contractInspection?.ok === true,
    `El guard debe apoyarse en un contrato canonico valido. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
  )
  ;[
    'database/schema.sql',
    'database/seed.sql',
    'docs/API.md',
    'docs/DB_SCHEMA.md|docs/DATA_MODEL.md',
    'backend/src/routes/shipments.js',
    'backend/src/routes/tracking.js',
  ].forEach((token) => {
    const normalizedToken = normalizePathForComparison(token)
    const presentInContract =
      token.includes('|')
        ? token
            .split('|')
            .map((entry) => normalizePathForComparison(entry))
            .some((candidate) =>
              Array.isArray(contractInspection?.expectedTargetPaths) &&
              contractInspection.expectedTargetPaths.some((entry) =>
                normalizePathForComparison(entry).endsWith(candidate),
              ),
            )
        : Array.isArray(contractInspection?.expectedTargetPaths) &&
          contractInspection.expectedTargetPaths.some((entry) =>
            normalizePathForComparison(entry).endsWith(normalizedToken),
          )

    pushFailure(
      failures,
      presentInContract,
      `El contrato canonico debe exigir ${token}.`,
    )
  })
  pushFailure(
    failures,
    /function\s+looksLikeValidFullstackLocalMaterializationPayload\s*\(\s*\{/u.test(mainSource) &&
      /function\s+shouldBlockWebScaffoldExecutionForFullstackRequest\s*\(\s*\{[\s\S]*?const\s+looksLikeValidFullstackLocalMaterialization\s*=\s*looksLikeValidFullstackLocalMaterializationPayload\s*\(\s*\{/u.test(
        mainSource,
      ),
    'electron/main.cjs debe exponer un detector positivo de materializacion fullstack valida y usarlo desde shouldBlockWebScaffoldExecutionForFullstackRequest.',
  )

  return {
    id: 'tracking-logistico-fullstack-valid-materialization-not-blocked',
    label: 'Tracking logistico fullstack valid materialization not blocked',
    failures,
  }
}

async function runArtifactMemoryNotSavedForBlockedFullstackWebScaffoldCase() {
  const failures = []
  const mainSource = fs.readFileSync(mainFilePath, 'utf8')

  pushFailure(
    failures,
    /if \(fullstackWebScaffoldSafetyBlock\.blocked\) \{[\s\S]{0,900}?return[\s\S]*?let forcedLocalTask = null/.test(
      mainSource,
    ),
    'El blocked del safety gate debe cortar la ejecucion antes de la ruta rapida local.',
  )
  pushFailure(
    failures,
    mainSource.indexOf('execute-task:fullstack-web-scaffold-blocked') >= 0 &&
      mainSource.indexOf('execute-task:artifact-memory-saved') >= 0 &&
      mainSource.indexOf('execute-task:fullstack-web-scaffold-blocked') <
        mainSource.indexOf('execute-task:artifact-memory-saved'),
    'El bloqueo fullstack debe ocurrir antes de cualquier guardado de artifact memory.',
  )
  pushFailure(
    failures,
    /if \(fastRouteResponse\?\.ok === true\) \{[\s\S]{0,500}?buildReusableArtifactFromWebScaffold/.test(
      mainSource,
    ),
    'La memoria reusable debe seguir condicionada a fastRouteResponse.ok === true.',
  )

  return {
    id: 'artifact-memory-not-saved-for-blocked-fullstack-web-scaffold',
    label: 'Artifact memory not saved for blocked fullstack web scaffold',
    failures,
  }
}

async function runValidFullstackMaterializationCanReachLocalMaterializationCase() {
  const planningWorkspacePath = path.join(
    smokeWorkspaceRoot,
    'tracking-logistics-valid-fullstack-materialization-planning',
  )
  ensureCleanDirectory(planningWorkspacePath)
  const result = await requestTrackingLogisticsPreparedMaterializationDecision({
    workspacePath: planningWorkspacePath,
  })
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal: result.goal,
    context: result.context,
  })
  const workspacePath = path.join(
    smokeWorkspaceRoot,
    'tracking-logistics-valid-fullstack-materialization-pass-through',
  )
  ensureCleanDirectory(workspacePath)

  try {
    pushFailure(
      failures,
      String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan',
      'La decision base para materializacion valida debe seguir en materialize-fullstack-local-plan.',
    )

    const guardDecision = plannerApi.shouldBlockWebScaffoldExecutionForFullstackRequest({
      goal:
        'Sistema fullstack local de tracking logistico para una empresa de logistica con backend local, API local, SQLite o base local, frontend administrativo, consulta publica por codigo, entidades y relaciones, envios, historial de eventos, incidencias y reportes basicos.',
      context:
        'No landing. No demo solamente visual. No deploy. No credenciales. No servicios externos. No pagos. No Docker. No base productiva.',
      decisionKey: decision?.decisionKey || '',
      strategy: decision?.strategy || '',
      instruction: decision?.instruction || '',
      executionScope: decision?.executionScope || null,
      materializationPlan:
        decision?.materializationPlan && typeof decision.materializationPlan === 'object'
          ? decision.materializationPlan
          : null,
    })

    pushFailure(
      failures,
      guardDecision?.blocked === false,
      'Una materializacion fullstack valida debe pasar mas alla del safety gate.',
    )
    pushFailure(
      failures,
      contractInspection?.ok === true,
      `La materializacion valida debe pasar el contrato canonico antes de ejecutar. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
    )

    const task = buildLocalMaterializationTask({
      plan: decision?.materializationPlan || null,
      workspacePath,
      requestId: 'valid-fullstack-materialization-pass-through',
      instruction: decision?.instruction || '',
      brainStrategy: decision?.strategy || '',
      businessSector: decision?.businessSector || '',
      businessSectorLabel: decision?.businessSectorLabel || '',
      creativeDirection: decision?.creativeDirection || null,
      reusableArtifactLookup: decision?.reusableArtifactLookup || null,
      reusableArtifactsFound: decision?.reusableArtifactsFound || 0,
      reuseDecision: decision?.reuseDecision === true,
      reuseReason: decision?.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision?.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision?.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision?.materializationPlanSource || 'planner',
      expectedTargetPaths: Array.isArray(contractInspection?.expectedTargetPaths)
        ? contractInspection.expectedTargetPaths
        : [],
    })

    pushFailure(
      failures,
      !!task,
      'Una materializacion fullstack valida debe poder construir una tarea local deterministica.',
    )

    if (task) {
      const executionResult = await runLocalDeterministicTask(task)
      pushFailure(
        failures,
        executionResult?.ok === true,
        'Una materializacion fullstack valida debe poder llegar a la capa local deterministic sin bloqueo de web scaffold.',
      )
      pushFailure(
        failures,
        String(executionResult?.failureType || '').trim() !== 'blocked_fullstack_web_scaffold',
        'La capa local deterministic no debe devolver blocked_fullstack_web_scaffold para una materializacion fullstack valida.',
      )
      pushFailure(
        failures,
        Array.isArray(executionResult?.details?.createdPaths) &&
          executionResult.details.createdPaths.length > 0,
        'La materializacion valida debe crear archivos dentro del workspace temporal controlado.',
      )
      const createdPaths = Array.isArray(executionResult?.details?.createdPaths)
        ? executionResult.details.createdPaths.map((entry) => normalizePathForComparison(entry))
        : []
      ;[
        'database/schema.sql',
        'database/seed.sql',
        'docs/api.md',
        'docs/db_schema.md',
        'frontend/admin/index.html',
        'frontend/admin/app.js',
        'frontend/public/index.html',
        'frontend/public/app.js',
        'backend/src/server.js',
        'backend/src/routes/shipments.js',
        'backend/src/routes/tracking.js',
        'shared/statuses.js',
      ].forEach((token) => {
        pushFailure(
          failures,
          createdPaths.some((entry) => entry.endsWith(normalizePathForComparison(token))),
          `La materializacion valida debe poder crear ${token} dentro del workspace temporal controlado.`,
        )
      })
      ;['node_modules', '.env', 'dockerfile', 'docker-compose', 'deploy'].forEach((token) => {
        pushFailure(
          failures,
          !createdPaths.some((entry) => entry.includes(normalizePathForComparison(token))),
          `La materializacion valida no debe crear ${token} dentro del workspace temporal.`,
        )
      })
    }
  } finally {
    fs.rmSync(workspacePath, { recursive: true, force: true })
    fs.rmSync(planningWorkspacePath, { recursive: true, force: true })
  }

  return {
    id: 'valid-fullstack-materialization-can-reach-local-materialization',
    label: 'Valid fullstack materialization can reach local materialization',
    failures,
  }
}

async function runTrackingLogisticsFullstackEndToEndScenarioCase() {
  const planningWorkspacePath = path.join(
    smokeWorkspaceRoot,
    'tracking-logistico-fullstack-end-to-end-planning',
  )
  ensureCleanDirectory(planningWorkspacePath)
  const result = await requestTrackingLogisticsPreparedMaterializationDecision({
    workspacePath: planningWorkspacePath,
  })
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const baseDecision = result.baseDecision
  const decision = result.decision
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal: result.goal,
    context: result.context,
  })
  const workspacePath = path.join(
    smokeWorkspaceRoot,
    'tracking-logistico-fullstack-end-to-end-scenario',
  )
  ensureCleanDirectory(workspacePath)

  try {
    pushFailure(
      failures,
      String(baseDecision?.strategy || '').trim() === 'scalable-delivery-plan',
      'La fase 1 del escenario E2E debe devolver scalable-delivery-plan.',
    )
    pushFailure(
      failures,
      String(baseDecision?.executionMode || '').trim() === 'planner-only',
      'La fase 1 del escenario E2E debe devolver planner-only.',
    )
    pushFailure(
      failures,
      String(baseDecision?.nextExpectedAction || '').trim() === 'review-scalable-delivery',
      'La fase 1 del escenario E2E debe devolver review-scalable-delivery.',
    )
    pushFailure(
      failures,
      String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan',
      'La fase 2 del escenario E2E debe devolver materialize-fullstack-local-plan.',
    )
    pushFailure(
      failures,
      String(decision?.executionMode || '').trim() === 'executor',
      'La fase 2 del escenario E2E debe devolver executionMode executor.',
    )
    pushFailure(
      failures,
      String(decision?.nextExpectedAction || '').trim() === 'execute-plan',
      'La fase 2 del escenario E2E debe devolver nextExpectedAction execute-plan.',
    )
    pushFailure(
      failures,
      !(decision?.approvalRequest || decision?.requiresApproval === true),
      'El escenario E2E no debe reabrir approvals pendientes al preparar la entrega.',
    )
    pushFailure(
      failures,
      contractInspection?.ok === true,
      `El escenario E2E debe pasar el contrato canonico antes de materializar. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
    )
    pushFailure(
      failures,
      contractInspection?.usesJsonAsPrimaryPersistence !== true,
      'El escenario E2E no debe usar JSON como persistencia principal.',
    )
    ;['appointments', 'turnos', 'pacientes', 'mascotas', 'veterinaria', 'reservas'].forEach(
      (token) => {
        pushFailure(
          failures,
          !Array.isArray(contractInspection?.forbiddenSignalsFound) ||
            !contractInspection.forbiddenSignalsFound.includes(token),
          `El contrato canonico no debe detectar contaminación ${token} en el escenario E2E.`,
        )
      },
    )

    const task = buildLocalMaterializationTask({
      plan: decision?.materializationPlan || null,
      workspacePath,
      requestId: 'tracking-logistico-fullstack-end-to-end-scenario',
      instruction: decision?.instruction || '',
      brainStrategy: decision?.strategy || '',
      businessSector: decision?.businessSector || '',
      businessSectorLabel: decision?.businessSectorLabel || '',
      creativeDirection: decision?.creativeDirection || null,
      reusableArtifactLookup: decision?.reusableArtifactLookup || null,
      reusableArtifactsFound: decision?.reusableArtifactsFound || 0,
      reuseDecision: decision?.reuseDecision === true,
      reuseReason: decision?.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision?.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision?.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision?.materializationPlanSource || 'planner',
      expectedTargetPaths: Array.isArray(contractInspection?.expectedTargetPaths)
        ? contractInspection.expectedTargetPaths
        : [],
    })

    pushFailure(
      failures,
      !!task,
      'El escenario E2E debe poder construir una tarea local determinística desde el plan materializable.',
    )

    if (task) {
      const executionResult = await runLocalDeterministicTask(task)
      const createdPaths = Array.isArray(executionResult?.details?.createdPaths)
        ? executionResult.details.createdPaths.map((entry) => normalizePathForComparison(entry))
        : []
      const workspaceFiles = listRelativeWorkspaceFiles(workspacePath)
      const rootFolder = normalizePathForComparison(
        contractInspection?.rootPath || decision?.materializationPlan?.projectRoot || '',
      )
      const contaminationPool = normalizeText(
        workspaceFiles
          .filter((entry) => entry.endsWith('.md') || entry.endsWith('.js') || entry.endsWith('.sql'))
          .map((entry) => {
            const absolutePath = path.join(workspacePath, entry)
            return fs.readFileSync(absolutePath, 'utf8')
          })
          .join('\n'),
      )

      pushFailure(
        failures,
        executionResult?.ok === true,
        'El escenario E2E debe materializar correctamente en el workspace temporal controlado.',
      )
      pushFailure(
        failures,
        String(executionResult?.failureType || '').trim() !== 'blocked_fullstack_web_scaffold',
        'El escenario E2E no debe terminar con blocked_fullstack_web_scaffold.',
      )
      pushFailure(
        failures,
        !workspaceFiles.some((entry) => entry.includes('web-sistema-de-tracking')),
        'El escenario E2E no debe crear carpetas web-sistema-de-tracking degradadas.',
      )
      pushFailure(
        failures,
        !!rootFolder && workspaceFiles.some((entry) => entry.startsWith(`${rootFolder}/`)),
        'El escenario E2E debe materializar dentro de un root local controlado.',
      )
      ;[
        'readme.md',
        'docs/api.md',
        'docs/architecture.md',
        'docs/db_schema.md',
        'backend/package.json',
        'backend/src/server.js',
        'backend/src/routes/shipments.js',
        'backend/src/routes/tracking.js',
        'database/schema.sql',
        'database/seed.sql',
        'frontend/admin/index.html',
        'frontend/admin/app.js',
        'frontend/public/index.html',
        'frontend/public/app.js',
        'shared/statuses.js',
      ].forEach((token) => {
        pushFailure(
          failures,
          workspaceFiles.some((entry) => entry.endsWith(normalizePathForComparison(token))),
          `El escenario E2E debe materializar ${token} dentro del workspace temporal.`,
        )
      })
      ;['node_modules', '.env', 'dockerfile', 'docker-compose', 'deploy', 'database/shipments.json'].forEach(
        (token) => {
          pushFailure(
            failures,
            !workspaceFiles.some((entry) => entry.includes(normalizePathForComparison(token))),
            `El escenario E2E no debe crear ${token}.`,
          )
        },
      )
      ;['appointments', 'turnos', 'pacientes', 'mascotas', 'veterinaria', 'reservas'].forEach(
        (token) => {
          pushFailure(
            failures,
            !contaminationPool.includes(normalizeText(token)),
            `El escenario E2E no debe contaminar archivos materializados con ${token}.`,
          )
        },
      )
      pushFailure(
        failures,
        createdPaths.some((entry) => entry.endsWith('/database/schema.sql')) &&
          createdPaths.some((entry) => entry.endsWith('/database/seed.sql')),
        'El escenario E2E debe crear schema.sql y seed.sql como parte del contrato SQL local.',
      )
    }
  } finally {
    fs.rmSync(workspacePath, { recursive: true, force: true })
    fs.rmSync(planningWorkspacePath, { recursive: true, force: true })
  }

  return {
    id: 'tracking-logistico-fullstack-end-to-end-scenario',
    label: 'Tracking logistico fullstack end to end scenario',
    failures,
  }
}

async function runTrackingLogisticsPostApprovalDoesNotMaterializeWebBaseCase() {
  const failures = []
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal:
      'Sistema fullstack local de tracking logistico para una empresa de logistica con backend local, API local, SQLite o base local, frontend administrativo, consulta publica por codigo, entidades y relaciones, envios, historial de eventos, incidencias y reportes basicos.',
    context:
      'No landing. No demo solamente visual. No deploy. No credenciales. No servicios externos. No pagos. No Docker. No base productiva.',
    workspacePath: smokeWorkspaceRoot,
    iteration: 2,
    previousExecutionResult:
      '__orchestrator_feedback__:' +
      JSON.stringify({
        type: 'approval-granted',
        source: 'planner',
        approvalMode: 'once',
        instruction:
          'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
        approvalReason:
          'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
        approvalRequestDecisionKey: 'approve-public-deploy',
        selectedOption: 'No deploy',
        freeAnswer:
          'No deploy. Seguir local. Backend local y SQLite permitidos. No externos.',
        error:
          'OpenAI superó el timeout configurado para el Cerebro (~62000 ms, limite 60000 ms).',
      }),
    requiresApproval: true,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() === 'scalable-delivery-plan',
    'La continuidad post-approval con timeout no debe salir de scalable-delivery-plan.',
  )
  pushFailure(
    failures,
    String(decision?.executionMode || '').trim() === 'planner-only',
    'La continuidad post-approval con timeout no debe materializar ni entrar en executor.',
  )
  pushFailure(
    failures,
    String(decision?.nextExpectedAction || '').trim() === 'review-scalable-delivery',
    'La continuidad post-approval con timeout debe volver a review-scalable-delivery.',
  )
  pushFailure(
    failures,
    !(decision?.materializationPlan && typeof decision.materializationPlan === 'object'),
    'La continuidad post-approval con timeout no debe devolver materializationPlan web base.',
  )

  return {
    id: 'tracking-logistico-fullstack-post-approval-does-not-materialize-web-base',
    label: 'Tracking logistico fullstack post approval does not materialize web base',
    failures,
  }
}

async function runTrackingLogisticsMaterializationRequiresSqlContractCase() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const contractInspection = inspectDecisionMaterializationContract({
    decision: result.decision,
    goal: result.goal,
    context: result.context,
  })
  const materializationPlan =
    result.decision?.materializationPlan && typeof result.decision.materializationPlan === 'object'
      ? result.decision.materializationPlan
      : null
  const targetSummary = normalizeText(
    normalizePathForComparison(
      [
        ...(Array.isArray(materializationPlan?.allowedTargetPaths)
          ? materializationPlan.allowedTargetPaths
          : []),
        ...(Array.isArray(materializationPlan?.operations)
          ? materializationPlan.operations.flatMap((entry) => [
              entry?.targetPath || '',
              typeof entry?.nextContent === 'string' ? entry.nextContent.slice(0, 800) : '',
            ])
          : []),
      ]
        .filter(Boolean)
        .join(' '),
    ),
  )

  ;[
    'database/schema.sql',
    'database/seed.sql',
    'docs/api.md',
    'docs/db_schema.md',
  ].forEach((token) => {
    pushFailure(
      failures,
      targetSummary.includes(normalizeText(token)),
      `El plan materializable logístico debe exigir ${token}.`,
    )
  })
  pushFailure(
    failures,
    !targetSummary.includes(normalizeText('database/shipments.json')),
    'database/shipments.json no puede reemplazar al contrato SQL principal.',
  )
  pushFailure(
    failures,
    contractInspection?.ok === true,
    `El plan materializable logístico debe pasar el contrato canonico. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
  )

  return {
    id: 'tracking-logistico-fullstack-materialization-requires-sql-contract',
    label: 'Tracking logistico fullstack materialization requires SQL contract',
    failures,
  }
}

async function runTrackingLogisticsMaterializationRejectsJsonOnlyCase() {
  const failures = []
  const mainSource = fs.readFileSync(mainFilePath, 'utf8')
  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No deploy. Seguir local con backend local y SQLite/base local. No externos.',
    })

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal:
      'Preparar una entrega fullstack local para tracking logistico con backend local, API local, SQLite o base local, frontend administrativo y consulta publica por codigo.',
    context: [
      'No landing. No demo solamente visual. No deploy. No credenciales. No servicios externos. No pagos. No Docker. No base productiva.',
      'Intento invalido de prueba: usar database/shipments.json como almacenamiento principal.',
      'No incluir database/schema.sql ni database/seed.sql.',
      'No validar este contrato como materialize-fullstack-local-plan listo para ejecutar.',
    ].join('\\n'),
    workspacePath: smokeWorkspaceRoot,
    iteration: 3,
    previousExecutionResult: approvalFeedback,
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal:
      'Preparar una entrega fullstack local para tracking logistico con backend local, API local, SQLite o base local, frontend administrativo y consulta publica por codigo.',
    context: [
      'No landing. No demo solamente visual. No deploy. No credenciales. No servicios externos. No pagos. No Docker. No base productiva.',
      'Intento invalido de prueba: usar database/shipments.json como almacenamiento principal.',
      'No incluir database/schema.sql ni database/seed.sql.',
      'No validar este contrato como materialize-fullstack-local-plan listo para ejecutar.',
    ].join('\n'),
  })

  const normalizedDecision = normalizeText(JSON.stringify(decision || {}))

  pushFailure(
    failures,
    String(decision?.strategy || '').trim() !== 'materialize-fullstack-local-plan' ||
      normalizedDecision.includes(normalizeText('database/schema.sql')),
    'Una propuesta JSON-only no debe quedar aceptada como materializacion logistica si no incorpora schema.sql.',
  )
  pushFailure(
    failures,
    String(decision?.strategy || '').trim() !== 'materialize-fullstack-local-plan' ||
      normalizedDecision.includes(normalizeText('database/seed.sql')),
    'Una propuesta JSON-only no debe quedar aceptada como materializacion logistica si no incorpora seed.sql.',
  )
  pushFailure(
    failures,
    !normalizedDecision.includes(normalizeText('database/shipments.json')),
    'El plan materializable logistico no debe conservar database/shipments.json como persistencia principal.',
  )
  pushFailure(
    failures,
    /function\s+inspectFullstackLocalMaterializationContract\s*\(/.test(mainSource) &&
      /const\s+shouldUseFallbackInvalidMaterializationContract\s*=/.test(mainSource) &&
      /inspectFullstackLocalMaterializationContract\s*\(\s*\{[\s\S]*?strategy:\s*rawDecision\?\.strategy[\s\S]*?materializationPlan:\s*rawDecision\?\.materializationPlan[\s\S]*?existingProjectDetection:\s*rawDecision\?\.existingProjectDetection[\s\S]*?\}\s*\)/.test(
        mainSource,
    ),
    'La normalizacion debe inspeccionar el contrato de materializacion fullstack antes de aceptar un plan materializable.',
  )
  if (String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan') {
    pushFailure(
      failures,
      contractInspection?.ok === true,
      'Si el planner corrige una propuesta JSON-only a un plan materializable, debe convertirla a un contrato SQL válido.',
    )
  } else {
    pushFailure(
      failures,
      contractInspection?.ok !== true,
      'Si el planner no convierte la propuesta JSON-only, el contrato canonico no debe aceptarla.',
    )
  }

  return {
    id: 'tracking-logistico-fullstack-materialization-rejects-json-only',
    label: 'Tracking logistico fullstack materialization rejects JSON only',
    failures,
  }
}
async function runTrackingLogisticsNewProjectDoesNotUseVeterinaryManifestCase() {
  const detectedProjectPath = path.join(smokeWorkspaceRoot, 'fullstack-local-veterinaria')
  ensureCleanDirectory(detectedProjectPath)
  fs.writeFileSync(
    path.join(detectedProjectPath, 'jefe-project.json'),
    `${JSON.stringify(
      {
        version: 1,
        projectType: 'fullstack-local',
        domain: 'Veterinaria local',
        deliveryLevel: 'fullstack-local',
        materializationLayer: 'local-deterministic',
        projectRoot: 'fullstack-local-veterinaria',
        nextRecommendedPhase: 'review-and-expand',
        phases: [],
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(detectedProjectPath, 'README.md'),
    '# Fullstack local veterinaria\n',
    'utf8',
  )
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const contaminationPool = normalizeText(
    JSON.stringify({
      localProjectManifest: decision?.localProjectManifest || null,
      implementationRoadmap: decision?.implementationRoadmap || null,
      phaseExpansionPlan: decision?.phaseExpansionPlan || null,
    }),
  )

  pushFailure(
    failures,
    String(decision?.activeProjectContext?.mode || '').trim() === 'new-project',
    'El tracking logístico nuevo debe quedar en activeProjectContext.mode=new-project.',
  )
  pushFailure(
    failures,
    decision?.existingProjectDetection?.detected === true &&
      decision?.existingProjectDetection?.applicable === false,
    'El proyecto existente detectado debe quedar marcado como detected pero applicable=false.',
  )
  ;['appointments', 'turnos', 'pacientes', 'mascotas', 'fullstack-local-veterinaria'].forEach(
    (token) => {
      pushFailure(
        failures,
        !contaminationPool.includes(normalizeText(token)),
        `El proyecto nuevo logístico no debe reutilizar ${token} desde el manifest veterinario.`,
      )
    },
  )

  return {
    id: 'tracking-logistico-new-project-does-not-use-veterinary-manifest',
    label: 'Tracking logistico new project does not use veterinary manifest',
    failures,
  }
}

async function main() {
  ensureCleanDirectory(smokeWorkspaceRoot)
  try {
    const results = []
    results.push(await runZeroSystemCase())
    results.push(await runFullstackBaseCase())
    results.push(await runExistingWorkspaceProjectDetectionCase())
    results.push(await runFullstackStaticFileCompatibilityCase())
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-veterinary',
        label: 'Dominio veterinaria rico',
        workspaceName: 'operator-domain-veterinary',
        goalCase: veterinaryGoalCase,
        expectedTokens: [
          'veterinaria',
          'clientes',
          'mascotas',
          'turnos',
          'recordatorios',
          'reportes',
          'inventario',
          'veterinarios',
        ],
        forbiddenTokens: ['Clínica médica', 'Pediatría', 'pacientes'],
        browserValidation: true,
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-sports',
        label: 'Dominio reservas y canchas',
        workspaceName: 'operator-domain-sports',
        goalCase: sportsGoalCase,
        expectedTokens: [
          'reservas',
          'canchas',
          'clientes',
          'utilería',
          'ocupación',
          'disponibilidad',
        ],
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-ecommerce',
        label: 'Dominio ecommerce',
        workspaceName: 'operator-domain-ecommerce',
        goalCase: ecommerceGoalCase,
        expectedTokens: [
          'ecommerce',
          'catálogo',
          'productos',
          'clientes',
          'pedidos',
          'stock',
          'reportes',
        ],
        forbiddenTokens: ['mascotas', 'veterinaria', 'pediatría'],
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-documental',
        label: 'Dominio documental',
        workspaceName: 'operator-domain-documental',
        goalCase: documentGoalCase,
        expectedTokens: [
          'documental',
          'expedientes',
          'vencimientos',
          'revisiones',
          'responsables',
          'documentos',
        ],
        forbiddenTokens: ['carrito', 'checkout', 'mascotas'],
        browserValidation: true,
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-school',
        label: 'Dominio escolar',
        workspaceName: 'operator-domain-school',
        goalCase: schoolGoalCase,
        expectedTokens: [
          'familias',
          'alumnos',
          'seguimiento',
          'cursos',
          'escolar',
          'reportes',
        ],
        forbiddenTokens: ['checkout', 'propiedades'],
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-real-estate',
        label: 'Dominio inmobiliaria',
        workspaceName: 'operator-domain-real-estate',
        goalCase: realEstateGoalCase,
        expectedTokens: [
          'inmobiliaria',
          'propiedades',
          'consultas',
          'visitas',
          'corredores',
        ],
        forbiddenTokens: ['mascotas', 'pacientes', 'pedidos'],
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-security',
        label: 'Dominio seguridad',
        workspaceName: 'operator-domain-security',
        goalCase: securityGoalCase,
        expectedTokens: [
          'seguridad',
          'accesos',
          'alertas',
          'sensores',
          'incidentes',
          'rondas',
        ],
        forbiddenTokens: ['checkout', 'mascotas', 'propiedades'],
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-community',
        label: 'Dominio comunidad social',
        workspaceName: 'operator-domain-community',
        goalCase: communityGoalCase,
        expectedTokens: [
          'comunidad',
          'grupos',
          'publicaciones',
          'miembros',
          'moderación',
        ],
        forbiddenTokens: ['pediatría', 'propiedades', 'pedidos'],
      }),
    )
    results.push(
      await runDomainRichnessCase({
        id: 'operator-domain-operations',
        label: 'Fallback genérico operativo',
        workspaceName: 'operator-domain-operations',
        goalCase: genericOperationsGoalCase,
        expectedTokens: [
          'operaciones',
          'solicitudes',
          'actividad',
          'prioridades',
          'casos',
        ],
        forbiddenTokens: ['pediatría', 'propiedades', 'checkout'],
      }),
    )
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
    results.push(await runPhaseMaterializationFlowCase())
    for (const moduleId of ['notifications', 'reports', 'inventory']) {
      results.push(await runSafeModuleCase(moduleId))
    }
    results.push(await runModuleStatusCase())
    results.push(await runSensitivePreviewCase())
    results.push(await runExplicitRestrictionsSafeFlowCase())
    results.push(await runFinalReadinessCase())
    results.push(await runUiContractSanityCase())
    results.push(await runUiHelperSanityCase())
    results.push(await runTrackingLogisticsPostApprovalUiStateRealCase())
    results.push(await runTrackingLogisticsPostApprovalReviewStateCase())
    results.push(await runTrackingLogisticsPreparedPlanUpdatesUiCase())
    results.push(await runTrackingLogisticsCanonicalPreparedContractUiCase())
    results.push(await runTrackingLogisticsCompleteMaterializeEnablesCtaCase())
    results.push(await runTrackingLogisticsIgnoredDetectedProjectDoesNotBlockMaterializeCase())
    results.push(await runTrackingLogisticsHeaderOnlyMaterializeFallbackExitsReviewCase())
    results.push(await runTrackingLogisticsDerivedExecutePlanMaterializeCase())
    results.push(await runRendererDoesNotInventOnlineCoursesMaterializationContractCase())
    results.push(await runMaterializeFullstackLocalPlanResponseOverridesReviewStateCase())
    results.push(await runTrackingLogisticsScalableReviewShowsPrepareCtaCase())
    results.push(await runOnlineCoursesScalableReviewShowsPrepareCtaCase())
    results.push(await runEducationTrainingGeneratedDomainContractShowsPrepareCtaCase())
    results.push(await runGeneratedDomainContractValidReviewShowsNextSafeActionCase())
    results.push(await runScalableReviewDoesNotDegradeToProjectPhaseReviewCase())
    results.push(await runProductArchitectureReviewDoesNotDegradeToProjectPhaseReviewCase())
    results.push(await runGeneratedDomainContractComparisonPayloadCase())
    results.push(await runGeneratedDomainCapabilityProfilePayloadCase())
    results.push(await runLegacyDomainResolutionDiagnosticsPayloadCase())
    results.push(await runLegacyCapabilityAlignmentDiagnosticsPayloadCase())
    results.push(await runLegacyMigrationCandidateReportPayloadCase())
    results.push(await runFullstackLocalInspectionSourceDiagnosticsPayloadCase())
    results.push(await runGeneratedDomainInspectionContractDecouplingReportPayloadCase())
    results.push(await runGeneratedDomainMaterializationShadowPayloadCase())
    results.push(await runGeneratedDomainMaterializationPreferenceGatePayloadCase())
    results.push(await runGeneratedDomainMaterializationPreferenceDecisionPayloadCase())
    results.push(await runGeneratedDomainMaterializationPreferenceSwitchPayloadCase())
    results.push(await runGeneratedDomainMaterializationSwitchReadinessReportPayloadCase())
    results.push(await runGeneratedDomainMaterializationSourceResolutionPayloadCase())
    results.push(
      await runGeneratedDomainMaterializationSourceResolutionTestEnabledProjectionPayloadCase(),
    )
    results.push(await runGeneratedDomainShadowMaterializationCandidatePlanPayloadCase())
    results.push(await runGeneratedDomainShadowCandidateLegacyComparisonPayloadCase())
    results.push(await runGeneratedDomainShadowMaterializationEndToEndReadinessPayloadCase())
    results.push(await runGeneratedDomainControlledEnablePolicyPayloadCase())
    results.push(await runGeneratedDomainFirstControlledEnableScenarioPayloadCase())
    results.push(await runGeneratedDomainFileCreationApprovalPolicyPayloadCase())
    results.push(await runGeneratedDomainMaterializationApprovalPayloadCase())
    results.push(await runGeneratedDomainRuntimeShadowReadinessDecisionPayloadCase())
    results.push(await runGeneratedDomainMvpReadinessExecutiveReportPayloadCase())
    results.push(await runGeneratedDomainUniversalMaterializationPlanPayloadCase())
    results.push(await runGeneratedDomainMaterializationPlanDecouplingPayloadCase())
    results.push(await runGeneratedDomainControlledRuntimeMaterializationSourcePayloadCase())
    results.push(await runGeneratedDomainMaterializationApprovalSurfacePayloadCase())
    results.push(await runGeneratedDomainFileCreationApprovalEvaluationPayloadCase())
    results.push(await runGeneratedDomainSandboxApprovalBridgeCase())
    results.push(await runGeneratedDomainUniversalMaterializationPlanPreviewPayloadCase())
    results.push(
      await runGeneratedDomainUniversalMaterializationPlanPreviewComparisonPayloadCase(),
    )
    results.push(await runGeneratedDomainStructuralCapabilitiesPayloadCase())
    results.push(await runLegacyDomainHardcodingDebtReportPayloadCase())
    results.push(await runLocalDeterministicExecutorLegacyDebtReportPayloadCase())
    results.push(await runLocalDeterministicExecutorCapabilityMigrationPlanPayloadCase())
    results.push(
      await runGeneratedDomainMaterializationInspectionSourceResolutionPayloadCase(),
    )
    results.push(await runGeneratedDomainMaterializationShadowDiffPayloadCase())
    results.push(await runDomainConsistencyDiagnosticsPayloadCase())
    results.push(await runDomainConsistencySemanticMismatchPayloadCase())
    results.push(await runGeneratedDomainContractComparisonTechnicalPanelCase())
    results.push(await runPrepareContinuationActionPlanShowsPrimaryCtaCase())
    results.push(await runPrepareContinuationActionPlanFallbackCtaCase())
    results.push(await runOnlineCoursesMaterializationContractCase())
    results.push(await runOnlineCoursesRootMismatchBlockedCase())
    results.push(await runOnlineCoursesInvalidOpenAIMaterializationFallsBackCase())
    results.push(await runOnlineCoursesPaymentsMockSafetyCase())
    results.push(await runOnlineCoursesApprovalLaterReturnsScalableReviewCase())
    results.push(await runOnlineCoursesApprovalLaterContinuesToMaterializationCase())
    results.push(await runOnlineCoursesApprovalFreeAnswerDeferredCase())
    results.push(await runTrackingLogisticsOpenAIWebScaffoldGuardCase())
    results.push(await runTrackingLogisticsTimeoutFallbackNoWebScaffoldCase())
    results.push(await runTrackingLogisticsExecutorBlocksWebScaffoldCase())
    results.push(await runTrackingLogisticsValidMaterializationNotBlockedCase())
    results.push(await runTrackingLogisticsMaterializationRequiresSqlContractCase())
    results.push(await runTrackingLogisticsMaterializationRejectsJsonOnlyCase())
    results.push(await runTrackingLogisticsNewProjectDoesNotUseVeterinaryManifestCase())
    results.push(await runArtifactMemoryNotSavedForBlockedFullstackWebScaffoldCase())
    results.push(await runValidFullstackMaterializationCanReachLocalMaterializationCase())
    results.push(await runTrackingLogisticsFullstackEndToEndScenarioCase())
    results.push(await runTrackingLogisticsPostApprovalDoesNotMaterializeWebBaseCase())
    results.push(await runTrackingLogisticsPrepareFunctionalDeliveryTransitionCase())
    results.push(await runFullstackLocalPreparationPromptGuardsWrongExecutorRouteCase())
    results.push(await runTrackingLogisticsMaterializationContractCase())
    results.push(await runUtf8SurfaceCase())

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
