# Tasks

## 1. Product contract
- [x] 1.1 Add stable spec coverage for the project operations loop.
- [x] 1.2 Define work state vocabulary and transition expectations.
- [x] 1.3 Define routing rules for local logic, OpenAI, Codex/workers, and approvals.

## 2. Orchestration design
- [x] 2.1 Map existing repo surfaces that already implement parts of the loop.
- [x] 2.2 Define the first implementation slice and its owning modules.
- [x] 2.3 Define retry-budget and blocked-after-retries behavior.

## 3. Operator visibility
- [x] 3.1 Decide which states must be visible in UI first.
- [ ] 3.2 Align V1.7 session UI with the broader operating loop.
- [x] 3.3 Define delivery report expectations for final closure.

## 4. Validation and rollout
- [x] 4.1 Validate the docs/spec layer against current repo behavior.
- [x] 4.2 Implement the first bounded slice with targeted checks.
- [x] 4.3 Audit Git, push, and CI status before calling the block complete.