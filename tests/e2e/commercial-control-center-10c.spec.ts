import { test, expect } from '@playwright/test'
import path from 'node:path'

test('10C operation keeps unavailable evidence unknown and read-only', async ({ page }) => {
  await page.goto('/operation')
  await expect(page.getByTestId('operation-view')).toBeVisible()
  await expect(page.getByText('Salud desconocida')).toBeVisible()
  await expect(page.getByText('El sistema todavía no pudo cargar una instantánea operativa.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Actualizar estado' })).toBeVisible()
  await expect(page.getByText(/workflow_dispatch|push|deploy|GitHub Release/i)).toHaveCount(0)
  await page.screenshot({ path: path.resolve('.codex-temp/escalon-10c/evidence/operation-unknown-by-default.png'), fullPage: true })
})
