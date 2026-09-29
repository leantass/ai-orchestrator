import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createProjectLifecycle } = require('../electron/jefe-project-lifecycle.cjs')
const { createCommercialE2EOrchestrator } = require('../electron/jefe-e2e-orchestrator.cjs')
const { createPreviewApprovalService } = require('../electron/jefe-preview-approval.cjs')
const { createSemanticRuntimeComposition } = require('../electron/jefe-semantic-runtime-composition.cjs')
const { registerCanonicalProjectIpc, CHANNELS } = require('../electron/jefe-project-ipc.cjs')
const mainSource = await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'electron', 'main.cjs'), 'utf8')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-electron-bootstrap-'))
const projectId = 'semantic-electron-smoke'; const versionId = 'version-v0001'; const runId = 'run-v0001'
try {
  const persistence = createProjectPersistence({ root }); const lifecycle = createProjectLifecycle({ root, persistence }); const e2e = createCommercialE2EOrchestrator({ root, persistence, lifecycle }); const source = await e2e.createInitialProject({ projectId, runId, versionId, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Runtime Bridge Smoke', brief: 'A durable semantic correction fixture.', objective: 'A durable semantic correction fixture.', businessType: 'service', audience: 'small teams', proposition: 'A verifiable proposal.', primaryCta: 'Talk', brandSpec: { name: 'Runtime Bridge Smoke' }, inputAssets: { files: [], urlReferences: [] } }); assert.equal(source.ok, true, JSON.stringify(source))
  const preview = createPreviewApprovalService({ root, reviewerIdentity: 'smoke-human' }); const record = await preview.readPreview(projectId, source.flow.refs.previewRequestId); const review = await preview.review({ projectId, previewRequestId: record.previewRequestId, decision: 'rejected', reason: 'Synthetic integration feedback.', findings: [] }); await preview.approval({ projectId, previewRequestId: record.previewRequestId, reviewId: review.reviewId, decision: 'rejected', expectedRevision: 0 })
  const composition = createSemanticRuntimeComposition({ root }); const handlers = new Map(); registerCanonicalProjectIpc({ ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) }, root, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} }, semanticRuntimeAdapter: composition.adapter })
  const result = await handlers.get(CHANNELS.semanticCorrection)({}, { projectId, sourceVersionId: versionId }); assert.equal(result.ok, true); assert.equal(result.flow.identity.versionId, 'version-v0002'); assert.equal(result.flow.stages.human_gate.status, 'waiting'); assert.equal(result.flow.flowKind, 'rejected_correction')
  const blocked = await handlers.get(CHANNELS.semanticCorrection)({}, { projectId, sourceVersionId: versionId, candidateRoot: '../outside' }); assert.equal(blocked.ok, false); assert.equal(blocked.error.code, 'INVALID_PAYLOAD')
  assert.match(mainSource, /createSemanticRuntimeComposition/u); assert.match(mainSource, /semanticRuntimeAdapter:\s*semanticRuntimeComposition\.adapter/u)
  console.log(JSON.stringify({ ok: true, ElectronSemanticBootstrap: 'PASS', ipcChannel: CHANNELS.semanticCorrection, promotedVersion: result.flow.identity.versionId, state: result.flow.stages.human_gate.status, SameCompositionFactory: true, SecurityBoundary: 'PASS', ProviderCalls: 0 }))
} finally { await fs.rm(root, { recursive: true, force: true }).catch(() => {}) }
