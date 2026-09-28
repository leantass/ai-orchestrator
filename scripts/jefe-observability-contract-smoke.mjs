import assert from 'node:assert/strict'
import observability from '../electron/jefe-observability-contract.cjs'

const fixedNow = '2026-09-28T18:00:00.000Z'
const refs = ['release-flow:historical-canary', 'ci-evidence.json']
const event = observability.createObservationEvent({ eventType: 'release.ci.evidence_ingested', occurredAt: fixedNow, source: { kind: 'github-actions', sourceId: 'run-36447463345' }, severity: 'warning', outcome: 'failed', correlationId: 'canary-correlation', evidenceRefs: refs, subject: { projectId: 'project-canary', releaseFlowId: 'release-flow-canary', requestId: 'release-request-canary' }, attributes: { token: 'supersecret', path: 'C:\\Users\\private\\repo', conclusion: 'failure' } })
assert.equal(event.schemaVersion, observability.OBSERVATION_EVENT_SCHEMA)
assert.equal(event.attributes.token, undefined)
assert.equal(event.attributes.path, '[path-redacted]')
assert.throws(() => observability.createObservationEvent({ eventType: 'fake.metric', occurredAt: fixedNow, source: { kind: 'jefe' }, correlationId: 'bad-event', evidenceRefs: refs }), /closed taxonomy/)
assert.throws(() => observability.createObservationEvent({ eventType: 'release.execution.started', occurredAt: fixedNow, source: { kind: 'untrusted' }, correlationId: 'bad-source' }), (error) => error.code === 'OBSERVABILITY_TRUSTED_SOURCE_REQUIRED')
assert.throws(() => observability.createSignal({ signalId: 'fake-count', name: 'fake count', status: 'healthy', value: 42, observedAt: fixedNow }), (error) => error.code === 'OBSERVABILITY_NO_FAKE_METRICS')
const measured = observability.createSignal({ signalId: 'lint-errors', name: 'Historical lint errors', status: 'degraded', value: 306, unit: 'errors', evidenceRefs: ['quality-ci-baseline'], observedAt: fixedNow, source: { kind: 'test-fixture' } })
const releaseHealth = { healthyFlows: 1, staleFlows: 0, blockedFlows: 1, uncertainExecutions: 0, corruptions: 0, pendingOutbox: 0, failedCi: 1, lastRecoveryAt: fixedNow }
const historicalCanary = { state: 'CONSISTENT_TERMINAL', remoteCiStatus: 'failed', historicalLintErrors: 306 }
const observer = observability.createObservability({ clock: () => fixedNow, releaseHealth: async () => releaseHealth })
const snapshot = await observer.snapshot({ historicalCanary, signals: [measured], evidenceRefs: refs })
assert.equal(snapshot.health.status, 'healthy')
assert.equal(snapshot.health.operational, true)
assert.equal(snapshot.readiness.status, 'blocked')
assert.equal(snapshot.quality.status, 'failing')
assert.equal(snapshot.productionReady, false)
assert.equal(snapshot.signals[0].value, 306)
const incidents = observer.deriveIncidents({ events: [event, event, observability.createObservationEvent({ eventType: 'human.approval.recorded', occurredAt: fixedNow, source: { kind: 'operator', sourceId: 'operator-1' }, correlationId: 'approval-correlation', outcome: 'succeeded', evidenceRefs: ['approval.json'] })], healthSnapshot: snapshot })
assert.equal(incidents.filter((item) => item.category === 'ci_failed').length, 1)
assert.equal(incidents.some((item) => item.category === 'observation_gap'), false)
const summary = observer.summarizeOperation({ observedAt: fixedNow, healthSnapshot: snapshot, incidents, evidenceRefs: refs })
assert.equal(summary.health, 'healthy')
assert.equal(summary.readiness, 'blocked')
assert.equal(summary.quality, 'failing')
assert.equal(summary.openIncidents, 1)
const unknown = observability.buildHealthSnapshot({ observedAt: fixedNow })
assert.equal(unknown.health.status, 'unknown')
assert.equal(unknown.readiness.status, 'unknown')
assert.equal(unknown.quality.status, 'unknown')
assert.equal(unknown.productionReady, false)
const resolved = observability.createOperationalIncident({ category: 'ci_failed', severity: 'warning', status: 'resolved', firstSeen: fixedNow, correlationId: 'resolve-correlation', evidenceRefs: refs, summary: 'Resolved after verified rerun.' })
assert.equal(resolved.status, 'resolved')
console.log('PASS jefe-observability-contract-smoke: event taxonomy, correlation/causation, trusted evidence, sanitization, health/readiness/quality separation, unknown defaults, signals, incidents, deduplication, resolution, operation summary and historical canary')
