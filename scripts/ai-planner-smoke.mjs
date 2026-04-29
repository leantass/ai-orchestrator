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

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)

  if (start === -1 || end === -1) {
    throw new Error(
      `No pude extraer el segmento entre ${JSON.stringify(startMarker)} y ${JSON.stringify(endMarker)}.`,
    )
  }

  return source.slice(start, end)
}

function loadPlannerTestingSurface() {
  const segmentA = sliceBetween(
    mainSource,
    'function normalizeExecutorAttemptScope(',
    'function buildBrainDecisionContract(',
  )
  const segmentB = sliceBetween(
    mainSource,
    'function extractExplicitBusinessLabelFromPlanningText(',
    'function buildReusablePreserveDirective(',
  )
  const harness = `
${segmentA}
${segmentB}
module.exports = {
  buildDomainUnderstanding,
  buildProductArchitecturePlan,
  buildSafeFirstDeliveryPlan,
  buildMaterializeSafeFirstDeliveryPlan,
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
  vm.runInContext(harness, sandbox, {
    filename: 'ai-planner-smoke-harness.cjs',
  })

  return sandbox.module.exports
}

const {
  buildDomainUnderstanding,
  buildProductArchitecturePlan,
  buildSafeFirstDeliveryPlan,
  buildMaterializeSafeFirstDeliveryPlan,
} = loadPlannerTestingSurface()

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function listHasToken(entries, token) {
  const normalizedToken = normalizeText(token)

  return entries.some((entry) => {
    const normalizedEntry = normalizeText(entry)
    return (
      normalizedEntry === normalizedToken ||
      normalizedEntry.includes(normalizedToken) ||
      new RegExp(`\\b${normalizedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'u').test(
        normalizedEntry,
      )
    )
  })
}

function normalizePathForComparison(value) {
  return String(value || '').replace(/\\/g, '/')
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

const cases = [
  {
    key: 'app-social',
    label: 'App social barrial',
    goal:
      'Hacer una app social para comunidades barriales con perfiles, publicaciones, comentarios, grupos, notificaciones y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para una app social barrial. Revisar perfiles, publicaciones, comentarios, grupos, notificaciones, reportes, búsqueda, filtro por estado, detalle seleccionado, acciones locales y log de actividad.',
    mustInclude: ['perfiles', 'publicaciones', 'comentarios', 'grupos', 'notificaciones', 'reportes'],
    mustExclude: ['accesos', 'alertas', 'sensores', 'zonas', 'operadores', 'alumnos', 'familias', 'carrito', 'checkout'],
    folderAnyOf: ['safe-first-delivery-social'],
  },
  {
    key: 'documental',
    label: 'Sistema documental puro',
    goal:
      'Hacer un sistema documental para gestionar documentos, operaciones, vencimientos, observaciones, responsables y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para un sistema documental. Revisar documentos, operaciones, vencimientos, observaciones, responsables, reportes, búsqueda, filtro por estado, detalle seleccionado, acciones locales y log de actividad.',
    mustInclude: ['documentos', 'operaciones', 'vencimientos', 'observaciones', 'responsables', 'reportes'],
    mustExclude: ['accesos', 'solicitudes', 'carrito', 'checkout', 'alumnos', 'familias'],
    folderAnyOf: ['safe-first-delivery-documental'],
  },
  {
    key: 'seguridad',
    label: 'Sistema de seguridad',
    goal:
      'Hacer un sistema de seguridad para monitorear accesos, alertas, sensores, zonas, operadores y eventos.',
    context:
      'Quiero validar una primera entrega segura local y mock para seguridad y monitoreo. Revisar accesos, alertas, sensores, zonas, operadores, eventos, búsqueda, filtro por estado, detalle seleccionado y log de actividad.',
    mustInclude: ['accesos', 'alertas', 'sensores', 'zonas', 'operadores', 'eventos', 'reportes'],
    folderAnyOf: ['safe-first-delivery-seguridad'],
    mustMention: ['panel de monitoreo'],
  },
  {
    key: 'ecommerce',
    label: 'Ecommerce',
    goal: 'Hacer un ecommerce con productos, carrito, órdenes, checkout simulado y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para ecommerce con catálogo, productos, carrito, checkout simulado, órdenes y reportes.',
    mustInclude: ['productos', 'carrito', 'checkout simulado', 'ordenes', 'reportes'],
    folderAnyOf: ['safe-first-delivery-ecommerce'],
  },
  {
    key: 'crm-escolar',
    label: 'CRM escolar',
    goal:
      'Hacer un CRM para escuelas con alumnos, familias, cursos, comunicaciones, seguimiento y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para un CRM escolar con alumnos, familias, cursos, comunicaciones, seguimiento y reportes.',
    mustInclude: ['alumnos', 'familias', 'cursos', 'comunicaciones', 'seguimiento', 'reportes'],
    folderAnyOf: ['safe-first-delivery-crm'],
  },
  {
    key: 'solicitudes',
    label: 'Solicitudes operativas',
    goal:
      'Hacer un sistema interno para gestionar solicitudes operativas, revisar estados, registrar observaciones y generar reportes simples.',
    context:
      'Quiero validar una primera entrega segura local y mock para solicitudes operativas con estados, observaciones, reportes, búsqueda, detalle seleccionado y acciones locales.',
    mustInclude: ['solicitudes', 'estados', 'observaciones', 'reportes'],
    folderAnyOf: ['safe-first-delivery-solicitudes'],
  },
  {
    key: 'reservas-canchas',
    label: 'Reservas de canchas',
    goal:
      'Hacer un sistema de reservas de canchas para gestionar canchas, horarios, reservas, clientes, disponibilidad y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para reservas de canchas con disponibilidad, horarios, reservas, clientes, reportes y acciones locales.',
    mustInclude: ['canchas', 'horarios', 'reservas', 'clientes', 'disponibilidad', 'reportes'],
    mustExclude: ['ecommerce', 'checkout', 'alumnos', 'familias', 'accesos', 'sensores', 'documentos', 'perfiles'],
    folderAnyOf: ['safe-first-delivery-reservas', 'safe-first-delivery-canchas'],
  },
]

function runCase(testCase) {
  const domainUnderstanding = buildDomainUnderstanding({
    goal: testCase.goal,
    context: testCase.context,
  })
  const productArchitecturePlan = buildProductArchitecturePlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
  })
  const safeFirstDeliveryPlan = buildSafeFirstDeliveryPlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
  })
  const materializePlan = buildMaterializeSafeFirstDeliveryPlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
  })

  const architecture = productArchitecturePlan?.productArchitecture || {}
  const safe = safeFirstDeliveryPlan?.safeFirstDeliveryPlan || {}
  const materialization = materializePlan?.safeFirstDeliveryMaterialization || {}
  const allowedTargetPaths = Array.isArray(materializePlan?.executionScope?.allowedTargetPaths)
    ? materializePlan.executionScope.allowedTargetPaths
    : []
  const folderName = allowedTargetPaths[0] || ''
  const aggregatedModules = [
    ...(domainUnderstanding?.primaryModules || []),
    ...(architecture.coreModules || []),
    ...(safe.modules || []),
    ...(materialization.modules || []),
  ]
  const aggregatedTexts = [
    ...(architecture.keyFlows || []),
    ...(safe.screens || []),
    ...(safe.localBehavior || []),
    ...(materialization.screens || []),
    ...(materialization.localActions || []),
  ]
  const failures = []

  if (!domainUnderstanding || !Array.isArray(domainUnderstanding.primaryModules)) {
    failures.push('No se pudo construir domainUnderstanding con primaryModules.')
  }

  if (!architecture || !Array.isArray(architecture.coreModules)) {
    failures.push('No se pudo construir productArchitecture con coreModules.')
  }

  if (!safe || !Array.isArray(safe.modules)) {
    failures.push('No se pudo construir safeFirstDeliveryPlan con modules.')
  }

  if (!materialization || !Array.isArray(materialization.modules)) {
    failures.push('No se pudo construir safeFirstDeliveryMaterialization con modules.')
  }

  for (const expected of testCase.mustInclude || []) {
    if (!listHasToken(aggregatedModules, expected)) {
      failures.push(`Falta incluir "${expected}" en los módulos agregados.`)
    }
  }

  for (const forbidden of testCase.mustExclude || []) {
    if (listHasToken(aggregatedModules, forbidden)) {
      failures.push(`No debía incluir "${forbidden}" en los módulos agregados.`)
    }
  }

  for (const expectedText of testCase.mustMention || []) {
    if (!listHasToken(aggregatedTexts, expectedText)) {
      failures.push(`Falta una señal textual compatible con "${expectedText}".`)
    }
  }

  if (!testCase.folderAnyOf.some((entry) => normalizePathForComparison(entry) === normalizePathForComparison(folderName))) {
    failures.push(
      `Folder inesperado. Esperado alguno de ${testCase.folderAnyOf.join(', ')}. Recibido: ${folderName || '(vacío)'}.`,
    )
  }

  const expectedAllowedTargetPaths = buildAllowedTargetPathsExpectation(folderName)
  const normalizedAllowed = allowedTargetPaths.map(normalizePathForComparison)
  const normalizedExpectedAllowed = expectedAllowedTargetPaths.map(normalizePathForComparison)

  if (
    normalizedAllowed.length !== normalizedExpectedAllowed.length ||
    normalizedAllowed.some((entry, index) => entry !== normalizedExpectedAllowed[index])
  ) {
    failures.push(
      `allowedTargetPaths inesperados. Esperado: ${normalizedExpectedAllowed.join(' | ')}. Recibido: ${normalizedAllowed.join(' | ') || '(vacío)'}.`,
    )
  }

  return {
    case: testCase,
    ok: failures.length === 0,
    failures,
    summary: {
      domainLabel: domainUnderstanding?.domainLabel || '',
      productKind: domainUnderstanding?.productKind || '',
      folderName,
      domainModules: domainUnderstanding?.primaryModules || [],
      architectureModules: architecture.coreModules || [],
      safeModules: safe.modules || [],
      materializeModules: materialization.modules || [],
    },
  }
}

const results = cases.map(runCase)
let failedCount = 0

console.log('AI Planner Smoke')
console.log('=================')

for (const result of results) {
  const { case: testCase, ok, failures, summary } = result
  console.log(`${ok ? 'PASS' : 'FAIL'} ${testCase.label}`)
  console.log(`- folder: ${summary.folderName || '(vacío)'}`)
  console.log(`- domain: ${summary.domainLabel || '(sin domainLabel)'}`)
  console.log(`- productKind: ${summary.productKind || '(sin productKind)'}`)
  console.log(`- domain modules: ${summary.domainModules.join(', ') || '(vacío)'}`)
  console.log(`- architecture modules: ${summary.architectureModules.join(', ') || '(vacío)'}`)
  console.log(`- safe modules: ${summary.safeModules.join(', ') || '(vacío)'}`)
  console.log(`- materialize modules: ${summary.materializeModules.join(', ') || '(vacío)'}`)

  if (!ok) {
    failedCount += 1
    failures.forEach((failure) => {
      console.log(`  expected/actual: ${failure}`)
    })
  }
}

console.log('-----------------')
console.log(
  failedCount === 0
    ? `OK. ${results.length}/${results.length} casos pasaron.`
    : `FAIL. ${failedCount}/${results.length} casos fallaron.`,
)

if (failedCount > 0) {
  process.exit(1)
}
