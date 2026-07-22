# Factory Implementation Status v1

| Flow stage | Status | Implemented modules | External tools involved | Pending modules | Execution allowed now | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Architecture Blueprint | done_baseline | FactoryArchitectureBlueprint | None | None | No | Stable baseline. |
| Radar | done_baseline | Radar v1 | Future GDELT/RSS/GitHub/HN | Research runtime | No | Local logic only. |
| Hermes initial governance | done_baseline | Hermes profile, adapter contract, handoff | Hermes Agent | Install/runtime/result gates | No | No Hermes execution. |
| JEFE decision / Brief / Project Contract | done_baseline | Decision, brief, contract | None | None | No | Governance only. |
| Contract persistence runtime | done_baseline | Persistence runtime adapter | None | Registry already local | Controlled `.codex-temp` only | Baseline closed. |
| Contract registry and integrity | done_local_uncommitted | Registry, Integrity | None | Commit later | No | Local uncommitted. |
| Memory pipeline | done_local_uncommitted | Admission, write approval, persistence, runtime, registry, integrity, read, context assembly, context approval | None | Commit later | Controlled `.codex-temp` runtimes only | Codex blocked. |
| Codex Task Contract Candidate | done_local_uncommitted | Candidate gate | Codex | Approval/prompt/execution gates | No | Non-executable. |
| External Tool Governance | done_local_uncommitted | Registry module and docs | All listed tools | Future install/runtime gates | No | This block. |
| Hermes source checkout audit | done_local_uncommitted | Windows-safe audit report | Hermes Agent | Install/runtime gates | No | Sparse checkout only. |
| Hermes Installation Plan Gate | done_local_uncommitted | Hermes Installation Plan Gate v1 | Hermes Agent | Runtime Boundary Contract / Install Runtime Adapter | No | Declarative plan only; no install or execution. |
| Hermes Runtime Boundary Contract | done_local_uncommitted | Hermes Runtime Boundary Contract v1 | Hermes Agent | Install Runtime Adapter / Research Runtime Adapter / Result Ingestion | No | Boundary contract only; no runtime created. |
| Hermes Install Approval Gate | done_local_uncommitted | Hermes Install Approval Gate v1 | Hermes Agent | Install Runtime Adapter / Install Verification Gate | No | Approval envelope only; no install. |
| Hermes Install Runtime Adapter | done_local_uncommitted | Hermes Install Runtime Adapter v1 | Hermes Agent | Install Verification Gate / Python Install Strategy Gate | No Hermes execution | Isolated `.codex-temp` install only. |
| Hermes Install Verification Gate | done_local_uncommitted | Hermes Install Verification Gate v1 | Hermes Agent | Python Install Strategy Gate / Research Runtime planning | No | Read-only install audit; Node verified, Python pending. |
| Hermes Python Install Strategy Gate | done_local_uncommitted | Hermes Python Install Strategy Gate v1 | Hermes Agent | Python Install Runtime Adapter / post-install verification | No | Declarative Python strategy only; no pip, uv, venv, setup.py or Hermes execution. |
| Hermes Python Install Approval Gate | done_local_uncommitted | Hermes Python Install Approval Gate v1 | Hermes Agent | Python Install Runtime Adapter / Python Install Verification Gate | No | Approval receipt and Python install envelope only; no pip, uv, venv, setup.py or Hermes execution. |
| Hermes Python Install Runtime Adapter | done_local_uncommitted | Hermes Python Install Runtime Adapter v1 | Hermes Agent | Python Install Verification Gate | No Hermes execution | Controlled `uv.lock` install under `.codex-temp` only; blocks if `uv` is unavailable. |
| External Tool Provisioning + UV Profile | done_local_uncommitted | External Tool Provisioning Gate v1, UV Tool Profile v1 | uv, Hermes Agent | UV Provisioning Approval/Runtime / UV Verification | No | Plan candidate only; uv missing from PATH based on prior runtime and no install or execution in this block. |
| External Tool Provisioning Approval Gate | done_local_uncommitted | External Tool Provisioning Approval Gate v1 | uv, Hermes Agent | UV Provisioning Runtime Adapter / UV Verification | No | Approval receipt and envelope only; no install, execution or download. |
| UV Provisioning Runtime Adapter | done_local_uncommitted | UV Provisioning Runtime Adapter v1 | uv | UV Provisioning Verification Gate | uv --version only | Local `.codex-temp` provisioning or PATH verification only; no project ops and no Hermes retry. |
| UV Provisioning Verification Gate | done_local_uncommitted | UV Provisioning Verification Gate v1 | uv | Hermes Python Install Runtime Retry Gate | uv --version only | Verifies manifest/result/checksum/executable containment; no download, extraction or Hermes retry. |
| Hermes Python Install Runtime Retry Gate | done_local_uncommitted | Hermes Python Install Runtime Retry Gate v1 | Hermes Agent, uv | Hermes Python Install Verification Gate | uv venv / uv sync only | Retries the blocked Python install with verified local uv; repaired for idempotent post-success replays; no pip, setup.py, Hermes execution or scripts. |
| Hermes Python Install Verification Gate | done_local_uncommitted | Hermes Python Install Verification Gate v1 | Hermes Agent, uv | Hermes Python Install JEFE Review Gate | No | Verifies Python env artifacts read-only; no uv sync, pip, Python, setup.py or Hermes execution. |
| Hermes Python Install JEFE Review Gate | done_local_uncommitted | Hermes Python Install JEFE Review Gate v1 | Hermes Agent | Hermes Research Runtime Planning Gate | No | Approves readiness for planning only; no direct Hermes execution. |
| Hermes Research Runtime Planning Gate | done_local_uncommitted | Hermes Research Runtime Planning Gate v1 | Hermes Agent | Hermes Research Runtime Boundary Contract | No | Plans future research runtime; no Hermes execution, network, credentials or model calls. |
| Hermes Research Runtime Interface Selection Gate | done_local_uncommitted | Hermes Research Runtime Interface Selection Gate v1 | Hermes Agent | Hermes Research Runtime Boundary Contract | No | Selects `pyproject-console-script-1` for boundary design only; no Hermes execution. |
| Hermes Research Runtime Boundary Contract | done_local_uncommitted | Hermes Research Runtime Boundary Contract v1 | Hermes Agent | Hermes Research Runtime Approval Gate | No | Defines future runtime boundaries only; no runtime creation or execution. |
| Hermes Research Runtime Approval Gate | done_local_uncommitted | Hermes Research Runtime Approval Gate v1 | Hermes Agent | Hermes Research Runtime Adapter | No | Approves only future adapter candidate under boundary; no runtime creation or direct execution. |
| Hermes Research Runtime Adapter | done_local_uncommitted | Hermes Research Runtime Adapter v1 | Hermes Agent | Hermes Research Result Ingestion Gate | `hermes.exe --help` only | First bounded help probe; writes controlled result if wrapper is missing; no research prompt, network, credentials or model calls. |
| Hermes Research Result Ingestion Gate | done_local_uncommitted | Hermes Research Result Ingestion Gate v1 | Hermes Agent | Hermes Research JEFE Review Gate | No | Ingests Adapter V1 `blocked_executable_missing` as controlled adapter block; does not repair or execute Hermes. |
| Hermes Research JEFE Review Gate | done_local_uncommitted | Hermes Research JEFE Review Gate v1 | Hermes Agent | Hermes Entrypoint Materialization Planning Gate | No | Approves planning only for missing entrypoint wrapper; no materialization, adapter retry or Hermes execution. |
| Hermes Entrypoint Materialization Planning Gate | done_local_uncommitted | Hermes Entrypoint Materialization Planning Gate v1 | Hermes Agent, uv | Hermes Entrypoint Materialization Approval Gate | No | Plans `uv sync` without `--no-install-project` as future candidate only; no uv execution or project install. |
| Hermes Entrypoint Materialization Approval Gate | done_local_uncommitted | Hermes Entrypoint Materialization Approval Gate v1 | Hermes Agent, uv | Hermes Entrypoint Materialization Runtime Adapter | No | Approves future runtime envelope only; setup.py risk accepted only for bounded uv sync project install, no materialization now. |
| Hermes Entrypoint Materialization Runtime Adapter | failed_controlled | Hermes Entrypoint Materialization Runtime Adapter v1 | Hermes Agent, uv | Runtime repair or cache approval before verification | uv sync only | Executed only approved offline `uv sync --locked --no-dev --project`; blocked because `setuptools>=77,<83` was not available in uv cache and network remained disabled. |
| Hermes Entrypoint Materialization Result Ingestion Gate | done_local_uncommitted | Hermes Entrypoint Materialization Result Ingestion Gate v1 | Hermes Agent, uv | Hermes Entrypoint Materialization JEFE Review Gate | No | Classifies runtime `blocked_network_required` as controlled build dependency cache miss; no retry, network or cache provisioning. |
| Hermes Entrypoint Materialization JEFE Review Gate | done_local_uncommitted | Hermes Entrypoint Materialization JEFE Review Gate v1 | Hermes Agent, uv | Hermes Build Dependency Cache Planning Gate | No | Approves only build dependency cache planning for `setuptools>=77,<83`; no cache, network, materialization retry or Hermes execution. |
| Hermes Build Dependency Cache Planning Gate | done_local_uncommitted | Hermes Build Dependency Cache Planning Gate v1 | Hermes Agent, uv | Hermes Build Dependency Cache Approval Gate | No | Plans governed cache prefetch for `setuptools>=77,<83`; no cache, network, uv execution, materialization retry or Hermes execution. |
| Hermes Build Dependency Cache Approval Gate | done_local_uncommitted | Hermes Build Dependency Cache Approval Gate v1 | Hermes Agent, uv | Hermes Build Dependency Cache Runtime Adapter | No | Approves future cache runtime envelope only; no cache, network now, uv execution, materialization retry or Hermes execution. |
| Hermes Build Dependency Cache Runtime Adapter | done_local_uncommitted | Hermes Build Dependency Cache Runtime Adapter v1 | Hermes Agent, uv | Hermes Build Dependency Cache Verification Gate | uv sync temp env only | Executes approved cache prefetch only against temp env/cache scope; no materialization retry or Hermes execution. |
| Codex Task Contract Approval | not_started | None | Codex | Approval gate | No | No executable task. |
| Codex Prompt Assembly / Approval | not_started | None | Codex | Prompt gates | No | No final prompt. |
| Codex Execution Adapter | not_started | None | Codex | Runtime adapter | No | Codex blocked. |
| Result Ingestion / JEFE Review / Correction Loop | not_started | None | Codex, test/security tools | Ingestion/review/correction gates | No | Planned. |
| Test gates | not_started | None | Vitest, MSW, Playwright | Test governance | No | Not installed by this block. |
| Security gates | not_started | None | Gitleaks, Semgrep, CodeQL, Opengrep, Trivy, Scorecard | Security governance | No | Not executed. |
| Performance / accessibility / prompt eval | not_started | None | Lighthouse CI, axe-core, Promptfoo | Eval gates | No | Planned. |
| Release / staging / production / analytics | not_started | None | GitHub Actions, Sentry, Umami, PostHog, Stripe, Mercado Pago | Release gates | No | Planned. |
## Hermes Build Dependency Cache Verification Gate v1

Status: done_local_uncommitted.

The gate verifies the successful controlled build dependency cache runtime result for Hermes, records warning-only source metadata artifacts, and prepares a planning-only envelope for a future Entrypoint Materialization Runtime Retry Gate. It does not execute uv, pip, Python, setup.py, Hermes, network, models, or credentials.
## Hermes Entrypoint Materialization Runtime Retry Gate v1

Status: done_local_uncommitted if the retry smoke succeeds, or controlled_failure if offline UV cannot materialize `hermes.exe` from the verified cache. The gate is allowed to execute only offline `uv sync`; it does not execute Hermes, pip, Python direct, setup.py direct, network, models, credentials, or the research adapter.

## Cache Verification Smoke Post-Materialization Safe Micro-Repair

Status: done_local_uncommitted.

The Cache Verification smoke accepts `python-env/Scripts/hermes.exe` as present only when the Entrypoint Materialization Runtime Retry result proves a successful approved materialization and no Hermes execution. This repair does not reexecute retry, uv, pip, Python, setup.py, Hermes, network, credentials, or model calls.
## Hermes Entrypoint Materialization Verification Gate v1

Status: done_local_uncommitted if smoke passes. The gate verifies `hermes.exe` read-only, records hash/size, and prepares a Research Runtime Adapter Retry envelope without executing Hermes, uv, pip, Python, setup.py, network, credentials, or models.

## Hermes Research Runtime Adapter Retry Gate v1

Status: done_local_uncommitted if smoke passes. The gate executes only the verified `hermes.exe --help` probe with `shell:false`, captures sanitized previews, and routes the result to Research Result Ingestion Gate v2. It does not execute research, uv, pip, direct Python, setup.py, Hermes scripts, network, credentials, models, materialization, or cache runtime.

## Hermes Research Result Ingestion Gate v2

Status: done_local_uncommitted if smoke passes. The gate ingests the adapter retry help probe as operational health evidence only and routes to Research JEFE Review Gate v2. It does not rerun Hermes, adapter retry, uv, pip, Python, setup.py, network, credentials or model calls.

## Hermes Research JEFE Review Gate v2

Status: done_local_uncommitted if smoke passes. The gate approves only Research Execution Planning from the ingested help probe. It does not execute Hermes, pass prompts, use network, credentials, models, uv, pip, Python or setup.py.

## Hermes Research Execution Planning Gate v1

Status: done_local_uncommitted if smoke passes. The gate creates execution method candidates from JEFE Review v2, help output, and bounded source inspection. Current evidence requires manual command review; no Hermes execution, prompt passing, network, credentials, models, uv, pip, Python or setup.py are authorized.
## Hermes Research Execution Policy Chain Planning Gate v1

Status: done_local_uncommitted.

The gate produces a planning receipt and policy chain plan for future governed Hermes `--oneshot` research execution. It keeps research execution, prompts, network, credentials, model calls, uv, pip, Python, and setup.py blocked now.
## Hermes Prompt Policy Planning Gate v1

Status: done_local_uncommitted.

The gate creates prompt rules, a candidate-only prompt with SHA256, a planning receipt, and a plan candidate. It keeps prompt sending, Hermes execution, research, network, credentials, model calls, uv, pip, Python, and setup.py blocked now.
## Hermes Model Provider Policy Planning Gate v1

Status: done_local_uncommitted.

The gate creates provider candidates, explicit provider/model rules, a planning receipt, and a plan candidate. It keeps provider execution selection, env secret reads, credentials, model calls, network, prompts, Hermes, uv, pip, Python, and setup.py blocked now.
## Hermes Credentials Policy Planning Gate v1

Status: done_local_uncommitted.

The gate creates credential references, credential rules, masking policy, kill switch policy, a planning receipt, and a plan candidate. It keeps credential values, `.env`, env reads, network, model calls, prompts, Hermes, uv, pip, Python, and setup.py blocked now.
## Hermes Network Policy Planning Gate v1

- Status: `done_local_uncommitted` pending commit.
- Result: `network_policy_plan_created`.
- Decision: `hermes_network_policy_plan_created`.
- Allows proceeding only to Toolsets Policy Planning.
- Does not authorize research execution, Hermes execution, prompts, network, credentials or model calls.
## Hermes Toolsets Policy Planning Gate v1

- Status: `done_local_uncommitted` pending commit.
- Result: `toolsets_policy_plan_created`.
- Decision: `hermes_toolsets_policy_plan_created`.
- Allows proceeding only to Output Contract Policy Planning.
- Does not authorize research execution, Hermes execution, prompts, network, credentials, model calls or toolset enablement.
## Hermes Output Contract Policy Planning Gate v1

- Status: `done_local_uncommitted` pending commit.
- Result: `output_contract_policy_plan_created`.
- Decision: `hermes_output_contract_policy_plan_created`.
- Allows proceeding only to Result Ingestion Contract Planning.
- Does not authorize research execution, Hermes execution, prompts, network, credentials, model calls, toolsets or findings use.

## Hermes Result Ingestion Contract Planning Gate v1

- Status: `done_local_uncommitted` pending commit.
- Result: `result_ingestion_contract_plan_created`.
- Decision: `hermes_result_ingestion_contract_plan_created`.
- Allows proceeding only to Timeout Kill Switch Policy Planning.
- Does not authorize real output ingestion, findings promotion, Hermes execution, prompts, network, DNS, credentials, model calls, toolsets, uv, pip, Python or setup.py.

## Hermes Timeout Kill Switch Policy Planning Gate v1

- Status: `done_local_uncommitted` pending commit.
- Result: `timeout_kill_switch_policy_plan_created`.
- Decision: `hermes_timeout_kill_switch_policy_plan_created`.
- Allows proceeding only to Filesystem Mutation Policy Planning.
- Does not authorize runtime timeout configuration, kill-switch mutation, retry, research execution, Hermes, prompts, network, credentials, models, toolsets, uv, pip, Python or setup.py.

## Hermes Filesystem Mutation Policy Planning Gate v1

- Status: `done_local_uncommitted` pending commit.
- Result: `filesystem_mutation_policy_plan_created`.
- Decision: `hermes_filesystem_mutation_policy_plan_created`.
- Allows proceeding only to Research Execution Boundary Planning.
- Does not authorize filesystem mutation, project writes, runtime write configuration, Hermes, prompts, network, credentials, models, toolsets, uv, pip, Python or setup.py.
## Hermes Research Execution Boundary Planning Gate v1

Status: done_local_uncommitted if smoke and validation pass.

Notes: consolidates the prior research execution policy chain into a boundary candidate for future approval evaluation only. No Hermes execution, prompt passing, network, credentials, model calls, toolsets, output ingestion, or filesystem runtime mutation are authorized by this gate.
## Hermes Research Execution Approval Gate v1

Status: done_local_uncommitted if smoke and validation pass.

Notes: evaluates the consolidated research execution boundary and blocks execution with `not_approved` while creating runtime selection requirements and a blocker plan. No runtime adapter, Hermes execution, prompt passing, selections, network, credentials, model calls, toolsets, output ingestion, or filesystem runtime mutation are authorized.
## Hermes Runtime Selection Planning Gate v1

Status: done_local_uncommitted if smoke and validation pass.

Notes: converts approval blockers into runtime selection candidates and a Lean decision pack. No final selections, runtime adapter, Hermes execution, prompt passing, network, credentials, model calls, toolsets, run root creation, output ingestion, or filesystem runtime mutation are authorized.
## Hermes Runtime Selection Decision Gate v1

Status: done_local_uncommitted.

Recorded Lean's concrete runtime selections for approval retry only. Execution, prompt passing, network, credentials, model calls, toolsets, filesystem mutation, and run root creation remain blocked.
## Hermes Research Execution Approval Retry Gate v1

Status: done_local_uncommitted.

Validated runtime selections for approval retry and blocked execution because final execution approval is required. Runtime adapter, prompt passing, network, credentials, model calls, toolsets, filesystem mutation, and findings use remain disabled.
## Hermes Final Execution Approval Gate v1

Status: done_local_uncommitted.

Recorded final execution approval for next-gate review only. Runtime adapter and execution remain blocked pending Factory Hermes Research Runtime Adapter Approval Gate v1.
## Hermes Research Runtime Adapter Approval Gate v1

Status: done_local_uncommitted.

Evaluates adapter approval candidate and blocks when toolset disable support is unverified. No Hermes/runtime execution, network, credentials, model calls, run root creation, or toolset enablement occurs.
## Hermes Toolset Disable Verification Planning Gate v1

Status: done_local_uncommitted.

Static source planning completed. No-tools mode remains unproven, so the next step is Toolset Disable Verification Approval, not adapter retry.
## Hermes Toolset Disable Verification Approval Gate v1

Status: done_local_uncommitted.

Approval review completed conservatively. No safe toolset-disable probe shape was proven from source, so the gate blocks runtime probing and routes to Runtime Selection Revision Planning. No Hermes execution, prompt passing, model calls, network, credentials, toolsets, run-root creation, uv, Python, pip, or setup.py occurred.
## Hermes Runtime Selection Revision Planning Gate v1

Status: done_local_uncommitted.

Revision planning created after `no_toolsets_text_only` was blocked. The gate recommends Factory Hermes Wrapper No-Tool Mode Planning Gate v1 and keeps adapter approval, Hermes execution, prompt passing, model calls, network, credentials, toolsets, filesystem mutation, uv, Python, pip, and setup.py disabled.
## Hermes Wrapper No-Tool Mode Planning Gate v1

Status: done_local_uncommitted.

Wrapper planning created a non-executing plan candidate and decision pack. It does not implement wrapper code, mutate Hermes source, approve adapter retry, execute Hermes, pass prompts, call models, use network, read credentials, create run roots, enable toolsets, uv, Python, pip, or setup.py.
## Hermes Wrapper No-Tool Mode Approval Gate v1

Status: done_local_uncommitted.

Approval grants only Factory Hermes Wrapper No-Tool Mode Implementation Planning Gate v1. Wrapper implementation, wrapper execution, Hermes execution, prompt passing, model calls, network, credentials, toolsets, run-root creation, adapter approval, uv, Python, pip, and setup.py remain blocked.
## Hermes Wrapper No-Tool Mode Implementation Planning Gate v1

Status: done_local_uncommitted.

Implementation planning creates architecture, temp config, enforcement, validation, and risk plans for a future wrapper. It does not implement wrapper code, create temp config, mutate Hermes source, execute Hermes, pass prompts, use network, read credentials, call models, enable toolsets, create run roots, approve adapters, uv, Python, pip, or setup.py.
## Hermes Wrapper No-Tool Mode Implementation Approval Gate v1

Status: done_local_uncommitted.

Implementation approval grants only the next wrapper implementation gate. Wrapper execution, temp config creation now, Hermes execution, prompt passing, network, credentials, model calls, toolsets, run roots, research adapter approval, uv, Python, pip, and setup.py remain blocked.
## Hermes Wrapper No-Tool Mode Implementation Gate v1

Status: done_local_uncommitted.

Implemented code-only wrapper modules and manifests. The result can proceed to verification planning, while wrapper execution, Hermes execution, live temp config creation, prompt passing, network, credentials, model calls, toolsets, run roots, adapter approval, uv, Python, pip, and setup.py remain blocked.
## Hermes Wrapper No-Tool Mode Verification Planning Gate v1

Status: done_local_uncommitted.

Verification planning creates static safety scan, serializer, command envelope, virtual temp config, no-Hermes-execution, risk register, and approval envelope plans. It does not execute verification, wrapper code, Hermes, prompts, network, credentials, model calls, toolsets, run roots, uv, Python, pip, or setup.py.
## Hermes Wrapper No-Tool Mode Verification Approval Gate v1

Status: done_local_uncommitted.

Verification approval grants only the next wrapper verification gate. It does not execute verification, wrapper code, Hermes, live temp config, prompts, network, credentials, model calls, toolsets, run roots, adapter retry, uv, Python, pip, or setup.py.
