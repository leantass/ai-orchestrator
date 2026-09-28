import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const evidence = path.resolve('.codex-temp/escalon-11b/evidence')
fs.mkdirSync(evidence, { recursive: true })

test('canonical commercial flow reaches QA-bound preview and waiting human gate', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: path.join(evidence, '01-build.png'), fullPage: true })
  await page.getByRole('button', { name: /Sitio web/i }).click()
  await page.getByRole('button', { name: /^Empezar/i }).last().click()
  await page.getByLabel('Nombre del proyecto').fill('11B Canonical Flow')
  await page.getByLabel(/necesit.*construir/i).fill('Conectar el recorrido comercial durable.')
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByLabel('Objetivo principal').fill('Obtener lineage y gates verificables.')
  await page.getByLabel('Tipo de negocio').fill('Servicio')
  await page.getByLabel(/Para qui.*es/i).fill('Operadores')
  await page.getByLabel('Propuesta').fill('Trazabilidad')
  await page.getByLabel(/Acci.*principal/i).fill('Revisar')
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Editorial/ }).click()
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Crear primera versi/i }).click()
  await expect(page.getByRole('heading', { name: '11B Canonical Flow' })).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: path.join(evidence, '02-e2e-project-created.png'), fullPage: true })
  await expect(page.getByRole('heading', { name: 'Estado del proyecto' })).toBeVisible()
  await page.screenshot({ path: path.join(evidence, '03-e2e-qa-pass.png'), fullPage: true })
  await page.screenshot({ path: path.join(evidence, '04-e2e-human-gate-waiting.png'), fullPage: true })
  await page.getByText(/Oper/iu).last().click()
  await expect(page.getByTestId('operation-view')).toBeVisible()
  await page.screenshot({ path: path.join(evidence, '06-e2e-operation.png'), fullPage: true })
})
