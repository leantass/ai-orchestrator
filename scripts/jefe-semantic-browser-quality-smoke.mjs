import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { browserQA } = require('../electron/jefe-semantic-production-promotion.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-browser-quality-'))
const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'browser-quality', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Browser dinámico', brief: 'Sitio comercial ficticio.', businessType: 'servicios', audience: 'equipos', proposition: 'Una propuesta clara.', brandSpec: { name: 'Browser dinámico' } })
assert.equal(source.ok, true)

const catalog = [
  { id: 'inicio-principal', role: 'hero', kind: 'hero', contentRef: 'value-prop', required: true },
  { id: 'oferta-profesional', role: 'overview', kind: 'services', contentRef: 'packages-overview', required: false },
  { id: 'prueba-confianza', role: 'evidence', kind: 'proof', contentRef: 'trust-drivers', required: false },
  { id: 'dudas-clientes', role: 'faq', kind: 'faq', contentRef: 'faq-content', required: false },
  { id: 'accion-final', role: 'contact', kind: 'conversion-form', contentRef: 'conversion-action', required: true },
]
const base = structuredClone(source.project.planning)
base.content.sections = catalog
const htmlFor = (sections, extra = '') => `<!doctype html><html><head><link rel="stylesheet" href="/app/styles.css"></head><body><header>Header</header><main>${sections.map((id) => `<section id="${id}"><h1>${id}</h1>${id === 'dudas-clientes' ? '<details><summary>Pregunta?</summary><p>Respuesta.</p></details>' : ''}</section>`).join('')}</main>${extra}<script src="/app/app.js"></script></body></html>`
const css = 'body{margin:0}section{min-height:20px}button{appearance:none}'
const writeCandidate = async (planning, sections, extraHtml = '', js = 'document.body.dataset.ready="true";', cssValue = css) => {
  const candidate = path.join(root, `${Math.random().toString(36).slice(2)}`)
  await fs.mkdir(path.join(candidate, 'app'), { recursive: true })
  await fs.writeFile(path.join(candidate, 'app', 'index.html'), htmlFor(sections, extraHtml), 'utf8')
  await fs.writeFile(path.join(candidate, 'app', 'styles.css'), cssValue, 'utf8')
  await fs.writeFile(path.join(candidate, 'app', 'app.js'), js, 'utf8')
  return { candidate, planning, report: await browserQA(candidate, planning) }
}
const optional = structuredClone(base)
optional.experience.sections = ['inicio-principal', 'accion-final']
const optionalResult = await writeCandidate(optional, optional.experience.sections)
assert.equal(optionalResult.report.status, 'PASS')
assert.equal(optionalResult.report.checks.services, 'NOT_APPLICABLE')
assert.equal(optionalResult.report.checks.trust, 'NOT_APPLICABLE')
assert.equal(optionalResult.report.checks.faq, 'NOT_APPLICABLE')

const active = structuredClone(base)
active.experience.sections = catalog.map((item) => item.id)
const activeResult = await writeCandidate(active, active.experience.sections)
assert.equal(activeResult.report.status, 'PASS')
assert.equal(activeResult.report.checks.hero, true)
assert.equal(activeResult.report.checks.faq, true)

const missingFaq = await writeCandidate(active, active.experience.sections.filter((id) => id !== 'dudas-clientes'))
assert.equal(missingFaq.report.status, 'NEEDS_CORRECTION')
assert.equal(missingFaq.report.checks.faq, false)

const requiredTrust = structuredClone(active)
requiredTrust.content.sections = catalog.map((item) => item.id === 'prueba-confianza' ? { ...item, required: true } : item)
requiredTrust.experience.sections = ['inicio-principal', 'accion-final']
const missingRequiredTrust = await writeCandidate(requiredTrust, requiredTrust.experience.sections)
assert.equal(missingRequiredTrust.report.status, 'NEEDS_CORRECTION')
assert.equal(missingRequiredTrust.report.checks.trust, false)

const consoleError = await writeCandidate(active, active.experience.sections, '', 'console.error("browser smoke");')
assert.equal(consoleError.report.status, 'NEEDS_CORRECTION')
assert.ok(consoleError.report.consoleErrors.length > 0)

const failedResource = await writeCandidate(active, active.experience.sections, '<img src="http://127.0.0.1:1/missing.png">')
assert.equal(failedResource.report.status, 'NEEDS_CORRECTION')
assert.ok(failedResource.report.failedRequests.length > 0 || failedResource.report.badResponses.length > 0)

const overflow = await writeCandidate(active, active.experience.sections, '', 'document.body.dataset.ready="true";', 'body{width:2000px}')
assert.equal(overflow.report.status, 'NEEDS_CORRECTION')
assert.ok(overflow.report.overflowFindings.length > 0)

await fs.rm(root, { recursive: true, force: true })
console.log('PASS jefe-semantic-browser-quality-smoke: dynamic catalog presence, optional NOT_APPLICABLE, required/active failures, console errors, failed resources and overflow')
