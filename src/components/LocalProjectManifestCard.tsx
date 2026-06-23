import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type LocalProjectManifestPhaseContractViewModel = {
  id?: string
  title?: string
  description?: string
  objective?: string
  summary?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  safeToMaterialize?: boolean
  approvalRequired?: boolean
  targetStrategy?: string
  validationHints?: string[]
  allowedTargetPaths?: string[]
  nextRecommendedPhase?: string
  files?: string[]
}

export type LocalProjectManifestContractViewModel = {
  version?: number
  projectType?: string
  domain?: string
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  createdBy?: string
  materializationLayer?: string
  projectRoot?: string
  generatedAt?: string
  phases?: LocalProjectManifestPhaseContractViewModel[]
  forbiddenPaths?: string[]
  nextRecommendedPhase?: string
  nextRecommendedAction?: string
  lastCompletedPhase?: string
  availableActions?: string[]
  blockedActions?: string[]
  approvalRequiredActions?: string[]
  risks?: string[]
  updatedAt?: string
  readinessLevel?: string
  demoReady?: boolean
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

function getManifestPhaseStatusLabel(value?: string) {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'done') {
    return 'Hecha'
  }

  if (normalizedValue === 'available') {
    return 'Disponible'
  }

  if (normalizedValue === 'blocked') {
    return 'Bloqueada'
  }

  return normalizedValue ? normalizedValue : 'Sin estado'
}

export function LocalProjectManifestCard({
  manifest,
  compact = false,
  onPreparePhase,
}: {
  manifest: LocalProjectManifestContractViewModel
  compact?: boolean
  onPreparePhase?: (phaseId: string) => void
}) {
  const phases = manifest.phases || []
  const visiblePhases = compact ? phases.slice(0, 3) : phases
  const nextRecommendedPhase = normalizeOptionalString(manifest.nextRecommendedPhase)

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Fases del proyecto
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Estado local del proyecto materializado y fases seguras que JEFE puede seguir preparando.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {normalizeOptionalString(manifest.projectType) || 'Proyecto local'}
          </span>
          {nextRecommendedPhase ? (
            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100">
              Siguiente: {nextRecommendedPhase}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Dominio"
          value={normalizeOptionalString(manifest.domain) || 'Sin dominio'}
          detail={getDeliveryLevelLabel(manifest.deliveryLevel)}
          tone="sky"
        />
        <MetricCard
          label="Creado por"
          value={normalizeOptionalString(manifest.createdBy) || 'Sin origen'}
          detail={normalizeOptionalString(manifest.materializationLayer) || 'Sin capa'}
        />
        <MetricCard
          label="Fases"
          value={phases.length > 0 ? `${phases.length} fase(s)` : 'Sin fases'}
          detail={visiblePhases[0]?.id || 'Sin detalle'}
        />
        <MetricCard
          label="Paths bloqueados"
          value={
            normalizeOptionalStringArray(manifest.forbiddenPaths).length > 0
              ? `${normalizeOptionalStringArray(manifest.forbiddenPaths).length} path(s)`
              : 'Sin restricciones'
          }
          detail={
            normalizeOptionalStringArray(manifest.forbiddenPaths)[0] || 'Sin detalle'
          }
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3">
        {visiblePhases.map((phase) => (
          <article
            key={phase.id || phase.createdAt}
            className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {normalizeOptionalString(phase.id) || 'Fase sin id'}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {normalizeOptionalString(phase.createdAt) || 'Sin timestamp declarativo'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                  {getManifestPhaseStatusLabel(phase.status)}
                </span>
                {onPreparePhase &&
                normalizeOptionalString(phase.status).toLocaleLowerCase() === 'available' ? (
                  <button
                    type="button"
                    onClick={() => onPreparePhase(normalizeOptionalString(phase.id))}
                    className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15"
                  >
                    Preparar fase
                  </button>
                ) : null}
              </div>
            </div>
            <ProductArchitectureGroup
              title="Archivos"
              items={phase.files}
              compact={compact}
              tone="sky"
            />
          </article>
        ))}
      </div>

      {compact && phases.length > visiblePhases.length ? (
        <div className="mt-3 text-xs leading-5 text-slate-500">
          +{phases.length - visiblePhases.length} fase(s) más en el manifiesto local.
        </div>
      ) : null}
    </article>
  )
}