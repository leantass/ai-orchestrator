import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { CONTENT_PLAN_SCHEMA, validateStructuredOutputSchema, validateContentPlanDecision } = require('../electron/jefe-semantic-provider.cjs')
const { serviceCardQuality } = require('../electron/jefe-generator-quality.cjs')

const root = path.resolve('.codex-temp/orchestrator-real-smoke/orchestrator-real-smoke/version-v0005')
const planning = JSON.parse(await fs.readFile(path.join(root, 'data/planning.json'), 'utf8'))
const html = await fs.readFile(path.join(root, 'app/index.html'), 'utf8')
const base = {
  schemaVersion: 'content-plan-v2', hero: 'Una propuesta clara.', presentation: 'Un proceso claro y visible.',
  services: [{ title: 'Definición y prototipo', description: 'Definimos alcance, mapa del sitio y contenidos, y entregamos un prototipo navegable para validar antes de implementar.' }],
  trust: [{ title: 'Alcance definido', description: 'Cada entrega tiene criterios concretos y visibles.' }],
  faq: Array.from({ length: 4 }, (_, index) => ({ question: `¿Qué incluye la etapa ${index + 1}?`, answer: 'Incluye alcance, entregables y próximos pasos claros.' })),
  contact: { ctaLabel: 'Agendar una conversación', supportingText: 'Podés elegir un horario y conversar sobre el próximo paso.' }, contentPriorities: ['claridad'],
  sections: [{ id: 'hero', role: 'hero', label: 'Inicio', kind: 'hero', required: false, contentRef: 'hero', aliases: [] }, { id: 'services', role: 'services', label: 'Servicios', kind: 'service-catalog', required: false, contentRef: 'services', aliases: [] }]
}
validateStructuredOutputSchema(CONTENT_PLAN_SCHEMA)
assert.equal(CONTENT_PLAN_SCHEMA.schema.properties.services.items.additionalProperties, false)
validateContentPlanDecision(base)
assert.throws(() => validateContentPlanDecision({ ...base, services: ['Pack 1'] }), { code: 'SEMANTIC_CONTENT_PLAN_SERVICES_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...base, services: [{ title: 'Pack 1', description: 'Una descripción concreta del servicio.' }] }), { code: 'SEMANTIC_CONTENT_PLAN_SERVICE_TITLE_INVALID' })
assert.throws(() => validateContentPlanDecision({ ...base, services: [{ title: 'Definición y prototipo', description: 'Definición y prototipo' }] }), { code: 'SEMANTIC_CONTENT_PLAN_SERVICE_DUPLICATE' })
assert.throws(() => validateContentPlanDecision({ ...base, services: [{ title: 'Definición y prototipo con alcance, entregables, plazos, hitos y validación completa', description: 'Una descripción separada y concreta.' }] }), { code: 'SEMANTIC_CONTENT_PLAN_SERVICE_TITLE_INVALID' })
const positive = serviceCardQuality({ content: { services: base.services } }, '<article class="benefit-card"><h3>Definición y prototipo</h3><p>Definimos alcance, mapa del sitio y contenidos, y entregamos un prototipo navegable para validar antes de implementar.</p></article>')
assert.equal(positive.serviceCardQuality.status, 'PASS')
assert.equal(positive.renderedServiceCardQuality.status, 'PASS')
const replay = serviceCardQuality(planning, html)
assert.equal(replay.renderedServiceCardQuality.status, 'NEEDS_CORRECTION')
assert.ok(replay.serviceCardQuality.findings.length + replay.renderedServiceCardQuality.findings.length > 0)
console.log(JSON.stringify({ schema: 'PASS', positive: 'PASS', legacyPlanningReplay: 'FAIL', planningFindings: replay.serviceCardQuality.findings, renderedFindings: replay.renderedServiceCardQuality.findings }, null, 2))
