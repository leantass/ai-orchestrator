import { PrimaryActionButton } from './AppUiPrimitives'

type GuidedPrimaryActionStep =
  | 'goal'
  | 'context'
  | 'brain'
  | 'memory'
  | 'plan'
  | 'execution'
  | 'result'

export function GuidedPrimaryAction({
  step,
  isPlanning,
  canGeneratePlan,
  onContinue,
  onGeneratePlan,
}: {
  step: GuidedPrimaryActionStep
  isPlanning: boolean
  canGeneratePlan: boolean
  onContinue: () => void
  onGeneratePlan: () => void
}) {
  if (step === 'brain') {
    return (
      <PrimaryActionButton onClick={onContinue} tone="sky">
        Continuar
      </PrimaryActionButton>
    )
  }

  if (step === 'memory') {
    return (
      <PrimaryActionButton onClick={onGeneratePlan} disabled={isPlanning || !canGeneratePlan} tone="sky">
        {isPlanning ? 'Generando plan...' : 'Generar plan'}
      </PrimaryActionButton>
    )
  }

  return null
}