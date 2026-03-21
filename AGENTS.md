# Project Structure Guide

- This repository is monorepo for essay writing-platform project.
- This repository is a bun-managed monorepo with the following structure:

## Overview

- apps/api: hono based api server
- apps/web: nextjs frontend server
- packages/ui: base-ui,reactjs,tailwindcss based shadcn library
- packages/eslint-config: eslint config
- packages/typescript-config: typescript config

## Task Guide

### Prerequisites

- bun 1310
- node 20

## Coding Guidelines

- All files use kebab-case
- Avoid unrelated refactoring, large-scale renaming, and formatting-only changes
- Code is readable and maintainable
- Every package must have a narrow and obvious purpose
- Use a one-way dependency structure
  - apps → packages
  - frontend → UI, SDK, domain
  - API → application, domain, infrastructure
  - application → domain
  - infrastructure → domain
  - UI ✗ application / infrastructure
- Limit changes to the smallest possible diff as much as possible
- Related files keep close to each other
- Prefer self-describing code over explanatory comments
- Prefer declarative and functional,predictable code
- Prefer domain language over technical filler words
- Keep runtime boundaries explicit
- Use Tsdoc to add explanations only for complex code.

### Typescript Principles

- use brand type for domain entities
- Make types carry meaning
- Prefer discriminated unions or explicit result variants over vague success flags
- Avoid:
  - `any`
  - weak `Record<string, unknown>` usage where a real type should exist
  - generic `{ success: boolean, data?: unknown, error?: string }` result shapes
- Do not include the file extension in the import path.
- Always use absolute paths when importing.

### Code Style

- Use Prettier for formatting only
- Use ESLint to enforce architectural and semantic rules
- Do not bikeshed formatting in reviews
- Optimize reviews for correctness, naming, coupling, and boundary clarity

When editing code:

- preserve existing repository formatting
- avoid unrelated reformatting in touched files
- keep diffs focused on the requested change

### Forbidden patterns

- Duplicate utility creation for the same purpose
- Misuse of relative path imports between apps
- Add conditionals to bypass test failures
- Leave dead code behind and defer “later cleanup”
- Unrelated file touch

### Validation checklist

- After the change, it must pass build, lint, typecheck, etc. to the extent possible.

## Commit Guidelines

- Use Korean for commit messages
- Keep summary under 80 characters
- Commit message format:

```
<short summary of changes>

- [detailed description of changes 1(optional)]
- [detailed description of changes 2(optional)]
- 
```

## UI Design Principles

- Non-intrusive editorial design
- Universal design for all ages and genders
- Thorough contrast ratios for readability
- Always design for mobile users
- Platform theme: use glassmorphism and floating appropriately for editorial, to reduce frustration
- Avoid using temporary values (bracket pattern) in apps/web
