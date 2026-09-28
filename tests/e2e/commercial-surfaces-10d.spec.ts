import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const evidence = path.resolve('.codex-temp/escalon-10d/evidence')
fs.mkdirSync(evidence, { recursive: true })
const viewports = [1440, 1280, 1024, 768, 390]

for (const width of viewports) {
  test(`operation surface is usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/operation')
    await expect(page.getByTestId('operation-view')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Actualizar estado' }).first()).toBeVisible()
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width)
    await page.screenshot({ path: path.join(evidence, `operation-${width}.png`), fullPage: true })
  })
}

test('global navigation and build deep link expose truthful current routes', async ({ page }) => {
  await page.goto('/build')
  await expect(page.getByRole('heading', { name: 'Demos forma a tu idea.' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Demos forma a tu idea.' })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Inicio', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'Operación', exact: true }).click()
  await expect(page).toHaveURL(/\/operation$/u)
  await expect(page.getByRole('button', { name: 'Operación', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
})
