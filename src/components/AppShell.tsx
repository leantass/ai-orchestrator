import type { ReactNode } from 'react'

import {
  DashboardIcon,
  ResultStatusBadge,
  SidebarSectionButton,
  SurfaceHeaderTag,
  type AppIconName,
} from './AppUiPrimitives'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export type AppShellNavItem = {
  key: string
  label: string
  description: string
  active?: boolean
  badge?: string
  disabled?: boolean
  group?: string
  icon?: AppIconName
  onClick?: () => void
}

const inferNavIcon = (key: string): AppIconName => {
  switch (key) {
    case 'home':
      return 'home'
    case 'guided':
      return 'guided'
    case 'advanced':
      return 'advanced'
    case 'runs':
      return 'runs'
    case 'history':
      return 'history'
    case 'reports':
      return 'reports'
    case 'memory':
      return 'memory'
    case 'context-hub':
      return 'context'
    case 'projects':
      return 'projects'
    case 'connectors':
      return 'connectors'
    case 'settings':
      return 'settings'
    default:
      return 'flow'
  }
}

export function AppShell({
  eyebrow,
  title,
  description,
  modeSwitcher,
  quickActions,
  navItems,
  showSidebar = true,
  showMobileNav = true,
  statusLabel,
  statusDetail,
  statusBadge,
  mainContent,
  rightPanel,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  modeSwitcher: ReactNode
  quickActions?: ReactNode
  navItems: AppShellNavItem[]
  showSidebar?: boolean
  showMobileNav?: boolean
  statusLabel: string
  statusDetail: string
  statusBadge?: string
  mainContent: ReactNode
  rightPanel?: ReactNode
  footer?: ReactNode
}) {
  const groupedItems = navItems.reduce<Record<string, AppShellNavItem[]>>((accumulator, item) => {
    const groupKey = item.group || 'Operacion'
    if (!accumulator[groupKey]) {
      accumulator[groupKey] = []
    }
    accumulator[groupKey].push(item)
    return accumulator
  }, {})

  return (
    <div className="min-h-screen bg-transparent text-[color:var(--jefe-text)]">
      <div className="mx-auto flex w-full max-w-[1720px] gap-4 px-3 py-3 sm:px-6 sm:py-4 xl:px-8">
        <aside className={joinClasses('hidden w-[248px] shrink-0 xl:block', showSidebar ? '' : 'xl:hidden')}>
          <div className="sticky top-4 space-y-4">
            <section className="jefe-surface-sidebar overflow-hidden rounded-[22px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[color:var(--jefe-primary)]">
                    JEFE
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-tight text-[color:var(--jefe-text-strong)]">Orquestador de IA</div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">Una forma clara de planificar y avanzar paso a paso.</p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border jefe-tone-icon-sky">
                  <DashboardIcon name="flow" className="h-4 w-4" />
                </div>
              </div>
            </section>

            <section className="jefe-surface rounded-[24px] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--jefe-subtle)]">
                  Navegacion
                </div>
                <SurfaceHeaderTag>Shell</SurfaceHeaderTag>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedItems).map(([groupLabel, items]) => (
                  <section key={groupLabel} className="space-y-2">
                    {groupLabel === 'Operacion' ? (
                      <>
                        <div className="flex items-center justify-between gap-3 px-1">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--jefe-subtle)]">
                            {groupLabel}
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-[color:var(--jefe-line)] to-transparent" />
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <SidebarSectionButton
                              key={item.key}
                              active={Boolean(item.active)}
                              disabled={Boolean(item.disabled)}
                              label={item.label}
                              description={item.description}
                              badge={item.badge}
                              icon={item.icon || inferNavIcon(item.key)}
                              onClick={item.onClick || (() => {})}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <details className="group jefe-surface-soft rounded-[22px] px-3 py-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--jefe-subtle)]">
                            {groupLabel}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)] transition group-open:text-[color:var(--jefe-text)]">
                            {items.length} items
                          </div>
                        </summary>
                        <div className="mt-3 space-y-2">
                          {items.map((item) => (
                            <SidebarSectionButton
                              key={item.key}
                              active={Boolean(item.active)}
                              disabled={Boolean(item.disabled)}
                              label={item.label}
                              description={item.description}
                              badge={item.badge}
                              icon={item.icon || inferNavIcon(item.key)}
                              onClick={item.onClick || (() => {})}
                            />
                          ))}
                        </div>
                      </details>
                    )}
                  </section>
                ))}
              </div>
            </section>

            <section className="jefe-surface-soft rounded-[20px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--jefe-subtle)]">
                    ¿Qué es JEFE?
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[color:var(--jefe-text-strong)]">JEFE te ayuda a crear software con IA de forma segura y guiada.</div>
                  <div className="mt-2 text-xs leading-5 text-[color:var(--jefe-muted)]">No modifica proyectos reales sin una confirmación clara.</div>
                </div>
                <DashboardIcon name="brain" className="mt-1 h-4 w-4 text-[color:var(--jefe-primary)]" />
              </div>
              <div className="mt-4 rounded-[18px] border border-[color:var(--jefe-line)] bg-[color:var(--jefe-elevated)] px-4 py-3">
                <div className="text-xs font-semibold text-[color:var(--jefe-text-strong)]">{statusLabel}</div>
                <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">{statusDetail}</div>
                {statusBadge ? <div className="mt-3"><ResultStatusBadge label={statusBadge} tone="emerald" /></div> : null}
              </div>
            </section>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="jefe-surface-hero overflow-hidden rounded-[20px] px-3 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="relative z-0 min-w-0 max-w-2xl lg:flex-1">
                {eyebrow ? (
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--jefe-primary)]">
                    {eyebrow}
                  </div>
                ) : null}
                <div className="mt-1 text-base font-semibold tracking-tight text-[color:var(--jefe-text-strong)] sm:text-lg">
                  {title}
                </div>
                {description ? (
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-[color:var(--jefe-muted)]">{description}</p>
                ) : null}
              </div>

              <div className="relative z-10 flex w-full flex-col gap-2 lg:w-[420px] lg:shrink-0 lg:items-end">
                <div className="w-full lg:max-w-[260px]">{modeSwitcher}</div>
                {quickActions ? <div className="flex w-full flex-wrap gap-2 lg:justify-end">{quickActions}</div> : null}
              </div>
            </div>
          </header>

          <div className={joinClasses('mt-4 xl:hidden', showMobileNav ? '' : 'hidden')}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {navItems.map((item) => (
                <button
                  key={`mobile-${item.key}`}
                  type="button"
                  onClick={item.onClick}
                  disabled={item.disabled || !item.onClick}
                  className={joinClasses(
                    'min-w-fit rounded-full border px-3 py-2 text-sm transition',
                    item.active
                      ? 'border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary-soft)] text-[color:var(--jefe-primary)]'
                      : item.disabled
                        ? 'cursor-not-allowed border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-soft)] text-[color:var(--jefe-subtle)]'
                        : 'border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel)] text-[color:var(--jefe-text)] hover:bg-[color:var(--jefe-panel-soft)]',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="jefe-surface rounded-[20px] px-4 py-3 text-sm text-[color:var(--jefe-text)]">
                <div className="font-semibold text-[color:var(--jefe-text-strong)]">{statusLabel}</div>
                <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">{statusDetail}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">{mainContent}</div>
            {rightPanel ? <aside className="min-w-0">{rightPanel}</aside> : null}
          </div>

          {footer ? (
            <footer className="jefe-surface mt-4 rounded-[20px] px-4 py-3 text-sm text-[color:var(--jefe-muted)] sm:px-5">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  )
}
