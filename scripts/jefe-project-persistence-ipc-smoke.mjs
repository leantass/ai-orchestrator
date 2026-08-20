import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { registerCanonicalProjectIpc, CHANNELS } = require('../electron/jefe-project-ipc.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-persistence-ipc-'))
try {
  const request = { destinationRoot: root, allowedRoots: [root], projectId: 'persist-project', runId: 'persist-run', versionId: 'persist-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Persistencia', brandSpec: { name: 'Persistencia' } }
  const created = await createFirstVersionFromRun(request)
  assert.equal(created.ok, true, JSON.stringify(created.error))
  const persistence = createProjectPersistence({ root })
  await persistence.registerManifest(created.artifacts.manifestPath)
  assert.equal((await persistence.listProjects()).length, 1)
  assert.equal((await persistence.listVersions('persist-project')).length, 1)
  assert.equal((await persistence.workspaceSnapshot('persist-project')).previewAvailable, true)
  await fs.promises.writeFile(path.join(root, '.jefe-project-index.json'), '{bad', 'utf8')
  assert.equal((await persistence.listProjects()).length, 1, 'índice corrupto reconstruible')
  const handlers = new Map(); const ipcMain = { handle: (name, handler) => { if (handlers.has(name)) throw new Error('duplicate'); handlers.set(name, handler) } }
  const opened = []; const copied = []
  registerCanonicalProjectIpc({ ipcMain, root, shell: { openPath: async (target) => { opened.push(target); return '' } }, clipboard: { writeText: (target) => copied.push(target) } })
  registerCanonicalProjectIpc({ ipcMain, root, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  assert.equal(handlers.size, Object.keys(CHANNELS).length)
  assert.equal((await handlers.get(CHANNELS.open)(null, { projectId: 'persist-project', target: 'preview' })).ok, true)
  assert.equal(opened.length, 1)
  assert.equal((await handlers.get(CHANNELS.copy)(null, { projectId: 'persist-project', target: 'preview' })).ok, true)
  assert.equal(copied.length, 1)
  const badPayload = await handlers.get(CHANNELS.create)(null, { projectId: 'x', versionId: 'y', path: 'C:\\Windows' })
  assert.equal(badPayload.ok, false)
  assert.equal(badPayload.error.code, 'INVALID_PAYLOAD')
  console.log('PASS jefe-project-persistence-ipc-smoke')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
