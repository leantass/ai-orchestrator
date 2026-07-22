# Factory Hermes Python Install Strategy Gate v1

## Propósito

Factory Hermes Python Install Strategy Gate v1 analiza pasivamente la superficie Python del checkout instalado de Hermes y produce una estrategia declarativa para una futura instalación Python aislada.

Este gate no instala dependencias, no crea `venv`, no ejecuta `pip`, no ejecuta `uv`, no ejecuta `setup.py`, no ejecuta Hermes y no llama modelos.

## Post-Runtime Smoke Safety

Strategy Gate smokes must not depend on the real Hermes `python-env` being absent after later runtime blocks. The Strategy guarantee is that it does not create a venv, install dependencies or authorize immediate execution by itself; any existing `python-env` after a successful retry belongs to Hermes Python Install Runtime Retry Gate v1.

## Diferencia con Install Verification

Install Verification Gate v1 verificó los artefactos existentes del install runtime y confirmó que la instalación Node quedó en estado conocido. Python quedó bloqueado como `blocked_requires_python_install_strategy`.

Python Install Strategy Gate v1 no repara ni instala. Solo decide qué estrategia futura sería gobernable para completar la parte Python sin contaminar el sistema global ni el core de JEFE.

## Superficie Python detectada

El snapshot de superficie puede registrar:

- `pyproject.toml`;
- `setup.py`;
- `setup.cfg`;
- `requirements*.txt`;
- `uv.lock`;
- `poetry.lock`;
- `Pipfile`;
- paquetes Python detectados;
- entrypoints CLI;
- scripts Python bajo `scripts/`.

Los archivos se leen como evidencia pasiva. Ningún módulo Python se importa y ningún script se ejecuta.

## `uv.lock`, `pyproject.toml` y `setup.py`

Si existen `pyproject.toml` y `uv.lock`, la estrategia preferida es `prefer_uv_lock`.

Si existe `pyproject.toml` o `setup.py` sin lock de uv, la estrategia puede caer a `prefer_venv_pip` o requerir revisión manual.

La presencia de `setup.py` produce riesgo explícito: `setup_py_present_direct_execution_forbidden`.

## Por qué no se ejecuta `setup.py`

`setup.py` puede ejecutar código arbitrario durante instalación. Por eso este gate prohíbe ejecución directa y exige un runtime futuro aislado, con allowlist y evidencia posterior.

## Por qué no se usa `pip` global

Un `pip install` global contaminaría el entorno del operador o del sistema. La única estrategia futura aceptable para pip es con entorno aislado bajo:

`.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/`

## Opciones futuras

### Estrategia uv

- verificar disponibilidad de uv en runtime futuro;
- crear entorno Python aislado;
- instalar desde `uv.lock` con aprobación futura;
- verificar no global site-packages;
- verificar no credenciales;
- verificar que Hermes sigue sin ejecutarse.

### Estrategia venv/pip

- verificar versión de Python;
- crear `venv` bajo `python-env`;
- usar solo el pip del venv;
- instalar de forma aislada con aprobación futura;
- nunca ejecutar `setup.py` directamente;
- verificar no credenciales.

## Forbidden steps

- `global pip install`;
- ejecución directa de `setup.py`;
- `install.sh` o `install.ps1`;
- lectura de `.env`;
- uso de credenciales;
- ejecución de Hermes;
- ejecución de scripts arbitrarios.

## Qué NO hace

- no instala Python dependencies;
- no ejecuta `pip`;
- no ejecuta `uv`;
- no ejecuta `poetry`;
- no crea `venv`;
- no ejecuta `setup.py`;
- no ejecuta Hermes;
- no ejecuta scripts Hermes;
- no usa credenciales;
- no llama modelos;
- no modifica `package.json` ni `package-lock.json` de JEFE;
- no ejecuta Codex;
- no crea deploy.

## Relación futura

El siguiente bloque natural es `Factory Hermes Python Install Runtime Adapter v1`, solo si Lean autoriza una instalación Python aislada. Después debe existir una nueva verificación de instalación antes de cualquier Research Runtime Adapter.

Hermes execution sigue bloqueado hasta que existan instalación completa, boundary, adapter, ingestion y JEFE Review.
