import {
  ProjectContinuationOptionCard,
  type ProjectContinuationOptionMetricViewModel,
} from './ProjectContinuationOptionCard'

export type ProjectContinuationActionSectionItem = {
  key: string
  title: string
  description: string
  detail: string
  recommended?: boolean
  statusLabel: string
  statusToneClass: string
  categoryLabel: string
  categoryToneClass: string
  metrics: ProjectContinuationOptionMetricViewModel[]
  prepareLabel?: string
  onPrepare?: () => void
  materializeLabel?: string
  onMaterialize?: () => void
  footerMessage?: string
}

export function ProjectContinuationActionSection({
  title,
  emptyCopy,
  items,
  busy = false,
}: {
  title: string
  emptyCopy: string
  items: ProjectContinuationActionSectionItem[]
  busy?: boolean
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-4 text-sm leading-6 text-slate-400">
        {emptyCopy}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <ProjectContinuationOptionCard
            key={item.key}
            title={item.title}
            description={item.description}
            detail={item.detail}
            recommended={item.recommended}
            statusLabel={item.statusLabel}
            statusToneClass={item.statusToneClass}
            categoryLabel={item.categoryLabel}
            categoryToneClass={item.categoryToneClass}
            metrics={item.metrics}
            prepareLabel={item.prepareLabel}
            onPrepare={item.onPrepare}
            materializeLabel={item.materializeLabel}
            onMaterialize={item.onMaterialize}
            footerMessage={item.footerMessage}
            busy={busy}
          />
        ))}
      </div>
    </div>
  )
}