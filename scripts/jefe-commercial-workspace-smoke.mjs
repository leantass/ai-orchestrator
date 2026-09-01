import assert from 'node:assert/strict'
import { commercialState, eventLabel, workspaceView } from '../src/commercial/hubModel.ts'

const base = { projectId: 'internal-id', projectName: 'Marca', state: 'not_ready', versionCount: 0, activeVersionId: 'internal-version', previewAvailable: false, previewMode: 'unavailable', deliveryAvailable: false, delivery: { status: 'not_ready', deliveredAt: null }, approval: { approved: false, approvedAt: null, observation: null }, nextStep: 'review_and_approve', blockers: ['approval_required'], lastActivity: '2026-01-01T00:00:00.000Z', generationProfile: 'commercial_site', projectType: 'agency_site', platform: 'web', creativeDirection: 'editorial', materials: { totalFiles: 0, references: 0, files: [], colors: [], notes: null, urls: [] }, milestones: { brief: true, materials: false, direction: true, version: false, approved: false, delivery: false }, capabilities: { createVersion: true, approval: false, comparison: false, restore: false, delivery: false }, events: [] }
const versions = [{ versionId: 'internal-version', createdAt: '2026-01-01T00:00:00.000Z', summary: 'Inicial', changeOrigin: { kind: 'commercial', reference: null } }]
const zero = workspaceView(base, [])
assert.equal(zero.state.label, 'En preparación')
assert.equal(zero.actions.preview, false)
const one = { ...base, versionCount: 1, previewAvailable: true, milestones: { ...base.milestones, version: true }, capabilities: { ...base.capabilities, approval: true, restore: true } }
assert.equal(commercialState(one).label, 'Pendiente de revisión')
assert.equal(workspaceView(one, versions, { state: 'pending_review' }).state.nextStep, 'Revisar y aprobar')
assert.equal(workspaceView(one, versions, { state: 'reviewed' }).state.label, 'Revisión registrada')
const approved = workspaceView(one, versions, { state: 'approved' })
assert.equal(approved.state.label, 'Aprobado')
assert.equal(approved.state.nextStep, 'Listo para siguiente etapa')
assert.equal(approved.actions.approve, false)
const rejected = workspaceView(one, versions, { state: 'rejected', decision: 'rejected', reason: 'Corrección narrativa.', snapshotSha256: 'snapshot' })
assert.equal(rejected.state.label, 'Rechazado')
assert.equal(rejected.state.nextStep, 'Corregir versión')
assert.equal(rejected.state.blocker, 'Requiere correcciones')
assert.equal(rejected.progress.find((item) => item.label === 'Versión aprobada')?.done, false)
assert.equal(rejected.progress.find((item) => item.label === 'Correcciones requeridas')?.done, true)
assert.equal(rejected.actions.delivery, false)
const many = { ...one, versionCount: 2, approval: { approved: true, approvedAt: '2026-01-02T00:00:00.000Z', observation: null }, deliveryAvailable: true, delivery: { status: 'delivered_local', deliveredAt: '2026-01-02T00:00:00.000Z' }, milestones: { ...one.milestones, approved: true, delivery: true }, capabilities: { ...one.capabilities, comparison: true, delivery: true }, events: [{ eventId: 'event-000001', sequence: 1, type: 'version_approval_changed', occurredAt: '2026-01-02T00:00:00.000Z', approved: true }] }
const manyView = workspaceView(many, [...versions, { versionId: 'internal-version-2', createdAt: '2026-01-02T00:00:00.000Z', summary: 'Cambio', changeOrigin: { kind: 'commercial', reference: null } }])
assert.equal(manyView.state.label, 'Entrega local disponible')
assert.equal(manyView.actions.delivery, true)
assert.equal(eventLabel(many.events[0]), 'Versión aprobada por el usuario')
assert.equal(manyView.progress.filter((item) => item.done).length, 5)
console.log('PASS jefe-commercial-workspace-smoke: pending/reviewed/approved/rejected/superseded contract')
