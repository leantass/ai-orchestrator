# Runtime seguro de conectores de investigación (3C-A)

`STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3_STATUS=IN_PROGRESS`; `ESCALON_3A_STATUS=COMPLETED`; `ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`; `ESCALON_3C_A_STATUS=COMPLETED`.

3C-A establece una fundación local y supervisada para preparar, persistir y controlar intentos de connector. No conecta investigación remota. `NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`. `manual_reference` es una referencia local inerte; metabúsqueda permanece `not_connected`, navegador automatizado `disabled` y modelo local `not_configured`. Los adapters inyectados por el smoke son fixtures, no providers ni evidencia externa.

## Autoridad y flujo

- `jefe-research-connector-contract.cjs` cierra tipos, operaciones, identidad, estados y transiciones.
- `jefe-research-connector-persistence.cjs` conserva intentos, reservas y estado durable de circuit breaker mediante escrituras atómicas e índice reconstruible.
- `jefe-research-connector-coordinator.cjs` limita concurrencia, cola y cancelación por connector/root.
- `jefe-research-connector-runtime.cjs` aplica política confiable, timeout, retry con lineage y reconciliación acotada.

El caller sólo solicita una operación permitida para una request ya planificada. No puede suministrar adapter, provider efectivo, presupuesto, timeout, circuit breaker, IDs derivados, autoridad, aceptación, deploy ni paths. La política y los adapters se inyectan desde la composición confiable, nunca desde contenido externo o renderer.

Un adapter devuelve únicamente un candidato no confiable. El runtime valida forma y límites, rechaza campos no permitidos y conserva sólo un receipt sanitizado y el claim acotado. La correlación se deriva de la request durable. La única entrega a 3B es:

```text
receiveContribution({ researchRequestId, rawReceipt, claim })
```

`receiveContribution` vuelve a validar request, provider, receipt y caso. El runtime no entrega corroboraciones, no decide `needs_corroboration`, `accepted_for_context` o `requires_human`, no inventa autoridad humana y no escribe MEMORIA. Sólo el orquestador de investigación agrega receipts persistidos y realiza el único append canónico después de aceptación.

## Durabilidad y recuperación

Los intentos pasan por estados cerrados: `prepared`, `policy_blocked`, `not_connected`, `running`, `contributing`, `succeeded`, `partial`, `failed_transient`, `failed_permanent`, `timed_out` y `cancelled`. `contributing` linealiza la entrega local: cancel/reconcile no pueden declarar terminal un intento mientras `receiveContribution` sigue vivo. Reservas y consumo reportado son durables y acotados; no constituyen medición independiente del trabajo del adapter. Replay no repite adapters ni contribuciones ya persistidas; una respuesta tardía del adapter no puede revivir un intento cancelado o vencido.

Retry crea un descendiente determinista con `retryOfAttemptId`, `rootAttemptId` y número de intento, vuelve a reservar presupuesto confiable y respeta un máximo de intentos, sin alterar el registro original. El circuit breaker conserva fallos, apertura, cooldown y probe half-open. Reconcile procesa un lote limitado y determinista; omite trabajo aún coordinado en el proceso, recupera `running`/`contributing` huérfanos como fallo transitorio y no ejecuta automáticamente trabajo nuevo. Corrupciones y colisiones quedan aisladas con códigos allowlisted, sin sobrescribir bytes ni exponer payload, stack o path.

## Seguridad y límites

El contrato rechaza campos crudos y marcadores/sintaxis explícitos de secrets, credentials, headers, stacks, paths y commands; no pretende descubrir un secreto arbitrario sin señal semántica. Referencias HTTPS son datos inertes: no implican DNS, fetch ni confianza. Traps de smoke verifican cero red, DNS, fetch, shell, browser, Electron, provider real, generación, preview, publicación y deploy.

El timeout demostrado cubre la fase del adapter. La entrega posterior a `receiveContribution` es una operación local confiable y linealizada, no abortable; 3C-A no afirma timeout distribuido. Intento y health se escriben como registros atómicos separados, no como una transacción conjunta; reconcile repara probes terminales conocidos. Locks y coordinación son locales al proceso, por lo que una futura composición multiproceso deberá añadir autoridad interproceso antes de conectar providers reales.

3C-A no crea UI, autenticación humana end-to-end, QA visual, conexión real de Radar/Hermes/Scout, ejecución autónoma ni autoridad comercial. Tampoco inicia 3C-B. JEFE no está release-ready.

## Evidencia de cierre

`jefe-research-connector-runtime-smoke.mjs` acredita:

- `SMOKE_STRUCTURE=52/52`
- `BEHAVIORAL_CASES_COMPLETE=52/52`
- `BEHAVIORAL_CASES_REAL=1-52`
- cinco ejecuciones completas 52/52
- `CONNECTOR_RUNTIME_SMOKE=52/52_PASS_X5`
- órdenes cruzados verdes con 3B, 2B, C2 y 2D

El cierre conserva 3A en 40/40, 3B en 84/84, 3B-R1 en 41 casos con `CORRELATION_SMOKE=PASS`, 2B en 42/42, C1 en 30/30, C2 en 36/36 y 2D en 54/54. Smokes y adapters no se presentan como evidencia externa.

Una flake C2 reproducida por el orden cruzado llevó a corregir la exclusión de append/rebuild de MEMORIA entre instancias del mismo proceso y a hacer único el staging. La regresión pasó 36/36 diez veces consecutivas; no se afirma locking entre procesos.

La deuda Hermes heredada permanece intacta: 306 errores, 0 warnings y 73 archivos afectados. `PUSH=NO`.

`NEXT=ESCALON_3C_SUPERVISED_RESEARCH_CONNECTORS_AND_EXECUTION`.
