const path = require('path')
const registry = require('./jefe-project-registry.cjs')

const CONTRACT_VERSION = 'jefe-project-contract/v1'
const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u
const VISUAL_DIRECTIONS = Object.freeze(['editorial', 'comercial', 'expresiva'])
const CHANGE_ORIGINS = Object.freeze(['factory', 'commercial', 'integration', 'legacy', 'manual'])
const DELIVERY_STATUSES = Object.freeze(['not_ready', 'local_registered', 'delivered_local'])

class ProjectContractError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'ProjectContractError'
    this.code = code
    this.details = details
  }
}

function fail(code, message, details) {
  throw new ProjectContractError(code, message, details)
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function optionalText(value, field, maxLength = 280) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') fail('INVALID_TEXT', `${field} debe ser texto o nulo.`, { field })
  const normalized = value.trim().replace(/\s+/gu, ' ')
  if (normalized.length > maxLength) fail('TEXT_TOO_LONG', `${field} supera el máximo permitido.`, { field, maxLength })
  return normalized || null
}

function normalizeId(value, field, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) fail('MISSING_ID', `${field} es obligatorio.`, { field })
    return null
  }
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    fail('INVALID_ID', `${field} debe usar identificadores estables en minúsculas y guiones.`, { field })
  }
  return value
}

function normalizeTimestamp(value, field) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    fail('INVALID_TIMESTAMP', `${field} debe ser un timestamp ISO válido o nulo.`, { field })
  }
  return new Date(value).toISOString()
}

function normalizeColor(value, field) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/iu.test(value.trim())) {
    fail('INVALID_COLOR', `${field} debe ser un color hexadecimal de seis dígitos o nulo.`, { field })
  }
  return value.trim().toUpperCase()
}

function normalizeBrandSpec(value) {
  const source = isObject(value) ? value : {}
  return {
    name: optionalText(source.name, 'brandSpec.name', 120),
    primaryColor: normalizeColor(source.primaryColor, 'brandSpec.primaryColor'),
    accentColor: normalizeColor(source.accentColor, 'brandSpec.accentColor'),
    visualNotes: optionalText(source.visualNotes, 'brandSpec.visualNotes', 1200),
  }
}

function normalizeInputAssets(value) {
  const source = isObject(value) ? value : {}
  const sourceFiles = Array.isArray(source.files) ? source.files : []
  const files = sourceFiles.map((entry, index) => {
    const file = isObject(entry) ? entry : {}
    const safeName = optionalText(file.safeName || file.name, `inputAssets.files[${index}].safeName`, 180)
    if (!safeName) fail('INVALID_ASSET', 'Cada Input Asset debe tener un nombre seguro.', { index })
    if (/[\\/]/u.test(safeName)) fail('INVALID_ASSET', 'Input Assets no acepta rutas como nombre de archivo.', { index })
    return {
      safeName,
      kind: optionalText(file.kind, `inputAssets.files[${index}].kind`, 80) || 'other',
      sizeBytes: Number.isInteger(file.sizeBytes) && file.sizeBytes >= 0 ? file.sizeBytes : null,
    }
  }).sort((left, right) => left.safeName.localeCompare(right.safeName))
  const colors = (Array.isArray(source.detectedHexColors) ? source.detectedHexColors : [])
    .map((color, index) => normalizeColor(color, `inputAssets.detectedHexColors[${index}]`))
    .filter(Boolean)
    .sort()
  return {
    manifestId: normalizeId(source.manifestId, 'inputAssets.manifestId'),
    files,
    totalFiles: files.length,
    detectedHexColors: [...new Set(colors)],
    visualNotes: optionalText(source.visualNotes, 'inputAssets.visualNotes', 1200),
  }
}

function normalizeAllowedRoots(value) {
  const roots = Array.isArray(value) ? value : []
  return roots.map((root, index) => {
    if (typeof root !== 'string' || !path.isAbsolute(root)) {
      fail('INVALID_ALLOWED_ROOT', 'Cada raíz permitida debe ser una ruta absoluta.', { index })
    }
    return path.resolve(root)
  })
}

function normalizeScopedPath(value, field, allowedRoots) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    fail('INVALID_PATH', `${field} debe ser una ruta absoluta o nula.`, { field })
  }
  if (allowedRoots.length === 0) {
    fail('MISSING_PATH_SCOPE', `${field} requiere raíces permitidas explícitas.`, { field })
  }
  const resolved = path.resolve(value)
  const inside = allowedRoots.some((root) => {
    const relative = path.relative(root, resolved)
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  })
  if (!inside) fail('PATH_OUTSIDE_SCOPE', `${field} queda fuera del scope permitido.`, { field, value: resolved })
  return resolved
}

function normalizePhysicalPaths(value, allowedRoots) {
  const source = isObject(value) ? value : {}
  return {
    projectRoot: normalizeScopedPath(source.projectRoot, 'physicalPaths.projectRoot', allowedRoots),
    manifestPath: normalizeScopedPath(source.manifestPath, 'physicalPaths.manifestPath', allowedRoots),
    deliveryPath: normalizeScopedPath(source.deliveryPath, 'physicalPaths.deliveryPath', allowedRoots),
  }
}

function normalizeDelivery(value, physicalPaths, allowedRoots) {
  const source = isObject(value) ? value : {}
  const status = source.status || 'not_ready'
  if (!DELIVERY_STATUSES.includes(status)) fail('INVALID_DELIVERY_STATUS', 'El estado de entrega no es válido.', { status })
  const localPath = normalizeScopedPath(source.localPath || physicalPaths.deliveryPath, 'delivery.localPath', allowedRoots)
  const deliveredAt = normalizeTimestamp(source.deliveredAt, 'delivery.deliveredAt')
  if (status === 'not_ready' && (localPath || deliveredAt)) {
    fail('INVALID_DELIVERY', 'Una entrega no lista no puede declarar ruta ni fecha de entrega.', { status })
  }
  if (status === 'local_registered' && !localPath) {
    fail('MISSING_DELIVERY_PATH', 'La entrega local registrada requiere una ruta validada.', { status })
  }
  if (status === 'delivered_local' && (!localPath || !deliveredAt)) {
    fail('MISSING_DELIVERY_EVIDENCE', 'La entrega local requiere ruta validada y timestamp.', { status })
  }
  return { status, localPath, deliveredAt }
}

function normalizeVersions(value, allowedRoots) {
  const source = Array.isArray(value) ? value : []
  const seen = new Set()
  const versions = source.map((entry, index) => {
    if (!isObject(entry)) fail('INVALID_VERSION', 'Cada versión debe ser un objeto.', { index })
    const versionId = normalizeId(entry.versionId, `versions[${index}].versionId`, { required: true })
    const runId = normalizeId(entry.runId, `versions[${index}].runId`, { required: true })
    if (versionId === runId) fail('IDENTITY_COLLISION', 'versionId y runId no pueden ser iguales.', { index })
    if (seen.has(versionId)) fail('DUPLICATE_VERSION', 'versionId debe ser único dentro del proyecto.', { versionId })
    seen.add(versionId)
    const deliveryPath = normalizeScopedPath(entry.deliveryPath, `versions[${index}].deliveryPath`, allowedRoots)
    return {
      versionId,
      runId,
      createdAt: normalizeTimestamp(entry.createdAt, `versions[${index}].createdAt`),
      changeOrigin: normalizeChangeOrigin(entry.changeOrigin),
      deliveryPath,
      summary: optionalText(entry.summary, `versions[${index}].summary`, 500),
    }
  })
  return versions.sort((left, right) => left.versionId.localeCompare(right.versionId))
}

function normalizeChangeOrigin(value) {
  const source = isObject(value) ? value : {}
  const kind = source.kind || 'legacy'
  if (!CHANGE_ORIGINS.includes(kind)) fail('INVALID_CHANGE_ORIGIN', 'El origen del cambio no es válido.', { kind })
  return { kind, reference: optionalText(source.reference, 'changeOrigin.reference', 180) }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!isObject(value)) return value
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key])
    return result
  }, {})
}

function normalizeProjectContract(value, options = {}) {
  if (!isObject(value)) fail('INVALID_CONTRACT', 'El contrato de proyecto debe ser un objeto.', {})
  const allowedRoots = normalizeAllowedRoots(options.allowedRoots)
  const projectId = normalizeId(value.projectId || value.id, 'projectId', { required: true })
  const projectType = value.projectType || 'generic_web_app'
  if (!registry.isKnownProjectType(projectType)) fail('INVALID_PROJECT_TYPE', 'El tipo de proyecto no está registrado.', { projectType })
  const profile = value.generationProfile || 'factory_typed'
  if (!registry.GENERATION_PROFILE_IDS.includes(profile)) fail('INVALID_GENERATION_PROFILE', 'El perfil de generación no es válido.', { profile })
  const platform = value.platform || registry.getProjectTypeDefinition(projectType).targetPlatform || 'local_mock'
  if (!registry.PLATFORM_IDS.includes(platform)) fail('INVALID_PLATFORM', 'La plataforma no es válida.', { platform })
  if (profile === 'commercial_site' && platform !== 'web') {
    fail('PROFILE_PLATFORM_MISMATCH', 'El perfil commercial_site sólo admite plataforma web.', { profile, platform })
  }
  const visualDirection = value.visualDirection === null || value.visualDirection === undefined || value.visualDirection === ''
    ? null
    : value.visualDirection
  if (visualDirection && !VISUAL_DIRECTIONS.includes(visualDirection)) {
    fail('INVALID_VISUAL_DIRECTION', 'La dirección visual no es válida.', { visualDirection })
  }
  const physicalPaths = normalizePhysicalPaths(value.physicalPaths, allowedRoots)
  const versions = normalizeVersions(value.versions, allowedRoots)
  const activeVersionId = normalizeId(value.activeVersionId || value.versionId, 'activeVersionId')
  if (activeVersionId && !versions.some((version) => version.versionId === activeVersionId)) {
    fail('UNKNOWN_ACTIVE_VERSION', 'La versión activa debe existir dentro de versions.', { activeVersionId })
  }
  const runId = normalizeId(value.runId, 'runId')
  if (runId && runId === projectId) fail('IDENTITY_COLLISION', 'projectId y runId no pueden ser iguales.', {})
  if (versions.some((version) => version.versionId === projectId || version.runId === projectId)) {
    fail('IDENTITY_COLLISION', 'projectId no puede coincidir con un runId o versionId.', { projectId })
  }
  const delivery = normalizeDelivery(value.delivery, physicalPaths, allowedRoots)
  if (delivery.status !== 'not_ready' && !activeVersionId) {
    fail('DELIVERY_WITHOUT_VERSION', 'No puede registrarse entrega sin una versión activa.', {})
  }
  return stableValue({
    schemaVersion: CONTRACT_VERSION,
    projectId,
    runId,
    projectType,
    platform,
    generationProfile: profile,
    visualDirection,
    brandSpec: normalizeBrandSpec(value.brandSpec),
    inputAssets: normalizeInputAssets(value.inputAssets),
    manifest: {
      manifestId: normalizeId(value.manifest && value.manifest.manifestId, 'manifest.manifestId'),
      schemaVersion: optionalText(value.manifest && value.manifest.schemaVersion, 'manifest.schemaVersion', 120) || CONTRACT_VERSION,
    },
    physicalPaths,
    timestamps: {
      createdAt: normalizeTimestamp(value.timestamps && value.timestamps.createdAt, 'timestamps.createdAt'),
      updatedAt: normalizeTimestamp(value.timestamps && value.timestamps.updatedAt, 'timestamps.updatedAt'),
    },
    changeOrigin: normalizeChangeOrigin(value.changeOrigin),
    delivery,
    versions,
    activeVersionId,
  })
}

function validateProjectContract(value, options = {}) {
  try {
    return { valid: true, value: normalizeProjectContract(value, options), errors: [] }
  } catch (error) {
    if (error instanceof ProjectContractError) return { valid: false, value: null, errors: [{ code: error.code, message: error.message, details: error.details }] }
    throw error
  }
}

function serializeProjectContract(value, options = {}) {
  return JSON.stringify(normalizeProjectContract(value, options), null, 2)
}

function deserializeProjectContract(serialized, options = {}) {
  if (typeof serialized !== 'string') fail('INVALID_SERIALIZED_CONTRACT', 'El contrato serializado debe ser texto JSON.', {})
  try {
    return normalizeProjectContract(JSON.parse(serialized), options)
  } catch (error) {
    if (error instanceof ProjectContractError) throw error
    fail('INVALID_SERIALIZED_CONTRACT', 'El contrato serializado no contiene JSON válido.', {})
  }
}

module.exports = {
  CONTRACT_VERSION,
  VISUAL_DIRECTIONS,
  CHANGE_ORIGINS,
  DELIVERY_STATUSES,
  ProjectContractError,
  normalizeProjectContract,
  validateProjectContract,
  serializeProjectContract,
  deserializeProjectContract,
}
