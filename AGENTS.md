# Project Structure Guide

## Repository Overview

- This repository is a Bun-managed monorepo for a writing-focused learning platform.
- No legacy experimental directory currently exists at the repository root; do not infer one from generated or archived paths.
- Documentation under `/docs` must be written in Korean. This file and other agent-instruction files are not subject to that rule.

### Prerequisites

Treat the versions below as a reference floor — the authoritative versions are defined in the repository's `package.json` (`engines`) or `.tool-versions`.

- Bun 1.3.10 or later
- Node.js 24.x

## First Principles

The following principles guide technical decisions in this repository:

- Prefer explicitness over implicitness.
- Choose simplicity over cleverness.
- Favor consistency over convenience.
- Prioritize local change over widespread impact.
- Pursue immutability over mutable state.
- Value clear intent over clever optimization.
- Trust convention over reinventing decisions.
- Choose transparent behavior over hidden magic.
- Aim for small, cohesive units over large, all-purpose modules.
- Consider reversible decisions before irreversible ones.
- Build observable systems over black boxes.
- Guarantee deterministic behavior over unpredictable outcomes.
- Design isolated failures over cascading ones.
- Write expressive code over code that depends on comments.
- Trust resilient structures over those that rely solely on perfect prevention.

## Documentation Map

- `docs/_index.md` — single entry point for exploring project knowledge. Start here.
- `docs/authority-map.md` — maps which source owns which facts.
- `docs/product/` — product issues, requirements, domain rules.
- `docs/design/` — screens, UI, accessibility standards.
- `docs/engineering/` — current system structure, implementation and operational contracts.
- `docs/work/` — documents for work in progress.
- `docs/archive/` — records of completed or discarded work.

This map is a quick reference — `docs/_index.md` is the authoritative, up-to-date index.

## Working with the Repository

- Before starting a task, read `docs/_index.md`, `docs/authority-map.md`, and the relevant authority document, in that order, to confirm current facts.
- Package names, routes, ports, environment variable defaults, schemas, services, images, networks, and test execution targets are owned by code and configuration — link to the authority source rather than restating the value in a document.
- Treat `docs/work/` as scope/judgment context only, never as an authority source for current structure.
- Treat `docs/archive/` and ADRs as historical record only — exclude them from current-fact determination, and read them only when you need past decisions or evidence.
- New planning, investigation, and audit documents go in `docs/work/<yyyy-mm-dd-name>/`. On completion, move the same work unit to `docs/archive/<yyyy-mm-dd-name>/`, folding any permanent conclusions into the relevant product/design/engineering authority documents first.
- Whenever a change affects a fact that a doc describes, update the relevant `/docs` file: check it's current before starting, and update it again before finishing.
- For local browser or E2E tests, use the test-specific login (`ENABLE_TEST_AUTH=true`) instead of Google OAuth. If this file is out of date, confirm the flag against its source.

## Coding Guidelines

- All files use kebab-case.
- Avoid unrelated refactoring, large-scale renaming, and formatting-only changes.
- Keep code readable and maintainable.
- Every package has a narrow, obvious purpose.
- Limit changes to the smallest possible diff.
- Keep related files close to each other.
- Prefer self-describing code over explanatory comments.
- Prefer declarative, functional, predictable code.
- Prefer domain language over technical filler words.
- Keep runtime boundaries explicit.
- Use TSDoc only to explain complex code.

### Scope Discipline

- Implement exactly what is requested. Do not add features, options, exception handling, or extension points that aren't part of the request.
- Do not write code "that might be needed later" (YAGNI) — add it only when it's actually needed.
- Follow existing code styles and patterns. Do not create new abstraction layers, helper functions, or utility modules without reason.
- Do not refactor, reformat, or move files unrelated to the request.
- If scope is uncertain, don't write code first — ask a question or present a plan.

### Testing Discipline

- Treat production, test, fixture, and verification code alike as maintenance liabilities. Prefer less code and simpler, explicit, deterministic, side-effect-free designs enforced by types or structure where practical; self-evident behavior needs no compensating test.
- Add or expand tests only for a concrete, meaningful, uncovered regression risk—such as non-trivial domain policy, state transitions, security, data integrity, external contracts, or reproduced defects—not merely because implementation changed.
- Do not test trivial wrappers, type-enforced facts, framework behavior, static markup, implementation details, duplicated behavior across layers, or low-value permutations.
- When justified, extend the existing suite with the smallest test at the lowest-cost relevant boundary and assert observable behavior; if no consequential failure can be named, do not write it.
- Prefer simpler code, types, structure, lint rules, or existing tools to new validation scripts. Tests and checks are evidence, not proof of correctness or quality; simplify live designs continuously, and treat growing defensive checks as a signal to fix the design rather than add guardrails.

### TypeScript Principles

- Use brand types for domain entities.
- Make types carry meaning.
- Prefer discriminated unions or explicit result variants over vague success flags.
- Avoid `any`, weak `Record<string, unknown>` where a real type should exist, and generic `{ success: boolean, data?: unknown, error?: string }` result shapes.
- Do not include the file extension in import paths.
- Always use absolute paths for imports.

### Formatting & Linting

- Use Oxfmt for formatting only, with one Oxfmt configuration at the repository root.
- Use Oxlint for linting across the monorepo.
- Don't bikeshed formatting in review — spend review time on correctness, naming, coupling, and boundary clarity.

### Editing Existing Code

- Preserve existing repository formatting.
- Avoid unrelated reformatting in touched files.
- Keep diffs focused on the requested change.

### Forbidden Patterns

- Duplicate utility creation for the same purpose.
- Relative-path imports between apps.
- Conditionals added to bypass test failures.
- Dead code left behind for "later cleanup."
- Unrelated file touches.

## Documentation Guidelines

- Write only the requested content — don't add sections automatically; add them only when explicitly requested.
- Keep documentation short. If it exceeds a single screen, double-check whether all of it is necessary.
- Before creating a new file, check whether adding to an existing document is enough.
- Add code comments only to explain "why." Don't restate the "what" if it's already clear from the code.

## Definition of Done

- [ ] Build, lint, and typecheck pass. `bun lefthook run pre-commit` covers lint/format.
- [ ] `/docs` reflects the change, including moving finished `docs/work/` items to `docs/archive/` with conclusions folded into the relevant authority docs.
- [ ] All processes started for the task (Node.js, bash, dev servers, etc.) are safely terminated.

## Commit Guidelines

- Use Korean for commit messages.
- Keep the summary under 80 characters.
- Format:

```
<short summary of changes>

- [detailed description of changes 1 (optional)]
- [detailed description of changes 2 (optional)]
-
```
