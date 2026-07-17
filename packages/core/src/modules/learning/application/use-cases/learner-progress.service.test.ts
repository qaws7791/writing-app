import { describe, expect, it, vi } from "vitest"

import {
  learnerIdSchema,
  learnerProgressCourseSchema,
} from "@workspace/contracts/learning/read-data"

import type { LearnerReadModelRepository } from "#core/modules/learning/application/ports/learner-read-model.repository"
import { createProgressService } from "#core/modules/learning/application/use-cases/learner-progress.service"

const progressCourse = learnerProgressCourseSchema.parse({
  id: "course-1",
  learning: {
    completedLessons: 1,
    lastActivityAt: "2026-06-14T00:00:00.000Z",
    nextLesson: {
      currentStepId: "step-2",
      currentStepIndex: 0,
      estimatedMinutes: 10,
      id: "lesson-2",
      title: "다음 레슨",
    },
    progressPercent: 50,
    status: "in_progress",
    totalLessons: 2,
    version: { curriculumVersionId: "course-1-v1", revision: 1 },
  },
  title: "글쓰기 입문",
  visualKey: "basic-sentence-writing",
})

describe("학습 진행 서비스", () => {
  it("decoded application query를 repository에 전달하고 canonical page를 반환한다", async () => {
    const listProgress = vi.fn(async () => ({
      items: [progressCourse],
      nextPosition: { courseId: "course-1", primary: 1 },
    }))
    const service = createProgressService({
      readModelRepository: createRepository({ listProgress }),
    })
    const query = {
      after: { courseId: "course-0", primary: 0 },
      limit: 10,
      status: "in_progress" as const,
      userId: learnerIdSchema.parse("learner-1"),
    }

    await expect(service.readProgress(query)).resolves.toEqual({
      items: [progressCourse],
      nextPosition: { courseId: "course-1", primary: 1 },
    })
    expect(listProgress).toHaveBeenCalledWith(query)
  })
})

function createRepository(
  overrides: Partial<LearnerReadModelRepository>
): LearnerReadModelRepository {
  return {
    async findCourseDetail() {
      return null
    },
    async findLesson() {
      return { kind: "not-found" }
    },
    async listCourseCategories() {
      return []
    },
    async listCourses() {
      return { items: [], nextPosition: null }
    },
    async listProgress() {
      return { items: [], nextPosition: null }
    },
    ...overrides,
  }
}
