# Delta for Project Operations Loop

## ADDED Requirements

### Requirement: JEFE must operate as a governed project loop
JEFE SHALL treat each meaningful user request as a governed lifecycle with planning, execution, validation, review, and closure semantics.

#### Scenario: Request becomes a governed work block
- GIVEN Lean asks JEFE to continue a project or deliver a new block of work
- WHEN JEFE accepts the request
- THEN JEFE creates or updates a bounded work block with explicit state, routing, validation, and closure expectations

### Requirement: JEFE must escalate intelligently and honestly
JEFE SHALL escalate to the existing OpenAI client only when local logic is insufficient and report the difference honestly.

#### Scenario: OpenAI path unavailable
- GIVEN advanced judgment is required but the configured OpenAI path is unavailable
- WHEN JEFE evaluates the block
- THEN JEFE reports a state such as `requires_openai`
- AND JEFE either falls back honestly to local heuristics or reports a clear blocker

### Requirement: JEFE must stop incomplete delivery from looking complete
JEFE SHALL prevent partially correct or weak-quality work from being delivered as final just because technical checks passed once.

#### Scenario: Quality review rejects a technically passing result
- GIVEN build, lint, and smokes pass
- WHEN JEFE's quality review still finds the result below product intent
- THEN JEFE opens a correction round instead of final delivery