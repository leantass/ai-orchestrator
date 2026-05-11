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
    <div className="flex flex-wrap gap-2">
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
              'group min-w-fit overflow-hidden rounded-full border px-3 py-2 text-left transition duration-200',
              item.status === 'current'
                ? 'border-sky-300/28 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_36%),linear-gradient(180deg,rgba(56,189,248,0.1),rgba(8,15,28,0.9))] text-white shadow-[0_16px_44px_rgba(56,189,248,0.12)]'
                : item.status === 'complete'
                  ? 'border-emerald-300/18 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_36%),linear-gradient(180deg,rgba(52,211,153,0.07),rgba(8,15,28,0.9))] text-emerald-50'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.016))] text-slate-300 hover:border-white/18 hover:bg-white/[0.05]',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={joinClasses(
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                    item.status === 'current'
                      ? 'border-sky-300/20 bg-sky-300/12 text-sky-100'
                      : item.status === 'complete'
                        ? 'border-emerald-300/20 bg-emerald-300/12 text-emerald-100'
                        : 'border-white/10 bg-slate-950/60 text-slate-300',
                  )}
                >
                  <DashboardIcon name={iconName} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {String(item.index + 1).padStart(2, '0')}
                  </div>
                  <div className="text-sm font-semibold">{item.label}</div>
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
