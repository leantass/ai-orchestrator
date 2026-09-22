import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { CONTENT_PLAN_SCHEMA, validateContentPlanDecision, validateStructuredOutputSchema } = require('../electron/jefe-semantic-provider.cjs')
const { adaptSemanticPlansToPlanning } = require('../electron/jefe-semantic-generation-adapter.cjs')
const { compareGeneratedContent, inspectGeneratedArtifactGrammar } = require('../electron/jefe-product-planning.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-structured-faq-'))
try {
  validateStructuredOutputSchema(CONTENT_PLAN_SCHEMA)
  const faqSchema = CONTENT_PLAN_SCHEMA.schema.properties.faq.items
  assert.deepEqual(faqSchema.required, ['question', 'answer'])
  assert.equal(faqSchema.additionalProperties, false)
  const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'structured-faq', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'FAQ contract', brief: 'Servicios concretos para equipos.', businessType: 'servicio digital', audience: 'equipos', proposition: 'Una propuesta clara.', primaryCta: 'Conversar con el equipo', brandSpec: { name: 'FAQ contract' } })
  assert.equal(source.ok, true)
  const faq = [
    { question: '¿Qué necesito aportar para empezar?', answer: 'Al inicio alcanza con compartir objetivos, materiales disponibles y las principales prioridades.' },
    { question: '¿Cómo se define el alcance?', answer: 'El alcance se acuerda por etapas con entregables y prioridades visibles.' },
    { question: '¿Cuánto demora el primer avance?', answer: 'El primer avance depende del contexto disponible y del alcance acordado.' },
    { question: '¿Cómo revisamos el resultado?', answer: 'Cada etapa se revisa con criterios concretos antes de continuar.' },
  ]
  const content = { schemaVersion: 'content-plan-v2', hero: 'Una propuesta clara.', presentation: 'Un recorrido concreto para decidir.', services: ['Servicio estratégico con alcance visible.', 'Servicio operativo con entregables concretos.'], trust: ['Método visible para cada etapa.', 'Alcance claro antes de comenzar.', 'Acompañamiento durante el avance.', 'Revisión con criterios concretos.'], faq, contact: 'Conversar con el equipo.', contentPriorities: ['claridad'], sections: [{ id: 'inicio', role: 'hero', label: 'Inicio', kind: 'hero', required: true, contentRef: 'hero', aliases: [] }, { id: 'servicios', role: 'services', label: 'Servicios', kind: 'service-catalog', required: true, contentRef: 'services', aliases: [] }, { id: 'confianza', role: 'trust', label: 'Confianza', kind: 'proof', required: false, contentRef: 'trust', aliases: [] }, { id: 'faq', role: 'faq', label: 'FAQ', kind: 'faq', required: false, contentRef: 'faq', aliases: [] }, { id: 'contacto', role: 'contact', label: 'Contacto', kind: 'conversion-form', required: true, contentRef: 'contact', aliases: [] }] }
  const businessUnderstanding = { ...source.project.planning.content.businessUnderstanding, schemaVersion: 'business-understanding-v2' }
  const experience = { schemaVersion: 'experience-plan-v2', archetype: 'guided', sectionOrder: ['inicio', 'servicios', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', ctaPositions: ['inicio', 'contacto'], servicesTreatment: 'service-cards', trustTreatment: 'criteria', faqTreatment: 'decision-help', conversionStrategy: 'consultation' }
  validateContentPlanDecision(content)
  const planning = adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding, contentPlan: content, experiencePlan: experience })
  assert.equal(planning.content.faq[0].question, faq[0].question)
  assert.equal(planning.content.faq[0].answer, faq[0].answer)
  assert.equal(inspectGeneratedArtifactGrammar(planning).length, 0)
  const html = `<main><h1>${planning.content.hero.title}</h1><p>${planning.content.hero.description}</p>${planning.content.services.map((item) => `<article><h3>${item.title}</h3><p>${item.description}</p></article>`).join('')}${planning.content.trustItems.map((item) => `<article><h3>${item.title}</h3><p>${item.description}</p></article>`).join('')}${planning.content.faq.map((item) => `<details><summary>${item.question}</summary><p>${item.answer}</p></details>`).join('')}<button>${planning.content.ctas[0]}</button></main>`
  assert.equal(compareGeneratedContent(planning, html).pass, true)

  const legacy = { ...content, faq: faq.map((item) => `${item.question} ${item.answer}`) }
  assert.throws(() => validateContentPlanDecision(legacy), { code: 'SEMANTIC_CONTENT_PLAN_FAQ_INVALID' })
  const legacyPlanning = adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding, contentPlan: legacy, experiencePlan: experience })
  assert.equal(legacyPlanning.content.faq[0].legacy, true)
  for (const invalid of [{ ...faq[0], question: '' }, { ...faq[0], answer: '' }, { ...faq[0], answer: faq[0].question }, { ...faq[0], answer: 'placeholder' }, { ...faq[0], extra: 'nope' }]) assert.throws(() => validateContentPlanDecision({ ...content, faq: [invalid, ...faq.slice(1)] }), { code: 'SEMANTIC_CONTENT_PLAN_FAQ_INVALID' })
  assert.throws(() => validateContentPlanDecision({ ...content, faq: faq.slice(0, 3) }), { code: 'SEMANTIC_CONTENT_PLAN_FAQ_INVALID' })
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-structured-faq-contract', ProviderFaqSchema: 'OBJECT_QUESTION_ANSWER', schema: 'PASS', adapter: 'PASS', grammar: 'PASS', render: 'PASS', fidelity: 'PASS', legacyRead: 'PASS', negativeCases: 7, ProviderCalls: 0 }))
} finally { await fs.rm(root, { recursive: true, force: true }) }
