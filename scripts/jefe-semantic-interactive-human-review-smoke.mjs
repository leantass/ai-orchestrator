import assert from 'node:assert/strict'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createJefeWebSmokeHarness } from './helpers/jefe-web-smoke-harness.mjs'
const require = createRequire(import.meta.url)
const { launch } = require('../electron/jefe-browser-driver.cjs')
const { createPreviewApprovalService } = require('../electron/jefe-preview-approval.cjs')
const distRoot = path.resolve('dist')

async function openWorkspace(harness) {
  const browser = await launch({}); const page = await browser.page()
  await page.setViewport({ width: 1440, height: 900 }); await page.goto(harness.workspaceUrl)
  await page.waitForFunction("document.title==='JEFE | Orquestador de IA Local' && document.body.innerText.includes('Abrir preview real')")
  await page.waitForFunction("document.body.innerText.includes('Registrar que fue visto')")
  return { browser, page }
}
async function runDecision(decision) {
  const harness = await createJefeWebSmokeHarness({ distRoot }); const service = createPreviewApprovalService({ root: harness.root, reviewerIdentity: 'synthetic-human' }); let browser; let page
  try {
    ({ browser, page } = await openWorkspace(harness)); await page.click('.jefe-review-panel > button'); await page.waitForFunction("document.body.innerText.includes('Revisión registrada') || document.body.innerText.includes('Estado durable: Revisado') || document.body.innerText.includes('Estado durable: Revisión registrada')")
    let current = await service.readApproval(harness.projectId, harness.previewRequestId); assert.equal(current.state, 'reviewed'); const reviewedRevision = current.revision
    await page.goto(harness.workspaceUrl); await page.waitForFunction("document.body.innerText.includes('Registrar que fue visto') || document.body.innerText.includes('Estado durable: Revisado') || document.body.innerText.includes('Estado durable: Revisión registrada')"); current = await service.readApproval(harness.projectId, harness.previewRequestId); assert.equal(current.state, 'reviewed'); assert.equal(current.revision, reviewedRevision)
    if (decision === 'rejected') { await page.type('.jefe-review-panel textarea', 'Revisión sintética: la navegación y la presentación aún necesitan corrección.'); await page.click('.jefe-danger-button'); await page.waitForFunction("document.body.innerText.includes('Rechazo durable registrado')") } else { await page.click('.jefe-review-panel .jefe-primary'); await page.waitForFunction("document.body.innerText.includes('Aprobación durable registrada')") }
    current = await service.readApproval(harness.projectId, harness.previewRequestId); assert.equal(current.state, decision); assert.equal(current.decision, decision); if (decision === 'rejected') assert.equal(current.reason, 'Revisión sintética: la navegación y la presentación aún necesitan corrección.')
    await page.goto(harness.workspaceUrl); await page.waitForFunction(`document.body.innerText.includes('Estado durable: ${decision === 'rejected' ? 'Rechazado' : 'Aprobado'}')`); const refreshed = await service.readApproval(harness.projectId, harness.previewRequestId); assert.equal(refreshed.state, decision)
    return { decision, revision: refreshed.revision, reason: refreshed.reason || null, consoleErrors: page.events.consoleErrors.length, pageErrors: page.events.pageErrors.length }
  } finally { await browser?.close(); await harness.close() }
}
try { const rejected = await runDecision('rejected'); const approved = await runDecision('approved'); console.log(JSON.stringify({ ok: true, SyntheticProjectOnly: true, PendingHumanReview: 'PASS', MarkReviewedByWebUI: 'PASS', ReviewedDurable: 'PASS', RefreshAfterReview: 'PASS', RejectByWebUI: 'PASS', RejectReasonDurable: 'PASS', RejectUTF8: 'PASS', ApproveByWebUI: 'PASS', ApproveDurable: 'PASS', ConsolePageErrors: 'PASS', rejected, approved })) } catch (error) { console.error(error); process.exitCode = 1 }
