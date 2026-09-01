import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'

const projectRoot = process.env.JEFE_ARTIFACT_ROOT || 'C:\\Users\\letas\\AppData\\Roaming\\ai-orchestrator\\jefe-canonical-projects\\floe-soluciones-digitales-mthf12zg'
const revisions = fs.readdirSync(projectRoot).filter((entry) => /^version-v\d+$/u.test(entry)).sort()
const artifactRoot = path.join(projectRoot, revisions.at(-1), 'app')
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const mime = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8' }

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const full = path.join(directory, entry.name); return entry.isDirectory() ? filesUnder(full) : [full] })
}
function smokePage() {
  return `<!doctype html><meta charset="utf-8"><style>html,body,#site{margin:0;width:100vw;height:100vh;border:0}</style><iframe id="site" src="/"></iframe><pre id="result">pending</pre><script>const frame=document.querySelector('#site');frame.onload=()=>{try{const d=frame.contentDocument,w=frame.contentWindow,body=d.body;const nav=[...d.querySelectorAll('.site-nav a')].map(a=>a.textContent.trim());const horizontal=d.documentElement.scrollWidth-d.documentElement.clientWidth;d.querySelector('a[href="#servicios"]').click();const hash=w.location.hash;const theme=d.querySelector('.theme-toggle');theme.click();const dark=d.documentElement.dataset.theme;theme.click();const light=d.documentElement.dataset.theme||'light';const faq=d.querySelector('#faq details');faq.querySelector('summary').click();const form=d.querySelector('#primary-contact');form.querySelector('button').click();const invalid=d.querySelector('.form-feedback').textContent;form.elements.name.value='Prueba';form.elements.email.value='prueba@example.com';form.querySelector('button').click();const valid=d.querySelector('.form-feedback').textContent;document.querySelector('#result').textContent=JSON.stringify({title:d.title,nav,horizontal,hash,dark,light,faqOpen:faq.open,invalid,valid,services:['Desarrollo de software','Automatización de procesos','Soporte tecnológico','Transformación digital'].every(t=>body.innerText.includes(t)),errors:[]});}catch(error){document.querySelector('#result').textContent=JSON.stringify({error:String(error)});}};</script>`
}
function runChrome(args) {
  return new Promise((resolve) => { const child = spawn(chromePath, args, { encoding: 'utf8' }); let stdout = ''; let stderr = ''; const timer = setTimeout(() => child.kill(), 8000); child.stdout.on('data', (chunk) => { stdout += chunk.toString() }); child.stderr.on('data', (chunk) => { stderr += chunk.toString() }); child.on('close', (status) => { clearTimeout(timer); resolve({ status: status ?? 0, stdout, stderr }) }) })
}
const server = http.createServer((request, response) => {
  if (new URL(request.url, 'http://127.0.0.1').pathname === '/__smoke__') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(smokePage()); return }
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); const file = path.resolve(artifactRoot, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (!file.startsWith(path.resolve(artifactRoot) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(response)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${server.address().port}/__smoke__`
try {
  for (const file of filesUnder(artifactRoot)) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\b(?:electron|preload|ipc)\b|file:\/\//iu, `Referencia prohibida en ${file}`)
  assert.ok(fs.existsSync(path.join(artifactRoot, 'index.html')), 'No existe index.html del artifact'); assert.ok(fs.existsSync(chromePath), `Chrome no encontrado en ${chromePath}`)
  for (const [width, height] of [[1266, 658], [1280, 720], [1280, 820], [1440, 900], [1920, 1080], [390, 844]]) {
    const profile = path.join(process.env.TEMP || process.env.TMP || '.', `jefe-browser-${process.pid}-${width}`); const result = await runChrome(['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--virtual-time-budget=1200', '--dump-dom', url]); fs.rmSync(profile, { recursive: true, force: true })
    assert.equal(result.status, 0, `Chrome falló en ${width}x${height}: ${result.stderr}`); const match = result.stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/u); assert.ok(match, `Smoke sin resultado en ${width}x${height}`); const data = JSON.parse(match[1].replaceAll('&quot;', '"'))
    assert.equal(data.error, undefined, `Error de runtime en ${width}x${height}: ${data.error || ''}`); assert.deepEqual(data.nav, ['Relato', 'Servicios', 'Confianza', 'FAQ', 'Contacto']); assert.equal(data.horizontal, 0, `Overflow horizontal en ${width}x${height}`); assert.equal(data.hash, '#servicios'); assert.equal(data.dark, 'dark'); assert.equal(data.light, 'light'); assert.equal(data.faqOpen, true); assert.equal(data.services, true); assert.match(data.invalid, /nombre y email/u); assert.match(data.valid, /localmente/u)
  }
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-commercial-browser', artifact: artifactRoot, url, chrome: chromePath }))
} finally { server.close() }
