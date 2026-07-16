import { describe, expect, it } from "vitest"

import type { LearnerAiFeedbackTransitionService } from "@workspace/core/ai-feedback"
import { learnerAiFeedbackTransitionResultSchema } from "@workspace/contracts/learning"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

const now = new Date("2026-07-17T10:00:00.000Z")

describe("학습자 AI 피드백 상태 전이 route", () => {
  it("path scope와 필수 idempotency key를 서비스에 전달한다", async () => {
    const commands: unknown[] = []
    const service: LearnerAiFeedbackTransitionService = {
      async createFeedback(command) {
        commands.push(command)
        return {
          kind: "ok",
          value: learnerAiFeedbackTransitionResultSchema.parse({
            feedback: {
              improvements: ["근거를 보강하세요."],
              nextAction: "예시를 추가하세요.",
              remainingAttempts: 2,
              score: 80,
              scoreRange: [0, 100],
              showScore: true,
              strengths: ["주장이 명확합니다."],
              summary: "좋은 초안입니다.",
            },
            transition: {
              evaluation: null,
              learning: {
                completedSteps: 2,
                currentStepId: "l1-s4",
                currentStepIndex: 3,
                progressPercent: 75,
                status: "in_progress",
                totalSteps: 4,
                version: {
                  curriculumVersionId: "curriculum:c1:1",
                  revision: 1,
                },
              },
              status: "advanced",
            },
          }),
        }
      },
    }
    const app = createApp({
      ...createTestDependencies(),
      learnerAiFeedbackService: service,
      now: () => now,
    })

    const response = await app.request(
      "/learning/lessons/l1/steps/l1-s3/ai-feedback",
      {
        headers: {
          Cookie: "learner_session_token=active-token",
          Origin: "http://localhost:3000",
          "Idempotency-Key": "feedback-request-1",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      feedback: { remainingAttempts: 2 },
      transition: { status: "advanced" },
    })
    expect(commands).toEqual([
      {
        idempotencyKey: "feedback-request-1",
        lessonId: "l1",
        occurredAt: now,
        stepId: "l1-s3",
        userId: "user-1",
      },
    ])
  })

  it("idempotency key가 없으면 provider를 호출하기 전에 400이다", async () => {
    const app = createApp({
      ...createTestDependencies(),
      learnerAiFeedbackService: {
        async createFeedback() {
          throw new Error("Unexpected AI feedback call")
        },
      },
    })

    const response = await app.request(
      "/learning/lessons/l1/steps/l1-s3/ai-feedback",
      {
        headers: {
          Cookie: "learner_session_token=active-token",
          Origin: "http://localhost:3000",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
    })
  })
})
