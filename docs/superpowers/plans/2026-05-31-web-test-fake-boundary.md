# Web Test Fake Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web/src` 안에 남아 있는 fake API 구현체와 대형 fixture 데이터를 `apps/web/test` 경계로 옮겨 제품 실행 코드와 테스트 지원 코드를 분리한다.

**Architecture:** 제품 `src`는 `WritingAppApi` 포트와 HTTP 어댑터만 소유한다. fake API, fixture, 테스트용 정적 카탈로그는 `apps/web/test/api`가 소유하고, Vitest/TypeScript에서만 `@test/*` 절대 경로로 참조한다. 제품 소스가 `@test/*`를 import하지 못하도록 ESLint guardrail을 둔다.

**Tech Stack:** Next.js 16, TypeScript 5.9, Vitest 4, ESLint flat config, Bun workspace.

---

## 파일 구조

- Modify: `apps/web/tsconfig.json`
  - `@test/*` path alias를 추가해 `apps/web/test` 내부 테스트 지원 코드를 절대 경로로 import한다.
- Modify: `apps/web/vitest.config.ts`
  - `test/**/*.test.ts`와 `test/**/*.test.tsx`도 Vitest 실행 대상에 포함한다.
- Modify: `apps/web/eslint.config.mjs`
  - 제품 소스가 `@test/*` 또는 상대 경로로 `test` 경계를 import하지 못하도록 제한한다.
- Move: `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts` -> `apps/web/test/api/fakes/create-fake-writing-app-api.ts`
  - `WritingAppApi` 포트의 테스트용 in-memory 구현체다.
- Move: `apps/web/src/lib/api/fake/fake-writing-app-fixtures.ts` -> `apps/web/test/api/fakes/fake-writing-app-fixtures.ts`
  - fake API가 쓰는 fixture entrypoint다.
- Move: `apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts` -> `apps/web/test/api/fakes/create-fake-writing-app-api.test.ts`
  - fake API 계약 테스트다.
- Move: `apps/web/src/lib/api/fake/home-progress-fixtures.ts` -> `apps/web/test/api/fixtures/home-progress-fixtures.ts`
  - 홈 진행 상태 fixture다.
- Move: `apps/web/src/lib/api/fake/__fixtures__/course-data.ts` -> `apps/web/test/api/fixtures/course-data.ts`
  - 코스 목록 fixture다.
- Move: `apps/web/src/lib/api/fake/__fixtures__/course-detail-data.ts` -> `apps/web/test/api/fixtures/course-detail-data.ts`
  - 코스 상세 fixture다.
- Move: `apps/web/src/lib/api/fake/__fixtures__/lesson-data.ts` -> `apps/web/test/api/fixtures/lesson-data.ts`
  - 레슨 fixture와 레슨 생성 helper다.
- Modify: `apps/web/src/features/courses/course-curriculum.test.tsx`
  - fixture import를 `@test/api/fixtures/course-detail-data`로 바꾼다.
- Modify: `apps/web/src/features/lessons/lesson-experience.test.tsx`
  - fixture import를 `@test/api/fixtures/lesson-data`로 바꾼다.
- Modify: `docs/codebase-improvement-progress.md`
  - 작업 시작과 완료 기록을 한국어로 남긴다.
- Modify: `docs/bssn-simplification-audit.md`
  - runtime fake 제거 후속 정리로 fake 구현과 fixture가 `apps/web/test`로 이동했음을 기록한다.

---

### Task 1: 문서에 작업 시작 기록

**Files:**

- Modify: `docs/codebase-improvement-progress.md`

- [ ] **Step 1: 작업 메모를 추가한다**

`docs/codebase-improvement-progress.md`의 `FE-04 작업 메모` 섹션 바로 다음에 다음 섹션을 추가한다.

```markdown
## WEB-TEST-01 작업 메모

- 대상 파일: `apps/web/src/lib/api/fake/*`, `apps/web/test/api/*`, `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `apps/web/eslint.config.mjs`
- 작업 시작: 2026-05-31, 웹 fake API 구현체와 대형 fixture를 제품 `src` 밖의 `apps/web/test` 경계로 옮겨 테스트 지원 코드의 소유권을 명시한다.
```

- [ ] **Step 2: 문서 변경만 확인한다**

Run:

```bash
git diff -- docs/codebase-improvement-progress.md
```

Expected: `WEB-TEST-01 작업 메모`의 작업 시작 기록만 보인다.

- [ ] **Step 3: 시작 문서를 커밋한다**

```bash
git add docs/codebase-improvement-progress.md
git commit -m "docs: 웹 테스트 경계 정리 시작 기록"
```

Expected: 한국어 커밋 메시지로 문서 변경만 커밋된다.

---

### Task 2: `@test/*` 테스트 경계 alias 추가

**Files:**

- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/vitest.config.ts`

- [ ] **Step 1: `tsconfig.json`에 `@test/*` path를 추가한다**

`apps/web/tsconfig.json`의 `compilerOptions.paths`를 다음처럼 바꾼다.

```json
"paths": {
  "@/*": ["./src/*"],
  "@test/*": ["./test/*"]
}
```

- [ ] **Step 2: Vitest include에 `test` 디렉터리를 추가한다**

`apps/web/vitest.config.ts`를 다음 내용으로 바꾼다.

```ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "test/**/*.test.ts",
      "test/**/*.test.tsx",
    ],
  },
})
```

- [ ] **Step 3: 설정 변경을 검증한다**

Run:

```bash
bun --filter @workspace/web typecheck
```

Expected: PASS. 아직 `test` 디렉터리 import가 없으므로 alias 추가만으로 기존 타입체크가 깨지지 않는다.

- [ ] **Step 4: 설정 변경을 커밋한다**

```bash
git add apps/web/tsconfig.json apps/web/vitest.config.ts
git commit -m "test: 웹 테스트 경계 alias 추가"
```

Expected: `@test/*` alias와 Vitest include 변경만 커밋된다.

---

### Task 3: fake API와 fixture 파일을 `apps/web/test`로 이동

**Files:**

- Create: `apps/web/test/api/fakes`
- Create: `apps/web/test/api/fixtures`
- Move: `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts`
- Move: `apps/web/src/lib/api/fake/fake-writing-app-fixtures.ts`
- Move: `apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts`
- Move: `apps/web/src/lib/api/fake/home-progress-fixtures.ts`
- Move: `apps/web/src/lib/api/fake/__fixtures__/course-data.ts`
- Move: `apps/web/src/lib/api/fake/__fixtures__/course-detail-data.ts`
- Move: `apps/web/src/lib/api/fake/__fixtures__/lesson-data.ts`

- [ ] **Step 1: 대상 디렉터리를 만든다**

Run:

```bash
New-Item -ItemType Directory -Force apps/web/test/api/fakes, apps/web/test/api/fixtures
```

Expected: `apps/web/test/api/fakes`와 `apps/web/test/api/fixtures`가 존재한다.

- [ ] **Step 2: 파일을 git history가 유지되도록 이동한다**

Run:

```bash
git mv apps/web/src/lib/api/fake/create-fake-writing-app-api.ts apps/web/test/api/fakes/create-fake-writing-app-api.ts
git mv apps/web/src/lib/api/fake/fake-writing-app-fixtures.ts apps/web/test/api/fakes/fake-writing-app-fixtures.ts
git mv apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts apps/web/test/api/fakes/create-fake-writing-app-api.test.ts
git mv apps/web/src/lib/api/fake/home-progress-fixtures.ts apps/web/test/api/fixtures/home-progress-fixtures.ts
git mv apps/web/src/lib/api/fake/__fixtures__/course-data.ts apps/web/test/api/fixtures/course-data.ts
git mv apps/web/src/lib/api/fake/__fixtures__/course-detail-data.ts apps/web/test/api/fixtures/course-detail-data.ts
git mv apps/web/src/lib/api/fake/__fixtures__/lesson-data.ts apps/web/test/api/fixtures/lesson-data.ts
```

Expected: `git status --short`에서 위 파일들이 rename으로 표시된다.

- [ ] **Step 3: 이동 후 남은 fake 파일을 확인한다**

Run:

```bash
rg --files apps/web/src/lib/api/fake apps/web/test/api
```

Expected: `apps/web/src/lib/api/fake`에는 파일이 남지 않고, fake API와 fixture 파일은 `apps/web/test/api` 아래에만 보인다.

---

### Task 4: 이동된 파일의 import 경로 수정

**Files:**

- Modify: `apps/web/test/api/fakes/create-fake-writing-app-api.ts`
- Modify: `apps/web/test/api/fakes/create-fake-writing-app-api.test.ts`
- Modify: `apps/web/test/api/fakes/fake-writing-app-fixtures.ts`
- Modify: `apps/web/test/api/fixtures/course-data.ts`
- Modify: `apps/web/test/api/fixtures/lesson-data.ts`
- Modify: `apps/web/src/features/courses/course-curriculum.test.tsx`
- Modify: `apps/web/src/features/lessons/lesson-experience.test.tsx`

- [ ] **Step 1: fake API 구현체 import를 `@test`로 바꾼다**

`apps/web/test/api/fakes/create-fake-writing-app-api.ts`의 fixture import를 다음처럼 바꾼다.

```ts
import {
  AI_FEEDBACK_SCORE_RANGE,
  courseCategories,
  getCourseDetailById,
  getLessonById,
  getMockAiFeedback,
  inProgressCourses,
} from "@test/api/fakes/fake-writing-app-fixtures"
```

`api-result`와 `writing-app-api` import는 제품 포트 import이므로 그대로 `@/lib/api/...`를 유지한다.

- [ ] **Step 2: fake API 테스트 import를 `@test`로 바꾼다**

`apps/web/test/api/fakes/create-fake-writing-app-api.test.ts`의 import를 다음처럼 바꾼다.

```ts
import { createFakeWritingAppApi } from "@test/api/fakes/create-fake-writing-app-api"
```

- [ ] **Step 3: fake fixture entrypoint import를 `@test`로 바꾼다**

`apps/web/test/api/fakes/fake-writing-app-fixtures.ts`의 import 블록을 다음처럼 바꾼다.

```ts
import { AI_FEEDBACK_SCORE_RANGE } from "@/features/lessons/lesson-generation-rules"
import { getMockAiFeedback } from "@/features/lessons/lesson-logic"

import { courseCategories } from "@test/api/fixtures/course-data"
import { getCourseDetailById } from "@test/api/fixtures/course-detail-data"
import { getLessonById } from "@test/api/fixtures/lesson-data"
import { inProgressCourses } from "@test/api/fixtures/home-progress-fixtures"
```

- [ ] **Step 4: 코스 fixture 내부 import를 `@test`로 바꾼다**

`apps/web/test/api/fixtures/course-data.ts`의 import를 다음처럼 바꾼다.

```ts
import { courseDetails } from "@test/api/fixtures/course-detail-data"
```

- [ ] **Step 5: 레슨 fixture 내부 import를 `@test`로 바꾼다**

`apps/web/test/api/fixtures/lesson-data.ts`의 `courseDetails` import를 다음처럼 바꾼다.

```ts
import { courseDetails } from "@test/api/fixtures/course-detail-data"
```

- [ ] **Step 6: feature 테스트의 fixture import를 `@test`로 바꾼다**

`apps/web/src/features/courses/course-curriculum.test.tsx`의 fixture import를 다음처럼 바꾼다.

```ts
import { courseDetails } from "@test/api/fixtures/course-detail-data"
```

`apps/web/src/features/lessons/lesson-experience.test.tsx`의 fixture import를 다음처럼 바꾼다.

```ts
import { getDefaultLesson } from "@test/api/fixtures/lesson-data"
```

- [ ] **Step 7: 이전 fake 경로 참조가 없는지 확인한다**

Run:

```bash
rg -n "@/lib/api/fake|src/lib/api/fake|__fixtures__" apps/web --glob "!prototype/**"
```

Expected: 검색 결과가 없다.

- [ ] **Step 8: 이동된 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/web test test/api/fakes/create-fake-writing-app-api.test.ts src/features/courses/course-curriculum.test.tsx src/features/lessons/lesson-experience.test.tsx
```

Expected: PASS. fake API 테스트와 fixture를 직접 쓰는 feature 테스트가 통과한다.

- [ ] **Step 9: 이동과 import 수정을 커밋한다**

```bash
git add apps/web/src apps/web/test
git commit -m "test: 웹 fake API를 테스트 경계로 이동"
```

Expected: `apps/web/src/lib/api/fake` 파일은 제거되고 `apps/web/test/api` 파일이 추가된 커밋이 생긴다.

---

### Task 5: 제품 소스의 테스트 경계 import 방지

**Files:**

- Modify: `apps/web/eslint.config.mjs`

- [ ] **Step 1: ESLint config에 제품 소스 guardrail을 추가한다**

`apps/web/eslint.config.mjs`를 다음 내용으로 바꾼다.

```js
import { nextJsConfig } from "@workspace/config/eslint/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@test/*",
                "../test/*",
                "../../test/*",
                "../../../test/*",
                "../../../../test/*",
              ],
              message:
                "제품 소스는 테스트 지원 경계를 import할 수 없습니다. 테스트 fixture와 fake는 apps/web/test 안에서만 사용하세요.",
            },
          ],
        },
      ],
    },
  },
]
```

- [ ] **Step 2: lint guardrail이 현재 코드에서 통과하는지 확인한다**

Run:

```bash
bun --filter @workspace/web lint
```

Expected: PASS. `src/**/*.test.*`는 예외이므로 `@test/*` fixture import가 허용되고, 제품 소스는 `@test/*`를 import하지 않는다.

- [ ] **Step 3: ESLint guardrail을 커밋한다**

```bash
git add apps/web/eslint.config.mjs
git commit -m "lint: 웹 제품 소스의 테스트 import 차단"
```

Expected: ESLint 설정 변경만 커밋된다.

---

### Task 6: 전체 검증과 문서 완료 기록

**Files:**

- Modify: `docs/codebase-improvement-progress.md`
- Modify: `docs/bssn-simplification-audit.md`

- [ ] **Step 1: 전체 웹 검증을 실행한다**

Run:

```bash
bun --filter @workspace/web test && bun --filter @workspace/web typecheck && bun --filter @workspace/web lint && bun --filter @workspace/web build
```

Expected: 모든 명령이 PASS. `build` 산출물에 fake API 문자열이 들어가지 않는다.

- [ ] **Step 2: 빌드 산출물에서 fake marker를 검색한다**

Run:

```bash
rg -n "createFakeWritingAppApi|fake-user|@test/api|__fixtures__" apps/web/.next --glob "!cache/**"
```

Expected: 검색 결과가 없다. `rg` exit code 1은 match 없음이므로 정상이다.

- [ ] **Step 3: 작업 완료 문서를 추가한다**

`docs/codebase-improvement-progress.md`의 `WEB-TEST-01 작업 메모`를 다음처럼 완료 상태로 확장한다.

```markdown
## WEB-TEST-01 작업 메모

- 대상 파일: `apps/web/src/lib/api/fake/*`, `apps/web/test/api/*`, `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `apps/web/eslint.config.mjs`
- 작업 시작: 2026-05-31, 웹 fake API 구현체와 대형 fixture를 제품 `src` 밖의 `apps/web/test` 경계로 옮겨 테스트 지원 코드의 소유권을 명시한다.
- 완료 내용: fake API 구현체와 course/lesson/home fixture를 `apps/web/test/api`로 이동했다. 테스트 전용 import는 `@test/*` alias로 명시하고, 제품 `src`가 테스트 경계를 import하지 못하도록 ESLint guardrail을 추가했다.
- 검증: `bun --filter @workspace/web test && bun --filter @workspace/web typecheck && bun --filter @workspace/web lint && bun --filter @workspace/web build`
```

`docs/bssn-simplification-audit.md`의 `웹 runtime fake 모드 제거` 섹션에 다음 문장을 추가한다.

```markdown
2026-05-31 후속 정리로 fake API 구현체와 대형 fixture를 `apps/web/test/api`로 이동했다. 제품 `src`에는 HTTP API factory와 포트 계약만 남기고, fake 데이터는 테스트 지원 경계에서만 참조한다.
```

- [ ] **Step 4: 문서와 최종 변경을 커밋한다**

```bash
git add docs/codebase-improvement-progress.md docs/bssn-simplification-audit.md
git commit -m "docs: 웹 테스트 경계 정리 완료 기록"
```

Expected: 문서 완료 기록만 커밋된다.

- [ ] **Step 5: 작업 트리 상태를 확인한다**

Run:

```bash
git status --short
```

Expected: 사용자 기존 변경인 `prototype/` 외에는 작업 트리가 깨끗하다. `prototype/`는 AGENTS 지침상 수정하지 않는다.

---

## Self-Review

- Spec coverage: fake 데이터와 Mock API 구현체를 `apps/web/test`로 옮기는 요구는 Task 2~4에서 처리한다. 제품 `src`와 테스트 지원 코드의 재혼합 방지는 Task 5에서 처리한다. 문서 시작/완료 갱신은 Task 1과 Task 6에서 처리한다.
- Placeholder scan: 실행자가 판단해야 하는 빈칸, 미정 항목, 후속 구현 지시, 모호한 오류 처리 지시를 남기지 않았다.
- Type consistency: `@test/*` alias는 `apps/web/tsconfig.json`과 `apps/web/vitest.config.ts`에서 같은 의미로 사용된다. fake API 구현체는 계속 `WritingAppApi`를 반환하고, 제품 타입 import는 `@/lib/api/writing-app-api`를 유지한다.
