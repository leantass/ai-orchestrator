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
              'relative overflow-hidden rounded-[24px] border px-4 py-4 text-left transition',
              item.status === 'current'
                ? 'border-sky-300/30 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(8,15,28,0.86))] text-white shadow-[0_16px_44px_rgba(56,189,248,0.12)]'
                : item.status === 'complete'
                  ? 'border-emerald-300/20 bg-[linear-gradient(180deg,rgba(52,211,153,0.12),rgba(8,15,28,0.82))] text-emerald-50'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]',
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div
                  className={joinClasses(
                    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                    item.status === 'current'
                      ? 'border-sky-300/20 bg-sky-300/12 text-sky-100'
                      : item.status === 'complete'
                        ? 'border-emerald-300/20 bg-emerald-300/12 text-emerald-100'
                        : 'border-white/10 bg-slate-950/55 text-slate-300',
                  )}
                >
                  <DashboardIcon name={iconName} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {String(item.index + 1).padStart(2, '0')}
                  </div>
                  <div className="mt-2 text-sm font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.description}</div>
                  {item.meta ? (
                    <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      {item.meta}
                    </div>
                  ) : null}
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
