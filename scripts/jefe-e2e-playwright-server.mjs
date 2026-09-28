import fs from 'node:fs/promises'
import path from 'node:path'
import { createJefeWebServer } from '../electron/jefe-web-server.cjs'

const root = path.resolve('.codex-temp/escalon-11a/playwright-runtime')
await fs.rm(root, { recursive: true, force: true })
await fs.mkdir(root, { recursive: true })
const server = createJefeWebServer({ root, distRoot: path.resolve('dist'), port: 55133 })
await server.start()
const close = async () => { await server.close(); process.exit(0) }
process.once('SIGTERM', () => void close())
process.once('SIGINT', () => void close())
setInterval(() => {}, 60_000)
