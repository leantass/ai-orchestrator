const { checksum, canonical } = require('./jefe-context-package-contract.cjs')

const MAP = Object.freeze({ assumption: 'assumption', risk: 'risk', question: 'question', failure: 'failure', technical_result: 'result', evidence_reference: 'evidence', validation_result: 'validation', observation: 'assumption', requirement_proposal: 'question', constraint_proposal: 'question', plan_proposal: 'question', correction_proposal: 'question' })

class ResultIngestionError extends Error { constructor(code, message) { super(message); this.code = code } }
function fail(code, message) { throw new ResultIngestionError(code, message) }
function eventId(result, index, type) { return `agent-ingestion-${checksum({ resultId: result.resultId, index, type }).slice(0, 32)}` }

function validResult(attempt) {
  const result = attempt?.result
  if (!result || result.attemptId !== attempt.attemptId || result.packageId !== attempt.packageId || result.targetAgent !== attempt.targetAgent || result.purpose !== attempt.purpose || canonical(result.identity) !== canonical(attempt.identity) || result.actor !== 'internal_consumer' || result.authority !== 'untrusted' || result.integrity?.ingestion !== 'not_ingested') fail('INVALID_RESULT', 'El resultado no es apto para ingesta.')
  return result
}

function createAgentResultIngestion({ persistence, memory, clock = () => new Date().toISOString() } = {}) {
  if (!persistence || typeof persistence.findAttempt !== 'function' || typeof persistence.scan !== 'function' || !memory || typeof memory.append !== 'function') fail('INVALID_DEPENDENCY', 'Dependencias de ingesta invalidas.')
  const locks = new Set()

  function entries(attempt, result) {
    const base = { scope: 'version', identity: attempt.identity, actor: attempt.targetAgent, authority: 'agent_inference', provenance: 'agent_result_ingestion', timestamp: result.createdAt || clock(), relations: [] }
    const metadata = (extra = {}) => ({ packageId: attempt.packageId, handoffId: attempt.handoffId, attemptId: attempt.attemptId, resultId: result.resultId, targetAgent: attempt.targetAgent, purpose: attempt.purpose, ...extra })
    const output = []
    for (const [index, finding] of result.findings.entries()) {
      const type = MAP[finding.kind]
      if (!type) continue
      const proposal = finding.kind.endsWith('_proposal')
      output.push({ ...base, entryId: eventId(result, index, type), type, summary: finding.summary, references: finding.references || [], metadata: metadata({ sourceFindingIndex: index, proposalKind: proposal ? finding.kind : null, ...(proposal ? { nextResponsible: 'lean', requiresLean: true } : {}) }) })
    }
    if (result.requestedHumanAction) output.push({ ...base, entryId: eventId(result, result.findings.length, 'human-action'), type: 'question', summary: result.requestedHumanAction, references: [], metadata: metadata({ nextResponsible: 'lean', requiresLean: true }) })
    if (result.status === 'failed') output.push({ ...base, entryId: eventId(result, result.findings.length + 1, 'failed-result'), type: 'failure', summary: 'El consumidor reportó un resultado fallido.', references: [], metadata: metadata() })
    return output
  }

  async function ingestAttempt(attemptId) {
    const attempt = await persistence.findAttempt(attemptId)
    if (!attempt) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    if (attempt.status === 'ingested') return { status: 'ingested', idempotent: true }
    if (attempt.status === 'ingestion_failed') return { status: 'ingestion_failed', idempotent: true }
    if (!['completed_uningested', 'ingestion_pending'].includes(attempt.status)) fail('INVALID_ATTEMPT_STATUS', 'El intento no esta pendiente de ingesta.')
    if (locks.has(attemptId)) return { status: 'ingestion_pending', locked: true }
    locks.add(attemptId)
    try {
      const result = validResult(attempt)
      let written = 0
      for (const entry of entries(attempt, result)) {
        try {
          const appended = await memory.append(entry)
          if (!appended.idempotent) written++
        } catch (error) {
          if (error.code === 'ENTRY_ID_COLLISION') {
            await persistence.transition(attempt, 'ingestion_failed', { errorCode: 'ENTRY_ID_COLLISION' })
            return { status: 'ingestion_failed', written }
          }
          await persistence.transition(attempt, 'ingestion_pending', { errorCode: 'INGESTION_PENDING' })
          return { status: 'ingestion_pending', written }
        }
      }
      await persistence.transition(attempt, 'ingested', { result })
      return { status: 'ingested', written }
    } finally { locks.delete(attemptId) }
  }

  async function getIngestionStatus(attemptId) {
    try {
      const attempt = await persistence.findAttempt(attemptId)
      return attempt ? { attemptId: attempt.attemptId, status: attempt.status, resultId: attempt.resultId, errorCode: attempt.errorCode } : null
    } catch (error) {
      if (error.code === 'CORRUPT_ATTEMPT') return { attemptId, status: 'ingestion_failed', resultId: null, errorCode: 'CORRUPT_ATTEMPT' }
      throw error
    }
  }

  async function retryResultIngestion(attemptId) { return ingestAttempt(attemptId) }

  async function reconcilePendingResults(options = {}) {
    if (!options || typeof options !== 'object' || Object.keys(options).some((key) => !['projectId', 'limit'].includes(key))) fail('INVALID_RECONCILE', 'Consulta invalida.')
    const { projectId, limit = 20 } = options
    if (typeof projectId !== 'string' || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) fail('INVALID_RECONCILE', 'Consulta invalida.')
    const pending = (await persistence.scan(projectId)).filter((attempt) => ['completed_uningested', 'ingestion_pending'].includes(attempt.status)).sort((a, b) => a.attemptId.localeCompare(b.attemptId))
    const selected = pending.slice(0, limit)
    const items = []
    for (const attempt of selected) items.push(await ingestAttempt(attempt.attemptId))
    return { items, remaining: Math.max(0, pending.length - selected.length) }
  }

  return { ingestAttempt, getIngestionStatus, retryResultIngestion, reconcilePendingResults }
}

module.exports = { MAP, ResultIngestionError, createAgentResultIngestion, deriveIngestionEntryId: eventId }
