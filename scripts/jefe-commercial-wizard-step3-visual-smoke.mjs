import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function evaluate(mainWindow, expression) {
  return mainWindow.webContents.executeJavaScript(expression, true)
}

async function clickButton(mainWindow, text) {
  return evaluate(
    mainWindow,
    `(() => {
      const target = [...document.querySelectorAll('button')].find((button) =>
        (button.innerText || '').trim().includes(${JSON.stringify(text)}) && !button.disabled,
      )
      if (!target) return false
      target.click()
      return true
    })()`,
  )
}

async function waitForStep(mainWindow, step) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const current = await evaluate(mainWindow, `document.querySelector('.jefe-wizard-header span')?.textContent?.trim() || ''`)
    if (current.startsWith(`Paso ${step} de 5`)) return
    await delay(50)
  }
  throw new Error(`WIZARD_STEP_NOT_REACHED:${step}`)
}

async function setField(mainWindow, labelText, value) {
  const changed = await evaluate(
    mainWindow,
    `(() => {
      const label = [...document.querySelectorAll('.jefe-wizard-content label')].find((entry) =>
        (entry.innerText || '').trim().startsWith(${JSON.stringify(labelText)}),
      )
      const control = label?.querySelector('input, textarea')
      if (!control) return false
      const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
      setter?.call(control, ${JSON.stringify(value)})
      control.dispatchEvent(new Event('input', { bubbles: true }))
      control.dispatchEvent(new Event('change', { bubbles: true }))
      return control.value === ${JSON.stringify(value)}
    })()`,
  )
  assert.equal(changed, true, `No se pudo completar ${labelText}`)
}

async function selectTheme(mainWindow, theme) {
  const current = await evaluate(mainWindow, `document.documentElement.dataset.theme || 'light'`)
  if (current === theme) return
  assert.equal(await clickButton(mainWindow, 'Tema actual:'), true, `No se pudo cambiar a ${theme}`)
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await evaluate(mainWindow, `document.documentElement.dataset.theme || ''`) === theme) return
    await delay(50)
  }
  throw new Error(`WIZARD_THEME_NOT_REACHED:${theme}`)
}

async function measure(mainWindow, theme) {
  const result = await evaluate(
    mainWindow,
    `(() => {
      const buttons = [...document.querySelectorAll('.jefe-wizard-actions button')]
      const readButton = (button) => {
        const rect = button.getBoundingClientRect()
        return {
          label: (button.innerText || '').trim(),
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        }
      }
      const byText = (text) => buttons.find((button) => (button.innerText || '').trim().includes(text))
      const back = byText('Atrás')
      const continueButton = byText('Continuar')
      const viewportBottom = window.innerHeight - 16
      const allButtons = buttons.map(readButton)
      const withinViewport = (button) => {
        const rect = button.getBoundingClientRect()
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewportBottom && rect.right <= window.innerWidth
      }
      return {
        theme: document.documentElement.dataset.theme || '',
        viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
        documentElementScrollHeight: document.documentElement.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight,
        documentElementClientHeight: document.documentElement.clientHeight,
        bodyClientHeight: document.body.clientHeight,
        back: back ? readButton(back) : null,
        continueButton: continueButton ? readButton(continueButton) : null,
        allButtons,
        pageVerticalOverflow: Math.max(0, document.documentElement.scrollHeight - window.innerHeight, document.body.scrollHeight - window.innerHeight),
        actionMarginBottom: Math.min(...buttons.map((button) => window.innerHeight - button.getBoundingClientRect().bottom)),
        actionsFullyVisible: buttons.length > 0 && buttons.every(withinViewport),
      }
    })()`,
  )
  assert.equal(result.theme, theme, `Tema inesperado: ${theme}`)
  assert.equal(result.back?.label.includes('Atrás'), true, `No existe Atrás en ${theme}`)
  assert.equal(result.continueButton?.label.includes('Continuar'), true, `No existe Continuar en ${theme}`)
  assert.equal(result.back.bottom <= result.viewport.height - 16, true, `Atrás sin margen inferior en ${theme}: ${JSON.stringify(result)}`)
  assert.equal(result.continueButton.bottom <= result.viewport.height - 16, true, `Continuar sin margen inferior en ${theme}: ${JSON.stringify(result)}`)
  assert.equal(result.actionsFullyVisible, true, `Acción recortada en ${theme}: ${JSON.stringify(result)}`)
  assert.equal(result.pageVerticalOverflow, 0, `Overflow real en ${theme}: ${JSON.stringify(result)}`)
  return result
}

async function capture(mainWindow, theme, measurement) {
  const image = await mainWindow.webContents.capturePage()
  const png = image.toPNG()
  const size = image.getSize()
  const outputPath = path.join(os.tmpdir(), `jefe-commercial-wizard-step3-${process.pid}-${theme}.png`)
  await fs.writeFile(outputPath, png)
  return { theme, outputPath, size, bytes: png.length, measurement }
}

export async function runElectronVisualE2E({ mainWindow }) {
  mainWindow.setMinimumSize(1, 1)
  assert.equal(await clickButton(mainWindow, 'Empezar'), true, 'La pantalla inicial no está disponible')
  await waitForStep(mainWindow, 1)
  await setField(mainWindow, 'Nombre del proyecto', 'Estudio Horizonte')
  await setField(mainWindow, '¿Qué necesitás construir?', 'Un sitio institucional premium para presentar servicios de arquitectura.')
  assert.equal(await clickButton(mainWindow, 'Continuar'), true, 'No se pudo avanzar al paso 2')
  await waitForStep(mainWindow, 2)
  await setField(mainWindow, 'Tipo de negocio', 'Estudio de arquitectura')
  await setField(mainWindow, '¿Para quién es?', 'Personas y desarrolladores que buscan diseño residencial.')
  await setField(mainWindow, 'Propuesta', 'Convertimos necesidades complejas en espacios claros, habitables y duraderos.')
  assert.equal(await clickButton(mainWindow, 'Continuar'), true, 'No se pudo avanzar al paso 3')
  await waitForStep(mainWindow, 3)

  const captures = []
  for (const theme of ['light', 'dark']) {
    await selectTheme(mainWindow, theme)
    await delay(100)
    const measurement = await measure(mainWindow, theme)
    captures.push(await capture(mainWindow, theme, measurement))
  }

  const report = { ok: true, smoke: 'jefe-commercial-wizard-step3-visual', step: 3, captures }
  const reportPath = path.join(os.tmpdir(), `jefe-commercial-wizard-step3-${process.pid}.json`)
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ ...report, reportPath }))
}

export default runElectronVisualE2E
