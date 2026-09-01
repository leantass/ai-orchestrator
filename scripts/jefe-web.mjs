import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createJefeWebServer } from '../electron/jefe-web-server.cjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || process.cwd(), 'AppData', 'Roaming')
const root = path.join(appData, 'ai-orchestrator', 'jefe-canonical-projects')
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)
const chromePath = chromeCandidates.find((candidate) => candidate && fs.existsSync(candidate))
const openBrowser = chromePath ? (url) => { const child = spawn(chromePath, [url], { detached: true, stdio: 'ignore', windowsHide: false }); child.unref() } : null
const runtime = createJefeWebServer({ root, distRoot: path.join(repoRoot, 'dist'), port: 17580, openBrowser })
await runtime.start()
const shutdown = async () => { await runtime.close(); process.exit(0) }
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown)
await new Promise(() => {})
