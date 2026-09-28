import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { registerCommercialControlCenterIpc, CHANNELS } = require('../electron/jefe-commercial-control-center-ipc.cjs')
const handlers = new Map(); const ipcMain = { handle(channel, fn) { handlers.set(channel, fn) } }; const controlCenter = { global: async () => ({ schemaVersion: 'jefe-commercial-control-center/v1', scope: 'global' }), project: async (id) => ({ schemaVersion: 'jefe-commercial-control-center/v1', scope: 'project', project: { projectId: id } }) }
registerCommercialControlCenterIpc({ ipcMain, controlCenter }); assert.deepEqual([...handlers.keys()].sort(), [CHANNELS.global, CHANNELS.project].sort()); assert.equal((await handlers.get(CHANNELS.global)({}, {})).ok, true); assert.equal((await handlers.get(CHANNELS.project)({}, { projectId: 'project-a' })).controlCenter.project.projectId, 'project-a'); const invalid = await handlers.get(CHANNELS.project)({}, { projectId: '../project-a' }); assert.equal(invalid.ok, false); assert.equal(handlers.has('jefe-control-center:mutate'), false)
console.log('PASS jefe-commercial-control-center-ipc-smoke: allowlisted global/project reads, safe identity and no mutation channels')
