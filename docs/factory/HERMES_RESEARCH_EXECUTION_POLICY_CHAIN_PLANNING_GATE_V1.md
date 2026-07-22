# Hermes Research Execution Policy Chain Planning Gate v1

## Purpose

Factory Hermes Research Execution Policy Chain Planning Gate v1 turns the manual-review result from Research Execution Planning plus the deep source review into a policy-chain plan for future governed `hermes --oneshot` execution.

This gate is planning-only. It does not execute Hermes, pass prompts, use network, read credentials, call models, run uv, run pip, run Python, or run setup.py.

## Why `--oneshot` Requires a Policy Chain

The deep source review found that `--oneshot PROMPT` exists and routes into `AIAgent`. Provider/model can come from args, environment, or config. Credential names such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, and `GOOGLE_API_KEY` appear in source. Toolsets can include web, browser, terminal, and MCP. No contractual mock/offline mode was found.

Because real oneshot execution can imply prompts, model/provider resolution, credentials, network, toolsets, and text output ingestion, JEFE must approve each policy boundary before any research execution approval.

## Required Policies

- Prompt Policy
- Model Provider Policy
- Credentials Policy
- Network Policy
- Toolsets Policy
- Output Contract Policy
- Result Ingestion Contract
- Timeout / Kill Switch Policy
- Filesystem Mutation Policy
- Research Execution Boundary Policy

## Proposed Gate Sequence

1. Factory Hermes Prompt Policy Planning Gate v1
2. Factory Hermes Model Provider Policy Planning Gate v1
3. Factory Hermes Credentials Policy Planning Gate v1
4. Factory Hermes Network Policy Planning Gate v1
5. Factory Hermes Toolsets Policy Planning Gate v1
6. Factory Hermes Output Contract Planning Gate v1
7. Factory Hermes Research Execution Boundary Planning Gate v1
8. Factory Hermes Research Execution Approval Gate v1
9. Factory Hermes Research Execution Runtime Adapter v1
10. Factory Hermes Research Execution Result Ingestion Gate v1
11. Factory Hermes Research Execution JEFE Review Gate v1

## What It Produces

- `researchExecutionPolicyChainPlanningReceipt`
- `hermesResearchExecutionPolicyChainPlan`

The approved next gate is only Factory Hermes Prompt Policy Planning Gate v1.

## What It Does Not Authorize

- Running research now
- Executing Hermes or the selected entrypoint
- Executing `--oneshot`
- Passing prompts
- Using network
- Accessing credentials
- Calling models
- Enabling toolsets
- Treating help output as research
- Running uv, pip, Python, or setup.py
- Mutating project files
- Deploying

## Next Step

Proceed to Factory Hermes Prompt Policy Planning Gate v1. Research execution approval remains blocked until the full policy chain is planned, approved, bounded, executed, ingested, and reviewed by JEFE.
## Output To Prompt Policy Planning

The first approved next gate from Policy Chain Planning is Factory Hermes Prompt Policy Planning Gate v1. That follow-up may create a candidate-only prompt policy plan, but it must not pass the prompt to Hermes or authorize `--oneshot` execution.
## Model Provider Policy Planning

After Prompt Policy Planning, the chain proceeds to Factory Hermes Model Provider Policy Planning Gate v1. Provider/model planning must forbid hidden env/config defaults and must defer credentials, network, and model-call approval to later gates.
