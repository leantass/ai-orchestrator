import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createSemanticRuntimeComposition } = require('../electron/jefe-semantic-runtime-composition.cjs')
const { ProviderRunBudget } = require('../electron/jefe-semantic-provider.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-content-plan-contract-'))
const sections = [
  { id: 'inicio-principal', role: 'hero', label: 'Inicio', kind: 'hero', required: true, contentRef: 'hero', aliases: [] },
  { id: 'narrativa-clara', role: 'presentation', label: 'Propuesta', kind: 'narrative', required: false, contentRef: 'presentation', aliases: [] },
  { id: 'oferta-profesional', role: 'services', label: 'Servicios', kind: 'service-catalog', required: false, contentRef: 'services', aliases: [] },
  { id: 'prueba-confianza', role: 'trust', label: 'Confianza', kind: 'proof', required: false, contentRef: 'trust', aliases: [] },
  { id: 'dudas-clientes', role: 'faq', label: 'Preguntas', kind: 'faq', required: false, contentRef: 'faq', aliases: [] },
  { id: 'accion-final', role: 'contact', label: 'Contacto', kind: 'conversion-form', required: true, contentRef: 'contact', aliases: [] },
]
const contentPlan = { schemaVersion: 'content-plan-v2', hero: 'Una propuesta clara.', presentation: 'Una explicación útil.', services: ['Servicios diferenciados.'], trust: ['Criterios verificables.'], faq: [{ question: '¿Cómo empieza?', answer: 'Empieza con un brief claro.' }, { question: '¿Qué incluye?', answer: 'Incluye alcance y seguimiento.' }, { question: '¿Cuánto tarda?', answer: 'Cada etapa tiene plazos visibles.' }, { question: '¿Cómo revisamos?', answer: 'Revisamos cada hito.' }], contact: 'Conversar', contentPriorities: ['claridad'], sections }
const businessUnderstanding = { schemaVersion: 'business-understanding-v2', businessType: 'servicios', businessModel: 'consultoría', audience: 'equipos', primaryGoal: 'ordenar la operación', customerNeeds: ['claridad'], customerQuestions: ['alcance'], trustDrivers: ['criterios'], conversionActions: ['conversar'], serviceModel: 'acompañamiento', domainVocabulary: ['entregables'], tone: 'claro' }
const experiencePlan = { schemaVersion: 'experience-plan-v2', contentSectionCatalogHash: null, archetype: 'guided', sectionOrder: sections.map((item) => item.id), heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', ctaPositions: ['inicio-principal', 'accion-final'], servicesTreatment: 'cards', trustTreatment: 'proof', faqTreatment: 'accordion', conversionStrategy: 'consultation' }
function fakeComposition(content = contentPlan) {
  const provider = { providerId: 'offline-fixture', model: 'balanced-model', enabled: true, credentialAvailable: true }
  const brain = { async decide({ operation, input }) { if (operation === 'business_understanding') return { decision: businessUnderstanding }; if (operation === 'content_plan') return { decision: content }; const catalog = JSON.parse(input.at(-1).content[0].text).contentSectionCatalog; return { decision: { ...experiencePlan, sectionOrder: catalog.map((item) => item.id) } } } }
  return createSemanticRuntimeComposition({ root, mode: 'productive', semanticProvider: provider, semanticBrainAdapter: brain, callBudget: new ProviderRunBudget({ runId: `offline-${Date.now()}`, maxCalls: 6 }), env: { AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true' } })
}
const validPhases = []
await fakeComposition().runSemanticPlans({ brief: { audience: 'equipos', objective: 'ordenar', services: ['servicio'], customerNeeds: ['claridad'], trustDrivers: ['criterios'], conversionActions: ['conversar'] }, onPhase: async (phase) => validPhases.push(phase) })
assert.ok(validPhases.includes('CONTENT_PLAN_READY'))
const invalidPhases = []
const invalid = { ...contentPlan, sections: sections.map((item) => item.id === 'oferta-profesional' ? { ...item, kind: 'proof' } : item) }
await assert.rejects(() => fakeComposition(invalid).runSemanticPlans({ brief: { audience: 'equipos', objective: 'ordenar', services: ['servicio'], customerNeeds: ['claridad'], trustDrivers: ['criterios'], conversionActions: ['conversar'] }, onPhase: async (phase) => invalidPhases.push(phase) }), { code: 'SEMANTIC_SECTION_CONTENT_MISMATCH' })
assert.deepEqual(invalidPhases, ['BUSINESS_UNDERSTANDING_READY'])
await fs.rm(root, { recursive: true, force: true })
console.log('PASS jefe-semantic-content-plan-contract-smoke: full ContentPlan validation precedes CONTENT_PLAN_READY and invalid contracts fail after business understanding')
