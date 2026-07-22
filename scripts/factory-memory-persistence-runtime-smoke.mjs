import assert from 'node:assert/strict'
import { readdir, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFactoryMemoryAdmissionPlan } from '../src/factory/memory-admission/index.ts'
import { createFactoryMemoryPersistencePlan } from '../src/factory/memory-persistence/index.ts'
import { parseFactoryMemoryPersistenceRuntimeResult, serializeFactoryMemoryPersistenceRuntimeResult, summarizeFactoryMemoryPersistenceRuntimeResult, validateFactoryMemoryPersistenceRuntimeInput, validateFactoryMemoryPersistenceRuntimeResult } from '../src/factory/memory-persistence-runtime/index.ts'
import { evaluateFactoryMemoryWriteApproval } from '../src/factory/memory-write-approval/index.ts'
const require = createRequire(import.meta.url); const runtime = require('../electron/factory/memory-persistence-runtime/index.cjs'); const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const storageRoot = path.join(repoRoot, '.codex-temp', 'factory-memory-persistence-runtime-v1', 'smoke'); await rm(storageRoot, { recursive: true, force: true })
const at = '2026-07-17T18:00:00.000Z'; const entry = { registryEntryId: 'runtime-entry', contractProjectId: 'runtime-memory-project', projectSlug: 'runtime-memory-project', targetPath: 'factory-project-contracts/runtime-memory-project/factory-project-contract.v1.json', metadataPath: 'factory-project-contracts/runtime-memory-project/factory-project-contract.v1.meta.json', expectedFingerprint: '11112222', recalculatedFingerprint: '11112222', expectedIdempotencyKey: 'factory-contract-33334444', recalculatedIdempotencyKey: 'factory-contract-33334444', contractExists: true, metadataExists: true, metadataMatchesContract: true, fingerprintMatches: true, idempotencyMatches: true, flagsSafe: true, pathContained: true, status: 'clean', checks: [], findings: [], canUseForMemory: true, canUseForCodexTask: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false }; const integrity = { integrityKind: 'factory-contract-registry-integrity', integrityVersion: '1.0', generatedAt: at, checkedBy: 'JEFE', storageRoot: '.codex-temp/smoke', registryIndexRef: 'runtime-registry', status: 'clean', entries: [entry], summary: { totalEntries: 1, statusCounts: { clean: 1 }, severityCounts: {}, criticalFindings: 0, cleanEntries: 1, blockedEntries: 0, canUseForMemory: 1, canUseForCodexTask: 0, recommendedNextStep: 'MEMORIA review' }, findings: [], blockers: [], warnings: [], recommendedNextStep: 'MEMORIA review' }
const admission = createFactoryMemoryAdmissionPlan({ integrityReport: integrity, createdAt: at, createdBy: 'JEFE' }); const approval = evaluateFactoryMemoryWriteApproval({ admissionResult: admission, createdAt: at, reviewedBy: 'Lean', humanApprovalRef: 'runtime-human' }); const persistence = createFactoryMemoryPersistencePlan({ memoryWriteApprovalResult: approval, createdAt: at, plannedBy: 'JEFE' }); const input = { memoryPersistenceResult: persistence, storageRoot, executedAt: at, executedBy: 'memory runtime smoke' }; const first = await runtime.executeFactoryMemoryPersistenceRuntime(input); const write = first.writeResults[0]; const metadata = JSON.parse(await readFile(write.metadataAbsolutePath, 'utf8')); const index = JSON.parse(await readFile(write.indexAbsolutePath, 'utf8')); const record = JSON.parse(await readFile(write.targetAbsolutePath, 'utf8'))
assert.equal(first.status, 'persisted') // 1
assert.equal(metadata.metadataKind, 'factory-memory-record-persistence-metadata') // 2
assert.equal(index.indexKind, 'factory-project-memory-index') // 3
assert.deepEqual(record, persistence.recordPlans[0].canonicalPayload) // 4
assert.equal(metadata.fingerprint, persistence.recordPlans[0].fingerprint.value) // 5
assert.equal(metadata.idempotencyKey, persistence.recordPlans[0].idempotencyKey) // 6
assert.equal(metadata.notExecutable, true) // 7
assert.equal(metadata.embeddingsCreated, false) // 8
assert.equal(metadata.codexTaskCreated, false) // 9
assert.equal(metadata.projectCreated, false) // 10
assert.equal(metadata.repositoryCreated, false) // 11
assert.equal(metadata.deployed, false) // 12
const second = await runtime.executeFactoryMemoryPersistenceRuntime(input); assert.equal(second.status, 'idempotent_noop') // 13
assert.equal(index.count, 1) // 14
const conflictPlan = structuredClone(persistence); conflictPlan.recordPlans[0].fingerprint.value = 'different'; const conflict = await runtime.executeFactoryMemoryPersistenceRuntime({ ...input, memoryPersistenceResult: conflictPlan }); assert.equal(conflict.status, 'blocked') // 15
await assert.rejects(Promise.resolve().then(() => runtime.assertFactoryMemoryPersistenceRuntimeRootAllowed(path.join(repoRoot, 'outside')))) // 16
const unsafe = async (target) => { const changed = structuredClone(persistence); changed.recordPlans[0].target.logicalTarget = target; return runtime.executeFactoryMemoryPersistenceRuntime({ ...input, memoryPersistenceResult: changed }) }; assert.notEqual((await unsafe('/factory-memory/projects/x/a.json')).status, 'persisted') // 17
assert.notEqual((await unsafe('factory-memory/projects/x/../a.json')).status, 'persisted') // 18
assert.notEqual((await unsafe('outside/a.json')).status, 'persisted') // 19
const allFiles = async (dir) => (await readdir(dir, { recursive: true, withFileTypes: true })).filter((item) => item.isFile()).map((item) => path.join(item.parentPath ?? item.path, item.name)); assert.equal((await allFiles(storageRoot)).some((file) => file.endsWith('.tmp')), false) // 20
assert.equal(first.canCreateEmbeddings, false) // 21
assert.equal(first.canCreateCodexTask, false) // 22
assert.equal(first.canExecuteCodex, false) // 23
assert.equal(first.canCreateProject, false) // 24
assert.equal(first.canCreateRepository, false) // 25
assert.equal(first.canDeploy, false) // 26
assert.equal(parseFactoryMemoryPersistenceRuntimeResult(serializeFactoryMemoryPersistenceRuntimeResult(first)).runtimePersistenceId, first.runtimePersistenceId) // 27
const summaryText = JSON.stringify(summarizeFactoryMemoryPersistenceRuntimeResult(first)); assert.equal(summaryText.includes('canonicalPayload') || summaryText.includes('recordDrafts'), false) // 28
assert.ok((await allFiles(storageRoot)).every((file) => path.resolve(file).startsWith(path.resolve(storageRoot) + path.sep))) // 29
assert.equal(first.metadata.every((item) => !('database' in item)), true) // 30
assert.equal(first.metadata.every((item) => item.embeddingsCreated === false), true) // 31
assert.ok(/Memory Registry|Codex Task Contract Gate/iu.test(first.recommendedNextStep) && !/execute Codex directly/iu.test(first.recommendedNextStep)); assert.equal(validateFactoryMemoryPersistenceRuntimeInput(input).ok, true); assert.equal(validateFactoryMemoryPersistenceRuntimeResult(first).ok, true) // 32
console.log(JSON.stringify({ ok: true, checks: 32, runtimeKind: first.runtimePersistenceKind, status: first.status, recordsWritten: first.recordsWritten, idempotentStatus: second.status, conflictStatus: conflict.status, indexCount: index.count, target: path.relative(storageRoot, write.targetAbsolutePath).replaceAll('\\', '/'), embeddingsCreated: metadata.embeddingsCreated }, null, 2))
