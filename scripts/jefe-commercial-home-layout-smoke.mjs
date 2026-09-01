import assert from 'node:assert/strict'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function evaluate(mainWindow, expression) {
  return mainWindow.webContents.executeJavaScript(expression, true)
}

async function waitFor(mainWindow, expression, message) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate(mainWindow, expression)) return
    await delay(50)
  }
  throw new Error(message)
}

async function setViewport(mainWindow, width, height) {
  mainWindow.setContentSize(width, height)
  await waitFor(mainWindow, `window.innerWidth === ${width} && window.innerHeight === ${height}`, `Viewport no aplicado: ${width}x${height}`)
}

async function inspectDesktop(mainWindow, width, height) {
  await setViewport(mainWindow, width, height)
  const result = await evaluate(mainWindow, '(() => { const visible = (element) => { if (!element) return false; const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth && style.visibility !== "hidden" && style.display !== "none" }; const ideaBox = document.querySelector(".jefe-idea-box"); const actions = document.querySelector(".jefe-idea-actions"); const picker = document.querySelector(".jefe-type-picker"); const continuation = [...document.querySelectorAll(".jefe-idea-actions button")].find((item) => !item.classList.contains("jefe-attach") && !item.classList.contains("jefe-primary")); const types = [...document.querySelectorAll(".jefe-type-picker button")]; return { viewport: { width: window.innerWidth, height: window.innerHeight }, pageScroll: document.documentElement.scrollHeight === document.documentElement.clientHeight, bodyScroll: document.body.scrollHeight === document.body.clientHeight, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, bodyHorizontal: document.body.scrollWidth - document.body.clientWidth, cardActionsGap: ideaBox && actions ? ideaBox.getBoundingClientRect().bottom - actions.getBoundingClientRect().bottom : null, compactCard: Boolean(ideaBox && actions && ideaBox.getBoundingClientRect().bottom - actions.getBoundingClientRect().bottom <= 28), continuationOneLine: !continuation || continuation.getBoundingClientRect().height <= 44, selectorBottomMargin: Boolean(picker && window.innerHeight - picker.getBoundingClientRect().bottom >= 12), controls: { idea: visible(document.querySelector("#jefe-idea")), attach: visible(document.querySelector(".jefe-attach")), start: visible([...document.querySelectorAll("button")].find((item) => (item.innerText || "").trim().startsWith("Empezar"))), typePicker: visible(picker), types: types.length, allTypesVisible: types.length === 5 && types.every(visible) }, fixtures: /factory|fixture|smoke|qa-|test-/iu.test(document.body.innerText) } } })()')
  assert.equal(result.pageScroll, true, `Scroll vertical desktop en ${width}x${height}`)
  assert.equal(result.bodyScroll, true, `Scroll vertical del body en ${width}x${height}`)
  assert.equal(result.horizontal, 0, `Overflow horizontal desktop en ${width}x${height}`)
  assert.equal(result.bodyHorizontal, 0, `Overflow horizontal del body en ${width}x${height}`)
  assert.deepEqual(result.controls, { idea: true, attach: true, start: true, typePicker: true, types: 5, allTypesVisible: true }, `Controles fuera de viewport en ${width}x${height}`)
  assert.equal(result.compactCard, true, `La tarjeta Tu idea conserva espacio vacio en ${width}x${height}`)
  assert.equal(result.continuationOneLine, true, `Continuar borrador se parte en ${width}x${height}`)
  assert.equal(result.selectorBottomMargin, true, `El selector queda sin margen inferior en ${width}x${height}`)
  assert.equal(result.fixtures, false, `Fixture visible en ${width}x${height}`)
  return result
}

export async function runElectronVisualE2E({ mainWindow }) {
  await waitFor(mainWindow, 'document.querySelector("#jefe-idea") !== null', 'Inicio no aparecio')
  const desktop = []
  for (const [width, height] of [[1266, 658], [1280, 720], [1280, 820], [1440, 900], [1920, 1080]]) desktop.push(await inspectDesktop(mainWindow, width, height))

  const theme = async (expected, other) => {
    const current = await evaluate(mainWindow, 'document.querySelector(".jefe-theme-switch")?.innerText?.trim() || ""')
    if (current !== expected) {
      await evaluate(mainWindow, 'document.querySelector(".jefe-theme-switch")?.click()')
      await waitFor(mainWindow, `document.querySelector(".jefe-theme-switch")?.innerText?.trim() === ${JSON.stringify(expected)}`, `Tema no aplicado: ${expected}`)
    }
    assert.equal(await evaluate(mainWindow, 'document.querySelector(".jefe-theme-switch")?.innerText?.trim() || ""'), expected)
    assert.equal(expected.includes(other), false)
  }
  await theme('Tema actual: oscuro \u00b7 Cambiar a claro', 'Cambiar a oscuro')
  await theme('Tema actual: claro \u00b7 Cambiar a oscuro', 'Cambiar a claro')

  if (!mainWindow.webContents.debugger.isAttached()) mainWindow.webContents.debugger.attach('1.3')
  await mainWindow.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', { width: 390, height: 640, deviceScaleFactor: 1, mobile: false })
  await waitFor(mainWindow, 'window.innerWidth === 390 && window.innerHeight === 640', 'Viewport mobile no aplicado')
  const mobile = await evaluate(mainWindow, '({ verticalScrollAllowed: document.documentElement.scrollHeight >= document.documentElement.clientHeight, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, bodyHorizontal: document.body.scrollWidth - document.body.clientWidth })')
  assert.equal(mobile.verticalScrollAllowed, true, 'Mobile no conserva scroll vertical permitido')
  assert.equal(mobile.horizontal, 0, 'Mobile tiene overflow horizontal')
  assert.equal(mobile.bodyHorizontal, 0, 'Body mobile tiene overflow horizontal')
  await mainWindow.webContents.debugger.sendCommand('Emulation.clearDeviceMetricsOverride')
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-commercial-home-layout', desktop, mobile }))
}

export default runElectronVisualE2E
