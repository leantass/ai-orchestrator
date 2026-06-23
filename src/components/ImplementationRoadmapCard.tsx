import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type ImplementationRoadmapPhaseContractViewModel = {
  id?: string
  title?: string
  goal?: string
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  status?: 'planned' | 'ready' | 'blocked' | 'done' | string
  executableNow?: boolean
  approvalRequired?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | string
  expectedOutputs?: string[]
  allowedRootPaths?: string[]
  dependencies?: string[]
  validationStrategy?: string[]
}

export type ImplementationRoadmapContractViewModel = {
  projectSlug?: string
  projectType?: string
  domain?: string
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  currentPhase?: string
  phases?: ImplementationRoadmapPhaseContractViewModel[]
  nextRecommendedPhase?: string
  suggestedNextAction?: string
  blockers?: string[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

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

const getRoadmapPhaseStatusLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'ready') {
    return 'Lista'
  }
  if (normalizedValue === 'blocked') {
    return 'Bloqueada'
  }
  if (normalizedValue === 'done') {
    return 'Hecha'
  }
  if (normalizedValue === 'planned') {
    return 'Planificada'
  }

  return normalizeOptionalString(value) || 'Sin estado'
}

const getRoadmapPhaseTone = (
  value: unknown,
): 'default' | 'sky' | 'emerald' | 'amber' | 'rose' => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'ready') {
    return 'emerald'
  }
  if (normalizedValue === 'blocked') {
    return 'rose'
  }
  if (normalizedValue === 'done') {
    return 'sky'
  }

  return 'amber'
}

export function ImplementationRoadmapCard({
  roadmap,
  compact = false,
}: {
  roadmap: ImplementationRoadmapContractViewModel
  compact?: boolean
}) {
  const phases = roadmap.phases || []
  const visiblePhases = compact ? phases.slice(0, 4) : phases
  const blockers = roadmap.blockers || []
  const nextPhaseLabel =
    phases.find((phase) => phase.id === roadmap.nextRecommendedPhase)?.title ||
    roadmap.nextRecommendedPhase ||
    'Sin siguiente fase declarada'

  return (
    <article className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Roadmap de implementación
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Ordena las fases del proyecto, qué puede avanzar ahora y qué queda bloqueado o sujeto a aprobación.
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {normalizeOptionalString(roadmap.suggestedNextAction) ||
              'Sin siguiente paso resumido.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {getDeliveryLevelLabel(roadmap.deliveryLevel)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Proyecto"
          value={normalizeOptionalString(roadmap.projectSlug) || 'Sin slug'}
          detail={normalizeOptionalString(roadmap.domain) || 'Sin dominio declarado'}
          tone="sky"
        />
        <MetricCard
          label="Fase actual"
          value={normalizeOptionalString(roadmap.currentPhase) || 'Sin fase actual'}
          detail={normalizeOptionalString(roadmap.projectType) || 'Sin tipo declarado'}
        />
        <MetricCard
          label="Siguiente fase"
          value={nextPhaseLabel}
          detail={normalizeOptionalString(roadmap.nextRecommendedPhase) || 'Sin id'}
          tone="emerald"
        />
        <MetricCard
          label="Bloqueos"
          value={blockers.length > 0 ? `${blockers.length} activo(s)` : 'Sin bloqueos'}
          detail={blockers[0] || 'No hay preguntas sensibles pendientes'}
          tone={blockers.length > 0 ? 'rose' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {visiblePhases.map((phase) => (
          <article
            key={phase.id || phase.title}
            className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {phase.title || 'Fase sin título'}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {phase.goal || 'Sin objetivo declarado'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={joinClasses(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    getRoadmapPhaseTone(phase.status) === 'emerald'
                      ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                      : getRoadmapPhaseTone(phase.status) === 'rose'
                        ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                        : getRoadmapPhaseTone(phase.status) === 'sky'
                          ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
                          : 'border-amber-300/20 bg-amber-300/10 text-amber-100',
                  )}
                >
                  {getRoadmapPhaseStatusLabel(phase.status)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {phase.executableNow ? 'Ejecutable ahora' : 'Revisión'}
                </span>
                {phase.approvalRequired ? (
                  <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-medium text-rose-100">
                    Requiere aprobación
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              <ProductArchitectureGroup
                title="Outputs esperados"
                items={phase.expectedOutputs}
                compact={compact}
                tone="sky"
              />
              <ProductArchitectureGroup
                title="Dependencias"
                items={phase.dependencies}
                compact={compact}
              />
              <ProductArchitectureGroup
                title="Validación"
                items={phase.validationStrategy}
                compact={compact}
                tone="emerald"
              />
            </div>
          </article>
        ))}
      </div>

      {compact && phases.length > visiblePhases.length ? (
        <div className="mt-3 text-xs leading-5 text-slate-500">
          +{phases.length - visiblePhases.length} fase(s) más en el roadmap completo.
        </div>
      ) : null}
    </article>
  )
}