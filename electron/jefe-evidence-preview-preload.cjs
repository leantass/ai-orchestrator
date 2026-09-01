const { ipcRenderer } = require('electron')

const THEMES = new Set(['light', 'dark'])

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight }
}

function scrollPosition() {
  return { x: window.scrollX, y: window.scrollY }
}

function identityIsComplete(identity) {
  return Boolean(identity) && ['projectId', 'runId', 'versionId', 'resourceId'].every((key) => typeof identity[key] === 'string' && identity[key].length > 0)
}

function acknowledge(channel, identity, extra = {}) {
  if (!identityIsComplete(identity)) return
  ipcRenderer.send(channel, { identity, viewport: viewport(), scroll: scrollPosition(), ...extra })
}

ipcRenderer.on('jefe-evidence-preview:read-state', (_event, payload = {}) => {
  acknowledge('jefe-evidence-preview:state-ready', payload.identity, {
    theme: document.documentElement.dataset.theme || 'light',
    documentTheme: document.documentElement.dataset.theme || 'light',
  })
})

ipcRenderer.on('jefe-evidence-preview:set-theme', (_event, payload = {}) => {
  if (!identityIsComplete(payload.identity) || !THEMES.has(payload.theme)) return
  const scrollX = Number.isFinite(payload.scroll?.x) ? payload.scroll.x : window.scrollX
  const scrollY = Number.isFinite(payload.scroll?.y) ? payload.scroll.y : window.scrollY
  document.documentElement.dataset.theme = payload.theme
  document.documentElement.style.colorScheme = payload.theme
  window.scrollTo(scrollX, scrollY)
  requestAnimationFrame(() => requestAnimationFrame(() => acknowledge('jefe-evidence-preview:theme-ready', payload.identity, {
    theme: payload.theme,
    documentTheme: document.documentElement.dataset.theme || '',
  })))
})
