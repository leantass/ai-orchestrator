import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const evidence = path.resolve('.codex-temp/escalon-11a/evidence')
fs.mkdirSync(evidence, { recursive: true })

test('normal commercial request reaches the real project, preview and operation surfaces', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: path.join(evidence, '01-home.png'), fullPage: true })
  await page.getByRole('button', { name: /Sitio web/i }).click()
  await page.getByRole('button', { name: /^Empezar/i }).last().click()
  await page.getByLabel('Nombre del proyecto').fill('11A Browser Project')
  await page.getByLabel(/necesit.*construir/i).fill('Auditar el recorrido comercial real.')
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByLabel('Objetivo principal').fill('Obtener evidencia durable del recorrido.')
  await page.getByLabel('Tipo de negocio').fill('Servicio')
  await page.getByLabel(/Para qui.*es/i).fill('Operadores')
  await page.getByLabel('Propuesta').fill('Trazabilidad')
  await page.getByLabel(/Acci.*principal/i).fill('Revisar')
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Editorial/ }).click()
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Crear primera versi/i }).click()
  await expect(page.getByRole('heading', { name: '11A Browser Project' })).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: path.join(evidence, '03-project-created.png'), fullPage: true })
  await expect(page.getByRole('heading', { name: 'Estado del proyecto' })).toBeVisible()
  await page.screenshot({ path: path.join(evidence, '04-workspace.png'), fullPage: true })
  await page.getByRole('button', { name: 'Operación', exact: true }).click()
  await expect(page.getByTestId('operation-view')).toBeVisible()
  await page.screenshot({ path: path.join(evidence, '07-operation.png'), fullPage: true })
})
