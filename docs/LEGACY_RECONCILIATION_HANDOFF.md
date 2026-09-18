# Legacy reconciliation handoff

Canonical validated branch:
`main`

Canonical validated HEAD:
`31f876ff70b2b8e12d28b200450016fdfc73133d`

Additional recovered work:
`reconcile/legacy-jefe-factory-core`

Recovered content:

- 223 source-code files
- 62 test files
- 72 documentation files

Validation:

- `git diff --check`: PASS
- typecheck: PASS
- build: PASS
- ESLint: NOT PASSING

Known lint debt:

- approximately 1,143 explicit `any` usages in recovered files
- 26 explicit-any occurrences in modified tracked lines

Important:

This branch contains recovered local work that was not previously present in GitHub main.

It has intentionally NOT been merged into main because the recovered code does not satisfy the current ESLint policy.

No known secrets or generated runtime artifacts are included.

Recommended continuation:

1. Start from `main` for the last validated canonical system.
2. Compare/review `reconcile/legacy-jefe-factory-core`.
3. Integrate recovered features incrementally.
4. Resolve lint debt feature-by-feature, not through a blind mass rewrite.
5. Run the relevant offline test chains before merging.

Do not claim this branch is production-ready.