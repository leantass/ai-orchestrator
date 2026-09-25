import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { assessCustomerClaimGrounding, assessHeroScannability } = require('../electron/jefe-generator-quality.cjs')

const section = (id, role, kind, contentRef, required = true, label = id) => ({ id, role, kind, contentRef, required, label, aliases: [] })
const base = {
  schemaVersion: 'jefe-product-planning/v1',
  semanticRefs: { contentPlan: 'ContentPlanV2' },
  brief: {
    need: 'Ordenar procesos y automatizar tareas para mejorar ventas.',
    objective: 'Generar reuniones con dueños de PyMEs.',
    businessType: 'Consultora para PyMEs',
    audience: 'Dueños de PyMEs',
    proposition: 'Ayudamos a ordenar procesos y automatizar tareas.',
    services: ['Diagnóstico de procesos', 'Automatización operativa'],
    primaryCta: 'Solicitar una reunión',
  },
  experience: { sections: ['inicio', 'servicios', 'confianza', 'faq', 'contacto'], forms: [{ submitAction: 'Solicitar una reunión' }] },
  build: { sectionContracts: ['inicio', 'servicios', 'confianza', 'faq', 'contacto'].map((id) => ({ id })) },
  content: {
    sections: [section('inicio', 'hero', 'hero', 'hero'), section('servicios', 'services', 'service-catalog', 'services'), section('confianza', 'trust', 'proof', 'trust', false), section('faq', 'faq', 'faq', 'faq', false), section('contacto', 'contact', 'conversion-form', 'contact')],
    hero: { title: 'Ordená procesos y mejorá tu operación', description: 'Un camino claro para avanzar.' },
    title: 'Ordená procesos y mejorá tu operación', subtitle: 'Un camino claro para avanzar.',
    presentation: 'Un camino claro para avanzar.',
    services: [{ title: 'Diagnóstico de procesos', description: 'Identificamos prioridades y próximos pasos.', source: 'ContentPlanV2.services' }],
    trustItems: [{ title: 'Alcance visible', description: 'Definimos prioridades y próximos pasos.', source: 'ContentPlanV2.trust' }],
    faq: [{ question: '¿Cómo empieza?', answer: 'Comenzamos entendiendo el contexto y las prioridades.', source: 'ContentPlanV2.faq' }],
    contact: { ctaLabel: 'Solicitar una reunión', supportingText: 'Coordinamos una conversación para entender el contexto.' },
    ctas: ['Solicitar una reunión'],
  },
}
const html = '<section id="inicio"><h1>Ordená procesos y mejorá tu operación</h1><p>Un camino claro para avanzar.</p><a class="cta">Solicitar una reunión</a></section><section id="servicios"><h2>Servicios</h2><h3>Diagnóstico de procesos</h3><p>Identificamos prioridades y próximos pasos.</p></section><section id="confianza"><h2>Confianza</h2><h3>Alcance visible</h3><p>Definimos prioridades y próximos pasos.</p></section><section id="faq"><h2>Preguntas frecuentes</h2><summary>¿Cómo empieza?</summary><p>Comenzamos entendiendo el contexto y las prioridades.</p></section><section id="contacto"><h2>Contacto</h2><form id="primary-contact"><button>Solicitar una reunión</button></form></section>'
const safe = assessCustomerClaimGrounding({ planning: base, html })
assert.equal(safe.customerClaimGrounding.pass, true)
assert.equal(safe.renderedCustomerClaimGrounding.pass, true)
assert.equal(assessHeroScannability({ planning: base, html }).pass, true)

const bad = structuredClone(base)
bad.content.hero.title = 'Resultados medibles desde el primer mes'
bad.content.services[0].description = 'Implementamos CRM liviano con hoja de ruta 30-60-90.'
bad.content.trustItems[0].description = 'Respondemos en 24 h con enfoque PyME probado.'
const badHtml = html.replace('Ordená procesos y mejorá tu operación', 'Resultados medibles desde el primer mes').replace('Identificamos prioridades y próximos pasos.', 'Implementamos CRM liviano con hoja de ruta 30-60-90.').replace('Definimos prioridades y próximos pasos.', 'Respondemos en 24 h con enfoque PyME probado.')
const finding = assessCustomerClaimGrounding({ planning: bad, html: badHtml })
assert.equal(finding.customerClaimGrounding.pass, false)
assert.equal(finding.renderedCustomerClaimGrounding.pass, false)
assert.ok(finding.customerClaimGrounding.findingCount >= 3)
const long = structuredClone(base)
long.content.hero.title = 'Una propuesta muy extensa que contiene demasiadas palabras y varias ideas distintas para una sola cabecera principal customer-facing poco escaneable y difícil de leer en una primera mirada del usuario, con más contexto, detalles, promesas, explicaciones y pasos de trabajo de los que una portada debería mostrar'
assert.equal(assessHeroScannability({ planning: long, html: html.replace('Ordená procesos y mejorá tu operación', long.content.hero.title) }).pass, false)
console.log('PASS jefe-customer-claim-grounding-smoke: grounded copy, rendered claims and hero scannability are enforced')
