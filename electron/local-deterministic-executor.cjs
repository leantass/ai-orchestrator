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
    /\b(?:ecommerce|tienda online|comercio online|catalogo|carrito|checkout|mercado pago|productos)\b/u.test(
      normalizedText,
    )
  ) {
    return 'ecommerce'
  }

  if (
    /\b(?:crm|alumnos?|familias?|cursos?|comunicaciones?|escuelas?)\b/u.test(
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
      if (
        /\bescuel|\balumnos?\b|\bfamilias?\b|\bcursos?\b|\bcomunicaciones?\b/u.test(
          normalizeSafeFirstDeliveryText(
            [instruction, businessSector, businessSectorLabel].join(' '),
          ),
        )
      ) {
        return 'gestion escolar'
      }

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
  const normalizedTitle = normalizeSafeFirstDeliveryText(title)

  if (/\bsolicitudes?\b/u.test(normalizedTitle)) {
    return [
      {
        id: 'sol-1',
        nombre: 'Solicitud de acceso de proveedor',
        estado: 'nueva',
        prioridad: 'alta',
        responsable: 'Mesa operativa mock',
        resumen: 'Ingreso inicial para revisar el circuito de atencion.',
      },
      {
        id: 'sol-2',
        nombre: 'Solicitud de actualizacion de datos',
        estado: 'en revision',
        prioridad: 'media',
        responsable: 'Analista mock',
        resumen: 'Caso intermedio para validar cambios de estado locales.',
      },
      {
        id: 'sol-3',
        nombre: 'Solicitud de cierre administrativo',
        estado: 'resuelta mock',
        prioridad: 'baja',
        responsable: 'Backoffice mock',
        resumen: 'Ejemplo resuelto para revisar historial y reportes.',
      },
    ]
  }

  if (/\bestados?\b/u.test(normalizedTitle)) {
    return [
      {
        id: 'est-1',
        nombre: 'Bandeja inicial',
        estado: 'habilitada',
        responsable: 'Operacion mock',
        resumen: 'Estado inicial para ordenar el flujo local.',
      },
      {
        id: 'est-2',
        nombre: 'Seguimiento interno',
        estado: 'en revision',
        responsable: 'Equipo mock',
        resumen: 'Permite probar cambios de estado sin integraciones reales.',
      },
      {
        id: 'est-3',
        nombre: 'Cierre operativo',
        estado: 'listo para demo',
        responsable: 'Supervisor mock',
        resumen: 'Referencia final para revisar aprobaciones futuras.',
      },
    ]
  }

  if (/\breportes?\b/u.test(normalizedTitle)) {
    return [
      {
        id: 'rep-1',
        nombre: 'Reporte de pendientes',
        estado: 'listo para revision',
        indicador: '12 items abiertos',
        resumen: 'Vista resumida del backlog operativo local.',
      },
      {
        id: 'rep-2',
        nombre: 'Reporte de estados activos',
        estado: 'borrador',
        indicador: '4 estados con actividad',
        resumen: 'Permite validar tarjetas y filtros del tablero.',
      },
    ]
  }

  if (/\boperaci|\bpanel\b/u.test(normalizedTitle)) {
    return [
      {
        id: 'op-1',
        nombre: 'Panel operativo inicial',
        estado: 'listo para demo',
        responsable: 'Coordinacion mock',
        resumen: 'Entrada principal para revisar el flujo local del sistema.',
      },
      {
        id: 'op-2',
        nombre: 'Revision de pendientes',
        estado: 'en revision',
        responsable: 'Analista mock',
        resumen: 'Lista de trabajo preparada para pruebas de accion local.',
      },
    ]
  }

  return Array.from({ length: count }, (_entry, index) => ({
    id: `${slugifySafeFirstDeliveryValue(title) || 'item'}-${index + 1}`,
    nombre: `${toTitleCaseLabel(title)} ${index + 1}`,
    estado: index === 0 ? 'listo para demo' : index === 1 ? 'en revision' : 'pendiente',
    responsable: index === 0 ? 'Equipo mock' : index === 1 ? 'Operacion mock' : 'Revision manual',
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
        familia: 'Familia Rojas',
        asistencia: '96%',
        resumen: 'Ficha mock para revisar seguimiento academico.',
      },
      {
        id: 'alu-2',
        nombre: 'Tomas Diaz',
        curso: '3B',
        estado: 'alerta',
        familia: 'Familia Diaz',
        asistencia: '82%',
        resumen: 'Caso con seguimiento pendiente y comunicacion asociada.',
      },
      {
        id: 'alu-3',
        nombre: 'Valentina Perez',
        curso: '1C',
        estado: 'regular',
        familia: 'Familia Perez',
        asistencia: '94%',
        resumen: 'Registro inicial para probar listados y filtros mock.',
      },
    ]
    collections.familias = [
      {
        id: 'fam-1',
        nombre: 'Familia Rojas',
        contacto: 'Contacto mock 1',
        estado: 'al dia',
        responsable: 'Madre o tutor mock',
      },
      {
        id: 'fam-2',
        nombre: 'Familia Diaz',
        contacto: 'Contacto mock 2',
        estado: 'requiere seguimiento',
        responsable: 'Padre o tutor mock',
      },
    ]
    collections.cursos = [
      { id: 'cur-1', nombre: '2A', tutor: 'Docente mock', turno: 'Manana', estado: 'activo' },
      { id: 'cur-2', nombre: '3B', tutor: 'Docente mock', turno: 'Tarde', estado: 'activo' },
    ]
    collections.comunicaciones = [
      {
        id: 'com-1',
        nombre: 'Aviso de reunion',
        canal: 'mail mock',
        estado: 'borrador',
        destinatario: 'Familias de 2A',
      },
      {
        id: 'com-2',
        nombre: 'Seguimiento de asistencia',
        canal: 'mensaje interno mock',
        estado: 'pendiente',
        destinatario: 'Familia Diaz',
      },
    ]
    collections.seguimientos = [
      {
        id: 'seg-1',
        nombre: 'Seguimiento asistencia Tomas Diaz',
        responsable: 'Preceptoria mock',
        estado: 'en curso',
        proximoPaso: 'Confirmar reunion con la familia',
      },
    ]
    collections.reportes = [
      {
        id: 'rep-1',
        nombre: 'Resumen de alertas por curso',
        estado: 'listo para revision',
        indicador: '3 alertas abiertas',
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
  const interactionMode =
    productType === 'ecommerce' && Array.isArray(collections.productos)
      ? 'ecommerce'
      : productType === 'crm' &&
          (Array.isArray(collections.alumnos) ||
            Array.isArray(collections.familias) ||
            Array.isArray(collections.cursos) ||
            Array.isArray(collections.comunicaciones))
        ? 'school-crm'
        : 'generic'

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      productType,
      productLabel: buildSafeFirstDeliveryProductLabel(productType),
      interactionMode,
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

function detectSafeFirstDeliveryInteractionMode(mockDataObject) {
  const meta = mockDataObject?.meta && typeof mockDataObject.meta === 'object'
    ? mockDataObject.meta
    : {}
  const collections =
    mockDataObject?.collections && typeof mockDataObject.collections === 'object'
      ? mockDataObject.collections
      : {}
  const explicitMode =
    typeof meta.interactionMode === 'string' && meta.interactionMode.trim()
      ? meta.interactionMode.trim()
      : ''

  if (explicitMode === 'ecommerce' || explicitMode === 'school-crm' || explicitMode === 'generic') {
    return explicitMode
  }

  if (Array.isArray(collections.productos) || Array.isArray(collections.ordenes)) {
    return 'ecommerce'
  }

  if (
    Array.isArray(collections.alumnos) ||
    Array.isArray(collections.familias) ||
    Array.isArray(collections.cursos) ||
    Array.isArray(collections.comunicaciones)
  ) {
    return 'school-crm'
  }

  return 'generic'
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
            <div class="toolbar workspace-toolbar">
              <label class="field">
                <span>Buscar</span>
                <input id="search-input" type="search" placeholder="Buscar en esta demo local" />
              </label>
              <label class="field field-select">
                <span>Estado</span>
                <select id="status-filter">
                  <option value="">Todos los estados</option>
                </select>
              </label>
            </div>

            <div class="workspace-grid">
              <section class="workspace-panel">
                <div class="panel-header compact-header">
                  <div>
                    <h3 id="records-title">Registros mock</h3>
                    <p id="records-summary" class="panel-copy"></p>
                  </div>
                </div>
                <div id="records-list" class="record-grid"></div>
              </section>

              <section class="workspace-panel">
                <div class="panel-header compact-header">
                  <div>
                    <h3>Detalle seleccionado</h3>
                    <p id="detail-summary" class="panel-copy"></p>
                  </div>
                </div>
                <div id="detail-panel" class="detail-stack"></div>
              </section>
            </div>

            <section class="workspace-panel">
              <div class="panel-header compact-header">
                <div>
                  <h3>Acciones locales</h3>
                  <p id="actions-summary" class="panel-copy"></p>
                </div>
              </div>
              <div id="action-panel" class="action-stack"></div>
            </section>
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
            <h2>Actividad local</h2>
            <ul id="activity-log" class="activity-list"></ul>
          </section>

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

.panel h3 {
  margin: 0;
  font-size: 1rem;
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

.workspace-toolbar {
  align-items: flex-end;
  margin-bottom: 18px;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 220px;
}

.field span {
  font-size: 0.85rem;
  color: var(--muted);
}

.field input,
.field select {
  width: 100%;
  border: 1px solid rgba(20, 32, 51, 0.12);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ink);
  font: inherit;
}

.field input:focus,
.field select:focus {
  outline: 2px solid rgba(179, 92, 46, 0.2);
  border-color: rgba(179, 92, 46, 0.4);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.9fr);
  gap: 16px;
}

.workspace-panel {
  border: 1px solid rgba(20, 32, 51, 0.1);
  border-radius: 22px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  gap: 14px;
}

.compact-header {
  margin-bottom: 0;
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

.detail-stack,
.action-stack {
  display: grid;
  gap: 12px;
}

.card,
.record-card {
  border: 1px solid rgba(20, 32, 51, 0.1);
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
}

.record-card.is-selected {
  border-color: rgba(179, 92, 46, 0.44);
  box-shadow: 0 18px 36px rgba(179, 92, 46, 0.14);
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

.toolbar.secondary-actions .button {
  background: rgba(20, 32, 51, 0.08);
  color: var(--ink);
}

.button {
  border: 0;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--ink);
  color: white;
  font: inherit;
}

.button.secondary {
  background: rgba(20, 32, 51, 0.08);
  color: var(--ink);
}

.status-inline {
  color: var(--success);
  font-weight: 600;
}

.detail-list {
  display: grid;
  gap: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(20, 32, 51, 0.05);
}

.detail-row strong {
  font-size: 0.9rem;
}

.detail-row span {
  color: var(--muted);
  text-align: right;
}

.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.activity-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(20, 32, 51, 0.05);
  color: var(--muted);
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

  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
`
}

function buildSafeFirstDeliveryRuntimeModeConfig(interactionMode) {
  switch (interactionMode) {
    case 'ecommerce':
      return {
        kind: 'commerce',
        fallbackLabel: 'ecommerce',
        searchPlaceholder: 'Buscar catalogo, categoria, estado u orden local',
        initialLog: 'Base mock local de ecommerce lista para revision.',
        safetySummary:
          'sin integraciones externas, pagos reales, credenciales ni persistencia real',
        detailEmpty:
          'Selecciona un producto, una orden o un elemento operativo para revisar el detalle local.',
        emptyRecords: 'No hay registros visibles con el filtro actual en este modulo.',
        currencyKeys: ['precio', 'total'],
        runtimeList: {
          enabled: true,
          collectionKey: 'carrito',
          title: 'Carrito local',
          emptyText: 'Todavia no hay items en el carrito local.',
          amountKey: 'precio',
          quantityKey: 'cantidad',
        },
        primaryEditCollectionKey: 'productos',
        flowAction: {
          enabled: true,
          label: 'Simular checkout',
          targetCollectionKey: 'ordenes',
          recordLabel: 'Orden local simulada',
          emptyLog: 'No hay items en el carrito local para completar el flujo.',
          successLog:
            'Se genero una orden simulada sin usar pagos reales ni integraciones externas.',
        },
        approvalHints: [
          'Aprobar pagos reales y la pasarela de cobro antes de salir del mock.',
          'Definir credenciales reales y configuracion segura para Mercado Pago o la pasarela elegida.',
          'Validar webhooks reales y conciliacion de ordenes antes de conectarse con terceros.',
          'Aprobar persistencia real, migraciones y stock productivo antes de operar con datos reales.',
          'Definir autenticacion real y permisos para backoffice antes de publicar.',
          'Revisar despliegue, observabilidad y recuperacion operativa antes de abrir la tienda.',
        ],
        stateSequences: {
          reviewTargets: ['ordenes'],
          primaryTargets: ['productos'],
          review: ['simulada', 'en revision', 'revisada mock'],
          primary: ['borrador', 'publicado', 'pausado'],
          default: ['listo para demo', 'en revision', 'aprobado mock'],
        },
        actionSets: {
          productos: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'attach-runtime', label: 'Agregar al carrito' },
          ],
          carrito: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'qty-up', label: 'Sumar unidad' },
            { type: 'qty-down', label: 'Restar unidad' },
            { type: 'remove-runtime', label: 'Quitar del carrito' },
          ],
          ordenes: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'mark-review', label: 'Marcar orden revisada' },
          ],
          operacion: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'rename-primary', label: 'Renombrar producto mock' },
            { type: 'bump-primary', label: 'Ajustar precio mock' },
            { type: 'cycle-primary-state', label: 'Cambiar estado de producto' },
          ],
          default: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'cycle-selected-state', label: 'Actualizar estado mock' },
          ],
        },
        globalActions: {
          carrito: [{ type: 'run-flow', label: 'Simular checkout' }],
          productos: [{ type: 'run-flow', label: 'Simular checkout' }],
          operacion: [{ type: 'run-flow', label: 'Simular checkout' }],
        },
      }
    case 'school-crm':
      return {
        kind: 'school-crm',
        fallbackLabel: 'crm escolar',
        searchPlaceholder: 'Buscar alumno, familia, curso, comunicacion o estado',
        initialLog: 'Base mock local de CRM escolar lista para revision.',
        safetySummary:
          'sin datos sensibles reales, autenticacion real, persistencia real ni integraciones institucionales activas',
        detailEmpty:
          'Selecciona un alumno, una familia, un curso o una comunicacion para revisar el detalle local.',
        emptyRecords: 'No hay registros visibles con el filtro actual en este modulo.',
        currencyKeys: [],
        runtimeList: { enabled: false },
        flowAction: { enabled: false },
        approvalHints: [
          'Definir autenticacion real y roles o permisos finos antes de usar cuentas reales.',
          'Aprobar el tratamiento de datos sensibles reales de alumnos y familias.',
          'Definir politicas de resguardo, auditoria y trazabilidad institucional.',
          'Aprobar persistencia real y migraciones antes de pasar a datos productivos.',
          'Validar integraciones institucionales reales antes de conectarse con servicios externos.',
          'Definir responsables y trazabilidad de comunicaciones antes de operar con casos reales.',
          'Revisar cumplimiento normativo o institucional antes de usar datos reales.',
        ],
        stateSequences: {
          followupTargets: ['seguimientos', 'alumnos'],
          noteTargets: ['comunicaciones'],
          reviewTargets: ['reportes'],
          followup: ['pendiente', 'en curso', 'resuelto mock'],
          note: ['borrador', 'registrada mock', 'en seguimiento', 'revisada'],
          review: ['listo para revision', 'revisado mock', 'compartido local'],
          default: ['listo para demo', 'en revision', 'aprobado mock'],
        },
        actionSets: {
          alumnos: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'mark-followup', label: 'Marcar seguimiento' },
          ],
          familias: [{ type: 'select-detail', label: 'Ver detalle' }],
          cursos: [{ type: 'select-detail', label: 'Ver detalle' }],
          comunicaciones: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'register-note', label: 'Registrar comunicacion mock' },
            { type: 'toggle-review', label: 'Marcar revision' },
          ],
          seguimientos: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'mark-followup', label: 'Cambiar estado de seguimiento' },
          ],
          reportes: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'review-record', label: 'Revisar reporte mock' },
          ],
          operacion: [{ type: 'create-entry', label: 'Registrar seguimiento mock' }],
          default: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'cycle-selected-state', label: 'Actualizar estado mock' },
          ],
        },
        globalActions: {
          alumnos: [{ type: 'register-note', label: 'Registrar comunicacion mock' }],
          operacion: [{ type: 'create-entry', label: 'Registrar seguimiento mock' }],
        },
      }
    default:
      return {
        kind: 'generic',
        fallbackLabel: 'sistema interno',
        searchPlaceholder: 'Buscar solicitud, estado, reporte o responsable',
        initialLog: 'Base mock local de sistema interno lista para revision.',
        safetySummary:
          'sin autenticacion real, persistencia real ni integraciones externas activas',
        detailEmpty:
          'Selecciona una solicitud, un estado o un reporte para revisar el detalle local.',
        emptyRecords: 'No hay registros visibles con el filtro actual en este modulo.',
        currencyKeys: [],
        runtimeList: { enabled: false },
        flowAction: { enabled: false },
        approvalHints: [
          'Definir autenticacion real, permisos y perfiles antes de usar usuarios reales.',
          'Aprobar persistencia real y migraciones antes de pasar a datos productivos.',
          'Definir auditoria, trazabilidad y resguardo operativo para eventos clave.',
          'Validar integraciones externas reales antes de conectarse con otros sistemas.',
          'Acordar uso de datos productivos y politicas de acceso antes de salir del mock.',
          'Revisar despliegue y soporte operativo antes de publicar la primera version.',
        ],
        stateSequences: {
          primaryTargets: ['solicitudes'],
          reviewTargets: ['reportes'],
          statusTargets: ['estados'],
          primary: ['nueva', 'en revision', 'resuelta mock'],
          review: ['borrador', 'listo para revision', 'revisado mock'],
          status: ['habilitada', 'en revision', 'aprobada mock'],
          default: ['listo para demo', 'en revision', 'aprobado mock'],
        },
        actionSets: {
          solicitudes: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'cycle-selected-state', label: 'Cambiar estado' },
            { type: 'mark-review', label: 'Marcar revisado' },
          ],
          estados: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'cycle-selected-state', label: 'Cambiar estado' },
          ],
          reportes: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'review-record', label: 'Revisar reporte mock' },
          ],
          operacion: [
            { type: 'create-entry', label: 'Crear registro mock' },
            { type: 'cycle-selected-state', label: 'Cambiar estado' },
          ],
          default: [
            { type: 'select-detail', label: 'Ver detalle' },
            { type: 'cycle-selected-state', label: 'Actualizar estado mock' },
          ],
        },
        globalActions: {
          solicitudes: [{ type: 'create-entry', label: 'Crear solicitud mock' }],
          operacion: [{ type: 'create-entry', label: 'Crear registro mock' }],
        },
      }
  }
}

function buildSafeFirstDeliveryScriptJs(mockDataObject) {
  const serializedFallbackData = JSON.stringify(mockDataObject, null, 2)
  const interactionMode = detectSafeFirstDeliveryInteractionMode(mockDataObject)
  const modeConfig = buildSafeFirstDeliveryRuntimeModeConfig(interactionMode)
  const serializedModeConfig = JSON.stringify(modeConfig, null, 2)

  return `const fallbackData = ${serializedFallbackData};
const MODE = ${serializedModeConfig};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const state = {
  data: fallbackData,
  activeModuleId: fallbackData.modules?.[0]?.id || '',
  selectedRecordId: '',
  searchQuery: '',
  statusFilter: '',
  runtimeList: [],
  localLog: [MODE.initialLog],
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLocaleLowerCase();
}

function toDisplayLabel(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\\b\\w/g, (match) => match.toUpperCase());
}

function logAction(message) {
  if (!message) {
    return;
  }

  state.localLog.unshift(message);
  state.localLog = state.localLog.slice(0, 14);
}

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
      logAction('Se cargó mock-data.json como fuente principal.');
    }
  } catch (error) {
    logAction(
      'Se usó la base embebida porque mock-data.json no pudo cargarse por apertura local.',
    );
  }

  syncRuntimeListFromData();
}

function ensureCollectionsObject() {
  if (!state.data.collections || typeof state.data.collections !== 'object') {
    state.data.collections = {};
  }
}

function getCollection(collectionKey) {
  ensureCollectionsObject();
  return Array.isArray(state.data.collections[collectionKey])
    ? state.data.collections[collectionKey]
    : [];
}

function setCollection(collectionKey, records) {
  ensureCollectionsObject();
  state.data.collections[collectionKey] = Array.isArray(records) ? records : [];

  if (MODE.runtimeList?.enabled && collectionKey === MODE.runtimeList.collectionKey) {
    state.runtimeList = state.data.collections[collectionKey];
  }
}

function syncRuntimeListFromData() {
  if (!MODE.runtimeList?.enabled) {
    return;
  }

  const collection = getCollection(MODE.runtimeList.collectionKey).map((record) => ({
    ...record,
  }));
  state.runtimeList = collection;
  setCollection(MODE.runtimeList.collectionKey, collection);
}

function getModules() {
  return Array.isArray(state.data.modules) ? state.data.modules : [];
}

function getActiveModule() {
  const modules = getModules();
  return modules.find((module) => module.id === state.activeModuleId) || modules[0] || null;
}

function getModuleRecords(collectionKey) {
  if (MODE.runtimeList?.enabled && collectionKey === MODE.runtimeList.collectionKey) {
    return state.runtimeList;
  }

  return getCollection(collectionKey);
}

function getVisibleRecords(module) {
  if (!module) {
    return [];
  }

  const query = normalizeText(state.searchQuery);
  const statusQuery = normalizeText(state.statusFilter);

  return getModuleRecords(module.collectionKey).filter((record) => {
    const textMatches =
      !query ||
      Object.values(record).some((value) => normalizeText(value).includes(query));
    const statusMatches = !statusQuery || normalizeText(record.estado) === statusQuery;
    return textMatches && statusMatches;
  });
}

function ensureSelection(module) {
  if (!module) {
    state.selectedRecordId = '';
    return;
  }

  const visibleRecords = getVisibleRecords(module);
  const sourceRecords = getModuleRecords(module.collectionKey);
  const currentRecord = sourceRecords.find((record) => record.id === state.selectedRecordId);

  if (currentRecord && visibleRecords.some((record) => record.id === currentRecord.id)) {
    return;
  }

  state.selectedRecordId = visibleRecords[0]?.id || sourceRecords[0]?.id || '';
}

function getSelectedRecord(module) {
  if (!module) {
    return null;
  }

  const records = getModuleRecords(module.collectionKey);
  return records.find((record) => record.id === state.selectedRecordId) || null;
}

function updateTitle() {
  const meta = state.data.meta || {};
  const titleNode = document.getElementById('app-title');
  const subtitleNode = document.getElementById('app-subtitle');
  const summaryNode = document.getElementById('plan-summary');

  titleNode.textContent =
    'Primera entrega segura de ' + (meta.domain || meta.productLabel || MODE.fallbackLabel);
  subtitleNode.textContent =
    'Este mock local define una primera fase segura y revisable de ' +
    (meta.productLabel || meta.domain || MODE.fallbackLabel) +
    ', ' +
    (MODE.safetySummary || 'sin integraciones externas, credenciales ni persistencia real') +
    '.';
  summaryNode.textContent =
    (Array.isArray(meta.scope) && meta.scope[0]
      ? meta.scope[0]
      : 'Se priorizo un flujo principal navegable con datos mock editables.') +
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
  const modules = getModules();
  container.innerHTML = '';

  modules.forEach((module) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'module-button';
    button.textContent = module.title;
    button.setAttribute('aria-current', state.activeModuleId === module.id ? 'true' : 'false');
    button.addEventListener('click', () => {
      state.activeModuleId = module.id;
      ensureSelection(module);
      refreshView();
    });
    container.appendChild(button);
  });
}

function formatValue(key, value) {
  if (typeof value === 'number' && Array.isArray(MODE.currencyKeys) && MODE.currencyKeys.includes(key)) {
    return currencyFormatter.format(value);
  }

  return String(value);
}

function updateFilterControls(module) {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const records = module ? getModuleRecords(module.collectionKey) : [];
  const currentValue = state.statusFilter;
  const uniqueStatuses = Array.from(
    new Set(
      records
        .map((record) => String(record.estado || '').trim())
        .filter(Boolean),
    ),
  );

  searchInput.placeholder = MODE.searchPlaceholder;
  searchInput.value = state.searchQuery;
  statusFilter.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Todos los estados';
  statusFilter.appendChild(defaultOption);

  uniqueStatuses.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    statusFilter.appendChild(option);
  });

  statusFilter.value = currentValue;
}

function buildActionButtons(actions, module, record, className = '') {
  const toolbar = document.createElement('div');
  toolbar.className = className ? 'toolbar ' + className : 'toolbar';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = action.secondary ? 'button secondary' : 'button';
    button.textContent = action.label;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      performAction(action.type, module, record || null);
    });
    toolbar.appendChild(button);
  });

  return toolbar;
}

function resolveActionSet(collectionKey) {
  const actionSets = MODE.actionSets || {};
  return Array.isArray(actionSets[collectionKey]) ? actionSets[collectionKey] : actionSets.default || [];
}

function resolveGlobalActions(collectionKey) {
  const globalActions = MODE.globalActions || {};
  return Array.isArray(globalActions[collectionKey]) ? globalActions[collectionKey] : [];
}

function renderRecordCard(module, record, isSelected) {
  const card = document.createElement('article');
  card.className = 'record-card' + (isSelected ? ' is-selected' : '');
  card.addEventListener('click', () => {
    state.selectedRecordId = record.id;
    refreshView();
  });

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

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = toDisplayLabel(key) + ': ' + formatValue(key, value);
    meta.appendChild(tag);
  });
  card.appendChild(meta);

  const actionSet = resolveActionSet(module.collectionKey);
  if (actionSet.length > 0) {
    card.appendChild(buildActionButtons(actionSet, module, record));
  }

  return card;
}

function renderDetailPanel(module, record) {
  const container = document.getElementById('detail-panel');
  const detailSummary = document.getElementById('detail-summary');
  container.innerHTML = '';

  if (!module || !record) {
    detailSummary.textContent = MODE.detailEmpty;
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = MODE.detailEmpty;
    container.appendChild(empty);
    return;
  }

  detailSummary.textContent =
    'Vista: ' + (module.screen || module.title) + '. Fuente: ' + module.collectionKey + '.';

  const headerCard = document.createElement('div');
  headerCard.className = 'card';
  headerCard.innerHTML =
    '<h3>' +
    (record.nombre || record.id || 'Registro mock') +
    '</h3><p class="muted">' +
    (record.resumen || module.summary || 'Detalle local listo para revision manual.') +
    '</p>';
  container.appendChild(headerCard);

  const detailList = document.createElement('div');
  detailList.className = 'detail-list';

  Object.entries(record).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    const row = document.createElement('div');
    row.className = 'detail-row';
    const label = document.createElement('strong');
    label.textContent = toDisplayLabel(key);
    const content = document.createElement('span');
    content.textContent = formatValue(key, value);
    row.appendChild(label);
    row.appendChild(content);
    detailList.appendChild(row);
  });

  container.appendChild(detailList);
}

function renderActionPanel(module, record) {
  const container = document.getElementById('action-panel');
  const summaryNode = document.getElementById('actions-summary');
  container.innerHTML = '';

  const intro = document.createElement('div');
  intro.className = 'card';
  intro.innerHTML =
    '<h3>Acciones disponibles</h3><p class="muted">Estas acciones solo actualizan datos mock locales dentro de esta demo segura.</p>';
  container.appendChild(intro);

  summaryNode.textContent =
    record
      ? 'Registro seleccionado: ' + (record.nombre || record.id || 'registro mock') + '.'
      : 'Primero selecciona un registro para usar acciones sobre su detalle local.';

  if (record) {
    const recordActions = resolveActionSet(module.collectionKey);
    if (recordActions.length > 0) {
      container.appendChild(buildActionButtons(recordActions, module, record));
    }
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = MODE.detailEmpty;
    container.appendChild(empty);
  }

  const globalActions = resolveGlobalActions(module.collectionKey);
  if (globalActions.length > 0) {
    const block = document.createElement('div');
    block.className = 'card';
    block.innerHTML =
      '<h3>Acciones del modulo</h3><p class="muted">Sirven para registrar avances o recrear pasos del flujo local sin salir del alcance permitido.</p>';
    block.appendChild(buildActionButtons(globalActions, module, null, 'secondary-actions'));
    container.appendChild(block);
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
    title.textContent = toDisplayLabel(key);
    const detail = document.createElement('p');
    detail.className = 'muted';
    detail.textContent = count + ' registro(s) mock disponibles.';
    card.appendChild(title);
    card.appendChild(detail);
    container.appendChild(card);
  });

  const stateCard = document.createElement('div');
  stateCard.className = 'card';
  stateCard.innerHTML =
    '<h3>Estado local</h3><p class="muted">' +
    (state.localLog[0] || 'Sin eventos locales todavia.') +
    '</p>';
  container.appendChild(stateCard);
}

function renderActivityLog() {
  const container = document.getElementById('activity-log');
  container.innerHTML = '';
  const entries = Array.isArray(state.localLog) ? state.localLog : [];

  if (entries.length === 0) {
    const item = document.createElement('li');
    item.className = 'activity-item';
    item.textContent = 'Todavia no hay actividad local registrada.';
    container.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'activity-item';
    item.textContent = entry;
    container.appendChild(item);
  });
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

  const approvals = buildFutureApprovals(meta);

  renderList(
    'approval-list',
    approvals,
    'Las aprobaciones futuras apareceran cuando se definan integraciones reales.',
  );
}

function buildFutureApprovals(meta) {
  const approvals = [];
  const explicitExclusions = Array.isArray(meta.explicitExclusions) ? meta.explicitExclusions : [];
  const approvalHints = Array.isArray(MODE.approvalHints) ? MODE.approvalHints : [];

  approvalHints.forEach((entry) => {
    if (entry && !approvals.includes(entry)) {
      approvals.push(entry);
    }
  });

  explicitExclusions.forEach((entry) => {
    if (/credenciales|secretos?/i.test(entry)) {
      const text =
        MODE.kind === 'school-crm'
          ? 'Asegurar almacenamiento y rotacion segura de credenciales institucionales antes de integrar servicios reales.'
          : 'Aprobar credenciales y configuracion segura antes de integrar servicios reales.';
      if (!approvals.includes(text)) {
        approvals.push(text);
      }
    } else if (/auth|autenticacion|permisos?/i.test(entry)) {
      const text =
        MODE.kind === 'school-crm'
          ? 'Definir autenticacion real, roles y permisos finos para perfiles institucionales antes de publicar.'
          : 'Definir autenticacion real y permisos finos antes de publicar.';
      if (!approvals.includes(text)) {
        approvals.push(text);
      }
    } else if (/base de datos|migraciones?|persistencia/i.test(entry)) {
      const text =
        MODE.kind === 'school-crm'
          ? 'Aprobar persistencia real, migraciones y resguardo institucional antes de usar datos reales.'
          : 'Aprobar persistencia real y migraciones antes de pasar a datos productivos.';
      if (!approvals.includes(text)) {
        approvals.push(text);
      }
    } else if (/datos sensibles|datos reales|productivos/i.test(entry)) {
      const text =
        MODE.kind === 'school-crm'
          ? 'Revisar tratamiento de datos sensibles, consentimiento y cumplimiento institucional antes de usar informacion real.'
          : 'Acordar uso de datos productivos y politicas de acceso antes de salir del mock.';
      if (!approvals.includes(text)) {
        approvals.push(text);
      }
    } else if (/integraciones?|webhooks?/i.test(entry)) {
      const text =
        MODE.kind === 'school-crm'
          ? 'Validar integraciones institucionales reales y responsables de interoperabilidad antes de conectar terceros.'
          : 'Validar integraciones externas reales y webhooks antes de conectarse con terceros.';
      if (!approvals.includes(text)) {
        approvals.push(text);
      }
    }
  });

  return approvals;
}

function resolveStateSequence(collectionKey, actionType) {
  const sequences = MODE.stateSequences || {};
  const reviewTargets = Array.isArray(sequences.reviewTargets) ? sequences.reviewTargets : [];
  const primaryTargets = Array.isArray(sequences.primaryTargets) ? sequences.primaryTargets : [];
  const statusTargets = Array.isArray(sequences.statusTargets) ? sequences.statusTargets : [];
  const noteTargets = Array.isArray(sequences.noteTargets) ? sequences.noteTargets : [];
  const followupTargets = Array.isArray(sequences.followupTargets) ? sequences.followupTargets : [];

  if (actionType === 'mark-review' || actionType === 'review-record' || reviewTargets.includes(collectionKey)) {
    return Array.isArray(sequences.review) && sequences.review.length > 0
      ? sequences.review
      : ['listo para demo', 'en revision', 'aprobado mock'];
  }

  if (
    actionType === 'mark-followup' ||
    followupTargets.includes(collectionKey)
  ) {
    return Array.isArray(sequences.followup) && sequences.followup.length > 0
      ? sequences.followup
      : ['listo para demo', 'en revision', 'aprobado mock'];
  }

  if (
    actionType === 'toggle-review' ||
    actionType === 'register-note' ||
    noteTargets.includes(collectionKey)
  ) {
    return Array.isArray(sequences.note) && sequences.note.length > 0
      ? sequences.note
      : ['listo para demo', 'en revision', 'aprobado mock'];
  }

  if (primaryTargets.includes(collectionKey)) {
    return Array.isArray(sequences.primary) && sequences.primary.length > 0
      ? sequences.primary
      : ['listo para demo', 'en revision', 'aprobado mock'];
  }

  if (statusTargets.includes(collectionKey)) {
    return Array.isArray(sequences.status) && sequences.status.length > 0
      ? sequences.status
      : ['listo para demo', 'en revision', 'aprobado mock'];
  }

  return Array.isArray(sequences.default) && sequences.default.length > 0
    ? sequences.default
    : ['listo para demo', 'en revision', 'aprobado mock'];
}

function cycleRecordState(record, collectionKey, actionType, messagePrefix) {
  if (!record) {
    return;
  }

  const sequence = resolveStateSequence(collectionKey, actionType);
  const currentState = String(record.estado || '').toLocaleLowerCase();
  const currentIndex = sequence.findIndex((entry) => entry === currentState);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % sequence.length : 0;
  record.estado = sequence[nextIndex];
  logAction(messagePrefix + ' "' + (record.nombre || record.id || 'registro mock') + '".');
}

function buildRuntimeEntry(record) {
  const amountKey = MODE.runtimeList?.amountKey || 'monto';
  const quantityKey = MODE.runtimeList?.quantityKey || 'cantidad';

  return {
    id: record.id || 'item-local-' + Date.now(),
    nombre: record.nombre || 'Item local',
    estado: record.estado || 'listo para demo',
    resumen: 'Registro temporal agregado al flujo local.',
    [amountKey]: Number(record[amountKey]) || 0,
    [quantityKey]: 1,
  };
}

function attachToRuntime(record) {
  if (!MODE.runtimeList?.enabled || !record) {
    return;
  }

  const amountKey = MODE.runtimeList.amountKey || 'monto';
  const quantityKey = MODE.runtimeList.quantityKey || 'cantidad';
  const existing = state.runtimeList.find((entry) => entry.id === record.id);

  if (existing) {
    existing[quantityKey] = Number(existing[quantityKey] || 0) + 1;
  } else {
    state.runtimeList.unshift(buildRuntimeEntry(record));
  }

  setCollection(MODE.runtimeList.collectionKey, state.runtimeList);
  logAction('Se agrego "' + (record.nombre || record.id || 'registro mock') + '" al flujo local.');
}

function removeFromRuntime(record) {
  if (!MODE.runtimeList?.enabled || !record) {
    return;
  }

  state.runtimeList = state.runtimeList.filter((entry) => entry.id !== record.id);
  setCollection(MODE.runtimeList.collectionKey, state.runtimeList);
  logAction('Se quito "' + (record.nombre || record.id || 'registro mock') + '" del flujo local.');
}

function adjustRuntimeQuantity(record, delta) {
  if (!MODE.runtimeList?.enabled || !record) {
    return;
  }

  const quantityKey = MODE.runtimeList.quantityKey || 'cantidad';
  const target = state.runtimeList.find((entry) => entry.id === record.id);

  if (!target) {
    return;
  }

  target[quantityKey] = Number(target[quantityKey] || 0) + delta;

  if (target[quantityKey] <= 0) {
    removeFromRuntime(target);
    return;
  }

  setCollection(MODE.runtimeList.collectionKey, state.runtimeList);
  logAction('Se actualizo la cantidad local de "' + (target.nombre || target.id || 'registro mock') + '".');
}

function runPrimaryFlow() {
  if (!MODE.flowAction?.enabled || !MODE.runtimeList?.enabled) {
    return;
  }

  if (state.runtimeList.length === 0) {
    logAction(MODE.flowAction.emptyLog);
    return;
  }

  const targetCollectionKey = MODE.flowAction.targetCollectionKey;
  const targetCollection = getCollection(targetCollectionKey);
  const amountKey = MODE.runtimeList.amountKey || 'monto';
  const quantityKey = MODE.runtimeList.quantityKey || 'cantidad';
  const total = state.runtimeList.reduce((sum, entry) => {
    return sum + Number(entry[amountKey] || 0) * Number(entry[quantityKey] || 0);
  }, 0);

  targetCollection.unshift({
    id: 'local-' + Date.now(),
    nombre: MODE.flowAction.recordLabel || 'Registro local completado',
    estado: 'simulada',
    resumen: 'Operacion generada localmente para revisar el flujo completo.',
    total,
  });
  setCollection(targetCollectionKey, targetCollection);
  state.runtimeList = [];
  setCollection(MODE.runtimeList.collectionKey, state.runtimeList);
  logAction(MODE.flowAction.successLog);
}

function getPrimaryEditableRecord() {
  const primaryCollection = getCollection(MODE.primaryEditCollectionKey || 'resumen');
  return primaryCollection[0] || null;
}

function renamePrimaryRecord() {
  const record = getPrimaryEditableRecord();

  if (!record) {
    logAction('No hay un registro principal disponible para editar en esta demo local.');
    return;
  }

  const baseName = String(record.nombre || 'Registro mock').replace(/ \\(edicion local\\)$/i, '');
  record.nombre = baseName + ' (edicion local)';
  logAction('Se actualizo el nombre mock de "' + baseName + '".');
}

function bumpPrimaryMetric() {
  const record = getPrimaryEditableRecord();
  const currencyKey = Array.isArray(MODE.currencyKeys) ? MODE.currencyKeys[0] : '';

  if (!record || !currencyKey) {
    logAction('No hay un valor numerico local para ajustar en esta demo.');
    return;
  }

  const currentValue = Number(record[currencyKey] || 0);
  record[currencyKey] = Math.max(0, Math.round(currentValue * 1.05));
  logAction('Se ajusto el valor mock de "' + (record.nombre || record.id || 'registro mock') + '".');
}

function cyclePrimaryRecordState() {
  const record = getPrimaryEditableRecord();

  if (!record) {
    logAction('No hay un registro principal disponible para cambiar de estado.');
    return;
  }

  cycleRecordState(
    record,
    MODE.primaryEditCollectionKey || 'resumen',
    'cycle-primary-state',
    'Se cambio el estado local de',
  );
}

function buildLocalEntry(collectionKey, referenceRecord) {
  const nowSuffix = Date.now().toString().slice(-5);

  if (MODE.kind === 'school-crm') {
    if (collectionKey === 'operacion' || collectionKey === 'seguimientos') {
      return {
        key: 'seguimientos',
        record: {
          id: 'seg-local-' + nowSuffix,
          nombre: 'Seguimiento local ' + nowSuffix,
          responsable: 'Equipo escolar mock',
          estado: 'pendiente',
          proximoPaso:
            referenceRecord && referenceRecord.nombre
              ? 'Revisar accion asociada a ' + referenceRecord.nombre
              : 'Revisar accion pendiente en la bandeja local',
          resumen: 'Seguimiento generado localmente sin datos sensibles reales.',
        },
        logMessage: 'Se registro un seguimiento mock local.',
      };
    }

    return {
      key: 'comunicaciones',
      record: {
        id: 'com-local-' + nowSuffix,
        nombre: 'Comunicacion local ' + nowSuffix,
        canal: 'nota interna mock',
        estado: 'registrada mock',
        destinatario:
          referenceRecord && referenceRecord.nombre
            ? referenceRecord.nombre
            : 'Comunidad educativa mock',
        resumen: 'Comunicacion generada localmente para revisar el flujo interno.',
      },
      logMessage: 'Se registro una comunicacion mock local.',
    };
  }

  if (MODE.kind === 'generic') {
    const targetKey = collectionKey && collectionKey !== 'operacion' ? collectionKey : 'solicitudes';
    return {
      key: targetKey,
      record: {
        id: (targetKey.slice(0, 3) || 'reg') + '-local-' + nowSuffix,
        nombre: 'Registro local ' + nowSuffix,
        estado: targetKey === 'solicitudes' ? 'nueva' : 'listo para demo',
        responsable: 'Equipo mock',
        resumen: 'Alta local generada para revisar el comportamiento del sistema.',
      },
      logMessage:
        targetKey === 'solicitudes'
          ? 'Se creo una solicitud mock local.'
          : 'Se creo un registro mock local.',
    };
  }

  return null;
}

function performAction(actionType, module, record) {
  const workingModule = module || getActiveModule();
  const workingRecord = record || getSelectedRecord(workingModule);

  switch (actionType) {
    case 'select-detail':
      if (workingRecord) {
        state.selectedRecordId = workingRecord.id;
        logAction('Se reviso el detalle local de "' + (workingRecord.nombre || workingRecord.id || 'registro mock') + '".');
      }
      break;
    case 'attach-runtime':
      attachToRuntime(workingRecord);
      break;
    case 'remove-runtime':
      removeFromRuntime(workingRecord);
      break;
    case 'qty-up':
      adjustRuntimeQuantity(workingRecord, 1);
      break;
    case 'qty-down':
      adjustRuntimeQuantity(workingRecord, -1);
      break;
    case 'run-flow':
      runPrimaryFlow();
      break;
    case 'cycle-selected-state':
      cycleRecordState(
        workingRecord,
        workingModule.collectionKey,
        actionType,
        'Se actualizo el estado local de',
      );
      break;
    case 'mark-review':
    case 'review-record':
      cycleRecordState(
        workingRecord,
        workingModule.collectionKey,
        actionType,
        'Se reviso el registro mock',
      );
      break;
    case 'mark-followup':
      cycleRecordState(
        workingRecord,
        workingModule.collectionKey,
        actionType,
        'Se actualizo el seguimiento local de',
      );
      break;
    case 'toggle-review':
      cycleRecordState(
        workingRecord,
        workingModule.collectionKey,
        actionType,
        'Se marco una revision local sobre',
      );
      break;
    case 'register-note': {
      const creation = buildLocalEntry('comunicaciones', workingRecord);
      if (creation) {
        const targetCollection = getCollection(creation.key);
        targetCollection.unshift(creation.record);
        setCollection(creation.key, targetCollection);
        logAction(creation.logMessage);
      }
      break;
    }
    case 'create-entry': {
      const creation = buildLocalEntry(workingModule.collectionKey, workingRecord);
      if (creation) {
        const targetCollection = getCollection(creation.key);
        targetCollection.unshift(creation.record);
        setCollection(creation.key, targetCollection);
        logAction(creation.logMessage);
      }
      break;
    }
    case 'rename-primary':
      renamePrimaryRecord();
      break;
    case 'bump-primary':
      bumpPrimaryMetric();
      break;
    case 'cycle-primary-state':
      cyclePrimaryRecordState();
      break;
    default:
      break;
  }

  ensureSelection(getActiveModule());
  refreshView();
}

function renderWorkspace() {
  const module = getActiveModule();
  const recordsTitle = document.getElementById('records-title');
  const recordsSummary = document.getElementById('records-summary');
  const recordsList = document.getElementById('records-list');

  updateFilterControls(module);
  ensureSelection(module);
  recordsList.innerHTML = '';

  if (!module) {
    recordsTitle.textContent = 'Registros mock';
    recordsSummary.textContent = 'No hay modulos disponibles para esta primera entrega.';
    renderDetailPanel(null, null);
    renderActionPanel({ collectionKey: 'resumen' }, null);
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No hay modulos disponibles para esta primera entrega.';
    recordsList.appendChild(empty);
    return;
  }

  const visibleRecords = getVisibleRecords(module);
  recordsTitle.textContent = module.title;
  recordsSummary.textContent =
    module.summary + ' Se muestran ' + visibleRecords.length + ' registro(s) segun el filtro actual.';

  if (visibleRecords.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = MODE.emptyRecords;
    recordsList.appendChild(empty);
  } else {
    visibleRecords.forEach((record) => {
      recordsList.appendChild(
        renderRecordCard(module, record, record.id === state.selectedRecordId),
      );
    });
  }

  const selectedRecord = getSelectedRecord(module);
  renderDetailPanel(module, selectedRecord);
  renderActionPanel(module, selectedRecord);
}

function renderView() {
  renderModuleNav();
  renderWorkspace();
  renderDatasetOverview();
  renderActivityLog();
  renderStaticLists();
}

function refreshView() {
  updateTitle();
  renderView();
}

function attachStaticEvents() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');

  searchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value || '';
    ensureSelection(getActiveModule());
    refreshView();
  });

  statusFilter.addEventListener('change', (event) => {
    state.statusFilter = event.target.value || '';
    ensureSelection(getActiveModule());
    refreshView();
  });
}

async function bootstrap() {
  await loadLocalData();
  attachStaticEvents();
  refreshView();
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
