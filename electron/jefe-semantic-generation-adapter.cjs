const crypto = require('node:crypto')
const { validateProductPlanning } = require('./jefe-product-planning.cjs')

function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function fail(message) { throw Object.assign(new Error(message), { code: 'INVALID_SEMANTIC_GENERATION_SPEC' }) }
function contractFail(code, message, details = {}) { throw Object.assign(new Error(message), { code, details }) }
const SEMANTIC_SECTION_CONTRACTS = Object.freeze({
  hero: Object.freeze({ role: 'hero', kind: 'hero', contentRef: 'hero' }),
  presentation: Object.freeze({ role: 'presentation', kind: 'narrative', contentRef: 'presentation' }),
  services: Object.freeze({ role: 'services', kind: 'service-catalog', contentRef: 'services' }),
  trust: Object.freeze({ role: 'trust', kind: 'proof', contentRef: 'trust' }),
  faq: Object.freeze({ role: 'faq', kind: 'faq', contentRef: 'faq' }),
  contact: Object.freeze({ role: 'contact', kind: 'conversion-form', contentRef: 'contact' }),
})
const SEMANTIC_CONTENT_REFS = new Set(Object.keys(SEMANTIC_SECTION_CONTRACTS))
function canonicalSemanticContentRef(value) {
  const normalized = String(value || '').trim().toLowerCase()
  const aliases = new Map(Object.entries(SEMANTIC_SECTION_CONTRACTS).flatMap(([contentRef, contract]) => [[contentRef, contentRef], [contract.role, contentRef], [contract.kind, contentRef]]))
  for (const [contentRef, values] of Object.entries({ hero: ['home-hero', 'portada', 'encabezado'], presentation: ['value-prop', 'propuesta-valor', 'propuesta de valor'], services: ['service', 'packages-overview', 'services-overview', 'servicios-resumen'], trust: ['trust-drivers'], faq: ['question'], contact: ['conversion'] })) for (const alias of values) aliases.set(alias, contentRef)
  return aliases.get(normalized) || null
}
function validateSemanticContentCatalog(catalog) {
  const seen = new Map()
  for (const item of catalog) {
    const refs = [item.contentRef, item.role, item.kind].map(canonicalSemanticContentRef).filter(Boolean)
    const canonical = canonicalSemanticContentRef(item.contentRef) || refs[0]
    if (!canonical || !SEMANTIC_CONTENT_REFS.has(canonical)) contractFail('UNSUPPORTED_SEMANTIC_SECTION_CONTENT', 'La sección semántica no tiene un contrato de contenido soportado.', { sectionId: item.id, role: item.role, kind: item.kind, contentRef: item.contentRef })
    if (refs.some((ref) => ref !== canonical)) contractFail('SEMANTIC_SECTION_CONTENT_MISMATCH', 'role, kind y contentRef no resuelven al mismo contrato semántico.', { sectionId: item.id, role: item.role, kind: item.kind, contentRef: item.contentRef })
    if (seen.has(canonical)) contractFail('DUPLICATE_SEMANTIC_CONTENT_REF', 'Varias secciones semánticas dependen del mismo payload sin contenido independiente.', { sectionId: item.id, duplicateOf: seen.get(canonical), contentRef: canonical, role: item.role, kind: item.kind })
    seen.set(canonical, item.id)
  }
  return catalog
}
function validateCanonicalSemanticContentCatalog(catalog) {
  if (!Array.isArray(catalog) || catalog.length < 1 || catalog.length > 8) contractFail('SEMANTIC_CONTENT_PLAN_SECTIONS_INVALID', 'ContentPlanV2 sections debe ser un array válido.', {})
  const ids = new Set()
  for (const item of catalog) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/u.test(item.id) || ids.has(item.id) || typeof item.label !== 'string' || typeof item.required !== 'boolean' || typeof item.aliases === 'undefined' || !Array.isArray(item.aliases)) contractFail('SEMANTIC_CONTENT_PLAN_SECTIONS_INVALID', 'ContentPlanV2 sections tiene una estructura inválida.', { sectionId: item?.id || null })
    ids.add(item.id)
    const contract = SEMANTIC_SECTION_CONTRACTS[item.contentRef]
    if (!contract) contractFail('UNSUPPORTED_SEMANTIC_SECTION_CONTENT', 'El contentRef semántico no está soportado.', { sectionId: item.id, role: item.role, kind: item.kind, contentRef: item.contentRef })
    if (item.role !== contract.role || item.kind !== contract.kind || item.contentRef !== contract.contentRef) contractFail('SEMANTIC_SECTION_CONTENT_MISMATCH', 'role, kind y contentRef no resuelven al mismo contrato semántico.', { sectionId: item.id, role: item.role, kind: item.kind, contentRef: item.contentRef })
  }
  return validateSemanticContentCatalog(catalog)
}
function buildContentSectionCatalog(contentPlan, { validate = true } = {}) {
  if (Array.isArray(contentPlan?.sections) && contentPlan.sections.length > 0) {
    const catalog = contentPlan.sections.map((item) => ({ id: item.id, role: item.role || item.id, label: item.label || item.id, kind: item.kind || item.id, required: item.required === true, contentRef: item.contentRef || item.id, ...(Array.isArray(item.aliases) ? { aliases: item.aliases } : {}) }))
    return validate ? validateSemanticContentCatalog(catalog) : catalog
  }
  const fields = [
    ['inicio', 'hero', 'hero', 'hero', 'hero'],
    ['relato', 'presentation', 'presentation', 'narrative', 'presentation'],
    ['servicios', 'services', 'services', 'service-catalog', 'services'],
    ['confianza', 'trust', 'trust', 'proof', 'trust'],
    ['faq', 'faq', 'faq', 'faq', 'faq'],
    ['contacto', 'contact', 'contact', 'conversion-form', 'contact'],
  ]
  return fields.filter(([, contentRef]) => {
    const value = contentPlan?.[contentRef]
    return Array.isArray(value) ? value.length > 0 : Boolean(value)
  }).map(([id, role, label, kind, contentRef]) => ({ id, role, label, kind, required: ['inicio', 'servicios', 'contacto'].includes(id), contentRef }))
}
function contentSectionCatalogHash(catalog) { return hash(catalog) }
function normalizeComparableLabel(value) {
  return String(value || '').trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').replace(/[^a-z0-9]+/gu, ' ').replace(/\s+/gu, ' ').trim()
}
function canonicalId(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/u.test(value.trim())) return null
  return value.trim()
}
function sectionIdentityCatalog(planning, catalog = null) {
  if (Array.isArray(catalog)) return catalog.map((item) => ({ id: item.id, labels: [item.role, item.label, ...(Array.isArray(item.aliases) ? item.aliases : [])].map(normalizeComparableLabel).filter(Boolean) }))
  const sections = Array.isArray(planning?.experience?.sections) ? planning.experience.sections : []
  const contracts = Array.isArray(planning?.build?.sectionContracts) ? planning.build.sectionContracts : []
  const navigation = Array.isArray(planning?.content?.navigation) ? planning.content.navigation : []
  return sections.map((id, index) => {
    const contract = contracts.find((item) => item?.id === id) || {}
    const labels = [navigation[sections.filter((item) => item !== 'inicio').indexOf(id)], contract.label, contract.component === 'hero' ? 'hero' : null, contract.component === 'conversion-form' ? 'contact' : null, ...(Array.isArray(contract.aliases) ? contract.aliases : [])].filter(Boolean)
    return { id, labels: labels.map(normalizeComparableLabel).filter(Boolean) }
  })
}
function resolveSectionReference(value, planning, field = 'section reference', catalog = null) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} is invalid.`)
  const raw = value.trim()
  const direct = canonicalId(raw)
  const identities = sectionIdentityCatalog(planning, catalog)
  if (direct && identities.some((item) => item.id === direct)) return direct
  const comparable = normalizeComparableLabel(raw)
  const matches = identities.filter((item) => item.labels.includes(comparable))
  if (matches.length === 1) return matches[0].id
  if (matches.length > 1) fail(`AMBIGUOUS_SEMANTIC_SECTION: ${field}.`)
  fail(`UNKNOWN_SEMANTIC_SECTION: ${field}.`)
}
function resolveSectionOrder(values, planning, field = 'sectionOrder', catalog = null) {
  if (!Array.isArray(values) || values.length === 0) fail(`${field} is required.`)
  const resolved = values.map((value) => resolveSectionReference(value, planning, field, catalog))
  if (new Set(resolved).size !== resolved.length) fail(`${field} contains duplicate sections.`)
  return resolved
}
function requiredPlan(value, field, schemaVersion) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== schemaVersion) fail(`${field} with ${schemaVersion} is required.`)
  return value
}
function copy(value, fallback = '') { const clean = String(value ?? fallback).trim(); if (!clean) fail('SEMANTIC_CONTENT_REQUIRED'); return clean }
function faqQuestion(value) { const clean = copy(value).replace(/\s+/gu, ' '); return `${clean.startsWith('¿') ? '' : '¿'}${clean.replace(/[?¿]+$/u, '')}?` }
function faqAnswer(value) { const clean = copy(value).replace(/\s+/gu, ' '); return /[.!?]$/u.test(clean) ? clean : `${clean}.` }
function sentence(value, fallback) {
  return copy(value, fallback)
}
function bodySentence(value, fallback) {
  const clean = copy(value, fallback).replace(/\s+/gu, ' ')
  return /[.!?]$/u.test(clean) ? clean : `${clean}.`
}
function question(value) {
  return copy(value)
}
function semanticFaq(value) {
  if (value && typeof value === 'object') {
    if (Array.isArray(value) || Object.keys(value).sort().join('|') !== 'answer|question') fail('SEMANTIC_FAQ_OBJECT_INVALID')
    const normalizedQuestion = faqQuestion(value.question); const normalizedAnswer = faqAnswer(value.answer)
    if (normalizedQuestion === normalizedAnswer || /lorem ipsum|placeholder|\[\s*(?:texto|completar|todo)|\b(?:tbd|n\/a)\b/iu.test(normalizedAnswer)) fail('SEMANTIC_FAQ_CONTENT_INVALID')
    return { question: normalizedQuestion, answer: normalizedAnswer, source: 'businessUnderstanding.customerQuestions' }
  }
  const exact = copy(value)
  return { question: faqQuestion(exact), answer: faqAnswer(exact), source: 'businessUnderstanding.customerQuestions', legacy: true }
}
function semanticServices(values) {
  return values.map((value) => {
    if (value && typeof value === 'object') return { title: copy(value.title), description: bodySentence(value.description), source: 'brief.services', ...(value.value ? { value: copy(value.value) } : {}) }
    const exact = copy(value)
    return { title: exact, description: bodySentence(exact), source: 'brief.services' }
  })
}
function semanticTrust(values, businessUnderstanding) {
  return values.map((value, index) => value && typeof value === 'object' ? { title: copy(value.title), description: bodySentence(value.description), source: 'businessUnderstanding.trustDrivers' } : { title: `Criterio ${index + 1}`, description: bodySentence(value), source: 'businessUnderstanding.trustDrivers' })
}
function buildSectionContracts(sections) {
  return sections.map((section) => ({ id: section, component: section === 'inicio' ? 'hero' : section === 'contacto' ? 'conversion-form' : section, source: `ExperiencePlan.sections.${section}`, qaCriteria: 'section exists exactly once and is customer-facing' }))
}
function adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding, contentPlan, experiencePlan, requireCatalogHash = false } = {}) {
  if (!sourcePlanning || typeof sourcePlanning !== 'object') fail('source planning is required.')
  const bu = requiredPlan(businessUnderstanding, 'BusinessUnderstandingV2', 'business-understanding-v2')
  const content = requiredPlan(contentPlan, 'ContentPlanV2', 'content-plan-v2')
  const experience = requiredPlan(experiencePlan, 'ExperiencePlanV2', 'experience-plan-v2')
  const catalog = buildContentSectionCatalog(content)
  const catalogSha256 = contentSectionCatalogHash(catalog)
  if (requireCatalogHash && experience.contentSectionCatalogHash !== catalogSha256) fail('EXPERIENCE_PLAN_CONTENT_CATALOG_STALE')
  const sections = resolveSectionOrder(experience.sectionOrder, sourcePlanning, 'ExperiencePlanV2 sectionOrder', catalog)
  if (catalog.some((item) => item.required && !sections.includes(item.id))) fail('ExperiencePlanV2 omits a required content section.')
  const services = semanticServices(content.services)
  const trust = content.trust.map((item) => bodySentence(item, 'Criterio explicado para avanzar'))
  const trustItems = semanticTrust(content.trust, bu)
  const faq = content.faq.map((item, index) => semanticFaq(item, bu, index))
  if (!content.hero || !content.presentation || !services.length || !trust.length || faq.length < 4 || !content.contact) fail('ContentPlanV2 customer-facing content is incomplete.')
  const nextBrief = { ...sourcePlanning.brief, audience: bu.audience || sourcePlanning.brief.audience, objective: bu.primaryGoal || sourcePlanning.brief.objective }
  const nextStrategy = { ...sourcePlanning.strategy, audience: bu.audience || sourcePlanning.strategy.audience, primaryMessage: sentence(content.hero, sourcePlanning.strategy.primaryMessage) }
  const nextContent = { ...sourcePlanning.content, title: sentence(content.hero, sourcePlanning.content.title), presentation: bodySentence(content.presentation, sourcePlanning.content.subtitle), subtitle: bodySentence(content.presentation, sourcePlanning.content.subtitle), benefits: services.map((item) => item.description), services, trust, trustItems, faq, ctas: [sentence(content.contact, sourcePlanning.content.ctas[0])], contact: { ...sourcePlanning.content.contact, title: sentence(content.contact, sourcePlanning.content.contact.title), description: bodySentence(content.contact, sourcePlanning.content.contact.description), primaryAction: sentence(content.contact, sourcePlanning.content.ctas[0]), source: 'ContentPlanV2.contact' }, hero: { ...sourcePlanning.content.hero, title: sentence(content.hero, sourcePlanning.content.title), description: bodySentence(content.presentation, sourcePlanning.content.subtitle), primaryCTA: sentence(content.contact, sourcePlanning.content.ctas[0]), source: 'ContentPlanV2.hero' }, businessUnderstanding: { ...bu, schemaVersion: 'business-understanding-v2' } }
  nextContent.sections = content.sections
  const ctaPositions = resolveSectionOrder(experience.ctaPositions, sourcePlanning, 'ExperiencePlanV2 ctaPositions', catalog)
  const nextExperience = { ...sourcePlanning.experience, sections, navigation: sections.filter((item) => item !== 'inicio'), forms: [{ fields: ['name', 'email'], submitAction: sentence(content.contact, sourcePlanning.content.ctas[0]), persistence: 'local_only' }], responsive: true, archetype: experience.archetype, heroVariant: experience.heroVariant, sectionTreatments: experience.sectionTreatments, contentDensity: experience.contentDensity, ctaPositions, servicesTreatment: experience.servicesTreatment, trustTreatment: experience.trustTreatment, faqTreatment: experience.faqTreatment, conversionStrategy: experience.conversionStrategy }
  const nextBuild = { ...sourcePlanning.build, sectionContracts: buildSectionContracts(sections), traceability: [...sourcePlanning.build.traceability, { source: 'ContentPlanV2', decision: 'customer-facing copy', component: 'artifact content', qaCriteria: 'content is derived from semantic plan' }, { source: 'ExperiencePlanV2', decision: 'section order and treatments', component: 'artifact structure', qaCriteria: 'structure is derived from semantic plan' }] }
  const result = { ...sourcePlanning, brief: nextBrief, strategy: nextStrategy, experience: nextExperience, content: nextContent, build: nextBuild, semanticRefs: { businessUnderstanding: 'BusinessUnderstandingV2', contentPlan: 'ContentPlanV2', experiencePlan: 'ExperiencePlanV2' } }
  validateProductPlanning(result)
  return { ...result, semanticRefs: { ...result.semanticRefs, contentSectionCatalogHash: catalogSha256 }, sectionCatalog: catalog }
}
function adaptSemanticGenerationSpec(spec) {
  if (!spec || spec.schemaVersion !== 'semantic-generation-spec-v1') fail('SemanticGenerationSpec schema is required.')
  if (!spec.planning || typeof spec.planning !== 'object') fail('SemanticGenerationSpec must contain structured planning.')
  validateProductPlanning(spec.planning)
  if (!Array.isArray(spec.sectionOrder) || spec.sectionOrder.length === 0) fail('sectionOrder is required.')
  resolveSectionOrder(spec.sectionOrder, spec.planning)
  const sectionOrder = [...spec.planning.experience.sections]
  if (!spec.heroVariant || typeof spec.heroVariant !== 'string' || spec.heroVariant.includes('<')) fail('heroVariant is invalid.')
  if (spec.treatments && (!Array.isArray(spec.treatments) || spec.treatments.some((value) => typeof value !== 'string'))) fail('treatments are invalid.')
  if (spec.assets && (!Array.isArray(spec.assets) || spec.assets.some((value) => typeof value !== 'string' || value.includes('..') || value.startsWith('/')))) fail('assets must be safe relative references.')
  const ctaPositions = spec.ctaPositions === undefined ? undefined : resolveSectionOrder(spec.ctaPositions, spec.planning, 'ctaPositions')
  return { schemaVersion: 'normalized-generation-plan-v1', planning: spec.planning, sectionOrder, heroVariant: spec.heroVariant, treatments: [...(spec.treatments || [])], ...(ctaPositions ? { ctaPositions } : {}), creativeDirection: spec.creativeDirection || null, contentDensity: spec.contentDensity || 'balanced', ctaStrategy: spec.ctaStrategy || null, preservedQualities: [...(spec.preservedQualities || [])], prohibitedChanges: [...(spec.prohibitedChanges || [])], semanticGenerationSpecHash: hash(spec) }
}
module.exports = { SEMANTIC_SECTION_CONTRACTS, adaptSemanticGenerationSpec, adaptSemanticPlansToPlanning, bodySentence, buildContentSectionCatalog, canonicalSemanticContentRef, contentSectionCatalogHash, validateCanonicalSemanticContentCatalog, validateSemanticContentCatalog }
