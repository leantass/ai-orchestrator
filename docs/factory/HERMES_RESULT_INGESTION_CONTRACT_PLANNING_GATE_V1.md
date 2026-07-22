# Hermes Result Ingestion Contract Planning Gate v1

## Purpose

Plans how a future bounded Hermes `--oneshot` execution result may be ingested. It consumes Output Contract Policy Planning and defines ingestion surfaces, candidate-finding rules, and the future ingestion record shape.

## Relationship To Output Contract Policy Planning

Output Contract Policy Planning says stdout is raw candidate evidence, stderr is operational only, and usage-file JSON is metadata only. This gate turns that into a future ingestion contract while keeping output unusable as findings.

## Ingestion Surfaces

- `stdout_plain_text_raw_candidate`: ingestible later as raw candidate evidence only.
- `stderr_operational`: diagnostics, warnings and sanitized logs only.
- `usage_file_metadata`: tokens, cost, model, provider, api_calls and duration metadata only.
- `runtime_status`: exitCode, timedOut, killed, signal, durationMs and truncation.
- `tool_output`: not ingestible until toolsets policy and runtime evidence exist.
- `help_output` and `logs_debug_trace`: operational only.

## Finding Candidate Rules

There are no automatic findings. Future ingestion must classify every record, sanitize secrets, preserve evidence refs, and leave confidence/finding usability to JEFE Review. Failed runs may become operational records, never findings.

## Ingestion Record Shape

Future records must include run identity, prompt hash, provider/model references, approved toolset metadata, bounded sanitized previews, usage metadata, classification, normalized outcome, evidence refs, warnings and policy violations. Records must not include credential values, full env, unapproved full output, hidden chain of thought or secret values.

## Not Authorized

No Hermes execution, `--oneshot`, prompt sending, real output ingestion, findings promotion, memory/brief/context writes, toolset enablement, network, DNS, endpoint tests, credentials, model calls, uv, pip, Python, setup.py, mutation or deploy.

## Next Steps

Proceed to `Factory Hermes Timeout Kill Switch Policy Planning Gate v1`, then Filesystem Mutation Policy, Research Execution Boundary, Runtime, real Result Ingestion and JEFE Review.

The Timeout Kill Switch Policy Planning Gate consumes this contract and plans execution control limits before any filesystem, boundary, approval or runtime gate.
