type GuidedFooterNoteStep =
  | 'goal'
  | 'context'
  | 'brain'
  | 'memory'
  | 'plan'
  | 'execution'
  | 'result'

export function getGuidedFooterNote({
  step,
  plannerIsReviewOnly,
}: {
  step: GuidedFooterNoteStep
  plannerIsReviewOnly: boolean
}) {
  if (step === 'goal') {
    return ''
  }

  if (step === 'plan') {
    return plannerIsReviewOnly
      ? 'El CTA principal prepara la siguiente accion segura; todavia no ejecuta archivos.'
      : 'El CTA principal ejecuta la instruccion actual con el modo y el scope activos.'
  }

  if (step === 'execution') {
    return 'Si aparece una aprobacion, el flujo queda bloqueado de forma explicita hasta resolverla.'
  }

  if (step === 'result') {
    return 'La salida final ya separa lo operativo de lo tecnico para iterar con menos ruido.'
  }

  return 'Completa este bloque y segui al proximo paso.'
}