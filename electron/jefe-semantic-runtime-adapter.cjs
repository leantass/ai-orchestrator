const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u
function fail(code, message) { throw Object.assign(new Error(message), { code }) }
function safeIdentity(input) {
  if (!input || typeof input !== 'object' || !ID.test(input.projectId || '') || !ID.test(input.sourceVersionId || '')) fail('INVALID_ID', 'La identidad semántica no es válida.')
  if (Object.keys(input).some((key) => !['projectId', 'sourceVersionId', 'idempotencyKey'].includes(key))) fail('INVALID_PAYLOAD', 'El intent semántico sólo admite identidad e idempotencia.')
  return { projectId: input.projectId, sourceVersionId: input.sourceVersionId, ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}) }
}
function safeResult(result) {
  return { ok: Boolean(result?.ok), projectId: result?.projectId || null, sourceVersionId: result?.sourceVersionId || null, executionPackageId: result?.executionPackageId || null, correctionId: result?.correctionId || null, attemptId: result?.attemptId || null, versionId: result?.versionId || result?.newVersionId || null, state: result?.state || null, previewRequestId: result?.previewRequestId || null, error: result?.error ? { code: result.error.code || 'SEMANTIC_RUNTIME_FAILED', message: result.error.message || 'La operación semántica no pudo completarse.' } : undefined }
}
function createSemanticRuntimeAdapter({ service, resolveExecution } = {}) {
  if (!service || typeof service.registerAttempt !== 'function' || typeof service.promoteSemanticCorrectionAttempt !== 'function') fail('MISSING_SEMANTIC_SERVICE', 'Falta el servicio semántico compartido.')
  async function requestSemanticCorrection(input) {
    const identity = safeIdentity(input)
    if (typeof resolveExecution !== 'function') fail('SEMANTIC_RUNTIME_NOT_CONFIGURED', 'El runtime semántico no tiene resolver de ejecución.')
    const resolved = await resolveExecution(identity)
    if (!resolved?.executionPackage || resolved.executionPackage.identity?.projectId !== identity.projectId || resolved.executionPackage.identity?.sourceVersionId !== identity.sourceVersionId) fail('INVALID_SEMANTIC_RUNTIME_RESOLUTION', 'La ejecución no coincide con la identidad solicitada.')
    const attempt = await service.registerAttempt(resolved)
    const promoted = await service.promoteSemanticCorrectionAttempt({ executionPackageId: resolved.executionPackage.executionPackageId, attemptId: attempt.attemptId })
    return safeResult({ ...promoted, projectId: identity.projectId, sourceVersionId: identity.sourceVersionId, executionPackageId: resolved.executionPackage.executionPackageId, attemptId: attempt.attemptId })
  }
  return { requestSemanticCorrection }
}
module.exports = { createSemanticRuntimeAdapter, safeIdentity, safeResult }
