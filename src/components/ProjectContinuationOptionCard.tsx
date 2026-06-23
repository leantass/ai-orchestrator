import { MetricCard, type MetricTone } from './AppUiPrimitives'

export type ProjectContinuationOptionMetricViewModel = {
  label: string
  value: string
  detail: string
  tone?: MetricTone
}

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export function ProjectContinuationOptionCard({
  title,
  description,
  detail,
  recommended = false,
  statusLabel,
  statusToneClass,
  categoryLabel,
  categoryToneClass,
  metrics,
  prepareLabel,
  onPrepare,
  materializeLabel,
  onMaterialize,
  footerMessage,
  busy = false,
}: {
  title: string
  description: string
  detail: string
  recommended?: boolean
  statusLabel: string
  statusToneClass: string
  categoryLabel: string
  categoryToneClass?: string
  metrics: ProjectContinuationOptionMetricViewModel[]
  prepareLabel?: string
  onPrepare?: () => void
  materializeLabel?: string
  onMaterialize?: () => void
  footerMessage?: string
  busy?: boolean
}) {
  return (
    <article className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium leading-6 text-slate-100">{title}</div>
            {recommended ? (
              <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                Recomendado
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{detail}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              statusToneClass,
            )}
          >
            {statusLabel}
          </span>
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              categoryToneClass || 'border-white/10 bg-white/5 text-slate-200',
            )}
          >
            {categoryLabel}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prepareLabel && onPrepare ? (
          <button
            type="button"
            onClick={onPrepare}
            disabled={busy}
            className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            {prepareLabel}
          </button>
        ) : null}
        {materializeLabel && onMaterialize ? (
          <button
            type="button"
            onClick={onMaterialize}
            disabled={busy}
            className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            {materializeLabel}
          </button>
        ) : footerMessage ? (
          <span className="text-sm leading-6 text-slate-400">{footerMessage}</span>
        ) : null}
      </div>
    </article>
  )
}