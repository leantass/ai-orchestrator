# Hermes Runtime Selection Planning Gate v1

## Purpose

Factory Hermes Runtime Selection Planning Gate v1 converts the blockers from Research Execution Approval into runtime selection candidates and a Lean decision pack.

It does not choose final values and does not approve execution.

## Relationship To Research Execution Approval

Research Execution Approval v1 blocks because runtime selections are missing. This gate turns those requirements into a structured planning artifact for a future Runtime Selection Decision Gate.

## Why It Does Not Select Final Values

Prompt, provider, model, credential refs, network hosts, toolsets, run root, and final execution approval all require explicit human or gate decisions. Selecting them here would bypass the approval boundary.

## Selection Candidates

- Prompt candidate from Prompt Policy Planning, candidate-only.
- Provider candidates: `openai`, `anthropic`, `gemini_google`; mock/offline unavailable; env/config defaults forbidden.
- Model candidate: exact model string required, no wildcard or latest alias without explicit approval.
- Credential candidates: names only, values not read.
- Network host candidates: exact host selection required, no wildcards or arbitrary internet.
- Toolset candidates: conservative `no_toolsets_text_only` candidate plus forbidden or policy-gated toolsets.
- Runtime run root candidate under `.codex-temp`.
- Final approval candidate requiring retry/final approval.

## Lean Decision Pack

Lean must later decide:

1. exact prompt or prompt candidate approval
2. explicit provider
3. exact model
4. credential ref
5. exact hosts
6. toolset mode
7. `.codex-temp` run root
8. final execution retry

## Not Authorized

- select final runtime values
- approve execution or runtime adapter
- execute Hermes, `hermes.exe`, or `--oneshot`
- pass prompts
- call models
- use network, DNS, endpoints, credentials, `.env`, or env secrets
- enable toolsets
- create run root
- mutate filesystem or project files
- ingest output or promote findings
- execute uv, Python, pip, or setup.py

## Next Steps

1. Factory Hermes Runtime Selection Decision Gate v1
2. Approval retry/final
3. Runtime Adapter candidate
4. Real Result Ingestion
5. JEFE Review

## Decision Gate Output

Runtime Selection Decision Gate v1 may record concrete values selected by Lean, but it still does not authorize execution. The recorded selection is only an input for a future Research Execution Approval Retry Gate.

Approval Retry must still block when final execution approval is missing.
