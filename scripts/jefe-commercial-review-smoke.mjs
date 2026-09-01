import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function evaluate(mainWindow, expression) {
  return mainWindow.webContents.executeJavaScript(expression, true)
}

async function clickButton(mainWindow, text) {
  return evaluate(mainWindow, `(() => {
    const target = [...document.querySelectorAll('button')].find((button) =>
      (button.innerText || '').trim().includes(${JSON.stringify(text)}) && !button.disabled,
    )
    if (!target) return false
    target.click()
    return true
  })()`)
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
  const changed = await evaluate(mainWindow, `(() => {
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
  })()`)
  assert.equal(changed, true, `No se pudo completar ${labelText}`)
}

async function measureReview(mainWindow) {
  return evaluate(mainWindow, `(() => {
    const fieldNames = ['project-name', 'project-type', 'need', 'business-type', 'audience', 'proposition', 'colors', 'direction', 'notes', 'cta', 'materials', 'urls']
    const fields = Object.fromEntries(fieldNames.map((name) => [name, document.querySelector('[data-review-field="' + name + '"]')?.innerText?.trim() || '']))
    const fullValues = Object.fromEntries(fieldNames.map((name) => [name, document.querySelector('[data-review-field="' + name + '"]')?.getAttribute('data-review-value') || '']))
    const buttons = [...document.querySelectorAll('.jefe-wizard-actions button')].map((button) => {
      const rect = button.getBoundingClientRect()
      return { label: (button.innerText || '').trim(), disabled: button.disabled, top: rect.top, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height }
    })
    const innerHeight = window.innerHeight
    const allActionsVisible = buttons.length > 0 && buttons.every((button) => button.top >= 0 && button.bottom <= innerHeight - 16 && button.right <= window.innerWidth)
    const header = document.querySelector('.jefe-wizard-header')?.getBoundingClientRect()
    const stepper = document.querySelector('.jefe-wizard-progress')?.getBoundingClientRect()
    const title = document.querySelector('.jefe-wizard-content h1')?.getBoundingClientRect()
    const rectData = (rect) => rect && ({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height })
    return {
      step: document.querySelector('.jefe-wizard-header span')?.textContent?.trim() || '',
      fields,
      fullValues,
      bodyText: document.body.innerText,
      scrollY: window.scrollY,
      documentElementScrollHeight: document.documentElement.scrollHeight,
      documentElementClientHeight: document.documentElement.clientHeight,
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      viewport: { width: window.innerWidth, height: innerHeight, devicePixelRatio: window.devicePixelRatio },
      visibleFrame: { header: rectData(header), stepper: rectData(stepper), title: rectData(title) },
      buttons,
      allActionsVisible,
    }
  })()`)
}

export async function runElectronVisualE2E({ mainWindow }) {
  assert.equal(await clickButton(mainWindow, 'Sitio web'), true, 'No se pudo seleccionar el tipo del proyecto')
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
  const colors = 'Azul noche profundo, marfil cálido y verde menta como color de acento. Evitar naranja, negro puro, magenta y gradientes fuertes. La combinación debe sentirse tecnológica, premium, confiable y diferente a JEFE.'
  await setField(mainWindow, 'Colores', colors)
  await setField(mainWindow, 'Notas visuales', 'Editorial, cálido y sobrio')
  await setField(mainWindow, 'URLs de referencia', 'https://estudio-horizonte.example/referencias')
  assert.equal(await clickButton(mainWindow, 'Continuar'), true, 'No se pudo avanzar al paso 4')
  await waitForStep(mainWindow, 4)
  assert.equal(await clickButton(mainWindow, 'Editorial'), true, 'No se pudo seleccionar Editorial')
  assert.equal(await clickButton(mainWindow, 'Continuar'), true, 'No se pudo avanzar al paso 5')
  await waitForStep(mainWindow, 5)
  const result = await measureReview(mainWindow)
  const internalEnums = ['agency_site', 'application', 'business_system', 'generationProfile', 'projectType']
  const expectedFields = {
    'project-name': 'Proyecto\nEstudio Horizonte',
    'project-type': 'Tipo de proyecto\nSitio web',
    need: 'Qué necesitás construir\nUn sitio institucional premium para presentar servicios de arquitectura.',
    'business-type': 'Tipo de negocio\nEstudio de arquitectura',
    audience: 'Público objetivo\nPersonas y desarrolladores que buscan diseño residencial.',
    proposition: 'Propuesta\nConvertimos necesidades complejas en espacios claros, habitables y duraderos.',
    colors: `Colores\n${colors}`,
    direction: 'Dirección visual\nEditorial',
    notes: 'Notas visuales\nEditorial, cálido y sobrio',
    cta: 'Acción principal\nNo indicado todavía',
    materials: 'Materiales\nNo se adjuntaron materiales',
    urls: 'URLs de referencia\nhttps://estudio-horizonte.example/referencias',
  }
  const normalizeVisibleText = (value) => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
  for (const [field, expected] of Object.entries(expectedFields)) assert.equal(normalizeVisibleText(result.fullValues[field]), normalizeVisibleText(expected.replace(/^[^\n]+\n/, '')), `Resumen incoherente en ${field}`)
  for (const value of internalEnums) assert.equal(result.bodyText.includes(value), false, `Se filtró valor interno: ${value}`)
  assert.equal(result.step, 'Paso 5 de 5')
  assert.equal(result.scrollY, 0, `La revisión no inicia en scrollY=0: ${JSON.stringify(result)}`)
  assert.equal(result.documentElementScrollHeight, result.documentElementClientHeight, `Scroll del documento: ${JSON.stringify(result)}`)
  assert.equal(result.bodyScrollHeight, result.bodyClientHeight, `Scroll del body: ${JSON.stringify(result)}`)
  assert.equal(result.visibleFrame.header?.top >= 0 && result.visibleFrame.header?.bottom <= result.viewport.height, true, `Encabezado fuera de viewport: ${JSON.stringify(result)}`)
  assert.equal(result.visibleFrame.stepper?.top >= 0 && result.visibleFrame.stepper?.bottom <= result.viewport.height, true, `Stepper fuera de viewport: ${JSON.stringify(result)}`)
  assert.equal(result.visibleFrame.title?.top >= 0 && result.visibleFrame.title?.bottom <= result.viewport.height, true, `Título fuera de viewport: ${JSON.stringify(result)}`)
  assert.equal(result.allActionsVisible, true, `Acción recortada: ${JSON.stringify(result)}`)
  const createButton = result.buttons.find((button) => button.label.includes('Crear primera versión'))
  assert.equal(Boolean(createButton) && createButton.disabled !== true, true, 'La primera versión no queda habilitada en el Paso 5')
  const generatorProjection = { projectName: 'Estudio Horizonte', brief: 'Un sitio institucional premium para presentar servicios de arquitectura.', projectType: 'agency_site', businessType: 'Estudio de arquitectura', audience: 'Personas y desarrolladores que buscan diseño residencial.', proposition: 'Convertimos necesidades complejas en espacios claros, habitables y duraderos.', creativeDirection: 'editorial', manualBrandColors: colors, detectedHexColors: [], urlReferences: ['https://estudio-horizonte.example/referencias'] }
  assert.equal(result.fields['project-name'].includes(generatorProjection.projectName), true)
  assert.equal(result.fullValues.need.includes(generatorProjection.brief), true)
  assert.equal(result.fields['project-type'].includes('Sitio web'), true)
  assert.equal(result.fullValues['business-type'].includes(generatorProjection.businessType), true)
  assert.equal(result.fullValues.audience.includes(generatorProjection.audience), true)
  assert.equal(result.fullValues.proposition.includes(generatorProjection.proposition), true)
  assert.equal(result.fullValues.direction.includes('Editorial'), true)
  assert.equal(result.fullValues.colors.includes(generatorProjection.manualBrandColors), true)
  assert.equal(result.fullValues.urls.includes(generatorProjection.urlReferences[0]), true)
  const report = { ok: true, smoke: 'jefe-commercial-review', step: 5, result }
  const reportPath = path.join(os.tmpdir(), `jefe-commercial-review-${process.pid}.json`)
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-commercial-review', reportPath, result }))
}

export default runElectronVisualE2E
