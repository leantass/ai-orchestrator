import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import persistence from '../electron/orchestrator-canonical-execution-persistence.cjs'
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canonical-execution-5d-')); try {
  const store = persistence.createExecutionPersistence({ root }); const records = path.join(root, 'executions'); await fs.mkdir(records, { recursive: true }); await fs.writeFile(path.join(records, 'execution-' + 'f'.repeat(32) + '.json'), '{broken', 'utf8')
  const diagnosis = await store.scanDetailed(); assert.equal(diagnosis.records.length, 0) // 1 lectura read-only
  assert.deepEqual(diagnosis.corruptions, [{ executionId: 'execution-' + 'f'.repeat(32), code: 'CORRUPT_EXECUTION' }]) // 2 aislamiento
  const rebuilt = await store.rebuildIndex(); assert.equal(rebuilt.index.corruptions.length, 1) // 3 reconstruccion conservadora
  assert.equal(await fs.readFile(path.join(records, 'execution-' + 'f'.repeat(32) + '.json'), 'utf8'), '{broken') // 4 no borrado
  assert.equal((await store.rebuildIndex()).idempotent, true) // 5 replay recovery
  console.log('PASS orchestrator-canonical-execution-5d-smoke: casos 1-5')
} finally { await fs.rm(root, { recursive: true, force: true }) }
