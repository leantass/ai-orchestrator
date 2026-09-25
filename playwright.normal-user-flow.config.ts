import { defineConfig } from '@playwright/test'
import path from 'node:path'

const evidenceRoot = path.resolve(process.env.JEFE_QA_ROOT || '.codex-temp/normal-user-flow-acceptance/run')
const port = 55139

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /jefe-real-user-flow-v1b(?:-closure)?\.spec\.ts/u,
  workers: 1,
  retries: 0,
  timeout: 12 * 60 * 1000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  reporter: [['line'], ['json', { outputFile: path.join(evidenceRoot, 'test-results', 'playwright.json') }]],
  outputDir: path.join(evidenceRoot, 'test-results'),
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'node scripts/jefe-web.mjs',
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      JEFE_WEB_NO_BROWSER: '1',
      JEFE_WEB_PORT: String(port),
    },
  },
})
