# Primer ciclo real semántico aprobado — 2026-09-24

## Objetivo y alcance

Este documento registra el primer ciclo real completo de corrección semántica de JEFE, desde `version-v0001` hasta `version-v0006`, incluyendo rechazos humanos durables, correcciones reales, generación con provider OpenAI, quality gates y aprobación humana durable.

El alcance fue un controlled real smoke. No acredita producción, deploy ni el flujo normal de creación de proyectos de usuario.

## Baseline

- Repo: `C:\Users\PC\ai-orchestrator`
- Branch: `feature/continue-orchestrator`
- HEAD: `803462d035cfd1147681cb425df1efd7cc27f5f1`
- Remote HEAD: `803462d035cfd1147681cb425df1efd7cc27f5f1`
- Worktree: limpio
- Provider calls durante este checkpoint: `0`

## Arquitectura real validada

El ciclo validó HumanFeedback desde una versión rechazada, BusinessUnderstanding, ContentPlan y ExperiencePlan reales vía provider, Structured Outputs, Model Router V2, ejecución background, presupuesto de provider, ContentSectionCatalog dinámico, generación de candidate, fidelity, artifact independence, quality visual/contenido/experiencia/browser y promoción a una nueva versión `pending_review`.

Router observado:

- `business_understanding` → `balanced / gpt-5 / medium / background`
- `content_plan` → `balanced / gpt-5 / medium / background`
- `experience_plan` → `balanced / gpt-5 / medium / background`

`gpt-5` es el modelo físico actualmente configurado; no es una obligación arquitectónica. Las llamadas fueron `3/6` y las rondas de corrección `1`.

## Secuencia real

| Versión | Human Gate | Evidencia |
|---|---|---|
| v0001 | rejected | razón durable persistida |
| v0002 | rejected | razón durable persistida |
| v0003 | rejected | razón durable persistida |
| v0004 | rejected | razón durable persistida |
| v0005 | rejected | razón durable persistida |
| v0006 | approved | aprobación durable persistida |

Las seis versiones existen como directorios físicos separados bajo `.codex-temp/orchestrator-real-smoke/orchestrator-real-smoke/`. Las fuentes no fueron reescritas.

## Bugs y capacidades generalizadas

Las iteraciones validaron findings humanos estructurados con legacy read, drift y gramática observables, catálogo dinámico e IDs no literales, fidelidad limitada a contenido activo/required, separación ContentPlan/ExperiencePlan, FAQ/trust/contact/CTA/services estructurados, ownership hero/presentation, body copy normalizado, fallback semántico repetitivo bloqueado, secciones desconocidas fail-closed, deadline y poll limit separados, routing proporcional por operación y QA de repetición cross-section e intra-service.

## Quality gates vigentes

En `semantic-run-08ab7bd0a687c3e5b082` pasaron: `HumanFeedback`, `BusinessUnderstanding`, `ContentPlan`, `ContentSectionContract`, `ExperiencePlan`, `SemanticGenerationSpec`, `CandidateCreated`, `ServiceCardQuality`, `RenderedServiceCardQuality`, `CrossSectionRepetition`, `HeroQuality`, `CTAQuality`, `TrustHeadingQuality`, `FaqHeadingQuality`, `ContentFidelity`, `ArtifactIndependence`, `VisualQuality`, `ContentQuality`, `ExperienceQuality`, `BrowserQuality` y `QualityOverall`.

BrowserQuality se ejecutó con Chrome. CandidateHash: `d1d5dbbba285c83e0ccdc415599b76efbf197953df14db5a99945d447443de13`.

## Resultado y Human Gate

- Run: `semantic-run-08ab7bd0a687c3e5b082`
- Resultado del run: `PROMOTED`
- NewVersion al finalizar el run: `version-v0006`
- Estado al finalizar el run: `pending_review`
- CandidateCreated: `true`
- Approval durable: `approval-preview-79ef582733af6f771f9e22bf`
- Reviewer: `local-human-reviewer`
- Approval timestamp: `2026-09-24T15:37:15.829Z`
- Snapshot SHA-256: `4d6578fffd29f4f0d1ef8e279ba4d5c16c9b3ae3fff4b1a35e5b5ecbfdeaf95a`

El run terminó en `pending_review`; la aprobación `approved` ocurrió después mediante el Human Gate durable.

## Limitaciones reales

- Controlled real smoke en `.codex-temp`; el ID contiene `smoke` y la UI comercial lo oculta del listado, por lo que se usó deep-link.
- Falta demostrar el flujo productivo desde creación normal de proyecto de usuario sin harness.
- Fast/balanced/complex pueden resolver físicamente al mismo `gpt-5` sin modelos específicos.
- No hubo deploy remoto, producción externa ni red de conectores.
- `main` no incorpora esta rama; la deuda histórica de lint no se considera resuelta.
- Este cierre no significa production-ready.

## Siguiente fase recomendada

### REAL USER PROJECT FLOW V1

No se implementa ahora. Debe cubrir proyecto visible no-`smoke`, root normal, creación desde UI, generación inicial, preview, rechazo, corrección semántica desde UI, quality, nueva versión y aprobación, sin deep-links manuales, `.codex-temp` ni runner especial.
