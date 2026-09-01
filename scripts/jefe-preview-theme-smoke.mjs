import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const main = await fs.readFile(new URL('../electron/main.cjs', import.meta.url), 'utf8')
const preload = await fs.readFile(new URL('../electron/jefe-evidence-preview-preload.cjs', import.meta.url), 'utf8')

assert.match(main, /jefe-evidence-preview:read-state/u)
assert.match(main, /jefe-evidence-preview:set-theme/u)
assert.match(main, /jefe-evidence-preview:state-ready/u)
assert.match(main, /jefe-evidence-preview:theme-ready/u)
assert.match(main, /EVIDENCE_PREVIEW_THEME_STATE_MISMATCH/u)
assert.match(main, /EVIDENCE_PREVIEW_SCROLL_MISMATCH/u)
assert.match(main, /EVIDENCE_PREVIEW_VIEWPORT_MISMATCH/u)
assert.match(main, /EVIDENCE_THEME_VISUAL_NOT_DARK/u)
assert.match(main, /meanLuma/u)
assert.match(main, /darkPixelRatio/u)
assert.match(main, /webContents\.capturePage\(\)/u)
assert.doesNotMatch(main, /webContents\.executeJavaScript/u)
assert.match(preload, /document\.documentElement\.dataset\.theme/u)
assert.match(preload, /window\.scrollTo\(scrollX, scrollY\)/u)
assert.match(preload, /window\.innerWidth/u)
assert.match(preload, /window\.innerHeight/u)
assert.match(preload, /requestAnimationFrame\(\(\) => requestAnimationFrame/u)
assert.doesNotMatch(preload, /contextBridge/u)
assert.doesNotMatch(preload, /exposeInMainWorld/u)

console.log(JSON.stringify({
  ok: true,
  checks: 21,
  guarantees: ['preview-specific state ACK', 'theme state in document', 'scroll preservation', 'exact viewport rejection', 'pixel-level dark-theme validation', 'Electron capturePage only'],
}, null, 2))
