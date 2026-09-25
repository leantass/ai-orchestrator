import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

test('normal user semantic correction flow', async ({ page }) => {
  const qaRoot = path.resolve(process.env.JEFE_QA_ROOT || '.codex-temp/autonomous-quality-closure/runs/local')
  const screenshots = path.join(qaRoot, 'screenshots')
  const projectName = process.env.JEFE_E2E_PROJECT_NAME || 'Impulso PyME'
  const brief = `Quiero crear el sitio web de ${projectName}, una consultora argentina que ayuda a pequeñas empresas y comercios a ordenar sus procesos, automatizar tareas y mejorar sus ventas.\n\nEl público principal son dueños y responsables de PyMEs que necesitan soluciones claras y prácticas, sin lenguaje técnico innecesario.\n\nLos servicios principales son diagnóstico de procesos, automatización operativa y acompañamiento en la implementación.\n\nQuiero que la web se vea profesional, moderna y cercana. Debe explicar claramente qué hacemos, cómo trabajamos, qué beneficios concretos obtiene el cliente, incluir preguntas frecuentes y una forma simple de contacto.\n\nLa acción principal debe ser solicitar una reunión.`
  const objective = `Generar reuniones con dueños y responsables de PyMEs mostrando de forma clara cómo ${projectName.replace(' Final', '')} ayuda a ordenar procesos, automatizar tareas y acompañar la implementación con mejoras medibles.`
  const business = 'Consultora para PyMEs'
  const audience = 'Dueños y responsables de pequeñas y medianas empresas, comercios y equipos que necesitan ordenar procesos, reducir tareas manuales y mejorar sus ventas sin depender de soluciones técnicas complejas.'
  const proposition = 'Ayudamos a PyMEs a detectar problemas operativos, simplificar procesos y automatizar tareas concretas. Trabajamos con diagnóstico, implementación práctica y acompañamiento para lograr mejoras medibles sin sumar complejidad innecesaria.'
  const rejection = 'Quiero que el hero sea más específico para PyMEs y que explique con mayor claridad el resultado esperado: ordenar procesos, reducir trabajo manual y mejorar ventas. Mantené la dirección comercial y la acción principal "Solicitar una reunión". Evitá repetir el mismo mensaje entre el hero y las secciones siguientes.'
  const shot = async (name: string, aliases: string[] = []) => { const target = path.join(screenshots, name); await page.screenshot({ path: target, fullPage: true }); for (const alias of aliases) await fs.copyFile(target, path.join(screenshots, alias)) }
  const fillLabel = async (label: string, value: string) => { await page.getByLabel(label, { exact: false }).fill(value) }

  await page.goto('/')
  await shot('01-step1.png')
  await page.getByRole('button', { name: /Sitio web/u }).click()
  await page.getByRole('button', { name: /Empezar/u }).click()
  await fillLabel('Nombre del proyecto', projectName)
  await fillLabel('¿Qué necesitás construir?', brief)
  expect(brief.length).toBeGreaterThan(600)
  expect(brief.length).toBeLessThanOrEqual(4000)
  await shot('01-step1.png')
  await page.getByRole('button', { name: /Continuar/u }).click()

  await fillLabel('Objetivo principal', objective)
  await fillLabel('Tipo de negocio', business)
  await fillLabel('¿Para quién es?', audience)
  await fillLabel('Propuesta', proposition)
  await fillLabel('Acción principal', 'Solicitar una reunión')
  await expect(page.getByText(/Objetivo principal/u).first()).toBeVisible()
  await shot('02-step2.png')
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('jefe-commercial-draft-v1') || 'null'))
  expect(saved).toMatchObject({ name: projectName, need: brief, objective, businessType: business, audience, proposition, cta: 'Solicitar una reunión' })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Continuar borrador', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar borrador', exact: true }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('jefe-commercial-draft-v1') || 'null'))).toMatchObject(saved)
  await shot('03-draft-restored.png')

  await page.getByRole('button', { name: /Continuar/u }).click()
  await expect(page.getByText(/0 materiales seleccionados/u)).toBeVisible()
  await shot('04-step3.png')
  await page.getByRole('button', { name: /Continuar/u }).click()
  await page.getByRole('button', { name: /Comercial/u }).click()
  await shot('05-commercial.png')
  await page.getByRole('button', { name: /Continuar/u }).click()
  await expect(page.getByText(projectName, { exact: true })).toBeVisible()
  await expect(page.locator('[data-review-field="objective"]')).toHaveAttribute('data-review-value', objective)
  await expect(page.getByText('Solicitar una reunión', { exact: true })).toBeVisible()
  await shot('06-review.png', ['wizard-review.png'])

  await page.getByRole('button', { name: /Crear primera versión/u }).click()
  await expect(page).toHaveURL(/\/projects\/[^/]+$/u, { timeout: 30_000 })
  await expect(page.getByText('Preview real', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Aprobar preview/u })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Rechazar preview', exact: true })).toHaveCount(0)
  const projectPath = new URL(page.url()).pathname
  const projectId = decodeURIComponent(projectPath.split('/')[2])
  expect(projectId).toMatch(/^impulso-pyme-/u)
  expect(projectId).not.toMatch(/(?:qa|test|fixture|smoke|factory|pipeline)/iu)
  await shot('07-workspace.png', ['workspace-initial.png'])

  await page.getByRole('button', { name: 'Inicio', exact: true }).click()
  await page.getByRole('button', { name: 'Proyectos', exact: true }).click()
  const projectTile = page.getByRole('button', { name: new RegExp(projectName, 'u') }).first()
  await expect(projectTile).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(projectName, 'u') })).toHaveCount(1)
  await shot('08-projects.png', ['projects-list.png'])
  await projectTile.click()
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`))

  const initialPopup = page.waitForEvent('popup')
  await page.getByRole('button', { name: /Abrir preview real/u }).click()
  const initialPreview = await initialPopup
  await initialPreview.waitForLoadState('domcontentloaded')
  await expect(initialPreview.locator('h1').first()).toBeVisible()
  await expect(initialPreview.locator('body')).toContainText(/faq|preguntas/iu)
  await expect(initialPreview.locator('body')).toContainText(/Contacto|Solicitar/u)
  await initialPreview.screenshot({ path: path.join(screenshots, '09-initial-preview.png'), fullPage: true })
  await fs.copyFile(path.join(screenshots, '09-initial-preview.png'), path.join(screenshots, 'initial-preview.png'))
  await initialPreview.close()
  const initialFallback = page.locator('.jefe-preview-fallback')
  if (await initialFallback.isVisible().catch(() => false)) await initialFallback.click({ force: true })
  await expect(page.getByRole('button', { name: 'Rechazar preview', exact: true })).toBeVisible({ timeout: 10_000 })

  await fillLabel('Motivo del rechazo', rejection)
  await page.getByRole('button', { name: 'Rechazar preview', exact: true }).click()
  await expect(page.getByText(/Estado durable:/u)).toContainText('Rechazado')
  await expect(page.getByRole('button', { name: 'Corregir versión', exact: true })).toBeVisible()
  await shot('10-rejected.png', ['rejected.png'])

  const correctionButton = page.getByRole('button', { name: 'Corregir versión', exact: true })
  if (process.env.JEFE_E2E_PRE_CORRECTION_ONLY === '1') return
  await correctionButton.click()
  await expect(page.getByRole('button', { name: /JEFE está preparando una nueva versión/u })).toBeDisabled()
  await shot('11-correcting.png', ['correcting.png'])

  await expect(page.getByText(/Pendiente de revisión|Nueva versión semántica preparada/u).first()).toBeVisible({ timeout: 7 * 60 * 1000 })
  await expect(page.getByText(/Pendiente de revisión/u).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: /Aprobar preview/u })).toHaveCount(0)
  await shot('12-new-version.png', ['new-version.png'])

  const correctedPopup = page.waitForEvent('popup')
  await page.getByRole('button', { name: /Abrir preview real/u }).click()
  const correctedPreview = await correctedPopup
  await correctedPreview.waitForLoadState('domcontentloaded')
  await expect(correctedPreview.locator('body')).toContainText('Solicitar una reunión')
  await expect(correctedPreview.locator('h1').first()).toBeVisible()
  const responsiveScreenshots = [1440, 1280, 1024, 768, 390]
  for (const width of responsiveScreenshots) {
    await correctedPreview.setViewportSize({ width, height: width < 600 ? 844 : 900 })
    const layout = await correctedPreview.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth, h1: Boolean(document.querySelector('h1')), cta: [...document.querySelectorAll('a.cta, form button, button')].some((item) => item.textContent?.trim() === 'Solicitar una reunión'), services: Boolean(document.querySelector('.benefit-grid')), faq: Boolean(document.querySelector('#faq')), contact: Boolean(document.querySelector('#primary-contact')) }))
    expect(layout.overflow).toBeLessThanOrEqual(1)
    expect(layout.h1).toBe(true)
    expect(layout.cta).toBe(true)
    expect(layout.services).toBe(true)
    expect(layout.faq).toBe(true)
    expect(layout.contact).toBe(true)
    await correctedPreview.screenshot({ path: path.join(screenshots, `corrected-preview-${width}.png`), fullPage: true })
  }
  await correctedPreview.close()

  await expect(page.getByRole('button', { name: /Aprobar preview/u })).toBeVisible()

  await page.getByRole('button', { name: /Aprobar preview/u }).click()
  await expect(page.getByText(/Estado durable:/u)).toContainText('Aprobado')
  await shot('14-approved.png', ['approved.png'])

  const projectRoot = path.resolve(process.env.JEFE_E2E_PROJECT_ROOT || path.join(process.env.APPDATA || '', 'ai-orchestrator', 'jefe-canonical-projects'), projectId)
  const manifests = await fs.readdir(projectRoot)
  expect(manifests).toContain('version-v0001')
  expect(manifests.length).toBeGreaterThanOrEqual(1)
})
