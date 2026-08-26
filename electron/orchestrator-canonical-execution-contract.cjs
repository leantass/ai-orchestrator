const crypto = require('crypto')
const path = require('path')
const { canonical } = require('./jefe-context-contract.cjs')
const { validatePlannerPlan } = require('./jefe-planner-contract.cjs')

const SCHEMA_VERSION = 'orchestrator-execution-contract/v1'
const EXECUTION_ID = /^execution-[a-f0-9]{32}$/u
const ATTEMPT_ID = /^execution-attempt-[a-f0-9]{32}$/u
const SAFE_ID = /^[a-z][a-z0-9-]{2,80}$/u
const STATES = Object.freeze(['requested', 'policy_blocked', 'prepared', 'waiting_for_authority', 'running', 'cancel_requested', 'cancelled', 'timed_out', 'interrupted', 'failed_transient', 'failed_permanent', 'completed_unverified', 'recovery_required', 'recovered', 'not_connected'])
const ACTIONS = Object.freeze({
  'codex.inspect': { adapterId: 'codex-cli', commandRef: 'codex.inspect', readOnly: true, argKeys: ['targetPaths'] },
  'codex.apply_patch': { adapterId: 'codex-cli', commandRef: 'codex.apply_patch', readOnly: false, argKeys: ['patchId', 'targetPaths'] }
})
const LIMITS = Object.freeze({ maxFiles: 12, maxBytes: 128 * 1024, maxDurationMs: 120000, maxConcurrency: 1, maxBudgetUnits: 100 })

class ExecutionContractError extends Error { constructor(code, message) { super(message); this.name = 'ExecutionContractError'; this.code = code } }
function fail(code, message) { throw new ExecutionContractError(code, message) }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function clone(value) { return JSON.parse(canonical(value)) }
function plain(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function exact(value, keys, code) { if (!plain(value) || canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code, 'Contrato de ejecucion invalido.') }
function id(value, field) { if (typeof value !== 'string' || !SAFE_ID.test(value)) fail('INVALID_EXECUTION_IDENTITY', `${field} invalido.`); return value }
function text(value, field, max = 200) { if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/u.test(value) || /password|secret|token|credential|authorization|api.?key/iu.test(value)) fail('UNSAFE_EXECUTION_TEXT', `${field} invalido.`); return value.trim() }
function relative(value, field) { if (typeof value !== 'string' || !value || value.length > 240 || path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || value.includes('\\') || value.split('/').includes('..') || value.startsWith('/') || /[\u0000-\u001f]/u.test(value) || value.includes(':')) fail('UNSAFE_PATH', `${field} invalido.`); return value }
function timestamp(value, field) { if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) fail('INVALID_EXECUTION_TIMESTAMP', `${field} invalido.`); return new Date(value).toISOString() }
function finitePositive(value, field, max) { if (!Number.isSafeInteger(value) || value < 1 || value > max) fail('LIMIT_EXCEEDED', `${field} excede el limite.`); return value }
function validateRepository(value) {
  exact(value, ['repositoryId', 'rootKey', 'branch', 'head', 'clean', 'sourceWorktree', 'worktreeId', 'allowlisted'], 'INVALID_REPOSITORY_POLICY')
  id(value.repositoryId, 'repositoryId'); id(value.worktreeId, 'worktreeId'); text(value.rootKey, 'rootKey', 180); text(value.branch, 'branch', 180); if (!/^[a-f0-9]{7,64}$/u.test(value.head)) fail('INVALID_REPOSITORY_POLICY', 'HEAD invalido.')
  if (value.clean !== true || value.sourceWorktree !== false || value.allowlisted !== true) fail('REPOSITORY_POLICY_BLOCKED', 'El worktree fuente no es elegible.')
  return clone(value)
}
function validateArgs(actionId, value) {
  const action = ACTIONS[actionId]; exact(value, action.argKeys, 'INVALID_ACTION_ARGUMENTS')
  if (actionId === 'codex.inspect') { if (!Array.isArray(value.targetPaths) || value.targetPaths.length < 1 || value.targetPaths.length > LIMITS.maxFiles) fail('INVALID_ACTION_ARGUMENTS', 'Lista de archivos invalida.'); return { targetPaths: value.targetPaths.map((item) => relative(item, 'targetPath')) } }
  if (!/^patch-[a-f0-9]{32}$/u.test(value.patchId) || !Array.isArray(value.targetPaths) || value.targetPaths.length < 1 || value.targetPaths.length > LIMITS.maxFiles) fail('INVALID_ACTION_ARGUMENTS', 'Patch estructurado invalido.')
  return { patchId: value.patchId, targetPaths: value.targetPaths.map((item) => relative(item, 'targetPath')) }
}
function deriveExecutionId(value) { return `execution-${digest(value).slice(0, 32)}` }
function deriveAttemptId(executionId, attemptNumber) { return `execution-attempt-${digest({ executionId, attemptNumber }).slice(0, 32)}` }
function createExecutionContract({ plannerPlan, repository, actionId, args, authority = null, now }) {
  const plan = validatePlannerPlan(plannerPlan); const repo = validateRepository(repository); if (!ACTIONS[actionId]) fail('COMMAND_NOT_ALLOWLISTED', 'Accion fuera del catalogo.')
  const cleanArgs = validateArgs(actionId, args); const approved = authority?.executionApproved === true && typeof authority.approvedBy === 'string' && authority.approvedBy.length > 0
  const seed = { projectId: plan.identity.projectId, runId: plan.identity.runId, versionId: plan.identity.versionId, plannerPlanId: plan.plannerPlanId, actionId, args: cleanArgs, repositoryId: repo.repositoryId, worktreeId: repo.worktreeId }
  const executionId = deriveExecutionId(seed); const createdAt = timestamp(now || new Date().toISOString(), 'createdAt')
  return Object.freeze({ schemaVersion: SCHEMA_VERSION, executionId, attemptId: deriveAttemptId(executionId, 1), attemptNumber: 1, projectId: plan.identity.projectId, runId: plan.identity.runId, versionId: plan.identity.versionId, plannerPlanId: plan.plannerPlanId, actionId, commandRef: ACTIONS[actionId].commandRef, args: cleanArgs, repository: repo, baseline: { head: repo.head, branch: repo.branch, fingerprint: digest(repo) }, permission: { executionApproved: approved, approvedBy: approved ? text(authority.approvedBy, 'approvedBy', 120) : null, derivedFrom: approved ? 'trusted-human-authority' : 'planner-closed-without-execution-authority' }, limits: clone(LIMITS), state: plan.gate.contractStatus === 'closed' ? 'requested' : 'policy_blocked', revision: 0, createdAt, updatedAt: createdAt, adapter: { id: ACTIONS[actionId].adapterId, state: 'not_connected' } })
}
function validateExecutionContract(value) {
  if (!plain(value) || value.schemaVersion !== SCHEMA_VERSION || !EXECUTION_ID.test(value.executionId) || !ATTEMPT_ID.test(value.attemptId) || value.attemptNumber !== 1) fail('INVALID_EXECUTION_CONTRACT', 'Contrato de ejecucion invalido.')
  if (![value.projectId, value.runId, value.versionId, value.plannerPlanId].every((item) => typeof item === 'string')) fail('INVALID_EXECUTION_CONTRACT', 'Correlacion invalida.')
  validateRepository(value.repository); if (!ACTIONS[value.actionId] || value.commandRef !== ACTIONS[value.actionId].commandRef) fail('INVALID_EXECUTION_CONTRACT', 'Accion invalida.')
  validateArgs(value.actionId, value.args); if (!STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_EXECUTION_CONTRACT', 'Estado invalido.')
  timestamp(value.createdAt, 'createdAt'); timestamp(value.updatedAt, 'updatedAt'); return clone(value)
}
module.exports = { SCHEMA_VERSION, EXECUTION_ID, ATTEMPT_ID, STATES, ACTIONS, LIMITS, ExecutionContractError, deriveExecutionId, deriveAttemptId, createExecutionContract, validateExecutionContract }
