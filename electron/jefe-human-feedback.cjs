const MAX_REASON_LENGTH = 2000
const MAX_FINDINGS = 20

function text(value, field, max = MAX_REASON_LENGTH) {
  if (value == null) return null
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string.`)
  const normalized = value.trim().replace(/\s+/gu, ' ')
  if (normalized.length > max) throw new RangeError(`${field} exceeds the maximum length.`)
  return normalized || null
}

function list(value) {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > MAX_FINDINGS) throw new TypeError('findings must be an array.')
  return value.map((finding) => {
    if (typeof finding === 'string') return { id: null, title: null, detail: finding, severity: null }
    if (!finding || typeof finding !== 'object') throw new TypeError('Each finding must be structured.')
    return {
      id: text(finding.id, 'finding.id', 80),
      title: text(finding.title, 'finding.title', 240),
      detail: text(finding.detail, 'finding.detail', 1000),
      severity: text(finding.severity, 'finding.severity', 40),
    }
  })
}

function buildHumanFeedback({ approval, preview, projectBrief, businessUnderstanding, qualityReports = {} } = {}) {
  if (!approval || approval.state !== 'rejected' || approval.decision !== 'rejected') throw new Error('A rejected human approval is required.')
  const rejectionReason = text(approval.reason, 'rejectionReason')
  if (!rejectionReason) throw new Error('A rejected approval requires rejectionReason.')
  return {
    rejectionReason,
    findings: list(approval.findings),
    questions: Array.isArray(approval.questions) ? approval.questions.map((question) => text(question, 'questions', 240)).filter(Boolean) : [],
    reviewer: approval.actor?.identity || approval.reviewer || null,
    authenticationStatus: approval.authenticationStatus || 'not_connected',
    timestamp: approval.updatedAt || approval.timestamp || null,
    snapshot: { projectId: approval.projectId, versionId: approval.versionId, previewRequestId: approval.previewRequestId, snapshotSha256: approval.snapshotSha256 || preview?.versionSnapshot?.snapshotSha256 || null },
    artifactSha256: approval.artifactSha256 || preview?.versionSnapshot?.artifactSha256 || null,
    correctionId: approval.correctionId || null,
    returnTarget: approval.returnTarget || 'execution',
    provenance: { source: 'human_gate', authority: approval.authority || 'human_decision', actorType: approval.actor?.type || 'human', authenticationStatus: approval.authenticationStatus || 'not_connected' },
    projectBrief: projectBrief || null,
    businessUnderstanding: businessUnderstanding || null,
    qualityReports: qualityReports || {},
  }
}

module.exports = { MAX_REASON_LENGTH, buildHumanFeedback }
