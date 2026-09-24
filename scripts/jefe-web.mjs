import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createJefeWebServer } from '../electron/jefe-web-server.cjs'
import { createSemanticRuntimeComposition } from '../electron/jefe-semantic-runtime-composition.cjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || process.cwd(), 'AppData', 'Roaming')
const root = process.env.JEFE_WEB_DATA_ROOT ? path.resolve(process.env.JEFE_WEB_DATA_ROOT) : path.join(appData, 'ai-orchestrator', 'jefe-canonical-projects')
const port = Number.parseInt(process.env.JEFE_WEB_PORT || '17580', 10) || 17580
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)
const chromePath = chromeCandidates.find((candidate) => candidate && fs.existsSync(candidate))
const openBrowser = chromePath ? (url) => { const child = spawn(chromePath, [url], { detached: true, stdio: 'ignore', windowsHide: false }); child.unref() } : null
const semanticRuntime = createSemanticRuntimeComposition({ root, mode: 'productive' })
const runtime = createJefeWebServer({ root, distRoot: path.join(repoRoot, 'dist'), port, openBrowser: process.env.JEFE_WEB_NO_BROWSER === '1' ? null : openBrowser, semanticRuntimeAdapter: semanticRuntime.adapter })
await runtime.start()
const shutdown = async () => { await runtime.close(); process.exit(0) }
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown)
await new Promise(() => {})
