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
const requiredPlannerFunctions = [
  'buildDomainUnderstanding',
  'buildProductArchitecturePlan',
  'buildSafeFirstDeliveryPlan',
  'buildMaterializeSafeFirstDeliveryPlan',
  'buildLocalStrategicBrainDecision',
]

const activeCases = [
  {
    id: 'social-barrial',
    label: 'App social barrial',
    goal:
      'Hacer una app social para comunidades barriales con perfiles, publicaciones, comentarios, grupos, notificaciones y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para una app social barrial. Revisar perfiles, publicaciones, comentarios, grupos, notificaciones, reportes, busqueda, filtro por estado, detalle seleccionado, acciones locales y log de actividad.',
    mustInclude: ['perfiles', 'publicaciones', 'comentarios', 'grupos', 'notificaciones', 'reportes'],
    mustExclude: [
      'accesos',
      'alertas',
      'sensores',
      'zonas',
      'operadores',
      'alumnos',
      'familias',
      'cursos',
      'productos',
      'carrito',
      'checkout',
      'documentos',
      'vencimientos',
    ],
    folderAnyOf: ['safe-first-delivery-social'],
  },
  {
    id: 'documental-puro',
    label: 'Sistema documental puro',
    goal:
      'Hacer un sistema documental para gestionar documentos, operaciones, vencimientos, observaciones, responsables y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para un sistema documental. Revisar documentos, operaciones, vencimientos, observaciones, responsables, reportes, busqueda, filtro por estado, detalle seleccionado, acciones locales y log de actividad.',
    mustInclude: ['documentos', 'operaciones', 'vencimientos', 'observaciones', 'responsables', 'reportes'],
    mustExclude: [
      'accesos',
      'solicitudes',
      'sensores',
      'zonas',
      'operadores',
      'carrito',
      'checkout',
      'alumnos',
      'familias',
    ],
    folderAnyOf: ['safe-first-delivery-documental'],
  },
  {
    id: 'seguridad',
    label: 'Sistema de seguridad',
    goal:
      'Hacer un sistema de seguridad para monitorear accesos, alertas, sensores, zonas, operadores y eventos.',
    context:
      'Quiero validar una primera entrega segura local y mock para seguridad y monitoreo. Revisar accesos, alertas, sensores, zonas, operadores, eventos, busqueda, filtro por estado, detalle seleccionado y log de actividad.',
    mustInclude: ['accesos', 'alertas', 'sensores', 'zonas', 'operadores', 'eventos', 'reportes'],
    mustExclude: [
      'perfiles',
      'publicaciones',
      'documentos',
      'vencimientos',
      'productos',
      'carrito',
      'checkout',
      'alumnos',
      'familias',
      'cursos',
    ],
    mustMention: ['panel de monitoreo'],
    folderAnyOf: ['safe-first-delivery-seguridad'],
  },
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    goal: 'Hacer un ecommerce con productos, carrito, ordenes, checkout simulado y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para ecommerce con catalogo, productos, carrito, checkout simulado, ordenes y reportes.',
    mustInclude: ['productos', 'carrito', 'checkout simulado', 'ordenes', 'reportes'],
    folderAnyOf: ['safe-first-delivery-ecommerce'],
  },
  {
    id: 'crm-escolar',
    label: 'CRM escolar',
    goal:
      'Hacer un CRM para escuelas con alumnos, familias, cursos, comunicaciones, seguimiento y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para un CRM escolar con alumnos, familias, cursos, comunicaciones, seguimiento y reportes.',
    mustInclude: ['alumnos', 'familias', 'cursos', 'comunicaciones', 'seguimiento', 'reportes'],
    folderAnyOf: ['safe-first-delivery-crm'],
  },
  {
    id: 'solicitudes-operativas',
    label: 'Solicitudes operativas',
    goal:
      'Hacer un sistema interno para gestionar solicitudes operativas, revisar estados, registrar observaciones y generar reportes simples.',
    context:
      'Quiero validar una primera entrega segura local y mock para solicitudes operativas con estados, observaciones, reportes, busqueda, detalle seleccionado y acciones locales.',
    mustInclude: ['solicitudes', 'estados', 'observaciones', 'reportes'],
    folderAnyOf: ['safe-first-delivery-solicitudes'],
  },
  {
    id: 'reservas-canchas',
    label: 'Reservas de canchas',
    goal:
      'Hacer un sistema de reservas de canchas para gestionar canchas, horarios, reservas, clientes, disponibilidad y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para reservas de canchas con disponibilidad, horarios, reservas, clientes, reportes y acciones locales.',
    mustInclude: ['canchas', 'horarios', 'reservas', 'clientes', 'disponibilidad', 'reportes'],
    mustExclude: [
      'ecommerce',
      'checkout',
      'alumnos',
      'familias',
      'accesos',
      'sensores',
      'documentos',
      'perfiles',
    ],
    folderAnyOf: ['safe-first-delivery-reservas', 'safe-first-delivery-canchas'],
  },
]

const candidateCases = [
  {
    id: 'turnos-medicos',
    reason:
      'Hoy detecta turnos, disponibilidad, pacientes y profesionales, pero todavia no preserva especialidades y el folder cae en safe-first-delivery-negocio.',
  },
  {
    id: 'logistica-entregas',
    reason:
      'Hoy solo conserva rutas, estados y reportes; faltan envios, entregas, choferes y vehiculos, y el folder cae en safe-first-delivery-negocio.',
  },
  {
    id: 'navegacion-rutas',
    reason:
      'Hoy conserva rutas, ubicaciones y reportes, pero todavia no preserva puntos de interes ni vehiculos, y el folder cae en safe-first-delivery-negocio.',
  },
]

const scalableValidationCases = [
  {
    id: 'landing-relojeria',
    label: 'Pedido chico',
    goal: 'Hacer una landing para una relojería premium.',
    context: '',
    acceptedStrategies: ['web-scaffold-base', 'safe-first-delivery-plan'],
    rejectedStrategies: ['scalable-delivery-plan'],
  },
  {
    id: 'frontend-project',
    label: 'Frontend project',
    goal:
      'Hacer una app React completa para reservas de canchas con componentes, rutas, mocks y estructura de proyecto.',
    context: '',
    expectedDeliveryLevel: 'frontend-project',
  },
  {
    id: 'fullstack-local',
    label: 'Fullstack local',
    goal:
      'Hacer un sistema fullstack local para turnos médicos con frontend, backend y base de datos local.',
    context: '',
    expectedDeliveryLevel: 'fullstack-local',
  },
  {
    id: 'monorepo-local',
    label: 'Monorepo local',
    goal:
      'Hacer un monorepo local con app web, API, workers, paquetes compartidos y documentación.',
    context: '',
    expectedDeliveryLevel: 'monorepo-local',
  },
  {
    id: 'infra-local-plan',
    label: 'Infra local',
    goal:
      'Hacer una base local con Docker, Redis, BullMQ, cron y Postgres para un sistema de reservas.',
    context: '',
    expectedDeliveryLevel: 'infra-local-plan',
    mustRequireApprovalLater: true,
  },
]

function printUsage() {
  console.log('Uso: node scripts/ai-planner-smoke.mjs [--verbose] [--list] [--case=<id>]')
}

function parseArgs(argv) {
  let verbose = false
  let listOnly = false
  let caseId = ''

  for (const arg of argv) {
    if (arg === '--verbose') {
      verbose = true
      continue
    }

    if (arg === '--list') {
      listOnly = true
      continue
    }

    if (arg.startsWith('--case=')) {
      caseId = arg.slice('--case='.length).trim()
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  return {
    verbose,
    listOnly,
    caseId,
  }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizePathForComparison(value) {
  return String(value || '').replace(/\\/g, '/')
}

function summarizeUniqueStrings(entries, limit = 12) {
  const values = []
  const seen = new Set()

  ;(Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (typeof entry !== 'string' || !entry.trim()) {
      return
    }

    const value = entry.trim()
    if (seen.has(value)) {
      return
    }

    seen.add(value)
    values.push(value)
  })

  return values.slice(0, limit)
}

function buildAllowedTargetPathsExpectation(folderName) {
  return [
    folderName,
    `${folderName}/index.html`,
    `${folderName}/styles.css`,
    `${folderName}/script.js`,
    `${folderName}/mock-data.json`,
  ]
}

function listHasToken(entries, token) {
  const normalizedToken = normalizeText(token)

  return entries.some((entry) => {
    const normalizedEntry = normalizeText(entry)
    return (
      normalizedEntry === normalizedToken ||
      normalizedEntry.includes(normalizedToken) ||
      new RegExp(`\\b${escapeRegExp(normalizedToken)}\\b`, 'u').test(normalizedEntry)
    )
  })
}

function formatList(entries) {
  return Array.isArray(entries) && entries.length > 0 ? entries.join(', ') : '(vacio)'
}

function extractSegment({ name, startMarker, endMarker }) {
  const start = mainSource.indexOf(startMarker)
  if (start === -1) {
    throw new Error(
      `[ai-planner-smoke] No se encontro el anchor inicial de ${name}: ${JSON.stringify(startMarker)}.`,
    )
  }

  const end = mainSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(
      `[ai-planner-smoke] No se encontro el anchor final de ${name}: ${JSON.stringify(endMarker)}.`,
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
  buildDomainUnderstanding,
  buildProductArchitecturePlan,
  buildSafeFirstDeliveryPlan,
  buildMaterializeSafeFirstDeliveryPlan,
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
    path,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)

  try {
    vm.runInContext(harness, sandbox, {
      filename: 'ai-planner-smoke-harness.cjs',
    })
  } catch (error) {
    throw new Error(
      `[ai-planner-smoke] No se pudo ejecutar el harness del planner extraido desde electron/main.cjs: ${error.message}`,
    )
  }

  const exported = sandbox.module.exports || {}
  const missing = requiredPlannerFunctions.filter((name) => typeof exported[name] !== 'function')

  if (missing.length > 0) {
    throw new Error(
      `[ai-planner-smoke] El harness se cargo pero faltan funciones requeridas: ${missing.join(', ')}.`,
    )
  }

  return exported
}

const plannerApi = loadPlannerTestingSurface()

function toStringArray(value, limit = 20) {
  return summarizeUniqueStrings(value, limit)
}

function buildCaseStructures(testCase) {
  const domainUnderstanding = plannerApi.buildDomainUnderstanding({
    goal: testCase.goal,
    context: testCase.context,
  })
  const productArchitecturePlan = plannerApi.buildProductArchitecturePlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
  })
  const safeFirstDeliveryPlan = plannerApi.buildSafeFirstDeliveryPlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
  })
  const materializePlan = plannerApi.buildMaterializeSafeFirstDeliveryPlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
  })

  const domainModules = toStringArray(domainUnderstanding?.primaryModules)
  const architectureModules = toStringArray(productArchitecturePlan?.productArchitecture?.coreModules)
  const safeModules = toStringArray(safeFirstDeliveryPlan?.safeFirstDeliveryPlan?.modules)
  const materializeModules = toStringArray(materializePlan?.safeFirstDeliveryMaterialization?.modules)
  const materializeCollections = toStringArray(
    materializePlan?.safeFirstDeliveryMaterialization?.mockCollections,
  )
  const allowedTargetPaths = Array.isArray(materializePlan?.executionScope?.allowedTargetPaths)
    ? materializePlan.executionScope.allowedTargetPaths
    : []
  const folderName = allowedTargetPaths[0] || ''
  const aggregatedModules = [
    ...domainModules,
    ...architectureModules,
    ...safeModules,
    ...materializeModules,
  ]
  const aggregatedTexts = [
    ...toStringArray(productArchitecturePlan?.productArchitecture?.keyFlows, 24),
    ...toStringArray(safeFirstDeliveryPlan?.safeFirstDeliveryPlan?.screens, 24),
    ...toStringArray(safeFirstDeliveryPlan?.safeFirstDeliveryPlan?.localBehavior, 24),
    ...toStringArray(materializePlan?.safeFirstDeliveryMaterialization?.screens, 24),
    ...toStringArray(materializePlan?.safeFirstDeliveryMaterialization?.localActions, 24),
  ]

  return {
    domainUnderstanding,
    productArchitecturePlan,
    safeFirstDeliveryPlan,
    materializePlan,
    domainModules,
    architectureModules,
    safeModules,
    materializeModules,
    materializeCollections,
    allowedTargetPaths,
    folderName,
    aggregatedModules,
    aggregatedTexts,
  }
}

function summarizeDomainUnderstanding(domainUnderstanding) {
  return {
    domainLabel: domainUnderstanding?.domainLabel || '',
    intentLabel: domainUnderstanding?.intentLabel || '',
    productKind: domainUnderstanding?.productKind || '',
    primaryModules: toStringArray(domainUnderstanding?.primaryModules),
    primaryEntities: toStringArray(domainUnderstanding?.primaryEntities),
    secondaryEntities: toStringArray(domainUnderstanding?.secondaryEntities),
    roles: toStringArray(domainUnderstanding?.roles),
    coreFlows: toStringArray(domainUnderstanding?.coreFlows),
    stateModel: toStringArray(domainUnderstanding?.stateModel),
    localActions: toStringArray(domainUnderstanding?.localActions),
  }
}

function summarizeProductArchitecture(productArchitecturePlan) {
  const architecture = productArchitecturePlan?.productArchitecture || {}

  return {
    productType: architecture.productType || '',
    domain: architecture.domain || '',
    coreModules: toStringArray(architecture.coreModules),
    dataEntities: toStringArray(architecture.dataEntities),
    keyFlows: toStringArray(architecture.keyFlows),
    roles: toStringArray(architecture.roles),
    users: toStringArray(architecture.users),
  }
}

function summarizeSafeFirstDeliveryPlan(safeFirstDeliveryPlan) {
  const plan = safeFirstDeliveryPlan?.safeFirstDeliveryPlan || {}

  return {
    modules: toStringArray(plan.modules),
    screens: toStringArray(plan.screens),
    localBehavior: toStringArray(plan.localBehavior),
    mockData: toStringArray(plan.mockData),
    explicitExclusions: toStringArray(plan.explicitExclusions),
  }
}

function summarizeMaterialization(materializePlan) {
  const materialization = materializePlan?.safeFirstDeliveryMaterialization || {}

  return {
    modules: toStringArray(materialization.modules),
    entities: toStringArray(materialization.entities),
    mockCollections: toStringArray(materialization.mockCollections),
    screens: toStringArray(materialization.screens),
    localActions: toStringArray(materialization.localActions),
    stateHints: toStringArray(materialization.stateHints),
    approvalThemes: toStringArray(materialization.approvalThemes),
    explicitExclusions: toStringArray(materialization.explicitExclusions),
  }
}

function runCase(testCase) {
  const structures = buildCaseStructures(testCase)
  const failures = []
  const missingExpectedModules = []
  const forbiddenModulesFound = []
  const missingMentions = []
  const expectedAllowedTargetPaths = buildAllowedTargetPathsExpectation(structures.folderName)
  const normalizedAllowed = structures.allowedTargetPaths.map(normalizePathForComparison)
  const normalizedExpectedAllowed = expectedAllowedTargetPaths.map(normalizePathForComparison)

  if (!structures.domainUnderstanding || typeof structures.domainUnderstanding !== 'object') {
    failures.push('domainUnderstanding ausente.')
  } else {
    if (!String(structures.domainUnderstanding.domainLabel || '').trim()) {
      failures.push('domainUnderstanding pobre: falta domainLabel.')
    }

    if (structures.domainModules.length === 0) {
      failures.push('domainUnderstanding pobre: primaryModules vacio.')
    }
  }

  if (structures.architectureModules.length === 0) {
    failures.push('productArchitecture incoherente: coreModules vacio.')
  }

  if (structures.safeModules.length === 0) {
    failures.push('safeFirstDeliveryPlan incoherente: modules vacio.')
  }

  if (structures.materializeModules.length === 0) {
    failures.push('safeFirstDeliveryMaterialization incoherente: modules vacio.')
  }

  for (const expected of testCase.mustInclude || []) {
    if (!listHasToken(structures.aggregatedModules, expected)) {
      missingExpectedModules.push(expected)
    }
  }

  for (const forbidden of testCase.mustExclude || []) {
    if (listHasToken(structures.aggregatedModules, forbidden)) {
      forbiddenModulesFound.push(forbidden)
    }
  }

  for (const expectedText of testCase.mustMention || []) {
    if (!listHasToken(structures.aggregatedTexts, expectedText)) {
      missingMentions.push(expectedText)
    }
  }

  if (
    !testCase.folderAnyOf.some(
      (entry) => normalizePathForComparison(entry) === normalizePathForComparison(structures.folderName),
    )
  ) {
    failures.push(
      `Folder incorrecto. Esperado: ${testCase.folderAnyOf.join(', ')}. Recibido: ${
        structures.folderName || '(vacio)'
      }.`,
    )
  }

  if (
    normalizedAllowed.length !== normalizedExpectedAllowed.length ||
    normalizedAllowed.some((entry, index) => entry !== normalizedExpectedAllowed[index])
  ) {
    failures.push(
      `allowedTargetPaths incorrectos. Esperado: ${normalizedExpectedAllowed.join(' | ')}. Recibido: ${
        normalizedAllowed.join(' | ') || '(vacio)'
      }.`,
    )
  }

  if (missingExpectedModules.length > 0) {
    failures.push(`Modulos esperados faltantes: ${missingExpectedModules.join(', ')}.`)
  }

  if (forbiddenModulesFound.length > 0) {
    failures.push(`Modulos prohibidos encontrados: ${forbiddenModulesFound.join(', ')}.`)
  }

  if (missingMentions.length > 0) {
    failures.push(`Senales textuales faltantes: ${missingMentions.join(', ')}.`)
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    missingExpectedModules,
    forbiddenModulesFound,
    missingMentions,
    summaries: {
      domainUnderstanding: summarizeDomainUnderstanding(structures.domainUnderstanding),
      productArchitecture: summarizeProductArchitecture(structures.productArchitecturePlan),
      safeFirstDeliveryPlan: summarizeSafeFirstDeliveryPlan(structures.safeFirstDeliveryPlan),
      safeFirstDeliveryMaterialization: summarizeMaterialization(structures.materializePlan),
    },
    folderName: structures.folderName,
    allowedTargetPaths: structures.allowedTargetPaths,
    materializeCollections: structures.materializeCollections,
  }
}

function printList() {
  console.log('AI Planner Smoke - Casos activos')
  activeCases.forEach((testCase) => {
    console.log(`- ${testCase.id}`)
  })

  if (candidateCases.length > 0) {
    console.log('')
    console.log('AI Planner Smoke - Casos evaluados pero no incorporados')
    candidateCases.forEach((testCase) => {
      console.log(`- ${testCase.id}: ${testCase.reason}`)
    })
  }
}

function printCompactResult(result) {
  const {
    testCase,
    ok,
    summaries,
    folderName,
    materializeCollections,
    failures,
  } = result

  console.log(`${ok ? 'PASS' : 'FAIL'} ${testCase.id} | ${testCase.label}`)
  console.log(`- objetivo: ${testCase.goal}`)
  console.log(`- dominio detectado: ${summaries.domainUnderstanding.domainLabel || '(sin domainLabel)'}`)
  console.log(`- folder esperado: ${testCase.folderAnyOf.join(' | ')}`)
  console.log(`- folder recibido: ${folderName || '(vacio)'}`)
  console.log(`- modulos principales: ${formatList(summaries.safeFirstDeliveryPlan.modules)}`)
  console.log(`- colecciones materializadas: ${formatList(materializeCollections)}`)
  console.log(`- resultado: ${ok ? 'OK' : 'FALLO'}`)

  if (!ok) {
    failures.forEach((failure) => console.log(`  - ${failure}`))
  }
}

function printVerboseResult(result) {
  printCompactResult(result)
  console.log('  domainUnderstanding:')
  console.log(`    ${JSON.stringify(result.summaries.domainUnderstanding)}`)
  console.log('  productArchitecture:')
  console.log(`    ${JSON.stringify(result.summaries.productArchitecture)}`)
  console.log('  safeFirstDeliveryPlan:')
  console.log(`    ${JSON.stringify(result.summaries.safeFirstDeliveryPlan)}`)
  console.log('  safeFirstDeliveryMaterialization:')
  console.log(`    ${JSON.stringify(result.summaries.safeFirstDeliveryMaterialization)}`)
  console.log(`  allowedTargetPaths: ${result.allowedTargetPaths.join(' | ') || '(vacio)'}`)
}

function resolveCases(caseId) {
  if (!caseId) {
    return activeCases
  }

  const selected = activeCases.find((testCase) => testCase.id === caseId)
  if (selected) {
    return [selected]
  }

  const pending = candidateCases.find((testCase) => testCase.id === caseId)
  if (pending) {
    console.error(
      `[ai-planner-smoke] El caso "${caseId}" fue evaluado, pero todavia no esta incorporado al smoke activo: ${pending.reason}`,
    )
    process.exit(1)
  }

  console.error(`[ai-planner-smoke] No existe un caso con id "${caseId}". Usa --list para ver los disponibles.`)
  process.exit(1)
}

async function runScalableValidationCase(testCase) {
  const reusablePlanningContext = {
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
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const scalablePlan =
    decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
      ? decision.scalableDeliveryPlan
      : null

  if (Array.isArray(testCase.acceptedStrategies) && !testCase.acceptedStrategies.includes(strategy)) {
    failures.push(
      `Estrategia inesperada. Esperado: ${testCase.acceptedStrategies.join(' | ')}. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (Array.isArray(testCase.rejectedStrategies) && testCase.rejectedStrategies.includes(strategy)) {
    failures.push(`La estrategia no debía escalar. Recibido: ${strategy}.`)
  }

  if (testCase.expectedDeliveryLevel) {
    if (strategy !== 'scalable-delivery-plan') {
      failures.push(`Estrategia incorrecta. Esperado: scalable-delivery-plan. Recibido: ${strategy || '(vacia)'}.`)
    }

    if (executionMode !== 'planner-only') {
      failures.push(`executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`)
    }

    if (nextExpectedAction !== 'review-scalable-delivery') {
      failures.push(
        `nextExpectedAction incorrecto. Esperado: review-scalable-delivery. Recibido: ${nextExpectedAction || '(vacio)'}.`,
      )
    }

    if (!scalablePlan) {
      failures.push('scalableDeliveryPlan ausente.')
    } else {
      if (String(scalablePlan.deliveryLevel || '').trim() !== testCase.expectedDeliveryLevel) {
        failures.push(
          `deliveryLevel incorrecto. Esperado: ${testCase.expectedDeliveryLevel}. Recibido: ${
            scalablePlan.deliveryLevel || '(vacio)'
          }.`,
        )
      }

      if (!Array.isArray(scalablePlan.allowedRootPaths) || scalablePlan.allowedRootPaths.length === 0) {
        failures.push('allowedRootPaths vacío.')
      }

      if (!Array.isArray(scalablePlan.filesToCreate) || scalablePlan.filesToCreate.length === 0) {
        failures.push('filesToCreate vacío.')
      }

      if (
        !Array.isArray(scalablePlan.localOnlyConstraints) ||
        scalablePlan.localOnlyConstraints.length === 0
      ) {
        failures.push('localOnlyConstraints vacío.')
      }

      if (
        !Array.isArray(scalablePlan.successCriteria) ||
        scalablePlan.successCriteria.length === 0
      ) {
        failures.push('successCriteria vacío.')
      }

      if (testCase.mustRequireApprovalLater) {
        if (
          !Array.isArray(scalablePlan.approvalRequiredLater) ||
          scalablePlan.approvalRequiredLater.length === 0
        ) {
          failures.push('approvalRequiredLater debería tener entradas para este caso.')
        }
      }
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
    scalablePlan,
  }
}

function printScalableValidationResult(result) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.testCase.id} | ${result.testCase.label}`)
  console.log(`- objetivo: ${result.testCase.goal}`)
  console.log(`- estrategia: ${result.strategy || '(vacia)'}`)
  console.log(`- executionMode: ${result.executionMode || '(vacio)'}`)
  console.log(
    `- deliveryLevel: ${result.scalablePlan?.deliveryLevel || '(no aplica)'}`,
  )

  if (!result.ok) {
    result.failures.forEach((failure) => console.log(`  - ${failure}`))
  }
}

async function main() {
  const { verbose, listOnly, caseId } = parseArgs(process.argv.slice(2))

  if (listOnly) {
    printList()
    return
  }

  const casesToRun = resolveCases(caseId)
  const results = casesToRun.map(runCase)
  const passedCount = results.filter((result) => result.ok).length
  const failedResults = results.filter((result) => !result.ok)

  console.log('AI Planner Smoke')
  console.log('=================')

  results.forEach((result) => {
    if (verbose) {
      printVerboseResult(result)
    } else {
      printCompactResult(result)
    }
  })

  console.log('-----------------')

  let scalableResults = []
  if (!caseId) {
    console.log('Scalable Delivery Checks')
    console.log('=======================')
    scalableResults = await Promise.all(
      scalableValidationCases.map(runScalableValidationCase),
    )
    scalableResults.forEach(printScalableValidationResult)
    console.log('-----------------')
  }

  const failedScalableResults = scalableResults.filter((result) => !result.ok)

  if (failedResults.length === 0 && failedScalableResults.length === 0) {
    console.log(`OK. ${passedCount}/${results.length} casos pasaron.`)
    if (scalableResults.length > 0) {
      console.log(`OK. ${scalableResults.length}/${scalableResults.length} checks escalables pasaron.`)
    }
    return
  }

  console.log(`FALLO. ${passedCount}/${results.length} casos pasaron.`)
  console.log('casos fallidos:')
  failedResults.forEach((result) => {
    console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
  })

  if (failedScalableResults.length > 0) {
    console.log('checks escalables fallidos:')
    failedScalableResults.forEach((result) => {
      console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
    })
  }
  process.exit(1)
}

await main()
