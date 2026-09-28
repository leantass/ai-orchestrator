# Escalón 10A — auditoría del Commercial Control Center

## Estado

`ESCALON_10_STATUS=IN_PROGRESS` · `ESCALON_10A_STATUS=COMPLETED` · `ESCALON_10B_STATUS=COMPLETED` · `ESCALON_10C_STATUS=NOT_STARTED` · `ESCALON_10D_STATUS=NOT_STARTED`.

## Escalón 10B — navegación e información truthful

10B implementa la autoridad de ruta local en `src/commercial/routes.ts`: Inicio (`/`), Construir (`/build`), Proyectos (`/projects`), workspace de proyecto, deep-link de versión y Operación (`/operation`). Las rutas desconocidas, IDs inseguros, traversal y versiones/proyectos inexistentes terminan en un estado recuperable de no encontrado.

La navegación actualiza URL y estado mediante una única transición, escucha `popstate` y conserva back/forward/reload. Construir se abre como wizard explícito; un borrador guardado sólo se rehidrata con “Continuar borrador”. La navegación global sólo expone Inicio, Proyectos y Operación. Versiones y entrega permanecen contextuales al proyecto; la entrega local no se presenta como release remoto.

El CTA de materiales de Inicio ahora declara honestamente que los materiales se agregan en el siguiente paso. Operación es visible y read-only, con navegación sin reload. No se agregaron capacidades de release, Git, CI, QA detallado, MEMORIA detallada ni proveedores. Evidencia focal: `scripts/jefe-commercial-route-smoke.mjs` y `tests/e2e/commercial-navigation-10b.spec.ts`; Playwright Chromium headless pasó 1/1 y dejó capturas en `.codex-temp/escalon-10b/evidence/`. `ProviderCalls=0`, `ExternalNetworkUsed=false`, `ProductionReady=false`. La deuda histórica de calidad sigue documentada como 306 errores en `src/factory/*`.

La auditoría no rediseña ni agrega capacidades. El producto sigue con `RELEASE_READINESS=BLOCKED`, `PRODUCTION_READY=false` y 306 errores históricos de lint en `src/factory/*`. La evidencia automática está en `.codex-temp/escalon-10a/evidence/` y no se versiona.

## Superficies y rutas reales

| Surface | Route | Entry point | Data / actions | Estado |
| --- | --- | --- | --- | --- |
| Inicio | `/` | `CommercialApp → HomeCompact` | localStorage draft; iniciar wizard; listar proyectos recientes | `CONNECTED_PARTIAL` |
| Construir | `/build` (state `wizard`) | `startNewProject()` | wizard, guardar borrador, selector de assets, crear proyecto | `CONNECTED_REAL` cuando se entra desde CTA; deep link no rehidrata wizard |
| Proyectos | `/projects` | `Projects` | `listProjects`, abrir workspace, nuevo proyecto | `CONNECTED_REAL` |
| Workspace resumen | `/projects/:id` | `WorkspaceContent` | snapshot, progreso, actividad, preview/human gate | `CONNECTED_REAL` con proyecto válido |
| Workspace construir | state `area=build` | tab contextual | `createVersion` / pedido de cambio | `CONNECTED_REAL` |
| Workspace materiales | state `area=materials` | tab contextual | upload/remove Web; selector Electron; notas y referencias derivadas | `CONNECTED_PARTIAL` |
| Workspace versiones/entrega | state `area=versions` | tab contextual | listar, comparar, restaurar, preparar/abrir entrega local | `CONNECTED_REAL` local; no es release remoto |
| Preview / Human Gate | dentro de workspace | `jefePreviewApprovalBridge` o API Web | abrir preview, viewed, approve, reject, correction | `CONNECTED_REAL` con preview válido |
| Operación | `/operation` | `OperationalView` | health/readiness/quality/sources/incidents, refresh read-only | `READ_ONLY_REAL`, escondida de sidebar |
| Version deep link | `/projects/:id/versions/:versionId` | effect de `CommercialApp` | valida versión y abre workspace | `CONNECTED_PARTIAL` |

## Capability truth matrix

| Capability | Backend | UI / route | Status | Truthfulness | Duplication | NextAction |
| --- | --- | --- | --- | --- | --- | --- |
| Project list | project persistence + `listProjects` | `/projects` | `CONNECTED_REAL` | honesta | shortcut desde Home | conservar |
| Project creation | `createFirstVersionFromRun` / project IPC/API | wizard | `CONNECTED_REAL` | honesta | Inicio/Proyectos son shortcuts | 10B route coherente |
| Draft persistence | `localStorage` `jefe-commercial-draft-v1` | Home/wizard | `CONNECTED_REAL` | local-only | no | declarar alcance local |
| Input assets | asset IPC/API | wizard/materials | `CONNECTED_PARTIAL` | Home “Adjuntar” no adjunta | wizard/materials | 10B corregir copy/handler |
| Semantic initial generation | materialization + semantic runtime | wizard create | `CONNECTED_REAL` | no garantiza release | no | 10C status visible |
| Semantic correction | `requestSemanticCorrection` | rejected workspace | `CONNECTED_REAL` | aparece sólo tras rechazo | createVersion separado | explicar diferencia |
| Preview | preview service/API | workspace | `CONNECTED_REAL` | snapshot/version visibles | no | conservar |
| Human review | preview approval durable | workspace | `CONNECTED_REAL` | estado durable y snapshot | no | conservar |
| Version listing | lifecycle persistence | workspace versions | `CONNECTED_REAL` | contextual | global nav decorativa | no global screen en 10B |
| Compare | lifecycle compare | workspace versions | `CONNECTED_REAL` | sólo con 2 versiones | no | conservar |
| Restore | lifecycle restore | workspace versions | `CONNECTED_REAL` | crea versión nueva | no | conservar |
| Local delivery | prepare/open delivery | workspace versions | `CONNECTED_REAL` | se distingue técnicamente de release | label “Entrega” puede confundir | 10B copy |
| MEMORIA/context | context bridge/API | workspace summary/build | `CONNECTED_PARTIAL` | Web muestra “Parcial”; estado no se utiliza en pantalla | no | 10C superficie contextual |
| QA/readiness | backend QA/recovery real | `MemoryQaStatus` parcial | `HIDDEN_REAL` | no hay detalle de QA comercial | no | 10C operación |
| Release/Git/CI | durable release + execution + remote evidence | no control comercial | `HIDDEN_REAL` | no se promete release | no | 10C read model |
| Incidents | observability persistence | `/operation` | `HIDDEN_REAL` | read-only | no | 10C operation |
| Operation status | observability runtime | `/operation` | `READ_ONLY_REAL` | unknown/degraded honestos | no | añadir navegación en 10B |

## Matriz de navegación

| Elemento | Comportamiento observado | Clasificación |
| --- | --- | --- |
| Inicio | vuelve a `/` o sólo cambia state | `REAL_NAVIGATION` parcial |
| Proyectos global | cambia screen a Projects, pero no actualiza pathname | `MISROUTED`, P1 |
| Construir global | ejecuta `onHome` | `DECORATIVE` / `MISROUTED`, P1 |
| Versiones global | ejecuta `onHome` | `DECORATIVE` / `MISROUTED`, P1 |
| Entregas global | ejecuta `onHome` | `DECORATIVE` / `MISROUTED`, P1 |
| Operación | sólo URL directa `/operation`; no está en CommercialNav | `HIDDEN_REAL`, P1 |
| Workspace Inicio | `back()` a `/` | `REAL_NAVIGATION` |
| Workspace Proyecto | activo, sin handler | `DECORATIVE` contextual |
| Workspace Orquestador | sin handler | `DECORATIVE`, P1 |
| Workspace Versiones | sin handler; la capacidad vive en tab | `DUPLICATED_CONFUSING`, P1 |
| Workspace Entregas | sin handler; la capacidad vive en tab | `DUPLICATED_CONFUSING`, P1 |
| Wizard volver | vuelve a `/` | `REAL_NAVIGATION` |
| Wizard guardar | localStorage | `REAL_ACTION` |

## Findings

### P1 — navegación global engañosa

`CommercialNav` presenta Construir, Versiones y Entregas como secciones, pero las tres ejecutan `onHome`. Proyectos cambia sólo `screen`; la URL permanece `/`. El usuario no puede inferir una navegación durable desde el sidebar.

### P1 — Operación real pero escondida

`/operation` renderiza `OperationalView` y tiene bridge real read-only, pero ninguna navegación comercial la expone. Su vuelta a Inicio usa `pushState` y `reload`, una señal de routing incompleto.

### P1 — workspace navigation decorative

Orquestador, Versiones y Entregas no tienen handlers. Las capacidades reales están en tabs contextualizadas, por lo que el sidebar promete superficies inexistentes.

### P1 — deep link `/build` incompleto

`startNewProject()` navega a `/build` y setea `screen=wizard`, pero un refresh/direct open de `/build` no setea wizard. La ruta no es durable.

### P2 — copy/action mismatch de materiales

En Inicio, “Adjuntar materiales” llama al mismo `begin()` que “Empezar”; no abre selector ni adjunta. El selector real existe en wizard y Materials Web/Electron.

### P2 — estado operativo fuera del flujo comercial

Release blocked, CI failure, incidents y recovery existen en backend/Operation pero no se ven en Home, Projects ni Workspace. Esto es correcto para no duplicar datos, pero requiere una navegación canónica futura.

### P2 — build/release readiness no explicitados juntos

“JEFE listo para construir” es compatible con crear proyectos, pero la UI comercial no comunica cerca de la entrega la diferencia `BuildReady != ReleaseReady != ProductionReady`.

No se detectaron P0. P3 visuales subjetivos quedan fuera de 10A (`REQUIRES_FUTURE_DESIGN_JUDGMENT`).

## Known questions

- Build global: no es una capability global independiente; hoy es un shortcut defectuoso a Home. Proponer shortcut “Nuevo proyecto” en 10B.
- Versions global: no existe caso backend global demostrado; mantener contextual por proyecto.
- Deliveries global: no existe cola multi-proyecto demostrada; mantener contextual y separar entrega local de release remoto.
- Orquestador: no existe una vista comercial útil de plans/runs/tasks/agents; mantener oculto hasta 10C.
- Operation: capability real, actualmente hidden; debe ser sección global canónica en 10B.
- Workspace Versions/Delivery: capacidad válida contextual, pero los botones laterales son duplicación engañosa.
- Home attach: `COPY_ACTION_MISMATCH`; corregir en 10B, no en 10A.
- Back/forward: los deep links cargan por URL, pero los `pushState` y `setScreen` no tienen listener `popstate`; navegación interna no es plenamente durable.
- Reload: `/projects` y `/operation` tienen rehidratación; `/build` y estados de tabs no.
- Release blocked: está gobernado en backend y `/operation`, no visible en el workspace comercial.

## Canonical information architecture proposal

Esto es propuesta para 10B, no implementación 10A:

`GLOBAL`: Inicio · Proyectos · Operación.

`PROJECT`: Resumen · Construir · Materiales · Versiones y entrega.

`CONTEXTUAL`: Preview/Human Gate dentro del workspace; Corrección sólo cuando el gate está rechazado.

`NOT_GLOBAL_YET`: Versiones, Entregas y Orquestador no deben ser rutas globales sin contratos/read models multi-proyecto demostrados.

Rutas canónicas propuestas: `/`, `/projects`, `/build`, `/projects/:id`, `/projects/:id/versions/:versionId`, `/operation`.

## Plan cerrado

- **10B — Navigation + Information Architecture:** corregir route/state sync, `popstate`, active nav, `/build` deep link, exponer Operación y retirar/marcar shortcuts engañosos.
- **10C — Connected Control Center:** conectar read models de release/CI/QA/incidents/memory y decidir surfaces global/project con evidencia real.
- **10D — UX hardening + closure:** accesibilidad, responsive, loading/error/empty states, copy truthful, recovery UX y cierre.

## Evidence and limits

Playwright Chromium headless, workers=1, retries=0, localhost only. Se capturaron Home, Projects, Wizard, Operation y estados de ruta de workspace inexistente en 1440 y 390; no se fabricó un proyecto ni se llamó a un provider para forzar un workspace. `ProviderCalls=0`, `ExternalNetworkUsed=false`, `QaProcessesLeftBehind=0`.
