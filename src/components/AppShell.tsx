import type { ReactNode } from 'react'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export type AppShellNavItem = {
  key: string
  label: string
  description: string
  active?: boolean
  badge?: string
  disabled?: boolean
  onClick?: () => void
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
}) {
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex w-full max-w-[1760px] gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <aside className="hidden w-[290px] shrink-0 xl:block">
          <div className="sticky top-4 space-y-4">
            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
                JEFE
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Centro de control
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Operación guiada, memoria, planificación y ejecución desde un shell
                más claro.
              </p>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Navegación principal
              </div>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled || !item.onClick}
                    className={joinClasses(
                      'w-full rounded-2xl border px-4 py-3 text-left transition',
                      item.active
                        ? 'border-cyan-300/30 bg-cyan-300/12 text-white shadow-[0_10px_32px_rgba(34,211,238,0.16)]'
                        : item.disabled
                          ? 'cursor-not-allowed border-white/8 bg-white/[0.02] text-slate-500'
                          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">
                          {item.description}
                        </div>
                      </div>
                      {item.badge ? (
                        <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Estado del shell
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">{statusLabel}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{statusDetail}</div>
                </div>
                {statusBadge ? (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    {statusBadge}
                  </span>
                ) : null}
              </div>
            </section>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="rounded-[30px] border border-white/10 bg-slate-950/70 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
                  {eyebrow}
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem]">
                  {title}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-[15px]">
                  {description}
                </p>
              </div>
              <div className="flex w-full max-w-[520px] flex-col gap-3 xl:items-end">
                <div className="w-full">{modeSwitcher}</div>
                {quickActions ? <div className="flex w-full flex-wrap gap-2 xl:justify-end">{quickActions}</div> : null}
              </div>
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
                      ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-50'
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

          <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
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
