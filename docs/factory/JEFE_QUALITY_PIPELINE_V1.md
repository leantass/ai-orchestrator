# JEFE Quality Pipeline V1

## Actual

En V1 actual JEFE genera intake, reportes, contrato, primera version local mock y documentacion. No ejecuta el pipeline completo de QA.

## Futuro

- Vitest: pruebas unitarias, reglas internas y componentes.
- MSW: simulacion controlada de APIs para servicios y flujos.
- Playwright: navegador real, E2E, responsive, accesibilidad basica y evidencia visual.
- axe: accesibilidad automatizada.
- Lighthouse: performance, buenas practicas y SEO tecnico.
- Gitleaks: deteccion de secretos.
- Semgrep: analisis estatico de seguridad y calidad.
- Trivy: vulnerabilidades de dependencias, imagenes o filesystem cuando aplique.
- Promptfoo: evaluacion de prompts, agentes, regresiones, seguridad y calidad de IA.
- Staging: release candidate en ambiente controlado.
- Pruebas post-deploy: verificacion posterior a staging o produccion.
- Produccion: publicacion aprobada.
- Analitica: adquisicion, activacion, retencion, conversion, costos y uso.
- Monetizacion: anuncios, suscripciones, ingresos y unit economics.
- Memoria: errores, soluciones y estandares validados.

## Regla canonica

Ninguna herramienta futura debe describirse como soportada hasta estar implementada, ejecutada y validada. JEFE debe distinguir siempre entre capacidad actual y capacidad planificada.
