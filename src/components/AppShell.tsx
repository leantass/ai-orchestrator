import type { ReactNode } from 'react'

import {
  DashboardIcon,
  ResultStatusBadge,
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
      <div className="mx-auto flex w-full max-w-[1820px] gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <aside className="hidden w-[320px] shrink-0 xl:block">
          <div className="sticky top-4 space-y-4">
            <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),linear-gradient(180deg,rgba(5,10,21,0.98),rgba(8,15,28,0.9))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
                    JEFE
                  </div>
                  <div className="mt-3 text-[28px] font-semibold tracking-tight text-white">
                    Centro de control
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Operacion guiada, memoria, planificacion y ejecucion en un shell
                    mas claro y mas ejecutivo.
                  </p>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <DashboardIcon name="flow" className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Shell
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">Operacion guiada</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Enfoque
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">Centro premium</div>
                </div>
              </div>
            </section>

            {sidebarInsights ? (
              <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
                {sidebarInsights}
              </section>
            ) : null}

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Navegacion principal
                </div>
                <SurfaceHeaderTag>Control</SurfaceHeaderTag>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedItems).map(([groupLabel, items]) => (
                  <section key={groupLabel} className="space-y-2">
                    <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {groupLabel}
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={item.onClick}
                          disabled={item.disabled || !item.onClick}
                          className={joinClasses(
                            'group w-full rounded-[22px] border px-4 py-4 text-left transition',
                            item.active
                              ? 'border-sky-300/30 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.88))] text-white shadow-[0_18px_48px_rgba(56,189,248,0.12)]'
                              : item.disabled
                                ? 'cursor-not-allowed border-white/8 bg-white/[0.02] text-slate-500'
                                : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 gap-3">
                              <div
                                className={joinClasses(
                                  'mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                                  item.active
                                    ? 'border-sky-300/25 bg-sky-300/12 text-sky-100'
                                    : 'border-white/10 bg-slate-950/55 text-slate-300',
                                )}
                              >
                                <DashboardIcon
                                  name={item.icon || inferNavIcon(item.key)}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold">{item.label}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {item.badge ? (
                                <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                                  {item.badge}
                                </span>
                              ) : null}
                              <DashboardIcon
                                name="next"
                                className={joinClasses(
                                  'h-4 w-4',
                                  item.active
                                    ? 'text-sky-100'
                                    : item.disabled
                                      ? 'text-slate-600'
                                      : 'text-slate-500 group-hover:text-slate-300',
                                )}
                              />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Estado del shell
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{statusLabel}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{statusDetail}</div>
                </div>
                {statusBadge ? <ResultStatusBadge label={statusBadge} tone="emerald" /> : null}
              </div>
            </section>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_26%),linear-gradient(180deg,rgba(6,11,22,0.96),rgba(8,15,28,0.9))] px-5 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:px-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/78">
                      {eyebrow}
                    </div>
                    <SurfaceHeaderTag>Centro premium</SurfaceHeaderTag>
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2.3rem]">
                    {title}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-[15px]">
                    {description}
                  </p>
                </div>

                <div className="flex w-full max-w-[560px] flex-col gap-3 xl:items-end">
                  <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                    <div className="w-full lg:max-w-[280px]">{modeSwitcher}</div>
                    {operatorPanel ? (
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-2">
                        {operatorPanel}
                      </div>
                    ) : null}
                  </div>
                  {quickActions ? (
                    <div className="flex w-full flex-wrap gap-2 xl:justify-end">{quickActions}</div>
                  ) : null}
                </div>
              </div>

              {topMetrics ? <div className="grid gap-3 xl:grid-cols-4">{topMetrics}</div> : null}
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
          </div>

          <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">{mainContent}</div>
            {rightPanel ? <aside className="min-w-0">{rightPanel}</aside> : null}
          </div>

          {footer ? (
            <footer className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/55 px-4 py-3 text-sm text-slate-400 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur sm:px-5">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  )
}
