# Hermes Research Runtime Adapter Approval Gate v1

## Purpose

Factory Hermes Research Runtime Adapter Approval Gate v1 evaluates whether the first controlled Hermes runtime adapter can be approved as a candidate.

It does not execute Hermes and does not approve research execution.

## Final Approval Input

The gate consumes Final Execution Approval v1 and the Runtime Selection Decision. The approved selection is:

- provider: `openai`
- model: `gpt-4o-mini`
- credential ref: `OPENAI_API_KEY`
- host: `api.openai.com`
- toolset mode: `no_toolsets_text_only`
- run root: `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/`
- prompt ref: `prompt_candidate_from_prompt_policy`

## Toolset Disable Check

The gate inspects Hermes source read-only. Current source evidence shows `--toolsets` validates explicit toolset names and rejects a set with no valid toolsets. The `no_toolsets_text_only` policy mode is not yet proven as a concrete safe Hermes CLI argument.

When that evidence is missing, the gate blocks with `hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified`.

## Not Authorized

- execute Hermes, `hermes.exe`, or `--oneshot`
- pass prompts
- call models
- use network, DNS, endpoints, credentials, env secrets, or `.env`
- enable toolsets
- create run root
- mutate filesystem
- ingest real output or promote findings
- execute uv, Python, pip, or setup.py

## Next Step

If blocked: Factory Hermes Toolset Disable Verification Planning Gate v1.

If later granted: Factory Hermes Research Runtime Adapter v1.

## Toolset Disable Planning Output

Toolset Disable Verification Planning maps the source and plans a future safe probe or selection revision when `no_toolsets_text_only` is not statically proven.
## Toolset Disable Verification Approval Dependency

Toolset Disable Verification Approval must explicitly approve a controlled probe before any adapter retry can rely on `no_toolsets_text_only`. If it blocks, Research Runtime Adapter Approval remains blocked and the flow should revise runtime selection instead of executing Hermes.

Runtime Selection Revision Planning is the conservative blocked path when `no_toolsets_text_only` remains unsupported. Adapter approval retry must not proceed from the invalid selection.

Wrapper No-Tool Mode Planning may produce a future wrapper approval candidate, but adapter approval remains blocked until the wrapper path is separately approved and bounded.

Wrapper No-Tool Mode Approval still does not approve the research runtime adapter. It can only allow implementation planning for a governed wrapper path.
