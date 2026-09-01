import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { buildHumanFeedback } = require('../electron/jefe-human-feedback.cjs')
const approval = { state: 'rejected', decision: 'rejected', reason: '  La experiencia necesita una corrección narrativa.\n\nRevisar alcance, tiempos y diferenciación.  ', findings: [], questions: [], actor: { identity: 'human-reviewer' }, authenticationStatus: 'not_connected', updatedAt: '2026-09-01T17:24:43.959Z', projectId: 'feedback-project', versionId: 'version-feedback', previewRequestId: 'preview-feedback', snapshotSha256: 'snapshot-feedback' }
const feedback = buildHumanFeedback({ approval, projectBrief: { objective: 'Ordenar la propuesta.' }, businessUnderstanding: { audience: 'Equipos comerciales' }, qualityReports: { content: { status: 'needs_revision' } } })
assert.equal(feedback.rejectionReason, 'La experiencia necesita una corrección narrativa. Revisar alcance, tiempos y diferenciación.')
assert.deepEqual(feedback.findings, [])
assert.equal(feedback.snapshot.versionId, 'version-feedback')
assert.equal(feedback.reviewer, 'human-reviewer')
assert.throws(() => buildHumanFeedback({ approval: { ...approval, reason: null } }), /rejectionReason/u)
console.log('PASS jefe-human-feedback-contract-smoke: reason canonical, empty findings allowed, correction input prepared')
