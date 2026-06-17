import { describe, expect, it } from "vitest"
import { readBearerToken } from "@workspace/core/auth"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"
import { learnerIdSchema } from "@workspace/core/learning"
import type { LearningService } from "@workspace/core/learning"

import { createApp, type ApiDependencies } from "@/app"

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
        Authorization: "Bearer active-token",
        "Content-Type": "application/json",
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
        answer: { read: true },
        lessonId: "l1",
        stepId: "l1-s1",
      }),
      headers: {
        Authorization: "Bearer active-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })

  it("잘못된 answer JSON 본문은 invalid_request 400으로 응답한다", async () => {
    const app = createApp(
      createDependencies({
        learningService: createLearningService(),
      })
    )

    const response = await app.request("/learning/answers", {
      body: "{",
      headers: {
        Authorization: "Bearer active-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
    })
  })

  it("인증된 lesson 완료 요청을 learning service로 전달한다", async () => {
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
        currentStepIndex: 2,
      }),
      headers: {
        Authorization: "Bearer active-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ saved: true })
    expect(completedCommands).toEqual([
      {
        currentStepIndex: 2,
        lessonId: lessonIdSchema.parse("l1"),
        occurredAt,
        userId: learnerIdSchema.parse("user-1"),
      },
    ])
  })

  it("잘못된 lesson 완료 JSON 본문은 invalid_request 400으로 응답한다", async () => {
    const app = createApp(
      createDependencies({
        learningService: createLearningService(),
      })
    )

    const response = await app.request("/learning/lessons/l1/complete", {
      body: "{",
      headers: {
        Authorization: "Bearer active-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
      },
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
    learningService,
    now: () => occurredAt,
    profileReader: {
      async readProfileStats() {
        return {
          completedLessons: 0,
          currentStreakDays: 0,
          lastActiveDate: null,
          progressPercent: 0,
          totalLessons: 0,
        }
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        const token = readBearerToken(headers.get("Authorization"))

        return token === "active-token" ? activeSession : null
      },
    },
  }
}
