function normalizeGeneratedDomainHelperString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function summarizeGeneratedDomainHelperStrings(entries, limit = 24) {
  const values = []
  const seen = new Set()

  for (const entry of Array.isArray(entries) ? entries : []) {
    const value = normalizeGeneratedDomainHelperString(entry)
    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    values.push(value)

    if (values.length >= limit) {
      break
    }
  }

  return values
}

function buildDefaultGeneratedDomainStackProfile() {
  return {
    requested: false,
    frontend: null,
    backend: null,
    database: null,
    apiStyle: null,
    auth: null,
    styling: null,
    testing: null,
    packageManager: null,
    runtime: null,
  }
}

function buildDefaultGeneratedDomainGeneratorReadiness() {
  return {
    requested: false,
    supportedNow: true,
    specializedGeneratorRequired: false,
    templateFamily: 'generic-sandbox-fullstack-local',
    blockingReasons: [],
  }
}

function normalizeGeneratedDomainStackProfile(stackProfile, structuralCapabilities = null) {
  const defaults = buildDefaultGeneratedDomainStackProfile()
  const requestedByCapabilities = structuralCapabilities?.stackProfileRequested === true

  if (!stackProfile || typeof stackProfile !== 'object') {
    return {
      ...defaults,
      requested: requestedByCapabilities,
    }
  }

  return {
    ...defaults,
    requested: stackProfile.requested === true || requestedByCapabilities,
    frontend: normalizeGeneratedDomainHelperString(stackProfile.frontend) || null,
    backend: normalizeGeneratedDomainHelperString(stackProfile.backend) || null,
    database: normalizeGeneratedDomainHelperString(stackProfile.database) || null,
    apiStyle: normalizeGeneratedDomainHelperString(stackProfile.apiStyle) || null,
    auth: normalizeGeneratedDomainHelperString(stackProfile.auth) || null,
    styling: normalizeGeneratedDomainHelperString(stackProfile.styling) || null,
    testing: normalizeGeneratedDomainHelperString(stackProfile.testing) || null,
    packageManager:
      normalizeGeneratedDomainHelperString(stackProfile.packageManager) || null,
    runtime: normalizeGeneratedDomainHelperString(stackProfile.runtime) || null,
  }
}

function normalizeGeneratedDomainGeneratorReadiness({
  generatorReadiness = null,
  structuralCapabilities = null,
} = {}) {
  const defaults = buildDefaultGeneratedDomainGeneratorReadiness()

  if (generatorReadiness && typeof generatorReadiness === 'object') {
    return {
      ...defaults,
      requested: generatorReadiness.requested === true,
      supportedNow: generatorReadiness.supportedNow !== false,
      specializedGeneratorRequired:
        generatorReadiness.specializedGeneratorRequired === true,
      templateFamily:
        normalizeGeneratedDomainHelperString(generatorReadiness.templateFamily) ||
        defaults.templateFamily,
      blockingReasons: summarizeGeneratedDomainHelperStrings(
        generatorReadiness.blockingReasons,
        32,
      ),
    }
  }

  return {
    ...defaults,
    requested: structuralCapabilities?.stackProfileRequested === true,
    supportedNow: structuralCapabilities?.generatorSupportedNow !== false,
    specializedGeneratorRequired:
      structuralCapabilities?.requiresSpecializedGenerator === true,
    templateFamily:
      normalizeGeneratedDomainHelperString(structuralCapabilities?.templateFamily) ||
      defaults.templateFamily,
    blockingReasons: summarizeGeneratedDomainHelperStrings(
      structuralCapabilities?.unsupportedStackReasons,
      32,
    ),
  }
}

function isGeneratedDomainUnsupportedRequestedStack(generatorReadiness) {
  return generatorReadiness?.requested === true && generatorReadiness?.supportedNow !== true
}

function shouldUseGeneratedDomainSpecializedTemplateBundle(generatorReadiness) {
  return (
    generatorReadiness?.supportedNow === true &&
    normalizeGeneratedDomainHelperString(generatorReadiness?.templateFamily) !== '' &&
    normalizeGeneratedDomainHelperString(generatorReadiness?.templateFamily) !==
      'generic-sandbox-fullstack-local'
  )
}

module.exports = {
  buildDefaultGeneratedDomainGeneratorReadiness,
  buildDefaultGeneratedDomainStackProfile,
  normalizeGeneratedDomainGeneratorReadiness,
  normalizeGeneratedDomainStackProfile,
  isGeneratedDomainUnsupportedRequestedStack,
  shouldUseGeneratedDomainSpecializedTemplateBundle,
}