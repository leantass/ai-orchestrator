import { defineConfig } from '@playwright/test'
import path from 'node:path'

const root = path.resolve('.codex-temp/escalon-11a')
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /commercial-e2e-11a\.spec\.ts$/u,
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:55133', browserName: 'chromium', headless: true, screenshot: 'only-on-failure' },
  outputDir: path.join(root, 'playwright-results'),
  webServer: { command: 'node scripts/jefe-e2e-playwright-server.mjs', url: 'http://127.0.0.1:55133/', reuseExistingServer: false, timeout: 30_000 },
})
