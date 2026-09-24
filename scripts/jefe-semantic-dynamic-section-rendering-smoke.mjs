import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const contract = require('../electron/jefe-project-contract.cjs')
const generation = require('../electron/jefe-real-generation.cjs')
const { adaptSemanticPlansToPlanning } = require('../electron/jefe-semantic-generation-adapter.cjs')
const { compareGeneratedContent } = require('../electron/jefe-product-planning.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-dynamic-sections-'))
const sectionCatalog = [
  { id: 'inicio-principal', role: 'hero', label: 'Inicio principal', kind: 'hero', required: true, contentRef: 'hero' },
  { id: 'oferta-profesional', role: 'services', label: 'Oferta profesional', kind: 'service-catalog', required: true, contentRef: 'services' },
  { id: 'prueba-confianza', role: 'trust', label: 'Prueba de confianza', kind: 'proof', required: false, contentRef: 'trust' },
  { id: 'dudas-clientes', role: 'faq', label: 'Dudas de clientes', kind: 'faq', required: false, contentRef: 'faq' },
  { id: 'accion-final', role: 'contact', label: 'Accion final', kind: 'conversion-form', required: true, contentRef: 'contact' },
]
const businessUnderstanding = { schemaVersion: 'business-understanding-v2', audience: 'equipos', primaryGoal: 'decidir con claridad', customerNeeds: ['comparar opciones'], customerQuestions: ['que incluye'], trustDrivers: ['metodo'], conversionActions: ['conversar'] }
const contentA = { schemaVersion: 'content-plan-v2', hero: 'Hero dinamico A con promesa clara.', presentation: 'Presentacion A para decidir.', services: [{ title: 'Servicio A', description: 'Servicio A ordena decisiones con alcance visible y seguimiento claro.' }, { title: 'Servicio B', description: 'Servicio B reduce friccion con entregables concretos y revision guiada.' }], trust: ['Metodo A visible y documentado.', 'Alcance A claro para cada etapa.', 'Acompanamiento A durante la implementacion.', 'Revision A antes de avanzar.'], faq: [{ question: 'Que incluye el servicio?', answer: 'Incluye alcance, entregables y una forma clara de revisar cada avance.' }, { question: 'Como empieza el trabajo?', answer: 'Empieza con una conversacion breve para ordenar necesidades y prioridades.' }, { question: 'Que alcance tiene?', answer: 'El alcance se define por etapas para mantener decisiones previsibles.' }, { question: 'Como se revisa?', answer: 'Cada etapa se revisa con criterios visibles antes de continuar.' }], contact: 'Iniciar conversacion A.', contentPriorities: ['claridad'], sections: sectionCatalog }
const contentB = { ...contentA, hero: 'Hero dinamico B con promesa distinta.', presentation: 'Presentacion B para decidir.', services: [{ title: 'Servicio C', description: 'Servicio C organiza entregables con hitos medibles y acompanamiento cercano.' }, { title: 'Servicio D', description: 'Servicio D prepara decisiones con criterios comparables y revision ordenada.' }], trust: ['Metodo B documentado para cada etapa.', 'Alcance B visible antes de empezar.', 'Acompanamiento B durante el trabajo.', 'Revision B con criterios compartidos.'], contact: 'Iniciar conversacion B.' }
const contentA2 = { ...contentA, trust: [{ title: 'Metodo visible', description: 'Metodo A visible y documentado.' }, { title: 'Alcance claro', description: 'Alcance A claro para cada etapa.' }, { title: 'Acompanamiento cercano', description: 'Acompanamiento A durante la implementacion.' }, { title: 'Revision guiada', description: 'Revision A antes de avanzar.' }], contact: { ctaLabel: 'Iniciar conversacion A', supportingText: 'Podemos conversar sobre el siguiente paso.' } }
const contentB2 = { ...contentB, trust: [{ title: 'Metodo documentado', description: 'Metodo B documentado para cada etapa.' }, { title: 'Alcance visible', description: 'Alcance B visible antes de empezar.' }, { title: 'Acompanamiento activo', description: 'Acompanamiento B durante el trabajo.' }, { title: 'Revision compartida', description: 'Revision B con criterios compartidos.' }], contact: { ctaLabel: 'Iniciar conversacion B', supportingText: 'Podemos conversar sobre el siguiente paso.' } }
const experienceA = { schemaVersion: 'experience-plan-v2', archetype: 'guided', sectionOrder: sectionCatalog.map((item) => item.id), heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', ctaPositions: ['inicio-principal', 'accion-final'], servicesTreatment: 'cards', trustTreatment: 'proof', faqTreatment: 'answers', conversionStrategy: 'consultation' }
const experienceB = { ...experienceA, sectionOrder: ['inicio-principal', 'dudas-clientes', 'oferta-profesional', 'prueba-confianza', 'accion-final'], servicesTreatment: 'list', faqTreatment: 'accordion' }

try {
  const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'dynamic-section-rendering', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'factory_typed', projectName: 'Dynamic Sections', brief: 'A clear local project.', businessType: 'digital service', audience: 'teams', proposition: 'A clear proposition.', objective: 'Decide clearly', brandSpec: { name: 'Dynamic Sections' } })
  assert.equal(source.ok, true)
  const sourcePlanning = source.project.planning
  const planningA = adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding, contentPlan: contentA2, experiencePlan: experienceA })
  const planningB = adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding, contentPlan: contentA2, experiencePlan: experienceB })
  const planningC = adaptSemanticPlansToPlanning({ sourcePlanning, businessUnderstanding, contentPlan: contentB2, experiencePlan: experienceA })
  const specFor = (planning, experience) => ({ schemaVersion: 'semantic-generation-spec-v1', planning, sectionOrder: experience.sectionOrder.filter((id) => id !== 'inicio-principal'), heroVariant: experience.heroVariant, treatments: experience.sectionTreatments, creativeDirection: 'editorial', contentDensity: experience.contentDensity, ctaStrategy: experience.conversionStrategy, preservedQualities: [], prohibitedChanges: [] })
  async function materialize(planning, experience, versionId) {
    const project = contract.normalizeProjectContract({ ...source.project, generationProfile: 'commercial_site', visualDirection: 'editorial', activeVersionId: versionId, runId: `run-${versionId}`, physicalPaths: { projectRoot: path.join(root, 'dynamic-section-rendering', versionId), manifestPath: path.join(root, 'dynamic-section-rendering', versionId, 'manifest.json'), deliveryPath: null }, versions: [{ ...source.project.versions[0], versionId, runId: `run-${versionId}` }] }, { allowedRoots: [root] })
    const spec = specFor(planning, experience)
    const output = await generation.materializeProject({ project, destinationRoot: root, capabilities: {}, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: spec }, providedAssets: [] })
    const html = await fs.readFile(path.join(output.projectRoot, 'app/index.html'), 'utf8')
    assert.equal(compareGeneratedContent(planning, html).pass, true)
    return { html, ids: [...html.matchAll(/<section id="([^"]+)/gu)].map((match) => match[1]) }
  }
  const renderedA = await materialize(planningA, experienceA, 'version-v0002')
  const renderedB = await materialize(planningB, experienceB, 'version-v0003')
  const renderedC = await materialize(planningC, experienceA, 'version-v0004')
  assert.deepEqual(renderedA.ids, ['inicio-principal', 'oferta-profesional', 'prueba-confianza', 'dudas-clientes', 'accion-final'])
  assert.deepEqual(renderedB.ids, ['inicio-principal', 'dudas-clientes', 'oferta-profesional', 'prueba-confianza', 'accion-final'])
  assert.deepEqual(renderedA.ids.slice().sort(), renderedB.ids.slice().sort())
  assert.equal(compareGeneratedContent(planningA, renderedB.html).pass, true)
  assert.equal(compareGeneratedContent(planningC, renderedA.html).pass, false)
  assert.equal(renderedA.html.includes('Hero dinamico A'), true)
  assert.equal(renderedC.html.includes('Hero dinamico B'), true)
  assert.equal(renderedA.html.includes('Iniciar conversacion A'), true)
  assert.equal(renderedC.html.includes('Iniciar conversacion B'), true)
  assert.notEqual(renderedA.html, renderedB.html)
  assert.notEqual(renderedA.html, renderedC.html)
  console.log('PASS jefe-semantic-dynamic-section-rendering-smoke: dynamic catalog IDs, catalog-driven renderer, structure/copy authority separation')
} finally { await fs.rm(root, { recursive: true, force: true }) }
