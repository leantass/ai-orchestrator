import assert from 'node:assert/strict'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFactoryMemoryAdmissionPlan } from '../src/factory/memory-admission/index.ts'
import { createFactoryMemoryPersistencePlan } from '../src/factory/memory-persistence/index.ts'
import { parseFactoryMemoryRegistryIndex, parseFactoryMemoryRegistryQueryResult, serializeFactoryMemoryRegistryIndex, serializeFactoryMemoryRegistryQueryResult, summarizeFactoryMemoryRegistryIndex, validateFactoryMemoryRegistryEntry, validateFactoryMemoryRegistryIndex, validateFactoryMemoryRegistryQueryResult } from '../src/factory/memory-registry/index.ts'
import { evaluateFactoryMemoryWriteApproval } from '../src/factory/memory-write-approval/index.ts'
const require = createRequire(import.meta.url); const persistenceRuntime = require('../electron/factory/memory-persistence-runtime/index.cjs'); const registry = require('../electron/factory/memory-registry/index.cjs'); const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const storageRoot = path.join(repoRoot, '.codex-temp', 'factory-memory-registry-v1', 'smoke'); await rm(storageRoot, { recursive: true, force: true }); const at = '2026-07-17T20:00:00.000Z'
const makeEntry = (id, project) => ({ registryEntryId: `source-${id}`, contractProjectId: project, projectSlug: project, targetPath: `contracts/${project}.json`, metadataPath: `contracts/${project}.meta.json`, expectedFingerprint: `${id}aabbcc`, recalculatedFingerprint: `${id}aabbcc`, expectedIdempotencyKey: `contract-${id}`, recalculatedIdempotencyKey: `contract-${id}`, contractExists: true, metadataExists: true, metadataMatchesContract: true, fingerprintMatches: true, idempotencyMatches: true, flagsSafe: true, pathContained: true, status: 'clean', checks: [], findings: [], canUseForMemory: true, canUseForCodexTask: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false }); const sourceEntries = [makeEntry('one', 'memory-alpha'), makeEntry('two', 'memory-beta')]; const integrity = { integrityKind: 'factory-contract-registry-integrity', integrityVersion: '1.0', generatedAt: at, checkedBy: 'JEFE', storageRoot: '.codex-temp/smoke', registryIndexRef: 'registry-memory-smoke', status: 'clean', entries: sourceEntries, summary: { totalEntries: 2, statusCounts: { clean: 2 }, severityCounts: {}, criticalFindings: 0, cleanEntries: 2, blockedEntries: 0, canUseForMemory: 2, canUseForCodexTask: 0, recommendedNextStep: 'MEMORIA review' }, findings: [], blockers: [], warnings: [], recommendedNextStep: 'MEMORIA review' }
const admission = createFactoryMemoryAdmissionPlan({ integrityReport: integrity, createdAt: at, createdBy: 'JEFE' }); const approval = evaluateFactoryMemoryWriteApproval({ admissionResult: admission, createdAt: at, reviewedBy: 'Lean', humanApprovalRef: 'registry-human' }); const persistence = createFactoryMemoryPersistencePlan({ memoryWriteApprovalResult: approval, createdAt: at, plannedBy: 'JEFE' }); const persisted = await persistenceRuntime.executeFactoryMemoryPersistenceRuntime({ memoryPersistenceResult: persistence, storageRoot, executedAt: at, executedBy: 'registry smoke' }); assert.equal(persisted.recordsWritten, 2) // 1
const orphanDir = path.join(storageRoot, 'factory-memory', 'projects', 'orphans', 'records', 'factory-project-contract'); await mkdir(orphanDir, { recursive: true }); await writeFile(path.join(orphanDir, 'metadata-only.v1.meta.json'), JSON.stringify({ memoryRecordId: 'metadata-only' })); await writeFile(path.join(orphanDir, 'record-only.v1.json'), JSON.stringify({ memoryRecordId: 'record-only' })); await writeFile(path.join(orphanDir, 'ignored.v1.json.tmp'), '{}')
const discovered = await registry.readFactoryMemoryRegistryEntries({ storageRoot, readAt: at, readBy: 'registry smoke' }); assert.equal(discovered.entries.length, 2) // 2
const index = registry.createFactoryMemoryRegistryIndex({ ...discovered, generatedAt: at, generatedBy: 'registry smoke' }); assert.equal(index.entries.length, 2) // 3
const written = await registry.writeFactoryMemoryRegistryIndex({ storageRoot, index }); assert.equal(written.written, true) // 4
assert.equal(JSON.parse(await readFile(written.indexPath, 'utf8')).registryKind, 'factory-memory-registry') // 5
const query = (value) => registry.queryFactoryMemoryRegistry(index, value); assert.equal(query({ byProjectNamespace: index.entries[0].projectNamespace }).matches.length, 1) // 6
assert.equal(query({ byNamespace: index.entries[0].namespace }).matches.length, 1) // 7
assert.equal(query({ byMemoryRecordId: index.entries[0].memoryRecordId }).matches.length, 1) // 8
assert.equal(query({ byMemoryRecordKind: index.entries[0].memoryRecordKind }).matches.length, 2) // 9
assert.equal(query({ byFingerprint: index.entries[0].fingerprint }).matches.length, 1) // 10
assert.equal(query({ byIdempotencyKey: index.entries[0].idempotencyKey }).matches.length, 1) // 11
assert.equal(query({ byStatus: 'ready' }).matches.length, 2) // 12
const duplicateEntries = [...index.entries, { ...structuredClone(index.entries[0]), registryEntryId: 'duplicate-entry', memoryRecordId: 'duplicate-record' }]; const duplicateIndex = registry.createFactoryMemoryRegistryIndex({ ...discovered, entries: duplicateEntries, generatedAt: at, generatedBy: 'registry smoke' }); assert.ok(duplicateIndex.duplicates.some((item) => item.field === 'fingerprint')) // 13
assert.ok(duplicateIndex.duplicates.some((item) => item.field === 'idempotencyKey')) // 14
assert.ok(duplicateIndex.conflicts.some((item) => item.field === 'namespace')) // 15
assert.ok(discovered.orphans.some((item) => item.orphanKind === 'metadata_without_record')) // 16
assert.ok(discovered.orphans.some((item) => item.orphanKind === 'record_without_metadata')) // 17
assert.throws(() => registry.assertFactoryMemoryRegistryRootAllowed(path.join(repoRoot, 'outside'))) // 18
assert.equal(registry.isSafeFactoryMemoryRegistryRelativePath('/factory-memory/projects/x/a.json'), false) // 19
assert.equal(registry.isSafeFactoryMemoryRegistryRelativePath('factory-memory/projects/x/../a.json'), false) // 20
assert.equal(discovered.orphans.some((item) => item.logicalPath.includes('ignored')), false) // 21
assert.equal(JSON.stringify(summarizeFactoryMemoryRegistryIndex(index)).includes('canonicalPayload'), false) // 22
const result = query({ readyForNextStepOnly: true }); assert.equal(result.canCreateEmbeddings, false) // 23
assert.equal(result.canCreateCodexTask, false) // 24
assert.equal(result.canExecuteCodex, false) // 25
assert.equal(result.canCreateProject, false) // 26
assert.equal(result.canCreateRepository, false) // 27
assert.equal(result.canDeploy, false) // 28
assert.ok(index.entries.every((item) => validateFactoryMemoryRegistryEntry(item).ok)) // 29
assert.equal(validateFactoryMemoryRegistryIndex(index).ok, true) // 30
assert.equal(validateFactoryMemoryRegistryQueryResult(result).ok, true) // 31
assert.equal(parseFactoryMemoryRegistryIndex(serializeFactoryMemoryRegistryIndex(index)).entries.length, 2) // 32
assert.equal(parseFactoryMemoryRegistryQueryResult(serializeFactoryMemoryRegistryQueryResult(result)).matches.length, 2) // 33
assert.ok(path.resolve(written.indexPath).startsWith(path.resolve(storageRoot) + path.sep)) // 34
assert.ok(/Memory Registry Integrity Gate/iu.test(index.recommendedNextStep) && !/execute Codex directly/iu.test(index.recommendedNextStep)) // 35
console.log(JSON.stringify({ ok: true, checks: 35, registryKind: index.registryKind, entries: index.entries.length, projectIndexes: index.projectIndexes.length, orphans: index.orphans.length, duplicateFingerprints: duplicateIndex.duplicates.filter((item) => item.field === 'fingerprint').length, conflicts: duplicateIndex.conflicts.length, indexPath: path.relative(storageRoot, written.indexPath).replaceAll('\\', '/') }, null, 2))
