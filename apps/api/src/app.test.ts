import { describe, expect, it, vi } from "vitest"

import type { ContentService } from "@workspace/core/content"
import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { LearningService } from "@workspace/core/learning"

import type { CurrentAuthSession } from "@/auth/session"
import { createApiApp, type ApiLogger } from "@/app"

const courseCategories = {
  categories: [
    {
      id: "beginner",
      title: "입문자를 위한 코스",
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          lessonCount: 1,
        },
      ],
    },
  ],
}

const courseDetail = {
  id: "sentence-structure",
  title: "문장 구조의 기본",
  description: "문장의 뼈대를 이해합니다.",
  lessonCount: 1,
  firstLessonId: "sentence-structure-01",
  chapters: [
    {
      id: "sentence-structure-chapter-1",
      title: "문장의 뼈대",
      lessons: [
        {
          id: "sentence-structure-01",
          lessonId: "sentence-structure-01",
          title: "주어와 서술어 찾기",
          description: "중심 성분을 구분합니다.",
          order: 1,
        },
      ],
    },
  ],
}

const lesson = {
  id: "sentence-structure-01",
  title: "주어와 서술어 찾기",
  categoryId: "beginner",
  courseId: "sentence-structure",
  unitNumber: 1,
  nextLessonId: "sentence-structure-02",
  steps: [
    {
      id: "sentence-structure-01-step-1",
      type: "INTRO" as const,
      order: 1,
      points: 10,
      required: true,
      content: {
        title: "주어와 서술어 찾기",
        category: "문장 구조",
        tagTone: "info" as const,
        bullets: ["문장의 중심 성분을 구분합니다."],
        estimatedMinutes: 8,
        totalSteps: 1,
      },
    },
  ],
}

const fakeContentService: ContentService = {
  async listCourseCategories() {
    return { status: "ok", value: courseCategories }
  },
  async getCourseDetail(courseId) {
    if (String(courseId) !== "sentence-structure") {
      return {
        status: "not-found",
        error: {
          code: "course-not-found",
          message: "코스를 찾을 수 없습니다.",
          courseId: String(courseId),
        },
      }
    }

    return { status: "ok", value: courseDetail }
  },
  async getLesson(lessonId) {
    if (String(lessonId) !== "sentence-structure-01") {
      return {
        status: "not-found",
        error: {
          code: "lesson-not-found",
          message: "레슨을 찾을 수 없습니다.",
          lessonId: String(lessonId),
        },
      }
    }

    return { status: "ok", value: lesson }
  },
}

const fakeLearningService: LearningService = {
  async completeLesson() {
    return {
      status: "ok",
      value: {
        completedAt: "2026-05-26T00:00:00.000Z",
        completedCount: 1,
        lessonId: "sentence-structure-01",
        status: "completed",
        wasAlreadyCompleted: false,
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
        progressPercent: 50,
        totalLessons: 2,
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
  async listProgress() {
    return {
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
    }
  },
  async saveLessonAnswer() {
    return { status: "ok", value: { saved: true } }
  },
  async saveLessonProgress() {
    return {
      status: "ok",
      value: {
        answers: [],
        currentStepId: "sentence-structure-01-step-2",
        lessonId: "sentence-structure-01",
        status: "in-progress",
        stepOrder: 2,
      },
    }
  },
}

const fakeAiFeedbackService: AiFeedbackService = {
  async createFeedback() {
    return {
      status: "ok",
      value: {
        improvements: ["근거를 더 구체화하세요."],
        nextAction: "첫 문장에 기준을 추가하세요.",
        score: 4,
        scoreRange: [0, 5],
        strengths: ["핵심 문장이 분명합니다."],
        summary: "문장의 목적은 잘 드러납니다.",
      },
    }
  },
}

const silentLogger: ApiLogger = {
  error() {},
  info() {},
}

const testSession: CurrentAuthSession = {
  session: {
    id: "session-1",
  },
  user: {
    email: "learner@example.com",
    id: "user-1",
    image: null,
    name: "학습자",
  },
}

function createTestApp(
  logger: ApiLogger = silentLogger,
  session: CurrentAuthSession | null = null,
  learningService: LearningService = fakeLearningService,
  aiFeedbackService: AiFeedbackService = fakeAiFeedbackService,
  checkDatabase = async () => true
) {
  return createApiApp({
    aiFeedbackService,
    auth: {
      async getSession() {
        return session
      },
      async handler() {
        return new Response(null, { status: 404 })
      },
    },
    checkDatabase,
    contentService: fakeContentService,
    learningService,
    logger,
  })
}

describe("createApiApp", () => {
  it("returns health status when the database is available", async () => {
    const app = createTestApp()

    const response = await app.request("/health")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      database: "ok",
      status: "ok",
    })
  })

  it("returns database unavailable when the health check throws", async () => {
    const logger = {
      error: vi.fn(),
      info: vi.fn(),
    } satisfies ApiLogger
    const app = createTestApp(
      logger,
      null,
      fakeLearningService,
      fakeAiFeedbackService,
      async () => {
        throw new Error("database connection failed")
      }
    )

    const response = await app.request("/health")

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: "database-unavailable",
      message: "데이터베이스를 사용할 수 없습니다.",
    })
    expect(logger.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
      },
      "Database health check failed"
    )
  })

  it("requires auth for /ai-feedback", async () => {
    const app = createTestApp()

    const response = await app.request("/ai-feedback", {
      body: JSON.stringify({
        feedbackStepId: "sentence-structure-01-step-2",
        lessonId: "sentence-structure-01",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "unauthorized",
      message: "로그인이 필요합니다.",
    })
  })

  it("creates AI feedback for an authenticated user", async () => {
    const aiFeedbackService = {
      createFeedback: vi.fn(fakeAiFeedbackService.createFeedback),
    } satisfies AiFeedbackService
    const app = createTestApp(
      silentLogger,
      testSession,
      fakeLearningService,
      aiFeedbackService
    )

    const response = await app.request("/ai-feedback", {
      body: JSON.stringify({
        answer: "문장의 기준을 먼저 세운다.",
        feedbackStepId: "sentence-structure-01-step-2",
        lessonId: "sentence-structure-01",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      improvements: ["근거를 더 구체화하세요."],
      nextAction: "첫 문장에 기준을 추가하세요.",
      score: 4,
      scoreRange: [0, 5],
      strengths: ["핵심 문장이 분명합니다."],
      summary: "문장의 목적은 잘 드러납니다.",
    })
    expect(aiFeedbackService.createFeedback).toHaveBeenCalledWith("user-1", {
      answer: "문장의 기준을 먼저 세운다.",
      feedbackStepId: "sentence-structure-01-step-2",
      lessonId: "sentence-structure-01",
    })
  })

  it("returns 429 when feedback retry limit is exceeded", async () => {
    const aiFeedbackService: AiFeedbackService = {
      async createFeedback() {
        return {
          status: "retry-limit-exceeded",
          error: {
            code: "feedback-retry-limit-exceeded",
            message: "피드백 재시도 한도를 초과했습니다.",
          },
        }
      },
    }
    const app = createTestApp(
      silentLogger,
      testSession,
      fakeLearningService,
      aiFeedbackService
    )

    const response = await app.request("/ai-feedback", {
      body: JSON.stringify({
        feedbackStepId: "sentence-structure-01-step-2",
        lessonId: "sentence-structure-01",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      code: "feedback-retry-limit-exceeded",
      message: "피드백 재시도 한도를 초과했습니다.",
    })
  })

  it("returns unauthorized for /me without a session", async () => {
    const app = createTestApp()

    const response = await app.request("/me")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "unauthorized",
      message: "로그인이 필요합니다.",
    })
  })

  it("returns the current user for /me with a session", async () => {
    const app = createTestApp(silentLogger, testSession)

    const response = await app.request("/me")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      email: "learner@example.com",
      id: "user-1",
      image: null,
      name: "학습자",
    })
  })

  it("does not register a learner profile route", async () => {
    const app = createTestApp(silentLogger, testSession)

    const response = await app.request("/profile")

    expect(response.status).toBe(404)
  })

  it("returns overall progress for an authenticated user", async () => {
    const app = createTestApp(silentLogger, testSession)

    const response = await app.request("/progress")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      courses: [
        {
          completedCount: 1,
          courseId: "sentence-structure",
          nextLessonId: "sentence-structure-02",
          progressPercent: 50,
          totalLessons: 2,
        },
      ],
    })
  })

  it("saves lesson progress for an authenticated user", async () => {
    const learningService = {
      ...fakeLearningService,
      saveLessonProgress: vi.fn(fakeLearningService.saveLessonProgress),
    } satisfies LearningService
    const app = createTestApp(silentLogger, testSession, learningService)

    const response = await app.request(
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

    expect(response.status).toBe(200)
    expect(learningService.saveLessonProgress).toHaveBeenCalledWith(
      "user-1",
      "sentence-structure-01",
      {
        currentStepId: "sentence-structure-01-step-2",
        stepOrder: 2,
      }
    )
  })

  it("saves lesson answers for an authenticated user", async () => {
    const learningService = {
      ...fakeLearningService,
      saveLessonAnswer: vi.fn(fakeLearningService.saveLessonAnswer),
    } satisfies LearningService
    const app = createTestApp(silentLogger, testSession, learningService)

    const response = await app.request(
      "/lessons/sentence-structure-01/answers",
      {
        body: JSON.stringify({
          answer: "문장을 고쳤습니다.",
          stepId: "sentence-structure-01-step-2",
        }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ saved: true })
    expect(learningService.saveLessonAnswer).toHaveBeenCalledWith(
      "user-1",
      "sentence-structure-01",
      {
        answer: "문장을 고쳤습니다.",
        stepId: "sentence-structure-01-step-2",
      }
    )
  })

  it("completes lessons idempotently for an authenticated user", async () => {
    const app = createTestApp(silentLogger, testSession)

    const response = await app.request(
      "/lessons/sentence-structure-01/complete",
      {
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      completedAt: "2026-05-26T00:00:00.000Z",
      completedCount: 1,
      lessonId: "sentence-structure-01",
      status: "completed",
      wasAlreadyCompleted: false,
    })
  })

  it("returns unversioned course categories", async () => {
    const app = createTestApp()

    const response = await app.request("/courses")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(courseCategories)
  })

  it("does not register public course search", async () => {
    const app = createTestApp()

    const response = await app.request("/courses/search?q=문장")

    expect(response.status).toBe(404)
  })

  it("returns a course-not-found DTO for an unknown course", async () => {
    const app = createTestApp()

    const response = await app.request("/courses/not-real")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "course-not-found",
      message: "코스를 찾을 수 없습니다.",
      courseId: "not-real",
    })
  })

  it("returns a lesson-not-found DTO for an unknown lesson", async () => {
    const app = createTestApp()

    const response = await app.request("/lessons/not-real")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "lesson-not-found",
      message: "레슨을 찾을 수 없습니다.",
      lessonId: "not-real",
    })
  })

  it("logs request fields through the injected logger", async () => {
    const logger = {
      error: vi.fn(),
      info: vi.fn(),
    } satisfies ApiLogger
    const app = createTestApp(logger)

    const response = await app.request("/courses", {
      headers: {
        "x-request-id": "request-1",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe("request-1")
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMs: expect.any(Number),
        method: "GET",
        path: "/courses",
        requestId: "request-1",
        status: 200,
      }),
      "API request completed"
    )
  })

  it("returns OpenAPI paths without versioned routes", async () => {
    const app = createTestApp()

    const response = await app.request("/openapi.json")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/courses")
    expect(document.paths).not.toHaveProperty("/courses/search")
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(document.paths).toHaveProperty("/me")
    expect(document.paths).not.toHaveProperty("/profile")
    expect(document.paths).toHaveProperty("/progress")
    expect(document.paths).toHaveProperty("/courses/{courseId}/progress")
    expect(document.paths).not.toHaveProperty(
      "/courses/{courseId}/curriculum-upgrade"
    )
    expect(document.paths).not.toHaveProperty(
      "/courses/{courseId}/curriculum-upgrade/dismiss"
    )
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/progress")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/answers")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/complete")
    expect(document.paths).toHaveProperty("/ai-feedback")
    expect(
      Object.keys(document.paths).some((path) => path.startsWith("/v"))
    ).toBe(false)
  })

  it("documents error response schemas in OpenAPI", async () => {
    const app = createTestApp()

    const response = await app.request("/openapi.json")
    const document = (await response.json()) as {
      paths: Record<
        string,
        {
          get?: {
            responses?: Record<
              string,
              {
                content?: Record<
                  string,
                  {
                    schema?: unknown
                  }
                >
              }
            >
          }
        }
      >
    }

    expect(response.status).toBe(200)
    expect(
      document.paths["/courses/{courseId}"]?.get?.responses?.["404"]?.content?.[
        "application/json"
      ]?.schema
    ).toBeDefined()
    expect(
      document.paths["/lessons/{lessonId}"]?.get?.responses?.["503"]?.content?.[
        "application/json"
      ]?.schema
    ).toBeDefined()
  })
})
