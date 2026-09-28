const crypto = require('node:crypto')

const EXECUTION_RECEIPT_SCHEMA = 'jefe-release-execution-receipt/v1'
const EXECUTION_STATUSES = Object.freeze(['started', 'succeeded', 'failed', 'cancelled', 'not_connected', 'execution_uncertain'])
const EXECUTION_ACTIONS = Object.freeze(['git_commit', 'git_push', 'trigger_ci', 'release_tag', 'create_pr', 'merge', 'deploy'])

class ReleaseExecutionError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ReleaseExecutionError'; this.code = code; this.details = details }
}
function fail(code, message, details = {}) { throw new ReleaseExecutionError(code, message, details) }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (!value || typeof value !== 'object') return JSON.stringify(value); return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function text(value, field, max = 300, optional = false) { if (optional && (value === null || value === undefined)) return null; if (typeof value !== 'string' || !value.trim() || value.length > max) fail('EXECUTION_RECEIPT_INVALID', `${field} is invalid.`); return value.trim() }
function sha(value, field) { const result = text(value, field, 64); if (!/^[a-f0-9]{64}$/iu.test(result)) fail('EXECUTION_RECEIPT_INVALID', `${field} must be SHA-256.`); return result.toLowerCase() }
function gitSha(value, field) { const result = text(value, field, 64); if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/iu.test(result)) fail('EXECUTION_RECEIPT_INVALID', `${field} must be a Git object ID.`); return result.toLowerCase() }
function safeId(value, field) { const result = text(value, field, 180); if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,40}$/u.test(result)) fail('EXECUTION_RECEIPT_INVALID', `${field} is invalid.`); return result }
function sanitizeError(error) {
  const raw = String(error?.message || error || 'Execution failed')
  const message = raw.replace(/(token|password|secret|api[_-]?key|authorization|credential|pat)[^\s:=]*\s*[:=]\s*[^\s]+/giu, '$1=[redacted]').replace(/[A-Za-z]:\\[^\s]+|\/(?:[^\s/]+\/)+[^\s]*/gu, '[path-redacted]').slice(0, 500)
  return { code: text(error?.code || 'EXECUTION_FAILED', 'sanitizedError.code', 100), message }
}
function createExecutionReceipt({ outboxId, releaseFlowId, requestId, action, repository, branch, headSha, status = 'started', startedAt, completedAt = null, result = null, error = null } = {}) {
  safeId(outboxId, 'outboxId'); safeId(releaseFlowId, 'releaseFlowId'); safeId(requestId, 'requestId')
  if (!EXECUTION_ACTIONS.includes(action)) fail('EXECUTION_RECEIPT_INVALID', 'action is not executable.')
  if (!repository || typeof repository.repoIdentity !== 'string') fail('EXECUTION_RECEIPT_INVALID', 'repository identity is required.')
  const receipt = { schemaVersion: EXECUTION_RECEIPT_SCHEMA, receiptId: `release-receipt-${digest({ outboxId, action }).slice(0, 24)}`, outboxId, releaseFlowId, requestId, action, repository: text(repository.repoIdentity, 'repository.repoIdentity', 240), boundBranch: text(branch, 'boundBranch', 240), boundHead: gitSha(headSha, 'boundHead'), status, startedAt: text(startedAt, 'startedAt', 80), completedAt: completedAt ? text(completedAt, 'completedAt', 80) : null, resultFingerprint: result ? digest(result) : null, sanitizedError: error ? sanitizeError(error) : null }
  if (!EXECUTION_STATUSES.includes(status)) fail('EXECUTION_RECEIPT_INVALID', 'status is invalid.')
  if ((status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'not_connected') && !receipt.completedAt) fail('EXECUTION_RECEIPT_INVALID', 'completedAt is required for a terminal receipt.')
  return receipt
}
function validateExecutionReceipt(receipt) {
  if (!receipt || receipt.schemaVersion !== EXECUTION_RECEIPT_SCHEMA) fail('EXECUTION_RECEIPT_INVALID', 'Unsupported execution receipt schema.')
  const expected = createExecutionReceipt({ outboxId: receipt.outboxId, releaseFlowId: receipt.releaseFlowId, requestId: receipt.requestId, action: receipt.action, repository: { repoIdentity: receipt.repository }, branch: receipt.boundBranch, headSha: receipt.boundHead, status: receipt.status, startedAt: receipt.startedAt, completedAt: receipt.completedAt })
  expected.resultFingerprint = receipt.resultFingerprint
  expected.sanitizedError = receipt.sanitizedError
  if (canonical(expected) !== canonical(receipt)) fail('EXECUTION_RECEIPT_INVALID', 'Execution receipt normalization mismatch.')
  return receipt
}
module.exports = { EXECUTION_RECEIPT_SCHEMA, EXECUTION_STATUSES, EXECUTION_ACTIONS, ReleaseExecutionError, createExecutionReceipt, validateExecutionReceipt, sanitizeError, digest, canonical }
