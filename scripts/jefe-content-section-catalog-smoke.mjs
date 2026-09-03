import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { buildContentSectionCatalog, contentSectionCatalogHash, adaptSemanticPlansToPlanning } = require('../electron/jefe-semantic-generation-adapter.cjs')
const { experiencePlanSchemaForCatalog } = require('../electron/jefe-semantic-provider.cjs')
const { createProductPlanning } = require('../electron/jefe-product-planning.cjs')
const sourcePlanning = createProductPlanning({ projectName: 'Catálogo fixture', brief: 'Servicio B2B sintético.', businessType: 'servicio B2B', audience: 'equipos', proposition: 'Una propuesta clara.', objective: 'Decidir con contexto.' })
const bu = { schemaVersion: 'business-understanding-v2', audience: 'equipos', primaryGoal: 'decidir', customerNeeds: ['claridad'], customerQuestions: ['qué incluye'], trustDrivers: ['método'], conversionActions: ['consultar'] }
const content = { schemaVersion: 'content-plan-v2', hero: 'Hero.', presentation: 'Presentación.', services: ['Servicio A.'], trust: ['Método.'], faq: ['¿Qué incluye?', '¿Cómo empieza?', '¿Qué alcance tiene?', '¿Cómo se revisa?'], contact: 'Consultar.', contentPriorities: ['claridad'], sections: [{ id: 'inicio', role: 'hero', label: 'Cómo empezar', kind: 'hero', required: true, contentRef: 'hero' }, { id: 'servicios', role: 'services', label: 'Cómo podemos ayudarte', kind: 'catalog', required: true, contentRef: 'services' }, { id: 'confianza', role: 'trust', label: 'Criterios claros', kind: 'proof', required: false, contentRef: 'trust' }, { id: 'faq', role: 'faq', label: 'Preguntas útiles', kind: 'faq', required: false, contentRef: 'faq' }, { id: 'contacto', role: 'contact', label: 'Siguiente paso', kind: 'conversion', required: true, contentRef: 'contact' }] }
const catalog = buildContentSectionCatalog(content)
const catalogHash = contentSectionCatalogHash(catalog)
assert.deepEqual(catalog.map((item) => item.id), ['inicio', 'servicios', 'confianza', 'faq', 'contacto'])
assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length)
const schema = experiencePlanSchemaForCatalog(catalog, catalogHash)
assert.deepEqual(schema.schema.properties.sectionOrder.items.enum, catalog.map((item) => item.id))
assert.deepEqual(schema.schema.properties.ctaPositions.items.enum, catalog.map((item) => item.id))
const experience = { schemaVersion: 'experience-plan-v2', contentSectionCatalogHash: catalogHash, archetype: 'guided', sectionOrder: ['inicio', 'Cómo podemos ayudarte', 'Criterios claros', 'Preguntas útiles', 'Siguiente paso'], heroVariant: 'focused', sectionTreatments: ['catalog'], contentDensity: 'balanced', ctaPositions: ['inicio', 'Siguiente paso'], servicesTreatment: 'cards', trustTreatment: 'proof', faqTreatment: 'answers', conversionStrategy: 'consultation' }
const adapted = adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding: bu, contentPlan: content, experiencePlan: experience, requireCatalogHash: true })
assert.deepEqual(adapted.experience.sections, ['inicio', 'servicios', 'confianza', 'faq', 'contacto'])
assert.deepEqual(adapted.experience.ctaPositions, ['inicio', 'contacto'])
assert.equal(adapted.semanticRefs.contentSectionCatalogHash, catalogHash)
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding: bu, contentPlan: content, experiencePlan: { ...experience, contentSectionCatalogHash: 'stale' }, requireCatalogHash: true }), /EXPERIENCE_PLAN_CONTENT_CATALOG_STALE/u)
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding: bu, contentPlan: content, experiencePlan: { ...experience, sectionOrder: ['inicio', 'No existe', 'faq', 'Siguiente paso'] }, requireCatalogHash: true }), /UNKNOWN_SEMANTIC_SECTION/u)
const ambiguous = { ...content, sections: content.sections.map((item) => item.id === 'faq' ? { ...item, label: 'Cómo podemos ayudarte' } : item) }
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding: bu, contentPlan: ambiguous, experiencePlan: { ...experience, sectionOrder: ['inicio', 'Cómo podemos ayudarte', 'faq', 'Siguiente paso'] }, requireCatalogHash: false }), /AMBIGUOUS_SEMANTIC_SECTION/u)
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding: bu, contentPlan: content, experiencePlan: { ...experience, sectionOrder: ['inicio', 'faq', 'Siguiente paso'] }, requireCatalogHash: true }), /required content section/u)
console.log('PASS jefe-content-section-catalog-smoke: ContentPlan-derived catalog, stable IDs, dynamic enum, label compatibility, hash binding, stale/unknown/ambiguous/required/CTA integrity')
