# 웹 API 클라이언트 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 태스크 단위로 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [x]`) 문법을 사용한다.

**목표:** `openapi-typescript`와 `openapi-fetch`로 타입 안전한 웹 API 클라이언트를 만들고, `apps/web`를 백엔드 없이도 테스트 가능한 API 포트 구조로 전환한다.

**아키텍처:** OpenAPI 타입은 `apps/docs/openapi/writing-app-api.json`에서 생성한다. UI와 feature 로직은 `WritingAppApi` 포트와 내부 모델만 사용하고, 실제 HTTP 어댑터와 fake 어댑터는 `apps/web/src/lib/api` 안에서 교체한다.

**기술 스택:** Next.js 16 App Router, React 19, TypeScript 5.9, Bun, Vitest, `openapi-typescript`, `openapi-fetch`

---

## 파일 구조

- 수정: `apps/web/package.json`
  - `openapi-fetch`, `openapi-typescript`, `vitest`, `vite-tsconfig-paths`, `jsdom`, Testing Library 의존성과 `api:generate`, `test` 스크립트를 추가한다.
- 생성: `apps/web/vitest.config.ts`
  - 웹 앱 단위 테스트 설정을 둔다.
- 수정: `vitest.workspace.ts`
  - 웹 앱 테스트 설정을 워크스페이스에 포함한다.
- 생성: `apps/web/src/lib/api/generated/writing-app-api.d.ts`
  - OpenAPI 생성 타입 산출물이다.
- 생성: `apps/web/src/lib/api/api-result.ts`
  - `ApiResult<T>`와 성공/오류 헬퍼를 둔다.
- 생성: `apps/web/src/lib/api/api-error.ts`
  - HTTP 오류와 네트워크 오류를 프론트 오류 모델로 정리한다.
- 생성: `apps/web/src/lib/api/writing-app-api.ts`
  - 프론트가 사용하는 API 포트와 입력/출력 타입을 정의한다.
- 생성: `apps/web/src/lib/api/http/openapi-client.ts`
  - `openapi-fetch` 클라이언트 factory를 둔다.
- 생성: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`
  - OpenAPI HTTP 호출을 `WritingAppApi` 포트로 감싼다.
- 생성: `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts`
  - 정적 데이터와 메모리 상태를 사용하는 fake 어댑터를 둔다.
- 생성: `apps/web/src/lib/api/get-server-writing-app-api.ts`
  - 서버 환경 변수에 따라 서버 컴포넌트 조회용 HTTP 또는 fake 어댑터를 선택한다.
- 생성: `apps/web/src/lib/api/get-browser-writing-app-api.ts`
  - 공개 환경 변수에 따라 클라이언트 컴포넌트 mutation용 HTTP 또는 fake 어댑터를 선택한다.
- 생성: `apps/web/src/features/courses/course-api-mappers.ts`
  - 백엔드 DTO를 `Course`, `CourseCategory`, `CourseDetail`로 변환한다.
- 수정: `apps/web/src/features/courses/course-data.ts`
  - 정적 데이터 export는 fake 어댑터 seed로 유지한다.
- 수정: `apps/web/src/features/courses/course-detail-data.ts`
  - 기존 helper는 fake seed와 mapper가 재사용할 수 있게 유지한다.
- 생성: `apps/web/src/features/lessons/lesson-api-mappers.ts`
  - 백엔드 레슨 DTO를 `Lesson` 내부 모델로 변환한다.
- 수정: `apps/web/src/app/courses/page.tsx`
  - API 포트로 코스 목록을 조회한다.
- 수정: `apps/web/src/app/courses/[id]/page.tsx`
  - API 포트로 코스 상세와 진행률을 조회해 화면 모델을 만든다.
- 수정: `apps/web/src/app/lesson/page.tsx`
  - API 포트로 레슨 상세와 진행 상태를 조회한다.
- 수정: `apps/web/src/features/lessons/lesson-experience.tsx`
  - 저장, 완료, AI 피드백을 주입 가능한 API 함수로 호출한다.
- 수정: `docs/frontend-api-client.md`
  - 구현 시작과 완료 내용을 기록한다.
- 수정: `FRONTEND.md`
  - 실제 파일 구조와 환경 변수 이름을 반영한다.

---

## Task 1: 의존성과 타입 생성 스크립트

**파일:**

- 수정: `apps/web/package.json`
- 생성: `apps/web/vitest.config.ts`
- 수정: `vitest.workspace.ts`
- 생성: `apps/web/src/lib/api/generated/writing-app-api.d.ts`

- [x] **Step 1: 의존성 설치 전 현재 스크립트를 확인한다**

실행:

```bash
cat apps/web/package.json
```

예상: `api:generate`와 `test` 스크립트가 아직 없다.

- [x] **Step 2: 웹 앱 의존성과 스크립트를 추가한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun add --filter @workspace/web openapi-fetch
PATH="/Users/mac/.bun/bin:$PATH" bun add --filter @workspace/web -d openapi-typescript vitest vite-tsconfig-paths jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

그다음 `apps/web/package.json`의 scripts에 다음 항목을 포함한다:

```json
{
  "scripts": {
    "api:generate": "openapi-typescript ../../apps/docs/openapi/writing-app-api.json -o src/lib/api/generated/writing-app-api.d.ts",
    "build": "next build",
    "dev": "next dev",
    "lint": "eslint .",
    "start": "next start",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

- [x] **Step 3: 웹 Vitest 설정을 만든다**

`apps/web/vitest.config.ts` 생성:

```ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
```

- [x] **Step 4: 루트 Vitest workspace에 웹 앱을 추가한다**

`vitest.workspace.ts`의 `projects` 목록에 다음 항목을 포함한다:

```ts
"apps/web/vitest.config.ts",
```

- [x] **Step 5: OpenAPI 타입을 생성한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web api:generate
```

예상: `apps/web/src/lib/api/generated/writing-app-api.d.ts`가 생성되고 `export interface paths`를 포함한다.

- [x] **Step 6: 타입 생성 결과를 검증한다**

실행:

```bash
rg -n "export interface paths|/courses|/ai-feedback" apps/web/src/lib/api/generated/writing-app-api.d.ts
```

예상: `/courses`, `/lessons/{lessonId}`, `/ai-feedback` 경로가 보인다.

- [x] **Step 7: 커밋한다**

실행:

```bash
git add apps/web/package.json apps/web/vitest.config.ts vitest.workspace.ts apps/web/src/lib/api/generated/writing-app-api.d.ts bun.lock
git commit -m "웹 OpenAPI 타입 생성 기반 추가"
```

---

## Task 2: API 포트와 오류 모델

**파일:**

- 생성: `apps/web/src/lib/api/api-result.ts`
- 생성: `apps/web/src/lib/api/api-error.ts`
- 생성: `apps/web/src/lib/api/writing-app-api.ts`
- Test: `apps/web/src/lib/api/api-error.test.ts`

- [x] **Step 1: 오류 매핑 테스트를 작성한다**

`apps/web/src/lib/api/api-error.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest"

import { apiErrorFromResponseBody, networkApiError } from "@/lib/api/api-error"

describe("api-error", () => {
  it("maps backend unauthorized responses", () => {
    expect(
      apiErrorFromResponseBody(401, {
        code: "unauthorized",
        message: "Authentication is required.",
      })
    ).toEqual({
      code: "unauthorized",
      message: "Authentication is required.",
    })
  })

  it("maps unknown server responses to unavailable", () => {
    expect(apiErrorFromResponseBody(503, { message: "down" })).toEqual({
      code: "unavailable",
      message: "API is unavailable.",
    })
  })

  it("maps fetch failures to network errors", () => {
    expect(networkApiError()).toEqual({
      code: "network-error",
      message: "Network request failed.",
    })
  })
})
```

- [x] **Step 2: 실패를 확인한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/lib/api/api-error.test.ts
```

예상: `Cannot find module '@/lib/api/api-error'`로 실패한다.

- [x] **Step 3: 결과 타입을 만든다**

`apps/web/src/lib/api/api-result.ts` 생성:

```ts
import type { ApiError } from "@/lib/api/api-error"

export type ApiResult<TValue> =
  | {
      status: "ok"
      value: TValue
    }
  | {
      status: "error"
      error: ApiError
    }

export function apiOk<TValue>(value: TValue): ApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

export function apiFailure<TValue = never>(error: ApiError): ApiResult<TValue> {
  return {
    status: "error",
    error,
  }
}
```

- [x] **Step 4: 오류 모델을 만든다**

`apps/web/src/lib/api/api-error.ts` 생성:

```ts
export type ApiError =
  | {
      code: "unauthorized"
      message: string
    }
  | {
      code: "not-found"
      message: string
    }
  | {
      code: "invalid-request"
      message: string
    }
  | {
      code: "retry-limit-exceeded"
      message: string
    }
  | {
      code: "unavailable"
      message: string
    }
  | {
      code: "network-error"
      message: string
    }
  | {
      code: "contract-error"
      message: string
    }

export function apiErrorFromResponseBody(
  status: number,
  body: unknown
): ApiError {
  const code = readCode(body)
  const message = readMessage(body)

  if (code === "unauthorized") {
    return { code: "unauthorized", message }
  }

  if (
    code === "course-not-found" ||
    code === "lesson-not-found" ||
    code === "answer-not-found" ||
    code === "feedback-step-not-found" ||
    status === 404
  ) {
    return { code: "not-found", message }
  }

  if (code === "invalid-request" || status === 400) {
    return { code: "invalid-request", message }
  }

  if (code === "feedback-retry-limit-exceeded" || status === 429) {
    return { code: "retry-limit-exceeded", message }
  }

  if (
    status >= 500 ||
    code === "database-unavailable" ||
    code === "ai-feedback-unavailable"
  ) {
    return { code: "unavailable", message: "API is unavailable." }
  }

  return {
    code: "contract-error",
    message: "API response did not match the expected contract.",
  }
}

export function networkApiError(): ApiError {
  return {
    code: "network-error",
    message: "Network request failed.",
  }
}

function readCode(body: unknown) {
  if (isObject(body) && typeof body.code === "string") {
    return body.code
  }

  return undefined
}

function readMessage(body: unknown) {
  if (isObject(body) && typeof body.message === "string") {
    return body.message
  }

  return "API request failed."
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
```

- [x] **Step 5: API 포트를 정의한다**

`apps/web/src/lib/api/writing-app-api.ts` 생성:

```ts
import type { Course, CourseCategory } from "@/features/courses/course-data"
import type {
  CourseDetail,
  CourseProgress,
} from "@/features/courses/course-detail-data"
import type {
  Lesson,
  LessonId,
  LessonStepId,
} from "@/features/lessons/lesson-types"
import type { ApiResult } from "@/lib/api/api-result"

export interface CurrentUser {
  email: string
  id: string
  image: string | null
  name: string
}

export interface ProfileSummary {
  completedLessonCount: number
  courseCount: number
}

export interface LessonAnswer {
  answer: string
  stepId: LessonStepId
}

export interface LessonProgress {
  answers: readonly LessonAnswer[]
  currentStepId: LessonStepId
  lessonId: LessonId
  status: "not-started" | "in-progress" | "completed"
  stepOrder: number
}

export interface SaveLessonProgressInput {
  currentStepId: LessonStepId
  stepOrder: number
}

export interface SaveLessonAnswerInput {
  answer: string
  stepId: LessonStepId
}

export interface CompleteLessonResult {
  completedAt: string
  completedCount: number
  lessonId: LessonId
  status: "completed"
  wasAlreadyCompleted: boolean
}

export interface CreateAiFeedbackInput {
  answer?: string
  feedbackStepId: LessonStepId
  lessonId: LessonId
}

export interface AiFeedbackResult {
  improvements: readonly string[]
  nextAction: string
  score: number
  scoreRange: readonly [number, number]
  strengths: readonly string[]
  summary: string
}

export interface WritingAppApi {
  listCourseCategories(): Promise<ApiResult<readonly CourseCategory[]>>
  searchCourses(query: string): Promise<ApiResult<readonly Course[]>>
  getCourseDetail(courseId: Course["id"]): Promise<ApiResult<CourseDetail>>
  getLesson(lessonId: LessonId): Promise<ApiResult<Lesson>>
  getCurrentUser(): Promise<ApiResult<CurrentUser>>
  getProfile(): Promise<ApiResult<ProfileSummary>>
  getCourseProgress(courseId: Course["id"]): Promise<ApiResult<CourseProgress>>
  getLessonProgress(lessonId: LessonId): Promise<ApiResult<LessonProgress>>
  saveLessonProgress(
    lessonId: LessonId,
    input: SaveLessonProgressInput
  ): Promise<ApiResult<LessonProgress>>
  saveLessonAnswer(
    lessonId: LessonId,
    input: SaveLessonAnswerInput
  ): Promise<ApiResult<{ saved: true }>>
  completeLesson(lessonId: LessonId): Promise<ApiResult<CompleteLessonResult>>
  createAiFeedback(
    input: CreateAiFeedbackInput
  ): Promise<ApiResult<AiFeedbackResult>>
}
```

- [x] **Step 6: 테스트를 통과시킨다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/lib/api/api-error.test.ts
```

예상: `api-error.test.ts`가 통과한다.

- [x] **Step 7: 커밋한다**

실행:

```bash
git add apps/web/src/lib/api
git commit -m "웹 API 포트와 오류 모델 추가"
```

---

## Task 3: 코스와 레슨 mapper

**파일:**

- 생성: `apps/web/src/features/courses/course-api-mappers.ts`
- 생성: `apps/web/src/features/courses/course-api-mappers.test.ts`
- 생성: `apps/web/src/features/lessons/lesson-api-mappers.ts`
- 생성: `apps/web/src/features/lessons/lesson-api-mappers.test.ts`

- [x] **Step 1: 코스 mapper 테스트를 작성한다**

`apps/web/src/features/courses/course-api-mappers.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest"

import {
  mapCourseCategoriesDto,
  mapCourseDetailDto,
  mergeCourseProgress,
} from "@/features/courses/course-api-mappers"

describe("course-api-mappers", () => {
  it("maps course categories from API DTOs", () => {
    const categories = mapCourseCategoriesDto({
      categories: [
        {
          id: "beginner",
          title: "입문",
          courses: [
            {
              id: "sentence-structure",
              title: "문장 구조",
              description: "문장 구조를 배웁니다.",
              lessonCount: 1,
              thumbnail: "/course-thumbnails/sentence-structure.png",
            },
          ],
        },
      ],
    })

    expect(categories[0]?.courses[0]?.id).toBe("sentence-structure")
  })

  it("maps course detail and merges progress", () => {
    const course = mapCourseDetailDto({
      id: "sentence-structure",
      title: "문장 구조",
      description: "문장 구조를 배웁니다.",
      thumbnail: "/course-thumbnails/sentence-structure.png",
      lessonCount: 1,
      firstLessonId: "sentence-structure-01",
      chapters: [
        {
          id: "chapter-1",
          label: "1단원",
          title: "문장의 뼈대",
          lessons: [
            {
              id: "course-lesson-1",
              lessonId: "sentence-structure-01",
              title: "주어 찾기",
              description: "주어를 찾습니다.",
              order: 1,
            },
          ],
        },
      ],
    })

    const merged = mergeCourseProgress(course, {
      completedCount: 1,
      totalLessons: 1,
      progressPercent: 100,
      nextLessonId: undefined,
    })

    expect(merged.progress.percentage).toBe(100)
    expect(merged.chapters[0]?.lessons[0]?.completed).toBe(true)
  })
})
```

- [x] **Step 2: 레슨 mapper 테스트를 작성한다**

`apps/web/src/features/lessons/lesson-api-mappers.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest"

import { mapLessonDto } from "@/features/lessons/lesson-api-mappers"

describe("lesson-api-mappers", () => {
  it("maps playable API lesson DTOs", () => {
    const lesson = mapLessonDto({
      id: "sentence-structure-01",
      title: "주어 찾기",
      categoryId: "beginner",
      courseId: "sentence-structure",
      unitNumber: 1,
      nextLessonId: "sentence-structure-02",
      steps: [
        {
          id: "sentence-structure-01-step-1",
          type: "INTRO",
          order: 1,
          points: 10,
          required: true,
          content: {
            title: "주어 찾기",
            category: "문장 구조",
            tagTone: "info",
            bullets: ["주어를 찾습니다."],
            estimatedMinutes: 8,
            totalSteps: 1,
            xpAvailable: 10,
          },
        },
      ],
    })

    expect(lesson.id).toBe("sentence-structure-01")
    expect(lesson.steps[0]?.type).toBe("INTRO")
  })
})
```

- [x] **Step 3: 실패를 확인한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/features/courses/course-api-mappers.test.ts src/features/lessons/lesson-api-mappers.test.ts
```

예상: mapper 파일이 없어 실패한다.

- [x] **Step 4: 코스 mapper를 구현한다**

`apps/web/src/features/courses/course-api-mappers.ts` 생성:

```ts
import {
  courseId,
  type Course,
  type CourseCategory,
} from "@/features/courses/course-data"
import type {
  CourseChapter,
  CourseDetail,
  CourseLesson,
  CourseProgress,
} from "@/features/courses/course-detail-data"

interface CourseCategoryListDto {
  categories: readonly {
    id: string
    title: string
    courses: readonly CourseSummaryDto[]
  }[]
}

interface CourseSummaryDto {
  id: string
  title: string
  description: string
  lessonCount: number
  thumbnail: string
}

interface CourseDetailDto {
  id: string
  title: string
  description: string
  thumbnail: string
  lessonCount: number
  firstLessonId?: string
  chapters: readonly {
    id: string
    label: string
    title: string
    lessons: readonly {
      id: string
      lessonId: string
      title: string
      description: string
      order: number
    }[]
  }[]
}

interface CourseProgressDto {
  completedCount: number
  nextLessonId?: string
  progressPercent: number
  totalLessons: number
}

export function mapCourseCategoriesDto(
  dto: CourseCategoryListDto
): readonly CourseCategory[] {
  return dto.categories.map((category) => ({
    id: category.id,
    title: category.title,
    courses: category.courses.map(mapCourseSummaryDto),
  }))
}

export function mapCourseSearchDto(dto: {
  courses: readonly CourseSummaryDto[]
}): readonly Course[] {
  return dto.courses.map(mapCourseSummaryDto)
}

export function mapCourseDetailDto(dto: CourseDetailDto): CourseDetail {
  const chapters = dto.chapters.map(
    (chapter): CourseChapter => ({
      id: chapter.id as CourseChapter["id"],
      label: chapter.label,
      title: chapter.title,
      lessons: chapter.lessons.map(
        (lesson): CourseLesson => ({
          id: lesson.id as CourseLesson["id"],
          lessonId: lesson.lessonId as CourseLesson["lessonId"],
          title: lesson.title,
          description: lesson.description,
          completed: false,
        })
      ),
    })
  )
  const firstLesson = chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      chapterLabel: chapter.label,
      lesson,
    }))
  )[0]

  if (!firstLesson) {
    throw new Error(`Course detail must include at least one lesson: ${dto.id}`)
  }

  return {
    id: courseId(dto.id),
    title: dto.title,
    description: dto.description,
    thumbnail: dto.thumbnail,
    progress: {
      completedLessons: 0,
      totalLessons: dto.lessonCount,
      percentage: 0,
    },
    nextLesson: {
      chapterLabel: firstLesson.chapterLabel,
      title: firstLesson.lesson.title,
      description: firstLesson.lesson.description,
      lessonId: firstLesson.lesson.lessonId,
    },
    chapters,
  }
}

export function mergeCourseProgress(
  course: CourseDetail,
  progress: CourseProgressDto
): CourseDetail {
  let remainingCompleted = progress.completedCount
  const chapters = course.chapters.map((chapter) => ({
    ...chapter,
    lessons: chapter.lessons.map((lesson) => {
      const completed = remainingCompleted > 0
      if (completed) {
        remainingCompleted -= 1
      }

      return {
        ...lesson,
        completed,
      }
    }),
  }))
  const nextLessonSource =
    chapters
      .flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          chapterLabel: chapter.label,
          lesson,
        }))
      )
      .find(({ lesson }) => lesson.lessonId === progress.nextLessonId) ??
    chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        chapterLabel: chapter.label,
        lesson,
      }))
    )[0]

  return {
    ...course,
    chapters,
    progress: mapCourseProgressDto(progress),
    nextLesson: nextLessonSource
      ? {
          chapterLabel: nextLessonSource.chapterLabel,
          title: nextLessonSource.lesson.title,
          description: nextLessonSource.lesson.description,
          lessonId: nextLessonSource.lesson.lessonId,
        }
      : course.nextLesson,
  }
}

function mapCourseSummaryDto(dto: CourseSummaryDto): Course {
  return {
    id: courseId(dto.id),
    title: dto.title,
    description: dto.description,
    lessonCount: dto.lessonCount,
    thumbnail: dto.thumbnail,
  }
}

function mapCourseProgressDto(dto: CourseProgressDto): CourseProgress {
  return {
    completedLessons: dto.completedCount,
    totalLessons: dto.totalLessons,
    percentage: dto.progressPercent,
  }
}
```

- [x] **Step 5: 레슨 mapper를 구현한다**

`apps/web/src/features/lessons/lesson-api-mappers.ts` 생성:

```ts
import { lessonId, lessonStepId } from "@/features/lessons/lesson-data"
import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"

interface LessonDto {
  id: string
  title: string
  categoryId: string
  courseId: string
  unitNumber: number
  nextLessonId?: string
  steps: readonly LessonStepDto[]
}

type LessonStepDto = Omit<LessonStep, "id"> & {
  id: string
}

export function mapLessonDto(dto: LessonDto): Lesson {
  return {
    id: lessonId(dto.id),
    title: dto.title,
    categoryId: dto.categoryId,
    courseId: dto.courseId,
    unitNumber: dto.unitNumber,
    nextLessonId: dto.nextLessonId ? lessonId(dto.nextLessonId) : undefined,
    steps: dto.steps.map((step) => ({
      ...step,
      id: lessonStepId(step.id),
    })) as Lesson["steps"],
  }
}
```

- [x] **Step 6: mapper 테스트를 통과시킨다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/features/courses/course-api-mappers.test.ts src/features/lessons/lesson-api-mappers.test.ts
```

예상: 두 테스트 파일이 통과한다.

- [x] **Step 7: 커밋한다**

실행:

```bash
git add apps/web/src/features/courses/course-api-mappers.ts apps/web/src/features/courses/course-api-mappers.test.ts apps/web/src/features/lessons/lesson-api-mappers.ts apps/web/src/features/lessons/lesson-api-mappers.test.ts
git commit -m "웹 API 응답 mapper 추가"
```

---

## Task 4: HTTP 어댑터

**파일:**

- 생성: `apps/web/src/lib/api/http/openapi-client.ts`
- 생성: `apps/web/src/lib/api/http/create-http-writing-app-api.ts`
- 생성: `apps/web/src/lib/api/http/create-http-writing-app-api.test.ts`

- [x] **Step 1: HTTP 어댑터 테스트를 작성한다**

`apps/web/src/lib/api/http/create-http-writing-app-api.test.ts` 생성:

```ts
import { describe, expect, it, vi } from "vitest"

import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"

describe("createHttpWritingAppApi", () => {
  it("requests course categories with credentials", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        categories: [],
      })
    )
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    const result = await api.listCourseCategories()

    expect(result.status).toBe("ok")
    const request = fetch.mock.calls[0]?.[0] as Request
    expect(request.url).toBe("http://localhost:4000/courses")
    expect(request.credentials).toBe("include")
  })

  it("maps HTTP errors", async () => {
    const fetch = vi.fn(async () =>
      Response.json(
        {
          code: "unauthorized",
          message: "Authentication is required.",
        },
        { status: 401 }
      )
    )
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    await expect(api.getCurrentUser()).resolves.toEqual({
      status: "error",
      error: {
        code: "unauthorized",
        message: "Authentication is required.",
      },
    })
  })
})
```

- [x] **Step 2: 실패를 확인한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/lib/api/http/create-http-writing-app-api.test.ts
```

예상: HTTP 어댑터 파일이 없어 실패한다.

- [x] **Step 3: OpenAPI client factory를 만든다**

`apps/web/src/lib/api/http/openapi-client.ts` 생성:

```ts
import createClient from "openapi-fetch"

import type { paths } from "@/lib/api/generated/writing-app-api"

export interface CreateOpenApiClientInput {
  baseUrl: string
  fetch?: typeof globalThis.fetch
}

export function createOpenApiClient(input: CreateOpenApiClientInput) {
  return createClient<paths>({
    baseUrl: input.baseUrl,
    credentials: "include",
    fetch: input.fetch,
  })
}
```

- [x] **Step 4: HTTP 어댑터를 구현한다**

`apps/web/src/lib/api/http/create-http-writing-app-api.ts` 생성:

```ts
import type { Course } from "@/features/courses/course-data"
import {
  mapCourseCategoriesDto,
  mapCourseDetailDto,
  mapCourseSearchDto,
  mergeCourseProgress,
} from "@/features/courses/course-api-mappers"
import { mapLessonDto } from "@/features/lessons/lesson-api-mappers"
import type { LessonId } from "@/features/lessons/lesson-types"
import { apiErrorFromResponseBody, networkApiError } from "@/lib/api/api-error"
import { apiFailure, apiOk, type ApiResult } from "@/lib/api/api-result"
import type {
  AiFeedbackResult,
  CompleteLessonResult,
  CreateAiFeedbackInput,
  CurrentUser,
  ProfileSummary,
  SaveLessonAnswerInput,
  SaveLessonProgressInput,
  WritingAppApi,
} from "@/lib/api/writing-app-api"
import {
  createOpenApiClient,
  type CreateOpenApiClientInput,
} from "@/lib/api/http/openapi-client"

export function createHttpWritingAppApi(
  input: CreateOpenApiClientInput
): WritingAppApi {
  const client = createOpenApiClient(input)

  return {
    async listCourseCategories() {
      return request(() => client.GET("/courses"), mapCourseCategoriesDto)
    },
    async searchCourses(query) {
      return request(
        () =>
          client.GET("/courses/search", {
            params: { query: { q: query } },
          }),
        mapCourseSearchDto
      )
    },
    async getCourseDetail(courseId) {
      const course = await request(
        () =>
          client.GET("/courses/{courseId}", {
            params: { path: { courseId } },
          }),
        mapCourseDetailDto
      )
      if (course.status === "error") {
        return course
      }

      const progress = await this.getCourseProgress(courseId)
      if (progress.status === "error") {
        return apiOk(course.value)
      }

      return apiOk(mergeCourseProgress(course.value, progress.value))
    },
    async getLesson(lessonId) {
      return request(
        () =>
          client.GET("/lessons/{lessonId}", {
            params: { path: { lessonId } },
          }),
        mapLessonDto
      )
    },
    async getCurrentUser() {
      return request(
        () => client.GET("/me"),
        (value) => value as CurrentUser
      )
    },
    async getProfile() {
      return request(
        () => client.GET("/profile"),
        (value) => value as ProfileSummary
      )
    },
    async getCourseProgress(courseId) {
      return request(
        () =>
          client.GET("/courses/{courseId}/progress", {
            params: { path: { courseId } },
          }),
        (value) => ({
          completedLessons: value.completedCount,
          totalLessons: value.totalLessons,
          percentage: value.progressPercent,
        })
      )
    },
    async getLessonProgress(lessonId) {
      return request(
        () =>
          client.GET("/lessons/{lessonId}/progress", {
            params: { path: { lessonId } },
          }),
        (value) => value
      )
    },
    async saveLessonProgress(lessonId, body) {
      return request(
        () =>
          client.PUT("/lessons/{lessonId}/progress", {
            params: { path: { lessonId } },
            body: body as SaveLessonProgressInput,
          }),
        (value) => value
      )
    },
    async saveLessonAnswer(lessonId, body) {
      return request(
        () =>
          client.PUT("/lessons/{lessonId}/answers", {
            params: { path: { lessonId } },
            body: body as SaveLessonAnswerInput,
          }),
        (value) => value
      )
    },
    async completeLesson(lessonId) {
      return request(
        () =>
          client.POST("/lessons/{lessonId}/complete", {
            params: { path: { lessonId } },
          }),
        (value) => value as CompleteLessonResult
      )
    },
    async createAiFeedback(body) {
      return request(
        () =>
          client.POST("/ai-feedback", {
            body: body as CreateAiFeedbackInput,
          }),
        (value) => value as AiFeedbackResult
      )
    },
  }
}

async function request<TData, TValue>(
  run: () => Promise<{
    data?: TData
    error?: unknown
    response: Response
  }>,
  map: (data: TData) => TValue
): Promise<ApiResult<TValue>> {
  try {
    const { data, error, response } = await run()
    if (error || !response.ok) {
      return apiFailure(apiErrorFromResponseBody(response.status, error))
    }
    if (data === undefined) {
      return apiFailure({
        code: "contract-error",
        message: "API response did not include data.",
      })
    }

    return apiOk(map(data))
  } catch {
    return apiFailure(networkApiError())
  }
}
```

- [x] **Step 5: HTTP 어댑터 테스트를 통과시킨다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/lib/api/http/create-http-writing-app-api.test.ts
```

예상: HTTP 어댑터 테스트가 통과한다.

- [x] **Step 6: 타입 검사를 실행한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web typecheck
```

예상: 생성 타입과 literal path 사용이 맞아 타입 검사가 통과한다.

- [x] **Step 7: 커밋한다**

실행:

```bash
git add apps/web/src/lib/api/http
git commit -m "OpenAPI 기반 웹 HTTP 어댑터 추가"
```

---

## Task 5: Fake 어댑터

**파일:**

- 생성: `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts`
- 생성: `apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts`

- [x] **Step 1: fake 어댑터 테스트를 작성한다**

`apps/web/src/lib/api/fake/create-fake-writing-app-api.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest"

import { createFakeWritingAppApi } from "@/lib/api/fake/create-fake-writing-app-api"

describe("createFakeWritingAppApi", () => {
  it("serves course and lesson data without a backend", async () => {
    const api = createFakeWritingAppApi()

    const courses = await api.listCourseCategories()
    const lesson = await api.getLesson("sentence-structure-01" as never)

    expect(courses.status).toBe("ok")
    expect(lesson.status).toBe("ok")
  })

  it("stores lesson progress and answers in isolated memory", async () => {
    const api = createFakeWritingAppApi()

    await api.saveLessonProgress("sentence-structure-01" as never, {
      currentStepId: "sentence-structure-01-step-2" as never,
      stepOrder: 2,
    })
    await api.saveLessonAnswer("sentence-structure-01" as never, {
      stepId: "sentence-structure-01-step-2" as never,
      answer: "문장을 짧게 고쳤다.",
    })

    const progress = await api.getLessonProgress(
      "sentence-structure-01" as never
    )

    expect(progress).toMatchObject({
      status: "ok",
      value: {
        currentStepId: "sentence-structure-01-step-2",
        answers: [
          {
            stepId: "sentence-structure-01-step-2",
            answer: "문장을 짧게 고쳤다.",
          },
        ],
      },
    })
  })
})
```

- [x] **Step 2: 실패를 확인한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/lib/api/fake/create-fake-writing-app-api.test.ts
```

예상: fake 어댑터 파일이 없어 실패한다.

- [x] **Step 3: fake 어댑터를 구현한다**

`apps/web/src/lib/api/fake/create-fake-writing-app-api.ts` 생성:

```ts
import { courseCategories } from "@/features/courses/course-data"
import {
  courseDetails,
  getCourseDetailById,
} from "@/features/courses/course-detail-data"
import { getLessonById } from "@/features/lessons/lesson-data"
import { getMockAiFeedback } from "@/features/lessons/lesson-logic"
import type { LessonId } from "@/features/lessons/lesson-types"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type {
  LessonProgress,
  SaveLessonAnswerInput,
  SaveLessonProgressInput,
  WritingAppApi,
} from "@/lib/api/writing-app-api"

export function createFakeWritingAppApi(): WritingAppApi {
  const progressByLesson = new Map<string, LessonProgress>()
  const answersByLesson = new Map<string, SaveLessonAnswerInput[]>()

  return {
    async listCourseCategories() {
      return apiOk(courseCategories)
    },
    async searchCourses(query) {
      const normalizedQuery = query.trim()
      if (!normalizedQuery) {
        return apiFailure({
          code: "invalid-request",
          message: "Search query is required.",
        })
      }

      return apiOk(
        courseCategories.flatMap((category) =>
          category.courses.filter((course) =>
            `${course.title} ${course.description}`.includes(normalizedQuery)
          )
        )
      )
    },
    async getCourseDetail(courseId) {
      const course = getCourseDetailById(courseId)
      if (!course) {
        return apiFailure({
          code: "not-found",
          message: "Course was not found.",
        })
      }

      return apiOk(course)
    },
    async getLesson(lessonId) {
      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "Lesson was not found.",
        })
      }

      return apiOk(lesson)
    },
    async getCurrentUser() {
      return apiOk({
        email: "learner@example.com",
        id: "fake-user",
        image: null,
        name: "학습자",
      })
    },
    async getProfile() {
      return apiOk({
        completedLessonCount: [...progressByLesson.values()].filter(
          (progress) => progress.status === "completed"
        ).length,
        courseCount: courseDetails.length,
      })
    },
    async getCourseProgress(courseId) {
      const course = getCourseDetailById(courseId)
      if (!course) {
        return apiFailure({
          code: "not-found",
          message: "Course was not found.",
        })
      }

      return apiOk(course.progress)
    },
    async getLessonProgress(lessonId) {
      const stored = progressByLesson.get(lessonId)
      if (stored) {
        return apiOk({
          ...stored,
          answers: answersByLesson.get(lessonId) ?? [],
        })
      }

      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "Lesson was not found.",
        })
      }
      const firstStep = lesson.steps[0]

      return apiOk({
        answers: [],
        currentStepId: firstStep.id,
        lessonId,
        status: "not-started",
        stepOrder: firstStep.order,
      })
    },
    async saveLessonProgress(lessonId, input) {
      const current: LessonProgress = {
        answers: answersByLesson.get(lessonId) ?? [],
        currentStepId: input.currentStepId,
        lessonId,
        status: "in-progress",
        stepOrder: input.stepOrder,
      }
      progressByLesson.set(lessonId, current)

      return apiOk(current)
    },
    async saveLessonAnswer(lessonId, input) {
      const answers =
        answersByLesson
          .get(lessonId)
          ?.filter((answer) => answer.stepId !== input.stepId) ?? []
      answersByLesson.set(lessonId, [...answers, input])

      return apiOk({ saved: true })
    },
    async completeLesson(lessonId) {
      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "Lesson was not found.",
        })
      }
      const finalStep = lesson.steps.at(-1)
      if (!finalStep) {
        return apiFailure({
          code: "contract-error",
          message: "Lesson does not include steps.",
        })
      }

      progressByLesson.set(lessonId, {
        answers: answersByLesson.get(lessonId) ?? [],
        currentStepId: finalStep.id,
        lessonId,
        status: "completed",
        stepOrder: finalStep.order,
      })

      return apiOk({
        completedAt: new Date(0).toISOString(),
        completedCount: [...progressByLesson.values()].filter(
          (progress) => progress.status === "completed"
        ).length,
        lessonId,
        status: "completed",
        wasAlreadyCompleted: false,
      })
    },
    async createAiFeedback(input) {
      const feedback = getMockAiFeedback()

      return apiOk({
        improvements: feedback.improve,
        nextAction: "개선 포인트 중 하나를 골라 다시 써보세요.",
        score: 82,
        scoreRange: [0, 100],
        strengths: feedback.good,
        summary: input.answer
          ? "작성 답변의 의도는 분명합니다."
          : "저장된 답변을 기준으로 피드백을 만들었습니다.",
      })
    },
  }
}
```

- [x] **Step 4: fake 어댑터 테스트를 통과시킨다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test -- src/lib/api/fake/create-fake-writing-app-api.test.ts
```

예상: fake 어댑터 테스트가 통과한다.

- [x] **Step 5: 커밋한다**

실행:

```bash
git add apps/web/src/lib/api/fake
git commit -m "백엔드 없는 웹 API fake 어댑터 추가"
```

---

## Task 6: API 어댑터 선택과 페이지 연결

**파일:**

- 생성: `apps/web/src/lib/api/get-server-writing-app-api.ts`
- 생성: `apps/web/src/lib/api/get-browser-writing-app-api.ts`
- 수정: `apps/web/src/app/courses/page.tsx`
- 수정: `apps/web/src/app/courses/[id]/page.tsx`
- 수정: `apps/web/src/app/lesson/page.tsx`

- [x] **Step 1: 서버 API 선택 모듈을 만든다**

`apps/web/src/lib/api/get-server-writing-app-api.ts` 생성:

```ts
import { createFakeWritingAppApi } from "@/lib/api/fake/create-fake-writing-app-api"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getServerWritingAppApi(): WritingAppApi {
  if ((process.env["WEB_API_MODE"] ?? "fake") === "fake") {
    return createFakeWritingAppApi()
  }

  return createHttpWritingAppApi({
    baseUrl: process.env["WEB_API_BASE_URL"] ?? "http://localhost:4000",
  })
}
```

- [x] **Step 2: 브라우저 API 선택 모듈을 만든다**

`apps/web/src/lib/api/get-browser-writing-app-api.ts` 생성:

```ts
"use client"

import { createFakeWritingAppApi } from "@/lib/api/fake/create-fake-writing-app-api"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi(): WritingAppApi {
  if ((process.env["NEXT_PUBLIC_API_MODE"] ?? "fake") === "fake") {
    return createFakeWritingAppApi()
  }

  return createHttpWritingAppApi({
    baseUrl: process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000",
  })
}
```

- [x] **Step 3: 코스 목록 페이지를 API 포트로 연결한다**

`apps/web/src/app/courses/page.tsx` 수정:

```tsx
import type { Metadata } from "next"

import { CoursesPage } from "@/features/courses/courses-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export const metadata: Metadata = {
  title: "배우기 — 한글쓰기",
  description:
    "체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요. 문장 구조, 문법, 에세이, 비즈니스 글쓰기까지 다양한 코스를 탐색하세요.",
}

export default async function Page() {
  const api = getServerWritingAppApi()
  const categories = await api.listCourseCategories()

  if (categories.status === "error") {
    throw new Error(categories.error.message)
  }

  return <CoursesPage categories={categories.value} />
}
```

`apps/web/src/features/courses/courses-page.tsx`가 props를 받도록 수정한다:

```tsx
import { CourseFeed } from "@/features/courses/course-feed"
import type { CourseCategory } from "@/features/courses/course-data"

interface CoursesPageProps {
  categories: readonly CourseCategory[]
}

export function CoursesPage({ categories }: CoursesPageProps) {
  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-6 pb-12 sm:px-6 sm:pt-9 md:px-8 md:pt-12 md:pb-20">
        <header className="mb-8 flex flex-col gap-2 md:mb-12">
          <h1 className="m-0 text-3xl/9 font-bold tracking-normal md:text-4xl/10">
            학습 코스 둘러보기
          </h1>
          <p className="m-0 max-w-2xl text-base/7 text-muted-foreground md:text-lg/8">
            체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요.
          </p>
        </header>

        <CourseFeed categories={categories} />
      </div>
    </div>
  )
}
```

- [x] **Step 4: 코스 상세 페이지를 API 포트로 연결한다**

`apps/web/src/app/courses/[id]/page.tsx`의 `Page`가 API를 사용하도록 수정한다:

```tsx
export default async function Page({ params }: CoursePageProps) {
  const { id } = await params
  const api = getServerWritingAppApi()
  const course = await api.getCourseDetail(courseId(id))

  if (course.status === "error") {
    if (course.error.code === "not-found") {
      notFound()
    }

    throw new Error(course.error.message)
  }

  return <CourseDetailPage course={course.value} />
}
```

이 단계에서는 fake 친화적인 정적 생성을 위해 기존 정적 helper 기반 `generateStaticParams()`를 유지한다.

- [x] **Step 5: 레슨 페이지를 API 포트로 연결한다**

`apps/web/src/app/lesson/page.tsx`의 `Page`가 레슨 id가 있을 때 API를 사용하도록 수정한다:

```tsx
export default async function Page({ searchParams }: LessonRouteProps) {
  const lessonIdParam = getLessonIdParam((await searchParams).lesson_id)
  const api = getServerWritingAppApi()
  const lesson = lessonIdParam
    ? await api.getLesson(lessonId(lessonIdParam))
    : await api.getLesson(getDefaultLesson().id)

  if (lesson.status === "error") {
    if (lesson.error.code === "not-found") {
      notFound()
    }

    throw new Error(lesson.error.message)
  }

  return <LessonPage lesson={lesson.value} />
}
```

- [x] **Step 6: 타입 검사를 실행한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web typecheck
```

예상: 페이지 props와 API 포트 타입이 맞아 통과한다.

- [x] **Step 7: 빌드를 실행한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web build
```

예상: fake 모드 기본값으로 백엔드 없이 빌드가 통과한다.

- [x] **Step 8: 커밋한다**

실행:

```bash
git add apps/web/src/lib/api/get-server-writing-app-api.ts apps/web/src/lib/api/get-browser-writing-app-api.ts apps/web/src/app/courses/page.tsx 'apps/web/src/app/courses/[id]/page.tsx' apps/web/src/app/lesson/page.tsx apps/web/src/features/courses/courses-page.tsx
git commit -m "웹 페이지를 API 포트로 연결"
```

---

## Task 7: 레슨 mutation과 AI 피드백 연결

**파일:**

- 수정: `apps/web/src/features/lessons/lesson-experience.tsx`

- [x] **Step 1: 레슨 경험 props를 확장한다**

`apps/web/src/features/lessons/lesson-experience.tsx` props 수정:

```ts
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

interface LessonExperienceProps {
  lesson: Lesson
  api?: Pick<
    WritingAppApi,
    | "saveLessonProgress"
    | "saveLessonAnswer"
    | "completeLesson"
    | "createAiFeedback"
  >
}
```

선택적 `api` prop은 `LessonExperience`를 직접 렌더링하는 컴포넌트 테스트용이다. App Router 페이지는 서버 컴포넌트에서 이 클라이언트 컴포넌트로 함수 prop을 전달하지 않는다.

- [x] **Step 2: 진행 저장을 다음 이동에 연결한다**

`handleNext` 안에서 다음 스텝에 대한 `saveLessonProgress`를 호출한다:

```ts
const apiRef = React.useRef(api ?? getBrowserWritingAppApi())

const handleNext = React.useCallback(() => {
  setCurrentStepIndex((index) => {
    const nextIndex = Math.min(index + 1, lesson.steps.length - 1)
    const nextStep = lesson.steps[nextIndex]

    if (nextStep) {
      void apiRef.current.saveLessonProgress(lesson.id, {
        currentStepId: nextStep.id,
        stepOrder: nextStep.order,
      })
    }

    return nextIndex
  })
  scrollToTop()
}, [lesson.id, lesson.steps, scrollToTop])
```

- [x] **Step 3: 작성 답변 저장을 연결한다**

`saveWrittenResponse` 수정:

```ts
const saveWrittenResponse = React.useCallback(
  (stepId: LessonStepId, text: string) => {
    setWrittenResponses((current) => ({
      ...current,
      [stepId]: text,
    }))
    void apiRef.current.saveLessonAnswer(lesson.id, {
      stepId,
      answer: text,
    })
  },
  [lesson.id]
)
```

- [x] **Step 4: 레슨 완료를 연결한다**

완료 스텝 전환 지점에서 다음 함수를 호출한다:

```ts
void apiRef.current.completeLesson(lesson.id)
```

현재 완료 UI로 이동시키는 기존 완료 스텝 handler 안에 배치한다.

- [x] **Step 5: AI 피드백 컴포넌트가 API 결과를 사용하게 한다**

`AiFeedbackStep`이 현재 AI 피드백 스텝 id와 `createAiFeedback`을 받아 그 함수로 피드백을 불러오게 수정한다. `getMockAiFeedback()`은 fake 어댑터 안에만 남긴다.

```ts
function AiFeedbackStep({
  content,
  createAiFeedback,
  lessonId,
  stepId,
  userWrite,
}: {
  content: AiFeedbackContent
  createAiFeedback: WritingAppApi["createAiFeedback"]
  lessonId: LessonId
  stepId: LessonStepId
  userWrite: string
}) {
  const [feedback, setFeedback] = React.useState<AiFeedbackResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    async function loadFeedback() {
      const result = await createAiFeedback({
        answer: userWrite || undefined,
        feedbackStepId: stepId,
        lessonId,
      })

      if (!active) {
        return
      }

      if (result.status === "ok") {
        setFeedback(result.value)
        setErrorMessage(null)
      } else {
        setErrorMessage(result.error.message)
      }
      setLoading(false)
    }

    void loadFeedback()

    return () => {
      active = false
    }
  }, [createAiFeedback, lessonId, stepId, userWrite])
}
```

- [x] **Step 6: 레슨 페이지는 직렬화 가능한 데이터만 전달하는지 확인한다**

`apps/web/src/features/lessons/lesson-page.tsx`는 다음 형태를 유지한다:

```tsx
import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"

interface LessonPageProps {
  lesson: Lesson
}

export function LessonPage({ lesson }: LessonPageProps) {
  return <LessonExperience lesson={lesson} />
}
```

- [x] **Step 7: 타입 검사와 빌드를 실행한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web typecheck
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web build
```

예상: 클라이언트 컴포넌트 번들에서 서버 전용 환경 변수 접근 없이 통과한다.

- [x] **Step 8: 커밋한다**

실행:

```bash
git add apps/web/src/features/lessons/lesson-experience.tsx apps/web/src/features/lessons/lesson-page.tsx
git commit -m "레슨 저장과 AI 피드백을 API 포트에 연결"
```

---

## Task 8: 문서와 최종 검증

**파일:**

- 수정: `FRONTEND.md`
- 수정: `docs/frontend-api-client.md`

- [x] **Step 1: 프론트 문서를 갱신한다**

Add to `FRONTEND.md` API layer section:

```md
### 5.5 현재 웹 API 클라이언트 구조

`apps/web`는 `apps/docs/openapi/writing-app-api.json`에서 `openapi-typescript`로 생성한 타입을 사용한다. 생성 타입은 `apps/web/src/lib/api/generated`에만 두고 UI 컴포넌트는 직접 import하지 않는다.

실제 HTTP 연결은 `openapi-fetch` 기반 HTTP 어댑터가 담당한다. 화면과 feature 로직은 `WritingAppApi` 포트만 사용하며, 테스트와 백엔드 없는 로컬 실행은 fake 어댑터로 같은 포트를 구현한다.

로컬 기본값은 fake 모드다. 백엔드 연동 검증 시 `WEB_API_MODE=http`, `NEXT_PUBLIC_API_MODE=http`, `WEB_API_BASE_URL=http://localhost:4000`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`을 명시한다.
```

- [x] **Step 2: 작업 문서를 완료 상태로 갱신한다**

Append to `docs/frontend-api-client.md`:

```md
## 2026-05-27 구현 완료

- `apps/web`에 OpenAPI 타입 생성 스크립트와 `openapi-fetch` 기반 HTTP 어댑터를 추가했다.
- 프론트 화면은 `WritingAppApi` 포트를 통해 데이터에 접근하며, fake 어댑터로 백엔드 없이 테스트할 수 있다.
- 코스 목록, 코스 상세, 레슨 조회, 진행 저장, 답변 저장, 레슨 완료, AI 피드백 호출 경로를 API 포트로 연결했다.
- 검증 명령은 test, typecheck, lint, build를 실행했다.
```

- [x] **Step 3: 전체 웹 검증을 실행한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web api:generate
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web typecheck
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web lint
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web build
```

예상: 모든 명령이 종료 코드 0을 반환한다.

- [x] **Step 4: 문서 포맷을 확인한다**

실행:

```bash
PATH="/Users/mac/.bun/bin:$PATH" bunx prettier --check FRONTEND.md docs/frontend-api-client.md docs/superpowers/specs/2026-05-27-web-api-client-design.md docs/superpowers/plans/2026-05-27-web-api-client.md
```

예상: 모든 문서가 Prettier 검사에 통과한다.

- [x] **Step 5: 최종 커밋한다**

실행:

```bash
git add FRONTEND.md docs/frontend-api-client.md docs/superpowers/specs/2026-05-27-web-api-client-design.md docs/superpowers/plans/2026-05-27-web-api-client.md
git commit -m "웹 API 클라이언트 전환 문서 갱신"
```

---

## 자체 검토

- 설계의 모든 요구는 태스크로 연결된다. 타입 생성은 Task 1, 포트와 오류 경계는 Task 2, DTO 변환은 Task 3, HTTP 어댑터는 Task 4, 백엔드 없는 격리는 Task 5, 화면 연결은 Task 6과 Task 7, 문서와 검증은 Task 8에서 다룬다.
- 생성 타입은 `lib/api/generated` 밖으로 노출하지 않는다.
- UI는 `openapi-fetch`를 직접 import하지 않는다.
- fake 어댑터는 테스트마다 새 instance를 만들 수 있어 외부 상태와 격리된다.
- 검증 명령은 백엔드 서버 실행 없이 통과하도록 fake 모드를 기본값으로 둔다.
