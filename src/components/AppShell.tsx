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
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex w-full max-w-[1720px] gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <aside className={joinClasses('hidden w-[248px] shrink-0 xl:block', showSidebar ? '' : 'xl:hidden')}>
          <div className="sticky top-4 space-y-4">
            <section className="overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),linear-gradient(180deg,rgba(5,10,21,0.98),rgba(8,15,28,0.9))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
                    JEFE
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-tight text-white">Flujo simple</div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Una accion clara por paso.</p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <DashboardIcon name="flow" className="h-4 w-4" />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
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

            <section className="rounded-[20px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Sistema
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
          <header className="overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,11,22,0.98),rgba(8,15,28,0.9))] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 max-w-2xl">
                {eyebrow ? (
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/72">
                    {eyebrow}
                  </div>
                ) : null}
                <div className="mt-1 text-base font-semibold tracking-tight text-white sm:text-lg">
                  {title}
                </div>
                {description ? (
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{description}</p>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-2 lg:max-w-[420px] lg:items-end">
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

          <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">{mainContent}</div>
            {rightPanel ? <aside className="min-w-0">{rightPanel}</aside> : null}
          </div>

          {footer ? (
            <footer className="mt-4 rounded-[20px] border border-white/8 bg-slate-950/60 px-4 py-3 text-sm text-slate-400 shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur sm:px-5">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  )
}
