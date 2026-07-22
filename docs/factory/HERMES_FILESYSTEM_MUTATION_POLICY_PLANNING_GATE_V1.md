# Hermes Filesystem Mutation Policy Planning Gate v1

## Purpose

Plans future filesystem read/write boundaries for bounded Hermes `--oneshot` research execution.

## Relationship To Timeout Kill Switch Policy Planning

Timeout Kill Switch Policy Planning defines execution control limits. This gate defines where a future runtime may read or write artifacts after those limits exist, while keeping filesystem mutation disabled now.

## Filesystem Surfaces

Future write candidates are restricted to `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/<runId>/`. Usage files, sanitized stdout/stderr previews, execution manifests and ingestion records must stay under that run root.

Hermes source, python env and uv cache are read-only or no-mutation surfaces. Project root, package files, `.env`, arbitrary paths and user home/Desktop/Downloads are forbidden.

## Read Path Rules

Reads require future boundary approval, normalized absolute containment, no `.env`, no credential files, no arbitrary project reads, no user-home scans, no broad recursive reads, no untrusted glob expansion, no symlink traversal, no `..`, no UNC/network paths and no drive hopping.

## Write Path Rules

Writes are future-only under approved `.codex-temp` run root. Runtime must not write project source, docs, sourceRoot, python-env, uv cache, package files, `.env`, outside repo root, user home/Desktop/Downloads or arbitrary paths. Future writes require reporting, hashes, size limits and cleanup policy.

## Artifact Shapes

Defines future execution manifest, command result, usage file and ingestion record shapes. Artifacts must not contain secrets, full env or unapproved full output.

## Not Authorized

No Hermes execution, `--oneshot`, prompts, runtime write configuration, filesystem mutation, project writes, output ingestion, findings, network, DNS, endpoints, credentials, model calls, toolsets, uv, pip, Python, setup.py or deploy.

## Next Steps

Proceed to `Factory Hermes Research Execution Boundary Planning Gate v1`, then Approval and Runtime.
## Downstream Gate

Filesystem Mutation Policy Planning feeds Factory Hermes Research Execution Boundary Planning Gate v1. The downstream gate consolidates all policy plans into a boundary candidate, but it still does not authorize runtime writes, project mutation, prompt passing, or Hermes execution.
## Approval Dependency

Research Execution Approval depends on the filesystem mutation policy through Boundary Planning. Missing run root approval remains a runtime selection blocker; the approval gate must not approve runtime writes or project mutation.
