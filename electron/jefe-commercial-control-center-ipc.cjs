const { safeId } = require('./jefe-commercial-control-center.cjs')

const CHANNELS = Object.freeze({ global: 'jefe-control-center:global', project: 'jefe-control-center:project' })
function safeError(error) { return { ok: false, error: { code: error?.code || 'CONTROL_CENTER_READ_FAILED', message: error?.code === 'INVALID_PROJECT_ID' ? error.message : 'No se pudo leer el centro de control.' } } }
function registerCommercialControlCenterIpc({ ipcMain, controlCenter }) {
  if (!ipcMain || !controlCenter) throw new Error('Control center IPC requires a service.')
  const registered = ipcMain[Symbol.for('jefe.controlCenterChannels')] || new Set(); ipcMain[Symbol.for('jefe.controlCenterChannels')] = registered
  const handle = (channel, fn) => { if (registered.has(channel)) return; registered.add(channel); ipcMain.handle(channel, async (_event, payload = {}) => { try { return { ok: true, ...(await fn(payload)) } } catch (error) { return safeError(error) } }) }
  handle(CHANNELS.global, async () => ({ controlCenter: await controlCenter.global() }))
  handle(CHANNELS.project, async (payload) => { const projectId = safeId(payload?.projectId); if (!projectId) throw Object.assign(new Error('projectId inválido.'), { code: 'INVALID_PROJECT_ID' }); return { controlCenter: await controlCenter.project(projectId) } })
  return Object.freeze({ channels: CHANNELS, registered })
}
module.exports = { CHANNELS, registerCommercialControlCenterIpc }
