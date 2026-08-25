const { canonical, validatePackage } = require('./jefe-context-package-contract.cjs')
const { createPlanningRequest, createPlannerPlan, plannerPlanView } = require('./jefe-planner-contract.cjs')

class PlannerOrchestratorError extends Error { constructor(code, message) { super(message); this.name = 'PlannerOrchestratorError'; this.code = code } }
function fail(code, message) { throw new PlannerOrchestratorError(code, message) }
function plain(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)) }
function exact(value, fields, code) { if (!plain(value) || canonical(Object.keys(value).sort()) !== canonical([...fields].sort())) fail(code, 'Entrada de planner inválida.') }
function sourcePort(value, name) { if (!plain(value) || typeof value.read !== 'function') fail('INVALID_PLANNER_SOURCES', `Fuente ${name} inválida.`); return value }
function input(value) { exact(value, ['identity', 'intakeId', 'researchPlanId', 'evidenceCaseId', 'executionFlowId', 'package', 'objective', 'scope', 'dependencies', 'risks', 'constraints'], 'INVALID_PLANNER_INPUT'); return value }
function createPlannerOrchestrator({ persistence, sources, clock = () => new Date().toISOString() } = {}) {
  if (!persistence || typeof persistence.create !== 'function' || typeof persistence.readPlan !== 'function') fail('INVALID_PLANNER_PERSISTENCE', 'Persistencia de planner inválida.')
  if (!plain(sources)) fail('INVALID_PLANNER_SOURCES', 'Fuentes de planner inválidas.')
  const discovery = sourcePort(sources.discovery, 'discovery'); const evidenceCases = sourcePort(sources.evidenceCases, 'evidenceCases'); const executionFlows = sourcePort(sources.executionFlows, 'executionFlows')
  async function prepare(raw) {
    const value = input(raw); let packageValue
    try { packageValue = validatePackage(value.package) } catch { fail('INVALID_PLANNER_PACKAGE', 'Paquete de Planner inválido.') }
    if (packageValue.targetAgent !== 'planner' || packageValue.purpose !== 'planning' || canonical(packageValue.identity) !== canonical(value.identity)) fail('INVALID_PLANNER_PACKAGE', 'Paquete de Planner no corresponde a la identidad.')
    const [intake, evidenceCase, flow] = await Promise.all([discovery.read(value.intakeId), evidenceCases.read(value.evidenceCaseId), executionFlows.read(value.executionFlowId)])
    if (!intake || !evidenceCase || !flow) fail('PLANNER_SOURCE_NOT_FOUND', 'Falta una fuente durable para el plan.')
    if (canonical(intake.identity) !== canonical(value.identity) || evidenceCase.projectId !== value.identity.projectId || canonical(flow.identity) !== canonical(value.identity)) fail('PLANNER_SOURCE_IDENTITY_MISMATCH', 'Fuentes de planner cruzadas.')
    if (evidenceCase.researchPlanId !== value.researchPlanId || flow.intakeId !== value.intakeId || flow.researchPlanId !== value.researchPlanId || flow.evidenceCaseId !== value.evidenceCaseId) fail('PLANNER_SOURCE_CORRELATION_MISMATCH', 'Fuentes de planner no correlacionan.')
    const request = createPlanningRequest({ identity: value.identity, sourceRefs: { intakeId: value.intakeId, researchPlanId: value.researchPlanId, evidenceCaseId: value.evidenceCaseId, executionFlowId: value.executionFlowId }, packageRef: { packageId: packageValue.packageId, checksum: packageValue.integrity.checksum, disposition: packageValue.disposition }, evidenceState: evidenceCase.state, objective: value.objective, scope: value.scope, dependencies: value.dependencies, risks: value.risks, constraints: value.constraints }, clock())
    const plan = createPlannerPlan(request, clock())
    const saved = await persistence.create(request, plan)
    return Object.freeze({ request: saved.request, plan: plannerPlanView(saved.plan), idempotent: saved.idempotent })
  }
  async function getPlan(plannerPlanId) { const plan = await persistence.readPlan(plannerPlanId); return plan ? plannerPlanView(plan) : null }
  return Object.freeze({ prepare, getPlan })
}
module.exports = { PlannerOrchestratorError, createPlannerOrchestrator }
