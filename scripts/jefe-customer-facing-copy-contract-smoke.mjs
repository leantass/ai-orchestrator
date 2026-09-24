import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { CONTENT_PLAN_SCHEMA, validateContentPlanDecision, validateStructuredOutputSchema } = require('../electron/jefe-semantic-provider.cjs')
const { assessCustomerFacingCopy } = require('../electron/jefe-generator-quality.cjs')
const root = '.codex-temp/orchestrator-real-smoke/orchestrator-real-smoke/version-v0004'
validateStructuredOutputSchema(CONTENT_PLAN_SCHEMA)
const sections = [{ id: 'hero-main', role: 'hero', label: 'Inicio', kind: 'hero', required: true, contentRef: 'hero', aliases: [] }, { id: 'services-main', role: 'services', label: 'Servicios', kind: 'service-catalog', required: false, contentRef: 'services', aliases: [] }, { id: 'trust-main', role: 'trust', label: 'Confianza', kind: 'proof', required: false, contentRef: 'trust', aliases: [] }, { id: 'faq-main', role: 'faq', label: 'Preguntas frecuentes', kind: 'faq', required: false, contentRef: 'faq', aliases: [] }, { id: 'contact-main', role: 'contact', label: 'Contacto', kind: 'conversion-form', required: true, contentRef: 'contact', aliases: [] }]
const valid = { schemaVersion: 'content-plan-v2', hero: 'Convertí procesos manuales en un flujo claro', presentation: 'Una propuesta concreta para avanzar con visibilidad.', services: [{ title: 'Alcance definido', description: 'Definimos objetivos y entregables concretos para avanzar con visibilidad.' }], trust: [{ title: 'Plazos visibles', description: 'Cada etapa tiene un plazo claro.' }], faq: Array.from({ length: 4 }, (_, index) => ({ question: `¿Qué incluye la etapa ${index + 1}?`, answer: 'Incluye alcance y seguimiento claro.' })), contact: { ctaLabel: 'Agendar una conversación', supportingText: 'Podés elegir una llamada breve para contar tu objetivo.' }, contentPriorities: ['claridad'], sections }
assert.equal(validateContentPlanDecision(valid), valid)
assert.throws(() => validateContentPlanDecision({ ...valid, trust: ['Plazos visibles.'] }), { code: 'SEMANTIC_CONTENT_PLAN_TRUST_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...valid, contact: 'Agendar una conversación' }), { code: 'SEMANTIC_CONTENT_PLAN_CONTACT_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...valid, services: ['Alcance definido.'] }), { code: 'SEMANTIC_CONTENT_PLAN_SERVICES_INVALID' })
const html = await fs.readFile(`${root}/app/index.html`, 'utf8')
const source = JSON.parse(await fs.readFile(`${root}/manifest.json`, 'utf8')).contract
const replay = assessCustomerFacingCopy({ html, planning: source.planning })
assert.equal(replay.heroQuality.status, 'NEEDS_CORRECTION')
assert.equal(replay.ctaQuality.status, 'NEEDS_CORRECTION')
assert.equal(replay.trustHeadingQuality.status, 'NEEDS_CORRECTION')
assert.equal(replay.faqHeadingQuality.status, 'NEEDS_CORRECTION')
console.log('PASS jefe-customer-facing-copy-contract-smoke')
