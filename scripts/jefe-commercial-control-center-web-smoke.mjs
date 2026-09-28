import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createFirstVersionFromRun } from '../electron/jefe-project-creation.cjs'
import { createProjectPersistence } from '../electron/jefe-project-persistence.cjs'
import { createJefeWebServer } from '../electron/jefe-web-server.cjs'

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-control-web-')); const created = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'web-control', runId: 'web-control-run', versionId: 'web-control-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Control Web', brief: 'Read model web.', brandSpec: { name: 'Control Web' } }); assert.equal(created.ok, true); await createProjectPersistence({ root }).registerManifest(created.artifacts.manifestPath)
const server = createJefeWebServer({ root, distRoot: path.resolve('dist'), port: 0 }); await server.start(); const headers = { Authorization: `Bearer ${server.token}` }
try {
  const denied = await fetch(`${server.url}/api/control-center`); assert.equal(denied.status, 401)
  const global = await (await fetch(`${server.url}/api/control-center`, { headers })).json(); assert.equal(global.ok, true); assert.equal(global.controlCenter.scope, 'global'); assert.equal(global.controlCenter.projectsSummary.totalProjects, 1)
  const project = await (await fetch(`${server.url}/api/projects/web-control/control-center`, { headers })).json(); assert.equal(project.ok, true); assert.equal(project.controlCenter.scope, 'project'); assert.equal(project.controlCenter.project.projectId, 'web-control')
  const invalid = await fetch(`${server.url}/api/projects/bad%20id/control-center`, { headers }); assert.equal(invalid.status, 400)
  console.log('PASS jefe-commercial-control-center-web-smoke: authenticated global/project reads, invalid identity handling and read-only endpoints')
} finally { await server.close(); await fs.rm(root, { recursive: true, force: true }) }
