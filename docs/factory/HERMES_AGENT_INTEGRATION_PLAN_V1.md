# Hermes Agent Integration Plan v1

## Current State

Hermes Agent is an external tool. It has been source-audited with a Windows-safe sparse checkout under `.codex-temp`.

## Audited Source

- Remote: `https://github.com/NousResearch/hermes-agent.git`
- Audited checkout path: `.codex-temp/external-tools/hermes-agent/source`
- Audited HEAD: `75b300f13af40878ad6482b2ecb39c55c86679fe`
- Retry remote HEAD observed: `3e7c563ddda1a6d244edfa5005fc2c7b11c62480`

## Why External Tool

Hermes is not JEFE core. It must be governed by an adapter, runtime boundary, result ingestion and JEFE review before it can affect factory decisions.

## Already Exists

- Hermes External Tool Profile.
- JefeHermesAdapter Contract.
- RadarToHermesHandoff.
- Windows-safe source checkout audit.

## Missing

- Hermes Runtime Boundary.
- Hermes Research Request Runtime Adapter.
- Hermes Result Ingestion.
- JEFE Evidence Review.

## Installation Plan Gate v1

Factory Hermes Installation Plan Gate v1 is now created as a local uncommitted gate. It interprets the audited source checkout and produces a declarative future installation plan only.

- Install is still not allowed.
- Execution is still not allowed.
- Credentials are still not allowed.
- JEFE package files are not mutated.
- The audited checkout HEAD is pinned unless a new remote HEAD audit is approved.

## Runtime Boundary Contract v1

Factory Hermes Runtime Boundary Contract v1 is now created as a local uncommitted contract. It defines future filesystem, network, environment, credential, execution, logging, kill switch, adapter and result boundaries before any install/runtime adapter can be approved.

- Install remains not allowed.
- Execution remains not allowed.
- Scripts remain not allowed.
- Credentials remain not allowed.
- Runtime integration remains not allowed.

## Install Approval Gate v1

Factory Hermes Install Approval Gate v1 is now created as a local uncommitted gate. It can produce an approval receipt and approved install envelope for a future controlled install runtime candidate, scoped to the audited Hermes HEAD only.

- Install runtime is still not executed.
- Hermes execution is still not permitted.
- Scripts remain not permitted.
- Credentials remain not permitted.

## Install Runtime Adapter v1

Factory Hermes Install Runtime Adapter v1 is now created as a local uncommitted runtime adapter. It may materialize the audited source into an isolated `.codex-temp` install root and run only `npm ci --ignore-scripts --no-audit --no-fund` inside the copied source when a lockfile exists.

- Hermes execution remains not permitted.
- Hermes scripts remain not permitted.
- Python install remains blocked in v1 pending a Python Install Strategy Gate.
- JEFE package files remain protected.

## Install Verification Gate v1

Factory Hermes Install Verification Gate v1 is now created as a local uncommitted read-only verifier. Node install is verified, Python strategy remains pending, and Hermes execution remains forbidden.

## Python Install Strategy Gate v1

Factory Hermes Python Install Strategy Gate v1 is now created as a local uncommitted planning gate. It inspects Python surfaces passively and produces a declarative strategy for a future isolated Python install.

- Python install is still not executed.
- `pip`, `uv`, `poetry`, `setup.py`, venv creation and Hermes execution remain blocked.
- Next step: Python Install Runtime Adapter only if Lean authorizes it explicitly.

## Python Install Approval Gate v1

Factory Hermes Python Install Approval Gate v1 is now created as a local uncommitted approval gate. It turns the Python strategy into an approval receipt and approved Python install envelope for a future isolated runtime candidate.

- Python install runtime is still not executed.
- `uv`, `pip`, `setup.py`, venv creation and Hermes execution remain blocked.
- Hermes execution remains not permitted.
- Next step: Hermes Python Install Runtime Adapter only if Lean authorizes controlled Python installation.

## Python Install Runtime Adapter v1

Factory Hermes Python Install Runtime Adapter v1 is now created as a local uncommitted controlled runtime adapter. It can use only an approved `uv_lock_isolated_only` envelope and allowlisted `uv` commands under `.codex-temp`.

- Python install may complete only inside `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/`.
- If `uv` is unavailable, the runtime blocks without fallback to `pip`, `setup.py`, shell, PowerShell or cmd.exe.
- Hermes execution remains not permitted.
- Next step after success: Factory Hermes Python Install Verification Gate v1.

## UV Provisioning Profile v1

Factory External Tool Provisioning Gate v1 and UV Tool Profile v1 are now created as local uncommitted planning artifacts. They model how JEFE would approve uv provisioning in a future block after the Hermes Python runtime correctly blocked with `blocked_uv_executable_not_found`.

- uv is not installed by this gate.
- uv is not executed by this gate.
- Hermes Python Runtime is not retried by this gate.
- Next step: UV Provisioning Approval/Runtime, then verification, before any Hermes Python Runtime retry.

## UV Provisioning Approval Gate v1

Factory External Tool Provisioning Approval Gate v1 is now created as a local uncommitted approval boundary. It creates an approval receipt and approved uv provisioning envelope for a future runtime candidate only.

- uv remains not installed.
- uv remains not executed.
- No binary download is authorized.
- Hermes Python Runtime must wait for UV Runtime and UV Verification.

## UV Provisioning Runtime Adapter v1

UV Provisioning Runtime Adapter v1 is now the authorized step that may provision `uv` locally under `.codex-temp/external-tools/uv/` or verify an existing PATH uv with `uv --version` only.

## Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1

Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1 creates a planning-only candidate for a Factory-owned no-tool provider-direct adapter, a mock-only runtime, and shared runtime contracts. It keeps Hermes CLI blocked and does not implement adapters, execute runtimes, pass prompts, read credentials, call models, use network, ingest output, or promote findings.

## Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Approval Gate v1

Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Approval Gate v1 reviews the planning candidate and can approve only the next code-only implementation gate. It still does not implement adapters, execute runtimes, pass prompts, read credentials, call models, use network, ingest output, promote findings, or unblock Hermes CLI.

## Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Gate v1

Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Gate v1 implements only code-only/non-executing shared contracts, provider-direct adapter core, and mock runtime core. It keeps Hermes CLI blocked and does not execute runtime, research, prompts, credentials, network, model calls, output ingestion, or findings.

## Hermes Controlled Research Runtime Alternate Safe Runtime Verification Planning Gate v1

Factory Hermes Controlled Research Runtime Alternate Safe Runtime Verification Planning Gate v1 plans verification of those code-only modules and records stale regression assertions caused by older smokes expecting the provider adapter not to exist. It does not execute verification, runtime, research, Hermes, prompts, credentials, network, model calls, output ingestion, or findings.

## Hermes Controlled Research Runtime Alternate Safe Runtime Verification Approval Gate v1

Factory Hermes Controlled Research Runtime Alternate Safe Runtime Verification Approval Gate v1 approves only the next verification gate. It accepts stale regression assertions as compatibility work, not runtime permission, and keeps runtime, research, Hermes, prompts, credentials, process env, network, model calls, output ingestion, and findings blocked.

## Hermes Controlled Research Runtime Alternate Safe Runtime Verification Gate v1

Factory Hermes Controlled Research Runtime Alternate Safe Runtime Verification Gate v1 runs code-only/static verification with allowed smokes and read-only safety scans. It verifies the contracts, provider-direct adapter core, mock runtime core, and stale regression compatibility while keeping runtime, research, Hermes, prompts, credentials, process env, network, model calls, output ingestion, and findings blocked.

- No `uv venv`, `uv sync`, `uv run` or `uv pip`.
- No pip, Python or setup.py.
- Hermes remains blocked until UV Provisioning Verification Gate v1 passes.

## UV Provisioning Verification Gate v1

UV Provisioning Verification Gate v1 is now the required read-only verification step before any Hermes Python Runtime retry. It verifies uv artifacts and rechecks only `uv --version`; Hermes execution remains blocked.

## Hermes Python Install Runtime Retry Gate v1

Factory Hermes Python Install Runtime Retry Gate v1 is now the controlled retry after UV Provisioning Verification Gate v1. It may run only verified local `uv --version`, `uv venv` for the isolated Hermes Python env and `uv sync --locked --no-install-project --no-dev --project <sourceRoot>`.

- No `uv run`, `uv pip`, pip, direct Python, setup.py or Hermes execution.
- Python artifacts are written under `.codex-temp/external-tools/hermes-agent/install/75b300f/`.
- Next step after success: Factory Hermes Python Install Verification Gate v1.

## Hermes Python Install Verification Gate v1

Factory Hermes Python Install Verification Gate v1 is now the read-only verifier after Runtime Retry. It verifies the Python env, manifest/result artifacts and UV verification without running uv, pip, Python, setup.py or Hermes.

- Next gate: Factory Hermes Python Install JEFE Review Gate v1.
- Research Runtime planning remains future work.

## Hermes Python Install JEFE Review Gate v1

Factory Hermes Python Install JEFE Review Gate v1 reviews the verified Python install and approves only readiness for Factory Hermes Research Runtime Planning Gate v1. It does not authorize direct Hermes execution.

## Hermes Research Runtime Planning Gate v1

Factory Hermes Research Runtime Planning Gate v1 plans a future controlled research runtime from the JEFE Review readiness envelope. It inspects source interfaces read-only and does not execute Hermes, use network, credentials or models.

- Next gate: Factory Hermes Research Runtime Boundary Contract v1.

## Hermes Research Runtime Interface Selection Gate v1

Factory Hermes Research Runtime Interface Selection Gate v1 resolves the Planning Gate manual selection by recording Lean/JEFE selection of `pyproject-console-script-1` (`hermes = "hermes_cli.main:main"`) for boundary design only.

- Next gate: Factory Hermes Research Runtime Boundary Contract v1.
- Hermes execution remains forbidden.

## Hermes Research Runtime Boundary Contract v1

Factory Hermes Research Runtime Boundary Contract v1 defines filesystem, command, network, credential, model, IO and safety boundaries for the selected `hermes` interface. It still does not create or approve a runtime.

- Next gate: Factory Hermes Research Runtime Approval Gate v1.

## Hermes Research Runtime Approval Gate v1

Factory Hermes Research Runtime Approval Gate v1 approves only a future adapter candidate under the Boundary Contract. It does not create a runtime or execute Hermes.

- Next gate: Factory Hermes Research Runtime Adapter v1.

## Hermes Research Runtime Adapter v1

Factory Hermes Research Runtime Adapter v1 performs only the first bounded help probe for the approved `hermes` interface: `hermes.exe --help` with `shell:false`, sanitized output and no research prompt, network, credentials or model calls.

- Next gate: Factory Hermes Research Result Ingestion Gate v1.

## Hermes Research Result Ingestion Gate v1

Factory Hermes Research Result Ingestion Gate v1 ingests Adapter V1 output. A `blocked_executable_missing` adapter result is classified as a controlled adapter block, not as research findings.

- Next gate: Factory Hermes Research JEFE Review Gate v1.

## Hermes Research JEFE Review Gate v1

Factory Hermes Research JEFE Review Gate v1 reviews the controlled adapter block and approves only Entrypoint Materialization Planning. It does not materialize `hermes.exe`, retry the adapter or execute Hermes.

- Next gate: Factory Hermes Entrypoint Materialization Planning Gate v1.

## Hermes Entrypoint Materialization Planning Gate v1

Factory Hermes Entrypoint Materialization Planning Gate v1 inspects `pyproject.toml` read-only and creates a plan candidate for generating the `hermes.exe` wrapper in a future approved runtime. It does not run uv sync or install the project.

- Next gate: Factory Hermes Entrypoint Materialization Approval Gate v1.

## Hermes Entrypoint Materialization Approval Gate v1

Factory Hermes Entrypoint Materialization Approval Gate v1 approves only a future Runtime Adapter candidate for `uv sync --locked --no-dev --project <sourceRoot>` in the existing verified env. It records setup.py/build-backend risk acceptance and still does not materialize, execute uv, retry the adapter or execute Hermes.

- Next gate: Factory Hermes Entrypoint Materialization Runtime Adapter v1.

## Hermes Entrypoint Materialization Runtime Adapter v1

Factory Hermes Entrypoint Materialization Runtime Adapter v1 executes only the approved offline `uv sync --locked --no-dev --project <sourceRoot>` command with `shell:false` and `UV_PROJECT_ENVIRONMENT` pointing to the existing python-env. It aims to materialize `python-env/Scripts/hermes.exe` and writes manifest/result artifacts only.

- Next gate: Factory Hermes Entrypoint Materialization Verification Gate v1.

## Hermes Entrypoint Materialization Result Ingestion Gate v1

Factory Hermes Entrypoint Materialization Result Ingestion Gate v1 ingests the controlled offline cache miss from the runtime and classifies it as `controlled_build_dependency_cache_miss`. It does not re-run uv, enable network, cache dependencies or retry the adapter.

- Next gate: Factory Hermes Entrypoint Materialization JEFE Review Gate v1.

## Hermes Entrypoint Materialization JEFE Review Gate v1

Factory Hermes Entrypoint Materialization JEFE Review Gate v1 reviews the controlled build dependency cache miss for `setuptools>=77,<83` and approves only Build Dependency Cache Planning. It does not cache dependencies, enable network, retry materialization, retry the adapter or execute Hermes.

- Next gate: Factory Hermes Build Dependency Cache Planning Gate v1.

## Hermes Build Dependency Cache Planning Gate v1

Factory Hermes Build Dependency Cache Planning Gate v1 creates a candidate plan for satisfying `setuptools>=77,<83` in the governed uv cache. It keeps materialization offline and does not cache dependencies, enable network, execute uv or retry materialization.

- Next gate: Factory Hermes Build Dependency Cache Approval Gate v1.

## Hermes Build Dependency Cache Approval Gate v1

Factory Hermes Build Dependency Cache Approval Gate v1 approves only a future cache runtime candidate for controlled prefetch of `setuptools>=77,<83`. It does not cache dependencies, enable network now, execute uv or retry materialization.

- Next gate: Factory Hermes Build Dependency Cache Runtime Adapter v1.

## Hermes Build Dependency Cache Runtime Adapter v1

Factory Hermes Build Dependency Cache Runtime Adapter v1 executes only the approved uv cache prefetch command against an isolated temp env and governed uv cache. Network scope is `cache_prefetch_only`; materialization remains offline and is not retried here.

- Next gate: Factory Hermes Build Dependency Cache Verification Gate v1.

## Decision

Source checkout audit is allowed and completed.
Install is not allowed.
Execution is not allowed.
Credentials are not allowed.
Runtime integration is not allowed.

## Recommended Next Block

Run Factory Hermes Python Install Verification Gate v1 before any Hermes research runtime planning or Hermes execution.
## Hermes Build Dependency Cache Verification Gate v1

After the Build Dependency Cache Runtime Adapter completes, JEFE verifies the cache evidence in a read-only gate before any materialization retry. The verification confirms the controlled cache prefetch for `setuptools==81.0.0`, preserves the no-Hermes/no-pip/no-Python-direct boundary, and emits an envelope only for `Factory Hermes Entrypoint Materialization Runtime Retry Gate v1`.
## Hermes Entrypoint Materialization Runtime Retry Gate v1

After Build Dependency Cache Verification, JEFE may run the Entrypoint Materialization Runtime Retry Gate. The retry executes only verified `uv sync --locked --no-dev --project <sourceRoot>` with `UV_OFFLINE=1` against the existing Hermes Python env and cache. Its next step is Entrypoint Materialization Verification, not Hermes execution or research adapter retry.
## Hermes Entrypoint Materialization Verification Gate v1

After Runtime Retry materializes `hermes.exe`, JEFE verifies it read-only before any Research Runtime Adapter Retry. The verification records executable size/hash and emits a retry envelope only for the next gate; it does not execute Hermes.

## Hermes Research Runtime Adapter Retry Gate v1

After Entrypoint Materialization Verification, JEFE may run only the bounded `hermes.exe --help` probe with `shell:false`. The retry captures sanitized previews and routes the result to Research Result Ingestion Gate v2. It does not execute research prompts, use network, credentials or models, run uv/pip/Python/setup.py, or treat help output as findings.

## Hermes Research Result Ingestion Gate v2

Factory Hermes Research Result Ingestion Gate v2 consumes the adapter retry result read-only and classifies successful `--help` output as operational health evidence only. It does not execute Hermes, rerun the retry, use network, credentials or models, or treat help output as research findings.

- Next gate: Factory Hermes Research JEFE Review Gate v2.

## Hermes Research JEFE Review Gate v2

Factory Hermes Research JEFE Review Gate v2 reviews the ingested help probe and approves only Research Execution Planning. It does not authorize research runtime, prompts, network, credentials, models or direct Hermes execution.

- Next gate: Factory Hermes Research Execution Planning Gate v1.

## Hermes Research Execution Planning Gate v1

Factory Hermes Research Execution Planning Gate v1 inspects the approved help-probe evidence and source hints read-only to identify future research execution method candidates. Current Hermes evidence requires manual command review before any Research Execution Approval Gate because `--oneshot` implies prompt/model/provider behavior and no safe offline research command is proven.

- Next gate: manual command review, then Factory Hermes Research Execution Approval Gate v1 if a bounded command contract is selected.
## Hermes Research Execution Policy Chain Planning Gate v1

After Research Execution Planning ended in `manual_review_required`, the deep source review recommended `KEEP_BLOCKED_UNTIL_POLICY_CHAIN`. The Policy Chain Planning Gate creates the required policy sequence for future bounded `hermes --oneshot` evaluation and advances only to Factory Hermes Prompt Policy Planning Gate v1. It does not authorize prompts, Hermes execution, network, credentials, model calls, or findings use.
## Hermes Prompt Policy Planning Gate v1

Prompt Policy Planning follows the Research Execution Policy Chain Planning result. It creates a candidate-only prompt plan for future bounded `hermes.exe --oneshot "<PROMPT>"`, but it does not send prompts or authorize Hermes execution. The next required gate is Factory Hermes Model Provider Policy Planning Gate v1.
## Hermes Model Provider Policy Planning Gate v1

Model Provider Policy Planning follows Prompt Policy Planning. It records provider/model candidates and forbids implicit env/config provider or model defaults. It does not select a provider for execution, read credentials, use network, or call models. The next gate is Factory Hermes Credentials Policy Planning Gate v1.
## Hermes Credentials Policy Planning Gate v1

Credentials Policy Planning follows Model Provider Policy Planning. It records credential reference names only and keeps `.env`, env secret values, credential use, network, model calls, prompts, and Hermes execution blocked. The next gate is Factory Hermes Network Policy Planning Gate v1.
## Hermes Network Policy Planning Gate v1

- Status: `done_local_uncommitted`.
- Runs after Credentials Policy Planning.
- Plans network surfaces, provider network candidates, exact-host future requirements, no-wildcard rules, toolset network dependency and kill switches.
- Does not use network, DNS, endpoints, credentials, prompts, models, uv, pip, Python, setup.py or Hermes.
- Next gate: `Factory Hermes Toolsets Policy Planning Gate v1`.
## Hermes Toolsets Policy Planning Gate v1

- Status: `done_local_uncommitted`.
- Runs after Network Policy Planning.
- Plans web/browser/terminal/filesystem/MCP/default toolset handling for future bounded `--oneshot`.
- Does not enable toolsets, use network, call models, pass prompts, read credentials, or execute Hermes.
- Next gate: `Factory Hermes Output Contract Policy Planning Gate v1`.
## Hermes Output Contract Policy Planning Gate v1

- Status: `done_local_uncommitted`.
- Runs after Toolsets Policy Planning.
- Plans stdout/stderr/usage-file capture, sanitization, truncation and promotion boundaries.
- Does not execute Hermes or convert output into findings.
- Next gate: `Factory Hermes Result Ingestion Contract Planning Gate v1`.

## Hermes Result Ingestion Contract Planning Gate v1

- Status: `done_local_uncommitted`.
- Runs after Output Contract Policy Planning.
- Plans future ingestion surfaces, candidate-finding rules and record shape for bounded `--oneshot` output.
- Does not ingest real output or promote findings.
- Next gate: `Factory Hermes Timeout Kill Switch Policy Planning Gate v1`.

## Hermes Timeout Kill Switch Policy Planning Gate v1

- Status: `done_local_uncommitted`.
- Runs after Result Ingestion Contract Planning.
- Plans timeout ceilings, kill-switch requirements, no-retry policy and abort reporting shape.
- Does not configure runtime timeouts or mutate kill switches.
- Next gate: `Factory Hermes Filesystem Mutation Policy Planning Gate v1`.

## Hermes Filesystem Mutation Policy Planning Gate v1

- Status: `done_local_uncommitted`.
- Runs after Timeout Kill Switch Policy Planning.
- Plans future `.codex-temp` run-root writes, read containment, forbidden project/source/env/package paths and artifact shapes.
- Does not configure runtime writes or mutate files.
- Next gate: `Factory Hermes Research Execution Boundary Planning Gate v1`.
## Hermes Research Execution Boundary Planning Gate v1

Research Execution Boundary Planning follows Filesystem Mutation Policy Planning and consolidates the prompt, model provider, credentials, network, toolsets, output, result ingestion, timeout, and filesystem policies into a single future boundary candidate. The next gate is Factory Hermes Research Execution Approval Gate v1. This planning gate does not execute Hermes, pass prompts, enable toolsets, use network, read credentials, or ingest findings.
## Hermes Research Execution Approval Gate v1

Research Execution Approval follows Boundary Planning. The expected v1 result is `hermes_research_execution_approval_blocked_missing_runtime_selections`, because prompt, provider, model, credentials, network hosts, toolsets, run root, and final execution approval remain unresolved. Next: Factory Hermes Runtime Selection Planning Gate v1.
## Hermes Runtime Selection Planning Gate v1

Runtime Selection Planning follows the blocked Research Execution Approval result. It prepares candidates and a Lean decision pack, but does not select final prompt/provider/model/credential/host/toolset/run-root values. Next: Factory Hermes Runtime Selection Decision Gate v1.
## Runtime Selection Decision Gate v1

Runtime Selection Decision records Lean's first controlled selections: prompt candidate, `openai`, `gpt-4o-mini`, `OPENAI_API_KEY` ref, `api.openai.com`, `no_toolsets_text_only`, and the planned `.codex-temp` run root. It does not execute Hermes, send prompts, use network, read credentials, create the run root, or approve the adapter. Next gate: Factory Hermes Research Execution Approval Retry Gate v1.
## Research Execution Approval Retry Gate v1

Approval Retry validates the concrete Runtime Selection Decision and blocks because final execution approval is still missing. It allows only the Final Execution Approval Gate as the next step; runtime adapter and execution remain forbidden.
## Final Execution Approval Gate v1

Final Execution Approval records Lean's approval for the first controlled Hermes run, but only for the Research Runtime Adapter Approval Gate. It does not approve the adapter, create run roots, pass prompts, use network, read credentials, call models, or execute Hermes.
## Research Runtime Adapter Approval Gate v1

Runtime Adapter Approval evaluates Final Execution Approval and the runtime selection snapshot. If `no_toolsets_text_only` is not source-verified as a safe Hermes CLI mode, it blocks and routes to Toolset Disable Verification Planning before any adapter runtime.
## Toolset Disable Verification Planning Gate v1

Toolset Disable Verification Planning maps Hermes `--toolsets` source behavior and confirms `no_toolsets_text_only` is not yet a proven CLI mode. It plans a future approval/probe path before adapter approval retry.
## Toolset Disable Verification Approval Gate v1

Toolset Disable Verification Approval reviews the planned probe and source evidence. The conservative v1 decision blocks because no safe probe command is proven to validate disabled toolsets without prompt, provider/model, network, or credential risk. Next gate: Factory Hermes Runtime Selection Revision Planning Gate v1.
## Runtime Selection Revision Planning Gate v1

Runtime Selection Revision Planning follows the blocked toolset-disable approval. It does not choose a new final runtime; it prepares Lean options and recommends wrapper-enforced no-tool mode planning while research adapter approval remains blocked.
## Wrapper No-Tool Mode Planning Gate v1

Wrapper No-Tool Mode Planning maps non-executing wrapper strategies for a future text-only Hermes path. It creates a plan candidate for approval, but does not implement a wrapper, modify Hermes source, or execute Hermes.
## Wrapper No-Tool Mode Approval Gate v1

Wrapper No-Tool Mode Approval reviews the planning candidate and may approve only the next implementation planning gate. It does not implement wrapper code, execute Hermes or a wrapper, pass prompts, use network, read credentials, call models, enable toolsets, create run roots, approve the research runtime adapter, ingest output, or promote findings.
## Wrapper No-Tool Mode Implementation Planning Gate v1

Wrapper No-Tool Mode Implementation Planning defines the future wrapper architecture, temp config plan, no-tool enforcement plan, validation plan, and risk register. It still does not implement wrapper code, create temp config, execute Hermes, pass prompts, use network, read credentials, call models, enable toolsets, create run roots, or approve the research runtime adapter.
## Wrapper No-Tool Mode Implementation Approval Gate v1

Wrapper No-Tool Mode Implementation Approval reviews the implementation plan and can approve only wrapper code generation in the next gate. It still forbids wrapper execution, temp config creation now, Hermes execution, prompts, network, credentials, model calls, toolsets, run roots, adapter approval, and findings.
## Wrapper No-Tool Mode Implementation Gate v1

Wrapper No-Tool Mode Implementation creates inert wrapper modules, serializers, validators, virtual config builders, and blocked command envelope builders. It does not execute wrapper code against Hermes or create live runtime artifacts. Next: Wrapper No-Tool Mode Verification Planning.
## Wrapper No-Tool Mode Verification Planning Gate v1

Wrapper No-Tool Mode Verification Planning defines how the inert wrapper will be verified through static safety scan, serializer checks, command envelope checks, virtual temp config checks, and no-Hermes-execution checks. It does not run verification, execute the wrapper, create temp config, execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, or approve the research runtime adapter. Next: Wrapper No-Tool Mode Verification Approval.
## Wrapper No-Tool Mode Verification Approval Gate v1

Wrapper No-Tool Mode Verification Approval reviews the verification plan and can approve only the next wrapper verification gate. It still forbids verification execution in this gate, wrapper-against-Hermes execution, Hermes execution, temp config creation, prompts, network, credentials, model calls, toolsets, adapter approval, ingestion, and findings.
## Wrapper No-Tool Mode Verification Gate v1

Wrapper No-Tool Mode Verification performs code-only verification of the inert wrapper. It can scan wrapper source and exercise pure serializers, validators, virtual config builders, and non-executable command envelope builders in memory. It still forbids Hermes execution, wrapper-against-Hermes execution, live temp config creation, prompt passing, network, credentials, model calls, toolsets, adapter approval, ingestion, and findings. Next: Wrapper No-Tool Mode Verification Review.
## Wrapper No-Tool Mode Verification Review Gate v1

Wrapper No-Tool Mode Verification Review accepts the code-only wrapper verification only for adapter approval retry. It keeps runtime adapter execution, Hermes execution, prompts, models, network, credentials, toolsets, temp config creation, research execution, and findings blocked.
## Research Runtime Adapter Approval Retry Gate v1

Research Runtime Adapter Approval Retry uses the accepted wrapper review to grant only the next Factory Hermes Research Runtime Adapter Gate v1. The retry preserves the wrapper code-only boundary and does not execute the adapter, wrapper, Hermes, `hermes.exe`, `--oneshot`, prompts, network, models, credentials, toolsets, run roots, or research.
## Research Runtime Adapter Gate v1

Research Runtime Adapter prepares a non-executable adapter boundary using `wrapper_temp_config_no_toolsets`. It builds wrapper integration, safety, limitations, risk, and research execution approval retry envelopes, but does not execute the adapter, wrapper, Hermes, `hermes.exe`, `--oneshot`, prompts, network, models, credentials, toolsets, run roots, research, or findings.
## Research Execution Approval Retry Gate v1

Research Execution Approval Retry reviews the prepared non-executable adapter and may allow only the final Research Execution Approval Gate. It still forbids research, adapter, wrapper, Hermes, prompt, model, network, credential, toolset, run-root, ingestion, and findings execution.
## Research Execution Approval Gate v1

Research Execution Approval grants only Controlled Research Runtime Planning using the prepared adapter and wrapper boundary evidence. It does not execute research, adapter, wrapper, Hermes, prompts, models, network, credentials, toolsets, temp config, run roots, ingestion, or findings.
## Controlled Research Runtime Planning Gate v1

Controlled Research Runtime Planning creates the first controlled runtime plan and policies for temp config, run root, credentials, prompt, model/network, toolsets, timeout/kill switch, and output ingestion. It still forbids research, adapter, wrapper, Hermes, prompt, model, network, credential, toolset, temp config, run-root, ingestion, and findings execution.

## Controlled Research Runtime Approval Gate v1

Controlled Research Runtime Approval reviews the controlled runtime plan and may approve only the next Preparation Gate. It does not prepare runtime, create live temp config, create run root, execute research, execute adapter or wrapper, execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Research Runtime Preparation Gate v1

Controlled Research Runtime Preparation creates non-executable runtime artifacts for review: manifest, virtual temp config candidate, run root path validation, credential reference boundary, prompt reference policy, model/network allowlist policy, toolset proof requirements, timeout/kill switch envelope, output ingestion contract, risk register, and review envelope. It does not create live config, create a run root, execute Hermes, pass prompts, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Research Runtime Preparation Review Gate v1

Controlled Research Runtime Preparation Review accepts prepared non-executable artifacts only for Live Artifact Planning. It does not create live temp config, create live run root, execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Research Runtime Live Artifact Planning Gate v1

Controlled Research Runtime Live Artifact Planning plans future live temp config and run-root creation boundaries, filesystem allowlists, redaction, safety checks, and pre-runtime verification. It does not create live artifacts, execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Research Runtime Live Artifact Approval Gate v1

Controlled Research Runtime Live Artifact Approval reviews the live artifact plan and may approve only the future creation gate. It does not create live artifacts, execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Research Runtime Live Artifact Creation Gate v1

Controlled Research Runtime Live Artifact Creation writes the approved temp config and run-root artifacts under `.codex-temp` for verification only. It does not execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Research Runtime Live Artifact Verification Gate v1

Controlled Research Runtime Live Artifact Verification reads the live temp config and run-root manifest under `.codex-temp`, verifies the prior planning, approval, and creation chain, and performs read-only containment, symlink, secret, env dump, command, runtime safety, and inventory checks. It can proceed only to Live Artifact Verification Review; runtime execution remains blocked.
## Controlled Runtime Live Artifact Verification Review

Factory Hermes Controlled Research Runtime Live Artifact Verification Review Gate v1 is the next safety review after live artifact verification. It can allow only the controlled runtime execution planning gate; it cannot execute Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Controlled Runtime Execution Planning

Factory Hermes Controlled Research Runtime Execution Planning Gate v1 creates the non-runnable future execution plan and approval envelope. It plans command, prompt, credential, model/network, toolset-disable proof, timeout/kill switch, and output ingestion controls while preserving every runtime block.

## Controlled Runtime Execution Approval

Factory Hermes Controlled Research Runtime Execution Approval Gate v1 reviews the execution plan and can permit only the final execution gate. It keeps immediate runtime, prompt, model, network, credential, toolset, ingestion, and findings actions blocked.

## Controlled Runtime Execution Gate

Factory Hermes Controlled Research Runtime Execution Gate v1 performs final preflight and blocks before runtime unless the safe wrapper command shape is proven. The current implementation writes a blocked-before-runtime execution result when that proof is missing.

## Controlled Runtime Execution Review

Factory Hermes Controlled Research Runtime Execution Review Gate v1 accepts the blocked-before-runtime result as correct fail-closed behavior and enables only safe command shape proof planning.

## Controlled Runtime Safe Command Shape Proof Planning

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1 creates the planning artifact for a future proof approval gate. It selects `wrapper_temp_config_no_toolsets` as the preferred strategy, builds candidate/proof/fail-closed/risk plans, and keeps proof execution, runtime execution, Hermes, wrapper, adapter, prompts, models, network, credentials, toolsets, ingestion, and findings blocked.

## Controlled Runtime Safe Command Shape Proof Approval

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Approval Gate v1 reviews the planning artifact and may approve only the future proof gate. It does not perform proof or runtime execution, and it keeps Hermes, wrapper, adapter, prompts, models, network, credentials, toolsets, output ingestion, and findings blocked.

## Controlled Runtime Safe Command Shape Proof

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Gate v1 inspects source read-only and evaluates command-shape candidates. If no-defaults/no-toolsets, validation ordering, wrapper command proof, or safe dry-run preconditions remain unknown, it blocks and routes to proof review without executing Hermes or research.

## Controlled Runtime Safe Command Shape Proof Review

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Review Gate v1 accepts the blocked proof when fail-closed evidence is intact and routes only to Resolution Planning. It does not retry dry-run, execute Hermes, or approve runtime execution.

## Controlled Runtime Safe Command Shape Resolution Planning

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Planning Gate v1 recommends a Factory-owned command renderer plus fail-closed wrapper command builder as a future path. It only plans; implementation, proof retry, and runtime execution remain blocked.

## Controlled Runtime Safe Command Shape Resolution Approval

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Approval Gate v1 reviews that plan and may allow only Implementation Planning. It does not implement renderer or wrapper builder and does not approve proof retry or runtime execution.

## Controlled Runtime Safe Command Shape Resolution Implementation Planning

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Planning Gate v1 creates the planning-only implementation candidate for the Factory-owned command renderer, fail-closed wrapper command builder, source CLI contract, redacted command envelope, no-tool proof dependency, fail-closed rules, verification strategy, and proof retry chain. It does not implement renderer or wrapper builder and keeps proof retry, runtime execution, Hermes, prompts, models, network, credentials, toolsets, ingestion, and findings blocked.

## Controlled Runtime Safe Command Shape Resolution Implementation Approval

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Approval Gate v1 reviews the implementation plan and may allow only the code-only implementation gate. It does not implement renderer or wrapper builder and keeps proof retry, runtime execution, Hermes, prompts, models, network, credentials, toolsets, ingestion, and findings blocked.

## Controlled Runtime Safe Command Shape Resolution Implementation

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Gate v1 implements the Factory-owned command renderer and fail-closed wrapper command builder as code-only, non-executing components. It also records source CLI contract, redacted envelope, no-tool proof dependency, fail-closed rules, integration, safety manifest, and verification-planning envelope. Safe command shape is still not proven; proof retry and runtime execution remain blocked.

## Controlled Runtime Safe Command Shape Resolution Verification Planning

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Planning Gate v1 creates the verification plan candidate for the renderer, wrapper builder, source CLI contract model, redacted envelope, no-tool proof dependency, fail-closed rules, integration, safety scan, smoke regression, and proof retry readiness. It does not execute verification, proof retry, dry-run retry, Hermes, wrapper, adapter, research, prompts, models, network, credentials, toolsets, ingestion, or findings.

## Controlled Runtime Safe Command Shape Resolution Verification Approval

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Approval Gate v1 reviews the verification plan and may allow only the future Verification Gate v1. It does not execute verification, proof retry, dry-run retry, Hermes, wrapper, adapter, research, prompts, models, network, credentials, toolsets, ingestion, or findings.

## Controlled Runtime Safe Command Shape Resolution Verification

Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Gate v1 executes only code-level verification of the Factory-owned renderer, fail-closed wrapper builder, implementation result, static safety scans, smokes, regressions, typecheck, build, and diff check. It does not execute Hermes, proof retry, dry-run retry, wrapper against Hermes, adapter, research, prompts, models, network, credentials, toolsets, ingestion, or findings. Safe command shape remains unproven for runtime; proof retry planning is the next gated step.

## Controlled Runtime Safe Command Shape Proof Retry Planning

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Planning Gate v1 plans a future proof retry using the verified renderer and wrapper builder. It does not execute proof retry, dry-run retry, Hermes, wrapper, adapter, research, prompts, models, network, credentials, toolsets, ingestion, or findings.

## Controlled Runtime Safe Command Shape Proof Retry Approval

Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Approval Gate v1 reviews the retry plan and may allow only the future Proof Retry Gate v1. It does not execute proof retry, dry-run retry, Hermes, wrapper, adapter, research, prompts, models, network, credentials, toolsets, ingestion, or findings.
## Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Gate v1

- Status: `safe_command_shape_proof_retry_blocked`.
- Decision: `hermes_safe_command_shape_proof_retry_blocked_no_safe_command_shape`.
- The proof retry ran code-only/static and produced a review envelope while keeping Hermes runtime, research, adapter, credentials, `.env`, prompts, models, network, toolsets, output ingestion, and findings blocked.
- The next permitted step is `Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Review Gate v1`.
## Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Review Gate v1

- Status: `safe_command_shape_proof_retry_review_completed`.
- Decision: `hermes_safe_command_shape_proof_retry_review_accepted_blocked_no_safe_command_shape`.
- The review accepts the blocked proof retry outcome and keeps Hermes runtime, research, credentials, prompts, models, network, toolsets, output ingestion, and findings blocked.
- Allowed next paths are keep-blocked decision or alternate safe runtime resolution planning.
## Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Planning Gate v1

- Status: `alternate_safe_runtime_resolution_plan_created`.
- Decision: `hermes_cli_blocked_alternate_safe_runtime_resolution_plan_created_for_approval`.
- Selected strategy: `factory_owned_no_tool_model_provider_direct_research_adapter`.
- This is planning only; no adapter, runtime, research, credentials, prompts, models, network, output ingestion, or findings are enabled.
## Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Approval Gate v1

- Status: `alternate_safe_runtime_resolution_approval_granted`.
- Decision: `hermes_cli_blocked_alternate_safe_runtime_resolution_approved_for_implementation_planning`.
- Scope: approval for implementation planning only; no adapter/runtime/research/provider execution is enabled.
## Factory Hermes Controlled Research Runtime Mock E2E Planning Gate v1

- Status: implemented as a planning-only gate.
- Result artifact: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-mock-e2e-planning-result.json`.
- The gate plans a future mock-only E2E path and approval envelope using verified contracts and verified mock runtime.
- It does not execute mock E2E, provider runtime, research, Hermes, prompts, models, network, credentials, output ingestion, or findings.
- Next gate: Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1.
## Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1

- Status: implemented as approval-only.
- Result artifact: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-mock-e2e-approval-result.json`.
- The gate reviews the mock E2E plan and creates an execution gate envelope only for the next mock-only execution gate.
- It does not execute mock E2E, provider runtime, research, Hermes, prompts, models, network, credentials, output ingestion, or findings.
- Next gate: Factory Hermes Controlled Research Runtime Mock E2E Execution Gate v1.
## Factory Hermes Controlled Research Runtime Mock E2E Execution Gate v1

- Status: implemented as mock-only local execution.
- Result artifact: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-mock-e2e-execution-result.json`.
- Mock artifacts: `.codex-temp/external-tools/hermes-agent/install/75b300f/mock-e2e/`.
- The gate executes only the verified local mock adapter and creates deterministic mock output for review.
- Provider runtime, real research, Hermes, prompts to providers, models, network, credentials, output ingestion, and findings remain blocked.
- Next gate: Factory Hermes Controlled Research Runtime Mock E2E Review Gate v1.
## Factory Hermes Controlled Research Runtime Mock E2E Review Gate v1

- Status: implemented as review-only.
- Result artifact: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-mock-e2e-review-result.json`.
- The gate reviews mock-only execution artifacts and may allow provider runtime planning only.
- Provider runtime execution, real research, Hermes, network, credentials, output ingestion, and findings remain blocked.
- Next gate: Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1.
## Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1

- Status: implemented as provider runtime planning-only.
- Result artifact: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-provider-runtime-planning-result.json`.
- Plans provider `openai`, model `gpt-4o-mini`, credential ref `OPENAI_API_KEY`, and host `api.openai.com`.
- Provider execution, credentials, network, model calls, output ingestion, and findings remain blocked.
## Factory Hermes Controlled Research Runtime Provider Runtime Approval Gate v1

- Status: implemented as approval-only.
- Result artifact: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-provider-runtime-approval-result.json`.
- Allows only provider runtime execution planning; provider execution, credentials, network, models, output ingestion, and findings remain blocked.
## Provider Runtime Execution Planning Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Execution Planning Gate v1 now creates the first provider-direct execution plan candidate for approval only. It preserves Hermes CLI blocked and keeps provider execution, credentials, process.env, network, DNS, model calls, output ingestion and findings disabled now.
## Provider Runtime Execution Approval Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Execution Approval Gate v1 now reviews the provider runtime execution plan and creates an execution gate envelope. It is approval-only: no provider runtime, prompt-to-provider, credentials, process.env, network, DNS, model calls, output ingestion, findings or Hermes execution occur in this gate.
## Provider Runtime Execution Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Execution Gate v1 is the first controlled provider-direct execution gate. It may read `process.env.OPENAI_API_KEY` once inside the runtime CJS and make exactly one no-tool request to `api.openai.com` with `gpt-4o-mini`; output ingestion and findings remain blocked pending provider runtime review.
## Provider Runtime Review Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Review Gate v1 now reviews the first provider-direct output as failed-for-review due to invalid contract output. It accepts the failure as safe for retry planning only; no second provider call, network, process.env, credentials, output ingestion or findings are allowed.
## Provider Runtime Retry Planning Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Retry Planning Gate v1 now plans a second provider-direct attempt after invalid output contract failure. It is planning-only: no second provider call, network, process.env, credentials, prompt-to-provider, output ingestion or findings.
## Provider Runtime Retry Approval Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Retry Approval Gate v1 now approves the retry plan for the next retry execution gate only. It performs no second provider call, provider runtime execution, real research, Hermes execution, prompt send, model call, network/DNS use, process.env or credential read, tools/functions/tool_choice/MCP use, output ingestion or findings promotion.
## Provider Runtime Retry Execution Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Retry Execution Gate v1 now performs the one approved provider-direct retry call and writes retry runtime artifacts under `.codex-temp`. Hermes CLI remains blocked; output ingestion and findings remain blocked pending retry review.
## Provider Runtime Retry Review Gate v1

Factory Hermes Controlled Research Runtime Provider Runtime Retry Review Gate v1 now reviews the valid retry output and permits output ingestion planning only. It does not ingest output, promote findings, call providers, read credentials, use network or unblock Hermes.
## Output Ingestion Planning Gate v1

Factory Hermes Controlled Research Runtime Output Ingestion Planning Gate v1 plans future normalized candidate output ingestion from the reviewed retry output. It does not create the candidate, execute ingestion, or enable findings.
## Output Ingestion Approval Gate v1

Factory Hermes Controlled Research Runtime Output Ingestion Approval Gate v1 approves the planning result for the next execution gate only. It still does not create candidate artifacts or findings.
