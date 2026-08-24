# Roadmap canónico de finalización del Orquestador

Esta es la única autoridad posterior a Escalón 2. Estados: `ESCALON_1_STATUS=VERIFIED_CLOSED`, `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_3_STATUS=NOT_STARTED`, `ESCALON_4_STATUS=NOT_STARTED`, `ESCALON_5_STATUS=NOT_STARTED`, `ESCALON_6_STATUS=NOT_STARTED`, `ESCALON_7_STATUS=NOT_STARTED`, `ESCALON_8_STATUS=NOT_STARTED`, `ESCALON_9_STATUS=NOT_STARTED`, `ESCALON_10_STATUS=PARTIAL_EXISTING_FOUNDATION`, `ESCALON_11_STATUS=NOT_STARTED`, `ESCALON_12_STATUS=NOT_STARTED`.

## Flujo y retorno

Lean → CEREBRO → Radar → Hermes/Scout → JEFE → MEMORIA → Planner → Codex aislado → QA/seguridad → preview/aprobación humana → Git/CI/entrega → observabilidad → MEMORIA. Cada salida es evidencia para el siguiente gate, no permiso implícito. Brief incompleto vuelve a CEREBRO/Radar; evidencia insuficiente a Hermes/Scout; contradicción a MEMORIA/Lean; plan inválido a Planner; ejecución, QA o seguridad fallidas a Codex/Planner; preview rechazado a JEFE/Planner/Codex; CI/entrega fallidas a Codex/QA/release; incidente a observabilidad/JEFE/MEMORIA.

| Escalón | Propósito y dueño | Entrada → salida/gate | Excluye y retorno |
| --- | --- | --- | --- |
| 3 | Descubrimiento e intake supervisado: CEREBRO/Radar/Hermes/Scout/JEFE | necesidad humana → intake, preguntas, plan de investigación no ejecutado; gate: identidad y autoridad | sin red/proveedores; falta crítica vuelve a Lean/CEREBRO |
| 4 | Planner y contratos ejecutables | intake/contexto válido → alcance, dependencias, riesgos y plan; gate: contrato cerrado | sin ejecución; invalidez vuelve a discovery |
| 5 | Ejecución segura: Codex/worktrees | plan aprobado → cambio aislado recuperable; gate: locks/límites | sin entrega; fallo vuelve a Codex/Planner |
| 6 | QA, seguridad y correction loop | cambio aislado → evidencia de pruebas; gate: QA/SAST/accesibilidad | sin aprobación visual; fallo vuelve a responsable |
| 7 | Preview y aprobación humana | evidencia local real → decisión explícita; gate: operador | sin autenticación ficticia/deploy; rechazo vuelve al plan |
| 8 | Git, CI y entrega | aprobación/evidencia → commit, CI y entrega honesta | sin push/deploy implícito; fallo vuelve a QA/Codex |
| 9 | Observabilidad y operación | eventos reales → salud/incidentes/recuperación | sin alertas inventadas; incidente vuelve a JEFE/MEMORIA |
| 10 | Centro de control comercial | capacidades conectadas → UX visual guiada y accesible | UI sin backend es bloqueada; mantiene base comercial existente |
| 11 | Integración end-to-end | todos los gates reales → flujo trazable completo | no simula agentes/proveedores ausentes |
| 12 | Release governance | evidencia integral → decisión de release humana | no declara release-ready sin auditoría y soporte |

Todos los escalones contienen subbloques A contrato/fundación, B persistencia/orquestación, C evidencia y gates, D recuperación/documentación. Las decisiones de Lean, evidencia física y decisiones humanas nunca son reemplazadas por inferencia.

## Condiciones comerciales transversales de Pol

Cada gate visible exige lenguaje humano, pasos guiados, información justa, estado/próximo paso/error recuperable, acción real con feedback, responsive, teclado/foco y accesibilidad básica. La UI comercial nunca expone paths, IPC, runners ni botones decorativos; diferencia smoke de evidencia real, mantiene historial/comparación y no promete preview, análisis, integración, QA, deploy o aprobación inexistentes.

## Catálogo de terceros candidatos

Nada está integrado por este documento. Sin evidencia local o verificación externa se marca `REQUIRES_EXTERNAL_VERIFICATION`; no se instala ni consulta red.

| Familia | Candidato | Tipo/estado | Escalón | Riesgo/límite |
| --- | --- | --- | --- | --- |
| Git/CI | Git, GitHub CLI/CI | Git presente; resto `REQUIRES_EXTERNAL_VERIFICATION` | 8 | credenciales/red y aprobación |
| aislamiento | worktrees, Docker/Podman | worktrees base existente; contenedores no verificados | 5 | no ejecutar por defecto |
| investigación | SearXNG, Ollama, n8n, crawler | candidatos self-hosted/no integrados | 3 | red, contenido no confiable |
| pruebas | Playwright, Vitest, axe-core, Lighthouse | no verificados localmente | 6/7 | no afirmar QA visual |
| seguridad | Semgrep, Gitleaks, Trivy, OWASP ZAP | candidatos no integrados | 6 | red/credenciales/falsos positivos |
| operación | OpenTelemetry, Prometheus, Grafana, Loki | candidatos no integrados | 9 | no crear telemetría ficticia |
| datos | SQLite/PostgreSQL/MinIO/colas | candidatos no integrados | 9/11 | retención y credenciales |

## Inventario honesto

MEMORIA, paquetes 2C, handoff/resultados y recuperación 2D son `FUNCTIONAL_CONNECTED` en smokes locales. Lifecycle, persistencia, preview seguro y workspace comercial son fundaciones locales conectadas; preview visual, UI de conflictos, autenticación humana, agentes reales, investigación, Codex, QA global, CI, entrega remota y observabilidad son `ABSENT` o `FOUNDATION_ONLY`. Factory/Hermes/Radar/Planner histórico es `HISTORICAL_WIP`/`REFERENCE_ONLY`; Comercial es `PARTIAL_EXISTING_FOUNDATION` para Escalón 10. Ningún fixture, adapter inyectable o documento acredita proveedor real.

El siguiente bloque canónico es `ESCALON_3A=SUPERVISED_DISCOVERY_AND_INTAKE`: contrato, registro durable, coordinación sin ejecución y smoke local.
