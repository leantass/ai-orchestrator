import { FACTORY_ARCHITECTURE_BLUEPRINT_KIND, FACTORY_ARCHITECTURE_BLUEPRINT_VERSION, FACTORY_ARCHITECTURE_LAYER_ORDER, FACTORY_ARCHITECTURE_SCHEMA_VERSION } from './factory-architecture-blueprint.defaults.ts'
import type { FactoryBlueprintValidationResult } from './factory-architecture-blueprint.types.ts'

type RecordValue = Record<string, unknown>
const REQUIRED_TOOLS = ['jefe', 'factory-project-contract', 'factory-architecture-blueprint', 'radar', 'hermes', 'memory', 'codex', 'github', 'github-actions', 'typescript-strict', 'eslint', 'prettier', 'vitest', 'msw', 'playwright-test', 'playwright-cli', 'axe-core', 'lighthouse-ci', 'gitleaks', 'semgrep', 'trivy', 'promptfoo', 'opentelemetry', 'renovate', 'dev-containers', 'docker-selective', 'umami']
const ORIGINS = ['internal_module', 'external_tool', 'adapter', 'contract', 'workflow_gate', 'external_platform', 'external_standard', 'generated_project_component', 'service_future']

function record(value: unknown): RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RecordValue : {} }
function text(value: unknown): boolean { return typeof value === 'string' && value.trim().length > 0 }

export function validateFactoryArchitectureBlueprintV1(value: unknown): FactoryBlueprintValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (Object.keys(record(value)).length === 0) return { ok: false, errors: ['El blueprint debe ser un objeto JSON.'], warnings }
  const blueprint = record(value)
  if (blueprint.blueprintKind !== FACTORY_ARCHITECTURE_BLUEPRINT_KIND) errors.push(`blueprintKind debe ser ${FACTORY_ARCHITECTURE_BLUEPRINT_KIND}.`)
  if (blueprint.blueprintVersion !== FACTORY_ARCHITECTURE_BLUEPRINT_VERSION) errors.push(`blueprintVersion debe ser ${FACTORY_ARCHITECTURE_BLUEPRINT_VERSION}.`)
  if (blueprint.schemaVersion !== FACTORY_ARCHITECTURE_SCHEMA_VERSION) errors.push(`schemaVersion debe ser ${FACTORY_ARCHITECTURE_SCHEMA_VERSION}.`)
  if (!text(blueprint.createdAt)) errors.push('createdAt es obligatorio y debe recibirse como input.')
  const layers = Array.isArray(blueprint.layers) ? blueprint.layers.map(record) : []
  const ids = layers.map((layer) => layer.layerId)
  if (JSON.stringify(ids) !== JSON.stringify(FACTORY_ARCHITECTURE_LAYER_ORDER)) errors.push('Las capas obligatorias deben estar presentes en el orden canonico.')
  if (layers.some((layer) => !ORIGINS.includes(String(layer.origin)))) errors.push('Todas las capas deben declarar un origin valido.')
  const tools = Array.isArray(blueprint.tools) ? blueprint.tools.map(record) : []
  const toolIds = new Set(tools.map((tool) => tool.toolId))
  for (const id of REQUIRED_TOOLS) if (!toolIds.has(id)) errors.push(`Falta la herramienta obligatoria ${id}.`)
  for (const tool of tools) {
    const id = String(tool.toolId ?? 'unknown')
    for (const field of ['why', 'risk', 'adoptionTrigger', 'rollback']) if (!text(tool[field])) errors.push(`${id}.${field} es obligatorio.`)
    if (!Array.isArray(tool.acceptanceCriteria) || tool.acceptanceCriteria.length === 0) errors.push(`${id}.acceptanceCriteria no puede estar vacio.`)
    if (tool.status === 'approved' && tool.cost === 'paid_only' && tool.paidOnlyJustification !== 'openai-tokens-or-api') errors.push(`${id} no puede aprobarse como paid_only fuera de OpenAI tokens/API.`)
    if ((id === 'agent-zero' || id === 'kubernetes') && tool.status === 'approved') errors.push(`${id} no puede estar aprobado.`)
    if (!ORIGINS.includes(String(tool.origin))) errors.push(`${id}.origin debe ser valido.`)
  }
  const findTool = (id: string) => tools.find((tool) => tool.toolId === id) ?? {}
  const requireOrigin = (id: string, origin: string) => { if (findTool(id).origin !== origin) errors.push(`${id} debe tener origin=${origin}.`) }
  requireOrigin('radar', 'internal_module'); requireOrigin('jefe', 'internal_module'); requireOrigin('memory', 'internal_module')
  requireOrigin('hermes', 'external_tool'); requireOrigin('codex', 'external_tool'); requireOrigin('playwright-test', 'external_tool'); requireOrigin('vitest', 'external_tool'); requireOrigin('msw', 'external_tool')
  requireOrigin('factory-project-contract', 'contract'); requireOrigin('factory-architecture-blueprint', 'contract')
  const hermes = findTool('hermes')
  if (hermes.adapterRequired !== true || !text(hermes.adapterName)) errors.push('Hermes Agent requiere adapterName y adapterRequired=true.')
  for (const field of ['mayModifyCode', 'mayModifyRepo', 'mayApprove', 'mayDeploy']) if (hermes[field] !== false) errors.push(`Hermes Agent debe tener ${field}=false.`)
  const codex = findTool('codex')
  if (codex.mayApprove !== false || codex.mayDeploy !== false) errors.push('Codex no puede aprobar ni deployar.')
  const components = Array.isArray(blueprint.components) ? blueprint.components.map(record) : []
  if (components.some((component) => !ORIGINS.includes(String(component.origin)))) errors.push('Todos los componentes deben declarar un origin valido.')
  const adapter = components.find((component) => component.componentId === 'jefe-hermes-adapter')
  if (adapter?.origin !== 'adapter' || adapter.ownership !== 'jefe_core') errors.push('JefeHermesAdapter debe existir como adapter propio de JEFE.')
  const generatedApps = components.find((component) => component.componentId === 'generated-apps')
  if (generatedApps?.origin !== 'generated_project_component') errors.push('Generated apps deben ser generated_project_component y nunca internal_module.')
  const actor = record(blueprint.actorPolicy)
  if (actor.codexCanSelfApprove !== false) errors.push('Codex no puede autoaprobar.')
  if (actor.hermesCanModifyCode !== false) errors.push('Hermes debe ser read-only y no modificar codigo.')
  const independence = record(blueprint.independence)
  if (independence.generatedProjectsMustHaveOwnRepo !== true) errors.push('Los proyectos generados deben tener repo propio.')
  if (independence.generatedProjectsMustNotDependOnJefeRuntime !== true) errors.push('Los proyectos generados no deben depender del runtime JEFE.')
  const economics = record(blueprint.economics)
  if (economics.freeFirst !== true) errors.push('economics.freeFirst debe ser true.')
  if (economics.avoidDuplicateTools !== true) errors.push('economics.avoidDuplicateTools debe ser true.')
  const gates = Array.isArray(blueprint.gates) ? blueprint.gates.map(record) : []
  if (gates.some((gate) => gate.codexSelfApprovalAllowed !== false)) errors.push('Ningun gate puede permitir autoaprobacion de Codex.')
  if (gates.length !== FACTORY_ARCHITECTURE_LAYER_ORDER.length - 1) warnings.push('Se recomienda un gate entre cada par de capas.')
  const loop = record(blueprint.correctionLoop); const policy = record(loop.policy); const reviewGate = record(loop.jefeReviewGate)
  const requiredTrue = ['afterTestsReturnToJefe', 'afterQaReturnToJefe', 'afterSecurityReturnToJefe', 'afterPromptEvalReturnToJefe', 'jefeMustCompareAgainstBrief', 'jefeMustCompareAgainstContract', 'jefeMustCompareAgainstAcceptanceCriteria', 'jefeMustCompareAgainstEvidence', 'correctionLoopRequiredBeforeRelease', 'humanEscalationOnRepeatedFailure', 'regressionDetectionRequired', 'releaseReadinessRequiresJefeApproval']
  for (const field of requiredTrue) if (policy[field] !== true) errors.push(`correctionLoop.policy.${field} debe ser true.`)
  if (policy.codexSelfApprovalAllowed !== false) errors.push('correctionLoop.policy.codexSelfApprovalAllowed debe ser false.')
  if (typeof policy.maxCorrectionRoundsDefault !== 'number' || policy.maxCorrectionRoundsDefault < 1) errors.push('Debe existir maxCorrectionRoundsDefault >= 1.')
  if (reviewGate.required !== true || reviewGate.approver !== 'JEFE' || reviewGate.stagingRequiresThisGate !== true) errors.push('Todo release requiere JEFE review gate antes de staging.')
  const forbidden = Array.isArray(loop.directToStagingForbiddenFrom) ? loop.directToStagingForbiddenFrom : []
  for (const layer of ['unit_integration_tests', 'browser_qa', 'security_quality_performance', 'ai_prompt_evaluation']) if (!forbidden.includes(layer)) errors.push(`${layer} no puede pasar directo a staging.`)
  const concepts = Array.isArray(blueprint.futureConcepts) ? blueprint.futureConcepts.map(record) : []
  for (const concept of ['FactoryAcceptanceReview', 'FactoryCorrectionPlan', 'FactoryCorrectionRound', 'FactoryReleaseReadiness', 'FactoryRegressionReport']) if (!concepts.some((entry) => entry.conceptKind === concept && entry.implemented === false)) errors.push(`Falta el concepto futuro ${concept}.`)
  return { ok: errors.length === 0, errors, warnings }
}
