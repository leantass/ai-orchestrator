function normalizeWorkspaceProjectText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenizeWorkspaceProjectText(value) {
  return normalizeWorkspaceProjectText(value)
    .split(/\s+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3)
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

function scoreWorkspaceManifestCandidate({
  goal,
  context,
  candidate,
}) {
  const manifest = candidate?.manifest && typeof candidate.manifest === 'object' ? candidate.manifest : {}
  const combinedGoalText = normalizeWorkspaceProjectText([goal, context].filter(Boolean).join(' '))
  const deliveryLevel = normalizeWorkspaceProjectText(
    manifest.deliveryLevel || manifest.projectType || '',
  )
  const domain = normalizeWorkspaceProjectText(manifest.domain || '')
  const projectRootLabel = normalizeWorkspaceProjectText(
    candidate?.projectRootRelativePath || manifest.projectRoot || '',
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

  if (combinedGoalText.includes('fullstack local') && deliveryLevel === 'fullstack local') {
    score += 22
    signals.push('delivery-level-match')
  }

  const domainMatches = countTokenMatches(combinedGoalText, domain, 3)
  if (domainMatches.length > 0) {
    score += 18 + domainMatches.length * 8
    signals.push(`domain:${domainMatches.join(',')}`)
  }

  const rootMatches = countTokenMatches(combinedGoalText, projectRootLabel, 4)
  if (rootMatches.length > 0) {
    score += 12 + rootMatches.length * 6
    signals.push(`project-root:${rootMatches.join(',')}`)
  }

  if (nextRecommendedPhase) {
    score += 6
    signals.push(`next-phase:${nextRecommendedPhase}`)
  }

  if (lastCompletedPhase) {
    score += 6
    signals.push(`last-phase:${lastCompletedPhase}`)
  }

  if (scaffoldDone) {
    score += 10
    signals.push('scaffold-done')
  }

  return {
    score,
    signals,
  }
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
  selectBestWorkspaceProjectCandidate,
  shouldIgnoreWorkspaceDirectoryEntry,
}
