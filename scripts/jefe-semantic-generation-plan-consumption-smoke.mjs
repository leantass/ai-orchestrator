import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const generation = require('../electron/jefe-real-generation.cjs')
const { adaptSemanticPlansToPlanning, adaptSemanticGenerationSpec } = require('../electron/jefe-semantic-generation-adapter.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-plan-consumption-'))
const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'semantic-consumption', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Fuente estable', brief: 'Servicio ficticio con una propuesta legacy deliberadamente constante.', businessType: 'servicio digital', audience: 'equipos que necesitan claridad', proposition: 'Hero legacy que no debe gobernar la corrección semántica', brandSpec: { name: 'Fuente estable' } })
assert.equal(source.ok, true)

const baseExperience = { schemaVersion: 'experience-plan-v2', archetype: 'guided', sectionOrder: ['inicio', 'relato', 'servicios', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', ctaPositions: ['inicio', 'contacto'], servicesTreatment: 'service-cards', trustTreatment: 'criteria', faqTreatment: 'decision-help', conversionStrategy: 'consultation' }
const bu = { schemaVersion: 'business-understanding-v2', audience: 'equipos que necesitan claridad', primaryGoal: 'entender la propuesta semántica', businessType: 'servicio digital', customerNeeds: ['comparar opciones'], customerQuestions: ['qué incluye'], trustDrivers: ['método visible', 'acompañamiento', 'revisión'], conversionActions: ['consultar'], serviceModel: 'acompañamiento', domainVocabulary: ['servicio', 'incluye', 'empieza', 'alcance', 'revisa', 'método', 'visible', 'acompañamiento', 'revisión'], tone: 'claro' }
const contentA = { schemaVersion: 'content-plan-v2', hero: 'Hero semántico A.', presentation: 'Presentación semántica A.', services: ['Servicio A para ordenar decisiones.', 'Servicio B para reducir fricción.'], trust: ['Método A explicado.', 'Alcance A visible.', 'Acompañamiento A disponible.', 'Revisión A antes de avanzar.'], faq: ['Qué incluye A?', 'Cómo empieza A?', 'Qué alcance tiene A?', 'Cómo se revisa A?'], contact: 'Consultar A.', contentPriorities: ['claridad'] }
const contentB = { ...contentA, hero: 'Hero semántico B.', presentation: 'Presentación semántica B.', services: ['Servicio C para ordenar decisiones.', 'Servicio D para reducir fricción.'], trust: ['Método B explicado.', 'Alcance B visible.', 'Acompañamiento B disponible.', 'Revisión B antes de avanzar.'], faq: ['Qué incluye B?', 'Cómo empieza B?', 'Qué alcance tiene B?', 'Cómo se revisa B?'], contact: 'Consultar B.' }
contentA.trust = ['Metodo A visible y documentado para cada etapa.', 'Alcance A claro antes de comenzar el trabajo.', 'Acompanamiento A durante la implementacion completa.', 'Revision A con criterios visibles antes de avanzar.']
contentA.faq = [{ question: 'Que incluye el servicio A?', answer: 'Incluye alcance, entregables y una forma clara de revisar cada avance.' }, { question: 'Como empieza el trabajo A?', answer: 'Empieza con una conversacion breve para ordenar necesidades y prioridades.' }, { question: 'Que alcance tiene el servicio A?', answer: 'El alcance se define por etapas para mantener decisiones previsibles.' }, { question: 'Como se revisa el servicio A?', answer: 'Cada etapa se revisa con criterios visibles antes de continuar.' }]
contentB.trust = ['Metodo B visible y documentado para cada etapa.', 'Alcance B claro antes de comenzar el trabajo.', 'Acompanamiento B durante la implementacion completa.', 'Revision B con criterios visibles antes de avanzar.']
contentB.faq = [{ question: 'Que incluye el servicio B?', answer: 'Incluye alcance, entregables y una forma clara de revisar cada avance.' }, { question: 'Como empieza el trabajo B?', answer: 'Empieza con una conversacion breve para ordenar necesidades y prioridades.' }, { question: 'Que alcance tiene el servicio B?', answer: 'El alcance se define por etapas para mantener decisiones previsibles.' }, { question: 'Como se revisa el servicio B?', answer: 'Cada etapa se revisa con criterios visibles antes de continuar.' }]
const specFor = (content, experience) => ({ schemaVersion: 'semantic-generation-spec-v1', ...{ planning: adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: content, experiencePlan: experience }), sectionOrder: experience.sectionOrder.filter((item) => item !== 'inicio'), heroVariant: experience.heroVariant, treatments: experience.sectionTreatments, creativeDirection: 'editorial', contentDensity: experience.contentDensity, ctaStrategy: experience.conversionStrategy, preservedQualities: ['responsive'], prohibitedChanges: ['source-version-immutable'] } })
const experienceB = { ...baseExperience, sectionOrder: ['inicio', 'confianza', 'faq', 'servicios', 'relato', 'contacto'], heroVariant: 'compact', servicesTreatment: 'service-list', faqTreatment: 'accordion' }
contentA.trust[0] = 'Metodo A visible y documentado para cada etapa.'
const specA = specFor(contentA, baseExperience)
const specB = specFor(contentB, experienceB)
assert.equal(adaptSemanticGenerationSpec(specA).planning.content.title, 'Hero semántico A.')
assert.equal(adaptSemanticGenerationSpec(specB).planning.content.title, 'Hero semántico B.')
assert.notDeepEqual(specA.planning, specB.planning)

async function materialize(spec, versionId) {
  return generation.materializeProject({ project: { ...source.project, activeVersionId: versionId, runId: `run-${versionId}`, physicalPaths: { projectRoot: path.join(root, 'semantic-consumption', versionId), manifestPath: path.join(root, 'semantic-consumption', versionId, 'manifest.json'), deliveryPath: null }, versions: [{ ...source.project.versions[0], versionId, runId: `run-${versionId}` }] }, destinationRoot: root, capabilities: {}, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: spec }, providedAssets: [] })
}
const candidateA = await materialize(specA, 'version-v0002')
const candidateB = await materialize(specB, 'version-v0003')
const htmlA = await fs.readFile(path.join(candidateA.projectRoot, 'app', 'index.html'), 'utf8')
const htmlB = await fs.readFile(path.join(candidateB.projectRoot, 'app', 'index.html'), 'utf8')
assert.notEqual(htmlA, htmlB)
assert.match(htmlA, /Hero semántico A/u); assert.match(htmlA, /Servicio A/u); assert.match(htmlA, /Consultar A/u)
assert.match(htmlB, /Hero semántico B/u); assert.match(htmlB, /Servicio C/u); assert.match(htmlB, /Consultar B/u)
assert.match(htmlA, /comparar opciones/u); assert.match(htmlA, /visible/u)
assert.ok(htmlA.indexOf('id="servicios"') < htmlA.indexOf('id="confianza"'))
assert.ok(htmlB.indexOf('id="confianza"') < htmlB.indexOf('id="servicios"'))
assert.doesNotMatch(htmlA, /Hero legacy/u); assert.doesNotMatch(htmlB, /Hero legacy/u)
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: null, experiencePlan: baseExperience }), /ContentPlanV2/u)
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: contentA, experiencePlan: null }), /ExperiencePlanV2/u)
/* Section identity is resolved against the canonical catalog; arbitrary labels fail closed. */
assert.throws(() => specFor(contentA, { ...baseExperience, sectionOrder: ['inicio', 'presentacion', 'servicios', 'confianza', 'faq', 'contacto'] }), /UNKNOWN_SEMANTIC_SECTION/u)
const labelledPlanning = { ...source.project.planning, build: { ...source.project.planning.build, sectionContracts: source.project.planning.build.sectionContracts.map((item) => item.id === 'servicios' ? { ...item, label: 'Servicios profesionales' } : item) } }
const labelledContent = { ...contentA, sections: [{ id: 'inicio', role: 'hero', label: 'Inicio', kind: 'hero', required: true, contentRef: 'hero' }, { id: 'servicios', role: 'services', label: 'Servicios profesionales', kind: 'service-catalog', required: true, contentRef: 'services' }, { id: 'confianza', role: 'trust', label: 'Confianza', kind: 'proof', required: false, contentRef: 'trust' }, { id: 'faq', role: 'faq', label: 'FAQ', kind: 'faq', required: false, contentRef: 'faq' }, { id: 'contacto', role: 'contact', label: 'Contacto', kind: 'conversion-form', required: true, contentRef: 'contact' }] }
const labelledSpec = { schemaVersion: 'semantic-generation-spec-v1', planning: adaptSemanticPlansToPlanning({ sourcePlanning: labelledPlanning, businessUnderstanding: bu, contentPlan: labelledContent, experiencePlan: { ...baseExperience, sectionOrder: ['inicio', 'Servicios profesionales', 'Confianza', 'FAQ', 'Contacto'], ctaPositions: ['inicio', 'Contacto'] } }), sectionOrder: ['servicios', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', treatments: ['semantic'], preservedQualities: [], prohibitedChanges: [] }
assert.deepEqual(adaptSemanticGenerationSpec(labelledSpec).sectionOrder, ['servicios', 'confianza', 'faq', 'contacto'])
const ambiguousContent = { ...labelledContent, sections: labelledContent.sections.map((item) => item.id === 'confianza' ? { ...item, label: 'Servicios profesionales' } : item) }
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: ambiguousContent, experiencePlan: { ...baseExperience, sectionOrder: ['inicio', 'Servicios profesionales', 'faq', 'contacto'] } }), /AMBIGUOUS_SEMANTIC_SECTION/u)
assert.throws(() => adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: bu, contentPlan: contentA, experiencePlan: { ...baseExperience, sectionOrder: ['inicio', 'No existe', 'faq', 'contacto'] } }), /UNKNOWN_SEMANTIC_SECTION/u)
assert.equal(adaptSemanticGenerationSpec({ ...specA }).schemaVersion, 'normalized-generation-plan-v1')
await fs.rm(root, { recursive: true, force: true })
console.log('PASS jefe-semantic-generation-plan-consumption-smoke: pre-fix conflict reproduced, ContentPlanV2/ExperiencePlanV2 authority, legacy planning excluded, missing plans fail closed, A/B artifacts differ, standard adapter contract preserved')
