import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createPlannerPersistence } = require('../electron/jefe-planner-persistence.cjs')
const { createPlannerGatePersistence } = require('../electron/jefe-planner-gate.cjs')
const { PlannerRecoveryError, createPlannerRecovery } = require('../electron/jefe-planner-recovery.cjs')
const root = path.join(await import('node:fs/promises').then((fs) => fs.mkdtemp(path.join(os.tmpdir(), 'jefe-planner-recovery-'))), 'state')
const recovery = createPlannerRecovery({ plannerPersistence: createPlannerPersistence({ root: path.join(root, 'planner') }), gatePersistence: createPlannerGatePersistence({ root: path.join(root, 'gates') }) })
const checks = new Map(); const names = ['diagnóstico vacío puro', 'plan determinista', 'operaciones cerradas', 'ejecución explícita', 'índices reconstruidos', 'sin adapters', 'sin ejecución de planes', 'sin borrado', 'project id inválido', 'plan forjado rechazado', 'API cerrada']
checks.set(1, async () => assert.equal((await recovery.diagnose()).recoveryRequired, false))
checks.set(2, async () => { const diagnosis = await recovery.diagnose(); assert.equal(recovery.createPlan(diagnosis).recoveryPlanId, recovery.createPlan(diagnosis).recoveryPlanId) })
checks.set(3, async () => assert.deepEqual(recovery.createPlan(await recovery.diagnose()).operations, ['rebuild_planner_index', 'rebuild_planner_gate_index']))
checks.set(4, async () => assert.equal((await recovery.execute(recovery.createPlan(await recovery.diagnose()))).recoveryPlanId.startsWith('planner-recovery-'), true))
checks.set(5, async () => { const result = await recovery.execute(recovery.createPlan(await recovery.diagnose())); assert.ok(result.planner.index && result.gates.index) })
checks.set(6, async () => assert.equal((await recovery.execute(recovery.createPlan(await recovery.diagnose()))).executedAdapters, false))
checks.set(7, async () => assert.equal((await recovery.execute(recovery.createPlan(await recovery.diagnose()))).executedPlans, false))
checks.set(8, async () => assert.equal((await recovery.execute(recovery.createPlan(await recovery.diagnose()))).deletedRecords, 0))
checks.set(9, async () => await assert.rejects(() => recovery.diagnose('bad_id'), (error) => error instanceof PlannerRecoveryError && error.code === 'INVALID_PROJECT_ID'))
checks.set(10, async () => await assert.rejects(() => recovery.execute({}), (error) => error instanceof PlannerRecoveryError && error.code === 'INVALID_RECOVERY_PLAN'))
checks.set(11, () => assert.deepEqual(Object.keys(recovery).sort(), ['createPlan', 'diagnose', 'execute']))
for (const [number, run] of checks) { await run(); console.log(`PASS ${number}/${names.length} ${names[number - 1]}`) }
console.log(`PASS jefe-planner-recovery-smoke: casos 1-${names.length}`); console.log(`PLANNER_RECOVERY_SMOKE=${checks.size}/${names.length}`)
