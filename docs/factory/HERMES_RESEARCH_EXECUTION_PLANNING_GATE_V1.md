# Factory Hermes Research Execution Planning Gate v1

## Purpose

Factory Hermes Research Execution Planning Gate v1 consumes the approved Research JEFE Review v2 result and plans how a future Hermes research execution could be approved safely.

It does not execute Hermes, pass prompts, use network, access credentials, call models, run uv, run pip, run Python, execute setup.py, mutate project files or deploy.

## Inputs

- `.codex-temp/external-tools/hermes-agent/install/75b300f/research-jefe-review-v2-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-result.json`
- bounded read-only source inspection under `.codex-temp/external-tools/hermes-agent/install/75b300f/source/`

## What It Reviews

- JEFE Review v2 approval for planning only.
- The sanitized `hermes.exe --help` probe output captured by the adapter retry.
- Source hints such as the `hermes` console script and CLI entrypoint.
- Whether any safe offline/mock/dry-run research command is proven.

## Method Candidates

The gate records candidate method families:

- help-derived noninteractive research command;
- source-mapped research command;
- interactive CLI research session;
- networked research execution;
- credentialed model research execution;
- mock or dry-run research execution;
- help output as research source.

Help output is never a research result and cannot be used as findings.

## Decision

If evidence proves a bounded safe command shape, the gate may create a plan candidate for a future Research Execution Approval Gate.

If the help/source evidence implies prompt passing, network, credentials or model calls without an explicit safe offline command contract, the gate returns `manual_review_required`.

## Current Hermes Outcome

Current evidence shows `--oneshot PROMPT`, model/provider flags and safe-mode options, but does not prove a safe offline research command. Therefore the planning gate requires manual command review before any approval gate.

## Not Authorized

- execute Hermes now;
- pass prompt now;
- run research now;
- use network now;
- access credentials now;
- call models now;
- treat help output as findings;
- execute uv, pip, Python or setup.py;
- mutate project files;
- deploy.

## Next Step

Manual command review must decide the exact command shape, prompt policy, model/network/credential policy and output ingestion contract before Factory Hermes Research Execution Approval Gate v1.
## Follow-Up: Policy Chain Planning

The manual review outcome from Research Execution Planning is intentionally resolved by Factory Hermes Research Execution Policy Chain Planning Gate v1. The follow-up plan keeps `--oneshot` blocked until prompt, model provider, credentials, network, toolsets, output, ingestion, timeout, filesystem, and execution boundary policies are explicitly planned and approved.
## Prompt Policy Follow-Up

After Policy Chain Planning, Prompt Policy Planning is the first concrete policy step. It can define a candidate-only prompt and prompt safety rules, but Research Execution Planning remains non-executable until the full policy chain is approved.
