const PROJECT_TYPE_REGISTRY = {
  agency_site: { id: 'agency_site', label: 'Sitio de agencia', targetPlatform: 'web' },
  ecommerce: { id: 'ecommerce', label: 'Ecommerce', targetPlatform: 'web' },
  booking_system: { id: 'booking_system', label: 'Sistema de turnos', targetPlatform: 'web' },
  parking_booking: { id: 'parking_booking', label: 'Sistema de estacionamiento', targetPlatform: 'web' },
  dashboard_internal: { id: 'dashboard_internal', label: 'Dashboard interno', targetPlatform: 'web' },
  crm_or_management: { id: 'crm_or_management', label: 'CRM / Gestión', targetPlatform: 'web' },
  mobile_app_mock: { id: 'mobile_app_mock', label: 'App mobile mock', targetPlatform: 'mobile' },
  desktop_app_mock: { id: 'desktop_app_mock', label: 'App desktop mock', targetPlatform: 'desktop' },
  cloud_saas_mock: { id: 'cloud_saas_mock', label: 'SaaS cloud mock', targetPlatform: 'cloud' },
  generic_web_app: { id: 'generic_web_app', label: 'Web app genérica', targetPlatform: 'web' },
}

const CAPABILITY_MATRIX = Object.freeze({
  intake: 'supported',
  docsGeneration: 'supported',
  localMockApp: 'supported',
  realBackend: 'not_yet',
  realDatabase: 'not_yet',
  realAuth: 'not_yet',
  payments: 'not_yet',
  cloudDeploy: 'not_yet',
  fullQaPipeline: 'not_yet',
  marketRadar: 'not_yet',
  hermesScoutResearch: 'not_yet',
  codexBuildLoop: 'not_yet',
  productionRelease: 'not_yet',
  validatedMemory: 'not_yet',
})

const PLATFORM_IDS = Object.freeze(['web', 'mobile', 'desktop', 'cloud', 'local_mock'])
const GENERATION_PROFILE_IDS = Object.freeze(['factory_typed', 'commercial_site'])

function normalizeSearchText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLowerCase()
}

function isKnownProjectType(projectType) {
  return typeof projectType === 'string' && Object.hasOwn(PROJECT_TYPE_REGISTRY, projectType)
}

function getProjectTypeDefinition(projectType) {
  return isKnownProjectType(projectType)
    ? PROJECT_TYPE_REGISTRY[projectType]
    : PROJECT_TYPE_REGISTRY.generic_web_app
}

function detectTargetPlatform(text) {
  const normalized = normalizeSearchText(text)
  if (/\b(mobile|movil|android|ios)\b/u.test(normalized)) return 'mobile'
  if (/\b(desktop|escritorio|windows|exe)\b/u.test(normalized)) return 'desktop'
  if (/\b(cloud|saas|nube)\b/u.test(normalized)) return 'cloud'
  return /\b(web|sitio|landing|ecommerce|dashboard|panel|crm|turnos|reservas)\b/u.test(normalized)
    ? 'web'
    : 'local_mock'
}

function detectProjectType(text) {
  const normalized = normalizeSearchText(text)
  if (/\b(agencia|portfolio|marketing|institucional)\b/u.test(normalized)) return 'agency_site'
  if (/\b(ecommerce|tienda|carrito|checkout|catalogo)\b/u.test(normalized)) return 'ecommerce'
  if (/\b(estacionamiento|cochera|parking|patente)\b/u.test(normalized)) return 'parking_booking'
  if (/\b(turnos|reservas|agenda|calendario|citas)\b/u.test(normalized)) return 'booking_system'
  if (/\b(crm|clientes|pipeline|oportunidades)\b/u.test(normalized)) return 'crm_or_management'
  if (/\b(dashboard|metricas|reportes|gestion interna)\b/u.test(normalized)) return 'dashboard_internal'
  const platform = detectTargetPlatform(normalized)
  if (platform === 'mobile') return 'mobile_app_mock'
  if (platform === 'desktop') return 'desktop_app_mock'
  if (platform === 'cloud') return 'cloud_saas_mock'
  return 'generic_web_app'
}

module.exports = {
  PROJECT_TYPE_REGISTRY,
  CAPABILITY_MATRIX,
  PLATFORM_IDS,
  GENERATION_PROFILE_IDS,
  normalizeSearchText,
  isKnownProjectType,
  getProjectTypeDefinition,
  detectTargetPlatform,
  detectProjectType,
}
