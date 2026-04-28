const fs = require('fs')
const path = require('path')

const LOCAL_MATERIALIZATION_PLAN_VERSION = 1
const VALID_OPERATION_TYPES = new Set([
  'create-folder',
  'create-file',
  'replace-file',
  'append-file',
])
const VALIDATION_TYPES = new Set(['exists', 'file-contains'])
const SAFE_FIRST_DELIVERY_REQUIRED_BASENAMES = [
  'index.html',
  'styles.css',
  'script.js',
  'mock-data.json',
]

function buildOutputPreview(text, maxLength = 240) {
  if (typeof text !== 'string') {
    return ''
  }

  const normalizedText = text.trim().replace(/\s+/g, ' ')

  if (!normalizedText) {
    return ''
  }

  return normalizedText.length > maxLength
    ? `${normalizedText.slice(0, Math.max(0, maxLength - 3))}...`
    : normalizedText
}

function summarizeUniquePaths(entries, limit = 200) {
  if (!Array.isArray(entries)) {
    return []
  }

  const uniqueEntries = []
  const seenEntries = new Set()

  for (const entry of entries) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }

    const trimmedEntry = path.normalize(entry.trim())
    const normalizedEntry = trimmedEntry.toLocaleLowerCase()

    if (seenEntries.has(normalizedEntry)) {
      continue
    }

    seenEntries.add(normalizedEntry)
    uniqueEntries.push(trimmedEntry)

    if (uniqueEntries.length >= limit) {
      break
    }
  }

  return uniqueEntries
}

function isPathInsideWorkspace(workspacePath, targetPath) {
  if (
    typeof workspacePath !== 'string' ||
    !workspacePath.trim() ||
    typeof targetPath !== 'string' ||
    !targetPath.trim()
  ) {
    return false
  }

  const relativePath = path.relative(
    path.resolve(workspacePath),
    path.resolve(targetPath),
  )

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  )
}

function resolveWorkspaceTarget(workspacePath, requestedTargetPath) {
  if (
    typeof workspacePath !== 'string' ||
    !workspacePath.trim() ||
    typeof requestedTargetPath !== 'string' ||
    !requestedTargetPath.trim()
  ) {
    return null
  }

  const resolvedWorkspacePath = path.resolve(workspacePath.trim())
  const normalizedTargetPath = requestedTargetPath.trim()
  const resolvedTargetPath = path.resolve(resolvedWorkspacePath, normalizedTargetPath)

  if (!isPathInsideWorkspace(resolvedWorkspacePath, resolvedTargetPath)) {
    return null
  }

  return {
    relativeTargetPath: path.relative(resolvedWorkspacePath, resolvedTargetPath) || '.',
    resolvedTargetPath,
  }
}

function normalizeOperationType(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (normalizedValue === 'create') {
    return 'create-file'
  }

  if (normalizedValue === 'replace' || normalizedValue === 'write-file') {
    return 'replace-file'
  }

  if (normalizedValue === 'append') {
    return 'append-file'
  }

  return VALID_OPERATION_TYPES.has(normalizedValue) ? normalizedValue : ''
}

function normalizePlanFileOperation(fileEntry) {
  if (!fileEntry || typeof fileEntry !== 'object') {
    return null
  }

  const targetPath =
    typeof fileEntry.targetPath === 'string' && fileEntry.targetPath.trim()
      ? fileEntry.targetPath.trim()
      : typeof fileEntry.path === 'string' && fileEntry.path.trim()
        ? fileEntry.path.trim()
        : ''

  if (!targetPath) {
    return null
  }

  const operationType =
    normalizeOperationType(fileEntry.operation || fileEntry.type || fileEntry.mode) ||
    'create-file'
  const content =
    typeof fileEntry.content === 'string'
      ? fileEntry.content
      : typeof fileEntry.nextContent === 'string'
        ? fileEntry.nextContent
        : typeof fileEntry.initialContent === 'string'
          ? fileEntry.initialContent
          : ''

  return {
    type: operationType,
    targetPath,
    ...(operationType === 'append-file'
      ? { appendContent: content }
      : operationType === 'replace-file'
        ? { nextContent: content }
        : { initialContent: content }),
  }
}

function normalizeValidationType(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (normalizedValue === 'contains' || normalizedValue === 'content-includes') {
    return 'file-contains'
  }

  return VALIDATION_TYPES.has(normalizedValue) ? normalizedValue : ''
}

function normalizeSafeFirstDeliveryText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
}

function slugifySafeFirstDeliveryValue(value) {
  return normalizeSafeFirstDeliveryText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toTitleCaseLabel(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .trim()
    .split(/\s+/)
    .map((token) =>
      token ? `${token.charAt(0).toLocaleUpperCase()}${token.slice(1)}` : '',
    )
    .join(' ')
}

function pushUniqueSafeFirstDeliveryValues(target, values, maxItems = 12) {
  if (!Array.isArray(target) || !Array.isArray(values)) {
    return target
  }

  const seenValues = new Set(
    target
      .filter((entry) => typeof entry === 'string' && entry.trim())
      .map((entry) => normalizeSafeFirstDeliveryText(entry)),
  )

  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) {
      continue
    }

    const normalizedValue = normalizeSafeFirstDeliveryText(value)

    if (!normalizedValue || seenValues.has(normalizedValue)) {
      continue
    }

    target.push(value.trim())
    seenValues.add(normalizedValue)

    if (target.length >= maxItems) {
      break
    }
  }

  return target
}

function splitPlannerDelimitedValues(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  const normalizedValue = value.trim()
  const separatorPattern = normalizedValue.includes('|')
    ? /\s*\|\s*/u
    : normalizedValue.includes(';')
      ? /\s*;\s*/u
      : null

  if (!separatorPattern) {
    return [normalizedValue]
  }

  return normalizedValue.split(separatorPattern).map((entry) => entry.trim()).filter(Boolean)
}

function extractPlannerLineValue(instruction, labels) {
  if (typeof instruction !== 'string' || !instruction.trim() || !Array.isArray(labels)) {
    return ''
  }

  const lines = instruction.split(/\r?\n/u)
  const normalizedLabels = labels
    .map((label) => normalizeSafeFirstDeliveryText(label))
    .filter(Boolean)

  for (const rawLine of lines) {
    const line = typeof rawLine === 'string' ? rawLine.trim() : ''

    if (!line) {
      continue
    }

    const normalizedLine = normalizeSafeFirstDeliveryText(line)

    for (const label of normalizedLabels) {
      const normalizedPrefix = `${label}:`

      if (normalizedLine.startsWith(normalizedPrefix)) {
        const separatorIndex = line.indexOf(':')

        if (separatorIndex >= 0) {
          return line.slice(separatorIndex + 1).trim()
        }
      }
    }
  }

  return ''
}

function extractPlannerList(instruction, labels, fallbackValues = []) {
  const directValues = splitPlannerDelimitedValues(extractPlannerLineValue(instruction, labels))

  if (directValues.length > 0) {
    return directValues
  }

  return Array.isArray(fallbackValues)
    ? fallbackValues
        .filter((entry) => typeof entry === 'string' && entry.trim())
        .map((entry) => entry.trim())
    : []
}

function stripSafeFirstDeliveryQuotes(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/^["']+|["']+$/g, '')
}

function detectSafeFirstDeliveryProductType(sourceText) {
  const normalizedText = normalizeSafeFirstDeliveryText(sourceText)

  if (
    /\b(?:ecommerce|tienda online|comercio online|catalogo|carrito|checkout|mercado pago|productos?)\b/u.test(
      normalizedText,
    )
  ) {
    return 'ecommerce'
  }

  if (
    /\b(?:crm|alumnos?|familias?|cursos?|comunicaciones?|seguimiento|reportes?)\b/u.test(
      normalizedText,
    )
  ) {
    return 'crm'
  }

  if (/\b(?:erp|aduana|despachantes?|operacion interna)\b/u.test(normalizedText)) {
    return 'erp'
  }

  if (/\bmarketplace\b/u.test(normalizedText)) {
    return 'marketplace'
  }

  if (/\bsaas\b/u.test(normalizedText)) {
    return 'saas'
  }

  if (/\b(?:turnos|clinicas?|salud)\b/u.test(normalizedText)) {
    return 'business-system'
  }

  return 'unknown'
}

function buildSafeFirstDeliveryProductLabel(productType) {
  switch (productType) {
    case 'ecommerce':
      return 'ecommerce'
    case 'crm':
      return 'crm'
    case 'erp':
      return 'erp'
    case 'marketplace':
      return 'marketplace'
    case 'saas':
      return 'saas'
    case 'business-system':
      return 'sistema de negocio'
    default:
      return 'producto'
  }
}

function inferSafeFirstDeliveryDomain({
  instruction,
  businessSector,
  businessSectorLabel,
  productType,
}) {
  const preferredDomain =
    typeof businessSectorLabel === 'string' && businessSectorLabel.trim()
      ? businessSectorLabel.trim()
      : typeof businessSector === 'string' && businessSector.trim()
        ? businessSector.trim().replace(/-/g, ' ')
        : ''

  if (preferredDomain) {
    return preferredDomain
  }

  const domainLine = extractPlannerLineValue(instruction, ['dominio', 'domain'])

  if (domainLine) {
    return domainLine
  }

  switch (productType) {
    case 'ecommerce':
      return 'comercio online'
    case 'crm':
      return 'gestion operativa'
    case 'erp':
      return 'operacion interna'
    case 'marketplace':
      return 'intermediacion digital'
    case 'saas':
      return 'servicio de software'
    case 'business-system':
      return 'flujo principal del negocio'
    default:
      return 'producto'
  }
}

function buildSafeFirstDeliveryPathSet(executionScope, instruction) {
  const allowedTargetPaths = summarizeUniquePaths(executionScope?.allowedTargetPaths, 20)
  const instructionAllowedTargetPaths = extractPlannerLineValue(instruction, [
    'allowedtargetpaths',
  ])
    .split(/\s*,\s*/u)
    .map((entry) => path.normalize(stripSafeFirstDeliveryQuotes(entry)))
    .filter(Boolean)
  const pathCandidates = summarizeUniquePaths(
    [...allowedTargetPaths, ...instructionAllowedTargetPaths],
    24,
  )

  if (pathCandidates.length === 0) {
    return null
  }

  const requiredFiles = new Map()

  pathCandidates.forEach((entry) => {
    const normalizedEntry = path.normalize(entry.trim())
    const basename = path.basename(normalizedEntry).toLocaleLowerCase()

    if (SAFE_FIRST_DELIVERY_REQUIRED_BASENAMES.includes(basename)) {
      requiredFiles.set(basename, normalizedEntry)
    }
  })

  const indexPath = requiredFiles.get('index.html')
  const targetFolderPathFromIndex = indexPath ? path.dirname(indexPath) : ''

  if (targetFolderPathFromIndex && typeof instruction === 'string' && instruction.trim()) {
    const normalizedInstruction = normalizeSafeFirstDeliveryText(instruction)

    SAFE_FIRST_DELIVERY_REQUIRED_BASENAMES.forEach((basename) => {
      if (
        requiredFiles.has(basename) ||
        !normalizedInstruction.includes(basename.toLocaleLowerCase())
      ) {
        return
      }

      requiredFiles.set(basename, path.join(targetFolderPathFromIndex, basename))
    })
  }

  if (requiredFiles.size !== SAFE_FIRST_DELIVERY_REQUIRED_BASENAMES.length || !indexPath) {
    return null
  }

  const stylesPath = requiredFiles.get('styles.css')
  const scriptPath = requiredFiles.get('script.js')
  const mockDataPath = requiredFiles.get('mock-data.json')
  const targetFolderPath = path.dirname(indexPath)

  if (
    !targetFolderPath ||
    path.dirname(stylesPath) !== targetFolderPath ||
    path.dirname(scriptPath) !== targetFolderPath ||
    path.dirname(mockDataPath) !== targetFolderPath
  ) {
    return null
  }

  const declaredFolderPath =
    pathCandidates.find((entry) => path.normalize(entry.trim()) === targetFolderPath) || ''

  return {
    targetFolderPath,
    declaredFolderPath: declaredFolderPath || targetFolderPath,
    indexPath,
    stylesPath,
    scriptPath,
    mockDataPath,
  }
}

function buildModuleCollectionKey(moduleLabel) {
  const normalizedLabel = normalizeSafeFirstDeliveryText(moduleLabel)

  if (!normalizedLabel) {
    return 'resumen'
  }

  if (/\b(?:catalogo|productos?)\b/u.test(normalizedLabel)) {
    return 'productos'
  }

  if (/\b(?:detalle de producto|detalle principal)\b/u.test(normalizedLabel)) {
    return 'productos'
  }

  if (/\bcarrito\b/u.test(normalizedLabel)) {
    return 'carrito'
  }

  if (/\b(?:checkout|ordenes?|pedidos?)\b/u.test(normalizedLabel)) {
    return 'ordenes'
  }

  if (/\b(?:backoffice|panel administrativo|panel operativo)\b/u.test(normalizedLabel)) {
    return 'operacion'
  }

  if (/\balumnos?\b/u.test(normalizedLabel)) {
    return 'alumnos'
  }

  if (/\bfamilias?\b/u.test(normalizedLabel)) {
    return 'familias'
  }

  if (/\bcursos?\b/u.test(normalizedLabel)) {
    return 'cursos'
  }

  if (/\bcomunicaciones?\b/u.test(normalizedLabel)) {
    return 'comunicaciones'
  }

  if (/\bseguimiento\b/u.test(normalizedLabel)) {
    return 'seguimientos'
  }

  if (/\breportes?\b/u.test(normalizedLabel)) {
    return 'reportes'
  }

  if (/\busuarios?\b|\broles?\b|\bpermisos?\b/u.test(normalizedLabel)) {
    return 'accesos'
  }

  return slugifySafeFirstDeliveryValue(moduleLabel) || 'resumen'
}

function buildSafeFirstDeliveryModules({ modules, screens, localBehavior }) {
  const normalizedModules = Array.isArray(modules) ? modules : []
  const normalizedScreens = Array.isArray(screens) ? screens : []
  const normalizedBehavior = Array.isArray(localBehavior) ? localBehavior : []

  return normalizedModules.map((moduleLabel, index) => {
    const screenLabel = normalizedScreens[index] || normalizedScreens[0] || 'Vista principal'
    const behaviorLabel =
      normalizedBehavior[index] ||
      normalizedBehavior.find((entry) => typeof entry === 'string' && entry.trim()) ||
      'Recorrido local con datos mock.'
    const collectionKey = buildModuleCollectionKey(moduleLabel)
    const id = slugifySafeFirstDeliveryValue(moduleLabel) || `modulo-${index + 1}`

    return {
      id,
      title: moduleLabel,
      summary: `Vista prioritaria: ${screenLabel}. ${behaviorLabel}`,
      screen: screenLabel,
      collectionKey,
    }
  })
}

function buildSafeFirstDeliveryGenericRecords(title, count = 3) {
  return Array.from({ length: count }, (_entry, index) => ({
    id: `${slugifySafeFirstDeliveryValue(title) || 'item'}-${index + 1}`,
    nombre: `${toTitleCaseLabel(title)} ${index + 1}`,
    estado: index === 0 ? 'listo para demo' : index === 1 ? 'en revision' : 'pendiente',
    resumen: `Dato mock preparado para ${title.toLocaleLowerCase()}.`,
  }))
}

function buildSafeFirstDeliveryMockCollections({
  productType,
  domain,
  sourceText,
  modules,
}) {
  const normalizedText = normalizeSafeFirstDeliveryText(sourceText)
  const normalizedDomain = normalizeSafeFirstDeliveryText(domain)
  const moduleLabels = Array.isArray(modules) ? modules : []
  const collections = {}

  if (productType === 'ecommerce') {
    collections.productos = [
      {
        id: 'prod-1',
        nombre: 'Campera Urbana',
        categoria: 'Abrigos',
        precio: 89500,
        stock: 12,
        estado: 'publicado',
        resumen: 'Prenda destacada para la portada del catalogo.',
      },
      {
        id: 'prod-2',
        nombre: 'Zapatilla Nova',
        categoria: 'Calzado',
        precio: 112000,
        stock: 8,
        estado: 'publicado',
        resumen: 'Producto de alta rotacion para validar carrito y checkout.',
      },
      {
        id: 'prod-3',
        nombre: 'Mochila Atlas',
        categoria: 'Accesorios',
        precio: 64900,
        stock: 15,
        estado: 'borrador',
        resumen: 'Item editable desde el backoffice mock.',
      },
    ]
    collections.carrito = []
    collections.ordenes = [
      {
        id: 'ord-1001',
        cliente: 'Compra demo',
        total: 201500,
        estado: 'simulada',
        resumen: 'Orden local creada sin pagos reales ni webhooks.',
      },
    ]
    collections.operacion = [
      {
        id: 'op-1',
        nombre: 'Alta de producto mock',
        estado: 'lista',
        resumen: 'Permite revisar la gestion basica del catalogo.',
      },
      {
        id: 'op-2',
        nombre: 'Revision de orden simulada',
        estado: 'lista',
        resumen: 'Expone la lectura operativa sin credenciales ni integraciones.',
      },
    ]
    return collections
  }

  if (
    productType === 'crm' &&
    /\bescuel|\balumnos?\b|\bfamilias?\b|\bcursos?\b/u.test(
      `${normalizedText} ${normalizedDomain}`,
    )
  ) {
    collections.alumnos = [
      {
        id: 'alu-1',
        nombre: 'Sofia Rojas',
        curso: '2A',
        estado: 'regular',
        resumen: 'Ficha mock para revisar seguimiento academico.',
      },
      {
        id: 'alu-2',
        nombre: 'Tomas Diaz',
        curso: '3B',
        estado: 'alerta',
        resumen: 'Caso con seguimiento pendiente y comunicacion asociada.',
      },
      {
        id: 'alu-3',
        nombre: 'Valentina Perez',
        curso: '1C',
        estado: 'regular',
        resumen: 'Registro inicial para probar listados y filtros mock.',
      },
    ]
    collections.familias = [
      {
        id: 'fam-1',
        nombre: 'Familia Rojas',
        contacto: 'Contacto mock 1',
        estado: 'al dia',
      },
      {
        id: 'fam-2',
        nombre: 'Familia Diaz',
        contacto: 'Contacto mock 2',
        estado: 'requiere seguimiento',
      },
    ]
    collections.cursos = [
      { id: 'cur-1', nombre: '2A', tutor: 'Docente mock', estado: 'activo' },
      { id: 'cur-2', nombre: '3B', tutor: 'Docente mock', estado: 'activo' },
    ]
    collections.comunicaciones = [
      {
        id: 'com-1',
        nombre: 'Aviso de reunion',
        canal: 'mail mock',
        estado: 'borrador',
      },
      {
        id: 'com-2',
        nombre: 'Seguimiento de asistencia',
        canal: 'mensaje interno mock',
        estado: 'pendiente',
      },
    ]
    collections.seguimientos = [
      {
        id: 'seg-1',
        nombre: 'Seguimiento asistencia Tomas Diaz',
        responsable: 'Preceptoria mock',
        estado: 'en curso',
      },
    ]
    collections.reportes = [
      {
        id: 'rep-1',
        nombre: 'Resumen de alertas por curso',
        estado: 'listo para revision',
      },
    ]
    collections.operacion = [
      {
        id: 'op-1',
        nombre: 'Panel de seguimiento diario',
        estado: 'listo',
        resumen: 'Vista operativa inicial sin datos sensibles reales.',
      },
    ]
    return collections
  }

  moduleLabels.forEach((moduleLabel) => {
    const collectionKey = buildModuleCollectionKey(moduleLabel)

    if (!collections[collectionKey]) {
      collections[collectionKey] = buildSafeFirstDeliveryGenericRecords(moduleLabel)
    }
  })

  if (!collections.operacion) {
    collections.operacion = [
      {
        id: 'op-1',
        nombre: `Panel inicial de ${domain}`,
        estado: 'listo para demo',
        resumen: 'Base local para revisar el flujo principal sin integraciones reales.',
      },
    ]
  }

  return collections
}

function buildSafeFirstDeliveryMockData({
  productType,
  domain,
  modules,
  screens,
  scope,
  localBehavior,
  mockDataHints,
  explicitExclusions,
  successCriteria,
}) {
  const normalizedModules = Array.isArray(modules) ? modules : []
  const normalizedScreens = Array.isArray(screens) ? screens : []
  const normalizedScope = Array.isArray(scope) ? scope : []
  const normalizedBehavior = Array.isArray(localBehavior) ? localBehavior : []
  const normalizedMockDataHints = Array.isArray(mockDataHints) ? mockDataHints : []
  const normalizedExclusions = Array.isArray(explicitExclusions) ? explicitExclusions : []
  const normalizedSuccessCriteria = Array.isArray(successCriteria) ? successCriteria : []
  const sourceText = [
    productType,
    domain,
    ...normalizedModules,
    ...normalizedScreens,
    ...normalizedScope,
    ...normalizedBehavior,
    ...normalizedMockDataHints,
  ].join(' ')
  const collections = buildSafeFirstDeliveryMockCollections({
    productType,
    domain,
    sourceText,
    modules: normalizedModules,
  })

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      productType,
      productLabel: buildSafeFirstDeliveryProductLabel(productType),
      domain,
      scope: normalizedScope,
      screens: normalizedScreens,
      mockDataHints: normalizedMockDataHints,
      localBehavior: normalizedBehavior,
      explicitExclusions: normalizedExclusions,
      successCriteria: normalizedSuccessCriteria,
    },
    modules: buildSafeFirstDeliveryModules({
      modules: normalizedModules,
      screens: normalizedScreens,
      localBehavior: normalizedBehavior,
    }),
    collections,
  }
}

function buildSafeFirstDeliveryIndexHtml() {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Primera entrega segura</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Primera entrega local mock</p>
          <h1 id="app-title">Cargando plan seguro...</h1>
          <p id="app-subtitle" class="subtitle"></p>
        </div>
        <div class="hero-note">
          <span class="badge">Sin integraciones reales</span>
          <span class="badge">Datos mock editables</span>
        </div>
      </header>

      <main class="layout">
        <section class="main-column">
          <section class="panel">
            <div class="panel-header">
              <h2>Recorrido principal</h2>
              <p id="plan-summary" class="panel-copy"></p>
            </div>
            <nav id="module-nav" class="module-nav" aria-label="Modulos principales"></nav>
            <div id="module-content" class="module-content"></div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <h2>Datos mock y estados locales</h2>
              <p class="panel-copy">
                La interfaz funciona localmente y usa una base mock preparada para demo.
              </p>
            </div>
            <div id="dataset-overview" class="data-grid"></div>
          </section>
        </section>

        <aside class="side-column">
          <section class="panel compact">
            <h2>Alcance</h2>
            <ul id="scope-list" class="bullet-list"></ul>
          </section>

          <section class="panel compact">
            <h2>Exclusiones explicitas</h2>
            <ul id="exclusions-list" class="bullet-list bullet-warning"></ul>
          </section>

          <section class="panel compact">
            <h2>Proximos pasos</h2>
            <ul id="next-steps-list" class="bullet-list"></ul>
          </section>

          <section class="panel compact">
            <h2>Aprobaciones futuras</h2>
            <ul id="approval-list" class="bullet-list"></ul>
          </section>
        </aside>
      </main>
    </div>

    <script src="./script.js"></script>
  </body>
</html>
`
}

function buildSafeFirstDeliveryStylesCss() {
  return `:root {
  color-scheme: light;
  --bg: #f4efe7;
  --panel: rgba(255, 255, 255, 0.88);
  --panel-border: rgba(40, 53, 71, 0.12);
  --ink: #142033;
  --muted: #566276;
  --accent: #b35c2e;
  --accent-soft: #f8dfd0;
  --success: #1f7a50;
  --warning: #a64b2a;
  --shadow: 0 22px 50px rgba(18, 27, 38, 0.12);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(227, 201, 181, 0.7), transparent 28%),
    linear-gradient(180deg, #f7f2ea 0%, #f1eee8 44%, #ece8df 100%);
  color: var(--ink);
}

.shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.76rem;
  color: var(--accent);
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
}

.subtitle {
  margin: 10px 0 0;
  color: var(--muted);
  max-width: 780px;
  line-height: 1.6;
}

.hero-note {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(20, 32, 51, 0.08);
  color: var(--ink);
  font-size: 0.92rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 20px;
}

.main-column,
.side-column {
  display: grid;
  gap: 20px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 24px;
  padding: 22px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.panel.compact {
  padding: 18px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.panel h2 {
  margin: 0 0 10px;
  font-size: 1.15rem;
}

.panel-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.module-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.module-button {
  border: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(20, 32, 51, 0.07);
  color: var(--ink);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.module-button:hover,
.module-button[aria-current="true"] {
  background: var(--accent-soft);
  transform: translateY(-1px);
}

.module-content {
  display: grid;
  gap: 18px;
}

.callout-grid,
.data-grid,
.record-grid,
.stats-grid {
  display: grid;
  gap: 12px;
}

.callout-grid,
.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.record-grid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.card,
.record-card {
  border: 1px solid rgba(20, 32, 51, 0.1);
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
}

.record-card h3,
.card h3 {
  margin: 0 0 8px;
  font-size: 1rem;
}

.muted {
  color: var(--muted);
}

.record-meta,
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 0;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(179, 92, 46, 0.12);
  color: var(--accent);
  font-size: 0.85rem;
}

.bullet-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
  color: var(--muted);
}

.bullet-warning li {
  color: var(--warning);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button {
  border: 0;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--ink);
  color: white;
}

.button.secondary {
  background: rgba(20, 32, 51, 0.08);
  color: var(--ink);
}

.status-inline {
  color: var(--success);
  font-weight: 600;
}

.empty-state {
  padding: 14px;
  border-radius: 18px;
  background: rgba(20, 32, 51, 0.05);
  color: var(--muted);
}

@media (max-width: 920px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
  }

  .hero-note {
    justify-content: flex-start;
  }
}
`
}

function buildSafeFirstDeliveryScriptJs(mockDataObject) {
  const serializedFallbackData = JSON.stringify(mockDataObject, null, 2)

  return `const fallbackData = ${serializedFallbackData};

const state = {
  data: fallbackData,
  activeModuleId: fallbackData.modules[0]?.id || '',
  cartItems: [],
  localLog: ['Base mock local lista para revision.'],
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

async function loadLocalData() {
  try {
    const response = await fetch('./mock-data.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('No se pudo leer mock-data.json');
    }

    const payload = await response.json();

    if (payload && typeof payload === 'object') {
      state.data = payload;
      state.activeModuleId = payload.modules?.[0]?.id || state.activeModuleId;
      state.localLog.unshift('Se cargo mock-data.json como fuente principal.');
    }
  } catch (error) {
    state.localLog.unshift('Se uso la base embedida porque mock-data.json no pudo cargarse por apertura local.');
  }
}

function getCollection(collectionKey) {
  const collections = state.data?.collections && typeof state.data.collections === 'object'
    ? state.data.collections
    : {};

  return Array.isArray(collections[collectionKey]) ? collections[collectionKey] : [];
}

function updateTitle() {
  const meta = state.data.meta || {};
  const titleNode = document.getElementById('app-title');
  const subtitleNode = document.getElementById('app-subtitle');
  const summaryNode = document.getElementById('plan-summary');

  titleNode.textContent = 'Primera entrega segura de ' + (meta.domain || meta.productLabel || 'producto');
  subtitleNode.textContent =
    'Este mock local representa una primera fase navegable de ' +
    (meta.productLabel || 'producto') +
    ' y funciona sin pagos reales, credenciales ni integraciones externas.';
  summaryNode.textContent =
    (meta.scope?.[0] || 'Se priorizo un flujo principal revisable con datos mock.') +
    ' Todo queda acotado a archivos locales.';
}

function renderList(nodeId, values, fallbackText) {
  const node = document.getElementById(nodeId);
  node.innerHTML = '';
  const entries = Array.isArray(values) ? values.filter(Boolean) : [];

  if (entries.length === 0) {
    const li = document.createElement('li');
    li.textContent = fallbackText;
    node.appendChild(li);
    return;
  }

  entries.forEach((value) => {
    const li = document.createElement('li');
    li.textContent = value;
    node.appendChild(li);
  });
}

function renderModuleNav() {
  const container = document.getElementById('module-nav');
  const modules = Array.isArray(state.data.modules) ? state.data.modules : [];
  container.innerHTML = '';

  modules.forEach((module) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'module-button';
    button.textContent = module.title;
    button.setAttribute('aria-current', state.activeModuleId === module.id ? 'true' : 'false');
    button.addEventListener('click', () => {
      state.activeModuleId = module.id;
      renderModuleNav();
      renderActiveModule();
    });
    container.appendChild(button);
  });
}

function addCartItem(product) {
  const existingItem = state.cartItems.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.cantidad += 1;
  } else {
    state.cartItems.push({
      id: product.id,
      nombre: product.nombre,
      precio: Number(product.precio) || 0,
      cantidad: 1,
    });
  }

  state.localLog.unshift('Se agrego "' + product.nombre + '" al carrito local.');
  renderActiveModule();
  renderDatasetOverview();
}

function removeCartItem(productId) {
  state.cartItems = state.cartItems.filter((item) => item.id !== productId);
  state.localLog.unshift('Se actualizo el carrito local.');
  renderActiveModule();
  renderDatasetOverview();
}

function simulateCheckout() {
  if (state.cartItems.length === 0) {
    state.localLog.unshift('No hay productos en el carrito para simular checkout.');
    renderDatasetOverview();
    return;
  }

  const total = state.cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const orderCollection = getCollection('ordenes');
  orderCollection.unshift({
    id: 'ord-local-' + Date.now(),
    cliente: 'Compra demo local',
    total,
    estado: 'simulada',
    resumen: 'Orden creada localmente sin pagos reales ni webhooks.',
  });
  state.data.collections.ordenes = orderCollection;
  state.cartItems = [];
  state.localLog.unshift('Se genero una orden simulada sin usar pagos reales.');
  renderActiveModule();
  renderDatasetOverview();
}

function toggleFirstRecordState(collectionKey) {
  const collection = getCollection(collectionKey);

  if (collection.length === 0) {
    return;
  }

  const firstRecord = collection[0];
  firstRecord.estado =
    firstRecord.estado === 'listo para demo'
      ? 'en revision'
      : firstRecord.estado === 'en revision'
        ? 'aprobado mock'
        : 'listo para demo';
  state.localLog.unshift('Se actualizo el estado local de "' + (firstRecord.nombre || firstRecord.id) + '".');
  renderActiveModule();
  renderDatasetOverview();
}

function renderRecordCard(record, options = {}) {
  const card = document.createElement('article');
  card.className = 'record-card';
  const title = document.createElement('h3');
  title.textContent = record.nombre || record.id || 'Registro mock';
  card.appendChild(title);

  if (record.resumen) {
    const summary = document.createElement('p');
    summary.className = 'muted';
    summary.textContent = record.resumen;
    card.appendChild(summary);
  }

  const meta = document.createElement('div');
  meta.className = 'record-meta';
  Object.entries(record).forEach(([key, value]) => {
    if (['id', 'nombre', 'resumen'].includes(key) || value === undefined || value === null || value === '') {
      return;
    }

    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = key + ': ' + (typeof value === 'number' && key === 'precio'
      ? currencyFormatter.format(value)
      : String(value));
    meta.appendChild(span);
  });
  card.appendChild(meta);

  if (typeof options.onPrimaryAction === 'function') {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button';
    button.textContent = options.primaryLabel || 'Accion local';
    button.addEventListener('click', () => options.onPrimaryAction(record));
    toolbar.appendChild(button);
    card.appendChild(toolbar);
  }

  return card;
}

function renderCartPanel(container) {
  const panel = document.createElement('div');
  panel.className = 'card';
  const title = document.createElement('h3');
  title.textContent = 'Carrito local';
  panel.appendChild(title);

  if (state.cartItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Todavia no hay productos en el carrito local.';
    panel.appendChild(empty);
    container.appendChild(panel);
    return;
  }

  const list = document.createElement('div');
  list.className = 'record-grid';

  state.cartItems.forEach((item) => {
    list.appendChild(
      renderRecordCard(item, {
        primaryLabel: 'Quitar',
        onPrimaryAction: () => removeCartItem(item.id),
      }),
    );
  });

  panel.appendChild(list);
  const total = document.createElement('p');
  total.className = 'status-inline';
  total.textContent =
    'Subtotal local: ' +
    currencyFormatter.format(
      state.cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    );
  panel.appendChild(total);
  container.appendChild(panel);
}

function renderActiveModule() {
  const container = document.getElementById('module-content');
  container.innerHTML = '';
  const modules = Array.isArray(state.data.modules) ? state.data.modules : [];
  const activeModule =
    modules.find((module) => module.id === state.activeModuleId) || modules[0];

  if (!activeModule) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No hay modulos disponibles para esta primera entrega.';
    container.appendChild(empty);
    return;
  }

  const headerStats = document.createElement('div');
  headerStats.className = 'callout-grid';
  [activeModule.screen, activeModule.collectionKey, state.data.meta?.productLabel || 'producto'].forEach((value, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = index === 0 ? 'Vista' : index === 1 ? 'Fuente mock' : 'Tipo';
    const detail = document.createElement('p');
    detail.className = 'muted';
    detail.textContent = value;
    card.appendChild(title);
    card.appendChild(detail);
    headerStats.appendChild(card);
  });
  container.appendChild(headerStats);

  const intro = document.createElement('div');
  intro.className = 'card';
  intro.innerHTML =
    '<h3>' + activeModule.title + '</h3>' +
    '<p class="muted">' + activeModule.summary + '</p>';
  container.appendChild(intro);

  const records = getCollection(activeModule.collectionKey);
  const recordsGrid = document.createElement('div');
  recordsGrid.className = 'record-grid';

  if (records.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Este modulo se apoya en estados locales y no necesita una coleccion propia para la demo.';
    container.appendChild(empty);
  } else {
    records.forEach((record) => {
      if (activeModule.collectionKey === 'productos') {
        recordsGrid.appendChild(
          renderRecordCard(record, {
            primaryLabel: 'Agregar al carrito',
            onPrimaryAction: addCartItem,
          }),
        );
        return;
      }

      recordsGrid.appendChild(renderRecordCard(record));
    });

    container.appendChild(recordsGrid);
  }

  if (activeModule.collectionKey === 'carrito' || activeModule.collectionKey === 'productos') {
    renderCartPanel(container);
  }

  if (activeModule.collectionKey === 'ordenes') {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    const simulateButton = document.createElement('button');
    simulateButton.type = 'button';
    simulateButton.className = 'button';
    simulateButton.textContent = 'Simular checkout';
    simulateButton.addEventListener('click', simulateCheckout);
    toolbar.appendChild(simulateButton);
    container.appendChild(toolbar);
  } else {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    const updateButton = document.createElement('button');
    updateButton.type = 'button';
    updateButton.className = 'button secondary';
    updateButton.textContent = 'Actualizar estado mock';
    updateButton.addEventListener('click', () => toggleFirstRecordState(activeModule.collectionKey));
    toolbar.appendChild(updateButton);
    container.appendChild(toolbar);
  }
}

function renderDatasetOverview() {
  const container = document.getElementById('dataset-overview');
  container.innerHTML = '';
  const collections = state.data.collections || {};

  Object.entries(collections).forEach(([key, value]) => {
    const count = Array.isArray(value) ? value.length : 0;
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = toTitleCaseLabel(key.replace(/-/g, ' '));
    const detail = document.createElement('p');
    detail.className = 'muted';
    detail.textContent = count + ' registro(s) mock disponibles.';
    card.appendChild(title);
    card.appendChild(detail);
    container.appendChild(card);
  });

  const cartCard = document.createElement('div');
  cartCard.className = 'card';
  cartCard.innerHTML =
    '<h3>Estado local</h3>' +
    '<p class="muted">' +
    (state.localLog[0] || 'Sin eventos todavia.') +
    '</p>';
  container.appendChild(cartCard);
}

function renderStaticLists() {
  const meta = state.data.meta || {};
  renderList('scope-list', meta.scope, 'Sin alcance detallado.');
  renderList('exclusions-list', meta.explicitExclusions, 'Sin exclusiones definidas.');
  renderList(
    'next-steps-list',
    meta.successCriteria,
    'La siguiente fase requiere aprobacion manual antes de integrar servicios reales.',
  );

  const approvals = []
  meta.explicitExclusions?.forEach((entry) => {
    if (/pagos?/i.test(entry)) {
      approvals.push('Aprobar pagos reales y pasarela de cobro antes de salir del mock.');
    } else if (/credenciales|secretos?/i.test(entry)) {
      approvals.push('Aprobar credenciales y configuracion segura antes de integrar servicios.');
    } else if (/auth|autenticacion/i.test(entry)) {
      approvals.push('Definir autenticacion real y permisos finos antes de publicar.');
    } else if (/base de datos|migraciones?/i.test(entry)) {
      approvals.push('Aprobar persistencia real y migraciones antes de pasar a datos productivos.');
    } else if (/integraciones?|webhooks?/i.test(entry)) {
      approvals.push('Validar integraciones reales y webhooks antes de conectarse con terceros.');
    }
  });
  renderList('approval-list', approvals, 'Las aprobaciones futuras apareceran cuando se definan integraciones reales.');
}

async function bootstrap() {
  await loadLocalData();
  updateTitle();
  renderModuleNav();
  renderActiveModule();
  renderDatasetOverview();
  renderStaticLists();
}

bootstrap();
`
}

function buildGenericSafeFirstDeliveryMaterializationPlan({
  decisionKey,
  instruction,
  executionScope,
  businessSector,
  businessSectorLabel,
}) {
  if (
    typeof decisionKey !== 'string' ||
    decisionKey.trim().toLocaleLowerCase() !== 'materialize-safe-first-delivery-plan'
  ) {
    return null
  }

  if (typeof instruction !== 'string' || !instruction.trim()) {
    return null
  }

  const pathSet = buildSafeFirstDeliveryPathSet(executionScope, instruction)

  if (!pathSet) {
    return null
  }

  const combinedText = [
    instruction,
    businessSector,
    businessSectorLabel,
    ...(Array.isArray(executionScope?.successCriteria) ? executionScope.successCriteria : []),
  ]
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .join(' ')
  const productType = detectSafeFirstDeliveryProductType(combinedText)
  const domain = inferSafeFirstDeliveryDomain({
    instruction,
    businessSector,
    businessSectorLabel,
    productType,
  })
  const scope = extractPlannerList(instruction, ['alcance funcional', 'alcance'], [
    `Primera entrega segura y navegable para ${domain}.`,
  ])
  const modules = extractPlannerList(instruction, ['modulos a cubrir', 'modulos'], [
    'modulo principal',
    'panel operativo inicial',
  ])
  const screens = extractPlannerList(instruction, ['pantallas o vistas', 'pantallas', 'vistas'], [
    'vista principal',
    'panel operativo inicial',
  ])
  const mockDataHints = extractPlannerList(
    instruction,
    ['datos mock requeridos', 'datos mock', 'datos de muestra'],
    ['Datos de ejemplo consistentes para recorrer el flujo principal.'],
  )
  const localBehavior = extractPlannerList(
    instruction,
    ['comportamiento local esperado', 'comportamiento local'],
    ['Navegacion local entre vistas priorizadas con estado temporal.'],
  )
  const explicitExclusions = extractPlannerList(
    instruction,
    ['excluir explicitamente', 'exclusiones explicitas', 'exclusiones'],
    [
      'Pagos reales.',
      'Credenciales reales.',
      'Webhooks reales.',
      'Deploy.',
      'Migraciones.',
      'Auth real.',
      'Base de datos real.',
      'Integraciones externas reales.',
    ],
  )
  const successCriteria = extractPlannerList(
    instruction,
    ['successcriteria', 'success criteria', 'criterios de exito'],
    Array.isArray(executionScope?.successCriteria) ? executionScope.successCriteria : [],
  )
  const mockDataObject = buildSafeFirstDeliveryMockData({
    productType,
    domain,
    modules,
    screens,
    scope,
    localBehavior,
    mockDataHints,
    explicitExclusions,
    successCriteria,
  })
  const indexContent = buildSafeFirstDeliveryIndexHtml()
  const stylesContent = buildSafeFirstDeliveryStylesCss()
  const scriptContent = buildSafeFirstDeliveryScriptJs(mockDataObject)
  const mockDataContent = `${JSON.stringify(mockDataObject, null, 2)}\n`
  const targetFolderLabel =
    pathSet.declaredFolderPath === '.'
      ? 'workspace'
      : pathSet.declaredFolderPath

  return {
    version: LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind: 'safe-first-delivery-materialization',
    summary: `Primera entrega segura local materializada en "${targetFolderLabel}".`,
    strategy: 'materialize-safe-first-delivery-plan',
    reasoningLayer: 'local-rules',
    materializationLayer: 'local-deterministic',
    operations: [
      { type: 'create-folder', targetPath: pathSet.declaredFolderPath },
      {
        type: 'replace-file',
        targetPath: pathSet.indexPath,
        nextContent: indexContent,
      },
      {
        type: 'replace-file',
        targetPath: pathSet.stylesPath,
        nextContent: stylesContent,
      },
      {
        type: 'replace-file',
        targetPath: pathSet.scriptPath,
        nextContent: scriptContent,
      },
      {
        type: 'replace-file',
        targetPath: pathSet.mockDataPath,
        nextContent: mockDataContent,
      },
    ],
    validations: [
      {
        type: 'exists',
        targetPath: pathSet.declaredFolderPath,
        expectedKind: 'folder',
      },
      {
        type: 'exists',
        targetPath: pathSet.indexPath,
        expectedKind: 'file',
      },
      {
        type: 'exists',
        targetPath: pathSet.stylesPath,
        expectedKind: 'file',
      },
      {
        type: 'exists',
        targetPath: pathSet.scriptPath,
        expectedKind: 'file',
      },
      {
        type: 'exists',
        targetPath: pathSet.mockDataPath,
        expectedKind: 'file',
      },
      {
        type: 'file-contains',
        targetPath: pathSet.indexPath,
        expectedText: './styles.css',
      },
      {
        type: 'file-contains',
        targetPath: pathSet.indexPath,
        expectedText: './script.js',
      },
      {
        type: 'file-contains',
        targetPath: pathSet.scriptPath,
        expectedText: './mock-data.json',
      },
      {
        type: 'file-contains',
        targetPath: pathSet.mockDataPath,
        expectedText: '"meta"',
      },
    ],
  }
}

function normalizePlanValidation(validationEntry) {
  if (!validationEntry || typeof validationEntry !== 'object') {
    return null
  }

  const type = normalizeValidationType(validationEntry.type)
  const targetPath =
    typeof validationEntry.targetPath === 'string' && validationEntry.targetPath.trim()
      ? validationEntry.targetPath.trim()
      : typeof validationEntry.path === 'string' && validationEntry.path.trim()
        ? validationEntry.path.trim()
        : ''

  if (!type || !targetPath) {
    return null
  }

  return {
    type,
    targetPath,
    ...(type === 'exists'
      ? {
          expectedKind:
            validationEntry.expectedKind === 'folder' ||
            validationEntry.expectedKind === 'file'
              ? validationEntry.expectedKind
              : validationEntry.kind === 'folder' || validationEntry.kind === 'file'
                ? validationEntry.kind
                : undefined,
        }
      : {}),
    ...(type === 'file-contains' &&
    typeof validationEntry.expectedText === 'string' &&
    validationEntry.expectedText
      ? { expectedText: validationEntry.expectedText }
      : type === 'file-contains' &&
          typeof validationEntry.contains === 'string' &&
          validationEntry.contains
        ? { expectedText: validationEntry.contains }
        : {}),
  }
}

function normalizeMaterializationPlan(plan) {
  if (!plan || typeof plan !== 'object') {
    return null
  }

  const normalizedFolders = []
  const folderCandidates = [
    ...(Array.isArray(plan.folders) ? plan.folders : []),
    ...(Array.isArray(plan.directories) ? plan.directories : []),
    ...(Array.isArray(plan.foldersToCreate) ? plan.foldersToCreate : []),
  ]

  folderCandidates.forEach((entry) => {
    const targetPath =
      typeof entry === 'string'
        ? entry.trim()
        : entry && typeof entry === 'object' && typeof entry.targetPath === 'string'
          ? entry.targetPath.trim()
          : entry && typeof entry === 'object' && typeof entry.path === 'string'
            ? entry.path.trim()
            : ''

    if (!targetPath) {
      return
    }

    normalizedFolders.push({
      type: 'create-folder',
      targetPath,
    })
  })

  const normalizedOperations = [
    ...(Array.isArray(plan.operations)
      ? plan.operations
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null
            }

            const type = normalizeOperationType(entry.type || entry.operation || entry.mode)
            const targetPath =
              typeof entry.targetPath === 'string' && entry.targetPath.trim()
                ? entry.targetPath.trim()
                : typeof entry.path === 'string' && entry.path.trim()
                  ? entry.path.trim()
                  : ''

            if (!type || !targetPath) {
              return null
            }

            return {
              type,
              targetPath,
              ...(type === 'append-file'
                ? {
                    appendContent:
                      typeof entry.appendContent === 'string'
                        ? entry.appendContent
                        : typeof entry.content === 'string'
                          ? entry.content
                          : '',
                  }
                : type === 'replace-file'
                  ? {
                      nextContent:
                        typeof entry.nextContent === 'string'
                          ? entry.nextContent
                          : typeof entry.content === 'string'
                            ? entry.content
                            : '',
                    }
                  : type === 'create-file'
                    ? {
                        initialContent:
                          typeof entry.initialContent === 'string'
                            ? entry.initialContent
                            : typeof entry.content === 'string'
                              ? entry.content
                              : '',
                      }
                    : {}),
            }
          })
          .filter(Boolean)
      : []),
    ...(Array.isArray(plan.files) ? plan.files.map(normalizePlanFileOperation).filter(Boolean) : []),
  ]

  const operations = [...normalizedFolders, ...normalizedOperations]

  if (operations.length === 0) {
    return null
  }

  const validations =
    Array.isArray(plan.validations) && plan.validations.length > 0
      ? plan.validations.map(normalizePlanValidation).filter(Boolean)
      : operations
          .map((operation) => ({
            type: 'exists',
            targetPath: operation.targetPath,
            expectedKind: operation.type === 'create-folder' ? 'folder' : 'file',
          }))
          .filter(Boolean)

  return {
    version:
      Number.isInteger(plan.version) && plan.version > 0
        ? plan.version
        : LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind:
      typeof plan.kind === 'string' && plan.kind.trim()
        ? plan.kind.trim()
        : 'local-materialization',
    summary:
      typeof plan.summary === 'string' && plan.summary.trim() ? plan.summary.trim() : '',
    strategy:
      typeof plan.strategy === 'string' && plan.strategy.trim() ? plan.strategy.trim() : '',
    reasoningLayer:
      typeof plan.reasoningLayer === 'string' && plan.reasoningLayer.trim()
        ? plan.reasoningLayer.trim()
        : '',
    materializationLayer:
      typeof plan.materializationLayer === 'string' && plan.materializationLayer.trim()
        ? plan.materializationLayer.trim()
        : 'local-deterministic',
    operations,
    validations,
  }
}

function getLocalDeterministicOperationLabel(taskType) {
  switch (taskType) {
    case 'materialization-plan':
      return 'materializacion local deterministica'
    case 'create-folder':
      return 'creacion de carpeta'
    case 'create-file':
      return 'creacion de archivo'
    case 'replace-file':
      return 'reemplazo total de archivo'
    case 'append-file':
      return 'append al final de archivo'
    default:
      return 'operacion local'
  }
}

function buildLocalMaterializationTask({
  plan,
  workspacePath,
  requestId,
  instruction,
  brainStrategy,
  businessSector,
  businessSectorLabel,
  creativeDirection,
  reusableArtifactLookup,
  reusableArtifactsFound,
  reuseDecision,
  reuseReason,
  reusedArtifactIds,
  reuseMode,
  reuseMaterialization,
  materializationPlanSource,
}) {
  const normalizedPlan = normalizeMaterializationPlan(plan)

  if (!normalizedPlan) {
    return null
  }

  const normalizedWorkspacePath =
    typeof workspacePath === 'string' && workspacePath.trim() ? workspacePath.trim() : ''

  if (!normalizedWorkspacePath) {
    return null
  }

  const operations = []
  for (const [index, operation] of normalizedPlan.operations.entries()) {
    const target = resolveWorkspaceTarget(normalizedWorkspacePath, operation.targetPath)

    if (!target) {
      return null
    }

    operations.push({
      ...operation,
      stepIndex: index + 1,
      ...target,
    })
  }

  const validations = []
  for (const validation of normalizedPlan.validations) {
    const target = resolveWorkspaceTarget(normalizedWorkspacePath, validation.targetPath)

    if (!target) {
      return null
    }

    validations.push({
      ...validation,
      ...target,
    })
  }

  const primaryTargetPath =
    operations[0]?.relativeTargetPath ||
    validations[0]?.relativeTargetPath ||
    '.'

  return {
    type: 'materialization-plan',
    requestId: requestId || undefined,
    instruction,
    relativeTargetPath: primaryTargetPath,
    workspacePath: path.resolve(normalizedWorkspacePath),
    planVersion: normalizedPlan.version,
    planKind: normalizedPlan.kind,
    planSummary: normalizedPlan.summary || undefined,
    reasoningLayer: normalizedPlan.reasoningLayer || 'local-rules',
    materializationLayer: normalizedPlan.materializationLayer || 'local-deterministic',
    materializationPlanSource: materializationPlanSource || 'inline',
    operations,
    validations,
    brainStrategy: brainStrategy || normalizedPlan.strategy || undefined,
    businessSector: businessSector || undefined,
    businessSectorLabel: businessSectorLabel || undefined,
    creativeDirection: creativeDirection || undefined,
    reusableArtifactLookup: reusableArtifactLookup || undefined,
    reusableArtifactsFound:
      Number.isInteger(reusableArtifactsFound) && reusableArtifactsFound >= 0
        ? reusableArtifactsFound
        : undefined,
    reuseDecision: reuseDecision === true,
    reuseReason: reuseReason || undefined,
    reusedArtifactIds: Array.isArray(reusedArtifactIds) ? reusedArtifactIds : [],
    reuseMode: reuseMode || 'none',
    reuseMaterialization: reuseMaterialization || undefined,
  }
}

function capturePathState(targetPath) {
  try {
    const stats = fs.statSync(targetPath)

    return {
      exists: true,
      type: stats.isDirectory() ? 'folder' : 'file',
      mtimeMs: Number(stats.mtimeMs) || 0,
      size: stats.isFile() ? Number(stats.size) || 0 : 0,
    }
  } catch {
    return {
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }
  }
}

async function applyMaterializationOperation(operation) {
  switch (operation.type) {
    case 'create-folder':
      await fs.promises.mkdir(operation.resolvedTargetPath, { recursive: true })
      return
    case 'create-file':
      await fs.promises.mkdir(path.dirname(operation.resolvedTargetPath), {
        recursive: true,
      })
      await fs.promises.writeFile(
        operation.resolvedTargetPath,
        operation.initialContent || '',
        'utf8',
      )
      return
    case 'replace-file':
      await fs.promises.mkdir(path.dirname(operation.resolvedTargetPath), {
        recursive: true,
      })
      await fs.promises.writeFile(
        operation.resolvedTargetPath,
        operation.nextContent || '',
        'utf8',
      )
      return
    case 'append-file':
      await fs.promises.mkdir(path.dirname(operation.resolvedTargetPath), {
        recursive: true,
      })
      await fs.promises.appendFile(
        operation.resolvedTargetPath,
        operation.appendContent || '',
        'utf8',
      )
      return
    default:
      throw new Error(`Operacion local no soportada: ${operation.type}`)
  }
}

async function runPlanValidations(validations) {
  const validationResults = []

  for (const validation of validations) {
    if (validation.type === 'exists') {
      try {
        const stats = await fs.promises.stat(validation.resolvedTargetPath)
        const detectedKind = stats.isDirectory() ? 'folder' : 'file'

        if (validation.expectedKind && detectedKind !== validation.expectedKind) {
          return {
            ok: false,
            validationResults: [
              ...validationResults,
              {
                type: validation.type,
                targetPath: validation.relativeTargetPath,
                ok: false,
                reason: `Se esperaba ${validation.expectedKind} y se encontro ${detectedKind}.`,
              },
            ],
          }
        }

        validationResults.push({
          type: validation.type,
          targetPath: validation.relativeTargetPath,
          ok: true,
        })
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return {
            ok: false,
            validationResults: [
              ...validationResults,
              {
                type: validation.type,
                targetPath: validation.relativeTargetPath,
                ok: false,
                reason: 'No existe al finalizar la materializacion.',
              },
            ],
          }
        }

        throw error
      }

      continue
    }

    if (validation.type === 'file-contains') {
      const fileContent = await fs.promises.readFile(validation.resolvedTargetPath, 'utf8')

      if (
        typeof validation.expectedText === 'string' &&
        validation.expectedText &&
        !fileContent.includes(validation.expectedText)
      ) {
        return {
          ok: false,
          validationResults: [
            ...validationResults,
            {
              type: validation.type,
              targetPath: validation.relativeTargetPath,
              ok: false,
              reason: 'El contenido final no incluye el texto esperado.',
            },
          ],
        }
      }

      validationResults.push({
        type: validation.type,
        targetPath: validation.relativeTargetPath,
        ok: true,
      })
    }
  }

  return {
    ok: true,
    validationResults,
  }
}

function diffPathStates(beforeStates, afterStates) {
  const createdPaths = []
  const touchedPaths = []

  for (const [targetPath, afterState] of afterStates.entries()) {
    const beforeState = beforeStates.get(targetPath) || {
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }

    if (!beforeState.exists && afterState.exists) {
      createdPaths.push(targetPath)
      touchedPaths.push(targetPath)
      continue
    }

    if (
      afterState.exists &&
      (beforeState.type !== afterState.type ||
        beforeState.mtimeMs !== afterState.mtimeMs ||
        beforeState.size !== afterState.size)
    ) {
      touchedPaths.push(targetPath)
    }
  }

  return {
    createdPaths: summarizeUniquePaths(createdPaths),
    touchedPaths: summarizeUniquePaths(touchedPaths),
  }
}

async function runLocalDeterministicTask(task) {
  if (!task || task.type !== 'materialization-plan') {
    return {
      ok: false,
      ...(task?.requestId ? { requestId: task.requestId } : {}),
      instruction: task?.instruction,
      error: 'No se pudo ejecutar el plan local deterministico solicitado.',
    }
  }

  const trackedPaths = summarizeUniquePaths([
    ...task.operations.map((operation) => operation.resolvedTargetPath),
    ...task.validations.map((validation) => validation.resolvedTargetPath),
  ])
  const beforeStates = new Map(
    trackedPaths.map((targetPath) => [targetPath, capturePathState(targetPath)]),
  )
  const stepResults = []

  try {
    for (const operation of task.operations) {
      await applyMaterializationOperation(operation)
      stepResults.push({
        step: operation.stepIndex,
        operation: operation.type,
        operationLabel: getLocalDeterministicOperationLabel(operation.type),
        targetPath: operation.relativeTargetPath,
      })
    }

    const validationOutcome = await runPlanValidations(task.validations)
    const afterStates = new Map(
      trackedPaths.map((targetPath) => [targetPath, capturePathState(targetPath)]),
    )
    const filesystemDiff = diffPathStates(beforeStates, afterStates)

    if (validationOutcome.ok !== true) {
      return {
        ok: false,
        ...(task.requestId ? { requestId: task.requestId } : {}),
        instruction: task.instruction,
        reasoningLayer: task.reasoningLayer,
        materializationLayer: task.materializationLayer,
        error: 'La materializacion local termino, pero fallo una validacion final.',
        resultPreview: 'La validacion final de la materializacion local fallo.',
        details: {
          reasoningLayer: task.reasoningLayer,
          materializationLayer: task.materializationLayer,
          materializationPlanVersion: task.planVersion,
          materializationPlanSource: task.materializationPlanSource,
          currentAction: 'validation',
          currentTargetPath: validationOutcome.validationResults.at(-1)?.targetPath,
          createdPaths: filesystemDiff.createdPaths,
          touchedPaths: filesystemDiff.touchedPaths,
          hasMaterialProgress:
            filesystemDiff.createdPaths.length > 0 ||
            filesystemDiff.touchedPaths.length > 0,
          materialState: 'local-deterministic-validation-failed',
          validationResults: validationOutcome.validationResults,
        },
      }
    }
    const summaryTarget = task.relativeTargetPath === '.' ? 'workspace' : task.relativeTargetPath
    const summary =
      task.planSummary ||
      `Plan local deterministico aplicado sobre "${summaryTarget}".`

    return {
      ok: true,
      ...(task.requestId ? { requestId: task.requestId } : {}),
      instruction: task.instruction,
      reasoningLayer: task.reasoningLayer,
      materializationLayer: task.materializationLayer,
      result:
        `${summary}\n` +
        `Operaciones aplicadas: ${task.operations.length}. Validaciones: ${task.validations.length}.`,
      resultPreview: buildOutputPreview(summary),
      details: {
        strategy: 'local-deterministic-materialization',
        ...(typeof task.brainStrategy === 'string' && task.brainStrategy
          ? { brainStrategy: task.brainStrategy }
          : {}),
        ...(typeof task.businessSector === 'string' && task.businessSector
          ? { businessSector: task.businessSector }
          : {}),
        ...(typeof task.businessSectorLabel === 'string' && task.businessSectorLabel
          ? { businessSectorLabel: task.businessSectorLabel }
          : {}),
        reasoningLayer: task.reasoningLayer,
        materializationLayer: task.materializationLayer,
        materializationPlanVersion: task.planVersion,
        materializationPlanSource: task.materializationPlanSource,
        currentAction: 'materialization-plan',
        currentTargetPath:
          filesystemDiff.touchedPaths.at(-1) ||
          filesystemDiff.createdPaths.at(-1) ||
          task.operations.at(-1)?.resolvedTargetPath ||
          undefined,
        createdPaths: filesystemDiff.createdPaths,
        touchedPaths: filesystemDiff.touchedPaths,
        hasMaterialProgress:
          filesystemDiff.createdPaths.length > 0 || filesystemDiff.touchedPaths.length > 0,
        materialState: 'local-deterministic-success',
        materializationPlan: {
          version: task.planVersion,
          kind: task.planKind,
          summary: task.planSummary || undefined,
          operations: task.operations.map((operation) => ({
            type: operation.type,
            targetPath: operation.relativeTargetPath,
          })),
          validations: task.validations.map((validation) => ({
            type: validation.type,
            targetPath: validation.relativeTargetPath,
            ...(validation.expectedKind ? { expectedKind: validation.expectedKind } : {}),
          })),
        },
        validationResults: task.validations.map((validation) => ({
          type: validation.type,
          targetPath: validation.relativeTargetPath,
          ok: true,
        })),
        stepResults,
        appliedReuseMode:
          typeof task?.reuseMaterialization?.appliedReuseMode === 'string'
            ? task.reuseMaterialization.appliedReuseMode
            : undefined,
        reusedStyleFromArtifactId:
          typeof task?.reuseMaterialization?.reusedStyleFromArtifactId === 'string'
            ? task.reuseMaterialization.reusedStyleFromArtifactId
            : undefined,
        reusedStructureFromArtifactId:
          typeof task?.reuseMaterialization?.reusedStructureFromArtifactId === 'string'
            ? task.reuseMaterialization.reusedStructureFromArtifactId
            : undefined,
        reuseAppliedFields: Array.isArray(task?.reuseMaterialization?.reuseAppliedFields)
          ? task.reuseMaterialization.reuseAppliedFields
          : undefined,
        reuseMaterializationReason:
          typeof task?.reuseMaterialization?.reuseMaterializationReason === 'string'
            ? task.reuseMaterialization.reuseMaterializationReason
            : undefined,
      },
    }
  } catch (error) {
    const afterStates = new Map(
      trackedPaths.map((targetPath) => [targetPath, capturePathState(targetPath)]),
    )
    const filesystemDiff = diffPathStates(beforeStates, afterStates)

    return {
      ok: false,
      ...(task.requestId ? { requestId: task.requestId } : {}),
      instruction: task.instruction,
      reasoningLayer: task.reasoningLayer,
      materializationLayer: task.materializationLayer,
      error:
        error instanceof Error
          ? error.message
          : 'La materializacion local determinstica fallo.',
      resultPreview: 'La materializacion local deterministica fallo.',
      details: {
        reasoningLayer: task.reasoningLayer,
        materializationLayer: task.materializationLayer,
        materializationPlanVersion: task.planVersion,
        materializationPlanSource: task.materializationPlanSource,
        currentAction: task.operations.at(stepResults.length)?.type || undefined,
        currentTargetPath: task.operations.at(stepResults.length)?.resolvedTargetPath || undefined,
        createdPaths: filesystemDiff.createdPaths,
        touchedPaths: filesystemDiff.touchedPaths,
        hasMaterialProgress:
          filesystemDiff.createdPaths.length > 0 ||
          filesystemDiff.touchedPaths.length > 0,
        materialState: 'local-deterministic-failed',
        stepResults,
      },
    }
  }
}

module.exports = {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  normalizeMaterializationPlan,
  buildLocalMaterializationTask,
  buildGenericSafeFirstDeliveryMaterializationPlan,
  runLocalDeterministicTask,
  getLocalDeterministicOperationLabel,
}
