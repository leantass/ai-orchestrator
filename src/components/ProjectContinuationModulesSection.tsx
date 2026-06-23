import { ProjectContinuationModuleCard } from './ProjectContinuationModuleCard'

export type ProjectContinuationModuleSectionItem = {
  key: string
  title: string
  timestamp: string
  statusLabel: string
  statusToneClass: string
  layersValue: string
  layersDetail: string
  filesValue: string
  filesDetail: string
}

export function ProjectContinuationModulesSection({
  title,
  items,
}: {
  title: string
  items: ProjectContinuationModuleSectionItem[]
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {items.map((item) => (
          <ProjectContinuationModuleCard
            key={item.key}
            title={item.title}
            timestamp={item.timestamp}
            statusLabel={item.statusLabel}
            statusToneClass={item.statusToneClass}
            layersValue={item.layersValue}
            layersDetail={item.layersDetail}
            filesValue={item.filesValue}
            filesDetail={item.filesDetail}
          />
        ))}
      </div>
    </div>
  )
}