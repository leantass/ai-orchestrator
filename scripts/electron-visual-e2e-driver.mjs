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
      const headings = [...document.querySelectorAll('h1,h2,h3,div,span')].map((node) => (node.innerText || '').trim()).filter(Boolean).slice(0, 80)
      return {
        bridgeState,
        bodyText,
        buttons,
        radioLabels,
        hasGoalInput: Boolean(document.querySelector('#guided-goal-input')),
        hasContextInput: Boolean(document.querySelector('#guided-context-input')),
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

async function setFieldValue(mainWindow, selector, value) {
  return execute(
    mainWindow,
    `(() => {
      const field = document.querySelector(${quote(selector)})
      if (!field) {
        return false
      }
      const nextValue = ${quote(value)}
      const prototype =
        field instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
      const previousValue = field.value
      field.focus()
      if (typeof setter === 'function') {
        setter.call(field, nextValue)
      } else {
        field.value = nextValue
      }
      if (field._valueTracker && typeof field._valueTracker.setValue === 'function') {
        field._valueTracker.setValue(previousValue)
      }
      field.dispatchEvent(new InputEvent('input', { bubbles: true, data: nextValue, inputType: 'insertText' }))
      field.dispatchEvent(new Event('change', { bubbles: true }))
      const reactPropsKey = Object.keys(field).find((key) => key.startsWith('__reactProps$'))
      if (reactPropsKey) {
        const reactProps = field[reactPropsKey]
        if (reactProps && typeof reactProps.onChange === 'function') {
          reactProps.onChange({ target: field, currentTarget: field })
        }
      }
      field.dispatchEvent(new Event('blur', { bubbles: true }))
      return field.value
    })()`,
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

async function selectRadioLabel(mainWindow, candidates) {
  return execute(
    mainWindow,
    `(() => {
      const expected = ${quote(candidates)}
      const normalize = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLocaleLowerCase()
      const labels = [...document.querySelectorAll('label')]
      const selectedLabel = labels.find((label) => {
        const text = normalize(label.innerText)
        return expected.some((candidate) => text.includes(normalize(candidate)))
      })
      if (!selectedLabel) {
        return null
      }
      const radio = selectedLabel.querySelector('input[type="radio"]')
      if (!radio) {
        return null
      }
      radio.click()
      radio.dispatchEvent(new Event('change', { bubbles: true }))
      return (selectedLabel.innerText || '').trim()
    })()`,
  )
}

async function setReuseMode(mainWindow, reuseMode) {
  return execute(
    mainWindow,
    `(() => {
      const select = document.querySelector('#guided-reuse-mode')
      if (!select) {
        return false
      }
      select.value = ${quote(reuseMode)}
      select.dispatchEvent(new Event('change', { bubbles: true }))
      const reactPropsKey = Object.keys(select).find((key) => key.startsWith('__reactProps$'))
      if (reactPropsKey) {
        const reactProps = select[reactPropsKey]
        if (reactProps && typeof reactProps.onChange === 'function') {
          reactProps.onChange({ target: select, currentTarget: select })
        }
      }
      return true
    })()`,
  )
}

async function resolveApproval(mainWindow, scenario, approvalStepIndex, stepLog) {
  const activeMode = scenario.approvalFlow[Math.min(approvalStepIndex, scenario.approvalFlow.length - 1)]
  const snapshotBefore = await getSnapshot(mainWindow)
  stepLog.push({
    kind: 'approval-open',
    mode: activeMode,
    bodyTextSample: snapshotBefore.bodyText.slice(0, 600),
  })

  if (activeMode === 'location-safe') {
    const option =
      snapshotBefore.bridgeState?.approvalOptions?.find?.((entry) => {
        const label = normalizeText(entry.label)
        return (
          label.includes('subruta especifica') ||
          label.includes('subruta específica') ||
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

async function driveScenario(mainWindow, repoRoot, scenario, scenarioArtifactsPath) {
  const stepLog = []
  const heartbeatPath = path.join(scenarioArtifactsPath, 'heartbeat.json')
  const writeHeartbeat = (payload) => {
    fs.writeFileSync(heartbeatPath, JSON.stringify(payload, null, 2), 'utf8')
  }

  await waitFor(
    mainWindow,
    'JEFE test bridge',
    `typeof window.__JEFE_TEST__?.getState === 'function'`,
    45000,
  )
  await callBridge(mainWindow, 'resetSession')
  await waitFor(
    mainWindow,
    'goal input',
    `Boolean(document.querySelector('#guided-goal-input'))`,
    45000,
  )
  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '01-inicio.png'))
  if (typeof scenario.workspacePath === 'string' && scenario.workspacePath.trim()) {
    await callBridge(
      mainWindow,
      'setWorkspacePath',
      scenario.workspacePath.trim(),
    )
  }
  await callBridge(mainWindow, 'setGoal', scenario.goal)
  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '02-objetivo.png'))
  writeHeartbeat({ stage: 'goal-loaded', snapshot: await getSnapshot(mainWindow) })
  await callBridge(mainWindow, 'next')

  await waitFor(
    mainWindow,
    'context step',
    `window.__JEFE_TEST__?.getState?.().activeWizardStep === 'context'`,
  )
  await callBridge(mainWindow, 'setContext', scenario.context)
  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '03-contexto.png'))
  writeHeartbeat({ stage: 'context-loaded', snapshot: await getSnapshot(mainWindow) })
  await callBridge(mainWindow, 'next')

  await waitFor(
    mainWindow,
    'brain step',
    `window.__JEFE_TEST__?.getState?.().activeWizardStep === 'brain'`,
  )
  await callBridge(mainWindow, 'setBrainMode', 'max-quality')
  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '04-criterio.png'))
  writeHeartbeat({ stage: 'brain-loaded', snapshot: await getSnapshot(mainWindow) })
  await callBridge(mainWindow, 'next')

  await waitFor(
    mainWindow,
    'memory step',
    `window.__JEFE_TEST__?.getState?.().activeWizardStep === 'memory'`,
  )
  await callBridge(mainWindow, 'setReuseMode', 'none')
  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '05-memoria.png'))
  writeHeartbeat({ stage: 'memory-loaded', snapshot: await getSnapshot(mainWindow) })
  const planButtonClicked = await clickButtonByText(mainWindow, ['Generar plan'])
  if (!planButtonClicked) {
    throw new Error('No se pudo disparar visualmente el boton Generar plan.')
  }
  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '06-plan-disparado.png'))
  writeHeartbeat({ stage: 'plan-triggered', snapshot: await getSnapshot(mainWindow) })

  let approvalStepIndex = 0
  let sawExecution = false
  let sawResult = false
  let preparationTriggered = false
  let materializationTriggered = false
  let finalSnapshot = await getSnapshot(mainWindow)
  let capturedValidationReport = null

  for (let iteration = 0; iteration < 24; iteration += 1) {
    await delay(1000)
    finalSnapshot = await getSnapshot(mainWindow)
    const normalizedBodyText = normalizeText(finalSnapshot.bodyText)
    const reportExists = fs.existsSync(path.join(repoRoot, scenario.expectedReportRelativePath))
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

    if (normalizedBodyText.includes('aprobacion requerida') || normalizedBodyText.includes('aprobación requerida')) {
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
          normalizedText.includes('preparar entrega funcional local') ||
          normalizedText.includes('preparar materializacion sandbox') ||
          normalizedText.includes('preparar la ejecucion') ||
          normalizedText.includes('preparar ejecucion')
        )
      })
    ) {
      const preparationClicked = await clickButtonByText(mainWindow, [
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
      await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '07-preparacion.png'))
      stepLog.push({ kind: 'preparation-clicked', label: preparationClicked })
      continue
    }

    if (
      !materializationTriggered &&
      visibleButtonTexts.some((text) => normalizeText(text).includes('materializar entrega'))
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
      await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '08-ejecucion.png'))
      continue
    }

    if (visibleButtonTexts.some((text) => normalizeText(text).includes('ver resultado'))) {
      await clickButtonByText(mainWindow, ['Ver resultado'])
      await delay(600)
      sawResult = true
      break
    }

    if (
      normalizedBodyText.includes('ejecucion completada') ||
      normalizedBodyText.includes('ejecución completada') ||
      normalizedBodyText.includes('primera entrega funcional local generada')
    ) {
      sawResult = true
      break
    }
  }

  await writeScreenshot(mainWindow, path.join(scenarioArtifactsPath, '09-resultado.png'))
  finalSnapshot = await getSnapshot(mainWindow)

  const reportExists =
    Boolean(capturedValidationReport?.validationReportExistsAtCapture) ||
    fs.existsSync(resolveScenarioReportPath(repoRoot, scenario.expectedReportRelativePath))
  const result = {
    id: scenario.id,
    label: scenario.label,
    approvalStepsSeen: approvalStepIndex,
    sawExecution,
    sawResult,
    reportExists,
    finalBodyTextSample: finalSnapshot.bodyText.slice(0, 1200),
    finalButtons: finalSnapshot.buttons,
    stepLog,
    ...(capturedValidationReport || {
      validationReportPath: scenario.expectedReportRelativePath,
      validationReportAbsolutePath: resolveScenarioReportPath(
        repoRoot,
        scenario.expectedReportRelativePath,
      ),
      validationReportExistsAtCapture: false,
      validationReportHash: '',
      validationReportSnapshotPath: '',
      validationReportSummary: null,
      validationReportSnapshot: null,
    }),
  }

  const normalizedFinalBodyText = normalizeText(result.finalBodyTextSample)
  const requiredFinalBodySubstrings = toNormalizedList(
    scenario.requiredFinalBodySubstrings,
  )
  const forbiddenFinalBodySubstrings = toNormalizedList(
    scenario.forbiddenFinalBodySubstrings,
  )

  for (const requiredSubstring of requiredFinalBodySubstrings) {
    if (!normalizedFinalBodyText.includes(requiredSubstring)) {
      throw new Error(
        `La corrida visual ${scenario.id} no mostro la senal final requerida ${JSON.stringify(requiredSubstring)}.`,
      )
    }
  }

  for (const forbiddenSubstring of forbiddenFinalBodySubstrings) {
    if (normalizedFinalBodyText.includes(forbiddenSubstring)) {
      throw new Error(
        `La corrida visual ${scenario.id} termino con una senal prohibida ${JSON.stringify(forbiddenSubstring)}.`,
      )
    }
  }

  if (
    Number.isFinite(scenario.minApprovalStepsSeen) &&
    result.approvalStepsSeen < Number(scenario.minApprovalStepsSeen)
  ) {
    throw new Error(
      `La corrida visual ${scenario.id} debia mostrar al menos ${scenario.minApprovalStepsSeen} approval(s) y solo mostro ${result.approvalStepsSeen}.`,
    )
  }

  if (scenario.expectMaterialization) {
    if (!reportExists) {
      throw new Error(
        `La corrida visual ${scenario.id} no genero ${scenario.expectedReportRelativePath}. Snapshot final: ${result.finalBodyTextSample}`,
      )
    }
    if (
      normalizeText(result.finalBodyTextSample).includes('todavia no se ejecuto ninguna instruccion') ||
      normalizeText(result.finalBodyTextSample).includes('todavía no se ejecutó ninguna instrucción')
    ) {
      throw new Error(
        `La corrida visual ${scenario.id} quedo trabada en estado previo a la ejecucion.`,
      )
    }
  } else {
    if (reportExists) {
      throw new Error(
        `La corrida visual ${scenario.id} materializo archivos cuando debia quedar solo en planificacion.`,
      )
    }
  }

  return result
}

export async function runElectronVisualE2E({ app, mainWindow, repoRoot }) {
  const scenario = buildScenarioConfig()
  const artifactsRoot = buildArtifactsRoot(repoRoot)
  const scenarioArtifactsPath = path.join(artifactsRoot, scenario.id)
  fs.mkdirSync(scenarioArtifactsPath, { recursive: true })

  const result = await driveScenario(mainWindow, repoRoot, scenario, scenarioArtifactsPath)

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

  if (process.env.AI_ORCHESTRATOR_ELECTRON_E2E_AUTO_QUIT === '1') {
    await delay(250)
    app.quit()
  }
}

export default runElectronVisualE2E
