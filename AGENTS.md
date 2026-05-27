# Project Structure Guide

- This repository is monorepo for writing learning platform project.
- This repository is a bun-managed monorepo with the following structure:
- Don't Edit `/prototype` directory, which contains experimental code and is not part of the main project structure.
- All documents must be written in Korean.

## First Principle

Prefer explicitness over implicitness and choose simplicity over cleverness and favor consistency over convenience and prioritize local change over widespread impact and pursue immutability over mutable state and value clear intent over clever optimization and trust convention over reinventing decisions and choose transparent behavior over hidden magic and aim for small cohesive units over large all-purpose modules and consider reversible decisions before irreversible ones and build observable systems over black boxes and guarantee deterministic behavior over unpredictable outcomes and design isolated failures over cascading ones and write expressive code over code that depends on comments and trust resilient structures over those that rely solely on perfect prevention.

## Overview

- apps/web: nextjs fullstack server
- packages/ui: base-ui,reactjs,tailwindcss based shadcn library
- CONTEXT.md: project context
- ARCHITECTURE.md: project architecture
- DOMAIN.md: project domain
- GLOSSARY.md: project glossary
- FRONTEND.md: frontend development guide
- BACKEND.md: backend development guide

## Task Guide

- Always update the documentation (/docs) to the latest version for changes when starting and finishing a task.

### Prerequisites

- bun 1310
- node 20

## Coding Guidelines

- All files use kebab-case
- Avoid unrelated refactoring, large-scale renaming, and formatting-only changes
- Code is readable and maintainable
- Every package must have a narrow and obvious purpose
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
- Keep one Prettier configuration at the repository root
- Use ESLint for linting across the monorepo
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
- `bun lefthook run pre-commit` can be used to lint,formatting before commit

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

## After the task is finished

- Safely terminate all processes used for the task, such as Node.js and the bash.
