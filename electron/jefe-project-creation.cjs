const path = require('path')
const registry = require('./jefe-project-registry.cjs')
const contract = require('./jefe-project-contract.cjs')
const generation = require('./jefe-real-generation.cjs')
const productPlanning = require('./jefe-product-planning.cjs')

class ProjectCreationError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'ProjectCreationError'
    this.code = code
    this.details = details
  }
}

function fail(code, message, details) {
  throw new ProjectCreationError(code, message, details)
}

function optionalText(value, field, maxLength = 800) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') fail('INVALID_CREATE_INPUT', `${field} debe ser texto.`, { field })
  const normalized = value.trim().replace(/\s+/gu, ' ')
  if (!normalized || normalized.length > maxLength) fail('INVALID_CREATE_INPUT', `${field} es vacío o supera el máximo.`, { field, maxLength })
  return normalized
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function normalizeRoots(destinationRoot, value) {
  const roots = Array.isArray(value) && value.length > 0 ? value : [destinationRoot]
  const normalized = roots.map((root) => {
    if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ALLOWED_ROOT', 'allowedRoots debe contener rutas absolutas.', { root })
    return path.resolve(root)
  })
  if (!normalized.some((root) => isInside(root, destinationRoot))) fail('PATH_OUTSIDE_ROOT', 'destinationRoot queda fuera de allowedRoots.', { destinationRoot, allowedRoots: normalized })
  return normalized
}

function adaptLegacyRun(runId, options) {
  if (typeof runId !== 'string') return null
  return {
    ...options,
    runId,
    projectId: options.projectId || `project-${runId}`,
    versionId: options.versionId || `version-${runId}`,
    projectType: options.projectType || registry.detectProjectType(options.brief || options.projectName || ''),
    generationProfile: options.generationProfile || 'factory_typed',
    compatibility: 'legacy_run_argument',
  }
}

function normalizeRequest(input, options) {
  const legacy = adaptLegacyRun(input, options)
  const source = legacy || input
  if (!source || typeof source !== 'object' || Array.isArray(source)) fail('INVALID_CREATE_INPUT', 'La creación requiere un objeto de solicitud o un runId compatible.')
  const destinationCandidate = source.destinationRoot || source.targetRoot || options.destinationRoot || options.targetRoot
  if (typeof destinationCandidate !== 'string' || !path.isAbsolute(destinationCandidate)) fail('INVALID_DESTINATION_ROOT', 'destinationRoot o targetRoot debe ser absoluto.')
  const destinationRoot = path.resolve(destinationCandidate)
  const allowedRoots = normalizeRoots(destinationRoot, source.allowedRoots || options.allowedRoots)
  const profile = source.generationProfile || 'factory_typed'
  const projectType = source.projectType || registry.detectProjectType(source.brief || source.projectName || '')
  const definition = registry.getProjectTypeDefinition(projectType)
  if (!registry.isKnownProjectType(projectType)) fail('INVALID_PROJECT_TYPE', 'El tipo de proyecto no está registrado.', { projectType })
  const platform = source.platform || definition.targetPlatform
  if (platform !== definition.targetPlatform) fail('TYPE_PLATFORM_MISMATCH', 'La plataforma no coincide con el tipo de proyecto.', { projectType, platform, expected: definition.targetPlatform })
  if (!registry.GENERATION_PROFILE_IDS.includes(profile)) fail('INVALID_GENERATION_PROFILE', 'El perfil no está soportado.', { profile })
  if (profile === 'commercial_site' && platform !== 'web') fail('PROFILE_PLATFORM_MISMATCH', 'commercial_site sólo admite plataforma web.', { platform })
  const direction = source.creativeDirection || source.visualDirection || null
  if (profile === 'commercial_site' && !direction) fail('MISSING_VISUAL_DIRECTION', 'commercial_site requiere dirección visual explícita.')
  const now = new Date().toISOString()
  const versionId = source.versionId
  const projectId = source.projectId
  const runId = source.runId
  const projectRoot = path.resolve(destinationRoot, String(projectId || ''), String(versionId || ''))
  if (!isInside(destinationRoot, projectRoot) || !allowedRoots.some((root) => isInside(root, projectRoot))) {
    fail('PATH_OUTSIDE_ROOT', 'El destino de la versión queda fuera del root permitido.', { destinationRoot, projectId, versionId })
  }
  return {
    destinationRoot,
    allowedRoots,
    compatibility: source.compatibility || null,
    profileContext: {
      projectName: optionalText(source.projectName, 'projectName', 120),
      businessType: optionalText(source.businessType, 'businessType', 160),
      audience: optionalText(source.audience, 'audience', 240),
      proposition: optionalText(source.proposition, 'proposition', 500),
      brief: optionalText(source.brief, 'brief', 4000),
      objective: optionalText(source.objective || source.brief, 'objective', 600),
      problem: optionalText(source.problem, 'problem', 600),
      primaryCta: optionalText(source.primaryCta, 'primaryCta', 120),
      tone: optionalText(source.tone, 'tone', 120),
      visualNotes: optionalText(source.visualNotes || (source.brandSpec && source.brandSpec.visualNotes), 'visualNotes', 600),
    },
    providedAssets: Array.isArray(source.providedAssets) ? source.providedAssets : [],
    failureInjection: source.testFailureInjection || null,
    draft: {
      projectId,
      runId,
      projectType,
      platform,
      generationProfile: profile,
      visualDirection: direction,
      brandSpec: source.brandSpec || { name: source.projectName || null },
      inputAssets: source.inputAssets || {},
      planning: source.planning || productPlanning.createProductPlanning({
        projectName: source.projectName,
        brief: source.brief,
        objective: source.objective || source.brief,
        problem: source.problem,
        audience: source.audience,
        businessType: source.businessType,
        proposition: source.proposition,
        primaryCta: source.primaryCta,
        tone: source.tone,
        visualDirection: direction,
        productType: projectType,
        colors: source.inputAssets && source.inputAssets.detectedHexColors,
        manualBrandColors: source.inputAssets && source.inputAssets.manualBrandColors,
        visualNotes: source.visualNotes || (source.brandSpec && source.brandSpec.visualNotes),
        materials: { files: source.inputAssets && source.inputAssets.files, references: source.inputAssets && source.inputAssets.urlReferences, colors: source.inputAssets && source.inputAssets.detectedHexColors, manualBrandColors: source.inputAssets && source.inputAssets.manualBrandColors, notes: source.inputAssets && source.inputAssets.visualNotes },
      }),
      manifest: { manifestId: source.manifestId || `manifest-${versionId}` },
      physicalPaths: { projectRoot, manifestPath: path.join(projectRoot, 'manifest.json'), deliveryPath: null },
      timestamps: { createdAt: source.createdAt || now, updatedAt: now },
      changeOrigin: source.changeOrigin || { kind: 'integration', reference: 'canonical-project-creation' },
      delivery: { status: 'not_ready' },
      versions: [{
        versionId,
        runId,
        createdAt: source.createdAt || now,
        changeOrigin: source.changeOrigin || { kind: 'integration', reference: 'canonical-project-creation' },
        deliveryPath: null,
        summary: optionalText(source.summary, 'summary', 500),
      }],
      activeVersionId: versionId,
    },
  }
}

function structuredError(error) {
  if (error instanceof ProjectCreationError || error instanceof contract.ProjectContractError || error instanceof generation.MaterializationError) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return { code: 'CREATION_FAILED', message: error instanceof Error ? error.message : String(error), details: {} }
}

/**
 * Única entrada pública de creación. Acepta la solicitud canónica y, de forma
 * transitoria, un runId con opciones; ambos caminos se normalizan inmediatamente.
 */
async function createFirstVersionFromRun(input, options = {}) {
  try {
    const request = normalizeRequest(input, options)
    const project = contract.normalizeProjectContract(request.draft, { allowedRoots: request.allowedRoots })
    const materialized = await generation.materializeProject({
      project,
      destinationRoot: request.destinationRoot,
      capabilities: registry.CAPABILITY_MATRIX,
      profileContext: request.profileContext,
      providedAssets: request.providedAssets,
      failureInjection: request.failureInjection,
    })
    return {
      ok: true,
      status: 'created',
      compatibility: request.compatibility,
      project,
      artifacts: {
        projectRoot: materialized.projectRoot,
        manifestPath: materialized.manifestPath,
        artifactPaths: materialized.artifactPaths,
        deliveryStatus: project.delivery.status,
      },
    }
  } catch (error) {
    return { ok: false, status: 'rejected', error: structuredError(error) }
  }
}

async function reopenFirstVersion(manifestPath, options = {}) {
  try {
    if (!Array.isArray(options.allowedRoots) || options.allowedRoots.length === 0) fail('MISSING_ALLOWED_ROOTS', 'La reapertura requiere allowedRoots explícitos.')
    const reopened = await generation.readMaterializedManifest(manifestPath, {
      deserializeProjectContract: contract.deserializeProjectContract,
      allowedRoots: options.allowedRoots,
    })
    return { ok: true, ...reopened }
  } catch (error) {
    return { ok: false, error: structuredError(error) }
  }
}

module.exports = {
  createFirstVersionFromRun,
  reopenFirstVersion,
  COMPATIBILITY_NOTE: 'Un argumento runId se adapta transitoriamente a la solicitud canónica; no crea un segundo modelo interno.',
}
