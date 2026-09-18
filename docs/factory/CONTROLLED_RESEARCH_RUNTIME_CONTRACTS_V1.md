# Controlled Research Runtime Contracts v1

Status: `done_local_uncommitted` when smoke succeeds.

Pure code-only contracts for approved prompt artifacts, output contracts, provider/model/host refs, credential refs, no-tool policy, timeout, output bounds, redaction, blockers, summaries, and audit manifests.

This module does not read env, `.env`, credentials, files, network, DNS, providers, models, or execute runtime/research.

Verification Planning Gate v1 plans export, behavior, and static safety verification for this module.

Verification Approval Gate v1 approves only verification of this code-only module.

Verification Gate v1 completed code-only/static verification for this module.
## Mock E2E Planning Usage

Factory Hermes Controlled Research Runtime Mock E2E Planning Gate v1 treats these contracts as verified inputs for a future mock-only E2E plan. Contract availability does not authorize provider runtime execution, model calls, output ingestion, or findings.
## Mock E2E Approval Usage

Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1 reviews the planning gate's use of these contracts before allowing the next mock-only execution gate. Contract approval does not authorize provider runtime, model calls, output ingestion, or findings.
## Mock E2E Execution Usage

Factory Hermes Controlled Research Runtime Mock E2E Execution Gate v1 validates prompt artifact refs, output contract shape, and no-tool policy before running the local mock adapter. These contracts keep provider runtime, credentials, network, and findings blocked.
## Mock E2E Review Usage

Factory Hermes Controlled Research Runtime Mock E2E Review Gate v1 reviews whether mock artifacts honored these contracts before provider runtime planning may proceed.
## Provider Runtime Planning Usage

Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1 plans future prompt, output, no-tool, timeout, redaction, ingestion, and findings boundaries from these contracts.
## Provider Runtime Approval Usage

Provider Runtime Approval Gate v1 reviews planned contract boundaries before allowing execution planning.
## Provider Runtime Execution Planning

The Provider Runtime Execution Planning Gate references these contracts for future prompt artifact, output contract, runtime input, request envelope, redaction, audit, review, output ingestion and findings gates. The planning gate itself remains pure and does not create real provider-runtime artifacts.
## Execution Approval Gate Reference

The Provider Runtime Execution Approval Gate accepts the planned contract boundaries for the future execution gate. It does not create prompt, output contract, runtime input, request envelope, raw output, redacted output, audit or review candidate artifacts.
## Runtime Execution Gate Use

The Provider Runtime Execution Gate writes prompt, output contract, runtime input, redacted request envelope, raw output, redacted output, audit and review candidate artifacts. The contracts keep output ingestion and findings blocked until later review gates.
## Provider Runtime Review

Provider Runtime Review uses the contract validation result to classify invalid output and keep ingestion/findings blocked. Retry planning can remediate prompt-contract alignment in a later gate.
## Retry Planning Reference

Retry Planning aligns the next output contract to an exact JSON skeleton so the future retry can be validated before any ingestion or findings gates.
## Retry Approval Reference

Provider Runtime Retry Approval validates the retry plan, review acceptance and failed execution evidence before allowing only a future retry execution gate. It adds no runtime execution, network, credential, model, output ingestion or findings permissions.
## Retry Execution Usage

Provider Runtime Retry Execution validates the retry output against the aligned JSON skeleton contract and requires no-tool evidence, no secret leakage, blocked output ingestion and blocked findings.
## Retry Review Usage

Provider Runtime Retry Review accepts the validated retry output contract for output ingestion planning only. Output ingestion execution and findings require future gates.
## Output Ingestion Planning Usage

Output Ingestion Planning carries forward retry output schema, provenance, no-secret and no-tool validations into a future candidate ingestion plan.
## Output Ingestion Approval Usage

Output Ingestion Approval reviews the candidate, provenance, validation and findings-block plans before allowing only future candidate artifact creation.
