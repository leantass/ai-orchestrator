import { defineConfig } from '@playwright/test'
import path from 'node:path'

const root = path.resolve('.codex-temp/escalon-10b')
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /commercial-navigation-10b\.spec\.ts$/u,
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:55130', browserName: 'chromium', headless: true, screenshot: 'only-on-failure' },
  outputDir: path.join(root, 'test-results'),
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 55130', url: 'http://127.0.0.1:55130/', reuseExistingServer: false, timeout: 30_000 },
})
