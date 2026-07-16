import { describe, expect, it, vi } from "vitest"
import {
  learnerCourseDetailSchema,
  learnerCourseSummarySchema,
  learnerLessonSchema,
} from "@workspace/contracts/learning"

import { createLearnerContentService } from "#core/modules/content/application/use-cases/learner-content.service"
import { createLearnerCursorCodec } from "#core/modules/learning/application/learner-cursor"
import type { LearnerReadModelRepository } from "#core/modules/learning/application/ports/learner-read-model.repository"

const cursorCodec = createLearnerCursorCodec(
  "test-cursor-signing-secret-with-32-bytes"
)
const version = {
  curriculumVersionId: "course-1-v1",
  revision: 1,
} as const
const summary = learnerCourseSummarySchema.parse({
  category: "입문",
  contentStatus: "active",
  description: "설명",
  id: "course-1",
  lessonCount: 1,
  title: "글쓰기 입문",
  version,
  visualKey: "basic-sentence-writing",
})
const detail = learnerCourseDetailSchema.parse({
  ...summary,
  learning: {
    completedLessons: 0,
    nextLesson: {
      currentStepId: "step-1",
      currentStepIndex: 0,
      estimatedMinutes: 5,
      id: "lesson-1",
      title: "첫 레슨",
    },
    progressPercent: 0,
    status: "not_started",
    totalLessons: 1,
    version,
  },
  units: [],
})
const lesson = learnerLessonSchema.parse({
  category: "입문",
  courseId: "course-1",
  description: "설명",
  estimatedMinutes: 5,
  id: "lesson-1",
  learning: { status: "not_started", totalSteps: 0, version },
  steps: [],
  summary: [],
  title: "첫 레슨",
  unitId: "unit-1",
  version,
})

describe("학습자 콘텐츠 서비스", () => {
  it("검색 조건을 정규화하고 다음 위치를 서명 cursor로 반환한다", async () => {
    const listCourses = vi.fn(async () => ({
      items: [summary],
      nextPosition: { courseId: "course-1", primary: "글쓰기 입문" },
    }))
    const service = createLearnerContentService({
      cursorCodec,
      readModelRepository: createRepository({ listCourses }),
    })

    const result = await service.listCourses({
      category: "입문",
      limit: 1,
      query: "  글쓰기  ",
      sort: "title-asc",
    })

    expect(listCourses).toHaveBeenCalledWith({
      after: undefined,
      category: "입문",
      limit: 1,
      query: "글쓰기",
      sort: "title-asc",
    })
    expect(result.kind).toBe("ok")
    if (result.kind === "ok") {
      expect(result.value.items).toEqual([summary])
      expect(result.value.nextCursor).toEqual(expect.any(String))
    }
  })

  it("변조되거나 조건과 일치하지 않는 cursor를 거부한다", async () => {
    const listCourses = vi.fn()
    const service = createLearnerContentService({
      cursorCodec,
      readModelRepository: createRepository({ listCourses }),
    })

    await expect(
      service.listCourses({
        cursor: "invalid",
        limit: 20,
        sort: "recommended",
      })
    ).resolves.toEqual({
      error: { kind: "invalid-cursor" },
      kind: "err",
    })
    expect(listCourses).not.toHaveBeenCalled()
  })

  it("공개 course와 lesson read model을 그대로 검증해 반환한다", async () => {
    const service = createLearnerContentService({
      cursorCodec,
      readModelRepository: createRepository(),
    })

    await expect(
      service.getCourseDetail({ courseId: "course-1", userId: "user-1" })
    ).resolves.toEqual({ kind: "ok", value: detail })
    await expect(
      service.getLesson({ lessonId: "lesson-1", userId: "user-1" })
    ).resolves.toEqual({ kind: "ok", value: lesson })
  })

  it("잠긴 lesson은 공개 본문 없이 lesson-locked 오류를 반환한다", async () => {
    const service = createLearnerContentService({
      cursorCodec,
      readModelRepository: createRepository({
        async findLesson() {
          return { kind: "locked" }
        },
      }),
    })

    await expect(
      service.getLesson({ lessonId: "lesson-2", userId: "user-1" })
    ).resolves.toEqual({
      error: { kind: "lesson-locked" },
      kind: "err",
    })
  })
})

function createRepository(
  overrides: Partial<LearnerReadModelRepository> = {}
): LearnerReadModelRepository {
  return {
    async findCourseDetail({ courseId }) {
      return courseId === "course-1" ? detail : null
    },
    async findLesson({ lessonId }) {
      return lessonId === "lesson-1"
        ? { kind: "found", value: lesson }
        : { kind: "not-found" }
    },
    async listCourseCategories() {
      return ["입문"]
    },
    async listCourses() {
      return { items: [summary], nextPosition: null }
    },
    async listProgress() {
      return { items: [], nextPosition: null }
    },
    ...overrides,
  }
}
