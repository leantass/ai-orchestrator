const crypto = require('crypto')
const { canonical } = require('./jefe-context-contract.cjs')

const ACTIONS = Object.freeze(['defer', 'accept_existing', 'supersede_with_correction', 'invalidate'])
const ID = /^[a-z][a-z0-9_-]{2,80}$/u

class ContextConflictResolutionError extends Error { constructor(code, message) { super(message); this.code = code } }
function fail(code, message) { throw new ContextConflictResolutionError(code, message) }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function safeId(value) { return typeof value === 'string' && ID.test(value) }

function createContextConflictResolution({ memory, clock = () => new Date().toISOString() } = {}) {
  if (!memory || typeof memory.readEvents !== 'function' || typeof memory.append !== 'function') fail('INVALID_DEPENDENCY', 'Dependencia contextual invalida.')

  async function conflictsFor(projectId) {
    if (!safeId(projectId)) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
    const { entries, corruptions } = await memory.readEvents()
    const relevant = entries.filter((entry) => entry.identity.projectId === projectId)
    const byId = new Map(relevant.map((entry) => [entry.entryId, entry]))
    const groups = new Map()
    for (const entry of relevant) for (const relation of entry.relations) {
      if (relation.kind !== 'conflicts_with' || !byId.has(relation.entryId)) continue
      const pair = [entry.entryId, relation.entryId].sort()
      const conflictId = `context-conflict-${digest({ projectId, pair }).slice(0, 32)}`
      if (!groups.has(conflictId)) groups.set(conflictId, { conflictId, entries: pair, identity: entry.identity })
    }
    const output = []
    for (const conflict of groups.values()) {
      const resolutions = relevant.filter((entry) => entry.metadata?.conflictId === conflict.conflictId).sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.entryId.localeCompare(b.entryId))
      const latest = resolutions.at(-1) || null
      const state = !latest ? 'open' : latest.metadata.resolutionAction === 'defer' ? 'deferred' : 'resolved'
      const fingerprint = digest({ conflictId: conflict.conflictId, entries: conflict.entries, resolutions: resolutions.map((entry) => ({ entryId: entry.entryId, action: entry.metadata.resolutionAction, reason: entry.metadata.reason })) })
      output.push({ conflictId: conflict.conflictId, projectId, identity: conflict.identity, entries: conflict.entries, fingerprint, state, authorityRequired: 'human_decision', nextResponsible: state === 'resolved' ? null : 'lean', resolutionEntryId: latest?.entryId || null })
    }
    return { conflicts: output.sort((a, b) => a.conflictId.localeCompare(b.conflictId)), corruptions: corruptions.length }
  }

  async function listConflicts({ projectId } = {}) { return conflictsFor(projectId) }

  async function resolveConflict(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !['projectId', 'conflictId', 'action', 'reason', 'fingerprint'].includes(key))) fail('INVALID_RESOLUTION', 'Resolucion invalida.')
    const { projectId, conflictId, action, reason, fingerprint } = input
    if (!safeId(projectId) || typeof conflictId !== 'string' || !/^context-conflict-[a-f0-9]{32}$/u.test(conflictId) || !ACTIONS.includes(action) || typeof reason !== 'string' || !reason.trim() || reason.length > 500 || typeof fingerprint !== 'string' || !/^[a-f0-9]{64}$/u.test(fingerprint)) fail('INVALID_RESOLUTION', 'Resolucion invalida.')
    const { conflicts } = await conflictsFor(projectId)
    const conflict = conflicts.find((item) => item.conflictId === conflictId)
    if (!conflict) fail('CONFLICT_NOT_FOUND', 'Conflicto inexistente.')
    if (conflict.fingerprint !== fingerprint) fail('STALE_CONFLICT', 'El conflicto cambio antes de resolverlo.')
    if (!['open', 'deferred'].includes(conflict.state)) fail('CONFLICT_NOT_OPEN', 'El conflicto no admite otra resolucion.')
    const { entries } = await memory.readEvents()
    const prior = entries.find((entry) => entry.metadata?.conflictId === conflictId && entry.metadata?.resolutionAction === action)
    if (prior) {
      if (prior.metadata.reason === reason.trim()) return { conflictId, status: prior.metadata.resolutionAction === 'defer' ? 'deferred' : 'resolved', entryId: prior.entryId, idempotent: true }
      fail('INCOMPATIBLE_REPLAY', 'La resolucion repetida no coincide.')
    }
    const resolutionId = `context-resolution-${digest({ conflictId, action }).slice(0, 32)}`
    const relationKind = action === 'supersede_with_correction' ? 'replaces' : action === 'invalidate' ? 'invalidates' : 'resolves'
    const entry = {
      entryId: resolutionId,
      scope: 'version',
      identity: conflict.identity,
      type: action === 'supersede_with_correction' || action === 'invalidate' ? 'correction' : 'decision',
      summary: `Resolucion humana de conflicto: ${action}.`,
      detail: reason.trim(),
      state: action === 'invalidate' ? 'invalidated' : action === 'supersede_with_correction' ? 'applied' : 'resolved',
      actor: 'lean',
      authority: 'human_decision',
      provenance: 'trusted_context_conflict_resolution',
      timestamp: clock(),
      references: [],
      relations: conflict.entries.map((entryId) => ({ kind: relationKind, entryId })),
      metadata: { conflictId, resolutionAction: action, reason: reason.trim(), nextResponsible: action === 'defer' ? 'lean' : null, requiresLean: action === 'defer' },
    }
    const appended = await memory.append(entry)
    return { conflictId, status: action === 'defer' ? 'deferred' : 'resolved', entryId: appended.entry.entryId, idempotent: appended.idempotent }
  }

  return { listConflicts, resolveConflict }
}

module.exports = { ACTIONS, ContextConflictResolutionError, createContextConflictResolution }
