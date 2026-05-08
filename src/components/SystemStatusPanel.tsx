import { ResultStatusBadge, type MetricTone } from './AppUiPrimitives'

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
  }>
}) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-100">{item.label}</div>
              <ResultStatusBadge label={item.value} tone={item.tone} />
            </div>
            {item.detail ? (
              <div className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</div>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  )
}
