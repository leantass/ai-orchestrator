import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createCommercialE2EOrchestrator } from '../electron/jefe-e2e-orchestrator.cjs'
import { createProjectPersistence } from '../electron/jefe-project-persistence.cjs'
import { createProjectLifecycle } from '../electron/jefe-project-lifecycle.cjs'
import { routeCommercialRequest } from '../electron/jefe-e2e-routing-policy.cjs'

const root = path.resolve('.codex-temp/escalon-11b')
await fs.rm(root, { recursive: true, force: true })
await fs.mkdir(root, { recursive: true })
const input = (projectId, suffix = '') => ({ projectId, runId: `run-${projectId}`, versionId: `version-${projectId}`, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: `11B ${projectId}`, brief: `Sufficient first-party brief ${suffix}`, objective: 'Create a durable commercial artifact.', businessType: 'service', audience: 'operators', proposition: 'Clear evidence', primaryCta: 'Review', brandSpec: { name: `11B ${projectId}` }, inputAssets: { files: [], urlReferences: [] } })
const persistence = createProjectPersistence({ root })
const lifecycle = createProjectLifecycle({ root, persistence })
const orchestrator = createCommercialE2EOrchestrator({ root, persistence, lifecycle })

const simple = await orchestrator.createInitialProject(input('flow-a'))
assert.equal(simple.ok, true); assert.equal(simple.flow.stages.context.status, 'completed'); assert.equal(simple.flow.stages.discovery.status, 'completed'); assert.equal(simple.flow.stages.research.status, 'skipped_by_policy'); assert.equal(simple.flow.stages.evidence.status, 'skipped_by_policy'); assert.equal(simple.flow.stages.planning.status, 'completed'); assert.equal(simple.flow.stages.execution.status, 'completed'); assert.equal(simple.flow.stages.qa.status, 'completed'); assert.equal(simple.flow.stages.preview.status, 'completed'); assert.equal(simple.flow.stages.human_gate.status, 'waiting'); assert.equal(simple.flow.stages.delivery.status, 'waiting'); assert.equal(simple.flow.stages.release.status, 'waiting'); assert.ok(simple.flow.refs.intakeId); assert.ok(simple.flow.refs.executionReceiptId); assert.ok(simple.flow.refs.qaEvidenceId); assert.ok(simple.flow.refs.previewRequestId)
const replay = await orchestrator.createInitialProject(input('flow-a')); assert.equal(replay.idempotent, true); assert.equal(replay.flow.e2eFlowId, simple.flow.e2eFlowId)
await assert.rejects(() => orchestrator.createInitialProject({ ...input('flow-a'), brief: 'different content' }), { code: 'FLOW_COLLISION' })
const concurrent = await Promise.all([orchestrator.createInitialProject(input('flow-b')), orchestrator.createInitialProject(input('flow-b'))]); assert.equal(new Set(concurrent.map((item) => item.flow.e2eFlowId)).size, 1); assert.ok(concurrent.filter((item) => item.idempotent).length >= 1)
const failed = await orchestrator.createInitialProject({ ...input('flow-fail'), testFailureInjection: 'qa' }); assert.equal(failed.status, 'blocked'); assert.equal(failed.flow.stages.qa.status, 'failed'); assert.equal(failed.flow.stages.preview.status, 'blocked'); assert.equal(failed.flow.stages.human_gate.status, 'blocked')
const researchRoot = path.join(root, 'research-required'); await fs.mkdir(researchRoot, { recursive: true }); const researchPersistence = createProjectPersistence({ root: researchRoot }); const researchLifecycle = createProjectLifecycle({ root: researchRoot, persistence: researchPersistence }); const researchOrchestrator = createCommercialE2EOrchestrator({ root: researchRoot, persistence: researchPersistence, lifecycle: researchLifecycle, requireResearch: true }); const research = await researchOrchestrator.createInitialProject(input('research-flow')); assert.equal(research.ok, false); assert.equal(research.flow.stages.research.status, 'blocked'); assert.equal(research.flow.stages.evidence.status, 'blocked'); assert.equal(research.flow.stages.execution.status, 'not_started')
const isolated = await orchestrator.createInitialProject(input('flow-c')); assert.notEqual(isolated.flow.e2eFlowId, simple.flow.e2eFlowId); assert.equal((await orchestrator.health('flow-a')).flows.length, 1)
const route = routeCommercialRequest(input('route-flow')); assert.equal(route.routes.research.mode, 'none'); assert.equal(route.routes.research.reasonCode, 'FIRST_PARTY_INPUT_SUFFICIENT'); await orchestrator.persistence.saveRouting(route); await assert.rejects(() => orchestrator.persistence.saveRouting({ ...route, routes: { ...route.routes, research: { ...route.routes.research, reasonCode: 'TAMPERED' } } }), { code: 'ROUTING_COLLISION' })
const records = await fs.readdir(path.join(root, '.jefe-e2e', 'flows')); assert.equal(records.filter((name) => name.endsWith('.json')).length, 4); console.log('PASS jefe-e2e-orchestration-smoke: durable lineage, explicit routing, real discovery, conditional research, quality gate, preview/human gate, replay, collision, concurrency and isolation')
