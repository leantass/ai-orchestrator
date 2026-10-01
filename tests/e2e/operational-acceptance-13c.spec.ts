import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const evidence = process.env.JEFE_13C_EVIDENCE || 'C:/Users/PC/Desktop/JEFE-13C-Acceptance/playwright/13c'
const operation = (overrides: Record<string, unknown> = {}) => ({
  ok: true,
  controlCenter: {
    schemaVersion: 'jefe-commercial-control-center/v1', scope: 'global',
    system: { buildReady: { state: 'available', label: 'Disponible' }, releaseReadiness: { state: 'blocked', label: 'Bloqueado' }, productionReady: false },
    operation: { health: { state: 'healthy', label: 'Saludable' }, quality: { state: 'failing', label: 'Fallando' }, readiness: { state: 'blocked', label: 'Bloqueado' }, openIncidentCount: 1 },
    sources: [{ name: 'observability', authority: 'durable evidence', availability: 'available' }, { name: 'release', authority: 'release health', availability: 'degraded' }],
    blockers: [{ scope: 'global', category: 'remote_ci_failed', label: 'CI remota falló', reason: 'La evidencia de CI bloquea el release.', nextAction: 'Revisar el fallo de CI.' }],
    incidents: [{ incidentId: 'incident-13c', category: 'corrupt_record', severity: 'warning', summary: 'Registro requiere diagnóstico.' }], limitations: { historicalLintErrors: 306 }, evidence: 'fixture-13c',
    releaseOperations: { schemaVersion: 'jefe-release-operations/v1', scope: 'global', health: 'healthy', quality: 'failing', releaseReadiness: 'blocked', productionReady: false,
      blockers: [{ scope: 'global', category: 'remote_ci_failed', label: 'CI remota falló', reason: 'La evidencia de CI bloquea el release.', nextAction: 'Revisar el fallo de CI.', nextActionLabel: 'Revisar el fallo de CI.' }],
      recoveries: { e2e: { name: 'e2e', status: 'healthy' }, release: { name: 'release', status: 'recovery_required', recommendedAction: 'Reconciliar release' }, governance: { name: 'governance', status: 'unavailable' }, observability: { name: 'observability', status: 'healthy' } },
      nextSafeActions: [{ code: 'review_ci', label: 'Revisar el fallo de CI.' }], historySummary: { partial: true, entries: [{ timestamp: '2026-10-01T12:00:00Z', domain: 'release', summary: 'Release bloqueado.' }] },
      capabilities: { gitCommit: 'local_only', gitPush: 'historically_verified', createPr: 'contract_only', deploy: 'not_connected' }, limitations: { historicalLintErrors: 306 }, readOnly: true },
    ...overrides,
  },
})

async function write(name: string, value: unknown) { await fs.mkdir(evidence, { recursive: true }); await fs.writeFile(path.join(evidence, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8') }

test.describe('13C deterministic operational fixtures', () => {
  test('valid data renders operational evidence and never readiness', async ({ page }) => {
    await page.route('**/api/control-center', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(operation()) }))
    await page.goto('/operation'); await expect(page.getByTestId('operation-view')).toBeVisible()
    await expect(page.getByText('CI remota falló', { exact: true })).toBeVisible(); await expect(page.getByText('Revisar el fallo de CI.', { exact: true })).toBeVisible(); await expect(page.getByText('Requiere atención')).toBeVisible(); await expect(page.getByText('Release bloqueado.', { exact: true })).toBeVisible(); await expect(page.getByText('No lista', { exact: true })).toBeVisible()
    await expect(page.getByText('Verificado históricamente')).toBeVisible(); await expect(page.getByText('Contrato disponible; ejecución no conectada')).toBeVisible(); await expect(page.getByText('No conectado', { exact: true })).toBeVisible()
    await write('valid-fixture.json', { productionReady: false, assertions: ['blocker', 'nextSafeAction', 'recovery', 'incident', 'capabilities', 'history'] })
  })

  test('loading, unavailable, empty and source failure stay human and safe', async ({ page }) => {
    let calls = 0
    let markRequestStarted!: () => void
    let releaseInitialResponse!: () => void
    let initialPhase = true
    const requestStarted = new Promise<void>(resolve => { markRequestStarted = resolve })
    const initialResponseReleased = new Promise<void>(resolve => { releaseInitialResponse = resolve })
    await page.route('**/api/control-center', async route => { calls += 1; if (initialPhase) { markRequestStarted(); await initialResponseReleased; return route.fulfill({ contentType: 'application/json', body: JSON.stringify(operation()) }) } return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: { message: 'source failure' } }) }) })
    const pending = page.goto('/operation', { waitUntil: 'commit' }); await requestStarted; await expect(page.getByText('Cargando estado operativo...')).toBeVisible(); initialPhase = false; releaseInitialResponse(); await pending; await expect(page.getByText('CI remota falló')).toBeVisible()
    await page.getByRole('button', { name: 'Actualizar estado' }).click(); await expect(page.getByText('No pudimos actualizar.')).toBeVisible(); await expect(page.getByText('CI remota falló')).toBeVisible(); await expect(page.getByText('No lista')).toBeVisible()
    await write('source-failure-preserves-last-good.json', { calls, preserved: true, productionReady: false, message: 'No pudimos actualizar.' })
  })

  test('latest request wins when B responds before A', async ({ page }) => {
    let calls = 0; const events: string[] = []
    await page.route('**/api/control-center', async route => { calls += 1; const current = calls; events.push(`start-${current}`); await new Promise(resolve => setTimeout(resolve, current === 1 ? 250 : current === 2 ? 20 : 0)); events.push(`respond-${current}`); return route.fulfill({ contentType: 'application/json', body: JSON.stringify(operation({ evidence: `fixture-${current}`, releaseOperations: { health: current === 2 ? 'Evidencia B' : 'Evidencia A', quality: 'failing', releaseReadiness: 'blocked', productionReady: false, blockers: [], recoveries: {}, nextSafeActions: [], historySummary: { entries: [] }, capabilities: {}, limitations: {}, readOnly: true } })) }) })
    await page.goto('/operation'); await expect(page.getByTestId('operation-view')).toBeVisible(); await page.waitForTimeout(400); calls = 0; events.length = 0
    await page.evaluate(() => { const refresh = (window as Window & { __jefe13cRefresh?: () => Promise<unknown> }).__jefe13cRefresh; if (!refresh) throw new Error('13C refresh hook missing'); void refresh(); void refresh() }); await page.waitForTimeout(400); await write('latest-request-wins-debug.json', { events, calls })
    await expect(page.getByText('Evidencia B', { exact: true })).toBeVisible(); await page.waitForTimeout(350); await expect(page.getByText('Evidencia B', { exact: true })).toBeVisible(); await expect(page.getByText('Evidencia A', { exact: true })).not.toBeVisible()
    await write('latest-request-wins.json', { events, finalVisible: 'Evidencia B', staleARejected: true })
  })

  test('recovery and governance projection remain safe', async ({ page }) => {
    await page.route('**/api/control-center', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(operation()) }))
    await page.goto('/operation'); await expect(page.getByText('Requiere atención')).toBeVisible(); await expect(page.getByText('Gobernanza')).toBeVisible(); await expect(page.getByText('No se pudo leer el estado de recuperación.')).toBeVisible(); await expect(page.getByText('No lista')).toBeVisible()
    await write('recovery-governance-safety.json', { recoveryVisible: true, governanceOnlyInProjectAdapter: true, productionReady: false })
  })
})
