import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export function ProjectContinuationGroupsPanel({
  completedPhases,
  pendingPhases,
  modulesAvailable,
  riskItems,
  blockerItems,
  compact = false,
}: {
  completedPhases: string[]
  pendingPhases: string[]
  modulesAvailable: string[]
  riskItems: string[]
  blockerItems: string[]
  compact?: boolean
}) {
  return (
    <>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Ya completado"
          items={completedPhases}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Falta resolver"
          items={pendingPhases}
          compact={compact}
          tone={pendingPhases.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Podría sumar después"
          items={modulesAvailable}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Riesgo controlado"
          items={riskItems}
          compact={compact}
          tone="amber"
        />
      </div>

      {blockerItems.length > 0 ? (
        <div className="mt-4">
          <ProductArchitectureGroup
            title="Bloqueos actuales"
            items={blockerItems}
            compact={compact}
            tone="rose"
          />
        </div>
      ) : null}
    </>
  )
}