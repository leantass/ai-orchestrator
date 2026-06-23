# Proposal: V1.8 Project Operations Loop

## Intent

Make JEFE explicit as an end-to-end project operations orchestrator instead of a chat surface that only plans or applies isolated edits.

The main goal of this block is to define and then implement the operating loop that goes from request intake through planning, controlled execution, validation, quality review, correction rounds, delivery, and next-step recording.

## Scope

In scope:

- formal work states for project blocks;
- routing policy between local logic, OpenAI client, Codex, worker paths, and human approval;
- explicit validation and quality review gates before delivery;
- bounded retry logic for correction rounds;
- honest blocked reporting when completion criteria are not met;
- artifact and status surfaces needed so operators can understand the loop.

Out of scope:

- removing existing safety gates;
- inventing new credentials or touching `.env`;
- deploying to production;
- unauthorized external tool execution;
- package installation without explicit approval;
- replacing Context Hub with repo-local files only.

## Why this block matters now

V1.5 and V1.6 already created a real supervised loop for external-tool work.

What is still missing is the higher-level orchestration loop that makes JEFE behave like a project operations lead across the whole request lifecycle.

Without that layer, JEFE can accumulate capabilities but still feel like a powerful assistant rather than a reliable operator.

## Expected outcome

After this block, JEFE should be able to explain and drive a work item as a governed lifecycle with clear state, routing, validation, review, retry, and closure semantics.