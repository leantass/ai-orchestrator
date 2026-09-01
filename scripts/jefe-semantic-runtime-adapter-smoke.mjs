import assert from 'node:assert/strict'
import runtimeAdapter from '../electron/jefe-semantic-runtime-adapter.cjs'
const { createSemanticRuntimeAdapter, safeIdentity } = runtimeAdapter

let coreCalls = 0
const service = {
  async registerAttempt(input) { coreCalls += 1; assert.equal(input.executionPackage.identity.projectId, 'runtime-bike'); return { attemptId: 'attempt-runtime' } },
  async promoteSemanticCorrectionAttempt(input) { coreCalls += 1; return { ok: true, projectId: 'runtime-bike', versionId: 'version-v0002', state: 'pending_review', previewRequestId: 'preview-runtime' } },
}
const resolveExecution = async ({ projectId, sourceVersionId }) => ({ executionPackage: { executionPackageId: 'semantic-execution-runtime', identity: { projectId, sourceVersionId } }, sourceManifestPath: 'internal-only', candidateRoot: 'internal-only' })
const adapter = createSemanticRuntimeAdapter({ service, resolveExecution })
const unconfigured = createSemanticRuntimeAdapter({ service })
await assert.rejects(() => unconfigured.requestSemanticCorrection({ projectId: 'runtime-bike', sourceVersionId: 'version-v0001' }), { code: 'SEMANTIC_RUNTIME_NOT_CONFIGURED' })
const web = await adapter.requestSemanticCorrection({ projectId: 'runtime-bike', sourceVersionId: 'version-v0001' })
const electron = await adapter.requestSemanticCorrection({ projectId: 'runtime-bike', sourceVersionId: 'version-v0001', idempotencyKey: 'runtime-repeat' })
assert.equal(web.state, 'pending_review'); assert.equal(electron.versionId, 'version-v0002'); assert.equal(coreCalls, 4)
assert.throws(() => safeIdentity({ projectId: 'runtime-bike', sourceVersionId: 'version-v0001', candidatePath: 'forbidden' }), { code: 'INVALID_PAYLOAD' })
assert.throws(() => safeIdentity({ projectId: 'runtime-bike', sourceVersionId: '../outside' }), { code: 'INVALID_ID' })
console.log('PASS jefe-semantic-runtime-adapter-smoke: Web/Electron adapter use same shared service; IDs-only boundary; path/raw payload negatives')
