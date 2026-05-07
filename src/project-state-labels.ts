type ProjectReadinessLike = {
  demoReady?: boolean
  safeLocalDemoReady?: boolean
  readinessLevel?: string | null
}

const normalizeLabelValue = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

export const getProjectContinuationStatusLabel = (value?: string) => {
  const normalizedValue = normalizeLabelValue(value)

  if (normalizedValue === 'base-phases-in-progress') {
    return 'Base segura en progreso'
  }
  if (normalizedValue === 'safe-module-expansion-ready') {
    return 'Listo para expandir modulos'
  }
  if (normalizedValue === 'safe-capabilities-complete') {
    return 'Capacidades seguras completas'
  }
  if (normalizedValue === 'review-only') {
    return 'En revision'
  }

  return (value || '').trim() || 'Sin estado'
}

export const getProjectReadinessLevelLabel = (value?: string) => {
  const normalizedValue = normalizeLabelValue(value)

  if (normalizedValue === 'demo-ready') {
    return 'Entrega funcional local validada'
  }
  if (normalizedValue === 'scaffold-materialized') {
    return 'Base local materializada'
  }
  if (normalizedValue === 'base-phases-in-progress') {
    return 'Entrega funcional en progreso'
  }
  if (normalizedValue === 'scaffolded') {
    return 'Base local pendiente de completar'
  }
  if (normalizedValue === 'planning') {
    return 'En planificacion'
  }
  if (normalizedValue === 'blocked') {
    return 'Bloqueado por seguridad'
  }
  if (normalizedValue === 'not-started') {
    return 'No iniciado'
  }
  if (normalizedValue === 'needs-review') {
    return 'Necesita revision'
  }

  return (value || '').trim() || 'Sin estado'
}

export const getProjectReadinessTone = (readinessState?: ProjectReadinessLike | null) => {
  if (readinessState?.demoReady === true || readinessState?.safeLocalDemoReady === true) {
    return 'emerald' as const
  }

  const readinessLevel = normalizeLabelValue(readinessState?.readinessLevel)
  if (readinessLevel === 'blocked') {
    return 'rose' as const
  }
  if (readinessLevel === 'planning' || readinessLevel === 'not-started') {
    return 'sky' as const
  }

  return 'amber' as const
}

export const getRuntimeApprovalStatusLabel = (value?: string) => {
  const normalizedValue = normalizeLabelValue(value)

  if (normalizedValue === 'preview') {
    return 'Preview controlado'
  }
  if (normalizedValue === 'requires-approval') {
    return 'Requiere aprobacion'
  }
  if (normalizedValue === 'approved') {
    return 'Aprobado'
  }
  if (normalizedValue === 'blocked') {
    return 'Bloqueado por seguridad'
  }
  if (normalizedValue === 'rejected') {
    return 'Rechazado'
  }
  if (normalizedValue === 'expired') {
    return 'Expirado'
  }

  return (value || '').trim() || 'Sin estado'
}

export const getRuntimeApprovalTone = (value?: string) => {
  const normalizedValue = normalizeLabelValue(value)

  if (normalizedValue === 'blocked' || normalizedValue === 'rejected') {
    return 'rose' as const
  }
  if (normalizedValue === 'approved') {
    return 'emerald' as const
  }
  if (normalizedValue === 'preview' || normalizedValue === 'requires-approval') {
    return 'amber' as const
  }

  return 'sky' as const
}

export const getValidationStatusLabel = (value?: string) => {
  const normalizedValue = normalizeLabelValue(value)

  if (normalizedValue === 'validated-local-safe') {
    return 'Validado en local seguro'
  }
  if (normalizedValue === 'pending-local-validation') {
    return 'Falta validacion local'
  }
  if (normalizedValue === 'scaffolded-not-validated') {
    return 'Base armada, sin validacion'
  }
  if (normalizedValue === 'blocked') {
    return 'Bloqueado'
  }
  if (normalizedValue === 'not-run') {
    return 'Sin validacion'
  }

  return (value || '').trim() || 'Sin validacion'
}

export const getPrepareActionButtonLabel = ({
  alreadyDone,
  requiresApproval,
  blocked,
}: {
  alreadyDone?: boolean
  requiresApproval?: boolean
  blocked?: boolean
}) => {
  if (alreadyDone || blocked) {
    return 'Revisar primero'
  }

  if (requiresApproval) {
    return 'Preparar aprobacion'
  }

  return 'Preparar plan'
}
