# Hermes Entrypoint Materialization Planning Gate v1

## Purpose

Factory Hermes Entrypoint Materialization Planning Gate v1 plans how to safely materialize the selected `hermes` console script wrapper.

It does not materialize `hermes.exe`, install the project, execute uv, Python, pip, setup.py or Hermes, retry the adapter, use network, credentials or models.

## Why `hermes.exe` Is Missing

The previous Python install used `uv sync --locked --no-install-project --no-dev --project`. That installed dependencies into the isolated env but intentionally did not install the Hermes project package, so the `project.scripts` wrapper was not generated.

## Source Inspection

Read-only source inspection found:

- `pyproject.toml`
- `uv.lock`
- `[project.scripts] hermes = "hermes_cli.main:main"`
- build backend `setuptools.build_meta`
- `setup.py` present
- python-env present

## Method Candidates

- `uv_sync_install_project_locked_existing_env`: preferred candidate for a future runtime, using verified uv and the existing env without `--no-install-project`.
- `direct_python_module_boundary_revision`: not recommended because it requires direct Python execution and boundary changes.
- `manual_wrapper_generation`: not recommended because it bypasses packaging metadata.
- `pip_install_project`: forbidden.
- `setup_py_install`: forbidden.

## Recommended Method

The preferred candidate is `uv_sync_install_project_locked_existing_env`, but only after Materialization Approval.

## Risks

Installing the local project may invoke PEP 517 build backend behavior. Because `setup.py` exists, future approval must decide whether build hooks are acceptable and how to keep writes bounded.

## Next Steps

- Factory Hermes Entrypoint Materialization Approval Gate v1.
- Factory Hermes Entrypoint Materialization Runtime Adapter v1.
- Factory Hermes Entrypoint Materialization Verification Gate v1.
- Factory Hermes Research Runtime Adapter Retry Gate v1.

## Approval Handoff

The planning result is consumed by Factory Hermes Entrypoint Materialization Approval Gate v1. That gate records human approval and build-hook risk acceptance for a future runtime envelope only; it still does not run `uv sync`, materialize `hermes.exe` or retry the research adapter.

The subsequent Runtime Adapter may run only the approved offline `uv sync --locked --no-dev --project <sourceRoot>` command under that envelope.
