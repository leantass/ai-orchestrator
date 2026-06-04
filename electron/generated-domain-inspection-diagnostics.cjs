const path = require('node:path')

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
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

function sanitizeDebugPreview(value, maxLength = 240) {
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

function summarizeDebugEntries(entries, maxEntries = 3) {
  if (!Array.isArray(entries) || maxEntries <= 0) {
    return {
      firstEntry: undefined,
      preview: [],
    }
  }

  const preview = []
  const seenEntries = new Set()

  for (const entry of entries) {
    const sanitized = sanitizeDebugPreview(entry, 240)
    if (!sanitized || seenEntries.has(sanitized)) {
      continue
    }

    seenEntries.add(sanitized)
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

function normalizeRequiredPathGroups(requiredPathGroups) {
  return (Array.isArray(requiredPathGroups) ? requiredPathGroups : [])
    .map((group, index) => {
      const candidates = Array.isArray(group)
        ? group.filter((entry) => typeof entry === 'string' && entry.trim())
        : Array.isArray(group?.candidates)
          ? group.candidates.filter((entry) => typeof entry === 'string' && entry.trim())
          : []

      if (candidates.length === 0) {
        return null
      }

      return {
        label:
          normalizeOptionalString(group?.label) ||
          normalizeOptionalString(candidates[0]) ||
          `required-path-group-${index + 1}`,
        candidates,
      }
    })
    .filter(Boolean)
}

function isUsableInspectionDefinition(definition) {
  return (
    definition &&
    typeof definition === 'object' &&
    Array.isArray(definition.requiredPathGroups) &&
    definition.requiredPathGroups.length > 0 &&
    definition.requiredPathGroups.some(
      (group) => Array.isArray(group?.candidates) && group.candidates.length > 0,
    ) &&
    Array.isArray(definition.expectedTargetPaths) &&
    definition.expectedTargetPaths.length > 0
  )
}

function buildInspectionDefinition({
  contractKind,
  rootFolder,
  allowedTargetPaths,
  requiredPathGroups,
  forbiddenSignals,
  primaryPersistencePaths,
}) {
  const normalizedRootFolder = normalizeOptionalString(rootFolder) || 'fullstack-local'
  const normalizedAllowedTargetPaths = summarizeUniqueExecutorStrings(
    (Array.isArray(allowedTargetPaths) ? allowedTargetPaths : []).filter(
      (entry) => typeof entry === 'string' && entry.trim(),
    ),
    200,
  )
  const normalizedRequiredPathGroups = normalizeRequiredPathGroups(requiredPathGroups)
  const rootBasename = normalizeOptionalString(path.basename(normalizedRootFolder))

  if (
    normalizedAllowedTargetPaths.length === 0 ||
    normalizedRequiredPathGroups.length === 0
  ) {
    return null
  }

  return {
    contractKind,
    rootFolder: normalizedRootFolder,
    allowedRootBasenames: rootBasename ? [rootBasename] : [],
    preferredRootBasenames: rootBasename ? [rootBasename] : [],
    forbiddenSignals: summarizeUniqueExecutorStrings(
      ['web-scaffold-base', ...(Array.isArray(forbiddenSignals) ? forbiddenSignals : [])].filter(
        Boolean,
      ),
      64,
    ),
    primaryPersistencePaths: summarizeUniqueExecutorStrings(
      Array.isArray(primaryPersistencePaths) ? primaryPersistencePaths.filter(Boolean) : [],
      16,
    ),
    jsonPrimaryPersistencePaths: [],
    requiredPathGroups: normalizedRequiredPathGroups,
    requiredPaths: normalizedRequiredPathGroups.map((entry) => entry.label),
    expectedTargetPaths: summarizeUniqueExecutorStrings(
      normalizedRequiredPathGroups.map((entry) => entry.candidates[0]).filter(Boolean),
      200,
    ),
    allowedTargetPaths: normalizedAllowedTargetPaths,
  }
}

function buildInspectionDefinitionFromUniversalPlan(universalPlan) {
  return buildInspectionDefinition({
    contractKind: 'generated-domain-universal-materialization-plan',
    rootFolder:
      normalizeOptionalString(universalPlan?.projectRoot) ||
      normalizeOptionalString(universalPlan?.targetRoot) ||
      normalizeOptionalString(universalPlan?.root),
    allowedTargetPaths: universalPlan?.allowedTargetPaths,
    requiredPathGroups: universalPlan?.requiredPathGroups,
    forbiddenSignals: universalPlan?.forbiddenSignals || universalPlan?.safety?.forbiddenSignals,
    primaryPersistencePaths: [
      normalizeOptionalString(universalPlan?.database?.schemaFile),
      normalizeOptionalString(universalPlan?.database?.seedFile),
    ].filter(Boolean),
  })
}

function buildInspectionDefinitionFromCandidate(candidatePlan) {
  return buildInspectionDefinition({
    contractKind: 'generated-domain-shadow-candidate',
    rootFolder:
      normalizeOptionalString(candidatePlan?.candidate?.targetRoot) ||
      normalizeOptionalString(candidatePlan?.candidate?.root),
    allowedTargetPaths: candidatePlan?.candidate?.allowedTargetPaths,
    requiredPathGroups: candidatePlan?.candidate?.requiredPathGroups,
    forbiddenSignals:
      candidatePlan?.candidate?.forbiddenSignals ||
      candidatePlan?.candidate?.safety?.forbiddenSignals,
    primaryPersistencePaths: [
      normalizeOptionalString(candidatePlan?.candidate?.database?.schemaFile),
      normalizeOptionalString(candidatePlan?.candidate?.database?.seedFile),
    ].filter(Boolean),
  })
}

function buildInspectionDefinitionFromPreview(preview) {
  return buildInspectionDefinition({
    contractKind: 'generated-domain-contract-preview',
    rootFolder:
      normalizeOptionalString(preview?.targetRoot) ||
      normalizeOptionalString(preview?.sourceRoot) ||
      normalizeOptionalString(preview?.root),
    allowedTargetPaths: preview?.allowedTargetPaths,
    requiredPathGroups: preview?.requiredPathGroups,
    forbiddenSignals: preview?.forbiddenSignals || preview?.safety?.forbiddenSignals,
    primaryPersistencePaths: [
      normalizeOptionalString(preview?.database?.schemaFile),
      normalizeOptionalString(preview?.database?.seedFile),
    ].filter(Boolean),
  })
}

function resolveGeneratedDomainContractFirstInspectionDefinition({
  generatedDomainUniversalMaterializationPlan,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainContract,
  generatedDomainContractDiagnostics,
  domainConsistencyDiagnostics,
  legacyInspectionDefinition,
}) {
  const emptyResolution = {
    present: false,
    evaluated: false,
    source: 'none',
    definition: null,
    fallbackReason: '',
    blockedReason: '',
    behaviorChanged: false,
    materializationPlanChanged: false,
    executionScopeChanged: false,
    candidateAvailable: false,
    contractAvailable: false,
    universalPlanAvailable: false,
    legacyFallbackAvailable: false,
    candidateCanInspect: false,
    contractCanInspect: false,
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const universalPlan =
    generatedDomainUniversalMaterializationPlan &&
    typeof generatedDomainUniversalMaterializationPlan === 'object'
      ? generatedDomainUniversalMaterializationPlan
      : null
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const contractDiagnostics =
    generatedDomainContractDiagnostics &&
    typeof generatedDomainContractDiagnostics === 'object'
      ? generatedDomainContractDiagnostics
      : null
  const consistency =
    domainConsistencyDiagnostics && typeof domainConsistencyDiagnostics === 'object'
      ? domainConsistencyDiagnostics
      : null
  const legacyDefinition = isUsableInspectionDefinition(legacyInspectionDefinition)
    ? legacyInspectionDefinition
    : null

  if (
    !universalPlan &&
    !candidatePlan &&
    !preview &&
    !generatedDomainContract &&
    !contractDiagnostics &&
    !consistency &&
    !legacyDefinition
  ) {
    return emptyResolution
  }

  try {
    const warnings = []
    const errors = []
    const universalPlanDefinition = buildInspectionDefinitionFromUniversalPlan(universalPlan)
    const candidateDefinition = buildInspectionDefinitionFromCandidate(candidatePlan)
    const previewDefinition = buildInspectionDefinitionFromPreview(preview)
    const universalPlanAvailable = universalPlan?.present === true
    const candidateAvailable = candidatePlan?.present === true
    const contractAvailable =
      Boolean(generatedDomainContract && typeof generatedDomainContract === 'object') &&
      contractDiagnostics?.present === true &&
      contractDiagnostics?.valid === true &&
      contractDiagnostics?.safeForLocalMaterialization === true
    const legacyFallbackAvailable = Boolean(legacyDefinition)
    const candidateCanInspect =
      candidateAvailable &&
      candidatePlan?.compatibility?.canBeInspected === true &&
      candidatePlan?.compatibility?.canBeUsedByFutureSwitch === true &&
      candidatePlan?.candidate?.safety?.safeForLocalMaterialization === true &&
      Boolean(candidateDefinition)
    const contractCanInspect =
      contractAvailable &&
      preview?.present === true &&
      preview?.built === true &&
      preview?.canBecomeMaterializationPlan === true &&
      preview?.safety?.safeForLocalMaterialization === true &&
      Boolean(previewDefinition)
    const universalPlanCanInspect =
      universalPlanAvailable &&
      universalPlan?.built === true &&
      universalPlan?.canBecomeMaterializationPlan === true &&
      universalPlan?.safety?.safeForLocalMaterialization === true &&
      Boolean(universalPlanDefinition)
    const domainMismatch =
      normalizeOptionalString(consistency?.status) === 'mismatch' ||
      normalizeOptionalString(consistency?.status) === 'error' ||
      normalizeOptionalString(consistency?.semanticStatus) === 'mismatch' ||
      normalizeOptionalString(consistency?.semanticStatus) === 'error'

    const resolution = {
      ...emptyResolution,
      present: true,
      evaluated:
        universalPlanAvailable ||
        candidateAvailable ||
        contractAvailable ||
        legacyFallbackAvailable ||
        Boolean(consistency?.present === true),
      candidateAvailable,
      contractAvailable,
      universalPlanAvailable,
      legacyFallbackAvailable,
      candidateCanInspect,
      contractCanInspect,
      warnings,
      errors,
    }

    if (domainMismatch) {
      resolution.blockedReason = 'domain-mismatch'
      pushUniqueMessage(
        warnings,
        'Contract-first inspection remained blocked because domain consistency reported a mismatch.',
      )
      if (legacyFallbackAvailable) {
        resolution.source = 'legacy'
        resolution.definition = legacyDefinition
        resolution.fallbackReason =
          'Domain consistency mismatch kept legacy inspection fallback active.'
      } else {
        resolution.source = 'blocked'
      }
    } else if (universalPlanCanInspect) {
      resolution.source = 'universal-plan'
      resolution.definition = universalPlanDefinition
    } else if (candidateCanInspect) {
      resolution.source = 'shadow-candidate'
      resolution.definition = candidateDefinition
    } else if (contractCanInspect) {
      resolution.source = 'generated-domain-contract'
      resolution.definition = previewDefinition
    } else if (legacyFallbackAvailable) {
      resolution.source = 'legacy'
      resolution.definition = legacyDefinition
      if (universalPlanAvailable || candidateAvailable || contractAvailable) {
        resolution.fallbackReason =
          'Legacy inspection fallback remained active because candidate/contract evidence is still incomplete.'
      } else {
        resolution.fallbackReason =
          'Legacy inspection fallback remained active because no candidate/contract-first source is available yet.'
      }
    } else {
      resolution.source = 'none'
      resolution.blockedReason = 'missing-inspection-definition'
    }

    if (
      resolution.source !== 'legacy' &&
      resolution.source !== 'blocked' &&
      resolution.source !== 'none' &&
      !resolution.definition
    ) {
      resolution.source = legacyFallbackAvailable ? 'legacy' : 'blocked'
      resolution.blockedReason = 'missing-normalized-definition'
      resolution.fallbackReason = legacyFallbackAvailable
        ? 'Legacy inspection fallback remained active because the candidate/contract-first definition could not be normalized.'
        : ''
    }

    if (
      !universalPlanCanInspect &&
      universalPlanAvailable &&
      resolution.source !== 'universal-plan'
    ) {
      pushUniqueMessage(
        warnings,
        'Universal materialization plan is present but still not sufficient to guide inspection on its own.',
      )
    }
    if (!candidateCanInspect && candidateAvailable && resolution.source !== 'shadow-candidate') {
      pushUniqueMessage(
        warnings,
        'Shadow candidate is present but still not sufficient to guide inspection on its own.',
      )
    }
    if (!contractCanInspect && contractAvailable && resolution.source !== 'generated-domain-contract') {
      pushUniqueMessage(
        warnings,
        'Generated domain contract is valid, but preview evidence is still not sufficient to replace the legacy fallback by itself.',
      )
    }
    if (resolution.source === 'blocked' && !resolution.blockedReason) {
      resolution.blockedReason = 'inspection-source-blocked'
    }
    if (
      resolution.source === 'none' &&
      !resolution.blockedReason &&
      !legacyFallbackAvailable
    ) {
      resolution.blockedReason = 'no-source-available'
    }

    resolution.warningsCount = resolution.warnings.length
    resolution.errorsCount = resolution.errors.length
    return resolution
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'
    return {
      ...emptyResolution,
      present: true,
      evaluated: true,
      source: 'blocked',
      blockedReason: 'exception',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildGeneratedDomainInspectionContractDecouplingReport({
  fullstackLocalInspectionSourceDiagnostics,
  generatedDomainContractFirstInspectionDefinition,
  generatedDomainUniversalMaterializationPlan,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainContract,
  generatedDomainContractDiagnostics,
  legacyInspectionDefinition,
}) {
  const emptyReport = {
    present: false,
    evaluated: false,
    behaviorChanged: false,
    currentInspectionSource: 'unavailable',
    candidateAvailable: false,
    contractAvailable: false,
    universalPlanAvailable: false,
    legacyFallbackAvailable: false,
    candidateCanInspect: false,
    contractCanInspect: false,
    legacyStillRequired: true,
    migrationStatus: 'not-ready',
    blockers: [],
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const currentDiagnostics =
    fullstackLocalInspectionSourceDiagnostics &&
    typeof fullstackLocalInspectionSourceDiagnostics === 'object'
      ? fullstackLocalInspectionSourceDiagnostics
      : null
  const resolution =
    generatedDomainContractFirstInspectionDefinition &&
    typeof generatedDomainContractFirstInspectionDefinition === 'object'
      ? generatedDomainContractFirstInspectionDefinition
      : resolveGeneratedDomainContractFirstInspectionDefinition({
          generatedDomainUniversalMaterializationPlan,
          generatedDomainShadowMaterializationCandidatePlan,
          generatedDomainUniversalMaterializationPlanPreview,
          generatedDomainContract,
          generatedDomainContractDiagnostics,
          legacyInspectionDefinition,
        })

  if (!currentDiagnostics && resolution.present !== true) {
    return emptyReport
  }

  try {
    const warnings = Array.isArray(resolution.warnings) ? [...resolution.warnings] : []
    const errors = Array.isArray(resolution.errors) ? [...resolution.errors] : []
    const blockers = []
    const currentInspectionSource =
      normalizeOptionalString(currentDiagnostics?.source) || 'unavailable'
    const legacyStillRequired =
      currentInspectionSource === 'legacy-canonical-contract' ||
      currentInspectionSource === 'explicit-materialization-contract' ||
      resolution.source === 'legacy' ||
      resolution.source === 'blocked' ||
      resolution.source === 'none'

    if (normalizeOptionalString(resolution.blockedReason)) {
      pushUniqueMessage(blockers, resolution.blockedReason)
    }
    if (normalizeOptionalString(resolution.fallbackReason)) {
      pushUniqueMessage(warnings, resolution.fallbackReason)
    }
    if (!resolution.universalPlanAvailable) {
      pushUniqueMessage(blockers, 'missing-universal-plan')
    }
    if (!resolution.candidateAvailable) {
      pushUniqueMessage(blockers, 'missing-shadow-candidate')
    }
    if (!resolution.contractAvailable) {
      pushUniqueMessage(blockers, 'missing-generated-domain-contract')
    }
    if (!resolution.legacyFallbackAvailable) {
      pushUniqueMessage(blockers, 'missing-legacy-fallback')
    }

    let migrationStatus = 'not-ready'
    if (errors.length > 0 || resolution.source === 'blocked') {
      migrationStatus = 'blocked'
    } else if (
      resolution.source === 'universal-plan' ||
      resolution.source === 'shadow-candidate' ||
      resolution.source === 'generated-domain-contract'
    ) {
      migrationStatus = resolution.legacyFallbackAvailable ? 'ready-for-harness' : 'partial'
    } else if (
      resolution.universalPlanAvailable ||
      resolution.candidateAvailable ||
      resolution.contractAvailable
    ) {
      migrationStatus = 'partial'
    }

    const report = {
      ...emptyReport,
      present: true,
      evaluated: resolution.evaluated === true || currentDiagnostics?.present === true,
      currentInspectionSource,
      suggestedSource: resolution.source,
      candidateAvailable: resolution.candidateAvailable === true,
      contractAvailable: resolution.contractAvailable === true,
      universalPlanAvailable: resolution.universalPlanAvailable === true,
      legacyFallbackAvailable: resolution.legacyFallbackAvailable === true,
      candidateCanInspect: resolution.candidateCanInspect === true,
      contractCanInspect: resolution.contractCanInspect === true,
      legacyStillRequired,
      migrationStatus,
      blockers,
      warnings,
      errors,
    }

    report.warningsCount = report.warnings.length
    report.errorsCount = report.errors.length
    return report
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'
    return {
      ...emptyReport,
      present: true,
      evaluated: true,
      migrationStatus: 'blocked',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function summarizeGeneratedDomainInspectionContractDecouplingReportForDebug(report) {
  if (!report || typeof report !== 'object') {
    return {
      present: false,
      migrationStatus: 'not-ready',
      currentInspectionSource: 'unavailable',
    }
  }

  const warningSummary = summarizeDebugEntries(report.warnings)
  const errorSummary = summarizeDebugEntries(report.errors)

  return {
    present: report.present === true,
    evaluated: report.evaluated === true,
    currentInspectionSource:
      normalizeOptionalString(report.currentInspectionSource) || 'unavailable',
    suggestedSource: normalizeOptionalString(report.suggestedSource) || 'none',
    migrationStatus: normalizeOptionalString(report.migrationStatus) || 'not-ready',
    behaviorChanged: report.behaviorChanged === true,
    candidateAvailable: report.candidateAvailable === true,
    contractAvailable: report.contractAvailable === true,
    universalPlanAvailable: report.universalPlanAvailable === true,
    legacyFallbackAvailable: report.legacyFallbackAvailable === true,
    candidateCanInspect: report.candidateCanInspect === true,
    contractCanInspect: report.contractCanInspect === true,
    legacyStillRequired: report.legacyStillRequired !== false,
    warningsCount: Array.isArray(report.warnings) ? report.warnings.length : 0,
    errorsCount: Array.isArray(report.errors) ? report.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

module.exports = {
  resolveGeneratedDomainContractFirstInspectionDefinition,
  buildGeneratedDomainInspectionContractDecouplingReport,
  summarizeGeneratedDomainInspectionContractDecouplingReportForDebug,
}
