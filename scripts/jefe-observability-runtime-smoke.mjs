import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import observation from '../electron/jefe-observability-contract.cjs'
import persistenceModule from '../electron/jefe-observability-persistence.cjs'
import orchestrationModule from '../electron/jefe-observability-orchestrator.cjs'
import sourceModule from '../electron/jefe-observability-source-adapters.cjs'
import runtimeModule from '../electron/jefe-observability-runtime.cjs'

const root = path.resolve('.codex-temp', 'escalon-9c-runtime-smoke')
const now = '2026-09-28T20:00:00.000Z'
const later = '2026-09-28T20:01:00.000Z'
await fs.rm(root, { recursive: true, force: true }); await fs.mkdir(root, { recursive: true })
let sourceRecords = [{ id: 'project-a-created', projectId: 'project-a', sequence: 1, type: 'project.created', occurredAt: now }, { id: 'project-b-created', projectId: 'project-b', sequence: 2, type: 'project.created', occurredAt: now }]
const adapter = sourceModule.createSourceAdapter({ sourceId: 'project-lifecycle', sourceKind: 'project-lifecycle', scan: async () => sourceRecords, recordId: (record) => record.id, toObservationEvents: (record) => [sourceModule.trustedEvent({ eventType: 'project.created', record, sourceId: 'project-lifecycle', subject: { projectId: record.projectId }, evidenceRefs: [`project:${record.projectId}:${record.id}`] })] })
const unavailable = sourceModule.createUnavailableSourceAdapter({ sourceId: 'memory', sourceKind: 'memory', reason: 'MEMORIA is not connected.' })
const persistence = persistenceModule.createObservabilityPersistence({ root, clock: () => now })
const orchestrator = orchestrationModule.createObservabilityOrchestrator({ persistence, clock: () => now })
const runtime = runtimeModule.createObservabilityRuntime({ persistence, orchestrator, adapters: [adapter, unavailable], releaseHealth: { healthyFlows: 1, staleFlows: 0, blockedFlows: 1, uncertainExecutions: 0, corruptions: 0, pendingOutbox: 0, failedCi: 1, lastRecoveryAt: now }, clock: () => now })
let first = await runtime.syncAll(); assert.equal(first.results.find((item) => item.sourceId === 'project-lifecycle').status.status, 'available'); assert.equal(first.results.find((item) => item.sourceId === 'memory').status.status, 'unavailable'); assert.equal(first.health.health.status, 'degraded'); assert.equal(first.health.quality.status, 'failing'); assert.equal(first.health.readiness.status, 'blocked'); assert.equal(first.health.productionReady, false)
const firstEvents = (await persistence.listEvents()).records; assert.equal(firstEvents.length, 2); assert.equal((await runtime.syncAll()).results.find((item) => item.sourceId === 'project-lifecycle').recordsIngested, 0); assert.equal((await persistence.listEvents()).records.length, 2)
await fs.rm(path.join(persistence.authorityRoot, 'checkpoints', 'project-lifecycle.json'), { force: true }); await runtime.syncSource('project-lifecycle'); assert.equal((await persistence.listEvents()).records.length, 2)
sourceRecords = [{ ...sourceRecords[0], type: 'project.changed' }, sourceRecords[1]]; const mutated = await runtime.syncSource('project-lifecycle'); assert.equal(mutated.status.status, 'degraded'); const afterMutation = await runtime.getOperationalState({ projectId: 'project-a' }); assert.equal(afterMutation.incidents.some((item) => item.category === 'corrupt_record'), false)
const sourceEvent = observation.createObservationEvent({ eventType: 'observability.source_record_mutated', occurredAt: later, source: { kind: 'jefe', sourceId: 'project-lifecycle' }, severity: 'critical', outcome: 'failed', correlationId: 'project-lifecycle', evidenceRefs: ['source-record:project-lifecycle:project-a-created'], subject: { projectId: 'project-a' }, attributes: { sourceMutation: true } }); await orchestrator.recordEvent(sourceEvent); await orchestrator.deriveAndPersistIncidents(); assert.equal((await runtime.getOperationalState({ projectId: 'project-a' })).incidents.some((item) => item.category === 'corrupt_record'), true)
const restartedPersistence = persistenceModule.createObservabilityPersistence({ root, clock: () => now }); const restartedOrchestrator = orchestrationModule.createObservabilityOrchestrator({ persistence: restartedPersistence, clock: () => now }); const restartedRuntime = runtimeModule.createObservabilityRuntime({ persistence: restartedPersistence, orchestrator: restartedOrchestrator, adapters: [adapter, unavailable], releaseHealth: { healthyFlows: 1, staleFlows: 0, blockedFlows: 1, uncertainExecutions: 0, corruptions: 0, pendingOutbox: 0, failedCi: 1, lastRecoveryAt: now }, clock: () => now }); const state = await restartedRuntime.getOperationalState({ projectId: 'project-b' }); assert.equal(state.timeline.records.every((item) => item.subject.projectId === 'project-b'), true); assert.equal(state.health.quality.status, 'failing')
console.log('PASS jefe-observability-runtime-smoke: trusted source adapters, checkpoints/backfill, incremental replay, mutation detection, partial source availability, project isolation, incident derivation, health/readiness/quality and restart')
