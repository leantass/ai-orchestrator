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
const genericHeading = { content: { ...healthy.content, hero: { ...healthy.content.hero, title: 'Experiencia construida alrededor de tu objetivo' } } }
const emptyFaq = { content: { ...healthy.content, faq: [{ question: '¿Qué?', answer: 'Sí.' }] } }
const genericTrustPhrase = { content: { ...healthy.content, trustItems: [{ title: 'Confianza', description: 'Confianza y calidad.' }] } }
const realSemanticContent = {
  content: {
    ...healthy.content,
    businessUnderstanding: {
      ...understanding,
      domainVocabulary: ['servicios profesionales'],
      customerNeeds: ['avanzar con claridad'],
      trustDrivers: ['criterios verificables'],
    },
    faq: [{
      question: '¿Qué necesito aportar como cliente?',
      answer: 'Disponibilidad para 2–3 sesiones breves, materiales de marca, textos base y referencias. Si hay requisitos técnicos, coordinar contacto con la persona responsable.',
      source: 'businessUnderstanding.customerQuestions',
    }],
    trustItems: [
      { title: 'Entregables', description: 'Entregables claros, versionados y con acta de acuerdos.', source: 'businessUnderstanding.trustDrivers' },
      { title: 'Comunicación', description: 'Comunicación ordenada: agenda, un canal y resúmenes de cada hito.', source: 'businessUnderstanding.trustDrivers' },
      { title: 'Ajustes', description: 'Una ronda de ajustes por etapa para proteger tiempos y calidad.', source: 'businessUnderstanding.trustDrivers' },
    ],
  },
}
const replayWithoutProvenance = {
  content: {
    ...realSemanticContent.content,
    faq: realSemanticContent.content.faq.map(({ source, ...item }) => item),
    trustItems: realSemanticContent.content.trustItems.map(({ source, ...item }) => item),
  },
}
const invalidProvenance = { content: { ...realSemanticContent.content, faq: realSemanticContent.content.faq.map((item) => ({ ...item, source: 'untrusted.fixture' })) } }

assert.equal(assessContentQuality(healthy).overallContentStatus, 'PASS')
assert.equal(assessContentQuality(realSemanticContent).overallContentStatus, 'PASS')
const replayReport = assessContentQuality(replayWithoutProvenance)
assert.equal(replayReport.overallContentStatus, 'NEEDS_CORRECTION')
assert.equal(replayReport.findings.filter((item) => item.category === 'faqRelevance').length, 1)
assert.equal(replayReport.findings.filter((item) => item.category === 'trustRelevance').length, 3)
assert.equal(assessContentQuality(invalidProvenance).overallContentStatus, 'NEEDS_CORRECTION')
for (const [name, fixture] of [['duplicate-services', duplicateServices], ['irrelevant-faq', irrelevantFaq], ['generic-trust', genericTrust], ['raw-audience-hero', rawAudienceHero], ['generic-heading', genericHeading], ['empty-faq', emptyFaq], ['generic-trust-phrase', genericTrustPhrase]]) {
  const report = assessContentQuality(fixture)
  assert.equal(report.overallContentStatus, 'NEEDS_CORRECTION', `${name}: ${JSON.stringify(report.findings)}`)
}
console.log(JSON.stringify({ ok: true, smoke: 'jefe-semantic-content-quality', negativeCases: 7, healthyCases: 2, replayFindings: replayReport.findings.length, providerCalls: 0 }, null, 2))
