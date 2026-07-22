# External Tool Governance v1

## Purpose

External Tool Governance keeps external tools outside the factory core until each tool has a profile, lifecycle state, install plan, runtime boundary, adapter plan, result ingestion path, and JEFE review.

## Rule

Downloading does not imply installing.
Installing does not imply executing.
Executing does not imply approving.
Every tool result returns to JEFE Review.
An external tool never approves its own output.

## Lifecycle

Tools move through planned, profiled, source checkout planned, source checked out, install planned, installed, runtime boundary planned, runtime ready, adapter planned, adapter ready, disabled or blocked.

## Registry And Profile

The registry lists tool identity, category, origin, lifecycle, integration mode, intended stages, capabilities, forbidden actions, current permissions, required boundaries, risk and notes.

## Source Checkout Audit

Source checkout is allowed only under controlled `.codex-temp` roots. A checkout is audit evidence only. It does not authorize install, execution or credentials.

## Install Plan

Install requires its own gate. It must explain dependency impact, filesystem scope, network requirements, rollback, and why installation is safe.

## Runtime Boundary

Runtime boundaries define filesystem, network, credential, command, timeout and output constraints before a tool can run.

Hermes Runtime Boundary Contract v1 now exists as a local uncommitted contract. It is a prerequisite for any future Hermes install/runtime adapter, but it does not install or execute Hermes.

## Install Approval

Install approval is required before an install runtime adapter can perform any dependency operation. Hermes Install Approval Gate v1 can approve only an install envelope candidate; it does not install, execute scripts, use credentials, mutate JEFE package files or approve Hermes output.

## Controlled Install Runtime

Hermes Install Runtime Adapter v1 is allowed to install only inside `.codex-temp`, using an allowlisted command with `shell: false`. It does not execute Hermes, run Hermes scripts, use credentials or mutate JEFE package files.

## Install Verification

Hermes Install Verification Gate v1 verifies install artifacts read-only before any further runtime planning. It confirms command allowlist compliance and keeps Hermes execution blocked.

## Python Install Strategy

Hermes Python Install Strategy Gate v1 is required before any Python dependency operation. It plans an isolated Python environment strategy only; it does not run `pip`, `uv`, `poetry`, `setup.py`, create a venv, execute Hermes or use credentials.

## Python Install Approval

Hermes Python Install Approval Gate v1 is required after strategy and before any Python install runtime. It can approve only a future isolated Python install envelope candidate; it does not run `uv`, `pip`, `setup.py`, create a venv, execute Hermes, run Hermes scripts, use credentials or mutate JEFE package files.

## Controlled Python Install Runtime

Hermes Python Install Runtime Adapter v1 may use only an approved `uv_lock_isolated_only` envelope and allowlisted `uv` commands with `shell:false`. It installs only under `.codex-temp`, writes manifest/result artifacts, blocks if `uv` is unavailable, and never falls back to `pip`, `setup.py`, shell, Hermes execution or credentials.

## External Tool Provisioning

External Tool Provisioning Gate v1 is now defined as a local uncommitted planning gate for external tool provisioning. It can approve a provisioning plan candidate only; it does not install, execute, download, use shell, use credentials, mutate JEFE package files or deploy.

UV Tool Profile v1 registers `uv` as a governed external tool for Hermes Python environment provisioning. Its current known status is missing from PATH based on the prior Hermes Python Install Runtime Adapter result `blocked_uv_executable_not_found`.

## External Tool Provisioning Approval

External Tool Provisioning Approval Gate v1 is now defined as a local uncommitted human approval boundary. It turns an approved provisioning plan candidate into an approval receipt and approved tool provisioning envelope for a future runtime adapter.

The approval envelope is required before any uv provisioning runtime. It still does not install, download, execute, use shell, use credentials, mutate package files or retry Hermes Python Runtime.

## UV Provisioning Runtime

UV Provisioning Runtime Adapter v1 can verify an existing `uv.exe` on PATH or download the official Windows x64 GitHub Release artifact, verify SHA256, extract `uv.exe` under `.codex-temp/external-tools/uv/`, and execute only `uv --version` with `shell:false`.

It does not perform a global install, mutate PATH, execute `uv venv`, execute `uv sync`, execute `uv run`, execute `uv pip`, run pip/Python/setup.py, execute Hermes or retry Hermes Python Runtime.

## UV Provisioning Verification

UV Provisioning Verification Gate v1 verifies the local uv manifest, provisioning result, checksum status, executable containment and `uv --version` recheck before uv can be used by a future Hermes Python Runtime retry.

This gate does not download, provision, extract, mutate PATH, execute uv project operations, run pip/Python/setup.py, execute Hermes or retry Hermes Python Runtime.

## Hermes Python Install Runtime Retry

Hermes Python Install Runtime Retry Gate v1 is the first consumer of verified local uv. It may run only `uv --version`, `uv venv` for the isolated Hermes env and locked `uv sync --no-install-project --no-dev`; it still forbids pip, direct Python, setup.py, Hermes scripts and Hermes execution.

## Hermes Python Install Verification

Hermes Python Install Verification Gate v1 verifies that verified uv was consumed to create or reuse the isolated Hermes Python env. It reads artifacts and filesystem state only, and does not run uv, pip, Python, setup.py, Hermes scripts or Hermes.

## Hermes Python Install JEFE Review

Hermes Python Install JEFE Review Gate v1 can approve the verified Python install for Research Runtime Planning only. JEFE review does not authorize direct Hermes execution, scripts, credentials, model calls or deploys.

## Hermes Research Runtime Planning

Hermes Research Runtime Planning Gate v1 creates a plan candidate only. Planning does not authorize execution, network access, model calls, credentials, scraping, deploys or project mutation.

## Hermes Research Runtime Interface Selection

Hermes Research Runtime Interface Selection Gate v1 records the selected Hermes interface candidate for future boundary design. Selection does not authorize execution of Hermes, Python, uv, scripts, network, credentials, model calls or deploys.

## Hermes Research Runtime Boundary Contract

Hermes Research Runtime Boundary Contract v1 defines the future runtime limits for the selected Hermes interface. A boundary contract is still not runtime approval and does not authorize execution, network, credentials, model calls or project mutation.

## Hermes Research Runtime Approval

Hermes Research Runtime Approval Gate v1 can approve an adapter envelope for a future runtime adapter only. The approval envelope does not authorize direct Hermes execution, runtime creation in the approval gate, network, credentials or model calls.

## Hermes Research Runtime Adapter

The first adapter execution is bounded to a help probe only: `hermes.exe --help` under the approved boundary. It is not a research task and does not authorize network, credentials, model calls or project mutation.

## Hermes Research Result Ingestion

Result ingestion classifies adapter output and controlled blocks only. It does not authorize repair, retry, entrypoint materialization, network use, credentials, model calls or Hermes execution.

## Hermes Research JEFE Review

Research JEFE Review may approve a planning envelope for entrypoint materialization. It does not authorize direct repair, runtime retry, package installation, Hermes execution, network, credentials or model calls.

## Hermes Entrypoint Materialization Planning

Materialization planning can propose a future `uv sync` project install candidate, but it does not authorize `uv sync`, package installation, wrapper generation, adapter retry, network, credentials or model calls.

## Adapter And Result Ingestion

Adapters invoke tools only after approval. Result ingestion normalizes output and sends it to JEFE Review.

## Credentials

Credentials are forbidden by default. Any future credential use requires a dedicated approval gate and secret boundary.

## CI

CI tools are governed through workflow review. CI output is evidence, not approval.

## Staging And Production

Staging, production, analytics and monetization tools require release-level approval gates.
## Hermes Entrypoint Materialization Approval Gate v1

The Hermes Entrypoint Materialization Approval Gate records explicit approval for a future bounded `uv sync --locked --no-dev --project <sourceRoot>` runtime candidate. It does not execute uv in the approval gate, does not authorize direct setup.py, pip, Python or Hermes execution, and does not permit network, credentials or model calls.

## Hermes Entrypoint Materialization Runtime Adapter v1

The Hermes Entrypoint Materialization Runtime Adapter may execute only the approved `uv sync --locked --no-dev --project <sourceRoot>` command with `shell:false`, sanitized env and `UV_OFFLINE=1`. It does not authorize `uv run`, `uv pip`, `uv venv`, direct pip/Python/setup.py, Hermes execution, network, credentials or model calls.

## Hermes Entrypoint Materialization Result Ingestion Gate v1

The result ingestion gate reads materialization artifacts and classifies controlled failures. It does not authorize network, cache provisioning, uv execution, pip/Python/setup.py, Hermes execution or adapter retry.

## Hermes Entrypoint Materialization JEFE Review Gate v1

The JEFE review gate may approve only Build Dependency Cache Planning after a controlled offline cache miss. It does not authorize dependency caching, network, uv sync, pip, Python, setup.py, materialization retry, adapter retry, Hermes execution, credentials or model calls.

## Hermes Build Dependency Cache Planning Gate v1

Cache planning can propose how a future approved runtime may populate the governed uv cache for missing build dependencies. Planning does not enable network, cache dependencies, execute uv, execute pip/Python/setup.py, retry materialization or execute Hermes.

## Hermes Build Dependency Cache Approval Gate v1

Cache approval can permit a future runtime envelope with a controlled network scope for cache prefetch only. Approval does not cache dependencies, enable network now, execute uv, execute pip/Python/setup.py, retry materialization, execute Hermes, use credentials or call models.

## Hermes Build Dependency Cache Runtime Adapter v1

The cache runtime may execute only the approved uv cache prefetch command with `shell:false`, sanitized environment and temp env isolation. It may use network only for cache prefetch and cannot materialize the Hermes entrypoint or execute Hermes.
## Hermes Build Dependency Cache Verification

External tool governance treats the Hermes build dependency cache verification as a read-only evidence gate. It may approve a future offline materialization retry envelope, but it does not authorize immediate uv execution, network use, pip, Python direct execution, setup.py direct execution, Hermes execution, credentials, model calls, project mutation, or deployment.
## Hermes Entrypoint Materialization Runtime Retry

The runtime retry is a narrow external-tool execution allowance for verified `uv sync` offline only. It can materialize `hermes.exe` into the governed Python env, but it cannot execute Hermes, use network, run uv run/uv pip/uv venv, run pip, execute Python directly, execute setup.py directly, access credentials, call models, deploy, or retry the research adapter.
## Hermes Entrypoint Materialization Verification

The verification gate does not execute the Hermes entrypoint. It inspects the materialized executable read-only and may emit an envelope for a future Research Runtime Adapter Retry Gate.

## Hermes Research Runtime Adapter Retry

The adapter retry is the only post-materialization Hermes entrypoint execution allowed by the current chain, and it is limited to `hermes.exe --help` with `shell:false`. It is not a research runtime, does not use network, credentials or models, does not run uv/pip/Python/setup.py, and routes output to Result Ingestion v2 as non-finding evidence.

## Hermes Research Result Ingestion v2

Result Ingestion v2 preserves the same boundary after a successful help probe. It may classify entrypoint health, but it cannot treat help text as research findings or authorize direct Hermes execution, network, credentials, models, uv, pip, Python, setup.py, project mutation or deploy.

## Hermes Research JEFE Review v2

JEFE Review v2 can approve only Research Execution Planning after the help probe is ingested. It does not authorize research runtime, prompt passing, model calls, network, credentials, direct Hermes execution or project mutation.

## Hermes Research Execution Planning

Research Execution Planning may classify future Hermes command candidates from approved help/source evidence, but it cannot execute Hermes, pass prompts, use network, credentials or models, run uv/pip/Python/setup.py, mutate project files or treat help output as findings.
## Hermes `--oneshot` Policy Chain Requirement

Hermes `--oneshot` is governed as a high-risk external tool execution shape. It must not be approved directly from CLI discovery or help output. Prompt passing, provider/model choice, credentials, network, toolsets, output contracts, ingestion, timeout, filesystem mutation, and execution boundary policies must be planned and approved before any runtime execution adapter can run real research.
## Prompt Planning Is Not Prompt Execution

Hermes prompt policy planning may store a governed prompt candidate for future `--oneshot` evaluation, but it does not send prompts, execute Hermes, call models, use network, use credentials, or authorize findings. Prompt execution remains blocked until the full policy chain and runtime boundary are approved.
## Model Provider Planning Is Not Model Execution

Hermes model provider policy planning may list candidate providers and expected credential reference names, but it does not read credential values, read `.env`, call models, use network, select a provider for execution, or authorize `--oneshot`.
## Credentials Planning Is Not Secret Access

Hermes credentials policy planning may list credential reference names such as provider API-key variable names, but it does not read, validate, inject, log, or use credential values. `.env` and implicit process env reads remain blocked.
## Hermes Network Policy Planning

`Factory Hermes Network Policy Planning Gate v1` is planning-only. It does not use network, approve hosts, allow wildcards, resolve DNS, test endpoints, call models, use credentials or execute Hermes. Network remains blocked until later policy, approval, boundary and runtime gates.
## Hermes Toolsets Policy Planning

`Factory Hermes Toolsets Policy Planning Gate v1` is planning-only. It does not enable web, browser, terminal, MCP, filesystem or default CLI toolsets. It also does not use network, credentials, prompts, models or Hermes execution.
## Hermes Output Contract Policy Planning

`Factory Hermes Output Contract Policy Planning Gate v1` is planning-only. It does not execute Hermes and does not convert stdout, stderr, logs, help text, usage files or tool output into findings.

## Hermes Result Ingestion Contract Planning

`Factory Hermes Result Ingestion Contract Planning Gate v1` is planning-only. It does not ingest real output, promote findings, enable toolsets, use network, resolve DNS, read credentials, call models or execute Hermes.

## Hermes Timeout Kill Switch Policy Planning

`Factory Hermes Timeout Kill Switch Policy Planning Gate v1` is planning-only. It does not configure runtime timeouts, mutate kill switches, retry research, execute Hermes, use network, resolve DNS, read credentials or call models.

## Hermes Filesystem Mutation Policy Planning

`Factory Hermes Filesystem Mutation Policy Planning Gate v1` is planning-only. It does not write runtime files, mutate project/source/python-env/cache/package files, read `.env`, execute Hermes, use network or call models.
## Research Execution Boundary Planning

Factory Hermes Research Execution Boundary Planning consolidates prompt, provider, credentials, network, toolsets, output, ingestion, timeout, and filesystem policies before execution approval. It creates a boundary candidate for review only and does not approve or perform Hermes execution, prompt passing, tool use, network, credential access, model calls, or filesystem mutation.
## Research Execution Approval Blocking

Factory Hermes Research Execution Approval evaluates the consolidated boundary and blocks execution when runtime selections are missing. It does not approve a runtime adapter, execute Hermes, pass prompts, use network, read credentials, enable toolsets, call models, ingest output, or mutate filesystem state.
## Runtime Selection Planning

Factory Hermes Runtime Selection Planning prepares candidates for prompt, provider, model, credential ref, network hosts, toolsets, run root, and final approval. It does not select final values, approve runtime, execute Hermes, call models, use network, read credentials, or mutate filesystem state.
## Hermes Runtime Selection Decision

Runtime Selection Decision can record concrete future values such as provider, model, credential ref, host, toolset mode, and run root. It cannot execute Hermes, send prompts, call models, use network, read credentials, enable toolsets, create run roots, ingest output, or promote findings.

Research Execution Approval Retry can validate those selections, but it still cannot approve execution or runtime adapter while final execution approval is missing.

Final Execution Approval can record Lean's final approval for selected runtime values, but it cannot approve or execute the adapter directly. Network, credentials, prompt passing, model calls, toolsets, run root creation, and findings remain gated.

Research Runtime Adapter Approval may approve only a fully verified adapter candidate. If source/policy evidence does not prove a selected toolset mode, it must block and route to a verification planning gate.

Toolset Disable Verification Planning is read-only planning. It cannot validate by executing Hermes or approve the adapter.

Toolset Disable Verification Approval is also non-executing. It may approve a future controlled probe only when source proves a safe command shape; otherwise it must block and route to runtime selection revision. It cannot execute Hermes, send prompts, use network, read credentials, enable toolsets, create run roots, or approve the research runtime adapter.

Runtime Selection Revision Planning is the governance path for invalid or unsupported runtime selections. It creates a manual decision pack and may recommend wrapper planning, but it cannot approve adapter execution or use external tools.

Wrapper No-Tool Mode Planning is non-executing design governance. It can map wrapper strategies and decision packs, but cannot implement wrapper code, mutate Hermes source, pass prompts, use network, read credentials, enable toolsets, or approve the research runtime adapter.

Wrapper No-Tool Mode Approval is also non-executing. It may approve only the implementation planning gate for a wrapper strategy; wrapper implementation, wrapper execution, Hermes execution, prompt passing, network, credentials, model calls, toolsets, run-root creation, and research runtime adapter approval remain forbidden.

Wrapper No-Tool Mode Implementation Planning remains planning-only. It can define wrapper architecture, temp config, enforcement, validation, and risks, but cannot create those runtime artifacts or execute Hermes.

Wrapper No-Tool Mode Implementation Approval can approve only wrapper implementation work in the next gate. It cannot execute wrapper code, create temp config now, execute Hermes, use external services, or approve research runtime adapter execution.

Wrapper No-Tool Mode Implementation may create inert wrapper modules and serializers. It must still avoid command execution, live temp config writes, network, credentials, model calls, toolset enablement, run-root creation, Hermes source mutation, and research adapter approval.

Wrapper No-Tool Mode Verification Planning may only plan verification. It cannot execute verification, execute the wrapper, create live temp config, execute Hermes, pass prompts, use network, read credentials, call models, enable toolsets, create run roots, ingest findings, or approve a research runtime adapter.

Wrapper No-Tool Mode Verification Approval may authorize only the following wrapper verification gate. It cannot perform verification itself, run the wrapper against Hermes, create live temp config, execute Hermes, use prompts, network, credentials, models, toolsets, or approve research runtime adapter retry.
