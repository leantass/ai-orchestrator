import { defineConfig } from '@playwright/test'
import path from 'node:path'

const qaRoot = path.resolve(process.env.JEFE_QA_ROOT || '.codex-temp/autonomous-quality-closure/runs/local')
const qaAppData = path.join(qaRoot, 'appdata')
const qaPort = 55129

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  timeout: 8 * 60 * 1000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  globalSetup: path.resolve('tests/e2e/jefe-real-user-flow-v1b.setup.ts'),
  reporter: [['line'], ['json', { outputFile: path.join(qaRoot, 'test-results', 'playwright.json') }]],
  outputDir: path.join(qaRoot, 'test-results'),
  use: {
    baseURL: `http://127.0.0.1:${qaPort}`,
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'node scripts/jefe-web.mjs',
    url: `http://127.0.0.1:${qaPort}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      APPDATA: qaAppData,
      JEFE_WEB_DATA_ROOT: '',
      JEFE_WEB_NO_BROWSER: '1',
      JEFE_WEB_PORT: String(qaPort),
    },
  },
})
