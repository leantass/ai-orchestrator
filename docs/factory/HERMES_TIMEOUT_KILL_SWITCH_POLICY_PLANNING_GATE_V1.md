# Hermes Timeout Kill Switch Policy Planning Gate v1

## Purpose

Plans timeout, kill-switch, no-retry and abort-reporting policy for a future bounded Hermes `--oneshot` execution.

## Relationship To Result Ingestion Contract Planning

Result Ingestion Contract Planning defines how a future run result may be ingested. This gate defines the execution control limits that future runtime and ingestion records must report before any research approval can be considered.

## Timeout Policy

- Process timeout default: `120000` ms.
- Process timeout max: `300000` ms.
- Startup timeout default: `30000` ms.
- Output idle timeout default: `60000` ms as a future candidate.
- Shutdown grace default: `5000` ms, then kill.
- Stdout/stderr previews remain capped at `12000` bytes.
- Future max captured output is capped at `1048576` bytes.

## Kill Switch Policy

The plan requires global research, Hermes tool, provider, credentials, network, toolsets and emergency-stop kill switches. Runtime adapters cannot disable kill switches; only approval and boundary gates can define effective policy.

## Retry Policy

Automatic retry is forbidden for initial bounded research. Retry after timeout or failure requires result ingestion and JEFE Review. Provider fallback, network expansion, prompt mutation and toolset expansion are forbidden.

## Abort Reporting Shape

Future runtime results must report timeout refs, timeout values, timedOut/killed flags, kill reason/signal, kill switch status/checks, emergency-stop status, retry status, process exit data, duration and output truncation.

## Not Authorized

No Hermes execution, `--oneshot`, prompt sending, real timeout configuration, real kill-switch mutation, retry, output ingestion, findings promotion, network, DNS, endpoints, credentials, model calls, toolsets, uv, pip, Python, setup.py, mutation or deploy.

## Next Steps

Proceed to `Factory Hermes Filesystem Mutation Policy Planning Gate v1`, then Research Execution Boundary, Approval and Runtime.

The Filesystem Mutation Policy Planning Gate consumes this timeout/kill-switch policy and plans future read/write containment before any boundary or runtime is approved.
## Boundary Planning Use

Research Execution Boundary Planning consumes this timeout and kill switch policy as one required input. The boundary candidate preserves hard timeout, no infinite timeout, shutdown grace, no automatic retry, and required kill switches, but does not configure a live runtime or mutate any kill switch state.
