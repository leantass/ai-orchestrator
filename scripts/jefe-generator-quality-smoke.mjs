import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { assessArtifact, contrastRatio } = require('../electron/jefe-generator-quality.cjs')

const healthyCss = ':root{--pageBackground:#FFF8EA;--surface:#FFF8EA;--surfaceInverse:#102A43;--textPrimary:#102A43;--textSecondary:#102A43;--textOnInverse:#FFF8EA;--border:#102A43;--inputBackground:#FFF8EA;--inputBorder:#102A43;--inputText:#102A43;--inputPlaceholder:#102A43;--focusRing:#102A43;--accent:#62D6B4;--buttonBackground:#62D6B4;--buttonText:#102A43}[data-theme="dark"]{--pageBackground:#0B1F33;--surface:#0B1F33;--surfaceInverse:#102A43;--textPrimary:#FFF8EA;--textSecondary:#FFF8EA;--textOnInverse:#FFF8EA;--border:#FFF8EA;--inputBackground:#102A43;--inputBorder:#FFF8EA;--inputText:#FFF8EA;--inputPlaceholder:#FFF8EA;--focusRing:#FFF8EA;--accent:#62D6B4;--buttonBackground:#62D6B4;--buttonText:#102A43}:focus-visible{outline:3px solid var(--focusRing)}@media(max-width:700px){body{padding:1px}}'
const base = { html: '<!doctype html><html><body><button>Acción</button></body></html>', js: 'document.body.dataset.ready="true"' }
const cases = [
  ['dark-on-dark', healthyCss.replace('--textPrimary:#102A43', '--textPrimary:#102A43').replace('--pageBackground:#FFF8EA', '--pageBackground:#102A43').replace('--surface:#FFF8EA', '--surface:#102A43'), 'NEEDS_CORRECTION'],
  ['light-on-light', healthyCss.replace('--textPrimary:#102A43', '--textPrimary:#FFF8EA').replace('--pageBackground:#FFF8EA', '--pageBackground:#FFF8EA'), 'NEEDS_CORRECTION'],
  ['invisible-input', healthyCss.replace('--inputText:#102A43', '--inputText:#FFF8EA').replace('--inputBackground:#FFF8EA', '--inputBackground:#FFF8EA'), 'NEEDS_CORRECTION'],
  ['low-contrast-button', healthyCss.replace('--buttonText:#102A43', '--buttonText:#FFF8EA').replace('--buttonBackground:#62D6B4', '--buttonBackground:#FFF8EA'), 'NEEDS_CORRECTION'],
  ['visible-content-focus-invisible', healthyCss.replace('--focusRing:#102A43', '--focusRing:#FFF8EA'), 'NEEDS_CORRECTION'],
  ['healthy', healthyCss, 'PASS'],
]
for (const [name, css, expected] of cases) { const report = assessArtifact({ ...base, css }); assert.equal(report.overallStatus, expected, `${name}: ${JSON.stringify(report.findings)}`) }
assert.equal(contrastRatio('#102A43', '#FFF8EA') >= 4.5, true)

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-generator-quality-'))
try {
  const result = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'quality-foundation', runId: 'quality-foundation-run', versionId: 'quality-foundation-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Estudio Norte', brief: 'Presentar servicios digitales para equipos que necesitan ordenar su operación.', businessType: 'estudio digital', audience: 'equipos de producto', proposition: 'Una propuesta clara para trabajar mejor.', primaryCta: 'Conversar sobre el proyecto', brandSpec: { name: 'Estudio Norte' } })
  assert.equal(result.ok, true, JSON.stringify(result.error))
  const css = await fs.readFile(path.join(result.artifacts.projectRoot, 'app/styles.css'), 'utf8')
  const html = await fs.readFile(path.join(result.artifacts.projectRoot, 'app/index.html'), 'utf8')
  const js = await fs.readFile(path.join(result.artifacts.projectRoot, 'app/app.js'), 'utf8')
  assert.equal(assessArtifact({ html, css, js }).overallStatus, 'PASS')
  assert.match(html, /<h3>/u)
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-generator-quality', negativeCases: cases.filter(([, , expected]) => expected !== 'PASS').length, healthyCases: cases.filter(([, , expected]) => expected === 'PASS').length, generated: result.artifacts.projectRoot, contrast: contrastRatio('#102A43', '#FFF8EA') }, null, 2))
} finally { await fs.rm(root, { recursive: true, force: true }) }
