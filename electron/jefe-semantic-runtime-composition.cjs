const fs = require('node:fs/promises')
const path = require('node:path')
const contract = require('./jefe-project-contract.cjs')
const registry = require('./jefe-project-registry.cjs')
const generation = require('./jefe-real-generation.cjs')
const { createProjectPersistence } = require('./jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('./jefe-preview-approval.cjs')
const intelligence = require('./jefe-semantic-intelligence.cjs')
const { createOpenAISemanticProvider, providerHealth, providerConfig, SEMANTIC_SCHEMA, CONTENT_PLAN_SCHEMA, EXPERIENCE_PLAN_SCHEMA, experiencePlanSchemaForCatalog, validateContentPlanDecision, ProviderRunBudget } = require('./jefe-semantic-provider.cjs')
const { buildSemanticGenerationSpec, buildExecutionPackage } = require('./jefe-semantic-correction-lifecycle.cjs')
const { adaptSemanticPlansToPlanning, buildContentSectionCatalog, contentSectionCatalogHash } = require('./jefe-semantic-generation-adapter.cjs')
const { createSemanticProductionPromotion } = require('./jefe-semantic-production-promotion.cjs')
const { createSemanticRuntimeAdapter } = require('./jefe-semantic-runtime-adapter.cjs')
const { createSemanticModelRouter } = require('./jefe-semantic-model-router.cjs')
const { deriveSemanticRunTimeoutMs } = require('./jefe-semantic-timeout.cjs')

function createSemanticRuntimeComposition({ root, feedbackProvider = null, decisionProvider = null, semanticProvider = null, semanticBrainAdapter = null, mode = 'synthetic', env = process.env, callBudget = null } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) throw Object.assign(new Error('A semantic runtime root is required.'), { code: 'INVALID_ROOT' })
  const persistence = createProjectPersistence({ root })
  const preview = createPreviewApprovalService({ root })
  const promotion = createSemanticProductionPromotion({ root })
  const productive = mode === 'productive'
  const runBudget = callBudget || (productive ? new ProviderRunBudget({ runId: `semantic-composition-${Date.now()}`, maxCalls: 4 }) : null)
  const semanticProviderConfig = productive ? providerConfig({ env }) : null
  const runTimeoutMs = productive ? deriveSemanticRunTimeoutMs({ maxCalls: runBudget?.maxCalls, providerOperationTimeoutMs: semanticProviderConfig?.backgroundDeadlineMs }) : undefined
  const modelRouter = createSemanticModelRouter({ env, callBudget: runBudget })
  const provider = semanticProvider || (productive ? createOpenAISemanticProvider({ env, callBudget: runBudget }) : null)
  const brain = semanticBrainAdapter || (provider ? intelligence.createSemanticBrainAdapter({ provider }) : null)
  const health = provider ? providerHealth(provider, { readyForRealSemanticWork: provider.enabled && provider.credentialAvailable && Boolean(brain) }) : { configured: false, enabled: false, credentialAvailable: false, model: null, readyForRealSemanticWork: false }
  function requireProductiveProvider() {
    if (!productive) return
    if (!provider || !brain || !health.enabled || !health.credentialAvailable || !health.readyForRealSemanticWork) throw Object.assign(new Error('El provider semántico no está listo.'), { code: 'SEMANTIC_PROVIDER_NOT_READY', details: { configured: Boolean(provider), enabled: Boolean(health.enabled), credentialAvailable: Boolean(health.credentialAvailable), ready: Boolean(health.readyForRealSemanticWork) } })
  }
  const resolveFeedback = feedbackProvider || (async ({ project, sourceVersionId }) => {
    const approval = await preview.findRejectedApproval(project.projectId, sourceVersionId)
    if (!approval) throw Object.assign(new Error('No rejected human feedback exists for the source version.'), { code: 'HUMAN_FEEDBACK_REQUIRED' })
    return intelligence.buildHumanFeedback({ approval: { ...approval, state: 'rejected' }, projectBrief: project.planning })
  })
  const resolveDecision = decisionProvider || (async () => ({ semanticGates: 'PASS', preservedQualities: ['business-intent', 'responsive'], prohibitedChanges: ['source-version-immutable'] }))
  const resolveExecution = async ({ projectId, sourceVersionId }, { onPhase = async () => {}, onPhaseStart = () => {} } = {}) => {
    requireProductiveProvider()
    const source = await persistence.getVersionRecord(projectId, sourceVersionId)
    if (!source) throw Object.assign(new Error('La versión fuente no existe.'), { code: 'VERSION_NOT_FOUND' })
    onPhaseStart('HUMAN_FEEDBACK_LOADED')
    const feedback = await resolveFeedback({ project: source.project, sourceVersionId, sourceRecord: source })
    await onPhase('HUMAN_FEEDBACK_LOADED', { correctionRounds: feedback.correctionRound || 1 })
    const brief = { audience: source.project.planning?.audience || 'usuarios del servicio', objective: source.project.planning?.objective || 'presentar una propuesta clara', services: source.project.planning?.services || ['servicio principal'], customerNeeds: source.project.planning?.customerNeeds || ['decidir con claridad'], trustDrivers: source.project.planning?.trustDrivers || ['acompañamiento'], conversionActions: source.project.planning?.conversionActions || ['conversar'] }
    const realPlans = productive ? await runSemanticPlans({ brief, feedback, sourceRefs: [`semantic-source:${projectId}:${sourceVersionId}`], onPhase, onPhaseStart }) : null
    if (!realPlans) onPhaseStart('BUSINESS_UNDERSTANDING_READY')
    const understanding = realPlans ? realPlans.businessUnderstanding.decision : intelligence.buildBusinessUnderstandingV2({ brief, feedback })
    if (!realPlans) await onPhase('BUSINESS_UNDERSTANDING_READY')
    onPhaseStart('CORRECTION_PLAN_READY')
    const correctionPlan = intelligence.createCorrectionPlan({ feedback, businessUnderstanding: understanding })
    await onPhase('CORRECTION_PLAN_READY')
    onPhaseStart('CONTENT_PLAN_READY')
    const contentPlan = realPlans ? realPlans.contentPlan.decision : intelligence.buildContentPlanV2(understanding)
    if (!realPlans) await onPhase('CONTENT_PLAN_READY')
    onPhaseStart('EXPERIENCE_PLAN_READY')
    const experiencePlan = realPlans ? realPlans.experiencePlan.decision : intelligence.buildExperiencePlanV2(understanding)
    if (!realPlans) await onPhase('EXPERIENCE_PLAN_READY')
    onPhaseStart('SEMANTIC_GATES_PASS')
    const decision = await resolveDecision({ project: source.project, sourceVersionId, feedback, understanding, contentPlan, experiencePlan })
    await onPhase('SEMANTIC_GATES_PASS')
    const semanticPlanning = productive ? adaptSemanticPlansToPlanning({ sourcePlanning: source.project.planning, businessUnderstanding: understanding, contentPlan, experiencePlan, requireCatalogHash: true }) : source.project.planning
    onPhaseStart('GENERATION_SPEC_READY')
    const generationSpec = productive
      ? { ...buildSemanticGenerationSpec({ contentPlan, experiencePlan, creativeDirection: source.project.visualDirection, preservedQualities: decision.preservedQualities, prohibitedChanges: decision.prohibitedChanges }), planning: semanticPlanning, sectionOrder: [...semanticPlanning.experience.sections], heroVariant: experiencePlan.heroVariant, treatments: experiencePlan.sectionTreatments, contentDensity: experiencePlan.contentDensity, ctaStrategy: experiencePlan.conversionStrategy, semanticRefs: { businessUnderstanding: 'BusinessUnderstandingV2', contentPlan: 'ContentPlanV2', experiencePlan: 'ExperiencePlanV2' }, provenance: { source: 'JEFE', generatedBy: 'JEFE', generatedByModel: false } }
      : { ...buildSemanticGenerationSpec({ contentPlan, experiencePlan, creativeDirection: source.project.visualDirection, preservedQualities: decision.preservedQualities, prohibitedChanges: decision.prohibitedChanges }), planning: semanticPlanning, sectionOrder: ['relato', 'servicios', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', treatments: ['semantic-correction'], contentDensity: 'balanced', ctaStrategy: 'consultation' }
    await onPhase('GENERATION_SPEC_READY')
    const packageValue = buildExecutionPackage({ correctionPlan, businessUnderstanding: understanding, contentPlan, experiencePlan, semanticGates: decision.semanticGates, provenance: { source: 'JEFE', generatedBy: 'JEFE' }, generationSpec, humanFeedbackRef: `human-feedback:${feedback.correctionId || sourceVersionId}`, sourceProjectId: projectId, sourceVersionId, sourceSnapshotSha256: feedback.snapshot.snapshotSha256, correctionId: feedback.correctionId || `correction-${sourceVersionId}` })
    const candidateRoot = path.join(path.resolve(root), '.jefe-semantic-candidates', projectId, 'version-candidate')
    await fs.rm(candidateRoot, { recursive: true, force: true })
    const target = contract.normalizeProjectContract({ ...source.project, activeVersionId: 'version-candidate', runId: 'run-candidate', physicalPaths: { projectRoot: candidateRoot, manifestPath: path.join(candidateRoot, 'manifest.json'), deliveryPath: null }, timestamps: { ...source.project.timestamps, updatedAt: new Date().toISOString() }, versions: [{ ...source.project.versions[0], versionId: 'version-candidate', runId: 'run-candidate' }] }, { allowedRoots: [root] })
    onPhaseStart('CANDIDATE_READY')
    await generation.materializeProject({ project: target, destinationRoot: path.join(path.resolve(root), '.jefe-semantic-candidates'), capabilities: registry.CAPABILITY_MATRIX, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: generationSpec, projectName: source.project.projectName, businessType: source.project.planning?.businessType, audience: source.project.planning?.audience, brief: source.project.planning?.objective }, providedAssets: [] })
    await onPhase('CANDIDATE_READY', { candidateId: 'version-candidate' })
    return { executionPackage: packageValue, sourceManifestPath: source.manifestPath, candidateRoot }
  }
  async function decideSemantic(input) {
    requireProductiveProvider()
    if (!brain || typeof brain.decide !== 'function') throw Object.assign(new Error('El adapter semántico no está configurado.'), { code: 'SEMANTIC_PROVIDER_NOT_READY' })
    const routing = modelRouter.route({ operation: input.operation, ...(productive ? {} : { complexity: 'medium', risk: 'medium', qualityNeed: 'standard' }) })
    if (!routing.llmRequired) throw Object.assign(new Error('DETERMINISTIC_OPERATION_DOES_NOT_USE_PROVIDER'), { code: 'DETERMINISTIC_OPERATION_DOES_NOT_USE_PROVIDER', routing })
    if (!routing.budgetAvailable) throw Object.assign(new Error('PROVIDER_CALL_BUDGET_EXHAUSTED'), { code: 'PROVIDER_CALL_BUDGET_EXHAUSTED', routing })
    return brain.decide({ ...input, model: routing.selectedModel, reasoningEffort: routing.reasoningEffort, executionMode: routing.executionMode, routing })
  }
  async function runSemanticPlans({ brief, correctionPlan = null, feedback = null, preservedQualities = [], sourceRefs = ['synthetic-brief:composition'], onPhase = async () => {}, onPhaseStart = () => {} } = {}) {
    requireProductiveProvider()
    onPhaseStart('BUSINESS_UNDERSTANDING_READY')
    const input = [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ brief, correctionPlan, feedback, preservedQualities }) }] }]
    const bu = await decideSemantic({ operation: 'business_understanding', input, schema: SEMANTIC_SCHEMA, sourceRefs, outputBudgetRetryMax: 1, executionMode: 'background' })
    await onPhase('BUSINESS_UNDERSTANDING_READY', { semanticGenerationCalls: 1 })
    onPhaseStart('CONTENT_PLAN_READY')
    const content = await decideSemantic({ operation: 'content_plan', input: [{ role: 'system', content: [{ type: 'input_text', text: 'ContentPlanV2 FAQ debe devolver al menos cuatro objetos con question y answer separados. La pregunta debe ser natural y la respuesta útil y específica; no repitas la pregunta como respuesta ni uses lenguaje administrativo.' }] }, { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ brief, businessUnderstanding: bu.decision, correctionPlan, preservedQualities }) }] }], schema: CONTENT_PLAN_SCHEMA, sourceRefs, outputBudgetRetryMax: 1, executionMode: 'background' })
    validateContentPlanDecision(content.decision)
    await onPhase('CONTENT_PLAN_READY', { semanticGenerationCalls: 2 })
    const contentSectionCatalog = buildContentSectionCatalog(content.decision)
    const catalogHash = contentSectionCatalogHash(contentSectionCatalog)
    onPhaseStart('EXPERIENCE_PLAN_READY')
    const experience = await decideSemantic({ operation: 'experience_plan', input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ brief, businessUnderstanding: bu.decision, contentPlan: content.decision, contentSectionCatalog, contentSectionCatalogHash: catalogHash, correctionPlan, preservedQualities }) }] }], schema: experiencePlanSchemaForCatalog(contentSectionCatalog, catalogHash), sourceRefs, contentPlanRef: 'ContentPlanV2', contentSectionCatalogHash: catalogHash, outputBudgetRetryMax: 1, executionMode: 'background' })
    await onPhase('EXPERIENCE_PLAN_READY', { semanticGenerationCalls: 3 })
    return { businessUnderstanding: bu, contentPlan: content, experiencePlan: experience, providerBudget: runBudget?.snapshot?.() || null }
  }
  return { persistence, preview, promotion, semanticProvider: provider, semanticBrainAdapter: brain, modelRouter, providerHealth: health, providerRunBudget: runBudget, timeoutBudget: { runGlobalTimeoutMs: runTimeoutMs || null, providerOperationTimeoutMs: semanticProviderConfig?.backgroundDeadlineMs || null }, decideSemantic, runSemanticPlans, adapter: createSemanticRuntimeAdapter({ root, service: promotion, resolveExecution, timeoutMs: runTimeoutMs, providerOperationTimeoutMs: semanticProviderConfig?.backgroundDeadlineMs || null }) }
}

module.exports = { createSemanticRuntimeComposition }
