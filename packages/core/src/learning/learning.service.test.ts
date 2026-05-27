import { describe, expect, it, vi } from "vitest"

import type { ContentService, LessonDto } from "@/content"
import { courseId, curriculumVersionId, lessonId } from "@/content"
import type { LearningRepository } from "@/learning/learning.repository"
import { createLearningService } from "@/learning/learning.service"
import { userId } from "@/learning/learning.ids"

const lesson: LessonDto = {
  id: "sentence-structure-01",
  title: "주어와 서술어 찾기",
  categoryId: "beginner",
  courseId: "sentence-structure",
  unitNumber: 1,
  nextLessonId: "sentence-structure-02",
  steps: [
    {
      id: "sentence-structure-01-step-1",
      type: "INTRO",
      order: 1,
      points: 0,
      required: true,
      content: {
        title: "주어와 서술어 찾기",
        category: "문장 구조",
        tagTone: "info",
        bullets: [],
        estimatedMinutes: 5,
        totalSteps: 4,
        xpAvailable: 0,
      },
    },
    {
      id: "sentence-structure-01-step-2",
      type: "SHORT_WRITE",
      order: 2,
      points: 10,
      required: true,
      content: {
        instruction: "문장을 고쳐 쓰세요.",
        prompt: "흐린 문장을 구체화하세요.",
        maxChars: 100,
        minChars: 5,
        referenceAnswer: "문장의 기준을 먼저 세웁니다.",
        aiEvaluationEnabled: true,
        showReferenceAfterSubmit: true,
      },
    },
    {
      id: "sentence-structure-01-step-3",
      type: "AI_FEEDBACK",
      order: 3,
      points: 0,
      required: true,
      content: {
        sourceStepId: "sentence-structure-01-step-2",
        feedbackPrompt: "명확성을 평가합니다.",
        focusAreas: ["clarity"],
        showScore: true,
        scoreRange: [0, 5],
        allowRevision: true,
        maxRevisions: 3,
      },
    },
    {
      id: "sentence-structure-01-step-4",
      type: "COMPLETE",
      order: 4,
      points: 0,
      required: true,
      content: {
        celebrationStyle: "confetti",
        xpEarned: 0,
        showStreak: false,
        lessonStats: {},
        nextAction: "next-lesson",
      },
    },
  ],
}

const contentService: ContentService = {
  async listCourseCategories() {
    return { status: "ok", value: { categories: [] } }
  },
  async searchCourses() {
    return { status: "ok", value: { courses: [] } }
  },
  async getCourseDetail() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        thumbnail: "/course-thumbnails/sentence-structure.png",
        lessonCount: 2,
        firstLessonId: "sentence-structure-01",
        chapters: [
          {
            id: "sentence-structure-chapter-1",
            label: "1단원",
            title: "문장의 뼈대",
            lessons: [
              {
                id: "sentence-structure-01",
                lessonId: "sentence-structure-01",
                title: "주어와 서술어 찾기",
                description: "중심 성분을 구분합니다.",
                order: 1,
              },
              {
                id: "sentence-structure-02",
                lessonId: "sentence-structure-02",
                title: "목적어와 보어의 자리",
                description: "문장 구조를 완성합니다.",
                order: 2,
              },
            ],
          },
        ],
      },
    }
  },
  async getLesson(targetLessonId) {
    if (targetLessonId !== "sentence-structure-01") {
      return {
        status: "not-found",
        error: {
          code: "lesson-not-found",
          message: "Lesson was not found.",
          lessonId: targetLessonId,
        },
      }
    }

    return { status: "ok", value: lesson }
  },
}

function createRepository(): LearningRepository {
  return {
    completeLesson: vi.fn(async () => ({
      completedAt: new Date("2026-05-26T00:00:00.000Z"),
      completedCount: 1,
      wasAlreadyCompleted: false,
    })),
    curriculumVersionIncludesLesson: vi.fn(async () => true),
    findCourseProgress: vi.fn(async () => undefined),
    findLatestPublishedCurriculumVersionId: vi.fn(async () =>
      curriculumVersionId("sentence-structure-v1")
    ),
    findLessonProgress: vi.fn(async () => undefined),
    listCurriculumVersionLessonIds: vi.fn(async () => [
      lessonId("sentence-structure-01"),
      lessonId("sentence-structure-02"),
    ]),
    listInProgressCourses: vi.fn(async () => []),
    listLessonAnswers: vi.fn(async () => []),
    listLessonProgressByCourse: vi.fn(async () => [
      {
        courseId: courseId("sentence-structure"),
        curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
        currentStepId: "sentence-structure-01-step-4",
        lessonId: lessonId("sentence-structure-01"),
        status: "completed" as const,
        stepOrder: 4,
      },
    ]),
    upsertCourseProgress: vi.fn(async () => undefined),
    upsertLessonAnswer: vi.fn(async () => undefined),
    upsertLessonProgress: vi.fn(async (input) => ({
      completedAt: null,
      courseId: input.courseId,
      curriculumVersionId: input.curriculumVersionId,
      currentStepId: input.currentStepId,
      lessonId: input.lessonId,
      status: input.status,
      stepOrder: input.stepOrder,
    })),
  }
}

describe("createLearningService", () => {
  it("returns default lesson progress without writing when no progress exists", async () => {
    const repository = createRepository()
    const service = createLearningService({ contentService, repository })

    const result = await service.getLessonProgress(
      userId("user-1"),
      lessonId("sentence-structure-01")
    )

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.value).toMatchObject({
        answers: [],
        currentStepId: "sentence-structure-01-step-1",
        lessonId: "sentence-structure-01",
        status: "not-started",
        stepOrder: 1,
      })
    }
    expect(repository.upsertLessonProgress).not.toHaveBeenCalled()
  })

  it("saves current lesson progress", async () => {
    const repository = createRepository()
    const service = createLearningService({ contentService, repository })

    const result = await service.saveLessonProgress(
      userId("user-1"),
      lessonId("sentence-structure-01"),
      {
        currentStepId: "sentence-structure-01-step-2",
        stepOrder: 2,
      }
    )

    expect(result.status).toBe("ok")
    expect(repository.upsertCourseProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "sentence-structure",
        lastLessonId: "sentence-structure-01",
        userId: "user-1",
      })
    )
    expect(repository.upsertLessonProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStepId: "sentence-structure-01-step-2",
        status: "in-progress",
        stepOrder: 2,
      })
    )
  })

  it("calculates course progress from the learner curriculum version", async () => {
    const repository = {
      ...createRepository(),
      findCourseProgress: vi.fn(async () => ({
        completedCount: 1,
        courseId: courseId("sentence-structure"),
        curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
        lastLessonId: lessonId("sentence-structure-01"),
      })),
      listCurriculumVersionLessonIds: vi.fn(async () => [
        lessonId("sentence-structure-01"),
        lessonId("sentence-structure-02"),
      ]),
      listLessonProgressByCourse: vi.fn(async () => [
        {
          courseId: courseId("sentence-structure"),
          curriculumVersionId: curriculumVersionId("sentence-structure-v1"),
          currentStepId: "sentence-structure-01-step-4",
          lessonId: lessonId("sentence-structure-01"),
          status: "completed" as const,
          stepOrder: 4,
        },
      ]),
    }
    const service = createLearningService({ contentService, repository })

    const result = await service.getCourseProgress(
      userId("user-1"),
      courseId("sentence-structure")
    )

    expect(result).toMatchObject({
      status: "ok",
      value: {
        completedCount: 1,
        nextLessonId: "sentence-structure-02",
        progressPercent: 50,
        totalLessons: 2,
      },
    })
    expect(repository.listCurriculumVersionLessonIds).toHaveBeenCalledWith(
      curriculumVersionId("sentence-structure-v1")
    )
    expect(repository.listLessonProgressByCourse).toHaveBeenCalledWith(
      userId("user-1"),
      courseId("sentence-structure"),
      curriculumVersionId("sentence-structure-v1")
    )
  })

  it("starts new lesson progress on the latest published curriculum version", async () => {
    const repository = {
      ...createRepository(),
      findLatestPublishedCurriculumVersionId: vi.fn(async () =>
        curriculumVersionId("sentence-structure-v2")
      ),
    }
    const service = createLearningService({ contentService, repository })

    const result = await service.saveLessonProgress(
      userId("user-1"),
      lessonId("sentence-structure-01"),
      {
        currentStepId: "sentence-structure-01-step-2",
        stepOrder: 2,
      }
    )

    expect(result.status).toBe("ok")
    expect(repository.upsertCourseProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        curriculumVersionId: "sentence-structure-v2",
      })
    )
    expect(repository.upsertLessonProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        curriculumVersionId: "sentence-structure-v2",
      })
    )
  })

  it("rejects progress for a lesson outside the learner curriculum version", async () => {
    const repository = {
      ...createRepository(),
      curriculumVersionIncludesLesson: vi.fn(async () => false),
    }
    const service = createLearningService({ contentService, repository })

    const result = await service.saveLessonProgress(
      userId("user-1"),
      lessonId("sentence-structure-01"),
      {
        currentStepId: "sentence-structure-01-step-2",
        stepOrder: 2,
      }
    )

    expect(result).toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Lesson is not part of the learner curriculum version.",
      },
    })
    expect(repository.upsertLessonProgress).not.toHaveBeenCalled()
  })

  it("upserts allowed lesson answers", async () => {
    const repository = createRepository()
    const service = createLearningService({ contentService, repository })

    const result = await service.saveLessonAnswer(
      userId("user-1"),
      lessonId("sentence-structure-01"),
      {
        answer: "문장을 고쳤습니다.",
        stepId: "sentence-structure-01-step-2",
      }
    )

    expect(result.status).toBe("ok")
    expect(repository.upsertLessonAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: "문장을 고쳤습니다.",
        stepId: "sentence-structure-01-step-2",
      })
    )
  })

  it("rejects answers for non-writing step types", async () => {
    const repository = createRepository()
    const service = createLearningService({ contentService, repository })

    const result = await service.saveLessonAnswer(
      userId("user-1"),
      lessonId("sentence-structure-01"),
      {
        answer: "시작 화면 답변",
        stepId: "sentence-structure-01-step-1",
      }
    )

    expect(result).toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "This lesson step does not accept saved answers.",
      },
    })
    expect(repository.upsertLessonAnswer).not.toHaveBeenCalled()
  })

  it("completes a lesson idempotently", async () => {
    const repository = createRepository()
    const service = createLearningService({ contentService, repository })

    const result = await service.completeLesson(
      userId("user-1"),
      lessonId("sentence-structure-01")
    )

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.value).toMatchObject({
        completedCount: 1,
        lessonId: "sentence-structure-01",
        status: "completed",
        wasAlreadyCompleted: false,
      })
    }
  })

  it("returns course progress with completed count and next lesson", async () => {
    const repository = createRepository()
    const service = createLearningService({ contentService, repository })

    const result = await service.getCourseProgress(
      userId("user-1"),
      courseId("sentence-structure")
    )

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.value).toMatchObject({
        completedCount: 1,
        courseId: "sentence-structure",
        nextLessonId: "sentence-structure-02",
        progressPercent: 50,
        totalLessons: 2,
      })
    }
  })

  it("returns profile summary from in-progress courses", async () => {
    const repository = {
      ...createRepository(),
      listInProgressCourses: vi.fn(async () => [
        {
          completedCount: 1,
          courseId: courseId("sentence-structure"),
          lastLessonId: lessonId("sentence-structure-01"),
        },
      ]),
    }
    const service = createLearningService({ contentService, repository })

    const result = await service.getProfile(userId("user-1"))

    expect(result).toEqual({
      status: "ok",
      value: {
        completedLessonCount: 1,
        courseCount: 1,
      },
    })
  })

  it("returns overall progress for in-progress courses", async () => {
    const repository = {
      ...createRepository(),
      listInProgressCourses: vi.fn(async () => [
        {
          completedCount: 1,
          courseId: courseId("sentence-structure"),
          lastLessonId: lessonId("sentence-structure-01"),
        },
      ]),
    }
    const service = createLearningService({ contentService, repository })

    const result = await service.listProgress(userId("user-1"))

    expect(result).toEqual({
      status: "ok",
      value: {
        courses: [
          {
            completedCount: 1,
            courseId: "sentence-structure",
            nextLessonId: "sentence-structure-02",
            progressPercent: 50,
            totalLessons: 2,
          },
        ],
      },
    })
  })
})
