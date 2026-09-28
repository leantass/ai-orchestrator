function safeProjectId(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,50}$/u.test(value)) {
    const error = new Error('El proyecto solicitado no es valido.')
    error.code = 'INVALID_PROJECT_ID'
    throw error
  }
  return value
}

function safeError(error) { return { ok: false, error: { code: error?.code || 'OBSERVABILITY_READ_FAILED', message: 'No se pudo leer el estado operativo.' } } }
function projection(state) {
  return { ...state, sourceStatuses: state.sourceStatuses.map((source) => ({ sourceId: source.sourceId, sourceKind: source.sourceKind, status: source.status, lastSuccessfulSync: source.lastSuccessfulSync, lastAttemptAt: source.lastAttemptAt, recordsObserved: source.recordsObserved, recordsIngested: source.recordsIngested, lastError: source.lastError, evidenceRefs: source.evidenceRefs })), corruptions: state.corruptions.map((item) => ({ store: item.store, recordId: item.recordId, code: item.code })) }
}

function registerObservabilityIpc({ ipcMain, runtime }) {
  if (!ipcMain || !runtime) throw new Error('Observability IPC requires a runtime.')
  const registered = ipcMain[Symbol.for('jefe.observabilityChannels')] || new Set()
  ipcMain[Symbol.for('jefe.observabilityChannels')] = registered
  const handle = (channel, fn) => { if (registered.has(channel)) return; registered.add(channel); ipcMain.handle(channel, async (_event, payload = {}) => { try { return { ok: true, ...(await fn(payload)) } } catch (error) { return safeError(error) } }) }
  handle('jefe-observability:refresh', async (payload) => ({ state: projection(await runtime.refreshOperationalState({ sync: true, projectId: safeProjectId(payload?.projectId) })) }))
  handle('jefe-observability:state', async (payload) => ({ state: projection(await runtime.getOperationalState({ projectId: safeProjectId(payload?.projectId), limit: Math.min(50, Math.max(1, Number(payload?.limit) || 25)), cursor: typeof payload?.cursor === 'string' ? payload.cursor : null })) }))
  return Object.freeze({ registered })
}

module.exports = { registerObservabilityIpc }
