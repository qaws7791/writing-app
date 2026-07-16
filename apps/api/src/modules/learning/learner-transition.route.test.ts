import { describe, expect, it } from "vitest"

import type { LearnerTransitionService } from "@workspace/core/learning"
import {
  completeLearnerStepResultSchema,
  lessonLearningStateSchema,
} from "@workspace/contracts/learning"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

const occurredAt = new Date("2026-07-17T09:30:00.000Z")
const version = { curriculumVersionId: "curriculum:c1:1", revision: 1 } as const

describe("학습자 서버 권위 상태 전이 route", () => {
  it("레슨 시작 요청을 expected version과 학습자 범위로 전달한다", async () => {
    const commands: unknown[] = []
    const app = createApp(
      createDependencies({
        async completeStep() {
          throw new Error("Unexpected completeStep")
        },
        async startLesson(command) {
          commands.push(command)
          return {
            kind: "ok",
            value: lessonLearningStateSchema.parse({
              completedSteps: 0,
              currentStepId: "l1-s1",
              currentStepIndex: 0,
              progressPercent: 0,
              status: "in_progress",
              totalSteps: 2,
              version,
            }),
          }
        },
      })
    )

    const response = await app.request("/learning/lessons/l1/start", {
      body: JSON.stringify({
        expectedCurriculumVersionId: "curriculum:c1:1",
      }),
      headers: requestHeaders,
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      currentStepId: "l1-s1",
      status: "in_progress",
    })
    expect(commands).toEqual([
      {
        expectedCurriculumVersionId: "curriculum:c1:1",
        lessonId: "l1",
        occurredAt,
        userId: "user-1",
      },
    ])
  })

  it("유효한 오답을 200 retry evaluation으로 반환한다", async () => {
    const app = createApp(
      createDependencies({
        async completeStep() {
          return {
            kind: "ok",
            value: completeLearnerStepResultSchema.parse({
              evaluation: {
                correct: false,
                correctItemIds: ["option-b"],
                explanation: "둘째가 정답입니다.",
                items: [
                  { id: "option-a", verdict: "incorrect" },
                  { id: "option-b", verdict: "missed" },
                ],
                type: "MULTIPLE_CHOICE",
              },
              learning: {
                completedSteps: 0,
                currentStepId: "l1-s1",
                currentStepIndex: 0,
                progressPercent: 0,
                status: "in_progress",
                totalSteps: 2,
                version,
              },
              status: "retry",
            }),
          }
        },
        async startLesson() {
          throw new Error("Unexpected startLesson")
        },
      })
    )

    const response = await app.request(
      "/learning/lessons/l1/steps/l1-s1/complete",
      {
        body: JSON.stringify({
          answer: {
            selectedOptionId: "option-a",
            type: "MULTIPLE_CHOICE",
          },
          kind: "answer",
        }),
        headers: requestHeaders,
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      evaluation: { correct: false },
      status: "retry",
    })
  })

  it("미래 단계 요청을 canonical 409 오류로 변환한다", async () => {
    const app = createApp(
      createDependencies({
        async completeStep(command) {
          return {
            error: {
              kind: "step-sequence-conflict",
              lessonId: command.lessonId,
              stepId: command.stepId,
            },
            kind: "err",
          }
        },
        async startLesson() {
          throw new Error("Unexpected startLesson")
        },
      })
    )

    const response = await app.request(
      "/learning/lessons/l1/steps/l1-s2/complete",
      {
        body: JSON.stringify({ kind: "acknowledge" }),
        headers: requestHeaders,
        method: "POST",
      }
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "STEP_SEQUENCE_CONFLICT",
      message: "현재 학습 순서와 요청한 단계가 다릅니다.",
      requestId: response.headers.get("x-request-id"),
    })
  })
})

const requestHeaders = {
  Cookie: "learner_session_token=active-token",
  "Content-Type": "application/json",
  Origin: "http://localhost:3000",
}

function createDependencies(
  learnerTransitionService: LearnerTransitionService
) {
  return {
    ...createTestDependencies(),
    learnerTransitionService,
    now: () => occurredAt,
  }
}
