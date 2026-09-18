# Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1 creates a planning-only path for proving a safe Hermes command shape after the execution gate correctly blocked before runtime.

This gate does not execute proof steps, execute Hermes, execute `hermes.exe`, run `--oneshot`, execute the wrapper or adapter, pass prompts, call models, use network, resolve DNS, probe endpoints, read credential values, read `.env`, enable toolsets, ingest output, promote findings, run uv, pip, Python, or setup.py, mutate source/cache/package/UI files, commit, or push.

## Inputs

- `controlled-research-runtime-execution-review-result.json`
- `controlled-research-runtime-execution-result.json`
- `runtime-selection-decision-result.json`
- Read-only source inventory metadata for Hermes, wrapper, and adapter paths.

## Result

- `status`: `safe_command_shape_proof_plan_created`
- `decision`: `hermes_safe_command_shape_proof_plan_created_for_approval`
- `proofPlanningStatus`: `plan_candidate_created`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `canProceedToSafeCommandShapeProofApproval`: `true`
- `canProceedToSafeCommandShapeProof`: `false`
- `canProceedToControlledResearchRuntimeExecution`: `false`
- `canRunResearchNow`: `false`

## Plans

- `safeCommandShapeSourceInspectionPlan`
- `safeCommandShapeCandidateSet`
- `staticCommandShapeProofPlan`
- `noDefaultsAndNoToolsetsProofPlan`
- `wrapperBoundaryCommandProofPlan`
- `nonNetworkDryRunProofPlan`
- `failClosedCommandConstructionPlan`
- `safeCommandShapeProofRiskRegister`
- `safeCommandShapeProofApprovalEnvelope`

## Candidate Set

- `direct_cli_with_explicit_verified_config`: candidate only if explicit config and no defaults are proven.
- `wrapper_managed_command_with_fail_closed_preflight`: preferred planning candidate.
- `internal_api_empty_tool_registry`: candidate only if the internal API accepts an empty tool registry.
- `non_network_dry_run_or_parse_only_probe`: candidate only if source proves a parse-only or config-validation mode.
- `direct_cli_omit_toolsets`: forbidden.
- `direct_cli_no_mcp_only`: forbidden.
- `direct_cli_no_toolsets_text_only`: forbidden.
- `modify_hermes_source_to_add_no_tool_mode`: forbidden initially.
- `keep_execution_blocked`: safe fallback.

## Next Gate

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Approval Gate v1.

Runtime execution remains blocked until a future approved proof gate proves the safe command shape and a later execution gate is explicitly approved.

The approval gate reviews this plan only. It does not execute proof, Hermes, wrapper, adapter, prompts, models, network, credentials, toolsets, ingestion, or findings.

The proof gate may still block if static source inspection cannot exclude hidden defaults, MCP/toolsets, unsafe validation order, or unsafe dry-run behavior.

The proof review gate must preserve those unresolved blockers and cannot treat them as runtime readiness.

Those unresolved blockers are carried into resolution planning as root causes.
