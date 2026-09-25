import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createProductPlanning, assessPrimaryCtaFidelity } = require('../electron/jefe-product-planning.cjs')
const { aggregate } = require('../electron/jefe-semantic-quality-promotion.cjs')

const planning = createProductPlanning({
  projectName: 'CTA ownership',
  brief: 'Un servicio profesional con una acción clara.',
  objective: 'Generar conversaciones calificadas.',
  businessType: 'servicios profesionales',
  audience: 'equipos pequeños',
  proposition: 'Una propuesta concreta para avanzar.',
  primaryCta: 'Solicitar una reunión',
})
const canonical = planning.brief.primaryCta
const goodHtml = `<main><section id="inicio"><a class="cta">${canonical}</a></section><section id="conversion"><form id="primary-contact"><button>${canonical}</button></form></section></main>`
const good = assessPrimaryCtaFidelity(planning, goodHtml)
assert.equal(good.status, 'PASS')
assert.equal(good.canonicalPrimaryCta, canonical)

const badPlanning = structuredClone(planning)
badPlanning.content.ctas[0] = 'Agendar reunión'
badPlanning.content.contact.primaryAction = 'Agendar reunión'
badPlanning.content.hero.primaryCTA = 'Agendar reunión'
badPlanning.experience.forms[0].submitAction = 'Agendar reunión'
const badHtml = goodHtml.replaceAll(canonical, 'Agendar reunión')
const replay = assessPrimaryCtaFidelity(badPlanning, badHtml)
assert.equal(replay.status, 'NEEDS_CORRECTION')
assert.ok(replay.findings.some((item) => item.category === 'primaryCtaFidelity'))
assert.ok(replay.findings.some((item) => item.category === 'renderedPrimaryCtaFidelity'))

const gateNames = ['semanticPreGate', 'semanticPlanFidelity', 'artifactIndependence', 'visualQuality', 'contentQuality', 'crossSectionRepetition', 'serviceCardQuality', 'renderedServiceCardQuality', 'heroQuality', 'ctaQuality', 'trustHeadingQuality', 'faqHeadingQuality', 'customerFacingLanguage', 'primaryCtaFidelity', 'renderedPrimaryCtaFidelity', 'experienceQuality', 'browserQuality']
const reports = Object.fromEntries(gateNames.map((name) => [name, { status: 'PASS', pass: true, findingCount: 0, findings: [] }]))
const overall = aggregate({ ...reports, primaryCtaFidelity: replay, renderedPrimaryCtaFidelity: replay })
assert.equal(overall.overallStatus, 'NEEDS_CORRECTION')
assert.equal(overall.eligibleForPromotion, false)
console.log('PASS jefe-primary-cta-ownership-smoke: canonical CTA preserved, old Agendar artifact replay fails, QualityOverall blocks promotion')
