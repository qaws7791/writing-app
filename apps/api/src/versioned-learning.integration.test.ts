import { describe, expect, it } from "vitest"

import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { ContentService } from "@workspace/core/content"
import type { LearningService } from "@workspace/core/learning"

import { createApiApp, type ApiLogger } from "@/app"
import type { CurrentAuthSession } from "@/auth/session"

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

const latestPublicContentService: ContentService = {
  async getCourseDetail() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure",
        title: "문장 구조의 기본 v2",
        description: "최신 공개 커리큘럼입니다.",
        thumbnail: "/course-thumbnails/sentence-structure.png",
        lessonCount: 1,
        firstLessonId: "sentence-structure-01",
        chapters: [
          {
            id: "sentence-structure-chapter-1-v2",
            label: "1단원",
            title: "새 문장의 뼈대",
            lessons: [
              {
                id: "sentence-structure-01-v2",
                lessonId: "sentence-structure-01",
                title: "새 주어와 서술어 찾기",
                description: "최신 published 버전의 레슨입니다.",
                order: 1,
              },
            ],
          },
        ],
      },
    }
  },
  async getLesson() {
    return {
      status: "not-found",
      error: {
        code: "lesson-not-found",
        lessonId: "not-used",
        message: "Lesson was not found.",
      },
    }
  },
  async listCourseCategories() {
    return { status: "ok", value: { categories: [] } }
  },
  async searchCourses() {
    return { status: "ok", value: { courses: [] } }
  },
}

const learnerVersionProgressService: LearningService = {
  async completeLesson() {
    return {
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Lesson is not part of the learner curriculum version.",
      },
    }
  },
  async getCourseProgress() {
    return {
      status: "ok",
      value: {
        completedCount: 1,
        courseId: "sentence-structure",
        nextLessonId: "sentence-structure-02",
        progressPercent: 8,
        totalLessons: 12,
      },
    }
  },
  async getLessonProgress() {
    return {
      status: "ok",
      value: {
        answers: [],
        currentStepId: "sentence-structure-01-step-1",
        lessonId: "sentence-structure-01",
        status: "not-started",
        stepOrder: 1,
      },
    }
  },
  async getProfile() {
    return {
      status: "ok",
      value: {
        completedLessonCount: 1,
        courseCount: 1,
      },
    }
  },
  async listProgress() {
    return {
      status: "ok",
      value: {
        courses: [
          {
            completedCount: 1,
            courseId: "sentence-structure",
            nextLessonId: "sentence-structure-02",
            progressPercent: 8,
            totalLessons: 12,
          },
        ],
      },
    }
  },
  async saveLessonAnswer() {
    return {
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Lesson is not part of the learner curriculum version.",
      },
    }
  },
  async saveLessonProgress() {
    return {
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Lesson is not part of the learner curriculum version.",
      },
    }
  },
}

const fakeAiFeedbackService: AiFeedbackService = {
  async createFeedback() {
    return {
      status: "ok",
      value: {
        improvements: [],
        nextAction: "다음 문장을 점검하세요.",
        score: 4,
        scoreRange: [0, 5],
        strengths: ["문장이 명확합니다."],
        summary: "좋습니다.",
      },
    }
  },
}

describe("version-aware learning API", () => {
  it("keeps public latest content separate from learner progress", async () => {
    const app = createVersionedLearningTestApp()

    const publicResponse = await app.request("/courses/sentence-structure")
    const progressResponse = await app.request(
      "/courses/sentence-structure/progress"
    )
    const progressListResponse = await app.request("/progress")

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
    expect(progressListResponse.status).toBe(200)
    await expect(progressListResponse.json()).resolves.toEqual({
      courses: [
        {
          completedCount: 1,
          courseId: "sentence-structure",
          nextLessonId: "sentence-structure-02",
          progressPercent: 8,
          totalLessons: 12,
        },
      ],
    })
  })

  it("returns invalid-request for learner-version write rejections", async () => {
    const app = createVersionedLearningTestApp()

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
    const completeResponse = await app.request(
      "/lessons/sentence-structure-12/complete",
      { method: "POST" }
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
    expect(completeResponse.status).toBe(400)
    await expect(completeResponse.json()).resolves.toEqual({
      code: "invalid-request",
      message: "Lesson is not part of the learner curriculum version.",
    })
  })
})

function createVersionedLearningTestApp() {
  return createApiApp({
    aiFeedbackService: fakeAiFeedbackService,
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
    contentService: latestPublicContentService,
    learningService: learnerVersionProgressService,
    logger: silentLogger,
  })
}
