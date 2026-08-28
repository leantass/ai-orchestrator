const crypto = require('crypto')

const SCHEMA_VERSION = 'jefe-product-planning/v1'
const DIRECTIONS = Object.freeze(['editorial', 'comercial', 'expresiva'])
const PRODUCT_TYPES = Object.freeze(['agency_site', 'ecommerce', 'booking_system', 'parking_booking', 'dashboard_internal', 'crm_or_management', 'generic_web_app', 'mobile_app_mock', 'desktop_app_mock', 'cloud_saas_mock'])
const INTERNAL_TERMS = [
  /cambio solicitado/iu,
  /actualizaci[oó]n:/iu,
  /qa workspace interno/iu,
  /mock tipado/iu,
  /json de capacidades/iu,
  /(?:projectId|runId|versionId|briefId|planning)\s*[:=]/u,
]
const INVALID_UTF8_TEXT = /(?:Ã.|Â.|ï¿½|�|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}\?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})/u

const PRODUCT_PROFILES = Object.freeze({
  agency_site: {
    label: 'sitio de servicios',
    defaultCta: 'Solicitar una conversación',
    sections: {
      editorial: ['inicio', 'relato', 'servicios', 'confianza', 'faq', 'contacto'],
      comercial: ['inicio', 'beneficios', 'confianza', 'faq', 'conversion'],
      expresiva: ['inicio', 'obras', 'confianza', 'faq', 'contacto'],
    },
  },
  ecommerce: {
    label: 'catálogo digital',
    defaultCta: 'Explorar la colección',
    sections: {
      editorial: ['inicio', 'historia', 'colecciones', 'confianza', 'faq', 'contacto'],
      comercial: ['inicio', 'colecciones', 'destacados', 'confianza', 'faq', 'conversion'],
      expresiva: ['inicio', 'universo', 'piezas', 'confianza', 'faq', 'contacto'],
    },
  },
  generic_web_app: {
    label: 'producto digital',
    defaultCta: 'Probar la experiencia',
    sections: {
      editorial: ['inicio', 'historia', 'funcionalidades', 'confianza', 'faq', 'contacto'],
      comercial: ['inicio', 'funcionalidades', 'flujo', 'confianza', 'faq', 'conversion'],
      expresiva: ['inicio', 'modulos', 'flujo', 'confianza', 'faq', 'contacto'],
    },
  },
  internal_dashboard: {
    label: 'herramienta operativa',
    defaultCta: 'Solicitar una demostración',
    sections: {
      editorial: ['inicio', 'contexto', 'capacidades', 'confianza', 'faq', 'contacto'],
      comercial: ['inicio', 'capacidades', 'flujo', 'confianza', 'faq', 'conversion'],
      expresiva: ['inicio', 'paneles', 'flujo', 'confianza', 'faq', 'contacto'],
    },
  },
  game_prototype: {
    label: 'experiencia interactiva',
    defaultCta: 'Entrar a la experiencia',
    sections: {
      editorial: ['inicio', 'universo', 'mecanicas', 'comunidad', 'faq', 'contacto'],
      comercial: ['inicio', 'mecanicas', 'progresion', 'comunidad', 'faq', 'conversion'],
      expresiva: ['inicio', 'mundo', 'desafio', 'comunidad', 'faq', 'contacto'],
    },
  },
})

class ProductPlanningError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ProductPlanningError'; this.code = code; this.details = details }
}
function fail(code, message, details) { throw new ProductPlanningError(code, message, details) }
function plain(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function text(value, field, max = 1200, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') fail('INVALID_PLANNING_TEXT', `${field} debe ser texto.`)
  const clean = value.trim().replace(/\s+/gu, ' ')
  if (INVALID_UTF8_TEXT.test(clean)) fail('INVALID_UTF8_TEXT', `${field} contiene corrupción UTF-8.`, { field })
  if (clean.length > max) fail('PLANNING_TEXT_TOO_LONG', `${field} supera el máximo.`, { field, max })
  return clean || fallback
}
function list(value, field, max = 24) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > max) fail('INVALID_PLANNING_LIST', `${field} debe ser una lista acotada.`)
  return [...new Set(value.map((item) => text(item, field, 300)).filter(Boolean))]
}
function color(value) {
  if (!value) return null
  const clean = text(value, 'color', 20).toUpperCase()
  return /^#[0-9A-F]{6}$/u.test(clean) ? clean : null
}
function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex').slice(0, 24) }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (!plain(value)) return value
  return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out }, {})
}
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(freeze)
  return Object.freeze(value)
}
function repairLegacyText(value) {
  if (typeof value !== 'string') return value
  const replacements = {
    'pr?ximo': 'próximo', 'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã±': 'ñ',
    'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‘': 'Ñ', 'Â¿': '¿', 'Â¡': '¡', 'Ã§': 'ç',
  }
  return Object.entries(replacements).reduce((result, [from, to]) => result.replaceAll(from, to), value)
}
function migrateLegacyPlanning(value) {
  if (!plain(value)) fail('INVALID_PRODUCT_PLANNING', 'La planificación histórica no es un objeto válido.')
  const migrated = JSON.parse(JSON.stringify(value), (_key, item) => repairLegacyText(item))
  if (migrated.brief?.briefId) {
    if (migrated.strategy) migrated.strategy.briefId = migrated.brief.briefId
    if (migrated.content) migrated.content.briefId = migrated.brief.briefId
  }
  return validateProductPlanning(migrated)
}
function direction(value) {
  const clean = text(value, 'visualDirection', 20, 'comercial')
  if (!DIRECTIONS.includes(clean)) fail('INVALID_PLANNING_DIRECTION', 'La dirección visual no está soportada.', { value: clean })
  return clean
}
function sentence(value, fallback) {
  const clean = text(value, 'sentence', 600, fallback)
  const normalized = clean.replace(/[.!?]+$/u, '')
  return normalized.charAt(0).toLocaleUpperCase('es-AR') + normalized.slice(1) + '.'
}
function question(value, fallback) {
  const clean = text(value, 'question', 400, fallback).replace(/[.!?]+$/u, '')
  return `¿${clean.charAt(0).toLocaleUpperCase('es-AR') + clean.slice(1)}?`
}
function classification(request) {
  const lower = request.toLowerCase()
  if (/faq|pregunta|contenido|texto|beneficio|confianza|testimonio/iu.test(lower)) return 'content'
  if (/estructura|sección|seccion|navegación|navegacion/iu.test(lower)) return 'structure'
  if (/visual|color|tipograf|estilo|paleta/iu.test(lower)) return 'visual'
  if (/interacción|interaccion|formulario|botón|boton/iu.test(lower)) return 'interaction'
  if (/técnic|tecnic|performance|rendimiento/iu.test(lower)) return 'technical'
  return 'content'
}
function trace(source, decision, component, qaCriteria) { return { source, decision, component, qaCriteria } }
function profileFor(productType) { return PRODUCT_PROFILES[productType] || PRODUCT_PROFILES.generic_web_app }
function deriveBenefits(productType, audience, businessType) {
  const profile = profileFor(productType)
  return [
    `Una propuesta de ${profile.label} pensada para ${audience}.`,
    `Un recorrido claro para entender ${businessType} y decidir con contexto.`,
    'Un próximo paso concreto, sin fricción ni promesas imposibles.',
  ]
}
function deriveTrust(productType, audience) {
  const profile = profileFor(productType)
  return [
    `Diseñado alrededor de las necesidades de ${audience}.`,
    `Criterio y acompañamiento para usar ${profile.label} con confianza.`,
    'Alcance visible y decisiones explicadas desde el comienzo.',
  ]
}
function deriveFaq(productType, audience) {
  const profile = profileFor(productType)
  return [
    { question: question(`Qué incluye la primera experiencia con ${profile.label}`, 'Qué incluye la primera experiencia'), answer: sentence(`Ordenamos la necesidad de ${audience} y mostramos el recorrido más conveniente`, 'Ordenamos la necesidad y mostramos un recorrido claro') },
    { question: question('Puedo empezar con una idea inicial', 'Puedo empezar con una idea inicial'), answer: sentence('Sí, la propuesta toma esa idea y la convierte en un próximo paso entendible', 'Sí, la propuesta toma esa idea y la convierte en un próximo paso entendible') },
  ]
}
function buildExperience(strategy, sections, primaryCta) {
  return {
    experiencePlanId: 'experience-' + digest({ strategy, sections }), strategyId: strategy.strategyId,
    pages: [{ path: '/', purpose: 'presentar la propuesta y conducir a la acción' }], sections,
    navigation: sections.filter((item) => item !== 'inicio'), hierarchy: ['propuesta principal', 'evidencia de valor', 'acción primaria'],
    states: ['initial', 'form_error', 'form_success'], forms: [{ id: 'primary-contact', fields: ['name', 'email'], submitAction: primaryCta, persistence: 'local_only' }],
    interactions: ['anclas de navegación', 'CTA hacia contacto', 'validación local del formulario', 'cambio de tema local'],
    responsive: ['desktop', 'tablet', 'mobile'], accessibility: ['landmarks', 'labels', 'aria-live feedback', 'visible focus'],
  }
}
function buildVisual(brief, visualDirection) {
  const defaults = {
    editorial: { primary: '#26211D', accent: '#C56B3F', surface: '#F6F0E7', text: '#26211D', darkSurface: '#201B18', components: ['editorial navigation', 'story hero', 'service cards', 'trust proof', 'faq', 'conversion form', 'theme toggle', 'feedback'] },
    comercial: { primary: '#1E1B18', accent: '#E87524', surface: '#F7F1E8', text: '#1E1B18', darkSurface: '#1E1B18', components: ['commercial navigation', 'value hero', 'benefit cards', 'trust proof', 'faq', 'conversion form', 'theme toggle', 'feedback'] },
    expresiva: { primary: '#18252A', accent: '#D95F45', surface: '#FFF4EA', text: '#18252A', darkSurface: '#102025', components: ['expressive rail', 'poster hero', 'feature gallery', 'trust proof', 'faq', 'conversion form', 'theme toggle', 'feedback'] },
  }[visualDirection]
  const requested = brief.visualPreferences.colors.filter(Boolean)
  const palette = { ...defaults, primary: requested[0] || defaults.primary, accent: requested[1] || defaults.accent }
  return {
    visualSystemId: 'visual-' + digest({ direction: visualDirection, palette, components: defaults.components }), direction: visualDirection,
    palette: { primary: palette.primary, accent: palette.accent, surface: palette.surface, text: palette.text, darkSurface: palette.darkSurface },
    typography: { family: brief.visualPreferences.typography, scale: ['0.875rem', '1rem', '1.25rem', 'clamp(2.75rem, 7vw, 6.5rem)'] },
    spacing: ['8px', '16px', '32px', '72px'], borders: 'sutiles y precisos', shadows: 'profundidad contenida en superficies de conversión',
    components: defaults.components, states: ['default', 'hover', 'focus-visible', 'error', 'success'], themes: ['claro', 'oscuro'], responsiveBehavior: 'una columna debajo de 640px; navegación legible y sin overflow',
  }
}
function buildPlan(strategy, experience, visual, content) {
  const sectionContracts = experience.sections.map((section) => ({ id: section, component: section === 'inicio' ? 'hero' : section === 'conversion' || section === 'contacto' ? 'conversion-form' : section, source: `ExperiencePlan.sections.${section}`, qaCriteria: 'section exists exactly once and is customer-facing' }))
  const traceability = [
    trace('brief.valueProposition', 'ContentPlan.title', 'hero h1', 'title is present and legible'), trace('brief.problem', 'ContentPlan.subtitle', 'hero .lede', 'subtitle is coherent and punctuated'),
    trace('brief.primaryCta', 'ExperiencePlan.forms.submitAction', 'conversion form button', 'CTA is styled and local'), trace('ContentPlan.benefits', 'BuildPlan.sections', 'benefit cards', 'planned section exists'),
    trace('ContentPlan.trust', 'BuildPlan.sections', 'trust proof', 'trust content exists'), trace('ContentPlan.faq', 'BuildPlan.sections', 'details/summary', 'FAQ is rendered'), trace('VisualSystem.palette', 'BuildPlan.tokens', 'CSS variables', 'tokens appear in CSS'),
  ]
  return { buildPlanId: 'build-' + digest({ strategy, experience, visual, content }), strategyId: strategy.strategyId, experiencePlanId: experience.experiencePlanId, visualSystemId: visual.visualSystemId, contentPlanId: content.contentPlanId, components: visual.components, resources: ['app/index.html', 'app/styles.css', 'app/app.js'], sectionContracts, traceability, qaCriteria: ['content derives from brief', 'revision remains separate from brief', 'direction changes composition, palette, components and rhythm', 'form validates locally', 'responsive without horizontal overflow', 'no browser defaults', 'no internal instruction leakage', 'all planned sections are present', 'no external network'], expectedArtifacts: ['README.md', 'docs/BRAND.md', 'docs/DELIVERY.md', 'data/planning.json', 'app/index.html', 'app/styles.css', 'app/app.js'] }
}

function createProductPlanning(input = {}) {
  const source = plain(input) ? input : {}
  const briefText = text(source.brief, 'brief', 4000)
  const projectName = text(source.projectName, 'projectName', 120, 'Proyecto sin nombre')
  const productType = PRODUCT_TYPES.includes(source.productType) ? source.productType : 'agency_site'
  const profile = profileFor(productType)
  const audience = text(source.audience, 'audience', 360, 'personas que necesitan una solución clara')
  const businessType = text(source.businessType, 'businessType', 240, profile.label)
  const proposition = text(source.proposition, 'proposition', 600, `Una experiencia de ${profile.label} clara para ${audience}.`)
  const objective = text(source.objective, 'objective', 600, briefText || `Construir una experiencia para ${audience}.`)
  const primaryCta = text(source.primaryCta, 'primaryCta', 120, profile.defaultCta)
  const visualDirection = direction(source.visualDirection || source.direction)
  const materials = plain(source.materials) ? source.materials : {}
  const materialFiles = Array.isArray(materials.files) ? materials.files.map((item) => typeof item === 'string' ? item : item && (item.safeName || item.name)).filter(Boolean) : []
  const brief = {
    schemaVersion: SCHEMA_VERSION, briefId: 'brief-' + digest({ projectName, briefText, audience, proposition, objective, productType, visualDirection }), projectName, objective, audience,
    problem: sentence(source.problem, `La audiencia necesita resolver una decisión de ${profile.label} con confianza`), valueProposition: sentence(proposition, `Una experiencia de ${profile.label} clara para ${audience}`), productType,
    tone: text(source.tone, 'tone', 120, 'claro, sereno y confiable'), primaryCta, constraints: list(source.constraints, 'constraints'),
    materials: { files: list(materialFiles, 'materials.files'), references: list(materials.references || materials.urlReferences, 'materials.references'), colors: (Array.isArray(materials.colors) ? materials.colors : []).map(color).filter(Boolean), notes: text(materials.notes, 'materials.notes', 600) },
    visualPreferences: { direction: visualDirection, colors: (Array.isArray(source.colors) ? source.colors : String(source.colors || '').split(',')).map(color).filter(Boolean), typography: text(source.typography, 'typography', 120, 'serif editorial para titulares y sans serif legible para interfaz'), preferences: text(source.visualNotes || source.notes, 'visualPreferences.preferences', 600) }, source: { kind: 'user_brief', reference: 'commercial-intake' },
  }
  const strategy = { strategyId: 'strategy-' + digest(brief), briefId: brief.briefId, product: `${profile.label} orientado a ${audience}.`, audience: brief.audience, userAction: brief.primaryCta, primaryMessage: brief.valueProposition, requiredContent: ['propuesta de valor', 'beneficios concretos', 'prueba de confianza', 'preguntas frecuentes', 'llamada a la acción'], outOfScope: ['backend remoto', 'pagos', 'autenticación', 'deploy automático'] }
  const sections = [...profile.sections[visualDirection]]
  const experience = buildExperience(strategy, sections, brief.primaryCta)
  const visual = buildVisual(brief, visualDirection)
  const content = { contentPlanId: 'content-' + digest({ brief, strategy, sections }), briefId: brief.briefId, navigation: sections.filter((item) => item !== 'inicio').map((item) => item === 'conversion' || item === 'contacto' ? 'Contacto' : item[0].toUpperCase() + item.slice(1)), title: brief.valueProposition, subtitle: sentence(`${brief.problem} Pensado para ${audience}`, `Una experiencia clara para ${audience}`), benefits: deriveBenefits(productType, audience, businessType), trust: deriveTrust(productType, audience), faq: deriveFaq(productType, audience), ctas: [brief.primaryCta], forms: [{ fields: ['Nombre', 'Email'], action: brief.primaryCta }], errors: ['Completá tu nombre y email para continuar.'], confirmations: ['Tu solicitud quedó preparada localmente para revisión.'], contextual: { businessType, audience, objective, productType } }
  const build = buildPlan(strategy, experience, visual, content)
  return freeze({ schemaVersion: SCHEMA_VERSION, revision: 0, brief, strategy, experience, visual, content, build, revisions: [], changeHistory: [] })
}

function evolveProductPlanning(previous, changeRequest, source = {}) {
  const base = previous && previous.brief ? validateProductPlanning(previous) : createProductPlanning(source)
  const request = text(changeRequest, 'changeRequest', 800)
  const lower = request.toLowerCase(); const kind = classification(request); const faqRequested = /faq|pregunta frecuente|preguntas frecuentes/iu.test(lower)
  const productType = base.brief.productType || base.content.contextual.productType || 'agency_site'
  const sourcePlanning = createProductPlanning({ projectName: base.brief.projectName, brief: base.brief.objective, objective: base.brief.objective, businessType: base.content.contextual.businessType, audience: base.brief.audience, proposition: base.brief.valueProposition, problem: base.brief.problem, primaryCta: base.brief.primaryCta, tone: base.brief.tone, productType, visualDirection: source.visualDirection || base.visual.direction, colors: base.brief.visualPreferences.colors, typography: base.brief.visualPreferences.typography })
  const sections = faqRequested ? [...new Set([...base.experience.sections, 'confianza', 'faq'])] : [...sourcePlanning.experience.sections]
  const revisedExperience = buildExperience({ ...sourcePlanning.strategy, briefId: base.brief.briefId }, sections, base.brief.primaryCta)
  const revisedFaq = faqRequested ? [...base.content.faq, { question: '¿Qué información conviene preparar?', answer: 'Podés compartir el contexto y la prioridad; el recorrido se adapta a esa información.' }] : sourcePlanning.content.faq
  const revisedTrust = faqRequested ? [...base.content.trust, 'Información y próximos pasos visibles antes de avanzar.'] : sourcePlanning.content.trust
  const revisedContent = { ...sourcePlanning.content, contentPlanId: 'content-' + digest({ baseBriefId: base.brief.briefId, revision: base.revision + 1, request }), briefId: base.brief.briefId, faq: revisedFaq, trust: revisedTrust }
  const routedPlans = faqRequested ? ['ExperiencePlan', 'ContentPlan', 'BuildPlan'] : kind === 'visual' ? ['VisualSystem', 'BuildPlan'] : kind === 'structure' ? ['ExperiencePlan', 'BuildPlan'] : kind === 'interaction' ? ['ExperiencePlan', 'BuildPlan'] : kind === 'technical' ? ['BuildPlan'] : ['ContentPlan', 'BuildPlan']
  const revision = { revision: base.revision + 1, revisionId: 'revision-' + digest({ base: base.brief.briefId, request, number: base.revision + 1 }), baseBriefId: base.brief.briefId, request, classification: kind, routedPlans, routedTo: routedPlans[0], customerFacing: false, source: 'explicit_user_change' }
  const revisedBuild = buildPlan({ ...sourcePlanning.strategy, briefId: base.brief.briefId }, revisedExperience, sourcePlanning.visual, revisedContent)
  return freeze({ ...sourcePlanning, brief: base.brief, strategy: { ...sourcePlanning.strategy, briefId: base.brief.briefId }, experience: revisedExperience, content: revisedContent, build: revisedBuild, revision: base.revision + 1, revisions: [...(base.revisions || []), revision], changeHistory: [...(base.changeHistory || []), revision] })
}

function validateProductPlanning(value) {
  if (!plain(value) || value.schemaVersion !== SCHEMA_VERSION || !value.brief || !value.strategy || !value.experience || !value.visual || !value.content || !value.build) fail('INVALID_PRODUCT_PLANNING', 'El bundle de planificación está incompleto.')
  if (!PRODUCT_TYPES.includes(value.brief.productType) || !DIRECTIONS.includes(value.visual.direction)) fail('INVALID_PRODUCT_PLANNING', 'El tipo de producto o la dirección visual son inválidos.')
  if (value.content.briefId !== value.brief.briefId || value.strategy.briefId !== value.brief.briefId) fail('PLANNING_BRIEF_ID_DRIFT', 'La planificación contiene briefId divergentes.')
  if (INVALID_UTF8_TEXT.test(JSON.stringify(value))) fail('INVALID_UTF8_TEXT', 'La planificación contiene corrupción UTF-8.')
  if (!Array.isArray(value.experience.sections) || !Array.isArray(value.build.sectionContracts) || new Set(value.experience.sections).size !== value.experience.sections.length) fail('INVALID_PRODUCT_PLANNING', 'La experiencia no tiene contratos de sección únicos.')
  const planned = new Set(value.experience.sections); const contracted = new Set(value.build.sectionContracts.map((item) => item.id))
  if (planned.size !== contracted.size || [...planned].some((section) => !contracted.has(section))) fail('INVALID_PRODUCT_PLANNING', 'Las secciones de experiencia y build no coinciden.')
  if (!Array.isArray(value.content.benefits) || !Array.isArray(value.content.trust) || !Array.isArray(value.content.faq) || !value.content.ctas?.length) fail('INVALID_PRODUCT_PLANNING', 'El contenido no tiene sus salidas customer-facing completas.')
  return freeze(stable(value))
}
function validateGeneratedArtifact(planning, artifacts) {
  const html = String(artifacts.html || ''); const css = String(artifacts.css || ''); const js = String(artifacts.js || '')
  if (!planning || !html || !css || !js) fail('GENERATED_ARTIFACT_INVALID', 'Faltan recursos del artefacto para validar.')
  if (INVALID_UTF8_TEXT.test(html + '\n' + js)) fail('GENERATED_ARTIFACT_UTF8', 'El artefacto contiene corrupción UTF-8.')
  if (INTERNAL_TERMS.some((term) => term.test(html + '\n' + js))) fail('GENERATED_ARTIFACT_INTERNAL_LEAK', 'El artefacto filtra información interna.')
  const actualSections = [...html.matchAll(/<section[^>]+id=["']([a-z0-9-]+)["']/giu)].map((match) => match[1]); const plannedSections = planning.experience.sections
  if (actualSections.length !== plannedSections.length || new Set(actualSections).size !== actualSections.length || actualSections.some((item) => !plannedSections.includes(item))) fail('GENERATED_ARTIFACT_SECTION_DRIFT', 'Las secciones del artefacto no coinciden exactamente con ExperiencePlan.', { plannedSections, actualSections })
  if (!html.includes(planning.content.title) || !html.includes(planning.content.ctas[0])) fail('GENERATED_ARTIFACT_CONTENT_DRIFT', 'El artefacto no deriva del contenido planificado.')
  const styleChecks = { links: /a\s*\{[^}]*text-decoration\s*:\s*none/iu.test(css), input: /input\s*\{[^}]*border\s*:/iu.test(css), button: /button\s*\{[^}]*appearance\s*:/iu.test(css), focus: /:focus-visible/iu.test(css), dark: /\[data-theme=["']dark["']\]/iu.test(css), responsive: /@media\s*\(/iu.test(css) }
  if (!Object.values(styleChecks).every(Boolean)) fail('GENERATED_ARTIFACT_DEFAULT_STYLE', 'El sistema visual no cubre estilos premium, foco, tema oscuro y responsive: ' + JSON.stringify(styleChecks), styleChecks)
  for (const token of Object.values(planning.visual.palette)) if (typeof token === 'string' && /^#/u.test(token) && !css.toUpperCase().includes(token.toUpperCase())) fail('GENERATED_ARTIFACT_TOKEN_DRIFT', 'Falta token visual ' + token + ' en CSS.')
  if (planning.content.faq.length && !/<details[\s\S]*<summary/iu.test(html)) fail('GENERATED_ARTIFACT_MISSING_FAQ', 'El FAQ planificado no fue renderizado.')
  if (planning.content.trust.length && !/id=["']confianza["'][\s\S]*trust/iu.test(html)) fail('GENERATED_ARTIFACT_MISSING_TRUST', 'La confianza planificada no fue renderizada.')
  const customerText = [planning.content.title, planning.content.subtitle, ...planning.content.benefits, ...planning.content.trust, ...planning.content.faq.flatMap((item) => [item.question, item.answer])].map((item) => String(item).trim().toLowerCase())
  if (new Set(customerText).size !== customerText.length) fail('GENERATED_ARTIFACT_DUPLICATE_CONTENT', 'El contenido customer-facing contiene textos duplicados.')
  if (customerText.some((item) => !/^[a-záéíóúüñ¿¡]/u.test(item) || !/[.!?]$/u.test(item))) fail('GENERATED_ARTIFACT_GRAMMAR', 'El contenido customer-facing no tiene frases completas.')
  if (planning.build.traceability.length < 5) fail('GENERATED_ARTIFACT_TRACEABILITY', 'La trazabilidad del build es insuficiente.')
  return { ok: true, sections: planning.experience.sections.length, traceability: planning.build.traceability.length }
}

module.exports = { SCHEMA_VERSION, DIRECTIONS, PRODUCT_TYPES, ProductPlanningError, createProductPlanning, evolveProductPlanning, migrateLegacyPlanning, validateProductPlanning, validateGeneratedArtifact }
