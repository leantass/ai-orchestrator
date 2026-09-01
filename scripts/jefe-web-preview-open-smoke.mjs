import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectCdp, createJefeWebSmokeHarness, launchIsolatedChrome, wait } from './helpers/jefe-web-smoke-harness.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const harness = await createJefeWebSmokeHarness({ distRoot: path.join(repoRoot, 'dist') })
const browser = await launchIsolatedChrome(harness.workspaceUrl, 'preview-open')
let cdp
try {
  const page = await browser.pageFor((item) => item.type === 'page' && item.url.includes(`/projects/${harness.projectId}/versions/${harness.versionId}`))
  cdp = await connectCdp(page)
  for (let attempt = 0; attempt < 40; attempt += 1) { if (await cdp.evaluate("document.title === 'JEFE | Orquestador de IA Local' && document.body.innerText.includes('Proyecto Smoke Web')")) break; await wait(150) }
  const before = await cdp.evaluate(`(() => ({ title: document.title, text: document.body.innerText, tabs: [...document.querySelectorAll('button')].filter((item) => item.innerText.includes('Abrir preview real')).length }))()`)
  assert.equal(before.title, 'JEFE | Orquestador de IA Local'); assert.match(before.text, /Proyecto Smoke Web/u); assert.equal(before.tabs, 1)
  const opened = await cdp.evaluate(`(async () => { const calls = []; const original = window.open; window.open = (url) => { calls.push(String(url)); return {}; }; const button = [...document.querySelectorAll('button')].find((item) => item.innerText.includes('Abrir preview real')); button?.click(); await new Promise((resolve) => setTimeout(resolve, 1200)); window.open = original; return { calls, fallback: Boolean(document.querySelector('.jefe-preview-fallback')), approval: document.body.innerText.includes('Aprobar preview') }; })()`)
  assert.equal(opened.calls.length, 1); assert.match(opened.calls[0], /^http:\/\/127\.0\.0\.1:\d+\/app\/index\.html$/u); assert.doesNotMatch(opened.calls[0], /about:blank|file:/u); assert.equal(opened.fallback, false); assert.equal(opened.approval, true)
  const previewResponse = await fetch(opened.calls[0]); assert.equal(previewResponse.status, 200); const previewHtml = await previewResponse.text(); assert.match(previewHtml, /Proyecto Smoke Web/u)
  console.log(JSON.stringify({ ok: true, isolated: true, syntheticProject: harness.projectId, previewHttp: 'PASS', popupUrl: opened.calls[0], blankTabCreated: false, noFileUrl: true, noClientProjectDependency: true }))
} finally { cdp?.close(); await browser.close(); await harness.close() }
