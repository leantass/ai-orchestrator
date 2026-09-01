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
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-evidence-states-'));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const freePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)) }) });
const pageFor = async (port) => { for (let i = 0; i < 60; i += 1) { try { const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()); const page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) return page } catch {} await wait(200) } throw new Error('CDP no disponible') };

async function captureState(name, url, width, height, action) {
  const port = await freePort(); const profile = await fs.mkdtemp(path.join(temp, name));
  const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=1440,900', url], { stdio: 'ignore', windowsHide: true });
  let socket; let id = 0; const pending = new Map(); const errors = [];
  try {
    const page = await pageFor(port); socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) });
    socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message.result) } if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.text || 'runtime exception'); if (message.method === 'Network.loadingFailed') errors.push(message.params.errorText || 'request failed') });
    const command = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) });
    const evaluate = (expression) => command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    await command('Runtime.enable'); await command('Network.enable'); await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); await wait(3500);
    if (action) await action({ command, evaluate }); await wait(500);
    const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true }); await fs.writeFile(path.join(output, `${name}.png`), Buffer.from(screenshot.data, 'base64'));
    const data = (await evaluate(`(() => ({ url: location.href, title: document.title, text: document.body.innerText, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth }))()`)).result.value;
    return { name, width, height, ...data, errors };
  } finally { try { socket?.send(JSON.stringify({ id: ++id, method: 'Browser.close' })) } catch {} await wait(350); try { socket?.close() } catch {}; child.kill() }
}

await fs.mkdir(output, { recursive: true });
for (const file of await fs.readdir(output)) if (file.endsWith('.png')) await fs.rm(path.join(output, file), { force: true });
const base = 'http://127.0.0.1:17580'; const workspace = `${base}/projects/vetnova-barrio/versions/version-v0006`;
const click = (label) => async ({ evaluate }) => { await evaluate(`(() => { const node = [...document.querySelectorAll('button,a')].find((item) => item.innerText.trim() === ${JSON.stringify(label)}); node?.click(); return Boolean(node); })()`); };
const states = [
  ['01-home', `${base}/`, 1440, 900], ['02-projects', `${base}/projects`, 1440, 900],
  ['03-workspace-resumen', workspace, 1440, 900], ['11-memory-qa', workspace, 1440, 900], ['04-workspace-construir', workspace, 1440, 900, click('Construir')],
  ['05-workspace-materiales', workspace, 1440, 900, click('Materiales')], ['06-workspace-versiones', workspace, 1440, 900, click('Versiones y entrega')],
  ['07-human-gate-ready', workspace, 1440, 900, click('Abrir preview real ↗')],
  ['09-deep-link-direct', workspace, 1440, 900], ['10-after-refresh', `${workspace}?refresh=1`, 1440, 900],
  ['12-mobile-projects', `${base}/projects`, 390, 844], ['13-mobile-workspace', workspace, 390, 844],
  ['14-mobile-materiales', workspace, 390, 844, click('Materiales')], ['15-mobile-human-gate', workspace, 390, 844, click('Abrir preview real ↗')],
  ['16-tablet-workspace', workspace, 768, 1024]
];
const report = [];
for (const [name, url, width, height, action] of states) report.push(await captureState(name, url, width, height, action));
const inputFile = path.join(temp, 'selected-material.exe'); await fs.writeFile(inputFile, 'evidence-only invalid asset\n', 'utf8');
report.push(await captureState('08-input-assets-web', workspace, 1440, 900, async ({ command }) => { const root = (await command('DOM.getDocument')).root.nodeId; const node = (await command('DOM.querySelector', { nodeId: root, selector: 'input[type=file]' })).nodeId; await command('DOM.setFileInputFiles', { nodeId: node, files: [inputFile] }) }));
const served = await servePreview(path.join(process.env.APPDATA, 'ai-orchestrator', 'jefe-canonical-projects', 'vetnova-barrio', 'version-v0006'));
report.push(await captureState('17-external-preview', `${served.url}app/index.html`, 1440, 900));
await fs.writeFile(path.join(output, 'browser-report.json'), `${JSON.stringify({ ok: true, generatedAt: new Date().toISOString(), report, consoleErrors: report.flatMap((item) => item.errors), pageErrors: [], failedRequests: report.flatMap((item) => item.errors), externalPreview: `${served.url}app/index.html` }, null, 2)}\n`, 'utf8');
await closePreviewServers(); await fs.rm(temp, { recursive: true, force: true }).catch(() => {});
console.log(JSON.stringify({ ok: true, captures: report.map((item) => item.name), consoleErrors: report.flatMap((item) => item.errors) }));
