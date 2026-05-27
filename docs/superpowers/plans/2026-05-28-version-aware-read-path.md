# 버전 인식 읽기 경로 Implementation Plan

> **에이전트 작업자 필수 지침:** 이 계획을 태스크 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** 공개 콘텐츠 API는 최신 published 버전을, 인증된 학습 진행 API는 학습자의 진행 버전을 기준으로 동작함을 실제 API 경계에서 고정한다.

**아키텍처:** 새 공개 DTO를 만들지 않고 기존 service/repository 경계를 사용한다. 실제 인메모리 SQLite와 real repository/service를 Hono 앱에 연결한 통합 테스트를 추가해 공개 최신 버전과 진행 버전이 분리되는지 검증한다. `saveLessonAnswer`는 진행 저장/완료와 동일하게 대상 레슨이 학습자의 진행 버전에 포함되는지 확인한다.

**기술 스택:** Bun, TypeScript, Hono, Drizzle SQLite, Vitest, Markdown, Prettier.

---

## 범위 확인

### 포함

- 4단계 설계 문서와 구현 계획 문서
- 실제 DB 기반 API 통합 테스트 추가
- 공개 course detail이 최신 published 버전을 유지하는 회귀 테스트
- 인증 course progress가 기존 진행 버전을 유지하는 회귀 테스트
- 진행 버전 밖 레슨 진행 저장 거절 테스트
- 진행 버전 밖 레슨 답변 저장 거절 테스트
- `saveLessonAnswer`의 커리큘럼 버전 포함 여부 검증
- `/docs` 구현 로그와 백엔드 문서 갱신

### 제외

- 공개 API DTO에 `curriculumVersionId` 노출
- 관리자 발행 API
- 학습자 업그레이드 UX
- 마이그레이션 맵
- `lesson_answers`의 버전 컬럼 추가
- lesson step snapshot 분리

## 파일 구조

- 생성: `docs/superpowers/specs/2026-05-28-version-aware-read-path-design.md`
  - 4단계 설계와 결정 사항을 기록한다.
- 생성: `docs/superpowers/plans/2026-05-28-version-aware-read-path.md`
  - 구현 계획을 기록한다.
- 수정: `docs/admin-site.md`
  - 4단계 계획/구현 시작과 완료 로그를 남긴다.
- 수정: `docs/platform-backend-api.md`
  - 공개 최신 버전과 진행 버전 분리 동작을 기록한다.
- 수정: `BACKEND.md`
  - 인증된 읽기/쓰기 경계의 버전 정책을 갱신한다.
- 수정: `packages/core/src/learning/learning.service.ts`
  - `saveLessonAnswer`에 진행 버전 포함 여부 검증을 추가한다.
- 수정: `packages/core/src/learning/learning.service.test.ts`
  - 진행 버전 밖 레슨 답변 저장 거절 테스트를 추가한다.
- 생성: `apps/api/src/versioned-learning.integration.test.ts`
  - real DB와 real service를 사용한 API 통합 테스트를 추가한다.

## 작업 1: 4단계 문서 계획 고정

**파일:**

- 생성: `docs/superpowers/specs/2026-05-28-version-aware-read-path-design.md`
- 생성: `docs/superpowers/plans/2026-05-28-version-aware-read-path.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: 문서 로그 추가**

`docs/admin-site.md` 상단에 다음 로그를 추가한다.

```md
## 2026-05-28 버전 인식 읽기 경로 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 4단계 구현 계획을 작성한다.
- 공개 콘텐츠 API는 최신 published 버전을 유지하고, 인증된 진행 API는 학습자의 진행 버전을 유지하는 경계를 실제 API 통합 테스트로 고정한다.

## 2026-05-28 버전 인식 읽기 경로 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-version-aware-read-path-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-version-aware-read-path.md`에 작성한다.
- 공개 DTO 변경 없이 real DB 기반 API 통합 테스트와 `saveLessonAnswer` 버전 검증을 추가하는 범위로 제한한다.
```

`docs/platform-backend-api.md` 상단에 다음 로그를 추가한다.

```md
## 2026-05-28 버전 인식 읽기 경로 구현 계획 시작

- 공개 최신 커리큘럼과 인증된 진행 커리큘럼이 API 경계에서 섞이지 않도록 통합 테스트 계획을 작성한다.
- 진행 저장, 완료, 답변 저장은 학습자의 진행 버전에 포함된 레슨에 대해서만 허용하도록 검증 범위를 확장한다.

## 2026-05-28 버전 인식 읽기 경로 구현 계획 완료

- 공개 `GET /courses/:courseId`는 최신 published 버전을 유지한다.
- 인증된 `GET /courses/:courseId/progress`와 `GET /progress`는 저장된 진행 버전을 유지한다.
- 답변 저장도 진행 버전 밖 레슨에 대해 `invalid-request`를 반환하도록 구현 계획에 포함한다.
```

- [ ] **단계 2: 포맷과 diff 확인**

실행:

```bash
bun prettier --write docs/superpowers/specs/2026-05-28-version-aware-read-path-design.md docs/superpowers/plans/2026-05-28-version-aware-read-path.md docs/admin-site.md docs/platform-backend-api.md
git diff --check
```

기대 결과: 종료 코드 0.

- [ ] **단계 3: 커밋**

```bash
git add docs/superpowers/specs/2026-05-28-version-aware-read-path-design.md docs/superpowers/plans/2026-05-28-version-aware-read-path.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "버전 인식 읽기 경로 계획 문서화"
```

## 작업 2: 답변 저장 버전 검증

**파일:**

- 수정: `packages/core/src/learning/learning.service.test.ts`
- 수정: `packages/core/src/learning/learning.service.ts`

- [ ] **단계 1: 실패 테스트 작성**

`packages/core/src/learning/learning.service.test.ts`에 다음 테스트를 추가한다.

```ts
it("rejects answers for a lesson outside the learner curriculum version", async () => {
  const repository = {
    ...createRepository(),
    curriculumVersionIncludesLesson: vi.fn(async () => false),
  }
  const service = createLearningService({ contentService, repository })

  const result = await service.saveLessonAnswer(
    userId("user-1"),
    lessonId("sentence-structure-01"),
    {
      answer: "문장을 고쳤습니다.",
      stepId: "sentence-structure-01-step-2",
    }
  )

  expect(result).toEqual({
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message: "Lesson is not part of the learner curriculum version.",
    },
  })
  expect(repository.upsertLessonAnswer).not.toHaveBeenCalled()
})
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/core test -- learning.service.test.ts
```

기대 결과: 새 테스트가 `ok`를 받아 실패한다.

- [ ] **단계 3: 구현**

`packages/core/src/learning/learning.service.ts`의 `saveLessonAnswer`에서 `targetStep`과 answer type 검증 후 저장 전에 다음 검증을 추가한다.

```ts
const curriculumVersionId = await resolveCurriculumVersionId(
  repository,
  userId,
  lessonResult.value.courseId as CourseId
)
if (!curriculumVersionId) {
  return invalidRequest("Published curriculum version was not found.")
}

const isVersionLesson = await repository.curriculumVersionIncludesLesson(
  curriculumVersionId,
  lessonId
)
if (!isVersionLesson) {
  return invalidRequest("Lesson is not part of the learner curriculum version.")
}
```

- [ ] **단계 4: 통과 확인**

실행:

```bash
bun --filter @workspace/core test -- learning.service.test.ts
bun --filter @workspace/core test
```

기대 결과: core 테스트가 모두 통과한다.

- [ ] **단계 5: 커밋**

```bash
git add packages/core/src/learning/learning.service.ts packages/core/src/learning/learning.service.test.ts
git commit -m "답변 저장에 진행 버전 검증 추가"
```

## 작업 3: API 통합 테스트로 읽기 경계 고정

**파일:**

- 생성: `apps/api/src/versioned-learning.integration.test.ts`

- [ ] **단계 1: 실패 테스트 작성**

`apps/api/src/versioned-learning.integration.test.ts`를 생성하고 다음 fixture와 테스트를 추가한다.

```ts
import { Database } from "bun:sqlite"
import { beforeEach, describe, expect, it } from "vitest"

import { createAiFeedbackService } from "@workspace/core/ai-feedback"
import { createContentService } from "@workspace/core/content"
import { createLearningService } from "@workspace/core/learning"
import {
  createDatabase,
  createDrizzleContentRepository,
  createDrizzleFeedbackRepository,
  createDrizzleLearningRepository,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  runContentMigration,
  seedContent,
  user,
} from "@workspace/db"

import { createApiApp, type ApiLogger } from "@/app"
import type { CurrentAuthSession } from "@/auth/session"

const now = new Date("2026-05-28T00:00:00.000Z")

const silentLogger: ApiLogger = {
  error() {},
  info() {},
}

const testSession: CurrentAuthSession = {
  session: { id: "session-1" },
  user: {
    email: "learner@example.com",
    id: "user-1",
    image: null,
    name: "학습자",
  },
}

describe("version-aware learning API", () => {
  let sqlite: Database
  let db: ReturnType<typeof createDatabase>
  let app: ReturnType<typeof createVersionedLearningTestApp>

  beforeEach(async () => {
    sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    db = createDatabase(sqlite)
    await seedContent(db)
    await db.insert(user).values({
      id: "user-1",
      name: "학습자",
      email: "learner@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    app = createVersionedLearningTestApp(db)
  })

  it("keeps learner progress on the started version when a newer public version exists", async () => {
    const completeResponse = await app.request(
      "/lessons/sentence-structure-01/complete",
      { method: "POST" }
    )
    expect(completeResponse.status).toBe(200)

    await insertSentenceStructureV2()

    const publicResponse = await app.request("/courses/sentence-structure")
    const progressResponse = await app.request(
      "/courses/sentence-structure/progress"
    )

    expect(publicResponse.status).toBe(200)
    await expect(publicResponse.json()).resolves.toMatchObject({
      firstLessonId: "sentence-structure-01",
      lessonCount: 1,
    })
    expect(progressResponse.status).toBe(200)
    await expect(progressResponse.json()).resolves.toEqual({
      completedCount: 1,
      courseId: "sentence-structure",
      nextLessonId: "sentence-structure-02",
      progressPercent: 8,
      totalLessons: 12,
    })
  })

  it("rejects progress and answers for lessons outside the learner version", async () => {
    await insertSentenceStructureV2()

    const startResponse = await app.request(
      "/lessons/sentence-structure-01/progress",
      {
        body: JSON.stringify({
          currentStepId: "sentence-structure-01-step-2",
          stepOrder: 2,
        }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      }
    )
    expect(startResponse.status).toBe(200)

    const progressResponse = await app.request(
      "/lessons/sentence-structure-12/progress",
      {
        body: JSON.stringify({
          currentStepId: "sentence-structure-12-step-2",
          stepOrder: 2,
        }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      }
    )
    const answerResponse = await app.request(
      "/lessons/sentence-structure-12/answers",
      {
        body: JSON.stringify({
          answer: "진행 버전 밖 답변입니다.",
          stepId: "sentence-structure-12-step-2",
        }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      }
    )

    expect(progressResponse.status).toBe(400)
    await expect(progressResponse.json()).resolves.toEqual({
      code: "invalid-request",
      message: "Lesson is not part of the learner curriculum version.",
    })
    expect(answerResponse.status).toBe(400)
    await expect(answerResponse.json()).resolves.toEqual({
      code: "invalid-request",
      message: "Lesson is not part of the learner curriculum version.",
    })
  })

  async function insertSentenceStructureV2() {
    await db.insert(curriculumVersions).values({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "published",
      title: "문장 구조의 기본 v2",
      changelog: "API 경계 검증",
      publishedAt: now,
      createdAt: now,
    })
    await db.insert(curriculumVersionChapters).values({
      id: "sentence-structure-chapter-1-v2",
      curriculumVersionId: "sentence-structure-v2",
      sourceChapterId: "sentence-structure-chapter-1",
      label: "1단원",
      title: "새 문장의 뼈대",
      sortOrder: 1,
      status: "active",
    })
    await db.insert(curriculumVersionLessons).values({
      id: "sentence-structure-01-v2",
      curriculumVersionId: "sentence-structure-v2",
      chapterId: "sentence-structure-chapter-1-v2",
      lessonId: "sentence-structure-01",
      title: "새 주어와 서술어 찾기",
      description: "최신 published 버전의 레슨 설명입니다.",
      sortOrder: 1,
      status: "active",
    })
  }
})

function createVersionedLearningTestApp(db: ReturnType<typeof createDatabase>) {
  const contentService = createContentService({
    repository: createDrizzleContentRepository(db),
  })
  const learningRepository = createDrizzleLearningRepository(db, {
    now: () => now,
  })
  const learningService = createLearningService({
    contentService,
    repository: learningRepository,
  })

  return createApiApp({
    aiFeedbackService: createAiFeedbackService({
      contentService,
      feedbackRepository: createDrizzleFeedbackRepository(db),
      learningRepository,
      provider: {
        async createFeedback() {
          return {
            improvements: [],
            nextAction: "다음 문장을 점검하세요.",
            score: 4,
            scoreRange: [0, 5],
            strengths: ["문장이 명확합니다."],
            summary: "좋습니다.",
          }
        },
      },
    }),
    auth: {
      async getSession() {
        return testSession
      },
      async handler() {
        return new Response(null, { status: 404 })
      },
    },
    async checkDatabase() {
      return true
    },
    contentService,
    learningService,
    logger: silentLogger,
  })
}
```

- [ ] **단계 2: 실패 확인**

실행:

```bash
bun --filter @workspace/api test -- versioned-learning.integration.test.ts
```

기대 결과: 답변 저장이 아직 버전 밖 레슨을 거절하지 않아 두 번째 테스트가 실패한다.

- [ ] **단계 3: 통과 확인**

작업 2 구현 후 실행:

```bash
bun --filter @workspace/api test -- versioned-learning.integration.test.ts
bun --filter @workspace/api test
```

기대 결과: API 테스트가 모두 통과한다.

- [ ] **단계 4: 커밋**

```bash
git add apps/api/src/versioned-learning.integration.test.ts
git commit -m "API 버전 인식 읽기 경로 회귀 테스트 추가"
```

## 작업 4: 문서 갱신과 전체 검증

**파일:**

- 수정: `BACKEND.md`
- 수정: `docs/admin-site.md`
- 수정: `docs/platform-backend-api.md`

- [ ] **단계 1: 문서 갱신**

`BACKEND.md`에 다음 내용을 반영한다.

```md
공개 콘텐츠 API는 최신 published 커리큘럼 버전을 반환하지만, 인증된 진행 API는 사용자의 `course_progress.curriculum_version_id`를 기준으로 진행률과 다음 레슨을 계산한다. 진행 저장, 완료, 답변 저장은 대상 레슨이 학습자의 진행 버전에 포함될 때만 허용한다.
```

`docs/admin-site.md`와 `docs/platform-backend-api.md` 상단에 구현 시작/완료 로그를 추가한다.

- [ ] **단계 2: 검색 확인**

실행:

```bash
rg -n "버전 인식 읽기|진행 버전|답변 저장|published" BACKEND.md docs/admin-site.md docs/platform-backend-api.md
```

기대 결과: 공개 최신 버전과 진행 버전의 분리 정책이 문서에 드러난다.

- [ ] **단계 3: 전체 검증**

실행:

```bash
bun prettier --write BACKEND.md docs/admin-site.md docs/platform-backend-api.md apps/api/src/versioned-learning.integration.test.ts packages/core/src/learning/learning.service.ts packages/core/src/learning/learning.service.test.ts
bun --filter @workspace/core test
bun --filter @workspace/api test
bun run test
git diff --check
```

기대 결과: 모든 명령이 종료 코드 0으로 끝난다.

- [ ] **단계 4: 커밋**

```bash
git add BACKEND.md docs/admin-site.md docs/platform-backend-api.md
git commit -m "버전 인식 읽기 경로 문서 갱신"
```

## 자체 검토

- 4단계 핵심 요구인 공개 최신 버전과 인증 진행 버전 분리를 실제 API 통합 테스트로 검증한다.
- 답변 저장 버전 검증은 진행 저장/완료와 같은 정책으로 추가한다.
- DTO 변경, 관리자 발행, 업그레이드 UX, 마이그레이션 맵은 제외 범위에 남겼다.
- 모든 코드 변경은 실패 테스트 확인 후 구현한다.
