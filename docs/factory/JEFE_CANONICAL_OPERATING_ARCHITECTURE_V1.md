# JEFE Canonical Operating Architecture V1

## Diagrama canonico

RADAR DE MERCADO
Detecta tendencias, oportunidades y senales economicas
  -> HERMES / SCOUT
Investiga demanda, competidores, resenas, precios, tendencias y modelos de monetizacion
  -> JEFE / ORQUESTADOR
Puntua, decide, aprueba y divide el trabajo
  -> MEMORIA
Recupera contexto canonico y decisiones
  -> CODEX / CONSTRUCTOR
Construye, modifica, prueba tecnicamente y documenta
  -> JEFE / ORQUESTADOR
Compara la entrega contra el brief, el contrato y los criterios de aceptacion
  -> CODEX
Devuelve errores o cambios
  -> MEMORIA
Guarda decisiones y aprendizajes validados
  -> VITEST + MSW
Prueban logica, servicios, componentes, reglas internas y comportamientos de APIs
  -> PLAYWRIGHT
Prueba navegador, flujos reales, responsive, navegadores, accesibilidad y evidencia visual
  -> JEFE / ORQUESTADOR
Interpreta los resultados y decide
  -> SEGURIDAD, CALIDAD Y RENDIMIENTO
Gitleaks, Semgrep, Trivy, axe, Lighthouse y controles correspondientes
  -> PROMPTFOO
Evalua prompts, agentes, regresiones, seguridad y calidad de respuestas de IA
  -> JEFE / ORQUESTADOR
Aprueba o rechaza la publicacion
  -> STAGING
  -> PRUEBAS POST-DEPLOY
  -> PRODUCCION
  -> ANALITICA Y MONETIZACION
Adquisicion, activacion, retencion, conversion, costos, tokens, anuncios, suscripciones e ingresos
  -> JEFE / ORQUESTADOR
Decide escalar, corregir, cambiar monetizacion o cerrar el producto
  -> MEMORIA
Guarda aprendizajes reutilizables validados

## Estado actual

JEFE soporta brief intake, generacion de 10 reportes, Project Contract, MVP Scope, Architecture Plan, Data Model inicial, Backlog, Risk Register, QA Checklist, primera version local mock, apertura de app demo, apertura de carpeta, copia de rutas, proyecto separado del nucleo JEFE y multiples tipos de proyecto por registry.

## Estado futuro

RADAR real, HERMES / Scout con research real, Codex build loop conectado desde UI, Vitest + MSW reales, Playwright real, Gitleaks, Semgrep, Trivy, axe, Lighthouse, Promptfoo, staging, produccion, analitica, monetizacion y memoria validada estan planificados.

## Limites actuales

La primera version local mock no es producto final. No hay backend real, base de datos real, auth real, pagos reales, deploy, providers reales, QA completo, publicacion productiva ni memoria validada sin aprobaciones futuras.

## Relacion de componentes

RADAR encuentra oportunidades. HERMES / Scout investiga. JEFE decide y orquesta. CODEX construye cuando hay aprobacion explicita. Vitest + MSW y Playwright validan en fases futuras. Seguridad, calidad y rendimiento agregan controles. Promptfoo evalua sistemas de IA cuando aplica. Staging y produccion son releases controlados. Analitica y monetizacion devuelven senales. MEMORIA solo guarda aprendizajes validados.
