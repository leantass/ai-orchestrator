# JEFE Project Modes V1

## Modo 1 - Crear proyecto nuevo

Input: brief, assets opcionales, constraints, plataforma y tipo de proyecto. Proceso: intake, type detection, capability matrix, arquitectura prevista, reportes y primera version local mock. Output: 10 reportes, proyecto local separado, app mock, docs y proximos niveles.

## Modo 2 - Continuar proyecto existente

Input: ruta local del proyecto, repo, estado actual, objetivo del usuario, errores conocidos y assets opcionales. Proceso: scan seguro, detectar stack, scripts, package files, estado Git, docs, backlog y tests existentes; crear plan de continuacion; no modificar sin aprobacion. Output: diagnostico, plan, tareas Codex, QA recomendado, riesgos y siguiente accion segura.

## Modo 3 - Terminar proyecto incompleto

Input: proyecto existente, definicion de terminado, checklist y criterios de aceptacion. Proceso: gap analysis, backlog faltante, riesgos, tareas ordenadas, QA y preparacion release. Output: plan de finalizacion, tareas, criterios de aceptacion, checklist QA y readiness para staging/produccion si aplica.

## Modo 4 - Mejorar proyecto existente

Casos: SEO, performance, UI, monetizacion, analytics, bugs, seguridad, escalabilidad, accesibilidad y conversion. Output: diagnostico, ranking de oportunidades, plan de cambios y pruebas necesarias.

## Modo 5 - Crear assets / datos / base

Casos: assets visuales, mock data, modelos de datos, schema, seeds, migraciones, documentacion tecnica y estructura de DB local/dev/prod. Output: assets, data model, mock data, schema plan, DB roadmap y restricciones.

## Modo 6 - Auditar idea/proyecto antes de construir

Casos: analizar si conviene construir, pedir research, comparar competidores, estimar monetizacion y detectar riesgos. Output: score, riesgos, recomendacion y decision build / no build / wait / research required.

## Regla transversal

Todo modo debe distinguir memoria local, OpenAI API, Hermes, Scout, Codex, approvals, governance y cost control. Ningun modo puede tocar produccion, credenciales, datos reales o herramientas externas sin aprobacion explicita.
