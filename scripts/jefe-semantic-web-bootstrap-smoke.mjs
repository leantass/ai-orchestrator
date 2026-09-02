import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('../electron/jefe-preview-approval.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-web-bootstrap-'))
const freePort = () => new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)) }) })
const projectId = 'semantic-web-smoke'; const sourceVersionId = 'version-v0001'; const runId = 'run-v0001'; const port = await freePort(); const base = `http://127.0.0.1:${port}`
let child
try {
  const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId, runId, versionId: sourceVersionId, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Semantic Web Smoke', brief: 'Sitio sintético para conectar el runtime semántico.', businessType: 'estudio digital', audience: 'equipos pequeños', proposition: 'Una propuesta verificable.', primaryCta: 'Conversar', brandSpec: { name: 'Semantic Web Smoke' } }); assert.equal(source.ok, true)
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(source.artifacts.manifestPath)
  const approvalService = createPreviewApprovalService({ root, reviewerIdentity: 'smoke-human' }); const preview = await approvalService.request({ projectId, runId, versionId: sourceVersionId, resourceId: 'app-index' }); const review = await approvalService.review({ projectId, previewRequestId: preview.previewRequestId, decision: 'rejected', reason: 'Feedback sintético para validar la corrección.', findings: [] }); await approvalService.approval({ projectId, previewRequestId: preview.previewRequestId, reviewId: review.reviewId, decision: 'rejected', expectedRevision: 0 })
  child = spawn(process.execPath, ['scripts/jefe-web.mjs'], { cwd: path.resolve(fileURLToPath(new URL('..', import.meta.url))), env: { ...process.env, JEFE_WEB_DATA_ROOT: root, JEFE_WEB_PORT: String(port), JEFE_WEB_NO_BROWSER: '1' }, stdio: 'ignore', windowsHide: true })
  for (let attempt = 0; attempt < 80; attempt += 1) { try { if ((await fetch(`${base}/api/health`)).ok) break } catch {} await new Promise((resolve) => setTimeout(resolve, 100)) }
  const html = await (await fetch(`${base}/`)).text(); const token = html.match(/name="jefe-session" content="([^"]+)"/u)?.[1]; assert.ok(token)
  const api = async (url, options = {}) => { const response = await fetch(`${base}${url}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } }); return { response, value: await response.json() } }
  const correction = await api(`/api/projects/${projectId}/semantic-corrections`, { method: 'POST', body: JSON.stringify({ sourceVersionId, idempotencyKey: 'semantic-web-smoke-request' }) }); assert.equal(correction.response.status, 202, JSON.stringify(correction.value)); assert.equal(correction.value.ok, true); assert.equal(correction.value.state, 'pending_review'); assert.equal(correction.value.projectId, projectId)
  const replay = await api(`/api/projects/${projectId}/semantic-corrections`, { method: 'POST', body: JSON.stringify({ sourceVersionId, idempotencyKey: 'semantic-web-smoke-request' }) }); assert.equal(replay.value.ok, true, JSON.stringify(replay.value))
  const versions = await api(`/api/projects/${projectId}/versions`); assert.equal(versions.value.versions.length, 2, JSON.stringify({ correction: correction.value, replay: replay.value, versions: versions.value })) ; assert.equal(versions.value.versions.at(-1).versionId, correction.value.versionId)
  const promoted = await api(`/api/projects/${projectId}/versions/${correction.value.versionId}`); assert.equal(promoted.value.ok, true)
  const newPreview = await approvalService.request({ projectId, runId: promoted.value.version.runId, versionId: correction.value.versionId, resourceId: 'app-index' }); assert.notEqual(newPreview.versionSnapshot.snapshotSha256, preview.versionSnapshot.snapshotSha256)
  console.log(JSON.stringify({ ok: true, WebSemanticBootstrap: 'PASS', sourceVersion: sourceVersionId, promotedVersion: correction.value.versionId, state: correction.value.state, CanonicalProjectVersion: true, QualityMandatory: true, PreviewAvailable: true, Idempotency: replay.value.versionId === correction.value.versionId, ProviderCalls: 0 }))
} finally { child?.kill(); await new Promise((resolve) => setTimeout(resolve, 200)); await fs.rm(root, { recursive: true, force: true }).catch(() => {}) }
