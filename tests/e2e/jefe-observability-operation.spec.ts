import { test, expect } from '@playwright/test'

test('observability operation view is read-only and honest without evidence bridge', async ({ page }) => {
  await page.goto('/operation')
  await expect(page.getByTestId('operation-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Estado de JEFE' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Actualizar estado' })).toBeVisible()
  await expect(page.getByText('Desconocido').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resolver' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Deploy' })).toHaveCount(0)
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 })
    await page.screenshot({ path: `.codex-temp/escalon-9c-operation-${width}.png`, fullPage: true })
  }
})
