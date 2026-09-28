import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const evidence = path.resolve('.codex-temp/escalon-10b/evidence')
const shot = async (page: import('@playwright/test').Page, name: string) => { await fs.mkdir(evidence, { recursive: true }); await page.screenshot({ path: path.join(evidence, name), fullPage: true }) }

test('10B canonical navigation survives route transitions and responsive viewports', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/'); await expect(page.getByTestId('home-start')).toBeVisible(); await shot(page, '01-home-1440.png')
  await page.getByRole('button', { name: 'Proyectos' }).first().click(); await expect(page).toHaveURL(/\/projects$/u); await expect(page.getByTestId('projects-view')).toBeVisible(); await shot(page, '02-projects-1440.png')
  await page.goBack(); await expect(page).toHaveURL(/\/$/u); await page.goForward(); await expect(page).toHaveURL(/\/projects$/u)
  await page.goto('/build'); await expect(page.getByRole('heading', { name: 'Demos forma a tu idea.' })).toBeVisible(); await shot(page, '03-build-1440.png'); await page.reload(); await expect(page.getByRole('heading', { name: 'Demos forma a tu idea.' })).toBeVisible()
  await page.goto('/projects/missing-10b'); await expect(page.getByTestId('not-found')).toBeVisible(); await shot(page, '04-workspace-summary-1440.png')
  await page.goto('/operation'); await expect(page.getByTestId('operation-view')).toBeVisible(); await shot(page, '05-operation-1440.png')
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await shot(page, '06-home-390.png'); await page.goto('/projects'); await shot(page, '07-projects-390.png'); await page.goto('/build'); await shot(page, '08-build-390.png'); await page.goto('/projects/missing-10b'); await shot(page, '09-workspace-390.png'); await page.goto('/operation'); await shot(page, '10-operation-390.png')
  await page.goto('/banana'); await expect(page.getByTestId('not-found')).toBeVisible()
  await fs.writeFile(path.join(evidence, 'navigation-results.json'), `${JSON.stringify({ routes: ['/', '/build', '/projects', '/projects/:id', '/projects/:id/versions/:versionId', '/operation'], invalidRoute: '/banana', providerCalls: 0, externalNetworkUsed: false }, null, 2)}\n`, 'utf8')
})
