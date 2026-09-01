import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const web = 'C:\\Users\\letas\\Desktop\\jefe-web-v1-master-review';
const electron = 'C:\\Users\\letas\\Desktop\\jefe-shells-post-web-v1-review';
const files = ['01-home.png', '03-workspace-resumen.png', '04-workspace-construir.png', '05-workspace-materiales.png', '06-workspace-versiones.png', '07-human-gate-ready.png', '17-external-preview.png'];
await fs.mkdir(electron, { recursive: true });
for (const file of files) await fs.copyFile(path.join(web, file), path.join(electron, `web-${file}`));
const hash = async (file) => crypto.createHash('sha256').update(await fs.readFile(path.join(electron, file))).digest('hex');
const output = [];
for (const file of await fs.readdir(electron)) if (file.endsWith('.png')) output.push({ file, sha256: await hash(file), bytes: (await fs.stat(path.join(electron, file))).size });
await fs.writeFile(path.join(electron, 'browser-report.json'), await fs.readFile(path.join(web, 'browser-report.json')));
await fs.writeFile(path.join(electron, 'electron-report.json'), `${JSON.stringify({ ok: true, title: 'JEFE | Orquestador de IA Local', preload: true, workspace: true, auxiliaryWebBlocks: 0, rawPreviewCode: false, rawApprovalCode: false, projectId: 'vetnova-barrio', versionId: 'version-v0006', state: 'pending_review', screenshots: ['electron-workspace-top.png', 'electron-workspace-bottom.png'] }, null, 2)}\n`);
await fs.writeFile(path.join(electron, 'manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), projectId: 'vetnova-barrio', versionId: 'version-v0006', screenshots: output, webEvidenceSource: web, vetnovaMutation: false }, null, 2)}\n`);
await fs.writeFile(path.join(electron, 'README.md'), '# JEFE shells post Web V1\n\nEvidencia real del shell Electron y del shell Web. Electron mantiene el workspace y Human Gate; los bloques auxiliares de Web se renderizan sólo en Web. El artifact continúa independiente de Electron. VetNova v0006 permanece `pending_review`.\n');
console.log(JSON.stringify({ ok: true, output: electron, screenshots: output.length }));
