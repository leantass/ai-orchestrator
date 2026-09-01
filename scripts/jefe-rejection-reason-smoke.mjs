import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('../electron/jefe-preview-approval.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-rejection-reason-'))
const reason = 'La ejecución visual y responsive está bien, pero la versión se rechaza por problemas de contenido, FAQ, especificidad del dominio y diferenciación de experiencia.'
const longReason = `${reason} ${'Necesitamos revisar el alcance y documentar cada ajuste. '.repeat(10)}`
try {
  const created = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'rejection-reason', runId: 'run-rejection', versionId: 'version-rejection', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Rejection Reason', brandSpec: { name: 'Rejection Reason' } }); assert.equal(created.ok, true)
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(created.artifacts.manifestPath); const service = createPreviewApprovalService({ root, reviewerIdentity: 'smoke-human' }); const input = { projectId: 'rejection-reason', runId: 'run-rejection', versionId: 'version-rejection', resourceId: 'app-index' }; const preview = await service.request(input)
  await assert.rejects(() => service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'rejected', reason: '   ' }), (error) => error.code === 'INVALID_TEXT')
  await assert.rejects(() => service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'rejected', reason: 42 }), (error) => error.code === 'INVALID_TEXT')
  const review = await service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'rejected', reason }); assert.equal(review.reason, reason); assert.equal(review.decision, 'rejected'); assert.equal(review.versionSnapshotSha256.length, 64)
  const second = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'rejection-reason-long', runId: 'run-rejection-long', versionId: 'version-rejection-long', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Rejection Reason Long', brandSpec: { name: 'Rejection Reason Long' } }); await persistence.registerManifest(second.artifacts.manifestPath); const secondPreview = await service.request({ projectId: 'rejection-reason-long', runId: 'run-rejection-long', versionId: 'version-rejection-long', resourceId: 'app-index' }); const longReview = await service.review({ projectId: 'rejection-reason-long', previewRequestId: secondPreview.previewRequestId, decision: 'rejected', reason: longReason }); assert.equal(longReview.reason, longReason.trim().replace(/\s+/gu, ' ')); const approved = await service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: review.reviewId, decision: 'rejected', expectedRevision: 0 }); assert.equal(approved.state, 'rejected'); assert.equal(approved.reason, reason); assert.equal(approved.revision, 1); console.log(JSON.stringify({ ok: true, accepted: true, longAccepted: true, persistedExactly: true, cas: 'PASS', reviewId: review.reviewId }))
} finally { await fs.rm(root, { recursive: true, force: true }) }
