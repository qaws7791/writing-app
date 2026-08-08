# Project Structure Guide

## Tone & Style

Use only one term and one meaning for each concept. Write directly with simple verbs, and avoid ambiguous pronouns, vague degree modifiers, generic verbs, and unnecessary nominalization.

Include only one key item of information or one action in each sentence and procedural step.

State conditions, prerequisites, and safety precautions before the relevant action. When the actor changes, explicitly identify the subject and object. Separate multiple actions, conditions, or options into numbered lists or tables rather than combining them in a sentence.

Specify time, quantity, units, ranges, versions, completion criteria, and error conditions in observable or measurable terms. Use distinct expressions to differentiate capability, permission, possibility, obligation, and prohibition.

Before producing the final output, revise any sentence that violates these requirements. Each safety statement must include the hazard, the consequence, and the action required to avoid it. Preserve all code, paths, API identifiers, UI identifiers, and project-approved terminology exactly.

## Repository Overview

- This repository is a Bun-managed monorepo for a writing-focused learning platform.
- No legacy experimental directory currently exists at the repository root; do not infer one from generated or archived paths.
- Documentation under `/docs` must be written in Korean. This file and other agent-instruction files are not subject to that rule.

### Prerequisites

Treat the versions below as a reference floor — the authoritative versions are defined in the repository's `package.json`: `engines` for Node.js and `packageManager` for Bun.

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
- Trust resilient structures over those that rely solely on perfect prevention.

When principles conflict, prioritize security and correctness, then authoritative project contracts, maintainability and consistency, and finally performance and convenience. Between otherwise valid options, choose the smallest reversible local change.

## Documentation Map

- `docs/_index.md` — single entry point for exploring project knowledge. Start here.
- `docs/authority-map.md` — maps which source owns which facts.
- `docs/glossary.md` — canonical definition of each shared product and architecture term. Register every new concept here.
- `docs/product/` — product issues, requirements, domain rules.
- `docs/design/` — screens, UI, accessibility standards.
- `docs/engineering/` — current system structure, implementation and operational contracts.
- `docs/research/` — sources and synthesis behind content decisions. Not an authority for current product facts.
- `docs/work/` — documents for work in progress.
- `docs/archive/` — records of completed or discarded work.

This map is a quick reference — `docs/_index.md` is the authoritative, up-to-date index.

## Agent Instruction Files

A directory-level `AGENTS.md` narrows this file's rules for its own path and may define exceptions to them. Read the file that covers a directory before you change anything in that directory.

- `docs/AGENTS.md` — documentation structure, navigation flow, and writing rules.
- `apps/web/AGENTS.md` — required Next.js reading before you write app code.
- `packages/shared/ui/AGENTS.md` — shared UI component boundaries, import conventions, and edit permission.

## Working with the Repository

- Before starting a task, read `docs/_index.md`, `docs/authority-map.md`, and the relevant authority document, in that order, to confirm current facts.
- Package names, routes, ports, environment variable defaults, schemas, services, images, networks, and test execution targets are owned by code and configuration — link to the authority source rather than restating the value in a document.
- Treat `docs/work/` as scope/judgment context only, never as an authority source for current structure.
- Treat `docs/archive/` and ADRs as historical record only — exclude them from current-fact determination, and read them only when you need past decisions or evidence.
- New planning, investigation, and audit documents go in `docs/work/<yyyy-mm-dd-name>/`. On completion, move the same work unit to `docs/archive/<yyyy-mm-dd-name>/`, folding any permanent conclusions into the relevant product/design/engineering authority documents first.
- Whenever a change affects a fact that a doc describes, update the relevant `/docs` file: check it's current before starting, and update it again before finishing.
- For local browser or E2E tests, sign in through the real email and password handlers rather than Google OAuth. `@workspace/env`'s `./e2e-runtime` subpath owns the local origins and seeded credentials, the seeder in `apps/api/src/test-support/` consumes them, and `e2e/auth.ts` owns the sign-in routes; read them instead of restating values here.
- Update this file when repository-wide agent instructions, project structure, authoritative workflows, required tooling, verification commands, security rules, or commit conventions change. Keep feature-specific facts in their authority source instead.

## Coding Guidelines

- Source files use kebab-case.
- Documentation files keep their existing naming conventions, such as `_index.md` and `ADR-0028-admin-learner-step-preview-reuse.md`.
- Avoid unrelated refactoring, large-scale renaming, and formatting-only changes.
- Keep code readable and maintainable.
- Every package has a narrow, obvious purpose.
- Limit changes to the smallest possible diff.
- Keep related files close to each other.
- Prefer declarative, functional, predictable code.
- Prefer domain language over technical filler words.
- Keep runtime boundaries explicit.

### Comment Guidelines

- Prefer self-describing code. Add comments only to explain a non-obvious "why"; never restate the "what."
- Use TSDoc only when a complex contract cannot be made clear through code and types.

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

## Security Considerations

- Never commit, log, paste, or expose secrets; keep credentials in approved environment-variable or secret-management facilities and use placeholders in examples.
- Treat environment variables as untrusted input: validate them at runtime boundaries and never add insecure defaults or bypasses.

## Definition of Done

- [ ] The required verification commands pass:

```sh
bun run ci:static
bun run ci:tests
bun run build
bun run check:route-bundles
```

`.github/workflows/quality-gates.yml` owns the required gate set, including the UI documentation, E2E and performance tiers that run in CI.

Run the commands that can observe your change. A change limited to Markdown files needs `bun oxfmt --check` on the touched files and the `/docs` check below. A change touching `apps/`, `packages/`, `scripts/`, `deploy/`, `infra/`, or root configuration needs the full command set. Add the UI documentation, E2E or performance tier when your change touches what that tier covers.

- [ ] `/docs` reflects the change, including moving finished `docs/work/` items to `docs/archive/` with conclusions folded into the relevant authority docs.
- [ ] All processes started for the task (Node.js, bash, dev servers, etc.) are safely terminated.

## Commit Guidelines

`docs/engineering/git-workflow.md` owns branch naming, commit message language and format, PR body requirements, and merge policy. Read it before you create a branch, a commit, or a PR.
