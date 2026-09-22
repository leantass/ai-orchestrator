import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { compareGeneratedContent } = require('../electron/jefe-product-planning.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-content-drift-'))
const source = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'content-drift', runId: 'run-v0001', versionId: 'version-v0001', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Contenido estable', brief: 'Servicios concretos para equipos.', businessType: 'servicio digital', audience: 'equipos', proposition: 'Una propuesta clara.', brandSpec: { name: 'Contenido estable' } })
assert.equal(source.ok, true)
const planning = source.project.planning
const cHeroTitle = planning.content.hero.title
const entity = (value) => String(value).replaceAll('&', '&amp;').replace(/[^\u0000-\u007F]/gu, (character) => `&#${character.codePointAt(0)};`)
const render = (mutate = (value) => value) => {
  const c = planning.content
  const chunks = [c.hero.title, c.hero.description, ...c.services.flatMap((item) => [item.title, item.description]), ...c.trustItems.flatMap((item) => [item.title, item.description]), ...c.faq.flatMap((item) => [item.question, item.answer]), c.ctas[0]]
  return `<main>${chunks.map((item) => `<p>${entity(mutate(item))}</p>`).join('')}</main>`
}

const equivalent = compareGeneratedContent(planning, render((value) => `  ${value.replaceAll(' ', '   ')}  `))
assert.equal(equivalent.pass, true)
assert.equal(equivalent.driftSlots.length, 0)

const changedHero = compareGeneratedContent(planning, render((value) => value === cHeroTitle ? value.replace('propuesta', 'promesa') : value))
assert.equal(changedHero.pass, false)
assert.ok(changedHero.driftSlots.some((item) => item.slot === 'hero.title'))

const omittedService = compareGeneratedContent(planning, render((value) => value === planning.content.services[2].description ? '' : value))
assert.equal(omittedService.pass, false)
assert.ok(omittedService.driftSlots.some((item) => item.slot === 'services[2].description'))

const changedFaq = compareGeneratedContent(planning, render((value) => value === planning.content.faq[1].answer ? 'Respuesta distinta.' : value))
assert.equal(changedFaq.pass, false)
assert.ok(changedFaq.driftSlots.some((item) => item.slot === 'faq[1].answer'))

const changedCta = compareGeneratedContent(planning, render((value) => value === planning.content.ctas[0] ? 'Otra acción.' : value))
assert.equal(changedCta.pass, false)
assert.ok(changedCta.driftSlots.some((item) => item.slot === 'cta.label'))

const catalog = [
  { id: 'inicio-principal', role: 'hero', kind: 'hero', contentRef: 'hero', required: true },
  { id: 'oferta-opcional', role: 'services', kind: 'service-catalog', contentRef: 'services', required: false },
  { id: 'prueba-opcional', role: 'trust', kind: 'proof', contentRef: 'trust', required: false },
  { id: 'dudas', role: 'faq', kind: 'faq', contentRef: 'faq', required: false },
  { id: 'accion-final', role: 'contact', kind: 'conversion-form', contentRef: 'contact', required: true },
]
const selective = structuredClone(planning)
selective.content.sections = catalog
selective.experience.sections = ['inicio-principal', 'dudas', 'accion-final']
const selectiveHtml = `<main><h1>${entity(planning.content.hero.title)}</h1><p>${entity(planning.content.hero.description)}</p><section id="dudas">${planning.content.faq.map((item) => `<details><summary>${entity(item.question)}</summary><p>${entity(item.answer)}</p></details>`).join('')}</section><section id="accion-final"><button>${entity(planning.content.ctas[0])}</button></section></main>`
const omittedOptional = compareGeneratedContent(selective, selectiveHtml)
assert.equal(omittedOptional.pass, true)
assert.deepEqual(omittedOptional.activeContentRefs, ['hero', 'faq', 'contact'])
assert.deepEqual(omittedOptional.requiredContentRefs, ['hero', 'contact'])
assert.deepEqual(omittedOptional.omittedOptionalContentRefs, ['services', 'trust'])
const includedTrust = structuredClone(selective)
includedTrust.experience.sections = ['inicio-principal', 'prueba-opcional', 'dudas', 'accion-final']
const trustDrift = compareGeneratedContent(includedTrust, selectiveHtml)
assert.equal(trustDrift.pass, false)
assert.ok(trustDrift.driftSlots.some((item) => item.slot === 'trust[0]' && item.renderedPresent === false))
const includedServices = structuredClone(selective)
includedServices.experience.sections = ['inicio-principal', 'oferta-opcional', 'dudas', 'accion-final']
const servicesDrift = compareGeneratedContent(includedServices, selectiveHtml)
assert.equal(servicesDrift.pass, false)
assert.ok(servicesDrift.driftSlots.some((item) => item.slot === 'services[0].title' && item.renderedPresent === false))

await fs.rm(root, { recursive: true, force: true })
console.log('PASS jefe-generated-artifact-content-drift-smoke: HTML entities/whitespace normalized; hero, service, FAQ and CTA semantic drift reported by exact slot')
