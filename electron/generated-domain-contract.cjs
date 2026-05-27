const path = require('node:path')

const DEFAULT_CONTRACT_VERSION = '1.0'
const DEFAULT_DELIVERY_LEVEL = 'fullstack-local'
const DEFAULT_FORBIDDEN_FILES = ['.env', 'Dockerfile', 'docker-compose.yml']
const DEFAULT_FORBIDDEN_SEARCH_PATTERNS = [
  'ACCESS_TOKEN',
  'MERCADOPAGO_ACCESS_TOKEN',
  'client_secret',
  'https://api.mercadopago',
  'api.mercadopago.com',
]
const GENERATED_DOMAIN_CONTRACT_CANDIDATE_FIELDS = [
  'generatedDomainContract',
  'generatedDomainContractV1',
  'domainContract',
  'contract',
]
const FULLSTACK_LOCAL_DELIVERY_LEVEL_ALIASES = new Set([
  'fullstack-local',
  'fullstack-local-large',
  'fullstack-local-platform',
  'local-fullstack',
  'local-fullstack-delivery',
  'safe-fullstack-local',
  'scalable-fullstack-local',
])
const FULLSTACK_LOCAL_DELIVERY_LEVEL_SIGNAL_GATED_ALIASES = new Set([
  'scalable-delivery-plan',
  'planner-only-scalable-delivery',
])
const GENERATED_DOMAIN_COMPARISON_GENERIC_TOKENS = new Set([
  'app',
  'flow',
  'fullstack',
  'generated',
  'gestion',
  'local',
  'mock',
  'panel',
  'plan',
  'project',
  'review',
  'safe',
  'scalable',
  'secure',
  'system',
])
const RESERVED_ROOT_SEGMENTS = new Set([
  '',
  '.',
  '..',
  'c:',
  'windows',
  'users',
  'program files',
  'program files (x86)',
  '/',
  'usr',
  'etc',
])

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asNonEmptyString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function canonicalizePathString(value) {
  const raw = asNonEmptyString(value)
  if (!raw) {
    return ''
  }

  const withForwardSlashes = raw.replace(/\\/g, '/')
  if (/^[a-zA-Z]:/.test(withForwardSlashes)) {
    const drivePrefix = withForwardSlashes.slice(0, 2)
    const remainder = withForwardSlashes.slice(2).replace(/^\/+/, '').replace(/\/+/g, '/')
    return remainder ? `${drivePrefix}/${remainder}` : `${drivePrefix}/`
  }

  const hasLeadingSlash = withForwardSlashes.startsWith('/')
  const normalizedBody = withForwardSlashes.replace(/^\/+/, '').replace(/\/+/g, '/')
  return hasLeadingSlash ? `/${normalizedBody}` : normalizedBody
}

function slugify(value, fallback = 'generated-domain') {
  const normalized = asNonEmptyString(value, fallback)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
  return normalized || fallback
}

function stripLeadingCurrentDirectoryPrefix(value) {
  let normalized = asNonEmptyString(value)
  while (normalized === '.' || normalized.startsWith('./')) {
    normalized = normalized === '.' ? '' : normalized.slice(2)
  }
  return normalized
}

function normalizeRelativePath(value) {
  const normalized = canonicalizePathString(value).replace(/^\/+/, '')
  return stripLeadingCurrentDirectoryPrefix(normalized)
}

function isAbsoluteLikePath(value) {
  const normalized = canonicalizePathString(value)
  return /^[a-zA-Z]:\//.test(normalized) || normalized.startsWith('/') || normalized.startsWith('\\\\')
}

function getAbsolutePathSegments(value) {
  const normalized = canonicalizePathString(value)
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return normalized
      .slice(3)
      .split('/')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return normalized
    .replace(/^\/+/, '')
    .split('/')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function isDangerousAbsoluteRootPath(value) {
  const normalized = canonicalizePathString(value)
  const segments = getAbsolutePathSegments(normalized).map((entry) => entry.toLowerCase())

  if (!isAbsoluteLikePath(normalized) || segments.length === 0) {
    return true
  }

  const firstSegment = segments[0]
  if (firstSegment === 'windows' || firstSegment === 'usr' || firstSegment === 'etc') {
    return true
  }

  if (firstSegment === 'users' && segments.length === 1) {
    return true
  }

  if (firstSegment === 'program files' || firstSegment === 'program files (x86)') {
    return true
  }

  return false
}

function buildAbsoluteRootCandidates(values) {
  return unique(
    values
      .map((entry) => canonicalizePathString(entry))
      .filter((entry) => isAbsoluteLikePath(entry) && !isDangerousAbsoluteRootPath(entry)),
  )
}

function normalizeContractScopedPath(value, absoluteRootCandidates = []) {
  const normalized = canonicalizePathString(value)
  if (!normalized) {
    return ''
  }

  const normalizedLower = normalized.toLowerCase()
  for (const candidate of absoluteRootCandidates) {
    const candidateNormalized = canonicalizePathString(candidate)
    const candidateLower = candidateNormalized.toLowerCase()
    if (normalizedLower === candidateLower) {
      return ''
    }
    if (normalizedLower.startsWith(`${candidateLower}/`)) {
      return normalizeRelativePath(normalized.slice(candidateNormalized.length + 1))
    }
  }

  return normalizeRelativePath(normalized)
}

function normalizeContractRootPath(value, rootSlug, absoluteRootCandidates = []) {
  const normalized = canonicalizePathString(value)
  if (!normalized) {
    return rootSlug
  }

  if (!isAbsoluteLikePath(normalized)) {
    return normalizeRelativePath(normalized) || rootSlug
  }

  if (!isDangerousAbsoluteRootPath(normalized) && absoluteRootCandidates.includes(normalized)) {
    return rootSlug
  }

  return normalized
}

function collectPathList(entries, projector) {
  return asArray(entries)
    .map((entry) => projector(entry))
    .map((entry) => normalizeRelativePath(entry))
    .filter(Boolean)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function looksLikeGeneratedDomainContractCandidate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return [
    'contractVersion',
    'deliveryLevel',
    'domain',
    'root',
    'frontendSurfaces',
    'backend',
    'database',
    'materialization',
    'validation',
    'approvals',
  ].some((field) => Object.prototype.hasOwnProperty.call(value, field))
}

function extractGeneratedDomainContractCandidate(decision) {
  const source = asObject(decision)

  for (const fieldName of GENERATED_DOMAIN_CONTRACT_CANDIDATE_FIELDS) {
    const candidateValue = source[fieldName]
    if (looksLikeGeneratedDomainContractCandidate(candidateValue)) {
      return {
        fieldName,
        contract: candidateValue,
      }
    }
  }

  return {
    fieldName: '',
    contract: null,
  }
}

function normalizeRouteEntry(entry) {
  if (typeof entry === 'string') {
    return { path: normalizeRelativePath(entry) }
  }
  const value = asObject(entry)
  return {
    path: normalizeRelativePath(value.path || value.file || ''),
    label: asNonEmptyString(value.label),
    purpose: asNonEmptyString(value.purpose),
  }
}

function normalizeGeneratedDomainDeliveryLevelToken(value, fallback = '') {
  const normalized = asNonEmptyString(value, fallback)
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
  return normalized || fallback
}

function hasGeneratedDomainFullstackLocalSignals(contract) {
  const normalizedContract = asObject(contract)
  const backend = asObject(normalizedContract.backend)
  const database = asObject(normalizedContract.database)
  const safety = asObject(normalizedContract.safety)
  const materialization = asObject(normalizedContract.materialization)
  const validation = asObject(normalizedContract.validation)
  const root = asObject(normalizedContract.root)
  const approvals = asArray(normalizedContract.approvals).map((entry) => asObject(entry))
  const integrations = asArray(normalizedContract.integrations).map((entry) => asObject(entry))
  const forbiddenFiles = asArray(safety.forbiddenFiles).map((entry) =>
    normalizeRelativePath(entry).toLowerCase(),
  )
  const explicitExclusions = asArray(safety.explicitExclusions).map((entry) =>
    asNonEmptyString(entry).trim().toLowerCase(),
  )
  const forbiddenSignals = asArray(safety.forbiddenSignals).map((entry) =>
    asNonEmptyString(entry).trim().toLowerCase(),
  )
  const approvalForbids = approvals.flatMap((entry) =>
    asArray(entry.forbidsNow).map((item) => asNonEmptyString(item).trim().toLowerCase()),
  )
  const safetyBlockers = unique([...explicitExclusions, ...forbiddenSignals, ...approvalForbids])

  const hasFrontendSurfaceSignal = asArray(normalizedContract.frontendSurfaces).length > 0
  const hasBackendSignal =
    asArray(backend.routes).length > 0 ||
    asArray(backend.services).length > 0 ||
    asArray(backend.modules).length > 0
  const hasDatabaseSignal = asArray(database.tables).length > 0
  const hasMaterializationSignal =
    asArray(materialization.requiredFiles).length > 0 ||
    asArray(materialization.operations).length > 0
  const hasRequiredPathGroupsSignal = asArray(validation.requiredPathGroups).length > 0
  const hasCoherentRootSignal =
    asNonEmptyString(root.sourceRoot) &&
    asNonEmptyString(root.targetRoot) &&
    normalizeRelativePath(root.sourceRoot) === normalizeRelativePath(root.targetRoot)
  const hasLocalSafetySignal =
    integrations.every(
      (entry) =>
        asNonEmptyString(entry.mode, 'mock-only').toLowerCase() === 'mock-only' &&
        entry.realIntegrationAllowedNow !== true,
    ) &&
    (forbiddenFiles.includes('.env') || approvalForbids.includes('.env')) &&
    safetyBlockers.some((entry) =>
      [
        'deploy',
        'production',
        'real-payments',
        'external-service',
        'external-services',
        'real-webhooks',
      ].includes(
        entry,
      ),
    )

  return (
    hasFrontendSurfaceSignal &&
    hasBackendSignal &&
    hasDatabaseSignal &&
    hasMaterializationSignal &&
    hasRequiredPathGroupsSignal &&
    hasCoherentRootSignal &&
    hasLocalSafetySignal
  )
}

function resolveGeneratedDomainDeliveryLevelNormalization(value, contract) {
  const normalizedValue = normalizeGeneratedDomainDeliveryLevelToken(value, DEFAULT_DELIVERY_LEVEL)
  const warnings = []

  if (!normalizedValue || FULLSTACK_LOCAL_DELIVERY_LEVEL_ALIASES.has(normalizedValue)) {
    return {
      deliveryLevel: DEFAULT_DELIVERY_LEVEL,
      warnings,
    }
  }

  if (
    FULLSTACK_LOCAL_DELIVERY_LEVEL_SIGNAL_GATED_ALIASES.has(normalizedValue) &&
    hasGeneratedDomainFullstackLocalSignals(contract)
  ) {
    if (normalizedValue === 'planner-only-scalable-delivery') {
      warnings.push(
        'deliveryLevel planner-only-scalable-delivery normalizado a fullstack-local por señales fullstack-local suficientes.',
      )
    }

    return {
      deliveryLevel: DEFAULT_DELIVERY_LEVEL,
      warnings,
    }
  }

  return {
    deliveryLevel: normalizedValue,
    warnings,
  }
}

function normalizeGeneratedDomainDeliveryLevel(value, contract) {
  return resolveGeneratedDomainDeliveryLevelNormalization(value, contract).deliveryLevel
}

function normalizeGeneratedDomainContract(input) {
  const source = asObject(input)
  const domain = asObject(source.domain)
  const root = asObject(source.root)
  const backend = asObject(source.backend)
  const database = asObject(source.database)
  const shared = asObject(source.shared)
  const safety = asObject(source.safety)
  const materialization = asObject(source.materialization)
  const validation = asObject(source.validation)

  const domainLabel = asNonEmptyString(domain.label, 'Generated domain')
  const domainSlug = slugify(domain.slug || domainLabel, 'generated-domain')
  const rawSourceRoot = canonicalizePathString(root.sourceRoot || '')
  const rawTargetRoot = canonicalizePathString(root.targetRoot || '')
  const rawRootFallback =
    rawTargetRoot || rawSourceRoot || canonicalizePathString(root.slug || `${domainSlug}-local`)
  const rawRootBasename = getAbsolutePathSegments(rawRootFallback).slice(-1)[0] || ''
  const rootSlug = slugify(
    root.slug || rawRootBasename || `${domainSlug}-local`,
    `${domainSlug}-local`,
  )
  const absoluteRootCandidates = buildAbsoluteRootCandidates([rawSourceRoot, rawTargetRoot])
  const sourceRoot = normalizeContractRootPath(rawSourceRoot || rootSlug, rootSlug, absoluteRootCandidates)
  const targetRoot = normalizeContractRootPath(rawTargetRoot || rootSlug, rootSlug, absoluteRootCandidates)

  const normalized = {
    contractVersion: asNonEmptyString(source.contractVersion, DEFAULT_CONTRACT_VERSION),
    deliveryLevel: normalizeGeneratedDomainDeliveryLevelToken(
      source.deliveryLevel,
      DEFAULT_DELIVERY_LEVEL,
    ),
    domain: {
      label: domainLabel,
      slug: domainSlug,
      summary: asNonEmptyString(domain.summary),
    },
    root: {
      slug: rootSlug,
      sourceRoot,
      targetRoot,
    },
    roles: asArray(source.roles),
    entities: asArray(source.entities),
    states: asObject(source.states),
    workflows: asArray(source.workflows),
    frontendSurfaces: asArray(source.frontendSurfaces).map((entry) => {
      const value = asObject(entry)
      const key = slugify(value.key || value.label || 'surface', 'surface')
      const surfacePath = normalizeRelativePath(value.path || `frontend/${key}`)
      return {
        key,
        label: asNonEmptyString(value.label, key),
        path: normalizeContractScopedPath(surfacePath, absoluteRootCandidates) || `frontend/${key}`,
        screens: asArray(value.screens),
      }
    }),
    backend: {
      packageFile: normalizeContractScopedPath(
        backend.packageFile || backend.packageJson || 'backend/package.json',
        absoluteRootCandidates,
      ),
      entryFile: normalizeContractScopedPath(
        backend.entryFile || 'backend/src/server.js',
        absoluteRootCandidates,
      ),
      routes: asArray(backend.routes).map((entry) => {
        const route = normalizeRouteEntry(entry)
        return {
          ...route,
          path: normalizeContractScopedPath(route.path, absoluteRootCandidates),
        }
      }),
      services: asArray(backend.services).map((entry) => {
        const service = normalizeRouteEntry(entry)
        return {
          ...service,
          path: normalizeContractScopedPath(service.path, absoluteRootCandidates),
        }
      }),
      modules: asArray(backend.modules).map((entry) => {
        const moduleEntry = normalizeRouteEntry(entry)
        return {
          ...moduleEntry,
          path: normalizeContractScopedPath(moduleEntry.path, absoluteRootCandidates),
        }
      }),
    },
    database: {
      schemaFile: normalizeContractScopedPath(
        database.schemaFile || 'database/schema.sql',
        absoluteRootCandidates,
      ),
      seedFile: normalizeContractScopedPath(
        database.seedFile || 'database/seed.sql',
        absoluteRootCandidates,
      ),
      tables: asArray(database.tables),
      relationships: asArray(database.relationships),
      seedData: asArray(database.seedData),
    },
    shared: {
      files: collectPathList(shared.files, (entry) =>
        typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
      ).map((entry) => normalizeContractScopedPath(entry, absoluteRootCandidates)),
    },
    docs: collectPathList(source.docs, (entry) =>
      typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
    ).map((entry) => normalizeContractScopedPath(entry, absoluteRootCandidates)),
    scripts: collectPathList(source.scripts, (entry) =>
      typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
    ).map((entry) => normalizeContractScopedPath(entry, absoluteRootCandidates)),
    integrations: asArray(source.integrations).map((entry) => {
      const value = asObject(entry)
      return {
        name: asNonEmptyString(value.name, 'integration'),
        mode: asNonEmptyString(value.mode, 'mock-only'),
        realIntegrationAllowedNow: Boolean(value.realIntegrationAllowedNow),
        notes: asNonEmptyString(value.notes),
      }
    }),
    safety: {
      forbiddenFiles: unique(
        collectPathList(
          safety.forbiddenFiles?.length ? safety.forbiddenFiles : DEFAULT_FORBIDDEN_FILES,
          (entry) => entry,
        ),
      ),
      forbiddenSignals: unique(asArray(safety.forbiddenSignals).map((entry) => asNonEmptyString(entry))),
      explicitExclusions: unique(
        asArray(safety.explicitExclusions).map((entry) => asNonEmptyString(entry)),
      ),
    },
    materialization: {
      requiredFiles: unique(
        collectPathList(materialization.requiredFiles, (entry) =>
          typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
        ).map((entry) => normalizeContractScopedPath(entry, absoluteRootCandidates)),
      ),
      operations: asArray(materialization.operations).map((entry) => {
        const value = asObject(entry)
        return {
          type: asNonEmptyString(value.type, 'replace-file'),
          targetPath: normalizeContractScopedPath(value.targetPath || '', absoluteRootCandidates),
          nextContent: typeof value.nextContent === 'string' ? value.nextContent : '',
        }
      }),
      allowedTargetPaths: unique(
        collectPathList(materialization.allowedTargetPaths, (entry) => entry).map((entry) =>
          normalizeContractScopedPath(entry, absoluteRootCandidates),
        ),
      ),
    },
    validation: {
      syntaxChecks: unique(asArray(validation.syntaxChecks).map((entry) => asNonEmptyString(entry))),
      requiredPathGroups: asArray(validation.requiredPathGroups)
        .map((group) =>
          unique(
            asArray(group)
              .map((entry) => normalizeContractScopedPath(entry, absoluteRootCandidates))
              .filter(Boolean),
          ),
        )
        .filter((group) => group.length > 0),
      forbiddenSearchPatterns: unique(
        asArray(validation.forbiddenSearchPatterns).length > 0
          ? asArray(validation.forbiddenSearchPatterns).map((entry) => asNonEmptyString(entry))
          : DEFAULT_FORBIDDEN_SEARCH_PATTERNS,
      ),
    },
    approvals: asArray(source.approvals).map((entry) => {
      const value = asObject(entry)
      return {
        key: asNonEmptyString(value.key, 'approval'),
        scope: asNonEmptyString(value.scope),
        status: asNonEmptyString(value.status, 'pending'),
        allowsNow: unique(asArray(value.allowsNow).map((item) => asNonEmptyString(item))),
        forbidsNow: unique(asArray(value.forbidsNow).map((item) => asNonEmptyString(item))),
      }
    }),
    normalizationWarnings: [],
  }

  if (normalized.materialization.requiredFiles.length === 0) {
    normalized.materialization.requiredFiles = deriveContractFilePaths(normalized)
  }

  if (normalized.validation.requiredPathGroups.length === 0) {
    normalized.validation.requiredPathGroups = deriveRequiredPathGroupsFromContract(normalized)
  }

  if (normalized.materialization.allowedTargetPaths.length === 0) {
    normalized.materialization.allowedTargetPaths = unique([
      normalized.root.targetRoot,
      ...normalized.materialization.requiredFiles.map((entry) =>
        normalizeRelativePath(
          path.posix.join(normalized.root.targetRoot, trimRootPrefix(normalized, entry)),
        ),
      ),
    ])
  }

  const deliveryLevelResolution = resolveGeneratedDomainDeliveryLevelNormalization(
    source.deliveryLevel,
    normalized,
  )
  normalized.deliveryLevel = deliveryLevelResolution.deliveryLevel
  normalized.normalizationWarnings = unique(deliveryLevelResolution.warnings)

  return normalized
}

function deriveContractFilePaths(contract) {
  const normalized = contract && contract.contractVersion ? contract : normalizeGeneratedDomainContract(contract)
  const frontendFiles = normalized.frontendSurfaces.flatMap((surface) => [
    `${surface.path}/index.html`,
    `${surface.path}/app.js`,
  ])
  const backendFiles = [
    normalized.backend.packageFile,
    normalized.backend.entryFile,
    ...normalized.backend.routes.map((entry) => entry.path),
    ...normalized.backend.services.map((entry) => entry.path),
    ...normalized.backend.modules.map((entry) => entry.path),
  ]
  const databaseFiles = [normalized.database.schemaFile, normalized.database.seedFile]
  return unique([
    ...normalized.materialization.requiredFiles,
    ...frontendFiles,
    ...backendFiles,
    ...databaseFiles,
    ...normalized.shared.files,
    ...normalized.docs,
    ...normalized.scripts,
  ].map((entry) => normalizeRelativePath(entry)))
}

function trimRootPrefix(contract, relativePath) {
  const normalizedPath = normalizeRelativePath(relativePath)
  const targetRoot = normalizeRelativePath(contract.root.targetRoot)
  if (!normalizedPath || !targetRoot) {
    return normalizedPath
  }
  const prefix = `${targetRoot}/`
  return normalizedPath.startsWith(prefix) ? normalizedPath.slice(prefix.length) : normalizedPath
}

function deriveRequiredPathGroupsFromContract(contract) {
  const normalized = contract && contract.contractVersion ? contract : normalizeGeneratedDomainContract(contract)
  return deriveContractFilePaths(normalized).map((entry) => [entry])
}

function deriveAllowedTargetPathsFromContract(contract, workspacePath) {
  const normalized = contract && contract.contractVersion ? contract : normalizeGeneratedDomainContract(contract)
  const workspaceRoot = path.resolve(asNonEmptyString(workspacePath, '.'))
  const projectRoot = path.resolve(workspaceRoot, normalized.root.targetRoot)
  const requiredFiles = deriveContractFilePaths(normalized)
  const operationTargets = normalized.materialization.operations
    .map((entry) => entry.targetPath)
    .filter(Boolean)
  return unique([
    projectRoot,
    ...requiredFiles.map((entry) =>
      path.resolve(projectRoot, trimRootPrefix(normalized, entry)),
    ),
    ...operationTargets.map((entry) =>
      path.resolve(projectRoot, trimRootPrefix(normalized, entry)),
    ),
  ])
}

function deriveForbiddenSearchPatternsFromContract(contract) {
  const normalized = contract && contract.contractVersion ? contract : normalizeGeneratedDomainContract(contract)
  return unique([
    ...normalized.validation.forbiddenSearchPatterns,
    ...normalized.safety.forbiddenSignals,
  ]).filter(Boolean)
}

function validateGeneratedDomainContract(contract) {
  const normalized = contract && contract.contractVersion ? contract : normalizeGeneratedDomainContract(contract)
  const errors = []
  const warnings = unique(asArray(normalized.normalizationWarnings).map((entry) => asNonEmptyString(entry)))

  if (!normalized.contractVersion) {
    errors.push('contractVersion es requerido.')
  }
  if (normalized.deliveryLevel !== DEFAULT_DELIVERY_LEVEL) {
    errors.push(
      `deliveryLevel incompatible. Recibido: ${normalized.deliveryLevel || '(vacio)'}. Esperado: ${DEFAULT_DELIVERY_LEVEL} o un alias compatible de fullstack local.`,
    )
  }
  if (!normalized.domain.label || !normalized.domain.slug) {
    errors.push('domain.label y domain.slug son requeridos.')
  }
  if (!normalized.root.slug || !normalized.root.sourceRoot || !normalized.root.targetRoot) {
    errors.push('root.slug, root.sourceRoot y root.targetRoot son requeridos.')
  }
  if (normalized.root.sourceRoot !== normalized.root.targetRoot) {
    errors.push('root.sourceRoot debe coincidir con root.targetRoot para materializar.')
  }

  const rootBasename = normalizeRelativePath(normalized.root.targetRoot).split('/')[0].toLowerCase()
  if (RESERVED_ROOT_SEGMENTS.has(rootBasename)) {
    errors.push(`root.targetRoot usa un segmento reservado o peligroso: ${normalized.root.targetRoot}.`)
  }
  if (
    isAbsoluteLikePath(normalized.root.targetRoot) ||
    normalized.root.targetRoot.includes('..') ||
    normalized.root.sourceRoot.includes('..')
  ) {
    errors.push('El root no puede ser absoluto ni escapar el workspace.')
  }

  if (normalized.frontendSurfaces.length === 0) {
    warnings.push('frontendSurfaces esta vacio.')
  }

  const allPaths = deriveContractFilePaths(normalized)
  const forbiddenFileMatches = allPaths.filter((entry) => {
    const basename = path.posix.basename(entry).toLowerCase()
    return normalized.safety.forbiddenFiles.some(
      (forbidden) => basename === normalizeRelativePath(forbidden).toLowerCase(),
    )
  })
  if (forbiddenFileMatches.length > 0) {
    errors.push(`El contrato incluye archivos prohibidos: ${forbiddenFileMatches.join(', ')}.`)
  }

  normalized.materialization.operations.forEach((operation) => {
    const targetPath = normalizeRelativePath(operation.targetPath)
    if (!targetPath) {
      errors.push('Toda operacion debe tener targetPath.')
      return
    }
    if (targetPath.includes('..') || isAbsoluteLikePath(targetPath)) {
      errors.push(`Operacion fuera de scope o absoluta: ${targetPath}.`)
    }
  })

  normalized.integrations.forEach((integration) => {
    if (integration.mode === 'mock-only' && integration.realIntegrationAllowedNow) {
      errors.push(
        `La integracion ${integration.name} no puede declarar mock-only y permitir integracion real al mismo tiempo.`,
      )
    }
  })

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalizedContract: normalized,
  }
}

function isContractSafeForLocalMaterialization(contract) {
  const validation = validateGeneratedDomainContract(contract)
  const errors = [...validation.errors]
  const normalized = validation.normalizedContract
  const derivedAllowedTargetPaths = deriveAllowedTargetPathsFromContract(normalized, '.')
  const derivedForbiddenSearchPatterns = deriveForbiddenSearchPatternsFromContract(normalized)

  normalized.materialization.operations.forEach((operation) => {
    const targetPath = normalizeRelativePath(operation.targetPath)
    const content = typeof operation.nextContent === 'string' ? operation.nextContent : ''

    if (targetPath.endsWith('.env') || path.posix.basename(targetPath).toLowerCase() === 'dockerfile') {
      errors.push(`Operacion insegura sobre archivo prohibido: ${targetPath}.`)
    }

    if (
      content.includes('https://api.mercadopago.com') ||
      content.includes('api.mercadopago.com') ||
      content.includes('ACCESS_TOKEN') ||
      content.includes('MERCADOPAGO_ACCESS_TOKEN') ||
      content.includes('client_secret')
    ) {
      errors.push(`Operacion con integracion real o secreto detectado en ${targetPath}.`)
    }

    const resolvedPath = path.resolve('.', normalized.root.targetRoot, trimRootPrefix(normalized, targetPath))
    const withinScope = derivedAllowedTargetPaths.includes(resolvedPath)
    if (!withinScope) {
      errors.push(`Operacion fuera de allowedTargetPaths derivado: ${targetPath}.`)
    }
  })

  normalized.integrations.forEach((integration) => {
    if (integration.realIntegrationAllowedNow) {
      errors.push(`La integracion ${integration.name} habilita integracion real en una entrega local.`)
    }
  })

  return {
    ok: errors.length === 0,
    errors: unique(errors),
    forbiddenSearchPatterns: derivedForbiddenSearchPatterns,
    allowedTargetPaths: derivedAllowedTargetPaths,
    normalizedContract: normalized,
  }
}

function buildGeneratedDomainContractDiagnostics(decision, workspacePath) {
  const { fieldName, contract } = extractGeneratedDomainContractCandidate(decision)

  if (!contract) {
    return {
      present: false,
    }
  }

  try {
    const normalizedContract = normalizeGeneratedDomainContract(contract)
    const validation = validateGeneratedDomainContract(normalizedContract)
    const safety = isContractSafeForLocalMaterialization(normalizedContract)
    const allowedTargetPaths = deriveAllowedTargetPathsFromContract(
      normalizedContract,
      workspacePath,
    )
    const requiredPathGroups = deriveRequiredPathGroupsFromContract(normalizedContract)
    const forbiddenSearchPatterns =
      deriveForbiddenSearchPatternsFromContract(normalizedContract)

    return {
      present: true,
      sourceField: fieldName,
      normalized: true,
      valid: validation.ok === true,
      safeForLocalMaterialization: safety.ok === true,
      errors: unique([...(validation.errors || []), ...(safety.errors || [])]),
      warnings: unique(validation.warnings || []),
      domainSlug: normalizedContract.domain.slug,
      rootSlug: normalizedContract.root.slug,
      sourceRoot: normalizedContract.root.sourceRoot,
      targetRoot: normalizedContract.root.targetRoot,
      frontendSurfacesCount: normalizedContract.frontendSurfaces.length,
      backendRoutesCount: normalizedContract.backend.routes.length,
      databaseTablesCount: normalizedContract.database.tables.length,
      operationsCount: normalizedContract.materialization.operations.length,
      allowedTargetPathsCount: allowedTargetPaths.length,
      requiredPathGroupsCount: requiredPathGroups.length,
      forbiddenSearchPatternsCount: forbiddenSearchPatterns.length,
      allowedTargetPaths,
      requiredPathGroups,
      forbiddenSearchPatterns,
      normalizedContract,
    }
  } catch (error) {
    return {
      present: true,
      sourceField: fieldName,
      normalized: false,
      valid: false,
      safeForLocalMaterialization: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
      frontendSurfacesCount: 0,
      backendRoutesCount: 0,
      databaseTablesCount: 0,
      operationsCount: 0,
      allowedTargetPathsCount: 0,
      requiredPathGroupsCount: 0,
      forbiddenSearchPatternsCount: 0,
      allowedTargetPaths: [],
      requiredPathGroups: [],
      forbiddenSearchPatterns: [],
      normalizedContract: null,
    }
  }
}

function pushUniqueMessage(target, message) {
  const normalized = typeof message === 'string' ? message.trim().replace(/\s+/g, ' ') : ''
  if (!normalized || target.includes(normalized)) {
    return
  }

  target.push(normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`)
}

function tokenizeComparisonText(value) {
  return unique(
    asNonEmptyString(value)
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/[\s-]+/u)
      .map((entry) => entry.trim())
      .filter(
        (entry) =>
          entry &&
          entry.length >= 3 &&
          !GENERATED_DOMAIN_COMPARISON_GENERIC_TOKENS.has(entry),
      ),
  )
}

function collectLegacyTaskTextEntries(tasks) {
  return asArray(tasks).flatMap((entry) => {
    if (typeof entry === 'string') {
      return [entry]
    }

    const value = asObject(entry)
    return [
      value.title,
      value.label,
      value.summary,
      value.description,
      value.name,
      value.feature,
      value.module,
    ]
  })
}

function collectLegacyPlanSignalTexts(decision) {
  const source = asObject(decision)
  const scalablePlan = asObject(source.scalableDeliveryPlan)
  const nextActionPlan = asObject(source.nextActionPlan)
  const projectBlueprint = asObject(source.projectBlueprint)
  const executionScope = asObject(source.executionScope)
  const materializationPlan = asObject(source.materializationPlan)
  const domainUnderstanding = asObject(source.domainUnderstanding)

  return unique(
    [
      source.decisionKey,
      source.strategy,
      source.executionMode,
      source.nextExpectedAction,
      source.businessSector,
      source.businessSectorLabel,
      source.reason,
      source.question,
      source.instruction,
      source.selectedDomain,
      source.detectedVertical,
      scalablePlan.title,
      scalablePlan.summary,
      scalablePlan.reason,
      scalablePlan.deliveryLevel,
      scalablePlan.projectRoot,
      scalablePlan.rootSlug,
      scalablePlan.targetRoot,
      nextActionPlan.title,
      nextActionPlan.summary,
      nextActionPlan.reason,
      nextActionPlan.targetStrategy,
      nextActionPlan.targetDeliveryLevel,
      nextActionPlan.projectRoot,
      projectBlueprint.title,
      projectBlueprint.summary,
      projectBlueprint.deliveryLevel,
      projectBlueprint.projectRoot,
      domainUnderstanding.summary,
      domainUnderstanding.problem,
      domainUnderstanding.solution,
      executionScope.objectiveScope,
      executionScope.projectRoot,
      materializationPlan.summary,
      materializationPlan.kind,
      materializationPlan.strategy,
      ...collectLegacyTaskTextEntries(source.tasks),
      ...asArray(scalablePlan.directories),
      ...asArray(scalablePlan.targetStructure),
      ...asArray(scalablePlan.allowedRootPaths),
      ...asArray(scalablePlan.explicitExclusions),
      ...asArray(projectBlueprint.modules),
      ...asArray(projectBlueprint.features),
      ...asArray(projectBlueprint.entities),
    ]
      .map((entry) => asNonEmptyString(entry))
      .filter(Boolean),
  )
}

function collectLegacyAllowedTargetPathEntries(decision) {
  const source = asObject(decision)
  const scalablePlan = asObject(source.scalableDeliveryPlan)
  const executionScope = asObject(source.executionScope)
  const materializationPlan = asObject(source.materializationPlan)

  return unique([
    ...asArray(executionScope.allowedTargetPaths).map((entry) => asNonEmptyString(entry)),
    ...asArray(scalablePlan.allowedRootPaths).map((entry) => asNonEmptyString(entry)),
    ...asArray(scalablePlan.directories).map((entry) => asNonEmptyString(entry)),
    ...asArray(scalablePlan.filesToCreate).map((entry) =>
      asNonEmptyString(asObject(entry).path || entry),
    ),
    ...asArray(materializationPlan.allowedTargetPaths).map((entry) => asNonEmptyString(entry)),
    ...asArray(materializationPlan.operations).map((entry) =>
      asNonEmptyString(asObject(entry).targetPath),
    ),
    ...asArray(materializationPlan.validations).map((entry) =>
      asNonEmptyString(asObject(entry).targetPath),
    ),
  ])
}

function extractLegacyRootCandidate(decision) {
  const source = asObject(decision)
  const scalablePlan = asObject(source.scalableDeliveryPlan)
  const nextActionPlan = asObject(source.nextActionPlan)
  const executionScope = asObject(source.executionScope)
  const materializationPlan = asObject(source.materializationPlan)
  const localProjectManifest = asObject(source.localProjectManifest)

  const rootCandidates = [
    source.targetRoot,
    source.sourceRoot,
    scalablePlan.projectRoot,
    scalablePlan.targetRoot,
    nextActionPlan.projectRoot,
    executionScope.projectRoot,
    materializationPlan.projectRoot,
    localProjectManifest.projectRoot,
  ]

  for (const entry of rootCandidates) {
    const normalized = canonicalizePathString(entry)
    if (!normalized || isAbsoluteLikePath(normalized) || normalized.includes('..')) {
      continue
    }

    const relative = normalizeRelativePath(normalized)
    if (relative) {
      return relative
    }
  }

  return ''
}

function detectLegacySignalPresence(textEntries, exactPhrases, tokenGroups) {
  const normalizedTextEntries = asArray(textEntries)
  const combinedText = normalizedTextEntries.join(' ').toLowerCase()
  const tokenSet = new Set(normalizedTextEntries.flatMap((entry) => tokenizeComparisonText(entry)))

  if (asArray(exactPhrases).some((phrase) => combinedText.includes(phrase.toLowerCase()))) {
    return true
  }

  return asArray(tokenGroups).some((group) =>
    asArray(group).every((token) => tokenSet.has(token.toLowerCase())),
  )
}

function buildGeneratedDomainContractComparison(decision, workspacePath) {
  const emptyComparison = {
    comparisonVersion: '0.1',
    present: false,
    compared: false,
    status: 'not-available',
    safeForDiagnostics: true,
    domain: {
      contractSlug: '',
      legacySector: '',
      aligned: false,
      notes: [],
    },
    roots: {
      contractRoot: '',
      legacyRoot: '',
      aligned: false,
      warnings: [],
    },
    surfaces: {
      contractCount: 0,
      legacySignalsCount: 0,
      missingInLegacy: [],
      aligned: false,
      notes: [],
    },
    backend: {
      contractPresent: false,
      legacySignalsPresent: false,
      aligned: false,
      notes: [],
    },
    database: {
      contractPresent: false,
      legacySignalsPresent: false,
      aligned: false,
      notes: [],
    },
    safety: {
      contractSafe: false,
      legacySafetySignalsPresent: false,
      aligned: false,
      warnings: [],
    },
    materialization: {
      contractAllowedTargetPathsCount: 0,
      legacyAllowedTargetPathsCount: 0,
      aligned: false,
      warnings: [],
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const { contract } = extractGeneratedDomainContractCandidate(decision)
  if (!contract) {
    return emptyComparison
  }

  try {
    const diagnostics = buildGeneratedDomainContractDiagnostics(decision, workspacePath)
    const normalizedContract =
      diagnostics.normalizedContract && typeof diagnostics.normalizedContract === 'object'
        ? diagnostics.normalizedContract
        : normalizeGeneratedDomainContract(contract)
    const comparison = {
      ...emptyComparison,
      present: true,
      compared: true,
      status: 'compared',
      domain: {
        contractSlug: normalizedContract.domain.slug || '',
        legacySector: asNonEmptyString(
          asObject(decision).businessSector || asObject(decision).businessSectorLabel,
        ),
        aligned: false,
        notes: [],
      },
      roots: {
        contractRoot: normalizeRelativePath(normalizedContract.root.targetRoot),
        legacyRoot: '',
        aligned: false,
        warnings: [],
      },
      surfaces: {
        contractCount: normalizedContract.frontendSurfaces.length,
        legacySignalsCount: 0,
        missingInLegacy: [],
        aligned: false,
        notes: [],
      },
      backend: {
        contractPresent:
          Boolean(normalizedContract.backend.entryFile) ||
          normalizedContract.backend.routes.length > 0 ||
          normalizedContract.backend.services.length > 0 ||
          normalizedContract.backend.modules.length > 0,
        legacySignalsPresent: false,
        aligned: false,
        notes: [],
      },
      database: {
        contractPresent:
          Boolean(normalizedContract.database.schemaFile) ||
          Boolean(normalizedContract.database.seedFile) ||
          normalizedContract.database.tables.length > 0,
        legacySignalsPresent: false,
        aligned: false,
        notes: [],
      },
      safety: {
        contractSafe: diagnostics.safeForLocalMaterialization === true,
        legacySafetySignalsPresent: false,
        aligned: false,
        warnings: [],
      },
      materialization: {
        contractAllowedTargetPathsCount: diagnostics.allowedTargetPathsCount || 0,
        legacyAllowedTargetPathsCount: 0,
        aligned: false,
        warnings: [],
      },
      warnings: [],
      errors: [],
      warningsCount: 0,
      errorsCount: 0,
    }

    if (diagnostics.valid !== true) {
      pushUniqueMessage(
        comparison.warnings,
        'El generatedDomainContract no es valido segun el validador local.',
      )
    }
    if (diagnostics.safeForLocalMaterialization !== true) {
      pushUniqueMessage(
        comparison.warnings,
        'El generatedDomainContract no esta marcado como seguro para materializacion local.',
      )
    }

    const legacyTextEntries = collectLegacyPlanSignalTexts(decision)
    const legacyTokenSet = new Set(
      legacyTextEntries.flatMap((entry) => tokenizeComparisonText(entry)),
    )
    const contractSlugTokens = tokenizeComparisonText(comparison.domain.contractSlug)
    const overlappingDomainTokens = contractSlugTokens.filter((token) =>
      legacyTokenSet.has(token),
    )
    comparison.domain.aligned =
      overlappingDomainTokens.length > 0 || Boolean(comparison.domain.legacySector)
    if (overlappingDomainTokens.length > 0) {
      comparison.domain.notes.push(
        `Coincidencias de dominio: ${overlappingDomainTokens.join(', ')}.`,
      )
    } else if (comparison.domain.legacySector) {
      comparison.domain.notes.push(
        'Sin coincidencia textual directa con domain.slug; se conserva businessSector legacy como señal de contexto.',
      )
    } else {
      comparison.domain.notes.push(
        'El plan legacy no expone businessSector ni señales textuales suficientes para comparar dominio.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El plan legacy no expone suficientes señales de dominio para comparar con generatedDomainContract.',
      )
    }

    comparison.roots.legacyRoot = extractLegacyRootCandidate(decision)
    if (comparison.roots.contractRoot && comparison.roots.legacyRoot) {
      comparison.roots.aligned =
        comparison.roots.contractRoot === comparison.roots.legacyRoot
      if (!comparison.roots.aligned) {
        pushUniqueMessage(
          comparison.roots.warnings,
          'El root del contrato difiere del root relativo expuesto por el plan legacy.',
        )
        pushUniqueMessage(
          comparison.warnings,
          'El root del generatedDomainContract no coincide con el root relativo del plan legacy.',
        )
      }
    } else if (comparison.roots.contractRoot) {
      pushUniqueMessage(
        comparison.roots.warnings,
        'El plan legacy no expone un root relativo comparable.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'No hay root relativo legacy suficiente para comparar con generatedDomainContract.',
      )
    }

    const contractSurfaceIdentifiers = unique(
      normalizedContract.frontendSurfaces
        .map((surface) =>
          asNonEmptyString(surface.key || surface.label || path.posix.basename(surface.path)),
        )
        .filter(Boolean),
    )
    const frontendSignalsPresent = detectLegacySignalPresence(
      legacyTextEntries,
      ['frontend', 'panel-operativo', 'panel operativo', 'frontend-publico', 'frontend publico'],
      [['frontend'], ['publico'], ['admin'], ['panel']],
    )
    const missingInLegacy = contractSurfaceIdentifiers.filter((identifier) => {
      const tokens = tokenizeComparisonText(identifier)
      if (tokens.length === 0) {
        return false
      }

      return !tokens.some((token) => legacyTokenSet.has(token))
    })
    comparison.surfaces.legacySignalsCount =
      contractSurfaceIdentifiers.length - missingInLegacy.length + (frontendSignalsPresent ? 1 : 0)
    comparison.surfaces.missingInLegacy = missingInLegacy
    comparison.surfaces.aligned =
      contractSurfaceIdentifiers.length === 0 ||
      missingInLegacy.length === 0 ||
      frontendSignalsPresent
    if (contractSurfaceIdentifiers.length === 0) {
      comparison.surfaces.notes.push(
        'El contrato no declara frontendSurfaces; la comparacion de superficies queda neutral.',
      )
    } else if (missingInLegacy.length > 0) {
      comparison.surfaces.notes.push(
        `Superficies sin señal directa en legacy: ${missingInLegacy.join(', ')}.`,
      )
      pushUniqueMessage(
        comparison.warnings,
        'Hay frontendSurfaces del generatedDomainContract sin señal directa en el plan legacy.',
      )
    }

    comparison.backend.legacySignalsPresent = detectLegacySignalPresence(
      legacyTextEntries,
      ['backend local', 'api local'],
      [['backend'], ['api'], ['route'], ['service'], ['server']],
    )
    comparison.backend.aligned =
      comparison.backend.contractPresent === false || comparison.backend.legacySignalsPresent
    if (comparison.backend.contractPresent && !comparison.backend.legacySignalsPresent) {
      comparison.backend.notes.push(
        'El contrato declara backend pero el plan legacy no deja señales claras de backend.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El generatedDomainContract declara backend y el plan legacy no deja señales equivalentes.',
      )
    }

    comparison.database.legacySignalsPresent = detectLegacySignalPresence(
      legacyTextEntries,
      ['base local sqlite', 'base de datos local'],
      [['database'], ['sqlite'], ['schema'], ['table'], ['seed']],
    )
    comparison.database.aligned =
      comparison.database.contractPresent === false || comparison.database.legacySignalsPresent
    if (comparison.database.contractPresent && !comparison.database.legacySignalsPresent) {
      comparison.database.notes.push(
        'El contrato declara database pero el plan legacy no deja señales claras de database.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El generatedDomainContract declara database y el plan legacy no deja señales equivalentes.',
      )
    }

    comparison.safety.legacySafetySignalsPresent = detectLegacySignalPresence(
      legacyTextEntries,
      [
        'sin pagos reales',
        'sin credenciales',
        'sin deploy',
        'sin docker',
        'sin servicios externos',
        'sin integraciones externas',
        'mock',
        'sandbox',
      ],
      [['deploy'], ['docker'], ['credenciales'], ['mock'], ['sandbox'], ['externos']],
    )
    comparison.safety.aligned =
      comparison.safety.contractSafe === true &&
      comparison.safety.legacySafetySignalsPresent === true
    if (comparison.safety.contractSafe && !comparison.safety.legacySafetySignalsPresent) {
      pushUniqueMessage(
        comparison.safety.warnings,
        'El plan legacy no explicita suficientes señales de safety comparables con el contrato.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'Faltan señales explícitas de safety en el plan legacy para comparar con generatedDomainContract.',
      )
    }

    const legacyAllowedTargetPaths = collectLegacyAllowedTargetPathEntries(decision)
    comparison.materialization.legacyAllowedTargetPathsCount = legacyAllowedTargetPaths.length
    const legacyHasUnsafeTraversalPath = legacyAllowedTargetPaths.some((entry) =>
      canonicalizePathString(entry).includes('..'),
    )
    const legacyHasDangerousAbsolutePath = legacyAllowedTargetPaths.some((entry) =>
      isAbsoluteLikePath(entry) && isDangerousAbsoluteRootPath(entry),
    )
    const legacyHasForbiddenFileSignal = legacyAllowedTargetPaths.some((entry) => {
      const basename = path.posix.basename(canonicalizePathString(entry)).toLowerCase()
      return basename === '.env' || basename === 'dockerfile'
    })
    if (legacyHasUnsafeTraversalPath) {
      pushUniqueMessage(
        comparison.materialization.warnings,
        'El plan legacy expone paths con traversal relativo fuera de scope.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El plan legacy expone paths con traversal relativo fuera de scope.',
      )
    }
    if (legacyHasDangerousAbsolutePath) {
      pushUniqueMessage(
        comparison.materialization.warnings,
        'El plan legacy expone rutas absolutas peligrosas para diagnostico.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El plan legacy expone rutas absolutas peligrosas para diagnostico.',
      )
    }
    if (legacyHasForbiddenFileSignal) {
      pushUniqueMessage(
        comparison.materialization.warnings,
        'El plan legacy menciona archivos prohibidos como .env o Dockerfile.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El plan legacy menciona archivos prohibidos para una entrega local segura.',
      )
    }
    comparison.materialization.aligned =
      comparison.materialization.contractAllowedTargetPathsCount > 0 &&
      comparison.materialization.legacyAllowedTargetPathsCount > 0 &&
      comparison.roots.aligned === true &&
      !legacyHasUnsafeTraversalPath &&
      !legacyHasDangerousAbsolutePath
    if (comparison.materialization.contractAllowedTargetPathsCount > 0 &&
      comparison.materialization.legacyAllowedTargetPathsCount === 0) {
      pushUniqueMessage(
        comparison.materialization.warnings,
        'El plan legacy no expone allowedTargetPaths comparables en esta fase.',
      )
      pushUniqueMessage(
        comparison.warnings,
        'El plan legacy no expone allowedTargetPaths comparables para el generatedDomainContract.',
      )
    }

    comparison.warningsCount = comparison.warnings.length
    comparison.errorsCount = comparison.errors.length
    comparison.status =
      comparison.errors.length > 0
        ? 'error'
        : comparison.warnings.length > 0
          ? 'partial'
          : 'compared'

    return comparison
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : asNonEmptyString(String(error), 'error')

    return {
      ...emptyComparison,
      present: true,
      status: 'error',
      safeForDiagnostics: true,
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

module.exports = {
  normalizeGeneratedDomainDeliveryLevel,
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveRequiredPathGroupsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainContractDiagnostics,
  buildGeneratedDomainContractComparison,
  extractGeneratedDomainContractCandidate,
}
