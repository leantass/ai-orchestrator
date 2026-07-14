import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { DashboardIcon, type AppIconName } from './AppUiPrimitives'
import type { AppShellNavItem } from './AppShell'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

type GenerationStepStatus = 'pending' | 'in-progress' | 'completed' | 'error'

type CommercialRunSummary = {
  id: string
  runType: string
  statusLabel: string
  projectName: string
  validationStatus: string
  runPath: string
  outputPath: string
  reportsPath: string
  screenshotsPath: string
  persistenceStatus: 'pending' | 'persisted' | 'unavailable' | 'error'
  persistenceMessage: string
  persistedArtifacts?: Record<string, string>
  hasResult: boolean
  warnings: string[]
  logs: string[]
}

type PersistedRunListItem = {
  runId: string
  title: string
  status: string
  runType: string
  createdAt?: string
  updatedAt: string
  validation?: string
  persisted?: boolean
  path: string
}

type PersistedRunDetail = {
  runId: string
  path: string
  run: {
    title?: string
    runType?: string
    createdAt?: string
    updatedAt?: string
    status?: string
    paths?: Record<string, string>
    warnings?: string[]
    expectedArtifacts?: string[]
  }
  status: {
    status?: string
    currentStep?: string
    steps?: Array<{ label: string; status: string }>
    completedAt?: string
    validation?: string
    warnings?: string[]
    errors?: string[]
  }
  brief?: string
  eventsLog?: string
  summary?: string
  artifacts?: Record<string, string>
}

type RealGenerationResult = {
  runId: string
  path?: string
  outputPath?: string
  summary?: string
  logs?: Record<string, string>
  artifacts?: Record<string, string>
  status?: {
    runId?: string
    status?: string
    currentStep?: string
    steps?: Array<{ label: string; status: string }>
    startedAt?: string
    completedAt?: string
    outputPath?: string
    validation?: Array<{ name: string; status: string; reason?: string; exitCode?: number }>
    warnings?: string[]
    errors?: string[]
  }
}

type CommercialView = 'home' | 'projects' | 'history' | 'run-detail' | 'placeholder'
type RunDetailTab = 'summary' | 'brief' | 'status' | 'artifacts' | 'logs' | 'report'

type MenuOption = {
  key: string
  label: string
  description: string
  icon: AppIconName
  action?: () => void
  view?: CommercialView
}

type RecentProject = {
  name: string
  status: string
  validation: string
  type?: string
}

const commercialMenuLabels = [
  'Nuevo sistema',
  'Proyectos',
  'Historial',
  'Plantillas',
  'Entregables',
  'Validaciones',
  'Reportes',
  'Capturas',
  'Logs',
  'Integraciones',
  'Configuracion',
  'Documentacion',
  'Git / Repos',
  'Ayuda',
]

const recentProjects: RecentProject[] = [
  {
    name: 'TuVianda',
    status: 'Generado por JEFE',
    validation: 'Validacion completa',
    type: 'Proyecto separado',
  },
  {
    name: 'Lavanderia B2B',
    status: 'Generado por JEFE',
    validation: 'Smokes locales',
    type: 'Demo local',
  },
  {
    name: 'Revenue Platform',
    status: 'Generado por JEFE',
    validation: 'AISO y Scarlett mock',
    type: 'Sandbox mock',
  },
]

const defaultGenerationSteps: Array<{ label: string; status: GenerationStepStatus }> = [
  { label: 'Leyendo brief', status: 'completed' },
  { label: 'Detectando dominio', status: 'in-progress' },
  { label: 'Definiendo modulos', status: 'pending' },
  { label: 'Generando proyecto', status: 'pending' },
  { label: 'Validando', status: 'pending' },
  { label: 'Preparando entrega', status: 'pending' },
]

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

function findNavItem(navItems: AppShellNavItem[], matchers: string[]) {
  return navItems.find((item) => {
    const key = normalizeSearch(item.key)
    const label = normalizeSearch(item.label)
    return matchers.some((matcher) => key.includes(matcher) || label.includes(matcher))
  })
}

function buildMenuOptions({
  navItems,
  onOpenTechnicalDetails,
  onOpenRunHistory,
  onBackToRunHistory,
  onCreateNewSystem,
  setActiveView,
  setPlaceholderLabel,
  setMenuOpen,
}: {
  navItems: AppShellNavItem[]
  onOpenTechnicalDetails?: () => void
  onOpenRunHistory?: () => void
  onBackToRunHistory?: () => void
  onCreateNewSystem?: () => void
  setActiveView: (value: CommercialView) => void
  setPlaceholderLabel: (value: string) => void
  setMenuOpen: (value: boolean) => void
}): MenuOption[] {
  const newSystemNav = findNavItem(navItems, ['request', 'guided', 'nueva'])
  const reportsNav = findNavItem(navItems, ['report'])
  const integrationsNav = findNavItem(navItems, ['connector', 'integracion'])
  const settingsNav = findNavItem(navItems, ['setting', 'ajuste', 'auditoria'])

  const makeOption = (
    label: string,
    description: string,
    icon: AppIconName,
    action?: () => void,
    view: MenuOption['view'] = 'placeholder',
  ): MenuOption => ({
    key: normalizeSearch(label).replace(/[^a-z0-9]+/g, '-'),
    label,
    description,
    icon,
    view,
    action: () => {
      if (action) action()
      if (!action) {
        setActiveView(view)
        setPlaceholderLabel(label)
      }
      setMenuOpen(false)
    },
  })

  return commercialMenuLabels.map((label) => {
    switch (label) {
      case 'Nuevo sistema':
        return makeOption(
          label,
          'Volver a la entrada principal para pedir un sistema.',
          'guided',
          () => {
            setActiveView('home')
            onCreateNewSystem?.()
            newSystemNav?.onClick?.()
          },
          'home',
        )
      case 'Proyectos':
        return makeOption(
          label,
          'Ver los ultimos entregables revisables.',
          'projects',
          () => {
            setActiveView('projects')
            onOpenRunHistory?.()
          },
          'projects',
        )
      case 'Historial':
        return makeOption(
          label,
          'Revisar corridas y actividad reciente.',
          'history',
          () => {
            setActiveView('history')
            onBackToRunHistory?.()
            onOpenRunHistory?.()
          },
          'history',
        )
      case 'Reportes':
        return makeOption(label, 'Abrir reportes y entregas ejecutivas.', 'reports', reportsNav?.onClick)
      case 'Logs':
        return makeOption(label, 'Abrir el detalle tecnico y la consola.', 'runs', onOpenTechnicalDetails)
      case 'Integraciones':
        return makeOption(label, 'Conectores, providers y servicios externos.', 'connectors', integrationsNav?.onClick)
      case 'Configuracion':
        return makeOption(label, 'Preferencias operativas y entorno local.', 'settings', settingsNav?.onClick)
      case 'Validaciones':
        return makeOption(label, 'Smokes, build, CI y checks locales.', 'status')
      case 'Entregables':
        return makeOption(label, 'Carpetas, reportes, capturas y cierre.', 'result')
      case 'Capturas':
        return makeOption(label, 'Evidencia visual de los proyectos.', 'files')
      case 'Plantillas':
        return makeOption(label, 'Briefs de ejemplo para empezar rapido.', 'plan')
      case 'Documentacion':
        return makeOption(label, 'Guias, contratos y notas del proyecto.', 'files')
      case 'Git / Repos':
        return makeOption(label, 'Estado de repositorios y publicaciones.', 'git')
      default:
        return makeOption(label, 'Ayuda y orientacion para usar JEFE.', 'brain')
    }
  })
}

function statusClassName(status: GenerationStepStatus) {
  if (status === 'completed') return 'jefe-commercial-step--done'
  if (status === 'in-progress') return 'jefe-commercial-step--active'
  if (status === 'error') return 'jefe-commercial-step--error'
  return 'jefe-commercial-step--pending'
}

function formatRunDate(value?: string) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRunStatus(value?: string) {
  if (value === 'completed') return 'Completado'
  if (value === 'running') return 'En progreso'
  if (value === 'error') return 'Error'
  if (value === 'unreadable') return 'No legible'
  return value || 'Sin estado'
}

function summarizeLogLines(value?: string) {
  if (!value) return []

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-12)
}

function getRunTitle(run?: PersistedRunDetail | null) {
  return run?.run.title || run?.runId || 'Run guardado'
}

export function SimpleExperienceDashboard({
  title,
  description,
  modeSwitcher,
  themeSwitcher,
  navItems,
  statusLabel,
  statusDetail,
  statusBadge,
  requestPanel,
  understoodPanel,
  planPanel,
  approvalPanel,
  rightStatusPanel,
  rightNextStepsPanel,
  rightResultPanel,
  technicalPanel,
  footer,
  generationActive = false,
  generationSteps = defaultGenerationSteps,
  runSummary,
  persistedRuns = [],
  selectedPersistedRun,
  realGenerationResult,
  realGenerationLoading = false,
  realGenerationError = '',
  runHistoryLoading = false,
  runHistoryError = '',
  onOpenTechnicalDetails,
  onBackFromProgress,
  onOpenDelivery,
  onOpenRunHistory,
  onOpenPersistedRun,
  onBackToRunHistory,
  onStartRealGeneration,
  onCreateNewSystem,
}: {
  title: string
  description: string
  modeSwitcher: ReactNode
  themeSwitcher: ReactNode
  navItems: AppShellNavItem[]
  statusLabel: string
  statusDetail: string
  statusBadge?: string
  requestPanel: ReactNode
  understoodPanel: ReactNode
  planPanel: ReactNode
  approvalPanel?: ReactNode
  rightStatusPanel: ReactNode
  rightNextStepsPanel: ReactNode
  rightResultPanel: ReactNode
  technicalPanel: ReactNode
  footer?: ReactNode
  generationActive?: boolean
  generationSteps?: Array<{ label: string; status: GenerationStepStatus }>
  runSummary?: CommercialRunSummary | null
  persistedRuns?: PersistedRunListItem[]
  selectedPersistedRun?: PersistedRunDetail | null
  realGenerationResult?: RealGenerationResult | null
  realGenerationLoading?: boolean
  realGenerationError?: string
  runHistoryLoading?: boolean
  runHistoryError?: string
  onOpenTechnicalDetails?: () => void
  onBackFromProgress?: () => void
  onOpenDelivery?: () => void
  onOpenRunHistory?: () => void
  onOpenPersistedRun?: (runId: string) => void
  onBackToRunHistory?: () => void
  onStartRealGeneration?: (runId: string) => void
  onCreateNewSystem?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [technicalOpen, setTechnicalOpen] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [activeView, setActiveView] = useState<CommercialView>('home')
  const [placeholderLabel, setPlaceholderLabel] = useState('Plantillas')
  const [runDetailTab, setRunDetailTab] = useState<RunDetailTab>('summary')
  const [generationConfirmOpen, setGenerationConfirmOpen] = useState(false)

  const handleOpenTechnicalDetails = useCallback(() => {
    onOpenTechnicalDetails?.()
    setTechnicalOpen(true)
  }, [onOpenTechnicalDetails, setTechnicalOpen])

  const menuOptions = useMemo(
    () =>
      buildMenuOptions({
        navItems,
        onOpenTechnicalDetails: handleOpenTechnicalDetails,
        onOpenRunHistory,
        onBackToRunHistory,
        onCreateNewSystem,
        setActiveView,
        setPlaceholderLabel,
        setMenuOpen,
      }),
    [
      handleOpenTechnicalDetails,
      navItems,
      onBackToRunHistory,
      onCreateNewSystem,
      onOpenRunHistory,
      setActiveView,
      setMenuOpen,
      setPlaceholderLabel,
    ],
  )

  const filteredMenuOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(menuSearch)
    if (!normalizedQuery) return menuOptions
    return menuOptions.filter((option) =>
      normalizeSearch(`${option.label} ${option.description}`).includes(normalizedQuery),
    )
  }, [menuOptions, menuSearch])

  const visibleMainView = generationActive ? 'progress' : activeView
  const recentPersistedRuns = persistedRuns.slice(0, 3)
  const runDetailTabs: Array<{ key: RunDetailTab; label: string }> = [
    { key: 'summary', label: 'Resumen' },
    { key: 'brief', label: 'Brief' },
    { key: 'status', label: 'Estado' },
    { key: 'artifacts', label: 'Artefactos' },
    { key: 'logs', label: 'Logs' },
    { key: 'report', label: 'Reporte' },
  ]
  const selectedRunLogLines = summarizeLogLines(selectedPersistedRun?.eventsLog)
  const selectedRunWarnings = [
    ...(selectedPersistedRun?.run.warnings || []),
    ...(selectedPersistedRun?.status.warnings || []),
  ]
  const generationStatus = realGenerationResult?.status?.status || ''
  const generationCompleted = generationStatus === 'completed'
  const generationFailed = generationStatus === 'failed'
  const generationOutputPath =
    realGenerationResult?.outputPath || realGenerationResult?.status?.outputPath || ''
  const generationValidation = realGenerationResult?.status?.validation || []
  const generationLogs = realGenerationResult?.logs || {}
  const generationLogLines = summarizeLogLines(
    Object.entries(generationLogs)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `## ${key}\n${value}`)
      .join('\n\n'),
  )
  const canStartRealGeneration = Boolean(
    selectedPersistedRun?.runId &&
      selectedPersistedRun?.brief &&
      !generationCompleted &&
      !realGenerationLoading,
  )

  const handleOpenRun = (runId: string) => {
    setRunDetailTab('summary')
    setActiveView('run-detail')
    onOpenPersistedRun?.(runId)
  }

  const handleBackToHistory = () => {
    setActiveView('history')
    setRunDetailTab('summary')
    setGenerationConfirmOpen(false)
    onBackToRunHistory?.()
    onOpenRunHistory?.()
  }

  const handleCreateNewSystem = () => {
    setActiveView('home')
    setRunDetailTab('summary')
    setGenerationConfirmOpen(false)
    onCreateNewSystem?.()
  }

  const handleConfirmRealGeneration = () => {
    if (!selectedPersistedRun?.runId) return

    setGenerationConfirmOpen(false)
    onStartRealGeneration?.(selectedPersistedRun.runId)
  }

  const technicalDrawerContent = (
    <div className="space-y-4">
      <div className="jefe-commercial-drawer-header">
        <div>
          <div className="jefe-commercial-kicker">Detalles tecnicos</div>
          <h2>Todo sigue disponible</h2>
          <p>Logs, validaciones, permisos y reportes quedan escondidos para no interrumpir el pedido inicial.</p>
        </div>
        <button type="button" onClick={() => setTechnicalOpen(false)} aria-label="Cerrar detalles tecnicos">
          Cerrar
        </button>
      </div>
      <div className="space-y-4">
        {runSummary ? (
          <section className="jefe-commercial-run-details" aria-label="Resumen tecnico del run">
            <div>
              <strong>{runSummary.projectName}</strong>
              <span>{runSummary.statusLabel} - {runSummary.runType}</span>
            </div>
            <dl>
              <div>
                <dt>Run</dt>
                <dd>{runSummary.id}</dd>
              </div>
              <div>
                <dt>Ruta prevista</dt>
                <dd>{runSummary.runPath}</dd>
              </div>
              <div>
                <dt>Persistencia</dt>
                <dd>
                  {runSummary.persistenceStatus === 'persisted'
                    ? 'Run persistido: si'
                    : runSummary.persistenceStatus === 'pending'
                      ? 'Run persistido: pendiente'
                      : runSummary.persistenceStatus === 'unavailable'
                        ? 'Run persistido: no disponible'
                        : 'Run persistido: error'}
                </dd>
              </div>
              <div>
                <dt>Estado IPC</dt>
                <dd>{runSummary.persistenceMessage}</dd>
              </div>
              <div>
                <dt>Reportes</dt>
                <dd>{runSummary.reportsPath}</dd>
              </div>
              <div>
                <dt>Validacion</dt>
                <dd>{runSummary.validationStatus}</dd>
              </div>
            </dl>
            {runSummary.persistedArtifacts && Object.keys(runSummary.persistedArtifacts).length > 0 ? (
              <div className="jefe-commercial-artifact-list">
                <span>Artefactos creados</span>
                {Object.entries(runSummary.persistedArtifacts).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}</strong>
                    <code>{value}</code>
                  </p>
                ))}
              </div>
            ) : null}
            {runSummary.warnings.length > 0 ? (
              <ul>
                {runSummary.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            {runSummary.logs.length > 0 ? (
              <div className="jefe-commercial-log-list">
                {runSummary.logs.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        {technicalPanel}
        {understoodPanel}
        {planPanel}
        {approvalPanel}
        {rightStatusPanel}
        {rightNextStepsPanel}
        {rightResultPanel}
      </div>
    </div>
  )

  return (
    <div className="jefe-commercial-shell">
      <header className="jefe-commercial-topbar">
        <button
          type="button"
          className="jefe-commercial-logo"
          onClick={() => setActiveView('home')}
          aria-label="Volver al inicio de JEFE"
        >
          <span>J</span>
          <strong>JEFE</strong>
        </button>
        <button
          type="button"
          className="jefe-commercial-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <main className={joinClasses('jefe-commercial-main', visibleMainView === 'home' && 'jefe-commercial-main--home')}>
        {visibleMainView === 'home' ? (
          <section className="jefe-commercial-home" aria-label="Crear sistema">
            <div className="jefe-commercial-copy">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {requestPanel}
          </section>
        ) : null}

        {visibleMainView === 'progress' ? (
          <section className="jefe-commercial-progress" aria-label="Progreso de generacion">
            <div className="jefe-commercial-progress-card">
              <div className="jefe-commercial-kicker">Creando sistema</div>
              <h1>JEFE esta interpretando tu sistema</h1>
              <p>Te muestro el avance limpio. El detalle tecnico queda a un click.</p>
              <div className="jefe-commercial-steps">
                {generationSteps.map((step, index) => (
                  <div key={step.label} className={joinClasses('jefe-commercial-step', statusClassName(step.status))}>
                    <span>{index + 1}</span>
                    <strong>{step.label}</strong>
                    <em>{step.status === 'in-progress' ? 'En progreso' : step.status === 'completed' ? 'Completado' : step.status === 'error' ? 'Error' : 'Pendiente'}</em>
                  </div>
                ))}
              </div>
              <button type="button" className="jefe-commercial-secondary-cta" onClick={handleOpenTechnicalDetails}>
                Ver detalles tecnicos
              </button>
              {onBackFromProgress ? (
                <button type="button" className="jefe-commercial-secondary-cta" onClick={onBackFromProgress}>
                  Volver
                </button>
              ) : null}
              {runSummary?.hasResult && onOpenDelivery ? (
                <button
                  type="button"
                  className="jefe-commercial-primary-cta"
                  onClick={() => {
                    onOpenDelivery()
                    handleOpenTechnicalDetails()
                  }}
                >
                  Abrir entrega
                </button>
              ) : null}
              {runSummary?.hasResult ? (
                <div className="jefe-commercial-result-summary" aria-label="Resultado del run">
                  <div>
                    <span>Proyecto</span>
                    <strong>{runSummary.projectName}</strong>
                  </div>
                  <div>
                    <span>Estado</span>
                    <strong>{runSummary.statusLabel}</strong>
                  </div>
                  <div>
                    <span>Validaciones</span>
                    <strong>{runSummary.validationStatus}</strong>
                  </div>
                  <div>
                    <span>Entrega</span>
                    <strong>
                      {runSummary.persistenceStatus === 'persisted'
                        ? 'Disponible en detalles'
                        : 'Dry-run sin archivos'}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {visibleMainView === 'projects' ? (
          <section className="jefe-commercial-projects" aria-label="Proyectos recientes">
            <div>
              <div className="jefe-commercial-kicker">Proyectos</div>
              <h1>Entregables recientes</h1>
              <p>Una vista corta para abrir demos conocidos y los ultimos runs guardados por JEFE.</p>
            </div>
            {recentPersistedRuns.length > 0 ? (
              <>
                <div className="jefe-commercial-section-heading">
                  <span>Runs persistidos</span>
                  <button type="button" onClick={handleBackToHistory}>Ver historial</button>
                </div>
                <div className="jefe-commercial-project-grid">
                  {recentPersistedRuns.map((run) => (
                    <article key={run.runId} className="jefe-commercial-project-card">
                      <div>
                        <strong>{run.title}</strong>
                        <span>{formatRunStatus(run.status)} - Dry-run</span>
                      </div>
                      <small>{run.validation || 'Validacion pendiente'}</small>
                      <p>{formatRunDate(run.updatedAt || run.createdAt)}</p>
                      <button type="button" onClick={() => handleOpenRun(run.runId)}>Abrir</button>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
            <div className="jefe-commercial-section-heading">
              <span>Demos conocidos</span>
            </div>
            <div className="jefe-commercial-project-grid">
              {recentProjects.map((project) => (
                <article key={project.name} className="jefe-commercial-project-card">
                  <div>
                    <strong>{project.name}</strong>
                    <span>{project.status}</span>
                  </div>
                  {project.type ? <small>{project.type}</small> : null}
                  <p>{project.validation}</p>
                  <button type="button" onClick={handleOpenTechnicalDetails}>Abrir</button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {visibleMainView === 'history' ? (
          <section className="jefe-commercial-projects" aria-label="Historial de sistemas">
            <div>
              <div className="jefe-commercial-kicker">Historial</div>
              <h1>Historial de sistemas</h1>
              <p>Runs guardados por JEFE. Aca podes revisar pedidos, estado, validaciones y entrega.</p>
            </div>
            {runHistoryError ? (
              <div className="jefe-commercial-inline-alert">
                <strong>No pude leer este run.</strong>
                <span>{runHistoryError}</span>
                <button type="button" onClick={handleOpenTechnicalDetails}>Ver detalles tecnicos</button>
              </div>
            ) : null}
            {runHistoryLoading ? (
              <div className="jefe-commercial-empty-state">Cargando runs guardados...</div>
            ) : null}
            {!runHistoryLoading && persistedRuns.length === 0 ? (
              <div className="jefe-commercial-empty-state">
                <strong>No hay runs guardados todavia.</strong>
                <button type="button" onClick={handleCreateNewSystem}>Crear nuevo sistema</button>
              </div>
            ) : null}
            {persistedRuns.length > 0 ? (
              <div className="jefe-commercial-run-list">
                {persistedRuns.map((run) => (
                  <article key={run.runId} className="jefe-commercial-run-card">
                    <div>
                      <strong>{run.title}</strong>
                      <span>{run.runId}</span>
                    </div>
                    <dl>
                      <div>
                        <dt>Tipo</dt>
                        <dd>{run.runType || 'dry-run'}</dd>
                      </div>
                      <div>
                        <dt>Estado</dt>
                        <dd>{formatRunStatus(run.status)}</dd>
                      </div>
                      <div>
                        <dt>Fecha</dt>
                        <dd>{formatRunDate(run.updatedAt || run.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Validacion</dt>
                        <dd>{run.validation || 'Pendiente'}</dd>
                      </div>
                      <div>
                        <dt>Persistido</dt>
                        <dd>{run.persisted === false ? 'No' : 'Si'}</dd>
                      </div>
                      <div>
                        <dt>Ruta</dt>
                        <dd>{run.path}</dd>
                      </div>
                    </dl>
                    <button type="button" onClick={() => handleOpenRun(run.runId)}>Abrir</button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {visibleMainView === 'run-detail' ? (
          <section className="jefe-commercial-projects" aria-label="Detalle de run">
            <div>
              <div className="jefe-commercial-kicker">Run guardado</div>
              <h1>{selectedPersistedRun ? getRunTitle(selectedPersistedRun) : 'Run guardado'}</h1>
              <p>Detalle ordenado del pedido, estado, artefactos y reporte del dry-run.</p>
            </div>
            <div className="jefe-commercial-detail-actions">
              <button type="button" onClick={handleBackToHistory}>Volver al historial</button>
              {selectedPersistedRun ? (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(selectedPersistedRun.runId)
                  }}
                >
                  Copiar runId
                </button>
              ) : null}
              {selectedPersistedRun ? (
                <button
                  type="button"
                  className="jefe-commercial-primary-action"
                  onClick={() => setGenerationConfirmOpen(true)}
                  disabled={!canStartRealGeneration}
                >
                  {realGenerationLoading ? 'Generando...' : generationCompleted ? 'Proyecto generado' : 'Generar proyecto real'}
                </button>
              ) : null}
            </div>
            {runHistoryError ? (
              <div className="jefe-commercial-inline-alert">
                <strong>No pude leer este run.</strong>
                <span>{runHistoryError}</span>
                <button type="button" onClick={handleOpenTechnicalDetails}>Ver detalles tecnicos</button>
              </div>
            ) : null}
            {runHistoryLoading ? (
              <div className="jefe-commercial-empty-state">Abriendo run...</div>
            ) : null}
            {!runHistoryLoading && selectedPersistedRun ? (
              <div className="jefe-commercial-run-detail">
                <div className="jefe-commercial-generation-card">
                  <div>
                    <span>Generacion real controlada</span>
                    <strong>
                      {realGenerationLoading
                        ? 'En ejecucion'
                        : generationCompleted
                          ? 'Completada'
                          : generationFailed
                            ? 'Fallida'
                            : 'Pendiente de aprobacion'}
                    </strong>
                    <p>
                      Solo se ejecuta desde este detalle y escribe en .codex-temp. No corre Codex real ni servicios externos.
                    </p>
                  </div>
                  {generationOutputPath ? (
                    <code>{generationOutputPath}</code>
                  ) : (
                    <code>Sin output generado todavia</code>
                  )}
                  {realGenerationError ? (
                    <p className="jefe-commercial-error-text">{realGenerationError}</p>
                  ) : null}
                  {generationValidation.length > 0 ? (
                    <div className="jefe-commercial-validation-strip">
                      {generationValidation.map((entry) => (
                        <span key={`${entry.name}-${entry.status}`}>
                          {entry.name}: {entry.status}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="jefe-commercial-run-detail-summary">
                  <div>
                    <span>Estado</span>
                    <strong>{formatRunStatus(selectedPersistedRun.status.status || selectedPersistedRun.run.status)}</strong>
                  </div>
                  <div>
                    <span>Fecha</span>
                    <strong>{formatRunDate(selectedPersistedRun.run.updatedAt || selectedPersistedRun.run.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Tipo</span>
                    <strong>{selectedPersistedRun.run.runType || 'dry-run'}</strong>
                  </div>
                  <div>
                    <span>Validacion</span>
                    <strong>{selectedPersistedRun.status.validation || 'Pendiente'}</strong>
                  </div>
                </div>
                <div className="jefe-commercial-tabs" role="tablist" aria-label="Detalle del run">
                  {runDetailTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={runDetailTab === tab.key}
                      data-active={runDetailTab === tab.key}
                      onClick={() => setRunDetailTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="jefe-commercial-tab-panel">
                  {runDetailTab === 'summary' ? (
                    <div className="jefe-commercial-detail-grid">
                      <div>
                        <span>Run</span>
                        <strong>{selectedPersistedRun.runId}</strong>
                      </div>
                      <div>
                        <span>Ruta</span>
                        <strong>{selectedPersistedRun.path}</strong>
                      </div>
                      <div>
                        <span>Paso actual</span>
                        <strong>{selectedPersistedRun.status.currentStep || 'Sin paso actual'}</strong>
                      </div>
                      <div>
                        <span>Persistencia</span>
                        <strong>Run persistido</strong>
                      </div>
                      {selectedRunWarnings.length > 0 ? (
                        <div className="jefe-commercial-detail-wide">
                          <span>Warnings</span>
                          {selectedRunWarnings.map((warning) => (
                            <p key={warning}>{warning}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {runDetailTab === 'brief' ? (
                    <pre className="jefe-commercial-readable-block">{selectedPersistedRun.brief || 'Sin brief guardado.'}</pre>
                  ) : null}
                  {runDetailTab === 'status' ? (
                    <div className="jefe-commercial-step-list">
                      {(selectedPersistedRun.status.steps || []).map((step) => (
                        <div key={`${step.label}-${step.status}`}>
                          <strong>{step.label}</strong>
                          <span>{formatRunStatus(step.status)}</span>
                        </div>
                      ))}
                      {(selectedPersistedRun.status.steps || []).length === 0 ? (
                        <p>Sin pasos guardados.</p>
                      ) : null}
                      {(realGenerationResult?.status?.steps || []).length > 0 ? (
                        <>
                          <h3>Generacion real</h3>
                          {(realGenerationResult?.status?.steps || []).map((step) => (
                            <div key={`generation-${step.label}-${step.status}`}>
                              <strong>{step.label}</strong>
                              <span>{formatRunStatus(step.status)}</span>
                            </div>
                          ))}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {runDetailTab === 'artifacts' ? (
                    <div className="jefe-commercial-artifact-list">
                      {Object.entries(selectedPersistedRun.artifacts || selectedPersistedRun.run.paths || {}).map(
                        ([key, value]) => (
                          <p key={key}>
                            <strong>{key}</strong>
                            <code>{value}</code>
                          </p>
                        ),
                      )}
                      {Object.entries(realGenerationResult?.artifacts || {}).map(([key, value]) => (
                        <p key={`generation-${key}`}>
                          <strong>generation.{key}</strong>
                          <code>{value}</code>
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {runDetailTab === 'logs' ? (
                    <div className="jefe-commercial-log-list">
                      {selectedRunLogLines.length > 0 ? (
                        selectedRunLogLines.map((line) => <p key={line}>{line}</p>)
                      ) : (
                        <p>Sin logs guardados.</p>
                      )}
                      {generationLogLines.length > 0 ? (
                        <>
                          <h3>Generacion real</h3>
                          {generationLogLines.map((line) => <p key={`generation-${line}`}>{line}</p>)}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {runDetailTab === 'report' ? (
                    <pre className="jefe-commercial-readable-block">
                      {realGenerationResult?.summary || selectedPersistedRun.summary || 'Sin reporte guardado.'}
                    </pre>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {visibleMainView === 'placeholder' ? (
          <section className="jefe-commercial-placeholder" aria-label={placeholderLabel}>
            <div className="jefe-commercial-kicker">JEFE</div>
            <h1>{placeholderLabel}</h1>
            <p>Esta seccion queda lista como acceso ordenado. La capacidad existe o queda reservada sin romper la experiencia principal.</p>
            <button type="button" className="jefe-commercial-secondary-cta" onClick={handleOpenTechnicalDetails}>
              Ver detalles
            </button>
          </section>
        ) : null}
      </main>

      {generationConfirmOpen ? (
        <div className="jefe-commercial-modal-backdrop" role="presentation">
          <section className="jefe-commercial-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="real-generation-title">
            <div className="jefe-commercial-kicker">Aprobacion requerida</div>
            <h2 id="real-generation-title">Generar proyecto real</h2>
            <p>
              JEFE va a materializar este sistema desde el brief guardado. El output quedara en .codex-temp y no se tocaran proyectos externos ni servicios reales.
            </p>
            <div className="jefe-commercial-confirm-summary">
              <span>Run</span>
              <strong>{selectedPersistedRun?.runId}</strong>
              <span>Destino</span>
              <strong>.codex-temp/jefe-real-generation/runs/{selectedPersistedRun?.runId}/output</strong>
            </div>
            <div className="jefe-commercial-modal-actions">
              <button type="button" onClick={() => setGenerationConfirmOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="jefe-commercial-primary-action" onClick={handleConfirmRealGeneration}>
                Generar proyecto real
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <aside className={joinClasses('jefe-commercial-drawer', menuOpen && 'is-open')} aria-hidden={!menuOpen}>
        <div className="jefe-commercial-drawer-header">
          <div>
            <div className="jefe-commercial-kicker">Menu</div>
            <h2>JEFE</h2>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menu">
            Cerrar
          </button>
        </div>
        <label className="jefe-commercial-search">
          <span>Buscar</span>
          <input
            value={menuSearch}
            onChange={(event) => setMenuSearch(event.target.value)}
            placeholder="Buscar en JEFE..."
          />
        </label>
        <nav className="jefe-commercial-menu-list" aria-label="Menu principal">
          {filteredMenuOptions.map((option) => (
            <button key={option.key} type="button" onClick={option.action}>
              <DashboardIcon name={option.icon} />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
          {filteredMenuOptions.length === 0 ? (
            <div className="jefe-commercial-empty">No encontre opciones para esa busqueda.</div>
          ) : null}
        </nav>
        <div className="jefe-commercial-menu-footer">
          <div>{themeSwitcher}</div>
          <div>{modeSwitcher}</div>
          <p>{statusBadge || statusLabel} · {statusDetail}</p>
        </div>
      </aside>

      <aside className={joinClasses('jefe-commercial-drawer jefe-commercial-drawer--technical', technicalOpen && 'is-open')} aria-hidden={!technicalOpen}>
        {technicalDrawerContent}
      </aside>

      {(menuOpen || technicalOpen) ? (
        <button
          type="button"
          className="jefe-commercial-backdrop"
          aria-label="Cerrar panel"
          onClick={() => {
            setMenuOpen(false)
            setTechnicalOpen(false)
          }}
        />
      ) : null}

      {footer ? <footer className="jefe-commercial-footer">{footer}</footer> : null}
    </div>
  )
}
