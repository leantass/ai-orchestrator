import fs from 'node:fs/promises'
import path from 'node:path'
import { createJefeWebServer } from '../electron/jefe-web-server.cjs'

const root = path.resolve('.codex-temp/escalon-11b/browser-runtime')
await fs.rm(root, { recursive: true, force: true })
await fs.mkdir(root, { recursive: true })
const server = createJefeWebServer({ root, distRoot: path.resolve('dist'), port: 55134 })
await server.start()
const stop = async () => { await server.close(); process.exit(0) }
process.once('SIGTERM', stop); process.once('SIGINT', stop)
setInterval(() => {}, 1000)
