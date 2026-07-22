# Hermes Runtime Selection Decision Gate v1

## Purpose

Factory Hermes Runtime Selection Decision Gate v1 records Lean's concrete runtime selections for the first controlled future `hermes.exe --oneshot "<PROMPT>"` evaluation.

It does not approve execution. It only prepares a complete selection package for a future Research Execution Approval Retry Gate.

## Recorded Selection

- Prompt: prompt candidate from Prompt Policy Planning, still candidate-only and not sent.
- Provider: `openai`, selected but not approved for execution.
- Model: `gpt-4o-mini`, exact string, no wildcard and no latest alias.
- Credential ref: `OPENAI_API_KEY` by name only; value unknown and unread.
- Network host: `api.openai.com` selected only; DNS is not resolved and endpoint is not tested.
- Toolset mode: `no_toolsets_text_only`; hidden defaults, web, browser, terminal, MCP, and filesystem toolsets remain disabled.
- Run root: `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/`; not created.
- Final approval: not approved now; approval retry required.

## Not Authorized

- execute Hermes, `hermes.exe`, or `--oneshot`
- pass or send a prompt
- call models
- use network, DNS, endpoints, credentials, `.env`, or env secrets
- enable toolsets
- create run root
- mutate filesystem or project files
- ingest real output or promote findings
- execute uv, Python, pip, or setup.py

## Output

The gate writes `runtime-selection-decision-result.json` under the Hermes install artifact root. The result status is `runtime_selection_decision_recorded`, and the decision is `hermes_runtime_selection_decision_recorded_for_approval_retry`.

## Next Step

Factory Hermes Research Execution Approval Retry Gate v1 must review this selection before any runtime adapter can be allowed.

## Approval Retry Outcome

Research Execution Approval Retry may validate these selections, but if final execution approval remains false it must block and hand off only to Factory Hermes Final Execution Approval Gate v1.

Final Execution Approval may approve these selected values for the next gate only. Adapter approval and runtime execution stay separate.

## Revision Planning Outcome

If a later gate proves the selected toolset mode unsupported, Factory Hermes Runtime Selection Revision Planning Gate v1 must revisit the selection before any adapter approval retry.
