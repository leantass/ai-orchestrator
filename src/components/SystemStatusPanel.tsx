import {
  DashboardIcon,
  ResultStatusBadge,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

function inferStatusIcon(label: string): AppIconName {
  const normalizedLabel = label.toLowerCase()
  if (normalizedLabel.includes('plan')) return 'plan'
  if (normalizedLabel.includes('ejecutor')) return 'execution'
  if (normalizedLabel.includes('reuse')) return 'memory'
  if (normalizedLabel.includes('memoria')) return 'context'
  return 'services'
}

export function SystemStatusPanel({
  title = 'Estado del sistema',
  items,
}: {
  title?: string
  items: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
    icon?: AppIconName
  }>
}) {
  return (
    <article className="rounded-[30px] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {title}
        </div>
        <SurfaceHeaderTag>{items.length} nodos</SurfaceHeaderTag>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-200">
                  <DashboardIcon name={item.icon || inferStatusIcon(item.label)} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{item.label}</div>
                  {item.detail ? (
                    <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                  ) : null}
                </div>
              </div>
              <ResultStatusBadge label={item.value} tone={item.tone} />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
