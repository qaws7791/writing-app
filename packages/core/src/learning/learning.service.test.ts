import { describe, expect, it, vi } from "vitest"

import { courseId, lessonId } from "../content"
import type { ContentService, LessonDto } from "../content"
import { createLearningService } from "./learning.service"
import type { LearningRepository } from "./learning.repository"
import type { UserId } from "./learning.ids"

const userId = "user-1" as UserId
const sentenceCourseId = courseId("sentence-structure")
const firstLessonId = lessonId("sentence-structure-01")
const secondLessonId = lessonId("sentence-structure-02")

const lesson: LessonDto = {
  id: firstLessonId,
  title: "주어와 서술어 찾기",
  categoryId: "writing-basics",
  courseId: sentenceCourseId,
  unitNumber: 1,
  nextLessonId: secondLessonId,
  steps: [
    {
      id: "intro",
      type: "INTRO",
      order: 1,
      points: 0,
      required: true,
      content: {
        title: "시작",
        category: "문장",
        tagTone: "primary",
        bullets: ["문장의 중심을 찾습니다."],
        estimatedMinutes: 3,
        totalSteps: 2,
      },
    },
    {
      id: "complete",
      type: "COMPLETE",
      order: 2,
      points: 0,
      required: true,
      content: {
        nextAction: "next-lesson",
      },
    },
  ],
}

function createContentService(
  overrides: Partial<ContentService> = {}
): ContentService {
  return {
    async getCourseDetail() {
      return {
        status: "ok",
        value: {
          id: sentenceCourseId,
          title: "문장 구조의 기본",
          description: "문장 구조를 배웁니다.",
          lessonCount: 2,
          firstLessonId,
          chapters: [
            {
              id: "chapter-1",
              title: "문장의 뼈대",
              lessons: [
                {
                  id: firstLessonId,
                  lessonId: firstLessonId,
                  title: "주어와 서술어 찾기",
                  description: "문장의 중심 성분을 찾습니다.",
                  order: 1,
                },
                {
                  id: secondLessonId,
                  lessonId: secondLessonId,
                  title: "목적어와 보어의 자리",
                  description: "서술어가 요구하는 성분을 봅니다.",
                  order: 2,
                },
              ],
            },
          ],
        },
      }
    },
    async getLesson() {
      return {
        status: "ok",
        value: lesson,
      }
    },
    async listCourseCategories() {
      return {
        status: "ok",
        value: { categories: [] },
      }
    },
    ...overrides,
  }
}

function createRepository(
  overrides: Partial<LearningRepository> = {}
): LearningRepository {
  return {
    async findCourseProgress() {
      return undefined
    },
    async upsertCourseProgress() {},
    async findLessonProgress() {
      return undefined
    },
    async upsertLessonProgress(input) {
      return {
        courseId: input.courseId,
        currentStepId: input.currentStepId,
        lessonId: input.lessonId,
        status: input.status,
        stepOrder: input.stepOrder,
      }
    },
    async listLessonProgressByCourse() {
      return []
    },
    async listCourseLessonIds() {
      return [firstLessonId, secondLessonId]
    },
    async courseIncludesLesson() {
      return true
    },
    async listInProgressCourses() {
      return []
    },
    async listProgressSummaries() {
      return []
    },
    async listLessonAnswers() {
      return []
    },
    async upsertLessonAnswer() {},
    async completeLesson() {
      return {
        completedAt: new Date("2026-05-31T00:00:00.000Z"),
        completedCount: 1,
        wasAlreadyCompleted: false,
      }
    },
    ...overrides,
  }
}

describe("createLearningService", () => {
  it("lists progress from the repository summary read model", async () => {
    const getCourseDetail = vi.fn(createContentService().getCourseDetail)
    const service = createLearningService({
      contentService: createContentService({ getCourseDetail }),
      repository: createRepository({
        async listProgressSummaries() {
          return [
            {
              courseDescription: "문장 구조를 배웁니다.",
              courseId: sentenceCourseId,
              courseTitle: "문장 구조의 기본",
              lessons: [
                {
                  lessonId: firstLessonId,
                  progressStatus: "completed",
                  title: "주어와 서술어 찾기",
                },
                {
                  lessonId: secondLessonId,
                  title: "목적어와 보어의 자리",
                },
              ],
            },
          ]
        },
      }),
    })

    const result = await service.listProgress(userId)

    expect(result).toEqual({
      status: "ok",
      value: {
        courses: [
          {
            completedCount: 1,
            courseDescription: "문장 구조를 배웁니다.",
            courseId: sentenceCourseId,
            courseTitle: "문장 구조의 기본",
            lessons: [
              {
                lessonId: firstLessonId,
                status: "completed",
                title: "주어와 서술어 찾기",
              },
              {
                lessonId: secondLessonId,
                status: "next-up",
                title: "목적어와 보어의 자리",
              },
            ],
            nextLessonId: secondLessonId,
            progressPercent: 50,
            totalLessons: 2,
          },
        ],
      },
    })
    expect(getCourseDetail).not.toHaveBeenCalled()
  })

  it("calculates course progress from the current course curriculum", async () => {
    const repository = createRepository({
      async listLessonProgressByCourse() {
        return [
          {
            courseId: sentenceCourseId,
            currentStepId: "complete",
            lessonId: firstLessonId,
            status: "completed",
            stepOrder: 2,
          },
        ]
      },
    })
    const service = createLearningService({
      contentService: createContentService(),
      repository,
    })

    const result = await service.getCourseProgress(userId, sentenceCourseId)

    expect(result).toEqual({
      status: "ok",
      value: {
        completedCount: 1,
        courseId: sentenceCourseId,
        nextLessonId: secondLessonId,
        progressPercent: 50,
        totalLessons: 2,
      },
    })
  })

  it("saves lesson progress only when the lesson belongs to the current course", async () => {
    const upsertCourseProgress =
      vi.fn<LearningRepository["upsertCourseProgress"]>()
    const upsertLessonProgress = vi.fn<
      LearningRepository["upsertLessonProgress"]
    >(async (input) => ({
      courseId: input.courseId,
      currentStepId: input.currentStepId,
      lessonId: input.lessonId,
      status: input.status,
      stepOrder: input.stepOrder,
    }))
    const service = createLearningService({
      contentService: createContentService(),
      repository: createRepository({
        upsertCourseProgress,
        upsertLessonProgress,
      }),
    })

    const result = await service.saveLessonProgress(userId, firstLessonId, {
      currentStepId: "intro",
      stepOrder: 1,
    })

    expect(result.status).toBe("ok")
    expect(upsertCourseProgress).toHaveBeenCalledWith({
      courseId: sentenceCourseId,
      lastLessonId: firstLessonId,
      userId,
    })
    expect(upsertLessonProgress).toHaveBeenCalledWith({
      courseId: sentenceCourseId,
      currentStepId: "intro",
      lessonId: firstLessonId,
      status: "in-progress",
      stepOrder: 1,
      userId,
    })
  })

  it("rejects lesson progress outside the current course curriculum", async () => {
    const service = createLearningService({
      contentService: createContentService(),
      repository: createRepository({
        async courseIncludesLesson() {
          return false
        },
      }),
    })

    const result = await service.saveLessonProgress(userId, firstLessonId, {
      currentStepId: "intro",
      stepOrder: 1,
    })

    expect(result).toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "레슨이 현재 코스 커리큘럼에 포함되어 있지 않습니다.",
      },
    })
  })
})
