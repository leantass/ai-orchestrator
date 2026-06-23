import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type ProjectPhaseExecutionOperationPreviewContractViewModel = {
  type?: string
  targetPath?: string
  purpose?: string
}

export type ProjectPhaseExecutionPlanContractViewModel = {
  phaseId?: string
  sourceStrategy?: string
  targetStrategy?: string
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  projectRoot?: string
  goal?: string
  reason?: string
  executableNow?: boolean
  approvalRequired?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | string
  targetFiles?: string[]
  allowedTargetPaths?: string[]
  operationsPreview?: ProjectPhaseExecutionOperationPreviewContractViewModel[]
  explicitExclusions?: string[]
  successCriteria?: string[]
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

const DELIVERY_LEVEL_LABELS: Record<string, string> = {
  'safe-first-delivery': 'Primera entrega segura',
  'frontend-project': 'Frontend project',
  'fullstack-local': 'Fullstack local',
  'monorepo-local': 'Monorepo local',
  'infra-local-plan': 'Infra local plan',
}

const getDeliveryLevelLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definido'
  }

  return (
    DELIVERY_LEVEL_LABELS[normalizedValue] ||
    normalizeOptionalString(value).replace(/-/g, ' ')
  )
}

const getRiskLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alto'
  }

  if (normalizedValue === 'medium') {
    return 'Medio'
  }

  if (normalizedValue === 'low') {
    return 'Bajo'
  }

  return normalizeOptionalString(value) || 'No definido'
}

export function ProjectPhaseExecutionPlanCard({
  plan,
  compact = false,
  onMaterializePhase,
}: {
  plan: ProjectPhaseExecutionPlanContractViewModel
  compact?: boolean
  onMaterializePhase?: (phaseId: string) => void
}) {
  const operationsPreview = plan.operationsPreview || []
  const visibleOperations = compact ? operationsPreview.slice(0, 3) : operationsPreview
  const tone: 'default' | 'sky' | 'emerald' | 'amber' | 'rose' = plan.approvalRequired
    ? 'rose'
    : plan.executableNow
      ? 'emerald'
      : 'amber'

  return (
    <article className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ejecucion de fase segura
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {normalizeOptionalString(plan.phaseId) || 'Fase sin id'}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {normalizeOptionalString(plan.reason) || 'Sin razón declarada.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {plan.executableNow ? 'Lista para materializar' : 'Solo planificacion'}
          </span>
          {onMaterializePhase && plan.executableNow ? (
            <button
              type="button"
              onClick={() => onMaterializePhase(normalizeOptionalString(plan.phaseId))}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15"
            >
              Materializar fase
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Proyecto local"
          value={normalizeOptionalString(plan.projectRoot) || 'Sin root'}
          detail={getDeliveryLevelLabel(plan.deliveryLevel)}
          tone="sky"
        />
        <MetricCard
          label="Estrategias"
          value={normalizeOptionalString(plan.sourceStrategy) || 'Sin source'}
          detail={normalizeOptionalString(plan.targetStrategy) || 'Sin target'}
        />
        <MetricCard
          label="Riesgo"
          value={getRiskLabel(plan.riskLevel)}
          detail={normalizeOptionalString(plan.goal) || 'Sin objetivo'}
          tone={tone}
        />
        <MetricCard
          label="Archivos objetivo"
          value={
            normalizeOptionalStringArray(plan.targetFiles).length > 0
              ? `${normalizeOptionalStringArray(plan.targetFiles).length} archivo(s)`
              : 'Sin archivos'
          }
          detail={normalizeOptionalStringArray(plan.targetFiles)[0] || 'Sin target'}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Paths permitidos"
          items={plan.allowedTargetPaths}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Exclusiones"
          items={plan.explicitExclusions}
          compact={compact}
          tone="amber"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Preview de operaciones
        </div>
        <div className="mt-3 grid gap-3">
          {visibleOperations.map((operation) => (
            <div
              key={`${operation.type || 'op'}-${operation.targetPath || 'path'}`}
              className="rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3"
            >
              <div className="text-sm font-medium leading-6 text-slate-100">
                {normalizeOptionalString(operation.type) || 'Operación'}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                {normalizeOptionalString(operation.targetPath) || 'Sin target path'}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {normalizeOptionalString(operation.purpose) || 'Sin propósito declarado'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}