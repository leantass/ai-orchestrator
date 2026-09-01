import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { servePreview, closePreviewServers } = require('../electron/jefe-preview-http-server.cjs');
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const output = 'C:\\Users\\letas\\Desktop\\jefe-web-v1-master-review';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-evidence-profile-'));
const probe = path.join(profile, 'selected-material.txt');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const freePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)) }) });
await fs.mkdir(output, { recursive: true });
for (const file of await fs.readdir(output)) if (file.endsWith('.png')) await fs.rm(path.join(output, file), { force: true });
await fs.writeFile(probe, 'evidence-only selection\n', 'utf8');
const port = await freePort();
const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=1440,900', 'http://127.0.0.1:17580/'], { stdio: 'ignore', windowsHide: true });
const consoleErrors = []; const pageErrors = []; const failedRequests = []; let socket; let id = 0; const pending = new Map();
async function findPage() { for (let i = 0; i < 60; i += 1) { try { const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()); const page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) return page; } catch {} await wait(200); } throw new Error('No se obtuvo página CDP.'); }
try {
  const page = await findPage(); socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) });
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message.result) } if (message.method === 'Runtime.exceptionThrown') pageErrors.push(message.params.exceptionDetails?.text || 'Runtime exception'); if (message.method === 'Log.entryAdded' && ['error', 'assert'].includes(message.params.entry.level)) consoleErrors.push(message.params.entry.text); if (message.method === 'Network.loadingFailed') failedRequests.push(message.params.errorText || message.params.requestId) });
  const command = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) });
  const evaluate = (expression) => command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  await command('Runtime.enable'); await command('Log.enable'); await command('Network.enable');
  async function navigate(url) { await command('Page.navigate', { url }); await wait(4500); }
  async function capture(name, width = 1440, height = 900) { await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); await wait(500); const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true }); await fs.writeFile(path.join(output, `${name}.png`), Buffer.from(screenshot.data, 'base64')); const data = (await evaluate(`(() => ({ url: location.href, title: document.title, text: document.body.innerText, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight }))()`)).result.value; return { name, width, height, ...data }; }
  async function click(text) { await evaluate(`(() => { const node = [...document.querySelectorAll('button,a')].find((item) => item.innerText.trim() === ${JSON.stringify(text)}); node?.click(); return Boolean(node); })()`); await wait(800); }
  async function setFile() { const root = (await command('DOM.getDocument')).root.nodeId; const node = (await command('DOM.querySelector', { nodeId: root, selector: 'input[type=file]' })).nodeId; if (!node) throw new Error('No se encontró input de archivo.'); await command('DOM.setFileInputFiles', { nodeId: node, files: [probe] }); await wait(500); }
  const report = [];
  await navigate('http://127.0.0.1:17580/'); report.push(await capture('01-home')); await click('Proyectos'); report.push(await capture('02-projects'));
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); report.push(await capture('03-workspace-resumen')); await click('Construir'); report.push(await capture('04-workspace-construir')); await click('Materiales'); report.push(await capture('05-workspace-materiales')); await setFile(); report.push(await capture('08-input-assets-web')); await click('Versiones y entrega'); report.push(await capture('06-workspace-versiones'));
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); await click('Abrir preview real ↗'); await wait(1200); const fallback = (await evaluate("Boolean(document.querySelector('.jefe-preview-fallback'))")).result.value; if (fallback) await click('Abrir preview en otra pestaña'); report.push(await capture('07-human-gate-ready'));
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); report.push(await capture('09-deep-link-direct')); await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006?refresh=1'); report.push(await capture('10-after-refresh'));
  await navigate('http://127.0.0.1:17580/projects'); await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await wait(800); report.push(await capture('12-mobile-projects', 390, 844)); await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); await wait(1800); report.push(await capture('13-mobile-workspace', 390, 844)); await click('Materiales'); report.push(await capture('14-mobile-materiales', 390, 844));
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); await click('Abrir preview real ↗'); await wait(1000); if ((await evaluate("Boolean(document.querySelector('.jefe-preview-fallback'))")).result.value) await click('Abrir preview en otra pestaña'); report.push(await capture('15-mobile-human-gate', 390, 844));
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); report.push(await capture('16-tablet-workspace', 768, 1024));
  const versionRoot = path.join(process.env.APPDATA, 'ai-orchestrator', 'jefe-canonical-projects', 'vetnova-barrio', 'version-v0006'); const served = await servePreview(versionRoot); await navigate(`${served.url}app/index.html`); report.push(await capture('17-external-preview'));
  await fs.writeFile(path.join(output, 'browser-report.json'), `${JSON.stringify({ ok: true, generatedAt: new Date().toISOString(), report, consoleErrors, pageErrors, failedRequests, externalPreview: `${served.url}app/index.html` }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ok: true, output, captures: report.map((item) => item.name), consoleErrors, pageErrors, failedRequests, externalPreview: `${served.url}app/index.html` }));
} finally { try { socket?.send(JSON.stringify({ id: ++id, method: 'Browser.close' })) } catch {} await wait(800); try { socket?.close() } catch {}; child.kill(); await closePreviewServers(); await fs.rm(profile, { recursive: true, force: true }).catch(() => {}) }
