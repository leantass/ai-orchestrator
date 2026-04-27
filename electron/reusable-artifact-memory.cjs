const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')

const ARTIFACT_MEMORY_VERSION = 1
const ARTIFACT_MEMORY_DIRNAME = 'reusable-artifact-memory'
const ARTIFACT_DETAILS_DIRNAME = 'artifacts'
const ARTIFACT_PREVIEWS_DIRNAME = 'previews'
const ARTIFACT_CATALOG_FILENAME = 'catalog.json'
const MAX_SEARCH_RESULTS = 20

function normalizeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return [...new Set(values.map((value) => normalizeString(value)).filter(Boolean))]
}

function normalizeComparablePath(value) {
  const normalizedValue = normalizeString(value)

  if (!normalizedValue) {
    return ''
  }

  try {
    return path.resolve(normalizedValue)
  } catch {
    return ''
  }
}

function comparePathsCaseAware(leftPath, rightPath) {
  if (process.platform === 'win32') {
    return leftPath.toLocaleLowerCase() === rightPath.toLocaleLowerCase()
  }

  return leftPath === rightPath
}

function isPathInsideDirectory(basePath, candidatePath) {
  const normalizedBasePath = normalizeComparablePath(basePath)
  const normalizedCandidatePath = normalizeComparablePath(candidatePath)

  if (!normalizedBasePath || !normalizedCandidatePath) {
    return false
  }

  if (comparePathsCaseAware(normalizedBasePath, normalizedCandidatePath)) {
    return true
  }

  const relativePath = path.relative(normalizedBasePath, normalizedCandidatePath)

  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return false
  }

  return true
}

function buildTemporaryDirectoryCandidates() {
  return normalizeStringArray([os.tmpdir(), process.env.TMP, process.env.TEMP]).map((value) =>
    normalizeComparablePath(value),
  )
}

function pathIncludesCodexTempSegment(candidatePath) {
  const normalizedCandidatePath = normalizeComparablePath(candidatePath)

  if (!normalizedCandidatePath) {
    return false
  }

  const pathSegments = normalizedCandidatePath
    .split(/[\\/]+/)
    .map((segment) => segment.toLocaleLowerCase())

  return pathSegments.includes('.codex-temp')
}

function isTemporaryArtifactPath(candidatePath) {
  const normalizedCandidatePath = normalizeComparablePath(candidatePath)

  if (!normalizedCandidatePath) {
    return false
  }

  if (pathIncludesCodexTempSegment(normalizedCandidatePath)) {
    return true
  }

  return buildTemporaryDirectoryCandidates().some((temporaryDirectory) =>
    isPathInsideDirectory(temporaryDirectory, normalizedCandidatePath),
  )
}

function collectArtifactAssociatedPaths(record) {
  return normalizeStringArray([
    record?.localPath,
    record?.preview?.imagePath,
    record?.metadata?.workspacePath,
    ...(Array.isArray(record?.metadata?.createdPaths) ? record.metadata.createdPaths : []),
    ...(Array.isArray(record?.metadata?.touchedPaths) ? record.metadata.touchedPaths : []),
  ])
}

function isReusableArtifactTrusted(record) {
  const associatedPaths = collectArtifactAssociatedPaths(record)

  if (associatedPaths.length === 0) {
    return true
  }

  return !associatedPaths.some((candidatePath) => isTemporaryArtifactPath(candidatePath))
}

function normalizeMetadataValue(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'string') {
    return normalizeString(value) || undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    const normalizedEntries = value
      .map((entry) => normalizeMetadataValue(entry, depth + 1))
      .filter((entry) => entry !== undefined)
    return normalizedEntries.length > 0 ? normalizedEntries : undefined
  }

  if (typeof value === 'object') {
    const normalizedObject = Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, normalizeMetadataValue(entry, depth + 1)])
        .filter(([, entry]) => entry !== undefined),
    )
    return Object.keys(normalizedObject).length > 0 ? normalizedObject : undefined
  }

  return undefined
}

function normalizeTypography(typography) {
  if (!typography || typeof typography !== 'object') {
    return null
  }

  const normalized = {
    headingFamily: normalizeString(typography.headingFamily) || undefined,
    bodyFamily: normalizeString(typography.bodyFamily) || undefined,
    fontHref: normalizeString(typography.fontHref) || undefined,
  }

  return Object.values(normalized).some(Boolean) ? normalized : null
}

function normalizeColors(colors) {
  if (!colors || typeof colors !== 'object') {
    return null
  }

  const normalized = Object.fromEntries(
    Object.entries(colors)
      .map(([key, value]) => [key, normalizeString(value)])
      .filter(([, value]) => Boolean(value)),
  )

  return Object.keys(normalized).length > 0 ? normalized : null
}

function buildArtifactMemoryPaths(userDataPath) {
  const normalizedUserDataPath = normalizeString(userDataPath)

  if (!normalizedUserDataPath) {
    throw new Error('No se pudo resolver el directorio userData para la memoria reusable.')
  }

  const rootDir = path.join(normalizedUserDataPath, ARTIFACT_MEMORY_DIRNAME)
  return {
    rootDir,
    catalogPath: path.join(rootDir, ARTIFACT_CATALOG_FILENAME),
    artifactsDir: path.join(rootDir, ARTIFACT_DETAILS_DIRNAME),
    previewsDir: path.join(rootDir, ARTIFACT_PREVIEWS_DIRNAME),
  }
}

function buildEmptyCatalog() {
  return {
    version: ARTIFACT_MEMORY_VERSION,
    updatedAt: new Date().toISOString(),
    artifacts: [],
  }
}

async function ensureArtifactMemoryStorage({ userDataPath }) {
  const { rootDir, catalogPath, artifactsDir, previewsDir } =
    buildArtifactMemoryPaths(userDataPath)
  await fs.promises.mkdir(rootDir, { recursive: true })
  await fs.promises.mkdir(artifactsDir, { recursive: true })
  await fs.promises.mkdir(previewsDir, { recursive: true })

  try {
    await fs.promises.access(catalogPath, fs.constants.F_OK)
  } catch {
    await fs.promises.writeFile(
      catalogPath,
      JSON.stringify(buildEmptyCatalog(), null, 2),
      'utf8',
    )
  }

  return { rootDir, catalogPath, artifactsDir, previewsDir }
}

function normalizeArtifactPreview(preview) {
  if (!preview || typeof preview !== 'object') {
    return null
  }

  const normalized = {
    status: normalizeString(preview.status) || undefined,
    imagePath: normalizeString(preview.imagePath) || undefined,
    generatedAt: normalizeString(preview.generatedAt) || undefined,
    source: normalizeString(preview.source) || undefined,
    errorMessage: normalizeString(preview.errorMessage) || undefined,
  }

  return Object.values(normalized).some(Boolean) ? normalized : null
}

async function readArtifactCatalog({ userDataPath }) {
  const { catalogPath } = await ensureArtifactMemoryStorage({ userDataPath })

  try {
    const rawCatalog = await fs.promises.readFile(catalogPath, 'utf8')
    const parsedCatalog = JSON.parse(rawCatalog)

    if (!parsedCatalog || typeof parsedCatalog !== 'object') {
      return buildEmptyCatalog()
    }

    return {
      version:
        Number.isInteger(parsedCatalog.version) && parsedCatalog.version > 0
          ? parsedCatalog.version
          : ARTIFACT_MEMORY_VERSION,
      updatedAt:
        normalizeString(parsedCatalog.updatedAt) || new Date().toISOString(),
      artifacts: Array.isArray(parsedCatalog.artifacts) ? parsedCatalog.artifacts : [],
    }
  } catch {
    return buildEmptyCatalog()
  }
}

async function writeArtifactCatalog({ userDataPath, catalog }) {
  const { catalogPath } = await ensureArtifactMemoryStorage({ userDataPath })
  await fs.promises.writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf8')
}

function buildArtifactSearchTerms(record) {
  return normalizeStringArray([
    record.type,
    record.sector,
    record.sectorLabel,
    record.visualStyle,
    record.layoutVariant,
    record.heroStyle,
    record.primaryCta,
    record.secondaryCta,
    ...(record.tags || []),
    ...(record.metadata?.prioritySections || []),
    ...(record.metadata?.sectionOrder || []),
    record.metadata?.profileKey,
    record.metadata?.originalityLevel,
    record.metadata?.experienceType,
    record.metadata?.tone,
  ]).map((value) => value.toLocaleLowerCase())
}

function normalizeArtifactRecord(input) {
  const createdAt = normalizeString(input?.createdAt) || new Date().toISOString()
  const typography = normalizeTypography(input?.typography)
  const colors = normalizeColors(input?.colors)
  const metadata = normalizeMetadataValue(input?.metadata) || {}
  const tags = normalizeStringArray([
    ...(Array.isArray(input?.tags) ? input.tags : []),
    normalizeString(input?.sector),
    normalizeString(input?.visualStyle),
    normalizeString(input?.layoutVariant),
    normalizeString(input?.heroStyle),
    normalizeString(metadata?.profileKey),
    normalizeString(metadata?.originalityLevel),
  ])
  const record = {
    id: normalizeString(input?.id) || `artifact-${Date.now()}-${randomUUID().slice(0, 8)}`,
    type: normalizeString(input?.type) || 'web-artifact',
    sector: normalizeString(input?.sector),
    sectorLabel: normalizeString(input?.sectorLabel),
    visualStyle: normalizeString(input?.visualStyle),
    layoutVariant: normalizeString(input?.layoutVariant),
    heroStyle: normalizeString(input?.heroStyle),
    primaryCta: normalizeString(input?.primaryCta),
    secondaryCta: normalizeString(input?.secondaryCta),
    typography,
    colors,
    tags,
    createdAt,
    updatedAt: new Date().toISOString(),
    localPath: normalizeString(input?.localPath),
    metadata,
    preview: normalizeArtifactPreview(input?.preview),
  }

  return {
    ...record,
    searchTerms: buildArtifactSearchTerms(record),
  }
}

function buildCatalogSummary(record) {
  return {
    id: record.id,
    type: record.type,
    sector: record.sector,
    sectorLabel: record.sectorLabel,
    visualStyle: record.visualStyle,
    layoutVariant: record.layoutVariant,
    heroStyle: record.heroStyle,
    primaryCta: record.primaryCta,
    secondaryCta: record.secondaryCta,
    typography: record.typography,
    colors: record.colors,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    localPath: record.localPath,
    metadata: record.metadata,
    preview: record.preview,
    searchTerms: record.searchTerms,
  }
}

async function saveReusableArtifact({ userDataPath, artifact }) {
  const normalizedRecord = normalizeArtifactRecord(artifact)
  const { artifactsDir } = await ensureArtifactMemoryStorage({ userDataPath })
  const detailFilePath = path.join(artifactsDir, `${normalizedRecord.id}.json`)

  await fs.promises.writeFile(detailFilePath, JSON.stringify(normalizedRecord, null, 2), 'utf8')

  const catalog = await readArtifactCatalog({ userDataPath })
  const summary = buildCatalogSummary(normalizedRecord)
  const existingIndex = catalog.artifacts.findIndex(
    (entry) => normalizeString(entry?.id) === normalizedRecord.id,
  )

  if (existingIndex >= 0) {
    catalog.artifacts.splice(existingIndex, 1, summary)
  } else {
    catalog.artifacts.unshift(summary)
  }

  catalog.updatedAt = new Date().toISOString()
  await writeArtifactCatalog({ userDataPath, catalog })

  return normalizedRecord
}

function matchesArtifactFilters(record, filters) {
  const expectedId = normalizeString(filters?.id).toLocaleLowerCase()
  const expectedType = normalizeString(filters?.type).toLocaleLowerCase()
  const expectedSector = normalizeString(filters?.sector).toLocaleLowerCase()
  const expectedStyle = normalizeString(filters?.visualStyle).toLocaleLowerCase()
  const expectedLayout = normalizeString(filters?.layoutVariant).toLocaleLowerCase()
  const expectedHero = normalizeString(filters?.heroStyle).toLocaleLowerCase()
  const expectedTags = normalizeStringArray(filters?.tags).map((tag) =>
    tag.toLocaleLowerCase(),
  )
  const searchTerm = normalizeString(filters?.search).toLocaleLowerCase()
  const recordTags = normalizeStringArray(record?.tags).map((tag) => tag.toLocaleLowerCase())
  const recordSearchTerms = normalizeStringArray(record?.searchTerms)

  if (expectedId && record.id?.toLocaleLowerCase() !== expectedId) {
    return false
  }

  if (expectedType && record.type?.toLocaleLowerCase() !== expectedType) {
    return false
  }

  if (
    expectedSector &&
    !record.sector?.toLocaleLowerCase().includes(expectedSector) &&
    !record.sectorLabel?.toLocaleLowerCase().includes(expectedSector)
  ) {
    return false
  }

  if (
    expectedStyle &&
    !record.visualStyle?.toLocaleLowerCase().includes(expectedStyle)
  ) {
    return false
  }

  if (
    expectedLayout &&
    !record.layoutVariant?.toLocaleLowerCase().includes(expectedLayout)
  ) {
    return false
  }

  if (
    expectedHero &&
    !record.heroStyle?.toLocaleLowerCase().includes(expectedHero)
  ) {
    return false
  }

  if (expectedTags.length > 0 && !expectedTags.every((tag) => recordTags.includes(tag))) {
    return false
  }

  if (
    searchTerm &&
    !recordSearchTerms.some((term) => term.includes(searchTerm))
  ) {
    return false
  }

  return true
}

async function listReusableArtifacts({ userDataPath, filters = {} }) {
  const catalog = await readArtifactCatalog({ userDataPath })
  const limit =
    Number.isInteger(filters?.limit) && filters.limit > 0
      ? Math.min(filters.limit, MAX_SEARCH_RESULTS)
      : MAX_SEARCH_RESULTS

  return catalog.artifacts
    .filter((record) => isReusableArtifactTrusted(record))
    .filter((record) => matchesArtifactFilters(record, filters))
    .sort((left, right) => {
      const leftDate = normalizeString(left?.updatedAt)
      const rightDate = normalizeString(right?.updatedAt)
      return rightDate.localeCompare(leftDate)
    })
    .slice(0, limit)
}

function scoreArtifactSimilarity(record, query) {
  const normalizedQuery = {
    sector: normalizeString(query?.sector).toLocaleLowerCase(),
    visualStyle: normalizeString(query?.visualStyle).toLocaleLowerCase(),
    layoutVariant: normalizeString(query?.layoutVariant).toLocaleLowerCase(),
    heroStyle: normalizeString(query?.heroStyle).toLocaleLowerCase(),
    tags: normalizeStringArray(query?.tags).map((tag) => tag.toLocaleLowerCase()),
  }

  let score = 0

  if (normalizedQuery.sector && record.sector?.toLocaleLowerCase() === normalizedQuery.sector) {
    score += 6
  }

  if (
    normalizedQuery.visualStyle &&
    record.visualStyle?.toLocaleLowerCase() === normalizedQuery.visualStyle
  ) {
    score += 5
  }

  if (
    normalizedQuery.layoutVariant &&
    record.layoutVariant?.toLocaleLowerCase() === normalizedQuery.layoutVariant
  ) {
    score += 4
  }

  if (
    normalizedQuery.heroStyle &&
    record.heroStyle?.toLocaleLowerCase() === normalizedQuery.heroStyle
  ) {
    score += 3
  }

  if (normalizedQuery.tags.length > 0) {
    const recordTags = normalizeStringArray(record?.tags).map((tag) =>
      tag.toLocaleLowerCase(),
    )
    normalizedQuery.tags.forEach((tag) => {
      if (recordTags.includes(tag)) {
        score += 2
      }
    })
  }

  return score
}

function buildPlanningLookupMatch(record, extra = {}) {
  return {
    id: record.id,
    type: record.type,
    sector: record.sector,
    sectorLabel: record.sectorLabel,
    visualStyle: record.visualStyle,
    layoutVariant: record.layoutVariant,
    heroStyle: record.heroStyle,
    localPath: record.localPath,
    primaryCta: record.primaryCta,
    secondaryCta: record.secondaryCta,
    typography: record.typography,
    colors: record.colors,
    metadata: record.metadata,
    tags: normalizeStringArray(record.tags),
    similarityScore:
      typeof extra.similarityScore === 'number' ? extra.similarityScore : undefined,
    matchReasons: normalizeStringArray(extra.matchReasons),
  }
}

async function findSimilarReusableArtifacts({ userDataPath, query = {}, limit = 10 }) {
  const catalog = await readArtifactCatalog({ userDataPath })
  return catalog.artifacts
    .filter((record) => isReusableArtifactTrusted(record))
    .map((record) => ({
      ...record,
      similarityScore: scoreArtifactSimilarity(record, query),
    }))
    .filter((record) => record.similarityScore > 0)
    .sort((left, right) => {
      if (right.similarityScore !== left.similarityScore) {
        return right.similarityScore - left.similarityScore
      }

      return normalizeString(right.updatedAt).localeCompare(normalizeString(left.updatedAt))
    })
    .slice(0, Math.max(1, Math.min(limit, MAX_SEARCH_RESULTS)))
}

async function lookupReusableArtifactsForPlanning({
  userDataPath,
  sector,
  visualStyle,
  layoutVariant,
  heroStyle,
  tags,
  limit = 5,
}) {
  const normalizedLimit = Math.max(1, Math.min(limit, MAX_SEARCH_RESULTS))
  const exactSectorMatches = await listReusableArtifacts({
    userDataPath,
    filters: {
      sector,
      limit: normalizedLimit,
    },
  })
  const exactStyleMatches = await listReusableArtifacts({
    userDataPath,
    filters: {
      visualStyle,
      limit: normalizedLimit,
    },
  })
  const exactLayoutMatches = await listReusableArtifacts({
    userDataPath,
    filters: {
      layoutVariant,
      limit: normalizedLimit,
    },
  })
  const exactHeroMatches = await listReusableArtifacts({
    userDataPath,
    filters: {
      heroStyle,
      limit: normalizedLimit,
    },
  })
  const similarMatches = await findSimilarReusableArtifacts({
    userDataPath,
    query: {
      sector,
      visualStyle,
      layoutVariant,
      heroStyle,
      tags,
    },
    limit: normalizedLimit,
  })

  const mergedMatches = new Map()
  const registerMatch = (record, reason, similarityScore) => {
    if (!record || typeof record !== 'object') {
      return
    }

    const recordId = normalizeString(record.id)
    if (!recordId) {
      return
    }

    const currentEntry = mergedMatches.get(recordId)
    const currentReasons = currentEntry?.matchReasons || []
    mergedMatches.set(
      recordId,
      buildPlanningLookupMatch(record, {
        similarityScore:
          typeof similarityScore === 'number'
            ? Math.max(similarityScore, currentEntry?.similarityScore || 0)
            : currentEntry?.similarityScore,
        matchReasons: [...currentReasons, reason],
      }),
    )
  }

  exactSectorMatches.forEach((record) => registerMatch(record, 'same-sector', 10))
  exactStyleMatches.forEach((record) => registerMatch(record, 'same-style', 8))
  exactLayoutMatches.forEach((record) => registerMatch(record, 'same-layout', 7))
  exactHeroMatches.forEach((record) => registerMatch(record, 'same-hero', 6))
  similarMatches.forEach((record) =>
    registerMatch(record, 'similar-combination', record.similarityScore || 1),
  )

  const matches = [...mergedMatches.values()]
    .sort((left, right) => {
      const leftScore = typeof left.similarityScore === 'number' ? left.similarityScore : 0
      const rightScore =
        typeof right.similarityScore === 'number' ? right.similarityScore : 0
      if (rightScore !== leftScore) {
        return rightScore - leftScore
      }

      return normalizeString(right.id).localeCompare(normalizeString(left.id))
    })
    .slice(0, normalizedLimit)

  return {
    executed: true,
    foundCount: matches.length,
    matches,
  }
}

// El catálogo guarda un resumen chico para listar/filtrar rápido, y cada
// artefacto completo vive en su JSON individual. Así evitamos un único archivo
// enorme, mantenemos la memoria inspeccionable a mano y dejamos margen para
// sumar snapshots más pesados después sin rehacer la base.
function buildReusableArtifactFromWebScaffold({
  requestId,
  instruction,
  context,
  workspacePath,
  businessSector,
  businessSectorLabel,
  creativeDirection,
  fastTask,
  response,
}) {
  if (
    (fastTask?.type !== 'composite-local' && fastTask?.type !== 'materialization-plan') ||
    fastTask?.brainStrategy !== 'web-scaffold-base' ||
    response?.ok !== true
  ) {
    return null
  }

  const normalizedWorkspacePath = normalizeString(workspacePath)
  const relativeTargetPath = normalizeString(fastTask?.relativeTargetPath)
  const associatedLocalPath = relativeTargetPath && normalizedWorkspacePath
    ? path.normalize(path.resolve(normalizedWorkspacePath, relativeTargetPath))
    : normalizeString(
        response?.details?.createdPaths?.[0] ||
          response?.details?.currentTargetPath ||
          '',
      )
  const resolvedCreativeDirection =
    creativeDirection && typeof creativeDirection === 'object'
      ? creativeDirection
      : fastTask?.creativeDirection && typeof fastTask.creativeDirection === 'object'
        ? fastTask.creativeDirection
        : {}

  return {
    type: 'web-scaffold-template',
    sector: normalizeString(businessSector || fastTask?.businessSector),
    sectorLabel: normalizeString(businessSectorLabel || fastTask?.businessSectorLabel),
    visualStyle: normalizeString(resolvedCreativeDirection.visualStyle),
    layoutVariant: normalizeString(resolvedCreativeDirection.layoutVariant),
    heroStyle: normalizeString(resolvedCreativeDirection.heroStyle),
    primaryCta: normalizeString(resolvedCreativeDirection?.cta?.primary),
    secondaryCta: normalizeString(resolvedCreativeDirection?.cta?.secondary),
    typography: resolvedCreativeDirection.typography,
    colors: resolvedCreativeDirection.paletteSuggestion,
    localPath: associatedLocalPath,
    tags: [
      'web',
      'scaffold',
      'fast-local',
      normalizeString(resolvedCreativeDirection.profileKey),
      normalizeString(resolvedCreativeDirection.originalityLevel),
      normalizeString(resolvedCreativeDirection.layoutRhythm),
    ],
    metadata: {
      source: 'fast-local:web-scaffold-base',
      requestId: normalizeString(requestId),
      workspacePath: normalizedWorkspacePath || undefined,
      relativeTargetPath: relativeTargetPath || undefined,
      profileKey: normalizeString(resolvedCreativeDirection.profileKey),
      originalityLevel: normalizeString(resolvedCreativeDirection.originalityLevel),
      experienceType: normalizeString(resolvedCreativeDirection.experienceType),
      tone: normalizeString(resolvedCreativeDirection.tone),
      layoutRhythm: normalizeString(resolvedCreativeDirection.layoutRhythm),
      contentDensity: normalizeString(resolvedCreativeDirection.contentDensity),
      sectionOrder: normalizeStringArray(resolvedCreativeDirection.sectionOrder),
      prioritySections: normalizeStringArray(
        resolvedCreativeDirection.prioritySections,
      ),
      layoutCriteria: normalizeStringArray(resolvedCreativeDirection.layoutCriteria),
      instruction: normalizeString(instruction),
      contextPreview: normalizeString(context).slice(0, 400) || undefined,
      createdPaths: normalizeStringArray(response?.details?.createdPaths),
      touchedPaths: normalizeStringArray(response?.details?.touchedPaths),
      appliedReuseMode: normalizeString(response?.details?.appliedReuseMode) || undefined,
      reusedStyleFromArtifactId:
        normalizeString(response?.details?.reusedStyleFromArtifactId) || undefined,
      reusedStructureFromArtifactId:
        normalizeString(response?.details?.reusedStructureFromArtifactId) || undefined,
      reuseAppliedFields: normalizeStringArray(response?.details?.reuseAppliedFields),
      reuseMaterializationReason:
        normalizeString(response?.details?.reuseMaterializationReason) || undefined,
    },
  }
}

module.exports = {
  ensureArtifactMemoryStorage,
  saveReusableArtifact,
  listReusableArtifacts,
  findSimilarReusableArtifacts,
  lookupReusableArtifactsForPlanning,
  buildReusableArtifactFromWebScaffold,
  isReusableArtifactTrusted,
}
