import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createProjectPersistence } from '../electron/jefe-project-persistence.cjs'
import { createProjectLifecycle } from '../electron/jefe-project-lifecycle.cjs'
import { createPreviewApprovalService } from '../electron/jefe-preview-approval.cjs'
import { createReleaseOrchestrator } from '../electron/jefe-release-orchestrator.cjs'
import { createCommercialE2EOrchestrator } from '../electron/jefe-e2e-orchestrator.cjs'
import { createCommercialControlCenter } from '../electron/jefe-commercial-control-center.cjs'

const root = path.resolve('.codex-temp', 'e2e-acceptance-11c')
await fs.rm(root, { recursive: true, force: true })
const persistence = createProjectPersistence({ root })
const lifecycle = createProjectLifecycle({ root, persistence })
const preview = createPreviewApprovalService({ root })
const release = createReleaseOrchestrator({ root: path.join(root, '.jefe-release') })
const e2e = createCommercialE2EOrchestrator({ root, persistence, lifecycle, preview, releaseOrchestrator: release })
const input = { projectId: 'project-11c', runId: 'run-v0001', versionId: 'version-v0001', projectName: 'Acceptance 11C', brief: 'A clear local acceptance flow', objective: 'A clear local acceptance flow', problem: 'The current flow needs a correction path', audience: 'Operators', businessType: 'service', proposition: 'A truthful durable flow', primaryCta: 'Review', tone: 'direct', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', brandSpec: { name: 'Acceptance 11C' }, inputAssets: { files: [], urlReferences: [] } }

const initial = await e2e.createInitialProject(input)
assert.equal(initial.ok, true)
assert.equal(initial.flow.stages.qa.status, 'completed')
const firstPreview = initial.flow.refs.previewRequestId
const firstReview = await preview.review({ projectId: input.projectId, previewRequestId: firstPreview, decision: 'rejected', reason: 'The first version needs a clearer hierarchy.' })
const firstApproval = await preview.approval({ projectId: input.projectId, previewRequestId: firstPreview, reviewId: firstReview.reviewId, decision: 'rejected', reason: firstReview.reason })
await lifecycle.approval(input.projectId, input.versionId, false, firstApproval.reason)
await e2e.syncHumanDecision({ projectId: input.projectId, previewRequestId: firstPreview, decision: 'rejected', reviewId: firstReview.reviewId, approvalId: firstApproval.approvalId })

const correction = await e2e.requestCorrection({ projectId: input.projectId, sourceVersionId: input.versionId, previewRequestId: firstPreview, changeRequest: 'Improve the hierarchy and make the primary action clearer.' })
assert.equal(correction.ok, true)
assert.equal(correction.flow.flowKind, 'rejected_correction')
assert.equal(correction.flow.stages.qa.status, 'completed')
assert.equal(correction.flow.stages.preview.status, 'completed')
const version2 = correction.flow.identity.versionId
const secondPreview = correction.flow.refs.previewRequestId
const secondReview = await preview.review({ projectId: input.projectId, previewRequestId: secondPreview, decision: 'approved', reason: 'The corrected version is ready.' })
const secondApproval = await preview.approval({ projectId: input.projectId, previewRequestId: secondPreview, reviewId: secondReview.reviewId, decision: 'approved', reason: secondReview.reason })
await lifecycle.approval(input.projectId, version2, true, secondApproval.reason)
const approved = await e2e.syncHumanDecision({ projectId: input.projectId, previewRequestId: secondPreview, decision: 'approved', reviewId: secondReview.reviewId, approvalId: secondApproval.approvalId })
assert.equal(approved.stages.human_gate.status, 'completed')

const delivery = await lifecycle.prepareDelivery(input.projectId, version2)
await e2e.syncDelivery({ projectId: input.projectId, versionId: version2, deliveryId: delivery.delivery.deliveryId })
const linked = await e2e.createLinkedReleaseRequest({ projectId: input.projectId, versionId: version2, repository: { repoIdentity: 'ai-orchestrator-test', expectedBranch: 'feature-acceptance', expectedHeadSha: '0123456789abcdef0123456789abcdef01234567', remoteUrl: 'https://github.com/leantass/ai-orchestrator.git' } })
assert.equal(linked.request.identity.versionId, version2)
assert.equal(linked.request.delivery.deliveryId, delivery.delivery.deliveryId)
assert.equal(linked.releaseFlow.state, 'waiting_authorization')
assert.equal(linked.flow.stages.release.status, 'blocked')
assert.equal(linked.flow.stages.observability.status, 'completed')
const health = await e2e.health(input.projectId)
const child = health.flows.find((flow) => flow.flowKind === 'rejected_correction')
assert.equal(child.refs.releaseRequestId, linked.request.requestId)
assert.equal(child.identity.versionId, version2)
const controlCenter = createCommercialControlCenter({ persistence, lifecycle, e2e }); const projectReadModel = await controlCenter.project(input.projectId); assert.equal(projectReadModel.release.state, 'blocked'); assert.equal(projectReadModel.release.releaseRequestId, linked.request.requestId)
console.log('PASS jefe-e2e-acceptance-11c-smoke: v1 rejection, correction child, v2 re-QA, preview approval, local delivery, linked release request, remote authorization block and control-center health')
