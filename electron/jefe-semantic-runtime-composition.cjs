const fs = require('node:fs/promises')
const path = require('node:path')
const contract = require('./jefe-project-contract.cjs')
const registry = require('./jefe-project-registry.cjs')
const generation = require('./jefe-real-generation.cjs')
const { createProjectPersistence } = require('./jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('./jefe-preview-approval.cjs')
const intelligence = require('./jefe-semantic-intelligence.cjs')
const { buildSemanticGenerationSpec, buildExecutionPackage } = require('./jefe-semantic-correction-lifecycle.cjs')
const { createSemanticProductionPromotion } = require('./jefe-semantic-production-promotion.cjs')
const { createSemanticRuntimeAdapter } = require('./jefe-semantic-runtime-adapter.cjs')

function createSemanticRuntimeComposition({ root, feedbackProvider = null, decisionProvider = null } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) throw Object.assign(new Error('A semantic runtime root is required.'), { code: 'INVALID_ROOT' })
  const persistence = createProjectPersistence({ root })
  const preview = createPreviewApprovalService({ root })
  const promotion = createSemanticProductionPromotion({ root })
  const resolveFeedback = feedbackProvider || (async ({ project, sourceVersionId }) => {
    const approval = await preview.findRejectedApproval(project.projectId, sourceVersionId)
    if (!approval) throw Object.assign(new Error('No rejected human feedback exists for the source version.'), { code: 'HUMAN_FEEDBACK_REQUIRED' })
    return intelligence.buildHumanFeedback({ approval: { ...approval, state: 'rejected' }, projectBrief: project.planning })
  })
  const resolveDecision = decisionProvider || (async () => ({ semanticGates: 'PASS', preservedQualities: ['business-intent', 'responsive'], prohibitedChanges: ['source-version-immutable'] }))
  const resolveExecution = async ({ projectId, sourceVersionId }) => {
    const source = await persistence.getVersionRecord(projectId, sourceVersionId)
    if (!source) throw Object.assign(new Error('La versión fuente no existe.'), { code: 'VERSION_NOT_FOUND' })
    const feedback = await resolveFeedback({ project: source.project, sourceVersionId, sourceRecord: source })
    const understanding = intelligence.buildBusinessUnderstandingV2({ brief: { audience: source.project.planning?.audience || 'usuarios del servicio', objective: source.project.planning?.objective || 'presentar una propuesta clara', services: source.project.planning?.services || ['servicio principal'], customerNeeds: source.project.planning?.customerNeeds || ['decidir con claridad'], trustDrivers: source.project.planning?.trustDrivers || ['acompañamiento'], conversionActions: source.project.planning?.conversionActions || ['conversar'] }, feedback })
    const correctionPlan = intelligence.createCorrectionPlan({ feedback, businessUnderstanding: understanding })
    const contentPlan = intelligence.buildContentPlanV2(understanding)
    const experiencePlan = intelligence.buildExperiencePlanV2(understanding)
    const decision = await resolveDecision({ project: source.project, sourceVersionId, feedback, understanding, contentPlan, experiencePlan })
    const generationSpec = { ...buildSemanticGenerationSpec({ contentPlan, experiencePlan, creativeDirection: source.project.visualDirection, preservedQualities: decision.preservedQualities, prohibitedChanges: decision.prohibitedChanges }), planning: source.project.planning, sectionOrder: ['relato', 'servicios', 'confianza', 'faq', 'contacto'], heroVariant: 'focused', treatments: ['semantic-correction'], contentDensity: 'balanced', ctaStrategy: 'consultation' }
    const packageValue = buildExecutionPackage({ correctionPlan, businessUnderstanding: understanding, contentPlan, experiencePlan, semanticGates: decision.semanticGates, provenance: { source: 'JEFE', generatedBy: 'JEFE' }, generationSpec, humanFeedbackRef: `human-feedback:${feedback.correctionId || sourceVersionId}`, sourceProjectId: projectId, sourceVersionId, sourceSnapshotSha256: feedback.snapshot.snapshotSha256, correctionId: feedback.correctionId || `correction-${sourceVersionId}` })
    const candidateRoot = path.join(path.resolve(root), '.jefe-semantic-candidates', projectId, 'version-candidate')
    await fs.rm(candidateRoot, { recursive: true, force: true })
    const target = contract.normalizeProjectContract({ ...source.project, activeVersionId: 'version-candidate', runId: 'run-candidate', physicalPaths: { projectRoot: candidateRoot, manifestPath: path.join(candidateRoot, 'manifest.json'), deliveryPath: null }, timestamps: { ...source.project.timestamps, updatedAt: new Date().toISOString() }, versions: [{ ...source.project.versions[0], versionId: 'version-candidate', runId: 'run-candidate' }] }, { allowedRoots: [root] })
    await generation.materializeProject({ project: target, destinationRoot: path.join(path.resolve(root), '.jefe-semantic-candidates'), capabilities: registry.CAPABILITY_MATRIX, profileContext: { generationMode: 'semantic_correction', semanticGenerationSpec: generationSpec, projectName: source.project.projectName, businessType: source.project.planning?.businessType, audience: source.project.planning?.audience, brief: source.project.planning?.objective }, providedAssets: [] })
    return { executionPackage: packageValue, sourceManifestPath: source.manifestPath, candidateRoot }
  }
  return { persistence, preview, promotion, adapter: createSemanticRuntimeAdapter({ service: promotion, resolveExecution }) }
}

module.exports = { createSemanticRuntimeComposition }
