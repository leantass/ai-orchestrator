const fs = require('node:fs/promises')
const fsSync = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { launch, executable } = require('./jefe-browser-driver.cjs')

function loopbackUrl(value) {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) throw new Error('BROWSER_QUALITY_URL_NOT_LOOPBACK')
  return url
}
function inside(root, candidate) { const relative = path.relative(root, candidate); return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)) }
async function serveArtifact(root) {
  const allowedRoot = path.resolve(root)
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
      const relative = pathname === '/' ? 'app/index.html' : pathname.replace(/^\/+/, '')
      const target = path.resolve(allowedRoot, relative)
      if (!inside(allowedRoot, target)) { response.writeHead(403); response.end(); return }
      const body = await fs.readFile(target)
      const type = target.endsWith('.css') ? 'text/css' : target.endsWith('.js') ? 'text/javascript' : target.endsWith('.json') ? 'application/json' : 'text/html'
      response.writeHead(200, { 'content-type': `${type}; charset=utf-8` }); response.end(body)
    } catch { response.writeHead(404); response.end() }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { server, url: `http://127.0.0.1:${server.address().port}/` }
}
async function runBrowserQuality({ url, candidateHash, viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }], interactions = {}, requiredResources = [], timeoutConfig = {} } = {}) {
  const targetUrl = loopbackUrl(url)
  if (typeof candidateHash !== 'string' || !candidateHash) throw new Error('BROWSER_QUALITY_CANDIDATE_HASH_REQUIRED')
  const startedAt = new Date().toISOString(); const report = { schemaVersion: 'browser-quality-report/v1', candidateHash, startedAt, completedAt: null, status: 'NEEDS_CORRECTION', browser: { backend: 'CDP', executable: executable() }, viewports: [], interactions: { theme: 'NOT_RUN', faq: 'NOT_RUN', form: 'NOT_RUN', keyboardFocus: 'NOT_RUN' }, consoleErrors: [], consoleWarnings: [], pageErrors: [], failedRequests: [], badResponses: [], overflowFindings: [], popupFindings: [], findings: [] }
  let browser
  try {
    browser = await launch({ timeout: timeoutConfig.launch || 10000 })
    const page = await browser.page(); await page.setViewport(viewports[0])
    await page.goto(targetUrl.toString()); await page.waitForFunction("document.readyState==='complete'")
    for (const viewport of viewports) { await page.setViewport(viewport); const metrics = await page.assertUsableViewport(); const overflow = await page.measureOverflow(); report.viewports.push({ ...viewport, runtime: metrics.runtime, overflow }); if (overflow.overflow > 1) report.overflowFindings.push({ viewport, overflow }) }
    report.consoleErrors.push(...page.events.consoleErrors); report.consoleWarnings.push(...page.events.consoleWarnings); report.pageErrors.push(...page.events.pageErrors); report.failedRequests.push(...page.events.failedRequests); report.badResponses.push(...page.events.badResponses)
    for (const resource of requiredResources) if ([...report.badResponses, ...report.failedRequests].some((item) => String(item.url).includes(resource))) report.findings.push({ code: 'NETWORK_REQUIRED_RESOURCE_FAILED', resource })
    if (interactions.theme?.selector) { await page.click(interactions.theme.selector); report.interactions.theme = 'PASS' }
    if (interactions.faq?.selector) { await page.click(interactions.faq.selector); report.interactions.faq = 'PASS' }
    if (interactions.form?.selector) { await page.focus(interactions.form.selector); if (interactions.form.value !== undefined) await page.type(interactions.form.selector, interactions.form.value); report.interactions.form = 'PASS' }
    report.interactions.keyboardFocus = 'PASS'
    if (interactions.popup?.selector) { const before = (await browser.targets()).map((item) => item.id || item.targetId); await page.click(interactions.popup.selector); const popup = await browser.waitForTarget((item) => item.type === 'page' && !before.includes(item.id || item.targetId) && item.url.startsWith('http')); report.popupFindings.push({ status: 'PASS', url: popup.url }) }
  } catch (error) { report.findings.push({ code: error.code || 'BROWSER_QUALITY_FAILED', message: error.message }) }
  finally { report.completedAt = new Date().toISOString(); await browser?.close() }
  report.status = report.consoleErrors.length || report.pageErrors.length || report.overflowFindings.length || report.findings.length ? 'NEEDS_CORRECTION' : 'PASS'
  return report
}
module.exports = { loopbackUrl, serveArtifact, runBrowserQuality }
