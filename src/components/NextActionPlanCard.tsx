import { MetricCard } from './AppUiPrimitives'

export type NextActionPlanContractViewModel = {
  currentState?: string
  recommendedAction?: string
  actionType?:
    | 'review-plan'
    | 'prepare-materialization'
    | 'execute-materialization'
    | 'validate-result'
    | 'expand-next-phase'
    | 'ask-blocking-question'
    | 'request-approval'
    | string
  targetStrategy?: string
  targetDeliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  reason?: string
  safeToRunNow?: boolean
  requiresApproval?: boolean
  userFacingLabel?: string
  technicalLabel?: string
  expectedOutcome?: string
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

const getNextActionTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'prepare-materialization') {
    return 'Preparar materialización'
  }
  if (normalizedValue === 'execute-materialization') {
    return 'Ejecutar materialización'
  }
  if (normalizedValue === 'validate-result') {
    return 'Validar resultado'
  }
  if (normalizedValue === 'expand-next-phase') {
    return 'Expandir siguiente fase'
  }
  if (normalizedValue === 'ask-blocking-question') {
    return 'Pregunta bloqueante'
  }
  if (normalizedValue === 'request-approval') {
    return 'Pedir aprobación'
  }

  return 'Revisar plan'
}

export function NextActionPlanCard({
  plan,
}: {
  plan: NextActionPlanContractViewModel
}) {
  const tone: 'default' | 'sky' | 'emerald' | 'amber' | 'rose' =
    plan.requiresApproval
      ? 'rose'
      : plan.safeToRunNow
        ? 'emerald'
        : plan.actionType === 'review-plan'
          ? 'sky'
          : 'amber'

  return (
    <article className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Próximo paso recomendado
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {normalizeOptionalString(plan.userFacingLabel) || 'Sin etiqueta declarada'}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {normalizeOptionalString(plan.recommendedAction) ||
              'Sin acción recomendada.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {getNextActionTypeLabel(plan.actionType)}
          </span>
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              tone === 'emerald'
                ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                : tone === 'rose'
                  ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                  : tone === 'sky'
                    ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
                    : 'border-amber-300/20 bg-amber-300/10 text-amber-100',
            )}
          >
            {plan.safeToRunNow ? 'Seguro ahora' : 'No correr todavía'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estrategia objetivo"
          value={normalizeOptionalString(plan.targetStrategy) || 'Sin estrategia'}
          detail={normalizeOptionalString(plan.technicalLabel) || 'Sin label técnico'}
          tone={tone}
        />
        <MetricCard
          label="Delivery level"
          value={getDeliveryLevelLabel(plan.targetDeliveryLevel)}
          detail={normalizeOptionalString(plan.currentState) || 'Sin estado'}
        />
        <MetricCard
          label="Approval"
          value={plan.requiresApproval ? 'Sí' : 'No'}
          detail={normalizeOptionalString(plan.reason) || 'Sin razón declarada'}
          tone={plan.requiresApproval ? 'rose' : 'emerald'}
        />
        <MetricCard
          label="Outcome esperado"
          value={normalizeOptionalString(plan.expectedOutcome) || 'Sin outcome'}
        />
      </div>
    </article>
  )
}