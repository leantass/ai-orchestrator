import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { assertContentQuality } = require('../electron/jefe-generator-quality.cjs')
const { createSemanticRuntimeAdapter } = require('../electron/jefe-semantic-runtime-adapter.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-content-quality-forensics-'))
const projectId = 'content-quality-forensics'
const service = { registerAttempt: async () => ({ attemptId: 'never' }), promoteSemanticCorrectionAttempt: async () => ({ versionId: 'never' }) }
const invalidPlanning = { content: { businessUnderstanding: { businessType: 'servicios profesionales' }, services: [{ title: 'Servicio A', description: 'Descripción repetida de servicios profesionales.' }, { title: 'Servicio B', description: 'Descripción repetida de servicios profesionales.' }], faq: [], trustItems: [] } }
try {
  let qualityError
  try { assertContentQuality(invalidPlanning) } catch (error) { qualityError = error }
  assert.equal(qualityError?.code, 'GENERATED_CONTENT_QUALITY_FAILED')
  qualityError.details = { qualityReport: { overallStatus: 'NEEDS_CORRECTION', overallContentStatus: 'NEEDS_CORRECTION', eligibleForPromotion: false, activeSectionIds: ['inicio'], activeContentRefs: ['hero'], requiredContentRefs: ['hero'], omittedOptionalContentRefs: [], browserChecks: { hero: true }, findings: [{ category: 'serviceDifferentiation', selector: '.benefit-card:nth-child(1)', expected: 'different', actual: 'duplicate' }], semanticPreGate: { status: 'PASS', findingCount: 0 }, semanticPlanFidelity: { status: 'PASS', findingCount: 0 }, artifactIndependence: { status: 'PASS', findingCount: 0 }, visualQuality: { status: 'PASS', findingCount: 0 }, contentQuality: { status: 'NEEDS_CORRECTION', findingCount: 3 }, experienceQuality: { status: 'PASS', findingCount: 0 }, browserQuality: { status: 'PASS', findingCount: 0 } } }
  const adapter = createSemanticRuntimeAdapter({ root, timeoutMs: 1000, service, resolveExecution: async () => { throw qualityError } })
  const result = await adapter.requestSemanticCorrection({ projectId, sourceVersionId: 'version-v0001' })
  const journal = JSON.parse(await fs.readFile(path.join(root, '.jefe-semantic-runs', projectId, `${result.runId}.json`), 'utf8'))
  assert.equal(journal.failureCategory, 'QUALITY_FAILURE')
  assert.equal(journal.qualityDetails.overallContentStatus, 'NEEDS_CORRECTION')
  assert.equal(journal.qualityDetails.findings[0].category, 'serviceDifferentiation')
  assert.equal(journal.qualityDetails.findings[0].selector, '.benefit-card:nth-child(1)')
  assert.equal(journal.qualityDetails.gates.contentQuality.status, 'NEEDS_CORRECTION')
  assert.deepEqual(journal.qualityDetails.activeContentRefs, ['hero'])
  assert.equal(journal.qualityDetails.browserChecks.hero, true)
  assert.equal(JSON.stringify(journal).includes('sk-live'), false)
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-semantic-content-quality-forensics', qualityFailureCode: qualityError.code, findingCount: journal.qualityDetails.findings.length, ProviderCalls: 0 }))
} finally { await fs.rm(root, { recursive: true, force: true }) }
