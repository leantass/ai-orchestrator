# Estado actual canónico del Orquestador

Fecha de cierre documental: 2026-08-21. Rama: `integration/orquestador-canonical-v1`.

Estado prevalente de cierre: `ESCALON_1_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`; `ESCALON_2_STATUS=VERIFIED_CLOSED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

`ESCALON_1_STATUS=VERIFIED_CLOSED`: se cerraron y verificaron la reconciliación de repositorio y la autoridad canónica, no el producto ni el release.

`ESCALON_2_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2C_A_STATUS=COMPLETED`; `ESCALON_2C_B_STATUS=COMPLETED`; `ESCALON_2C_C_STATUS=COMPLETED`; `ESCALON_2C_C1_STATUS=COMPLETED`; `ESCALON_2C_C2_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`.

2B conecta MEMORIA al lifecycle canónico mediante productores posteriores a manifests/ledger, outbox durable, reapertura/reintento, reconciliación idempotente, aislamiento A/B y canales contextuales semánticos. El smoke integrado pasa `CHECKS=42/42` y `CASOS_PASS=1-42`.

## Integrado y validado focalmente

- Contrato único de proyecto, run y versión.
- Perfiles locales `factory_typed` y `commercial_site`.
- Materialización, manifests, persistencia e IPC/preload allowlisted.
- Hub comercial, wizard de cinco pasos, Input Assets como referencia y tres direcciones visuales.
- Workspace de cuatro áreas, ciclo de versiones, ledger, aprobación local, comparación de manifests/hashes, restauración como nueva versión y entrega local inmutable.
- Resolver seguro de preview para proyecto/versión/recurso declarado y MIME permitido.
- La creación/materialización canónica es la única vía real; el flujo heredado permanece deshabilitado y su smoke sólo verifica el rechazo honesto `not_available`.
- MEMORIA recibe creación, versiones, cambios, aprobaciones, restauraciones, entrega local y fallos sanitizados desde fuentes físicas; snapshot/timeline son lecturas puras y timeline está limitado/paginado.
- Paquetes canónicos de contexto son deterministas, presupuestados y específicos por agente; los adapters 2C-B producen sólo handoffs inmutables para consumidores internos inyectables y el runtime por defecto responde `not_connected`.

## Límites abiertos

Los escalones 3 a 12 siguen abiertos: UI de MEMORIA, autenticación humana end-to-end, agentes reales, aprendizaje entre proyectos, búsqueda semántica/vectorial, investigación Radar/Hermes/Scout, planner comercial, Codex/executor real, QA y seguridad globales, preview embebido/QA visual, Git/CI/entrega remota, observabilidad y prueba integral.

El preview no está demostrado como iframe ni validado visualmente; sólo puede abrirse un recurso local previamente validado. Aprobación local no equivale a validación técnica o visual. No hay deploy, publicación, red ni proyecto comercial real.

## Deuda y próximo paso

`npm run lint` global continúa FAIL heredado: 306 errores, 0 warnings, 73 archivos bajo `src/factory/hermes-*`. El quality gate global permanece abierto y no se alteraron reglas. El roadmap canónico vigente no define todavía un nombre único para el siguiente escalón. JEFE no está release-ready; no hay ejecución automática, UI de MEMORIA, autenticación humana end-to-end, QA visual, deploy ni proyecto comercial real.
