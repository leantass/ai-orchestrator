import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type PhaseExpansionPlanContractViewModel = {
  phaseId?: string
  goal?: string
  targetFiles?: string[]
  changesExpected?: string[]
  risks?: string[]
  validationPlan?: unknown | null
  executableNow?: boolean
  approvalRequired?: boolean
  nextExpectedAction?: string
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

export function PhaseExpansionPlanCard({
  plan,
  compact = false,
}: {
  plan: PhaseExpansionPlanContractViewModel
  compact?: boolean
}) {
  return (
    <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Expansión de siguiente fase
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Propuesta acotada para la próxima mejora de fase; no se ejecuta automáticamente.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {normalizeOptionalString(plan.phaseId) || 'Sin phaseId'}
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
            {plan.executableNow ? 'Ejecutable ahora' : 'Solo propuesta'}
          </span>
          {plan.approvalRequired ? (
            <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-medium text-rose-100">
              Requiere aprobación
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Objetivo"
          value={normalizeOptionalString(plan.goal) || 'Sin objetivo'}
          tone="emerald"
        />
        <MetricCard
          label="Siguiente acción"
          value={normalizeOptionalString(plan.nextExpectedAction) || 'Sin acción'}
        />
        <MetricCard
          label="Target files"
          value={
            normalizeOptionalStringArray(plan.targetFiles).length > 0
              ? `${normalizeOptionalStringArray(plan.targetFiles).length} archivo(s)`
              : 'Sin archivos'
          }
          detail={
            normalizeOptionalStringArray(plan.targetFiles)[0] || 'Sin target declarado'
          }
        />
        <MetricCard
          label="Riesgos"
          value={
            normalizeOptionalStringArray(plan.risks).length > 0
              ? `${normalizeOptionalStringArray(plan.risks).length} riesgo(s)`
              : 'Sin riesgos'
          }
          detail={normalizeOptionalStringArray(plan.risks)[0] || 'Sin detalle'}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Cambios esperados"
          items={plan.changesExpected}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Target files"
          items={plan.targetFiles}
          compact={compact}
          tone="sky"
        />
      </div>
    </article>
  )
}