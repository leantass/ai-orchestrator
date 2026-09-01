import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { assessContentQuality } = require('../electron/jefe-generator-quality.cjs')

const understanding = {
  audience: 'equipos de producto', primaryGoal: 'Ordenar la operación digital',
  businessType: 'estudio de estrategia', domainVocabulary: ['estrategia', 'marca', 'producto'],
  customerNeeds: ['ordenar la operación'], customerQuestions: ['¿Cómo se trabaja la estrategia?'],
  trustDrivers: ['alcance claro', 'decisiones explicadas'],
}
const base = { businessUnderstanding: understanding, hero: { supportingNote: 'Decisiones explicadas para ordenar la operación' }, trustItems: [{ title: 'Alcance claro', description: 'Alcance claro y decisiones explicadas.' }], faq: [{ question: '¿Cómo se trabaja la estrategia?', answer: 'Se ordena la estrategia de marca y producto.' }] }
const healthy = { content: { ...base, services: [{ title: 'Diagnóstico', description: 'Relevamiento de contexto y prioridades.' }, { title: 'Dirección', description: 'Criterios de marca para decidir el próximo paso.' }] } }
const duplicateServices = { content: { ...base, services: [{ title: 'A', description: 'Ordenar estrategia de marca para equipos.' }, { title: 'B', description: 'Ordenar estrategia de marca para equipos.' }] } }
const irrelevantFaq = { content: { ...healthy.content, faq: [{ question: '¿Qué incluye una agencia de marketing?', answer: 'Campañas y anuncios para vender más.' }] } }
const genericTrust = { content: { ...healthy.content, trustItems: [{ title: 'Confianza', description: 'Una experiencia excelente para todos.' }] } }
const rawAudienceHero = { content: { ...healthy.content, hero: { supportingNote: 'equipos de producto' } } }

assert.equal(assessContentQuality(healthy).overallContentStatus, 'PASS')
for (const [name, fixture] of [['duplicate-services', duplicateServices], ['irrelevant-faq', irrelevantFaq], ['generic-trust', genericTrust], ['raw-audience-hero', rawAudienceHero]]) {
  const report = assessContentQuality(fixture)
  assert.equal(report.overallContentStatus, 'NEEDS_CORRECTION', `${name}: ${JSON.stringify(report.findings)}`)
}
console.log(JSON.stringify({ ok: true, smoke: 'jefe-semantic-content-quality', negativeCases: 4, healthyCases: 1 }, null, 2))
