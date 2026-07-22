import { describe, expect, it, vi } from "vitest"
import {
  learnerCourseDetailSchema,
  learnerCourseSummarySchema,
  learnerIdSchema,
  learnerLessonSchema,
} from "@workspace/contracts/learning/read-data"
import {
  courseIdSchema,
  lessonIdSchema,
} from "@workspace/contracts/content/ids"
import { err, ok } from "@workspace/kernel/result"

import { createLearnerContentService } from "#learning/application/learner-content-service"
import type { LearnerReadModelRepository } from "#learning/application/ports/learner-read-model-repository"

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
  it("decoded application query를 전달하고 canonical page를 반환한다", async () => {
    const listCourses = vi.fn(async () => ({
      items: [summary],
      nextPosition: { courseId: "course-1", primary: "글쓰기 입문" },
    }))
    const service = createLearnerContentService({
      readModelRepository: createRepository({ listCourses }),
    })

    const result = await service.listCourses({
      after: { courseId: "course-0", primary: "가나다" },
      category: "입문",
      limit: 1,
      query: "글쓰기",
      sort: "title-asc",
    })

    expect(listCourses).toHaveBeenCalledWith({
      after: { courseId: "course-0", primary: "가나다" },
      category: "입문",
      limit: 1,
      query: "글쓰기",
      sort: "title-asc",
    })
    expect(result.items).toEqual([summary])
    expect(result.nextPosition).toEqual({
      courseId: "course-1",
      primary: "글쓰기 입문",
    })
  })

  it("repository의 내부 필드를 공개 projection에서 제거한다", async () => {
    const service = createLearnerContentService({
      readModelRepository: createRepository({
        async listCourses() {
          return {
            items: [{ ...summary, internalSolution: "비공개" }],
            nextPosition: null,
          }
        },
      }),
    })

    const result = await service.listCourses({
      limit: 20,
      sort: "recommended",
    })

    expect(result.items).toEqual([summary])
    expect(result.items[0]).not.toHaveProperty("internalSolution")
  })

  it("공개 course와 lesson read model을 그대로 검증해 반환한다", async () => {
    const service = createLearnerContentService({
      readModelRepository: createRepository(),
    })

    await expect(
      service.getCourseDetail({
        courseId: courseIdSchema.parse("course-1"),
        userId: learnerIdSchema.parse("user-1"),
      })
    ).resolves.toEqual(ok(detail))
    await expect(
      service.getLesson({
        lessonId: lessonIdSchema.parse("lesson-1"),
        userId: learnerIdSchema.parse("user-1"),
      })
    ).resolves.toEqual(ok(lesson))
  })

  it("잠긴 lesson은 공개 본문 없이 lesson-locked 오류를 반환한다", async () => {
    const service = createLearnerContentService({
      readModelRepository: createRepository({
        async findLesson() {
          return { kind: "locked" }
        },
      }),
    })

    await expect(
      service.getLesson({
        lessonId: lessonIdSchema.parse("lesson-2"),
        userId: learnerIdSchema.parse("user-1"),
      })
    ).resolves.toEqual(err({ kind: "lesson-locked" }))
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
