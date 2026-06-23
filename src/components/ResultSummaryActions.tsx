import { PrimaryActionButton, SecondaryActionButton } from './AppUiPrimitives'

export function ResultSummaryActions({
  nextPhaseLabel,
  busy,
  onPrepareNextPhase,
  onStartOver,
  onOpenAdvanced,
  onOpenTechnicalDetail,
}: {
  nextPhaseLabel?: string
  busy: boolean
  onPrepareNextPhase?: (() => void) | null
  onStartOver: () => void
  onOpenAdvanced: () => void
  onOpenTechnicalDetail: () => void
}) {
  const hasNextPhase = Boolean(onPrepareNextPhase && nextPhaseLabel)

  return (
    <>
      {hasNextPhase ? (
        <PrimaryActionButton onClick={onPrepareNextPhase!} disabled={busy} tone="sky">
          {`Preparar ${nextPhaseLabel}`}
        </PrimaryActionButton>
      ) : (
        <PrimaryActionButton onClick={onStartOver} tone="sky">
          Volver al objetivo
        </PrimaryActionButton>
      )}
      {hasNextPhase ? (
        <SecondaryActionButton onClick={onStartOver}>Volver al objetivo</SecondaryActionButton>
      ) : null}
      <SecondaryActionButton onClick={onOpenAdvanced}>Abrir panel avanzado</SecondaryActionButton>
      <SecondaryActionButton onClick={onOpenTechnicalDetail}>
        Ver detalle técnico
      </SecondaryActionButton>
    </>
  )
}