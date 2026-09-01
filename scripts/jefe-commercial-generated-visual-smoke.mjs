import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function runElectronVisualE2E({ mainWindow, repoRoot }) {
  const projectRoot = path.join('C:', 'Users', 'letas', 'AppData', 'Roaming', 'ai-orchestrator', 'jefe-canonical-projects', 'floe-soluciones-digitales-mthf12zg')
  const versions = fs.readdirSync(projectRoot).filter((entry) => /^version-v\d+$/u.test(entry)).sort()
  const latest = versions.at(-1)
  assert.ok(latest, 'No hay una revisión generada para auditar')
  const artifactRoot = path.join(projectRoot, latest)
  const html = fs.readFileSync(path.join(artifactRoot, 'app', 'index.html'), 'utf8')
  const css = fs.readFileSync(path.join(artifactRoot, 'app', 'styles.css'), 'utf8')
  assert.equal(/orange|terracotta|terracota|marrón|magenta/iu.test(`${html}\n${css}`), false, 'La revisión conserva una paleta prohibida')
  assert.equal(/\.{2,}|…/u.test(html), false, 'El HTML contiene truncamiento o puntuación incompleta')
  await mainWindow.loadFile(path.join(artifactRoot, 'app', 'index.html'))
  const results = []
  for (const [theme, width, height] of [['light', 1266, 658], ['dark', 1266, 658], ['light', 390, 844], ['dark', 390, 844]]) {
    mainWindow.setContentSize(width, height)
    await delay(80)
    await mainWindow.webContents.executeJavaScript(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}; document.querySelector('.theme-toggle')?.setAttribute('aria-pressed', String(${theme === 'dark'}))`, true)
    const result = await mainWindow.webContents.executeJavaScript(`(() => { const text = document.body.innerText; const nav = [...document.querySelectorAll('.site-nav a')].map((item) => item.innerText.trim()); const services = ['Desarrollo de software', 'Automatización de procesos', 'Soporte tecnológico', 'Transformación digital']; const audience = 'Empresas, organizaciones y profesionales que necesitan desarrollar software, automatizar procesos o mejorar su soporte tecnológico.'; const header = document.querySelector('.site-nav')?.getBoundingClientRect(); const horizontal = document.documentElement.scrollWidth - document.documentElement.clientWidth; const hero = document.querySelector('.site-hero')?.getBoundingClientRect(); return { theme: document.documentElement.dataset.theme || 'light', viewport: { width: innerWidth, height: innerHeight }, nav, services: services.every((item) => text.includes(item)), faq: document.querySelectorAll('#faq details').length, audienceCount: text.split(audience).length - 1, headerBottom: header?.bottom || 0, heroHeight: hero?.height || 0, horizontal, bodyText: text } })()`, true)
    assert.deepEqual(result.nav, ['Relato', 'Servicios', 'Confianza', 'FAQ', 'Contacto'])
    assert.equal(result.services, true, `Servicios incompletos en ${theme} ${width}x${height}`)
    assert.equal(result.faq >= 4, true, `FAQ incompleto en ${theme} ${width}x${height}`)
    assert.equal(result.audienceCount, 1, `Audiencia repetida en ${theme} ${width}x${height}`)
    assert.equal(result.horizontal, 0, `Overflow horizontal en ${theme} ${width}x${height}`)
    assert.equal(result.bodyText.includes('..'), false, `Puntuación incompleta en ${theme} ${width}x${height}`)
    for (const anchor of ['relato', 'servicios', 'confianza', 'faq', 'contacto']) {
      await mainWindow.webContents.executeJavaScript(`document.getElementById(${JSON.stringify(anchor)})?.scrollIntoView()`, true)
      await delay(30)
      const overlap = await mainWindow.webContents.executeJavaScript(`(() => { const header = document.querySelector('.site-nav')?.getBoundingClientRect(); const section = document.getElementById(${JSON.stringify(anchor)})?.getBoundingClientRect(); return { headerBottom: header?.bottom || 0, sectionTop: section?.top || 0 } })()`, true)
      assert.equal(overlap.sectionTop >= overlap.headerBottom - 2, true, `Header superpone ${anchor} en ${theme} ${width}x${height}`)
    }
    const image = await mainWindow.webContents.capturePage()
    assert.equal(image.isEmpty(), false, `Captura vacía en ${theme} ${width}x${height}`)
    results.push({ theme, width, height, bytes: image.toPNG().byteLength, heroHeight: result.heroHeight, faq: result.faq })
  }
  const report = { ok: true, smoke: 'jefe-commercial-generated-visual', revision: latest, repoRoot, results }
  await fs.promises.writeFile(path.join(os.tmpdir(), `jefe-commercial-generated-visual-${process.pid}.json`), `${JSON.stringify(report)}\n`, 'utf8')
  console.log(JSON.stringify(report))
}

export default runElectronVisualE2E
