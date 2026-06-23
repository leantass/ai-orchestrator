import { MetricCard } from './AppUiPrimitives'

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export function ProjectContinuationModuleCard({
  title,
  timestamp,
  statusLabel,
  statusToneClass,
  layersValue,
  layersDetail,
  filesValue,
  filesDetail,
}: {
  title: string
  timestamp: string
  statusLabel: string
  statusToneClass: string
  layersValue: string
  layersDetail: string
  filesValue: string
  filesDetail: string
}) {
  return (
    <article className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-medium leading-6 text-slate-100">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">{timestamp}</div>
        </div>
        <span
          className={joinClasses(
            'rounded-full border px-3 py-1 text-xs font-medium',
            statusToneClass,
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MetricCard
          label="Capas"
          value={layersValue}
          detail={layersDetail}
        />
        <MetricCard
          label="Archivos"
          value={filesValue}
          detail={filesDetail}
          tone="sky"
        />
      </div>
    </article>
  )
}