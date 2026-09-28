import { defineConfig } from '@playwright/test'
import path from 'node:path'

const root = path.resolve('.codex-temp/escalon-10d')
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /commercial-surfaces-10d\.spec\.ts$/u,
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:55132', browserName: 'chromium', headless: true, screenshot: 'only-on-failure' },
  outputDir: path.join(root, 'test-results'),
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 55132', url: 'http://127.0.0.1:55132/', reuseExistingServer: false, timeout: 30_000 },
})
