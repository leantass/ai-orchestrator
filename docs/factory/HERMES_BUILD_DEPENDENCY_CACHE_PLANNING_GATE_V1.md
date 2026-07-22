# Factory Hermes Build Dependency Cache Planning Gate v1

## Purpose

This gate plans how JEFE could safely populate the governed uv cache with the missing Hermes build dependency `setuptools>=77,<83`.

## Relationship To Materialization JEFE Review

The previous JEFE Review approved only planning after the Materialization Runtime blocked with `blocked_network_required` under `UV_OFFLINE=1`. The failure was classified as `controlled_build_dependency_cache_miss`.

## Why Setuptools Is Missing

Hermes declares `build-system.requires = ["setuptools>=77.0,<83"]` with `build-backend = "setuptools.build_meta"`. The offline uv cache did not contain a compatible build dependency artifact, so materialization could not create the `hermes.exe` entrypoint wrapper.

## Candidate Methods

- `uv_controlled_build_dependency_cache_prefetch`: preferred future candidate. A later approved runtime may use verified uv to populate `.codex-temp/external-tools/uv/cache/` and record hashes/provenance.
- `uv_sync_project_install_temp_env_for_cache_prefetch`: candidate only, higher risk because it may involve build backend behavior in a temp env.
- `enable_network_in_materialization_runtime`: not recommended because it mixes cache and materialization.
- `pip_download_or_install_setuptools`: forbidden.
- `setup_py_install`: forbidden.
- `manual_cache_copy`: not recommended without provenance and hash controls.
- `disable_uv_offline_and_retry`: forbidden.

## Current Gate Limits

This gate does not enable network, cache dependencies, download packages, execute uv, execute pip, execute Python, execute setup.py, retry materialization, retry the adapter or execute Hermes.

## Next Steps

1. Factory Hermes Build Dependency Cache Approval Gate v1
2. Factory Hermes Build Dependency Cache Runtime Adapter v1
3. Factory Hermes Build Dependency Cache Verification Gate v1
4. Factory Hermes Entrypoint Materialization Runtime Retry Gate v1

## Approval Handoff

The Approval Gate consumes the plan candidate and can approve only a future cache runtime envelope. It still cannot cache dependencies, enable network now, execute uv or retry materialization.
