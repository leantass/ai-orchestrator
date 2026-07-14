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
  hasResult: boolean
  warnings: string[]
  logs: string[]
}

type MenuOption = {
  key: string
  label: string
  description: string
  icon: AppIconName
  action?: () => void
  view?: 'home' | 'projects' | 'placeholder'
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
  setActiveView,
  setPlaceholderLabel,
  setMenuOpen,
}: {
  navItems: AppShellNavItem[]
  onOpenTechnicalDetails?: () => void
  setActiveView: (value: 'home' | 'projects' | 'placeholder') => void
  setPlaceholderLabel: (value: string) => void
  setMenuOpen: (value: boolean) => void
}): MenuOption[] {
  const newSystemNav = findNavItem(navItems, ['request', 'guided', 'nueva'])
  const historyNav = findNavItem(navItems, ['history', 'actividad', 'corrida'])
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
          },
          'projects',
        )
      case 'Historial':
        return makeOption(label, 'Revisar corridas y actividad reciente.', 'history', historyNav?.onClick)
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
  onOpenTechnicalDetails,
  onBackFromProgress,
  onOpenDelivery,
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
  onOpenTechnicalDetails?: () => void
  onBackFromProgress?: () => void
  onOpenDelivery?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [technicalOpen, setTechnicalOpen] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [activeView, setActiveView] = useState<'home' | 'projects' | 'placeholder'>('home')
  const [placeholderLabel, setPlaceholderLabel] = useState('Plantillas')

  const handleOpenTechnicalDetails = useCallback(() => {
    onOpenTechnicalDetails?.()
    setTechnicalOpen(true)
  }, [onOpenTechnicalDetails])

  const menuOptions = useMemo(
    () =>
      buildMenuOptions({
        navItems,
        onOpenTechnicalDetails: handleOpenTechnicalDetails,
        setActiveView,
        setPlaceholderLabel,
        setMenuOpen,
      }),
    [handleOpenTechnicalDetails, navItems],
  )

  const filteredMenuOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(menuSearch)
    if (!normalizedQuery) return menuOptions
    return menuOptions.filter((option) =>
      normalizeSearch(`${option.label} ${option.description}`).includes(normalizedQuery),
    )
  }, [menuOptions, menuSearch])

  const visibleMainView = generationActive ? 'progress' : activeView

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
                <dt>Reportes</dt>
                <dd>{runSummary.reportsPath}</dd>
              </div>
              <div>
                <dt>Validacion</dt>
                <dd>{runSummary.validationStatus}</dd>
              </div>
            </dl>
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
                    <span>Output</span>
                    <strong>{runSummary.outputPath}</strong>
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
              <p>Una vista corta para abrir lo importante sin convertir la home en un tablero tecnico.</p>
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
