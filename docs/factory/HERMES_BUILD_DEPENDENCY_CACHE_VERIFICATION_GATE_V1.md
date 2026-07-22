# Hermes Build Dependency Cache Verification Gate v1

## Purpose

Factory Hermes Build Dependency Cache Verification Gate v1 reviews the completed build dependency cache runtime result for Hermes and decides whether the cached build dependency evidence is ready for a later Entrypoint Materialization Runtime Retry Gate.

This gate is read-only. It verifies artifacts, metadata, boundaries, and source immutability evidence. It does not retry materialization.

## Inputs

- `.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-runtime-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-runtime-manifest.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-metadata/build-dependency-cache-record.json`
- Related planning, approval, materialization, and UV verification artifacts as read-only context.

## Verified Condition

The verified dependency is `setuptools` locked to `81.0.0`, satisfying the missing build dependency range `setuptools>=77,<83`.

The runtime must have completed with:

- `status: success`
- `decision: hermes_build_dependency_cache_prefetch_completed`
- `cacheStatus: prefetched`
- `tempEnvStatus: created_or_updated`
- `metadataStatus: written`
- `networkScope: cache_prefetch_only`

## Boundary

This gate confirms:

- Hermes was not executed.
- Hermes scripts were not executed.
- pip was not executed.
- Python direct was not executed.
- setup.py direct was not executed.
- credentials were not used.
- model calls were not made.
- materialization was not retried.
- the real `python-env/Scripts/hermes.exe` is still absent before the future retry.

## Source Mutation Policy

Key source files must remain hash-stable:

- `pyproject.toml`
- `uv.lock`
- `setup.py`

`hermes_agent.egg-info` is treated as a warning-only metadata artifact from build backend behavior. A nested `.codex-temp` under source is also warning-only when key file hashes remain unchanged and it is known to come from a repaired prior runtime attempt.

Blocking source mutations include `dist`, `build`, `.venv`, changed key hashes, or materialization output in the real Hermes Python environment.

## Output

The gate writes:

`.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-verification-result.json`

The result may be:

- `verified`
- `warning_verified`
- `blocked`

The approved decision is:

`hermes_build_dependency_cache_verified_for_materialization_retry`

## Retry Envelope

When verified, the gate produces an `approvedEntrypointMaterializationRuntimeRetryEnvelope` for a future gate only:

`Factory Hermes Entrypoint Materialization Runtime Retry Gate v1`

The envelope requires:

- offline UV use in the future retry;
- no network during materialization retry;
- no Hermes execution;
- no pip;
- no direct Python;
- no direct setup.py.

## Not Authorized Here

- retry materialization now;
- execute uv now;
- execute uv sync now;
- execute Python now;
- execute pip now;
- execute setup.py now;
- execute Hermes now;
- use network now;
- access credentials;
- call models;
- mutate project files;
- deploy.

## Next Step

Proceed to `Factory Hermes Entrypoint Materialization Runtime Retry Gate v1` only after this verification result is accepted. This gate does not itself perform that retry.
## Runtime Retry Handoff

When this gate returns `verified` or `warning_verified`, the only authorized next runtime is `Factory Hermes Entrypoint Materialization Runtime Retry Gate v1`. That retry must use the verified cache with `UV_OFFLINE=1` and must not execute Hermes, use network, pip, Python direct execution, or setup.py direct execution.

## Post-Materialization Regression Safety

Before the Runtime Retry Gate, `python-env/Scripts/hermes.exe` is expected to be missing. After a successful Runtime Retry Gate, that executable is expected to be present.

Cache Verification smokes accept that later workspace state only when `entrypoint-materialization-runtime-retry-result.json` proves `status: success`, `decision: hermes_entrypoint_materialized_after_cache_verified_retry`, `executableStatusAfter: present`, and `hermesExecutionStatus: not_executed`.

This does not change the historical Cache Verification decision; it only keeps regression checks valid after approved downstream materialization.
