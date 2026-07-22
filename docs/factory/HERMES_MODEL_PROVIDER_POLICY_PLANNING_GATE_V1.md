# Hermes Model Provider Policy Planning Gate v1

## Purpose

Factory Hermes Model Provider Policy Planning Gate v1 creates a provider/model policy plan for future bounded `hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL>` execution.

This gate does not choose a provider for execution. It does not read API keys, read `.env`, call models, use network, pass prompts, or execute Hermes.

## Relationship With Prompt Policy Planning

Prompt Policy Planning produced a candidate-only prompt and authorized only the next planning step. Model Provider Policy Planning consumes that result and defines how provider/model selection must be governed before future execution approval.

## Provider Candidates

Candidates are evidence-based and non-executable:

- `openai`: requires future credentials policy, network policy, and model call approval.
- `anthropic`: requires future credentials policy, network policy, and model call approval.
- `gemini/google`: requires future credentials policy, network policy, and model call approval.
- `local/offline/mock`: not available unless future source evidence proves a contractual mode.
- `default_from_env_or_config`: forbidden without explicit approval.

## Why No Provider Is Selected Yet

Selecting a provider for execution would imply future credential handling, network scope, model call behavior, cost/rate risks, and output ingestion. Those are separate gates. This gate keeps `selectedProvider` and `selectedModel` as `null`.

## Why Env And Credentials Are Not Read

The source references environment/config resolution such as `HERMES_INFERENCE_PROVIDER`, `HERMES_INFERENCE_MODEL`, and provider API-key names. This gate only records those names as references. It never reads real environment values, `.env`, auth stores, or credential files.

## Hidden Defaults Are Forbidden

Future approval must use explicit `--provider` and `--model`. Implicit env/config defaults, wildcard providers, wildcard models, fallback providers, and "latest" aliases are blocked unless a future policy explicitly approves them.

## What This Gate Does Not Authorize

- Model calls now.
- Provider/model selection for execution now.
- Reading env secrets.
- Accessing credentials.
- Using network.
- Passing prompts or executing `--oneshot`.
- Running Hermes, uv, pip, Python, or setup.py.
- Mutating project files or deploying.

## Next Steps

Proceed to Factory Hermes Credentials Policy Planning Gate v1, then Network Policy Planning, Toolsets Policy Planning, Output Contract Planning, and the remaining research execution gates.
## Output To Credentials Policy Planning

The approved next gate from Model Provider Policy Planning is Factory Hermes Credentials Policy Planning Gate v1. That gate may record credential reference names, but it must not read values, `.env`, auth stores, or environment secrets.
## Relationship To Network Policy Planning

Model Provider Policy Planning leaves provider and model unselected. Network Policy Planning may only derive future provider network candidates and exact-host approval requirements; it must not approve hosts, use provider defaults, call models, resolve DNS or test endpoints.
