# Factory Hermes Build Dependency Cache Approval Gate v1

## Purpose

This gate approves a future runtime candidate for populating the governed uv cache with the missing Hermes build dependency `setuptools>=77,<83`.

## Relationship To Planning

The Planning Gate selected `uv_controlled_build_dependency_cache_prefetch` and detected locked package evidence for `setuptools==81.0.0` in `uv.lock`. Approval preserves that plan and authorizes only the next runtime boundary.

## What It Approves

- A future `Factory Hermes Build Dependency Cache Runtime Adapter v1`.
- Future network use only inside that runtime and only for controlled cache prefetch.
- Hash, URL/source, package name and version metadata capture.

## What It Does Not Approve

This gate does not cache dependencies, enable network now, download packages, execute uv, execute pip, execute Python, execute setup.py, retry materialization, retry the adapter, execute Hermes, call models, use credentials, mutate project files or deploy.

## Runtime Envelope

The runtime envelope keeps materialization offline and restricts future writes to the governed uv cache, metadata root and optional temp env root. The real Hermes python env remains read-only unless a later gate explicitly changes that boundary.

## Next Steps

1. Factory Hermes Build Dependency Cache Runtime Adapter v1
2. Factory Hermes Build Dependency Cache Verification Gate v1
3. Factory Hermes Entrypoint Materialization Runtime Retry Gate v1

## Runtime Handoff

The Runtime Adapter consumes the approved envelope and may use network only for cache prefetch. It must write metadata and keep materialization offline.
