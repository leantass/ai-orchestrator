const fs = require('node:fs')
const path = require('node:path')
const { createCiEvidence, validateCiEvidence, validateRemoteActionAuthorization, validateDeliveryIntegrity } = require('./jefe-release-contract.cjs')
const { createExecutionReceipt, validateExecutionReceipt, sanitizeError } = require('./jefe-release-execution-contract.cjs')
const { createReleasePersistence } = require('./jefe-release-persistence.cjs')

const locks = new Map()
function locked(key, work) { const prior = locks.get(key) || Promise.resolve(); let release; const tail = new Promise((resolve) => { release = resolve }); locks.set(key, tail); return prior.then(work).finally(() => { release(); if (locks.get(key) === tail) locks.delete(key) }) }
function fail(code, message, details = {}) { const error = new Error(message); error.code = code; error.details = details; throw error }
function sameBaseline(request, repo) { return request.repository.repoIdentity === repo.repoIdentity && request.repository.expectedBranch === repo.branch && request.repository.expectedHeadSha === repo.headSha }
function now(clock) { return clock() }

function createReleaseExecutor({ root, persistence, gitAdapter, remoteAdapter, readDelivery, clock = () => new Date().toISOString(), beforeExecute = null, afterExecute = null } = {}) {
  if (!root || !path.isAbsolute(root)) fail('INVALID_ROOT', 'Executor root must be absolute.')
  const store = persistence || createReleasePersistence({ root })
  const receiptsDir = path.join(store.authorityRoot, 'execution-receipts')
  if (!gitAdapter || typeof gitAdapter.readRepository !== 'function') fail('GIT_ADAPTER_REQUIRED', 'A Git adapter is required.')
  remoteAdapter = remoteAdapter || { triggerCi: async () => fail('REMOTE_ADAPTER_NOT_CONNECTED', 'Remote adapter is not connected.') }
  readDelivery = typeof readDelivery === 'function' ? readDelivery : async () => null
  async function readReceipt(outboxId) { try { return validateExecutionReceipt(JSON.parse(await fs.promises.readFile(path.join(receiptsDir, `${outboxId}.json`), 'utf8'))) } catch (error) { if (error.code === 'ENOENT') return null; throw error } }
  async function writeReceipt(receipt) { await fs.promises.mkdir(receiptsDir, { recursive: true }); const target = path.join(receiptsDir, `${receipt.outboxId}.json`); const stage = `${target}.${process.pid}.${Date.now()}.stage`; try { await fs.promises.writeFile(stage, `${JSON.stringify(receipt)}\n`, 'utf8'); await fs.promises.rename(stage, target); return receipt } finally { await fs.promises.rm(stage, { force: true }).catch(() => {}) } }
  async function filesFor(request) { const delivery = await readDelivery(request.identity.projectId, request.identity.versionId); if (!delivery) fail('DELIVERY_REQUIRED', 'Delivery evidence is required for Git execution.'); validateDeliveryIntegrity(delivery); return delivery.manifest.files }
  async function reconcileStarted(receipt, request, outbox) {
    if (receipt.action !== 'git_commit' || typeof gitAdapter.findCommit !== 'function') return null
    const found = await gitAdapter.findCommit({ request, expectedFiles: (await filesFor(request)).map((item) => item.relativePath) })
    if (!found) return null
    const done = createExecutionReceipt({ outboxId: outbox.outboxId, releaseFlowId: outbox.releaseFlowId, requestId: request.requestId, action: receipt.action, repository: { repoIdentity: receipt.repository }, branch: receipt.boundBranch, headSha: found.commitSha, status: 'succeeded', startedAt: receipt.startedAt, completedAt: now(clock), result: found })
    return writeReceipt(done)
  }
  async function execute(outboxId) {
    return locked(outboxId, async () => {
      const outbox = await store.readOutbox(outboxId); if (!outbox) fail('OUTBOX_NOT_FOUND', 'Outbox intent was not found.')
      const request = await store.readRequest(outbox.requestId); const flow = await store.readFlow(outbox.releaseFlowId); const authorization = await store.readAuthorization(outbox.authorizationId)
      if (!request || !flow || !authorization || flow.requestId !== request.requestId || !flow.outboxRefs.includes(outbox.outboxId)) fail('EXECUTION_BINDING_INVALID', 'Execution bindings are incomplete.')
      validateRemoteActionAuthorization(authorization, { requestId: request.requestId, action: outbox.action })
      const prior = await readReceipt(outboxId)
      if (prior?.status === 'succeeded' || prior?.status === 'not_connected') return { receipt: prior, idempotent: true }
      if (prior?.status === 'started') { const reconciled = await reconcileStarted(prior, request, outbox); if (reconciled) return { receipt: reconciled, reconciled: true }; if (outbox.action === 'git_commit' && typeof gitAdapter.findCommit !== 'function') { const uncertain = createExecutionReceipt({ outboxId, releaseFlowId: outbox.releaseFlowId, requestId: request.requestId, action: outbox.action, repository: { repoIdentity: request.repository.repoIdentity }, branch: request.repository.expectedBranch, headSha: request.repository.expectedHeadSha, status: 'execution_uncertain', startedAt: prior.startedAt, result: null, error: { code: 'BLOCKED_EXECUTION_UNCERTAIN', message: 'The prior Git mutation cannot be reconciled.' } }); return { receipt: await writeReceipt(uncertain) } } }
      const repo = await gitAdapter.readRepository(); if (!sameBaseline(request, repo)) fail('REPOSITORY_BASELINE_CHANGED', 'Repository baseline changed before execution.')
      const started = prior || createExecutionReceipt({ outboxId, releaseFlowId: outbox.releaseFlowId, requestId: request.requestId, action: outbox.action, repository: { repoIdentity: request.repository.repoIdentity }, branch: request.repository.expectedBranch, headSha: request.repository.expectedHeadSha, startedAt: now(clock) })
      await writeReceipt(started)
      if (beforeExecute) await beforeExecute({ outbox, request })
      try {
        let result
        if (outbox.action === 'git_commit') result = await gitAdapter.commit({ request, files: await filesFor(request) })
        else if (outbox.action === 'git_push') result = await gitAdapter.push({ branch: request.repository.expectedBranch, expectedHeadSha: request.repository.expectedHeadSha })
        else if (outbox.action === 'release_tag') result = await gitAdapter.tag({ tag: `release-${request.identity.versionId}`, commitSha: request.repository.expectedHeadSha, message: `release ${request.identity.projectId}/${request.identity.versionId}` })
        else if (outbox.action === 'trigger_ci') result = await remoteAdapter.triggerCi({ repository: request.repository.repoIdentity, workflow: 'ci.yml', commitSha: request.repository.expectedHeadSha })
        else result = await Promise.reject(Object.assign(new Error('Remote action adapter is not connected.'), { code: 'REMOTE_ADAPTER_NOT_CONNECTED' }))
        if (afterExecute) await afterExecute({ outbox, request, result })
        const terminalStatus = outbox.action === 'trigger_ci' && result?.status === 'not_connected' ? 'not_connected' : 'succeeded'
        const done = createExecutionReceipt({ outboxId, releaseFlowId: outbox.releaseFlowId, requestId: request.requestId, action: outbox.action, repository: { repoIdentity: request.repository.repoIdentity }, branch: request.repository.expectedBranch, headSha: request.repository.expectedHeadSha, status: terminalStatus, startedAt: started.startedAt, completedAt: now(clock), result })
        return { receipt: await writeReceipt(done) }
      } catch (error) {
        if (error.code === 'SIMULATED_CRASH_AFTER_EXECUTION') throw error
        const terminal = error.code === 'REMOTE_ADAPTER_NOT_CONNECTED' ? 'not_connected' : 'failed'
        const done = createExecutionReceipt({ outboxId, releaseFlowId: outbox.releaseFlowId, requestId: request.requestId, action: outbox.action, repository: { repoIdentity: request.repository.repoIdentity }, branch: request.repository.expectedBranch, headSha: request.repository.expectedHeadSha, status: terminal, startedAt: started.startedAt, completedAt: now(clock), error: sanitizeError(error) })
        await writeReceipt(done); if (terminal === 'not_connected') return { receipt: done }; throw error
      }
    })
  }
  async function ingestCiEvidence({ adapter, expectedRepository, expectedCommitSha, expectedWorkflow = 'ci.yml' } = {}) {
    if (!adapter || typeof adapter.fetchCiEvidence !== 'function') fail('REMOTE_ADAPTER_NOT_CONNECTED', 'A trusted CI evidence adapter is required.')
    const raw = await adapter.fetchCiEvidence({ repository: expectedRepository, commitSha: expectedCommitSha, workflow: expectedWorkflow })
    if (!raw || raw.provenance !== 'trusted-adapter') fail('UNTRUSTED_CI_EVIDENCE', 'CI evidence must come from a trusted adapter.')
    const evidence = createCiEvidence({ ...raw, evidenceSource: `trusted-adapter:${raw.adapterId || 'unknown'}` })
    if (evidence.status === 'passed' && (evidence.provider !== 'github-actions' || evidence.commitSha !== expectedCommitSha || evidence.workflow !== expectedWorkflow)) fail('CI_EVIDENCE_MISMATCH', 'CI evidence does not match the expected remote run.')
    return validateCiEvidence(evidence)
  }
  return Object.freeze({ execute, readReceipt, ingestCiEvidence, receiptsDir })
}
module.exports = { createReleaseExecutor }
