# Hermes Output Contract Policy Planning Gate v1

## Purpose

Plans the output contract for a future bounded Hermes `--oneshot` execution. It does not execute Hermes, send prompts, call models, enable toolsets, use network, read credentials, or treat output as findings.

## Relationship To Toolsets Policy Planning

This gate consumes Toolsets Policy Planning after toolsets remain disabled and explicit future toolsets are required. Tool output remains forbidden as findings until later ingestion and JEFE Review.

## Output Surfaces

- `stdout_final_response_plain_text`: raw candidate evidence only after future runtime and ingestion.
- `stderr_logs_or_errors`: operational/error output only.
- `usage_file_json`: usage/cost/token/model metadata only.
- `structured_json_findings`: not available unless a future schema is proven.
- `raw_stdout_as_findings`, `help_output_as_findings`, `logs_as_findings`: forbidden.
- `tool_output_as_findings`: forbidden until toolsets and ingestion review.

## Policy

Future runtime must capture bounded previews for stdout/stderr, sanitize output, record exit/timing/kill status, and keep usage-file metadata under approved `.codex-temp` paths. Output cannot become findings before Result Ingestion and JEFE Review.

## Not Authorized

No Hermes execution, `--oneshot`, prompts, output findings, toolsets, model calls, network, credentials, uv, pip, Python, setup.py, mutation or deploy.

## Next Steps

Proceed to `Factory Hermes Result Ingestion Contract Planning Gate v1`, then Timeout / Kill Switch Policy, Filesystem Mutation Policy and Research Execution Boundary Policy.

The Result Ingestion Contract Planning Gate consumes this output policy and defines the future ingestion record shape. It still does not ingest output or authorize findings.

Timeout Kill Switch Policy Planning follows Result Ingestion Contract Planning and keeps output capture bounded by hard process, idle, shutdown and preview limits before any runtime approval.
