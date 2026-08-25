const crypto = require('crypto')
const { AGENT_PURPOSES } = require('./jefe-context-package-contract.cjs')
const { validateIntake } = require('./jefe-discovery-contract.cjs')

class DiscoveryOrchestratorError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new DiscoveryOrchestratorError(code, message)
}

function createSupervisedDiscovery({ persistence, memory = null, contextService = null, clock = () => new Date().toISOString() } = {}) {
  if (!persistence || typeof persistence.save !== 'function' || typeof persistence.read !== 'function') fail('INVALID_DEPENDENCY', 'Persistencia invalida.')
  if (memory !== null && (!memory || typeof memory.append !== 'function')) fail('INVALID_DEPENDENCY', 'MEMORIA invalida.')
  if (contextService !== null && (!contextService || typeof contextService.prepareAgentContext !== 'function')) fail('INVALID_DEPENDENCY', 'Servicio de contexto invalido.')
  if (typeof clock !== 'function') fail('INVALID_DEPENDENCY', 'Reloj invalido.')

  async function buildPackages(intake) {
    if (!contextService || intake.state !== 'ready_for_discovery') return []
    const packages = []
    for (const agent of ['radar', 'hermes', 'scout']) {
      const prepared = await contextService.prepareAgentContext({
        targetAgent: agent,
        purpose: AGENT_PURPOSES[agent],
        scope: 'version',
        identity: intake.identity,
        budget: { maxEntries: 20, maxCharacters: 8000 },
      })
      packages.push({
        agent,
        packageId: prepared.package.packageId,
        handoffId: prepared.handoff.handoffId,
        consumerStatus: prepared.handoff.consumerStatus,
      })
    }
    return packages
  }

  async function appendIntakeMemory(intake) {
    if (!memory || !intake.identity?.versionId) return
    const base = {
      scope: 'version',
      identity: intake.identity,
      actor: 'lean',
      authority: 'human_decision',
      provenance: 'supervised_discovery_intake',
      timestamp: intake.createdAt,
      references: intake.references.map(({ kind, value }) => ({ kind, value })),
      relations: [],
      metadata: {
        intakeId: intake.intakeId,
        state: intake.state,
        nextResponsible: intake.nextResponsible,
      },
    }
    await memory.append({
      ...base,
      entryId: `intake-objective-${crypto.createHash('sha256').update(intake.intakeId).digest('hex').slice(0, 24)}`,
      type: 'objective',
      summary: intake.objective || 'Intake requiere aclaracion.',
    })
    for (const [index, question] of intake.questions.entries()) {
      await memory.append({
        ...base,
        entryId: `intake-question-${crypto.createHash('sha256').update(`${intake.intakeId}:${index}`).digest('hex').slice(0, 24)}`,
        type: 'question',
        summary: question,
        metadata: { ...base.metadata, requiresLean: true },
      })
    }
  }

  async function createIntake(raw) {
    const intake = validateIntake(raw, clock())
    const saved = await persistence.save(intake)
    await appendIntakeMemory(intake)
    const packages = await buildPackages(intake)
    return {
      intake: saved.record,
      idempotent: saved.idempotent,
      state: packages.length ? 'not_connected' : intake.state,
      packages,
    }
  }

  async function reopen(intakeId) {
    const intake = await persistence.read(intakeId)
    if (!intake) fail('INTAKE_NOT_FOUND', 'Intake inexistente.')
    return { intake, state: intake.state }
  }

  async function prepareResearchContext(intakeId) {
    const intake = await persistence.read(intakeId)
    if (!intake) fail('INTAKE_NOT_FOUND', 'Intake inexistente.')
    if (intake.state !== 'ready_for_discovery') fail('INTAKE_NOT_RESEARCH_READY', 'El intake no esta listo para investigacion.')
    if (!contextService || typeof contextService.prepareAgentContext !== 'function') fail('CONTEXT_SERVICE_UNAVAILABLE', 'El servicio de contexto no esta disponible.')
    const packages = await buildPackages(intake)
    if (packages.length !== 3) fail('CONTEXT_PACKAGES_UNAVAILABLE', 'Los paquetes de contexto no estan disponibles.')
    return { intake, packages }
  }

  return { createIntake, reopen, prepareResearchContext }
}

module.exports = { DiscoveryOrchestratorError, createSupervisedDiscovery }
