const path = require('path')

const scopes = new Map()
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }
const keyFor = (root, connectorId) => `${path.resolve(root)}:${connectorId}`

function getScope(root, connectorId, maxConcurrency) {
  const key = keyFor(root, connectorId)
  let scope = scopes.get(key)
  if (!scope) {
    scope = { key, maxConcurrency, activeAttempts: new Set(), queuedAttempts: [], executionPromisesByAttempt: new Map(), cancellationSignalsByAttempt: new Map() }
    scopes.set(key, scope)
  } else scope.maxConcurrency = Math.min(scope.maxConcurrency, maxConcurrency)
  return scope
}
function cleanup(scope) { if (!scope.activeAttempts.size && !scope.queuedAttempts.length && !scope.executionPromisesByAttempt.size && !scope.cancellationSignalsByAttempt.size) scopes.delete(scope.key) }
function drain(scope) { while (scope.activeAttempts.size < scope.maxConcurrency && scope.queuedAttempts.length) { const ticket = scope.queuedAttempts.shift(); ticket.granted = true; scope.activeAttempts.add(ticket.attemptId); ticket.grant() } }
function execute({ root, connectorId, maxConcurrency, attemptId, task }) {
  const scope = getScope(root, connectorId, maxConcurrency)
  const existing = scope.executionPromisesByAttempt.get(attemptId)
  if (existing) return existing
  const ticket = deferred(); ticket.attemptId = attemptId; ticket.granted = false; ticket.grant = ticket.resolve
  const cancellation = deferred(); scope.cancellationSignalsByAttempt.set(attemptId, cancellation)
  const execution = (async () => { try { await ticket.promise; return await task({ cancelled: cancellation.promise }) } finally { if (ticket.granted) scope.activeAttempts.delete(attemptId); scope.executionPromisesByAttempt.delete(attemptId); scope.cancellationSignalsByAttempt.delete(attemptId); drain(scope); cleanup(scope) } })()
  scope.executionPromisesByAttempt.set(attemptId, execution); scope.queuedAttempts.push(ticket); drain(scope)
  return execution
}
function cancel({ root, connectorId, attemptId }) {
  const scope = scopes.get(keyFor(root, connectorId)); if (!scope) return false
  const signal = scope.cancellationSignalsByAttempt.get(attemptId); if (!signal) return false
  signal.resolve({ kind: 'cancelled' })
  const index = scope.queuedAttempts.findIndex((ticket) => ticket.attemptId === attemptId)
  if (index >= 0) { const [ticket] = scope.queuedAttempts.splice(index, 1); ticket.grant() }
  cleanup(scope); return true
}
function isExecuting({ root, connectorId, attemptId }) {
  return scopes.get(keyFor(root, connectorId))?.executionPromisesByAttempt.has(attemptId) === true
}
module.exports = { execute, cancel, isExecuting }
