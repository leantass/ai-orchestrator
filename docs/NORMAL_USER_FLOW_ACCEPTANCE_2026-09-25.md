# Normal User Flow Acceptance — 2026-09-25

## Resultado

La aceptación del flujo normal de JEFE quedó completada con Playwright Chromium headless y el root default real del usuario. No se definió `JEFE_WEB_DATA_ROOT`, no se sustituyó `APPDATA`, no se usó controlled smoke ni deep-link, y el servidor propio usó `JEFE_WEB_NO_BROWSER=1`.

Root utilizado:

`C:\Users\PC\AppData\Roaming\ai-orchestrator\jefe-canonical-projects`

Proyecto histórico inventariado antes de iniciar: `impulso-pyme-muh361hy`. Su snapshot de archivos y SHA-256 fue comparado después: `ExistingProjectsMutated=0`.

## Recorrido

La UI normal ejecutó wizard, CTA, objetivo separado, guardado y restauración de borrador, selección Comercial, revisión, creación inicial, Projects, preview, inspección, rechazo durable y `Corregir versión`. El primer proyecto `impulso-pyme-final-muh942ij` llegó a candidate pero quedó bloqueado por `HeroScannability`; no se reutilizó.

Después del fix de prompt de hero y sus regresiones offline se creó un proyecto normal nuevo: `impulso-pyme-final-corregido-muh9i9qz`. Su flujo creó `version-muh9i9qz`, rechazó esa versión y generó físicamente `version-v0001` sin sobrescribir la fuente.

## Runs y calidad

- `semantic-run-dd1d98f4716b037ed56a`: 3 llamadas; `BLOCKED` por `HeroScannability`, con candidate sin promoción.
- `semantic-run-280dc30eaf063bb4dd19`: 3 llamadas; `PASS`, `lastCompletedPhase=PROMOTED`, `newVersionId=version-v0001`.

El segundo proyecto mostró una sola coincidencia para su nombre en Projects. La calidad final pasó grounding de claims, CTA canónica `Solicitar una reunión`, hero, services, trust, FAQ, repetición entre secciones, fidelity, artifact independence, visual, content, experience y browser.

La inspección responsive del preview corregido pasó en `1440`, `1280`, `1024`, `768` y `390`. Las capturas se guardaron fuera de Git en:

`C:\Users\PC\ai-orchestrator\.codex-temp\normal-user-flow-acceptance\run-20260925-acceptance-fixed`

Se verificaron 25 archivos de screenshot no vacíos, incluidos wizard, borrador, Projects, previews, rechazo, corrección, aprobación y cinco tamaños responsive.

## Human Gate

El preview inicial fue rechazado con feedback durable. La nueva versión fue inspeccionada y aprobada por la continuación automatizada del acceptance, con approval persistido para `version-v0001`.

`AutomatedAcceptanceApproval=true` y `RealHumanApproval=false`. Esto acredita la mecánica del flujo; no es aprobación humana de diseño ni production-readiness.

## Cambios de soporte

- configuración Playwright separada para el root normal, un worker y Chromium headless;
- parámetro de nombre/root de proyecto en la prueba mantenible;
- prompt del ContentPlan reforzado para headings hero escaneables sin debilitar el gate;
- smoke de regresión para la restricción de hero;
- continuación de approval después del fallback de preview;
- roadmap canónico reconciliado sin borrar historia.

## Limitaciones y siguiente fase

La aceptación sigue siendo una prueba controlada sobre el AppData normal local; no hubo deploy ni producción externa. El AppData real ahora contiene los proyectos creados deliberadamente como evidencia y no deben borrarse automáticamente. La aprobación automatizada no reemplaza revisión humana. La siguiente fase requiere decidir la política de retención y continuar con la gobernanza canónica, sin declarar production-ready por este acceptance.
