import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'

const artifactRoot = process.env.JEFE_ARTIFACT_ROOT
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const mime = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8' }
function runChrome(args) { return new Promise((resolve) => { const child = spawn(chromePath, args, { stdio: ['ignore', 'pipe', 'pipe'] }); let stdout = ''; let stderr = ''; const timer = setTimeout(() => child.kill(), 10000); child.stdout.on('data', (chunk) => { stdout += chunk }); child.stderr.on('data', (chunk) => { stderr += chunk }); child.on('close', (status) => { clearTimeout(timer); resolve({ status: status ?? 0, stdout, stderr }) }) }) }
const smokeHtml = '<!doctype html><meta charset="utf-8"><iframe id="site" src="/"></iframe><pre id="result">pending</pre><script>const frame=document.querySelector("#site");frame.onload=()=>{const d=frame.contentDocument,t=d.querySelector(".theme-toggle");t.click();const dark=d.documentElement.dataset.theme;t.click();const f=d.querySelector("#faq details");f.querySelector("summary").click();const form=d.querySelector("#primary-contact");form.querySelector("button").click();document.querySelector("#result").textContent=JSON.stringify({dark,services:d.querySelectorAll(".benefit-card h3").length,faq:f.open,inputs:d.querySelectorAll("input").length,buttons:d.querySelectorAll("button").length,horizontal:d.documentElement.scrollWidth-d.documentElement.clientWidth,feedback:d.querySelector(".form-feedback")?.textContent||""})}</script>'
const server = http.createServer((request, response) => { const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname); if (pathname === '/__smoke__') { response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); response.end(smokeHtml); return } const file = path.resolve(artifactRoot, pathname === '/' ? 'index.html' : `.${pathname}`); if (!file.startsWith(path.resolve(artifactRoot) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return } response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(response) })
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${server.address().port}/`
try {
  assert.ok(artifactRoot && fs.existsSync(path.join(artifactRoot, 'index.html')))
  for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
    const profile = path.join(process.env.TEMP || process.env.TMP || '.', `jefe-vetnova-${process.pid}-${width}`)
    const probe = `javascript:(()=>{const d=document,w=window;const t=document.querySelector('.theme-toggle');t.click();const dark=d.documentElement.dataset.theme;t.click();const light=d.documentElement.dataset.theme||'light';const f=document.querySelector('#faq details');f.querySelector('summary').click();const form=document.querySelector('#primary-contact');form.querySelector('button').click();document.title=JSON.stringify({dark,light,hash:w.location.hash,services:document.querySelectorAll('.benefit-card h3').length,faq:f.open,inputs:document.querySelectorAll('input').length,buttons:document.querySelectorAll('button').length,horizontal:d.documentElement.scrollWidth-d.documentElement.clientWidth,invalid:document.querySelector('.form-feedback')?.textContent||''})})()`
    const result = await runChrome(['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--virtual-time-budget=1500', '--dump-dom', `${url}__smoke__`])
    fs.rmSync(profile, { recursive: true, force: true }); assert.equal(result.status, 0, result.stderr); const match = result.stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/u); assert.ok(match); const data = JSON.parse(match[1]); assert.equal(data.dark, 'dark'); assert.ok(data.services >= 6); assert.equal(data.faq, true); assert.equal(data.inputs, 2); assert.equal(data.horizontal, 0); assert.match(data.feedback, /nombre y email/u); assert.doesNotMatch(result.stdout, /Electron|preload|ipc|file:\/\//iu)
  }
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-vetnova-browser', artifactRoot, url, chrome: chromePath, viewports: 4 }, null, 2))
} finally { server.close() }
