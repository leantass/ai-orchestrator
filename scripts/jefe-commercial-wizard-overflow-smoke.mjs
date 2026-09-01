import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const DESKTOP_VIEWPORTS = [
  [1280, 720],
  [1280, 820],
  [1440, 900],
  [1920, 1080],
]
const MOBILE_VIEWPORTS = [[390, 844]]
const THEMES = ['light', 'dark']

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
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = await evaluate(
      mainWindow,
      `document.querySelector('.jefe-wizard-header span')?.textContent?.trim() || ''`,
    )
    if (current.startsWith(`Paso ${step} de 5`)) return
    await delay(40)
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
      const prototype = control instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
      setter?.call(control, ${JSON.stringify(value)})
      control.dispatchEvent(new Event('input', { bubbles: true }))
      control.dispatchEvent(new Event('change', { bubbles: true }))
      return control.value === ${JSON.stringify(value)}
    })()`,
  )
  assert.equal(changed, true, `No se pudo completar el campo ${labelText}`)
}

async function selectTheme(mainWindow, theme) {
  const current = await evaluate(
    mainWindow,
    `document.documentElement.dataset.theme || 'light'`,
  )
  if (current !== theme) {
    assert.equal(await clickButton(mainWindow, 'Tema actual:'), true)
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (await evaluate(mainWindow, `document.documentElement.dataset.theme || ''`) === theme) return
      await delay(40)
    }
    throw new Error(`WIZARD_THEME_NOT_REACHED:${theme}`)
  }
}

async function measure(mainWindow, width, height, theme, step) {
  if (!mainWindow.webContents.debugger.isAttached()) mainWindow.webContents.debugger.attach('1.3')
  await mainWindow.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await delay(80)
  const result = await evaluate(
    mainWindow,
    `(() => {
      const shell = document.querySelector('.jefe-product-shell')
      const page = document.querySelector('.jefe-wizard-page')
      const content = document.querySelector('.jefe-wizard-content')
      const nodes = [document.documentElement, document.body, document.querySelector('.jefe-product-shell'), page, content].filter(Boolean)
      const verticalOverflow = Math.max(0, ...nodes.map((node) => node.scrollHeight - node.clientHeight))
      const horizontalOverflow = Math.max(0, ...nodes.map((node) => node.scrollWidth - node.clientWidth))
      const pageRect = page?.getBoundingClientRect()
      const contentRect = content?.getBoundingClientRect()
      const form = document.querySelector('.jefe-wizard-content > .jefe-form-grid')
      const formRect = form?.getBoundingClientRect()
      const formFields = form ? [...form.children].map((node) => {
        const rect = node.getBoundingClientRect()
        return { width: rect.width, right: rect.right, left: rect.left }
      }) : []
      const textareas = [...document.querySelectorAll('.jefe-wizard-content textarea')]
      const actions = document.querySelector('.jefe-wizard-actions')
      const actionsRect = actions?.getBoundingClientRect()
      const actionButtons = [...document.querySelectorAll('.jefe-wizard-actions button')]
      const importantNodes = [
        ...document.querySelectorAll('.jefe-wizard-content h1, .jefe-wizard-content input, .jefe-wizard-content textarea, .jefe-wizard-actions button'),
      ]
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const fullyVisible = (node) => {
        const rect = node.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && rect.top >= -1 && rect.left >= -1 && rect.bottom <= viewportHeight + 1 && rect.right <= viewportWidth + 1
      }
      const contentBottomOverflow = pageRect && contentRect
        ? Math.max(0, contentRect.bottom - pageRect.bottom)
        : 0
      return {
        width: viewportWidth,
        height: viewportHeight,
        theme: document.documentElement.dataset.theme || '',
        step: document.querySelector('.jefe-wizard-header span')?.textContent?.trim() || '',
        verticalOverflow,
        horizontalOverflow,
        contentBottomOverflow,
        viewportBottomOverflow: actionsRect ? Math.max(0, actionsRect.bottom - viewportHeight) : 0,
        mainGridColumns: form ? getComputedStyle(form).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length : 1,
        importantFieldsFullWidth: formRect ? formFields.every((field) => Math.abs(field.width - formRect.width) <= 2 && Math.abs(field.left - formRect.left) <= 2) : true,
        textareasWithoutInternalScroll: textareas.every((textarea) => textarea.scrollHeight <= textarea.clientHeight + 1),
        actionsVisible: Boolean(actionsRect && pageRect && actionsRect.top >= pageRect.top && actionsRect.bottom <= pageRect.bottom + 1),
        actionsFullyVisible: actionButtons.length > 0 && actionButtons.every(fullyVisible),
        controlsFullyVisible: importantNodes.length > 0 && importantNodes.every(fullyVisible),
        overflowNotHidden: Boolean(shell && page && getComputedStyle(shell).overflowY !== 'hidden' && getComputedStyle(page).overflowY !== 'hidden'),
      }
    })()`,
  )
  assert.equal(result.width, width, `Viewport ancho inesperado: solicitado ${width}, recibido ${result.width}`)
  assert.equal(result.height, height, `Viewport alto inesperado: solicitado ${height}, recibido ${result.height}`)
  assert.equal(result.theme, theme, `Tema inesperado en paso ${step}`)
  assert.equal(result.horizontalOverflow, 0, `Overflow horizontal en ${width}x${height}, ${theme}, paso ${step}`)
  if (width >= 900) {
    const context = JSON.stringify(result)
    assert.equal(result.verticalOverflow, 0, `Overflow vertical en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.contentBottomOverflow, 0, `Contenido cortado en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.mainGridColumns, 1, `El formulario no está en una columna en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.importantFieldsFullWidth, true, `Campos principales no ocupan el ancho en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.textareasWithoutInternalScroll, true, `Textarea con scroll interno en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.actionsVisible, true, `Acciones fuera de viewport en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.viewportBottomOverflow, 0, `Acciones debajo del viewport real en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.actionsFullyVisible, true, `Acción cortada en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.controlsFullyVisible, true, `Título o campo cortado en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
    assert.equal(result.overflowNotHidden, true, `Overflow oculto en ${width}x${height}, ${theme}, paso ${step}: ${context}`)
  }
  return { requested: { width, height }, theme, step, ...result }
}

async function advanceAndFill(mainWindow, step) {
  assert.equal(await clickButton(mainWindow, 'Continuar'), true, `No se pudo avanzar desde paso ${step}`)
  await waitForStep(mainWindow, step + 1)
  if (step === 1) {
    await setField(mainWindow, 'Tipo de negocio', 'Estudio de arquitectura')
    await setField(mainWindow, '¿Para quién es?', 'Personas y desarrolladores que buscan diseño residencial.')
    await setField(mainWindow, 'Propuesta', 'Convertimos necesidades complejas en espacios claros, habitables y duraderos.')
  }
}

async function runElectronVisualE2ECore({ mainWindow }) {
  mainWindow.setMinimumSize(1, 1)
  const measurements = []

  for (const theme of THEMES) {
    for (const [width, height] of [...DESKTOP_VIEWPORTS, ...MOBILE_VIEWPORTS]) {
      assert.equal(await clickButton(mainWindow, 'Empezar'), true, 'La pantalla inicial no está disponible')
      await waitForStep(mainWindow, 1)
      await selectTheme(mainWindow, theme)
      await setField(mainWindow, 'Nombre del proyecto', 'Estudio Horizonte')
      await setField(mainWindow, '¿Qué necesitás construir?', 'Un sitio institucional premium para presentar servicios de arquitectura.')
      measurements.push(await measure(mainWindow, width, height, theme, 1))
      await advanceAndFill(mainWindow, 1)
      measurements.push(await measure(mainWindow, width, height, theme, 2))
      await advanceAndFill(mainWindow, 2)
      measurements.push(await measure(mainWindow, width, height, theme, 3))
      await advanceAndFill(mainWindow, 3)
      assert.equal(await clickButton(mainWindow, 'Editorial'), true, 'No se pudo seleccionar dirección visual')
      await waitForStep(mainWindow, 4)
      measurements.push(await measure(mainWindow, width, height, theme, 4))
      await advanceAndFill(mainWindow, 4)
      measurements.push(await measure(mainWindow, width, height, theme, 5))
      assert.equal(await clickButton(mainWindow, 'Volver'), true, 'No se pudo regresar al inicio')
      await delay(80)
    }
  }

  assert.equal(measurements.length, THEMES.length * (DESKTOP_VIEWPORTS.length + MOBILE_VIEWPORTS.length) * 5)
  const reportPath = path.join(os.tmpdir(), `jefe-commercial-wizard-overflow-${process.pid}.json`)
  await fs.writeFile(reportPath, `${JSON.stringify({ ok: true, smoke: 'jefe-commercial-wizard-overflow', measurements }, null, 2)}\n`, 'utf8')
  console.log(`Jefe wizard overflow smoke report: ${reportPath}`)
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-commercial-wizard-overflow', measurements }))
}

export default runElectronVisualE2E

export async function runElectronVisualE2E(context) {
  try {
    return await runElectronVisualE2ECore(context)
  } catch (error) {
    const reportPath = path.join(os.tmpdir(), `jefe-commercial-wizard-overflow-failure-${process.pid}.json`)
    const message = error instanceof Error ? error.message : String(error)
    await fs.writeFile(reportPath, `${JSON.stringify({ ok: false, smoke: 'jefe-commercial-wizard-overflow', error: message }, null, 2)}\n`, 'utf8')
    console.error(`Jefe wizard overflow smoke failure report: ${reportPath}`)
    throw error
  }
}
