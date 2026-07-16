import type {
  FactoryArchitectureBlueprintV1,
  FactoryArchitectureLayer,
  FactoryArchitectureLayerId,
  FactoryArchitectureTool,
  FactoryArchitectureComponent,
  FactoryComponentOrigin,
  FactoryExternalToolPolicy,
  FactoryGate,
  FactoryImplementationPhase,
  FactoryToolCostProfile,
  FactoryToolStatus,
} from './factory-architecture-blueprint.types.ts'

export const FACTORY_ARCHITECTURE_BLUEPRINT_KIND = 'factory-architecture-blueprint' as const
export const FACTORY_ARCHITECTURE_BLUEPRINT_VERSION = '1.0' as const
export const FACTORY_ARCHITECTURE_SCHEMA_VERSION = 1 as const

export const FACTORY_ARCHITECTURE_LAYER_ORDER: readonly FactoryArchitectureLayerId[] = [
  'market_radar', 'hermes_scout', 'jefe_decision', 'canonical_memory',
  'codex_constructor', 'jefe_review', 'unit_integration_tests', 'browser_qa',
  'security_quality_performance', 'ai_prompt_evaluation', 'release_approval',
  'staging', 'post_deploy_tests', 'production', 'analytics_monetization', 'learning_memory',
]

type ToolSeed = [string, string, string, FactoryToolStatus, FactoryToolCostProfile, string, string]

const TOOL_SEEDS: ToolSeed[] = [
  ['jefe', 'JEFE', 'core', 'approved', 'open_source', 'Gobierna decisiones y aprobaciones.', 'El nucleo mantiene autoridad final.'],
  ['factory-project-contract', 'FactoryProjectContract', 'core', 'approved', 'open_source', 'Define productos independientes.', 'La integracion futura debe preservar contratos previos.'],
  ['factory-architecture-blueprint', 'FactoryArchitectureBlueprint', 'core', 'approved', 'open_source', 'Fija arquitectura y adopcion.', 'Puede quedar obsoleto sin revision versionada.'],
  ['radar', 'Radar', 'research', 'approved', 'open_source', 'Detecta oportunidades medibles.', 'Fuentes ruidosas pueden sesgar decisiones.'],
  ['hermes', 'Hermes Agent', 'research', 'approved', 'open_source', 'Herramienta externa que investiga mercado en modo read-only.', 'La investigacion no confiable debe tratarse como input no validado.'],
  ['memory', 'MEMORIA', 'knowledge', 'approved', 'open_source', 'Conserva contexto canonico y aprendizaje revisado.', 'Puede mezclar proyectos sin namespaces y promocion controlada.'],
  ['codex', 'Codex', 'construction', 'approved', 'token_cost', 'Construye y corrige bajo contratos.', 'Consume tokens y nunca debe autoaprobar.'],
  ['github', 'GitHub', 'repository', 'approved', 'free_tier', 'Aloja repos, issues y releases.', 'Limites del free tier y dependencia del proveedor.'],
  ['github-actions', 'GitHub Actions', 'ci', 'approved', 'free_tier', 'Automatiza gates reproducibles.', 'Minutos y concurrencia pueden generar costo.'],
  ['github-projects', 'GitHub Projects', 'management', 'approved', 'free_tier', 'Ordena portfolio y trabajo.', 'Duplicar estados con JEFE genera drift.'],
  ['github-issues', 'GitHub Issues', 'management', 'approved', 'free_tier', 'Registra trabajo y defectos.', 'Requiere contratos de sincronizacion.'],
  ['github-releases', 'GitHub Releases', 'release', 'approved', 'free_tier', 'Versiona entregas cuando corresponda.', 'No aplica a todos los productos inicialmente.'],
  ['typescript-strict', 'TypeScript strict gradual', 'quality', 'approved', 'open_source', 'Reduce defectos estaticos gradualmente.', 'Activacion total prematura puede bloquear migracion.'],
  ['eslint', 'ESLint', 'quality', 'approved', 'open_source', 'Impone reglas estaticas.', 'Reglas excesivas generan friccion.'],
  ['prettier', 'Prettier', 'quality', 'approved', 'open_source', 'Normaliza formato.', 'Debe adoptarse sin churn masivo.'],
  ['vitest', 'Vitest', 'testing', 'approved', 'open_source', 'Prueba logica y componentes.', 'Una suite mal enfocada puede ser lenta y fragil.'],
  ['msw', 'MSW', 'testing', 'approved', 'open_source', 'Simula APIs controladamente.', 'Mocks divergentes pueden ocultar integraciones rotas.'],
  ['playwright-test', 'Playwright Test', 'qa', 'approved', 'open_source', 'Valida flujos reales y responsive.', 'Costo de mantenimiento y flakiness.'],
  ['playwright-cli', 'Playwright CLI', 'qa', 'approved', 'open_source', 'Facilita QA controlada y evidencia.', 'No debe habilitar navegacion arbitraria sin limites.'],
  ['axe-core', 'axe-core', 'accessibility', 'approved', 'open_source', 'Automatiza checks de accesibilidad.', 'No reemplaza revision manual.'],
  ['lighthouse-ci', 'Lighthouse CI', 'performance', 'approved', 'open_source', 'Define presupuestos de performance.', 'Metricas varian por entorno.'],
  ['gitleaks', 'Gitleaks', 'security', 'approved', 'open_source', 'Detecta secretos.', 'Falsos positivos requieren baseline seguro.'],
  ['semgrep', 'Semgrep Community Edition', 'security', 'approved', 'open_source', 'Detecta patrones inseguros.', 'Licencia o reglas pueden cambiar.'],
  ['trivy', 'Trivy', 'security', 'approved', 'open_source', 'Escanea dependencias e imagenes.', 'Hallazgos requieren priorizacion.'],
  ['promptfoo', 'Promptfoo', 'ai-quality', 'approved', 'open_source', 'Evalua prompts, agentes y regresiones.', 'Evaluaciones pobres crean falsa confianza.'],
  ['opentelemetry', 'OpenTelemetry', 'observability', 'approved', 'open_source', 'Estandariza trazas, tiempos y costos.', 'Instrumentacion excesiva agrega ruido.'],
  ['renovate', 'Renovate', 'automation', 'approved', 'free_tier', 'Mantiene dependencias con PRs controlados.', 'Actualizaciones simultaneas saturan CI.'],
  ['dev-containers', 'Dev Containers', 'reproducibility', 'approved', 'open_source', 'Mejora onboarding reproducible.', 'No debe ser requisito para todos los productos.'],
  ['docker-selective', 'Docker selectivo', 'reproducibility', 'approved', 'open_source', 'Aisla servicios cuando aporta valor.', 'Complejidad innecesaria para apps simples.'],
  ['umami', 'Umami', 'analytics', 'approved', 'open_source', 'Analitica simple y autocontenida.', 'Operacion propia requiere mantenimiento.'],
  ['posthog', 'PostHog', 'analytics', 'conditional', 'free_tier', 'Aporta funnels, cohortes, flags y experimentos.', 'Evitar duplicarlo con Umami sin necesidad.'],
  ['owasp-zap', 'OWASP ZAP', 'security', 'conditional', 'open_source', 'Prueba staging web estable.', 'Puede ser ruidoso y agresivo sin scope.'],
  ['sops-age', 'SOPS + age', 'security', 'conditional', 'open_source', 'Gestiona secretos reales cifrados.', 'Gestion de claves agrega carga operativa.'],
  ['langfuse', 'Langfuse', 'observability', 'conditional', 'open_source', 'Especializa observabilidad de IA.', 'Duplica OpenTelemetry si no aporta evidencia.'],
  ['storybook', 'Storybook', 'design-system', 'conditional', 'open_source', 'Documenta un design system real.', 'No justifica mantenimiento sin componentes compartidos.'],
  ['turborepo', 'Turborepo', 'monorepo', 'conditional', 'open_source', 'Coordina multiples paquetes reales.', 'No aporta valor en repo simple.'],
  ['pnpm', 'pnpm', 'package-manager', 'conditional', 'open_source', 'Optimiza workspaces y almacenamiento.', 'Migracion de lockfile sin necesidad genera riesgo.'],
  ['self-hosted-runner', 'Runner propio', 'ci', 'conditional', 'unknown', 'Reduce limites de CI cuando hay evidencia.', 'Seguridad y mantenimiento de infraestructura.'],
  ['woodpecker-forgejo', 'Woodpecker / Forgejo', 'ci', 'conditional', 'open_source', 'Permite independencia operativa.', 'Duplica GitHub sin caso economico fuerte.'],
  ['agent-zero', 'Agent Zero', 'agent', 'rejected', 'open_source', 'No agrega una responsabilidad necesaria.', 'Solapa agentes y aumenta superficie de riesgo.'],
  ['kubernetes', 'Kubernetes', 'infrastructure', 'rejected', 'open_source', 'No es necesario para la etapa inicial.', 'Complejidad y costo operativo desproporcionados.'],
  ['tooling-by-fashion', 'Instalar herramientas por moda', 'governance', 'rejected', 'unknown', 'Evita complejidad sin objetivo.', 'Acumula mantenimiento y costos.'],
  ['duplicate-analytics', 'Analitica duplicada', 'analytics', 'rejected', 'unknown', 'Mantiene una sola fuente por necesidad.', 'Eventos y metricas contradictorias.'],
]

function makeTool(seed: ToolSeed): FactoryArchitectureTool {
  const [toolId, name, category, status, cost, why, risk] = seed
  return {
    toolId, name, category, status, cost, why, risk,
    ...policyForTool(toolId),
    solves: [`${category}-capability`],
    adoptionTrigger: status === 'rejected' ? 'No adoptar en arquitectura inicial.' : `Existe necesidad medible de ${category}.`,
    acceptanceCriteria: ['Objetivo medible documentado.', 'Costo y mantenimiento aceptados.', 'Gate automatizable o evidencia revisable.'],
    rollback: 'Retirar integracion en commit aislado y volver al ultimo gate estable.',
    notes: status === 'conditional' ? ['Requiere evidencia antes de adopcion.'] : [],
  }
}

function policyForTool(toolId: string): FactoryExternalToolPolicy {
  const internal = new Set(['jefe', 'radar', 'memory'])
  const contracts = new Set(['factory-project-contract', 'factory-architecture-blueprint'])
  const platforms = new Set(['github', 'github-actions', 'github-projects', 'github-issues', 'github-releases'])
  const services = new Set(['umami', 'posthog'])
  const origin: FactoryComponentOrigin = internal.has(toolId) ? 'internal_module' : contracts.has(toolId) ? 'contract' : platforms.has(toolId) ? 'external_platform' : toolId === 'opentelemetry' ? 'external_standard' : services.has(toolId) ? 'service_future' : 'external_tool'
  const adapterRequired = toolId === 'hermes' || toolId === 'codex'
  return {
    origin,
    integrationMode: toolId === 'hermes' ? 'read_only_adapter' : toolId === 'codex' ? 'supervised_constructor' : contracts.has(toolId) ? 'contract_only' : platforms.has(toolId) ? 'ci_integration' : toolId === 'opentelemetry' ? 'telemetry_standard' : services.has(toolId) ? 'future_service' : internal.has(toolId) ? 'native' : 'evidence_gate',
    adapterRequired,
    ...(toolId === 'hermes' ? { adapterName: 'JefeHermesAdapter' } : toolId === 'codex' ? { adapterName: 'JefeCodexAdapter' } : {}),
    ownership: internal.has(toolId) || contracts.has(toolId) ? 'jefe_core' : toolId === 'opentelemetry' ? 'shared_standard' : 'external_provider',
    mayModifyCode: toolId === 'codex',
    mayModifyRepo: false,
    mayApprove: false,
    mayDeploy: false,
    mayReadExternalSources: toolId === 'hermes',
    requiresHumanApproval: toolId === 'hermes' || toolId === 'codex' || platforms.has(toolId),
    notes: [origin === 'external_tool' ? 'External capability governed by JEFE contracts and gates.' : 'Origin classified by FactoryArchitectureBlueprint v1.'],
  }
}

function makeLayers(): FactoryArchitectureLayer[] {
  const actors: Record<FactoryArchitectureLayerId, string> = {
    market_radar: 'Radar', hermes_scout: 'Hermes', jefe_decision: 'JEFE', canonical_memory: 'MEMORIA',
    codex_constructor: 'Codex', jefe_review: 'JEFE', unit_integration_tests: 'Vitest + MSW',
    browser_qa: 'Playwright', security_quality_performance: 'Security and quality toolchain',
    ai_prompt_evaluation: 'Promptfoo', release_approval: 'JEFE', staging: 'Delivery platform',
    post_deploy_tests: 'Playwright + JEFE', production: 'Delivery platform',
    analytics_monetization: 'Analytics + JEFE', learning_memory: 'MEMORIA',
  }
  const toolMap: Partial<Record<FactoryArchitectureLayerId, string[]>> = {
    market_radar: ['radar'], hermes_scout: ['hermes'], jefe_decision: ['jefe', 'factory-architecture-blueprint'],
    canonical_memory: ['memory'], codex_constructor: ['codex', 'factory-project-contract'], jefe_review: ['jefe'],
    unit_integration_tests: ['typescript-strict', 'eslint', 'prettier', 'vitest', 'msw'],
    browser_qa: ['playwright-test', 'playwright-cli', 'axe-core'],
    security_quality_performance: ['gitleaks', 'semgrep', 'trivy', 'axe-core', 'lighthouse-ci', 'owasp-zap'],
    ai_prompt_evaluation: ['promptfoo', 'opentelemetry', 'langfuse'], release_approval: ['jefe', 'github-actions'],
    staging: ['github-actions', 'docker-selective'], post_deploy_tests: ['playwright-test', 'axe-core', 'lighthouse-ci'],
    production: ['github-releases', 'github-actions'], analytics_monetization: ['umami', 'posthog'], learning_memory: ['memory'],
  }
  const originMap: Record<FactoryArchitectureLayerId, FactoryComponentOrigin> = {
    market_radar: 'internal_module', hermes_scout: 'external_tool', jefe_decision: 'internal_module', canonical_memory: 'internal_module',
    codex_constructor: 'external_tool', jefe_review: 'internal_module', unit_integration_tests: 'external_tool', browser_qa: 'external_tool',
    security_quality_performance: 'workflow_gate', ai_prompt_evaluation: 'external_tool', release_approval: 'workflow_gate', staging: 'workflow_gate',
    post_deploy_tests: 'workflow_gate', production: 'workflow_gate', analytics_monetization: 'service_future', learning_memory: 'internal_module',
  }
  return FACTORY_ARCHITECTURE_LAYER_ORDER.map((layerId, index) => ({
    layerId, order: index + 1, name: layerId.replaceAll('_', ' '), actor: actors[layerId],
    responsibility: `Govern ${layerId.replaceAll('_', ' ')} with explicit evidence and approval.`,
    toolIds: [...(toolMap[layerId] ?? [])], outputs: [`${layerId}-evidence`],
    origin: originMap[layerId],
    ownership: ['internal_module', 'workflow_gate'].includes(originMap[layerId]) ? 'jefe_core' : originMap[layerId] === 'external_standard' ? 'shared_standard' : 'external_provider',
  }))
}

function makeComponents(): FactoryArchitectureComponent[] {
  return [
    { componentId: 'jefe-hermes-adapter', name: 'JefeHermesAdapter', role: 'Future JEFE-owned adapter governing Hermes Agent requests, permissions, evidence, reports and handoff.', governs: ['permissions', 'research-request', 'evidence', 'research-report', 'handoff-to-jefe'], origin: 'adapter', integrationMode: 'read_only_adapter', adapterRequired: false, ownership: 'jefe_core', mayModifyCode: false, mayModifyRepo: false, mayApprove: false, mayDeploy: false, mayReadExternalSources: false, requiresHumanApproval: true, notes: ['Concept only; no real Hermes integration in v1.'], runtimeIntegrated: false },
    { componentId: 'jefe-codex-adapter', name: 'JefeCodexAdapter', role: 'Future supervised construction adapter.', governs: ['construction-request', 'permissions', 'correction-plan', 'evidence-return'], origin: 'adapter', integrationMode: 'supervised_constructor', adapterRequired: false, ownership: 'jefe_core', mayModifyCode: false, mayModifyRepo: false, mayApprove: false, mayDeploy: false, mayReadExternalSources: false, requiresHumanApproval: true, notes: ['Concept only.'], runtimeIntegrated: false },
    { componentId: 'release-review-gate', name: 'JEFE Release Review Gate', role: 'Blocks staging until JEFE release readiness approval.', governs: ['acceptance-review', 'regression-report', 'release-readiness'], origin: 'workflow_gate', integrationMode: 'evidence_gate', adapterRequired: false, ownership: 'jefe_core', mayModifyCode: false, mayModifyRepo: false, mayApprove: true, mayDeploy: false, mayReadExternalSources: false, requiresHumanApproval: true, notes: ['Tests and tools provide evidence but never approve alone.'], runtimeIntegrated: false },
    { componentId: 'staging-gate', name: 'Staging Gate', role: 'Allows staging only after JEFE readiness.', governs: ['staging-entry'], origin: 'workflow_gate', integrationMode: 'evidence_gate', adapterRequired: false, ownership: 'jefe_core', mayModifyCode: false, mayModifyRepo: false, mayApprove: false, mayDeploy: false, mayReadExternalSources: false, requiresHumanApproval: true, notes: [], runtimeIntegrated: false },
    { componentId: 'production-gate', name: 'Production Gate', role: 'Allows production after post-deploy evidence and approval.', governs: ['production-entry', 'rollback'], origin: 'workflow_gate', integrationMode: 'evidence_gate', adapterRequired: false, ownership: 'jefe_core', mayModifyCode: false, mayModifyRepo: false, mayApprove: false, mayDeploy: false, mayReadExternalSources: false, requiresHumanApproval: true, notes: [], runtimeIntegrated: false },
    { componentId: 'generated-apps', name: 'Generated applications', role: 'Independent products created by JEFE with traceability-only links.', governs: ['own-repository', 'own-runtime'], origin: 'generated_project_component', integrationMode: 'independent_runtime', adapterRequired: false, ownership: 'generated_project', mayModifyCode: false, mayModifyRepo: false, mayApprove: false, mayDeploy: false, mayReadExternalSources: false, requiresHumanApproval: true, notes: ['Must not depend on JEFE runtime.'], runtimeIntegrated: false },
  ]
}

function makeGates(): FactoryGate[] {
  return FACTORY_ARCHITECTURE_LAYER_ORDER.slice(0, -1).map((fromLayer, index) => ({
    gateId: `gate-${fromLayer}`, fromLayer, toLayer: FACTORY_ARCHITECTURE_LAYER_ORDER[index + 1],
    gateType: fromLayer === 'security_quality_performance' ? 'security' : fromLayer === 'ai_prompt_evaluation' ? 'ai_evaluation' : fromLayer === 'release_approval' || fromLayer === 'staging' || fromLayer === 'post_deploy_tests' ? 'deployment' : fromLayer === 'analytics_monetization' ? 'analytics' : 'quality',
    requiredEvidence: [`${fromLayer}-evidence`], acceptanceCriteria: ['Required evidence exists.', 'Blocking findings are resolved or explicitly rejected.'],
    approver: fromLayer === 'release_approval' || fromLayer === 'staging' || fromLayer === 'post_deploy_tests' || fromLayer === 'production' ? 'JEFE_AND_HUMAN' : 'JEFE',
    codexSelfApprovalAllowed: false, humanApprovalRequired: fromLayer === 'release_approval' || fromLayer === 'staging' || fromLayer === 'post_deploy_tests' || fromLayer === 'production',
  })) as FactoryGate[]
}

function makePhases(): FactoryImplementationPhase[] {
  const phases: Array<[string, string, FactoryArchitectureLayerId[]]> = [
    ['radar-foundation', 'Define Radar contracts and opportunity scoring.', ['market_radar']],
    ['research-governance', 'Add read-only Hermes and canonical memory boundaries.', ['hermes_scout', 'jefe_decision', 'canonical_memory']],
    ['construction-review', 'Formalize Codex construction and JEFE review loops.', ['codex_constructor', 'jefe_review']],
    ['automated-quality', 'Adopt unit, integration, browser and security gates incrementally.', ['unit_integration_tests', 'browser_qa', 'security_quality_performance']],
    ['ai-release', 'Add prompt evaluation and governed release approval.', ['ai_prompt_evaluation', 'release_approval']],
    ['delivery-feedback', 'Add staging, post-deploy, production and learning loops.', ['staging', 'post_deploy_tests', 'production', 'analytics_monetization', 'learning_memory']],
  ]
  return phases.map(([phaseId, objective, layerIds], index) => ({ phaseId, order: index + 1, name: phaseId.replaceAll('-', ' '), objective, layerIds, dependencies: index === 0 ? [] : [phases[index - 1][0]], acceptanceCriteria: ['Phase contracts validated.', 'Evidence and rollback documented.'], rollback: 'Revert the phase integration without changing project contracts.' }))
}

export interface CreateDefaultFactoryArchitectureBlueprintV1Input { createdAt: string; owner?: string }

export function createDefaultFactoryArchitectureBlueprintV1(input: CreateDefaultFactoryArchitectureBlueprintV1Input): FactoryArchitectureBlueprintV1 {
  return JSON.parse(JSON.stringify({
    blueprintVersion: FACTORY_ARCHITECTURE_BLUEPRINT_VERSION,
    blueprintKind: FACTORY_ARCHITECTURE_BLUEPRINT_KIND,
    schemaVersion: FACTORY_ARCHITECTURE_SCHEMA_VERSION,
    createdAt: input.createdAt,
    ...(input.owner ? { owner: input.owner } : {}),
    projectName: 'JEFE / ORQUESTADOR',
    layers: makeLayers(), tools: TOOL_SEEDS.map(makeTool), components: makeComponents(), gates: makeGates(), implementationPhases: makePhases(),
    decisions: [
      { decisionId: 'free-first', statement: 'Adopt free and open-source tools first.', rationale: 'Control recurring cost and complexity.', status: 'approved' },
      { decisionId: 'independent-products', statement: 'Generated products own their repository and runtime.', rationale: 'JEFE is the factory, not the product runtime.', status: 'approved' },
      { decisionId: 'incremental-tooling', statement: 'Adopt tools only behind measured triggers.', rationale: 'Avoid tooling by fashion.', status: 'approved' },
    ],
    risks: [
      { riskId: 'premature-automation', description: 'Automating approval before contracts mature.', severity: 'high', mitigation: 'Keep JEFE and human gates explicit.' },
      { riskId: 'project-contamination', description: 'Generated vertical logic leaks into JEFE core.', severity: 'high', mitigation: 'Enforce independent roots, repos and traceability-only links.' },
      { riskId: 'tool-sprawl', description: 'Overlapping tools increase cost and maintenance.', severity: 'medium', mitigation: 'Require triggers, acceptance criteria and rollback.' },
    ],
    economics: { freeFirst: true, paidAllowedOnlyForOpenAITokens: true, avoidDuplicateTools: true, requireCostJustification: true, expectedCost: 'Near-zero platform cost initially; variable OpenAI token/API cost only when explicitly approved.' },
    independence: { generatedProjectsMustHaveOwnRepo: true, generatedProjectsMustNotDependOnJefeRuntime: true, generatedProjectsMustHaveTraceabilityOnly: true, verticalHardcodingForbiddenInCore: true },
    actorPolicy: { codexCanSelfApprove: false, hermesCanModifyCode: false, memoryGlobalPromotionRequiresReview: true, jefeOwnsFinalDecision: true },
    correctionLoop: {
      policy: { afterTestsReturnToJefe: true, afterQaReturnToJefe: true, afterSecurityReturnToJefe: true, afterPromptEvalReturnToJefe: true, codexSelfApprovalAllowed: false, jefeMustCompareAgainstBrief: true, jefeMustCompareAgainstContract: true, jefeMustCompareAgainstAcceptanceCriteria: true, jefeMustCompareAgainstEvidence: true, correctionLoopRequiredBeforeRelease: true, humanEscalationOnRepeatedFailure: true, maxCorrectionRoundsDefault: 3, allowHumanOverride: true, regressionDetectionRequired: true, releaseReadinessRequiresJefeApproval: true },
      jefeReviewGate: { gateId: 'jefe-acceptance-review', origin: 'workflow_gate', required: true, approver: 'JEFE', returnFromLayers: ['unit_integration_tests', 'browser_qa', 'security_quality_performance', 'ai_prompt_evaluation'], comparesAgainst: ['opportunity', 'hermes-research', 'brief', 'FactoryProjectContract', 'acceptance-criteria', 'evidence', 'tests', 'visual-qa', 'security', 'performance', 'monetization'], stagingRequiresThisGate: true },
      sequence: ['quality-evidence', 'jefe-acceptance-review', 'factory-correction-plan-if-needed', 'codex-correction', 'regression-tests', 'jefe-review-repeat', 'release-readiness-or-human-escalation'],
      directToStagingForbiddenFrom: ['unit_integration_tests', 'browser_qa', 'security_quality_performance', 'ai_prompt_evaluation'],
    },
    futureConcepts: [
      { conceptKind: 'FactoryAcceptanceReview', implemented: false, purpose: 'Compare delivery against opportunity, research, brief, contract, acceptance criteria and evidence.' },
      { conceptKind: 'FactoryCorrectionPlan', implemented: false, purpose: 'Describe bounded corrections for Codex after JEFE review.' },
      { conceptKind: 'FactoryCorrectionRound', implemented: false, purpose: 'Track one correction, regression and re-review iteration.' },
      { conceptKind: 'FactoryReleaseReadiness', implemented: false, purpose: 'Record JEFE approval before staging or release.' },
      { conceptKind: 'FactoryRegressionReport', implemented: false, purpose: 'Prove corrections did not break previously accepted behavior.' },
    ],
  })) as FactoryArchitectureBlueprintV1
}
