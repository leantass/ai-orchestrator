# Hermes Runtime Selection Revision Planning Gate v1

## Purpose

This gate plans a revision of the current Hermes runtime selection because `no_toolsets_text_only` is not proven as real Hermes CLI syntax and no safe toolset-disable probe shape was approved.

It does not choose a final replacement selection and does not execute or approve any runtime adapter.

## Inputs

- `toolset-disable-verification-approval-result.json`
- `research-runtime-adapter-approval-result.json`
- `runtime-selection-decision-result.json`
- related planning and policy artifacts

## Current Blocked Selection

- provider: `openai`
- model: `gpt-4o-mini`
- credential ref: `OPENAI_API_KEY`
- host: `api.openai.com`
- toolset mode: `no_toolsets_text_only`
- run root: `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/`

The selection is invalid for adapter approval because the selected toolset mode is not supported/proven.

## Revision Options

- keep Hermes research blocked
- plan a wrapper-enforced no-tool mode
- revise to a known valid minimal toolset
- forbid hidden default CLI toolsets
- forbid direct Hermes runtime with `no_toolsets_text_only`
- keep controlled toolset probe blocked until a safe command shape exists

## Recommended Path

`plan_wrapper_enforced_no_tool_mode`

Next gate:

- Factory Hermes Wrapper No-Tool Mode Planning Gate v1

## Wrapper Planning Outcome

Factory Hermes Wrapper No-Tool Mode Planning Gate v1 consumes this revision plan and may create a plan candidate for approval. It still cannot implement the wrapper or execute Hermes.

Factory Hermes Wrapper No-Tool Mode Approval Gate v1 can approve only implementation planning for that wrapper path. Direct adapter approval remains blocked.

Alternate:

- Factory Hermes Runtime Selection Revision Decision Gate v1

## Not Authorized

This gate does not authorize Hermes execution, `--oneshot`, prompt passing, model calls, network, credentials, env secret reads, toolset enablement, filesystem mutation, run-root creation, output ingestion, findings promotion, uv, Python, pip, setup.py, deploy, commit, or push.
