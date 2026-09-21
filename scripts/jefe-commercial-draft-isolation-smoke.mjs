import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function evaluate(mainWindow, expression) {
  return mainWindow.webContents.executeJavaScript(expression, true)
}

async function clickButton(mainWindow, text) {
  const expression = '(() => { const target = [...document.querySelectorAll("button")].find((button) => (button.innerText || "").trim().includes(' + JSON.stringify(text) + ') && !button.disabled); if (!target) return false; target.click(); return true })()'
  return evaluate(mainWindow, expression)
}

async function waitFor(mainWindow, expression, message) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await evaluate(mainWindow, expression)) return
    await delay(50)
  }
  throw new Error(message)
}

async function reload(mainWindow) {
  await mainWindow.reload()
  await waitFor(mainWindow, 'document.querySelector("#jefe-idea") !== null', 'No se recuperó Inicio después de F5')
}

async function setControl(mainWindow, selector, value) {
  const expression = '(() => { const control = document.querySelector(' + JSON.stringify(selector) + '); if (!control) return false; const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set; setter?.call(control, ' + JSON.stringify(value) + '); control.dispatchEvent(new Event("input", { bubbles: true })); control.dispatchEvent(new Event("change", { bubbles: true })); return control.value === ' + JSON.stringify(value) + ' })()'
  const changed = await evaluate(mainWindow, expression)
  assert.equal(changed, true, 'No se pudo completar ' + selector)
}

async function setField(mainWindow, labelText, value) {
  const expression = '(() => { const label = [...document.querySelectorAll(".jefe-wizard-content label")].find((entry) => (entry.innerText || "").trim().startsWith(' + JSON.stringify(labelText) + ')); const control = label?.querySelector("input, textarea"); if (!control) return false; const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set; setter?.call(control, ' + JSON.stringify(value) + '); control.dispatchEvent(new Event("input", { bubbles: true })); control.dispatchEvent(new Event("change", { bubbles: true })); return control.value === ' + JSON.stringify(value) + ' })()'
  assert.equal(await evaluate(mainWindow, expression), true, 'No se pudo completar ' + labelText)
}

async function waitForStep(mainWindow, step) {
  const expression = 'document.querySelector(".jefe-wizard-header span")?.textContent?.trim().startsWith(' + JSON.stringify('Paso ' + step + ' de 5') + ')'
  await waitFor(mainWindow, expression, 'WIZARD_STEP_NOT_REACHED:' + step)
}

async function advance(mainWindow, step) {
  assert.equal(await clickButton(mainWindow, 'Continuar'), true, 'No se pudo avanzar desde el paso ' + step)
  await waitForStep(mainWindow, step + 1)
}

async function fillArchitectureDraft(mainWindow) {
  await setField(mainWindow, 'Nombre del proyecto', 'Estudio Horizonte')
  await setField(mainWindow, '¿Qué necesitás construir?', 'Un sitio institucional para presentar servicios de arquitectura.')
  await advance(mainWindow, 1)
  await setField(mainWindow, 'Tipo de negocio', 'Estudio de arquitectura')
  await setField(mainWindow, '¿Para quién es?', 'Personas que buscan diseño residencial.')
  await setField(mainWindow, 'Propuesta', 'Diseñamos espacios habitables y duraderos.')
  await advance(mainWindow, 2)
  await setField(mainWindow, 'Colores', 'ivory, naranja quemado')
  await setField(mainWindow, 'Notas visuales', 'Editorial, cálido y sobrio')
  await advance(mainWindow, 3)
  assert.equal(await clickButton(mainWindow, 'Editorial'), true, 'No se pudo seleccionar Editorial')
  await advance(mainWindow, 4)
}

async function readReview(mainWindow) {
  return evaluate(mainWindow, '(() => { const fieldNames = ["project-name", "project-type", "need", "business-type", "audience", "proposition", "colors", "direction", "notes", "cta", "materials", "urls"]; const fields = Object.fromEntries(fieldNames.map((name) => [name, document.querySelector("[data-review-field=\\"" + name + "\\"]")?.innerText?.trim() || ""])); const fullValues = Object.fromEntries(fieldNames.map((name) => [name, document.querySelector("[data-review-field=\\"" + name + "\\"]")?.getAttribute("data-review-value") || ""])); const buttons = [...document.querySelectorAll(".jefe-wizard-actions button")].map((button) => { const rect = button.getBoundingClientRect(); return { label: (button.innerText || "").trim(), top: rect.top, bottom: rect.bottom } }); return { fields, fullValues, bodyText: document.body.innerText, documentElementScrollHeight: document.documentElement.scrollHeight, documentElementClientHeight: document.documentElement.clientHeight, bodyScrollHeight: document.body.scrollHeight, bodyClientHeight: document.body.clientHeight, scrollY: window.scrollY, viewport: { width: window.innerWidth, height: window.innerHeight }, buttons } })()')
}

export async function runElectronVisualE2E({ mainWindow, repoRoot }) {
  assert.equal(await evaluate(mainWindow, 'document.querySelector("#jefe-idea") !== null'), true, 'La pantalla Inicio no está disponible')
  await setControl(mainWindow, '#jefe-idea', 'Un sitio institucional para Estudio Horizonte.')
  assert.equal(await clickButton(mainWindow, 'Sitio web'), true, 'No se pudo seleccionar el tipo del draft A')
  assert.equal(await clickButton(mainWindow, 'Empezar'), true, 'No se pudo iniciar el draft A')
  await waitForStep(mainWindow, 1)
  await fillArchitectureDraft(mainWindow)
  assert.equal(await clickButton(mainWindow, 'Guardar borrador'), true, 'No se pudo persistir el draft A')
  assert.equal(await clickButton(mainWindow, 'Volver'), true, 'No se pudo volver a Inicio')
  await waitFor(mainWindow, 'document.querySelector("#jefe-idea") !== null', 'No se recuperó Inicio después del draft A')

  const homeAfterSave = await evaluate(mainWindow, 'document.body.innerText')
  assert.equal(homeAfterSave.includes('Estudio Horizonte'), false, 'El borrador A se mostró automáticamente en Inicio')
  assert.equal(homeAfterSave.includes('Continuar borrador'), true, 'No se ofreció recuperación explícita del borrador A')
  assert.equal(homeAfterSave.includes('Borrador guardado localmente.'), true, 'No se mostró feedback claro al guardar')

  await reload(mainWindow)
  const homeAfterRefresh = await evaluate(mainWindow, 'document.body.innerText')
  assert.equal(homeAfterRefresh.includes('Continuar borrador'), true, 'El borrador no sobrevivió F5')
  assert.equal(await clickButton(mainWindow, 'Continuar borrador'), true, 'No se pudo continuar el borrador A')
  await waitForStep(mainWindow, 5)
  const restoredDraft = await readReview(mainWindow)
  assert.equal(restoredDraft.fullValues.need.includes('Un sitio institucional para presentar servicios de arquitectura.'), true, 'No se restauró el brief del borrador A')
  assert.equal(restoredDraft.fullValues['business-type'].includes('Estudio de arquitectura'), true, 'No se restauró el negocio del borrador A')
  assert.equal(restoredDraft.fullValues.audience.includes('Personas que buscan diseño residencial.'), true, 'No se restauró la audiencia del borrador A')
  assert.equal(restoredDraft.fullValues.proposition.includes('Diseñamos espacios habitables y duraderos.'), true, 'No se restauró la propuesta del borrador A')
  assert.equal(restoredDraft.fullValues.colors.includes('ivory, naranja quemado'), true, 'No se restauraron los colores del borrador A')
  assert.equal(restoredDraft.fullValues.direction.includes('Editorial'), true, 'No se restauró la dirección del borrador A')
  assert.equal(await clickButton(mainWindow, 'Crear primera versión'), true, 'No se pudo crear la primera versión del borrador A')
  await waitFor(mainWindow, 'document.body.innerText.includes("Proyecto")', 'No se abrió el workspace después de crear la primera versión')
  const draftStorageAfterCreation = await evaluate(mainWindow, 'window.localStorage.getItem("jefe-commercial-draft-v1")')
  assert.equal(draftStorageAfterCreation, null, 'El borrador no se eliminó después de crear la primera versión')
  assert.equal(await clickButton(mainWindow, 'Proyectos'), true, 'No se pudo volver a Inicio después de crear la primera versión')
  await waitFor(mainWindow, 'document.querySelector("#jefe-idea") !== null', 'No se recuperó Inicio después de crear la primera versión')
  assert.equal((await evaluate(mainWindow, 'document.body.innerText')).includes('Continuar borrador'), false, 'El borrador siguió visible después de crear la primera versión')

  const floeBrief = 'Floe ayuda a empresas, organizaciones y profesionales con software, automatización y soporte confiable.'
  await setControl(mainWindow, '#jefe-idea', floeBrief)
  assert.equal(await clickButton(mainWindow, 'Sitio web'), true, 'No se pudo seleccionar el tipo del draft B')
  assert.equal(await clickButton(mainWindow, 'Empezar'), true, 'No se pudo iniciar el draft B')
  await waitForStep(mainWindow, 1)
  const emptyStart = await evaluate(mainWindow, '(() => ({ name: document.querySelector(".jefe-wizard-content input")?.value || "", bodyText: document.body.innerText }))()')
  assert.equal(emptyStart.name, '', 'El nombre del draft A contaminó el draft B')
  assert.equal(emptyStart.bodyText.includes('Estudio Horizonte'), false, 'El draft A apareció en el nuevo flujo')

  await setField(mainWindow, 'Nombre del proyecto', 'Floe')
  await setField(mainWindow, '¿Qué necesitás construir?', floeBrief)
  await advance(mainWindow, 1)
  const floeBusiness = 'Empresa de tecnología y soluciones digitales'
  const floeAudience = 'Empresas, organizaciones y profesionales'
  const floeProposition = 'Floe ofrece software, automatización y soporte para resolver operaciones digitales con claridad.'
  await setField(mainWindow, 'Tipo de negocio', floeBusiness)
  await setField(mainWindow, '¿Para quién es?', floeAudience)
  await setField(mainWindow, 'Propuesta', floeProposition)
  await advance(mainWindow, 2)
  await setField(mainWindow, 'Colores', 'azul noche, marfil y verde menta')
  await setField(mainWindow, 'Notas visuales', 'Editorial, claro, preciso y confiable')
  await advance(mainWindow, 3)
  assert.equal(await clickButton(mainWindow, 'Editorial'), true, 'No se pudo seleccionar la dirección de Floe')
  await advance(mainWindow, 4)

  const result = await readReview(mainWindow)
  const normalized = (value) => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
  const fields = result.fields
  const fullValues = result.fullValues
  assert.equal(normalized(fields['project-name']), normalized('Proyecto\nFloe'))
  assert.equal(normalized(fields['project-type']), normalized('Tipo de proyecto\nSitio web'))
  assert.equal(normalized(fullValues.need), normalized(floeBrief))
  assert.equal(normalized(fullValues['business-type']), normalized(floeBusiness))
  assert.equal(normalized(fullValues.audience), normalized(floeAudience))
  assert.equal(normalized(fullValues.proposition), normalized(floeProposition))
  assert.equal(normalized(fullValues.colors), normalized('azul noche, marfil y verde menta'))
  assert.equal(normalized(fullValues.direction), normalized('Editorial'))
  assert.equal(normalized(fullValues.urls), normalized('No se agregaron URLs'))
  for (const stale of ['Estudio Horizonte', 'Estudio de arquitectura', 'ivory, naranja quemado', 'estudio-horizonte.example', 'casa-lumen', 'factory-qa', 'agency_site', 'Aplicación', 'Producto digital', 'equipos creativos', 'pendientes dispersos', 'Comercial']) {
    assert.equal(result.bodyText.includes(stale), false, 'El draft B contiene dato ajeno o interno: ' + stale)
  }
  assert.equal(result.scrollY, 0, 'La revisión no inicia en scrollY=0: ' + JSON.stringify(result))
  assert.equal(result.documentElementScrollHeight, result.documentElementClientHeight, 'Scroll del documento en revisión: ' + JSON.stringify(result))
  assert.equal(result.bodyScrollHeight, result.bodyClientHeight, 'Scroll del body en revisión: ' + JSON.stringify(result))
  assert.equal(result.buttons.length > 0 && result.buttons.every((button) => button.top >= 0 && button.bottom <= result.viewport.height - 16), true, 'Acción recortada: ' + JSON.stringify(result))

  const generatorProjection = { projectName: 'Floe', brief: floeBrief, projectType: 'agency_site', businessType: floeBusiness, audience: floeAudience, proposition: floeProposition, creativeDirection: 'editorial', detectedHexColors: ['azul noche', 'marfil y verde menta'], urlReferences: [] }
  assert.equal(fields['project-name'].includes(generatorProjection.projectName), true)
  assert.equal(fullValues.need.includes(generatorProjection.brief), true)
  assert.equal(fields['project-type'].includes('Sitio web'), true)
  assert.equal(fullValues['business-type'].includes(generatorProjection.businessType), true)
  assert.equal(fullValues.audience.includes(generatorProjection.audience), true)
  assert.equal(fullValues.proposition.includes(generatorProjection.proposition), true)
  assert.equal(fullValues.colors.includes('azul noche'), true)
  assert.equal(fullValues.urls.includes('No se agregaron URLs'), true)
  assert.equal(fullValues.direction.includes('Editorial'), true)
  const hubModelSource = await fs.readFile(path.join(repoRoot, 'src', 'commercial', 'hubModel.ts'), 'utf8')
  for (const contract of ['brief: d.need', 'projectType: d.projectType', 'creativeDirection: d.direction', 'businessType: d.businessType', 'audience: d.audience', 'proposition: d.proposition']) {
    assert.equal(hubModelSource.includes(contract), true, 'payloadFromDraft no conserva ' + contract)
  }

  await mainWindow.webContents.executeJavaScript('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))', true)
  const capturedPng = (await mainWindow.webContents.capturePage()).toPNG()
  const screenshotPath = path.join(os.tmpdir(), 'jefe-commercial-draft-isolation-' + process.pid + '.png')
  await fs.writeFile(screenshotPath, capturedPng)
  result.capture = { method: 'Electron webContents.capturePage()', path: screenshotPath, bytes: capturedPng.byteLength }
  const report = { ok: true, smoke: 'jefe-commercial-draft-isolation', draftA: 'Estudio Horizonte', draftB: 'Floe', result }
  const reportPath = path.join(os.tmpdir(), 'jefe-commercial-draft-isolation-' + process.pid + '.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-commercial-draft-isolation', reportPath, result }))
}

export default runElectronVisualE2E
