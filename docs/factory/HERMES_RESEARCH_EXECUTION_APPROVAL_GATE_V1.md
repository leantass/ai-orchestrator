# Hermes Research Execution Approval Gate v1

## Purpose

Factory Hermes Research Execution Approval Gate v1 evaluates the consolidated Research Execution Boundary Planning result and decides whether real Hermes research execution may advance.

For v1, execution must remain blocked because required runtime selections are still missing.

Expected blocked decision:

```text
hermes_research_execution_approval_blocked_missing_runtime_selections
```

## Relationship To Boundary Planning

Boundary Planning consolidates the policy chain and says Approval may evaluate the boundary. Approval does not mean execution. This gate checks that boundary, maps missing runtime selections to explicit requirements, and produces a blocker plan.

## Why It Evaluates But Blocks

The boundary is valid, but the following runtime selections are not satisfied:

- prompt approval
- provider selection
- model selection
- credential selection
- network host approval
- toolset selection approval
- runtime run root approval
- final execution approval

Without those selections, no runtime adapter or execution runtime can be approved.

## Runtime Selection Requirements

The gate creates `runtimeSelectionRequirements` for:

- exact approved prompt under Prompt Policy
- explicit provider and model, with no hidden env/config defaults
- approved credential refs without storing values
- exact network hosts with no wildcards
- explicit toolsets, preferably text-only/no-toolsets if supported
- specific `.codex-temp` run root with path containment
- final human/gate execution approval before runtime adapter

## Blocker Plan

The blocker plan points to `Factory Hermes Runtime Selection Planning Gate v1` and orders resolution:

1. Prompt Runtime Selection Planning
2. Provider/Model Runtime Selection Planning
3. Credential Runtime Selection Planning
4. Network Host Runtime Selection Planning
5. Toolset Runtime Selection Planning
6. Runtime Run Root Selection Planning
7. Final Execution Approval Retry

## Not Authorized

- approve execution now
- approve runtime adapter now
- execute Hermes, `hermes.exe`, or `--oneshot`
- pass prompts
- select prompt/provider/model/credential/host/toolset values
- use network, DNS, endpoints, credentials, models, or toolsets
- ingest real output or promote findings
- mutate filesystem or project files
- execute uv, Python, pip, or setup.py
- deploy

## Next Steps

1. Factory Hermes Runtime Selection Planning Gate v1
2. Approval retry/final
3. Runtime Adapter candidate
4. Real Result Ingestion
5. JEFE Review
## Downstream Runtime Selection Planning

When Research Execution Approval blocks on missing runtime selections, it feeds Factory Hermes Runtime Selection Planning Gate v1. That downstream gate prepares candidates and a Lean decision pack, but it must not select final values or approve execution.
## Runtime Selection Decision Input

When Research Execution Approval is blocked for missing runtime selections, Runtime Selection Planning and Runtime Selection Decision may produce a concrete selection record. That record is not execution approval; a future approval retry must still verify the selected prompt, provider, model, credential ref, network host, toolset mode, run root, and final approval state.

If final execution approval is not satisfied, Approval Retry blocks and does not approve the runtime adapter.
