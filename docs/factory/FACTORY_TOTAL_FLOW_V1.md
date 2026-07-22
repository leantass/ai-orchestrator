# Factory Total Flow v1

## Flow

RADAR DE MERCADO -> HERMES / INVESTIGACION -> JEFE DECIDE -> BRIEF DEL PROYECTO -> CONTRATO DEL PROYECTO -> PERSISTENCIA DEL CONTRATO -> REGISTRY + INTEGRITY DEL CONTRATO -> MEMORIA -> MEMORY REGISTRY + INTEGRITY -> MEMORY READ + CONTEXT ASSEMBLY -> CONTEXT APPROVAL -> CODEX TASK CONTRACT -> CODEX PROMPT ASSEMBLY -> CODEX EXECUTION ADAPTER -> RESULT INGESTION -> JEFE REVIEW -> CORRECTION LOOP -> TESTS / QA / SECURITY / PERFORMANCE -> RELEASE APPROVAL -> STAGING -> PRODUCCION -> ANALYTICS / MONETIZACION -> JEFE DECIDE -> MEMORIA GUARDA APRENDIZAJE VALIDADO -> vuelve al ciclo.

## External Tool Governance Layer

External Tool Governance is transversal:

External Tool Registry -> External Tool Profile -> Source Checkout / Install Plan -> Runtime Boundary -> Tool Adapter -> Tool Result Ingestion -> JEFE Review.

External tools never approve their own output.

## Tools By Stage

Research: Hermes Agent, GDELT, RSS/RSSHub, GitHub Search, Hacker News Algolia.
Testing: Vitest, MSW, Playwright.
Security: Gitleaks, Semgrep, CodeQL, Opengrep, Trivy, OpenSSF Scorecard.
Performance and accessibility: Lighthouse CI, axe-core.
Prompt and LLM evaluation: Promptfoo.
CI/CD: GitHub Actions, Dependabot, Renovate.
Observability and product: OpenTelemetry, Sentry, Umami, PostHog.
Payments and monetization: Stripe, Mercado Pago.

## Status Table

| Flow stage | Status | Notes |
| --- | --- | --- |
| Architecture Blueprint | done_baseline | Stable baseline. |
| Radar | done_baseline | Stable baseline. |
| Hermes profile / adapter / handoff initial | done_baseline | Profile only; no runtime execution. |
| JEFE decision | done_baseline | Governance gate exists. |
| Brief | done_baseline | Draft gate exists. |
| Project Contract | done_baseline | Contract model exists. |
| Contract Persistence Runtime | done_baseline | Controlled `.codex-temp` runtime exists. |
| Contract Registry | done_local_uncommitted | Local uncommitted. |
| Contract Registry Integrity | done_local_uncommitted | Local uncommitted. |
| Memory Admission through Context Approval | done_local_uncommitted | Local uncommitted. |
| Codex Task Contract Candidate | done_local_uncommitted | Candidate only; non-executable. |
| External Tool Governance | in_progress | This block. |
| Hermes source checkout audit | done_local_uncommitted | Windows-safe sparse audit. |
| Codex Task Contract Approval | not_started | No executable task. |
| Codex Prompt Assembly / Approval | not_started | No final prompt. |
| Codex Execution Adapter | not_started | Codex remains blocked. |
| Result Ingestion / JEFE Review / Correction Loop | not_started | Planned. |
| Vitest/MSW/Playwright gates | not_started | Planned. |
| Security gates | not_started | Planned. |
| Lighthouse/axe/Promptfoo gates | not_started | Planned. |
| Release/Staging/Production/Analytics | not_started | Planned. |

## Not Allowed Yet

No Hermes execution, no Codex execution, no final prompt, no executable Codex Task, no dependency install, no project creation, no repository creation, no deployment.

