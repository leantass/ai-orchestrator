import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createFirstVersionFromRun } from '../electron/jefe-project-creation.cjs'
import { createProjectPersistence } from '../electron/jefe-project-persistence.cjs'
import { createProjectLifecycle } from '../electron/jefe-project-lifecycle.cjs'
import { createContextIntegration } from '../electron/jefe-context-integration.cjs'
import { createCommercialControlCenter } from '../electron/jefe-commercial-control-center.cjs'

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-control-center-'))
const persistence = createProjectPersistence({ root }); const lifecycle = createProjectLifecycle({ root, persistence }); const context = createContextIntegration({ root, persistence, lifecycle })
async function create(projectId, name) { const result = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId, runId: `${projectId}-run`, versionId: `${projectId}-version`, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: name, brief: `Brief de ${name}`, objective: 'Objetivo claro', businessType: 'servicio', audience: 'equipos', proposition: 'Propuesta', primaryCta: 'Conversar', brandSpec: { name } }); assert.equal(result.ok, true); await persistence.registerManifest(result.artifacts.manifestPath); await lifecycle.ensureCreated(result.project); return result }
await create('project-a', 'Proyecto A'); await create('project-b', 'Proyecto B'); await lifecycle.approval('project-a', 'project-a-version', true, 'Revisado'); await lifecycle.approval('project-b', 'project-b-version', false, 'Cambios solicitados'); await context.reconcile('project-a'); await context.reconcile('project-b')
const center = createCommercialControlCenter({ persistence, lifecycle, context }); const global = await center.global(); const a = await center.project('project-a'); const b = await center.project('project-b')
assert.equal(global.schemaVersion, 'jefe-commercial-control-center/v1'); assert.equal(global.system.buildReady.state, 'available'); assert.equal(global.projectsSummary.totalProjects, 2); assert.equal(a.review.state, 'approved'); assert.equal(b.review.state, 'rejected'); assert.equal(b.correctionRequired, true); assert.equal(a.project.projectId, 'project-a'); assert.equal(b.project.projectId, 'project-b'); assert.notEqual(a.fingerprint, b.fingerprint); await assert.rejects(() => center.project('../project-a'), /projectId/)
assert.equal(a.release.state, 'not_started'); assert.equal(b.release.state, 'not_started'); assert.equal(a.release.availability, 'unavailable'); assert.equal(b.release.availability, 'unavailable')
const observedCenter = createCommercialControlCenter({ persistence, lifecycle, observability: { getOperationalState: async () => ({ health: { health: { status: 'healthy' }, readiness: { status: 'blocked' }, quality: { status: 'failing' }, productionReady: false, limitations: { historicalLintErrors: 306 } }, summary: { openIncidents: 0 }, incidents: [], sourceStatuses: [] }) } }); const observedGlobal = await observedCenter.global(); assert.equal(observedGlobal.limitations.historicalLintErrors, 306); assert.equal(observedGlobal.system.productionReady, false)
console.log('PASS jefe-commercial-control-center-smoke: global/project read models, source binding, review states, correction, isolation and invalid identity')
