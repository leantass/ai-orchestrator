const fs = require('node:fs')
const path = require('node:path')

function normalizeOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
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

function deriveGeneratedDomainStructuralCapabilities({
  generatedDomainContract,
  generatedDomainCapabilityProfile,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainShadowMaterializationCandidatePlan,
}) {
  const emptyCapabilities = {
    present: false,
    evaluated: false,
    behaviorChanged: false,
    hasPublicFrontend: false,
    hasAdminPanel: false,
    hasOperatorPanel: false,
    hasBackend: false,
    hasDatabase: false,
    hasReporting: false,
    hasScheduling: false,
    hasInventory: false,
    hasDocuments: false,
    hasMockPayments: false,
    hasMessaging: false,
    hasAuthMock: false,
    hasValidation: false,
    hasSafeLocalMaterialization: false,
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const normalizedContract =
    generatedDomainContract &&
    typeof generatedDomainContract === 'object' &&
    generatedDomainContract.contractVersion
      ? generatedDomainContract
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
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null

  if (!normalizedContract && !capabilityProfile && !preview && !candidatePlan) {
    return emptyCapabilities
  }

  try {
    const warnings = []
    const errors = []
    const surfaces = Array.isArray(normalizedContract?.frontendSurfaces)
      ? normalizedContract.frontendSurfaces
      : []
    const allSurfaceSignals = [
      ...surfaces.map((entry) => entry?.key),
      ...surfaces.map((entry) => entry?.label),
      ...(Array.isArray(preview?.surfaces) ? preview.surfaces.map((entry) => entry?.key) : []),
      ...(Array.isArray(preview?.surfaces)
        ? preview.surfaces.map((entry) => entry?.label)
        : []),
    ]
      .filter((entry) => typeof entry === 'string' && entry.trim())
      .map((entry) => entry.trim().toLocaleLowerCase())
    const modulesText = JSON.stringify(
      {
        workflows: normalizedContract?.workflows,
        entities: normalizedContract?.entities,
        roles: normalizedContract?.roles,
        backend: normalizedContract?.backend,
        database: normalizedContract?.database,
        shared: normalizedContract?.shared,
        docs: normalizedContract?.docs,
        scripts: normalizedContract?.scripts,
        validation: normalizedContract?.validation,
        profile: capabilityProfile,
      },
      null,
      0,
    )
    const includesAnySignal = (signals) =>
      signals.some((entry) => allSurfaceSignals.includes(entry) || modulesText.includes(entry))

    const capabilities = {
      ...emptyCapabilities,
      present: true,
      evaluated: true,
      hasPublicFrontend:
        preview?.frontend?.present === true ||
        capabilityProfile?.frontendPresent === true ||
        includesAnySignal(['public', 'catalog', 'landing']),
      hasAdminPanel:
        includesAnySignal(['admin', 'dashboard', 'backoffice']) ||
        surfaces.some((entry) =>
          /admin|dashboard|backoffice/iu.test(String(entry?.key || entry?.label || '')),
        ),
      hasOperatorPanel:
        includesAnySignal(['operator', 'operations', 'operativo']) ||
        surfaces.some((entry) =>
          /operativ|operator|operations/iu.test(String(entry?.key || entry?.label || '')),
        ),
      hasBackend:
        preview?.backend?.present === true ||
        capabilityProfile?.backendPresent === true ||
        Boolean(normalizedContract?.backend?.entryFile),
      hasDatabase:
        preview?.database?.present === true ||
        capabilityProfile?.databasePresent === true ||
        Boolean(normalizedContract?.database?.schemaFile),
      hasReporting: includesAnySignal(['report', 'reports', 'reporting', 'analytics']),
      hasScheduling: includesAnySignal([
        'schedule',
        'scheduling',
        'turnos',
        'agenda',
        'calendar',
        'reservas',
      ]),
      hasInventory: includesAnySignal(['inventory', 'stock', 'inventario', 'catalog']),
      hasDocuments: includesAnySignal(['document', 'documents', 'docs', 'expediente']),
      hasMockPayments:
        includesAnySignal(['mock-payments', 'payment', 'payments', 'checkout']) &&
        !(
          Array.isArray(normalizedContract?.integrations) &&
          normalizedContract.integrations.some(
            (entry) =>
              normalizeOptionalString(entry?.mode) !== 'mock-only' ||
              entry?.realIntegrationAllowedNow === true,
          )
        ),
      hasMessaging: includesAnySignal([
        'messaging',
        'messages',
        'notifications',
        'communications',
        'comunicaciones',
      ]),
      hasAuthMock: includesAnySignal(['auth', 'login', 'roles', 'permissions', 'mock-auth']),
      hasValidation:
        preview?.validation?.present === true ||
        (Array.isArray(normalizedContract?.validation?.requiredPathGroups) &&
          normalizedContract.validation.requiredPathGroups.length > 0),
      hasSafeLocalMaterialization:
        preview?.safety?.safeForLocalMaterialization === true &&
        preview?.safety?.noDotEnv === true &&
        preview?.safety?.noNodeModules === true &&
        preview?.safety?.noDocker === true &&
        preview?.safety?.noCommands === true &&
        preview?.safety?.noWrites === true &&
        (candidatePlan?.present !== true ||
          candidatePlan?.candidate?.safety?.safeForLocalMaterialization === true),
      warnings,
      errors,
    }

    if (
      !capabilities.hasPublicFrontend &&
      !capabilities.hasAdminPanel &&
      !capabilities.hasOperatorPanel
    ) {
      pushUniqueMessage(
        warnings,
        'Todavia no se detectan superficies frontend suficientes para derivar capacidades estructurales completas.',
      )
    }
    if (!capabilities.hasBackend) {
      pushUniqueMessage(
        warnings,
        'No se detecta backend estructural dentro del contrato universal actual.',
      )
    }
    if (!capabilities.hasDatabase) {
      pushUniqueMessage(
        warnings,
        'No se detecta database estructural dentro del contrato universal actual.',
      )
    }
    if (!capabilities.hasValidation) {
      pushUniqueMessage(
        warnings,
        'Faltan señales de validation para promover capacidades estructurales completas.',
      )
    }
    if (!capabilities.hasSafeLocalMaterialization) {
      pushUniqueMessage(
        warnings,
        'Las capacidades estructurales todavia no pueden afirmar safe local materialization completa.',
      )
    }

    capabilities.warningsCount = capabilities.warnings.length
    capabilities.errorsCount = capabilities.errors.length
    return capabilities
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyCapabilities,
      present: true,
      evaluated: true,
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildLegacyDomainHardcodingDebtReport({
  generatedDomainStructuralCapabilities,
  legacyDetectors,
}) {
  const detectors =
    legacyDetectors && typeof legacyDetectors === 'object' ? legacyDetectors : {}
  const areas = [
    {
      name: 'detectSafeFirstDeliveryModuleFamily',
      detected: detectors.detectSafeFirstDeliveryModuleFamily === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'Resuelve familias legacy conocidas a partir de modulos y sigue condicionando ramas de runtime.',
    },
    {
      name: 'detectFullstackLocalDemoArchetype',
      detected: detectors.detectFullstackLocalDemoArchetype === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'Sostiene inferencia archetype-first para demo/materialization y necesita quedar como fallback explicito.',
    },
    {
      name: 'buildCanonicalFullstackLocalMaterializationContract',
      detected: detectors.buildCanonicalFullstackLocalMaterializationContract === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-migrate-to-capabilities',
      reason: 'Codifica required paths y contract kinds por vertical como fuente legacy de verdad.',
    },
    {
      name: 'inspectFullstackLocalMaterializationContract',
      detected: detectors.inspectFullstackLocalMaterializationContract === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-migrate-to-capabilities',
      reason: 'Sigue mezclando inspeccion estructural con conocimiento legacy de archetypes y selectedDomain.',
    },
    {
      name: 'buildFullstackLocalMaterializationPlan',
      detected: detectors.buildFullstackLocalMaterializationPlan === true,
      classification: 'runtime-critical',
      migrationStatus: 'do-not-touch-yet',
      reason: 'Sigue siendo el punto mas sensible de compatibilidad y no conviene reescribirlo en este pase.',
    },
    {
      name: 'fullstackLocalDemoDataByVertical',
      detected: true,
      classification: 'fixture-only',
      migrationStatus: 'safe-to-isolate',
      reason: 'Los demos por vertical son utiles como regresion, pero no deberian gobernar el camino universal.',
    },
    {
      name: 'domainNormalizersByVertical',
      detected: true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'Persisten normalizadores por rubro que todavia sesgan selectedDomain y selectedContractKind.',
    },
    {
      name: 'selectedDomain-selectedContractKind',
      detected: true,
      classification: 'runtime-critical',
      migrationStatus: 'do-not-touch-yet',
      reason: 'Siguen siendo compatibilidad observable de payload y deben migrarse con cobertura mas amplia.',
    },
  ]

  const warnings = []
  const errors = []
  const runtimeCriticalCount = areas.filter(
    (entry) => entry.detected && entry.classification === 'runtime-critical',
  ).length
  const fixtureOnlyCount = areas.filter(
    (entry) => entry.detected && entry.classification === 'fixture-only',
  ).length
  const migrationCandidates = areas
    .filter(
      (entry) =>
        entry.detected &&
        (entry.migrationStatus === 'safe-to-wrap' ||
          entry.migrationStatus === 'safe-to-isolate' ||
          entry.migrationStatus === 'safe-to-migrate-to-capabilities'),
    )
    .map((entry) => ({
      area: entry.name,
      migrationStatus: entry.migrationStatus,
      reason: entry.reason,
    }))
  const riskyAreas = areas
    .filter(
      (entry) =>
        entry.detected &&
        (entry.classification === 'runtime-critical' ||
          entry.migrationStatus === 'do-not-touch-yet'),
    )
    .map((entry) => ({
      area: entry.name,
      migrationStatus: entry.migrationStatus,
      reason: entry.reason,
    }))
  const structuralCapabilities =
    generatedDomainStructuralCapabilities &&
    typeof generatedDomainStructuralCapabilities === 'object'
      ? generatedDomainStructuralCapabilities
      : null

  if (runtimeCriticalCount > 0) {
    pushUniqueMessage(
      warnings,
      'main.cjs todavia concentra resolvers runtime-critical por familia/archetype que deben migrarse de forma gradual.',
    )
  }
  if (fixtureOnlyCount === 0) {
    pushUniqueMessage(
      warnings,
      'No se detectaron suficientes zonas marcadas como fixture-only; conviene seguir separando demos de runtime real.',
    )
  }
  if (structuralCapabilities?.hasSafeLocalMaterialization !== true) {
    pushUniqueMessage(
      warnings,
      'Las capacidades estructurales todavia no alcanzan para reemplazar el hardcoding legacy como motor de runtime.',
    )
  }

  return {
    present: true,
    evaluated: true,
    behaviorChanged: false,
    legacyResolversDetected: areas.filter((entry) => entry.detected).length,
    runtimeCriticalCount,
    fixtureOnlyCount,
    migrationCandidates,
    riskyAreas,
    recommendedNextActions: [
      'Mantener buildFullstackLocalMaterializationPlan como fallback legacy mientras preview/candidate ganan cobertura.',
      'Seguir migrando inspeccion y comparacion hacia capabilities estructurales antes de tocar selectedDomain o selectedContractKind.',
      'Aislar demos y archetypes conocidos como fixtures/regresiones, no como fuente conceptual del runtime nuevo.',
    ],
    areas,
    warnings,
    errors,
    warningsCount: warnings.length,
    errorsCount: errors.length,
  }
}

function readLocalDeterministicExecutorAuditSurface({ executorBasePath, cwd } = {}) {
  const resolvedCwd =
    typeof cwd === 'string' && cwd.trim()
      ? cwd
      : typeof process !== 'undefined' && typeof process.cwd === 'function'
        ? process.cwd()
        : ''
  const basePath =
    typeof executorBasePath === 'string' && executorBasePath.trim()
      ? executorBasePath
      : resolvedCwd
        ? path.join(resolvedCwd, 'electron')
        : ''
  const executorFilePath = path.join(basePath, 'local-deterministic-executor.cjs')

  if (!fs.existsSync(executorFilePath)) {
    return {
      executorFilePath,
      executorFilePresent: false,
      sourceText: '',
      normalizedText: '',
      readError: '',
    }
  }

  try {
    const sourceText = fs.readFileSync(executorFilePath, 'utf8')
    return {
      executorFilePath,
      executorFilePresent: true,
      sourceText,
      normalizedText: sourceText.toLocaleLowerCase(),
      readError: '',
    }
  } catch (error) {
    return {
      executorFilePath,
      executorFilePresent: true,
      sourceText: '',
      normalizedText: '',
      readError:
        error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error',
    }
  }
}

function buildLocalDeterministicExecutorLegacyDebtReport(options = {}) {
  const auditSurface = readLocalDeterministicExecutorAuditSurface(options)
  const warnings = []
  const errors = []

  const detectSignal = (patterns) =>
    patterns.some((pattern) => pattern.test(auditSurface.sourceText || ''))

  const areas = [
    {
      name: 'detectSafeFirstDeliveryInteractionMode',
      detected: detectSignal([/function\s+detectSafeFirstDeliveryInteractionMode\s*\(/u]),
      classification: 'runtime-critical',
      migrationStatus: 'capability-candidate',
      reason: 'Todavia resume ramas por ecommerce, school-crm y generic antes de llegar al runtime mode.',
    },
    {
      name: 'buildSafeFirstDeliveryRuntimeModeConfig',
      detected: detectSignal([/function\s+buildSafeFirstDeliveryRuntimeModeConfig\s*\(/u]),
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-migrate-later',
      reason: 'Sigue resolviendo runtimeMode a partir de interactionMode y necesita migracion gradual a capacidades.',
    },
    {
      name: 'productType-domainLabel-resolution',
      detected: detectSignal([/resolvedProductType/u, /resolvedDomain/u, /domainLabel/u]),
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'La resolucion de productType y domainLabel todavia condiciona copy, logs y plantillas por rubro.',
    },
    {
      name: 'school-crm-entry-templates',
      detected: detectSignal([/school-crm/u, /entryTemplates/u]),
      classification: 'safe-to-observe',
      migrationStatus: 'capability-candidate',
      reason: 'Las variaciones school-crm ya pueden reinterpretarse como admin-panel, forms y reporting.',
    },
    {
      name: 'ecommerce-mode-branches',
      detected: detectSignal([/ecommerce/u, /mercado pago/u, /catalogo/u]),
      classification: 'runtime-critical',
      migrationStatus: 'capability-candidate',
      reason: 'Las ramas ecommerce concentran catalog, checkout mock e inventario como capacidades transferibles.',
    },
    {
      name: 'generic-fallback-mode',
      detected: detectSignal([/return 'generic'/u, /kind:\s*'generic'/u]),
      classification: 'runtime-critical',
      migrationStatus: 'do-not-touch-yet',
      reason: 'El fallback generic sigue sosteniendo compatibilidad amplia y no conviene moverlo sin cobertura extra.',
    },
    {
      name: 'string-domain-logs-and-builders',
      detected: detectSignal([/domainLabel/u, /productLabel/u, /fallbackLabel/u]),
      classification: 'fixture-like',
      migrationStatus: 'safe-to-observe',
      reason: 'Hay copy y builders de UX local atados a labels de dominio que pueden desacoplarse despues del runtime.',
    },
  ]

  const domainSpecificSignals = [
    'ecommerce',
    'school-crm',
    'generic',
    'interactionMode',
    'runtimeMode',
    'productType',
    'domainLabel',
  ].filter((entry) => auditSurface.normalizedText.includes(entry.toLocaleLowerCase()))
  const normalizedDetectedSignals = domainSpecificSignals.map((entry) =>
    entry.toLocaleLowerCase(),
  )

  const capabilityMigrationCandidates = [
    {
      capability: 'catalog',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      note: 'Catalogo, productos y stock mock ya aparecen como senales estructurales reutilizables.',
    },
    {
      capability: 'admin-panel',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'partial',
      note: 'Los paneles administrativos ya pueden derivarse como vistas seguras sin atarse al rubro escolar.',
    },
    {
      capability: 'forms',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'partial',
      note: 'Los formularios mock del executor pueden unificarse como capacidades CRUD locales.',
    },
    {
      capability: 'reporting',
      currentBranches: ['school-crm-entry-templates', 'string-domain-logs-and-builders'],
      migrationReadiness: 'partial',
      note: 'Los reportes mock existen pero siguen mezclados con labels de dominio.',
    },
    {
      capability: 'mock-payments',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      note: 'Los pagos siguen siendo mock y pueden abstraerse sin tocar integraciones reales.',
    },
    {
      capability: 'tracking',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      note: 'Todavia no hay una capa de tracking estructural clara en el executor actual.',
    },
    {
      capability: 'database-local',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      note: 'El executor safe-first no gobierna database local real; debe quedar fuera hasta otra fase.',
    },
    {
      capability: 'backend-api',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      note: 'El executor no debe promover backend real sin una politica separada y aprobada.',
    },
  ]

  const runtimeCriticalCount = areas.filter(
    (entry) => entry.detected && entry.classification === 'runtime-critical',
  ).length
  const riskyAreas = areas
    .filter(
      (entry) =>
        entry.detected &&
        (entry.classification === 'runtime-critical' ||
          entry.migrationStatus === 'do-not-touch-yet'),
    )
    .map((entry) => ({
      area: entry.name,
      classification: entry.classification,
      migrationStatus: entry.migrationStatus,
      reason: entry.reason,
    }))

  if (auditSurface.executorFilePresent !== true) {
    pushUniqueMessage(
      errors,
      'No se encontro electron/local-deterministic-executor.cjs para auditar deuda legacy.',
    )
  }
  if (auditSurface.readError) {
    pushUniqueMessage(
      errors,
      `No se pudo leer el executor local para auditarlo: ${auditSurface.readError}.`,
    )
  }
  if (runtimeCriticalCount > 0) {
    pushUniqueMessage(
      warnings,
      'local-deterministic-executor.cjs todavia concentra ramas runtime-critical por rubro y necesita una migracion gradual a capacidades.',
    )
  }
  if (
    !normalizedDetectedSignals.includes('interactionmode') ||
    !normalizedDetectedSignals.includes('runtimemode')
  ) {
    pushUniqueMessage(
      warnings,
      'La auditoria no encontro todas las senales esperadas de interactionMode/runtimeMode; conviene revisar el executor manualmente antes de migrarlo.',
    )
  }

  return {
    present: true,
    evaluated: true,
    behaviorChanged: false,
    executorFilePresent: auditSurface.executorFilePresent === true,
    executorFilePath: auditSurface.executorFilePath,
    legacyBranchesDetected: areas.filter((entry) => entry.detected).length,
    runtimeCriticalCount,
    domainSpecificSignals,
    capabilityMigrationCandidates,
    riskyAreas,
    recommendedNextActions: [
      'Mantener interactionMode y runtimeMode actuales como fallback observable mientras se introducen capacidades estructurales paralelas.',
      'Separar primero catalog/admin-panel/forms/reporting/mock-payments como capacidades observacionales antes de tocar los branches de ejecucion.',
      'Dejar generic como fallback final hasta que los casos inventados y los smokes domain-agnostic cubran la migracion.',
    ],
    areas,
    warnings,
    errors,
    warningsCount: warnings.length,
    errorsCount: errors.length,
  }
}

function buildLocalDeterministicExecutorCapabilityMigrationPlan({
  localDeterministicExecutorLegacyDebtReport,
}) {
  const warnings = []
  const errors = []
  const debtReport =
    localDeterministicExecutorLegacyDebtReport &&
    typeof localDeterministicExecutorLegacyDebtReport === 'object'
      ? localDeterministicExecutorLegacyDebtReport
      : null

  const capabilityTargets = [
    {
      capability: 'catalog',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'branch-mapped',
      blockers: ['checkout mock y copy comercial siguen mezclados con labels ecommerce.'],
    },
    {
      capability: 'admin-panel',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'branch-mapped',
      blockers: ['todavia depende de templates y labels legacy.'],
    },
    {
      capability: 'public-surface',
      currentBranches: ['generic-fallback-mode', 'string-domain-logs-and-builders'],
      migrationReadiness: 'branch-mapped',
      blockers: ['faltan invariantes estructurales para diferenciar presentacion publica vs admin.'],
    },
    {
      capability: 'forms',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'branch-mapped',
      blockers: ['las variaciones siguen embebidas en templates por modo.'],
    },
    {
      capability: 'scheduling',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['no hay una abstraccion clara de scheduling dentro del executor actual.'],
    },
    {
      capability: 'inventory',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      blockers: ['stock e inventario aparecen, pero no como capability transversal.'],
    },
    {
      capability: 'reporting',
      currentBranches: ['school-crm-entry-templates', 'string-domain-logs-and-builders'],
      migrationReadiness: 'partial',
      blockers: ['faltan contratos estructurales de reporting compartidos.'],
    },
    {
      capability: 'documents',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['no hay superficie de documentos suficientemente clara en el executor actual.'],
    },
    {
      capability: 'tracking',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['tracking todavia vive mas en planner/main que en el executor.'],
    },
    {
      capability: 'mock-payments',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      blockers: ['hay mock payments, pero siguen mezclados con la rama ecommerce.'],
    },
    {
      capability: 'messaging',
      currentBranches: ['school-crm-entry-templates'],
      migrationReadiness: 'partial',
      blockers: ['mensajeria y comunicaciones no estan aisladas como capability generica.'],
    },
    {
      capability: 'auth-mock',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['auth mock no debe habilitarse desde este executor sin una fase separada.'],
    },
    {
      capability: 'database-local',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['database local real queda fuera del alcance seguro del executor actual.'],
    },
    {
      capability: 'backend-api',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['backend API real no debe moverse desde este pase observacional.'],
    },
  ]

  const branchMappedCount = capabilityTargets.filter(
    (entry) =>
      entry.migrationReadiness === 'branch-mapped' || entry.migrationReadiness === 'partial',
  ).length
  const notReadyCount = capabilityTargets.filter(
    (entry) => entry.migrationReadiness === 'not-ready',
  ).length

  if (debtReport?.executorFilePresent !== true) {
    pushUniqueMessage(
      errors,
      'No hay un executor legible para construir un plan de migracion creible.',
    )
  }
  if ((debtReport?.runtimeCriticalCount || 0) > 0) {
    pushUniqueMessage(
      warnings,
      'El plan de migracion del executor sigue siendo solo observacional porque interactionMode/runtimeMode aun son runtime-critical.',
    )
  }

  return {
    present: true,
    evaluated: true,
    behaviorChanged: false,
    branchMappedCount,
    notReadyCount,
    capabilityTargets,
    recommendedNextActions: [
      'Empezar por catalog/admin-panel/public-surface/forms/reporting como capas observacionales paralelas al executor legacy.',
      'No tocar interactionMode ni runtimeMode hasta que los smokes domain-agnostic cubran generic, ecommerce y school-crm sin ramas nuevas.',
      'Mantener backend-api y database-local fuera del executor hasta una fase aprobada de runtime real.',
    ],
    warnings,
    errors,
    warningsCount: warnings.length,
    errorsCount: errors.length,
  }
}

module.exports = {
  deriveGeneratedDomainStructuralCapabilities,
  buildLegacyDomainHardcodingDebtReport,
  buildLocalDeterministicExecutorLegacyDebtReport,
  buildLocalDeterministicExecutorCapabilityMigrationPlan,
}
