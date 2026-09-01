import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { materializeProject } = require('../electron/jefe-real-generation.cjs')
const { adaptSemanticGenerationSpec } = require('../electron/jefe-semantic-generation-adapter.cjs')
const { buildSemanticGenerationSpec, buildExecutionPackage } = require('../electron/jefe-semantic-correction-lifecycle.cjs')
const { evaluateCandidate } = require('../electron/jefe-semantic-quality-promotion.cjs')
const { experienceQuality, createSemanticProductionPromotion } = require('../electron/jefe-semantic-production-promotion.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-production-'))
try {
  const sourceResult = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'bike-production', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Rueda Clara', brief: 'Taller ficticio de reparación y mantenimiento de bicicletas con reserva previa.', businessType: 'servicio de reparación', audience: 'personas que usan bicicletas', proposition: 'Turnos claros para mantener tu bicicleta en movimiento.', brandSpec: { name: 'Rueda Clara' } })
  assert.equal(sourceResult.ok, true)
  const service = createSemanticProductionPromotion({ root })
  await assert.rejects(() => service.promoteSemanticCorrectionAttempt({ executionPackageId: 'semantic-execution-missing', attemptId: 'attempt-missing' }))
  await service.persistence.registerManifest(sourceResult.artifacts.manifestPath)
  const sourcePreview = await service.preview.request({ projectId: 'bike-production', runId: 'run-v0001', versionId: 'version-v0001', resourceId: 'app-index' })
  const sourceReview = await service.preview.review({ projectId: 'bike-production', previewRequestId: sourcePreview.previewRequestId, decision: 'rejected', reason: 'La experiencia necesita un recorrido de reserva más claro.' })
  const sourceApproval = await service.preview.approval({ projectId: 'bike-production', previewRequestId: sourcePreview.previewRequestId, reviewId: sourceReview.reviewId, decision: 'rejected', reason: sourceReview.reason, expectedRevision: 0 })
  assert.equal(sourceApproval.state, 'rejected')
  const semanticPlanning = structuredClone(sourceResult.project.planning); semanticPlanning.experience.sections = ['inicio', 'servicios', 'relato', 'confianza', 'faq', 'contacto']
  const spec = { schemaVersion: 'semantic-generation-spec-v1', planning: semanticPlanning, sectionOrder: ['servicios', 'relato', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', treatments: ['appointment_led', 'specific_services'], servicesTreatment: 'specific_services', trustTreatment: 'method_and_scope', faqTreatment: 'service_timing_scope', ctaPositions: ['hero', 'contacto'], contentDensity: 'balanced', conversionStrategy: 'appointment', preservedQualities: ['responsive', 'local-form'], prohibitedChanges: ['no-source-mutation'] }
  adaptSemanticGenerationSpec(spec)
  const candidateDestination = path.join(root, '.candidate-work'); const candidateRoot = path.join(candidateDestination, 'bike-production', 'version-v0002')
  const candidateProject = require('../electron/jefe-project-contract.cjs').normalizeProjectContract({ ...sourceResult.project, planning: semanticPlanning, activeVersionId: 'version-v0002', runId: 'run-v0002', physicalPaths: { projectRoot: candidateRoot, manifestPath: path.join(candidateRoot, 'manifest.json'), deliveryPath: null }, versions: [{ ...sourceResult.project.versions[0], versionId: 'version-v0002', runId: 'run-v0002' }] }, { allowedRoots: [root] })
  await materializeProject({ project: candidateProject, destinationRoot: candidateDestination, capabilities: {}, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: spec, brief: 'Taller ficticio de reparación y mantenimiento de bicicletas con reserva previa.', businessType: 'servicio de reparación', audience: 'personas que usan bicicletas', proposition: 'Turnos claros para mantener tu bicicleta en movimiento.' } })
  const browser = await service.browserQA(candidateRoot, spec.sectionOrder)
  const html = await fs.readFile(path.join(candidateRoot, 'app', 'index.html'), 'utf8')
  const experience = experienceQuality({ html, spec })
  const quality = await evaluateCandidate({ candidateRoot, planning: candidateProject.planning, spec, browserQuality: browser, experienceQuality: experience })
  quality.overallStatus = quality.overallStatus === 'PASS' && experience.status === 'PASS' && browser.status === 'PASS' ? 'PASS' : 'NEEDS_CORRECTION'
  quality.eligibleForPromotion = quality.overallStatus === 'PASS'
  const packageValue = buildExecutionPackage({ correctionPlan: { schemaVersion: 'correction-plan-v2', id: 'correction-bike-1' }, businessUnderstanding: { schemaVersion: 'business-understanding-v2', domain: 'bike-service' }, contentPlan: { schemaVersion: 'content-plan-v2', ...semanticPlanning.content }, experiencePlan: { schemaVersion: 'experience-plan-v2', ...semanticPlanning.experience }, semanticGates: 'PASS', generationSpec: spec, humanFeedbackRef: 'feedback-synthetic-bike-1', sourceProjectId: 'bike-production', sourceVersionId: 'version-v0001', sourceSnapshotSha256: sourcePreview.versionSnapshot.snapshotSha256, correctionId: 'correction-bike-1' })
  const registered = await service.registerAttempt({ executionPackage: packageValue, sourceManifestPath: sourceResult.artifacts.manifestPath, candidateRoot, qualityReport: quality })
  const promoted = await service.promoteSemanticCorrectionAttempt({ executionPackageId: packageValue.executionPackageId, attemptId: registered.attemptId })
  assert.equal(promoted.state, 'pending_review'); assert.equal(promoted.versionId, 'version-v0002')
  const replay = await service.promoteSemanticCorrectionAttempt({ executionPackageId: packageValue.executionPackageId, attemptId: registered.attemptId }); assert.equal(replay.idempotent, true)
  const newPreview = await service.preview.readApproval('bike-production', promoted.previewRequestId); assert.equal(newPreview.state, 'pending_review'); assert.equal((await service.persistence.listVersions('bike-production')).length, 2)
  assert.equal(sourceApproval.decision, 'rejected'); assert.equal(sourceApproval.reason, sourceReview.reason)
  const badCandidate = path.join(root, '.candidates', 'bike-production', 'attempt-b'); await fs.cp(candidateRoot, badCandidate, { recursive: true }); await fs.appendFile(path.join(badCandidate, 'app', 'app.js'), '\n// mutation\n'); await assert.rejects(() => service.registerAttempt({ executionPackage: packageValue, sourceManifestPath: sourceResult.artifacts.manifestPath, candidateRoot: badCandidate, qualityReport: quality }), { code: 'QUALITY_HASH_MISMATCH' })
  console.log(`PASS jefe-semantic-production-promotion-smoke: candidate → quality → browser → canonical ProjectVersion ${promoted.versionId} → pending_review; source immutable; idempotent; hash/security negatives`)
} finally { await fs.rm(root, { recursive: true, force: true }) }
