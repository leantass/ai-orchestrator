import assert from 'node:assert/strict'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function evaluate(mainWindow, expression) {
  return mainWindow.webContents.executeJavaScript(expression, true)
}

async function waitFor(mainWindow, expression, message) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await evaluate(mainWindow, expression)) return
    await delay(50)
  }
  throw new Error(message)
}

export async function runElectronVisualE2E({ mainWindow }) {
  assert.equal(await evaluate(mainWindow, 'document.querySelector("#jefe-idea") !== null'), true, 'Inicio no esta disponible')
  const clicked = await evaluate(mainWindow, '(() => { const button = [...document.querySelectorAll("button")].find((item) => (item.innerText || "").trim() === "Proyectos" && !item.disabled); if (!button) return false; button.click(); return true })()')
  assert.equal(clicked, true, 'No se encontro el boton Proyectos')
  await waitFor(mainWindow, 'document.querySelector("[data-testid=projects-view]") !== null', 'La vista Proyectos no aparecio')
  const themeButton = await evaluate(mainWindow, 'document.querySelector(".jefe-theme-switch")')
  if (themeButton && !(await evaluate(mainWindow, 'document.querySelector(".jefe-theme-switch")?.innerText?.includes("oscuro") === true'))) {
    await evaluate(mainWindow, 'document.querySelector(".jefe-theme-switch")?.click()')
    await waitFor(mainWindow, 'document.querySelector(".jefe-theme-switch")?.innerText?.includes("oscuro") === true', 'No se pudo verificar el tema oscuro')
  }
  const state = await evaluate(mainWindow, '(() => { const buttons = [...document.querySelectorAll(".jefe-nav nav button")]; const projects = buttons.find((item) => (item.innerText || "").trim() === "Proyectos"); const home = buttons.find((item) => (item.innerText || "").trim() === "Inicio"); const visibleText = [...document.querySelectorAll("[data-testid=projects-view] *")].map((item) => (item.innerText || "").trim()).filter(Boolean); return { activeProjects: projects?.classList.contains("is-active") === true, activeHome: home?.classList.contains("is-active") === true, hasList: document.querySelector("[data-testid=projects-list]") !== null, hasEmpty: document.querySelector("[data-testid=projects-empty]") !== null, emptyTitle: visibleText.includes("Todav\\u00eda no hay proyectos."), emptyBody: visibleText.includes("Cuando crees tu primer proyecto comercial, va a aparecer ac\\u00e1."), newProject: [...document.querySelectorAll("[data-testid=projects-view] button")].some((item) => (item.innerText || "").trim() === "Nuevo proyecto \\u2192"), theme: document.querySelector(".jefe-theme-switch")?.innerText?.trim() || "", bodyText: document.body.innerText } })()')
  assert.equal(state.activeProjects, true, 'Proyectos no quedo activo')
  assert.equal(state.activeHome, false, 'Inicio siguio activo')
  assert.equal(state.hasList || state.hasEmpty, true, 'No aparecio lista ni estado vacio')
  assert.equal(state.newProject, true, 'El CTA no conserva la flecha UTF-8')
  assert.equal(state.theme, 'Tema actual: oscuro \u00b7 Cambiar a claro', 'El texto del tema no conserva UTF-8')
  if (state.hasEmpty) {
    assert.equal(state.emptyTitle, true, 'El estado vacio no conserva Todavia')
    assert.equal(state.emptyBody, true, 'El estado vacio no conserva aca')
  }
  assert.equal(state.bodyText.includes('Todos tus proyectos'), true, 'La vista no corresponde a Proyectos')
  assert.equal(state.bodyText.includes('Empeza por una idea'), false, 'La vista volvio silenciosamente a Inicio')
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-commercial-navigation', state }))
}

export default runElectronVisualE2E
