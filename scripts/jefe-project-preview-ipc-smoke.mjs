import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { registerCanonicalProjectIpc, CHANNELS } = require('../electron/jefe-project-ipc.cjs')
const { resolvePreview, semanticUrl } = require('../electron/jefe-project-preview.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-preview-ipc-'))
try {
  const first = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'preview-project', runId: 'preview-run', versionId: 'preview-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview', brandSpec: { name: 'Preview' } }); assert.equal(first.ok, true)
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(first.artifacts.manifestPath)
  const resolved = await resolvePreview({ persistence, projectId: 'preview-project', versionId: 'preview-version' }); assert.equal(resolved.mimeType, 'text/html; charset=utf-8'); assert.equal(resolved.url, semanticUrl('preview-project', 'preview-version'))
  await assert.rejects(() => resolvePreview({ persistence, projectId: 'preview-project', versionId: 'preview-version', resource: '../manifest.json' }), { code: 'INVALID_PREVIEW_RESOURCE' })
  await assert.rejects(() => resolvePreview({ persistence, projectId: 'preview-project', versionId: 'preview-version', resource: 'manifest.json' }), { code: 'PREVIEW_RESOURCE_UNDECLARED' })
  const handlers = new Map(); const ipcMain = { handle: (channel, handler) => { assert.equal(handlers.has(channel), false); handlers.set(channel, handler) } }; const opened = []; const copied = []
  const api = registerCanonicalProjectIpc({ ipcMain, root, shell: { openPath: async (target) => { opened.push(target); return '' } }, clipboard: { writeText: (value) => copied.push(value) } })
  assert.equal(handlers.size, Object.keys(CHANNELS).length); assert.equal(api.channels.preview, CHANNELS.preview)
  const preview = await handlers.get(CHANNELS.preview)(null, { projectId: 'preview-project', versionId: 'preview-version' }); assert.equal(preview.ok, true); assert.match(preview.preview.url, /^jefe-preview:\/\//u); assert.equal(preview.preview.mode, 'external_only')
  const arbitrary = await handlers.get(CHANNELS.preview)(null, { projectId: 'preview-project', versionId: 'preview-version', path: 'C:\\Windows' }); assert.equal(arbitrary.ok, false); assert.equal(arbitrary.error.code, 'INVALID_PAYLOAD')
  const open = await handlers.get(CHANNELS.open)(null, { projectId: 'preview-project', target: 'preview' }); assert.equal(open.ok, true); assert.equal(opened.length, 1); assert.equal(opened[0], resolved.filePath)
  const copy = await handlers.get(CHANNELS.copy)(null, { projectId: 'preview-project', target: 'preview' }); assert.equal(copy.ok, true); assert.equal(copied.length, 1)
  const version = await api.lifecycle.createVersion({ projectId: 'preview-project', changeRequest: 'Cambio seguro.' }); await api.lifecycle.approval('preview-project', version.versionId, true); await api.lifecycle.prepareDelivery('preview-project', version.versionId)
  const delivery = await handlers.get(CHANNELS.open)(null, { projectId: 'preview-project', versionId: version.versionId, target: 'delivery' }); assert.equal(delivery.ok, true); assert.equal(opened.length, 2)
  const outside = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'other-preview', runId: 'other-run', versionId: 'other-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Otro', brandSpec: { name: 'Otro' } }); await persistence.registerManifest(outside.artifacts.manifestPath)
  const isolation = await handlers.get(CHANNELS.preview)(null, { projectId: 'preview-project', versionId: 'other-version' }); assert.equal(isolation.ok, false); assert.equal(isolation.error.code, 'VERSION_NOT_FOUND')
  console.log('PASS jefe-project-preview-ipc-smoke')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
