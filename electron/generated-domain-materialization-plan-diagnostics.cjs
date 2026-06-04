function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePathForComparison(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/\\/gu, '/').replace(/\/{2,}/gu, '/')
    : ''
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
        ? group
        : Array.isArray(group?.candidates)
          ? group.candidates
          : typeof group === 'string'
            ? [group]
            : []

      const normalizedCandidates = summarizeUniqueExecutorStrings(
        candidates.map((entry) => normalizePathForComparison(entry)).filter(Boolean),
        16,
      )

      if (normalizedCandidates.length === 0) {
        return null
      }

      return {
        label:
          normalizeOptionalString(group?.label) ||
          normalizeOptionalString(normalizedCandidates[0]) ||
          `group-${index + 1}`,
        candidates: normalizedCandidates,
      }
    })
    .filter(Boolean)
}

function buildGroupKeys(groups) {
  return normalizeRequiredPathGroups(groups).map(
    (entry) => `${normalizeOptionalString(entry.label)}:${entry.candidates.join('|')}`,
  )
}

function alignPathToRoot(entry, rootHint) {
  const normalizedEntry = normalizePathForComparison(entry)
  const normalizedRootHint = normalizePathForComparison(rootHint)

  if (!normalizedEntry || !normalizedRootHint) {
    return normalizedEntry
  }

  if (normalizedEntry === normalizedRootHint || normalizedEntry.startsWith(`${normalizedRootHint}/`)) {
    return normalizedEntry
  }

  const pathSegments = normalizedEntry.split('/').filter(Boolean)
  const rootSegments = normalizedRootHint.split('/').filter(Boolean)
  const rootBasename = rootSegments[rootSegments.length - 1] || normalizedRootHint
  const rootIndex = pathSegments.lastIndexOf(rootBasename)

  if (rootIndex === -1) {
    return normalizedEntry
  }

  return pathSegments.slice(rootIndex).join('/')
}

function compareStringSets(candidateEntries, legacyEntries, limit = 24, rootHint = '') {
  const candidate = summarizeUniqueExecutorStrings(
    (Array.isArray(candidateEntries) ? candidateEntries : [])
      .map((entry) => alignPathToRoot(entry, rootHint))
      .filter(Boolean),
    256,
  )
  const legacy = summarizeUniqueExecutorStrings(
    (Array.isArray(legacyEntries) ? legacyEntries : [])
      .map((entry) => alignPathToRoot(entry, rootHint))
      .filter(Boolean),
    256,
  )
  const candidateSet = new Set(candidate)
  const legacySet = new Set(legacy)
  const overlap = candidate.filter((entry) => legacySet.has(entry))
  const universalOnly = candidate.filter((entry) => !legacySet.has(entry))
  const legacyOnly = legacy.filter((entry) => !candidateSet.has(entry))

  return {
    candidate,
    legacy,
    overlap,
    overlapCount: overlap.length,
    candidateCount: candidate.length,
    legacyCount: legacy.length,
    aligned:
      candidate.length > 0 &&
      legacy.length > 0 &&
      overlap.length === candidate.length &&
      overlap.length === legacy.length,
    universalOnly: universalOnly.slice(0, limit),
    legacyOnly: legacyOnly.slice(0, limit),
    missingFromUniversal: legacyOnly.slice(0, limit),
  }
}

function buildLegacyRequiredPathGroups(materializationPlan) {
  return normalizeRequiredPathGroups(
    Array.isArray(materializationPlan?.contractDefinition?.requiredPathGroups) &&
      materializationPlan.contractDefinition.requiredPathGroups.length > 0
      ? materializationPlan.contractDefinition.requiredPathGroups
      : materializationPlan?.requiredPathGroups,
  )
}

function buildLegacyFilesToCreate(materializationPlan) {
  const projectRoot = normalizePathForComparison(materializationPlan?.projectRoot)

  return summarizeUniqueExecutorStrings(
    (Array.isArray(materializationPlan?.operations) ? materializationPlan.operations : [])
      .map((entry) => normalizePathForComparison(entry?.targetPath))
      .filter(
        (entry) =>
          entry &&
          entry !== projectRoot &&
          !entry.endsWith('/') &&
          !/\/$/.test(entry),
      ),
    256,
  )
}

function buildLegacyFileChecks(materializationPlan) {
  const validationFileChecks = Array.isArray(materializationPlan?.validationPlan?.fileChecks)
    ? materializationPlan.validationPlan.fileChecks
        .map((entry) => normalizePathForComparison(entry?.path))
        .filter(Boolean)
    : []

  if (validationFileChecks.length > 0) {
    return summarizeUniqueExecutorStrings(validationFileChecks, 256)
  }

  return buildLegacyFilesToCreate(materializationPlan)
}

function buildLegacyValidationChecks(materializationPlan) {
  const validationPlan =
    materializationPlan?.validationPlan && typeof materializationPlan.validationPlan === 'object'
      ? materializationPlan.validationPlan
      : null

  const checks = [
    ...(Array.isArray(validationPlan?.commands) ? validationPlan.commands : []),
    ...(Array.isArray(validationPlan?.runtimeChecks) ? validationPlan.runtimeChecks : []),
    ...(Array.isArray(validationPlan?.manualChecks) ? validationPlan.manualChecks : []),
    ...(Array.isArray(validationPlan?.forbiddenPaths) ? validationPlan.forbiddenPaths : []),
    ...(Array.isArray(validationPlan?.fileChecks)
      ? validationPlan.fileChecks.map((entry) => entry?.path || entry?.expectation || '')
      : []),
  ]

  return summarizeUniqueExecutorStrings(checks, 256)
}

function buildLegacyForbiddenSignals(materializationPlan) {
  return summarizeUniqueExecutorStrings(
    [
      ...(Array.isArray(materializationPlan?.contractDefinition?.forbiddenSignals)
        ? materializationPlan.contractDefinition.forbiddenSignals
        : []),
      ...(Array.isArray(materializationPlan?.validationPlan?.forbiddenPaths)
        ? materializationPlan.validationPlan.forbiddenPaths
        : []),
      ...(Array.isArray(materializationPlan?.forbiddenSignals)
        ? materializationPlan.forbiddenSignals
        : []),
    ].map((entry) => normalizePathForComparison(entry)),
    64,
  )
}

function buildLegacyPlanSafety(materializationPlan) {
  const allSignals = [
    normalizePathForComparison(materializationPlan?.projectRoot),
    ...(Array.isArray(materializationPlan?.allowedTargetPaths)
      ? materializationPlan.allowedTargetPaths.map((entry) => normalizePathForComparison(entry))
      : []),
    ...buildLegacyFilesToCreate(materializationPlan),
    ...buildLegacyForbiddenSignals(materializationPlan),
    ...buildLegacyValidationChecks(materializationPlan),
  ]
  const validationCommands = Array.isArray(materializationPlan?.validationPlan?.commands)
    ? materializationPlan.validationPlan.commands
    : []

  return {
    noDotEnv: !allSignals.some((entry) => /(^|\/)\.env(?:\..+)?($|\/)/iu.test(entry)),
    noNodeModules: !allSignals.some((entry) => /(^|\/)node_modules($|\/)/iu.test(entry)),
    noDocker: !allSignals.some((entry) =>
      /(^|\/)(?:dockerfile|docker-compose\.ya?ml)($|\/)/iu.test(entry),
    ),
    noDeploy: !allSignals.some((entry) => /(^|\/)deploy($|\/)/iu.test(entry)),
    noWebPrueba: !allSignals.some((entry) => /(^|\/)web-prueba($|\/)/iu.test(entry)),
    noCommands:
      validationCommands.length === 0 &&
      !(Array.isArray(materializationPlan?.operations)
        ? materializationPlan.operations.some((entry) => /command|spawn|exec/iu.test(entry?.type || ''))
        : false),
  }
}

function buildGeneratedDomainUniversalMaterializationPlanCandidate({
  generatedDomainContract,
  generatedDomainContractDiagnostics,
  generatedDomainCapabilityProfile,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainFileCreationApprovalPolicy,
  domainConsistencyDiagnostics,
}) {
  const emptyCandidate = {
    present: false,
    built: false,
    status: 'not-available',
    source: 'generated-domain-universal',
    behaviorChanged: false,
    projectRoot: null,
    allowedTargetPaths: [],
    requiredPathGroups: [],
    filesToCreate: [],
    fileChecks: [],
    validationPlan: {
      syntaxChecks: [],
      jsonChecks: [],
      pathChecks: [],
      forbiddenPathChecks: [],
    },
    forbiddenSignals: [],
    approvalRequired: true,
    approved: false,
    safety: {
      safeForLocalMaterialization: false,
      noDotEnv: false,
      noNodeModules: false,
      noDocker: false,
      noDeploy: false,
      noExternalServices: false,
      noRealPayments: false,
      noCredentials: false,
      noCommands: false,
      sandboxOnly: true,
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const contract =
    generatedDomainContract && typeof generatedDomainContract === 'object'
      ? generatedDomainContract
      : null
  const contractDiagnostics =
    generatedDomainContractDiagnostics &&
    typeof generatedDomainContractDiagnostics === 'object'
      ? generatedDomainContractDiagnostics
      : null
  const capabilityProfile =
    generatedDomainCapabilityProfile &&
    typeof generatedDomainCapabilityProfile === 'object'
      ? generatedDomainCapabilityProfile
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const shadowCandidate =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const approvalPolicy =
    generatedDomainFileCreationApprovalPolicy &&
    typeof generatedDomainFileCreationApprovalPolicy === 'object'
      ? generatedDomainFileCreationApprovalPolicy
      : null
  const consistency =
    domainConsistencyDiagnostics && typeof domainConsistencyDiagnostics === 'object'
      ? domainConsistencyDiagnostics
      : null

  if (
    !contract &&
    !contractDiagnostics &&
    !capabilityProfile &&
    !preview &&
    !shadowCandidate &&
    !approvalPolicy &&
    !consistency
  ) {
    return emptyCandidate
  }

  try {
    const warnings = []
    const errors = []
    const projectRoot = normalizePathForComparison(
      preview?.targetRoot ||
        preview?.root ||
        contract?.root?.targetRoot ||
        contract?.root?.slug ||
        shadowCandidate?.candidate?.targetRoot,
    )
    const previewPresent = preview?.present === true
    const previewBuilt = preview?.built === true
    const previewSafe = preview?.safety?.safeForLocalMaterialization === true
    const approvalBlocked = normalizeOptionalString(approvalPolicy?.status) === 'blocked'
    const domainMismatch =
      normalizeOptionalString(consistency?.status) === 'mismatch' ||
      normalizeOptionalString(consistency?.status) === 'error' ||
      normalizeOptionalString(consistency?.semanticStatus) === 'mismatch' ||
      normalizeOptionalString(consistency?.semanticStatus) === 'error'
    const rootLooksUnsafe =
      !projectRoot ||
      projectRoot.startsWith('../') ||
      /(^|\/)\.env(?:\..+)?($|\/)/iu.test(projectRoot) ||
      /(^|\/)node_modules($|\/)/iu.test(projectRoot) ||
      /(^|\/)web-prueba($|\/)/iu.test(projectRoot)
    const hasFrontend =
      preview?.frontend?.present === true ||
      capabilityProfile?.surfaces?.public === true ||
      capabilityProfile?.surfaces?.admin === true
    const hasBackend =
      preview?.backend?.present === true || capabilityProfile?.backendApi === true
    const hasDatabase =
      preview?.database?.present === true || capabilityProfile?.data?.databaseLocal === true
    const prefixWithProjectRoot = (entry) => {
      const normalizedEntry = normalizePathForComparison(entry)
      if (!normalizedEntry) {
        return ''
      }
      if (!projectRoot) {
        return normalizedEntry
      }
      if (
        normalizedEntry === projectRoot ||
        normalizedEntry.startsWith(`${projectRoot}/`) ||
        normalizedEntry.startsWith('/') ||
        /^[a-z]:/iu.test(normalizedEntry)
      ) {
        return normalizedEntry
      }
      return `${projectRoot}/${normalizedEntry}`.replace(/\/{2,}/gu, '/')
    }

    const allowedTargetPaths = summarizeUniqueExecutorStrings(
      [
        projectRoot,
        ...(Array.isArray(preview?.allowedTargetPaths) ? preview.allowedTargetPaths : []),
        ...(Array.isArray(shadowCandidate?.candidate?.allowedTargetPaths)
          ? shadowCandidate.candidate.allowedTargetPaths
          : []),
      ].map((entry) => normalizePathForComparison(entry)),
      128,
    ).filter(Boolean)

    const requiredPathGroups = normalizeRequiredPathGroups(
      Array.isArray(preview?.requiredPathGroups) && preview.requiredPathGroups.length > 0
        ? preview.requiredPathGroups
        : contract?.validation?.requiredPathGroups,
    )

    const contractRequiredFiles = Array.isArray(contract?.materialization?.requiredFiles)
      ? contract.materialization.requiredFiles
      : []
    const contractSurfaceFiles = Array.isArray(contract?.frontendSurfaces)
      ? contract.frontendSurfaces.map((surface) => {
          const normalizedSurfacePath = normalizePathForComparison(surface?.path)
          return normalizedSurfacePath ? `${normalizedSurfacePath}/index.html` : ''
        })
      : []
    const filesToCreate = summarizeUniqueExecutorStrings(
      [
        ...contractRequiredFiles.map((entry) => prefixWithProjectRoot(entry)),
        ...contractSurfaceFiles.map((entry) => prefixWithProjectRoot(entry)),
        prefixWithProjectRoot(contract?.backend?.entryFile),
        prefixWithProjectRoot(contract?.database?.schemaFile),
        prefixWithProjectRoot(contract?.database?.seedFile),
        ...(Array.isArray(contract?.shared?.files)
          ? contract.shared.files.map((entry) => prefixWithProjectRoot(entry))
          : []),
        ...(Array.isArray(contract?.docs)
          ? contract.docs.map((entry) => prefixWithProjectRoot(entry))
          : []),
        ...(Array.isArray(contract?.scripts)
          ? contract.scripts.map((entry) => prefixWithProjectRoot(entry))
          : []),
        `${projectRoot}/README.md`,
        `${projectRoot}/docs/domain.md`,
        `${projectRoot}/shared/contracts/domain.js`,
        `${projectRoot}/validation/report.json`,
        hasFrontend ? `${projectRoot}/frontend/src/main.js` : '',
        hasFrontend ? `${projectRoot}/frontend/src/mock-data.js` : '',
        hasBackend ? `${projectRoot}/backend/src/index.js` : '',
        hasDatabase ? `${projectRoot}/database/seed.json` : '',
      ].map((entry) => normalizePathForComparison(entry)),
      96,
    )
      .filter(Boolean)
      .map((entry) => ({
        path: entry,
        kind: /\.html$/iu.test(entry)
          ? 'html'
          : /\.json$/iu.test(entry)
            ? 'json'
            : /\.sql$/iu.test(entry)
              ? 'sql'
              : /\.md$/iu.test(entry)
                ? 'markdown'
                : 'javascript',
      }))

    const fileChecks = filesToCreate.map((entry) => ({
      path: entry.path,
      expectation: 'exists',
    }))

    const forbiddenSignals = summarizeUniqueExecutorStrings(
      [
        ...(Array.isArray(preview?.forbiddenSignals) ? preview.forbiddenSignals : []),
        ...(Array.isArray(contract?.safety?.forbiddenFiles) ? contract.safety.forbiddenFiles : []),
        ...(Array.isArray(contract?.safety?.forbiddenSignals)
          ? contract.safety.forbiddenSignals
          : []),
        '.env',
        'node_modules',
        'Dockerfile',
        'docker-compose.yml',
        'deploy',
        'web-prueba',
      ].map((entry) => normalizePathForComparison(entry)),
      64,
    )

    const validationPlan = {
      syntaxChecks: filesToCreate
        .filter((entry) => /\.js$/iu.test(entry.path))
        .map((entry) => entry.path),
      jsonChecks: filesToCreate
        .filter((entry) => /\.json$/iu.test(entry.path))
        .map((entry) => entry.path),
      pathChecks: projectRoot ? [projectRoot] : [],
      forbiddenPathChecks: forbiddenSignals.filter((entry) =>
        ['.env', 'node_modules', 'dockerfile', 'docker-compose.yml', 'deploy', 'web-prueba'].includes(
          entry,
        ),
      ),
    }

    const candidate = {
      ...emptyCandidate,
      present: true,
      projectRoot: projectRoot || null,
      allowedTargetPaths,
      requiredPathGroups,
      filesToCreate,
      fileChecks,
      validationPlan,
      forbiddenSignals,
      safety: {
        safeForLocalMaterialization:
          previewSafe &&
          approvalPolicy?.safeguards?.noDotEnv === true &&
          approvalPolicy?.safeguards?.noNodeModules === true &&
          approvalPolicy?.safeguards?.noDocker === true &&
          approvalPolicy?.safeguards?.noDeploy === true &&
          approvalPolicy?.safeguards?.noExternalServices === true &&
          approvalPolicy?.safeguards?.noRealPayments === true &&
          approvalPolicy?.safeguards?.noCommands === true &&
          approvalPolicy?.safeguards?.noWebPrueba === true &&
          !rootLooksUnsafe,
        noDotEnv:
          approvalPolicy?.safeguards?.noDotEnv === true &&
          !filesToCreate.some((entry) => /(^|\/)\.env(?:\..+)?$/iu.test(entry.path)),
        noNodeModules:
          approvalPolicy?.safeguards?.noNodeModules === true &&
          !filesToCreate.some((entry) => /(^|\/)node_modules(\/|$)/iu.test(entry.path)),
        noDocker:
          approvalPolicy?.safeguards?.noDocker === true &&
          !filesToCreate.some((entry) =>
            /(^|\/)(?:dockerfile|docker-compose\.ya?ml)$/iu.test(entry.path),
          ),
        noDeploy:
          approvalPolicy?.safeguards?.noDeploy === true &&
          !filesToCreate.some((entry) => /(^|\/)deploy(\/|$)/iu.test(entry.path)),
        noExternalServices: approvalPolicy?.safeguards?.noExternalServices === true,
        noRealPayments: approvalPolicy?.safeguards?.noRealPayments === true,
        noCredentials: true,
        noCommands: approvalPolicy?.safeguards?.noCommands === true,
        sandboxOnly: true,
      },
      warnings,
      errors,
    }

    if (!previewPresent) {
      pushUniqueMessage(
        warnings,
        'Todavia no hay generatedDomainUniversalMaterializationPlanPreview disponible para construir un candidate comparable.',
      )
    }
    if (!previewBuilt) {
      pushUniqueMessage(
        warnings,
        'El universal materialization preview todavia no esta built, asi que este candidate sigue siendo observacional.',
      )
    }
    if (domainMismatch) {
      pushUniqueMessage(
        errors,
        'La consistencia de dominio sigue en mismatch, por lo que el candidate universal no puede promoverse.',
      )
    }
    if (approvalBlocked) {
      pushUniqueMessage(
        errors,
        'La policy de aprobacion de archivos sigue bloqueada para este candidate universal.',
      )
    }
    if (rootLooksUnsafe) {
      pushUniqueMessage(
        errors,
        'El root inferido para el candidate universal es inseguro o apunta a rutas bloqueadas.',
      )
    }

    if (!projectRoot || domainMismatch || approvalBlocked || rootLooksUnsafe) {
      candidate.status = 'blocked'
    } else if (
      candidate.safety.safeForLocalMaterialization === true &&
      filesToCreate.length > 0 &&
      (previewBuilt || previewPresent)
    ) {
      candidate.status = 'built'
      candidate.built = true
    } else {
      candidate.status = 'partial'
    }

    candidate.warningsCount = candidate.warnings.length
    candidate.errorsCount = candidate.errors.length
    return candidate
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyCandidate,
      present: true,
      status: 'error',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildGeneratedDomainMaterializationPlanCandidateLegacyComparison({
  generatedDomainUniversalMaterializationPlanCandidate,
  materializationPlan,
}) {
  const emptyComparison = {
    present: false,
    compared: false,
    status: 'not-available',
    source: 'generated-domain-universal-plan-candidate-legacy-comparison',
    behaviorChanged: false,
    legacyPlanPresent: false,
    candidatePresent: false,
    roots: {
      candidate: null,
      legacy: null,
      aligned: false,
    },
    allowedTargetPaths: {
      overlapCount: 0,
      candidateCount: 0,
      legacyCount: 0,
      aligned: false,
    },
    requiredPathGroups: {
      overlapCount: 0,
      candidateCount: 0,
      legacyCount: 0,
      aligned: false,
    },
    filesToCreate: {
      overlapCount: 0,
      candidateCount: 0,
      legacyCount: 0,
      aligned: false,
    },
    fileChecks: {
      overlapCount: 0,
      candidateCount: 0,
      legacyCount: 0,
      aligned: false,
    },
    validationPlan: {
      overlapCount: 0,
      candidateCount: 0,
      legacyCount: 0,
      aligned: false,
    },
    forbiddenSignals: {
      overlapCount: 0,
      candidateCount: 0,
      legacyCount: 0,
      aligned: false,
    },
    safety: {
      candidateSafe: false,
      legacySafe: false,
      aligned: false,
    },
    approvalRequired: {
      candidate: true,
      legacy: null,
      aligned: false,
    },
    sandboxReadiness: {
      candidateReady: false,
      legacyReady: false,
      aligned: false,
    },
    overlapCounts: {
      allowedTargetPaths: 0,
      requiredPathGroups: 0,
      filesToCreate: 0,
      fileChecks: 0,
      validationPlan: 0,
      forbiddenSignals: 0,
    },
    missingFromUniversal: [],
    legacyOnly: [],
    universalOnly: [],
    blockers: [],
    recommendation: 'observe',
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const candidate =
    generatedDomainUniversalMaterializationPlanCandidate &&
    typeof generatedDomainUniversalMaterializationPlanCandidate === 'object'
      ? generatedDomainUniversalMaterializationPlanCandidate
      : null
  const legacyPlan =
    materializationPlan && typeof materializationPlan === 'object' ? materializationPlan : null

  if (!candidate && !legacyPlan) {
    return emptyComparison
  }

  try {
    const warnings = []
    const errors = []
    const blockers = []
    const candidatePresent = candidate?.present === true
    const legacyPlanPresent = Boolean(legacyPlan)
    const candidateRoot = normalizePathForComparison(candidate?.projectRoot)
    const legacyRoot = normalizePathForComparison(legacyPlan?.projectRoot)
    const comparisonRootHint = candidateRoot || legacyRoot
    const rootsAligned = Boolean(candidateRoot && legacyRoot && candidateRoot === legacyRoot)
    const allowedTargetPaths = compareStringSets(
      candidate?.allowedTargetPaths,
      legacyPlan?.allowedTargetPaths,
      24,
      comparisonRootHint,
    )
    const requiredPathGroups = compareStringSets(
      buildGroupKeys(candidate?.requiredPathGroups),
      buildGroupKeys(buildLegacyRequiredPathGroups(legacyPlan)),
    )
    const filesToCreate = compareStringSets(
      Array.isArray(candidate?.filesToCreate)
        ? candidate.filesToCreate.map((entry) => entry?.path)
        : [],
      buildLegacyFilesToCreate(legacyPlan),
      24,
      comparisonRootHint,
    )
    const fileChecks = compareStringSets(
      Array.isArray(candidate?.fileChecks) ? candidate.fileChecks.map((entry) => entry?.path) : [],
      buildLegacyFileChecks(legacyPlan),
      24,
      comparisonRootHint,
    )
    const validationPlan = compareStringSets(
      [
        ...(Array.isArray(candidate?.validationPlan?.syntaxChecks)
          ? candidate.validationPlan.syntaxChecks
          : []),
        ...(Array.isArray(candidate?.validationPlan?.jsonChecks)
          ? candidate.validationPlan.jsonChecks
          : []),
        ...(Array.isArray(candidate?.validationPlan?.pathChecks)
          ? candidate.validationPlan.pathChecks
          : []),
        ...(Array.isArray(candidate?.validationPlan?.forbiddenPathChecks)
          ? candidate.validationPlan.forbiddenPathChecks
          : []),
      ],
      buildLegacyValidationChecks(legacyPlan),
      24,
      comparisonRootHint,
    )
    const forbiddenSignals = compareStringSets(
      candidate?.forbiddenSignals,
      buildLegacyForbiddenSignals(legacyPlan),
    )
    const legacySafety = buildLegacyPlanSafety(legacyPlan)
    const safetyAligned =
      candidate?.safety?.safeForLocalMaterialization === true &&
      legacySafety.noDotEnv === true &&
      legacySafety.noNodeModules === true &&
      legacySafety.noDocker === true &&
      legacySafety.noDeploy === true &&
      legacySafety.noCommands === true
    const approvalAligned =
      (candidate?.approvalRequired !== false) ===
      (typeof legacyPlan?.approvalRequired === 'boolean' ? legacyPlan.approvalRequired : true)
    const sandboxAligned =
      candidate?.built === true &&
      candidate?.safety?.safeForLocalMaterialization === true &&
      safetyAligned

    const comparison = {
      ...emptyComparison,
      present: true,
      compared: candidatePresent || legacyPlanPresent,
      legacyPlanPresent,
      candidatePresent,
      roots: {
        candidate: candidateRoot || null,
        legacy: legacyRoot || null,
        aligned: rootsAligned,
      },
      allowedTargetPaths: {
        overlapCount: allowedTargetPaths.overlapCount,
        candidateCount: allowedTargetPaths.candidateCount,
        legacyCount: allowedTargetPaths.legacyCount,
        aligned: allowedTargetPaths.aligned,
      },
      requiredPathGroups: {
        overlapCount: requiredPathGroups.overlapCount,
        candidateCount: requiredPathGroups.candidateCount,
        legacyCount: requiredPathGroups.legacyCount,
        aligned: requiredPathGroups.aligned,
      },
      filesToCreate: {
        overlapCount: filesToCreate.overlapCount,
        candidateCount: filesToCreate.candidateCount,
        legacyCount: filesToCreate.legacyCount,
        aligned: filesToCreate.aligned,
      },
      fileChecks: {
        overlapCount: fileChecks.overlapCount,
        candidateCount: fileChecks.candidateCount,
        legacyCount: fileChecks.legacyCount,
        aligned: fileChecks.aligned,
      },
      validationPlan: {
        overlapCount: validationPlan.overlapCount,
        candidateCount: validationPlan.candidateCount,
        legacyCount: validationPlan.legacyCount,
        aligned: validationPlan.aligned,
      },
      forbiddenSignals: {
        overlapCount: forbiddenSignals.overlapCount,
        candidateCount: forbiddenSignals.candidateCount,
        legacyCount: forbiddenSignals.legacyCount,
        aligned: forbiddenSignals.aligned,
      },
      safety: {
        candidateSafe: candidate?.safety?.safeForLocalMaterialization === true,
        legacySafe:
          legacySafety.noDotEnv &&
          legacySafety.noNodeModules &&
          legacySafety.noDocker &&
          legacySafety.noDeploy &&
          legacySafety.noCommands,
        aligned: safetyAligned,
      },
      approvalRequired: {
        candidate: candidate?.approvalRequired !== false,
        legacy:
          typeof legacyPlan?.approvalRequired === 'boolean' ? legacyPlan.approvalRequired : true,
        aligned: approvalAligned,
      },
      sandboxReadiness: {
        candidateReady: candidate?.built === true,
        legacyReady: legacyPlanPresent,
        aligned: sandboxAligned,
      },
      overlapCounts: {
        allowedTargetPaths: allowedTargetPaths.overlapCount,
        requiredPathGroups: requiredPathGroups.overlapCount,
        filesToCreate: filesToCreate.overlapCount,
        fileChecks: fileChecks.overlapCount,
        validationPlan: validationPlan.overlapCount,
        forbiddenSignals: forbiddenSignals.overlapCount,
      },
      missingFromUniversal: summarizeUniqueExecutorStrings(
        [
          ...requiredPathGroups.missingFromUniversal,
          ...filesToCreate.missingFromUniversal,
          ...allowedTargetPaths.missingFromUniversal,
        ],
        24,
      ),
      legacyOnly: summarizeUniqueExecutorStrings(
        [
          ...requiredPathGroups.legacyOnly,
          ...filesToCreate.legacyOnly,
          ...allowedTargetPaths.legacyOnly,
        ],
        24,
      ),
      universalOnly: summarizeUniqueExecutorStrings(
        [
          ...requiredPathGroups.universalOnly,
          ...filesToCreate.universalOnly,
          ...allowedTargetPaths.universalOnly,
        ],
        24,
      ),
      blockers,
      warnings,
      errors,
    }

    if (!candidatePresent) {
      pushUniqueMessage(
        warnings,
        'Todavia no hay generatedDomainUniversalMaterializationPlanCandidate para comparar contra legacy.',
      )
    }
    if (!legacyPlanPresent) {
      pushUniqueMessage(
        warnings,
        'No hay materializationPlan legacy disponible para una comparacion fuerte del plan universal candidate.',
      )
    }
    if (!rootsAligned && candidatePresent && legacyPlanPresent) {
      pushUniqueMessage(blockers, 'root-mismatch')
    }
    if (candidate?.status === 'blocked') {
      pushUniqueMessage(blockers, 'candidate-blocked')
    }
    if (!comparison.safety.candidateSafe && candidatePresent) {
      pushUniqueMessage(blockers, 'candidate-unsafe')
    }

    if (!candidatePresent || !legacyPlanPresent) {
      comparison.status = 'not-available'
      comparison.recommendation = 'observe'
    } else if (blockers.length > 0) {
      comparison.status = 'blocked'
      comparison.recommendation = 'investigate'
    } else if (
      rootsAligned &&
      (allowedTargetPaths.aligned || allowedTargetPaths.overlapCount > 0) &&
      (requiredPathGroups.aligned || requiredPathGroups.overlapCount > 0) &&
      safetyAligned
    ) {
      comparison.status =
        allowedTargetPaths.aligned &&
        requiredPathGroups.aligned &&
        filesToCreate.overlapCount > 0 &&
        approvalAligned
          ? 'aligned'
          : 'partial'
      comparison.recommendation =
        comparison.status === 'aligned' ? 'ready-for-harness' : 'observe'
    } else {
      comparison.status = 'divergent'
      comparison.recommendation = 'keep-legacy'
    }

    comparison.warningsCount = comparison.warnings.length
    comparison.errorsCount = comparison.errors.length
    return comparison
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyComparison,
      present: true,
      compared: true,
      status: 'error',
      recommendation: 'investigate',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildGeneratedDomainMaterializationPlanDecouplingReport({
  materializationPlan,
  generatedDomainUniversalMaterializationPlan,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainFileCreationApprovalPolicy,
  generatedDomainFileCreationApprovalEvaluation,
  generatedDomainUniversalMaterializationPlanCandidate,
  generatedDomainMaterializationPlanCandidateLegacyComparison,
}) {
  const emptyReport = {
    present: false,
    evaluated: false,
    behaviorChanged: false,
    currentPlanSource: 'none',
    legacyPlanPresent: false,
    universalPlanPresent: false,
    previewPresent: false,
    candidatePresent: false,
    legacyArchetypeUsed: false,
    universalCanRepresentPlan: false,
    approvalPolicyReady: false,
    sandboxMaterializationReady: false,
    migrationStatus: 'not-ready',
    blockers: [],
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const legacyPlan =
    materializationPlan && typeof materializationPlan === 'object' ? materializationPlan : null
  const universalPlan =
    generatedDomainUniversalMaterializationPlan &&
    typeof generatedDomainUniversalMaterializationPlan === 'object'
      ? generatedDomainUniversalMaterializationPlan
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const shadowCandidate =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const approvalPolicy =
    generatedDomainFileCreationApprovalPolicy &&
    typeof generatedDomainFileCreationApprovalPolicy === 'object'
      ? generatedDomainFileCreationApprovalPolicy
      : null
  const approvalEvaluation =
    generatedDomainFileCreationApprovalEvaluation &&
    typeof generatedDomainFileCreationApprovalEvaluation === 'object'
      ? generatedDomainFileCreationApprovalEvaluation
      : null
  const candidate =
    generatedDomainUniversalMaterializationPlanCandidate &&
    typeof generatedDomainUniversalMaterializationPlanCandidate === 'object'
      ? generatedDomainUniversalMaterializationPlanCandidate
      : null
  const comparison =
    generatedDomainMaterializationPlanCandidateLegacyComparison &&
    typeof generatedDomainMaterializationPlanCandidateLegacyComparison === 'object'
      ? generatedDomainMaterializationPlanCandidateLegacyComparison
      : null

  if (
    !legacyPlan &&
    !universalPlan &&
    !preview &&
    !shadowCandidate &&
    !approvalPolicy &&
    !approvalEvaluation &&
    !candidate &&
    !comparison
  ) {
    return emptyReport
  }

  try {
    const warnings = []
    const errors = []
    const blockers = []
    const approvalPolicyReady =
      approvalPolicy?.present === true &&
      approvalPolicy?.evaluated === true &&
      normalizeOptionalString(approvalPolicy?.status) !== 'blocked'
    const sandboxMaterializationReady =
      candidate?.built === true &&
      candidate?.safety?.safeForLocalMaterialization === true &&
      universalPlan?.canMaterializeInSandbox === true
    const currentPlanSource =
      normalizeOptionalString(legacyPlan?.source) ||
      normalizeOptionalString(legacyPlan?.kind) ||
      normalizeOptionalString(legacyPlan?.strategy) ||
      (legacyPlan ? 'legacy-materialization-plan' : 'none')
    const legacyArchetypeUsed =
      /fullstack-local|online-courses|logistics|school|ecommerce|security|community/iu.test(
        normalizeOptionalString(legacyPlan?.contractDefinition?.contractKind) ||
          normalizeOptionalString(legacyPlan?.strategy) ||
          normalizeOptionalString(legacyPlan?.kind),
      )
    const universalCanRepresentPlan =
      candidate?.built === true ||
      normalizeOptionalString(comparison?.status) === 'aligned' ||
      normalizeOptionalString(comparison?.status) === 'partial'

    if (!legacyPlan) {
      pushUniqueMessage(blockers, 'missing-legacy-plan')
    }
    if (!candidate?.present) {
      pushUniqueMessage(blockers, 'missing-universal-candidate')
    }
    if (!preview?.present) {
      pushUniqueMessage(blockers, 'missing-universal-preview')
    }
    if (!shadowCandidate?.present) {
      pushUniqueMessage(blockers, 'missing-shadow-candidate')
    }
    if (!approvalPolicyReady) {
      pushUniqueMessage(blockers, 'approval-policy-not-ready')
    }
    if (!sandboxMaterializationReady) {
      pushUniqueMessage(blockers, 'sandbox-materialization-not-ready')
    }
    if (normalizeOptionalString(candidate?.status) === 'blocked') {
      pushUniqueMessage(blockers, 'universal-candidate-blocked')
    }
    if (normalizeOptionalString(comparison?.status) === 'blocked') {
      pushUniqueMessage(blockers, 'candidate-comparison-blocked')
    }
    if (normalizeOptionalString(comparison?.status) === 'divergent') {
      pushUniqueMessage(warnings, 'candidate-comparison-divergent')
    }
    if (approvalEvaluation?.blocked === true) {
      pushUniqueMessage(
        warnings,
        'La evaluacion de aprobacion sigue bloqueada por default porque no existe aprobacion explicita de escritura.',
      )
    }

    let migrationStatus = 'not-ready'
    if (
      normalizeOptionalString(candidate?.status) === 'blocked' ||
      normalizeOptionalString(comparison?.status) === 'blocked'
    ) {
      migrationStatus = 'blocked'
    } else if (
      candidate?.built === true &&
      approvalPolicyReady &&
      sandboxMaterializationReady &&
      ['aligned', 'partial'].includes(normalizeOptionalString(comparison?.status))
    ) {
      migrationStatus = 'ready-for-harness'
    } else if (
      preview?.present === true ||
      candidate?.present === true ||
      universalPlan?.present === true
    ) {
      migrationStatus = 'partial'
    }

    const report = {
      ...emptyReport,
      present: true,
      evaluated:
        Boolean(legacyPlan) ||
        Boolean(universalPlan?.present === true) ||
        Boolean(preview?.present === true) ||
        Boolean(candidate?.present === true) ||
        Boolean(comparison?.present === true),
      currentPlanSource,
      legacyPlanPresent: Boolean(legacyPlan),
      universalPlanPresent: universalPlan?.present === true,
      previewPresent: preview?.present === true,
      candidatePresent: candidate?.present === true,
      legacyArchetypeUsed,
      universalCanRepresentPlan,
      approvalPolicyReady,
      sandboxMaterializationReady,
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

function summarizeGeneratedDomainUniversalMaterializationPlanCandidateForDebug(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return {
      present: false,
      built: false,
      status: 'not-available',
    }
  }

  const warningSummary = summarizeDebugEntries(candidate.warnings)
  const errorSummary = summarizeDebugEntries(candidate.errors)

  return {
    present: candidate.present === true,
    built: candidate.built === true,
    status: normalizeOptionalString(candidate.status) || 'not-available',
    behaviorChanged: candidate.behaviorChanged === true,
    projectRoot: normalizeOptionalString(candidate.projectRoot) || undefined,
    allowedTargetPathsCount: Array.isArray(candidate.allowedTargetPaths)
      ? candidate.allowedTargetPaths.length
      : 0,
    requiredPathGroupsCount: Array.isArray(candidate.requiredPathGroups)
      ? candidate.requiredPathGroups.length
      : 0,
    filesToCreateCount: Array.isArray(candidate.filesToCreate)
      ? candidate.filesToCreate.length
      : 0,
    fileChecksCount: Array.isArray(candidate.fileChecks) ? candidate.fileChecks.length : 0,
    approvalRequired: candidate.approvalRequired !== false,
    approved: candidate.approved === true,
    safeForLocalMaterialization: candidate.safety?.safeForLocalMaterialization === true,
    noDotEnv: candidate.safety?.noDotEnv === true,
    noNodeModules: candidate.safety?.noNodeModules === true,
    noDocker: candidate.safety?.noDocker === true,
    noDeploy: candidate.safety?.noDeploy === true,
    noCommands: candidate.safety?.noCommands === true,
    warningsCount: Array.isArray(candidate.warnings) ? candidate.warnings.length : 0,
    errorsCount: Array.isArray(candidate.errors) ? candidate.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainMaterializationPlanCandidateLegacyComparisonForDebug(
  comparison,
) {
  if (!comparison || typeof comparison !== 'object') {
    return {
      present: false,
      compared: false,
      status: 'not-available',
    }
  }

  const warningSummary = summarizeDebugEntries(comparison.warnings)
  const errorSummary = summarizeDebugEntries(comparison.errors)

  return {
    present: comparison.present === true,
    compared: comparison.compared === true,
    status: normalizeOptionalString(comparison.status) || 'not-available',
    behaviorChanged: comparison.behaviorChanged === true,
    legacyPlanPresent: comparison.legacyPlanPresent === true,
    candidatePresent: comparison.candidatePresent === true,
    rootsAligned: comparison.roots?.aligned === true,
    allowedTargetsAligned: comparison.allowedTargetPaths?.aligned === true,
    requiredGroupsAligned: comparison.requiredPathGroups?.aligned === true,
    filesAligned: comparison.filesToCreate?.aligned === true,
    fileChecksAligned: comparison.fileChecks?.aligned === true,
    safetyAligned: comparison.safety?.aligned === true,
    recommendation: normalizeOptionalString(comparison.recommendation) || 'observe',
    warningsCount: Array.isArray(comparison.warnings) ? comparison.warnings.length : 0,
    errorsCount: Array.isArray(comparison.errors) ? comparison.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainMaterializationPlanDecouplingReportForDebug(report) {
  if (!report || typeof report !== 'object') {
    return {
      present: false,
      evaluated: false,
      migrationStatus: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(report.warnings)
  const errorSummary = summarizeDebugEntries(report.errors)

  return {
    present: report.present === true,
    evaluated: report.evaluated === true,
    migrationStatus: normalizeOptionalString(report.migrationStatus) || 'not-ready',
    behaviorChanged: report.behaviorChanged === true,
    currentPlanSource: normalizeOptionalString(report.currentPlanSource) || 'none',
    legacyPlanPresent: report.legacyPlanPresent === true,
    universalPlanPresent: report.universalPlanPresent === true,
    previewPresent: report.previewPresent === true,
    candidatePresent: report.candidatePresent === true,
    legacyArchetypeUsed: report.legacyArchetypeUsed === true,
    universalCanRepresentPlan: report.universalCanRepresentPlan === true,
    approvalPolicyReady: report.approvalPolicyReady === true,
    sandboxMaterializationReady: report.sandboxMaterializationReady === true,
    warningsCount: Array.isArray(report.warnings) ? report.warnings.length : 0,
    errorsCount: Array.isArray(report.errors) ? report.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

module.exports = {
  buildGeneratedDomainUniversalMaterializationPlanCandidate,
  buildGeneratedDomainMaterializationPlanCandidateLegacyComparison,
  buildGeneratedDomainMaterializationPlanDecouplingReport,
  summarizeGeneratedDomainUniversalMaterializationPlanCandidateForDebug,
  summarizeGeneratedDomainMaterializationPlanCandidateLegacyComparisonForDebug,
  summarizeGeneratedDomainMaterializationPlanDecouplingReportForDebug,
}
