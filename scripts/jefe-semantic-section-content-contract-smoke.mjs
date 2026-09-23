import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { adaptSemanticPlansToPlanning } = require('../electron/jefe-semantic-generation-adapter.cjs')
const { CONTENT_PLAN_SCHEMA, validateContentPlanDecision, validateStructuredOutputSchema } = require('../electron/jefe-semantic-provider.cjs')
const { assessCrossSectionRepetition } = require('../electron/jefe-generator-quality.cjs')
const { evaluateCandidate } = require('../electron/jefe-semantic-quality-promotion.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-section-content-contract-'))
const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'section-contract', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Section contract', brief: 'Servicio ficticio con paquetes claros.', businessType: 'servicios profesionales', audience: 'equipos', proposition: 'Una propuesta clara.', primaryCta: 'Conversar', brandSpec: { name: 'Section contract' } })
assert.equal(source.ok, true)
const bu = { ...source.project.planning.content.businessUnderstanding, schemaVersion: 'business-understanding-v2' }
const content = {
  schemaVersion: 'content-plan-v2', hero: 'Una propuesta concreta', presentation: 'Una explicación distinta para decidir con claridad', services: ['Paquete Claridad con alcance definido.', 'Paquete Prototipo con validación.', 'Paquete Implementación con QA.', 'Paquete Mantenimiento con soporte.'], trust: ['Alcance visible antes de empezar.'], faq: [{ question: '¿Cómo empieza?', answer: 'Comienza con un brief claro y una primera conversación.' }, { question: '¿Qué incluye?', answer: 'Incluye alcance, entregables y seguimiento.' }, { question: '¿Cuánto tarda?', answer: 'Cada etapa tiene plazos visibles.' }, { question: '¿Cómo revisamos?', answer: 'Revisamos cada hito con criterios acordados.' }], contact: 'Conversar con el equipo', sections: [
    { id: 'inicio-principal', role: 'hero', label: 'Inicio', kind: 'hero', contentRef: 'hero', required: true },
    { id: 'narrativa-clara', role: 'presentation', label: 'Propuesta', kind: 'narrative', contentRef: 'presentation', required: false },
    { id: 'oferta-profesional', role: 'services', label: 'Servicios', kind: 'service-catalog', contentRef: 'services', required: false },
    { id: 'prueba-confianza', role: 'trust', label: 'Confianza', kind: 'proof', contentRef: 'trust', required: false },
    { id: 'dudas-clientes', role: 'faq', label: 'Preguntas', kind: 'faq', contentRef: 'faq', required: false },
    { id: 'accion-final', role: 'contact', label: 'Contacto', kind: 'conversion-form', contentRef: 'contact', required: true }
  ]
}
const experience = { schemaVersion: 'experience-plan-v2', sectionOrder: content.sections.map((item) => item.id), ctaPositions: ['inicio-principal', 'accion-final'], archetype: 'guided', heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', servicesTreatment: 'cards', trustTreatment: 'proof', faqTreatment: 'accordion', conversionStrategy: 'consultation' }
validateStructuredOutputSchema(CONTENT_PLAN_SCHEMA)
const providerContent = { ...content, sections: content.sections.map((item) => ({ ...item, aliases: [] })) }
assert.equal(validateContentPlanDecision(providerContent), providerContent)
assert.throws(() => validateContentPlanDecision({ ...providerContent, sections: providerContent.sections.map((item) => item.id === 'oferta-profesional' ? { ...item, kind: 'proof' } : item) }), { code: 'SEMANTIC_SECTION_CONTENT_MISMATCH' })
assert.throws(() => validateContentPlanDecision({ ...providerContent, sections: providerContent.sections.map((item) => item.id === 'oferta-profesional' ? { ...item, kind: 'packages-overview' } : item) }), { code: 'SEMANTIC_SECTION_CONTENT_MISMATCH' })
assert.throws(() => validateContentPlanDecision({ ...providerContent, sections: [...providerContent.sections, { ...providerContent.sections[2], id: 'otra-oferta' }] }), { code: 'DUPLICATE_SEMANTIC_CONTENT_REF' })
assert.throws(() => validateContentPlanDecision({ ...providerContent, sections: [...providerContent.sections, { id: 'paquete-claridad', role: 'package-detail', label: 'Claridad', kind: 'package', required: false, contentRef: 'package-clarity', aliases: [] }] }), { code: 'UNSUPPORTED_SEMANTIC_SECTION_CONTENT' })
const planning = adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: content, experiencePlan: experience })
assert.deepEqual(planning.experience.sections, content.sections.map((item) => item.id))
assert.equal(planning.content.services.length, 4)
assert.equal(planning.content.sections[2].id, 'oferta-profesional')
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: { ...content, sections: [...content.sections, { id: 'paquete-extra', role: 'package-detail', kind: 'package', contentRef: 'package-clarity', required: false }] }, experiencePlan: { ...experience, sectionOrder: [...experience.sectionOrder, 'paquete-extra'] } }), { code: 'UNSUPPORTED_SEMANTIC_SECTION_CONTENT' })
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: { ...content, sections: [...content.sections, { id: 'otra-presentacion', role: 'presentation', kind: 'narrative', contentRef: 'presentation', required: false }] }, experiencePlan: { ...experience, sectionOrder: [...experience.sectionOrder, 'otra-presentacion'] } }), { code: 'DUPLICATE_SEMANTIC_CONTENT_REF' })
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: { ...content, sections: content.sections.map((item) => item.id === 'oferta-profesional' ? { ...item, role: 'services', contentRef: 'trust' } : item) }, experiencePlan: experience }), { code: 'SEMANTIC_SECTION_CONTENT_MISMATCH' })
const repeated = assessCrossSectionRepetition({ html: '<section id="a"><h2>Mismo heading</h2><p>El mismo cuerpo de contenido se repite completo.</p></section><section id="b"><h2>Mismo heading</h2><p>El mismo cuerpo de contenido se repite completo.</p></section>'.replaceAll('id="b"', 'id="b"') })
assert.equal(repeated.status, 'NEEDS_CORRECTION'); assert.ok(repeated.findings.some((item) => item.category === 'crossSectionRepetition'))
const distinct = assessCrossSectionRepetition({ html: '<section id="a"><h2>Ordenar el alcance</h2><p>Definimos entregables y límites antes de empezar.</p></section><section id="b"><h2>Validar la solución</h2><p>Probamos prototipos con criterios concretos y aprendizajes.</p></section>' })
assert.equal(distinct.status, 'PASS')
const serviceItems = assessCrossSectionRepetition({ html: `<section id="services"><h2>Paquetes</h2><article><h3>Claridad</h3><p>Diagnóstico y alcance.</p></article><article><h3>Prototipo</h3><p>Arquitectura y validación.</p></article><article><h3>Implementación</h3><p>QA y publicación.</p></article><article><h3>Mantenimiento</h3><p>Soporte continuo.</p></article></section>` })
assert.equal(serviceItems.status, 'PASS')
const persistedV3 = path.resolve('.codex-temp/orchestrator-real-smoke/orchestrator-real-smoke/version-v0003')
if (await fs.stat(persistedV3).then(() => true).catch(() => false)) {
  const persistedPlanning = JSON.parse(await fs.readFile(path.join(persistedV3, 'manifest.json'), 'utf8')).contract.planning
  const persistedSpec = { schemaVersion: 'semantic-generation-spec-v1', planning: persistedPlanning, sectionOrder: persistedPlanning.experience.sections }
  const replay = await evaluateCandidate({ candidateRoot: persistedV3, planning: persistedPlanning, spec: persistedSpec, experienceQuality: { status: 'PASS', findings: [] }, browserQuality: { status: 'PASS', checks: {}, findings: [] } })
  assert.equal(replay.overallStatus, 'NEEDS_CORRECTION')
  assert.equal(replay.crossSectionRepetition.status, 'NEEDS_CORRECTION')
  assert.ok(replay.crossSectionRepetition.findings.length > 0)
}
await fs.rm(root, { recursive: true, force: true })
console.log('PASS jefe-semantic-section-content-contract-smoke: canonical refs, dynamic IDs, unknown-ref fail-closed, duplicate payload protection and repetition false-positive coverage')
