# Hermes Prompt Policy Planning Gate v1

## Purpose

Factory Hermes Prompt Policy Planning Gate v1 creates a prompt policy plan for future bounded `hermes.exe --oneshot "<PROMPT>"` execution.

This gate does not send prompts to Hermes. It only defines a candidate prompt, prompt rules, allowlists, blocklists, injection defenses, and the next required policies before any execution approval can be considered.

## Relationship With Policy Chain Planning

Policy Chain Planning identified `Prompt Policy` as the first required policy in the future Hermes research execution chain. This gate consumes that plan and produces:

- `promptPolicyPlanningReceipt`
- `hermesPromptPolicyPlanCandidate`

The approved next gate is only Factory Hermes Model Provider Policy Planning Gate v1.

## Prompt Candidate

The prompt candidate is candidate-only:

- It is not approved for execution.
- It must not be sent to Hermes in this gate.
- It is stored as governed planning data with a SHA256 hash.
- It remains blocked until model provider, credentials, network, toolsets, output, ingestion, timeout, filesystem, and execution boundary policies are approved.

## Allowlist

Prompt content is limited to:

- Short functional test questions.
- Textual reasoning tasks without tools.
- Artificial and non-sensitive content.
- No real names.
- No personal data.
- No secrets.
- No URLs.
- No files.

## Blocklist

Prompt content must block:

- Secrets, API keys, tokens and passwords.
- Personal data and credentials.
- External URLs.
- Network, web, browser or search instructions.
- Terminal, shell, executable code or filesystem instructions.
- Tool calls.
- Model/provider overrides.
- Prompt injection and "ignore previous instructions".
- Memory use.
- Output as final usable findings.

## What This Gate Does Not Authorize

- Passing prompts now.
- Executing `--oneshot`.
- Running research.
- Executing Hermes or hermes.exe.
- Using network, credentials, models or toolsets.
- Treating prompt or output as findings.
- Running uv, pip, Python or setup.py.
- Mutating project files or deploying.

## Next Steps

Proceed to Factory Hermes Model Provider Policy Planning Gate v1, then continue through credentials, network, toolsets, output contract, ingestion, timeout, filesystem, and execution boundary policies before any research execution approval.
## Output To Model Provider Policy Planning

The approved next gate from Prompt Policy Planning is Factory Hermes Model Provider Policy Planning Gate v1. That gate may list provider/model candidates, but it must not select a provider for execution, read credentials, call models, or send the prompt.
