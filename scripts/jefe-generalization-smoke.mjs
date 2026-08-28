import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { validateProductPlanning, validateGeneratedArtifact } = require('../electron/jefe-product-planning.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-generalization-'))
const cases = [
  { id: 'services-case', type: 'agency_site', direction: 'editorial', name: 'Estudio Norte', brief: 'Presentar servicios de estrategia de marca para equipos que necesitan ordenar su identidad.', businessType: 'estudio de estrategia', audience: 'equipos de producto', proposition: 'Una identidad clara para marcas que están creciendo.', cta: 'Conversar sobre la marca' },
  { id: 'catalog-case', type: 'generic_web_app', direction: 'comercial', name: 'Mercado Raíz', brief: 'Crear un catálogo digital de alimentos regionales para personas que buscan comprar productores cercanos.', businessType: 'catálogo de alimentos', audience: 'personas que buscan productos regionales', proposition: 'Descubrir productores y elegir con información.', cta: 'Explorar el catálogo' },
  { id: 'product-case', type: 'generic_web_app', direction: 'expresiva', name: 'Órbita Cero', brief: 'Diseñar un producto digital breve para equipos que quieren descubrir una experiencia cooperativa.', businessType: 'producto digital cooperativo', audience: 'equipos que disfrutan resolver desafíos', proposition: 'Una experiencia compartida para pensar distinto.', cta: 'Probar la experiencia' },
]

try {
  const results = []
  for (const item of cases) {
    const result = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: item.id, runId: `${item.id}-run`, versionId: `${item.id}-version`, projectType: item.type, platform: 'web', generationProfile: 'commercial_site', creativeDirection: item.direction, projectName: item.name, brief: item.brief, objective: item.brief, businessType: item.businessType, audience: item.audience, proposition: item.proposition, primaryCta: item.cta, brandSpec: { name: item.name } })
    assert.equal(result.ok, true, JSON.stringify(result.error))
    const planning = result.project.planning
    validateProductPlanning(planning)
    const html = await fs.readFile(path.join(result.artifacts.projectRoot, 'app/index.html'), 'utf8')
    const css = await fs.readFile(path.join(result.artifacts.projectRoot, 'app/styles.css'), 'utf8')
    const js = await fs.readFile(path.join(result.artifacts.projectRoot, 'app/app.js'), 'utf8')
    assert.doesNotThrow(() => validateGeneratedArtifact(planning, { html, css, js }))
    assert.match(html, new RegExp(item.cta.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
    assert.ok(!/(projectId|runId|versionId|briefId|planning)\s*[:=]/u.test(html + js))
    assert.ok(!/Mock tipado|QA Workspace Interno|JSON de capacidades/iu.test(html + js))
    assert.ok(planning.experience.sections.every((section) => html.includes(`id="${section}"`)))
    results.push({ id: item.id, briefId: planning.brief.briefId, strategyId: planning.strategy.strategyId, experienceId: planning.experience.experiencePlanId, visualId: planning.visual.visualSystemId, contentId: planning.content.contentPlanId, sections: planning.experience.sections, cta: planning.content.ctas[0], htmlSize: Buffer.byteLength(html), cssSize: Buffer.byteLength(css) })
  }
  const ids = (key) => new Set(results.map((item) => item[key])).size
  for (const key of ['briefId', 'strategyId', 'experienceId', 'visualId', 'contentId']) assert.equal(ids(key), cases.length, `${key} no se diferencia por brief`)
  assert.equal(new Set(results.map((item) => item.sections.join('|'))).size, cases.length, 'la estructura no se diferencia por producto')
  assert.equal(new Set(results.map((item) => item.cta)).size, cases.length, 'el CTA no se deriva del brief')
  console.log(JSON.stringify({ ok: true, checks: 33, cases: results }, null, 2))
} finally {
  await fs.rm(root, { recursive: true, force: true })
}
