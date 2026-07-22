# Hermes Research Execution Boundary Planning Gate v1

## Purpose

Factory Hermes Research Execution Boundary Planning Gate v1 consolidates the prior policy planning chain into one boundary candidate for a future bounded Hermes oneshot execution.

Future command shape under consideration:

```text
hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>
```

This gate is planning only. It does not execute Hermes, pass prompts, enable toolsets, use network, read credentials, call models, ingest output, or promote findings.

## Relationship To Filesystem Mutation Policy Planning

Filesystem Mutation Policy Planning is the final policy input before this gate. It defines that future writes must be restricted to an approved `.codex-temp` run root and that source roots, python-env, uv cache, package files, `.env`, and arbitrary paths remain protected.

Boundary Planning consumes that result together with prompt, model provider, credentials, network, toolsets, output, result ingestion, timeout, and policy chain planning results.

## Consolidated Boundary Shapes

- Command: `shell:false`, oneshot only, non-interactive, no stdin, no help-as-findings.
- Environment: no inherited full env, no `.env` reads, no env secret reads, no env values in artifacts or logs.
- Filesystem: no writes now; future writes only under `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/<runId>/`.
- Network: no hosts, schemes, DNS, endpoint testing, wildcard hosts, or arbitrary internet now.
- Credentials: refs are names only; values are not read, stored, or logged.
- Toolsets: no web, browser, terminal, MCP, filesystem, or hidden default toolsets now.
- Output: previews must be sanitized and size limited; raw output cannot become findings now.
- Ingestion: no ingestion now; future ingestion requires a governed record and JEFE review for findings.
- Timeout: hard timeout, no infinite timeout, no automatic retry, and kill switches required.

## Missing Runtime Selections

The boundary candidate intentionally records missing selections that block execution now:

- prompt approval
- provider selection
- model selection
- credential selection
- network host approval
- toolset selection approval
- runtime run root approval
- final execution approval

## Approval But Not Execution

This gate can proceed to Factory Hermes Research Execution Approval Gate v1 so that JEFE can evaluate the consolidated boundary. That does not authorize execution. The future approval gate must still decide whether the missing runtime selections are resolved and whether a runtime adapter may be created.

## Not Authorized

- execute Hermes or `hermes.exe`
- execute `--oneshot`
- pass prompts
- run research
- call models
- use network or DNS
- access credentials or `.env`
- enable toolsets
- mutate filesystem or project files
- ingest real output or promote findings
- execute uv, Python, pip, or setup.py
- deploy

## Next Steps

1. Factory Hermes Research Execution Approval Gate v1
2. Runtime Adapter candidate
3. Real Result Ingestion
4. JEFE Review
## Downstream Approval

Research Execution Boundary Planning feeds Factory Hermes Research Execution Approval Gate v1. Approval v1 may evaluate the boundary, but it must block execution while runtime selections remain missing.
## Runtime Selection Planning Path

Boundary Planning leads to Approval, and blocked Approval leads to Runtime Selection Planning. Runtime Selection Planning may prepare decision candidates but must not execute Hermes, pass prompts, create run roots, or select final runtime values.
