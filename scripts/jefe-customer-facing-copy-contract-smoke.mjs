import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { CONTENT_PLAN_SCHEMA, validateContentPlanDecision, validateStructuredOutputSchema } = require('../electron/jefe-semantic-provider.cjs')
const { adaptSemanticPlansToPlanning } = require('../electron/jefe-semantic-generation-adapter.cjs')
const { assessCustomerFacingCopy } = require('../electron/jefe-generator-quality.cjs')
const { evaluateCandidate } = require('../electron/jefe-semantic-quality-promotion.cjs')
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const root = '.codex-temp/orchestrator-real-smoke/orchestrator-real-smoke/version-v0004'

validateStructuredOutputSchema(CONTENT_PLAN_SCHEMA)
assert.equal(CONTENT_PLAN_SCHEMA.schema.properties.contact.properties.ctaLabel.type, 'string')
assert.equal(CONTENT_PLAN_SCHEMA.schema.properties.trust.items.properties.title.type, 'string')
const source = JSON.parse(await fs.readFile(`${root}/manifest.json`, 'utf8')).contract
const baseSections = [
  { id: 'hero-main', role: 'hero', label: 'Inicio', kind: 'hero', required: true, contentRef: 'hero', aliases: [] },
  { id: 'presentation-main', role: 'presentation', label: 'Propuesta', kind: 'narrative', required: false, contentRef: 'presentation', aliases: [] },
  { id: 'services-main', role: 'services', label: 'Servicios', kind: 'service-catalog', required: false, contentRef: 'services', aliases: [] },
  { id: 'trust-main', role: 'trust', label: 'Confianza', kind: 'proof', required: false, contentRef: 'trust', aliases: [] },
  { id: 'faq-main', role: 'faq', label: 'Preguntas frecuentes', kind: 'faq', required: false, contentRef: 'faq', aliases: [] },
  { id: 'contact-main', role: 'contact', label: 'Contacto', kind: 'conversion-form', required: true, contentRef: 'contact', aliases: [] },
]
const valid = { schemaVersion: 'content-plan-v2', hero: 'Convertí procesos manuales en un flujo claro', presentation: 'Una propuesta concreta para avanzar con visibilidad.', services: ['Alcance definido.'], trust: [{ title: 'Plazos visibles', description: 'Cada etapa tiene un plazo claro.' }], faq: [{ question: '¿Cómo empieza?', answer: 'Empieza con un brief claro.' }, { question: '¿Qué incluye?', answer: 'Incluye alcance y seguimiento.' }, { question: '¿Cuánto tarda?', answer: 'Cada etapa tiene plazos visibles.' }, { question: '¿Cómo revisamos?', answer: 'Revisamos cada hito.' }], contact: { ctaLabel: 'Agendar una conversación', supportingText: 'Podés elegir una llamada breve o escribirnos para contar tu objetivo.' }, contentPriorities: ['claridad'], sections: baseSections }
assert.equal(validateContentPlanDecision(valid), valid)
assert.throws(() => validateContentPlanDecision({ ...valid, trust: ['Plazos visibles.'] }), { code: 'SEMANTIC_CONTENT_PLAN_TRUST_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...valid, trust: [{ title: 'Criterio 1', description: 'Cada etapa tiene un plazo claro.' }] }), { code: 'SEMANTIC_CONTENT_PLAN_TRUST_TITLE_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...valid, contact: 'Agendar una conversación' }), { code: 'SEMANTIC_CONTENT_PLAN_CONTACT_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...valid, contact: { ctaLabel: 'Dos formas simples de empezar: 1) Agendá una llamada y 2) escribinos para revisar todos los detalles del proyecto.', supportingText: 'Información.' } }), { code: 'SEMANTIC_CONTENT_PLAN_CTA_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...valid, hero: 'Agendá una llamada o escribinos a hola@example.com.' }), { code: 'SEMANTIC_CONTENT_PLAN_HERO_INVALID' })
const legacyContent = { ...valid, trust: ['Plazos visibles.'], contact: 'Agendar una conversación' }
const legacyExperience = { schemaVersion: 'experience-plan-v2', sectionOrder: baseSections.map((item) => item.id), ctaPositions: ['hero-main', 'contact-main'], archetype: 'guided', heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', servicesTreatment: 'cards', trustTreatment: 'proof', faqTreatment: 'accordion', conversionStrategy: 'consultation' }
const legacyBu = { ...source.planning.content.businessUnderstanding, schemaVersion: 'business-understanding-v2' }
const legacyPlanning = adaptSemanticPlansToPlanning({ sourcePlanning: source.planning, businessUnderstanding: legacyBu, contentPlan: legacyContent, experiencePlan: legacyExperience })
assert.equal(legacyPlanning.content.trustItems[0].title, 'Criterio 1')
assert.equal(legacyPlanning.content.ctas[0], 'Agendar una conversación')
const html = await fs.readFile(`${root}/app/index.html`, 'utf8')
const replayQuality = assessCustomerFacingCopy({ html, planning: source.planning })
assert.equal(replayQuality.heroQuality.status, 'NEEDS_CORRECTION')
assert.equal(replayQuality.ctaQuality.status, 'NEEDS_CORRECTION')
assert.equal(replayQuality.trustHeadingQuality.status, 'NEEDS_CORRECTION')
assert.equal(replayQuality.faqHeadingQuality.status, 'NEEDS_CORRECTION')
assert.equal(replayQuality.customerFacingLanguage.status, 'NEEDS_CORRECTION')
const replay = await evaluateCandidate({ candidateRoot: root, planning: source.planning, spec: { schemaVersion: 'semantic-generation-spec-v1', planning: source.planning, sectionOrder: source.planning.experience.sections }, experienceQuality: { status: 'PASS', findings: [] }, browserQuality: { status: 'PASS', checks: {}, findings: [] } })
assert.equal(replay.overallStatus, 'NEEDS_CORRECTION')
assert.equal(replay.ctaQuality.status, 'NEEDS_CORRECTION')
assert.equal(replay.trustHeadingQuality.status, 'NEEDS_CORRECTION')
assert.equal(replay.faqHeadingQuality.status, 'NEEDS_CORRECTION')
console.log('PASS jefe-customer-facing-copy-contract-smoke: structured trust/contact, conservative hero/CTA validation, legacy tolerant read and v0004 quality replay')
