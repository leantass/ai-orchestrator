import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)
const source = 'C:\\Users\\letas\\Desktop\\jefe-web-final-ux-review'
const electron = 'C:\\Users\\letas\\Desktop\\jefe-shells-post-web-v1-review'
const staging = 'C:\\Users\\letas\\Desktop\\jefe-web-final-ux-review-package'
const zip = 'C:\\Users\\letas\\Desktop\\jefe-web-final-ux-review.zip'
await fs.rm(staging, { recursive: true, force: true }); await fs.mkdir(staging, { recursive: true })
const webFiles = ['01-workspace-resumen.png', '02-workspace-materiales.png', '03-workspace-memoria-qa.png', '04-mobile-materiales.png', 'web-final-ux-report.json']
const electronFiles = ['electron-workspace-top.png', 'electron-workspace-bottom.png']
for (const file of webFiles) await fs.copyFile(path.join(source, file), path.join(staging, file))
for (const file of electronFiles) await fs.copyFile(path.join(electron, file), path.join(staging, file))
const files = [...webFiles, ...electronFiles]; const manifest = { projectId: 'vetnova-barrio', versionId: 'version-v0006', immutable: true, approvalAction: 'none', electron: { title: 'JEFE | Orquestador de IA Local', preload: true, auxiliaryWebBlocks: 0 }, files: {} }
for (const file of files) manifest.files[file] = { bytes: (await fs.stat(path.join(staging, file))).size, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(staging, file))).digest('hex') }
await fs.writeFile(path.join(staging, 'README.md'), '# JEFE final UX review\n\nEvidencia real de la integración visual del workspace Web y la ausencia de bloques Web auxiliares en Electron. VetNova v0006 no fue cargada, aprobada, rechazada ni modificada. No contiene perfiles Chrome ni artifacts físicos.\n')
await fs.writeFile(path.join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2))
await run('powershell.exe', ['-NoProfile', '-Command', `Remove-Item -LiteralPath '${zip}' -Force -ErrorAction SilentlyContinue; Compress-Archive -LiteralPath '${staging}\\*' -DestinationPath '${zip}' -CompressionLevel Optimal`])
console.log(JSON.stringify({ ok: true, zip, files: files.length + 2 }))
