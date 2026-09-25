import fs from 'node:fs/promises'
import path from 'node:path'

export default async function globalSetup() {
  const root = path.resolve('.codex-temp/real-user-flow-v1b-e2e')
  await fs.rm(root, { recursive: true, force: true })
  await fs.mkdir(path.join(root, 'screenshots'), { recursive: true })
}
