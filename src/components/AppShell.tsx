import type { ReactNode } from 'react'

import {
  DashboardIcon,
  DisclosurePanel,
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
  statusLabel,
  statusDetail,
  statusBadge,
  mainContent,
  rightPanel,
  footer,
  topMetrics,
  operatorPanel,
  sidebarInsights,
}: {
  eyebrow: string
  title: string
  description: string
  modeSwitcher: ReactNode
  quickActions?: ReactNode
  navItems: AppShellNavItem[]
  statusLabel: string
  statusDetail: string
  statusBadge?: string
  mainContent: ReactNode
  rightPanel?: ReactNode
  footer?: ReactNode
  topMetrics?: ReactNode
  operatorPanel?: ReactNode
  sidebarInsights?: ReactNode
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
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex w-full max-w-[1840px] gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <aside className="hidden w-[282px] shrink-0 xl:block">
          <div className="sticky top-4 space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.14),transparent_28%),linear-gradient(180deg,rgba(5,10,21,0.98),rgba(8,15,28,0.9))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
                    JEFE
                  </div>
                  <div className="mt-3 text-[24px] font-semibold tracking-tight text-white">Modo operador</div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Menos ruido, una accion clara y detalle tecnico a demanda.
                  </p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <DashboardIcon name="flow" className="h-5 w-5" />
                </div>
              </div>
            </section>

            {sidebarInsights ? (
              <DisclosurePanel
                title="Ver foco del flujo"
                description="Estado rapido del recorrido actual."
                icon="guided"
                badge="Resumen"
              >
                {sidebarInsights}
              </DisclosurePanel>
            ) : null}

            <section className="rounded-[28px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            {groupLabel}
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-white/8 to-transparent" />
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <SidebarSectionButton
                              key={item.key}
                              active={Boolean(item.active)}
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
                      <details className="group rounded-[22px] border border-white/8 bg-white/[0.02] px-3 py-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            {groupLabel}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition group-open:text-slate-300">
                            {items.length} items
                          </div>
                        </summary>
                        <div className="mt-3 space-y-2">
                          {items.map((item) => (
                            <SidebarSectionButton
                              key={item.key}
                              active={Boolean(item.active)}
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

            <section className="rounded-[24px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Sistema
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{statusLabel}</div>
                  <div className="mt-2 text-xs leading-5 text-slate-400">{statusDetail}</div>
                </div>
                {statusBadge ? <ResultStatusBadge label={statusBadge} tone="emerald" /> : null}
              </div>
            </section>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_70%_10%,rgba(167,139,250,0.08),transparent_18%),linear-gradient(180deg,rgba(6,11,22,0.98),rgba(8,15,28,0.9))] px-5 py-5 shadow-[0_32px_96px_rgba(0,0,0,0.38)] backdrop-blur sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/78">
                      {eyebrow}
                    </div>
                    <SurfaceHeaderTag>Uso simple</SurfaceHeaderTag>
                  </div>
                  <div className="mt-3 max-w-3xl text-[2rem] font-semibold tracking-tight text-white sm:text-[2.2rem]">
                    {title}
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                    {description}
                  </p>
                </div>

                <div className="flex w-full max-w-[480px] flex-col gap-3 2xl:items-end">
                  <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
                    <div className="w-full xl:max-w-[280px]">{modeSwitcher}</div>
                    {operatorPanel ? (
                      <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-2">
                        {operatorPanel}
                      </div>
                    ) : null}
                  </div>
                  {quickActions ? <div className="flex w-full flex-wrap gap-2">{quickActions}</div> : null}
                </div>
              </div>

              {topMetrics ? <div className="grid gap-3 lg:grid-cols-2">{topMetrics}</div> : null}
            </div>
          </header>

          <div className="mt-4 xl:hidden">
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
                      ? 'border-sky-300/30 bg-sky-300/12 text-sky-50'
                      : item.disabled
                        ? 'cursor-not-allowed border-white/8 bg-white/[0.02] text-slate-500'
                        : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                <div className="font-semibold text-white">{statusLabel}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{statusDetail}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">{mainContent}</div>
            {rightPanel ? <aside className="min-w-0">{rightPanel}</aside> : null}
          </div>

          {footer ? (
            <footer className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/60 px-4 py-3 text-sm text-slate-400 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur sm:px-5">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  )
}
