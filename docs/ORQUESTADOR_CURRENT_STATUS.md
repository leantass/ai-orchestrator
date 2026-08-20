# Estado actual canónico del Orquestador

Fecha de cierre documental: 2026-08-20. Commit canónico: `28988435dbf0fd7156c63d8ad69a6a01d2f08e3e` más el cierre documental de esta ronda. Rama: `integration/orquestador-canonical-v1`.

`ESCALON_1_STATUS=CLOSED`: se cerró la reconciliación de repositorio y autoridad canónica, no el producto ni el release.

## Integrado y validado focalmente

- Contrato único de proyecto, run y versión.
- Perfiles locales `factory_typed` y `commercial_site`.
- Materialización, manifests, persistencia e IPC/preload allowlisted.
- Hub comercial, wizard de cinco pasos, Input Assets como referencia y tres direcciones visuales.
- Workspace de cuatro áreas, ciclo de versiones, ledger, aprobación local, comparación de manifests/hashes, restauración como nueva versión y entrega local inmutable.
- Resolver seguro de preview para proyecto/versión/recurso declarado y MIME permitido.

## Límites abiertos

Los escalones 2 a 12 siguen abiertos: Context Hub/MEMORIA, investigación Radar/Hermes/Scout, planner comercial, Codex/executor real, QA y seguridad globales, corrección, preview embebido/QA visual, Git/CI/entrega remota, observabilidad y prueba integral.

El preview no está demostrado como iframe ni validado visualmente; sólo puede abrirse un recurso local previamente validado. Aprobación local no equivale a validación técnica o visual. No hay deploy, publicación, red ni proyecto comercial real.

## Deuda y próximo paso

`npm run lint` global continúa FAIL heredado: 306 errores, 0 warnings, 73 archivos bajo `src/factory/hermes-*`. El quality gate global permanece abierto y no se alteraron reglas. El siguiente escalón exacto es **Escalón 2: Context Hub/MEMORIA**, empezando por contrato y límites de admisión, no por integración externa automática.
