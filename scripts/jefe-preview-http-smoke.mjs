import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { servePreview, closePreviewServers, resolveStaticFile } = require('../electron/jefe-preview-http-server.cjs')
const versionRoot = 'C:\\Users\\letas\\AppData\\Roaming\\ai-orchestrator\\jefe-canonical-projects\\floe-soluciones-digitales-mthf12zg\\version-v0004'
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const runChrome = (url) => new Promise((resolve) => { const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'jefe-preview-http-smoke-')); const child = spawn(chromePath, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--dump-dom', url], { stdio: ['ignore', 'pipe', 'pipe'] }); let stdout = ''; let stderr = ''; const timer = setTimeout(() => child.kill(), 8000); child.stdout.on('data', (chunk) => { stdout += chunk.toString() }); child.stderr.on('data', (chunk) => { stderr += chunk.toString() }); child.on('close', (status) => { clearTimeout(timer); fs.rmSync(profile, { recursive: true, force: true }); resolve({ status: status ?? 0, stdout, stderr }) }) })

assert.equal(fs.existsSync(path.join(versionRoot, 'app', 'index.html')), true)
assert.equal(resolveStaticFile(path.resolve(versionRoot), '/app/index.html'), path.resolve(versionRoot, 'app', 'index.html'))
assert.equal(resolveStaticFile(path.resolve(versionRoot), '/../manifest.json'), null)
const server = await servePreview(versionRoot)
try {
  assert.equal(new URL(server.url).hostname, '127.0.0.1')
  const replay = await servePreview(versionRoot); assert.equal(replay.port, server.port)
  const base = `${server.url}app/`; const html = await (await fetch(`${base}index.html`)).text(); const css = await (await fetch(`${base}styles.css`)).text(); const js = await (await fetch(`${base}app.js`)).text()
  assert.match(html, /<title>Floe \| Soluciones digitales<\/title>/u); assert.match(html, /href="\.\/styles\.css"/u); assert.match(html, /src="\.\/app\.js"/u); assert.match(css, /--primary:/u); assert.match(js, /querySelector/u)
  assert.equal((await fetch(`${server.url}%2e%2e%2fmanifest.json`)).status, 404)
  assert.ok(fs.existsSync(chromePath), `Chrome no encontrado en ${chromePath}`)
  const browser = await runChrome(`${base}index.html`); assert.equal(browser.status, 0, browser.stderr); assert.match(browser.stdout, /<title>Floe \| Soluciones digitales<\/title>/u); assert.match(browser.stdout, /Cambiar tema/u)
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-preview-http', url: `${base}index.html`, port: server.port, browser: chromePath, reused: true }))
} finally { await closePreviewServers() }
