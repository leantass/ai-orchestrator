const crypto = require('crypto')
const { canonical } = require('./jefe-context-contract.cjs')
function createQaSecurityRecovery({ persistence }) {
  if (!persistence || typeof persistence.scanDetailed !== 'function') throw new Error('INVALID_QA_PERSISTENCE')
  async function diagnose(qaRunId) { const detail = await persistence.scanDetailed(); const run = detail.runs.find((item) => item.qaRunId === qaRunId); return { schemaVersion: 'orchestrator-qa-recovery/v1', qaRunId, status: run ? 'diagnosed' : 'missing', corruption: detail.corruptions, corruptionScope: detail.corruptions.some((item) => item.type === 'qa-runs') ? 'run_and_related' : 'related_or_unattributed', canRebuildIndex: true, canExecuteChecks: false, planFingerprint: crypto.createHash('sha256').update(canonical({ qaRunId, corruption: detail.corruptions })).digest('hex') } }
  async function rebuild() { return persistence.rebuildIndex() }
  return Object.freeze({ diagnose, rebuild })
}
module.exports = { createQaSecurityRecovery }
