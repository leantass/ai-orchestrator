function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function sanitizeGeneratedDomainContractDebugPreview(value, maxLength = 240) {
  const normalized =
    typeof value === 'string'
      ? value
      : value === null || value === undefined
        ? ''
        : String(value)

  if (!normalized.trim()) {
    return ''
  }

  const compacted = normalized.replace(/\s+/gu, ' ').trim()

  return compacted.length <= maxLength
    ? compacted
    : `${compacted.slice(0, Math.max(0, maxLength - 3))}...`
}

function summarizeGeneratedDomainContractDebugEntries(entries, maxEntries = 3) {
  if (!Array.isArray(entries) || maxEntries <= 0) {
    return {
      firstEntry: undefined,
      preview: [],
    }
  }

  const preview = []
  const seen = new Set()

  for (const entry of entries) {
    const sanitized = sanitizeGeneratedDomainContractDebugPreview(entry, 240)
    if (!sanitized || seen.has(sanitized)) {
      continue
    }

    seen.add(sanitized)
    preview.push(sanitized)

    if (preview.length >= maxEntries) {
      break
    }
  }

  return {
    firstEntry: preview[0],
    preview,
  }
}

function summarizeUniqueExecutorStrings(entries, limit = 4) {
  if (!Array.isArray(entries)) {
    return []
  }

  const uniqueEntries = []
  const seenEntries = new Set()

  for (const entry of entries) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }

    const trimmedEntry = entry.trim()
    const normalizedEntry = trimmedEntry.toLocaleLowerCase()

    if (seenEntries.has(normalizedEntry)) {
      continue
    }

    seenEntries.add(normalizedEntry)
    uniqueEntries.push(trimmedEntry)

    if (uniqueEntries.length >= limit) {
      break
    }
  }

  return uniqueEntries
}

function pushUniqueMessage(target, message) {
  const normalized =
    typeof message === 'string'
      ? message.trim().replace(/\s+/gu, ' ')
      : message === null || message === undefined
        ? ''
        : String(message).trim().replace(/\s+/gu, ' ')
  if (!normalized || target.includes(normalized)) {
    return
  }
  target.push(normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`)
}

function buildLegacyDomainResolutionDiagnostics({
  safeFirstDeliveryPlan,
  scalableDeliveryPlan,
  materializationPlan,
  selectedDomain,
  selectedContractKind,
  generatedDomainContractDiagnostics,
}) {
  try {
    const safeFirstLegacy =
      safeFirstDeliveryPlan?.legacyDomainResolution &&
      typeof safeFirstDeliveryPlan.legacyDomainResolution === 'object'
        ? safeFirstDeliveryPlan.legacyDomainResolution
        : null
    const scalableLegacy =
      scalableDeliveryPlan?.legacyDomainResolution &&
      typeof scalableDeliveryPlan.legacyDomainResolution === 'object'
        ? scalableDeliveryPlan.legacyDomainResolution
        : null
    const materializationLegacy =
      materializationPlan?.legacyDomainResolution &&
      typeof materializationPlan.legacyDomainResolution === 'object'
        ? materializationPlan.legacyDomainResolution
        : null

    const safeFirstDeliveryFamilyKey =
      normalizeOptionalString(safeFirstLegacy?.safeFirstDeliveryFamilyKey) || ''
    const fullstackLocalArchetype =
      normalizeOptionalString(materializationLegacy?.fullstackLocalArchetype) ||
      normalizeOptionalString(scalableLegacy?.fullstackLocalArchetype) ||
      ''
    const canonicalMaterializationContractKind =
      normalizeOptionalString(materializationLegacy?.canonicalMaterializationContractKind) ||
      normalizeOptionalString(selectedContractKind) ||
      ''
    const canonicalSelectedDomain =
      normalizeOptionalString(materializationLegacy?.selectedDomain) ||
      normalizeOptionalString(selectedDomain) ||
      ''
    const materializationPlanProfileKey =
      normalizeOptionalString(materializationLegacy?.materializationPlanProfileKey) ||
      normalizeOptionalString(scalableLegacy?.materializationPlanProfileKey) ||
      normalizeOptionalString(fullstackLocalArchetype) ||
      ''

    const safeFirstDeliveryFamilyUsed =
      safeFirstLegacy?.usedLegacyFamily === true && Boolean(safeFirstDeliveryFamilyKey)
    const fullstackLocalArchetypeUsed =
      (materializationLegacy?.usedLegacyArchetype === true ||
        scalableLegacy?.usedLegacyArchetype === true) &&
      Boolean(fullstackLocalArchetype) &&
      fullstackLocalArchetype !== 'operations'
    const canonicalMaterializationContractUsed =
      materializationLegacy?.usedCanonicalMaterializationContract === true &&
      Boolean(canonicalMaterializationContractKind) &&
      canonicalMaterializationContractKind !== 'generic-fullstack-local'
    const materializationPlanProfileUsed =
      (materializationLegacy?.usedLegacyMaterializationProfile === true ||
        scalableLegacy?.usedLegacyMaterializationProfile === true) &&
      Boolean(materializationPlanProfileKey) &&
      materializationPlanProfileKey !== 'operations'

    const warnings = summarizeUniqueExecutorStrings(
      [
        safeFirstDeliveryFamilyUsed
          ? `Se uso safeFirstDeliveryFamily legacy: ${safeFirstDeliveryFamilyKey}.`
          : '',
        fullstackLocalArchetypeUsed
          ? `Se uso fullstackLocalArchetype legacy: ${fullstackLocalArchetype}.`
          : '',
        canonicalMaterializationContractUsed
          ? `Se uso canonicalMaterializationContract legacy: ${canonicalMaterializationContractKind}.`
          : '',
        materializationPlanProfileUsed
          ? `Se uso materializationPlanProfile legacy: ${materializationPlanProfileKey}.`
          : '',
        generatedDomainContractDiagnostics?.present === true &&
        generatedDomainContractDiagnostics?.valid === true &&
        generatedDomainContractDiagnostics?.safeForLocalMaterialization === true &&
        (safeFirstDeliveryFamilyUsed ||
          fullstackLocalArchetypeUsed ||
          canonicalMaterializationContractUsed ||
          materializationPlanProfileUsed)
          ? 'Se uso resolucion legacy aun con generatedDomainContract valido y seguro.'
          : '',
      ].filter(Boolean),
      12,
    )

    const errors = []
    const used =
      safeFirstDeliveryFamilyUsed ||
      fullstackLocalArchetypeUsed ||
      canonicalMaterializationContractUsed ||
      materializationPlanProfileUsed

    return {
      present: true,
      used,
      status: errors.length > 0 ? 'error' : used ? 'used' : 'not-used',
      source: 'legacy-domain-resolution',
      behaviorChanged: false,
      generatedDomainContractPresent: generatedDomainContractDiagnostics?.present === true,
      generatedDomainContractValid: generatedDomainContractDiagnostics?.valid === true,
      generatedDomainContractSafe:
        generatedDomainContractDiagnostics?.safeForLocalMaterialization === true,
      safeFirstDeliveryFamily: {
        used: safeFirstDeliveryFamilyUsed,
        familyKey: safeFirstDeliveryFamilyKey || null,
        source: safeFirstDeliveryFamilyUsed ? 'legacy' : 'not-used',
        influence: safeFirstDeliveryFamilyUsed
          ? [
              'safeFirstDeliveryPlan.modules',
              'safeFirstDeliveryPlan.mockData',
              'safeFirstDeliveryPlan.screens',
              'safeFirstDeliveryPlan.localBehavior',
              'safeFirstDeliveryPlan.explicitExclusions',
            ]
          : [],
      },
      fullstackLocalArchetype: {
        used: fullstackLocalArchetypeUsed,
        archetype: fullstackLocalArchetype || null,
        source: fullstackLocalArchetypeUsed ? 'legacy' : 'not-used',
        influence: fullstackLocalArchetypeUsed
          ? [
              'scalableDeliveryPlan.allowedRootPaths',
              'scalableDeliveryPlan.modules',
              'fullstackLocalContractProfile',
              'fullstackLocalDemoData',
            ]
          : [],
      },
      canonicalMaterializationContract: {
        used: canonicalMaterializationContractUsed,
        contractKind: canonicalMaterializationContractKind || null,
        selectedDomain: canonicalSelectedDomain || null,
        source: canonicalMaterializationContractUsed ? 'legacy' : 'not-used',
        influence: canonicalMaterializationContractUsed
          ? [
              'materializationPlan.contractDefinition',
              'materializationPlan.allowedTargetPaths',
              'selectedDomain',
              'selectedContractKind',
            ]
          : [],
      },
      materializationPlanProfile: {
        used: materializationPlanProfileUsed,
        profileKey: materializationPlanProfileKey || null,
        source: materializationPlanProfileUsed ? 'legacy' : 'not-used',
        influence: materializationPlanProfileUsed
          ? [
              'materializationPlan.projectRoot',
              'materializationPlan.allowedTargetPaths',
              'materializationPlan.operations',
            ]
          : [],
      },
      warnings,
      errors,
      warningsCount: warnings.length,
      errorsCount: errors.length,
    }
  } catch (error) {
    const errorPreview = sanitizeGeneratedDomainContractDebugPreview(
      error instanceof Error ? error.stack || error.message : String(error),
      180,
    )

    return {
      present: true,
      used: false,
      status: 'error',
      source: 'legacy-domain-resolution',
      behaviorChanged: false,
      generatedDomainContractPresent: generatedDomainContractDiagnostics?.present === true,
      generatedDomainContractValid: generatedDomainContractDiagnostics?.valid === true,
      generatedDomainContractSafe:
        generatedDomainContractDiagnostics?.safeForLocalMaterialization === true,
      safeFirstDeliveryFamily: {
        used: false,
        familyKey: null,
        source: 'not-used',
        influence: [],
      },
      fullstackLocalArchetype: {
        used: false,
        archetype: null,
        source: 'not-used',
        influence: [],
      },
      canonicalMaterializationContract: {
        used: false,
        contractKind: null,
        selectedDomain: null,
        source: 'not-used',
        influence: [],
      },
      materializationPlanProfile: {
        used: false,
        profileKey: null,
        source: 'not-used',
        influence: [],
      },
      warnings: [],
      errors: errorPreview ? [errorPreview] : ['legacy-domain-resolution-error'],
      warningsCount: 0,
      errorsCount: errorPreview ? 1 : 0,
    }
  }
}

function summarizeLegacyDomainResolutionDiagnosticsForDebug(diagnostics) {
  if (!diagnostics || typeof diagnostics !== 'object') {
    return {
      present: false,
      used: false,
      status: 'not-used',
    }
  }

  const warningSummary = summarizeGeneratedDomainContractDebugEntries(diagnostics.warnings)
  const errorSummary = summarizeGeneratedDomainContractDebugEntries(diagnostics.errors)

  return {
    present: diagnostics.present === true,
    used: diagnostics.used === true,
    status:
      typeof diagnostics.status === 'string' && diagnostics.status.trim()
        ? diagnostics.status.trim()
        : 'not-used',
    generatedDomainContractPresent: diagnostics.generatedDomainContractPresent === true,
    generatedDomainContractValid: diagnostics.generatedDomainContractValid === true,
    generatedDomainContractSafe: diagnostics.generatedDomainContractSafe === true,
    safeFirstDeliveryFamilyUsed: diagnostics.safeFirstDeliveryFamily?.used === true,
    safeFirstDeliveryFamilyKey:
      typeof diagnostics.safeFirstDeliveryFamily?.familyKey === 'string' &&
      diagnostics.safeFirstDeliveryFamily.familyKey.trim()
        ? diagnostics.safeFirstDeliveryFamily.familyKey.trim()
        : undefined,
    fullstackLocalArchetypeUsed: diagnostics.fullstackLocalArchetype?.used === true,
    fullstackLocalArchetype:
      typeof diagnostics.fullstackLocalArchetype?.archetype === 'string' &&
      diagnostics.fullstackLocalArchetype.archetype.trim()
        ? diagnostics.fullstackLocalArchetype.archetype.trim()
        : undefined,
    canonicalMaterializationContractUsed:
      diagnostics.canonicalMaterializationContract?.used === true,
    selectedDomain:
      typeof diagnostics.canonicalMaterializationContract?.selectedDomain === 'string' &&
      diagnostics.canonicalMaterializationContract.selectedDomain.trim()
        ? diagnostics.canonicalMaterializationContract.selectedDomain.trim()
        : undefined,
    selectedContractKind:
      typeof diagnostics.canonicalMaterializationContract?.contractKind === 'string' &&
      diagnostics.canonicalMaterializationContract.contractKind.trim()
        ? diagnostics.canonicalMaterializationContract.contractKind.trim()
        : undefined,
    warningsCount: Array.isArray(diagnostics.warnings) ? diagnostics.warnings.length : 0,
    errorsCount: Array.isArray(diagnostics.errors) ? diagnostics.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function buildLegacyCapabilityAlignmentDiagnostics({
  generatedDomainCapabilityProfile,
  legacyDomainResolutionDiagnostics,
}) {
  const emptyDiagnostics = {
    present: true,
    compared: false,
    status: 'not-available',
    source: 'generated-domain-capability-profile-vs-legacy-domain-resolution',
    behaviorChanged: false,
    generatedCapabilityProfile: {
      present: false,
      built: false,
      status: null,
      fullstackLocal: false,
      backendPresent: false,
      databasePresent: false,
      surfacesCount: 0,
      workflows: [],
    },
    legacyResolution: {
      present: false,
      used: false,
      status: null,
      safeFirstDeliveryFamilyUsed: false,
      safeFirstDeliveryFamilyKey: null,
      fullstackLocalArchetypeUsed: false,
      fullstackLocalArchetype: null,
      canonicalMaterializationContractUsed: false,
      selectedDomain: null,
      selectedContractKind: null,
    },
    alignment: {
      capabilityProfileSufficient: false,
      legacyUsedDespiteCapabilityProfile: false,
      legacyFallbackLikelyNeeded: false,
      legacySilent: false,
      migrationCandidate: false,
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  try {
    const capabilityProfile =
      generatedDomainCapabilityProfile && typeof generatedDomainCapabilityProfile === 'object'
        ? generatedDomainCapabilityProfile
        : null
    const legacyDiagnostics =
      legacyDomainResolutionDiagnostics &&
      typeof legacyDomainResolutionDiagnostics === 'object'
        ? legacyDomainResolutionDiagnostics
        : null
    const activeWorkflows = Object.entries(
      capabilityProfile?.workflows && typeof capabilityProfile.workflows === 'object'
        ? capabilityProfile.workflows
        : {},
    )
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key)
      .slice(0, 12)
    const surfacesCount = Number.isInteger(capabilityProfile?.surfaces?.count)
      ? capabilityProfile.surfaces.count
      : 0
    const allowedTargetPathsCount = Number.isInteger(
      capabilityProfile?.materialization?.allowedTargetPathsCount,
    )
      ? capabilityProfile.materialization.allowedTargetPathsCount
      : 0
    const requiredPathGroupsCount = Number.isInteger(
      capabilityProfile?.materialization?.requiredPathGroupsCount,
    )
      ? capabilityProfile.materialization.requiredPathGroupsCount
      : 0
    const capabilityProfilePresent = capabilityProfile?.present === true
    const capabilityProfileBuilt = capabilityProfile?.built === true
    const capabilityProfileStatus =
      typeof capabilityProfile?.status === 'string' && capabilityProfile.status.trim()
        ? capabilityProfile.status.trim()
        : null
    const legacyPresent = legacyDiagnostics?.present === true
    const legacyUsed = legacyDiagnostics?.used === true
    const legacyStatus =
      typeof legacyDiagnostics?.status === 'string' && legacyDiagnostics.status.trim()
        ? legacyDiagnostics.status.trim()
        : null
    const capabilityProfileSufficient =
      capabilityProfilePresent &&
      capabilityProfileBuilt &&
      Array.isArray(capabilityProfile?.errors) &&
      capabilityProfile.errors.length === 0 &&
      ((capabilityProfile?.delivery?.fullstackLocal === true &&
        capabilityProfile?.backend?.present === true &&
        capabilityProfile?.database?.present === true &&
        allowedTargetPathsCount > 0 &&
        requiredPathGroupsCount > 0) ||
        surfacesCount > 0 ||
        activeWorkflows.length > 0)
    const legacyUsedDespiteCapabilityProfile = capabilityProfileSufficient && legacyUsed
    const legacyFallbackLikelyNeeded = !capabilityProfileBuilt && legacyUsed
    const legacySilent =
      capabilityProfilePresent &&
      capabilityProfileBuilt &&
      !capabilityProfileSufficient &&
      !legacyUsed
    const migrationCandidate = legacyUsedDespiteCapabilityProfile
    const warnings = summarizeUniqueExecutorStrings(
      [
        legacyUsedDespiteCapabilityProfile
          ? 'Legacy domain resolver was used even though generatedDomainCapabilityProfile appears sufficient.'
          : '',
        legacyFallbackLikelyNeeded
          ? 'Legacy domain resolver is acting as fallback because generated capability profile is unavailable.'
          : '',
        legacySilent
          ? 'generatedDomainCapabilityProfile appears incomplete while legacy domain resolution stayed inactive.'
          : '',
        capabilityProfileStatus === 'partial' && !legacyUsedDespiteCapabilityProfile
          ? 'generatedDomainCapabilityProfile sigue en estado partial; la alineacion no gobierna decisiones en esta fase.'
          : '',
      ].filter(Boolean),
      12,
    )
    const errors = []
    const compared = capabilityProfilePresent || legacyPresent
    let status = 'not-available'

    if (legacyUsedDespiteCapabilityProfile) {
      status = 'divergent'
    } else if (capabilityProfileSufficient && !legacyUsed) {
      status = 'aligned'
    } else if (legacyFallbackLikelyNeeded || legacySilent || warnings.length > 0) {
      status = 'partial'
    } else if (compared) {
      status = 'aligned'
    }

    return {
      ...emptyDiagnostics,
      compared,
      status,
      generatedCapabilityProfile: {
        present: capabilityProfilePresent,
        built: capabilityProfileBuilt,
        status: capabilityProfileStatus,
        fullstackLocal: capabilityProfile?.delivery?.fullstackLocal === true,
        backendPresent: capabilityProfile?.backend?.present === true,
        databasePresent: capabilityProfile?.database?.present === true,
        surfacesCount,
        workflows: activeWorkflows,
      },
      legacyResolution: {
        present: legacyPresent,
        used: legacyUsed,
        status: legacyStatus,
        safeFirstDeliveryFamilyUsed: legacyDiagnostics?.safeFirstDeliveryFamily?.used === true,
        safeFirstDeliveryFamilyKey:
          normalizeOptionalString(legacyDiagnostics?.safeFirstDeliveryFamily?.familyKey) || null,
        fullstackLocalArchetypeUsed:
          legacyDiagnostics?.fullstackLocalArchetype?.used === true,
        fullstackLocalArchetype:
          normalizeOptionalString(legacyDiagnostics?.fullstackLocalArchetype?.archetype) || null,
        canonicalMaterializationContractUsed:
          legacyDiagnostics?.canonicalMaterializationContract?.used === true,
        selectedDomain:
          normalizeOptionalString(
            legacyDiagnostics?.canonicalMaterializationContract?.selectedDomain,
          ) || null,
        selectedContractKind:
          normalizeOptionalString(
            legacyDiagnostics?.canonicalMaterializationContract?.contractKind,
          ) || null,
      },
      alignment: {
        capabilityProfileSufficient,
        legacyUsedDespiteCapabilityProfile,
        legacyFallbackLikelyNeeded,
        legacySilent,
        migrationCandidate,
      },
      warnings,
      errors,
      warningsCount: warnings.length,
      errorsCount: errors.length,
    }
  } catch (error) {
    const errorPreview = sanitizeGeneratedDomainContractDebugPreview(
      error instanceof Error ? error.stack || error.message : String(error),
      180,
    )

    return {
      ...emptyDiagnostics,
      status: 'error',
      errors: errorPreview ? [errorPreview] : ['legacy-capability-alignment-error'],
      errorsCount: errorPreview ? 1 : 0,
    }
  }
}

function summarizeLegacyCapabilityAlignmentDiagnosticsForDebug(diagnostics) {
  if (!diagnostics || typeof diagnostics !== 'object') {
    return {
      present: false,
      compared: false,
      status: 'not-available',
    }
  }

  const warningSummary = summarizeGeneratedDomainContractDebugEntries(diagnostics.warnings)
  const errorSummary = summarizeGeneratedDomainContractDebugEntries(diagnostics.errors)

  return {
    present: diagnostics.present === true,
    compared: diagnostics.compared === true,
    status:
      typeof diagnostics.status === 'string' && diagnostics.status.trim()
        ? diagnostics.status.trim()
        : 'not-available',
    behaviorChanged: diagnostics.behaviorChanged === true,
    capabilityProfileBuilt: diagnostics.generatedCapabilityProfile?.built === true,
    capabilityProfileStatus:
      typeof diagnostics.generatedCapabilityProfile?.status === 'string' &&
      diagnostics.generatedCapabilityProfile.status.trim()
        ? diagnostics.generatedCapabilityProfile.status.trim()
        : undefined,
    fullstackLocal: diagnostics.generatedCapabilityProfile?.fullstackLocal === true,
    backendPresent: diagnostics.generatedCapabilityProfile?.backendPresent === true,
    databasePresent: diagnostics.generatedCapabilityProfile?.databasePresent === true,
    legacyUsed: diagnostics.legacyResolution?.used === true,
    safeFirstDeliveryFamilyUsed: diagnostics.legacyResolution?.safeFirstDeliveryFamilyUsed === true,
    fullstackLocalArchetypeUsed:
      diagnostics.legacyResolution?.fullstackLocalArchetypeUsed === true,
    canonicalMaterializationContractUsed:
      diagnostics.legacyResolution?.canonicalMaterializationContractUsed === true,
    migrationCandidate: diagnostics.alignment?.migrationCandidate === true,
    warningsCount: Array.isArray(diagnostics.warnings) ? diagnostics.warnings.length : 0,
    errorsCount: Array.isArray(diagnostics.errors) ? diagnostics.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function buildLegacyMigrationCandidateReport({
  generatedDomainCapabilityProfile,
  legacyDomainResolutionDiagnostics,
  legacyCapabilityAlignmentDiagnostics,
}) {
  const emptyReport = {
    present: true,
    evaluated: false,
    status: 'not-available',
    source: 'legacy-capability-alignment',
    behaviorChanged: false,
    capabilityProfile: {
      present: false,
      built: false,
      sufficient: false,
      fullstackLocal: false,
      backendPresent: false,
      databasePresent: false,
      surfacesCount: 0,
      workflowsCount: 0,
    },
    legacy: {
      present: false,
      used: false,
      safeFirstDeliveryFamilyUsed: false,
      fullstackLocalArchetypeUsed: false,
      canonicalMaterializationContractUsed: false,
    },
    alignment: {
      present: false,
      compared: false,
      status: null,
      migrationCandidate: false,
      legacyUsedDespiteCapabilityProfile: false,
      legacyFallbackLikelyNeeded: false,
    },
    recommendation: {
      action: 'none',
      reason: '',
      nextSafeStep: '',
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  try {
    const capabilityProfile =
      generatedDomainCapabilityProfile &&
      typeof generatedDomainCapabilityProfile === 'object'
        ? generatedDomainCapabilityProfile
        : null
    const legacyDiagnostics =
      legacyDomainResolutionDiagnostics &&
      typeof legacyDomainResolutionDiagnostics === 'object'
        ? legacyDomainResolutionDiagnostics
        : null
    const alignmentDiagnostics =
      legacyCapabilityAlignmentDiagnostics &&
      typeof legacyCapabilityAlignmentDiagnostics === 'object'
        ? legacyCapabilityAlignmentDiagnostics
        : null
    const workflowsCount = Object.values(
      capabilityProfile?.workflows && typeof capabilityProfile.workflows === 'object'
        ? capabilityProfile.workflows
        : {},
    ).filter((value) => value === true).length
    const capabilityProfilePresent = capabilityProfile?.present === true
    const capabilityProfileBuilt = capabilityProfile?.built === true
    const capabilityProfileSufficient =
      alignmentDiagnostics?.alignment?.capabilityProfileSufficient === true
    const legacyPresent = legacyDiagnostics?.present === true
    const legacyUsed = legacyDiagnostics?.used === true
    const alignmentPresent = alignmentDiagnostics?.present === true
    const alignmentCompared = alignmentDiagnostics?.compared === true
    const alignmentStatus =
      typeof alignmentDiagnostics?.status === 'string' && alignmentDiagnostics.status.trim()
        ? alignmentDiagnostics.status.trim()
        : null
    const migrationCandidate = alignmentDiagnostics?.alignment?.migrationCandidate === true
    const legacyUsedDespiteCapabilityProfile =
      alignmentDiagnostics?.alignment?.legacyUsedDespiteCapabilityProfile === true
    const legacyFallbackLikelyNeeded =
      alignmentDiagnostics?.alignment?.legacyFallbackLikelyNeeded === true
    const warnings = []
    const errors = []
    const appendWarning = (message) => {
      const normalized =
        typeof message === 'string'
          ? message.trim()
          : message === null || message === undefined
            ? ''
            : String(message).trim()
      if (!normalized) {
        return
      }
      const bounded =
        normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`
      if (!warnings.includes(bounded)) {
        warnings.push(bounded)
      }
    }
    let status = 'not-available'
    let action = 'none'
    let reason = ''
    let nextSafeStep = ''

    if (!capabilityProfilePresent && !legacyPresent && !alignmentPresent) {
      status = 'not-available'
      action = 'none'
      reason = 'No hay datos suficientes para evaluar candidatos de migracion legacy.'
      nextSafeStep = 'Seguir observando hasta contar con capability profile o legacy diagnostics.'
    } else if (alignmentStatus === 'error') {
      status = 'error'
      action = 'investigate'
      reason = 'La alineacion legacy vs capability devolvio error observacional.'
      nextSafeStep = 'Revisar el diagnostico de alineacion y mantener el flujo sin cambios.'
      asArray(alignmentDiagnostics?.errors).forEach((entry) => {
        pushUniqueMessage(errors, entry)
      })
    } else if (migrationCandidate && legacyUsedDespiteCapabilityProfile) {
      status = 'candidate'
      action = 'prepare-capability-preference'
      reason =
        'Hay capability profile suficiente, pero el legacy resolver sigue participando en la decision.'
      nextSafeStep =
        'Preparar una futura preferencia por capability profile manteniendo fallback legacy.'
      appendWarning('Legacy resolver was used despite sufficient generated capability profile.')
    } else if (legacyUsed && !capabilityProfileBuilt) {
      status = 'fallback-needed'
      action = 'keep-legacy-fallback'
      reason =
        'El legacy resolver sigue cubriendo un caso donde el capability profile no esta disponible o no pudo construirse.'
      nextSafeStep =
        'Mantener el fallback legacy y seguir mejorando la cobertura del generatedDomainCapabilityProfile.'
      appendWarning(
        'Legacy resolver is still needed because generated capability profile is unavailable or insufficient.',
      )
    } else if (
      capabilityProfileSufficient &&
      !legacyUsed &&
      alignmentCompared &&
      alignmentStatus === 'aligned'
    ) {
      status = 'no-action'
      action = 'observe'
      reason =
        'El capability profile parece suficiente y el legacy resolver no participo en este flujo.'
      nextSafeStep = 'Seguir observando antes de preferir señales estructurales en runtime.'
    } else if (
      alignmentStatus === 'divergent' ||
      (alignmentCompared &&
        (alignmentDiagnostics?.alignment?.legacySilent === true ||
          (alignmentStatus === 'partial' &&
            !migrationCandidate &&
            !legacyFallbackLikelyNeeded &&
            legacyUsed !== false)))
    ) {
      status = 'blocked'
      action = 'investigate'
      reason =
        'La alineacion observacional encontro una divergencia que necesita inspeccion antes de planear la migracion.'
      nextSafeStep = 'Revisar el payload observado y mantener el legacy sin cambios funcionales.'
      appendWarning(
        'La alineacion observacional requiere investigacion antes de proponer preferencia por capability profile.',
      )
    } else if (alignmentCompared || capabilityProfilePresent || legacyPresent) {
      status = 'no-action'
      action = 'observe'
      reason = 'No hay una accion de migracion segura recomendada en esta fase observacional.'
      nextSafeStep = 'Seguir recolectando evidencia antes de cambiar preferencia o fallback.'
    }

    return {
      ...emptyReport,
      evaluated: capabilityProfilePresent || legacyPresent || alignmentPresent,
      status,
      capabilityProfile: {
        present: capabilityProfilePresent,
        built: capabilityProfileBuilt,
        sufficient: capabilityProfileSufficient,
        fullstackLocal: capabilityProfile?.delivery?.fullstackLocal === true,
        backendPresent: capabilityProfile?.backend?.present === true,
        databasePresent: capabilityProfile?.database?.present === true,
        surfacesCount: Number.isInteger(capabilityProfile?.surfaces?.count)
          ? capabilityProfile.surfaces.count
          : 0,
        workflowsCount,
      },
      legacy: {
        present: legacyPresent,
        used: legacyUsed,
        safeFirstDeliveryFamilyUsed: legacyDiagnostics?.safeFirstDeliveryFamily?.used === true,
        fullstackLocalArchetypeUsed: legacyDiagnostics?.fullstackLocalArchetype?.used === true,
        canonicalMaterializationContractUsed:
          legacyDiagnostics?.canonicalMaterializationContract?.used === true,
      },
      alignment: {
        present: alignmentPresent,
        compared: alignmentCompared,
        status: alignmentStatus,
        migrationCandidate,
        legacyUsedDespiteCapabilityProfile,
        legacyFallbackLikelyNeeded,
      },
      recommendation: {
        action,
        reason,
        nextSafeStep,
      },
      warnings,
      errors,
      warningsCount: warnings.length,
      errorsCount: errors.length,
    }
  } catch (error) {
    const errorPreview = sanitizeGeneratedDomainContractDebugPreview(
      error instanceof Error ? error.stack || error.message : String(error),
      180,
    )

    return {
      ...emptyReport,
      evaluated: true,
      status: 'error',
      recommendation: {
        action: 'investigate',
        reason: 'El reporte observacional de migracion legacy devolvio error interno.',
        nextSafeStep: 'Revisar el reporte y mantener el comportamiento actual sin cambios.',
      },
      errors: errorPreview ? [errorPreview] : ['legacy-migration-candidate-report-error'],
      errorsCount: errorPreview ? 1 : 0,
    }
  }
}

function summarizeLegacyMigrationCandidateReportForDebug(report) {
  if (!report || typeof report !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-available',
    }
  }

  const warningSummary = summarizeGeneratedDomainContractDebugEntries(report.warnings)
  const errorSummary = summarizeGeneratedDomainContractDebugEntries(report.errors)

  return {
    present: report.present === true,
    evaluated: report.evaluated === true,
    status:
      typeof report.status === 'string' && report.status.trim()
        ? report.status.trim()
        : 'not-available',
    behaviorChanged: report.behaviorChanged === true,
    capabilityProfileBuilt: report.capabilityProfile?.built === true,
    capabilityProfileSufficient: report.capabilityProfile?.sufficient === true,
    legacyUsed: report.legacy?.used === true,
    migrationCandidate: report.alignment?.migrationCandidate === true,
    recommendedAction:
      typeof report.recommendation?.action === 'string' && report.recommendation.action.trim()
        ? report.recommendation.action.trim()
        : 'none',
    warningsCount: Array.isArray(report.warnings) ? report.warnings.length : 0,
    errorsCount: Array.isArray(report.errors) ? report.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

module.exports = {
  buildLegacyDomainResolutionDiagnostics,
  summarizeLegacyDomainResolutionDiagnosticsForDebug,
  buildLegacyCapabilityAlignmentDiagnostics,
  summarizeLegacyCapabilityAlignmentDiagnosticsForDebug,
  buildLegacyMigrationCandidateReport,
  summarizeLegacyMigrationCandidateReportForDebug,
}
