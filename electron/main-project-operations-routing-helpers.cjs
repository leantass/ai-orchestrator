function buildNextActionPlanFromProjectRouting(
  {
    strategy,
    nextExpectedAction,
    requiresApproval,
    scalableDeliveryPlan,
    questionPolicy,
    projectPhaseExecutionPlan,
    localProjectManifest,
    moduleExpansionPlan,
    continuationActionPlan,
  },
  {
    normalizeScalableDeliveryPlanContract,
    normalizeQuestionPolicyContract,
    normalizeProjectPhaseExecutionPlanContract,
    normalizeLocalProjectManifestContract,
    normalizeModuleExpansionPlanContract,
    normalizeContinuationActionContract,
    summarizeUniqueExecutorStrings,
  },
) {
  const normalizedScalablePlan = normalizeScalableDeliveryPlanContract(scalableDeliveryPlan)
  const normalizedQuestionPolicy = normalizeQuestionPolicyContract(questionPolicy)
  const normalizedProjectPhaseExecutionPlan =
    normalizeProjectPhaseExecutionPlanContract(projectPhaseExecutionPlan)
  const normalizedLocalProjectManifest =
    normalizeLocalProjectManifestContract(localProjectManifest)
  const normalizedModuleExpansionPlan =
    normalizeModuleExpansionPlanContract(moduleExpansionPlan)
  const normalizedContinuationActionPlan =
    normalizeContinuationActionContract(continuationActionPlan)
  const deliveryLevel = normalizedScalablePlan?.deliveryLevel || ''
  const hasBlockingQuestions =
    Array.isArray(normalizedQuestionPolicy?.blockingQuestions) &&
    normalizedQuestionPolicy.blockingQuestions.length > 0
  const requiresSensitiveApproval =
    requiresApproval === true ||
    normalizedQuestionPolicy?.shouldAskBeforeMaterialization === true ||
    deliveryLevel === 'infra-local-plan'

  if (hasBlockingQuestions) {
    return {
      currentState: strategy || 'planner-decision',
      recommendedAction: 'Resolver bloqueos sensibles antes de ejecutar o materializar.',
      actionType: requiresSensitiveApproval ? 'request-approval' : 'ask-blocking-question',
      targetStrategy: strategy || 'ask-user',
      targetDeliveryLevel: deliveryLevel || 'n/a',
      reason:
        normalizedQuestionPolicy?.reason ||
        'Hay definiciones sensibles pendientes que no conviene decidir automáticamente.',
      safeToRunNow: false,
      requiresApproval: requiresSensitiveApproval,
      userFacingLabel: requiresSensitiveApproval
        ? 'Resolver aprobación sensible'
        : 'Responder pregunta bloqueante',
      technicalLabel: hasBlockingQuestions ? 'blocking-question-gate' : 'review-plan',
      expectedOutcome:
        'Dejar resueltos riesgos sensibles antes de habilitar la siguiente fase.',
    }
  }

  if (strategy === 'materialize-frontend-project-plan') {
    return {
      currentState: 'frontend-project-materialization-ready',
      recommendedAction: 'Ejecutar la materialización controlada del frontend local.',
      actionType: 'execute-materialization',
      targetStrategy: 'materialize-frontend-project-plan',
      targetDeliveryLevel: 'frontend-project',
      reason:
        'El scaffold frontend ya quedó delimitado a archivos locales y se puede ejecutar de forma controlada.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Ejecutar materialización frontend',
      technicalLabel: 'execute-frontend-materialization',
      expectedOutcome:
        'Crear el scaffold frontend local dentro de los allowedTargetPaths.',
    }
  }

  if (strategy === 'materialize-fullstack-local-plan') {
    return {
      currentState: 'fullstack-local-materialization-ready',
      recommendedAction: 'Ejecutar la materialización controlada del scaffold fullstack local.',
      actionType: 'execute-materialization',
      targetStrategy: 'materialize-fullstack-local-plan',
      targetDeliveryLevel: 'fullstack-local',
      reason:
        'El scaffold fullstack está acotado a archivos revisables y no levanta servicios ni instala dependencias.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Ejecutar materialización fullstack local',
      technicalLabel: 'execute-fullstack-materialization',
      expectedOutcome:
        'Crear el scaffold fullstack local dentro de los allowedTargetPaths.',
    }
  }

  if (strategy === 'prepare-project-phase-plan' && normalizedProjectPhaseExecutionPlan) {
    const phaseBlockers = summarizeUniqueExecutorStrings(
      normalizedProjectPhaseExecutionPlan.blockers,
      8,
    )
    const prerequisitePhaseId =
      normalizedProjectPhaseExecutionPlan.prerequisitePhaseId ||
      normalizedLocalProjectManifest?.nextRecommendedPhase ||
      ''
    const prerequisiteIsMaterializableSafePhase =
      prerequisitePhaseId === 'frontend-mock-flow' ||
      prerequisitePhaseId === 'backend-contracts' ||
      prerequisitePhaseId === 'database-design' ||
      prerequisitePhaseId === 'local-validation'

    if (phaseBlockers.length > 0) {
      return {
        currentState: `project-phase-blocked:${normalizedProjectPhaseExecutionPlan.phaseId}`,
        recommendedAction: prerequisitePhaseId
          ? `Completar ${prerequisitePhaseId} antes de continuar con ${normalizedProjectPhaseExecutionPlan.phaseId}.`
          : `Resolver el prerequisito pendiente antes de continuar con ${normalizedProjectPhaseExecutionPlan.phaseId}.`,
        actionType: prerequisiteIsMaterializableSafePhase
          ? 'expand-next-phase'
          : 'review-plan',
        targetStrategy: prerequisiteIsMaterializableSafePhase
          ? 'materialize-project-phase-plan'
          : normalizedProjectPhaseExecutionPlan.targetStrategy,
        targetDeliveryLevel:
          normalizedProjectPhaseExecutionPlan.deliveryLevel || deliveryLevel || 'n/a',
        reason: phaseBlockers.join(' '),
        safeToRunNow: prerequisiteIsMaterializableSafePhase,
        requiresApproval: false,
        userFacingLabel:
          prerequisitePhaseId === 'frontend-mock-flow'
            ? 'Completar frontend mock flow'
            : prerequisitePhaseId === 'backend-contracts'
              ? 'Completar backend contracts'
              : prerequisitePhaseId === 'database-design'
                ? 'Completar database design'
                : prerequisitePhaseId === 'local-validation'
                  ? 'Completar local validation'
                  : 'Resolver prerequisito de fase',
        technicalLabel: `phase-prerequisite-${normalizedProjectPhaseExecutionPlan.phaseId}`,
        expectedOutcome:
          'Desbloquear la siguiente fase del proyecto local sin saltarse el orden declarado.',
      }
    }

    return {
      currentState: `project-phase-review:${normalizedProjectPhaseExecutionPlan.phaseId}`,
      recommendedAction: normalizedProjectPhaseExecutionPlan.executableNow
        ? 'Revisar el plan de fase y, si está correcto, preparar su materialización segura.'
        : 'Revisar la siguiente fase disponible antes de expandir el proyecto local.',
      actionType: normalizedProjectPhaseExecutionPlan.executableNow
        ? 'expand-next-phase'
        : 'review-plan',
      targetStrategy: normalizedProjectPhaseExecutionPlan.targetStrategy,
      targetDeliveryLevel:
        normalizedProjectPhaseExecutionPlan.deliveryLevel || deliveryLevel || 'n/a',
      reason:
        normalizedProjectPhaseExecutionPlan.reason ||
        'Se detectó una continuación segura del proyecto local.',
      safeToRunNow: normalizedProjectPhaseExecutionPlan.executableNow === true,
      requiresApproval: normalizedProjectPhaseExecutionPlan.approvalRequired === true,
      userFacingLabel:
        normalizedProjectPhaseExecutionPlan.phaseId === 'frontend-mock-flow'
          ? 'Preparar frontend mock flow'
          : normalizedProjectPhaseExecutionPlan.phaseId === 'backend-contracts'
            ? 'Preparar backend contracts'
            : normalizedProjectPhaseExecutionPlan.phaseId === 'database-design'
              ? 'Preparar database design'
              : normalizedProjectPhaseExecutionPlan.phaseId === 'local-validation'
                ? 'Preparar local validation'
                : 'Preparar review and expand',
      technicalLabel: `prepare-${normalizedProjectPhaseExecutionPlan.phaseId}`,
      expectedOutcome:
        normalizedProjectPhaseExecutionPlan.executableNow === true
          ? 'Dejar lista una fase materializable y acotada a archivos permitidos.'
          : 'Dejar la fase propuesta lista para revisión sin ejecución automática.',
    }
  }

  if (strategy === 'materialize-project-phase-plan' && normalizedProjectPhaseExecutionPlan) {
    return {
      currentState: `project-phase-materialization:${normalizedProjectPhaseExecutionPlan.phaseId}`,
      recommendedAction: `Ejecutar la materialización controlada de la fase ${normalizedProjectPhaseExecutionPlan.phaseId}.`,
      actionType: 'execute-materialization',
      targetStrategy: 'materialize-project-phase-plan',
      targetDeliveryLevel:
        normalizedProjectPhaseExecutionPlan.deliveryLevel || deliveryLevel || 'n/a',
      reason:
        normalizedProjectPhaseExecutionPlan.reason ||
        'La fase segura ya quedó delimitada a archivos permitidos del proyecto local.',
      safeToRunNow: normalizedProjectPhaseExecutionPlan.executableNow === true,
      requiresApproval: normalizedProjectPhaseExecutionPlan.approvalRequired === true,
      userFacingLabel:
        normalizedProjectPhaseExecutionPlan.phaseId === 'frontend-mock-flow'
          ? 'Materializar frontend mock flow'
          : normalizedProjectPhaseExecutionPlan.phaseId === 'backend-contracts'
            ? 'Materializar backend contracts'
            : normalizedProjectPhaseExecutionPlan.phaseId === 'database-design'
              ? 'Materializar database design'
              : normalizedProjectPhaseExecutionPlan.phaseId === 'local-validation'
                ? 'Materializar local validation'
                : `Materializar ${normalizedProjectPhaseExecutionPlan.phaseId}`,
      technicalLabel: `materialize-${normalizedProjectPhaseExecutionPlan.phaseId}`,
      expectedOutcome:
        'Actualizar solo los archivos permitidos de la fase dentro del proyecto ya generado.',
    }
  }

  if (strategy === 'prepare-module-expansion-plan' && normalizedModuleExpansionPlan) {
    const moduleBlockers = summarizeUniqueExecutorStrings(
      normalizedModuleExpansionPlan.blockers,
      8,
    )
    return {
      currentState: `module-expansion-review:${normalizedModuleExpansionPlan.moduleId}`,
      recommendedAction:
        moduleBlockers.length > 0
          ? 'Revisar el bloqueo actual y decidir si conviene extender o mejorar el modulo existente.'
          : normalizedModuleExpansionPlan.safeToMaterialize
            ? 'Revisar la expansion del modulo y, si esta correcta, preparar la materializacion segura.'
            : 'Revisar la expansion del modulo antes de materializarla.',
      actionType:
        moduleBlockers.length > 0
          ? 'review-plan'
          : normalizedModuleExpansionPlan.safeToMaterialize
            ? 'expand-next-phase'
            : 'review-plan',
      targetStrategy:
        moduleBlockers.length > 0
          ? 'prepare-module-expansion-plan'
          : normalizedModuleExpansionPlan.safeToMaterialize
            ? 'materialize-module-expansion-plan'
            : 'prepare-module-expansion-plan',
      targetDeliveryLevel: 'fullstack-local',
      reason:
        moduleBlockers.length > 0
          ? moduleBlockers.join(' ')
          : normalizedModuleExpansionPlan.reason ||
            'Se detecto una expansion segura de modulo para el proyecto local.',
      safeToRunNow:
        moduleBlockers.length === 0 &&
        normalizedModuleExpansionPlan.safeToMaterialize === true,
      requiresApproval: normalizedModuleExpansionPlan.approvalRequired === true,
      userFacingLabel:
        moduleBlockers.length > 0
          ? 'Revisar bloqueo de modulo'
          : `Preparar modulo ${normalizedModuleExpansionPlan.moduleName || normalizedModuleExpansionPlan.moduleId}`,
      technicalLabel: `prepare-module-${normalizedModuleExpansionPlan.moduleId}`,
      expectedOutcome:
        moduleBlockers.length > 0
          ? 'Evitar una materializacion duplicada o fuera de orden.'
          : 'Dejar lista una expansion de modulo acotada a archivos permitidos.',
    }
  }

  if (strategy === 'materialize-module-expansion-plan' && normalizedModuleExpansionPlan) {
    return {
      currentState: `module-expansion-materialization:${normalizedModuleExpansionPlan.moduleId}`,
      recommendedAction: `Ejecutar la materializacion controlada del modulo ${normalizedModuleExpansionPlan.moduleName || normalizedModuleExpansionPlan.moduleId}.`,
      actionType: 'execute-materialization',
      targetStrategy: 'materialize-module-expansion-plan',
      targetDeliveryLevel: 'fullstack-local',
      reason:
        normalizedModuleExpansionPlan.reason ||
        'La expansion del modulo ya quedo delimitada a archivos locales y revisables.',
      safeToRunNow: normalizedModuleExpansionPlan.safeToMaterialize === true,
      requiresApproval: normalizedModuleExpansionPlan.approvalRequired === true,
      userFacingLabel: `Materializar modulo ${normalizedModuleExpansionPlan.moduleName || normalizedModuleExpansionPlan.moduleId}`,
      technicalLabel: `materialize-module-${normalizedModuleExpansionPlan.moduleId}`,
      expectedOutcome:
        'Actualizar solo las capas permitidas del proyecto local y volver a review-and-expand.',
    }
  }

  if (strategy === 'prepare-continuation-action-plan' && normalizedContinuationActionPlan) {
    return {
      currentState: `project-continuation-review:${normalizedContinuationActionPlan.id}`,
      recommendedAction: normalizedContinuationActionPlan.blocked
        ? 'Revisar el bloqueo actual y definir una alternativa segura antes de seguir.'
        : normalizedContinuationActionPlan.requiresApproval
          ? 'Revisar el plan, entender el riesgo y decidir si corresponde pedir aprobacion.'
          : 'Revisar el plan de continuidad antes de habilitar la siguiente expansion.',
      actionType: normalizedContinuationActionPlan.requiresApproval
        ? 'request-approval'
        : 'review-plan',
      targetStrategy:
        normalizedContinuationActionPlan.targetStrategy ||
        'prepare-continuation-action-plan',
      targetDeliveryLevel:
        normalizedContinuationActionPlan.deliveryLevel || deliveryLevel || 'fullstack-local',
      reason:
        normalizedContinuationActionPlan.blocker ||
        normalizedContinuationActionPlan.reason ||
        normalizedContinuationActionPlan.description ||
        'Se preparo una accion de continuidad revisable para el proyecto local.',
      safeToRunNow: false,
      requiresApproval: normalizedContinuationActionPlan.requiresApproval === true,
      userFacingLabel: normalizedContinuationActionPlan.title || 'Revisar continuidad',
      technicalLabel: `prepare-continuation-${normalizedContinuationActionPlan.id}`,
      expectedOutcome:
        normalizedContinuationActionPlan.expectedOutcome ||
        'Dejar una continuidad revisable sin ejecutar runtime real ni infraestructura sensible.',
    }
  }

  if (strategy === 'product-architecture-plan' && deliveryLevel === 'fullstack-local') {
    return {
      currentState: 'product-architecture-ready:fullstack-local',
      recommendedAction:
        'Preparar la entrega funcional local derivada del blueprint, sin reusar proyectos previos ni habilitar runtime real.',
      actionType: 'prepare-materialization',
      targetStrategy: 'materialize-fullstack-local-plan',
      targetDeliveryLevel: 'fullstack-local',
      reason:
        'La arquitectura ya deja clara una primera ruta fullstack-local segura y el siguiente paso es preparar su materializacion controlada.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Preparar entrega funcional local',
      technicalLabel: 'prepare-fullstack-from-architecture',
      expectedOutcome:
        'Dejar lista una ruta materializable fullstack-local, acotada al workspace y sin dependencias reales.',
    }
  }

  if (strategy === 'product-architecture-plan' && deliveryLevel === 'frontend-project') {
    return {
      currentState: 'product-architecture-ready:frontend-project',
      recommendedAction:
        'Preparar el frontend local derivado del blueprint antes de pensar en runtimes o dependencias reales.',
      actionType: 'prepare-materialization',
      targetStrategy: 'materialize-frontend-project-plan',
      targetDeliveryLevel: 'frontend-project',
      reason:
        'La arquitectura ya deja clara una ruta frontend-project revisable y el siguiente paso es preparar su materializacion controlada.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Preparar frontend local ejecutable',
      technicalLabel: 'prepare-frontend-from-architecture',
      expectedOutcome:
        'Dejar lista una ruta materializable frontend-project sin instalar dependencias ni levantar servicios.',
    }
  }

  if (strategy === 'product-architecture-plan' && deliveryLevel === 'safe-first-delivery') {
    return {
      currentState: 'product-architecture-ready:safe-first-delivery',
      recommendedAction:
        'Preparar la primera entrega segura derivada de la arquitectura antes de ejecutar cambios.',
      actionType: 'review-plan',
      targetStrategy: 'materialize-safe-first-delivery-plan',
      targetDeliveryLevel: 'safe-first-delivery',
      reason:
        'La arquitectura ya deja definida una primera entrega segura y el siguiente paso es preparar una materializacion local acotada.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Preparar ejecucion local segura',
      technicalLabel: 'prepare-safe-first-from-architecture',
      expectedOutcome:
        'Dejar lista una primera entrega materializable, local y revisable.',
    }
  }

  if (strategy === 'scalable-delivery-plan' && deliveryLevel === 'frontend-project') {
    return {
      currentState: 'frontend-project-planner-review',
      recommendedAction: 'Preparar la materialización controlada del frontend local.',
      actionType: 'prepare-materialization',
      targetStrategy: 'materialize-frontend-project-plan',
      targetDeliveryLevel: 'frontend-project',
      reason:
        'El plan frontend ya está revisable y el siguiente paso lógico es preparar el scaffold local sin instalar dependencias.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Preparar materialización frontend',
      technicalLabel: 'prepare-frontend-materialization',
      expectedOutcome:
        'Dejar lista una segunda fase materializable, acotada y revisable.',
    }
  }

  if (strategy === 'scalable-delivery-plan' && deliveryLevel === 'fullstack-local') {
    return {
      currentState: 'fullstack-local-planner-review',
      recommendedAction: 'Preparar la materialización controlada del scaffold fullstack local.',
      actionType: 'prepare-materialization',
      targetStrategy: 'materialize-fullstack-local-plan',
      targetDeliveryLevel: 'fullstack-local',
      reason:
        'El fullstack-local ya está delimitado y el siguiente paso es preparar un scaffold local revisable.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Preparar materialización fullstack local',
      technicalLabel: 'prepare-fullstack-materialization',
      expectedOutcome:
        'Dejar lista una segunda fase ejecutable sin runtime real.',
    }
  }

  if (strategy === 'scalable-delivery-plan' && deliveryLevel === 'infra-local-plan') {
    return {
      currentState: 'infra-local-review',
      recommendedAction: 'Revisar el plan de infraestructura y separar aprobaciones sensibles.',
      actionType: 'request-approval',
      targetStrategy: 'scalable-delivery-plan',
      targetDeliveryLevel: 'infra-local-plan',
      reason:
        'La infraestructura local sensible no debe ejecutarse ni expandirse sin aprobación explícita.',
      safeToRunNow: false,
      requiresApproval: true,
      userFacingLabel: 'Revisar aprobación de infraestructura',
      technicalLabel: 'request-infra-approval',
      expectedOutcome:
        'Mantener Docker, colas y DB local activa fuera de alcance hasta nueva aprobación.',
    }
  }

  if (strategy === 'scalable-delivery-plan' && deliveryLevel === 'monorepo-local') {
    return {
      currentState: 'monorepo-local-review',
      recommendedAction: 'Revisar la arquitectura del monorepo y dejar runtime/workspaces reales para una fase futura.',
      actionType: 'review-plan',
      targetStrategy: 'scalable-delivery-plan',
      targetDeliveryLevel: 'monorepo-local',
      reason:
        'El monorepo-local sigue en planner-only y no debe saltar a materialización ni a runtimes reales.',
      safeToRunNow: true,
      requiresApproval: false,
      userFacingLabel: 'Revisar plan monorepo',
      technicalLabel: 'review-monorepo-plan',
      expectedOutcome:
        'Confirmar estructura, paquetes y approvals futuros sin crear el monorepo todavía.',
    }
  }

  return {
    currentState: nextExpectedAction || strategy || 'planner-state',
    recommendedAction: 'Revisar el plan actual antes de avanzar con otra fase.',
    actionType: 'review-plan',
    targetStrategy: strategy || 'planner-only',
    targetDeliveryLevel: deliveryLevel || 'n/a',
    reason: 'No hay una acción más específica derivada del contrato actual.',
    safeToRunNow: false,
    requiresApproval: false,
    userFacingLabel: 'Revisar plan',
    technicalLabel: 'review-plan',
    expectedOutcome: 'Entender el estado actual antes de expandir o ejecutar.',
  }
}

module.exports = {
  buildNextActionPlanFromProjectRouting,
}