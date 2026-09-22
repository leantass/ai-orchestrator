import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { validateGeneratedArtifact, resolveArtifactContentSelection } = require('../electron/jefe-product-planning.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-active-artifact-'))
const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'active-artifact', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Contenido activo', brief: 'Servicios concretos para equipos.', businessType: 'servicio digital', audience: 'equipos', proposition: 'Una propuesta clara.', brandSpec: { name: 'Contenido activo' } })
assert.equal(source.ok, true)

const catalog = [
  { id: 'inicio-principal', role: 'hero', kind: 'hero', contentRef: 'hero', required: true },
  { id: 'oferta-opcional', role: 'services', kind: 'service-catalog', contentRef: 'services', required: false },
  { id: 'prueba-confianza', role: 'trust', kind: 'proof', contentRef: 'trust', required: false },
  { id: 'dudas-clientes', role: 'faq', kind: 'faq', contentRef: 'faq', required: false },
  { id: 'accion-final', role: 'contact', kind: 'conversion-form', contentRef: 'contact', required: true },
]
const base = structuredClone(source.project.planning)
base.content.sections = catalog
base.build.sectionContracts = catalog.map((item) => ({ id: item.id, component: item.kind, source: `ExperiencePlan.sections.${item.id}` }))

const entity = (value) => String(value).replaceAll('&', '&amp;').replace(/[<>"']/gu, (character) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
const css = `${Object.values(base.visual.palette).join(' ')} a{text-decoration:none}input{border:1px}button{appearance:none}:focus-visible{outline:1px}[data-theme="dark"]{}@media (max-width:1px){ }position:sticky;scroll-margin-top:96px;`
const js = 'document.body.dataset.ready="true";'
function artifact(planning, omittedRefs = [], emptyRefs = []) {
  const omitted = new Set(omittedRefs)
  const empty = new Set(emptyRefs)
  const sections = planning.experience.sections.map((id) => {
    const item = catalog.find((entry) => entry.id === id)
    if (!item || omitted.has(item.contentRef)) return ''
    if (item.contentRef === 'hero') return `<section id="${id}"><h1>${entity(planning.content.title)}</h1><p>${entity(planning.content.subtitle)}</p></section>`
    if (item.contentRef === 'services') return `<section id="${id}"><h2>Servicios</h2>${empty.has('services') ? '' : planning.content.benefits.map((value) => `<p>${entity(value)}</p>`).join('')}</section>`
    if (item.contentRef === 'trust') return `<section id="${id}" class="trust-grid">${(planning.content.trustItems || planning.content.trust).map((value) => `<p>${entity(typeof value === 'string' ? value : value.description)}</p>`).join('')}</section>`
    if (item.contentRef === 'faq') return `<section id="${id}"><h2>Preguntas</h2>${planning.content.faq.map((value) => `<details><summary>${entity(value.question)}</summary><p>${entity(value.answer)}</p></details>`).join('')}</section>`
    if (item.contentRef === 'contact') return `<section id="${id}"><button>${entity(planning.content.ctas[0])}</button></section>`
    return ''
  }).join('')
  return { html: `<main>${sections}</main>`, css, js }
}
function planningWith(sections) {
  const planning = structuredClone(base)
  planning.experience.sections = sections
  return planning
}
function assertCode(fn, code) {
  assert.throws(fn, (error) => error?.code === code)
}

const heroContact = planningWith(['inicio-principal', 'accion-final'])
const selection = resolveArtifactContentSelection(heroContact)
assert.deepEqual(selection.activeContentRefs, ['hero', 'contact'])
assert.deepEqual(selection.requiredContentRefs, ['hero', 'contact'])
assert.deepEqual(selection.omittedOptionalContentRefs, ['services', 'trust', 'faq'])
const badOptional = structuredClone(heroContact)
badOptional.content.benefits = ['placeholder...']
badOptional.content.trust = ['Mismo texto.', 'Mismo texto.']
badOptional.content.faq = badOptional.content.faq.map((item) => ({ ...item, answer: '...' }))
assert.deepEqual(validateGeneratedArtifact(badOptional, artifact(badOptional)), { ok: true, sections: 2, traceability: base.build.traceability.length })

const faqActive = planningWith(['inicio-principal', 'dudas-clientes', 'accion-final'])
assertCode(() => validateGeneratedArtifact(faqActive, artifact(faqActive, ['faq'])), 'GENERATED_ARTIFACT_MISSING_FAQ')
assertCode(() => validateGeneratedArtifact(planningWith(['inicio-principal', 'prueba-confianza', 'accion-final']), artifact(planningWith(['inicio-principal', 'prueba-confianza', 'accion-final']), ['trust'])), 'GENERATED_ARTIFACT_MISSING_TRUST')
assert.deepEqual(validateGeneratedArtifact(faqActive, artifact(faqActive)), { ok: true, sections: 3, traceability: base.build.traceability.length })
const trustActive = planningWith(['inicio-principal', 'prueba-confianza', 'accion-final'])
assert.deepEqual(validateGeneratedArtifact(trustActive, artifact(trustActive)), { ok: true, sections: 3, traceability: base.build.traceability.length })

const serviceActive = planningWith(['inicio-principal', 'oferta-opcional', 'accion-final'])
assertCode(() => validateGeneratedArtifact(serviceActive, artifact(serviceActive, [], ['services'])), 'GENERATED_ARTIFACT_CONTENT_DRIFT')
const dynamicFaq = resolveArtifactContentSelection(faqActive)
assert.deepEqual(dynamicFaq.sectionIdsFor('faq'), ['dudas-clientes'])

await fs.rm(root, { recursive: true, force: true })
console.log('PASS jefe-active-content-artifact-validation-smoke: optional omissions are out of artifact gates; active FAQ/trust presence, dynamic IDs and active fidelity remain enforced')
