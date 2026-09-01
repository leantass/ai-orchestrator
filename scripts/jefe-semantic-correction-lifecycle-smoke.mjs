import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const bridge = require('../electron/jefe-semantic-correction-lifecycle.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-correction-'))
const generatorScope = 'TEST/FIXTURE ONLY'
assert.equal(generatorScope, 'TEST/FIXTURE ONLY')
const sourceRoot = path.join(root, 'fixture-project', 'version-v0001'); const candidateRoot = path.join(root, 'candidate'); const destinationRoot = root
await fs.mkdir(path.join(sourceRoot, 'app'), { recursive: true }); await fs.writeFile(path.join(sourceRoot, 'app', 'index.html'), '<!doctype html><title>source</title>', 'utf8'); const sourceHash = bridge.hash('source-snapshot')
const plans = { correctionPlan: { schemaVersion: 'correction-plan-v1', problems: ['clarity'], goals: ['improve clarity'] }, businessUnderstanding: { schemaVersion: 'business-understanding-v2', audience: 'learners' }, contentPlan: { schemaVersion: 'content-plan-v2', sections: ['relato', 'servicios', 'confianza', 'faq', 'contacto'] }, experiencePlan: { schemaVersion: 'experience-plan-v2', fingerprint: 'fixture-fingerprint' } }
const spec = bridge.buildSemanticGenerationSpec({ contentPlan: plans.contentPlan, experiencePlan: plans.experiencePlan, creativeDirection: 'editorial', preservedQualities: ['responsive'], prohibitedChanges: ['no_source_mutation'] })
const pkg = bridge.buildExecutionPackage({ ...plans, generationSpec: spec, semanticGates: 'PASS', provenance: { provider: 'fixture', schemaVersion: 'fixture-v1' }, humanFeedbackRef: 'fixture-human-feedback:rejection-1', sourceProjectId: 'fixture-project', sourceVersionId: 'version-v0001', sourceSnapshotSha256: sourceHash, correctionId: 'correction-fixture-1' })
const lifecycle = bridge.createSemanticCorrectionLifecycle({ root, candidateGenerator: async ({ candidateRoot: target }) => { await fs.mkdir(path.join(target, 'app'), { recursive: true }); await fs.writeFile(path.join(target, 'app', 'index.html'), '<!doctype html><title>candidate</title>', 'utf8'); return { ok: true, manifestSha256: bridge.hash('candidate-manifest'), quality: { semantic: 'PASS', visual: 'PASS', content: 'PASS', experience: 'PASS' } } } })
await lifecycle.persistPackage(pkg); const attempt = await lifecycle.generateCandidate(pkg, { sourceRoot, candidateRoot }); assert.equal(attempt.status, 'candidate_ready'); const promoted = await lifecycle.promoteCandidate(pkg, { candidateRoot, destinationRoot, newVersionId: 'version-v0002' }); assert.equal(promoted.ok, true); assert.equal(promoted.lineage.newVersionId, 'version-v0002'); assert.equal(await fs.readFile(path.join(sourceRoot, 'app', 'index.html'), 'utf8'), '<!doctype html><title>source</title>'); const second = await lifecycle.promoteCandidate(pkg, { candidateRoot, destinationRoot, newVersionId: 'version-v0002' }); assert.equal(second.idempotent, true)
await assert.rejects(() => lifecycle.generateCandidate({ ...pkg, execution: { ...pkg.execution, sourceVersionImmutable: false } }, { sourceRoot, candidateRoot: path.join(root, 'bad') }), { code: 'SOURCE_VERSION_MUTATION_FORBIDDEN' })
await assert.rejects(() => lifecycle.generateCandidate({ ...pkg, qualityPrerequisites: { semanticGates: 'FAIL' } }, { sourceRoot, candidateRoot: path.join(root, 'bad2') }), { code: 'SEMANTIC_GATE_FAILED' })
await fs.rm(root, { recursive: true, force: true }); console.log('PASS jefe-semantic-correction-lifecycle-smoke: package, candidate, source immutable, lineage, idempotent promotion, semantic gate and mutation negatives')
