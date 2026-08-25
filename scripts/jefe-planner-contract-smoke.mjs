import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  PlannerContractError,
  createPlanningRequest,
  validatePlanningRequest,
  createPlannerPlan,
  validatePlannerPlan,
  plannerPlanView,
} = require('../electron/jefe-planner-contract.cjs')

const now = '2026-08-25T14:00:00.000Z'
const checks = new Map()
const names = [
  'request determinista y cerrado', 'identidad física exacta', 'referencias correlacionadas', 'paquete planner checksum cerrado', 'texto sensible rechazado', 'paths externos rechazados', 'límites de listas', 'evidencia allowlisted', 'plan determinista', 'pasos ordenados y sin comandos', 'gate accepted ready cierra contrato', 'evidencia insuficiente retorna a discovery', 'paquete restricted retorna a discovery', 'ejecución siempre prohibida', 'estado deriva del gate', 'timestamps canónicos', 'campos laterales rechazados', 'plan id forjado rechazado', 'revisión inválida rechazada', 'vista pública mínima e inmutable',
]

function input(overrides = {}) {
  return {
    identity: { projectId: 'project-planner', runId: 'run-planner', versionId: 'version-planner' },
    sourceRefs: { intakeId: 'intake-0123456789abcdef0123456789abcdef', researchPlanId: 'research-plan-0123456789abcdef0123456789abcdef', evidenceCaseId: 'evidence-case-0123456789abcdef0123456789abcdef', executionFlowId: 'research-execution-0123456789abcdef0123456789abcdef' },
    packageRef: { packageId: 'context-package-0123456789abcdef0123456789abcdef', checksum: 'a'.repeat(64), disposition: 'ready' },
    evidenceState: 'accepted_for_context', objective: 'Definir alcance local revisable.', scope: ['Contrato local'], dependencies: ['Evidencia aceptada'], risks: ['Requiere revisión humana futura'], constraints: ['Sin ejecución ni red'], ...overrides,
  }
}
function throwsCode(run, code) { assert.throws(run, (error) => { assert.ok(error instanceof PlannerContractError); assert.equal(error.code, code); return true }) }
function mark(number, run) { checks.set(number, run) }

mark(1, () => { const first = createPlanningRequest(input(), now); const second = createPlanningRequest(input(), now); assert.equal(first.planningRequestId, second.planningRequestId); assert.deepEqual(Object.keys(first).sort(), ['constraints', 'createdAt', 'dependencies', 'evidenceState', 'identity', 'objective', 'packageRef', 'planningRequestId', 'risks', 'schemaVersion', 'scope', 'sourceRefs'].sort()) })
mark(2, () => throwsCode(() => createPlanningRequest(input({ identity: { projectId: 'project-planner', runId: 'run_planner', versionId: 'version-planner' } }), now), 'INVALID_PLANNER_IDENTITY'))
mark(3, () => throwsCode(() => createPlanningRequest(input({ sourceRefs: { ...input().sourceRefs, intakeId: 'intake-wrong' } }), now), 'INVALID_PLANNER_SOURCE_REFS'))
mark(4, () => throwsCode(() => createPlanningRequest(input({ packageRef: { ...input().packageRef, checksum: 'bad' } }), now), 'INVALID_PLANNER_PACKAGE_REF'))
mark(5, () => throwsCode(() => createPlanningRequest(input({ objective: 'token secret=abc' }), now), 'INVALID_PLANNER_TEXT'))
mark(6, () => throwsCode(() => createPlanningRequest(input({ constraints: ['C:\\outside'] }), now), 'INVALID_PLANNER_CONSTRAINTS'))
mark(7, () => throwsCode(() => createPlanningRequest(input({ scope: Array.from({ length: 25 }, (_, index) => `scope ${index}`) }), now), 'INVALID_PLANNER_SCOPE'))
mark(8, () => throwsCode(() => createPlanningRequest(input({ evidenceState: 'trusted' }), now), 'INVALID_PLANNER_EVIDENCE_STATE'))
mark(9, () => { const request = createPlanningRequest(input(), now); assert.equal(createPlannerPlan(request, now).plannerPlanId, createPlannerPlan(request, now).plannerPlanId) })
mark(10, () => { const plan = createPlannerPlan(createPlanningRequest(input(), now), now); assert.deepEqual(plan.steps.map((item) => item.stepId), ['review_scope', 'resolve_dependencies', 'prepare_execution_contract']); assert.ok(plan.steps.every((item) => item.status === 'planned')) })
mark(11, () => { const plan = createPlannerPlan(createPlanningRequest(input(), now), now); assert.equal(plan.state, 'ready_for_contract_gate'); assert.equal(plan.gate.contractStatus, 'closed') })
mark(12, () => { const plan = createPlannerPlan(createPlanningRequest(input({ evidenceState: 'needs_corroboration' }), now), now); assert.equal(plan.state, 'blocked_return_to_discovery'); assert.equal(plan.gate.nextCheckpoint, 'discovery') })
mark(13, () => { const plan = createPlannerPlan(createPlanningRequest(input({ packageRef: { ...input().packageRef, disposition: 'restricted' } }), now), now); assert.equal(plan.gate.contractStatus, 'blocked') })
mark(14, () => assert.equal(createPlannerPlan(createPlanningRequest(input(), now), now).gate.executionPermitted, false))
mark(15, () => { const plan = createPlannerPlan(createPlanningRequest(input(), now), now); throwsCode(() => validatePlannerPlan({ ...plan, state: 'blocked_return_to_discovery' }), 'INVALID_PLANNER_STATE') })
mark(16, () => throwsCode(() => createPlanningRequest(input(), '2026-08-25'), 'INVALID_PLANNER_TIMESTAMP'))
mark(17, () => { const request = createPlanningRequest(input(), now); throwsCode(() => validatePlanningRequest({ ...request, later: true }), 'INVALID_PLANNER_REQUEST') })
mark(18, () => { const plan = createPlannerPlan(createPlanningRequest(input(), now), now); throwsCode(() => validatePlannerPlan({ ...plan, plannerPlanId: 'planner-plan-0123456789abcdef0123456789abcdef' }), 'INVALID_PLANNER_PLAN') })
mark(19, () => { const plan = createPlannerPlan(createPlanningRequest(input(), now), now); throwsCode(() => validatePlannerPlan({ ...plan, revision: -1 }), 'INVALID_PLANNER_PLAN') })
mark(20, () => { const view = plannerPlanView(createPlannerPlan(createPlanningRequest(input(), now), now)); assert.deepEqual(Object.keys(view).sort(), ['contractStatus', 'executionPermitted', 'nextCheckpoint', 'plannerPlanId', 'planningRequestId', 'projectId', 'revision', 'state', 'updatedAt'].sort()); assert.equal(Object.isFrozen(view), true) })

for (const [number, run] of checks) { run(); console.log(`PASS ${number}/${names.length} ${names[number - 1]}`) }
assert.equal(checks.size, names.length)
console.log(`PASS jefe-planner-contract-smoke: casos 1-${names.length}`)
console.log(`PLANNER_CONTRACT_SMOKE=${checks.size}/${names.length}`)
