import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectCdp, createJefeWebSmokeHarness, launchIsolatedChrome, wait } from './helpers/jefe-web-smoke-harness.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const harness = await createJefeWebSmokeHarness({ distRoot: path.join(repoRoot, 'dist') })
const cases = [[1440, 900], [1280, 820], [1266, 658], [768, 1024], [390, 844]]
const results = {}
try {
  for (const [width, height] of cases) {
    const browser = await launchIsolatedChrome(harness.workspaceUrl, `${width}x${height}`)
    let cdp
    try {
      const page = await browser.pageFor((item) => item.type === 'page' && item.url.includes(`/projects/${harness.projectId}/versions/${harness.versionId}`))
      cdp = await connectCdp(page)
      await cdp.command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
      for (let attempt = 0; attempt < 40; attempt += 1) { if (await cdp.evaluate("document.title === 'JEFE | Orquestador de IA Local' && document.body.innerText.includes('Proyecto Smoke Web')")) break; await wait(150) }
      const data = await cdp.evaluate(`(() => ({ width: innerWidth, height: innerHeight, title: document.title, text: document.body.innerText, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight, controls: document.querySelectorAll('button,input,textarea,select,a').length }))()`)
      assert.equal(data.width, width); assert.equal(data.height, height); assert.equal(data.title, 'JEFE | Orquestador de IA Local'); assert.match(data.text, /Proyecto Smoke Web/u); assert.match(data.text, /version-web-smoke/u); assert.equal(data.horizontal, 0); assert.ok(data.controls >= 8)
      assert.ok(data.vertical >= 0)
      results[`${width}x${height}`] = { vertical: data.vertical, horizontal: data.horizontal, controls: data.controls }
    } finally { cdp?.close(); await browser.close() }
  }
  console.log(JSON.stringify({ ok: true, isolated: true, syntheticProject: harness.projectId, dynamicPort: Number(new URL(harness.baseUrl).port), cases: results }))
} finally { await harness.close() }
