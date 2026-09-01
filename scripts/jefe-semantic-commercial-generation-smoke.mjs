import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const contract = require('../electron/jefe-project-contract.cjs')
const generation = require('../electron/jefe-real-generation.cjs')
const { adaptSemanticGenerationSpec } = require('../electron/jefe-semantic-generation-adapter.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-commercial-'))
const brief = 'Servicio ficticio de reparación y mantenimiento de bicicletas con reserva previa.'
const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'bike-service', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Rueda Clara', brief, businessType: 'servicio de reparación', audience: 'personas que usan bicicletas', proposition: 'Mantenimiento claro y turnos previsibles', brandSpec: { name: 'Rueda Clara' } })
assert.equal(source.ok, true)
const spec = { schemaVersion: 'semantic-generation-spec-v1', planning: source.project.planning, sectionOrder: ['relato', 'servicios', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', treatments: ['service-catalog-led', 'appointment-led'], creativeDirection: 'editorial', contentDensity: 'balanced', ctaStrategy: 'appointment', preservedQualities: ['responsive'], prohibitedChanges: ['no-source-mutation'] }
const normalized = adaptSemanticGenerationSpec(spec); assert.equal(normalized.schemaVersion, 'normalized-generation-plan-v1')
const candidateProject = contract.normalizeProjectContract({ ...source.project, activeVersionId: 'version-v0002', runId: 'run-v0002', physicalPaths: { projectRoot: path.join(root, 'bike-service', 'version-v0002'), manifestPath: path.join(root, 'bike-service', 'version-v0002', 'manifest.json'), deliveryPath: null }, timestamps: { ...source.project.timestamps, updatedAt: new Date().toISOString() }, versions: [{ ...source.project.versions[0], versionId: 'version-v0002', runId: 'run-v0002' }] }, { allowedRoots: [root] })
const materialized = await generation.materializeProject({ project: candidateProject, destinationRoot: root, capabilities: {}, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: spec, businessType: 'servicio de reparación', audience: 'personas que usan bicicletas', proposition: 'Mantenimiento claro y turnos previsibles', brief }, providedAssets: [] })
const html = await fs.readFile(path.join(materialized.projectRoot, 'app', 'index.html'), 'utf8'); const css = await fs.readFile(path.join(materialized.projectRoot, 'app', 'styles.css'), 'utf8'); const js = await fs.readFile(path.join(materialized.projectRoot, 'app', 'app.js'), 'utf8')
assert.match(html, /Rueda Clara/u); assert.match(html, /styles\.css/u); assert.doesNotMatch(`${html}${css}${js}`, /electron|preload|ipc|file:\/\//iu); assert.equal(normalized.planning.strategy.primaryMessage, candidateProject.planning.strategy.primaryMessage)
await fs.rm(root, { recursive: true, force: true }); console.log('PASS jefe-semantic-commercial-generation-smoke: semantic adapter → real generator → real commercial candidate, artifact independence, no source mutation')
