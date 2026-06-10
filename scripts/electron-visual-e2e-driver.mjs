import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
}

function toNormalizedList(values) {
  return Array.isArray(values)
    ? values.map((entry) => normalizeText(entry)).filter(Boolean)
    : []
}

function buildScenarioConfig() {
  const rawScenario =
    typeof process.env.AI_ORCHESTRATOR_ELECTRON_E2E_SCENARIO_B64 === 'string'
      ? process.env.AI_ORCHESTRATOR_ELECTRON_E2E_SCENARIO_B64.trim()
      : ''

  if (!rawScenario) {
    throw new Error(
      'Falta AI_ORCHESTRATOR_ELECTRON_E2E_SCENARIO_B64 para el driver visual de Electron.',
    )
  }

  return JSON.parse(Buffer.from(rawScenario, 'base64url').toString('utf8'))
}

function buildArtifactsRoot(repoRoot) {
  const configuredRoot =
    typeof process.env.AI_ORCHESTRATOR_ELECTRON_E2E_ARTIFACT_DIR === 'string'
      ? process.env.AI_ORCHESTRATOR_ELECTRON_E2E_ARTIFACT_DIR.trim()
      : ''

  return configuredRoot
    ? path.resolve(configuredRoot)
    : path.join(repoRoot, '.codex-temp', 'electron-visual-e2e')
}

const PERSISTED_UI_STORAGE_KEYS = [
  'ai-orchestrator.projectPolicyAllowed',
  'ai-orchestrator.sessionEvents',
  'ai-orchestrator.sessionSnapshot',
  'ai-orchestrator.workspacePath',
  'ai-orchestrator.userParticipationMode',
  'ai-orchestrator.resolvedDecisions',
  'ai-orchestrator.brainCostMode',
  'ai-orchestrator.flowConsoleState',
  'ai-orchestrator.flowMessages',
  'ai-orchestrator.experienceMode',
  'ai-orchestrator.uiThemeMode',
  'JEFE_DEBUG_PLANNER_UI',
]

function resolveScenarioReportPath(repoRoot, expectedReportRelativePath) {
  return path.resolve(repoRoot, expectedReportRelativePath)
}

function summarizeValidationReport(report) {
  const validations = Array.isArray(report?.validations)
    ? report.validations.length
    : Array.isArray(report?.checks)
      ? report.checks.length
      : null
  const operationsApplied = Number.isFinite(report?.operationsApplied)
    ? report.operationsApplied
    : Array.isArray(report?.appliedOperations)
      ? report.appliedOperations.length
      : null

  return {
    status: report?.status || '',
    domain: report?.domain || report?.domainLabel || '',
    projectRoot: report?.projectRoot || '',
    sandboxControlled: report?.sandboxControlled ?? null,
    safeForLocalMaterialization: report?.safeForLocalMaterialization ?? null,
    operationsApplied,
    validations,
  }
}

function captureValidationReportSnapshot({
  repoRoot,
  scenarioArtifactsPath,
  expectedReportRelativePath,
}) {
  const absoluteReportPath = resolveScenarioReportPath(repoRoot, expectedReportRelativePath)
  const existsAtCapture = fs.existsSync(absoluteReportPath)
  const snapshot = {
    validationReportPath: expectedReportRelativePath,
    validationReportAbsolutePath: absoluteReportPath,
    validationReportExistsAtCapture: existsAtCapture,
    validationReportHash: '',
    validationReportSnapshotPath: '',
    validationReportSummary: null,
    validationReportSnapshot: null,
  }

  if (!existsAtCapture) {
    return snapshot
  }

  const rawReport = fs.readFileSync(absoluteReportPath, 'utf8')
  snapshot.validationReportHash = createHash('sha256')
    .update(rawReport)
    .digest('hex')

  const persistedSnapshotPath = path.join(
    scenarioArtifactsPath,
    'validation-report.snapshot.json',
  )
  fs.writeFileSync(persistedSnapshotPath, rawReport, 'utf8')
  snapshot.validationReportSnapshotPath = persistedSnapshotPath

  try {
    const parsedReport = JSON.parse(rawReport)
    snapshot.validationReportSummary = summarizeValidationReport(parsedReport)
    snapshot.validationReportSnapshot = parsedReport
  } catch {
    snapshot.validationReportSummary = {
      status: 'unparsed',
      domain: '',
      projectRoot: '',
      sandboxControlled: null,
      safeForLocalMaterialization: null,
      operationsApplied: null,
      validations: null,
    }
  }

  return snapshot
}

async function writeScreenshot(mainWindow, targetPath) {
  const image = await mainWindow.webContents.capturePage()
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, image.toPNG())
}

async function execute(mainWindow, expression) {
  return mainWindow.webContents.executeJavaScript(expression, true)
}

function quote(value) {
  return JSON.stringify(value)
}

async function getSnapshot(mainWindow) {
  return execute(
    mainWindow,
    `(() => {
      const bridgeState =
        typeof window.__JEFE_TEST__?.getState === 'function'
          ? window.__JEFE_TEST__.getState()
          : null
      const bodyText = (document.body?.innerText || '').trim()
      const buttons = [...document.querySelectorAll('button')].map((button, index) => ({
        index,
        text: (button.innerText || '').trim(),
        disabled: Boolean(button.disabled),
      }))
      const radioLabels = [...document.querySelectorAll('label')].map((label) => ({
        text: (label.innerText || '').trim(),
      })).filter((entry) => entry.text)
      const headings = [...document.querySelectorAll('h1,h2,h3,div,span')]
        .map((node) => (node.innerText || '').trim())
        .filter(Boolean)
        .slice(0, 120)
      return {
        bridgeState,
        bodyText,
        buttons,
        radioLabels,
        hasGoalInput: Boolean(
          document.querySelector('#guided-goal-input, #simple-goal-input'),
        ),
        hasContextInput: Boolean(
          document.querySelector('#guided-context-input, #simple-context-input'),
        ),
        hasSimpleGoalInput: Boolean(document.querySelector('#simple-goal-input')),
        hasSimpleContextInput: Boolean(document.querySelector('#simple-context-input')),
        hasReuseSelect: Boolean(document.querySelector('#guided-reuse-mode')),
        headings,
      }
    })()`,
  )
}

async function callBridge(mainWindow, methodName, argument) {
  return execute(
    mainWindow,
    `(() => {
      const bridge = window.__JEFE_TEST__
      if (!bridge || typeof bridge[${quote(methodName)}] !== 'function') {
        return null
      }
      const outcome = bridge[${quote(methodName)}](${argument === undefined ? '' : quote(argument)})
      if (outcome && typeof outcome.then === 'function' && typeof outcome.catch === 'function') {
        outcome.catch((error) => {
          console.error('[electron-visual-e2e-driver]', error)
        })
      }
      return true
    })()`,
  )
}

async function clearPersistedRendererState(mainWindow) {
  return execute(
    mainWindow,
    `(() => {
      const keys = ${quote(PERSISTED_UI_STORAGE_KEYS)}
      const removed = []
      try {
        for (const key of keys) {
          window.localStorage?.removeItem(key)
          removed.push(key)
        }
      } catch {
        // Ignora errores de persistencia.
      }
      try {
        window.sessionStorage?.clear()
      } catch {
        // Ignora errores de persistencia.
      }
      return removed
    })()`,
  )
}

async function waitFor(mainWindow, label, predicateSource, timeoutMs = 30000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const result = await execute(mainWindow, predicateSource)

    if (result) {
      return result
    }

    await delay(250)
  }

  const snapshot = await getSnapshot(mainWindow)
  throw new Error(
    `Timeout esperando ${label}. Body actual: ${snapshot.bodyText.slice(0, 800)}`,
  )
}

async function clickButtonByText(mainWindow, candidates) {
  return execute(
    mainWindow,
    `(() => {
      const expected = ${quote(candidates)}
      const normalize = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLocaleLowerCase()
      const buttons = [...document.querySelectorAll('button')]
      const button = buttons.find((entry) => {
        if (entry.disabled) {
          return false
        }
        const text = normalize(entry.innerText)
        return expected.some((candidate) => text.includes(normalize(candidate)))
      })
      if (!button) {
        return null
      }
      button.click()
      return (button.innerText || '').trim()
    })()`,
  )
}

async function applyModeSequence(mainWindow, scenario, scenarioArtifactsPath, stepLog) {
  const modeSequence = Array.isArray(scenario.modeSequence)
    ? scenario.modeSequence.filter(Boolean)
    : []

  for (let index = 0; index < modeSequence.length; index += 1) {
    const modeLabel = String(modeSequence[index] || '').trim()
    if (!modeLabel) {
      continue
    }

    const clickedMode = await clickButtonByText(mainWindow, [modeLabel])
    if (!clickedMode) {
      throw new Error(`No se pudo activar visualmente el modo ${modeLabel}.`)
    }

    await delay(200)
    await writeScreenshot(
      mainWindow,
      path.join(
        scenarioArtifactsPath,
        `01-mode-${String(index + 1).padStart(2, '0')}-${normalizeText(modeLabel)}.png`,
      ),
    )
    stepLog.push({
      kind: 'mode-toggle',
      requestedMode: modeLabel,
      clickedMode,
    })
  }
}

async function applyThemeSequence(mainWindow, scenario, scenarioArtifactsPath, stepLog) {
  const themeSequence = Array.isArray(scenario.themeSequence)
    ? scenario.themeSequence.filter(Boolean)
    : []

  for (let index = 0; index < themeSequence.length; index += 1) {
    const themeLabel = String(themeSequence[index] || '').trim()
    if (!themeLabel) {
      continue
    }

    const clickedTheme = await clickButtonByText(mainWindow, [themeLabel])
    if (!clickedTheme) {
      throw new Error(`No se pudo activar visualmente el tema ${themeLabel}.`)
    }

    await delay(250)
    await writeScreenshot(
      mainWindow,
      path.join(
        scenarioArtifactsPath,
        `01-theme-${String(index + 1).padStart(2, '0')}-${normalizeText(themeLabel)}.png`,
      ),
    )
    stepLog.push({
      kind: 'theme-toggle',
      requestedTheme: themeLabel,
      clickedTheme,
    })
  }
}

async function captureTechnicalDetailAvailability(
  mainWindow,
  scenarioArtifactsPath,
  stepLog,
) {
  const clickedDetail = await clickButtonByText(mainWindow, [
    'Ver detalle técnico',
    'Ver detalle tecnico',
    'Ver detalle',
    'Ver plan completo',
    'Abrir vista avanzada',
  ])

  if (!clickedDetail) {
    return false
  }

  await delay(250)
  await writeScreenshot(
    mainWindow,
    path.join(scenarioArtifactsPath, '01-technical-detail.png'),
  )
  stepLog.push({
    kind: 'technical-detail-open',
    clickedDetail,
  })
  return true
}

async function resolveApproval(mainWindow, scenario, approvalStepIndex, stepLog) {
  const activeMode =
    scenario.approvalFlow[Math.min(approvalStepIndex, scenario.approvalFlow.length - 1)]
  const snapshotBefore = await getSnapshot(mainWindow)
  stepLog.push({
    kind: 'approval-open',
    mode: activeMode,
    approvalDecisionKey: snapshotBefore.bridgeState?.activeApprovalDecisionKey || '',
    bodyTextSample: snapshotBefore.bodyText.slice(0, 600),
  })

  if (activeMode === 'location-safe') {
    const option =
      snapshotBefore.bridgeState?.approvalOptions?.find?.((entry) => {
        const label = normalizeText(entry.label)
        return (
          label.includes('subruta especifica') ||
          label.includes('custom-path-inside-workspace') ||
          label.includes('sandbox-external-new-workspace')
        )
      }) || null
    if (option?.key) {
      await callBridge(mainWindow, 'selectApprovalOption', option.key)
    }
    await callBridge(mainWindow, 'setApprovalFreeAnswer', scenario.locationApprovalFreeAnswer)
    await callBridge(mainWindow, 'approveOnce')
    return 'location-safe'
  }

  if (activeMode === 'final-approve') {
    const option =
      snapshotBefore.bridgeState?.approvalOptions?.find?.((entry) => {
        const label = normalizeText(entry.label)
        return label.includes('aprobar materializacion sandbox') || label.includes('approve')
      }) || null
    if (option?.key) {
      await callBridge(mainWindow, 'selectApprovalOption', option.key)
    }
    await callBridge(mainWindow, 'approveOnce')
    return 'final-approve'
  }

  if (activeMode === 'approve') {
    if (typeof scenario.genericApprovalFreeAnswer === 'string') {
      await callBridge(
        mainWindow,
        'setApprovalFreeAnswer',
        scenario.genericApprovalFreeAnswer,
      )
    }
    await callBridge(mainWindow, 'approveOnce')
    return 'approve'
  }

  if (activeMode === 'reject') {
    await callBridge(mainWindow, 'rejectApproval')
    return 'reject'
  }

  if (activeMode === 'unsafe-web-prueba') {
    const option =
      snapshotBefore.bridgeState?.approvalOptions?.find?.((entry) =>
        normalizeText(entry.label).includes('subruta'),
      ) || null
    if (option?.key) {
      await callBridge(mainWindow, 'selectApprovalOption', option.key)
    }
    await callBridge(mainWindow, 'setApprovalFreeAnswer', scenario.unsafeApprovalFreeAnswer)
    await callBridge(mainWindow, 'approveOnce')
    return 'unsafe-web-prueba'
  }

  if (activeMode === 'defer' || activeMode === 'not-yet') {
    const option =
      snapshotBefore.bridgeState?.approvalOptions?.find?.((entry) => {
        const label = normalizeText(entry.label)
        return (
          label.includes('no materializar todavia') ||
          label.includes('no materializacion yet') ||
          label.includes('mantener solo planificacion') ||
          label.includes('decline materialization now') ||
          label.includes('no-materialization-yet')
        )
      }) || null
    if (option?.key) {
      await callBridge(mainWindow, 'selectApprovalOption', option.key)
    }
    await callBridge(mainWindow, 'approveOnce')
    return 'defer'
  }

  throw new Error(`Modo de approval no soportado por el driver visual: ${activeMode}`)
}

function buildDefaultValidationSnapshot(repoRoot, scenario) {
  return {
    validationReportPath: scenario.expectedReportRelativePath || '',
    validationReportAbsolutePath: scenario.expectedReportRelativePath
      ? resolveScenarioReportPath(repoRoot, scenario.expectedReportRelativePath)
      : '',
    validationReportExistsAtCapture: false,
    validationReportHash: '',
    validationReportSnapshotPath: '',
    validationReportSummary: null,
    validationReportSnapshot: null,
  }
}

function extractAggregatedText(stepLog, finalSnapshot) {
  return [
    ...stepLog
      .map((entry) =>
        typeof entry.bodyTextSample === 'string'
          ? entry.bodyTextSample
          : typeof entry.bodyText === 'string'
            ? entry.bodyText
            : '',
      )
      .filter(Boolean),
    String(finalSnapshot?.bodyText || ''),
  ].join('\n')
}

function resolveFinalStatus({ scenario, failureReason, reportExists, aggregatedText }) {
  if (failureReason) {
    return 'failed'
  }

  if (reportExists) {
    return 'materialized'
  }

  if (aggregatedText.includes('bloqueado por seguridad')) {
    return 'blocked'
  }

  if (
    aggregatedText.includes('trabajo pausado') ||
    aggregatedText.includes('plan guardado para continuar despues') ||
    aggregatedText.includes('plan guardado sin cambios')
  ) {
    return 'deferred'
  }

  if (
    aggregatedText.includes('no se creo nada') ||
    aggregatedText.includes('no se creo ningun archivo') ||
    aggregatedText.includes('dejar solo el plan')
  ) {
    return 'rejected'
  }

  return normalizeText(scenario.reportLabel || scenario.label || scenario.id || 'completed')
}

async function driveScenario(
  app,
  electron,
  mainWindow,
  repoRoot,
  scenario,
  scenarioArtifactsPath,
) {
  const stepLog = []
  const heartbeatPath = path.join(scenarioArtifactsPath, 'heartbeat.json')
  const writeHeartbeat = (payload) => {
    fs.writeFileSync(heartbeatPath, JSON.stringify(payload, null, 2), 'utf8')
  }
  const uiSignals = {
    appOpened: false,
    modeSimpleSeen: false,
    modeAdvancedSeen: false,
    modeTechnicalSeen: false,
    themeLightSeen: false,
    themeDarkSeen: false,
    technicalDetailsAvailable: false,
    unexpectedApprovalKey: '',
  }

  let approvalStepIndex = 0
  let sawExecution = false
  let sawResult = false
  let preparationTriggered = false
  let materializationTriggered = false
  let finalSnapshot = null
  let capturedValidationReport = null
  let failureReason = ''

  try {
    await waitFor(
      mainWindow,
      'JEFE test bridge',
      `typeof window.__JEFE_TEST__?.getState === 'function'`,
      45000,
    )
    uiSignals.appOpened = true
    await clearPersistedRendererState(mainWindow)
    await callBridge(mainWindow, 'resetSession')
    await clearPersistedRendererState(mainWindow)
    await waitFor(
      mainWindow,
      'goal input',
      `Boolean(document.querySelector('#guided-goal-input, #simple-goal-input'))`,
      45000,
    )

    await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '01-inicio.png'))
    await applyModeSequence(mainWindow, scenario, scenarioArtifactsPath, stepLog)
    const normalizedModeSequence = toNormalizedList(scenario.modeSequence)
    uiSignals.modeSimpleSeen =
      uiSignals.modeSimpleSeen || normalizedModeSequence.includes('simple')
    uiSignals.modeAdvancedSeen =
      uiSignals.modeAdvancedSeen || normalizedModeSequence.includes('avanzado')
    uiSignals.modeTechnicalSeen =
      uiSignals.modeTechnicalSeen || normalizedModeSequence.includes('tecnico')
    await applyThemeSequence(mainWindow, scenario, scenarioArtifactsPath, stepLog)
    const normalizedThemeSequence = toNormalizedList(scenario.themeSequence)
    uiSignals.themeLightSeen =
      uiSignals.themeLightSeen || normalizedThemeSequence.includes('claro')
    uiSignals.themeDarkSeen =
      uiSignals.themeDarkSeen || normalizedThemeSequence.includes('oscuro')

    if (scenario.captureTechnicalDetails !== false) {
      uiSignals.technicalDetailsAvailable = await captureTechnicalDetailAvailability(
        mainWindow,
        scenarioArtifactsPath,
        stepLog,
      )
      const finalRequestedMode = Array.isArray(scenario.modeSequence)
        ? String(scenario.modeSequence[scenario.modeSequence.length - 1] || '').trim()
        : ''
      if (uiSignals.technicalDetailsAvailable && finalRequestedMode) {
        const restoredMode = await clickButtonByText(mainWindow, [finalRequestedMode])
        if (restoredMode) {
          stepLog.push({
            kind: 'mode-restore-after-technical-detail',
            requestedMode: finalRequestedMode,
            clickedMode: restoredMode,
          })
        }
      }
    }

    if (typeof scenario.workspacePath === 'string' && scenario.workspacePath.trim()) {
      await callBridge(mainWindow, 'setWorkspacePath', scenario.workspacePath.trim())
      await waitFor(
        mainWindow,
        'workspace path loaded',
        `window.__JEFE_TEST__?.getState?.().workspacePath === ${quote(
          scenario.workspacePath.trim(),
        )}`,
      )
    }

    await callBridge(mainWindow, 'setGoal', scenario.goal)
    await waitFor(
      mainWindow,
      'goal loaded',
      `window.__JEFE_TEST__?.getState?.().goalInput === ${quote(String(scenario.goal || ''))}`,
    )
    await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '02-objetivo.png'))
    writeHeartbeat({ stage: 'goal-loaded', snapshot: await getSnapshot(mainWindow) })
    const initialSnapshot = await getSnapshot(mainWindow)
    const useSimpleFlow = Boolean(initialSnapshot.hasSimpleGoalInput)
    uiSignals.modeSimpleSeen =
      uiSignals.modeSimpleSeen || Boolean(initialSnapshot.hasSimpleGoalInput)

    await callBridge(mainWindow, 'setContext', scenario.context)
    await waitFor(
      mainWindow,
      'context loaded',
      `window.__JEFE_TEST__?.getState?.().executionContextInput === ${quote(
        String(scenario.context || ''),
      )}`,
    )
    await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '03-contexto.png'))
    writeHeartbeat({ stage: 'context-loaded', snapshot: await getSnapshot(mainWindow) })

    await callBridge(mainWindow, 'setBrainMode', 'max-quality')
    await waitFor(
      mainWindow,
      'brain mode loaded',
      `window.__JEFE_TEST__?.getState?.().brainCostMode === 'max-quality'`,
    )
    await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '04-criterio.png'))
    writeHeartbeat({ stage: 'brain-loaded', snapshot: await getSnapshot(mainWindow) })

    await callBridge(mainWindow, 'setReuseMode', 'none')
    await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '05-memoria.png'))
    writeHeartbeat({ stage: 'memory-loaded', snapshot: await getSnapshot(mainWindow) })

    if (!useSimpleFlow) {
      await callBridge(mainWindow, 'next')
      await waitFor(
        mainWindow,
        'context step',
        `window.__JEFE_TEST__?.getState?.().activeWizardStep === 'context'`,
      )
      await callBridge(mainWindow, 'next')
      await waitFor(
        mainWindow,
        'brain step',
        `window.__JEFE_TEST__?.getState?.().activeWizardStep === 'brain'`,
      )
      await callBridge(mainWindow, 'next')
      await waitFor(
        mainWindow,
        'memory step',
        `window.__JEFE_TEST__?.getState?.().activeWizardStep === 'memory'`,
      )
    }

    const planTriggered = await callBridge(mainWindow, 'generatePlan')
    if (!planTriggered) {
      throw new Error('No se pudo disparar el generatePlan desde el bridge visual.')
    }
    await writeScreenshot(
      mainWindow,
      path.join(scenarioArtifactsPath, '06-plan-disparado.png'),
    )
    writeHeartbeat({ stage: 'plan-triggered', snapshot: await getSnapshot(mainWindow) })

    for (let iteration = 0; iteration < 36; iteration += 1) {
      await delay(1000)
      finalSnapshot = await getSnapshot(mainWindow)
      const normalizedBodyText = normalizeText(finalSnapshot.bodyText)
      const reportExists = scenario.expectedReportRelativePath
        ? fs.existsSync(path.join(repoRoot, scenario.expectedReportRelativePath))
        : false
      const visibleButtonTexts = finalSnapshot.buttons
        .filter((button) => !button.disabled)
        .map((button) => button.text)
        .filter(Boolean)

      stepLog.push({
        kind: 'poll',
        iteration,
        reportExists,
        visibleButtons: visibleButtonTexts,
        bridgeState: finalSnapshot.bridgeState,
        bodyTextSample: finalSnapshot.bodyText.slice(0, 500),
      })
      writeHeartbeat({
        stage: 'poll',
        iteration,
        reportExists,
        snapshot: finalSnapshot,
        stepLog,
      })

      if (reportExists) {
        capturedValidationReport = captureValidationReportSnapshot({
          repoRoot,
          scenarioArtifactsPath,
          expectedReportRelativePath: scenario.expectedReportRelativePath,
        })
        sawResult = true
        break
      }

      const approvalDecisionKey = normalizeText(
        finalSnapshot.bridgeState?.activeApprovalDecisionKey,
      )
      const allowedApprovalDecisionKeys = toNormalizedList(
        scenario.allowedApprovalDecisionKeys,
      )

      if (approvalDecisionKey) {
        const isExpectedApproval =
          allowedApprovalDecisionKeys.length === 0 ||
          allowedApprovalDecisionKeys.includes(approvalDecisionKey)

        if (!isExpectedApproval) {
          uiSignals.unexpectedApprovalKey =
            finalSnapshot.bridgeState?.activeApprovalDecisionKey || approvalDecisionKey
          failureReason = `La corrida visual ${scenario.id} mostro un approval inesperado: ${uiSignals.unexpectedApprovalKey}.`
          break
        }
      }

      if (
        finalSnapshot.bridgeState?.decisionPending ||
        normalizedBodyText.includes('aprobacion requerida') ||
        normalizedBodyText.includes('necesito tu permiso para avanzar')
      ) {
        await writeScreenshot(
          mainWindow,
          path.join(
            scenarioArtifactsPath,
            `06-approval-${String(approvalStepIndex + 1).padStart(2, '0')}.png`,
          ),
        )
        const approvalMode = await resolveApproval(
          mainWindow,
          scenario,
          approvalStepIndex,
          stepLog,
        )
        stepLog.push({ kind: 'approval-sent', approvalMode })
        approvalStepIndex += 1
        continue
      }

      if (
        !preparationTriggered &&
        visibleButtonTexts.some((text) => {
          const normalizedText = normalizeText(text)
          return (
            normalizedText.includes('preparar primera entrega segura') ||
            normalizedText.includes('preparar entrega funcional local') ||
            normalizedText.includes('preparar materializacion sandbox') ||
            normalizedText.includes('preparar la ejecucion') ||
            normalizedText.includes('preparar ejecucion')
          )
        })
      ) {
        const preparationClicked = await clickButtonByText(mainWindow, [
          'Preparar primera entrega segura',
          'Preparar entrega funcional local',
          'Preparar materializacion sandbox',
          'Preparar la ejecucion',
          'Preparar ejecucion',
        ])
        if (!preparationClicked) {
          throw new Error(
            'La UI mostraba un CTA de preparacion, pero el driver no pudo accionarlo visualmente.',
          )
        }
        preparationTriggered = true
        await writeScreenshot(
          mainWindow,
          path.join(scenarioArtifactsPath, '07-preparacion.png'),
        )
        stepLog.push({ kind: 'preparation-clicked', label: preparationClicked })
        continue
      }

      if (
        !materializationTriggered &&
        visibleButtonTexts.some((text) =>
          normalizeText(text).includes('materializar entrega'),
        )
      ) {
        const materializationClicked = await clickButtonByText(mainWindow, [
          'Materializar entrega',
        ])
        if (!materializationClicked) {
          throw new Error(
            'La UI mostraba el CTA Materializar entrega, pero el driver no pudo accionarlo visualmente.',
          )
        }
        materializationTriggered = true
        sawExecution = true
        await writeScreenshot(
          mainWindow,
          path.join(scenarioArtifactsPath, '08-ejecucion.png'),
        )
        continue
      }

      if (
        visibleButtonTexts.some((text) =>
          normalizeText(text).includes('ver resultado'),
        )
      ) {
        await clickButtonByText(mainWindow, ['Ver resultado'])
        await delay(600)
        sawResult = true
        break
      }

      if (
        normalizedBodyText.includes('ejecucion completada') ||
        normalizedBodyText.includes('primera entrega funcional local generada') ||
        normalizedBodyText.includes('bloqueado por seguridad') ||
        normalizedBodyText.includes('trabajo pausado') ||
        normalizedBodyText.includes('no se creo nada') ||
        normalizedBodyText.includes('plan guardado para continuar despues')
      ) {
        sawResult = true
        break
      }
    }
  } catch (error) {
    failureReason = error instanceof Error ? error.message : String(error)
  }

  try {
    await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '09-resultado.png'))
  } catch {
    // Best effort.
  }

  try {
    finalSnapshot = await getSnapshot(mainWindow)
  } catch {
    finalSnapshot = {
      bridgeState: null,
      bodyText: '',
      buttons: [],
      radioLabels: [],
      hasGoalInput: false,
      hasContextInput: false,
      hasSimpleGoalInput: false,
      hasSimpleContextInput: false,
      hasReuseSelect: false,
      headings: [],
    }
  }

  const validationSnapshot =
    capturedValidationReport || buildDefaultValidationSnapshot(repoRoot, scenario)
  const reportExists =
    Boolean(validationSnapshot.validationReportExistsAtCapture) ||
    (scenario.expectedReportRelativePath
      ? fs.existsSync(resolveScenarioReportPath(repoRoot, scenario.expectedReportRelativePath))
      : false)
  const aggregatedText = normalizeText(extractAggregatedText(stepLog, finalSnapshot))
  const requiredFinalBodySubstrings = toNormalizedList(
    scenario.requiredFinalBodySubstrings,
  )
  const forbiddenFinalBodySubstrings = toNormalizedList(
    scenario.forbiddenFinalBodySubstrings,
  )

  if (!failureReason) {
    for (const requiredSubstring of requiredFinalBodySubstrings) {
      if (!aggregatedText.includes(requiredSubstring)) {
        failureReason = `La corrida visual ${scenario.id} no mostro la senal requerida ${JSON.stringify(requiredSubstring)}.`
        break
      }
    }
  }

  if (!failureReason) {
    for (const forbiddenSubstring of forbiddenFinalBodySubstrings) {
      if (aggregatedText.includes(forbiddenSubstring)) {
        failureReason = `La corrida visual ${scenario.id} termino con una senal prohibida ${JSON.stringify(forbiddenSubstring)}.`
        break
      }
    }
  }

  if (
    !failureReason &&
    Number.isFinite(scenario.minApprovalStepsSeen) &&
    approvalStepIndex < Number(scenario.minApprovalStepsSeen)
  ) {
    failureReason = `La corrida visual ${scenario.id} debia mostrar al menos ${scenario.minApprovalStepsSeen} approval(s) y solo mostro ${approvalStepIndex}.`
  }

  if (!failureReason && scenario.expectMaterialization) {
    if (!reportExists) {
      failureReason = `La corrida visual ${scenario.id} no genero ${scenario.expectedReportRelativePath}.`
    } else if (aggregatedText.includes('todavia no se ejecuto ninguna instruccion')) {
      failureReason = `La corrida visual ${scenario.id} quedo trabada en estado previo a la ejecucion.`
    }
  }

  if (!failureReason && scenario.expectMaterialization === false && reportExists) {
    failureReason = `La corrida visual ${scenario.id} materializo archivos cuando debia quedar solo en planificacion.`
  }

  const staleDomainNotSeen =
    !aggregatedText.includes('tracking logistico') &&
    !aggregatedText.includes('tracking logistico local') &&
    !aggregatedText.includes('logistics tracker')

  if (!failureReason && staleDomainNotSeen === false) {
    failureReason = `La corrida visual ${scenario.id} mostro contaminacion de dominio heredada.`
  }

  const finalStatus = resolveFinalStatus({
    scenario,
    failureReason,
    reportExists,
    aggregatedText,
  })

  return {
    id: scenario.id,
    label: scenario.label,
    appOpened: uiSignals.appOpened,
    modeSimpleSeen: uiSignals.modeSimpleSeen,
    modeAdvancedSeen: uiSignals.modeAdvancedSeen,
    modeTechnicalSeen: uiSignals.modeTechnicalSeen,
    themeLightSeen: uiSignals.themeLightSeen,
    themeDarkSeen: uiSignals.themeDarkSeen,
    technicalDetailsAvailable:
      uiSignals.technicalDetailsAvailable ||
      aggregatedText.includes('ver detalle tecnico') ||
      aggregatedText.includes('ver detalle'),
    rejectionStateSeen:
      aggregatedText.includes('no se creo nada') ||
      aggregatedText.includes('dejar solo el plan'),
    blockedStateSeen: aggregatedText.includes('bloqueado por seguridad'),
    deferredStateSeen:
      aggregatedText.includes('trabajo pausado') ||
      aggregatedText.includes('plan guardado para continuar despues') ||
      aggregatedText.includes('no avanzar por ahora'),
    staleDomainNotSeen,
    unexpectedApprovalKey: uiSignals.unexpectedApprovalKey,
    finalStatus,
    passed: !failureReason,
    failureReason,
    approvalStepsSeen: approvalStepIndex,
    sawExecution,
    sawResult,
    reportExists,
    finalBodyTextSample: String(finalSnapshot?.bodyText || '').slice(0, 8000),
    finalButtons: Array.isArray(finalSnapshot?.buttons) ? finalSnapshot.buttons : [],
    finalBridgeState: finalSnapshot?.bridgeState || null,
    electronUserDataPath: app?.getPath?.('userData') || '',
    stepLog,
    ...validationSnapshot,
  }
}

export async function runElectronVisualE2E({
  app,
  electron,
  mainWindow,
  repoRoot,
}) {
  const scenario = buildScenarioConfig()
  const artifactsRoot = buildArtifactsRoot(repoRoot)
  const scenarioArtifactsPath = path.join(artifactsRoot, scenario.id)
  fs.rmSync(scenarioArtifactsPath, { recursive: true, force: true })
  fs.mkdirSync(scenarioArtifactsPath, { recursive: true })

  const result = await driveScenario(
    app,
    electron,
    mainWindow,
    repoRoot,
    scenario,
    scenarioArtifactsPath,
  )

  fs.writeFileSync(
    path.join(scenarioArtifactsPath, 'report.json'),
    JSON.stringify(
      {
        ...result,
        scenario,
        finishedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )

  if (!result.passed) {
    throw new Error(result.failureReason || `La corrida visual ${scenario.id} fallo.`)
  }

  if (process.env.AI_ORCHESTRATOR_ELECTRON_E2E_AUTO_QUIT === '1') {
    await delay(250)
    app.quit()
  }
}

export default runElectronVisualE2E
