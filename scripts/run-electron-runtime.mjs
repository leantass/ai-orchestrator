import { spawn } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const electronExecutablePath = require('electron')
const forwardedArgs = process.argv.slice(2)

const child = spawn(electronExecutablePath, [repoRoot, ...forwardedArgs], {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
  windowsHide: false,
})

child.on('error', (error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[run-electron-runtime] No se pudo abrir Electron: ${message}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[run-electron-runtime] Electron termino por signal ${signal}.`)
    process.exit(1)
  }

  process.exit(code ?? 0)
})
