import { describe, expect, it } from "vitest"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"
import { learnerIdSchema } from "@workspace/core/learning"
import type { LearningService } from "@workspace/core/learning"

import { createApp, type ApiDependencies } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

const occurredAt = new Date("2026-06-14T09:30:00.000Z")
const activeSession = {
  user: {
    email: "learner@example.com",
    id: "user-1",
    image: null,
    joinedAt: "2026-06-14T00:00:00.000Z",
    name: "학습자",
    status: "active",
  },
} as const

describe("플랫폼 API learning route", () => {
  it("인증된 answer 저장 요청을 learning service로 전달한다", async () => {
    const savedCommands: unknown[] = []
    const app = createApp(
      createDependencies({
        learningService: {
          async completeLesson() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveLessonProgress() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveStepAnswer(command) {
            savedCommands.push(command)

            return { kind: "ok", value: { saved: true } }
          },
        },
      })
    )

    const response = await app.request("/learning/answers", {
      body: JSON.stringify({
        answer: {
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        },
        lessonId: "l1",
        stepId: "l1-s3",
      }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ saved: true })
    expect(savedCommands).toEqual([
      {
        answer: {
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        },
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt,
        stepId: lessonStepIdSchema.parse("l1-s3"),
        userId: learnerIdSchema.parse("user-1"),
      },
    ])
  })

  it("invalid-request 결과를 400으로 변환한다", async () => {
    const app = createApp(
      createDependencies({
        learningService: {
          async completeLesson() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveLessonProgress() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveStepAnswer() {
            return {
              error: {
                kind: "invalid-request",
                reason: "step-answer-not-supported",
                stepId: lessonStepIdSchema.parse("l1-s1"),
              },
              kind: "err",
            }
          },
        },
      })
    )

    const response = await app.request("/learning/answers", {
      body: JSON.stringify({
        answer: {
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        },
        lessonId: "l1",
        stepId: "l1-s1",
      }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid request",
    })
  })

  it("잘못된 answer JSON 본문은 HTTP_EXCEPTION으로 응답한다", async () => {
    const app = createApp(
      createDependencies({
        learningService: createLearningService(),
      })
    )

    const response = await app.request("/learning/answers", {
      body: "{",
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "HTTP_EXCEPTION",
      message: "Bad Request",
    })
  })

  it("완료 index를 받지 않고 인증된 lesson 완료 요청을 service로 전달한다", async () => {
    const completedCommands: unknown[] = []
    const app = createApp(
      createDependencies({
        learningService: {
          async completeLesson(command) {
            completedCommands.push(command)

            return { kind: "ok", value: { saved: true } }
          },
          async saveLessonProgress() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveStepAnswer() {
            return { kind: "ok", value: { saved: true } }
          },
        },
      })
    )

    const response = await app.request("/learning/lessons/l1/complete", {
      body: JSON.stringify({
        currentStepIndex: 999_999,
      }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ saved: true })
    expect(completedCommands).toEqual([
      {
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt,
        userId: learnerIdSchema.parse("user-1"),
      },
    ])
  })

  it("인증된 lesson 진행 요청을 현재 사용자 command로 전달한다", async () => {
    const progressCommands: unknown[] = []
    const app = createApp(
      createDependencies({
        learningService: {
          async completeLesson() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveLessonProgress(command) {
            progressCommands.push(command)
            return { kind: "ok", value: { saved: true } }
          },
          async saveStepAnswer() {
            return { kind: "ok", value: { saved: true } }
          },
        },
      })
    )

    const response = await app.request("/learning/lessons/l1/progress", {
      body: JSON.stringify({ currentStepIndex: 1 }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    expect(progressCommands).toEqual([
      {
        currentStepIndex: 1,
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt,
        userId: learnerIdSchema.parse("user-1"),
      },
    ])
  })

  it("stale lesson 진행 결과를 409 conflict로 응답한다", async () => {
    const app = createApp(
      createDependencies({
        learningService: {
          async completeLesson() {
            return { kind: "ok", value: { saved: true } }
          },
          async saveLessonProgress() {
            return {
              error: {
                currentStepIndex: 2,
                kind: "progress-conflict",
                lessonId: lessonIdSchema.parse("l1"),
                reason: "stale-progress",
                requestedStepIndex: 1,
              },
              kind: "err",
            }
          },
          async saveStepAnswer() {
            return { kind: "ok", value: { saved: true } }
          },
        },
      })
    )

    const response = await app.request("/learning/lessons/l1/progress", {
      body: JSON.stringify({ currentStepIndex: 1 }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "PROGRESS_CONFLICT",
      message: "Lesson progress is stale",
    })
  })
})

function createLearningService(): LearningService {
  return {
    async completeLesson() {
      return { kind: "ok", value: { saved: true } }
    },
    async saveLessonProgress() {
      return { kind: "ok", value: { saved: true } }
    },
    async saveStepAnswer() {
      return { kind: "ok", value: { saved: true } }
    },
  }
}

function createDependencies({
  learningService,
}: {
  readonly learningService: LearningService
}): ApiDependencies {
  return {
    ...createTestDependencies(),
    learningService,
    now: () => occurredAt,
    sessionResolver: {
      async resolveSession(headers) {
        return headers
          .get("Cookie")
          ?.includes("learner_session_token=active-token")
          ? activeSession
          : null
      },
    },
  }
}
