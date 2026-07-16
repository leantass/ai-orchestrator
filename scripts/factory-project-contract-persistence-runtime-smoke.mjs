import assert from 'node:assert/strict'
import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createFactoryBriefDraftV1 } from '../src/factory/brief-draft/index.ts'
import { evaluateFactoryProjectContractApproval } from '../src/factory/project-contract-approval/index.ts'
import { createFactoryProjectContractCandidateV1 } from '../src/factory/project-contract-candidate/index.ts'
import { evaluateFactoryProjectContractCompatibility } from '../src/factory/project-contract-compatibility/index.ts'
import { createFactoryProjectContractPersistencePlan, stableStringifyFactoryContractPayload } from '../src/factory/project-contract-persistence/index.ts'
import { parseFactoryProjectContractPersistenceRuntimeResult, serializeFactoryProjectContractPersistenceRuntimeResult, summarizeFactoryProjectContractPersistenceRuntimeResult, validateFactoryProjectContractPersistenceRuntimeInput, validateFactoryProjectContractPersistenceRuntimeResult } from '../src/factory/project-contract-persistence-runtime/index.ts'

const require = createRequire(import.meta.url)
const { executeFactoryProjectContractPersistence, isSafeRelativeFactoryPersistencePath } = require('../electron/factory/project-contract-persistence-runtime/index.cjs')

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storageRoot = path.join(repoRoot, '.codex-temp', 'factory-project-contract-persistence-runtime-v1', 'smoke')
assert.ok(storageRoot.startsWith(path.join(repoRoot, '.codex-temp') + path.sep)); await rm(storageRoot, { recursive: true, force: true })
const at = '2026-07-16T12:00:00.000Z'
const signal = { opportunityId: 'opportunity-1', title: 'Workflow assistant', problem: 'Teams repeat costly work.', audience: 'Small teams', proposedSolution: 'Independent workflow app.', monetizationHypothesis: 'Subscription.', evidenceSummary: { radarEvidenceSufficient: true, hermesReportPresent: true, hermesReportStatus: 'completed', evidenceItems: 4, distinctSources: 3, confidence: 0.9, requiredCoverage: ['demand'], satisfiedCoverage: ['demand'], missingCoverage: [], contradictions: 0 }, risks: [], assumptions: [], openQuestions: [], requiredAcceptanceCriteriaDraft: ['Complete core workflow.', 'Remain independent from JEFE.'], nextStep: 'draft_factory_brief' }
const brief = createFactoryBriefDraftV1({ signal, decisionId: 'decision-1', createdAt: at, createdBy: 'JEFE', sourceContext: { radarScore: 82, hermesConfidence: 0.9, evidenceRefs: ['e1'] } })
const candidate = createFactoryProjectContractCandidateV1({ draft: brief, createdAt: at, createdBy: 'JEFE', humanReviewRef: 'human-review-1', repositoryOwner: 'factory-owner' })
const compatibilityResult = evaluateFactoryProjectContractCompatibility({ candidate, createdAt: at, checkedBy: 'JEFE', humanApprovalRef: 'human-review-1' })
const approvalResult = evaluateFactoryProjectContractApproval({ compatibilityResult, createdAt: at, reviewedBy: 'Lean', reviewerRole: 'human_reviewer', humanApprovalRef: 'contract-approval-1' })
const persistenceResult = createFactoryProjectContractPersistencePlan({ approvalResult, createdAt: at, plannedBy: 'JEFE' })
const input = { persistenceResult, storageRoot, executedAt: at, executedBy: 'JEFE runtime smoke' }
const result = await executeFactoryProjectContractPersistence(input)
assert.equal(result.status, 'persisted')
await access(result.targetAbsolutePath)
await access(result.metadataAbsolutePath)
const contractReadback = JSON.parse(await readFile(result.targetAbsolutePath, 'utf8')); assert.equal(stableStringifyFactoryContractPayload(contractReadback), persistenceResult.canonicalPayload.canonicalJson)
const metadata = JSON.parse(await readFile(result.metadataAbsolutePath, 'utf8')); assert.equal(metadata.fingerprint, persistenceResult.fingerprint.value); assert.equal(metadata.idempotencyKey, persistenceResult.idempotencyKey.value)
assert.equal(metadata.notExecutable, true); assert.equal(metadata.codexAllowed, false); assert.equal(metadata.projectCreated, false); assert.equal(metadata.repositoryCreated, false); assert.equal(metadata.deployed, false)
const second = await executeFactoryProjectContractPersistence(input); assert.equal(second.status, 'idempotent_noop'); assert.equal(second.writeResult.idempotent, true)
const filesAfterSecond = await readdir(path.dirname(result.targetAbsolutePath)); assert.equal(filesAfterSecond.filter((item) => item === path.basename(result.targetAbsolutePath)).length, 1)
const traversal = structuredClone(persistenceResult); traversal.target.targetPath = '../escape.json'; assert.ok(['blocked', 'failed'].includes((await executeFactoryProjectContractPersistence({ ...input, persistenceResult: traversal })).status))
assert.equal(isSafeRelativeFactoryPersistencePath('../escape.json'), false)
const absolute = structuredClone(persistenceResult); absolute.target.targetPath = path.join(path.parse(storageRoot).root, 'escape.json'); assert.ok(['blocked', 'failed'].includes((await executeFactoryProjectContractPersistence({ ...input, persistenceResult: absolute })).status))
assert.equal(validateFactoryProjectContractPersistenceRuntimeInput({ ...input, storageRoot: path.join(repoRoot, 'outside') }).ok, false)
const conflictingMetadata = { ...metadata, fingerprint: 'different' }; await writeFile(result.metadataAbsolutePath, JSON.stringify(conflictingMetadata)); const conflict = await executeFactoryProjectContractPersistence(input); assert.equal(conflict.status, 'blocked'); await writeFile(result.metadataAbsolutePath, JSON.stringify(metadata))
const failurePlan = structuredClone(persistenceResult); failurePlan.target.targetPath = 'failure/contract.json'; failurePlan.target.metadataPath = 'failure/meta.json'; failurePlan.atomicWritePlan.targetPath = 'failure/contract.json'; failurePlan.atomicWritePlan.tempPath = 'failure/contract.tmp'; failurePlan.atomicWritePlan.backupPath = 'failure/contract.backup'; failurePlan.atomicWritePlan.lockPath = 'failure/contract.lock'; failurePlan.canonicalPayload.canonicalJson = '{invalid-json'
const failed = await executeFactoryProjectContractPersistence({ ...input, persistenceResult: failurePlan }); assert.equal(failed.status, 'failed'); await assert.rejects(access(path.join(storageRoot, 'failure', 'contract.tmp')))
assert.equal(result.canExecuteCodex, false); assert.equal(result.canCreateProject, false); assert.equal(result.canCreateRepository, false); assert.equal(result.canDeploy, false)
const parsed = parseFactoryProjectContractPersistenceRuntimeResult(serializeFactoryProjectContractPersistenceRuntimeResult(result)); assert.equal(validateFactoryProjectContractPersistenceRuntimeResult(parsed).ok, true)
const summary = summarizeFactoryProjectContractPersistenceRuntimeResult(result); assert.equal('canonicalPayload' in summary, false); assert.equal(JSON.stringify(summary).includes('environmentVariables'), false)
const allWritten = [result.targetAbsolutePath, result.metadataAbsolutePath]; assert.ok(allWritten.every((item) => item.startsWith(storageRoot + path.sep))); assert.ok(/registry|memory/iu.test(result.recommendedNextStep)); assert.equal(allWritten.some((item) => item.includes(`${path.sep}src${path.sep}`) || item.includes(`${path.sep}docs${path.sep}`)), false)

console.log(JSON.stringify({ ok: true, checks: 28, runtimeKind: result.runtimePersistenceKind, status: result.status, secondStatus: second.status, targetAbsolutePath: result.targetAbsolutePath, metadataAbsolutePath: result.metadataAbsolutePath, writtenFiles: allWritten, conflictStatus: conflict.status, rollbackSucceeded: failed.writeResult.rollbackSucceeded }, null, 2))
