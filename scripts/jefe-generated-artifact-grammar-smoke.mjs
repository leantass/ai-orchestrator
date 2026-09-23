import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { compareGeneratedContent, inspectGeneratedArtifactGrammar } = require('../electron/jefe-product-planning.cjs')
const { adaptSemanticPlansToPlanning } = require('../electron/jefe-semantic-generation-adapter.cjs')
const generation = require('../electron/jefe-real-generation.cjs')
const { assertContentQuality } = require('../electron/jefe-generator-quality.cjs')
const { createSemanticRuntimeAdapter } = require('../electron/jefe-semantic-runtime-adapter.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-artifact-grammar-'))
try {
  const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'grammar-smoke', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Grammar smoke', brief: 'Servicios concretos para equipos.', businessType: 'servicio digital', audience: 'equipos', proposition: 'Una propuesta clara.', primaryCta: 'Conversar con el equipo', brandSpec: { name: 'Grammar smoke' } })
  assert.equal(source.ok, true)
  const trustFixture = ['Proceso visible por etapas con tablero compartido', 'Criterios de calidad medibles y checklist por entregable', 'Artefactos y entregables desde el día 2', 'Acompañamiento cercano y responsive (respuesta en 24 h)', 'Revisiones planificadas para evitar sorpresas', 'Avance diseñado sin dependencias externas']
  const semanticPlanning = adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: { ...source.project.planning.content.businessUnderstanding, schemaVersion: 'business-understanding-v2' }, contentPlan: { schemaVersion: 'content-plan-v2', hero: 'Software que ordena tu operación', presentation: 'Una presentación clara para decidir con confianza', services: ['Automatización de procesos con seguimiento claro'], trust: trustFixture, faq: [{ question: '¿Cómo empieza?', answer: 'Comienza con una conversación breve y objetivos concretos.' }, { question: '¿Qué incluye?', answer: 'Incluye alcance, entregables y seguimiento.' }, { question: '¿Cuánto tarda?', answer: 'El primer avance llega en pocos días.' }, { question: '¿Cómo revisamos?', answer: 'Revisamos cada etapa con criterios visibles.' }], contact: 'Agendá una conversación' }, experiencePlan: { schemaVersion: 'experience-plan-v2', sectionOrder: ['hero', 'services', 'trust', 'faq', 'contact'], ctaPositions: ['hero', 'contact'], archetype: 'guided', heroVariant: 'focused', sectionTreatments: ['semantic'], contentDensity: 'balanced', servicesTreatment: 'cards', trustTreatment: 'proof', faqTreatment: 'accordion', conversionStrategy: 'consultation' } })
  assert.deepEqual(semanticPlanning.content.trust, trustFixture.map((value) => `${value}.`))
  assert.deepEqual(semanticPlanning.content.trustItems.map((item) => item.description), semanticPlanning.content.trust)
  assert.equal(semanticPlanning.content.services[0].title, 'Automatización de procesos con seguimiento claro')
  assert.equal(semanticPlanning.content.services[0].description, 'Automatización de procesos con seguimiento claro.')
  assert.equal(semanticPlanning.content.title, 'Software que ordena tu operación')
  assert.equal(semanticPlanning.content.ctas[0], 'Agendá una conversación')
  assert.deepEqual(inspectGeneratedArtifactGrammar(semanticPlanning), [])
  const replaySpec = { schemaVersion: 'semantic-generation-spec-v1', planning: semanticPlanning, sectionOrder: semanticPlanning.experience.sections, heroVariant: 'focused', treatments: ['semantic-correction'], contentDensity: 'balanced', ctaStrategy: 'consultation', preservedQualities: [], prohibitedChanges: [] }
  await generation.materializeProject({ project: { ...source.project, activeVersionId: 'version-replay', planning: semanticPlanning, physicalPaths: { projectRoot: path.join(root, 'grammar-smoke', 'version-replay'), manifestPath: path.join(root, 'grammar-smoke', 'version-replay', 'manifest.json'), deliveryPath: null } }, destinationRoot: root, capabilities: {}, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: replaySpec }, providedAssets: [] })
  const replayHtml = await fs.readFile(path.join(root, 'grammar-smoke', 'version-replay', 'app', 'index.html'), 'utf8')
  assert.deepEqual(inspectGeneratedArtifactGrammar(semanticPlanning), [])
  assert.equal(compareGeneratedContent(semanticPlanning, replayHtml).pass, true)
  assert.equal(assertContentQuality(semanticPlanning).overallContentStatus, 'PASS')
  const valid = structuredClone(source.project.planning)
  valid.content.title = 'Título sin punto'
  valid.content.ctas = ['Conversar ahora']
  valid.content.subtitle = 'Una descripción completa.'
  valid.content.trust = ['Confianza concreta para avanzar con claridad.']
  valid.content.faq = [{ question: '¿Cómo empieza el servicio?', answer: 'Comienza con una conversación breve y un alcance claro.' }]
  assert.deepEqual(inspectGeneratedArtifactGrammar(valid), [])

  const invalid = structuredClone(valid)
  invalid.content.subtitle = 'Descripción truncada'
  invalid.content.ctas = ['[placeholder]']
  invalid.content.faq[0].answer = ''
  const findings = inspectGeneratedArtifactGrammar(invalid)
  assert.ok(findings.some((item) => item.slot === 'subtitle' && !item.terminalPunctuationValid))
  assert.ok(findings.some((item) => item.slot === 'cta.label'))
  assert.ok(findings.some((item) => item.slot === 'faq[0].answer'))
  invalid.content.title = '123 inválido.'
  assert.ok(inspectGeneratedArtifactGrammar(invalid).some((item) => item.slot === 'title' && !item.startsValid))

  const adapter = createSemanticRuntimeAdapter({ root, timeoutMs: 1000, service: { registerAttempt: async () => ({ attemptId: 'never' }), promoteSemanticCorrectionAttempt: async () => ({ versionId: 'never' }) }, resolveExecution: async () => { throw Object.assign(new Error('grammar'), { code: 'GENERATED_ARTIFACT_GRAMMAR', details: { grammarFindingCount: findings.length, grammarFindings: findings } }) } })
  const result = await adapter.requestSemanticCorrection({ projectId: 'grammar-journal', sourceVersionId: 'version-v0001' })
  const journal = JSON.parse(await fs.readFile(path.join(root, '.jefe-semantic-runs', 'grammar-journal', `${result.runId}.json`), 'utf8'))
  assert.equal(journal.candidateGenerationErrorCode, 'GENERATED_ARTIFACT_GRAMMAR')
  assert.equal(journal.grammarFindingCount, findings.length)
  assert.equal(journal.grammarFindings[0].valuePreview.length <= 160, true)
  assert.equal(JSON.stringify(journal).includes('<html'), false)
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-generated-artifact-grammar', positiveCases: 5, negativeCases: 4, grammarFindingCount: journal.grammarFindingCount, ProviderCalls: 0 }))
} finally { await fs.rm(root, { recursive: true, force: true }) }
