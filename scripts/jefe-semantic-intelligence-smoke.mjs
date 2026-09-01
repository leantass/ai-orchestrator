import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const engine = require('../electron/jefe-semantic-intelligence.cjs')
const fixtures = [
  { audience: 'Equipos que necesitan ordenar su operación', objective: 'Reducir tareas repetitivas y mejorar decisiones', services: ['Diseño de procesos', 'Implementación de herramientas'], customerNeeds: ['visibilidad del trabajo', 'menos errores'], trustDrivers: ['alcance claro', 'acompañamiento'], conversionActions: ['Solicitar diagnóstico', 'Consultar alcance'] },
  { audience: 'Personas que compran alimentos frescos en su barrio', objective: 'Facilitar compras simples y confiables', services: ['Venta directa', 'Entrega coordinada'], customerNeeds: ['horarios claros', 'calidad constante'], trustDrivers: ['origen visible', 'atención cercana'], conversionActions: ['Hacer una consulta'] },
  { audience: 'Profesionales con agendas variables', objective: 'Permitir reservas sin intercambio innecesario', services: ['Turnos online', 'Recordatorios'], customerNeeds: ['disponibilidad', 'confirmación rápida'], trustDrivers: ['trato cuidado', 'información transparente'], conversionActions: ['Reservar una consulta'] },
  { audience: 'Equipos que lanzan productos digitales', objective: 'Validar una propuesta antes de escalarla', services: ['Prototipado', 'Pruebas con usuarios'], customerNeeds: ['aprendizaje temprano', 'prioridades'], trustDrivers: ['decisiones explicadas', 'iteración medida'], conversionActions: ['Conversar sobre el producto'] },
]
const provider = engine.auditSemanticProvider({ env: {} })
assert.equal(provider.status, 'CONTRACT_ONLY')
const adapter = engine.createSemanticBrainAdapter()
await assert.rejects(() => adapter.decide({}), /SEMANTIC_PROVIDER_REQUIRED/u)
const fingerprints = new Set()
for (const fixture of fixtures) {
  const bu = engine.buildBusinessUnderstandingV2({ brief: fixture })
  const content = engine.buildContentPlanV2(bu)
  const experience = engine.buildExperiencePlanV2(bu)
  assert.equal(bu.schemaVersion, 'business-understanding-v2')
  assert.equal(content.schemaVersion, 'content-plan-v2')
  assert.equal(experience.schemaVersion, 'experience-plan-v2')
  assert.equal(engine.specificityGate(bu).pass, true)
  assert.equal(engine.experienceDifferentiation(experience).pass, true)
  fingerprints.add(experience.fingerprint)
}
assert.equal(fingerprints.size, fixtures.length)
assert.equal(engine.briefLeakageGate('Objetivo: secreto interno').pass, false)
assert.equal(engine.naturalnessGate('Texto truncado..').pass, false)
for (const badText of ['Audience: internal', 'Brief: raw input', 'projectId: hidden', 'Metadata: draft', 'Objetivo: leaked', 'Texto..', 'solicita solicitar', 'lorem ipsum', 'versionId: v1']) assert.equal(engine.briefLeakageGate(badText).pass && engine.naturalnessGate(badText).pass, false)
const faq = engine.faqQuality([{ question: '¿Cómo trabajan?', answer: 'Explicamos el alcance, los tiempos y las decisiones antes de comenzar.' }, { question: '¿Qué incluye?', answer: 'Definimos entregables y responsabilidades con claridad desde el inicio.' }, { question: '¿Cuánto demora?', answer: 'El calendario se acuerda según el alcance y se revisa en cada etapa.' }, { question: '¿Cómo seguimos?', answer: 'Acompañamos la implementación y dejamos próximos pasos documentados.' }], engine.buildBusinessUnderstandingV2({ brief: fixtures[0] }))
assert.equal(faq.pass, true)
const feedback = engine.buildHumanFeedback({ approval: { state: 'rejected', decision: 'rejected', reason: 'Mejorar alcance y claridad.', findings: [], actor: { type: 'human', identity: 'fixture-reviewer' }, correctionId: 'correction-fixture', returnTarget: 'execution', projectId: 'fixture', versionId: 'version-v0001', previewRequestId: 'preview-fixture', snapshotSha256: 'snapshot-fixture' }, preview: { versionSnapshot: { artifactSha256: 'artifact-fixture' } } })
const plan = engine.createCorrectionPlan({ feedback, businessUnderstanding: engine.buildBusinessUnderstandingV2({ brief: fixtures[0] }) })
assert.equal(plan.schemaVersion, 'correction-plan-v1')
assert.equal(feedback.artifactSha256, 'artifact-fixture')
assert.equal(feedback.provenance.source, 'human_gate')
console.log(`PASS jefe-semantic-intelligence-smoke: provider=${provider.status}, fixtures=${fixtures.length}, correction-plan=contract-only`)
