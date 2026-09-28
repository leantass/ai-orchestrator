import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import observation from '../electron/jefe-observability-contract.cjs'
import persistenceModule from '../electron/jefe-observability-persistence.cjs'
import orchestrationModule from '../electron/jefe-observability-orchestrator.cjs'
import sourceModule from '../electron/jefe-observability-source-adapters.cjs'
import runtimeModule from '../electron/jefe-observability-runtime.cjs'
import recoveryModule from '../electron/jefe-observability-recovery.cjs'

const root = path.resolve('.codex-temp', 'escalon-9d')
const now = '2026-09-28T22:00:00.000Z'
await fs.rm(root, { recursive: true, force: true }); await fs.mkdir(root, { recursive: true })
let records = [{ id: 'record-a', projectId: 'project-a', sequence: 1, type: 'project.created', occurredAt: now }]
const adapter = sourceModule.createSourceAdapter({ sourceId: 'project-lifecycle', sourceKind: 'project-lifecycle', scan: async () => records, toObservationEvents: (record) => [sourceModule.trustedEvent({ eventType: 'project.created', record, sourceId: 'project-lifecycle', subject: { projectId: record.projectId }, evidenceRefs: [`source:${record.id}`] })] })
const persistence = persistenceModule.createObservabilityPersistence({ root, clock: () => now })
const orchestrator = orchestrationModule.createObservabilityOrchestrator({ persistence, clock: () => now })
const runtime = runtimeModule.createObservabilityRuntime({ persistence, orchestrator, adapters: [adapter], clock: () => now })
const recovery = recoveryModule.createObservabilityRecovery({ persistence, runtime, orchestrator, adapters: [adapter], clock: () => now })
await runtime.syncAll(); await persistence.rebuildIndex()
const healthy = await recovery.diagnose(); assert.equal(healthy.status, 'healthy'); assert.equal(recovery.derivePlan(healthy).actions.length, 0)
await fs.rm(path.join(persistence.authorityRoot, 'checkpoints', 'project-lifecycle.json')); const missing = await recovery.diagnose(); assert.ok(missing.issues.some((item) => item.code === 'CHECKPOINT_MISSING')); const missingPlan = recovery.derivePlan(missing); const firstApply = await recovery.applyPlan(missingPlan); assert.equal(firstApply.event.eventType, 'observability.recovery.completed'); const secondApply = await recovery.applyPlan(missingPlan); assert.equal(secondApply.idempotent, true); assert.equal((await persistence.listEvents()).records.length, 2)
await fs.writeFile(path.join(persistence.authorityRoot, 'checkpoints', 'project-lifecycle.json'), '{bad json')
const corrupt = await recovery.diagnose(); assert.ok(corrupt.issues.some((item) => item.code === 'CHECKPOINT_CORRUPT')); await recovery.applyPlan(recovery.derivePlan(corrupt)); assert.ok(await runtime.readCheckpoint('project-lifecycle')); assert.ok(await fs.readFile(path.join(persistence.authorityRoot, 'checkpoints', 'project-lifecycle.corrupt.json'), 'utf8'))
records = [{ ...records[0], type: 'project.changed' }]; await runtime.syncSource('project-lifecycle'); const mutated = await recovery.diagnose(); assert.ok(mutated.issues.some((item) => item.code === 'SOURCE_RECORD_MUTATED')); assert.ok((await persistence.listEvents()).records.some((event) => event.eventType === 'observability.source_record_mutated'))
await fs.rm(path.join(persistence.authorityRoot, 'indices', 'index.json')); const indexIssue = await recovery.diagnose(); assert.ok(indexIssue.issues.some((item) => item.code === 'INDEX_MISSING')); await recovery.applyPlan(recovery.derivePlan(indexIssue)); assert.ok(await persistence.readIndex())
const restartedPersistence = persistenceModule.createObservabilityPersistence({ root, clock: () => now }); const restartedOrchestrator = orchestrationModule.createObservabilityOrchestrator({ persistence: restartedPersistence, clock: () => now }); const restartedRuntime = runtimeModule.createObservabilityRuntime({ persistence: restartedPersistence, orchestrator: restartedOrchestrator, adapters: [adapter], clock: () => now }); const restartedRecovery = recoveryModule.createObservabilityRecovery({ persistence: restartedPersistence, runtime: restartedRuntime, orchestrator: restartedOrchestrator, adapters: [adapter], clock: () => now }); const restartedState = await restartedRecovery.diagnose(); assert.ok(restartedState.issues.some((item) => item.code === 'SOURCE_RECORD_MUTATED')); assert.equal((await restartedPersistence.listEvents()).records.length, 5)
const sanitized = observation.sanitize({ error: 'token=secret C:\\private\\file.txt' }); assert.equal(sanitized.error.includes('secret'), false); assert.equal(sanitized.error.includes('[path-redacted]'), true)
console.log('PASS jefe-observability-recovery-smoke: pure diagnosis, deterministic plans, checkpoint recovery, idempotent apply, mutation blocking, index rebuild, restart, isolation and sanitization')
