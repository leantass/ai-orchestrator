import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { AGENT_PURPOSES, canonical } = require('../electron/jefe-context-package-contract.cjs')
const { createAgentContextService } = require('../electron/jefe-agent-context-service.cjs')
const { createAgentExecutionPersistence } = require('../electron/jefe-agent-execution-persistence.cjs')
const { createAgentHandoffService } = require('../electron/jefe-agent-handoff-service.cjs')
const { createAgentResultIngestion, deriveIngestionEntryId } = require('../electron/jefe-agent-result-ingestion.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-ingestion-final-'))
const baseIdentity = { projectId: 'final-project', runId: 'final-run', versionId: 'final-version' }
const request = (agent, identity = baseIdentity) => ({ targetAgent: agent, purpose: AGENT_PURPOSES[agent], scope: 'version', identity, budget: { maxEntries: 20, maxCharacters: 8000 } })
const payload = (overrides = {}) => ({ status: 'success', summary: 'resultado seguro', findings: [{ kind: 'technical_result', summary: 'hallazgo seguro', references: [{ kind: 'url', value: 'https://example.test/result' }] }], ...overrides })
const same = (value) => canonical(value)

try {
  const source = createContextMemory({ root: path.join(root, 'source'), allowedRoots: [root] })
  const memory = createContextMemory({ root: path.join(root, 'memory'), allowedRoots: [root] })
  const persistence = createAgentExecutionPersistence({ root: path.join(root, 'attempts') })
  await source.append({ entryId: 'final-objective', scope: 'version', identity: baseIdentity, type: 'objective', summary: 'objetivo aislado', actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: '2026-08-22T00:00:00.000Z', references: [], relations: [], metadata: {} })
  for (const [entryId, type] of [['final-requirement', 'requirement'], ['final-constraint', 'constraint'], ['final-validation', 'validation']]) await source.append({ entryId, scope: 'version', identity: baseIdentity, type, summary: `${type} aislado`, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: `2026-08-22T00:00:0${entryId.length % 9 + 1}.000Z`, references: [], relations: [], metadata: {} })
  const sourceSnapshot = await source.getSnapshot()
  const snapshotFor = (identity) => { const copy = JSON.parse(canonical(sourceSnapshot)); const remap = (value) => { if (!value || typeof value !== 'object') return; if (Object.hasOwn(value, 'identity')) value.identity = identity; for (const child of Object.values(value)) remap(child) }; remap(copy); return copy }
  const createAttempt = async (identity, agent, result) => {
    const context = createAgentContextService({ readMemory: async () => ({ snapshot: snapshotFor(identity), syncStatus: { status: 'synced' } }), consumers: { [agent]: async () => result } })
    return createAgentHandoffService({ contextService: context, persistence }).handoff(request(agent, identity))
  }
  const healthy = () => createAgentResultIngestion({ persistence: createAgentExecutionPersistence({ root: path.join(root, 'attempts') }), memory: createContextMemory({ root: path.join(root, 'memory'), allowedRoots: [root] }) })

  // 28: append parcial: la recuperación reconoce el primer evento y sólo agrega los faltantes.
  const partialAttempt = await createAttempt(baseIdentity, 'codex', payload({ findings: [{ kind: 'technical_result', summary: 'uno' }, { kind: 'risk', summary: 'dos' }, { kind: 'question', summary: 'tres' }] }))
  assert.equal(partialAttempt.status, 'completed_uningested', JSON.stringify(partialAttempt))
  let appendCount = 0
  const partialMemory = { append: async (entry) => { appendCount++; if (appendCount === 2) { const error = new Error('fallo transitorio'); error.code = 'TEMPORARY'; throw error } return memory.append(entry) } }
  const partialIngestion = createAgentResultIngestion({ persistence, memory: partialMemory })
  assert.deepEqual(await partialIngestion.ingestAttempt(partialAttempt.attemptId), { status: 'ingestion_pending', written: 1 }, '28 pending tras append parcial')
  assert.equal((await persistence.findAttempt(partialAttempt.attemptId)).resultId, partialAttempt.resultId, '28 resultado durable')
  const firstPartial = (await memory.getSnapshot()).history.filter((entry) => entry.metadata.attemptId === partialAttempt.attemptId)
  assert.equal(firstPartial.length, 1, '28 conserva append válido')
  const partialRecovered = healthy()
  assert.deepEqual(await partialRecovered.retryResultIngestion(partialAttempt.attemptId), { status: 'ingested', written: 2 }, '28 retry sólo faltantes')
  const partialEntries = (await memory.getSnapshot()).history.filter((entry) => entry.metadata.attemptId === partialAttempt.attemptId)
  assert.equal(new Set(partialEntries.map((entry) => entry.entryId)).size, 3, '28 sin duplicados')
  const partialBytes = same(await memory.getSnapshot()); const partialRecord = same(await persistence.findAttempt(partialAttempt.attemptId))
  assert.equal((await partialRecovered.retryResultIngestion(partialAttempt.attemptId)).idempotent, true, '28 segundo retry idempotente')
  assert.equal(same(await memory.getSnapshot()), partialBytes); assert.equal(same(await persistence.findAttempt(partialAttempt.attemptId)), partialRecord)

  // 29: el único archivo corrupto permitido es esta fixture temporal aislada.
  const corruptAttempt = await createAttempt(baseIdentity, 'radar', payload())
  const corruptFile = path.join(root, 'attempts', baseIdentity.projectId, `${corruptAttempt.attemptId}.json`)
  await fs.promises.writeFile(corruptFile, '{ no es json durable', 'utf8')
  await assert.rejects(() => persistence.findAttempt(corruptAttempt.attemptId), (error) => error.code === 'CORRUPT_ATTEMPT', '29 detecta corrupción')
  assert.deepEqual(await healthy().getIngestionStatus(corruptAttempt.attemptId), { attemptId: corruptAttempt.attemptId, status: 'ingestion_failed', resultId: null, errorCode: 'CORRUPT_ATTEMPT' }, '29 vista pública sanitizada')
  const validAfterCorruption = await createAttempt(baseIdentity, 'hermes', payload())
  assert.equal((await healthy().ingestAttempt(validAfterCorruption.attemptId)).status, 'ingested', '29 aislamiento de otro intento')

  // 30: A y B comparten sólo la infraestructura física, nunca identidad ni entradas.
  const identityA = { projectId: 'concurrent-a', runId: 'run-a', versionId: 'version-a' }
  const identityB = { projectId: 'concurrent-b', runId: 'run-b', versionId: 'version-b' }
  const concurrentA = await createAttempt(identityA, 'codex', payload({ summary: 'resultado A' }))
  const concurrentB = await createAttempt(identityB, 'codex', payload({ summary: 'resultado B' }))
  const [ingestedA, ingestedB] = await Promise.all([healthy().ingestAttempt(concurrentA.attemptId), healthy().ingestAttempt(concurrentB.attemptId)])
  assert.equal(ingestedA.status, 'ingested'); assert.equal(ingestedB.status, 'ingested')
  const concurrentHistory = (await memory.getSnapshot()).history
  const historyA = concurrentHistory.filter((entry) => same(entry.identity) === same(identityA)); const historyB = concurrentHistory.filter((entry) => same(entry.identity) === same(identityB))
  assert.equal(historyA.length, 1, '30 snapshot A aislado'); assert.equal(historyB.length, 1, '30 snapshot B aislado')
  assert.notEqual(historyA[0].entryId, historyB[0].entryId, '30 ids sin colisión')
  assert.equal((await healthy().getIngestionStatus(concurrentA.attemptId)).status, 'ingested'); assert.equal((await healthy().getIngestionStatus(concurrentB.attemptId)).status, 'ingested')

  // 31: un fallo permanente A no bloquea la cola ni los intents de B.
  const blockedA = await createAttempt(identityA, 'planner', payload({ summary: 'resultado incompatible A' }))
  const blockedRecord = await persistence.findAttempt(blockedA.attemptId)
  const blockedEntryId = deriveIngestionEntryId(blockedRecord.result, 0, 'result')
  await memory.append({ entryId: blockedEntryId, scope: 'version', identity: identityA, type: 'result', summary: 'preexistente incompatible', actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: '2026-08-22T01:00:00.000Z', references: [], relations: [], metadata: {} })
  assert.equal((await healthy().ingestAttempt(blockedA.attemptId)).status, 'ingestion_failed')
  const healthyB = await createAttempt(identityB, 'qa', payload({ summary: 'resultado B sano' }))
  assert.equal((await healthy().ingestAttempt(healthyB.attemptId)).status, 'ingested', '31 B no queda bloqueado')
  const laterB = await createAttempt(identityB, 'hermes', payload({ summary: 'segundo B sano' }))
  assert.equal((await healthy().reconcilePendingResults({ projectId: identityB.projectId, limit: 2 })).items.some((item) => item.status === 'ingested'), true, '31 B reconcilia')
  assert.equal((await healthy().getIngestionStatus(blockedA.attemptId)).errorCode, 'ENTRY_ID_COLLISION'); assert.equal((await healthy().getIngestionStatus(laterB.attemptId)).status, 'ingested')

  // 32: batches sin cursor público: cada tanda toma el prefijo durable aún pendiente.
  const batchIdentity = { projectId: 'batch-project', runId: 'batch-run', versionId: 'batch-version' }
  const batchAttempts = []
  for (let index = 0; index < 3; index++) batchAttempts.push(await createAttempt(batchIdentity, 'codex', payload({ summary: `batch ${index}` })))
  const alwaysPending = createAgentResultIngestion({ persistence, memory: { append: async () => { const error = new Error('temporal'); error.code = 'TEMPORARY'; throw error } } })
  for (const attempt of batchAttempts) assert.equal((await alwaysPending.ingestAttempt(attempt.attemptId)).status, 'ingestion_pending')
  const batch = healthy(); const firstBatch = await batch.reconcilePendingResults({ projectId: batchIdentity.projectId, limit: 2 })
  assert.equal(firstBatch.items.length, 2, '32 límite efectivo'); assert.equal(firstBatch.remaining, 1, '32 restante durable')
  const secondBatch = await healthy().reconcilePendingResults({ projectId: batchIdentity.projectId, limit: 2 })
  assert.equal(secondBatch.items.length, 1, '32 segunda tanda'); assert.equal(secondBatch.remaining, 0)
  assert.equal((await healthy().reconcilePendingResults({ projectId: batchIdentity.projectId, limit: 2 })).items.length, 0, '32 vacío no escribe')
  await assert.rejects(() => healthy().reconcilePendingResults({ projectId: batchIdentity.projectId, limit: 0 }), (error) => error.code === 'INVALID_RECONCILE')
  await assert.rejects(() => healthy().reconcilePendingResults({ projectId: batchIdentity.projectId, limit: 1, offset: 1 }), (error) => error.code === 'INVALID_RECONCILE')

  // 33: consultar no toca records, MEMORIA ni artefactos externos.
  const querySnapshot = same(await memory.getSnapshot()); const queryRecord = same(await persistence.findAttempt(concurrentA.attemptId))
  assert.equal((await healthy().getIngestionStatus(concurrentA.attemptId)).status, 'ingested'); assert.equal(await healthy().getIngestionStatus('agent-attempt-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), null)
  await assert.rejects(() => healthy().getIngestionStatus('../traversal'), (error) => error.code === 'INVALID_ATTEMPT_ID')
  assert.equal(same(await memory.getSnapshot()), querySnapshot); assert.equal(same(await persistence.findAttempt(concurrentA.attemptId)), queryRecord)

  // 34: los sentinels representan lifecycle/manifest/ledger fuera de las dependencias de ingesta.
  const lifecycleDir = path.join(root, 'lifecycle-sentinels'); await fs.promises.mkdir(lifecycleDir)
  const sentinels = ['manifest.json', 'ledger.json', 'projects-index.json', 'approvals.json', 'preview.json']
  for (const name of sentinels) await fs.promises.writeFile(path.join(lifecycleDir, name), `sentinel:${name}`, 'utf8')
  const lifecycleBefore = await Promise.all(sentinels.map(async (name) => fs.promises.readFile(path.join(lifecycleDir, name), 'utf8')))
  const lifecycleAttempt = await createAttempt(baseIdentity, 'scout', payload({ findings: [{ kind: 'requirement_proposal', summary: 'propuesta no vinculante' }] }))
  assert.equal((await healthy().ingestAttempt(lifecycleAttempt.attemptId)).status, 'ingested')
  assert.deepEqual(await Promise.all(sentinels.map(async (name) => fs.promises.readFile(path.join(lifecycleDir, name), 'utf8'))), lifecycleBefore, '34 lifecycle intacto')

  // 35: la única dependencia invocada por C2 es append; no hay runners, adapters ni procesos.
  let guardedAppends = 0
  const guardedMemory = { append: async (entry) => { guardedAppends++; return memory.append(entry) } }
  const guardedAttempt = await createAttempt(baseIdentity, 'cerebro', payload({ findings: [{ kind: 'plan_proposal', summary: 'pregunta pendiente' }] }))
  assert.equal((await createAgentResultIngestion({ persistence, memory: guardedMemory }).ingestAttempt(guardedAttempt.attemptId)).status, 'ingested')
  assert.equal(guardedAppends, 1, '35 sin side effects fuera de MEMORIA')
  const guardedEntry = (await memory.getSnapshot()).history.find((entry) => entry.metadata.attemptId === guardedAttempt.attemptId)
  assert.equal(guardedEntry.metadata.nextResponsible, 'lean'); assert.equal(guardedEntry.metadata.requiresLean, true)

  // 36: rechazos contractuales antes de que puedan crear contexto; HTTPS queda como dato inerte.
  const securitySnapshot = same(await memory.getSnapshot())
  const badReferences = ['file:///tmp/x', 'https://user:pass@example.test/a', 'https://localhost/a', 'https://a.localhost/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://0.0.0.0/a']
  for (const value of badReferences) assert.equal((await createAttempt(baseIdentity, 'radar', payload({ findings: [{ kind: 'technical_result', summary: 'referencia inválida', references: [{ kind: 'url', value }] }] }))).status, 'rejected', `36 ${value}`)
  assert.equal((await createAttempt(baseIdentity, 'radar', { status: 'success', summary: 'C:/absolute/path', findings: [] })).status, 'rejected')
  assert.equal((await createAttempt(baseIdentity, 'radar', { status: 'success', summary: 'seguro', findings: [], requestedHumanAction: undefined })).status, 'rejected')
  assert.equal((await createAttempt(baseIdentity, 'radar', { status: 'success', summary: 'seguro', findings: [], approved: true, deployed: true, published: true })).status, 'rejected')
  assert.equal((await createAttempt(baseIdentity, 'radar', payload({ findings: [{ kind: 'technical_result', summary: 'seguro', references: new Array(21).fill({ kind: 'url', value: 'https://example.test/a' }) }] }))).status, 'rejected')
  const crossIdentity = { projectId: 'security-project', runId: 'security-run', versionId: 'security-version' }
  assert.equal((await createAttempt(crossIdentity, 'radar', payload({ identity: baseIdentity }))).status, 'rejected', '36 claves desconocidas/identidad forjada')
  const safeReference = await createAttempt(baseIdentity, 'radar', payload({ findings: [{ kind: 'evidence_reference', summary: 'referencia inerte', references: [{ kind: 'url', value: 'https://example.test/evidence' }] }] }))
  assert.equal((await healthy().ingestAttempt(safeReference.attemptId)).status, 'ingested')
  assert.equal((await memory.getSnapshot()).history.find((entry) => entry.metadata.attemptId === safeReference.attemptId).references[0].value, 'https://example.test/evidence')
  assert.notEqual(same(await memory.getSnapshot()), securitySnapshot, '36 sólo HTTPS válido crea contexto')
  await assert.rejects(() => healthy().ingestAttempt('../../bad'), (error) => error.code === 'INVALID_ATTEMPT_ID')

  console.log('PASS jefe-agent-result-ingestion-smoke: casos 28-36')
  console.log('PASS jefe-agent-result-ingestion-smoke: casos 1-36')
  console.log('STATUS=ESCALON_2C_C2_SMOKE_COMPLETE_PENDING_FINAL_VALIDATION')
  console.log('CHECKS=36/36')
  console.log('CASOS_PASS=1-36')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
