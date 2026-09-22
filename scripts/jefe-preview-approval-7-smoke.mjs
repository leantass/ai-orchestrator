import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('../electron/jefe-preview-approval.cjs')
const { registerPreviewApprovalIpc, CHANNELS } = require('../electron/jefe-preview-approval.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-escalon-7-'))
const otherRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-escalon-7-b-'))
let cases = 0
const check = (value, message) => { assert.equal(value, true, message); cases += 1 }
try {
  const first = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'preview-seven', runId: 'run-seven', versionId: 'version-seven', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview 7', brandSpec: { name: 'Preview 7' } })
  check(first.ok === true, '7A-02 debe crear una versión física')
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(first.artifacts.manifestPath)
  const service = createPreviewApprovalService({ root, reviewerIdentity: 'smoke-human' })
  const input = { projectId: 'preview-seven', runId: 'run-seven', versionId: 'version-seven', resourceId: 'app-index' }
  const preview = await service.request(input)
  check((await service.readApproval(input.projectId, preview.previewRequestId)).state === 'pending_review', '7C-01 approval durable inicial queda pending_review')
  check(preview.state === 'preview_ready' && preview.resource.relativePath === 'app/index.html', '7A-01/05 preview ready y recurso allowlisted')
  check(preview.versionSnapshot.snapshotSha256.length === 64 && preview.source.rootKey.includes('preview-seven'), '7A-02 snapshot y correlación física')
  check((await service.request(input)).previewRequestId === preview.previewRequestId, '7A-02 replay idempotente')
  await assert.rejects(() => service.request({ ...input, resourceId: 'manifest-json' }), { code: 'PREVIEW_RESOURCE_REJECTED' }); cases += 1
  await assert.rejects(() => service.request({ ...input, projectId: 'missing-seven' }), { code: 'VERSION_NOT_FOUND' }); cases += 1
  const viewed = await service.review({ projectId: input.projectId, previewRequestId: preview.previewRequestId, decision: 'viewed' })
  check((await service.readApproval(input.projectId, preview.previewRequestId)).state === 'reviewed', '7C-01 visto transiciona durablemente a reviewed, no approved')
  check(viewed.authority === 'human_decision' && viewed.actorType === 'human' && viewed.decision === 'viewed', '7B-01/03 visto no equivale a aprobación')
  await assert.rejects(() => service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: viewed.reviewId, decision: 'approved' }), { code: 'INVALID_APPROVAL_DECISION' }); cases += 1
  const structuredReview = await service.review({ projectId: input.projectId, previewRequestId: preview.previewRequestId, decision: 'pending', reviewType: 'visual', findings: [{ id: 'visual-1', title: '  Hallazgo   visual  ', detail: '  Detalle   controlado  ', severity: 'warning' }], questions: ['pregunta de smoke'] })
  check(structuredReview.reviewType === 'visual' && structuredReview.findings[0].title === 'Hallazgo visual' && structuredReview.findings[0].detail === 'Detalle controlado' && structuredReview.questions.length === 1, '7B-04 reviewType/findings/questions persistidos y normalizados')
  await assert.rejects(() => service.review({ projectId: input.projectId, previewRequestId: preview.previewRequestId, decision: 'pending', reviewType: 'technical' }), { code: 'INVALID_REVIEW_TYPE' }); cases += 1
  const approvedReview = await service.review({ projectId: input.projectId, previewRequestId: preview.previewRequestId, decision: 'approved', reason: 'Revisión explícita de smoke.' })
  const approval = await service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: approvedReview.reviewId, decision: 'approved' })
  check(approval.state === 'approved' && approval.authenticationStatus === 'not_connected', '7B/7C aprobación explícita con límite honesto')
  check((await service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: approvedReview.reviewId, decision: 'approved' })).approvalId === approval.approvalId, '7C-01 idempotencia')
  const incompatibleReview = await service.review({ projectId: input.projectId, previewRequestId: preview.previewRequestId, decision: 'rejected', reason: 'Decisión incompatible controlada.' })
  await assert.rejects(() => service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: incompatibleReview.reviewId, decision: 'rejected' }), { code: 'APPROVAL_COLLISION' }); cases += 1
  await assert.rejects(() => service.approval({ projectId: input.projectId, previewRequestId: preview.previewRequestId, reviewId: approvedReview.reviewId, decision: 'approved', expectedRevision: 0 }), { code: 'STALE_COMPLETION' }); cases += 1
  const second = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'preview-seven', runId: 'run-seven-two', versionId: 'version-seven-two', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview 7', brandSpec: { name: 'Preview 7' } }); await persistence.registerManifest(second.artifacts.manifestPath)
  const rejectedInput = { projectId: input.projectId, runId: 'run-seven-two', versionId: 'version-seven-two', resourceId: 'app-index' }
  const rejectedPreview = await service.request(rejectedInput)
  const rejectedReview = await service.review({ projectId: input.projectId, previewRequestId: rejectedPreview.previewRequestId, decision: 'rejected', reason: 'Rechazo controlado.' })
  const rejected = await service.approval({ projectId: input.projectId, previewRequestId: rejectedPreview.previewRequestId, reviewId: rejectedReview.reviewId, decision: 'rejected' })
  const third = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'preview-seven', runId: 'run-seven-three', versionId: 'version-seven-three', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview 7', brandSpec: { name: 'Preview 7' } }); await persistence.registerManifest(third.artifacts.manifestPath); const thirdPreview = await service.request({ projectId: input.projectId, runId: 'run-seven-three', versionId: 'version-seven-three', resourceId: 'app-index' }); check((await service.readApproval(input.projectId, preview.previewRequestId)).state === 'superseded' && (await service.readApproval(input.projectId, rejectedPreview.previewRequestId)).state === 'superseded', '7C-02 version nueva supersede ciclos anteriores')
  const thirdReview = await service.review({ projectId: input.projectId, previewRequestId: thirdPreview.previewRequestId, decision: 'approved' }); const concurrent = await Promise.allSettled([service.approval({ projectId: input.projectId, previewRequestId: thirdPreview.previewRequestId, reviewId: thirdReview.reviewId, decision: 'approved', expectedRevision: 0 }), service.approval({ projectId: input.projectId, previewRequestId: thirdPreview.previewRequestId, reviewId: thirdReview.reviewId, decision: 'approved', expectedRevision: 0 })]); check(concurrent.filter((item) => item.status === 'fulfilled').length === 1 && concurrent.filter((item) => item.status === 'rejected' && item.reason.code === 'STALE_COMPLETION').length === 1, '7C-01 CAS concurrent double completion controlada')
  const corruptApprovalPath = path.join(root, '.jefe-preview-approval', input.projectId, 'approvals', 'corrupt.json'); await fs.writeFile(corruptApprovalPath, '{not-json', 'utf8'); const recoveryWithCorruption = await service.recover(input.projectId); check(recoveryWithCorruption.corrupted.includes('approvals/corrupt.json') && recoveryWithCorruption.previews.length > 0, '7D-01 recovery detecta corrupcion sin mutar fuentes')
  check(rejected.state === 'rejected' && rejected.correctionId && rejected.returnTarget === 'execution', '7D-02 rechazo conserva correction loop')
  const handlers = new Map(); const ipcMain = { handle: (channel, handler) => handlers.set(channel, handler) }; const ipc = registerPreviewApprovalIpc({ ipcMain, root, reviewerIdentity: 'smoke-human' })
  check(handlers.size === Object.keys(CHANNELS).length + 1 && ipc.channels.request === CHANNELS.request, '7D-03 IPC semántico allowlisted')
  const ipcRead = await handlers.get(CHANNELS.read)(null, { projectId: input.projectId, previewRequestId: preview.previewRequestId }); check(ipcRead.ok === true && ipcRead.preview.versionId === input.versionId, '7D-03 IPC readback sin mutación')
  const ipcRejected = await handlers.get(CHANNELS.request)(null, { ...input, path: 'C:\\Windows' }); check(ipcRejected.ok === false && ipcRejected.error.code === 'INVALID_PAYLOAD', '7D-03 renderer no puede enviar paths')
  const ipcRemoteRejected = await handlers.get(CHANNELS.request)(null, { ...input, url: 'https://example.com' }); check(ipcRemoteRejected.ok === false && ipcRemoteRejected.error.code === 'INVALID_PAYLOAD', '7A-04 renderer no puede enviar URL remota')
  check(preview.policy.network === 'disabled' && preview.policy.remoteFrames === 'forbidden' && preview.policy.externalScripts === 'forbidden', '7A-04 politica de contenido remoto persistida')
  const artifact = path.join(root, 'preview-seven', 'version-seven', 'app', 'index.html'); await fs.appendFile(artifact, '\n<!-- stale -->\n')
  await assert.rejects(() => service.readPreview(input.projectId, preview.previewRequestId), { code: 'PREVIEW_STALE' }); cases += 1
  const recovery = await service.recover(input.projectId); check(Array.isArray(recovery.previews) && recovery.corrupted.length === 1, '7D-01 recovery read-only')
  const other = await createFirstVersionFromRun({ destinationRoot: otherRoot, allowedRoots: [otherRoot], projectId: 'preview-other', runId: 'run-other', versionId: 'version-other', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Otro', brandSpec: { name: 'Otro' } }); check(other.ok === true, '7C-02 proyecto B aislado')
  await assert.rejects(() => service.readPreview('preview-other', preview.previewRequestId), { code: 'PREVIEW_NOT_FOUND' }); cases += 1
  const expired = await service.transition({ projectId: input.projectId, previewRequestId: thirdPreview.previewRequestId, nextState: 'expired', reason: 'Expiración controlada.', expectedRevision: 1 }); check(expired.state === 'expired' && expired.terminalReason === 'Expiración controlada.', '7C-01 transición approved a expired con CAS')
  const fourth = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'preview-seven', runId: 'run-seven-four', versionId: 'version-seven-four', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview 7', brandSpec: { name: 'Preview 7' } }); await persistence.registerManifest(fourth.artifacts.manifestPath); const fourthPreview = await service.request({ projectId: input.projectId, runId: 'run-seven-four', versionId: 'version-seven-four', resourceId: 'app-index' }); await service.review({ projectId: input.projectId, previewRequestId: fourthPreview.previewRequestId, decision: 'viewed' }); const blocked = await service.transition({ projectId: input.projectId, previewRequestId: fourthPreview.previewRequestId, nextState: 'blocked', reason: 'Bloqueo controlado.' }); check(blocked.state === 'blocked' && blocked.terminalReason === 'Bloqueo controlado.', '7C-01 transición reviewed a blocked')
  await assert.rejects(() => service.transition({ projectId: input.projectId, previewRequestId: fourthPreview.previewRequestId, nextState: 'approved' }), { code: 'INVALID_APPROVAL_STATE' }); cases += 1
  console.log(`PASS jefe-preview-approval-7-smoke: ${cases} casos`)
} finally { await fs.rm(root, { recursive: true, force: true }); await fs.rm(otherRoot, { recursive: true, force: true }) }
