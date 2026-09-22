import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('../electron/jefe-preview-approval.cjs')
const { buildHumanFeedback } = require('../electron/jefe-human-feedback.cjs')

const structured = { id: 'specificity', title: 'Especificidad', detail: 'Los servicios necesitan razones concretas.', severity: 'warning' }
const baseApproval = { state: 'rejected', decision: 'rejected', reason: 'Corregir la propuesta.', findings: [], questions: [], actor: { identity: 'human-reviewer', type: 'human' }, authenticationStatus: 'not_connected', projectId: 'feedback-project', versionId: 'version-feedback', previewRequestId: 'preview-feedback', snapshotSha256: 'snapshot-feedback' }
assert.deepEqual(buildHumanFeedback({ approval: baseApproval }).findings, [])
assert.deepEqual(buildHumanFeedback({ approval: { ...baseApproval, findings: [structured] } }).findings, [structured])
assert.deepEqual(buildHumanFeedback({ approval: { ...baseApproval, findings: ['texto histórico'] } }).findings, [{ id: null, title: null, detail: 'texto histórico', severity: null }])
assert.throws(() => buildHumanFeedback({ approval: { ...baseApproval, findings: [null] } }), /Each finding must be structured/u)
assert.throws(() => buildHumanFeedback({ approval: { ...baseApproval, findings: Array.from({ length: 21 }, () => structured) } }), /findings must be an array/u)
assert.throws(() => buildHumanFeedback({ approval: { ...baseApproval, reason: null } }), /rejectionReason/u)

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-human-findings-'))
try {
  const first = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'human-findings-smoke', runId: 'run-findings-one', versionId: 'version-findings-one', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Findings', brandSpec: { name: 'Findings' } })
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(first.artifacts.manifestPath)
  const service = createPreviewApprovalService({ root, reviewerIdentity: 'smoke-human' })
  const input = { projectId: 'human-findings-smoke', runId: 'run-findings-one', versionId: 'version-findings-one', resourceId: 'app-index' }
  const preview = await service.request(input)
  const rejectedReview = await service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'rejected', reason: 'Corregir la propuesta.', findings: [structured], questions: ['¿Qué debe aclararse?'] })
  assert.deepEqual(rejectedReview.findings, [structured])
  const rejected = await service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: rejectedReview.reviewId, decision: 'rejected' })
  assert.deepEqual(rejected.findings, [structured])
  const loaded = await service.findRejectedApproval(input.projectId, input.versionId)
  assert.deepEqual(loaded.findings, [structured])
  assert.deepEqual(buildHumanFeedback({ approval: loaded, preview }).findings, [structured])

  const legacyPath = path.join(root, '.jefe-preview-approval', input.projectId, 'approvals', `approval-${preview.previewRequestId}.json`)
  const legacy = JSON.parse(await fs.readFile(legacyPath, 'utf8')); legacy.findings = ['texto histórico exacto']; await fs.writeFile(legacyPath, `${JSON.stringify(legacy, null, 2)}\n`, 'utf8')
  const legacyLoaded = await service.findRejectedApproval(input.projectId, input.versionId)
  assert.deepEqual(legacyLoaded.findings, [{ id: null, title: null, detail: 'texto histórico exacto', severity: null }])
  assert.equal(buildHumanFeedback({ approval: legacyLoaded, preview }).findings[0].detail, 'texto histórico exacto')

  await assert.rejects(() => service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'pending', findings: ['legacy no permitido'] }), { code: 'INVALID_FINDING' })
  await assert.rejects(() => service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'pending', findings: Array.from({ length: 21 }, () => structured) }), { code: 'INVALID_LIST' })
  await assert.rejects(() => service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'pending', findings: [{ ...structured, detail: 'x'.repeat(1001) }] }), { code: 'INVALID_TEXT' })
  await assert.rejects(() => service.review({ ...input, previewRequestId: preview.previewRequestId, decision: 'rejected', reason: null }), { code: 'INVALID_TEXT' })
  console.log('PASS jefe-human-findings-contract-smoke: canonical, empty, legacy, E2E, limits, invalid cases')
} finally { await fs.rm(root, { recursive: true, force: true }) }
