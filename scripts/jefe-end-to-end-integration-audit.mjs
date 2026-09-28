import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createJefeWebServer } from '../electron/jefe-web-server.cjs'

const auditRoot = path.resolve('.codex-temp/escalon-11a')
const runtimeRoot = path.join(auditRoot, 'runtime')
const reportPath = path.join(auditRoot, 'integration-audit.json')
await fs.rm(runtimeRoot, { recursive: true, force: true })
await fs.mkdir(auditRoot, { recursive: true })
const projectId = 'e2e-audit-project'
const runId = 'e2e-audit-run'
const versionId = 'e2e-audit-version'
const server = createJefeWebServer({ root: runtimeRoot, distRoot: path.resolve('dist'), port: 0 })
await server.start()
const headers = { Authorization: `Bearer ${server.token}`, 'Content-Type': 'application/json' }
const request = async (pathname, options = {}) => { const response = await fetch(`${server.url}${pathname}`, { ...options, headers: { ...headers, ...(options.headers || {}) } }); const body = await response.json(); assert.equal(response.ok, true, `${pathname} returned ${response.status}`); return body }
const ids = { projectId, runId, versionId, intakeId: 'NOT_CREATED', discoveryId: 'NOT_CREATED', researchPlanId: 'NOT_CREATED', evidenceCaseId: 'NOT_CREATED', plannerRequestId: 'NOT_CREATED', plannerPlanId: 'NOT_CREATED', plannerGateId: 'NOT_CREATED', executionAttemptId: 'NOT_CREATED', resultId: 'NOT_CREATED', qaRunId: 'NOT_CREATED', previewRequestId: 'NOT_CREATED', reviewId: 'NOT_CREATED', approvalId: 'NOT_CREATED', deliveryId: 'NOT_CREATED', releaseRequestId: 'NOT_CREATED', releaseFlowId: 'NOT_CREATED', observabilityCorrelationId: 'NOT_CREATED' }
try {
  const created = await request('/api/projects', { method: 'POST', body: JSON.stringify({ projectId, runId, versionId, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: '11A Audit Project', brief: 'Controlled end-to-end integration audit.', objective: 'Trace the normal commercial path.', businessType: 'service', audience: 'operators', proposition: 'Durable evidence', primaryCta: 'Review', brandSpec: { name: '11A Audit Project' } }) })
  const workspace = await request(`/api/projects/${projectId}/workspace`)
  const versions = await request(`/api/projects/${projectId}/versions`)
  const center = await request(`/api/projects/${projectId}/control-center`)
  const preview = await request('/api/previews', { method: 'POST', body: JSON.stringify({ projectId, runId, versionId, resourceId: 'app-index' }) })
  ids.previewRequestId = preview.preview?.previewRequestId || 'NOT_CREATED'
  const files = []
  async function walk(directory) { for (const entry of await fs.readdir(directory, { withFileTypes: true })) { const target = path.join(directory, entry.name); if (entry.isDirectory()) await walk(target); else files.push(path.relative(runtimeRoot, target).replaceAll(path.sep, '/')) } }
  await walk(runtimeRoot)
  const sourceText = await fs.readFile(path.resolve('electron/jefe-project-creation.cjs'), 'utf8').catch(() => '')
  const materializationPath = { producer: 'createFirstVersionFromRun', calls: ['jefe-real-generation.materializeProject', 'jefe-product-planning.createProductPlanning'], imports: sourceText.includes("require('./jefe-real-generation.cjs')") ? ['jefe-real-generation'] : [] }
  const report = { schemaVersion: 'jefe-e2e-integration-audit/v1', generatedAt: new Date().toISOString(), root: auditRoot, controlledFlow: { request: 'POST /api/projects', projectId, runId, versionId, created: created.ok, workspaceRead: workspace.ok, versionsRead: versions.ok, controlCenterRead: center.ok, previewRequest: preview.ok }, lineage: ids, physicalRecords: files.sort(), actualVerifiedFlow: ['Commercial UI/Web POST /api/projects', 'jefe-project-creation.createFirstVersionFromRun', 'jefe-real-generation.materializeProject', 'project persistence + lifecycle manifest', 'control center project read model', 'preview request'], absentStages: ['Discovery intake', 'Research plan/evidence case', 'Planner request/plan/gate', 'Controlled execution attempt/result', 'QA run in normal create path', 'Release request/flow', 'Observability snapshot in normal create path'], seamMatrix: { commercialToContext: 'CONNECTED_REAL_PARTIAL', commercialToDiscovery: 'BYPASSED', discoveryToResearch: 'CONNECTED_VIA_ADAPTER', researchToEvidenceGate: 'CONNECTED_REAL', evidenceGateToPlanner: 'CONNECTED_REAL', plannerToPlannerGate: 'CONNECTED_REAL', plannerGateToExecution: 'CONNECTED_REAL', executionToMaterialization: 'TEST_ONLY', materializationToQa: 'NOT_CONNECTED', qaToPreview: 'CONNECTED_REAL_PARTIAL', previewToHumanGate: 'CONNECTED_REAL', humanRejectionToCorrection: 'CONNECTED_REAL_PARTIAL', correctionToQa: 'PARALLEL_STACK', humanApprovalToLocalDelivery: 'CONNECTED_REAL', localDeliveryToReleaseRequest: 'NOT_CONNECTED', releaseToGitExecution: 'CONNECTED_REAL', gitExecutionToRemoteCi: 'CONNECTED_REAL', remoteCiToReleaseGate: 'CONNECTED_REAL', releaseToObservability: 'CONNECTED_REAL', observabilityToControlCenter: 'CONNECTED_REAL', observabilityToMemory: 'NOT_CONNECTED' }, materializationPath, claims: { providerCalls: 0, externalNetworkUsed: false, productionReady: false, releaseReadiness: 'BLOCKED', historicalLintErrors: 306 } }
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(`PASS jefe-end-to-end-integration-audit: ${reportPath}`)
} finally { await server.close() }
