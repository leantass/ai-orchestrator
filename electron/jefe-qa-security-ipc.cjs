const path = require('path')
const { createProjectPersistence } = require('./jefe-project-persistence.cjs')
const { createQaSecurityPersistence } = require('./orchestrator-canonical-qa-security-persistence.cjs')
const { createQaSecurityService } = require('./orchestrator-canonical-qa-security-service.cjs')
const { createQaSecurityRecovery } = require('./orchestrator-canonical-qa-security-recovery.cjs')

const CHANNELS = Object.freeze({
  capabilities: 'jefe-qa-security:capabilities',
  request: 'jefe-qa-security:request',
  snapshot: 'jefe-qa-security:snapshot',
  findings: 'jefe-qa-security:findings',
  gates: 'jefe-qa-security:gates',
  corrections: 'jefe-qa-security:corrections',
  correction: 'jefe-qa-security:open-correction',
  recovery: 'jefe-qa-security:recovery',
  runs: 'jefe-qa-security:runs',
})

const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u
function fail(code, message) { const error = new Error(message); error.code = code; throw error }
function safeId(value, field) { if (typeof value !== 'string' || !ID.test(value)) fail('INVALID_ID', `${field} inválido.`); return value }
function noArbitraryPaths(value, key = '') {
  if (!value || typeof value !== 'object') return
  for (const [name, child] of Object.entries(value)) {
    if (['path', 'filePath', 'workspaceRoot', 'rootPath', 'destinationRoot', 'manifestPath', 'command', 'shell'].includes(name)) fail('INVALID_PAYLOAD', 'El payload no admite paths ni comandos arbitrarios.')
    if (name === 'paths') {
      if (!Array.isArray(child) || child.some((item) => typeof item !== 'string' || item.includes('..') || item.includes('\\') || item.startsWith('/') || /^[A-Za-z]:/u.test(item))) fail('INVALID_PAYLOAD', 'El scope QA solo admite paths relativos allowlisted.')
      continue
    }
    noArbitraryPaths(child, name)
  }
}
function safeError(error) { return { ok: false, error: { code: error?.code || 'QA_IPC_FAILED', message: error?.code === 'INVALID_ID' || error?.code === 'INVALID_PAYLOAD' ? error.message : 'La operación QA no pudo completarse.' } } }

function registerQaSecurityIpc({ ipcMain, projectRoot, qaRoot = path.join(projectRoot, 'qa-security') }) {
  const projects = createProjectPersistence({ root: projectRoot })
  const persistence = createQaSecurityPersistence({ root: qaRoot })
  const service = createQaSecurityService({ persistence })
  const recovery = createQaSecurityRecovery({ persistence })
  const registered = ipcMain[Symbol.for('jefe.qaSecurityChannels')] || new Set()
  ipcMain[Symbol.for('jefe.qaSecurityChannels')] = registered
  function handle(channel, handler) {
    if (registered.has(channel)) return
    registered.add(channel)
    ipcMain.handle(channel, async (_event, payload = {}) => {
      try { return await handler(payload) } catch (error) { return safeError(error) }
    })
  }
  async function assertProject(projectId) {
    const project = await projects.getProject(safeId(projectId, 'projectId'))
    if (!project) fail('PROJECT_NOT_FOUND', 'El proyecto físico no está disponible.')
    return project
  }
  async function readRunForProject(payload) {
    const projectId = safeId(payload.projectId, 'projectId')
    await assertProject(projectId)
    const run = await persistence.read(safeId(payload.qaRunId, 'qaRunId'))
    if (!run || run.projectId !== projectId) fail('QA_PROJECT_ISOLATION', 'El QA run no pertenece al proyecto solicitado.')
    return { projectId, run }
  }
  handle(CHANNELS.capabilities, async () => ({ ok: true, channels: CHANNELS, policy: 'canonical-qa-security-v1', readOnlySnapshot: true, arbitraryPaths: false, arbitraryCommands: false }))
  handle(CHANNELS.request, async (payload) => {
    noArbitraryPaths(payload)
    if (!payload || typeof payload.input !== 'object' || Array.isArray(payload.input)) fail('INVALID_PAYLOAD', 'Falta el contrato QA.')
    const projectId = safeId(payload.input.executionContract?.projectId, 'projectId')
    await assertProject(projectId)
    if (payload.input.executionContract.projectId !== projectId) fail('QA_PROJECT_ISOLATION', 'Identidad QA inválida.')
    const result = await service.request(payload.input)
    return { ok: true, run: result.record, idempotent: result.idempotent }
  })
  handle(CHANNELS.snapshot, async (payload) => {
    const { projectId, run } = await readRunForProject(payload)
    const checks = await persistence.readChecks(run.qaRunId)
    const receipts = await persistence.readReceipts(run.qaRunId)
    const findings = await persistence.readFindings(run.qaRunId)
    const corrections = (await persistence.scanDetailed()).corrections.filter((item) => item.qaRunId === run.qaRunId)
    const gates = await persistence.gates(run.qaRunId)
    return { ok: true, projectId, snapshot: { run, checks, receipts, findings, corrections, gates } }
  })
  for (const [channel, type] of [[CHANNELS.findings, 'findings'], [CHANNELS.corrections, 'corrections']]) {
    handle(channel, async (payload) => {
      const { projectId, run } = await readRunForProject(payload)
      const detail = await persistence.scanDetailed()
      return { ok: true, projectId, [type]: detail[type].filter((item) => item.qaRunId === run.qaRunId) }
    })
  }
  handle(CHANNELS.gates, async (payload) => { const { projectId, run } = await readRunForProject(payload); return { ok: true, projectId, gates: await persistence.gates(run.qaRunId) } })
  handle(CHANNELS.recovery, async (payload) => { const { projectId, run } = await readRunForProject(payload); return { ok: true, projectId, recovery: await recovery.diagnose(run.qaRunId) } })
  handle(CHANNELS.runs, async (payload) => {
    const projectId = safeId(payload.projectId, 'projectId')
    await assertProject(projectId)
    const detail = await persistence.scanDetailed()
    const runs = detail.runs.filter((run) => run.projectId === projectId).sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
    return { ok: true, projectId, runs }
  })
  handle(CHANNELS.correction, async (payload) => {
    noArbitraryPaths(payload)
    const { projectId, run } = await readRunForProject(payload)
    if (!Array.isArray(payload.findingIds) || payload.findingIds.length === 0) fail('INVALID_PAYLOAD', 'Faltan findings correlacionados.')
    const result = await service.openCorrection(run.qaRunId, payload.findingIds, payload.returnTarget, payload.reasonCode)
    return { ok: true, projectId, correction: result.record }
  })
  return Object.freeze({ channels: CHANNELS, persistence, service, recovery })
}

module.exports = { CHANNELS, registerQaSecurityIpc }
