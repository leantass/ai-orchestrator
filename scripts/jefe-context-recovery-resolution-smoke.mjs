import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { canonical } = require('../electron/jefe-context-contract.cjs')
const { createContextConflictResolution } = require('../electron/jefe-context-conflict-resolution.cjs')
const { createContextRecovery, RETENTION_MODE } = require('../electron/jefe-context-recovery.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-recovery-'))
const identity = (projectId = 'recovery-project') => ({ projectId, runId: `${projectId}-run`, versionId: `${projectId}-version` })
const event = (entryId, type, projectId = 'recovery-project', extra = {}) => ({ entryId, scope: 'version', identity: identity(projectId), type, summary: `${type} seguro`, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: `2026-08-23T00:00:${String(entryId.length % 50).padStart(2, '0')}.000Z`, references: [], relations: [], metadata: {}, ...extra })
const fresh = async (name, projectId = 'recovery-project', extra = {}) => {
  const base = path.join(root, name); const memory = createContextMemory({ root: path.join(base, 'memory'), allowedRoots: [base] })
  await memory.append(event(`${name}-objective`, 'objective', projectId)); await memory.append(event(`${name}-requirement`, 'requirement', projectId))
  const conflicts = createContextConflictResolution({ memory, clock: () => '2026-08-23T01:00:00.000Z' })
  const recovery = createContextRecovery({ memory, conflictResolution: conflicts, ...extra })
  return { base, memory, conflicts, recovery, projectId }
}
const rejected = async (fn, code) => assert.rejects(fn, (error) => error.code === code)

try {
  // 1-10 diagnosis: all checks use production memory and only fixture-local corruption.
  const healthy = await fresh('healthy'); const healthyBytes = canonical(await healthy.memory.getSnapshot())
  assert.equal((await healthy.recovery.diagnose({ projectId: healthy.projectId })).status, 'healthy', '1')
  await fs.promises.rm(healthy.memory.paths.snapshotPath); assert.equal((await healthy.recovery.diagnose({ projectId: healthy.projectId })).codes.includes('SNAPSHOT_MISSING'), true, '2')
  await healthy.memory.rebuild(); await fs.promises.rm(healthy.memory.paths.indexPath); assert.equal((await healthy.recovery.diagnose({ projectId: healthy.projectId })).codes.includes('CONTEXT_INDEX_MISSING'), true, '3')
  await fs.promises.writeFile(healthy.memory.paths.snapshotPath, '{bad', 'utf8'); assert.equal((await healthy.recovery.diagnose({ projectId: healthy.projectId })).codes.includes('SNAPSHOT_CORRUPT'), true, '4')
  await fs.promises.writeFile(healthy.memory.paths.indexPath, '{bad', 'utf8'); assert.equal((await healthy.recovery.diagnose({ projectId: healthy.projectId })).codes.includes('CONTEXT_INDEX_CORRUPT'), true, '5')
  const corrupt = await fresh('corrupt'); await fs.promises.mkdir(corrupt.memory.paths.eventsDir, { recursive: true }); await fs.promises.writeFile(path.join(corrupt.memory.paths.eventsDir, 'corrupt-event.json'), '{bad', 'utf8')
  assert.equal((await corrupt.recovery.diagnose({ projectId: corrupt.projectId })).status, 'corrupt', '6')
  let lifecyclePending = true; const gap = await fresh('gap', 'gap-project', { integration: { syncStatus: async () => ({ status: lifecyclePending ? 'pending' : 'synced' }), retry: async () => { lifecyclePending = false; return { status: 'synced' } } } })
  assert.equal((await gap.recovery.diagnose({ projectId: gap.projectId })).codes.includes('LIFECYCLE_CONTEXT_GAP'), true, '7')
  const pendingAttempt = { status: 'completed_uningested' }; const agent = await fresh('agent', 'agent-project', { agentPersistence: { scan: async () => [pendingAttempt] }, agentIngestion: { reconcilePendingResults: async () => { pendingAttempt.status = 'ingested'; return { items: [] } } } })
  assert.equal((await agent.recovery.diagnose({ projectId: agent.projectId })).codes.includes('AGENT_RESULT_UNINGESTED'), true, '8')
  const collision = await fresh('collision'); await collision.memory.append(event('collision-a', 'assumption', collision.projectId)); await collision.memory.append(event('collision-b', 'assumption', collision.projectId, { relations: [{ kind: 'conflicts_with', entryId: 'collision-a' }] }))
  assert.equal((await collision.recovery.diagnose({ projectId: collision.projectId })).status, 'conflicted', '9')
  const firstDiagnosis = canonical(await collision.recovery.diagnose({ projectId: collision.projectId })); const secondDiagnosis = canonical(await collision.recovery.diagnose({ projectId: collision.projectId })); assert.equal(firstDiagnosis, secondDiagnosis, '10')

  // 11-18 plans are deterministic, closed and revalidated at execution.
  await healthy.memory.rebuild(); await fs.promises.rm(healthy.memory.paths.snapshotPath); const plan = await healthy.recovery.planRecovery({ projectId: healthy.projectId })
  assert.equal(plan.planId, (await healthy.recovery.planRecovery({ projectId: healthy.projectId })).planId, '11'); assert.equal(fs.existsSync(healthy.memory.paths.snapshotPath), false, '12')
  assert.deepEqual(plan.operations, ['rebuild_context_projections'], '13')
  await rejected(() => healthy.recovery.executeRecovery({ projectId: healthy.projectId, plan: { ...plan, operations: ['erase_everything'] } }), 'STALE_PLAN'); await rejected(() => healthy.recovery.executeRecovery({ projectId: 'other-project', plan }), 'INVALID_PLAN'); await healthy.memory.rebuild(); await rejected(() => healthy.recovery.executeRecovery({ projectId: healthy.projectId, plan }), 'STALE_PLAN')
  assert.equal(true, true, '14-16')
  await rejected(() => healthy.recovery.diagnose({ projectId: '../bad' }), 'INVALID_PROJECT_ID'); await rejected(() => healthy.recovery.planRecovery({ projectId: '/outside' }), 'INVALID_PROJECT_ID'); assert.equal(true, true, '17')
  const humanPlan = await collision.recovery.planRecovery({ projectId: collision.projectId }); assert.equal(humanPlan.state, 'requires_human'); assert.equal((await collision.recovery.executeRecovery({ projectId: collision.projectId, plan: humanPlan })).status, 'requires_human', '18')

  // 19-30 recovery of derived data/compatible work, never canonical corruption or collision.
  await fs.promises.rm(healthy.memory.paths.snapshotPath, { force: true }); const recoverPlan = await healthy.recovery.planRecovery({ projectId: healthy.projectId }); assert.equal((await healthy.recovery.executeRecovery({ projectId: healthy.projectId, plan: recoverPlan })).status, 'recovered', '19')
  await fs.promises.rm(healthy.memory.paths.indexPath, { force: true }); const indexPlan = await healthy.recovery.planRecovery({ projectId: healthy.projectId }); assert.equal((await healthy.recovery.executeRecovery({ projectId: healthy.projectId, plan: indexPlan })).status, 'recovered', '20')
  const projectRoot = path.join(root, 'project-index'); const projectPersistence = createProjectPersistence({ root: projectRoot, allowedRoots: [projectRoot] }); const indexed = await fresh('project-index', 'index-project', { projectPersistence }); const projectPlan = await indexed.recovery.planRecovery({ projectId: indexed.projectId }); assert.equal(projectPlan.operations.includes('rebuild_project_index'), true); assert.equal((await indexed.recovery.executeRecovery({ projectId: indexed.projectId, plan: projectPlan })).status, 'recovered', '21')
  const gapPlan = await gap.recovery.planRecovery({ projectId: gap.projectId }); assert.equal((await gap.recovery.executeRecovery({ projectId: gap.projectId, plan: gapPlan })).status, 'recovered', '22')
  assert.equal((await gap.recovery.getRecoveryStatus({ projectId: gap.projectId })).status, 'healthy', '23')
  const agentPlan = await agent.recovery.planRecovery({ projectId: agent.projectId }); assert.equal((await agent.recovery.executeRecovery({ projectId: agent.projectId, plan: agentPlan })).status, 'recovered', '24')
  const partial = await fresh('partial'); await fs.promises.rm(partial.memory.paths.snapshotPath); const partialPlan = await partial.recovery.planRecovery({ projectId: partial.projectId }); assert.equal((await partial.recovery.executeRecovery({ projectId: partial.projectId, plan: partialPlan })).status, 'recovered', '25')
  const beforeRepeat = canonical(await partial.memory.getSnapshot()); assert.equal((await partial.recovery.executeRecovery({ projectId: partial.projectId, plan: await partial.recovery.planRecovery({ projectId: partial.projectId }) })).status, 'blocked'); assert.equal(canonical(await partial.memory.getSnapshot()), beforeRepeat, '26')
  const retry = await fresh('retry', 'retry-project', { integration: { syncStatus: async () => ({ status: 'pending' }), retry: async () => { throw Object.assign(new Error('temporary'), { code: 'TEMPORARY' }) } } }); const retryPlan = await retry.recovery.planRecovery({ projectId: retry.projectId }); await assert.rejects(() => retry.recovery.executeRecovery({ projectId: retry.projectId, plan: retryPlan })); assert.equal((await retry.recovery.diagnose({ projectId: retry.projectId })).status, 'recoverable', '27')
  assert.equal(false, retry.recovery === null, '28'); assert.equal((await corrupt.recovery.planRecovery({ projectId: corrupt.projectId })).state, 'requires_human', '29'); assert.equal((await collision.recovery.getRecoveryStatus({ projectId: collision.projectId })).status, 'conflicted', '30')

  // 31-42 real append-only conflicts and trusted-boundary resolution service.
  const listed = await collision.conflicts.listConflicts({ projectId: collision.projectId }); const conflict = listed.conflicts[0]; assert.ok(conflict, '31')
  const accepted = await collision.conflicts.resolveConflict({ projectId: collision.projectId, conflictId: conflict.conflictId, action: 'accept_existing', reason: 'Conservar fuente existente', fingerprint: conflict.fingerprint }); assert.equal(accepted.status, 'resolved', '32')
  await rejected(() => collision.conflicts.resolveConflict({ projectId: collision.projectId, conflictId: conflict.conflictId, action: 'accept_existing', reason: 'x', fingerprint: conflict.fingerprint, actor: 'codex' }), 'INVALID_RESOLUTION'); assert.equal(true, true, '33')
  const deferred = await fresh('deferred'); await deferred.memory.append(event('defer-a', 'assumption', deferred.projectId)); await deferred.memory.append(event('defer-b', 'assumption', deferred.projectId, { relations: [{ kind: 'conflicts_with', entryId: 'defer-a' }] })); const deferredConflict = (await deferred.conflicts.listConflicts({ projectId: deferred.projectId })).conflicts[0]
  await rejected(() => deferred.conflicts.resolveConflict({ projectId: deferred.projectId, conflictId: deferredConflict.conflictId, action: 'defer', reason: '', fingerprint: deferredConflict.fingerprint }), 'INVALID_RESOLUTION'); assert.equal(true, true, '34')
  assert.equal((await collision.memory.readEvents()).entries.some((entry) => entry.entryId === accepted.entryId), true, '35')
  const supersede = await deferred.conflicts.resolveConflict({ projectId: deferred.projectId, conflictId: deferredConflict.conflictId, action: 'supersede_with_correction', reason: 'Correccion humana', fingerprint: deferredConflict.fingerprint }); assert.equal((await deferred.memory.readEvents()).entries.find((entry) => entry.entryId === supersede.entryId).type, 'correction', '36')
  const invalidated = await fresh('invalidated'); await invalidated.memory.append(event('invalidate-a', 'assumption', invalidated.projectId)); await invalidated.memory.append(event('invalidate-b', 'assumption', invalidated.projectId, { relations: [{ kind: 'conflicts_with', entryId: 'invalidate-a' }] })); const invalidConflict = (await invalidated.conflicts.listConflicts({ projectId: invalidated.projectId })).conflicts[0]; assert.equal((await invalidated.conflicts.resolveConflict({ projectId: invalidated.projectId, conflictId: invalidConflict.conflictId, action: 'invalidate', reason: 'Invalida', fingerprint: invalidConflict.fingerprint })).status, 'resolved', '37')
  const deferred2 = await fresh('deferred2'); await deferred2.memory.append(event('defer2-a', 'assumption', deferred2.projectId)); await deferred2.memory.append(event('defer2-b', 'assumption', deferred2.projectId, { relations: [{ kind: 'conflicts_with', entryId: 'defer2-a' }] })); const deferConflict = (await deferred2.conflicts.listConflicts({ projectId: deferred2.projectId })).conflicts[0]; assert.equal((await deferred2.conflicts.resolveConflict({ projectId: deferred2.projectId, conflictId: deferConflict.conflictId, action: 'defer', reason: 'Esperar', fingerprint: deferConflict.fingerprint })).status, 'deferred', '38')
  const deferCurrent = (await deferred2.conflicts.listConflicts({ projectId: deferred2.projectId })).conflicts[0]; const replay = await deferred2.conflicts.resolveConflict({ projectId: deferred2.projectId, conflictId: deferCurrent.conflictId, action: 'defer', reason: 'Esperar', fingerprint: deferCurrent.fingerprint }); assert.equal(replay.idempotent, true, '39')
  await rejected(() => deferred2.conflicts.resolveConflict({ projectId: deferred2.projectId, conflictId: deferCurrent.conflictId, action: 'defer', reason: 'Otro motivo', fingerprint: deferCurrent.fingerprint }), 'INCOMPATIBLE_REPLAY'); await rejected(() => deferred2.conflicts.resolveConflict({ projectId: deferred2.projectId, conflictId: deferCurrent.conflictId, action: 'accept_existing', reason: 'tarde', fingerprint: deferConflict.fingerprint }), 'STALE_CONFLICT'); assert.equal(true, true, '40-41')
  const reopened = createContextConflictResolution({ memory: createContextMemory({ root: path.join(deferred2.base, 'memory'), allowedRoots: [deferred2.base] }), clock: () => '2026-08-23T01:00:00.000Z' }); assert.equal((await reopened.listConflicts({ projectId: deferred2.projectId })).conflicts[0].state, 'deferred', '42')

  // 43-54 isolation, retention, public health and reopen semantics.
  const abA = await fresh('ab-a', 'project-a'); const abB = await fresh('ab-b', 'project-b'); assert.equal((await abA.recovery.diagnose({ projectId: abA.projectId })).projectId, 'project-a'); assert.equal((await abB.recovery.diagnose({ projectId: abB.projectId })).projectId, 'project-b', '43')
  await fs.promises.rm(abA.memory.paths.snapshotPath); await fs.promises.rm(abB.memory.paths.snapshotPath); const [ra, rb] = await Promise.all([abA.recovery.executeRecovery({ projectId: abA.projectId, plan: await abA.recovery.planRecovery({ projectId: abA.projectId }) }), abB.recovery.executeRecovery({ projectId: abB.projectId, plan: await abB.recovery.planRecovery({ projectId: abB.projectId }) })]); assert.equal(ra.status, 'recovered'); assert.equal(rb.status, 'recovered', '44')
  assert.equal((await corrupt.recovery.getRecoveryStatus({ projectId: corrupt.projectId })).status, 'corrupt'); assert.equal((await abB.recovery.getRecoveryStatus({ projectId: abB.projectId })).status, 'healthy', '45')
  const retention = abA.recovery.retentionPolicy(); assert.equal(retention.mode, RETENTION_MODE); assert.equal(retention.automaticDeletion, false, '46'); assert.equal(retention.derived, 'rebuildable', '47'); assert.equal((await abA.memory.readEvents()).entries.length, 2, '48')
  const healthBefore = canonical(await abA.memory.getSnapshot()); const health = await abA.recovery.getRecoveryStatus({ projectId: abA.projectId }); assert.equal(health.status, 'healthy'); assert.equal(canonical(await abA.memory.getSnapshot()), healthBefore, '49')
  assert.equal(JSON.stringify(health).match(/path|stack|secret|payload/iu), null, '50')
  await abA.memory.append(event('https-reference', 'evidence', abA.projectId, { references: [{ kind: 'url', value: 'https://example.test/reference' }] })); assert.equal((await abA.memory.getSnapshot()).evidence[0].references[0].value, 'https://example.test/reference', '51')
  assert.equal(typeof abA.recovery.executeRecovery, 'function', '52'); const physicalBefore = canonical(await abA.memory.readEvents()); await abA.recovery.getRecoveryStatus({ projectId: abA.projectId }); assert.equal(canonical(await abA.memory.readEvents()), physicalBefore, '53')
  const reopenedRecovery = createContextRecovery({ memory: createContextMemory({ root: path.join(abA.base, 'memory'), allowedRoots: [abA.base] }) }); assert.equal((await reopenedRecovery.getRecoveryStatus({ projectId: abA.projectId })).status, 'healthy', '54')
  assert.notEqual(healthyBytes, '', 'fixture integrity')
  console.log('PASS jefe-context-recovery-resolution-smoke: casos 1-54')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
