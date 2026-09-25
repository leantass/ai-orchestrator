import fs from 'node:fs/promises'
import path from 'node:path'

export default async function globalSetup() {
  const root = path.resolve(process.env.JEFE_QA_ROOT || '.codex-temp/autonomous-quality-closure/runs/local')
  if (process.env.JEFE_QA_PRESERVE === '1') return
  await fs.rm(root, { recursive: true, force: true })
  await fs.mkdir(path.join(root, 'screenshots'), { recursive: true })
}
