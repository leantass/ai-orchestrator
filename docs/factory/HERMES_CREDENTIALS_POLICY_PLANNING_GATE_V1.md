# Hermes Credentials Policy Planning Gate v1

## Purpose

Factory Hermes Credentials Policy Planning Gate v1 plans how credential references will be handled for future bounded Hermes `--oneshot` execution.

It does not read credential values, read `.env`, validate API keys, inject credentials, use network, call models, pass prompts, or execute Hermes.

## Relationship With Model Provider Policy Planning

Model Provider Policy Planning listed provider candidates and expected credential reference names. Credentials Policy Planning consumes that result and turns the names into governed credential references with `referenced_not_read` status.

## Credential References

- `OPENAI_API_KEY` for `openai`
- `ANTHROPIC_API_KEY` for `anthropic`
- `GEMINI_API_KEY` for `gemini_google`
- `GOOGLE_API_KEY` for `gemini_google`

These are names only. Values are unknown, unread, and not approved for use now.

## Future Injection Planning

Future credential source must be approved separately. Candidate source types are explicit secret reference, managed secret store if available, or runtime injection under an approved boundary.

Forbidden sources include implicit `.env`, implicit process env without approval, config YAML secret values, and logs.

## Masking And Kill Switches

Logs may contain credential names only. Values must be redacted, env dumps are forbidden, and future results must support credential/provider kill switches.

## What This Gate Does Not Authorize

Credential use, env secret reads, `.env` reads, API key validation, credential selection for execution, network, model calls, prompt passing, `--oneshot`, Hermes, uv, pip, Python, setup.py, project mutation, or deploy.

## Next Steps

Proceed to Factory Hermes Network Policy Planning Gate v1, then Toolsets Policy Planning, Output Contract Planning, and the remaining boundary/runtime gates.
## Exit To Network Policy Planning

Credentials Policy Planning exits to `Factory Hermes Network Policy Planning Gate v1` only as a planning step. Credential references remain names only; network hosts, DNS, endpoint tests, credential use, model calls and Hermes execution remain unauthorized.
## Toolsets Dependency

Credentials Policy Planning does not approve toolsets. Any future toolset selection must pass through Network Policy Planning and Toolsets Policy Planning before execution boundaries can exist.
