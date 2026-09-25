import { test, expect } from '@playwright/test'
import path from 'node:path'

test('close persisted real semantic correction without another provider run', async ({ page }) => {
  const screenshots = path.join(path.resolve(process.env.JEFE_QA_ROOT || '.codex-temp/autonomous-quality-closure/runs/local'), 'screenshots')
  await page.goto('/projects')
  const project = page.getByRole('button', { name: /Impulso PyME/u })
  await expect(project).toHaveCount(1)
  await project.click()
  await expect(page.getByText(/Pendiente de revisión/u).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Aprobar preview/u })).toHaveCount(0)
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: /Abrir preview real/u }).click()
  const preview = await popupPromise
  await preview.waitForLoadState('domcontentloaded')
  await expect(preview.locator('h1').first()).toBeVisible()
  await expect(preview.locator('body')).toContainText('Solicitar una reunión')
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await preview.setViewportSize({ width, height: width < 600 ? 844 : 900 })
    const layout = await preview.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth, services: Boolean(document.querySelector('#beneficios, .benefit-grid')), faq: Boolean(document.querySelector('#faq')), contact: Boolean(document.querySelector('#primary-contact')) }))
    expect(layout.overflow).toBeLessThanOrEqual(1)
    expect(layout.services).toBe(true)
    expect(layout.faq).toBe(true)
    expect(layout.contact).toBe(true)
    await preview.screenshot({ path: path.join(screenshots, `corrected-preview-${width}.png`), fullPage: true })
  }
  await preview.close()
  const fallback = page.locator('.jefe-preview-fallback')
  if (await fallback.isVisible().catch(() => false)) await fallback.click({ force: true })
  await expect(page.getByRole('button', { name: /Aprobar preview/u })).toBeVisible()
  await page.getByRole('button', { name: /Aprobar preview/u }).click()
  await expect(page.getByText(/Estado durable:/u)).toContainText('Aprobado')
  await page.screenshot({ path: path.join(screenshots, 'approved.png'), fullPage: true })
})
