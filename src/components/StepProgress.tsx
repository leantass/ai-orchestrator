import { DashboardIcon, ResultStatusBadge, type AppIconName, type MetricTone } from './AppUiPrimitives'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export type StepProgressItem = {
  key: string
  index: number
  label: string
  description: string
  status: 'current' | 'complete' | 'pending'
  onClick: () => void
  meta?: string
}

const iconByStepKey: Record<string, AppIconName> = {
  goal: 'goal',
  context: 'context',
  brain: 'brain',
  memory: 'memory',
  plan: 'plan',
  execution: 'execution',
  result: 'result',
}

const toneByStatus: Record<StepProgressItem['status'], MetricTone> = {
  current: 'sky',
  complete: 'emerald',
  pending: 'default',
}

export function StepProgress({ items }: { items: StepProgressItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-7">
      {items.map((item) => {
        const iconName = iconByStepKey[item.key] || 'flow'
        const tone = toneByStatus[item.status]
        const statusLabel =
          item.status === 'current' ? 'Actual' : item.status === 'complete' ? 'Listo' : 'Pendiente'

        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={joinClasses(
              'group relative overflow-hidden rounded-[26px] border px-4 py-4 text-left transition duration-200',
              item.status === 'current'
                ? 'border-sky-300/28 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_36%),linear-gradient(180deg,rgba(56,189,248,0.12),rgba(8,15,28,0.9))] text-white shadow-[0_18px_48px_rgba(56,189,248,0.12)]'
                : item.status === 'complete'
                  ? 'border-emerald-300/18 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.14),transparent_36%),linear-gradient(180deg,rgba(52,211,153,0.08),rgba(8,15,28,0.9))] text-emerald-50'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] text-slate-300 hover:border-white/18 hover:bg-white/[0.06]',
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
            <div
              className={joinClasses(
                'absolute bottom-0 left-0 top-0 w-1 rounded-r-full transition',
                item.status === 'current'
                  ? 'bg-cyan-300/80'
                  : item.status === 'complete'
                    ? 'bg-emerald-300/70'
                    : 'bg-white/6',
              )}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className={joinClasses(
                      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border',
                      item.status === 'current'
                        ? 'border-sky-300/20 bg-sky-300/12 text-sky-100'
                        : item.status === 'complete'
                          ? 'border-emerald-300/20 bg-emerald-300/12 text-emerald-100'
                          : 'border-white/10 bg-slate-950/60 text-slate-300',
                    )}
                  >
                    <DashboardIcon name={iconName} className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {String(item.index + 1).padStart(2, '0')}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{item.label}</div>
                  </div>
                </div>

                <div className="mt-4 flex min-h-[116px] flex-col justify-between">
                  <div className="text-xs leading-5 text-slate-400">{item.description}</div>
                  <div className="mt-4 space-y-3">
                    {item.meta ? (
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.meta}
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                        Sin nota adicional
                      </div>
                    )}
                    <div className="rounded-full border border-white/8 bg-slate-950/65 p-1">
                      <div
                        className={joinClasses(
                          'h-1.5 rounded-full transition-all duration-500',
                          item.status === 'current'
                            ? 'w-[68%] bg-gradient-to-r from-sky-400 via-cyan-200 to-cyan-50'
                            : item.status === 'complete'
                              ? 'w-full bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-50'
                              : 'w-[18%] bg-gradient-to-r from-slate-300/30 via-slate-200/30 to-white/35',
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <ResultStatusBadge label={statusLabel} tone={tone} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
