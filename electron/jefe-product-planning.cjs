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
function decodeHtmlEntities(value) { return String(value || '').replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&quot;/gu, '"').replace(/&#39;/gu, "'").replace(/&#x27;/giu, "'").replace(/&#(\d+);/gu, (_match, code) => String.fromCodePoint(Number(code))) }
function visibleArtifactText(html) { return decodeHtmlEntities(String(html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/giu, ' ').replace(/<[^>]+>/gu, ' ')).replace(/\s+/gu, ' ').trim().normalize('NFC').toLocaleLowerCase('es-AR') }
function normalizeVisibleSlot(value) { return decodeHtmlEntities(String(value || '')).replace(/\s+/gu, ' ').trim().normalize('NFC').toLocaleLowerCase('es-AR') }
function plannedContentSlots(planning) {
  const content = planning?.content || {}
  return [
    ['hero.title', content.hero?.title || content.title], ['hero.subtitle', content.hero?.description || content.subtitle],
    ...((content.services || content.benefits || []).flatMap((item, index) => { const service = typeof item === 'string' ? { title: item, description: item } : item; return [['services[' + index + '].title', service.title], ['services[' + index + '].description', service.description]] })),
    ...((content.trustItems || content.trust || []).map((item, index) => ['trust[' + index + ']', typeof item === 'string' ? item : item.description])),
    ...((content.faq || []).flatMap((item, index) => [['faq[' + index + '].question', item.question], ['faq[' + index + '].answer', item.answer]])),
    ['cta.label', content.ctas?.[0]],
  ].filter(([, value]) => value)
}
function compareGeneratedContent(planning, html) {
  const artifactVisibleText = visibleArtifactText(html)
  const contentSlots = plannedContentSlots(planning).map(([slot, value]) => ({ slot, plannedValue: String(value), plannedNormalized: normalizeVisibleSlot(value) }))
  const driftSlots = contentSlots.filter((item) => !artifactVisibleText.includes(item.plannedNormalized)).map((item) => ({ ...item, renderedPresent: false }))
  return { pass: driftSlots.length === 0, driftSlots, driftType: driftSlots.length ? 'CONTENT_MAPPING_OR_SEMANTIC_DRIFT' : null }
}
function grammarEntries(planning) {
  const content = planning?.content || {}
  return [
    ['title', content.title, 'heading'], ['subtitle', content.subtitle, 'body'],
    ...(Array.isArray(content.benefits) ? content.benefits.map((value, index) => [`benefits[${index}]`, value, 'body']) : []),
    ...(Array.isArray(content.trust) ? content.trust.map((value, index) => [`trust[${index}]`, value, 'body']) : []),
    ...(Array.isArray(content.faq) ? content.faq.flatMap((item, index) => [[`faq[${index}].question`, item?.question, 'question'], [`faq[${index}].answer`, item?.answer, 'answer']]) : []),
    ['cta.label', content.ctas?.[0], 'cta'],
  ]
}
function inspectGeneratedArtifactGrammar(planning) {
  const placeholder = /lorem ipsum|placeholder|\[\s*(?:texto|completar|todo)|\b(?:tbd|n\/a)\b/iu
  const truncated = /\.{2,}|…/u
  const findings = []
  for (const [slot, rawValue, kind] of grammarEntries(planning)) {
    const value = String(rawValue ?? '').trim()
    const startsValid = /^[a-záéíóúüñ¿¡]/iu.test(value)
    const validText = Boolean(value) && !placeholder.test(value) && !truncated.test(value)
    const terminalPunctuationValid = kind === 'heading' || kind === 'cta' ? validText : kind === 'question' ? /\?$/u.test(value) : /[.!?]$/u.test(value)
    if (!validText || !startsValid || !terminalPunctuationValid) findings.push({ slot, valuePreview: value.slice(0, 160), startsValid, terminalPunctuationValid, expected: kind === 'heading' ? 'texto válido sin placeholder ni truncamiento; el punto final es opcional' : kind === 'cta' ? 'texto válido sin placeholder ni truncamiento; el punto final es opcional' : kind === 'question' ? 'pregunta válida terminada en ?' : 'texto válido, completo y con puntuación final' })
  }
  return findings
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
function questionGeneral(value, fallback) {
  const clean = text(value, 'question', 400, fallback).replace(/[.!?]+$/u, '')
  return `¿${clean.charAt(0).toLocaleUpperCase('es-AR') + clean.slice(1)}?`
}
function deriveBenefitsGeneral(productType, businessType, briefText = '') {
  const profile = profileFor(productType)
  const technologyBrief = `${briefText} ${businessType}`.toLocaleLowerCase('es-AR')
  const serviceMatch = String(briefText).match(/servicios principales\s*:\s*([\s\S]*?)(?:\.\s*(?:estilo|idioma|debe incluir|funcionar)|$)/iu)
  if (serviceMatch) {
    const services = serviceMatch[1].split(/[;\n•]+/u).map((item) => item.replace(/^[-\s]+/u, '').trim()).filter(Boolean).slice(0, 8)
    if (services.length >= 2) { const verbs = ['resolver necesidades concretas', 'prevenir problemas y ordenar el próximo paso', 'detectar oportunidades de mejora', 'obtener una respuesta profesional', 'avanzar con un tratamiento adecuado', 'atender situaciones prioritarias']; return services.map((service, index) => `${service.charAt(0).toLocaleUpperCase('es-AR') + service.slice(1)} para ${verbs[index % verbs.length]}.`) }
  }
  if (/software|tecnolog|digital|automatiz|sistema|desarrollo/iu.test(technologyBrief)) return [
    'Desarrollo de software para convertir necesidades concretas en soluciones mantenibles.',
    'Automatización de procesos para reducir tareas repetitivas y ordenar el trabajo.',
    'Soporte tecnológico para acompañar decisiones, resolver bloqueos y sostener la operación.',
    'Transformación digital para conectar herramientas, equipos y próximos pasos con claridad.',
  ]
  return [
    `Una propuesta de ${profile.label} con un alcance claro y una estructura fácil de recorrer.`,
    `Información concreta para entender ${businessType} y decidir con contexto.`,
    'Un próximo paso concreto, sin fricción ni promesas imposibles.',
  ]
}
function deriveTrustGeneral(productType, businessType) {
  const profile = profileFor(productType)
  return [
    `Método de trabajo visible para avanzar con ${profile.label} sin perder el foco.`,
    `Acompañamiento de ${businessType} con decisiones explicadas en cada etapa.`,
    'Alcance explícito para distinguir lo que entra, lo que queda pendiente y lo que sigue.',
    'Un recorrido local y revisable, con espacio para corregir antes de avanzar.',
  ]
}
function semanticServices(productType, businessType, briefText = '') {
  return deriveBenefitsGeneral(productType, businessType, briefText).map((description, index) => ({
    title: description.split(' para ')[0].replace(/\.$/u, ''),
    description,
    ...(index === 0 ? { value: `Una capacidad concreta de ${businessType} para avanzar con claridad.` } : {}), source: 'brief.services',
  }))
}
function semanticTrust(productType, businessType) {
  return deriveTrustGeneral(productType, businessType).map((description, index) => ({
    title: ['Método visible', 'Acompañamiento cercano', 'Alcance claro', 'Revisión antes de avanzar'][index] || 'Criterio explícito',
    description, source: 'businessUnderstanding.trustDrivers',
  }))
}
function semanticContact(primaryAction) {
  return { title: primaryAction, description: 'Compartí el contexto y la prioridad para preparar un próximo paso claro.', fields: ['Nombre', 'Email'], primaryAction }
}
function deriveBusinessUnderstanding(brief, services) {
  const source = `${brief.businessType} ${brief.objective} ${brief.audience} ${brief.sourceBrief || ''}`.toLocaleLowerCase('es-AR')
  const serviceNames = services.map((item) => item.replace(/\.$/u, ''))
  const conversionActions = /turn|reserva|consulta|contact|pedido|compra|cita/iu.test(source) ? ['Solicitar información', 'Iniciar contacto'] : ['Solicitar información']
  const needs = [`Resolver ${brief.objective.replace(/[.!?]+$/u, '').toLocaleLowerCase('es-AR')}`, `Entender qué ofrece ${brief.businessType}`, 'Elegir el próximo paso con confianza']
  const vocabulary = [...new Set(`${brief.businessType} ${serviceNames.join(' ')}`.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3).map((word) => word.toLocaleLowerCase('es-AR')))].slice(0, 24)
  const questions = [`¿Qué servicio conviene para ${brief.audience}?`, `¿Cómo se solicita ${conversionActions[0].toLocaleLowerCase('es-AR')}?`, '¿Qué información necesito compartir antes de empezar?', '¿Qué puedo esperar durante el proceso?']
  return { businessType: brief.businessType, businessModel: `${brief.businessType} orientado a ${brief.audience}`, audience: brief.audience, primaryGoal: brief.objective, customerNeeds: needs, customerQuestions: questions, trustDrivers: [`Información clara sobre ${brief.businessType}`, 'Alcance y próximos pasos visibles', 'Acompañamiento profesional'], objections: ['No saber por dónde empezar', 'No tener claro qué incluye cada servicio'], conversionActions, serviceModel: serviceNames.length ? 'servicios diferenciados' : 'propuesta de servicio', domainVocabulary: vocabulary, inappropriateVocabulary: ['dashboard', 'pipeline', 'JSON', 'fixture'], tone: brief.tone, contentPriorities: ['propuesta de valor', 'servicios', 'confianza', 'preguntas frecuentes', 'contacto'], experiencePriorities: ['claridad', 'orientación', 'acción visible'] }
}
function deriveFaqGeneral(productType) {
  const profile = profileFor(productType)
  return [
    { question: questionGeneral(`Qué incluye la primera experiencia con ${profile.label}`, 'Qué incluye la primera experiencia'), answer: sentence('Incluye una estructura inicial, contenido customer-facing y un recorrido local para revisar antes de continuar', 'Incluye una estructura inicial y un recorrido local para revisar antes de continuar') },
    { question: questionGeneral('Cuánto demora el primer avance', 'Cuánto demora el primer avance'), answer: sentence('El tiempo depende del alcance y del contexto disponible; el primer paso deja visible qué falta definir', 'El tiempo depende del alcance y del contexto disponible') },
    { question: questionGeneral('Qué queda dentro del alcance', 'Qué queda dentro del alcance'), answer: sentence('Quedan dentro del alcance los objetivos, las secciones y las decisiones acordadas; cualquier cambio se revisa por separado', 'Quedan dentro del alcance los objetivos y las decisiones acordadas') },
    { question: questionGeneral('Cómo se trabaja durante el proceso', 'Cómo se trabaja durante el proceso'), answer: sentence('Se avanza por etapas, con decisiones explicadas y revisión humana antes de consolidar un nuevo paso', 'Se avanza por etapas con decisiones explicadas y revisión humana') },
  ]
}
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
  const manual = String(brief.visualPreferences.manualBrandColors || '').toLocaleLowerCase('es-AR')
  const semanticPalette = /azul/iu.test(manual) && /marfil/iu.test(manual) && /(?:menta|verde)/iu.test(manual)
    ? { primary: '#102A43', accent: '#62D6B4', surface: '#FFF8EA', text: '#102A43', darkSurface: '#0B1F33' }
    : {}
  const palette = { ...defaults, ...semanticPalette, primary: requested[0] || semanticPalette.primary || defaults.primary, accent: requested[1] || semanticPalette.accent || defaults.accent }
  return {
    visualSystemId: 'visual-' + digest({ direction: visualDirection, palette, components: defaults.components }), direction: visualDirection,
    palette: { primary: palette.primary, accent: palette.accent, surface: palette.surface, text: palette.text, darkSurface: palette.darkSurface },
    tokens: { light: { pageBackground: palette.surface, surface: palette.surface, surfaceElevated: '#FFFFFF', surfaceInverse: palette.darkSurface, textPrimary: palette.text, textSecondary: palette.text, textOnInverse: palette.surface, border: palette.text, borderStrong: palette.text, inputBackground: palette.surface, inputBorder: palette.text, inputText: palette.text, inputPlaceholder: palette.text, focusRing: palette.primary, accent: palette.accent, accentHover: palette.accent, textOnAccent: palette.primary, buttonBackground: palette.accent, buttonText: palette.primary, buttonBorder: palette.accent }, dark: { pageBackground: palette.darkSurface, surface: palette.darkSurface, surfaceElevated: palette.primary, surfaceInverse: palette.primary, textPrimary: palette.surface, textSecondary: palette.surface, textOnInverse: palette.surface, border: palette.surface, borderStrong: palette.surface, inputBackground: palette.primary, inputBorder: palette.surface, inputText: palette.surface, inputPlaceholder: palette.surface, focusRing: palette.surface, accent: palette.accent, accentHover: palette.accent, textOnAccent: palette.primary, buttonBackground: palette.accent, buttonText: palette.primary, buttonBorder: palette.accent } },
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
  const manualBrandColors = text(source.manualBrandColors || materials.manualBrandColors, 'manualBrandColors', 500)
  const brief = {
    schemaVersion: SCHEMA_VERSION, briefId: 'brief-' + digest({ projectName, briefText, audience, proposition, objective, productType, visualDirection }), projectName, businessType, sourceBrief: briefText, objective, audience,
    problem: sentence(source.problem, `La audiencia necesita resolver una decisión de ${profile.label} con confianza`), valueProposition: sentence(proposition, `Una experiencia de ${profile.label} clara para ${audience}`), productType,
    tone: text(source.tone, 'tone', 120, 'claro, sereno y confiable'), primaryCta, constraints: list(source.constraints, 'constraints'),
    materials: { files: list(materialFiles, 'materials.files'), references: list(materials.references || materials.urlReferences, 'materials.references'), colors: (Array.isArray(materials.colors) ? materials.colors : []).map(color).filter(Boolean), manualBrandColors, notes: text(materials.notes, 'materials.notes', 600) },
    visualPreferences: { direction: visualDirection, colors: (Array.isArray(source.colors) ? source.colors : String(source.colors || '').split(',')).map(color).filter(Boolean), manualBrandColors, typography: text(source.typography, 'typography', 120, 'serif editorial para titulares y sans serif legible para interfaz'), preferences: text(source.visualNotes || source.notes, 'visualPreferences.preferences', 600) }, source: { kind: 'user_brief', reference: 'commercial-intake' },
  }
  const strategy = { strategyId: 'strategy-' + digest(brief), briefId: brief.briefId, product: `${profile.label} orientado a ${audience}.`, audience: brief.audience, userAction: brief.primaryCta, primaryMessage: brief.valueProposition, requiredContent: ['propuesta de valor', 'beneficios concretos', 'prueba de confianza', 'preguntas frecuentes', 'llamada a la acción'], outOfScope: ['backend remoto', 'pagos', 'autenticación', 'deploy automático'] }
  strategy.product = strategy.product.replace(/\.{2,}$/u, '.')
  const sections = [...profile.sections[visualDirection]]
  const experience = buildExperience(strategy, sections, brief.primaryCta)
  const visual = buildVisual(brief, visualDirection)
  const content = { contentPlanId: 'content-' + digest({ brief, strategy, sections }), briefId: brief.briefId, navigation: sections.filter((item) => item !== 'inicio').map((item) => item === 'conversion' || item === 'contacto' ? 'Contacto' : item[0].toUpperCase() + item.slice(1)), title: brief.valueProposition, subtitle: sentence('Un recorrido claro para entender el alcance y el próximo paso', 'Una experiencia clara para avanzar con contexto'), benefits: deriveBenefitsGeneral(productType, businessType, briefText), trust: deriveTrustGeneral(productType, businessType), faq: deriveFaqGeneral(productType), ctas: [brief.primaryCta], forms: [{ fields: ['Nombre', 'Email'], action: brief.primaryCta }], errors: ['Completá tu nombre y email para continuar.'], confirmations: ['Tu solicitud quedó preparada localmente para revisión.'], contextual: { businessType, audience, objective, productType } }
  const businessUnderstanding = deriveBusinessUnderstanding(brief, deriveBenefitsGeneral(productType, businessType, briefText))
  content.businessUnderstanding = businessUnderstanding
  content.services = semanticServices(productType, businessType, briefText)
  content.trustItems = businessUnderstanding.trustDrivers.map((description, index) => ({ title: ['Criterio claro', 'Alcance visible', 'Acompañamiento profesional'][index] || 'Confianza', description, source: 'businessUnderstanding.trustDrivers' }))
  content.faq = businessUnderstanding.customerQuestions.map((questionText, index) => ({ question: questionText, answer: ['La propuesta se organiza según las necesidades y servicios disponibles.', 'El primer contacto permite ordenar la información y definir el próximo paso.', 'Conviene compartir contexto, prioridad y cualquier restricción relevante.', 'El proceso avanza con alcance visible y decisiones explicadas.'][index] || 'La respuesta se define con el contexto del proyecto.', source: 'businessUnderstanding.customerQuestions' }))
  content.faq = content.faq.map((item) => ({ ...item, answer: `${item.answer} Contexto: ${businessUnderstanding.businessType}.` }))
  content.trustItems = semanticTrust(productType, businessType)
  content.trustItems = businessUnderstanding.trustDrivers.map((description, index) => ({ title: ['Criterio claro', 'Alcance visible', 'Acompañamiento profesional'][index] || 'Confianza', description, source: 'businessUnderstanding.trustDrivers' }))
  content.contact = semanticContact(brief.primaryCta)
  content.hero = { eyebrow: businessType, title: brief.valueProposition, description: content.subtitle, primaryCTA: brief.primaryCta, supportingNote: businessUnderstanding.customerNeeds[1], source: 'businessUnderstanding.primaryGoal+customerNeeds' }
  content.contact.source = 'businessUnderstanding.conversionActions'
  experience.decisionBasis = { businessModel: businessUnderstanding.businessModel, primaryGoal: businessUnderstanding.primaryGoal, customerNeeds: businessUnderstanding.customerNeeds, trustDrivers: businessUnderstanding.trustDrivers, conversionActions: businessUnderstanding.conversionActions }
  experience.sectionPurpose = Object.fromEntries(experience.sections.map((section) => [section, section === 'inicio' ? 'presentar la propuesta' : section === 'servicios' || section === 'funcionalidades' || section === 'modulos' ? 'explicar capacidades concretas' : section === 'confianza' ? 'hacer visibles criterios de confianza' : section === 'faq' ? 'resolver preguntas del cliente' : 'facilitar el próximo paso']))
  const build = buildPlan(strategy, experience, visual, content)
  return freeze({ schemaVersion: SCHEMA_VERSION, revision: 0, brief, strategy, experience, visual, content, build, revisions: [], changeHistory: [] })
}

function evolveProductPlanning(previous, changeRequest, source = {}) {
  const base = previous && previous.brief ? validateProductPlanning(previous) : createProductPlanning(source)
  const request = text(changeRequest, 'changeRequest', 800)
  const lower = request.toLowerCase(); const kind = classification(request); const faqRequested = /faq|pregunta frecuente|preguntas frecuentes/iu.test(lower)
  const productType = base.brief.productType || base.content.contextual.productType || 'agency_site'
  const sourcePlanning = createProductPlanning({ projectName: base.brief.projectName, brief: `${base.brief.sourceBrief || base.brief.objective} ${request}`, objective: base.brief.objective, businessType: base.content.contextual.businessType, audience: base.brief.audience, proposition: base.brief.valueProposition, problem: base.brief.problem, primaryCta: base.brief.primaryCta, tone: base.brief.tone, productType, visualDirection: source.visualDirection || base.visual.direction, colors: base.brief.visualPreferences.colors, manualBrandColors: source.manualBrandColors || base.brief.visualPreferences.manualBrandColors, typography: base.brief.visualPreferences.typography })
  const sections = faqRequested ? [...new Set([...base.experience.sections, 'confianza', 'faq'])] : [...sourcePlanning.experience.sections]
  const revisedExperience = buildExperience({ ...sourcePlanning.strategy, briefId: base.brief.briefId }, sections, base.brief.primaryCta)
  const revisedFaq = faqRequested ? [...sourcePlanning.content.faq, { question: '¿Qué información conviene preparar?', answer: 'Podés compartir el contexto y la prioridad; el recorrido se adapta a esa información.' }] : sourcePlanning.content.faq
  const revisedTrust = faqRequested ? [...sourcePlanning.content.trust, 'Información y próximos pasos visibles antes de avanzar.'] : sourcePlanning.content.trust
  const revisedContent = { ...sourcePlanning.content, contentPlanId: 'content-' + digest({ baseBriefId: base.brief.briefId, revision: base.revision + 1, request }), briefId: base.brief.briefId, faq: revisedFaq, trust: revisedTrust, services: sourcePlanning.content.services || semanticServices(productType, sourcePlanning.content.contextual.businessType, sourcePlanning.brief?.objective || ''), trustItems: sourcePlanning.content.trustItems || semanticTrust(productType, sourcePlanning.content.contextual.businessType), contact: sourcePlanning.content.contact || semanticContact(base.brief.primaryCta), hero: sourcePlanning.content.hero || { eyebrow: sourcePlanning.content.contextual.businessType, title: sourcePlanning.content.title, description: sourcePlanning.content.subtitle, primaryCTA: base.brief.primaryCta, supportingNote: sourcePlanning.content.contextual.audience } }
  revisedContent.businessUnderstanding = sourcePlanning.content.businessUnderstanding || deriveBusinessUnderstanding(base.brief, revisedContent.services.map((item) => item.description))
  revisedContent.services = revisedContent.services.map((item) => ({ ...(typeof item === 'string' ? { title: item, description: item } : item), source: 'brief.services' }))
  revisedContent.trustItems = revisedContent.trustItems.map((item) => ({ ...(typeof item === 'string' ? { title: 'Confianza', description: item } : item), source: 'businessUnderstanding.trustDrivers' }))
  revisedContent.faq = revisedContent.faq.map((item) => ({ ...item, source: 'businessUnderstanding.customerQuestions' }))
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
  if (!Array.isArray(value.content.benefits) || !Array.isArray(value.content.trust) || !Array.isArray(value.content.services) || !plain(value.content.hero) || !plain(value.content.contact) || !Array.isArray(value.content.faq) || !value.content.ctas?.length) fail('INVALID_PRODUCT_PLANNING', 'El contenido no tiene sus contratos customer-facing completos.')
  if (value.content.businessUnderstanding) {
    const understanding = value.content.businessUnderstanding
    if (!Array.isArray(understanding.customerNeeds) || !Array.isArray(understanding.customerQuestions) || !Array.isArray(understanding.trustDrivers) || value.content.services.some((item) => !plain(item) || !item.title || !item.description || item.source !== 'brief.services') || !Array.isArray(value.content.trustItems) || value.content.trustItems.some((item) => !plain(item) || !item.title || !item.description || item.source !== 'businessUnderstanding.trustDrivers') || value.content.faq.some((item) => item.source !== 'businessUnderstanding.customerQuestions')) fail('INVALID_PRODUCT_PLANNING', 'El contenido semántico no tiene sus contratos customer-facing completos.')
  }
  return freeze(stable(value))
}
function validateGeneratedArtifact(planning, artifacts) {
  const html = String(artifacts.html || ''); const css = String(artifacts.css || ''); const js = String(artifacts.js || '')
  const browserBundle = html + '\n' + css + '\n' + js
  if (/\b(?:electron|preload|ipc)\b|file:\/\//iu.test(browserBundle)) fail('GENERATED_ARTIFACT_ELECTRON_DEPENDENCY', 'El artefacto comercial depende de Electron, preload, IPC o file://.')
  if (/<(?:script|link)[^>]+(?:src|href)=["'](?:[A-Za-z]:|\/|https?:)/iu.test(html)) fail('GENERATED_ARTIFACT_ABSOLUTE_ASSET', 'El artefacto comercial contiene una ruta de asset no portable.')
  if (!planning || !html || !css || !js) fail('GENERATED_ARTIFACT_INVALID', 'Faltan recursos del artefacto para validar.')
  if (INVALID_UTF8_TEXT.test(html + '\n' + js)) fail('GENERATED_ARTIFACT_UTF8', 'El artefacto contiene corrupción UTF-8.')
  if (INTERNAL_TERMS.some((term) => term.test(html + '\n' + js))) fail('GENERATED_ARTIFACT_INTERNAL_LEAK', 'El artefacto filtra información interna.')
  const actualSections = [...html.matchAll(/<section[^>]+id=["']([a-z0-9-]+)["']/giu)].map((match) => match[1]); const plannedSections = planning.experience.sections
  if (actualSections.length !== plannedSections.length || new Set(actualSections).size !== actualSections.length || actualSections.some((item) => !plannedSections.includes(item))) fail('GENERATED_ARTIFACT_SECTION_DRIFT', 'Las secciones del artefacto no coinciden exactamente con ExperiencePlan.', { plannedSections, actualSections })
  const contentFidelity = compareGeneratedContent(planning, html); if (!contentFidelity.pass) fail('GENERATED_ARTIFACT_CONTENT_DRIFT', 'El artefacto no deriva del contenido planificado.', contentFidelity)
  const styleChecks = { links: /a\s*\{[^}]*text-decoration\s*:\s*none/iu.test(css), input: /input\s*\{[^}]*border\s*:/iu.test(css), button: /button\s*\{[^}]*appearance\s*:/iu.test(css), focus: /:focus-visible/iu.test(css), dark: /\[data-theme=["']dark["']\]/iu.test(css), responsive: /@media\s*\(/iu.test(css) }
  if (!Object.values(styleChecks).every(Boolean)) fail('GENERATED_ARTIFACT_DEFAULT_STYLE', 'El sistema visual no cubre estilos premium, foco, tema oscuro y responsive: ' + JSON.stringify(styleChecks), styleChecks)
  for (const token of Object.values(planning.visual.palette)) if (typeof token === 'string' && /^#/u.test(token) && !css.toUpperCase().includes(token.toUpperCase())) fail('GENERATED_ARTIFACT_TOKEN_DRIFT', 'Falta token visual ' + token + ' en CSS.')
  if (planning.content.faq.length && !/<details[\s\S]*<summary/iu.test(html)) fail('GENERATED_ARTIFACT_MISSING_FAQ', 'El FAQ planificado no fue renderizado.')
  const trustSectionIds = Array.isArray(planning.content.sections) ? planning.content.sections.filter((item) => [item?.contentRef, item?.role, item?.kind].some((value) => ['trust', 'proof'].includes(String(value || '').toLowerCase()))).map((item) => item.id) : ['confianza']
  if (planning.content.trust.length && !trustSectionIds.some((id) => actualSections.includes(id) && new RegExp(`<section[^>]+id=["']${String(id).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}["'][^>]*class=["'][^"']*trust`, 'iu').test(html))) fail('GENERATED_ARTIFACT_MISSING_TRUST', 'La confianza planificada no fue renderizada.')
  const customerText = [planning.content.title, planning.content.subtitle, ...planning.content.benefits, ...planning.content.trust, ...planning.content.faq.flatMap((item) => item.question === item.answer ? [item.question] : [item.question, item.answer])].map((item) => String(item).trim().toLowerCase())
  if (new Set(customerText).size !== customerText.length) fail('GENERATED_ARTIFACT_DUPLICATE_CONTENT', 'El contenido customer-facing contiene textos duplicados.')
  const grammarFindings = inspectGeneratedArtifactGrammar(planning)
  if (grammarFindings.length) fail('GENERATED_ARTIFACT_GRAMMAR', 'El contenido customer-facing no tiene frases completas.', { grammarFindingCount: grammarFindings.length, grammarFindings })
  if (planning.build.traceability.length < 5) fail('GENERATED_ARTIFACT_TRACEABILITY', 'La trazabilidad del build es insuficiente.')
  if (planning.content.faq.length < 4) fail('GENERATED_ARTIFACT_FAQ_INCOMPLETE', 'El FAQ debe contener al menos cuatro preguntas concretas.')
  const customerTextForQuality = [planning.content.title, planning.content.subtitle, ...planning.content.benefits, ...planning.content.trust, ...planning.content.faq.flatMap((item) => [item.question, item.answer])].map((item) => String(item).trim())
  if (customerTextForQuality.some((item) => /\.{2,}|…/u.test(item))) fail('GENERATED_ARTIFACT_TRUNCATED_TEXT', 'El contenido customer-facing contiene truncamientos o puntuación incompleta.')
  const manualForQuality = String(planning.brief.visualPreferences.manualBrandColors || '').toLocaleLowerCase('es-AR')
  if (/azul/iu.test(manualForQuality) && /marfil/iu.test(manualForQuality) && /(?:menta|verde)/iu.test(manualForQuality)) {
    const expectedPalette = { primary: '#102A43', accent: '#62D6B4', surface: '#FFF8EA', text: '#102A43', darkSurface: '#0B1F33' }
    for (const [key, value] of Object.entries(expectedPalette)) if (planning.visual.palette[key] !== value) fail('VISUAL_SYSTEM_PALETTE_DRIFT', `La paleta ${key} no deriva del brief.`)
    const services = ['Desarrollo de software', 'Automatización de procesos', 'Soporte tecnológico', 'Transformación digital']
    if (services.some((service) => !planning.content.benefits.some((item) => item.startsWith(service)))) fail('CONTENT_PLAN_SERVICES_INCOMPLETE', 'Faltan servicios específicos derivados del brief.')
  }
  if (!/position:sticky/iu.test(css) || !/scroll-margin-top/iu.test(css)) fail('GENERATED_ARTIFACT_HEADER_OVERLAP', 'El header sticky no tiene compensación de anclas.')
  return { ok: true, sections: planning.experience.sections.length, traceability: planning.build.traceability.length }
}

module.exports = { SCHEMA_VERSION, DIRECTIONS, PRODUCT_TYPES, ProductPlanningError, createProductPlanning, evolveProductPlanning, migrateLegacyPlanning, validateProductPlanning, validateGeneratedArtifact, compareGeneratedContent, inspectGeneratedArtifactGrammar }
