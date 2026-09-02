const crypto = require('node:crypto')
const { validateProductPlanning } = require('./jefe-product-planning.cjs')

function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function fail(message) { throw Object.assign(new Error(message), { code: 'INVALID_SEMANTIC_GENERATION_SPEC' }) }
function normalizeSectionId(value) {
  if (typeof value !== 'string' || !value.trim()) fail('sectionOrder contains an invalid section.')
  const normalized = value.trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '')
  if (!/^[a-z][a-z0-9-]{0,31}$/u.test(normalized)) fail('sectionOrder contains an invalid section.')
  return normalized
}
function requiredPlan(value, field, schemaVersion) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== schemaVersion) fail(`${field} with ${schemaVersion} is required.`)
  return value
}
function sentence(value, fallback) {
  const clean = String(value || fallback).trim().replace(/[.!?]+$/u, '')
  return `${clean.charAt(0).toLocaleUpperCase('es-AR') + clean.slice(1)}.`
}
function question(value) {
  const clean = String(value || '').trim().replace(/^[¿?\s]+|[¿?\s]+$/gu, '')
  return `¿${clean.charAt(0).toLocaleUpperCase('es-AR') + clean.slice(1)}?`
}
function semanticFaq(value) {
  return String(value || '').trim().endsWith('?')
    ? { question: question(value), answer: `${sentence(value, 'La respuesta se define con el contexto disponible')} Para orientar el próximo paso.`, source: 'businessUnderstanding.customerQuestions' }
    : { question: question(value), answer: sentence(value, 'La respuesta se define con el contexto disponible'), source: 'businessUnderstanding.customerQuestions' }
}
function semanticServices(values) {
  return values.map((value) => {
    const description = sentence(value, 'Servicio definido por el plan semántico')
    const title = description.split(/\s+para\s+/iu)[0].replace(/\.$/u, '')
    return { title, description, source: 'brief.services' }
  })
}
function semanticTrust(values) {
  return values.map((value, index) => ({ title: ['Criterio claro', 'Alcance visible', 'Acompañamiento profesional', 'Revisión explícita'][index] || 'Confianza', description: sentence(value, 'Criterio explicado para avanzar'), source: 'businessUnderstanding.trustDrivers' }))
}
function buildSectionContracts(sections) {
  return sections.map((section) => ({ id: section, component: section === 'inicio' ? 'hero' : section === 'contacto' ? 'conversion-form' : section, source: `ExperiencePlan.sections.${section}`, qaCriteria: 'section exists exactly once and is customer-facing' }))
}
function adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding, contentPlan, experiencePlan } = {}) {
  if (!sourcePlanning || typeof sourcePlanning !== 'object') fail('source planning is required.')
  const bu = requiredPlan(businessUnderstanding, 'BusinessUnderstandingV2', 'business-understanding-v2')
  const content = requiredPlan(contentPlan, 'ContentPlanV2', 'content-plan-v2')
  const experience = requiredPlan(experiencePlan, 'ExperiencePlanV2', 'experience-plan-v2')
  const sections = experience.sectionOrder.map(normalizeSectionId)
  if (!sections.length || new Set(sections).size !== sections.length) fail('ExperiencePlanV2 sectionOrder is invalid.')
  const services = semanticServices(content.services)
  const trust = content.trust.map((item) => sentence(item, 'Criterio explicado para avanzar'))
  const trustItems = semanticTrust(content.trust)
  const faq = content.faq.map(semanticFaq)
  if (!content.hero || !content.presentation || !services.length || !trust.length || faq.length < 4 || !content.contact) fail('ContentPlanV2 customer-facing content is incomplete.')
  const nextBrief = { ...sourcePlanning.brief, audience: bu.audience || sourcePlanning.brief.audience, objective: bu.primaryGoal || sourcePlanning.brief.objective }
  const nextStrategy = { ...sourcePlanning.strategy, audience: bu.audience || sourcePlanning.strategy.audience, primaryMessage: sentence(content.hero, sourcePlanning.strategy.primaryMessage) }
  const nextContent = { ...sourcePlanning.content, title: sentence(content.hero, sourcePlanning.content.title), subtitle: sentence(content.presentation, sourcePlanning.content.subtitle), benefits: services.map((item) => item.description), services, trust, trustItems, faq, ctas: [sentence(content.contact, sourcePlanning.content.ctas[0])], contact: { ...sourcePlanning.content.contact, title: sentence(content.contact, sourcePlanning.content.contact.title), description: sentence(content.contact, sourcePlanning.content.contact.description), primaryAction: sentence(content.contact, sourcePlanning.content.ctas[0]), source: 'ContentPlanV2.contact' }, hero: { ...sourcePlanning.content.hero, title: sentence(content.hero, sourcePlanning.content.title), description: sentence(content.presentation, sourcePlanning.content.subtitle), primaryCTA: sentence(content.contact, sourcePlanning.content.ctas[0]), source: 'ContentPlanV2.hero' }, businessUnderstanding: { ...bu, schemaVersion: 'business-understanding-v2' } }
  const nextExperience = { ...sourcePlanning.experience, sections, navigation: sections.filter((item) => item !== 'inicio'), forms: [{ fields: ['name', 'email'], submitAction: sentence(content.contact, sourcePlanning.content.ctas[0]), persistence: 'local_only' }], responsive: true, archetype: experience.archetype, heroVariant: experience.heroVariant, sectionTreatments: experience.sectionTreatments, contentDensity: experience.contentDensity, ctaPositions: experience.ctaPositions, servicesTreatment: experience.servicesTreatment, trustTreatment: experience.trustTreatment, faqTreatment: experience.faqTreatment, conversionStrategy: experience.conversionStrategy }
  const nextBuild = { ...sourcePlanning.build, sectionContracts: buildSectionContracts(sections), traceability: [...sourcePlanning.build.traceability, { source: 'ContentPlanV2', decision: 'customer-facing copy', component: 'artifact content', qaCriteria: 'content is derived from semantic plan' }, { source: 'ExperiencePlanV2', decision: 'section order and treatments', component: 'artifact structure', qaCriteria: 'structure is derived from semantic plan' }] }
  const result = { ...sourcePlanning, brief: nextBrief, strategy: nextStrategy, experience: nextExperience, content: nextContent, build: nextBuild, semanticRefs: { businessUnderstanding: 'BusinessUnderstandingV2', contentPlan: 'ContentPlanV2', experiencePlan: 'ExperiencePlanV2' } }
  validateProductPlanning(result)
  return result
}
function adaptSemanticGenerationSpec(spec) {
  if (!spec || spec.schemaVersion !== 'semantic-generation-spec-v1') fail('SemanticGenerationSpec schema is required.')
  if (!spec.planning || typeof spec.planning !== 'object') fail('SemanticGenerationSpec must contain structured planning.')
  validateProductPlanning(spec.planning)
  if (!Array.isArray(spec.sectionOrder) || spec.sectionOrder.length === 0) fail('sectionOrder is required.')
  const sectionOrder = spec.sectionOrder.map(normalizeSectionId)
  if (new Set(sectionOrder).size !== sectionOrder.length) fail('sectionOrder contains an invalid section.')
  if (!spec.heroVariant || typeof spec.heroVariant !== 'string' || spec.heroVariant.includes('<')) fail('heroVariant is invalid.')
  if (spec.treatments && (!Array.isArray(spec.treatments) || spec.treatments.some((value) => typeof value !== 'string'))) fail('treatments are invalid.')
  if (spec.assets && (!Array.isArray(spec.assets) || spec.assets.some((value) => typeof value !== 'string' || value.includes('..') || value.startsWith('/')))) fail('assets must be safe relative references.')
  return { schemaVersion: 'normalized-generation-plan-v1', planning: spec.planning, sectionOrder, heroVariant: spec.heroVariant, treatments: [...(spec.treatments || [])], creativeDirection: spec.creativeDirection || null, contentDensity: spec.contentDensity || 'balanced', ctaStrategy: spec.ctaStrategy || null, preservedQualities: [...(spec.preservedQualities || [])], prohibitedChanges: [...(spec.prohibitedChanges || [])], semanticGenerationSpecHash: hash(spec) }
}
module.exports = { adaptSemanticGenerationSpec, adaptSemanticPlansToPlanning }
