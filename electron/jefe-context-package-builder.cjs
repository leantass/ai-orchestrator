const { canonical, checksum, safeText, validateRequest, validatePackage } = require('./jefe-context-package-contract.cjs')

const VIEWS = Object.freeze({
  cerebro: ['objective', 'decisions', 'risks', 'conflicts', 'outcomes', 'failures', 'corrections'],
  jefe: ['objective', 'decisions', 'risks', 'conflicts', 'outcomes', 'failures', 'corrections'],
  radar: ['objective', 'requirements', 'constraints', 'evidence', 'assumptions', 'questions'],
  hermes: ['objective', 'questions', 'constraints', 'evidence', 'risks'],
  scout: ['objective', 'questions', 'constraints', 'evidence', 'risks'],
  planner: ['objective', 'requirements', 'constraints', 'decisions', 'evidence', 'risks', 'corrections'],
  codex: ['objective', 'requirements', 'constraints', 'decisions', 'corrections', 'evidence'],
  qa: ['requirements', 'decisions', 'evidence', 'validations', 'failures', 'corrections', 'risks'],
})
const SOURCE_SECTIONS = Object.freeze({ objective: 'objective', requirements: 'requirements', constraints: 'constraints', preferences: 'preferences', decisions: 'decisions', evidence: 'evidence', assumptions: 'assumptionsPending', risks: 'risksOpen', questions: 'questionsOpen', validations: 'validations', outcomes: 'results', failures: 'failuresOpen', corrections: 'correctionsApplied' })
const PRIORITY = Object.freeze({ conflicts: 0, decisions: 1, objective: 2, constraints: 3, requirements: 4, failures: 5, corrections: 5, risks: 6, questions: 6, evidence: 7, validations: 7, outcomes: 8, preferences: 8, assumptions: 8 })
function matches(entry, identity) { return entry && entry.identity && entry.identity.projectId === identity.projectId && (!identity.runId || entry.identity.runId === identity.runId || entry.scope === 'project') && (!identity.versionId || entry.identity.versionId === identity.versionId || entry.scope === 'project') }
function cleanReference(reference) {
  if (!reference || typeof reference !== 'object' || typeof reference.kind !== 'string' || reference.kind.length > 40 || !safeText(reference.value) || /^file:/iu.test(reference.value) || reference.value.split(/[\\/]/u).includes('..')) return null
  if (reference.kind === 'url' && !/^https:\/\//iu.test(reference.value)) return null
  return { kind: reference.kind, value: reference.value }
}
function cleanEntry(entry) {
  if (!entry || typeof entry !== 'object' || !safeText(entry.summary) || !matches(entry, entry.identity || {})) return null
  const references = Array.isArray(entry.references) ? entry.references.map(cleanReference).filter(Boolean) : []
  return { entryId: entry.entryId, timestamp: entry.timestamp, scope: entry.scope, identity: entry.identity, type: entry.type, summary: entry.summary, actor: entry.actor, authority: entry.authority, provenance: entry.provenance, references }
}
function entries(value, identity) { const values = Array.isArray(value) ? value : value ? [value] : []; return values.filter((entry) => matches(entry, identity)).map(cleanEntry).filter(Boolean).sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.entryId.localeCompare(b.entryId)) }
function asOf(snapshot) { return (snapshot.history || []).filter((entry) => entry && typeof entry.timestamp === 'string').map((entry) => entry.timestamp).sort().at(-1) || null }
function buildContext(snapshot, identity, agent) {
  const context = {}; for (const section of VIEWS[agent]) context[section] = entries(snapshot[SOURCE_SECTIONS[section]], identity)
  const conflicts = Array.isArray(snapshot.conflicts) ? snapshot.conflicts.filter((item) => item && typeof item.entryId === 'string').sort((a, b) => a.entryId.localeCompare(b.entryId)) : []
  context.conflicts = conflicts
  context.nextResponsible = typeof snapshot.nextResponsible === 'string' ? snapshot.nextResponsible : null
  context.humanPending = Boolean(snapshot.requiresLean)
  const lineageIds = new Set((snapshot.history || []).flatMap((entry) => Array.isArray(entry.relations) ? [entry.entryId, ...entry.relations.map((relation) => relation.entryId)] : []))
  context.lineage = entries((snapshot.history || []).filter((entry) => lineageIds.has(entry.entryId)), identity)
  return context
}
function candidates(context) { const values = []; for (const [section, entries] of Object.entries(context)) if (Array.isArray(entries) && section !== 'conflicts' && section !== 'lineage') for (const entry of entries) values.push({ section, entry, priority: PRIORITY[section] ?? 9 }); return values.sort((a, b) => a.priority - b.priority || a.entry.timestamp.localeCompare(b.entry.timestamp) || a.entry.entryId.localeCompare(b.entry.entryId)) }
function omit(omissions, section, entry, reason) { const item = omissions.find((value) => value.section === section && value.reason === reason); if (item) { item.count += 1; item.entryIds.push(entry.entryId); return }; omissions.push({ section, count: 1, reason, entryIds: [entry.entryId] }) }
function applyBudget(context, budget) {
  const selected = {}; const omissions = []; let count = 0; let characters = 0
  for (const item of candidates(context)) {
    const size = canonical(item.entry).length
    if (count >= budget.maxEntries) { omit(omissions, item.section, item.entry, 'maxEntries'); continue }
    if (characters + size > budget.maxCharacters) { omit(omissions, item.section, item.entry, 'maxCharacters'); continue }
    ;(selected[item.section] ||= []).push(item.entry); count += 1; characters += size
  }
  for (const section of Object.keys(context)) if (!Object.hasOwn(selected, section) && Array.isArray(context[section])) selected[section] = []
  selected.conflicts = context.conflicts; selected.nextResponsible = context.nextResponsible; selected.humanPending = context.humanPending; selected.lineage = context.lineage
  return { context: selected, omissions, count, characters }
}
function buildContextPackage(input) {
  const request = validateRequest(input)
  const snapshot = input.snapshot
  const syncStatus = input.syncStatus || {}
  const source = { snapshotSchemaVersion: snapshot && snapshot.schemaVersion || null, asOf: asOf(snapshot || {}), syncStatus: syncStatus.status || 'failed', eventChecksum: checksum((snapshot && snapshot.history) || []) }
  const blockers = []
  if (!snapshot || !Array.isArray(snapshot.history) || snapshot.corruptions && snapshot.corruptions.length) blockers.push('snapshot_inconsistent')
  if (syncStatus.status !== 'synced') blockers.push(`memory_${syncStatus.status || 'failed'}`)
  const all = (snapshot && snapshot.history) || []
  if (all.some((entry) => !matches(entry, request.identity))) blockers.push('identity_inconsistent')
  const rawContext = snapshot && !blockers.length ? buildContext(snapshot, request.identity, request.targetAgent) : { conflicts: [], nextResponsible: null, humanPending: false, lineage: [] }
  const budgeted = applyBudget(rawContext, request.budget)
  const objective = budgeted.context.objective && budgeted.context.objective.length
  const requirements = budgeted.context.requirements && budgeted.context.requirements.length
  if (!objective && request.purpose !== 'validation') blockers.push('objective_missing')
  if (['planning', 'execution', 'validation'].includes(request.purpose) && !requirements) blockers.push('requirements_missing')
  const restricted = !blockers.length && (rawContext.conflicts.length || rawContext.humanPending || (rawContext.questions || []).length)
  const coreMissing = ['objective', 'constraints', 'requirements'].some((section) => (section === 'objective' ? !objective : (rawContext[section] || []).length && !(budgeted.context[section] || []).length))
  if (coreMissing) blockers.push('budget_excludes_core')
  const disposition = blockers.length ? 'blocked' : restricted ? 'restricted' : 'ready'
  const allowedUse = disposition === 'ready' ? ['read_context', 'prepare_draft'] : disposition === 'restricted' ? ['read_context', 'clarify', 'research', 'prepare_draft'] : []
  const base = { schemaVersion: 'jefe-context-package/v1', targetAgent: request.targetAgent, purpose: request.purpose, scope: request.scope, identity: request.identity, disposition, allowedUse, blockers: blockers.sort(), source, context: budgeted.context, budget: { ...request.budget, usedEntries: budgeted.count, usedCharacters: budgeted.characters }, omissions: budgeted.omissions.sort((a, b) => a.section.localeCompare(b.section) || a.reason.localeCompare(b.reason)) }
  const packageId = `context-package-${checksum(base).slice(0, 32)}`
  const result = { ...base, packageId, integrity: { algorithm: 'sha256', checksum: checksum({ ...base, packageId }), deterministic: true } }
  return validatePackage(result)
}

module.exports = { buildContextPackage, VIEWS }
