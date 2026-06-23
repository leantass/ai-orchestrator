import { SecondaryActionButton } from './AppUiPrimitives'

type GuidedSidebarActionsStep =
  | 'goal'
  | 'context'
  | 'brain'
  | 'memory'
  | 'plan'
  | 'execution'
  | 'result'

export function GuidedSidebarActions({
  step,
  onOpenLatestRun,
  onResetSession,
  onOpenTechnicalDetail,
  onOpenAdvanced,
}: {
  step: GuidedSidebarActionsStep
  onOpenLatestRun: () => void
  onResetSession: () => void
  onOpenTechnicalDetail: () => void
  onOpenAdvanced: () => void
}) {
  if (step === 'goal') {
    return (
      <>
        <SecondaryActionButton onClick={onOpenLatestRun}>Ver ultima corrida</SecondaryActionButton>
        <SecondaryActionButton onClick={onResetSession}>Reiniciar sesion</SecondaryActionButton>
      </>
    )
  }

  if (step === 'context') {
    return <SecondaryActionButton onClick={onOpenTechnicalDetail}>Ver detalle técnico</SecondaryActionButton>
  }

  if (step === 'brain') {
    return <SecondaryActionButton onClick={onOpenAdvanced}>Ver panel avanzado</SecondaryActionButton>
  }

  if (step === 'memory') {
    return <SecondaryActionButton onClick={onOpenAdvanced}>Abrir panel avanzado</SecondaryActionButton>
  }

  return null
}