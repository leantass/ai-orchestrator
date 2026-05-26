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

function normalizeRelativePath(value) {
  const normalized = asNonEmptyString(value).replace(/\\/g, '/').replace(/^\/+/, '')
  return normalized
}

function isAbsoluteLikePath(value) {
  return /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('/') || value.startsWith('\\\\')
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
  const rootSlug = slugify(root.slug || `${domainSlug}-local`, `${domainSlug}-local`)
  const sourceRoot = normalizeRelativePath(root.sourceRoot || rootSlug) || rootSlug
  const targetRoot = normalizeRelativePath(root.targetRoot || rootSlug) || rootSlug

  const normalized = {
    contractVersion: asNonEmptyString(source.contractVersion, DEFAULT_CONTRACT_VERSION),
    deliveryLevel: asNonEmptyString(source.deliveryLevel, DEFAULT_DELIVERY_LEVEL),
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
        path: surfacePath,
        screens: asArray(value.screens),
      }
    }),
    backend: {
      packageFile: normalizeRelativePath(
        backend.packageFile || backend.packageJson || 'backend/package.json',
      ),
      entryFile: normalizeRelativePath(backend.entryFile || 'backend/src/server.js'),
      routes: asArray(backend.routes).map(normalizeRouteEntry),
      services: asArray(backend.services).map(normalizeRouteEntry),
      modules: asArray(backend.modules).map(normalizeRouteEntry),
    },
    database: {
      schemaFile: normalizeRelativePath(database.schemaFile || 'database/schema.sql'),
      seedFile: normalizeRelativePath(database.seedFile || 'database/seed.sql'),
      tables: asArray(database.tables),
      relationships: asArray(database.relationships),
      seedData: asArray(database.seedData),
    },
    shared: {
      files: collectPathList(shared.files, (entry) =>
        typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
      ),
    },
    docs: collectPathList(source.docs, (entry) =>
      typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
    ),
    scripts: collectPathList(source.scripts, (entry) =>
      typeof entry === 'string' ? entry : asObject(entry).path || asObject(entry).file || '',
    ),
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
        ),
      ),
      operations: asArray(materialization.operations).map((entry) => {
        const value = asObject(entry)
        return {
          type: asNonEmptyString(value.type, 'replace-file'),
          targetPath: normalizeRelativePath(value.targetPath || ''),
          nextContent: typeof value.nextContent === 'string' ? value.nextContent : '',
        }
      }),
      allowedTargetPaths: unique(
        collectPathList(materialization.allowedTargetPaths, (entry) => entry),
      ),
    },
    validation: {
      syntaxChecks: unique(asArray(validation.syntaxChecks).map((entry) => asNonEmptyString(entry))),
      requiredPathGroups: asArray(validation.requiredPathGroups)
        .map((group) => unique(asArray(group).map((entry) => normalizeRelativePath(entry)).filter(Boolean)))
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
        normalizeRelativePath(path.posix.join(normalized.root.targetRoot, trimRootPrefix(normalized, entry))),
      ),
    ])
  }

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
  const warnings = []

  if (!normalized.contractVersion) {
    errors.push('contractVersion es requerido.')
  }
  if (normalized.deliveryLevel !== DEFAULT_DELIVERY_LEVEL) {
    errors.push(`deliveryLevel debe ser ${DEFAULT_DELIVERY_LEVEL}.`)
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

module.exports = {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveRequiredPathGroupsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  isContractSafeForLocalMaterialization,
}
