function normalizeWorkspaceProjectText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenizeWorkspaceProjectText(value) {
  const ignoredTokens = new Set([
    'app',
    'base',
    'delivery',
    'entrega',
    'first',
    'frontend',
    'fullstack',
    'funcional',
    'local',
    'mock',
    'phase',
    'plan',
    'plataforma',
    'project',
    'proyecto',
    'safe',
    'sistema',
    'workspace',
  ])

  return normalizeWorkspaceProjectText(value)
    .split(/\s+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3 && !ignoredTokens.has(entry))
}

const IGNORED_WORKSPACE_DIRECTORY_NAMES = new Set([
  '.git',
  '.hg',
  '.svn',
  '.tmp',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'deploy',
  'dist',
  'node_modules',
  'out',
  'tmp',
])

function shouldIgnoreWorkspaceDirectoryEntry(entryName) {
  const normalizedName = String(entryName || '').trim().toLocaleLowerCase()
  return normalizedName ? IGNORED_WORKSPACE_DIRECTORY_NAMES.has(normalizedName) : false
}

function countTokenMatches(sourceText, candidateText, limit = 4) {
  const sourceTokens = new Set(tokenizeWorkspaceProjectText(sourceText))
  const candidateTokens = tokenizeWorkspaceProjectText(candidateText)
  const matches = []

  for (const token of candidateTokens) {
    if (!sourceTokens.has(token) || matches.includes(token)) {
      continue
    }

    matches.push(token)

    if (matches.length >= limit) {
      break
    }
  }

  return matches
}

function collectManifestSemanticMatches({
  goal,
  context,
  candidate,
}) {
  const manifest = candidate?.manifest && typeof candidate.manifest === 'object' ? candidate.manifest : {}
  const combinedGoalText = normalizeWorkspaceProjectText([goal, context].filter(Boolean).join(' '))
  const domain = normalizeWorkspaceProjectText(manifest.domain || '')
  const projectRootLabel = normalizeWorkspaceProjectText(
    candidate?.projectRootRelativePath || manifest.projectRoot || '',
  )
  const moduleLabels = Array.isArray(manifest.modules)
    ? manifest.modules
        .flatMap((entry) => [entry?.id, entry?.name])
        .filter((entry) => typeof entry === 'string' && entry.trim())
        .join(' ')
    : ''
  const availableActions = Array.isArray(manifest.availableActions)
    ? manifest.availableActions.join(' ')
    : ''

  const domainMatches = countTokenMatches(combinedGoalText, domain, 4)
  const explicitRootReference =
    projectRootLabel && combinedGoalText.includes(projectRootLabel)
      ? ['explicit-project-root']
      : []
  const rootMatches =
    explicitRootReference.length > 0
      ? explicitRootReference
      : countTokenMatches(combinedGoalText, projectRootLabel, 4)
  const moduleMatches = countTokenMatches(
    combinedGoalText,
    [moduleLabels, availableActions].filter(Boolean).join(' '),
    4,
  )

  return {
    domainMatches,
    rootMatches,
    moduleMatches,
    hasSemanticMatch:
      domainMatches.length > 0 || rootMatches.length > 0 || moduleMatches.length > 0,
  }
}

function scoreWorkspaceManifestCandidate({
  goal,
  context,
  candidate,
}) {
  const manifest = candidate?.manifest && typeof candidate.manifest === 'object' ? candidate.manifest : {}
  const deliveryLevel = normalizeWorkspaceProjectText(
    manifest.deliveryLevel || manifest.projectType || '',
  )
  const nextRecommendedPhase = normalizeWorkspaceProjectText(
    manifest.nextRecommendedPhase || '',
  )
  const lastCompletedPhase = normalizeWorkspaceProjectText(
    manifest.lastCompletedPhase || '',
  )
  const phases = Array.isArray(manifest.phases) ? manifest.phases : []
  const scaffoldDone = phases.some(
    (entry) =>
      entry &&
      String(entry.id || '').trim() === 'fullstack-local-scaffold' &&
      String(entry.status || '').trim().toLocaleLowerCase() === 'done',
  )

  let score = 0
  const signals = []
  const semanticSignals = collectManifestSemanticMatches({
    goal,
    context,
    candidate,
  })

  if (
    normalizeWorkspaceProjectText([goal, context].filter(Boolean).join(' ')).includes(
      'fullstack local',
    ) &&
    deliveryLevel === 'fullstack local'
  ) {
    score += 22
    signals.push('delivery-level-match')
  }

  const { domainMatches, rootMatches, moduleMatches, hasSemanticMatch } = semanticSignals

  if (domainMatches.length > 0) {
    score += 18 + domainMatches.length * 8
    signals.push(`domain:${domainMatches.join(',')}`)
  }

  if (rootMatches.length > 0) {
    score += 12 + rootMatches.length * 6
    signals.push(`project-root:${rootMatches.join(',')}`)
  }

  if (moduleMatches.length > 0) {
    score += 10 + moduleMatches.length * 5
    signals.push(`modules:${moduleMatches.join(',')}`)
  }

  if (hasSemanticMatch && nextRecommendedPhase) {
    score += 6
    signals.push(`next-phase:${nextRecommendedPhase}`)
  }

  if (hasSemanticMatch && lastCompletedPhase) {
    score += 6
    signals.push(`last-phase:${lastCompletedPhase}`)
  }

  if (hasSemanticMatch && scaffoldDone) {
    score += 10
    signals.push('scaffold-done')
  }

  return {
    score,
    signals,
  }
}

function classifyWorkspaceProjectIntent({
  goal,
  context,
  candidate,
}) {
  const normalizedText = normalizeWorkspaceProjectText([goal, context].filter(Boolean).join(' '))
  const semanticSignals = collectManifestSemanticMatches({
    goal,
    context,
    candidate,
  })
  const explicitContinue =
    /\b(?:continua\s+el\s+proyecto|continua\s+con|continu[aá]\s+el\s+proyecto|continu[aá]\s+con|seguir\s+con|segui\s+con|segui\s+el\s+proyecto|proyecto\s+existente|proyecto\s+anterior|agregale|sumale|amplia\s+el\s+proyecto|mejora\s+el\s+proyecto)\b/u.test(
      normalizedText,
    )
  const explicitNewProject =
    /\b(?:crear|hacer|armar|generar|construir)\b/u.test(normalizedText) &&
    /\b(?:sistema|app|aplicacion|plataforma|entrega|proyecto)\b/u.test(normalizedText)
  const explicitFirstDelivery =
    /\b(?:primera entrega|entrega funcional local|nuevo proyecto|proyecto nuevo)\b/u.test(
      normalizedText,
    )
  const shouldContinue =
    explicitContinue && semanticSignals.hasSemanticMatch
      ? true
      : !explicitNewProject &&
          !explicitFirstDelivery &&
          (semanticSignals.domainMatches.length > 0 ||
            semanticSignals.rootMatches.length > 0 ||
            semanticSignals.moduleMatches.length >= 2)

  if (shouldContinue) {
    return {
      intent: 'continue-existing-project-intent',
      hasSemanticMatch: semanticSignals.hasSemanticMatch,
      signals: summarizeIntentSignals([
        explicitContinue ? 'explicit-continue' : '',
        ...semanticSignals.domainMatches.map((entry) => `domain:${entry}`),
        ...semanticSignals.rootMatches.map((entry) => `root:${entry}`),
        ...semanticSignals.moduleMatches.map((entry) => `module:${entry}`),
      ]),
    }
  }

  const hasStrongSemanticMatch =
    semanticSignals.domainMatches.length > 0 ||
    semanticSignals.rootMatches.length > 0 ||
    semanticSignals.moduleMatches.length >= 2

  if ((explicitNewProject || explicitFirstDelivery) && !explicitContinue) {
    return {
      intent: hasStrongSemanticMatch ? 'ambiguous-intent' : 'new-project-intent',
      hasSemanticMatch: semanticSignals.hasSemanticMatch,
      signals: summarizeIntentSignals([
        explicitNewProject ? 'explicit-new-project' : '',
        explicitFirstDelivery ? 'explicit-first-delivery' : '',
        ...semanticSignals.domainMatches.map((entry) => `domain:${entry}`),
        ...semanticSignals.rootMatches.map((entry) => `root:${entry}`),
      ]),
    }
  }

  return {
    intent: semanticSignals.hasSemanticMatch ? 'ambiguous-intent' : 'new-project-intent',
    hasSemanticMatch: semanticSignals.hasSemanticMatch,
    signals: summarizeIntentSignals([
      ...semanticSignals.domainMatches.map((entry) => `domain:${entry}`),
      ...semanticSignals.rootMatches.map((entry) => `root:${entry}`),
      ...semanticSignals.moduleMatches.map((entry) => `module:${entry}`),
    ]),
  }
}

function summarizeIntentSignals(values) {
  return values.filter((entry, index, array) => entry && array.indexOf(entry) === index)
}

function selectBestWorkspaceProjectCandidate({
  goal,
  context,
  candidates,
}) {
  const validCandidates = Array.isArray(candidates)
    ? candidates.filter((entry) => entry && typeof entry === 'object' && entry.manifest)
    : []

  if (validCandidates.length === 0) {
    return null
  }

  const scoredCandidates = validCandidates
    .map((candidate) => ({
      candidate,
      ...scoreWorkspaceManifestCandidate({
        goal,
        context,
        candidate,
      }),
    }))
    .sort((leftEntry, rightEntry) => {
      if (rightEntry.score !== leftEntry.score) {
        return rightEntry.score - leftEntry.score
      }

      return String(leftEntry.candidate.projectRootRelativePath || '').localeCompare(
        String(rightEntry.candidate.projectRootRelativePath || ''),
      )
    })

  const bestEntry = scoredCandidates[0] || null

  if (!bestEntry) {
    return null
  }

  if (bestEntry.score < 40) {
    return null
  }

  return {
    ...bestEntry.candidate,
    matchScore: bestEntry.score,
    matchSignals: bestEntry.signals,
    matchedCandidateCount: validCandidates.length,
  }
}

module.exports = {
  classifyWorkspaceProjectIntent,
  selectBestWorkspaceProjectCandidate,
  shouldIgnoreWorkspaceDirectoryEntry,
}
