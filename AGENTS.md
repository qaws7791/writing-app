# Project Structure Guide

- This repository is monorepo for writing learning platform project.
- This repository is a bun-managed monorepo with the following structure:
- Don't edit the legacy experimental directory at the repository root; it is not part of the main project structure.
- All documents must be written in Korean.

## First Principle

Prefer explicitness over implicitness and choose simplicity over cleverness and favor consistency over convenience and prioritize local change over widespread impact and pursue immutability over mutable state and value clear intent over clever optimization and trust convention over reinventing decisions and choose transparent behavior over hidden magic and aim for small cohesive units over large all-purpose modules and consider reversible decisions before irreversible ones and build observable systems over black boxes and guarantee deterministic behavior over unpredictable outcomes and design isolated failures over cascading ones and write expressive code over code that depends on comments and trust resilient structures over those that rely solely on perfect prevention.

## Overview

- `README.md`: 프로젝트 소개와 실행 진입점
- `docs/_index.md`: 프로젝트 지식 탐색의 단일 진입점
- `docs/authority-map.md`: 사실별 권위 소유자와 설명 문서의 관계
- `docs/product/`: 제품 문제, 요구사항과 도메인 규칙
- `docs/design/`: 화면, UI와 접근성 기준
- `docs/engineering/`: 현재 시스템 구조, 구현과 운영 계약
- `docs/work/`: 진행 중인 한시적 작업 문서
- `docs/archive/`: 완료되거나 폐기된 기록. 현재 사실의 근거로 사용하지 않음

## Task Guide

- Always update the documentation (/docs) to the latest version for changes when starting and finishing a task.
- 로컬 브라우저 테스트나 E2E 테스트는 Google OAuth 대신 `ENABLE_TEST_AUTH=true` 테스트 전용 로그인을 사용한다.
- 프로젝트 사실을 확인할 때는 `docs/_index.md`, `docs/authority-map.md`, 해당 권위 소스 순서로 읽는다.
- `docs/work`는 진행 중 작업의 범위와 판단을 이해할 때만 사용하며 현재 구조의 권위 소스로 인용하지 않는다.
- `docs/archive`와 ADR은 현재 사실 판정에서 제외하고, 과거 결정이나 증거가 필요한 경우에만 읽는다.
- 새 계획·조사·감사 문서는 `docs/work/<yyyy-mm-dd-name>/`에 만들고 완료 시 같은 작업 단위를 `docs/archive/<yyyy-mm-dd-name>/`로 이동한다.
- 한시 문서의 영구 결론은 완료 전에 관련 제품·디자인·엔지니어링 권위 문서에 반영한다.

### Prerequisites

- Bun 1.3.10
- Node.js 24.x

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

- Use Oxfmt for formatting only
- Keep one Oxfmt configuration at the repository root
- Use Oxlint for linting across the monorepo
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
