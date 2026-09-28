import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const evidenceRoot = path.resolve('.codex-temp/escalon-10a/evidence')
const shot = async (page: import('@playwright/test').Page, name: string) => { await fs.mkdir(evidenceRoot, { recursive: true }); await page.screenshot({ path: path.join(evidenceRoot, name), fullPage: true }) }

test('commercial control center audit records reachable surfaces without creating product data', async ({ page }) => {
  const findings: string[] = []; const navigation: Array<Record<string, string>> = []
  await page.goto('/'); await expect(page.getByTestId('home-start')).toBeVisible(); await shot(page, '01-home-1440.png')
  const labels = await page.locator('.jefe-nav nav button').allTextContents(); for (const label of labels) navigation.push({ surface: 'global', label, routeBefore: page.url(), expected: label === 'Proyectos' ? 'state-only project screen' : 'onHome' })
  findings.push('CommercialNav Construir/Versiones/Entregas tienen onHome y no rutas propias: MISROUTED_OR_DECORATIVE')
  await page.goto('/projects'); await expect(page.getByTestId('projects-view')).toBeVisible(); await shot(page, '02-projects-1440.png')
  await page.getByRole('button', { name: 'Nuevo proyecto' }).click(); await expect(page.getByRole('heading', { name: 'Demos forma a tu idea.' })).toBeVisible(); await shot(page, '03-wizard-1440.png')
  await page.goto('/build'); findings.push(`Direct /build wizard=${(await page.getByRole('heading', { name: 'Demos forma a tu idea.' }).count()) > 0}`)
  await page.goto('/projects/missing-audit-project'); findings.push(`Missing project route remains user-readable=${(await page.getByText(/No pudimos cargar el proyecto|no existe|disponible/u).count()) > 0}`); await shot(page, '04-workspace-summary-1440.png')
  findings.push('Workspace tabs and human gate require a real project fixture; no product data was fabricated for 10A.')
  await page.goto('/operation'); await expect(page.getByTestId('operation-view')).toBeVisible(); await shot(page, '08-operation-1440.png')
  for (const width of [1280, 1024, 768]) { await page.setViewportSize({ width, height: 900 }); await page.goto('/'); await expect(page.getByTestId('home-start')).toBeVisible(); await page.goto('/projects'); await expect(page.getByTestId('projects-view')).toBeVisible(); await page.goto('/operation'); await expect(page.getByTestId('operation-view')).toBeVisible(); await shot(page, 'responsive-operation-' + width + '.png') }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await shot(page, '09-home-390.png'); await page.goto('/projects'); await shot(page, '10-projects-390.png'); await page.goto('/projects/missing-audit-project'); await shot(page, '11-workspace-390.png'); await page.goto('/operation'); await shot(page, '12-operation-390.png')
  await fs.writeFile(path.join(evidenceRoot, 'audit-results.json'), `${JSON.stringify({ routes: ['/', '/build', '/projects', '/projects/:id', '/projects/:id/versions/:versionId', '/operation'], navigation, findings }, null, 2)}\n`, 'utf8')
})
